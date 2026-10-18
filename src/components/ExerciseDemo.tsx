import { useEffect, useRef, useState } from 'react'
import type { DemoKey } from '../types'
import ExerciseFigure from './ExerciseFigure'

const SUPPORTED: DemoKey[] = ['squat', 'pushup', 'lunge', 'jack']
export default function ExerciseDemo({ demo, playing = true, speed = 1, compact = false }: { demo: DemoKey; playing?: boolean; speed?: number; compact?: boolean }) {
  const [original, setOriginal] = useState(false)
  const [failed, setFailed] = useState(false)
  const [localPlay, setLocalPlay] = useState(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const frame = useRef<HTMLIFrameElement>(null)
  const active = playing && localPlay
  const sync = () => frame.current?.contentWindow?.postMessage({ type: 'movement3d-control', playing: active, speed }, window.location.origin)
  useEffect(() => { sync() }, [active, speed, demo, original])
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'movement3d-ready') sync()
      if (e.data?.type === 'movement3d-error') { setFailed(true); setOriginal(true) }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [active, speed, demo, original])
  if (!SUPPORTED.includes(demo)) return <ExerciseFigure demo={demo} playing={playing} speed={speed} />
  return <div className={`exercise-demo ${compact ? 'compact' : ''}`}>
    <div className="demo-mode"><span>{original ? '原動畫' : '3D · 稍豐腴體型'}</span><div>
      {!compact && <button onClick={() => setLocalPlay(!localPlay)} aria-pressed={localPlay}>{localPlay ? '暫停示範' : '播放示範'}</button>}
      <button onClick={() => { setFailed(false); setOriginal(!original) }}>{original ? '3D 模型' : '原動畫'}</button>
    </div></div>
    {failed && <p role="status" className="demo-fallback">3D 無法載入，已切回原動畫。</p>}
    {original ? <ExerciseFigure demo={demo} playing={active} speed={speed} /> : <Frame key={demo} demo={demo} frameRef={frame} onLoad={sync} />}
  </div>
}
function Frame({ demo, frameRef, onLoad }: { demo: DemoKey; frameRef: React.RefObject<HTMLIFrameElement>; onLoad: () => void }) {
  return <iframe ref={frameRef} src={`${import.meta.env.BASE_URL}movement3d/index.html?exercise=${demo}&playing=false`} onLoad={onLoad} title="可旋轉的 3D 動作示範" className="movement-frame" />
}
