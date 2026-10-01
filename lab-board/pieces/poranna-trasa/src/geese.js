// The village's geese: flocks on the verges by the road (a few places round the loop), grazing, heads down; when a bike comes near,
// one by one they cross the road, slow, in a line, and back again later. Ride into one fast: a fall (and a goose in the air, wings out);
// slowly: it hisses, and you are held back. White bodies, orange beaks and feet, the neck up when they walk, down when they graze.
// And they are there to be played with: kicked (from the bike or on foot) one flies off honking and the flock comes after you, necks
// out, wings up; on foot they peck, on a slow bike they hiss you to a crawl, a fast one leaves them behind. Spoken to (T): a goose
// stares, honks back, takes offence and comes for you, or takes a liking to you and waddles after you a while.
// createGeese({ THREE, scene, track, toon, rnd }) → { update(dt, me) → null | { hit: 'fall' | 'hiss' | 'peck' | 'calm', at }, kick(q, dx, dz),
//   strike(me, reach) → goose kicked or null, talk(me) → null | { q, how: 'stare' | 'honk' | 'angry' | 'friend' }, near(x, z, r), list }
//   me: { x, z, v (m/s), yaw, onFoot }

export function createGeese({ THREE, scene, track, toon, rnd = Math.random }) {
  const { S, N, ds } = track, white = toon('#f2f0ea'), grey = toon('#c9c6bb'), orange = toon('#e3902a'), dark = toon('#1d1e21'), list = [];
  const at = (i, d) => { const ii = Math.round(i), s = S[((ii % N) + N) % N], x = s.p.x + s.r.x * d, z = s.p.z + s.r.z * d; return new THREE.Vector3(x, track.probe(x, z, ((ii % N) + N) % N).y, z); };
  const wrap = di => { di %= N; if (di > N / 2) di -= N; if (di < -N / 2) di += N; return di; };
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
      list.push({ ...G, home, i: home.i, d: home.d, to: null, state: 'graze', t: rnd() * 6, yaw: rnd() * 6, fly: null, cool: 0, flock: k, delay: m * .7, mad: 0, pal: 0, peck: 0 }); } }
  for (const q of list) place(q);
  function place(q) { const p = at(q.i, q.d); q.g.position.copy(p); if (q.fly) q.g.position.y += q.fly.y; q.g.rotation.y = q.yaw; }
  // towards the player along the road's frame (i, d); faster when mad; the yaw to where it goes
  function toward(q, me, sp, dt, keep = 0) { const P = track.probe(me.x, me.z, ((Math.round(q.i) % N) + N) % N), di = wrap(P.i - q.i), dd = P.d - q.d, l = Math.hypot(dd, di * ds);
    if (l <= keep) return l; const s = Math.min(l - keep, sp * dt); q.d += dd / l * s; q.i += di / l * s / ds; q.d = Math.max(-(track.KERB + 4), Math.min(track.KERB + 4, q.d));
    const s0 = S[((Math.round(q.i) % N) + N) % N]; q.yaw = Math.atan2(s0.r.x * dd + s0.f.x * di * ds, s0.r.z * dd + s0.f.z * di * ds); return l; }
  // a kick: up it goes, away from the foot, honking; the flock is mad (each a while), the kicked one most
  function kick(q, dx, dz) { const s0 = S[((Math.round(q.i) % N) + N) % N], vd = (dx * s0.r.x + dz * s0.r.z) * 5, vi = (dx * s0.f.x + dz * s0.f.z) * 5;
    q.fly = { t: 0, y: 0, vd, vi }; q.state = 'graze'; q.pal = 0; for (const o of list) if (o.flock === q.flock && rnd() < (o === q ? 1 : .7)) { o.mad = o === q ? 9 : 6 + rnd() * 3; o.pal = 0; } }
  function near(x, z, r) { let best = null, bd = r; for (const q of list) { if (q.fly) continue; const p = q.g.position, d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = q; } } return best; }
  // a kick on foot: the goose in front within reach
  function strike(me, reach) { const fx = Math.sin(me.yaw), fz = Math.cos(me.yaw); let best = null, bd = reach;
    for (const q of list) { if (q.fly) continue; const p = q.g.position, ax = p.x - me.x, az = p.z - me.z, d = Math.hypot(ax, az); if (d < bd && (ax * fx + az * fz) > -.2) { bd = d; best = q; } }
    if (best) { const p = best.g.position, l = Math.hypot(p.x - me.x, p.z - me.z) || 1; kick(best, (p.x - me.x) / l, (p.z - me.z) / l); } return best; }
  // spoken to: what this goose makes of it (the kicked-before flock: more often cross)
  function talk(me) { const q = near(me.x, me.z, 2.6); if (!q) return null; const r = rnd(), how = q.mad > 0 ? 'angry' : r < .3 ? 'stare' : r < .6 ? 'honk' : r < .8 ? 'angry' : 'friend';
    q.yaw = Math.atan2(me.x - q.g.position.x, me.z - q.g.position.z); q.neck.rotation.x = -.3; if (how === 'angry') q.mad = 6; if (how === 'friend') { q.pal = 14; q.mad = 0; } return { q, how }; }
  function update(dt, me) { let out = null;
    for (const q of list) { q.t += dt; q.cool -= dt; q.peck -= dt; const wasMad = q.mad > 0; q.mad = Math.max(0, q.mad - dt); q.pal = Math.max(0, q.pal - dt);
      if (q.fly) { q.fly.t += dt; q.fly.y = Math.max(0, Math.sin(Math.min(1, q.fly.t / 1.2) * Math.PI) * 2.2); q.d += q.fly.vd * dt; q.i += q.fly.vi * dt / ds; q.d = Math.max(-(track.KERB + 5), Math.min(track.KERB + 5, q.d)); for (const w of q.wings) w.rotation.z = Math.sin(q.t * 30) * .9 * Math.sign(w.position.x); if (q.fly.t > 1.2) { q.fly = null; q.state = 'graze'; for (const w of q.wings) w.rotation.z = 0; } place(q); continue; }
      const p = q.g.position, dist = Math.hypot(me.x - p.x, me.z - p.z);
      // mad: after you, necks out, wings up and flapping; far enough (a fast bike): they give up, back to their grass
      if (q.mad > 0) { if (dist > 26) q.mad = 0; else { toward(q, me, me.onFoot ? 3.3 : 4.6, dt, .55); q.neck.rotation.x = .9; for (const w of q.wings) w.rotation.z = (.6 + Math.sin(q.t * 22) * .4) * Math.sign(w.position.x); q.feet[0].rotation.x = Math.sin(q.t * 16) * .7; q.feet[1].rotation.x = -q.feet[0].rotation.x; place(q);
        if (!out && dist < 1.1 && q.peck <= 0) { if (me.onFoot) { out = { hit: 'peck', at: p.clone() }; q.peck = 1.1; } else if (Math.abs(me.v) < 3.2) { out = { hit: 'hiss', at: p.clone() }; q.peck = 1.4; } } continue; } }
      if (wasMad && q.mad <= 0) { for (const w of q.wings) w.rotation.z = 0; q.home = { i: q.i, d: Math.sign(q.d || 1) * (track.KERB + 1.2 + rnd() * 2) }; q.state = 'cross'; q.to = { ...q.home }; q.cool = 25; if (!out) out = { hit: 'calm', at: p.clone() }; }
      // a friend: a pace behind you, waddling
      if (q.pal > 0) { const l = toward(q, me, me.onFoot ? 2.4 : 3.6, dt, 1.6); const walking = l > 1.6; q.neck.rotation.x = walking ? -.15 : .3; q.feet[0].rotation.x = walking ? Math.sin(q.t * 9) * .6 : 0; q.feet[1].rotation.x = -q.feet[0].rotation.x; place(q);
        if (q.pal <= dt || dist > 30) { q.pal = 0; q.home = { i: q.i, d: Math.sign(q.d || 1) * (track.KERB + 1.2 + rnd() * 2) }; q.cool = 30; } continue; }
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
  return { update, kick, strike, talk, near, list, get mad() { return list.some(q => q.mad > 0); } };
}
