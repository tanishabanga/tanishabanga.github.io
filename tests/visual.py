"""Browser tests (Playwright/Chromium). Usage: python3 tests/visual.py [metrics|full]. Builds nothing; run `npm run build` first."""
import json, subprocess, sys, time, os, hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter1d
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SHOTS = os.path.join(ROOT, 'screenshots'); os.makedirs(SHOTS, exist_ok=True)

def _npx_cmd():
    """Return argv that launches npx cross-platform with shell=False.
    Windows: cmd.exe /c npx.cmd  (required so CreateProcess finds the .cmd shim)
    Unix:    npx
    """
    if sys.platform == "win32":
        return ["cmd.exe", "/c", "npx.cmd"]
    return ["npx"]
URL = 'http://localhost:4173/'; TOTAL = 38500; rep = {}; fails = []
def check(name, ok, info=''):
    rep[name] = {'pass': bool(ok), 'info': info}; print(('PASS ' if ok else 'FAIL ') + name, info)
    if not ok: fails.append(name)
def open_(pg, q=''):
    pg.goto(URL + q); pg.wait_for_function('window.__particles', timeout=30000); pg.wait_for_timeout(250)
def band_score(pg, path):  # vertical-banding: high-passed column means of the top strip of the canvas
    pg.locator('canvas').screenshot(path=path); im = np.asarray(Image.open(path).convert('L'), float); col = im[: max(4, int(im.shape[0] * .1))].mean(0)
    return float((col - uniform_filter1d(col, 31)).std())
WHITE = """() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let lit = 0, w = 0;
  for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i],d[i+1],d[i+2]); if (mx > 40) { lit++; if (Math.min(d[i],d[i+1],d[i+2]) > 215) w++ } } return [lit, w, c.width * c.height] }"""
def metrics(b):
    pg = b.new_page(viewport={'width': 1180, 'height': 900}); open_(pg, '?t=0'); worst = (0, 0)
    for t in range(0, TOTAL + 1, 500):
        pg.evaluate(f'window.__particles.seek({t})'); lit, w, area = pg.evaluate(WHITE); fr = w / area * 100
        if fr > worst[0]: worst = (fr, t)
    check('near-white pixel peak (% of canvas)', True, f'{worst[0]:.2f}% at t={worst[1]}ms'); rep['white_peak'] = worst
    for width, dpr in [(1180, 1), (1440, 1), (1920, 1), (390, 1), (1180, 2)]:
        ctx = b.new_context(viewport={'width': width, 'height': 900}, device_scale_factor=dpr); p = ctx.new_page()
        open_(p, '?t=10000'); a = band_score(p, f'/tmp/b{width}_{dpr}.png'); open_(p, '?t=10000&glow=0'); z = band_score(p, f'/tmp/bz{width}_{dpr}.png')
        check(f'banding score {width}px@{dpr}x', True, f'glow on={a:.3f}  glow off={z:.3f}'); rep[f'band_{width}_{dpr}'] = (a, z); ctx.close()
    pg.close()
