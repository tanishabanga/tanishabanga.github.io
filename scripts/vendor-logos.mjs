// Copies the devicon SVGs used by the dashboard into src/assets/logos/ (one file per logo, no duplicates).
// Run `npm run vendor-logos` after bumping devicon. Output files are committed so the app never needs devicon at runtime.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
const SRC = 'node_modules/devicon/icons', OUT = 'src/assets/logos'
// [devicon folder, variant, output name]
const LOGOS = [
  ['cplusplus', 'original', 'cplusplus'], ['python', 'original', 'python'], ['java', 'original', 'java'], ['javascript', 'original', 'javascript'],
  ['html5', 'original', 'html5'], ['css3', 'original', 'css3'], ['react', 'original', 'react'], ['tailwindcss', 'original', 'tailwindcss'],
  ['mongodb', 'original', 'mongodb'], ['numpy', 'original', 'numpy'], ['scikitlearn', 'original', 'scikitlearn'], ['matplotlib', 'original', 'matplotlib'],
  ['git', 'original', 'git'], ['vscode', 'original', 'vscode'], ['linkedin', 'original', 'linkedin'],
]
mkdirSync(OUT, { recursive: true }); let bad = 0
for (const [d, v, name] of LOGOS) {
  const from = `${SRC}/${d}/${d}-${v}.svg`
  if (!existsSync(from)) { console.error('MISSING', from); bad++; continue }
  copyFileSync(from, `${OUT}/${name}.svg`); console.log('copied', name)
}
console.log('NOTE: sql-generic.svg is hand-authored (neutral database glyph) and is not touched by this script.')
process.exit(bad ? 1 : 0)
