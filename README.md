# Tanisha Banga — Animated GitHub Profile Dashboard

Terminal-style developer dashboard whose hero artwork is **reconstructed from 23,505 particles** that form, hold, disintegrate and morph (developer → GitHub mark → developer, looping).
**Status: Phases 1–3 complete and approved. Phase 4 (live GitHub integration) is CODE-COMPLETE but NOT VERIFIED against the live GitHub API or in a browser — see `TEST_REPORT.md`. Phase 5 is not started (awaiting approval).**

**Stack:** Vite 8, React 19, TypeScript 7, Tailwind CSS v4 (CSS-first: no `tailwind.config`, tokens in `src/index.css`), Canvas 2D particle engine, `simple-icons` (named imports) + vendored `devicon` SVGs.

## Run
```bash
npm ci             # or npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit + production build -> dist/
npm run preview    # serve dist/ on :4173
npm run check-icons            # verifies every logo asset/export exists
pip install -r tests/requirements.txt && playwright install chromium
npm run build && npm run test:visual       # Phase 2 browser tests  -> tests/last-report.json
npm run test:regression                    # Phase 2 particle regression guard -> tests/last-regression.json, screenshots/particle-regression.png
npm run test:layout                        # Phase 3 layout + logo tests -> tests/last-layout.json, screenshots/phase3-*.png
npm run test:unit                          # Phase 4 unit tests (Node only, no install, no network)
npm run test:phase4                        # Phase 4 browser tests with SYNTHETIC data (after npm run build)
GITHUB_TOKEN=... npm run data:update      # fetch live data + regenerate snake (or put it in .env)
```
Debug URL flags: `?t=<ms>` renders one exact frame of the timeline (38,500 ms loop); `?glow=<0..1>` sets glow strength.

## Phase 3 changes
**Logos** — all technology and social logos now come from a documented source (see `LOGO_SOURCES.md`). CSS is the blue CSS3 shield; **SQL is a neutral database glyph** (hand-authored, deliberately *not* a brand, so no specific database product is implied). None of the logos is claimed to be official: they are community-maintained (Simple Icons, Devicon).
**Tech stack layout** — desktop reproduces the reference: a 3-column × 2-row grid (Languages | Frontend | Backend over Database | AI / ML | Tools) with vertical column rules and a horizontal row rule. Fixed 36×36 icon box, single-line labels, no wrapping on desktop. Below `lg` the categories stack (1 column < 640px, 2 columns up to 1024px) with a divider above each; icons use a 5-column grid from 360px (3 below) with a fixed two-line label slot.
**Responsive polish** — panel header wraps cleanly (title / hint), tighter mobile padding and letter-spacing, Connect tiles go 2×2 below 360px, GitHub Stats uses 2×2 where the panel is narrow (labels no longer collide), footer stacks on mobile (stray `|` removed). Section order, panel names, header and footer text are unchanged.
**Performance** — the namespace `import * as si` (which bundled all ~3,400 icons) was replaced by named imports; Devicon SVGs are vendored as individual files.

| | Phase 2 | Phase 3 |
|---|---|---|
| JS bundle | 5,525.53 kB (2,269.46 kB gzip), >500 kB warning | **267.18 kB (87.59 kB gzip), no warning** |
| Largest extra asset | – | `matplotlib.svg` 23.5 kB (lazy-loaded image) |

**Particle engine untouched** — `src/engine/*`, `src/config/particles.ts` and `public/art/workspace-ref.png` are byte-identical to Phase 2 (SHA-256 guarded by `tests/regression.py`).

## Live GitHub data (Phase 4)

**Flow:** `scripts/fetch-github-data.mjs` (GitHub GraphQL + REST, native `fetch`, zero dependencies) → `public/data/github.json` → `scripts/generate-snake.mjs` → `public/data/snake.svg` (+ `snake-static.svg`) → the dashboard fetches `data/github.json` at runtime. The three panels (`src/components/GithubPanels.tsx`) share one request and show loading / not-generated / error / data states, plus an "updated" timestamp. Pure logic lives in `scripts/lib/` and `src/data/schema.ts` so it can be unit-tested without installing anything.

