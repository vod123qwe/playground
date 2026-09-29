// The kitchen of the concept "M48" (oak lower fronts and tall units, cashmere beige uppers to the ceiling, glossy structured tiles, black
// appliances, LED under the uppers, a fluted island with three stools) on the layout A.04: the run 350 x 60 along the kitchen wall, from
// the wall's return by the entrance to 40 cm short of the window wall (as A.04 draws it), the island 180 x 80 where A.04 draws it.
// The worktops in Taj Mahal quartzite (tools/make_tajmahal.py), polished, 3 cm. Everything is modelled in centimetres.
//
// Run, from the entrance side: a 5 cm oak filler (the fridge's drawers clear the wall) | integrated fridge-freezer 60 (tall) | undermount
// sink 60 over a pull-out with bins | integrated dishwasher 60 | flush induction 80 | cargo 30 | oven 60 + compact oven with microwave 45
// (tall) | a tall 36 cm cupboard to the window wall (trays, boards). Uppers over the worktop split as the lowers (60 | 60 | 80 | 30), the
// 80 over the hob holding a pull-out hood. Heights: plinth 10, worktop 87-90, uppers 145 to the ceiling (55 cm of backsplash).
// Everything opens (openers): doors on their hinges, drawers and pull-outs, the oven doors drop, the dishwasher tips down, the hood's
// visor slides out; inside, carcasses with shelves, the fridge's liner, shelves and door bins, the ovens' cavities and racks.

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
  const oak = std({ name: 'oak', map: oakC, normalMap: oakN, normalScale: new THREE.Vector2(.35, .35), roughnessMap: oakR, roughness: .9, color: '#e6d3bd' });   // natural oak, matt lacquer
  const cashmere = std({ name: 'cashmere', color: '#d7c9b6', roughness: .72 });        // upper fronts: beige / cashmere, matt
  const carcass = std({ name: 'carcass', color: '#e9e3da', roughness: .8 });
  const shadowGap = std({ name: 'shadowGap', color: '#3a302a', roughness: .9 });        // the integrated handle groove, the plinth recess
  const blackGlass = std({ name: 'blackGlass', color: '#0b0c0e', roughness: .06, metalness: .2 });
  const steel = std({ name: 'steel', color: '#c8c9ca', roughness: .32, metalness: 1 });   // brushed steel tap and appliance handles
  const legs = std({ name: 'legs', color: '#141414', roughness: .45, metalness: .6 });
  const [tdC, tdN, tdR] = await Promise.all([load('tex/teddy_diff.jpg', true), load('tex/teddy_nor.jpg'), load('tex/teddy_rough.jpg')]);
  const fabric = std({ name: 'fabric', map: tdC, normalMap: tdN, normalScale: new THREE.Vector2(1.2, 1.2), roughnessMap: tdR, roughness: 1, color: '#e9dccb' });   // boucle: Poly Haven "curly teddy natural" (CC0)          // stool seats: beige boucle
  // Taj Mahal quartzite, polished: one map over 250 x 250 cm; the run's top and the island's take different parts of it
  const [tmC, tmR] = await Promise.all([load('tex/tajmahal.jpg', true), load('tex/tajmahal_rough.jpg')]);
  const quartz = std({ name: 'tajmahal', map: tmC, roughnessMap: tmR, roughness: 1 });
  const QUARTZ_CM = 250;
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
    return { mat: std({ name: 'tiles', map: tex(c, true), normalMap: tex(n), normalScale: new THREE.Vector2(.8, .8), roughness: .12 }), w: W * cols, h: T * rows };
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
  function lowerFront(x0, x1, y0, y1, z, parent = root) { return [box(x0 + G / 2, x1 - G / 2, y0 + G / 2, y1 - 3, z, z + 1.9, oak, OAK, parent), box(x0 + G / 2, x1 - G / 2, y1 - 3, y1 - G / 2, z, z + .6, shadowGap, OAK, parent)]; }
  function tallFront(x0, x1, y0, y1, z, handleRight) {                // a tall front with a vertical groove on the handle side
    const gx = handleRight ? x1 - 3 : x0;
    return [box(handleRight ? x0 + G / 2 : x0 + 3, handleRight ? x1 - 3 : x1 - G / 2, y0 + G / 2, y1 - G / 2, z, z + 1.9, oak),
      box(gx + (handleRight ? 0 : G / 2), gx + 3 - (handleRight ? G / 2 : 0), y0 + G / 2, y1 - G / 2, z, z + .6, shadowGap)];
  }
  // ---------- what opens: each opener moves its parts by f (0 shut, 1 open), the viewer eases f and calls apply ----------
  const openers = [];
  const inner = std({ name: 'carcassIn', color: '#ece8e1', roughness: .7 }), drawerM = std({ name: 'drawerBox', color: '#dcdcd9', roughness: .45, metalness: .2 });
  const wire = std({ name: 'wire', color: '#c9cacc', roughness: .3, metalness: 1 }), liner = std({ name: 'fridgeLiner', color: '#f3f4f3', roughness: .35 });
  const cavity = std({ name: 'ovenCavity', color: '#17181a', roughness: .3, metalness: .25 }), tub = std({ name: 'dwTub', color: '#c2c4c6', roughness: .35, metalness: .9 });
  const clear = std({ name: 'glass', color: '#e9f2f2', roughness: .05, transparent: true, opacity: .25, depthWrite: false });
  function opener(parts, apply) { const o = { kind: 'fx', f: 0, to: 0, parts: [], apply }; for (const m of parts) m.traverse(c => { if (c.isMesh) { c.userData.door = o; o.parts.push(c); } }); openers.push(o); return o; }
  function pivot(x, y, z, parts, parent = root) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); parent.updateMatrixWorld(true); for (const m of parts) g.attach(m); return g; }
  // a side-hung door: the hinge on the left (+1) or the right (-1) edge, at the carcass face zf, swinging out to about 100 degrees
  const hinged = (parts, hx, zf, side, parent = root) => { const g = pivot(hx, 0, zf, parts, parent); return opener([g], ez => { g.rotation.y = -side * ez * 1.75; }); };
  // a drawer: its front and box slide out along +z (or dir -1: -z)
  const slide = (parts, dist, parent = root, dir = 1) => { const g = pivot(0, 0, 0, parts, parent); return opener([g], ez => { g.position.z = dir * ez * dist; }); };
  // a door hinged at its bottom edge, tipping out (the ovens, the dishwasher)
  const drop = (parts, y, zf, max = 1.52) => { const g = pivot(0, y, zf, parts); return opener([g], ez => { g.rotation.x = ez * max; }); };
  // a carcass open at the front: back, sides, bottom, top, shelves (in the inner colour)
  function shell(x0, x1, y0, y1, z0, z1, shelves = [], m = inner, parent = root) {
    const t = 1.8, out = [box(x0, x1, y0, y1, z0, z0 + .8, m, OAK, parent, 0), box(x0, x0 + t, y0, y1, z0, z1, m, OAK, parent, 0), box(x1 - t, x1, y0, y1, z0, z1, m, OAK, parent, 0),
      box(x0, x1, y0, y0 + t, z0, z1, m, OAK, parent, 0), box(x0, x1, y1 - t, y1, z0, z1, m, OAK, parent, 0)];
    for (const y of shelves) out.push(box(x0 + t, x1 - t, y - t / 2, y + t / 2, z0 + .8, z1 - 2, m, OAK, parent, .1));
    return out;
  }
  // a drawer box behind a front: metal sides, a bottom, a back; its top edge a little under the front's
  const drawerBox = (x0, x1, y0, y1, z0, z1, parent = root) => [box(x0 + 1, x0 + 2.4, y0, y1, z0, z1, drawerM, OAK, parent, .2), box(x1 - 2.4, x1 - 1, y0, y1, z0, z1, drawerM, OAK, parent, .2),
    box(x0 + 1, x1 - 1, y0, y0 + 1.2, z0, z1, inner, OAK, parent, .1), box(x0 + 1, x1 - 1, y0, y1, z0, z0 + 1.2, drawerM, OAK, parent, .2)];
  // a wire rack: a frame and bars (the ovens, the dishwasher, the cargo)
  function rack(x0, x1, y, z0, z1, n = 9, parent = root) {
    const out = [box(x0, x1, y, y + .5, z0, z0 + .5, wire, OAK, parent, 0), box(x0, x1, y, y + .5, z1 - .5, z1, wire, OAK, parent, 0), box(x0, x0 + .5, y, y + .5, z0, z1, wire, OAK, parent, 0), box(x1 - .5, x1, y, y + .5, z0, z1, wire, OAK, parent, 0)];
    for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n; out.push(box(x - .15, x + .15, y, y + .3, z0, z1, wire, OAK, parent, 0)); }
    return out;
  }

  // ---------- the appliances: black glass fronts with a control strip (a small display, touch symbols) and a steel bar handle ----------
  function fascia(W, Hh, kind) {                                     // the front's face, drawn at 17 px per cm
    const PX = 17, cw = Math.round(W * PX), ch = Math.round(Hh * PX), c = canvas(cw, ch), g = c.getContext('2d');
    g.fillStyle = '#0c0d0f'; g.fillRect(0, 0, cw, ch);
    const strip = 9 * PX;                                            // the control strip along the top
    g.fillStyle = '#111316'; g.fillRect(0, 0, cw, strip); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, strip, cw, 2);
    const dw = 14 * PX, dh = 3.4 * PX, dx = (cw - dw) / 2, dy = (strip - dh) / 2;   // the display
    g.fillStyle = '#050607'; g.beginPath(); g.roundRect(dx, dy, dw, dh, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.88)'; g.font = `600 ${Math.round(2.2 * PX)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(kind === 'oven' ? '180°' : '11:30', cw / 2, dy + dh / 2 + 2);
    g.fillStyle = 'rgba(240,160,70,.9)'; g.beginPath(); g.arc(dx + 1.2 * PX, dy + dh / 2, .35 * PX, 0, 7); g.fill();
    g.strokeStyle = 'rgba(210,210,215,.45)'; g.lineWidth = 3;
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {       // touch symbols either side of the display
      const x = cw / 2 + side * (dw / 2 + (3 + i * 4.2) * PX), y = strip / 2;
      g.beginPath();
      if (i === 0) g.arc(x, y, .9 * PX, 0, 7);
      else if (i === 1) { g.moveTo(x - .9 * PX, y); g.lineTo(x + .9 * PX, y); if (side > 0) { g.moveTo(x, y - .9 * PX); g.lineTo(x, y + .9 * PX); } }
      else g.rect(x - .8 * PX, y - .8 * PX, 1.6 * PX, 1.6 * PX);
      g.stroke();
    }
    const wx0 = 6 * PX, wy0 = strip + 7 * PX, wx1 = cw - 6 * PX, wy1 = ch - 5 * PX;   // the door's window: a shade lighter, the rack behind it
    const gr = g.createLinearGradient(0, wy0, 0, wy1); gr.addColorStop(0, '#16181b'); gr.addColorStop(1, '#0f1012');
    g.fillStyle = gr; g.beginPath(); g.roundRect(wx0, wy0, wx1 - wx0, wy1 - wy0, 14); g.fill();
    g.strokeStyle = 'rgba(160,160,165,.08)'; g.lineWidth = 4;
    for (let i = 1; i < 12; i++) { const x = wx0 + (wx1 - wx0) * i / 12; g.beginPath(); g.moveTo(x, wy0 + (wy1 - wy0) * .55); g.lineTo(x, wy0 + (wy1 - wy0) * .62); g.stroke(); }
    return tex(c, true);
  }
  function appliance(x0, x1, y0, y1, kind) {                         // a glass door 2 cm proud of the carcass, its face printed, a bar on two posts
    const W = x1 - x0 - 1, Hh = y1 - y0, face = std({ name: `${kind}Face`, map: fascia(W, Hh, kind), roughness: .05, metalness: .15 });
    const out = [box(x0 + .5, x1 - .5, y0, y1, D - 2, D - .05, blackGlass, OAK, root, .3)];
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(W - .4, Hh - .4), face); pane.position.set((x0 + x1) / 2, (y0 + y1) / 2, D - .03); pane.receiveShadow = true; root.add(pane); out.push(pane);
    const hy = y1 - 9 - 3.2, bar = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, W - 10, 32), steel);
    bar.rotation.z = Math.PI / 2; bar.position.set((x0 + x1) / 2, hy, D + 3.2); bar.castShadow = true; root.add(bar); out.push(bar);
    for (const sd of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 3.2, 16), steel); post.rotation.x = Math.PI / 2; post.position.set((x0 + x1) / 2 + sd * (W / 2 - 7), hy, D + 1.6); root.add(post); out.push(post); }
    return out;
  }

  // ---------- the run (x along the wall from the entrance side, z out of the wall) ----------
  const Y0 = 10, WT = 87, TOP = 90, UP0 = 145, CEIL = H, D = 60, UD = 35;
  const X = [5, 65, 125, 185, 265, 295, 355];                        // filler | fridge | sink | dishwasher | hob | cargo | oven | tall cupboard
  const L = X[6], LF = K.len - .2;                                   // the ovens' column ends at 355 (A.04's 350 from the 5 cm filler); the cupboard to the wall
  box(0, LF, 0, Y0, 0, D - 5, shadowGap);                             // the plinth, a dark recess 5 cm deep
  // the filler by the wall's return, flush with the fronts, plinth to ceiling
  box(G / 2, X[0] - G / 2, Y0, CEIL - G / 2, D - 2, D - .1, oak); box(0, X[0], Y0, CEIL, 0, D - 2, carcass);
  // the fridge column: an integrated fridge-freezer (178 niche) behind oak doors, a store above; the appliance breathes through a black
  // grille in the plinth. Inside: the liner, three freezer drawers, glass shelves, the crisper, a light; bins on the fridge door's back
  shell(X[0], X[1], Y0, CEIL, 0, D - 2, [82, 190]);
  shell(X[0] + 2, X[1] - 2, Y0 + 2, 188.5, 2, D - 3, [], liner);
  for (const [y0, y1] of [[Y0 + 4, 32], [33, 56], [57, 79]]) box(X[0] + 4, X[1] - 4, y0, y1, 4, D - 4, std({ name: 'freezerDrawer', color: '#f5f6f6', roughness: .3, transparent: true, opacity: .85 }), OAK, root, .6);
  box(X[0] + 3.8, X[1] - 3.8, 81, 82.5, 2.8, D - 3.2, liner);          // the freezer's lid
  for (const y of [112, 132, 152, 170]) box(X[0] + 4, X[1] - 4, y, y + .5, 3, D - 6, clear, OAK, root, .1);
  box(X[0] + 4, X[1] - 4, 84, 104, 4, D - 5, clear, OAK, root, .8);    // the crisper
  box(X[0] + 12, X[1] - 12, 186.5, 187.2, 12, 40, std({ name: 'fridgeLight', color: '#ffffff', emissive: '#fff6ea', emissiveIntensity: .8, roughness: .3 }));
  for (let i = 0; i < 9; i++) box(X[0] + 8, X[1] - 8, 1.6 + i * .8, 2 + i * .8, D - 5.3, D - 4.9, legs, OAK, root, 0);
  { const fz = tallFront(X[0], X[1], Y0, 82, D - 2, true), fr = tallFront(X[0], X[1], 82, 190, D - 2, true);
    fz.push(box(X[0] + 3, X[1] - 3, Y0 + 3, 79, D - 3.5, D - 2, liner, OAK, root, .5));
    fr.push(box(X[0] + 3, X[1] - 3, 85, 187, D - 3.5, D - 2, liner, OAK, root, .5));
    for (const y of [100, 125, 150, 172]) fr.push(box(X[0] + 7, X[1] - 7, y, y + 7, D - 13, D - 3.5, clear, OAK, root, .4));   // the door bins
    hinged(fz, X[0], D - 2, 1); hinged(fr, X[0], D - 2, 1); hinged(tallFront(X[0], X[1], 190, CEIL, D - 2, true), X[0], D - 2, 1); }
  // the sink: a pull-out below the bowl with two bins
  { const box0 = box(X[1], X[2], Y0, 64, 0, D - 2, carcass);          // (the bowl and its trap above)
    const f = lowerFront(X[1], X[2], Y0, WT, D - 2), db = drawerBox(X[1] + 1, X[2] - 1, Y0 + 3, 62, 6, D - 2.2);
    for (const [a, b] of [[X[1] + 3, X[1] + 29], [X[1] + 31, X[2] - 3]]) db.push(box(a, b, Y0 + 4.2, 52, 9, D - 6, std({ name: 'bin', color: '#8b8d90', roughness: .6 }), OAK, root, 1.2));
    slide([...f, ...db], 46); void box0; }
  // the dishwasher: the oak panel tips down; the tub and two racks inside
  shell(X[2], X[3], Y0, WT - 3, 0, D - 2, [], tub);
  rack(X[2] + 3, X[3] - 3, 28, 6, D - 6, 12); rack(X[2] + 3, X[3] - 3, 56, 6, D - 6, 12);
  { const f = lowerFront(X[2], X[3], Y0, WT, D - 2); f.push(box(X[2] + 2, X[3] - 2, Y0 + 3, WT - 5, D - 3, D - 2, tub, OAK, root, .4)); drop(f, Y0, D - 2, 1.45); }
  // three drawers under the hob, the cargo pull-out with three wire baskets
  box(X[3], X[5], Y0, WT, 0, D - 2, carcass);
  for (const [y0, y1] of [[Y0, 32], [32, 58], [58, WT - 6]]) slide([...lowerFront(X[3], X[4], y0, y1 === WT - 6 ? WT : y1, D - 2), ...drawerBox(X[3] + 1, X[4] - 1, y0 + 3, y1 - 4, 6, D - 2.2)], 45);
  { const f = lowerFront(X[4], X[5], Y0, WT, D - 2); for (const y of [16, 40, 64]) f.push(...rack(X[4] + 2, X[5] - 2, y, 6, D - 4, 5), box(X[4] + 2, X[5] - 2, y, y + 6, 6, 6.5, wire, OAK, root, 0));
    f.push(box(X[4] + 2, X[4] + 3, Y0 + 2, 80, 6, D - 3, drawerM, OAK, root, .2)); slide(f, 48); }
  // the oven column: a drawer, the oven (60), the compact oven with microwave (45), a store above; black glass, the same line. Behind
  // the doors the enamel cavities with racks and a light
  shell(X[5], L, Y0, CEIL, 0, D - 2, [76, 136.5, 182.5]);
  slide([...lowerFront(X[5], L, Y0, 76, D - 2), ...drawerBox(X[5] + 1, L - 1, Y0 + 3, 70, 6, D - 2.2)], 45);
  for (const [y0, y1] of [[76.5, 136], [137, 182]]) {
    shell(X[5] + 2, L - 2, y0 + 1, y1 - 1, 2, D - 2.1, [], cavity);
    rack(X[5] + 4, L - 4, y0 + (y1 - y0) * .38, 5, D - 5, 11);
    box(L - 6, L - 4.5, y1 - 7, y1 - 5.5, 6, 8, std({ name: 'ovenLight', color: '#fff4e0', emissive: '#ffd9a0', emissiveIntensity: .6 }), OAK, root, .2);
  }
  drop(appliance(X[5], L, 76.5, 136, 'oven'), 76.5, D - 2); drop(appliance(X[5], L, 137, 182, 'combi'), 137, D - 2);
  hinged(tallFront(X[5], L, 183, CEIL, D - 2, false), L, D - 2, -1);
  // the tall cupboard to the window wall: shelves, the doors hinged on the wall's side
  shell(L, LF, Y0, CEIL, 0, D - 2, [48, 88, 128, 183, 220]);
  hinged(tallFront(L, LF, Y0, 183, D - 2, false), LF, D - 2, -1); hinged(tallFront(L, LF, 183, CEIL, D - 2, false), LF, D - 2, -1);
  // the worktop with the sink cut out, 62 deep (2 cm over the fronts)
  const topShape = new THREE.Shape([new THREE.Vector2(X[1] - .01, 0), new THREE.Vector2(X[5] + .01, 0), new THREE.Vector2(X[5] + .01, D + 2), new THREE.Vector2(X[1] - .01, D + 2)]);
  const SX0 = X[1] + 6, SX1 = X[2] - 6, SZ0 = 12, SZ1 = 52;         // the undermount bowl: 48 x 40, set off the tall fridge
  const rrect = (x0, z0, x1, z1, r) => { const p = new THREE.Path(); p.moveTo(x0 + r, z0); p.lineTo(x1 - r, z0); p.absarc(x1 - r, z0 + r, r, -Math.PI / 2, 0); p.lineTo(x1, z1 - r); p.absarc(x1 - r, z1 - r, r, 0, Math.PI / 2);
    p.lineTo(x0 + r, z1); p.absarc(x0 + r, z1 - r, r, Math.PI / 2, Math.PI); p.lineTo(x0, z0 + r); p.absarc(x0 + r, z0 + r, r, Math.PI, Math.PI * 1.5); return p; };
  topShape.holes.push(rrect(SX0, SZ0, SX1, SZ1, 1.6));
  const HX = (X[3] + X[4]) / 2, HZ = 31, HW = 78, HD = 52;           // the flush hob: its glass level with the top, a 2 mm joint all round
  topShape.holes.push(rrect(HX - HW / 2 - .2, HZ - HD / 2 - .2, HX + HW / 2 + .2, HZ + HD / 2 + .2, .5));
  const tg = new THREE.ExtrudeGeometry(topShape, { depth: TOP - WT - .4, bevelEnabled: true, bevelThickness: .2, bevelSize: .2, bevelOffset: -.2, bevelSegments: 3 });
  tg.rotateX(Math.PI / 2); tg.translate(0, TOP - .2, 0);             // shape (x, z) from TOP down to WT, the edges eased 2 mm
  { const p = tg.attributes.position, uv = tg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - 50) / QUARTZ_CM, p.getZ(i) / QUARTZ_CM); }
  const topM = new THREE.Mesh(tg, quartz); topM.castShadow = topM.receiveShadow = true; root.add(topM);
  // the sink: a brushed steel bowl under the stone, 18 deep, and a drain
  const bowl = std({ name: 'sinkSteel', color: '#c9cacc', roughness: .38, metalness: 1 });
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
  // the induction hob, flush: black glass 78 x 52 level with the top; two flex zones on the left, three round ones on the right, the
  // slider along the front; the joint and the hob's body show dark in the 2 mm gap
  {
    const PX = 26, cw = HW * PX, ch = HD * PX, c = canvas(cw, ch), g = c.getContext('2d'); g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = 'rgba(205,205,210,.2)'; g.lineWidth = 4;
    for (const y0 of [4, 21]) { g.beginPath(); g.roundRect(4 * PX, y0 * PX, 20 * PX, 16 * PX, 2 * PX); g.stroke(); }
    for (const [x, y, r] of [[48, 14, 10], [66, 13, 7.5], [57, 32, 6]]) { g.beginPath(); g.arc(x * PX, y * PX, r * PX, 0, 7); g.stroke(); g.beginPath(); g.arc(x * PX, y * PX, (r - 1.2) * PX, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(215,215,220,.42)'; g.font = `600 ${Math.round(1.3 * PX)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillRect(28 * PX, 47 * PX, 22 * PX, 3); for (let i = 0; i <= 9; i++) g.fillText(String(i), (28 + i * 22 / 9) * PX, 44.5 * PX);
    for (const [x, t] of [[10, 'I/O'], [17, 'P'], [62, '−'], [68, '+']]) g.fillText(t, x * PX, 46 * PX);
    const m = std({ name: 'hobGlass', map: tex(c, true), roughness: .04, metalness: .1 });
    const hob = new THREE.Mesh(new THREE.BoxGeometry(HW, .6, HD), [blackGlass, blackGlass, m, blackGlass, blackGlass, blackGlass]);
    hob.position.set(HX, TOP - .3, HZ); hob.receiveShadow = true; root.add(hob);
    box(HX - HW / 2 - .3, HX + HW / 2 + .3, TOP - 6, TOP - .7, HZ - HD / 2 - .3, HZ + HD / 2 + .3, shadowGap, OAK, root, 0);   // the body under the joint
  }
  // the backsplash: tiles from the worktop to the uppers, between the tall units, on the wall face
  {
    const w = X[5] - X[1], h = UP0 - TOP, g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tiles.w, uv.getY(i) * h / tiles.h);
    const m = new THREE.Mesh(g, tiles.mat); m.position.set((X[1] + X[5]) / 2, (TOP + UP0) / 2, .15); m.receiveShadow = true; root.add(m);
  }
  // the uppers: cashmere fronts to the ceiling split as the lowers (60 | 60 | 80 | 30), push to open, shelves inside; the 80 over the hob
  // holds a pull-out hood: its visor, a strip in the fronts' colour under the door, slides out with the grille and two lights; the LED
  // in a profile under them
  for (const [a, b, side, hood] of [[X[1], X[2], 1, 0], [X[2], X[3], -1, 0], [X[3], X[4], 1, 1], [X[4], X[5], -1, 0]]) {
    shell(a, b, UP0, CEIL, 0, UD - 2, hood ? [200, 228] : [182, 218]);
    const y0 = hood ? UP0 + 5 : UP0;
    hinged([box(a + G / 2, b - G / 2, y0 + G / 2, CEIL - G / 2, UD - 2, UD - .1, cashmere)], side > 0 ? a : b, UD - 2, side);
    if (hood) {
      box(a + 2, b - 2, UP0 + 1.8, UP0 + 24, 2, UD - 4, std({ name: 'hoodBody', color: '#2b2c2f', roughness: .5, metalness: .4 }));
      const lamp = std({ name: 'hoodLight', color: '#fff6ea', emissive: '#fff1dc', emissiveIntensity: .7, roughness: .3 });
      const v = [box(a + G / 2, b - G / 2, UP0 + .2, UP0 + 4.7, UD - 2, UD - .1, cashmere), box(a + 3, b - 3, UP0 + .6, UP0 + 1.2, 6, UD - 2, steel)];
      for (const x of [a + 18, b - 18]) v.push(box(x - 3, x + 3, UP0 + .4, UP0 + .6, 22, 27, lamp, OAK, root, .2));
      slide(v, 24);
    }
  }
  { const led = new THREE.Mesh(new THREE.BoxGeometry(X[5] - X[1] - 4, .4, 1.2), new THREE.MeshBasicMaterial({ name: 'led', color: '#ffe2b8', ...clip })); led.position.set((X[1] + X[5]) / 2, UP0 - .2, UD - 6); root.add(led);
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
    const lf = (y0, y1) => { const f = [box(a + G / 2, b - G / 2, y0 + G / 2, y1 - 3, iz0, iz0 + 1.9, oak, OAK, I), box(a + G / 2, b - G / 2, y1 - 3, y1 - G / 2, iz0 + 1.3, iz0 + 1.9, shadowGap, OAK, I)];
      f.push(...drawerBox(a + 1, b - 1, y0 + 3, y1 - 5, iz0 + 1.95, iz0 + 48, I)); slide(f, 44, I, -1); };
    lf(Y0, 50); lf(50, WT); }
  box(ix0, ix0 + 2, 0, WT, iz0, -iz0, oak, OAK, I); box(ix1 - 2, ix1, 0, WT, iz0, -iz0, oak, OAK, I);   // the oak ends, floor to top
  { const fw = IW - 4, fh = WT, n = Math.floor(fw / 2.5), step = fw / n, parts = [];      // the fluted back, under the overhang: half-round reeds, 2.5 cm, down to the floor
    box(ix0 + 2, ix1 - 2, 0, WT, back, back + .8, oak, OAK, I);
    for (let k = 0; k < n; k++) { const c = new THREE.CylinderGeometry(step / 2 - .05, step / 2 - .05, fh, 14, 1, true); c.translate(ix0 + 2 + step * (k + .5), fh / 2, back + .8); parts.push(c); }
    const g = mergeGeometries(parts); planarUV(g, OAK, .37, .11);
    const m = new THREE.Mesh(g, oak); m.castShadow = m.receiveShadow = true; I.add(m); }
  { const g = new RoundedBoxGeometry(IW, TOP - WT, ID, 3, .25); planarUV(g, QUARTZ_CM, .5, .5);   // the middle of the map; the run's top takes its first quarter
    const m = new THREE.Mesh(g, quartz); m.position.set(0, (TOP + WT) / 2, 0); m.castShadow = m.receiveShadow = true; I.add(m); }
  // three counter stools in solid oak with a low curved back (after HAY's About A Stool AAS 38, counter height): a shaped seat 38
  // across at 65 cm (25 below the top), four splayed round legs tapering to the floor, a footrest frame at 24 cm, the back rail 12 to
  // 18 cm above the seat on two posts, away from the island
  const seatG = (() => { const g = new THREE.LatheGeometry([[0, 0], [17.6, 0], [18.8, .5], [19.2, 1.3], [18.9, 2.1], [18, 2.5], [9, 2.2], [0, 2.1]].map(([r, y]) => new THREE.Vector2(r, y)), 64); planarUV(g, OAK, .2, .7); return g; })();
  const rod = (a, b, r0, r1, seg = 16) => { const d = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r1, r0, d.length(), seg); planarUV(g, OAK, (a.x + 50) / 97, (a.z + 50) / 89);
    const m = new THREE.Mesh(g, oak); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = m.receiveShadow = true; return m; };
  const backRail = (() => { const sh = new THREE.Shape(), b0 = -Math.PI / 2 - 1.15, b1 = -Math.PI / 2 + 1.15;
    sh.absarc(0, 0, 19, b0, b1, false); sh.absarc(0, 0, 17.2, b1, b0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 5.5, bevelEnabled: true, bevelThickness: .5, bevelSize: .5, bevelSegments: 3, curveSegments: 48 });
    g.rotateX(-Math.PI / 2); g.computeVertexNormals(); planarUV(g, OAK, .5, .1); return g; })();   // shape -y becomes +z: the arc behind the sitter
  for (const sx of [-60, 0, 60]) {
    const St = new THREE.Group(); St.position.set(sx, 0, ID / 2 + 6); I.add(St);
    const SEAT = 65, seat = new THREE.Mesh(seatG, oak); seat.position.y = SEAT - 2.5; seat.castShadow = seat.receiveShadow = true; St.add(seat);
    const top = [], bot = [];
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { top.push(new THREE.Vector3(lx * 11.5, SEAT - 2.5, lz * 11.5)); bot.push(new THREE.Vector3(lx * 16.5, 0, lz * 16.5)); }
    for (let i = 0; i < 4; i++) St.add(rod(bot[i], top[i], 1.25, 1.65));
    const at = (i, y) => new THREE.Vector3().lerpVectors(bot[i], top[i], y / (SEAT - 2.5));
    for (const [i, j] of [[0, 1], [1, 3], [3, 2], [2, 0]]) St.add(rod(at(i, 24), at(j, 24), .9, .9));
    for (const s2 of [-1, 1]) St.add(rod(new THREE.Vector3(s2 * 12.4, SEAT - .2, 12.4), new THREE.Vector3(s2 * 13.1, SEAT + 12.5, 13.1), 1.1, .95));
    const bk = new THREE.Mesh(backRail, oak); bk.position.y = SEAT + 12; bk.castShadow = true; St.add(bk);
  }

  // ---------- things on the tops (Poly Haven, CC0): two clay vases by the oven, a carved wooden bowl of limes on the island ----------
  const gl = new GLTFLoader();
  const clipIt = g => g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; for (const m of [].concat(o.material)) { m.clippingPlanes = clip.clippingPlanes; m.clipShadows = true; } } });
  const model = async (id, x, y, z, sc = 1, rot = 0, parent = root) => {
    const g = (await gl.loadAsync(`${base}models/${id}/${id}.gltf`)).scene; clipIt(g);
    g.scale.setScalar(100 * sc); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g); return g;
  };
  const decor = [
    model('ceramic_vase_02', 268, TOP, 24, 1, .4), model('ceramic_vase_01', 282, TOP, 15, .85, 1.2),
    model('carved_wooden_plate', 12, TOP, -4, 1, .3, I),
  ];
  { const r = rng(5);
    decor.push(gl.loadAsync(`${base}models/food_lime_01/food_lime_01.gltf`).then(({ scene: l }) => { clipIt(l);
      for (const [px_, pz_, py_] of [[-4, -3, .9], [3, -5, .9], [5, 2, .9], [-2, 4, .9], [0, -.5, 5.6], [-5, 1, 4.8], [3.5, -1.5, 5]]) {
        const c = l.clone(); c.scale.setScalar(100); c.position.set(12 + px_, TOP + py_, -4 + pz_); c.rotation.set(r() * 3, r() * 6, r() * 3); I.add(c); } })); }
  await Promise.all(decor);

  // ---------- three pendants over the island: opal glass globes 22 cm across on black cords, 75 cm over the top, 60 cm apart ----------
  const opal = std({ name: 'opal', color: '#f3f0ea', roughness: .22, emissive: '#ffe2b8', emissiveIntensity: 0 });
  const islandLight = new THREE.PointLight('#ffd9a8', 0, 5, 2); islandLight.position.set(0, TOP + 70, 0); I.add(islandLight);
  const islandLamps = { name: 'island', on: false, meshes: [], set(v) { this.on = v; opal.emissiveIntensity = v ? 2.2 : 0; islandLight.intensity = v ? 3 : 0; } };   // one switch for the three
  for (const px of [-60, 0, 60]) {
    const R = 11, cy = TOP + 75 + R;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), opal); globe.position.set(px, cy, 0); globe.castShadow = true; I.add(globe);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 3, 32), legs); cap.position.set(px, cy + R - .6, 0); I.add(cap); islandLamps.meshes.push(globe, cap);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, CEIL - (cy + R + 1), 8), legs); cord.position.set(px, (CEIL + cy + R + 1) / 2, 0); I.add(cord);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1.5, 32), legs); rose.position.set(px, CEIL - .75, 0); I.add(rose);
  }
  const setLamps = on => islandLamps.set(on);

  // ---------- five black surface spots on the ceiling, over the front of the run ----------
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * (L - 100) / 4, sp = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 11, 32), legs); sp.position.set(x, CEIL - 5.5, 95); root.add(sp);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshBasicMaterial({ name: 'downlight', color: '#fff4e0', ...clip })); lens.rotation.x = Math.PI / 2; lens.position.set(x, CEIL - 11.05, 95); root.add(lens);
  }

  // the run and the island on the floor, for walking (plan cm): polygons
  const P = (u, v) => [K.a[0] + K.d[0] * u + K.n[0] * v, K.a[1] + K.d[1] * u + K.n[1] * v];
  const foot = [[P(0, 0), P(LF, 0), P(LF, D + 2), P(0, D + 2)]];
  const isl = (u, v) => P(K.island.along + u, K.island.off + v);
  const islandFoot = off => { const q = (u, v) => P(K.island.along + u, off + v); return [q(ix0, iz0), q(ix1, iz0), q(ix1, back + 2), q(ix0, back + 2)]; };
  foot.push(islandFoot(K.island.off));
  return { root, foot, island: I, islandFoot, frontOfRun: D + 2, setLamps, lamps: [islandLamps], openers };
}
