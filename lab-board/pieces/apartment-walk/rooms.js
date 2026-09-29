// The three rooms on A.04 beyond the living room, in plan centimetres (x, and the plan's y as z):
//  F, the bedroom (16.7 m2): an IKEA PAX along the bathroom wall (two 100 frames, four white doors, a filler to the corner), a 180 x 200
//    bed after the Kave Home Odina (rounded ecru boucle, ash legs), a knit blanket over its foot, with its head on the wall opposite the door, two floating oak bedside tables with ceramic lamps, a 55" TV on the wall facing
//    the bed (on its straight part, as close to the bed's axis as the corner allows), sheers and linen drapes along the windows;
//  E, the study (11.3 m2), as the third revision of A.04 has it: a 120 oak desk on the wall to the living room with two screens, an
//    office chair, the PC, oak shelves and ivy; a sofa bed that pulls out, on the wall to the bedroom; a PAX by the door; a rug;
//    sheers and drapes over the window and 20 cm past it, the pelmet closed at both ends against the wall;
//  H, the child's room (13.9 m2): sheers and drapes along the whole window wall.
// The curtains hang like the living room's: wave folds under a white ceiling pelmet, the sheers drawn, the drapes stacked at the ends.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pax } from './hall.js?v=4';
import { ivy } from './ivy.js?v=1';
import { buildBath } from './bath.js?v=11';
import { buildBalconies } from './balcony.js?v=3';
import { buildKidroom } from './kidroom.js?v=5';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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

