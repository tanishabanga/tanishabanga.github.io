import test from 'node:test'; import assert from 'node:assert/strict'
import { layoutCells, snakePath, renderSnake } from '../../scripts/lib/snake.mjs'
import { normalizeProfile } from '../../scripts/lib/github-data.mjs'
import { syntheticUser, syntheticCalendar } from '../fixtures/make.mjs'
import { findSecrets } from '../../scripts/lib/redact.mjs'
import { DOMParser } from '@xmldom/xmldom'
const days = (start = '2025-11-02', weeks = 4) => normalizeProfile(syntheticUser('tanishabanga', { contributionsCollection: { contributionCalendar: { totalContributions: syntheticCalendar(start, weeks).flatMap((w) => w.contributionDays).reduce((a, d) => a + d.contributionCount, 0), weeks: syntheticCalendar(start, weeks) } } }), 'tanishabanga').calendar.days

test('calendar mapping: Sunday-start weeks, row = weekday, column = week, every day exactly once', () => {
  const d = days(), { cells, cols } = layoutCells(d)
  assert.equal(cols, 4); assert.equal(cells.length, d.length)
  for (const c of cells) { assert.equal(c.row, new Date(c.date + 'T00:00:00Z').getUTCDay()); assert.equal(c.col, Math.floor(d.findIndex((x) => x.date === c.date) / 7)) }
  assert.equal(new Set(cells.map((c) => `${c.col},${c.row}`)).size, cells.length)
})
test('calendar mapping: window starting mid-week (as GitHub returns it) is aligned to Sunday columns', () => {
  const d = days('2025-11-05', 3).slice(0, 18) // starts on a Wednesday, ends mid-week
  const { cells } = layoutCells(d); assert.equal(cells[0].col, 0); assert.equal(cells[0].row, 3); assert.equal(cells[4].col, 1) // Sunday after the first Wednesday begins column 1
  assert.equal(cells.at(-1).row, new Date(d.at(-1).date + 'T00:00:00Z').getUTCDay())
})
test('snake path: serpentine, visits each cell once, consecutive cells are grid-adjacent', () => {
  const { cells } = layoutCells(days()), p = snakePath(cells); assert.equal(p.length, cells.length); assert.equal(new Set(p.map((c) => c.date)).size, cells.length)
  for (let i = 1; i < p.length; i++) assert.ok(Math.abs(p[i].col - p[i - 1].col) + Math.abs(p[i].row - p[i - 1].row) === 1, `non-adjacent step at ${i}`)
})
test('svg: one rect per day with true date/count/level; only contribution days get an eat animation', () => {
  const d = days(), svg = renderSnake({ days: d, username: 'tanishabanga' })
  for (const day of d) assert.ok(svg.includes(`data-date="${day.date}" data-count="${day.count}" data-level="${day.level}"`), day.date)
  assert.equal((svg.match(/data-date=/g) || []).length, d.length)
  assert.equal((svg.match(/attributeName="fill"/g) || []).length, d.filter((x) => x.count > 0).length)
})
test('svg: well-formed XML, escapes the username, static variant has no animation, no randomness (deterministic)', () => {
  const d = days(), a = renderSnake({ days: d, username: 'tanishabanga' }); assert.equal(a, renderSnake({ days: d, username: 'tanishabanga' }))
  const st = renderSnake({ days: d, username: 'a<b&"c', animate: false }); assert.ok(!st.includes('<animate')); assert.ok(st.includes('a&lt;b&amp;&quot;c'))
  for (const s of [a, st]) {
    const errors = []
    const doc = new DOMParser({
      onError(level, message) {
        if (level === 'error' || level === 'fatalError') errors.push(String(message))
      },
    }).parseFromString(s, 'image/svg+xml')
    assert.equal(errors.length, 0, errors.join('; '))
    assert.ok(doc && doc.documentElement && doc.documentElement.tagName.toLowerCase() === 'svg')
  }
})
test('svg: SMIL keyTimes start at 0 and end at 1 for linear motion; fill keyTimes strictly increasing', () => {
  const svg = renderSnake({ days: days(), username: 'u' })
  for (const m of svg.matchAll(/attributeName="[xy]"[^>]*keyTimes="([^"]+)"/g)) { const k = m[1].split(';').map(Number); assert.equal(k[0], 0); assert.equal(k.at(-1), 1); assert.ok(k.every((v, i) => i === 0 || v >= k[i - 1])) }
  for (const m of svg.matchAll(/attributeName="fill"[^>]*keyTimes="0;([^"]+)"/g)) assert.ok(Number(m[1]) > 0 && Number(m[1]) < 1)
})
test('svg: empty history is refused (no decorative fake calendar); no credential-like text', () => {
  assert.throws(() => renderSnake({ days: [], username: 'u' }), /No contribution days/); assert.deepEqual(findSecrets(renderSnake({ days: days(), username: 'u' })), [])
})
