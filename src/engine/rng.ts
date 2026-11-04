// Deterministic helpers: same seed -> same output on every machine.
export const hash = (i: number, s = 0) => { let h = Math.imul((i ^ s ^ 0x9e3779b9) | 0, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296 }
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
