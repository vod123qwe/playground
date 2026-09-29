// The balconies, to sit out on (plan centimetres, as rooms.js; their slabs' top is 3 cm under the floor inside):
//  - the living room's (5.5 x 1.5 m): by its single door, close to it, two low teak lounge chairs with thick cream cushions and a
//    little round teak coffee table between them; an olive tree in a stone pot at the far end; troughs of
//    feather grass along the rail by the big window;
//  - the bedroom's (the strip under the bedroom, 4.2 x 1.5 m): a sand half-parasol on a mast at the wall over a low teak daybed,
//    140 x 200, a mattress and cushions on it, a little side table; grass troughs further along;
//  - on both, a string of warm bulbs along the wall at 2.3 m, sagging between hooks: a switch of its own (lit on the evening 360s).

export function buildBalconies({ THREE, root, std, box, foot, lamps, canvasTex, rng, mergeGeometries, linen, oakMaps, balconies }) {
  const q = rng(1201), seats = [];
  const put = (g, m, x, y, z, parent = root) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // a frame along a wall: s along it from p0 (unit e), t out from it (unit n); a group placed and turned so its x = s, its z = t
  const frame = (p0, e) => { const G = new THREE.Group(); G.position.set(p0[0], 0, p0[1]); G.rotation.y = Math.atan2(-e[1], e[0]); root.add(G); return G; };
  const toW = (p0, e, n, s, t) => [p0[0] + e[0] * s + n[0] * t, p0[1] + e[1] * s + n[1] * t];
  const teak = std({ name: 'teak', ...oakMaps, normalScale: new THREE.Vector2(.3, .3), color: '#b98a5e', roughness: .75 });
  const cream = linen('#efe7da'), sand = linen('#d9c7a8'), terra = linen('#b86f4f'), olive = linen('#8d8f6a');

  // ---------- pieces ----------
  function lounge(G, s, t, turn) {                                     // a low teak lounge chair, 70 x 76, its seat at 38, deep cream cushions
    const C = new THREE.Group(); C.position.set(s, 0, t); C.rotation.y = turn; G.add(C);
    const c = (x0, x1, y0, y1, z0, z1, m, o = {}) => box(x0, x1, y0, y1, z0, z1, m, { parent: C, ...o });
    for (const x of [-33, 29]) { c(x, x + 4, 0, 58, -34, -30, teak, { r: .8 }); c(x, x + 4, 0, 52, 32, 36, teak, { r: .8 });   // the legs, the arms
      c(x, x + 4, 52, 56, -36, 38, teak, { r: 1.2 }); }
    for (let k = 0; k < 6; k++) c(-29, 29, 22, 24, -30 + k * 10.5, -23 + k * 10.5, teak, { r: .6 });                        // the slats
    const back = new THREE.Group(); back.position.set(0, 24, -32); back.rotation.x = -.28; C.add(back);
    for (let k = 0; k < 5; k++) box(-29, 29, 4 + k * 10, 10 + k * 10, -2, 0, teak, { r: .6, parent: back });
    c(-29, 29, 24, 38, -30, 34, cream, { r: 5, scale: 45, soft: .9, seed: 3 + turn * 10 | 0 });                           // the seat cushion
    const bc = box(-28, 28, 4, 50, 0, 13, cream, { r: 5, scale: 45, soft: 1, seed: 5, parent: back }); void bc;        // the back cushion
    const sc = c(-18, 18, 38, 70, -18, -8, turn > 0 ? terra : sand, { r: 5, scale: 45, soft: .8, seed: 7 }); sc.rotation.x = -.35;   // a scatter cushion
    const an = new THREE.Object3D(); an.position.set(0, 40, 6); C.add(an); seats.push({ name: 'lounge chair', anchors: [an], get meshes() { const m = []; C.traverse(o => { if (o.isMesh) m.push(o); }); return m; } });
    return C;
  }
  function roundTable(G, s, t, d, h) {                                  // teak, on three legs
    const T = new THREE.Group(); T.position.set(s, 0, t); G.add(T);
    put(new THREE.CylinderGeometry(d / 2, d / 2, 2.4, 48), teak, 0, h - 1.2, 0, T);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3, l = put(new THREE.CylinderGeometry(1.4, 1.7, h - 2.4, 12), teak, Math.cos(a) * d * .3, (h - 2.4) / 2, Math.sin(a) * d * .3, T); l.rotation.set(Math.sin(a) * .12, 0, -Math.cos(a) * .12); }
    return T;
  }
  const stoneM = std({ name: 'pot', color: '#a8a39a', roughness: .85 }), soilM = std({ name: 'soil', color: '#3b2e24', roughness: 1 });
  function trough(G, s, t, L) {                                        // a fibre-clay trough, 22 deep, 40 high, full of feather grass
    box(s - L / 2, s + L / 2, 0, 40, t - 11, t + 11, std({ name: 'pot', color: '#595a5a', roughness: .8 }), { r: 1.5, parent: G });
    box(s - L / 2 + 2, s + L / 2 - 2, 36, 38, t - 9, t + 9, soilM, { parent: G });
    const blades = [], r = rng((s * 7) | 0);
    for (let k = 0; k < L * 1.6; k++) {
      const x = s + (r() - .5) * (L - 6), z = t + (r() - .5) * 16, hgt = 35 + r() * 40, lean = (r() - .5) * 1.1, dirA = r() * Math.PI * 2, w = .7 + r() * .6;
      const pts = []; for (let i = 0; i <= 5; i++) { const u = i / 5, bend = lean * u * u * hgt * .5; pts.push([x + Math.cos(dirA) * bend, 38 + u * hgt * (1 - .15 * u * Math.abs(lean)), z + Math.sin(dirA) * bend, w * (1 - u)]); }
      const P = [], I = [], C = [];
      for (let i = 0; i < pts.length; i++) { const [px, py, pz, ww] = pts[i], t2 = i / (pts.length - 1); P.push(px - ww * Math.sin(dirA), py, pz + ww * Math.cos(dirA), px + ww * Math.sin(dirA), py, pz - ww * Math.cos(dirA));
        const cA = [.42 + .35 * t2, .5 + .25 * t2, .28 + .2 * t2]; C.push(...cA, ...cA); if (i) I.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); bg.setIndex(I); blades.push(bg);
    }
    const g = mergeGeometries(blades); g.computeVertexNormals();
    const m = new THREE.Mesh(g, std({ name: 'grass', vertexColors: true, roughness: .8, side: THREE.DoubleSide })); m.castShadow = true; G.add(m);
  }
  function oliveTree(G, s, t) {                                         // in a stone pot, 50 across; a crown of silver-green leaves at 1.1 to 1.9 m
    put(new THREE.LatheGeometry([[0, 0], [20, 0], [24, 4], [26, 44], [27.5, 46], [26, 47], [0, 45]].map(([a, b]) => new THREE.Vector2(a, b)), 40), stoneM, s, 0, t, G);
    const trunk = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s, 44, t), new THREE.Vector3(s + 3, 80, t - 2), new THREE.Vector3(s - 2, 115, t + 2), new THREE.Vector3(s + 1, 135, t)]), 16, 3, 8);
    put(trunk, std({ name: 'bark', color: '#6d6252', roughness: .95 }), 0, 0, 0, G);
    const leaf = new THREE.PlaneGeometry(1, 1); { const p = leaf.attributes.position; for (let i = 0; i < p.count; i++) p.setXY(i, p.getX(i) * 1.2, p.getY(i) * 5.5); }
    const leaves = [], m4 = new THREE.Matrix4(), qu = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), ps = new THREE.Vector3(), r = rng(515);
    for (const [cx, cy, cz, cr] of [[0, 150, 0, 26], [-16, 138, 10, 18], [15, 142, -8, 19], [4, 170, 4, 20], [-8, 164, -12, 15]]) {
      for (let k = 0; k < 260; k++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, rr = cr * Math.cbrt(.35 + .65 * r());
        ps.set(s + cx + Math.sqrt(1 - u * u) * Math.cos(a) * rr, cy + u * rr * .8, t + cz + Math.sqrt(1 - u * u) * Math.sin(a) * rr); e.set(r() * 6, r() * 6, r() * 6); qu.setFromEuler(e);
        leaves.push(leaf.clone().applyMatrix4(m4.compose(ps, qu, sc))); } }
    const L = new THREE.Mesh(mergeGeometries(leaves), std({ name: 'oliveLeaf', color: '#85906c', roughness: .6, side: THREE.DoubleSide })); L.castShadow = true; G.add(L);
  }
  const bulbM = std({ name: 'fairyBulb', color: '#fff3dc', roughness: .3, emissive: '#ffcf8e', emissiveIntensity: 0 }), wireM = std({ name: 'plasticBlack', color: '#1d1c1b', roughness: .6 });
  const bulbMeshes = [];
  function stringLights(G, s0, s1, t) {                                 // a wire along the wall at 2.3 m, sagging 10 cm between hooks every metre; a bulb every 30 cm
    const pts = [], n = Math.max(1, Math.round((s1 - s0) / 100));
    for (let k = 0; k <= 60 * n; k++) { const s = s0 + (s1 - s0) * k / (60 * n), f = ((s - s0) / ((s1 - s0) / n)) % 1; pts.push(new THREE.Vector3(s, 230 - 10 * 4 * f * (1 - f), t)); }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60 * n, .15, 5), wireM); G.add(wire);
    const bulbs = []; for (let s = s0 + 15; s < s1 - 5; s += 30) { const f = ((s - s0) / ((s1 - s0) / n)) % 1, y = 230 - 40 * f * (1 - f) - 5;
      bulbs.push(new THREE.SphereGeometry(2.2, 16, 12).translate(s, y, t)); bulbs.push(new THREE.CylinderGeometry(.9, .9, 3, 8).translate(s, y + 3, t)); }
    const B = new THREE.Mesh(mergeGeometries(bulbs), bulbM); G.add(B); bulbMeshes.push(B, wire);
  }

  // ---------- the living room's balcony: along its wall from (459, -1248), out to the rail at 150 ----------
  { const p0 = [459, -1248], p1 = [796, -813], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), e = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L], n = [e[1], -e[0]];   // n: out, away from the flat
    const G = frame(p0, e); G.position.y = -3;                          // (on the slab, 3 cm under the floor inside)                                              // (in G: x = s along the wall, z = -t: the frame's z runs into the flat)
    lounge(G, 385, -50, 2.18); lounge(G, 493, -50, -2.18);                   // (each facing the table, turned 35 degrees out to the view) roundTable(G, 439, -60, 34, 36);     // by the single door (s 408..499), close to it: a little coffee table between them
    oliveTree(G, 30, -112);
    trough(G, 110, -135, 80); trough(G, 205, -135, 80);
    stringLights(G, 10, 540, -8);
    for (const [s, t, rr] of [[385, 50, 40], [493, 50, 40], [439, 60, 19], [30, 112, 28]]) { const c = toW(p0, e, n, s, t); foot.push(Array.from({ length: 10 }, (_, i) => [c[0] + Math.cos(i / 10 * Math.PI * 2) * rr, c[1] + Math.sin(i / 10 * Math.PI * 2) * rr])); }
    for (const s of [110, 205]) { const a = toW(p0, e, n, s - 40, 124), b = toW(p0, e, n, s + 40, 124), c = toW(p0, e, n, s + 40, 146), d = toW(p0, e, n, s - 40, 146); foot.push([a, b, c, d]); }
  }
  // ---------- the bedroom's balcony, its strip under the bedroom (z 0 .. 150, from x 660): the half-parasol over the daybed ----------
  { const G = new THREE.Group(); G.position.y = -3; root.add(G);        // plain plan axes here: the wall at z = 0, the rail at 150; on the slab
    const X0 = 690, X1 = 890, Z0 = 6, Z1 = 144;                         // the daybed
    const DB = new THREE.Group(); G.add(DB);                                                                                  // (the daybed's parts, to sit on)
    box(X0, X1, 6, 30, Z0, Z1, teak, { r: 1.2, parent: DB });                                                             // its teak platform,
    for (const x of [X0 + 3, X1 - 7]) for (const z of [Z0 + 3, Z1 - 7]) box(x, x + 4, 0, 6, z, z + 4, teak, { r: .5, parent: G });
    box(X0 + 2, X1 - 2, 30, 44, Z0 + 2, Z1 - 2, cream, { r: 6, scale: 45, soft: .8, seed: 31, parent: DB });                 // the mattress,
    { const an = [X0 + 55, X1 - 55].map(x => { const o = new THREE.Object3D(); o.position.set(x, 46, Z0 + 48); DB.add(o); return o; }); seats.push({ name: 'daybed', anchors: an, get meshes() { const m = []; DB.traverse(o => { if (o.isMesh) m.push(o); }); return m; } }); }
    for (let k = 0; k < 3; k++) { const c = box(X0 + 8 + k * 62, X0 + 64 + k * 62, 44, 88, Z0 + 4, Z0 + 20, k === 1 ? sand : cream, { r: 6, scale: 45, soft: 1.1, seed: 33 + k, parent: G }); c.rotation.x = -.2; }
    for (const [x, m, rt] of [[X0 + 40, terra, .3], [X1 - 44, olive, -.25]]) { const c = box(x - 20, x + 20, 44, 80, Z0 + 22, Z0 + 34, m, { r: 5, scale: 45, soft: .9, seed: 40 + (x | 0), parent: G }); c.rotation.set(-.45, rt, 0); }
    const throwC = box(X0 + 110, X1 - 6, 44, 46.5, Z0 + 60, Z1 - 4, linen('#c9b79c'), { r: 1, scale: 45, soft: .8, seed: 47, parent: G }); void throwC;
    roundTable(G, X1 + 32, 40, 40, 42);                                                                                       // the side table
    // the half-parasol: a mast on the wall at the daybed's middle, the canopy a half dome 270 across and 135 out, sand canvas
    const MX = (X0 + X1) / 2, alu = std({ name: 'aluminium', color: '#c9cbcd', roughness: .35, metalness: 1 });
    put(new THREE.CylinderGeometry(2, 2, 250, 16), alu, MX, 125, 4, G);
    box(MX - 5, MX + 5, 20, 34, 1, 6, alu, { r: .6, parent: G }); box(MX - 5, MX + 5, 180, 194, 1, 6, alu, { r: .6, parent: G });   // the wall brackets
    const prof = [[0, 244], [30, 240], [70, 230], [110, 216], [135, 206], [135.5, 203]].map(([a, b]) => new THREE.Vector2(a, b));
    const can = new THREE.Mesh(new THREE.LatheGeometry(prof, 48, 0, Math.PI), std({ name: 'canvas', color: '#d8c8aa', roughness: .95, side: THREE.DoubleSide }));
    can.position.set(MX, 0, 4); can.rotation.y = -Math.PI / 2; can.castShadow = can.receiveShadow = true; G.add(can);   // (the half from the wall out, +z)
    for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI, rib = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(prof.map(v => new THREE.Vector3(Math.cos(a) * v.x, v.y - .6, Math.sin(a) * v.x))), 20, .4, 5);
      const r2 = new THREE.Mesh(rib, alu); r2.position.set(MX, 0, 4); G.add(r2); }
    trough(G, 990, 130, 80); trough(G, 1060, 118, 50);
    stringLights(G, 670, 1075, 8);
    foot.push([[X0 - 2, 0], [X1 + 2, 0], [X1 + 2, 150], [X0 - 2, 150]], [[X1 + 12, 20], [X1 + 52, 20], [X1 + 52, 60], [X1 + 12, 60]], [[950, 119], [1085, 107], [1085, 150], [950, 150]]);
  }
  lamps.push({ name: 'balcony lights', on: false, meshes: bulbMeshes, set(v) { this.on = !!v; bulbM.emissiveIntensity = v ? 2.4 : 0; } });
  return { seats };
}
