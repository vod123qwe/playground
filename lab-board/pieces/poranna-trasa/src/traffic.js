// Traffic: cars driving round the loop in both directions, each in its lane (1.75 m right of the middle, as it goes), at 30-40 km/h.
// Each keeps behind what is ahead of it in its lane (a car, one parked at the kerb, the rider), and when that is standing or crawling
// it goes round it: over into the other lane, if nothing is coming that way, past it, and back. A lane change is a steer, not a jump
// (the car turns a little into it). Something coming while it is out there: it slows, and if it has not got past yet, it goes back.
// One he runs into (or that runs into him) stops a while. boxes() gives where each is, as the rider's colliders are.

export function createTraffic({ THREE, track, cars, n = 6, seed = 5, makeRider = null, bikes: nb = 2 }) {
  let a = seed; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const G = new THREE.Group(), list = [], { S, N, ds, len } = track, LANE = 1.75;
  for (let k = 0; k < n; k++) { const c = cars.random(rnd), dir = k % 2 ? 1 : -1; G.add(c.group);
    list.push({ car: c, dir, s: (k + .3) / n * len, v: 8 + rnd() * 3, cruise: 8.5 + rnd() * 2.5, lane: dir * LANE, laneV: 0, laneT: dir * LANE, pass: null, stop: 0, x: 0, z: 0, yaw: 0 }); }
  // the bus: round the loop, stopping at the stops on its side (track.stops) a few seconds; the cars behind go round it
  { const c = cars.makeCar('bus', cars.COLOURS.bus[rnd() * 3 | 0]); G.add(c.group); list.push({ car: c, dir: 1, s: len * .6, v: 7, cruise: 7.6, lane: LANE, laneV: 0, laneT: LANE, pass: null, stop: 0, x: 0, z: 0, yaw: 0, bus: true, extra: 3.2 }); }
  const wrap = x => ((x % len) + len) % len, ahead = (from, to, dir) => { let d = ((to - from) * dir % len + len) % len; return d > len / 2 ? d - len : d; };
  function place(t) {
    const f = wrap(t.s) / ds, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, k = f - Math.floor(f), A = S[i0], B = S[i1];
    const px = A.p.x + (B.p.x - A.p.x) * k, pz = A.p.z + (B.p.z - A.p.z) * k, py = A.p.y + (B.p.y - A.p.y) * k, rx = A.r.x, rz = A.r.z;
    const fx = A.f.x + (B.f.x - A.f.x) * k, fz = A.f.z + (B.f.z - A.f.z) * k;                    // (the heading between the two points it is between)
    t.x = px + rx * t.lane; t.z = pz + rz * t.lane; const yawT = Math.atan2(fx, fz) + (t.dir < 0 ? Math.PI : 0);
    if (t.yaw === undefined || t.snap) { t.yaw = yawT; t.snap = false; } else t.yaw += Math.atan2(Math.sin(yawT - t.yaw), Math.cos(yawT - t.yaw)) * Math.min(1, (t.dt || .016) * 7);   // (eased: it swings round, not snaps)
    const steer = Math.atan2(t.laneV * t.dir, Math.max(2, t.v));        // (changing lanes: nosed a little into it)
    if (!t.car) return;
    t.car.group.position.set(t.x, py, t.z); t.car.group.rotation.set(-Math.atan((B.p.y - A.p.y) / ds) * t.dir, t.yaw - steer, 0, 'YXZ');
  }
  function update(dt, R) {                                            // R: { s (along the road), d (off the middle), v, along (+1 / -1: which way he rides) }
    stepBikes(dt, R);
    // everything that can be in a lane: the cars, the parked ones, the rider
    const things = [...list.map(t => ({ s: t.s, d: t.lane, v: t.v * t.dir, t })), ...bikes.map(b => ({ s: b.s, d: b.lane, v: b.v * b.dir })), ...track.parked.map(p => ({ s: p.s, d: p.d, v: 0 })), { s: R.s, d: R.d, v: R.v * R.along, rider: true }];
    for (const t of list) {
      t.stop = Math.max(0, t.stop - dt);
      const mine = t.dir * LANE, other = -mine;
      // what is ahead of it in a lane (d), and how near, and how fast it goes our way
      const lead = d => { let best = null; for (const o of things) { if (o.t === t || Math.abs(o.d - d) > (o.rider ? .8 : 1.5)) continue; const g = ahead(t.s, o.s, t.dir); if (g > 0 && g < 40 && (!best || g < best.g)) best = { g, v: o.v * t.dir, o }; } return best; };
      const coming = () => { let near = 1e9; for (const o of list) { if (o === t || o.dir === t.dir) continue; const g = ahead(t.s, o.s, t.dir); if (g > -2 && g < near) near = g; } return near; };   // (the nearest one coming the other way)
      const L = lead(t.lane), inMine = Math.abs(t.lane - mine) < .5;
      // the rider in its way: a driver waits a moment (slows, hoots) before going round him; a swerve over a moment's wobble is not how they drive
      t.riderT = L && L.o.rider && L.g < 30 ? (t.riderT || 0) + dt : Math.max(0, (t.riderT || 0) - dt * 2);
      // stuck behind him a good while (he is ahead, near, and it has had to slow): it hoots, the driver has something to say
      const behind = L && L.o.rider && L.g < 14 && t.v < t.cruise * .75 && !t.pass; t.stuckT = behind ? (t.stuckT || 0) + dt : Math.max(0, (t.stuckT || 0) - dt * 2);
      t.shoutCool = Math.max(0, (t.shoutCool || 0) - dt); if (t.stuckT > 3.5 && t.shoutCool <= 0) { t.shoutNow = true; t.shoutCool = 7 + rnd() * 6; }
      let want = t.cruise;
      if (L) want = Math.max(0, Math.min(t.cruise, (L.g - 6.5 - (L.o.t?.extra || 0) - (t.extra || 0)) * 1.3 + Math.max(0, L.v)));        // (keep behind it; further behind a bus)
      if (t.bus && track.stops) for (const q of track.stops) { if (q.sd !== t.dir) continue; const g = ahead(t.s, q.s, t.dir);   // (the bus: easing in to its stop, standing there a few seconds)
        if (t.lastStop === q) { if (g < -40) t.lastStop = null; continue; }
        if (g > 0 && g < 16) want = Math.min(want, Math.max(.8, g * .7)); if (g > -1 && g < 1.2 && t.stop <= 0) { t.stop = 6; t.lastStop = q; } }
      // go round something standing or crawling in its lane, if the other lane is clear far enough
      if (!t.pass && inMine && L && L.g < 22 && Math.max(0, L.v) < 2.2 && !L.o.t?.pass && (!L.o.rider || t.riderT > 1.3)) {
        const clear = coming() > 48 && !(lead(other) && lead(other).g < L.g + 12);
        if (clear) t.pass = { s: L.o.s, t: L.o.t || null, rider: !!L.o.rider }; }
      if (t.pass) { const past = -ahead(t.s, t.pass.t ? t.pass.t.s : t.pass.rider ? R.s : t.pass.s, t.dir), oc = coming();   // (how far past it we are)
        t.laneT = other;
        want = Math.min(t.cruise * 1.05, want + 4); const Lo = lead(other); if (Lo) want = Math.min(want, (Lo.g - 6.5 - (Lo.o.t?.extra || 0) - (t.extra || 0)) * 1.3 + Math.max(0, Lo.v));   // (out there: mind what is ahead in that lane too)
        if (oc < 30) { want = Math.min(want, oc < 18 ? 1.5 : 4.5); if (past < -1) t.pass = null; }        // something coming: slow; not past yet: back in
        if (t.pass && (past > 7 || (oc < 25 && past > 4.6)) && !(lead(mine) && lead(mine).g < 3)) t.pass = null; }   // past it (with room): back in; sooner, if one is coming (else they meet nose to nose and both wait)
      if (!t.pass) t.laneT = mine;
      // the steering over: a spring, the quicker the faster it goes
      const kk = 2.2 + Math.min(1.5, t.v * .15); t.laneV += ((t.laneT - t.lane) * kk * kk - 2 * kk * t.laneV) * dt; t.laneV = THREE.MathUtils.clamp(t.laneV, -2.2, 2.2); t.lane += t.laneV * dt;
      if (t.stop > 0) want = 0;
      t.v += THREE.MathUtils.clamp(want - t.v, -7 * dt, 2.5 * dt); t.s = wrap(t.s + t.dir * t.v * dt);
      t.dt = dt; place(t); cars.spin(t.car, t.v * dt);
    }
  }
  // cyclists: now and then one coming the other way, at the kerb, in its own colours; far behind him (or too far ahead), it is sent
  // round again, to come at him from ahead
  const bikes = [];
  if (makeRider) for (let k = 0; k < nb; k++) { const r = makeRider(), M = r.materials, pick = a => a[rnd() * a.length | 0];
    M.shirt.color.set(pick(['#cf5a3e', '#3b5670', '#467537', '#efc970', '#b7a4e0', '#e9e3d1'])); M.jeans.color.set(pick(['#2f4a6e', '#44484c', '#1d1e21', '#7c8446']));
    M.cap.color.set(pick(['#3b5670', '#17181b', '#e9e3d1', '#467537'])); M.frame.color.set(pick(['#3b5670', '#17181b', '#9aa0a4', '#467537', '#efc970'])); M.hair.color.set(pick(['#24190f', '#9a938a', '#d9a441', '#5b3a22']));
    G.add(r.root); bikes.push({ r, s: 0, dir: 1, lane: 0, v: 4 + rnd() * 1.6, wait: 4 + k * 9 + rnd() * 8, stop: 0, x: 0, z: 0, yaw: 0, snap: true, on: false }); r.root.visible = false; }
  function stepBikes(dt, R) {
    for (const b of bikes) {
      b.stop = Math.max(0, b.stop - dt);
      if (!b.on) { if ((b.wait -= dt) > 0) continue; b.on = true; b.dir = -(R.along || 1); b.s = wrap(R.s + (R.along || 1) * (110 + rnd() * 70)); b.lane = b.dir * 2.55; b.snap = true; b.r.root.visible = true; }   // (ahead of him, coming his way)
      const rel = ahead(R.s, b.s, R.along || 1);                       // (how far ahead of him, the way he rides)
      if (!b.hold && (rel < -40 || rel > 320)) { b.on = false; b.wait = 6 + rnd() * 14; b.r.root.visible = false; continue; }
      if (b.hold) b.stop = Math.max(b.stop, .5); const v = b.stop > 0 ? 0 : b.v; b.s = wrap(b.s + b.dir * v * dt); b.dt = dt; if (!b.fall) place(b);
      const q = track.probe(b.x, b.z, Math.floor(wrap(b.s) / ds) % N); b.r.root.position.set(b.x, q.y, b.z); b.r.root.rotation.set(0, b.yaw, 0);
      // knocked off: the bike over on its side, the rider thrown (a ragdoll), a while, up again; bumped: a wobble
      let lean = 0; if (b.fall) { const f = b.fall; f.t += dt; lean = f.side * 1.35 * (f.t < 2.8 ? Math.min(1, f.t * 5) : Math.max(0, 1 - (f.t - 2.8) / .9)); if (b.hold) f.t = Math.min(f.t, 2.2); if (f.t > 2.8 && !f.up) { f.up = true; b.r.getUp(.9); } if (f.t > 3.8) b.fall = null; }
      if (b.wob > 0) { b.wob -= dt; lean = Math.sin(b.wob * 22) * .25 * b.wob; }
      b.r.update({ dt, speed: b.fall ? 0 : v, steer: 0, lean, pedalling: v > 0 && !b.fall ? 1 : 0, braking: 0, climbing: 0, look: null, nervous: 0, kick: null, air: false, fallen: b.fall ? 1 : 0, charge: null });
    }
  }
  // the rider ran into a cyclist: hard, and it is knocked off too; softly, it wobbles and goes on
  function knock(b, vel, hard) {
    if (!hard) { b.wob = .8; b.stop = Math.max(b.stop, .6); return; }
    if (b.fall) return; const f = new THREE.Vector3(Math.sin(b.yaw), 0, Math.cos(b.yaw)), side = Math.random() < .5 ? -1 : 1; b.fall = { t: 0, side, up: false }; b.stop = 4.2;
    const v = vel.clone().multiplyScalar(.6).addScaledVector(f, b.v * .5), sp = Math.min(6, v.length());
    b.r.ragdoll({ vel: v, spin: new THREE.Vector3(f.z, 0, -f.x).multiplyScalar(.35 * sp).addScaledVector(f, side * .6), lift: .5 + sp * .07, ground: (x, z) => track.probe(x, z, Math.floor(wrap(b.s) / ds) % N).y, near: () => [], hit: () => false });
  }
  function boxes() { return [...bikes.filter(b => b.on).map(b => ({ x: b.x, z: b.z, c: Math.cos(b.yaw), s: Math.sin(b.yaw), hx: .3, hz: .9, h: 1.6, y0: b.r.root.position.y, kind: 'car', t: b })), ...list.map(t => ({ x: t.x, z: t.z, c: Math.cos(t.yaw), s: Math.sin(t.yaw), hx: t.car.half[0], hz: t.car.half[1], h: 1.5, y0: t.car.group.position.y, kind: 'car', t })) ]; }
  list.forEach(place);
  return { group: G, list, update, boxes, knock, bikes };
}
