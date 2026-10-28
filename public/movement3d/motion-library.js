var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/components/figure/rig.ts
var LIMBS = ["armN", "armF", "legN", "legF"];
var L = {
  torso: 31.5,
  thigh: 26.5,
  shin: 26,
  upper: 20,
  fore: 16,
  shoulderW: 9,
  // front view half shoulder width
  hipW: 4.6
  // front view half hip width
};
var RAD = Math.PI / 180;
var dir = (deg, fc = 1) => [fc * Math.sin(deg * RAD), Math.cos(deg * RAD)];
var angOf = (v, fc = 1) => Math.atan2(fc * v[0], v[1]) / RAD;
var add = (a, b, k2 = 1) => [a[0] + b[0] * k2, a[1] + b[1] * k2];
var sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
var len = (v) => Math.hypot(v[0], v[1]);
var wrap = (d) => ((d + 180) % 360 + 360) % 360 - 180;
var lerpN = (a, b, k2) => a + (b - a) * k2;
var lerpA = (a, b, k2) => a + wrap(b - a) * k2;
var isArm = (n) => n === "armN" || n === "armF";
function limbRoot(name, P, S, fwd, front, pFwd, axis, sh) {
  if (!front) return isArm(name) ? add(add(S, sub(P, S), 0.045), axis, sh) : P;
  const side = name.endsWith("N") ? 1 : -1;
  return isArm(name) ? add(add(S, fwd, side * L.shoulderW), axis, sh) : add(P, pFwd, side * L.hipW);
}
function solveIK(root, target, l1, l2, fc, sgn, flip) {
  const d = sub(target, root);
  const dist = len(d);
  const maxR = l1 + l2 - 0.01;
  const minR = Math.abs(l1 - l2) + 0.01;
  const r = Math.min(maxR, Math.max(minR, dist));
  const base = angOf(d, fc);
  const cosA = (l1 * l1 + r * r - l2 * l2) / (2 * l1 * r);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA))) / RAD;
  const cands = [base + A, base - A].map((ua) => {
    const mid = add(root, dir(ua, fc), l1);
    const la = angOf(sub(add(root, d, r / (dist || 1)), mid), fc);
    return { ua, la, bend: sgn * wrap(la - ua) };
  });
  const want = flip ? -1 : 1;
  const c = cands.find((q) => Math.sign(q.bend) === want) ?? cands[0];
  return { ua: c.ua, la: c.la, miss: Math.max(0, dist - maxR) };
}
function v3(a, f, fc) {
  const cf = Math.cos(f * RAD);
  return [fc * Math.sin(a * RAD) * cf, Math.cos(a * RAD) * cf, Math.sin(f * RAD)];
}
var toAF = (u, fc, fallback) => {
  const f = Math.asin(Math.max(-1, Math.min(1, u[2]))) / RAD;
  const a = Math.hypot(u[0], u[1]) < 1e-4 ? fallback : Math.atan2(fc * u[0], u[1]) / RAD;
  return [a, f];
};
function solveIK3(arm, root, t, z, l1, l2, fc, pole) {
  const d = [t[0] - root[0], t[1] - root[1], z];
  const dist = Math.hypot(d[0], d[1], d[2]);
  const maxR = l1 + l2 - 0.01;
  const minR = Math.abs(l1 - l2) + 0.01;
  const r = Math.min(maxR, Math.max(minR, dist));
  const dh = dist > 1e-6 ? [d[0] / dist, d[1] / dist, d[2] / dist] : [0, 1, 0];
  const cosA = (l1 * l1 + r * r - l2 * l2) / (2 * l1 * r);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const P = arm ? [fc * pole, 0.45, -0.7] : [fc * pole, 0, 1];
  const pd = P[0] * dh[0] + P[1] * dh[1] + P[2] * dh[2];
  let pp = [P[0] - pd * dh[0], P[1] - pd * dh[1], P[2] - pd * dh[2]];
  const pl = Math.hypot(pp[0], pp[1], pp[2]);
  pp = pl > 1e-6 ? [pp[0] / pl, pp[1] / pl, pp[2] / pl] : [0, 0, arm ? -1 : 1];
  const M = [0, 1, 2].map((i) => dh[i] * l1 * Math.cos(A) + pp[i] * l1 * Math.sin(A));
  const E = [dh[0] * r, dh[1] * r, dh[2] * r];
  const U = [M[0] / l1, M[1] / l1, M[2] / l1];
  const W = [(E[0] - M[0]) / l2, (E[1] - M[1]) / l2, (E[2] - M[2]) / l2];
  const line = Math.atan2(fc * dh[0], dh[1]) / RAD;
  const [a, f] = toAF(U, fc, line);
  const [a2, f2] = toAF(W, fc, line);
  const sgn = arm ? 1 : -1;
  return { a, b: sgn * wrap(a2 - a), f, k: sgn * (f2 - f), miss: Math.max(0, dist - maxR) };
}
function fcOf(name, front) {
  return front && name.endsWith("F") ? -1 : 1;
}
function computeLimb(name, front, root, ua, bend, f, kz, ea, fc, fsK, fuK, toe, miss = 0) {
  const arm = isArm(name);
  const sgn = arm ? 1 : -1;
  const l1 = (arm ? L.upper : L.thigh) * fuK;
  const l2 = (arm ? L.fore : L.shin) * fsK;
  const la = ua + sgn * bend;
  if (!front || f === 0 && kz === 0) {
    const mid2 = add(root, dir(ua, fc), l1);
    const end2 = add(mid2, dir(la, fc), l2);
    return { root, mid: mid2, end: end2, ua, la, ea, fc, fs: fsK, fu: fuK, zm: 0, ze: 0, toe, miss, uaF: ua };
  }
  const f2 = f + (arm ? 1 : -1) * kz;
  const U = v3(ua, f, fc);
  const W = v3(la, f2, fc);
  const mid = [root[0] + U[0] * l1, root[1] + U[1] * l1];
  const end = [mid[0] + W[0] * l2, mid[1] + W[1] * l2];
  const cu = Math.cos(f * RAD);
  const cl = Math.cos(f2 * RAD);
  return {
    root,
    mid,
    end,
    ua: cu >= 0 ? ua : ua + 180,
    la: cl >= 0 ? la : la + 180,
    ea: cl >= 0 || !arm ? ea : ea + 180,
    fc,
    fs: fsK * Math.abs(cl),
    fu: fuK * Math.abs(cu),
    zm: U[2] * l1,
    ze: U[2] * l1 + W[2] * l2,
    toe,
    miss,
    uaF: ua
  };
}
function bodyFrame(p, T) {
  const axis = dir(T);
  const fwd = dir(T - 90);
  const S = add(p, axis, L.torso);
  return { axis, fwd, S };
}
function resolveKey(key, front) {
  const { fwd, S, axis } = bodyFrame(key.p, key.t);
  const pa = front ? key.pa ?? key.t : key.t;
  const pFwd = dir(pa - 90);
  const limbs = {};
  for (const name of LIMBS) {
    const k2 = key[name];
    const fc = fcOf(name, front);
    const arm = isArm(name);
    const sgn = arm ? 1 : -1;
    const fs = k2.fs ?? 1;
    const fu = k2.fu ?? 1;
    const root = limbRoot(name, key.p, S, fwd, front, pFwd, axis, key.sh ?? 0);
    const relOff = k2.rel ? fc * (key.t - 180) : 0;
    const ik3 = !!k2.t && front && (!arm || k2.z !== void 0 || k2.pole !== void 0);
    const pole = k2.pole ?? (arm ? 0.6 : 0.18);
    let ua, la;
    let f = 0;
    let kz = 0;
    if (k2.t && ik3) {
      const s = solveIK3(arm, root, k2.t, k2.z ?? 0, (arm ? L.upper : L.thigh) * fu, (arm ? L.fore : L.shin) * fs, fc, pole);
      ua = s.a;
      la = s.a + sgn * s.b;
      f = s.f;
      kz = s.k;
    } else if (k2.t) {
      const s = solveIK(root, k2.t, (arm ? L.upper : L.thigh) * fu, (arm ? L.fore : L.shin) * fs, fc, sgn, !!k2.flip);
      ua = s.ua;
      la = s.la;
    } else {
      ua = (k2.a ?? 0) + relOff;
      la = ua + sgn * (k2.b ?? 0);
      f = front ? k2.f ?? 0 : 0;
      kz = front ? k2.k ?? 0 : 0;
    }
    const eAbs = k2.e !== void 0;
    const ea = eAbs ? k2.e + relOff : arm ? la : la + 90;
    limbs[name] = {
      ik: !!k2.t,
      ik3,
      t: k2.t ?? [0, 0],
      z: k2.z ?? 0,
      pole,
      ua,
      la,
      f,
      k: kz,
      ea,
      eAbs,
      rel: !!k2.rel,
      fs,
      fu,
      flip: !!k2.flip,
      lift: k2.lift ?? 0,
      toe: k2.toe ?? 0,
      hand: k2.hand
    };
  }
  const neck = key.h !== void 0 ? key.h - key.t : key.n ?? 0;
  return { key, neck, pa, limbs };
}
var EASE = {
  // human ease-in-out: a brief settle at each end range, then a smooth (zero-jerk) quintic sweep
  io: (t) => {
    const u = Math.min(1, Math.max(0, (t - 0.06) / 0.88));
    return u * u * u * (u * (u * 6 - 15) + 10);
  },
  in: (t) => 1 - Math.cos(t * Math.PI / 2),
  out: (t) => Math.sin(t * Math.PI / 2),
  lin: (t) => t
};
function hermite(v0, v1, v2, v32, h0, h1, h2, u) {
  const d0 = (v1 - v0) / h0;
  const d1 = (v2 - v1) / h1;
  const d2 = (v32 - v2) / h2;
  const tan = (da, db, ha, hb) => {
    if (da * db <= 0) return 0;
    const m = (da * hb + db * ha) / (ha + hb);
    const lim = 3 * Math.min(Math.abs(da), Math.abs(db));
    return Math.sign(m) * Math.min(Math.abs(m), lim);
  };
  const m1 = tan(d0, d1, h0, h1);
  const m2 = tan(d1, d2, h1, h2);
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v1 + (u3 - 2 * u2 + u) * h1 * m1 + (-2 * u3 + 3 * u2) * v2 + (u3 - u2) * h1 * m2;
}
function applyYaw(f, yaw) {
  const cy = Math.cos(yaw * RAD);
  const sy = Math.sin(yaw * RAD);
  const x0 = f.p[0];
  const C = (q) => [x0 + (q[0] - x0) * cy, q[1]];
  const out = { ...f, S: C(f.S), neckBase: C(f.neckBase), head: C(f.head), yaw };
  for (const name of LIMBS) {
    const l = f[name];
    const arm = isArm(name);
    const root = C(l.root);
    root[0] += (l.zr ?? 0) * sy;
    const dm = sub(l.mid, l.root);
    const de = sub(l.end, l.mid);
    const mid = [root[0] + dm[0] * cy + l.zm * sy, root[1] + dm[1]];
    const end = [mid[0] + de[0] * cy + (l.ze - l.zm) * sy, mid[1] + de[1]];
    const u = sub(mid, root);
    const w = sub(end, mid);
    const lu = len(u);
    const lw = len(w);
    const ua = lu > 0.4 ? angOf(u, l.fc) : l.ua;
    const la = lw > 0.4 ? angOf(w, l.fc) : l.la;
    out[name] = {
      ...l,
      root,
      mid,
      end,
      ua,
      la,
      ea: l.ea + wrap(la - l.la),
      fu: lu / (arm ? L.upper : L.thigh),
      fs: lw / (arm ? L.fore : L.shin)
    };
  }
  return out;
}
var Rig = class {
  constructor(keys, front = false, opts = {}) {
    __publicField(this, "front");
    __publicField(this, "keys");
    __publicField(this, "opts");
    __publicField(this, "durs");
    this.front = front;
    this.opts = opts;
    this.keys = keys.map((k2) => resolveKey(k2, front));
    this.durs = opts.durs ?? keys.map(() => 500);
  }
  ctx(i, u) {
    const n = this.keys.length;
    const A = this.keys[i];
    const B = this.keys[(i + 1) % n];
    if (!this.opts.smooth || n < 2) {
      const k2 = EASE[B.key.ease ?? "io"](u);
      return {
        A,
        B,
        k: k2,
        bump: Math.sin(Math.PI * k2),
        n: (g) => lerpN(g(A), g(B), k2),
        an: (g) => lerpA(g(A), g(B), k2)
      };
    }
    const P = this.keys[(i - 1 + n) % n];
    const C = this.keys[(i + 2) % n];
    const d = this.durs;
    const h0 = d[(i - 1 + n) % n];
    const h1 = d[i];
    const h2 = d[(i + 1) % n];
    const four = (g, ok) => {
      const v1 = g(A);
      const v2 = g(B);
      const v0 = !ok || ok(P) ? g(P) : v1;
      const v32 = !ok || ok(C) ? g(C) : v2;
      return [v0, v1, v2, v32];
    };
    return {
      A,
      B,
      k: u,
      bump: Math.sin(Math.PI * u),
      n: (g, ok) => {
        const [v0, v1, v2, v32] = four(g, ok);
        return hermite(v0, v1, v2, v32, h0, h1, h2, u);
      },
      an: (g, ok) => {
        const [v0, v1, v2, v32] = four(g, ok);
        const b = v1 + wrap(v2 - v1);
        const a = v1 + wrap(v0 - v1);
        const c = b + wrap(v32 - b);
        return hermite(a, v1, b, c, h0, h1, h2, u);
      }
    };
  }
  /** key index + fraction for a loop position 0–1 */
  seg(pos) {
    const total = this.durs.reduce((a, b) => a + b, 0);
    let t = (pos % 1 + 1) % 1 * total;
    let i = 0;
    while (i < this.durs.length - 1 && t >= this.durs[i]) {
      t -= this.durs[i];
      i++;
    }
    return [i, Math.min(1, t / this.durs[i])];
  }
  /** pose at loop position 0–1 (with arm / head follow-through) */
  at(pos) {
    const [i, u] = this.seg(pos);
    const lag = this.opts.lag ?? 0;
    const hl = this.opts.headLag ?? 0;
    return this.pose(i, u, lag ? this.seg(pos - lag) : void 0, hl ? this.seg(pos - hl) : void 0);
  }
  /** pose between key i and key i+1 (wrapping) at raw fraction u ∈ [0,1] */
  pose(i, u, armIU, headIU) {
    const c = this.ctx(i, u);
    const ca = armIU ? this.ctx(armIU[0], armIU[1]) : c;
    const ch = headIU ? this.ctx(headIU[0], headIU[1]) : c;
    const p = [c.n((r) => r.key.p[0]), c.n((r) => r.key.p[1])];
    p[1] -= c.bump * (c.B.key.hop ?? 0);
    const T = c.n((r) => r.key.t);
    const pa = c.n((r) => r.pa);
    const sh = c.n((r) => r.key.sh ?? 0);
    const pz = c.n((r) => r.key.pz ?? 0);
    const bothHeadAbs = ch.A.key.h !== void 0 && ch.B.key.h !== void 0;
    const headA = bothHeadAbs ? ch.an((r) => r.key.h, (r) => r.key.h !== void 0) : T + ch.n((r) => r.neck);
    const front = this.front;
    return this.build(p, T, pa, sh, pz, headA, (name, root, fc) => {
      const cc = isArm(name) ? ca : c;
      const a = cc.A.limbs[name];
      const b = cc.B.limbs[name];
      const arm = isArm(name);
      const sgn = arm ? 1 : -1;
      const L_ = (r) => r.limbs[name];
      const fs = cc.n((r) => L_(r).fs);
      const fu = cc.n((r) => L_(r).fu);
      const toe = Math.max(0, cc.n((r) => L_(r).toe));
      const l1 = (arm ? L.upper : L.thigh) * fu;
      const l2 = (arm ? L.fore : L.shin) * fs;
      let ua, bend, f = 0, kz = 0, miss = 0;
      if (a.ik && b.ik) {
        const isIk = (r) => L_(r).ik;
        const t = [cc.n((r) => L_(r).t[0], isIk), cc.n((r) => L_(r).t[1], isIk)];
        t[1] -= cc.bump * b.lift;
        if (a.ik3 && b.ik3) {
          const s = solveIK3(arm, root, t, cc.n((r) => L_(r).z, isIk), l1, l2, fc, cc.n((r) => L_(r).pole, isIk));
          ua = s.a;
          bend = s.b;
          f = s.f;
          kz = s.k;
          miss = s.miss;
        } else {
          const s = solveIK(root, t, l1, l2, fc, sgn, b.flip);
          ua = s.ua;
          bend = sgn * wrap(s.la - s.ua);
          miss = s.miss;
        }
      } else {
        const rel = a.rel && b.rel;
        const off = (r) => rel ? fc * (r.key.t - 180) : 0;
        ua = cc.an((r) => L_(r).ua - off(r)) + (rel ? fc * (T - 180) : 0);
        bend = cc.n((r) => sgn * wrap(L_(r).la - L_(r).ua));
        if (front) {
          f = cc.n((r) => L_(r).f);
          kz = cc.n((r) => L_(r).k);
        }
      }
      const la = ua + sgn * bend;
      let ea;
      if (a.eAbs && b.eAbs) {
        const rel = a.rel && b.rel;
        const off = (r) => rel ? fc * (r.key.t - 180) : 0;
        ea = cc.an((r) => L_(r).ea - off(r), (r) => L_(r).eAbs) + (rel ? fc * (T - 180) : 0);
      } else {
        ea = la + cc.an((r) => wrap(L_(r).ea - L_(r).la));
      }
      const out = computeLimb(name, front, root, ua, bend, f, kz, ea, fc, fs, fu, toe, miss);
      if (arm) out.hand = (cc.k < 0.5 ? a.hand ?? b.hand : b.hand ?? a.hand) ?? this.opts.hand ?? "relax";
      return out;
    });
  }
  build(p, T, pa, sh, pz, headA, limb) {
    const { axis, fwd, S } = bodyFrame(p, T);
    const front = this.front;
    const pAxis = front ? dir(pa) : axis;
    const pFwd = front ? dir(pa - 90) : fwd;
    const neckBase = add(add(p, axis, L.torso + 2.6), fwd, front ? 0 : 0.8);
    const hd = dir(headA);
    const hf = dir(headA - 90);
    const head = add(add(neckBase, hd, 9.2), hf, front ? 0 : 1.1);
    const f = { front, p, T, S, axis, fwd, pa: front ? pa : T, pAxis, pFwd, neckBase, head, headA, yaw: 0 };
    for (const name of LIMBS) f[name] = limb(name, limbRoot(name, p, S, fwd, front, pFwd, axis, sh), fcOf(name, front));
    if (front && pz) for (const name of ["armN", "armF"]) f[name] = { ...f[name], zr: pz };
    const yaw = front ? this.opts.yaw ?? 0 : 0;
    return yaw ? applyYaw(f, yaw) : f;
  }
};

