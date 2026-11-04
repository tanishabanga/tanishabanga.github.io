// Secret hygiene. Every string that could reach a log, an error or a file goes through redact().
const TOKEN_PATTERNS = [/gh[pousr]_[A-Za-z0-9]{20,}/g, /github_pat_[A-Za-z0-9_]{20,}/g, /Bearer\s+[A-Za-z0-9._-]{8,}/gi]
export function redact(text, secrets = []) {
  let out = String(text)
  for (const s of secrets) if (s && s.length >= 4) out = out.split(s).join('***')
  for (const p of TOKEN_PATTERNS) out = out.replace(p, '***')
  return out
}
// Used by tests and by the scripts as a last gate before writing: returns the patterns that match.
export function findSecrets(text) {
  const hits = []
  for (const p of [...TOKEN_PATTERNS, /authorization\s*[:=]/i]) { p.lastIndex = 0; if (p.test(text)) hits.push(String(p)) }
  return hits
}
