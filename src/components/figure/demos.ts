import type { DemoKey } from '../../types'
import { add, dir, L, type Key, type LimbKey, type V } from './rig'

export const GROUND = 128
const ANK = GROUND - 4.4 // ankle height with the shoe flat on the floor
const WR = GROUND - 2.4 // wrist height with the palm flat on the floor

export interface Demo {
  keys: Key[]
  /** ms spent moving from key i to key i+1 (last one wraps to key 0) */
  dur: number | number[]
  front?: boolean
  prop?: 'chair' | 'wall' | 'bar'
  /** key shown when not animating (reduced motion / thumbnails) */
  still?: number
  /** draw the head in front of the near arm (hands behind the head) */
  headFront?: boolean
  /** camera framing [x, y, width] (height keeps the 200:154 aspect); default shows the full 0,-14,200,154 stage */
  view?: [number, number, number]
  /** continuous (monotone cubic) interpolation through the keys instead of easing in/out of every key */
  smooth?: boolean
  /** arms trail the body by this loop fraction (follow-through) */
  lag?: number
  /** head trails the body by this loop fraction */
  headLag?: number
  /** front view: camera yaw (deg) → 3/4 view, figure turned toward screen right */
  yaw?: number
  /** faint path traced by the hands over this loop window [from, to] (e.g. one arm circle) */
  trail?: [number, number]
}
const view = (cx: number, w = 142): [number, number, number] => [+Math.max(0, Math.min(200 - w, cx - w / 2)).toFixed(1), +(138 - w * 0.77).toFixed(1), w]

const flat = (x: number, lift?: number): LimbKey => ({ t: [x, ANK], e: 90, lift })
const toes = (x: number, y: number, e = 18, lift?: number): LimbKey => ({ t: [x, y], e, lift })
const palm = (x: number, e = 90): LimbKey => ({ t: [x, WR], e })
const fk = (a: number, b = 0, e?: number): LimbKey => ({ a, b, e })
const k = (p: V, t: number, limbs: Pick<Key, 'armN' | 'armF' | 'legN' | 'legF'>, extra: Partial<Key> = {}): Key => ({
  p, t, ...limbs, ...extra,
})

/* ---------- front-view helpers (aerobics) ---------- */
const AF = GROUND - 5.6 // front-view ankle height with the shoe flat on the floor
/** planted foot in the front view */
const ff = (x: number, lift?: number): LimbKey => ({ t: [x, AF], e: 90, lift })
/** point on the torso: s along hip → shoulder, w across (front view: + = screen right) */
const bodyPt = (p: V, T: number, s: number, w: number): V => add(add(p, dir(T), s), dir(T - 90), w)
/** hands on the hips (front view) */
const onHips = (p: V, T = 180): Pick<Key, 'armN' | 'armF'> => ({
  armN: { t: bodyPt(p, T, 8.5, 10.2), e: 200, flip: true },
  armF: { t: bodyPt(p, T, 8.5, -10.2), e: 200, flip: true },
})
/** hands behind the head, elbows out (front view); flip picks the low-elbow solution */
const atHead = (p: V, T = 180, n = 0, flipN = false, flipF = false): Pick<Key, 'armN' | 'armF'> => {
  const nb = bodyPt(p, T, L.torso + 2.6, 0)
  const hc = add(nb, dir(T + n), 9.6)
  const side = dir(T + n - 90)
  return {
    armN: { t: add(hc, side, 5.2), e: T + n + 30, flip: flipN },
    armF: { t: add(hc, side, -5.2), e: -(T + n) + 30 + 360, flip: flipF },
  }
}
/* ---------- 2.5D front-view helpers ---------- */
/** front-view ankle height when up on the toes (heel raised, toes on the floor) */
const AF_TOE = AF - 4.6 * 0.75
/** toe tap: ball of the foot on the floor, heel up, knee soft and forward */
const tap = (x: number, z = -1): LimbKey => ({ t: [x, AF_TOE], e: 90, toe: 1, z, pole: 0.08 })
/** foot in the air (ankle h above the flat height), relaxed / slightly pointed */
const air = (x: number, h: number, toe = 0.4, z = 0.5): LimbKey => ({ t: [x, AF - h], e: 90, toe, z })
/** clap in front of the chest: upper arms forward and slightly across, forearms up toward the camera, fingers up */
const CLAP: LimbKey = { a: -16, f: 45, k: 85, b: 38, e: 180 }
/** front-view FK arm: abduction a, shoulder flexion f, elbow flexion k (toward the camera), in-plane bend b */
const arm3 = (a: number, f: number, k: number, b = 0): LimbKey => ({ a, f, k, b })
const both = (l: LimbKey): Pick<Key, 'armN' | 'armF'> => ({ armN: l, armF: { ...l } })

/** hip height (front view) that leaves `slack` of give in the longer leg for the given ankle positions,
 *  honouring the pelvis roll pa */
