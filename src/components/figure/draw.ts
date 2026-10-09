/**
 * Anatomical "muscle man" renderer for the demo figure.
 *
 * Every body segment is a smooth base capsule (merged per depth layer into one silhouette with a single
 * outline) plus a set of muscle bellies ("spindles") defined in the bone's local frame, so the muscles
 * ride on the rig bones. Local frames: T along the bone (fraction of its length), w across it.
 *   side view:  limbs w > 0 = posterior, torso w > 0 = front (chest side)
 *   front view: limbs w > 0 = lateral,   torso w > 0 = screen right (mirrored for the left side)
 */
import type { MuscleId } from './anatomy'
import { GLUTE_MAX, GLUTE_MED, GLUTE_MIN, HIP_FRONT, HIP_SIDE, hipSkin, skin, skinThigh, type HipSkin, type Patch } from './hip'
import { add, dir, L, len, sub, type Frame, type LimbOut, type V } from './rig'

/** fast 1-decimal number formatting (float → string is the hot spot of the per-frame path building) */
function f1(n: number): string {
  const v = Math.round(n * 10)
  const a = v < 0 ? -v : v
  const i = (a / 10) | 0
  const d = a - i * 10
  return (v < 0 ? '-' : '') + i + (d ? '.' + d : '')
}
const pt = (p: V) => `${f1(p[0])} ${f1(p[1])}`

