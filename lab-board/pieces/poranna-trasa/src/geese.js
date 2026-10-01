// The village's geese: flocks on the verges by the road (a few places round the loop), grazing, heads down; when a bike comes near,
// one by one they cross the road, slow, in a line, and back again later. Ride into one fast: a fall (and a goose in the air, wings out);
// slowly: it hisses, and you are held back. White bodies, orange beaks and feet, the neck up when they walk, down when they graze.
// createGeese({ THREE, scene, track, toon, rnd }) → { update(dt, me) → null | { hit: 'fall' | 'hiss', at }, list }
//   me: { x, z, v (m/s), yaw, onFoot }

export function createGeese({ THREE, scene, track, toon, rnd = Math.random }) {
  const { S, N, ds } = track, white = toon('#f2f0ea'), grey = toon('#c9c6bb'), orange = toon('#e3902a'), dark = toon('#1d1e21'), list = [];
  const at = (i, d) => { const ii = Math.round(i), s = S[((ii % N) + N) % N], x = s.p.x + s.r.x * d, z = s.p.z + s.r.z * d; return new THREE.Vector3(x, track.probe(x, z, ii).y, z); };
  function goose() { const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 7), white); body.scale.set(1, .8, 1.5); body.position.y = .3; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.1, .2, 6).rotateX(-Math.PI / 2), grey); tail.position.set(0, .36, -.34); g.add(tail);
    const neck = new THREE.Group(); neck.position.set(0, .38, .22); g.add(neck); const n = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .38, 6), white); n.position.y = .19; neck.add(n);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), white); head.position.set(0, .4, .03); neck.add(head); const beak = new THREE.Mesh(new THREE.ConeGeometry(.03, .12, 5).rotateX(Math.PI / 2), orange); beak.position.set(0, .39, .12); neck.add(beak);
    for (const x of [-.04, .04]) { const e = new THREE.Mesh(new THREE.BoxGeometry(.015, .015, .015), dark); e.position.set(x * 1.3, .42, .07); neck.add(e); }
    const wings = [-1, 1].map(sd => { const w = new THREE.Mesh(new THREE.BoxGeometry(.04, .14, .36), grey); w.position.set(sd * .2, .34, -.02); g.add(w); return w; });
    const feet = [-1, 1].map(sd => { const f = new THREE.Mesh(new THREE.BoxGeometry(.05, .14, .05), orange); f.position.set(sd * .07, .07, .02); g.add(f); return f; });
    g.scale.setScalar(1.35); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g); return { g, neck, wings, feet }; }
  // the flocks: on a verge each, by a farm's stretch; how many, where
  for (let k = 0; k < 4; k++) { const i0 = Math.round((k + .25 + rnd() * .5) / 4 * N), sd = rnd() < .5 ? -1 : 1, n = 4 + (rnd() * 4 | 0);
    for (let m = 0; m < n; m++) { const G = goose(), home = { i: i0 + Math.round((rnd() - .5) * 10 / ds), d: sd * (track.KERB + 1.2 + rnd() * 2.2) };
      list.push({ ...G, home, i: home.i, d: home.d, to: null, state: 'graze', t: rnd() * 6, yaw: rnd() * 6, fly: null, cool: 0, flock: k, delay: m * .7 }); } }
  for (const q of list) place(q);
  function place(q) { const p = at(q.i, q.d); q.g.position.copy(p); if (q.fly) q.g.position.y += q.fly.y; q.g.rotation.y = q.yaw; }
  function update(dt, me) { let out = null;
    for (const q of list) { q.t += dt; q.cool -= dt;
      if (q.fly) { q.fly.t += dt; q.fly.y = Math.max(0, Math.sin(Math.min(1, q.fly.t / 1.2) * Math.PI) * 2.2); q.d += q.fly.vd * dt; q.i += q.fly.vi * dt / ds; for (const w of q.wings) w.rotation.z = Math.sin(q.t * 30) * .9 * Math.sign(w.position.x); if (q.fly.t > 1.2) { q.fly = null; q.state = 'graze'; for (const w of q.wings) w.rotation.z = 0; } place(q); continue; }
      const p = q.g.position, dist = Math.hypot(me.x - p.x, me.z - p.z);
      // a bike coming: the flock sets off across, one after another
      if (q.state === 'graze' && dist < 22 && q.cool <= 0 && !me.onFoot) { q.state = 'wait'; q.t = -q.delay; }
      if (q.state === 'wait' && q.t > 0) { q.state = 'cross'; q.to = { d: -Math.sign(q.d) * (track.KERB + 1.2 + rnd() * 2), i: q.i + (rnd() - .5) * 4 }; }
      if (q.state === 'cross') { const dd = q.to.d - q.d, di = q.to.i - q.i, l = Math.hypot(dd, di * ds); if (l < .1) { q.state = 'graze'; q.cool = 18 + rnd() * 20; q.home = { i: q.i, d: q.d }; }
        else { const sp = .55 * dt; q.d += dd / l * Math.min(l, sp); q.i += di / l * Math.min(l, sp) / ds; const s0 = S[((Math.round(q.i) % N) + N) % N]; q.yaw = Math.atan2(s0.r.x * Math.sign(dd) + s0.f.x * di * .1, s0.r.z * Math.sign(dd) + s0.f.z * di * .1); } }
      // the walk: the neck up, the feet stepping; grazing: the neck down now and then
      const walking = q.state === 'cross'; q.neck.rotation.x = walking ? -.15 : (Math.sin(q.t * .7 + q.flock) > .3 ? 1.1 : .2); q.feet[0].rotation.x = walking ? Math.sin(q.t * 9) * .6 : 0; q.feet[1].rotation.x = walking ? -Math.sin(q.t * 9) * .6 : 0;
      if (!walking && rnd() < dt * .2) q.yaw += (rnd() - .5) * 1.5; place(q);
      // ridden into
      if (!out && !me.onFoot && dist < .9) { if (Math.abs(me.v) > 3.2) { out = { hit: 'fall', at: p.clone() }; q.fly = { t: 0, y: 0, vd: (rnd() - .5) * 4, vi: Math.sign(me.v) * 3 }; } else if (q.cool <= 2) { out = { hit: 'hiss', at: p.clone() }; q.cool = 3; } } }
    return out; }
  return { update, list };
}