// src/components/figure/demos.ts
var GROUND = 128;
var ANK = GROUND - 4.4;
var WR = GROUND - 2.4;
var view = (cx, w = 142) => [+Math.max(0, Math.min(200 - w, cx - w / 2)).toFixed(1), +(138 - w * 0.77).toFixed(1), w];
var flat = (x, lift) => ({ t: [x, ANK], e: 90, lift });
var toes = (x, y, e = 18, lift) => ({ t: [x, y], e, lift });
var palm = (x, e = 90) => ({ t: [x, WR], e });
var fk = (a, b = 0, e) => ({ a, b, e });
var k = (p, t, limbs, extra = {}) => ({
  p,
  t,
  ...limbs,
  ...extra
});
var AF = GROUND - 5.6;
var ff = (x, lift) => ({ t: [x, AF], e: 90, lift });
var bodyPt = (p, T, s, w) => add(add(p, dir(T), s), dir(T - 90), w);
var onHips = (p, T = 180) => ({
  armN: { t: bodyPt(p, T, 8.5, 10.2), e: 200, flip: true },
  armF: { t: bodyPt(p, T, 8.5, -10.2), e: 200, flip: true }
});
var atHead = (p, T = 180, n = 0, flipN = false, flipF = false) => {
  const nb = bodyPt(p, T, L.torso + 2.6, 0);
  const hc = add(nb, dir(T + n), 9.6);
  const side = dir(T + n - 90);
  return {
    armN: { t: add(hc, side, 5.2), e: T + n + 30, flip: flipN },
    armF: { t: add(hc, side, -5.2), e: -(T + n) + 30 + 360, flip: flipF }
  };
};
var AF_TOE = AF - 4.6 * 0.75;
var tap = (x, z = -1) => ({ t: [x, AF_TOE], e: 90, toe: 1, z, pole: 0.08 });
var air = (x, h, toe = 0.4, z = 0.5) => ({ t: [x, AF - h], e: 90, toe, z });
var CLAP = { a: -16, f: 45, k: 85, b: 38, e: 180 };
var arm3 = (a, f, k2, b = 0) => ({ a, f, k: k2, b });
var both = (l) => ({ armN: l, armF: { ...l } });
var hipY = (px, pa, fN, fF, slack = 0.4) => {
  const fw = dir(pa - 90);
  let y = -Infinity;
  for (const [sd, f] of [[1, fN], [-1, fF]]) {
    const dx = f[0] - (px + fw[0] * L.hipW * sd);
    const r = L.thigh + L.shin - slack;
    y = Math.max(y, f[1] - fw[1] * L.hipW * sd - Math.sqrt(r * r - dx * dx));
  }
  return +y.toFixed(2);
};
var FLAT = (x) => [x, AF];
var mxl = (l) => l.t ? { ...l, t: [200 - l.t[0], l.t[1]] } : { ...l };
var mirror = (q) => ({
  ...q,
  p: [200 - q.p[0], q.p[1]],
  t: 360 - q.t,
  pa: q.pa !== void 0 ? 360 - q.pa : void 0,
  h: q.h !== void 0 ? 360 - q.h : void 0,
  n: q.n !== void 0 ? -q.n : void 0,
  armN: mxl(q.armF),
  armF: mxl(q.armN),
  legN: mxl(q.legF),
  legF: mxl(q.legN)
});
var sym = (half) => [...half, ...half.map(mirror)];
var SJ_C = hipY(100, 180, FLAT(104.5), FLAT(95.5), 1.4);
var SJ_DOWN = { a: 9, f: 6, k: 22, b: 8 };
var SJ_MID = { a: 84, f: 8, k: 22, b: 18 };
var SJ_UP = { a: 160, f: 6, k: 12, b: 20 };
var stepjackHalf = [
  k([100, SJ_C], 180, { armN: SJ_DOWN, armF: SJ_DOWN, legN: ff(104.5), legF: ff(95.5) }, { pa: 180, h: 180 }),
  k([98.4, hipY(98.4, 177.5, FLAT(95.5), FLAT(95.5), 0.9)], 179.2, { armN: SJ_MID, armF: SJ_MID, legN: { t: [113, AF - 4], e: 90, toe: 0.35, z: 0.5 }, legF: ff(95.5) }, { pa: 177.5, sh: 0.6, h: 180.4 }),
  k([102.6, hipY(102.6, 180.6, FLAT(121), FLAT(95.5), 2.4)], 180.4, { armN: SJ_UP, armF: SJ_UP, legN: ff(121), legF: ff(95.5) }, { pa: 180.6, sh: 1.6, h: 179.8 }),
  k([98.6, hipY(98.6, 177.8, FLAT(95.5), FLAT(95.5), 0.9)], 179.3, { armN: SJ_MID, armF: SJ_MID, legN: { t: [111, AF - 3.4], e: 90, toe: 0.3, z: 0.5 }, legF: ff(95.5) }, { pa: 177.8, sh: 0.6, h: 180.4 })
];
var SL_C = hipY(100, 180, FLAT(105), FLAT(95), 1);
var SL_S = hipY(97.2, 178.8, FLAT(105), FLAT(95), 0.9);
var SL_U = hipY(97, 183, FLAT(95), FLAT(95), 0.9);
var sidelegHalf = [
  k([100, SL_C], 180, { ...onHips([100, SL_C]), legN: ff(105), legF: ff(95) }, { pa: 180, h: 180 }),
  // weight shifts over the standing (left) foot first
  k([97.2, SL_S], 181, { ...onHips([97.2, SL_S], 181), legN: ff(105), legF: ff(95) }, { pa: 178.8, h: 180 }),
  // leg sweeps out: lifted hip hikes, trunk leans a little over the standing leg, foot slightly pointed
  k([97, SL_U], 185, { ...onHips([97, SL_U], 185), legN: { a: 41, b: 2, f: 3, k: 4, e: 112, toe: 0.35 }, legF: ff(95) }, { pa: 183, n: -4 }),
  k([97.2, SL_S], 181, { ...onHips([97.2, SL_S], 181), legN: ff(105), legF: ff(95) }, { pa: 178.8, h: 180 })
];
var SC_C = hipY(100, 180, FLAT(106), FLAT(94), 1.2);
var SC_U = hipY(97, 188, FLAT(94), FLAT(94), 1);
var sidecrunchHalf = [
  k([100, SC_C], 180, { ...atHead([100, SC_C]), legN: ff(106), legF: ff(94) }, { pa: 180, n: 0 }),
  // knee drives up and out, hip hikes on that side, ribcage crunches down toward it (elbow to knee)
  k([97, SC_U], 160, { ...atHead([97, SC_U], 160, 6), legN: { a: 92, b: 96, f: 10, k: 6, toe: 0.3 }, legF: ff(94) }, { pa: 188, n: 6 })
];
var HU_N = FLAT(108);
var HU_F = FLAT(92);
var HU_ARM_HI = { a: 96, f: 10, k: 34, b: 26 };
var HU_ARM_LO = { a: 70, f: 12, k: 26, b: 14 };
var HU_ARM_MID = { a: 82, f: 12, k: 30, b: 20 };
var hulaHalf = [
  // hips out to the right: right hip hikes, left knee softens, shoulders stay over the feet
  k([107, hipY(107, 188, HU_N, HU_F, 1.2)], 191, { armN: HU_ARM_HI, armF: HU_ARM_LO, legN: ff(108), legF: ff(92) }, { pa: 188, h: 180 }),
  // through the middle (hips forward): body rises
  k([100, hipY(100, 180, HU_N, HU_F, 0.8)], 180, { armN: HU_ARM_MID, armF: HU_ARM_MID, legN: ff(108), legF: ff(92) }, { pa: 180, h: 180 })
];
var SLG_W = hipY(100, 180, FLAT(129), FLAT(71), 0.6);
var SLG_ARM = { a: -16, f: 35, k: 95, b: 34, e: 180, rel: true };
var SLG_CL = () => ({ armN: { ...SLG_ARM }, armF: { ...SLG_ARM } });
var sidelungeHalf = [
  k([100, SLG_W], 180, { ...SLG_CL(), legN: ff(129), legF: ff(71) }, { pa: 180, n: 0 }),
  // sit into the right leg: knee bends out over the toes, left leg long, hips drop and travel right
  k([115.5, 90], 183, { ...SLG_CL(), legN: { ...ff(129), pole: 1.25 }, legF: ff(71) }, { pa: 181.5, n: -3 })
];
var SK_LAND = (cx) => hipY(cx, 180, FLAT(cx + 3.6), FLAT(cx - 3.6), 4.2);
var SK_OUT = { a: 34, f: 34, k: 48, b: 10 };
var SK_IN = { a: -14, f: 40, k: 56, b: 22 };
var SK_AIR = { a: 12, f: 8, k: 34, b: 8 };
var skihopHalf = [
  // land on the left: knees bend (toward the camera), hips sink and lean into the landing, poles planted
  k([88, SK_LAND(88)], 182.5, { armN: SK_OUT, armF: SK_IN, legN: { ...ff(91.6), pole: 0.1 }, legF: { ...ff(84.4), pole: 0.1 } }, { pa: 181, n: -2.5 }),
  // push off: body rises and travels right, feet tuck up, arms swing back
  k([100, 63.6], 180, { armN: SK_AIR, armF: SK_AIR, legN: { t: [103.6, AF - 7], e: 90, toe: 0.45, z: -1, pole: 0.1 }, legF: { t: [96.4, AF - 7], e: 90, toe: 0.45, z: -1, pole: 0.1 } }, { pa: 180, n: 0 })
];
var SB2 = hipY(100, 180, FLAT(106), FLAT(94), 1.1);
var SB3 = hipY(103, 180, FLAT(106), FLAT(94), 1);
var JJ_IN = hipY(100, 180, FLAT(104.6), FLAT(95.4), 3.2);
var JJ_OUT = hipY(100, 180, FLAT(117), FLAT(83), 3.6);
var JJ_DOWN = { a: 8, f: 4, k: 14, b: 6 };
var JJ_UP = { a: 166, f: 4, k: 8, b: 14 };
var STAND = k([98, 72.2], 180, { armN: fk(7, 14), armF: fk(3, 12), legN: flat(100), legF: flat(97) }, { n: 0 });
var SQUAT = k([88.5, 98.5], 141, { armN: fk(88, 4), armF: fk(85, 4), legN: flat(100), legF: flat(97) }, { n: 22 });
var plankHigh = (hx) => k([92, 100.6], 108, { armN: palm(hx), armF: palm(hx - 3), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 4 });
var CROUCH = k([90, 104.5], 117, { armN: palm(121), armF: palm(118), legN: flat(99, 7), legF: flat(96, 7) }, { n: 32 });
var LIE = (arms, feetX = 130) => k([95, 121.4], 271.4, { ...arms, legN: flat(feetX), legF: flat(feetX - 3) }, { n: -2 });
var CROSSED = { armN: { a: 34, b: 134, fs: 0.38, rel: true }, armF: { a: 30, b: 130, fs: 0.38, rel: true } };
var BEHIND_HEAD = { armN: { a: 150, b: 117, fu: 0.7, fs: 0.63, rel: true }, armF: { a: 160, b: 112, fu: 0.62, fs: 0.6, rel: true } };
var ARM_YAW = 45;
var AC_YAW = 30;
var AC_PER = 12;
var AC_STEP = 92;
var AC_R = 44;
var AC_STAND = hipY(100, 180, FLAT(108), FLAT(92), 1.3);
function armCircleKeys() {
  const keys = [];
  const n = AC_PER * 4;
  const R = AC_R * Math.PI / 180;
  for (let i = 0; i < 2 * n; i++) {
    const ph = (i < n ? i : 2 * n - i) / AC_PER;
    const t = ph * Math.PI * 2;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    const d = [Math.cos(R), -Math.sin(R) * c, Math.sin(R) * sn];
    const a = Math.atan2(d[0], d[1]) * 180 / Math.PI;
    const f = Math.asin(d[2]) * 180 / Math.PI;
    const arm = { a, f, k: 4, b: 3, e: a };
    const bob = 0.7 * (1 - c) * 0.5;
    keys.push(
      k([100, AC_STAND + bob], 180, { armN: { ...arm }, armF: { ...arm }, legN: ff(108), legF: ff(92) }, {
        pa: 180,
        sh: 0.25 + 0.75 * (1 + c),
        pz: 1.8 * sn,
        h: 180
      })
    );
  }
  return keys;
}
var hipYz = (px, fN, fF, slack) => {
  let y = -Infinity;
  for (const [sd, f] of [[1, fN], [-1, fF]]) {
    const d = Math.hypot(f[0] - (px + L.hipW * sd), f[2]);
    const r = L.thigh + L.shin - slack;
    y = Math.max(y, f[1] - Math.sqrt(r * r - d * d));
  }
  return +y.toFixed(2);
};
var BX_N = { t: [104.4, AF], z: 11, e: 90, pole: 0.12 };
var BX_F = { t: [95.4, AF - 1.2], z: -10, e: 90, pole: 0.12 };
var BX_Y = hipYz(100, [104.4, AF, 11], [95.4, AF - 1.2, -10], 3.2);
var GUARD = { a: -4, f: 18, k: 138, b: -12 };
var JAB = { a: -9, f: 86, k: 4, b: 2 };
var UP_LOAD = { a: 4, f: 8, k: 96, b: 14 };
var UP_HIT = { a: -10, f: 62, k: 94, b: -8 };
var bx = (p, t, armN, armF, extra = {}) => k(p, t, { armN: { ...armN }, armF: { ...armF }, legN: BX_N, legF: BX_F }, { pa: 180, h: 180, ...extra });
var DEMO_HAND = {
  squat: "open",
  lunge: "relax",
  wallsit: "relax",
  jumpsquat: "relax",
  pushup: "flat",
  diamond: "flat",
  plank: "flat",
  burpee: "flat",
  climber: "flat",
  sideplank: "flat",
  birddog: "flat",
  bridge: "flat",
  situp: "relax",
  crunch: "relax",
  bicycle: "relax",
  sidecrunch: "relax",
  jack: "open",
  stepjack: "open",
  skihop: "open",
  superman: "open",
  sidebend: "open",
  armcircle: "open",
  kickclap: "open",
  steptouch: "open",
  dips: "grip",
  pullup: "grip",
  highknees: "fist",
  march: "fist",
  buttkick: "fist",
  punch: "fist",
  uppercut: "fist",
  sideleg: "relax",
  hula: "relax",
  sidelunge: "relax"
};
var DEMOS = {
  squat: { view: view(108, 170), keys: [STAND, SQUAT], dur: [1100, 850], still: 1 },
  pushup: {
    view: view(90.6),
    keys: [
      plankHigh(120),
      k([93.5, 112.4], 94.5, { armN: palm(120), armF: palm(117), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 6 })
    ],
    dur: [1050, 780]
  },
  diamond: {
    view: view(91.4),
    keys: [
      k([92, 100.4], 108, { armN: palm(115), armF: palm(113), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 4 }),
      k([95, 112.6], 94.5, { armN: palm(115), armF: palm(113), legN: toes(43.5, 114.6), legF: toes(42, 114.6) }, { n: 6 })
    ],
    dur: [1150, 850]
  },
  lunge: {
    view: view(110, 170),
    keys: [
      k([86, 72.2], 180, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(88), legF: flat(85) }, { n: 0 }),
      // front foot lifts and travels forward
      k([94, 74], 179, { armN: fk(-30, 108), armF: fk(-26, 104), legN: { t: [104, 112], e: 96 }, legF: toes(97, 115.2, 32) }, { n: 0, ease: "in" }),
      // bottom: both knees ~90°, torso upright
      k([108, 98.5], 178, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(134), legF: toes(97, 115.2, 32) }, { n: 0, ease: "out" }),
      k([108, 98.5], 178, { armN: fk(-30, 108), armF: fk(-26, 104), legN: flat(134), legF: toes(97, 115.2, 32) }, { n: 0 }),
      k([94, 74], 179, { armN: fk(-30, 108), armF: fk(-26, 104), legN: { t: [104, 112], e: 96 }, legF: toes(97, 115.2, 32) }, { n: 0, ease: "in" })
    ],
    dur: [380, 360, 220, 420, 360],
    still: 2
  },
  plank: {
    view: view(91.5),
    keys: [
      k([92.6, 108.6], 96.9, { armN: { t: [140, WR + 0.2], e: 92 }, armF: { t: [137, WR + 0.2], e: 92 }, legN: toes(43.5, 114.8, 20), legF: toes(42, 114.8, 20) }, { n: 8 }),
      k([92.6, 107.7], 97.4, { armN: { t: [140, WR + 0.2], e: 92 }, armF: { t: [137, WR + 0.2], e: 92 }, legN: toes(43.5, 114.8, 20), legF: toes(42, 114.8, 20) }, { n: 9 })
    ],
    dur: 1700
  },
  burpee: {
    keys: [
      STAND,
      CROUCH,
      { ...plankHigh(121), legN: toes(43.5, 114.6, 18, 9), legF: toes(42, 114.6, 18, 9) },
      CROUCH,
      k([100, 59], 180, { armN: fk(162, 12), armF: fk(156, 12), legN: fk(4, 6, 24), legF: fk(1, 6, 22) }, { n: 2, ease: "out" })
    ],
    dur: [420, 330, 340, 300, 380],
    still: 2
  },
  climber: {
    view: view(89),
    keys: [
      k([92, 100], 108, { armN: palm(121), armF: palm(118), legN: toes(94, 115, 24, 6), legF: toes(42, 114.6, 18, 6) }, { n: 6 }),
      k([92, 100], 108, { armN: palm(121), armF: palm(118), legN: toes(43.5, 114.6, 18, 6), legF: toes(92, 115, 24, 6) }, { n: 6 })
    ],
    dur: 300
  },
  bridge: {
    view: view(87),
    keys: [
      k([95, 121.4], 271.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 272 }),
      k([92.4, 109.6], 293.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 270 }),
      k([92.4, 109.6], 293.4, { armN: fk(85, 0, 90), armF: fk(84, 0, 90), legN: flat(118), legF: flat(115) }, { h: 270 })
    ],
    dur: [800, 450, 800],
    still: 1
  },
  situp: {
    view: view(93.4),
    keys: [LIE(CROSSED), k([95, 119.6], 166, { ...CROSSED, legN: flat(130), legF: flat(127) }, { n: -12, hop: 1.5 })],
    dur: [950, 900],
    still: 1
  },
  crunch: {
    view: view(92.4),
    keys: [LIE(CROSSED, 128), k([95, 121.4], 243, { ...CROSSED, legN: flat(128), legF: flat(125) }, { n: -14 })],
    dur: [700, 650],
    still: 1
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
      k([100, 64.5], 180, { armN: { a: 90, f: 4, k: 10, b: 10 }, armF: { a: 90, f: 4, k: 10, b: 10 }, legN: { t: [111.5, AF - 6], e: 90, toe: 0.5, z: 0 }, legF: { t: [88.5, AF - 6], e: 90, toe: 0.5, z: 0 } }, { pa: 180, sh: 0.8, h: 180 })
    ],
    dur: [190, 170, 190, 170],
    still: 2
  },
  superman: {
    headFront: true,
    view: view(93.2, 158),
    keys: [
      k([90, 121], 91, { armN: fk(85.5, 0, 92), armF: fk(86, 0, 92), legN: fk(-86.5, 0, -66), legF: fk(-87.5, 0, -66) }, { n: 7 }),
      k([90, 121], 100, { armN: fk(103, 0, 106), armF: fk(101, 0, 104), legN: fk(-101, 0, -80), legF: fk(-99, 0, -78) }, { n: 0 }),
      k([90, 121], 100, { armN: fk(103, 0, 106), armF: fk(101, 0, 104), legN: fk(-101, 0, -80), legF: fk(-99, 0, -78) }, { n: 0 })
    ],
    dur: [850, 500, 850],
    still: 1
  },
  sideplank: {
    view: view(89),
    front: true,
    keys: [
      k([92, 104], 102, { armN: { a: 0, b: 90, fs: 0.45, e: 90 }, armF: fk(180, 0), legN: { t: [43, 122.6] }, legF: { t: [41.4, 113.4] } }, { n: 2 }),
      k([92, 103], 101.4, { armN: { a: 0, b: 90, fs: 0.45, e: 90 }, armF: fk(178, 0), legN: { t: [43, 122.6] }, legF: { t: [41.4, 113.4] } }, { n: 3 })
    ],
    dur: 1500
  },
  dips: {
    view: view(83),
    prop: "chair",
    keys: [
      k([82, 91], 179, { armN: { t: [73.5, 93.6], e: 90 }, armF: { t: [71, 93.6], e: 90 }, legN: flat(122), legF: flat(119) }, { n: 0 }),
      k([81.5, 106.5], 176, { armN: { t: [73.5, 93.6], e: 90 }, armF: { t: [71, 93.6], e: 90 }, legN: flat(122), legF: flat(119) }, { n: 2 })
    ],
    dur: [1050, 800],
    still: 1
  },
  highknees: {
    view: view(102, 170),
    keys: [
      k([99, 66.6], 179, { armN: fk(4, 92), armF: fk(4, 92), legN: fk(-2, 8, 60), legF: fk(6, 10, 70) }, { n: 0 }),
      k([99, 65.2], 178, { armN: fk(-38, 95), armF: fk(48, 92), legN: fk(92, 104, 112), legF: fk(-3, 6, 52) }, { n: 0 }),
      k([99, 66.6], 179, { armN: fk(4, 92), armF: fk(4, 92), legN: fk(6, 10, 70), legF: fk(-2, 8, 60) }, { n: 0 }),
      k([99, 65.2], 178, { armN: fk(48, 92), armF: fk(-38, 95), legN: fk(-3, 6, 52), legF: fk(92, 104, 112) }, { n: 0 })
    ],
    dur: 150,
    smooth: true,
    lag: 0.03,
    headLag: 0.02,
    still: 1
  },
  wallsit: {
    view: view(82.2, 150),
    prop: "wall",
    keys: [
      k([73, 98.4], 180, { armN: { t: [94, 90.6], e: 98 }, armF: { t: [91, 90.6], e: 98 }, legN: flat(99.5), legF: flat(97) }, { n: 0 }),
      k([73, 98.4], 179.2, { armN: { t: [94.4, 90.6], e: 98 }, armF: { t: [91.4, 90.6], e: 98 }, legN: flat(99.5), legF: flat(97) }, { n: -1.5 })
    ],
    dur: 1500
  },
  pullup: {
    prop: "bar",
    front: true,
    keys: [
      k([100, 72.2], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 4, b: 0, fs: 0.7 }, legF: { a: 4, b: 0, fs: 0.7 } }, { n: 0 }),
      k([100, 40], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 6, b: 0, fs: 0.7 }, legF: { a: 6, b: 0, fs: 0.7 } }, { n: 0 }),
      k([100, 40], 180, { armN: { t: [117, 6], e: 180 }, armF: { t: [83, 6], e: 180 }, legN: { a: 6, b: 0, fs: 0.7 }, legF: { a: 6, b: 0, fs: 0.7 } }, { n: 0 })
    ],
    dur: [900, 300, 1e3],
    still: 1
  },
  jumpsquat: {
    keys: [
      STAND,
      SQUAT,
      k([99, 54], 178, { armN: fk(-28, 12), armF: fk(-32, 12), legN: fk(3, 4, 26), legF: fk(0, 4, 24) }, { n: 0, ease: "out" })
    ],
    dur: [480, 260, 380],
    still: 2
  },
  birddog: {
    view: view(101.8, 150),
    keys: [
      k([95, 96.8], 104, { armN: fk(0, 0, 90), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-2, 90, -64) }, { n: 6 }),
      k([95, 96.8], 103, { armN: fk(95, 0, 96), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-88, 0, 0) }, { n: 4 }),
      k([95, 96.8], 103, { armN: fk(95, 0, 96), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-88, 0, 0) }, { n: 4 }),
      k([95, 96.8], 104, { armN: fk(0, 0, 90), armF: fk(-2, 0, 90), legN: fk(0, 90, -62), legF: fk(-2, 90, -64) }, { n: 6 }),
      k([95, 96.8], 103, { armN: fk(0, 0, 90), armF: fk(95, 0, 96), legN: fk(-88, 0, 0), legF: fk(-2, 90, -64) }, { n: 4 }),
      k([95, 96.8], 103, { armN: fk(0, 0, 90), armF: fk(95, 0, 96), legN: fk(-88, 0, 0), legF: fk(-2, 90, -64) }, { n: 4 })
    ],
    dur: [650, 700, 650, 650, 700, 650],
    still: 1
  },
  bicycle: {
    view: view(96.4),
    headFront: true,
    keys: [
      k([95, 121.4], 246, { ...BEHIND_HEAD, legN: fk(195, 100), legF: fk(128, 4) }, { n: -14 }),
      k([95, 121.4], 246, { ...BEHIND_HEAD, legN: fk(128, 4), legF: fk(195, 100) }, { n: -14 })
    ],
    dur: 520
  },
  /* ================= 瘦身操 (aerobics) ================= */
  // 原地踏步: one foot always planted; arms swing like a relaxed jog, opposite to the legs: elbows ~90°, loose fists
  // travelling from beside the hip (back) to chest height (front); shoulders lift a touch on each swing
  march: {
    view: view(102, 170),
    smooth: true,
    lag: 0.02,
    keys: [
      k([98, 72.2], 180, { armN: fk(4, 86), armF: fk(-8, 92), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 71.2], 180, { armN: fk(-34, 84), armF: fk(34, 96), legN: fk(70, 86), legF: flat(97) }, { n: 0, sh: 0.5 }),
      k([98, 72.2], 180, { armN: fk(-8, 92), armF: fk(4, 86), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 71.2], 180, { armN: fk(34, 96), armF: fk(-34, 84), legN: flat(100), legF: fk(70, 86) }, { n: 0, sh: 0.5 })
    ],
    dur: 300,
    still: 1
  },
  // 後勾腿: light jog, heel kicks up to the glute
  buttkick: {
    view: view(100, 170),
    keys: [
      k([98, 71.6], 179, { armN: fk(6, 88), armF: fk(6, 88), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 70.2], 178, { armN: fk(-28, 92), armF: fk(38, 92), legN: fk(4, 158), legF: flat(97) }, { n: 0, hop: 2.2 }),
      k([98, 71.6], 179, { armN: fk(6, 88), armF: fk(6, 88), legN: flat(100), legF: flat(97) }, { n: 0 }),
      k([98, 70.2], 178, { armN: fk(38, 92), armF: fk(-28, 92), legN: flat(100), legF: fk(4, 158) }, { n: 0, hop: 2.2 })
    ],
    dur: 210,
    smooth: true,
    lag: 0.03,
    headLag: 0.02,
    still: 1
  },
  // 踢腿拍手: arms swing down from overhead to clap at the kicking leg
  kickclap: {
    view: view(110, 188),
    keys: [
      k([96, 72.2], 180, { armN: fk(172, 8), armF: fk(168, 8), legN: flat(98), legF: flat(95) }, { n: 0 }),
      k([95, 72.6], 177, { armN: fk(44, 4), armF: fk(40, 4), legN: fk(78, 2), legF: flat(95) }, { n: 4, ease: "out" }),
      k([96, 72.2], 180, { armN: fk(172, 8), armF: fk(168, 8), legN: flat(98), legF: flat(95) }, { n: 0 }),
      k([95, 72.6], 177, { armN: fk(44, 4), armF: fk(40, 4), legN: flat(98), legF: fk(78, 2) }, { n: 4, ease: "out" })
    ],
    dur: [420, 380, 420, 380],
    lag: 0.025,
    still: 1
  },
  // 直拳連擊 (3/4 view): fighter stance, fists up by the chin, alternate straight punches and snap back to guard
  punch: {
    view: view(104, 150),
    front: true,
    yaw: ARM_YAW,
    keys: [
      bx([100, BX_Y], 180, GUARD, GUARD),
      // jab with the lead (far) hand: shoulder rolls up, slight lean into it
      bx([100.6, BX_Y], 178.5, JAB, GUARD, { ease: "out", sh: 0.8, h: 180.8 }),
      bx([100, BX_Y], 180, GUARD, GUARD),
      // cross with the rear (near) hand: back heel turns up, hips drift forward
      bx([101.6, BX_Y + 0.3], 181.5, GUARD, JAB, { ease: "out", sh: 0.8, h: 179.2 })
    ],
    dur: [170, 240, 170, 240],
    still: 3
  },
  // 上勾拳 (3/4 view): dip the knees, drive the fist up to chin height in front of the face
  uppercut: {
    view: view(104, 150),
    front: true,
    yaw: ARM_YAW,
    keys: [
      bx([100, BX_Y], 180, GUARD, GUARD),
      bx([100.4, BX_Y + 5.5], 178, UP_LOAD, GUARD, { h: 180.6 }),
      bx([100.8, BX_Y - 1], 182, UP_HIT, GUARD, { ease: "out", sh: 1, h: 179.5 }),
      bx([100, BX_Y], 180, GUARD, GUARD),
      bx([100.4, BX_Y + 5.5], 182, GUARD, UP_LOAD, { h: 179.4 }),
      bx([100.8, BX_Y - 1], 178, GUARD, UP_HIT, { ease: "out", sh: 1, h: 180.5 })
    ],
    dur: [200, 170, 260, 200, 170, 260],
    still: 5
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
    trail: [0, 1 / 8]
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
    still: 2
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
      k([91.5, 71.2], 179, { ...both(arm3(16, 30, 62, 22)), legN: air(102, 4, 0.55, -0.5), legF: ff(86.5) }, { pa: 177.5, sh: 0.4, h: 180.5 })
    ],
    dur: 225,
    still: 2
  },
  // 站姿側抬腿: hands on hips; shift the weight over the standing foot, sweep the straight leg out to the side
  sideleg: {
    view: view(100, 166),
    front: true,
    smooth: true,
    headLag: 0.02,
    keys: sym(sidelegHalf),
    dur: [300, 360, 420, 300, 300, 360, 420, 300],
    still: 2
  },
  // 站姿側提膝 (standing side crunch): knee lifts out to the side, same-side elbow crunches down to it
  sidecrunch: {
    view: view(100, 170),
    front: true,
    smooth: true,
    lag: 0.02,
    keys: sym(sidecrunchHalf),
    dur: [420, 380, 420, 380],
    still: 1
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
      k([100, hipY(100, 180, HU_N, HU_F, 1.6)], 180, { armN: HU_ARM_MID, armF: HU_ARM_MID, legN: ff(108), legF: ff(92) }, { pa: 180, h: 180 })
    ],
    dur: 300,
    still: 0
  },
  // 側弓步: wide stance, sit into one leg (knee out over the toes) with the other long, hands clasped
  sidelunge: {
    view: view(100, 162),
    front: true,
    smooth: true,
    lag: 0.02,
    keys: [sidelungeHalf[0], sidelungeHalf[1], { ...sidelungeHalf[1] }, sidelungeHalf[0], mirror(sidelungeHalf[1]), { ...mirror(sidelungeHalf[1]) }],
    dur: [560, 260, 520, 560, 260, 520],
    still: 1
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
    still: 0
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
      k([98.6, SB3], 174, { armN: onHips([98.6, SB3], 174).armN, armF: { a: 118, b: 18, rel: true }, legN: ff(106), legF: ff(94) }, { pa: 180, n: 2 })
    ],
    dur: [500, 500, 800, 450, 450, 500, 500, 800, 450, 450],
    still: 2
  }
};
for (const [k2, h] of Object.entries(DEMO_HAND)) DEMOS[k2].hand = h;

