import { motion } from 'framer-motion'
import { useStore } from '../lib/store'
import PlanCard from '../components/PlanCard'
import { Empty, PageHeader } from '../components/ui'
import Icon from '../components/Icon'
import { navigate } from '../lib/router'

export default function Plans() {
  const { plans } = useStore()
  const builtIn = plans.filter((p) => p.builtIn)
  const mine = plans.filter((p) => !p.builtIn)
  return (
    <div className="page">
      <PageHeader
        title="訓練計畫"
        subtitle="選一個開始，或打造自己的課表"
        right={
          <motion.button className="btn primary small" whileTap={{ scale: 0.92 }} onClick={() => navigate('/plan-edit/new')}>
            <Icon name="plus" size={16} stroke={2.6} /> 建立
          </motion.button>
        }
      />
      <h2 className="section-title">我的計畫</h2>
      {mine.length === 0 ? (
        <Empty
          icon={<Icon name="edit" size={30} />}
          title="還沒有自訂計畫"
          text="挑選動作、設定組數與休息時間，打造專屬課表。"
          action={
            <motion.button className="btn primary" whileTap={{ scale: 0.95 }} onClick={() => navigate('/plan-edit/new')}>
              <Icon name="plus" size={16} /> 建立第一個計畫
            </motion.button>
          }
        />
      ) : (
        <div className="plan-list">
          {mine.map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} />
          ))}
        </div>
      )}
      <h2 className="section-title">內建計畫</h2>
      <div className="plan-list">
        {builtIn.map((p, i) => (
          <PlanCard key={p.id} plan={p} index={i} />
        ))}
      </div>
    </div>
  )
}
