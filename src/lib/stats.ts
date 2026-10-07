import type { Plan, WorkoutLog } from '../types'
import { EX_MAP } from '../data/exercises'
import { startOfDay } from './format'

export function startOfWeek(d = new Date()) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  return x
}

export function computeStats(history: WorkoutLog[]) {
  const weekStart = startOfWeek().getTime()
  const thisWeek = history.filter((h) => h.startedAt >= weekStart)
  const totalMinutes = Math.round(history.reduce((a, h) => a + h.totalSeconds, 0) / 60)
  const days = new Set(history.map((h) => startOfDay(new Date(h.startedAt)).getTime()))
  // streak: consecutive days ending today (or yesterday if not trained today yet)
  let streak = 0
  const cur = startOfDay(new Date())
  if (!days.has(cur.getTime())) cur.setDate(cur.getDate() - 1)
  while (days.has(cur.getTime())) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  // 7 bars: Monday..Sunday of the current week, minutes per day
  const week: { date: Date; minutes: number; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const logs = history.filter((h) => h.startedAt >= d.getTime() && h.startedAt < next.getTime())
    week.push({ date: d, minutes: Math.round(logs.reduce((a, h) => a + h.totalSeconds, 0) / 60), count: logs.length })
  }
  return {
    weekCount: thisWeek.length,
    weekMinutes: Math.round(thisWeek.reduce((a, h) => a + h.totalSeconds, 0) / 60),
    totalMinutes,
    totalWorkouts: history.length,
    totalKcal: Math.round(history.reduce((a, h) => a + h.kcal, 0)),
    streak,
    week,
  }
}

export function planEstimate(plan: Plan) {
  let sec = 0
  let sets = 0
  plan.items.forEach((it, i) => {
    const ex = EX_MAP[it.exerciseId]
    if (!ex) return
    const work = it.seconds ?? (it.reps ?? 10) * 3
    sec += work * it.sets
    sets += it.sets
    const rests = i === plan.items.length - 1 ? it.sets - 1 : it.sets
    sec += it.rest * rests
  })
  return { seconds: sec, minutes: Math.max(1, Math.round(sec / 60)), sets }
}
