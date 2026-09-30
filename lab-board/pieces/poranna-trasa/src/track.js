// The test street: a loop of suburban road (about 700 m) with bends and gentle hills, in metres. Across it: the asphalt (7 m),
// the kerbs, a grass verge, the pavement, the front lawns. Along it: houses (windows with frames, glazing bars, shutters and flower
// boxes; porches with rails and steps; a path or a drive to a garage door; bushes and beds in bloom at the walls), each with its
// mailbox by the pavement; street trees on the verge, their crowns over the road, their dappled shadows on it; other trees, some
// already turning, spruces behind the houses; telegraph poles with their wires, street lamps, drains in the gutters, hydrants,
// wheelie bins, picket fences and hedges, parked cars (in the street and on the drives). Between the houses: side fences, sheds,
// washing lines, log stacks, sandboxes, bird baths. On the road and the pavement: cones, bin bags, a child's wagon, road works,
// potholes, open manholes, wooden ramps, bundles of papers. All the still things are merged, by material, into a few big meshes.
// What stops a bike is kept as boxes on the ground (colliders, found by where along the road they are); a house's windows (to be
// broken) and the spot before its door (a paper there is delivered) are kept as targets.
// probe() says, for a point, where on the road it is: how far along, how far off the middle (+ right), the ground's height there,
// the road's direction, its slope.

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCars } from './cars.js';
import { createProps } from './props.js';

