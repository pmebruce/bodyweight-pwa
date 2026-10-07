import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import { useMemo, useState } from 'react'
import { uid, useStore } from '../lib/store'
import type { Exercise, Plan, PlanItem } from '../types'
import { EXERCISES, EX_MAP, GROUPS } from '../data/exercises'
import StickFigure from '../components/StickFigure'
import { Sheet, Stepper, toast, useConfirm } from '../components/ui'
import Icon from '../components/Icon'
import { goBack, navigate } from '../lib/router'
import { planEstimate } from '../lib/stats'

const HUES = [18, 340, 265, 200, 160, 45]

interface Row extends PlanItem {
  key: string
}

export default function PlanEditor({ id, from }: { id: string; from?: string }) {
  const { getPlan, savePlan, data } = useStore()
  const [confirm, confirmEl] = useConfirm()
  const initial = useMemo<Plan>(() => {
    if (id !== 'new') {
      const p = getPlan(id)
      if (p) return p
    }
    if (from) {
      const src = getPlan(from)
      if (src) return { ...src, id: uid(), name: `${src.name}（我的）`, builtIn: false }
    }
    return { id: uid(), name: '', description: '', hue: HUES[Math.floor(Math.random() * HUES.length)], items: [] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [name, setName] = useState(initial.name)
  const [desc, setDesc] = useState(initial.description)
  const [hue, setHue] = useState(initial.hue)
  const [rows, setRows] = useState<Row[]>(() => initial.items.map((it) => ({ ...it, key: uid() })))
  const [picker, setPicker] = useState(false)
  const isEdit = id !== 'new'

  const update = (key: string, patch: Partial<PlanItem>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key))
  const add = (ex: Exercise) => {
    setRows((rs) => [
      ...rs,
      {
        key: uid(),
        exerciseId: ex.id,
        sets: 3,
        reps: ex.type === 'reps' ? ex.defaultReps : undefined,
        seconds: ex.type === 'time' ? ex.defaultSeconds : undefined,
        rest: data.settings.defaultRest,
      },
    ])
    toast(`已加入 ${ex.name}`)
  }

  const plan: Plan = { id: initial.id, name: name.trim(), description: desc.trim(), hue, items: rows.map(({ key: _k, ...it }) => it) }
  const est = planEstimate(plan)
  const canSave = plan.name.length > 0 && plan.items.length > 0

  const save = () => {
    if (!canSave) {
      toast(plan.name ? '請至少加入一個動作' : '請輸入計畫名稱')
      return
    }
    savePlan(plan)
    toast(isEdit ? '已儲存變更' : '已建立計畫 🎉')
    if (isEdit) goBack(`/plan/${plan.id}`)
    else navigate(`/plan/${plan.id}`, { replace: true })
  }

  const cancel = async () => {
    const dirty = name !== initial.name || desc !== initial.description || rows.length !== initial.items.length || hue !== initial.hue
    if (!dirty || (await confirm({ title: '放棄編輯？', message: '尚未儲存的變更將會遺失。', confirmText: '放棄', danger: true }))) goBack('/plans')
  }

  return (
    <div className="page with-cta">
      <header className="page-header">
        <motion.button whileTap={{ scale: 0.88 }} className="icon-btn" onClick={cancel} aria-label="取消">
          <Icon name="x" />
        </motion.button>
        <div className="page-header-text">
          <h1 style={{ fontSize: 22 }}>{isEdit ? '編輯計畫' : '建立計畫'}</h1>
        </div>
      </header>

      <div className="form-card">
        <label className="field">
          <span>計畫名稱</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：上班前 15 分鐘" maxLength={24} />
        </label>
        <label className="field">
          <span>說明（選填）</span>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="簡單描述這個計畫" maxLength={60} />
        </label>
        <div className="field">
          <span>顏色</span>
          <div className="hues">
            {HUES.map((h) => (
              <motion.button
                key={h}
                whileTap={{ scale: 0.85 }}
                className={`hue ${h === hue ? 'on' : ''}`}
                style={{ background: `linear-gradient(135deg, hsl(${h} 92% 60%), hsl(${(h + 38) % 360} 88% 52%))` }}
                onClick={() => setHue(h)}
                aria-label={`顏色 ${h}`}
              >
                {h === hue && <Icon name="check" size={16} stroke={3} />}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>動作（{rows.length}）</h2>
        <span className="muted small">約 {est.minutes} 分鐘 · {est.sets} 組</span>
      </div>

      <Reorder.Group axis="y" values={rows} onReorder={setRows} className="edit-list">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <EditRow key={r.key} row={r} onChange={(p) => update(r.key, p)} onRemove={() => remove(r.key)} />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <motion.button className="add-btn" whileTap={{ scale: 0.97 }} onClick={() => setPicker(true)}>
        <Icon name="plus" size={20} stroke={2.6} /> 加入動作
      </motion.button>

      <div className="cta-bar">
        <motion.button className="btn primary block" whileTap={{ scale: 0.96 }} onClick={save} style={{ opacity: canSave ? 1 : 0.55 }}>
          <Icon name="check" size={18} stroke={2.6} /> {isEdit ? '儲存變更' : '建立計畫'}
        </motion.button>
      </div>

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={add} />
      {confirmEl}
    </div>
  )
}

function EditRow({ row, onChange, onRemove }: { row: Row; onChange: (p: Partial<PlanItem>) => void; onRemove: () => void }) {
  const controls = useDragControls()
  const ex = EX_MAP[row.exerciseId]
  const timed = row.seconds !== undefined
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="edit-row"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.03, boxShadow: '0 16px 40px rgba(0,0,0,.25)', zIndex: 5 }}
    >
      <div className="edit-row-inner">
        <div className="edit-row-head">
          <button className="grip" onPointerDown={(e) => controls.start(e)} aria-label="拖曳排序">
            <Icon name="grip" size={20} stroke={3} />
          </button>
          <div className="item-fig small">
            <StickFigure demo={ex.demo} playing={false} />
          </div>
          <h3>{ex.name}</h3>
          <div className="seg">
            <button className={!timed ? 'on' : ''} onClick={() => onChange({ seconds: undefined, reps: row.reps ?? ex.defaultReps ?? 10 })}>
              次數
            </button>
            <button className={timed ? 'on' : ''} onClick={() => onChange({ reps: undefined, seconds: row.seconds ?? ex.defaultSeconds ?? 30 })}>
              秒數
            </button>
          </div>
          <button className="icon-btn small danger-text" onClick={onRemove} aria-label="移除">
            <Icon name="trash" size={18} />
          </button>
        </div>
        <div className="edit-row-fields">
          <div>
            <span>組數</span>
            <Stepper value={row.sets} min={1} max={10} onChange={(v) => onChange({ sets: v })} />
          </div>
          <div>
            <span>{timed ? '秒數' : '次數'}</span>
            {timed ? (
              <Stepper value={row.seconds ?? 30} min={5} max={600} step={5} onChange={(v) => onChange({ seconds: v })} />
            ) : (
              <Stepper value={row.reps ?? 10} min={1} max={200} onChange={(v) => onChange({ reps: v })} />
            )}
          </div>
          <div>
            <span>休息</span>
            <Stepper value={row.rest} min={0} max={300} step={5} onChange={(v) => onChange({ rest: v })} />
          </div>
        </div>
      </div>
    </Reorder.Item>
  )
}

function ExercisePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('全部')
  const list = EXERCISES.filter((e) => (group === '全部' || e.group === group) && (!q || e.name.includes(q) || e.muscles.some((m) => m.includes(q))))
  return (
    <Sheet open={open} onClose={onClose} title="加入動作" tall>
      <div className="search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋動作" />
      </div>
      <div className="chips">
        {GROUPS.map((g) => (
          <button key={g} className={`chip-btn ${g === group ? 'active' : ''}`} onClick={() => setGroup(g)}>
            {g === group && <motion.span layoutId="picker-pill" className="chip-pill" />}
            <span>{g}</span>
          </button>
        ))}
      </div>
      <ul className="picker-list">
        {list.map((e) => (
          <motion.li key={e.id} whileTap={{ scale: 0.97 }} onClick={() => onPick(e)}>
            <div className="item-fig small">
              <StickFigure demo={e.demo} playing={false} />
            </div>
            <div className="item-text">
              <h3>{e.name}</h3>
              <p className="muted">
                {e.group} · {e.type === 'reps' ? `${e.defaultReps} 下` : `${e.defaultSeconds} 秒`}
              </p>
            </div>
            <span className="add-dot">
              <Icon name="plus" size={18} stroke={2.6} />
            </span>
          </motion.li>
        ))}
      </ul>
      <button className="btn primary block" onClick={onClose} style={{ marginTop: 12 }}>
        完成
      </button>
    </Sheet>
  )
}
