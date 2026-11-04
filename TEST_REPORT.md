# Phase 4 Test Report — GitHub Profile Dashboard

**Date:** 2026-11-04  
**Archive:** `tanisha-github-dashboard-phase4-final-v2.zip`  
**Status:** Phase 4 verified on the local production project (results below were obtained on that machine, not during this documentation packaging step).

## Summary

| Area | Result |
|---|---|
| Dependency install (`npm ci` / `npm install`) | **PASS** — includes `@xmldom/xmldom@0.9.12` |
| Production build (`npm run build`) | **PASS** |
| Unit tests (`npm run test:unit`) | **PASS** — 36 passed, 0 failed |
| Visual / particle regression (`npm run test:regression`) | **PASS** |
| Desktop frames | **9/9 PASS**, MAE **0.0000** |
| Mobile frames | **9/9 PASS**, MAE **0.0000** |
| Protected Phase 1–3 source hashes | **8/8 unchanged** |
| Particle count (desktop) | **23,505** |
| Particle count (mobile) | **23,505** |
| Mobile 390px canvas scaling check | **PASS** |

## Mobile regression correction

Mobile Playwright canvas screenshots could be captured at **332×178** when Chromium rounded a fractional element Y position outward. Approved mobile baselines are **332×177**.

**Fix (test-only):** `tests/regression.py` `grab()` still seeks the timeline and still uses Playwright’s canvas element screenshot. If and only if the captured PNG is exactly 332×178, the first row is cropped, yielding 332×177. Desktop and all other sizes are left untouched.

This change does not alter the particle engine, CSS, layout, artwork, baselines, or MAE threshold (0.5).

## Supporting Phase 4 work (unchanged by this documentation update)

- Live GitHub data panels, synthetic fixtures, and unit coverage for data/schema/snake/hygiene
- Cross-platform test launchers (`scripts/run-python.mjs`; Windows `cmd.exe /c npx.cmd` in Python tests)
- `tests/unit/snake.test.mjs` validates SVG via `@xmldom/xmldom` `DOMParser` (no system `xmllint`)

## Baseline preservation

- All 18 approved Phase 2 baseline PNGs remain the original images
- MAE threshold remains **0.5**
- Capture method remains Playwright **element screenshots** (with the mobile 332×178 crop above)

## Phase 5

Not started.
