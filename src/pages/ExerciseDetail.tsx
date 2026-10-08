import { motion } from 'framer-motion'
import { DIFF_LABEL, EX_MAP } from '../data/exercises'
import ExerciseFigure from '../components/ExerciseFigure'
import { TARGETS, targetLabels } from '../components/figure/anatomy'
import { Difficulty, Empty, PageHeader } from '../components/ui'
import Icon from '../components/Icon'
import { navigate } from '../lib/router'
import { useState } from 'react'

export default function ExerciseDetail({ id }: { id: string }) {
  const ex = EX_MAP[id]
  const [slow, setSlow] = useState(false)
  if (!ex) return <div className="page"><PageHeader title="找不到動作" back="/library" /><Empty icon="🤔" title="這個動作不存在" /></div>
  return (
    <div className="page with-cta">
      <PageHeader title={ex.name} subtitle={ex.en} back="/library" />
      <motion.div className="demo-stage" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
        <ExerciseFigure demo={ex.demo} speed={slow ? 0.5 : 1} />
        <button className="speed-btn" onClick={() => setSlow((s) => !s)}>
          {slow ? '0.5×' : '1×'} 速度
        </button>
      </motion.div>

      <div className="detail-tags">
        <span className="tag big">{ex.group}</span>
        <span className="tag big">
          <Difficulty level={ex.difficulty} /> {DIFF_LABEL[ex.difficulty]}
        </span>
        <span className="tag big">{ex.type === 'reps' ? `建議 ${ex.defaultReps} 下` : `建議 ${ex.defaultSeconds} 秒`}</span>
      </div>
      <MuscleLegend demo={ex.demo} />

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
