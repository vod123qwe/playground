// The small things of the street, modelled here (metres, +z along the road as placed, +x across it): between the houses (a board
// fence or a wire one along the plot's side, a garden shed, a washing line with the washing on it, a stack of logs, a sandbox with
// its bucket, a bird bath), on the road and the pavement (traffic cones, bin bags, a child's wagon, road-works barriers, potholes),
// wooden ramps to ride up, bundles of papers to pick up.
// Each maker gives { group, hit }: hit is how it stops a bike, in its own space: { hx, hz, h, kind } (a box's half sizes and height;
// kind: 'hard' throws you off, 'soft' holds you up, 'hole' jolts, 'ramp' lifts, 'bundle' is picked up).

export function createProps({ THREE, toon, tex }) {
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
  const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
  const M = {
    board: toon('#8c6a44', { map: rep(tex.bark(), 3, 1) }), boardD: toon('#6b4a2e'), white: toon('#f3efe4'), wire: toon('#8d9194'), post: toon('#5a5f63'),
    shed: toon('#7a8f6a', { map: rep(tex.siding(), 2, 1.4) }), shedRoof: toon('#44484c', { map: tex.shingles() }), door: toon('#5a3a2a'),
    cone: toon('#e0703a'), coneW: toon('#f6f3ea'), bag: toon('#2b2d30'), bagHi: toon('#4a4d52'), wagon: toon('#b3372c'), wheel: toon('#26272a'),
    barrier: toon('#e8e4d6'), barRed: toon('#c9412e'), hole: toon('#1a1b1e'), holeRim: toon('#4a4d50'), sand: toon('#e3cf9a'), log: toon('#8a6038'), logEnd: toon('#c9a06a'),
    stone: toon('#9d9a92'), water: toon('#7fb6cc'), paper: toon('#ece5d0'), band: toon('#b3372c'),
    wash: ['#f6f3ea', '#a3322a', '#56789d', '#efc970', '#7fa34a'].map(c => toon(c, { side: THREE.DoubleSide })),
  };
  const R = (a, b, r) => a + (b - a) * r();
  // ---------- between the houses ----------
  function boardFence(len) { const g = new THREE.Group(); for (let z = -len / 2; z < len / 2; z += .16) g.add(box(.03, 1.5 + (Math.abs(z * 7) % 1 < .5 ? .05 : 0), .14, M.board, 0, .76, z + .08));
    for (const y of [.35, 1.2]) g.add(box(.05, .08, len, M.boardD, -.04, y, 0)); for (let z = -len / 2; z <= len / 2; z += 2.4) g.add(box(.1, 1.6, .1, M.boardD, -.06, .8, z));
    return { group: g, hit: { hx: .08, hz: len / 2, h: 1.6, kind: 'hard' } }; }
  function wireFence(len) { const g = new THREE.Group(); for (let z = -len / 2; z <= len / 2; z += 2.5) g.add(box(.06, 1.1, .06, M.post, 0, .55, z));
    for (let y = .15; y < 1.1; y += .19) g.add(box(.012, .012, len, M.wire, 0, y, 0)); for (let z = -len / 2; z < len / 2; z += .19) g.add(box(.012, 1.0, .012, M.wire, 0, .55, z));
    g.add(box(.03, .03, len, M.post, 0, 1.08, 0)); return { group: g, hit: { hx: .06, hz: len / 2, h: 1.1, kind: 'hard' } }; }
  function shed(r) { const g = new THREE.Group(), w = R(2, 2.8, r), d = R(1.8, 2.4, r); g.add(box(w, 2, d, M.shed, 0, 1, 0));
    const tri = new THREE.Shape(); tri.moveTo(-w / 2 - .2, 0); tri.lineTo(w / 2 + .2, 0); tri.lineTo(0, .9); tri.closePath();
    const rg = new THREE.ExtrudeGeometry(tri, { depth: d + .3, bevelEnabled: false }); rg.translate(0, 0, -(d + .3) / 2); const roof = new THREE.Mesh(rg, M.shedRoof); roof.position.y = 2; g.add(roof);
    g.add(box(.9, 1.7, .06, M.door, 0, .85, -d / 2 - .02)); g.add(box(.5, .4, .05, toon('#3f5566'), w * .3, 1.4, -d / 2 - .02));
    return { group: g, hit: { hx: w / 2, hz: d / 2, h: 2.9, kind: 'hard' } }; }
  function washing(r) { const g = new THREE.Group(), len = R(3, 4.5, r); for (const z of [-len / 2, len / 2]) { g.add(box(.06, 1.9, .06, M.post, 0, .95, z)); g.add(box(.5, .05, .05, M.post, 0, 1.85, z)); }
    for (let k = 0; k < 6; k++) { const z = -len / 2 + .4 + k * (len - .8) / 5, w = R(.4, .7, r), h = R(.35, .8, r), cl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.wash[r() * M.wash.length | 0]); cl.rotation.y = Math.PI / 2; cl.rotation.x = R(-.08, .08, r); cl.position.set(0, 1.83 - h / 2, z); g.add(cl); }
    g.add(box(.01, .01, len, M.white, 0, 1.84, 0)); return { group: g, hit: { hx: .1, hz: .1, h: 1.9, kind: 'hard' } }; }
  function logs() { const g = new THREE.Group(); for (let row = 0; row < 4; row++) for (let k = 0; k < 6 - row; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1.1, 8), (row + k) % 3 ? M.log : M.logEnd);
    l.rotation.x = Math.PI / 2; l.position.set(0, .13 + row * .23, -.75 + k * .27 + row * .13); g.add(l); } return { group: g, hit: { hx: .6, hz: .9, h: .9, kind: 'hard' } }; }
  function sandbox(r) { const g = new THREE.Group(); g.add(box(1.8, .08, 1.8, M.sand, 0, .12, 0)); for (const [x, z, w, d] of [[0, .9, 1.9, .12], [0, -.9, 1.9, .12], [.9, 0, .12, 1.9], [-.9, 0, .12, 1.9]]) g.add(box(w, .25, d, M.board, x, .12, z));
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .16, 10), toon('#e0503f')); b.position.set(R(-.5, .5, r), .24, R(-.5, .5, r)); g.add(b); return { group: g, hit: { hx: .95, hz: .95, h: .25, kind: 'soft' } }; }
  function birdbath() { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .14, .8, 10), M.stone); p.position.y = .4; g.add(p);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.36, .18, .12, 14), M.stone); bowl.position.y = .86; g.add(bowl); const w = new THREE.Mesh(new THREE.CircleGeometry(.3, 14).rotateX(-Math.PI / 2), M.water); w.position.y = .925; g.add(w);
    return { group: g, hit: { hx: .25, hz: .25, h: .95, kind: 'hard' } }; }
  // ---------- on the road and the pavement ----------
  function cone() { const g = new THREE.Group(); g.add(box(.36, .04, .36, M.cone, 0, .02, 0)); const c = new THREE.Mesh(new THREE.ConeGeometry(.15, .62, 14), M.cone); c.position.y = .33; g.add(c);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.093, .115, .09, 14, 1, true), M.coneW); s.position.y = .36; g.add(s); return { group: g, hit: { hx: .16, hz: .16, h: .64, kind: 'hard' } }; }
  function bags(r) { const g = new THREE.Group(); for (let k = 0; k < 2 + (r() * 2 | 0); k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(R(.28, .36, r), 1), k % 2 ? M.bag : M.bagHi); b.scale.set(1, .95, .85); b.position.set(R(-.3, .3, r), .28, R(-.3, .3, r)); g.add(b);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(.07, .14, 6), M.bag); knot.position.set(b.position.x, .6, b.position.z); g.add(knot); } return { group: g, hit: { hx: .45, hz: .45, h: .6, kind: 'soft' } }; }
  function wagon() { const g = new THREE.Group(); g.add(box(.5, .22, .9, M.wagon, 0, .3, 0)); for (const [x, z] of [[-.27, .3], [.27, .3], [-.27, -.3], [.27, -.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .05, 10), M.wheel); w.rotation.z = Math.PI / 2; w.position.set(x, .1, z); g.add(w); }
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .7, 6), M.post); h.rotation.x = 1.1; h.position.set(0, .45, .72); g.add(h); return { group: g, hit: { hx: .3, hz: .5, h: .42, kind: 'hard' } }; }
  function barrier() { const g = new THREE.Group(); for (const x of [-.9, .9]) { g.add(box(.08, 1, .5, M.post, x, .5, 0)); g.add(box(.3, .05, .6, M.post, x, .03, 0)); }
    const plank = box(2, .28, .05, M.barrier, 0, .78, 0); g.add(plank); for (let k = 0; k < 4; k++) { const s = box(.25, .28, .055, M.barRed, -.75 + k * .5, .78, 0); s.rotation.z = .6; g.add(s); }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .09, 10), new THREE.MeshBasicMaterial({ color: '#ffb347' })); lamp.position.set(.9, 1.05, 0); g.add(lamp);
    return { group: g, hit: { hx: 1, hz: .3, h: 1, kind: 'hard' } }; }
  function pothole(r) { const g = new THREE.Group(), w = R(.6, 1.1, r), d = R(.5, .9, r); const rim = new THREE.Mesh(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), M.holeRim); rim.scale.set(w * .62, 1, d * .62); rim.position.y = .006; g.add(rim);
    const h = new THREE.Mesh(new THREE.CircleGeometry(1, 9).rotateX(-Math.PI / 2), M.hole); h.scale.set(w * .5, 1, d * .5); h.position.y = .008; g.add(h); return { group: g, hit: { hx: w * .45, hz: d * .45, h: 0, kind: 'hole' } }; }
  // an open manhole: the hole in its iron ring, the lid lying by it (riding into it: over the bars; hop it)
  function manhole(r) { const g = new THREE.Group(), iron = toon('#44484c'), ring = new THREE.Mesh(new THREE.RingGeometry(.34, .44, 20).rotateX(-Math.PI / 2), iron); ring.position.y = .008; g.add(ring);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.345, 20).rotateX(-Math.PI / 2), toon('#0b0b0d')); hole.position.y = .009; g.add(hole);
    for (let k = 0; k < 3; k++) { const rung = box(.34, .02, .03, iron, 0, -.05 - k * .12, .1 - k * .1); g.add(rung); }                  // (a rung or two of its ladder showing)
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .04, 20), iron); lid.position.set(.7 + r() * .2, .05, (r() - .5) * .4); lid.rotation.set(.12, 0, -.18); g.add(lid);
    for (let k = -2; k <= 2; k++) { const l = box(.6 - Math.abs(k) * .1, .012, .03, toon('#5b5f63'), lid.position.x, .075 + k * .005, lid.position.z + k * .11); l.rotation.z = -.18; g.add(l); }   // the lid's ribs
    return { group: g, hit: { hx: .36, hz: .36, h: .05, kind: 'manhole' } }; }
  // a ramp: planks on bricks, rising along +z to its lip
  //   size: 'plank' (as it was), 'kicker' (short and steep: more lift), 'big' (a long one on a timber frame: time for a flip),
  //   'mega' (longer and twice as high, on a taller frame: a long flight, two tricks in it)
  function ramp(r, size = 'plank') { const g = new THREE.Group(), mega = size === 'mega', big = size === 'big' || mega, kick = size === 'kicker';
    const L = mega ? R(5.6, 6.2, r) : big ? R(3.6, 4, r) : kick ? R(1.1, 1.3, r) : R(1.6, 2.2, r), H = mega ? R(2, 2.2, r) : big ? R(1.1, 1.25, r) : kick ? R(.45, .55, r) : R(.4, .55, r), W = mega ? 2.6 : big ? 2 : kick ? 1 : 1.2, a = Math.atan2(H, L);
    if (big) { const deck = box(W, .06, Math.hypot(L, H), toon('#8a6a45'), 0, H / 2, 0); deck.rotation.x = -a; g.add(deck);
      for (let k = 0; k < 10; k++) { const p = box(W + .02, .062, .04, M.boardD, 0, 0, 0); const t = (k + .5) / 10; p.position.set(0, H * t + .035, -L / 2 + L * t); p.rotation.x = -a; g.add(p); }
      for (const x of [-W / 2 + .06, W / 2 - .06]) { for (const t of [.35, .7, .97]) g.add(box(.1, H * t, .1, M.boardD, x, H * t / 2, -L / 2 + L * t));   // the posts under it, and a brace along each side
        const br = box(.06, .06, Math.hypot(L, H) * .95, M.board, x, H * .3, 0); br.rotation.x = -a * .6; g.add(br); }
      const lip = box(W + .04, .05, .08, toon('#cf5a3e'), 0, H + .01, L / 2 - .04); g.add(lip);   // (its lip painted)
      if (mega) for (const x of [-W / 2 - .05, W / 2 + .05]) { const rail = box(.05, .05, Math.hypot(L, H) * .9, toon('#efc970'), x, H * .55 + .45, -L * .05); rail.rotation.x = -a; g.add(rail); for (const t of [.25, .6, .9]) g.add(box(.04, .45, .04, toon('#efc970'), x, H * t + .23, -L / 2 + L * t)); }   // (a mega: yellow rails along its sides)
      return { group: g, hit: { hx: W / 2, hz: L / 2, h: H, kind: 'ramp', size } }; }
    const deck = box(W, .05, Math.hypot(L, H), M.board, 0, H / 2, 0); deck.rotation.x = -a; g.add(deck);
    for (let k = 0; k < 6; k++) { const p = box(W + .02, .052, .03, M.boardD, 0, 0, 0); const t = (k + .5) / 6; p.position.set(0, H * t + .03, -L / 2 + L * t); p.rotation.x = -a; g.add(p); }
    for (const x of [-W * .37, W * .37]) for (let k = 0; k < 3; k++) g.add(box(.22, .1, .22, toon(kick ? '#5b5f63' : '#a3522a'), x, .05 + k * (H / 3.1), L / 2 - .15));   // the bricks (for a kicker: blocks) under its lip
    return { group: g, hit: { hx: W / 2, hz: L / 2, h: H, kind: 'ramp', size } }; }
  function bundle() { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .32, 10), M.paper); p.rotation.z = Math.PI / 2; p.position.set(0, .06 + k * .1, (k - 1) * .05); g.add(p);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.052, .052, .05, 10), M.band); b.rotation.z = Math.PI / 2; b.position.copy(p.position); g.add(b); } return { group: g, hit: { hx: .35, hz: .35, h: .3, kind: 'bundle' } }; }
  // ---------- in the front gardens ----------
  const leafM = ['#b86a2e', '#d9a441', '#cf5a3e', '#8e5a2e'].map(c => toon(c, { map: rep(tex.leaves(), 2, 2) })), metal = toon('#44484c'), red = toon('#cf5a3e'), blue = toon('#3b5670');
  function leafPile(r) { const g = new THREE.Group(), n = 2 + (r() * 3 | 0);                      // raked leaves: heaps, and the rake leant on one
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(R(.35, .6, r), 1), leafM[r() * 4 | 0]); m.scale.y = R(.3, .45, r); m.position.set(R(-.5, .5, r), .05, R(-.5, .5, r)); g.add(m); }
    if (r() < .6) { const rk = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.5, 6), toon('#9e7a4f')); h.position.y = .75; rk.add(h);
      const hd = box(.45, .03, .03, metal, 0, .02, 0); rk.add(hd); for (let t = 0; t < 9; t++) rk.add(box(.012, .012, .1, metal, -.2 + t * .05, 0, .05));
      rk.rotation.z = .5; rk.position.set(.7, 0, 0); g.add(rk); }
    return { group: g, hit: { hx: .7, hz: .7, h: .3, kind: 'soft' } }; }
  function swing(r) { const g = new THREE.Group(), frame = toon('#7b5836');                        // an A-frame and its seat on chains
    for (const x of [-1, 1]) for (const z of [-.55, .55]) { const l = box(.08, 2.3, .08, frame, x * 1.05, 1.1, z * .6); l.rotation.x = -z * .45; g.add(l); }
    g.add(box(2.3, .1, .1, frame, 0, 2.2, 0)); const pv = new THREE.Group(); pv.position.y = 2.2; g.add(pv); g.userData.pivot = pv;   // (the chains and the seat hung from the bar: they swing)
    for (const x of [-.25, .25]) pv.add(box(.015, 1.7, .015, metal, x, -.87, 0)); pv.add(box(.6, .04, .22, red, 0, -1.72, 0));
    return { group: g, hit: { hx: 1.15, hz: .5, h: 2.2, kind: 'hard' } }; }
  function kidBike(r) { const g = new THREE.Group(), fr = r() < .5 ? red : blue;                   // lying on the grass
    for (const z of [-.3, .3]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.17, .03, 6, 16), M.wheel); w.position.set(0, .04, z); w.rotation.x = Math.PI / 2; g.add(w); }
    g.add(box(.05, .04, .6, fr, 0, .08, 0)); g.add(box(.05, .04, .3, fr, .15, .08, .1)); g.add(box(.35, .03, .03, metal, .1, .09, .32)); g.add(box(.12, .03, .18, M.bag, .12, .1, -.12));
    g.rotation.y = r() * 6; return { group: g, hit: { hx: .35, hz: .4, h: .2, kind: 'soft' } }; }
  function trampoline() { const g = new THREE.Group(); const mat = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .04, 24), M.bag); mat.position.y = .72; g.add(mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, .06, 6, 28), blue); ring.rotation.x = Math.PI / 2; ring.position.y = .74; g.add(ring);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; g.add(box(.05, .72, .05, metal, Math.cos(a) * 1.5, .36, Math.sin(a) * 1.5)); }
    return { group: g, hit: { hx: 1.5, hz: 1.5, h: .8, kind: 'hard' } }; }
  function grill() { const g = new THREE.Group(); const bowl = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.bag); bowl.position.y = .85; g.add(bowl);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.bag); lid.position.y = .88; lid.rotation.x = -.9; lid.position.z = -.12; g.add(lid);
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28, l = box(.03, .8, .03, metal, Math.cos(a) * .18, .4, Math.sin(a) * .18); g.add(l); }
    return { group: g, hit: { hx: .3, hz: .3, h: 1, kind: 'hard' } }; }
  function gnome(r) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.ConeGeometry(.1, .22, 8), r() < .5 ? blue : toon('#467537')); b.position.y = .11; g.add(b);
    const f = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), toon('#f5d3ae')); f.position.y = .25; g.add(f); const bd = new THREE.Mesh(new THREE.ConeGeometry(.055, .1, 6), M.white); bd.position.set(0, .2, .03); bd.rotation.x = Math.PI; g.add(bd);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(.065, .18, 8), red); hat.position.y = .38; hat.rotation.x = -.2; g.add(hat); g.rotation.y = r() * 6; return { group: g, hit: null }; }
  function stones(r, n = 5) { const g = new THREE.Group(); for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(R(.18, .24, r), R(.2, .26, r), .04, 8), M.stone); s.position.set(R(-.12, .12, r), .03, k * .6); s.rotation.y = r() * 3; g.add(s); } return { group: g, hit: null }; }
  return { boardFence, wireFence, shed, washing, logs, sandbox, birdbath, cone, bags, wagon, barrier, pothole, manhole, ramp, bundle, leafPile, swing, kidBike, trampoline, grill, gnome, stones };
}
