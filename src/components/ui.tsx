import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'
import { goBack } from '../lib/router'

export function PageHeader({ title, subtitle, right, back }: { title: string; subtitle?: string; right?: ReactNode; back?: string }) {
  return (
    <header className="page-header">
      {back !== undefined && (
        <motion.button whileTap={{ scale: 0.88 }} className="icon-btn" onClick={() => goBack(back)} aria-label="返回">
          <Icon name="back" />
        </motion.button>
      )}
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {right && <div className="page-header-right">{right}</div>}
    </header>
  )
}

export function Sheet({ open, onClose, title, children, tall }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; tall?: boolean }) {
  const controls = useDragControls()
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="sheet-backdrop" onClick={onClose} />
          <motion.div
            className={`sheet ${tall ? 'tall' : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="sheet-grab" onPointerDown={(e) => controls.start(e)}>
              <div className="sheet-handle" />
              {title && <h3 className="sheet-title">{title}</h3>}
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ConfirmOpts {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function useConfirm() {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), [])
  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  const el = (
    <AnimatePresence>
      {state && (
        <motion.div className="dialog-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="sheet-backdrop" onClick={() => close(false)} />
          <motion.div className="dialog" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }}>
            <h3>{state.title}</h3>
            {state.message && <p className="muted">{state.message}</p>}
            <div className="dialog-actions">
              <button className="btn ghost" onClick={() => close(false)}>
                {state.cancelText ?? '取消'}
              </button>
              <button className={`btn ${state.danger ? 'danger' : 'primary'}`} onClick={() => close(true)}>
                {state.confirmText ?? '確定'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
  return [confirm, el] as const
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: msg }))
}

export function Toaster() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const n = useRef(0)
  useEffect(() => {
    const on = (e: Event) => {
      const id = ++n.current
      setItems((x) => [...x, { id, msg: (e as CustomEvent<string>).detail }])
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2200)
    }
    window.addEventListener('app:toast', on)
    return () => window.removeEventListener('app:toast', on)
  }, [])
  return (
    <div className="toaster">
      <AnimatePresence>
        {items.map((i) => (
          <motion.div key={i.id} className="toast" layout initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}>
            {i.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; label?: string }) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="stepper" aria-label={label}>
      <motion.button whileTap={{ scale: 0.85 }} className="stepper-btn" onClick={() => set(value - step)} disabled={value <= min} aria-label="減少">
        <Icon name="minus" size={16} stroke={2.6} />
      </motion.button>
      <div className="stepper-val">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.15 }}>
            {value}
          </motion.span>
        </AnimatePresence>
        {suffix && <small>{suffix}</small>}
      </div>
      <motion.button whileTap={{ scale: 0.85 }} className="stepper-btn" onClick={() => set(value + step)} disabled={value >= max} aria-label="增加">
        <Icon name="plus" size={16} stroke={2.6} />
      </motion.button>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <motion.span className="toggle-knob" layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} />
    </button>
  )
}

export function Difficulty({ level }: { level: number }) {
  return (
    <span className="diff" aria-label={`難度 ${level}`}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </motion.div>
  )
}
