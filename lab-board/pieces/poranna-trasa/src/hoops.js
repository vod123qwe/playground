// The court at home, beside the house on the garage's side: asphalt with its lines (the key painted brick red, the free-throw line
// and its circle, the three-point arc with its straight ends by the sidelines: from the corners it is three too), the hoop on the
// house's side wall on its brackets at 3.05 m (a board, a net), round it a bench, a lamp, a cart of balls, the score chalked on the
// wall, a low fence with a gate where the path from the circle comes in, and the path on to the neighbour's door. A ball on it.
// The ball: walk up to it and it is in your hands, and you see through your eyes; aim with the mouse, hold the left button: the power
// swings up and down (a band of green on it: the power that would carry it to the rim from where you stand, as you aim now), let go.
// It flies as a ball does: off the board, off the rim, the wall, the drive, it rolls; through the ring from above: two points, from beyond
// the arc three; in a row they count double ("W GAZIE"). The right button puts it down. Walk off the court with it and it stays.
// A challenge (modes.js, 'kosz'): a minute; one spot lights up after another, shoot from it; a make gives two seconds more.
// createHoops({ THREE, scene, track, audio, hud, game }) → { update(dt, ctx), holding, score, ghostThrow(m), challenge: { start, update, stop, get t, get pts }, at(u, w, y), start, facing }
//   ctx: { me (the walker or null), cam, hold (the throw button held), drop (edge), view, toFirst(), toThird() }
//   game: { flash(s), send(m) (to the other player), pop(at, text, col) }

