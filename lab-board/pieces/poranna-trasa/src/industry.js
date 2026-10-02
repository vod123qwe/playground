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
    for (const f of track.gantryF || [.12, .4, .9]) { const i = wrap(Math.round(N * f)), A = S[i], W = track.ROAD + 2.4, g = new THREE.Group(), yaw = Math.atan2(A.f.x, A.f.z);
      for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.4, 8, .4), steel); m.position.set(sd * W, 4, 0); g.add(m); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + .4, .5, .5), steel); beam.position.y = 8; g.add(beam);
      g.position.set(A.p.x, gy(A.p.x, A.p.z, i), A.p.z); g.rotation.y = yaw; scene.add(g); g.updateMatrixWorld(true);
      for (const sd of [-1, 1]) { const c = new THREE.Object3D(); c.position.copy(g.localToWorld(V(sd * W, 0, 0))); c.rotation.y = yaw; c.updateMatrixWorld(); track.addHit(c, { hx: .25, hz: .25, h: 8, kind: 'hard' }, i); }
      const tro = new THREE.Group(), cable = new THREE.Mesh(new THREE.BoxGeometry(.04, 5.6, .04), dark), pal = new THREE.Group(); cable.position.y = -2.8; tro.add(cable);
      pal.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, .15, 1.4), M('#9e7a4f'))); for (let q = 0; q < 12; q++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .26, .36), M(q % 3 ? '#c4552f' : '#a5432f')); b.position.set(-.33 + (q % 2) * .66, .22 + (q >> 2) * .26, ((q >> 1) % 2 - .5) * .7); pal.add(b); }   // (a pallet of bricks, stacked)
      pal.position.y = -6.2; tro.add(pal); tro.position.y = 8; g.add(tro);
      const sh = new THREE.Mesh(new THREE.CircleGeometry(.85, 12).rotateX(-Math.PI / 2), shM); scene.add(sh);
      loads.push({ g, tro, pal, sh, i, W, ph: rnd() * 6, sp: .35 + rnd() * .2, hit: 0 }); } }

  // ---------- the sidings' forklifts: across the road between the halls and back, a pause each side, a beep as they go; a real forklift
  // to see (the cage over the driver in his vest, the mast, the forks with a pallet of boxes, an amber light on top that flashes as it goes),
  // never thinned away when it is between the camera and him; a dashed yellow track painted across the road where they cross ----------
  const lifts = [];
  if (kind === 'bocznica') { const MF = c => { const m = toon(c); m.userData.noFade = true; return m; }, orange = MF('#e8a020'), dark = MF('#2a2c30'), steel = MF('#8a9094'), vest = MF('#c8e03a'), skin = MF('#e3b08a'), helm = MF('#f6f3ea'), card = MF('#c9a96a'), wood = MF('#9e7a4f'), tape = MF('#e9dcc0');
    const beaconM = new THREE.MeshBasicMaterial({ color: '#ffb020' }), paint = toon('#efc930'), bx = (g, w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
    for (const f of track.liftF || [.15, .35, .62, .82]) { const i = wrap(Math.round(N * f)), sd = rnd() < .5 ? -1 : 1, g = new THREE.Group();
      bx(g, 1.1, .7, 1.5, orange, 0, .62, .05); bx(g, 1.12, .62, .42, dark, 0, .66, -.82);
      for (const x of [-.56, .56]) for (const z of [-.5, .55]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .22, 12).rotateZ(Math.PI / 2), dark); w.position.set(x, .27, z); g.add(w); }
      for (const x of [-.5, .5]) for (const z of [-.55, .4]) bx(g, .07, 1.3, .07, dark, x, 1.6, z);
      for (const x of [-.5, .5]) bx(g, .08, .08, 1.05, dark, x, 2.25, -.07); for (const z of [-.55, -.07, .4]) bx(g, 1.08, .08, .08, dark, 0, 2.25, z);
      bx(g, .5, .12, .5, dark, 0, 1.02, -.25); bx(g, .44, .52, .28, vest, 0, 1.36, -.3); bx(g, .24, .24, .24, skin, 0, 1.76, -.28); bx(g, .3, .12, .3, helm, 0, 1.92, -.28);
      bx(g, .12, .1, .45, vest, -.2, 1.42, .0); bx(g, .12, .1, .45, vest, .2, 1.42, .0);
      for (const x of [-.36, .36]) bx(g, .09, 2.4, .09, steel, x, 1.25, .88); bx(g, .82, .09, .09, steel, 0, 2.42, .88); bx(g, .8, .3, .08, dark, 0, .5, .95);
      for (const x of [-.26, .26]) bx(g, .1, .05, 1.05, steel, x, .32, 1.5);
      bx(g, 1, .12, 1, wood, 0, .42, 1.5); bx(g, .88, .56, .88, card, 0, .76, 1.5); bx(g, .9, .06, .14, tape, 0, 1.05, 1.5);
      const beacon = bx(g, .16, .14, .16, beaconM, .3, 2.36, -.4);
      scene.add(g);
      // (the painted track across the road: two dashed yellow lines, a dash at a time laid on the asphalt where it is)
      { const A = S[i], W = track.ROAD + 3.2; for (const off of [-1.3, 1.3]) for (let d = -track.ROAD + .3; d < track.ROAD - .2; d += .9) { const x = A.p.x + A.r.x * d + A.f.x * off, z = A.p.z + A.r.z * d + A.f.z * off, o = new THREE.Mesh(new THREE.BoxGeometry(.5, .02, .14), paint); o.position.set(x, gy(x, z, i) + .035, z); o.rotation.y = Math.atan2(A.r.x, A.r.z) + Math.PI / 2; o.userData.noShadow = true; scene.add(o); } void W; }
      lifts.push({ g, i, beacon, u: sd, dir: -sd, yaw: null, wait: 2 + rnd() * 8, beepT: 0, t: 0 }); } }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0);
    for (const p of people) { if (!p.o) continue; const dist = Math.hypot(R.x - p.x, R.z - p.z); if (dist > 70) continue; p.o.mixer.update(dt); p.paperT = Math.max(0, p.paperT - dt); p.sayT -= dt;
      if (dist < 9 && Math.abs(R.v) > 2 && p.sayT <= 0 && rnd() < .5) { p.sayT = 25; ev.push({ kind: 'shout', p, text: SHOUT() }); } else if (dist < 9 && p.sayT <= 0) p.sayT = 6; }
    for (const L of loads) { const x = Math.sin(clock * L.sp + L.ph) * (L.W - 1.2), sw = Math.sin(clock * 1.7 + L.ph) * .08; L.tro.position.x = x; L.pal.rotation.z = sw; L.g.updateMatrixWorld(true);
      const p = L.pal.getWorldPosition(new THREE.Vector3()); L.sh.position.set(p.x, gy(p.x, p.z, L.i) + .05, p.z); L.hit = Math.max(0, L.hit - dt);
      if (!R.foot && !L.hit && (R.x - p.x) ** 2 + (R.z - p.z) ** 2 < .9) { L.hit = 3; ev.push({ kind: 'load' }); } }
    for (const F of lifts) { const A = S[F.i], W = track.ROAD + 3.2; F.t += dt;
      const want = Math.atan2(A.r.x * F.dir, A.r.z * F.dir); if (F.yaw == null) F.yaw = want; let dy = ((want - F.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const moving = F.wait <= 0 && Math.abs(dy) < .25;
      if (F.wait > 0) { F.wait -= dt; if (F.wait <= 0) F.dir = -Math.sign(F.u) || 1; }
      else if (Math.abs(dy) >= .25) F.yaw += Math.sign(dy) * Math.min(Math.abs(dy), 1.8 * dt);
      else { F.yaw = want; F.u += F.dir * 2.4 * dt / W; F.beepT -= dt; if (F.beepT <= 0) { F.beepT = .6; if (Math.hypot(R.x - F.g.position.x, R.z - F.g.position.z) < 30) ev.push({ kind: 'beep' }); } if (Math.abs(F.u) >= 1) { F.u = Math.sign(F.u); F.wait = 6 + rnd() * 8; } }
      const d = F.u * W, x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d; F.g.position.set(x, gy(x, z, F.i), z); F.g.rotation.y = F.yaw; F.beacon.visible = F.wait > 0 || (F.t * 3 | 0) % 2 === 0;
      if (moving && !R.foot && (R.x - x) ** 2 + (R.z - z) ** 2 < 2.2 && !(F.hitT > 0)) { F.hitT = 3; ev.push({ kind: 'forklift' }); } F.hitT = Math.max(0, (F.hitT || 0) - dt); }
    return ev; }
  function kick(p) { return KICK(); }
  function talk(p) { p.talks++; return p.P.talk[(p.talks - 1) % p.P.talk.length]; }
  function paper(Pp) { for (const p of people) { if (!p.g || p.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.paperT = 40; return { p, text: p.P.paper, who: 'builder' }; } return null; }
  return { id: 'industry', people, lights, update, kick, talk, paper };
}
