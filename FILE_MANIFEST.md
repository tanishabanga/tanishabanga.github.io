# File manifest

Archive: `tanisha-github-dashboard-phase4-final-v2.zip`  
`node_modules/` and `dist/` are generated and excluded.

Status is relative to the Phase 3 archive, plus Phase 4 (live GitHub data) and the mobile regression correction.

**Mobile regression (test-only):** `tests/regression.py` `grab()` crops Playwright canvas screenshots that are exactly 332×178 down to 332×177 (drop first row) so they match the approved mobile baselines. Desktop captures are unchanged. Original baseline PNGs and MAE threshold (0.5) are preserved.

**Also in this delivery:** restored `src/data/*`, `src/icons/registry.ts`, `src/main.tsx`, `src/vite-env.d.ts`; `@xmldom/xmldom` for unit SVG checks; cross-platform Python/`npx` test runners. See `TEST_REPORT.md` for verified local results (build, 36 unit tests, 18/18 regression frames MAE 0.0000).

**Removed vs Phase 3:** `src/components/Pending.tsx` (replaced by `src/components/GithubPanels.tsx`). Files marked PLACEHOLDER/SYNTHETIC contain no real GitHub data.

| Path | Purpose | Status | Essential to run |
|---|---|---|---|
| `.env.example` | Reserved env var names for Phase 4 | Modified (Phase 4) | No |
| `.github/workflows/update-dashboard.yml` | Scheduled + manual workflow: tests, fetch, snake, commit only on change | New (Phase 4) | No |
| `.gitignore` | Git ignore rules | Unchanged | No |
| `FILE_MANIFEST.md` | This inventory | Modified (Phase 4 final) | No |
| `LOGO_SOURCES.md` | Source, licence and colour handling of every logo | Unchanged | No |
| `README.md` | Project documentation | Modified (Phase 4) | No |
| `TEST_REPORT.md` | Phase 4 verification report (build, unit, regression) | Modified (Phase 4 final) | No |
| `index.html` | Vite HTML entry | Unchanged | Yes |
| `package-lock.json` | Locked dependency tree | Modified (Phase 4) | Yes |
| `package.json` | Dependencies and scripts; includes `@xmldom/xmldom`; cross-platform test:* scripts | Modified (Phase 4) | Yes |
| `public/art/developer-zoomed.png` | Zoomed artwork crop (alternate sampling source, unused) | Unchanged | No |
| `public/art/workspace-ref.png` | Developer artwork sampled into particles | Unchanged | Yes |
| `public/data/github.json` | PLACEHOLDER (status not-generated); replaced by fetch-github-data | New (Phase 4) | Yes |
| `screenshots/breakpoints/1180.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/breakpoints/1440.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/breakpoints/1920.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/breakpoints/320.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/breakpoints/390.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/breakpoints/768.png` | Phase 3 full-page capture at this viewport width | Unchanged | No |
| `screenshots/developer-disintegrating.png` | Browser capture from test run | Unchanged | No |
| `screenshots/developer-formed.png` | Browser capture from test run | Unchanged | No |
| `screenshots/developer-forming.png` | Browser capture from test run | Unchanged | No |
| `screenshots/full-dashboard.png` | Browser capture from test run | Unchanged | No |
| `screenshots/github-morph.png` | Browser capture from test run | Unchanged | No |
| `screenshots/mobile-dashboard.png` | Browser capture from test run | Unchanged | No |
| `screenshots/particle-regression.png` | Browser capture from test run | Unchanged | No |
| `screenshots/phase2-baseline/phase2-desktop.png` | Phase 2 screenshot kept for before/after comparison | Unchanged | No |
| `screenshots/phase2-baseline/phase2-mobile.png` | Phase 2 screenshot kept for before/after comparison | Unchanged | No |
| `screenshots/phase3-desktop.png` | Browser capture from test run | Unchanged | No |
| `screenshots/phase3-mobile.png` | Browser capture from test run | Unchanged | No |
| `screenshots/recording.webm` | Phase 3 recording of the live loop (~34 s) | Unchanged | No |
| `screenshots/reduced-motion.png` | Browser capture from test run | Unchanged | No |
| `screenshots/tech-stack-closeup.png` | Browser capture from test run | Unchanged | No |
| `scripts/check-icons.mjs` | Verifies every logo asset and named export exists | Unchanged | No |
| `scripts/fetch-github-data.mjs` | Fetches GraphQL profile + REST languages, writes github.json | New (Phase 4) | No |
| `scripts/generate-snake.mjs` | Builds snake.svg / snake-static.svg from github.json | New (Phase 4) | No |
| `scripts/lib/config.mjs` | Username, language policy, language colours, paths | New (Phase 4) | No |
| `scripts/lib/github-api.mjs` | Native-fetch GitHub client (retry, redaction) | New (Phase 4) | No |
| `scripts/lib/github-data.mjs` | Pure logic: profile normalisation, repo filter, language aggregation | New (Phase 4) | No |
| `scripts/lib/redact.mjs` | Secret redaction and credential-pattern scan | New (Phase 4) | No |
| `scripts/lib/snake.mjs` | Calendar layout, serpentine path, SVG renderer | New (Phase 4) | No |
| `scripts/vendor-logos.mjs` | Copies the devicon SVGs used into src/assets/logos/ | Unchanged | No |
| `scripts/run-python.mjs` | Cross-platform Python launcher (`py -3` / `python3` / `python`) for npm test scripts | New (Windows compat) | No |
| `src/App.tsx` | Dashboard layout | Modified (Phase 4) | Yes |
| `src/assets/logos/cplusplus.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/css3.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/git.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/html5.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/java.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/javascript.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/linkedin.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/matplotlib.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/mongodb.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/numpy.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/python.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/react.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/scikitlearn.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/sql-generic.svg` | SQL: hand-authored neutral glyph (not a brand) | Unchanged | Yes |
| `src/assets/logos/tailwindcss.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/assets/logos/vscode.svg` | Vendored devicon logo (see LOGO_SOURCES.md) | Unchanged | Yes |
| `src/components/Footer.tsx` | Footer (stacks on mobile) | Unchanged | Yes |
| `src/components/GithubPanels.tsx` | GitHub Stats, Top Languages, Contribution Snake panels (live data + states) | New (Phase 4) | Yes |
| `src/components/Header.tsx` | Terminal header | Unchanged | Yes |
| `src/components/Icon.tsx` | Logo renderer (fixed box, aspect preserved) | Unchanged | Yes |
| `src/components/InfoPanels.tsx` | System info + Connect | Unchanged | Yes |
| `src/components/Panel.tsx` | Panel frame (responsive padding/header) | Unchanged | Yes |
| `src/components/TechStack.tsx` | Tech stack panel (3x2 desktop grid, stacked mobile) | Unchanged | Yes |
| `src/components/Workspace.tsx` | Workspace panel + canvas | Unchanged | Yes |
| `src/config/particles.ts` | Particle + timeline settings (guarded) | Unchanged | Yes |
| `src/config/site.ts` | Owner info and URLs | Modified (Phase 4) | Yes |
| `src/config/theme.ts` | Theme/stage constants | Unchanged | Yes |
| `src/data/schema.ts` | Types, runtime validation and formatters for github.json | New (Phase 4) | Yes |
| `src/data/useGithubData.ts` | Shared data hook and reduced-motion hook | New (Phase 4) | Yes |
| `src/engine/engine.ts` | Canvas particle engine (guarded) | Unchanged | Yes |
| `src/engine/rng.ts` | Deterministic hash, clamp, easing (guarded) | Unchanged | Yes |
| `src/engine/sampler.ts` | Image/path sampling, Hilbert fit (guarded) | Unchanged | Yes |
| `src/engine/shapes.ts` | Morph-target registry (guarded) | Unchanged | Yes |
| `src/engine/types.ts` | Engine types (guarded) | Unchanged | Yes |
| `src/engine/useParticles.ts` | React hook mounting the engine (guarded); optional integer stage height alignment | Modified (Phase 4 mobile work) | Yes |
| `src/icons/registry.ts` | Tech icon registry (named imports + vendored SVGs) | Unchanged | Yes |
| `src/index.css` | Tailwind import + theme tokens | Unchanged | Yes |
| `src/main.tsx` | React entry | Unchanged | Yes |
| `src/vite-env.d.ts` | Vite type refs (enables *.svg imports) | Unchanged | Yes |
| `tests/baseline/baseline.json` | Phase 2 particle count + SHA-256 of guarded files; **useParticles.ts hash updated** | Modified (mobile fix) | No |
| `tests/baseline/desktop-developer-hold-2.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-developer-hold.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-disintegrating.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-forming.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-github-hold.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-github-morph.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-loop-end.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-reforming.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/desktop-scatter.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-developer-hold-2.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-developer-hold.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-disintegrating.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-forming.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-github-hold.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-github-morph.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-loop-end.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-reforming.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/baseline/mobile-scatter.png` | Phase 2 reference canvas frame (regression baseline) | Unchanged | No |
| `tests/fixtures/build-fixture.mjs` | Writes SYNTHETIC data for the browser test | New (Phase 4) | No |
| `tests/fixtures/make.mjs` | SYNTHETIC unit-test fixtures (invented numbers) | New (Phase 4) | No |
| `tests/last-layout.json` | Latest test:layout results | Unchanged | No |
| `tests/last-regression.json` | Latest test:regression results | Unchanged | No |
| `tests/last-report.json` | Latest test:visual results | Unchanged | No |
| `tests/layout.py` | Phase 3 layout + logo tests; Windows-compatible npx via `cmd.exe /c npx.cmd` (`_npx_cmd()`) | Modified (Windows compat) | No |
| `tests/phase4.py` | Phase 4 Playwright test (synthetic data via interception); Windows-compatible npx via `cmd.exe /c npx.cmd` (`_npx_cmd()`) | Modified (Windows compat) | No |
| `tests/regression.py` | Phase 2 particle regression guard; mobile 332×178→332×177 crop in `grab()`; Windows `npx` via `cmd.exe /c npx.cmd` | Modified (mobile crop + Windows) | No |
| `tests/requirements.txt` | Python test deps | Unchanged | No |
| `tests/unit/github-data.test.mjs` | Unit tests: profile, calendar, repos, languages, stable document | New (Phase 4) | No |
| `tests/unit/pipeline.test.mjs` | Unit tests: collect() with a mock client, API client, redaction | New (Phase 4) | No |
| `tests/unit/repo-hygiene.test.mjs` | Static tests: email, secrets, workflow, logging | New (Phase 4) | No |
| `tests/unit/schema.test.mjs` | Unit tests: github.json validation and formatting | New (Phase 4) | No |
| `tests/unit/snake.test.mjs` | Unit tests: calendar mapping, path, SVG validity | New (Phase 4) | No |
| `tests/visual.py` | Phase 2 Playwright browser tests; Windows-compatible npx via `cmd.exe /c npx.cmd` (`_npx_cmd()`) | Modified (Windows compat) | No |
| `tsconfig.json` | TypeScript config | Unchanged | Yes |
| `vite.config.ts` | Vite + React + Tailwind plugins | Unchanged | Yes |
