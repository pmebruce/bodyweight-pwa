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
 *
 * Front view is "2.5D": the in-plane angles (a, b) are frontal-plane angles (abduction), and the limbs
 * can also swing toward / away from the camera (sagittal angles f, k). A sagittal angle does not rotate
 * the segment on screen, it foreshortens it (projected length = l·cos), so a bending knee comes toward
 * the viewer instead of buckling sideways. Leg IK in the front view is solved in 3D (target depth z,
 * knee pole pointing at the camera) and projected.
 */
export type V = [number, number]
type V3 = [number, number, number]
export type LimbName = 'armN' | 'armF' | 'legN' | 'legF'
export const LIMBS: LimbName[] = ['armN', 'armF', 'legN', 'legF']

export interface LimbKey {
  /** FK: upper segment absolute angle (front view: in-plane / abduction angle) */
  a?: number
  /** FK: in-plane bend at elbow / knee (≥ 0) */
  b?: number
  /** IK: wrist / ankle target */
  t?: V
  /** IK: pick the reversed bend (rarely needed, 2D solver only) */
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
  /** front view FK: sagittal flexion of the upper segment toward the camera (hip / shoulder flexion) */
  f?: number
  /** front view FK: sagittal joint flexion (knee: shin swings back, elbow: forearm swings toward the camera) */
  k?: number
  /** front view IK: target depth (+ = toward the camera); using it (or pole) switches arms to the 3D solver */
  z?: number
  /** front view IK: lateral share of the knee / elbow direction (legs default 0.18, arms 0.6) */
  pole?: number
  /** front view foot: 0 = flat, 1 = up on the toes (heel raised) */
  toe?: number
}
export interface Key {
  /** hip (pelvis) position */
  p: V
  /** torso angle */
  t: number
  /** front view: pelvis angle (180 = level; > 180 drops the screen-left hip), default = torso angle */
  pa?: number
  /** shoulder elevation (shrug) */
  sh?: number
  /** front/3/4: shoulder protraction (+ = shoulders roll forward, toward the face direction) */
  pz?: number
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

export interface RigOpts {
  /** ms per key (needed for smooth interpolation and at()) */
  durs?: number[]
  /** continuous monotone-cubic interpolation through the keys (no stop at every key) */
  smooth?: boolean
  /** arms trail the body by this loop fraction (follow-through) */
  lag?: number
  /** head trails the body by this loop fraction */
  headLag?: number
  /** front view only: camera yaw in degrees (3/4 view). The figure turns to face screen right, so the
   *  screen-left (F) limbs come toward the camera and the N limbs go behind the body. */
  yaw?: number
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

export interface LimbOut {
  root: V
  mid: V
  end: V
  /** absolute angles: upper, lower, end (hand/foot) */
  ua: number
  la: number
  ea: number
  fc: number
  /** effective (projected) length factors of the lower / upper segment */
  fs: number
  fu: number
  /** depth of the mid joint / end toward the camera (front view) */
  zm: number
  /** 3/4: depth of the limb root (shoulder protraction) */
  zr?: number
  ze: number
  /** front view: foot up on the toes (0–1) */
  toe: number
  /** front view: frontal-plane angle of the upper segment (before any 3/4 projection) */
  uaF: number
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
  /** pelvis angle / frame (front view; = torso otherwise) */
  pa: number
  pAxis: V
  pFwd: V
  neckBase: V
  head: V
  headA: number
  armN: LimbOut
  armF: LimbOut
  legN: LimbOut
  legF: LimbOut
  /** front view camera yaw (deg), 0 = straight on */
  yaw: number
}

const isArm = (n: LimbName) => n === 'armN' || n === 'armF'

function limbRoot(name: LimbName, P: V, S: V, fwd: V, front: boolean, pFwd: V, axis: V, sh: number): V {
  if (!front) return isArm(name) ? add(add(S, sub(P, S), 0.045), axis, sh) : P
  const side = name.endsWith('N') ? 1 : -1
  return isArm(name) ? add(add(S, fwd, side * L.shoulderW), axis, sh) : add(P, pFwd, side * L.hipW)
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

/** front view: unit vector from in-plane angle a and sagittal angle f (z toward the camera) */
function v3(a: number, f: number, fc: number): V3 {
  const cf = Math.cos(f * RAD)
  return [fc * Math.sin(a * RAD) * cf, Math.cos(a * RAD) * cf, Math.sin(f * RAD)]
}
const toAF = (u: V3, fc: number, fallback: number): [number, number] => {
  const f = Math.asin(Math.max(-1, Math.min(1, u[2]))) / RAD
  const a = Math.hypot(u[0], u[1]) < 1e-4 ? fallback : Math.atan2(fc * u[0], u[1]) / RAD
  return [a, f]
}

/** front view 3D two-bone IK → FK angles (a, in-plane bend b, f, sagittal bend k) */
function solveIK3(arm: boolean, root: V, t: V, z: number, l1: number, l2: number, fc: number, pole: number) {
  const d: V3 = [t[0] - root[0], t[1] - root[1], z]
  const dist = Math.hypot(d[0], d[1], d[2])
  const maxR = l1 + l2 - 0.01
  const minR = Math.abs(l1 - l2) + 0.01
  const r = Math.min(maxR, Math.max(minR, dist))
  const dh: V3 = dist > 1e-6 ? [d[0] / dist, d[1] / dist, d[2] / dist] : [0, 1, 0]
  const cosA = (l1 * l1 + r * r - l2 * l2) / (2 * l1 * r)
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)))
  // knee → toward the camera (slightly out over the toes); elbow → back, out and down (forearm comes forward)
  const P: V3 = arm ? [fc * pole, 0.45, -0.7] : [fc * pole, 0, 1]
  const pd = P[0] * dh[0] + P[1] * dh[1] + P[2] * dh[2]
  let pp: V3 = [P[0] - pd * dh[0], P[1] - pd * dh[1], P[2] - pd * dh[2]]
  const pl = Math.hypot(pp[0], pp[1], pp[2])
  pp = pl > 1e-6 ? [pp[0] / pl, pp[1] / pl, pp[2] / pl] : [0, 0, arm ? -1 : 1]
  const M: V3 = [0, 1, 2].map((i) => dh[i] * l1 * Math.cos(A) + pp[i] * l1 * Math.sin(A)) as V3
  const E: V3 = [dh[0] * r, dh[1] * r, dh[2] * r]
  const U: V3 = [M[0] / l1, M[1] / l1, M[2] / l1]
  const W: V3 = [(E[0] - M[0]) / l2, (E[1] - M[1]) / l2, (E[2] - M[2]) / l2]
  const line = Math.atan2(fc * dh[0], dh[1]) / RAD
  const [a, f] = toAF(U, fc, line)
  const [a2, f2] = toAF(W, fc, line)
  const sgn = arm ? 1 : -1
  return { a, b: sgn * wrap(a2 - a), f, k: sgn * (f2 - f), miss: Math.max(0, dist - maxR) }
}

