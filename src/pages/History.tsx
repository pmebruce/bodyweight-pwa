import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { computeStats } from '../lib/stats'
import { dateLabel, durationLabel, startOfDay, weekdayLabel } from '../lib/format'
import { EX_MAP } from '../data/exercises'
import { Empty, PageHeader, toast, useConfirm } from '../components/ui'
import CountUp from '../components/CountUp'
import Icon from '../components/Icon'
import StickFigure from '../components/StickFigure'
import { navigate } from '../lib/router'

export default function History() {
  const { data, deleteLog } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const [confirm, confirmEl] = useConfirm()
  const stats = computeStats(data.history)
  const max = Math.max(10, ...stats.week.map((d) => d.minutes))
  const today = startOfDay(new Date()).getTime()

  const onDelete = async (id: string) => {
    if (await confirm({ title: '刪除這筆紀錄？', confirmText: '刪除', danger: true })) {
      deleteLog(id)
      toast('已刪除紀錄')
    }
  }

  return (
    <div className="page">
      <PageHeader title="訓練紀錄" subtitle={`累計 ${stats.totalWorkouts} 次訓練 · ${stats.totalKcal} 大卡`} />
      <div className="stat-cards">
        {[
          { label: '本週訓練', value: stats.weekCount, unit: '次', icon: 'target' },
          { label: '連續天數', value: stats.streak, unit: '天', icon: 'flame' },
          { label: '總分鐘數', value: stats.totalMinutes, unit: '分', icon: 'clock' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="stat-icon">
              <Icon name={s.icon} size={18} />
            </span>
            <b>
              <CountUp value={s.value} />
              <small>{s.unit}</small>
            </b>
            <span className="muted">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div className="card chart-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="chart-head">
          <h3>本週訓練分鐘</h3>
          <span className="muted small">共 {stats.weekMinutes} 分鐘</span>
        </div>
        <div className="bars">
          {stats.week.map((d, i) => {
            const isToday = d.date.getTime() === today
            const h = d.minutes > 0 ? Math.max(6, (d.minutes / max) * 100) : 3
            return (
              <div key={i} className={`bar-col ${isToday ? 'today' : ''}`}>
                <motion.span className="bar-val" initial={{ opacity: 0 }} animate={{ opacity: d.minutes ? 1 : 0 }} transition={{ delay: 0.5 + i * 0.06 }}>
                  {d.minutes}
                </motion.span>
                <div className="bar-track">
                  <motion.div
                    className={`bar ${d.minutes ? 'has' : ''}`}
                    initial={{ height: '0%' }}
                    animate={{ height: `${h}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.25 + i * 0.06 }}
                  />
                </div>
                <span className="bar-label">{weekdayLabel(d.date)}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      <h2 className="section-title">歷史紀錄</h2>
      {data.history.length === 0 ? (
        <Empty
          icon={<div style={{ width: 120 }}><StickFigure demo="jack" /></div>}
          title="還沒有訓練紀錄"
          text="完成第一次訓練後，紀錄就會出現在這裡。"
          action={
            <motion.button className="btn primary" whileTap={{ scale: 0.95 }} onClick={() => navigate('/plans')}>
              <Icon name="play" size={16} /> 去挑一個計畫
            </motion.button>
          }
        />
      ) : (
        <motion.ul className="log-list" layout>
          <AnimatePresence initial={false}>
            {data.history.map((h, i) => (
              <motion.li
                key={h.id}
                layout
                className="log-item"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
              >
                <button className="log-head" onClick={() => setOpen(open === h.id ? null : h.id)}>
                  <span className={`log-dot ${h.completed ? '' : 'partial'}`}>
                    <Icon name={h.completed ? 'check' : 'pause'} size={16} stroke={3} />
                  </span>
                  <div className="log-text">
                    <h3>{h.planName}</h3>
                    <p className="muted">
                      {dateLabel(h.startedAt)} · {durationLabel(h.totalSeconds)} · {h.sets} 組
                    </p>
                  </div>
                  <motion.span animate={{ rotate: open === h.id ? 90 : 0 }} className="muted">
                    <Icon name="chevron" size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === h.id && (
                    <motion.div className="log-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="log-detail-inner">
                        <div className="log-chips">
                          <span>⏱ 運動 {durationLabel(h.activeSeconds)}</span>
                          <span>🔥 {h.kcal} 大卡</span>
                          {h.reps > 0 && <span>💪 {h.reps} 下</span>}
                          {!h.completed && <span>⏸ 提前結束</span>}
                        </div>
                        <ul>
                          {h.exercises.map((e) => (
                            <li key={e.exerciseId}>
                              <span>{EX_MAP[e.exerciseId]?.name ?? e.exerciseId}</span>
                              <span className="muted">
                                {e.sets} 組 · {e.reps ? `${e.reps} 下` : `${e.seconds} 秒`}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <button className="btn danger-ghost small" onClick={() => onDelete(h.id)}>
                          <Icon name="trash" size={16} /> 刪除紀錄
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
      {confirmEl}
    </div>
  )
}
