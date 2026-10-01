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
import { makeBag } from './bag.js';

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
  // kicks, only out of a fight (one on one it is fists): a front kick, a roundhouse, and from a jump a flying kick. dur: the whole
  // kick; hit: when it lands (s); the leg moved by reach() to where the foot goes (knee up, out, back)
  const KICKS = { kickF: { dur: .52, hit: .24, side: 'r', kind: 'front' }, kickR: { dur: .62, hit: .32, side: 'l', kind: 'round' }, kickJ: { dur: .5, hit: .18, side: 'r', kind: 'fly' } };
  const CHAIN = { jab: ['jab', 'cross', 'kickF', 'kickR'], cross: ['cross', 'jab', 'kickF', 'kickR'] };   // (hit after hit: fist, fist, kick, roundhouse)
  const AI_DMG = .85;
  // the kinds he fights: how much they take, how hard they hit, how long their wind-up (the time to read it), how long they stand open
  // after a punch, how often they guard, feint (a wind-up let go of) or throw a second one straight after; the brother-in-law's
  // wind-up can not be stopped by a punch
  const KINDS = {
    cherlak: { name: 'CHERLAK', hp: 70, dmg: .7, wind: .8, recover: .95, guard: .25, feint: 0, combo: 0 },
    kozak: { name: 'KOZAK Z OSIEDLA', hp: 100, dmg: 1.1, wind: .58, recover: .65, guard: .45, feint: .25, combo: .35 },
    szwagier: { name: 'SZWAGIER', hp: 140, dmg: 1.3, wind: .85, recover: .8, guard: .3, feint: 0, combo: .15, armor: true } };
  const PARRY = .3;                                                    // (the green moment before a punch lands: a guard raised in it is a parry)                                                  // (the computer hits a little softer: from his eyes it is harder to read)                  // (when in each clip the fist is out furthest: measured on load)

  // ---------- a person: the model, its clips, its bones; a cap and a bag for him ----------
  function person(key, extras) {
    const g = src[key], m = SkeletonUtils.clone(g.scene), G = new THREE.Group(), body = new THREE.Group(); G.add(body); body.add(m); scene.add(G);
    m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) }); o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(m), A = {}, clips = {};
    for (const c of g.animations) { clips[c.name] = c; A[c.name] = mixer.clipAction(c); }
    const jab = clips.jab; if (jab) { clips.stance = THREE.AnimationUtils.subclip(jab, 'stance', 0, 2, 30); A.stance = mixer.clipAction(clips.stance); }   // (the jab's first frame: fists up, feet set)
    const b = n => m.getObjectByName(n), bones = {};
    for (const n of ['pelvis', 'spine_02', 'spine_03', 'neck_01', 'head', 'upperarm_l', 'lowerarm_l', 'hand_l', 'upperarm_r', 'lowerarm_r', 'hand_r', 'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r']) bones[n] = b(n);
    const fingers = { l: [], r: [] }; m.traverse(o => { const r = /^(index|middle|ring|pinky)_0[123]_([lr])$/.exec(o.name); if (r) fingers[r[2]].push(o); });
    for (const n of ['idle', 'walk', 'jog', 'stance']) if (A[n]) { A[n].play(); A[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
    m.updateMatrixWorld(true);
    if (extras) extras(m, bones);
    // the paper boy younger than the model as made: a bigger head for his body (as a lad of thirteen or so)
    const headS = key === 'boy' ? 1.1 : 1; if (key === 'boy') { bones.head.scale.setScalar(headS); m.traverse(o => { if (o.isMesh) for (const mt of [].concat(o.material)) mt.userData.noFade = true; }); m.updateMatrixWorld(true); }
    return { key, G, body, m, mixer, A, clips, bones, fingers, headS, shot: null, w: { idle: 1, walk: 0, jog: 0, stance: 0 }, ik: 0, fist: 0, height: (PACE[key] || {}).height || 1.7 };
  }
  // his cap and his bag, as on the bike (a red cap snug on his head, the hair out under it; an olive satchel of papers on his left hip,
  // its strap across his back and chest to his right shoulder): fitted to his head in the rest pose, then carried by his bones
  function kit(m, bones) {
    m.updateMatrixWorld(true);
    // the head: the top of the skull and its width and depth just under it, from the body's vertices; the hair's top over it
    const H = bones.head, hp = H.getWorldPosition(new V3()), v = new V3(), pts = [], hpts = [];
    let skull = hp.y, hair = hp.y;
    m.traverse(o => { if (!o.isMesh) return; const isBody = /male1591|female1605/.test(o.name), isHair = /short|hair|bob|long|ponytail|afro|braid/.test(o.name); if (!isBody && !isHair) return;
      const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (v.y < hp.y + .04 || Math.hypot(v.x - hp.x, v.z - hp.z) > .2) continue;
        if (isBody) { skull = Math.max(skull, v.y); pts.push(v.clone()); } else { hair = Math.max(hair, v.y); hpts.push(v.clone()); } } });
    // the head's size at the brow, from the body alone (the hair goes under the cap)
    const band = pts.filter(p => p.y > skull - .09 && p.y < skull - .05); let x0 = 9, x1 = -9, z0 = 9, z1 = -9; for (const p of band) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const hw = band.length ? (x1 - x0) / 2 : .08, hd = band.length ? (z1 - z0) / 2 : .095, cx = band.length ? (x0 + x1) / 2 : hp.x, cz = band.length ? (z0 + z1) / 2 : hp.z;
    m.userData.headFit = { hp: hp.y, skull, hair, hw, hd, n: band.length, cz: cz - hp.z };
    // the cap, shrunk onto the head: a dome whose every point is set just over the head and the hair under it (measured from their
    // points, in its direction), tipped as a cap sits: its front up on the brow, its back down to the nape; a brim, the strap's arch
    // at the back, a button on top; and the hair out from under it, longer, round the back and over the ears
    const red = toon('#b3372c'), redD = toon('#9e3127'), seamM = toon('#8a2a22'), C = new V3(cx, skull - .072, cz), cap = new THREE.Group(); cap.position.copy(C); cap.rotation.x = -.24; cap.updateMatrixWorld(true);
    const near = [...pts, ...hpts].map(p => p.clone().sub(C)).filter(p => p.length() > .03), uw = new V3();
    const reach = u => { uw.copy(u).applyQuaternion(cap.quaternion); let r = 0; for (const p of near) { const d = p.length(), c = p.dot(uw) / d; if (c > .955 && d * c > r) r = d * c; } return r || Math.hypot(hw * u.x, hd * u.z, .1 * u.y); };
    const dg = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), dp = dg.attributes.position, u = new V3();
    const topR = reach(new V3(0, 1, 0)), ea = hw + .03, eb = topR + .006, ec = hd + .036, SQ = 2.6, ell = u => 1 / Math.pow(Math.abs(u.x / ea) ** SQ + Math.abs(u.y / eb) ** SQ + Math.abs(u.z / ec) ** SQ, 1 / SQ);   // (a squarish ellipse: full shoulders, a flatter top)
    const shell = u => Math.max(reach(u) + .008, (reach(u) + .01) * .35 + ell(u) * .65);   // (snug on the head, full and round as a crown is)
    for (let k = 0; k < dp.count; k++) { u.fromBufferAttribute(dp, k).normalize(); const r = shell(u); dp.setXYZ(k, u.x * r, u.y * r, u.z * r); }
    dg.computeVertexNormals(); cap.add(new THREE.Mesh(dg, red));
    const rimAt = th => shell(u.set(Math.sin(th), .03, Math.cos(th)).normalize());   // (how far out its edge is, round it: th 0 the front)
    // its six panels' seams, from the edge up to the button; the sweatband's darker edge round the bottom; little eyelets near the top
    const onShell = (th, el, out = .0015) => { const v = new V3(Math.sin(th) * Math.cos(el), Math.sin(el), Math.cos(th) * Math.cos(el)); return v.multiplyScalar(shell(v) + out); };
    for (let k = 0; k < 6; k++) { const th = k * Math.PI / 3 + Math.PI / 6, pts = []; for (let e = 0; e <= 10; e++) pts.push(onShell(th, .05 + e / 10 * (Math.PI / 2 - .08)));
      cap.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .0018, 3, false), seamM)); }
    { const pts = []; for (let k = 0; k <= 32; k++) pts.push(onShell(k / 32 * Math.PI * 2, .02, .002)); cap.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, .0045, 4, true), redD)); }
    for (let k = 0; k < 6; k++) { const ey = new THREE.Mesh(new THREE.SphereGeometry(.0042, 5, 3), toon('#5e1c17')); ey.position.copy(onShell(k * Math.PI / 3 + Math.PI / 3, 1.05, .001)); cap.add(ey); }
    { const rf = rimAt(0), w = Math.min(hw * .95, .095), brim = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .01, 18, 1, false, -Math.PI / 2, Math.PI), red); brim.scale.set(w, 1, .085); brim.position.set(0, .004, rf - .012); brim.rotation.x = .3; cap.add(brim);
      const under = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .003, 18, 1, false, -Math.PI / 2, Math.PI), toon('#4a3a2c')); under.scale.set(w * .97, 1, .082); under.position.set(0, -.003, rf - .012); under.rotation.x = .3; cap.add(under); }
    { const top = reach(u.set(0, 1, 0)) + .01, button = new THREE.Mesh(new THREE.SphereGeometry(.01, 6, 4), redD); button.position.y = top; cap.add(button); }
    { const rb = rimAt(Math.PI), hole = new THREE.Mesh(new THREE.CircleGeometry(.036, 14, 0, Math.PI), toon('#2e2016')); hole.position.set(0, .004, -rb - .002); hole.rotation.y = Math.PI; hole.scale.y = 1.15; cap.add(hole);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(.036, .003, 4, 14, Math.PI), redD); edge.position.set(0, .004, -rb - .0025); edge.rotation.y = Math.PI; edge.scale.y = 1.15; cap.add(edge);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(.074, .013, .006), redD); strap.position.set(0, .011, -rb - .004); cap.add(strap);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(.03, .011, .005), red); tail.position.set(-.03, .013, -rb - .007); tail.rotation.z = -.15; cap.add(tail);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(.013, .017, .009), toon('#d8d6cf')); buckle.position.set(.022, .011, -rb - .006); cap.add(buckle); }
    // the hair from under it, one piece: a skirt round the back and the sides that lies on the head, narrowing a little to the nape,
    // its edge wavy in clumps (longer at the back, short over the ears so they show, the ends just turned out behind the ears), strands
    // in light and dark down it
    { // (clumps of uneven width and length, each coming to a point, coloured each its own; two layers, the outer shorter and a little out)
      const A0 = Math.PI * .34, A1 = Math.PI * 1.66, dark = new THREE.Color('#3a2618'), mid = new THREE.Color('#4b3221'), lite = new THREE.Color('#6a4a30'), cc = new THREE.Color();
      let seed = 7; const rr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const skirt = (NA, NR, out, lenK, cols) => { const pos = [], col = [], idx = []; let cl = 0, cw = 0, cpeak = 0, ccol = mid, cdr = 0;
        for (let i = 0; i <= NA; i++) { if (cl <= 0) { cw = 2 + Math.floor(rr() * 4); cl = cw; cpeak = .004 + rr() * .02; ccol = cols[Math.floor(rr() * cols.length)]; cdr = (rr() - .5) * .004; }
          const u = 1 - Math.abs((cw - cl + .5) / cw * 2 - 1); cl--;   // (where in its clump: 1 at its middle, 0 at its edges)
          const th = A0 + (A1 - A0) * i / NA, c = Math.cos(th), ear = Math.max(0, 1 - Math.abs(c) / .32), flick = Math.max(0, 1 - Math.abs(c + .45) / .2), back = Math.max(0, -c - .3);
          const Lh = ((.034 + back * .042 + flick * .012) * (1 - ear * .62) + cpeak * u * (1 - ear * .4)) * lenK, R0 = rimAt(th) - .003 + out + cdr;
          for (let j = 0; j <= NR; j++) { const t = j / NR, y = -Lh * t - .001, r = R0 * (1 - .06 * t * (.6 + back)) + flick * .012 * Math.max(0, t - .5) ** 2 * 4 + .002 * t;
            pos.push(Math.sin(th) * r, y + flick * .006 * Math.max(0, t - .6) * 2.5, c * r); cc.copy(ccol).lerp(dark, t * .4 + (1 - u) * .15); col.push(cc.r, cc.g, cc.b); } }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const a0 = i * (NR + 1) + j, b0 = a0 + NR + 1; idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
        cap.add(new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }))); };
      skirt(64, 4, -.002, .72, [dark, dark, mid]);   // (a short dark mass under: no scalp between the strands)
      // the strands: narrow, tapering, each bent to lie on the head and out at its end, in browns of their own; over the ears short and
      // turned up; each on its own root, so they sway (see hair below)
      const shades = ['#3a2618', '#4b3221', '#4b3221', '#5a3c26', '#6a4a30'].map(c => toon(c, { side: THREE.DoubleSide })), strands = [];
      const strandG = (w, Ls, bend, flip) => { const g = new THREE.BufferGeometry(), N = 5, pos = [], idx = [];
        for (let j = 0; j <= N; j++) { const t = j / N, hw = w / 2 * (1 - t * .85), z = -.003 * t + bend * t * t * t * Ls, y = -Ls * t + (flip ? Math.max(0, t - .5) ** 2 * Ls * 1.5 : 0), tw = (t - .5) * .004;
          pos.push(-hw, y, z + tw, hw, y, z - tw); if (j) { const a = (j - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      for (let k = 0; k < 130; k++) { const th = A0 + (A1 - A0) * rr(), c = Math.cos(th), ear = Math.abs(c) < .3, back = Math.max(0, -c - .3), flick = Math.max(0, 1 - Math.abs(c + .45) / .2);
        const Ls = ear ? .02 + rr() * .018 : .032 + back * .045 + flick * .014 + rr() * .022, w = .01 + rr() * .009, r = rimAt(th) - .004 + rr() * .003;
        const piv = new THREE.Group(); piv.position.set(Math.sin(th) * r, -.002 - rr() * .006, c * r); piv.rotation.set(0, th + (rr() - .5) * .25, 0); cap.add(piv);
        const sm = new THREE.Mesh(strandG(w, Ls, ear ? .7 : .18 + flick * .4 + rr() * .2, ear), shades[Math.floor(rr() * shades.length)]); sm.rotation.x = -.05 - rr() * .12 + (ear ? -.2 : 0); sm.rotation.z = (rr() - .5) * .14; piv.add(sm);
        strands.push({ m: sm, rx: sm.rotation.x, rz: sm.rotation.z, ph: rr() * 6.28, k: .5 + rr() * .8, len: Ls }); }
      // the hair moving: a breath of sway always, more at speed (the wind of the ride pushing it back), a toss when the head jerks
      let hp0 = null, hv = 0, tm = 0; const _hw = new V3();
      m.userData.hair = (dt, speed = 0) => { tm += dt; cap.getWorldPosition(_hw); if (hp0) { const v = _hw.distanceTo(hp0) / Math.max(dt, 1e-3); hv += (Math.min(12, v) - hv) * Math.min(1, dt * 6); } hp0 = (hp0 || new V3()).copy(_hw);
        const wind = Math.min(1, Math.max(speed, hv) / 9);
        for (const S of strands) { const sw = Math.sin(tm * (2.2 + wind * 6) * S.k + S.ph); S.m.rotation.x = S.rx - wind * .1 * S.k + sw * (.025 + wind * .05); S.m.rotation.z = S.rz + Math.sin(tm * 1.7 * S.k + S.ph * 1.3) * (.025 + wind * .04); } };
      // over each ear a few small locks curling out from under the edge: lying close, their tips turned up
      const lock = (w, L) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.quadraticCurveTo(-w * .6, -L * .6, 0, -L); sh.quadraticCurveTo(w * .6, -L * .6, w / 2, 0); sh.lineTo(-w / 2, 0);
        const lg = new THREE.ShapeGeometry(sh, 5), q = lg.attributes.position; for (let k = 0; k < q.count; k++) { const t = -q.getY(k) / L; q.setZ(k, t * t * L * .9); q.setY(k, q.getY(k) + Math.max(0, t - .5) ** 2 * L * 1.6); } lg.computeVertexNormals(); return lg; };
      const lm = [toon('#4b3221', { side: THREE.DoubleSide }), toon('#6a4a30', { side: THREE.DoubleSide }), toon('#3a2618', { side: THREE.DoubleSide })];
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const th = sd * Math.PI * (.42 + k * .05), r = rimAt(th) - .002, m2 = new THREE.Mesh(lock(.026 + (k % 2) * .006, .028 + (k % 3) * .006), lm[(k + (sd > 0 ? 1 : 0)) % 3]);
        m2.position.set(Math.sin(th) * r, -.004, Math.cos(th) * r); m2.rotation.set(0, th, 0); m2.rotateZ(sd * (.25 + k * .08)); cap.add(m2); } }
    m.add(cap); H.attach(cap); cap.traverse(o => { if (o.isMesh) o.castShadow = true; }); m.userData.cap = cap;
    // the satchel: low across his back, a touch right of his spine, close in; hung from a pivot at its top (it swings a little as he
    // walks, see update); its strap lies on him: from the bag's end up across his back to his right shoulder, over it, down across his
    // chest to his left hip, round his side back to the bag (the body's surface found from its vertices, in the rest pose)
    const pv = bones.pelvis.getWorldPosition(new V3()), sh = bones.upperarm_r.getWorldPosition(new V3()), sp3 = bones.spine_03.getWorldPosition(new V3()), satchel = makeBag({ THREE, toon }), bag = satchel.group;   // (the game's one bag: bag.js)
    m.userData.bagFill = satchel.setFill; const BH = satchel.size.H;
    const at = new V3(pv.x + .01, pv.y + .1, pv.z - .135), pivot = new THREE.Group(); pivot.position.set(at.x, at.y + BH / 2, at.z); m.add(pivot); bones.pelvis.attach(pivot);
    bag.rotation.set(0, -Math.PI / 2, -.08); bag.position.set(0, -BH / 2, 0); pivot.add(bag); m.userData.bagPivot = pivot; m.userData.bagQ0 = pivot.quaternion.clone();   // (its length across his back, its outer face out behind)
    const cloud = []; m.traverse(o => { if (!o.isMesh || /short|hair|bob|long|ponytail|afro|braid|eye|brow|lash/i.test(o.name)) return; const pos = o.geometry.attributes.position;
      for (let k = 0; k < pos.count; k += 2) { v.fromBufferAttribute(pos, k).applyMatrix4(o.matrixWorld); if (v.y > pv.y - .1 && v.y < sh.y + .2) cloud.push(v.x, v.y, v.z); } });
    const axis = y => { const t = THREE.MathUtils.clamp((y - pv.y) / Math.max(.01, sp3.y - pv.y), 0, 1.4); return [pv.x + (sp3.x - pv.x) * t, pv.z + (sp3.z - pv.z) * t]; };
    const out = (y, th) => { const [ax, az] = axis(y); let best = .09; for (let k = 0; k < cloud.length; k += 3) { const dy = cloud[k + 1] - y; if (dy > .03 || dy < -.03) continue;
      const dx = cloud[k] - ax, dz = cloud[k + 2] - az, r = Math.hypot(dx, dz); if (r > .3) continue; const a = Math.atan2(dz, dx); if (Math.abs(Math.atan2(Math.sin(a - th), Math.cos(a - th))) < .2 && r > best) best = r; } return best; };
    const onBody = (y, th, lift = .014) => { const [ax, az] = axis(y), r = out(y, th) + lift; return new V3(ax + Math.cos(th) * r, y, az + Math.sin(th) * r); };
    const D = Math.PI / 180, lerp = (a, b, t) => a + (b - a) * t, route = [new V3(at.x + .18, at.y + .12, at.z + .02)];
    for (let k = 1; k <= 8; k++) { const t = k / 8; route.push(onBody(lerp(at.y + .15, sh.y + .02, t), lerp(-62, -172, t) * D)); }        // up across his back
    route.push(onBody(sh.y + .07, 180 * D, .022));                                                                                        // over his shoulder
    for (let k = 0; k <= 8; k++) { const t = k / 8; route.push(onBody(lerp(sh.y + .02, pv.y + .15, t), lerp(172, 48, t) * D)); }          // down across his chest
    for (const a of [22, -5, -32]) route.push(onBody(pv.y + .14, a * D));                                                                  // round his left side
    route.push(new V3(at.x + .19, at.y + .1, at.z + .04));
    const strapM = toon('#4d5530'), pos = [], idx = [], W2 = .026;
    for (let k = 0; k < route.length; k++) { const p0 = route[Math.max(0, k - 1)], p1 = route[Math.min(route.length - 1, k + 1)], tg = p1.clone().sub(p0).normalize(), [ax, az] = axis(route[k].y), nrm = new V3(route[k].x - ax, 0, route[k].z - az).normalize(), sd = new V3().crossVectors(tg, nrm).normalize();
      pos.push(route[k].x + sd.x * W2, route[k].y + sd.y * W2, route[k].z + sd.z * W2, route[k].x - sd.x * W2, route[k].y - sd.y * W2, route[k].z - sd.z * W2); if (k) { const q = k * 2; idx.push(q - 2, q - 1, q, q - 1, q + 1, q); } }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
    const strap = new THREE.Mesh(sg, strapM.clone()); strap.material.side = THREE.DoubleSide; strap.castShadow = true; m.add(strap); bones.spine_03.attach(strap);
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
    P.mixer.update(dt); P.m.userData.hair?.(dt, Math.abs(P.speed || 0)); P.m.updateMatrixWorld(true);
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
  function place(f) { const q = track.probe(f.x, f.z, f.hint); f.hint = q.i; const gy = Math.max(q.y, track.floorAt?.(f.x, f.z) ?? -Infinity);   // (a porch, a step: stood on, not sunk into)
    if (f.air) { if (f.y <= gy) { f.y = gy; f.air = false; f.vy = 0; } } else { f.y += (gy - f.y) * .5; if (Math.abs(gy - f.y) > .5) f.y = gy; } f.P.G.position.set(f.x, f.y, f.z); f.P.G.rotation.y = f.yaw; f.mouth.set(f.x, f.y + f.P.height + .22, f.z); }
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
    if (inp.dodge && !f.dodge && !f.move && f.st >= 14 && f.stagger <= 0) { const fwd = inp.fwd || 0, sd = inp.side || 0, n = Math.hypot(fwd, sd); f.dodge = { t: 0, f: n ? fwd / n : -1, s: n ? sd / n : 0 }; f.st -= 14;
      f.dodgedId = o.wind || (o.move && !o.move.done) ? o.atkId : -1; }   // (a dodge in his wind-up or his punch: that one misses)
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
    if (inp.atk && !f.ai && f.st < 8 && !f.move) { if (!(f.puffT > 0)) { f.puffT = 1; fx.pop(head(f), 'ZADYSZKA', '#cf5a3e'); } inp = { ...inp, atk: null }; }   // (out of breath: no punch till you get some back)
    f.puffT = Math.max(0, (f.puffT || 0) - dt);
    if (inp.atk && f.stagger <= 0 && !f.dodge && !(f.recover > 0)) { if (!f.move && !f.wind) { if (f.ai) { f.atkId = (f.atkId || 0) + 1; const K = f.kind || KINDS.kozak, tr = fightNow && fightNow.train; f.wind = { k: inp.atk, t: 0, dur: (inp.quick ? .4 : K.wind) * (tr ? 1.5 : 1), feint: !tr && Math.random() < K.feint }; } else { f.atkId = (f.atkId || 0) + 1; begin(f, inp.atk); } } else if (f.move && f.move.t > f.move.dur * .45) f.buf = inp.atk; }
    if (f.wind) { f.wind.t += dt; const W = f.wind;
      if (f.stagger > 0 && !(f.kind && f.kind.armor)) f.wind = null;
      else if (W.feint && W.t > W.dur * .7) { f.wind = null; fx.pop(head(f), '?', '#d3d0c3'); if (f.ai) { f.ai.plan = 'circle'; f.ai.t = .35; } }   // (a feint: he lets it go)
      else if (W.t >= W.dur) { const k = W.k; f.wind = null; begin(f, k); } }
    f.recover = Math.max(0, (f.recover || 0) - dt); f.poiseT = Math.max(0, (f.poiseT || 0) - dt);
    if (inp.taunt && !f.move && !f.guard && f.tauntT <= 0) { f.tauntT = 2.2; shot(f.P, 'no', 1.4); f.st = Math.min(100, f.st + 25); say(f, pick(SAY.taunt)); }
    if (f.move) { const M = f.move; M.t += dt;
      if (!M.done && M.t >= M.dur * M.imp) { M.done = true; land(f, o, M); }
      if (M.t >= M.dur) { f.move = null; if (f.buf) { const b = f.buf; f.buf = null; begin(f, b); }
        else if (f.ai) { const K = f.kind || KINDS.kozak, tr = fightNow && fightNow.train; if (!tr && f.ai.next) { f.ai.pend = f.ai.next; f.ai.next = null; } else f.recover = K.recover * (tr ? 1.5 : 1); } } }   // (the computer's: a second straight after, or it stands open)
    animate(f.P, dt, f.vf || f.vs ? Math.hypot(f.vf, f.vs) * Math.sign(f.vf || 1) : 0, 'fight');
    // leaning into it: forward in a punch, back when hit, into the way he steps
    const b = f.P.body; b.rotation.x += ((f.move ? .12 : f.wind ? -.22 : f.recover > 0 ? .1 : 0) + f.vf * .03 - (f.stagger > 0 ? .15 : 0) - b.rotation.x) * Math.min(1, dt * 10); b.rotation.z += (-f.vs * .05 - b.rotation.z) * Math.min(1, dt * 8);
    b.position.y += ((f.move && f.move.dip ? -.12 : f.guard && f.low ? -.06 : 0) - b.position.y) * Math.min(1, dt * 12);
    arms(f.P, f, dt); place(f);
  }
  function begin(f, k) {
    const M = MOVES[k]; if (!M) return; const tired = f.st < 18;
    f.chain = f.chainT < .5 ? [...f.chain, k].slice(-3) : [k]; f.chainT = 0;
    const combo = f.chain.join() === 'jab,jab,cross' ? 'SERIA' : f.chain.slice(-2).join() === 'jab,cross' ? 'RAZ-DWA' : null;
    f.move = { k, ...M, t: 0, dur: M.dur * (tired ? 1.35 : 1) * (f.ai ? 1.3 : 1), imp: IMPACT[M.clip] || .45, done: false, combo, mul: (combo === 'SERIA' ? 1.5 : combo ? 1.3 : 1) * (tired ? .55 : 1) * (f.counterT > 0 ? 1.5 : 1) * (f.ai ? AI_DMG * (f.kind ? f.kind.dmg : 1) * (fightNow && fightNow.train ? 0 : 1) : 1), counter: f.counterT > 0 };
    f.counterT = 0; f.st = Math.max(0, f.st - M.st); shot(f.P, M.clip, f.move.dur);
  }
  const head = f => f.P.bones.head.getWorldPosition(new V3()).add(new V3(0, .32, 0));
  const chest = f => f.P.bones.spine_03.getWorldPosition(new V3());
  function land(f, o, M) {
    const d = dist(f, o); if (d > M.reach || facing(f, o) < .6 || o.ko) return;   // (a miss: out of reach, or not at him)
    if (o.dodge || o.dodgedId === f.atkId) { o.dodgedId = -1; fx.pop(head(o), 'UNIK!', '#9ccad8'); if (f.ai) { f.recover = Math.max(f.recover || 0, .85); trainCount(1); } return; }   // (dodged: he is left open)
    const at = M.zone === 'high' ? o.P.bones.head.getWorldPosition(new V3()) : chest(o), covered = o.guard && (M.zone === 'low') === o.low, wrong = o.guard && !covered;
    if (covered) {
      if (o.parryT < PARRY) { if (f.ai) trainCount(0); f.stagger = .75; f.move = null; f.buf = null; o.counterT = 1.1; fx.pop(at.clone().add(new V3(0, .3, 0)), 'KONTRA!', '#efc970'); shot(f.P, 'hithead', .5, { from: .1 }); fx.shake(.18); return; }   // (a parry)
      if (o.ai) o.ai.riposte = true; o.hp -= M.dmg * .12; o.st -= M.dmg * 1.4; f.st = Math.max(0, f.st - 6); if (!f.ai) f.stagger = Math.max(f.stagger, .14);   // (off his guard: it costs, it sets you back a touch)
      fx.pop(at, 'BLOK', '#d3d0c3'); fx.impact(at, null); fx.shake(.06);
      if (o.st <= 0) { o.st = 0; o.guard = false; o.stagger = .9; fx.pop(at.clone().add(new V3(0, .3, 0)), 'GARDA PĘKŁA!', '#cf5a3e'); shot(o.P, 'hitchest', .6); }
      if (Math.random() < .25) say(o, pick(SAY.blocked)); return;
    }
    const open = o.recover > 0 || o.stagger > .3, dmg = M.dmg * M.mul * (wrong ? .5 : 1) * (!f.ai ? (open ? 1.4 : .8) : 1); o.hp -= dmg; if (o.ai) o.ai.hits = (o.ai.hits || 0) + 1;
    if (wrong) fx.pop(at.clone().add(new V3(0, .3, 0)), 'ZŁA GARDA', '#cf5a3e'); if (open && !f.ai) { fx.pop(at.clone().add(new V3(0, .45, 0)), 'W ODSŁONĘ!', '#efc970'); trainCount(2); } if (!(M.k === 'jab' && o.wind)) { o.move = null; o.buf = null; }
    const heavy = M.heavy || dmg >= 16, fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    fx.impact(at, heavy ? 'BUM!' : M.zone === 'low' ? 'PAC!' : 'ŁUP!'); fx.shake(heavy ? .32 : .16); if (heavy) fx.slow(.08);
    if (M.combo || M.counter) fx.pop(at.clone().add(new V3(0, .35, 0)), M.counter ? 'KONTRA!' : M.combo + '!', '#efc970');
    if (fightNow && fightNow.train && o.ai) o.hp = Math.max(o.hp, o.max * .5);
    if (o.hp <= 0) { o.hp = 0; o.ko = true; o.koT = 0; o.guard = false; shot(o.P, 'death', 1.6, { clamp: true }); fx.slow(.5); fx.shake(.4); return; }
    if (heavy) { o.stagger = .55; o.x += fw.x * .55; o.z += fw.z * .55; shot(o.P, 'knock', .8); }
    else if (M.k === 'jab' && o.wind) { o.x += fw.x * .06; o.z += fw.z * .06; }   // (a jab into his wind-up: it stings, it does not stop him)
    else if (o.ai && o.poiseT > 0) { o.x += fw.x * .05; o.z += fw.z * .05; }   // (just reeled: this one does not stop him)
    else { o.stagger = .22; o.poiseT = .8; o.x += fw.x * .12; o.z += fw.z * .12; shot(o.P, M.zone === 'high' ? 'hithead' : 'hitchest', .45); }
    if (Math.random() < .3) { if (o === me) say(f, pick(SAY.hitHim)); else say(o, pick(SAY.hitMe)); }
  }

  // ---------- the computer's fighter: keeps its distance, circles, jabs and follows up, guards (not always the right way), backs off hurt ----------
  function ai(f, o, dt) {
    const A = f.ai || (f.ai = { think: 0, plan: 'close', strafe: 1, seen: null, guardT: 0, low: false, spam: 0, combo: null }), d = dist(f, o), inp = { fwd: 0, side: 0 };
    A.guardT -= dt; A.hits = Math.max(0, (A.hits || 0) - dt * .9);
    if (A.hits >= 2 && !f.wind && !f.move && !(f.recover > 0)) { A.hits = 0; A.guardT = .9; A.low = Math.random() < .3; A.plan = 'back'; A.t = 0; }   // (rained on: he covers up and backs off)
    // can not get to you (a fence, a hedge between): round it; still not, through it
    if (d > 1.45) { A.best = Math.min(A.best ?? d, d); if (d > A.best - .05) A.stuck = (A.stuck || 0) + dt; else { A.stuck = 0; A.best = d; } } else { A.stuck = 0; A.best = d; f.ghost = false; }
    if (A.stuck > 1.2 && A.stuck < 1.25) A.strafe = -A.strafe; if (A.stuck > 3) f.ghost = true;
    const K = f.kind || KINDS.kozak, tr = fightNow && fightNow.train; A.t = (A.t ?? 1) - dt;
    if (A.stuck > 1 && A.stuck < 3) { inp.side = A.strafe; inp.fwd = 1; return inp; }
    if (f.recover > 0) { inp.fwd = -.25; return inp; }                                   // (open: no guard, a little back)
    if (!tr && (f.counterT > 0 || A.riposte) && !f.move && !f.wind && d < 1.45) { inp.atk = f.counterT > 0 ? 'cross' : 'jab'; inp.quick = true; A.riposte = false; return inp; }   // (after a parry or a block: straight back at you)
    if (!tr && o.st < 15 && !f.move && !f.wind && d < 1.45 && Math.random() < dt * 4) { inp.atk = Math.random() < .5 ? 'cross' : 'hook'; inp.quick = true; return inp; }   // (you are out of breath: he goes in)
    if (A.pend && !f.move && !f.wind) { inp.atk = A.pend; inp.quick = true; A.pend = null; return inp; }   // (a second one, a short wind-up)
    if (f.wind || f.move) return inp;
    // yours coming: now and then a guard (the right height mostly)
    if (!tr && o.move && A.seen !== o.move) { A.seen = o.move; if (Math.random() < K.guard) { A.guardT = .45; A.low = Math.random() < .78 ? o.move.zone === 'low' : o.move.zone !== 'low'; } }
    if (A.guardT > 0) { inp.guard = true; inp.low = A.low; }
    if (A.plan === 'circle') { inp.side = A.strafe * (tr ? .5 : 1); inp.fwd = d > 1.5 ? .6 : d < 1.1 ? -.6 : 0; if (A.t <= 0) A.plan = f.hp < f.max * .3 && Math.random() < .3 ? 'back' : 'attack'; }
    else if (A.plan === 'close') { inp.fwd = d > 1.3 ? 1 : 0; if (d <= 1.4) { A.plan = 'circle'; A.t = tr ? 1 : .5; } }
    else if (A.plan === 'back') { inp.fwd = -1; inp.side = A.strafe * .5; if (A.t <= -1.2) { A.plan = 'circle'; A.t = .8; } }
    else if (A.plan === 'attack') { if (d > 1.34) inp.fwd = 1;
      else { const r = Math.random(); inp.atk = tr ? (r < .6 ? 'jab' : 'cross') : r < .42 ? 'jab' : r < .72 ? 'cross' : r < .87 ? 'hook' : 'bodyR'; A.next = !tr && Math.random() < K.combo ? (inp.atk === 'jab' ? 'cross' : 'jab') : null;
        A.plan = 'circle'; A.t = (tr ? 1.4 : .8) + Math.random() * (tr ? .6 : 1.1); if (Math.random() < .35) A.strafe = -A.strafe; } }
    if (!tr && !inp.guard && A.plan === 'circle' && Math.random() < dt * .15 && f.tauntT <= 0 && d > 1.4) inp.taunt = true;
    return inp;
  }

  // ---------- the state: him on foot, the ones with a grudge, the fight ----------
  const _bq = new THREE.Quaternion(), _be = new THREE.Euler();   // (the bag's swing)
  let ready = false, me = null, foe = null, active = false, view = 'third', fightNow = null, grudges = [], pitch = 0, camYaw = null;   // (camYaw: on a phone the camera goes round him on its own)
  const mAim = { x: 0, y: 0, dir: 'right' };                              // (the mouse's side for the next punch; it stays where last pointed)
  const ATK = { left: 'jab', right: 'cross', up: 'hook' };
  const SIDE = { jab: 'right', cross: 'left', hook: 'up', bodyL: 'down', bodyR: 'down' };   // (his punch, as it comes at you: his left from your right)
  const brawlers = [];
  Promise.all(['boy', 'brawler'].map(k => new Promise(ok => loader.load(`assets/export/${k}.glb`, g => { src[k] = g; ok(); }, undefined, () => ok())))).then(() => {
    if (!src.boy || !src.brawler) return;
    me = fighter(person('boy', kit), 'TY'); me.P.G.visible = false;
    for (let k = 0; k < 2; k++) { const f = fighter(person('brawler'), 'ROWERZYSTA'); f.P.G.visible = false; brawlers.push(f); }
    measure(me.P); riderP = person('boy', kit); ready = true;
  });
  // (the same boy, a second of him, for the bike: rider.js poses his bones from its own figure, so on the bike he is who walks)
  let riderP = null;
  function measure(P) {                                               // when, in each punch clip, the fist is out furthest
    P.G.position.set(0, 0, 0); P.G.rotation.set(0, 0, 0); P.G.updateMatrixWorld(true);
    for (const n of ['jab', 'cross', 'hook']) { const a = P.A[n]; if (!a) continue; P.mixer.stopAllAction(); a.reset().play(); let best = -9, bt = .45;
      for (let k = 2; k <= 22; k++) { a.time = P.clips[n].duration * k / 24; P.mixer.update(0); P.m.updateMatrixWorld(true); const pz = P.bones.pelvis.getWorldPosition(new V3()).z;
        for (const s of ['l', 'r']) { const r = P.bones['hand_' + s].getWorldPosition(new V3()).z - pz; if (r > best) { best = r; bt = k / 24; } } }
      IMPACT[n] = bt; a.stop(); }
    P.mixer.stopAllAction(); for (const n of ['idle', 'walk', 'jog', 'stance']) if (P.A[n]) { P.A[n].play(); P.A[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
  }

  function start(at) { if (!ready) return false; active = true; camYaw = null; pitch = 0; Object.assign(me, { x: at.x, z: at.z, yaw: at.yaw, y: track.probe(at.x, at.z, at.hint ?? -1).y, hint: at.hint ?? 0, vf: 0, vs: 0, mode: 'walk', ko: false, hp: Math.max(me.hp, 60), move: null, stagger: 0, dodge: null, down: null });
    me.P.G.visible = true; place(me); if (at.getUp) { shot(me.P, 'death', .05, { clamp: true }); me.down = { t: 2.1, vx: 0, vz: 0 }; } return true; }   // (getUp: he was lying; up he gets)
  // knocked down (a car): flung along the way it went, a while on the ground, up again
  function knock(vx, vz, dmg) { if (!active || me.down) return false; me.hp = Math.max(8, me.hp - dmg); me.move = null; me.guard = false; me.down = { t: 0, vx, vz }; shot(me.P, 'death', 1.1, { clamp: true }); fx.shake(.4); fx.slow(.1); return true; }
  // a punch thrown when not fighting (at someone walking, or at the air): true if it was started
  // a blow out of a fight: one after another they make a run (fist, fist, kick, roundhouse); in the air: a flying kick. A press while one
  // is still going is kept and thrown as soon as it is over (fired(): the one thrown so, for the game to know). → the move, or false
  let fired = null;
  const busyHit = () => me.kick || (me.P.shot && ['jab', 'cross', 'hook'].includes(me.P.shot.name));
  function swing(k) { if (!active || fightNow || me.down) return false; if (busyHit()) { me.queue = k; return false; } return throwHit(k); }
  function throwHit(k) {
    const run = (me.comboT || 0) > 0 ? (me.combo || 0) + 1 : 0, mv = me.air ? 'kickJ' : CHAIN[k][run % 4]; me.combo = me.air ? me.combo || 0 : run;
    if (KICKS[mv]) me.kick = { ...KICKS[mv], name: mv, t: 0 }; else shot(me.P, mv, MOVES[mv].dur);
    me.comboT = (KICKS[mv] ? KICKS[mv].dur : MOVES[mv].dur) + .5; return mv;
  }
  // the body's lean in a kick: added after the walk has set it, taken off again before the next frame (so it never builds up)
  const lean = (P, x, z) => { P.body.rotation.x += x; P.body.rotation.z += z; P.kOff = [x, z]; };
  // the leg in a kick: chambered (the knee up), out (the foot to its mark), back; in a flying kick the other leg tucked
  function legs(P, f) {
    const K = f.kick; if (!K || !P.bones.thigh_r) return; const t = K.t / K.dur, s = K.side, o = s === 'l' ? 'r' : 'l', sd = s === 'l' ? 1 : -1;
    const fw = new V3(Math.sin(f.yaw), 0, Math.cos(f.yaw)), lf = new V3(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), hip = P.bones['thigh_' + s].getWorldPosition(new V3());
    const w = t < .12 ? t / .12 : t > .82 ? Math.max(0, (1 - t) / .18) : 1, ext = K.kind === 'fly' ? (t < .12 ? 0 : t < .3 ? (t - .12) / .18 : t < .8 ? 1 : 1 - (t - .8) / .2 * .6) : t < .3 ? 0 : t < .5 ? (t - .3) / .2 : t < .7 ? 1 : 1 - (t - .7) / .3 * .7;   // (the flying one: out at once, held through the flight)
    let T, pole;
    if (K.kind === 'front') { T = hip.clone().addScaledVector(fw, .22 + ext * .62).addScaledVector(UP, -.42 + ext * .42); pole = hip.clone().addScaledVector(fw, 1).addScaledVector(UP, .4); lean(P, -.18 * w * ext, 0); }
    else if (K.kind === 'round') { const a = (1 - ext) * 1.2, dir = fw.clone().multiplyScalar(Math.cos(a)).addScaledVector(lf, sd * Math.sin(a)); T = hip.clone().addScaledVector(dir, .3 + ext * .55).addScaledVector(UP, -.3 + ext * .45); pole = hip.clone().addScaledVector(UP, 1.2).addScaledVector(lf, sd * .4); lean(P, 0, sd * .22 * w * ext); }
    else { T = hip.clone().addScaledVector(fw, .35 + ext * .5).addScaledVector(UP, -.25 + ext * .2); pole = hip.clone().addScaledVector(fw, 1).addScaledVector(UP, .5);
      const hip2 = P.bones['thigh_' + o].getWorldPosition(new V3()); reach(P.bones['thigh_' + o], P.bones['calf_' + o], P.bones['foot_' + o], hip2.clone().addScaledVector(fw, .12).addScaledVector(UP, -.32), hip2.clone().addScaledVector(fw, 1).addScaledVector(UP, .3), w); lean(P, -.12 * w, 0); }
    reach(P.bones['thigh_' + s], P.bones['calf_' + s], P.bones['foot_' + s], T, pole, w);
  }
  // someone called for (a brother-in-law out of a house): he comes for you, fights, and goes off again
  function grudgeAt(at, line, kind = 'szwagier') { if (!ready || fightNow) return false; const f = brawlers.find(b => !b.busy); if (!f) return false; f.busy = true;
    Object.assign(f, { x: at.x, z: at.z, y: at.y, hint: -1, yaw: Math.atan2(me.x - at.x, me.z - at.z), hp: 100, st: 100, ko: false, move: null, mode: 'walk', vf: 0, vs: 0, stagger: 0, dodge: null, wind: null });
    setKind(f, kind); f.P.G.visible = true; place(f); grudges.push({ bike: null, f, t: 0, state: 'after', home: new V3(at.x, at.y, at.z) }); if (line) setTimeout(() => say(f, line), 300); return true; }
  function stop() { active = false; me.P.G.visible = false; setHead(true); camera.near = .1; camera.updateProjectionMatrix(); cam.init = false; }
  // the game from the start: every grudge dropped (the cyclists back on their bikes), no fight, him whole again
  function reset() { for (const G of grudges) { const f = G.f, b = G.bike; f.P.G.visible = false; f.busy = false; f.ko = false; f.mode = 'walk'; if (b) { b.r.boy.visible = true; b.hold = false; } }
    grudges.length = 0; fightNow = null; if (me) Object.assign(me, { mode: 'walk', hp: 100, st: 100, ko: false, down: null, move: null, guard: false }); fx.tip(null); }
  function setHead(show) { if (!me) return; me.P.bones.head.scale.setScalar(show ? me.P.headS || 1 : .001); me.P.m.userData.cap.visible = show; }
  function toggleView() { view = view === 'first' ? 'third' : 'first'; fx.flash(view === 'first' ? 'Widok: z oczu' : 'Widok: zza pleców'); }

  // a cyclist knocked off by a kick: gets up, and comes for him
  function grudge(bike) { if (!ready || fightNow || grudges.some(g => g.bike === bike)) return; const f = brawlers.find(b => !b.busy); if (!f) return;
    f.busy = true; bike.hold = true; grudges.push({ bike, f, t: 0, state: 'down' }); }
  function nearBike(p) { return active && Math.hypot(me.x - p.x, me.z - p.z) < 1.7; }

  // who wins takes something (fx.take: the game says what)
  function end(winner, loser) {
    const g = fightNow; fightNow = null; me.mode = 'walk'; fx.tip(null); winner.mode = loser.mode = 'walk'; if (g.autoView) view = 'third';
    if (loser === me) { const line = fx.take(); say(winner, line || pick(SAY.won)); g.state = 'leave'; g.wait = 3.2; }
    else { fx.drop?.({ x: loser.x, y: loser.y, z: loser.z }); fx.score(15, head(loser), 'NOKAUT! +15', '#efc970'); fx.flash('Nokaut!'); setTimeout(() => say(loser, pick(SAY.ko)), 900); g.state = 'lying'; g.wait = 4.5; }
  }

  // ---------- each frame ----------
  //   inp: { fwd, side, run, atkL, atkR, up, down, guard, dodge, taunt }   world: { rider: { x, z, v, riding } }
  function update(dt, inp, world) {
    if (!ready) return;
    // the ones with a grudge: down a moment, up (as the man in the checked shirt), after him, the fight, back to the bike
    for (let k = grudges.length - 1; k >= 0; k--) { const G = grudges[k], f = G.f, b = G.bike; G.t += dt;
      const tx = active ? me.x : world.rider.x, tz = active ? me.z : world.rider.z, d = Math.hypot(f.x - tx, f.z - tz);
      if (G.state === 'down' && G.t > 1.5) { const p = b.r.pelvisAt || b.r.root.position; Object.assign(f, { x: p.x, z: p.z, y: p.y, hint: -1, yaw: Math.atan2(tx - p.x, tz - p.z), hp: 100, st: 100, ko: false, move: null, mode: 'walk', vf: 0, vs: 0, stagger: 0 });
        setKind(f, Math.random() < .6 ? 'cherlak' : 'kozak'); b.r.boy.visible = false; f.P.G.visible = true; shot(f.P, 'getup', .9); G.state = 'after'; G.t = 0; const lines = active ? SAY.grudgeFoot : SAY.grudge; setTimeout(() => say(f, pick(lines)), 600); }
      else if (G.state === 'after') {
        if (d > 24 || G.t > 25) { say(f, pick(SAY.coward)); G.state = 'leave'; G.wait = .6; }
        else if (d < 1.9 && (active || Math.abs(world.rider.v) < 3.5)) { if (!active) world.pullOff(); fightNow = G; G.state = 'fight'; me.mode = 'fight'; f.mode = 'fight'; say(f, pick(SAY.start)); startTraining(G); fx.flash(TOUCH ? 'Bójka! LEWY / PRAWY: cios, BLOK trzymaj, gałka w bok + UNIK' : me.lockedHint ? 'Bójka! Mysz: strona ciosu, LPM cios, PPM blok, Shift unik' : 'Bójka! Kliknij: mysz (LPM cios, PPM blok) albo ← → ↑ ↓ i Spacja'); }
        else { const want = Math.atan2(tx - f.x, tz - f.z); f.yaw += Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw)) * Math.min(1, dt * 5); const v = G.t < .9 ? 0 : d > 6 ? 3.2 : 1.5;
          f.x += Math.sin(f.yaw) * v * dt; f.z += Math.cos(f.yaw) * v * dt; push(f); animate(f.P, dt, v, 'walk'); f.P.body.rotation.set(0, 0, 0); place(f); } }
      else if (G.state === 'fight') { if (!active) { G.state = 'after'; if (fightNow === G) { fightNow = null; me.mode = 'walk'; fx.tip(null); } continue; }
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
    if (god) me.hp = Math.max(me.hp, 35);
    // him: in a fight, a fighter; else walking
    if (me.down) { const D = me.down; D.t += dt; const k = Math.max(0, 1 - D.t / .6); me.x += D.vx * k * dt; me.z += D.vz * k * dt; push(me);
      if (D.t > 2.2 && !D.up) { D.up = true; shot(me.P, 'getup', 1.1); } if (D.t > 3.3) me.down = null;
      animate(me.P, dt, 0, fightNow ? 'fight' : 'walk'); arms(me.P, me, dt); place(me); return; }
    if (me.ko && !fightNow) { me.koT += dt; if (me.koT > 3.2) { me.ko = false; me.hp = 55; shot(me.P, 'getup', 1.1); } animate(me.P, dt, 0, 'fight'); arms(me.P, me, dt); place(me); return; }
    me.lockedHint = !!inp.locked;
    if (fightNow) { camYaw = null; let atk = inp.atkL ? (inp.up ? 'hook' : inp.down ? 'bodyL' : 'jab') : inp.atkR ? (inp.up ? 'hook' : inp.down ? 'bodyR' : 'cross') : null;
      if (inp.locked) { mAim.x += (inp.dx || 0) * .014; mAim.y += (inp.dy || 0) * .014; const l = Math.hypot(mAim.x, mAim.y); if (l > 1) { mAim.x /= l; mAim.y /= l; }
        if (l > .45) mAim.dir = Math.abs(mAim.x) > Math.abs(mAim.y) ? (mAim.x < 0 ? 'left' : 'right') : mAim.y < 0 ? 'up' : 'down';
        mAim.x *= 1 - Math.min(1, dt * 2.5); mAim.y *= 1 - Math.min(1, dt * 2.5);
        if (inp.lmb) atk = mAim.dir === 'down' ? (me.lastBody === 'bodyL' ? 'bodyR' : 'bodyL') : ATK[mAim.dir]; if (atk && atk.startsWith('body')) me.lastBody = atk; }
      fight(me, fightNow.f, { fwd: inp.fwd, side: inp.side, atk, guard: inp.guard || inp.rmb, low: inp.down || (inp.rmb && inp.locked && mAim.dir === 'down'), dodge: inp.dodge, taunt: inp.taunt }, dt); return; }
    me.hp = Math.min(100, me.hp + dt * 4); me.st = Math.min(100, me.st + dt * 25);
    if (inp.jump && !me.air) { me.air = true; me.vy = 4.4; if (me.P.A.jump) shot(me.P, 'jump', .9); }     // (a jump: up about a metre)
    if (me.air) { me.vy -= 9.8 * dt; me.y += me.vy * dt; }
    if ((inp.touch || inp.stick) && view !== 'first') {
      // a phone: the right finger turns the camera round him; the stick walks him the way it is pushed (as seen), he turns to it; pushed all the way: a run
      if (camYaw === null) camYaw = me.yaw; camYaw -= (inp.dx || 0) * .0075; pitch = clamp(pitch - (inp.dy || 0) * .004, -.6, .6);
      const sx = inp.side || 0, sy = inp.fwd || 0, mag = Math.min(1, Math.hypot(sx, sy)); let top = 0;
      if (mag > .05) { const cs = Math.cos(camYaw), sn = Math.sin(camYaw), want = Math.atan2(sn * sy - cs * sx, cs * sy + sn * sx), d = Math.atan2(Math.sin(want - me.yaw), Math.cos(want - me.yaw));
        me.yaw += d * Math.min(1, dt * 10); top = (mag > .92 || inp.run ? 3.6 : 1.5 * clamp(mag / .75, .35, 1)) * Math.max(.25, Math.cos(d)); }
      me.vf += (top - me.vf) * Math.min(1, dt * (top ? 5 : me.air ? 1 : 8)); me.vs = 0;
    } else {
    const top = inp.fwd > 0 ? (inp.run ? 3.6 : 1.5) : inp.fwd < 0 ? -.9 : 0; me.vf += (top - me.vf) * Math.min(1, dt * (top ? 5 : me.air ? 1 : 8));
    if (inp.locked) { me.yaw -= (inp.dx || 0) * .0026; pitch = clamp(pitch - (inp.dy || 0) * .0022, -1, .75); me.vs += ((inp.side || 0) * 1.25 - me.vs) * Math.min(1, dt * 8); }
    else { me.vs = 0; me.yaw -= (inp.side || 0) * dt * (2.6 - Math.min(1, Math.abs(me.vf) / 3.6) * .9); pitch += (0 - pitch) * Math.min(1, dt * 2); } }
    const rt = new V3(-Math.cos(me.yaw), 0, Math.sin(me.yaw)); me.x += Math.sin(me.yaw) * me.vf * dt + rt.x * me.vs * dt; me.z += Math.cos(me.yaw) * me.vf * dt + rt.z * me.vs * dt; push(me);
    { const u = me.P.m.userData; if (u.bagPivot) { const sp = Math.min(1, Math.hypot(me.vf, me.vs) / 3); me.bagT = (me.bagT || 0) + dt * (2.5 + Math.abs(me.vf) * 1.9); me.bagK = (me.bagK || 0) + (sp - (me.bagK || 0)) * Math.min(1, dt * 4);
      _bq.setFromEuler(_be.set(Math.sin(me.bagT * 2) * .03 * me.bagK + Math.max(0, me.vf) * .012, 0, Math.sin(me.bagT) * .045 * me.bagK)); u.bagPivot.quaternion.copy(u.bagQ0).multiply(_bq); } }
    if (me.P.kOff) { me.P.body.rotation.x -= me.P.kOff[0]; me.P.body.rotation.z -= me.P.kOff[1]; me.P.kOff = null; }
    me.comboT = Math.max(0, (me.comboT || 0) - dt); if (me.kick && (me.kick.t += dt) >= me.kick.dur) me.kick = null;
    if (me.queue && !busyHit()) { const q = me.queue; me.queue = null; fired = throwHit(q); }
    animate(me.P, dt, Math.abs(me.vs) > Math.abs(me.vf) ? Math.abs(me.vs) : me.vf, 'walk'); const b = me.P.body; b.rotation.x += (Math.max(0, me.vf - 2) * .05 - b.rotation.x) * Math.min(1, dt * 6); b.rotation.z += ((inp.side || 0) * me.vf * -.03 - b.rotation.z) * Math.min(1, dt * 6); b.position.y = 0;
    arms(me.P, me, dt); legs(me.P, me); place(me);
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
    const fc = !foeF && camYaw !== null ? new V3(Math.sin(camYaw), 0, Math.cos(camYaw)) : fw;   // (a phone: where the camera was turned, not where he faces)
    const lf = new V3(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), back = foeF ? 2.5 : 3.5, want = new V3(f.x, f.y + (foeF ? 1.95 : 2 - pitch * 1.3), f.z).addScaledVector(fc, -back).addScaledVector(lf, foeF ? 1.05 : 0);   // (in a fight: over his shoulder, off to the side, both in the picture)
    const look = foeF ? new V3(f.x + (foeF.x - f.x) * .62, f.y + 1.2, f.z + (foeF.z - f.z) * .62) : new V3(f.x, f.y + 1.15 + pitch * 2.4, f.z).addScaledVector(fc, 1.1);   // (him whole in the picture, a little below the middle)
    if (!cam.init) { cam.pos.copy(want); cam.look.copy(look); cam.init = true; }
    cam.pos.lerp(want, 1 - Math.exp(-dt * 6)); cam.look.lerp(look, 1 - Math.exp(-dt * 8));
    { const dx = cam.pos.x - f.x, dz = cam.pos.z - f.z, l = Math.hypot(dx, dz), mn = back * .82; if (l < mn && l > 1e-3) { cam.pos.x = f.x + dx / l * mn; cam.pos.z = f.z + dz / l * mn; } } const q = track.probe(cam.pos.x, cam.pos.z, f.hint); cam.pos.y = Math.max(cam.pos.y, q.y + .5);   // (him coming at the camera: it backs off, never in its lens; never under the ground)
    camera.position.copy(cam.pos); camera.up.set(0, 1, 0); camera.lookAt(cam.look); camera.near = .1; camera.fov += (60 - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); return f;
  }
  // what the HUD shows: the two bars in a fight; how red the edges (his health low)
  function star() { if (!fightNow) return null; const o = fightNow.f, k = o.wind ? o.wind.k : o.move && !o.move.done ? o.move.k : null;
    const green = !!(o.move && !o.move.done && o.move.dur * o.move.imp - o.move.t < PARRY);
    return { dir: mAim.dir, foe: k ? SIDE[k] : null, green, open: o.recover > 0 || o.stagger > .3, guard: me.guard, low: me.low, high: view !== 'first' }; }
  function status() { if (!me) return null; return { train: fightNow && fightNow.train ? fightNow.train.step + ':' + fightNow.train.n : null, foeState: fightNow ? (fightNow.f.wind ? 'wind' : fightNow.f.move ? 'move' : fightNow.f.recover > 0 ? 'open' : (fightNow.f.ai && fightNow.f.ai.plan)) : null, star: star(), fight: fightNow ? { a: { name: 'TY', hp: me.hp, st: me.st, guard: me.guard }, b: { name: fightNow.f.kind ? fightNow.f.kind.name : fightNow.f.name, hp: fightNow.f.hp / (fightNow.f.max || 100) * 100, st: fightNow.f.st } } : null, low: active ? clamp((40 - me.hp) / 40, 0, 1) : 0 }; }
  function setKind(f, k) { f.kind = KINDS[k]; f.max = f.kind.hp; f.hp = f.max; }
  // ---------- the training, at the first fight: a parry, a dodge, a hit when he is open; then for real ----------
  const TIPS = ['TRENING 1/3 · Bierze zamach: żółta strzałka. Gdy zrobi się ZIELONA, PPM albo Spacja: KONTRA (2x)', 'TRENING 2/3 · UNIK: gdy bierze zamach, Shift i krok w bok (A albo D) (1x)', 'TRENING 3/3 · Po jego ciosie jest ODSŁONIĘTY (środek gwiazdy świeci): wtedy LPM (2x)'];
  let trained = false; try { trained = localStorage.getItem('pt.trained') === '1'; } catch { }
  // a phone: the same, in its buttons (and no Enter to skip it)
  const TOUCH = matchMedia('(pointer: coarse)').matches || /[?&]touch/.test(location.search);
  if (TOUCH) TIPS.splice(0, 3, 'TRENING 1/3 · Bierze zamach: żółta strzałka. Gdy zrobi się ZIELONA, BLOK: KONTRA (2x)', 'TRENING 2/3 · Gdy bierze zamach: gałka w bok i UNIK (1x)', 'TRENING 3/3 · Po jego ciosie jest ODSŁONIĘTY (środek gwiazdy świeci): wtedy LEWY albo PRAWY (2x)');
  const SKIP = TOUCH ? '' : ' · ENTER: POMIŃ';
  function startTraining(G) { if (trained) return; G.train = { step: 0, n: 0 }; fx.tip(TIPS[0] + SKIP); }
  function trainCount(step) { const T = fightNow && fightNow.train; if (!T || T.step !== step) return; T.n++; if (T.n < [2, 1, 2][step]) return;
    T.step++; T.n = 0; if (T.step < 3) { fx.tip(TIPS[T.step] + SKIP); return; } endTraining(); }
  function endTraining() { const G = fightNow; if (!G || !G.train) return; G.train = null; trained = true; try { localStorage.setItem('pt.trained', '1'); } catch { } G.f.hp = G.f.max; me.hp = 100; fx.tip('DOBRA. TERAZ NA SERIO!'); setTimeout(() => fx.tip(null), 1800); }
  // the arena (the workshop's fight test): one of a chosen kind comes at him from a few metres; the training on demand; he can not
  // be beaten if asked (god); phase(): what the opponent is doing, for the test's readout
  let god = false;
  function arena(kind, o = {}) { god = !!o.god; if (o.train) trained = false; const a = me.yaw + (Math.random() - .5) * 1.2;
    return grudgeAt({ x: me.x + Math.sin(a) * 5, y: me.y, z: me.z + Math.cos(a) * 5 }, pick(SAY.start), kind); }
  function phase() { const G = fightNow; if (!G) return null; const o = G.f, K = o.kind || KINDS.kozak;
    const ph = o.ko ? 'nokaut' : o.wind ? `zamach ${o.wind.t.toFixed(2)}/${o.wind.dur.toFixed(2)} s${o.wind.feint ? ' (zwód)' : ''}` : o.move && !o.move.done ? `cios ${o.move.k}, do trafienia ${(o.move.dur * o.move.imp - o.move.t).toFixed(2)} s` : o.move ? `cios ${o.move.k} (po)` : o.recover > 0 ? `odsłonięty ${o.recover.toFixed(2)} s` : o.stagger > 0 ? `zatacza się ${o.stagger.toFixed(2)} s` : o.guard ? 'garda' : (o.ai && o.ai.plan) || '—';
    return { kind: K.name, phase: ph, hp: Math.round(o.hp), max: o.max, myHp: Math.round(me.hp), mySt: Math.round(me.st), train: G.train ? G.train.step + 1 : 0 }; }
  function bagFill(k) { me && me.P.m.userData.bagFill && me.P.m.userData.bagFill(k); }
  return { get riderPerson() { return riderP; }, KICKS, fired: () => { const f = fired; fired = null; return f; }, reset, arena, phase, get god() { return god; }, bagFill, get tempo() { const o = fightNow && fightNow.f; return o && o.move && !o.move.done && o.move.dur * o.move.imp - o.move.t < PARRY ? .55 : 1; }, skipTraining: () => endTraining(), get fit() { return me && me.P.m.userData.headFit; }, FIST, knock, swing, grudgeAt, get down() { return !!(me && me.down); }, get foe() { return fightNow ? fightNow.f : null; }, get ready() { return ready; }, get active() { return active; }, get fighting() { return !!fightNow; }, get me() { return me; }, get view() { return view; }, get chasing() { return grudges.some(g => g.state === 'after'); },
    start, stop, update, follow, grudge, nearBike, toggleView, status };
}