def full(b):
    errs = []; bad = []; pg = b.new_page(viewport={'width': 1180, 'height': 900}); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
    open_(pg, '?t=10000'); a = hashlib.md5(pg.locator('canvas').screenshot()).hexdigest(); open_(pg, '?t=10000'); check('deterministic frame', a == hashlib.md5(pg.locator('canvas').screenshot()).hexdigest())
    imgs = pg.evaluate("[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)"); check('no broken <img>', not imgs, str(imgs)); check('no 4xx/5xx responses', not bad, str(bad))
    pg.evaluate(f'window.__particles.seek({TOTAL - 5})'); x = np.asarray(Image.open(__import__('io').BytesIO(pg.locator('canvas').screenshot())).convert('L'), float)
    pg.evaluate(f'window.__particles.seek({TOTAL + 5})'); y = np.asarray(Image.open(__import__('io').BytesIO(pg.locator('canvas').screenshot())).convert('L'), float)
    check('seamless loop seam', np.abs(x - y).mean() < 2.0, f'mean abs diff {np.abs(x - y).mean():.2f}')
    for name, t in [('developer-formed', 12000), ('developer-forming', 5200), ('developer-disintegrating', 20300), ('github-morph', 21800)]:
        pg.evaluate(f'window.__particles.seek({t})'); pg.locator('canvas').screenshot(path=f'{SHOTS}/{name}.png')
    # live: start/stop, cursor, resize
    open_(pg); pg.wait_for_timeout(9000); f1 = pg.evaluate('window.__particles.frames()'); pg.wait_for_timeout(500); f2 = pg.evaluate('window.__particles.frames()'); check('animation running', f2 > f1 + 5, f'{f1}->{f2}')
    box = pg.locator('canvas').bounding_box(); cx, cy = box['x'] + box['width'] * .52, box['y'] + box['height'] * .45
    pg.mouse.move(box['x'] + 5, box['y'] + 5); pg.wait_for_timeout(300); clip = {'x': cx - 60, 'y': cy - 60, 'width': 120, 'height': 120}
    g = lambda: np.asarray(Image.open(__import__('io').BytesIO(pg.screenshot(clip=clip))).convert('L'), float)
    n0 = g(); pg.wait_for_timeout(120); n1 = g(); nat = np.abs(n0 - n1).mean(); pg.mouse.move(cx, cy, steps=6); pg.wait_for_timeout(500); m = g(); pg.mouse.move(box['x'] + 5, box['y'] + 5); pg.wait_for_timeout(1200)
    check('cursor repulsion changes nearby particles', np.abs(m - n1).mean() > 2 * nat + 1, f'with cursor {np.abs(m - n1).mean():.2f} vs natural {nat:.2f}')
    pg.evaluate('window.__particles.stop()'); pg.wait_for_timeout(200); s1 = pg.evaluate('window.__particles.frames()'); pg.wait_for_timeout(600); check('stop() halts the loop', pg.evaluate('window.__particles.frames()') == s1)
    pg.evaluate('window.__particles.start()'); pg.wait_for_timeout(400); check('start() resumes', pg.evaluate('window.__particles.frames()') > s1)
    for w, h in [(320, 700), (390, 800), (768, 1000), (1180, 900), (1440, 900), (1920, 1080)]:
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(400); o = pg.evaluate('(()=>{const c=document.querySelector("canvas");return [document.documentElement.scrollWidth, innerWidth, c.clientWidth, c.clientHeight, c.width, c.height]})()')
        check(f'no overflow + undistorted canvas @{w}', o[0] <= o[1] and abs(o[3] / o[2] - 346 / 650) < .01 and abs(o[5] / o[4] - 346 / 650) < .01, str(o))
    pg.set_viewport_size({'width': 1180, 'height': 900}); open_(pg, '?t=10000'); pg.screenshot(path=f'{SHOTS}/full-dashboard.png', full_page=True)
    pg.set_viewport_size({'width': 390, 'height': 800}); pg.wait_for_timeout(500); pg.screenshot(path=f'{SHOTS}/mobile-dashboard.png', full_page=True)
    check('no console errors', not errs, str(errs)); pg.close()
    c = b.new_context(viewport={'width': 1180, 'height': 900}, reduced_motion='reduce'); p = c.new_page(); open_(p); p.wait_for_timeout(1500); r1 = p.evaluate('window.__particles.frames()'); p.wait_for_timeout(1000)
    check('reduced-motion: static formed frame, no loop', p.evaluate('window.__particles.frames()') == r1 and p.evaluate(WHITE)[0] > 5000, f'frames={r1}'); p.locator('canvas').screenshot(path=f'{SHOTS}/reduced-motion.png'); c.close()
    c = b.new_context(viewport={'width': 1180, 'height': 900}, record_video_dir='/tmp/vid', record_video_size={'width': 1180, 'height': 900}); p = c.new_page(); open_(p); p.wait_for_timeout(34000); c.close()
if __name__ == '__main__':
    srv = subprocess.Popen(_npx_cmd() + ['vite', 'preview', '--port', '4173'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(3)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); (metrics if (sys.argv + ['full'])[1] == 'metrics' else lambda b: (metrics(b), full(b)))(b); b.close()
    finally: srv.terminate()
    json.dump(rep, open(os.path.join(ROOT, 'tests', 'last-report.json'), 'w'), indent=1, default=str); print('FAILED:', fails or 'none'); sys.exit(1 if fails else 0)