export function createTrack({ THREE, toon, tex, showcase = false }) {   // (showcase: for the workshop; nothing merged, each house, tree, shack kept by itself in show)
  const G = new THREE.Group();
  // ---------- the line of the road ----------
  const ctrl = [[0, 0, 0], [0, 1, 60], [18, 3, 120], [60, 5, 160], [115, 4, 170], [160, 2, 150], [185, 0, 105], [180, -1, 50], [150, -2, 5], [150, -1, -45],
    [175, 1, -90], [160, 3, -140], [110, 4, -165], [55, 2, -150], [15, 0, -110], [-5, -1, -55]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
  const N = 1600, pts = curve.getSpacedPoints(N); pts.pop();          // (closed: the last is the first)
  { const L0 = curve.getLength(); pts.forEach((p, i) => { const u = i / N * L0; p.y += Math.sin(u / (L0 / Math.round(L0 / 62)) * 6.283) * .55 + Math.sin(u / (L0 / Math.round(L0 / 27)) * 6.283 + 1.3) * .22; }); }   // (a gentle roll: rises of half a metre; a whole number of them round the loop, so no step where it closes)
  const S = pts.map((p, i) => { const q = pts[(i + 1) % N], o = pts[(i + N - 1) % N], f = new THREE.Vector3(q.x - o.x, 0, q.z - o.z).normalize(); return { p, f, r: new THREE.Vector3(-f.z, 0, f.x) }; });
  const len = curve.getLength(), ds = len / N;
  // the cross-section: [offset from the middle (+ right), height]
  const ROAD = 3.5, KERB = 3.65, VERGE = 5.0, PAVE = 6.6;
  function hAt(d, i = 0) { const a = Math.abs(d); return (a <= ROAD ? 0 : a <= KERB ? (a - ROAD) / (KERB - ROAD) * .14 : .14 + Math.min(.02, (a - KERB) * .01)) + terr(d, i); }
  function terr(d, i) {                                                // (nothing near the road and the houses; then rolling land, rising the farther out)
    const a = Math.abs(d); if (a < 14) return 0; const w = Math.min(1, (a - 14) / 28), sd = d < 0 ? 1.7 : 4.1, u = (((i % N) + N) % N) * ds, Lp = N * ds, t = u / Lp;
    const f = u => w * w * (3.2 * vnoise(u * .016, sd) + 1.4 * vnoise(u * .045 + a * .02, sd + 5) - 1.2) + Math.max(0, a - 42) * (.04 + .05 * vnoise(u * .01, sd + 9));
    return f(u) * (1 - t) + f(u - Lp) * t; }                            // (blended with itself a loop back: the same where the loop closes)
  const noise = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = noise(xi, zi), b = noise(xi + 1, zi), c = noise(xi, zi + 1), d = noise(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  // a strip along the whole loop between two offsets, coloured per vertex
  function strip(d0, d1, col, vary = .08, scale = .35, map = null, tile = 1) {   // (map: a pixel texture, tile: metres it covers, or [across, along])
    const tu = Array.isArray(tile) ? tile[0] : tile, tv = Array.isArray(tile) ? tile[1] : tile;
    if (d0 > d1) [d0, d1] = [d1, d0];                                   // (left to right, so its faces look up)
    const pos = [], colr = [], idx = [], uvs = [], c = new THREE.Color(col), t = new THREE.Color();
    for (let i = 0; i <= N; i++) { const s = S[i % N];
      for (const d of [d0, d1]) { const x = s.p.x + s.r.x * d, z = s.p.z + s.r.z * d, y = s.p.y + hAt((d0 + d1) / 2 < 0 ? -Math.abs(d) : Math.abs(d)) + (Math.abs(d) === KERB && Math.abs(d0) === ROAD ? 0 : 0);
        pos.push(x, s.p.y + hAt(d, i), z); uvs.push(d / tu, i * ds / tv); const k = 1 + (vnoise(x * scale, z * scale) - .5) * 2 * vary + (noise(x * 3.1, z * 3.3) - .5) * vary * .6; t.copy(c).multiplyScalar(k); colr.push(t.r, t.g, t.b); } }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, map })); m.receiveShadow = true; G.add(m); return m;
  }
  const INNER = Math.sign((90 - S[0].p.x) * S[0].r.x + (0 - S[0].p.z) * S[0].r.z) || 1;   // (which side the loop's inside is on)
  strip(-ROAD + .32, ROAD - .32, '#3f4246', .1, .25, tex.asphalt(), 2.4);   // the asphalt: patchy, grainy
  for (const s of [-1, 1]) {
    strip(s * (ROAD - .32), s * ROAD, '#323437', .16, .5, tex.asphalt(), 2.4);   // the gutter: darker, dirtier
    strip(s * ROAD, s * KERB, '#9c9a91', .05, .35, tex.kerbBlock(), [1, 4]); strip(s * KERB, s * (KERB + .18), '#cbc8bd', .05, .35, tex.kerbBlock(), [1, 4]);   // the kerb in metre blocks: its face in shade, its top lit
    strip(s * (KERB + .18), s * VERGE, '#6f8f3e', .14, .6, tex.grass(0), 1.3);   // the verge
    strip(s * VERGE, s * PAVE, '#bcb6a6', .05, .5, tex.slabs(), 3.2);        // the pavement, in slabs
    strip(s * PAVE, s * 14, '#7c9a45', .16, .12, tex.grass(4), 1.6);         // the lawns (a few flowers)
    for (const [a, b] of (s === INNER ? [[14, 20], [20, 28], [28, 40]] : [[14, 20], [20, 28], [28, 38], [38, 52], [52, 72], [72, 84], [88, 100], [100, 135], [135, 170], [170, 200]])) strip(s * a, s * b, '#78963f', .2, .08, tex.grass(2), 2.2);
    if (s !== INNER) { strip(s * 84, s * 88, '#55595e', .06, .5, tex.asphalt(), 3); strip(s * 83.4, s * 84, '#a8a08a', .1, .5, null, 1); strip(s * 88, s * 88.6, '#a8a08a', .1, .5, null, 1); }   // (a country road out there, gravel edges)   // the land beyond, rolling (inside the loop: not so far, the other side of it is there)
  }
  // the lines: a dashed one down the middle, a solid one near each edge
  { const pos = [], idx = []; let n = 0; const quad = (i0, i1, d0, d1) => { for (const [i, d] of [[i0, d0], [i0, d1], [i1, d0], [i1, d1]]) { const s = S[i % N]; pos.push(s.p.x + s.r.x * d, s.p.y + .012, s.p.z + s.r.z * d); } idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; };
    const dash = Math.round(3 / ds), gap = Math.round(5 / ds);
    for (let i = 0; i < N; i += dash + gap) quad(i, i + dash, -.07, .07);
    for (let i = 0; i < N; i += 2) for (const s of [-1, 1]) quad(i, i + 2, s * 3.15, s * 3.27);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon('#e8e4d6')); m.receiveShadow = true; G.add(m); }
  // the small things on the ground, all one mesh (coloured per vertex, lit as the ground is: normals up):
  // leaves (two-tone, pointed) strewn on the road and drifted thick in the gutters and against the kerb; grass tufts hanging over the
  // kerb and along the pavement's edges; flowers in clumps on the verges and at the lawns' edges
  { const pos = [], colr = [], r = mulberry(7), C = c => new THREE.Color(c);
    const g0 = (i, d) => { const fi = Math.floor(i), fr = (i - fi) * ds, s = S[((fi % N) + N) % N]; return [s.p.x + s.r.x * d + s.f.x * fr, s.p.y + hAt(d, fi), s.p.z + s.r.z * d + s.f.z * fr, s]; };
    const tri = (a, b, c, ca, cb = ca, cc = ca) => { pos.push(...a, ...b, ...c); colr.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); };
    const LEAF = [['#d9a441', '#b86a2e'], ['#e08556', '#b3392d'], ['#efc970', '#d9a441'], ['#c98a2e', '#7b5836'], ['#cf5a3e', '#8e2e25'], ['#b86a2e', '#5e1c17'], ['#98b85a', '#7c8446']].map(([a, b]) => [C(a), C(b)]);
    function leaf(i, d, lift = .014) { const [x, y, z, s] = g0(i + r() * .9, d), a = r() * 6.28, L = .12 + r() * .1, w = L * (.5 + r() * .2), fx = Math.cos(a), fz = Math.sin(a), [c1, c2] = LEAF[r() * (r() < .9 ? 6 : 7) | 0];
      const Y = y + lift + r() * .006, tip = [x + fx * L / 2, Y, z + fz * L / 2], back = [x - fx * L / 2, Y, z - fz * L / 2], lft = [x - fz * w / 2, Y, z + fx * w / 2], rgt = [x + fz * w / 2, Y, z - fx * w / 2];
      tri(back, tip, lft, c1); tri(back, rgt, tip, c2); }                // (lit half, shaded half: a leaf's fold)
    for (let k = 0; k < 2200; k++) leaf(r() * N, (r() - .5) * 2 * (ROAD - .4));                                 // strewn on the road
    for (let k = 0; k < 17000; k++) { const i = r() * N, clump = vnoise(i * .045, 3.1); if (clump < .32 && r() < .85) continue;   // drifted in the gutters (in heaps, not evenly)
      const sd = r() < .5 ? -1 : 1; leaf(i, sd * (ROAD - .015 - Math.pow(r(), 2.4) * .5), .014 + r() * .02); }
    for (let k = 0; k < 4200; k++) { const sd = r() < .5 ? -1 : 1, i = r() * N; leaf(i, sd * (KERB + .02 + Math.pow(r(), 1.6) * .7), .02); }   // on the kerb's top and the verge's edge
    // grass: a tuft is three blades, dark at the root, light (now and then dry) at the tip
    const ROOT = [C('#284a2b'), C('#355f31')], TIP = [C('#5b8a3c'), C('#77a146'), C('#98b85a'), C('#c2cf7e'), C('#d9a441')];
    function tuft(i, d, h, lean) { const [x, y, z, s] = g0(i, d), rx = s.r.x, rz = s.r.z, fx = s.f.x, fz = s.f.z;
      for (let b = 0; b < 3; b++) { const o = (b - 1) * .025 + (r() - .5) * .02, bx = x + fx * o, bz = z + fz * o, hh = h * (.7 + r() * .5), ln = lean + (r() - .5) * .05, tw = (r() - .5) * .05;
        const w = .022, root = ROOT[r() * 2 | 0], tip = TIP[r() < .08 ? 4 : (r() * 4 | 0)];
        tri([bx - fx * w, y, bz - fz * w], [bx + fx * w, y, bz + fz * w], [bx + rx * ln + fx * tw, y + hh, bz + rz * ln + fz * tw], root, root, tip); } }
    for (const sd of [-1, 1]) {
      for (let i = 0; i < N; i += .09 / ds * (.6 + r() * .8)) tuft(i, sd * (KERB + .2 + r() * .1), .11 + r() * .12, -sd * (.06 + r() * .08));   // over the kerb's top, leaning out to the road
      for (let i = 0; i < N; i += .3 / ds * (.5 + r())) tuft(i, sd * (VERGE - .03 - r() * .05), .06 + r() * .07, sd * .02);                  // the verge against the pavement
      for (let i = 0; i < N; i += .3 / ds * (.5 + r())) tuft(i, sd * (PAVE + .03 + r() * .06), .07 + r() * .08, sd * .03);                   // the lawn against the pavement
      for (let k = 0; k < 1800; k++) tuft(r() * N, sd * (KERB + .35 + r() * (VERGE - KERB - .5)), .06 + r() * .06, (r() - .5) * .06);      // tufts about the verge
    }
    // flowers: a stem and a small head, in clumps (mostly white, some yellow, pink, lilac, red)
    const STEM = C('#467537'), HEAD = ['#f6f3ea', '#f6f3ea', '#f6f3ea', '#efc970', '#f3a6c0', '#b7a4e0', '#cf5a3e'].map(C), EYE = C('#efc970');
    function flower(x, y, z, h, col) { const t = [x, y + h, z], e = .028;
      tri([x - .008, y, z], [x + .008, y, z], t, STEM, STEM, STEM);
      const T = [x, y + h + e, z], Bm = [x, y + h - e * .5, z], P = [[x + e, y + h, z], [x, y + h, z + e], [x - e, y + h, z], [x, y + h, z - e]];
      for (let k = 0; k < 4; k++) { const a = P[k], b = P[(k + 1) % 4]; tri(a, b, T, col, col, col === HEAD[0] ? EYE : col); tri(b, a, Bm, col); } }
    for (let k = 0; k < 520; k++) { const sd = r() < .5 ? -1 : 1, lawn = r() < .5, i = r() * N, d = sd * (lawn ? PAVE + .25 + r() * 1.4 : KERB + .45 + r() * (VERGE - KERB - .7)), col = HEAD[r() * HEAD.length | 0];
      const [cx, , cz, s] = g0(i, d); for (let f = 0; f < 5 + (r() * 9 | 0); f++) { const a = r() * 6.28, rr = Math.sqrt(r()) * .32, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        flower(x, s.p.y + hAt(d, i), z, .07 + r() * .13, r() < .8 ? col : HEAD[r() * HEAD.length | 0]); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    const nr = new Float32Array(pos.length); for (let k = 1; k < nr.length; k += 3) nr[k] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));   // (lit as the ground under them)
    const m = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })); m.receiveShadow = true; G.add(m); }

  // ---------- the things along it ----------
  const rnd = mulberry(11);
  // ---------- what stops a bike, and what a paper can hit ----------
  const colliders = [], BK = 16, NB = Math.ceil(N / BK), buckets = Array.from({ length: NB }, () => []), windows = [], doors = [];
  // places a tree must not grow in: a drive, a path, a porch (kept here, not in the colliders: nothing stops a bike there)
  const keepOut = [];
  const show = { house: [], tree: [], shacks: [], farm: [] }, rr = mulberry(53);   // (rr: for what came later, so the older layout stays)   // (what was built, one by one: for the workshop)
  function zone(o, hx, hz, ox = 0, oz = 0) { const yaw = o.rotation.y, c = Math.cos(yaw), sn = Math.sin(yaw); keepOut.push({ x: o.position.x + ox * c + oz * sn, z: o.position.z - ox * sn + oz * c, c, s: sn, hx, hz }); }
  function free(i, d, r) {                                             // (nothing there: a house, a car, a fence, a drive, a porch)
    const p = at(i, d), over = C => { const dx = p.x - C.x, dz = p.z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; return Math.abs(lx) < C.hx + r && Math.abs(lz) < C.hz + r; };
    for (const C of near(i)) if (C.kind === 'hard' || C.kind === 'soft') { if (over(C)) return false; }
    for (const Z of keepOut) if (Math.abs(Z.x - p.x) + Math.abs(Z.z - p.z) < 40 && over(Z)) return false;
    return true;
  }
  function hit(o, spec, i, ox = 0, oz = 0) {                         // spec in o's space ({ hx, hz, h, kind }), o already placed (i: where along the road)
    const yaw = o.rotation.y, c = Math.cos(yaw), sn = Math.sin(yaw), x = o.position.x + ox * c + oz * sn, z = o.position.z - ox * sn + oz * c;
    const C = { x, z, c, s: sn, hx: spec.hx, hz: spec.hz, h: spec.h, y0: o.position.y, kind: spec.kind, size: spec.size, i, o, used: false }; colliders.push(C);
    const reach = Math.ceil(Math.max(spec.hx, spec.hz) / ds / BK) + 1, b0 = Math.floor(i / BK);
    for (let k = -reach; k <= reach; k++) buckets[((b0 + k) % NB + NB) % NB].push(C); return C;
  }
  function near(i) { const b0 = Math.floor(((i % N) + N) % N / BK), out = new Set(); for (let k = -1; k <= 1; k++) for (const C of buckets[((b0 + k) % NB + NB) % NB]) out.add(C); return out; }
  const at = (i, d, y = 0) => { const s = S[((i % N) + N) % N]; return new THREE.Vector3(s.p.x + s.r.x * d, s.p.y + hAt(d, i) + y, s.p.z + s.r.z * d); };
  const yawOf = i => { const f = S[((i % N) + N) % N].f; return Math.atan2(f.x, f.z); };   // (a thing's +z along the road)
  const put = (o, i, d, y = 0, turn = 0) => { o.position.copy(at(i, d, y)); o.rotation.y = yawOf(i) + turn; o.traverse(c => { if (c.isMesh && !c.userData.noShadow) { c.castShadow = true; c.receiveShadow = true; } }); G.add(o); return o; };
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
  const WALLS = ['#b7c29a', '#e8dcc0', '#f0ece2', '#e3c77e', '#a9bccb', '#d8b8a0'], ROOFS = ['#8e3b2c', '#6d4a3a', '#5a5f66', '#9a4a32'].map(c => toon(c, { map: tex.shingles() }));   // (the roofs' UVs are in metres: a texture a metre)
  const wallM = (c, w, h) => { const t = tex.siding().clone(); t.repeat.set(w / 1.3, h / 1.3); t.needsUpdate = true; return toon(c, { map: t }); };   // (boards about 16 cm)
  const white = toon('#f3efe4'), dark = toon('#2a2c30'), glass = toon('#3f5566'), grey = toon('#8d9194'), red = toon('#b3372c');
  const wood = toon('#6b4a2e', { map: (() => { const t = tex.bark().clone(); t.repeat.set(1, 6); t.needsUpdate = true; return t; })() });
  const SHUT = ['#2f4a3a', '#34465a', '#5a2f2a', '#3a3530'].map(c => toon(c)), woodBox = toon('#6b4a2e');
  // small painted textures for the houses (in colour: their materials are white)
  const paint = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  // a window's glass: dark, the sky's streak across it, curtains drawn to the sides and a pelmet over them
  const WINS = ['#e9e3d1', '#f6f3ea', '#efc970', '#d8b8a0'].map(cur => toon('#ffffff', { map: paint(16, 16, g => {
    g.fillStyle = '#2b3d49'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#3a5261'; g.fillRect(0, 0, 16, 6);
    g.fillStyle = '#8fb0bd'; for (let k = 0; k < 7; k++) g.fillRect(4 + k, 9 - k, 2, 1); g.fillStyle = '#6c8796'; for (let k = 0; k < 4; k++) g.fillRect(9 + k, 12 - k, 1, 1);
    g.fillStyle = cur; g.fillRect(0, 0, 3, 16); g.fillRect(13, 0, 3, 16); g.fillRect(0, 0, 16, 2);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (const x of [1, 14]) g.fillRect(x, 2, 1, 14); }) }));
  // bricks for the chimneys
  const brickM = toon('#ffffff', { map: paint(16, 16, g => { g.fillStyle = '#c9b8a0'; g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -3 : 0; x < 16; x += 6) { g.fillStyle = ['#8e3b2c', '#9a4a32', '#7b3326', '#a3522a'][(x + y * 3 + 16) % 4]; g.fillRect(x, y, 5, 3); } }, 1, 2) });
  const STRIPE = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d'); for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#f6f3ea' : '#cf5a3e'; g.fillRect(k * 2, 0, 2, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; })();   // (a lounger's canvas)
  const stoneM = toon('#9d9a92', { map: (() => { const t = tex.slabs().clone(); t.repeat.set(3, .5); t.needsUpdate = true; return t; })() }), trimM = white, gutterM = toon('#e3ded2');
  const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
  const BLOOM = [['#f3a6c0', '#f6f3ea'], ['#f6f3ea', '#ffe27a'], ['#e0503f', '#f3a6c0'], ['#b7a4e0', '#f6f3ea']].map(cs => toon('#5a8a3c', { map: rep(tex.bloom(cs), 2, 1) }));
  const bushM = toon('#4f7a3a', { map: rep(tex.leaves(), 2, 2) }), garM = toon('#f0ece2', { map: rep(tex.siding(), 2, 1.6) });
  const garA = toon('#8e969c', { map: rep(tex.siding(), 2, 2.4) });   // (the annex's door, of grey tin)
  const driveM = toon('#9d9a92', { map: rep(tex.slabs(), 1, 3) }), pathM = toon('#c9c3b3', { map: rep(tex.slabs(), .6, 3) });
  // a bush of a few leafy balls, perhaps in flower (in its parent's space)
  function bush(parent, x, z, r, flowers) { for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.7 + rnd() * .5), 1), flowers ? BLOOM[rnd() * BLOOM.length | 0] : bushM);
    b.position.set(x + (rnd() - .5) * r * 1.6, r * .7, z + (rnd() - .5) * r); b.scale.y = .8; parent.add(b); } }
  function bin() { const b = new THREE.Group(), m = toon(['#3f6b35', '#2f4a3a', '#44484c'][rnd() * 3 | 0]); b.add(box(.58, .95, .7, m, 0, .52, 0)); b.add(box(.64, .07, .76, m, 0, 1.02, .02));
    for (const x of [-.26, .26]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .06, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(x, .1, .33); b.add(w); } return b; }
  const hedgeM = toon('#3f6b35', { map: (() => { const t = tex.leaves().clone(); t.repeat.set(5, 1.2); t.needsUpdate = true; return t; })() });
  const seats = [];                                                   // (chairs and loungers in the front gardens, for the people who sit out)
  const mailboxes = [], lots = [], CARS = createCars({ THREE, toon }), P = createProps({ THREE, toon, tex });
  function house(i, side) {                                          // side +1 right, -1 left; its front towards the road
    const h = new THREE.Group(), W = 8 + rnd() * 3, D = 7 + rnd() * 2, H = 2.9 + rnd() * .6, wallC = WALLS[rnd() * WALLS.length | 0], roof = ROOFS[rnd() * ROOFS.length | 0];
    const two = rnd() < .35, HH = two ? H * 1.9 : H, wall = wallM(wallC, W, HH);
    h.add(box(W, HH, D, wall, 0, HH / 2, 0));
    h.add(box(W + .14, .36, D + .14, stoneM, 0, .18, 0));                                                   // the foundation
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) h.add(box(.18, HH, .18, trimM, x, HH / 2, z));   // corner boards
    if (two) h.add(box(W + .06, .12, D + .06, trimM, 0, H, 0));                                                // a band between the floors
    const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .4, 0); tri.lineTo(D / 2 + .4, 0); tri.lineTo(0, 2.2); tri.closePath();
    const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .6, bevelEnabled: false }); rg.translate(0, 0, -(W + .6) / 2); const r = new THREE.Mesh(rg, roof); r.rotation.y = Math.PI / 2; r.position.y = HH; h.add(r);
    { const L = W + .6, e = D / 2 + .4, ang = Math.atan2(2.2, e), len = Math.hypot(e, 2.2);
      for (const z of [-e, e]) { h.add(box(L, .17, .06, trimM, 0, HH - .02, z)); h.add(box(L, .09, .12, gutterM, 0, HH - .12, z + Math.sign(z) * .06)); }   // fascia, gutter
      for (const x of [-L / 2 - .02, L / 2 + .02]) for (const sg of [-1, 1]) { const b = box(.07, .17, len, trimM, x, HH + 1.1, sg * e / 2); b.rotation.x = sg * ang; h.add(b); }   // the gables' boards
      h.add(box(L + .08, .1, .24, dark, 0, HH + 2.2, 0)); }                                                       // the ridge
    // the front (towards -z in its own space, which faces the road): windows, a door, a porch
    const wins = [], fz = -D / 2 - .03, garage = rnd() < .35, annex = !garage && rnd() < .32, as = rnd() < .5 ? -1 : 1, ax = as * (W / 2 + 1.75), gx = W / 2 - 1.9, shut = rnd() < .65 ? SHUT[rnd() * SHUT.length | 0] : null, boxes = rnd() < .45;
    const winM = WINS[rnd() * WINS.length | 0];
    const win = (x, y) => { wins.push([x, y]); h.add(box(1.3, 1.2, .08, white, x, y, fz)); h.add(box(1.06, .96, .1, winM, x, y, fz - .02)); h.add(box(1.46, .12, .16, white, x, y + .64, fz - .05)); h.add(box(.06, .96, .12, white, x, y, fz - .03)); h.add(box(1.06, .06, .12, white, x, y + .05, fz - .03));   // frame, pane, bars
      h.add(box(1.4, .08, .22, white, x, y - .62, fz - .08));                                                        // the sill
      if (shut) for (const sx of [-.86, .86]) { h.add(box(.4, 1.18, .06, shut, x + sx, y, fz - .02)); for (let k = -2; k <= 2; k++) h.add(box(.34, .03, .08, shut, x + sx, y + k * .2, fz - .05)); }
      if (boxes && y < 2.5) { h.add(box(1.2, .22, .26, woodBox, x, y - .78, fz - .15)); h.add(box(1.1, .22, .22, BLOOM[rnd() * BLOOM.length | 0], x, y - .6, fz - .15)); } };
    for (const x of garage ? [-W * .3] : [-W * .32, W * .32]) for (const y of two ? [1.5, 1.5 + H] : [1.5]) win(x, y);
    if (garage && two) win(gx, 1.5 + H);
    const dx = garage ? -W * .02 : 0;
    h.add(box(1.0, 2.1, .1, toon(['#5a3a2a', '#2f4a5a', '#7a2f28', '#3f6b35'][rnd() * 4 | 0]), dx, 1.05, fz - .02)); h.add(box(1.2, .1, .14, white, dx, 2.15, fz - .03));   // the door, its head
    h.add(box(.06, .06, .06, toon('#c9a063'), dx + .35, 1.0, fz - .1));                                                              // its knob
    { const dm = toon(['#6a4a36', '#3a5a6a', '#8e3b2c', '#4f7a3a'][rnd() * 4 | 0]); for (const [x, y] of [[-.22, .45], [.22, .45], [-.22, 1.05], [.22, 1.05]]) h.add(box(.3, .42, .03, dm, dx + x, y, fz - .08));   // its panels
      h.add(box(.62, .32, .03, winM, dx, 1.72, fz - .08));                                                                      // its window
      h.add(box(.14, .22, .12, dark, dx + .78, 1.9, fz - .06)); h.add(box(.08, .12, .1, new THREE.MeshBasicMaterial({ color: '#ffe9b0' }), dx + .78, 1.88, fz - .1)); }   // a lamp by it
    if (garage) { const gd = box(2.8, 2.2, .1, garM, gx, 1.1, fz - .02); h.add(gd); h.add(box(3.0, .12, .14, white, gx, 2.27, fz - .03)); }
    // the annex: a single-storey garage built on at one side, its front flush with the house's; a flat roof with a fascia, its own door
    const aw = 3.3, ad = Math.min(D - .4, 6), ah = 2.7, azc = fz + .03 + ad / 2;
    if (annex) { h.add(box(aw, ah, ad, wall, ax, ah / 2, azc)); h.add(box(aw + .12, .3, ad + .12, stoneM, ax, .15, azc));
      const rf = box(aw + .3, .14, ad + .3, dark, ax, ah + .07, azc); rf.rotation.x = -.04; h.add(rf); h.add(box(aw + .34, .1, .1, trimM, ax, ah + .02, fz - .16));
      h.add(box(2.6, 2.1, .1, garA, ax, 1.05, fz - .02)); h.add(box(2.8, .12, .14, white, ax, 2.2, fz - .03)); for (const x of [-aw / 2, aw / 2]) h.add(box(.16, ah, .16, trimM, ax + x, ah / 2, fz + .02)); }
    const drv = garage || annex, dvx = garage ? gx : ax;                                            // (a drive: to the garage, in the house or in the annex)
    if (rnd() < .7) { const pz = fz - 1.1, pw = garage ? 2.6 : 3.4, px0 = dx;                                                          // a porch: its floor, steps, roof, posts, rails
      h.add(box(pw, .3, 2.2, white, px0, .15, fz - 1.1)); for (const [k, y] of [[0, .1], [1, .2]]) h.add(box(1.2, .1 + y * 0, .32, white, px0, .05 + k * .1, fz - 2.3 + k * .3));
      h.add(box(pw + .4, .14, 2.4, roof, px0, 2.55, pz)); for (const x of [-pw / 2 + .1, pw / 2 - .1]) h.add(box(.16, 2.3, .16, white, px0 + x, 1.4, pz - 1));
      for (const sgn of [-1, 1]) { const x0 = px0 + sgn * pw / 2 - sgn * .1, a = sgn < 0 ? x0 : px0 + .7, b = sgn < 0 ? px0 - .7 : x0;
        h.add(box(Math.abs(b - a), .06, .06, white, (a + b) / 2, 1.1, pz - 1)); for (let x = Math.min(a, b); x <= Math.max(a, b); x += .16) h.add(box(.04, .8, .04, white, x, .7, pz - 1)); } }
    if (rnd() < .6) { h.add(box(.62, 1.6, .62, brickM, W * .3, HH + 1.5, D * .1)); h.add(box(.76, .12, .76, stoneM, W * .3, HH + 2.34, D * .1)); }   // a chimney, brick, capped
    // to the pavement: a drive to the garage, or a path of slabs to the door; bushes and beds along the front
    const gap = 6.5 + rnd() * 2;
    if (drv) h.add(box(3.0, .04, gap + .2, driveM, dvx, .02, -D / 2 - gap / 2)); if (!garage) h.add(box(1.1, .04, gap, pathM, dx, .025, -D / 2 - gap / 2));
    for (let k = 0; k < 3 + (rnd() * 3 | 0); k++) { const x = (rnd() - .5) * (W - 1.5); if (Math.abs(x - dx) < 1.2 || (drv && Math.abs(x - dvx) < 1.8)) continue; bush(h, x, fz - .6 - rnd() * .4, .45 + rnd() * .3, rnd() < .45); }
    if (rnd() < .5) { const bn = bin(); bn.position.set(garage ? gx + 2 : W / 2 - .6, 0, fz - 1.2 - rnd()); bn.rotation.y = (rnd() - .5) * .5; h.add(bn); }
    // the front garden, lived in: a few things about the lawn (not on the path, the drive or the porch); now and then an old car by the house
    const yard = [];
    { const spots = [], lawnZ0 = fz - 1, lawnZ1 = -D / 2 - gap + 1.4, pick = [['leafPile', 3], ['gnome', 2], ['sandbox', 1], ['swing', 1], ['kidBike', 1], ['trampoline', 1], ['grill', 1], ['birdbath', 1]], tot = pick.reduce((a, b) => a + b[1], 0);
      for (let n = 0; n < 2 + (rnd() * 3 | 0); n++) { let r = rnd() * tot, kind = pick[0][0]; for (const [k, wgt] of pick) { if ((r -= wgt) < 0) { kind = k; break; } }
        const big = kind === 'swing' || kind === 'trampoline' || kind === 'sandbox';
        for (let tries = 0; tries < 8; tries++) { const rr = big ? 2 : .8, x = (rnd() - .5) * Math.max(0, W - 2 * (rr + .35)), z = lawnZ1 + (lawnZ0 - lawnZ1) * rnd();
          if (Math.abs(x - dx) < 1.2 + rr * .5 || (drv && Math.abs(x - dvx) < 1.8 + rr * .5) || (z > fz - 2.6 && Math.abs(x - dx) < 2.2 + rr) || spots.some(([a, b, c]) => Math.hypot(a - x, b - z) < c + rr)) continue;
          const o = (kind === 'sandbox' ? P.sandbox(rnd) : P[kind](rnd)); if (kind === 'sandbox') o.group.scale.setScalar(.8); o.group.position.set(x, 0, z); o.group.rotation.y = o.group.rotation.y || (rnd() - .5) * .6; h.add(o.group);
          if (o.hit) yard.push([o.hit, x, z]); spots.push([x, z, rr]); break; } } }
    if (!annex && rnd() < .18) { const old = CARS.makeCar(rnd() < .5 ? 'saloon' : 'estate', ['#8a9a8c', '#b39b7a', '#7a6a5a', '#9aa0a4'][rnd() * 4 | 0]), sx = (rnd() < .5 ? -1 : 1) * (W / 2 + 1.9);
      old.group.position.set(sx, .06, -.5); old.group.rotation.set(0, rnd() < .5 ? 0 : Math.PI, .03); h.add(old.group); old.wheels[0].visible = false;             // on blocks, a wheel off
      const wp = old.wheels[0].position; for (let k = 0; k < 2; k++) old.group.add(box(.3, .12, .25, toon('#9d9a92'), wp.x * .8, .06 + k * .13, wp.z));
      const tarp = box(old.half[0] * 2 + .1, .05, old.half[1] * 1.1, toon('#5f6a35'), 0, 1.45, -old.half[1] * .4); tarp.rotation.x = .05; old.group.add(tarp);   // a tarp over the back of it
      for (const sd of [-1, 1]) { const flap = box(.04, .7, old.half[1] * 1.1, tarp.material, sd * (old.half[0] + .07), 1.1, -old.half[1] * .4); flap.rotation.z = sd * .12; old.group.add(flap); }
      yard.push([{ hx: old.half[0], hz: old.half[1], h: 1.5, kind: 'hard' }, sx, -.5]); }
    // a car on the drive, now and then
    if (drv && rnd() < .6) { const c = CARS.random(rnd); c.group.position.set(dvx, 0, -D / 2 - 2.8 - rnd() * 1.5); c.group.rotation.y = Math.PI + (rnd() - .5) * .1; h.add(c.group); h.userData.car = c; }
    put(h, i, side * (PAVE + gap + D / 2), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    h.updateMatrixWorld(true); hit(h, { hx: W / 2, hz: D / 2, h: HH + 2, kind: 'hard' }, i);
    if (h.userData.car) { const c = h.userData.car; hit(h, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard' }, i, dvx, c.group.position.z); }
    if (annex) hit(h, { hx: aw / 2, hz: ad / 2, h: 3, kind: 'hard' }, i, ax, azc);
    if (annex) annexes.push(h.localToWorld(new THREE.Vector3(ax, 0, azc)));
    // a fence at the back of the lot, behind the house: boards or wire (now and then none), across the whole lot and the annex
    { const kb = rr(), zb = D / 2 + 3.2 + rr() * 1.5, x0 = -W / 2 - 1 - (annex && as < 0 ? 3.5 : 0), x1 = W / 2 + 1 + (annex && as > 0 ? 3.5 : 0), len = x1 - x0;
      if (kb < .85) { const f = kb < .5 ? P.boardFence(len) : P.wireFence(len); f.group.position.set((x0 + x1) / 2, 0, zb); f.group.rotation.y = Math.PI / 2; h.add(f.group); f.group.updateMatrixWorld(true);
        f.group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); hit(h, { hx: len / 2, hz: .1, h: 1.5, kind: 'hard' }, i, (x0 + x1) / 2, zb); } }
    for (const [spec, x, z] of yard) hit(h, spec, i, x, z);
    if (drv) { zone(h, 1.9, (gap + .2) / 2 + .6, dvx, -D / 2 - gap / 2); zone(h, 1.9, 2.6, dvx, -D / 2 - gap - 2.6); } if (!garage) zone(h, .9, gap / 2, dx, -D / 2 - gap / 2); if (annex) zone(h, aw / 2 + .3, ad / 2, ax, azc);   // the drive (and across the pavement and the verge: no tree in the way out), or the path
    zone(h, 2.4, 1.7, dx, fz - 1.1);                                                                                             // the porch
    // now and then a garden chair (or a lounger, striped) out on the lawn, facing the road
    if (rnd() < .3) { const sx = (dx > 0 ? -1 : 1) * W * .28, sz = fz - 3.2, lounger = rnd() < .4, c = new THREE.Group(), wd = toon('#9e7a4f'), cloth = toon('#ffffff', { map: STRIPE });
      if (lounger) { c.add(box(.62, .06, 1.7, cloth, 0, .3, .05)); const bk = box(.62, .06, .8, cloth, 0, .62, -.72); bk.rotation.x = -1.0; c.add(bk); for (const x of [-.3, .3]) for (const z of [-.7, .75]) c.add(box(.04, .3, .04, wd, x, .15, z)); }
      else { c.add(box(.5, .05, .48, wd, 0, .45, 0)); c.add(box(.5, .5, .05, wd, 0, .72, -.24)); for (const x of [-.22, .22]) for (const z of [-.2, .2]) c.add(box(.04, .45, .04, wd, x, .22, z)); for (const x of [-.26, .26]) c.add(box(.04, .04, .45, wd, x, .62, 0)); }
      c.position.set(sx, 0, sz); c.rotation.y = Math.PI; h.add(c);                                   // (the seat faces the road: -z here)
      seats.push({ h, local: new THREE.Vector3(sx, lounger ? .06 : 0, sz + (lounger ? .15 : .02)), lounger, i }); hit(h, { hx: .4, hz: lounger ? .9 : .35, h: .8, kind: 'hard' }, i, sx, sz); }
    const nrm = new THREE.Vector3(0, 0, -1).transformDirection(h.matrixWorld);
    show.house.push({ o: h, label: [two ? 'piętrowy' : 'parterowy', garage ? 'z garażem' : annex ? 'z dobudówką' : ''].filter(Boolean).join(', '), note: `${W.toFixed(1)} × ${D.toFixed(1)} m`, kind: (two ? 2 : 1) + (garage ? 'g' : annex ? 'a' : '') });
    for (const [x, y] of wins) windows.push({ p: h.localToWorld(new THREE.Vector3(x, y, fz - .07)), n: nrm.clone(), hw: .56, hh: .5, broken: false, i, house: doors.length });   // (house: its door's number)
    doors.push({ p: h.localToWorld(new THREE.Vector3(dx, 0, fz - 2.6)), n: nrm.clone(), done: false, i });   // (n: the way the house faces)
    lots.push({ i, side, D, W, gap });
    // the mailbox by the pavement, in front of it
    const mb = new THREE.Group(), bm = rnd() < .5 ? grey : white; mb.add(box(.11, 1.02, .11, wood, 0, .51, 0));
    mb.add(box(.13, .05, .5, wood, 0, 1.0, 0)); { const br = box(.05, .36, .05, wood, 0, .82, .1); br.rotation.x = -.7; mb.add(br); }   // the arm under the box, a brace
    { const sh = new THREE.Shape(); sh.moveTo(-.13, 0); sh.lineTo(.13, 0); sh.lineTo(.13, .13); sh.absarc(0, .13, .13, 0, Math.PI, false); sh.lineTo(-.13, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: .46, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 1, curveSegments: 10 }); g.translate(0, 0, -.23);
      const b = new THREE.Mesh(g, bm); b.position.y = 1.025; mb.add(b);
      const dg = new THREE.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false, curveSegments: 10 }); const door = new THREE.Mesh(dg, toon('#9a938a')); door.scale.setScalar(.97); door.position.set(0, 1.03, .245); mb.add(door);   // the door, a shade darker
      mb.add(box(.05, .025, .03, toon('#44484c'), 0, 1.2, .27));                                    // its latch
      for (const z of [-.12, .06]) mb.add(box(.27, .012, .015, toon('#b8b8ae'), 0, 1.03, z)); }       // bands round its foot
    const flag = new THREE.Group(); flag.position.set(.15, 1.1, -.05); flag.add(box(.015, .24, .025, red, 0, .12, 0)); flag.add(box(.018, .09, .13, red, 0, .21, .065)); mb.add(flag);   // (pivots at its foot)
    mb.userData.keep = true; put(mb, i + 4, side * (VERGE - .25), 0, 0); hit(mb, { hx: .1, hz: .1, h: 1.3, kind: 'hard' }, i + 4); mailboxes.push({ o: mb, i: i + 4, side, flag });   // (keep: its flag moves)
    // a fence or a hedge along its front, now and then
    //   always open where the drive or the path meets the pavement (a car must get out, one must get in): a gate on the path (now and
    //   then left ajar), posts at the drive (now and then a double gate, swung wide open); a few lots fenced all round, back to the house
    const k = rnd(), gapO = drv ? [dvx, 3.4, 'drive'] : [dx, 1.3, 'path'], lo = gapO[0] - gapO[1] / 2, hi = gapO[0] + gapO[1] / 2, fL = -W / 2 - (annex && as < 0 ? 3.5 : 0), fR = W / 2 + (annex && as > 0 ? 3.5 : 0);
    const holes = (annex ? [[lo, hi], [dx - .65, dx + .65]] : [[lo, hi]]).sort((a, b) => a[0] - b[0]), runs = [];   // (with an annex: open at its drive and at the path to the door)
    { let a = fL; for (const [h0, h1] of holes) { runs.push([a, h0]); a = h1; } runs.push([a, fR]); for (let q = runs.length - 1; q >= 0; q--) if (runs[q][1] - runs[q][0] < .3) runs.splice(q, 1); }
    if (k < .45) { const f = new THREE.Group(); put(f, i, side * (PAVE + .5), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);   // (the fence's frame is the house's: across the lot along x, the lot at +z)
      const run = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, n = Math.max(1, Math.round(L / .28)), yaw = Math.atan2(-uz, ux);
        for (let q = 0; q <= n; q++) { const t = q / n, pk = box(.08, .85, .03, white, x0 + ux * L * t, .43, z0 + uz * L * t); pk.rotation.y = yaw; f.add(pk); }
        for (const y of [.62, .3]) { const r = box(L, .06, .05, white, (x0 + x1) / 2, y, (z0 + z1) / 2 + .02); r.rotation.y = Math.atan2(-uz, ux); f.add(r); }
        hit(f, Math.abs(ux) > .5 ? { hx: L / 2, hz: .06, h: .9, kind: 'hard' } : { hx: .06, hz: L / 2, h: .9, kind: 'hard' }, i, (x0 + x1) / 2, (z0 + z1) / 2); };
      for (const [a, b] of runs) run(a, 0, b, 0);
      for (const x of holes.flat()) f.add(box(.12, 1.05, .12, white, x, .52, 0));                                                     // (posts at the opening)
      if (gapO[2] === 'path' && rnd() < .8) { const gt = new THREE.Group(); gt.position.set(lo + .06, 0, 0); f.add(gt); for (let x = .12; x < gapO[1] - .1; x += .2) gt.add(box(.07, .8, .03, white, x, .45, 0)); for (const y of [.62, .3]) gt.add(box(gapO[1] - .14, .05, .04, white, (gapO[1] - .12) / 2 + .02, y, .02)); gt.rotation.y = -(.15 + rnd() * 1.1); }   // a gate, ajar
      if (gapO[2] === 'drive' && rnd() < .35) for (const [x, sg] of [[lo + .06, 1], [hi - .06, -1]]) { const gt = new THREE.Group(); gt.position.set(x, 0, 0); f.add(gt); const w = gapO[1] / 2 - .1; for (let q = .1; q < w; q += .2) gt.add(box(.07, .9, .03, white, sg * q, .5, 0)); for (const y of [.7, .32]) gt.add(box(w, .05, .04, white, sg * w / 2, y, .02)); gt.rotation.y = -sg * (1.35 + rnd() * .2); }   // a double gate, wide open
      if (rnd() < .35) { const back = gap - .7; run(fL, 0, fL, back); run(fR, 0, fR, back); } }                      // fenced all round, to the house's front
    else if (k < .7) { for (const [a, b] of runs) { const hg = put(box(b - a, 1.1, .9, hedgeM), i, side * (PAVE + .8), .55, side > 0 ? -Math.PI / 2 : Math.PI / 2); hg.translateX((a + b) / 2); hit(hg, { hx: (b - a) / 2, hz: .45, h: 1.1, kind: 'soft' }, i); } }   // a hedge, open at the drive or the path
  }
  const leafT = (() => { const t = tex.leaves().clone(); t.repeat.set(2, 2); t.needsUpdate = true; return t; })();
  // a crown: clumps (lumpy balls, flat-faced, each face one of the palette's tones: lighter up top and facing up, darker beneath) and,
  // over them, cards of small leaves (alpha) facing out, which make the rim ragged; the cards are shaded as the crown's round is
  const PAL = { green: ['#1d3322', '#284a2b', '#355f31', '#467537', '#5b8a3c', '#77a146'], olive: ['#284a2b', '#355f31', '#5f6a35', '#7c8446', '#98b85a', '#c2cf7e'],
    fresh: ['#284a2b', '#355f31', '#467537', '#5b8a3c', '#77a146', '#98b85a'], orange: ['#5e1c17', '#8e2e25', '#b86a2e', '#e08556', '#d9a441', '#efc970'],
    red: ['#5e1c17', '#8e2e25', '#b3392d', '#cf5a3e', '#e08556', '#efc970'], yellow: ['#5f6a35', '#7c8446', '#b86a2e', '#d9a441', '#efc970', '#f3eed2'] };
  for (const k in PAL) PAL[k] = PAL[k].map(c => new THREE.Color(c));
  const clumpM = toon('#ffffff', { vertexColors: true, flatShading: true, map: leafT });
  const cardT = tex.leafCard(1), cardM = toon('#ffffff', { vertexColors: true, map: cardT, alphaTest: .5, side: THREE.DoubleSide });
  const cardDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: cardT, alphaTest: .5, side: THREE.DoubleSide });
  const hash3 = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  function crown(t, C, R, pal, nClump = 18, nCard = 44) {
    const P = PAL[pal], tone = (up, h, j) => P[Math.max(0, Math.min(P.length - 1, Math.round((up * .45 + h * .75 + j) * (P.length - 1))))];
    for (let k = 0; k < nClump; k++) { const a = rnd() * 6.28, u = rnd() * 2 - 1, q = Math.sqrt(1 - u * u), rr = .35 + Math.sqrt(rnd()) * .55;
      const cx = C.x + Math.cos(a) * q * R.x * rr, cy = C.y + u * R.y * rr * .85, cz = C.z + Math.sin(a) * q * R.z * rr, cr = (.45 + rnd() * .4) * Math.min(R.x, R.y, R.z) * .85;
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), n = 1 + (hash3(x + k, y, z) - .5) * .5; p.setXYZ(v, cx + x * cr * n, cy + y * cr * n * .85, cz + z * cr * n); }
      g.computeVertexNormals(); const cols = new Float32Array(p.count * 3), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), j0 = (rnd() - .5) * .2;
      for (let f = 0; f < p.count; f += 3) { const A = new THREE.Vector3().fromBufferAttribute(p, f), B2 = new THREE.Vector3().fromBufferAttribute(p, f + 1), C2 = new THREE.Vector3().fromBufferAttribute(p, f + 2);
        fn.crossVectors(e1.subVectors(B2, A), e2.subVectors(C2, A)).normalize(); const h = ((A.y + B2.y + C2.y) / 3 - (C.y - R.y)) / (2 * R.y), c = tone(fn.y, h, j0 + (rnd() - .5) * .25);
        for (let v = 0; v < 3; v++) { cols[(f + v) * 3] = c.r; cols[(f + v) * 3 + 1] = c.g; cols[(f + v) * 3 + 2] = c.b; } }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); const m = new THREE.Mesh(g, clumpM); m.userData.foliage = 'clump'; t.add(m); }
    const pos = [], nor = [], uv = [], col = [], d = new THREE.Vector3(), u1 = new THREE.Vector3(), u2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < nCard; k++) { const a = rnd() * 6.28, y = rnd() < .8 ? rnd() * .95 + .05 : -rnd() * .6, q = Math.sqrt(1 - y * y); d.set(Math.cos(a) * q, y, Math.sin(a) * q);
      const c0 = new THREE.Vector3(C.x + d.x * R.x * .92, C.y + d.y * R.y * .88, C.z + d.z * R.z * .92), sz = (.6 + rnd() * .45) * Math.min(R.x, R.z) * .55, roll = rnd() * 6.28;
      u1.crossVectors(Math.abs(d.y) > .95 ? new THREE.Vector3(1, 0, 0) : up, d).normalize(); u2.crossVectors(d, u1); const cu = u1.clone().multiplyScalar(Math.cos(roll)).addScaledVector(u2, Math.sin(roll)), cv = new THREE.Vector3().crossVectors(d, cu);
      const cs = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].map(([x, z, s0, t0]) => ({ p: c0.clone().addScaledVector(cu, x * sz).addScaledVector(cv, z * sz), s0, t0 }));
      const c = tone(d.y, (d.y + 1) / 2, (rnd() - .4) * .3); for (const i of [0, 1, 2, 0, 2, 3]) { const v = cs[i]; pos.push(v.p.x, v.p.y, v.p.z); nor.push(d.x, d.y, d.z); uv.push(v.s0, v.t0); col.push(c.r, c.g, c.b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, cardM); m.userData.foliage = 'card'; t.add(m);
  }
  const greenPal = () => { const k = rnd(); return k < .45 ? 'green' : k < .75 ? 'olive' : 'fresh'; }, autumnPal = () => { const k = rnd(); return k < .45 ? 'orange' : k < .75 ? 'red' : 'yellow'; };
  function branches(t, H, n, toward) { for (let k = 0; k < n; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.05, .1, 1.8 + rnd(), 6), wood), a = rnd() * 6.28, tilt = .5 + rnd() * .5;
    br.position.set(toward * .3 + Math.cos(a) * .35, H - .2 + rnd() * .4, Math.sin(a) * .35); br.rotation.set(Math.sin(a) * tilt, 0, -(Math.cos(a) + toward * .6) * tilt); t.add(br); } }
  // a tree grown, not stood up: a trunk that bends as it rises and narrows, forking into a few limbs, each bent, each ending in a mass of
  // leaves; a mass on the top as well. dir: where it leans ({x, z}, unit), spread: how far its limbs reach (m)
  const barkM = toon('#6b4a30', { map: rep(tex.bark(), 1, 3) });
  function limb(t, pts, r0, r1) { const c = new THREE.CatmullRomCurve3(pts), TS = 10, RS = 7, g = new THREE.TubeGeometry(c, TS, r0, RS, false), p = g.attributes.position, q = new THREE.Vector3();
    for (let a = 0; a <= TS; a++) { const cp = c.getPointAt(a / TS), k = 1 + (r1 / r0 - 1) * (a / TS); for (let b = 0; b <= RS; b++) { const n = a * (RS + 1) + b; q.fromBufferAttribute(p, n).sub(cp).multiplyScalar(k).add(cp); p.setXYZ(n, q.x, q.y, q.z); } }
    g.computeVertexNormals(); t.add(new THREE.Mesh(g, barkM)); return c; }
  function grow(t, H, dir, spread, pal, big) {
    const w = () => (rnd() - .5) * .35, V = (x, y, z) => new THREE.Vector3(x, y, z), r0 = big ? .3 : .21;
    const trunk = limb(t, [V(0, -.1, 0), V(dir.x * spread * .06 + w(), H * .35, dir.z * spread * .06 + w()), V(dir.x * spread * .16 + w(), H * .7, dir.z * spread * .16 + w()), V(dir.x * spread * .24, H, dir.z * spread * .24)], r0, r0 * .5);
    const top = trunk.getPointAt(1), n = 2 + (rnd() * 3 | 0), yaw = Math.atan2(dir.z, dir.x);
    for (let k = 0; k < n; k++) { const s0 = trunk.getPointAt(.55 + rnd() * .4), a = yaw + (k - (n - 1) / 2) * (2.4 / n) + (rnd() - .5) * .5, reach = spread * (.55 + rnd() * .45), up = H * (.22 + rnd() * .25);
      const end = V(s0.x + Math.cos(a) * reach, s0.y + up, s0.z + Math.sin(a) * reach), mid = V(s0.x + Math.cos(a) * reach * .55, s0.y + up * .35, s0.z + Math.sin(a) * reach * .55);
      limb(t, [s0, mid, end], r0 * .42, r0 * .16);
      const R = spread * (.42 + rnd() * .16); crown(t, end.clone().add(V(0, R * .35, 0)), V(R, R * .72, R), pal, big ? 8 : 6, big ? 24 : 16); }
    const R = spread * (.5 + rnd() * .12); crown(t, top.clone().add(V(0, R * .45, 0)), V(R, R * .75, R), pal, big ? 10 : 7, big ? 28 : 18);
  }
  function tree(i, d) {
    if (!free(i, d, 2)) return;                                          // (not out of a car, a house, a drive)
    const t = new THREE.Group(), H = 2.6 + rnd() * 2.4, autumn = rnd() < .3, a = rnd() * 6.28;
    grow(t, H, { x: Math.cos(a), z: Math.sin(a) }, 1.7 + rnd() * .9 + H * .1, autumn ? autumnPal() : greenPal(), false);
    put(t, i, d, 0, rnd() * 6); hit(t, { hx: .28, hz: .28, h: H, kind: 'hard' }, i);
    show.tree.push({ o: t, label: autumn ? 'drzewo jesienne' : 'drzewo liściaste', note: H.toFixed(1) + ' m' });
  }
  function pole(i) { const p = new THREE.Group(); p.add(box(.22, 8.5, .22, wood, 0, 4.25, 0)); p.add(box(1.8, .12, .12, wood, 0, 7.9, 0)); p.add(box(1.2, .1, .1, wood, 0, 7.3, 0)); put(p, i, -(VERGE - .6), 0, 0); hit(p, { hx: .14, hz: .14, h: 8, kind: 'hard' }, i); return p; }
  // ---------- the shacks: a plot of them now and then in place of a house: sheds of tin and boards, a fire in a drum, an old sofa,
  //   tyres, pallets, washing, a car on blocks, a broken fence, and the lads standing round the fire (they have something to say) ----------
  const fires = [], annexes = [], train = { update() { } };   // (the fires by the shacks, to flicker; where the annexes are, for a look in the tests)
  function shacks(i, side) {
    const h = new THREE.Group(), tin = c => { const t = rep(tex.siding(), 1, 2.4); t.rotation = Math.PI / 2; t.center.set(.5, .5); return toon(c, { map: t }); }, roofs = ['#8a4a2e', '#6e7478', '#9a5a36'].map(c => tin(c)), mats = [tin('#8a5a3a'), tin('#8a8f94'), tin('#5d6639'), toon('#6b4a2e', { map: rep(tex.siding(), 1, 1.2) })], dirt = toon('#7a6a50');
    for (const [x, z, w, d, a] of [[0, -.6, 8, 5.5, .15], [-3.6, 2.2, 6, 4.5, -.2], [3.8, 2, 5.5, 5, .3], [-5.6, -2.4, 3.2, 2.6, .5], [5.2, -2.4, 3.6, 3, -.4]]) { const pt = box(w, .03, d, dirt, x, .015 + Math.abs(a) * .01, z); pt.rotation.y = a; h.add(pt); }
    for (const [x, z, w, d, hh] of [[-4.2, 2.2, 3.4, 2.8, 2.2], [.3, 3.4, 3, 2.6, 2.4], [4.4, 1.6, 2.8, 3, 2.1]]) { const m = mats[rnd() * mats.length | 0], s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = (rnd() - .5) * .25; h.add(s);
      s.add(box(w, hh, d, m, 0, hh / 2, 0)); const rf = box(w + .5, .06, d + .6, roofs[rnd() * roofs.length | 0], 0, hh + .2, 0); rf.rotation.x = .2; rf.rotation.z = (rnd() - .5) * .12; s.add(rf);
      for (let q = 0; q < 3; q++) { const pw = .5 + rnd() * .8, ph = .4 + rnd() * .7, pa = box(pw, ph, .03, mats[rnd() * mats.length | 0], (rnd() - .5) * (w - pw), .3 + rnd() * (hh - ph - .4), -d / 2 - .02); pa.rotation.z = (rnd() - .5) * .2; s.add(pa); }   // patches of other tin
      if (rnd() < .5) { const lw = 1.4, sx = (rnd() < .5 ? -1 : 1) * (w / 2 + lw / 2); s.add(box(lw, hh * .7, d * .7, mats[3], sx, hh * .35, d * .1)); const lr = box(lw + .3, .05, d * .7 + .3, roofs[0], sx, hh * .72, d * .1); lr.rotation.z = Math.sign(sx) * -.25; s.add(lr); }   // a lean-to at its side
      s.add(box(.9, 1.85, .05, toon('#3a2a1e'), -w * .2, .93, -d / 2 - .03)); s.add(box(.7, .5, .05, toon('#c9b77a'), w * .25, 1.35, -d / 2 - .03));   // a door, a boarded window
      if (rnd() < .6) { s.add(box(.12, 1, .12, toon('#44484c'), w * .3, hh + .6, d * .2)); }                                                             // a stovepipe
      hit(h, { hx: w / 2, hz: d / 2, h: hh + .2, kind: 'hard' }, i, x, z); }
    const drum = new THREE.Group(); drum.position.set(.5, 0, -1.2); h.add(drum); drum.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .85, 12), toon('#7b3326'))); drum.children[0].position.y = .43;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.24, .6, 7), new THREE.MeshBasicMaterial({ color: '#ffb040' })); flame.position.y = 1.05; drum.add(flame); const core = new THREE.Mesh(new THREE.ConeGeometry(.14, .4, 6), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); core.position.y = .98; drum.add(core);
    drum.userData.keep = true; hit(h, { hx: .32, hz: .32, h: .9, kind: 'hard' }, i, .5, -1.2);
    const sofa = new THREE.Group(), sm = toon('#6b4a3a'); sofa.position.set(2.6, 0, -1.6); sofa.rotation.y = -1.1; sofa.add(box(1.8, .4, .8, sm, 0, .3, 0)); sofa.add(box(1.8, .6, .2, sm, 0, .7, .32)); for (const x of [-.85, .85]) sofa.add(box(.18, .55, .8, sm, x, .45, 0)); h.add(sofa);
    for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .12, 6, 12), toon('#1d1e21')); t.rotation.x = Math.PI / 2; t.position.set(-6, .12 + k * .24, -2.4 + (k % 2) * .05); h.add(t); }
    for (let k = 0; k < 2; k++) { const pl = new THREE.Group(); pl.position.set(-2.2 + k * .2, .06 + k * .13, -2.8); for (let q = 0; q < 5; q++) pl.add(box(.1, .03, 1.2, toon('#9e7a4f'), -.5 + q * .25, 0, 0)); h.add(pl); }
    { const w = P.washing(rnd); w.group.position.set(-3.5, 0, -.6); h.add(w.group); }
    if (rnd() < .7) { const old = CARS.makeCar(rnd() < .5 ? 'micro' : 'twostroke', ['#8a9a8c', '#b39b7a', '#7a6a5a'][rnd() * 3 | 0]); old.group.position.set(5.6, .1, -2.2); old.group.rotation.y = 1.3; old.wheels.forEach(w => { w.visible = false; }); h.add(old.group); hit(h, { hx: old.half[0], hz: old.half[1], h: 1.4, kind: 'hard' }, i, 5.6, -2.2); }
    // the fence along the road, broken: two runs, a gap, a board fallen
    for (const [x, len] of [[-5, 4], [4.8, 4.4]]) { const f = P.boardFence(len); f.group.position.set(x, 0, -5.4); f.group.rotation.y = Math.PI / 2 + (rnd() - .5) * .06; h.add(f.group); }
    { const fb = box(1.2, .9, .04, toon('#6b4a2e'), 1.2, .08, -5.2); fb.rotation.x = -1.45; h.add(fb); }
    put(h, i, side * (PAVE + 7), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2); h.updateMatrixWorld(true); zone(h, 7.5, 6, 0, 1);
    for (const [x, len] of [[-5, 4], [4.8, 4.4]]) hit(h, { hx: len / 2, hz: .08, h: 1.4, kind: 'hard' }, i, x, -5.4);
    fires.push({ drum, flame, core }); show.shacks.push({ o: h, label: 'baraki', note: '15 × 12 m' });
    // the lads, standing round the fire on its far side (their faces to the road), facing it
    for (let k = 0; k < 3; k++) { const a = -1.2 + k * 1.2, x = .5 + Math.sin(a) * 1.25, z = -1.2 + Math.cos(a) * 1.3; seats.push({ h, local: new THREE.Vector3(x, 0, z), stand: true, key: ['teen', 'brawler', 'dogman', 'gardener'][(rnd() * 4) | 0], face: Math.atan2(.5 - x, -1.2 - z), lines: 'shacks', i }); }
  }
  const lot = (i, s) => rnd() < .07 ? shacks(i, s) : house(i, s);
  for (let i = 30; i < N - 40; i += Math.round((20 + rnd() * 10) / ds)) { lot(i, 1); if (rnd() < .9) lot(i + Math.round(8 / ds), -1); }
  for (let i = 0; i < N; i += Math.round((9 + rnd() * 12) / ds)) { const side = rnd() < .5 ? -1 : 1; tree(i, side * (PAVE + 1.6 + rnd() * 3)); if (rnd() < .25) tree(i + 7, (rnd() < .5 ? -1 : 1) * (VERGE - .6)); }
  const poles = []; for (let i = 10; i < N; i += Math.round(38 / ds)) poles.push(pole(i));
  for (const p of poles) p.updateMatrixWorld(true);                   // (the wires hang from where the poles are)
  { const pos = []; for (let k = 0; k < poles.length; k++) { const a = poles[k], b = poles[(k + 1) % poles.length]; for (const [x, y] of [[-.8, 7.95], [.8, 7.95], [0, 7.35]]) {
      const pa = a.localToWorld(new THREE.Vector3(x, y, 0)), pb = b.localToWorld(new THREE.Vector3(x, y, 0)); for (let j = 0; j < 8; j++) { const t0 = j / 8, t1 = (j + 1) / 8, sag = t => Math.sin(t * Math.PI) * .5;
        pos.push(...pa.clone().lerp(pb, t0).add(new THREE.Vector3(0, -sag(t0), 0)).toArray(), ...pa.clone().lerp(pb, t1).add(new THREE.Vector3(0, -sag(t1), 0)).toArray()); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#2a2a2a' }))); }
  const parked = [];                                                   // (the ones at the kerb, for the traffic to go round)
  for (const i of [140, 380, 520, 760, 900, 1120, 1250, 1480]) { const sd = (i % 3 ? -1 : 1), c = CARS.random(rnd); parked.push({ s: i * ds, d: sd * 2.45 }); put(c.group, i, sd * 2.45, 0, sd < 0 ? Math.PI : 0); hit(c.group, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard' }, i); }   // parked at the kerb
  // street trees on the verge: tall, their crowns reaching over the road; under each, its dappled shadow on the road and the pavement
  const DAP = [1, 2, 3].map(k => new THREE.MeshBasicMaterial({ map: tex.dapple(k), color: '#0c0912', transparent: true, opacity: .66, depthWrite: false, alphaTest: .5, fog: true }));
  function dapple(i, dMid, w = 10.5, l = 11) {                            // a patch laid on the ground's own shape (road, kerb, verge, pavement)
    const di = Math.round(l / 2 / ds), nx = 12, nz = 2 * di, pos = [], uv = [], idx = [];
    for (let a = 0; a <= nz; a++) for (let b = 0; b <= nx; b++) { const d = dMid - w / 2 + w * b / nx, q = at(i - di + a, d, .02); pos.push(q.x, q.y, q.z); uv.push(b / nx, a / nz); }
    for (let a = 0; a < nz; a++) for (let b = 0; b < nx; b++) { const k = a * (nx + 1) + b; idx.push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, DAP[rnd() * 3 | 0]); m.renderOrder = 1; m.receiveShadow = false; m.userData.noShadow = true; G.add(m);
  }
  function streetTree(i, side) {
    if (!free(i, side * (VERGE - .55), .6)) return;
    const t = new THREE.Group(), H = 3.6 + rnd() * 1.4, autumn = rnd() < .22;   // (its limbs reaching over the road: its +x, as it stands)
    grow(t, H, { x: side, z: (rnd() - .5) * .4 }, 3 + rnd() * .8, autumn ? autumnPal() : greenPal(), true);
    put(t, i, side * (VERGE - .55), 0, 0); hit(t, { hx: .32, hz: .32, h: H, kind: 'hard' }, i);   // (turned with the road: its +x is the road's left, -x its right)
    dapple(i + Math.round((rnd() - .5) * 4 / ds), side * (VERGE - 3.2));
  }
  for (let i = 60; i < N - 20; i += Math.round((15 + rnd() * 9) / ds)) { if (rnd() < .78) streetTree(i, rnd() < .5 ? 1 : -1); }
  // street lamps on the right: a grey post, an arm out over the road, a lamp
  for (let i = 30; i < N; i += Math.round((46 + rnd() * 10) / ds)) { const l = new THREE.Group(), m = toon('#6a6e70'); l.add(box(.14, 6.2, .14, m, 0, 3.1, 0));
    const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 6.0, 0), new THREE.Vector3(-.4, 6.5, 0), new THREE.Vector3(-1.4, 6.6, 0), new THREE.Vector3(-2.0, 6.45, 0)]), 12, .05, 6), m); l.add(arm);
    l.add(box(.7, .16, .32, m, -2.05, 6.38, 0)); l.add(box(.55, .05, .24, toon('#fff4d6'), -2.05, 6.29, 0));
    put(l, i, VERGE - .7, 0, Math.PI); hit(l, { hx: .1, hz: .1, h: 6, kind: 'hard' }, i); }                               // (turned so its arm, along -x, reaches over the road)
  // drains in both gutters, hydrants now and then on the verge
  const grateM = toon('#ffffff', { map: tex.grate() }), hydM = toon('#b3372c'), capM = toon('#d8d2c0');
  for (let i = 12; i < N; i += Math.round((34 + rnd() * 20) / ds)) for (const sd of [-1, 1]) if (rnd() < .6) put(box(.55, .03, .9, grateM), i + (sd > 0 ? 0 : 20), sd * (ROAD - .32), .005, 0);
  // a hydrant: a flanged foot, the barrel, a collar, the bonnet (a dome) with its nut; two hose outlets at the sides and the big one to
  // the front, each capped, the caps' nuts; a chain from the front cap; bolts round the flanges
  const hydD = toon('#8e2e25'), boltM = toon('#5e1c17'), chainM = toon('#44484c');
  function hydrant() { const hy = new THREE.Group(), L = (pts, m, seg = 14) => { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m); hy.add(o); return o; };
    L([[0, 0], [.19, 0], [.19, .06], [.14, .075], [0, .075]], hydD);                                  // the foot
    L([[0, .07], [.125, .07], [.12, .3], [.118, .5], [0, .5]], hydM);                                 // the barrel
    L([[0, .49], [.155, .49], [.155, .545], [.13, .56], [0, .56]], hydD);                             // the collar
    L([[0, .55], [.135, .55], [.13, .6], [.11, .67], [.07, .72], [.03, .74], [0, .745]], hydM);       // the bonnet
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(.034, .04, .06, 5), hydD); nut.position.y = .77; hy.add(nut);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; for (const [y, r] of [[.065, .165], [.55, .145]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(.013, 5, 4), boltM); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); hy.add(b); } }
    for (const [a, r, len, y] of [[0, .045, .09, .42], [Math.PI, .045, .09, .42], [Math.PI / 2, .065, .1, .38]]) {   // outlets: side, side, front
      const o = new THREE.Group(); o.position.y = y; o.rotation.y = a; hy.add(o);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, len, 12), hydM); pipe.rotation.z = Math.PI / 2; pipe.position.x = .1 + len / 2; o.add(pipe);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, .035, 12), hydD); cap.rotation.z = Math.PI / 2; cap.position.x = .1 + len + .015; o.add(cap);
      const cn = new THREE.Mesh(new THREE.CylinderGeometry(r * .45, r * .45, .03, 5), hydM); cn.rotation.z = Math.PI / 2; cn.position.x = .1 + len + .045; o.add(cn); }
    const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.07, .36, .2), new THREE.Vector3(.1, .28, .17), new THREE.Vector3(.12, .3, .1)]), 6, .006, 4), chainM); hy.add(chain);
    return hy; }
  for (let i = 80; i < N; i += Math.round((70 + rnd() * 50) / ds)) { const sd = rnd() < .5 ? -1 : 1, hy = hydrant();
    put(hy, i, sd * (VERGE - .9), 0, sd > 0 ? Math.PI : 0); hit(hy, { hx: .2, hz: .2, h: .8, kind: 'hard' }, i); colliders[colliders.length - 1].hyd = true; }   // (the big outlet to the road; hyd: water, if it is hit)
  // spruces behind the houses (they show over the roofs), and a few round trees in the back gardens
  const spruceM = toon('#284a2b', { flatShading: true, map: rep(tex.leaves(), 2, 2) });
  for (let i = 0; i < N; i += Math.round((11 + rnd() * 10) / ds)) { const sd = rnd() < .5 ? -1 : 1, t = new THREE.Group(), H = 7 + rnd() * 6;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.14, .22, H * .3, 6), wood); tr.position.y = H * .15; t.add(tr);
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.9 - k * .38) * (H / 10), H * .34, 8), spruceM); c.position.y = H * (.3 + k * .19); t.add(c); }
    show.tree.push({ o: t, label: 'świerk', note: H.toFixed(1) + ' m' }); put(t, i, sd * (PAVE + 22 + rnd() * 10), 0, rnd() * 6); if (rnd() < .4) tree(i + 9, sd * (PAVE + 19 + rnd() * 6)); }
  // ---------- between the houses: a side fence on the boundary, and what a garden has ----------
  for (let k = 0; k < lots.length; k++) { const a = lots[k], b = lots.slice(k + 1).find(o => o.side === a.side); if (!b || b.i - a.i > 70) continue;
    const mid = Math.round((a.i + b.i) / 2), sd = a.side, len = 14 + rnd() * 5, f = rnd() < .55 ? P.boardFence(len) : P.wireFence(len);
    put(f.group, mid, sd * (PAVE + 1.5 + len / 2), 0, Math.PI / 2); hit(f.group, f.hit, mid);
    const extras = [P.shed, P.washing, P.logs, P.sandbox, P.birdbath]; for (let n = 0; n < 1 + (rnd() * 2 | 0); n++) { const e = extras[rnd() * extras.length | 0](rnd), off = (rnd() < .5 ? -1 : 1) * (2.5 + rnd() * 2);
      const ii = mid + Math.round(off / ds), dd = sd * (PAVE + 8 + rnd() * 9); put(e.group, ii, dd, 0, rnd() < .5 ? 0 : Math.PI / 2); hit(e.group, e.hit, ii); }
    if (rnd() < .35) tree(mid + Math.round((rnd() - .5) * 6 / ds), sd * (PAVE + 12 + rnd() * 6)); }
  // ---------- on the road and the pavement: things to ride round, over or into ----------
  const bundles = [], ramps = [];
  const bigAt = [Math.round(N * .3), Math.round(N * .72)];               // (two big ramps, on the road, a good run up to each)
  for (const i of bigAt) { const o = P.ramp(rnd, 'big'); put(o.group, i, 1.4, 0, 0); ramps.push(hit(o.group, o.hit, i)); parked.push({ s: i * ds, d: 1.4 }); }   // (the traffic goes round it)
  for (let i = 90; i < N - 30; i += Math.round((26 + rnd() * 30) / ds)) {
    const r = rnd(), sd = rnd() < .5 ? -1 : 1;
    if (bigAt.some(b => Math.abs(b - i) * ds < 14)) continue;             // (the big ones' run up and landing kept clear)
    if (r < .26) { const o = P.ramp(rnd, rnd() < .45 ? 'kicker' : 'plank'), onPave = rnd() < .4, d = onPave ? sd * 5.8 : sd * (1 + rnd() * 1.4); put(o.group, i, d, 0, 0); ramps.push(hit(o.group, o.hit, i)); }       // a ramp, up the way you ride
    else if (r < .4) { for (let n = 0; n < 2 + (rnd() * 2 | 0); n++) { const o = P.cone(), ii = i + n * 5, d = sd * (1.2 + n * .7 + rnd() * .3); put(o.group, ii, d, 0, rnd() * 6); hit(o.group, o.hit, ii); } }
    else if (r < .48) { const o = P.bags(rnd), d = sd * (VERGE - .3 + rnd() * 1.4); put(o.group, i, d, 0, 0); hit(o.group, o.hit, i); }
    else if (r < .56) { const o = P.wagon(), d = sd * (VERGE + .8); put(o.group, i, d, 0, rnd() * 6); hit(o.group, o.hit, i); }
    else if (r < .64) { const o = P.barrier(), d = sd * (1.7 + rnd()); put(o.group, i, d, 0, 0); hit(o.group, o.hit, i); for (const dz of [-3, 3]) { const c = P.cone(), ii = i + Math.round(dz / ds); put(c.group, ii, d, 0, 0); hit(c.group, c.hit, ii); } }
    else if (r < .74) { const o = P.pothole(rnd), d = (rnd() - .5) * 5; put(o.group, i, d, 0, rnd() * 3); hit(o.group, o.hit, i); }
    else if (r < .84) { const o = P.manhole(rnd), d = sd * (.8 + rnd() * 1.6); put(o.group, i, d, 0, rnd() * 6); hit(o.group, o.hit, i); }   // an open manhole
    else { const o = P.bundle(), d = sd * (VERGE + .6); o.group.userData.keep = true; put(o.group, i, d, 0, 0); bundles.push(hit(o.group, o.hit, i)); }   // (kept whole: it goes when picked up)
  }

  // ---------- the country beyond the gardens (45-130 m out): fields in stripes, hedges along them, groves, farms with red barns ----------
  { const fr = mulberry(31), stripes = (c1, c2, rows = 8) => { const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');   // (a field's rows)
      for (let k = 0; k < rows; k++) { x.fillStyle = k % 2 ? c1 : c2; x.fillRect(0, k * 16 / rows, 16, 16 / rows); } for (let k = 0; k < 20; k++) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(fr() * 16 | 0, fr() * 16 | 0, 1, 1); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const FIELDS = [['#d9b45a', '#c9a04a'], ['#8a6038', '#6b4a2e'], ['#77a146', '#5b8a3c'], ['#c9b77a', '#b8a060'], ['#98b85a', '#7c9a45']].map(([a, b]) => toon('#ffffff', { map: stripes(a, b) }));
    // a patch laid on the rolling ground: from d0 to d1 across, from i0 to i1 along, its rows running along or across
    function field(i0, i1, d0, d1, m, across) {
      const na = 8, nd = 6, pos = [], uv = [], idx = [];
      for (let a = 0; a <= na; a++) for (let b = 0; b <= nd; b++) { const i = Math.round(i0 + (i1 - i0) * a / na), d = d0 + (d1 - d0) * b / nd, q = at(i, d, .3); pos.push(q.x, q.y, q.z);
        const L = (i1 - i0) * ds * a / na, D = (d1 - d0) * b / nd; uv.push(across ? L / 6 : D / 6, across ? D / 20 : L / 20); }
      for (let a = 0; a < na; a++) for (let b = 0; b < nd; b++) { const k = a * (nd + 1) + b; idx.push(k, k + nd + 1, k + 1, k + 1, k + nd + 1, k + nd + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      if (d0 > 0) { g.index.array.reverse(); g.computeVertexNormals(); }                                     // (the right side: turned so it faces up)
      const o = new THREE.Mesh(g, m); o.receiveShadow = true; G.add(o); }
    const farLeaf = ['#355f31', '#467537', '#5b8a3c', '#5f6a35', '#b86a2e'].map(c => toon(c, { map: rep(tex.leaves(), 1.5, 1.5) }));
    function farTree(i, d, k = 1) { const t = new THREE.Group(), H = (2.5 + fr() * 2.5) * k, m = farLeaf[fr() < .12 ? 4 : fr() * 4 | 0];
      t.add(box(.25 * k, H, .25 * k, wood, 0, H / 2, 0)); for (let n = 0; n < 2 + (fr() * 2 | 0); n++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.2 + fr()) * k, 0), m); b.position.set((fr() - .5) * 1.4 * k, H + (fr() - .3) * 1.2 * k, (fr() - .5) * 1.4 * k); b.scale.y = .85; t.add(b); }
      put(t, i, d, 0, fr() * 6); }
    const barnM = toon('#9a3a2c', { map: rep(tex.siding(), 2, 1.5) }), barnRoof = toon('#44484c', { map: tex.shingles() }), farmWall = toon('#e8dcc0', { map: rep(tex.siding(), 2, 1.5) }), farmRoof = toon('#6d4a3a', { map: tex.shingles() });
    function barn(i, d) { const b = new THREE.Group(), W = 9 + fr() * 4, D = 7 + fr() * 2, H = 4;
      b.add(box(W, H, D, barnM, 0, H / 2, 0)); b.add(box(W * .2, H * .7, .1, white, 0, H * .35, -D / 2 - .03));
      const sh = new THREE.Shape(); sh.moveTo(-D / 2 - .3, 0); sh.lineTo(-D / 2 + .6, 1.6); sh.lineTo(0, 2.6); sh.lineTo(D / 2 - .6, 1.6); sh.lineTo(D / 2 + .3, 0); sh.closePath();   // (a gambrel roof)
      const rg = new THREE.ExtrudeGeometry(sh, { depth: W + .4, bevelEnabled: false }); rg.translate(0, 0, -(W + .4) / 2); const r = new THREE.Mesh(rg, barnRoof); r.rotation.y = Math.PI / 2; r.position.y = H; b.add(r);
      show.farm.push({ o: b, label: 'stodoła', note: `${W.toFixed(1)} × ${D.toFixed(1)} m` });
      put(b, i, d, 0, (fr() - .5) * .6 + (d > 0 ? -Math.PI / 2 : Math.PI / 2)); }
    function farmhouse(i, d) { const h = new THREE.Group(), W = 8, D = 7, H = 5.4; h.add(box(W, H, D, farmWall, 0, H / 2, 0));
      const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .4, 0); tri.lineTo(D / 2 + .4, 0); tri.lineTo(0, 2.6); tri.closePath(); const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .6, bevelEnabled: false }); rg.translate(0, 0, -(W + .6) / 2);
      const r = new THREE.Mesh(rg, farmRoof); r.rotation.y = Math.PI / 2; r.position.y = H; h.add(r); for (const x of [-2.2, 0, 2.2]) for (const y of [1.5, 3.9]) h.add(box(1, 1, .08, WINS[0], x, y, -D / 2 - .04));
      put(h, i, d, 0, (fr() - .5) * .4 + (d > 0 ? -Math.PI / 2 : Math.PI / 2)); show.farm.push({ o: h, label: 'dom w gospodarstwie', note: '8 × 7 m' }); }
    // another estate out there: a street of its own running alongside, small houses both sides of it, a tree or two
    const asphaltM = toon('#4a4d52', { map: rep(tex.asphalt(), 1, 1) }), EST = ['#e8dcc0', '#b7c29a', '#a9bccb', '#d8b8a0', '#f0ece2', '#e3c77e'].map(c => toon(c, { map: rep(tex.siding(), 2, 1.5) }));
    const estRoof = ['#8e3b2c', '#5a5f66', '#6d4a3a'].map(c => toon(c, { map: tex.shingles() }));
    function smallHouse(i, d, face) { const h = new THREE.Group(), W = 6.5 + fr() * 2, D = 6 + fr(), H = 2.8 + (fr() < .3 ? 2.6 : 0); h.add(box(W, H, D, EST[fr() * EST.length | 0], 0, H / 2, 0));
      const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .3, 0); tri.lineTo(D / 2 + .3, 0); tri.lineTo(0, 2); tri.closePath(); const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .4, bevelEnabled: false }); rg.translate(0, 0, -(W + .4) / 2);
      const r = new THREE.Mesh(rg, estRoof[fr() * 3 | 0]); r.rotation.y = Math.PI / 2; r.position.y = H; h.add(r); for (const x of [-W * .28, W * .28]) h.add(box(1, 1, .08, WINS[fr() * WINS.length | 0], x, 1.5, -D / 2 - .04)); h.add(box(.9, 1.9, .08, dark, 0, .95, -D / 2 - .04));
      put(h, i, d, 0, face); }
    function estate(i0, i1, d0) { const dr = d0 + 12, sgn = Math.sign(d0);
      field(i0, i1, dr - 3, dr + 3, asphaltM, true);                                                  // (its street)
      for (let i = i0 + Math.round(5 / ds); i < i1 - Math.round(4 / ds); i += Math.round((11 + fr() * 4) / ds)) for (const side of [-1, 1]) {
        smallHouse(i, dr + side * 9.5 * sgn, side * sgn > 0 ? -Math.PI / 2 : Math.PI / 2); if (fr() < .35) farTree(i + Math.round(5 / ds), dr + side * 5.5 * sgn, .8); } }
    for (const sd of [-INNER]) {                                        // (the outside of the loop only)
      for (const [r0, r1] of [[46, 54], [100, 110]]) { let i = Math.round(fr() * 60 / ds);        // (two rows of them: near, and far)
      while (i < N - 20) { const lenM = 30 + fr() * 40, i1 = Math.min(N - 1, i + Math.round(lenM / ds)), d0 = r0 + fr() * (r1 - r0), d1r = d0 + 28 + fr() * (r0 > 60 ? 50 : 38), d1 = r0 < 60 ? Math.min(d1r, 82) : d1r, kind = fr();   // (the near row stops short of the country road)
        if (kind < .5) { field(i, i1, sd * d0, sd * d1, FIELDS[fr() * FIELDS.length | 0], fr() < .5);                            // a field, a hedge along its near edge now and then
          if (fr() < .55) for (let j = i; j < i1; j += Math.round(3.2 / ds)) { const hg = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + fr() * .5, 0), bushM); hg.scale.set(1.2, .8, 1.2); hg.position.copy(at(j, sd * (d0 - 1.2), .6)); G.add(hg); } }
        else if (kind < .76 && r0 < 60) estate(i, i1, sd * (d0 + 6));                                                  // another estate
        else if (kind < .88) { for (let n = 0; n < 7 + (fr() * 10 | 0); n++) farTree(i + Math.round(fr() * (i1 - i)), sd * (d0 + fr() * (d1 - d0)), 1 + fr() * .5); }   // a grove
        else { const im = Math.round((i + i1) / 2); farmhouse(im, sd * (d0 + 8)); barn(im + Math.round(16 / ds), sd * (d0 + 14)); field(i, i1, sd * (d0 + 22), sd * d1, FIELDS[fr() * 3 | 0], true); }   // a farm
        i = i1 + Math.round((3 + fr() * 8) / ds); } }
      for (let k = 0; k < 150; k++) { const i = fr() * N | 0, dd = 45 + fr() * 130, sc = .9 + fr() * .6; if (dd > 81 && dd < 91) continue; farTree(i, sd * dd, sc); }                                   // trees about the land
      for (let k = 0; k < 220; k++) farTree(fr() * N | 0, sd * (178 + fr() * 18), 1.6 + fr() * .8);                                  // and a wall of them at the far edge
    }
    // inside the loop, behind the houses: woods, thick ones, here and there (leafy trees and spruces, bushes under them)
    { const wr = mulberry(47); let i = Math.round(wr() * 40 / ds);
      while (i < N - 10) { const lenM = 25 + wr() * 25, i1 = Math.min(N - 1, i + Math.round(lenM / ds));
        for (let n = 0; n < 16 + (wr() * 16 | 0); n++) { const ii = i + Math.round(wr() * (i1 - i)), dd = INNER * (32 + wr() * 20); if (!free(ii, dd, 1.6)) continue;
          if (wr() < .35) { const t = new THREE.Group(), H = 6 + wr() * 5; t.add(box(.22, H * .3, .22, wood, 0, H * .15, 0)); for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.7 - k * .34) * (H / 10), H * .34, 7), spruceM); c.position.y = H * (.3 + k * .19); t.add(c); } put(t, ii, dd, 0, wr() * 6); }
          else farTree(ii, dd, .9 + wr() * .5);
          if (wr() < .5) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8 + wr() * .6, 0), bushM); b.scale.y = .7; put(b, ii + Math.round((wr() - .5) * 3 / ds), dd + (wr() - .5) * 3, .4); } }
        i = i1 + Math.round((30 + wr() * 50) / ds); } }
    // the railway, round the outside of the loop between the spruces and the fields: an embankment of ballast, sleepers, two rails
    { const dR = -INNER * 41.5, pts = [], step = 2; let L = 0;
      for (let i = 0; i <= N; i += step) { const q = at(i % N, dR, 0); if (pts.length) L += q.distanceTo(pts[pts.length - 1].p); pts.push({ p: q, s: L }); }
      const pos = [], idx = [], ballastM = toon('#8a857c', { map: rep(tex.slabs(), 1, 1) });
      for (let k = 0; k < pts.length; k++) { const i = (k * step) % N; for (const [dd, y] of [[-2.4, -.05], [-1.3, .22], [1.3, .22], [2.4, -.05]]) { const q = at(i, dR + dd, y); pos.push(q.x, q.y, q.z); } }
      for (let k = 0; k < pts.length - 1; k++) for (let c = 0; c < 3; c++) { const a = k * 4 + c, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; let up = 0; for (let k = 0; k < n.count; k++) up += n.getY(k); if (up < 0) { g.index.array.reverse(); g.computeVertexNormals(); } }
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2).map((_, k) => k % 2 ? (k >> 1) * .5 : ((k >> 1) % 4) * .3), 2));
      const emb = new THREE.Mesh(g, ballastM); emb.receiveShadow = true; G.add(emb);
      const sleeperM = toon('#5a4030'), railM = toon('#6e7478'), yawAt = k => { const a = pts[Math.max(0, k - 1)].p, b = pts[Math.min(pts.length - 1, k + 1)].p; return Math.atan2(b.x - a.x, b.z - a.z); };
      let next = 0; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], seg = b.s - a.s, yaw = yawAt(k), mid = a.p.clone().lerp(b.p, .5);
        for (const sd of [-.72, .72]) { const r = box(.08, .1, seg + .02, railM); r.position.set(mid.x + Math.cos(yaw) * sd, mid.y + .38, mid.z - Math.sin(yaw) * sd); r.rotation.y = yaw; G.add(r); }
        while (next < b.s) { const t = (next - a.s) / seg, q = a.p.clone().lerp(b.p, t), sl = box(2.3, .1, .24, sleeperM, q.x, q.y + .28, q.z); sl.rotation.y = yaw; G.add(sl); next += 1.1; } }
      // the train: an engine and wagons (carriages or goods), going round and round; each car set on the rails by its two bogies
      const tr = mulberry(59), T = new THREE.Group(); T.userData.keep = true; G.add(T);
      const dark = toon('#2a2c30'), roofM = toon('#8d9194'), win = toon('#3f5566'), yel = toon('#e3c77e');
      const car = (L, kind) => { const c = new THREE.Group(), H = kind === 'hopper' ? 2.4 : 3.1, body = kind === 'engine' ? toon('#3f6b35') : kind === 'coach' ? toon(['#8e3b2c', '#2f4a5a', '#3f6b35'][tr() * 3 | 0]) : kind === 'box' ? toon('#6b4a2e') : toon('#44484c');
        c.add(box(2.8, H, L, body, 0, 1.1 + H / 2, 0)); c.add(box(2.9, .2, L + .1, kind === 'hopper' ? body : roofM, 0, 1.1 + H + .1, 0));
        for (const z of [-L / 2 + 2.2, L / 2 - 2.2]) { c.add(box(2.2, .7, 2.6, dark, 0, .75, z)); for (const x of [-.72, .72]) for (const dz of [-.8, .8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .14, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(x, .6, z + dz); c.add(w); } }
        if (kind === 'engine') { for (const z of [-L / 2, L / 2]) { c.add(box(2.82, .5, .06, yel, 0, 1.6, z + Math.sign(z) * .02)); c.add(box(2.2, .8, .06, win, 0, 3.2, z + Math.sign(z) * .03)); }
          c.add(box(.1, .9, 1.6, dark, 0, 4.65, 0)); c.add(box(1.6, .08, .1, dark, 0, 5.1, 0)); for (const sd of [-1, 1]) c.add(box(.06, .5, 5, yel, sd * 1.42, 1.9, 0)); }
        if (kind === 'coach') for (let z = -L / 2 + 1.4; z < L / 2 - 1; z += 1.5) for (const sd of [-1, 1]) c.add(box(.06, .8, 1.0, win, sd * 1.42, 3.1, z));
        if (kind === 'box') for (const sd of [-1, 1]) c.add(box(.06, 2.2, 2.4, toon('#5a3a24'), sd * 1.42, 2.4, 0));
        if (kind === 'hopper') c.add(box(2.5, .3, L - .6, toon('#1d1e21'), 0, 1.1 + H - .05, 0));
        c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); T.add(c); return { g: c, L }; };
      const cars = [car(15, 'engine')]; const goods = tr() < .5; for (let n = 0; n < 5; n++) cars.push(car(goods ? 12 : 16, goods ? (n % 2 ? 'box' : 'hopper') : 'coach'));
      const RL = pts[pts.length - 1].s, where = s0 => { let s1 = ((s0 % RL) + RL) % RL, lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s <= s1) lo = m; else hi = m; } const a = pts[lo], b = pts[hi]; return a.p.clone().lerp(b.p, (s1 - a.s) / Math.max(1e-6, b.s - a.s)); };
      let head = tr() * RL; const v = 15;
      train.update = dt => { head += v * dt; let s0 = head; for (const c of cars) { const f = where(s0 - 2.2), r = where(s0 - c.L + 2.2), m = f.clone().lerp(r, .5); c.g.position.set(m.x, m.y + .3, m.z); c.g.rotation.y = Math.atan2(f.x - r.x, f.z - r.z); s0 -= c.L + 1; } };
      train.update(0); train.rail = { pts, len: RL, d: dR }; }
    // hills round it all, and mountains behind them, bluer the farther (low enough not to hide the lake and the town beyond)
    { const hillM = ['#467537', '#5b8a3c', '#5f6a35', '#355f31'].map(c => toon(c, { map: rep(tex.grass(1), 8, 8) })), mtM = ['#5e7c86', '#6f8e97', '#4f6b75'].map(c => toon(c)), snowM = toon('#e9e3d1');
      const cx = 90, cz = 0;
      for (let k = 0; k < 34; k++) { const a = k / 34 * 6.283 + fr() * .12, R = 285 + fr() * 50, h = 16 + fr() * 22, w = 40 + fr() * 40;
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), hillM[fr() * 4 | 0]); m.scale.set(w, h, w * (.7 + fr() * .5)); m.position.set(cx + Math.cos(a) * R, -h * .35, cz + Math.sin(a) * R); m.rotation.y = fr() * 6; G.add(m); }
      for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + fr() * .25, R = 380 + fr() * 35, h = 30 + fr() * 34, w = 55 + fr() * 45, i = fr() * 3 | 0;   // (inside the painted panorama, low: its lake and town still show)
        const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 6 + (fr() * 3 | 0)), mtM[i]); m.scale.set(w, h, w); m.position.set(cx + Math.cos(a) * R, h * .5 - 12, cz + Math.sin(a) * R); m.rotation.y = fr() * 6; G.add(m);
        if (h > 56) { const c = new THREE.Mesh(new THREE.ConeGeometry(1, 1, m.geometry.parameters.radialSegments), snowM); c.scale.set(w * .28, h * .28, w * .28); c.position.set(m.position.x, m.position.y + h * .36, m.position.z); c.rotation.y = m.rotation.y; G.add(c); } }
    } }
  // the crowns: every clump and every card of leaves, into one mesh each (the cards' shadows cut by their alpha)
  if (!showcase) { G.updateMatrixWorld(true); const by = new Map(), gone = [];
    G.traverse(o => { if (!o.isMesh || !o.userData.foliage) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(g); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const [m, gs] of by) { const mm = new THREE.Mesh(mergeGeometries(gs), m); mm.castShadow = true; mm.receiveShadow = true; if (m === cardM) mm.customDepthMaterial = cardDepth; G.add(mm); } }
  // ---------- all the still things merged, material by material, into a few meshes (a mailbox stays itself: its flag moves) ----------
  if (!showcase) { G.updateMatrixWorld(true); const buckets = new Map(), gone = [];
    const kept = o => { for (let q = o; q && q !== G; q = q.parent) if (q.userData.keep) return true; return false; };
    G.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || o.material.vertexColors || o.material.transparent || kept(o)) return;   // (two materials on one mesh, a car's glasshouse: left as it is)
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      const k = o.material.uuid; if (!buckets.has(k)) buckets.set(k, { m: o.material, gs: [] }); buckets.get(k).gs.push(g); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const { m, gs } of buckets.values()) { const mm = new THREE.Mesh(mergeGeometries(gs), m); mm.castShadow = mm.receiveShadow = true; G.add(mm); } }

  // ---------- where on the road is a point? (searched from the last place) ----------
  function probe(x, z, hint = 0) {
    const all = hint < 0; let best = all ? 0 : hint, bd = 1e9;                 // (hint < 0: no idea where: look along all of it)
    for (let k = all ? 0 : -40; k <= (all ? N - 1 : 40); k++) { const i = all ? k : ((hint + k) % N + N) % N, p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = i; } }
    const s = S[best], nx = S[(best + 1) % N], t = THREE.MathUtils.clamp(((x - s.p.x) * s.f.x + (z - s.p.z) * s.f.z) / ds, -1, 1);
    const i0 = t >= 0 ? best : (best + N - 1) % N, i1 = (i0 + 1) % N, k = t >= 0 ? t : 1 + t, a = S[i0], b = S[i1];
    const cy = a.p.y + (b.p.y - a.p.y) * k, off = (x - s.p.x) * s.r.x + (z - s.p.z) * s.r.z;
    return { i: best, d: off, y: cy + hAt(off, best), f: s.f, slope: (b.p.y - a.p.y) / ds, s: best * ds + t * ds };
  }
  return { group: G, probe, S, N, ds, len, INNER, fires, annexes, show, train, farRoad: -INNER * 86, parked, seats, mailboxes, colliders, near, windows, doors, bundles, ramps, lots, cars: CARS, centre: new THREE.Vector3(90, 0, 0), start: { x: S[0].p.x, z: S[0].p.z, yaw: Math.atan2(S[0].f.x, S[0].f.z) }, ROAD, KERB, PAVE };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
