import { useEffect, useId, useMemo, useRef } from 'react'
import type { DemoKey } from '../types'
import { DEMOS, GROUND } from './figure/demos'
import { drawFrame, groundClamp, shadowOf } from './figure/draw'
import { Rig } from './figure/rig'

interface Props {
  demo: DemoKey
  size?: number | string
  playing?: boolean
  speed?: number
  className?: string
  /** render a single static frame at this loop fraction (0–1) */
  phase?: number
}

type Part = [name: string, cls: string]
const arm = (s: 'N' | 'F', far: boolean): Part[] =>
  [['upper', 'sk'], ['sleeve', 'sh'], ['fore', 'sk'], ['hand', 'sk']].map(([n, c]) => [`a${s}${n}`, far ? `${c} far` : c])
const leg = (s: 'N' | 'F', far: boolean): Part[] =>
  [['shin', 'sk'], ['shoe', 'fo'], ['sole', 'fs'], ['thigh', 'sk']].map(([n, c]) => [`l${s}${n}`, far ? `${c} far` : c])
const farArmSide: Part[] = [['aFfore', 'sk far'], ['aFhand', 'sk far'], ['aFupper', 'sk far'], ['aFsleeve', 'sh far']]

const SIDE: Part[] = [
  ...farArmSide,
  ...leg('F', true),
  ['lFshorts', 'so far'],
  ...leg('N', false),
  ['shorts', 'so'],
  ['lNshorts', 'so'],
  ['neck', 'nk'],
  ['shirt', 'sh'],
  ['shade', 'sd'],
  ['head', 'sk'],
  ['ear', 'nk'],
  ['hair', 'hr'],
  ['eye', 'ey'],
  ['brow', 'hr'],
  ...arm('N', false),
]
const SIDE_HEAD_FRONT: Part[] = [
  ...SIDE.slice(0, SIDE.findIndex(([n]) => n === 'head')),
  ...arm('N', false),
  ['head', 'sk'],
  ['ear', 'nk'],
  ['hair', 'hr'],
  ['eye', 'ey'],
  ['brow', 'hr'],
]
const FRONT: Part[] = [
  ...leg('F', false),
  ...leg('N', false),
  ['shorts', 'so'],
  ['lFshorts', 'so'],
  ['lNshorts', 'so'],
  ['neck', 'nk'],
  ['shirt', 'sh'],
  ['shade', 'sd'],
  ['ear', 'nk'],
  ['head', 'sk'],
  ['hair', 'hr'],
  ['eye', 'ey'],
  ['brow', 'hr'],
  ...arm('F', false),
  ...arm('N', false),
]

