import { resolve, fillFor, type IconSpec } from '../icons/registry'
// Renders inside a fixed square box; object-contain keeps every logo's native aspect ratio (never stretched).
export function Icon({ spec, size = 36 }: { spec: IconSpec; size?: number }) {
  const r = resolve(spec), box = { width: size, height: size }
  if (!r) return <span title={`No icon source for ${spec.label}`} className="grid place-items-center rounded border border-dashed border-pink text-[9px] text-pink" style={box}>n/a</span>
  if ('file' in r) return <img src={r.file} alt={spec.label} width={size} height={size} style={box} className="block object-contain" draggable={false} data-logo={spec.provider}/>
  return <svg role="img" aria-label={spec.label} viewBox="0 0 24 24" width={size} height={size} style={box} className="block" data-logo={spec.provider}><path d={r.path} fill={fillFor(r.hex)}/></svg>
}
