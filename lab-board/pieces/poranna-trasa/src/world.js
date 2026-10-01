// The things by the road answer a kick (on foot, or from the bike): a mailbox shakes, its flag jumps, and the third kick breaks it off its
// post onto the lawn; a pole gives a puff of dust, barely; a tree shakes and leaves come down (the more you kick, the more), a bush
// sheds green ones, and the leaves stay where they fall; a swing swings, higher with each kick; a cone goes over (kicked or ridden into)
// and slides off. On the plots (plots.js): a ball to kick about, hens that scatter, a dog on its chain, a shrine's candles, a caravan
// that rocks, beds the allotment man minds, a box of gears to take; puddles splash.
// createWorld({ THREE, scene, track, toon, audio, onBreak, say(at, text), onLoot(thing), onShrine(thing), makeDog }) →
//   { strike(x, z, yaw, reach, power) → the thing or null, hit(thing, dx, dz, power), near(x, z, r), bump(thing, vx, vz), splash(x, z, mud, v), update(dt, me) }
export function createWorld({ THREE, scene, track, toon, audio, onBreak, say, onLoot, onShrine, makeDog }) {
  const UP = new THREE.Vector3(0, 1, 0), things = track.things || [], grid = new Map(), CELL = 8, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const cell = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  let ready = false;
  function init() { scene.updateMatrixWorld(true); const v = V(0, 0, 0);
    for (const T of things) { if (['pole', 'caravan', 'hen', 'ball'].includes(T.kind) && T.o.parent && T.o.parent !== track.group) scene.attach(T.o);
      T.o.getWorldPosition(v); T.x = v.x; T.z = v.z; T.y = v.y; T.r = T.r ?? { tree: .3, pole: .14, mailbox: .2 }[T.kind] ?? .3; T.hits = 0; T.wob = 0; T.wv = 0; T.q0 = T.o.quaternion.clone(); T.s0 = (T.parts || []).map(p => p.scale.clone());
      if (T.kind === 'hen') { T.hx = T.x; T.hz = T.z; T.tx = T.x; T.tz = T.z; T.wait = Math.random() * 2; }
      if (T.kind === 'ball') { T.x0 = T.x; T.z0 = T.z; T.vx = T.vz = T.vy = 0; T.yb = T.y; }
      if (T.kind === 'chaindog') { const a = T.o.localToWorld(V(T.ax, 0, T.az)); T.cx = a.x; T.cz = a.z; T.cy = a.y; T.post = T.o.localToWorld(V(0, .1, -.7)); T.dx = a.x; T.dz = a.z; T.bark = 0; }
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
  const ground = (x, z, hint = -1) => { const q = track.probe(x, z, hint); return q ? q.y : 0; };
  const puffM = new THREE.MeshBasicMaterial({ color: '#cfc8b8', transparent: true, depthWrite: false }), puffG = new THREE.IcosahedronGeometry(.07, 0), puffs = [];
  function puff(x, y, z, n = 5, colr = '#cfc8b8', size = 1) { for (let k = 0; k < n; k++) { const m = new THREE.Mesh(puffG, puffM.clone()); m.material.color.set(colr); m.position.set(x + (Math.random() - .5) * .12, y + (Math.random() - .5) * .15, z + (Math.random() - .5) * .12); scene.add(m);
    puffs.push({ m, t: 0, life: .5 + Math.random() * .35, vx: (Math.random() - .5) * .4, vy: .15 + Math.random() * .3, vz: (Math.random() - .5) * .4, s: size }); } }
  function splash(x, z, mud, v = 4) { const y = ground(x, z); for (let k = 0; k < 7 + Math.min(8, v * 1.5); k++) { const m = new THREE.Mesh(puffG, puffM.clone()); m.material.color.set(mud ? '#6b5236' : '#b9d4de'); m.position.set(x + (Math.random() - .5) * .5, y + .08, z + (Math.random() - .5) * .5); scene.add(m);
      puffs.push({ m, t: 0, life: .45 + Math.random() * .25, vx: (Math.random() - .5) * 2.4, vy: 1.4 + Math.random() * 1.6, vz: (Math.random() - .5) * 2.4, s: .6, g: true }); } audio?.play('splash', { vol: Math.min(1, .3 + v * .1) }); }
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
    if (T.kind === 'pole' && (T.soft || T.carpet)) { T.hits++; T.wv += 2.5 * power; puff(T.x - dx * .2, T.y + 1, T.z - dz * .2, T.carpet ? 9 : 4, T.carpet ? '#b59a74' : '#d8d0bf', T.carpet ? 1.4 : .8); audio?.play('kick', { vol: .3 }); return; }
    if (T.kind === 'ball') { T.vx = dx * 6.5 * power; T.vz = dz * 6.5 * power; T.vy = 2.4 * power; audio?.play('kick', { vol: .35 }); return; }
    if (T.kind === 'hen') { T.flee = 2.2; T.fx = dx; T.fz = dz; T.vy = 2.6; say?.(V(T.x, T.y + .8, T.z), 'KOOO!'); return; }
    if (T.kind === 'caravan') { T.wv += 2 * power; puff(T.x - dx * .5, T.y + .8, T.z - dz * .5, 3); audio?.play('crash', { vol: .25 }); T.door.position.x = -.1; T.door.rotation.y = -.9; T.doorT = 2.5;
      say?.(V(T.x, T.y + 2.6, T.z), ['CO JEST?!', 'ZARAZ WYJDĘ I POGADAMY!', 'MOJA WILLA!', 'TRZĘSIENIE ZIEMI?!'][Math.random() * 4 | 0]); return; }
    if (T.kind === 'shrine') { if (!T.out) { T.out = true; T.flames.forEach(f => { f.visible = false; }); T.relight = 30; puff(T.x, T.y + .5, T.z, 4, '#9a968c', .6); onShrine?.(T); } audio?.play('kick', { vol: .3 }); return; }
    if (T.kind === 'chaindog' || T.kind === 'beds' || T.kind === 'loot') return;
    if (T.kind === 'pole') { T.hits++; T.wv += .25 * power; puff(T.x - dx * .16, T.y + .5 + Math.random() * .4, T.z - dz * .16, 4, '#d8d0bf', .8); audio?.play('kick', { vol: .25 }); return; }
    if (T.kind === 'tree') { T.hits++; T.wv += (T.spruce ? .5 : 1.1) * power; const n = Math.min(46, (T.spruce ? 2 : 6) + T.hits * (T.spruce ? 1 : 4));
      const c = T.reach ? V(T.x + T.reach * T.crown * .35, 0, T.z) : V(T.x, 0, T.z);   // (a street tree's crown leans over the road)
      shed(c.x, T.y + T.H * (T.spruce ? .45 : .72), c.z, T.crown, n, T.spruce ? NEEDLE : T.autumn ? AUTUMN : (Math.random() < .25 ? AUTUMN : GREEN), ground(c.x, c.z)); audio?.play('kick', { vol: .32 }); audio?.play('rustle', { vol: .25 }); return; }   // (a thud in the trunk, the leaves only a whisper)
    if (T.kind === 'bush') { T.hits++; T.wv += 3 * power; shed(T.x, T.y + (T.top || 1) * .8, T.z, Math.min(1.4, T.r), Math.min(16, 3 + T.hits * 2), T.flowers && Math.random() < .5 ? ['#e889b5', '#f2c33a', '#f6f3ea'] : GREEN, ground(T.x, T.z)); audio?.play('rustle', { vol: .55 }); return; }
    if (T.kind === 'swing') { T.amp = Math.min(1.2, (T.amp || 0) + .32 * power); T.w = T.w || 2.4; return; }
    if (T.kind === 'cone') bump(T, dx * 4.2 * power, dz * 4.2 * power);
  }
  // a cone ridden into or kicked: over it goes, sliding and turning, out of the way for good
  function bump(T, vx, vz) { if (!ready) init(); if (T.down && Math.hypot(T.vx || 0, T.vz || 0) > 1) return; T.down = true; T.yaw ??= T.o.rotation.y; if (T.C) T.C.used = true; const l = Math.hypot(vx, vz) || 1; T.vx = vx; T.vz = vz; T.axis = V(vz / l, 0, -vx / l); T.tip = T.tip || 0; T.spin = (Math.random() - .5) * 6; audio?.play('land', { vol: .4 }); }
  // ---------- each frame: the shaking, the swinging, the falling ----------
  let clock = 0;
  let dog = null, chain = null, smokeT = 0;
  function update(dt, me) {
    if (!ready) return; clock += dt; const mx = me ? me.x : 1e9, mz = me ? me.z : 1e9, foot = !!me?.foot;
    for (const T of things) {
      if (T.kind === 'hen') { const dm = Math.hypot(T.x - mx, T.z - mz);   // (pecking about its yard; you near (or a kick): off it runs, flapping)
        if (dm < 3.2 && !T.flee) { T.flee = 1.4; T.fx = (T.x - mx) / (dm || 1); T.fz = (T.z - mz) / (dm || 1); T.vy = 1.5; }
        let sp = 0; if (T.flee > 0) { T.flee -= dt; if (T.flee <= 0) T.flee = 0; sp = 2.6; T.tx = T.x + T.fx; T.tz = T.z + T.fz; }
        else if ((T.wait -= dt) <= 0) { T.wait = 1.5 + Math.random() * 3; const a = Math.random() * 6.28, r = Math.random() * T.roam; T.tx = T.hx + Math.cos(a) * r; T.tz = T.hz + Math.sin(a) * r; }
        else { const d = Math.hypot(T.tx - T.x, T.tz - T.z); sp = d > .1 ? .55 : 0; }
        const d = Math.hypot(T.tx - T.x, T.tz - T.z); if (sp && d > .02) { const ux = (T.tx - T.x) / d, uz = (T.tz - T.z) / d; T.x += ux * sp * dt; T.z += uz * sp * dt; T.o.rotation.y = Math.atan2(ux, uz); }
        if (Math.hypot(T.x - T.hx, T.z - T.hz) > T.roam + 3) { T.x = T.hx + (T.x - T.hx) * .98; T.z = T.hz + (T.z - T.hz) * .98; }
        T.vy = (T.vy || 0) - 9 * dt; T.hy = Math.max(0, (T.hy || 0) + T.vy * dt); if (T.hy === 0) T.vy = 0; const gy = ground(T.x, T.z);
        T.o.position.set(T.x, gy + T.hy + (sp ? Math.abs(Math.sin(clock * 14)) * .03 : 0), T.z); T.o.rotation.x = sp > 1 ? -.3 : Math.sin(clock * 6 + T.hx) * (sp ? 0 : .25); continue; }
      if (T.kind === 'ball') { const dm = Math.hypot(T.x - mx, T.z - mz); if (dm < .55 && (me?.v || 0) > 1 && T.vx * T.vx + T.vz * T.vz < 4) { const k = (me.v || 2) * 1.1; T.vx = (T.x - mx) / (dm || 1) * k; T.vz = (T.z - mz) / (dm || 1) * k; T.vy = 1.2; audio?.play('kick', { vol: .2 }); }   // (ridden or walked into: it goes)
        if (T.vx || T.vz || T.vy || T.yb > ground(T.x, T.z) + .13) { T.x += T.vx * dt; T.z += T.vz * dt; T.vy -= 9 * dt; T.yb += T.vy * dt; const gy = ground(T.x, T.z) + .12;
          if (T.yb < gy) { T.yb = gy; T.vy = Math.abs(T.vy) > 1 ? -T.vy * .45 : 0; const f = Math.pow(.35, dt); T.vx *= f; T.vz *= f; if (Math.hypot(T.vx, T.vz) < .05) T.vx = T.vz = 0; }
          T.o.position.set(T.x, T.yb, T.z); T.o.rotation.x += T.vz * dt / .12; T.o.rotation.z -= T.vx * dt / .12;
          if (Math.hypot(T.x - T.x0, T.z - T.z0) > 40 && !T.vx && !T.vz) { T.x = T.x0; T.z = T.z0; T.yb = ground(T.x, T.z) + .12; T.o.position.set(T.x, T.yb, T.z); } }
        continue; }
      if (T.kind === 'chaindog') { if (!dog && makeDog) { dog = { o: makeDog(null, .9) }; scene.add(dog.o.group); chain = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0)]), new THREE.LineBasicMaterial({ color: '#555a60' })); scene.add(chain); dog.T = T; }
        if (!dog || dog.T !== T) { const dm0 = Math.hypot(T.cx - mx, T.cz - mz); if (dog && dm0 < Math.hypot(dog.T.cx - mx, dog.T.cz - mz) - 20) dog.T = T; continue; }   // (one dog: at the kennel nearest you)
        const dm = Math.hypot(T.cx - mx, T.cz - mz), angry = dm < 10; let tx = T.cx, tz = T.cz;
        if (angry) { const ux = (mx - T.post.x) / (Math.hypot(mx - T.post.x, mz - T.post.z) || 1), uz = (mz - T.post.z) / (Math.hypot(mx - T.post.x, mz - T.post.z) || 1); tx = T.post.x + ux * T.len; tz = T.post.z + uz * T.len; }
        const d = Math.hypot(tx - T.dx, tz - T.dz), sp = angry ? 5 : 1.2; if (d > .05) { const st = Math.min(d, sp * dt); T.dx += (tx - T.dx) / d * st; T.dz += (tz - T.dz) / d * st; }
        const g = dog.o.group; g.position.set(T.dx, ground(T.dx, T.dz), T.dz); g.rotation.y = angry ? Math.atan2(mx - T.dx, mz - T.dz) : Math.atan2(T.dx - T.post.x, T.dz - T.post.z);
        if (angry && (T.bark -= dt) <= 0) { T.bark = .45 + Math.random() * .5; audio?.play('bark', { vol: Math.max(.2, 1 - dm / 12) }); if (dog.o.jaw) dog.o.jaw.rotation.x = .5; } else if (dog.o.jaw) dog.o.jaw.rotation.x *= .85;
        if (angry) g.position.y += Math.abs(Math.sin(clock * 16)) * .06;
        chain.geometry.setFromPoints([V(T.post.x, T.post.y, T.post.z), V(T.dx, g.position.y + .35, T.dz)]); continue; }
      if (T.kind === 'shrine') { if (T.out) { if ((T.relight -= dt) <= 0) { T.out = false; T.flames.forEach(f => { f.visible = true; }); } } else T.flames.forEach((f, n) => { f.scale.y = .8 + Math.abs(Math.sin(clock * (9 + n * 2.3) + n)) * .5; }); continue; }
      if (T.kind === 'beds') { T.cool = (T.cool || 0) - dt; if (Math.hypot(T.x - mx, T.z - mz) < T.r - .4 && T.cool <= 0) { T.cool = 7; say?.(V(T.x, T.y + 2, T.z), ['ZEJDŹ Z GRZĄDEK!', 'MOJE POMIDORY!', 'ZARAZ CIĘ GRABIAMI!', 'TU SIĘ NIE JEŹDZI, TU ROŚNIE!'][Math.random() * 4 | 0]); } continue; }
      if (T.kind === 'loot') { if (!T.taken && foot && Math.hypot(T.x - mx, T.z - mz) < T.r) { T.taken = true; T.o.visible = false; onLoot?.(T); } continue; }
      if (T.kind === 'caravan') { if (T.doorT > 0 && (T.doorT -= dt) <= 0) { T.door.position.x = -.4; T.door.rotation.y = 0; }
        if ((smokeT -= dt) <= 0 && Math.hypot(T.x - mx, T.z - mz) < 60) { smokeT = .5; const p = T.pipe.getWorldPosition(V(0, 0, 0)); puff(p.x, p.y + .3, p.z, 1, '#a9a49a', 1.6); } }
      if (T.kind === 'swing' && T.amp > .002) { T.amp *= Math.pow(.86, dt); T.pivot && (T.pivot.rotation.x = Math.sin(clock * T.w) * T.amp); continue; }
      if (T.kind === 'cone' && T.down) { T.tip = Math.min(Math.PI / 2, T.tip + dt * 6); const sp = Math.hypot(T.vx, T.vz); if (sp > .02) { T.o.position.x += T.vx * dt; T.o.position.z += T.vz * dt; const k = Math.max(0, 1 - dt * 3.2); T.vx *= k; T.vz *= k; T.yaw += T.spin * dt * Math.min(1, sp); }
        T.o.quaternion.setFromAxisAngle(UP, T.yaw); T.o.rotateOnWorldAxis(T.axis, T.tip); T.x = T.o.position.x; T.z = T.o.position.z; continue; }
      if (T.fall) { const F = T.fall; F.t = Math.min(1, F.t + dt * 2.2); const a = F.t * F.t * (Math.PI / 2 - .12); T.o.quaternion.copy(T.q0); T.o.rotateOnWorldAxis(T.axis, a);
        if (F.t < 1) { T.o.position.x += F.dx * dt * .6; T.o.position.z += F.dz * dt * .6; } else if (!F.done) { F.done = true; puff(T.o.position.x + F.dx * .9, T.y + .1, T.o.position.z + F.dz * .9, 6, '#cfc8b8', 1.2); } continue; }
      if (T.flagT > 0) { T.flagT -= dt; if (T.flagT <= 0) T.mb.flag.rotation.x = T.mb.done ? -Math.PI / 2 : 0; }
      if (T.wv === 0 && T.wob === 0) continue;
      const k = T.kind === 'tree' ? 18 : T.kind === 'pole' ? 60 : 90, damp = T.kind === 'tree' ? 3.2 : 7; T.wv += (-T.wob * k - T.wv * damp) * dt; T.wob += T.wv * dt;
      if (Math.abs(T.wob) < .0004 && Math.abs(T.wv) < .002) { T.wob = 0; T.wv = 0; }
      const amt = T.kind === 'tree' ? .035 : T.kind === 'pole' ? (T.soft || T.carpet ? .06 : .01) : T.kind === 'caravan' ? .03 : .06;
      if (T.kind === 'bush') T.parts.forEach((p, n) => p.scale.copy(T.s0[n]).multiplyScalar(1 + T.wob * .08 * (n % 2 ? -1 : 1)));
      else { T.o.quaternion.copy(T.q0); T.o.rotateOnWorldAxis(T.axis, T.wob * amt); } }
    // the leaves coming down: a sway side to side as they go, a turn; down, they stay
    for (let n = falling.length - 1; n >= 0; n--) { const L = falling[n]; if (L.delay > 0) { L.delay -= dt; continue; }
      L.ph += dt * L.sp; L.y += L.vy * dt; L.x += Math.sin(L.ph) * .5 * dt; L.z += Math.cos(L.ph * .7) * .3 * dt; L.ry += dt * 1.5;
      if (L.y <= L.g + .02) { lie(L); fallM.setMatrixAt(L.i, _m.makeScale(0, 0, 0)); fallFree.push(L.i); falling.splice(n, 1); continue; }
      _e.set(Math.sin(L.ph) * .7, L.ry, Math.cos(L.ph) * .5); _q.setFromEuler(_e); _m.compose(_p.set(L.x, L.y, L.z), _q, _s.set(1, 1, 1)); fallM.setMatrixAt(L.i, _m); }
    if (falling.length || fallFree.length < FALLN) fallM.instanceMatrix.needsUpdate = true;
    for (let n = puffs.length - 1; n >= 0; n--) { const P = puffs[n]; P.t += dt; const u = P.t / P.life; if (u >= 1) { scene.remove(P.m); P.m.material.dispose(); puffs.splice(n, 1); continue; }
      if (P.g) P.vy -= 9 * dt; P.m.position.x += P.vx * dt; P.m.position.y += P.vy * dt; P.m.position.z += P.vz * dt; P.m.scale.setScalar((1 + u * 2.4) * P.s); P.m.material.opacity = .45 * (1 - u); }
  }
  return { strike, hit, near, bump, splash, update, things };
}
