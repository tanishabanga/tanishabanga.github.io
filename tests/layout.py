"""Phase 3 layout + logo tests (Playwright/Chromium). Run `npm run build` first. Writes screenshots/phase3-*.png, tech-stack-closeup.png, screenshots/breakpoints/*.png"""
import json, os, sys, subprocess, time, urllib.request
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SHOTS = os.path.join(ROOT, 'screenshots'); os.makedirs(os.path.join(SHOTS, 'breakpoints'), exist_ok=True)

def _npx_cmd():
    """Return argv that launches npx cross-platform with shell=False.
    Windows: cmd.exe /c npx.cmd  (required so CreateProcess finds the .cmd shim)
    Unix:    npx
    """
    if sys.platform == "win32":
        return ["cmd.exe", "/c", "npx.cmd"]
    return ["npx"]
URL = 'http://localhost:4173/'; res = []; fails = []
EXPECT = {'Languages': ['C++', 'Python', 'Java', 'JavaScript', 'SQL'], 'Frontend': ['HTML', 'CSS', 'React', 'Tailwind CSS'], 'Backend': ['Node.js', 'Express.js'],
          'Database': ['MongoDB', 'SQL'], 'AI / ML': ['NumPy', 'Pandas', 'Matplotlib', 'scikit-learn'], 'Tools': ['Git', 'GitHub', 'VS Code', 'Docker']}
PANELS = ['Workspace.View', 'System.Info', 'Connect', 'Tech Stack', 'GitHub Stats', 'Top Languages', 'Contribution Snake']
def check(name, ok, info=''):
    res.append({'name': name, 'pass': bool(ok), 'info': info}); print(('PASS ' if ok else 'FAIL ') + name, info)
    if not ok: fails.append(name)
def wait_up():
    for _ in range(60):
        try: urllib.request.urlopen(URL, timeout=1); return
        except Exception: time.sleep(.5)
    raise RuntimeError('server did not start')
TECH = """() => [...document.querySelectorAll('[data-tech-group]')].map(g => { const r = g.getBoundingClientRect();
  return { title: g.dataset.techGroup, x: r.x, y: r.y, right: r.right, bottom: r.bottom, items: [...g.querySelectorAll('[data-tech-item]')].map(it => { const ic = it.querySelector('img,svg'), lb = it.querySelector('span:last-child'), ir = ic.getBoundingClientRect(), lr = lb.getBoundingClientRect(), tr = it.getBoundingClientRect();
    const nat = ic.tagName === 'IMG' ? ic.naturalWidth : 1; const painted = ic.tagName === 'IMG' ? nat > 0 : !!ic.querySelector('path[d]');
    return { label: lb.textContent, top: tr.y, right: tr.right, iw: ir.width, ih: ir.height, iy: ir.y, ly: lr.y, lh: lr.height, painted, lw: lb.scrollWidth, lcw: lb.clientWidth } }) } })"""
def main():
    srv = subprocess.Popen(_npx_cmd() + ['vite', 'preview', '--port', '4173'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); wait_up()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); run(b); b.close()
    finally: srv.terminate()
    json.dump(res, open(os.path.join(ROOT, 'tests', 'last-layout.json'), 'w'), indent=1); print('FAILED:', fails or 'none'); return 1 if fails else 0
