"""Phase 4 browser tests (Playwright/Chromium). Run `npm run build` first. Uses SYNTHETIC data injected by request interception;
it proves the rendering code, NOT the live GitHub API. Writes tests/last-phase4.json and screenshots/phase4-*.png (synthetic-data captures)."""
import json, os, sys, subprocess, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SHOTS = os.path.join(ROOT, 'screenshots'); URL = 'http://localhost:4173/'

def _npx_cmd():
    """Return argv that launches npx cross-platform with shell=False.
    Windows: cmd.exe /c npx.cmd  (required so CreateProcess finds the .cmd shim)
    Unix:    npx
    """
    if sys.platform == "win32":
        return ["cmd.exe", "/c", "npx.cmd"]
    return ["npx"]
res, fails = [], []
def check(n, ok, info=''):
    res.append({'name': n, 'pass': bool(ok), 'info': info}); print(('PASS ' if ok else 'FAIL ') + n, info)
    if not ok: fails.append(n)
def wait_up():
    for _ in range(60):
        try: urllib.request.urlopen(URL, timeout=1); return
        except Exception: time.sleep(.5)
    raise RuntimeError('server did not start')
def serve(page, tmp, mode):
    def data(route, request=None):
        if mode == 'ok': route.fulfill(path=os.path.join(tmp, 'github.json'), content_type='application/json')
        elif mode == 'error': route.fulfill(status=500, body='nope')
        else: route.continue_()  # the real placeholder (status: not-generated)
    page.route('**/data/github.json*', data)
    for f in ('snake.svg', 'snake-static.svg'):
        page.route(
            f'**/data/{f}*',
            lambda route, request, f=f: route.fulfill(
                path=os.path.join(tmp, f),
                content_type='image/svg+xml',
            ),
        )
def main():
    tmp = tempfile.mkdtemp(); subprocess.run(['node', 'tests/fixtures/build-fixture.mjs', tmp], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    srv = subprocess.Popen(_npx_cmd() + ['vite', 'preview', '--port', '4173'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); wait_up()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); run(b, tmp); b.close()
    finally: srv.terminate()
    json.dump(res, open(os.path.join(ROOT, 'tests', 'last-phase4.json'), 'w'), indent=1); print('FAILED:', fails or 'none'); return 1 if fails else 0
def run(b, tmp):
    for w, h in [(320, 700), (390, 800), (768, 1000), (1180, 900), (1440, 900), (1920, 1080)]:
        errs, bad = [], []; pg = b.new_page(viewport={'width': w, 'height': h}); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None); serve(pg, tmp, 'ok'); pg.goto(URL + '?t=12000'); pg.wait_for_selector('[data-stat]'); pg.wait_for_selector('img[data-snake]')
        pg.wait_for_function('document.querySelector("img[data-snake]").complete'); pg.wait_for_timeout(300)
        stat = lambda k: pg.inner_text(f'[data-stat={k}] div:first-child')
        check(f'@{w} stats from data (0 shown as 0)', (stat('repositories'), stat('followers'), stat('following')) == ('9', '11', '0'), str((stat('repositories'), stat('followers'), stat('following'))))
        langs = pg.eval_on_selector_all('[data-lang]', 'els => els.map(e => [e.dataset.lang, e.innerText])')
        check(f'@{w} language rows: top four + Other, Python first', [l[0] for l in langs] == ['Python', 'JavaScript', 'HTML', 'CSS', 'Other'], str([l[0] for l in langs]))
        check(f'@{w} snake image decoded', pg.evaluate('document.querySelector("img[data-snake]").naturalWidth') > 0)
        ov = pg.evaluate('[document.documentElement.scrollWidth, innerWidth]'); check(f'@{w} no horizontal overflow', ov[0] <= ov[1], str(ov))
        escaped = pg.evaluate("""() => [...document.querySelectorAll('section')].flatMap(s => { const r = s.getBoundingClientRect(); return [...s.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > r.right + 1 || q.left < r.left - 1) }).map(e => s.querySelector('h2').textContent + ':' + e.tagName) })""")
        check(f'@{w} nothing escapes its panel', not escaped, str(escaped[:5]))
        check(f'@{w} email link', pg.get_attribute('a[href^="mailto:"]', 'href') == 'mailto:tanishabanga1107@gmail.com')
        check(f'@{w} seven panels present', pg.eval_on_selector_all('section h2', 'e => e.map(x => x.textContent)') == ['Workspace.View', 'System.Info', 'Connect', 'Tech Stack', 'GitHub Stats', 'Top Languages', 'Contribution Snake'])
        check(f'@{w} no console errors / failed requests', not errs and not bad, str((errs, bad)))
        if w in (390, 1180): pg.screenshot(path=os.path.join(SHOTS, f'phase4-synthetic-{w}.png'), full_page=True)
        pg.close()
    for mode, sel in [('empty', '[data-state=empty]'), ('error', '[data-state=error]')]:
        pg = b.new_page(viewport={'width': 1180, 'height': 900}); serve(pg, tmp, mode); pg.goto(URL + '?t=12000'); pg.wait_for_selector(sel)
        check(f'state {mode}: all three panels show it (no fake numbers)', pg.locator(sel).count() == 3 and pg.locator('[data-stat]').count() == 0); pg.close()
    ctx = b.new_context(viewport={'width': 1180, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page(); serve(pg, tmp, 'ok'); pg.goto(URL + '?t=12000'); pg.wait_for_selector('img[data-snake]')
    check('reduced motion uses the static snake', 'snake-static.svg' in pg.get_attribute('img[data-snake]', 'src')); ctx.close()
if __name__ == '__main__': raise SystemExit(main())