const hipY = (px: number, pa: number, fN: V, fF: V, slack = 0.4): number => {
  const fw = dir(pa - 90)
  let y = -Infinity
  for (const [sd, f] of [[1, fN], [-1, fF]] as const) {
    const dx = f[0] - (px + fw[0] * L.hipW * sd)
    const r = L.thigh + L.shin - slack
    y = Math.max(y, f[1] - fw[1] * L.hipW * sd - Math.sqrt(r * r - dx * dx))
  }
  return +y.toFixed(2)
}
const FLAT = (x: number): V => [x, AF]
/** left ↔ right mirror of a front-view key (x → 200 − x, limbs swapped; FK numbers are already per-side) */
const mxl = (l: LimbKey): LimbKey => (l.t ? { ...l, t: [200 - l.t[0], l.t[1]] } : { ...l })
const mirror = (q: Key): Key => ({
  ...q,
  p: [200 - q.p[0], q.p[1]],
  t: 360 - q.t,
  pa: q.pa !== undefined ? 360 - q.pa : undefined,
  h: q.h !== undefined ? 360 - q.h : undefined,
  n: q.n !== undefined ? -q.n : undefined,
  armN: mxl(q.armF), armF: mxl(q.armN), legN: mxl(q.legF), legF: mxl(q.legN),
})
/** keys for the first half of a symmetric move → full loop (second half mirrored) */
const sym = (half: Key[]): Key[] => [...half, ...half.map(mirror)]

/* ---- 側踏開合 (step jack) ---- */
const SJ_C = hipY(100, 180, FLAT(104.5), FLAT(95.5), 1.4)
const SJ_DOWN: LimbKey = { a: 9, f: 6, k: 22, b: 8 }
const SJ_MID: LimbKey = { a: 84, f: 8, k: 22, b: 18 }
const SJ_UP: LimbKey = { a: 160, f: 6, k: 12, b: 20 }
const stepjackHalf: Key[] = [
  k([100, SJ_C], 180, { armN: SJ_DOWN, armF: SJ_DOWN, legN: ff(104.5), legF: ff(95.5) }, { pa: 180, h: 180 }),
  k([98.4, hipY(98.4, 177.5, FLAT(95.5), FLAT(95.5), 0.9)], 179.2, { armN: SJ_MID, armF: SJ_MID, legN: { t: [113, AF - 4], e: 90, toe: 0.35, z: 0.5 }, legF: ff(95.5) }, { pa: 177.5, sh: 0.6, h: 180.4 }),
  k([102.6, hipY(102.6, 180.6, FLAT(121), FLAT(95.5), 2.4)], 180.4, { armN: SJ_UP, armF: SJ_UP, legN: ff(121), legF: ff(95.5) }, { pa: 180.6, sh: 1.6, h: 179.8 }),
  k([98.6, hipY(98.6, 177.8, FLAT(95.5), FLAT(95.5), 0.9)], 179.3, { armN: SJ_MID, armF: SJ_MID, legN: { t: [111, AF - 3.4], e: 90, toe: 0.3, z: 0.5 }, legF: ff(95.5) }, { pa: 177.8, sh: 0.6, h: 180.4 }),
]

/* ---- 站姿側抬腿 (standing side leg raise) ---- */
const SL_C = hipY(100, 180, FLAT(105), FLAT(95), 1.0)
const SL_S = hipY(97.2, 178.8, FLAT(105), FLAT(95), 0.9)
const SL_U = hipY(97, 183, FLAT(95), FLAT(95), 0.9)
const sidelegHalf: Key[] = [
  k([100, SL_C], 180, { ...onHips([100, SL_C]), legN: ff(105), legF: ff(95) }, { pa: 180, h: 180 }),
  // weight shifts over the standing (left) foot first
  k([97.2, SL_S], 181, { ...onHips([97.2, SL_S], 181), legN: ff(105), legF: ff(95) }, { pa: 178.8, h: 180 }),
  // leg sweeps out: lifted hip hikes, trunk leans a little over the standing leg, foot slightly pointed
  k([97, SL_U], 185, { ...onHips([97, SL_U], 185), legN: { a: 41, b: 2, f: 3, k: 4, e: 112, toe: 0.35 }, legF: ff(95) }, { pa: 183, n: -4 }),
  k([97.2, SL_S], 181, { ...onHips([97.2, SL_S], 181), legN: ff(105), legF: ff(95) }, { pa: 178.8, h: 180 }),
]

/* ---- 站姿側提膝 (standing side crunch) ---- */
const SC_C = hipY(100, 180, FLAT(106), FLAT(94), 1.2)
const SC_U = hipY(97, 188, FLAT(94), FLAT(94), 1.0)
const sidecrunchHalf: Key[] = [
  k([100, SC_C], 180, { ...atHead([100, SC_C]), legN: ff(106), legF: ff(94) }, { pa: 180, n: 0 }),
  // knee drives up and out, hip hikes on that side, ribcage crunches down toward it (elbow to knee)
  k([97, SC_U], 160, { ...atHead([97, SC_U], 160, 6), legN: { a: 92, b: 96, f: 10, k: 6, toe: 0.3 }, legF: ff(94) }, { pa: 188, n: 6 }),
]

/* ---- 擺臀扭腰 (hip sway / hula) ---- */
const HU_N = FLAT(108), HU_F = FLAT(92)
const HU_ARM_HI: LimbKey = { a: 96, f: 10, k: 34, b: 26 }
const HU_ARM_LO: LimbKey = { a: 70, f: 12, k: 26, b: 14 }
const HU_ARM_MID: LimbKey = { a: 82, f: 12, k: 30, b: 20 }
const hulaHalf: Key[] = [
  // hips out to the right: right hip hikes, left knee softens, shoulders stay over the feet
  k([107, hipY(107, 188, HU_N, HU_F, 1.2)], 191, { armN: HU_ARM_HI, armF: HU_ARM_LO, legN: ff(108), legF: ff(92) }, { pa: 188, h: 180 }),
  // through the middle (hips forward): body rises
  k([100, hipY(100, 180, HU_N, HU_F, 0.8)], 180, { armN: HU_ARM_MID, armF: HU_ARM_MID, legN: ff(108), legF: ff(92) }, { pa: 180, h: 180 }),
]

