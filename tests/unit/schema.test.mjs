// Imports the TypeScript source directly (Node 22 type stripping) -- the same file the dashboard ships.
import test from 'node:test'; import assert from 'node:assert/strict'
import { parseGithubData, formatCount, percentLabel, formatUpdated } from '../../src/data/schema.ts'
const good = () => ({ schemaVersion: 1, status: 'ok', username: 'tanishabanga', generatedAt: '2026-03-01T10:20:30.000Z', stats: { contributions: 12, repositories: 0, followers: null, following: 3 },
  contributionWindow: { from: '2025-11-02', to: '2025-11-03', description: 'x' }, languages: { status: 'ok', totalBytes: 10, reposCounted: 1, items: [{ name: 'Python', bytes: 10, percent: 100, color: '#3572A5' }] },
  calendar: { status: 'ok', from: '2025-11-02', to: '2025-11-03', days: [{ date: '2025-11-02', count: 0, level: 0 }, { date: '2025-11-03', count: 12, level: 4 }] } })
test('placeholder file parses as not-generated (distinct from error)', () => { assert.equal(parseGithubData({ schemaVersion: 1, status: 'not-generated' }).kind, 'not-generated') })
test('valid document parses; zero stays 0 and unavailable stays null', () => { const r = parseGithubData(good()); assert.equal(r.kind, 'ok'); assert.equal(r.data.stats.repositories, 0); assert.equal(r.data.stats.followers, null) })
test('formatting: null -> em dash, 0 -> "0", thousands separators', () => { assert.equal(formatCount(null), '—'); assert.equal(formatCount(0), '0'); assert.equal(formatCount(1234), '1,234'); assert.equal(percentLabel(40.1), '40.1%'); assert.equal(formatUpdated('2026-03-01T10:20:30.000Z'), '2026-03-01 10:20 UTC') })
test('malformed documents are errors, never silently accepted', () => {
  const bad = [null, [], { schemaVersion: 2 }, { schemaVersion: 1, status: 'weird' }, (() => { const g = good(); g.stats.followers = -1; return g })(), (() => { const g = good(); g.stats.followers = 1.5; return g })(),
    (() => { const g = good(); g.languages.items[0].color = 'red'; return g })(), (() => { const g = good(); g.calendar.days[0].level = 9; return g })(), (() => { const g = good(); delete g.stats; return g })(), (() => { const g = good(); g.generatedAt = 'nope'; return g })()]
  for (const b of bad) assert.equal(parseGithubData(b).kind, 'error', JSON.stringify(b)?.slice(0, 60))
})
test('empty calendar -> unavailable section, empty languages allowed', () => { const g = good(); g.calendar.days = []; g.languages.items = []; g.languages.status = 'empty'; const r = parseGithubData(g); assert.equal(r.data.calendar.status, 'unavailable'); assert.equal(r.data.languages.status, 'empty') })
