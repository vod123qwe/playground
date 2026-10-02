// The Classic's street (docs/klasyk.md): what moves on it besides the traffic.
//   cars backing out of the drives on the houses' side (their reversing lights come on first: the sign), out to the edge of the road, a
//     wait, then back in; ridden into: he is down; a paper on the windscreen: the driver stops and says sorry
//   sprinklers on the lawns: a jet sweeping over the pavement and the edge of the road; in it, the wheels slip; a paper into one: it turns
//     the other way
//   the dustcart: slow up the road, a stop every few houses, two bin men across the road with the bins and back; the cart itself: he is
//     down; a bin man: a bump; a paper to one: caught
// createClassic({ THREE, toon, track, scene, cars }) → the locals' shape: { id, people, lights, update(dt, R) → events, kick, talk, paper }
//   tyres rolling across the road ahead of him now and then (hop them, or ride round); a ramp on the far lawn with kids sitting in a row
//     behind it, cheering: over their heads, a bonus
//   the far side: pensioners on the benches (a word, a paper), joggers on the pavement, a man with his dog on a long lead across it (hop the
//     lead or go round), kids at football on the lawn (the ball now and then out onto the road)
//   a window broken: its owner runs out after him; caught, he gets a kick (pedal hard: they give up)
//   events: { kind: 'shout' | 'driveway' | 'wet' | 'truck' | 'bump' | 'honk' | 'tyre' | 'overhead' | 'leash' | 'ball' | 'owner', p?, text? }

