// A level crossing over the village road: rails across it into the fields both ways, a St Andrew's cross and two red lamps each side,
// a striped barrier on each approach. Now and then (and always the first time you come near) the lamps start to blink and ding, the
// barriers come down, a short goods train goes through, the barriers go up. Go at the barrier when it is down: over the bars; be on the
// rails when the train is there: much worse. On foot you can duck under the barrier (the train is the same). Cars wait at it.
// createCrossing({ THREE, toon, track, at: index }) → { group, update(dt, me, cars) → null | { hit: 'barrier' | 'train', push } | { hit: 'warn' },
//   state, along(x, z), dispose() }
//   me: { x, z, v, yaw, onFoot }; cars: traffic.boxes()

export function createCrossing({ THREE, toon, track, at }) {
  const { S, N, ROAD } = track, i0 = ((at % N) + N) % N, s = S[i0], c = s.p.clone(), f = new THREE.Vector3(s.f.x, 0, s.f.z).normalize(), r = new THREE.Vector3(s.r.x, 0, s.r.z).normalize();
  const G = new THREE.Group(); G.userData.keep = true;
  const pt = (al, ac) => new THREE.Vector3(c.x + f.x * al + r.x * ac, 0, c.z + f.z * al + r.z * ac), yAt = (x, z) => track.probe(x, z, i0).y;
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), P3 = (o, x, y, z) => { o.position.set(x, y, z); return o; }, yawR = Math.atan2(r.x, r.z), yawF = Math.atan2(f.x, f.z);
  const sleeperM = toon('#5a4030'), railM = toon('#8a9094'), deckM = toon('#3a3d42'), postM = toon('#e9e6df'), redM = toon('#c23a2e'), dark = toon('#1d1e21');
  const LEN = 34;
  // the rails and the sleepers, laid on the ground as it goes (into the fields); a dark deck where they cross the road
  for (let ac = -LEN; ac < LEN; ac += 1.1) { const p = pt(0, ac), y = yAt(p.x, p.z), sl = box(2.4, .1, .24, sleeperM); sl.position.set(p.x, y + .04, p.z); sl.rotation.y = yawR; G.add(sl); }
  for (const sd of [-.72, .72]) for (let ac = -LEN; ac < LEN; ac += 2) { const a = pt(sd, ac), b = pt(sd, ac + 2), ya = yAt(a.x, a.z), yb = yAt(b.x, b.z), m = a.clone().lerp(b, .5), rl = box(.09, .1, 2.04, railM);
    rl.position.set(m.x, (ya + yb) / 2 + .13, m.z); rl.rotation.y = yawR; rl.rotation.x = -Math.atan2(yb - ya, 2); G.add(rl); }
  { const d = box(2.6, .06, ROAD * 2 + .6, deckM), p = pt(0, 0); d.position.set(p.x, yAt(p.x, p.z) + .05, p.z); d.rotation.y = yawF + Math.PI / 2; G.add(d); }
  // a canvas texture: red and white stripes (the barrier), the cross's boards
  const stripes = (() => { const cv = document.createElement('canvas'); cv.width = 16; cv.height = 2; const g = cv.getContext('2d'); for (let x = 0; x < 16; x++) { g.fillStyle = (x >> 1) % 2 ? '#f4f1e8' : '#c23a2e'; g.fillRect(x, 0, 1, 2); }
    const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; })(), barM = new THREE.MeshBasicMaterial({ map: stripes });
  const lampOff = new THREE.MeshBasicMaterial({ color: '#3a1512' }), lampOn = new THREE.MeshBasicMaterial({ color: '#ff4a30' }), lamps = [], bars = [];
  // each approach (al = -1: from the start's side, +1: the other): a post on the right with the cross and the lamps, the barrier's arm
  for (const sg of [-1, 1]) { const ac = -sg * (ROAD + .9), p = pt(sg * 4.2, ac), y = yAt(p.x, p.z), post = new THREE.Group(); post.position.set(p.x, y, p.z); post.rotation.y = yawF + (sg > 0 ? Math.PI : 0); G.add(post);
    post.add(P3(box(.12, 2.6, .12, postM), 0, 1.3, 0));
    for (const k of [-1, 1]) { const b = box(1.1, .16, .04, barM); b.position.set(0, 2.4, -.08); b.rotation.z = k * .6; post.add(b); }
    const hood = box(.62, .28, .1, dark); hood.position.set(0, 1.85, -.08); post.add(hood);
    for (const k of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(.09, 10), lampOff); l.position.set(k * .17, 1.85, -.14); l.rotation.y = Math.PI; post.add(l); lamps.push({ l, k }); }
    // the barrier: a pivot on its own short post, the arm across the whole road; up: standing (85°), down: flat
    const q = pt(sg * 3.4, ac), pv = new THREE.Group(); pv.position.set(q.x, yAt(q.x, q.z) + 1, q.z); pv.rotation.y = yawR + (ac > 0 ? Math.PI : 0); G.add(pv);
    const foot = box(.3, 1, .3, dark); foot.position.set(q.x, yAt(q.x, q.z) + .5, q.z); G.add(foot);
    const arm = new THREE.Group(); pv.add(arm); const L = ROAD * 2 + .6, a = box(.08, .12, L, barM); a.position.z = L / 2; arm.add(a); const tip = box(.1, .5, .06, dark); tip.position.set(0, -.25, L - .1); arm.add(tip);
    bars.push({ arm, al: sg * 3.4 }); }
  // the train: an engine and three goods wagons, along the rails; where it is: its middle's distance across (ac), from far one side to far the other
  const T = new THREE.Group(); G.add(T); const cars = []; { const eng = toon('#3f6b35'), wag = [toon('#6b4a2e'), toon('#44484c'), toon('#8e3b2c')], yel = toon('#e3c77e'), win = toon('#3f5566');
    let off = 0; for (let k = 0; k < 4; k++) { const Lc = k ? 9 : 11, g = new THREE.Group(), m = k ? wag[(k - 1) % 3] : eng; g.add(P3(box(2.7, 2.6, Lc, m), 0, 1.9, 0));
      g.add(P3(box(2.2, .6, Lc - 1, dark), 0, .45, 0)); if (!k) { g.add(P3(box(2.72, .4, .06, yel), 0, 1.4, Lc / 2 + .01)); g.add(P3(box(2, .7, .06, win), 0, 2.6, Lc / 2 + .02)); }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; }); T.add(g); cars.push({ g, L: Lc, off }); off += Lc + .8; } }
  const TLEN = cars.reduce((a, q) => a + q.L + .8, 0), V = 13;
  T.visible = false;
  const st = { mode: 'idle', t: 0, cool: 0, down: 0, first: true, x: -999, dir: 1, blink: 0 };
  const along = (x, z) => (x - c.x) * f.x + (z - c.z) * f.z, across = (x, z) => (x - c.x) * r.x + (z - c.z) * r.z;
  function placeTrain() { for (const q of cars) { const ac = st.x - st.dir * q.off, p = pt(0, ac); q.g.position.set(p.x, yAt(p.x, p.z) + .1, p.z); q.g.rotation.y = yawR + (st.dir < 0 ? Math.PI : 0); } }
  function update(dt, me, traffic) { let out = null; st.t += dt; st.cool -= dt;
    const al = along(me.x, me.z), ac = across(me.x, me.z), dist = Math.hypot(al, ac);
    // the cycle: idle → warn (lamps, ding) → down (the arms come down) → train → up
    if (st.mode === 'idle' && st.cool <= 0 && Math.abs(ac) < 12 && Math.abs(al) < (st.first ? 55 : 70) && (st.first || Math.random() < dt * .22)) { st.mode = 'warn'; st.t = 0; st.first = false; st.dir = Math.random() < .5 ? 1 : -1; out = { hit: 'warn' }; }
    if (st.mode === 'warn' && st.t > 1.4) { st.mode = 'down'; st.t = 0; }
    if (st.mode === 'down') { st.down = Math.min(1, st.down + dt / 1.6); if (st.t > 1.8) { st.mode = 'train'; st.t = 0; st.x = -st.dir * (LEN + 6); T.visible = true; } }
    if (st.mode === 'train') { st.x += st.dir * V * dt; placeTrain(); if (st.dir * st.x > LEN + TLEN + 4) { st.mode = 'up'; st.t = 0; T.visible = false; } }
    if (st.mode === 'up') { st.down = Math.max(0, st.down - dt / 1.6); if (st.down <= 0) { st.mode = 'idle'; st.cool = 22 + Math.random() * 14; } }
    const on = st.mode !== 'idle' && st.mode !== 'up' || (st.mode === 'up' && st.down > .3); st.blink = on ? (Math.floor(st.t * 2.4) % 2) : -1;
    for (const L of lamps) L.l.material = st.blink < 0 ? lampOff : ((st.blink === 0) === (L.k < 0) ? lampOn : lampOff);
    for (const b of bars) b.arm.rotation.x = -(1 - THREE.MathUtils.smoothstep(st.down, 0, 1)) * 1.48;
    // the train on the rails, the player there: the worst; the barrier down in his way at speed: over it he goes
    if (st.mode === 'train' && Math.abs(al) < 1.7) { const lo = Math.min(st.x, st.x - st.dir * TLEN), hi = Math.max(st.x, st.x - st.dir * TLEN); if (ac > lo - 1.4 && ac < hi + 1.4) out = { hit: 'train', push: r.clone().multiplyScalar(st.dir * 9) }; }
    if (!out && !me.onFoot && st.down > .7 && Math.abs(ac) < ROAD + .4) for (const b of bars) if (Math.abs(al - b.al) < .45 && Math.sign(Math.sin(me.yaw) * f.x + Math.cos(me.yaw) * f.z) === -Math.sign(b.al)) { out = { hit: 'barrier', push: f.clone().multiplyScalar(-Math.sign(b.al) * 1.5) }; break; }
    // the cars wait at it (down, or about to be)
    if (traffic && st.mode !== 'idle') for (const q of traffic) { if (!q.t || q.t.stop === undefined) continue; const a2 = along(q.x, q.z); if (Math.abs(a2) < 14 && Math.abs(a2) > 3 && Math.abs(across(q.x, q.z)) < ROAD + 1) q.t.stop = Math.max(q.t.stop, .4); }
    return out; }
  return { group: G, center: c, update, state: st, along, get ringing() { return st.blink >= 0; } };
}
