// Verifies every logo the registry needs exists: the named Simple Icons exports and the vendored SVG files.
import * as si from 'simple-icons'
import { existsSync, readFileSync } from 'node:fs'
const NAMES = ['siDocker', 'siExpress', 'siGithub', 'siLeetcode', 'siNodedotjs', 'siPandas']
const FILES = ['cplusplus', 'python', 'java', 'javascript', 'html5', 'css3', 'react', 'tailwindcss', 'mongodb', 'numpy', 'scikitlearn', 'matplotlib', 'git', 'vscode', 'linkedin', 'sql-generic']
let bad = 0
for (const k of NAMES) { const ok = !!si[k]; if (!ok) bad++; console.log(ok ? 'OK     ' : 'MISSING', 'simple-icons', k, si[k]?.hex ?? '') }
for (const f of FILES) { const p = `src/assets/logos/${f}.svg`, ok = existsSync(p) && /<svg[\s>]/.test(readFileSync(p, 'utf8')); if (!ok) bad++; console.log(ok ? 'OK     ' : 'MISSING', p) }
process.exit(bad ? 1 : 0)
