// The things by the road answer a kick (on foot, or from the bike): a mailbox shakes, its flag jumps, and the third kick breaks it off its
// post onto the lawn; a pole gives a puff of dust, barely; a tree shakes and leaves come down (the more you kick, the more), a bush
// sheds green ones, and the leaves stay where they fall; a swing swings, higher with each kick; a cone goes over (kicked or ridden into)
// and slides off. createWorld({ THREE, scene, track, toon, audio, onBreak }) → { strike(x, z, yaw, reach, power) → the thing or null,
//   hit(thing, dx, dz, power), near(x, z, r), bump(thing, vx, vz), update(dt) }
export function createWorld({ THREE, scene, track, toon, audio, onBreak }) {
  const UP = new THREE.Vector3(0, 1, 0), things = track.things || [], grid = new Map(), CELL = 8, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const cell = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  let ready = false;
  function init() { scene.updateMatrixWorld(true); const v = V(0, 0, 0);
    for (const T of things) { T.o.getWorldPosition(v); T.x = v.x; T.z = v.z; T.y = v.y; T.r = T.r ?? { tree: .3, pole: .14, mailbox: .2 }[T.kind] ?? .3; T.hits = 0; T.wob = 0; T.wv = 0; T.q0 = T.o.quaternion.clone(); T.s0 = (T.parts || []).map(p => p.scale.clone());
      const k = cell(T.x, T.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(T); }
    ready = true; }
  function near(x, z, r) { if (!ready) init(); const out = [], cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const T of grid.get((cx + i) + ',' + (cz + j)) || []) if (!T.gone && Math.hypot(T.x - x, T.z - z) - T.r < r) out.push(T);
    return out; }
  // ---------- the leaves: falling (fluttering down), then lying where they fell; and the puffs ----------
  const leafG = new THREE.PlaneGeometry(.13, .08).rotateX(-Math.PI / 2), leafM = toon('#ffffff', { side: THREE.DoubleSide });
  const FALLN = 260, LIEN = 1400, fallM = new THREE.InstancedMesh(leafG, leafM, FALLN), lieM = new THREE.InstancedMesh(leafG, leafM, LIEN);
  for (const m of [fallM, lieM]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); const zero = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < m.count; i++) { m.setMatrixAt(i, zero); m.setColorAt(i, new THREE.Color('#ffffff')); } scene.add(m); }
  lieM.receiveShadow = true;
  const falling = [], _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = V(1, 1, 1), _p = V(0, 0, 0), col = new THREE.Color();
  let lieAt = 0, fallFree = Array.from({ length: FALLN }, (_, i) => i);
  const GREEN = ['#5f8f3a', '#7aa645', '#4c7a30', '#8fb24f', '#6b9a3c'], AUTUMN = ['#d9822b', '#c4521f', '#e3b83a', '#a8431f', '#cf6a2a'], NEEDLE = ['#284a2b', '#33583a', '#3d5e30'];
  function shed(x, y, z, rad, n, pal, ground) {
    for (let k = 0; k < n && fallFree.length; k++) { const i = fallFree.pop(), a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * rad;
      falling.push({ i, x: x + Math.cos(a) * r, y: y + (Math.random() - .3) * rad * .5, z: z + Math.sin(a) * r, vy: -(.35 + Math.random() * .45), ph: Math.random() * 6.28, sp: 2 + Math.random() * 3, ry: Math.random() * 6.28, g: ground, delay: Math.random() * .5 });
      fallM.setColorAt(i, col.set(pal[Math.random() * pal.length | 0])); }
    fallM.instanceColor.needsUpdate = true; }
  function lie(L) { const i = lieAt; lieAt = (lieAt + 1) % LIEN;
    _e.set((Math.random() - .5) * .25, L.ry, (Math.random() - .5) * .25); _q.setFromEuler(_e); _m.compose(_p.set(L.x, L.g + .015 + Math.random() * .01, L.z), _q, _s.set(1, 1, 1)); lieM.setMatrixAt(i, _m);
    fallM.getColorAt(L.i, col); lieM.setColorAt(i, col); lieM.instanceMatrix.needsUpdate = true; lieM.instanceColor.needsUpdate = true; }
  const ground = (x, z) => { const q = track.probe(x, z, -1); return q ? q.y : 0; };
  const puffM = new THREE.MeshBasicMaterial({ color: '#cfc8b8', transparent: true, depthWrite: false }), puffG = new THREE.IcosahedronGeometry(.07, 0), puffs = [];
  function puff(x, y, z, n = 5, colr = '#cfc8b8', size = 1) { for (let k = 0; k < n; k++) { const m = new THREE.Mesh(puffG, puffM.clone()); m.material.color.set(colr); m.position.set(x + (Math.random() - .5) * .12, y + (Math.random() - .5) * .15, z + (Math.random() - .5) * .12); scene.add(m);
    puffs.push({ m, t: 0, life: .5 + Math.random() * .35, vx: (Math.random() - .5) * .4, vy: .15 + Math.random() * .3, vz: (Math.random() - .5) * .4, s: size }); } }
  // ---------- a kick: the nearest thing in front, within reach ----------
  function strike(x, z, yaw, reach, power = 1) {
    const fx = Math.sin(yaw), fz = Math.cos(yaw); let best = null, bv = 1e9;
    for (const T of near(x, z, reach)) { const dx = T.x - x, dz = T.z - z, d = Math.hypot(dx, dz), edge = d - T.r; if (edge > reach) continue;
      if (d > T.r + .35 && (dx * fx + dz * fz) / (d || 1) < .25) continue; if (edge < bv) { bv = edge; best = T; } }
    if (best) hit(best, fx, fz, power); return best; }
  function hit(T, dx, dz, power = 1) {
    if (!ready) init(); const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; T.axis = V(dz, 0, -dx);   // (it leans away from the kick: about the line across it)
    if (T.kind === 'mailbox') { if (T.broken) return; T.hits++; T.wv += 4.5 * power; T.mb.flag.rotation.x = -.9; T.flagT = .5; puff(T.x - dx * .15, T.y + 1.05, T.z - dz * .15, 3, '#b8b8ae', .7); audio?.play('mailbox', { vol: .45 });
      if (T.hits >= 3) { const q = track.probe(T.x, T.z, -1), R = track.S[q.i].r, sg = Math.sign(q.d) || 1, ox = R.x * sg, oz = R.z * sg;   // (off the road: onto the lawn behind it)
        T.axis = V(oz, 0, -ox); T.broken = true; T.fall = { t: 0, dx: ox, dz: oz }; T.mb.done = true; if (T.C) T.C.used = true; audio?.play('crash', { vol: .35 }); onBreak?.(T); } return; }
    if (T.kind === 'pole') { T.hits++; T.wv += .25 * power; puff(T.x - dx * .16, T.y + .5 + Math.random() * .4, T.z - dz * .16, 4, '#d8d0bf', .8); audio?.play('kick', { vol: .25 }); return; }
    if (T.kind === 'tree') { T.hits++; T.wv += (T.spruce ? .5 : 1.1) * power; const n = Math.min(46, (T.spruce ? 2 : 6) + T.hits * (T.spruce ? 1 : 4));
      const c = T.reach ? V(T.x + T.reach * T.crown * .35, 0, T.z) : V(T.x, 0, T.z);   // (a street tree's crown leans over the road)
      shed(c.x, T.y + T.H * (T.spruce ? .45 : .72), c.z, T.crown, n, T.spruce ? NEEDLE : T.autumn ? AUTUMN : (Math.random() < .25 ? AUTUMN : GREEN), ground(c.x, c.z)); audio?.play('rustle', { vol: .7 }); return; }
    if (T.kind === 'bush') { T.hits++; T.wv += 3 * power; shed(T.x, T.y + (T.top || 1) * .8, T.z, Math.min(1.4, T.r), Math.min(16, 3 + T.hits * 2), T.flowers && Math.random() < .5 ? ['#e889b5', '#f2c33a', '#f6f3ea'] : GREEN, ground(T.x, T.z)); audio?.play('rustle', { vol: .55 }); return; }
    if (T.kind === 'swing') { T.amp = Math.min(1.2, (T.amp || 0) + .32 * power); T.w = T.w || 2.4; return; }
    if (T.kind === 'cone') bump(T, dx * 4.2 * power, dz * 4.2 * power);
  }
  // a cone ridden into or kicked: over it goes, sliding and turning, out of the way for good
  function bump(T, vx, vz) { if (!ready) init(); if (T.down && Math.hypot(T.vx || 0, T.vz || 0) > 1) return; T.down = true; T.yaw ??= T.o.rotation.y; if (T.C) T.C.used = true; const l = Math.hypot(vx, vz) || 1; T.vx = vx; T.vz = vz; T.axis = V(vz / l, 0, -vx / l); T.tip = T.tip || 0; T.spin = (Math.random() - .5) * 6; audio?.play('land', { vol: .4 }); }
  // ---------- each frame: the shaking, the swinging, the falling ----------
  let clock = 0;
  function update(dt) {
    if (!ready) return; clock += dt;
    for (const T of things) {
      if (T.kind === 'swing' && T.amp > .002) { T.amp *= Math.pow(.86, dt); T.pivot && (T.pivot.rotation.x = Math.sin(clock * T.w) * T.amp); continue; }
      if (T.kind === 'cone' && T.down) { T.tip = Math.min(Math.PI / 2, T.tip + dt * 6); const sp = Math.hypot(T.vx, T.vz); if (sp > .02) { T.o.position.x += T.vx * dt; T.o.position.z += T.vz * dt; const k = Math.max(0, 1 - dt * 3.2); T.vx *= k; T.vz *= k; T.yaw += T.spin * dt * Math.min(1, sp); }
        T.o.quaternion.setFromAxisAngle(UP, T.yaw); T.o.rotateOnWorldAxis(T.axis, T.tip); T.x = T.o.position.x; T.z = T.o.position.z; continue; }
      if (T.fall) { const F = T.fall; F.t = Math.min(1, F.t + dt * 2.2); const a = F.t * F.t * (Math.PI / 2 - .12); T.o.quaternion.copy(T.q0); T.o.rotateOnWorldAxis(T.axis, a);
        if (F.t < 1) { T.o.position.x += F.dx * dt * .6; T.o.position.z += F.dz * dt * .6; } else if (!F.done) { F.done = true; puff(T.o.position.x + F.dx * .9, T.y + .1, T.o.position.z + F.dz * .9, 6, '#cfc8b8', 1.2); } continue; }
      if (T.flagT > 0) { T.flagT -= dt; if (T.flagT <= 0) T.mb.flag.rotation.x = T.mb.done ? -Math.PI / 2 : 0; }
      if (T.wv === 0 && T.wob === 0) continue;
      const k = T.kind === 'tree' ? 18 : T.kind === 'pole' ? 60 : 90, damp = T.kind === 'tree' ? 3.2 : 7; T.wv += (-T.wob * k - T.wv * damp) * dt; T.wob += T.wv * dt;
      if (Math.abs(T.wob) < .0004 && Math.abs(T.wv) < .002) { T.wob = 0; T.wv = 0; }
      const amt = T.kind === 'tree' ? .035 : T.kind === 'pole' ? .01 : .06;
      if (T.kind === 'bush') T.parts.forEach((p, n) => p.scale.copy(T.s0[n]).multiplyScalar(1 + T.wob * .08 * (n % 2 ? -1 : 1)));
      else { T.o.quaternion.copy(T.q0); T.o.rotateOnWorldAxis(T.axis, T.wob * amt); } }
    // the leaves coming down: a sway side to side as they go, a turn; down, they stay
    for (let n = falling.length - 1; n >= 0; n--) { const L = falling[n]; if (L.delay > 0) { L.delay -= dt; continue; }
      L.ph += dt * L.sp; L.y += L.vy * dt; L.x += Math.sin(L.ph) * .5 * dt; L.z += Math.cos(L.ph * .7) * .3 * dt; L.ry += dt * 1.5;
      if (L.y <= L.g + .02) { lie(L); fallM.setMatrixAt(L.i, _m.makeScale(0, 0, 0)); fallFree.push(L.i); falling.splice(n, 1); continue; }
      _e.set(Math.sin(L.ph) * .7, L.ry, Math.cos(L.ph) * .5); _q.setFromEuler(_e); _m.compose(_p.set(L.x, L.y, L.z), _q, _s.set(1, 1, 1)); fallM.setMatrixAt(L.i, _m); }
    if (falling.length || fallFree.length < FALLN) fallM.instanceMatrix.needsUpdate = true;
    for (let n = puffs.length - 1; n >= 0; n--) { const P = puffs[n]; P.t += dt; const u = P.t / P.life; if (u >= 1) { scene.remove(P.m); P.m.material.dispose(); puffs.splice(n, 1); continue; }
      P.m.position.x += P.vx * dt; P.m.position.y += P.vy * dt; P.m.position.z += P.vz * dt; P.m.scale.setScalar((1 + u * 2.4) * P.s); P.m.material.opacity = .45 * (1 - u); }
  }
  return { strike, hit, near, bump, update, things };
}
