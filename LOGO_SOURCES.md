# Logo sources

Every technology logo, where it comes from, and how it is rendered.

**Honest status: none of these logos was fetched from an official brand portal.** The build environment can only reach npm/GitHub, so all
marks come from two community-maintained packages. They reproduce the real brand silhouettes, but they are community redraws and are **not**
claimed to be official assets. Brand names and marks remain trademarks of their respective owners.

| Packages | Version | Licence of the package data | Used for |
|---|---|---|---|
| [`simple-icons`](https://simpleicons.org) | 16.36.0 | CC0-1.0 | single-colour paths, imported **by name** (tree-shaken) |
| [`devicon`](https://devicon.dev) | 2.18.0 | MIT | multi-colour SVGs, vendored once into `src/assets/logos/` |

| Label | Provider | Reference | Official? | Colour handling |
|---|---|---|---|---|
| C++ | devicon | `cplusplus-original` | No (community) | Native multi-colour |
| Python | devicon | `python-original` | No (community) | Native two-tone |
| Java | devicon | `java-original` | No (community) | Native red/blue |
| JavaScript | devicon | `javascript-original` | No (community) | Native yellow `#F0DB4F` (devicon's palette; Simple Icons uses `#F7DF1E`) |
| **SQL** (Languages + Database) | **generic** | `src/assets/logos/sql-generic.svg` | **Not a brand logo** | Hand-authored neutral database glyph. Chosen deliberately so no specific database product is implied |
| HTML | devicon | `html5-original` | No (community) | Native orange shield |
| CSS | devicon | `css3-original` | No (community) | Native blue CSS3 shield (not Simple Icons' purple "CSS" mark) |
| React | devicon | `react-original` | No (community) | Native `#61DAFB` |
| Tailwind CSS | devicon | `tailwindcss-original` | No (community) | Native `#38BDF8` |
| Node.js | simple-icons | `siNodedotjs` | No (community) | Brand `#5FA04E` |
| Express.js | simple-icons | `siExpress` | No (community) | **Deviation:** brand colour `#0A0A0A` is invisible on navy, so a light fill `#E6EDF3` is used |
| MongoDB | devicon | `mongodb-original` | No (community) | Native greens |
| NumPy | devicon | `numpy-original` | No (community) | Native blues |
| Pandas | simple-icons | `siPandas` | No (community) | **Deviation:** brand `#150458` is too dark on navy, so `#E6EDF3` is used |
| Matplotlib | devicon | `matplotlib-original` | No (community) | Native multi-colour (23 kB; svgo saves only ~1%, so left untouched) |
| scikit-learn | devicon | `scikitlearn-original` | No (community) | Native orange/blue |
| Git | devicon | `git-original` | No (community) | Native `#F34F29` |
| GitHub | simple-icons | `siGithub` | No (community) | **Deviation:** brand `#181717` is invisible on navy, so `#E6EDF3` is used |
| VS Code | devicon | `vscode-original` | No (community) | Native blues |
| Docker | simple-icons | `siDocker` | No (community) | Brand `#2496ED` (chosen over devicon's duller whale) |
| *Connect:* GitHub | simple-icons | `siGithub` | No (community) | Light fill as above |
| *Connect:* LinkedIn | devicon | `linkedin-original` | No (community) | Native blue (Simple Icons removed the brand) |
| *Connect:* LeetCode | simple-icons | `siLeetcode` | No (community) | Brand `#FFA116`; tile is dimmed because no LeetCode URL has been supplied |
| *Connect:* Email | generic | inline SVG in `InfoPanels.tsx` | Not a brand | Pink envelope |

Light-fill rule (`fillFor` in `src/icons/registry.ts`): a Simple Icons colour with luminance < 45 is replaced by `#E6EDF3`.

Rendering: each logo sits in a fixed 36x36 box; `object-contain` preserves the native aspect ratio, nothing is stretched.

Maintenance: `npm run vendor-logos` re-copies the devicon files; `npm run check-icons` verifies every file and named export exists.
Every required logo was obtainable from these two packages; Java, VS Code, LinkedIn and Matplotlib exist only in devicon.