export async function buildRooms({ THREE, H, clip, renderer, base = 'assets/', hallMats, openings = [], balconies = [] }) {
  const aniso = renderer.capabilities.getMaxAnisotropy(), tl = new THREE.TextureLoader();
  const load = (f, srgb) => new Promise(res => tl.load(base + f, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; res(t); }));
  const [lnN, lnR, oakC, oakN, oakR] = await Promise.all([load('tex/linen_nor.jpg'), load('tex/linen_rough.jpg'), load('oak_diff.jpg', true), load('oak_nor.jpg'), load('oak_rough.jpg')]);
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);   // a texture drawn here
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
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
      let a = xs[i], b = xs[i + 1]; if (b - a < 2) continue;         // (a panel belongs to the side-hung leaf its middle is over: the leaf's
      // ends and the cuts can differ by a few mm, where two leaves or a tilt share a mullion)
      const fw = (b - a) * 2, mid = (a + b) / 2;
      const side = ls.find(k => !k.tilt && k.f > .001 && mid > k.a && mid < k.b), tilt = ls.find(k => k.tilt && mid > k.a && mid < k.b);
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
    for (const f of movers) if (f(dt)) any = true;                   // and the sofa bed
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
  // the bed, after the Kave Home Odina: one soft rounded body in ecru boucle, frame and headboard (83 high), on solid ash legs that rise
  // through its corners a little above the cover; narrowed to 188 x 228 to keep to A.04's bedside tables. A 180 x 200 mattress sunk into
  // it, the duvet over its lower two thirds, a terracotta throw across the foot; against the headboard two linen euro squares, two
  // white sleeping pillows leaning on them, a rust lumbar cushion in front. Head on the wall z = -44, running to -z
  const WZ = -44, BX0 = 846, BX1 = 1034, BC = (BX0 + BX1) / 2, BL = 228;
  const boucle = linen('#e9e1d4'), sheet = linen('#f4f0e9'), duvetM = linen('#efe8dd'), throwM = linen('#b8765a');
  const bedParts = [];
  bedParts.push(box(BX0, BX1, 14, 83, WZ - 1, WZ - 17, boucle, { r: 8, scale: LINEN, soft: .7, seed: 2 }));                  // the headboard
  bedParts.push(box(BX0, BX1, 14, 34, WZ - 12, WZ - BL, boucle, { r: 9, scale: LINEN, soft: .5, seed: 4 }));                 // the frame
  for (const x of [BX0 + 5.5, BX1 - 5.5]) for (const z of [WZ - 22, WZ - BL + 5.5]) {                                      // the ash legs, through the corners
    const l = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.6, 38, 24), oak); l.position.set(x, 19, z); l.castShadow = l.receiveShadow = true; root.add(l); bedParts.push(l);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(3.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), oak); cap.position.set(x, 38, z); root.add(cap); bedParts.push(cap); }
  bedParts.push(box(BX0 + 4, BX1 - 4, 30, 52, WZ - 18, WZ - 218, sheet, { r: 6, scale: LINEN, soft: .3, seed: 3 }));        // the mattress, sheeted
  bedParts.push(box(BX0 + 1, BX1 - 1, 44, 57.5, WZ - 80, WZ - 220, duvetM, { r: 9, scale: LINEN, soft: 1.6, seed: 7 }));     // the duvet, over the edges
  bedParts.push(box(BX0 + 2, BX1 - 2, 53, 60.5, WZ - 74, WZ - 94, duvetM, { r: 4.5, scale: LINEN, soft: .7, seed: 8 }));     // its folded top
  // a chunky knit blanket in caramel wool, thrown across the foot at a slant: a cloth of 150 x 125 laid on the duvet, and where it runs
  // past the bed's edge it falls, in soft folds, down the side and the foot
  { const TW = 150, TD = 125, NU = 72, NV = 60, top = 60.4, ang = .3, c0 = [BX1 - 62, WZ - BL + 52], q = rng(33);
    const knit = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b98556'; g.fillRect(0, 0, w, h); const cols = 8, rows = 12, cw = w / cols, rh = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = i * cw, y = j * rh;            // the stitches: fat V's of wool, lit from above
        for (const sd of [-1, 1]) { const gr = g.createLinearGradient(x + cw / 2, y, x + cw / 2 + sd * cw / 2, y + rh);
          gr.addColorStop(0, '#dcae80'); gr.addColorStop(.55, '#c08d5e'); gr.addColorStop(1, '#8f6038'); g.fillStyle = gr;
          g.beginPath(); g.ellipse(x + cw / 2 + sd * cw * .22, y + rh * .55, cw * .26, rh * .62, sd * .55, 0, 7); g.fill(); } }
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(255,236,210,${q() * .12})`; g.fillRect(q() * w, q() * h, 1, 2); } });
    knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
    const geo = new THREE.PlaneGeometry(1, 1, NU, NV), P = geo.attributes.position, UV = geo.attributes.uv, ca = Math.cos(ang), sa = Math.sin(ang);
    const ex0 = BX0 + 1, ex1 = BX1 - 1, ez = WZ - BL + 2;             // the bed's top edges (the frame's rounded corners, near enough)
    for (let i = 0; i < P.count; i++) {
      const u = UV.getX(i), v = UV.getY(i), sx = (u - .5) * TW, sz = (v - .5) * TD;
      let x = c0[0] + sx * ca - sz * sa, z = c0[1] + sx * sa + sz * ca, y = top + .9 * Math.sin(sx * .09 + sz * .05) * Math.sin(sz * .11);
      const ox = Math.max(0, x - ex1, ex0 - x), oz = Math.max(0, ez - z);   // how far past an edge: that much falls
      if (ox > 0 || oz > 0) {
        const fall = Math.hypot(ox, oz), R0 = 6, roll = Math.min(fall, R0 * Math.PI / 2) / R0;   // over the edge on a 6 cm roll, then straight down
        const out = R0 * Math.sin(roll) + 2.2 * Math.sin((x + z) * .19) * Math.min(1, fall / 18), drop = R0 * (1 - Math.cos(roll)) + Math.max(0, fall - R0 * Math.PI / 2);
        if (ox > 0) x = (x > ex1 ? ex1 : ex0) + Math.sign(x - BC) * out; else x += out * .3;
        if (oz > 0) z = ez - out;
        y = Math.max(4, top - drop);
      }
      P.setXYZ(i, x, y, z); UV.setXY(i, sx / 28, sz / 20);
    }
    geo.computeVertexNormals();
    const bl = new THREE.Mesh(geo, std({ name: 'knit', map: knit, normalMap: lnN, normalScale: new THREE.Vector2(.6, .6), roughness: 1, side: THREE.DoubleSide }));
    bl.castShadow = bl.receiveShadow = true; root.add(bl); bedParts.push(bl); void throwM; }
  // a pillow: a sphere squared off (a superellipse) and thinned to its edges, a soft uneven fill; its uv on the linen's scale
  const pillowGeo = (w, d, t, seed) => { const g = new THREE.SphereGeometry(1, 48, 32), p = g.attributes.position, uv = g.attributes.uv, q = rng(seed), ph = [q() * 6, q() * 6];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const sx = Math.sign(x) * Math.pow(Math.abs(x), .42), sz = Math.sign(z) * Math.pow(Math.abs(z), .42), fill = 1 + .05 * Math.sin(sx * 5 + ph[0]) * Math.sin(sz * 4 + ph[1]);
      p.setXYZ(i, sx * w / 2, y * t / 2 * fill * (1 - .3 * Math.max(sx * sx, sz * sz)), sz * d / 2); uv.setXY(i, sx * w / 2 / LINEN + .5, sz * d / 2 / LINEN + .5); }
    g.computeVertexNormals(); return g; };
  const pillow = (w, d, t, m, x, y, z, lean, seed, turn = 0) => { const o = new THREE.Mesh(pillowGeo(w, d, t, seed), m); o.position.set(x, y, z); o.rotation.set(-Math.PI / 2 + lean, turn, 0, 'YXZ');
    o.castShadow = o.receiveShadow = true; root.add(o); bedParts.push(o); return o; };
  const euroM = linen('#dccfbd'), pillowM = linen('#f5f2ec'), rust = linen('#a65e3e');
  for (const [s, k] of [[-1, 0], [1, 1]]) {
    pillow(62, 62, 17, euroM, BC + s * 44, 52 + 30, WZ - 27, .2, 21 + k, s * .03);                                             // the euro squares, upright
    pillow(76, 50, 15, pillowM, BC + s * 43, 52 + 22, WZ - 43, .62, 23 + k, -s * .04);                                        // the sleeping pillows, leaning
  }
  pillow(52, 32, 13, rust, BC + 3, 52 + 15, WZ - 55, .75, 25, .05);                                                          // the lumbar cushion
  foot.push([[BX0, WZ], [BX1, WZ], [BX1, WZ - BL], [BX0, WZ - BL]]);
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
  // ---------- the radiators, where the developer's heating drawing has them (the living room's 900 x 1600 behind the table, the bedroom's
  // 600 x 1100 on its angled wall to the study, the bathroom's towel rail), but the study's, moved as A.04 draws it; the child's room's
  // as A.04 too (the developer's drawing does not show it clearly). Steel panels, white, a satin finish, the face
  // in vertical channels, a grille on top, a chrome valve; hung 4 cm off the wall. (a: along the wall from, b: to; n: into the room)
  const radM = std({ name: 'radiator', color: '#f4f4f1', roughness: .38, metalness: .1 }), chrome = std({ name: 'steel', color: '#d6d7d8', roughness: .15, metalness: 1 });
  function radiator(a, b, n, y0, h, d = 10, kind = 'panel') {
    if (-(b[1] - a[1]) * n[0] + (b[0] - a[0]) * n[1] < 0) [a, b] = [b, a];   // walked with the room on the left: local +z into the room (no mirroring)
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), e = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const F = new THREE.Group(); F.position.set(a[0] + n[0] * 4, 0, a[1] + n[1] * 4); F.rotation.y = Math.atan2(-e[1], e[0]); root.add(F);
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
  { const p0 = [921, -362], d = [.7895, -.609];                               // the bedroom: on its angled wall to the study, by the window (the developer's), 600 x 1100
    radiator([p0[0] + d[0] * 11.5, p0[1] + d[1] * 11.5], [p0[0] + d[0] * 121.5, p0[1] + d[1] * 121.5], [.609, .7895], 14, 60);
    // over it, ivy trailing from a little oak shelf at 1.5 m, its strands stopping short of the radiator (in a frame: the wall at z = 0)
    const G = new THREE.Group(), c = [p0[0] + d[0] * 66.5, p0[1] + d[1] * 66.5]; G.position.set(c[0], 0, c[1]); G.rotation.y = Math.atan2(-.609, -.7895); root.add(G);
    box(-24, 24, 150, 152.4, -18, 0, oak, { r: .3, parent: G });
    ivy({ THREE, root: G, std, WZ: 0, CX: 0, y: 152.4, seed: 717, reach: .55 }); }
  radiator([393, -176], [393, -96], [-1, 0], 14, 60);                       // the child's room: by the window, on its right wall (A.04), 600 x 800
  { const p0 = [919, -376], d = [.7925, -.6099];                              // the study: on its angled wall by the window (A.04), 600 x 800
    radiator([p0[0] + d[0] * 30, p0[1] + d[1] * 30], [p0[0] + d[0] * 110, p0[1] + d[1] * 110], [-.6099, -.7925], 14, 60); }
  radiator([231, -610], [394, -610], [0, -1], 14, 90);                      // the living room: behind the table (the developer's), 900 x 1600
  // (the bathroom's: a narrow tube radiator by its door, as the architect's design has it: bath.js)

  // ---------- the ceiling lights, at the outlets of the electrical drawing (its points read off onto the plan, to within a few tens of
  // cm): the island's family, closer to the ceiling: the amber glass bowl on a short brass stem and canopy, the LED in its brass sleeve
  // (3000 K); 38 across in the living room and the bedroom, 26 in the study and the child's room. Each a switch ----------
  const shadeG = new THREE.LatheGeometry([[19, 0], [19.35, .8], [19.2, 3], [18.8, 7.5], [18, 11.5], [16.4, 14.4], [13.4, 16], [6, 16.7], [1.3, 16.8]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
  const brass = std({ name: 'brass', color: '#c9a063', roughness: .28, metalness: 1 });
  function ceilingLamp(name, x, z, D, ledName = 'ceilingLED') {                  // (ledName: the evening 360s light them by it)
    const k = D / 38, G = new THREE.Group(); G.position.set(x, 0, z); root.add(G);
    const amber = std({ name: 'amberGlass', color: '#c47a36', roughness: .04, metalness: .15, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.4 });
    const led = std({ name: ledName, color: '#fff4e2', roughness: .4, emissive: '#ffcf8a', emissiveIntensity: 0 });   // (its own name: the evening render keeps these off, but the child's, dimmed)
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
  ceilingLamp('ceiling child', 212, -227, 26, 'ceilingLEDdim');                       // H1(8/8')

  // ---------- E, the study, as the functional layout (A.04, its third revision) draws it: the desk on the wall to the living room,
  // 6 cm off it (172 x 60: A.04 draws it 120, but it runs on to the window wall), the chair pulled out before it; a sofa bed on the wall to the bedroom, to the corner by the radiator, that pulls
  // out 80 cm into a bed; a PAX (100 + 50) right of the door; a Beni Ourain style rug before the sofa ----------
  const movers = [];                                                  // things in motion (the sofa bed): run by step()
  const seats = [];                                                   // places to sit: anchors (+z the way the sitter faces) and the meshes that take the click
  const cover = ['#8a6f5a', '#c9b79c', '#5f6b62', '#e2d7c5', '#9a8c7a', '#3f4a52', '#b8a48a', '#d9cdb8', '#7a4e3c'].map(color => std({ name: 'book', color, roughness: .8 }));
  // a photo in a frame, standing on a shelf and leaning back a little, or hung on the wall: an oak or black frame, a white mat, the picture (drawn)
  const matM = std({ name: 'print', color: '#f3f0ea', roughness: .9 }), blackFrame = std({ name: 'plasticBlack', color: '#1f1e1d', roughness: .5 });
  function photo(parent, cx, y, zWall, w, h, draw, frameM = oak, hung = false) {                 // (hung: on the wall, its bottom at y)
    const F = new THREE.Group(); F.position.set(cx, y + h / 2, zWall - (hung ? 1.1 : 3.4)); F.rotation.x = hung ? 0 : .09; parent.add(F);
    box(-w / 2, w / 2, -h / 2, h / 2, -1, 1, frameM, { r: .25, parent: F });
    const bw = Math.min(w, h) * .09, mat = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * bw, h - 2 * bw), matM); mat.rotation.y = Math.PI; mat.position.z = -1.02; F.add(mat);
    const pw = w - 2 * bw - Math.min(w, h) * .16, ph = h - 2 * bw - Math.min(w, h) * .16;
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), std({ name: 'photo', map: canvasTex(pw > ph ? 512 : 384, pw > ph ? 384 : 512, draw), roughness: .5 }));
    pic.rotation.y = Math.PI; pic.position.z = -1.04; F.add(pic); return F;
  }
  const grad = (g, y0, y1, stops) => { const l = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => l.addColorStop(i / (stops.length - 1), c)); return l; };
  const ridge = (g, w, h, y, amp, col, q) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); let v = y; for (let x = 0; x <= w; x += 8) { v += (q() - .5) * amp; v = Math.min(Math.max(v, y - amp * 3), y + amp * 2); g.lineTo(x, v); } g.lineTo(w, h); g.fill(); };
  const PICS = {
    sunset: (g, w, h) => { g.fillStyle = grad(g, 0, h * .62, ['#5d4a7a', '#c9728a', '#f3b27a', '#ffd9a0']); g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff1cf'; g.beginPath(); g.arc(w * .62, h * .6, h * .07, 0, 7); g.fill();
      g.fillStyle = grad(g, h * .62, h, ['#6b5a78', '#2f3350', '#1d2236']); g.fillRect(0, h * .62, w, h);
      const q = rng(3); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,214,160,${.1 + q() * .35})`; g.fillRect(w * .62 - 60 + q() * 120 * (1 + i / 40), h * .64 + i * 1.5, 8 + q() * 30, 1.5); } },
    hills: (g, w, h) => { g.fillStyle = grad(g, 0, h, ['#e9eef0', '#c6d2da', '#aebccb']); g.fillRect(0, 0, w, h); const q = rng(9);
      ['#9aabbd', '#7b8fa6', '#5d728c', '#3f5268'].forEach((c, i) => ridge(g, w, h, h * (.42 + i * .13), 10 + i * 4, c, q)); },
    pier: (g, w, h) => { g.fillStyle = grad(g, 0, h * .55, ['#d8d8d6', '#bcbcba']); g.fillRect(0, 0, w, h); g.fillStyle = grad(g, h * .55, h, ['#8d8d8c', '#5c5c5c']); g.fillRect(0, h * .55, w, h);
      g.fillStyle = '#2d2d2d'; g.fillRect(w * .1, h * .52, w * .62, h * .03); for (let x = w * .12; x < w * .72; x += w * .06) g.fillRect(x, h * .55, 3, h * .12);
      const q = rng(5); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${q() < .5 ? 255 : 0},${q() < .5 ? 255 : 0},${q() < .5 ? 255 : 0},.05)`; g.fillRect(q() * w, q() * h, 1.5, 1.5); } },
    forest: (g, w, h) => { g.fillStyle = grad(g, 0, h, ['#dfe8d6', '#a9bd98', '#5f7a55']); g.fillRect(0, 0, w, h); const q = rng(21);
      for (let i = 0; i < 70; i++) { const x = q() * w, s = 30 + q() * 90, y = h * .45 + q() * h * .5, c = 40 + (y / h) * -30;
        g.fillStyle = `hsl(${95 + q() * 30},${22 + q() * 15}%,${c + 20}%)`; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x - s * .3, y); g.lineTo(x + s * .3, y); g.fill(); } },
    dunes: (g, w, h) => { g.fillStyle = grad(g, 0, h * .4, ['#e8d9c4', '#f1e4cf']); g.fillRect(0, 0, w, h); const q = rng(13);
      ['#e3c49b', '#d6ad7e', '#c49366', '#b07d55'].forEach((c, i) => ridge(g, w, h, h * (.38 + i * .15), 5 + i * 2, c, q)); },
    lake: (g, w, h) => { g.fillStyle = grad(g, 0, h * .5, ['#9fb6c4', '#d9e2e4']); g.fillRect(0, 0, w, h * .5); const q = rng(17);
      ridge(g, w, h * .5 + 1, h * .44, 6, '#4f6358', q); g.fillStyle = grad(g, h * .5, h, ['#8aa1ad', '#51666f']); g.fillRect(0, h * .5, w, h * .5);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(230,238,240,${.1 + q() * .2})`; g.fillRect(q() * w, h * .52 + q() * h * .46, 12 + q() * 40, 1.2); } },
  };
  // books along a shelf: upright from x in the direction dir, or a few lying in a pile
  const bookRow = (parent, q, x, y, zWall, n, dir = 1) => { for (let i = 0; i < n; i++) { const t = 2 + q() * 2.4, h = 19 + q() * 6, d = 14 + q() * 4;
    box(x, x + dir * t, y, y + h, zWall - 2 - d, zWall - 2, cover[(q() * cover.length) | 0], { r: .3, parent }); x += dir * (t + .15); } return x; };
  const bookPile = (parent, q, x, y, zWall, n) => { let yy = y; for (let i = 0; i < n; i++) { const t = 2.4 + q() * 1.4, w = 17 + q() * 6, d = 13 + q() * 4, o = (q() - .5) * 2;
    box(x + o, x + o + w, yy, yy + t, zWall - 3 - d, zWall - 3, cover[(q() * cover.length) | 0], { r: .3, parent }); yy += t; } return yy; };

  // the game on one screen: drawn here (a dark isometric dungeon, torches, a stone HUD with a red and a blue orb), not a capture
  function gameTexture() {
    return canvasTex(1024, 576, (g, W, H) => {
      const q = rng(66); g.fillStyle = '#040304'; g.fillRect(0, 0, W, H);
      const hx = 520, hy = 300, tw = 64, th = 32;
      for (let i = -14; i < 14; i++) for (let j = -14; j < 14; j++) {             // the floor: brick-red flagstones, lit round the hero
        const x = hx + (i - j) * tw / 2, y = hy + (i + j) * th / 2; if (x < -40 || x > W + 40 || y < -30 || y > H) continue;
        const d = Math.hypot((x - hx) / 1.4, y - hy), L = Math.max(.22, 1 - d / 560) * (.85 + q() * .3);
        g.fillStyle = `rgb(${62 * L + 8},${30 * L + 4},${28 * L + 5})`; g.beginPath(); g.moveTo(x, y - th / 2); g.lineTo(x + tw / 2, y); g.lineTo(x, y + th / 2); g.lineTo(x - tw / 2, y); g.fill();
        g.strokeStyle = `rgba(0,0,0,${.5})`; g.lineWidth = 1.5; g.stroke();
        if (q() < .08) { g.fillStyle = `rgba(${110 * L + 20},8,10,.55)`; g.beginPath(); g.ellipse(x + (q() - .5) * 20, y, 8 + q() * 18, 4 + q() * 7, 0, 0, 7); g.fill(); }
      }
      const wall = (x0, y0, n, dir) => {                                      // a wall run along the iso axis, with arches
        for (let k = 0; k < n; k++) { const x = x0 + dir * k * tw / 2, y = y0 + k * th / 2, L = Math.max(.25, 1 - Math.hypot(x - hx, y - hy) / 520);
          g.fillStyle = `rgb(${58 * L},${68 * L},${66 * L})`; g.beginPath(); g.moveTo(x, y - 110); g.lineTo(x + dir * tw / 2, y - 110 + th / 2); g.lineTo(x + dir * tw / 2, y + th / 2); g.lineTo(x, y); g.fill();
          g.strokeStyle = `rgba(20,24,24,.7)`; g.lineWidth = 1; for (let r = 1; r < 7; r++) { g.beginPath(); g.moveTo(x, y - 110 + r * 16); g.lineTo(x + dir * tw / 2, y - 110 + r * 16 + th / 2); g.stroke(); }
          if (k % 2) { g.fillStyle = 'rgba(8,6,6,.85)'; g.beginPath(); g.ellipse(x + dir * tw / 4, y - 30 + th / 4, 12, 30, dir * .45, Math.PI, 0); g.lineTo(x + dir * tw / 4 + 12, y + th / 4); g.lineTo(x + dir * tw / 4 - 12, y + th / 4); g.fill(); }
          g.fillStyle = `rgb(${76 * L},${88 * L},${86 * L})`; g.beginPath(); g.moveTo(x, y - 110); g.lineTo(x + dir * tw / 2, y - 110 + th / 2); g.lineTo(x + dir * tw / 2 + 10, y - 115 + th / 2); g.lineTo(x + 10, y - 115); g.fill(); }
      };
      wall(120, 60, 9, 1); wall(120, 60, 4, -1);
      const torch = (x, y) => { g.fillStyle = '#2a2622'; g.fillRect(x - 2, y - 60, 4, 60);
        const f = g.createRadialGradient(x, y - 70, 2, x, y - 70, 70); f.addColorStop(0, 'rgba(255,190,90,.55)'); f.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = f; g.fillRect(x - 70, y - 140, 140, 140);
        g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(x - 7, y - 62); g.quadraticCurveTo(x - 6, y - 80, x, y - 92); g.quadraticCurveTo(x + 7, y - 78, x + 7, y - 62); g.fill();
        g.fillStyle = '#fff0b0'; g.beginPath(); g.ellipse(x, y - 68, 3, 6, 0, 0, 7); g.fill(); };
      torch(640, 250); torch(860, 230); torch(110, 420);
      const hero = (x, y) => { g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(x, y, 16, 6, 0, 0, 7); g.fill();
        g.fillStyle = '#3b3140'; g.fillRect(x - 6, y - 16, 5, 16); g.fillRect(x + 1, y - 16, 5, 16);
        g.fillStyle = '#a0643a'; g.fillRect(x - 9, y - 40, 18, 25); g.fillStyle = '#d9b089'; g.beginPath(); g.arc(x, y - 46, 6, 0, 7); g.fill();
        g.strokeStyle = '#cfd3d6'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 10, y - 30); g.lineTo(x + 30, y - 58); g.stroke(); };
      hero(hx, hy);
      const bones = (x, y) => { g.strokeStyle = 'rgba(214,200,170,.8)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x, y - 14); g.moveTo(x - 8, y); g.lineTo(x, y - 14); g.lineTo(x + 8, y);
        g.moveTo(x - 10, y - 32); g.lineTo(x + 10, y - 30); g.stroke(); g.fillStyle = 'rgba(214,200,170,.85)'; g.beginPath(); g.arc(x, y - 45, 5, 0, 7); g.fill(); };
      bones(400, 150); bones(455, 125); bones(330, 175);
      const v = g.createRadialGradient(hx, hy, 150, hx, hy, 620); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
      // the HUD: a stone panel, four buttons each side, a belt of eight potions, the red orb and the blue
      const PX0 = 128, PX1 = 896, PY = 452; g.fillStyle = '#4a4744'; g.fillRect(PX0, PY, PX1 - PX0, H - PY);
      for (let i = 0; i < 2500; i++) { const c = 50 + q() * 50; g.fillStyle = `rgba(${c},${c},${c - 4},.5)`; g.fillRect(PX0 + q() * (PX1 - PX0), PY + q() * (H - PY), 2 + q() * 4, 2 + q() * 3); }
      g.strokeStyle = '#8a7a52'; g.lineWidth = 3; g.strokeRect(PX0 + 2, PY + 2, PX1 - PX0 - 4, H - PY - 4);
      for (const [x0, x1] of [[PX0 + 10, PX0 + 100], [PX1 - 100, PX1 - 10]]) for (let k = 0; k < 4; k++) {
        g.fillStyle = '#9c8a5c'; g.fillRect(x0, PY + 12 + k * 28, x1 - x0, 20); g.fillStyle = '#6b5d3c'; g.fillRect(x0 + 3, PY + 15 + k * 28, x1 - x0 - 6, 14);
        g.fillStyle = '#d8cfa8'; for (let s = 0; s < 4; s++) g.fillRect(x0 + 18 + s * 16, PY + 20 + k * 28, 9, 4); }
      const orb = (x, c0, c1) => { const r = g.createRadialGradient(x - 14, PY + 36, 6, x, PY + 52, 56); r.addColorStop(0, c0); r.addColorStop(1, c1); g.fillStyle = r; g.beginPath(); g.arc(x, PY + 58, 54, 0, 7); g.fill();
        g.strokeStyle = '#2b2926'; g.lineWidth = 6; g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - 18, PY + 30, 9, 5, -.6, 0, 7); g.fill(); };
      orb(250, '#e0463e', '#4a0708'); orb(774, '#5a6cff', '#070b48');
      g.fillStyle = '#211d1a'; g.fillRect(330, PY + 8, 364, 44); g.fillStyle = '#0a0908'; g.fillRect(330, PY + 58, 364, H - PY - 66);
      for (let k = 0; k < 8; k++) { const x = 338 + k * 45; g.fillStyle = '#3a3531'; g.fillRect(x, PY + 12, 38, 36);
        g.fillStyle = k < 3 ? '#c21f25' : k === 3 || k === 7 ? '#d9d2c2' : '#2436d8'; g.beginPath(); g.moveTo(x + 13, PY + 18); g.lineTo(x + 25, PY + 18); g.lineTo(x + 29, PY + 42); g.lineTo(x + 9, PY + 42); g.fill(); }
    });
  }

  // the desk corner, in its own frame: x along the wall from its window end, z = 0 on the wall, the room at -z
  {
    const P1 = [800.7, -735.3], ex = [-.7909, .612], ez = [-.612, -.7909];
    const toW = (x, z) => [P1[0] + x * ex[0] + z * ez[0], P1[1] + x * ex[1] + z * ez[1]];
    const S = new THREE.Group(); S.position.set(P1[0], 0, P1[1]); S.rotation.y = Math.atan2(-.612, -.7909); root.add(S);
    const WZ = -6, D0 = 1, D1 = 173, DD = 60, TOP = 74, CX = 113;      // the desk: its back 6 cm off the wall, from the window wall to
    // where A.04 ends it (172 long; A.04 draws 120, from 53); the screens' centre CX, where A.04 has the desk's middle
    const steelB = std({ name: 'deskSteel', color: '#1d1d1c', roughness: .45, metalness: .6 });
    const alu = std({ name: 'aluminium', color: '#c9cbcd', roughness: .3, metalness: 1 });
    const plastic = std({ name: 'plasticBlack', color: '#1a1a1b', roughness: .55 });
    const screenM = std({ name: 'screen', color: '#050607', roughness: .07, metalness: .1 }), bezelM = std({ name: 'bezel', color: '#1b1c1f', roughness: .5, metalness: .3 });
    const gameM = std({ name: 'gameScreen', color: '#000000', emissive: '#ffffff', emissiveMap: gameTexture(), emissiveIntensity: 1.5, roughness: .12 });
    const b = (x0, x1, y0, y1, z0, z1, m, o = {}) => box(x0, x1, y0, y1, z0, z1, m, { parent: S, ...o });
    // the desk: the oak top, 2.6 thick, its edges eased; two black steel sled legs 6 cm in from the ends, a rail along the back
    b(D0, D1, TOP - 2.6, TOP, WZ - DD, WZ, oak, { r: .8 });
    for (const x of [D0 + 6, D1 - 6 - 4]) {
      b(x, x + 4, TOP - 5.6, TOP - 2.6, WZ - DD + 4, WZ - 4, steelB, { r: .6 });
      b(x, x + 4, 0, 1.4, WZ - DD + 4, WZ - 4, steelB, { r: .6 });
      for (const z of [WZ - DD + 4, WZ - 6]) b(x, x + 4, 1.4, TOP - 5.6, z, z + 2, steelB, { r: .6 });
    }
    b(D0 + 10, D1 - 10, TOP - 9.6, TOP - 5.6, WZ - 8, WZ - 6, steelB, { r: .6 });
    foot.push([toW(D0, WZ + 1), toW(D1, WZ + 1), toW(D1, WZ - DD), toW(D0, WZ - DD)]);
    // a felt mat; the keyboard (tenkeyless, aluminium, pale keys); the mouse on its right, as the sitter sees it (-x)
    b(CX - 44, CX + 40, TOP, TOP + .35, WZ - DD + 7, WZ - DD + 38, std({ name: 'felt', color: '#8f877c', roughness: 1 }), { r: .3 });
    const kz = WZ - DD + 20, kx = CX + 4, kb = TOP + .35;
    b(kx - 18, kx + 18, kb, kb + 1.6, kz - 6.5, kz + 6.5, alu, { r: .6 });
    { const keys = [], kg = new RoundedBoxGeometry(1.55, .7, 1.55, 1, .25);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 18; col++) { if (row === 0 && col > 4 && col < 11) continue;   // the near row: the space bar in the gap
        keys.push(kg.clone().translate(kx - 16.1 + col * 1.9, kb + 1.9, kz - 4.4 + row * 2.1)); }
      keys.push(new RoundedBoxGeometry(11, .7, 1.55, 1, .25).translate(kx - 16.1 + 7.5 * 1.9, kb + 1.9, kz - 4.4));
      const K = new THREE.Mesh(mergeGeometries(keys), std({ name: 'keycap', color: '#e3e1dc', roughness: .6 })); K.castShadow = K.receiveShadow = true; S.add(K); }
    { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({ name: 'mouse', color: '#dcdad5', roughness: .45 }));
      m.scale.set(3.1, 3.6, 5.8); m.position.set(kx - 28, kb, kz + 1); m.rotation.y = .12; m.castShadow = m.receiveShadow = true; S.add(m); }
    // two 24" screens (53.4 x 31.8, the picture 52.2 x 29.4) in a shallow V, their inner edges meeting over CX, on slim aluminium stands;
    // the one on the sitter's left has the game on
    for (const sd of [-1, 1]) {
      const G = new THREE.Group(); G.position.set(CX + sd * .6, 0, WZ - 20); G.rotation.y = sd * .2; S.add(G);
      const x = sd * 26.7, y0 = TOP + 11, y1 = y0 + 31.8;
      box(x - 26.7, x + 26.7, y0, y1, -.9, .9, bezelM, { r: .4, parent: G });
      box(x - 17, x + 17, y0 + 5, y1 - 7, .9, 3.2, plastic, { r: 1.2, parent: G });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(52.2, 29.4), sd > 0 ? gameM : screenM); scr.rotation.y = Math.PI; scr.position.set(x, y0 + 1.6 + 14.7, -.92); G.add(scr);
      box(x - 2.4, x + 2.4, TOP + 1, y0 + 19, 3.2, 5.2, alu, { r: .8, parent: G });
      box(x - 8.5, x + 8.5, TOP, TOP + 1, -6, 11, alu, { r: .5, parent: G });
    }
    // the PC: a mid tower (21 x 47 x 45), charcoal, its front in vertical oak slats, a white power ring; under the window end
    { const px0 = D0 + 12, pz0 = WZ - 3, pz1 = pz0 - 47;
      b(px0, px0 + 21, 1.2, 46.2, pz1 + 1.2, pz0, std({ name: 'pcCase', color: '#2a2a29', roughness: .5, metalness: .2 }), { r: .8 });
      for (let i = 0; i < 9; i++) b(px0 + 1.2 + i * 2.1, px0 + 2.7 + i * 2.1, 3, 44.4, pz1, pz1 + 1.4, oak, { r: .3 });
      for (const x of [px0 + 2, px0 + 16]) for (const z of [pz1 + 3, pz0 - 5]) b(x, x + 3, 0, 1.2, z, z + 2, plastic, { r: .3 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.55, .12, 8, 24), std({ name: 'ledRing', color: '#f4f4f2', roughness: .4, emissive: '#dfe9ff', emissiveIntensity: .8 }));
      ring.rotation.x = Math.PI / 2; ring.position.set(px0 + 10.5, 46.25, pz1 + 4); S.add(ring); }
    // the chair: five polished aluminium spokes on twin castors, a black gas lift, a seat and a back in warm grey knit on a black shell,
    // T-arms; pulled back from the desk as A.04 draws it, turned a little
    { const C = new THREE.Group(); C.position.set(CX - 4, 0, WZ - DD - 30); C.rotation.y = .22; S.add(C);
      const knit = linen('#9d948a'), c = (x0, x1, y0, y1, z0, z1, m, o = {}) => box(x0, x1, y0, y1, z0, z1, m, { parent: C, ...o });
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 6, 24), alu); hub.position.y = 10; C.add(hub);
      for (let k = 0; k < 5; k++) {
        const A = new THREE.Group(); A.rotation.y = k / 5 * Math.PI * 2 + .3; C.add(A);
        const sp = box(3, 31, 7.2, 10.2, -2, 2, alu, { r: 1, parent: A }); sp.rotation.z = -.05;
        box(29.5, 32.5, 6, 8, -1.5, 1.5, plastic, { r: .4, parent: A });
        for (const z of [-1.3, 1.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 1.8, 20), plastic); w.rotation.x = Math.PI / 2; w.position.set(32.5, 2.9, z); w.castShadow = true; A.add(w); }
      }
      const lift = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 28, 16), plastic); lift.position.y = 26; C.add(lift);
      c(-10, 10, 38, 42, -10, 10, plastic, { r: 1 });
      c(-25, 25, 41, 44, -23, 23, plastic, { r: 2.5 });
      c(-24.5, 24.5, 43, 50, -23, 23.5, knit, { r: 3.5, scale: LINEN, soft: .6, seed: 21 });
      c(-3, 3, 42, 62, -27, -23, plastic, { r: 1 });
      const bk = c(-23.5, 23.5, 56, 108, -29, -24.5, knit, { r: 3.5, scale: LINEN, soft: .45, seed: 23 }); bk.rotation.x = -.14;
      const shl = c(-23, 23, 57, 107, -30.6, -28.6, plastic, { r: 1.5 }); shl.rotation.x = -.14;
      for (const x of [-26.5, 26.5]) { c(x - 1.2, x + 1.2, 43, 64, -6, -2, plastic, { r: .8 }); c(x - 3, x + 3, 64, 66.5, -14, 10, plastic, { r: 1.1 }); }
      const [cx, cz] = toW(C.position.x, C.position.z); foot.push(Array.from({ length: 12 }, (_, i) => [cx + Math.cos(i / 12 * Math.PI * 2) * 32, cz + Math.sin(i / 12 * Math.PI * 2) * 32]));
      const an = new THREE.Object3D(); an.position.set(0, 50, 0); C.add(an); seats.push({ name: 'office chair', anchors: [an], get meshes() { const m = []; C.traverse(o => { if (o.isMesh) m.push(o); }); return m; } }); }
    // over the desk, two plain floating oak shelves, 2.4 thick, 22 deep: the upper one from the window end, the lower one to the door
    // end: books, vases, a framed photo. The ivy on a little shelf of its own by the window, on the desk's right as the sitter sees it
    const Y1 = 146, Y2 = 184, sh1 = [96, 176], sh2 = [48, 136], q = rng(55);
    b(sh1[0], sh1[1], Y1, Y1 + 2.4, -22, 0, oak, { r: .3 });
    b(sh2[0], sh2[1], Y2, Y2 + 2.4, -22, 0, oak, { r: .3 });
    bookRow(S, q, sh1[1] - 3, Y1 + 2.4, 0, 9, -1);
    { const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [4.4, 0], [5.2, 4], [5, 10], [3, 15], [2.2, 17.5], [2.6, 19], [0, 18.6]].map(([a, c]) => new THREE.Vector2(a, c)), 40), ceramic);
      vase.position.set(sh1[0] + 30, Y1 + 2.4, -11); vase.castShadow = vase.receiveShadow = true; S.add(vase); }
    photo(S, sh1[0] + 13, Y1 + 2.4, 0, 18, 24, PICS.forest);
    bookPile(S, q, sh2[1] - 48, Y2 + 2.4, 0, 3);
    bookRow(S, q, sh2[1] - 4, Y2 + 2.4, 0, 5, -1);
    { const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [3.2, 0], [4.6, 5], [4.4, 11], [2.2, 14.5], [1.6, 17], [2, 18], [0, 17.6]].map(([a, c]) => new THREE.Vector2(a, c)), 40), ceramic);
      vase.position.set(sh2[0] + 14, Y2 + 2.4, -11); vase.castShadow = vase.receiveShadow = true; S.add(vase); }
    b(14, 46, 186, 188.4, -18, 0, oak, { r: .3 });
    ivy({ THREE, root: S, std, WZ: 0, CX: 30, y: 188.4, seed: 311, reach: .8 });
  }

  // the sofa bed on the wall to the bedroom (z = -375.5), from x 720 to the corner at 919: 200 x 96, in a rust woven fabric on slim oak
  // legs, square arms, two seat and two back cushions. Its bed pulls out from under the seat as a drawer, 79 cm, and its cushion then
  // lifts level with the seat: 163 x 157 to sleep on. A click on it pulls it out or pushes it back
  {
    const SX0 = 720, SX1 = 919, SW = -376, SF = -472, fab = linen('#a4674c'), parts = [], add = o => (parts.push(o), o);
    for (const x of [SX0 + 7, SX1 - 7]) for (const z of [SW - 7, SF + 7]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.3, 12, 16), oak); l.position.set(x, 6, z); l.castShadow = true; root.add(l); parts.push(l); }
    add(box(SX0 + 2, SX1 - 2, 12, 38, SW - 1, SF + 1, fab, { r: 2, scale: LINEN }));                                        // the base
    for (const [a, c] of [[SX0, SX0 + 18], [SX1 - 18, SX1]]) add(box(a, c, 12, 62, SW, SF, fab, { r: 5, scale: LINEN, soft: .35, seed: 31 + (a & 3) }));   // the arms
    add(box(SX0 + 18, SX1 - 18, 38, 80, SW, SW - 17, fab, { r: 4, scale: LINEN }));                                        // the back
    const mid = (SX0 + SX1) / 2;
    for (const [a, c, k] of [[SX0 + 18.5, mid - .3, 0], [mid + .3, SX1 - 18.5, 1]]) {
      add(box(a, c, 38, 50, SW - 17.5, SF + 1, fab, { r: 5, scale: LINEN, soft: .7, seed: 41 + k }));                        // the seat cushions
      const bc = add(box(a, c, 50, 90, SW - 18, SW - 38, fab, { r: 6, scale: LINEN, soft: 1, seed: 45 + k })); bc.rotation.x = .16;   // the back cushions, leaning back
    }
    const X = new THREE.Group(), xa = SX0 + 19, xb = SX1 - 19; root.add(X);
    add(box(xa, xb, 12, 36, SF - .8, SF + 78, fab, { r: 2, scale: LINEN, parent: X }));                                   // the drawer: its front the sofa's, under the seat
    for (const x of [xa + 8, xb - 8]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.3, 12, 16), oak); l.position.set(x, 6, SF - 6); l.castShadow = true; X.add(l); parts.push(l); }
    const T = add(box(xa + .5, xb - .5, 22, 36, SF - .3, SF + 77, fab, { r: 4, scale: LINEN, soft: .5, seed: 49, parent: X }));   // its cushion, lying in it
    const SB = { on: false, c: 0 }, sfoot = [[SX0, SW], [SX1, SW], [SX1, SF], [SX0, SF]]; foot.push(sfoot);
    const ease = t => t * t * (3 - 2 * t), cl = THREE.MathUtils.clamp;
    const pose = () => { const slide = ease(cl(SB.c / .7, 0, 1)), rise = ease(cl((SB.c - .62) / .38, 0, 1));
      X.position.z = -79 * slide; T.position.y = 29 + 14 * rise; sfoot[2][1] = sfoot[3][1] = SF - .8 - 79 * slide; };
    movers.push(dt => { const to = SB.on ? 1 : 0; if (SB.c === to) return false; SB.c += Math.sign(to - SB.c) * Math.min(Math.abs(to - SB.c), dt / 1.8); pose(); return true; });
    switches.push({ name: 'sofa bed', get on() { return SB.on; }, meshes: parts, set(v) { SB.on = !!v; } });
    // over it: two framed photos on the wall, and ivy trailing from a little oak shelf by the corner
    photo(root, 772, 118, SW + .5, 40, 50, PICS.dunes, oak, true);
    photo(root, 822, 118, SW + .5, 40, 50, PICS.lake, blackFrame, true);
    box(862, 906, 168, 170.4, SW - 18, SW + .5, oak, { r: .3 });
    ivy({ THREE, root, std, WZ: SW + .5, CX: 884, y: 170.4, seed: 523, reach: .6 });
  }

  // the PAX right of the door, along the wall to the bedroom: a 100 and a 50 frame, a filler to the door's wall (pax() builds along z,
  // its doors facing +x: turned a quarter here, to face -z)
  const paxE = (() => { const G = new THREE.Group(); G.position.set(0, 0, -375.5); G.rotation.y = Math.PI / 2; root.add(G);
    const r = pax({ THREE, root: G, mats: hallMats, x0: 0, z0: 546, z1: 703, frames: [100, 50], fill: 'z0' });
    foot.push(r.foot.map(([x, z]) => [z, -375.5 - x])); return r; })();

  // the rug: 180 x 120, before the sofa and partly under it: cream wool, an irregular charcoal lattice, a fringe at the short ends
  { const W = 180, D = 120, cx = 800, cz = -512;
    const tex = canvasTex(1536, 1024, (g, w, h) => { const q = rng(77); g.fillStyle = '#ebe4d6'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90000; i++) { g.fillStyle = q() < .55 ? 'rgba(255,252,246,.35)' : 'rgba(160,150,134,.16)'; g.fillRect(q() * w, q() * h, 1 + q() * 2.5, 1 + q() * 2.5); }   // the pile
      g.strokeStyle = 'rgba(50,46,42,.9)'; g.lineCap = 'round'; const cw = w / 5, k = cw / (h / 3);
      for (let i = -4; i <= 9; i++) for (const s of [1, -1]) { const ph = q() * 6;
        for (let y = 0; y < h; y += 6) { const x0 = i * cw + s * y * k + 5 * Math.sin(y * .03 + ph), x1 = i * cw + s * (y + 6) * k + 5 * Math.sin((y + 6) * .03 + ph);
          g.lineWidth = 7 + 3 * Math.sin(y * .11 + ph); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y + 6); g.stroke(); } }
      g.fillStyle = 'rgba(50,46,42,.85)'; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if (q() < .5) { const x = (i + .5) * cw, y = (j + .5) * h / 3; g.fillRect(x - 12, y - 3, 24, 6); g.fillRect(x - 3, y - 12, 6, 24); } });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(W, D), std({ name: 'rug', map: tex, roughness: 1 })); top.rotation.x = -Math.PI / 2; top.position.set(cx, 1, cz); top.receiveShadow = true; root.add(top);
    box(cx - W / 2, cx + W / 2, 0, .95, cz - D / 2, cz + D / 2, std({ name: 'rugEdge', color: '#e6dfd2', roughness: 1 }), { r: .4 });
    const fr = []; for (const s of [-1, 1]) for (let z = cz - D / 2 + 1.5; z < cz + D / 2 - 1; z += 1.3) fr.push(new THREE.BoxGeometry(5 + Math.sin(z * 1.7) * .8, .25, .35).translate(cx + s * (W / 2 + 2.5), .3, z));
    const F = new THREE.Mesh(mergeGeometries(fr), std({ name: 'rugEdge', color: '#e6dfd2', roughness: 1 })); F.receiveShadow = true; root.add(F); }

  // ---------- the living room: two floating oak shelves over its radiator (231..394 on z = -610), clear of the ivy's strands:
  // books, framed photos, a vase and a candle ----------
  { const WZ = -610, q = rng(88), L1 = [242, 372, 136], L2 = [288, 388, 172];
    for (const [a, c, y] of [L1, L2]) box(a, c, y, y + 2.4, WZ - 20, WZ, oak, { r: .3 });
    let x = bookRow(root, q, L1[0] + 3, L1[2] + 2.4, WZ, 7);
    photo(root, x + 14, L1[2] + 2.4, WZ, 22, 17, PICS.sunset, blackFrame);
    photo(root, L1[1] - 26, L1[2] + 2.4, WZ, 17, 22, PICS.pier);
    { const v = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [3.2, 0], [4.6, 5], [4.4, 11], [2.2, 14.5], [1.6, 17], [2, 18], [0, 17.6]].map(([a, c]) => new THREE.Vector2(a, c)), 40), ceramic);
      v.position.set(L1[1] - 8, L1[2] + 2.4, WZ - 10); v.castShadow = v.receiveShadow = true; root.add(v); }
    photo(root, L2[0] + 16, L2[2] + 2.4, WZ, 24, 18, PICS.hills);
    const py = bookPile(root, q, L2[0] + 36, L2[2] + 2.4, WZ, 3);
    { const cd = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7, 32), std({ name: 'candle', color: '#f1ece2', roughness: .7 })); cd.position.set(L2[0] + 46, py + 3.5, WZ - 10); cd.castShadow = true; root.add(cd); }
    bookRow(root, q, L2[1] - 3, L2[2] + 2.4, WZ, 6, -1);
  }

  seats.push(...buildBalconies({ THREE, root, std, box, foot, lamps, canvasTex, rng, mergeGeometries, linen, oakMaps: { map: oakC, normalMap: oakN, roughnessMap: oakR }, balconies }).seats);   // the balconies, to sit out on
  const kid = buildKidroom({ THREE, root, std, box, foot, linen, oak, canvasTex, rng, mergeGeometries, pax, hallMats, H, lamps });   // H, the child's room
  seats.push(...kid.seats);
  const bath = buildBath({ THREE, root, std, box, foot, lamps, canvasTex, rng, H, oakMaps: { map: oakC, normalMap: oakN, roughnessMap: oakR } });   // G, the bathroom

  const setLamps = on => lamps.forEach(l => l.set(on));
  // lying on it: the head on the pillows, the eyes 80 cm up, looking down the bed at the TV; where you stand up beside it
  const bed = { x0: BX0, x1: BX1, headZ: WZ - 50, standZ: WZ - 125, eye: 80, yaw: -Math.PI / 2, pitch: .19, meshes: bedParts };
  return { root, foot, lamps: [...lamps, ...switches], setLamps, update, step, paxDoors: [...run.doors, ...paxE.doors, ...kid.paxDoors], seats, openers: bath.openers, bed, setClosed, closure, trackOf, inside };
}
