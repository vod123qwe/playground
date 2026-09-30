// On foot: the paper boy off his bike, and the fights. Both people (him: assets/export/boy.glb, a white tee and jeans; the one he
// fights: brawler.glb, a checked shirt) are MakeHuman bodies with Quaternius' clips (walk, jog, idle, jab, cross, hook, hit to the
// head and the chest, knocked back, down, getting up, a "no" wag), made by assets/source/mpfb_people.py.
//
// Walking: W S forward and back, A D turn, Shift jogs; F by the bike gets back on. V: through his eyes (his hands in the picture)
// or from behind him. A click takes the mouse: it turns him and looks up and down (A D then step aside).
// With the mouse, a fight is fought as in the knightly games: the mouse picks the side a punch comes from (a star of four arrows in
// the middle of the picture: left, right, up (a hook), down (to the body)), the left button throws it, the right one holds the guard
// (with the mouse down: low); his punch coming shows on the star in red, and green in the moment to raise the guard for a parry.
// A fight: a cyclist kicked off his bike gets up as a man with a grudge, comes for you and, once close, it is on (through your eyes,
// by default). A D circle round him, W S step in and back, Shift (with a direction) a quick step aside or back (nothing lands on you
// while you do it). ← a jab, → a cross, with ↑ held a hook, with ↓ held to the body. Space holds a guard (with ↓: low); raised just as
// a punch comes, it is a parry (he staggers, your next one hits harder). Jab then cross: RAZ-DWA; two jabs and a cross: SERIA.
// Every punch costs breath (the yellow bar); out of breath you punch slower and softer. G: taunt him (you get some breath back).
//
// Each of the two is a "fighter": the same struct and the same rules, moved by an input { fwd, side, atk, guard, low, dodge, taunt }
// that comes from the keys, from the computer (ai()) or, later, from another player over the network (see docs/multiplayer.md).
//
// createOnFoot({ THREE, toon, scene, track, hud, camera, solid, fx }) →
//   { ready, active, fighting, start(at), stop(), update(dt, inp, world), follow(dt), grudge(bike), nearBike(p), toggleView(), me }
//   fx: { score(n, at, label, col), flash(s), shake(s), slow(s), rant(at, s), take(kind) → a line (what the winner takes off you) }
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function createOnFoot({ THREE, toon, scene, track, hud, camera, solid, fx }) {
  const V3 = THREE.Vector3, UP = new V3(0, 1, 0), pick = a => a[Math.random() * a.length | 0], clamp = THREE.MathUtils.clamp;
  const loader = new GLTFLoader(), src = {};
  let PACE = {}; fetch('assets/export/people.json').then(r => r.json()).then(j => { PACE = j; }).catch(() => {});

  // ---------- what they say (a little dark, a little daft) ----------
  const SAY = {
    grudge: ['ZŁAŹ Z ROWERU, GNOJKU!', 'TY WIESZ, ILE TEN ROWER KOSZTOWAŁ?!', 'CHODŹ TU, KOZAKU!', 'JA TYLKO PO BUŁKI JECHAŁEM!', 'ZARAZ CI POKAŻĘ TOUR DE FRANCE!'],
    grudgeFoot: ['TY! TAK, TY!', 'CHODŹ TU, KOZAKU!', 'NIE UCIEKNIESZ MI NA PIECHOTĘ!', 'JA TYLKO PO BUŁKI JECHAŁEM!', 'STÓJ, POGADAMY!'],
    start: ['DAWAJ, DAWAJ!', 'MAM CZARNY PAS Z BIEDRONKI!', 'TRZYMAJ MI PIWO!', 'GRAŻYNA, NAGRYWAJ!', 'NA SOLÓWKĘ!'],
    hitMe: ['AUĆ!', 'MOJA SZCZĘKA!', 'NIE W TWARZ!', 'OJ!', 'TO BOLAŁO!'],
    hitHim: ['HEHE!', 'I CO?!', 'MASZ!', 'TO ZA KOLANO!'],
    blocked: ['NIE TAK ŁATWO!', 'HEHE, BLOK!', 'CO TO BYŁO?'],
    taunt: ['TYLE UMIESZ?', 'MOJA BABCIA BIJE MOCNIEJ!', 'ŁAPKI JAK Z WATY!', 'NUDZĘ SIĘ!'],
    ko: ['DOBRA, DOBRA... REMIS', 'WIDZĘ GWIAZDKI...', 'MAMO...', 'TO SIĘ NIE LICZY!', 'POŚLIZGNĄŁEM SIĘ!'],
    won: ['I CO, KOZAKU?', 'IDŹ DO MAMY!', 'NASTĘPNYM RAZEM NIE KOP!', 'TAK SIĘ KOŃCZY KOPANIE LUDZI!'],
    coward: ['TCHÓRZ!', 'UCIEKAJ, UCIEKAJ!', 'JESZCZE CIĘ ZNAJDĘ!', 'ZNAM TWOJĄ MATKĘ!'],
    back: ['DOBRA, JADĘ DO ROBOTY...', 'SZKODA MI CZASU', 'PAMIĘTAJ MNIE!'],
  };

  // ---------- the moves ----------
  //   clip, time (s), damage, breath, high or low, reach (m, from his middle to the other's), heavy (knocks back)
  const MOVES = {
    jab:   { clip: 'jab',   dur: .34, dmg: 7,  st: 7,  zone: 'high', reach: 1.36 },
    cross: { clip: 'cross', dur: .48, dmg: 12, st: 11, zone: 'high', reach: 1.42 },
    hook:  { clip: 'hook',  dur: .62, dmg: 19, st: 17, zone: 'high', reach: 1.24, heavy: true },
    bodyL: { clip: 'jab',   dur: .4,  dmg: 8,  st: 8,  zone: 'low',  reach: 1.3, dip: true },
    bodyR: { clip: 'cross', dur: .54, dmg: 13, st: 12, zone: 'low',  reach: 1.34, dip: true },
  };
  const IMPACT = { jab: .45, cross: .45, hook: .5 };
  const AI_DMG = .85;                                                  // (the computer hits a little softer: from his eyes it is harder to read)                  // (when in each clip the fist is out furthest: measured on load)

  // ---------- a person: the model, its clips, its bones; a cap and a bag for him ----------
  function person(key, extras) {
    const g = src[key], m = SkeletonUtils.clone(g.scene), G = new THREE.Group(), body = new THREE.Group(); G.add(body); body.add(m); scene.add(G);
    m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) }); o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(m), A = {}, clips = {};
    for (const c of g.animations) { clips[c.name] = c; A[c.name] = mixer.clipAction(c); }
    const jab = clips.jab; if (jab) { clips.stance = THREE.AnimationUtils.subclip(jab, 'stance', 0, 2, 30); A.stance = mixer.clipAction(clips.stance); }   // (the jab's first frame: fists up, feet set)
    const b = n => m.getObjectByName(n), bones = {};
    for (const n of ['pelvis', 'spine_02', 'spine_03', 'neck_01', 'head', 'upperarm_l', 'lowerarm_l', 'hand_l', 'upperarm_r', 'lowerarm_r', 'hand_r']) bones[n] = b(n);
    const fingers = { l: [], r: [] }; m.traverse(o => { const r = /^(index|middle|ring|pinky)_0[123]_([lr])$/.exec(o.name); if (r) fingers[r[2]].push(o); });
    for (const n of ['idle', 'walk', 'jog', 'stance']) if (A[n]) { A[n].play(); A[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
    m.updateMatrixWorld(true);
    if (extras) extras(m, bones);
    return { key, G, body, m, mixer, A, clips, bones, fingers, shot: null, w: { idle: 1, walk: 0, jog: 0, stance: 0 }, ik: 0, fist: 0, height: (PACE[key] || {}).height || 1.7 };
  }
  // his cap and his bag, as on the bike (a red cap snug on his head, the hair out under it; an olive satchel of papers on his left hip,
  // its strap across his back and chest to his right shoulder): fitted to his head in the rest pose, then carried by his bones
  function kit(m, bones) {
    m.updateMatrixWorld(true);
    // the head: the top of the skull and its width and depth just under it, from the body's vertices; the hair's top over it
    const H = bones.head, hp = H.getWorldPosition(new V3()), v = new V3(), pts = [];
    let skull = hp.y, hair = hp.y;
    m.traverse(o => { if (!o.isMesh) return; const isBody = /male1591|female1605/.test(o.name), isHair = /short|hair|bob|long|ponytail|afro|braid/.test(o.name); if (!isBody && !isHair) return;
      const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (v.y < hp.y + .04 || Math.hypot(v.x - hp.x, v.z - hp.z) > .2) continue;
        if (isBody) { skull = Math.max(skull, v.y); pts.push(v.clone()); } else hair = Math.max(hair, v.y); } });
    const band = pts.filter(p => p.y > skull - .1 && p.y < skull - .05); let x0 = 9, x1 = -9, z0 = 9, z1 = -9; for (const p of band) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const hw = band.length ? (x1 - x0) / 2 + .016 : .09, hd = band.length ? (z1 - z0) / 2 + .016 : .105, cx = band.length ? (x0 + x1) / 2 : hp.x, cz = band.length ? (z0 + z1) / 2 : hp.z;
    m.userData.headFit = { hp: hp.y, skull, hair, hw, hd, n: band.length, cz: cz - hp.z };
    const rim = skull - .065, crown = Math.max(skull + .02, Math.min(hair + .004, skull + .04)) - rim;   // (its edge on the forehead, over the ears; over the hair, pressing it)
    const red = toon('#b3372c'), redD = toon('#9e3127'), cap = new THREE.Group(); cap.position.set(cx, rim, cz);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), red); dome.scale.set(hw, crown, hd); cap.add(dome);
    for (let k = 0; k < 3; k++) { const th = k * Math.PI / 3, rr = 1 / Math.sqrt((Math.cos(th) / hw) ** 2 + (Math.sin(th) / hd) ** 2), seam = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 3, 20, Math.PI), redD); seam.scale.set(rr * 1.006, crown * 1.006, .1); seam.rotation.y = th; cap.add(seam); }   // (the panels' seams)
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .022, 20, 1, true), redD); ring.scale.set(hw + .002, 1, hd + .002); ring.position.y = .011; cap.add(ring);   // (the band round it)
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .012, 16, 1, false, -Math.PI / 2, Math.PI), red); brim.scale.set(hw * .92, 1, hd * .55 + .075); brim.position.set(0, .006, hd * .38); brim.rotation.x = .14; cap.add(brim);
    const under = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .004, 16, 1, false, -Math.PI / 2, Math.PI), toon('#4a3a2c')); under.scale.copy(brim.scale).multiplyScalar(.97); under.scale.y = 1; under.position.set(0, -.002, hd * .38); under.rotation.x = .14; cap.add(under);   // (dark under the brim)
    const button = new THREE.Mesh(new THREE.SphereGeometry(.011, 6, 4), redD); button.position.y = crown; cap.add(button);
    cap.rotation.x = -.1; m.add(cap); H.attach(cap); cap.traverse(o => { if (o.isMesh) o.castShadow = true; }); m.userData.cap = cap;   // (the front up on the forehead, the back down to the nape)
    // the satchel: olive canvas, a darker flap, rolled papers standing out of it; low across his back, to the left
    const pv = bones.pelvis.getWorldPosition(new V3()), sh = bones.upperarm_r.getWorldPosition(new V3()), bag = new THREE.Group(), olive = toon('#6f7a45'), oliveD = toon('#58613a');
    const box = new THREE.Mesh(new THREE.BoxGeometry(.36, .25, .1), olive); bag.add(box);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(.364, .13, .106), oliveD); flap.position.set(0, .065, -.004); bag.add(flap);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(.01, .04, .04), toon('#c9b77a')); buckle.position.set(0, .01, -.056); buckle.rotation.y = Math.PI / 2; bag.add(buckle);
    const paperM = toon('#ece5d0'), bandM = toon('#b3372c');
    for (let k = 0; k < 5; k++) { const p = new THREE.Group(); p.position.set(-.13 + k * .062, .16, .01 - (k % 2) * .018); p.rotation.set(.12 * (k % 3 - 1), 0, 0); bag.add(p);
      p.add(new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .16, 8), paperM)); const bd = new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .025, 8), bandM); bd.position.y = .02; p.add(bd); }
    const at = new V3(pv.x + .08, pv.y + .1, pv.z - .16); bag.position.copy(at); bag.rotation.set(0, 0, -.1); m.add(bag); bones.pelvis.attach(bag);
    // the strap: from the bag, over his back and over his chest, to his right shoulder
    const strapM = toon('#4d5530');
    for (const s of [-1, 1]) { const a = s < 0 ? new V3(at.x + .15, at.y + .1, at.z + .03) : new V3(pv.x + .16, pv.y + .14, pv.z + .09), b = new V3(sh.x + .03, sh.y + .075, sh.z + s * .075), d = b.clone().sub(a);
      const st = new THREE.Mesh(new THREE.BoxGeometry(.05, d.length(), .012), strapM); st.position.copy(a).add(b).multiplyScalar(.5); st.quaternion.setFromUnitVectors(UP, d.normalize()); m.add(st); bones.spine_03.attach(st); st.castShadow = true; }
    bag.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }

  // ---------- bones: a two-bone reach (the arm to a point), fists ----------
  const _a = new V3(), _b = new V3(), _c = new V3(), _e = new V3(), _h = new V3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _pq = new THREE.Quaternion();
  function aim(bone, childAt, target) {                               // turn bone (in the world) so the point childAt goes towards target
    bone.getWorldPosition(_a); _b.subVectors(childAt, _a).normalize(); _c.subVectors(target, _a).normalize();
    _q.setFromUnitVectors(_b, _c); bone.getWorldQuaternion(_q2); _q2.premultiply(_q); bone.parent.getWorldQuaternion(_pq); bone.quaternion.copy(_pq.invert().multiply(_q2)); bone.updateMatrixWorld(true);
  }
  function reach(up, lo, hand, target, pole, w) {
    if (w <= .001) return; const q0u = up.quaternion.clone(), q0l = lo.quaternion.clone();
    const S = up.getWorldPosition(new V3()), E = lo.getWorldPosition(new V3()); hand.getWorldPosition(_h);
    const a = S.distanceTo(E), bl = E.distanceTo(_h), T = target.clone(); let d = S.distanceTo(T); const mx = (a + bl) * .97; if (d > mx) { T.sub(S).setLength(mx).add(S); d = mx; }
    const dir = T.clone().sub(S).normalize(), cosA = clamp((a * a + d * d - bl * bl) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const pv = pole.clone().sub(S); pv.addScaledVector(dir, -pv.dot(dir)).normalize();
    _e.copy(S).addScaledVector(dir, a * cosA).addScaledVector(pv, a * sinA);
    aim(up, E, _e); hand.getWorldPosition(_h); aim(lo, _h, T);
    const qu = up.quaternion.clone(), ql = lo.quaternion.clone(); up.quaternion.slerpQuaternions(q0u, qu, w); lo.quaternion.slerpQuaternions(q0l, ql, w); up.updateMatrixWorld(true);
  }
  // fists: each finger bone curled about the line of the knuckles (the little finger's to the index's), in the world, so the bones' own
  // axes do not matter; FIST.sign: which way is into the palm
  const FIST = { sign: -1 }, _k = new V3(), _k2 = new V3(), _fq = new THREE.Quaternion();
  function fists(P, w) { if (w <= .01) return;
    for (const s of ['l', 'r']) { const ix = P.m.getObjectByName('index_01_' + s), pk = P.m.getObjectByName('pinky_01_' + s); if (!ix || !pk) continue;
      ix.getWorldPosition(_k); pk.getWorldPosition(_k2); _k.sub(_k2).normalize();
      for (const f of P.fingers[s]) { f.getWorldQuaternion(_fq); const ax = _k.clone().applyQuaternion(_fq.invert()); f.rotateOnAxis(ax, FIST.sign * (s === 'l' ? 1 : -1) * 1.3 * w); f.updateMatrixWorld(true); } } }

  // ---------- clips: the ground ones blended by pace; one-shots (a punch, a hit, going down) over them ----------
  function shot(P, name, dur, { clamp: hold = false, from = 0 } = {}) {
    const a = P.A[name]; if (!a) return; if (P.shot && P.shot.a !== a) P.shot.a.fadeOut(.06);
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = P.clips[name].duration * (1 - from) / dur; a.time = P.clips[name].duration * from; a.setEffectiveWeight(1); a.fadeIn(.06); a.play();
    P.shot = { a, name, t: 0, dur, hold };
  }
  function animate(P, dt, pace, ground) {                             // ground: 'walk' (idle / walk / jog) or 'fight' (the stance / walk)
    if (P.shot) { P.shot.t += dt; if (P.shot.t >= P.shot.dur && !P.shot.hold) { P.shot.a.fadeOut(.12); P.shot = null; } }
    const sw = P.shot ? 0 : 1, sp = Math.abs(pace), want = { idle: 0, walk: 0, jog: 0, stance: 0 };
    if (ground === 'fight') { const k = clamp(sp / 1.2, 0, 1); want.stance = (1 - k * .7) * sw; want.walk = k * .7 * sw; }
    else { const wk = clamp(sp / 1.4, 0, 1), jg = clamp((sp - 1.6) / 1.6, 0, 1); want.idle = (1 - wk) * sw; want.walk = wk * (1 - jg) * sw; want.jog = jg * sw; }
    if (!P.A.stance) { want.idle += want.stance; want.stance = 0; }
    for (const n in want) { if (!P.A[n]) continue; P.w[n] += (want[n] - P.w[n]) * Math.min(1, dt * 10); P.A[n].setEffectiveWeight(P.w[n]); }
    const ws = (PACE[P.key] || {}).walkSpeed || 1, js = (PACE[P.key] || {}).jogSpeed || 2.5;
    if (P.A.walk) P.A.walk.timeScale = sp < .05 ? 1 : pace / ws; if (P.A.jog) P.A.jog.timeScale = Math.max(.6, sp / js);
    P.mixer.update(dt); P.m.updateMatrixWorld(true);
  }
  // the arms: where the fists want to be (the stance, a high guard, a low one), over whatever the clip does, as much as ik says
  function arms(P, f, dt) {
    const punch = P.shot && ['jab', 'cross', 'hook'].includes(P.shot.name);   // (a punch: the clip throws it, the fists come back to the guard at its end)
    const want = f.ko || f.mode !== 'fight' ? 0 : P.shot ? (punch ? (P.shot.t > P.shot.dur * .85 ? .6 : 0) : .25) : 1;
    P.ik += (want - P.ik) * Math.min(1, dt * 14); P.fist += ((f.mode === 'fight' && !f.ko ? 1 : 0) - P.fist) * Math.min(1, dt * 8);
    if (P.ik > .01) {
      const hd = P.bones.head.getWorldPosition(new V3()), fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), lf = new V3(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), g = f.guardW, lo = f.lowW;
      const pt = (fwd, side, up) => hd.clone().addScaledVector(fw, fwd).addScaledVector(lf, side).addScaledVector(UP, up);
      const L = pt(.4, .14, -.11).lerp(pt(.27, .09, -.01), g).lerp(pt(.3, .13, -.42), lo * g), R = pt(.31, -.16, -.15).lerp(pt(.26, -.09, -.02), g).lerp(pt(.28, -.13, -.44), lo * g);
      const bob = Math.sin(f.t * 5.5) * .012 * (1 - g); L.y += bob; R.y -= bob;
      for (const [s, T, sd] of [['l', L, 1], ['r', R, -1]]) { const sh = P.bones['upperarm_' + s].getWorldPosition(new V3()), pole = sh.clone().addScaledVector(UP, -1).addScaledVector(lf, sd * .7).addScaledVector(fw, -.25);
        reach(P.bones['upperarm_' + s], P.bones['lowerarm_' + s], P.bones['hand_' + s], T, pole, P.ik); }
    }
    fists(P, P.fist);
  }

  // ---------- a fighter: one person, the same rules for him, the computer, or (later) someone over the network ----------
  function fighter(P, name) { return { P, name, x: 0, z: 0, y: 0, yaw: 0, vf: 0, vs: 0, hp: 100, st: 100, move: null, buf: null, guard: false, guardW: 0, low: false, lowW: 0, parryT: 9, counterT: 0,
    stagger: 0, dodge: null, ko: false, koT: 0, t: 0, chain: [], chainT: 0, mode: 'walk', hint: -1, tauntT: 0, mouth: new V3() }; }
  const say = (f, s) => fx.rant(f.mouth, s);                          // (a bubble over him, following him)
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const facing = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1; return (Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz) / d; };
  function place(f) { const q = track.probe(f.x, f.z, f.hint); f.hint = q.i; if (f.air) { if (f.y <= q.y) { f.y = q.y; f.air = false; f.vy = 0; } } else { f.y += (q.y - f.y) * .5; if (Math.abs(q.y - f.y) > .5) f.y = q.y; } f.P.G.position.set(f.x, f.y, f.z); f.P.G.rotation.y = f.yaw; f.mouth.set(f.x, f.y + f.P.height + .22, f.z); }
  function push(f) { if (f.ghost) return; const s = solid(f.x, f.z, .3, f.hint, f.air ? f.y : null); if (s) { f.x += s.x; f.z += s.z; } }   // (ghost: the computer's one, stuck behind something, lets himself through; in the air: over what is lower than his feet)

  function fight(f, o, inp, dt) {                                      // one step of a fighter against the other
    f.t += dt; f.parryT += dt; f.counterT = Math.max(0, f.counterT - dt); f.chainT += dt; f.tauntT = Math.max(0, f.tauntT - dt);
    if (f.ko) { f.koT += dt; animate(f.P, dt, 0, 'fight'); arms(f.P, f, dt); place(f); return; }
    const busy = f.move || f.wind || f.stagger > 0 || f.dodge;
    f.st = Math.min(100, f.st + dt * (f.guard ? 6 : f.move ? 0 : 20));
    f.stagger = Math.max(0, f.stagger - dt);
    // guard: raised (a parry if a punch lands within a moment of it), dropped while punching or knocked about
    const gNow = !!inp.guard && !f.move && f.stagger <= 0 && !f.dodge; if (gNow && !f.guard) f.parryT = 0; f.guard = gNow; f.low = !!inp.low;
    if (f.guard) f.st = Math.max(0, f.st - dt * 3);
    f.guardW += ((f.guard ? 1 : 0) - f.guardW) * Math.min(1, dt * 18); f.lowW += ((f.low ? 1 : 0) - f.lowW) * Math.min(1, dt * 14);
    // face him (a little slower when busy)
    const want = Math.atan2(o.x - f.x, o.z - f.z), dy = Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw)); f.yaw += dy * Math.min(1, dt * (busy ? 4 : 10));
    // on the feet: in, back, round him; a dodge: a quick step, nothing lands on him through it
    if (inp.dodge && !f.dodge && !f.move && f.st >= 14 && f.stagger <= 0) { const fwd = inp.fwd || 0, sd = inp.side || 0, n = Math.hypot(fwd, sd); f.dodge = { t: 0, f: n ? fwd / n : -1, s: n ? sd / n : 0 }; f.st -= 14; }
    let tf = (inp.fwd || 0) * (inp.fwd > 0 ? 1.7 : 1.35), ts = (inp.side || 0) * 1.45;
    if (f.guard) { tf *= .55; ts *= .55; } if (f.move) { tf *= .25; ts *= .25; } if (f.stagger > 0) { tf = -.6; ts = 0; }
    if (f.dodge) { f.dodge.t += dt; const k = 4.6 * (1 - f.dodge.t / .26); tf = f.dodge.f * k; ts = f.dodge.s * k; if (f.dodge.t > .26) f.dodge = null; }
    const acc = f.dodge ? 30 : 9; f.vf += (tf - f.vf) * Math.min(1, dt * acc); f.vs += (ts - f.vs) * Math.min(1, dt * acc);
    const fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), rt = new V3(-Math.cos(f.yaw), 0, Math.sin(f.yaw));
    f.x += (fw.x * f.vf + rt.x * f.vs) * dt; f.z += (fw.z * f.vf + rt.z * f.vs) * dt;
    const d = dist(f, o); if (d < 1 && !o.ko) { const k = (1 - d) / 2 / (d || 1); f.x += (f.x - o.x) * k; f.z += (f.z - o.z) * k; o.x -= (f.x - o.x) * k; o.z -= (f.z - o.z) * k; }   // (bodies do not pass)
    push(f);
    // punches: started, buffered while one is going (a combo flows), landing at the fist's furthest
    //   the computer's first punch of a combo: a wind-up first (he draws back, a "!" over him), so it can be read and met
    if (inp.atk && f.stagger <= 0 && !f.dodge) { if (!f.move && !f.wind) { if (f.ai) { f.wind = { k: inp.atk, t: 0 }; fx.pop(head(f), '!', '#efc970'); } else begin(f, inp.atk); } else if (f.move && f.move.t > f.move.dur * .45) f.buf = inp.atk; }
    if (f.wind) { f.wind.t += dt; if (f.stagger > 0) f.wind = null; else if (f.wind.t >= .26) { const k = f.wind.k; f.wind = null; begin(f, k); } }
    if (inp.taunt && !f.move && !f.guard && f.tauntT <= 0) { f.tauntT = 2.2; shot(f.P, 'no', 1.4); f.st = Math.min(100, f.st + 25); say(f, pick(SAY.taunt)); }
    if (f.move) { const M = f.move; M.t += dt;
      if (!M.done && M.t >= M.dur * M.imp) { M.done = true; land(f, o, M); }
      if (M.t >= M.dur) { f.move = null; if (f.buf) { const b = f.buf; f.buf = null; begin(f, b); } } }
    animate(f.P, dt, f.vf || f.vs ? Math.hypot(f.vf, f.vs) * Math.sign(f.vf || 1) : 0, 'fight');
    // leaning into it: forward in a punch, back when hit, into the way he steps
    const b = f.P.body; b.rotation.x += ((f.move ? .12 : f.wind ? -.16 : 0) + f.vf * .03 - (f.stagger > 0 ? .15 : 0) - b.rotation.x) * Math.min(1, dt * 10); b.rotation.z += (-f.vs * .05 - b.rotation.z) * Math.min(1, dt * 8);
    b.position.y += ((f.move && f.move.dip ? -.12 : f.guard && f.low ? -.06 : 0) - b.position.y) * Math.min(1, dt * 12);
    arms(f.P, f, dt); place(f);
  }
  function begin(f, k) {
    const M = MOVES[k]; if (!M) return; const tired = f.st < 18;
    f.chain = f.chainT < .5 ? [...f.chain, k].slice(-3) : [k]; f.chainT = 0;
    const combo = f.chain.join() === 'jab,jab,cross' ? 'SERIA' : f.chain.slice(-2).join() === 'jab,cross' ? 'RAZ-DWA' : null;
    f.move = { k, ...M, t: 0, dur: M.dur * (tired ? 1.35 : 1), imp: IMPACT[M.clip] || .45, done: false, combo, mul: (combo === 'SERIA' ? 1.5 : combo ? 1.3 : 1) * (tired ? .7 : 1) * (f.counterT > 0 ? 1.5 : 1) * (f.ai ? AI_DMG : 1), counter: f.counterT > 0 };
    f.counterT = 0; f.st = Math.max(0, f.st - M.st); shot(f.P, M.clip, f.move.dur);
  }
  const head = f => f.P.bones.head.getWorldPosition(new V3()).add(new V3(0, .32, 0));
  const chest = f => f.P.bones.spine_03.getWorldPosition(new V3());
  function land(f, o, M) {
    const d = dist(f, o); if (d > M.reach || facing(f, o) < .6 || o.ko) return;   // (a miss: out of reach, or not at him)
    if (o.dodge) { fx.pop(head(o), 'UNIK!', '#9ccad8'); return; }
    const at = M.zone === 'high' ? o.P.bones.head.getWorldPosition(new V3()) : chest(o), covered = o.guard && (M.zone === 'low') === o.low;
    if (covered) {
      if (o.parryT < .18) { f.stagger = .75; f.move = null; f.buf = null; o.counterT = 1.1; fx.pop(at.clone().add(new V3(0, .3, 0)), 'KONTRA!', '#efc970'); shot(f.P, 'hithead', .5, { from: .1 }); fx.shake(.18); return; }   // (a parry)
      o.hp -= M.dmg * .12; o.st -= M.dmg * 1.4; fx.pop(at, 'BLOK', '#d3d0c3'); fx.impact(at, null); fx.shake(.06);
      if (o.st <= 0) { o.st = 0; o.guard = false; o.stagger = .9; fx.pop(at.clone().add(new V3(0, .3, 0)), 'GARDA PĘKŁA!', '#cf5a3e'); shot(o.P, 'hitchest', .6); }
      if (Math.random() < .25) say(o, pick(SAY.blocked)); return;
    }
    const dmg = M.dmg * M.mul; o.hp -= dmg; if (!(M.k === 'jab' && o.wind)) { o.move = null; o.buf = null; }
    const heavy = M.heavy || dmg >= 16, fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    fx.impact(at, heavy ? 'BUM!' : M.zone === 'low' ? 'PAC!' : 'ŁUP!'); fx.shake(heavy ? .32 : .16); if (heavy) fx.slow(.08);
    if (M.combo || M.counter) fx.pop(at.clone().add(new V3(0, .35, 0)), M.counter ? 'KONTRA!' : M.combo + '!', '#efc970');
    if (o.hp <= 0) { o.hp = 0; o.ko = true; o.koT = 0; o.guard = false; shot(o.P, 'death', 1.6, { clamp: true }); fx.slow(.5); fx.shake(.4); return; }
    if (heavy) { o.stagger = .55; o.x += fw.x * .55; o.z += fw.z * .55; shot(o.P, 'knock', .8); }
    else if (M.k === 'jab' && o.wind) { o.x += fw.x * .06; o.z += fw.z * .06; }   // (a jab into his wind-up: it stings, it does not stop him)
    else { o.stagger = .22; o.x += fw.x * .12; o.z += fw.z * .12; shot(o.P, M.zone === 'high' ? 'hithead' : 'hitchest', .45); }
    if (Math.random() < .3) { if (o === me) say(f, pick(SAY.hitHim)); else say(o, pick(SAY.hitMe)); }
  }

  // ---------- the computer's fighter: keeps its distance, circles, jabs and follows up, guards (not always the right way), backs off hurt ----------
  function ai(f, o, dt) {
    const A = f.ai || (f.ai = { think: 0, plan: 'close', strafe: 1, seen: null, guardT: 0, low: false, spam: 0, combo: null }), d = dist(f, o), inp = { fwd: 0, side: 0 };
    A.think -= dt; A.guardT -= dt; A.spam = Math.max(0, A.spam - dt * 1.2); if (f.stagger > 0) A.combo = null;
    // can not get to you (a fence, a hedge between): round it; still not, through it
    if (d > 1.45) { A.best = Math.min(A.best ?? d, d); if (d > A.best - .05) A.stuck = (A.stuck || 0) + dt; else { A.stuck = 0; A.best = d; } } else { A.stuck = 0; A.best = d; f.ghost = false; }
    if (A.stuck > 1.2 && A.stuck < 1.25) A.strafe = -A.strafe; if (A.stuck > 3) f.ghost = true;
    if (A.think <= 0) { A.think = .25 + Math.random() * .4; const r = Math.random(), hurt = f.hp < 30, tired = f.st < 25;
      A.plan = d > 1.7 ? (r < .85 ? 'close' : 'circle') : (hurt || tired) && r < .35 ? 'back' : r < .55 ? 'attack' : r < .85 ? 'circle' : 'close'; if (Math.random() < .35) A.strafe = -A.strafe; }
    // he sees one coming: a guard (more often the more you throw the same), the right height mostly; or a step away
    if (o.move && A.seen !== o.move) { A.seen = o.move; A.spam += 1; const r = Math.random(), gP = Math.min(.8, .5 + A.spam * .06);
      if (r < gP) { A.guardT = .45; A.low = Math.random() < .82 ? o.move.zone === 'low' : o.move.zone !== 'low'; } else if (r < gP + .12 && f.st > 20) { inp.dodge = true; inp.fwd = -1; inp.side = A.strafe; } }
    if (A.spam > 2.5 && A.guardT > 0) A.combo = null;                     // (being rained on: he covers up and waits for you to tire or open up)
    if (A.guardT > 0 && !A.combo) { inp.guard = true; inp.low = A.low; }
    if (A.plan === 'close' || A.stuck > 1) inp.fwd = d > 1.26 ? 1 : 0;
    if (A.stuck > 1 && A.stuck < 3) inp.side = A.strafe;
    if (A.plan === 'circle') { inp.side = A.strafe; inp.fwd = d > 1.5 ? .5 : d < 1.15 ? -.6 : 0; }
    if (A.plan === 'back') { inp.fwd = -1; inp.side = A.strafe * .6; }
    // attacks: a combo at a time (jab, cross; jab, jab, cross; a hook to finish; now and then to the body)
    if (A.plan === 'attack' && !A.combo && d < 1.38 && f.st > 12) { const r = Math.random(); A.combo = r < .3 ? ['jab', 'cross'] : r < .5 ? ['jab', 'jab', 'cross'] : r < .65 ? ['cross', 'hook'] : r < .8 ? ['bodyR', 'hook'] : r < .9 ? ['jab'] : ['hook']; A.plan = 'circle'; }
    if (A.plan === 'attack' && d >= 1.38) inp.fwd = 1;
    // a punch of yours gone by (landed or missed): the moment to hit back
    if (o.move && o.move.done && !f.move && !A.combo && d < 1.4 && Math.random() < dt * 7) A.combo = Math.random() < .6 ? ['cross'] : ['hook'];
    if (o.stagger > .2 && !A.combo && d < 1.4) A.combo = ['cross', 'hook'];           // (you are reeling: he goes in)
    if (A.combo && f.stagger <= 0 && !f.dodge && !f.wind) { if (!f.move) inp.atk = A.combo.shift(); else if (f.move.t > f.move.dur * .55) { inp.atk = A.combo.shift(); } if (!A.combo.length) A.combo = null; }
    if (!inp.guard && !A.combo && Math.random() < dt * .2 && f.tauntT <= 0 && d > 1.4) inp.taunt = true;
    return inp;
  }

  // ---------- the state: him on foot, the ones with a grudge, the fight ----------
  let ready = false, me = null, foe = null, active = false, view = 'third', fightNow = null, grudges = [], pitch = 0;
  const mAim = { x: 0, y: 0, dir: 'right' };                              // (the mouse's side for the next punch; it stays where last pointed)
  const ATK = { left: 'jab', right: 'cross', up: 'hook' };
  const SIDE = { jab: 'right', cross: 'left', hook: 'up', bodyL: 'down', bodyR: 'down' };   // (his punch, as it comes at you: his left from your right)
  const brawlers = [];
  Promise.all(['boy', 'brawler'].map(k => new Promise(ok => loader.load(`assets/export/${k}.glb`, g => { src[k] = g; ok(); }, undefined, () => ok())))).then(() => {
    if (!src.boy || !src.brawler) return;
    me = fighter(person('boy', kit), 'TY'); me.P.G.visible = false;
    for (let k = 0; k < 2; k++) { const f = fighter(person('brawler'), 'ROWERZYSTA'); f.P.G.visible = false; brawlers.push(f); }
    measure(me.P); ready = true;
  });
  function measure(P) {                                               // when, in each punch clip, the fist is out furthest
    P.G.position.set(0, 0, 0); P.G.rotation.set(0, 0, 0); P.G.updateMatrixWorld(true);
    for (const n of ['jab', 'cross', 'hook']) { const a = P.A[n]; if (!a) continue; P.mixer.stopAllAction(); a.reset().play(); let best = -9, bt = .45;
      for (let k = 2; k <= 22; k++) { a.time = P.clips[n].duration * k / 24; P.mixer.update(0); P.m.updateMatrixWorld(true); const pz = P.bones.pelvis.getWorldPosition(new V3()).z;
        for (const s of ['l', 'r']) { const r = P.bones['hand_' + s].getWorldPosition(new V3()).z - pz; if (r > best) { best = r; bt = k / 24; } } }
      IMPACT[n] = bt; a.stop(); }
    P.mixer.stopAllAction(); for (const n of ['idle', 'walk', 'jog', 'stance']) if (P.A[n]) { P.A[n].play(); P.A[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
  }

  function start(at) { if (!ready) return false; active = true; Object.assign(me, { x: at.x, z: at.z, yaw: at.yaw, y: track.probe(at.x, at.z, at.hint ?? -1).y, hint: at.hint ?? 0, vf: 0, vs: 0, mode: 'walk', ko: false, hp: Math.max(me.hp, 60), move: null, stagger: 0, dodge: null, down: null });
    me.P.G.visible = true; place(me); if (at.getUp) { shot(me.P, 'death', .05, { clamp: true }); me.down = { t: 2.1, vx: 0, vz: 0 }; } return true; }   // (getUp: he was lying; up he gets)
  // knocked down (a car): flung along the way it went, a while on the ground, up again
  function knock(vx, vz, dmg) { if (!active || me.down) return false; me.hp = Math.max(8, me.hp - dmg); me.move = null; me.guard = false; me.down = { t: 0, vx, vz }; shot(me.P, 'death', 1.1, { clamp: true }); fx.shake(.4); fx.slow(.1); return true; }
  // a punch thrown when not fighting (at someone walking, or at the air): true if it was started
  function swing(k) { if (!active || fightNow || me.down || (me.P.shot && ['jab', 'cross', 'hook'].includes(me.P.shot.name))) return false; shot(me.P, k, MOVES[k].dur); return true; }
  // someone called for (a brother-in-law out of a house): he comes for you, fights, and goes off again
  function grudgeAt(at, line) { if (!ready || fightNow) return false; const f = brawlers.find(b => !b.busy); if (!f) return false; f.busy = true;
    Object.assign(f, { x: at.x, z: at.z, y: at.y, hint: -1, yaw: Math.atan2(me.x - at.x, me.z - at.z), hp: 100, st: 100, ko: false, move: null, mode: 'walk', vf: 0, vs: 0, stagger: 0, dodge: null, wind: null });
    f.P.G.visible = true; place(f); grudges.push({ bike: null, f, t: 0, state: 'after', home: new V3(at.x, at.y, at.z) }); if (line) setTimeout(() => say(f, line), 300); return true; }
  function stop() { active = false; me.P.G.visible = false; setHead(true); camera.near = .1; camera.updateProjectionMatrix(); cam.init = false; }
  function setHead(show) { if (!me) return; me.P.bones.head.scale.setScalar(show ? 1 : .001); me.P.m.userData.cap.visible = show; }
  function toggleView() { view = view === 'first' ? 'third' : 'first'; fx.flash(view === 'first' ? 'Widok: z oczu' : 'Widok: zza pleców'); }

  // a cyclist knocked off by a kick: gets up, and comes for him
  function grudge(bike) { if (!ready || fightNow || grudges.some(g => g.bike === bike)) return; const f = brawlers.find(b => !b.busy); if (!f) return;
    f.busy = true; bike.hold = true; grudges.push({ bike, f, t: 0, state: 'down' }); }
  function nearBike(p) { return active && Math.hypot(me.x - p.x, me.z - p.z) < 1.7; }

  // who wins takes something (fx.take: the game says what)
  function end(winner, loser) {
    const g = fightNow; fightNow = null; me.mode = 'walk'; winner.mode = loser.mode = 'walk'; if (g.autoView) view = 'third';
    if (loser === me) { const line = fx.take(); say(winner, line || pick(SAY.won)); g.state = 'leave'; g.wait = 3.2; }
    else { fx.score(15, head(loser), 'NOKAUT! +15', '#efc970'); fx.flash('Nokaut!'); setTimeout(() => say(loser, pick(SAY.ko)), 900); g.state = 'lying'; g.wait = 4.5; }
  }

  // ---------- each frame ----------
  //   inp: { fwd, side, run, atkL, atkR, up, down, guard, dodge, taunt }   world: { rider: { x, z, v, riding } }
  function update(dt, inp, world) {
    if (!ready) return;
    // the ones with a grudge: down a moment, up (as the man in the checked shirt), after him, the fight, back to the bike
    for (let k = grudges.length - 1; k >= 0; k--) { const G = grudges[k], f = G.f, b = G.bike; G.t += dt;
      const tx = active ? me.x : world.rider.x, tz = active ? me.z : world.rider.z, d = Math.hypot(f.x - tx, f.z - tz);
      if (G.state === 'down' && G.t > 1.5) { const p = b.r.pelvisAt || b.r.root.position; Object.assign(f, { x: p.x, z: p.z, y: p.y, hint: -1, yaw: Math.atan2(tx - p.x, tz - p.z), hp: 100, st: 100, ko: false, move: null, mode: 'walk', vf: 0, vs: 0, stagger: 0 });
        b.r.boy.visible = false; f.P.G.visible = true; shot(f.P, 'getup', .9); G.state = 'after'; G.t = 0; const lines = active ? SAY.grudgeFoot : SAY.grudge; setTimeout(() => say(f, pick(lines)), 600); }
      else if (G.state === 'after') {
        if (d > 24 || G.t > 25) { say(f, pick(SAY.coward)); G.state = 'leave'; G.wait = .6; }
        else if (d < 1.9 && (active || Math.abs(world.rider.v) < 3.5)) { if (!active) world.pullOff(); fightNow = G; G.state = 'fight'; me.mode = 'fight'; f.mode = 'fight'; if (view === 'third') { view = 'first'; G.autoView = true; } say(f, pick(SAY.start)); fx.flash(me.lockedHint ? 'Bójka! Mysz: strona ciosu, LPM cios, PPM blok, Shift unik' : 'Bójka! Kliknij: mysz (LPM cios, PPM blok) albo ← → ↑ ↓ i Spacja'); }
        else { const want = Math.atan2(tx - f.x, tz - f.z); f.yaw += Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw)) * Math.min(1, dt * 5); const v = G.t < .9 ? 0 : d > 6 ? 3.2 : 1.5;
          f.x += Math.sin(f.yaw) * v * dt; f.z += Math.cos(f.yaw) * v * dt; push(f); animate(f.P, dt, v, 'walk'); f.P.body.rotation.set(0, 0, 0); place(f); } }
      else if (G.state === 'fight') { if (!active) { G.state = 'after'; continue; }
        if (d > 9) { fightNow = null; G.state = 'after'; me.mode = 'walk'; }   // (he got away: after him again)
        else { fight(f, me, ai(f, me, dt), dt); if (me.ko && !G.endT) G.endT = 1.4; if (f.ko && !G.endT) G.endT = 1.6;
          if (G.endT && (G.endT -= dt) <= 0) { G.endT = 0; end(me.ko ? f : me, me.ko ? me : f); } } }
      else if (G.state === 'lying' || G.state === 'leave') { if (G.state === 'lying') { f.koT += dt; animate(f.P, dt, 0, 'fight'); arms(f.P, f, dt); place(f); }
        if ((G.wait -= dt) <= 0) { if (G.state === 'lying') { f.ko = false; shot(f.P, 'getup', 1.2); G.state = 'leave'; G.wait = 1.3; setTimeout(() => say(f, pick(SAY.back)), 1300); } else G.state = 'walkback'; }
        else if (G.state === 'leave') { animate(f.P, dt, 0, 'walk'); arms(f.P, f, dt); place(f); } }
      else if (G.state === 'walkback') { const p = b ? b.r.root.position : G.home, dd = Math.hypot(p.x - f.x, p.z - f.z);
        if (dd < .8) { f.P.G.visible = false; if (b) { b.r.boy.visible = true; b.hold = false; } f.busy = false; grudges.splice(k, 1); continue; }
        const want = Math.atan2(p.x - f.x, p.z - f.z); f.yaw += Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw)) * Math.min(1, dt * 5); f.mode = 'walk'; f.ko = false;
        f.x += Math.sin(f.yaw) * 1.3 * dt; f.z += Math.cos(f.yaw) * 1.3 * dt; animate(f.P, dt, 1.3, 'walk'); arms(f.P, f, dt); f.P.body.rotation.set(0, 0, 0); place(f); } }
    if (!active) return;
    // him: in a fight, a fighter; else walking
    if (me.down) { const D = me.down; D.t += dt; const k = Math.max(0, 1 - D.t / .6); me.x += D.vx * k * dt; me.z += D.vz * k * dt; push(me);
      if (D.t > 2.2 && !D.up) { D.up = true; shot(me.P, 'getup', 1.1); } if (D.t > 3.3) me.down = null;
      animate(me.P, dt, 0, fightNow ? 'fight' : 'walk'); arms(me.P, me, dt); place(me); return; }
    if (me.ko && !fightNow) { me.koT += dt; if (me.koT > 3.2) { me.ko = false; me.hp = 55; shot(me.P, 'getup', 1.1); } animate(me.P, dt, 0, 'fight'); arms(me.P, me, dt); place(me); return; }
    me.lockedHint = !!inp.locked;
    if (fightNow) { let atk = inp.atkL ? (inp.up ? 'hook' : inp.down ? 'bodyL' : 'jab') : inp.atkR ? (inp.up ? 'hook' : inp.down ? 'bodyR' : 'cross') : null;
      if (inp.locked) { mAim.x += (inp.dx || 0) * .014; mAim.y += (inp.dy || 0) * .014; const l = Math.hypot(mAim.x, mAim.y); if (l > 1) { mAim.x /= l; mAim.y /= l; }
        if (l > .45) mAim.dir = Math.abs(mAim.x) > Math.abs(mAim.y) ? (mAim.x < 0 ? 'left' : 'right') : mAim.y < 0 ? 'up' : 'down';
        mAim.x *= 1 - Math.min(1, dt * 2.5); mAim.y *= 1 - Math.min(1, dt * 2.5);
        if (inp.lmb) atk = mAim.dir === 'down' ? (me.lastBody === 'bodyL' ? 'bodyR' : 'bodyL') : ATK[mAim.dir]; if (atk && atk.startsWith('body')) me.lastBody = atk; }
      fight(me, fightNow.f, { fwd: inp.fwd, side: inp.side, atk, guard: inp.guard || inp.rmb, low: inp.down || (inp.rmb && inp.locked && mAim.dir === 'down'), dodge: inp.dodge, taunt: inp.taunt }, dt); return; }
    me.hp = Math.min(100, me.hp + dt * 4); me.st = Math.min(100, me.st + dt * 25);
    if (inp.jump && !me.air) { me.air = true; me.vy = 4.4; if (me.P.A.jump) shot(me.P, 'jump', .9); }     // (a jump: up about a metre)
    if (me.air) { me.vy -= 9.8 * dt; me.y += me.vy * dt; }
    const top = inp.fwd > 0 ? (inp.run ? 3.6 : 1.5) : inp.fwd < 0 ? -.9 : 0; me.vf += (top - me.vf) * Math.min(1, dt * (top ? 5 : me.air ? 1 : 8));
    if (inp.locked) { me.yaw -= (inp.dx || 0) * .0026; pitch = clamp(pitch - (inp.dy || 0) * .0022, -1, .75); me.vs += ((inp.side || 0) * 1.25 - me.vs) * Math.min(1, dt * 8); }
    else { me.vs = 0; me.yaw -= (inp.side || 0) * dt * (2.6 - Math.min(1, Math.abs(me.vf) / 3.6) * .9); pitch += (0 - pitch) * Math.min(1, dt * 2); }
    const rt = new V3(-Math.cos(me.yaw), 0, Math.sin(me.yaw)); me.x += Math.sin(me.yaw) * me.vf * dt + rt.x * me.vs * dt; me.z += Math.cos(me.yaw) * me.vf * dt + rt.z * me.vs * dt; push(me);
    animate(me.P, dt, Math.abs(me.vs) > Math.abs(me.vf) ? Math.abs(me.vs) : me.vf, 'walk'); const b = me.P.body; b.rotation.x += (Math.max(0, me.vf - 2) * .05 - b.rotation.x) * Math.min(1, dt * 6); b.rotation.z += ((inp.side || 0) * me.vf * -.03 - b.rotation.z) * Math.min(1, dt * 6); b.position.y = 0;
    arms(me.P, me, dt); place(me);
  }

  // ---------- the camera: through his eyes (his head out of the way, his fists in the picture), or behind him ----------
  const cam = { pos: new V3(), look: new V3(), init: false }, _eye = new V3();
  function follow(dt) {
    const f = me, fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), foeF = fightNow ? fightNow.f : null;
    setHead(view !== 'first' || f.ko);
    if (view === 'first' && !f.ko) {
      f.P.bones.head.getWorldPosition(_eye); _eye.addScaledVector(fw, .09).add(new V3(0, .06, 0));
      const lf0 = new V3(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), look = foeF ? foeF.P.bones.spine_03.getWorldPosition(new V3()).lerp(foeF.P.bones.head.getWorldPosition(new V3()), .5).addScaledVector(lf0, -mAim.x * .12).add(new V3(0, -mAim.y * .1, 0))
        : _eye.clone().addScaledVector(fw, 4 * Math.cos(pitch)).add(new V3(0, 4 * Math.sin(pitch) - .45 * (1 - Math.abs(pitch)), 0));
      if (!cam.init) { cam.look.copy(look); cam.init = true; } cam.look.lerp(look, 1 - Math.exp(-dt * 12)); cam.pos.copy(_eye);
      camera.position.copy(_eye); camera.up.set(0, 1, 0); camera.lookAt(cam.look); camera.rotateZ(-f.vs * .02);
      camera.near = .04; camera.fov += (74 - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); return f;
    }
    const lf = new V3(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), back = foeF ? 2.5 : 3.1, want = new V3(f.x, f.y + (foeF ? 1.95 : 1.9 - pitch * 1.3), f.z).addScaledVector(fw, -back).addScaledVector(lf, foeF ? 1.05 : 0);   // (in a fight: over his shoulder, off to the side, both in the picture)
    const look = foeF ? new V3(f.x + (foeF.x - f.x) * .62, f.y + 1.2, f.z + (foeF.z - f.z) * .62) : new V3(f.x, f.y + 1.3 + pitch * 2.4, f.z).addScaledVector(fw, 2.2);
    if (!cam.init) { cam.pos.copy(want); cam.look.copy(look); cam.init = true; }
    cam.pos.lerp(want, 1 - Math.exp(-dt * 6)); cam.look.lerp(look, 1 - Math.exp(-dt * 8)); const q = track.probe(cam.pos.x, cam.pos.z, f.hint); cam.pos.y = Math.max(cam.pos.y, q.y + .5);
    camera.position.copy(cam.pos); camera.up.set(0, 1, 0); camera.lookAt(cam.look); camera.near = .1; camera.fov += (60 - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); return f;
  }
  // what the HUD shows: the two bars in a fight; how red the edges (his health low)
  function star() { if (!fightNow) return null; const o = fightNow.f, k = o.wind ? o.wind.k : o.move && !o.move.done ? o.move.k : null;
    const green = !!(o.move && !o.move.done && o.move.dur * o.move.imp - o.move.t < .2);
    return { dir: mAim.dir, foe: k ? SIDE[k] : null, green, guard: me.guard, low: me.low }; }
  function status() { if (!me) return null; return { star: star(), fight: fightNow ? { a: { name: 'TY', hp: me.hp, st: me.st, guard: me.guard }, b: { name: fightNow.f.name, hp: fightNow.f.hp, st: fightNow.f.st } } : null, low: active ? clamp((40 - me.hp) / 40, 0, 1) : 0 }; }
  return { get fit() { return me && me.P.m.userData.headFit; }, FIST, knock, swing, grudgeAt, get down() { return !!(me && me.down); }, get foe() { return fightNow ? fightNow.f : null; }, get ready() { return ready; }, get active() { return active; }, get fighting() { return !!fightNow; }, get me() { return me; }, get view() { return view; }, get chasing() { return grudges.some(g => g.state === 'after'); },
    start, stop, update, follow, grudge, nearBike, toggleView, status };
}
