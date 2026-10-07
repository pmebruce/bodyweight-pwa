export type Group = '上肢' | '核心' | '下肢' | '全身'
export type DemoKey =
  | 'pushup' | 'squat' | 'lunge' | 'plank' | 'burpee' | 'climber' | 'bridge'
  | 'situp' | 'crunch' | 'jack' | 'superman' | 'sideplank' | 'dips' | 'highknees'
  | 'wallsit' | 'pullup' | 'diamond' | 'jumpsquat' | 'birddog' | 'bicycle'

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
