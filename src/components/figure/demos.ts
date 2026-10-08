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
/** front-view hip height that keeps both legs (almost) straight for the given foot x positions */
const standY = (px: number, xN: number, xF: number, slack = 0.4, T = 180): number => {
  const w = 4.6 * Math.sin((T - 90) * (Math.PI / 180))
  const reach = 52.5 - slack
  const dx = Math.max(Math.abs(xN - (px + w)), Math.abs(xF - (px - w)))
  return +(AF - Math.sqrt(reach * reach - dx * dx)).toFixed(1)
}
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
/** hands clasped in front of the body (front view) at height s along the torso */
const clasp = (p: V, s = 16, T = 180): Pick<Key, 'armN' | 'armF'> => ({
  armN: { t: bodyPt(p, T, s, 1.4), flip: true },
  armF: { t: bodyPt(p, T, s, -1.4), flip: true },
})

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

const SC0 = standY(100, 106, 94)
const SC1 = standY(96.5, 106, 93.5)
const Q = { n: false, f: false }
const SB = standY(101.5, 106, 94, 0.8) // side-bend hip height (hips shift slightly)

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

  jack: {
    front: true,
    keys: [
      k([100, 71.2], 180, { armN: fk(6, 8), armF: fk(6, 8), legN: fk(1.5, 2), legF: fk(1.5, 2) }, { n: 0, hop: 6 }),
      k([100, 71.9], 180, { armN: fk(166, 12), armF: fk(166, 12), legN: fk(16, 8), legF: fk(16, 8) }, { n: 0, hop: 6 }),
    ],
    dur: 360,
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

  // 直拳連擊: fighter stance, alternating straight punches back to the guard
  punch: {
    view: view(104, 160),
    keys: [
      k([95, 74.6], 177, { armN: fk(22, 138), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 4 }),
      k([95.8, 74.6], 175, { armN: fk(86, 2), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 6, ease: 'out' }),
      k([95, 74.6], 177, { armN: fk(22, 138), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 4 }),
      k([96.6, 74.8], 173, { armN: fk(22, 138), armF: fk(85, 2), legN: flat(107), legF: flat(84) }, { n: 8, ease: 'out' }),
    ],
    dur: [170, 240, 170, 240],
    still: 1,
  },

  // 上勾拳: dip the knees, drive the fist up to chin height
  uppercut: {
    view: view(104, 160),
    keys: [
      k([95, 74.6], 177, { armN: fk(22, 138), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 4 }),
      k([95, 79], 174, { armN: fk(0, 95), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 8 }),
      k([95.6, 74], 178, { armN: fk(76, 70), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 2, ease: 'out' }),
      k([95, 74.6], 177, { armN: fk(22, 138), armF: fk(18, 140), legN: flat(107), legF: flat(84) }, { n: 4 }),
      k([95, 79], 174, { armN: fk(22, 138), armF: fk(-2, 95), legN: flat(107), legF: flat(84) }, { n: 8 }),
      k([95.6, 74], 178, { armN: fk(22, 138), armF: fk(74, 70), legN: flat(107), legF: flat(84) }, { n: 2, ease: 'out' }),
    ],
    dur: [200, 170, 260, 200, 170, 260],
    still: 2,
  },

  // 手臂繞圈: big forward circles (back → up → forward → down)
  armcircle: {
    view: view(100, 188),
    keys: [
      k([98, 72.2], 180, { armN: fk(4, 4), armF: fk(-6, 4), legN: flat(100), legF: flat(97) }, { n: 0, ease: 'lin' }),
      k([98, 72.0], 180, { armN: fk(274, 4), armF: fk(264, 4), legN: flat(100), legF: flat(97) }, { n: 0, ease: 'lin' }),
      k([98, 71.8], 180, { armN: fk(184, 4), armF: fk(174, 4), legN: flat(100), legF: flat(97) }, { n: 0, ease: 'lin' }),
      k([98, 72.0], 180, { armN: fk(94, 4), armF: fk(84, 4), legN: flat(100), legF: flat(97) }, { n: 0, ease: 'lin' }),
    ],
    dur: 300,
    still: 2,
  },

  // 側踏開合 (low-impact jack): step out to the side while the arms sweep overhead
  stepjack: {
    front: true,
    keys: [
      k([100, standY(100, 105, 95)], 180, { armN: fk(10, 10), armF: fk(10, 10), legN: ff(105), legF: ff(95, 4) }, { n: 0 }),
      k([102, standY(102, 122, 95, 0.8)], 180, { armN: fk(158, 14), armF: fk(158, 14), legN: ff(122, 4), legF: ff(95) }, { n: 0 }),
      k([100, standY(100, 105, 95)], 180, { armN: fk(10, 10), armF: fk(10, 10), legN: ff(105, 4), legF: ff(95) }, { n: 0 }),
      k([98, standY(98, 105, 78, 0.8)], 180, { armN: fk(158, 14), armF: fk(158, 14), legN: ff(105), legF: ff(78, 4) }, { n: 0 }),
    ],
    dur: 340,
    still: 1,
  },

  // 側併步: step wide, bring the other foot in to tap, clap; travel back and forth
  steptouch: {
    view: view(100, 166),
    front: true,
    keys: [
      k([91, standY(91, 95.5, 86.5)], 180, { ...clasp([91, standY(91, 95.5, 86.5)], 16), legN: ff(95.5, 4), legF: ff(86.5) }, { n: 0 }),
      k([100, standY(100, 115, 86.5, 1)], 180, { armN: fk(62, 18), armF: fk(62, 18), legN: ff(115, 4), legF: ff(86.5) }, { n: 0 }),
      k([109, standY(109, 113.5, 104.5)], 180, { ...clasp([109, standY(109, 113.5, 104.5)], 16), legN: ff(113.5), legF: ff(104.5, 4) }, { n: 0 }),
      k([100, standY(100, 113.5, 85, 1)], 180, { armN: fk(62, 18), armF: fk(62, 18), legN: ff(113.5), legF: ff(85, 4) }, { n: 0 }),
    ],
    dur: 380,
    still: 1,
  },

  // 站姿側抬腿: hands on hips, leg lifts straight out to the side
  sideleg: {
    view: view(100, 166),
    front: true,
    keys: [
      k([100, standY(100, 105, 95)], 180, { ...onHips([100, standY(100, 105, 95)]), legN: ff(105), legF: ff(95) }, { n: 0 }),
      k([98, standY(98, 105, 94.5)], 184, { ...onHips([98, standY(98, 105, 94.5)], 184), legN: { a: 42, b: 0, e: 118 }, legF: ff(94.5) }, { n: -3 }),
      k([100, standY(100, 105, 95)], 180, { ...onHips([100, standY(100, 105, 95)]), legN: ff(105), legF: ff(95) }, { n: 0 }),
      k([102, standY(102, 105.5, 95)], 176, { ...onHips([102, standY(102, 105.5, 95)], 176), legN: ff(105.5), legF: { a: 42, b: 0, e: 118 } }, { n: 3 }),
    ],
    dur: 480,
    still: 1,
  },

  // 站姿側提膝 (standing side crunch): knee lifts out to the side, same-side elbow crunches down to it
  sidecrunch: {
    view: view(100, 170),
    front: true,
    keys: [
      k([100, SC0], 180, { ...atHead([100, SC0]), legN: ff(106), legF: ff(94) }, { n: 0 }),
      k([96.5, SC1], 158, { ...atHead([96.5, SC1], 158, 6, Q.n, Q.f), legN: { a: 94, b: 94 }, legF: ff(93.5) }, { n: 6 }),
      k([100, SC0], 180, { ...atHead([100, SC0]), legN: ff(106), legF: ff(94) }, { n: 0 }),
      k([103.5, SC1], 202, { ...atHead([103.5, SC1], 202, -6, Q.f, Q.n), legN: ff(106.5), legF: { a: 94, b: 94 } }, { n: -6 }),
    ],
    dur: [420, 380, 420, 380],
    still: 1,
  },

  // 擺臀扭腰: hips sway side to side under steady shoulders, arms wave
  hula: {
    view: view(100, 166),
    front: true,
    keys: [
      k([106, standY(106, 108, 92, 0.3, 191) - 0.6], 192, { armN: fk(88, 30), armF: fk(64, 12), legN: ff(108), legF: ff(92) }, { h: 180 }),
      k([94, standY(94, 108, 92, 0.3, 169) - 0.6], 168, { armN: fk(64, 12), armF: fk(88, 30), legN: ff(108), legF: ff(92) }, { h: 180 }),
    ],
    dur: 520,
  },

  // 側弓步: wide stance, sit into one leg with the other straight, hands clasped
  sidelunge: {
    view: view(97, 162),
    front: true,
    keys: [
      k([97, standY(97, 126, 68)], 180, { ...clasp([97, standY(97, 126, 68)], 18), legN: ff(126), legF: ff(68) }, { n: 0 }),
      k([113, 89], 183, { ...clasp([113, 89], 18, 183), legN: ff(126), legF: ff(68) }, { n: -3 }),
      k([97, standY(97, 126, 68)], 180, { ...clasp([97, standY(97, 126, 68)], 18), legN: ff(126), legF: ff(68) }, { n: 0 }),
      k([81, 89], 177, { ...clasp([81, 89], 18, 177), legN: ff(126), legF: ff(68) }, { n: 3 }),
    ],
    dur: 520,
    still: 1,
  },

  // 滑雪跳: feet together, hop side to side, arms swing like ski poles
  skihop: {
    view: view(100, 176),
    front: true,
    keys: [
      k([88, standY(88, 91.6, 84.4, 0.6)], 182, { armN: fk(24, 64), armF: fk(14, 44), legN: ff(91.6, 7), legF: ff(84.4, 7) }, { n: -2, hop: 9 }),
      k([112, standY(112, 115.6, 108.4, 0.6)], 178, { armN: fk(14, 44), armF: fk(24, 64), legN: ff(115.6, 7), legF: ff(108.4, 7) }, { n: 2, hop: 9 }),
    ],
    dur: 400,
  },

  // 站姿側彎: one arm reaches over the head, slow side bend to each side
  sidebend: {
    front: true,
    keys: [
      k([100, SB], 180, { ...onHips([100, SB]), legN: ff(106), legF: ff(94) }, { n: 0 }),
      k([101.5, SB], 199, { armN: { a: 176, b: 18, rel: true }, armF: onHips([101.5, SB], 199).armF, legN: ff(106), legF: ff(94) }, { n: -6 }),
      k([101.5, SB], 200, { armN: { a: 178, b: 18, rel: true }, armF: onHips([101.5, SB], 200).armF, legN: ff(106), legF: ff(94) }, { n: -6 }),
      k([100, SB], 180, { ...onHips([100, SB]), legN: ff(106), legF: ff(94) }, { n: 0 }),
      k([98.5, SB], 161, { armN: onHips([98.5, SB], 161).armN, armF: { a: 176, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { n: 6 }),
      k([98.5, SB], 160, { armN: onHips([98.5, SB], 160).armN, armF: { a: 178, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { n: 6 }),
    ],
    dur: [1000, 800, 900, 1000, 800, 900],
    still: 1,
  },
}
