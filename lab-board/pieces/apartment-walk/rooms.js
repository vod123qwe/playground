// The three rooms on A.04 beyond the living room, in plan centimetres (x, and the plan's y as z):
//  F, the bedroom (16.7 m2): an IKEA PAX along the bathroom wall (two 100 frames, four white doors, a filler to the corner), a 180 x 200
//    bed with its head on the wall opposite the door, two floating oak bedside tables with ceramic lamps, a 55" TV on the wall facing
//    the bed (on its straight part, as close to the bed's axis as the corner allows), sheers and linen drapes along the windows;
//  E, the study (11.3 m2): sheers and drapes over the window and 20 cm past it, the pelmet closed at both ends against the wall;
//  H, the child's room (13.9 m2): sheers and drapes along the whole window wall.
// The curtains hang like the living room's: wave folds under a white ceiling pelmet, the sheers drawn, the drapes stacked at the ends.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pax } from './hall.js?v=4';

const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// the curtain tracks, one per room, walked with the room on the left: a polyline along the windows (corners rounded), and the part of
// it that is hung (span, cm along it). The bedroom's runs straight past the piers and recesses of its windows and turns its corner on a
// curve, as A.04 draws it: along the line of the first window wall, then along the pier's by the bed; its end stops short of the bedside
// table. The study's hangs over its window and 20 cm either side, its pelmet closed at both ends
const TRACKS = {
  L: { pts: [[445.1, -1193.2], [787.0, -752.2]] },                     // the living room: along the facade, from the kitchen run's end to the console's corner
  H: { pts: [[393, -44], [20, -44]] },
  E: { pts: [[801, -735], [1019, -453]], span: [93, 314] },
  F: { lines: [[[1026, -443], [1174, -253]], [[1105, -70], [1071, -44]]], r: 24, endGap: 14 },
};

