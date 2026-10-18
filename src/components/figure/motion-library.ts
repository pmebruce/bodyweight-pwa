import { DEMOS } from './demos'
import { Rig } from './rig'
import { EXERCISES } from '../../data/exercises'
import { TARGETS, targetLabels } from './anatomy'
export const MOTIONS = Object.fromEntries(EXERCISES.map(ex => {
  const d = DEMOS[ex.demo]
  const durations = d.keys.map((_, i) => Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur)
  const targets = targetLabels(TARGETS[ex.demo])
  return [ex.demo, { name: ex.name, english: ex.en, duration: Math.max(1.4, durations.reduce((a, b) => a + b, 0) / 1000 * 1.35), prop: d.prop, front: !!d.front, still: d.still ?? 0, keys: d.keys.length, targets: TARGETS[ex.demo], labels: targets, steps: ex.steps, tip: ex.tip }]
}))
export function createMotion(name: string) {
  const d = DEMOS[name as keyof typeof DEMOS]
  if (!d) throw new Error(`Unknown exercise: ${name}`)
  const durs = d.keys.map((_, i) => Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur)
  const rig = new Rig(d.keys, d.front, { durs, smooth: d.smooth, lag: d.lag, headLag: d.headLag, yaw: 0, hand: d.hand })
  const total = durs.reduce((a, b) => a + b, 0)
  return { at: (t: number) => rig.at(t), still: durs.slice(0, d.still ?? 0).reduce((a, b) => a + b, 0) / total }
}
