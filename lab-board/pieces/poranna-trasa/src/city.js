// "Miasto": the town. What the region has in place of houses with gardens: tenements in rows right at the pavement (three floors over a
// tall ground floor, windows in frames, a cornice, chimneys, now and then balconies; on the ground floor a shop with its sign, or a gate;
// the stairwell's door with its number and a letterbox on the wall by it), blocks of flats of big panels set back behind a lawn (five
// floors, the panels' joints, balconies in bands, three stairwells, each with its letterbox), the market's stalls (striped awnings, crates
// of fruit), a skyline round it all (towers, a church's spire, a TV mast) and tram rails in the road.
// Every building gives the game what a house does: doors (its stairwells: a paper to the step), windows (the lower ones: a paper breaks
// them), letterboxes (in one: the most). A lot's front faces the road: local +x on the right side of it (s = +1), local -x on the left.
// createCity({ THREE, toon, put, box, hit, zone, things, doors, windows, mailboxes, colliders, PAVE, S, N, ds, rnd, G }) → { tenement(i, s), block(i, s), stalls(i, s), skyline(cx, cz), rails() }

export function createCity({ THREE, toon, put, box, hit, zone, things, doors, windows, mailboxes, colliders, PAVE, S, N, ds, rnd, G }) {
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  // a 3 x 5 pixel font for the signs (the game's own font may not be loaded yet when the world is built)
  const F = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101110100110101', L: '100100100100111', M: '101111111101101',
    N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110110101', S: '011100010001110', T: '111010010010010', U: '101101101101111', W: '101101111111101', Y: '101101010010010', Z: '111001010100111', Ł: '100110100100111', Ó: '010010101101010', Ż: '010111001010111', ' ': '000000000000000', '.': '000000000000010',
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
  const sign = (text, bg, fg) => cv(text.length * 4 + 3, 9, g => { g.fillStyle = bg; g.fillRect(0, 0, text.length * 4 + 3, 9); g.fillStyle = fg; [...text].forEach((ch, k) => { const r = F[ch] || F[' ']; for (let q = 0; q < 15; q++) if (r[q] === '1') g.fillRect(2 + k * 4 + q % 3, 2 + (q / 3 | 0), 1, 1); }); });
  const M = c => toon(c), glass = M('#3f5566'), glassLit = M('#c9b77a'), frame = M('#f0ece2'), dark = M('#2a2c30'), roofM = M('#4a4e55'), stone = M('#8a857a');
  const SHOPS = [['PIEKARNIA', '#8e5a2e'], ['APTEKA', '#3f6b35'], ['KIOSK RUCH', '#b3372c'], ['KWIACIARNIA', '#467537'], ['FRYZJER', '#2f4a6e'], ['BAR MLECZNY', '#8e2e25'], ['ZEGARMISTRZ', '#44484c'], ['SPOŻYWCZY', '#3b5670'], ['OBUWIE', '#6b4a2e']];
  const WALLS = ['#d8c0a8', '#e3c77e', '#c9b8a0', '#b7c29a', '#d8b8a0', '#a9bccb', '#cfc4b4', '#e8dcc0', '#c98a6a'];
  // a window on a facade: glass in a white frame, a sill under it; registered when low enough to break (fx: the facade's x, sg: its side)
  function win(g, fx, sg, y, z, w = 1.1, h = 1.4, lit = false, reg = null) { const o = sg * .03;
    g.add(box(.06, h + .16, w + .16, frame, fx + o, y, z), box(.08, h, w, lit ? glassLit : glass, fx + o * 1.5, y, z), box(.18, .08, w + .3, stone, fx + sg * .09, y - h / 2 - .1, z));
    if (reg) reg.push({ y, z, w, h }); }
  // the letterbox on the wall by a stairwell's door: a little steel box with its flap (the flag the game turns when a paper is in)
  function letterbox(g, fx, sg, z) { const mb = townBox(sg); mb.position.set(fx + sg * .1, 1.25, z); g.add(mb); return { mb, flag: mb.userData.flag }; }
  // (the town's letterbox: big and red in a white frame, so it reads on brick and on plaster alike; a white envelope on it, a yellow flag)
  function townBox(sg) { const mb = new THREE.Group(); mb.add(box(.04, .82, .78, M('#f0ece2'), -sg * .1, 0, 0), box(.18, .64, .58, M('#d23a2c'), 0, 0, 0), box(.24, .06, .64, M('#8e2219'), 0, .34, 0), box(.19, .04, .38, dark, 0, .2, 0));
    mb.add(box(.02, .16, .26, M('#f6f3ea'), sg * .095, -.1, 0), box(.022, .03, .2, M('#c9c4ba'), sg * .1, -.06, 0));
    const flag = new THREE.Group(); flag.add(box(.03, .22, .03, M('#efc930'), 0, .11, 0), box(.03, .08, .1, M('#efc930'), 0, .2, -.05)); flag.position.set(sg * .1, .18, .26); mb.add(flag); mb.userData.flag = flag; return mb; }
  // after the building is placed: its doors, windows and letterboxes into the game's lists
  function register(g, i, s, stairs, wins) { g.updateMatrixWorld(true); const n = new THREE.Vector3(1, 0, 0).transformDirection(g.matrixWorld).multiplyScalar(s).setY(0).normalize();
    for (const st of stairs) { const fp = g.localToWorld(new THREE.Vector3(st.fx, 0, st.z)), hi = doors.length; doors.push({ p: fp.clone().addScaledVector(n, 2.6), n: n.clone(), done: false, i });
      for (const w of wins.filter(q => Math.abs(q.z - st.z) < 4.5)) windows.push({ p: g.localToWorld(new THREE.Vector3(st.fx + s * .1, w.y, w.z)), n: n.clone(), hw: w.w / 2, hh: w.h / 2, broken: false, i, house: hi });
      if (st.box) { st.box.mb.userData.keep = true; G.attach(st.box.mb);   // (out of the building into the world's group: its position is then the world's, as a street letterbox's is)
        const M0 = { o: st.box.mb, i, side: s, flag: st.box.flag, house: hi, wall: true }; mailboxes.push(M0); const wp = st.box.mb.getWorldPosition(new THREE.Vector3()); hit(st.box.mb, { hx: .12, hz: .25, h: 1.5, kind: 'hard' }, i); things.push({ kind: 'mailbox', o: st.box.mb, mb: M0, C: colliders[colliders.length - 1], side: s, wall: true, at: wp }); } } }

  // ---------- a tenement: right at the pavement ----------
  function tenement(i, s) { const g = new THREE.Group(), D = 10, W = 11 + (rnd() * 3 | 0), fl = 3 + (rnd() < .3 ? 1 : 0), H = 4 + fl * 3.1, fx = s * D / 2, wall = M(WALLS[rnd() * WALLS.length | 0]);
    g.add(box(D, H, W, wall, 0, H / 2, 0)); g.add(box(D + .3, .35, W + .02, M('#efe8dc'), 0, H - .2, 0), box(D + .2, .25, W + .02, M('#efe8dc'), 0, 3.9, 0));   // (the cornice, the band over the ground floor)
    g.add(box(D - .4, .5, W - .4, roofM, 0, H + .25, 0)); for (let k = 0; k < 2 + (rnd() * 2 | 0); k++) g.add(box(.6, 1.4, .6, M('#8e3b2c'), (rnd() - .5) * (D - 2), H + 1, (rnd() - .5) * (W - 2)));   // (the roof, its chimneys)
    const cols = Math.max(3, Math.floor(W / 2.6)), reg = [];
    for (let f = 0; f < fl; f++) for (let c = 0; c < cols; c++) { const z = -W / 2 + (c + .5) * W / cols, y = 5.6 + f * 3.1; win(g, fx, s, y, z, 1.1, 1.5, rnd() < .12, f === 0 ? reg : null);
      if (f < fl - 1 && rnd() < .3) { g.add(box(.9, .12, 1.6, stone, fx + s * .45, y - 1.05, z)); for (const dz of [-.75, .75]) g.add(box(.04, .7, .04, dark, fx + s * .85, y - .65, z + dz)); g.add(box(.04, .04, 1.55, dark, fx + s * .85, y - .3, z)); } }   // (a balcony now and then)
    // the ground floor: a shop (its window, its door, its sign) or a gate; and the stairwell's door with its number and letterbox
    const stairZ = (rnd() < .5 ? -1 : 1) * (W / 2 - 1.8), stairs = [];
    g.add(box(.08, 2.4, 1.3, M('#5a3a24'), fx + s * .05, 1.2, stairZ), box(.1, .3, 1.5, M('#efe8dc'), fx + s * .06, 2.55, stairZ));
    const no = new THREE.Mesh(new THREE.PlaneGeometry(.35, .25), new THREE.MeshBasicMaterial({ map: sign(String(1 + (rnd() * 40 | 0)), '#2f4a6e', '#f6f3ea') })); no.position.set(fx + s * .07, 2.9, stairZ); no.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(no);
    stairs.push({ fx, z: stairZ, box: letterbox(g, fx, s, stairZ + (stairZ > 0 ? -1.1 : 1.1)) });
    const shopZ = -stairZ * .45;
    if (rnd() < .78) { const [name, col] = SHOPS[rnd() * SHOPS.length | 0]; g.add(box(.1, 2.3, W * .45, glass, fx + s * .04, 1.65, shopZ), box(.12, .1, W * .45 + .2, frame, fx + s * .06, 2.85, shopZ), box(.12, .5, W * .45 + .2, M(col), fx + s * .06, .25, shopZ));
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W * .45, name.length * .42 + .4), .62), new THREE.MeshBasicMaterial({ map: sign(name, col, '#f6f3ea') })); sg.position.set(fx + s * .09, 3.3, shopZ); sg.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sg);
      if (rnd() < .6) { const bl = new THREE.Group(), bs = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .5), new THREE.MeshBasicMaterial({ map: sign(name.split(' ')[0], col, '#f6f3ea'), side: THREE.DoubleSide })); bl.add(box(.06, .06, .9, dark, 0, .3, 0), bs); bs.position.set(0, 0, 0); bl.position.set(fx + s * .75, 4.6, shopZ + (shopZ > 0 ? 1 : -1) * W * .2); bl.rotation.y = 0; g.add(bl); bs.rotation.y = 0; }   // (a blade sign out over the pavement, read along the street)
      if (rnd() < .55) { const aw = cv(8, 4, x => { for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#f6f3ea' : col; x.fillRect(k, 0, 1, 4); } }), awn = new THREE.Mesh(new THREE.BoxGeometry(1.1, .06, W * .45), [M('#f6f3ea'), M('#f6f3ea'), new THREE.MeshBasicMaterial({ map: aw }), M(col), M(col), M(col)]); awn.position.set(fx + s * .6, 3.0, shopZ); awn.rotation.z = -s * .35; g.add(awn); } }
    else { g.add(box(.1, 3, 2.6, dark, fx + s * .03, 1.5, shopZ), box(.14, .4, 3, M('#efe8dc'), fx + s * .06, 3.1, shopZ)); }   // (a gate to the yard)
    put(g, i, s * (PAVE + .4 + D / 2), 0, 0); hit(g, { hx: D / 2, hz: W / 2, h: H, kind: 'hard' }, i); zone(g, D / 2 + 1, W / 2 + .5);
    register(g, i, s, stairs, reg); return g; }

  // ---------- a block of flats of big panels: five floors, set back behind a lawn, three stairwells ----------
  const panelT = cv(16, 16, x => { x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#b8b2a4'; x.fillRect(0, 15, 16, 1); x.fillRect(15, 0, 1, 16); x.fillStyle = '#cfc9bc'; x.fillRect(2, 2, 3, 2); x.fillRect(9, 7, 2, 2); });
  function block(i, s) { const g = new THREE.Group(), D = 11, W = 34, fl = 5, H = fl * 2.8 + .6, fx = s * D / 2, t = panelT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 3.6, H / 2.8); t.needsUpdate = true;
    const wallM = M('#ffffff'); wallM.map = t; g.add(box(D, H, W, wallM, 0, H / 2, 0), box(D + .2, .4, W + .2, roofM, 0, H + .2, 0));
    const band = [M('#cf8a5e'), M('#7fa6b3'), M('#9fb36a')][rnd() * 3 | 0], reg = [];
    for (let f = 0; f < fl; f++) for (let c = 0; c < 10; c++) { const z = -W / 2 + (c + .5) * W / 10, y = 1.6 + f * 2.8; if (f === 0 && c % 3 === 1) continue; win(g, fx, s, y, z, 1.4, 1.3, rnd() < .1, f <= 1 ? reg : null); }
    for (let f = 1; f < fl; f++) g.add(box(1.1, .9, W * .9, band, fx + s * .55, .6 + f * 2.8, 0));   // (the balconies' bands)
    const stairs = []; for (const z of [-W / 3, 0, W / 3]) { g.add(box(.1, 2.3, 1.4, M('#5a5f66'), fx + s * .05, 1.15, z), box(1.4, .15, 2, M('#9aa0a4'), fx + s * .7, 2.5, z)); stairs.push({ fx, z, box: letterbox(g, fx, s, z + 1.2) }); }
    put(g, i, s * (PAVE + 7 + D / 2), 0, 0); hit(g, { hx: D / 2, hz: W / 2, h: H, kind: 'hard' }, i); zone(g, D / 2 + 7, W / 2 + 1);
    register(g, i, s, stairs, reg); return g; }

  // ---------- the market: a row of stalls under striped awnings, crates of fruit and veg before them ----------
  function stalls(i, s) { const g = new THREE.Group(), cols = ['#b3372c', '#2f4a6e', '#467537', '#e3742e'], fruit = ['#cf5a3e', '#efc970', '#7fae58', '#e3742e', '#8e2e25'];
    for (let k = 0; k < 3; k++) { const z = (k - 1) * 3.4, col = cols[(i + k) % 4], aw = cv(8, 4, x => { for (let q = 0; q < 8; q++) { x.fillStyle = q % 2 ? '#f6f3ea' : col; x.fillRect(q, 0, 1, 4); } });
      g.add(box(1.4, .9, 2.8, M('#9e7a4f'), 0, .45, z)); for (const dz of [-1.3, 1.3]) for (const dx of [-.6, .6]) g.add(box(.08, 2.4, .08, dark, dx, 1.2, z + dz));
      const awn = new THREE.Mesh(new THREE.BoxGeometry(2, .08, 3), [M(col), M(col), new THREE.MeshBasicMaterial({ map: aw }), M(col), M(col), M(col)]); awn.position.set(0, 2.45, z); awn.rotation.z = s * .12; g.add(awn);
      for (let q = 0; q < 3; q++) { const cz = z + (q - 1) * .85; g.add(box(.55, .28, .7, M('#c9a96a'), s * .2, 1.04, cz), box(.5, .12, .62, M(fruit[(i + k + q) % 5]), s * .2, 1.2, cz)); } }
    put(g, i, s * (PAVE + 2.2), 0, 0); hit(g, { hx: .8, hz: 4.8, h: 1.2, kind: 'hard' }, i); zone(g, 1.6, 5.4); return g; }

  // ---------- the skyline: towers of flats, a church's spire, a TV mast, far out round the loop ----------
  function skyline(cx, cz) { const tw = M('#9aa3ad'), tw2 = M('#b3b8bd'), sp = M('#4a5a62');
    for (let k = 0; k < 70; k++) { const a = k / 70 * 6.283 + rnd() * .08, R = (k % 2 ? 175 : 235) + rnd() * 55, h = 18 + rnd() * (k % 2 ? 26 : 40), w = 12 + rnd() * 16, o = box(w, h, 12 + rnd() * 8, rnd() < .5 ? tw : tw2, cx + Math.cos(a) * R, h / 2 - 2, cz + Math.sin(a) * R); o.rotation.y = a; G.add(o); }
    { const a = rnd() * 6.283, R = 210, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R; G.add(box(9, 30, 9, M('#c9b8a0'), x, 15, z)); const c = new THREE.Mesh(new THREE.ConeGeometry(5, 18, 4), sp); c.position.set(x, 39, z); c.rotation.y = Math.PI / 4; G.add(c); }
    { const a = rnd() * 6.283, R = 300, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R; G.add(box(2.4, 90, 2.4, M('#cf5a3e'), x, 45, z), box(5, 4, 5, M('#f6f3ea'), x, 70, z)); } }

  // ---------- the tram's rails: two pairs, one in each lane, a steel strip and its groove ----------
  function rails() { const pos = [], idx = []; let n = 0; const strip = (d0, d1, y) => { for (let i = 0; i < N; i++) { const a = S[i], b = S[(i + 1) % N]; for (const [s0, d] of [[a, d0], [a, d1], [b, d0], [b, d1]]) pos.push(s0.p.x + s0.r.x * d, s0.p.y + y, s0.p.z + s0.r.z * d); idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; } };
    for (const c of [-1.75, 1.75]) for (const o of [-.72, .72]) strip(c + o - .035, c + o + .035, .016);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#5a5f66' })); m.userData.noShadow = true; m.renderOrder = 1; G.add(m); }

  return { townBox, tenement, block, stalls, skyline, rails };
}
