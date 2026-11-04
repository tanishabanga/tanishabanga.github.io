import type { ReactNode } from 'react'
const dots = { cyan:'bg-cyan', emerald:'bg-emerald', violet:'bg-violet' }
export function Panel({ title, hint, dot='cyan', className='', children }:{title:string;hint?:string;dot?:keyof typeof dots;className?:string;children:ReactNode}) {
  return (<section className={`rounded-xl border border-edge bg-panel/90 shadow-[0_0_24px_-10px_#38bdf8] p-3.5 sm:p-4 ${className}`}>
    <header className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
      <h2 className="flex items-center gap-2 tracking-[0.25em] uppercase text-ink sm:tracking-[0.35em]"><i className={`size-2.5 rounded-full ${dots[dot]}`}/>{title}</h2>
      {hint && <span className="ml-auto text-right text-dim">{hint}</span>}
    </header>{children}</section>)
}
