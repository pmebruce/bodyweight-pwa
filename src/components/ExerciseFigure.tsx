import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { DemoKey } from '../types'
import { TARGETS, type MuscleId, type Targets } from './figure/anatomy'
import { DEMOS, GROUND } from './figure/demos'
import { drawFrame, figureLayers, groundClamp, handCentre, shadowOf } from './figure/draw'
import { Rig } from './figure/rig'

interface Props {
  demo: DemoKey
  size?: number | string
  playing?: boolean
  speed?: number
  className?: string
  /** render a single static frame at this loop fraction (0–1) */
  phase?: number
  /** highlight the target muscles (default true) */
  highlight?: boolean
}

type Tone = '' | 'p1' | 'p2'
const toneOf = (ids: MuscleId[], p: MuscleId[], s: MuscleId[]): Tone =>
  ids.some((i) => p.includes(i)) ? 'p1' : ids.some((i) => s.includes(i)) ? 'p2' : ''
const NO_TARGETS: Targets = { p: [], s: [] }

interface Item {
  slot: number
  cls: string
  fill?: string
}
/**
 * Static element tree for one figure. Every <path> owns a "slot": the list of part keys whose
 * per-frame path data is concatenated into its `d` (all shapes share one winding, so merged
 * subpaths fill as a union).
 */
function buildSpec(front: boolean, headFront: boolean, tg: Targets, lite: boolean, yaw = 0) {
  const slots: string[][] = []
  const slot = (keys: string[]) => slots.push(keys) - 1
  const fib = new Set<string>()
  const clipSlots = new Map<string, number>()
  const gradOf = (tone: Tone, far: boolean) => (tone === 'p1' ? 'r' : tone === 'p2' ? 'o' : 'm') + (far ? 'f' : '')
  const layers = figureLayers(front, headFront, yaw).map((L) => {
    const base = slot(L.base)
    const groups: { clip?: string; items: Item[] }[] = []
    let cur: { clip?: string; overs: typeof L.over } | null = null
    const runs: { clip?: string; overs: typeof L.over }[] = []
    for (const o of L.over) {
      if (cur && cur.clip === o.clip) cur.overs.push(o)
      else runs.push((cur = { clip: o.clip, overs: [o] }))
    }
    const far = L.far ? ' far' : ''
    for (const r of runs) {
      if (r.clip && !clipSlots.has(r.clip)) clipSlots.set(r.clip, slot([r.clip]))
      const items: Item[] = []
      if (lite) {
        // merged: plain muscles, secondary, primary, then lines / features
        const by = (pred: (o: (typeof r.overs)[number]) => boolean) => r.overs.filter(pred).map((o) => o.k)
        for (const tone of ['', 'p2', 'p1'] as Tone[]) {
          const ks = by((o) => o.kind === 'm' && toneOf(o.ids, tg.p, tg.s) === tone)
          if (ks.length) items.push({ slot: slot(ks), cls: `m${tone ? ' ' + tone : ''}${far}`, fill: gradOf(tone, L.far) })
        }
        for (const kind of ['ft', 'ey', 'ln'] as const) {
          const ks = by((o) => o.kind === kind)
          if (ks.length) items.push({ slot: slot(ks), cls: kind + far, fill: kind === 'ft' ? gradOf('', L.far) : undefined })
        }
      } else {
        for (const o of r.overs) {
          const tone = o.kind === 'm' ? toneOf(o.ids, tg.p, tg.s) : ''
          items.push({ slot: slot([o.k]), cls: `${o.kind}${tone ? ' ' + tone : ''}${far}`, fill: o.kind === 'm' || o.kind === 'ft' ? gradOf(tone, L.far) : undefined })
          if (tone) {
            fib.add(o.k)
            items.push({ slot: slot([o.k + '~']), cls: `fb ${tone}` })
          }
        }
      }
      groups.push({ clip: r.clip, items })
    }
    return { id: L.id, far: L.far, base, groups }
  })
  return { slots, layers, fib, clips: [...clipSlots] }
}

