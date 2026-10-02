// People out walking on the pavements: ten of them, each their own person, made in Blender from MakeHuman (MPFB) with Quaternius'
// animations retargeted onto them (assets/source/mpfb_people.py → assets/export/<key>.glb with walk and idle; their paces in people.json). Here: loaded, their materials swapped for the game's toon ones, their
// animations played at the pace they walk (so the feet do not slide), what they carry put in their hands (found by the rig's bones).
// One with the rider coming at them along the pavement steps aside onto the lawn's edge and waits; now and then one turns back.
// update(dt, R) → a person he rode into, or null; R: { x, z, v, d (his offset from the road's middle), busy }
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createPedestrians({ THREE, toon, track, seed = 21 }) {
  let a = seed; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const { S, N, ds, len } = track, MID = 5.8;                          // (the pavement's middle, off the road's)
  const T = c => toon(c), EYE = T('#17181b');
  const taper = (r0, r1, seg = 10) => { const pts = []; for (let i = 0; i <= 5; i++) { const q = -Math.PI / 2 + i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(q) * r0, Math.sin(q) * r0)); } for (let i = 0; i <= 5; i++) { const q = i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(q) * r1, 1 + Math.sin(q) * r1)); } return new THREE.LatheGeometry(pts, seg); };
  const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  const span = (o, p0, p1) => { _d.subVectors(p1, p0); const L = _d.length(); o.position.copy(p0); _q.setFromUnitVectors(_up, _d.divideScalar(L || 1)); o.quaternion.copy(_q); o.scale.set(1, L, 1); };
  const M = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; p.add(o); return o; };
  const sph = (r, m, p, sx = 1, sy = 1, sz = 1, x = 0, y = 0, z = 0) => { const o = M(new THREE.SphereGeometry(r, 12, 10), m, p); o.scale.set(sx, sy, sz); o.position.set(x, y, z); return o; };
  const bx = (w, h, d, m, p, x = 0, y = 0, z = 0) => { const o = M(new THREE.BoxGeometry(w, h, d), m, p); o.position.set(x, y, z); return o; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- the ten: who (the model), how fast, what they carry ----------
  const TYPES = [
    { key: 'oldman', v: .75, prop: 'cane' }, { key: 'jogger', v: 2.6, run: true }, { key: 'mum', v: 1, prop: 'pram' }, { key: 'dogman', v: 1.15, prop: 'dog' }, { key: 'teen', v: 1.3 },
    { key: 'suit', v: 1.45, prop: 'case' }, { key: 'shopper', v: .95, prop: 'bags' }, { key: 'kid', v: 1.1, prop: 'balloon', h: .6 }, { key: 'gardener', v: .9, prop: 'rake' }, { key: 'lady', v: 1.05, prop: 'handbag' },
  ];
  let PACE = {}; fetch('assets/export/people.json').then(r => r.json()).then(j => { PACE = j; }).catch(() => {});   // (metres a second each one's walk clip covers)

  // ---------- what they carry (built here: small, simple) ----------
  function props(P, G) {
    const pr = {};
    if (P.prop === 'cane') { pr.cane = new THREE.Group(); G.add(pr.cane); M(new THREE.CylinderGeometry(.012, .012, .86, 6), T('#5a3d27'), pr.cane).position.y = -.43; const cr = M(new THREE.TorusGeometry(.04, .012, 5, 10, Math.PI), T('#5a3d27'), pr.cane); cr.position.set(0, 0, .04); cr.rotation.y = Math.PI / 2; }
    if (P.prop === 'pram') { const g = new THREE.Group(); G.add(g); g.position.set(0, 0, .78); const pm = T('#34465a'), wh = T('#1d1e21');
      const tub = M(lathe([[0, 0], [.2, .02], [.24, .15], [.24, .28], [0, .28]]), pm, g); tub.rotation.x = Math.PI / 2; tub.scale.set(1, 1.6, 1); tub.position.set(0, .52, .05);
      const hood = M(new THREE.SphereGeometry(.26, 12, 8, 0, Math.PI, 0, Math.PI / 2), pm, g); hood.position.set(0, .6, -.12); hood.rotation.set(0, Math.PI / 2, -.5);
      for (const x of [-.2, .2]) for (const z of [-.2, .3]) { const wl = M(new THREE.TorusGeometry(.1, .025, 5, 14), wh, g); wl.rotation.y = Math.PI / 2; wl.position.set(x, .1, z); }
      for (const x of [-.2, .2]) { const f = M(taper(.012, .012, 5), T('#c9cbc8'), g); span(f, V(x, .45, -.25), V(x * .9, .95, -.5)); }
      const hb = M(new THREE.CylinderGeometry(.016, .016, .44, 6), T('#1d1e21'), g); hb.rotation.z = Math.PI / 2; hb.position.set(0, .95, -.5); }
    if (P.prop === 'dog') { const dg = new THREE.Group(); G.add(dg); const fur = T('#c98e4a'), pale = T('#e9e3d1');
      const tb = M(taper(.075, .065), fur, dg); tb.rotation.x = Math.PI / 2; tb.position.set(0, .27, -.16); tb.scale.set(1, .34, 1); sph(.08, pale, dg, .9, 1, .9, 0, .26, .17);
      const hd = new THREE.Group(); hd.position.set(0, .38, .25); dg.add(hd); sph(.065, fur, hd); sph(.035, pale, hd, 1, .8, 1.3, 0, -.02, .06); sph(.013, EYE, hd, 1, 1, 1, 0, -.01, .105);
      for (const sd of [-1, 1]) { const e = M(new THREE.ConeGeometry(.025, .06, 5), fur, hd); e.position.set(sd * .04, .05, -.01); e.rotation.z = -sd * .5; }
      const tl = M(taper(.018, .01), fur, dg); tl.position.set(0, .3, -.33); tl.rotation.x = -.7; tl.scale.y = .16;
      const legs = []; for (const [x, z] of [[-.05, .12], [.05, .12], [-.05, -.2], [.05, -.2]]) { const l = M(taper(.022, .02), fur, dg); l.scale.y = .22; legs.push({ o: l, x, z, ph: (z > 0 ? 0 : Math.PI) + (x > 0 ? 1.2 : 0) }); }
      pr.dog = { g: dg, legs, tail: tl }; pr.leash = M(taper(.004, .004, 4), T('#8e2e25'), G); }
    if (P.prop === 'case') { pr.case = new THREE.Group(); G.add(pr.case); bx(.09, .28, .38, T('#5a3d27'), pr.case, 0, -.17, 0); bx(.02, .03, .1, T('#c9a063'), pr.case, 0, -.02, 0); }
    if (P.prop === 'bags') pr.bags = [-1, 1].map(sd => { const g = new THREE.Group(); G.add(g); bx(.12, .3, .24, T(sd < 0 ? '#e9e3d1' : '#98b85a'), g, 0, -.2, 0);
      if (sd < 0) { const bg = M(new THREE.CylinderGeometry(.025, .02, .36, 8), T('#c09a6a'), g); bg.position.set(0, -.02, .05); bg.rotation.x = .25; } else for (let k = 0; k < 3; k++) sph(.04, T('#467537'), g, 1, 1.4, 1, (k - 1) * .03, -.04, (k - 1) * .05);   // a baguette; greens
      return g; });
    if (P.prop === 'balloon') { pr.balloon = new THREE.Group(); G.add(pr.balloon); sph(.14, T('#cf5a3e'), pr.balloon, 1, 1.15, 1); const kn = M(new THREE.ConeGeometry(.02, .04, 6), T('#cf5a3e'), pr.balloon); kn.position.y = -.17; kn.rotation.x = Math.PI; pr.string = M(taper(.002, .002, 3), T('#f6f3ea'), G); }
    if (P.prop === 'rake') { pr.rake = new THREE.Group(); G.add(pr.rake); M(new THREE.CylinderGeometry(.013, .013, 1.5, 6), T('#9e7a4f'), pr.rake); bx(.34, .03, .03, T('#44484c'), pr.rake, 0, -.76, 0); for (let k = 0; k < 7; k++) bx(.01, .01, .08, T('#44484c'), pr.rake, -.15 + k * .05, -.78, .04); }
    if (P.prop === 'handbag') { pr.handbag = new THREE.Group(); G.add(pr.handbag); bx(.2, .16, .08, T('#5a3d27'), pr.handbag, 0, -.12, 0); M(new THREE.TorusGeometry(.06, .008, 4, 12, Math.PI), T('#5a3d27'), pr.handbag).position.y = -.04; }
    return pr;
  }

  // ---------- the people ----------
  const G = new THREE.Group(), list = [], loader = new GLTFLoader();
  TYPES.forEach((P, k) => {
    const p = { P, G: new THREE.Group(), s: (k + rnd() * .5) / TYPES.length * len, dir: rnd() < .5 ? 1 : -1, side: rnd() < .5 ? 1 : -1, v: P.v * (.92 + rnd() * .16), off: 0, turnT: 12 + rnd() * 25, x: 0, z: 0, cool: 0, ph: 0, ready: false };
    G.add(p.G); list.push(p); p.pr = props(P, p.G);
    loader.load(`assets/export/${P.key}.glb`, gltf => {
      const m = gltf.scene; p.G.add(m);
      m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) });   // (the game's own toon; the clothes' pictures kept; hair and brows cut out)
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
      const bone = n => m.getObjectByName(n);
      p.bones = { handL: bone('hand_l'), handR: bone('hand_r'), foreL: bone('lowerarm_l'), foreR: bone('lowerarm_r') };
      p.mixer = new THREE.AnimationMixer(m); const clip = n => gltf.animations.find(c => c.name === n);
      p.acts = { walk: p.mixer.clipAction(clip('walk')), idle: p.mixer.clipAction(clip('idle')) };
      p.acts.walk.play(); p.acts.idle.play(); p.acts.idle.setEffectiveWeight(0); p.walking = true; p.ready = true;
    }, undefined, e => console.warn('pedestrian', P.key, e));
  });
  const wrap = x => ((x % len) + len) % len;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const grip = (p, hand, fore) => { hand.getWorldPosition(_a); fore.getWorldPosition(_b); _a.addScaledVector(_a.clone().sub(_b).normalize(), .06); return p.G.worldToLocal(_a.clone()); };   // (the palm: a little past the wrist)
  function update(dt, R) {
    let hit = null;
    for (const p of list) {
      const P = p.P; p.cool = Math.max(0, p.cool - dt);
      if ((p.turnT -= dt) <= 0) { if (Math.hypot(R.x - p.x, R.z - p.z) < 25) p.turnT = 3; else { p.dir = -p.dir; p.turnT = 12 + rnd() * 25; } }   // (now and then back the other way; not with him near: no turning into his way)
      // the rider coming along the pavement at them: step aside onto the lawn's edge, wait for him to pass, step back
      const dx = R.x - p.x, dz = R.z - p.z, dist = Math.hypot(dx, dz), A = S[Math.floor(wrap(p.s) / ds) % N], ahead = (dx * A.f.x + dz * A.f.z) * p.dir;
      // (him near on their line, ahead or close behind: they keep to the lawn's edge till he is by)
      const wantOff = dist < (R.bell ? 12 : 8) && ahead > -4 && Math.abs(R.d - p.side * MID) < 1.5 ? 1.1 : 0; p.off += THREE.MathUtils.clamp(wantOff - p.off, -dt * 1.5, dt * 1.5);
      p.stun = Math.max(0, (p.stun || 0) - dt); const walking = !(wantOff && p.off > .8 && !(p.flee > 0)) && !(p.stun > 0);   // (stun: kicked, stood a moment)
      if (p.fleeNew) { p.fleeNew = false; if (ahead > 0) p.dir = -p.dir; }                              // (hit: off away from him, fast)
      const pace = p.flee > 0 && !(p.stun > 0) ? (p.flee -= dt, 2.8) : 1;
      if (walking) { p.s = wrap(p.s + p.dir * p.v * pace * dt); p.ph += p.v * pace * dt * 3; }
      const f = wrap(p.s) / ds, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, t = f - Math.floor(f), P0 = S[i0], P1 = S[i1], d = p.side * (MID + p.off);
      p.x = P0.p.x + (P1.p.x - P0.p.x) * t + P0.r.x * d; p.z = P0.p.z + (P1.p.z - P0.p.z) * t + P0.r.z * d;
      const y = track.probe(p.x, p.z, i0).y; p.G.position.set(p.x, y, p.z); p.G.rotation.y = Math.atan2(P0.f.x, P0.f.z) + (p.dir < 0 ? Math.PI : 0);
      if (p.faceT > 0) { p.faceT -= dt; p.G.rotation.y = Math.atan2(R.x - p.x, R.z - p.z); }        // (spoken to, or hit: he looks at you)
      if (p.ready) {                                                     // the clips at the pace they go; stopped: into the idle
        if (walking !== p.walking) { p.walking = walking; const [from, to] = walking ? [p.acts.idle, p.acts.walk] : [p.acts.walk, p.acts.idle]; to.enabled = true; to.setEffectiveWeight(1); from.crossFadeTo(to, .35, false); }
        p.acts.walk.timeScale = p.v * (p.flee > 0 ? 2.8 : 1) / (PACE[P.key]?.walkSpeed || 1.05); p.mixer.update(dt); p.G.updateMatrixWorld(true);
        const b = p.bones, hr = grip(p, b.handR, b.foreR), hl = grip(p, b.handL, b.foreL), pr = p.pr, sw = Math.sin(p.ph);
        if (pr.cane) { pr.cane.position.copy(hr); pr.cane.rotation.x = .1 - sw * .1; }
        if (pr.case) { pr.case.position.copy(hr); pr.case.rotation.x = sw * .06; }
        if (pr.bags) { pr.bags[0].position.copy(hr); pr.bags[1].position.copy(hl); }
        if (pr.rake) { pr.rake.position.copy(hr); pr.rake.rotation.set(-2.3, 0, .25); }
        if (pr.handbag) { b.foreL.getWorldPosition(_a); pr.handbag.position.copy(p.G.worldToLocal(_a.clone())); }
        if (pr.dog) { const dg = pr.dog; dg.g.position.set(-.55, 0, .95 + Math.sin(p.ph * .5) * .05); dg.g.rotation.y = Math.sin(p.ph * .3) * .15;   // the dog: a little ahead, on the right
          for (const l of dg.legs) { const q = p.ph * 2 + l.ph; l.o.position.set(l.x, .22, l.z + Math.sin(q) * .05 * (walking ? 1 : 0)); l.o.rotation.x = Math.PI + Math.sin(q) * .5 * (walking ? 1 : 0); }
          dg.tail.rotation.z = Math.sin(p.ph * 4) * .5; span(pr.leash, hr, V(-.55, .33, 1.15)); }
        if (pr.balloon) { const top = V(hl.x + Math.sin(p.ph * .4) * .12, hl.y + .95, hl.z - .1 + Math.cos(p.ph * .3) * .08); pr.balloon.position.copy(top); span(pr.string, hl, top.clone().add(V(0, -.18, 0))); }
      }
      if (!R.busy && p.cool <= 0 && dist < .55 && Math.abs(R.v) > 1.2) { p.cool = 3; hit = p; }
    }
    return hit;
  }
  return { group: G, list, update, TYPES };
}
