import { motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../lib/store'
import PlanCard from '../components/PlanCard'
import { Empty, PageHeader } from '../components/ui'
import Icon from '../components/Icon'
import { navigate } from '../lib/router'

const TABS = ['全部', '瘦身操', '健身訓練'] as const
type Tab = (typeof TABS)[number]
let savedTab: Tab = '全部'

export default function Plans() {
  const { plans } = useStore()
  const [tab, setTab] = useState<Tab>(savedTab)
  savedTab = tab
  const aero = plans.filter((p) => p.builtIn && p.kind === 'aero')
  const fit = plans.filter((p) => p.builtIn && p.kind !== 'aero')
  const mine = plans.filter((p) => !p.builtIn)
  const showMine = tab !== '瘦身操'
  // with no custom plans yet, lead with the built-in plans and put the "create" prompt last
  const mineFirst = mine.length > 0
  const showAero = tab !== '健身訓練'
  const showFit = tab !== '瘦身操'
  const mineSection = (
    <>
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
    </>
  )
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
      <div className="chips plan-tabs">
        {TABS.map((t) => (
          <button key={t} className={`chip-btn ${t === tab ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === tab && <motion.span layoutId="plans-pill" className="chip-pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span>{t}</span>
          </button>
        ))}
      </div>

      {showMine && mineFirst && mineSection}

      {showAero && (
        <>
          <div className="section-title-row">
            <h2 className="section-title">瘦身操</h2>
            <span className="section-note">跟著做・休息短・節奏不中斷</span>
          </div>
          <div className="plan-list">
            {aero.map((p, i) => (
              <PlanCard key={p.id} plan={p} index={i} />
            ))}
          </div>
        </>
      )}

      {showFit && (
        <>
          <h2 className="section-title">健身訓練</h2>
          <div className="plan-list">
            {fit.map((p, i) => (
              <PlanCard key={p.id} plan={p} index={i} />
            ))}
          </div>
        </>
      )}

      {showMine && !mineFirst && mineSection}
    </div>
  )
}