### What the numbers mean
- **Contributions** = `contributionCalendar.totalContributions` for the **last 12 months** (GitHub's default window for `contributionsCollection`), i.e. the same number github.com shows above the graph. The script checks it equals the sum of the daily counts it stores.
- **Private contributions:** GitHub counts commits, issues, pull requests and reviews (commits must be on a default/gh-pages branch and use an email linked to the account; forks' commits don't count). Activity in **private repositories is included only if** *Profile → Contributions & Activity → "Private contributions"* is enabled; then it appears as anonymised counts (no repo names). If it is off, the figure is **public-only** — the dashboard never labels it an all-repository total. Which of the two you get for the token the Action uses is **not verified** (see report).
- **Repositories** = public repositories owned by the account (forks and archived repos *are* counted here, as on the profile). **Followers / Following** = GitHub profile counts.
- **Missing vs zero:** an unavailable value is stored as `null` and shown as "—"; a genuine zero is shown as `0`.
- **"updated" timestamp** = when the stored data last *changed* (the script keeps the old timestamp if nothing but the timestamp would change, which avoids pointless commits).

### Language policy
Public, owned, **non-fork, non-archived** repositories. Bytes from `GET /repos/{owner}/{repo}/languages` are summed per language across those repos (not repo counts); percentage = language bytes ÷ total bytes, rounded to 0.1 with largest-remainder so rows sum to exactly 100.0; sorted by bytes; **top 4 + "Other"** (Other appears only when there are more than four languages). If any single language request fails the whole run fails — no partial percentages are written. Notes: GitHub counts `Jupyter Notebook` bytes (they can dominate ML repos); to hide it set `LANGUAGE_POLICY.excludeLanguages` in `scripts/lib/config.mjs`. Colours approximate GitHub linguist; unknown languages use grey.

### Contribution snake
Custom generator (no third-party action). Each calendar day becomes one cell (column = Sunday-start week, row = weekday, colour = GitHub's contribution level). A 6-cell snake walks a serpentine path over the real cells and "eats" (clears) days that have contributions; empty history is refused rather than drawn. SMIL animation works in `<img>` and in a GitHub README (Phase 5). Under `prefers-reduced-motion` the dashboard loads `snake-static.svg`. File size is ~130 kB for 371 days.

### Automation — `.github/workflows/update-dashboard.yml`
- **Schedule:** every 6 hours (`23 */6 * * *`, UTC; GitHub may delay runs) and manually via **Actions → Update dashboard data → Run workflow**.
- **Repository settings:** Settings → Actions → General → Workflow permissions: the workflow requests `contents: write` itself; if your org/repo forces "Read repository contents" *and* disallows the job-level request, switch it to "Read and write". If the default branch is protected, allow `github-actions[bot]` to push or use a PR flow. Scheduled workflows run only on the default branch and GitHub pauses them after ~60 days without repository activity (re-enable in the Actions tab).
- **Permissions:** workflow-level `permissions: {}`; the single job gets `contents: write` only.
- **Secrets:** **none required** — it uses the built-in short-lived `GITHUB_TOKEN`. Optional fallback *only if* a run fails with "Resource not accessible by integration" on the profile query: create a fine-grained token (public repositories, read-only, no extra permissions), add it as repo secret `GH_STATS_TOKEN` (Settings → Secrets and variables → Actions → New repository secret), and uncomment the one `GH_STATS_TOKEN` line in the workflow. Never paste a token into source, README or an issue; never share your GitHub password.
- **Commits:** only `public/data/*` is staged and a commit is made only if it changed. Pushes made with `GITHUB_TOKEN` do not trigger other workflows.
- **Troubleshooting:** open the failed run's log. `GitHub 401/403` → token/permission or rate limit; `GraphQL error` → see message; `Calendar total … does not equal …` → GitHub returned inconsistent data, re-run; `no live calendar` in the snake step → the fetch step did not write data. The previous `github.json` is never overwritten on failure.

### Security
Credentials are read only from `GH_STATS_TOKEN`/`GITHUB_TOKEN` in the environment, held in a closure, sent only as the `Authorization` header, passed through `redact()` before any message, and a final scan refuses to write JSON/SVG that looks like it contains a credential. `.env` is git-ignored; `.env.example` has no values. `tests/unit/repo-hygiene.test.mjs` re-checks all of this statically.

## Folder structure
`src/config` (site, theme, particles) · `src/engine` (rng, types, sampler, shapes, engine, useParticles) · `src/components` · `src/icons/registry.ts` · `src/assets/logos` (vendored logo SVGs) · `public/art` (artwork sources) · `scripts/` · `tests/` (+ `tests/baseline` Phase 2 reference frames) · `screenshots/`. See `FILE_MANIFEST.md` for every file.

## Particle engine
1. **Sampling** (`sampler.ts`): every lit pixel of `public/art/workspace-ref.png` becomes a particle keeping position/colour; if over `maxParticles`, brightest detail is kept. Logos are sampled from SVG paths by coverage with sub-pixel jitter.
2. **Fitting**: all shapes are resampled to the same count and ordered along a **Hilbert curve**, so particle *i* is spatially coherent in every shape.
3. **Timeline** (`engine.ts`): a pure function of time `t` → (from, to, local progress): deterministic and seekable. Per-particle stagger, speed variance, eased progress, curved arcs, colour interpolation.
4. **Rendering**: particles are written into an `ImageData` buffer (winner-take-all per pixel), then a downscaled copy is added back as glow. Ambient drift/twinkle, dust, cursor repulsion. `prefers-reduced-motion` renders one still formed frame.

## Common tasks
- **Add/replace a logo:** add a file to `src/assets/logos/` (or a Simple Icons named import) and an entry in `src/icons/registry.ts`; document it in `LOGO_SOURCES.md`. For Devicon logos add the name to `scripts/vendor-logos.mjs`.
- **Add a morph target:** `registerShape('id', …)` in `src/engine/shapes.ts` + a step in `sequence` (`src/config/particles.ts`). This changes the guarded engine files: re-record the baseline deliberately with `python3 tests/regression.py --record`.
- **Personal info / links:** `src/config/site.ts` only. LeetCode URL is `null` until you supply it (its tile stays dimmed).
- **GitHub data:** see "Live GitHub data (Phase 4)" below.

## Test status (last run, headless Chromium)
`test:visual` 22/22 · `test:regression` 29/29 (8 source hashes, particle count, 18 frames at 2 viewports, 390px canvas scale) · `test:layout` 93/93 (6 viewports). Raw results in `tests/last-*.json`.

## Known limitations
- Phase 4 has never run against the real GitHub API (no network where it was written). `public/data/github.json` is a **placeholder** (`status: not-generated`) until the workflow or `npm run data:update` runs. README GIF export and deployment are Phase 5.
- No logo is an official brand-portal asset (see `LOGO_SOURCES.md`); Express.js, Pandas and GitHub use a light fill because their brand colours vanish on navy. Devicon palettes can differ slightly from current brand guidelines (e.g. JavaScript yellow).
- Mobile panel padding is 4px tighter than Phase 2, so the 390px canvas is 336px wide (was 332px). The regression test accounts for this by comparing at a 386px viewport (identical canvas size) and separately asserts the real 390px canvas keeps the 650:346 ratio.
- The dashboard is capped at 1180px wide, so 1440/1920 screens render the same canvas size (unchanged design decision).
- Artwork is sampled from a screenshot crop (includes its dashed rectangle).
- Tested in headless Chromium (software rendering) only; no real-GPU, Safari or Firefox testing.