def run(b):
    errs = []; bad = []
    for w, h in [(320, 700), (390, 800), (768, 1000), (1180, 900), (1440, 900), (1920, 1080)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}); pg = ctx.new_page()
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
        pg.goto(URL + '?t=12000'); pg.wait_for_function('window.__particles'); pg.wait_for_function("[...document.images].every(i=>i.complete)"); pg.wait_for_timeout(400)
        ov = pg.evaluate('[document.documentElement.scrollWidth, innerWidth]'); check(f'@{w} no horizontal overflow', ov[0] <= ov[1], str(ov))
        escaped = pg.evaluate("""() => [...document.querySelectorAll('section')].flatMap(s => { const r = s.getBoundingClientRect(); return [...s.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > r.right + 1 || q.left < r.left - 1) }).map(e => s.querySelector('h2').textContent + ':' + e.tagName) })""")
        check(f'@{w} nothing escapes its panel', not escaped, str(escaped[:5]))
        g = pg.evaluate(TECH); check(f'@{w} six categories with the right items', {x['title']: [i['label'] for i in x['items']] for x in g} == EXPECT)
        its = [i for x in g for i in x['items']]
        check(f'@{w} every logo painted', all(i['painted'] for i in its), str([i['label'] for i in its if not i['painted']]))
        check(f'@{w} identical icon boxes (36x36)', all(abs(i['iw'] - 36) < .5 and abs(i['ih'] - 36) < .5 for i in its))
        check(f'@{w} labels not clipped', all(i['lw'] <= i['lcw'] + 1 for i in its), str([i['label'] for i in its if i['lw'] > i['lcw'] + 1]))
        for x in g: check(f'@{w} {x["title"]}: logos share one baseline row' if w >= 1024 else f'@{w} {x["title"]}: items stay inside the group', (len({round(i['iy']) for i in x['items']}) == 1) if w >= 1024 else all(i['right'] <= x['right'] + 1 for i in x['items']))
        if w >= 1024:
            check(f'@{w} labels single-line', all(i['lh'] < 18 for i in its), str(sorted({round(i['lh']) for i in its})))
            d = {x['title']: x for x in g}; r1 = [d[t] for t in ['Languages', 'Frontend', 'Backend']]; r2 = [d[t] for t in ['Database', 'AI / ML', 'Tools']]
            check(f'@{w} 3 columns x 2 rows', len({round(x['y']) for x in r1}) == 1 and len({round(x['y']) for x in r2}) == 1 and r2[0]['y'] > r1[0]['bottom'] - 1 and all(r1[i]['x'] < r1[i + 1]['x'] for i in range(2)) and all(abs(r1[i]['x'] - r2[i]['x']) < 1 for i in range(3)))
            check(f'@{w} SQL stays in Languages row', len({round(i['iy']) for i in d['Languages']['items']}) == 1)
        else:
            tops = [x['y'] for x in g]; check(f'@{w} categories stack top-to-bottom (2-col allowed)', all(tops[i] <= tops[i + 1] + 1 for i in range(len(tops) - 1)))
        heads = pg.evaluate("[...document.querySelectorAll('h2')].map(h => h.textContent.trim())"); check(f'@{w} panel names + order', [x.lower() for x in heads] == [x.lower() for x in PANELS], str(heads))
        if w == 390: check('mobile section order: header, workspace first, footer last', pg.evaluate("(()=>{const m=document.querySelector('main').children;return m[0].textContent.includes('tanisha@portfolio:~')&&m[m.length-1].textContent.includes('tanisha@github:~')})()"))
        pg.screenshot(path=os.path.join(SHOTS, 'breakpoints', f'{w}.png'), full_page=True)
        if w == 1180:
            pg.screenshot(path=os.path.join(SHOTS, 'phase3-desktop.png'), full_page=True)
        if w == 390: pg.screenshot(path=os.path.join(SHOTS, 'phase3-mobile.png'), full_page=True)
        ctx.close()
    ctx = b.new_context(viewport={'width': 1180, 'height': 900}, device_scale_factor=2); pg = ctx.new_page(); pg.goto(URL + '?t=12000'); pg.wait_for_function("[...document.images].every(i=>i.complete)"); pg.wait_for_timeout(400)
    pg.locator('section', has=pg.locator('h2', has_text='Tech Stack')).screenshot(path=os.path.join(SHOTS, 'tech-stack-closeup.png')); ctx.close()
    check('no console errors', not errs, str(errs)); check('no 4xx/5xx responses', not bad, str(bad))
sys.exit(main())
