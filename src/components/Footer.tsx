import { site } from '../config/site'
export const Footer = () => (<footer className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 rounded-xl border border-edge bg-panel/90 px-4 py-2.5 text-[11px] text-dim">
  <b className="font-normal text-emerald">{site.footerPrompt}</b><span className="hidden sm:inline">|</span><span>{site.footerTagline}</span>
  <span className="sm:ml-auto">built by {site.builtBy} <span className="text-pink">♥</span></span></footer>)
