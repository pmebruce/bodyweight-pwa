import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Plan, Settings, WeightEntry, WorkoutLog } from '../types'
import { BUILTIN_PLANS } from '../data/plans'
import { EX_MAP } from '../data/exercises'
import { setCueVolume } from './cues'
import { FACE } from '../components/figure/draw'

const KEY = 'bwfit:data:v1'

export const DEFAULT_SETTINGS: Settings = {
  nickname: '',
  onboarded: false,
  defaultRest: 30,
  prepSeconds: 5,
  weeklyGoal: 3,
  voice: true,
  sound: true,
  volume: 0.8,
  vibrate: true,
  skin: 'medium',
  hair: 'C',
  body: 'male',
}

function emptyData(): AppData {
  return { version: 1, customPlans: [], history: [], settings: { ...DEFAULT_SETTINGS } }
}

export function sanitize(raw: unknown): AppData {
  const d = emptyData()
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<AppData>
  if (Array.isArray(r.customPlans)) {
    d.customPlans = r.customPlans
      .filter((p) => p && typeof p.id === 'string' && Array.isArray(p.items))
      .map((p) => ({ ...p, builtIn: false, items: p.items.filter((i) => i && EX_MAP[i.exerciseId]) }))
  }
  if (Array.isArray(r.history)) {
    d.history = r.history.filter((h) => h && typeof h.id === 'string' && typeof h.startedAt === 'number')
  }
  if (r.weights && typeof r.weights === 'object') {
    const w: Record<string, WeightEntry[]> = {}
    for (const [id, list] of Object.entries(r.weights)) {
      if (!Array.isArray(list)) continue
      const ok = list.filter((e) => e && typeof e.at === 'number' && Array.isArray(e.kg) && e.kg.length > 0 && e.kg.every((x) => typeof x === 'number' && x >= 0))
      if (ok.length) w[id] = ok
    }
    d.weights = w
  }
  if (r.settings && typeof r.settings === 'object') {
    // any previously stored settings = an existing user: never prompt them, keep their nickname as is
    const st = r.settings as Partial<Settings>
    d.settings = { ...DEFAULT_SETTINGS, ...st, onboarded: st.onboarded ?? true }
    if (typeof d.settings.nickname !== 'string') d.settings.nickname = ''
    // female body type is hidden for now: migrate to male
    d.settings.body = 'male'
  }
  return d
}

function load(): AppData {
  try {
    const s = localStorage.getItem(KEY)
    return s ? sanitize(JSON.parse(s)) : emptyData()
  } catch {
    return emptyData()
  }
}

interface Store {
  data: AppData
  plans: Plan[]
  getPlan: (id: string) => Plan | undefined
  savePlan: (p: Plan) => void
  deletePlan: (id: string) => void
  addLog: (l: WorkoutLog) => void
  deleteLog: (id: string) => void
  /** save dumbbell weights from one workout (newest first, last 50 kept per exercise) */
  logWeights: (entries: Record<string, WeightEntry>) => void
  updateSettings: (s: Partial<Settings>) => void
  replaceAll: (d: AppData) => void
  clearAll: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* storage full or private mode */
    }
  }, [data])

  // 2D figure hair follows the character setting (module-level style read at draw time)
  FACE.hair = data.settings.hair ?? 'C'
  useEffect(() => setCueVolume(data.settings.volume), [data.settings.volume])

  useEffect(() => {
    // ask the browser to keep our data (helps on iOS / Safari eviction)
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  const plans = useMemo(() => [...BUILTIN_PLANS, ...data.customPlans], [data.customPlans])
  const getPlan = useCallback((id: string) => plans.find((p) => p.id === id), [plans])

  const savePlan = useCallback((p: Plan) => {
    setData((d) => {
      const plan = { ...p, builtIn: false, updatedAt: Date.now() }
      const exists = d.customPlans.some((x) => x.id === p.id)
      return { ...d, customPlans: exists ? d.customPlans.map((x) => (x.id === p.id ? plan : x)) : [...d.customPlans, plan] }
    })
  }, [])
  const deletePlan = useCallback((id: string) => setData((d) => ({ ...d, customPlans: d.customPlans.filter((p) => p.id !== id) })), [])
  const addLog = useCallback((l: WorkoutLog) => setData((d) => ({ ...d, history: [l, ...d.history] })), [])
  const deleteLog = useCallback((id: string) => setData((d) => ({ ...d, history: d.history.filter((h) => h.id !== id) })), [])
  const logWeights = useCallback(
    (entries: Record<string, WeightEntry>) =>
      setData((d) => {
        const w = { ...(d.weights ?? {}) }
        for (const [id, e] of Object.entries(entries)) w[id] = [e, ...(w[id] ?? [])].slice(0, 50)
        return { ...d, weights: w }
      }),
    [],
  )
  const updateSettings = useCallback((s: Partial<Settings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...s } })), [])
  const replaceAll = useCallback((nd: AppData) => setData(sanitize(nd)), [])
  const clearAll = useCallback(() => setData(emptyData()), [])

  const value = useMemo(
    () => ({ data, plans, getPlan, savePlan, deletePlan, addLog, deleteLog, logWeights, updateSettings, replaceAll, clearAll }),
    [data, plans, getPlan, savePlan, deletePlan, addLog, deleteLog, logWeights, updateSettings, replaceAll, clearAll],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
