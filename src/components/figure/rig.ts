/**
 * Tiny 2D skeletal rig for the exercise demo figure.
 *
 * Angle convention (degrees), per limb "facing" fc (+1 / -1):
 *   dir(θ) = [fc·sin θ, cos θ]  →  0 = straight down, 90 = forward, 180 = straight up, 270 = back.
 * Side views always use fc = +1 (figure faces right). Front views use fc = +1 for the
 * screen-right limbs (N) and fc = -1 for the screen-left limbs (F), so symmetric poses share numbers.
 *
 * Torso angle T is the direction hip → shoulder (180 = upright, 90 = horizontal head-right,
 * 270 = lying on the back with the head to the left). Arms bend "forward" (lower = upper + b),
 * legs bend "backward" (lower = upper − b), so b ≥ 0 is always an anatomical bend.
 */
export type V = [number, number]
export type LimbName = 'armN' | 'armF' | 'legN' | 'legF'
export const LIMBS: LimbName[] = ['armN', 'armF', 'legN', 'legF']

export interface LimbKey {
  /** FK: upper segment absolute angle */
  a?: number
  /** FK: bend at elbow / knee (≥ 0) */
  b?: number
  /** IK: wrist / ankle target */
  t?: V
  /** IK: pick the reversed bend (rarely needed) */
  flip?: boolean
  /** absolute angle of hand / foot (default: hand continues forearm, foot ⟂ shin) */
  e?: number
  /** FK angles (and e) are relative to the torso (upright = 180) */
  rel?: boolean
  /** arc height of the IK target while moving into this key (feet leaving the floor) */
  lift?: number
  /** foreshorten lower segment (0–1), for limbs pointing at the camera */
  fs?: number
  /** foreshorten upper segment (0–1) */
  fu?: number
}
export interface Key {
  /** hip (pelvis) position */
  p: V
  /** torso angle */
  t: number
  /** neck angle relative to torso */
  n?: number
  /** absolute head angle (overrides n) */
  h?: number
  armN: LimbKey
  armF: LimbKey
  legN: LimbKey
  legF: LimbKey
  /** root hops up by this much while moving into this key */
  hop?: number
  /** easing used while moving into this key */
  ease?: 'io' | 'in' | 'out' | 'lin'
}

export const L = {
  torso: 31.5,
  thigh: 26.5,
  shin: 26,
  upper: 20,
  fore: 16,
  shoulderW: 9.0, // front view half shoulder width
  hipW: 4.6, // front view half hip width
}

const RAD = Math.PI / 180
export const dir = (deg: number, fc = 1): V => [fc * Math.sin(deg * RAD), Math.cos(deg * RAD)]
export const angOf = (v: V, fc = 1) => Math.atan2(fc * v[0], v[1]) / RAD
export const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k]
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]]
export const len = (v: V) => Math.hypot(v[0], v[1])
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k
const lerpA = (a: number, b: number, k: number) => a + wrap(b - a) * k
const lerpV = (a: V, b: V, k: number): V => [lerpN(a[0], b[0], k), lerpN(a[1], b[1], k)]

export interface LimbOut {
  root: V
  mid: V
  end: V
  /** absolute angles: upper, lower, end (hand/foot) */
  ua: number
  la: number
  ea: number
  fc: number
  fs: number
  fu: number
  /** IK could not reach the target by this much (debug) */
  miss: number
}
export interface Frame {
  front: boolean
  p: V
  T: number
  S: V
  axis: V
  fwd: V
  neckBase: V
  head: V
  headA: number
  armN: LimbOut
  armF: LimbOut
  legN: LimbOut
  legF: LimbOut
}

const isArm = (n: LimbName) => n === 'armN' || n === 'armF'

function limbRoot(name: LimbName, P: V, S: V, fwd: V, front: boolean): V {
  if (!front) return isArm(name) ? add(S, sub(P, S), 0.045) : P
  const side = name.endsWith('N') ? 1 : -1
  return isArm(name) ? add(S, fwd, side * L.shoulderW) : add(P, fwd, side * L.hipW)
}

function solveIK(root: V, target: V, l1: number, l2: number, fc: number, sgn: number, flip: boolean) {
  const d = sub(target, root)
  const dist = len(d)
  const maxR = l1 + l2 - 0.01
  const minR = Math.abs(l1 - l2) + 0.01
  const r = Math.min(maxR, Math.max(minR, dist))
  const base = angOf(d, fc)
  const cosA = (l1 * l1 + r * r - l2 * l2) / (2 * l1 * r)
  const A = Math.acos(Math.max(-1, Math.min(1, cosA))) / RAD
  // two candidates: upper = base ± A; pick the one whose bend has sign sgn (or reversed if flip)
  const cands = [base + A, base - A].map((ua) => {
    const mid = add(root, dir(ua, fc), l1)
    const la = angOf(sub(add(root, d, r / (dist || 1)), mid), fc)
    return { ua, la, bend: sgn * wrap(la - ua) }
  })
  const want = flip ? -1 : 1
  const c = cands.find((q) => Math.sign(q.bend) === want) ?? cands[0]
  return { ua: c.ua, la: c.la, miss: Math.max(0, dist - maxR) }
}

/** resolved per-key limb data used for interpolation */
interface LimbRes {
  ik: boolean
  t: V
  ua: number
  la: number
  ea: number
  eAbs: boolean
  rel: boolean
  fs: number
  fu: number
  flip: boolean
  lift: number
}
interface KeyRes {
  key: Key
  neck: number
  limbs: Record<LimbName, LimbRes>
}

function fcOf(name: LimbName, front: boolean) {
  return front && name.endsWith('F') ? -1 : 1
}

