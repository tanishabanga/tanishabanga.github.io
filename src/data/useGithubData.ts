import { useEffect, useState } from 'react'
import { parseGithubData, type ParseResult } from './schema'
export const DATA_BASE = `${import.meta.env.BASE_URL}data/`
export type Loaded = { kind: 'loading' } | ParseResult
let cache: Promise<ParseResult> | null = null // one fetch shared by the three panels
function load(): Promise<ParseResult> {
  return (cache ??= fetch(`${DATA_BASE}github.json`, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(parseGithubData)
    .catch((e: unknown): ParseResult => ({ kind: 'error', message: e instanceof Error ? e.message : 'request failed' })))
}
export function useGithubData(): Loaded {
  const [state, set] = useState<Loaded>({ kind: 'loading' })
  useEffect(() => { let live = true; load().then((r) => live && set(r)); return () => { live = false } }, [])
  return state
}
export function useReducedMotion(): boolean {
  const [r, set] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const m = matchMedia('(prefers-reduced-motion: reduce)'), f = () => set(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return r
}