export function createHoops({ THREE, scene, track, audio, hud, game }) {
  const home = track.home, H = home?.homeH, L = H?.userData.lay; if (!H || !L) return null;
  H.updateMatrixWorld(true); const V3 = THREE.Vector3, HW = L.gx + 1.9, ZC = -1;   // (HW: half the house's width; ZC: the hoop's place along the side wall)
  // the court's frame: o at the side wall's foot under the hoop, ez out from the wall, ex along it (towards the street)
  const o = H.localToWorld(new V3(HW, 0, ZC)), ez = H.localToWorld(new V3(HW + 1, 0, ZC)).sub(o).setY(0).normalize(), ex = H.localToWorld(new V3(HW, 0, ZC - 1)).sub(o).setY(0).normalize();
  const base = H.position.y, W = (u, w, y = 0) => new V3(o.x + ex.x * u + ez.x * w, base + y, o.z + ex.z * u + ez.z * w);
  const toCourt = p => { const dx = p.x - o.x, dz = p.z - o.z; return { u: dx * ex.x + dz * ex.z, w: dx * ez.x + dz * ez.z, y: p.y - base }; };
  const BOARD = .5, RIM = { u: 0, w: .88, y: 3.05, R: .23, tube: .02 }, BR = .12, ARC = 5.4, SIDE3 = 3.9, rimW = W(RIM.u, RIM.w, RIM.y), WALL = [ZC - L.D / 2, ZC + L.D / 2];   // (the wall along u: from the house's back to its front)
  const isThree = (u, w) => Math.hypot(u - RIM.u, w - RIM.w) > ARC || (Math.abs(u) > SIDE3 && w < RIM.w + Math.sqrt(ARC * ARC - SIDE3 * SIDE3));
  const yaw = Math.atan2(ez.x, ez.z);   // (an object's local +z out over the court)
  const ground = (x, z, hint) => Math.max(track.probe(x, z, hint ?? home.iJ).y, base) + .045;
  const G = new THREE.Group(); scene.add(G);
  const mat = c => new THREE.MeshLambertMaterial({ color: c });
  const thing = (o3, u, w, spec) => { const q = W(u, w); o3.position.set(q.x, ground(q.x, q.z) - .045, q.z); o3.rotation.y = yaw + (spec?.turn || 0); G.add(o3); if (spec?.hit) track.addHit(o3, spec.hit, track.probe(q.x, q.z, home.iJ).i); return o3; };
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; return b; };
  // (a strip laid on the ground between court points, draped: lines, paths)
  const strip = (pts, wd, m, lift) => { for (let k = 0; k < pts.length - 1; k++) { const a = W(pts[k][0], pts[k][1]), b = W(pts[k + 1][0], pts[k + 1][1]), l = a.distanceTo(b) || .01, sg = new THREE.Mesh(new THREE.BoxGeometry(wd, .01, l + wd * .5), m);
      sg.position.set((a.x + b.x) / 2, Math.max(ground(a.x, a.z), ground(b.x, b.z)) - .045 + lift, (a.z + b.z) / 2); sg.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); sg.receiveShadow = true; G.add(sg); } };
  // ---------- the court: asphalt, the key painted, the lines ----------
  { const plate = (u0, u1, w0, w1, m, lift, nu = 14, nw = 13) => { const g = new THREE.PlaneGeometry(1, 1, nu, nw), P = g.attributes.position;
      for (let k = 0; k < P.count; k++) { const u = u0 + (P.getX(k) + .5) * (u1 - u0), w = w0 + (P.getY(k) + .5) * (w1 - w0), q = W(u, w); P.setXYZ(k, q.x, ground(q.x, q.z) - .045 + lift, q.z); } g.computeVertexNormals();
      { const nn = g.attributes.normal; if (nn.getY(0) < 0) { g.index.array.reverse(); g.computeVertexNormals(); } } const m3 = new THREE.Mesh(g, m); m3.receiveShadow = true; G.add(m3); return m3; };
    plate(-4.3, 4.3, -.05, 8.1, mat('#45484d'), .025); plate(-4.42, 4.42, -.05, 8.22, mat('#2a2c30'), .02, 2, 2);   // the asphalt (a darker rim of it: its edge)
    plate(-1.8, 1.8, 0, 4.6, mat('#8e3b2a'), .03, 6, 8);   // the key, painted
    const lineM = mat('#ece8dc'), circ = (cu, cw, r, a0, a1, n = 18) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [cu + Math.sin(a) * r, cw + Math.cos(a) * r]; });
    strip([[-4.2, 0], [4.2, 0]], .06, lineM, .037); strip([[-4.2, 0], [-4.2, 8], [4.2, 8], [4.2, 0]], .06, lineM, .037);   // the baseline (the wall's foot); the sides and the far line
    strip([[-1.8, 0], [-1.8, 4.6], [1.8, 4.6], [1.8, 0]], .06, lineM, .037); strip(circ(0, 4.6, 1.5, -Math.PI / 2, Math.PI / 2, 16), .06, lineM, .037);   // the key's edges; the free-throw circle
    for (const w0 of [1.4, 2.2, 3.0]) for (const sg of [-1, 1]) strip([[sg * 1.8, w0], [sg * 2.0, w0]], .06, lineM, .037);   // (the marks along the key, where they stand for a free throw)
    const aEnd = Math.asin(SIDE3 / ARC), wEnd = RIM.w + Math.cos(aEnd) * ARC; strip([[-SIDE3, 0], [-SIDE3, wEnd], ...circ(RIM.u, RIM.w, ARC, -aEnd, aEnd, 30), [SIDE3, wEnd], [SIDE3, 0]], .06, lineM, .037);   // the arc and its straight ends
    // the hoop: on two brackets off the wall, the board (white, a red box on it), the orange ring on its arm, the net
    const hoop = new THREE.Group(), white = mat('#f4f1e8'), red = mat('#c23a2e'), iron = mat('#2f3236'); hoop.position.copy(W(0, 0)); hoop.rotation.y = yaw; G.add(hoop);
    for (const x0 of [-.32, .32]) { hoop.add(box(.06, .06, BOARD, iron, x0, 3.45, BOARD / 2)); const st = box(.05, .05, .62, iron, x0, 3.12, BOARD / 2 - .05); st.rotation.x = -.62; hoop.add(st); hoop.add(box(.12, .14, .03, iron, x0, 3.45, .015)); hoop.add(box(.12, .14, .03, iron, x0, 2.86, .015)); }
    hoop.add(box(1.2, .75, .05, white, 0, 3.275, BOARD - .025));
    for (const [w0, h0, x0, y0] of [[.59, .05, 0, 3.12], [.59, .05, 0, 3.47], [.05, .4, -.27, 3.295], [.05, .4, .27, 3.295]]) hoop.add(box(w0, h0, .012, red, x0, y0, BOARD + .003));
    for (const x0 of [-.6, .6]) hoop.add(box(.05, .79, .06, iron, x0, 3.275, BOARD - .03)); hoop.add(box(1.25, .05, .06, iron, 0, 3.66, BOARD - .03)); hoop.add(box(1.25, .05, .06, iron, 0, 2.89, BOARD - .03));
    hoop.add(box(.1, .05, .22, mat('#d9542e'), 0, RIM.y - .02, BOARD + .12));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RIM.R, RIM.tube, 6, 24).rotateX(Math.PI / 2), mat('#d9542e')); ring.position.set(0, RIM.y, RIM.w); hoop.add(ring);
    // the net: twelve cords, from the ring down and in; each a thin box from a top point to a bottom one, swaying when something goes through
    const net = new THREE.Group(); net.position.set(0, RIM.y, RIM.w); hoop.add(net); const cordM = mat('#efeae0'), cords = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, b = a + Math.PI / 12, top = new V3(Math.cos(a) * RIM.R, -.01, Math.sin(a) * RIM.R), bot = new V3(Math.cos(b) * .13, -.4, Math.sin(b) * .13);
      const c = new THREE.Mesh(new THREE.BoxGeometry(.012, top.distanceTo(bot), .012), cordM); cords.push({ c, top, bot }); net.add(c); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = new THREE.Mesh(new THREE.BoxGeometry(.11, .01, .01), cordM); r.position.set(Math.cos(a) * .19, -.17, Math.sin(a) * .19); r.rotation.y = -a + Math.PI / 2; net.add(r); }   // (the ring of knots halfway)
    var setNet = (sw, t) => { for (const [k, C] of cords.entries()) { const b = C.bot.clone().add(new V3(Math.sin(t * 9 + k) * .05 * sw, sw * .1 * Math.sin(t * 14), Math.cos(t * 7 + k) * .05 * sw)); const mid = C.top.clone().lerp(b, .5); C.c.position.copy(mid); C.c.lookAt(net.localToWorld(b.clone())); C.c.rotateX(Math.PI / 2); C.c.scale.y = C.top.distanceTo(b) / C.top.distanceTo(C.bot); } net.scale.y = 1 + sw * .12 * Math.sin(t * 16); };
    setNet(0, 0); var hoopG = hoop;
    // round it: the bench at the far line, the lamp in the corner, the cart of balls by the wall, the score chalked on the wall
    const wood = mat('#8a6a44'), dark = mat('#2f3236');
    { const b = new THREE.Group(); for (const k of [0, 1, 2]) b.add(box(1.8, .05, .1, wood, 0, .46, -.13 + k * .13)); for (const k of [0, 1]) b.add(box(1.8, .1, .04, wood, 0, .72 + k * .16, .24)); for (const x0 of [-.78, .78]) { b.add(box(.06, .46, .48, dark, x0, .23, 0)); b.add(box(.06, .55, .05, dark, x0, .76, .24)); }
      b.add(box(.08, .2, .08, mat('#3d7be0'), -.4, .58, 0)); b.add(box(.07, .18, .07, mat('#e8692c'), .5, .57, -.05));   // (two bottles of water on it)
      thing(b, -1.4, 9.0, { turn: 0, hit: { hx: .9, hz: .3, h: .95, kind: 'hard' } }); }
    { const lp = new THREE.Group(); lp.add(box(.12, 4.6, .12, dark, 0, 2.3, 0)); lp.add(box(.9, .1, .12, dark, 0, 4.55, -.4)); lp.add(box(.36, .14, .26, mat('#fff3cf'), 0, 4.45, -.78)); thing(lp, -4.9, 8.6, { turn: Math.PI * .75, hit: { hx: .08, hz: .08, h: 4.6, kind: 'hard' } }); }
    { const ct = new THREE.Group(), wire = mat('#9a9c9e'); for (const [x0, z0] of [[-.4, -.25], [.4, -.25], [-.4, .25], [.4, .25]]) ct.add(box(.03, .7, .03, wire, x0, .35, z0)); ct.add(box(.86, .03, .56, wire, 0, .3, 0)); ct.add(box(.86, .03, .56, wire, 0, .7, 0));
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 10, 7), mat('#d9682a')); m.position.set(-.26 + k * .26, .45 + (k % 2) * .05, (k - 1) * .08); ct.add(m); } for (const x0 of [-.36, .36]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .04, 8).rotateZ(Math.PI / 2), dark); wh.position.set(x0, .05, -.22); ct.add(wh); }
      thing(ct, -3.6, .7, { hit: { hx: .45, hz: .3, h: .75, kind: 'hard' } }); }
    { const c = document.createElement('canvas'); c.width = 64; c.height = 40; const g = c.getContext('2d'); g.fillStyle = '#2b3a2e'; g.fillRect(0, 0, 64, 40); g.fillStyle = '#7a5636'; g.fillRect(0, 0, 64, 3); g.fillRect(0, 37, 64, 3); g.fillRect(0, 0, 3, 40); g.fillRect(61, 0, 3, 40);
      g.fillStyle = '#e8e4d6'; g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('DOM', 18, 13); g.fillText('GOŚCIE', 46, 13); g.font = 'bold 14px monospace'; g.fillText('12', 18, 30); g.fillText('9', 46, 30); g.fillRect(31, 8, 1, 26);
      const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; const sb = new THREE.Mesh(new THREE.PlaneGeometry(.96, .6), new THREE.MeshLambertMaterial({ map: t })); const q = W(-2.3, .03); sb.position.set(q.x, base + 1.7, q.z); sb.rotation.y = yaw; G.add(sb); }
    // the path: from the circle's pavement, through the gate, onto the court; on from its far side to the neighbour's door
    const slabM = mat('#bcb6a6'), hw = (q0, q1) => { const a = toCourt(q0), b = toCourt(q1), n = Math.max(1, Math.round(Math.hypot(b.u - a.u, b.w - a.w) / .9)); strip(Array.from({ length: n + 1 }, (_, k) => [a.u + (b.u - a.u) * k / n, a.w + (b.w - a.w) * k / n]), .95, slabM, .02); };
    { const C0 = home.C0, gate = W(4.7, 2.2), d = gate.clone().sub(C0).setY(0), toRing = C0.clone().addScaledVector(d.normalize(), home.Rc + 1.8); hw(toRing, gate); hw(gate, W(4.25, 2.2)); }
    { const lady = track.seats.find(q => q.lines === 'sasiadka'), dr = lady && track.doors.reduce((a, b) => (b.p.distanceTo(lady.h.position) < a.p.distanceTo(lady.h.position) ? b : a), track.doors[0]);
      if (dr) { const step = dr.p.clone().addScaledVector(dr.n, -1.6), mid = W(2.2, 8.9); hw(W(2.2, 8.15), mid); hw(mid, step); } }
    // the fence along the court's street side: low pickets, the gate open where the path comes in
    { const pick = mat('#e9e3d1'), rail = mat('#cfc8b4'); for (let w0 = -.1; w0 < 8.3; w0 += .16) { if (w0 > 1.55 && w0 < 2.85) continue; const pk = box(.05, .62, .04, pick, 0, .31, 0); thing(pk, 4.75, w0); }
      for (const [a0, a1] of [[-.1, 1.55], [2.85, 8.3]]) for (const y0 of [.18, .48]) { const r = box(.04, .05, a1 - a0, rail, 0, y0, 0), g0 = new THREE.Group(); g0.add(r); thing(g0, 4.78, (a0 + a1) / 2); }
      for (const [a0, a1] of [[-.1, 1.55], [2.85, 8.3]]) { const g0 = new THREE.Group(); thing(g0, 4.76, (a0 + a1) / 2, { hit: { hx: .06, hz: (a1 - a0) / 2, h: .62, kind: 'hard' } }); }
      const gt = new THREE.Group(); for (let k = 0; k < 7; k++) gt.add(box(.05, .66, .04, pick, 0, .33, .08 + k * .16)); gt.add(box(.04, .05, 1.05, rail, -.02, .2, .55)); gt.add(box(.04, .05, 1.05, rail, -.02, .5, .55));
      thing(gt, 4.75, 1.62, { turn: -1.9 }); for (const w0 of [1.55, 2.85]) { const ps = box(.09, .8, .09, rail, 0, .4, 0); thing(ps, 4.75, w0); } } }
  let netSw = 0, netT = 0;
  // ---------- the ball ----------
  const tex = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 16; const g = c.getContext('2d'); g.fillStyle = '#d9682a'; g.fillRect(0, 0, 32, 16); g.fillStyle = '#7a2e12';
    for (let x = 0; x < 32; x++) { g.fillRect(x, 8, 1, 1); g.fillRect(x, Math.round(8 + Math.sin(x / 32 * Math.PI * 2) * 6), 1, 1); } g.fillRect(8, 0, 1, 16); g.fillRect(24, 0, 1, 16);
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const ballMesh = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 12, 8), new THREE.MeshLambertMaterial({ map: tex })); m.castShadow = true; scene.add(m); return m; };
  const ball = { m: ballMesh(), p: W(1.5, 3, 0), v: new V3(), held: false, rest: false, t: 0, thrown: null, hint: home.iJ }; ball.p.y = ground(ball.p.x, ball.p.z) + BR; ball.m.position.copy(ball.p);
  const ghosts = [];   // (the other player's balls, only seen)
  let streak = 0, score = 0, made = 0, shots = 0, pickT = 0, switched = false, charge = null;
  // ---------- his arms, seen through his eyes: from the shoulders below the picture's edge to the hands on the ball, bent at the elbows.
  // Held: the ball before him; charging: it sinks to the chest, the elbows out; let go: the arms shoot up and forward, the wrists flick
  // over, then down out of the picture; the ball back: they come up with it ----------
  const skin = mat('#e3b08a'), sleeve = mat('#eeeae0'), arms = new THREE.Group(); arms.visible = false; scene.add(arms);
  const seg = (w, l, m) => { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(w, w, l).translate(0, 0, l / 2), m); g.add(b); arms.add(g); return g; };
  const ARM = [-1, 1].map(sd => ({ sd, up: seg(.085, 1, sleeve), lo: seg(.068, 1, skin), hand: (() => { const h = new THREE.Group(), palm = new THREE.Mesh(new THREE.BoxGeometry(.085, .03, .1), skin); h.add(palm);
      for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.016, .016, .06), skin); f.position.set(-.03 + k * .02, 0, .075); h.add(f); } const th = new THREE.Mesh(new THREE.BoxGeometry(.018, .018, .05), skin); th.position.set(-.05 * sd, .01, .02); th.rotation.y = .6 * sd; h.add(th); arms.add(h); return h; })() }));
  let armT = 0, armMode = 'off', armK = 0;   // (armK: 0 down out of sight .. 1 up holding)
  const _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4();
  // (a segment from a to b, in the camera's space)
  const aimSeg = (g, a, b) => { g.position.copy(a); _m4.lookAt(b, a, new V3(0, 1, 0)); g.quaternion.setFromRotationMatrix(_m4); g.scale.set(1, 1, a.distanceTo(b)); };
  function poseArms(cam, dt, ballLocal, charge) { arms.visible = armMode !== 'off' && armK > .02; if (!arms.visible) return; armT += dt;
    let rise = armK; const lift = armMode === 'throw' ? Math.min(1, armT / .12) : 0, fall = armMode === 'throw' ? Math.max(0, (armT - .2) / .3) : 0; if (armMode === 'throw' && armT > .5) { armMode = 'off'; arms.visible = false; return; }
    for (const A of ARM) { const sh = new V3(A.sd * .24, -.42 - (1 - rise) * .35, -.08);
      let hand; if (armMode === 'throw') hand = new V3(A.sd * (.11 - .04 * lift), -.2 + lift * .32 - fall * .7, -.46 - lift * .26); else hand = ballLocal.clone().add(new V3(A.sd * .125, -.02 - charge * .02, .02)).add(new V3(0, -(1 - rise) * .45, 0));
      const mid = sh.clone().lerp(hand, .5).add(new V3(A.sd * (.1 + charge * .07), -.09 + lift * .05, .05)); aimSeg(A.up, sh, mid); aimSeg(A.lo, mid, hand);
      A.hand.position.copy(hand); A.hand.quaternion.setFromEuler(new THREE.Euler(armMode === 'throw' ? -.4 + lift * 1.6 : .15, 0, A.sd * (armMode === 'throw' ? .3 : 1.25), 'YXZ')); }   // (held: the palms to the ball's sides; thrown: the wrists flicked over)
    arms.position.copy(cam.position); arms.quaternion.copy(cam.quaternion); }
  // ---------- the flight: a step of a ball (b: { p, v, m }); events: 'board', 'rim', 'floor', 'in' ----------
  function fly(b, dt, ev) { const n = Math.max(1, Math.ceil(b.v.length() * dt / .05)), h = dt / n;
    for (let s = 0; s < n; s++) { const prevY = b.p.y, prevC = toCourt(b.p); b.v.y -= 9.81 * h; b.p.addScaledVector(b.v, h); const c = toCourt(b.p);
      // the wall: the house's side, its length; the board's front face, half a metre out from it
      const wallW = 0; if (c.u > WALL[0] && c.u < WALL[1] && c.w < wallW + BR && prevC.w >= wallW + BR - .02 && c.y < 6) { const vn = b.v.x * ez.x + b.v.z * ez.z; if (vn < 0) { b.v.x -= ez.x * vn * 1.6; b.v.z -= ez.z * vn * 1.6; b.v.multiplyScalar(.85); ev('board'); } const k = wallW + BR - c.w; b.p.x += ez.x * k; b.p.z += ez.z * k; }
      // the board: its front face
      if (c.w < BOARD + BR && prevC.w >= BOARD + BR - .03 && Math.abs(c.u) < .6 + BR * .5 && c.y > 2.9 - BR && c.y < 3.65 + BR) { const vn = b.v.x * ez.x + b.v.z * ez.z; if (vn < 0) { b.v.x -= ez.x * vn * 1.62; b.v.z -= ez.z * vn * 1.62; b.v.multiplyScalar(.9); ev('board'); } const k = BOARD + BR - c.w; b.p.x += ez.x * k; b.p.z += ez.z * k; }
      // the rim: the nearest point of the ring; the ball off it as off a pipe
      { const du = c.u - RIM.u, dw = c.w - RIM.w, r = Math.hypot(du, dw) || 1e-4, pu = RIM.u + du / r * RIM.R, pw = RIM.w + dw / r * RIM.R, q = W(pu, pw, RIM.y), d = b.p.distanceTo(q);
        if (d < BR + RIM.tube) { const nrm = b.p.clone().sub(q).divideScalar(d || 1), vn = b.v.dot(nrm); b.p.copy(q).addScaledVector(nrm, BR + RIM.tube + .001); if (vn < 0) { b.v.addScaledVector(nrm, -vn * 1.55); b.v.multiplyScalar(.82); ev('rim'); } } }
      // through the ring, from above
      if (prevY > base + RIM.y && b.p.y <= base + RIM.y && Math.hypot(c.u - RIM.u, c.w - RIM.w) < RIM.R - BR * .55) ev('in');
      // the drive, and whatever hard stands on it
      const gy = ground(b.p.x, b.p.z, b.hint) + BR - .045; if (b.p.y < gy) { b.p.y = gy; if (b.v.y < -1.2) { b.v.y *= -.66; b.v.x *= .9; b.v.z *= .9; ev('floor'); } else { b.v.y = 0; b.v.x *= Math.pow(.25, h); b.v.z *= Math.pow(.25, h); } }
      for (const C of track.near(b.hint)) { if (C.kind !== 'hard' || b.p.y > (C.y0 || 0) + C.h + BR) continue; const dx = b.p.x - C.x, dz = b.p.z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c;
        if (Math.abs(lx) < C.hx + BR && Math.abs(lz) < C.hz + BR) { const ox = C.hx + BR - Math.abs(lx), oz = C.hz + BR - Math.abs(lz); let nx, nz; if (ox < oz) { nx = Math.sign(lx) * C.c; nz = -Math.sign(lx) * C.s; } else { nx = Math.sign(lz) * C.s; nz = Math.sign(lz) * C.c; }
          const vn = b.v.x * nx + b.v.z * nz; if (vn < 0) { b.v.x -= nx * vn * 1.5; b.v.z -= nz * vn * 1.5; } b.p.x += nx * Math.min(ox, oz); b.p.z += nz * Math.min(ox, oz); } } }
    b.hint = track.probe(b.p.x, b.p.z, b.hint).i; b.m.position.copy(b.p); b.m.rotation.x += b.v.length() * dt * 3; b.m.rotation.z += b.v.x * dt * 2; }
  // ---------- the power that would carry it to the rim, aimed as now (for the green band) ----------
  const LIFT = .5, VMIN = 4.2, VMAX = 11.5;   // (the throw goes a little above where you look; its speed from the power)
  function need(from, dir) { const dx = rimW.x - from.x, dz = rimW.z - from.z, D = Math.hypot(dx, dz), Hh = rimW.y - from.y, th = Math.asin(Math.max(-1, Math.min(1, dir.y))), c = Math.cos(th), den = 2 * c * c * (D * Math.tan(th) - Hh);
    if (den <= 0) return null; const v = Math.sqrt(9.81 * D * D / den); return (v - VMIN) / (VMAX - VMIN); }
  // (from the ball in the hands to where the eyes look, at the hoop's distance: no aiming off by the hand's offset; then lifted into an arc)
  const aimDir = (cam, from) => { const d = cam.getWorldDirection(new V3()), D = Math.max(1, Math.hypot(rimW.x - cam.position.x, rimW.z - cam.position.z) / Math.max(.2, Math.hypot(d.x, d.z))), tgt = cam.position.clone().addScaledVector(d, D), a = tgt.sub(from).normalize(), side = new V3(-a.z, 0, a.x).normalize(); return a.applyAxisAngle(side, LIFT).normalize(); };
  // ---------- the HUD: a cross in the middle, the power bar by it ----------
  const css = document.createElement('style'); css.textContent = `#hoopui { position: fixed; left: 50%; top: 50%; z-index: 3; pointer-events: none; display: none; } #hoopui.on { display: block; }
    #hoopui .x { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; } #hoopui .x:before, #hoopui .x:after { content: ''; position: absolute; background: #f6f3ea; box-shadow: 0 0 0 2px #17181b; } #hoopui .x:before { left: 8px; top: 0; width: 2px; height: 18px; } #hoopui .x:after { top: 8px; left: 0; height: 2px; width: 18px; }
    #hoopui .bar { position: absolute; left: 44px; top: -70px; width: 14px; height: 140px; background: #1d1e21; box-shadow: 0 0 0 2px #17181b, 0 0 0 4px #d3d0c3; } #hoopui .bar i { position: absolute; left: 0; right: 0; bottom: 0; background: #efc970; } #hoopui .bar b { position: absolute; left: -3px; right: -3px; background: rgba(159,210,122,.85); box-shadow: 0 0 0 1px #17181b; }
    #hoopui .lab { position: absolute; left: 66px; top: -8px; white-space: nowrap; font: 700 11px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #f6f3ea; text-shadow: 1px 1px 0 #17181b; letter-spacing: .06em; }
    #hoopui .tip { position: absolute; top: 90px; left: 50%; transform: translateX(-50%); white-space: nowrap; font: 700 11px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #f6f3ea; background: rgba(23,24,27,.8); padding: 4px 8px; letter-spacing: .05em; }`;
  document.head.appendChild(css); const ui = document.createElement('div'); ui.id = 'hoopui'; ui.innerHTML = '<div class="x"></div><div class="bar"><b></b><i></i></div><div class="lab"></div><div class="tip">LPM: TRZYMAJ I PUŚĆ · PPM: ODŁÓŻ</div>'; document.body.appendChild(ui);
  const barI = ui.querySelector('.bar i'), barB = ui.querySelector('.bar b'), lab = ui.querySelector('.lab');
  // ---------- the challenge's spots ----------
  const SPOTS = [[-2.4, 1.9, 2], [0, 4.6, 2], [2.4, 1.9, 2], [-4.05, 1.6, 3], [0, 6.7, 3], [4.05, 1.6, 3]], spotM = new THREE.Mesh(new THREE.RingGeometry(.45, .62, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9fd27a', transparent: true, opacity: .85 }));
  spotM.visible = false; scene.add(spotM); let spot = null;
  const setSpot = k => { spot = k == null ? null : SPOTS[k]; spotM.visible = !!spot; if (spot) { const q = W(spot[0], spot[1]); spotM.position.set(q.x, ground(q.x, q.z) + .02, q.z); } };
  const onCourt = p => { const c = toCourt(p); return c.u > -5.4 && c.u < 5.2 && c.w > -.6 && c.w < 9.8; };
  // ---------- what happens: points, sounds, the net ----------
  function event(b, e) { if (e === 'board') audio.play('kick', { vol: .35 }); if (e === 'rim') audio.play('bell', { vol: .25 }); if (e === 'floor') audio.play('kick', { vol: Math.min(.4, .1 + b.v.length() * .04) });
    if (e === 'in' && b.thrown && !b.thrown.scored) { b.thrown.scored = true; netSw = 1; netT = 0; if (b.ghost) return; const T = b.thrown, three = T.three, inSpot = !ch.on || (spot && Math.hypot(T.cu - spot[0], T.cw - spot[1]) < .75);
      let pts = inSpot ? (three ? 3 : 2) : 0; streak = inSpot ? streak + 1 : 0; const fire = streak >= 3; if (fire) pts *= 2; score += pts; made++;
      audio.play(pts >= 3 ? 'trick' : 'coin'); game.pop(rimW.clone().setY(rimW.y + .6), pts ? (fire ? 'W GAZIE! ' : '') + '+' + pts : 'TRAFIONY, ALE NIE Z PUNKTU', pts ? (fire ? '#cf5a3e' : '#9fd27a') : '#efc970');
      if (ch.on) { ch.t += 2; ch.pts = score - ch.s0; } } }
  // ---------- each frame ----------
  function update(dt, ctx) { const me = ctx.me; netT += dt; netSw = Math.max(0, netSw - dt * 1.2); setNet(netSw, netT); pickT = Math.max(0, pickT - dt);
    for (let k = ghosts.length - 1; k >= 0; k--) { const g = ghosts[k]; g.t += dt; fly(g, dt, e => event(g, e)); if (g.t > 6) { scene.remove(g.m); ghosts.splice(k, 1); } }
    if (ball.held) { if (!me) { drop(); return; }
      // in his hands: before the eyes (seen through them), or at his chest
      const cam = ctx.cam, fw = cam.getWorldDirection(new V3()), rt = new V3(-fw.z, 0, fw.x).normalize(), bob = Math.sin(netT * 7) * .01;
      const bl = new V3(.06, -.24 + bob - (charge?.p || 0) * .06, -.66 + (charge?.p || 0) * .1); armK = Math.min(1, armK + dt * 5); if (armMode !== 'throw') armMode = 'hold';
      if (ctx.view === 'first') { ball.p.copy(bl).applyQuaternion(cam.quaternion).add(cam.position); poseArms(cam, dt, bl, charge?.p || 0); } else ball.p.set(me.x + Math.sin(me.yaw) * .35, me.y + 1.05, me.z + Math.cos(me.yaw) * .35);
      ball.m.position.copy(ball.p);
      if (!onCourt(me)) { drop(true); game.flash('Piłka zostaje na podwórku'); return; }
      if (ctx.drop) { drop(); return; }
      const from = ball.p.clone(), dir = aimDir(cam, from), nd = need(from, dir), tol = .07 - Math.min(.035, toCourt(me).w * .004);   // (the farther, the narrower)
      if (ctx.hold) { charge ||= { t: 0 }; charge.t += dt; const per = 1.25 - Math.min(.35, streak * .06); charge.p = (1 - Math.cos(charge.t / per * Math.PI * 2)) / 2; }   // (in a streak it swings faster)
      else if (charge) { throwIt(from, dir, charge.p); charge = null; }
      ui.classList.add('on'); barI.style.height = Math.round((charge?.p || 0) * 100) + '%';
      if (nd != null && nd > -.05 && nd < 1.05) { barB.style.display = ''; barB.style.bottom = Math.round(Math.max(0, nd - tol) * 100) + '%'; barB.style.height = Math.round(tol * 2 * 100) + '%'; } else barB.style.display = 'none';
      const c = toCourt(me), d = Math.hypot(c.u - RIM.u, c.w - RIM.w); lab.textContent = (isThree(c.u, c.w) ? 'ZA 3 · ' : 'ZA 2 · ') + d.toFixed(1) + ' M' + (streak >= 2 ? ' · SERIA ' + streak : '');
      return; }
    ui.classList.remove('on'); charge = null; if (armMode === 'throw' && ctx.view === 'first') poseArms(ctx.cam, dt, new V3(), 0); else if (armMode === 'hold') { armMode = 'off'; arms.visible = false; }
    if (!ball.rest) { fly(ball, dt, e => event(ball, e)); if (ball.v.lengthSq() < .02 && Math.abs(ball.p.y - (ground(ball.p.x, ball.p.z) + BR - .045)) < .01) ball.rest = true; }
    // a miss that came down: the streak is gone (once the ball is down and still, or far)
    if (ball.thrown && !ball.thrown.scored && (ball.rest || ball.thrown.t > 3.5)) { ball.thrown = null; if (!ctx.ghostless) streak = 0; }
    if (ball.thrown) ball.thrown.t += dt;
    // too far: back on the court
    if (toCourt(ball.p).w > 18 || Math.abs(toCourt(ball.p).u) > 15) { ball.p.copy(W(1.5, 3)); ball.p.y = ground(ball.p.x, ball.p.z) + BR; ball.v.set(0, 0, 0); ball.rest = true; ball.m.position.copy(ball.p); }
    if (me && !pickT && Math.hypot(ball.p.x - me.x, ball.p.z - me.z) < .9 && ball.p.y < me.y + 1.6 && ball.v.length() < 6) pick(ctx);
    // in the challenge, missed or made, it comes back to his hands a moment after (the rebound, quickly)
    if (ch.on && me && !ball.held && ball.thrown == null && ch.backT > 0 && (ch.backT -= dt) <= 0) pick(ctx); }
  function pick(ctx) { armK = 0; armMode = 'hold'; ball.held = true; ball.rest = false; ball.v.set(0, 0, 0); ball.thrown = null; if (ctx.view !== 'first') { ctx.toFirst(); switched = true; } audio.play('pick', { vol: .5 }); if (!shots) game.flash('Masz piłkę! Celuj myszką, LPM: trzymaj i puść, PPM: odłóż'); }
  function drop(silent) { if (!ball.held) return; ball.held = false; ball.rest = false; ball.v.set(0, 0, 0); pickT = 1; if (switched) { switched = false; lastCtx?.toThird(); } ui.classList.remove('on'); if (!silent) audio.play('kick', { vol: .2 }); }
  let lastCtx = null;
  function throwIt(from, dir, p) { armMode = 'throw'; armT = 0; const sp = VMIN + p * (VMAX - VMIN), c = toCourt(from); ball.held = false; ball.rest = false; ball.p.copy(from); ball.v.copy(dir).multiplyScalar(sp); pickT = .7; shots++;
    const cm = toCourt(lastCtx?.me || from); ball.thrown = { t: 0, scored: false, three: isThree(cm.u, cm.w), cu: cm.u, cw: cm.w };   // (where his feet are decides two or three)
    audio.play('throw', { vol: .6 }); game.send?.({ k: 'ball', p: [from.x, from.y, from.z].map(n => +n.toFixed(3)), v: [ball.v.x, ball.v.y, ball.v.z].map(n => +n.toFixed(3)) });
    if (ch.on) { ch.backT = 1.1; ch.k = (ch.k + 1 + (Math.random() * (SPOTS.length - 1) | 0)) % SPOTS.length; setSpot(ch.k); } }
  function ghostThrow(m) { const g = { m: ballMesh(), p: new V3(...m.p), v: new V3(...m.v), t: 0, hint: home.iJ, ghost: true, thrown: { scored: false } }; ghosts.push(g); }
  // ---------- the challenge ----------
  const ch = { on: false, t: 0, pts: 0, s0: 0, k: 0, backT: 0 };
  const challenge = { start() { Object.assign(ch, { on: true, t: 60, pts: 0, s0: score, k: 0, backT: .2 }); streak = 0; setSpot(0); ball.thrown = null; }, stop() { ch.on = false; setSpot(null); }, update(dt) { if (ch.on) ch.t -= dt; },
    get t() { return ch.t; }, get pts() { return score - ch.s0; }, get on() { return ch.on; } };
  const api = { at: W, update: (dt, ctx) => { lastCtx = ctx; update(dt, ctx); }, drop, ghostThrow, challenge, spotAt: k => W(SPOTS[k][0], SPOTS[k][1]), start: W(0, 5.6), facing: Math.atan2(-ez.x, -ez.z), onCourt,
    get holding() { return ball.held; }, get score() { return score; }, get streak() { return streak; }, get made() { return made; }, get shots() { return shots; }, ball, rim: rimW, hoop: hoopG };
  return api;
}