/** resolved per-key limb data used for interpolation */
interface LimbRes {
  ik: boolean
  /** 3D (front view) IK */
  ik3: boolean
  t: V
  z: number
  pole: number
  /** FK equivalent: upper in-plane angle, lower in-plane angle, sagittal angles */
  ua: number
  la: number
  f: number
  k: number
  ea: number
  eAbs: boolean
  rel: boolean
  fs: number
  fu: number
  flip: boolean
  lift: number
  toe: number
}
interface KeyRes {
  key: Key
  neck: number
  pa: number
  limbs: Record<LimbName, LimbRes>
}

function fcOf(name: LimbName, front: boolean) {
  return front && name.endsWith('F') ? -1 : 1
}

/** build a limb from FK angles (front view: 2.5D projection, side view: plain 2D) */
function computeLimb(
  name: LimbName, front: boolean, root: V, ua: number, bend: number, f: number, kz: number, ea: number, fc: number, fsK: number, fuK: number, toe: number, miss = 0,
): LimbOut {
  const arm = isArm(name)
  const sgn = arm ? 1 : -1
  const l1 = (arm ? L.upper : L.thigh) * fuK
  const l2 = (arm ? L.fore : L.shin) * fsK
  const la = ua + sgn * bend
  if (!front || (f === 0 && kz === 0)) {
    const mid = add(root, dir(ua, fc), l1)
    const end = add(mid, dir(la, fc), l2)
    return { root, mid, end, ua, la, ea, fc, fs: fsK, fu: fuK, zm: 0, ze: 0, toe, miss, uaF: ua }
  }
  const f2 = f + (arm ? 1 : -1) * kz
  const U = v3(ua, f, fc)
  const W = v3(la, f2, fc)
  const mid: V = [root[0] + U[0] * l1, root[1] + U[1] * l1]
  const end: V = [mid[0] + W[0] * l2, mid[1] + W[1] * l2]
  const cu = Math.cos(f * RAD)
  const cl = Math.cos(f2 * RAD)
  return {
    root, mid, end,
    ua: cu >= 0 ? ua : ua + 180,
    la: cl >= 0 ? la : la + 180,
    ea: cl >= 0 || !arm ? ea : ea + 180,
    fc, fs: fsK * Math.abs(cl), fu: fuK * Math.abs(cu), zm: U[2] * l1, ze: U[2] * l1 + W[2] * l2, toe, miss, uaF: ua,
  }
}

