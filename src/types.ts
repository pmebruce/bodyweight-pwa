export type Group = '上肢' | '核心' | '下肢' | '全身'
export type DemoKey =
  | 'pushup' | 'squat' | 'lunge' | 'plank' | 'burpee' | 'climber' | 'bridge'
  | 'situp' | 'crunch' | 'jack' | 'superman' | 'sideplank' | 'dips' | 'highknees'
  | 'wallsit' | 'pullup' | 'diamond' | 'jumpsquat' | 'birddog' | 'bicycle'
  // 瘦身操 (aerobics)
  | 'march' | 'buttkick' | 'kickclap' | 'punch' | 'uppercut' | 'armcircle' | 'stepjack'
  | 'steptouch' | 'sideleg' | 'sidecrunch' | 'hula' | 'sidelunge' | 'skihop' | 'sidebend'

export interface Exercise {
  id: string
  name: string
  en: string
  group: Group
  muscles: string[]
  difficulty: 1 | 2 | 3
  type: 'reps' | 'time'
  defaultReps?: number
  defaultSeconds?: number
  kcalPerMin: number
  steps: string[]
  tip: string
  demo: DemoKey
  /** 'aero' = 瘦身操 (low-impact cardio / aerobic dance moves) */
  cat?: 'aero'
  /** no jumping, apartment-friendly (安靜) */
  quiet?: boolean
}

export interface PlanItem {
  exerciseId: string
  sets: number
  reps?: number
  seconds?: number
  rest: number
}

export interface Plan {
  id: string
  name: string
  description: string
  builtIn?: boolean
  /** 'aero' = 瘦身操 plan (built-in follow-along routines) */
  kind?: 'aero'
  hue: number
  items: PlanItem[]
  updatedAt?: number
}

export interface WorkoutLog {
  id: string
  planId: string
  planName: string
  startedAt: number
  finishedAt: number
  activeSeconds: number
  totalSeconds: number
  sets: number
  reps: number
  exercises: { exerciseId: string; sets: number; reps: number; seconds: number }[]
  kcal: number
  completed: boolean
}

export interface Settings {
  nickname: string
  /** first-launch name prompt done (answered or skipped) */
  onboarded: boolean
  defaultRest: number
  prepSeconds: number
  weeklyGoal: number
  voice: boolean
  sound: boolean
  vibrate: boolean
}

export interface AppData {
  version: 1
  customPlans: Plan[]
  history: WorkoutLog[]
  settings: Settings
}
