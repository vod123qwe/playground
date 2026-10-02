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

export function createCityNet({ THREE, toon, S, N, ds, INNER, ROAD, PAVE, at, groundAt, put, box, hit, zone, things, doors, windows, mailboxes, colliders, G, P, rnd, startI }) {
  const M = c => toon(c), wrap = i => ((i % N) + N) % N, O = 30;
  // ---------- where: two straight stretches for the shortcuts (none of them across a checkpoint: a quarter of the loop from the start),
  // four spots for the side streets on the outside ----------
  const turnOf = (i0, n) => { let t = 0; for (let k = 0; k < n; k++) { const a = S[wrap(i0 + k)].f, b = S[wrap(i0 + k + 1)].f; t += Math.abs(Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z)); } return t; };
  const quarterAt = q => wrap(startI + Math.round(N * q)), cps = [0, .25, .5, .75].map(quarterAt), near = (i, j, m) => { const d = Math.abs(wrap(i - j + N / 2) - N / 2) * ds; return d < m; };
  const LEN = Math.round(64 / ds), shortcuts = [];
  for (let i = 0; i < N && shortcuts.length < 2; i += Math.round(6 / ds)) { const j = i + LEN; if (turnOf(i - Math.round(8 / ds), LEN + Math.round(16 / ds)) > .35) continue; if (cps.some(c => { for (let k = -10; k <= LEN + 10; k += 4) if (wrap(i + k) === c || near(wrap(i + k), c, 6)) return true; return false; })) continue;
    if (shortcuts.some(s0 => Math.abs(wrap(i - s0.a + N / 2) - N / 2) * ds < 140)) continue; shortcuts.push({ a: wrap(i), b: wrap(j), kind: shortcuts.length ? 'park' : 'alley' }); }
  const stubs = []; for (const f of [.08, .31, .58, .83]) { let i = wrap(startI + Math.round(N * f)); if (shortcuts.some(s0 => near(i, s0.a, 20) || near(i, s0.b, 20))) i = wrap(i + Math.round(30 / ds)); stubs.push({ i, sd: -INNER }); }
  // (the ways kept clear of what the loop plants and puts about: trees, bins, benches)
  { const z0 = (i, d, hx, hz) => { const o = new THREE.Object3D(); o.position.copy(at(i, d, 0)); o.rotation.y = Math.atan2(S[wrap(i)].f.x, S[wrap(i)].f.z); o.updateMatrixWorld(); zone(o, hx, hz); };
    for (const c of shortcuts) { for (const i of [c.a, c.a + LEN]) z0(i, INNER * (O + ROAD) / 2, (O - ROAD) / 2 + 1, 3.5); z0(c.a + Math.round(LEN / 2), INNER * O, 12, LEN * ds / 2 + 2); }
    for (const t of stubs) z0(t.i, t.sd * 18, 17, 5.5); }
  // a lot (at i, on side s) left empty: where a shortcut's leg goes through, where a side street opens
  function blocked(i, s) { for (const c of shortcuts) if (s === INNER && (near(i, c.a, 9) || near(i, c.b, 9))) return true; for (const t of stubs) if (s === t.sd && near(i, t.i, 9)) return true; return false; }
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
  const FONT = { A: '010101111101101', E: '111100110100111', K: '101110100110101', R: '110101110110101', T: '111010010010010', Z: '111001010100111', Ó: '010010101101010', U: '101101101101111', Ł: '100110100100111', P: '110101110100100', Y: '101101010010010', W: '101101111111101', J: '001001001101010', D: '110101101101110', ' ': '000000000000000', '>': '100010001010100', '<': '001010100010001' };
  const words = (text, bg, fg) => cv(text.length * 4 + 3, 9, g => { g.fillStyle = bg; g.fillRect(0, 0, 999, 9); g.fillStyle = fg; [...text].forEach((ch, k) => { const r = FONT[ch] || FONT[' ']; for (let q = 0; q < 15; q++) if (r[q] === '1') g.fillRect(2 + k * 4 + q % 3, 2 + (q / 3 | 0), 1, 1); }); });
  const plate = (text, bg, fg, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: words(text, bg, fg), side: THREE.DoubleSide }));
  const lampM = new THREE.MeshBasicMaterial({ color: '#ffd98a' }), steel = M('#5a5f66'), dark = M('#2a2c30');
  function lamp(i, d) { const g = new THREE.Group(); g.add(box(.12, 4.2, .12, steel, 0, 2.1, 0), box(.5, .14, .3, dark, 0, 4.25, 0)); const l = new THREE.Mesh(new THREE.BoxGeometry(.36, .06, .2), lampM); l.position.set(0, 4.16, 0); g.add(l); put(g, i, d, 0, 0); hit(g, { hx: .1, hz: .1, h: 4, kind: 'hard' }, wrap(i)); }
  // a house set by a way, facing it (turn: its front's way), its door and letterbox and lower windows for the game; s: which side of the
  // way it stands on (its front then towards -s along the road's right)
  function house(i, d, s, w, dd, h, col, door = true) { const g = new THREE.Group(), fx = s * dd / 2;   // (its front: towards the way, the loop's side of it)
    g.add(box(dd, h, w, M(col), 0, h / 2, 0), box(dd + .2, .25, w + .2, M('#4a4e55'), 0, h + .12, 0));
    const wins = []; for (let f = 0; f < Math.floor((h - .8) / 2.8); f++) for (const z of [-w / 3, 0, w / 3]) { if (f === 0 && Math.abs(z) < .1 && door) continue; const y = 1.6 + f * 2.8; g.add(box(.06, 1.3, .9, M('#f0ece2'), fx + s * .02, y, z), box(.08, 1.1, .7, M(rnd() < .15 ? '#c9b77a' : '#3f5566'), fx + s * .04, y, z)); if (f < 2) wins.push({ y, z }); }
    let mb = null; if (door) { g.add(box(.08, 2.2, 1.1, M('#5a3a24'), fx + s * .04, 1.1, 0)); mb = new THREE.Group(); mb.add(box(.12, .32, .4, M('#8a3a2e'), 0, 0, 0)); const flag = new THREE.Group(); flag.add(box(.02, .1, .02, M('#efc970'), 0, .05, 0)); flag.position.set(s * .07, .17, .15); mb.add(flag); mb.userData.flag = flag; mb.position.set(fx + s * .07, 1.2, .9); g.add(mb); }
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
    for (let i = A + Math.round(4 / ds); i < Bn; i += Math.round(17 / ds)) lamp(i, sg * (O - 2.6)); }
  function park(c, sg, A, Bn) { const W2 = 9, green = '#6f8f3e';
    ribbon(line(A + Math.round(4 / ds), Bn - Math.round(4 / ds), sg * O), W2 * 2, green, .015);
    // a low fence round the lawn, benches by the path, trees
    for (const side of [-1, 1]) for (let i = A + Math.round(6 / ds); i < Bn - Math.round(6 / ds); i += Math.round(2.5 / ds)) { const g = new THREE.Group(); g.add(box(.05, .6, .05, dark, 0, .3, 0), box(.04, .04, 2.5, dark, 0, .55, 0)); put(g, i, sg * (O + side * W2), 0, 0); }
    for (let i = A + Math.round(10 / ds); i < Bn - Math.round(10 / ds); i += Math.round(12 / ds)) { const g = new THREE.Group(); g.add(box(.5, .08, 1.7, M('#9e7a4f'), 0, .45, 0), box(.08, .5, 1.7, M('#9e7a4f'), .22, .75, 0)); for (const z of [-.7, .7]) g.add(box(.45, .45, .08, dark, 0, .22, z)); put(g, i, sg * (O + 2.4), 0, Math.PI); hit(g, { hx: .3, hz: .9, h: .6, kind: 'hard' }, wrap(i)); }
    for (let k = 0; k < 9; k++) { const i = A + Math.round((6 + rnd() * 52) / ds), side = rnd() < .5 ? -1 : 1, d = sg * (O + side * (4.5 + rnd() * 3.5)), g = new THREE.Group(), h = 2.4 + rnd() * 1.6; g.add(box(.22, h, .22, M('#5a4030'), 0, h / 2, 0)); const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + rnd() * .6, 1), M(['#467537', '#5b8a3c', '#3f6b35'][rnd() * 3 | 0])); cr.position.y = h + .9; g.add(cr); put(g, i, d, 0, rnd() * 6); hit(g, { hx: .2, hz: .2, h, kind: 'hard' }, wrap(i)); }
    // the playground: its fence, swings, a slide, a sandbox, a seesaw, a climbing frame
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

  // ---------- a side street: in from the main street on the outside, closed a little way in ----------
  function stub(t) { const sg = t.sd, i = t.i, L0 = across(i, sg * (ROAD - .1), sg * 30); ribbon(L0, 6.4, '#3f4246', .03); ribbon(L0, 10.4, '#b3ad9d', .02); for (let k = 1; k < L0.length; k++) seg(L0[k - 1], L0[k], 3.4);
    // the crossing on the main street, white bars across it; the lights at the corners
    for (let k = -3; k <= 3; k++) { const o = new THREE.Mesh(new THREE.PlaneGeometry(.5, ROAD * 1.9).rotateX(-Math.PI / 2), M('#f0ece2')); o.userData.noShadow = true; o.renderOrder = 1; put(o, i + Math.round((k * .9 - 5.5) / ds), 0, .016, 0); }
    for (const sd2 of [-1, 1]) { const g = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: '#ff4a30' }), grn = new THREE.MeshBasicMaterial({ color: '#2e4a2e' }); g.add(box(.12, 3.2, .12, steel, 0, 1.6, 0), box(.32, .8, .25, dark, 0, 3.2, 0)); const r = box(.2, .2, .05, red, 0, 3.42, .13), gg = box(.2, .2, .05, grn, 0, 3.0, .13); g.add(r, gg);
      put(g, i + sd2 * Math.round(4.6 / ds), sg * (ROAD + .6), 0, sg > 0 ? -Math.PI / 2 : Math.PI / 2); hit(g, { hx: .1, hz: .1, h: 3, kind: 'hard' }, wrap(i)); }
    // the barrier and the sign, cones before it, a car parked by the kerb; a wall closing the view
    { const o = P.barrier(), d = sg * 20; put(o.group, i, d, 0, Math.PI / 2); hit(o.group, o.hit, wrap(i)); for (const k of [-1, 1]) { const c = P.cone(); put(c.group, i + k * Math.round(1.6 / ds), sg * 18.5, 0, 0); hit(c.group, c.hit, wrap(i)); } }
    { const g = new THREE.Group(), disc = new THREE.Mesh(new THREE.CircleGeometry(.4, 16), new THREE.MeshBasicMaterial({ color: '#c23a2e', side: THREE.DoubleSide })), bar = new THREE.Mesh(new THREE.PlaneGeometry(.55, .12), new THREE.MeshBasicMaterial({ color: '#f6f3ea', side: THREE.DoubleSide })); bar.position.z = .01; disc.add(bar); disc.position.y = 2.3; disc.rotation.y = Math.PI / 2; g.add(box(.07, 2.3, .07, steel, 0, 1.15, 0), disc); put(g, i + Math.round(2.6 / ds), sg * 20.3, 0, 0); }
    { const g = new THREE.Group(); g.add(box(.6, 9, 14, M(['#c9b8a0', '#d8c0a8', '#a9bccb'][rnd() * 3 | 0]), 0, 4.5, 0)); for (let f = 0; f < 3; f++) for (const z of [-4.5, -1.5, 1.5, 4.5]) g.add(box(.08, 1.2, .9, M('#3f5566'), sg * .33, 2 + f * 2.6, z)); put(g, i, sg * 33, 0, 0); hit(g, { hx: .3, hz: 7, h: 9, kind: 'hard' }, wrap(i)); } }

  // ---------- the street's furniture on the paved verge by the kerb: advertising columns, kiosks, phone booths, benches, bike racks,
  // planters, bollards (not at a shortcut's mouth, nor a side street's) ----------
  function furniture() { const poster = () => cv(8, 16, g => { const C = ['#cf5a3e', '#efc970', '#3b5670', '#9fd27a', '#f6f3ea', '#e3742e', '#b7a4e0']; for (let y = 0; y < 16; y += 4) { g.fillStyle = C[rnd() * C.length | 0]; g.fillRect(0, y, 8, 4); g.fillStyle = '#17181b'; g.fillRect(1 + (rnd() * 3 | 0), y + 1, 3 + (rnd() * 3 | 0), 1); } });
    for (let i = 20; i < N - 10; i += Math.round((14 + rnd() * 12) / ds)) { const s = rnd() < .5 ? -1 : 1, d = s * (ROAD + 1.15); if (shortcuts.some(c => near(i, c.a, 12) || near(i, c.a + LEN, 12)) || stubs.some(t => near(i, t.i, 14))) continue; const k = rnd(), g = new THREE.Group(); let hb = null;
      if (k < .18) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 2.6, 12), [new THREE.MeshBasicMaterial({ map: poster() }), M('#2f4a6e'), M('#2f4a6e')]); c.position.y = 1.4; g.add(c, box(1.15, .14, 1.15, M('#2f4a6e'), 0, 2.78, 0)); const top = new THREE.Mesh(new THREE.ConeGeometry(.62, .35, 12), M('#2f4a6e')); top.position.y = 3.02; g.add(top); hb = { hx: .5, hz: .5, h: 2.8, kind: 'hard' }; }   // (an advertising column)
      else if (k < .3) { g.add(box(1.4, 2.2, 1.8, M('#e3b22e'), 0, 1.1, 0), box(.06, .9, 1.4, M('#3f5566'), s * -.72, 1.4, 0), box(1.6, .15, 2, M('#b3372c'), 0, 2.27, 0)); const t = plate('RUCH', '#b3372c', '#f6f3ea', 1, .3); t.position.set(s * -.82, 2.05, 0); t.rotation.y = Math.PI / 2; g.add(t); hb = { hx: .75, hz: .95, h: 2.3, kind: 'hard' }; }   // (a kiosk)
      else if (k < .4) { g.add(box(1, 2.3, 1, M('#b3372c'), 0, 1.15, 0)); for (const z of [-.51, .51]) g.add(box(.8, 1.4, .02, M('#9fb3bf'), 0, 1.3, z)); g.add(box(.02, 1.4, .8, M('#9fb3bf'), s * -.51, 1.3, 0)); hb = { hx: .5, hz: .5, h: 2.3, kind: 'hard' }; }   // (a phone booth)
      else if (k < .6) { g.add(box(.5, .08, 1.7, M('#9e7a4f'), 0, .45, 0), box(.08, .45, 1.7, M('#9e7a4f'), s * .22, .72, 0)); for (const z of [-.7, .7]) g.add(box(.45, .45, .08, dark, 0, .22, z)); hb = { hx: .3, hz: .9, h: .6, kind: 'hard' }; }   // (a bench)
      else if (k < .72) { for (let n = 0; n < 4; n++) { const a = new THREE.Mesh(new THREE.TorusGeometry(.35, .03, 4, 10, Math.PI), steel); a.position.set(0, 0, (n - 1.5) * .5); a.rotation.y = Math.PI / 2; g.add(a); } hb = { hx: .2, hz: 1, h: .4, kind: 'hard' }; }   // (a bike rack)
      else if (k < .88) { g.add(box(.9, .5, .9, M('#8a857a'), 0, .25, 0)); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 1), M('#467537')); b.position.y = .8; g.add(b); hb = { hx: .45, hz: .45, h: .9, kind: 'hard' }; }   // (a planter)
      else { for (const z of [-.8, 0, .8]) g.add(box(.14, .8, .14, dark, 0, .4, z)); }   // (bollards)
      put(g, i, d, 0, 0); if (hb) hit(g, hb, wrap(i)); } }
  function build() { for (const c of shortcuts) shortcut(c); for (const t of stubs) stub(t); furniture(); }
  return { blocked, build, paved, shortcuts, stubs };
}
