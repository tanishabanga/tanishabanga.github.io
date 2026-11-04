// End-to-end of fetch-github-data's collect() with a MOCK GitHub client. Proves the wiring, NOT the live API.
import test from 'node:test'; import assert from 'node:assert/strict'
import { collect } from '../../scripts/fetch-github-data.mjs'
import { createClient } from '../../scripts/lib/github-api.mjs'
import { syntheticUser, repo } from '../fixtures/make.mjs'
import { findSecrets } from '../../scripts/lib/redact.mjs'
const mock = (over = {}) => ({
  graphql: async () => ({ user: syntheticUser() }),
  rest: async (p) => { if (over.rest) return over.rest(p)
    if (p.startsWith('/users/')) return [repo('a'), repo('fk', { fork: true }), repo('old', { archived: true }), repo('b')]
    if (p === '/repos/tanishabanga/a/languages') return { Python: 700, HTML: 100 }
    if (p === '/repos/tanishabanga/b/languages') return { Python: 100, CSS: 100 }
    throw new Error('unexpected request ' + p) } })
test('collect: forks/archived never get a language request; result is consistent', async () => {
  const seen = []; const c = mock({ rest: async (p) => { seen.push(p); return mock().rest(p) } })
  const doc = await collect({ client: c, login: 'tanishabanga', now: new Date('2026-03-01T00:00:00Z') })
  assert.ok(!seen.some((p) => p.includes('/fk/') || p.includes('/old/'))); assert.equal(doc.languages.items[0].name, 'Python'); assert.equal(doc.languages.items[0].bytes, 800)
  assert.equal(doc.languages.reposCounted, 2); assert.equal(doc.stats.repositories, 4); assert.equal(doc.generatedAt, '2026-03-01T00:00:00.000Z')
})
test('collect: a failed language request aborts the run (no partial/fake percentages)', async () => {
  const c = mock({ rest: async (p) => { if (p.endsWith('/b/languages')) throw new Error('boom'); return mock().rest(p) } })
  await assert.rejects(collect({ client: c, login: 'tanishabanga' }), /boom/)
})
test('client: token required; HTTP errors surface without leaking the token', async () => {
  assert.throws(() => createClient({ token: '' }), /No token/)
  const secret = 'ghs_' + 'a1B2c3D4e5F6g7H8i9J0k1L2'
  const f = async () => ({ ok: false, status: 401, text: async () => JSON.stringify({ message: `Bad credentials ${secret}` }) })
  const c = createClient({ token: secret, fetchImpl: f, sleep: async () => {} })
  await assert.rejects(c.rest('/x'), (e) => { assert.ok(!e.message.includes(secret)); assert.match(e.message, /401/); return true })
})
test('client: sends the token only in the Authorization header; retries 5xx then succeeds', async () => {
  let n = 0, hdr, url; const f = async (u, o) => { url = u; hdr = o.headers; return ++n < 2 ? { ok: false, status: 502, text: async () => '' } : { ok: true, status: 200, text: async () => '{"a":1}' } }
  const c = createClient({ token: 'tok-1234567', fetchImpl: f, sleep: async () => {} }); assert.deepEqual(await c.rest('/y?z=1'), { a: 1 })
  assert.equal(n, 2); assert.ok(!url.includes('tok-1234567')); assert.equal(hdr.Authorization, 'Bearer tok-1234567')
})
test('client: GraphQL errors become failures', async () => {
  const f = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ errors: [{ message: 'Resource not accessible by integration' }] }) })
  await assert.rejects(createClient({ token: 'tok-1234567', fetchImpl: f }).graphql('q', {}), /not accessible/)
})
test('collect output contains no credential-like text', async () => { assert.deepEqual(findSecrets(JSON.stringify(await collect({ client: mock(), login: 'tanishabanga' }))), []) })
