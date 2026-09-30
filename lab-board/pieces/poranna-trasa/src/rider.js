// The paper boy on his bike, built here in metres: smooth tapered bodies, not boxes. The boy (a red cap with a brim, brown hair,
// a cream T-shirt with short sleeves, jeans, white trainers, an olive messenger bag on his right hip, its strap across his chest,
// rolled papers sticking out of it) and the bike (a red frame of tubes, a curved fork, a swept handlebar with grips, a shaped
// saddle, spoked wheels, a chainring, cranks and pedals, a red reflector at the back). Toon materials: a few flat tones, which the
// pixel pass turns into something like drawn pixel art.
// Each frame update() poses him: the wheels roll, the cranks turn with the pedalling, the legs follow the pedals (two-bone IK), the
// hands hold the grips (the bar turns with the steering), the whole bike leans into the turn about its tyres' line, he rises off
// the saddle to climb or to sprint, leans forward to brake, and throws: a hand to the bag, a swing out to the side, the paper away.
// Local frame: +z forward, +y up; his right is -x.

const V3 = (x, y, z) => ({ x, y, z });

export function createRider({ THREE, ramp: shared, toon: sharedToon }) {
  // ---------- materials: a three-step toon ramp ----------
  const ramp = shared || (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = sharedToon ? (c => sharedToon(c)) : (c => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }));
  const M = {
    skin: toon('#e3b08a'), shirt: toon('#efe7d2'), jeans: toon('#41618c'), jeansD: toon('#2f4a6e'), cap: toon('#b3372c'), hair: toon('#5b3a22'),
    shoe: toon('#f2f0e8'), sole: toon('#9a938a'), bag: toon('#6d7340'), bagD: toon('#555a30'), paper: toon('#ece5d0'), band: toon('#b3372c'),
    frame: toon('#c23a2e'), chrome: toon('#c9cbc8'), tyre: toon('#26272a'), black: toon('#1d1e21'), grip: toon('#2a2b2e'), reflect: new THREE.MeshBasicMaterial({ color: '#ff3a24' }),
  };
  const pix = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, (x, y, v) => { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // the T-shirt: folds running round from the bag strap and under the arms, a darker hem
  M.shirt.map = pix(32, 32, (g, p) => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 32, 32);
    for (let k = 0; k < 9; k++) { let x = rnd() * 32, y = 4 + rnd() * 24; const dx = rnd() < .5 ? 1 : -1; for (let i = 0; i < 5 + rnd() * 6; i++) { p(x | 0, y | 0, 205); p((x | 0) + 1, y | 0, 228); x += dx; y += rnd() < .5 ? 1 : 0; } }
    for (let x = 0; x < 32; x++) { p(x, 0, 196); p(x, 1, 214); } });
  // jeans: a seam down the side, a lighter wear on the thigh and knee, the twill as a faint diagonal
  M.jeans.map = pix(16, 32, (g, p) => { g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 16, 32);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0) p(x, y, 214);
    for (let y = 8; y < 26; y++) for (let x = 5; x < 11; x++) if (rnd() < .45) p(x, y, 250);
    for (let y = 0; y < 32; y++) { p(0, y, 170); p(8, y, 190); } });
  M.jeansD.map = M.jeans.map;
  // the cap: its panels' seams, a lighter crown
  M.cap.map = pix(24, 8, (g, p) => { g.fillStyle = '#eeeeee'; g.fillRect(0, 0, 24, 8); for (let x = 0; x < 24; x += 4) for (let y = 0; y < 8; y++) p(x, y, 175); for (let x = 0; x < 24; x++) p(x, 7, 190); });
  // the bag: canvas weave, stitching near its edges
  M.bag.map = pix(16, 16, (g, p) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x * 3 + y) % 5 === 0) p(x, y, 212);
    for (let x = 1; x < 16; x += 2) { p(x, 1, 255); p(x, 14, 255); } });
  M.bagD.map = M.bag.map;
  M.fender = toon("#e9e3d1"); M.fender.side = THREE.DoubleSide; M.buckle = toon('#c9a063');
  const mesh = (g, m, parent) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = false; parent.add(o); return o; };

  // a tapered capsule along +y, 0..1 long (scaled to its length when placed), radii r0 at its start and r1 at its end
  function taper(r0, r1, seg = 14) {
    const pts = []; const n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r1, 1 + Math.sin(a) * r1)); }
    return new THREE.LatheGeometry(pts, seg);
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  // put a unit-long part between two points (in its parent's space)
  function span(o, a, b) { _d.subVectors(b, a); const L = _d.length(); o.position.copy(a); _q.setFromUnitVectors(_up, _d.divideScalar(L || 1)); o.quaternion.copy(_q); o.scale.set(1, L, 1); }
  // two-bone IK: from root a to target t, bone lengths l1, l2, the middle joint bending towards pole p; returns the joint
  function ik(a, t, l1, l2, pole, out) {
    _d.subVectors(t, a); let d = _d.length(); const dir = _d.clone().normalize(); d = Math.min(d, l1 + l2 - 1e-4); d = Math.max(d, Math.abs(l1 - l2) + 1e-4);
    const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
    const side = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    return out.copy(a).addScaledVector(dir, x).addScaledVector(side, h);
  }

  const root = new THREE.Group();                                       // on the ground, at the rear tyre's contact... (the lean's axis runs along the tyres)
  const lean = new THREE.Group(); root.add(lean);

  // ---------- the bike ----------
  const R = .33, REAR = V3(0, R, -.52), FRONT = V3(0, R, .53), BB = V3(0, .29, -.04), SEAT = V3(0, .86, -.19), HEADT = V3(0, .86, .40), HEADB = V3(0, .66, .44);
  const bike = new THREE.Group(); lean.add(bike);
  const P = o => new THREE.Vector3(o.x, o.y, o.z);
  const tube = (a, b, r, m = M.frame) => { const o = mesh(taper(r, r, 10), m, bike); span(o, P(a), P(b)); return o; };
  tube(BB, SEAT, .019); tube(SEAT, HEADT, .018); tube(BB, HEADB, .021); tube(HEADB, HEADT, .024);
  for (const s of [-1, 1]) { tube(V3(s * .045, BB.y, BB.z), V3(s * .05, REAR.y, REAR.z), .011); tube(V3(s * .03, SEAT.y - .03, SEAT.z - .02), V3(s * .05, REAR.y, REAR.z), .010); }
  tube(V3(0, SEAT.y, SEAT.z), V3(0, SEAT.y + .06, SEAT.z - .02), .013, M.chrome);           // the seat post
  // the saddle: a pear outline, rounded
  { const s = new THREE.Shape(); s.moveTo(0, .15); s.bezierCurveTo(.035, .15, .04, .08, .045, .04); s.bezierCurveTo(.09, 0, .095, -.06, .07, -.1); s.bezierCurveTo(.04, -.125, -.04, -.125, -.07, -.1);
    s.bezierCurveTo(-.095, -.06, -.09, 0, -.045, .04); s.bezierCurveTo(-.04, .08, -.035, .15, 0, .15);
    const g = new THREE.ExtrudeGeometry(s, { depth: .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 3, curveSegments: 12 }); g.rotateX(-Math.PI / 2); g.translate(0, SEAT.y + .06, SEAT.z - .02);
    mesh(g, M.black, bike); }
  // the steering: fork, stem, bar, grips (turned about the head tube's axis)
  const steer = new THREE.Group(); steer.position.copy(P(HEADT)); bike.add(steer);
  const headAxis = P(HEADT).sub(P(HEADB)).normalize();
  const rel = v => P(v).sub(P(HEADT));
  for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([rel(V3(s * .03, HEADB.y, HEADB.z)), rel(V3(s * .045, .5, .5)), rel(V3(s * .05, FRONT.y + .02, FRONT.z + .025))]);
    mesh(new THREE.TubeGeometry(c, 10, .012, 8), M.frame, steer); }
  mesh(taper(.016, .016, 10), M.chrome, steer).scale.set(1, .12, 1);                          // the stem
  const bar = new THREE.CatmullRomCurve3([new THREE.Vector3(-.3, .12, -.08), new THREE.Vector3(-.22, .13, -.02), new THREE.Vector3(-.08, .1, .02), new THREE.Vector3(0, .1, .025), new THREE.Vector3(.08, .1, .02), new THREE.Vector3(.22, .13, -.02), new THREE.Vector3(.3, .12, -.08)]);
  mesh(new THREE.TubeGeometry(bar, 30, .012, 8), M.chrome, steer);
  for (const s of [-1, 1]) { const g = mesh(taper(.02, .02, 10), M.grip, steer); span(g, new THREE.Vector3(s * .21, .128, -.018), new THREE.Vector3(s * .31, .12, -.085)); }
  const grips = [new THREE.Vector3(-.26, .125, -.05), new THREE.Vector3(.26, .125, -.05)];     // (right, left: where the hands hold, in the steering's space)
  // the wheels: tyre, rim, spokes, hub
  function wheel(c, parent) {
    const w = new THREE.Group(); w.position.copy(P(c)); parent.add(w);
    const t = mesh(new THREE.TorusGeometry(R - .032, .034, 10, 40), M.tyre, w); t.rotation.y = Math.PI / 2;
    const r = mesh(new THREE.TorusGeometry(R - .06, .011, 6, 36), M.chrome, w); r.rotation.y = Math.PI / 2;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, s = mesh(new THREE.CylinderGeometry(.0025, .0025, R - .07, 3), M.chrome, w); s.position.set((i % 2 ? .012 : -.012), Math.cos(a) * (R - .07) / 2, Math.sin(a) * (R - .07) / 2); s.rotation.x = a; s.castShadow = false; }
    const h = mesh(new THREE.CylinderGeometry(.022, .022, .1, 12), M.chrome, w); h.rotation.z = Math.PI / 2;
    return w;
  }
  const rearW = wheel(REAR, bike), frontW = wheel(rel(FRONT).add(new THREE.Vector3(0, 0, 0)), steer);
  { const rack = new THREE.Group(); bike.add(rack); const rk = (a, b) => { const o = mesh(taper(.008, .008, 5), M.chrome, rack); span(o, a, b); };   // a rack over the back wheel
    const y = REAR.y + R + .09; for (const sd of [-1, 1]) { rk(new THREE.Vector3(sd * .06, y, REAR.z - .2), new THREE.Vector3(sd * .06, y, SEAT.z - .02)); rk(new THREE.Vector3(sd * .06, y, REAR.z - .18), new THREE.Vector3(sd * .045, REAR.y, REAR.z)); }
    for (let k = 0; k < 3; k++) rk(new THREE.Vector3(-.06, y, REAR.z - .15 + k * .12), new THREE.Vector3(.06, y, REAR.z - .15 + k * .12));
    const lamp = mesh(new THREE.BoxGeometry(.05, .04, .03), new THREE.MeshBasicMaterial({ color: '#ff5a3c' }), rack); lamp.position.set(0, y - .03, REAR.z - .22); }
  // mudguards: an arc of cream over each wheel, and their stays
  { const guard = (a0, a1) => { const g = new THREE.CylinderGeometry(R + .035, R + .035, .06, 20, 1, true, a0, a1 - a0); g.rotateZ(Math.PI / 2); return g; };
    const rg = mesh(guard(Math.PI * .4, Math.PI * 1.1), M.fender, bike); rg.position.copy(P(REAR));
    const fg = mesh(guard(Math.PI * .1, Math.PI * .75), M.fender, steer); fg.position.copy(rel(FRONT));
    for (const sd of [-1, 1]) { const st2 = mesh(taper(.004, .004, 4), M.chrome, bike); span(st2, new THREE.Vector3(sd * .035, REAR.y, REAR.z), new THREE.Vector3(sd * .035, REAR.y + .12, REAR.z - .3)); } }
  // the reflector at the back, under the saddle, and a rear rack's stub
  { const r = mesh(new THREE.BoxGeometry(.06, .035, .012), M.reflect, bike); r.position.set(0, SEAT.y - .02, SEAT.z - .1); }
  // the drive: chainring on his right (-x), cranks, pedals
  const crank = new THREE.Group(); crank.position.copy(P(BB)); bike.add(crank);
  { const ring = mesh(new THREE.TorusGeometry(.085, .01, 6, 28), M.chrome, crank); ring.rotation.y = Math.PI / 2; ring.position.x = -.06;
    mesh(new THREE.CylinderGeometry(.03, .03, .13, 12), M.chrome, crank).rotation.z = Math.PI / 2; }
  const CL = .17, arms = [], pedals = [];
  for (const s of [-1, 1]) { const a = mesh(new THREE.BoxGeometry(.018, CL, .025), M.chrome, crank); a.position.set(s * .075, s < 0 ? -CL / 2 : CL / 2, 0); arms.push(a);
    const p = mesh(new THREE.BoxGeometry(.1, .02, .06), M.black, bike); pedals.push(p); }
  const chain = mesh(new THREE.TorusGeometry(.26, .004, 4, 40), M.black, bike); chain.scale.set(1, .36, 1); chain.rotation.y = Math.PI / 2; chain.position.set(-.06, (BB.y + REAR.y) / 2 - .02, (BB.z + REAR.z) / 2);

  // ---------- the boy ----------
  const boy = new THREE.Group(); lean.add(boy);
  const part = (r0, r1, m) => mesh(taper(r0, r1), m, boy);
  // torso: a lathed shirt, flattened front to back
  const torso = new THREE.Group(); boy.add(torso);
  { const pts = [[.0, -.02], [.13, 0], [.145, .08], [.16, .22], [.175, .36], [.17, .42], [.12, .47], [.06, .49], [0, .49]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 22); g.scale(1, 1, .72); mesh(g, M.shirt, torso);
    const belt = mesh(new THREE.CylinderGeometry(.135, .135, .05, 22), M.jeansD, torso); belt.scale.z = .75; belt.position.y = -.01; }
  { const hipsM = mesh(new THREE.SphereGeometry(.15, 16, 12), M.jeans, torso); hipsM.scale.set(1.03, .6, .82); hipsM.position.set(0, -.02, -.01);
    for (const sd of [-1, 1]) { const b = mesh(new THREE.SphereGeometry(.088, 14, 10), M.jeans, torso); b.scale.set(1, .85, 1.05); b.position.set(sd * .066, -.035, -.07); }
    const seam = mesh(new THREE.BoxGeometry(.012, .1, .02), M.jeansD, torso); seam.position.set(0, -.02, -.16); seam.rotation.x = .3;
    for (const sd of [-1, 1]) { const pk = mesh(new THREE.BoxGeometry(.075, .07, .012), M.jeansD, torso); pk.position.set(sd * .07, .0, -.15); pk.rotation.set(.35, sd * .25, 0); } }   // (back pockets)
  const neck = mesh(taper(.045, .045, 10), M.skin, torso); neck.position.y = .46; neck.scale.y = .08;
  // head, hair, ears, cap
  const head = new THREE.Group(); head.position.y = .6; torso.add(head);
  { const h = mesh(new THREE.SphereGeometry(.105, 20, 16), M.skin, head); h.scale.set(.95, 1.06, 1);
    const hair = mesh(new THREE.SphereGeometry(.11, 20, 12, 0, Math.PI * 2, Math.PI * .35, Math.PI * .45), M.hair, head); hair.rotation.x = -.35; hair.position.set(0, -.005, -.012);   // (the back and sides, under the cap)
    const hairL = toon('#7b5836');
    for (let k = 0; k < 9; k++) { const th = (k / 8 - .5) * Math.PI * 1.25, tuft = mesh(new THREE.ConeGeometry(.024, .075, 5), k % 3 ? M.hair : hairL, head);   // tufts from under the cap, round the back
      tuft.position.set(Math.sin(th) * .1, -.012 - (k % 2) * .012, -Math.cos(th) * .1);
      const out = tuft.position.clone().setY(0).normalize(); tuft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out.multiplyScalar(.7).add(new THREE.Vector3(0, -.7, 0)).normalize()); }
    for (const sd of [-1, 1]) { const side = mesh(new THREE.ConeGeometry(.02, .06, 5), M.hair, head); side.position.set(sd * .102, -.01, .03); side.rotation.z = sd * -2.6; }   // and over the ears
    for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(.024, 10, 8), M.skin, head); e.scale.set(.6, 1, .8); e.position.set(s * .1, -.005, -.005); }
    const cap = mesh(new THREE.SphereGeometry(.116, 22, 12, 0, Math.PI * 2, 0, Math.PI * .5), M.cap, head); cap.position.y = .018; cap.scale.set(1, .82, 1.05);
    const brim = mesh(new THREE.CylinderGeometry(.11, .11, .012, 22, 1, false, -Math.PI * .45, Math.PI * .9), M.cap, head); brim.scale.set(1, 1, 1.25); brim.position.set(0, .02, .07); brim.rotation.x = .12;
    const btn = mesh(new THREE.SphereGeometry(.014, 8, 6), M.cap, head); btn.position.y = .115;
    const band = mesh(new THREE.TorusGeometry(.111, .006, 6, 28, Math.PI * .7), M.black, head); band.rotation.set(Math.PI / 2, 0, Math.PI * 1.15); band.position.y = .02; }   // the cap's back opening
  // arms (sleeve, upper arm, forearm, hand), legs (thigh, shin, shoe)
  const L = { up: .27, lo: .26, th: .43, sh: .43 };
  const limbs = [];
  for (const s of [-1, 1]) {                                          // s = -1: his right, +1: his left
    const sleeve = part(.058, .05, M.shirt), upper = part(.042, .036, M.skin), fore = part(.036, .03, M.skin);
    const hand = mesh(new THREE.SphereGeometry(.036, 12, 10), M.skin, boy); hand.scale.set(.85, .8, 1.15);
    const thigh = part(.088, .06, M.jeans), shin = part(.06, .042, M.jeans), kneeCap = mesh(new THREE.SphereGeometry(.06, 12, 10), M.jeans, boy);
    const shoe = new THREE.Group(); boy.add(shoe);
    { const g = mesh(new THREE.SphereGeometry(.05, 14, 10), M.shoe, shoe); g.scale.set(.85, .6, 1.9); g.position.z = .035; const so = mesh(new THREE.BoxGeometry(.085, .016, .19), M.sole, shoe); so.position.set(0, -.026, .035); }
    limbs.push({ s, sleeve, upper, fore, hand, thigh, shin, shoe, kneeCap });
  }
  // the bag on his right hip, its flap, its strap across the chest to the left shoulder, papers in it
  const bag = new THREE.Group(); torso.add(bag);                       // (on his back, going with him)
  { const b = mesh(new THREE.BoxGeometry(.125, .26, .36, 2, 2, 2), M.bag, bag); b.geometry.translate(0, 0, 0);
    const bp = b.geometry.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i), z = bp.getZ(i); bp.setX(i, bp.getX(i) * (1 - .25 * Math.abs(z) / .15) * (y < 0 ? .8 : 1)); } b.geometry.computeVertexNormals();
    const flap = mesh(new THREE.BoxGeometry(.132, .13, .37), M.bagD, bag); flap.position.set(-.004, .075, 0);
    const buckle = mesh(new THREE.BoxGeometry(.012, .05, .05), M.buckle, bag); buckle.position.set(-.072, .03, 0);     // on the flap's outer face
    const tab = mesh(new THREE.BoxGeometry(.01, .07, .025), M.bagD, bag); tab.position.set(-.07, .065, 0);
    for (let i = 0; i < 5; i++) { const p = mesh(new THREE.CylinderGeometry(.036, .036, .2, 12), M.paper, bag);   // papers: rolled, lying across the top, sticking out of it
      p.rotation.set(0, 0, Math.PI / 2 + (i % 2 ? .12 : -.08)); p.position.set(.01 + (i % 2) * .012, .16 + (i % 2) * .03, -.13 + i * .065);
      const band = mesh(new THREE.CylinderGeometry(.037, .037, .03, 12), M.band, p); band.position.y = .025; } }
  const strap = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.21, .12, -.17), new THREE.Vector3(-.17, .25, .06), new THREE.Vector3(-.02, .38, .11), new THREE.Vector3(.12, .46, .03), new THREE.Vector3(.14, .44, -.08), new THREE.Vector3(.15, .28, -.17), new THREE.Vector3(.15, .13, -.2)]), 40, .012, 6, false), M.bagD, torso);

  // ---------- the pose, each frame ----------
  const st = { crank: 0, roll: 0, rise: 0, bend: 0, throwT: -1, side: 0, released: false, look: 0, walk: 0, back: 0, stand: 0 };
  const W = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), knee = new THREE.Vector3(), elbow = new THREE.Vector3();
  const toBoy = (obj, v) => boy.worldToLocal(obj.localToWorld(v.clone()));
  // input: { speed m/s, steer (rad, + right), lean (rad, + right), pedalling (0..1), braking (0..1), climbing (slope, + up), dt,
  //   look (rad: a head turn wanted, as at a dog; null: into the turn), nervous (0..1), kick ({ side +1 left / -1 right, t 0..1 } or null),
  //   air (in the air: legs drawn up), fallen (0..1: slumped, on the ground), charge ({ side, p } a throw held back, or null) }
  function update(o) {
    const dt = o.dt;
    rearW.rotation.x += o.speed * dt / R; frontW.rotation.x += o.speed * dt / R;
    if (o.pedalling > .05) st.crank += o.speed * dt / R / 2.3 + (o.speed < 1 ? dt * 2.2 * o.pedalling : 0);    // (a gear of 2.3; a push from standing still)
    else st.crank += (Math.round(st.crank / Math.PI) * Math.PI - st.crank) * Math.min(1, dt * 3);             // coasting: the cranks settle level
    crank.rotation.x = st.crank;
    steer.setRotationFromAxisAngle(headAxis, -o.steer);
    lean.rotation.z = o.lean;                                         // the bike and the boy lean together, about the tyres' line
    // off the saddle to climb or to push hard from low speed; forward to brake
    const riseT = o.air ? .55 : Math.min(1, Math.max(0, (o.climbing - .03) * 12) + (o.pedalling > .8 && o.speed < 3.5 ? .7 : 0)) * (o.pedalling > .3 ? 1 : 0);   // (in the air: up off the saddle, knees soft)
    st.rise += (riseT - st.rise) * Math.min(1, dt * 4); st.bend += ((o.braking > .1 ? .35 : 0) + st.rise * .25 - st.bend) * Math.min(1, dt * 5);
    // the pedals
    const pedalPos = [];
    for (const [i, s] of [[0, -1], [1, 1]]) { const a = st.crank + (s < 0 ? 0 : Math.PI); const p = new THREE.Vector3(s * .12, BB.y - Math.cos(a) * CL, BB.z - Math.sin(a) * CL); pedals[i].position.copy(p); pedals[i].rotation.x = 0; pedalPos.push(p); }   // (each pedal where its crank arm ends)
    // the pelvis: on the saddle, or up and forward, swaying from pedal to pedal when standing
    const sway = st.rise * Math.sin(st.crank) * .05;
    const pelvis = new THREE.Vector3(sway, SEAT.y + .1 + st.rise * .16, SEAT.z + .02 + st.rise * .16);
    const nerv = (o.nervous || 0) * Math.sin(performance.now() * .031) * .06, fall = o.fallen || 0, tired = o.tired || 0;
    const kt = o.kick ? Math.min(1, o.kick.t) : 0, kEnv = o.kick ? Math.sin(Math.min(1, kt / .62) * Math.PI * .5) * (kt < .62 ? 1 : 1 - (kt - .62) / .38) : 0, kS = o.kick ? o.kick.side : 0;   // (how far into a kick)
    // feet off the pedals: going backwards he walks the bike back, a foot at a time; stopped, he puts his left foot down
    const backing = o.speed < -.05 && !o.air, stopped = Math.abs(o.speed) < .25 && o.pedalling < .05 && !o.air && !o.fallen;
    st.back += ((backing ? 1 : 0) - st.back) * Math.min(1, dt * 6); st.stand += ((stopped && !backing ? 1 : 0) - st.stand) * Math.min(1, dt * 5);
    if (backing) st.walk += -o.speed * dt / .42 * Math.PI;
    const seat = (o.pedalling > .3 ? 1 : 0) * Math.sin(st.crank) * .035 * Math.min(1, Math.abs(o.speed) / 2.5);   // (seated: hips and shoulders turning a little with each stroke)
    torso.position.copy(pelvis); torso.rotation.set(.42 + st.bend * .5 + st.rise * .15 + fall * .35 + tired * (.12 + Math.sin(performance.now() * .006) * .04), nerv * 2 + seat + kS * kEnv * .25, -sway * 1.5 - o.lean * .18 + nerv + fall * .25 + seat * .6 + kS * kEnv * .22);   // (leaning into the bar; a little upright against the lean; jumpy with a dog at his heel)
    root.updateMatrixWorld(true);
    head.rotation.set(-.35 - st.bend * .3 + fall * .4 + tired * .35, st.look * .6, 0); st.look += ((st.throwT >= 0 ? st.side : o.look != null ? o.look : -o.steer * 1.2) - st.look) * Math.min(1, dt * (o.look != null ? 9 : 5));
    // the throw: 0..1 over .5 s; the throwing hand goes to the bag (.0-.35), swings out to its side and lets go (.35-.75), comes back
    let throwHand = -1, throwPos = null;
    if (st.throwT >= 0) { st.throwT += dt / .5; const t = st.throwT, side = st.side, hi = side < 0 ? 0 : 1;   // side -1: right, +1: left (the left hand reaches across)
      throwHand = hi; const bagPt = new THREE.Vector3(-.2, pelvis.y + .1, pelvis.z - .05), out = new THREE.Vector3(side * .75, pelvis.y + .5, pelvis.z + .15);
      throwPos = t < .35 ? bagPt : t < .75 ? bagPt.clone().lerp(out, (t - .35) / .4) : out.clone().lerp(bagPt, Math.min(1, (t - .75) / .25) * .3);
      if (t >= .62 && !st.released) { st.released = true; o.onRelease?.(boy.localToWorld(throwPos.clone()), side); }
      if (t >= 1) st.throwT = -1;
    } else if (o.charge) {                                             // a throw held: the paper out of the bag, drawn back across him, the harder the further
      const side = o.charge.side; throwHand = side < 0 ? 0 : 1; throwPos = new THREE.Vector3(-side * (.12 + .18 * o.charge.p), pelvis.y + .25 + .15 * o.charge.p, pelvis.z - .1 - .08 * o.charge.p);
    }
    steer.updateMatrixWorld(true);
    for (const lb of limbs) {
      const i = lb.s < 0 ? 0 : 1;
      // arms: the shoulder from the torso, the hand at its grip (or in the throw)
      const sh = torso.localToWorld(new THREE.Vector3(lb.s * .16, .41, -.01)); boy.worldToLocal(sh);
      const hand = i === throwHand && throwPos ? throwPos : boy.worldToLocal(steer.localToWorld(grips[i].clone()));
      ik(sh, hand, L.up, L.lo, new THREE.Vector3(lb.s * .8, -.4, -.5).normalize(), elbow);
      span(lb.upper, sh, elbow); span(lb.fore, elbow, hand); const cl = cur.limbs[i]; cl.sh = sh.clone(); cl.elbow = elbow.clone(); cl.hand = hand.clone();
      span(lb.sleeve, sh, tmp.copy(sh).lerp(elbow, .55)); lb.hand.position.copy(hand); lb.hand.quaternion.copy(lb.fore.quaternion);
      // legs: the hip from the pelvis, the foot on its pedal, the knee forward and a little out
      const hip = new THREE.Vector3(pelvis.x + lb.s * .085, pelvis.y - .03, pelvis.z);
      let foot = pedalPos[i].clone().add(new THREE.Vector3(0, .045, -.02));
      if (st.back > .01 || st.stand > .01) { const ph = st.walk + (i ? Math.PI : 0), walkF = new THREE.Vector3(lb.s * .27, .045 + Math.max(0, -Math.cos(ph)) * .07, BB.z + .12 + Math.sin(ph) * .26);
        const standF = new THREE.Vector3(lb.s * .28, .045, BB.z + .06); if (st.back > .01) foot = foot.clone().lerp(walkF, st.back); if (lb.s > 0 && st.stand > .01) foot = foot.clone().lerp(standF, st.stand); }
      let pole = new THREE.Vector3(lb.s * .18, .1, 1);
      if (o.kick && o.kick.side === lb.s) { const t = Math.min(1, o.kick.t), e3 = x => 1 - Math.pow(1 - x, 3), io = x => x * x * (3 - 2 * x);
        const tuck = hip.clone().add(new THREE.Vector3(lb.s * .22, -.3, -.12)), out = hip.clone().add(new THREE.Vector3(lb.s * .8, -.3, .14));
        foot = t < .3 ? foot.clone().lerp(tuck, io(t / .3)) : t < .5 ? tuck.clone().lerp(out, e3((t - .3) / .2)) : t < .62 ? out : out.clone().lerp(foot, io((t - .62) / .38));
        pole = new THREE.Vector3(lb.s * .5, .7, .6); }   // (the knee up and out while it kicks)
      ik(hip, foot, L.th, L.sh, pole.normalize(), knee);
      span(lb.thigh, hip, knee); span(lb.shin, knee, foot); lb.kneeCap.position.copy(knee); cl.hip = hip.clone(); cl.knee = knee.clone(); cl.foot = foot.clone(); lb.shoe.position.copy(foot); lb.shoe.rotation.set(Math.sin(st.crank + (i ? 0 : Math.PI)) * .2, 0, 0);
    }
    bag.position.set(-.03, .1 + Math.abs(Math.sin(st.crank)) * .008 * (o.speed > .5 ? 1 : 0), -.2); bag.rotation.set(-.12, Math.PI / 2, Math.sin(st.crank * 2) * .035 * (o.speed > .5 ? 1 : 0));   // (bouncing a little on his back)   // (swinging a little on his hip)
    torso.updateMatrix(); cur.pelvis = pelvis.clone(); cur.chest = new THREE.Vector3(0, .42, 0).applyMatrix4(torso.matrix); head.position.set(0, .6, 0); cur.head = head.position.clone().applyMatrix4(torso.matrix);
    if (RG.on) { if (RG.up > 0) RG.up += dt / RG.upT; else stepRagdoll(dt);
      const w = 1 - THREE.MathUtils.smootherstep(RG.up, 0, 1); if (RG.up >= 1) RG.on = false; else applyRagdoll(w); }
  }

  // ---------- the ragdoll: thrown off, he is fifteen points held apart by sticks (Verlet): tumbling over the bars, landing, sliding,
  // lying there; then eased back onto the bike. Points: 0 pelvis, 1 chest, 2 head, then right / left: 3-4 shoulders, 5-6 elbows,
  // 7-8 hands, 9-10 hips, 11-12 knees, 13-14 feet. The body (pelvis, chest, shoulders, hips) is braced stiff; the neck a little soft.
  const cur = { limbs: [{}, {}] };                                    // (this frame's pose, in the boy's space: where a fall starts and what getting up eases back to)
  const RG = { on: false, up: 0, upT: 1, acc: 0, p: [], q: [], links: [], mins: [], touch: new Uint8Array(15), fix: new THREE.Quaternion(), bagP: new THREE.Vector3(), bagQ: new THREE.Quaternion() };
  const RAD = [.1, .12, .11, .06, .06, .045, .045, .04, .04, .07, .07, .05, .05, .045, .045];
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
  function basis(pel, chest, shR, shL, out) {                         // the body's turn, from its points (+y up the spine, +x to his left)
    _y.subVectors(chest, pel).normalize(); _x.subVectors(shL, shR); _x.addScaledVector(_y, -_x.dot(_y)).normalize(); _z.crossVectors(_x, _y);
    return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
  }
  // o: { vel (world, m/s), spin (world, rad/s, about the pelvis), lift (m/s up), ground (x, z) => y, near (point) => [boxes], hit (boxes, point, r) => touched }
  function ragdoll(o) {
    if (!cur.pelvis) return;
    const c = cur.limbs, pts = [cur.pelvis, cur.chest, cur.head, c[0].sh, c[1].sh, c[0].elbow, c[1].elbow, c[0].hand, c[1].hand, c[0].hip, c[1].hip, c[0].knee, c[1].knee, c[0].foot, c[1].foot];
    boy.updateMatrixWorld(true); const h = 1 / 120;
    RG.p = pts.map(v => boy.localToWorld(v.clone()));
    RG.q = RG.p.map(p => { const v = o.vel.clone().add(_d.subVectors(p, RG.p[0]).cross(o.spin).negate()); v.y += o.lift; return p.clone().addScaledVector(v, -h); });   // (all of him on, and turning: head first, over the bars)
    const links = [], add = (a, b, k = 1) => links.push([a, b, RG.p[a].distanceTo(RG.p[b]), k]), T = [0, 1, 3, 4, 9, 10];
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) add(T[i], T[j]);
    add(2, 1); add(2, 3, .5); add(2, 4, .5); add(3, 5); add(5, 7); add(4, 6); add(6, 8); add(9, 11); add(11, 13); add(10, 12); add(12, 14);
    RG.links = links; RG.mins = [[3, 7, .3], [4, 8, .3], [9, 13, .5], [10, 14, .5], [1, 7, .12], [1, 8, .12], [2, 7, .14], [2, 8, .14]];   // (no arm or leg folded flat)
    basis(cur.pelvis, cur.chest, c[0].sh, c[1].sh, _qa); RG.fix.copy(_qa).invert().multiply(torso.quaternion);   // (the torso's own turn, against the points')
    torso.updateMatrix();
    Object.assign(RG, { on: true, up: 0, acc: 0, ground: o.ground, near: o.near, hit: o.hit });
  }
  function getUp(sec = 1) { if (RG.on && RG.up === 0) { RG.up = 1e-4; RG.upT = sec; } }
  function stepRagdoll(dt) {
    const h = 1 / 120, gh = 9.81 * h * h; RG.acc = Math.min(RG.acc + dt, 1 / 15);
    const gy = RG.ground(RG.p[0].x, RG.p[0].z), list = RG.near ? RG.near(RG.p[0]) : [];
    while (RG.acc >= h) { RG.acc -= h; RG.touch.fill(0);
      for (let i = 0; i < 15; i++) { const p = RG.p[i], q = RG.q[i], vx = (p.x - q.x) * .998, vy = (p.y - q.y) * .998, vz = (p.z - q.z) * .998; q.copy(p); p.x += vx; p.y += vy - gh; p.z += vz; }
      for (let it = 0; it < 6; it++) {
        for (const [a, b, len, k] of RG.links) { const A = RG.p[a], Bp = RG.p[b]; _d.subVectors(Bp, A); const d = _d.length() || 1e-6, f = (d - len) / d * .5 * k; A.addScaledVector(_d, f); Bp.addScaledVector(_d, -f); }
        for (const [a, b, m] of RG.mins) { const A = RG.p[a], Bp = RG.p[b]; _d.subVectors(Bp, A); const d = _d.length() || 1e-6; if (d < m) { const f = (d - m) / d * .5; A.addScaledVector(_d, f); Bp.addScaledVector(_d, -f); } }
        for (let i = 0; i < 15; i++) { const p = RG.p[i], r = RAD[i]; if (p.y < gy + r) { p.y = gy + r; RG.touch[i] = 1; } if (list.length && RG.hit(list, p, r)) RG.touch[i] = 1; }
      }
      for (let i = 0; i < 15; i++) if (RG.touch[i]) { const p = RG.p[i], q = RG.q[i]; q.x = p.x - (p.x - q.x) * .9; q.z = p.z - (p.z - q.z) * .9; }   // (the ground rubs)
    }
  }
  function applyRagdoll(w) {                                          // w: 1 all ragdoll, 0 all the pose on the bike
    boy.updateMatrixWorld(true); const Lr = RG.p.map(p => boy.worldToLocal(p.clone()));
    basis(Lr[0], Lr[1], Lr[3], Lr[4], _qa).multiply(RG.fix);
    torso.position.lerp(Lr[0], w); torso.quaternion.slerp(_qa, w); torso.updateMatrix();
    _qb.copy(torso.quaternion).invert(); head.position.lerp(tmp.copy(Lr[2]).sub(torso.position).applyQuaternion(_qb), w);
    for (const lb of limbs) { const i = lb.s < 0 ? 0 : 1, c = cur.limbs[i];
      const sh = new THREE.Vector3(lb.s * .16, .41, -.01).applyMatrix4(torso.matrix), hand = c.hand.clone().lerp(Lr[7 + i], w), eP = c.elbow.clone().lerp(Lr[5 + i], w);
      ik(sh, hand, L.up, L.lo, eP.sub(sh).normalize(), elbow); span(lb.upper, sh, elbow); span(lb.fore, elbow, hand); span(lb.sleeve, sh, tmp.copy(sh).lerp(elbow, .55));
      lb.hand.position.copy(hand); lb.hand.quaternion.copy(lb.fore.quaternion);
      const hip = c.hip.clone().lerp(Lr[9 + i], w), foot = c.foot.clone().lerp(Lr[13 + i], w), kP = c.knee.clone().lerp(Lr[11 + i], w);
      ik(hip, foot, L.th, L.sh, kP.sub(hip).normalize(), knee); span(lb.thigh, hip, knee); span(lb.shin, knee, foot); lb.kneeCap.position.copy(knee);
      lb.shoe.position.copy(foot); lb.shoe.quaternion.slerp(torso.quaternion, w);
    }
  }
  function ragdollOff() { RG.on = false; head.position.set(0, .6, 0); }
  function throwPaper(side) { if (st.throwT >= 0) return false; st.throwT = 0; st.side = side; st.released = false; return true; }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, head, boy, get pelvisAt() { return RG.on ? RG.p[0] : null; }, update, throwPaper, ragdoll, getUp, ragdollOff, get ragdolling() { return RG.on; }, get throwing() { return st.throwT >= 0; }, wheelbase: FRONT.z - REAR.z, materials: M };   // (head: hidden when the camera is in it)
}
