import type { Plan, Settings } from '../types'
import { EX_MAP } from '../data/exercises'

export function resolvePlan(id: string, plans: Plan[], settings: Settings): Plan | undefined {
  if (id.startsWith('quick:')) {
    const ex = EX_MAP[id.slice(6)]
    if (!ex) return undefined
    return {
      id,
      name: `${ex.name}專練`,
      description: '',
      hue: 160,
      items: [{ exerciseId: ex.id, sets: 3, reps: ex.type === 'reps' ? ex.defaultReps : undefined, seconds: ex.type === 'time' ? ex.defaultSeconds : undefined, rest: settings.defaultRest }],
    }
  }
  return plans.find((p) => p.id === id)
}

export function itemTarget(it: { reps?: number; seconds?: number }) {
  return it.seconds ? `${it.seconds} 秒` : `${it.reps ?? 0} 下`
}
