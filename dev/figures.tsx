import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import ExerciseFigure from '../src/components/ExerciseFigure'
import { DEMOS } from '../src/components/figure/demos'
import { FACE } from '../src/components/figure/draw'
import type { DemoKey } from '../src/types'

const q = new URLSearchParams(location.search)
{
  const h = q.get('hair')
  if (h === '0') FACE.hair = ''
  else if (h === 'A' || h === 'B' || h === 'C') FACE.hair = h
}
const phases = (q.get('phases') ?? '0,0.25,0.5,0.75').split(',').map(Number)
const only = q.get('only')?.split(',') as DemoKey[] | undefined
const cols = Number(q.get('cols') ?? phases.length)
const keys = only ?? (Object.keys(DEMOS) as DemoKey[])
// ?stage=1: cells look exactly like the exercise-detail demo stage at a 390 px wide phone (354 × 280 css px)
if (q.get('stage')) {
  createRoot(document.getElementById('root')!).render(
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, width: 354 * cols }}>
      {keys.flatMap((k) =>
        phases.map((p) => (
          <div key={k + p} className="demo-stage cell" data-k={k} data-p={p} style={{ width: 354, height: 280, boxSizing: 'border-box', borderRadius: 0, boxShadow: 'none' }}>
            <ExerciseFigure demo={k} phase={p} />
          </div>
        )),
      )}
    </div>,
  )
} else
createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 8, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
    {keys.flatMap((k) =>
      phases.map((p) => (
        <div key={k + p} className="cell" data-k={k} data-p={p} style={{ background: 'var(--card)', borderRadius: 10, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 6, top: 4, fontSize: 11, color: 'var(--muted)' }}>{k} {p}</span>
          <ExerciseFigure demo={k} phase={p} />
        </div>
      )),
    )}
  </div>,
)

// ---- loop length per demo (ms) for the capture scripts ----
declare global {
  interface Window {
    __meta: () => Record<string, { total: number; still: number; front: boolean }>
  }
}
window.__meta = () =>
  Object.fromEntries(
    Object.entries(DEMOS).map(([k, d]) => {
      const durs = d.keys.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur))
      const total = durs.reduce((a, b) => a + b, 0)
      const s = d.still ?? (d.keys.length > 1 ? 1 : 0)
      return [k, { total, still: durs.slice(0, s).reduce((a, b) => a + b, 0) / total, front: !!d.front }]
    }),
  )

// ---- numeric probe used by the screenshot scripts ----
import { Rig } from '../src/components/figure/rig'
import { drawFrame, groundClamp } from '../src/components/figure/draw'
declare global {
  interface Window {
    __probe: () => unknown
  }
}
window.__probe = () => {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 -14 200 154')
  svg.style.cssText = 'position:absolute;left:-9999px;width:200px;height:154px'
  document.body.appendChild(svg)
  const path = document.createElementNS(NS, 'path')
  svg.appendChild(path)
  const res: Record<string, unknown> = {}
  for (const [name, d] of Object.entries(DEMOS)) {
    const durs = d.keys.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur))
    const rig = new Rig(d.keys, d.front, { durs, smooth: d.smooth, lag: d.lag, headLag: d.headLag, yaw: d.yaw })
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, miss = 0
    const keyInfo: string[] = []
    for (let i = 0; i < d.keys.length; i++) {
      for (let s = 0; s <= 8; s++) {
        const fr = groundClamp(rig.pose(i, s / 8), 128)
        for (const l of [fr.armN, fr.armF, fr.legN, fr.legF]) miss = Math.max(miss, l.miss)
        const parts = drawFrame(fr)
        let shoeB = -Infinity, handB = -Infinity, bodyB = -Infinity
        for (const [k, v] of Object.entries(parts)) {
          path.setAttribute('d', v)
          const b = path.getBBox()
          top = Math.min(top, b.y); bottom = Math.max(bottom, b.y + b.height)
          left = Math.min(left, b.x); right = Math.max(right, b.x + b.width)
          if (/shoe|sole/.test(k)) shoeB = Math.max(shoeB, b.y + b.height)
          else if (/hand/.test(k)) handB = Math.max(handB, b.y + b.height)
          else bodyB = Math.max(bodyB, b.y + b.height)
        }
        if (s === 0) keyInfo.push(`k${i}: shoe ${shoeB.toFixed(1)} hand ${handB.toFixed(1)} body ${bodyB.toFixed(1)}`)
      }
    }
    const PROP: Record<string, [number, number, number]> = { wall: [52, 64, -8], bar: [54, 146, -0.5], chair: [31, 77, 52] }
    const pr = d.prop ? PROP[d.prop] : undefined
    const L0 = Math.min(left, pr?.[0] ?? Infinity), R0 = Math.max(right, pr?.[1] ?? -Infinity), T0 = Math.min(top, pr?.[2] ?? Infinity)
    const hNeed = 138 - (T0 - 8)
    const wNeed = R0 - L0 + 18
    const w = Math.min(200, Math.max(wNeed, (hNeed * 200) / 154, 138))
    const cx = (L0 + R0) / 2
    const view = w >= 199.9 ? null : [+(Math.max(0, Math.min(200 - w, cx - w / 2))).toFixed(1), +(138 - (w * 154) / 200).toFixed(1), +w.toFixed(1)]
    res[name] = { view, top: +top.toFixed(1), bottom: +bottom.toFixed(1), left: +left.toFixed(1), right: +right.toFixed(1), miss: +miss.toFixed(2), keys: keyInfo }
    void durs
  }
  svg.remove()
  return res
}

// ---- hip position probe (zoomed hip crops) ----
declare global {
  interface Window {
    __hip: (k: string, phase: number) => [number, number]
  }
}
window.__hip = (k, phase) => {
  const d = DEMOS[k as DemoKey]
  const durs = d.keys.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur))
  const rig = new Rig(d.keys, d.front, { durs, smooth: d.smooth, lag: d.lag, headLag: d.headLag, yaw: d.yaw })
  const fr = groundClamp(rig.at(phase), 128)
  return fr.p
}