function bodyFrame(p: V, T: number) {
  const axis = dir(T)
  const fwd = dir(T - 90)
  const S = add(p, axis, L.torso)
  return { axis, fwd, S }
}

function resolveKey(key: Key, front: boolean): KeyRes {
  const { fwd, S, axis } = bodyFrame(key.p, key.t)
  const pa = front ? key.pa ?? key.t : key.t
  const pFwd = dir(pa - 90)
  const limbs = {} as Record<LimbName, LimbRes>
  for (const name of LIMBS) {
    const k = key[name]
    const fc = fcOf(name, front)
    const arm = isArm(name)
    const sgn = arm ? 1 : -1
    const fs = k.fs ?? 1
    const fu = k.fu ?? 1
    const root = limbRoot(name, key.p, S, fwd, front, pFwd, axis, key.sh ?? 0)
    const relOff = k.rel ? fc * (key.t - 180) : 0
    const ik3 = !!k.t && front && (!arm || k.z !== undefined || k.pole !== undefined)
    const pole = k.pole ?? (arm ? 0.6 : 0.18)
    let ua: number, la: number
    let f = 0
    let kz = 0
    if (k.t && ik3) {
      const s = solveIK3(arm, root, k.t, k.z ?? 0, (arm ? L.upper : L.thigh) * fu, (arm ? L.fore : L.shin) * fs, fc, pole)
      ua = s.a
      la = s.a + sgn * s.b
      f = s.f
      kz = s.k
    } else if (k.t) {
      const s = solveIK(root, k.t, (arm ? L.upper : L.thigh) * fu, (arm ? L.fore : L.shin) * fs, fc, sgn, !!k.flip)
      ua = s.ua
      la = s.la
    } else {
      ua = (k.a ?? 0) + relOff
      la = ua + sgn * (k.b ?? 0)
      f = front ? k.f ?? 0 : 0
      kz = front ? k.k ?? 0 : 0
    }
    const eAbs = k.e !== undefined
    const ea = eAbs ? k.e! + relOff : arm ? la : la + 90
    limbs[name] = {
      ik: !!k.t, ik3, t: k.t ?? [0, 0], z: k.z ?? 0, pole, ua, la, f, k: kz, ea, eAbs, rel: !!k.rel, fs, fu, flip: !!k.flip, lift: k.lift ?? 0, toe: k.toe ?? 0,
    }
  }
  const neck = key.h !== undefined ? key.h - key.t : key.n ?? 0
  return { key, neck, pa, limbs }
}

const EASE = {
  io: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  in: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  out: (t: number) => Math.sin((t * Math.PI) / 2),
  lin: (t: number) => t,
}

/** monotone cubic Hermite through v0..v3 (segment v1 → v2), non-uniform key spacing h0..h2 */
function hermite(v0: number, v1: number, v2: number, v3: number, h0: number, h1: number, h2: number, u: number): number {
  const d0 = (v1 - v0) / h0
  const d1 = (v2 - v1) / h1
  const d2 = (v3 - v2) / h2
  const tan = (da: number, db: number, ha: number, hb: number) => {
    if (da * db <= 0) return 0
    const m = (da * hb + db * ha) / (ha + hb)
    const lim = 3 * Math.min(Math.abs(da), Math.abs(db))
    return Math.sign(m) * Math.min(Math.abs(m), lim)
  }
  const m1 = tan(d0, d1, h0, h1)
  const m2 = tan(d1, d2, h1, h2)
  const u2 = u * u
  const u3 = u2 * u
  return (2 * u3 - 3 * u2 + 1) * v1 + (u3 - 2 * u2 + u) * h1 * m1 + (-2 * u3 + 3 * u2) * v2 + (u3 - u2) * h1 * m2
}

/** interpolation context for one key pair */
interface Ctx {
  A: KeyRes
  B: KeyRes
  k: number
  bump: number
  /** interpolate a per-key number (ok: key carries a valid value for it; invalid neighbours are clamped) */
  n: (g: (r: KeyRes) => number, ok?: (r: KeyRes) => boolean) => number
  /** same for angles (degrees) */
  an: (g: (r: KeyRes) => number, ok?: (r: KeyRes) => boolean) => number
}

/**
 * 3/4 view: the front-view frame lives in the body's frontal plane (x, y) plus a depth z toward the
 * camera. Turning the camera by `yaw` maps a frontal offset x → x·cos(yaw) and a depth z → z·sin(yaw)
 * on screen (the figure turns to face screen right).
 */
