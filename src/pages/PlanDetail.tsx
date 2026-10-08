import { motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { planEstimate } from '../lib/stats'
import { EX_MAP } from '../data/exercises'
import ExerciseFigure from '../components/ExerciseFigure'
import { Empty, PageHeader, toast, useConfirm } from '../components/ui'
import Icon from '../components/Icon'
import { goBack, navigate } from '../lib/router'
import { planGradient } from '../components/PlanCard'
import { itemTarget } from '../lib/plan'

export default function PlanDetail({ id }: { id: string }) {
  const { getPlan, deletePlan } = useStore()
  const [confirm, confirmEl] = useConfirm()
  const plan = getPlan(id)
  if (!plan)
    return (
      <div className="page">
        <PageHeader title="找不到計畫" back="/plans" />
        <Empty icon="🤔" title="這個計畫可能已被刪除" />
      </div>
    )
  const est = planEstimate(plan)

  const onDelete = async () => {
    if (await confirm({ title: `刪除「${plan.name}」？`, message: '刪除後無法復原，訓練紀錄會保留。', confirmText: '刪除', danger: true })) {
      deletePlan(plan.id)
      toast('已刪除計畫')
      goBack('/plans')
    }
  }

  return (
    <div className="page with-cta">
      <PageHeader
        title=""
        back="/plans"
        right={
          plan.builtIn ? (
            <motion.button className="btn ghost small" whileTap={{ scale: 0.92 }} onClick={() => navigate(`/plan-edit/new?from=${plan.id}`)}>
              <Icon name="copy" size={16} /> 複製並編輯
            </motion.button>
          ) : (
            <div className="row gap8">
              <motion.button className="icon-btn" whileTap={{ scale: 0.88 }} onClick={onDelete} aria-label="刪除">
                <Icon name="trash" size={20} />
              </motion.button>
              <motion.button className="btn ghost small" whileTap={{ scale: 0.92 }} onClick={() => navigate(`/plan-edit/${plan.id}`)}>
                <Icon name="edit" size={16} /> 編輯
              </motion.button>
            </div>
          )
        }
      />
      <motion.div className="plan-hero" style={{ background: planGradient(plan.hue) }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1>{plan.name}</h1>
        {plan.description && <p>{plan.description}</p>}
        <div className="plan-hero-stats">
          <div>
            <b>{est.minutes}</b>
            <span>分鐘</span>
          </div>
          <div>
            <b>{plan.items.length}</b>
            <span>動作</span>
          </div>
          <div>
            <b>{est.sets}</b>
            <span>組</span>
          </div>
        </div>
      </motion.div>

      <ul className="item-list">
        {plan.items.map((it, i) => {
          const ex = EX_MAP[it.exerciseId]
          if (!ex) return null
          return (
            <motion.li key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }} onClick={() => navigate(`/exercise/${ex.id}`)}>
              <div className="item-fig">
                <ExerciseFigure demo={ex.demo} />
              </div>
              <div className="item-text">
                <h3>{ex.name}</h3>
                <p className="muted">
                  {it.sets} 組 × {itemTarget(it)} · 休息 {it.rest} 秒
                </p>
              </div>
              <Icon name="chevron" size={18} className="muted" />
            </motion.li>
          )
        })}
      </ul>

      <div className="cta-bar">
        <motion.button className="btn primary block" whileTap={{ scale: 0.96 }} onClick={() => navigate(`/workout/${plan.id}`)} disabled={plan.items.length === 0}>
          <Icon name="play" size={18} /> 開始訓練
        </motion.button>
      </div>
      {confirmEl}
    </div>
  )
}
