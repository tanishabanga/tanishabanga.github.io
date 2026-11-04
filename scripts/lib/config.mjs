// Shared constants for the data scripts. The username must match src/config/site.ts (guarded by tests/unit/config.test.mjs).
export const DEFAULT_USERNAME = 'tanishabanga'
export const SCHEMA_VERSION = 1
export const OUTPUT_DIR = 'public/data'
export const JSON_FILE = 'github.json'
export const SNAKE_FILE = 'snake.svg'
export const SNAKE_STATIC_FILE = 'snake-static.svg'
// Repository inclusion policy for the language panel (documented in README "Live GitHub data").
export const LANGUAGE_POLICY = Object.freeze({
  visibility: 'public', includeForks: false, includeArchived: false,
  topN: 4, // top four languages by bytes; everything else is folded into "Other"
  excludeLanguages: [], // e.g. ['Jupyter Notebook'] to hide notebook-heavy bytes; empty = count everything GitHub reports
})
// Approximate GitHub linguist colours (community-maintained; unknown languages fall back to FALLBACK_COLOR).
export const LANGUAGE_COLORS = Object.freeze({
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', SCSS: '#c6538c',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600', 'Jupyter Notebook': '#DA5B0B', SQL: '#e38c00',
  Shell: '#89e051', Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', Ruby: '#701516', Kotlin: '#A97BFF', Swift: '#F05138',
  Dart: '#00B4AB', Vue: '#41b883', Dockerfile: '#384d54', Makefile: '#427819', MATLAB: '#e16737', R: '#198CE7',
  Batchfile: '#C1F12E', PowerShell: '#012456', Lua: '#000080', TeX: '#3D6117',
})
export const FALLBACK_COLOR = '#8b949e'
export const OTHER_COLOR = '#6b7aa8'
