export const pad = (n: number) => String(n).padStart(2, '0')

export function mmss(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

export function durationLabel(sec: number) {
  const m = Math.round(sec / 60)
  if (m < 1) return `${Math.max(1, Math.round(sec))} 秒`
  if (m < 60) return `${m} 分鐘`
  return `${Math.floor(m / 60)} 小時 ${m % 60} 分`
}

const WD = ['日', '一', '二', '三', '四', '五', '六']
export const weekdayLabel = (d: Date) => WD[d.getDay()]

export function dateLabel(ts: number) {
  const d = new Date(ts)
  const today = startOfDay(new Date())
  const diff = Math.round((today.getTime() - startOfDay(d).getTime()) / 86400000)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (diff === 0) return `今天 ${time}`
  if (diff === 1) return `昨天 ${time}`
  return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）${time}`
}

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早安'
  if (h < 14) return '午安'
  if (h < 18) return '下午好'
  return '晚安'
}
