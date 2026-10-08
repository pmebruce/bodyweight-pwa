import { motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { computeStats, planEstimate } from '../lib/stats'
import { greeting, weekdayLabel } from '../lib/format'
import { navigate } from '../lib/router'
import PlanCard, { planGradient } from '../components/PlanCard'
import ExerciseFigure from '../components/ExerciseFigure'
import Icon from '../components/Icon'
import { EX_MAP } from '../data/exercises'

export default function Home() {
  const { data, plans } = useStore()
  const stats = computeStats(data.history)
  const goal = Math.max(1, data.settings.weeklyGoal)
  const pct = Math.min(1, stats.weekCount / goal)
  // suggest: rotate through plans based on the last workout
  const last = data.history[0]
  const lastIdx = last ? plans.findIndex((p) => p.id === last.planId) : -1
  const suggested = plans[(lastIdx + 1) % plans.length] ?? plans[0]
  const est = planEstimate(suggested)
  const now = new Date()
  const R = 30
  const C = 2 * Math.PI * R

  return (
    <div className="page">
      <motion.header className="home-head" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="muted">
          {now.getMonth() + 1}月{now.getDate()}日 星期{weekdayLabel(now)}
        </p>
        <h1>
          {greeting()}
          {data.settings.nickname ? `，${data.settings.nickname}` : ''} <span className="wave">👋</span>
        </h1>
      </motion.header>

      <motion.section
        className="hero"
        style={{ background: planGradient(suggested.hue) }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="hero-glow" />
        <div className="hero-text">
          <span className="chip light">今日推薦</span>
          <h2>{suggested.name}</h2>
          <p>
            約 {est.minutes} 分鐘 · {suggested.items.length} 個動作
          </p>
          <motion.button className="btn hero-btn" whileTap={{ scale: 0.94 }} onClick={() => navigate(`/workout/${suggested.id}`)}>
            <Icon name="play" size={18} /> 開始訓練
          </motion.button>
        </div>
        <div className="hero-fig">
          <ExerciseFigure demo={EX_MAP[suggested.items[0]?.exerciseId]?.demo ?? 'jack'} />
        </div>
      </motion.section>

      <motion.section className="card week-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="goal-ring">
          <svg viewBox="0 0 72 72" width="72" height="72">
            <circle cx="36" cy="36" r={R} className="ring-track" strokeWidth="8" fill="none" />
            <motion.circle
              cx="36"
              cy="36"
              r={R}
              fill="none"
              stroke="url(#goalg)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              transform="rotate(-90 36 36)"
            />
            <defs>
              <linearGradient id="goalg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
                <stop offset="1" style={{ stopColor: 'var(--accent2)' }} />
              </linearGradient>
            </defs>
          </svg>
          <div className="goal-ring-label">
            <b>{stats.weekCount}</b>/{goal}
          </div>
        </div>
        <div className="week-info">
          <h3>本週目標</h3>
          <p className="muted">{stats.weekCount >= goal ? '目標達成，太強了！🎉' : `再練 ${goal - stats.weekCount} 次就達標`}</p>
          <div className="mini-stats">
            <span>
              <Icon name="flame" size={15} /> 連續 {stats.streak} 天
            </span>
            <span>
              <Icon name="clock" size={15} /> 本週 {stats.weekMinutes} 分
            </span>
          </div>
        </div>
      </motion.section>

      <div className="section-head">
        <h2>訓練計畫</h2>
        <button className="link" onClick={() => navigate('/plans')}>
          全部 <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="plan-list">
        {plans.slice(0, 6).map((p, i) => (
          <PlanCard key={p.id} plan={p} index={i} />
        ))}
      </div>
    </div>
  )
}
