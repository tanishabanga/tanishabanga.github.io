import { hash } from './rng'
import type { Points } from './types'
const alloc = (n: number): Points => ({ n, x: new Float32Array(n), y: new Float32Array(n), s: new Float32Array(n), r: new Uint8Array(n), g: new Uint8Array(n), b: new Uint8Array(n) })
export const loadImage = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })

/** Image sampling: every lit pixel of the artwork becomes a particle that keeps its position and colour. */
export async function pointsFromImage(url: string, max: number, threshold = 0.16): Promise<Points> {
  const img = await loadImage(url), W = img.width, H = img.height
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0)
  const d = ctx.getImageData(0, 0, W, H).data, cand: { i: number; score: number }[] = []
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255
    if (lum > threshold) cand.push({ i, score: lum + 0.3 * hash(i, 11) }) // brighter detail wins when thinning
  }
  if (cand.length > max) { cand.sort((a, b) => b.score - a.score); cand.length = max }
  const p = alloc(cand.length)
  cand.forEach(({ i }, k) => {
    const lum = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) / 255
    p.x[k] = ((i % W) + 0.5) / W; p.y[k] = (Math.floor(i / W) + 0.5) / H
    const boost = Math.min(1.2, 0.8 / Math.max(lum, 0.35)) // lift dim pixels so fine detail stays visible
    p.r[k] = Math.min(255, d[i * 4] * boost); p.g[k] = Math.min(255, d[i * 4 + 1] * boost); p.b[k] = Math.min(255, d[i * 4 + 2] * boost)
    p.s[k] = 0.9 + lum * 0.9
  })
  return p
}

/** Contour/fill sampling of an SVG path (24x24 viewBox, e.g. Simple Icons) as a centred logo silhouette. */
export function pointsFromPath(path: string, color: (u: number, v: number) => [number, number, number], stageAspect: number, height = 0.62): Points {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S
  const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.scale(S / 24, S / 24); ctx.fillStyle = '#fff'; ctx.fill(new Path2D(path))
  const d = ctx.getImageData(0, 0, S, S).data, idx: number[] = []
  for (let i = 0; i < S * S; i++) if (d[i * 4 + 3] > 128) idx.push(i)
  const p = alloc(idx.length)
  idx.forEach((i, k) => {
    const u = ((i % S) + hash(i, 5)) / S, v = (Math.floor(i / S) + hash(i, 6)) / S, [r, g, b] = color(u, v) // sub-pixel jitter hides the grid
    p.x[k] = 0.5 + (u - 0.5) * height / stageAspect; p.y[k] = 0.5 + (v - 0.5) * height
    p.r[k] = r; p.g[k] = g; p.b[k] = b; p.s[k] = 1.1
  })
  return p
}

const hil = (x: number, y: number) => { let d = 0; for (let s = 128; s > 0; s >>= 1) { const rx = x & s ? 1 : 0, ry = y & s ? 1 : 0; d += s * s * ((3 * rx) ^ ry); if (!ry) { if (rx) { x = 255 - x; y = 255 - y } const t = x; x = y; y = t } } return d }

/** Resample to exactly n points and order along a Hilbert curve, so particle i is spatially coherent in EVERY shape (rank pairing = short, non-crossing paths). */
export function fit(p: Points, n: number, seed = 0): Points {
  const o = alloc(n), order: { k: number; key: number }[] = []
  for (let k = 0; k < n; k++) {
    const j = p.n >= n ? Math.min(p.n - 1, Math.floor((k + hash(k, seed)) * p.n / n)) : k % p.n, dup = p.n < n && k >= p.n
    o.x[k] = p.x[j] + (dup ? (hash(k, 21) - 0.5) * 0.0016 : 0); o.y[k] = p.y[j] + (dup ? (hash(k, 22) - 0.5) * 0.0016 : 0)
    o.s[k] = p.s[j]; o.r[k] = p.r[j]; o.g[k] = p.g[j]; o.b[k] = p.b[j]
    order.push({ k, key: hil(Math.min(255, Math.max(0, o.x[k] * 255 | 0)), Math.min(255, Math.max(0, o.y[k] * 255 | 0))) })
  }
  order.sort((a, b) => a.key - b.key)
  const q = alloc(n); order.forEach(({ k }, i) => { q.x[i] = o.x[k]; q.y[i] = o.y[k]; q.s[i] = o.s[k]; q.r[i] = o.r[k]; q.g[i] = o.g[k]; q.b[i] = o.b[k] })
  return q
}
