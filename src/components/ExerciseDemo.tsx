import { useEffect, useRef, useState } from 'react'
import type { DemoKey } from '../types'
import ExerciseFigure from './ExerciseFigure'
import { TARGETS, targetLabels } from './figure/anatomy'

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
  const muscles = targetLabels(TARGETS[demo])
  return <div className={`exercise-demo ${compact ? 'compact' : ''}`}>
    <div className="demo-mode"><span>動作示範</span><div>
      {!compact && <button onClick={() => setLocalPlay(!localPlay)} aria-pressed={localPlay}>{localPlay ? '暫停示範' : '播放示範'}</button>}
      <button onClick={() => { setFailed(false); setOriginal(!original) }}>{original ? '立體示範' : '簡易示範'}</button>
    </div></div>
    {compact && <p className="demo-targets"><span>紅色主要：{muscles.p.join("、")}</span><span>橘色輔助：{muscles.s.join("、")}</span></p>}
    {failed && <p role="status" className="demo-fallback">立體示範暫時無法載入，已切換簡易示範。</p>}
    {original ? <ExerciseFigure demo={demo} playing={active} speed={speed} /> : <Frame key={demo} demo={demo} frameRef={frame} onLoad={sync} />}
  </div>
}
function Frame({ demo, frameRef, onLoad }: { demo: DemoKey; frameRef: React.RefObject<HTMLIFrameElement>; onLoad: () => void }) {
  return <iframe ref={frameRef} src={`${import.meta.env.BASE_URL}movement3d/index.html?exercise=${demo}&playing=false`} onLoad={onLoad} title="三個固定視角的動作示範" className="movement-frame" />
}
