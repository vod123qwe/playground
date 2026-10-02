// The town's network of streets besides the loop: two shortcuts through the blocks (they leave the main street on the inside of the
// loop, run along it 30 m in, come back to it before the same checkpoint: a choice of way, the same finish) and side streets closed a
// little way in (a crossing painted on the main street, lights at the corners, a barrier and a no-entry sign, a car parked there).
//   the alley: narrow, blank walls and the backs of houses, bins and a dumpster, a bin knocked over, graffiti, a mattress with the man
//     who sleeps on it and his beer, a few lamps; back doors with letterboxes (subscribers too)
//   the park: a path through a lawn, a playground (swings, a slide, a sandbox, a seesaw, a climbing frame) in its fence, benches, trees;
//     the houses facing the park take papers
// Every street of it is paved for the bike (paved(x, z): as the loop is), its houses' doors, windows and letterboxes in the game's lists.
// createCityNet({ THREE, toon, S, N, ds, INNER, ROAD, PAVE, at, groundAt, put, box, hit, zone, things, doors, windows, mailboxes, colliders, G, P, rnd, startI })
//   → { blocked(i, side), build(), paved(x, z), shortcuts, stubs }

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createCityNet({ THREE, toon, S, N, ds, INNER, ROAD, PAVE, at, groundAt, put, box, hit, zone, things, doors, windows, mailboxes, colliders, G, P, rnd, startI, CARS, parked, townBox, scaffoldsOf, probe, stops, night = false, tourist = false, cen = { x: 110, z: -10, r: 180 } }) {
  const M = c => toon(c), wrap = i => ((i % N) + N) % N, O = 30;
  // ---------- where: two straight stretches for the shortcuts (none of them across a checkpoint: a quarter of the loop from the start),
  // four spots for the side streets on the outside ----------
  const turnOf = (i0, n) => { let t = 0; for (let k = 0; k < n; k++) { const a = S[wrap(i0 + k)].f, b = S[wrap(i0 + k + 1)].f; t += Math.abs(Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z)); } return t; };
  const quarterAt = q => wrap(startI + Math.round(N * q)), cps = [0, .25, .5, .75].map(quarterAt), near = (i, j, m) => { const d = Math.abs(wrap(i - j + N / 2) - N / 2) * ds; return d < m; };
  const LEN = Math.round(64 / ds), shortcuts = [];
  for (let i = 0; i < N && shortcuts.length < 2; i += Math.round(6 / ds)) { const j = i + LEN; if (turnOf(i - Math.round(8 / ds), LEN + Math.round(16 / ds)) > .35) continue; if (cps.some(c => { for (let k = -10; k <= LEN + 10; k += 4) if (wrap(i + k) === c || near(wrap(i + k), c, 6)) return true; return false; })) continue;
    if (shortcuts.some(s0 => Math.abs(wrap(i - s0.a + N / 2) - N / 2) * ds < 140)) continue; shortcuts.push({ a: wrap(i), b: wrap(j), kind: shortcuts.length || tourist ? 'park' : 'alley' }); }
  const stubs = []; for (const f of [.08, .31, .58, .83]) { let i = wrap(startI + Math.round(N * f)); if (shortcuts.some(s0 => near(i, s0.a, 20) || near(i, s0.b, 20))) i = wrap(i + Math.round(30 / ds)); stubs.push({ i, sd: -INNER }); }
  // (the ways kept clear of what the loop plants and puts about: trees, bins, benches)
  { const z0 = (i, d, hx, hz) => { const o = new THREE.Object3D(); o.position.copy(at(i, d, 0)); o.rotation.y = Math.atan2(S[wrap(i)].f.x, S[wrap(i)].f.z); o.updateMatrixWorld(); zone(o, hx, hz); };
    for (const c of shortcuts) { for (const i of [c.a, c.a + LEN]) z0(i, INNER * (O + ROAD) / 2, (O - ROAD) / 2 + 1, 3.5); z0(c.a + Math.round(LEN / 2), INNER * O, 12, LEN * ds / 2 + 2); }
    for (const t of stubs) z0(t.i, t.sd * 18, 17, 5.5); }
  // (the office plaza: on the outside, a stretch with no side street by it; the taxi rank further on, by the kerb)
  const plaza = (() => { for (const f of [.44, .4, .48, .66]) { const i0 = wrap(startI + Math.round(N * f)), i1 = i0 + Math.round(46 / ds); if (stubs.some(t => near(t.i, i0, 30) || near(t.i, i1, 30))) continue; if (cps.some(c => near(c, i0 + Math.round(23 / ds), 30))) continue; return { i0, i1, sd: -INNER }; } return null; })();
  const taxi = (() => { let i = wrap(startI + Math.round(N * .93)); if (stubs.some(t => near(t.i, i, 24))) i = wrap(i + Math.round(30 / ds)); return { i, sd: -INNER }; })();
  if (plaza) { const mid = plaza.i0 + Math.round((plaza.i1 - plaza.i0) / 2), o = new THREE.Object3D(); o.position.copy(at(mid, plaza.sd * 20, 0)); o.rotation.y = Math.atan2(S[wrap(mid)].f.x, S[wrap(mid)].f.z); o.updateMatrixWorld(); zone(o, 16, 26); }
  // ---------- the road works: half the street dug up for the drains (one lane shut behind barriers, a trench, an excavator, the men
  // at it); the traffic goes round it in the other lane, the rider too. On a straight bit away from the side streets, stops, ramps ----------
  const WL = Math.round(26 / ds), works = (() => { const at0 = wrap(startI + Math.round(N * .6)); for (let k = 0; k < 400; k++) { const i0 = wrap(at0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 4), mid = i0 + (WL >> 1), far = (j, m) => !near(j, mid, m + 13);
      if (stubs.some(t => !far(t.i, 14)) || (stops || []).some(q => q.sd === 1 && !far(q.i, 18)) || cps.some(c => !far(c, 16))) continue;   // (the shortcuts' mouths: on the other side, no matter)
      if ([.51, .3, .72].some(q => !far(Math.round(N * q), 20)) || !far(taxi.i, 20) || (plaza && (!far(plaza.i0, 15) || !far(plaza.i1, 15)))) continue; return { i0, i1: i0 + WL, sd: 1 }; } return null; })();
  const nearTaxi = (i, m) => near(i, taxi.i + Math.round(5.4 / ds), m + 6);
  const nearWorks = (i, m) => !!works && near(i, works.i0 + (WL >> 1), m + 13);
  // ---------- the zebra crossings: by each side street (with its lights), and just past each bus stop; people cross on them now and then ----------
  const zebras = []; for (const t of stubs) zebras.push({ i: wrap(t.i - Math.round(5.5 / ds)), lights: true });
  for (const q of stops || []) { const i = wrap(q.i + Math.round(15 / ds)); if (stubs.some(t => near(t.i, i, 20)) || shortcuts.some(c => near(c.a, i, 14) || near(c.b, i, 14)) || nearWorks(i, 20) || (plaza && near(plaza.i0 + (WL >> 1), i, 34))) continue; zebras.push({ i }); }
  for (const z of zebras) z.s = z.i * ds;
  // a lot (at i, on side s) left empty: where a shortcut's leg goes through, where a side street opens
  function blocked(i, s) { if (plaza && s === plaza.sd && wrap(i - plaza.i0 + Math.round(4 / ds)) <= plaza.i1 - plaza.i0 + Math.round(8 / ds)) return true; for (const c of shortcuts) if (s === INNER && (near(i, c.a, 9) || near(i, c.b, 9))) return true; for (const t of stubs) if (s === t.sd && near(i, t.i, 9)) return true; return false; }
  // ---------- the paved ways (segments with a half width): the bike rides on them as on the loop ----------
  const segs = []; const seg = (a, b, hw) => segs.push({ a, b, hw });
  function paved(x, z) { for (const q of segs) { const dx = q.b.x - q.a.x, dz = q.b.z - q.a.z, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - q.a.x) * dx + (z - q.a.z) * dz) / l2)), px = q.a.x + dx * t - x, pz = q.a.z + dz * t - z; if (px * px + pz * pz < q.hw * q.hw) return true; } return false; }
  // a ribbon laid on the ground along a line of points (w wide), its colour; the points: { x, z, i (the loop's station near it) }
  function ribbon(pts, w, col, y = .025) { const pos = [], idx = []; for (let k = 0; k < pts.length; k++) { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2, p = pts[k];
      for (const sg of [-1, 1]) { const x = p.x + nx * sg, z = p.z + nz * sg; pos.push(x, groundAt(x, z, p.i) + y, z); } if (k) { const n = k * 2; idx.push(n - 2, n - 1, n, n - 1, n + 1, n); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); { const n = g.attributes.normal; let up = 0; for (let k = 0; k < n.count; k++) up += n.getY(k); if (up < 0) { g.index.array.reverse(); g.computeVertexNormals(); } }
    const m = new THREE.Mesh(g, M(col)); m.receiveShadow = true; m.userData.noShadow = true; G.add(m); return m; }
  const P2 = (i, d) => { const q = at(i, d, 0); return { x: q.x, z: q.z, i: wrap(i) }; };
  const line = (i0, i1, d, step = 2) => { const out = []; for (let i = i0; i <= i1; i += Math.max(1, Math.round(step / ds))) out.push(P2(i, d)); out.push(P2(i1, d)); return out; };
  const across = (i, d0, d1, step = 2) => { const out = [], n = Math.ceil(Math.abs(d1 - d0) / step); for (let k = 0; k <= n; k++) out.push(P2(i, d0 + (d1 - d0) * k / n)); return out; };
  const dummy = (i, d, turn = 0) => { const o = new THREE.Object3D(); const q = at(i, d, 0); o.position.copy(q); o.rotation.y = Math.atan2(S[wrap(i)].f.x, S[wrap(i)].f.z) + turn; o.updateMatrixWorld(); return o; };
  // the canvas for a sign or a graffiti (pixel letters, see city.js's own font: here a few shapes and colours only)
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  const FONT = { A: '010101111101101', E: '111100110100111', K: '101110100110101', R: '110101110110101', T: '111010010010010', Z: '111001010100111', Ó: '010010101101010', U: '101101101101111', Ł: '100110100100111', P: '110101110100100', Y: '101101010010010', W: '101101111111101', J: '001001001101010', D: '110101101101110', ' ': '000000000000000', C: '111100100100111', B: '110101110101110', F: '111100110100100', G: '011100101101011', L: '100100100100111', H: '101101111101101', N: '110101101101101', M: '101111111101101', X: '101101010101101', I: '111010010010111', S: '111100111001111', O: '111101101101111', '>': '100010001010100', '<': '001010100010001' };
  const words = (text, bg, fg) => cv(text.length * 4 + 3, 9, g => { g.fillStyle = bg; g.fillRect(0, 0, 999, 9); g.fillStyle = fg; [...text].forEach((ch, k) => { const r = FONT[ch] || FONT[' ']; for (let q = 0; q < 15; q++) if (r[q] === '1') g.fillRect(2 + k * 4 + q % 3, 2 + (q / 3 | 0), 1, 1); }); });
  const plate = (text, bg, fg, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: words(text, bg, fg), side: THREE.DoubleSide }));
  const lampM = new THREE.MeshBasicMaterial({ color: '#ffd98a' }), steel = M('#5a5f66'), dark = M('#2a2c30');
  function lamp(i, d) { const g = new THREE.Group(); g.add(box(.12, 4.2, .12, steel, 0, 2.1, 0), box(.5, .14, .3, dark, 0, 4.25, 0)); const l = new THREE.Mesh(new THREE.BoxGeometry(.36, .06, .2), lampM); l.position.set(0, 4.16, 0); g.add(l); put(g, i, d, 0, 0); hit(g, { hx: .1, hz: .1, h: 4, kind: 'hard' }, wrap(i)); }
  // a house set by a way, facing it (turn: its front's way), its door and letterbox and lower windows for the game; s: which side of the
  // way it stands on (its front then towards -s along the road's right)
  function house(i, d, s, w, dd, h, col, door = true) { const g = new THREE.Group(), fx = s * dd / 2;   // (its front: towards the way, the loop's side of it)
    g.add(box(dd, h, w, M(col), 0, h / 2, 0), box(dd + .2, .25, w + .2, M('#4a4e55'), 0, h + .12, 0));
    const wins = []; for (let f = 0; f < Math.floor((h - .8) / 2.8); f++) for (const z of [-w / 3, 0, w / 3]) { if (f === 0 && Math.abs(z) < .1 && door) continue; const y = 1.6 + f * 2.8; g.add(box(.06, 1.3, .9, M('#f0ece2'), fx + s * .02, y, z), box(.08, 1.1, .7, M(rnd() < .15 ? '#c9b77a' : '#3f5566'), fx + s * .04, y, z)); if (f < 2) wins.push({ y, z }); }
    let mb = null; if (door) { g.add(box(.08, 2.2, 1.1, M('#5a3a24'), fx + s * .04, 1.1, 0)); mb = townBox ? townBox(s) : new THREE.Group(); mb.position.set(fx + s * .1, 1.25, 1); g.add(mb); }
    put(g, i, d, 0, 0); hit(g, { hx: dd / 2, hz: w / 2, h, kind: 'hard' }, wrap(i)); zone(g, dd / 2 + .5, w / 2 + .5);
    if (door) { g.updateMatrixWorld(true); const n = new THREE.Vector3(s, 0, 0).transformDirection(g.matrixWorld).setY(0).normalize(), fp = g.localToWorld(new THREE.Vector3(fx, 0, 0)), hi = doors.length; doors.push({ p: fp.clone().addScaledVector(n, 2.6), n, done: false, i: wrap(i) });
      for (const q of wins) windows.push({ p: g.localToWorld(new THREE.Vector3(fx + s * .1, q.y, q.z)), n: n.clone(), hw: .45, hh: .55, broken: false, i: wrap(i), house: hi });
      G.attach(mb); mb.userData.keep = true; const M0 = { o: mb, i: wrap(i), side: s, flag: mb.userData.flag, house: hi, wall: true }; mailboxes.push(M0); hit(mb, { hx: .12, hz: .25, h: 1.5, kind: 'hard' }, wrap(i)); things.push({ kind: 'mailbox', o: mb, mb: M0, C: colliders[colliders.length - 1], side: s, wall: true }); }
    return g; }

  // ---------- the shortcut: its legs and its way; then what is along it, by its kind ----------
  function shortcut(c) { const sg = INNER, w = c.kind === 'alley' ? 4.4 : 3.2, A = c.a, Bn = c.a + LEN;
    const legA = across(A, sg * (ROAD - .2), sg * O), legB = across(Bn, sg * O, sg * (ROAD - .2)), way = line(A, Bn, sg * O);
    for (const L of [legA, way, legB]) { ribbon(L, w, c.kind === 'alley' ? '#3a3d42' : '#c9b893', .03); for (let k = 1; k < L.length; k++) seg(L[k - 1], L[k], w / 2 + .3); }
    for (const L of [legA, legB]) { ribbon(L, w + 2.4, '#b3ad9d', .02); }   // (the legs between the houses: a pavement each side)
    // the sign where it leaves: an arrow and its name
    { const g = new THREE.Group(), t = plate(c.kind === 'alley' ? 'ZAUŁEK >' : 'PARK >', c.kind === 'alley' ? '#3a3d42' : '#467537', '#f6f3ea', 1.6, .5); t.position.y = 2.6; g.add(box(.08, 2.9, .08, steel, 0, 1.45, 0), t); t.rotation.y = Math.PI / 2; put(g, A - Math.round(6 / ds), sg * (ROAD + .7), 0, 0); }
    if (c.kind === 'alley') alley(c, sg, A, Bn); else park(c, sg, A, Bn); }
  function alley(c, sg, A, Bn) { const graf = ['#cf5a3e', '#efc970', '#8fc3f0', '#9fd27a', '#e3742e', '#b7a4e0'];
    // the yard walls on the loop's side (brick, a gate now and then), the backs of houses on the other, close together
    for (let i = A + Math.round(6 / ds); i < Bn - Math.round(6 / ds); i += Math.round(7 / ds)) { if (rnd() > .8) continue; const g = new THREE.Group(); g.add(box(.4, 3, 6.6, M('#8e5a3e'), 0, 1.5, 0), box(.5, .18, 6.8, M('#6b4a2e'), 0, 3.05, 0)); put(g, i, sg * (O - 3.4), 0, 0); hit(g, { hx: .25, hz: 3.3, h: 3, kind: 'hard' }, wrap(i)); zone(g, .6, 3.4); }
    for (let i = A + Math.round(5 / ds); i < Bn - Math.round(5 / ds); i += Math.round(9.5 / ds)) house(i, sg * (O + 3.2 + 3.5), sg, 8.5, 7, 7 + (rnd() * 3 | 0) * 2.8, ['#9a948a', '#a99e8a', '#8a857a', '#b3a58c'][rnd() * 4 | 0], rnd() < .7);
    // what lies about: a dumpster, bins, one knocked over, graffiti on the walls, the mattress and the man on it, his beer; lamps
    for (let i = A + Math.round(10 / ds); i < Bn - Math.round(8 / ds); i += Math.round((11 + rnd() * 8) / ds)) { const side = rnd() < .5 ? -1 : 1, d = sg * (O + side * 1.7);
      if (rnd() < .5) { const g = new THREE.Group(); g.add(box(1, 1.1, 1.8, M('#3f6b35'), 0, .6, 0), box(1.05, .1, 1.85, M('#2f5228'), 0, 1.2, 0)); put(g, i, d + sg * side * .3, 0, 0); hit(g, { hx: .55, hz: .95, h: 1.2, kind: 'hard' }, wrap(i)); }
      else { const o = P.bags(rnd); put(o.group, i, d, 0, rnd() * 6); hit(o.group, o.hit, wrap(i)); } }
    for (let k = 0; k < 7; k++) { const i = A + Math.round((8 + rnd() * 50) / ds), col = graf[rnd() * graf.length | 0], t = cv(16, 8, g => { for (let n = 0; n < 9; n++) { g.fillStyle = graf[(n + k) % graf.length]; const x = rnd() * 14, y = 1 + rnd() * 5; g.fillRect(x | 0, y | 0, 2 + (rnd() * 3 | 0), 1 + (rnd() * 2 | 0)); } g.fillStyle = col; g.fillRect(2, 3, 12, 1); }), pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .5, side: THREE.DoubleSide }));
      const g = new THREE.Group(); pl.position.set(-sg * .23, 1.5, 0); pl.rotation.y = Math.PI / 2; g.add(pl); put(g, i, sg * (O - 3.4), 0, 0); }
    { const i = A + Math.round(LEN * .55), g = new THREE.Group(); g.add(box(1.9, .22, .95, M('#c9b8a0'), 0, .11, 0), box(1.8, .06, .9, M('#a99a80'), 0, .24, 0)); const man = new THREE.Group(); man.add(box(.42, .5, .3, M('#5a5f45'), 0, .55, 0), box(.24, .24, .24, M('#d9a07a'), 0, .95, 0), box(.28, .12, .28, M('#3a3d42'), 0, 1.1, 0), box(.5, .16, .3, M('#2f3a4a'), .3, .3, 0)); man.position.set(-.5, 0, 0); g.add(man);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, .24, 8), M(k ? '#5e7a3a' : '#8e5a2e')); b.position.set(.7 + k * .12, .12, .5 - k * .1); if (k === 2) { b.rotation.z = Math.PI / 2; b.position.y = .05; } g.add(b); }
      put(g, i, sg * (O + 1.6), 0, Math.PI / 2); hit(g, { hx: 1, hz: .5, h: .6, kind: 'soft' }, wrap(i)); things.push({ kind: 'bush', o: g, r: .9, top: .6 }); }
    if (!night) for (let i = A + Math.round(4 / ds); i < Bn; i += Math.round(17 / ds)) lamp(i, sg * (O - 2.6)); }   // (at night the alley is dark: the quick way, the dark way)
  function park(c, sg, A, Bn) { const W2 = 9, green = '#6f8f3e';
    ribbon(line(A + Math.round(4 / ds), Bn - Math.round(4 / ds), sg * O), W2 * 2, green, .015);
    // a low fence round the lawn, benches by the path, trees
    for (const side of [-1, 1]) for (let i = A + Math.round(6 / ds); i < Bn - Math.round(6 / ds); i += Math.round(2.5 / ds)) { const g = new THREE.Group(); g.add(box(.05, .6, .05, dark, 0, .3, 0), box(.04, .04, 2.5, dark, 0, .55, 0)); put(g, i, sg * (O + side * W2), 0, 0); }
    for (let i = A + Math.round(10 / ds); i < Bn - Math.round(10 / ds); i += Math.round(12 / ds)) { const g = new THREE.Group(); g.add(box(.5, .08, 1.7, M('#9e7a4f'), 0, .45, 0), box(.08, .5, 1.7, M('#9e7a4f'), .22, .75, 0)); for (const z of [-.7, .7]) g.add(box(.45, .45, .08, dark, 0, .22, z)); put(g, i, sg * (O + 2.4), 0, Math.PI); hit(g, { hx: .3, hz: .9, h: .6, kind: 'hard' }, wrap(i)); }
    for (let k = 0; k < 9; k++) { const i = A + Math.round((6 + rnd() * 52) / ds), side = rnd() < .5 ? -1 : 1, d = sg * (O + side * (4.5 + rnd() * 3.5)), g = new THREE.Group(), h = 2.4 + rnd() * 1.6; if (tourist && side < 0 && i > A + LEN * .18 - 4 / ds && i < A + LEN * .18 + 16 / ds) continue; g.add(box(.22, h, .22, M('#5a4030'), 0, h / 2, 0)); const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + rnd() * .6, 1), M(['#467537', '#5b8a3c', '#3f6b35'][rnd() * 3 | 0])); cr.position.y = h + .9; g.add(cr); put(g, i, d, 0, rnd() * 6); hit(g, { hx: .2, hz: .2, h, kind: 'hard' }, wrap(i)); }
    // the playground: its fence, swings, a slide, a sandbox, a seesaw, a climbing frame
    if (tourist) touristPark(c, sg, A, Bn);
    { const i0 = A + Math.round(LEN * .45), pg = new THREE.Group(), red = M('#cf5a3e'), blue = M('#3b5670'), yel = M('#efc970'), wood = M('#9e7a4f');
      for (const [x, z, w0, d0] of [[0, -5, 8, .06], [0, 5, 8, .06], [-4, 0, .06, 10]]) pg.add(box(w0, .7, d0, M('#2f4a6e'), x, .35, z));
      pg.add(box(8, .04, 10, M('#c9a96a'), 0, .02, 0));
      { const sw = new THREE.Group(); for (const z of [-1.6, 1.6]) { const a = box(.08, 2.6, .08, red, 0, 1.25, z); a.rotation.x = z > 0 ? -.2 : .2; sw.add(a); } sw.add(box(.08, .08, 3.4, red, 0, 2.45, 0)); for (const z of [-.6, .6]) sw.add(box(.02, 1.6, .02, steel, 0, 1.65, z), box(.35, .05, .2, blue, 0, .85, z)); sw.position.set(-2.2, 0, -2.6); pg.add(sw); }
      { const sl = new THREE.Group(); sl.add(box(.9, 1.6, .9, yel, 0, .8, 0)); for (let k = 0; k < 5; k++) sl.add(box(.6, .05, .1, steel, -.55, .3 + k * .3, .3)); const ramp = box(.7, .05, 2.4, red, 0, .8, 1.5); ramp.rotation.x = -.62; sl.add(ramp); sl.position.set(1.8, 0, -2.6); pg.add(sl); }
      { pg.add(box(2.2, .25, 2.2, wood, 1.8, .12, 2.2), box(1.9, .2, 1.9, M('#e3cf8a'), 1.8, .14, 2.2)); }
      { const ss = new THREE.Group(); ss.add(box(.2, .4, .2, dark, 0, .2, 0)); const bar = box(.25, .08, 3, blue, 0, .45, 0); bar.rotation.x = .18; ss.add(bar); ss.position.set(-1.6, 0, 2.4); pg.add(ss); }
      { const cf = new THREE.Group(); for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 4, 12, Math.PI), yel); t.rotation.y = k * Math.PI / 3; cf.add(t); } cf.position.set(-.2, 0, .1); pg.add(cf); }
      put(pg, i0, sg * (O + 4.6), 0, 0); hit(pg, { hx: 4, hz: 5, h: 1, kind: 'soft' }, wrap(i0)); zone(pg, 4.5, 5.5); }
    // the houses facing the park, on its far side
    for (let i = A + Math.round(6 / ds); i < Bn - Math.round(6 / ds); i += Math.round(11 / ds)) house(i, sg * (O + W2 + 1.5 + 4), sg, 9, 8, 5.6 + (rnd() < .5 ? 2.8 : 0), ['#e8dcc0', '#d8c0a8', '#b7c29a', '#e3c77e'][rnd() * 4 | 0]);
    for (let i = A + Math.round(4 / ds); i < Bn; i += Math.round(20 / ds)) lamp(i, sg * (O + 2)); }

  // ---------- the tourist quarter ----------
  // a food truck: a van with its hatch up, its counter, its name on the roof; it takes a paper at its hatch (a subscriber as a door is)
  const picnics = [], spotsT = [];
  function foodTruck(i, d, sg, name, col) { const g = new THREE.Group(); g.add(box(2.3, 2.5, 4.6, M(col), 0, 1.45, 0), box(2.2, .5, 1.4, M('#2a2c30'), 0, .4, 1.7), box(2.2, .5, 1.4, M('#2a2c30'), 0, .4, -1.7));
    g.add(box(.06, 1, 2.6, M('#3f5566'), sg * 1.16, 1.9, 0), box(1.2, .06, 2.8, M('#f6f3ea'), sg * 1.7, 2.6, 0), box(.5, .08, 2.6, M('#c9c4ba'), sg * 1.3, 1.35, 0));
    const nm = plate(name, '#17181b', '#efc970', name.length * .32 + .4, .45); nm.position.set(0, 2.95, 0); nm.rotation.y = Math.PI / 2; g.add(box(.1, .5, name.length * .32 + .5, dark, 0, 2.95, 0), nm); const nm2 = nm.clone(); nm2.rotation.y = -Math.PI / 2; nm2.position.x = -.06; g.add(nm2);
    put(g, i, d, 0, 0); hit(g, { hx: 1.2, hz: 2.3, h: 2.8, kind: 'hard' }, wrap(i)); g.updateMatrixWorld(true);
    const n = new THREE.Vector3(sg, 0, 0).transformDirection(g.matrixWorld).setY(0).normalize(); doors.push({ p: g.localToWorld(new THREE.Vector3(sg * 1.2, 0, 0)).addScaledVector(n, 2), n, done: false, i: wrap(i) }); return g; }
  // in the park: a skatepark (a pad, a quarter, kickers, a rail: all to ride), two food trucks by the path, picnic blankets on the lawn
  function touristPark(c, sg, A, Bn) { const m = x => Math.round(x / ds);
    { const i0 = A + Math.round(LEN * .18), i1 = i0 + m(12), dd = sg * (O - 5.6), L = line(i0, i1, dd); ribbon(L, 9, '#a9a49a', .02); for (let k = 1; k < L.length; k++) seg(L[k - 1], L[k], 4.6); seg(P2(i0 + m(6), sg * (O - 1)), P2(i0 + m(6), dd), 2);
      for (const [dz, size, turn] of [[1.5, 'big', 0], [8, 'kicker', Math.PI], [5, 'kicker', 0], [10.5, 'plank', Math.PI]]) { const o = P.ramp(rnd, size); put(o.group, i0 + m(dz), dd + sg * (size === 'big' ? 2 : -1.5), 0, turn); hit(o.group, o.hit, wrap(i0)); }
      { const g = new THREE.Group(); g.add(box(.08, .08, 3.4, steel, 0, .5, 0)); for (const z of [-1.5, 1.5]) g.add(box(.06, .5, .06, steel, 0, .25, z)); put(g, i0 + m(6), dd, 0, 0); hit(g, { hx: .06, hz: 1.7, h: .55, kind: 'soft' }, wrap(i0)); }
      spotsT.push({ i: i0 + m(6), d: dd, kind: 'skate' }); }
    foodTruck(A + Math.round(LEN * .62), sg * (O - 4.4), -sg, ['LODY', 'GOFRY', 'ZAPIEKANKI'][rnd() * 3 | 0], ['#e8a0b8', '#a0d0e8', '#f0d070'][rnd() * 3 | 0]);
    for (let k = 0; k < 3; k++) { const i = A + Math.round(LEN * (.3 + k * .22)), d = sg * (O + 5.5 + rnd() * 2.5), g = new THREE.Group(), col = ['#cf5a3e', '#3b5670', '#efc970', '#467537'][k];
      g.add(box(1.8, .03, 1.6, M(col), 0, .02, 0)); for (let q = 0; q < 3; q++) g.add(box(.3, .035, 1.6, M('#f6f3ea'), -.6 + q * .6, .025, 0)); g.add(box(.45, .3, .3, M('#9e7a4f'), .7, .17, .6)); put(g, i, d, 0, rnd() * 3); picnics.push({ i: wrap(i), d, yaw: rnd() * 6.28 }); } }
  // where the town has its office tower: a church with its tower, a monument on the square, a food truck by it
  function oldTown(sg, mid) { const m = x => Math.round(x / ds), wall = M('#e8dcc0'), roof = M('#8e3b2c');
    { const g = new THREE.Group(); g.add(box(10, 9, 16, wall, 0, 4.5, 2), box(10.4, .6, 16.4, roof, 0, 9.3, 2)); const r2 = new THREE.Mesh(new THREE.ConeGeometry(7.6, 4, 4), roof); r2.rotation.y = Math.PI / 4; r2.scale.set(1, 1, 1.6); r2.position.set(0, 11.3, 2); g.add(r2);
      g.add(box(4.4, 22, 4.4, wall, 0, 11, -7.5)); const sp = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 8), M('#4a6a5a')); sp.position.set(0, 26, -7.5); g.add(sp); g.add(box(.1, 1.6, 1.6, M('#3a3d42'), sg * 2.25, 16, -7.5), box(.1, 3, 2, M('#5a3a24'), sg * 5.05, 1.5, 2));
      for (const z of [-2, 2, 6]) g.add(box(.1, 3.4, 1, M('#5a7f94'), sg * 5.05, 4.8, z)); const rose = new THREE.Mesh(new THREE.CircleGeometry(.9, 12), M('#b7a4e0')); rose.position.set(sg * 2.25, 12, -7.5); rose.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(rose);
      put(g, mid, sg * (PAVE + 22), 0, 0); hit(g, { hx: 5.2, hz: 10, h: 22, kind: 'hard' }, wrap(mid)); }
    { const g = new THREE.Group(), br = M('#6a7a5a'); g.add(box(1.6, 1.8, 1.6, M('#c9c4ba'), 0, .9, 0), box(2, .3, 2, M('#b9b2a2'), 0, .15, 0), box(.5, 1, .36, br, 0, 2.4, 0), box(.3, .3, .3, br, 0, 3.05, 0), box(.14, .7, .14, br, .3, 2.7, .1), box(.14, .14, .7, br, -.3, 2.9, .3));
      put(g, mid + m(6), sg * (PAVE + 10), 0, 0); hit(g, { hx: 1, hz: 1, h: 3, kind: 'hard' }, wrap(mid)); }
    foodTruck(mid - m(12), sg * (PAVE + 6), -sg, 'LODY', '#e8a0b8'); spotsT.push({ i: mid, d: sg * (PAVE + 8), kind: 'square' }); }

  // ---------- a side street: in from the main street on the outside, closed a little way in ----------
  function stub(t) { const sg = t.sd, i = t.i, L0 = across(i, sg * (ROAD - .1), sg * 30); ribbon(L0, 6.4, '#3f4246', .03); ribbon(L0, 10.4, '#b3ad9d', .02); for (let k = 1; k < L0.length; k++) seg(L0[k - 1], L0[k], 3.4);
    // the crossing on the main street, white bars across it; the lights at the corners
    zebraBars(i - Math.round(5.5 / ds));
    for (const sd2 of [-1, 1]) { const g = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: '#ff4a30' }), grn = new THREE.MeshBasicMaterial({ color: '#2e4a2e' }); g.add(box(.12, 3.2, .12, steel, 0, 1.6, 0), box(.32, .8, .25, dark, 0, 3.2, 0)); const r = box(.2, .2, .05, red, 0, 3.42, .13), gg = box(.2, .2, .05, grn, 0, 3.0, .13); g.add(r, gg);
      put(g, i + sd2 * Math.round(4.6 / ds), sg * (ROAD + .6), 0, sg > 0 ? -Math.PI / 2 : Math.PI / 2); hit(g, { hx: .1, hz: .1, h: 3, kind: 'hard' }, wrap(i)); }
    // the barrier and the sign, cones before it, a car parked by the kerb; a wall closing the view
    { const o = P.barrier(), d = sg * 20; put(o.group, i, d, 0, Math.PI / 2); hit(o.group, o.hit, wrap(i)); for (const k of [-1, 1]) { const c = P.cone(); put(c.group, i + k * Math.round(1.6 / ds), sg * 18.5, 0, 0); hit(c.group, c.hit, wrap(i)); } }
    { const g = new THREE.Group(), disc = new THREE.Mesh(new THREE.CircleGeometry(.4, 16), new THREE.MeshBasicMaterial({ color: '#c23a2e', side: THREE.DoubleSide })), bar = new THREE.Mesh(new THREE.PlaneGeometry(.55, .12), new THREE.MeshBasicMaterial({ color: '#f6f3ea', side: THREE.DoubleSide })); bar.position.z = .01; disc.add(bar); disc.position.y = 2.3; disc.rotation.y = Math.PI / 2; g.add(box(.07, 2.3, .07, steel, 0, 1.15, 0), disc); put(g, i + Math.round(2.6 / ds), sg * 20.3, 0, 0); }
    { const g = new THREE.Group(); g.add(box(.6, 9, 14, M(['#c9b8a0', '#d8c0a8', '#a9bccb'][rnd() * 3 | 0]), 0, 4.5, 0)); for (let f = 0; f < 3; f++) for (const z of [-4.5, -1.5, 1.5, 4.5]) g.add(box(.08, 1.2, .9, M('#3f5566'), sg * .33, 2 + f * 2.6, z)); put(g, i, sg * 33, 0, 0); hit(g, { hx: .3, hz: 7, h: 9, kind: 'hard' }, wrap(i)); } }

  // ---------- the street's furniture on the paved verge by the kerb: advertising columns, kiosks, phone booths, benches, bike racks,
  // planters, bollards (not at a shortcut's mouth, nor a side street's) ----------
  function furniture() { const poster = () => cv(8, 16, g => { const C = ['#cf5a3e', '#efc970', '#3b5670', '#9fd27a', '#f6f3ea', '#e3742e', '#b7a4e0']; for (let y = 0; y < 16; y += 4) { g.fillStyle = C[rnd() * C.length | 0]; g.fillRect(0, y, 8, 4); g.fillStyle = '#17181b'; g.fillRect(1 + (rnd() * 3 | 0), y + 1, 3 + (rnd() * 3 | 0), 1); } });
    for (let i = 20; i < N - 10; i += Math.round((10 + rnd() * 8) / ds)) { const s = rnd() < .5 ? -1 : 1, d = s * (ROAD + 1.15); if (shortcuts.some(c => near(i, c.a, 12) || near(i, c.a + LEN, 12)) || stubs.some(t => near(i, t.i, 14)) || zebras.some(z => near(i, z.i, 6)) || lampAt.some(L => near(i, L.i, 5))) continue; const k = rnd(), g = new THREE.Group(); let hb = null;
      if (k < .18) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 2.6, 12), [new THREE.MeshBasicMaterial({ map: poster() }), M('#2f4a6e'), M('#2f4a6e')]); c.position.y = 1.4; g.add(c, box(1.15, .14, 1.15, M('#2f4a6e'), 0, 2.78, 0)); const top = new THREE.Mesh(new THREE.ConeGeometry(.62, .35, 12), M('#2f4a6e')); top.position.y = 3.02; g.add(top); hb = { hx: .5, hz: .5, h: 2.8, kind: 'hard' }; }   // (an advertising column)
      else if (k < .3) { g.add(box(1.4, 2.2, 1.8, M('#e3b22e'), 0, 1.1, 0), box(.06, .9, 1.4, M('#3f5566'), s * -.72, 1.4, 0), box(1.6, .15, 2, M('#b3372c'), 0, 2.27, 0)); const t = plate('RUCH', '#b3372c', '#f6f3ea', 1, .3); t.position.set(s * -.82, 2.05, 0); t.rotation.y = Math.PI / 2; g.add(t); hb = { hx: .75, hz: .95, h: 2.3, kind: 'hard' }; }   // (a kiosk)
      else if (k < .4) { g.add(box(1, 2.3, 1, M('#b3372c'), 0, 1.15, 0)); for (const z of [-.51, .51]) g.add(box(.8, 1.4, .02, M('#9fb3bf'), 0, 1.3, z)); g.add(box(.02, 1.4, .8, M('#9fb3bf'), s * -.51, 1.3, 0)); hb = { hx: .5, hz: .5, h: 2.3, kind: 'hard' }; }   // (a phone booth)
      else if (k < .6) { g.add(box(.5, .08, 1.7, M('#9e7a4f'), 0, .45, 0), box(.08, .45, 1.7, M('#9e7a4f'), s * .22, .72, 0)); for (const z of [-.7, .7]) g.add(box(.45, .45, .08, dark, 0, .22, z)); hb = { hx: .3, hz: .9, h: .6, kind: 'hard' }; }   // (a bench)
      else if (k < .72) { for (let n = 0; n < 4; n++) { const a = new THREE.Mesh(new THREE.TorusGeometry(.35, .03, 4, 10, Math.PI), steel); a.position.set(0, 0, (n - 1.5) * .5); a.rotation.y = Math.PI / 2; g.add(a); } hb = { hx: .2, hz: 1, h: .4, kind: 'hard' }; }   // (a bike rack)
      else if (k < .88) { g.add(box(.9, .5, .9, M('#8a857a'), 0, .25, 0)); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 1), M('#467537')); b.position.y = .8; g.add(b); hb = { hx: .45, hz: .45, h: .9, kind: 'hard' }; }   // (a planter)
      else { for (const z of [-.8, 0, .8]) g.add(box(.14, .8, .14, dark, 0, .4, z)); }   // (bollards)
      put(g, i, d, 0, 0); if (hb) hit(g, hb, wrap(i)); }
    // the row by the houses: an A-board before a shop (a poster on it), a street bin, a stand of papers (Trąbka and the other one), a plank
    // to jump off along the pavement
    const paperT = cv(8, 8, g => { for (let y = 0; y < 8; y += 2) { g.fillStyle = y % 4 ? '#e9e3d1' : '#f6f3ea'; g.fillRect(0, y, 8, 2); g.fillStyle = y % 4 ? '#cf5a3e' : '#3b5670'; g.fillRect(1, y, 4, 1); } });
    for (let i = 30; i < N - 10; i += Math.round((12 + rnd() * 10) / ds)) { const s = rnd() < .5 ? -1 : 1, d = s * (PAVE - 1.3); if (shortcuts.some(c => near(i, c.a, 12) || near(i, c.a + LEN, 12)) || stubs.some(t => near(i, t.i, 14)) || zebras.some(z => near(i, z.i, 6)) || (plaza && near(i, plaza.i0 + 40, 40))) continue;
      const k = rnd(), g = new THREE.Group(); let hb = null;
      if (k < .32) { const pl = new THREE.MeshBasicMaterial({ map: poster() }); for (const sg of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.04, 1, .6), [pl, pl, dark, dark, dark, dark]); b.position.set(sg * .2, .5, 0); b.rotation.z = sg * .2; g.add(b); } hb = { hx: .3, hz: .32, h: 1, kind: 'soft' }; }   // (an A-board)
      else if (k < .6) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .24, .85, 10), M('#5a6b4a')); b.position.y = .43; g.add(b, box(.6, .05, .6, dark, 0, .87, 0)); hb = { hx: .28, hz: .28, h: .9, kind: 'soft' }; }   // (a street bin)
      else if (k < .8) { g.add(box(.7, .9, .35, M('#b3372c'), 0, .45, 0)); for (let q = 0; q < 3; q++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.02, .3, .4), new THREE.MeshBasicMaterial({ map: paperT })); p.position.set(-s * .19, .62 - q * .2, 0); p.rotation.z = -s * .25; g.add(p); } hb = { hx: .36, hz: .2, h: .9, kind: 'soft' }; }   // (a stand of papers)
      else { const o = P.ramp(rnd, rnd() < .5 ? 'plank' : 'kicker'); put(o.group, i, s * 5.4, 0, rnd() < .5 ? 0 : Math.PI); hit(o.group, o.hit, wrap(i)); continue; }   // (a plank to jump, along the pavement)
      put(g, i, d, 0, 0); if (hb) hit(g, hb, wrap(i)); } }
  // ---------- the office plaza: the tower (glass, its name over the door), paving, flower beds, a fountain, lamps; a car park with
  // two rows of cars (their roofs to ride, as any parked car's); people walking about it ----------
  const walkers = [];
  function office() { if (!plaza) return; const sg = plaza.sd, i0 = plaza.i0, i1 = plaza.i1, mid = i0 + Math.round((i1 - i0) / 2);
    { const L = line(i0, i1, sg * (PAVE + 9)); ribbon(L, 18, '#b9b2a2', .022); for (let k = 1; k < L.length; k++) seg(L[k - 1], L[k], 9.2); }
    if (night) nightShop(sg, mid); else if (tourist) oldTown(sg, mid); else { const g = new THREE.Group(), gt = cv(8, 16, x => { for (let y = 0; y < 16; y++) for (let q = 0; q < 8; q++) { x.fillStyle = (y % 4 === 0) ? '#5a6a74' : (q % 2 ? '#7fa6c2' : (rnd() < .2 ? '#e8dca0' : '#6f93ad')); x.fillRect(q, y, 1, 1); } });
      gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(4, 10); const glass = toon('#ffffff', { map: gt });
      g.add(box(14, 38, 18, glass, 0, 19, 0), box(14.4, .8, 18.4, M('#4a4e55'), 0, 38.4, 0), box(3, 4, 6, M('#3a3d42'), 0, 40.4, -3));
      g.add(box(3, .25, 7, M('#c9c4ba'), sg * 8.5, 4.2, 0), box(.1, 3.6, 3.2, M('#2f3e4a'), sg * 7.05, 1.8, 0));
      const nm = plate('CENTRUM', '#17181b', '#efc970', 4.4, .9); nm.position.set(sg * 7.12, 5.4, 0); nm.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(nm);
      put(g, mid, sg * (PAVE + 25), 0, 0); hit(g, { hx: 7, hz: 9, h: 38, kind: 'hard' }, wrap(mid)); g.updateMatrixWorld(true);
      const n = new THREE.Vector3(sg, 0, 0).transformDirection(g.matrixWorld).setY(0).normalize(), fp = g.localToWorld(new THREE.Vector3(sg * 7, 0, 0)), hi = doors.length;
      // (the reception: it takes the paper as a door does; the ground floor's glass to break)
      doors.push({ p: fp.clone().addScaledVector(n, 2.6), n, done: false, i: wrap(mid) });
      for (const z of [-6, -3.5, 3.5, 6]) windows.push({ p: g.localToWorld(new THREE.Vector3(sg * 7.05, 2, z)), n: n.clone(), hw: 1.1, hh: 1.3, broken: false, i: wrap(mid), house: hi }); }
    // flower beds, a fountain, lamps on the plaza
    if (!night) for (const k of [-1, 1]) { const g = new THREE.Group(); g.add(box(3, .5, 5, M('#8a857a'), 0, .25, 0), box(2.7, .2, 4.7, M('#5b8a3c'), 0, .55, 0)); for (let q = 0; q < 6; q++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.25, 0), M(['#cf5a3e', '#efc970', '#e889b5'][q % 3])); f.position.set((rnd() - .5) * 2.2, .75, (rnd() - .5) * 4); g.add(f); }
      put(g, mid + k * Math.round(13 / ds), sg * (PAVE + 10), 0, 0); hit(g, { hx: 1.5, hz: 2.5, h: .6, kind: 'hard' }, wrap(mid)); }
    if (!night) { const g = new THREE.Group(), rim = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .6, 16), M('#c9c4ba')), w = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, .1, 16), new THREE.MeshBasicMaterial({ color: '#7fb6cc' })), col = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 1.6, 8), M('#c9c4ba'));
      rim.position.y = .3; w.position.y = .62; col.position.y = .8; g.add(rim, w, col); put(g, mid, sg * (PAVE + 10), 0, 0); hit(g, { hx: 2.4, hz: 2.4, h: .6, kind: 'hard' }, wrap(mid)); }
    for (const k of [-2, -1, 1, 2]) lamp(mid + k * Math.round(9 / ds), sg * (PAVE + 16));
    // the car park, by the plaza's near end: two rows across, their lines painted
    if (CARS) for (let r0 = 0; r0 < 2; r0++) for (let k = 0; k < 5; k++) { const i = i0 + Math.round((2 + k * 2.8) / ds), d = sg * (PAVE + 3.4 + r0 * 6.2), c = CARS.random(rnd); put(c.group, i, d, 0, Math.PI / 2 + (r0 ? Math.PI : 0)); c.group.userData.keep = true; hit(c.group, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard', car: c.group }, wrap(i));
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(.1, 4.6).rotateX(-Math.PI / 2), M('#f0ece2')); ln.userData.noShadow = true; put(ln, i + Math.round(1.4 / ds), d, .04, Math.PI / 2); }
    // the people about the plaza: little figures walking rounds of their own (a coat, a head, legs that step)
    for (let k = 0; k < (night ? 5 : 14); k++) { const g = new THREE.Group(), coat = M(['#3b5670', '#8e2e25', '#44484c', '#6b4a2e', '#467537', '#c9b8a0', '#2f4a6e'][k % 7]);
      g.add(box(.42, .62, .26, coat, 0, 1.12, 0), box(.22, .22, .22, M(['#e3b08a', '#c98a5a', '#d9a07a'][k % 3]), 0, 1.6, 0), box(.24, .07, .24, M(['#24190f', '#9a938a', '#5b3a22'][k % 3]), 0, 1.74, 0));
      const legs = [-1, 1].map(sd => { const l = new THREE.Group(); l.add(box(.14, .78, .16, M('#2a2c30'), 0, -.39, 0)); l.position.set(sd * .1, .8, 0); g.add(l); return l; }); if (k % 3 === 0) g.add(box(.08, .3, .24, M('#2a2c30'), .28, .9, 0));
      const c0 = at(mid + Math.round((rnd() - .5) * 30 / ds), sg * (PAVE + 7 + rnd() * 7), 0); g.position.copy(c0); G.add(g); g.userData.keep = true; walkers.push({ g, legs, c: c0.clone(), r: 2 + rnd() * 5, a: rnd() * 6.28, w: (.6 + rnd() * .5) * (rnd() < .5 ? -1 : 1), ph: rnd() * 6 }); } }
  // ---------- the taxi rank: by the kerb, three taxis in a row with their roof signs, the rank's sign; parked, for the traffic ----------
  function taxis() { if (!CARS) return; const sg = taxi.sd;
    for (let k = 0; k < 3; k++) { const i = taxi.i + Math.round(k * 5.4 / ds), c = CARS.makeCar('saloon', '#efc930'), t = new THREE.Group(), w = plate('TAXI', '#17181b', '#efc970', .5, .16); t.add(box(.56, .2, .22, M('#f6f3ea'), 0, 0, 0)); w.position.z = .12; t.add(w); const w2 = w.clone(); w2.position.z = -.12; t.add(w2); t.position.set(0, 1.55, 0); c.group.add(t);
      put(c.group, i, sg * 2.45, 0, sg < 0 ? Math.PI : 0); c.group.userData.keep = true; hit(c.group, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard', car: c.group }, wrap(i)); }
    parked?.()?.push({ s: wrap(taxi.i - Math.round(3 / ds)) * ds, d: sg * 2.45, len: 16 });   // (the three: gone round in one go)
    const g = new THREE.Group(), pl = plate('POSTÓJ TAXI', '#2f4a6e', '#f6f3ea', 1.9, .42); pl.position.y = 2.6; pl.rotation.y = Math.PI / 2; g.add(box(.07, 2.8, .07, steel, 0, 1.4, 0), pl); put(g, taxi.i - Math.round(3 / ds), sg * (ROAD + 1), 0, 0); hit(g, { hx: .1, hz: .1, h: 2.8, kind: 'hard' }, wrap(taxi.i)); }
  // ---------- planes off the airport: now and then one takes off far out, climbing over the town, and is gone ----------
  const planes = []; { const body = M('#e9e6df'), tail = M('#cf5a3e'); for (let k = 0; k < 2; k++) { const g = new THREE.Group(); g.add(box(1.3, 1.3, 11, body, 0, 0, 0), box(13, .2, 2, body, 0, -.2, .5), box(.2, 2.4, 1.4, tail, 0, 1.4, -4.6), box(4.4, .16, 1, body, 0, .2, -4.6)); g.visible = false; g.userData.keep = true; G.add(g); planes.push({ g, t: -4 - k * 22, a: 0 }); } }
  // ---------- the zebra's bars across the road; the blue sign at each kerb ----------
  function zebraBars(iC) { for (let k = -3; k <= 3; k++) { const o = new THREE.Mesh(new THREE.PlaneGeometry(.5, ROAD * 1.9).rotateX(-Math.PI / 2), M('#f0ece2')); o.userData.noShadow = true; o.renderOrder = 1; put(o, iC + Math.round(k * .9 / ds), 0, .016, 0); } }
  const d6 = cv(9, 9, x => { x.fillStyle = '#2f5fa8'; x.fillRect(0, 0, 9, 9); x.fillStyle = '#f6f3ea'; for (let y = 1; y < 8; y++) { const w = 1 + 2 * Math.floor(y / 2); x.fillRect(4 - (w >> 1), y, w, 1); } x.fillStyle = '#17181b'; x.fillRect(4, 3, 1, 1); x.fillRect(4, 4, 1, 2); x.fillRect(3, 6, 1, 1); x.fillRect(5, 6, 1, 1); });
  function crossing(z) { zebraBars(z.i); for (const sd2 of [-1, 1]) { const g = new THREE.Group(), pl = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ map: d6, side: THREE.DoubleSide })); pl.position.y = 2.5; g.add(box(.07, 2.8, .07, steel, 0, 1.4, 0), pl); put(g, z.i + sd2 * Math.round(2.6 / ds), sd2 * (ROAD + .7), 0, 0); hit(g, { hx: .1, hz: .1, h: 2.8, kind: 'hard' }, wrap(z.i)); } }
  // ---------- the road works ----------
  // (all of the works in a group of its own, their colliders in a list, their place in the traffic's: off for a finale run over them)
  const WG = new THREE.Group(), WC = [], hitW = (...a) => { const C = hit(...a); WC.push(C); return C; }; WG.userData.works = true; let worksOn = true, worksP = null;
  function setWorks(on) { if (!works || on === worksOn) return; worksOn = on; WG.visible = on; for (const C of WC) C.used = !on; const pk = parked?.(); if (pk && worksP) { const ix = pk.indexOf(worksP); if (on && ix < 0) pk.push(worksP); if (!on && ix >= 0) pk.splice(ix, 1); } }
  const workers = [], digs = [], blinkM = new THREE.MeshBasicMaterial({ color: '#ffb347' });
  const a14 = cv(11, 10, x => { for (let y = 0; y < 10; y++) { const h = Math.round(y * .55); for (let q = 5 - h; q <= 5 + h; q++) { x.fillStyle = (y === 9 || y === 0 || q === 5 - h || q === 5 + h) ? '#c23a2e' : '#f6f3ea'; x.fillRect(q, y, 1, 1); } } x.fillStyle = '#17181b'; x.fillRect(5, 3, 1, 1); x.fillRect(4, 4, 2, 2); x.fillRect(3, 6, 1, 2); x.fillRect(6, 6, 1, 2); x.fillRect(7, 5, 1, 1); x.fillRect(8, 7, 1, 1); });
  // a man of the works crew: an orange vest with its stripes, a helmet, what he works with (kind: dig, lean, jack, flag, boss); y: stood lower (in the trench)
  function worker(kind, i, d, turn, y = 0, solid = true) { const g = new THREE.Group(), body = new THREE.Group(), boss = kind === 'boss', skin = M(['#e3b08a', '#c98a5a', '#d9a07a'][rnd() * 3 | 0]), vest = M('#e8742e'), coat = boss ? M('#c9c4ba') : vest, strip = M('#e9e6df'), hat = M(boss ? '#f6f3ea' : '#efc930'), wood = M('#9e7a4f');
    g.add(body); body.position.y = y;
    const legs = [-1, 1].map(s2 => { const l = new THREE.Group(); l.add(box(.15, .8, .17, M(boss ? '#44484c' : '#3b4a5e'), 0, -.4, 0), box(.17, .1, .26, dark, 0, -.77, .04)); l.position.set(s2 * .1, .82, 0); body.add(l); return l; });
    body.add(box(.46, .6, .28, coat, 0, 1.14, 0), box(.47, .06, .29, boss ? vest : strip, 0, 1.02, 0), box(.47, .06, .29, boss ? vest : strip, 0, 1.24, 0), box(.22, .24, .22, skin, 0, 1.58, 0), box(.29, .1, .29, hat, 0, 1.74, 0), box(.3, .03, .12, hat, 0, 1.7, .17));
    const arms = [-1, 1].map(s2 => { const a = new THREE.Group(); a.add(box(.12, .56, .14, coat, 0, -.28, 0), box(.1, .1, .1, skin, 0, -.6, 0)); a.position.set(s2 * .3, 1.4, 0); body.add(a); return a; });
    const tool = new THREE.Group(); body.add(tool);
    if (kind === 'dig' || kind === 'lean') tool.add(box(.04, 1.15, .04, wood, 0, .575, 0), box(.24, .3, .03, steel, 0, -.12, 0));
    if (kind === 'jack') tool.add(box(.18, .5, .18, M('#c23a2e'), 0, .45, 0), box(.5, .05, .05, dark, 0, .74, 0), box(.04, .3, .04, steel, 0, .05, 0));
    if (kind === 'flag') { const disc = c => new THREE.Mesh(new THREE.CircleGeometry(.2, 12), new THREE.MeshBasicMaterial({ color: c })), a = disc('#c23a2e'), b = disc('#3c9a4a'), head = new THREE.Group(); a.position.z = .012; b.position.z = -.012; b.rotation.y = Math.PI; head.position.y = .98; head.add(a, b); tool.add(box(.03, .9, .03, wood, 0, .45, 0), head); tool.userData.head = head; }
    if (boss) tool.add(box(.22, .3, .02, M('#f6f3ea'), 0, 0, 0), box(.2, .04, .03, dark, 0, .15, 0));
    if (kind === 'mason') tool.add(box(.25, .08, .12, M('#a5432f'), 0, 0, 0), box(.05, .02, .16, steel, .18, .02, .06));
    const paper = box(.32, .42, .02, M('#f6f3ea'), 0, 1.35, .36); paper.visible = false; body.add(paper);
    put(g, i, d, 0, turn); g.userData.keep = true; if (solid) hitW(g, { hx: .3, hz: .3, h: 1.8, kind: 'hard' }, wrap(i));
    const w = { g, body, legs, arms, tool, paper, kind, x: g.position.x, z: g.position.z, y, yaw0: g.rotation.y, ph: rnd() * 6, stun: 0, madT: 0, face: null, talks: 0, talkT: 0, paperT: 0, readT: 0 };
    w.mouth = () => g.position.clone().add(new THREE.Vector3(0, 1.9 + y, 0)); workers.push(w); return w; }
  function roadworks() { if (!works) return; const n0 = G.children.length; roadworks0(); for (const o of G.children.slice(n0)) WG.attach(o); G.add(WG); }
  function roadworks0() { const sd = works.sd, i0 = works.i0, i1 = works.i1, m = x => Math.round(x / ds), yel = M('#e8b923');
    // the lane shut: barriers along its edge (a lamp blinking on each) and across its ends; cones tapering in before it and out after it
    for (let x = 1; x < 26; x += 2.1) { const o = P.barrier(), lp = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), blinkM); lp.position.set(0, 1.12, 0); o.group.add(lp); put(o.group, i0 + m(x), sd * .45, 0, Math.PI / 2); hitW(o.group, o.hit, wrap(i0 + m(x))); }
    for (const j of [i0, i1]) for (const dd of [1.45, 2.95]) { const o = P.barrier(); put(o.group, j, sd * dd, 0, 0); hitW(o.group, o.hit, wrap(j)); }
    for (let k = 0; k < 5; k++) { const c = P.cone(); put(c.group, i0 - m(10 - k * 2.2), sd * (3.2 - k * .6), 0, 0); hitW(c.group, c.hit, wrap(i0)); }
    for (let k = 1; k < 4; k++) { const c = P.cone(); put(c.group, i1 + m(k * 2), sd * (.6 + k * .8), 0, 0); hitW(c.group, c.hit, wrap(i1)); }
    // the signs: roadworks ahead, for both ways
    for (const [j, s2] of [[i0 - m(16), sd], [i1 + m(14), -sd]]) { const g = new THREE.Group(), tri = new THREE.Mesh(new THREE.PlaneGeometry(.8, .73), new THREE.MeshBasicMaterial({ map: a14, side: THREE.DoubleSide, transparent: true, alphaTest: .5 })), pl = plate('ROBOTY', '#f6f3ea', '#17181b', .8, .22);
      tri.position.y = 2.35; pl.position.y = 1.85; g.add(box(.07, 2.6, .07, steel, 0, 1.3, 0), tri, pl); put(g, j, s2 * (ROAD + .7), 0, 0); hitW(g, { hx: .1, hz: .1, h: 2.6, kind: 'hard' }, wrap(j)); }
    // the trench, the dug earth in heaps, the pipes waiting, a drain open
    ribbon(line(i0 + m(3), i1 - m(7), sd * 2), 1.7, '#5a4330', .03); ribbon(line(i0 + m(3.4), i1 - m(7.4), sd * 2), 1.1, '#241a12', .036);
    for (const [x, dd] of [[7, 3.1], [15, 3.0]]) { const o = new THREE.Mesh(new THREE.ConeGeometry(1.1, .9, 7), M('#7a5a3c')); o.position.y = .45; const g = new THREE.Group(); g.add(o); put(g, i0 + m(x), sd * dd, 0, 0); hitW(g, { hx: .9, hz: .9, h: .9, kind: 'hard' }, wrap(i0 + m(x))); }
    { const g = new THREE.Group(), pm = M('#c9c4ba'); for (const [x, y] of [[-.27, .25], [.27, .25], [0, .7]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 3, 10).rotateX(Math.PI / 2), pm); c.position.set(x, y, 0); g.add(c); } put(g, i0 + m(19), sd * 3.0, 0, 0); hitW(g, { hx: .55, hz: 1.5, h: .95, kind: 'hard' }, wrap(i0 + m(19))); }
    { const g = new THREE.Group(), hole = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .04, 12), dark), lid = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .05, 12), steel); hole.position.y = .02; lid.position.set(.7, .03, .2); g.add(hole, lid); put(g, i0 + m(1.6), sd * 2.4, 0, 0); }
    // the little excavator at the trench's end: its boom working
    { const g = new THREE.Group(); g.add(box(1.5, .45, 2.3, dark, 0, .23, 0), box(1.4, .8, 1.6, yel, 0, .85, -.1), box(.85, .85, .9, M('#7fa6c2'), -.25, 1.65, -.3), box(.95, .08, 1, yel, -.25, 2.1, -.3));
      const boom = new THREE.Group(), stick = new THREE.Group(); boom.position.set(.35, 1.1, .6); boom.add(box(.22, .22, 2, yel, 0, 0, 1)); stick.position.set(0, 0, 2); stick.add(box(.18, .18, 1.4, yel, 0, 0, .7), box(.6, .4, .4, dark, 0, -.1, 1.45)); boom.add(stick); g.add(boom);
      put(g, i1 - m(3.5), sd * 2.0, 0, Math.PI); g.userData.keep = true; hitW(g, { hx: .8, hz: 1.2, h: 2.2, kind: 'hard' }, wrap(i1)); digs.push({ boom, stick }); }
    // the crew: one with the hammer, one down in the trench, one leaning on his shovel, the flagman before it all, the boss with his clipboard
    worker('jack', i0 + m(2.5), sd * 1.3, 0); worker('dig', i0 + m(10), sd * 2, 0, -.55); worker('lean', i0 + m(12.5), sd * 3.0, -sd * Math.PI / 2);
    worker('flag', i0 - m(5), sd * (ROAD + .4), Math.PI); worker('boss', i0 + m(21), sd * 3.2, -sd * Math.PI / 2);
    worksP = { s: wrap(i0 - m(10)) * ds, d: sd * 1.75, len: 40 }; parked?.()?.push(worksP); }   // (the traffic: round it all, in one go)
  let worksCool = 0;
  function stepWorks(dt, R, onShout) { if (!workers.length || !worksOn) return; blinkM.color.set(clock % 1 < .5 ? '#ffb347' : '#5a3a14'); worksCool = Math.max(0, worksCool - dt);
    for (const D of digs) { D.boom.rotation.x = .35 + Math.sin(clock * .5) * .25; D.stick.rotation.x = .7 + Math.sin(clock * .5 + 1.2) * .45; }
    for (const w of workers) { const t = clock + w.ph, b = w.body, A = w.arms, T = w.tool; w.stun = Math.max(0, w.stun - dt); w.madT = Math.max(0, w.madT - dt); w.readT = Math.max(0, w.readT - dt); w.paperT = Math.max(0, w.paperT - dt); w.talkT = Math.max(0, w.talkT - dt);
      // (facing whoever spoke to him, kicked him, threw to him; then back to the work)
      if (w.face && (w.face.t -= dt) > 0) w.g.rotation.y = Math.atan2(w.face.x - w.x, w.face.z - w.z); else { w.face = null; w.g.rotation.y = w.yaw0; }
      b.position.x = 0; b.rotation.set(0, 0, 0); w.paper.visible = w.readT > 0; T.visible = !(w.readT > 0);
      if (w.readT > 0) { A[0].rotation.set(-1.1, 0, .3); A[1].rotation.set(-1.1, 0, -.3); }
      else if (w.kind === 'dig') { const s = Math.sin(t * 2.2); A[0].rotation.set(-.9 + s * .4, 0, 0); A[1].rotation.set(-.9 + s * .4, 0, 0); T.position.set(0, .75 + s * .1, .42); T.rotation.set(-.6 + s * .5, 0, 0); b.rotation.x = .2 + s * .1; }
      else if (w.kind === 'lean') { A[0].rotation.set(-.3, 0, 0); A[1].rotation.set(-.55, 0, -.2); T.position.set(.18, .02, .38); T.rotation.set(-.12, 0, 0); b.rotation.set(.06, 0, Math.sin(t * .4) * .03); }
      else if (w.kind === 'jack') { A[0].rotation.set(-.6, 0, .25); A[1].rotation.set(-.6, 0, -.25); T.position.set(0, Math.abs(Math.sin(t * 40)) * .03, .32); b.position.x = Math.sin(t * 70) * .012; }
      else if (w.kind === 'flag') { A[1].rotation.set(-.5, 0, 0); T.position.set(.32, .72, .22); const hd = T.userData.head; hd.rotation.y += ((Math.floor(t / 7) % 2 ? Math.PI : 0) - hd.rotation.y) * Math.min(1, dt * 4); }
      else if (w.kind === 'mason') { const s = Math.sin(t * 1.6); A[0].rotation.set(-1.2 + s * .3, 0, 0); A[1].rotation.set(-1 - s * .3, 0, 0); T.position.set(0, 1.15, .42); T.rotation.set(0, s * .4, 0); b.rotation.x = .1 + s * .05; }
      else if (w.kind === 'boss') { A[0].rotation.set(-.9, 0, .2); A[1].rotation.set(-.7, 0, -.3); T.position.set(0, 1.12, .26); T.rotation.set(-.6, 0, 0); b.rotation.y = Math.sin(t * .3) * .5; }
      if (w.madT > 0) A[1].rotation.set(-2.7 + Math.sin(t * 11) * .3, 0, 0);
      if (w.stun > 0) b.position.x = Math.sin(t * 50) * .03;
      // (him riding by close and quick: one of them has a word for him; not every time)
      if (R && worksCool <= 0 && !(w.readT > 0) && R.v > 3 && Math.hypot(R.x - w.x, R.z - w.z) < 5) { worksCool = 9 + rnd() * 6; onShout(w); } } }
  let clock = 0;
  function update(dt, R) { clock += dt; let shout = null; stepBricks(dt, R); if (lampAt.length) { const on = flickOn(); headF.color.set(on ? '#ffd27a' : '#3a2e1c'); poolF.opacity = on ? .42 : .03; } stepWorks(dt, R, w => { shout = w; });
    for (const W0 of walkers) { W0.a += W0.w * dt / Math.max(1, W0.r); const x = W0.c.x + Math.cos(W0.a) * W0.r, z = W0.c.z + Math.sin(W0.a) * W0.r, dir = Math.sign(W0.w); W0.g.position.set(x, W0.c.y, z); W0.g.rotation.y = Math.atan2(-Math.sin(W0.a) * dir, Math.cos(W0.a) * dir); const st = Math.sin(clock * 7 + W0.ph) * .45; W0.legs[0].rotation.x = st; W0.legs[1].rotation.x = -st; }
    for (const Pl of planes) { Pl.t += dt; if (Pl.t < 0) continue; if (Pl.t > 34) { Pl.t = -20 - rnd() * 25; Pl.g.visible = false; continue; } if (!Pl.g.visible) { Pl.a = rnd() * 6.28; Pl.g.visible = true; }
      const u = Pl.t / 34, R = cen.r + 150 - u * 120, ang = Pl.a + u * .9, y = 18 + u * u * 160, vx = -Math.sin(ang), vz = Math.cos(ang); Pl.g.position.set(cen.x + Math.cos(ang) * R, y, cen.z + Math.sin(ang) * R); Pl.g.rotation.set(0, Math.atan2(vx, vz), 0); Pl.g.rotateX(-.2); } return shout; }
  // ---------- the night: lamps along the loop every 24 m, by turns on each side (not at a side street's or a shortcut's mouth), some
  // flickering; under each a pool of light on the ground (all the pools in one mesh, the flickering ones in another); their heads kept
  // for the game's few real lights ----------
  const lamps = [], lampAt = [], headM = new THREE.MeshBasicMaterial({ color: '#ffd27a' }), headF = new THREE.MeshBasicMaterial({ color: '#ffd27a' });
  const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), poolM = new THREE.MeshBasicMaterial({ color: '#ffb35a', map: glowT, transparent: true, opacity: .42, blending: THREE.AdditiveBlending, depthWrite: false }), poolF = poolM.clone();   // (a pool of light: soft to its edge)
  if (night) for (let i = Math.round(10 / ds), k = 0; i < N; i += Math.round(24 / ds), k++) { if (stubs.some(t => near(i, t.i, 9)) || shortcuts.some(c => near(i, c.a, 9) || near(i, c.b, 9)) || nearWorks(i, 8) || zebras.some(z => near(i, z.i, 5))) continue; lampAt.push({ i, s: k % 2 ? 1 : -1, flick: rnd() < .22 }); }
  const flickOn = () => { const f = (clock * 1.7) % 7; return !((f > 5.2 && f < 5.5) || (f > 5.9 && f < 6.05) || (f > 6.3 && f < 6.9)); };
  function nightLamps() { if (!lampAt.length) return; const pools = [[], []];
    for (const L of lampAt) { const sg = L.s, g = new THREE.Group(), hm = L.flick ? headF : headM; g.add(box(.14, 5.6, .14, steel, 0, 2.8, 0), box(1.6, .1, .1, steel, sg * .8, 5.55, 0), box(.5, .12, .3, dark, sg * 1.5, 5.5, 0), box(.4, .05, .22, hm, sg * 1.5, 5.43, 0));
      put(g, L.i, sg * (ROAD + .6), 0, 0); hit(g, { hx: .1, hz: .1, h: 5, kind: 'hard' }, wrap(L.i)); g.updateMatrixWorld(true);
      const p = g.localToWorld(new THREE.Vector3(sg * 1.5, 5.4, 0)), gy = groundAt(p.x, p.z, wrap(L.i)); lamps.push({ p, flick: L.flick, i: wrap(L.i) });
      pools[L.flick ? 1 : 0].push(new THREE.CircleGeometry(4.2, 14).rotateX(-Math.PI / 2).translate(p.x, gy + .06, p.z)); }
    pools.forEach((gs, k) => { if (!gs.length) return; const m = new THREE.Mesh(mergeGeometries(gs), k ? poolF : poolM); m.renderOrder = 2; m.userData.keep = true; m.userData.noShadow = true; m.frustumCulled = false; G.add(m); }); }
  // ---------- at night, in the plaza's place: a pavilion shop open all night (its windows lit, its sign), a kiosk lit beside it ----------
  function nightShop(sg, mid) { const m = x => Math.round(x / ds), litM = new THREE.MeshBasicMaterial({ color: '#fff0c4' }), fx = sg * 4;
    const g = house(mid, sg * (PAVE + 12), sg, 14, 8, 3.8, '#8a8f96'), hi = doors.length - 1;
    for (const z of [-4, 4]) g.add(box(.08, 2, 4.6, litM, fx + sg * .07, 1.45, z));
    const nm = plate('CAŁODOBOWY', '#17181b', '#ffd27a', 5, .8); nm.position.set(fx + sg * .12, 3.3, 0); nm.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(nm); g.updateMatrixWorld(true);
    const n = new THREE.Vector3(sg, 0, 0).transformDirection(g.matrixWorld).setY(0).normalize();
    for (const z of [-4, 4]) windows.push({ p: g.localToWorld(new THREE.Vector3(fx + sg * .1, 1.45, z)), n: n.clone(), hw: 2.3, hh: 1, broken: false, i: wrap(mid), house: hi });
    { const k = new THREE.Group(); k.add(box(2.2, 2.5, 2, M('#3b6e4a'), 0, 1.25, 0), box(2.4, .2, 2.2, M('#2a4a34'), 0, 2.6, 0), box(.06, .9, 1.4, litM, sg * 1.11, 1.5, 0)); const kp = plate('KIOSK', '#17181b', '#ffd27a', 1.6, .4); kp.position.set(sg * 1.14, 2.2, 0); kp.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2; k.add(kp);
      put(k, mid + m(11), sg * (PAVE + 4), 0, 0); hit(k, { hx: 1.1, hz: 1, h: 2.6, kind: 'hard' }, wrap(mid)); } }
  // ---------- scaffolding before a tenement's front over the pavement (by day): poles in two rows, boards at each floor, a green net, a
  // mason or two on the boards; and its bricks: one ridden under (on the pavement below), a shadow shows where it will land, then it
  // comes down there ----------
  const scaff = [], bricks = [], events = [], brickM = M('#a5432f'), shadowM = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .45, depthWrite: false });
  function scaffolding() { for (const S0 of scaffoldsOf?.() || []) { const n = S0.n, yaw = Math.atan2(n.x, n.z), g = new THREE.Group(), W2 = S0.W / 2 - .3, top = Math.min(S0.H - 1, 8.6), pole = M('#8a8f96'), board = M('#b08a52');
      g.position.copy(S0.front); g.rotation.y = yaw; G.add(g);
      const fl = []; for (let y = 2.6; y < top; y += 2.6) fl.push(y);
      for (let x = -W2; x <= W2 + .01; x += 2) for (const z of [.2, 1.4]) g.add(box(.06, top + .9, .06, pole, x, (top + .9) / 2, z));
      for (const y of fl) { g.add(box(W2 * 2 + .2, .06, 1.3, board, 0, y, .8), box(W2 * 2 + .2, .05, .05, pole, 0, y + 1, 1.42)); }
      for (let k = 0; k < Math.ceil(W2); k++) { const x = -W2 + k * 2 + 1; const d = box(.04, 2.6, .04, pole, x, 1.3, 1.42); d.rotation.z = .65; g.add(d); }
      const net = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, top - 2.4), new THREE.MeshBasicMaterial({ color: '#5a8a3a', transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })); net.position.set(0, 2.4 + (top - 2.4) / 2, 1.45); g.add(net);
      g.updateMatrixWorld(true);
      // (the outer poles: in the way on the pavement; the inner ones by the wall)
      for (let x = -W2; x <= W2 + .01; x += 2) for (const z of [.2, 1.4]) { const p = g.localToWorld(new THREE.Vector3(x, 0, z)), q = new THREE.Object3D(); q.position.copy(p); q.rotation.y = yaw; q.updateMatrixWorld(); hit(q, { hx: .06, hz: .06, h: 2.5, kind: 'hard' }, wrap(S0.i)); }
      // (the masons: on the boards, at work facing the wall)
      for (let k = 0; k < Math.min(2, fl.length); k++) { const p = g.localToWorld(new THREE.Vector3((k ? -1 : 1) * W2 * .45, 0, .8)), q = probe(p.x, p.z, S0.i), A = S[q.i], turn = Math.atan2(-n.x, -n.z) - Math.atan2(A.f.x, A.f.z);
        worker('mason', q.i, q.d, turn, fl[Math.min(k, fl.length - 1)] + .03, false); }
      scaff.push({ g, S0, W2, top: fl[fl.length - 1] || 2.6, cool: 3 }); } }
  // (a brick on its way: the shadow at the spot, the fall, the crack on the stones; under it, he is down)
  function stepBricks(dt, R) { for (const sc of scaff) { sc.cool -= dt; if (!R || sc.cool > 0 || R.foot) continue;
      const lp = sc.g.worldToLocal(new THREE.Vector3(R.x + Math.sin(R.yaw) * R.vs * .9, 0, R.z + Math.cos(R.yaw) * R.vs * 1.3));   // (where he will be in a moment, in the scaffold's own terms)
      if (Math.abs(lp.x) > sc.W2 + .5 || lp.z < -.2 || lp.z > 3) continue; const now = sc.g.worldToLocal(new THREE.Vector3(R.x, 0, R.z)); if (now.z > 3.2 || Math.abs(now.x) > sc.W2 + 6) continue;
      sc.cool = 5 + rnd() * 4; const x = Math.max(-sc.W2, Math.min(sc.W2, lp.x)), z = Math.max(.4, Math.min(2.6, lp.z)), land = sc.g.localToWorld(new THREE.Vector3(x, 0, z)), gy0 = groundAt(land.x, land.z, wrap(sc.S0.i));
      const sh = new THREE.Mesh(new THREE.CircleGeometry(.35, 10).rotateX(-Math.PI / 2), shadowM.clone()); sh.position.set(land.x, gy0 + .05, land.z); sh.scale.setScalar(.2); G.add(sh);
      const b = box(.25, .08, .12, brickM, 0, 0, 0); const from = sc.g.localToWorld(new THREE.Vector3(x, sc.top + .5, .9)); b.position.set(land.x, from.y, land.z); G.add(b);
      bricks.push({ b, sh, land, gy0, y: from.y, vy: 0, t: 0, warn: 1.3, fall: Math.sqrt(2 * Math.max(.5, from.y - gy0) / 22) }); events.push({ kind: 'brickWarn', at: from.clone() }); }
    for (let k = bricks.length - 1; k >= 0; k--) { const B0 = bricks[k]; B0.t += dt; const u = Math.min(1, B0.t / B0.warn); B0.sh.scale.setScalar(.2 + u * .9);
      if (B0.t < B0.warn - B0.fall) continue;   // (the shadow first; the brick drops so as to land as the shadow is full)
      B0.vy -= 22 * dt; B0.y += B0.vy * dt; B0.b.position.y = Math.max(B0.gy0 + .05, B0.y); B0.b.rotation.x += dt * 9;
      if (B0.y <= B0.gy0 + .05) { G.remove(B0.sh); B0.b.rotation.set(0, rnd() * 3, 0); setTimeout(() => G.remove(B0.b), 6000); bricks.splice(k, 1);
        const hitHim = R && !R.foot && (R.x - B0.land.x) ** 2 + (R.z - B0.land.z) ** 2 < .8; events.push({ kind: hitHim ? 'brick' : 'brickMiss', at: B0.land.clone() }); } } }
  function build() { for (const c of shortcuts) shortcut(c); scaffolding(); for (const t of stubs) stub(t); nightLamps(); office(); taxis(); roadworks(); for (const z of zebras) if (!z.lights) crossing(z); furniture(); }
  return { blocked, build, paved, update, shortcuts, stubs, plaza, taxi, zebras, works, get workers() { return worksOn ? workers : []; }, nearWorks, nearTaxi, setWorks, lamps, flickOn, picnics, spotsT, events };
}