/** smooth open curve through points (Catmull-Rom → cubic Bézier), without the initial M */
function curve(ps: V[]): string {
  let d = ''
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[i - 1] ?? ps[i]
    const p1 = ps[i]
    const p2 = ps[i + 1]
    const p3 = ps[i + 2] ?? p2
    const c1: V = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: V = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return d
}
const open = (ps: V[]) => `M${pt(ps[0])}${curve(ps)}`
/** shoelace sum; < 0 is the winding used by every base / muscle shape (same as limb()) */
function wind(ps: V[]): number {
  let a = 0
  for (let i = 0, n = ps.length; i < n; i++) {
    const p = ps[i]
    const q = ps[(i + 1) % n]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a
}
/** smooth closed curve through points, normalised to one winding so shapes can be merged into one path (nonzero fill) */
function closed(ps: V[]): string {
  if (wind(ps) > 0) ps = [...ps].reverse()
  const n = ps.length
  let d = `M${pt(ps[0])}`
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n]
    const p1 = ps[i]
    const p2 = ps[(i + 1) % n]
    const p3 = ps[(i + 2) % n]
    const c1: V = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: V = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`
  }
  return d + 'Z'
}

/** tapered capsule from A to B with optional bulges on each side */
function limb(A: V, B: V, rA: number, rB: number, bN = 0, bP = 0, tm = 0.4): string {
  const d = sub(B, A)
  const l = len(d) || 0.001
  const u: V = [d[0] / l, d[1] / l]
  const n: V = [-u[1], u[0]]
  const rm = rA + (rB - rA) * tm
  const sN0 = add(A, n, rA)
  const sN1 = add(B, n, rB)
  const sP0 = add(A, n, -rA)
  const sP1 = add(B, n, -rB)
  const mN = add(add(A, u, l * tm), n, rm + bN)
  const mP = add(add(A, u, l * tm), n, -(rm + bP))
  const cN: V = [2 * mN[0] - (sN0[0] + sN1[0]) / 2, 2 * mN[1] - (sN0[1] + sN1[1]) / 2]
  const cP: V = [2 * mP[0] - (sP0[0] + sP1[0]) / 2, 2 * mP[1] - (sP0[1] + sP1[1]) / 2]
  return (
    `M${pt(sN0)}Q${pt(cN)} ${pt(sN1)}A${f1(rB)} ${f1(rB)} 0 0 0 ${pt(sP1)}` +
    `Q${pt(cP)} ${pt(sP0)}A${f1(rA)} ${f1(rA)} 0 0 0 ${pt(sN0)}Z`
  )
}

/* ---------- local bone frames ---------- */
interface Seg {
  o: V
  u: V
  n: V
  l: number
}
function segOf(A: V, B: V, sg: number): Seg {
  const d = sub(B, A)
  const l = len(d) || 0.001
  const u: V = [d[0] / l, d[1] / l]
  return { o: A, u, n: [-u[1] * sg, u[0] * sg], l }
}
const at = (g: Seg, T: number, w: number): V => [g.o[0] + g.u[0] * T + g.n[0] * w, g.o[1] + g.u[1] * T + g.n[1] * w]

/* ---------- muscle bellies ---------- */
interface MDef {
  /** part name */
  n: string
  ids: MuscleId[]
  /** origin / insertion in the bone frame: [fraction along bone, offset across] */
  a: V
  b: V
  /** half widths at origin, belly, insertion */
  w: [number, number, number]
  /** sideways bow of the belly (toward +normal of a→b) */
  sk?: number
}
const mirror = (m: MDef, n: string): MDef => ({ ...m, n, a: [m.a[0], -m.a[1]], b: [m.b[0], -m.b[1]], sk: -(m.sk ?? 0) })

const FIB_K = [-0.6, -0.2, 0.2, 0.6]
function spindle(g: Seg, m: MDef, scaleT: number, fib: boolean, map?: (p: V) => V): [string, string] {
  const A: V = [m.a[0] * g.l * scaleT, m.a[1]]
  const B: V = [m.b[0] * g.l * scaleT, m.b[1]]
  const d = sub(B, A)
  const ll = len(d) || 0.001
  const ux: V = [d[0] / ll, d[1] / ll]
  const nx: V = [-ux[1], ux[0]]
  const [w0, wm, w1] = m.w
  const c = 2 * wm - (w0 + w1) / 2
  const sk = m.sk ?? 0
  const hw = (f: number) => (1 - f) * (1 - f) * w0 + 2 * f * (1 - f) * c + f * f * w1
  const ctr = (f: number): V => add(add(A, d, f), nx, sk * Math.sin(Math.PI * f))
  const W = map ? (q: V) => map(at(g, q[0], q[1])) : (q: V) => at(g, q[0], q[1])
  const N = map ? 6 : 4
  const left: V[] = []
  const right: V[] = []
  for (let i = 0; i <= N; i++) {
    const f = i / N
    const cc = ctr(f)
    const h = hw(f)
    left.push(W(add(cc, nx, h)))
    right.push(W(add(cc, nx, -h)))
  }
  const cap0 = W(add(ctr(0), ux, -Math.min(w0, 2) * 0.55))
  const cap1 = W(add(ctr(1), ux, Math.min(w1, 2) * 0.55))
  const outline = closed([cap0, ...left, cap1, ...right.reverse()])
  if (!fib) return [outline, '']
  let fd = ''
  for (const k of FIB_K) {
    const ps: V[] = []
    for (const f of [0.08, 0.3, 0.5, 0.7, 0.92]) ps.push(W(add(ctr(f), nx, k * hw(f) * 0.86)))
    fd += open(ps)
  }
  return [outline, fd]
}

/* ---------- skinned muscle patches (hip) ---------- */
/** point at fraction t along a polyline */
function along(ps: V[], t: number): V {
  const f = Math.max(0, Math.min(1, t)) * (ps.length - 1)
  const i = Math.min(ps.length - 2, Math.floor(f))
  const k = f - i
  return [ps[i][0] + (ps[i + 1][0] - ps[i][0]) * k, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * k]
}
const lerpV = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const PATCH_T = [0, 0.2, 0.4, 0.6, 0.8, 1]
const PATCH_FIB = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]
function patch(sk: HipSkin, m: Patch, fib: boolean): [string, string] {
  // every sample carries its own blend weight: origin edge (pelvis) → insertion edge (femur)
  type P3 = [number, number, number]
  const lw = (w: [number, number], t: number) => w[0] + (w[1] - w[0]) * t
  const oAt = (t: number): P3 => [...along(m.o, t), lw(m.wo, t)]
  const iAt = (t: number): P3 => [...along(m.i, t), lw(m.wi, t)]
  const mix = (a: P3, b: P3, k: number): P3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
  const S = (q: P3) => skin(sk, [q[0], q[1]], q[2])
  /** point at fraction k along the fibre a → b: rotation skinning far from the joint, the straight
   * attachment line close to it (pure angle blending would swirl the tissue around the pivot) */
  const F = (a: P3, b: P3, k: number): V => {
    const q = mix(a, b, k)
    const r = S(q)
    const rr = Math.hypot(q[0], q[1])
    const lin = m.lin ?? 1 - Math.min(1, Math.max(0, (rr - 3.5) / 4.5))
    if (!lin) return r
    const A = S(a)
    const B = S(b)
    const l: V = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]
    return [r[0] + (l[0] - r[0]) * lin, r[1] + (l[1] - r[1]) * lin]
  }
  const O = PATCH_T.map(oAt)
  const I = PATCH_T.map(iAt)
  const n = O.length - 1
  const ring: V[] = [
    ...O.map(S), F(O[n], I[n], 0.33), F(O[n], I[n], 0.66), ...[...I].reverse().map(S),
    ...[0.25, 0.5, 0.75].map((k) => (m.top ? lerpV(S(I[0]), S(O[0]), k) : F(I[0], O[0], k))),
  ]
  const outline = closed(ring)
  if (!fib || m.nofib) return [outline, '']
  let fd = ''
  for (const t of PATCH_FIB) {
    const a = oAt(t)
    const b = iAt(t)
    fd += open([0.06, 0.24, 0.42, 0.6, 0.78, 0.94].map((k) => F(a, b, k)))
  }
  return [outline, fd]
}

/* ---------- muscle tables ---------- */
// Muscles are deliberately a bit oversized: they get clipped to their segment's silhouette, so the
// visible result is the segment surface divided into muscle regions separated by grooves.
// side view limbs: w > 0 = posterior
const S_UPPER: MDef[] = [
  { n: 'tri', ids: ['triceps'], a: [0.12, 2.5], b: [1.0, 1.5], w: [2.3, 2.6, 1.3], sk: 0.3 },
  { n: 'bi', ids: ['biceps'], a: [0.3, -1.7], b: [1.0, -1.2], w: [1.3, 2.1, 1.0], sk: -0.35 },
  { n: 'dR', ids: ['rearDelt', 'delts'], a: [-0.22, 1.7], b: [0.5, 0.25], w: [2.6, 2.4, 0.45], sk: 0.25 },
  { n: 'dF', ids: ['frontDelt', 'delts'], a: [-0.22, -1.3], b: [0.53, -0.3], w: [2.8, 2.5, 0.45], sk: -0.3 },
]
const S_FORE: MDef[] = [
  { n: 'ex', ids: ['forearm'], a: [-0.08, 1.4], b: [0.95, 0.7], w: [1.6, 1.5, 0.8], sk: 0.2 },
  { n: 'fx', ids: ['forearm'], a: [-0.12, -1.3], b: [0.92, -0.6], w: [1.9, 1.8, 0.8], sk: -0.3 },
]
const S_THIGH: MDef[] = [
  { n: 'ham', ids: ['hamstrings'], a: [0.02, 3.4], b: [1.03, 2.0], w: [2.2, 3.1, 1.5], sk: 0.3 },
  { n: 'vl', ids: ['quads'], a: [-0.1, 0.2], b: [0.98, -1.0], w: [2.6, 3.4, 2.0], sk: 0.15 },
  { n: 'rf', ids: ['quads', 'hipFlexors'], a: [-0.08, -3.5], b: [0.96, -3.1], w: [0.9, 2.6, 1.3], sk: -0.4 },
  { n: 'pat', ids: [], a: [0.98, -3.6], b: [1.09, -3.3], w: [0.8, 1.0, 0.7] },
]
const S_SHIN: MDef[] = [
  { n: 'sol', ids: ['calves'], a: [0.25, 1.7], b: [0.92, 0.8], w: [1.5, 1.6, 0.7], sk: 0.2 },
  { n: 'ta', ids: [], a: [0.0, -2.3], b: [0.82, -1.1], w: [1.7, 1.6, 0.6] },
  { n: 'gas', ids: ['calves'], a: [-0.05, 2.5], b: [0.62, 1.2], w: [2.2, 2.8, 0.6], sk: 0.7 },
]
// front view limbs: w > 0 = lateral
const F_UPPER: MDef[] = [
  { n: 'tri', ids: ['triceps'], a: [0.2, 2.7], b: [0.98, 1.9], w: [1.5, 1.6, 0.9] },
  { n: 'bi', ids: ['biceps'], a: [0.28, -0.6], b: [1.0, -0.4], w: [1.8, 2.5, 1.2], sk: -0.2 },
  { n: 'dl', ids: ['delts', 'frontDelt', 'rearDelt'], a: [-0.3, 0.4], b: [0.44, 1.0], w: [3.8, 3.3, 0.6], sk: 0.4 },
]
const F_FORE: MDef[] = [
  { n: 'fx', ids: ['forearm'], a: [-0.02, -1.0], b: [0.92, -0.6], w: [1.6, 1.6, 0.8] },
  { n: 'br', ids: ['forearm'], a: [-0.1, 1.45], b: [0.85, 0.8], w: [1.5, 1.4, 0.7], sk: 0.2 },
]
const F_THIGH: MDef[] = [
  { n: 'add', ids: ['adductors'], a: [-0.05, -3.7], b: [0.62, -3.0], w: [2.4, 2.4, 0.6], sk: -0.2 },
  { n: 'vl', ids: ['quads'], a: [-0.2, 3.7], b: [0.97, 2.0], w: [0.9, 3.2, 1.3], sk: 0.7 },
  // gluteus medius / TFL: the hip abductor seen from the front, at the outer hip
  { n: 'gmd', ids: ['glutes'], a: [-0.24, 4.3], b: [0.22, 4.6], w: [1.5, 2.0, 0.6], sk: 0.4 },
  { n: 'rf', ids: ['quads', 'hipFlexors'], a: [-0.12, 1.0], b: [0.9, 0.0], w: [0.8, 2.6, 1.2] },
  { n: 'vm', ids: ['quads'], a: [0.5, -2.7], b: [0.99, -1.1], w: [1.0, 2.1, 1.2], sk: -0.4 },
  { n: 'pat', ids: [], a: [0.96, 0.0], b: [1.09, 0.0], w: [1.2, 1.4, 1.1] },
]
const F_SHIN: MDef[] = [
  { n: 'ta', ids: [], a: [0.03, 0.9], b: [0.86, 0.3], w: [1.5, 1.4, 0.5] },
  { n: 'gl', ids: ['calves'], a: [-0.02, 3.3], b: [0.5, 2.6], w: [1.2, 1.3, 0.3], sk: 0.4 },
  { n: 'gm', ids: ['calves'], a: [-0.04, -2.4], b: [0.64, -1.9], w: [1.8, 2.3, 0.4], sk: -0.6 },
]
// side view torso: s along hip→shoulder (fraction), w > 0 = chest side
const absSide = (i: number, s0: number, s1: number, w0: number, w1: number, wd: [number, number, number]): MDef => ({ n: `ab${i}`, ids: ['abs'], a: [s0, w0], b: [s1, w1], w: wd })
const S_TORSO: MDef[] = [
  { n: 'trap', ids: ['traps'], a: [1.13, -1.0], b: [0.8, -5.4], w: [1.6, 2.0, 0.8], sk: -0.3 },
  { n: 'lowBk', ids: ['lowerBack'], a: [0.58, -4.7], b: [0.04, -4.9], w: [1.4, 1.8, 1.4], sk: -0.3 },
  { n: 'lat', ids: ['lats'], a: [0.9, -3.4], b: [0.34, -2.2], w: [2.8, 3.1, 0.8], sk: -0.6 },
  { n: 'obl', ids: ['obliques'], a: [0.62, -0.4], b: [0.06, 2.2], w: [2.6, 3.0, 1.7], sk: 0.2 },
  absSide(1, 0.6, 0.5, 5.1, 4.5, [2.1, 2.2, 2.0]),
  absSide(2, 0.48, 0.385, 4.3, 4.1, [2.0, 2.1, 2.0]),
  absSide(3, 0.37, 0.275, 4.1, 4.1, [2.0, 2.1, 2.0]),
  absSide(4, 0.26, 0.06, 4.1, 4.3, [2.0, 2.2, 1.7]),
  { n: 'pec', ids: ['chest'], a: [1.0, 3.4], b: [0.61, 5.0], w: [2.0, 3.3, 2.0], sk: 0.8 },
]
// front view torso, right half (left half mirrored)
const absFront = (i: number, s0: number, s1: number, wd: [number, number, number]): MDef => ({ n: `ab${i}`, ids: ['abs'], a: [s0, 1.85], b: [s1, 1.85], w: wd })
const F_TORSO_R: MDef[] = [
  { n: 'trap', ids: ['traps'], a: [1.15, 2.0], b: [1.0, 8.2], w: [1.2, 1.6, 0.7], sk: 0.4 },
  { n: 'obl', ids: ['obliques'], a: [0.6, 6.4], b: [0.0, 4.6], w: [1.7, 2.3, 1.3], sk: 0.5 },
  { n: 'lat', ids: ['lats'], a: [0.95, 10.3], b: [0.42, 7.0], w: [2.3, 2.4, 0.5], sk: 0.5 },
  absFront(1, 0.73, 0.635, [1.5, 1.7, 1.5]),
  absFront(2, 0.62, 0.525, [1.5, 1.7, 1.5]),
  absFront(3, 0.51, 0.415, [1.5, 1.7, 1.45]),
  absFront(4, 0.4, -0.08, [1.45, 1.6, 0.7]),
  { n: 'pec', ids: ['chest'], a: [0.84, 0.35], b: [0.9, 9.2], w: [3.4, 3.8, 1.8], sk: 0.9 },
]
const F_TORSO: MDef[] = F_TORSO_R.flatMap((m) => [mirror(m, m.n + 'L'), { ...m, n: m.n + 'R' }])

/* ---------- torso silhouette profiles: [s along hip→shoulder (0..1), w offset] ---------- */
const SIDE_FRONT: V[] = [
  [1.1, 2.6], [1.02, 4.6], [0.9, 6.8], [0.76, 7.6], [0.62, 6.7], [0.44, 5.4], [0.26, 5.3], [0.1, 5.6], [-0.06, 5.5], [-0.22, 4.0],
]
const SIDE_BACK: V[] = [
  [-0.24, -3.8], [-0.1, -5.6], [0.06, -5.7], [0.22, -5.2], [0.4, -4.8], [0.58, -5.4], [0.76, -6.3], [0.92, -5.9], [1.03, -4.2], [1.1, -2.4],
]
const FRONT_HALF: V[] = [
  [1.1, 3.0], [1.06, 6.4], [1.01, 9.4], [0.92, 10.6], [0.78, 10.1], [0.62, 8.5], [0.46, 7.0], [0.3, 7.1], [0.12, 8.1], [-0.06, 8.6], [-0.22, 8.0],
]

function sampleSide(arr: V[], s0: number, s1: number): V[] {
  const atS = (s: number): V => {
    for (let i = 0; i < arr.length - 1; i++) {
      const [sa, wa] = arr[i]
      const [sb, wb] = arr[i + 1]
      if ((s - sa) * (s - sb) <= 0) {
        const k = sb === sa ? 0 : (s - sa) / (sb - sa)
        return [s, wa + (wb - wa) * k]
      }
    }
    return Math.abs(s - arr[0][0]) < Math.abs(s - arr[arr.length - 1][0]) ? [s, arr[0][1]] : [s, arr[arr.length - 1][1]]
  }
  const desc = arr[0][0] > arr[arr.length - 1][0]
  const [first, last] = desc ? [s1, s0] : [s0, s1]
  const inner = arr.filter(([s]) => s > s0 + 0.02 && s < s1 - 0.02)
  return [atS(first), ...inner, atS(last)]
}

/** two open sides → closed outline with the common winding */
function joinSides(a: V[], b: V[]): string {
  if (wind([...a, ...b]) > 0) {
    const ra = [...b].reverse()
    const rb = [...a].reverse()
    a = ra
    b = rb
  }
  return `M${pt(a[0])}${curve(a)}L${pt(b[0])}${curve(b)}Z`
}

/* ---------- 3/4 view (front rig + camera yaw) ---------- */
/** linear profile lookup: arr = [s, w] pairs sorted by s (either direction) */
function prof(arr: V[], s: number): number {
  const asc = arr[0][0] < arr[arr.length - 1][0]
  const a = asc ? arr : [...arr].reverse()
  if (s <= a[0][0]) return a[0][1]
  for (let i = 0; i < a.length - 1; i++) {
    if (s <= a[i + 1][0]) {
      const k = (s - a[i][0]) / (a[i + 1][0] - a[i][0] || 1)
      return a[i][1] + (a[i + 1][1] - a[i][1]) * k
    }
  }
  return a[a.length - 1][1]
}
interface Quarter {
  cy: number
  sy: number
  /** screen vectors of the torso axis / lateral axis / depth (toward the camera) */
  A: V
  F: V
  Z: V
  /** screen normal of the axis pointing to screen right */
  n: V
}
function quarterOf(fr: Frame): Quarter | undefined {
  if (!fr.front || !fr.yaw) return undefined
  const r = (fr.yaw * Math.PI) / 180
  const cy = Math.cos(r)
  const sy = Math.sin(r)
  const A: V = [fr.axis[0] * cy, fr.axis[1]]
  const F: V = [fr.fwd[0] * cy, fr.fwd[1]]
  const la = Math.hypot(A[0], A[1]) || 1
  let n: V = [-A[1] / la, A[0] / la]
  if (n[0] < 0) n = [-n[0], -n[1]]
  return { cy, sy, A, F, Z: [sy, 0], n }
}
/** torso cross-section at s (fraction): half width, front depth, back depth */
const torsoSec = (s: number): [number, number, number] => [prof(FRONT_HALF, s), Math.max(0, prof(SIDE_FRONT, s)), Math.max(0, -prof(SIDE_BACK, s))]
/** torso local (s fraction, lateral w, depth z) → screen */
const qPt = (fr: Frame, q: Quarter, s: number, w: number, z: number): V => [
  fr.p[0] + q.A[0] * s * L.torso + q.F[0] * w + q.Z[0] * z,
  fr.p[1] + q.A[1] * s * L.torso + q.F[1] * w + q.Z[1] * z,
]
const Q_S = [-0.22, -0.12, -0.02, 0.08, 0.2, 0.32, 0.44, 0.54, 0.64, 0.74, 0.82, 0.9, 0.96, 1.01, 1.05, 1.08, 1.1]
const PSI = Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2)
/** 3/4 torso silhouette: every cross-section is two half ellipses (chest / back), projected */
function torsoQuarter(fr: Frame, q: Quarter, s0: number, s1: number, warp?: (p: V) => V): string {
  const right: V[] = []
  const left: V[] = []
  for (const s of Q_S) {
    if (s < s0 - 1e-6 || s > s1 + 1e-6) continue
    const [a, zf, zb] = torsoSec(s)
    let best = -Infinity, worst = Infinity
    let pr: V = [0, 0], pl: V = [0, 0]
    for (const ps of PSI) {
      const w = a * Math.cos(ps)
      const z = Math.sin(ps) * (Math.sin(ps) > 0 ? zf : zb)
      const o: V = [q.F[0] * w + q.Z[0] * z, q.F[1] * w + q.Z[1] * z]
      const d = o[0] * q.n[0] + o[1] * q.n[1]
      if (d > best) { best = d; pr = [w, z] }
      if (d < worst) { worst = d; pl = [w, z] }
    }
    right.push(qPt(fr, q, s, pr[0], pr[1]))
    left.push(qPt(fr, q, s, pl[0], pl[1]))
  }
  const W = warp ?? ((p: V) => p)
  return joinSides([...right].reverse().map(W), left.map(W))
}
/** 3/4: a front-view torso point (rigid frontal frame) → the same spot on the chest / belly surface, projected */
function quarterSurface(fr: Frame, q: Quarter): (p: V) => V {
  return (pt: V): V => {
    const vx = pt[0] - fr.p[0]
    const vy = pt[1] - fr.p[1]
    const sl = vx * fr.axis[0] + vy * fr.axis[1]
    const w = vx * fr.fwd[0] + vy * fr.fwd[1]
    const s = sl / L.torso
    const [a, zf] = torsoSec(s)
    const k = Math.min(1, Math.abs(w) / (a * 1.04 || 1))
    const z = zf * Math.sqrt(Math.max(0, 1 - k * k))
    return qPt(fr, q, s, w, z)
  }
}
/** convex hull (monotone chain) */
function hull(ps: V[]): V[] {
  const p = [...ps].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o: V, a: V, b: V) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: V[] = []
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop()
    lo.push(q)
  }
  const up: V[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop()
    up.push(q)
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)]
}

/**
 * front view: the pelvis can roll independently of the ribcage (hip drop / weight shift). Points of the
 * torso are rotated about the hip centre by the pelvis-vs-torso angle, fading out up the waist.
 */
function spineWarp(fr: Frame): ((p: V) => V) | undefined {
  if (!fr.front) return undefined
  const dd = (fr.pa - fr.T) * (Math.PI / 180)
  if (Math.abs(dd) < 1e-4) return undefined
  return (q: V): V => {
    const vx = q[0] - fr.p[0]
    const vy = q[1] - fr.p[1]
    const s = (vx * fr.axis[0] + vy * fr.axis[1]) / L.torso
    const t = Math.min(1, Math.max(0, (0.62 - s) / 0.52))
    const a = dd * t * t * (3 - 2 * t)
    const c = Math.cos(a)
    const sn = Math.sin(a)
    return [fr.p[0] + vx * c + vy * sn, fr.p[1] - vx * sn + vy * c]
  }
}

function torsoPiece(fr: Frame, s0: number, s1: number): string {
  const wp = spineWarp(fr)
  const q = quarterOf(fr)
  if (q) return torsoQuarter(fr, q, s0, s1, wp)
  const W0 = (q: V): V => add(add(fr.p, fr.axis, q[0] * L.torso), fr.fwd, q[1])
  const W = wp ? (q: V): V => wp(W0(q)) : W0
  if (fr.front) {
    const right = sampleSide([...FRONT_HALF], s0, s1).map(W)
    const left = sampleSide([...FRONT_HALF].reverse(), s0, s1).map(([s, w]) => W([s, -w]))
    return joinSides(right, left)
  }
  const fr1 = sampleSide(SIDE_FRONT, s0, s1).map(W)
  const bk = sampleSide(SIDE_BACK, s0, s1).map(W)
  return joinSides(fr1, bk)
}

/* ---------- head: round, friendly, Mii-inspired (original design) ---------- */
/** face style switches (hair cap on/off) */
export const FACE = { hair: true }
// head frame: x = forward (side) / screen-right (front), y = up; origin = fr.head
const HY = 0.5 // the round head sits a little higher on the neck than the old one
const HA = 6.9 // half width (front)
const HT = 8.2 // crown above the centre line
const HB = 7.3 // chin below the centre line
const spow = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e
/** superellipse egg: rounder crown, slightly fuller cheeks / jaw */
function headRing(n: number, aF: number, aB: number): V[] {
  const ps: V[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const c = Math.cos(t)
    const sn = Math.sin(t)
    const up = sn > 0
    const e = 2 / (up ? 2.15 : 2.5)
    ps.push([(c > 0 ? aF : aB) * spow(c, e), (up ? HT : HB) * spow(sn, e) + HY])
  }
  return ps
}
const HEAD_FRONT: V[] = headRing(32, HA, HA)
// profile: face (+x) a bit flatter than the round back of the skull, small soft nose bump
const HEAD_SIDE: V[] = headRing(48, 6.5, 7.3).map(([x, y]) => [x > 0 ? x + 0.6 * Math.exp(-(((y + 0.9) / 0.6) ** 2)) : x, y])
/** half width of the front outline at height y */
function headHalfW(y: number): number {
  const v = (y - HY) / (y > HY ? HT : HB)
  const e = y > HY ? 2.15 : 2.5
  return HA * Math.max(0, 1 - Math.abs(v) ** e) ** (1 / e)
}
// hair cap (front): crown + sides down to the ear tops, soft fringe with a slight side part
const HAIR_FRINGE: V[] = [[6.75, 1.3], [6.1, 3.0], [4.7, 3.55], [2.9, 3.75], [1.1, 4.3], [-0.9, 4.95], [-3.0, 4.75], [-5.0, 3.85], [-6.3, 2.5], [-6.85, 1.3]]
function hairCap(): V[] {
  const ps: V[] = []
  const n = 26
  for (let i = 0; i <= n; i++) {
    // outline from the right ear top over the crown to the left ear top, a hair's breadth outside the skull
    const t = -0.02 + (i / n) * (Math.PI + 0.04)
    const c = Math.cos(t)
    const sn = Math.sin(t)
    const e = 2 / 2.15
    ps.push([1.045 * HA * spow(c, e), 1.06 * HT * spow(Math.max(0, sn), e) + HY + 0.75 * (1 - Math.max(0, sn))])
  }
  return [...ps, ...[...HAIR_FRINGE].reverse()]
}
const HAIR_FRONT: V[] = hairCap()
// hair cap (side): crown and back of the head down to the nape, hairline over the forehead, short sideburn by the ear
const HAIR_SIDE: V[] = (() => {
  const ps: V[] = []
  const n = 30
  // from the forehead hairline (front, ~y 4.4) over the crown to the nape (back, ~y -3.4)
  const t0 = 0.45
  const t1 = Math.PI + 0.62
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    const c = Math.cos(t)
    const sn = Math.sin(t)
    const up = sn > 0
    const e = 2 / (up ? 2.15 : 2.5)
    ps.push([(c > 0 ? 6.5 : 7.3) * 1.045 * spow(c, e), (up ? HT * 1.06 : HB * 1.02) * spow(sn, e) + HY])
  }
  return [...ps, [-5.3, -2.6], [-3.4, -0.6], [-2.6, 1.9], [-0.9, 2.5], [0.2, 0.7], [0.9, 0.9], [1.3, 2.9], [3.4, 3.45], [5.4, 3.6]]
})()

function ellipse(c: V, ax: V, ay: V, rx: number, ry: number): string {
  const ps: V[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ps.push(add(add(c, ax, Math.cos(a) * rx), ay, Math.sin(a) * ry))
  }
  return closed(ps)
}

/* ---------- bare feet / hands ---------- */
/** front view: extra foot length (fraction) when fully up on the toes */
export const TOE_STRETCH = 0.75
// side: x along the foot (toward toes), y toward the sole
export const FOOT_SIDE: V[] = [
  [-1.5, -2.3], [-2.6, -0.2], [-2.9, 2.2], [-2.3, 3.9], [-1.0, 4.5], [2.6, 4.1], [6.6, 4.5], [10.0, 4.5], [11.9, 3.9], [12.3, 3.0], [11.4, 2.1], [8.4, 1.2], [4.8, -0.5], [1.8, -2.4],
]
// front: x lateral, y down
const FOOT_FRONT: V[] = [
  [-2.3, -1.8], [2.3, -1.8], [2.8, 1.0], [3.7, 3.3], [3.3, 4.6], [-2.9, 4.6], [-3.4, 3.3], [-2.9, 1.0],
]
// hand: x along the hand, y across (w)
const HAND: V[] = [
  [0.1, -1.8], [2.0, -2.1], [3.9, -1.9], [5.3, -1.2], [5.8, -0.1], [5.4, 1.1], [3.9, 1.8], [2.0, 2.1], [0.1, 1.8],
]
/** centre of the drawn hand (palm), e.g. for motion trails */
export function handCentre(lb: LimbOut): V {
  return add(lb.end, dir(lb.ea, lb.fc), 0.3 + 3.0)
}

export interface Parts {
  [k: string]: string
}

/* ---------- layer spec (static per view) ---------- */
/** m muscle, ft feature (skin fill), ey eye, hl eye highlight, bl blush, br brow, mo mouth, hr hair, ln line */
export type OverKind = 'm' | 'ft' | 'ey' | 'hl' | 'bl' | 'br' | 'mo' | 'hr' | 'ln'
export interface Over {
  k: string
  kind: OverKind
  ids: MuscleId[]
  /** base part whose silhouette clips this overlay */
  clip?: string
}
export interface Layer {
  id: string
  far: boolean
  base: string[]
  over: Over[]
}
const tables = (front: boolean) =>
  front ? { u: F_UPPER, f: F_FORE, t: F_THIGH, s: F_SHIN, torso: F_TORSO } : { u: S_UPPER, f: S_FORE, t: S_THIGH, s: S_SHIN, torso: S_TORSO }
const mOver = (pre: string, defs: MDef[], clip: string): Over[] => defs.map((m) => ({ k: `${pre}.${m.n}`, kind: 'm', ids: m.ids, clip }))

const HIP_PATCHES_N: [Patch, MuscleId[]][] = [
  [GLUTE_MIN, ['glutes']],
  [GLUTE_MED, ['glutes']],
  [GLUTE_MAX, ['glutes']],
]
const HIP_PATCHES_F: [Patch, MuscleId[]][] = [[GLUTE_MAX, ['glutes']]]

export function figureLayers(front: boolean, headFront: boolean, yaw = 0): Layer[] {
  const T = tables(front)
  const arm = (s: 'N' | 'F', far: boolean): Layer => ({
    id: `a${s}`,
    far,
    base: [`a${s}f`, `a${s}h`, `a${s}u`],
    over: [...mOver(`a${s}`, T.f, `a${s}f`), ...(front ? [] : [{ k: `a${s}.th`, kind: 'ft' as const, ids: [] }]), ...mOver(`a${s}`, T.u, `a${s}u`)],
  })
  const shinOver = (s: 'N' | 'F'): Over[] => [...mOver(`l${s}`, T.s, `l${s}s`), { k: `l${s}.toe`, kind: 'ln' as const, ids: [] }]
  // thigh muscles + glutes are clipped to thigh ∪ hip piece, so they run into the pelvis without a seam
  const thighOver = (s: 'N' | 'F'): Over[] => mOver(`l${s}`, T.t, `l${s}tc`)
  const hipOver = (s: 'N' | 'F'): Over[] =>
    front ? [] : (s === 'N' ? HIP_PATCHES_N : HIP_PATCHES_F).map(([m, ids]) => ({ k: `l${s}.${m.n}`, kind: 'm' as const, ids, clip: `l${s}tc` }))
  const legBase = (s: 'N' | 'F') => [`l${s}s`, `l${s}ft`, `l${s}t`, `l${s}hp`]
  const torsoOver: Over[] = [...mOver('t', T.torso, 'tclip'), { k: 't.ln', kind: 'ln', ids: [], clip: 'tclip' }]
  const FACE_OVER: Over[] = [
    { k: 'hr', kind: 'hr', ids: [] },
    { k: 'ear', kind: 'ft', ids: [] },
    { k: 'earLn', kind: 'ln', ids: [] },
    { k: 'blush', kind: 'bl', ids: [] },
    { k: 'face', kind: 'ln', ids: [] },
    { k: 'brow', kind: 'br', ids: [] },
    { k: 'mouth', kind: 'mo', ids: [] },
    { k: 'eye', kind: 'ey', ids: [] },
    { k: 'eyeHl', kind: 'hl', ids: [] },
  ]
  const head: Layer = { id: 'hd', far: false, base: front && !yaw ? ['earL', 'earR', 'head'] : ['head'], over: FACE_OVER }
  if (front && yaw) {
    // 3/4: figure faces screen right → the N limbs are behind the body (darker), the F limbs in front
    const body: Layer = {
      id: 'body',
      far: false,
      base: [...legBase('F'), 'torso', 'neck'],
      over: [...shinOver('F'), ...thighOver('F'), ...torsoOver],
    }
    const farLeg: Layer = { id: 'lN', far: true, base: legBase('N'), over: [...shinOver('N'), ...thighOver('N')] }
    return headFront ? [arm('N', true), farLeg, body, arm('F', false), head] : [arm('N', true), farLeg, body, head, arm('F', false)]
  }
  if (front) {
    return [
      {
        id: 'body',
        far: false,
        base: [...legBase('F'), ...legBase('N'), 'torso', 'neck'],
        over: [...shinOver('F'), ...thighOver('F'), ...shinOver('N'), ...thighOver('N'), ...torsoOver],
      },
      head,
      arm('F', false),
      arm('N', false),
    ]
  }
  // side view: the near thigh and hip sit in front of the torso → torso muscles first, then thigh, then glutes
  const body: Layer = {
    id: 'body',
    far: false,
    base: [...legBase('N'), 'torso', 'neck'],
    over: [...shinOver('N'), ...torsoOver, ...thighOver('N'), ...hipOver('N')],
  }
  const farLeg: Layer = { id: 'lF', far: true, base: legBase('F'), over: [...shinOver('F'), ...thighOver('F'), ...hipOver('F')] }
  return headFront ? [arm('F', true), farLeg, body, arm('N', false), head] : [arm('F', true), farLeg, body, head, arm('N', false)]
}

/* ---------- per-frame geometry ---------- */
function muscles(out: Parts, pre: string, g: Seg, defs: MDef[], fib: Set<string>, scaleT = 1, map?: (p: V) => V) {
  for (const m of defs) {
    const k = `${pre}.${m.n}`
    const [o, f] = spindle(g, m, scaleT, fib.has(k), map)
    out[k] = o
    if (f) out[k + '~'] = f
  }
}

function limbParts(fr: Frame, lb: LimbOut, arm: boolean, out: Parts, pre: string, fib: Set<string>) {
  const front = fr.front
  const T = tables(front)
  const sg = front ? -lb.fc : 1
  const s = lb.fc // keep the base bulges symmetric between mirrored limbs
  if (arm) {
    out[pre + 'u'] = limb(lb.root, lb.mid, front ? 3.6 : 3.8, 2.7, 0.6 * s, 0.7 * s, 0.4)
    out[pre + 'f'] = lb.fs < 0.6 ? limb(lb.mid, lb.end, 2.8, 2.2) : limb(lb.mid, lb.end, 2.8, 2.0, 0.4 * s, 0.6 * s, 0.28)
    const gu = segOf(lb.root, lb.mid, sg)
    muscles(out, pre, gu, T.u, fib)
    const gf = segOf(lb.mid, lb.end, sg)
    if (lb.fs < 0.55) for (const m of T.f) out[`${pre}.${m.n}`] = ''
    else muscles(out, pre, gf, T.f, fib)
    // hand
    const hd = dir(lb.ea, lb.fc)
    const gh: Seg = { o: add(lb.end, hd, 0.3), u: hd, n: [-hd[1] * sg, hd[0] * sg], l: 1 }
    out[pre + 'h'] = closed(HAND.map((q) => at(gh, q[0], q[1])))
    if (!front) out[pre + '.th'] = spindle(gh, { n: 'th', ids: [], a: [0.6, -1.3], b: [3.4, -1.9], w: [0.8, 0.85, 0.5] }, 1, false)[0]
  } else {
    out[pre + 't'] = limb(lb.root, lb.mid, front ? 5.4 : 6.0, 4.2, 0.7 * s, 1.1 * s, 0.42)
    out[pre + 's'] = limb(lb.mid, lb.end, 4.1, 2.4, 1.6 * s, 0.3 * s, 0.28)
    // hip: pelvis ↔ femur blended piece, glutes ride on the same skin
    const sk = hipSkin(fr, lb)
    out[pre + 'hp'] = closed((front ? HIP_FRONT : HIP_SIDE).map((q) => skin(sk, q)))
    out[pre + 'tc'] = out[pre + 't'] + out[pre + 'hp']
    if (!front) {
      for (const [m] of pre === 'lN' ? HIP_PATCHES_N : HIP_PATCHES_F) {
        const k = `${pre}.${m.n}`
        const [o, f] = patch(sk, m, fib.has(k))
        out[k] = o
        if (f) out[k + '~'] = f
      }
    }
    muscles(out, pre, segOf(lb.root, lb.mid, sg), T.t, fib, 1, (p) => skinThigh(sk, p))
    muscles(out, pre, segOf(lb.mid, lb.end, sg), T.s, fib)
    if (front && fr.yaw) {
      // 3/4: the foot points forward (toward screen right), seen half from the side
      const r = (fr.yaw * Math.PI) / 180
      const cy = Math.cos(r)
      const sy = Math.sin(r)
      // sole stays level: in 3/4 the frontal shin slant is mostly depth, not ankle roll
      const D0 = dir(lb.ea - 90, lb.fc)
      const D: V = [D0[0] * 0.25, Math.sqrt(1 - (D0[0] * 0.25) ** 2)]
      const pts: V[] = []
      for (const w of [-2.3, 2.3]) for (const q of FOOT_SIDE) pts.push([lb.end[0] + q[0] * sy + w * cy + D[0] * (q[1] + 1.1), lb.end[1] + D[1] * (q[1] + 1.1)])
      out[pre + 'ft'] = closed(hull(pts))
      const W = (q: V): V => [lb.end[0] + q[0] * sy + D[0] * (q[1] + 1.1) - 2.3 * cy, lb.end[1] + D[1] * (q[1] + 1.1)]
      out[pre + '.toe'] = `M${pt(W([9.6, 1.8]))}${curve([W([9.6, 1.8]), W([10.1, 3.0]), W([10.0, 4.2])])}`
    } else if (front) {
      const D = dir(lb.ea - 90, lb.fc)
      const X: V = [lb.fc * D[1], -lb.fc * D[0]]
      // up on the toes: seen from the front the instep tilts toward the camera → the foot reads longer
      const st = 1 + lb.toe * TOE_STRETCH
      const nw = 1 - lb.toe * 0.08
      const W = (q: V): V => add(add(lb.end, X, q[0] * nw), D, q[1] > 0 ? q[1] * st : q[1])
      out[pre + 'ft'] = closed(FOOT_FRONT.map(W))
      let t = ''
      for (const x of [-1.9, -0.6, 0.6, 1.8]) t += `M${pt(W([x * lb.fc * 1, 4.6 - 1.1 / st]))}L${pt(W([x * lb.fc * 1.02, 4.5]))}`
      out[pre + '.toe'] = t
    } else {
      const U = dir(lb.ea, lb.fc)
      const Vv: V = [-lb.fc * U[1], lb.fc * U[0]]
      const W = (q: V): V => add(add(lb.end, U, q[0]), Vv, q[1])
      out[pre + 'ft'] = closed(FOOT_SIDE.map(W))
      // ankle bone + toe crease
      out[pre + '.toe'] = `M${pt(W([9.6, 1.8]))}${curve([W([9.6, 1.8]), W([10.1, 3.0]), W([10.0, 4.2])])}M${pt(W([-0.9, -0.9]))}${curve([W([-0.9, -0.9]), W([0.2, -0.3]), W([1.0, -0.8])])}`
    }
  }
}

export function drawFrame(fr: Frame, fib: Set<string> = new Set()): Parts {
  const out: Parts = {}
  limbParts(fr, fr.armN, true, out, 'aN', fib)
  limbParts(fr, fr.armF, true, out, 'aF', fib)
  limbParts(fr, fr.legN, false, out, 'lN', fib)
  limbParts(fr, fr.legF, false, out, 'lF', fib)
  // the torso stops above the hip joint; the hip pieces (pelvis ↔ thigh skin) cover the pelvis
  out.torso = torsoPiece(fr, fr.front ? 0.0 : 0.14, 1.1)
  out.tclip = out.torso + (fr.front && fr.yaw ? out.lFhp : out.lNhp + (fr.front ? out.lFhp : ''))
  const gt: Seg = { o: fr.p, u: fr.axis, n: fr.fwd, l: L.torso }
  const wp0 = spineWarp(fr)
  const qd = quarterOf(fr)
  const qs = qd ? quarterSurface(fr, qd) : undefined
  const wp = qs ? (p: V) => (wp0 ? wp0(qs(p)) : qs(p)) : wp0
  muscles(out, 't', gt, tables(fr.front).torso, fib, 1, wp)
  const W = wp ? (s: number, w: number) => wp(at(gt, s * L.torso, w)) : (s: number, w: number) => at(gt, s * L.torso, w)
  if (fr.front) {
    // inguinal V lines + navel
    out['t.ln'] =
      open([W(0.2, 6.6), W(0.06, 5.2), W(-0.1, 2.6)]) + open([W(0.2, -6.6), W(0.06, -5.2), W(-0.1, -2.6)]) + ellipse(W(0.13, 0), wp ? fr.pAxis : gt.u, wp ? fr.pFwd : gt.n, 0.35, 0.3)
  } else {
    // spine groove of the hip / ribcage edge
    out['t.ln'] = open([W(0.66, 6.2), W(0.6, 3.6), W(0.64, 1.2)])
  }
  const hd = dir(fr.headA)
  out.neck = limb(add(fr.neckBase, fr.axis, -2.5), add(fr.head, hd, -3.5), fr.front ? 3.3 : 3.1, 2.8)
  const up = hd
  const fw = dir(fr.headA - 90)
  const H = (q: V): V => add(add(fr.head, fw, q[0]), up, q[1])
  const bean = (P: (q: V) => V, c: V, rx: number, ry: number) => ellipse(P(c), fw, up, rx, ry)
  if (fr.front) {
    // front & 3/4: features live on a round head; with yaw they slide around it (azimuth + yaw) and squash near the rim
    const Y = fr.yaw ? (fr.yaw * Math.PI) / 180 : 0
    const az = (q: V) => {
      const w = Math.max(0.5, headHalfW(q[1]))
      const ph = Math.asin(Math.max(-1, Math.min(1, q[0] / w)))
      return { w, ph }
    }
    /** front-view face point → screen (on the rotated head) */
    const F = (q: V): V => {
      if (!Y) return H(q)
      const { w, ph } = az(q)
      return H([w * Math.sin(Math.min(Math.PI / 2, ph + Y)), q[1]])
    }
    /** horizontal squash of a feature at q */
    const sq = (q: V) => {
      if (!Y) return 1
      const { ph } = az(q)
      return Math.max(0.18, Math.cos(ph + Y))
    }
    out.head = closed(HEAD_FRONT.map(H))
    if (!Y) {
      out.earL = ellipse(H([-6.95, -0.2]), fw, up, 1.35, 2.0)
      out.earR = ellipse(H([6.95, -0.2]), fw, up, 1.35, 2.0)
      out.ear = ''
      out.earLn = ''
    } else {
      // only the near ear (screen left) shows, sitting inside the outline toward the back of the head
      const ex = HA * Math.sin(-Math.PI / 2 + Y)
      out.ear = ellipse(H([ex, -0.2]), fw, up, 1.35 * Math.max(0.35, Math.sin(Y)) + 0.25, 2.0)
      out.earLn = open([H([ex + 0.35, 1.0]), H([ex - 0.25, 0.1]), H([ex + 0.3, -1.1])])
    }
    out.hr = FACE.hair ? closed(HAIR_FRONT.map((q, i) => (i <= 26 ? H(q) : F(q)))) : ''
    const eyes: V[] = [[2.45, 0.35], [-2.45, 0.35]]
    out.eye = eyes.map((c) => bean(F, c, 0.78 * sq(c), 1.12)).join('')
    out.eyeHl = eyes.map((c) => bean(F, [c[0] + 0.24, c[1] + 0.45], 0.3 * sq(c), 0.3)).join('')
    out.brow = eyes.map((c) => open([F([c[0] - 0.85, c[1] + 2.15]), F([c[0], c[1] + 2.5]), F([c[0] + 0.85, c[1] + 2.2])])).join('')
    out.face = open([F([-0.42, -1.55]), F([0, -1.85]), F([0.42, -1.55])])
    out.mouth = open([F([-1.45, -3.55]), F([-0.75, -4.1]), F([0, -4.25]), F([0.75, -4.1]), F([1.45, -3.55])])
    out.blush = ([[3.95, -2.15], [-3.95, -2.15]] as V[]).map((c) => bean(F, c, 1.15 * sq(c), 0.62)).join('')
  } else {
    out.head = closed(HEAD_SIDE.map(H))
    out.hr = FACE.hair ? closed(HAIR_SIDE.map(H)) : ''
    out.ear = ellipse(H([-0.9, -0.2]), fw, up, 1.45, 2.1)
    out.earLn = open([H([-0.6, 1.1]), H([-1.4, 0.1]), H([-0.7, -1.1])])
    out.eye = bean(H, [4.55, 0.35], 0.56, 1.1)
    out.eyeHl = bean(H, [4.72, 0.8], 0.24, 0.28)
    out.brow = open([H([3.75, 2.55]), H([4.6, 2.85]), H([5.45, 2.6])])
    out.face = ''
    out.mouth = open([H([4.35, -3.7]), H([4.95, -4.15]), H([5.45, -4.0])])
    out.blush = bean(H, [3.4, -2.15], 1.0, 0.6)
  }
  return out
}

/** lift the whole frame if a foot / hand / knee would sink into the floor (mid-transition safety net) */
export function groundClamp(fr: Frame, ground: number): Frame {
  let low = -Infinity
  for (const lb of [fr.legN, fr.legF]) {
    low = Math.max(low, lb.mid[1] + 4.2)
    if (fr.front) {
      const D = dir(lb.ea - 90, lb.fc)
      low = Math.max(low, lb.end[1] + D[1] * 4.6 * (1 + lb.toe * TOE_STRETCH) + 1)
    } else {
      const U = dir(lb.ea, lb.fc)
      const Vv: V = [-lb.fc * U[1], lb.fc * U[0]]
      for (const q of FOOT_SIDE) low = Math.max(low, lb.end[1] + U[1] * q[0] + Vv[1] * q[1])
    }
  }
  for (const lb of [fr.armN, fr.armF]) {
    const hd = dir(lb.ea, lb.fc)
    low = Math.max(low, lb.end[1] + hd[1] * 4.4 + 2.2, lb.mid[1] + 2.9)
  }
  const dy = low - ground
  if (dy <= 0.05) return fr
  const m = (v: V): V => [v[0], v[1] - dy]
  const ml = (l: LimbOut): LimbOut => ({ ...l, root: m(l.root), mid: m(l.mid), end: m(l.end) })
  return {
    ...fr, p: m(fr.p), S: m(fr.S), neckBase: m(fr.neckBase), head: m(fr.head),
    armN: ml(fr.armN), armF: ml(fr.armF), legN: ml(fr.legN), legF: ml(fr.legF),
  }
}

/** ground-shadow ellipse (cx, rx, opacity) from the parts near the floor */
export function shadowOf(fr: Frame, ground: number): [number, number, number] {
  const pts: V[] = [fr.p, fr.S, fr.head]
  for (const l of [fr.armN, fr.armF, fr.legN, fr.legF]) pts.push(l.mid, l.end)
  let lo = Infinity
  let hi = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    maxY = Math.max(maxY, p[1])
    if (p[1] > ground - 26) {
      lo = Math.min(lo, p[0])
      hi = Math.max(hi, p[0])
    }
  }
  if (lo > hi) {
    lo = hi = fr.p[0]
  }
  const gap = Math.max(0, ground - 5 - maxY)
  const op = Math.max(0.25, 1 - gap / 34)
  return [(lo + hi) / 2, (hi - lo) / 2 + 9 - gap * 0.15, op]
}
