import { motion } from 'framer-motion'
import { DIFF_LABEL, EX_MAP } from '../data/exercises'
import ExerciseDemo from '../components/ExerciseDemo'
import { TARGETS, targetLabels } from '../components/figure/anatomy'
import { Difficulty, Empty, PageHeader } from '../components/ui'
import Icon from '../components/Icon'
import { navigate } from '../lib/router'
import { useState } from 'react'
import { useStore } from '../lib/store'
import { fmtKg, suggestKg } from '../lib/weights'
import { WeightLine } from '../components/Charts'

/** demo playback speeds, cycled by the speed chip */
const SPEEDS = [1, 2, 0.75, 0.5] as const

export default function ExerciseDetail({ id }: { id: string }) {
  const ex = EX_MAP[id]
  const { data } = useStore()
  const [si, setSi] = useState(0)
  const speed = SPEEDS[si] ?? 1
  if (!ex) return <div className="page"><PageHeader title="找不到動作" back="/library" /><Empty icon="🤔" title="這個動作不存在" /></div>
  return (
    <div className="page with-cta">
      <PageHeader title={ex.name} subtitle={ex.en} back="/library" />
      <motion.div className="demo-stage" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
        <ExerciseDemo key={ex.demo} demo={ex.demo} speed={speed} />
        <button className="speed-btn" onClick={() => setSi((i) => (i + 1) % SPEEDS.length)} aria-label={`播放速度 ${speed} 倍，點一下切換`}>
          {speed}× 速度
        </button>
      </motion.div>

      <div className="detail-tags">
        {ex.cat === 'aero' && <span className="tag big aero">瘦身操</span>}
        {ex.cat === 'db' && <span className="tag big db">啞鈴</span>}
        <span className="tag big">{ex.group}</span>
        {ex.cat === 'aero' && <span className="tag big">{ex.quiet ? '🤫 安靜不跳' : '有跳躍'}</span>}
        <span className="tag big">
          <Difficulty level={ex.difficulty} /> {DIFF_LABEL[ex.difficulty]}
        </span>
        <span className="tag big">{ex.type === 'reps' ? `建議 ${ex.defaultReps} 下` : `建議 ${ex.defaultSeconds} 秒`}</span>
      </div>
      <MuscleLegend demo={ex.demo} />
      {ex.cat === 'db' && <WeightHistory id={ex.id} weights={data.weights} />}

      <h2 className="section-title">動作要點</h2>
      <ol className="steps">
        {ex.steps.map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
            <span className="step-num">{i + 1}</span>
            <span>{s}</span>
          </motion.li>
        ))}
      </ol>
      <motion.div className="tip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <span className="tip-icon">💡</span>
        <p>{ex.tip}</p>
      </motion.div>

      <div className="cta-bar">
        <motion.button className="btn primary block" whileTap={{ scale: 0.96 }} onClick={() => navigate(`/workout/quick:${ex.id}`)}>
          <Icon name="play" size={18} /> 單練這個動作（3 組）
        </motion.button>
      </div>
    </div>
  )
}

function MuscleLegend({ demo }: { demo: keyof typeof TARGETS }) {
  const t = targetLabels(TARGETS[demo])
  return (
    <div className="muscle-legend" aria-label="訓練部位">
      <div className="ml-row">
        <span className="ml-key">
          <i className="ml-dot p1" />
          主要
        </span>
        {t.p.map((m) => (
          <span key={m} className="ml-chip p1">
            {m}
          </span>
        ))}
      </div>
      {t.s.length > 0 && (
        <div className="ml-row">
          <span className="ml-key">
            <i className="ml-dot p2" />
            次要
          </span>
          {t.s.map((m) => (
            <span key={m} className="ml-chip p2">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** dumbbell log: last sessions and the next suggested weight */
function WeightHistory({ id, weights }: { id: string; weights: Parameters<typeof suggestKg>[0] }) {
  const sug = suggestKg(weights, id)
  const list = weights?.[id]?.slice(0, 5) ?? []
  return (
    <div className="weight-card">
      <h2 className="section-title">重量紀錄</h2>
      <p className="weight-next">下次建議 <b>{fmtKg(sug.kg)}</b>（每顆）{sug.up ? '：上次全部完成，加一點重量 ↑' : sug.last ? '：先把這個重量全部做完再加重' : '：第一次做，先用這個重量找手感'}</p>
      {list.length > 1 && <WeightLine entries={weights![id]} height={130} />}
      {list.length > 0 && (
        <ul className="weight-list">
          {list.map((e) => (
            <li key={e.at}>
              <span>{new Date(e.at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}</span>
              <span>{e.kg.map((k) => fmtKg(k)).join(' / ')}</span>
              <span>{e.done ? '✓ 完成' : '未完成'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