export default function ExerciseFigure({ demo, size = '100%', playing = true, speed = 1, className, phase }: Props) {
  const d = DEMOS[demo]
  const rig = useMemo(() => new Rig(d.keys, d.front), [d])
  const parts = d.front ? FRONT : d.headFront ? SIDE_HEAD_FRONT : SIDE
  const durs = useMemo(() => d.keys.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur)), [d])
  const svgRef = useRef<SVGSVGElement>(null)
  const figRef = useRef<SVGGElement>(null)
  const shadowRef = useRef<SVGEllipseElement>(null)
  /** loop position 0–1, kept across pause / speed changes */
  const posRef = useRef<number | null>(null)
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    const els = figRef.current ? (Array.from(figRef.current.children) as SVGPathElement[]) : []
    const total = durs.reduce((a, b) => a + b, 0)
    const last: string[] = []
    const draw = (pos: number) => {
      let t = (((pos % 1) + 1) % 1) * total
      let i = 0
      while (i < durs.length - 1 && t >= durs[i]) {
        t -= durs[i]
        i++
      }
      const fr = groundClamp(rig.pose(i, Math.min(1, t / durs[i])), GROUND)
      const out = drawFrame(fr)
      for (let j = 0; j < els.length; j++) {
        const v = out[parts[j][0]]
        if (v !== undefined && v !== last[j]) {
          els[j].setAttribute('d', v)
          last[j] = v
        }
      }
      const [cx, rx, op] = shadowOf(fr, GROUND)
      const sh = shadowRef.current
      if (sh) {
        sh.setAttribute('cx', cx.toFixed(1))
        sh.setAttribute('rx', Math.max(8, rx).toFixed(1))
        sh.setAttribute('opacity', op.toFixed(2))
      }
    }
    const stillPos = () => {
      const s = d.still ?? (d.keys.length > 1 ? 1 : 0)
      return durs.slice(0, s).reduce((a, b) => a + b, 0) / total
    }
    if (phase !== undefined) {
      draw(phase)
      return
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (posRef.current === null) {
      posRef.current = stillPos()
      draw(posRef.current)
    }
    if (!playing || reduce || d.keys.length < 2) {
      if (reduce) draw(stillPos())
      return
    }

    let raf = 0
    let visible = true
    let prev = performance.now()
    let acc = 0
    // small thumbnails redraw at ~30 fps to save battery; the big demo stays at full frame rate
    const minStep = (svgRef.current?.getBoundingClientRect().width ?? 999) < 180 ? 30 : 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(100, now - prev)
      prev = now
      if (!visible) return
      posRef.current = (posRef.current! + (dt * speed) / total) % 1
      acc += dt
      if (acc < minStep) return
      acc = 0
      draw(posRef.current)
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
  }, [rig, durs, playing, speed, phase, parts, d])

  const [vx, vy, vw] = d.view ?? [0, -14, 200]
  const vh = (vw * 154) / 200
  const sg = `fs-${uid}`
  const sgf = `fsf-${uid}`
  const shg = `sh-${uid}`
  return (
    <svg ref={svgRef} className={`fig ${className ?? ''}`} viewBox={`${vx} ${vy} ${vw} ${vh.toFixed(1)}`} width={size} height={size} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={sg} gradientUnits="userSpaceOnUse" x1="60" y1="20" x2="140" y2="130">
          <stop offset="0" style={{ stopColor: 'var(--fig-shirt)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fig-shirt2)' }} />
        </linearGradient>
        <linearGradient id={sgf} gradientUnits="userSpaceOnUse" x1="60" y1="20" x2="140" y2="130">
          <stop offset="0" style={{ stopColor: 'var(--fig-shirt-far)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fig-shirt2-far)' }} />
        </linearGradient>
        <radialGradient id={shg}>
          <stop offset="0" style={{ stopColor: 'var(--fig-shadow)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fig-shadow)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <line className="fig-ground" x1={vx + vw * 0.06} y1={GROUND} x2={vx + vw * 0.94} y2={GROUND} />
      <ellipse ref={shadowRef} cx="100" cy={GROUND + 0.5} rx="30" ry="4.2" fill={`url(#${shg})`} />
      {d.prop === 'wall' && (
        <g className="fig-prop">
          <rect x="52" y="28" width="12" height={GROUND - 28} rx="2" />
          <rect className="fig-prop-edge" x="61.6" y="28" width="2.4" height={GROUND - 28} />
        </g>
      )}
      {d.prop === 'bar' && (
        <g className="fig-prop">
          <rect x="54" y="-0.5" width="92" height="5" rx="2.5" />
          <rect x="54" y="-0.5" width="4.5" height={GROUND + 0.5} rx="2" />
          <rect x="141.5" y="-0.5" width="4.5" height={GROUND + 0.5} rx="2" />
        </g>
      )}
      {d.prop === 'chair' && (
        <g className="fig-prop">
          <rect x="34" y="52" width="5" height="46" rx="2.5" />
          <rect x="31" y="95.6" width="46" height="5" rx="2.2" />
          <rect x="35" y="99" width="4" height={GROUND - 99} rx="1.5" />
          <rect x="70" y="99" width="4" height={GROUND - 99} rx="1.5" />
        </g>
      )}
      <g ref={figRef}>
        {parts.map(([name, cls]) => (
          <path key={name} className={cls} fill={cls === 'sh' ? `url(#${sg})` : cls === 'sh far' ? `url(#${sgf})` : undefined} />
        ))}
      </g>
    </svg>
  )
}
