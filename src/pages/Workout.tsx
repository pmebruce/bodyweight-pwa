import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { uid, useStore } from '../lib/store'
import { resolvePlan, itemTarget } from '../lib/plan'
import { EX_MAP } from '../data/exercises'
import type { Exercise, Plan, WorkoutLog } from '../types'
import StickFigure from '../components/StickFigure'
import Ring from '../components/Ring'
import CountUp from '../components/CountUp'
import Icon from '../components/Icon'
import { Sheet } from '../components/ui'
import { goBack, navigate } from '../lib/router'
import { beep, chime, speak, stopSpeaking, unlockMedia, vibrate, WakeLockKeeper } from '../lib/cues'
import { mmss } from '../lib/format'
import { planEstimate } from '../lib/stats'

interface WorkStep {
  kind: 'work'
  ex: Exercise
  set: number
  sets: number
  reps?: number
  seconds?: number
  workNo: number
}
type Step = WorkStep | { kind: 'rest' | 'prep'; seconds: number; next: WorkStep }

function buildSteps(plan: Plan, prep: number): { steps: Step[]; totalWork: number } {
  const works: { w: WorkStep; rest: number }[] = []
  let workNo = 0
  plan.items.forEach((it) => {
    const ex = EX_MAP[it.exerciseId]
    if (!ex) return
    workNo++
    for (let s = 1; s <= it.sets; s++) {
      works.push({ w: { kind: 'work', ex, set: s, sets: it.sets, reps: it.seconds ? undefined : it.reps ?? 10, seconds: it.seconds, workNo }, rest: it.rest })
    }
  })
  const steps: Step[] = []
  if (works.length && prep > 0) steps.push({ kind: 'prep', seconds: prep, next: works[0].w })
  works.forEach((x, i) => {
    steps.push(x.w)
    if (i < works.length - 1 && x.rest > 0) steps.push({ kind: 'rest', seconds: x.rest, next: works[i + 1].w })
  })
  return { steps, totalWork: workNo }
}

const stepSeconds = (s: Step) => (s.kind === 'work' ? s.seconds : s.seconds)

interface Result {
  exerciseId: string
  seconds: number
  reps: number
}

