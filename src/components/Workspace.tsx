import { useRef } from 'react'
import { Panel } from './Panel'
import { theme } from '../config/theme'
import { useParticles } from '../engine/useParticles'
export function Workspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useParticles(canvasRef)
  return (<Panel title="Workspace.View" hint="developer : particles : form" className="h-full">
    <div className="relative w-full overflow-hidden rounded-lg bg-bg" style={{aspectRatio:theme.stage.aspect}}>
      <canvas ref={canvasRef} role="img" aria-label="Developer illustration rendered as animated particles" className="absolute inset-0 size-full mix-blend-screen"/>
    </div></Panel>)
}
