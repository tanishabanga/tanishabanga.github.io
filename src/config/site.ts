// Central config. Only owner-supplied values live here. null = not provided (never invented).
const username = 'tanishabanga'
export const site = {
  githubUsername: username,
  terminalTitle: 'tanisha@portfolio:~', // preserved exactly per owner
  footerPrompt: 'tanisha@github:~',
  tagline: 'code • build • repeat',
  footerTagline: 'keep learning, keep building...',
  builtBy: 'Tanisha Banga',
  info: [
    ['Name', 'Tanisha Banga'], ['Role', 'CSE Student | Software Developer'],
    ['Education', 'B.Tech in Computer Science Engineering'], ['College', 'Lovely Professional University'],
    ['Location', 'Punjab, India'], ['Status', 'Building • Learning • Shipping'],
  ] as const,
  links: {
    github: { label: 'GitHub', url: `https://github.com/${username}` as string | null },
    linkedin: { label: 'LinkedIn', url: `https://www.linkedin.com/in/${username}` as string | null },
    email: { label: 'Email', url: 'mailto:tanishabanga1107@gmail.com' as string | null },
    leetcode: { label: 'LeetCode', url: null as string | null }, // TODO: not supplied by owner
  },
}
