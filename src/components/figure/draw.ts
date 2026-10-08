import { add, dir, L, len, sub, type Frame, type LimbOut, type V } from './rig'

const f1 = (n: number) => (Math.round(n * 10) / 10).toString()
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
/** smooth closed curve through points */
function closed(ps: V[]): string {
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

/** tapered capsule from A to B with optional muscle bulges on each side */
function limb(A: V, B: V, rA: number, rB: number, bN = 0, bP = 0, tm = 0.4, flatB = false): string {
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
    `M${pt(sN0)}Q${pt(cN)} ${pt(sN1)}${flatB ? 'L' : `A${f1(rB)} ${f1(rB)} 0 0 0 `}${pt(sP1)}` +
    `Q${pt(cP)} ${pt(sP0)}A${f1(rA)} ${f1(rA)} 0 0 0 ${pt(sN0)}Z`
  )
}

const along = (A: V, B: V, t: number): V => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]

/* ---------- torso profiles: [s along hip→shoulder (0..1), w offset] ---------- */
// side view: +w = chest side
const SIDE_FRONT: V[] = [
  [1.1, 2.6], [1.02, 4.6], [0.9, 6.6], [0.76, 7.3], [0.6, 6.4], [0.44, 5.3], [0.26, 5.2], [0.1, 5.6], [-0.06, 5.5], [-0.22, 4.0],
]
const SIDE_BACK: V[] = [
  [-0.24, -3.8], [-0.1, -5.9], [0.06, -6.3], [0.22, -5.2], [0.4, -4.7], [0.58, -5.3], [0.76, -6.2], [0.92, -5.8], [1.03, -4.2], [1.1, -2.4],
]
// front view: symmetric half width
const FRONT_HALF: V[] = [
  [1.1, 3.0], [1.06, 5.6], [1.02, 8.4], [0.94, 10.0], [0.8, 9.7], [0.62, 8.5], [0.46, 7.4], [0.3, 7.5], [0.12, 8.5], [-0.06, 8.8], [-0.22, 8.2],
]

