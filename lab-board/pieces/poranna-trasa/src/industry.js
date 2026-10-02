// The industrial quarter (docs/trasy-tematyczne.md): what moves in it, by the route's map.
//   builders by the sites (a helmet, a vest), each his own way of talking; they call out as he rides by; spoken to, kicked, a paper
//   on the building site's map: loads of bricks on gantries over the road, running back and forth on the cable (their shadow on the
//     road shows where): ridden into, he is down
//   on the sidings' map: forklifts crossing the road between the halls (a beep as they go): in his way, he is down
// createIndustry({ THREE, toon, track, scene, residents }) → the locals' shape: { id, people, lights, update(dt, R) → events, kick, talk, paper }
//   events: { kind: 'shout' | 'load' | 'forklift', p?, text? }

export function createIndustry({ THREE, toon, track, scene, residents }) {
  let a = 909; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c), kind = track.industry || 'osiedle';
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return { x: A.p.x + A.r.x * d, z: A.p.z + A.r.z * d, A }; };
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  // ---------- the builders: who they are ----------
  const CREW = {
    brygadzista: { talk: ['NA BUDOWIE SĄ DWA TEMPA: POWOLI I JUTRO.', 'TEN DOM BĘDZIE STAŁ STO LAT. JAK NIKT W NIEGO NIE WJEDZIE.', 'PLANY? PLANY SĄ W GŁOWIE. W MOJEJ. NIE PYTAJ.'], paper: 'GAZETA? DOBRA, PRZECZYTAM NA PRZERWIE. PRZERWA JEST OD SIÓDMEJ DO ÓSMEJ.' },
    pomocnik: { talk: ['JA TYLKO NOSZĘ. CO NOSZĘ, TO MI POWIEDZĄ JUTRO.', 'PIERWSZY DZIEŃ. TRZECI ROK.', 'SZEF KAZAŁ UDAWAĆ, ŻE PRACUJĘ. UDAJĘ.'], paper: 'O, DZIĘKI! BĘDĘ UDAWAŁ, ŻE CZYTAM.' },
    operator: { talk: ['Z KABINY WIDAĆ CAŁE OSIEDLE. I TWÓJ ROWER. JEST KRZYWY.', 'JA TĄ KOPARKĄ POTRAFIĘ OTWORZYĆ PIWO. NIE PIJĘ, ALE POTRAFIĘ.', 'NIE STAWAJ POD ŁYŻKĄ. ŁYŻKA NIE PATRZY.'], paper: 'RZUĆ DO KABINY! ...NO, PRAWIE.' },
    kierownik: { talk: ['TERMIN JEST TERMINEM. PRZESUWA SIĘ, ALE JEST.', 'DEWELOPER MÓWI „NA WCZORAJ”. JA MÓWIĘ „NA KIEDYŚ”.', 'NAPISZ W GAZECIE, ŻE IDZIE SPRAWNIE. TYLKO NIE PISZ GDZIE.'], paper: 'DZIĘKUJĘ. ZOBACZYMY, CO PISZĄ O NAS. OBY NIC.' },
    murarz: { talk: ['CEGŁA TO NIE LEGO. CHOCIAŻ CZASEM PRZYDAŁBY SIĘ OBRAZEK.', 'POZIOMICA MÓWI, ŻE KRZYWO. POZIOMICA SIĘ NIE ZNA.', 'MÓJ DZIADEK STAWIAŁ TE BLOKI. TERAZ JA STAWIAM, ŻEBY WYGLĄDAŁY JAK STARE.'], paper: 'DO WIADRA Z ZAPRAWĄ NIE RZUCAJ! ...DZIĘKI.' },
    magazynier: { talk: ['PALETA, PALETA, PALETA. ŚNIĄ MI SIĘ PALETY.', 'WÓZEK MA PIERWSZEŃSTWO. ZAWSZE. NAWET PRZED SZEFEM.', 'O PIĄTEJ KAWA, O SZÓSTEJ GAZETA, O SIÓDMEJ JUŻ ZMĘCZONY.'], paper: 'KAWA I GAZETA. TERAZ MOGĘ PRACOWAĆ. ZA GODZINĘ.' } };
  const SHOUT = deck(['UWAGA, WYWROTKA!', 'KASK ZAŁÓŻ, MŁODY!', 'TU SIĘ BUDUJE, NIE ŚCIGA!', 'Z DROGI, ŁADUNEK IDZIE!', 'HEJ, GAZETA! RZUĆ NA RUSZTOWANIE!']);
  const KICK = deck(['EJ! BHP!', 'ZARAZ CIĘ ZABETONUJĘ!', 'TO JEST PLAC BUDOWY, A NIE RING!', 'SZEFIE! ON MNIE KOPNĄŁ!']);
  const people = [], lights = [], events = [];
  // (a builder: a body of the town's people, a vest, a helmet on his head)
  function builder(x, z, yaw, key) { const p = { kind: 'builder', key, P: CREW[key], x, z, y: gy(x, z), yaw, g: null, o: null, paperT: 0, talks: 0, sayT: 0 };
    people.push(p); residents.spawn(['suit', 'jogger', 'gardener', 'shopper'][people.length % 4]).then(o => { if (!o) return; p.o = o; p.g = o.G;
      o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(/pant|jean|trous|leg/i.test(q.material.name + q.name) ? '#3b4a5e' : '#e8742e'); });
      if (o.head) { const h = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 5, 0, 6.29, 0, 1.7), M(key === 'kierownik' ? '#f6f3ea' : '#efc930')); h.position.set(0, .1, 0); o.head.add(h); }
      o.acts.idle?.play(); if (o.acts.idle) o.acts.idle.time = rnd() * 3; o.G.position.set(p.x, p.y, p.z); o.G.rotation.y = yaw; }); return p; }
  { const keys = kind === 'bocznica' ? ['magazynier', 'magazynier', 'kierownik', 'operator'] : ['brygadzista', 'pomocnik', 'operator', 'kierownik', 'murarz', 'pomocnik', 'murarz', 'brygadzista'];
    const spots = kind === 'bocznica' ? (track.estate?.halls || []) : (track.estate?.sites || []);
    spots.slice(0, keys.length).forEach((S0, k) => { S0.g.updateMatrixWorld(true); const D = S0.hall ? 11 : 8, q = S0.g.localToWorld(V(S0.s * (D / 2 + 1.3), 0, (rnd() - .5) * 4)), f = S0.g.localToWorld(V(S0.s * (D / 2 + 5), 0, 0)); builder(q.x, q.z, Math.atan2(f.x - q.x, f.z - q.z), keys[k]); }); }

  // ---------- the building site's gantries over the road: a mast each side, a beam across, a trolley running on it with a load of bricks ----------
  const loads = [];
  if (kind === 'budowa') { const steel = M('#cf5a3e'), dark = M('#2a2c30'), shM = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .35, depthWrite: false });
    for (const f of [.12, .4, .9]) { const i = wrap(Math.round(N * f)), A = S[i], W = track.ROAD + 2.4, g = new THREE.Group(), yaw = Math.atan2(A.f.x, A.f.z);
      for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.4, 8, .4), steel); m.position.set(sd * W, 4, 0); g.add(m); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + .4, .5, .5), steel); beam.position.y = 8; g.add(beam);
      g.position.set(A.p.x, gy(A.p.x, A.p.z, i), A.p.z); g.rotation.y = yaw; scene.add(g); g.updateMatrixWorld(true);
      for (const sd of [-1, 1]) { const c = new THREE.Object3D(); c.position.copy(g.localToWorld(V(sd * W, 0, 0))); c.rotation.y = yaw; c.updateMatrixWorld(); track.addHit(c, { hx: .25, hz: .25, h: 8, kind: 'hard' }, i); }
      const tro = new THREE.Group(), cable = new THREE.Mesh(new THREE.BoxGeometry(.04, 5.6, .04), dark), pal = new THREE.Group(); cable.position.y = -2.8; tro.add(cable);
      pal.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, .15, 1.4), M('#9e7a4f'))); for (let q = 0; q < 12; q++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .26, .36), M(q % 3 ? '#c4552f' : '#a5432f')); b.position.set(-.33 + (q % 2) * .66, .22 + (q >> 2) * .26, ((q >> 1) % 2 - .5) * .7); pal.add(b); }   // (a pallet of bricks, stacked)
      pal.position.y = -6.2; tro.add(pal); tro.position.y = 8; g.add(tro);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(.85, 12).rotateX(-Math.PI / 2), shM); scene.add(sh);
      loads.push({ g, tro, pal, sh, i, W, ph: rnd() * 6, sp: .35 + rnd() * .2, hit: 0 }); } }

  // ---------- the sidings' forklifts: across the road between the halls and back, a pause each side, a beep as they go ----------
  const lifts = [];
  if (kind === 'bocznica') { const orange = M('#e8a020'), dark = M('#2a2c30'), steel = M('#8a9094');
    for (const f of [.15, .35, .62, .82]) { const i = wrap(Math.round(N * f)), sd = rnd() < .5 ? -1 : 1, g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, .9, 1.8), orange)); g.children[0].position.y = .65; const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .9), dark); cab.position.set(0, 1.55, -.2); g.add(cab);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(.9, 2.2, .1), steel); mast.position.set(0, 1.3, 1); g.add(mast); for (const x of [-.3, .3]) { const fk = new THREE.Mesh(new THREE.BoxGeometry(.1, .06, 1.1), steel); fk.position.set(x, .2, 1.55); g.add(fk); }
      const pal = new THREE.Mesh(new THREE.BoxGeometry(1, .5, 1), M('#c9a96a')); pal.position.set(0, .5, 1.6); g.add(pal); scene.add(g);
      lifts.push({ g, i, side: sd, u: sd, wait: 2 + rnd() * 8, beepT: 0 }); } }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0);
    for (const p of people) { if (!p.o) continue; const dist = Math.hypot(R.x - p.x, R.z - p.z); if (dist > 70) continue; p.o.mixer.update(dt); p.paperT = Math.max(0, p.paperT - dt); p.sayT -= dt;
      if (dist < 9 && Math.abs(R.v) > 2 && p.sayT <= 0 && rnd() < .5) { p.sayT = 25; ev.push({ kind: 'shout', p, text: SHOUT() }); } else if (dist < 9 && p.sayT <= 0) p.sayT = 6; }
    for (const L of loads) { const x = Math.sin(clock * L.sp + L.ph) * (L.W - 1.2), sw = Math.sin(clock * 1.7 + L.ph) * .08; L.tro.position.x = x; L.pal.rotation.z = sw; L.g.updateMatrixWorld(true);
      const p = L.pal.getWorldPosition(new THREE.Vector3()); L.sh.position.set(p.x, gy(p.x, p.z, L.i) + .05, p.z); L.hit = Math.max(0, L.hit - dt);
      if (!R.foot && !L.hit && (R.x - p.x) ** 2 + (R.z - p.z) ** 2 < .9) { L.hit = 3; ev.push({ kind: 'load' }); } }
    for (const F of lifts) { const A = S[F.i], yaw = Math.atan2(A.f.x, A.f.z), W = track.ROAD + 3.2;
      if (F.wait > 0) { F.wait -= dt; } else { const dir = -Math.sign(F.u) || 1; F.u += dir * 2.4 * dt / W; F.beepT -= dt; if (F.beepT <= 0) { F.beepT = .6; if (Math.hypot(R.x - F.g.position.x, R.z - F.g.position.z) < 30) ev.push({ kind: 'beep' }); } if (Math.abs(F.u) >= 1) { F.u = Math.sign(F.u); F.wait = 6 + rnd() * 8; } }
      const d = F.u * W, x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d; F.g.position.set(x, gy(x, z, F.i), z); F.g.rotation.y = yaw + (F.u > 0 ? -Math.PI / 2 : Math.PI / 2) * (F.wait > 0 ? 1 : -1);
      if (F.wait <= 0 && !R.foot && (R.x - x) ** 2 + (R.z - z) ** 2 < 1.6 && !(F.hitT > 0)) { F.hitT = 3; ev.push({ kind: 'forklift' }); } F.hitT = Math.max(0, (F.hitT || 0) - dt); }
    return ev; }
  function kick(p) { return KICK(); }
  function talk(p) { p.talks++; return p.P.talk[(p.talks - 1) % p.P.talk.length]; }
  function paper(Pp) { for (const p of people) { if (!p.g || p.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.paperT = 40; return { p, text: p.P.paper, who: 'builder' }; } return null; }
  return { id: 'industry', people, lights, update, kick, talk, paper };
}
