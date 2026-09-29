// H, the child's room (13.9 m2; x 19 .. 393, z -415 .. -44 in plan centimetres, as rooms.js). North is the wall at x = 19, south the
// one at x = 393 with the door and the radiator, the balcony door on the west (z = -44).
//  - the walls in a powder pink, matt; on the north wall a moulding to 1.2 m: a rail at 120 and frames under it;
//  - from the door, on the right, an IKEA PAX along the east wall (three 75 frames, white, a filler at the door's wall), stopping short
//    of the corner, as A.04 draws it; there, along the north wall and pushed into the corner behind the PAX, a 90 x 200 bed built in
//    on the wall side: a padded pink panel along the wall and an arched headboard, cream bedding; a knitted pouf at its foot;
//  - at the radiator, facing it, an IKEA MICKE desk (73 x 50, white) and an ORFJALL chair on castors, pink; on
//    the south wall between the door and the radiator a small white toy cabinet;
//  - in the middle a round, subtly shaggy rug (160, a blush cream) and over it a hanging bag swing from the ceiling, its way in
//    towards the door, kept clear of the ceiling lamp.

export function buildKidroom({ THREE, root, std, box, foot, linen, oak, canvasTex, rng, mergeGeometries, pax, hallMats, H }) {
  const q = rng(4401), paxDoors = [], seats = [];
  const put = (g, m, x, y, z, parent = root) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const pink = std({ name: 'paintPink', color: '#e6c6bf', roughness: .92 }), mould = std({ name: 'paintPink', color: '#ebcfc9', roughness: .85 });
  const white = std({ name: 'carcass', color: '#f3f1ed', roughness: .55 }), blush = linen('#e2b3ad'), cream = linen('#f1e9df');

  // ---------- the walls: pink faces 3 mm proud of the paint, round the door and the balcony door ----------
  function face(a, b, n, y0, y1) {
    const o = .3, P = [[a, y0], [b, y0], [b, y1], [a, y1]].map(([p, y]) => [p[0] + n[0] * o, y, p[1] + n[1] * o]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
    const e = [b[0] - a[0], b[1] - a[1]], cr = [-e[1], e[0]]; g.setIndex(cr[0] * n[0] + cr[1] * n[1] > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    g.computeVertexNormals(); const m = new THREE.Mesh(g, pink); m.receiveShadow = true; root.add(m);
  }
  face([19, -414.4], [19.9, -43.8], [1, 0], 0, H);                                   // north
  face([392.9, -415.2], [392.9, -344.1], [-1, 0], 0, H); face([392.9, -344.1], [392.9, -262.2], [-1, 0], 208, H); face([392.9, -262.2], [392.9, -44.7], [-1, 0], 0, H);   // south, round the door
  face([19, -414.4], [392.9, -415.2], [0, 1], 0, H);                                 // east
  face([19.9, -43.8], [64.5, -43.9], [0, -1], 0, H); face([64.5, -43.9], [335.8, -44.4], [0, -1], 242, H); face([335.8, -44.4], [392.9, -44.7], [0, -1], 0, H);   // west, round the balcony door

  // ---------- the north wall's moulding, to 1.2 m: a rail at 118 .. 122 and frames under it, from the bed's panel to the window ----------
  const WX = 19.8;                                                    // the wall's face
  box(WX, WX + 2.2, 118, 122, -412, -48, mould, { r: .7 });
  for (const [z0, z1] of [[-202, -127], [-121, -52]]) { const y0 = 16, y1 = 106, t = 2.6;
    box(WX, WX + 1.5, y0, y0 + t, z0, z1, mould, { r: .5 }); box(WX, WX + 1.5, y1 - t, y1, z0, z1, mould, { r: .5 });
    box(WX, WX + 1.5, y0, y1, z0, z0 + t, mould, { r: .5 }); box(WX, WX + 1.5, y0, y1, z1 - t, z1, mould, { r: .5 }); }

  // ---------- the PAX along the east wall, from the door's wall: pax() builds along z, doors to +x; turned so they face +z ----------
  { const G = new THREE.Group(); G.position.set(392.9, 0, -414.6); G.rotation.y = -Math.PI / 2; root.add(G);
    const r = pax({ THREE, root: G, mats: hallMats, x0: 0, z0: 0, z1: 242, frames: [75, 75, 75], fill: 'z0' });
    foot.push(r.foot.map(([x, z]) => [392.9 - z, -414.6 + x])); paxDoors.push(...r.doors); }

  // ---------- the bed on the north wall, pushed into the corner (A.04 draws it at x 20 .. 111, head towards the PAX) ----------
  const BZ0 = -407, BZ1 = -203, BX0 = 28, BX1 = 118;                   // the head against the east wall, behind the PAX's end
  for (let z = BZ0 - 7; z < BZ1 - 1; z += 15.3) box(WX + .3, BX0, 6, 96, z + .4, Math.min(BZ1, z + 15.3) - .4, blush, { r: 3, scale: 45, soft: .5, seed: 50 + (z | 0) });   // the padded wall panel, in channels
  { const s = new THREE.Shape(), w = BX1 - BX0, hb = 100; s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, hb - w / 2); s.absarc(w / 2, hb - w / 2, w / 2, 0, Math.PI, false); s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 7, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 4, curveSegments: 32 });
    const hbM = put(g, blush, BX0, 0, BZ0 - 7); hbM.rotation.y = 0; }                                                     // the arched headboard
  box(BX0 + 1, BX1 - 1, 8, 26, BZ0 + 2, BZ1, white, { r: 1.5 });                                                          // the frame
  for (const x of [BX0 + 4, BX1 - 8]) for (const z of [BZ0 + 6, BZ1 - 6]) box(x, x + 4, 0, 8, z - 2, z + 2, oak, { r: .6 });
  box(BX0 + 2, BX1 - 2, 26, 42, BZ0 + 4, BZ1 - 2, cream, { r: 5, scale: 45, soft: .3, seed: 61 });                        // the mattress
  box(BX0, BX1 + 1.5, 36, 48, BZ0 + 52, BZ1 - 1, linen('#f5efe8'), { r: 6, scale: 45, soft: 1.3, seed: 62 });           // the duvet
  box(BX0 + 1, BX1, 43, 50, BZ0 + 46, BZ0 + 64, linen('#f5efe8'), { r: 4, scale: 45, soft: .6, seed: 63 });              // its fold
  { const p = box(BX0 + 12, BX1 - 12, 0, 40, -6, 6, cream, { r: 6, scale: 45, soft: 1, seed: 64 }); p.position.set((BX0 + BX1) / 2, 60, BZ0 + 22); p.rotation.x = .38;   // the pillow
    const c = box(-16, 16, 0, 30, -5, 5, blush, { r: 5, scale: 45, soft: .8, seed: 65 }); c.position.set((BX0 + BX1) / 2 + 6, 52, BZ0 + 36); c.rotation.set(.5, .2, 0); }
  box(BX0 - 1, BX1 + 2, 47.5, 49.5, BZ1 - 52, BZ1 - 20, linen('#d9b7a4'), { r: 1, scale: 45, soft: .5, seed: 66 });      // a throw at its foot
  foot.push([[WX, BZ0 - 9], [BX1 + 2, BZ0 - 9], [BX1 + 2, BZ1], [WX, BZ1]]);
  // the pouf at the bed's foot: knitted, 45 across, 35 high
  { const g = new THREE.SphereGeometry(1, 40, 24), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), bump = 1 + .035 * Math.sin(a * 14);
      p.setXYZ(i, x * 22.5 * bump, (y > 0 ? y * .85 : y) * 17.5 + 17.5, z * 22.5 * bump); }
    g.computeVertexNormals(); put(g, linen('#eee2d6'), 58, 0, -172); foot.push(Array.from({ length: 10 }, (_, i) => [58 + Math.cos(i / 10 * 6.283) * 24, -172 + Math.sin(i / 10 * 6.283) * 24])); }

  // ---------- the desk: IKEA MICKE, 73 x 50 x 75, white, by the radiator, facing it: its back 2 cm off the radiator's face (in a frame
  // turned so the desk's back, local +z, is towards the south wall) ----------
  { const G = new THREE.Group(); G.position.set(377, 0, -136); G.rotation.y = Math.PI / 2; root.add(G);
    const toW = (x, z) => [377 + z, -136 - x], bx = (x0, x1, y0, y1, z0, z1, m, o = {}) => box(x0, x1, y0, y1, z0, z1, m, { parent: G, ...o }), pt = (g, m, x, y, z) => put(g, m, x, y, z, G);
    const X0 = -36.5, X1 = 36.5, Z1 = 0, Z0 = -50;
    bx(X0, X1, 73, 75, Z0, Z1, white, { r: .4 });                                                                         // the top
    for (const x of [X0, X1 - 1.8]) bx(x, x + 1.8, 0, 73, Z0 + 1, Z1, white, { r: .3 });                                // the sides
    bx(X0 + 1.8, X1 - 1.8, 30, 73, Z1 - 1.8, Z1, white);                                                                   // the back
    bx(X1 - 36, X1 - 1.8, 62, 73, Z0 + 1, Z1 - 2, white, { r: .3 });                                                       // the drawer,
    bx(X1 - 35.5, X1 - 2.3, 62.5, 72.5, Z0 + .5, Z0 + 1, white, { r: .2 }); bx(X1 - 24, X1 - 14, 66.5, 68.5, Z0, Z0 + .6, std({ name: 'shadowGap', color: '#b9b6b0', roughness: .9 }), { r: .2 });   // its front and grip
    const DX0 = X0, DX1 = X1, Z0d = Z0, Z1d = Z1;
    // on it: a pink desk lamp, a pencil pot, a few books
    const lampM = std({ name: 'lampPink', color: '#e7aeb5', roughness: .5 });
    pt(new THREE.CylinderGeometry(6, 7, 1.6, 32), lampM, DX1 - 12, 75.8, Z1d - 12);
    { const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(DX1 - 12, 76, Z1d - 12), new THREE.Vector3(DX1 - 14, 105, Z1d - 13), new THREE.Vector3(DX1 - 20, 118, Z1d - 24)]), 16, .7, 8); pt(arm, lampM, 0, 0, 0); }
    { const sh = pt(new THREE.ConeGeometry(7.5, 10, 32, 1, true), std({ name: 'lampPink', color: '#e7aeb5', roughness: .5, side: THREE.DoubleSide }), DX1 - 22, 113, Z1d - 28); sh.rotation.x = -.5; }
    pt(new THREE.CylinderGeometry(3.4, 3.4, 10, 24), std({ name: 'lampBase', color: '#f2ece2', roughness: .6 }), DX0 + 10, 80, Z1d - 10);
    for (let i = 0; i < 4; i++) bx(DX0 + 16, DX0 + 38, 75 + i * 2.2, 77 + i * 2.2, Z1d - 22 + (q() - .5) * 2, Z1d - 6 + (q() - .5) * 2, std({ name: 'book', color: ['#8fb3c9', '#f0c8a8', '#bfa6cf', '#e8e0cf'][i], roughness: .8 }), { r: .3 });
    foot.push([toW(DX0, Z0d), toW(DX1, Z0d), toW(DX1, Z1d), toW(DX0, Z1d)]);
    // the chair: IKEA ORFJALL, white on castors, the seat and back in Vissle pink; pulled out a little, turned towards the desk
    const C = new THREE.Group(); C.position.set((DX0 + DX1) / 2 - 4, 0, Z0d - 22); C.rotation.y = .2; G.add(C);   // on the room's side, facing the desk and the radiator
    const wP = std({ name: 'plasticWhite', color: '#f1f0ec', roughness: .45 }), pinkF = linen('#e8a5ae');
    for (let k = 0; k < 5; k++) { const A = new THREE.Group(); A.rotation.y = k / 5 * Math.PI * 2 + .2; C.add(A);
      box(2, 25, 5, 7.5, -1.8, 1.8, wP, { r: .8, parent: A });
      const w = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.6, 16), wP); w.rotation.x = Math.PI / 2; w.position.set(25.5, 2.4, 0); A.add(w); }
    put(new THREE.CylinderGeometry(2.2, 2.2, 32, 16), wP, 0, 22, 0, C);
    box(-20, 20, 37, 40, -17, 18, wP, { r: 2, parent: C }); box(-19.5, 19.5, 40, 45, -16.5, 17.5, pinkF, { r: 3, scale: 45, soft: .5, seed: 71, parent: C });   // the seat
    const bk = box(-19, 19, 48, 82, -21, -17.5, wP, { r: 3, parent: C }); bk.rotation.x = -.1;                                   // the back's shell
    const bc = box(-18, 18, 50, 80, -17.8, -15, pinkF, { r: 3, scale: 45, soft: .4, seed: 72, parent: C }); bc.rotation.x = -.1;  // and cushion
    box(-2, 2, 42, 52, -21, -17, wP, { r: .6, parent: C });
    const [cx, cz] = toW(C.position.x, C.position.z); foot.push(Array.from({ length: 10 }, (_, i) => [cx + Math.cos(i / 10 * 6.283) * 27, cz + Math.sin(i / 10 * 6.283) * 27]));
    { const an = new THREE.Object3D(); an.position.set(0, 45, 0); C.add(an); seats.push({ name: 'desk chair', anchors: [an], get meshes() { const m = []; C.traverse(o => { if (o.isMesh) m.push(o); }); return m; } }); }
  }

  // ---------- the toy cabinet: small, white, two doors with round pink knobs, on the south wall between the door and the radiator;
  // a teddy and a basket on it ----------
  { const X1 = 392.6, X0 = X1 - 40, Z0 = -254, Z1 = -180, Hc = 62, knob = std({ name: 'lampPink', color: '#e7aeb5', roughness: .5 });
    box(X0, X1, 6, Hc, Z0, Z1, white, { r: .8 }); box(X0 + 2, X1, 0, 6, Z0 + 2, Z1 - 2, std({ name: 'shadowGap', color: '#cfcac1', roughness: .9 }));
    box(X0 - .6, X0, 7, Hc - 1, Z0 + .3, (Z0 + Z1) / 2 - .2, white, { r: .3 }); box(X0 - .6, X0, 7, Hc - 1, (Z0 + Z1) / 2 + .2, Z1 - .3, white, { r: .3 });
    for (const z of [(Z0 + Z1) / 2 - 4, (Z0 + Z1) / 2 + 4]) { const k = put(new THREE.SphereGeometry(1.6, 16, 12), knob, X0 - 1.6, Hc - 12, z); void k; }
    // a teddy: a body, a head, ears, arms, legs of soft beige plush
    const plush = linen('#cfae8c'); const T = new THREE.Group(); T.position.set(X0 + 20, Hc, Z0 + 22); T.rotation.y = -Math.PI / 2 + .3; root.add(T);
    for (const [x, y, z, sx, sy, sz] of [[0, 9, 0, 8, 10, 7], [0, 23, 1, 7, 6.5, 6.5], [-5, 29, 0, 2.4, 2.4, 1.6], [5, 29, 0, 2.4, 2.4, 1.6], [-8, 12, 2, 2.6, 5, 2.6], [8, 12, 2, 2.6, 5, 2.6], [-4, 3, 6, 3, 2.8, 5], [4, 3, 6, 3, 2.8, 5], [0, 22, 6.5, 2.6, 2, 2]]) {
      const m = put(new THREE.SphereGeometry(1, 20, 14), plush, x, y, z, T); m.scale.set(sx, sy, sz); }
    put(new THREE.CylinderGeometry(10, 8.5, 14, 32, 1, true), std({ name: 'wicker', color: '#c9a77e', roughness: .9, side: THREE.DoubleSide }), X0 + 20, Hc + 7, Z1 - 16);
    foot.push([[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]]); }

  // ---------- the rug: round, 160, a blush cream pile in ten shells ----------
  { const R = 80, cx = 245, cz = -210, NS = 10, PILE = 2.6, r = rng(4411);
    const tuft = canvasTex(512, 512, (g, w, h) => { const img = g.createImageData(w, h), d = img.data;
      for (let i = 0; i < d.length; i += 4) { d[i] = 240; d[i + 1] = 226; d[i + 2] = 218; d[i + 3] = 0; }
      for (let k = 0; k < 60000; k++) { const x = (r() * w) | 0, y = (r() * h) | 0, a = 60 + r() * 195, rr = 1 + (r() * 2) | 0, t = r();
        for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) { if (dx * dx + dy * dy > rr * rr) continue; const j = (((y + dy + h) % h) * w + ((x + dx + w) % w)) * 4;
          d[j] = 232 + t * 20; d[j + 1] = 214 + t * 24; d[j + 2] = 206 + t * 24; d[j + 3] = Math.max(d[j + 3], a); } }
      g.putImageData(img, 0, 0); });
    tuft.wrapS = tuft.wrapT = THREE.RepeatWrapping;
    const disc = new THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2); { const uv = disc.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * R / 18, uv.getY(i) * 2 * R / 18); }
    put(new THREE.CylinderGeometry(R, R, 1, 96), std({ name: 'rugEdge', color: '#ead8cf', roughness: 1 }), cx, .5, cz);
    for (let k = 0; k < NS; k++) { const t = k / (NS - 1);
      const m = std({ name: 'rugPile', map: tuft, alphaTest: .12 + .8 * t, color: new THREE.Color('#e3cfc6').lerp(new THREE.Color('#f7eee9'), t), roughness: 1 });
      const o = new THREE.Mesh(disc, m); o.position.set(cx, 1.05 + PILE * t, cz); o.receiveShadow = true; root.add(o); } }

  // ---------- the hanging bag swing over the rug: soft cream canvas gathered into a ring at the top, wide and sagging at the bottom, in
  // folds; an oval way in towards the door, a round cushion inside; on a rope from a ceiling hook (45 cm from the ceiling lamp) ----------
  { const SX = 245, SZ = -210, top = 158, NP = 96, NR = 60;
    const prof = [[3, top], [9, top - 6], [20, top - 20], [31, top - 42], [39, top - 68], [44, top - 92], [45, top - 108], [41, top - 121], [30, top - 130], [14, top - 134], [0, top - 135]];
    const curve = new THREE.CatmullRomCurve3(prof.map(([r, y]) => new THREE.Vector3(r, y, 0)));
    const pts = curve.getSpacedPoints(NR), P = [], UV = [], I = [];
    for (let j = 0; j <= NR; j++) { const p = pts[j], v = j / NR;
      for (let i = 0; i <= NP; i++) { const u = i / NP, a = u * Math.PI * 2;
        const gather = Math.max(0, 1 - v * 3.2), fold = 1 + .16 * gather * Math.sin(a * 13) + .04 * (1 - gather) * Math.sin(a * 7 + v * 9) * Math.sin(v * Math.PI);
        const sag = 1 + .06 * Math.max(0, v - .6) * Math.cos(a);                                                      // a little heavier to one side
        const r = p.x * fold * sag; P.push(Math.sin(a) * r, p.y - (v > .7 ? 3 * (v - .7) * (1 + Math.cos(a)) : 0), Math.cos(a) * r); UV.push(u, 1 - v); } }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NP; i++) { const a = j * (NP + 1) + i, b = a + 1, c = a + NP + 1, d = c + 1; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
    const hole = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; c.beginPath(); c.ellipse(w * .5, h * .52, w * .15, h * .24, 0, 0, 7); c.fill(); });
    hole.colorSpace = THREE.NoColorSpace;
    const podM = std({ name: 'podFabric', color: '#efe5dc', roughness: .95, side: THREE.DoubleSide, alphaMap: hole, alphaTest: .5, normalMap: null });
    const pod = new THREE.Mesh(g, podM); pod.position.set(SX, 0, SZ); pod.rotation.y = -.922; pod.castShadow = pod.receiveShadow = true; root.add(pod);   // the way in (at -z) turned to the door
    { const an = new THREE.Object3D(); an.position.set(0, top - 116, 6); an.rotation.y = Math.PI; pod.add(an); seats.push({ name: 'swing', anchors: [an], meshes: [pod] }); }   // sitting in it, looking out of the way in
    { const c = new THREE.SphereGeometry(1, 32, 16), p = c.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 34, p.getY(i) * 7 + (top - 122), p.getZ(i) * 34); c.computeVertexNormals(); put(c, blush, SX, 0, SZ); }
    const ring = put(new THREE.TorusGeometry(5, 1.4, 12, 32), oak, SX, top + 3, SZ); ring.rotation.x = Math.PI / 2;
    const rope = std({ name: 'rope', color: '#e6dccb', roughness: 1 });
    put(new THREE.CylinderGeometry(1.1, 1.1, H - top - 4, 12), rope, SX, (H + top + 4) / 2, SZ);
    put(new THREE.CylinderGeometry(3, 3, 1.5, 24), std({ name: 'steel', color: '#d6d7d8', roughness: .2, metalness: 1 }), SX, H - .8, SZ);
    foot.push(Array.from({ length: 12 }, (_, i) => [SX + Math.cos(i / 12 * 6.283) * 44, SZ + Math.sin(i / 12 * 6.283) * 44])); }

  return { paxDoors, seats };
}
