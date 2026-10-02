// The Classic's street (docs/klasyk.md): what moves on it besides the traffic.
//   cars backing out of the drives on the houses' side (their reversing lights come on first: the sign), out to the edge of the road, a
//     wait, then back in; ridden into: he is down; a paper on the windscreen: the driver stops and says sorry
//   sprinklers on the lawns: a jet sweeping over the pavement and the edge of the road; in it, the wheels slip; a paper into one: it turns
//     the other way
//   the dustcart: slow up the road, a stop every few houses, two bin men across the road with the bins and back; the cart itself: he is
//     down; a bin man: a bump; a paper to one: caught
// createClassic({ THREE, toon, track, scene, cars }) → the locals' shape: { id, people, lights, update(dt, R) → events, kick, talk, paper }
//   events: { kind: 'shout' | 'driveway' | 'wet' | 'truck' | 'bump' | 'honk', p?, text? }

export function createClassic({ THREE, toon, track, scene, cars }) {
  let a = 1709; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, L = N * ds, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c), hs = track.oneSide || -1;
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return V(A.p.x + A.r.x * d, 0, A.p.z + A.r.z * d); };
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  const people = [], lights = [], events = [];
  const SORRY = deck(['OJ, NIE WIDZIAŁEM CIĘ!', 'PRZEPRASZAM, SPIESZĘ SIĘ DO PRACY!', 'GAZETA NA SZYBIE? NO DOBRA, ZASŁUŻYŁEM.', 'LUSTERKA MAM, TYLKO NIE PATRZĘ.']);
  const BINMEN = deck(['UWAGA, KUBEŁ JEDZIE!', 'Z DROGI, MŁODY, ŚMIECI CZEKAJĄ!', 'TY ROZNOSISZ, MY ZBIERAMY. KOŁO ŻYCIA.', 'RZUĆ GAZETĘ, PRZECZYTAM W KABINIE!']);
  const BINPAPER = deck(['DZIĘKI! NA DRUGIE ŚNIADANIE JAK ZNALAZŁ.', 'O, PROGNOZA POGODY. BĘDZIE ŚMIERDZIAŁO.', 'ZŁAPANE! LEPIEJ NIŻ KUBEŁ.']);
  const pv = (i, d) => { const p = at(i, d); p.y = gy(p.x, p.z, i); return p; };

  // ---------- cars on the drives (the houses' side), nose to the house, backing out when he comes ----------
  const backers = [];
  if (cars) { const doors = track.doors.slice().sort((x, y) => x.i - y.i); let last = -1e9;
    for (const d of doors) { if ((d.i - last) * ds < 40 || rnd() < .25) continue; last = d.i; const i = wrap(d.i + Math.round(5 / ds)), A = S[i], c = cars.random(rnd);
      const g = c.group, d0 = hs * (track.PAVE + 4.2), yawIn = Math.atan2(A.r.x * hs, A.r.z * hs); g.userData.keep = true; scene.add(g);
      const lamps = []; for (const x of [-.55, .55]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.22, .14, .05), new THREE.MeshBasicMaterial({ color: '#f6f3ea' })); l.position.set(x, .75, -(c.half[1] + .02)); l.visible = false; g.add(l); lamps.push(l); }
      backers.push({ g, c, i, d: d0, d0, d1: hs * 2.2, yawIn, lamps, st: 'in', t: 0, hitT: 0, sorry: 0 }); } }

  // ---------- sprinklers on the lawns: a jet of water sweeping to and fro over the pavement ----------
  const sprinklers = [], waterM = new THREE.MeshBasicMaterial({ color: '#cfe8f5', transparent: true, opacity: .55, depthWrite: false });
  for (const d of track.doors.filter((_, k) => k % 3 === 1)) { const i = wrap(d.i - Math.round(4 / ds)), p = pv(i, hs * (track.PAVE + 1.2)), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .18, 8), M('#3a3d42'))); g.children[0].position.y = .09; const jet = new THREE.Group(); jet.position.y = .2; g.add(jet);
    for (let k = 0; k < 9; k++) { const dr = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .5), waterM); const u = k / 8; dr.position.set(0, Math.sin(u * Math.PI) * 1.3, u * 4.2); dr.rotation.x = -Math.cos(u * Math.PI) * .7; jet.add(dr); }
    g.position.copy(p); scene.add(g); const A = S[i]; sprinklers.push({ g, jet, i, p, base: Math.atan2(A.r.x * -hs, A.r.z * -hs), sw: 0, dir: 1, wetT: 0, flipT: 0 }); }

  // ---------- the dustcart and its two bin men ----------
  let cart = null;
  { const g = new THREE.Group(), green = M('#3f7a4a'), dark = M('#2a2c30'), bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    bx(2.3, 1.7, 2, M('#e8e4dc'), 0, 1.65, 2.6); bx(2.2, .8, .06, M('#3f5566'), 0, 2.05, 3.62); bx(2.4, 2.6, 5, green, 0, 2.1, -1.2); bx(2.42, .3, 5.02, M('#efc930'), 0, 1.2, -1.2); bx(2.2, 1.2, .6, dark, 0, 1.4, -3.9);
    for (const x of [-1.1, 1.1]) for (const z of [2.4, -.4, -2.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .35, 12).rotateZ(Math.PI / 2), dark); w.position.set(x, .5, z); g.add(w); }
    const beacon = bx(.25, .18, .25, new THREE.MeshBasicMaterial({ color: '#ffb020' }), 0, 2.6, 3.2); scene.add(g);
    const man = () => { const m = new THREE.Group(), vest = M('#e8742e'), b = new THREE.Mesh(new THREE.BoxGeometry(.44, .62, .28), vest); b.position.y = 1.12; m.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), M('#d9a07a')); h.position.y = 1.6; m.add(h);
      const legs = [-1, 1].map(sd => { const l = new THREE.Group(), lm = new THREE.Mesh(new THREE.BoxGeometry(.14, .78, .16), M('#3b4a5e')); lm.position.y = -.39; l.add(lm); l.position.set(sd * .1, .8, 0); m.add(l); return l; });
      const bin = new THREE.Mesh(new THREE.BoxGeometry(.6, .9, .6), M('#5a6b4a')); bin.position.set(0, .45, .55); bin.visible = false; m.add(bin); scene.add(m); return { g: m, legs, bin, d: 0, ph: 0, sayT: 0, hitT: 0, paperT: 0 }; };
    const men = [man(), man()]; for (const m of men) people.push({ g: m.g, x: 0, z: 0, kind: 'binman', P: null, m });
    const P0 = { s: L * .3, d: 1.6, len: 7 }; track.parked.push(P0);   // (in the lane of the way it drives)
    cart = { g, beacon, men, s: L * .3, v: 0, stop: 0, go: 30, P0, hitT: 0, sayT: 0 }; }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0);
    // (the drives: lights on as he comes (25 m off, the way he rides), out it backs, a wait at the road's edge, back in)
    for (const K of backers) { const A = S[K.i], ahead = ((((K.i * ds - (R.s ?? 0)) * (R.along || 1)) % L) + L * 1.5) % L - L / 2;
      if (K.st === 'in' && ahead > 6 && ahead < 26 && Math.abs(R.v) > 1) { K.st = 'lights'; K.t = 0; }
      K.t += dt; if (K.st === 'lights' && K.t > .9) { K.st = 'out'; K.t = 0; } if (K.st === 'out') { K.d += (K.d1 - K.d) > 0 ? Math.min(K.d1 - K.d, 2.2 * dt) : Math.max(K.d1 - K.d, -2.2 * dt); if (Math.abs(K.d - K.d1) < .02) { K.st = 'wait'; K.t = 0; } }
      if (K.st === 'wait' && K.t > 2.6) { K.st = 'back'; K.t = 0; } if (K.st === 'back') { K.d += (K.d0 - K.d) > 0 ? Math.min(K.d0 - K.d, 1.6 * dt) : Math.max(K.d0 - K.d, -1.6 * dt); if (Math.abs(K.d - K.d0) < .02) { K.st = 'rest'; K.t = 0; } }
      if (K.st === 'rest' && K.t > 18 && Math.abs(ahead) > 60) K.st = 'in';
      for (const l of K.lamps) l.visible = K.st === 'lights' || K.st === 'out';
      const p = pv(K.i, K.d); K.g.position.copy(p); K.g.rotation.y = K.yawIn; K.hitT = Math.max(0, K.hitT - dt);
      const dx = R.x - p.x, dz = R.z - p.z, lz = dx * Math.sin(K.yawIn) + dz * Math.cos(K.yawIn), lx = dx * Math.cos(K.yawIn) - dz * Math.sin(K.yawIn);
      if (!R.foot && !K.hitT && !(R.air && R.h > 1.3) && Math.abs(lx) < K.c.half[0] + .3 && Math.abs(lz) < K.c.half[1] + .3 && (K.st === 'out' || K.st === 'back')) { K.hitT = 3; ev.push({ kind: 'driveway' }); } }
    // (the sprinklers: sweeping; in the jet, the wheels slip)
    for (const W of sprinklers) { W.flipT = Math.max(0, W.flipT - dt); W.sw += W.dir * dt * .9; if (Math.abs(W.sw) > 1.1) { W.sw = Math.sign(W.sw) * 1.1; W.dir *= -1; } W.jet.rotation.y = W.base + W.sw;
      W.wetT = Math.max(0, W.wetT - dt); const dx = R.x - W.p.x, dz = R.z - W.p.z, dist = Math.hypot(dx, dz); if (dist < 4.6 && dist > .4 && !R.foot && !R.air && !W.wetT) { const ang = Math.atan2(dx, dz), da = Math.atan2(Math.sin(ang - W.base - W.sw), Math.cos(ang - W.base - W.sw)); if (Math.abs(da) < .35) { W.wetT = 2; ev.push({ kind: 'wet' }); } } }
    // (the dustcart: up the road in its lane slowly, a stop every 35-50 m: the men out across the road to the bins and back)
    if (cart) { const C = cart; C.hitT = Math.max(0, C.hitT - dt); C.sayT -= dt;
      if (C.stop > 0) { C.stop -= dt; C.v = 0; } else { C.v += (3 - C.v) * Math.min(1, dt * 1.5); C.go -= C.v * dt; if (C.go <= 0) { C.stop = 7; C.go = 35 + rnd() * 15; } }
      C.s = ((C.s + C.v * dt) % L + L) % L; C.P0.s = C.s; const i = wrap(Math.round(C.s / ds)), A = S[i], d = 1.6, x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d, yaw = Math.atan2(A.f.x, A.f.z);
      C.g.position.set(x, gy(x, z, i), z); C.g.rotation.y = yaw; C.beacon.visible = (clock * 3 | 0) % 2 === 0;
      const ph = C.stop > 0 ? 1 - Math.abs((7 - C.stop) / 3.5 - 1) : 0;   // (0 by the cart, 1 at the bins, back to 0)
      C.men.forEach((m, k) => { const dm = d + (hs * (track.ROAD + 2.4) - d) * Math.max(0, Math.min(1, ph * 1.15)), off = k ? -2.4 : -3.6, mi = wrap(i + Math.round(off / ds)), B0 = S[mi];
        const mx = B0.p.x + B0.r.x * (C.stop > 0 ? dm : d + Math.sign(-hs) * 1.4), mz = B0.p.z + B0.r.z * (C.stop > 0 ? dm : d + Math.sign(-hs) * 1.4); m.g.position.set(mx, gy(mx, mz, mi) + (C.stop > 0 ? 0 : 1.3), mz);
        const moving = C.stop > 0 && ph > .02 && ph < .98; m.ph += dt * (moving ? 9 : 0); m.legs[0].rotation.x = Math.sin(m.ph) * .5; m.legs[1].rotation.x = -Math.sin(m.ph) * .5; m.bin.visible = C.stop > 0 && C.stop < 3.5;
        m.g.rotation.y = Math.atan2(B0.r.x * (ph < .5 && C.stop > 3.5 ? hs : -hs), B0.r.z * (ph < .5 && C.stop > 3.5 ? hs : -hs)) * (C.stop > 0 ? 1 : 0) + (C.stop > 0 ? 0 : yaw);
        const pp = people.find(q => q.m === m); pp.x = mx; pp.z = mz; m.hitT = Math.max(0, m.hitT - dt); m.paperT = Math.max(0, m.paperT - dt);
        if (C.stop > 0 && !R.foot && !R.air && !m.hitT && Math.hypot(R.x - mx, R.z - mz) < .6 && Math.abs(R.v) > 2) { m.hitT = 3; ev.push({ kind: 'bump', p: { g: m.g } }); } });
      const dx = R.x - x, dz = R.z - z, lz = dx * Math.sin(yaw) + dz * Math.cos(yaw), lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      if (C.sayT <= 0 && Math.hypot(dx, dz) < 18) { C.sayT = 12; ev.push({ kind: 'shout', p: { g: C.men[0].g }, text: BINMEN() }); }
      if (!R.foot && !C.hitT && !(R.air && R.h > 3.2) && Math.abs(lx) < 1.35 && lz > -4.3 && lz < 3.8) { C.hitT = 3; ev.push({ kind: 'truck' }); } }
    return ev; }
  function kick(p) { return 'EJ! ŚMIECIARZA SIĘ NIE KOPIE!'; }
  function talk(p) { return BINMEN(); }
  // (a paper: to a bin man, caught; onto a windscreen backing out, the driver stops; into a sprinkler, it turns the other way)
  function paper(Pp) {
    for (const p of people) { if (p.m.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.m.paperT = 30; return { p, text: BINPAPER(), who: 'binman', pts: 2, label: 'DLA ŚMIECIARZA! +2' }; }
    for (const K of backers) { if (!(K.st === 'out' || K.st === 'lights' || K.st === 'wait') || Math.hypot(K.g.position.x - Pp.x, K.g.position.z - Pp.z) > 1.8) continue; K.st = 'wait'; K.t = 0; return { p: { g: K.g }, text: SORRY(), who: 'driver', pts: 2, label: 'NA SZYBĘ! +2' }; }
    for (const W of sprinklers) { if (W.flipT || Math.hypot(W.p.x - Pp.x, W.p.z - Pp.z) > 1) continue; W.flipT = 2; W.dir *= -1; return { p: { g: W.g }, text: 'PSSST!', who: 'sprinkler', pts: 1, label: 'ZRASZACZ! +1' }; }
    return null; }
  return { id: 'classic', people, lights, update, kick, talk, paper, backers, sprinklers, cart };
}
