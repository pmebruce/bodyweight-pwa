import { useEffect, useRef, useState } from 'react'
import type { DemoKey } from '../types'
import { TARGETS, targetLabels } from './figure/anatomy'
export default function ExerciseDemo({ demo, playing = true, speed = 1, compact = false, kg }: { demo: DemoKey; playing?: boolean; speed?: number; compact?: boolean; kg?: number }) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [localPlay, setLocalPlay] = useState(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const frame = useRef<HTMLIFrameElement>(null)
  const active = playing && localPlay
  const sync = () => frame.current?.contentWindow?.postMessage({ type: 'movement3d-control', playing: active, speed, kg }, window.location.origin)
  useEffect(() => { sync() }, [active, speed, demo, attempt, kg])
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'movement3d-ready') { setFailed(false); sync() }
      if (e.data?.type === 'movement3d-error') setFailed(true)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [active, speed, demo, attempt, kg])
  const muscles = targetLabels(TARGETS[demo])
  return <div className={`exercise-demo ${compact ? 'compact' : ''}`}>
    <div className="demo-mode"><span>動作示範</span><div>
      {!compact && <button onClick={() => setLocalPlay(!localPlay)} aria-pressed={localPlay}>{localPlay ? '暫停示範' : '播放示範'}</button>}
    </div></div>
    {compact && <p className="demo-targets"><span>紅色主要：{muscles.p.join('、')}</span><span>橘色輔助：{muscles.s.join('、')}</span></p>}
    {failed ? <div className="demo-unavailable" role="status"><p>示範暫時無法載入。</p><p>請重新載入後再試一次。</p><button onClick={() => { setFailed(false); setAttempt(attempt + 1) }}>重新載入示範</button></div> :
      <iframe key={`${demo}-${attempt}`} ref={frame} src={`${import.meta.env.BASE_URL}movement3d/index.html?exercise=${demo}&playing=false`} onLoad={sync} title="三個固定視角的動作示範" className="movement-frame" />}
  </div>
}