export default function Workout({ planId }: { planId: string }) {
  const { plans, data, addLog } = useStore()
  const settings = data.settings
  const plan = useMemo(() => resolvePlan(planId, plans, settings), [planId]) // eslint-disable-line react-hooks/exhaustive-deps
  const { steps, totalWork } = useMemo(() => (plan ? buildSteps(plan, settings.prepSeconds) : { steps: [], totalWork: 0 }), [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [quitOpen, setQuitOpen] = useState(false)
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [wakeHeld, setWakeHeld] = useState(false)

  const endAt = useRef(0)
  const pausedLeft = useRef(0)
  const pauseStart = useRef(0)
  const pausedTotal = useRef(0)
  const stepStart = useRef(0)
  const startedAt = useRef(0)
  const lastSec = useRef(-1)
  const results = useRef<Map<number, Result>>(new Map())
  const wake = useRef(new WakeLockKeeper())
  const cfg = useRef(settings)
  cfg.current = settings

  const say = (t: string) => cfg.current.voice && speak(t)
  const tone = (f: number, ms = 120) => cfg.current.sound && beep(f, ms)
  const buzz = (p: number | number[]) => cfg.current.vibrate && vibrate(p)

  // lock page scroll + cleanup
  useEffect(() => {
    document.body.classList.add('no-scroll')
    const w = wake.current
    return () => {
      document.body.classList.remove('no-scroll')
      stopSpeaking()
      w.stop()
    }
  }, [])

  const enterStep = useCallback(
    (i: number, d = 1) => {
      const s = steps[i]
      if (!s) return
      const t = Date.now()
      setDir(d)
      setIdx(i)
      stepStart.current = t
      lastSec.current = -1
      const sec = stepSeconds(s)
      endAt.current = sec ? t + sec * 1000 : 0
      if (s.kind === 'work') {
        tone(988, 220)
        buzz(80)
        const setTxt = s.sets > 1 ? `第${s.set}組，` : ''
        say(s.seconds ? `${s.ex.name}，${setTxt}${s.seconds}秒，開始` : `${s.ex.name}，${setTxt}${s.reps}下`)
      } else if (s.kind === 'rest') {
        tone(523, 160)
        say(`休息${s.seconds}秒。下一個，${s.next.ex.name}`)
      } else {
        say(`準備開始。第一個動作，${s.next.ex.name}`)
      }
    },
    [steps], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const finish = useCallback(
    (completed: boolean) => {
      const t = Date.now()
      if (paused) pausedTotal.current += t - pauseStart.current
      const res = [...results.current.values()]
      const agg = new Map<string, { exerciseId: string; sets: number; reps: number; seconds: number }>()
      res.forEach((r) => {
        const a = agg.get(r.exerciseId) ?? { exerciseId: r.exerciseId, sets: 0, reps: 0, seconds: 0 }
        a.sets++
        a.reps += r.reps
        a.seconds += Math.round(r.seconds)
        agg.set(r.exerciseId, a)
      })
      const activeSeconds = Math.round(res.reduce((a, r) => a + r.seconds, 0))
      const totalSeconds = Math.max(activeSeconds, Math.round((t - startedAt.current - pausedTotal.current) / 1000))
      const kcal = res.reduce((a, r) => a + (r.seconds / 60) * (EX_MAP[r.exerciseId]?.kcalPerMin ?? 6), 0) + ((totalSeconds - activeSeconds) / 60) * 1.5
      const entry: WorkoutLog = {
        id: uid(),
        planId: plan!.id,
        planName: plan!.name,
        startedAt: startedAt.current,
        finishedAt: t,
        activeSeconds,
        totalSeconds,
        sets: res.length,
        reps: res.reduce((a, r) => a + r.reps, 0),
        exercises: [...agg.values()],
        kcal: Math.round(kcal),
        completed,
      }
      if (res.length > 0) addLog(entry)
      setLog(entry)
      setPaused(false)
      setPhase('done')
      wake.current.stop()
      setWakeHeld(false)
      if (completed) {
        if (cfg.current.sound) chime()
        buzz([100, 60, 100, 60, 240])
        say('訓練完成，做得好！')
      } else {
        say('訓練結束，辛苦了')
      }
    },
    [paused, plan, addLog], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const advance = useCallback(() => {
    if (idx + 1 >= steps.length) finish(true)
    else enterStep(idx + 1, 1)
  }, [idx, steps.length, finish, enterStep])

  const completeWork = useCallback(() => {
    const s = steps[idx]
    if (s?.kind === 'work') {
      const secs = s.seconds ?? (Date.now() - stepStart.current) / 1000
      results.current.set(idx, { exerciseId: s.ex.id, seconds: Math.min(secs, s.seconds ?? 600), reps: s.reps ?? 0 })
    }
    advance()
  }, [steps, idx, advance])

  // main clock
  useEffect(() => {
    if (phase !== 'run' || paused) return
    let raf = 0
    const loop = () => {
      const t = Date.now()
      setNow(t)
      const s = steps[idx]
      if (s && endAt.current) {
        const left = endAt.current - t
        const sec = Math.ceil(left / 1000)
        if (sec !== lastSec.current) {
          lastSec.current = sec
          if (sec <= 3 && sec >= 1) {
            tone(660, 110)
            if (s.kind !== 'work') buzz(30)
          }
          if (s.kind === 'work' && s.seconds && s.seconds >= 20 && sec === 10) say('還剩10秒')
        }
        if (left <= 0) {
          if (s.kind === 'work') {
            buzz(200)
            completeWork()
          } else advance()
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, paused, idx, steps, completeWork, advance]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    unlockMedia()
    startedAt.current = Date.now()
    pausedTotal.current = 0
    results.current.clear()
    setPhase('run')
    enterStep(0)
    await wake.current.start()
    setWakeHeld(wake.current.held)
  }

  const pause = () => {
    if (paused) return
    pauseStart.current = Date.now()
    pausedLeft.current = endAt.current ? endAt.current - Date.now() : 0
    setPaused(true)
    stopSpeaking()
  }
  const resume = () => {
    if (!paused) return
    const t = Date.now()
    const d = t - pauseStart.current
    pausedTotal.current += d
    stepStart.current += d
    if (endAt.current) endAt.current = t + pausedLeft.current
    setNow(t)
    setPaused(false)
  }
  const skip = () => {
    if (paused) resume()
    advance()
  }
  const back = () => {
    if (paused) resume()
    let j = idx - 1
    while (j >= 0 && steps[j].kind !== 'work') j--
    if (j < 0) j = idx
    for (const k of [...results.current.keys()]) if (k >= j) results.current.delete(k)
    enterStep(j, -1)
  }
  const addRest = (sec: number) => {
    endAt.current += sec * 1000
    lastSec.current = -1
    setNow(Date.now())
  }

  const openQuit = () => {
    if (phase === 'run') pause()
    setQuitOpen(true)
  }

  if (!plan || steps.length === 0)
    return (
      <div className="workout">
        <div className="wk-center">
          <h2>找不到這個計畫</h2>
          <button className="btn primary" onClick={() => navigate('/', { replace: true })}>
            回首頁
          </button>
        </div>
      </div>
    )

  const step = steps[idx]
  const total = stepSeconds(step) ?? 0
  const leftMs = phase === 'run' ? (paused ? pausedLeft.current : Math.max(0, endAt.current - now)) : total * 1000
  const fracInStep = total ? 1 - leftMs / (total * 1000) : 0
  const progress = phase === 'done' ? 1 : (idx + (step.kind === 'work' && !step.seconds ? 0 : fracInStep)) / steps.length
  const hue = step.kind === 'work' || phase !== 'run' ? plan.hue : 190
  const doneCount = results.current.size

  return (
    <motion.div className="workout" style={{ ['--wk-hue' as string]: hue }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
      <motion.div className="wk-bg" animate={{ background: `radial-gradient(120% 80% at 50% 0%, hsl(${hue} 70% 26%) 0%, #0a0a10 70%)` }} transition={{ duration: 0.8 }} />

      {phase !== 'done' && (
        <div className="wk-top">
          <motion.button whileTap={{ scale: 0.85 }} className="wk-icon" onClick={phase === 'ready' ? () => goBack('/') : openQuit} aria-label="離開">
            <Icon name="x" />
          </motion.button>
          <div className="wk-title">
            <b>{plan.name}</b>
            <span>
              {phase === 'ready' ? `${totalWork} 個動作` : step.kind === 'work' ? `動作 ${step.workNo} / ${totalWork}` : step.kind === 'rest' ? '休息中' : '準備'}
              {wakeHeld && ' · 螢幕常亮'}
            </span>
          </div>
          <div className="wk-time">{phase === 'run' ? mmss((now - startedAt.current - pausedTotal.current - (paused ? now - pauseStart.current : 0)) / 1000) : ''}</div>
        </div>
      )}
      {phase !== 'done' && (
        <div className="wk-progress">
          <motion.div className="wk-progress-fill" animate={{ width: `${progress * 100}%` }} transition={{ type: 'tween', ease: 'linear', duration: 0.12 }} />
        </div>
      )}

      <div className="wk-stage">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          {phase === 'ready' && <ReadyView key="ready" plan={plan} onStart={start} />}
          {phase === 'run' && (
            <motion.div
              key={idx}
              className="wk-step"
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0, scale: 0.94 }),
                center: { x: 0, opacity: 1, scale: 1 },
                exit: (d: number) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0, scale: 0.94 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              {step.kind === 'work' ? (
                <WorkView step={step} leftMs={leftMs} frac={fracInStep} onComplete={completeWork} paused={paused} />
              ) : (
                <RestView kind={step.kind} next={step.next} leftMs={leftMs} frac={fracInStep} onAdd={() => addRest(10)} onSkip={skip} />
              )}
            </motion.div>
          )}
          {phase === 'done' && log && <DoneView key="done" log={log} plan={plan} />}
        </AnimatePresence>
      </div>

      {phase === 'run' && (
        <div className="wk-controls">
          <motion.button whileTap={{ scale: 0.85 }} className="wk-ctrl" onClick={back} aria-label="上一個">
            <Icon name="prev" size={24} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="wk-ctrl main" onClick={paused ? resume : pause} aria-label={paused ? '繼續' : '暫停'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={paused ? 'play' : 'pause'} initial={{ scale: 0.4, opacity: 0, rotate: -45 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0, rotate: 45 }} transition={{ duration: 0.15 }}>
                <Icon name={paused ? 'play' : 'pause'} size={30} />
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <motion.button whileTap={{ scale: 0.85 }} className="wk-ctrl" onClick={skip} aria-label="跳過">
            <Icon name="next" size={24} />
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {paused && !quitOpen && (
          <motion.div className="wk-paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resume}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="wk-paused-card">
              <h2>已暫停</h2>
              <p>點一下任意處繼續</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={quitOpen} onClose={() => setQuitOpen(false)} title="要結束訓練嗎？">
        <p className="muted" style={{ marginTop: 0 }}>
          {doneCount > 0 ? `已完成 ${doneCount} 組，可以先儲存這次的進度。` : '目前還沒有完成任何一組。'}
        </p>
        <div className="sheet-actions">
          <button
            className="btn primary block"
            onClick={() => {
              setQuitOpen(false)
              resume()
            }}
          >
            繼續訓練
          </button>
          {doneCount > 0 && (
            <button
              className="btn ghost block"
              onClick={() => {
                setQuitOpen(false)
                finish(false)
              }}
            >
              結束並儲存紀錄
            </button>
          )}
          <button
            className="btn danger-ghost block"
            onClick={() => {
              setQuitOpen(false)
              goBack('/')
            }}
          >
            放棄訓練
          </button>
        </div>
      </Sheet>
    </motion.div>
  )
}

function ReadyView({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  const est = planEstimate(plan)
  const first = EX_MAP[plan.items[0].exerciseId]
  return (
    <motion.div className="wk-step wk-ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
      <div className="wk-fig big">
        <StickFigure demo={first.demo} />
      </div>
      <h1 className="wk-name">準備好了嗎？</h1>
      <p className="wk-sub">
        約 {est.minutes} 分鐘 · {plan.items.length} 個動作 · {est.sets} 組
      </p>
      <ul className="wk-ready-list">
        {plan.items.slice(0, 6).map((it, i) => (
          <li key={i}>
            <span>{EX_MAP[it.exerciseId]?.name}</span>
            <span>
              {it.sets} × {itemTarget(it)}
            </span>
          </li>
        ))}
        {plan.items.length > 6 && <li className="more">還有 {plan.items.length - 6} 個動作…</li>}
      </ul>
      <motion.button className="wk-start" onClick={onStart} whileTap={{ scale: 0.92 }} animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,.35)', '0 0 0 22px rgba(255,255,255,0)'] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        <Icon name="play" size={26} /> 開始
      </motion.button>
      <p className="wk-hint">建議開啟聲音；把手機放在看得到的地方</p>
    </motion.div>
  )
}

function useRingSize(base: number) {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const on = () => setH(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return h < 700 ? base - 50 : h < 790 ? base - 25 : base
}

function BigNumber({ value, urgent }: { value: number | string; urgent?: boolean }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        className={`wk-big ${urgent ? 'urgent' : ''}`}
        initial={{ y: 24, opacity: 0, scale: urgent ? 1.4 : 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

function WorkView({ step, leftMs, frac, onComplete, paused }: { step: WorkStep; leftMs: number; frac: number; onComplete: () => void; paused: boolean }) {
  const sec = Math.ceil(leftMs / 1000)
  const [tapped, setTapped] = useState(false)
  const size = useRingSize(210)
  return (
    <>
      <div className="wk-chip">
        第 {step.set} / {step.sets} 組
      </div>
      <h1 className="wk-name">{step.ex.name}</h1>
      <div className="wk-fig">
        <StickFigure demo={step.ex.demo} playing={!paused} />
      </div>
      {step.seconds ? (
        <Ring progress={1 - frac} size={size} id="ring-work">
          <BigNumber value={sec} urgent={sec <= 3} />
          <span className="wk-unit">秒</span>
        </Ring>
      ) : (
        <motion.button
          className="wk-rep-btn"
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            if (tapped) return
            setTapped(true)
            setTimeout(onComplete, 380)
          }}
          aria-label="完成這組"
        >
          <Ring progress={tapped ? 1 : 0.999} size={size} id="ring-rep" colors={tapped ? ['#34d399', '#10b981'] : undefined}>
            <AnimatePresence mode="wait" initial={false}>
              {tapped ? (
                <motion.svg key="ok" width="84" height="84" viewBox="0 0 24 24" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <motion.path d="M4.5 12.5l5 5 10-11" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                </motion.svg>
              ) : (
                <motion.div key="n" className="wk-rep-inner" exit={{ scale: 0.6, opacity: 0 }}>
                  <span className="wk-big">{step.reps}</span>
                  <span className="wk-unit">下</span>
                  <motion.span className="wk-tap" animate={{ opacity: [0.55, 1, 0.55] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                    完成後點一下
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </Ring>
        </motion.button>
      )}
    </>
  )
}

function RestView({ kind, next, leftMs, frac, onAdd, onSkip }: { kind: 'rest' | 'prep'; next: WorkStep; leftMs: number; frac: number; onAdd: () => void; onSkip: () => void }) {
  const sec = Math.ceil(leftMs / 1000)
  const size = useRingSize(230)
  return (
    <>
      <div className="wk-chip calm">{kind === 'prep' ? '準備開始' : '休息一下'}</div>
      <Ring progress={1 - frac} size={size} id="ring-rest" colors={['#38bdf8', '#818cf8']}>
        <BigNumber value={sec} urgent={sec <= 3} />
        <span className="wk-unit">{kind === 'prep' ? '準備' : '秒'}</span>
      </Ring>
      {kind === 'rest' && (
        <div className="wk-rest-actions">
          <motion.button whileTap={{ scale: 0.9 }} className="pill-btn" onClick={onAdd}>
            +10 秒
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="pill-btn" onClick={onSkip}>
            跳過休息
          </motion.button>
        </div>
      )}
      <div className="wk-next">
        <div className="wk-next-fig">
          <StickFigure demo={next.ex.demo} />
        </div>
        <div>
          <span className="wk-next-label">下一個</span>
          <b>{next.ex.name}</b>
          <span className="wk-next-meta">
            第 {next.set}/{next.sets} 組 · {next.seconds ? `${next.seconds} 秒` : `${next.reps} 下`}
          </span>
        </div>
      </div>
    </>
  )
}

function DoneView({ log, plan }: { log: WorkoutLog; plan: Plan }) {
  useEffect(() => {
    if (!log.completed) return
    const opts = { zIndex: 2000, disableForReducedMotion: true }
    const colors = ['#ff6a3d', '#ff2e7e', '#ffd166', '#06d6a0', '#4cc9f0', '#ffffff']
    const t1 = setTimeout(() => confetti({ ...opts, particleCount: 120, spread: 80, startVelocity: 48, origin: { y: 0.65 }, colors }), 250)
    const t2 = setTimeout(() => {
      confetti({ ...opts, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors })
      confetti({ ...opts, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors })
    }, 650)
    const t3 = setTimeout(() => confetti({ ...opts, particleCount: 80, spread: 120, startVelocity: 30, origin: { y: 0.3 }, colors, scalar: 0.9 }), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      confetti.reset()
    }
  }, [log])
  const mins = log.totalSeconds / 60
  return (
    <motion.div className="wk-step wk-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="done-badge" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}>
        <svg width="64" height="64" viewBox="0 0 24 24">
          <motion.path d="M4.5 12.5l5 5 10-11" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.45 }} />
        </svg>
      </motion.div>
      <motion.h1 className="wk-name" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        {log.completed ? '訓練完成！' : '訓練結束'}
      </motion.h1>
      <motion.p className="wk-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        {log.completed ? `你完成了「${plan.name}」💪` : `「${plan.name}」已儲存目前的進度`}
      </motion.p>
      <div className="done-grid">
        {[
          { label: '總時間', node: <CountUp value={mins} format={(n) => (n < 10 ? n.toFixed(1) : String(Math.round(n)))} />, unit: '分鐘' },
          { label: '完成組數', node: <CountUp value={log.sets} />, unit: '組' },
          { label: '總次數', node: <CountUp value={log.reps} />, unit: '下' },
          { label: '估計消耗', node: <CountUp value={log.kcal} />, unit: '大卡' },
        ].map((x, i) => (
          <motion.div key={x.label} className="done-stat" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300, damping: 26 }}>
            <span>{x.label}</span>
            <b>
              {x.node}
              <small>{x.unit}</small>
            </b>
          </motion.div>
        ))}
      </div>
      <motion.ul className="done-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        {log.exercises.map((e) => (
          <li key={e.exerciseId}>
            <span>{EX_MAP[e.exerciseId]?.name}</span>
            <span>
              {e.sets} 組 · {e.reps ? `${e.reps} 下` : `${e.seconds} 秒`}
            </span>
          </li>
        ))}
      </motion.ul>
      <motion.div className="done-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <button className="btn light block" onClick={() => navigate('/history', { replace: true })}>
          查看紀錄
        </button>
        <button className="btn glass block" onClick={() => navigate('/', { replace: true })}>
          回首頁
        </button>
      </motion.div>
    </motion.div>
  )
}
