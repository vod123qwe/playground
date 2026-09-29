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

// the windows' inside faces, walked with the room on the left
const WINDOWS = {
  H: [{ a: [393, -44], b: [20, -44] }],
  E: [{ a: [801, -735], b: [1019, -453], span: [93, 314] }],        // the study: the window (113 to 294 along the wall) and 20 cm either side
  F: [{ a: [1026, -443], b: [1174, -253] }, { a: [1183, -254], b: [1246, -172] }, { a: [1246, -172], b: [1114, -68] }, { a: [1105, -70], b: [1071, -44] }],
};

export async function buildRooms({ THREE, H, clip, renderer, base = 'assets/', hallMats }) {
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

  // ---------- curtains: a frame along each window face (x along it, +z into the room), a pelmet, the sheers across, the drapes at the ends ----------
  const curtain = (s0, s1, fw, z, top, n, m, { scale = LINEN, seed = 1, shadow = true } = {}) => {
    const W = s1 - s0, f = Math.max(1.02, fw / W), A = (W / n) * Math.sqrt(f * f - 1) / 4, q = rng(seed);
    const g = new THREE.PlaneGeometry(1, 1, n * 8, 28), p = g.attributes.position, uv = g.attributes.uv;
    const amp = Array.from({ length: n + 2 }, () => .65 + q() * .7), ph = q() * 6, ph2 = q() * 6;
    for (let i = 0; i < p.count; i++) {
      const t = uv.getX(i), v = uv.getY(i), y = 1.5 + v * (top - 1.5), k0 = t * n;
      const k = k0 + (k0 > 0 && k0 < n ? .18 * Math.sin(k0 * 1.37 + ph2) * (.4 + .6 * (1 - v)) : 0), j = Math.max(0, Math.min(n, Math.floor(k))), fr = k - j;
      const w = A * (amp[j] * (1 - fr) + amp[j + 1] * fr) * (1 + .18 * (1 - v) ** 2) * Math.sin(k * Math.PI * 2) + (1 - v) * 1.6 * Math.sin(t * 7 + ph) + (1 - v) ** 3 * .8 * Math.sin(k0 * 2.1 + ph2);
      p.setXYZ(i, s0 + t * W, y, z + w); uv.setXY(i, t * fw / scale, y / scale);
    }
    g.computeVertexNormals(); const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o;
  };
  const TOP = H - 13, RUNS = [], ROOM = {};                           // ROOM[k].closed: the room's drapes drawn across
  for (const [room, segs] of Object.entries(WINDOWS)) { ROOM[room] = { closed: false, runs: [] }; segs.forEach((sg, i) => {
    const dx = sg.b[0] - sg.a[0], dz = sg.b[1] - sg.a[1], len = Math.hypot(dx, dz), e = [dx / len, dz / len];
    const F = new THREE.Group(); F.position.set(sg.a[0], 0, sg.a[1]); F.rotation.y = Math.atan2(-e[1], e[0]); root.add(F);   // x along e, +z = (-e1, e0): into the room
    const [u0, u1] = sg.span || [0, len];                             // the track's run along the wall; the pelmet, a closed box, over it
    box(u0 - (sg.span ? 0 : 1), u1 + (sg.span ? 0 : 1), H - 12, H, 0, 21, pelmetM, { parent: F });
    const SH = new THREE.Group(), DR = new THREE.Group(); F.add(SH, DR);   // the sheers and the drapes: rebuilt when a leaf moves or the drapes are drawn
    const R = { room, a: sg.a, e, len, u0, u1, SH, DR, first: i === 0, last: i === segs.length - 1, span: !!sg.span, seed: (sg.a[0] * 7) | 0, key: null, leaves: [], spill: [0, 0] };
    const rs = ROOM[room].runs; if (rs.length) { R.prev = rs[rs.length - 1]; R.prev.next = R; } RUNS.push(R); rs.push(R);
  }); }
  // a layer of fabric across a run, split where its window's leaves are; a leaf that opens pushes its panel aside: a side-hung one to
  // its hinge, just outside its swing, a tilting one to the nearer end of the run (as the living room's). leaves: { h, s, W, f, tilt }
  // where a leaf's panel goes when it opens: just outside its swing; a hinge at the run's end has no room there, so the fabric slips round
  // the corner onto the next run (the tracks meet, as A.04 draws a curved one): null then, and the neighbour takes it (spill)
  const tuckOf = (R, l) => { const mid = (l.a + l.b) / 2, toStart = l.tilt ? mid - R.u0 < R.u1 - mid : l.s > 0, h = l.tilt ? (toStart ? l.a : l.b) : l.h;
    const [oa, ob] = toStart ? [h - 16, h - 2] : [h + 2, h + 16];
    if (ob > R.u1 - .5 && R.next) return { spill: 'next' }; if (oa < R.u0 + .5 && R.prev) return { spill: 'prev' };
    return { a: Math.max(R.u0 + 1, oa), b: Math.min(R.u1 - 1, ob) }; };
  function drawnAcross(R, G, z, per, m, opts, leaves, spill = [0, 0]) {
    const ls = leaves.map(l => ({ ...l, a: l.s > 0 ? l.h : l.h - l.W, b: l.s > 0 ? l.h + l.W : l.h }));
    const xs = [...new Set([R.u0 + 1, R.u1 - 1, ...ls.flatMap(l => [l.a, l.b])].map(v => Math.round(v * 10) / 10))].filter(v => v >= R.u0 + 1 && v <= R.u1 - 1).sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      let a = xs[i], b = xs[i + 1]; if (b - a < 2) continue;
      const fw = (b - a) * 2, mid = (a + b) / 2;
      const side = ls.find(k => !k.tilt && Math.abs(k.a - a) < .5 && Math.abs(k.b - b) < .5), tilt = ls.find(k => k.tilt && mid > k.a && mid < k.b);
      const l = side && side.f > .001 ? side : tilt && tilt.f > .001 ? tilt : null;
      let zz = z;
      if (l) {
        const g = THREE.MathUtils.smoothstep(l.f, 0, .4), t = tuckOf(R, { ...l, a, b });   // the fabric clears the leaf's path early
        if (t.spill) { const e0 = t.spill === 'next' ? R.u1 - 1 : R.u0 + 1; a = THREE.MathUtils.lerp(a, e0, g); b = THREE.MathUtils.lerp(b, e0, g); if (b - a < 1.5) continue; }   // it leaves this run
        else { a = THREE.MathUtils.lerp(a, t.a, g); b = THREE.MathUtils.lerp(b, t.b, g); }
        zz = z - 3 * g;
      }
      G.add(curtain(a, b, fw, zz, TOP, Math.max(2, Math.round(fw / per)), m, { ...opts, seed: R.seed + i }));
    }
    for (const [k, amt] of spill.entries()) if (amt > 2) {              // fabric that slipped round from the neighbour: gathered at this end
      const a = k === 0 ? R.u0 + 1 : R.u1 - 15, b = k === 0 ? R.u0 + 15 : R.u1 - 1;
      G.add(curtain(a, b, 14 + amt, z - 3, TOP, Math.max(2, Math.round((14 + amt) / per)), m, { ...opts, seed: R.seed + 90 + k }));
    }
  }
  function dress(R) {                                                // the sheers always across; the drapes across when drawn, else stacked
    const closed = ROOM[R.room].closed, key = closed + '|' + R.spill.map(v => v.toFixed(0)).join(',') + '|' + R.leaves.map(l => `${l.h.toFixed(0)}:${l.f}`).join(',');
    if (key === R.key) return; R.key = key;
    for (const G of [R.SH, R.DR]) for (const c of [...G.children]) { G.remove(c); c.geometry.dispose(); }
    drawnAcross(R, R.SH, 6, 20, sheerM, { scale: 10, shadow: false }, R.leaves, R.spill);
    if (closed) { drawnAcross(R, R.DR, 13, 24, drapeM, {}, R.leaves, R.spill); return; }
    const w = R.u1 - R.u0, dw = R.span ? 18 : 42;                    // stacked at the run's ends (in a span: in its margins)
    if (w < 60) R.DR.add(curtain(R.u0 + 1, R.u1 - 1, 150, 13, TOP, 6, drapeM, { seed: R.seed + 3 }));
    else { if (R.first) R.DR.add(curtain(R.u0 + 2, R.u0 + 2 + dw, dw * 3.5, 13, TOP, Math.round(dw * 3.5 / 24), drapeM, { seed: R.seed + 5 }));
      if (R.last) R.DR.add(curtain(R.u1 - 2 - dw, R.u1 - 2, dw * 3.5, 13, TOP, Math.round(dw * 3.5 / 24), drapeM, { seed: R.seed + 7 })); }
  }
  // the leaves on a run's wall: sashes whose hinge lies on it (within 25 cm of the face, inside its length)
  function update(doors) {
    for (const R of RUNS) {
      R.leaves = [];
      for (const d of doors) {
        if (!d.ph || (d.kind !== 'turn' && d.kind !== 'tilt')) continue;
        const px = d.ph[0] - R.a[0], pz = d.ph[1] - R.a[1], t = px * R.e[0] + pz * R.e[1], off = Math.abs(-px * R.e[1] + pz * R.e[0]);
        if (off > 25 || t < -5 || t > R.len + 5) continue;
        R.leaves.push({ h: t, s: Math.sign(d.dir[0] * R.e[0] + d.dir[1] * R.e[1]) || 1, W: d.lw, f: Math.round(d.f * 50) / 50, tilt: d.kind === 'tilt' });
      }
    }
    for (const R of RUNS) R.spill = [0, 0];                          // the fabric that goes round a corner, and how much (its drawn width)
    for (const R of RUNS) for (const l of R.leaves) {
      if (l.f <= .001 || l.tilt) continue;
      const lw = { ...l, a: l.s > 0 ? l.h : l.h - l.W, b: l.s > 0 ? l.h + l.W : l.h }, t = tuckOf(R, lw), g = THREE.MathUtils.smoothstep(l.f, 0, .4);
      if (t.spill === 'next') R.next.spill[0] += 2 * l.W * g; else if (t.spill === 'prev') R.prev.spill[1] += 2 * l.W * g;
    }
    for (const R of RUNS) dress(R);
  }
  for (const R of RUNS) dress(R);
  // a click on a room's curtains draws its drapes across or back (a switch, as the lamps)
  const switches = Object.entries(ROOM).map(([k, rm]) => ({ name: `curtains ${k}`, curtains: true, get on() { return rm.closed; },
    get meshes() { return rm.runs.flatMap(R => [...R.SH.children, ...R.DR.children]); }, set(v) { rm.closed = !!v; for (const R of rm.runs) dress(R); } }));

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
    lamps.push({ name: x0 < BX0 ? 'bedside left' : 'bedside right', on: false, meshes: [b, sh], set(v) { this.on = !!v; shadeM.emissiveIntensity = v ? 1.6 : 0; light.intensity = v ? 1.2 : 0; } });
    foot.push([[x0, WZ], [x1, WZ], [x1, WZ - 35], [x0, WZ - 35]]);
  }
  // the TV, 55" (123 x 71), on the wall facing the bed (z = -362), its right edge 6 cm from where the wall turns
  { const cx = 921 - 6 - 61.5, y0 = 98, screen = std({ name: 'screen', color: '#050607', roughness: .07, metalness: .1 }), bezel = std({ name: 'bezel', color: '#1b1c1f', roughness: .5, metalness: .3 });
    box(cx - 61.5, cx + 61.5, y0, y0 + 71, -362 + 3, -362 + 6.5, bezel, { r: .5 });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(122, 69.4), screen); s.position.set(cx, y0 + 35.5, -362 + 6.52); root.add(s); }
  const setLamps = on => lamps.forEach(l => l.set(on));
  // lying on it: the head on the pillows, the eyes 80 cm up, looking down the bed at the TV; where you stand up beside it
  const bed = { x0: BX0, x1: BX1, headZ: WZ - 50, standZ: WZ - 125, eye: 80, yaw: -Math.PI / 2, pitch: .19, meshes: bedParts };
  return { root, foot, lamps: [...lamps, ...switches], setLamps, update, paxDoors: run.doors, bed };
}
