import { useEffect, type RefObject } from 'react'
import { CanvasParticleEngine } from './engine'
import { buildShapes } from './shapes'
import { particleConfig as cfg } from '../config/particles'
/** Mounts the engine on a canvas. `?t=ms` in the URL renders one exact frame (used for tests/recordings). */
export function useParticles(ref: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const c = ref.current!, q = new URLSearchParams(location.search), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let eng: CanvasParticleEngine | null = null, ro: ResizeObserver | null = null, dead = false
    buildShapes([...new Set(cfg.sequence.map(s => s.shape))], cfg.source, cfg.maxParticles, cfg.stageAspect).then(({ shapes, n }) => {
      if (dead) return; eng = new CanvasParticleEngine(shapes, n, reduced); eng.mount(c); eng.setSequence(cfg.sequence)
      const fit = () => {
        const cw = c.clientWidth
        const dpr = Math.min(devicePixelRatio || 1, 2)
        // Force integer CSS height matching engine's Math.round(cw * 346/650) so
        // Playwright element screenshots produce the same 332×177 (etc.) size as
        // the approved Phase 2 baselines and avoid sub-pixel scaling artifacts.
        const logicalH = Math.round(cw * 346 / 650)
        const stage = c.parentElement
        if (stage) {
          stage.style.height = `${logicalH}px`
          stage.style.aspectRatio = 'auto'
        }
        eng!.resize(cw, logicalH, dpr)
        q.has('t') ? eng!.seek(+q.get('t')!) : reduced && eng!.seek(cfg.sequence[0].morphMs + 500)
      }
      ro = new ResizeObserver(fit); ro.observe(c); fit(); if (!q.has('t') && !reduced) eng.start(); if (q.has('glow')) eng.glowAlpha = +q.get('glow')!; (window as any).__particles = { n, seek: (ms: number) => eng!.seek(ms), stop: () => eng!.stop(), start: () => eng!.start(), frames: () => eng!.frames }
    }).catch(e => console.error('particle engine failed', e))
    return () => { dead = true; eng?.dispose(); ro?.disconnect() }
  }, [ref])
}