function computeLimb(name: LimbName, root: V, ua: number, la: number, ea: number, fc: number, fs: number, fu: number, miss = 0): LimbOut {
  const arm = isArm(name)
  const l1 = (arm ? L.upper : L.thigh) * fu
  const l2 = (arm ? L.fore : L.shin) * fs
  const mid = add(root, dir(ua, fc), l1)
  const end = add(mid, dir(la, fc), l2)
  return { root, mid, end, ua, la, ea, fc, fs, fu, miss }
}

function bodyFrame(p: V, T: number) {
  const axis = dir(T)
  const fwd = dir(T - 90)
  const S = add(p, axis, L.torso)
  return { axis, fwd, S }
}

function resolveKey(key: Key, front: boolean): KeyRes {
  const { fwd, S } = bodyFrame(key.p, key.t)
  const limbs = {} as Record<LimbName, LimbRes>
  for (const name of LIMBS) {
    const k = key[name]
    const fc = fcOf(name, front)
    const arm = isArm(name)
    const sgn = arm ? 1 : -1
    const fs = k.fs ?? 1
    const fu = k.fu ?? 1
    const root = limbRoot(name, key.p, S, fwd, front)
    const relOff = k.rel ? fc * (key.t - 180) : 0
    let ua: number, la: number
    if (k.t) {
      const s = solveIK(root, k.t, (arm ? L.upper : L.thigh) * fu, (arm ? L.fore : L.shin) * fs, fc, sgn, !!k.flip)
      ua = s.ua
      la = s.la
    } else {
      ua = (k.a ?? 0) + relOff
      la = ua + sgn * (k.b ?? 0)
    }
    const eAbs = k.e !== undefined
    const ea = eAbs ? k.e! + relOff : arm ? la : la + 90
    limbs[name] = { ik: !!k.t, t: k.t ?? [0, 0], ua, la, ea, eAbs, rel: !!k.rel, fs, fu, flip: !!k.flip, lift: k.lift ?? 0 }
  }
  const neck = key.h !== undefined ? key.h - key.t : key.n ?? 0
  return { key, neck, limbs }
}

const EASE = {
  io: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  in: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  out: (t: number) => Math.sin((t * Math.PI) / 2),
  lin: (t: number) => t,
}

export class Rig {
  front: boolean
  keys: KeyRes[]
  constructor(keys: Key[], front = false) {
    this.front = front
    this.keys = keys.map((k) => resolveKey(k, front))
  }

  /** pose between key i and key i+1 (wrapping) at raw fraction u ∈ [0,1] */
  pose(i: number, u: number): Frame {
    const A = this.keys[i]
    const B = this.keys[(i + 1) % this.keys.length]
    const k = EASE[B.key.ease ?? 'io'](u)
    const bump = Math.sin(Math.PI * k)
    const p = lerpV(A.key.p, B.key.p, k)
    p[1] -= bump * (B.key.hop ?? 0)
    const T = lerpN(A.key.t, B.key.t, k)
    const bothHeadAbs = A.key.h !== undefined && B.key.h !== undefined
    const headA = bothHeadAbs ? lerpA(A.key.h!, B.key.h!, k) : T + lerpN(A.neck, B.neck, k)
    const out = this.build(p, T, headA, (name, root, fc) => {
      const a = A.limbs[name]
      const b = B.limbs[name]
      const arm = isArm(name)
      const sgn = arm ? 1 : -1
      const fs = lerpN(a.fs, b.fs, k)
      const fu = lerpN(a.fu, b.fu, k)
      const l1 = (arm ? L.upper : L.thigh) * fu
      const l2 = (arm ? L.fore : L.shin) * fs
      let ua: number, la: number, miss = 0
      if (a.ik && b.ik) {
        const t = lerpV(a.t, b.t, k)
        t[1] -= bump * b.lift
        const s = solveIK(root, t, l1, l2, fc, sgn, b.flip)
        ua = s.ua
        la = s.la
        miss = s.miss
      } else {
        const rel = a.rel && b.rel
        const offA = rel ? fc * (A.key.t - 180) : 0
        const offB = rel ? fc * (B.key.t - 180) : 0
        const off = rel ? fc * (T - 180) : 0
        ua = lerpA(a.ua - offA, b.ua - offB, k) + off
        // interpolate the bend (keeps the joint bending the right way)
        const bend = lerpN(sgn * wrap(a.la - a.ua), sgn * wrap(b.la - b.ua), k)
        la = ua + sgn * bend
      }
      let ea: number
      if (a.eAbs && b.eAbs) {
        const rel = a.rel && b.rel
        const offA = rel ? fc * (A.key.t - 180) : 0
        const offB = rel ? fc * (B.key.t - 180) : 0
        ea = lerpA(a.ea - offA, b.ea - offB, k) + (rel ? fc * (T - 180) : 0)
      } else {
        ea = la + lerpA(wrap(a.ea - a.la), wrap(b.ea - b.la), k)
      }
      return computeLimb(name, root, ua, la, ea, fc, fs, fu, miss)
    })
    return out
  }

  private build(p: V, T: number, headA: number, limb: (n: LimbName, root: V, fc: number) => LimbOut): Frame {
    const { axis, fwd, S } = bodyFrame(p, T)
    const front = this.front
    const neckBase = add(add(p, axis, L.torso + 2.6), fwd, front ? 0 : 0.8)
    const hd = dir(headA)
    const hf = dir(headA - 90)
    const head = add(add(neckBase, hd, 9.2), hf, front ? 0 : 1.1)
    const f: Partial<Frame> = { front, p, T, S, axis, fwd, neckBase, head, headA }
    for (const name of LIMBS) f[name] = limb(name, limbRoot(name, p, S, fwd, front), fcOf(name, front))
    return f as Frame
  }
}
