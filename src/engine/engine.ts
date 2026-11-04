import { clamp, easeInOut, hash } from './rng'
import type { ParticleEngine, Points, Step } from './types'
import { particleConfig as cfg } from '../config/particles'

export class CanvasParticleEngine implements ParticleEngine {
  private ctx!: CanvasRenderingContext2D; private buf = document.createElement('canvas'); private glow = document.createElement('canvas'); private mid = document.createElement('canvas')
  private W = 1; private H = 1; private scale = 1; private img!: ImageData; private steps: Step[] = []; private raf = 0; private t0 = 0
  private ph: Float32Array; private cur = { x: -1e4, y: -1e4, k: 0, tx: -1e4, ty: -1e4, tk: 0 }; private frozen: number | null = null; glowAlpha = 0.35; frames = 0
  constructor(private shapes: Map<string, Points>, private n: number, private reduced = false) {
    this.ph = new Float32Array(n).map((_, i) => hash(i, 3))
  }
  private onMove = (e: PointerEvent) => { const c = this.ctx.canvas, r = c.getBoundingClientRect(); this.cur.tx = (e.clientX - r.left) * c.width / r.width; this.cur.ty = (e.clientY - r.top) * c.height / r.height; this.cur.tk = 1 }
  private onLeave = () => { this.cur.tk = 0 }
  mount(c: HTMLCanvasElement) { this.ctx = c.getContext('2d')!; c.addEventListener('pointermove', this.onMove); c.addEventListener('pointerleave', this.onLeave) }
  resize(cw: number, _ch: number, dpr: number) {
    const W = Math.round(cw * dpr), H = Math.round(W * 346 / 650); this.W = W; this.H = H; this.scale = W / 650
    for (const c of [this.ctx.canvas, this.buf]) { c.width = W; c.height = H }
    this.mid.width = W >> 1; this.mid.height = H >> 1; this.glow.width = W >> 2; this.glow.height = H >> 2; this.img = new ImageData(W, H) }
  setSequence(s: Step[]) { this.steps = s }
  private total() { return this.steps.reduce((a, s) => a + s.morphMs + s.holdMs, 0) }
  /** Pure function of time -> which shapes we are between, and local progress. Makes everything deterministic & seekable. */
  private state(t: number) {
    const total = this.total(), it = Math.floor(t / total), lt0 = t - it * total; let acc = 0
    for (let i = 0; i < this.steps.length; i++) { const s = this.steps[i], lt = lt0 - acc
      if (lt < s.morphMs + s.holdMs) { const prev = this.steps[(i + this.steps.length - 1) % this.steps.length].shape, intro = it === 0 && i === 0
        return { from: this.shapes.get(intro ? s.shape : prev)!, to: this.shapes.get(s.shape)!, lt: intro ? s.morphMs : lt, morph: Math.max(1, s.morphMs) } }
      acc += s.morphMs + s.holdMs }
    const s = this.steps[0]; return { from: this.shapes.get(s.shape)!, to: this.shapes.get(s.shape)!, lt: 1e9, morph: 1 }
  }
  seek(ms: number) { this.frozen = ms; this.draw(ms) }
  start() { if (this.reduced) { this.seek(this.steps[0].morphMs + 500); return } this.t0 = performance.now(); const f = (now: number) => { this.draw(now - this.t0); this.raf = requestAnimationFrame(f) }; this.raf = requestAnimationFrame(f) }
  stop() { cancelAnimationFrame(this.raf) }
  dispose() { this.stop(); this.ctx.canvas.removeEventListener('pointermove', this.onMove); this.ctx.canvas.removeEventListener('pointerleave', this.onLeave) }
  private draw(t: number) {
    this.frames++
    const { from, to, lt, morph } = this.state(t), { W, H, n, ph } = this, d = this.img.data, sc = this.scale, stag = morph * 0.38, span = Math.max(1, morph - stag), c = this.cur
    c.k += (c.tk - c.k) * 0.12; c.x += (c.tx - c.x) * 0.35; c.y += (c.ty - c.y) * 0.35
    const R = cfg.cursorRadius * sc, ambient = this.reduced ? 0 : 1; d.fill(0); for (let i = 3; i < d.length; i += 4) d[i] = 255
    const add = (x: number, y: number, r: number, g: number, b: number, k: number) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 4; const rr = r * k, gg = g * k, bb = b * k; if (rr * 0.3 + gg * 0.59 + bb * 0.11 > d[o] * 0.3 + d[o + 1] * 0.59 + d[o + 2] * 0.11) { d[o] = rr; d[o + 1] = gg; d[o + 2] = bb } }
    for (let i = 0; i < n; i++) {
      const delay = clamp(to.x[i] * 0.6 + hash(i, 1) * 0.4) * stag, p = clamp((lt - delay) / (span * (0.8 + 0.2 * hash(i, 2)))), e = easeInOut(p)
      const fx = from.x[i], fy = from.y[i], dx = to.x[i] - fx, dy = to.y[i] - fy, arc = (hash(i, 7) - 0.5) * 0.6 * Math.sin(Math.PI * e)
      const settle = (1 - Math.sin(Math.PI * e)) * ambient; let x = (fx + dx * e - dy * arc) * W + Math.sin(t * 0.0009 + ph[i] * 6.28) * 0.8 * sc * settle, y = (fy + dy * e + dx * arc) * H + Math.cos(t * 0.0007 + ph[i] * 9) * 0.8 * sc * settle
      if (c.k > 0.01) { const ox = x - c.x, oy = y - c.y, dist = Math.hypot(ox, oy); if (dist < R && dist > 0.01) { const f = (1 - dist / R) ** 2 * 14 * sc * c.k * settle / dist; x += ox * f; y += oy * f } }
      const tw = 0.88 + 0.12 * Math.sin(t * 0.002 + ph[i] * 40) * ambient, r = (from.r[i] + (to.r[i] - from.r[i]) * e) * tw, g = (from.g[i] + (to.g[i] - from.g[i]) * e) * tw, b = (from.b[i] + (to.b[i] - from.b[i]) * e) * tw
      const rad = (from.s[i] + (to.s[i] - from.s[i]) * e) * sc, xi = x | 0, yi = y | 0
      add(xi, yi, r, g, b, 1); if (rad > 1.3) { add(xi + 1, yi, r, g, b, 0.4); add(xi - 1, yi, r, g, b, 0.4); add(xi, yi + 1, r, g, b, 0.4); add(xi, yi - 1, r, g, b, 0.4) }
    }
    if (ambient) for (let j = 0; j < cfg.ambient.count; j++) { // sparse background dust, drifting on a closed loop
      const bx = hash(j, 91), by = hash(j, 92), a = t * 0.00015 * (0.5 + hash(j, 93)) + hash(j, 94) * 6.28
      add(((bx + Math.sin(a) * 0.015) * W) | 0, ((by + Math.cos(a) * 0.02) * H) | 0, 70, 130, 255, 0.55 + 0.45 * Math.sin(t * 0.0013 + j)) }
    this.buf.getContext('2d')!.putImageData(this.img, 0, 0)
    const mc = this.mid.getContext('2d')!, g = this.glow.getContext('2d')!; mc.imageSmoothingEnabled = g.imageSmoothingEnabled = true; mc.drawImage(this.buf, 0, 0, this.mid.width, this.mid.height); g.drawImage(this.mid, 0, 0, this.glow.width, this.glow.height)
    const m = this.ctx; m.globalCompositeOperation = 'source-over'; m.fillStyle = '#000'; m.fillRect(0, 0, W, H); m.imageSmoothingEnabled = true
    m.globalCompositeOperation = 'lighter'; m.globalAlpha = this.glowAlpha; m.drawImage(this.glow, 0, 0, W, H); m.globalAlpha = 1; m.drawImage(this.buf, 0, 0)
  }
}
