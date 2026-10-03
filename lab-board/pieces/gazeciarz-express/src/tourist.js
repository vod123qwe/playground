// The tourist quarter (docs/trasy-tematyczne.md): its people.
//   tourists: in little groups on the park paths, on the square and on the pavements, a camera each; they stand where they like
//     (in his way on the narrow paths), photograph everything (a flash: him too, as he goes by), ask the way; spoken to, each in
//     broken Polish of his own; a paper: a souvenir; kicked: a review with one star
//   the guide with her umbrella and her group, along a park path and back, telling them about whatever is there (him too)
//   picnics on the lawn: older folk sitting on their blankets; a paper for the sandwiches; one of them, spoken to a third time, has
//     something to say about her husband
//   skaters at the skatepark
// createTourist({ THREE, toon, track, scene, residents }) → the same shape as the Bronx's: { id, people, lights, update, kick, talk, paper }

export function createTourist({ THREE, toon, track, scene, residents }) {
  let a = 705; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, NET = track.net, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c);
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return { x: A.p.x + A.r.x * d, z: A.p.z + A.r.z * d, yaw: Math.atan2(A.f.x, A.f.z) }; };
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  const SAY = deck(['EKSKIUZ MI, GDZIE JEST RYNEK? ...A, TO JEST RYNEK? ŁAŁ.', 'ZDJĘCIE? Z PANEM? NIE, Z GOŁĘBIEM. PAN TROCHĘ ZASŁANIA.', 'U NAS GAZETY PRZYNOSI DRON. ALE DRON NIE MA TAKICH ŁYDEK.', 'PIEROGI? GDZIE PIEROGI? MAPA MÓWI, ŻE TU SĄ PIEROGI.', 'DZIEŃ DOBRY! TO JEDYNE, CO UMIEM. I „DZIĘKUJĘ”. I „JESZCZE JEDNO PIWO”.', 'TEN KOŚCIÓŁ JEST STARSZY NIŻ MÓJ KRAJ. A TEN ROWER?']);
  const SHOUT = deck(['FOTO! FOTO!', 'OH, GAZETA NA KÓŁKACH!', 'SMAJL! ...NIE ZDĄŻYŁ.', 'KLIK! JESZCZE RAZ, ZA SZYBKO!', 'ŁOKAL KALCZER! KLIK!']);
  const PAPER = deck(['SUWENIR! DZIĘKUJĘ! NIC NIE ROZUMIEM, ALE OPRAWIĘ W RAMKĘ.', 'O! AUTENTIK! ILE KOSZTUJE? NIC? JESZCZE LEPIEJ!', 'GAZETA! TERAZ JESTEM JAK LOKALNY. TYLKO MNIEJ ZMĘCZONY.']);
  const KICK = deck(['SKANDAL! NAPISZĘ RECENZJĘ! JEDNA GWIAZDKA!', 'TO JEST TEN LOKALNY FOLKLOR?!', 'MOJA AMBASADA SIĘ O TYM DOWIE!']);
  const GUIDE = deck(['PROSZĘ PAŃSTWA, PO LEWEJ GAZECIARZ. GATUNEK RZADKI, PORANNY.', 'NIE KARMIMY GAZECIARZA! I NIE STAJEMY NA ŚRODKU ŚCIEŻKI. PROSZĘ PAŃSTWA!', 'TEN PARK ZAŁOŻONO W DZIEWIĘTNASTYM WIEKU. TEGO PANA NA ROWERZE TROCHĘ PÓŹNIEJ.', 'PROSZĘ TRZYMAĆ SIĘ PARASOLKI! PARASOLKA WIE, GDZIE JEST TOALETA.']);
  const PIC_SAY = deck(['SIADAJ, MŁODY, JAJKO NA TWARDO?', 'MY TU CO NIEDZIELĘ OD TRZYDZIESTU LAT. TEN KOC TEŻ.', 'NIE ŚPIESZ SIĘ TAK. PARK NIE UCIEKNIE. MY UCIEKNIEMY, JAK ZACZNIE PADAĆ.']);
  const PIC_PAPER = deck(['O, NA KANAPKI JAK ZNALAZŁ!', 'DZIĘKUJĘ, SYNKU. KRZYŻÓWKA BĘDZIE NA DESER.', 'GAZETA? A, BO MY JESZCZE CZYTAMY. NA PAPIERZE. JAK LUDZIE.']);
  const PIC_ONCE = 'MÓJ MĄŻ TEŻ TAK PĘDZIŁ NA ROWERZE. DO MNIE. CZTERDZIEŚCI LAT TEMU. DO DZIŚ JEŹDZI, TYLKO WOLNIEJ. I DO KUCHNI.';
  const SKATE = deck(['EJ, ZJEDŹ NA RAMPĘ, POKAŻ, CO UMIESZ!', 'Z GAZETAMI NA RAMPĘ? SZACUN.', 'SKOCZ Z TEJ DUŻEJ. NO DAWAJ.']);
  const people = [], lights = [], flashes = [];
  const flashM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthWrite: false });
  function body(key, cols) { return residents.spawn(key).then(o => { if (!o) return null; o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(cols[rnd() * cols.length | 0]); }); return o; }); }
  const BRIGHT = ['#e05a4a', '#3a8ad0', '#f0c040', '#5ab060', '#e070b0', '#f0f0e8', '#7060c0'];
  // a tourist standing (where: x, z), his camera before him
  function tourist(x, z, yaw, where) { const p = { kind: 'tourist', x, z, y: gy(x, z), yaw, where, g: null, o: null, flashT: 1 + rnd() * 6, paperT: 0, talks: 0 };
    people.push(p); body(['shopper', 'lady', 'suit', 'jogger', 'kid', 'dogman'][rnd() * 6 | 0], BRIGHT).then(o => { if (!o) return; p.o = o; p.g = o.G; o.acts.idle?.play(); if (o.acts.idle) o.acts.idle.time = rnd() * 3;
      const cam = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .08), M('#17181b')); cam.position.set(0, 1.35, .32); o.G.add(cam); o.G.position.set(p.x, p.y, p.z); o.G.rotation.y = yaw; }); return p; }
  // ---------- where they are: on each park path (groups in the middle of it), on the square, by the food trucks ----------
  for (const c of NET?.shortcuts || []) { const sg = track.INNER, O = 30, LEN = c.b - c.a > 0 ? c.b - c.a : c.b - c.a + N;
    for (const f of [.25, .5, .8]) { const i = c.a + Math.round(LEN * f), q = at(i, sg * O); for (let k = 0; k < 2 + (rnd() < .5 ? 1 : 0); k++) tourist(q.x + (rnd() - .5) * 1.6, q.z + (rnd() - .5) * 1.6, rnd() * 6.28, 'path'); } }
  for (const s of NET?.spotsT || []) { if (s.kind !== 'square') continue; for (let k = 0; k < 6; k++) { const q = at(s.i + Math.round((rnd() - .5) * 20 / ds), s.d + (rnd() - .5) * 6); tourist(q.x, q.z, rnd() * 6.28, 'square'); } }
  for (let k = 0; k < 5; k++) { const i = Math.round(N * (k + .5) / 5), sd = rnd() < .5 ? -1 : 1, q = at(i, sd * 5.4); tourist(q.x, q.z, q.yaw + (rnd() - .5) * 2, 'pavement'); }
  // ---------- the guide and her group, along the first park path and back ----------
  const tour = { c: NET?.shortcuts?.[0], u: .1, dir: 1, members: [], sayT: 4, stopT: 0 };
  if (tour.c) { const keys = ['lady', 'shopper', 'suit', 'kid', 'lady'];
    keys.forEach((key, k) => body(key, k ? BRIGHT : ['#c23a2e']).then(o => { if (!o) return; o.acts.walk?.play(); o.acts.idle?.play(); o.acts.idle?.setEffectiveWeight(0);
      const p = { kind: k ? 'tourist' : 'guide', o, g: o.G, x: 0, z: 0, y: 0, off: k * 1.4, lat: k ? (k % 2 ? .7 : -.7) : 0, paperT: 0, talks: 0 }; if (!k) { const um = new THREE.Group(); um.add(new THREE.Mesh(new THREE.ConeGeometry(.5, .25, 8), M('#efc930'))); um.children[0].position.y = 2.3; um.add(new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.1, 5), M('#2a2c30'))); um.children[1].position.y = 1.75; um.position.set(.25, 0, .1); o.G.add(um); }
      tour.members.push(p); people.push(p); })); }
  function stepTour(dt, R) { if (!tour.members.length) return null; const c = tour.c, LEN = ((c.b - c.a) % N + N) % N, sg = track.INNER; tour.sayT -= dt; tour.stopT -= dt;
    if (tour.stopT <= 0) { tour.u += tour.dir * .9 * dt / (LEN * ds); if (tour.u > .92 || tour.u < .08) { tour.dir = -tour.dir; tour.stopT = 6; } }
    let near = 1e9;
    for (const p of tour.members) { const u = tour.u - tour.dir * p.off / (LEN * ds), i = c.a + Math.round(LEN * Math.max(0, Math.min(1, u))), q = at(i, sg * (30 + p.lat)); p.x = q.x; p.z = q.z; p.y = gy(p.x, p.z, wrap(i)); p.g.position.set(p.x, p.y, p.z); p.g.rotation.y = q.yaw + (tour.dir < 0 ? Math.PI : 0);
      if (p.o.acts.walk) p.o.acts.walk.timeScale = tour.stopT > 0 ? 0 : .9; p.o.mixer.update(dt); p.paperT = Math.max(0, p.paperT - dt); near = Math.min(near, Math.hypot(R.x - p.x, R.z - p.z)); }
    if (near < 10 && tour.sayT <= 0) { tour.sayT = 10 + rnd() * 6; return { kind: 'shout', p: tour.members[0], text: GUIDE() }; } return null; }
  // ---------- picnics: older folk sitting on their blankets ----------
  for (const pc of NET?.picnics || []) { const q = at(pc.i, pc.d); for (let k = 0; k < 2; k++) { const p = { kind: 'picnic', x: q.x + (k - .5) * .9, z: q.z + (k ? .2 : -.2), y: 0, g: null, o: null, paperT: 0, talks: 0, once: false };
      people.push(p); residents.spawn(k ? 'grandpa' : 'granma').then(o => { if (!o) return; p.o = o; p.g = o.G; o.acts.idle?.play(); if (o.acts.idle) o.acts.idle.time = rnd() * 3; p.y = gy(p.x, p.z, pc.i); o.G.position.set(p.x, p.y - .42, p.z); o.G.rotation.y = pc.yaw + k * Math.PI; }); } }
  // ---------- skaters ----------
  for (const s of NET?.spotsT || []) { if (s.kind !== 'skate') continue; for (let k = 0; k < 2; k++) { const q = at(s.i + Math.round((k ? 4 : -3) / ds), s.d + (k ? 2 : -2)), p = { kind: 'skater', x: q.x, z: q.z, y: gy(q.x, q.z), g: null, o: null, paperT: 0, talks: 0 };
      people.push(p); body('teen', ['#30303a', '#c23a2e', '#f0f0e8']).then(o => { if (!o) return; p.o = o; p.g = o.G; o.acts.idle?.play(); const b = new THREE.Mesh(new THREE.BoxGeometry(.22, .04, .8), M('#cf5a3e')); b.position.set(.4, .06, .2); b.rotation.z = .5; o.G.add(b); o.G.position.set(p.x, p.y, p.z); o.G.rotation.y = q.yaw + k * 2; }); } }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = [];
    { const e = stepTour(dt, R); if (e) ev.push(e); }
    for (const p of people) { if (!p.o || p.kind === 'guide' || tour.members.includes(p)) continue; p.paperT = Math.max(0, p.paperT - dt);
      const dx = R.x - p.x, dz = R.z - p.z, dist = Math.hypot(dx, dz); if (dist > 70) continue; p.o.mixer.update(dt);   // (far off: still, not animated)
      if (p.kind === 'tourist') { p.flashT -= dt;
        // (a photo now and then; him going by close and quick: a photo of him, and something said)
        if (p.flashT <= 0 && dist < 60) { p.flashT = 5 + rnd() * 9; flash(p, dist < 9 && Math.abs(R.v) > 2); if (dist < 9 && Math.abs(R.v) > 2 && rnd() < .5) ev.push({ kind: 'shout', p, text: SHOUT() }); } }
      if (p.kind === 'skater' && dist < 8 && Math.abs(R.v) > 2 && (p.sayT = (p.sayT || 0) - dt) <= 0) { p.sayT = 20; ev.push({ kind: 'shout', p, text: SKATE() }); }
      // (ridden into: they stagger, he wobbles)
      if (p.kind !== 'picnic' && !R.foot && dist < .6 && Math.abs(R.v) > 1.5 && !(p.bumpT > 0)) { p.bumpT = 3; ev.push({ kind: 'bump', p }); } p.bumpT = Math.max(0, (p.bumpT || 0) - dt); }
    for (let k = flashes.length - 1; k >= 0; k--) { const f = flashes[k]; f.t -= dt; if (f.t <= 0) { scene.remove(f.m); flashes.splice(k, 1); } }
    return ev; }
  function flash(p, atHim) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), flashM); m.position.copy(p.g.position).add(V(0, 1.4, 0)); m.lookAt(p.g.position.clone().add(V(Math.sin(p.g.rotation.y), 1.4, Math.cos(p.g.rotation.y)))); scene.add(m); flashes.push({ m, t: .09 }); }
  function kick(p) { if (p.kind === 'picnic') return 'NO WIESZ CO?! NA PIKNIKU?!'; if (p.kind === 'skater') return 'SPOKO, SPOKO. TYLKO RAMPA JEST DO SKAKANIA, NIE JA.'; if (p.kind === 'guide') return 'PROSZĘ PAŃSTWA, TO TEŻ JEST LOKALNY ZWYCZAJ. PROSZĘ NIE NAŚLADOWAĆ!'; return KICK(); }
  function talk(p) { p.talks++; if (p.kind === 'picnic') { if (p.talks === 3 && !p.once) { p.once = true; return PIC_ONCE; } return PIC_SAY(); } if (p.kind === 'guide') { tour.stopT = 5; return GUIDE(); } if (p.kind === 'skater') return SKATE(); return SAY(); }
  function paper(P) { for (const p of people) { if (!p.g || p.paperT > 0 || Math.hypot(p.x - P.x, p.z - P.z) > .9) continue; p.paperT = 40; return { p, text: p.kind === 'picnic' ? PIC_PAPER() : p.kind === 'guide' ? 'DZIĘKUJĘ! PROSZĘ PAŃSTWA, PRASA LOKALNA, PROSZĘ PODAWAĆ DALEJ!' : p.kind === 'skater' ? 'GAZETA NA RAMPIE. TO JEST DOPIERO TRIK.' : PAPER(), who: p.kind }; } return null; }
  return { id: 'tourist', people, lights, update, kick, talk, paper };
}