function sampleSide(arr: V[], s0: number, s1: number): V[] {
  // arr sorted by s (either direction); return points with s in [s0,s1] plus interpolated ends, ordered as arr
  const at = (s: number): V => {
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
  return [at(first), ...inner, at(last)]
}

function torsoPiece(fr: Frame, s0: number, s1: number): string {
  const W = (q: V): V => add(add(fr.p, fr.axis, q[0] * L.torso), fr.fwd, q[1])
  if (fr.front) {
    const right = sampleSide([...FRONT_HALF], s0, s1).map(W) // top → bottom
    const left = sampleSide([...FRONT_HALF].reverse(), s0, s1).map(([s, w]) => W([s, -w]))
    return `M${pt(right[0])}${curve(right)}L${pt(left[0])}${curve(left)}Z`
  }
  const fr1 = sampleSide(SIDE_FRONT, s0, s1).map(W) // top → bottom
  const bk = sampleSide(SIDE_BACK, s0, s1).map(W) // bottom → top
  return `M${pt(fr1[0])}${curve(fr1)}L${pt(bk[0])}${curve(bk)}Z`
}

/* ---------- head ---------- */
const HEAD_SIDE: V[] = [
  [0, 7.3], [4.2, 6.0], [6.2, 3.0], [6.6, 0.4], [7.3, -1.2], [6.5, -2.3], [6.1, -4.0], [4.5, -6.3], [1.6, -6.9], [-1.5, -5.5], [-4.6, -4.1], [-6.4, -1.0], [-6.3, 3.0], [-3.8, 6.2],
]
const HAIR_SIDE: V[] = [
  [-4.4, -3.6], [-6.8, -0.6], [-6.7, 3.6], [-4.0, 6.9], [0.2, 8.0], [4.5, 6.6], [6.5, 3.4], [5.0, 3.9], [2.2, 4.7], [-0.4, 3.9], [-2.3, 1.4], [-3.3, -1.8],
]
const HEAD_FRONT: V[] = [
  [0, 7.5], [4.5, 6.2], [6.3, 2.6], [6.1, -1.4], [5.0, -4.6], [2.7, -6.7], [0, -7.3], [-2.7, -6.7], [-5.0, -4.6], [-6.1, -1.4], [-6.3, 2.6], [-4.5, 6.2],
]
const HAIR_FRONT: V[] = [
  [-6.6, 1.2], [-6.5, 4.8], [-4.2, 7.4], [0, 8.3], [4.2, 7.4], [6.5, 4.8], [6.6, 1.2], [5.5, 3.2], [3.4, 4.6], [0, 5.1], [-3.4, 4.6], [-5.5, 3.2],
]
function ellipse(c: V, ax: V, ay: V, rx: number, ry: number): string {
  const ps: V[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ps.push(add(add(c, ax, Math.cos(a) * rx), ay, Math.sin(a) * ry))
  }
  return closed(ps)
}

/* ---------- shoes ---------- */
const SHOE_SIDE: V[] = [
  [-3.4, 1.0], [-2.7, -2.4], [0.4, -3.2], [3.2, -1.7], [7.8, 0.0], [11.4, 1.4], [12.5, 3.0], [11.6, 4.5], [-2.2, 4.5], [-3.7, 3.4],
]
const SHOE_FRONT: V[] = [
  [-2.9, -1.6], [2.9, -1.6], [3.5, 1.6], [4.2, 3.4], [3.6, 4.6], [-3.1, 4.6], [-3.7, 3.4], [-3.4, 1.4],
]

/** soft shadow band along the back / one side of a torso piece */
function torsoShade(fr: Frame, s0: number, s1: number): string {
  const W = (q: V): V => add(add(fr.p, fr.axis, q[0] * L.torso), fr.fwd, q[1])
  const src = fr.front ? [...FRONT_HALF].reverse() : SIDE_BACK
  const outer = sampleSide(src, s0, s1)
  const inner = [...outer].reverse().map(([s, w]): V => [s, w * (fr.front ? 0.62 : 0.45)])
  const o = outer.map(W)
  const i = inner.map(W)
  return `M${pt(o[0])}${curve(o)}L${pt(i[0])}${curve(i)}Z`
}

export interface Parts {
  [k: string]: string
}

function limbParts(fr: Frame, lb: LimbOut, arm: boolean, out: Parts, pre: string) {
  const front = fr.front
  const s = lb.fc // keep bulges symmetric between mirrored limbs
  if (arm) {
    out[pre + 'upper'] = limb(lb.root, lb.mid, front ? 3.5 : 3.8, 2.8, 0.6 * s, 0.7 * s, 0.4)
    out[pre + 'sleeve'] = limb(lb.root, along(lb.root, lb.mid, lb.fu < 0.8 ? 0.5 : 0.38), front ? 3.9 : 4.4, front ? 3.8 : 4.1, 0, 0, 0.5, true)
    out[pre + 'fore'] = lb.fs < 0.6 ? limb(lb.mid, lb.end, 2.9, 2.3) : limb(lb.mid, lb.end, 2.9, 2.1, 0.4 * s, 0.6 * s, 0.28)
    const hd = dir(lb.ea, lb.fc)
    out[pre + 'hand'] = limb(add(lb.end, hd, 0.6), add(lb.end, hd, 4.4), 2.4, 2.1)
  } else {
    out[pre + 'thigh'] = limb(lb.root, lb.mid, front ? 5.4 : 6.0, 4.2, 0.7 * s, 1.1 * s, 0.42)
    out[pre + 'shorts'] = limb(lb.root, along(lb.root, lb.mid, 0.5), front ? 6.0 : 6.3, front ? 5.5 : 5.7, 0, 0, 0.5, true)
    out[pre + 'shin'] = limb(lb.mid, lb.end, 4.1, 2.5, 1.6 * s, 0.3 * s, 0.28)
    if (front) {
      const D = dir(lb.ea - 90, lb.fc)
      const X: V = [lb.fc * D[1], -lb.fc * D[0]]
      const W = (q: V): V => add(add(lb.end, X, q[0]), D, q[1])
      out[pre + 'shoe'] = closed(SHOE_FRONT.map(W))
      out[pre + 'sole'] = limb(W([-3.0, 4.1]), W([3.7, 4.1]), 0.9, 0.9)
    } else {
      const U = dir(lb.ea, lb.fc)
      const Vv: V = [-lb.fc * U[1], lb.fc * U[0]]
      const W = (q: V): V => add(add(lb.end, U, q[0]), Vv, q[1])
      out[pre + 'shoe'] = closed(SHOE_SIDE.map(W))
      out[pre + 'sole'] = limb(W([-2.6, 3.9]), W([11.6, 3.7]), 1.0, 1.0)
    }
  }
}

export function drawFrame(fr: Frame): Parts {
  const out: Parts = {}
  limbParts(fr, fr.armN, true, out, 'aN')
  limbParts(fr, fr.armF, true, out, 'aF')
  limbParts(fr, fr.legN, false, out, 'lN')
  limbParts(fr, fr.legF, false, out, 'lF')
  out.shirt = torsoPiece(fr, 0.13, 1.1)
  out.shorts = torsoPiece(fr, -0.26, 0.24)
  out.shade = torsoShade(fr, 0.15, 1.04) + torsoShade(fr, -0.24, 0.13)
  const hd = dir(fr.headA)
  out.neck = limb(add(fr.neckBase, fr.axis, -2), add(fr.head, hd, -3.5), 2.8, 2.6)
  const up = hd
  const fw = dir(fr.headA - 90)
  const H = (q: V): V => add(add(fr.head, fw, q[0]), up, q[1])
  if (fr.front) {
    // head "forward" axis in front view is screen-lateral
    out.head = closed(HEAD_FRONT.map(H))
    out.hair = closed(HAIR_FRONT.map(H))
    out.ear = ellipse(H([6.1, -0.6]), fw, up, 1.3, 2.1) + ellipse(H([-6.1, -0.6]), fw, up, 1.3, 2.1)
    out.eye = ellipse(H([2.4, 0.4]), fw, up, 0.75, 0.95) + ellipse(H([-2.4, 0.4]), fw, up, 0.75, 0.95)
    out.brow = limb(H([1.4, 2.4]), H([3.4, 2.2]), 0.45, 0.4) + limb(H([-1.4, 2.4]), H([-3.4, 2.2]), 0.45, 0.4)
  } else {
    out.head = closed(HEAD_SIDE.map(H))
    out.hair = closed(HAIR_SIDE.map(H))
    out.ear = ellipse(H([-1.3, -0.7]), fw, up, 1.6, 2.3)
    out.eye = ellipse(H([4.3, 0.5]), fw, up, 0.7, 0.95)
    out.brow = limb(H([3.3, 2.5]), H([5.6, 2.3]), 0.45, 0.4)
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
      low = Math.max(low, lb.end[1] + D[1] * 4.6 + 1)
    } else {
      const U = dir(lb.ea, lb.fc)
      const Vv: V = [-lb.fc * U[1], lb.fc * U[0]]
      for (const q of SHOE_SIDE) low = Math.max(low, lb.end[1] + U[1] * q[0] + Vv[1] * q[1])
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
