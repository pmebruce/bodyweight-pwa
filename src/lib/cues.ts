// Audio / voice / haptic / wake-lock helpers for the workout player.

let ctx: AudioContext | null = null

/** Must be called from a user gesture (iOS requires it to unlock audio + speech). */
export function unlockMedia() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AC) ctx = new AC()
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume()
    // play a silent buffer so iOS fully unlocks the context
    if (ctx) {
      const b = ctx.createBuffer(1, 1, 22050)
      const s = ctx.createBufferSource()
      s.buffer = b
      s.connect(ctx.destination)
      s.start(0)
    }
  } catch {
    /* ignore */
  }
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      u.lang = 'zh-TW'
      speechSynthesis.speak(u)
    }
  } catch {
    /* ignore */
  }
}

export function beep(freq = 880, ms = 120, volume = 0.25) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(volume, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + ms / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

export function chime() {
  beep(660, 140)
  setTimeout(() => beep(880, 140), 140)
  setTimeout(() => beep(1320, 260), 280)
}

let voiceCache: SpeechSynthesisVoice | null | undefined
function pickVoice() {
  if (voiceCache !== undefined && voiceCache !== null) return voiceCache
  const voices = speechSynthesis.getVoices()
  voiceCache =
    voices.find((v) => v.lang === 'zh-TW') ||
    voices.find((v) => /zh[-_]TW|Hant|Taiwan/i.test(v.lang + v.name)) ||
    voices.find((v) => v.lang.startsWith('zh')) ||
    null
  return voiceCache
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-TW'
    u.rate = 1.05
    const v = pickVoice()
    if (v) u.voice = v
    speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

export function stopSpeaking() {
  try {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  } catch {
    /* ignore */
  }
}

export function vibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

export const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

export class WakeLockKeeper {
  private sentinel: WakeLockSentinel | null = null
  private active = false
  private onVis = () => {
    if (this.active && document.visibilityState === 'visible') void this.acquire()
  }
  async start() {
    this.active = true
    document.addEventListener('visibilitychange', this.onVis)
    await this.acquire()
  }
  private async acquire() {
    if (!wakeLockSupported || this.sentinel) return
    try {
      this.sentinel = await navigator.wakeLock.request('screen')
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null
      })
    } catch {
      this.sentinel = null
    }
  }
  get held() {
    return !!this.sentinel
  }
  stop() {
    this.active = false
    document.removeEventListener('visibilitychange', this.onVis)
    void this.sentinel?.release().catch(() => {})
    this.sentinel = null
  }
}
