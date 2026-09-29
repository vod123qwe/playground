// The bathroom (G on A.04, 5.3 m2), after the architect's design (its 3D tour: the fittings; A.04: where they stand; the heights read off
// the tour, its camera found 165 cm up and 98 cm from the door): beige stone-look 60 x 60 tiles on the walls to the ceiling, the bath's
// walls in pale aqua 7.5 x 30 tiles with a white botanical print, brushed brass fittings.
//  - the WC wall (x 405): the frame for the wall-hung WC boxed in and tiled along the whole wall, 20 deep and 124 high, the flush plate
//    on it; over it to the ceiling a walnut-toned cabinet, flush with it: four doors from the door's wall, an open niche of shelves at
//    the vanity's end;
//  - the door's wall: a narrow vertical radiator of seven cream tubes between the boxed-in frame and the door;
//  - the vanity wall: the pipes boxed in, 9 deep: a tiled ledge 110 high by the vanity, and behind the bath's foot a tiled column to the
//    ceiling (aqua, the bath mixer and the slide rail on its face); a floating walnut drawer under a white marble top at 85 with a
//    countertop basin and a tall brass mixer standing at its back; a round backlit mirror, 80 across, two opal globes at its top;
//  - the bath, 170 x 72, from the door's wall on a tiled head box to the ledge, its front tiled, a two-pane sliding glass screen from its foot;
//    two brass towel bars over its head.
// The cabinet's doors and the drawer open, the screen slides along its rail: a click on them.
// Plan centimetres (x, and the plan's y as z), as rooms.js. Everything here is drawn: the textures in canvases, the fittings our own shapes.

