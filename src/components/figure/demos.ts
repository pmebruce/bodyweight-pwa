import type { DemoKey } from '../../types'
import type { Key, LimbKey, V } from './rig'

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
}