/* ---- 側弓步 (side lunge) ---- */
const SLG_W = hipY(100, 180, FLAT(129), FLAT(71), 0.6)
/** hands clasped in front of the chest: upper arms forward and a little across, forearms up toward the camera */
const SLG_ARM: LimbKey = { a: -16, f: 35, k: 95, b: 34, e: 180, rel: true }
const SLG_CL = (): Pick<Key, 'armN' | 'armF'> => ({ armN: { ...SLG_ARM }, armF: { ...SLG_ARM } })
const sidelungeHalf: Key[] = [
  k([100, SLG_W], 180, { ...SLG_CL(), legN: ff(129), legF: ff(71) }, { pa: 180, n: 0 }),
  // sit into the right leg: knee bends out over the toes, left leg long, hips drop and travel right
  k([115.5, 90], 183, { ...SLG_CL(), legN: { ...ff(129), pole: 1.25 }, legF: ff(71) }, { pa: 181.5, n: -3 }),
]

/* ---- 滑雪跳 (ski hop) ---- */
const SK_LAND = (cx: number): number => hipY(cx, 180, FLAT(cx + 3.6), FLAT(cx - 3.6), 4.2)
// landing on the left: both arms swing forward and across to the right (counter-balance), like a pole plant
const SK_OUT: LimbKey = { a: 34, f: 34, k: 48, b: 10 }
const SK_IN: LimbKey = { a: -14, f: 40, k: 56, b: 22 }
const SK_AIR: LimbKey = { a: 12, f: 8, k: 34, b: 8 }
const skihopHalf: Key[] = [
  // land on the left: knees bend (toward the camera), hips sink and lean into the landing, poles planted
  k([88, SK_LAND(88)], 182.5, { armN: SK_OUT, armF: SK_IN, legN: { ...ff(91.6), pole: 0.1 }, legF: { ...ff(84.4), pole: 0.1 } }, { pa: 181, n: -2.5 }),
  // push off: body rises and travels right, feet tuck up, arms swing back
  k([100, 63.6], 180, { armN: SK_AIR, armF: SK_AIR, legN: { t: [103.6, AF - 7], e: 90, toe: 0.45, z: -1, pole: 0.1 }, legF: { t: [96.4, AF - 7], e: 90, toe: 0.45, z: -1, pole: 0.1 } }, { pa: 180, n: 0 }),
]

/* ---- 站姿側彎 (standing side bend) ---- */
const SB2 = hipY(100, 180, FLAT(106), FLAT(94), 1.1)
const SB3 = hipY(103, 180, FLAT(106), FLAT(94), 1.0)

/* ---- 開合跳 (jumping jack) ---- */
const JJ_IN = hipY(100, 180, FLAT(104.6), FLAT(95.4), 3.2)
const JJ_OUT = hipY(100, 180, FLAT(117), FLAT(83), 3.6)
const JJ_DOWN: LimbKey = { a: 8, f: 4, k: 14, b: 6 }
const JJ_UP: LimbKey = { a: 166, f: 4, k: 8, b: 14 }

/* ---------- shared poses (side view, facing right) ---------- */
const STAND = k([98, 72.2], 180, { armN: fk(7, 14), armF: fk(3, 12), legN: flat(100), legF: flat(97) }, { n: 0 })
const SQUAT = k([88.5, 98.5], 141, { armN: fk(88, 4), armF: fk(85, 4), legN: flat(100), legF: flat(97) }, { n: 22 })
// high plank, hands under shoulders, on the toes
const plankHigh = (hx: number): Key =>
  k([92, 100.6], 108, { armN: palm(hx), armF: palm(hx - 3), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 4 })
const CROUCH = k([90, 104.5], 117, { armN: palm(121), armF: palm(118), legN: flat(99, 7), legF: flat(96, 7) }, { n: 32 })
// lying on the back, head to the left
const LIE = (arms: Pick<Key, 'armN' | 'armF'>, feetX = 130): Key =>
  k([95, 121.4], 271.4, { ...arms, legN: flat(feetX), legF: flat(feetX - 3) }, { n: -2 })
const CROSSED = { armN: { a: 34, b: 134, fs: 0.38, rel: true }, armF: { a: 30, b: 130, fs: 0.38, rel: true } }
const BEHIND_HEAD = { armN: { a: 150, b: 117, fu: 0.7, fs: 0.63, rel: true }, armF: { a: 160, b: 112, fu: 0.62, fs: 0.6, rel: true } }


