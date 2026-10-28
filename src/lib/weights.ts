import type { WeightEntry } from '../types'

/** starting suggestion when an exercise has never been logged (kg per dumbbell) */
const START: Record<string, number> = {
  dbgoblet: 10, dbrdl: 8, dbrow: 8, dbfloorpress: 8, dbpress: 6, dblateral: 3, dbcurl: 6, dbhammer: 6,
  dbtricep: 6, dbrevlunge: 6, dbrenegade: 5, dbfarmer: 12, dbcalf: 10, dbbridge: 10,
}

export const lastWeight = (w: Record<string, WeightEntry[]> | undefined, id: string): WeightEntry | undefined => w?.[id]?.[0]

/** heaviest kg of an entry (sets can differ) */
export const topKg = (e: WeightEntry) => Math.max(...e.kg)

/**
 * Double-progression rule: when every set at the target reps was completed, add a small step
 * (+1 kg under 10 kg, +2 kg from 10 kg); otherwise stay at the same weight until it is completed.
 */
export function suggestKg(w: Record<string, WeightEntry[]> | undefined, id: string): { kg: number; up: boolean; last?: WeightEntry } {
  const last = lastWeight(w, id)
  if (!last) return { kg: START[id] ?? 5, up: false }
  const top = topKg(last)
  return last.done ? { kg: top + (top < 10 ? 1 : 2), up: true, last } : { kg: top, up: false, last }
}

export const fmtKg = (kg: number) => `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`
