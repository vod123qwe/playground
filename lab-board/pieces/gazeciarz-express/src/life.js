// Life at a middle distance, so the world is seen to go on out there: the country road along the fields (84-88 m out, the outside
// of the loop) with cars both ways and a tractor with dust behind it, and flocks of birds wheeling over the land near him.
// createLife({ THREE, scene, track, cars, toon }) → { update(dt, at: Vector3 (the camera)) }
export function createLife({ THREE, scene, track, cars, toon }) {
  const { S, N, ds, len } = track, D = track.farRoad, sgn = Math.sign(D), G = new THREE.Group(); scene.add(G);
  const wrap = s => ((s % len) + len) % len, rnd = Math.random;
  // ---------- on the country road ----------
  const movers = [];
  for (let k = 0; k < 8; k++) { const c = cars.random(rnd); G.add(c.group); movers.push({ o: c.group, car: c, s: k / 8 * len + rnd() * 20, dir: k % 2 ? 1 : -1, v: 8 + rnd() * 6, lane: 1.1 }); }
  { // a tractor: a green body, a cab, big wheels behind, small in front; slow, a little dust after it
    const tr = new THREE.Group(), green = toon('#467537'), dark = toon('#1d1e21'), glass = toon('#6c8796'), rim = toon('#efc970');
    const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; tr.add(o); return o; };
    box(1.1, .8, 2.4, green, 0, 1.05, .3); box(1.2, 1.1, 1.1, glass, 0, 2.0, -.35); box(1.3, .1, 1.3, green, 0, 2.6, -.35); box(.12, .7, .12, dark, .35, 1.8, 1.2);
    const wheels = [];
    for (const [x, z, r, w] of [[.78, -.55, .72, .45], [-.78, -.55, .72, .45], [.6, 1.2, .42, .3], [-.6, 1.2, .42, .3]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), dark); wh.rotation.z = Math.PI / 2; wh.position.set(x, r, z);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .45, r * .45, w + .02, 8), rim); hub.rotation.z = Math.PI / 2; hub.position.copy(wh.position); tr.add(wh, hub); wheels.push(wh); }
    G.add(tr); movers.push({ o: tr, s: len * .31, dir: 1, v: 3.1, lane: 1.1, tractor: true, wheels });
  }
  // the dust: a few pale puffs rising and spreading behind the tractor
  const dustM = new THREE.MeshBasicMaterial({ color: '#d8c9a0', transparent: true, opacity: .5, depthWrite: false }), dust = [];
  for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 0), dustM.clone()); m.visible = false; G.add(m); dust.push({ m, t: 9 }); }
  let dustAt = 0;
  function place(m, dt) {
    m.s = wrap(m.s + m.dir * m.v * dt); const f = m.s / ds, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f), P0 = S[i0], P1 = S[i1], d = D + m.dir * m.lane;
    const x = P0.p.x + (P1.p.x - P0.p.x) * t + P0.r.x * d, z = P0.p.z + (P1.p.z - P0.p.z) * t + P0.r.z * d;
    m.o.position.set(x, track.probe(x, z, i0).y, z); m.o.rotation.y = Math.atan2(P0.f.x, P0.f.z) + (m.dir < 0 ? Math.PI : 0);
  }
  // ---------- birds: flocks wheeling round a point near him, over the land on the outside of the loop ----------
  const birdM = toon('#2b2622', { side: THREE.DoubleSide }), flocks = [];
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .12, 0, 0, -.12, .75, 0, 0], 3)); wingG.computeVertexNormals();
  for (let k = 0; k < 4; k++) { const F = { birds: [], c: new THREE.Vector3(), R: 14 + rnd() * 14, a: rnd() * 6.28, w: (.35 + rnd() * .3) * (rnd() < .5 ? 1 : -1), h: 16 + rnd() * 16, set: false, life: 0 };
    for (let n = 0; n < 6 + (rnd() * 8 | 0); n++) { const b = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(.14, .12, .5), birdM); b.add(body);
      const L = new THREE.Mesh(wingG, birdM), R = new THREE.Mesh(wingG, birdM); R.scale.x = -1; b.add(L, R); b.scale.setScalar(1.6); G.add(b);
      F.birds.push({ o: b, L, R, off: new THREE.Vector3((rnd() - .5) * 9, (rnd() - .5) * 3, (rnd() - .5) * 9), ph: rnd() * 6.28, glide: 0 }); }
    flocks.push(F); }
  const _v = new THREE.Vector3();
  function seat(F, at) {                                                // (a new place for a flock: ahead of him, out over the fields)
    const q = track.probe(at.x, at.z, -1), i = (q.i + Math.round((30 + rnd() * 140) / ds * (rnd() < .8 ? 1 : -1)) + N) % N, s = S[i], d = sgn * (35 + rnd() * 80);
    F.c.set(s.p.x + s.r.x * d, s.p.y + F.h, s.p.z + s.r.z * d); F.set = true; F.life = 25 + rnd() * 30; }
  let T = 0;
  function update(dt, at) {
    T += dt;
    for (const m of movers) { const near = m.o.position.distanceToSquared(at) < 320 * 320; m.o.visible = near; place(m, dt); if (m.car) cars.spin(m.car, m.v * dt); if (m.wheels) for (const w of m.wheels) w.rotation.x += m.v * dt / .6; }
    const trc = movers.find(m => m.tractor);
    if (trc && trc.o.visible && (dustAt -= dt) <= 0) { dustAt = .28; const d0 = dust.find(p => p.t > 1.8); if (d0) { d0.t = 0; d0.m.visible = true; d0.m.position.copy(trc.o.position).add(_v.set(Math.sin(trc.o.rotation.y), 0, Math.cos(trc.o.rotation.y)).multiplyScalar(-1.8)).add(_v.set(0, .5, 0)); } }
    for (const p of dust) { if (p.t > 1.8) continue; p.t += dt; p.m.position.y += dt * .6; p.m.scale.setScalar(.6 + p.t * 1.3); p.m.material.opacity = .45 * (1 - p.t / 1.8); if (p.t > 1.8) p.m.visible = false; }
    for (const F of flocks) {
      F.life -= dt; if (!F.set || F.life <= 0 || F.c.distanceTo(at) > 260) seat(F, at);
      F.a += F.w * dt * .5; const cx = F.c.x + Math.cos(F.a) * F.R, cz = F.c.z + Math.sin(F.a) * F.R, cy = F.c.y + Math.sin(T * .4 + F.R) * 2, head = F.a + (F.w > 0 ? Math.PI / 2 : -Math.PI / 2);
      for (const b of F.birds) { const ox = b.off.x + Math.sin(T * .7 + b.ph) * 1.2, oz = b.off.z + Math.cos(T * .6 + b.ph) * 1.2;
        b.o.position.set(cx + ox, cy + b.off.y + Math.sin(T * 1.3 + b.ph) * .6, cz + oz); b.o.rotation.set(0, -head + Math.PI / 2, Math.sin(F.a * 2) * .2 * Math.sign(F.w));
        b.glide -= dt; if (b.glide < -2.5 + Math.sin(b.ph) && rnd() < dt * .6) b.glide = .8 + rnd();     // (now and then a glide)
        const flap = b.glide > 0 ? .15 : Math.sin(T * 11 + b.ph) * .75; b.L.rotation.z = flap; b.R.rotation.z = -flap; } }
  }
  return { update };
}
