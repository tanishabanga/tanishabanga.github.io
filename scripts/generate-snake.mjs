#!/usr/bin/env node
// Reads public/data/github.json (produced by fetch-github-data.mjs) and writes snake.svg + snake-static.svg. No network, no credentials.
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { OUTPUT_DIR, JSON_FILE, SNAKE_FILE, SNAKE_STATIC_FILE } from './lib/config.mjs'
import { renderSnake } from './lib/snake.mjs'
import { findSecrets } from './lib/redact.mjs'
async function main() {
  const doc = JSON.parse(await readFile(join(OUTPUT_DIR, JSON_FILE), 'utf8'))
  if (doc.status !== 'ok' || doc.calendar?.status !== 'ok') throw new Error(`${JSON_FILE} has no live calendar (status: ${doc.status}). Run fetch-github-data first.`)
  for (const [file, animate] of [[SNAKE_FILE, true], [SNAKE_STATIC_FILE, false]]) {
    const svg = renderSnake({ days: doc.calendar.days, username: doc.username, total: doc.stats.contributions, animate })
    if (findSecrets(svg).length) throw new Error('Refusing to write SVG: credential-like text found')
    await writeFile(join(OUTPUT_DIR, file), svg)
  }
  console.log(`snake generated from ${doc.calendar.days.length} real days (${doc.calendar.from} .. ${doc.calendar.to})`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error('generate-snake FAILED:', e.message); process.exit(1) })
