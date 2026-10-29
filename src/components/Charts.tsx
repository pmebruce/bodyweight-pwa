import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { WeightEntry, WorkoutLog } from '../types'
import { startOfWeek } from '../lib/stats'
import { EX_MAP } from '../data/exercises'
import { fmtKg } from '../lib/weights'

/** workouts per week for the last n weeks (oldest first) */
export function weeklyCounts(history: WorkoutLog[], n = 8) {
  const start = startOfWeek(new Date()).getTime()
  const W = 7 * 86400000
  const out = Array.from({ length: n }, (_, i) => ({ start: new Date(start - (n - 1 - i) * W), count: 0, minutes: 0 }))
  for (const h of history) {
    const i = n - 1 - Math.floor((start - startOfWeek(new Date(h.startedAt)).getTime() + W / 2) / W)
    if (i >= 0 && i < n) {
      out[i].count++
      out[i].minutes += Math.round(h.totalSeconds / 60)
    }
  }
  return out
}

/** 8-week bar chart of workouts per week (plain SVG, themed by CSS variables) */
export function WeeklyBars({ history }: { history: WorkoutLog[] }) {
  const weeks = weeklyCounts(history)
  const max = Math.max(3, ...weeks.map((w) => w.count))
  const W = 320, H = 140, pad = 22, bw = (W - pad) / weeks.length
  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3>每週訓練次數</h3>
        <span className="muted small">近 8 週 · 共 {weeks.reduce((a, w) => a + w.count, 0)} 次</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart" role="img" aria-label="近八週每週訓練次數長條圖">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={pad} x2={W} y1={10 + (H - 34) * (1 - f)} y2={10 + (H - 34) * (1 - f)} className="grid" />
        ))}
        <text x={pad - 6} y={14} className="axis" textAnchor="end">{max}</text>
        <text x={pad - 6} y={H - 22} className="axis" textAnchor="end">0</text>
        {weeks.map((w, i) => {
          const h = ((H - 34) * w.count) / max
          const x = pad + i * bw + bw * 0.18
          const cur = i === weeks.length - 1
          return (
            <g key={i}>
              <motion.rect x={x} width={bw * 0.64} rx={5} className={`bar-rect ${cur ? 'cur' : ''}`} initial={{ y: H - 24, height: 0 }} animate={{ y: H - 24 - h, height: h }} transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.04 }} />
              {w.count > 0 && <text x={x + bw * 0.32} y={H - 28 - h} className="val" textAnchor="middle">{w.count}</text>}
              <text x={x + bw * 0.32} y={H - 8} className="axis" textAnchor="middle">{cur ? '本週' : `${w.start.getMonth() + 1}/${w.start.getDate()}`}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** weight-over-time line for one dumbbell exercise (heaviest kg per session) */
export function WeightLine({ entries, height = 150 }: { entries: WeightEntry[]; height?: number }) {
  const pts = [...entries].sort((a, b) => a.at - b.at).slice(-20)
  if (pts.length === 0) return <p className="muted small chart-empty">完成一次訓練後，這裡會畫出重量變化。</p>
  const W = 320, H = height, L = 34, R = 10, T = 14, B = 24
  const kg = pts.map((e) => Math.max(...e.kg))
  let lo = Math.min(...kg), hi = Math.max(...kg)
  if (hi - lo < 4) { lo = Math.max(0, lo - 2); hi = lo + 4 + (hi - lo) }
  const x = (i: number) => (pts.length === 1 ? (L + W - R) / 2 : L + ((W - L - R) * i) / (pts.length - 1))
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo))
  const d = kg.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${d} L${x(kg.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`
  const day = (t: number) => { const dt = new Date(t); return `${dt.getMonth() + 1}/${dt.getDate()}` }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="svg-chart" role="img" aria-label="重量變化折線圖">
      {[lo, (lo + hi) / 2, hi].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" />
          <text x={L - 6} y={y(v) + 4} className="axis" textAnchor="end">{Math.round(v)}</text>
        </g>
      ))}
      <path d={area} className="line-area" />
      <motion.path d={d} className="line" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      {kg.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={pts[i].done ? 4 : 3.5} className={pts[i].done ? 'dot done' : 'dot'} />
      ))}
      <text x={x(kg.length - 1)} y={y(kg[kg.length - 1]) - 9} className="val" textAnchor="middle">{fmtKg(kg[kg.length - 1])}</text>
      <text x={x(0)} y={H - 6} className="axis" textAnchor="start">{day(pts[0].at)}</text>
      {pts.length > 1 && <text x={x(pts.length - 1)} y={H - 6} className="axis" textAnchor="end">{day(pts[pts.length - 1].at)}</text>}
    </svg>
  )
}

/** progress card on the history page: pick a logged dumbbell exercise, see its weight trend */
export function DumbbellProgress({ weights }: { weights?: Record<string, WeightEntry[]> }) {
  const ids = useMemo(() => Object.keys(weights ?? {}).filter((id) => EX_MAP[id] && weights![id].length).sort((a, b) => weights![b][0].at - weights![a][0].at), [weights])
  const [sel, setSel] = useState<string | null>(null)
  const id = sel && ids.includes(sel) ? sel : ids[0]
  return (
    <div className="card chart-card">
      <div className="chart-head">
        <h3>啞鈴重量進度</h3>
        {id && <span className="muted small">每次最重 · 實心點＝全部完成</span>}
      </div>
      {ids.length === 0 ? (
        <p className="muted small chart-empty">做完一個啞鈴課表並記錄重量後，這裡會出現每個動作的重量曲線。</p>
      ) : (
        <>
          <div className="chips chart-chips">
            {ids.map((x) => (
              <button key={x} className={`chip-btn ${x === id ? 'active' : ''}`} onClick={() => setSel(x)}>
                <span>{EX_MAP[x].name.replace(/^啞鈴/, '')}</span>
              </button>
            ))}
          </div>
          <WeightLine entries={weights![id!]} />
        </>
      )}
    </div>
  )
}
