// SYNTHETIC test fixtures. Invented numbers used only by unit tests; never written to public/data.
export function syntheticCalendar(startIso = '2025-11-02', weeks = 4, pattern = (i) => (i % 3 === 0 ? i % 5 : 0)) {
  const out = []; const t0 = new Date(startIso + 'T00:00:00Z').getTime(); let i = 0
  for (let w = 0; w < weeks; w++) { const days = []; for (let d = 0; d < 7; d++, i++) { const c = pattern(i); days.push({ date: new Date(t0 + i * 864e5).toISOString().slice(0, 10), contributionCount: c, contributionLevel: c === 0 ? 'NONE' : c < 2 ? 'FIRST_QUARTILE' : c < 3 ? 'SECOND_QUARTILE' : c < 4 ? 'THIRD_QUARTILE' : 'FOURTH_QUARTILE' }) } out.push({ contributionDays: days }) }
  return out
}
export function syntheticUser(login = 'tanishabanga', over = {}) {
  const weeks = syntheticCalendar(); const total = weeks.flatMap((w) => w.contributionDays).reduce((a, d) => a + d.contributionCount, 0)
  return { login, followers: { totalCount: 7 }, following: { totalCount: 3 }, repositories: { totalCount: 4 }, contributionsCollection: { contributionCalendar: { totalContributions: total, weeks } }, ...over }
}
export const repo = (name, o = {}) => ({ name, fork: false, archived: false, private: false, owner: { login: 'tanishabanga' }, ...o })
