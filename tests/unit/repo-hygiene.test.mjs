// Repository-level guards: configuration, workflow shape and "no secrets committed". Static checks only.
import test from 'node:test'; import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'; import { join, relative } from 'node:path'
import { DEFAULT_USERNAME } from '../../scripts/lib/config.mjs'; import { findSecrets } from '../../scripts/lib/redact.mjs'
const ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
function walk(dir, out = []) { for (const n of readdirSync(dir)) { if (['node_modules', 'dist', '.git'].includes(n)) continue; const p = join(dir, n), s = statSync(p); s.isDirectory() ? walk(p, out) : out.push(p) } return out }
const TEXT = /\.(ts|tsx|mjs|js|json|md|yml|yaml|svg|html|css|py|txt|example|gitignore)$|\.env\.example$|\.gitignore$/

test('config: scripts username equals src/config/site.ts', () => { assert.match(read('src/config/site.ts'), new RegExp(`const username = '${DEFAULT_USERNAME}'`)) })
test('email: corrected address used, the previous wrong one appears nowhere (except this test)', () => {
  assert.match(read('src/config/site.ts'), /mailto:tanishabanga1107@gmail\.com/)
  const wrong = ['tanishabanga', '0108', '@gmail.com'].join('')
  const hits = walk(ROOT).filter((f) => !/package-lock\.json$|unit[\\/]repo-hygiene/.test(f) && TEXT.test(f)).filter((f) => readFileSync(f, 'utf8').includes(wrong)); assert.deepEqual(hits.map((f) => relative(ROOT, f)), [])
})
test('no credentials committed: no token patterns in any text file or generated asset', () => {
  const bad = []; for (const f of walk(ROOT)) { if (!TEXT.test(f) || /package-lock\.json$|unit[\\/](repo-hygiene|pipeline|github-data)/.test(f)) continue; const hits = findSecrets(readFileSync(f, 'utf8')).filter((h) => !/authorization/i.test(h)); if (hits.length) bad.push(relative(ROOT, f)) }
  assert.deepEqual(bad, [])
})
test('.env is git-ignored and .env.example holds no values', () => {
  assert.match(read('.gitignore'), /^\.env$/m); for (const l of read('.env.example').split('\n').filter((x) => x && !x.startsWith('#'))) assert.match(l, /^[A-Z_]+=$/, l)
})
test('generated data (if present) has no token, no Authorization text', () => { for (const f of ['public/data/github.json', 'public/data/snake.svg', 'public/data/snake-static.svg']) if (existsSync(join(ROOT, f))) assert.deepEqual(findSecrets(read(f)), [], f) })
test('workflow: schedule + manual trigger, least privilege, built-in token, no hard-coded secrets, conditional commit', () => {
  const y = read('.github/workflows/update-dashboard.yml'); const live = y.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n')
  assert.match(live, /schedule:\s*\n\s*- cron:/); assert.match(live, /workflow_dispatch:/); assert.match(live, /^permissions: \{\}/m); assert.match(live, /contents: write/)
  assert.ok(!/(issues|pull-requests|actions|packages|id-token|checks|deployments):\s*write/.test(live)); assert.match(live, /secrets\.GITHUB_TOKEN/); assert.ok(!/secrets\.GH_STATS_TOKEN/.test(live), 'optional PAT must stay commented out by default')
  assert.match(live, /git diff --cached --quiet/); assert.ok(!/\t/.test(y), 'YAML must not contain tabs'); assert.deepEqual(findSecrets(y), [])
})
test('scripts never print the token or headers', () => {
  for (const f of ['scripts/fetch-github-data.mjs', 'scripts/lib/github-api.mjs', 'scripts/generate-snake.mjs']) for (const l of read(f).split('\n')) if (/console\.(log|error|warn)/.test(l)) assert.ok(!/token|headers|Authorization/i.test(l.replace(/redact\([^)]*\)/g, '')), `${f}: ${l.trim().slice(0, 80)}`)
})
