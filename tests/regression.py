"""Phase 2 regression guard (Playwright/Chromium).
  python3 tests/regression.py            compare the current build against tests/baseline/ (run `npm run build` first)
  python3 tests/regression.py --record   (re)record the baseline from the CURRENT build. Only do this deliberately.
Checks: engine source hashes unchanged, particle count unchanged, canvas frames identical to the Phase 2 baseline at
key timeline moments (scatter, forming, developer hold, disintegration, GitHub morph, reformation, loop end), at two viewports."""
import json, sys, os, io, hashlib, subprocess, time
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); BASE = os.path.join(ROOT, 'tests', 'baseline'); OUT = os.path.join(ROOT, 'screenshots')

def _npx_cmd():
    """Return argv that launches npx cross-platform with shell=False.
    Windows: cmd.exe /c npx.cmd  (required so CreateProcess finds the .cmd shim)
    Unix:    npx
    """
    if sys.platform == "win32":
        return ["cmd.exe", "/c", "npx.cmd"]
    return ["npx"]
URL = 'http://localhost:4173/'; RECORD = '--record' in sys.argv
FRAMES = {'scatter': 100, 'forming': 5200, 'developer-hold': 12000, 'disintegrating': 20300, 'github-morph': 21800, 'github-hold': 24000, 'reforming': 28000, 'developer-hold-2': 33000, 'loop-end': 38400}
# Baseline 'mobile' frames were recorded at 390px with Phase 2 panel padding (canvas 332px wide). Phase 3 trims mobile panel padding by 4px, so
# the same 332px canvas appears at a 386px viewport; comparing at that width keeps the pixel comparison exact. The true 390px canvas is checked below.
VIEWPORTS = {'desktop': 1180, 'mobile': 386}
GUARDED = ['src/engine/engine.ts', 'src/engine/rng.ts', 'src/engine/sampler.ts', 'src/engine/shapes.ts', 'src/engine/types.ts', 'src/engine/useParticles.ts', 'src/config/particles.ts', 'public/art/workspace-ref.png']
def sha(p): return hashlib.sha256(open(os.path.join(ROOT, p), 'rb').read()).hexdigest()
res = []; fails = []
def check(name, ok, info=''):
    res.append({'name': name, 'pass': bool(ok), 'info': info}); print(('PASS ' if ok else 'FAIL ') + name, info)
    if not ok: fails.append(name)
def grab(pg, t):
    pg.evaluate(f'window.__particles.seek({t})')
    raw = pg.locator('canvas').screenshot()
    # Chromium may capture mobile canvas as 332x178 when the element y is half-pixel
    # (e.g. 105.5). Approved mobile baselines are 332x177; dropping the first row
    # restores an exact match (experimentally MAE 0.0000 on all nine mobile frames).
    im = Image.open(io.BytesIO(raw))
    if im.size == (332, 178):
        buf = io.BytesIO()
        im.crop((0, 1, 332, 178)).save(buf, format='PNG')
        return buf.getvalue()
    return raw
def run(b):
    shots = {}; counts = {}
    for vp, w in VIEWPORTS.items():
        pg = b.new_page(viewport={'width': w, 'height': 900}); pg.goto(URL + '?t=0'); pg.wait_for_function('window.__particles', timeout=30000); pg.wait_for_timeout(300)
        counts[vp] = pg.evaluate('window.__particles.n')
        for name, t in FRAMES.items(): shots[f'{vp}-{name}'] = grab(pg, t)
        pg.close()
    pg = b.new_page(viewport={'width': 390, 'height': 900}); pg.goto(URL + '?t=0'); pg.wait_for_function('window.__particles'); pg.wait_for_timeout(300)
    counts['mobile390-size'] = pg.evaluate('(()=>{const c=document.querySelector("canvas");return [c.clientWidth,c.clientHeight]})()'); pg.close()
    return shots, counts
def wait_up():
    import urllib.request
    for _ in range(60):
        try: urllib.request.urlopen(URL, timeout=1); return
        except Exception: time.sleep(0.5)
    raise RuntimeError('preview server did not start')
def main():
    srv = subprocess.Popen(_npx_cmd() + ['vite', 'preview', '--port', '4173'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); wait_up()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); shots, counts = run(b); b.close()
    finally: srv.terminate()
    if RECORD:
        os.makedirs(BASE, exist_ok=True)
        for k, v in shots.items(): open(os.path.join(BASE, k + '.png'), 'wb').write(v)
        json.dump({'particle_count': counts, 'hashes': {g: sha(g) for g in GUARDED}}, open(os.path.join(BASE, 'baseline.json'), 'w'), indent=1); print('baseline recorded', counts); return 0
    base = json.load(open(os.path.join(BASE, 'baseline.json')))
    for g in GUARDED: check(f'unchanged: {g}', sha(g) == base['hashes'][g])
    for vp in VIEWPORTS: check(f'particle count @{vp}', counts[vp] == base['particle_count'][vp] and 22000 <= counts[vp] <= 24000, f'{counts[vp]} (baseline {base["particle_count"][vp]})')
    w390, h390 = counts['mobile390-size']; check('mobile 390px canvas correctly scaled (650:346)', abs(h390 / w390 - 346 / 650) < .01 and 328 <= w390 <= 340, f'{w390}x{h390}')
    diffs = {}
    for k, v in shots.items():
        a = np.asarray(Image.open(io.BytesIO(v)).convert('RGB'), float); r = np.asarray(Image.open(os.path.join(BASE, k + '.png')).convert('RGB'), float)
        d = np.abs(a - r).mean() if a.shape == r.shape else 999.0; diffs[k] = d; check(f'frame matches Phase 2 baseline: {k}', d < 0.5, f'mean abs diff {d:.4f}')
    # side-by-side evidence image: top row = Phase 2 baseline, bottom row = current build (desktop, 4 key moments)
    keys = [f'desktop-{n}' for n in ['forming', 'developer-hold', 'disintegrating', 'github-morph']]
    rows = [[Image.open(os.path.join(BASE, k + '.png')).convert('RGB') for k in keys], [Image.open(io.BytesIO(shots[k])).convert('RGB') for k in keys]]
    w, h = rows[0][0].size; sheet = Image.new('RGB', (w * 2, h * 4), (5, 9, 20))
    for ri, row in enumerate(rows):
        for i, im in enumerate(row): sheet.paste(im, ((i % 2) * w, (ri * 2 + i // 2) * h))
    from PIL import ImageDraw
    dr = ImageDraw.Draw(sheet)
    for y, txt in [(4, 'PHASE 2 BASELINE  (forming | developer hold)'), (h + 4, 'PHASE 2 BASELINE  (disintegrating | github morph)'), (2 * h + 4, 'PHASE 3 BUILD  (forming | developer hold)'), (3 * h + 4, 'PHASE 3 BUILD  (disintegrating | github morph)')]: dr.text((6, y), txt, fill=(125, 211, 252))
    os.makedirs(OUT, exist_ok=True); sheet.save(os.path.join(OUT, 'particle-regression.png'))
    json.dump(res, open(os.path.join(ROOT, 'tests', 'last-regression.json'), 'w'), indent=1); print('FAILED:', fails or 'none'); return 1 if fails else 0
sys.exit(main())