export function createClassic({ THREE, toon, track, scene, cars, traffic = () => [], residents = null }) {
  let a = 1709; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, L = N * ds, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c), hs = track.oneSide || -1;
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return V(A.p.x + A.r.x * d, 0, A.p.z + A.r.z * d); };
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  const people = [], lights = [], events = [];
  // (the stand-in blocks dressed as the town's people once their models are loaded: walking, running (the walk sped up), sitting)
  const mixers = [], dress = (f, key, act = 'walk', speed = 1, tint = null, lift = 0) => { residents?.spawn(key).then(o => { if (!o) return; for (const c of f.g.children) c.visible = false; f.g.add(o.G); o.G.position.set(0, lift, 0); o.G.rotation.set(0, f.flip ? Math.PI : 0, 0);
      if (tint) o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(/pant|jean|trous|leg/i.test(q.material.name + q.name) ? '#3b4a5e' : tint); });
      const a = o.acts[act] || o.acts.walk || o.acts.idle; if (a) { a.play(); a.timeScale = speed; a.time = rnd() * 2; } f.dressed = o; mixers.push(o.mixer); }); };
  const SORRY = deck(['OJ, NIE WIDZIAŁEM CIĘ!', 'PRZEPRASZAM, SPIESZĘ SIĘ DO PRACY!', 'GAZETA NA SZYBIE? NO DOBRA, ZASŁUŻYŁEM.', 'LUSTERKA MAM, TYLKO NIE PATRZĘ.']);
  const BINMEN = deck(['UWAGA, KUBEŁ JEDZIE!', 'Z DROGI, MŁODY, ŚMIECI CZEKAJĄ!', 'TY ROZNOSISZ, MY ZBIERAMY. KOŁO ŻYCIA.', 'RZUĆ GAZETĘ, PRZECZYTAM W KABINIE!']);
  const BINPAPER = deck(['DZIĘKI! NA DRUGIE ŚNIADANIE JAK ZNALAZŁ.', 'O, PROGNOZA POGODY. BĘDZIE ŚMIERDZIAŁO.', 'ZŁAPANE! LEPIEJ NIŻ KUBEŁ.']);
  const pv = (i, d) => { const p = at(i, d); p.y = gy(p.x, p.z, i); return p; };

  // ---------- cars on the drives (the houses' side), nose to the house, backing out when he comes ----------
  const backers = [];
  if (cars) { const doors = track.doors.slice().sort((x, y) => x.i - y.i); let last = -1e9;
    for (const d of doors) { if ((d.i - last) * ds < 40 || rnd() < .25) continue; last = d.i; const i = wrap(d.i + Math.round(5 / ds)), A = S[i], c = cars.random(rnd);
      const g = c.group, d0 = hs * (track.PAVE + 4.2), yawIn = Math.atan2(A.r.x * hs, A.r.z * hs); g.userData.keep = true; scene.add(g);
      const lamps = []; for (const x of [-.55, .55]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.22, .14, .05), new THREE.MeshBasicMaterial({ color: '#f6f3ea' })); l.position.set(x, .75, -(c.half[1] + .02)); l.visible = false; g.add(l); lamps.push(l); }
      g.updateMatrixWorld(true); const roofH = Math.min(3, new THREE.Box3().setFromObject(g).max.y - g.position.y);
      // (a plank on the pavement before the drive: off it, over the car as it backs out, or onto its roof)
      { const ir = wrap(i - Math.round(7 / ds)), Ar = S[ir], o = track.props.ramp(rnd, 'plank'), pr = pv(ir, hs * (track.KERB + 1.3)); o.group.position.copy(pr); o.group.rotation.y = Math.atan2(Ar.f.x, Ar.f.z); scene.add(o.group); o.group.updateMatrixWorld(true); const C = track.addHit(o.group, o.hit, ir); track.ramps?.push(C); }
      backers.push({ g, c, i, d: d0, d0, d1: hs * 2.2, yawIn, lamps, st: 'in', t: 0, hitT: 0, sorry: 0, roofH, P0: { s: i * ds, d: hs * 2.2, len: 5 }, car: c, yaw: yawIn + Math.PI, v: 0, stop: 0 }); } }

  // ---------- sprinklers on the lawns: a jet of water sweeping to and fro over the pavement ----------
  const sprinklers = [], waterM = new THREE.MeshBasicMaterial({ color: '#cfe8f5', transparent: true, opacity: .55, depthWrite: false });
  for (const d of track.doors.filter((_, k) => k % 3 === 1)) { const i = wrap(d.i - Math.round(4 / ds)), p = pv(i, hs * (track.PAVE + 1.2)), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .18, 8), M('#3a3d42'))); g.children[0].position.y = .09; const jet = new THREE.Group(); jet.position.y = .2; g.add(jet);
    for (let k = 0; k < 9; k++) { const dr = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .5), waterM); const u = k / 8; dr.position.set(0, Math.sin(u * Math.PI) * 1.3, u * 4.2); dr.rotation.x = -Math.cos(u * Math.PI) * .7; jet.add(dr); }
    g.position.copy(p); scene.add(g); const A = S[i]; sprinklers.push({ g, jet, i, p, base: Math.atan2(A.r.x * -hs, A.r.z * -hs), sw: 0, dir: 1, wetT: 0, flipT: 0 }); }

  // ---------- the dustcart and its two bin men ----------
  let cart = null;
  { const g = new THREE.Group(), green = M('#3f7a4a'), dark = M('#2a2c30'), bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    bx(2.3, 1.7, 2, M('#e8e4dc'), 0, 1.65, 2.6); bx(2.2, .8, .06, M('#3f5566'), 0, 2.05, 3.62); bx(2.4, 2.6, 5, green, 0, 2.1, -1.2); bx(2.42, .3, 5.02, M('#efc930'), 0, 1.2, -1.2); bx(2.2, 1.2, .6, dark, 0, 1.4, -3.9);
    for (const x of [-1.1, 1.1]) for (const z of [2.4, -.4, -2.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .35, 12).rotateZ(Math.PI / 2), dark); w.position.set(x, .5, z); g.add(w); }
    const beacon = bx(.25, .18, .25, new THREE.MeshBasicMaterial({ color: '#ffb020' }), 0, 2.6, 3.2); scene.add(g);
    const man = () => { const m = new THREE.Group(), vest = M('#e8742e'), b = new THREE.Mesh(new THREE.BoxGeometry(.44, .62, .28), vest); b.position.y = 1.12; m.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), M('#d9a07a')); h.position.y = 1.6; m.add(h);
      const legs = [-1, 1].map(sd => { const l = new THREE.Group(), lm = new THREE.Mesh(new THREE.BoxGeometry(.14, .78, .16), M('#3b4a5e')); lm.position.y = -.39; l.add(lm); l.position.set(sd * .1, .8, 0); m.add(l); return l; });
      const bin = new THREE.Mesh(new THREE.BoxGeometry(.6, .9, .6), M('#5a6b4a')); bin.position.set(0, .45, .55); bin.visible = false; m.add(bin); scene.add(m); return { g: m, legs, bin, d: 0, ph: 0, sayT: 0, hitT: 0, paperT: 0 }; };
    const men = [man(), man()]; for (const m of men) { dress(m, 'gardener', 'walk', 1.3, '#e8742e'); }
    for (const m of men) people.push({ g: m.g, x: 0, z: 0, kind: 'binman', P: null, m });
    const P0 = { s: L * .3, d: 1.6, len: 7 }; track.parked.push(P0);   // (in the lane of the way it drives)
    cart = { g, beacon, men, s: L * .3, v: 0, stop: 0, go: 30, P0, hitT: 0, sayT: 0 }; }

  // ---------- tyres rolling across the road: from the far side, over to the houses ----------
  const tyres = [], tyreM = M('#24262a'), hubM = M('#9a9c9e'); let tyreT = 5;
  const tyre = () => { const g = new THREE.Group(), w = new THREE.Mesh(new THREE.TorusGeometry(.32, .13, 6, 12), tyreM), h = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .2, 8).rotateX(Math.PI / 2), hubM); g.add(w, h); scene.add(g); return g; };
  // ---------- jump over the kids: a ramp on the far lawn, three of them sitting in a row behind it, cheering ----------
  const shows = [], CHEER = deck(['DAWAJ!', 'SKACZ!', 'NAD NAMI!', 'JESZCZE RAZ!', 'ALE ODLOT!']);
  for (const f of [.27, .5, .73]) { const i = wrap(Math.round(N * f)), A = S[i], d = -hs * (track.PAVE + 3.4), o = track.props.ramp(rnd, 'big'), pr = pv(i, d); o.group.position.copy(pr); o.group.rotation.y = Math.atan2(A.f.x, A.f.z); scene.add(o.group); o.group.updateMatrixWorld(true); const C = track.addHit(o.group, o.hit, i); track.ramps?.push(C);
    const kids = []; for (let k = 0; k < 3; k++) { const ik = wrap(i + Math.round((6.5 + k * .9) / ds)), p = pv(ik, d), g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(.34, .4, .26), M(['#cf3a2c', '#3b6fa0', '#efc930'][k])); b.position.y = .32; const hd = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), M('#e3b08a')); hd.position.y = .62; g.add(b, hd); g.position.copy(p); g.rotation.y = Math.atan2(A.r.x * hs, A.r.z * hs); scene.add(g); kids.push({ g, p, ph: rnd() * 6 }); }
    shows.push({ kids, done: 0, sayT: 0 }); }

  // ---------- the far side's people ----------
  const os = -hs, fig = (coat, hat, skin = '#e3b08a') => { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(.42, .62, .26), M(coat)); b.position.y = 1.12; g.add(b); const hd = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), M(skin)); hd.position.y = 1.6; g.add(hd);
    if (hat) { const h = new THREE.Mesh(new THREE.BoxGeometry(.26, .08, .26), M(hat)); h.position.y = 1.74; g.add(h); }
    const legs = [-1, 1].map(sd => { const l = new THREE.Group(), lm = new THREE.Mesh(new THREE.BoxGeometry(.14, .78, .16), M('#2a2c30')); lm.position.y = -.39; l.add(lm); l.position.set(sd * .1, .8, 0); g.add(l); return l; }); scene.add(g); return { g, legs }; };
  // (the pensioners: on every other bench, each his own way of talking)
  const OLD = [
    { coat: '#6a5a4a', hat: '#3a3d42', talk: ['ZA MOICH CZASÓW GAZETĘ PRZYNOSIŁ LISTONOSZ. PIESZO. POD GÓRĘ.', 'SIEDZĘ TU OD SZÓSTEJ. LICZĘ SAMOCHODY. DZIŚ JUŻ CZTERDZIEŚCI DWA.', 'TEN ZRASZACZ U SĄSIADA LEJE NA CHODNIK OD TRZECH LAT. NIKT NIC.'], paper: 'DZIĘKUJĘ. KRZYŻÓWKA JEST? TO DZIEŃ URATOWANY.' },
    { coat: '#8a4a6a', hat: null, talk: ['UWAŻAJ NA TEGO Z PSEM. PIES MIŁY, PAN GORZEJ.', 'GOŁĘBIE KARMIĘ. ONE MNIE NIE KARMIĄ, ALE PRZYCHODZĄ.', 'MÓJ WNUK TEŻ JEŹDZI NA ROWERZE. W TELEFONIE.'], paper: 'O, GAZETKA! PRZECZYTAM I POŻYCZĘ PANU OBOK. ON NIE ODDA.' },
    { coat: '#3b4a5e', hat: '#8a6a44', talk: ['SZYBĘ ZBIJESZ, TO CIĘ GONIĆ BĘDĄ. JA BYM GONIŁ. GDYBYM MÓGŁ.', 'NA TEJ ULICY NIC SIĘ NIE DZIEJE. POZA WSZYSTKIM.', 'ŚMIECIARKA JEŹDZI WOLNIEJ NIŻ JA CHODZĘ. A JA CHODZĘ Z LASKĄ.'], paper: 'POŁÓŻ OBOK, MŁODY. OKULARY MAM W DOMU, A DOM MAM DALEKO.' }];
  (track.benches || []).filter((_, k) => k % 2 === 0).forEach((Bn, k) => { const P = OLD[k % OLD.length], f = fig(P.coat, P.hat), A = S[wrap(Bn.i)]; f.g.position.set(Bn.p.x, Bn.p.y - .45, Bn.p.z); f.g.rotation.y = Math.atan2(A.r.x * hs, A.r.z * hs); for (const l of f.legs) l.rotation.x = -1.4; f.flip = true; dress(f, ['grandpa', 'granma', 'grandpa'][k % 3], 'idle', 1, null, .45);
    people.push({ g: f.g, x: Bn.p.x, z: Bn.p.z, kind: 'old', P, talks: 0, m: { paperT: 0 } }); });
  // (joggers on the far pavement, up and down a stretch each)
  const joggers = [0, 1, 2].map(k => { const f = fig(['#cf3a2c', '#3f8a4a', '#3b6fa0'][k], k === 1 ? '#f6f3ea' : null); dress(f, 'jogger', 'walk', 1.9, ['#cf3a2c', '#3f8a4a', '#3b6fa0'][k]); return { ...f, s: L * (.15 + k * .3), dir: k % 2 ? -1 : 1, lo: L * (.1 + k * .3), hi: L * (.1 + k * .3) + 120, ph: 0, hitT: 0, sayT: 0 }; });
  const JOG = deck(['Z LEWEJ!', 'UWAGA, BIEGNĘ!', 'DZIEŃ DOBRY! UFF!', 'PIĄTY KILOMETR!']);
  // (a man and his dog on a long lead, across the pavement: the dog sniffs the lawn, he keeps to the kerb)
  const walk = (() => { const man = fig('#5a5f66', '#24190f'); dress(man, 'suit', 'walk', .7); const dog = new THREE.Group(), dm = M('#b88a5a'); const bd = new THREE.Mesh(new THREE.BoxGeometry(.25, .3, .6), dm); bd.position.y = .35; const hd = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .22), dm); hd.position.set(0, .5, .38); dog.add(bd, hd); scene.add(dog);
    const lead = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, 1), M('#cf3a2c')); scene.add(lead); return { man, dog, lead, s: L * .45, dir: 1, ph: 0, hitT: 0, sayT: 0 }; })();
  const LEAD = deck(['UWAŻAJ NA SMYCZ!', 'BURKUŚ, DO NOGI!', 'NIE PRZEZ SMYCZ, PANIE!']);
  // (the kids at football on the far lawn; now and then the ball goes out onto the road)
  const balls = [], ballM = M('#f6f3ea'); let ballT = 7;
  // (a window broken: the owner out after him)
  const chasers = [], OWNER = deck(['WRACAJ TU!', 'ZA SZYBĘ ZAPŁACISZ!', 'STÓJ, GAZECIARZU!', 'JA CI DAM GAZETĘ!', 'MAM CIĘ NA NAGRANIU!']);
  function angry(w) { if (chasers.length > 1) return; const f = fig(['#8e2e25', '#3b5670', '#6b4a2e'][chasers.length % 3], null); dress(f, ['suit', 'gardener', 'shopper'][chasers.length % 3], 'walk', 2.4); const p = w.p.clone().addScaledVector(w.n, 2); f.g.position.set(p.x, gy(p.x, p.z), p.z); chasers.push({ ...f, x: p.x, z: p.z, t: 0, ph: 0, sayT: 0 }); }

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0), W0 = api.wave; for (const mx of mixers) mx.update(dt);
    // (the joggers)
    for (const J of joggers) { J.s += J.dir * 2.6 * dt; if (J.s > J.hi) J.dir = -1; if (J.s < J.lo) J.dir = 1; const i = wrap(Math.round(J.s / ds)), A = S[i], p = pv(i, os * (track.KERB + 1.4)); J.g.position.copy(p); J.g.rotation.y = Math.atan2(A.f.x * J.dir, A.f.z * J.dir); J.ph += dt * 10; J.legs[0].rotation.x = Math.sin(J.ph) * .7; J.legs[1].rotation.x = -Math.sin(J.ph) * .7;
      J.hitT = Math.max(0, J.hitT - dt); J.sayT -= dt; const dist = Math.hypot(R.x - p.x, R.z - p.z); if (dist < 7 && J.sayT <= 0) { J.sayT = 15; ev.push({ kind: 'shout', p: { g: J.g }, text: JOG() }); }
      if (!R.foot && !R.air && !J.hitT && dist < .6 && Math.abs(R.v) > 2) { J.hitT = 3; ev.push({ kind: 'bump', p: { g: J.g } }); } }
    // (the dog walker: slow along the kerb, the dog out on the lawn, the lead between them)
    { const W = walk; W.s += W.dir * .8 * dt; const i = wrap(Math.round(W.s / ds)), A = S[i], pm = pv(i, os * (track.KERB + .9)), ip = wrap(i + Math.round(1 / ds)), pd = pv(ip, os * (track.KERB + 3.4 + Math.sin(clock * .7) * .6));
      W.man.g.position.copy(pm); W.man.g.rotation.y = Math.atan2(A.f.x * W.dir, A.f.z * W.dir); W.ph += dt * 4; W.man.legs[0].rotation.x = Math.sin(W.ph) * .4; W.man.legs[1].rotation.x = -Math.sin(W.ph) * .4;
      W.dog.position.copy(pd); W.dog.rotation.y = Math.atan2(pd.x - pm.x, pd.z - pm.z) + Math.sin(clock * 3) * .3; const a0 = V(pm.x, pm.y + .9, pm.z), b0 = V(pd.x, pd.y + .45, pd.z); W.lead.position.copy(a0).add(b0).multiplyScalar(.5); W.lead.lookAt(b0); W.lead.scale.z = a0.distanceTo(b0);
      if (W.s > L * .45 + 160) W.dir = -1; if (W.s < L * .45) W.dir = 1; W.hitT = Math.max(0, W.hitT - dt); W.sayT -= dt;
      const ex = b0.x - a0.x, ez = b0.z - a0.z, l2 = ex * ex + ez * ez, t = Math.max(0, Math.min(1, ((R.x - a0.x) * ex + (R.z - a0.z) * ez) / l2)), dd = Math.hypot(R.x - (a0.x + ex * t), R.z - (a0.z + ez * t));
      if (!R.foot && !W.hitT && dd < .35 && !((R.h || 0) > .5) && Math.abs(R.v) > 1) { W.hitT = 3; ev.push({ kind: 'leash' }); ev.push({ kind: 'shout', p: { g: W.man.g }, text: LEAD() }); } else if (dd < 6 && W.sayT <= 0) { W.sayT = 14; ev.push({ kind: 'shout', p: { g: W.man.g }, text: LEAD() }); } }
    // (the football: a ball now and then out onto the road ahead of him, from the far lawn)
    ballT -= dt; if (ballT <= 0 && Math.abs(R.v) > 2 && R.s != null && balls.length < (W0 ? 4 : 2)) { ballT = W0 ? 1.4 + rnd() : 7 + rnd() * 6; const i = wrap(Math.round((R.s + (R.along || 1) * (16 + rnd() * 10)) / ds)), g = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), ballM); scene.add(g); balls.push({ g, i, d: os * (track.PAVE + 6), v: 5 + rnd() * 2, hitT: 0 }); }
    for (let k = balls.length - 1; k >= 0; k--) { const Bl = balls[k]; Bl.d -= os * Bl.v * dt; const p = pv(Bl.i, Bl.d); Bl.g.position.set(p.x, p.y + .18 + Math.abs(Math.sin(clock * 8)) * .25, p.z); Bl.hitT = Math.max(0, Bl.hitT - dt);
      if (!R.foot && !Bl.hitT && Math.hypot(R.x - p.x, R.z - p.z) < .5 && !((R.h || 0) > .4)) { Bl.hitT = 3; ev.push({ kind: 'ball' }); }
      if (Math.sign(Bl.d) === hs && Math.abs(Bl.d) > track.PAVE + 2) { scene.remove(Bl.g); balls.splice(k, 1); } }
    // (the owners after him: they run at 5.6 m/s (faster than he rolls, slower than his pedalling); caught: a kick; 9 s, or far behind: they give up)
    for (let k = chasers.length - 1; k >= 0; k--) { const Ch = chasers[k]; Ch.t += dt; const dx = R.x - Ch.x, dz = R.z - Ch.z, dist = Math.hypot(dx, dz);
      if (Ch.t > 9 || dist > 32) { ev.push({ kind: 'shout', p: { g: Ch.g }, text: 'JESZCZE CIĘ ZŁAPIĘ!' }); scene.remove(Ch.g); chasers.splice(k, 1); continue; }
      const sp = 5.6 * dt; Ch.x += dx / (dist || 1) * Math.min(sp, dist); Ch.z += dz / (dist || 1) * Math.min(sp, dist); Ch.g.position.set(Ch.x, gy(Ch.x, Ch.z), Ch.z); Ch.g.rotation.y = Math.atan2(dx, dz); Ch.ph += dt * 12; Ch.legs[0].rotation.x = Math.sin(Ch.ph) * .8; Ch.legs[1].rotation.x = -Math.sin(Ch.ph) * .8;
      Ch.sayT -= dt; if (Ch.sayT <= 0) { Ch.sayT = 2.6; ev.push({ kind: 'shout', p: { g: Ch.g }, text: OWNER() }); }
      if (dist < .9 && !R.foot && !((R.h || 0) > 1)) { ev.push({ kind: 'owner', p: { g: Ch.g } }); scene.remove(Ch.g); chasers.splice(k, 1); } }
    // (a tyre now and then, 18-30 m ahead of him, rolling across from the far side; it bounces a little; gone past the houses' kerb)
    tyreT -= dt; if (tyreT <= 0 && Math.abs(R.v) > 2 && R.s != null && tyres.length < (W0 ? 6 : 3)) { tyreT = W0 ? .9 + rnd() * .7 : 4 + rnd() * 5; const i = wrap(Math.round((R.s + (R.along || 1) * (14 + rnd() * 12)) / ds)), sg = W0 && rnd() < .5 ? -hs : hs; tyres.push({ g: tyre(), i, sg, d: -sg * (track.PAVE + 1), v: (W0 ? 4.4 : 3.6) + rnd() * 1.4, spin: 0, hitT: 0 }); }   // (the finale's wave: from both sides, one after another)
    for (let k = tyres.length - 1; k >= 0; k--) { const T0 = tyres[k], A = S[T0.i]; T0.d += (T0.sg || hs) * T0.v * dt; T0.spin += T0.v * dt / .4; const p = pv(T0.i, T0.d); T0.g.position.set(p.x, p.y + .45 + Math.abs(Math.sin(T0.spin * .7)) * .12, p.z); T0.g.rotation.set(0, Math.atan2(A.f.x, A.f.z), 0); T0.g.rotateX(T0.spin);
      T0.hitT = Math.max(0, T0.hitT - dt); if (!R.foot && !T0.hitT && Math.hypot(R.x - p.x, R.z - p.z) < .55 && !((R.h || 0) > .55)) { T0.hitT = 3; ev.push({ kind: 'tyre' }); }
      if (Math.abs(T0.d) > track.PAVE + 3 && Math.sign(T0.d) === (T0.sg || hs)) { scene.remove(T0.g); tyres.splice(k, 1); } }
    // (the kids behind the ramp: they bob and wave; him over their heads in the air: a bonus; into them on the ground: a bump)
    for (const Sh of shows) { Sh.sayT -= dt; for (const K of Sh.kids) { K.ph += dt * 5; K.g.position.y = K.p.y + Math.max(0, Math.sin(K.ph)) * .12; const dist = Math.hypot(R.x - K.p.x, R.z - K.p.z);
        if (dist < 9 && Sh.sayT <= 0) { Sh.sayT = 8; ev.push({ kind: 'shout', p: { g: K.g }, text: CHEER() }); }
        if (dist < 1.2 && !R.foot) { if ((R.h || 0) > 1.1 && clock - Sh.done > 6) { Sh.done = clock; ev.push({ kind: 'overhead', p: { g: K.g } }); } else if (!R.air && !(K.hitT > clock)) { K.hitT = clock + 3; ev.push({ kind: 'bump', p: { g: K.g } }); } } } }
    // (the drives: lights on as he comes (25 m off, the way he rides), out it backs, a wait at the road's edge, back in)
    for (const K of backers) { const A = S[K.i], ahead = ((((K.i * ds - (R.s ?? 0)) * (R.along || 1)) % L) + L * 1.5) % L - L / 2;
      if (K.st === 'in' && ahead > 6 && ahead < 26 && Math.abs(R.v) > 1) { K.st = 'lights'; K.t = 0; }
      K.t += dt; if (K.st === 'lights' && K.t > .9 && !traffic().some(b => !b.t?.r && Math.hypot(b.x - A.p.x, b.z - A.p.z) < 18)) { K.st = 'out'; K.t = 0; if (!track.parked.includes(K.P0)) track.parked.push(K.P0); } if (K.st === 'out') { K.d += (K.d1 - K.d) > 0 ? Math.min(K.d1 - K.d, 2.2 * dt) : Math.max(K.d1 - K.d, -2.2 * dt); if (Math.abs(K.d - K.d1) < .02) { K.st = 'wait'; K.t = 0; } }
      if (K.st === 'wait' && K.t > 2.6) { K.st = 'back'; K.t = 0; } if (K.st === 'back') { K.d += (K.d0 - K.d) > 0 ? Math.min(K.d0 - K.d, 1.6 * dt) : Math.max(K.d0 - K.d, -1.6 * dt); if (Math.abs(K.d - K.d0) < .02) { K.st = 'rest'; K.t = 0; } }
      if (K.st === 'rest') { const ix = track.parked.indexOf(K.P0); if (ix >= 0) track.parked.splice(ix, 1); }
      if (K.st === 'rest' && K.t > 18 && Math.abs(ahead) > 60) K.st = 'in';
      K.v = K.st === 'out' ? 2.2 : K.st === 'back' ? -1.6 : 0;   // (backing out: along its tail; going back in: the other way)
      for (const l of K.lamps) l.visible = K.st === 'lights' || K.st === 'out';
      const p = pv(K.i, K.d); K.g.position.copy(p); K.g.rotation.y = K.yawIn; K.hitT = Math.max(0, K.hitT - dt);
      const dx = R.x - p.x, dz = R.z - p.z, lz = dx * Math.sin(K.yawIn) + dz * Math.cos(K.yawIn), lx = dx * Math.cos(K.yawIn) - dz * Math.sin(K.yawIn);
      if (!R.foot && !K.hitT && !((R.h || 0) > K.roofH - .45) && Math.abs(lx) < K.c.half[0] + .3 && Math.abs(lz) < K.c.half[1] + .3 && (K.st === 'out' || K.st === 'back')) { K.hitT = 3; ev.push({ kind: 'driveway' }); } }
    // (the sprinklers: sweeping; in the jet, the wheels slip)
    for (const W of sprinklers) { W.flipT = Math.max(0, W.flipT - dt); W.sw += W.dir * dt * .9; if (Math.abs(W.sw) > 1.1) { W.sw = Math.sign(W.sw) * 1.1; W.dir *= -1; } W.jet.rotation.y = W.base + W.sw;
      W.wetT = Math.max(0, W.wetT - dt); const dx = R.x - W.p.x, dz = R.z - W.p.z, dist = Math.hypot(dx, dz); if (dist < 4.6 && dist > .4 && !R.foot && !R.air && !W.wetT) { const ang = Math.atan2(dx, dz), da = Math.atan2(Math.sin(ang - W.base - W.sw), Math.cos(ang - W.base - W.sw)); if (Math.abs(da) < .35) { W.wetT = 2; ev.push({ kind: 'wet' }); } } }
    // (the dustcart: up the road in its lane slowly, a stop every 35-50 m: the men out across the road to the bins and back)
    if (cart) { const C = cart; C.hitT = Math.max(0, C.hitT - dt); C.sayT -= dt;
      if (C.stop > 0) { C.stop -= dt; C.v = 0; } else { C.v += (3 - C.v) * Math.min(1, dt * 1.5); C.go -= C.v * dt; if (C.go <= 0) { C.stop = 7; C.go = 35 + rnd() * 15; } }
      C.s = ((C.s + C.v * dt) % L + L) % L; C.P0.s = C.s; const i = wrap(Math.round(C.s / ds)), A = S[i], d = 1.6, x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d, yaw = Math.atan2(A.f.x, A.f.z);
      C.g.position.set(x, gy(x, z, i), z); C.g.rotation.y = yaw; C.beacon.visible = (clock * 3 | 0) % 2 === 0;
      const ph = C.stop > 0 ? 1 - Math.abs((7 - C.stop) / 3.5 - 1) : 0;   // (0 by the cart, 1 at the bins, back to 0)
      C.men.forEach((m, k) => { const dm = d + (hs * (track.ROAD + 2.4) - d) * Math.max(0, Math.min(1, ph * 1.15)), off = k ? -2.4 : -3.6, mi = wrap(i + Math.round(off / ds)), B0 = S[mi];
        const mx = B0.p.x + B0.r.x * (C.stop > 0 ? dm : d + Math.sign(-hs) * 1.4), mz = B0.p.z + B0.r.z * (C.stop > 0 ? dm : d + Math.sign(-hs) * 1.4); m.g.position.set(mx, gy(mx, mz, mi) + (C.stop > 0 ? 0 : 1.3), mz);
        const moving = C.stop > 0 && ph > .02 && ph < .98; m.ph += dt * (moving ? 9 : 0); m.legs[0].rotation.x = Math.sin(m.ph) * .5; m.legs[1].rotation.x = -Math.sin(m.ph) * .5; m.bin.visible = C.stop > 0 && C.stop < 3.5;
        m.g.rotation.y = Math.atan2(B0.r.x * (ph < .5 && C.stop > 3.5 ? hs : -hs), B0.r.z * (ph < .5 && C.stop > 3.5 ? hs : -hs)) * (C.stop > 0 ? 1 : 0) + (C.stop > 0 ? 0 : yaw);
        const pp = people.find(q => q.m === m); pp.x = mx; pp.z = mz; m.hitT = Math.max(0, m.hitT - dt); m.paperT = Math.max(0, m.paperT - dt);
        if (C.stop > 0 && !R.foot && !R.air && !m.hitT && Math.hypot(R.x - mx, R.z - mz) < .6 && Math.abs(R.v) > 2) { m.hitT = 3; ev.push({ kind: 'bump', p: { g: m.g } }); } });
      const dx = R.x - x, dz = R.z - z, lz = dx * Math.sin(yaw) + dz * Math.cos(yaw), lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      if (C.sayT <= 0 && Math.hypot(dx, dz) < 18) { C.sayT = 12; ev.push({ kind: 'shout', p: { g: C.men[0].g }, text: BINMEN() }); }
      if (!R.foot && !C.hitT && !(R.air && R.h > 3.2) && Math.abs(lx) < 1.35 && lz > -4.3 && lz < 3.8) { C.hitT = 3; ev.push({ kind: 'truck' }); } }
    return ev; }
  function kick(p) { return p.kind === 'old' ? 'TAK SIĘ TRAKTUJE STARSZYCH?!' : 'EJ! ŚMIECIARZA SIĘ NIE KOPIE!'; }
  function talk(p) { if (p.kind === 'old') { p.talks = (p.talks || 0) + 1; return p.P.talk[(p.talks - 1) % p.P.talk.length]; } return BINMEN(); }
  // (a paper: to a bin man, caught; onto a windscreen backing out, the driver stops; into a sprinkler, it turns the other way)
  function paper(Pp) {
    for (const p of people) { if (p.m.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.m.paperT = 30; if (p.kind === 'old') return { p, text: p.P.paper, who: 'old', pts: 1, label: 'DO RĄK! +1' }; return { p, text: BINPAPER(), who: 'binman', pts: 2, label: 'DLA ŚMIECIARZA! +2' }; }
    for (const K of backers) { if (!(K.st === 'out' || K.st === 'lights' || K.st === 'wait') || Math.hypot(K.g.position.x - Pp.x, K.g.position.z - Pp.z) > 1.8) continue; K.st = 'wait'; K.t = 0; return { p: { g: K.g }, text: SORRY(), who: 'driver', pts: 2, label: 'NA SZYBĘ! +2' }; }
    for (const W of sprinklers) { if (W.flipT || Math.hypot(W.p.x - Pp.x, W.p.z - Pp.z) > 1) continue; W.flipT = 2; W.dir *= -1; return { p: { g: W.g }, text: 'PSSST!', who: 'sprinkler', pts: 1, label: 'ZRASZACZ! +1' }; }
    return null; }
  const api = { id: 'classic', wave: false, people, lights, update, kick, talk, paper, angry, backers, sprinklers, cart }; return api;
}