export default function ExerciseFigure({ demo, size = '100%', playing = true, speed = 1, className, phase, highlight = true }: Props) {
  const d = DEMOS[demo]
  const durs = useMemo(() => d.keys.map((_, i) => (Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur)), [d])
  const rig = useMemo(() => new Rig(d.keys, d.front, { durs, smooth: d.smooth, lag: d.lag, headLag: d.headLag, yaw: d.yaw }), [d, durs])
  const tg = TARGETS[demo]
  // thumbnails (< 180 px wide) use a lighter element tree: merged muscles per segment, no fibres
  const [lite, setLite] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const w = svgRef.current?.getBoundingClientRect().width ?? 999
    setLite(w > 0 && w < 180)
  }, [])
  const spec = useMemo(() => buildSpec(!!d.front, !!d.headFront, highlight ? tg : NO_TARGETS, lite, d.yaw ?? 0), [d, tg, highlight, lite])
  const shadowRef = useRef<SVGEllipseElement>(null)
  // faint loop traced by each hand (e.g. arm circles): sampled from the very frames that are drawn,
  // at the centre of the drawn hand, so the hand always rides on its trail
  const trail = useMemo(() => {
    if (!d.trail) return null
    const [a, b] = d.trail
    const N = 72
    const paths: string[] = []
    for (const name of ['armF', 'armN'] as const) {
      const pts: string[] = []
      for (let i = 0; i < N; i++) {
        const l = groundClamp(rig.at(a + ((b - a) * i) / N), GROUND)[name]
        const c = handCentre(l)
        pts.push(`${c[0].toFixed(2)} ${c[1].toFixed(2)}`)
      }
      paths.push('M' + pts.join('L') + 'Z')
    }
    return paths
  }, [d, rig])
  /** loop position 0–1, kept across pause / speed changes */
  const posRef = useRef<number | null>(null)
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    const els = svgRef.current ? (Array.from(svgRef.current.querySelectorAll('path[data-s]')) as SVGPathElement[]) : []
    const keys = els.map((e) => spec.slots[+e.getAttribute('data-s')!])
    const total = durs.reduce((a, b) => a + b, 0)
    const last: string[] = []
    const draw = (pos: number) => {
      const fr = groundClamp(rig.at(pos), GROUND)
      const out = drawFrame(fr, spec.fib)
      for (let j = 0; j < els.length; j++) {
        const ks = keys[j]
        let v = out[ks[0]] ?? ''
        for (let q = 1; q < ks.length; q++) v += out[ks[q]] ?? ''
        if (!v) v = 'M0 0'
        if (v !== last[j]) {
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
    if (posRef.current === null) posRef.current = stillPos()
    draw(posRef.current)
    if (!playing || reduce || d.keys.length < 2) {
      if (reduce) draw(stillPos())
      return
    }

    let raf = 0
    let visible = true
    let prev = performance.now()
    let acc = 0
    // small thumbnails redraw at ~22 fps to save battery; the big demo stays at full frame rate
    const minStep = lite ? 45 : 0
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
  }, [rig, durs, playing, speed, phase, spec, d, lite])

  const [vx, vy, vw] = d.view ?? [0, -14, 200]
  const vh = (vw * 154) / 200
  const id = (s: string) => `${s}-${uid}`
  const url = (s: string) => `url(#${s}-${uid})`
  // radial "bulge" shading per muscle (objectBoundingBox → each belly gets its own highlight)
  const bulge = (name: string, c: [string, string, string]) => (
    <radialGradient id={id(name)} cx="0.42" cy="0.36" r="0.72" fx="0.4" fy="0.3">
      <stop offset="0" stopColor={c[0]} />
      <stop offset="0.6" stopColor={c[1]} />
      <stop offset="1" stopColor={c[2]} />
    </radialGradient>
  )
  return (
    <svg ref={svgRef} className={`fig ${className ?? ''}`} viewBox={`${vx} ${vy} ${vw} ${vh.toFixed(1)}`} width={size} height={size} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={id('sk')} gradientUnits="userSpaceOnUse" x1="50" y1="10" x2="150" y2="135">
          <stop offset="0" stopColor="#e1e1e1" />
          <stop offset="1" stopColor="#c3c3c3" />
        </linearGradient>
        <linearGradient id={id('skf')} gradientUnits="userSpaceOnUse" x1="50" y1="10" x2="150" y2="135">
          <stop offset="0" stopColor="#bdbdbd" />
          <stop offset="1" stopColor="#a4a4a4" />
        </linearGradient>
        {bulge('m', ['#f3f3f3', '#dcdcdc', '#bcbcbc'])}
        {bulge('mf', ['#cecece', '#b9b9b9', '#9f9f9f'])}
        {bulge('r', ['#ff8a6a', '#ec4e30', '#c2341b'])}
        {bulge('rf', ['#e8684b', '#cf3e24', '#a52a15'])}
        {bulge('o', ['#ffd0bd', '#fba487', '#ec8160'])}
        {bulge('of', ['#efb29b', '#e48d70', '#cf6f50'])}
        {spec.clips.map(([c, slot]) => (
          <clipPath key={c} id={id('c-' + c)}>
            <path data-s={slot} />
          </clipPath>
        ))}
        <radialGradient id={id('sh')}>
          <stop offset="0" style={{ stopColor: 'var(--fig-shadow)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fig-shadow)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <line className="fig-ground" x1={vx + vw * 0.06} y1={GROUND} x2={vx + vw * 0.94} y2={GROUND} />
      <ellipse ref={shadowRef} cx="100" cy={GROUND + 0.5} rx="30" ry="4.2" fill={url('sh')} />
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
      {trail && (
        <g className="fig-trail" aria-hidden="true">
          <path d={trail[1]} className="far" />
          <path d={trail[0]} />
        </g>
      )}
      <g className="fig-body">
        {spec.layers.map((L) => (
          <Fragment key={L.id}>
            {/* outline pass, then fill pass: the layer's segments merged into one silhouette with a single outline */}
            <path data-s={L.base} className={`ol${L.far ? ' far' : ''}`} />
            <path data-s={L.base} className="fl" fill={url(L.far ? 'skf' : 'sk')} />
            {L.groups.map((g, gi) => (
              <g key={gi} clipPath={g.clip ? url('c-' + g.clip) : undefined}>
                {g.items.map((o) => (
                  <path key={o.slot} data-s={o.slot} className={o.cls} fill={o.fill ? url(o.fill) : undefined} />
                ))}
              </g>
            ))}
          </Fragment>
        ))}
      </g>
    </svg>
  )
}
