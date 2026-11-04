// Pure data logic (no I/O): everything here is unit-tested without network access.
import { LANGUAGE_POLICY, LANGUAGE_COLORS, FALLBACK_COLOR, OTHER_COLOR, SCHEMA_VERSION } from './config.mjs'

export const PROFILE_QUERY = `query($login: String!) { user(login: $login) {
  login followers { totalCount } following { totalCount }
  repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
  contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }
const isCount = (n) => Number.isInteger(n) && n >= 0

/** GraphQL user -> { stats, calendar }. Missing/invalid values become null (unavailable), never 0. */
export function normalizeProfile(user, login) {
  if (!user || user.login?.toLowerCase() !== login.toLowerCase()) throw new Error(`GitHub returned no profile for "${login}"`)
  const cal = user.contributionsCollection?.contributionCalendar
  const days = []
  for (const w of cal?.weeks ?? []) for (const d of w.contributionDays ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !isCount(d.contributionCount)) throw new Error(`Invalid contribution day: ${JSON.stringify(d)}`)
    if (!(d.contributionLevel in LEVELS)) throw new Error(`Unknown contribution level: ${d.contributionLevel}`)
    days.push({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] })
  }
  for (let i = 1; i < days.length; i++) if (days[i].date <= days[i - 1].date) throw new Error('Contribution days are not in strictly ascending date order')
  const sum = days.reduce((a, d) => a + d.count, 0)
  if (cal && cal.totalContributions !== sum) throw new Error(`Calendar total ${cal.totalContributions} does not equal the sum of its days (${sum})`)
  const n = (v) => (isCount(v) ? v : null)
  return {
    stats: { contributions: cal ? n(cal.totalContributions) : null, repositories: n(user.repositories?.totalCount), followers: n(user.followers?.totalCount), following: n(user.following?.totalCount) },
    calendar: { status: days.length ? 'ok' : 'unavailable', from: days[0]?.date ?? null, to: days.at(-1)?.date ?? null, days },
  }
}

/** Repo inclusion policy. Returns the qualifying repos and per-reason exclusion counts. */
export function selectRepos(repos, policy = LANGUAGE_POLICY, login) {
  const kept = []; const excluded = { fork: 0, archived: 0, private: 0, notOwned: 0 }
  for (const r of repos) {
    if (r.private || (policy.visibility === 'public' && r.visibility && r.visibility !== 'public')) excluded.private++
    else if (login && r.owner?.login?.toLowerCase() !== login.toLowerCase()) excluded.notOwned++
    else if (!policy.includeForks && r.fork) excluded.fork++
    else if (!policy.includeArchived && r.archived) excluded.archived++
    else kept.push(r)
  }
  return { kept, excluded }
}

/** Largest-remainder rounding to 0.1 so displayed percentages always sum to exactly 100.0. */
export function roundPercents(parts) {
  const total = parts.reduce((a, b) => a + b, 0); if (total <= 0) return parts.map(() => 0)
  const raw = parts.map((p) => (p / total) * 1000), floor = raw.map(Math.floor)
  let left = 1000 - floor.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => [v - floor[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (let k = 0; k < left; k++) floor[order[k][1]]++
  return floor.map((v) => v / 10)
}

/** maps: array of { 'Python': bytes, ... } (one per qualifying repo) -> sorted list with top-N + Other. */
export function aggregateLanguages(maps, policy = LANGUAGE_POLICY) {
  const totals = new Map(); const skip = new Set(policy.excludeLanguages)
  for (const m of maps) for (const [name, bytes] of Object.entries(m ?? {})) {
    if (skip.has(name) || !Number.isFinite(bytes) || bytes <= 0) continue
    totals.set(name, (totals.get(name) ?? 0) + bytes)
  }
  const sorted = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const totalBytes = sorted.reduce((a, [, b]) => a + b, 0)
  if (!totalBytes) return { totalBytes: 0, languageCount: 0, items: [] }
  let rows = sorted.map(([name, bytes]) => ({ name, bytes, color: LANGUAGE_COLORS[name] ?? FALLBACK_COLOR }))
  if (rows.length > policy.topN) {
    const rest = rows.slice(policy.topN)
    rows = [...rows.slice(0, policy.topN), { name: 'Other', bytes: rest.reduce((a, r) => a + r.bytes, 0), color: OTHER_COLOR }]
  }
  const pct = roundPercents(rows.map((r) => r.bytes))
  return { totalBytes, languageCount: sorted.length, items: rows.map((r, i) => ({ ...r, percent: pct[i] })) }
}

export function buildDocument({ login, profile, languages, repoSummary, generatedAt }) {
  return {
    schemaVersion: SCHEMA_VERSION, status: 'ok', username: login, generatedAt,
    stats: profile.stats,
    contributionWindow: { from: profile.calendar.from, to: profile.calendar.to, description: 'Last 12 months from the GitHub contribution calendar (what github.com shows for this account to the token used; private contributions appear only if enabled on the profile).' },
    languages: { status: languages.items.length ? 'ok' : 'empty', basis: 'bytes', policy: 'public, non-fork, non-archived repositories owned by the user', ...repoSummary, ...languages },
    calendar: profile.calendar,
  }
}

/** Keep the old timestamp when nothing but the timestamp would change -> no pointless commits. */
export function stableDocument(next, previous) {
  if (previous && JSON.stringify({ ...previous, generatedAt: 0 }) === JSON.stringify({ ...next, generatedAt: 0 })) return { ...next, generatedAt: previous.generatedAt }
  return next
}
