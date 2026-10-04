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

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function createClassic({ THREE, toon, track, scene, cars, traffic = () => [], residents = null }) {
  let a = 1709; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds } = track, L = N * ds, wrap = i => ((i % N) + N) % N, V = (x, y, z) => new THREE.Vector3(x, y, z), M = c => toon(c), hs = track.oneSide || -1;
  const gy = (x, z, i) => track.probe(x, z, i ?? -1).y, at = (i, d) => { const A = S[wrap(i)]; return V(A.p.x + A.r.x * d, 0, A.p.z + A.r.z * d); };
  const deck = lines => { let left = []; return () => { if (!left.length) left = lines.slice().sort(() => rnd() - .5); return left.pop(); }; };
  const people = [], lights = [], events = [];
  // (the stand-in blocks dressed as the town's people once their models are loaded: walking, running (the walk sped up), sitting)
  const mixers = [], figs = [], dress = (f, key, act = 'walk', speed = 1, tint = null, lift = 0) => { residents?.spawn(key).then(o => { if (!o) return; for (const c of f.g.children) if (!c.userData.keepShown) c.visible = false; f.g.add(o.G); o.G.position.set(0, lift, 0); o.G.rotation.set(0, f.flip ? Math.PI : 0, 0);
      if (tint) o.m.traverse(q => { if (q.isMesh && !/skin|body|eye|teeth|tongue|brow|lash|hair/i.test(q.material.name + q.name)) q.material.color.set(/pant|jean|trous|leg|short|skirt|trouser/i.test(q.material.name + q.name) ? '#3b4a5e' : tint); });
      f.dressed = o; f.speed = speed; f.act = null; setAct(f, act, speed, 0, true); mixers.push(o.mixer); figs.push(f); }); };
  // (a clip by name, crossfaded from the one playing; 'run' where the model has none: its walk, faster)
  const setAct = (f, name, speed = f.speed || 1, fade = .25, rand = false) => { const o = f.dressed; if (!o) return false; let a = o.acts[name];
    if (!a && name === 'run' && o.acts.walk) { a = o.acts.walk; speed *= 2.1; } if (!a) a = f.act ? null : (o.acts.walk || o.acts.idle); if (!a) return false;
    if (f.act === a) { a.timeScale = speed; return true; } a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.clampWhenFinished = false; a.timeScale = speed; a.play(); if (rand) a.time = rnd() * 2;
    if (f.act && fade) a.crossFadeFrom(f.act, fade, false); else if (f.act) f.act.stop(); f.act = a; f.actName = name; f.onceT = 0; return true; };
  const once = (f, name, speed = 1) => { const o = f.dressed, a = o?.acts[name]; if (!a || f.onceT > 0) return; const back = f.actName; a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = speed; a.play();
    if (f.act && f.act !== a) a.crossFadeFrom(f.act, .15, false); f.act = a; f.actName = name; f.onceT = a.getClip().duration / speed - .15; f.back = back; };
  const ALOAD = {}, animal = key => (ALOAD[key] ||= new Promise(ok => new GLTFLoader().load(`assets/animals/${key}.glb`, ok, undefined, () => ok(null))));
  const SCALE = { ShibaInu: .19, Husky: .245, Cow: .254, Bull: .27 };                // (the pack's own units: a cow 8 m long; these make it some 2 m, a shiba .8 m)
  const beast = (holder, key, clip = 'Walk', speed = 1) => animal(key).then(g => { if (!g) return; const m = SkeletonUtils.clone(g.scene);
    m.scale.setScalar(SCALE[key] || .25);
    m.traverse(o => { if (o.isMesh) { const om = o.material; o.material = toon(om.color ? om.color.clone() : '#ffffff', { map: om.map || null, vertexColors: !!o.geometry.attributes.color }); o.castShadow = true; o.frustumCulled = false; } });
    for (const c of holder.children) if (!c.userData.keepShown) c.visible = false; holder.add(m);
    const mixer = new THREE.AnimationMixer(m), acts = {}; for (const c of g.animations) { const n = c.name.split('|').pop(); if (!acts[n]) acts[n] = mixer.clipAction(c); } mixers.push(mixer);
    holder.userData.beast = { m, mixer, acts, cur: null }; playB(holder, clip, speed, true); });
  const playB = (holder, name, speed = 1, rand = false) => { const B = holder.userData.beast; if (!B) return; const a = B.acts[name]; if (!a) return; a.timeScale = speed; if (B.cur === a) return;
    a.reset().play(); if (rand) a.time = rnd() * 2; if (B.cur) a.crossFadeFrom(B.cur, .3, false); B.cur = a; };
  // (the pasture's cows: grazing, now and then lifting their heads)
  for (const C of track.cows || []) { const h = new THREE.Group(); h.position.copy(C.p); h.rotation.y = C.yaw; scene.add(h); beast(h, rnd() < .25 ? 'Bull' : 'Cow', rnd() < .7 ? 'Eating' : 'Idle', .7 + rnd() * .5); }
  const SORRY = deck(['OJ, NIE WIDZIAŁEM CIĘ!', 'PRZEPRASZAM, SPIESZĘ SIĘ DO PRACY!', 'GAZETA NA SZYBIE? NO DOBRA, ZASŁUŻYŁEM.', 'LUSTERKA MAM, TYLKO NIE PATRZĘ.']);
  const BINMEN = deck(['UWAGA, KUBEŁ JEDZIE!', 'Z DROGI, MŁODY, ŚMIECI CZEKAJĄ!', 'TY ROZNOSISZ, MY ZBIERAMY. KOŁO ŻYCIA.', 'RZUĆ GAZETĘ, PRZECZYTAM W KABINIE!']);
  const BINPAPER = deck(['DZIĘKI! NA DRUGIE ŚNIADANIE JAK ZNALAZŁ.', 'O, PROGNOZA POGODY. BĘDZIE ŚMIERDZIAŁO.', 'ZŁAPANE! LEPIEJ NIŻ KUBEŁ.']);
  const pv = (i, d) => { const p = at(i, d); p.y = gy(p.x, p.z, i); return p; };

  // ---------- cars on the drives (the houses' side), nose to the house, backing out when he comes ----------
  const backers = [];
  if (cars && !track.city) { const doors = track.doors.slice().sort((x, y) => x.i - y.i); let last = -1e9;   // (in town: no drives)
    // (the drive only where the car's whole way out is clear: from the drive across the pavement to the lane, its width, nothing standing on it)
    const clearWay = i => { for (let dd = 1.8; dd <= track.PAVE + 6.5; dd += .7) for (const off of [-1.15, 0, 1.15]) { const ii = wrap(i + Math.round(off / ds)), p = pv(ii, hs * dd); for (const C of track.near(ii)) { if (C.kind === 'soft') continue; const dx = p.x - C.x, dz = p.z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; if (Math.abs(lx) < C.hx + .35 && Math.abs(lz) < C.hz + .35) return false; } } return true; };
    for (const d of doors) { if ((d.i - last) * ds < 40 || rnd() < .25) continue; const i = [5, 6.5, -5, -6.5, 8].map(o => wrap(d.i + Math.round(o / ds))).find(clearWay); if (i == null) continue; last = d.i; const A = S[i], c = cars.random(rnd);
      const g = c.group, d0 = hs * (track.PAVE + 4.2), yawIn = Math.atan2(A.r.x * hs, A.r.z * hs); g.userData.keep = true; scene.add(g);
      const lamps = []; for (const x of [-.55, .55]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.22, .14, .05), new THREE.MeshBasicMaterial({ color: '#f6f3ea' })); l.position.set(x, .75, -(c.half[1] + .02)); l.visible = false; g.add(l); lamps.push(l); }
      g.updateMatrixWorld(true); const roofH = Math.min(3, new THREE.Box3().setFromObject(g).max.y - g.position.y);
      // (a plank on the pavement before the drive: off it, over the car as it backs out, or onto its roof)
      if (!(track.cowCross || []).some(cx => Math.abs(((cx - (i - Math.round(7 / ds))) % N + N * 1.5) % N - N / 2) * ds < 12)) { const ir = wrap(i - Math.round(7 / ds)), Ar = S[ir], o = track.props.ramp(rnd, 'plank'), pr = pv(ir, hs * (track.KERB + 1.3)); o.group.position.copy(pr); o.group.rotation.y = Math.atan2(Ar.f.x, Ar.f.z); scene.add(o.group); o.group.updateMatrixWorld(true); const C = track.addHit(o.group, o.hit, ir); track.ramps?.push(C); }
      backers.push({ g, c, i, d: d0, d0, d1: hs * 2.2, yawIn, lamps, st: 'in', t: 0, hitT: 0, sorry: 0, roofH, P0: { s: i * ds, d: hs * 2.2, len: 5 }, car: c, yaw: yawIn + Math.PI, v: 0, stop: 0 }); } }

  // ---------- sprinklers on the lawns: a jet of water sweeping to and fro over the pavement ----------
  const sprinklers = [], waterM = new THREE.MeshBasicMaterial({ color: '#cfe8f5', transparent: true, opacity: .55, depthWrite: false });
  for (const d of track.city ? [] : track.doors.filter((_, k) => k % 3 === 1)) { const i = wrap(d.i - Math.round(4 / ds)), p = pv(i, hs * (track.PAVE + 1.2)), g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .18, 8), M('#3a3d42'))); g.children[0].position.y = .09; const jet = new THREE.Group(); jet.position.y = .2; g.add(jet);
    for (let k = 0; k < 9; k++) { const dr = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .5), waterM); const u = k / 8; dr.position.set(0, Math.sin(u * Math.PI) * 1.3, u * 4.2); dr.rotation.x = -Math.cos(u * Math.PI) * .7; jet.add(dr); }
    g.position.copy(p); scene.add(g); const A = S[i]; sprinklers.push({ g, jet, i, p, base: Math.atan2(A.r.x * -hs, A.r.z * -hs), sw: 0, dir: 1, wetT: 0, flipT: 0 }); }

  // ---------- the dustcart and its two bin men ----------
  let cart = null;
  { const g = new THREE.Group(), green = M(track.winter ? '#e8742e' : '#3f7a4a'), dark = M('#2a2c30'), bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    bx(2.3, 1.7, 2, M('#e8e4dc'), 0, 1.65, 2.6); bx(2.2, .8, .06, M('#3f5566'), 0, 2.05, 3.62); bx(2.4, 2.6, 5, green, 0, 2.1, -1.2); bx(2.42, .3, 5.02, M('#efc930'), 0, 1.2, -1.2); bx(2.2, 1.2, .6, dark, 0, 1.4, -3.9);
    for (const x of [-1.1, 1.1]) for (const z of [2.4, -.4, -2.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .35, 12).rotateZ(Math.PI / 2), dark); w.position.set(x, .5, z); g.add(w); }
    const beacon = bx(.25, .18, .25, new THREE.MeshBasicMaterial({ color: '#ffb020' }), 0, 2.6, 3.2); if (track.winter) { const bl = bx(3.1, .9, .15, M('#efc930'), 0, .55, 4.1); bl.rotation.y = .35; } scene.add(g);
    const man = () => { const m = new THREE.Group(), vest = M('#e8742e'), b = new THREE.Mesh(new THREE.BoxGeometry(.44, .62, .28), vest); b.position.y = 1.12; m.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), M('#d9a07a')); h.position.y = 1.6; m.add(h);
      const legs = [-1, 1].map(sd => { const l = new THREE.Group(), lm = new THREE.Mesh(new THREE.BoxGeometry(.14, .78, .16), M('#3b4a5e')); lm.position.y = -.39; l.add(lm); l.position.set(sd * .1, .8, 0); m.add(l); return l; });
      const bin = new THREE.Mesh(new THREE.BoxGeometry(.6, .9, .6), M('#5a6b4a')); bin.position.set(0, .45, .55); bin.visible = false; m.add(bin); scene.add(m); return { g: m, legs, bin, d: 0, ph: 0, sayT: 0, hitT: 0, paperT: 0 }; };
    const men = [man(), man()]; for (const m of men) { dress(m, 'gardener', 'walk', 1.3, '#e8742e'); }
    for (const m of men) people.push({ g: m.g, x: 0, z: 0, kind: 'binman', P: null, m });
    const P0 = { s: L * .3, d: 1.6, len: 7 }; track.parked.push(P0);   // (in the lane of the way it drives)
    cart = { g, beacon, men, s: L * .3, v: 0, stop: 0, go: 30, P0, hitT: 0, sayT: 0 }; }

  // ---------- tyres rolling across the road: from the far side, over to the houses ----------
  const tyres = [], tyreM = M('#24262a'), hubM = M('#9a9c9e'); let tyreT = 5;
  const tyre = () => { if (track.winter) { const g = new THREE.Group(), r = M('#cf3a2c'), k = M(['#3b6fa0', '#3f8a4a', '#e070b0'][rnd() * 3 | 0]); const sl = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, 1.1), r); sl.position.y = -.3; const b = new THREE.Mesh(new THREE.BoxGeometry(.36, .42, .3), k); b.position.set(0, .02, -.1); const h = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), M('#e3b08a')); h.position.set(0, .34, -.08); const ht = new THREE.Mesh(new THREE.BoxGeometry(.24, .1, .24), r); ht.position.set(0, .48, -.08); g.add(sl, b, h, ht); g.userData.sled = true; scene.add(g); return g; }
    const g = new THREE.Group(), w = new THREE.Mesh(new THREE.TorusGeometry(.32, .13, 6, 12), tyreM), h = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .2, 8).rotateX(Math.PI / 2), hubM); g.add(w, h); scene.add(g); return g; };
  // ---------- jump over the kids: a ramp on the far lawn, three of them sitting in a row behind it, cheering ----------
  const shows = [], CHEER = deck(['DAWAJ!', 'SKACZ!', 'NAD NAMI!', 'JESZCZE RAZ!', 'ALE ODLOT!']);
  for (const f of track.city ? [] : [.27, .5, .73]) { const i = wrap(Math.round(N * f)), A = S[i], d = -hs * (track.PAVE + 3.4), o = track.props.ramp(rnd, 'big'), pr = pv(i, d); o.group.position.copy(pr); o.group.rotation.y = Math.atan2(A.f.x, A.f.z); scene.add(o.group); o.group.updateMatrixWorld(true); const C = track.addHit(o.group, o.hit, i); track.ramps?.push(C);
    const kids = []; for (let k = 0; k < 3; k++) { const ik = wrap(i + Math.round((6.5 + k * .9) / ds)), p = pv(ik, d), g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(.34, .4, .26), M(['#cf3a2c', '#3b6fa0', '#efc930'][k])); b.position.y = .32; const hd = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), M('#e3b08a')); hd.position.y = .62; g.add(b, hd); g.position.copy(p); g.rotation.y = Math.atan2(A.r.x * hs, A.r.z * hs); scene.add(g); const K = { g, p, ph: rnd() * 6 }; kids.push(K); dress(K, 'kid', 'cheer', .9 + rnd() * .25, ['#cf3a2c', '#3b6fa0', '#efc930'][k]); }
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
  (track.benches || []).filter((_, k) => k % 2 === 0).forEach((Bn, k) => { const P = OLD[k % OLD.length], f = fig(P.coat, P.hat), A = S[wrap(Bn.i)]; f.g.position.set(Bn.p.x + A.r.x * hs * .42, Bn.p.y - .45, Bn.p.z + A.r.z * hs * .42); f.g.rotation.y = Math.atan2(A.r.x * hs, A.r.z * hs); for (const l of f.legs) l.rotation.x = -1.4; f.flip = false; dress(f, ['grandpa', 'granma', 'grandpa'][k % 3], 'idle', 1, null, .45);
    people.push({ g: f.g, x: Bn.p.x, z: Bn.p.z, kind: 'old', P, talks: 0, m: { paperT: 0 }, f }); });
  // (joggers on the far pavement, up and down a stretch each)
  const joggers = [0, 1, 2].map(k => { const f = fig(['#cf3a2c', '#3f8a4a', '#3b6fa0'][k], k === 1 ? '#f6f3ea' : null); dress(f, 'jogger', 'walk', 1.9, ['#cf3a2c', '#3f8a4a', '#3b6fa0'][k]); return { ...f, s: L * (.15 + k * .3), dir: k % 2 ? -1 : 1, lo: L * (.1 + k * .3), hi: L * (.1 + k * .3) + 120, ph: 0, hitT: 0, sayT: 0 }; });
  const JOG = deck(['Z LEWEJ!', 'UWAGA, BIEGNĘ!', 'DZIEŃ DOBRY! UFF!', 'PIĄTY KILOMETR!']);
  // (a man and his dog on a long lead, across the pavement: the dog sniffs the lawn, he keeps to the kerb)
  const walk = (() => { const man = fig('#5a5f66', '#24190f'); dress(man, 'suit', 'walk', .7); const dog = new THREE.Group(), dm = M('#b88a5a'); const bd = new THREE.Mesh(new THREE.BoxGeometry(.25, .3, .6), dm); bd.position.y = .35; const hd = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .22), dm); hd.position.set(0, .5, .38); dog.add(bd, hd); scene.add(dog); beast(dog, 'ShibaInu', 'Walk', 1.1);
    const lead = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, 1), M('#cf3a2c')); scene.add(lead); return { man, dog, lead, s: L * .45, dir: 1, ph: 0, hitT: 0, sayT: 0 }; })();
  const LEAD = deck(['UWAŻAJ NA SMYCZ!', 'BURKUŚ, DO NOGI!', 'NIE PRZEZ SMYCZ, PANIE!']);
  // (the kids at football on the far lawn; now and then the ball goes out onto the road)
  const balls = [], ballM = M('#f6f3ea'); let ballT = 7;
  // (a window broken: the owner out after him)
  const chasers = [], OWNER = deck(['WRACAJ TU!', 'ZA SZYBĘ ZAPŁACISZ!', 'STÓJ, GAZECIARZU!', 'JA CI DAM GAZETĘ!', 'MAM CIĘ NA NAGRANIU!']);
  function angry(w) { if (chasers.length > 1) return; const f = fig(['#8e2e25', '#3b5670', '#6b4a2e'][chasers.length % 3], null); dress(f, ['suit', 'gardener', 'shopper'][chasers.length % 3], 'run', 1.15); const p = w.p.clone().addScaledVector(w.n, 2); f.g.position.set(p.x, gy(p.x, p.z), p.z); chasers.push({ ...f, x: p.x, z: p.z, t: 0, ph: 0, sayT: 0 }); }

  // ---------- the park's people: strollers wandering its paths; flocks pecking about (pigeons in the park, hens in the village) that go up
  // as he rides through them (a point each flock) ----------
  const strollers = [], flocks = [], VIL = track.region === 'wies' && track.classic, SEA = !!track.sea;
  if (track.park || VIL || SEA) { const keys = VIL ? ['gardener', 'shopper'] : SEA ? ['shopper', 'jogger', 'suit', 'shopper'] : ['shopper', 'suit', 'gardener', 'jogger'];
    for (let k = 0; k < (VIL ? 6 : SEA ? 26 : 22); k++) { const f = fig(['#3b5670', '#8e2e25', '#44484c', '#6b4a2e', '#467537', '#c9b8a0'][k % 6], k % 4 === 0 ? '#24190f' : null); dress(f, keys[k % keys.length], 'walk', .85 + rnd() * .3);
      const sd0 = k % 2 ? os : hs, s0 = rnd() * L, d0 = sd0 * (track.KERB + .8 + rnd() * 1.6); strollers.push({ ...f, sd0, s: s0, d: d0, ts: s0, td: d0, hitT: 0, wait: rnd() * 4 }); }
    const bodyM = VIL ? [M('#f6f3ea'), M('#a8643a')] : SEA ? [M('#f6f3ea'), M('#c9ccd0')] : [M('#8a9094'), M('#9aa0a4')], headM = VIL ? M('#cf3a2c') : SEA ? M('#f6f3ea') : M('#5d646b');
    for (let k = 0; k < 9; k++) { const birds = []; for (let b = 0; b < 8; b++) { const g = new THREE.Group(), sz = VIL ? 1.5 : 1, bd = new THREE.Mesh(new THREE.BoxGeometry(.16 * sz, .14 * sz, .26 * sz), bodyM[b % 2]), hd = new THREE.Mesh(new THREE.BoxGeometry(.09 * sz, .09 * sz, .09 * sz), headM); bd.position.y = .1 * sz; hd.position.set(0, .2 * sz, .14 * sz); g.add(bd, hd); scene.add(g); birds.push({ g, ox: (rnd() - .5) * 3, oz: (rnd() - .5) * 3, vy: 0, up: 0, vx: 0, vz: 0 }); }
      flocks.push({ s: L * (k + .5) / 9, d: (k % 2 ? os : hs) * (track.KERB + 1.2 + rnd() * .8), birds, up: false, t: 0 }); } }
  const FLOCK = SEA ? deck(['MEWY W GÓRĘ! +1', 'KRAA! +1', 'MEWA ZGUBIŁA FRYTKĘ! +1']) : VIL ? deck(['KO-KO-KO! +1', 'KURY W GÓRĘ! +1', 'KOGUT SIĘ OBRAZIŁ! +1']) : deck(['GOŁĘBIE! +1', 'FRRR! +1', 'PŁOSZYCIEL! +1']);

  // ---------- the seaside: a gull that dives for a paper in his bag (KRAA!, its shadow on him growing: hop at the last moment and it misses,
  // points; or it is off with one), and rollerbladers on the road by the promenade, fast, weaving (into one: a bump; over one: points) ----------
  const GULL = SEA ? (() => { const g = new THREE.Group(), w = M('#f6f3ea'), gr = M('#9aa0a4'), bd = new THREE.Mesh(new THREE.BoxGeometry(.3, .25, .6), w), hd = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, .2), w), bk = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .16), M('#efc930'));
    hd.position.set(0, .12, .36); bk.position.set(0, .1, .5); const wl = new THREE.Mesh(new THREE.BoxGeometry(.9, .04, .3).translate(-.45, 0, 0), gr), wr = new THREE.Mesh(new THREE.BoxGeometry(.9, .04, .3).translate(.45, 0, 0), gr); wl.position.x = -.15; wr.position.x = .15; g.add(bd, hd, bk, wl, wr); g.scale.setScalar(1.4); g.visible = false; scene.add(g);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#17181b', transparent: true, opacity: .35, depthWrite: false })); sh.visible = false; scene.add(sh);
    return { g, wl, wr, sh, t: 10 + rnd() * 6, st: 'wait', p: V(0, 0, 0), from: V(0, 0, 0), k: 0, dodged: false }; })() : null;
  const KRAA = deck(['KRAA! DAWAJ GAZETĘ!', 'KRAA!', 'KRAA! TO MOJE!', 'MEWA NAD TOBĄ!']);
  const skaters = SEA ? [0, 1, 2, 3].map(k => { const f = fig(['#e070b0', '#3b6fa0', '#efc930', '#3f8a4a'][k], null); dress(f, 'jogger', 'walk', 2.3, ['#e070b0', '#3b6fa0', '#efc930', '#3f8a4a'][k]); return { ...f, s: L * (.1 + k * .24), dir: k % 2 ? -1 : 1, ph: rnd() * 6, hitT: 0, overT: 0 }; }) : [];

  // ---------- the village: a herd of cows across the road ahead now and then, a farmer behind them (into one: a bump; through them close
  // without one: points). The park: a school trip on little bikes in a line by the far kerb (into one: a bump; past them all: points) ----------
  const solidAt = (x, z, i, pad = .3, kinds = null) => { for (const C of track.near(i)) { if (C.kind === 'soft' || (kinds && !kinds.includes(C.kind))) continue;
    const dx = x - C.x, dz = z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; if (Math.abs(lx) < C.hx + pad && Math.abs(lz) < C.hz + pad) return C; } return null; };
  const rel = (s, R) => ((s - (R.s || 0) + L * 1.5) % L) - L / 2;
  const cowM = [M('#f6f3ea'), M('#24190f'), M('#e3b08a')], herd = { cows: [], t: 12, on: false, i: 0, d: 0, minD: 99, hit: false, farmer: null };
  if (VIL) { for (let k = 0; k < 4; k++) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(.8, .75, 1.6), cowM[0]), new THREE.Mesh(new THREE.BoxGeometry(.82, .32, .55), cowM[1]), new THREE.Mesh(new THREE.BoxGeometry(.45, .45, .55), cowM[0]), new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .12), cowM[2]));
      g.children[0].position.y = 1; g.children[1].position.set(0, 1.2, .2); g.children[2].position.set(0, 1.25, 1); g.children[3].position.set(0, 1.12, 1.3); for (const x of [-.27, .27]) for (const z of [-.6, .6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.16, .62, .16), cowM[0]); l.position.set(x, .31, z); g.add(l); }
      g.visible = false; scene.add(g); herd.cows.push({ g, ds: (k - 1.5) * 2.4, dd: (rnd() - .5) * 1.4, ph: rnd() * 6 }); beast(g, 'Cow', 'Walk', .8 + rnd() * .2); }
    const f = fig('#467537', '#6b4a2e'); dress(f, 'gardener', 'walk', .8); f.g.visible = false; herd.farmer = f; }
  const MUU = deck(['MUUU!', 'KROWY MAJĄ PIERWSZEŃSTWO!', 'POWOLI, MŁODY, TO NIE WYŚCIGI!', 'MUU! (TO KROWA)']);
  const trip = { kids: [], t: 9, on: false, s: 0, wasBehind: false, hit: false, done: false };
  if (track.park) { const cols = ['#cf3a2c', '#3b6fa0', '#efc930', '#3f8a4a', '#e070b0', '#e8742e'];
    for (let k = 0; k < 7; k++) { const lead = k === 0, f = fig(lead ? '#44484c' : cols[k % 6], lead ? '#24190f' : cols[(k + 2) % 6]);
      const bk = new THREE.Group(), fr = M(lead ? '#5a5f66' : cols[(k + 3) % 6]); for (const z of [-.45, .45]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.26, .05, 5, 10).rotateY(Math.PI / 2), M('#24262a')); w.position.set(0, .3, z); bk.add(w); } const b0 = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .9), fr); b0.position.y = .55; bk.add(b0);
      f.g.add(bk); bk.userData.keepShown = true; bk.scale.setScalar(lead ? 1 : .8); for (const c of f.g.children) if (c !== bk) c.position.y += .45; f.g.visible = false; scene.add(f.g); const T0 = { ...f, k }; trip.kids.push(T0); dress(T0, lead ? 'lady' : 'kid', 'drive', 1, lead ? null : cols[k % 6], lead ? .18 : .3); } }
  const TRIP = deck(['DZIECI, GĘSIEGO!', 'PROSZĘ NAS WYPRZEDZAĆ OSTROŻNIE!', 'PANIE, A GAZETĘ MOGĘ?', 'JEDZIEMY DO ZOO!']);

  const flakes = track.winter ? (() => { const n = 900, pos = new Float32Array(n * 3); for (let k = 0; k < n; k++) { pos[k * 3] = (rnd() - .5) * 44; pos[k * 3 + 1] = rnd() * 18; pos[k * 3 + 2] = (rnd() - .5) * 44; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: .09, transparent: true, opacity: .9, depthWrite: false })); p.frustumCulled = false; scene.add(p); return p; })() : null;

  let clock = 0;
  function update(dt, R) { clock += dt; const ev = events.splice(0), W0 = api.wave; for (const mx of mixers) mx.update(dt);
    for (const f of figs) if (f.onceT > 0 && (f.onceT -= dt) <= 0) setAct(f, f.back || 'idle');
    // (the pensioners on the benches clap when he flies by them)
    if (R.air && (R.h || 0) > .7) for (const o of people) if (o.kind === 'old' && o.f && !(o.clapT > clock) && Math.hypot(R.x - o.x, R.z - o.z) < 13) { o.clapT = clock + 7; once(o.f, 'sitclap'); }
    // (the strollers: to a spot along the path and on to the next; ridden into, a bump)
    for (const P of strollers) { const i0 = wrap(Math.round(P.s / ds)), p0 = pv(i0, P.d);
      if (P.wait > 0) P.wait -= dt; else { const dS = ((P.ts - P.s + L * 1.5) % L) - L / 2, dd = P.td - P.d, l = Math.hypot(dS, dd); if (l < .3) { P.wait = 1 + rnd() * 4; P.ts = ((P.s + (rnd() - .5) * 50) % L + L) % L; P.td = P.sd0 * (track.KERB + .8 + rnd() * 1.6); } else { const sp = 1.1 * dt, ns = ((P.s + dS / l * sp * 6) % L + L) % L, nd = P.d + dd / l * sp * 6, ni = wrap(Math.round(ns / ds)), np = pv(ni, nd); if (solidAt(np.x, np.z, ni, .25)) { P.wait = .6 + rnd() * 1.5; P.ts = ((P.s + (rnd() - .5) * 30) % L + L) % L; P.td = P.sd0 * (track.KERB + .8 + rnd() * 1.6); } else { P.s = ((P.s + dS / l * sp) % L + L) % L; P.d += dd / l * sp; } } }
      const i = wrap(Math.round(P.s / ds)), p = pv(i, P.d); if (Math.hypot(p.x - p0.x, p.z - p0.z) > 1e-4) P.g.rotation.y = Math.atan2(p.x - p0.x, p.z - p0.z); P.g.position.copy(p);
      P.hitT = Math.max(0, P.hitT - dt); if (!R.foot && !R.air && !P.hitT && Math.abs(R.v) > 2 && Math.hypot(R.x - p.x, R.z - p.z) < .6) { P.hitT = 3; ev.push({ kind: 'bump', p: { g: P.g } }); once(P, 'hit'); } }
    // (the flocks: pecking about; him within 4 m, up they go (hens only flutter); back down once he is well away)
    for (const Fk of flocks) { const c = pv(wrap(Math.round(Fk.s / ds)), Fk.d); Fk.t += dt;
      if (!Fk.up && !R.foot && Math.hypot(R.x - c.x, R.z - c.z) < 4.2) { Fk.up = true; Fk.t = 0; ev.push({ kind: 'flock', at: c.clone(), text: FLOCK() }); for (const b of Fk.birds) { b.vy = VIL ? 1.6 + rnd() : 3 + rnd() * 2; b.vx = (rnd() - .5) * 5; b.vz = (rnd() - .5) * 5; } }
      for (const b of Fk.birds) { if (Fk.up) { if (VIL) { b.vy -= 6 * dt; } else b.vy -= .6 * dt; b.ox += b.vx * dt; b.oz += b.vz * dt; b.up = Math.max(0, b.up + b.vy * dt); if (VIL && !b.up) { b.vx *= .9; b.vz *= .9; } b.g.position.set(c.x + b.ox, c.y + b.up, c.z + b.oz); if (b.up) b.g.rotation.y += dt * 4; }
        else { b.g.position.set(c.x + b.ox, c.y, c.z + b.oz); if (rnd() < dt * 1.5) b.g.rotation.y = rnd() * 6.28; b.g.children[1].position.y = b.g.children[0].position.y * 2 - Math.max(0, Math.sin(clock * 9 + b.ox * 7)) * .06; } }
      if (Fk.up && Fk.t > 12 && Math.hypot(R.x - c.x, R.z - c.z) > 30) { Fk.up = false; for (const b of Fk.birds) { b.up = 0; b.ox = (rnd() - .5) * 3; b.oz = (rnd() - .5) * 3; } } }
    // (the gull: waiting a while, then from the sea side ahead and high, diving onto him in 1.7 s)
    if (GULL) { const Gu = GULL; Gu.t -= dt; Gu.wl.rotation.z = Math.sin(clock * 14) * .6; Gu.wr.rotation.z = -Math.sin(clock * 14) * .6;
      const ry = track.probe(R.x, R.z, R.hint).y;
      if (Gu.st === 'wait' && Gu.t <= 0 && !R.foot && Math.abs(R.v) > 2) { const i = wrap(Math.round((R.s || 0) / ds) + Math.round((R.along || 1) * 16 / ds)); Gu.from.copy(pv(i, hs * (track.PAVE + 8))); Gu.from.y += 6; Gu.p.copy(Gu.from); Gu.st = 'dive'; Gu.k = 0; Gu.dodged = false; Gu.g.visible = Gu.sh.visible = true; ev.push({ kind: 'shout', at: Gu.p.clone(), text: KRAA() }); }
      if (Gu.st === 'dive') { Gu.k += dt / 1.7; const e = Math.min(1, Gu.k), tx = R.x, tz = R.z, ty = ry + 1.3, prev = Gu.p.clone();
        Gu.p.set(Gu.from.x + (tx - Gu.from.x) * e, Gu.from.y + (ty - Gu.from.y) * (1 - Math.pow(1 - e, 2)) + Math.sin(e * Math.PI) * 1.5, Gu.from.z + (tz - Gu.from.z) * e); Gu.g.position.copy(Gu.p);
        if (prev.distanceToSquared(Gu.p) > 1e-6) Gu.g.rotation.y = Math.atan2(Gu.p.x - prev.x, Gu.p.z - prev.z);
        Gu.sh.position.set(R.x, ry + .06, R.z); Gu.sh.scale.setScalar(.4 + e * .9); Gu.sh.material.opacity = .15 + e * .35;
        if (Gu.k > .82 && R.air && (R.h || 0) > .25) Gu.dodged = true;
        if (Gu.k >= 1.08 || R.foot) { Gu.st = 'away'; Gu.k = 0; Gu.sh.visible = false; Gu.from.copy(Gu.p); if (!R.foot) ev.push({ kind: 'gull', ok: Gu.dodged, at: Gu.p.clone() }); } }
      else if (Gu.st === 'away') { Gu.k += dt / 2.2; const i = wrap(Math.round((R.s || 0) / ds)), to = pv(i, hs * (track.PAVE + 40)); to.y += 12; Gu.p.lerpVectors(Gu.from, to, Math.min(1, Gu.k)); Gu.g.position.copy(Gu.p); Gu.g.rotation.y = Math.atan2(to.x - Gu.from.x, to.z - Gu.from.z);
        if (Gu.k >= 1) { Gu.st = 'wait'; Gu.g.visible = false; Gu.t = (api.prog > .55 ? 7 + rnd() * 5 : api.prog < .3 ? 18 + rnd() * 10 : 13 + rnd() * 10); } } }
    // (the rollerbladers: along the road by the promenade's kerb, both ways, weaving)
    for (const K of skaters) { K.s = ((K.s + K.dir * 4.6 * dt) % L + L) % L; K.ph += dt * 2.2; const i = wrap(Math.round(K.s / ds)), A = S[i];
      { const ai = wrap(i + K.dir * Math.round(2.2 / ds)), ap = pv(ai, hs * (track.ROAD - 1.1)), bl = solidAt(ap.x, ap.z, ai, .35); if (bl?.kind === 'ramp' && !(K.jumpT > 0)) K.jumpT = .62; K.off = (K.off || 0) + (((bl && bl.kind !== 'ramp') ? 1.6 : 0) - (K.off || 0)) * Math.min(1, dt * 3); }
      K.jumpT = Math.max(0, (K.jumpT || 0) - dt); const d = hs * (track.ROAD - 1.1 - (K.off || 0) + Math.sin(K.ph) * .45), p = pv(i, d); K.g.position.copy(p); if (K.jumpT > 0) K.g.position.y += Math.sin(Math.PI * (1 - K.jumpT / .62)) * .75;
      K.g.rotation.y = Math.atan2(A.f.x * K.dir, A.f.z * K.dir) + Math.cos(K.ph) * .35 * K.dir; K.legs && (K.legs[0].rotation.x = Math.sin(K.ph * 3) * .5, K.legs[1].rotation.x = -Math.sin(K.ph * 3) * .5);
      K.hitT = Math.max(0, K.hitT - dt); K.overT = Math.max(0, K.overT - dt); const dist = Math.hypot(R.x - p.x, R.z - p.z);
      if (dist < 1.1 && !R.foot && (R.h || 0) > 1.1 && !K.overT) { K.overT = 4; ev.push({ kind: 'overhead', p: { g: K.g } }); }
      else if (dist < .6 && !R.foot && !R.air && !K.hitT && Math.abs(R.v) > 2) { K.hitT = 3; ev.push({ kind: 'bump', p: { g: K.g } }); once(K, 'hit'); } }
    // (the herd: 22-30 m ahead of him, from his side's pasture across the road at a cow's pace; gone past the far kerb)
    if (VIL && !R.foot) { const H = herd; H.t -= dt;
      if (!H.XS) H.XS = (track.cowCross || []).filter(cx => { for (let dd = -(track.PAVE + 2); dd <= track.PAVE + 3; dd += .8) for (let s0 = -3.5; s0 <= 3.5; s0 += 1) { const i = wrap(cx + Math.round(s0 / ds)), p = pv(i, hs * dd); if (solidAt(p.x, p.z, i, .3, ['ramp', 'hard'])) return false; } return true; });
      const XS = H.XS; H.used ||= {};
      if (!H.on && H.t <= 0 && Math.abs(R.v) > 2 && R.s != null) { const ci = XS.find(x => { const ah = rel(x * ds, R) * (R.along || 1); return ah > 22 && ah < 42 && !(H.used[x] > clock); });
        if (ci != null) { H.on = true; H.used[ci] = clock + 75; H.i = ci; H.minD = 99; H.hit = false; H.tt = 0; const taken = [];
          for (const c of H.cows) { let s0 = 0, e0 = 0; for (let k = 0; k < 30; k++) { s0 = (rnd() - .5) * 5.5; e0 = track.PAVE + 1.2 + rnd() * 3.6; if (taken.every(([t, e]) => Math.abs(t - s0) > 1.25 || Math.abs(e - e0) > 2.6)) break; } taken.push([s0, e0]);
            if (!c.who) { c.who = { g: c.g, x: 0, z: 0, kind: 'cow', cow: c, m: { paperT: 0 } }; } if (!people.includes(c.who)) people.push(c.who); c.flee = false; c.hitT = 0;
            Object.assign(c, { ds: s0, d0: e0, prog: 0, spd: .85 + rnd() * .5, delay: rnd() * 2.2, pause: 0, yaw: 0, sway: rnd() * 6 }); c.g.visible = true; }
          H.farmer.g.visible = true; ev.push({ kind: 'shout', at: pv(H.i, hs * (track.PAVE + 2)).add(V(0, 2.2, 0)), text: MUU() }); } }
      if (H.on) { H.tt += dt; const A = S[H.i]; let back = -99, sumS = 0, done = 0;
        for (const c of H.cows) { if (c.flee) { c.pause = 0; c.delay = 0; } c.hitT = Math.max(0, (c.hitT || 0) - dt); const moving = H.tt > c.delay && c.pause <= 0 && !(c.hitT > 0); if (c.pause > 0) c.pause -= dt; else if (moving && rnd() < dt * .12 && c.prog > 1.5) { c.pause = .8 + rnd() * 1.4; }
          // (one walking up behind another (on its line, within a body's length): it waits, and steps a little aside)
          const me = c.d0 - c.prog, ahead = H.cows.find(o => o !== c && Math.abs(o.ds - c.ds) < 1.05 && (o.d0 - o.prog) < me && me - (o.d0 - o.prog) < 2.4);
          if (ahead) c.ds += Math.sign(c.ds - ahead.ds || (rnd() - .5)) * .55 * dt;
          for (const o of H.cows) if (o !== c && Math.abs(o.ds - c.ds) < 1.1 && Math.abs((o.d0 - o.prog) - me) < 2.3) c.ds += Math.sign(c.ds - o.ds || (rnd() - .5)) * .7 * dt;   // (side by side too close: apart a little)
          // (something on the ground in its way (a ramp, a bin): it stops and goes round, along the road)
          { const nx = pv(wrap(H.i + Math.round(c.ds / ds)), hs * (me - .9)), block = solidAt(nx.x, nx.z, wrap(H.i + Math.round(c.ds / ds)), .45, ['ramp', 'hard']); if (block) { const A0 = S[H.i], side = (nx.x - block.x) * A0.f.x + (nx.z - block.z) * A0.f.z; c.ds += (side >= 0 ? 1 : -1) * 1.1 * dt; c.blocked = true; } else c.blocked = false; }
          if (moving && !ahead && !c.blocked) c.prog += c.spd * dt; c.ds += Math.sin(H.tt * .8 + c.sway) * .18 * dt;
          const dNow = hs * (c.d0 - c.prog), i = wrap(H.i + Math.round(c.ds / ds)), p = pv(i, dNow); c.ph += dt * 5; c.g.position.copy(p); if (!c.g.userData.beast) c.g.position.y += Math.abs(Math.sin(c.ph)) * .04;
          c.yaw += ((Math.sin(H.tt * .6 + c.sway) * .28) - c.yaw) * Math.min(1, dt * 2); c.g.rotation.y = Math.atan2(-A.r.x * hs, -A.r.z * hs) + c.yaw;
          playB(c.g, c.hitT > 0 ? 'Idle_HitReact_Left' : moving && !ahead && !c.blocked ? (c.flee ? 'Gallop' : 'Walk') : (c.pause > 0 ? 'Eating' : 'Idle'), moving && !ahead ? (c.flee ? c.spd / 4 : c.spd / 1.05) : 1); c.who.x = c.g.position.x; c.who.z = c.g.position.z;
          back = Math.max(back, c.d0 - c.prog); sumS += c.ds; if (c.d0 - c.prog < -(track.PAVE + 2.5)) done++;
          const dd = Math.hypot(R.x - p.x, R.z - p.z); if (dd < H.minD) H.minD = dd; if (dd < 1.05 && !H.hit && !R.air) { H.hit = true; ev.push({ kind: 'bump', p: { g: c.g } }); } }
        { const p = pv(wrap(H.i + Math.round((sumS / H.cows.length - .8) / ds)), hs * (back + 1.5)); H.farmer.g.position.copy(p); H.farmer.g.rotation.y = Math.atan2(-A.r.x * hs, -A.r.z * hs); }
        const past = Math.abs(rel(H.i * ds, R)) > 6 && rel(H.i * ds, R) * (R.along || 1) < 0;
        if (past && back > -track.ROAD - 1 && !H.hit && H.minD < 2.6 && !H.paid) { H.paid = true; ev.push({ kind: 'pts', n: 2, at: R, text: 'MIĘDZY KROWAMI! +2' }); }
        if (done === H.cows.length || Math.abs(rel(H.i * ds, R)) > 80) { for (const c of H.cows) { const k = people.indexOf(c.who); if (k >= 0) people.splice(k, 1); } H.on = false; H.paid = false; H.t = 22 + rnd() * 14; for (const c of H.cows) c.g.visible = false; H.farmer.g.visible = false; } } }
    // (the school trip: put 30 m ahead of him by the far kerb, riding his way slowly in a line; the teacher first)
    if (track.park && !R.foot) { const T = trip; T.t -= dt;
      if (!T.on && T.t <= 0 && Math.abs(R.v) > 2 && R.s != null && !(api.prog < .45)) { T.on = true; T.dir = R.along || 1; T.s = (R.s || 0) + T.dir * 34; T.hit = false; T.done = false; T.wasBehind = true; for (const K of T.kids) K.g.visible = true; ev.push({ kind: 'shout', at: pv(wrap(Math.round(T.s / ds)), os * (track.ROAD - 1)).add(V(0, 2, 0)), text: TRIP() }); }
      if (T.on) { T.s = ((T.s + T.dir * 2.8 * dt) % L + L) % L;
        for (const K of T.kids) { const s = ((T.s - T.dir * K.k * 2.1) % L + L) % L, i = wrap(Math.round(s / ds)), A = S[i], ai = wrap(i + T.dir * Math.round(3 / ds)), ap = pv(ai, os * (track.ROAD - 1)); K.off = (K.off || 0) + ((solidAt(ap.x, ap.z, ai, .5) ? 1.9 : 0) - (K.off || 0)) * Math.min(1, dt * 2.5); const p = pv(i, os * (track.ROAD - 1 - K.off + Math.sin(clock * 2 + K.k) * .15)); K.g.position.copy(p); K.g.rotation.y = Math.atan2(A.f.x * T.dir, A.f.z * T.dir);
          if (!R.air && !T.hit && Math.hypot(R.x - p.x, R.z - p.z) < .7) { T.hit = true; ev.push({ kind: 'bump', p: { g: K.g } }); } }
        const lead = rel(T.s, R) * T.dir, tail = rel(((T.s - T.dir * 6 * 2.1) % L + L) % L, R) * T.dir;
        if (!T.done && !T.hit && lead < -3) { T.done = true; ev.push({ kind: 'pts', n: 3, at: R, text: 'WYCIECZKA WYPRZEDZONA! +3' }); }
        if (tail < -60 || lead > 90) { T.on = false; T.t = 28 + rnd() * 16; for (const K of T.kids) K.g.visible = false; } } }
    if (flakes) { const a = flakes.geometry.attributes.position, P = a.array; flakes.position.set(R.x, track.probe(R.x, R.z, R.hint).y, R.z);
      for (let k = 0; k < P.length; k += 3) { P[k + 1] -= dt * (1 + (k % 7) * .08); P[k] += Math.sin(clock + k) * dt * .3; if (P[k + 1] < 0) P[k + 1] += 18; } a.needsUpdate = true; }
    // (the joggers)
    for (const J of joggers) { J.s += J.dir * 2.6 * dt; if (J.s > J.hi) J.dir = -1; if (J.s < J.lo) J.dir = 1; const i = wrap(Math.round(J.s / ds)), A = S[i], ai = wrap(i + Math.sign(J.dir) * Math.round(1.8 / ds)), ap = pv(ai, os * (track.KERB + 1.4)); J.off = (J.off || 0) + ((solidAt(ap.x, ap.z, ai, .3) ? 1.1 : 0) - (J.off || 0)) * Math.min(1, dt * 4); const p = pv(i, os * (track.KERB + 1.4 + J.off)); J.g.position.copy(p); J.g.rotation.y = Math.atan2(A.f.x * J.dir, A.f.z * J.dir); J.ph += dt * 10; J.legs[0].rotation.x = Math.sin(J.ph) * .7; J.legs[1].rotation.x = -Math.sin(J.ph) * .7;
      J.hitT = Math.max(0, J.hitT - dt); J.sayT -= dt; const dist = Math.hypot(R.x - p.x, R.z - p.z); if (dist < 7 && J.sayT <= 0) { J.sayT = 15; ev.push({ kind: 'shout', p: { g: J.g }, text: JOG() }); }
      if (!R.foot && !R.air && !J.hitT && dist < .6 && Math.abs(R.v) > 2) { J.hitT = 3; ev.push({ kind: 'bump', p: { g: J.g } }); once(J, 'hit'); } }
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
    for (let k = tyres.length - 1; k >= 0; k--) { const T0 = tyres[k], A = S[T0.i]; T0.d += (T0.sg || hs) * T0.v * dt; T0.spin += T0.v * dt / .4; const p = pv(T0.i, T0.d); T0.g.position.set(p.x, p.y + .45 + Math.abs(Math.sin(T0.spin * .7)) * .12, p.z); T0.g.rotation.set(0, Math.atan2(A.f.x, A.f.z), 0); if (T0.g.userData.sled) T0.g.rotation.y = Math.atan2(A.r.x * (T0.sg || hs), A.r.z * (T0.sg || hs)); else T0.g.rotateX(T0.spin);
      T0.hitT = Math.max(0, T0.hitT - dt); if (!R.foot && !T0.hitT && Math.hypot(R.x - p.x, R.z - p.z) < .55 && !((R.h || 0) > .55)) { T0.hitT = 3; ev.push({ kind: 'tyre' }); }
      if (Math.abs(T0.d) > track.PAVE + 3 && Math.sign(T0.d) === (T0.sg || hs)) { scene.remove(T0.g); tyres.splice(k, 1); } }
    // (the kids behind the ramp: they bob and wave; him over their heads in the air: a bonus; into them on the ground: a bump)
    for (const Sh of shows) { Sh.sayT -= dt; for (const K of Sh.kids) { K.ph += dt * 5; K.g.position.y = K.p.y + (K.dressed ? 0 : Math.max(0, Math.sin(K.ph)) * .12); const dist = Math.hypot(R.x - K.p.x, R.z - K.p.z);
        if (dist < 9 && Sh.sayT <= 0) { Sh.sayT = 8; ev.push({ kind: 'shout', p: { g: K.g }, text: CHEER() }); }
        if (dist < 1.2 && !R.foot) { if ((R.h || 0) > 1.1 && clock - Sh.done > 6) { Sh.done = clock; ev.push({ kind: 'overhead', p: { g: K.g } }); for (const k2 of Sh.kids) once(k2, 'wave'); } else if (!R.air && !(K.hitT > clock)) { K.hitT = clock + 3; ev.push({ kind: 'bump', p: { g: K.g } }); once(K, 'hit'); } } } }
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
      if (!R.foot && !K.hitT && !((R.h || 0) > K.roofH - .32) && Math.abs(lx) < K.c.half[0] + .3 && Math.abs(lz) < K.c.half[1] + .3 && (K.st === 'out' || K.st === 'wait' || K.st === 'back')) { K.hitT = 3; ev.push({ kind: 'driveway', why: R.air ? ((R.vy || 0) < 0 ? 'early' : 'late') : null }); } }
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
        const moving = C.stop > 0 && ph > .02 && ph < .98; m.ph += dt * (moving ? 9 : 0); m.legs[0].rotation.x = Math.sin(m.ph) * .5; m.legs[1].rotation.x = -Math.sin(m.ph) * .5; setAct(m, m.bin.visible ? 'carry' : 'walk', 1.3); m.bin.visible = C.stop > 0 && C.stop < 3.5;
        m.g.rotation.y = Math.atan2(B0.r.x * (ph < .5 && C.stop > 3.5 ? hs : -hs), B0.r.z * (ph < .5 && C.stop > 3.5 ? hs : -hs)) * (C.stop > 0 ? 1 : 0) + (C.stop > 0 ? 0 : yaw);
        const pp = people.find(q => q.m === m); pp.x = mx; pp.z = mz; m.hitT = Math.max(0, m.hitT - dt); m.paperT = Math.max(0, m.paperT - dt);
        if (C.stop > 0 && !R.foot && !R.air && !m.hitT && Math.hypot(R.x - mx, R.z - mz) < .6 && Math.abs(R.v) > 2) { m.hitT = 3; ev.push({ kind: 'bump', p: { g: m.g } }); once(m, 'hit'); } });
      const dx = R.x - x, dz = R.z - z, lz = dx * Math.sin(yaw) + dz * Math.cos(yaw), lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      if (C.sayT <= 0 && Math.hypot(dx, dz) < 18) { C.sayT = 12; ev.push({ kind: 'shout', p: { g: C.men[0].g }, text: BINMEN() }); }
      if (!R.foot && !C.hitT && !(R.air && R.h > 3.2) && Math.abs(lx) < 1.35 && lz > -4.3 && lz < 3.8) { C.hitT = 3; ev.push({ kind: 'truck' }); } }
    return ev; }
  function kick(p) { if (p.kind === 'cow') { const H = herd; for (const c of H.cows) { c.flee = true; c.spd = 3.4 + rnd() * 1.2; } p.cow.hitT = .6; return ['MUUUUU!', 'MUU?! MUUUU!', 'MOJE KROWY!'][rnd() * 3 | 0]; }
    return p.kind === 'old' ? 'TAK SIĘ TRAKTUJE STARSZYCH?!' : 'EJ! ŚMIECIARZA SIĘ NIE KOPIE!'; }
  function talk(p) { if (p.kind === 'cow') return 'MUU.'; if (p.kind === 'old') { p.talks = (p.talks || 0) + 1; return p.P.talk[(p.talks - 1) % p.P.talk.length]; } return BINMEN(); }
  // (a paper: to a bin man, caught; onto a windscreen backing out, the driver stops; into a sprinkler, it turns the other way)
  function paper(Pp) {
    for (const p of people) { if (p.m.paperT > 0 || Math.hypot(p.x - Pp.x, p.z - Pp.z) > .9) continue; p.m.paperT = 30; if (p.kind === 'cow') return { p, text: ['MUU?', 'MUUU... (CZYTA)', 'MUU! HOROSKOP!'][rnd() * 3 | 0], who: 'cow', pts: 1, label: 'KROWA Z GAZETĄ! +1' }; if (p.kind === 'old') return { p, text: p.P.paper, who: 'old', pts: 1, label: 'DO RĄK! +1' }; return { p, text: BINPAPER(), who: 'binman', pts: 2, label: 'DLA ŚMIECIARZA! +2' }; }
    for (const K of backers) { if (!(K.st === 'out' || K.st === 'lights' || K.st === 'wait') || Math.hypot(K.g.position.x - Pp.x, K.g.position.z - Pp.z) > 1.8) continue; K.st = 'wait'; K.t = 0; return { p: { g: K.g }, text: SORRY(), who: 'driver', pts: 2, label: 'NA SZYBĘ! +2' }; }
    for (const W of sprinklers) { if (W.flipT || Math.hypot(W.p.x - Pp.x, W.p.z - Pp.z) > 1) continue; W.flipT = 2; W.dir *= -1; return { p: { g: W.g }, text: 'PSSST!', who: 'sprinkler', pts: 1, label: 'ZRASZACZ! +1' }; }
    return null; }
  // (the herd on the road: for the traffic to stop before each cow, as before someone on a zebra)
  const crossing = () => herd.on ? herd.cows.filter(c => Math.abs(c.d0 - c.prog) < track.ROAD + 1.5).map(c => ({ s: wrap(herd.i + Math.round(c.ds / ds)) * ds, d: hs * (c.d0 - c.prog) })) : [];
  const api = { id: 'classic', wave: false, prog: 0, crossing, people, lights, update, kick, talk, paper, angry, backers, sprinklers, cart, flocks, strollers, gull: GULL, skaters, herd, trip }; return api;
}
