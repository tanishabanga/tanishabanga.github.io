import { site } from '../config/site'
export function Header() {
  return (<div className="flex items-center gap-3 rounded-xl border border-edge bg-panel/90 px-4 py-2.5 text-xs">
    <span className="flex gap-2">{['#ff5f57','#febc2e','#28c840'].map(c=><i key={c} className="size-3 rounded-full" style={{background:c}}/>)}</span>
    <span className="ml-2 min-w-0 truncate">{site.terminalTitle}</span>
    <span className="mx-auto hidden sm:block text-dim">{site.tagline}</span>
    <span className="ml-auto sm:ml-0 flex shrink-0 items-center gap-2"><b className="text-live font-medium">LIVE</b>
      <i className="h-4 w-10 rounded-full bg-cyan/90 relative"><i className="absolute right-1 top-1 size-2 rounded-full bg-bg" style={{animation:'pulse-dot 2s infinite'}}/></i></span>
  </div>)
}
