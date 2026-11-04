#!/usr/bin/env node
// Fetches live GitHub data and writes public/data/github.json. Credentials come ONLY from the environment.
// On any failure it exits non-zero and leaves the previous file untouched -- it never writes guessed values.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient } from './lib/github-api.mjs'
import { DEFAULT_USERNAME, OUTPUT_DIR, JSON_FILE, LANGUAGE_POLICY } from './lib/config.mjs'
import { PROFILE_QUERY, normalizeProfile, selectRepos, aggregateLanguages, buildDocument, stableDocument } from './lib/github-data.mjs'
import { redact, findSecrets } from './lib/redact.mjs'

export async function collect({ client, login, now = new Date(), log = () => {} }) {
  const { user } = await client.graphql(PROFILE_QUERY, { login })
  const profile = normalizeProfile(user, login)
  const repos = []
  for (let page = 1; page <= 20; page++) { // REST: owned repos, 100 per page
    const batch = await client.rest(`/users/${login}/repos?type=owner&per_page=100&page=${page}`)
    repos.push(...batch); if (batch.length < 100) break
  }
  const { kept, excluded } = selectRepos(repos, LANGUAGE_POLICY, login)
  if (profile.stats.repositories !== null && profile.stats.repositories !== repos.filter((r) => !r.private).length) log(`warning: GraphQL public repo count (${profile.stats.repositories}) differs from REST list (${repos.filter((r) => !r.private).length})`)
  const maps = []
  for (const r of kept) maps.push(await client.rest(`/repos/${r.owner.login}/${r.name}/languages`)) // any failure aborts the run
  const languages = aggregateLanguages(maps, LANGUAGE_POLICY)
  const repoSummary = { reposListed: repos.length, reposCounted: kept.length, reposExcluded: excluded }
  return buildDocument({ login, profile, languages, repoSummary, generatedAt: now.toISOString() })
}

async function main() {
  const token = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN // GH_STATS_TOKEN: optional fallback, see README
  const login = process.env.GITHUB_USERNAME || DEFAULT_USERNAME
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(login)) throw new Error('GITHUB_USERNAME is not a valid GitHub login')
  const client = createClient({ token })
  const file = join(OUTPUT_DIR, JSON_FILE)
  let previous = null; try { previous = JSON.parse(await readFile(file, 'utf8')); if (previous.status !== 'ok') previous = null } catch { /* first run */ }
  const doc = stableDocument(await collect({ client, login, log: (m) => console.log(redact(m, [token])) }), previous)
  const text = JSON.stringify(doc, null, 1) + '\n'
  const leaks = findSecrets(text); if (leaks.length || text.includes(token)) throw new Error('Refusing to write output: it looks like it contains a credential')
  await mkdir(OUTPUT_DIR, { recursive: true }); await writeFile(file, text)
  const { stats } = doc
  console.log(`github.json written for @${login}: ${stats.contributions} contributions (12 mo), ${stats.repositories} repos, ${stats.followers} followers, ${stats.following} following, ${doc.languages.items.map((l) => `${l.name} ${l.percent}%`).join(', ') || 'no language data'}`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error('fetch-github-data FAILED:', redact(e.message, [process.env.GITHUB_TOKEN, process.env.GH_STATS_TOKEN])); process.exit(1) })