/* ---- 手臂繞圈 (arm circles, 3/4 view) ---- */
const ARM_YAW = 45
// big circles sweep the hand 44° forward of the T: at 45° yaw the near arm would point straight at the camera
const AC_YAW = 30
const AC_PER = 12 // keys per circle
const AC_STEP = 92 // ms per key → 1.1 s per circle
const AC_R = 44 // cone half-angle at the shoulder: hand ≈ 39 units (≈ 65 cm) out → circle radius ≈ 27 units ≈ 45 cm
const AC_STAND = hipY(100, 180, FLAT(108), FLAT(92), 1.3)
function armCircleKeys(): Key[] {
  const keys: Key[] = []
  const n = AC_PER * 4
  const R = (AC_R * Math.PI) / 180
  for (let i = 0; i < 2 * n; i++) {
    // forward circles: hand goes top → front → bottom → back; then the same path in reverse
    const ph = (i < n ? i : 2 * n - i) / AC_PER
    const t = ph * Math.PI * 2
    const c = Math.cos(t)
    const sn = Math.sin(t)
    // exact cone around the T-pose axis: [out, down, forward]
    const d = [Math.cos(R), -Math.sin(R) * c, Math.sin(R) * sn]
    const a = (Math.atan2(d[0], d[1]) * 180) / Math.PI
    const f = (Math.asin(d[2]) * 180) / Math.PI
    const arm: LimbKey = { a, f, k: 4, b: 3, e: a }
    // knees give a little as the hands sweep down, shoulders shrug up at the top and roll forward in front
    const bob = 0.7 * (1 - c) * 0.5
    keys.push(
      k([100, AC_STAND + bob], 180, { armN: { ...arm }, armF: { ...arm }, legN: ff(108), legF: ff(92) }, {
        pa: 180,
        sh: 0.25 + 0.75 * (1 + c),
        pz: 1.8 * sn,
        h: 180,
      }),
    )
  }
  return keys
}

/* ---- 直拳 / 上勾拳 (3/4 view fighter stance) ---- */
/** hip height for planted feet given as [x, y, depth] (3/4 / front rig) */
const hipYz = (px: number, fN: [number, number, number], fF: [number, number, number], slack: number): number => {
  let y = -Infinity
  for (const [sd, f] of [[1, fN], [-1, fF]] as const) {
    const d = Math.hypot(f[0] - (px + L.hipW * sd), f[2])
    const r = L.thigh + L.shin - slack
    y = Math.max(y, f[1] - Math.sqrt(r * r - d * d))
  }
  return +y.toFixed(2)
}
// orthodox stance: left (far, N) foot forward, right (near, F) foot back with the heel a little up
const BX_N: LimbKey = { t: [104.4, AF], z: 11, e: 90, pole: 0.12 }
const BX_F: LimbKey = { t: [95.4, AF - 1.2], z: -10, e: 90, pole: 0.12 }
const BX_Y = hipYz(100, [104.4, AF, 11], [95.4, AF - 1.2, -10], 3.2)
const GUARD: LimbKey = { a: -4, f: 18, k: 138, b: -12 }
const JAB: LimbKey = { a: -9, f: 86, k: 4, b: 2 }
const UP_LOAD: LimbKey = { a: 4, f: 8, k: 96, b: 14 }
const UP_HIT: LimbKey = { a: -10, f: 62, k: 94, b: -8 }
const bx = (p: V, t: number, armN: LimbKey, armF: LimbKey, extra: Partial<Key> = {}): Key =>
  k(p, t, { armN: { ...armN }, armF: { ...armF }, legN: BX_N, legF: BX_F }, { pa: 180, h: 180, ...extra })

