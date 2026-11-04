// Types + runtime validation for public/data/github.json. No imports on purpose: this file is unit-tested directly by Node (tests/unit/schema.test.mjs).
export type Stats = { contributions: number | null; repositories: number | null; followers: number | null; following: number | null }
export type LanguageItem = { name: string; bytes: number; percent: number; color: string }
export type CalendarDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }
export type GithubData = {
  username: string; generatedAt: string; stats: Stats
  contributionWindow: { from: string | null; to: string | null; description: string }
  languages: { status: 'ok' | 'empty'; totalBytes: number; items: LanguageItem[]; reposCounted: number }
  calendar: { status: 'ok' | 'unavailable'; from: string | null; to: string | null; days: CalendarDay[] }
}
export type ParseResult = { kind: 'ok'; data: GithubData } | { kind: 'not-generated' } | { kind: 'error'; message: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const countOrNull = (v: unknown) => (v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0) ? (v as number | null) : undefined)
const HEX = /^#[0-9a-fA-F]{6}$/

export function parseGithubData(raw: unknown): ParseResult {
  if (!isObj(raw)) return { kind: 'error', message: 'github.json is not an object' }
  if (raw.schemaVersion !== 1) return { kind: 'error', message: `unsupported schemaVersion ${String(raw.schemaVersion)}` }
  if (raw.status === 'not-generated') return { kind: 'not-generated' }
  if (raw.status !== 'ok') return { kind: 'error', message: `unexpected status ${String(raw.status)}` }
  const { stats, languages, calendar, username, generatedAt, contributionWindow } = raw as Record<string, unknown>
  if (typeof username !== 'string' || typeof generatedAt !== 'string' || Number.isNaN(Date.parse(generatedAt))) return { kind: 'error', message: 'missing username/generatedAt' }
  if (!isObj(stats) || !isObj(languages) || !isObj(calendar) || !isObj(contributionWindow)) return { kind: 'error', message: 'missing stats/languages/calendar sections' }
  const s: Stats = { contributions: countOrNull(stats.contributions) as number | null, repositories: countOrNull(stats.repositories) as number | null, followers: countOrNull(stats.followers) as number | null, following: countOrNull(stats.following) as number | null }
  for (const k of Object.keys(s) as (keyof Stats)[]) if (countOrNull(stats[k]) === undefined) return { kind: 'error', message: `stats.${k} must be a non-negative integer or null` }
  const items = languages.items, days = calendar.days
  if (!Array.isArray(items) || !Array.isArray(days)) return { kind: 'error', message: 'languages.items / calendar.days must be arrays' }
  for (const i of items) if (!isObj(i) || typeof i.name !== 'string' || typeof i.percent !== 'number' || i.percent < 0 || i.percent > 100 || typeof i.bytes !== 'number' || typeof i.color !== 'string' || !HEX.test(i.color)) return { kind: 'error', message: 'invalid language item' }
  for (const d of days) if (!isObj(d) || typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || typeof d.count !== 'number' || d.count < 0 || ![0, 1, 2, 3, 4].includes(d.level as number)) return { kind: 'error', message: 'invalid calendar day' }
  return { kind: 'ok', data: {
    username, generatedAt, stats: s,
    contributionWindow: { from: (contributionWindow.from as string | null) ?? null, to: (contributionWindow.to as string | null) ?? null, description: String(contributionWindow.description ?? '') },
    languages: { status: languages.status === 'ok' ? 'ok' : 'empty', totalBytes: Number(languages.totalBytes) || 0, reposCounted: Number(languages.reposCounted) || 0, items: items as LanguageItem[] },
    calendar: { status: calendar.status === 'ok' && days.length ? 'ok' : 'unavailable', from: (calendar.from as string | null) ?? null, to: (calendar.to as string | null) ?? null, days: days as CalendarDay[] },
  } }
}

/** null = unavailable (shown as an em dash), 0 = a real zero. */
export const formatCount = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-US'))
export const formatUpdated = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
export const percentLabel = (p: number) => `${p.toFixed(1)}%`
