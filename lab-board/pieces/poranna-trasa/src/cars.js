// Cars, modelled here (metres): not boxes. The body is the side profile of the car, cut with its wheel arches and extruded across
// its width with rounded edges; the glasshouse above it (the glass, then the roof and the pillars over it); bumpers, lights front
// and back, number plates, door lines and handles, mirrors; wheels with tyres and a spoked rim. Four kinds: a saloon, a hatchback,
// an estate, a pickup (with its bed). Local frame: +z forward, +x the car's left, on the ground.
// makeCar() gives { group, wheels, half: [half width, half length], kind }; spin(car, metres) turns its wheels.

export function createCars({ THREE, toon }) {
  const canvasT = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  // glass: see-through, tinted dark blue (a little more at the top), with a streak of the sky across it: a wide one and a thin one,
  // on the slant, in whole pixels
  const glassT = canvasT(16, 16, g => { g.fillStyle = 'rgba(43,58,68,.5)'; g.fillRect(0, 0, 16, 16); g.clearRect(0, 0, 16, 5); g.fillStyle = 'rgba(58,78,90,.62)'; g.fillRect(0, 0, 16, 5);
    for (let k = 0; k < 16; k++) { g.fillStyle = 'rgba(190,215,225,.85)'; g.fillRect((k + 3) % 16, 15 - k, 2, 1); g.fillStyle = 'rgba(160,190,205,.6)'; if (k % 2) g.fillRect((k + 9) % 16, 15 - k, 1, 1); } }, 1.4, 1.4);
  // a number plate: light, a dark rim, dark letters
  const plateT = canvasT(16, 4, g => { g.fillStyle = '#ecebe3'; g.fillRect(0, 0, 16, 4); g.fillStyle = '#44484c'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 3, 16, 1);
    for (const x of [2, 3, 5, 7, 8, 10, 12, 13]) g.fillRect(x, 1 + (x % 3 ? 0 : 1), 1, x % 2 ? 2 : 1); });
  // the soft dark under a car
  const shadeT = canvasT(32, 32, g => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 16); gr.addColorStop(0, 'rgba(8,6,12,.75)'); gr.addColorStop(.7, 'rgba(8,6,12,.45)'); gr.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const shadeM = new THREE.MeshBasicMaterial({ map: shadeT, transparent: true, depthWrite: false });
  // the bus: its roof, its air unit, the destination sign (amber dots on black: a number and CENTRUM)
  const busRoof = toon('#d9d6cc'), busRib = toon('#b9b5aa'), busUnit = toon('#9aa0a4'), busSign = new THREE.MeshBasicMaterial({ map: canvasT(40, 8, g => { g.fillStyle = '#17181b'; g.fillRect(0, 0, 40, 8); g.fillStyle = '#f2a33a';
    const F = { 7: ['111', '001', '010', '010', '010'], C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'], N: ['101', '111', '111', '101', '101'], T: ['111', '010', '010', '010', '010'], R: ['110', '101', '110', '101', '101'], U: ['101', '101', '101', '101', '111'], M: ['101', '111', '111', '101', '101'] };
    let x = 2; for (const ch of '7 CENTRUM') { if (F[ch]) F[ch].forEach((row, y) => [...row].forEach((v, k) => { if (v === '1') g.fillRect(x + k, 1 + y, 1, 1); })); x += ch === ' ' ? 3 : 4; } }) });
  const shared = { glass: toon('#ffffff', { map: glassT, transparent: true, depthWrite: false }), seat: toon('#3a3430'), glassHi: toon('#6c8796'), dark: toon('#1f2023'), trim: toon('#3a3c40'), chrome: toon('#c9cbc8'), tyre: toon('#232427'),
    head: new THREE.MeshBasicMaterial({ color: '#fff3cf' }), tail: toon('#b3261e'), tailHi: new THREE.MeshBasicMaterial({ color: '#e0503f' }), reverse: toon('#e9e3d1'), amber: toon('#e0913a'), plate: toon('#ffffff', { map: plateT }), rim: toon('#aeb2b4'), well: toon('#17181b') };
  const KINDS = {
    //  length, width, wheel r, wheelbase, front overhang; body: the lower body's top along it [from the front, height]; gh: the glasshouse
    //  [its foot from, to, the roof from, to, its height]; sq: how square its sections are (a higher superellipse); the kinds, as the
    //  80s street had them: a three-box saloon, a liftback with its long sloping back glass, a boxy family estate, an old pickup with
    //  its upright cab and its bed, and (rarely) a low wedge of a sports car
    saloon: { L: 4.45, W: 1.72, R: .31, WB: 2.62, OF: .92, sq: 5, body: [[0, .3], [0, .58], [.32, .67], [1.4, .74], [3.4, .83], [4.2, .83], [4.45, .75], [4.45, .32]], gh: [1.3, 3.72, 2.0, 3.36, .52] },   // (a long low bonnet, a short high boot, the windscreen raked more than the back: front and back not alike)
    liftback: { L: 4.42, W: 1.72, R: .3, WB: 2.6, OF: .9, sq: 4.2, body: [[0, .32], [0, .6], [.28, .69], [1.2, .78], [3.9, .84], [4.34, .8], [4.42, .6], [4.42, .36]], gh: [1.08, 4.2, 1.75, 2.9, .5] },
    estate: { L: 4.8, W: 1.74, R: .31, WB: 2.66, OF: .95, sq: 7, body: [[0, .32], [0, .66], [.22, .74], [1.2, .8], [4.72, .84], [4.8, .8], [4.8, .34]], gh: [1.15, 4.74, 1.82, 4.62, .6] },
    pickup: { L: 5.2, W: 1.86, R: .38, WB: 3.2, OF: .95, sq: 6, body: [[0, .42], [0, .86], [.25, .95], [1.45, 1.0], [5.1, 1.0], [5.2, .96], [5.2, .46]], gh: [1.5, 2.78, 1.72, 2.74, .62], bed: true },
    wedge: { L: 4.3, W: 1.95, R: .32, WB: 2.5, OF: 1.05, sq: 3.6, slit: true, intake: true, noGrille: true, body: [[0, .28], [0, .42], [.6, .55], [1.4, .7], [3.4, .78], [4.1, .75], [4.3, .6], [4.3, .34]], gh: [1.0, 3.75, 2.05, 2.95, .36], wing: true },
    // older ones, sized from the real cars of the time (length, width, height, wheelbase), under names of their own:
    //   micro: the tiny rear-engined two-door (3.05 x 1.38 x 1.30 m, 1.84 m between the axles): round, no grille, louvres at the back
    micro: { L: 3.05, W: 1.38, R: .26, WB: 1.84, OF: .58, sq: 3.6, body: [[0, .3], [0, .54], [.18, .63], [.55, .7], [2.72, .72], [2.98, .66], [3.05, .5], [3.05, .34]], gh: [.6, 2.92, 1.12, 2.38, .56], round: true, noGrille: true, rearVents: true, chrome: true },
    //   twostroke: the little three-box two-stroke (3.56 x 1.50 x 1.44 m, 2.02 m): flat sides, thin chrome, pastel paint
    twostroke: { L: 3.56, W: 1.5, R: .28, WB: 2.02, OF: .64, sq: 6.5, body: [[0, .3], [0, .6], [.22, .68], [.85, .74], [2.85, .76], [3.42, .74], [3.56, .66], [3.56, .34]], gh: [.95, 2.98, 1.42, 2.62, .6], round: true, chrome: true },
    //   fastback: the angular five-door liftback of the 80s (4.32 x 1.65 x 1.38 m, 2.51 m): a wedge nose, big black bumpers, slats on its rear pillar
    fastback: { L: 4.32, W: 1.65, R: .3, WB: 2.51, OF: .86, sq: 7, body: [[0, .32], [0, .58], [.3, .66], [1.15, .74], [3.95, .82], [4.28, .8], [4.32, .64], [4.32, .36]], gh: [1.12, 4.16, 1.78, 3.0, .55], bigBumpers: true, slats: true, four: true },
    //   barge: the long German saloon of the late 70s (4.73 x 1.78 x 1.44 m, 2.80 m): upright chrome grille, chrome bumpers, four doors
    barge: { L: 4.73, W: 1.78, R: .32, WB: 2.8, OF: .93, sq: 6, body: [[0, .32], [0, .64], [.3, .72], [1.45, .78], [3.65, .85], [4.52, .85], [4.73, .76], [4.73, .34]], gh: [1.42, 3.86, 2.08, 3.46, .6], chrome: true, tallGrille: true, four: true },
    //   van: the snub-nosed delivery van (about 4.3 x 1.84 x 2.1 m, 2.65 m): the cab over the front wheels, windows only in the cab, a tall box behind
    van: { L: 4.3, W: 1.84, R: .34, WB: 2.65, OF: .72, sq: 9, body: [[0, .38], [0, .78], [.08, .92], [4.3, 1.02], [4.3, .4]], gh: [.06, 4.26, .38, 4.22, .98], glassTo: 1.3, box: true, backDoors: true },
    hatch: { L: 3.95, W: 1.68, R: .3, WB: 2.45, OF: .78, sq: 5, body: [[0, .3], [0, .64], [.3, .74], [1.05, .8], [3.7, .84], [3.95, .8], [3.95, .32]], gh: [.8, 3.9, 1.5, 3.6, .56] },
    //   bus: the town's bus (10.4 x 2.45 x about 2.9 m): a box on the road, a row of windows parted by pillars, doors at the front and the middle
    bus: { L: 10.4, W: 2.45, R: .48, WB: 5.4, OF: 2.2, sq: 10, body: [[0, .42], [0, 1.18], [.06, 1.26], [10.4, 1.3], [10.4, .42]], gh: [.04, 10.36, .1, 10.3, 1.6], box: true, pillars: 1.25, bus: true },
  };
  const bev = { bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 10 };
  // an extrusion across the width, the profile in (along the car, up), centred, turned so its length runs along +z
  function across(shape, w, m, opts = bev) { const g = new THREE.ExtrudeGeometry(shape, { depth: w - .1, ...opts }); g.translate(0, 0, -(w - .1) / 2); g.rotateY(-Math.PI / 2); const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; }
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; return o; };
  function wheel(R, m) {
    const w = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .2, 18), shared.tyre); t.rotation.z = Math.PI / 2; w.add(t);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * .62, R * .62, .21, 14), shared.rim); rim.rotation.z = Math.PI / 2; w.add(rim);
    for (let k = 0; k < 5; k++) { const s = box(.215, R * .12, R * .9, shared.chrome, 0, 0, 0); s.rotation.x = k / 5 * Math.PI; w.add(s); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * .16, R * .16, .23, 10), shared.trim); hub.rotation.z = Math.PI / 2; w.add(hub);
    w.traverse(o => { if (o.isMesh) o.castShadow = true; }); return w;
  }
  function makeCar(kindName, colour) {
    const K = KINDS[kindName], paint = toon(colour), G = new THREE.Group(), L = K.L, W = K.W, zf = L / 2;
    // the body, lofted: along its length a string of rounded cross-sections (a superellipse: a box with its corners rounded), their
    // tops following the car's profile (bonnet, waist, boot), their bottoms lifting over the wheels (the arches), narrowing a little
    // towards the top (tumblehome) and towards the ends (so its corners are round seen from above too)
    const rearX = K.OF + K.WB, frontX = K.OF, R = K.R + .05, pts = K.body, base = pts.reduce((m, p) => Math.max(m, p[1]), 0) - .04;
    const topAt = x => { for (let k = 1; k < pts.length; k++) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; if (x1 > x0 && x >= x0 && x <= x1) { const t = (x - x0) / (x1 - x0); return y0 + (y1 - y0) * t * t * (3 - 2 * t); } } return base; };
    const botAt = x => { let b = .3; for (const c of [frontX, rearX]) { const d = x - c; if (Math.abs(d) < R) b = Math.max(b, K.R + .02 + Math.sqrt(R * R - d * d) * .92); } return b; };
    const se = (a, n) => Math.sign(a) * Math.pow(Math.abs(a), 2 / n);
    function loft(x0, x1, nz, sect, mats) {                              // sect(x, th) → [x across, y]; mats(x, th) → material group
      const nv = 20, pos = [], idx = [], groups = [];
      for (let a = 0; a <= nz; a++) { const x = x0 + (x1 - x0) * a / nz; for (let v = 0; v <= nv; v++) { const [cx, cy] = sect(x, v / nv * Math.PI * 2); pos.push(cx, cy, zf - x); } }   // (x from the front: z = zf - x)
      const faces = [[], []];
      for (let a = 0; a < nz; a++) for (let v = 0; v < nv; v++) { const k = a * (nv + 1) + v, g = mats ? mats(x0 + (x1 - x0) * (a + .5) / nz, (v + .5) / nv * Math.PI * 2) : 0; faces[g].push(k, k + nv + 1, k + 1, k + 1, k + nv + 1, k + nv + 2); }   // (wound so they face out)
      const cap = (a, flip) => { const c0 = pos.length / 3, x = x0 + (x1 - x0) * a / nz; let sx = 0, sy = 0; for (let v = 0; v < nv; v++) { sx += pos[(a * (nv + 1) + v) * 3]; sy += pos[(a * (nv + 1) + v) * 3 + 1]; } pos.push(sx / nv, sy / nv, zf - x);
        for (let v = 0; v < nv; v++) { const k = a * (nv + 1) + v; if (flip) faces[0].push(c0, k + 1, k); else faces[0].push(c0, k, k + 1); } };
      cap(0, false); cap(nz, true);
      // two meshes on the same points: the paint, and the glass (see-through, so drawn apart from the paint; one mesh with the two
      // lost its roof); the glass gets its streak from its own place along the car and up it
      const pa = new THREE.Float32BufferAttribute(pos, 3), mk = (ix, m) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', pa); g.setIndex(ix); g.computeVertexNormals(); const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; G.add(o); return o; };
      const o = mk(faces[0], paint);
      if (mats && faces[1].length) { const gl = mk(faces[1], shared.glass), n = pos.length / 3, uv = new Float32Array(n * 2); for (let k = 0; k < n; k++) { uv[k * 2] = (zf - pos[k * 3 + 2]) * .9 + pos[k * 3] * .35; uv[k * 2 + 1] = pos[k * 3 + 1] * 1.6; } gl.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); gl.castShadow = false; }
      return o;
    }
    loft(0, L, 44, (x, th) => { const e = Math.min(x, L - x), taper = 1 - .1 * Math.pow(1 - Math.min(1, e / .45), 2), top = topAt(x), bot = botAt(x), mid = (top + bot) / 2, hh = (top - bot) / 2;
      const cy = mid + hh * se(Math.sin(th), K.sq), up = Math.max(0, (cy - mid) / (hh || 1)); return [(W / 2) * taper * (1 - .07 * up) * se(Math.cos(th), K.sq), cy]; });
    // the glasshouse: the same, from the windscreen's foot to the back window's; its top the roof (in the paint), its sides glass, the
    // pillars (the windscreen's, the one between the doors, the rear quarter's) in the paint
    const [a0, a1, b0, b1, gh] = K.gh, roofAt = x => x < b0 ? (x - a0) / (b0 - a0) : x > b1 ? (a1 - x) / (a1 - b1) : 1, ease = t => Math.max(0, Math.min(1, t)) ** .8;
    const doors4 = kindName === 'saloon' || kindName === 'estate' || K.four, mB = (a0 + a1) / 2 - .05;
    loft(a0, a1, 30, (x, th) => { const r = ease(roofAt(x)), top = base + .02 + gh * r, hw = (W / 2 - .07) * (1 - (K.box ? .03 : .07) * r), y = Math.sin(th), gs = K.box ? 6 : 5;
      if (y < 0) return [hw * se(Math.cos(th), gs), base - .01]; return [hw * (1 - (K.box ? .02 : .06) * y) * se(Math.cos(th), gs), base + (top - base) * se(y, gs)]; },
      // what is glass: the windscreen and the back window across (faces looking forward, back or up); on the sides a window from the
      // A-pillar's line to the C-pillar's, both leaning as the glass does (so the window's ends run along the frame, not upright), parted
      // by a B-pillar (between the doors of a four-door; on a two-door, ahead of a small rear quarter window); roof and sills in paint
      (x, th) => { const y = Math.sin(th), c = Math.abs(Math.cos(th)), gs = K.box ? 6 : 5, yn = se(Math.max(0, y), gs);
        if (y < 0 || x < a0 + .05) return 0;                                            // (under; the seal at the windscreen's foot)
        if (c < .55) { if (x < b0) return 1; if (x > b1) return x > a1 - .06 ? 0 : 1; return 0; }   // the windscreen, the back window, the roof
        if (yn > .86 || yn < .1) return 0;                                                // (the roof's edge over the side glass; the sill under)
        const xf = a0 + .12 + (b0 - a0) * yn * .92, xr = Math.min(K.glassTo || 99, a1 - .12 - (a1 - b1) * yn * .9);   // the A- and C-pillars' lines
        if (x < xf || x > xr) return 0;
        if (K.pillars) { if (((x - xf) % K.pillars) < .1) return 0; }                     // (a bus: a pillar every so often)
        else if (!K.glassTo) { const xb = doors4 ? mB : xf + (xr - xf) * .68, lean = (yn - .5) * .08; if (Math.abs(x - xb - lean) < .045) return 0; }   // the B-pillar, leaning a touch
        return 1; });
    // front and back: bumpers, lights, grille, plates; wheels
    const fz = L / 2, bz = -L / 2, by = K.R + .1;
    const nose = topAt(.1), hy = Math.min(by + .22, nose - .08), gy = Math.min(by + .22, nose - .1);   // (how high the nose is: what is on it stays under its top)
    const bumpM = K.chrome ? shared.chrome : shared.trim, bh = K.bigBumpers ? .26 : K.chrome ? .1 : .18, bd = K.bigBumpers ? .2 : .14;
    G.add(box(W - .02, bh, bd, bumpM, 0, by, fz + .02)); G.add(box(W - .02, bh, bd, bumpM, 0, by, bz - .02));
    for (const sd of [-1, 1]) { if (K.round) { const hl = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .05, 12), shared.head); hl.rotation.x = Math.PI / 2; hl.position.set(sd * (W / 2 - .22), Math.min(by + .24, nose - .1), fz + .03); G.add(hl); const rimL = new THREE.Mesh(new THREE.TorusGeometry(.088, .016, 5, 12), shared.chrome); rimL.position.copy(hl.position); rimL.position.z += .02; G.add(rimL); } else if (K.slit) G.add(box(.42, .045, .06, shared.head, sd * (W / 2 - .3), nose - .06, fz + .01)); else G.add(box(.34, .12, .06, shared.head, sd * (W / 2 - .27), hy, fz + .03)); G.add(box(.1, .08, .06, shared.amber, sd * (W / 2 - .06), Math.min(by + .2, nose - .08), fz + .01));
      // the rear light cluster: the red lamp with its bright heart, a white reversing lamp, an amber indicator, a dark rim
      const lx = sd * (W / 2 - .26); G.add(box(.46, .2, .05, shared.dark, lx, by + .25, bz - .025)); G.add(box(.3, .15, .06, shared.tail, lx + sd * .06, by + .25, bz - .035));
      G.add(box(.14, .06, .065, shared.tailHi, lx + sd * .08, by + .27, bz - .04)); G.add(box(.08, .15, .06, shared.reverse, lx - sd * .14, by + .25, bz - .035)); G.add(box(.06, .15, .06, shared.amber, lx + sd * .2, by + .25, bz - .035)); }
    G.add(box(W - .5, .035, .05, shared.chrome, 0, by + .37, bz - .03));                                            // a chrome strip across the boot
    for (const z of [fz + .1, bz - .1]) G.add(box(W - .06, .03, .03, shared.chrome, 0, by + .1, z));                   // chrome on the bumpers
    if (K.tallGrille) { G.add(box(.46, .3, .06, shared.chrome, 0, by + .28, fz + .03)); G.add(box(.38, .24, .07, shared.dark, 0, by + .28, fz + .035)); for (let k = 0; k < 5; k++) G.add(box(.012, .22, .08, shared.chrome, -.14 + k * .07, by + .28, fz + .04)); }   // (tall, framed in chrome)
    else if (!K.noGrille) { G.add(box(W * .42, .14, .05, shared.dark, 0, gy, fz + .03)); for (let k = 0; k < 3; k++) G.add(box(W * .4, .012, .02, shared.chrome, 0, gy - .05 + k * .045, fz + .06)); }   // the grille and its bars
    else if (!K.intake) G.add(box(W * .5, .02, .04, shared.chrome, 0, Math.min(by + .4, nose - .03), fz + .02));
    if (K.intake) { G.add(box(W * .62, .06, .06, shared.dark, 0, by - .02, fz + .06)); for (let k = 0; k < 4; k++) G.add(box(.012, .05, .07, shared.trim, -W * .24 + k * W * .16, by - .02, fz + .065)); }   // (a low intake, with fins)                                        // (no grille: a chrome strip across the nose)
    if (K.rearVents) for (let k = 0; k < 6; k++) G.add(box(W * .5, .015, .04, shared.dark, 0, by + .42 + k * .04, bz - .01 + k * .012));   // (the engine's louvres at the back)
    if (K.slats) for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) G.add(box(.02, .16, .035, shared.dark, sd * (W / 2 - .1), base + .2, fz - K.gh[3] - .22 - k * .07));   // (slats on the rear pillar)
    if (K.backDoors) { G.add(box(.02, 1.1, .02, shared.dark, 0, base + .3, bz - .005)); for (const sd of [-1, 1]) G.add(box(.1, .04, .03, shared.chrome, sd * .12, base + .25, bz - .01)); G.add(box(W - .1, .03, L - .3, shared.trim, 0, base + 1.02, 0)); }   // (the box's back doors, its roof rail)
    G.add(box(.5, .12, .03, shared.plate, 0, by, fz + .1)); G.add(box(.5, .12, .03, shared.plate, 0, by + .14, bz - .1));
    const four = kindName === 'saloon' || kindName === 'estate' || K.four, d1 = fz - K.OF - 1.3, d0 = fz - a0 + .05;
    for (const sd of [-1, 1]) { const x = sd * (W / 2 + .005);
      G.add(box(.02, .5, .02, shared.dark, x, base - .32, d1)); G.add(box(.02, .5, .02, shared.dark, x, base - .32, d0)); G.add(box(.03, .04, .14, shared.chrome, sd * (W / 2 + .01), base - .12, d1 + .35));   // the front door's lines, its handle
      if (four) { G.add(box(.02, .5, .02, shared.dark, x, base - .32, d1 - .95)); G.add(box(.03, .04, .14, shared.chrome, sd * (W / 2 + .01), base - .12, d1 - .6)); }   // the back door
      G.add(box(.04, .03, L - 1.9, shared.trim, sd * (W / 2 + .01), base - .2, fz - L / 2));                          // the rubbing strip
      G.add(box(.05, .1, K.WB - 2 * R - .05, shared.dark, sd * (W / 2 - .01), K.R + .06, fz - K.OF - K.WB / 2));    // the sill between the wheels
      G.add(box(.1, .09, .16, paint, sd * (W / 2 + .06), base + .08, fz - a0 - .15)); }   // the mirrors
    for (const zz of [frontX, rearX]) G.add(box(W - .34, R * 1.3, R * 1.9, shared.well, 0, K.R + .12, fz - zz));        // dark in the arches
    { const sh = new THREE.Mesh(new THREE.PlaneGeometry(W + .5, L + .5), shadeM); sh.rotation.x = -Math.PI / 2; sh.position.y = .02; sh.renderOrder = 1; G.add(sh); sh.userData.noShadow = true; }   // the shade under it
    if (K.wing) { const wm = paint; G.add(box(W - .2, .04, .32, wm, 0, 1.02, -L / 2 + .25)); for (const sd of [-1, 1]) G.add(box(.05, .2, .18, wm, sd * (W / 2 - .3), .9, -L / 2 + .28));   // the rear wing on its stands
      for (let k = 0; k < 5; k++) G.add(box(W * .6, .015, .05, shared.dark, 0, .78, -L / 2 + .7 + k * .09)); }                                                     // (louvres over the engine)
    if (K.bed) { const bx0 = K.gh[1] + .03, bl = L - bx0 - .04, zc = fz - (bx0 + bl / 2), bedM = shared.trim;   // the bed: from the cab's back wall to the tail
      G.add(box(W - .14, .05, bl, bedM, 0, base - .02, zc)); for (const sd of [-1, 1]) { G.add(box(.07, .38, bl, paint, sd * (W / 2 - .04), base + .17, zc)); G.add(box(.1, .03, bl + .05, shared.trim, sd * (W / 2 - .04), base + .37, zc)); }
      G.add(box(W - .06, .46, .07, paint, 0, base + .21, fz - bx0)); G.add(box(W - .06, .38, .07, paint, 0, base + .17, fz - (L - .04))); G.add(box(W * .5, .04, .08, shared.chrome, 0, base + .28, fz - L)); }
    // inside, seen through the glass: the dashboard, the two front seats, a bench at the back (not in a van's or a pickup's cab)
    if (K.bus) { for (let x = 2.4; x < K.L - 1; x += 1.25) for (const sd of [-1, 1]) G.add(box(W * .34, .7, .14, shared.seat, sd * W * .24, base + .12, fz - x));   // rows of seats
      for (const zz of [fz - 1.1, fz - 5.6]) for (const sd of [-1, 1]) G.add(box(.04, 1.95, 1.05, shared.dark, sd * (W / 2 + .005), base + .55, zz));   // the doors
      // its roof, pale, with the air unit and two hatches; the windscreen and the back window (the box's ends are paint: glass laid on
      // them, dark behind it), the destination sign lit amber over the windscreen
      const gh = K.gh[4], top = base + .02 + gh, zf0 = fz - K.gh[0], zb0 = fz - K.gh[1];
      G.add(box(W - .42, .05, L - 1.1, busRoof, 0, top + .02, -.1));                                  // the roof panel, pale
      for (const sd of [-1, 1]) { const ch = box(.2, .2, L - .5, paint, sd * (W / 2 - .09), top - .06, -.05); ch.rotation.z = sd * .78; G.add(ch);   // its edges chamfered in the paint, a gutter along each
        G.add(box(.05, .05, L - .8, shared.trim, sd * (W / 2 - .21), top + .05, -.1)); }
      for (let z = -L / 2 + 1; z < L / 2 - .8; z += 1.3) G.add(box(W - .5, .025, .06, busRib, 0, top + .055, z));   // ribs across it
      { const u = new THREE.Group(); u.position.set(0, top + .05, -.9); G.add(u); u.add(box(1.5, .26, 1.4, busUnit, 0, .13, 0)); u.add(box(1.56, .04, 1.46, shared.trim, 0, .28, 0));   // the air unit: two fans, a grille
        for (const zz of [-.35, .35]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .04, 12), shared.dark); f.position.set(0, .3, zz); u.add(f); u.add(box(.5, .02, .04, shared.trim, 0, .325, zz)); }
        for (let x = -.6; x <= .6; x += .15) u.add(box(.04, .12, .02, shared.dark, x, .13, .71)); }
      for (const zz of [2.6, -3.3]) { G.add(box(.64, .07, .64, shared.dark, 0, top + .07, zz)); G.add(box(.66, .02, .08, shared.chrome, 0, top + .11, zz - .3)); }   // hatches, their hinges
      G.add(box(.03, .5, .03, shared.dark, W * .3, top + .28, 3.4));                                   // an aerial
      { const cap = box(W - .3, .14, .5, paint, 0, top - .02, zf0 - .2); cap.rotation.x = .35; G.add(cap); }   // over the windscreen, sloping
      for (const [z0, sg, hh, wd] of [[zf0, 1, gh * .7, W - .24], [zb0, -1, gh * .45, W - .5]]) { G.add(box(wd, hh, .02, shared.dark, 0, base + gh * (sg > 0 ? .45 : .62), z0 + sg * .012)); G.add(box(wd, hh, .03, shared.glass, 0, base + gh * (sg > 0 ? .45 : .62), z0 + sg * .03)); }
      G.add(box(W - .34, .24, .04, busSign, 0, top - .2, zf0 + .04)); }
    else { const a0 = K.gh[0], a1 = Math.min(K.gh[1], K.glassTo || 99), span = a1 - a0, xs = a0 + span * (K.glassTo ? .55 : .42);
      G.add(box(W * .84, .14, .34, shared.dark, 0, base + .02, fz - (a0 + .38)));
      const hS = K.gh[4];                                                  // (the cabin's height over the waist: the seats kept well under the roof)
      for (const sd of [-1, 1]) { G.add(box(W * .34, hS * .72, .14, shared.seat, sd * W * .21, base - .05 + hS * .36, fz - xs)); G.add(box(W * .24, hS * .18, .12, shared.seat, sd * W * .21, base - .05 + hS * .8, fz - xs + .02)); }
      if (!K.glassTo && span > 2) G.add(box(W * .8, hS * .66, .16, shared.seat, 0, base - .05 + hS * .33, fz - (a0 + span * .78))); }
    const wheels = [];
    for (const [x, zz] of [[1, frontX], [-1, frontX], [1, rearX], [-1, rearX]]) { const w = wheel(K.R, paint); w.position.set(x * (W / 2 - .1), K.R, fz - zz); G.add(w); wheels.push(w); }
    G.traverse(o => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; } });
    return { group: G, wheels, half: [W / 2, L / 2], kind: kindName, R: K.R };
  }
  function spin(car, metres) { for (const w of car.wheels) w.rotation.x += metres / car.R; }
  const COLOURS = { bus: ['#c8323a', '#e3b83a', '#3f6b35', '#e9e3d1'], common: ['#c9b77a', '#7b5836', '#8e2e25', '#34465a', '#9aa0a4', '#e9e3d1', '#355f31', '#8fb0bd', '#a3322a', '#5a5f66'], wedge: ['#cf5a3e', '#efc970', '#f6f3ea', '#17181b'],
    micro: ['#e9e3d1', '#8e2e25', '#efc970', '#8fb0bd', '#355f31', '#c9b77a', '#cf5a3e'], twostroke: ['#b7c4a0', '#8fb0bd', '#e9e3d1', '#c9b77a', '#9aa0a4', '#d9c9a0'], van: ['#5f7a4e', '#8e2e25', '#9aa0a4', '#34465a', '#e9e3d1'], barge: ['#e9e3d1', '#34465a', '#7b5836', '#17181b', '#9aa0a4'] };
  const MIX = [['liftback', .18], ['pickup', .14], ['estate', .14], ['saloon', .11], ['fastback', .12], ['micro', .1], ['barge', .08], ['twostroke', .06], ['van', .05], ['hatch', .02], ['wedge', .03]];   // (how often each is on the street)
  const random = r => { let x = r() * MIX.reduce((a, [, w]) => a + w, 0), k = MIX[0][0]; for (const [n, w] of MIX) { if ((x -= w) < 0) { k = n; break; } } const pal = COLOURS[COLOURS[k] ? k : 'common']; return makeCar(k, pal[r() * pal.length | 0]); };
  return { makeCar, random, spin, KINDS, COLOURS };
}
