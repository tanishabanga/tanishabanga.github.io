import type { Step } from '../engine/types'
// All particle tuning lives here. Add a morph target = registerShape() in engine/shapes.ts + a Step below.
export const particleConfig = {
  maxParticles: 24000, source: '/art/workspace-ref.png', stageAspect: 650 / 346, cursorRadius: 90, ambient: { count: 110 },
  // Loop: dust -> developer forms (hero, long hold) -> disintegrates -> GitHub mark -> developer again.
  sequence: [
    { shape: 'scatter', morphMs: 2600, holdMs: 500 },
    { shape: 'developer', morphMs: 4200, holdMs: 12000 },
    { shape: 'github', morphMs: 3000, holdMs: 2600 },
    { shape: 'developer', morphMs: 3600, holdMs: 10000 },
  ] as Step[],
}
