#!/usr/bin/env node
/**
 * Cross-platform Python launcher for npm scripts.
 * Tries (in order): py -3, python3, python.
 * Usage: node scripts/run-python.mjs tests/regression.py [--args]
 */
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const args = process.argv.slice(2)
if (!args.length) {
  console.error('usage: node scripts/run-python.mjs <script.py> [args...]')
  process.exit(2)
}

const candidates = process.platform === 'win32'
  ? [['py', '-3'], ['python'], ['python3']]
  : [['python3'], ['python'], ['py', '-3']]

let lastErr = null
for (const [bin, ...prefix] of candidates) {
  const r = spawnSync(bin, [...prefix, ...args], {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  })
  if (r.error && (r.error.code === 'ENOENT' || r.error.code === 'ENOTFOUND')) {
    lastErr = r.error
    continue
  }
  process.exit(r.status ?? 1)
}
console.error('No Python interpreter found (tried py -3, python3, python). Install Python 3.')
if (lastErr) console.error(String(lastErr))
process.exit(127)