function applyYaw(f: Frame, yaw: number): Frame {
  const cy = Math.cos(yaw * RAD)
  const sy = Math.sin(yaw * RAD)
  const x0 = f.p[0]
  const C = (q: V): V => [x0 + (q[0] - x0) * cy, q[1]]
  const out: Frame = { ...f, S: C(f.S), neckBase: C(f.neckBase), head: C(f.head), yaw }
  for (const name of LIMBS) {
    const l = f[name]
    const arm = isArm(name)
    const root = C(l.root)
    root[0] += (l.zr ?? 0) * sy
    const dm = sub(l.mid, l.root)
    const de = sub(l.end, l.mid)
    const mid: V = [root[0] + dm[0] * cy + l.zm * sy, root[1] + dm[1]]
    const end: V = [mid[0] + de[0] * cy + (l.ze - l.zm) * sy, mid[1] + de[1]]
    const u = sub(mid, root)
    const w = sub(end, mid)
    const lu = len(u)
    const lw = len(w)
    const ua = lu > 0.4 ? angOf(u, l.fc) : l.ua
    const la = lw > 0.4 ? angOf(w, l.fc) : l.la
    out[name] = {
      ...l, root, mid, end, ua, la, ea: l.ea + wrap(la - l.la),
      fu: lu / (arm ? L.upper : L.thigh), fs: lw / (arm ? L.fore : L.shin),
    }
  }
  return out
}

export class Rig {
  front: boolean
  keys: KeyRes[]
  opts: RigOpts
  durs: number[]
  constructor(keys: Key[], front = false, opts: RigOpts = {}) {
    this.front = front
    this.opts = opts
    this.keys = keys.map((k) => resolveKey(k, front))
    this.durs = opts.durs ?? keys.map(() => 500)
  }

  private ctx(i: number, u: number): Ctx {
    const n = this.keys.length
    const A = this.keys[i]
    const B = this.keys[(i + 1) % n]
    if (!this.opts.smooth || n < 2) {
      const k = EASE[B.key.ease ?? 'io'](u)
      return {
        A, B, k, bump: Math.sin(Math.PI * k),
        n: (g) => lerpN(g(A), g(B), k),
        an: (g) => lerpA(g(A), g(B), k),
      }
    }
    const P = this.keys[(i - 1 + n) % n]
    const C = this.keys[(i + 2) % n]
    const d = this.durs
    const h0 = d[(i - 1 + n) % n]
    const h1 = d[i]
    const h2 = d[(i + 1) % n]
    const four = (g: (r: KeyRes) => number, ok?: (r: KeyRes) => boolean) => {
      const v1 = g(A)
      const v2 = g(B)
      const v0 = !ok || ok(P) ? g(P) : v1
      const v3 = !ok || ok(C) ? g(C) : v2
      return [v0, v1, v2, v3]
    }
    return {
      A, B, k: u, bump: Math.sin(Math.PI * u),
      n: (g, ok) => {
        const [v0, v1, v2, v3] = four(g, ok)
        return hermite(v0, v1, v2, v3, h0, h1, h2, u)
      },
      an: (g, ok) => {
        const [v0, v1, v2, v3] = four(g, ok)
        const b = v1 + wrap(v2 - v1)
        const a = v1 + wrap(v0 - v1)
        const c = b + wrap(v3 - b)
        return hermite(a, v1, b, c, h0, h1, h2, u)
      },
    }
  }

  /** key index + fraction for a loop position 0–1 */
  seg(pos: number): [number, number] {
    const total = this.durs.reduce((a, b) => a + b, 0)
    let t = (((pos % 1) + 1) % 1) * total
    let i = 0
    while (i < this.durs.length - 1 && t >= this.durs[i]) {
      t -= this.durs[i]
      i++
    }
    return [i, Math.min(1, t / this.durs[i])]
  }

  /** pose at loop position 0–1 (with arm / head follow-through) */
  at(pos: number): Frame {
    const [i, u] = this.seg(pos)
    const lag = this.opts.lag ?? 0
    const hl = this.opts.headLag ?? 0
    return this.pose(i, u, lag ? this.seg(pos - lag) : undefined, hl ? this.seg(pos - hl) : undefined)
  }

