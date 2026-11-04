// Morph-target registry. Add a new target = one registerShape() call + one Step in config/particles.ts.
import * as si from 'simple-icons'
import { fit, pointsFromImage, pointsFromPath } from './sampler'
import { hash } from './rng'
import type { Points } from './types'
type Ctx = { n: number; aspect: number; dev: Points }
export type ShapeLoader = (c: Ctx) => Points | Promise<Points>
const reg = new Map<string, ShapeLoader>()
export const registerShape = (id: string, f: ShapeLoader) => reg.set(id, f)
const gauss = (i: number, s: number) => (hash(i, s) + hash(i, s + 1) + hash(i, s + 2) - 1.5) * 1.6

registerShape('scatter', ({ dev }) => { // evenly spaced golden-angle spiral (no dense blob), Hilbert-paired to the artwork; keeps each particle's colour
  const sp = { ...fit(dev, dev.n), x: new Float32Array(dev.n), y: new Float32Array(dev.n) }
  for (let k = 0; k < dev.n; k++) { const r = Math.sqrt((k + 0.5) / dev.n), a = k * 2.399963; sp.x[k] = 0.5 + Math.cos(a) * r * 0.47; sp.y[k] = 0.5 + Math.sin(a) * r * 0.46 }
  const p = fit(sp, dev.n); p.r.set(dev.r); p.g.set(dev.g); p.b.set(dev.b); p.s.set(dev.s); return p })
const brandGradient = (a: [number, number, number], b: [number, number, number]) => (_u: number, v: number): [number, number, number] => [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v, a[2] + (b[2] - a[2]) * v]
registerShape('github', ({ aspect }) => pointsFromPath((si as any).siGithub.path, brandGradient([56, 189, 248], [139, 92, 246]), aspect))
registerShape('react', ({ aspect }) => pointsFromPath((si as any).siReact.path, () => [97, 218, 251], aspect))

export async function buildShapes(ids: string[], source: string, max: number, aspect: number) {
  const dev0 = await pointsFromImage(source, max), n = dev0.n, dev = fit(dev0, n), out = new Map<string, Points>([['developer', dev]])
  for (const id of ids) if (!out.has(id)) { const l = reg.get(id); if (!l) throw new Error(`unknown shape ${id}`); out.set(id, id === 'scatter' ? await l({ n, aspect, dev }) : fit(await l({ n, aspect, dev }), n)) }
  return { shapes: out, n }
}
