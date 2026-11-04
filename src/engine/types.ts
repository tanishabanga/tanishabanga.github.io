/** A point cloud in stage-normalised coordinates (x,y in 0..1). */
export interface Points { n: number; x: Float32Array; y: Float32Array; s: Float32Array; r: Uint8Array; g: Uint8Array; b: Uint8Array }
/** One step of the looping timeline: morph into `shape` over morphMs, then hold. */
export interface Step { shape: string; morphMs: number; holdMs: number }
export interface ParticleEngine {
  mount(canvas: HTMLCanvasElement): void
  resize(cssW: number, cssH: number, dpr: number): void
  setSequence(steps: Step[]): void
  start(): void
  stop(): void
  seek(ms: number): void   // render the exact frame at time t (deterministic)
  dispose(): void
}
