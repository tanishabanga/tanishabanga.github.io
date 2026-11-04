// Contribution calendar + snake as a self-contained SVG (SMIL animation, works inside <img>, also reusable for the Phase 5 README).
// Everything is derived from the fetched calendar: each cell is a real day; the snake eats cells that have contributions.
export const COLORS = { empty: '#0f1a3d', levels: ['#0f1a3d', '#0b5d46', '#12906a', '#22c08a', '#34d399'], head: '#38bdf8', body: '#8b5cf6' }
const CELL = 10, GAP = 3, PITCH = CELL + GAP, PAD = 6, SNAKE_LEN = 6, STEP_S = 0.06, REST_STEPS = 20

/** days (ascending, from GitHub) -> grid cells. Column = week (Sunday-start, as GitHub), row = weekday 0..6. */
export function layoutCells(days) {
  if (!days.length) return { cells: [], cols: 0 }
  const dow = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay()
  const first = new Date(days[0].date + 'T00:00:00Z').getTime()
  const startSunday = first - dow(days[0].date) * 864e5
  const cells = days.map((d) => {
    const t = new Date(d.date + 'T00:00:00Z').getTime()
    const col = Math.floor((t - startSunday) / (7 * 864e5))
    return { ...d, col, row: dow(d.date) }
  })
  return { cells, cols: Math.max(...cells.map((c) => c.col)) + 1 }
}

/** Serpentine path over existing cells: week 0 top->bottom, week 1 bottom->top, ... Returns cells in visiting order. */
export function snakePath(cells) {
  const byCol = new Map(); for (const c of cells) (byCol.get(c.col) ?? byCol.set(c.col, []).get(c.col)).push(c)
  const out = []; let down = true
  for (const col of [...byCol.keys()].sort((a, b) => a - b)) { const cs = byCol.get(col).sort((a, b) => a.row - b.row); out.push(...(down ? cs : cs.reverse())); down = !down }
  return out
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const cx = (c) => PAD + c.col * PITCH, cy = (c) => PAD + c.row * PITCH

export function renderSnake({ days, username, total, animate = true }) {
  if (!days.length) throw new Error('No contribution days: refusing to draw an empty calendar')
  const { cells, cols } = layoutCells(days), path = snakePath(cells)
  const W = PAD * 2 + cols * PITCH - GAP, H = PAD * 2 + 7 * PITCH - GAP
  const N = path.length, T = N + SNAKE_LEN + REST_STEPS, dur = (T * STEP_S).toFixed(2)
  const idx = new Map(path.map((c, i) => [c.date, i]))
  const kt = (i) => ((i + 0.5) / T).toFixed(5)
  let body = ''
  for (const c of cells) {
    const col = COLORS.levels[c.level], title = `<title>${esc(c.date)}: ${c.count} contribution${c.count === 1 ? '' : 's'}</title>`
    const eat = animate && c.count > 0 ? `<animate attributeName="fill" calcMode="discrete" dur="${dur}s" repeatCount="indefinite" values="${col};${COLORS.empty}" keyTimes="0;${kt(idx.get(c.date))}"/>` : ''
    body += `<rect x="${cx(c)}" y="${cy(c)}" width="${CELL}" height="${CELL}" rx="2" fill="${col}" data-date="${esc(c.date)}" data-count="${c.count}" data-level="${c.level}">${title}${eat}</rect>`
  }
  let snake = ''
  if (animate) {
    for (let k = SNAKE_LEN - 1; k >= 0; k--) { // draw tail first so the head ends on top
      const at = (s) => path[Math.min(Math.max(s - k, 0), N - 1)]
      const steps = Array.from({ length: N + SNAKE_LEN }, (_, s) => at(s)); steps.push(at(N + SNAKE_LEN)) // last point sits at keyTime 1 (required for linear animation)
      const xs = steps.map(cx).join(';'), ys = steps.map(cy).join(';')
      const kts = steps.map((_, s) => (s === steps.length - 1 ? 1 : s / T).toFixed(5)).join(';') // keyTimes 0..1; the group is hidden during the REST_STEPS tail
      const fill = k === 0 ? COLORS.head : COLORS.body, op = (1 - (k / SNAKE_LEN) * 0.6).toFixed(2)
      snake += `<rect width="${CELL}" height="${CELL}" rx="3" fill="${fill}" opacity="${op}" x="${xs.split(';')[0]}" y="${ys.split(';')[0]}"><animate attributeName="x" dur="${dur}s" repeatCount="indefinite" values="${xs}" keyTimes="${kts}"/><animate attributeName="y" dur="${dur}s" repeatCount="indefinite" values="${ys}" keyTimes="${kts}"/><animate attributeName="visibility" calcMode="discrete" dur="${dur}s" repeatCount="indefinite" values="visible;hidden" keyTimes="0;${((N + SNAKE_LEN) / T).toFixed(5)}"/></rect>`
    }
  }
  const desc = `Contribution calendar for @${username}: ${total ?? days.reduce((a, d) => a + d.count, 0)} contributions between ${days[0].date} and ${days.at(-1).date}${animate ? '; a snake eats the days that have contributions' : ''}.`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d"><title id="t">Contribution calendar of @${esc(username)}</title><desc id="d">${esc(desc)}</desc>${body}${snake}</svg>\n`
}
