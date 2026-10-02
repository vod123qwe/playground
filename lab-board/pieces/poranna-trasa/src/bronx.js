// The Bronx at night (docs/trasy-tematyczne.md, docs/fabula.md): what lives on the estate after dark.
//   the lads by the stairwells: little groups of two or three, each lad his own nickname and his own way of talking (the Professor
//     with his long words, Bajer with a deal for everything, Cichy who says one word, and others); they call after him as he rides by,
//     talk back when spoken to, take a paper; kicked, they run after him, and caught slow he goes down; with the estate against him
//     (a bad name here, kept between runs) now and then one pushes a bin out onto the road ahead of him
//   glass on the road here and there: over it, a tyre goes soft for a while
//   bins knocked over, bags of rubbish: in the way, kickable
//   Pan Inżynier on his mattress by a block: a paper thrown to him is his blanket, and he has a rumour in return
// createBronx({ THREE, toon, track, scene, residents }) → { people, update(dt, R) → events[], kick(p), talk(p), paper(P) }
//   R: { x, z, v, yaw, foot, air, hint }; events: { kind: 'shout' | 'catch' | 'glass' | 'push', p?, text? }

export function createBronx({ THREE, toon, track, scene, residents }) {
  let a = 811; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c);
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y;
  // a deck: its lines one by one, shuffled, none again till all have come
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  // ---------- the estate's name for him (kept between runs): kicks lower it, papers and a word raise it ----------
  const REPK = 'pt.rep.bronx'; let rep = (() => { try { return +localStorage.getItem(REPK) || 0; } catch { return 0; } })();
  const repAdd = d => { rep = Math.max(-6, Math.min(6, rep + d)); try { localStorage.setItem(REPK, String(rep)); } catch { } };

  // ---------- the lads: who they are, how each one talks ----------
  const PERSONA = {
    profesor: { name: 'PROFESOR', talk: ['DOBRY WIECZÓR, SZANOWNY DORĘCZYCIELU. POZWOLI PAN, ŻE SKOMENTUJĘ KIEROWNICĘ: KRZYWA.', 'PRASA O TEJ PORZE? PAN JEST JAK SOWA, TYLKO Z DZWONKIEM.', 'CZYTAM WYŁĄCZNIE NEKROLOGI. SPRAWDZAM, CZY MNIE JUŻ NIE MA.'],
      paper: 'DZIĘKUJĘ. ODŁOŻĘ NA PÓŹNIEJ. NA PÓŹNIEJ MAM JUŻ TRZY LATA PRASY.' },
    bajer: { name: 'BAJER', talk: ['EJ, MŁODY, ROWER NA SPRZEDAŻ? NIE TWÓJ? TO TANIEJ WYJDZIE.', 'MAM INTERES: GAZETY ZA PÓŁ CENY. TWOJE GAZETY, MOJA CENA.', 'SPOKO, JA TYLKO PYTAM. PYTAĆ NIE ZAKAZALI. JESZCZE.'],
      paper: 'DARMOWA? TO JA JĄ JUTRO SPRZEDAM. DZIĘKI, WSPÓLNIKU.' },
    cichy: { name: 'CICHY', talk: ['NO.', 'JEDŹ.', '...'], once: 'MAMA TEŻ ROZNOSIŁA GAZETY. O TEJ GODZINIE. JEDŹ OSTROŻNIE.', paper: '...DZIĘKI.' },
    lizak: { name: 'LIZAK', talk: ['CHCESZ LIZAKA? NIE DAM. TAK PYTAM.', 'JA SIĘ NIE BOJĘ CIEMNOŚCI. TO CIEMNOŚĆ SIĘ BOI MNIE. TAK MÓWI PROFESOR.', 'MAMA KAŻE WRACAĆ O DZIESIĄTEJ. JEST DRUGA. JESTEM BUNTOWNIKIEM.'],
      paper: 'O, BĘDĘ MIAŁ NA CO POŁOŻYĆ LIZAKA.' },
    kozak: { name: 'KOZAK', talk: ['WIDZISZ TEN BICEPS? NIE WIDZISZ, BO CIEMNO. ALE JEST.', 'RAZ PODNIOSŁEM MALUCHA. ZNACZY PRAWIE. ZNACZY KOŁO.', 'JAKBY KTO CIĘ ZACZEPIAŁ, MÓW, ŻE ZNASZ KOZAKA. NIE POMOŻE, ALE MIŁO.'],
      paper: 'GAZETĘ TO JA ROZERWĘ NA PÓŁ. ...DOBRA, JUTRO. DZIŚ PRZECZYTAM.' },
    kanada: { name: 'ZIOMEK Z KANADY', talk: ['W KANADZIE GAZECIARZE JEŻDŻĄ NA ŁOSIACH. MÓWIĘ CI. BYŁEM. PRAWIE.', 'U NAS W KANADZIE TAKICH BLOKÓW NIE MA. SĄ WIĘKSZE. I ZIMNIEJSZE.', 'WRACAM TAM WIOSNĄ. KTÓRĄŚ.'],
      paper: 'THANK YOU, CZYLI DZIĘKI. TAK MÓWIĄ W KANADZIE.' },
    mechanik: { name: 'MECHANIK', talk: ['TY MASZ LUZ NA STERACH. SŁYSZĘ STĄD. TO SIĘ NAZYWA TALENT.', 'SKUTER PRZEROBIŁEM NA KOSIARKĘ, KOSIARKĘ NA SKUTER. TERAZ NIE WIEM, CO MAM.', 'PRZYJDŹ W DZIEŃ, NAPRAWIĘ CI ŁAŃCUCH. W NOCY TYLKO DOGADUJĘ.'],
      paper: 'GAZETA? DOBRA, PODŁOŻĘ POD SILNIK. ŻARTUJĘ. NAJPIERW PRZECZYTAM.' },
    raper: { name: 'RAPER', talk: ['JADE NA ROWERZE, GAZETA W TORBIE, ZARAZ CIĘ ZAPISZĘ W MOIM... NO, W ZESZYCIE.', 'MÓJ NOWY KAWAŁEK: „BLOKI NOCĄ”. JESZCZE NIE MA SŁÓW. ALE MA BIT.', 'TRĄBKA, BĄBKA, ŁĄKA... NIE. NIC SIĘ NIE RYMUJE Z TRĄBKĄ.'],
      paper: 'GAZETA, PODNIETA, ZAJEB... ZNACZY: ZARĄBISTA. DZIĘKI.' } };
  const SHOUT = deck(['DZWONEK MASZ? TO DZWOŃ DO MAMY!', 'GAZECIARZ! A HOROSKOP JEST?', 'UWAŻAJ, TU SIĘ HAMUJE TWARZĄ!', 'O, TRĄBKA PRZYJECHAŁA! TRĄB!', 'ZWOLNIJ, BO NIE ZDĄŻYMY CIĘ OBGADAĆ!', 'ŚWIATŁA MASZ? TO MASZ WIĘCEJ NIŻ NASZA KLATKA!', 'ZA SZYBKO! ZA SZYBKO! ...DOBRA, JEDŹ.']);
  const SHOUT_BAD = deck(['TO TEN OD KOPANIA! ŁAP GO!', 'WRÓCIŁ, PATRZCIE, JAKI ODWAŻNY!', 'TU SIĘ NIE PRZEJEŻDŻA, TU SIĘ PŁACI!']);
  const KICKED = deck(['TERAZ TO JUŻ OSOBISTE!', 'ŁAPAĆ GO!', 'PROFESORZE, GONIMY!', 'NO TO SIĘ DOIGRAŁEŚ, KOLARZ!']);
  const CAUGHT = deck(['NO I CO, KOLARZ? GLEBA.', 'MÓWIŁEM, TU SIĘ HAMUJE TWARZĄ.', 'POZDRÓW REDAKCJĘ!']);
  const PUSH = deck(['ZOBACZYMY, JAK SKACZESZ!', 'OBJAZD, KOLEGO!', 'PREZENT OD OSIEDLA!']);
  const TALK_BAD = deck(['Z TOBĄ NIE GADAMY. JESZCZE CIĘ PAMIĘTAMY.', 'IDŹ, PÓKI MOŻESZ.', 'NO PROSZĘ, KTO PRZYSZEDŁ. TEN OD KOPANIA.']);

  // ---------- where they stand: by stairwells of blocks near the road, groups far apart ----------
  const people = [], groups = [], lights = [];
  const spots = []; for (const d of track.doors.slice().sort(() => rnd() - .5)) { if (spots.length >= 4) break; const q = track.probe(d.p.x, d.p.z, d.i); if (Math.abs(q.d) > 22) continue; if (spots.some(o => Math.abs(((o.i - d.i) % N + N * 1.5) % N - N / 2) * ds < 120)) continue; spots.push(d); }
  const names = Object.keys(PERSONA).sort(() => rnd() - .5); let ni = 0;
  const poolM = new THREE.MeshBasicMaterial({ color: '#ffb35a', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const d of spots) { const grp = { members: [], shoutT: 0, pushT: 20 + rnd() * 20, i: d.i }; groups.push(grp);
    { const c = d.p.clone().addScaledVector(d.n, -1.4), pool = new THREE.Mesh(new THREE.CircleGeometry(3, 14).rotateX(-Math.PI / 2), poolM); pool.position.set(c.x, gy(c.x, c.z, d.i) + .07, c.z); pool.renderOrder = 2; scene.add(pool); lights.push({ p: V(c.x, gy(c.x, c.z, d.i) + 3.2, c.z), flick: false }); }   // (the stairwell's light on them: one of the game's real lights, near)
    const along = V(-d.n.z, 0, d.n.x), n = 2;
    for (let k = 0; k < n; k++) { const key = names[ni++ % names.length], home = d.p.clone().addScaledVector(d.n, -1.2).addScaledVector(along, (k - (n - 1) / 2) * 1.1 + 1.6);
      const p = { kind: 'lad', persona: key, P: PERSONA[key], grp, home, x: home.x, z: home.z, y: 0, yaw: Math.atan2(d.n.x, d.n.z) + (rnd() - .5) * .8, state: 'stand', t: 0, talks: 0, onceSaid: false, paperT: 0, g: null, ready: false };
      people.push(p); grp.members.push(p);
      residents.spawn(k % 2 ? 'brawler' : 'teen').then(o => { if (!o) return; p.o = o; p.g = o.G; o.m.scale.setScalar(.95 + rnd() * .1);
        const suit = ['#4a5468', '#3e5a48', '#6a4040', '#55556a'][rnd() * 4 | 0];
        o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(suit); });
        o.acts.idle?.play(); if (o.acts.walk) { o.acts.walk.play(); o.acts.walk.setEffectiveWeight(0); } if (o.acts.idle) o.acts.idle.time = rnd() * 3;
        p.ready = true; place(p); }); } }
  function place(p) { if (!p.g) return; p.y = gy(p.x, p.z); p.g.position.set(p.x, p.y, p.z); p.g.rotation.y = p.yaw; }
  const walkW = (p, w, pace) => { const A = p.o?.acts; if (!A?.walk || !A.idle) return; const cur = A.walk.getEffectiveWeight(), nw = cur + (w - cur) * .2; A.walk.setEffectiveWeight(nw); A.idle.setEffectiveWeight(1 - nw); A.walk.timeScale = pace; };

  // ---------- the night's litter: glass on the road, bins knocked over and bags along the kerb ----------
  const glass = [], shardM = new THREE.MeshBasicMaterial({ color: '#bfe6ee' });
  for (let k = 0; k < 7; k++) { const i = wrap(Math.round(N * (k + .3 + rnd() * .4) / 7)), A = S[i], d = (rnd() - .5) * 4.6, x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d, y = gy(x, z, i), g = new THREE.Group();
    for (let q = 0; q < 14; q++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.06 + rnd() * .08, .015, .04 + rnd() * .06), shardM); s.position.set((rnd() - .5) * 1.4, .02, (rnd() - .5) * 1.4); s.rotation.y = rnd() * 3; g.add(s); }
    g.position.set(x, y, z); g.userData.keep = true; scene.add(g); glass.push({ x, z, i, t: 0 }); }
  const P = track.props;
  for (let k = 0; k < 6; k++) { const i = wrap(Math.round(N * (k + .6) / 6)), A = S[i], sd = rnd() < .5 ? -1 : 1, d = sd * (track.ROAD + 1.2), x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d, g = new THREE.Group();
    const bin = new THREE.Group(); bin.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1, .6), M('#2f5a3a')), new THREE.Mesh(new THREE.BoxGeometry(.74, .08, .64), M('#24442c'))); bin.children[1].position.y = .52; bin.rotation.z = Math.PI / 2; bin.position.set(0, .36, 0); g.add(bin);
    for (let q = 0; q < 5; q++) { const t = new THREE.Mesh(new THREE.IcosahedronGeometry(.12 + rnd() * .1, 0), M(['#3a3a3a', '#6b6450', '#8a7a5a', '#b9b2a2'][q % 4])); t.position.set(.6 + rnd() * .9, .1, (rnd() - .5) * 1); g.add(t); }
    g.position.set(x, gy(x, z, i), z); g.rotation.y = Math.atan2(A.f.x, A.f.z) + rnd(); scene.add(g); g.updateMatrixWorld(true); track.addHit(g, { hx: .55, hz: .4, h: .7, kind: 'soft' }, i);
    if (P?.bags && rnd() < .7) { const b = P.bags(rnd), x2 = x + A.f.x * 1.6, z2 = z + A.f.z * 1.6; b.group.position.set(x2, gy(x2, z2, i), z2); scene.add(b.group); b.group.updateMatrixWorld(true); track.addHit(b.group, b.hit, i); } }

  // ---------- Pan Inżynier on his mattress, his thermos and his chessboard ----------
  const RUMOUR = deck(['O, KOŁDERKA Z WIADOMOŚCIAMI. DZIĘKUJĘ. PLOTKA ZA PLOTKĘ: DZIELNICOWY STAJE NOCĄ POD PAWILONEM I NIE WYSIADA. CZEKA NA KOGOŚ.', 'JA CZYTAM OD TYŁU. NEKROLOGI, POGODA, A NA KOŃCU POLITYKA, BO WTEDY JUŻ NIC MNIE NIE ZDZIWI.',
    'KURIER OSIEDLOWY ROZWOZI O PIĄTEJ. WY O CZWARTEJ. A JA WSTAJĘ O TRZECIEJ. KTO TU JEST NAJLEPSZYM DZIENNIKARZEM?', 'BYŁEM INŻYNIEREM. MOSTY LICZYŁEM. TERAZ LICZĘ GWIAZDY. TEŻ SIĘ NIE ZAWALAJĄ.']);
  { const d = track.doors.filter(o => !spots.includes(o))[(rnd() * 20 | 0) % Math.max(1, track.doors.length - spots.length)];
    if (d) { const along = V(-d.n.z, 0, d.n.x), at = d.p.clone().addScaledVector(d.n, -1.6).addScaledVector(along, -3.2), g = new THREE.Group(), stripe = M('#b9b2a2'), blue = M('#3b5670');
      g.add(new THREE.Mesh(new THREE.BoxGeometry(2, .16, .9), stripe)); for (let q = 0; q < 4; q++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.2, .17, .92), blue); s.position.x = -.75 + q * .5; g.add(s); }
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, .32, .5), M('#6b4a2e')); body.position.set(-.1, .26, 0); g.add(body); const head = new THREE.Mesh(new THREE.BoxGeometry(.26, .24, .26), M('#d9a07a')); head.position.set(.8, .3, 0); g.add(head);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(.28, .1, .28), M('#8e2e25')); cap.position.set(.82, .44, 0); g.add(cap); const th = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .3, 8), M('#5a5f66')); th.position.set(1.2, .15, .4); g.add(th);
      const ch = new THREE.Mesh(new THREE.BoxGeometry(.4, .04, .4), M('#efe8dc')); ch.position.set(1.15, .1, -.45); g.add(ch); const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.3, .03, .55), M('#ece5d0')); blanket.position.set(-.15, .44, 0); blanket.visible = false; g.add(blanket);
      g.position.set(at.x, gy(at.x, at.z, d.i), at.z); g.rotation.y = Math.atan2(along.x, along.z) + Math.PI / 2; g.userData.keep = true; scene.add(g); g.updateMatrixWorld(true); track.addHit(g, { hx: 1, hz: .45, h: .5, kind: 'soft' }, d.i);
      people.push({ kind: 'inzynier', x: at.x, z: at.z, y: 0, g, blanket, paperT: 0, talks: 0 }); } }

  // ---------- tyres rolling across the road now and then (off a garage's heap): in his way, they knock him down ----------
  const tyres = [], tyreM = M('#1f2124'), hubM = M('#8a8f96'); let tyreT = 18;
  function rollTyre(R) { const q = track.probe(R.x, R.z, R.hint), along = Math.sign(Math.sin(R.yaw) * S[q.i].f.x + Math.cos(R.yaw) * S[q.i].f.z) || 1, i = wrap(q.i + Math.round((26 + rnd() * 10) / ds) * along), A = S[i], sd = rnd() < .5 ? -1 : 1;
    const g = new THREE.Group(), t = new THREE.Mesh(new THREE.TorusGeometry(.33, .13, 6, 14), tyreM), h = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .12, 10), hubM); h.rotation.x = Math.PI / 2; g.add(t, h); scene.add(g);
    tyres.push({ g, x: A.p.x + A.r.x * sd * 7, z: A.p.z + A.r.z * sd * 7, vx: -A.r.x * sd * 4.2, vz: -A.r.z * sd * 4.2, i, t: 0, spin: 0 }); }
  // ---------- a party going home along the pavement: four of them, singing (their own songs), in his way on the pavement ----------
  const SONG = deck(['JESZCZE JEDEN BLOK I DO DOMUUU, JESZCZE JEDEN BLOK I SPAAAĆ!', 'ŁIIIHA! GAZECIARZ, CHODŹ Z NAMI!', 'MY TU TYLKO NA CHWILĘ. OD WCZORAJ.', 'KTÓRA GODZINA? GAZETA WIE! DAJ GAZETĘ!', 'ZDJĘCIE DO GAZETY? TYLKO Z LEWEJ, PRAWA STRONA JEST ZMĘCZONA.', 'KSIĘŻYC ŚWIECI, MY ŚPIEWAMY, SĄSIEDZI WALĄ W KALORYFER, A MY DALEJ GRAMY!']);
  const party = { s: track.len * .3, dir: 1, side: 1, v: 1.1, members: [], sayT: 0, stopT: 0 };
  ['lady', 'suit', 'teen', 'shopper'].forEach((key, k) => residents.spawn(key).then(o => { if (!o) return; const col = ['#c23a7a', '#3a7ac2', '#e3b22e', '#7ac23a'][k];
    o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(col); });
    o.acts.walk?.play(); o.acts.idle?.play(); o.acts.idle?.setEffectiveWeight(0); const p = { kind: 'party', o, g: o.G, x: 0, z: 0, y: 0, off: k * 1.3, lateral: (k % 2 ? .5 : -.5), paperT: 0, talks: 0 }; party.members.push(p); people.push(p); }));
  const PARTY_PAPER = deck(['O! MAMY CO CZYTAĆ W TAKSÓWCE!', 'GAZETA! TERAZ JESTEŚMY KULTURALNI!', 'DZIĘKI, BĘDZIE NA PAPIEROSA. ZNACZY NA PAPIEROWE CZAPKI!']);
  const PARTY_KICK = deck(['EJ! NIE PSUJ IMPREZY!', 'I PO IMPREZIE. DZIĘKI, KOLEGO.', 'ZA TO NIE BĘDZIE W REFRENIE!']);
  function stepParty(dt, R) { if (!party.members.length) return null; party.sayT -= dt; party.stopT -= dt; const len = track.len;
    if (party.stopT <= 0) party.s = ((party.s + party.dir * party.v * dt) % len + len) % len; let near = 1e9, said = null;
    for (const p of party.members) { const s = ((party.s - p.off * party.dir) % len + len) % len, f = s / ds, i0 = Math.floor(f) % N, A = S[i0], d = party.side * (5.6 + p.lateral);
      p.x = A.p.x + A.r.x * d; p.z = A.p.z + A.r.z * d; p.y = gy(p.x, p.z, i0); p.g.position.set(p.x, p.y + Math.abs(Math.sin(clock * 6 + p.off)) * .05, p.z); p.g.rotation.y = Math.atan2(A.f.x, A.f.z) + (party.dir < 0 ? Math.PI : 0) + Math.sin(clock * 2 + p.off) * .3;
      p.o.acts.walk && (p.o.acts.walk.timeScale = party.stopT > 0 ? 0 : 1); p.o.mixer.update(dt); p.paperT = Math.max(0, p.paperT - dt); near = Math.min(near, Math.hypot(R.x - p.x, R.z - p.z)); }
    if (near < 9 && party.sayT <= 0) { party.sayT = 9 + rnd() * 6; said = { kind: 'shout', p: party.members[rnd() * party.members.length | 0], text: SONG() }; }
    return said; }
  // ---------- what they do ----------
  let clock = 0;
  function update(dt, R) { clock += dt; const ev = [];
    for (const grp of groups) { grp.shoutT = Math.max(0, grp.shoutT - dt); grp.pushT -= dt; }
    for (const p of people) { if (p.kind !== 'lad' || !p.ready) continue; p.paperT = Math.max(0, p.paperT - dt); p.t += dt;
      const dx = R.x - p.x, dz = R.z - p.z, dist = Math.hypot(dx, dz), grp = p.grp;
      if (p.state === 'chase') { const sp = 6.2; p.x += dx / (dist || 1) * sp * dt; p.z += dz / (dist || 1) * sp * dt; p.yaw = Math.atan2(dx, dz); walkW(p, 1, 2.1);
        const far = Math.hypot(p.x - p.home.x, p.z - p.home.z); if (dist < 1 && (Math.abs(R.v) < 4.5 || R.foot)) { ev.push({ kind: 'catch', p, text: CAUGHT() }); p.state = 'back'; }
        else if (p.t > 7 || far > 45) p.state = 'back'; }
      else if (p.state === 'back') { const hx = p.home.x - p.x, hz = p.home.z - p.z, hd = Math.hypot(hx, hz); if (hd < .3) { p.state = 'stand'; walkW(p, 0, 1); } else { p.x += hx / hd * 1.4 * dt; p.z += hz / hd * 1.4 * dt; p.yaw = Math.atan2(hx, hz); walkW(p, 1, 1); } }
      else walkW(p, 0, 1);
      if (dist < 70 || p.state !== 'stand') p.o.mixer.update(dt); place(p);
      // (him going by: one of the group calls after him, now and then; the estate against him: more spite in it)
      if (p.state === 'stand' && dist < 9 && Math.abs(R.v) > 1.5 && grp.shoutT <= 0 && grp.members[0] === p) { grp.shoutT = 14 + rnd() * 10; if (rnd() < .7) ev.push({ kind: 'shout', p: grp.members[rnd() * grp.members.length | 0], text: rep <= -2 ? SHOUT_BAD() : SHOUT() }); }
      // (a bad name here: now and then a bin pushed out onto the road ahead of him)
      if (rep <= -2 && grp.pushT <= 0 && grp.members[0] === p && dist < 60 && dist > 22 && !R.foot) { grp.pushT = 35 + rnd() * 20; const q = track.probe(R.x, R.z, R.hint), along = Math.sign(Math.sin(R.yaw) * S[q.i].f.x + Math.cos(R.yaw) * S[q.i].f.z) || 1, i = wrap(q.i + Math.round((dist * .6) / ds) * along);
        if (Math.hypot(S[i].p.x - p.x, S[i].p.z - p.z) < 40) { putBin(i, q.d); ev.push({ kind: 'push', p, text: PUSH() }); } } }
    { const e = stepParty(dt, R); if (e) ev.push(e); }
    tyreT -= dt; if (tyreT <= 0 && Math.abs(R.v) > 3 && !R.foot) { tyreT = 22 + rnd() * 18; rollTyre(R); }
    for (let k = tyres.length - 1; k >= 0; k--) { const T = tyres[k]; T.t += dt; T.x += T.vx * dt; T.z += T.vz * dt; T.spin += 4.2 / .46 * dt; const y = gy(T.x, T.z, T.i) + .46 + Math.abs(Math.sin(T.t * 5)) * .08;
      T.g.position.set(T.x, y, T.z); T.g.rotation.set(0, Math.atan2(T.vx, T.vz) + Math.PI / 2, 0); T.g.children[0].rotation.z = T.spin; T.g.children[1].rotation.y = T.spin;
      if (!R.foot && !R.air && !T.hit && (R.x - T.x) ** 2 + (R.z - T.z) ** 2 < .55) { T.hit = true; ev.push({ kind: 'tyre' }); }
      if (T.t > 5) { scene.remove(T.g); tyres.splice(k, 1); } }
    for (const G0 of glass) { G0.t = Math.max(0, G0.t - dt); if (G0.t > 0 || R.foot || Math.abs(R.v) < 2 || R.air) continue; if ((R.x - G0.x) ** 2 + (R.z - G0.z) ** 2 < 1) { G0.t = 25; ev.push({ kind: 'glass' }); } }
    for (const b of bins) { b.t -= dt; if (b.t <= 0 && !b.gone) { b.gone = true; scene.remove(b.g); track.dropHit?.(b.C); } }
    return ev; }
  // a bin out on the road (a while, then gone: someone puts it back)
  const bins = [];
  function putBin(i, dd) { const A = S[i], d = Math.max(-2.6, Math.min(2.6, dd)), x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d, g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(.8, 1.1, .7), M('#2f5a3a')); b.position.y = .55; g.add(b);
    g.position.set(x, gy(x, z, i), z); g.rotation.y = Math.atan2(A.f.x, A.f.z); scene.add(g); g.updateMatrixWorld(true); const C = track.addHit(g, { hx: .4, hz: .35, h: 1.1, kind: 'soft' }, i); bins.push({ g, C, t: 28, gone: false }); }
  // kicked (from the bike): he swears and the lads run after him; the estate remembers
  function kick(p) { if (p.kind === 'party') { party.stopT = 3; return PARTY_KICK(); } if (p.kind === 'inzynier') { repAdd(-2); return 'ZA CO?! JA TU TYLKO LEŻĘ!'; } repAdd(-1); for (const m of p.grp.members) if (m.ready) { m.state = 'chase'; m.t = 0; } return KICKED(); }
  // spoken to (on foot): each in his own way; with a bad name here, short with him
  function talk(p) { p.talks = (p.talks || 0) + 1; if (p.kind === 'inzynier') return RUMOUR(); if (p.kind === 'party') { party.stopT = 4; return SONG(); }
    if (rep <= -2) return TALK_BAD(); if (p.talks === 3 && p.P.once && !p.onceSaid) { p.onceSaid = true; return p.P.once; } if (p.talks === 2) repAdd(1); return p.P.talk[(p.talks - 1) % p.P.talk.length]; }
  // a paper thrown to one: taken (the estate a little kinder); the engineer covers himself with it and has a rumour for you
  function paper(Pp) { for (const p of people) { if (p.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > (p.kind === 'inzynier' ? 1.3 : .8)) continue; p.paperT = 40; repAdd(1);
      if (p.kind === 'inzynier') { p.blanket.visible = true; return { p, text: RUMOUR(), who: 'inzynier' }; } if (p.kind === 'party') { party.stopT = 3; return { p, text: PARTY_PAPER(), who: 'party' }; } return { p, text: p.P.paper, who: 'lad' }; } return null; }
  return { id: 'bronx', people, lights, update, kick, talk, paper, get rep() { return rep; } };
}
