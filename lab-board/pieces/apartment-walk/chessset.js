// A chess set, modelled here (in centimetres): a folding walnut case with the board on its outside, and 32 pieces in the Staunton
// manner, boxwood and ebony. The board: 4.5 cm squares (36 across) in a 2 cm walnut border with the files and ranks written on it,
// 40 x 40, on the outsides of two halves 2.8 thick, hinged across the middle; folded it is a box 40 x 20 x 5.6 with half the board on
// top. Inside, green felt, and the pieces lying in it. To play, as with a real one: the lid swings open, the pieces come out and stand
// by it, the open case turns over, the board up; to pack it, the other way round. Its origin: the board's centre on the table, the
// files along +x (a at -x), white's side at +z. The pieces: turned (lathe) bodies; the knight a carved head on a turned base; the
// rook's battlements, the bishop's cut, the queen's crown and the king's cross added on. Out of the case, before they are set up, the
// pieces stand in two rows by the board, white's on white's right, black's on black's right.
// It moves its pieces itself (lifted, carried in an arc, set down) and opens and packs itself; step(dt) says whether anything moved.

const SQ = 4.5, HALF = 20, T = 2.8, KIN = { p: 'Pion', n: 'Skoczek', b: 'Goniec', r: 'Wieża', q: 'Hetman', k: 'Król' };
export { SQ, KIN };

