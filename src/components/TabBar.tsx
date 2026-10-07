import { motion } from 'framer-motion'
import Icon from './Icon'
import { navigate } from '../lib/router'

export const TABS = [
  { path: '/', label: '首頁', icon: 'home' },
  { path: '/library', label: '動作庫', icon: 'library' },
  { path: '/plans', label: '計畫', icon: 'plan' },
  { path: '/history', label: '紀錄', icon: 'chart' },
  { path: '/settings', label: '設定', icon: 'gear' },
] as const

export function tabIndexOf(path: string) {
  if (path.startsWith('/library') || path.startsWith('/exercise')) return 1
  if (path.startsWith('/plan')) return 2
  if (path.startsWith('/history')) return 3
  if (path.startsWith('/settings')) return 4
  return 0
}

export default function TabBar({ path }: { path: string }) {
  const active = tabIndexOf(path)
  return (
    <nav className="tabbar">
      {TABS.map((t, i) => (
        <button
          key={t.path}
          className={`tab ${i === active ? 'active' : ''}`}
          onClick={() => {
            if (i === active && path === t.path) window.scrollTo({ top: 0, behavior: 'smooth' })
            else navigate(t.path)
          }}
          aria-label={t.label}
        >
          {i === active && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <motion.span className="tab-icon" animate={{ scale: i === active ? 1.08 : 1, y: i === active ? -1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
            <Icon name={t.icon} size={22} stroke={i === active ? 2.3 : 2} />
          </motion.span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