// src/data/exercises.ts
var EXERCISES = [
  {
    id: "pushup",
    name: "\u4F0F\u5730\u633A\u8EAB",
    en: "Push-up",
    group: "\u4E0A\u80A2",
    muscles: ["\u80F8\u5927\u808C", "\u4E09\u982D\u808C", "\u524D\u4E09\u89D2\u808C"],
    difficulty: 2,
    type: "reps",
    defaultReps: 12,
    kcalPerMin: 8,
    demo: "pushup",
    steps: ["\u96D9\u624B\u7565\u5BEC\u65BC\u80A9\u6490\u5730\uFF0C\u624B\u6307\u671D\u524D", "\u8EAB\u9AD4\u5F9E\u982D\u5230\u8173\u8DDF\u5448\u4E00\u76F4\u7DDA\uFF0C\u6536\u7DCA\u6838\u5FC3\u8207\u81C0\u90E8", "\u5438\u6C23\uFF0C\u5F4E\u66F2\u624B\u8098\u8B93\u80F8\u53E3\u964D\u5230\u96E2\u5730\u7D04\u4E00\u500B\u62F3\u982D", "\u5410\u6C23\uFF0C\u7528\u80F8\u90E8\u8207\u624B\u81C2\u529B\u91CF\u63A8\u56DE\u8D77\u59CB\u4F4D\u7F6E"],
    tip: "\u624B\u8098\u8207\u8EAB\u9AD4\u7D04\u5448 45 \u5EA6\uFF0C\u4E0D\u8981\u5F80\u5916\u6253\u958B\uFF1B\u505A\u4E0D\u4E86\u53EF\u6539\u6210\u8DEA\u59FF\u3002"
  },
  {
    id: "squat",
    name: "\u6DF1\u8E72",
    en: "Squat",
    group: "\u4E0B\u80A2",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u81C0\u5927\u808C", "\u817F\u5F8C\u808C"],
    difficulty: 1,
    type: "reps",
    defaultReps: 15,
    kcalPerMin: 7,
    demo: "squat",
    steps: ["\u96D9\u8173\u8207\u80A9\u540C\u5BEC\uFF0C\u8173\u5C16\u5FAE\u5FAE\u671D\u5916", "\u633A\u80F8\u6536\u8179\uFF0C\u81C0\u90E8\u5F80\u5F8C\u5750\uFF0C\u50CF\u8981\u5750\u6905\u5B50", "\u4E0B\u8E72\u81F3\u5927\u817F\u7D04\u8207\u5730\u9762\u5E73\u884C\uFF0C\u96D9\u624B\u53EF\u5F80\u524D\u5E73\u8209\u4FDD\u6301\u5E73\u8861", "\u8173\u8DDF\u8E29\u7A69\uFF0C\u81C0\u90E8\u767C\u529B\u7AD9\u8D77"],
    tip: "\u819D\u84CB\u65B9\u5411\u8207\u8173\u5C16\u4E00\u81F4\uFF0C\u907F\u514D\u819D\u84CB\u5167\u593E\uFF1B\u5168\u7A0B\u8173\u8DDF\u4E0D\u96E2\u5730\u3002"
  },
  {
    id: "lunge",
    name: "\u5F13\u7BAD\u6B65",
    en: "Lunge",
    group: "\u4E0B\u80A2",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u81C0\u5927\u808C", "\u5C0F\u817F"],
    difficulty: 2,
    type: "reps",
    defaultReps: 12,
    kcalPerMin: 7,
    demo: "lunge",
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u624B\u53C9\u8170", "\u4E00\u8173\u5411\u524D\u8DE8\u4E00\u5927\u6B65", "\u8EAB\u9AD4\u5782\u76F4\u4E0B\u964D\uFF0C\u524D\u5F8C\u819D\u84CB\u90FD\u7D04\u5448 90 \u5EA6", "\u524D\u8173\u767C\u529B\u63A8\u56DE\u8D77\u59CB\u4F4D\u7F6E\uFF0C\u5DE6\u53F3\u4EA4\u66FF"],
    tip: "\u4E0A\u534A\u8EAB\u4FDD\u6301\u76F4\u7ACB\uFF0C\u524D\u819D\u4E0D\u8981\u660E\u986F\u8D85\u904E\u8173\u5C16\u592A\u591A\u3001\u4E5F\u4E0D\u8981\u5167\u5012\u3002"
  },
  {
    id: "plank",
    name: "\u5E73\u677F\u652F\u6490",
    en: "Plank",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u76F4\u808C", "\u8179\u6A6B\u808C", "\u80A9\u90E8\u7A69\u5B9A\u808C\u7FA4"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 4,
    demo: "plank",
    steps: ["\u524D\u81C2\u6490\u5730\uFF0C\u624B\u8098\u4F4D\u65BC\u80A9\u8180\u6B63\u4E0B\u65B9", "\u96D9\u8173\u5411\u5F8C\u4F38\u76F4\uFF0C\u8173\u5C16\u6490\u5730", "\u6536\u7DCA\u8179\u90E8\u8207\u81C0\u90E8\uFF0C\u8EAB\u9AD4\u5448\u4E00\u76F4\u7DDA", "\u4FDD\u6301\u81EA\u7136\u547C\u5438\uFF0C\u7DAD\u6301\u6307\u5B9A\u6642\u9593"],
    tip: "\u4E0D\u8981\u584C\u8170\u6216\u628A\u5C41\u80A1\u7FF9\u592A\u9AD8\uFF0C\u773C\u775B\u770B\u5411\u96D9\u624B\u524D\u65B9\u5730\u9762\u3002"
  },
  {
    id: "burpee",
    name: "\u6CE2\u6BD4\u8DF3",
    en: "Burpee",
    group: "\u5168\u8EAB",
    muscles: ["\u5168\u8EAB", "\u5FC3\u80BA"],
    difficulty: 3,
    type: "reps",
    defaultReps: 10,
    kcalPerMin: 12,
    demo: "burpee",
    steps: ["\u7AD9\u59FF\u958B\u59CB\uFF0C\u8E72\u4E0B\u96D9\u624B\u6490\u5730", "\u96D9\u8173\u5F80\u5F8C\u8DF3\u6210\u9AD8\u68D2\u5F0F", "\u96D9\u8173\u8DF3\u56DE\u624B\u7684\u9644\u8FD1", "\u5411\u4E0A\u8DF3\u8D77\uFF0C\u96D9\u624B\u8209\u904E\u982D\u9802"],
    tip: "\u5148\u6C42\u52D5\u4F5C\u6D41\u66A2\u518D\u6C42\u901F\u5EA6\uFF1B\u60F3\u52A0\u5F37\u53EF\u5728\u68D2\u5F0F\u6642\u52A0\u4E00\u4E0B\u4F0F\u5730\u633A\u8EAB\u3002"
  },
  {
    id: "climber",
    name: "\u767B\u5C71\u8005",
    en: "Mountain Climber",
    group: "\u5168\u8EAB",
    muscles: ["\u6838\u5FC3", "\u9AD6\u5C48\u808C", "\u80A9\u90E8", "\u5FC3\u80BA"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 10,
    demo: "climber",
    steps: ["\u9AD8\u68D2\u5F0F\u6E96\u5099\uFF0C\u96D9\u624B\u5728\u80A9\u8180\u6B63\u4E0B\u65B9", "\u6536\u7DCA\u6838\u5FC3\uFF0C\u5C07\u4E00\u5074\u819D\u84CB\u5FEB\u901F\u62C9\u5411\u80F8\u53E3", "\u63DB\u8173\uFF0C\u50CF\u5728\u539F\u5730\u8DD1\u6B65", "\u7DAD\u6301\u81C0\u90E8\u9AD8\u5EA6\u7A69\u5B9A\uFF0C\u6301\u7E8C\u4EA4\u66FF"],
    tip: "\u80A9\u8180\u4FDD\u6301\u5728\u624B\u8155\u6B63\u4E0A\u65B9\uFF0C\u81C0\u90E8\u4E0D\u8981\u4E0A\u4E0B\u6643\u52D5\u3002"
  },
  {
    id: "bridge",
    name: "\u81C0\u6A4B",
    en: "Glute Bridge",
    group: "\u4E0B\u80A2",
    muscles: ["\u81C0\u5927\u808C", "\u817F\u5F8C\u808C", "\u4E0B\u80CC"],
    difficulty: 1,
    type: "reps",
    defaultReps: 15,
    kcalPerMin: 5,
    demo: "bridge",
    steps: ["\u4EF0\u8EBA\uFF0C\u5C48\u819D\u96D9\u8173\u8E29\u5730\uFF0C\u8207\u9AD6\u540C\u5BEC", "\u96D9\u624B\u653E\u8EAB\u9AD4\u5169\u5074", "\u81C0\u90E8\u593E\u7DCA\uFF0C\u628A\u9AA8\u76C6\u5F80\u4E0A\u63A8\u5230\u80A9\u8180\u3001\u9AD6\u3001\u819D\u6210\u4E00\u76F4\u7DDA", "\u9802\u7AEF\u505C 1 \u79D2\uFF0C\u518D\u6162\u6162\u653E\u4E0B"],
    tip: "\u7528\u81C0\u90E8\u51FA\u529B\u800C\u4E0D\u662F\u8170\uFF1B\u8173\u8DDF\u8E29\u5730\u53EF\u4EE5\u66F4\u6709\u611F\u3002"
  },
  {
    id: "situp",
    name: "\u4EF0\u81E5\u8D77\u5750",
    en: "Sit-up",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u76F4\u808C", "\u9AD6\u5C48\u808C"],
    difficulty: 2,
    type: "reps",
    defaultReps: 15,
    kcalPerMin: 6,
    demo: "situp",
    steps: ["\u4EF0\u8EBA\u5C48\u819D\uFF0C\u96D9\u8173\u8E29\u5730", "\u96D9\u624B\u4EA4\u53C9\u653E\u80F8\u524D", "\u5410\u6C23\uFF0C\u7528\u8179\u90E8\u529B\u91CF\u6372\u8D77\u4E0A\u534A\u8EAB\u76F4\u5230\u5750\u8D77", "\u5438\u6C23\uFF0C\u6162\u6162\u4E00\u7BC0\u4E00\u7BC0\u8EBA\u56DE\u5730\u9762"],
    tip: "\u4E0D\u8981\u7528\u624B\u62C9\u8116\u5B50\u6216\u7529\u52D5\u8EAB\u9AD4\u501F\u529B\u3002"
  },
  {
    id: "crunch",
    name: "\u6372\u8179",
    en: "Crunch",
    group: "\u6838\u5FC3",
    muscles: ["\u4E0A\u8179", "\u8179\u76F4\u808C"],
    difficulty: 1,
    type: "reps",
    defaultReps: 20,
    kcalPerMin: 5,
    demo: "crunch",
    steps: ["\u4EF0\u8EBA\u5C48\u819D\uFF0C\u96D9\u8173\u8E29\u5730", "\u96D9\u624B\u8F15\u653E\u80F8\u524D\u6216\u8033\u5074", "\u5410\u6C23\uFF0C\u6372\u8D77\u4E0A\u80CC\u8B93\u80A9\u80DB\u96E2\u5730", "\u9802\u7AEF\u505C\u4E00\u4E0B\uFF0C\u6162\u6162\u653E\u56DE"],
    tip: "\u4E0B\u80CC\u59CB\u7D42\u8CBC\u5730\uFF0C\u52D5\u4F5C\u5E45\u5EA6\u5C0F\u4F46\u8981\u611F\u53D7\u8179\u90E8\u6536\u7E2E\u3002"
  },
  {
    id: "jack",
    name: "\u958B\u5408\u8DF3",
    en: "Jumping Jack",
    group: "\u5168\u8EAB",
    muscles: ["\u5FC3\u80BA", "\u5C0F\u817F", "\u80A9\u90E8"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 9,
    demo: "jack",
    steps: ["\u96D9\u8173\u4F75\u650F\u7AD9\u7ACB\uFF0C\u96D9\u624B\u653E\u8EAB\u5074", "\u8DF3\u8D77\u6642\u96D9\u8173\u5411\u5916\u6253\u958B\uFF0C\u96D9\u624B\u7531\u5074\u908A\u8209\u904E\u982D\u9802", "\u518D\u8DF3\u56DE\u4F75\u8173\u3001\u96D9\u624B\u653E\u4E0B", "\u4FDD\u6301\u7BC0\u594F\u9023\u7E8C\u9032\u884C"],
    tip: "\u7528\u524D\u8173\u638C\u8F15\u5DE7\u843D\u5730\uFF0C\u819D\u84CB\u5FAE\u5F4E\u7DE9\u885D\u3002"
  },
  {
    id: "superman",
    name: "\u8D85\u4EBA\u5F0F",
    en: "Superman",
    group: "\u6838\u5FC3",
    muscles: ["\u8C4E\u810A\u808C", "\u81C0\u5927\u808C", "\u5F8C\u80A9"],
    difficulty: 1,
    type: "reps",
    defaultReps: 12,
    kcalPerMin: 4,
    demo: "superman",
    steps: ["\u4FEF\u81E5\uFF0C\u96D9\u624B\u5411\u524D\u4F38\u76F4", "\u5438\u6C23\uFF0C\u540C\u6642\u62AC\u8D77\u96D9\u624B\u3001\u80F8\u53E3\u8207\u96D9\u817F", "\u5728\u6700\u9AD8\u9EDE\u505C\u7559 1\u20132 \u79D2", "\u5410\u6C23\uFF0C\u6162\u6162\u653E\u4E0B"],
    tip: "\u8116\u5B50\u4FDD\u6301\u4E2D\u7ACB\uFF0C\u773C\u775B\u770B\u5730\u9762\uFF0C\u4E0D\u8981\u904E\u5EA6\u62AC\u982D\u3002"
  },
  {
    id: "sideplank",
    name: "\u5074\u68D2\u5F0F",
    en: "Side Plank",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u659C\u808C", "\u81C0\u4E2D\u808C", "\u80A9\u90E8"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 4,
    demo: "sideplank",
    steps: ["\u5074\u8EBA\uFF0C\u4E0B\u65B9\u624B\u8098\u6490\u5728\u80A9\u8180\u6B63\u4E0B\u65B9", "\u96D9\u8173\u4F38\u76F4\u758A\u653E", "\u62AC\u8D77\u81C0\u90E8\uFF0C\u8EAB\u9AD4\u5448\u4E00\u76F4\u7DDA", "\u4E0A\u65B9\u624B\u53EF\u63D2\u8170\u6216\u4F38\u5411\u5929\u7A7A\uFF0C\u7DAD\u6301\u6642\u9593\u5F8C\u63DB\u908A"],
    tip: "\u81C0\u90E8\u4E0D\u8981\u5F80\u5F8C\u5750\u6216\u4E0B\u6C89\uFF0C\u60F3\u50CF\u8EAB\u9AD4\u88AB\u593E\u5728\u5169\u7247\u73BB\u7483\u4E4B\u9593\u3002"
  },
  {
    id: "dips",
    name: "\u6905\u5B50\u6490\u9AD4",
    en: "Chair Dip",
    group: "\u4E0A\u80A2",
    muscles: ["\u4E09\u982D\u808C", "\u524D\u4E09\u89D2\u808C", "\u80F8\u90E8"],
    difficulty: 2,
    type: "reps",
    defaultReps: 12,
    kcalPerMin: 6,
    demo: "dips",
    steps: ["\u80CC\u5C0D\u7A69\u56FA\u7684\u6905\u5B50\uFF0C\u96D9\u624B\u6490\u5728\u6905\u7DE3\uFF0C\u624B\u6307\u671D\u524D", "\u96D9\u8173\u5F80\u524D\u4F38\uFF0C\u81C0\u90E8\u96E2\u958B\u6905\u5B50", "\u5F4E\u66F2\u624B\u8098\u8B93\u8EAB\u9AD4\u4E0B\u964D\u81F3\u4E0A\u81C2\u7D04\u8207\u5730\u9762\u5E73\u884C", "\u7528\u4E09\u982D\u808C\u628A\u8EAB\u9AD4\u63A8\u56DE"],
    tip: "\u80A9\u8180\u4E0D\u8981\u8073\u8D77\uFF0C\u81C0\u90E8\u8CBC\u8FD1\u6905\u5B50\uFF1B\u6905\u5B50\u52D9\u5FC5\u7A69\u56FA\u4E0D\u6ED1\u52D5\u3002"
  },
  {
    id: "highknees",
    name: "\u9AD8\u62AC\u817F",
    en: "High Knees",
    group: "\u5168\u8EAB",
    muscles: ["\u5FC3\u80BA", "\u9AD6\u5C48\u808C", "\u5C0F\u817F"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 10,
    demo: "highknees",
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u624B\u653E\u5728\u8170\u90E8\u9AD8\u5EA6", "\u539F\u5730\u5FEB\u901F\u4EA4\u66FF\u62AC\u819D\uFF0C\u819D\u84CB\u62AC\u81F3\u9AD6\u90E8\u9AD8\u5EA6", "\u624B\u81C2\u8DDF\u8457\u524D\u5F8C\u64FA\u52D5", "\u4FDD\u6301\u4E0A\u8EAB\u633A\u76F4\u8207\u7BC0\u594F"],
    tip: "\u7528\u524D\u8173\u638C\u8457\u5730\uFF0C\u6838\u5FC3\u6536\u7DCA\uFF0C\u4E0D\u8981\u5F80\u5F8C\u4EF0\u3002"
  },
  {
    id: "wallsit",
    name: "\u9760\u7246\u5750",
    en: "Wall Sit",
    group: "\u4E0B\u80A2",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u81C0\u5927\u808C"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 5,
    demo: "wallsit",
    steps: ["\u80CC\u9760\u7246\u7AD9\u7ACB\uFF0C\u96D9\u8173\u5F80\u524D\u7D04\u4E00\u6B65", "\u80CC\u90E8\u8CBC\u7246\u5411\u4E0B\u6ED1\uFF0C\u76F4\u5230\u5927\u817F\u8207\u5730\u9762\u5E73\u884C", "\u819D\u84CB\u7D04 90 \u5EA6\u3001\u5728\u8173\u8E1D\u6B63\u4E0A\u65B9", "\u7DAD\u6301\u59FF\u52E2\u4E26\u4FDD\u6301\u547C\u5438"],
    tip: "\u6574\u500B\u80CC\u90E8\u8CBC\u7246\uFF0C\u91CD\u5FC3\u653E\u5728\u8173\u8DDF\uFF0C\u819D\u84CB\u4E0D\u8981\u5167\u593E\u3002"
  },
  {
    id: "pullup",
    name: "\u5F15\u9AD4\u5411\u4E0A",
    en: "Pull-up",
    group: "\u4E0A\u80A2",
    muscles: ["\u80CC\u95CA\u808C", "\u4E8C\u982D\u808C", "\u5F8C\u4E09\u89D2\u808C"],
    difficulty: 3,
    type: "reps",
    defaultReps: 6,
    kcalPerMin: 8,
    demo: "pullup",
    steps: ["\u6B63\u624B\u63E1\u55AE\u69D3\uFF0C\u96D9\u624B\u7565\u5BEC\u65BC\u80A9", "\u8EAB\u9AD4\u61F8\u7A7A\uFF0C\u80A9\u80DB\u5148\u5F80\u4E0B\u6536", "\u7528\u80CC\u90E8\u529B\u91CF\u628A\u8EAB\u9AD4\u62C9\u9AD8\uFF0C\u76F4\u5230\u4E0B\u5DF4\u8D85\u904E\u55AE\u69D3", "\u6709\u63A7\u5236\u5730\u6162\u6162\u653E\u4E0B\u5230\u624B\u81C2\u4F38\u76F4"],
    tip: "\u907F\u514D\u6643\u52D5\u501F\u529B\uFF1B\u62C9\u4E0D\u4E0A\u53BB\u53EF\u5148\u505A\u96E2\u5FC3\uFF08\u6162\u6162\u653E\u4E0B\uFF09\u6216\u5F48\u529B\u5E36\u8F14\u52A9\u3002"
  },
  {
    id: "diamond",
    name: "\u947D\u77F3\u4F0F\u5730\u633A\u8EAB",
    en: "Diamond Push-up",
    group: "\u4E0A\u80A2",
    muscles: ["\u4E09\u982D\u808C", "\u5167\u5074\u80F8\u808C"],
    difficulty: 3,
    type: "reps",
    defaultReps: 8,
    kcalPerMin: 8,
    demo: "diamond",
    steps: ["\u96D9\u624B\u5728\u80F8\u53E3\u4E0B\u65B9\u4F75\u650F\uFF0C\u62C7\u6307\u8207\u98DF\u6307\u570D\u6210\u947D\u77F3\u5F62", "\u8EAB\u9AD4\u5448\u4E00\u76F4\u7DDA\uFF0C\u6536\u7DCA\u6838\u5FC3", "\u5F4E\u66F2\u624B\u8098\u8B93\u80F8\u53E3\u9760\u8FD1\u96D9\u624B", "\u7528\u624B\u81C2\u529B\u91CF\u63A8\u56DE\u8D77\u59CB\u4F4D\u7F6E"],
    tip: "\u624B\u8098\u8CBC\u8FD1\u8EAB\u9AD4\u5F80\u5F8C\u5F4E\uFF0C\u6BD4\u4E00\u822C\u4F0F\u5730\u633A\u8EAB\u66F4\u5F37\u8ABF\u4E09\u982D\u808C\u3002"
  },
  {
    id: "jumpsquat",
    name: "\u8DF3\u8E72",
    en: "Jump Squat",
    group: "\u4E0B\u80A2",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u81C0\u5927\u808C", "\u5FC3\u80BA"],
    difficulty: 2,
    type: "reps",
    defaultReps: 12,
    kcalPerMin: 11,
    demo: "jumpsquat",
    steps: ["\u96D9\u8173\u8207\u80A9\u540C\u5BEC\u7AD9\u7ACB", "\u4E0B\u8E72\u81F3\u5927\u817F\u7D04\u8207\u5730\u9762\u5E73\u884C", "\u7206\u767C\u529B\u5411\u4E0A\u8DF3\u8D77\uFF0C\u96D9\u624B\u5F80\u4E0B\u64FA", "\u843D\u5730\u6642\u5C48\u819D\u7DE9\u885D\uFF0C\u76F4\u63A5\u63A5\u4E0B\u4E00\u4E0B"],
    tip: "\u843D\u5730\u8981\u8F15\u3001\u819D\u84CB\u5C0D\u9F4A\u8173\u5C16\uFF1B\u819D\u84CB\u4E0D\u9069\u53EF\u6539\u56DE\u4E00\u822C\u6DF1\u8E72\u3002"
  },
  {
    id: "birddog",
    name: "\u9CE5\u72D7\u5F0F",
    en: "Bird Dog",
    group: "\u6838\u5FC3",
    muscles: ["\u6838\u5FC3", "\u4E0B\u80CC", "\u81C0\u90E8"],
    difficulty: 1,
    type: "reps",
    defaultReps: 10,
    kcalPerMin: 4,
    demo: "birddog",
    steps: ["\u56DB\u8DB3\u8DEA\u59FF\uFF0C\u624B\u5728\u80A9\u8180\u4E0B\u65B9\u3001\u819D\u84CB\u5728\u9AD6\u90E8\u4E0B\u65B9", "\u6536\u7DCA\u6838\u5FC3\uFF0C\u540C\u6642\u4F38\u76F4\u53F3\u624B\u8207\u5DE6\u8173", "\u8EAB\u9AD4\u4FDD\u6301\u7A69\u5B9A\u4E0D\u65CB\u8F49\uFF0C\u505C 2 \u79D2", "\u6536\u56DE\u5F8C\u63DB\u908A\uFF0C\u5DE6\u53F3\u7B97\u4E00\u4E0B"],
    tip: "\u60F3\u50CF\u80CC\u4E0A\u653E\u4E86\u4E00\u676F\u6C34\uFF0C\u52D5\u4F5C\u6162\u800C\u7A69\u3002"
  },
  {
    id: "bicycle",
    name: "\u6372\u8179\u8173\u8E0F\u8ECA",
    en: "Bicycle Crunch",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u659C\u808C", "\u8179\u76F4\u808C"],
    difficulty: 2,
    type: "reps",
    defaultReps: 20,
    kcalPerMin: 7,
    demo: "bicycle",
    steps: ["\u4EF0\u8EBA\uFF0C\u96D9\u624B\u8F15\u653E\u8033\u5074\uFF0C\u96D9\u8173\u62AC\u96E2\u5730\u9762", "\u6372\u8D77\u4E0A\u80CC\uFF0C\u53F3\u624B\u8098\u8F49\u5411\u5DE6\u819D\uFF0C\u540C\u6642\u4F38\u76F4\u53F3\u8173", "\u63DB\u908A\uFF0C\u5DE6\u624B\u8098\u8F49\u5411\u53F3\u819D", "\u50CF\u8E29\u8173\u8E0F\u8ECA\u4E00\u6A23\u6301\u7E8C\u4EA4\u66FF"],
    tip: "\u91CD\u9EDE\u662F\u8EC0\u5E79\u7684\u65CB\u8F49\uFF0C\u4E0D\u662F\u7528\u624B\u62C9\u982D\uFF1B\u4E0B\u80CC\u8CBC\u5730\u3002"
  },
  /* ================= 瘦身操 ================= */
  {
    id: "march",
    name: "\u539F\u5730\u8E0F\u6B65",
    en: "March in Place",
    group: "\u5168\u8EAB",
    muscles: ["\u9AD6\u5C48\u808C", "\u80A1\u56DB\u982D\u808C", "\u5FC3\u80BA"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 45,
    kcalPerMin: 5,
    demo: "march",
    cat: "aero",
    quiet: true,
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u8173\u8207\u9AD6\u540C\u5BEC\uFF0C\u6838\u5FC3\u5FAE\u6536", "\u4EA4\u66FF\u62AC\u8D77\u819D\u84CB\uFF0C\u5927\u817F\u62AC\u5230\u7D04\u8207\u5730\u9762\u5448 45\uFF5E90 \u5EA6", "\u624B\u8098\u5F4E\u66F2\u7D04 90 \u5EA6\uFF0C\u8DDF\u8457\u5C0D\u5074\u8173\u524D\u5F8C\u64FA\u52D5", "\u4FDD\u6301\u7BC0\u594F\u8207\u81EA\u7136\u547C\u5438\uFF0C\u8173\u638C\u8F15\u8F15\u843D\u5730"],
    tip: "\u6700\u9069\u5408\u71B1\u8EAB\u8207\u7DE9\u548C\uFF1B\u60F3\u63D0\u9AD8\u5F37\u5EA6\u5C31\u62AC\u9AD8\u819D\u84CB\u3001\u52A0\u5FEB\u7BC0\u594F\u3002"
  },
  {
    id: "buttkick",
    name: "\u5F8C\u52FE\u817F",
    en: "Butt Kicks",
    group: "\u4E0B\u80A2",
    muscles: ["\u817F\u5F8C\u808C", "\u5C0F\u817F", "\u5FC3\u80BA"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 8,
    demo: "buttkick",
    cat: "aero",
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u624B\u63E1\u62F3\u653E\u5728\u8170\u5074", "\u539F\u5730\u5C0F\u8DD1\uFF0C\u8173\u8DDF\u5F80\u5F8C\u52FE\u5411\u81C0\u90E8", "\u5927\u817F\u4FDD\u6301\u671D\u4E0B\uFF0C\u53EA\u6709\u5C0F\u817F\u5F80\u5F8C\u8E22", "\u624B\u81C2\u81EA\u7136\u524D\u5F8C\u64FA\u52D5\uFF0C\u524D\u8173\u638C\u8F15\u5DE7\u8457\u5730"],
    tip: "\u6015\u5435\u5230\u6A13\u4E0B\u53EF\u6539\u6210\u4E0D\u8DF3\u7684\u300C\u4EA4\u66FF\u52FE\u817F\u300D\uFF1A\u4E00\u8173\u7AD9\u7A69\uFF0C\u53E6\u4E00\u8173\u5F80\u5F8C\u52FE\u3002"
  },
  {
    id: "kickclap",
    name: "\u8E22\u817F\u62CD\u624B",
    en: "Kick & Clap",
    group: "\u5168\u8EAB",
    muscles: ["\u9AD6\u5C48\u808C", "\u80A1\u56DB\u982D\u808C", "\u6838\u5FC3"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 6,
    demo: "kickclap",
    cat: "aero",
    quiet: true,
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u624B\u8209\u9AD8\u904E\u982D", "\u4E00\u8173\u5F80\u524D\u8E22\u9AD8\uFF0C\u819D\u84CB\u76E1\u91CF\u6253\u76F4", "\u96D9\u624B\u540C\u6642\u5F80\u4E0B\u64FA\uFF0C\u5728\u817F\u7684\u4E0A\u65B9\u6216\u4E0B\u65B9\u62CD\u624B", "\u653E\u4E0B\u8173\u3001\u96D9\u624B\u56DE\u5230\u982D\u9802\uFF0C\u63DB\u8173\u4EA4\u66FF"],
    tip: "\u8E22\u817F\u9AD8\u5EA6\u4EE5\u8212\u670D\u70BA\u4E3B\uFF0C\u4E0A\u534A\u8EAB\u4FDD\u6301\u633A\u76F4\uFF0C\u4E0D\u8981\u5F4E\u8170\u53BB\u8FFD\u8173\u3002"
  },
  {
    id: "punch",
    name: "\u76F4\u62F3\u9023\u64CA",
    en: "Jab-Cross Punches",
    group: "\u4E0A\u80A2",
    muscles: ["\u80A9\u90E8", "\u4E09\u982D\u808C", "\u6838\u5FC3"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 7,
    demo: "punch",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u524D\u5F8C\u7AD9\u958B\u3001\u819D\u84CB\u5FAE\u5F4E\uFF0C\u96D9\u62F3\u8B77\u5728\u4E0B\u5DF4\u524D", "\u524D\u624B\u5FEB\u901F\u5411\u524D\u51FA\u62F3\uFF0C\u624B\u81C2\u4F38\u76F4\u5F8C\u7ACB\u523B\u6536\u56DE", "\u63DB\u5F8C\u624B\u51FA\u62F3\uFF0C\u5F8C\u8173\u8DDF\u53EF\u5FAE\u5FAE\u8F49\u52D5\u5E36\u52D5\u8EAB\u9AD4", "\u5DE6\u53F3\u4EA4\u66FF\uFF0C\u51FA\u62F3\u5410\u6C23\uFF0C\u53E6\u4E00\u624B\u59CB\u7D42\u8B77\u81C9"],
    tip: "\u51FA\u62F3\u6642\u624B\u8098\u4E0D\u8981\u5B8C\u5168\u9396\u6B7B\uFF1B\u7528\u8179\u90E8\u8F49\u52D5\u5E36\u529B\uFF0C\u6253\u8D77\u4F86\u66F4\u6709\u52C1\u4E5F\u66F4\u71C3\u8102\u3002"
  },
  {
    id: "uppercut",
    name: "\u4E0A\u52FE\u62F3",
    en: "Uppercuts",
    group: "\u4E0A\u80A2",
    muscles: ["\u4E8C\u982D\u808C", "\u80A9\u90E8", "\u8179\u659C\u808C"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 7,
    demo: "uppercut",
    cat: "aero",
    quiet: true,
    steps: ["\u62F3\u64CA\u7AD9\u59FF\uFF0C\u96D9\u62F3\u8B77\u5728\u4E0B\u5DF4\u524D", "\u819D\u84CB\u5FAE\u8E72\uFF0C\u4E00\u624B\u62F3\u982D\u5F80\u4E0B\u653E\u5230\u8170\u7684\u9AD8\u5EA6", "\u96D9\u817F\u8E6C\u76F4\uFF0C\u540C\u6642\u7531\u4E0B\u5F80\u4E0A\u63EE\u62F3\u5230\u4E0B\u5DF4\u9AD8\u5EA6", "\u6536\u56DE\u8B77\u81C9\uFF0C\u63DB\u624B\u4EA4\u66FF"],
    tip: "\u529B\u91CF\u5F9E\u817F\u548C\u8170\u5F80\u4E0A\u50B3\uFF0C\u624B\u8098\u4FDD\u6301\u7D04 90 \u5EA6\u5F4E\u66F2\uFF0C\u4E0D\u8981\u5F80\u5916\u7529\u3002"
  },
  {
    id: "armcircle",
    name: "\u624B\u81C2\u7E5E\u5708",
    en: "Arm Circles",
    group: "\u4E0A\u80A2",
    muscles: ["\u4E09\u89D2\u808C", "\u659C\u65B9\u808C"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 3,
    demo: "armcircle",
    cat: "aero",
    quiet: true,
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u8173\u8207\u80A9\u540C\u5BEC\uFF0C\u819D\u84CB\u5FAE\u5F4E", "\u96D9\u624B\u5F80\u5169\u5074\u5E73\u8209\u5230\u80A9\u8180\u9AD8\u5EA6\uFF0C\u624B\u8098\u4F38\u76F4\u4F46\u4E0D\u9396\u6B7B", "\u7531\u80A9\u8180\u5E36\u52D5\uFF0C\u96D9\u624B\u5F80\u524D\u5927\u5E45\u5EA6\u7E5E\u5708\uFF08\u7D04 40\u201350 \u516C\u5206\uFF09\uFF0C\u6BCF\u5708\u7D04 1 \u79D2\uFF0C\u4E0D\u8981\u7529\u592A\u5FEB", "\u7E5E 4 \u5708\u5F8C\u63DB\u65B9\u5411\u5F80\u5F8C\u7E5E\uFF0C\u8EAB\u9AD4\u4FDD\u6301\u7A69\u5B9A\u3001\u80A9\u8180\u653E\u9B06"],
    tip: "\u5F88\u9069\u5408\u7576\u71B1\u8EAB\uFF0C\u80FD\u6D3B\u52D5\u80A9\u95DC\u7BC0\u3001\u8B93\u4E0A\u534A\u8EAB\u6696\u8D77\u4F86\u3002"
  },
  {
    id: "stepjack",
    name: "\u5074\u8E0F\u958B\u5408",
    en: "Step Jacks",
    group: "\u5168\u8EAB",
    muscles: ["\u80A9\u90E8", "\u81C0\u4E2D\u808C", "\u5FC3\u80BA"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 6,
    demo: "stepjack",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u4F75\u650F\u7AD9\u7ACB\uFF0C\u96D9\u624B\u653E\u8EAB\u5074", "\u4E00\u8173\u5F80\u5074\u908A\u8E0F\u51FA\uFF0C\u540C\u6642\u96D9\u624B\u5F9E\u5074\u908A\u8209\u904E\u982D\u9802", "\u6536\u8173\u56DE\u5230\u4E2D\u9593\u3001\u96D9\u624B\u653E\u4E0B", "\u63DB\u53E6\u4E00\u8173\u5F80\u5074\u908A\u8E0F\uFF0C\u5DE6\u53F3\u4EA4\u66FF"],
    tip: "\u9019\u662F\u4E0D\u8DF3\u8E8D\u7684\u958B\u5408\u8DF3\uFF0C\u5B89\u975C\u53C8\u8B77\u819D\uFF1B\u60F3\u52A0\u5F37\u5C31\u52A0\u5FEB\u901F\u5EA6\u6216\u8E0F\u5F97\u66F4\u5BEC\u3002"
  },
  {
    id: "steptouch",
    name: "\u5074\u4F75\u6B65",
    en: "Step Touch",
    group: "\u5168\u8EAB",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u5927\u817F\u5167\u5074", "\u5FC3\u80BA"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 45,
    kcalPerMin: 5,
    demo: "steptouch",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u4F75\u650F\uFF0C\u819D\u84CB\u5FAE\u5F4E", "\u53F3\u8173\u5F80\u53F3\u8DE8\u4E00\u5927\u6B65\uFF0C\u96D9\u624B\u5F80\u5169\u5074\u6253\u958B", "\u5DE6\u8173\u8DDF\u4E0A\u9EDE\u5730\uFF0C\u96D9\u624B\u5728\u80F8\u524D\u62CD\u624B", "\u518D\u5F80\u5DE6\u8DE8\u6B65\u3001\u53F3\u8173\u9EDE\u5730\uFF0C\u5DE6\u53F3\u4F86\u56DE"],
    tip: "\u819D\u84CB\u4FDD\u6301\u5FAE\u5F4E\u3001\u91CD\u5FC3\u653E\u4F4E\uFF0C\u8DE8\u6B65\u8D8A\u5927\u8D8A\u71C3\u8102\uFF1B\u8DDF\u8457\u97F3\u6A02\u7BC0\u594F\u505A\u6700\u6709\u8DA3\u3002"
  },
  {
    id: "sideleg",
    name: "\u7AD9\u59FF\u5074\u62AC\u817F",
    en: "Standing Side Leg Raise",
    group: "\u4E0B\u80A2",
    muscles: ["\u81C0\u4E2D\u808C", "\u8179\u659C\u808C"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 4,
    demo: "sideleg",
    cat: "aero",
    quiet: true,
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u624B\u63D2\u8170", "\u4E00\u8173\u4F38\u76F4\u5F80\u5074\u908A\u62AC\u8D77\uFF0C\u8173\u5C16\u671D\u524D", "\u62AC\u5230\u7D04 30\uFF5E45 \u5EA6\uFF0C\u611F\u53D7\u81C0\u90E8\u5916\u5074\u51FA\u529B", "\u6162\u6162\u653E\u4E0B\uFF0C\u63DB\u8173\u4EA4\u66FF"],
    tip: "\u4E0A\u534A\u8EAB\u4E0D\u8981\u5F80\u53E6\u4E00\u5074\u5012\u592A\u591A\uFF1B\u7AD9\u4E0D\u7A69\u53EF\u4EE5\u4E00\u624B\u6276\u7246\u6216\u6905\u80CC\u3002"
  },
  {
    id: "sidecrunch",
    name: "\u7AD9\u59FF\u5074\u63D0\u819D",
    en: "Standing Side Crunch",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u659C\u808C", "\u9AD6\u5C48\u808C"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 6,
    demo: "sidecrunch",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u7565\u5BEC\u65BC\u80A9\uFF0C\u96D9\u624B\u653E\u5728\u982D\u5F8C\u3001\u624B\u8098\u6253\u958B", "\u4E00\u8173\u819D\u84CB\u5F80\u5074\u908A\u62AC\u8D77", "\u540C\u6642\u4E0A\u534A\u8EAB\u5F80\u540C\u5074\u5F4E\uFF0C\u624B\u8098\u5F80\u4E0B\u9760\u8FD1\u819D\u84CB", "\u56DE\u5230\u7AD9\u59FF\uFF0C\u63DB\u908A\u4EA4\u66FF"],
    tip: "\u7528\u5074\u8179\u7684\u529B\u91CF\u53BB\u300C\u593E\u300D\uFF0C\u4E0D\u8981\u53EA\u662F\u4F4E\u982D\uFF1B\u624B\u8F15\u6276\u982D\u90E8\uFF0C\u4E0D\u8981\u62C9\u8116\u5B50\u3002"
  },
  {
    id: "hula",
    name: "\u64FA\u81C0\u626D\u8170",
    en: "Hip Sway",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u659C\u808C", "\u8179\u808C"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 4,
    demo: "hula",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u7565\u5BEC\u65BC\u80A9\uFF0C\u819D\u84CB\u653E\u9B06\u5FAE\u5F4E", "\u96D9\u624B\u5F80\u5169\u5074\u6253\u958B\uFF0C\u50CF\u8DF3\u8349\u88D9\u821E", "\u9AA8\u76C6\u5DE6\u53F3\u64FA\u52D5\uFF0C\u80A9\u8180\u76E1\u91CF\u4FDD\u6301\u5728\u4E2D\u9593", "\u624B\u81C2\u8DDF\u8457\u7BC0\u594F\u50CF\u6CE2\u6D6A\u4E00\u6A23\u4E0A\u4E0B\u64FA\u52D5"],
    tip: "\u52D5\u7684\u662F\u8170\u548C\u9AA8\u76C6\uFF0C\u4E0D\u662F\u6574\u500B\u8EAB\u9AD4\u5DE6\u53F3\u6643\uFF1B\u53EF\u4EE5\u52A0\u4E0A\u756B\u5708\u64FA\u52D5\u3002"
  },
  {
    id: "sidelunge",
    name: "\u5074\u5F13\u6B65",
    en: "Side Lunge",
    group: "\u4E0B\u80A2",
    muscles: ["\u80A1\u56DB\u982D\u808C", "\u81C0\u808C", "\u5927\u817F\u5167\u5074"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 7,
    demo: "sidelunge",
    cat: "aero",
    quiet: true,
    steps: ["\u96D9\u8173\u6253\u958B\u7D04\u5169\u500D\u80A9\u5BEC\uFF0C\u8173\u5C16\u5FAE\u5FAE\u671D\u5916", "\u96D9\u624B\u5728\u80F8\u524D\u5408\u63E1\uFF0C\u91CD\u5FC3\u79FB\u5230\u4E00\u5074", "\u81C0\u90E8\u5F80\u5F8C\u5750\u3001\u5F4E\u66F2\u90A3\u5074\u7684\u819D\u84CB\uFF0C\u53E6\u4E00\u8173\u4F38\u76F4", "\u63A8\u56DE\u4E2D\u9593\uFF0C\u63DB\u53E6\u4E00\u5074"],
    tip: "\u5F4E\u66F2\u7684\u819D\u84CB\u8981\u5C0D\u6E96\u8173\u5C16\uFF0C\u8173\u8DDF\u8E29\u7A69\uFF1B\u4F38\u76F4\u90A3\u689D\u817F\u6703\u611F\u89BA\u5927\u817F\u5167\u5074\u5728\u62C9\u4F38\u3002"
  },
  {
    id: "skihop",
    name: "\u6ED1\u96EA\u8DF3",
    en: "Ski Hops",
    group: "\u5168\u8EAB",
    muscles: ["\u5C0F\u817F", "\u80A1\u56DB\u982D\u808C", "\u5FC3\u80BA"],
    difficulty: 2,
    type: "time",
    defaultSeconds: 30,
    kcalPerMin: 10,
    demo: "skihop",
    cat: "aero",
    steps: ["\u96D9\u8173\u4F75\u650F\uFF0C\u819D\u84CB\u5FAE\u5F4E", "\u96D9\u8173\u4E00\u8D77\u5F80\u5074\u908A\u5C0F\u8DF3", "\u843D\u5730\u5F8C\u99AC\u4E0A\u5F80\u53E6\u4E00\u5074\u8DF3\u56DE", "\u624B\u81C2\u50CF\u62FF\u6ED1\u96EA\u6756\u4E00\u6A23\u8DDF\u8457\u64FA\u52D5"],
    tip: "\u7528\u524D\u8173\u638C\u8F15\u5DE7\u843D\u5730\u3001\u819D\u84CB\u7DE9\u885D\uFF1B\u6709\u8DF3\u8E8D\uFF0C\u4F4F\u516C\u5BD3\u53EF\u63DB\u6210\u5074\u4F75\u6B65\u3002"
  },
  {
    id: "sidebend",
    name: "\u7AD9\u59FF\u5074\u5F4E",
    en: "Standing Side Bend",
    group: "\u6838\u5FC3",
    muscles: ["\u8179\u659C\u808C", "\u80CC\u95CA\u808C"],
    difficulty: 1,
    type: "time",
    defaultSeconds: 40,
    kcalPerMin: 3,
    demo: "sidebend",
    cat: "aero",
    quiet: true,
    steps: ["\u7AD9\u76F4\uFF0C\u96D9\u8173\u8207\u9AD6\u540C\u5BEC\uFF0C\u96D9\u624B\u63D2\u8170", "\u4E00\u624B\u5F80\u4E0A\u8209\u9AD8\uFF0C\u8D8A\u904E\u982D\u9802\u5F80\u53E6\u4E00\u5074\u5EF6\u4F38", "\u4E0A\u534A\u8EAB\u6162\u6162\u5074\u5F4E\uFF0C\u505C 2\uFF5E3 \u79D2\u611F\u53D7\u5074\u8170\u62C9\u4F38", "\u56DE\u5230\u4E2D\u9593\uFF0C\u63DB\u908A"],
    tip: "\u9069\u5408\u7576\u7DE9\u548C\u6536\u64CD\uFF1B\u5F4E\u7684\u6642\u5019\u8EAB\u9AD4\u4E0D\u8981\u5F80\u524D\u5012\uFF0C\u4FDD\u6301\u547C\u5438\u4E0D\u8981\u618B\u6C23\u3002"
  }
];
var EX_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
var AERO_COUNT = EXERCISES.filter((e) => e.cat === "aero").length;

// src/components/figure/anatomy.ts
var MUSCLE_LABEL = {
  chest: "\u80F8\u808C",
  frontDelt: "\u524D\u4E09\u89D2\u808C",
  delts: "\u4E09\u89D2\u808C",
  rearDelt: "\u5F8C\u4E09\u89D2\u808C",
  traps: "\u659C\u65B9\u808C",
  triceps: "\u4E09\u982D\u808C",
  biceps: "\u4E8C\u982D\u808C",
  forearm: "\u524D\u81C2",
  abs: "\u8179\u808C",
  obliques: "\u8179\u659C\u808C",
  lats: "\u80CC\u95CA\u808C",
  lowerBack: "\u4E0B\u80CC",
  glutes: "\u81C0\u808C",
  abductors: "\u81C0\u5074\u808C\u7FA4",
  quads: "\u80A1\u56DB\u982D\u808C",
  hipFlexors: "\u9AD6\u5C48\u808C",
  adductors: "\u5927\u817F\u5167\u5074",
  hamstrings: "\u817F\u5F8C\u808C",
  calves: "\u5C0F\u817F"
};
var TARGETS = {
  pushup: { p: ["chest", "triceps", "frontDelt"], s: ["abs"] },
  diamond: { p: ["triceps", "chest"], s: ["frontDelt", "abs"] },
  squat: { p: ["quads", "glutes"], s: ["hamstrings"] },
  jumpsquat: { p: ["quads", "glutes"], s: ["hamstrings", "calves"] },
  lunge: { p: ["quads", "glutes"], s: ["hamstrings", "calves"] },
  wallsit: { p: ["quads"], s: ["glutes"] },
  plank: { p: ["abs"], s: ["obliques", "frontDelt"] },
  sideplank: { p: ["obliques"], s: ["abs", "delts"] },
  crunch: { p: ["abs"], s: ["obliques"] },
  situp: { p: ["abs"], s: ["obliques", "hipFlexors"] },
  bicycle: { p: ["obliques", "abs"], s: ["hipFlexors"] },
  superman: { p: ["lowerBack", "glutes"], s: ["hamstrings", "rearDelt"] },
  birddog: { p: ["lowerBack", "abs"], s: ["glutes", "rearDelt"] },
  bridge: { p: ["glutes", "hamstrings"], s: ["lowerBack"] },
  pullup: { p: ["lats", "biceps"], s: ["forearm", "rearDelt"] },
  dips: { p: ["triceps"], s: ["frontDelt", "chest"] },
  burpee: { p: ["quads", "glutes", "chest"], s: ["triceps", "frontDelt", "abs", "calves"] },
  climber: { p: ["abs", "hipFlexors"], s: ["frontDelt", "obliques", "quads"] },
  jack: { p: ["delts", "calves"], s: ["quads", "adductors"] },
  highknees: { p: ["hipFlexors", "quads"], s: ["calves", "abs"] },
  // 瘦身操
  march: { p: ["hipFlexors"], s: ["quads", "calves"] },
  buttkick: { p: ["hamstrings", "calves"], s: ["glutes", "hipFlexors"] },
  kickclap: { p: ["hipFlexors", "quads"], s: ["abs", "delts"] },
  punch: { p: ["frontDelt", "triceps"], s: ["obliques", "abs"] },
  uppercut: { p: ["frontDelt", "obliques"], s: ["biceps", "quads"] },
  armcircle: { p: ["delts"], s: ["traps"] },
  stepjack: { p: ["delts", "adductors"], s: ["quads", "calves"] },
  steptouch: { p: ["quads", "abductors"], s: ["adductors", "calves"] },
  sideleg: { p: ["abductors"], s: [] },
  sidecrunch: { p: ["obliques"], s: ["hipFlexors", "abs"] },
  hula: { p: ["obliques"], s: ["abs"] },
  sidelunge: { p: ["quads", "glutes"], s: ["adductors"] },
  skihop: { p: ["calves", "quads"], s: ["adductors", "abs"] },
  sidebend: { p: ["obliques"], s: [] }
};
var targetLabels = (t) => ({
  p: t.p.map((m) => MUSCLE_LABEL[m]),
  s: t.s.map((m) => MUSCLE_LABEL[m])
});

// src/components/figure/motion-library.ts
var MOTIONS = Object.fromEntries(EXERCISES.map((ex) => {
  const d = DEMOS[ex.demo];
  const durations = d.keys.map((_, i) => Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur);
  const targets = targetLabels(TARGETS[ex.demo]);
  return [ex.demo, { name: ex.name, english: ex.en, duration: Math.max(1.4, durations.reduce((a, b) => a + b, 0) / 1e3 * 1.35), prop: d.prop, front: !!d.front, still: d.still ?? 0, keys: d.keys.length, targets: TARGETS[ex.demo], labels: targets, steps: ex.steps, tip: ex.tip }];
}));
function createMotion(name) {
  const d = DEMOS[name];
  if (!d) throw new Error(`Unknown exercise: ${name}`);
  const durs = d.keys.map((_, i) => Array.isArray(d.dur) ? d.dur[i] ?? 500 : d.dur);
  const rig = new Rig(d.keys, d.front, { durs, smooth: d.smooth, lag: d.lag, headLag: d.headLag, yaw: 0, hand: d.hand });
  const total = durs.reduce((a, b) => a + b, 0);
  return { at: (t) => rig.at(t), still: name === "uppercut" ? 0.25 : durs.slice(0, d.still ?? 0).reduce((a, b) => a + b, 0) / total };
}
export {
  MOTIONS,
  createMotion
};