export async function buildRooms({ THREE, H, clip, renderer, base = 'assets/', hallMats, openings = [] }) {
  const aniso = renderer.capabilities.getMaxAnisotropy(), tl = new THREE.TextureLoader();
  const load = (f, srgb) => new Promise(res => tl.load(base + f, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; res(t); }));
  const [lnN, lnR, oakC, oakN, oakR] = await Promise.all([load('tex/linen_nor.jpg'), load('tex/linen_rough.jpg'), load('oak_diff.jpg', true), load('oak_nor.jpg'), load('oak_rough.jpg')]);
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });
  const sheerM = std({ name: 'sheerM', color: '#fbf9f4', roughness: 1, normalMap: lnN, normalScale: new THREE.Vector2(.5, .5), transparent: true, opacity: .52, side: THREE.DoubleSide, depthWrite: false });
  const drapeM = std({ name: 'drapeM', normalMap: lnN, normalScale: new THREE.Vector2(1, 1), roughnessMap: lnR, roughness: 1, color: '#cbbba4', side: THREE.DoubleSide });
  const pelmetM = std({ name: 'pelmet', color: '#f7f6f3', roughness: .92 });
  const linen = col => std({ name: 'linen', normalMap: lnN, normalScale: new THREE.Vector2(.8, .8), roughnessMap: lnR, roughness: 1, color: col });
  const oak = std({ name: 'oak', map: oakC, normalMap: oakN, normalScale: new THREE.Vector2(.35, .35), roughnessMap: oakR, roughness: .9, color: '#e6d3bd' });
  const root = new THREE.Group(), foot = [];
  const LINEN = 45, OAK = 140;

  const planarUV = (g, scale, ou = 0, ov = 0) => { const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y]; uv.setXY(i, u / scale + ou, v / scale + ov); } };
  const box = (x0, x1, y0, y1, z0, z1, m, { r = .4, scale = OAK, parent = root, soft = 0, seed = 1 } = {}) => {
    if (x1 < x0) [x0, x1] = [x1, x0]; if (y1 < y0) [y0, y1] = [y1, y0]; if (z1 < z0) [z0, z1] = [z1, z0];   // ranges either way round
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, g = new RoundedBoxGeometry(w, h, d, soft ? 6 : 2, Math.min(r, Math.min(w, h, d) / 2 - .01));
    if (soft) {                                                      // soft things: a gentle, uneven puff
      const p = g.attributes.position, q = rng(seed), ph = [q() * 6, q() * 6, q() * 6];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), top = y > 0 ? 1 : .3;
        p.setY(i, y + top * soft * (Math.sin(x / w * 5 + ph[0]) * Math.sin(z / d * 4 + ph[1]) * .6 + Math.sin((x + z) / 23 + ph[2]) * .4)); }
      g.computeVertexNormals();
    }
    planarUV(g, scale, (x0 * 7) % 1, (z0 * 3) % 1);
    const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
  };

  // ---------- curtains: a path along each track (position, tangent, inward normal by arc length), a pelmet over it, the sheers across,
  // the drapes stacked at the ends or drawn across ----------
  function trackPath(T) {
    let pts = T.pts;
    if (T.lines) {                                                   // two lines: their meeting point is the corner
      const [[a, b], [c, d]] = T.lines, d1 = [b[0] - a[0], b[1] - a[1]], d2 = [d[0] - c[0], d[1] - c[1]];
      const den = d1[0] * d2[1] - d1[1] * d2[0], t = ((c[0] - a[0]) * d2[1] - (c[1] - a[1]) * d2[0]) / den;
      pts = [a, [a[0] + d1[0] * t, a[1] + d1[1] * t], d];
    }
    const out = [], R = T.r || 0, step = 2;
    const push = (x, z) => { const q = out[out.length - 1]; if (!q || Math.hypot(x - q.x, z - q.z) > .3) out.push({ x, z }); };
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; const L = Math.hypot(x1 - x0, z1 - z0), ex = (x1 - x0) / L, ez = (z1 - z0) / L;
      const cutA = i > 0 ? R : 0, cutB = i < pts.length - 2 ? R : 0;
      for (let u = cutA; u <= L - cutB + 1e-6; u += step) push(x0 + ex * u, z0 + ez * u);
      push(x0 + ex * (L - cutB), z0 + ez * (L - cutB));
      if (cutB) {                                                    // the corner: a quadratic curve through the corner point
        const [x2, z2] = pts[i + 2], L2 = Math.hypot(x2 - x1, z2 - z1), fx = (x2 - x1) / L2, fz = (z2 - z1) / L2;
        const A = [x1 - ex * R, z1 - ez * R], B = [x1 + fx * R, z1 + fz * R];
        for (let k = 1; k < 12; k++) { const t = k / 12, m = 1 - t; push(m * m * A[0] + 2 * m * t * x1 + t * t * B[0], m * m * A[1] + 2 * m * t * z1 + t * t * B[1]); }
      }
    }
    let sum = 0; out.forEach((q, i) => { if (i) sum += Math.hypot(q.x - out[i - 1].x, q.z - out[i - 1].z); q.s = sum; });
    out.forEach((q, i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; q.tx = (b.x - a.x) / l; q.tz = (b.z - a.z) / l; q.nx = -q.tz; q.nz = q.tx; });
    const at = s => { s = THREE.MathUtils.clamp(s, 0, sum); let lo = 0, hi = out.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (out[m].s <= s) lo = m; else hi = m; }
      const a = out[lo], b = out[hi], f = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0, l = (v, w) => v + (w - v) * f;
      return { x: l(a.x, b.x), z: l(a.z, b.z), tx: l(a.tx, b.tx), tz: l(a.tz, b.tz), nx: l(a.nx, b.nx), nz: l(a.nz, b.nz) }; };
    const near = (x, z) => { let best = null, bd = 1e9; for (const q of out) { const d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; best = q; } } return { q: best, d: bd }; };
    return { len: sum, at, near };
  }
  // a panel of fabric fw wide hung along the path between s0 and s1: n wave folds, as deep as the fabric allows, flaring towards the hem
  // s0, s1: the panel's ends at the track, or a function of the height v (0 hem, 1 top) giving them there, for fabric on the move;
  // swing: how far the hem sways out of the track's line (cm), as it does when drawn and let go
  const curtain = (P, s0, s1, fw, z, top, n, m, { scale = LINEN, seed = 1, shadow = true, swing = 0, into = null } = {}) => {
    const ext = typeof s0 === 'function' ? s0 : () => [s0, s1], q = rng(seed);
    const g = into || new THREE.PlaneGeometry(1, 1, n * 8, 28), p = g.attributes.position, uv = g.attributes.uv;
    const tv = g.userData.tv || (g.userData.tv = uv.array.slice());       // the grid's own (t, v), kept: the UVs get the fabric's scale
    const amp = Array.from({ length: n + 2 }, () => .65 + q() * .7), ph = q() * 6, ph2 = q() * 6, rows = new Map();
    for (let i = 0; i < p.count; i++) {
      const t = tv[2 * i], v = tv[2 * i + 1], y = 1.5 + v * (top - 1.5), k0 = t * n;
      let r = rows.get(v); if (!r) { const [a, b] = ext(v), W = Math.max(.5, b - a), f = Math.max(1.02, fw / W); r = { a, W, A: Math.min((W / n) * Math.sqrt(f * f - 1) / 4, 9) }; rows.set(v, r); }   // the folds deepen as the fabric gathers (to 9 cm)
      const k = k0 + (k0 > 0 && k0 < n ? .18 * Math.sin(k0 * 1.37 + ph2) * (.4 + .6 * (1 - v)) : 0), j = Math.max(0, Math.min(n, Math.floor(k))), fr = k - j;
      const w = r.A * (amp[j] * (1 - fr) + amp[j + 1] * fr) * (1 + .18 * (1 - v) ** 2) * Math.sin(k * Math.PI * 2) + (1 - v) * 1.6 * Math.sin(t * 7 + ph) + (1 - v) ** 3 * .8 * Math.sin(k0 * 2.1 + ph2)
        + swing * (1 - v) ** 2 * Math.sin(t * 3.1 + ph);
      const c = P.at(r.a + t * r.W), d = z + w; p.setXYZ(i, c.x + c.nx * d, y, c.z + c.nz * d); if (!into) uv.setXY(i, t * fw / scale, y / scale);
    }
    p.needsUpdate = true; g.computeVertexNormals(); if (into) return null;
    const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o;
  };
  // the pelmet along the path: its bottom and its front, 12 high, 21 deep from the wall, closed at its two ends
  function pelmet(P, s0, s1) {
    const pos = [], idx = [], N = Math.max(2, Math.ceil((s1 - s0) / 2)), y0 = H - 12, y1 = H, D = 21;
    for (let i = 0; i <= N; i++) { const c = P.at(s0 + (s1 - s0) * i / N), f = [c.x + c.nx * D, c.z + c.nz * D];
      pos.push(c.x, y0, c.z, f[0], y0, f[1], f[0], y1, f[1]); }
    for (let i = 0; i < N; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, a + 2, b + 1, b + 2, a + 2); }
    for (const [i, sg] of [[0, 1], [N, -1]]) { const a = i * 3, c0 = P.at(i ? s1 : s0), q = pos.length / 3; pos.push(c0.x, y1, c0.z); idx.push(...(sg > 0 ? [a, a + 1, q, a + 1, a + 2, q] : [a, q, a + 1, a + 1, q, a + 2])); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, pelmetM); m.material.side = THREE.DoubleSide; m.castShadow = m.receiveShadow = true; root.add(m);
  }
  const CURS = new THREE.Group(); root.add(CURS);
  const TOP = H - 13, RUNS = [];
  for (const [room, T] of Object.entries(TRACKS)) {
    const P = trackPath(T), [u0, u1] = T.span || [0, P.len - (T.endGap || 0)];
    pelmet(P, u0, T.span ? u1 : P.len);
    const SH = new THREE.Group(), DR = new THREE.Group(); CURS.add(SH, DR);   // rebuilt when a leaf moves or the drapes are drawn
    // where the drapes gather: the run's two ends and the middle of every pier between two windows (the windows: the glazed openings
    // whose inner face lies along the track). Between two such places, two halves that meet when drawn
    const wins = openings.filter(o => o.glazed).map(o => o.quad.map(([x, z]) => P.near(x, z)).filter(h => h.d < 45).map(h => h.q.s)).filter(v => v.length >= 2)
      .map(v => [Math.min(...v), Math.max(...v)]).filter(([a, b]) => b > u0 && a < u1).sort((a, b) => a[0] - b[0]);
    const anchors = [{ p: u0 + 2, w: 1e9 }];
    for (let i = 0; i < wins.length - 1; i++) { const gap = wins[i + 1][0] - wins[i][1]; if (gap >= 30) anchors.push({ p: (wins[i][1] + wins[i + 1][0]) / 2, w: gap / 2 - 3 }); }
    anchors.push({ p: u1 - 2, w: 1e9 });
    RUNS.push({ room, P, u0, u1, SH, DR, span: !!T.span, anchors, closed: false, c: 0, hem: 0, hemV: 0, seed: (P.at(0).x * 7) | 0, key: null, leaves: [] });
  }
  // a layer of fabric across a run, split where its window's leaves are; a leaf that opens pushes its panel aside: a side-hung one past
  // its hinge, just outside its swing (round a corner if it has to), a tilting one to the nearer end. leaves: { h, s, W, f, tilt } in cm along it
  function drawnAcross(R, G, z, per, m, opts) {
    const ls = R.leaves.map(l => ({ ...l, a: l.s > 0 ? l.h : l.h - l.W, b: l.s > 0 ? l.h + l.W : l.h }));
    const xs = [...new Set([R.u0 + 1, R.u1 - 1, ...ls.flatMap(l => [l.a, l.b])].map(v => Math.round(v * 10) / 10))].filter(v => v >= R.u0 + 1 && v <= R.u1 - 1).sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      let a = xs[i], b = xs[i + 1]; if (b - a < 2) continue;
      const fw = (b - a) * 2, mid = (a + b) / 2;
      const side = ls.find(k => !k.tilt && Math.abs(k.a - a) < .5 && Math.abs(k.b - b) < .5), tilt = ls.find(k => k.tilt && mid > k.a && mid < k.b);
      const l = side && side.f > .001 ? side : tilt && tilt.f > .001 ? tilt : null;
      let zz = z;
      if (l) {
        const g = THREE.MathUtils.smoothstep(l.f, 0, .4), toStart = l.tilt ? mid - R.u0 < R.u1 - mid : l.s > 0, h = l.tilt ? (toStart ? l.a : l.b) : l.h;
        const [oa, ob] = toStart ? [h - 16, h - 2] : [h + 2, h + 16];
        a = THREE.MathUtils.lerp(a, THREE.MathUtils.clamp(oa, R.u0 + 1, R.u1 - 15), g); b = THREE.MathUtils.lerp(b, THREE.MathUtils.clamp(ob, R.u0 + 15, R.u1 - 1), g); zz = z - 3 * g;
      }
      G.add(curtain(R.P, a, b, fw, zz, TOP, Math.max(2, Math.round(fw / per)), m, { ...opts, seed: R.seed + i }));
    }
  }
  function dress(R) {                                                // the sheers: across, parting for the leaves that open
    const key = R.leaves.map(l => `${l.h.toFixed(0)}:${l.f}`).join(',');
    if (key !== R.key) { R.key = key; for (const c of [...R.SH.children]) { R.SH.remove(c); c.geometry.dispose(); } drawnAcross(R, R.SH, 6, 20, sheerM, { scale: 10, shadow: false }); }
    drapes(R);
  }
  // the drapes: two halves on the front track, each from its end of the run: gathered there (18 or 30 cm) or drawn to meet in the middle.
  // Drawing them moves the top along the track, eased; the hem trails on a spring and sways a little as it settles, as heavy linen does
  function drapes(R) {
    const dw = R.span ? 18 : 30, swing = THREE.MathUtils.clamp(R.hemV * 18, -4, 4);
    if (!R.halfDefs) {                                               // a half from each side of every stretch between two gathering places
      R.halfDefs = [];
      for (let i = 0; i < R.anchors.length - 1; i++) {
        const A = R.anchors[i], B = R.anchors[i + 1], reach = (B.p - A.p) / 2 - (i === 0 || i === R.anchors.length - 2 ? .5 : 1);
        R.halfDefs.push({ from: A.p + (i ? 1.5 : 0), dir: 1, stack: Math.min(dw, A.w), reach }, { from: B.p - (i < R.anchors.length - 2 ? 1.5 : 0), dir: -1, stack: Math.min(dw, B.w), reach });
      }
    }
    const ext = h => v => { const c = THREE.MathUtils.lerp(R.hem, R.c, Math.pow(v, .6)), w = THREE.MathUtils.lerp(h.stack, h.reach, c); return h.dir > 0 ? [h.from, h.from + w] : [h.from - w, h.from]; };
    if (!R.halves) R.halves = R.halfDefs.map((h, k) => { const fw = h.reach * 2, o = curtain(R.P, ext(h), null, fw, 13, TOP, Math.max(3, Math.round(fw / 24)), drapeM, { seed: R.seed + 5 + k }); R.DR.add(o); return o; });
    else R.halves.forEach((o, k) => { const h = R.halfDefs[k], fw = h.reach * 2; curtain(R.P, ext(h), null, fw, 13, TOP, Math.max(3, Math.round(fw / 24)), drapeM, { seed: R.seed + 5 + k, swing: swing * h.dir, into: o.geometry }); });
  }
  function step(dt) {                                                 // the drapes' motion; true while anything moved
    let any = false;
    for (const R of RUNS) {
      const to = R.closed ? 1 : 0;
      if (R.c === to && Math.abs(R.hem - R.c) < .001 && Math.abs(R.hemV) < .001) continue;
      R.c += Math.sign(to - R.c) * Math.min(Math.abs(to - R.c), dt / 1.6 * (.35 + 1.3 * Math.sin(Math.PI * THREE.MathUtils.clamp(Math.abs(to - R.c), .05, .95))));   // slow at the start and the end
      const acc = 55 * (R.c - R.hem) - 9 * R.hemV; R.hemV += acc * Math.min(dt, .05); R.hem += R.hemV * Math.min(dt, .05);   // the hem on a spring
      if (Math.abs(R.hem - R.c) < .001 && Math.abs(R.hemV) < .002 && R.c === to) { R.hem = R.c; R.hemV = 0; }
      drapes(R); any = true;
    }
    return any;
  }
  // the leaves on a track: sashes whose hinge lies within 30 cm of it; their place, width and way along it
  function update(doors) {
    for (const R of RUNS) {
      R.leaves = [];
      for (const d of doors) {
        if (!d.ph || (d.kind !== 'turn' && d.kind !== 'tilt')) continue;
        const { q, d: dist } = R.P.near(d.ph[0], d.ph[1]); if (dist > 30) continue;
        R.leaves.push({ h: q.s, s: Math.sign(d.dir[0] * q.tx + d.dir[1] * q.tz) || 1, W: d.lw, f: Math.round(d.f * 50) / 50, tilt: d.kind === 'tilt' });
      }
      if (R.closed && R.leaves.some(l => l.f > .02)) R.closed = false;   // a leaf opening behind drawn drapes: they slide away first
      dress(R);
    }
  }
  for (const R of RUNS) dress(R);
  // a click on a room's drapes (stacked or drawn) draws them across or back; the sheers are not a switch, a click goes through them to
  // the door or the window behind
  const switches = RUNS.map(R => ({ name: `curtains ${R.room}`, curtains: true, get on() { return R.closed; },
    get meshes() { return [...R.DR.children]; }, set(v) { R.closed = !!v; } }));   // (the motion: step)
  // for the walk's light: how far a room's drapes are drawn (0..1, as they move), which track a window is on, a point inside each room
  const setClosed = (room, v) => { const R = RUNS.find(q => q.room === room); if (R) R.closed = !!v; };
  const closure = room => { const R = RUNS.find(q => q.room === room); return R ? THREE.MathUtils.clamp(R.c, 0, 1) : 0; };
  const trackOf = (x, z) => { let best = null, bd = 60; for (const R of RUNS) { const { d } = R.P.near(x, z); if (d < bd) { bd = d; best = R.room; } } return best; };
  const inside = Object.fromEntries(RUNS.map(R => { const c = R.P.at((R.u0 + R.u1) / 2); return [R.room, [c.x + c.nx * 80, c.z + c.nz * 80]]; }));

  // ---------- F, the bedroom ----------
  // the PAX along the bathroom wall (x 693), the doors facing into the room; the filler at the corner with the bed's wall
  const run = pax({ THREE, root, mats: hallMats, x0: 693, z0: -252, z1: -44, frames: [100, 100], fill: 'z1' }); foot.push(run.foot);
  // the bed: 180 x 200, an upholstered frame in beige linen, a headboard 110 high, head on the wall z = -44, running to -z
  const WZ = -44, BX0 = 848, BX1 = 1032, upholstery = linen('#d9cbb8'), sheet = linen('#f3efe8'), duvetM = linen('#efe8dd'), throwM = linen('#a99985');
  box(BX0 + 6, BX1 - 6, 0, 8, WZ - 14, WZ - 204, std({ name: 'gap', color: '#6d655c', roughness: .9 }));   // the recessed plinth
  const bedParts = [];
  bedParts.push(box(BX0, BX1, 0, 112, WZ - 9, WZ - .5, upholstery, { r: 3.5, scale: LINEN }));             // the headboard
  bedParts.push(box(BX0, BX1, 8, 32, WZ - 9, WZ - 213, upholstery, { r: 2.5, scale: LINEN }));                             // the frame
  bedParts.push(box(BX0 + 2, BX1 - 2, 32, 53, WZ - 11, WZ - 211, sheet, { r: 5, scale: LINEN, soft: .3, seed: 3 }));        // the mattress, sheeted
  bedParts.push(box(BX0 - 2, BX1 + 2, 40, 58, WZ - 62, WZ - 214, duvetM, { r: 8, scale: LINEN, soft: 1.4, seed: 7 }));      // the duvet, over the edges
  bedParts.push(box(BX0 - 1, BX1 + 1, 53, 62, WZ - 58, WZ - 74, duvetM, { r: 4.5, scale: LINEN, soft: .6, seed: 8 }));      // its folded top
  bedParts.push(box(BX0 + 2, BX1 - 2, 57.5, 60.5, WZ - 168, WZ - 205, throwM, { r: 1.4, scale: LINEN, soft: .5, seed: 9 })); // a throw across the foot
  for (const [x, k] of [[BX0 + 48, 0], [BX1 - 48, 1]]) {             // two pillows against the headboard, two in front, leaning back
    const p1 = box(x - 40, x + 40, 0, 50, -7, 7, sheet, { r: 6, scale: LINEN, soft: 1, seed: 11 + k }); p1.position.set(x, 76, WZ - 22); p1.rotation.x = -.35; bedParts.push(p1);
    const p2 = box(x - 34, x + 34, 0, 36, -6, 6, linen(k ? '#e6dccd' : '#ddd1c0'), { r: 5, scale: LINEN, soft: .8, seed: 13 + k }); p2.position.set(x, 70, WZ - 36); p2.rotation.x = -.5; bedParts.push(p2);
  }
  foot.push([[BX0, WZ], [BX1, WZ], [BX1, WZ - 213], [BX0, WZ - 213]]);
  // the bedside tables: floating oak boxes 38 x 35 x 26 with a drawer, and a ceramic lamp with a linen drum
  const ceramic = std({ name: 'lampBase', color: '#e9e2d6', roughness: .55 }), lamps = [];
  for (const [x0, x1] of [[810, BX0], [BX1, 1070]]) {
    const shadeM = std({ name: 'bedLamp', color: '#f2ebdf', roughness: .95, side: THREE.DoubleSide, emissive: '#ffd9a0', emissiveIntensity: 0 });
    box(x0, x1, 30, 56, WZ - 35, WZ, oak, { r: .6 });
    box(x0 + 1.5, x1 - 1.5, 49.5, 50, WZ - 35.05, WZ - 34.9, std({ name: 'shadowGap', color: '#3a302a', roughness: .9 }));   // the drawer's shadow line
    const cx = (x0 + x1) / 2, cz = WZ - 16;
    const b = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [6, 0], [7.5, 2], [9, 9], [8.2, 17], [4, 23], [1.2, 25], [1.2, 30], [0, 30]].map(([r, y]) => new THREE.Vector2(r, y)), 48), ceramic);
    b.position.set(cx, 56, cz); b.castShadow = b.receiveShadow = true; root.add(b);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(13, 15, 19, 48, 1, true), shadeM); sh.position.set(cx, 56 + 36, cz); root.add(sh);
    const light = new THREE.PointLight('#ffcf94', 0, 4, 2); light.position.set(cx, 56 + 34, cz); root.add(light);
    light.shadow.mapSize.set(512, 512); light.shadow.camera.near = .03; light.shadow.bias = -.004; light.shadow.normalBias = .02;   // its shadow: the walk lends one of its shadow slots to the nearest lamps that are on
    lamps.push({ name: x0 < BX0 ? 'bedside left' : 'bedside right', on: false, light, meshes: [b, sh], set(v) { this.on = !!v; shadeM.emissiveIntensity = v ? 1.6 : 0; light.intensity = v ? 1.2 : 0; } });
    foot.push([[x0, WZ], [x1, WZ], [x1, WZ - 35], [x0, WZ - 35]]);
  }
  // the TV, 55" (123 x 71), on the wall facing the bed (z = -362), its right edge 6 cm from where the wall turns
  { const cx = 921 - 6 - 61.5, y0 = 98, screen = std({ name: 'screen', color: '#050607', roughness: .07, metalness: .1 }), bezel = std({ name: 'bezel', color: '#1b1c1f', roughness: .5, metalness: .3 });
    box(cx - 61.5, cx + 61.5, y0, y0 + 71, -362 + 3, -362 + 6.5, bezel, { r: .5 });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(122, 69.4), screen); s.position.set(cx, y0 + 35.5, -362 + 6.52); root.add(s); }
  // ---------- the radiators, where A.04 puts them (it moves the study's, the bedroom's and the child's room's, and swaps the living room's
  // for a tall one), the bathroom's towel rail where the developer's heating drawing has it. Steel panels, white, a satin finish, the face
  // in vertical channels, a grille on top, a chrome valve; hung 4 cm off the wall. (a: along the wall from, b: to; n: into the room)
  const radM = std({ name: 'radiator', color: '#f4f4f1', roughness: .38, metalness: .1 }), chrome = std({ name: 'steel', color: '#d6d7d8', roughness: .15, metalness: 1 });
  function radiator(a, b, n, y0, h, d = 10, kind = 'panel') {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), e = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const F = new THREE.Group(); F.position.set(a[0] + n[0] * 4, 0, a[1] + n[1] * 4); F.rotation.y = Math.atan2(-e[1], e[0]); root.add(F);
    if (Math.sign(-e[1] * n[0] + e[0] * n[1]) < 0) F.scale.z = -1;      // local +z into the room
    if (kind === 'ladder') {                                           // a towel rail: two round uprights, flat bars
      for (const x of [1.5, len - 1.5]) { const u = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, h, 16), radM); u.position.set(x, y0 + h / 2, d / 2); F.add(u); }
      for (let y = y0 + 4; y < y0 + h - 2; y += (y > y0 + h * .55 ? 3.6 : 5.2)) box(2, len - 2, y, y + 1.4, d / 2 - 1, d / 2 + 1, radM, { r: .5, parent: F });
    } else {
      box(0, len, y0, y0 + h, 0, d, radM, { r: .8, parent: F });
      for (let x = 2.5; x < len - 2; x += 5) box(x - .4, x + .4, y0 + 2, y0 + h - 2, d - .05, d + .35, radM, { r: .2, parent: F });   // the channels
      box(1, len - 1, y0 + h - .1, y0 + h + .3, 1.5, d - 1.5, std({ name: 'shadowGap', color: '#b9b6b0', roughness: .9 }), { r: .1, parent: F });   // the grille
      const v = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7, 16), chrome); v.position.set(len - 4, y0 + h + 4, d / 2); F.add(v);   // the valve
    }
    foot.push([[a[0], a[1]], [b[0], b[1]], [b[0] + n[0] * (d + 5), b[1] + n[1] * (d + 5)], [a[0] + n[0] * (d + 5), a[1] + n[1] * (d + 5)]]);
  }
  radiator([806, -362], [917, -362], [0, 1], 14, 60);                       // the bedroom: under the TV (A.04 moves it here), 600 x 1100
  radiator([393, -176], [393, -96], [-1, 0], 14, 60);                       // the child's room: by the window, on its right wall (A.04), 600 x 800
  { const p0 = [919, -376], d = [.7925, -.6099];                              // the study: on its angled wall by the window (A.04), 600 x 800
    radiator([p0[0] + d[0] * 30, p0[1] + d[1] * 30], [p0[0] + d[0] * 110, p0[1] + d[1] * 110], [-.6099, -.7925], 14, 60); }
  radiator([350, -610], [400, -610], [0, -1], 12, 180, 9);                  // the living room: A.04's tall one, by the laundry's corner, 1800 x 500
  radiator([405, -232], [405, -172], [1, 0], 22, 122, 6, 'ladder');         // the bathroom: a towel rail on the left wall (the developer's), 1222 x 600

  // ---------- the ceiling lights, at the outlets of the electrical drawing (its points read off onto the plan, to within a few tens of
  // cm): the island's family, closer to the ceiling: the amber glass bowl on a short brass stem and canopy, the LED in its brass sleeve
  // (3000 K); 38 across in the living room and the bedroom, 26 in the study and the child's room. Each a switch ----------
  const shadeG = new THREE.LatheGeometry([[19, 0], [19.35, .8], [19.2, 3], [18.8, 7.5], [18, 11.5], [16.4, 14.4], [13.4, 16], [6, 16.7], [1.3, 16.8]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
  const brass = std({ name: 'brass', color: '#c9a063', roughness: .28, metalness: 1 });
  function ceilingLamp(name, x, z, D) {
    const k = D / 38, G = new THREE.Group(); G.position.set(x, 0, z); root.add(G);
    const amber = std({ name: 'amberGlass', color: '#c47a36', roughness: .04, metalness: .15, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.4 });
    const led = std({ name: 'islandLED', color: '#fff4e2', roughness: .4, emissive: '#ffcf8a', emissiveIntensity: 0 });
    const y0 = H - 22 - 16.8 * k;                                    // the rim; the crown 22 cm under the ceiling
    const shade = new THREE.Mesh(shadeG, amber); shade.scale.setScalar(k); shade.position.y = y0; shade.castShadow = true; G.add(shade);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(6.4 * k, 6.4 * k, 9 * k, 48, 1, true), brass); sleeve.position.y = y0 + 7.5 * k; G.add(sleeve);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.8 * k, 48), led); disc.rotation.x = Math.PI / 2; disc.position.y = y0 + 3.2 * k; G.add(disc);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 22, 16), brass); stem.position.y = H - 11; G.add(stem);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1.6, 32), brass); rose.position.y = H - .8; G.add(rose);
    const light = new THREE.PointLight('#ffc98a', 0, 6, 2); light.position.y = y0 - 4; G.add(light);
    light.shadow.mapSize.set(512, 512); light.shadow.camera.near = .03; light.shadow.bias = -.004; light.shadow.normalBias = .02;
    lamps.push({ name, on: false, light, meshes: [shade, sleeve, disc, stem, rose], set(v) { this.on = !!v; led.emissiveIntensity = v ? 3 : 0; amber.emissive.set(v ? '#6a3208' : '#000'); light.intensity = v ? 2.4 * k : 0; } });
  }
  ceilingLamp('ceiling living', 537, -758, 38);                      // H1(5/5'), over the sofa
  ceilingLamp('ceiling bedroom', 913, -260, 38);                     // H1(11/11'), by the foot of the bed
  ceilingLamp('ceiling study', 774, -515, 26);                       // H1(12/12')
  ceilingLamp('ceiling child', 212, -227, 26);                       // H1(8/8')

  const setLamps = on => lamps.forEach(l => l.set(on));
  // lying on it: the head on the pillows, the eyes 80 cm up, looking down the bed at the TV; where you stand up beside it
  const bed = { x0: BX0, x1: BX1, headZ: WZ - 50, standZ: WZ - 125, eye: 80, yaw: -Math.PI / 2, pitch: .19, meshes: bedParts };
  return { root, foot, lamps: [...lamps, ...switches], setLamps, update, step, paxDoors: run.doors, bed, setClosed, closure, trackOf, inside };
}