export const DEMOS: Record<DemoKey, Demo> = {
  squat: { view: view(108, 170), keys: [STAND, SQUAT], dur: [950, 850], still: 1 },

  pushup: {
    view: view(90.6),
    keys: [
      plankHigh(120),
      k([93.5, 112.4], 94.5, { armN: palm(120), armF: palm(117), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 6 }),
    ],
    dur: [850, 750],
  },

  diamond: {
    view: view(91.4),
    keys: [
      k([92, 100.4], 108, { armN: palm(115), armF: palm(113), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 4 }),
      k([95, 112.6], 94.5, { armN: palm(115), armF: palm(113), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 6 }),
    ],
    dur: [950, 800],
  },

  lunge: {
    view: view(110, 170),
    keys: [
      k([86, 72.2], 180, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(88), legF: flat(85) }, { n: 0 }),
      // front foot lifts and travels forward
      k([94, 74], 179, { armN: fk(-30, 108), armF: fk(-26, 104), legN: { t: [104, 112], e: 96 }, legF: toes(97, 115.2, 32) }, { n: 0, ease: 'in' }),
      // bottom: both knees ~90°, torso upright
      k([108, 98.5], 178, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(134), legF: toes(97, 115.2, 32) }, { n: 0, ease: 'out' }),
      k([108, 98.5], 178, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(134), legF: toes(97, 115.2, 32) }, { n: 0 }),
      k([94, 74], 179, { armN: fk(-30, 108), armF: fk(-26, 104), legN: { t: [104, 112], e: 96 }, legF: toes(97, 115.2, 32) }, { n: 0, ease: 'in' }),
    ],
    dur: [380, 360, 220, 420, 360],
    still: 2,
  },

  plank: {
    view: view(91.5),
    keys: [
      k([92.6, 108.6], 96.9, { armN: { t: [140, WR + 0.2], e: 92 }, armF: { t: [137, WR + 0.2], e: 92 }, legN: toes(43.5, 114.8, 20), legF: toes(42, 114.8, 20) }, { n: 8 }),
      k([92.6, 107.7], 97.4, { armN: { t: [140, WR + 0.2], e: 92 }, armF: { t: [137, WR + 0.2], e: 92 }, legN: toes(43.5, 114.8, 20), legF: toes(42, 114.8, 20) }, { n: 9 }),
    ],
    dur: 1700,
  },

  burpee: {
    keys: [
      STAND,
      CROUCH,
      { ...plankHigh(121), legN: toes(43.5, 114.6, 18, 9), legF: toes(42, 114.6, 18, 9) },
      CROUCH,
      k([100, 59], 180, { armN: fk(162, 12), armF: fk(156, 12), legN: fk(4, 6, 24), legF: fk(1, 6, 22) }, { n: 2, ease: 'out' }),
    ],
    dur: [420, 330, 340, 300, 380],
    still: 2,
  },

  climber: {
    view: view(89),
    keys: [
      k([92, 100], 108, { armN: palm(121), armF: palm(118), legN: toes(94, 115, 24, 6), legF: toes(42, 114.6, 18, 6) }, { n: 6 }),
      k([92, 100], 108, { armN: palm(121), armF: palm(118), legN: toes(43.5, 114.6, 18, 6), legF: toes(92, 115, 24, 6) }, { n: 6 }),
    ],
    dur: 300,
  },

  bridge: {
    view: view(87),
    keys: [
      k([95, 121.4], 271.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 272 }),
      k([92.4, 109.6], 293.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 270 }),
      k([92.4, 109.6], 293.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 270 }),
    ],
    dur: [800, 450, 800],
    still: 1,
  },

  situp: {
    view: view(93.4),
    keys: [LIE(CROSSED), k([95, 119.6], 166, { ...CROSSED, legN: flat(130), legF: flat(127) }, { n: -12, hop: 1.5 })],
    dur: [950, 900],
    still: 1,
  },

  crunch: {
    view: view(92.4),
    keys: [LIE(CROSSED, 128), k([95, 121.4], 243, { ...CROSSED, legN: flat(128), legF: flat(125) }, { n: -14 })],
    dur: [700, 650],
    still: 1,
  },

  // 開合跳: land soft on every beat (knees bend toward the camera), arms trail the legs a little
  jack: {
    front: true,
    smooth: true,
    lag: 0.05,
    headLag: 0.02,
    keys: [
      k([100, JJ_IN], 180, { armN: JJ_DOWN, armF: JJ_DOWN, legN: ff(104.6), legF: ff(95.4) }, { pa: 180, h: 180 }),
      k([100, 64.5], 180, { armN: { a: 90, f: 4, k: 10, b: 10 }, armF: { a: 90, f: 4, k: 10, b: 10 }, legN: { t: [111.5, AF - 6], e: 90, toe: 0.5, z: 0 }, legF: { t: [88.5, AF - 6], e: 90, toe: 0.5, z: 0 } }, { pa: 180, sh: 0.8, h: 180 }),
      k([100, JJ_OUT], 180, { armN: JJ_UP, armF: JJ_UP, legN: ff(117), legF: ff(83) }, { pa: 180, sh: 1.8, h: 180 }),
      k([100, 64.5], 180, { armN: { a: 90, f: 4, k: 10, b: 10 }, armF: { a: 90, f: 4, k: 10, b: 10 }, legN: { t: [111.5, AF - 6], e: 90, toe: 0.5, z: 0 }, legF: { t: [88.5, AF - 6], e: 90, toe: 0.5, z: 0 } }, { pa: 180, sh: 0.8, h: 180 }),
    ],
    dur: [190, 170, 190, 170],
    still: 2,
  },

  superman: {
    headFront: true,
    view: view(93.2, 158),
    keys: [
      k([90, 121], 91, { armN: fk(85.5, 0, 92), armF: fk(86, 0, 92), legN: fk(-86.5, 0, -66), legF: fk(-87.5, 0, -66) }, { n: 7 }),
      k([90, 121], 100, { armN: fk(103, 0, 106), armF: fk(101, 0, 104), legN: fk(-101, 0, -80), legF: fk(-99, 0, -78) }, { n: 0 }),
      k([90, 121], 100, { armN: fk(103, 0, 106), armF: fk(101, 0, 104), legN: fk(-101, 0, -80), legF: fk(-99, 0, -78) }, { n: 0 }),
    ],
    dur: [850, 500, 850],
    still: 1,
  },

  sideplank: {
    view: view(89),
    front: true,
    keys: [
      k([92, 104], 102, { armN: { a: 0, b: 90, fs: 0.45, e: 90 }, armF: fk(180, 0), legN: { t: [43, 122.6] }, legF: { t: [41.4, 113.4] } }, { n: 2 }),
      k([92, 103], 101.4, { armN: { a: 0, b: 90, fs: 0.45, e: 90 }, armF: fk(178, 0), legN: { t: [43, 122.6] }, legF: { t: [41.4, 113.4] } }, { n: 3 }),
    ],
    dur: 1500,
  },

  dips: {
    view: view(83),
    prop: 'chair',
    keys: [
      k([82, 91], 179, { armN: { t: [73.5, 93.6], e: 90 }, armF: { t: [71, 93.6], e: 90 }, legN: flat(122), legF: flat(119) }, { n: 0 }),
      k([81.5, 106.5], 176, { armN: { t: [73.5, 93.6], e: 90 }, armF: { t: [71, 93.6], e: 90 }, legN: flat(122), legF: flat(119) }, { n: 2 }),
    ],
    dur: [900, 800],
    still: 1,
  },

  highknees: {
    view: view(102, 170),
    keys: [
      k([99, 66.6], 179, { armN: fk(4, 92), armF: fk(4, 92), legN: fk(-2, 8, 60), legF: fk(6, 10, 70) }, { n: 0 }),
      k([99, 65.2], 178, { armN: fk(-38, 95), armF: fk(48, 92), legN: fk(92, 104, 112), legF: fk(-3, 6, 52) }, { n: 0 }),
      k([99, 66.6], 179, { armN: fk(4, 92), armF: fk(4, 92), legN: fk(6, 10, 70), legF: fk(-2, 8, 60) }, { n: 0 }),
      k([99, 65.2], 178, { armN: fk(48, 92), armF: fk(-38, 95), legN: fk(-3, 6, 52), legF: fk(92, 104, 112) }, { n: 0 }),
    ],
    dur: 150,
    still: 1,
  },

  wallsit: {
    view: view(82.2, 150),
    prop: 'wall',
    keys: [
      k([73, 98.4], 180, { armN: { t: [94, 90.6], e: 98 }, armF: { t: [91, 90.6], e: 98 }, legN: flat(99.5), legF: flat(97) }, { n: 0 }),
      k([73, 98.4], 179.2, { armN: { t: [94.4, 90.6], e: 98 }, armF: { t: [91.4, 90.6], e: 98 }, legN: flat(99.5), legF: flat(97) }, { n: -1.5 }),
    ],
    dur: 1500,
  },

  pullup: {
    prop: 'bar',
    front: true,
    keys: [
      k([100, 72.2], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 4, b: 0, fs: 0.7 }, legF: { a: 4, b: 0, fs: 0.7 } }, { n: 0 }),
      k([100, 40], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 6, b: 0, fs: 0.7 }, legF: { a: 6, b: 0, fs: 0.7 } }, { n: 0 }),
      k([100, 40], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 6, b: 0, fs: 0.7 }, legF: { a: 6, b: 0, fs: 0.7 } }, { n: 0 }),
    ],
    dur: [900, 300, 1000],
    still: 1,
  },

  jumpsquat: {
    keys: [
      STAND,
      SQUAT,
      k([99, 54], 178, { armN: fk(-28, 12), armF: fk(-32, 12), legN: fk(3, 4, 26), legF: fk(0, 4, 24) }, { n: 0, ease: 'out' }),
    ],
    dur: [480, 260, 380],
    still: 2,
  },

  birddog: {
    view: view(101.8, 150),
    keys: [
      k([95, 96.8], 104, { armN: fk(0, 0, 90), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-2, 90, -64) }, { n: 6 }),
      k([95, 96.8], 103, { armN: fk(95, 0, 96), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-88, 0, 0) }, { n: 4 }),
      k([95, 96.8], 103, { armN: fk(95, 0, 96), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-88, 0, 0) }, { n: 4 }),
      k([95, 96.8], 104, { armN: fk(0, 0, 90), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-2, 90, -64) }, { n: 6 }),
      k([95, 96.8], 103, { armN: fk(0, 0, 90), armF: fk(95, 0, 96), legN: fk(-88, 0, 0), legF: fk(-2, 90, -64) }, { n: 4 }),
      k([95, 96.8], 103, { armN: fk(0, 0, 90), armF: fk(95, 0, 96), legN: fk(-88, 0, 0), legF: fk(-2, 90, -64) }, { n: 4 }),
    ],
    dur: [650, 700, 650, 650, 700, 650],
    still: 1,
  },

  bicycle: {
    view: view(96.4),
    headFront: true,
    keys: [
      k([95, 121.4], 246, { ...BEHIND_HEAD, legN: fk(195, 100), legF: fk(128, 4) }, { n: -14 }),
      k([95, 121.4], 246, { ...BEHIND_HEAD, legN: fk(128, 4), legF: fk(195, 100) }, { n: -14 }),
    ],
    dur: 520,
  },
  /* ================= 瘦身操 (aerobics) ================= */

  // 原地踏步: one foot always planted, opposite arm swings with the lifted knee
  march: {
    view: view(102, 170),
    keys: [
      k([98, 72.2], 180, { armN: fk(6, 50), armF: fk(6, 50), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 71.2], 180, { armN: fk(-30, 75), armF: fk(40, 85), legN: fk(70, 86), legF: flat(97) }, { n: 0 }),
      k([98, 72.2], 180, { armN: fk(6, 50), armF: fk(6, 50), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 71.2], 180, { armN: fk(40, 85), armF: fk(-30, 75), legN: flat(100), legF: fk(70, 86) }, { n: 0 }),
    ],
    dur: 280,
    still: 1,
  },

  // 後勾腿: light jog, heel kicks up to the glute
  buttkick: {
    view: view(100, 170),
    keys: [
      k([98, 71.6], 179, { armN: fk(6, 88), armF: fk(6, 88), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 70.2], 178, { armN: fk(-28, 92), armF: fk(38, 92), legN: fk(4, 158), legF: flat(97) }, { n: 0, hop: 2.2 }),
      k([98, 71.6], 179, { armN: fk(6, 88), armF: fk(6, 88), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 70.2], 178, { armN: fk(38, 92), armF: fk(-28, 92), legN: flat(100), legF: fk(4, 158) }, { n: 0, hop: 2.2 }),
    ],
    dur: 210,
    still: 1,
  },

  // 踢腿拍手: arms swing down from overhead to clap at the kicking leg
  kickclap: {
    view: view(110, 188),
    keys: [
      k([96, 72.2], 180, { armN: fk(172, 8), armF: fk(168, 8), legN: flat(98), legF: flat(95) }, { n: 0 }),
      k([95, 72.6], 177, { armN: fk(44, 4), armF: fk(40, 4), legN: fk(78, 2), legF: flat(95) }, { n: 4, ease: 'out' }),
      k([96, 72.2], 180, { armN: fk(172, 8), armF: fk(168, 8), legN: flat(98), legF: flat(95) }, { n: 0 }),
      k([95, 72.6], 177, { armN: fk(44, 4), armF: fk(40, 4), legN: flat(98), legF: fk(78, 2) }, { n: 4, ease: 'out' }),
    ],
    dur: [420, 380, 420, 380],
    still: 1,
  },

  // 直拳連擊 (3/4 view): fighter stance, fists up by the chin, alternate straight punches and snap back to guard
  punch: {
    view: view(104, 150),
    front: true,
    yaw: ARM_YAW,
    keys: [
      bx([100, BX_Y], 180, GUARD, GUARD),
      // jab with the lead (far) hand: shoulder rolls up, slight lean into it
      bx([100.6, BX_Y], 178.5, JAB, GUARD, { ease: 'out', sh: 0.8, h: 180.8 }),
      bx([100, BX_Y], 180, GUARD, GUARD),
      // cross with the rear (near) hand: back heel turns up, hips drift forward
      bx([101.6, BX_Y + 0.3], 181.5, GUARD, JAB, { ease: 'out', sh: 0.8, h: 179.2 }),
    ],
    dur: [170, 240, 170, 240],
    still: 3,
  },

  // 上勾拳 (3/4 view): dip the knees, drive the fist up to chin height in front of the face
  uppercut: {
    view: view(104, 150),
    front: true,
    yaw: ARM_YAW,
    keys: [
      bx([100, BX_Y], 180, GUARD, GUARD),
      bx([100.4, BX_Y + 5.5], 178, UP_LOAD, GUARD, { h: 180.6 }),
      bx([100.8, BX_Y - 1], 182, UP_HIT, GUARD, { ease: 'out', sh: 1, h: 179.5 }),
      bx([100, BX_Y], 180, GUARD, GUARD),
      bx([100.4, BX_Y + 5.5], 182, GUARD, UP_LOAD, { h: 179.4 }),
      bx([100.8, BX_Y - 1], 178, GUARD, UP_HIT, { ease: 'out', sh: 1, h: 180.5 }),
    ],
    dur: [200, 170, 260, 200, 170, 260],
    still: 5,
  },

  // 手臂繞圈 (3/4 view): arms straight out at shoulder height, hands draw small circles (4 forward, 4 back);
  // the circle plane faces sideways so the camera sees it as an ellipse
  armcircle: {
    view: view(100, 176),
    front: true,
    yaw: AC_YAW,
    smooth: true,
    headLag: 0.01,
    keys: armCircleKeys(),
    dur: AC_STEP,
    still: 0,
    trail: [0, 1 / 8],
  },

  // 側踏開合 (low-impact jack): weight onto one foot, the other steps out wide with soft knees while the
  // arms sweep overhead; back in, other side
  stepjack: {
    front: true,
    smooth: true,
    lag: 0.045,
    headLag: 0.02,
    keys: sym(stepjackHalf),
    dur: 190,
    still: 2,
  },

  // 側併步: step out → weight rolls over onto that foot (hips travel, unloaded hip drops, ribcage counter-leans)
  // → the other foot closes in and taps (heel up, knee soft) while the hands clap; both knees bounce on
  // every beat; arms open low on the step, clap on the tap and trail the body slightly
  steptouch: {
    view: view(100, 166),
    front: true,
    smooth: true,
    lag: 0.035,
    headLag: 0.02,
    keys: [
      // tap at the left: weight on the left (F) foot, right toe taps in, clap
      k([89.5, 72.6], 178.5, { ...both(CLAP), legN: tap(95.5), legF: ff(86.5) }, { pa: 175.5, sh: 1.1, h: 180.6 }),
      // right foot travels out, body rises and drifts right, arms start to open
      k([95.5, 71.2], 179.5, { ...both(arm3(30, 24, 50, 16)), legN: air(106, 5), legF: ff(86.5) }, { pa: 179, sh: 0.4, h: 180.3 }),
      // step right: foot lands flat, knees dip, weight transfers, arms open low
      k([103, 72.9], 180.5, { ...both(arm3(40, 10, 40, 14)), legN: ff(113.5), legF: ff(86.5) }, { pa: 181, sh: 0, h: 179.7 }),
      // left foot peels off and closes in, hips over the right foot
      k([108.5, 71.2], 181, { ...both(arm3(16, 30, 62, 22)), legN: ff(113.5), legF: air(98, 4, 0.55, -0.5) }, { pa: 182.5, sh: 0.4, h: 179.5 }),
      // tap at the right (mirror of key 0)
      k([110.5, 72.6], 181.5, { ...both(CLAP), legN: ff(113.5), legF: tap(104.5) }, { pa: 184.5, sh: 1.1, h: 179.4 }),
      k([104.5, 71.2], 180.5, { ...both(arm3(30, 24, 50, 16)), legN: ff(113.5), legF: air(94, 5) }, { pa: 181, sh: 0.4, h: 179.7 }),
      k([97, 72.9], 179.5, { ...both(arm3(40, 10, 40, 14)), legN: ff(113.5), legF: ff(86.5) }, { pa: 179, sh: 0, h: 180.3 }),
      k([91.5, 71.2], 179, { ...both(arm3(16, 30, 62, 22)), legN: air(102, 4, 0.55, -0.5), legF: ff(86.5) }, { pa: 177.5, sh: 0.4, h: 180.5 }),
    ],
    dur: 225,
    still: 2,
  },

  // 站姿側抬腿: hands on hips; shift the weight over the standing foot, sweep the straight leg out to the side
  sideleg: {
    view: view(100, 166),
    front: true,
    smooth: true,
    headLag: 0.02,
    keys: sym(sidelegHalf),
    dur: [300, 360, 420, 300, 300, 360, 420, 300],
    still: 2,
  },

  // 站姿側提膝 (standing side crunch): knee lifts out to the side, same-side elbow crunches down to it
  sidecrunch: {
    view: view(100, 170),
    front: true,
    smooth: true,
    lag: 0.02,
    keys: sym(sidecrunchHalf),
    dur: [420, 380, 420, 380],
    still: 1,
  },

  // 擺臀扭腰: hips circle side → front → side under steady shoulders, knees take turns softening, arms wave
  hula: {
    view: view(100, 166),
    front: true,
    smooth: true,
    lag: 0.07,
    headLag: 0.03,
    keys: [
      hulaHalf[0],
      hulaHalf[1],
      mirror(hulaHalf[0]),
      // through the middle (hips back): body sinks a touch
      k([100, hipY(100, 180, HU_N, HU_F, 1.6)], 180, { armN: HU_ARM_MID, armF: HU_ARM_MID, legN: ff(108), legF: ff(92) }, { pa: 180, h: 180 }),
    ],
    dur: 300,
    still: 0,
  },

  // 側弓步: wide stance, sit into one leg (knee out over the toes) with the other long, hands clasped
  sidelunge: {
    view: view(100, 162),
    front: true,
    smooth: true,
    lag: 0.02,
    keys: [sidelungeHalf[0], sidelungeHalf[1], { ...sidelungeHalf[1] }, sidelungeHalf[0], mirror(sidelungeHalf[1]), { ...mirror(sidelungeHalf[1]) }],
    dur: [560, 260, 520, 560, 260, 520],
    still: 1,
  },

  // 滑雪跳: feet together, spring side to side, land soft, arms swing like ski poles
  skihop: {
    view: view(100, 176),
    front: true,
    smooth: true,
    lag: 0.04,
    headLag: 0.02,
    keys: sym(skihopHalf),
    dur: [210, 190, 210, 190],
    still: 0,
  },

  // 站姿側彎: one arm reaches over the head; the ribcage bends while the pelvis stays level and the hips
  // push out the other way
  sidebend: {
    front: true,
    smooth: true,
    lag: 0.012,
    headLag: 0.01,
    keys: [
      k([100, SB2], 180, { ...onHips([100, SB2]), legN: ff(106), legF: ff(94) }, { pa: 180, n: 0 }),
      // arm sweeps up and out to the side (elbow soft) as the bend begins
      k([101.2, SB3], 184, { armN: { a: 112, b: 16, rel: true }, armF: onHips([101.2, SB3], 184).armF, legN: ff(106), legF: ff(94) }, { pa: 180, n: -2 }),
      k([103, SB3], 198, { armN: { a: 176, b: 18, rel: true }, armF: onHips([103, SB3], 198).armF, legN: ff(106), legF: ff(94) }, { pa: 180.5, n: -6 }),
      k([103.2, SB3], 200, { armN: { a: 178, b: 18, rel: true }, armF: onHips([103.2, SB3], 200).armF, legN: ff(106), legF: ff(94) }, { pa: 180.5, n: -7 }),
      k([101.4, SB3], 186, { armN: { a: 118, b: 18, rel: true }, armF: onHips([101.4, SB3], 186).armF, legN: ff(106), legF: ff(94) }, { pa: 180, n: -2 }),
      k([100, SB2], 180, { ...onHips([100, SB2]), legN: ff(106), legF: ff(94) }, { pa: 180, n: 0 }),
      k([98.8, SB3], 176, { armN: onHips([98.8, SB3], 176).armN, armF: { a: 112, b: 16, rel: true }, legN: ff(106), legF: ff(94) }, { pa: 180, n: 2 }),
      k([97, SB3], 162, { armN: onHips([97, SB3], 162).armN, armF: { a: 176, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { pa: 179.5, n: 6 }),
      k([96.8, SB3], 160, { armN: onHips([96.8, SB3], 160).armN, armF: { a: 178, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { pa: 179.5, n: 7 }),
      k([98.6, SB3], 174, { armN: onHips([98.6, SB3], 174).armN, armF: { a: 118, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { pa: 180, n: 2 }),
    ],
    dur: [500, 500, 800, 450, 450, 500, 500, 800, 450, 450],
    still: 2,
  },

}
