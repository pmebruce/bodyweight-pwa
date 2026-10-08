/**
 * Hip "skinning" for the demo figure.
 *
 * The pelvis / glute / upper-thigh region is described in a REST pose (pelvis upright, thigh hanging
 * straight down) in the hip joint's local frame:  x = forward (side view) or lateral (front view), y = up.
 * Each rest point gets a blend weight w ∈ [0, 1] (0 = rides on the pelvis, 1 = rides on the femur) and is
 * rotated about the hip joint by w · θ, where θ is the current hip flexion (side) / abduction (front).
 * Rotating by a blended ANGLE (instead of blending positions) keeps the distance to the joint, so the back
 * of the hip turns into a round arc in deep flexion and the glute rotates ~50 % with the thigh while it
 * stretches over the hip; in extension it bunches up and bulges slightly.
 */
import { add, dir, type Frame, type LimbOut, type V } from './rig'

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
/** smoothstep that also works with a > b */
const sm = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

export interface HipSkin {
  front: boolean
  /** hip joint */
  o: V
  /** rest x / y axes in world space */
  ex: V
  ey: V
  /** hip angle (radians): + = flexion (side) / abduction (front) */
  th: number
}

export function hipSkin(fr: Frame, lb: LimbOut): HipSkin {
  const ex: V = fr.front ? [fr.fwd[0] * lb.fc, fr.fwd[1] * lb.fc] : fr.fwd
  const ey = fr.axis
  const u = dir(lb.ua, lb.fc)
  const ux = u[0] * ex[0] + u[1] * ex[1]
  const uy = u[0] * ey[0] + u[1] * ey[1]
  return { front: fr.front, o: lb.root, ex, ey, th: Math.atan2(ux, -uy) }
}

/** blend weight pelvis (0) → femur (1) of a rest point */
function weight(front: boolean, x: number, y: number): number {
  if (front) {
    // lateral side follows the thigh a bit earlier than the crotch
    const s = sm(-3, 3, x)
    return sm(lerp(-3.5, 2.5, s), lerp(-12, -7.5, s), y)
  }
  // back (glute) blends over a long range, the front crease is short
  const s = sm(-3.5, 2.5, x)
  return sm(lerp(5.5, 2.0, s), lerp(-11.5, -3.0, s), y)
}

/** rest point → world (w: explicit blend weight, default from the weight field) */
export function skin(sk: HipSkin, q: V, wq?: number): V {
  const [x, y] = q
  const w = wq ?? weight(sk.front, x, y)
  const a = w * sk.th
  let r = 1
  if (!sk.front) {
    // glute volume: slightly flatter when stretched (flexion), fuller when contracted (extension)
    const back = sm(-1, -5.5, x) * 4 * w * (1 - w)
    r = sk.th > 0 ? 1 - 0.09 * back * Math.min(1, sk.th / 1.6) : 1 + 0.07 * back * Math.min(1, -sk.th / 0.6)
  }
  const c = Math.cos(a)
  const s = Math.sin(a)
  const qx = (x * c - y * s) * r
  const qy = (x * s + y * c) * r
  return add(add(sk.o, sk.ex, qx), sk.ey, qy)
}

/** world point that rides rigidly on the thigh → skinned world point (thigh muscles near the hip) */
export function skinThigh(sk: HipSkin, p: V): V {
  const d: V = [p[0] - sk.o[0], p[1] - sk.o[1]]
  const lx = d[0] * sk.ex[0] + d[1] * sk.ex[1]
  const ly = d[0] * sk.ey[0] + d[1] * sk.ey[1]
  // back to the rest pose (undo the thigh rotation)
  const c = Math.cos(-sk.th)
  const s = Math.sin(-sk.th)
  return skin(sk, [lx * c - ly * s, lx * s + ly * c])
}

/* ---------- rest shapes ---------- */
/** side view: pelvis + glute + thigh root silhouette (merged into the body outline) */
export const HIP_SIDE: V[] = [
  [5.3, 6.4], [5.6, 2.6], [5.8, -1.6], [5.7, -6.0], [5.1, -11], [3.0, -15.5], [-3.0, -15.5], [-5.0, -12.0],
  [-5.5, -8.4], [-6.3, -4.6], [-6.6, -1.0], [-6.3, 2.6], [-5.6, 6.0], [-3.2, 9.6], [1.8, 9.6],
]
/** front view (x lateral, origin = this leg's hip joint, midline at x = -4.6) */
export const HIP_FRONT: V[] = [
  [3.0, 7.0], [3.9, 2.0], [4.8, -3.0], [5.2, -8.0], [4.6, -13.5], [0, -15], [-4.4, -13], [-4.9, -9.2],
  [-4.75, -5.6], [-4.75, 0], [-4.75, 6], [-1, 8.5],
]

/**
 * Muscle "patches" in rest coordinates: an origin edge (on the pelvis) and an insertion edge (on the femur),
 * same point count; the outline is origin → insertion (reversed), the fibres run origin(t) → insertion(t).
 * wo / wi: blend weights along the origin / insertion edge (first → last point); a fibre blends linearly
 * between them, so the belly rotates ~half way with the thigh and stretches over the hip.
 */
export interface Patch {
  n: string
  o: V[]
  i: V[]
  wo: [number, number]
  wi: [number, number]
  /** 0–1: how much the belly follows a straight origin → insertion line instead of the rotation blend (near the joint) */
  lin?: number
  /** straight top border (insertion[0] → origin[0]) – avoids a cusp where it meets the insertion edge */
  top?: boolean
  /** no fibre stripes (tiny / deep muscles) */
  nofib?: boolean
}
// gluteus maximus seen from the side: posterior iliac crest / sacrum / coccyx → IT band + gluteal tuberosity.
// The back and lower edges are oversized (clipped to the silhouette).
export const GLUTE_MAX: Patch = {
  n: 'gmax',
  o: [[-6.6, 7.6], [-8.6, 3.4], [-9.6, -1.4], [-9.2, -5.8], [-7.8, -9.0], [-5.8, -10.0]],
  i: [[1.5, -2.4], [1.4, -3.9], [1.1, -5.3], [0.5, -6.6], [-0.8, -7.8], [-2.8, -8.8]],
  wo: [0, 0.4],
  wi: [0.8, 1],
  top: true,
}
// gluteus minimus / deep rotators: small underlay around the joint so no skin peeks through where
// gluteus medius, maximus and vastus lateralis meet at the greater trochanter
export const GLUTE_MIN: Patch = {
  n: 'gmin',
  o: [[-2.4, 2.2], [0.2, 2.8], [2.2, 2.0]],
  i: [[-2.2, -2.6], [0.4, -2.9], [2.2, -1.8]],
  wo: [0.3, 0.3],
  wi: [0.9, 0.9],
  lin: 1,
  nofib: true,
}
// gluteus medius: iliac crest → greater trochanter (its back half hides under the maximus)
export const GLUTE_MED: Patch = {
  n: 'gmed',
  o: [[6.0, 3.6], [3.0, 7.4], [-1.2, 8.0], [-5.6, 7.4], [-9.6, 5.4]],
  i: [[2.8, -1.2], [1.9, -1.9], [0.9, -2.0], [-0.4, -1.6], [-1.8, -0.8]],
  wo: [0, 0],
  wi: [0.95, 0.95],
  lin: 1,
}
