import { Panel } from './Panel'
import { Icon } from './Icon'
import { site } from '../config/site'
import { socialIcons } from '../icons/registry'
export function SystemInfo() {
  return (<Panel title="System.Info" hint="profile"><dl className="grid grid-cols-[84px_1fr] gap-y-2.5 text-xs">
    {site.info.map(([k,v])=>(<div key={k} className="contents"><dt className="text-dim">{k}</dt><dd className={k==='Status'?'text-emerald':''}>{v}</dd></div>))}</dl></Panel>)
}
const Mail = () => <svg viewBox="0 0 24 24" width="34" height="34" aria-label="Email"><rect x="2" y="5" width="20" height="14" rx="2.5" fill="#f472b6"/><path d="M3 7l9 6 9-6" stroke="#050914" strokeWidth="1.6" fill="none"/></svg>
export function Connect() {
  return (<Panel title="Connect" hint="links" dot="violet"><div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-4">
    {Object.entries(site.links).map(([id,l])=>{
      const body=(<><span className="h-9 grid place-items-center">{id==='email'?<Mail/>:<Icon spec={socialIcons[id]}/>}</span><span className="text-[11px]">{l.label}</span></>)
      const cls='flex flex-col items-center gap-1.5 rounded-lg bg-edge/30 py-3'
      return l.url ? <a key={id} href={l.url} target="_blank" rel="noreferrer" className={`${cls} hover:bg-edge/60`}>{body}</a>
        : <span key={id} title="URL not configured in src/config/site.ts" className={`${cls} opacity-50`}>{body}</span>})}
  </div></Panel>)
}
