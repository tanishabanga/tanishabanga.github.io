import type { ReactNode } from 'react'
import { Panel } from './Panel'
import { site } from '../config/site'
import { useGithubData, useReducedMotion, DATA_BASE, type Loaded } from '../data/useGithubData'
import { formatCount, formatUpdated, percentLabel } from '../data/schema'

const Note = ({ children, kind }: { children: ReactNode; kind: string }) => <p data-state={kind} className="py-6 text-center text-[11px] text-dim">{children}</p>
function stateNote(s: Loaded): ReactNode | null {
  if (s.kind === 'loading') return <Note kind="loading">loading GitHub data…</Note>
  if (s.kind === 'not-generated') return <Note kind="empty">no live data generated yet<br />run the “Update dashboard data” workflow</Note>
  if (s.kind === 'error') return <Note kind="error">couldn’t load GitHub data<br /><span className="opacity-70">{s.message}</span></Note>
  return null
}
const updated = (s: Loaded) => (s.kind === 'ok' ? `updated ${formatUpdated(s.data.generatedAt)}` : undefined)
const LABELS = [['contributions', 'Contributions'], ['repositories', 'Repositories'], ['followers', 'Followers'], ['following', 'Following']] as const

export function Stats() {
  const s = useGithubData(), note = stateNote(s)
  return (<Panel title="GitHub Stats" dot="violet" hint={updated(s)}>
    {note ?? (s.kind === 'ok' && <>
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 text-center sm:grid-cols-4 md:grid-cols-2">
        {LABELS.map(([k, l]) => { const v = s.data.stats[k]; return (<div key={k} data-stat={k}>
          <div className={`text-xl ${v === null ? 'text-dim' : ''}`} title={v === null ? 'unavailable' : undefined}>{formatCount(v)}</div><div className="text-[10px] text-dim">{l}{k === 'contributions' ? ' (12 mo)' : ''}</div></div>) })}
      </div>
      <p className="mt-3 text-center text-[10px] text-dim">public repos only · contributions = last 12 months</p></>)}
  </Panel>)
}

export function Languages() {
  const s = useGithubData(), note = stateNote(s)
  return (<Panel title="Top Languages" hint={s.kind === 'ok' ? 'by code size' : undefined}>
    {note ?? (s.kind === 'ok' && (s.data.languages.items.length === 0
      ? <Note kind="empty">no language data in public, non-fork, non-archived repositories</Note>
      : <><ul className="flex flex-col gap-2.5 text-[11px]">{s.data.languages.items.map((l) => (
        <li key={l.name} data-lang={l.name} className="grid grid-cols-[minmax(0,5.5rem)_1fr_3rem] items-center gap-2">
          <span className="flex min-w-0 items-center gap-1.5"><i className="size-2 shrink-0 rounded-full" style={{ background: l.color }} /><span className="truncate">{l.name}</span></span>
          <span role="progressbar" aria-label={l.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={l.percent} className="h-1.5 overflow-hidden rounded-full bg-edge/60"><span className="block h-full rounded-full" style={{ width: `${l.percent}%`, background: l.color }} /></span>
          <span className="text-right tabular-nums text-dim">{percentLabel(l.percent)}</span></li>))}</ul>
        <p className="mt-3 text-[10px] text-dim">{s.data.languages.reposCounted} public repos · forks &amp; archived excluded</p></>))}
  </Panel>)
}

export function Snake() {
  const s = useGithubData(), reduced = useReducedMotion(), note = stateNote(s)
  const ok = s.kind === 'ok' ? s.data : null
  return (<Panel title="Contribution Snake" dot="emerald" hint={ok ? `@${ok.username}` : undefined}>
    {note ?? (ok && (ok.calendar.status !== 'ok'
      ? <Note kind="empty">no contribution history available</Note>
      : <><img data-snake src={`${DATA_BASE}${reduced ? 'snake-static.svg' : 'snake.svg'}?v=${encodeURIComponent(ok.generatedAt)}`} alt={`Contribution calendar of @${site.githubUsername}, ${ok.calendar.from} to ${ok.calendar.to}`} className="block h-auto w-full" />
        <p className="mt-2 text-[10px] text-dim">{ok.calendar.from} → {ok.calendar.to} · {formatCount(ok.stats.contributions)} contributions</p></>))}
  </Panel>)
}
