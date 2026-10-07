import { useEffect, useMemo, useRef } from 'react'
import type { DemoKey } from '../types'
import { DEMOS, fullPose, type FullPose, type Pt } from './demos'

const KEYS: (keyof FullPose)[] = ['h', 'n', 'p', 'eR', 'hR', 'kR', 'fR', 'eL', 'hL', 'kL', 'fL']
const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const f = (q: Pt) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`

interface Props {
  demo: DemoKey
  size?: number | string
  playing?: boolean
  speed?: number
  className?: string
}

export default function StickFigure({ demo, size = '100%', playing = true, speed = 1, className }: Props) {
  const d = DEMOS[demo]
  const poses = useMemo(() => d.poses.map((p) => fullPose(p, d.front)), [d])
  const durs = useMemo(() => poses.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur) / speed), [poses, d, speed])
  const svgRef = useRef<SVGSVGElement>(null)
  const armL = useRef<SVGPathElement>(null)
  const legL = useRef<SVGPathElement>(null)
  const armR = useRef<SVGPathElement>(null)
  const legR = useRef<SVGPathElement>(null)
  const torso = useRef<SVGPathElement>(null)
  const head = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const draw = (q: FullPose) => {
      armL.current?.setAttribute('d', `M${f(q.n)}L${f(q.eL)}L${f(q.hL)}`)
      legL.current?.setAttribute('d', `M${f(q.p)}L${f(q.kL)}L${f(q.fL)}`)
      armR.current?.setAttribute('d', `M${f(q.n)}L${f(q.eR)}L${f(q.hR)}`)
      legR.current?.setAttribute('d', `M${f(q.p)}L${f(q.kR)}L${f(q.fR)}`)
      torso.current?.setAttribute('d', `M${f(q.n)}L${f(q.p)}`)
      head.current?.setAttribute('cx', q.h[0].toFixed(1))
      head.current?.setAttribute('cy', q.h[1].toFixed(1))
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    draw(poses[poses.length > 1 ? 1 : 0])
    if (!playing || reduce || poses.length < 2) return

    const total = durs.reduce((a, b) => a + b, 0)
    let raf = 0
    let visible = true
    const start = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible) return
      let t = (now - start) % total
      let i = 0
      while (t > durs[i] && i < durs.length - 1) {
        t -= durs[i]
        i++
      }
      const a = poses[i]
      const b = poses[(i + 1) % poses.length]
      const k = ease(Math.min(1, t / durs[i]))
      const q = {} as FullPose
      for (const key of KEYS) q[key] = lerp(a[key], b[key], k)
      draw(q)
    }
    raf = requestAnimationFrame(tick)
    let io: IntersectionObserver | undefined
    if (svgRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => (visible = es[0]?.isIntersecting ?? true))
      io.observe(svgRef.current)
    }
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [poses, durs, playing])

  const gid = `g-${demo}`
  return (
    <svg ref={svgRef} className={className} viewBox="0 -14 200 154" width={size} height={size} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="160" y2="140">
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent2)' }} />
        </linearGradient>
      </defs>
      <line x1="14" y1="128" x2="186" y2="128" style={{ stroke: 'var(--line-strong)' }} strokeWidth="2.5" strokeLinecap="round" />
      {d.prop === 'wall' && <rect x="58" y="-6" width="8" height="134" rx="2" style={{ fill: 'var(--line-strong)' }} />}
      {d.prop === 'bar' && (
        <g style={{ stroke: 'var(--line-strong)' }} strokeLinecap="round">
          <line x1="56" y1="6" x2="144" y2="6" strokeWidth="5" />
          <line x1="58" y1="6" x2="58" y2="128" strokeWidth="3" />
          <line x1="142" y1="6" x2="142" y2="128" strokeWidth="3" />
        </g>
      )}
      {d.prop === 'chair' && (
        <g style={{ stroke: 'var(--line-strong)' }} strokeLinecap="round" strokeWidth="4" fill="none">
          <path d="M54 50 L54 128" />
          <path d="M52 92 L94 92" strokeWidth="6" />
          <path d="M92 92 L92 128" />
        </g>
      )}
      <g fill="none" stroke={`url(#${gid})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="7">
        <g opacity={d.front ? 1 : 0.42}>
          <path ref={legL} />
          <path ref={armL} />
        </g>
        <path ref={torso} strokeWidth="9" />
        <path ref={legR} />
        <path ref={armR} />
      </g>
      <circle ref={head} r="9" fill={`url(#${gid})`} />
    </svg>
  )
}
