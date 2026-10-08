import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { AERO_COUNT, EXERCISES, FILTERS, matchFilter, type Filter } from '../data/exercises'
import ExerciseFigure from '../components/ExerciseFigure'
import { Difficulty, Empty, PageHeader } from '../components/ui'
import Icon from '../components/Icon'
import { navigate } from '../lib/router'

let savedGroup: Filter = '全部'
let savedQuery = ''

export default function Library() {
  const [group, setGroup] = useState<Filter>(savedGroup)
  const [q, setQ] = useState(savedQuery)
  savedGroup = group
  savedQuery = q

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return EXERCISES.filter(
      (e) =>
        matchFilter(e, group) &&
        (!s || e.name.includes(s) || e.en.toLowerCase().includes(s) || e.muscles.some((m) => m.includes(s))),
    )
  }, [group, q])

  return (
    <div className="page">
      <PageHeader title="動作庫" subtitle={`${EXERCISES.length} 個徒手動作（含 ${AERO_COUNT} 個瘦身操），不需器材`} />
      <div className="search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋動作或部位，例如：胸、深蹲" enterKeyHint="search" />
        <AnimatePresence>
          {q && (
            <motion.button className="search-clear" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQ('')} aria-label="清除">
              <Icon name="x" size={14} stroke={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="chips">
        {FILTERS.map((g) => (
          <button key={g} className={`chip-btn ${g === group ? 'active' : ''} ${g === '瘦身操' || g === '安靜不跳' ? 'aero' : ''}`} onClick={() => setGroup(g)}>
            {g === group && <motion.span layoutId="chip-pill" className="chip-pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
            <span>{g}</span>
          </button>
        ))}
      </div>

      <motion.div className="ex-grid" layout>
        <AnimatePresence mode="popLayout">
          {list.map((e, i) => (
            <motion.button
              key={e.id}
              layout
              className="ex-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(i, 10) * 0.025 } }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/exercise/${e.id}`)}
            >
              <div className="ex-card-fig">
                <ExerciseFigure demo={e.demo} />
                {e.quiet && <span className="quiet-badge">安靜</span>}
              </div>
              <div className="ex-card-body">
                <h3>{e.name}</h3>
                <div className="ex-card-meta">
                  {e.cat === 'aero' ? <span className="tag aero">瘦身操</span> : <span className="tag">{e.group}</span>}
                  <Difficulty level={e.difficulty} />
                </div>
                <span className="ex-card-target">{e.type === 'reps' ? `${e.defaultReps} 下` : `${e.defaultSeconds} 秒`}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      {group === '瘦身操' && list.length > 0 && (
        <motion.p className="aero-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          標「安靜」的動作完全不跳躍，住公寓也不怕吵到鄰居。
        </motion.p>
      )}
      {list.length === 0 && <Empty icon={<Icon name="search" size={34} />} title="找不到動作" text="換個關鍵字試試看" />}
    </div>
  )
}
