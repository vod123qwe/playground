// The kitchen of the concept "M48" (oak lower fronts and tall units, cashmere beige uppers to the ceiling, beige conglomerate top and
// sink, glossy structured tiles, black appliances, LED under the uppers, a fluted island with three stools), placed on the layout A.04:
// the run along the 390 cm kitchen wall, the island 180 x 80 where A.04 draws it. Everything is modelled in centimetres.
//
// Run, from the entrance side: fridge 60 (tall) | sink 60 | dishwasher 80 | induction 80 | cargo 50 | oven + microwave 60 (tall).
// Heights: plinth 10, worktop 87-90 (3 cm), uppers 145-255 (55 cm of backsplash), tall units to the ceiling.

import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

export async function buildKitchen({ THREE, K, H, clip, renderer, base = 'assets/' }) {
  RectAreaLightUniformsLib.init();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tl = new THREE.TextureLoader();
  const load = (f, srgb) => new Promise(res => tl.load(base + f, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; res(t); }));
  const [oakC, oakN, oakR] = await Promise.all([load('oak_diff.jpg', true), load('oak_nor.jpg'), load('oak_rough.jpg')]);
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });

  // ---------- materials ----------
  const OAK = 140;                                                   // the veneer scan covers 140 cm
  const oak = std({ map: oakC, normalMap: oakN, normalScale: new THREE.Vector2(.35, .35), roughnessMap: oakR, roughness: .9, color: '#e6d3bd' });   // natural oak, matt lacquer
  const cashmere = std({ color: '#d7c9b6', roughness: .72 });        // upper fronts: beige / cashmere, matt
  const carcass = std({ color: '#e9e3da', roughness: .8 });
  const shadowGap = std({ color: '#3a302a', roughness: .9 });        // the integrated handle groove, the plinth recess
  const blackGlass = std({ color: '#0b0c0e', roughness: .06, metalness: .2 });
  const steel = std({ color: '#c8c9ca', roughness: .32, metalness: 1 });   // brushed steel tap and appliance handles
  const legs = std({ color: '#141414', roughness: .45, metalness: .6 });
  const [tdC, tdN, tdR] = await Promise.all([load('tex/teddy_diff.jpg', true), load('tex/teddy_nor.jpg'), load('tex/teddy_rough.jpg')]);
  const fabric = std({ map: tdC, normalMap: tdN, normalScale: new THREE.Vector2(1.2, 1.2), roughnessMap: tdR, roughness: 1, color: '#e9dccb' });   // boucle: Poly Haven "curly teddy natural" (CC0)          // stool seats: beige boucle
  // conglomerate: a warm beige with a fine speckle
  const quartz = (() => {
    const N = 1024, c = canvas(N, N), g = c.getContext('2d'), r = rng(77);
    g.fillStyle = '#dccab0'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 26000; i++) { const x = r() * N, y = r() * N, s = r() * 1.6 + .3, v = r(); g.fillStyle = v < .5 ? `rgba(160,138,110,${.25 + r() * .3})` : v < .85 ? `rgba(245,236,220,${.3 + r() * .4})` : `rgba(120,100,80,${.3})`; g.fillRect(x, y, s, s); }
    for (let i = 0; i < 90; i++) { const x = r() * N, y = r() * N, rad = 12 + r() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${r() > .5 ? '232,220,200' : '206,190,164'},.1)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad); }
    return std({ map: tex(c, true), roughness: .38 });              // honed, a soft sheen
  })();
  const QUARTZ_CM = 120;                                             // the speckle map covers 120 cm
  // glossy structured tiles, 7.5 x 30 cm, stacked vertically, 2 mm joint: slightly uneven faces, each tile its own shade
  const tiles = (() => {
    const W = 7.5, T = 30, cols = 8, rows = 2, PX = 17, Wp = Math.round(W * cols * PX), Hp = Math.round(T * rows * PX);
    const c = canvas(Wp, Hp), n = canvas(Wp, Hp), gc = c.getContext('2d'), gn = n.getContext('2d'), r = rng(19);
    gc.fillStyle = '#d8d2c8'; gc.fillRect(0, 0, Wp, Hp); gn.fillStyle = 'rgb(128,128,255)'; gn.fillRect(0, 0, Wp, Hp);
    const J = .2 * PX;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x0 = i * W * PX + J / 2, y0 = j * T * PX + J / 2, w = W * PX - J, h = T * PX - J, tint = 236 + Math.round((r() - .5) * 8);
      gc.fillStyle = `rgb(${tint},${tint - 5},${tint - 13})`; gc.fillRect(x0, y0, w, h);
      // the glaze pools a little: soft waves in the normal map, an eased edge all round
      for (let k = 0; k < 6; k++) { const cy = y0 + r() * h, rad = 20 + r() * 60, gr = gn.createRadialGradient(x0 + w / 2, cy, 0, x0 + w / 2, cy, rad);
        const sx = 128 + (r() - .5) * 40, sy = 128 + (r() - .5) * 40; gr.addColorStop(0, `rgba(${sx | 0},${sy | 0},250,.7)`); gr.addColorStop(1, 'rgba(128,128,255,0)'); gn.fillStyle = gr; gn.fillRect(x0, y0, w, h); }
      const e = .25 * PX;
      gn.fillStyle = 'rgb(128,200,225)'; gn.fillRect(x0, y0, w, e); gn.fillStyle = 'rgb(128,56,225)'; gn.fillRect(x0, y0 + h - e, w, e);
      gn.fillStyle = 'rgb(56,128,225)'; gn.fillRect(x0, y0, e, h); gn.fillStyle = 'rgb(200,128,225)'; gn.fillRect(x0 + w - e, y0, e, h);
    }
    return { mat: std({ map: tex(c, true), normalMap: tex(n), normalScale: new THREE.Vector2(.8, .8), roughness: .12 }), w: W * cols, h: T * rows };
  })();
  // fluting: half-round reeds 2.5 cm wide on oak (the island, facing the living room)
  const flutes = (() => {
    const PX = 16, P = 2.5, N = 12, Wp = Math.round(P * N * PX), n = canvas(Wp, 64), g = n.getContext('2d'), d = g.createImageData(Wp, 64);
    for (let x = 0; x < Wp; x++) { const t = ((x / PX) % P) / P * 2 - 1, nx = t * .85, nz = Math.sqrt(1 - nx * nx); for (let y = 0; y < 64; y++) { const i = (y * Wp + x) * 4; d.data[i] = 128 + nx * 127; d.data[i + 1] = 128; d.data[i + 2] = 128 + nz * 127; d.data[i + 3] = 255; } }
    g.putImageData(d, 0, 0);
    const m = oak.clone(); m.normalMap = tex(n); m.normalScale = new THREE.Vector2(1, 1); m.userData.fluteW = P * N; return m;
  })();

  // ---------- helpers ----------
  const root = new THREE.Group();
  // a box in cm, [x0, x1] along the run, [y0, y1] up, [z0, z1] out from the wall; UVs in real scale (grain up the fronts)
  let seed = 1;
  function planarUV(g, scale, ou = 0, ov = 0) {                     // each vertex takes the plane its normal faces: grain up the sides and fronts
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y];
      uv.setXY(i, u / scale + ou, v / scale + ov);
    }
  }
  function box(x0, x1, y0, y1, z0, z1, m, scale = OAK, parent = root, edge = .15) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, rr = Math.min(edge, Math.min(w, h, d) / 2 - .01);
    const g = rr > .02 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);   // every edge eased 1.5 mm: it catches the light
    const r = rng(seed++); planarUV(g, scale, r(), r());
    const mesh = new THREE.Mesh(g, m); mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  const G = .3;                                                      // the gap between two fronts
  // a lower front with the integrated handle: a 3 cm groove along its top edge (the concept's "frez")
  function lowerFront(x0, x1, y0, y1, z) { box(x0 + G / 2, x1 - G / 2, y0 + G / 2, y1 - 3, z, z + 1.9, oak); box(x0 + G / 2, x1 - G / 2, y1 - 3, y1 - G / 2, z, z + .6, shadowGap); }
  function tallFront(x0, x1, y0, y1, z, handleRight) {                // a tall front with a vertical groove on the handle side
    const gx = handleRight ? x1 - 3 : x0;
    box(handleRight ? x0 + G / 2 : x0 + 3, handleRight ? x1 - 3 : x1 - G / 2, y0 + G / 2, y1 - G / 2, z, z + 1.9, oak);
    box(gx + (handleRight ? 0 : G / 2), gx + 3 - (handleRight ? G / 2 : 0), y0 + G / 2, y1 - G / 2, z, z + .6, shadowGap);
  }

  // ---------- the run (x along the wall from the entrance side, z out of the wall) ----------
  const L = K.len, Y0 = 10, WT = 87, TOP = 90, UP0 = 145, CEIL = H, D = 60, UD = 35;
  const X = [0, 60, 120, 200, 280, 330, 390];                        // fridge | sink | dishwasher | hob | cargo | oven
  // carcasses and the plinth (a dark recess 5 cm deep)
  box(0, L, 0, Y0, 0, D - 5, shadowGap);
  box(X[1], X[5], Y0, WT, 0, D - 2, carcass);
  box(X[0], X[1], Y0, CEIL, 0, D - 2, carcass); box(X[5], L, Y0, CEIL, 0, D - 2, carcass);
  // lower fronts: the sink (one door), the dishwasher (a full panel), three drawers under the hob, the cargo pull-out
  lowerFront(X[1], X[2], Y0, WT, D - 2);
  lowerFront(X[2], X[3], Y0, WT, D - 2);
  lowerFront(X[3], X[4], Y0, 32, D - 2); lowerFront(X[3], X[4], 32, 58, D - 2); lowerFront(X[3], X[4], 58, WT, D - 2);
  lowerFront(X[4], X[5], Y0, WT, D - 2);
  // the fridge column: the fridge door, a store above
  tallFront(X[0], X[1], Y0, 205, D - 2, true); tallFront(X[0], X[1], 205, CEIL, D - 2, true);
  // the oven column: a drawer, the oven (60), the microwave (38), a store above
  lowerFront(X[5], L, Y0, 80, D - 2);
  box(X[5] + .5, L - .5, 80.5, 140, D - 2, D - .1, blackGlass); box(X[5] + 5, L - 5, 134, 135.4, D - .1, D + 2.4, steel);   // oven glass and its bar
  box(X[5] + .5, L - .5, 142, 180, D - 2, D - .1, blackGlass); box(X[5] + 3, X[5] + 38, 146, 176, D - .1, D, std({ color: '#1c1f23', roughness: .02, metalness: .3 }));  // microwave and its window
  tallFront(X[5], L, 182, CEIL, D - 2, false);
  // the worktop with the sink cut out, 62 deep (2 cm over the fronts)
  const topShape = new THREE.Shape([new THREE.Vector2(X[1] - .01, 0), new THREE.Vector2(X[5] + .01, 0), new THREE.Vector2(X[5] + .01, D + 2), new THREE.Vector2(X[1] - .01, D + 2)]);
  const SX0 = X[1] + 6, SX1 = X[2] - 6, SZ0 = 12, SZ1 = 52;         // the bowl: 48 x 40, set off the tall fridge
  topShape.holes.push(new THREE.Path([new THREE.Vector2(SX0, SZ0), new THREE.Vector2(SX0, SZ1), new THREE.Vector2(SX1, SZ1), new THREE.Vector2(SX1, SZ0)]));
  const tg = new THREE.ExtrudeGeometry(topShape, { depth: TOP - WT - .4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelOffset: -.2, bevelSegments: 3 });
  tg.rotateX(Math.PI / 2); tg.translate(0, TOP - .2, 0);             // shape (x, z) from TOP down to WT, the edges eased 2 mm
  { const p = tg.attributes.position, uv = tg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / QUARTZ_CM, p.getZ(i) / QUARTZ_CM); }
  const topM = new THREE.Mesh(tg, quartz); topM.castShadow = topM.receiveShadow = true; root.add(topM);
  // the sink: an inset bowl in the same conglomerate, 18 deep, and a drain
  const bowl = std({ color: '#cbb89c', roughness: .55 });
  box(SX0, SX1, WT - 18, WT - 17, SZ0, SZ1, bowl);
  box(SX0, SX0 + 1, WT - 18, WT, SZ0, SZ1, bowl); box(SX1 - 1, SX1, WT - 18, WT, SZ0, SZ1, bowl);
  box(SX0, SX1, WT - 18, WT, SZ0, SZ0 + 1, bowl); box(SX0, SX1, WT - 18, WT, SZ1 - 1, SZ1, bowl);
  { const dr = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, .3, 32), steel); dr.position.set((SX0 + SX1) / 2, WT - 16.8, (SZ0 + SZ1) / 2 + 6); root.add(dr); }
  // the tap: brushed steel, a gooseneck
  {
    const tx = (SX0 + SX1) / 2, tz = 6;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(tx, TOP, tz), new THREE.Vector3(tx, TOP + 26, tz), new THREE.Vector3(tx, TOP + 36, tz + 6), new THREE.Vector3(tx, TOP + 33, tz + 17), new THREE.Vector3(tx, TOP + 25, tz + 21)]);
    const neck = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 1.2, 16), steel); neck.castShadow = true; root.add(neck);
    const base0 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 5, 32), steel); base0.position.set(tx, TOP + 2.5, tz); root.add(base0);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 9, 12), steel); lever.rotation.z = Math.PI / 2 - .3; lever.position.set(tx + 5, TOP + 9, tz); root.add(lever);
  }
  // the induction hob: black glass, 78 x 52, zones printed faintly
  {
    const c = canvas(780, 520), g = c.getContext('2d'); g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, 780, 520); g.strokeStyle = 'rgba(200,200,200,.22)'; g.lineWidth = 3;
    for (const [x, y, r] of [[190, 170, 110], [190, 380, 90], [560, 170, 90], [560, 370, 120]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(210,210,210,.35)'; for (let i = 0; i < 9; i++) g.fillRect(300 + i * 20, 470, 10, 10);
    const m = std({ map: tex(c, true), roughness: .05, metalness: .1 });
    const hob = new THREE.Mesh(new THREE.BoxGeometry(78, .6, 52), [blackGlass, blackGlass, m, blackGlass, blackGlass, blackGlass]);
    hob.position.set((X[3] + X[4]) / 2, TOP + .3, 30); hob.receiveShadow = true; root.add(hob);
  }
  // the backsplash: tiles from the worktop to the uppers, between the tall units, on the wall face
  {
    const w = X[5] - X[1], h = UP0 - TOP, g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tiles.w, uv.getY(i) * h / tiles.h);
    const m = new THREE.Mesh(g, tiles.mat); m.position.set((X[1] + X[5]) / 2, (TOP + UP0) / 2, .15); m.receiveShadow = true; root.add(m);
  }
  // the uppers: cashmere fronts to the ceiling, an oak strip along their bottom, the LED under it
  box(X[1], X[5], UP0, CEIL, 0, UD - 2, carcass);
  for (let i = 1; i < 5; i++) box(X[i] + G / 2, X[i + 1] - G / 2, UP0 + 4 + G / 2, CEIL - G / 2, UD - 2, UD - .1, cashmere);
  box(X[1], X[5], UP0, UP0 + 4, UD - 2, UD, oak);                    // the decorative oak strip between the uppers and the lowers
  { const led = new THREE.Mesh(new THREE.BoxGeometry(X[5] - X[1] - 4, .4, 1.2), new THREE.MeshBasicMaterial({ color: '#ffe2b8', ...clip })); led.position.set((X[1] + X[5]) / 2, UP0 - .2, UD - 6); root.add(led);
    const light = new THREE.RectAreaLight('#ffd9a8', 40, (X[5] - X[1] - 6) / 100, .03); light.position.set((X[1] + X[5]) / 2, UP0 - .5, UD - 6); light.rotation.x = -Math.PI / 2; root.add(light); }

  // ---------- the island: 180 x 80, drawers towards the kitchen, fluted oak towards the living room, a 25 cm overhang for the knees ----------
  const I = new THREE.Group(); root.add(I);
  const IW = K.island.w, ID = K.island.d;                              // x along the island, z across (z = -ID/2 faces the run)
  I.position.set(K.island.along, 0, K.island.off);
  const ix0 = -IW / 2, ix1 = IW / 2, iz0 = -ID / 2, back = iz0 + 2 + 53;  // the carcass: 53 deep behind the fronts; then the overhang
  box(ix0 + 2, ix1 - 2, 0, Y0, iz0 + 7, back - 1, shadowGap, OAK, I);   // the plinth only on the kitchen side
  box(ix0 + 2, ix1 - 2, Y0, WT, iz0 + 2, back, carcass, OAK, I);
  const cw = (IW - 4) / 3;
  for (let c = 0; c < 3; c++) { const a = ix0 + 2 + c * cw, b = a + cw;
    const lf = (y0, y1) => { box(a + G / 2, b - G / 2, y0 + G / 2, y1 - 3, iz0, iz0 + 1.9, oak, OAK, I); box(a + G / 2, b - G / 2, y1 - 3, y1 - G / 2, iz0 + 1.3, iz0 + 1.9, shadowGap, OAK, I); };
    lf(Y0, 50); lf(50, WT); }
  box(ix0, ix0 + 2, 0, WT, iz0, -iz0, oak, OAK, I); box(ix1 - 2, ix1, 0, WT, iz0, -iz0, oak, OAK, I);   // the oak ends, floor to top
  { const fw = IW - 4, fh = WT, n = Math.floor(fw / 2.5), step = fw / n, parts = [];      // the fluted back, under the overhang: half-round reeds, 2.5 cm, down to the floor
    box(ix0 + 2, ix1 - 2, 0, WT, back, back + .8, oak, OAK, I);
    for (let k = 0; k < n; k++) { const c = new THREE.CylinderGeometry(step / 2 - .05, step / 2 - .05, fh, 14, 1, true); c.translate(ix0 + 2 + step * (k + .5), fh / 2, back + .8); parts.push(c); }
    const g = mergeGeometries(parts); planarUV(g, OAK, .37, .11);
    const m = new THREE.Mesh(g, oak); m.castShadow = m.receiveShadow = true; I.add(m); }
  { const g = new RoundedBoxGeometry(IW, TOP - WT, ID, 3, .25); planarUV(g, QUARTZ_CM, .3, .6);
    const m = new THREE.Mesh(g, quartz); m.position.set(0, (TOP + WT) / 2, 0); m.castShadow = m.receiveShadow = true; I.add(m); }
  // three counter stools (seat 66 cm, 24 cm below the top): a soft round boucle cushion, a curved back, black steel legs and a footrest
  const cushion = (() => { const pts = [[0, 0], [17.5, 0], [19.8, .6], [20.9, 2.2], [21.2, 4], [20.8, 5.8], [19.4, 7.2], [16.5, 8], [0, 8.2]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 64), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4.4, uv.getY(i) * 1.5); return g; })();   // the scan covers about 30 cm
  const backG = (() => { const sh = new THREE.Shape(), a0 = -Math.PI / 2 - .95, a1 = -Math.PI / 2 + .95;
    sh.absarc(0, 0, 20.5, a0, a1, false); sh.absarc(0, 0, 16.5, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 17, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.4, bevelSegments: 4, curveSegments: 32 });
    g.rotateX(-Math.PI / 2); g.computeVertexNormals(); planarUV(g, 30); return g; })();
  const legG = new THREE.CylinderGeometry(.75, .65, 58, 16), capM = std({ color: '#0a0a0a', roughness: .9 });
  for (const sx of [-60, 0, 60]) {
    const St = new THREE.Group(); St.position.set(sx, 0, ID / 2 + 4); I.add(St);
    const seat = new THREE.Mesh(cushion, fabric); seat.position.y = 58; seat.castShadow = seat.receiveShadow = true; St.add(seat);
    const bk = new THREE.Mesh(backG, fabric); bk.position.y = 67.6; bk.castShadow = true; St.add(bk);   // the back sits behind the sitter, away from the island
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1, 32), legs); plate.position.y = 57.5; St.add(plate);
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const lg = new THREE.Mesh(legG, legs); lg.position.set(lx * 12.5, 29, lz * 12.5); lg.rotation.set(-lz * .09, 0, lx * .09); lg.castShadow = true; St.add(lg);   // splayed outwards, onto the caps
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .8, 12), capM); cap.position.set(lx * 15.1, .4, lz * 15.1); St.add(cap);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(14.2, .6, 10, 64), legs); ring.rotation.x = Math.PI / 2; ring.position.y = 24; ring.castShadow = true; St.add(ring);
  }

  // ---------- things on the tops (Poly Haven, CC0): two clay vases by the oven, a carved wooden bowl of limes on the island; a pachira by the window ----------
  const gl = new GLTFLoader();
  const clipIt = g => g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; for (const m of [].concat(o.material)) { m.clippingPlanes = clip.clippingPlanes; m.clipShadows = true; } } });
  const model = async (id, x, y, z, sc = 1, rot = 0, parent = root) => {
    const g = (await gl.loadAsync(`${base}models/${id}/${id}.gltf`)).scene; clipIt(g);
    g.scale.setScalar(100 * sc); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g); return g;
  };
  const decor = [
    model('ceramic_vase_02', 296, TOP, 22, 1, .4), model('ceramic_vase_01', 318, TOP, 16, .85, 1.2),
    model('carved_wooden_plate', 12, TOP, -4, 1, .3, I),
  ];
  { const r = rng(5);
    decor.push(gl.loadAsync(`${base}models/food_lime_01/food_lime_01.gltf`).then(({ scene: l }) => { clipIt(l);
      for (const [px_, pz_, py_] of [[-4, -3, .9], [3, -5, .9], [5, 2, .9], [-2, 4, .9], [0, -.5, 5.6], [-5, 1, 4.8], [3.5, -1.5, 5]]) {
        const c = l.clone(); c.scale.setScalar(100); c.position.set(12 + px_, TOP + py_, -4 + pz_); c.rotation.set(r() * 3, r() * 6, r() * 3); I.add(c); } })); }
  { const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [15, 0], [16.5, 2], [19.5, 36], [20, 38], [18.8, 38.2], [18.4, 35], [0, 35]].map(([r, y]) => new THREE.Vector2(r, y)), 48), std({ color: '#cbb59a', roughness: .85 }));
    pot.position.set(L + 38, 0, 100); pot.castShadow = pot.receiveShadow = true; root.add(pot);   // a clay planter in front of the pier by the balcony door
    decor.push(model('pachira_aquatica_01', L + 38, 34, 100, .74, 2.2)); }
  await Promise.all(decor);

  // ---------- five black surface spots on the ceiling, over the front of the run ----------
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * (L - 100) / 4, sp = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 11, 32), legs); sp.position.set(x, CEIL - 5.5, 95); root.add(sp);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ color: '#fff4e0', ...clip })); lens.rotation.x = Math.PI / 2; lens.position.set(x, CEIL - 11.05, 95); root.add(lens);
  }

  // the run and the island on the floor, for walking (plan cm): polygons
  const P = (u, v) => [K.a[0] + K.d[0] * u + K.n[0] * v, K.a[1] + K.d[1] * u + K.n[1] * v];
  const foot = [[P(0, 0), P(L, 0), P(L, D + 2), P(0, D + 2)]];
  const isl = (u, v) => P(K.island.along + u, K.island.off + v);
  const islandFoot = off => { const q = (u, v) => P(K.island.along + u, off + v); return [q(ix0, iz0), q(ix1, iz0), q(ix1, back + 2), q(ix0, back + 2)]; };
  foot.push(islandFoot(K.island.off));
  return { root, foot, island: I, islandFoot, frontOfRun: D + 2 };
}
