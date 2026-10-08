import { motion } from 'framer-motion'
import type { Plan } from '../types'
import { planEstimate } from '../lib/stats'
import { EX_MAP } from '../data/exercises'
import ExerciseFigure from './ExerciseFigure'
import Icon from './Icon'
import { navigate } from '../lib/router'

export function planGradient(hue: number) {
  return `linear-gradient(135deg, hsl(${hue} 92% 60%), hsl(${(hue + 38) % 360} 88% 52%))`
}

export default function PlanCard({ plan, index = 0 }: { plan: Plan; index?: number }) {
  const est = planEstimate(plan)
  const first = EX_MAP[plan.items[0]?.exerciseId]
  return (
    <motion.button
      className="plan-card"
      style={{ background: planGradient(plan.hue) }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      <div className="plan-card-text">
        {plan.kind === 'aero' && <span className="plan-kind">瘦身操</span>}
        <h3>{plan.name}</h3>
        <p>{plan.description || `${plan.items.length} 個動作`}</p>
        <div className="plan-card-meta">
          <span>
            <Icon name="clock" size={14} /> 約 {est.minutes} 分鐘
          </span>
          <span>
            <Icon name="bolt" size={14} /> {plan.items.length} 動作{est.sets !== plan.items.length ? ` · ${est.sets} 組` : ''}
          </span>
        </div>
      </div>
      {first && (
        <div className="plan-card-fig">
          <ExerciseFigure demo={first.demo} />
        </div>
      )}
    </motion.button>
  )
}
