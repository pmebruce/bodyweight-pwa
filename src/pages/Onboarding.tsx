import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import ExerciseFigure from '../components/ExerciseFigure'
import { useStore } from '../lib/store'

const MAX = 20

/** keep the card above the iOS keyboard: track the visual viewport height in a CSS variable */
function useVisualViewport(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const vv = window.visualViewport
    const el = ref.current
    if (!vv || !el) return
    const on = () => {
      el.style.setProperty('--vvh', `${vv.height}px`)
      el.style.setProperty('--vvt', `${vv.offsetTop}px`)
    }
    on()
    vv.addEventListener('resize', on)
    vv.addEventListener('scroll', on)
    return () => {
      vv.removeEventListener('resize', on)
      vv.removeEventListener('scroll', on)
    }
  }, [ref])
}

/** first launch: ask what to call the user (or skip) */
export default function Onboarding() {
  const { updateSettings } = useStore()
  const [name, setName] = useState('')
  const wrap = useRef<HTMLDivElement>(null)
  useVisualViewport(wrap)
  const v = name.trim()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!v) return
    ;(document.activeElement as HTMLElement | null)?.blur()
    updateSettings({ nickname: v.slice(0, MAX), onboarded: true })
  }
  const skip = () => updateSettings({ onboarded: true })

  return (
    <motion.div
      ref={wrap}
      className="onb"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-q"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="onb-glow" aria-hidden="true" />
      <motion.form
        className="onb-card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      >
        <motion.div className="onb-fig" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 20 }}>
          <ExerciseFigure demo="jack" highlight={false} />
        </motion.div>
        <motion.p className="onb-hi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          嗨，歡迎！<span className="wave">👋</span>
        </motion.p>
        <motion.h1 id="onb-q" className="onb-q" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          怎麼稱呼你？
        </motion.h1>
        <motion.p className="onb-sub muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          用來跟你打招呼，之後可在「設定」修改
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <input
            className="onb-input"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX))}
            maxLength={MAX}
            placeholder="你的名字或暱稱"
            autoFocus
            autoComplete="nickname"
            enterKeyHint="go"
            aria-label="你的名字"
          />
          <button type="submit" className="btn primary block onb-go" disabled={!v}>
            開始
          </button>
          <button type="button" className="onb-skip" onClick={skip}>
            先跳過
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
