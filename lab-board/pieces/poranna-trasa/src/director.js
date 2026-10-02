// The director: something is always going on. When nothing has happened a few seconds while he rides, a small thing happens on the road
// ahead of him, of the place's kind (docs/trasy-tematyczne.md: the road must be interesting in itself):
//   a ball rolling out (a kid's shout after it), a cart from the shop rolling across, a barrel off a truck, a hay bale off a trailer;
//   a cat across the road, hens across the road, pigeons bursting up off it;
//   a parked car's door opened right before him (the driver did not look).
// Each one: ridden into, it does what it would (a ball bounces off, a cart or a barrel or a door has him down, hens and a cat scatter).
// createDirector({ THREE, toon, track, scene }) → { update(dt, R) → events[], poke() }; R: { x, z, v, yaw, foot, air, hint, busy }
//   events: { kind: 'crash' | 'wobble' | 'shout' | 'flap', at?, text? }; poke(): something else happened (the clock starts again)

export function createDirector({ THREE, toon, track, scene }) {
  const { S, N, ds } = track, wrap = i => ((i % N) + N) % N, M = c => toon(c), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return { x: A.p.x + A.r.x * d, z: A.p.z + A.r.z * d, A }; };
  const pick = a => a[Math.random() * a.length | 0];
  // (what can happen where)
  const DECK = { peryferia: ['ball', 'ball', 'cat', 'ball'], wies: ['hens', 'hens', 'bale', 'cat'], peryferia2: ['barrel', 'cat', 'barrel', 'ball'],
    miasto: ['door', 'pigeons', 'cart', 'ball', 'door'], bronx: ['cart', 'cat', 'ball', 'door', 'cart'] };
  const deck = DECK[track.region] || DECK.peryferia;
  const live = []; let quiet = 4, last = '';
  function poke() { quiet = Math.max(quiet, 5 + Math.random() * 4); }
  function spawn(R) { const q = track.probe(R.x, R.z, R.hint), along = Math.sign(Math.sin(R.yaw) * S[q.i].f.x + Math.cos(R.yaw) * S[q.i].f.z) || 1, i = wrap(q.i + along * Math.round((26 + Math.random() * 12) / ds));
    let kind = pick(deck); if (kind === last) kind = pick(deck); last = kind;
    if (kind === 'door') { const cars = (track.kerbCars || []).filter(K => K.o.visible && Math.abs(((K.i - i) % N + N * 1.5) % N - N / 2) * ds < 14); if (!cars.length) kind = deck.includes('cart') ? 'cart' : 'ball'; else return door(cars[0]); }
    if (kind === 'hens' || kind === 'cat' || kind === 'pigeons') return critters(kind, i);
    return roller(kind, i); }
  // ---------- a thing rolling across the road: a ball, a cart, a barrel, a hay bale ----------
  function roller(kind, i) { const sd = Math.random() < .5 ? -1 : 1, A = S[i], g = new THREE.Group(), r = kind === 'ball' ? .22 : kind === 'bale' ? .6 : kind === 'barrel' ? .32 : .45;
    if (kind === 'ball') g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(pick(['#cf5a3e', '#3b8ad0', '#f0c040']))));
    else if (kind === 'bale') { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.1, 12), M('#d9b96a')); b.rotation.x = Math.PI / 2; g.add(b); }
    else if (kind === 'barrel') { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .9, 12), M('#3b6e9a')); b.rotation.x = Math.PI / 2; g.add(b); }
    else { const b = new THREE.Group(); b.add(new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .85), M('#b9b2a2'))); b.children[0].position.y = .55; for (const [x, z] of [[-.25, -.35], [.25, -.35], [-.25, .35], [.25, .35]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .05, 8), M('#2a2c30')); w.rotation.z = Math.PI / 2; w.position.set(x, .07, z); b.add(w); } g.add(b); }
    const d0 = sd * (track.ROAD + 4.5), p = at(i, d0); g.position.set(p.x, gy(p.x, p.z, i) + (kind === 'cart' ? 0 : r), p.z); g.rotation.y = Math.atan2(A.f.x, A.f.z); scene.add(g);
    const sp = kind === 'ball' ? 4.2 : kind === 'cart' ? 2.2 : 3.2;
    live.push({ kind, g, i, d: d0, v: -sd * sp, r, t: 0, hit: false, rolling: kind !== 'cart' });
    return kind === 'ball' ? { kind: 'shout', at: V(p.x, gy(p.x, p.z, i) + 1.6, p.z), text: pick(['PIŁKA!', 'ŁAP JĄ!', 'O NIE, MOJA PIŁKA!']) } : kind === 'bale' ? { kind: 'shout', at: V(p.x, gy(p.x, p.z, i) + 2, p.z), text: 'BELA POSZŁA!' } : null; }
  // ---------- little ones across the road: hens (a flock), a cat, pigeons (up they go as he comes) ----------
  function critters(kind, i) { const sd = Math.random() < .5 ? -1 : 1, n = kind === 'cat' ? 1 : kind === 'hens' ? 5 : 9, list = [];
    for (let k = 0; k < n; k++) { const g = new THREE.Group(), col = kind === 'cat' ? pick(['#2a2c30', '#c98a45', '#9aa0a4']) : kind === 'hens' ? pick(['#f6f3ea', '#c98a45', '#8e5a2e']) : pick(['#8a9094', '#6f757d', '#b9b2a2']);
      const b = new THREE.Mesh(new THREE.BoxGeometry(kind === 'cat' ? .22 : .2, kind === 'cat' ? .22 : .2, kind === 'cat' ? .5 : .26), M(col)); b.position.y = .18; g.add(b);
      const h = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), M(col)); h.position.set(0, kind === 'cat' ? .3 : .32, kind === 'cat' ? .28 : .14); g.add(h);
      if (kind === 'hens') { const c = new THREE.Mesh(new THREE.BoxGeometry(.04, .06, .06), M('#cf3a2e')); c.position.set(0, .41, .15); g.add(c); }
      if (kind === 'cat') { const t = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .35), M(col)); t.position.set(0, .3, -.4); t.rotation.x = -.6; g.add(t); }
      const off = (Math.random() - .5) * (kind === 'pigeons' ? 5 : 3), d0 = kind === 'pigeons' ? (Math.random() - .5) * 5 : sd * (track.ROAD + 3 + Math.random()), p = at(i + Math.round(off / ds), d0);
      g.position.set(p.x, gy(p.x, p.z, i), p.z); scene.add(g); list.push({ g, d: d0, off, vy: 0, fly: false, ph: Math.random() * 6 }); }
    live.push({ kind, list, i, v: -sd * (kind === 'cat' ? 5 : 2.2), t: 0, hit: false });
    return kind === 'hens' ? { kind: 'shout', at: V(at(i, sd * 6).x, 1.5 + gy(at(i, sd * 6).x, at(i, sd * 6).z, i), at(i, sd * 6).z), text: pick(['KO-KO-KO!', 'KOKODAK!']) } : null; }
  // ---------- a parked car's door, opened into the road before him ----------
  function door(K) { const c = K.o; if (c.userData.doorOpen) return null; c.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(c), sd = Math.sign(K.P0.d) || 1;
    const g = new THREE.Group(), d = new THREE.Mesh(new THREE.BoxGeometry(.06, .85, 1), M('#9aa0a4')); d.position.set(0, 0, -.5); g.add(d);
    const A = S[wrap(K.i)], half = Math.max(.8, (box.max.x - box.min.x) * .25), p = at(K.i + Math.round(.4 / ds), K.P0.d - sd * .95);
    g.position.set(p.x, gy(p.x, p.z, K.i) + .75, p.z); g.rotation.y = Math.atan2(A.f.x, A.f.z) + (K.P0.d < 0 ? Math.PI : 0); scene.add(g); c.userData.doorOpen = true;
    live.push({ kind: 'door', g, K, sd, t: 0, hit: false, p });
    return { kind: 'shout', at: V(p.x, gy(p.x, p.z, K.i) + 1.7, p.z), text: pick(['OJ, SORRY!', 'NIE WIDZIAŁEM CIĘ!', 'GDZIE PĘDZISZ?!']) }; void half; }
  // ---------- each frame ----------
  function update(dt, R) { const ev = [];
    if (!R.foot && Math.abs(R.v) > 3 && !R.busy) { quiet -= dt; if (quiet <= 0) { quiet = 6 + Math.random() * 5; const e = spawn(R); if (e) ev.push(e); } }
    for (let k = live.length - 1; k >= 0; k--) { const L = live[k]; L.t += dt; const A = S[L.i];
      if (L.list) { for (const c of L.list) { if (L.kind === 'pigeons') { const dd = Math.hypot(R.x - c.g.position.x, R.z - c.g.position.z); if (!c.fly && dd < 7) { c.fly = true; c.vy = 3 + Math.random() * 2; if (!L.flapped) { L.flapped = true; ev.push({ kind: 'flap' }); } }
            if (c.fly) { c.vy -= 1.5 * dt; c.g.position.y += c.vy * dt; c.g.position.x += Math.sin(c.ph) * 3 * dt; c.g.position.z += Math.cos(c.ph) * 3 * dt; } continue; }
          c.d += L.v * dt; const p = at(L.i + Math.round(c.off / ds), c.d); c.g.position.set(p.x, gy(p.x, p.z, L.i) + Math.abs(Math.sin(L.t * 12 + c.ph)) * .05, p.z); c.g.rotation.y = Math.atan2(A.f.x, A.f.z) + (L.v > 0 ? -Math.PI / 2 : Math.PI / 2);
          if (!L.hit && !R.foot && (R.x - p.x) ** 2 + (R.z - p.z) ** 2 < .45) { L.hit = true; ev.push({ kind: 'wobble', at: V(p.x, p.y, p.z), text: L.kind === 'cat' ? 'MIAU!' : 'KO-KO!' }); } }
        if (L.t > 7) { for (const c of L.list) scene.remove(c.g); live.splice(k, 1); } continue; }
      if (L.kind === 'door') { const u = Math.min(1, L.t / .35), close = L.t > 3.4 ? Math.min(1, (L.t - 3.4) / .4) : 0; L.g.children[0].position.z = -.5; L.g.rotation.y = Math.atan2(A.f.x, A.f.z) + (L.K.P0.d < 0 ? Math.PI : 0) + L.sd * (u - close) * 1.1 * (L.K.P0.d < 0 ? -1 : 1);
        L.g.updateMatrixWorld(true); const tip = L.g.localToWorld(V(0, 0, -1));
        if (!L.hit && !R.foot && !R.air && u > .5 && close < .5 && (R.x - tip.x) ** 2 + (R.z - tip.z) ** 2 < .8) { L.hit = true; ev.push({ kind: 'crash', at: tip, text: 'DRZWI!' }); }
        if (L.t > 4) { scene.remove(L.g); L.K.o.userData.doorOpen = false; live.splice(k, 1); } continue; }
      // (a roller)
      L.d += L.v * dt; const p = at(L.i, L.d); L.g.position.set(p.x, gy(p.x, p.z, L.i) + (L.kind === 'cart' ? 0 : L.r) + (L.kind === 'ball' ? Math.abs(Math.sin(L.t * 6)) * .25 : 0), p.z); if (L.rolling) L.g.children[0].rotation.z += L.v / L.r * dt * (L.kind === 'ball' ? 1 : 0); if (L.kind !== 'ball' && L.kind !== 'cart') L.g.children[0].rotation.y += L.v / L.r * dt;
      if (!L.hit && !R.foot && !R.air && (R.x - p.x) ** 2 + (R.z - p.z) ** 2 < (L.r + .45) ** 2) { L.hit = true; if (L.kind === 'ball') { L.v *= -1.8; ev.push({ kind: 'wobble', at: V(p.x, p.y + .5, p.z), text: 'PAC!' }); } else ev.push({ kind: 'crash', at: V(p.x, p.y + .5, p.z), text: L.kind === 'cart' ? 'WÓZEK!' : 'BUM!' }); }
      if (L.t > 7 || Math.abs(L.d) > track.ROAD + 9) { scene.remove(L.g); live.splice(k, 1); } }
    return ev; }
  return { update, poke };
}
