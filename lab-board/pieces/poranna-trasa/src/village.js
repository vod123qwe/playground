// The village's routes with a map of their own (docs/trasy-tematyczne.md): what moves on them.
//   harvest (Żniwa): combines on the road, nearly its whole width, slow, a cloud of dust behind (it hides the road); the farmers by
//     their gates, each his own way of talking; spoken to, kicked, a paper: as the other locals
// createVillage({ THREE, toon, track, scene, residents }) → the locals' shape: { id, people, lights, update(dt, R) → events, kick, talk, paper }
//   events: { kind: 'shout' | 'honk' | 'combine', p?, text? }

export function createVillage({ THREE, toon, track, scene, residents }) {
  let a = 1201; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, L = N * ds, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c);
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y;
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  const people = [], lights = [], events = [];

  // ---------- the farmers: who they are (each his own way of talking) ----------
  const FOLK = {
    gospodarz: { body: '#5d6b3a', talk: ['DESZCZ BĘDZIE O CZWARTEJ. MÓWIŁO MI KOLANO, NIE RADIO.', 'TRZYDZIEŚCI HEKTARÓW, A NAJWIĘCEJ ROBOTY Z TĄ JEDNĄ MIEDZĄ.', 'GAZETĘ CZYTAM OD KOŃCA. CENY SKUPU SĄ Z TYŁU I NA NICH SIĘ CZYTANIE KOŃCZY.'], paper: 'JAK SKUP ZNOWU OBNIŻYŁ, TO CI JĄ ODDAM.' },
    gospodyni: { body: '#b8463a', talk: ['CHŁOPY W POLU, A KTO IM ZANIESIE OBIAD? GAZECIARZ! ŻARTUJĘ. CHYBA.', 'SCHUDŁEŚ. U NAS SIĘ NIE CHUDNIE, U NAS SIĘ JE.', 'KOMBAJN WYNAJĘTY NA TRZY DNI. TRZECI DZIEŃ MIJA, A ON DOPIERO NA PIERWSZYM POLU.'], paper: 'POŁÓŻ NA PARAPECIE, BO MAM RĘCE W CIEŚCIE.' },
    student: { body: '#3b6fa0', talk: ['PRZYJECHAŁEM NA WAKACJE. PŁACĄ OD BELI. POLICZYŁEM: STARCZY NA PÓŁ ROWERU.', 'NA STUDIACH MÓWILI, ŻE ROLNICTWO TO DANE. NIKT NIE WSPOMNIAŁ O KURZU.', 'WUJEK MÓWI NA MNIE KALKULATOR. BO LICZĘ, A NIE NOSZĘ.'], paper: 'MAM GAZETĘ W TELEFONIE. ALE TU NIE MA ZASIĘGU, WIĘC DAWAJ.' },
    dziadek: { body: '#7a6a52', talk: ['ZA MOICH CZASÓW KOSIŁO SIĘ KOSĄ. TEŻ SIĘ NARZEKAŁO, TYLKO CISZEJ.', 'TEN KOMBAJN MA KLIMATYZACJĘ. JA MIAŁEM KAPELUSZ.', 'BELE LICZĘ OD RANA. ZA KAŻDYM RAZEM WYCHODZI INACZEJ. ZNACZY SIĘ, ROSNĄ.'], paper: 'OKULARY ZOSTAŁY W KOMBAJNIE. PRZECZYTASZ MI NAGŁÓWKI?' },
    sasiadka: { body: '#8a4a7a', talk: ['U KOWALCZYKÓW KOMBAJN STANĄŁ. NIE MÓWIĘ, ŻE PRZEZ NICH. ALE STANĄŁ.', 'WIDZIAŁAM CIĘ WCZORAJ. I PRZEDWCZORAJ. JA WSZYSTKO WIDZĘ, Z OKNA.', 'TY TEN NOWY OD GAZET? NO TO JUŻ CAŁA WIEŚ WIE.'], paper: 'DAJ, DAJ. SPRAWDZĘ, CZY PISZĄ O TYM, O CZYM JA JUŻ WIEM.' } };
  const SHOUT = deck(['TRZYMAJ SIĘ POBOCZA, KOMBAJN IDZIE!', 'GAZETA! RZUĆ NA PRZYCZEPĘ, JAK DASZ RADĘ!', 'NIE WJEŻDŻAJ W ŚCIERNISKO, OPONY POSZARPIE!', 'O, GAZECIARZ W ŻNIWA. ODWAŻNY.']);
  const KICK = deck(['EJ! W ŻNIWA SIĘ NIE BIJE, W ŻNIWA SIĘ PRACUJE!', 'ZARAZ CIĘ ZWIĄŻĘ W SNOPEK!', 'POWIEM TWOJEJ MATCE! ZNAM JĄ Z TARGU!', 'A IDŹ MI STĄD, BO WIDŁY PRZYNIOSĘ!']);
  const DRIVER = deck(['ZJEDŹ NA BOK, MŁODY!', 'KOMBAJN NIE HAMUJE. KOMBAJN MYŚLI.', 'POBOCZEM, POBOCZEM!', 'JA MAM PIĘĆ METRÓW HEDERA, A TY ROWER!', 'NIE TERAZ, ŻNIWA SĄ!']);

  // (a farmer: a body of the village's people, his clothes his colour, a straw hat)
  const straw = M('#e2c25e');
  function farmer(x, z, yaw, key) { const p = { kind: 'farmer', key, P: FOLK[key], x, z, y: gy(x, z), yaw, g: null, o: null, paperT: 0, talks: 0, sayT: 0 };
    people.push(p); residents.spawn(['gardener', 'shopper', 'jogger', 'suit'][people.length % 4]).then(o => { if (!o) return; p.o = o; p.g = o.G;
      o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(/pant|jean|trous|leg/i.test(q.material.name + q.name) ? '#4a4038' : p.P.body); });
      if (o.head && key !== 'gospodyni' && key !== 'sasiadka') { const h = new THREE.Group(), brim = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .03, 12), straw), top = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .14, 10), straw); top.position.y = .08; h.add(brim, top); h.position.set(0, .14, 0); o.head.add(h); }
      o.acts.idle?.play(); if (o.acts.idle) o.acts.idle.time = rnd() * 3; o.G.position.set(p.x, p.y, p.z); o.G.rotation.y = yaw; }); return p; }

  // ---------- the combines: on the road, nearly its whole width, slow; the header out in front (its reel turning), a cloud of dust behind ----------
  const combines = [];
  const dustT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  if (track.harvest) { const body = M('#3f8a4a'), dark = M('#1d1e21'), yellow = M('#e3b22e'), steel = M('#9a9c9e'), glass = M('#9fc4d8'), red = M('#c23a2c');
    const bx = (g, w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    for (const [f, dir] of [[.2, 1], [.66, -1]]) { const g = new THREE.Group();
      bx(g, 3, 2.3, 5.6, body, 0, 1.9, -.4); bx(g, 3.04, .3, 5.64, dark, 0, .85, -.4); bx(g, 1.8, 1.3, 1.6, body, 0, 3.6, 1.3); bx(g, 1.7, 1, .06, glass, 0, 3.7, 2.12); bx(g, .06, .9, 1.4, glass, .91, 3.7, 1.3); bx(g, .06, .9, 1.4, glass, -.91, 3.7, 1.3);
      bx(g, 1.9, .1, 1.7, dark, 0, 4.3, 1.3); bx(g, 2.4, 1, 2.2, body, 0, 3.4, -1.9); bx(g, .25, 1.6, .25, dark, -1, 4.3, -2.6);
      const pipe = bx(g, .3, .3, 3.4, yellow, 1.7, 3.6, -1.2); pipe.rotation.y = .9; pipe.position.set(2.3, 3.6, -.6);
      for (const x of [-1.35, 1.35]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .6, 14).rotateZ(Math.PI / 2), dark); w.position.set(x, .85, 1.1); g.add(w); const r = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .4, 12).rotateZ(Math.PI / 2), dark); r.position.set(x * .9, .5, -2.4); g.add(r); }
      // (the header: a low wide trough out in front, its dividers, the reel over it with its bats)
      bx(g, 5.6, .5, 1.3, yellow, 0, .55, 3.1); bx(g, 5.6, .7, .1, yellow, 0, .95, 2.5); for (const x of [-2.75, 2.75]) bx(g, .1, .8, 1.6, red, x, .7, 3.2);
      const reel = new THREE.Group(); reel.position.set(0, 1.35, 3.25); g.add(reel); reel.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5.4, 6).rotateZ(Math.PI / 2), steel));
      for (let k = 0; k < 5; k++) { const q = new THREE.Group(); q.rotation.x = k / 5 * Math.PI * 2; const bat = new THREE.Mesh(new THREE.BoxGeometry(5.3, .06, .06), red); bat.position.y = .5; q.add(bat); reel.add(q); }
      const beacon = bx(g, .2, .16, .2, new THREE.MeshBasicMaterial({ color: '#ffb020' }), .7, 4.44, 1.3);
      scene.add(g);
      const dust = []; const dm = new THREE.SpriteMaterial({ map: dustT, color: '#c9ac74', transparent: true, opacity: 0, depthWrite: false });
      for (let k = 0; k < 16; k++) { const sp = new THREE.Sprite(dm.clone()); sp.visible = false; scene.add(sp); dust.push({ sp, t: 9 }); }
      const P0 = { s: L * f, d: dir * 1, len: 8 }; track.parked.push(P0);
      combines.push({ g, reel, beacon, dust, dir, s: L * f, v: 2.8, d: dir * 1, P0, emit: 0, hitT: 0, sayT: 0, at: { position: V(0, 0, 0) } }); } }

  // ---------- the farmers by the field gates (and a few by the farmyards) ----------
  { const keys = ['gospodarz', 'gospodyni', 'student', 'dziadek', 'sasiadka', 'gospodarz', 'student'], gates = track.doors.filter(d => d.gate);
    const spots = (gates.length ? gates : track.doors).slice().sort(() => rnd() - .5).slice(0, track.harvest ? keys.length : 0);
    spots.forEach((d, k) => { const side = V(-d.n.z, 0, d.n.x), q = d.p.clone().addScaledVector(d.n, -1.6).addScaledVector(side, 2.2); farmer(q.x, q.z, Math.atan2(d.n.x, d.n.z), keys[k]); }); }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0);
    for (const p of people) { if (!p.o) continue; const dist = Math.hypot(R.x - p.x, R.z - p.z); if (dist > 70) continue; p.o.mixer.update(dt); p.paperT = Math.max(0, p.paperT - dt); p.sayT -= dt;
      if (dist < 9 && Math.abs(R.v) > 2 && p.sayT <= 0 && rnd() < .5) { p.sayT = 25; ev.push({ kind: 'shout', p, text: SHOUT() }); } else if (dist < 9 && p.sayT <= 0) p.sayT = 6; }
    for (const C of combines) { C.s = ((C.s + C.dir * C.v * dt) % L + L) % L; C.P0.s = C.s; const i = wrap(Math.round(C.s / ds)), A = S[i], x = A.p.x + A.r.x * C.d, z = A.p.z + A.r.z * C.d, yaw = Math.atan2(A.f.x * C.dir, A.f.z * C.dir);
      C.g.position.set(x, gy(x, z, i), z); C.g.rotation.y = yaw; C.reel.rotation.x -= dt * 2.2; C.beacon.visible = (clock * 3 | 0) % 2 === 0; C.at.position.set(x, C.g.position.y + 2.4, z);
      // (the dust: puffed out behind, rising and spreading, gone in a few seconds)
      C.emit -= dt; if (C.emit <= 0) { C.emit = .22; const D = C.dust.find(q => q.t >= 3.2); if (D) { D.t = 0; D.x = x - Math.sin(yaw) * 3.4 + (rnd() - .5) * 2.4; D.z = z - Math.cos(yaw) * 3.4 + (rnd() - .5) * 2.4; D.y = C.g.position.y + 1; D.sp.visible = true; } }
      for (const D of C.dust) { if (D.t >= 3.2) continue; D.t += dt; const k = D.t / 3.2; D.sp.position.set(D.x, D.y + D.t * .5, D.z); D.sp.scale.setScalar(2.2 + k * 5); D.sp.material.opacity = .55 * Math.sin(Math.PI * Math.min(1, k * 1.1)); if (D.t >= 3.2) D.sp.visible = false; }
      // (him: in its way, the driver shouts and sounds his horn; into the header or the body, he is down)
      const dx = R.x - x, dz = R.z - z, lz = dx * Math.sin(yaw) + dz * Math.cos(yaw), lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      C.sayT -= dt; if (!R.foot && lz > 4 && lz < 40 && Math.abs(lx) < 3.2 && C.sayT <= 0) { C.sayT = 9; ev.push({ kind: 'honk' }); ev.push({ kind: 'shout', p: { g: C.at }, text: DRIVER() }); }
      C.hitT = Math.max(0, C.hitT - dt); const inHead = Math.abs(lx) < 2.9 && lz > 2.3 && lz < 4, inBody = Math.abs(lx) < 1.7 && lz > -3.4 && lz <= 2.3;
      if (!R.foot && !C.hitT && (inHead && !(R.air && R.h > 1.3) || inBody && !(R.air && R.h > 4.6))) { C.hitT = 3; ev.push({ kind: 'combine' }); } }
    return ev; }
  function kick(p) { return KICK(); }
  function talk(p) { p.talks++; return p.P.talk[(p.talks - 1) % p.P.talk.length]; }
  function paper(Pp) { for (const p of people) { if (!p.g || p.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.paperT = 40; return { p, text: p.P.paper, who: 'farmer' }; } return null; }
  return { id: 'village', people, lights, update, kick, talk, paper, combines };
}
