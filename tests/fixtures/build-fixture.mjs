// Writes a SYNTHETIC github.json + snake SVGs into <outdir> for the browser test. Invented numbers; used only via request interception, never copied to public/data.
import { mkdirSync, writeFileSync } from 'node:fs'; import { join } from 'node:path'
import { normalizeProfile, aggregateLanguages, buildDocument } from '../../scripts/lib/github-data.mjs'
import { renderSnake } from '../../scripts/lib/snake.mjs'
import { syntheticCalendar } from './make.mjs'
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const weeks = syntheticCalendar('2025-11-02', 53, (i) => ((i * 7919) % 11 < 4 ? (i * 31) % 6 : 0))
const total = weeks.flatMap((w) => w.contributionDays).reduce((a, d) => a + d.contributionCount, 0)
const profile = normalizeProfile({ login: 'tanishabanga', followers: { totalCount: 11 }, following: { totalCount: 0 }, repositories: { totalCount: 9 }, contributionsCollection: { contributionCalendar: { totalContributions: total, weeks } } }, 'tanishabanga')
const languages = aggregateLanguages([{ Python: 4000, JavaScript: 2500, HTML: 900, CSS: 500, 'Jupyter Notebook': 300, Shell: 100 }])
writeFileSync(join(out, 'github.json'), JSON.stringify(buildDocument({ login: 'tanishabanga', profile, languages, repoSummary: { reposListed: 9, reposCounted: 6 }, generatedAt: '2026-01-01T00:00:00.000Z' })))
for (const [f, animate] of [['snake.svg', true], ['snake-static.svg', false]]) writeFileSync(join(out, f), renderSnake({ days: profile.calendar.days, username: 'tanishabanga', total, animate }))
console.log(JSON.stringify({ total, zeroFollowing: true }))
