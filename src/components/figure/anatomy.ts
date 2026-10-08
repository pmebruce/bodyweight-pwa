import type { DemoKey } from '../../types'

/** muscle groups the demo figure can highlight */
export type MuscleId =
  | 'chest' | 'frontDelt' | 'delts' | 'rearDelt' | 'traps' | 'triceps' | 'biceps' | 'forearm'
  | 'abs' | 'obliques' | 'lats' | 'lowerBack' | 'glutes' | 'quads' | 'hipFlexors' | 'adductors'
  | 'hamstrings' | 'calves'

export const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: '胸肌',
  frontDelt: '前三角肌',
  delts: '三角肌',
  rearDelt: '後三角肌',
  traps: '斜方肌',
  triceps: '三頭肌',
  biceps: '二頭肌',
  forearm: '前臂',
  abs: '腹肌',
  obliques: '腹斜肌',
  lats: '背闊肌',
  lowerBack: '下背',
  glutes: '臀肌',
  quads: '股四頭肌',
  hipFlexors: '髖屈肌',
  adductors: '大腿內側',
  hamstrings: '腿後肌',
  calves: '小腿',
}

export interface Targets {
  /** primary movers (strong red) */
  p: MuscleId[]
  /** secondary / stabilisers (light orange) */
  s: MuscleId[]
}

export const TARGETS: Record<DemoKey, Targets> = {
  pushup: { p: ['chest', 'triceps', 'frontDelt'], s: ['abs'] },
  diamond: { p: ['triceps', 'chest'], s: ['frontDelt', 'abs'] },
  squat: { p: ['quads', 'glutes'], s: ['hamstrings'] },
  jumpsquat: { p: ['quads', 'glutes'], s: ['hamstrings', 'calves'] },
  lunge: { p: ['quads', 'glutes'], s: ['hamstrings', 'calves'] },
  wallsit: { p: ['quads'], s: ['glutes'] },
  plank: { p: ['abs'], s: ['obliques', 'frontDelt'] },
  sideplank: { p: ['obliques'], s: ['abs', 'delts'] },
  crunch: { p: ['abs'], s: ['obliques'] },
  situp: { p: ['abs'], s: ['obliques', 'hipFlexors'] },
  bicycle: { p: ['obliques', 'abs'], s: ['hipFlexors'] },
  superman: { p: ['lowerBack', 'glutes'], s: ['hamstrings', 'rearDelt'] },
  birddog: { p: ['lowerBack', 'abs'], s: ['glutes', 'rearDelt'] },
  bridge: { p: ['glutes', 'hamstrings'], s: ['lowerBack'] },
  pullup: { p: ['lats', 'biceps'], s: ['forearm', 'rearDelt'] },
  dips: { p: ['triceps'], s: ['frontDelt', 'chest'] },
  burpee: { p: ['quads', 'glutes', 'chest'], s: ['triceps', 'frontDelt', 'abs', 'calves'] },
  climber: { p: ['abs', 'hipFlexors'], s: ['frontDelt', 'obliques', 'quads'] },
  jack: { p: ['delts', 'calves'], s: ['quads', 'adductors'] },
  highknees: { p: ['hipFlexors', 'quads'], s: ['calves', 'abs'] },
}

export const targetLabels = (t: Targets) => ({
  p: t.p.map((m) => MUSCLE_LABEL[m]),
  s: t.s.map((m) => MUSCLE_LABEL[m]),
})
