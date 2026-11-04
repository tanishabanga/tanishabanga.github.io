import test from 'node:test'; import assert from 'node:assert/strict'
import { normalizeProfile, selectRepos, aggregateLanguages, roundPercents, stableDocument, buildDocument } from '../../scripts/lib/github-data.mjs'
import { syntheticUser, repo } from '../fixtures/make.mjs'

test('profile: username, counts, contribution total and zero-vs-null', () => {
  const p = normalizeProfile(syntheticUser(), 'tanishabanga')
  assert.equal(p.stats.followers, 7); assert.equal(p.stats.following, 3); assert.equal(p.stats.repositories, 4)
  assert.equal(p.stats.contributions, p.calendar.days.reduce((a, d) => a + d.count, 0))
  const z = normalizeProfile(syntheticUser('tanishabanga', { followers: { totalCount: 0 } }), 'tanishabanga'); assert.equal(z.stats.followers, 0)
  const m = normalizeProfile(syntheticUser('tanishabanga', { followers: undefined }), 'tanishabanga'); assert.equal(m.stats.followers, null)
})
test('profile: username is case-insensitive but must match; missing user throws', () => {
  assert.doesNotThrow(() => normalizeProfile(syntheticUser('TanishaBanga'), 'tanishabanga'))
  assert.throws(() => normalizeProfile(null, 'tanishabanga')); assert.throws(() => normalizeProfile(syntheticUser('someone-else'), 'tanishabanga'))
})
test('calendar: dates preserved, ascending, levels mapped, total must equal sum of days', () => {
  const p = normalizeProfile(syntheticUser(), 'tanishabanga'); assert.equal(p.calendar.days.length, 28)
  assert.equal(p.calendar.from, '2025-11-02'); assert.equal(p.calendar.to, '2025-11-29')
  assert.ok(p.calendar.days.every((d, i, a) => i === 0 || d.date > a[i - 1].date)); assert.ok(p.calendar.days.every((d) => d.level >= 0 && d.level <= 4))
  const u = syntheticUser(); u.contributionsCollection.contributionCalendar.totalContributions += 1; assert.throws(() => normalizeProfile(u, 'tanishabanga'), /does not equal/)
  const bad = syntheticUser(); bad.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionLevel = 'WAT'; assert.throws(() => normalizeProfile(bad, 'tanishabanga'))
})
test('calendar: no calendar -> contributions null (unavailable), not 0', () => {
  const p = normalizeProfile(syntheticUser('tanishabanga', { contributionsCollection: undefined }), 'tanishabanga')
  assert.equal(p.stats.contributions, null); assert.equal(p.calendar.status, 'unavailable'); assert.deepEqual(p.calendar.days, [])
})
test('repos: forks, archived, private and foreign-owned are excluded', () => {
  const { kept, excluded } = selectRepos([repo('a'), repo('b', { fork: true }), repo('c', { archived: true }), repo('d', { private: true }), repo('e', { owner: { login: 'x' } }), repo('f')], undefined, 'tanishabanga')
  assert.deepEqual(kept.map((r) => r.name), ['a', 'f']); assert.deepEqual(excluded, { fork: 1, archived: 1, private: 1, notOwned: 1 })
})
test('languages: bytes aggregated across repos (not repo counts), sorted desc', () => {
  const r = aggregateLanguages([{ Python: 600, HTML: 100 }, { Python: 300, CSS: 50 }, { HTML: 2000 }])
  assert.deepEqual(r.items.map((i) => [i.name, i.bytes]), [['HTML', 2100], ['Python', 900], ['CSS', 50]]); assert.equal(r.totalBytes, 3050)
  // Python is in 2 repos, HTML in 2 repos; a repo-count ranking would not put HTML first by this margin
  assert.equal(r.items[0].percent, 68.9); assert.equal(r.items[1].percent, 29.5)
})
test('languages: top four plus Other, percentages sum to exactly 100', () => {
  const r = aggregateLanguages([{ A: 500, B: 300, C: 100, D: 50, E: 30, F: 20 }])
  assert.deepEqual(r.items.map((i) => i.name), ['A', 'B', 'C', 'D', 'Other']); assert.equal(r.items[4].bytes, 50); assert.equal(r.languageCount, 6)
  assert.equal(Math.round(r.items.reduce((a, i) => a + i.percent, 0) * 10) / 10, 100)
  assert.equal(aggregateLanguages([{ A: 1, B: 1, C: 1 }]).items.some((i) => i.name === 'Other'), false)
})
test('languages: roundPercents sums to 100.0 on awkward splits', () => {
  for (const parts of [[1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [333, 333, 334], [5, 3, 2]]) assert.equal(Math.round(roundPercents(parts).reduce((a, b) => a + b, 0) * 10) / 10, 100)
})
test('languages: empty / junk input gives an empty result, never NaN', () => {
  for (const input of [[], [{}], [null], [{ Python: 0 }, { X: -5, Y: NaN }]]) { const r = aggregateLanguages(input); assert.deepEqual(r, { totalBytes: 0, languageCount: 0, items: [] }) }
})
test('languages: colours known / fallback; excludeLanguages policy honoured', () => {
  const r = aggregateLanguages([{ Python: 10, Zzz: 5 }]); assert.equal(r.items[0].color, '#3572A5'); assert.equal(r.items[1].color, '#8b949e')
  assert.deepEqual(aggregateLanguages([{ 'Jupyter Notebook': 99, Python: 1 }], { topN: 4, excludeLanguages: ['Jupyter Notebook'] }).items.map((i) => i.name), ['Python'])
})
test('stableDocument keeps the old timestamp when only the timestamp would change (no pointless commits)', () => {
  const prof = normalizeProfile(syntheticUser(), 'tanishabanga'), langs = aggregateLanguages([{ Python: 1 }])
  const mk = (t) => buildDocument({ login: 'tanishabanga', profile: prof, languages: langs, repoSummary: {}, generatedAt: t })
  assert.equal(stableDocument(mk('2026-02-01T00:00:00Z'), mk('2026-01-01T00:00:00Z')).generatedAt, '2026-01-01T00:00:00Z')
  const changed = structuredClone(mk('2026-02-01T00:00:00Z')); changed.stats.followers = 99; assert.equal(stableDocument(changed, mk('2026-01-01T00:00:00Z')).generatedAt, '2026-02-01T00:00:00Z')
})