export function createChessSet({ THREE, clip = {} }) {
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });
  const phys = o => new THREE.MeshPhysicalMaterial({ ...o, ...clip });
  const G = new THREE.Group(); G.name = 'chess';
  // ---------- the board: the squares, the border, the letters (drawn) ----------
  const tex = (() => { const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), k = N / 40;
    const wood = (x, y, w, h, base, grain) => { g.fillStyle = base; g.fillRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = grain; g.lineWidth = 1;
      for (let i = 0; i < w / 2.2; i++) { const xx = x + i * 2.2 + Math.sin(i * 1.7) * .8; g.globalAlpha = .18 + (i % 3) * .06; g.beginPath(); g.moveTo(xx, y); g.bezierCurveTo(xx + 2, y + h * .3, xx - 2, y + h * .7, xx + 1, y + h); g.stroke(); } g.restore(); g.globalAlpha = 1; };
    wood(0, 0, N, N, '#5d3b27', '#2e1a10');                                   // the border
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { const light = (f + r) % 2 === 1; wood((2 + f * SQ) * k, (2 + (7 - r) * SQ) * k, SQ * k, SQ * k, light ? '#e6cc9a' : '#7a4f33', light ? '#b89868' : '#4a2c1a'); }
    g.strokeStyle = 'rgba(20,10,5,.6)'; g.lineWidth = 3; g.strokeRect(2 * k, 2 * k, 36 * k, 36 * k);
    g.fillStyle = '#e8d2a8'; g.font = `600 ${k * 1.1 | 0}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) { const x = (2 + (i + .5) * SQ) * k; g.fillText('abcdefgh'[i], x, 39 * k); g.save(); g.translate(x, k); g.rotate(Math.PI); g.fillText('abcdefgh'[i], 0, 0); g.restore();
      const y = (2 + (7 - i + .5) * SQ) * k; g.fillText(String(i + 1), k, y); g.save(); g.translate(39 * k, y); g.rotate(Math.PI); g.fillText(String(i + 1), 0, 0); g.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const walnut = std({ name: 'chessBox', color: '#6a4430', roughness: .45 }), top = std({ name: 'chessBoard', map: tex, roughness: .32 });
  const brass = std({ name: 'chessBrass', color: '#c9a063', roughness: .3, metalness: 1 }), felt = std({ name: 'chessFelt', color: '#2f4a3a', roughness: .95 });
  const halfTop = v0 => { const g = new THREE.PlaneGeometry(40, HALF); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * .5); return g; };
  // the case: 'flip' turns it over (about the hinge's line, at half its height); in it 'flat' is the case as it lies open, insides up.
  // A board face is made as it will lie in the end (face up, the flip done) and then put under the case by undoing the flip
  const flip = new THREE.Group(); flip.position.set(0, T / 2, 0); G.add(flip);
  const flat = new THREE.Group(); flat.position.set(0, -T / 2, 0); flip.add(flat);
  const undo = new THREE.Matrix4().makeTranslation(0, T / 2, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(0, -T / 2, 0));
  const face_ = (v0, z, dy = 0) => { const g = halfTop(v0); g.translate(0, T, z); g.applyMatrix4(undo); g.translate(0, dy, 0); return g; };
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  // half A: z 0..20 as it lies open (ranks 5-8 once turned over); half B on the hinge at the inside's edge (ranks 1-4)
  const A = new THREE.Group(); flat.add(A);
  const aBody = box(40, T - .05, HALF, walnut); aBody.position.set(0, T / 2, HALF / 2); A.add(aBody);
  const aFelt = new THREE.Mesh(new THREE.PlaneGeometry(38.6, HALF - 1.4).rotateX(-Math.PI / 2), felt); aFelt.position.set(0, T - .02, HALF / 2); A.add(aFelt);
  const aTop = new THREE.Mesh(face_(.5, -HALF / 2), top); A.add(aTop);
  const hinge = new THREE.Group(); hinge.position.set(0, T, 0); flat.add(hinge);
  const bBody = box(40, T - .05, HALF, walnut); bBody.position.set(0, -T / 2, -HALF / 2); hinge.add(bBody);
  const bFelt = new THREE.Mesh(new THREE.PlaneGeometry(38.6, HALF - 1.4).rotateX(-Math.PI / 2), felt); bFelt.position.set(0, -.02, -HALF / 2); hinge.add(bFelt);
  const bTop = new THREE.Mesh(face_(0, HALF / 2, -T), top); hinge.add(bTop);
  for (const x of [-12, 12]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 5, 12), brass); h.rotation.z = Math.PI / 2; h.position.set(x, T - .1, 0); flat.add(h); }   // the hinges,
  const clasp = box(3, 1.4, .3, brass); clasp.position.set(0, T, HALF + .15); A.add(clasp);                                                                          // the clasp
  for (const m of [aBody, aTop, bBody, bTop, clasp, aFelt, bFelt]) { m.castShadow = m.receiveShadow = true; }
  const boardMeshes = [aTop, bTop], boxMeshes = [aBody, bBody, aTop, bTop, clasp, aFelt, bFelt];
  G.userData.kind = 'chess'; G.userData.snack = G; G.traverse(o => { o.userData.snack = G; });
  let lidK = 0, flipK = 0;                                           // the lid (0 shut, 1 open), the turn (0 insides up, 1 board up)
  const ease = k => k * k * (3 - 2 * k);
  const pose = () => { hinge.rotation.x = (1 - ease(lidK)) * Math.PI; flip.rotation.x = ease(flipK) * Math.PI; flip.position.y = T / 2 + Math.sin(flipK * Math.PI) * 14; };

  // ---------- the pieces ----------
  const V = (pts) => pts.map(([r, y]) => new THREE.Vector2(r, y));
  const arc = (cx, cy, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const base = s => [[0, 0], [1.55 * s, 0], [1.6 * s, .25], [1.5 * s, .45], [1.35 * s, .55], [1.4 * s, .75], [1.15 * s, .9], [.95 * s, 1.1]];
  const lathe = pts => { const g = new THREE.LatheGeometry(V(pts), 36); g.computeVertexNormals(); return g; };
  const P = {
    p: lathe([...base(.88), [.62, 1.5], [.5, 2.3], [.85, 2.45], [.85, 2.6], [.45, 2.72], ...arc(0, 3.35, .72, -Math.PI / 2 + .55, Math.PI / 2, 8)]),
    r: lathe([...base(1), [.95, 1.5], [.82, 3.6], [1.12, 3.8], [1.12, 4.0], [1.02, 4.1], [1.08, 5.0], [.78, 5.0], [.78, 4.6], [0, 4.6]]),
    b: lathe([...base(.95), [.66, 1.6], [.46, 3.5], [.9, 3.7], [.9, 3.85], [.5, 3.95], ...arc(0, 5.0, .78, -Math.PI / 2 + .35, Math.PI / 2 - .6, 8), [.18, 5.9], ...arc(0, 6.15, .28, -Math.PI / 2 + .4, Math.PI / 2, 5)]),
    q: lathe([...base(1.08), [.78, 1.7], [.52, 4.4], [1.0, 4.6], [1.0, 4.78], [.6, 4.9], [.72, 5.6], [1.02, 6.3], [.95, 6.45], [.5, 6.4], ...arc(0, 6.7, .32, -Math.PI / 2 + .6, Math.PI / 2, 5)]),
    k: lathe([...base(1.1), [.8, 1.7], [.55, 4.8], [1.05, 5.0], [1.05, 5.18], [.62, 5.3], [.7, 6.0], [.95, 6.6], [.92, 6.75], [.3, 6.85], [.3, 7.0], [0, 7.0]]),
    n: lathe([...base(1), [.95, 1.4], [1.0, 1.75], [0, 1.75]]),
  };
  // the add-ons
  const merlons = new THREE.BufferGeometry(), parts = [];
  for (let i = 0; i < 6; i++) { const g = new THREE.BoxGeometry(.5, .5, .35); g.translate(0, 5.25, .93); g.rotateY(i * Math.PI / 3); parts.push(g); }
  const mergeG = gs => { const pos = [], nor = []; let idx = [], off = 0; for (const g of gs) { const ng = g.index ? g.toNonIndexed() : g; pos.push(...ng.attributes.position.array); nor.push(...ng.attributes.normal.array); }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out; };
  const extra = {
    r: mergeG(parts),
    b: (() => { const g = new THREE.BoxGeometry(.12, .7, 1.8); g.rotateZ(.55); g.translate(.18, 5.15, 0); return g; })(),     // the cut (dark: a slit)
    q: mergeG(Array.from({ length: 8 }, (_, i) => { const g = new THREE.SphereGeometry(.16, 8, 6); g.translate(.98, 6.42, 0); g.rotateY(i * Math.PI / 4); return g; })),
    k: mergeG([(() => { const g = new THREE.BoxGeometry(.32, 1.2, .32); g.translate(0, 7.55, 0); return g; })(), (() => { const g = new THREE.BoxGeometry(.9, .3, .32); g.translate(0, 7.65, 0); return g; })()]),
    n: (() => { const s = new THREE.Shape();                          // the head, facing +x, cut from a board 1.5 thick and rounded
      s.moveTo(-1.05, 1.7); s.lineTo(1.1, 1.7); s.quadraticCurveTo(1.25, 2.6, .95, 3.2); s.quadraticCurveTo(1.35, 3.9, 2.25, 4.35); s.quadraticCurveTo(2.65, 4.6, 2.45, 5.15);
      s.quadraticCurveTo(2.0, 5.55, 1.45, 5.9); s.lineTo(1.0, 6.3); s.lineTo(.95, 7.0); s.lineTo(.45, 6.45); s.quadraticCurveTo(-.3, 6.35, -.85, 5.7);
      s.quadraticCurveTo(-1.45, 4.8, -1.4, 3.6); s.quadraticCurveTo(-1.35, 2.5, -1.05, 1.7);
      const g = new THREE.ExtrudeGeometry(s, { depth: 1.3, bevelEnabled: true, bevelThickness: .22, bevelSize: .18, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -.65); g.computeVertexNormals(); return g; })(),
  };
  const mats = { w: phys({ name: 'chessWhite', color: '#ecdcb8', roughness: .38, clearcoat: .5, clearcoatRoughness: .35 }), b: phys({ name: 'chessBlack', color: '#2a1e18', roughness: .32, clearcoat: .6, clearcoatRoughness: .3 }) };
  const slit = { w: std({ name: 'chessSlitW', color: '#6b5436', roughness: .6 }), b: std({ name: 'chessSlitB', color: '#0c0806', roughness: .6 }) };
  const pieces = [];
  function shape(pc) {                                                 // (its meshes, for its type: made again when a pawn is promoted)
    for (const o of [...pc.g.children]) pc.g.remove(o);
    const m = mats[pc.col]; pc.g.add(new THREE.Mesh(P[pc.type], m));
    if (extra[pc.type]) pc.g.add(new THREE.Mesh(extra[pc.type], pc.type === 'b' ? slit[pc.col] : m));
    pc.g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } o.userData.chessPiece = pc; o.userData.snack = G; });
    face(pc);
  }
  function makePiece(type, col) {
    const g = new THREE.Group(), pc = { g, type, col, sq: -1, home: null, x: 0, z: 0, y: 0, anim: null, lift: 0 };
    shape(pc); return pc;
  }
  function retype(pc, type) { if (pc.type !== type) { pc.type = type; shape(pc); } }
  // 16 a side: the order they go back to their places in (and the home spot by the board where each stands before)
  const ORDER = 'rnbqkbnrpppppppp';
  for (const col of ['w', 'b']) for (let i = 0; i < 16; i++) { const pc = makePiece(ORDER[i], col); pc.slot = i; pc.home = col === 'w' ? [23.5 + (i < 8 ? 0 : 3.4), 15.75 - (i % 8) * SQ] : [-23.5 - (i < 8 ? 0 : 3.4), -15.75 + (i % 8) * SQ]; pieces.push(pc); G.add(pc.g); }
  function face(pc) { pc.g.rotation.y = pc.type === 'n' ? (pc.col === 'w' ? Math.PI / 2 : -Math.PI / 2) : pc.col === 'w' ? 0 : Math.PI; }
  pieces.forEach(face);

  // where a square is on the board, and which square is under a point (in the set's space)
  const sqPos = sq => [((sq & 7) - 3.5) * SQ, (3.5 - (sq >> 3)) * SQ];
  const sqAt = (x, z) => { const f = Math.floor(x / SQ + 4), r = Math.floor(4 - z / SQ); return f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1; };
  // where a piece lies in the case (white's in half A, black's in B, as the case lies open: on their sides, along z, two rows)
  const trayOf = pc => { const i = pc.slot, x = -15.75 + (i % 8) * SQ, back = i < 8; return pc.col === 'w' ? [x, back ? 1.4 : 11.6] : [x, back ? -19 : -8.8]; };
  const place = (pc, x, z, y, rx = 0) => { pc.x = x; pc.z = z; pc.y = y; pc.rx = rx; pc.g.position.set(x, y + pc.lift, z); pc.g.rotation.x = rx; };
  function toHome(pc, instant, delay = 0) { pc.sq = -1; go(pc, pc.home[0], pc.home[1], instant, delay, 0); }
  function toSq(pc, sq, instant, delay = 0) { pc.sq = sq; const [x, z] = sqPos(sq); go(pc, x, z, instant, delay, T); }
  function toTray(pc, instant, delay = 0) { pc.sq = -3; const [x, z] = trayOf(pc); go(pc, x, z, instant, delay, T + 1.55, Math.PI / 2); }
  function go(pc, x, z, instant, delay = 0, y = 0, rx = 0) {         // (y: the board's top for a square, the table's beside it)
    if (instant) { pc.anim = null; place(pc, x, z, y, rx); return; }
    const d = Math.hypot(x - pc.x, z - pc.z); pc.anim = { x0: pc.x, z0: pc.z, y0: pc.y, r0: pc.rx || 0, x, z, y, rx, t: -delay, dur: Math.min(.8, .3 + d / 60), h: Math.min(5, 1.5 + d / 8) + Math.abs(y - pc.y) * .5 };
  }
  // captured: set by the side of the board, in the order taken
  const taken = { w: 0, b: 0 };
  function capture(pc, delay = 0, instant = false) { const n = taken[pc.col]++; pc.sq = -2; const side = pc.col === 'w' ? -1 : 1; go(pc, side * (27.5 + (n >= 8 ? 3.3 : 0)), side * (-15.75 + (n % 8) * SQ), instant, delay, 0); }
  function resetTaken() { taken.w = taken.b = 0; }

  // markers: where the chosen piece may go (a dot; a ring where it takes), the last move's two squares, the check
  const markG = new THREE.CircleGeometry(.75, 24).rotateX(-Math.PI / 2), ringG = new THREE.RingGeometry(1.6, 2.05, 32).rotateX(-Math.PI / 2), sqG = new THREE.PlaneGeometry(SQ, SQ).rotateX(-Math.PI / 2);
  const mk = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, ...clip });
  const dotM = mk('#1d6b3a', .55), ringM = mk('#1d6b3a', .55), lastM = mk('#e0b040', .32), chkM = mk('#d0302a', .45), selM = mk('#3aa0ff', .3);
  const marks = new THREE.Group(); G.add(marks);
  const pool = [];
  function markers(list, last, check, selSq) {                         // list: [{ sq, cap }]
    for (const m of pool) m.visible = false; let n = 0;
    const put = (geo, mat, sq, y) => { let m = pool[n]; if (!m) { m = new THREE.Mesh(geo, mat); m.userData.noTrace = true; m.renderOrder = 2; pool.push(m); marks.add(m); } m.geometry = geo; m.material = mat; const [x, z] = sqPos(sq); m.position.set(x, T + y, z); m.visible = true; m.userData.chessSq = sq; n++; };
    if (last) for (const s of last) put(sqG, lastM, s, .02);
    if (check >= 0) put(sqG, chkM, check, .025);
    if (selSq >= 0) put(sqG, selM, selSq, .03);
    for (const t of list) put(t.cap ? ringG : markG, t.cap ? ringM : dotM, t.sq, .04);
  }

  // each frame: the pieces in flight; the case's steps (opening: the pieces shown in it, the lid up, the pieces out, the turn; packing:
  // the pieces off the board, the turn back, the pieces in, the lid down)
  let seq = [], stage = 'closed';
  function run(list) { seq = list; stage = 'busy'; }
  const inFlight = () => pieces.some(p => p.anim);
  function step(dt) {
    let moved = false;
    for (const pc of pieces) {
      const a = pc.anim;
      if (a) { a.t += dt; if (a.t < 0) continue; const k = Math.min(1, a.t / a.dur), e = ease(k);
        pc.x = a.x0 + (a.x - a.x0) * e; pc.z = a.z0 + (a.z - a.z0) * e; pc.y = a.y0 + (a.y - a.y0) * e; pc.g.position.set(pc.x, pc.y + Math.sin(k * Math.PI) * a.h + pc.lift, pc.z); pc.g.rotation.x = a.r0 + (a.rx - a.r0) * e; moved = true;
        if (k >= 1) { pc.anim = null; place(pc, a.x, a.z, a.y, a.rx); } }
      const want = pc.sel ? 1.4 : 0; if (Math.abs(pc.lift - want) > .01) { pc.lift += (want - pc.lift) * Math.min(1, dt * 14); if (!pc.anim) pc.g.position.y = pc.y + pc.lift; moved = true; }
    }
    const s = seq[0];
    if (s) { moved = true;
      if (s.k === 'lid') { lidK = Math.max(0, Math.min(1, lidK + Math.sign(s.to - lidK) * dt / .8)); pose(); if (lidK === s.to) seq.shift(); }
      else if (s.k === 'flip') { flipK = Math.max(0, Math.min(1, flipK + Math.sign(s.to - flipK) * dt / 1.1)); pose(); if (flipK === s.to) seq.shift(); }
      else if (s.k === 'do') { s.fn(); seq.shift(); }
      else if (s.k === 'wait') { if (!inFlight()) seq.shift(); }
      else if (s.k === 'done') { stage = s.stage; seq.shift(); }
    }
    return moved;
  }
  const show = v => { for (const pc of pieces) pc.g.visible = v; marks.visible = v; };
  function setOpen(v, instant) {
    if (instant) { seq = []; lidK = flipK = v ? 1 : 0; pose(); show(!!v); stage = v ? 'open' : 'closed'; if (v) pieces.forEach(pc => toHome(pc, true)); return; }
    const blacks = on => { for (const pc of pieces) if (pc.col === 'b') pc.g.visible = on; };   // (black's lie in the lid: shown once it is open, hidden before it shuts)
    if (v) run([{ k: 'do', fn: () => { pieces.forEach(pc => toTray(pc, true)); show(true); blacks(false); marks.visible = false; } }, { k: 'lid', to: 1 }, { k: 'do', fn: () => blacks(true) },
      { k: 'do', fn: () => pieces.forEach((pc, i) => toHome(pc, false, i * .04)) }, { k: 'wait' }, { k: 'flip', to: 1 }, { k: 'do', fn: () => { marks.visible = true; } }, { k: 'done', stage: 'open' }]);
    else run([{ k: 'do', fn: () => { marks.visible = false; pieces.forEach((pc, i) => { pc.sel = false; toHome(pc, false, i * .02); }); } }, { k: 'wait' }, { k: 'flip', to: 0 },
      { k: 'do', fn: () => pieces.forEach((pc, i) => toTray(pc, false, i * .04)) }, { k: 'wait' }, { k: 'do', fn: () => blacks(false) }, { k: 'lid', to: 0 }, { k: 'do', fn: () => show(false) }, { k: 'done', stage: 'closed' }]);
  }
  function stagger(fn) { pieces.forEach((pc, i) => fn(pc, i * .045)); }
  setOpen(false, true);
  const busy = () => stage === 'busy' || inFlight();
  return { group: G, pieces, boardMeshes, boxMeshes, sqPos, sqAt, toSq, toHome, go, capture, resetTaken, markers, step, setOpen, stagger, busy, retype, get isOpen() { return stage === 'open'; }, get stage() { return stage; }, T, SQ };
}
