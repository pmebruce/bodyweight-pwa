import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { usePath, wasPop } from './lib/router'
import TabBar, { tabIndexOf } from './components/TabBar'
import { Toaster } from './components/ui'
import Home from './pages/Home'
import Library from './pages/Library'
import ExerciseDetail from './pages/ExerciseDetail'
import Plans from './pages/Plans'
import PlanDetail from './pages/PlanDetail'
import PlanEditor from './pages/PlanEditor'
import History from './pages/History'
import Settings from './pages/Settings'
import Workout from './pages/Workout'
import Onboarding from './pages/Onboarding'
import { useStore } from './lib/store'

function route(path: string) {
  const [base, query = ''] = path.split('?')
  const parts = base.split('/').filter(Boolean).map(decodeURIComponent)
  const params = new URLSearchParams(query)
  switch (parts[0]) {
    case undefined:
      return <Home />
    case 'library':
      return <Library />
    case 'exercise':
      return <ExerciseDetail id={parts[1]} />
    case 'plans':
      return <Plans />
    case 'plan':
      return <PlanDetail id={parts[1]} />
    case 'plan-edit':
      return <PlanEditor id={parts[1] ?? 'new'} from={params.get('from') ?? undefined} />
    case 'history':
      return <History />
    case 'settings':
      return <Settings />
    case 'workout':
      return <Workout planId={parts[1]} />
    default:
      return <Home />
  }
}

const depthOf = (p: string) => p.split('?')[0].split('/').filter(Boolean).length + (p.startsWith('/plan/') || p.startsWith('/exercise/') ? 1 : 0)

export default function App() {
  const path = usePath()
  const { data } = useStore()
  const isWorkout = path.startsWith('/workout')
  const prev = useRef(path)
  const scrolls = useRef(new Map<string, number>())
  const dirRef = useRef(0)

  if (prev.current !== path) {
    const a = prev.current
    const ta = tabIndexOf(a)
    const tb = tabIndexOf(path)
    if (ta !== tb) dirRef.current = tb > ta ? 1 : -1
    else dirRef.current = depthOf(path) >= depthOf(a) && !wasPop() ? 1 : -1
    prev.current = path
  }
  const dir = dirRef.current

  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => scrolls.current.set(prev.current, window.scrollY))
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  return (
    <div className="app">
      <AnimatePresence
        mode="wait"
        initial={false}
        custom={dir}
        onExitComplete={() => {
          const y = wasPop() ? scrolls.current.get(prev.current) ?? 0 : 0
          window.scrollTo(0, y)
        }}
      >
        <motion.main
          key={path.split('?')[0]}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 28 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -28, transition: { duration: 0.12 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
        >
          {route(path)}
        </motion.main>
      </AnimatePresence>
      <AnimatePresence>
        {!isWorkout && (
          <motion.div key="tabbar" className="tabbar-wrap" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 400, damping: 36 }}>
            <TabBar path={path} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{!data.settings.onboarded && <Onboarding key="onboarding" />}</AnimatePresence>
      <Toaster />
    </div>
  )
}
