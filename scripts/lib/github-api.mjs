// Minimal GitHub client on native fetch. The token lives only in the closure and in the Authorization header; it is never logged.
import { redact } from './redact.mjs'
const API = 'https://api.github.com'
export class GitHubError extends Error {}
export function createClient({ token, fetchImpl = globalThis.fetch, retries = 2, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  if (!token) throw new GitHubError('No token: set GITHUB_TOKEN (Actions provides it automatically) in the environment.')
  async function call(method, path, body) {
    let last
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchImpl(API + path, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'tanisha-dashboard-data', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
        if (res.status >= 500 && attempt < retries) { await sleep(500 * 2 ** attempt); continue }
        const text = await res.text(); let json = null; try { json = JSON.parse(text) } catch { /* non-JSON error page */ }
        if (!res.ok) throw new GitHubError(`GitHub ${res.status} on ${method} ${path}: ${json?.message ?? 'no message'}${res.status === 403 || res.status === 429 ? ' (rate limit or insufficient permission)' : ''}`)
        return json
      } catch (e) {
        last = e instanceof GitHubError ? e : new GitHubError(`Network error on ${method} ${path}: ${e?.message ?? e}`)
        if (last instanceof GitHubError && /^GitHub \d/.test(last.message)) break // HTTP errors are final (5xx handled above)
        if (attempt < retries) await sleep(500 * 2 ** attempt)
      }
    }
    throw new GitHubError(redact(last.message, [token]))
  }
  return {
    rest: (path) => call('GET', path),
    async graphql(query, variables) {
      const json = await call('POST', '/graphql', { query, variables })
      if (json?.errors?.length) throw new GitHubError(redact('GraphQL error: ' + json.errors.map((e) => e.message).join('; '), [token]))
      if (!json?.data) throw new GitHubError('GraphQL returned no data')
      return json.data
    },
  }
}
