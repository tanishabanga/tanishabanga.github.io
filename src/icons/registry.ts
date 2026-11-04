// Tech-logo registry. Every logo has ONE source, recorded in `provider` + `ref` (see LOGO_SOURCES.md).
//  - 'simple-icons': single-colour path imported by NAME so the bundler tree-shakes the rest of the library (CC0 data; brand marks remain trademarks of their owners).
//  - 'devicon':      multi-colour SVG vendored into src/assets/logos/ by scripts/vendor-logos.mjs (MIT, community-maintained).
//  - 'generic':      neutral glyph authored for this project; it is NOT a brand logo.
// No logo here is fetched from an official brand portal, so none is labelled "official".
import { siDocker, siExpress, siGithub, siLeetcode, siNodedotjs, siPandas } from 'simple-icons'
import cplusplus from '../assets/logos/cplusplus.svg'
import python from '../assets/logos/python.svg'
import java from '../assets/logos/java.svg'
import javascript from '../assets/logos/javascript.svg'
import html5 from '../assets/logos/html5.svg'
import css3 from '../assets/logos/css3.svg'
import react from '../assets/logos/react.svg'
import tailwindcss from '../assets/logos/tailwindcss.svg'
import mongodb from '../assets/logos/mongodb.svg'
import numpy from '../assets/logos/numpy.svg'
import scikitlearn from '../assets/logos/scikitlearn.svg'
import matplotlib from '../assets/logos/matplotlib.svg'
import git from '../assets/logos/git.svg'
import vscode from '../assets/logos/vscode.svg'
import linkedin from '../assets/logos/linkedin.svg'
import sqlGeneric from '../assets/logos/sql-generic.svg'

export type Provider = 'simple-icons' | 'devicon' | 'generic'
type SimpleIcon = { path: string; hex: string }
export type IconSpec = { label: string; provider: Provider; ref: string; file?: string; si?: SimpleIcon }
const dev = (label: string, file: string, ref: string): IconSpec => ({ label, provider: 'devicon', ref, file })
const simple = (label: string, si: SimpleIcon, ref: string): IconSpec => ({ label, provider: 'simple-icons', ref, si })
const SQL: IconSpec = { label: 'SQL', provider: 'generic', ref: 'src/assets/logos/sql-generic.svg (neutral database glyph, not a brand)', file: sqlGeneric }

export const techGroups: { title: string; items: IconSpec[] }[] = [
  { title: 'Languages', items: [dev('C++', cplusplus, 'cplusplus-original'), dev('Python', python, 'python-original'), dev('Java', java, 'java-original'), dev('JavaScript', javascript, 'javascript-original'), SQL] },
  { title: 'Frontend', items: [dev('HTML', html5, 'html5-original'), dev('CSS', css3, 'css3-original'), dev('React', react, 'react-original'), dev('Tailwind CSS', tailwindcss, 'tailwindcss-original')] },
  { title: 'Backend', items: [simple('Node.js', siNodedotjs, 'siNodedotjs'), simple('Express.js', siExpress, 'siExpress')] },
  { title: 'Database', items: [dev('MongoDB', mongodb, 'mongodb-original'), SQL] },
  { title: 'AI / ML', items: [dev('NumPy', numpy, 'numpy-original'), simple('Pandas', siPandas, 'siPandas'), dev('Matplotlib', matplotlib, 'matplotlib-original'), dev('scikit-learn', scikitlearn, 'scikitlearn-original')] },
  { title: 'Tools', items: [dev('Git', git, 'git-original'), simple('GitHub', siGithub, 'siGithub'), dev('VS Code', vscode, 'vscode-original'), simple('Docker', siDocker, 'siDocker')] },
]
export const socialIcons: Record<string, IconSpec> = {
  github: simple('GitHub', siGithub, 'siGithub'), linkedin: dev('LinkedIn', linkedin, 'linkedin-original'), leetcode: simple('LeetCode', siLeetcode, 'siLeetcode'),
}
export function resolve(s: IconSpec): { path: string; hex: string } | { file: string } | null {
  if (s.si) return { path: s.si.path, hex: s.si.hex }
  return s.file ? { file: s.file } : null
}
// Near-black / very dark brand colours vanish on the navy background, so those get a light fill (documented deviation; see LOGO_SOURCES.md).
export const fillFor = (hex: string) => { const n = parseInt(hex, 16), l = ((n >> 16) & 255) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11; return l < 45 ? '#e6edf3' : `#${hex}` }
