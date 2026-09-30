// Dogs, modelled here (metres): a body, a chest, a head with its muzzle, a black nose, ears, a tail, four legs of two parts that
// move in a gallop; the jaw opens to bark. Each lives by a house (lying in the front garden). When the rider comes by, now and then
// one runs out after him: it chases, and when it is at his side it barks (it slows him: the game asks how close and how loud).
// A kick sends it off yelping; it runs home and keeps away a while. It gives up if he gets away.
// update(dt, rider) → the dogs by him: [{ dog, dist, side }] (the side he has it on: +1 left, -1 right).

export function createDogs({ THREE, toon, probe }) {
  const COATS = [['#8c5a34', '#e9e3d1'], ['#2b2622', '#e9e3d1'], ['#c98e4a', '#e7b68f'], ['#5a3d27', '#5a3d27'], ['#e9e3d1', '#9e7a4f']];
  const black = toon('#17181b'), tongue = toon('#cf5a3e');
  const taper = (r0, r1) => { const pts = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0)); } for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r1, 1 + Math.sin(a) * r1)); } return new THREE.LatheGeometry(pts, 10); };
  const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  const span = (o, a, b) => { _d.subVectors(b, a); const L = _d.length(); o.position.copy(a); _q.setFromUnitVectors(_up, _d.divideScalar(L || 1)); o.quaternion.copy(_q); o.scale.set(1, L, 1); };
  // ---------- the breeds: how each is built ----------
  //   len (body, m), ht (the hips' height), girth, coat [back, belly], ears 'up' | 'flop', tail 'curl' | 'straight' | 'stub', muzzle length, spots
  const BREEDS = [
    { name: 'labrador', len: .64, ht: .44, girth: 1, coat: ['#c98e4a', '#e7b68f'], ears: 'flop', tail: 'straight', muzzle: .15 },
    { name: 'husky', len: .62, ht: .45, girth: .95, coat: ['#5b5f63', '#e9e3d1'], ears: 'up', tail: 'curl', muzzle: .14, mask: true },
    { name: 'jamnik', len: .68, ht: .22, girth: .8, coat: ['#7b3326', '#9e5a3a'], ears: 'flop', tail: 'straight', muzzle: .16 },
    { name: 'terier', len: .42, ht: .3, girth: .78, coat: ['#e9e3d1', '#f6f3ea'], ears: 'up', tail: 'stub', muzzle: .09, patch: '#8c5a34' },
    { name: 'dalmatyńczyk', len: .64, ht: .45, girth: .9, coat: ['#f6f3ea', '#f6f3ea'], ears: 'flop', tail: 'straight', muzzle: .14, spots: '#17181b' },
    { name: 'kundel', len: .58, ht: .4, girth: .95, coat: ['#2b2622', '#c09a6a'], ears: 'flop', tail: 'straight', muzzle: .12 },
  ];
  const se = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);
  const colV = (g, fn) => { const p = g.attributes.position, c = new Float32Array(p.count * 3), v = new THREE.Vector3(); for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const col = fn(v); c[k * 3] = col.r; c[k * 3 + 1] = col.g; c[k * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
  // a body lofted along z through rounded sections: [z, half width, half height, centre height]
  function loftBody(st, nv = 14) {
    const pos = [], idx = [];
    st.forEach(([z, w, h, y]) => { for (let v = 0; v <= nv; v++) { const t = v / nv * Math.PI * 2; pos.push(w * se(Math.cos(t), 2.6), y + h * se(Math.sin(t), 2.6), z); } });
    for (let a = 0; a < st.length - 1; a++) for (let v = 0; v < nv; v++) { const k = a * (nv + 1) + v; idx.push(k, k + 1, k + nv + 1, k + 1, k + nv + 2, k + nv + 1); }   // (wound to face out)
    for (const [a, flip] of [[0, true], [st.length - 1, false]]) { const c0 = pos.length / 3, [z, , , y] = st[a]; pos.push(0, y, z); for (let v = 0; v < nv; v++) { const k = a * (nv + 1) + v; if (flip) idx.push(c0, k + 1, k); else idx.push(c0, k, k + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function makeDog(_coat, size, r = Math.random, breed = null) {           // (breed: its index in BREEDS; else picked at random)
    const B = BREEDS[breed ?? (r() * BREEDS.length | 0)], [c0, c1] = B.coat, back = new THREE.Color(c0), belly = new THREE.Color(c1), spot = B.spots ? new THREE.Color(B.spots) : null, patch = B.patch ? new THREE.Color(B.patch) : null;
    const fur = toon('#ffffff', { vertexColors: true }), furF = toon(c0), pale = toon(c1), G = new THREE.Group(), body = new THREE.Group(); G.add(body); body.scale.setScalar(size);
    const L = B.len, ht = B.ht, gw = B.girth, top = ht + .08;
    // the coat on the body: darker on the back, the belly and the chest paler; spots or a patch as the breed has them
    const paint = v => { const up = (v.y - (top - .06)) / .14; let c = belly.clone().lerp(back, Math.max(0, Math.min(1, up * 1.6 + .5)));
      if (spot && Math.sin(v.x * 61 + v.z * 47) * Math.sin(v.z * 53 - v.y * 71) > .3) c = spot.clone(); if (patch && v.z < -L * .1 && v.y > top - .02 && Math.sin(v.x * 30) > -.2) c = patch.clone(); return c; };
    const st = [[-L * .52, .08 * gw, .08, top + .005], [-L * .42, .115 * gw, .11, top], [-L * .22, .1 * gw, .1, top + .01], [0, .105 * gw, .12, top - .005], [L * .2, .12 * gw, .14, top - .02], [L * .36, .115 * gw, .13, top - .01], [L * .46, .08 * gw, .09, top + .04]];
    const torso = new THREE.Mesh(colV(loftBody(st), paint), fur); body.add(torso);                        // rump, waist, ribs, chest
    const neck = new THREE.Mesh(taper(.07 * gw, .06), furF); body.add(neck); span(neck, new THREE.Vector3(0, top + .03, L * .4), new THREE.Vector3(0, top + .17, L * .52));
    // the head: the skull, the muzzle (pale for some), the nose, eyes, ears as the breed has them; the jaw opens to bark
    const head = new THREE.Group(); head.position.set(0, top + .2, L * .56); body.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(.085, 14, 10), B.mask ? pale : furF); skull.scale.set(.95 * gw, .9, 1.05); head.add(skull);
    if (B.mask) { const cap = new THREE.Mesh(new THREE.SphereGeometry(.087, 14, 8, 0, Math.PI * 2, 0, Math.PI * .42), furF); cap.rotation.x = -.35; head.add(cap); }
    const mz = new THREE.Mesh(loftBody([[0, .045, .04, -.02], [B.muzzle * .6, .038, .035, -.03], [B.muzzle, .028, .026, -.035]], 10), B.mask || B.name === 'labrador' ? pale : furF); mz.position.z = .04; head.add(mz);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), black); nose.position.set(0, -.02, .05 + B.muzzle); head.add(nose);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(.06, .02, B.muzzle * .9), pale); jaw.position.set(0, -.065, .04 + B.muzzle * .5); head.add(jaw);
    const tng = new THREE.Mesh(new THREE.BoxGeometry(.03, .008, .05), tongue); tng.position.set(0, -.055, .05 + B.muzzle * .5); head.add(tng);
    for (const sd of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 4), black); eye.position.set(sd * .04, .02, .07); head.add(eye);
      if (B.ears === 'up') { const e = new THREE.Mesh(new THREE.ConeGeometry(.032, .09, 4), furF); e.position.set(sd * .05, .085, -.01); e.rotation.set(-.15, 0, -sd * .25); head.add(e); }
      else { const e = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), B.name === 'dalmatyńczyk' ? black : furF); e.scale.set(.35, 1, .7); e.position.set(sd * .085, -.01, -.005); e.rotation.z = sd * .25; head.add(e); } }
    // the tail: curled over the back, straight out, or a stub
    const tailPts = B.tail === 'curl' ? [[0, 0, 0], [0, .08, -.05], [0, .15, -.02], [0, .16, .06], [0, .1, .08]] : B.tail === 'stub' ? [[0, 0, 0], [0, .04, -.03], [0, .07, -.04]] : [[0, 0, 0], [0, .02, -.1], [0, -.04, -.22], [0, -.1, -.3]];
    const tail = new THREE.Group(); tail.position.set(0, top + .04, -L * .5); body.add(tail);
    tail.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 12, B.tail === 'curl' ? .025 : .018, 6, false), B.tail === 'curl' ? pale : furF));
    // the legs: a thigh with some meat on it, a lower leg, a paw
    const legs = []; for (const [x, z, front] of [[-.06 * gw, L * .36, 1], [.06 * gw, L * .36, 1], [-.07 * gw, -L * .4, 0], [.07 * gw, -L * .4, 0]]) {
      const up = new THREE.Mesh(taper(front ? .05 * gw : .065 * gw, .036), furF), lo = new THREE.Mesh(taper(.032, .027), front && !B.spots ? pale : furF), paw = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), pale);
      paw.scale.set(1, .6, 1.4); body.add(up, lo, paw); legs.push({ up, lo, paw, x, z, front, hy: ht - (front ? .03 : 0), ph: (front ? 0 : Math.PI) + (x > 0 ? .5 : 0) }); }
    G.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    return { group: G, body, head, jaw, tng, tail, legs, size, breed: B.name, ht };
  }
  const dogs = [];
  function add(x, z, yaw, r) {                                        // a dog lying by its house
    const m = makeDog(null, .9 + r() * .3, r); m.group.position.set(x, 0, z); m.group.rotation.y = yaw;
    const d = { ...m, home: new THREE.Vector3(x, 0, z), x, z, yaw, v: 0, state: 'home', t: 0, cool: r() * 8, gait: r() * 6, bark: 0, hint: -1, eager: .6 + r() * .35 };
    dogs.push(d); return d;
  }
  const _p = new THREE.Vector3();
  function pose(d, dt) {                                              // the legs from the gait; lying at home
    const lying = d.state === 'home' && d.v < .2, speed = d.v; d.gait += dt * (4 + speed * 2.2);
    d.body.position.y = lying ? -(d.ht - .12) * d.size : Math.abs(Math.sin(d.gait)) * .03 * Math.min(1, speed);
    d.body.rotation.x = lying ? 0 : Math.sin(d.gait * 2) * .04 * Math.min(1, speed);
    for (const L of d.legs) { const hip = new THREE.Vector3(L.x, L.hy, L.z), a = d.gait + L.ph, sw = lying ? 0 : Math.sin(a) * .22 * Math.min(1, speed / 3 + .15), lift = lying ? 0 : Math.max(0, Math.cos(a)) * .08 * Math.min(1, speed / 2 + .2);
      const foot = lying ? new THREE.Vector3(L.x * 1.5, Math.max(.03, L.hy - .2), L.z + (L.front ? .22 : -.1)) : new THREE.Vector3(L.x, .03 + lift, L.z + sw), knee = hip.clone().lerp(foot, .5).add(new THREE.Vector3(0, 0, L.front ? -.04 : .07));
      span(L.up, hip, knee); span(L.lo, knee, foot); L.paw.position.copy(foot); }
    d.tail.rotation.set(0, (d.state === 'chase' ? Math.sin(d.gait * 3) * .45 : Math.sin(d.t * 7) * .25), 0);   // (a wag)
    d.jaw.rotation.x = d.bark > 0 ? Math.abs(Math.sin(d.bark * 30)) * .5 : 0;
    d.head.rotation.x = lying ? .25 : -.1;
  }
  function update(dt, R) {                                            // R: { x, z, v, yaw, i (on the road) }
    const near = [];
    for (const d of dogs) {
      d.t += dt; d.cool = Math.max(0, d.cool - dt); d.bark = Math.max(0, d.bark - dt);
      const dx = R.x - d.x, dz = R.z - d.z, dist = Math.hypot(dx, dz);
      if (d.state === 'home') { if (dist < 17 && d.cool <= 0 && R.v > .5) { d.cool = 3; if (Math.random() < d.eager) { d.state = 'chase'; d.t = 0; } } d.v *= Math.pow(.02, dt);
        const hx = d.home.x - d.x, hz = d.home.z - d.z; if (Math.hypot(hx, hz) > .3) { d.v = 2; d.yaw = Math.atan2(hx, hz); } }
      else if (d.state === 'chase') {
        // run to a point at his side, a little behind; faster than a bike at an easy pace, slower than one flat out
        // it keeps to one side of him a while (the side it came up on), then drops back behind the wheel and goes round to the other
        const fx = Math.sin(R.yaw), fz = Math.cos(R.yaw), rx = -fz, rz = fx, now = (-dx * rx - dz * rz) > 0 ? 1 : -1;   // (the side of him it is on now: +1 his right)
        if (d.keep == null) { d.keep = now; d.keepT = 3 + Math.random() * 3.5; }
        if ((d.keepT -= dt) <= 0) { d.keep = -d.keep; d.keepT = 3 + Math.random() * 3.5; d.cross = 1.2; }
        d.cross = Math.max(0, (d.cross || 0) - dt); const backOff = .6 + (d.cross > 0 ? 1.4 : 0);   // (going round: farther behind)
        const tx = R.x - fx * backOff + rx * d.keep * .95, tz = R.z - fz * backOff + rz * d.keep * .95, ax = tx - d.x, az = tz - d.z, ad = Math.hypot(ax, az);
        const side = d.keep;                                            // (+1 his right)
        const want = Math.min(8.4, 2.4 + ad * 2.4), yawT = ad > .4 ? Math.atan2(ax, az) : R.yaw; d.yaw += Math.atan2(Math.sin(yawT - d.yaw), Math.cos(yawT - d.yaw)) * Math.min(1, dt * 3.2);   // (turning less sharply)
        d.v += (want - d.v) * Math.min(1, dt * 3);
        if (dist < 2.6) { if (Math.random() < dt * 5) d.bark = .35; near.push({ dog: d, dist, side: -side }); }   // (given as +1 his left, as the game wants it)
        if (d.t > 18 || dist > 30) { d.state = 'back'; d.t = 0; d.keep = null; }
      } else if (d.state === 'flee' || d.state === 'back') {
        const hx = d.home.x - d.x, hz = d.home.z - d.z, hd = Math.hypot(hx, hz), away = d.state === 'flee' && d.t < 1.2;
        const yawT = away ? Math.atan2(-dx, -dz) : Math.atan2(hx, hz); d.yaw += Math.atan2(Math.sin(yawT - d.yaw), Math.cos(yawT - d.yaw)) * Math.min(1, dt * 7);
        d.v += ((away ? 9 : 5) - d.v) * Math.min(1, dt * 4); if (away && Math.random() < dt * 6) d.bark = .2;
        if (hd < .8 && !away) { d.cool = d.state === 'flee' ? 20 : 12; d.state = 'home'; d.yaw += Math.PI; }   // (a kicked one keeps away longer)
      }
      let lift = 0;
      if (d.fly) { const f = d.fly; f.t += dt; lift = Math.max(0, f.vy * f.t - 4.9 * f.t * f.t); d.x += f.vx * dt; d.z += f.vz * dt; d.v = 0;   // kicked: off through the air, rolling over
        d.body.rotation.z = f.spin * Math.min(f.t, f.T); if (f.t >= f.T) { d.fly = null; d.body.rotation.z = 0; d.v = 6; } }
      else { d.x += Math.sin(d.yaw) * d.v * dt; d.z += Math.cos(d.yaw) * d.v * dt; }
      const q = probe(d.x, d.z, d.hint); d.hint = q.i; d.group.position.set(d.x, q.y + lift, d.z); d.group.rotation.y = d.yaw; pose(d, dt);
    }
    return near;
  }
  function kick(d, push) { d.state = 'flee'; d.t = 0; d.bark = .6; d.cool = 20; d.keep = null;   // push: { x, z } m/s (a proper kick: it flies)
    if (push) { const vy = 3.2, T = 2 * vy / 9.8; d.fly = { t: 0, vx: push.x, vz: push.z, vy, T, spin: (Math.random() < .5 ? -1 : 1) * 6.283 / T }; } }
  // it ran into something (a car, a tree): thrown, rolling; then off home, yelping, and it keeps away a good while
  function tumble(d, push) { if (d.fly && d.fly.tumble) return; d.state = 'flee'; d.t = 1.2; d.bark = .8; d.cool = 25; d.keep = null;
    const vy = 2.4, T = 2 * vy / 9.8; d.fly = { t: 0, vx: push.x, vz: push.z, vy, T, spin: (Math.random() < .5 ? -1 : 1) * 6.283 * 1.5 / T, tumble: true }; }
  return { dogs, add, update, kick, tumble, makeDog, BREEDS };
}