export function buildBath({ THREE, root, std, box, foot, lamps, canvasTex, rng, H, oakMaps }) {
  const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const openers = [];                                                // what opens: the cabinet's doors, the drawer, the screen (as the kitchen's)
  const opener = (parts, apply) => { const o = { kind: 'fx', f: 0, to: 0, parts: [], apply }; for (const m of parts) m.traverse(c => { if (c.isMesh) { c.userData.door = o; o.parts.push(c); } }); openers.push(o); return o; };
  // ---------- the materials ----------
  const beigeTex = rep(canvasTex(1024, 1024, (g, w, h) => {            // four 60 x 60 tiles over 120 x 120 cm: a soft beige stone
    const q = rng(101); g.fillStyle = '#e6dcca'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const x = q() * w, y = q() * h, r = 12 + q() * 60, lt = q() < .5;
      g.fillStyle = lt ? `rgba(248,242,232,${.02 + q() * .04})` : `rgba(206,193,172,${.02 + q() * .035})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(180,166,146,.1)'; g.lineWidth = 1.2;
    for (let v = 0; v < 14; v++) { let x = q() * w, y = q() * h; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 30; s++) { x += (q() - .3) * 40; y += (q() - .5) * 20; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = '#cfc3b0'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w / 2 - 1, 0, 2, h); g.fillRect(0, h / 2 - 1, w, 2);
  }));
  const aquaTex = rep(canvasTex(1024, 1024, (g, w, h) => {            // 60 x 60 cm: eight 7.5 x 30 tiles across, two up, a white sprig print
    const q = rng(202), cw = w / 8, ch = h / 2; g.fillStyle = '#e4eae7'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
      const x = i * cw + 2, y = j * ch + 2, tw = cw - 4, th = ch - 4, L = 170 + q() * 14, gr = g.createLinearGradient(x, 0, x + tw, 0);
      gr.addColorStop(0, `rgb(${L - 16},${L + 12},${L + 14})`); gr.addColorStop(.5, `rgb(${L - 6},${L + 22},${L + 24})`); gr.addColorStop(1, `rgb(${L - 20},${L + 8},${L + 10})`);
      g.fillStyle = gr; g.fillRect(x, y, tw, th);
      g.strokeStyle = 'rgba(250,252,250,.72)'; g.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) {
        const px = x + tw * (.2 + q() * .6), py = y + th * (.3 + q() * .6), len = 40 + q() * 80, ang = -Math.PI / 2 + (q() - .5) * .7, ex = px + Math.cos(ang) * len * .35, ey = py + Math.sin(ang) * len;
        g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + (q() - .5) * 20, py - len * .5, ex, ey); g.stroke();
        for (let l = 1; l < 7; l++) { const t = l / 7, lx = px + (ex - px) * t, ly = py + (ey - py) * t, s = q() < .5 ? -1 : 1; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + s * (5 + q() * 7), ly - 5 - q() * 6); g.stroke(); }
      }
    }
  }));
  const marbleTex = rep(canvasTex(1024, 512, (g, w, h) => {
    const q = rng(303); g.fillStyle = '#f1efea'; g.fillRect(0, 0, w, h);
    for (let v = 0; v < 12; v++) { g.strokeStyle = `rgba(150,146,140,${.12 + q() * .25})`; g.lineWidth = .8 + q() * 2.2; g.beginPath(); let x = q() * w - 200, y = q() * h; g.moveTo(x, y);
      for (let s = 0; s < 50; s++) { x += 12 + q() * 18; y += (q() - .5) * 26; g.lineTo(x, y); } g.stroke(); }
  }));
  const beige = std({ name: 'tileBeige', map: beigeTex, roughness: .4 });
  const aqua = std({ name: 'tileAqua', map: aquaTex, roughness: .18 });
  const marble = std({ name: 'marble', map: marbleTex, roughness: .22 });
  const white = std({ name: 'bathWhite', color: '#f6f6f3', roughness: .12, side: THREE.DoubleSide });
  const brass = std({ name: 'brass', color: '#c9a063', roughness: .32, metalness: 1 });
  const chrome = std({ name: 'steel', color: '#d6d7d8', roughness: .15, metalness: 1 });
  const wood = std({ name: 'bathWood', ...oakMaps, normalScale: new THREE.Vector2(.35, .35), color: '#c4a78c', roughness: .85 });   // the oak scan, stained a warm walnut
  const glass = std({ name: 'glass', color: '#eef4f3', roughness: .04, transparent: true, opacity: .16, depthWrite: false });
  const mirrorM = std({ name: 'mirror', color: '#f4f6f7', roughness: .04, metalness: 1, envMapIntensity: 1.6 });
  const radM = std({ name: 'radiator', color: '#e4d9c6', roughness: .42, metalness: .08 });
  const towel = std({ name: 'towel', color: '#f4f2ee', roughness: 1 });
  const S = 120;                                                     // the beige texture's span; the aqua's is 60

  // a tiled face 1 cm proud of a wall, from a to b (plan points), the room on the side n; its grout from the corner at a
  function face(a, b, n, y0, y1, m, span) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), o = 1;
    const P = [[a, y0], [b, y0], [b, y1], [a, y1]].map(([p, y]) => [p[0] + n[0] * o, y, p[1] + n[1] * o]);
    const uv = [0, y0 / span, L / span, y0 / span, L / span, y1 / span, 0, y1 / span];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const e = [b[0] - a[0], b[1] - a[1]], cr = [-e[1], e[0]];         // e x up: the normal of the order 0 1 2; turned round if it faces the wall
    g.setIndex(cr[0] * n[0] + cr[1] * n[1] > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    g.computeVertexNormals(); const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  // the walls: the WC's (x 405), the notch by it, the vanity's (z -44; its grout from the bath's edge, as the tour lays it), the door's
  // (z -242), the bath's (x 681); aqua round the bath
  const TB = 609.4;                                                  // the bath's front (A.04)
  face([405.3, -242.3], [405.3, -78.6], [1, 0], 0, H, beige, S);
  face([405.3, -79], [473, -79], [0, -1], 0, H, beige, S);
  face([476, -77], [476, -43.8], [1, 0], 0, H, beige, S);
  face([TB, -43.8], [476.4, -43.8], [0, -1], 0, H, beige, S);
  face([405.3, -242.3], [480.6, -242.3], [0, 1], 0, H, beige, S);
  face([480.6, -242.3], [562.4, -242.3], [0, 1], 208, H, beige, S);
  face([562.4, -242.3], [681.2, -242.3], [0, 1], 0, H, beige, S);
  face([TB, -43.8], [681.6, -43.8], [0, -1], 0, H, aqua, 60);
  face([681.2, -43.8], [681.2, -242.3], [-1, 0], 0, H, aqua, 60);

  // ---------- shapes: a rounded rectangle ring, and a surface lofted through such rings (top to bottom), for the bath, the basin, the WC ----------
  const rrect = (hx, hz, r, n) => { const pts = []; r = Math.min(r, hx, hz);
    for (const [cx, cz, qd] of [[hx - r, hz - r, 0], [-(hx - r), hz - r, 1], [-(hx - r), -(hz - r), 2], [hx - r, -(hz - r), 3]])
      for (let i = 0; i < n; i++) { const a = (qd + i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    return pts; };
  function loft(rings, n = 14) {
    const P = [], I = [], m = n * 4;
    for (const [hx, hz, r, y] of rings) for (const [x, z] of rrect(Math.max(hx, 1e-3), Math.max(hz, 1e-3), r, n)) P.push(x, y, z);
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < m; i++) { const a = k * m + i, b = k * m + (i + 1) % m, c = a + m, d = b + m; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
  }
  const put = (g, m, x, y, z, parent = root) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const cyl = (r, h, m, x, y, z, axis = 'y', seg = 20) => { const o = put(new THREE.CylinderGeometry(r, r, h, seg), m, x, y, z); if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o; };

  // ---------- the WC wall: the boxed-in frame along it all (20 deep, 124 high), the flush plate, the wall-hung rimless bowl (A.04) ----------
  const BF = 425.3, WCZ = -153.8;                                    // the box's face (its tiles to 426.3); the WC's axis
  box(405.3, BF, 0, 124, -242.3, -79, beige, { scale: S });
  box(BF + 1, BF + 1.8, 93, 109.5, WCZ - 12.3, WCZ + 12.3, white, { r: .5 });
  cyl(4.6, 1, white, BF + 2.1, 101.3, WCZ - 4.8, 'x', 32); cyl(3.4, 1, white, BF + 2.1, 101.3, WCZ + 5.2, 'x', 32);
  { const G = new THREE.Group(); G.position.set(BF + 1 + 27, 0, WCZ); root.add(G);
    put(loft([[27, 18, 16, 40], [26.6, 17.7, 15.6, 37], [24.5, 15.8, 13.5, 28], [21.5, 13.5, 11.5, 21], [16, 9.5, 8.5, 17.5], [.01, .01, 0, 16.5]]), white, 0, 0, 0, G);
    put(loft([[.01, .01, 0, 43], [26.9, 17.9, 15.9, 43], [26.9, 17.9, 15.9, 40.3]]), white, 0, 0, 0, G);   // the slim seat and lid, closed
    box(-27, -24, 36, 43, -9, 9, white, { r: .8, parent: G }); }                                            // its hinge block at the frame
  foot.push([[405.3, -242.3], [BF + 2, -242.3], [BF + 2, WCZ - 18], [BF + 56, WCZ - 18], [BF + 56, WCZ + 18], [BF + 2, WCZ + 18], [BF + 2, -79], [405.3, -79]]);
  // ---------- over it, flush, the cabinet to the ceiling: four doors from the door's wall, an open niche of shelves at the vanity end ----------
  const NZ = -101.5, DW = (NZ - 1.8 + 242.3) / 4;                    // the niche: from NZ to the notch's wall (-79); the doors' width
  box(405.3, BF, 124, H, -242.3, NZ - 1.8, wood, { r: .2, scale: 140 });
  for (let k = 0; k < 4; k++) {                                      // each door on its hinge at the edge towards the niche: the first then clears the radiator
    const z1 = -242.3 + (k + 1) * DW, pv = new THREE.Group(); pv.position.set(BF + 2, 0, z1 - .15); root.add(pv);
    const d = box(-2, 0, 124.3, H - .3, -DW + .3, 0, wood, { r: .3, scale: 140, parent: pv });
    opener([d], e => { pv.rotation.y = -e * 1.75; });
  }
  box(405.3, BF + 2, 124, 126, NZ - 1.8, -79, wood, { scale: 140 }); box(405.3, BF + 2, H - 2, H, NZ - 1.8, -79, wood, { scale: 140 });
  box(405.3, BF + 2, 124, H, NZ - 1.8, NZ, wood, { scale: 140 }); box(405.3, BF + 2, 124, H, -80.8, -79, wood, { scale: 140 });
  for (const y of [157, 189, 221]) box(405.3, BF + 1, y, y + 1.8, NZ, -80.8, wood, { scale: 140 });
  { const q = rng(404), mz = (NZ - 80.8) / 2;
    const jar = std({ name: 'glass', color: '#dfe6e6', roughness: .05, transparent: true, opacity: .35, depthWrite: false }), dark = std({ name: 'plasticBlack', color: '#1d1c1b', roughness: .6 }), paper = std({ name: 'print', color: '#e7e1d6', roughness: .9 });
    cyl(4, 9, jar, 416, 126 + 4.5, mz); cyl(3, .6, paper, 416, 130, mz);
    cyl(2.2, 6, dark, 413, 158.8 + 3, mz - 3); cyl(2.2, 6, dark, 413, 158.8 + 3, mz + 2.5);
    box(410, 416, 190.8, 200, mz - 3, mz + 3, paper, { r: .6 });
    for (let i = 0; i < 5; i++) { const st = cyl(.2, 26, wood, 413 + (q() - .5) * 1.5, 200 + 12, mz + (q() - .5) * 1.5); st.rotation.z = (q() - .5) * .35; st.rotation.x = (q() - .5) * .35; }
    const lin = std({ name: 'towel', color: '#e9e4db', roughness: 1 }); box(409, 422, 222.8, 226, mz - 7, mz + 7, lin, { r: 1.2 }); box(409, 422, 226, 229, mz - 6.5, mz + 6.5, lin, { r: 1.2 }); }
  // ---------- the radiator on the door's wall, between the boxed-in frame and the door: seven cream tubes, 185 high ----------
  { const RZ = -242.3 + 1 + 5.5, X0 = 434.5;
    for (let i = 0; i < 7; i++) cyl(1.75, 185, radM, X0 + i * 5.4, 15 + 92.5, RZ, 'y', 16);
    for (const y of [17, 198]) cyl(1.2, 34, radM, X0 + 16.2, y, RZ, 'x', 12);
    for (const x of [X0 + 3, X0 + 29.4]) box(x - 1, x + 1, 189, 191, -241.3, RZ, chrome, { r: .4 });
    cyl(1.2, 5, chrome, X0 + 33.5, 12, RZ, 'y', 12);
    foot.push([[BF + 2, -242.3], [X0 + 36, -242.3], [X0 + 36, RZ - 3], [BF + 2, RZ - 3]]); }

  // ---------- the vanity wall: the tiled ledge along it all (9 deep, 110 high; aqua behind the bath), the floating walnut drawer under a
  // white marble top at 85 (A.04: 90 x 47), the countertop basin, the tall brass mixer standing at the top's back ----------
  const LZ = -53;                                                    // the ledge's face
  box(476.4, TB, 0, 110, LZ, -44.8, beige, { scale: S });
  box(TB, 681.2, 0, H, LZ, -44.8, aqua, { scale: 60 });                  // behind the bath's foot: the column to the ceiling
  const VX0 = 487.1, VX1 = 577.5, VZ = -100, BX = (VX0 + VX1) / 2, BZ = -77;
  box(VX0 + 1, VX1 - 1, 79, 81, VZ + 2.3, LZ, wood, { r: .3, scale: 140 });                          // the carcass: top, back, sides
  box(VX0 + 1, VX1 - 1, 36, 81, LZ - 1.6, LZ, wood, { scale: 140 });
  for (const x of [VX0 + 1, VX1 - 2.6]) box(x, x + 1.6, 36, 81, VZ + 2.3, LZ, wood, { scale: 140 });
  { const DR = new THREE.Group(), dm = std({ name: 'carcass', color: '#efe9df', roughness: .6 }); root.add(DR);
    const parts = [box(VX0 + 1, VX1 - 1, 36, 78.6, VZ + .5, VZ + 2.3, wood, { r: .4, scale: 140, parent: DR })];                // the front, 42.6 high
    parts.push(box(VX0 + 3, VX1 - 3, 39, 40.2, VZ + 2.3, LZ - 3, dm, { parent: DR }));                                          // its box: the bottom,
    for (const x of [VX0 + 3, VX1 - 4.2]) parts.push(box(x, x + 1.2, 40.2, 60, VZ + 2.3, LZ - 3, dm, { parent: DR }));        // the sides,
    parts.push(box(VX0 + 3, VX1 - 3, 40.2, 60, LZ - 4.2, LZ - 3, dm, { parent: DR }));                                          // the back
    parts.push(box(VX0 + 30, VX1 - 30, 58.3, 59.3, VZ - .6, VZ + .5, std({ name: 'shadowGap', color: '#3a302a', roughness: .9 }), { parent: DR }));   // a finger pull under its top edge
    opener(parts, e => { DR.position.z = -35 * e; }); }
  box(VX0, VX1, 81, 85, VZ, LZ, marble, { r: .3, scale: 100 });
  { const G = new THREE.Group(); G.position.set(BX, 85, BZ); root.add(G);                                  // the basin: 46 x 38, 14 high, softly square
    put(loft([[23, 19, 13, 14], [22.6, 18.6, 12.7, 12.5], [20.6, 16.6, 11.3, 6], [17.6, 13.6, 9.4, 1.2], [16.6, 12.6, 8.8, 0], [.01, .01, 0, 0]]), white, 0, 0, 0, G);
    put(loft([[23, 19, 13, 14], [21.9, 17.9, 12.2, 14.2], [21.2, 17.2, 11.8, 11.5], [18.5, 14.5, 10.2, 5.5], [13, 9.5, 7, 2.3], [.01, .01, 0, 2]]), white, 0, 0, 0, G);
    cyl(1.8, .4, chrome, 0, 2.3, 0, 'y', 24).parent = G; }
  // the mixer: a brushed brass column 27 high at the top's back, its short spout over the basin's back, a lever on its side
  const MZ = -57.5;
  cyl(2, 1, brass, BX, 85.5, MZ, 'y', 24); cyl(1.6, 25, brass, BX, 98, MZ, 'y', 20);
  { const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(BX, 110.3, MZ), new THREE.Vector3(BX, 112, MZ - 3), new THREE.Vector3(BX, 111.4, MZ - 8), new THREE.Vector3(BX, 108.6, MZ - 11)]), 20, 1, 12), brass);
    sp.castShadow = true; root.add(sp); const lv = cyl(.6, 6, brass, BX + 3.6, 104, MZ, 'x', 10); lv.rotation.y = .35; }
  foot.push([[476.4, -43.8], [681.2, -43.8], [681.2, LZ - 1], [VX1, LZ - 1], [VX1, VZ], [VX0, VZ], [VX0, LZ - 1], [476.4, LZ - 1]]);
  // a double socket over the ledge, right of the mirror as you face it; on the top, a dark vase with a sprig, a soap bottle, two rolled
  // blue towels, at the bath's end
  box(BX - 45.5, BX - 30.5, 115.5, 123.5, -44.8 - .9, -44.8, white, { r: .4 });
  { const q = rng(505), plum = std({ name: 'vase', color: '#3b3038', roughness: .35 }), vx = VX1 - 12;
    put(new THREE.LatheGeometry([[0, 0], [2.6, 0], [3.2, 4], [2.2, 9], [1.1, 13], [1.4, 14], [0, 14]].map(([a, b]) => new THREE.Vector2(a, b)), 32), plum, vx, 85, -62);
    const leaf = std({ name: 'flower', color: '#4a2436', roughness: .7, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i++) { const p = put(new THREE.SphereGeometry(1.3 + q(), 8, 6), leaf, vx + (q() - .5) * 8, 99 + 14 + q() * 9, -62 + (q() - .5) * 6); p.scale.set(1, .5, 1.4); p.rotation.set(q() * 3, q() * 3, 0); }
    cyl(.25, 16, std({ name: 'ivyStem', color: '#4d4630', roughness: .8 }), vx, 99 + 8, -62);
    cyl(2.3, 9, std({ name: 'lampBase', color: '#ece6dc', roughness: .5 }), vx - 7, 85 + 4.5, -59); cyl(.5, 3, chrome, vx - 7, 85 + 10, -59);
    const blue = std({ name: 'towel', color: '#9fbfd6', roughness: 1 });
    for (const [x, z] of [[VX1 - 10, -86], [VX1 - 15, -92]]) { const t = cyl(3.1, 17, blue, x, 85 + 3.1, z, 'x', 20); t.rotation.y = -.5 - (x - VX1) * .06; } }
  // the mirror: round, 80 across, backlit; two opal globes on short brass arms either side, at its top. One switch
  const halo = std({ name: 'islandLED', color: '#fff4e2', roughness: .4, emissive: '#fff1dc', emissiveIntensity: 0 });
  const globeM = std({ name: 'bathGlobe', color: '#f5f2ec', roughness: .35, emissive: '#fff1d9', emissiveIntensity: 0 });
  const mir = cyl(40, 1.2, mirrorM, BX, 166, -45.7, 'z', 96);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(40.3, .9, 8, 96), halo); ring.position.set(BX, 166, -45.2); root.add(ring);
  const globes = [];
  for (const s of [-1, 1]) { const x = BX + s * 36; cyl(3.6, 1, brass, x, 202, -45.3, 'z', 24); cyl(.7, 7, brass, x, 202, -48.8, 'z', 12);
    globes.push(put(new THREE.SphereGeometry(7.5, 32, 20), globeM, x, 202, -57.8)); }
  const light = new THREE.PointLight('#ffd6a4', 0, 5, 2); light.position.set(BX, 192, -68); root.add(light);
  light.shadow.mapSize.set(512, 512); light.shadow.camera.near = .03; light.shadow.bias = -.004; light.shadow.normalBias = .02;
  lamps.push({ name: 'bathroom mirror', on: false, light, meshes: [...globes, ring, mir], set(v) { this.on = !!v; halo.emissiveIntensity = v ? 2.2 : 0; globeM.emissiveIntensity = v ? 1.4 : 0; light.intensity = v ? 1.4 : 0; } });

  // ---------- the bath: from the door's wall on a tiled head box (18) to the ledge, 170 x 72, its front tiled; the basin lofted in one piece ----------
  const TX = (TB + 2 + 681.2) / 2, TZ = (-224 + LZ) / 2, THX = (681.2 - TB - 2) / 2, THZ = (LZ + 224) / 2;
  box(TB, 681.2, 0, 57, -242.3, -224, beige, { scale: S });
  box(TB, TB + 2, 0, 55.5, -224, LZ, beige, { scale: S });
  { const G = new THREE.Group(); G.position.set(TX, 0, TZ); root.add(G);
    put(loft([[THX - 5.5, THZ - 7.2, 25, 57], [THX, THZ, 2, 57], [THX, THZ, 2, 55.5]]), white, 0, 0, 0, G);   // the deck, its edge
    put(loft([[THX - 5.5, THZ - 7.2, 25, 57], [THX - 5.8, THZ - 7.6, 24.5, 54], [THX - 7.2, THZ - 9.8, 22.5, 40], [THX - 10.5, THZ - 14, 19.5, 26], [THX - 15.5, THZ - 22, 15.5, 18.5], [THX - 24, THZ - 33, 9, 16.3], [.01, THZ - 43, 0, 16]]), white, 0, 0, 0, G);
    cyl(2.2, .4, chrome, 0, 16.4, THZ - 20, 'y', 24).parent = G; }
  foot.push([[TB, -242.3], [681.6, -242.3], [681.6, LZ], [TB, LZ]]);
  // the screen: two panes of clear glass on two tracks from the bath's foot, 140 high, in brushed brass profiles. Closed they cover half
  // the bath (86 cm): the one at the foot stays, the other slides back over it, and open they take a quarter (44)
  const SH = 57.5, ST = 196.6;                                       // the panes' bottom (the rim) and top
  box(TB - 1.6, TB + 1.4, ST, ST + 2.6, -141, LZ, brass, { r: .3 });                                    // the top rail, both tracks
  box(TB - .2, TB + 1.4, SH, ST, LZ - 1.8, LZ, brass, { r: .2 });                                       // the wall post
  box(TB + .2, TB + 1, SH, ST, -97.5, LZ - 1.8, glass, { r: .1 });                                        // the fixed pane,
  box(TB - .2, TB + 1.4, SH, ST, -98.7, -97.5, brass, { r: .2 });                                       // its free edge
  { const SC = new THREE.Group(); root.add(SC);                                                          // the sliding pane, its two edges, the handle
    const parts = [box(TB - 1.4, TB - .6, SH, ST, -139.5, -94.5, glass, { r: .1, parent: SC }), box(TB - 1.6, TB - .4, SH, ST, -140.7, -139.5, brass, { r: .2, parent: SC }),
      box(TB - 1.6, TB - .4, SH, ST, -94.5, -93.3, brass, { r: .2, parent: SC })];
    const hb = cyl(.7, 40, brass, TB - 3, 125, -131); SC.attach(hb); parts.push(hb);
    for (const y of [106, 144]) { const c = cyl(.4, 1.8, brass, TB - 2, y, -131, 'x', 8); SC.attach(c); parts.push(c); }
    opener(parts, e => { SC.position.z = 41.5 * e; }); }
  // the mixer on the column's face at the bath's foot; the slide rail over it with two little shelves, the hand shower, its hose
  const LF = LZ - .1;
  cyl(2.8, 30, brass, 646, 76, LF - 3, 'x', 24); for (const s of [-1, 1]) cyl(3.2, 3.4, brass, 646 + s * 16.6, 76, LF - 3, 'x', 24);
  { const sp = cyl(1.1, 10, brass, 646, 73.5, LF - 8, 'z', 12); sp.rotation.x = Math.PI / 2 + .25; }
  cyl(.9, 95, brass, 664, 112 + 47.5, LF - 2.8); for (const y of [116, 205]) box(662.5, 665.5, y - 1.2, y + 1.2, LF - 2.8, LF, brass, { r: .3 });
  for (const y of [140, 158]) { box(652, 676, y - .4, y + .4, LF - 10.5, LF, glass, { r: .2 }); box(652, 676, y + .4, y + 1.8, LF - 10.9, LF - 10.1, brass, { r: .2 });
    cyl(1.6, 9, std({ name: 'lampBase', color: y > 150 ? '#d9cfc0' : '#f0ebe2', roughness: .5 }), 670, y + 4.9, LF - 5); }
  { const head = cyl(5.6, 2, brass, 664, 190, LF - 6.5, 'z', 32); head.rotation.x = Math.PI / 2 - .5;
    const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(646, 73, LF - 4), new THREE.Vector3(650, 62, LF - 9), new THREE.Vector3(660, 60, LF - 10), new THREE.Vector3(664, 90, LF - 6), new THREE.Vector3(664, 182, LF - 5)]), 40, .6, 8), chrome);
    hose.castShadow = true; root.add(hose); }
  // ---------- over the bath's head, on the door's wall: two brass towel bars, a white towel over the lower one ----------
  for (const y of [162, 174]) { cyl(.8, 44, brass, 646, y, -235.3, 'x', 12); for (const x of [624.5, 667.5]) cyl(.7, 6, brass, x, y, -238.3, 'z', 10); }
  box(634, 658, 128, 162.8, -236.8, -234, towel, { r: 1.2, scale: 45, soft: .5, seed: 61 });
  return { openers };
}