  /** pose between key i and key i+1 (wrapping) at raw fraction u ∈ [0,1] */
  pose(i: number, u: number, armIU?: [number, number], headIU?: [number, number]): Frame {
    const c = this.ctx(i, u)
    const ca = armIU ? this.ctx(armIU[0], armIU[1]) : c
    const ch = headIU ? this.ctx(headIU[0], headIU[1]) : c
    const p: V = [c.n((r) => r.key.p[0]), c.n((r) => r.key.p[1])]
    p[1] -= c.bump * (c.B.key.hop ?? 0)
    const T = c.n((r) => r.key.t)
    const pa = c.n((r) => r.pa)
    const sh = c.n((r) => r.key.sh ?? 0)
    const pz = c.n((r) => r.key.pz ?? 0)
    const bothHeadAbs = ch.A.key.h !== undefined && ch.B.key.h !== undefined
    const headA = bothHeadAbs ? ch.an((r) => r.key.h!, (r) => r.key.h !== undefined) : T + ch.n((r) => r.neck)
    const front = this.front
    return this.build(p, T, pa, sh, pz, headA, (name, root, fc) => {
      const cc = isArm(name) ? ca : c
      const a = cc.A.limbs[name]
      const b = cc.B.limbs[name]
      const arm = isArm(name)
      const sgn = arm ? 1 : -1
      const L_ = (r: KeyRes) => r.limbs[name]
      const fs = cc.n((r) => L_(r).fs)
      const fu = cc.n((r) => L_(r).fu)
      const toe = Math.max(0, cc.n((r) => L_(r).toe))
      const l1 = (arm ? L.upper : L.thigh) * fu
      const l2 = (arm ? L.fore : L.shin) * fs
      let ua: number, bend: number, f = 0, kz = 0, miss = 0
      if (a.ik && b.ik) {
        const isIk = (r: KeyRes) => L_(r).ik
        const t: V = [cc.n((r) => L_(r).t[0], isIk), cc.n((r) => L_(r).t[1], isIk)]
        t[1] -= cc.bump * b.lift
        if (a.ik3 && b.ik3) {
          const s = solveIK3(arm, root, t, cc.n((r) => L_(r).z, isIk), l1, l2, fc, cc.n((r) => L_(r).pole, isIk))
          ua = s.a
          bend = s.b
          f = s.f
          kz = s.k
          miss = s.miss
        } else {
          const s = solveIK(root, t, l1, l2, fc, sgn, b.flip)
          ua = s.ua
          bend = sgn * wrap(s.la - s.ua)
          miss = s.miss
        }
      } else {
        const rel = a.rel && b.rel
        const off = (r: KeyRes) => (rel ? fc * (r.key.t - 180) : 0)
        ua = cc.an((r) => L_(r).ua - off(r)) + (rel ? fc * (T - 180) : 0)
        // interpolate the bend (keeps the joint bending the right way)
        bend = cc.n((r) => sgn * wrap(L_(r).la - L_(r).ua))
        if (front) {
          f = cc.n((r) => L_(r).f)
          kz = cc.n((r) => L_(r).k)
        }
      }
      const la = ua + sgn * bend
      let ea: number
      if (a.eAbs && b.eAbs) {
        const rel = a.rel && b.rel
        const off = (r: KeyRes) => (rel ? fc * (r.key.t - 180) : 0)
        ea = cc.an((r) => L_(r).ea - off(r), (r) => L_(r).eAbs) + (rel ? fc * (T - 180) : 0)
      } else {
        ea = la + cc.an((r) => wrap(L_(r).ea - L_(r).la))
      }
      return computeLimb(name, front, root, ua, bend, f, kz, ea, fc, fs, fu, toe, miss)
    })
  }

  private build(p: V, T: number, pa: number, sh: number, pz: number, headA: number, limb: (n: LimbName, root: V, fc: number) => LimbOut): Frame {
    const { axis, fwd, S } = bodyFrame(p, T)
    const front = this.front
    const pAxis = front ? dir(pa) : axis
    const pFwd = front ? dir(pa - 90) : fwd
    const neckBase = add(add(p, axis, L.torso + 2.6), fwd, front ? 0 : 0.8)
    const hd = dir(headA)
    const hf = dir(headA - 90)
    const head = add(add(neckBase, hd, 9.2), hf, front ? 0 : 1.1)
    const f: Partial<Frame> = { front, p, T, S, axis, fwd, pa: front ? pa : T, pAxis, pFwd, neckBase, head, headA, yaw: 0 }
    for (const name of LIMBS) f[name] = limb(name, limbRoot(name, p, S, fwd, front, pFwd, axis, sh), fcOf(name, front))
    if (front && pz) for (const name of ['armN', 'armF'] as const) f[name] = { ...f[name]!, zr: pz }
    const yaw = front ? this.opts.yaw ?? 0 : 0
    return yaw ? applyYaw(f as Frame, yaw) : (f as Frame)
  }
}
