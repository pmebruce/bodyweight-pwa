import type { DemoKey } from '../../types'
import type { Demo } from './demos'

/** one part of a rep in loop fractions: ecc = lowering (吸氣), hold = pause, con = effort (吐氣) */
export interface Phase { a: number; b: number; k: 'ecc' | 'hold' | 'con' }

/** loops whose first move is the effort (lift / pull / press); everything else lowers first */
const EFFORT_FIRST = new Set<DemoKey>(['dbrow', 'dbfloorpress', 'dbpress', 'dblateral', 'dbcurl', 'dbcalf', 'dbbridge', 'bridge', 'situp', 'crunch', 'superman', 'pullup'])
/** the 3D player drives these with its own depth curve (see natural-rig depthAt) */
const DEPTH_CURVE: Partial<Record<DemoKey, Phase[]>> = Object.fromEntries((['squat', 'pushup', 'lunge'] as DemoKey[]).map((k) => [k, [
  { a: 0.08, b: 0.56, k: 'ecc' }, { a: 0.56, b: 0.64, k: 'hold' }, { a: 0.64, b: 0.93, k: 'con' },
]]))

/** rep phases for strength demos with a simple start → end (→ hold) → start loop; undefined otherwise */
export function repPhases(key: DemoKey, d: Demo, durs: number[]): Phase[] | undefined {
  if (DEPTH_CURVE[key]) return DEPTH_CURVE[key]
  if (key === 'bicycle') return undefined // alternating, no single lift
  const total = durs.reduce((a, b) => a + b, 0)
  const f = (ms: number) => ms / total
  let parts: [number, 'move1' | 'hold' | 'move2'][] | undefined
  if (key === 'dbrevlunge') parts = [[durs[0] + durs[1], 'move1'], [durs[2], 'hold'], [durs[3] + durs[4], 'move2']]
  else if (d.keys.length === 2 && !d.smooth && !d.front) parts = [[durs[0], 'move1'], [durs[1], 'move2']]
  else if (d.keys.length === 3 && JSON.stringify(d.keys[1]) === JSON.stringify(d.keys[2])) parts = [[durs[0], 'move1'], [durs[1], 'hold'], [durs[2], 'move2']]
  if (!parts) return undefined
  const first = EFFORT_FIRST.has(key)
  let t = 0
  return parts.map(([ms, p]) => {
    const ph: Phase = { a: t, b: t + f(ms), k: p === 'hold' ? 'hold' : (p === 'move1') === first ? 'con' : 'ecc' }
    t = ph.b
    return ph
  })
}

/** tempo label in seconds, in lowering-hold-lifting order (e.g. "3-1-1") */
export function tempoLabel(ph: Phase[], loopSeconds: number): string {
  const sec = (k: Phase['k']) => ph.filter((p) => p.k === k).reduce((a, p) => a + (p.b - p.a) * loopSeconds, 0)
  const r = (s: number, min: number) => (s < 0.25 ? 0 : Math.max(min, Math.round(s)))
  return `${r(sec('ecc'), 1)}-${r(sec('hold'), 0)}-${r(sec('con'), 1)}`
}

/** common-mistake demos: the faulty body part (bone-name regex for the yellow tint) and the cues */
export const FAULTS: Partial<Record<DemoKey, { bad: string; good: string; bones: string }>> = {
  squat: { bad: '膝蓋內夾', good: '膝蓋對齊腳尖、往外推', bones: '^(thigh_|calf_)' },
  dbgoblet: { bad: '膝蓋內夾', good: '膝蓋對齊腳尖、往外推', bones: '^(thigh_|calf_)' },
  pushup: { bad: '塌腰（臀部下沉）', good: '收緊核心，頭到腳一直線', bones: '^(pelvis|spine_01|spine_02)$' },
  lunge: { bad: '前膝過度前推', good: '身體垂直下降，小腿接近直立', bones: '^(thigh_|calf_)' },
  dbrow: { bad: '駝背', good: '背打直、胸口打開', bones: '^spine_0[123]$' },
  dbrdl: { bad: '駝背彎腰', good: '背打直，臀部往後推', bones: '^spine_0[123]$' },
  dbpress: { bad: '腰往後凹', good: '肋骨下收、臀部夾緊', bones: '^(pelvis|spine_01|spine_02)$' },
}
