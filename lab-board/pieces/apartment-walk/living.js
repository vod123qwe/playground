// The living room on the layout A.04, in plan centimetres (x, and the plan's y as z): a corner sofa with its chaise by the windows, a round
// side table at its front, a floating TV console against the wall of the small room with a 65" TV on the wall above it, a round dining
// table for four by the entrance, a jute rug, cushions, a pendant over the table, a floor plant by the window and a few things on the
// console. Sizes as A.04 draws them: sofa 225 x 85 (chaise 140), side table 50, console 188 x 40, table 100 (the TV larger than A.04's 55").
//
// Textures (Poly Haven, CC0): rough linen (the sofa, the cushions), waffle pique cotton (one cushion), hessian (the rug), curly teddy
// (the dining chairs, as the stools). Models (Poly Haven, CC0): potted plant 02 and 04, ceramic vases 01 and 04, standing picture
// frame 02, modern ceiling lamp 01.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const clamp = (v, a) => Math.max(-a, Math.min(a, v));

// where A.04 puts things (plan cm): the sofa's back-left corner and its long axis, the console's wall edge, the two round tables
export const LIVING = {
  sofa: { o: [401.9, -808.6], u: [.804, -.594] },                  // seats face +v = (.594, .804): towards the TV
  side: [558.0, -769.5],
  console: { o: [754.2, -723.1], u: [-.787, .617], len: 188 },       // from the window end along the wall; +v = into the room
  dining: [293.9, -693.4],
};

export async function buildLiving({ THREE, H, clip, renderer, base = 'assets/' }) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tl = new THREE.TextureLoader();
  const img = f => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = base + f; });
  const setup = (t, srgb) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; };
  const load = (f, srgb) => new Promise(res => tl.load(base + f, t => res(setup(t, srgb))));
  const grey = async f => {                                           // a colour scan made neutral, so a material colour can dye it
    const i = await img(f), c = canvas(i.width, i.height), g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data; let m = 0;
    for (let k = 0; k < a.length; k += 4) m += .2126 * a[k] + .7152 * a[k + 1] + .0722 * a[k + 2];
    m /= a.length / 4;
    for (let k = 0; k < a.length; k += 4) { const l = Math.min(255, (.2126 * a[k] + .7152 * a[k + 1] + .0722 * a[k + 2]) / m * 200); a[k] = a[k + 1] = a[k + 2] = l; }
    g.putImageData(d, 0, 0); return setup(new THREE.CanvasTexture(c), true);
  };
  const tex = (c, srgb) => setup(new THREE.CanvasTexture(c), srgb);
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });

  // ---------- materials ----------
  const [lnC, lnN, lnR, wfC, wfN, wfR, hsC, hsN, hsR, tdC, tdN, tdR, oakC, oakN, oakR] = await Promise.all([
    grey('tex/linen_diff.jpg'), load('tex/linen_nor.jpg'), load('tex/linen_rough.jpg'),
    load('tex/waffle_diff.jpg', true), load('tex/waffle_nor.jpg'), load('tex/waffle_rough.jpg'),
    load('tex/hessian_diff.jpg', true), load('tex/hessian_nor.jpg'), load('tex/hessian_rough.jpg'),
    load('tex/teddy_diff.jpg', true), load('tex/teddy_nor.jpg'), load('tex/teddy_rough.jpg'),
    load('oak_diff.jpg', true), load('oak_nor.jpg'), load('oak_rough.jpg')]);
  const LINEN = 27, WAFFLE = 28, JUTE = 80, TEDDY = 33, OAK = 140;  // what one scan covers, cm (the rug's weave is chunkier than the hessian's)
  const linen = col => std({ map: lnC, normalMap: lnN, normalScale: new THREE.Vector2(.8, .8), roughnessMap: lnR, roughness: 1, color: col });
  const sofaF = linen('#cdbfab');                                    // warm greige linen, a shade deeper than the Oat walls
  const ivory = linen('#ece4d6'), clay = linen('#b98466');
  const waffle = std({ map: wfC, normalMap: wfN, normalScale: new THREE.Vector2(1, 1), roughnessMap: wfR, roughness: 1, color: '#e6d3b6' });   // a soft ochre
  const jute = std({ map: hsC, normalMap: hsN, normalScale: new THREE.Vector2(1.4, 1.4), roughnessMap: hsR, roughness: 1, color: '#e8dcc6' });
  const boucle = std({ map: tdC, normalMap: tdN, normalScale: new THREE.Vector2(1.2, 1.2), roughnessMap: tdR, roughness: 1, color: '#e9dccb' });
  const oak = std({ map: oakC, normalMap: oakN, normalScale: new THREE.Vector2(.35, .35), roughnessMap: oakR, roughness: .9, color: '#e6d3bd' });
  const recess = std({ color: '#2d2621', roughness: .9 });
  const black = std({ color: '#121212', roughness: .45, metalness: .6 });
  const screen = std({ color: '#050607', roughness: .07, metalness: .1 });
  const bezel = std({ color: '#1b1c1f', roughness: .5, metalness: .3 });
  // travertine: warm beige, soft bands and small open pores, honed
  const travertine = (() => {
    const N = 1024, c = canvas(N, N), g = c.getContext('2d'), r = rng(31);
    g.fillStyle = '#dccbb1'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 60; i++) { const y = r() * N, h = 4 + r() * 40; g.fillStyle = `rgba(${r() > .5 ? '236,224,204' : '196,176,146'},${.12 + r() * .18})`; g.fillRect(0, y, N, h); }
    for (let i = 0; i < 1400; i++) { const x = r() * N, y = r() * N, w = 2 + r() * 14, h = .8 + r() * 2.2; g.fillStyle = `rgba(150,124,92,${.25 + r() * .35})`; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill(); }
    return std({ map: tex(c, true), roughness: .5 });
  })();
  const TRAV = 80;
  // fluting as on the island: half-round reeds 2.5 cm, as a normal map
  const fluteTex = (() => {
    const PX = 16, P = 2.5, Nn = 12, Wp = Math.round(P * Nn * PX), n = canvas(Wp, 64), g = n.getContext('2d'), d = g.createImageData(Wp, 64);
    for (let x = 0; x < Wp; x++) { const t = ((x / PX) % P) / P * 2 - 1, nx = t * .85, nz = Math.sqrt(1 - nx * nx); for (let y = 0; y < 64; y++) { const i = (y * Wp + x) * 4; d.data[i] = 128 + nx * 127; d.data[i + 1] = 128; d.data[i + 2] = 128 + nz * 127; d.data[i + 3] = 255; } }
    g.putImageData(d, 0, 0); return tex(n);
  })();
  const flute = oak.clone(); flute.normalMap = fluteTex; fluteTex.repeat.set(OAK / 30, OAK / 30); flute.normalScale = new THREE.Vector2(1, 1);   // the reed map covers 30 cm

  // ---------- geometry helpers ----------
  function planarUV(g, scale, ou = 0, ov = 0) {                     // each vertex takes the plane its normal faces
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y];
      uv.setXY(i, u / scale + ou, v / scale + ov);
    }
  }
  // upholstery: a finely divided box rounded to radius r, its top crowned and its sides bulged a little (parabolas that vanish at the
  // edges), a faint unevenness on top; smooth normals across the faces, the texture laid flat on each face
  function soft(w, h, d, r, { crown = 0, bulge = 0, noise = 0, seed = 1, scale = LINEN, seg = 2.2 } = {}) {
    const g = new THREE.BoxGeometry(w, h, d, Math.max(4, Math.round(w / seg)), Math.max(3, Math.round(h / seg)), Math.max(4, Math.round(d / seg)));
    const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    const hw = w / 2, hh = h / 2, hd = d / 2, R = Math.min(r, hw - .01, hh - .01, hd - .01), q = rng(seed), ph = [q() * 6, q() * 6, q() * 6];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(clamp(v.x, hw - R), clamp(v.y, hh - R), clamp(v.z, hd - R)); n.subVectors(v, c); if (n.lengthSq() > 1e-12) n.normalize();
      v.copy(c).addScaledVector(n, R);
      const fx = Math.max(0, 1 - (v.x / hw) ** 2), fy = Math.max(0, 1 - (v.y / hh) ** 2), fz = Math.max(0, 1 - (v.z / hd) ** 2);
      if (v.y > 0) v.y += crown * fx * fz + (noise ? noise * fx * fz * (Math.sin(v.x * .19 + ph[0]) * Math.sin(v.z * .15 + ph[1]) + .5 * Math.sin((v.x + v.z) * .41 + ph[2])) : 0);
      v.x += Math.sign(v.x) * bulge * fy * fz; v.z += Math.sign(v.z) * bulge * fy * fx;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    // smooth normals: computed on a welded copy, handed back by position
    const w2 = new THREE.BufferGeometry(); w2.setAttribute('position', p.clone()); w2.setIndex(g.index.clone());
    const m = mergeVertices(w2, 1e-3); m.computeVertexNormals();
    const key = (x, y, z) => `${Math.round(x * 500)},${Math.round(y * 500)},${Math.round(z * 500)}`, map = new Map(), mp = m.attributes.position, mn = m.attributes.normal;
    for (let i = 0; i < mp.count; i++) map.set(key(mp.getX(i), mp.getY(i), mp.getZ(i)), i);
    const nn = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const j = map.get(key(p.getX(i), p.getY(i), p.getZ(i))); if (j !== undefined) nn.setXYZ(i, mn.getX(j), mn.getY(j), mn.getZ(j)); }
    const o = q();                                                   // UVs per face (the six groups: +x -x +y -y +z -z), in real scale
    for (const [gi, grp] of g.groups.entries()) for (let k = grp.start; k < grp.start + grp.count; k++) {
      const i = g.index.getX(k), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const [a, b] = gi < 2 ? [z, y] : gi < 4 ? [x, z] : [x, y]; uv.setXY(i, a / scale + o, b / scale + o * .7);
    }
    g.clearGroups(); return g;
  }
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  // a scatter cushion: two quilted halves meeting at a seam; the corners pull in and the middle is plump
  function pillow(w, h, t) {
    const half = s => new ParametricGeometry((u, v, out) => {
      const a = 2 * u - 1, b = 2 * v - 1, waist = 1 - .07 * (1 - b * b), waist2 = 1 - .07 * (1 - a * a);
      const z = t / 2 * Math.pow(Math.max(0, 1 - Math.abs(a) ** 2.6), .55) * Math.pow(Math.max(0, 1 - Math.abs(b) ** 2.6), .55);
      out.set(a * w / 2 * waist, b * h / 2 * waist2, s * z);
    }, 36, 36);
    const f = half(1), bk = half(-1); bk.index.array.reverse();     // the back half faces the other way
    for (const g of [f, bk]) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / LINEN, uv.getY(i) * h / LINEN); }
    const g = mergeGeometries([f, bk]); g.computeVertexNormals(); return g;
  }
  const root = new THREE.Group();
  const frame = (o, u) => { const g = new THREE.Group(); g.position.set(o[0], 0, o[1]); g.rotation.y = Math.atan2(-u[1], u[0]); root.add(g); return g; };

  // ---------- the sofa: 225 x 85, the chaise 83 x 140 at the window end; seat 44, back 82, arms 60, on a recessed plinth ----------
  const SF = frame(LIVING.sofa.o, LIVING.sofa.u);
  {
    const L = 225, D = 85, CD = 140, CX = 143, AW = 18, B = 16, P0 = 6, BASE = 24, SEAT = 44;
    mesh(new RoundedBoxGeometry(L - 8, P0, D - 8, 2, .5), recess, SF, L / 2, P0 / 2, (D - 8) / 2 + 4);
    mesh(new RoundedBoxGeometry(L - CX - 8, P0, CD - D, 2, .5), recess, SF, (CX + L) / 2, P0 / 2, D + (CD - D) / 2 - 4);
    // the upholstered base (main part and chaise), the back frame, the arms
    mesh(soft(L, BASE - P0, D, 2, { bulge: .4, seed: 2 }), sofaF, SF, L / 2, (BASE + P0) / 2, D / 2);
    mesh(soft(L - CX, BASE - P0, CD - D + 2, 2, { bulge: .4, seed: 3 }), sofaF, SF, (CX + L) / 2, (BASE + P0) / 2, D - 1 + (CD - D + 2) / 2);
    mesh(soft(L, 62 - BASE, B, 4, { bulge: .6, seed: 4 }), sofaF, SF, L / 2, (BASE + 62) / 2, B / 2);
    mesh(soft(AW, 60 - P0, D, 6, { crown: .6, bulge: .8, seed: 5 }), sofaF, SF, AW / 2, (60 + P0) / 2, D / 2);
    mesh(soft(AW, 58 - P0, CD, 6, { crown: .6, bulge: .8, seed: 6 }), sofaF, SF, L - AW / 2, (58 + P0) / 2, CD / 2);
    // seat cushions: two on the main part, the long one on the chaise; crowned, a little uneven, each its own
    const seat = (x0, x1, z0, z1, s) => mesh(soft(x1 - x0 - .6, SEAT - BASE, z1 - z0, 6, { crown: 1.6, bulge: 1.2, noise: .35, seed: s }), sofaF, SF, (x0 + x1) / 2, (BASE + SEAT) / 2 + .3, (z0 + z1) / 2);
    seat(AW, 80.5, B, D + .5, 7); seat(80.5, CX, B, D + .5, 8); seat(CX, L - AW, B, CD + .5, 9);
    // back cushions, loose, leaning back a little
    const back = (x0, x1, s) => { const m = mesh(soft(x1 - x0 - 1, 40, 20, 8, { crown: 1, bulge: 2.4, noise: .3, seed: s }), sofaF, SF, (x0 + x1) / 2, SEAT + 19, B + 9); m.rotation.x = -.13; };
    back(AW, 80.5, 10); back(80.5, CX, 11); back(CX, L - AW, 12);
    // scatter cushions: ivory and clay linen, one mustard waffle
    const pl = (w, h, t, m, x, y, z, rx, ry, rz) => { const o = mesh(pillow(w, h, t), m, SF, x, y, z); o.rotation.set(rx, ry, rz); };
    pl(48, 48, 15, ivory, 36, SEAT + 25, B + 28, -.32, .12, .06);
    pl(45, 45, 14, clay, 64, SEAT + 23, B + 31, -.3, -.05, -.08);
    pl(50, 34, 13, waffle, 118, SEAT + 20, B + 32, -.28, .03, .03);
    pl(45, 45, 14, ivory, L - AW - 26, SEAT + 23, B + 30, -.3, -.14, .07);
  }

  // ---------- the side table: travertine, round, 50 across, 45 high: a 3 cm top on a drum ----------
  const ST = new THREE.Group(); ST.position.set(LIVING.side[0], 0, LIVING.side[1]); root.add(ST);
  {
    const top = new THREE.LatheGeometry([[0, 42], [24.6, 42], [25, 42.4], [25, 44.6], [24.6, 45], [0, 45]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
    top.computeVertexNormals(); planarUV(top, TRAV, .2, .5); mesh(top, travertine, ST);
    const drum = new THREE.CylinderGeometry(15, 16, 42, 96, 1, false); drum.translate(0, 21, 0);
    { const uv = drum.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * 15.5 / TRAV, uv.getY(i) * 42 / TRAV); }
    mesh(drum, travertine, ST);
  }

  // ---------- the TV console: floating, oak with fluted doors like the island, 188 x 40 x 40 at 22 cm; a 65" TV on the wall ----------
  const TV = frame(LIVING.console.o, LIVING.console.u);
  {
    const L = LIVING.console.len, D = 40, Y0 = 22, Y1 = 62;
    const box = (x0, x1, y0, y1, z0, z1, m, sc = OAK) => { const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, Math.min(.2, (Math.min(x1 - x0, y1 - y0, z1 - z0)) / 2 - .01)); planarUV(g, sc, .3, .1); return mesh(g, m, TV, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); };
    box(0, L, Y0, Y1 - 2, 0, D - 2, std({ color: '#e9e3da', roughness: .8 }));
    box(0, L, Y1 - 2, Y1, 0, D, oak);                                // the oak top, 2 cm over the doors
    const n = 4, dw = L / n;
    for (let i = 0; i < n; i++) {                                    // four fluted doors, a 3 mm gap between them
      const g = new RoundedBoxGeometry(dw - .3, Y1 - 2 - Y0 - .3, 1.9, 2, .15); planarUV(g, OAK);   // one grain across the four, the reeds straight up
      mesh(g, flute, TV, dw * (i + .5), (Y0 + Y1 - 2) / 2, D - 2 + .95);
    }
    // the TV: 65", 143.9 x 82.4, 2.5 thick, on a flat wall mount 3 cm off the wall, centred over the console, its bottom 13 cm over the top
    const tx = L / 2, ty = Y1 + 13 + 41.2, tz = 3 + 1.25;
    mesh(new RoundedBoxGeometry(143.9, 82.4, 2.5, 2, .4), bezel, TV, tx, ty, tz);
    mesh(new RoundedBoxGeometry(40, 30, 3, 1, .3), black, TV, tx, ty, 1.5).castShadow = false;   // the mount, behind
    mesh(new THREE.PlaneGeometry(142.9, 81.2), screen, TV, tx, ty + .3, tz + 1.26).castShadow = false;
  }

  // ---------- the dining table: 100 across, 75 high, oak; a fluted oak pedestal on a round foot; four boucle tub chairs ----------
  const DT = new THREE.Group(); DT.position.set(LIVING.dining[0], 0, LIVING.dining[1]); root.add(DT);
  {
    const top = new THREE.LatheGeometry([[0, 71.8], [48.8, 71.8], [49.6, 72.3], [50, 73.2], [50, 74.4], [49.6, 74.85], [48.8, 75], [0, 75]].map(([r, y]) => new THREE.Vector2(r, y)), 128);
    top.computeVertexNormals(); planarUV(top, OAK, .1, .3); mesh(top, oak, DT);
    const ped = new THREE.CylinderGeometry(19, 19, 69, 128, 1, true); ped.translate(0, 2 + 34.5, 0);
    const reeds = Math.round(2 * Math.PI * 19 / 2.5);
    { const uv = ped.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * reeds * 2.5 / OAK, uv.getY(i) * 69 / OAK); }   // a whole number of reeds round
    mesh(ped, flute, DT);
    const foot = new THREE.LatheGeometry([[0, 0], [26, 0], [27, .4], [27.4, 1.2], [27, 2], [0, 2]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
    foot.computeVertexNormals(); planarUV(foot, OAK, .6, .2); mesh(foot, oak, DT);
    // the chairs: a square seat, a band of back curving round the sitter, four oak legs; on the diagonals, facing the table
    const seatG = soft(46, 8, 44, 3.5, { crown: 1.2, bulge: .6, noise: .2, seed: 21, scale: TEDDY });
    const backG = (() => { const sh = new THREE.Shape(), R = 25, a0 = -Math.PI / 2 - 1.2, a1 = -Math.PI / 2 + 1.2;
      sh.absarc(0, 0, R, a0, a1, false); sh.absarc(0, 0, R - 5.5, a1, a0, true);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 27, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.8, bevelSegments: 5, curveSegments: 48 });
      g.rotateX(-Math.PI / 2); g.computeVertexNormals(); planarUV(g, TEDDY); return g; })();
    const legG = new THREE.CylinderGeometry(1.5, 1.1, 38, 20);
    { const uv = legG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .06, uv.getY(i) * 38 / OAK); }
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, C = new THREE.Group(); C.position.set(Math.cos(a) * 55, 0, Math.sin(a) * 55); C.rotation.y = -a - Math.PI / 2; DT.add(C);
      // local: +z towards the table, the back at -z
      mesh(seatG, boucle, C, 0, 44.5, 0);                            // the seat at 48-49, 27 under the table top
      const bk = mesh(backG, boucle, C, 0, 46, 3); bk.rotation.y = Math.PI;   // the band round the back, its ends at the sides
      mesh(new RoundedBoxGeometry(40, 2.5, 38, 2, .6), oak, C, 0, 39.25, 0);   // the oak seat frame under the cushion
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(legG, oak, C, lx * 17, 19, lz * 16); l.rotation.set(lz * .05, 0, -lx * .05); }
    }
  }

  // ---------- the rug: jute, 240 x 170, from under the sofa's front towards the TV ----------
  { const g = soft(240, 1.2, 170, .6, { seed: 40, scale: JUTE, seg: 6 }); const m = mesh(g, jute, SF, 120, .6, 152); m.castShadow = false; }

  // ---------- lamps (off by day; the panel lights them) ----------
  const lamps = [];
  const glow = std({ color: '#fff3df', emissive: '#ffd9a0', emissiveIntensity: 0, roughness: .6 });

  // ---------- models (Poly Haven, CC0), placed by their real size ----------
  const gl = new GLTFLoader();
  const clipIt = g => g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; for (const m of [].concat(o.material)) { m.clippingPlanes = clip.clippingPlanes; m.clipShadows = true; } } });
  const model = async (id, parent, x, y, z, rot = 0, opts = {}) => {
    const g = (await gl.loadAsync(`${base}models/${id}/${id}.gltf`)).scene; clipIt(g); g.scale.setScalar(100 * (opts.s || 1)); g.rotation.y = rot;
    const b = new THREE.Box3().setFromObject(g);
    g.position.set(x - (b.min.x + b.max.x) / 2, (opts.top !== undefined ? opts.top - b.max.y : y - b.min.y), z - (b.min.z + b.max.z) / 2);
    g.userData.h = b.max.y - b.min.y; parent.add(g); return g;
  };
  const Lc = LIVING.console.len;
  const decor = [
    model('potted_plant_04', TV, 11, 62, 24, .6),                   // an aloe in a white pot, at the window end of the console
    model('ceramic_vase_04', TV, Lc - 28, 62, 25, 2.1),             // a white jug and a framed print at the other end
    model('standing_picture_frame_02', TV, Lc - 10, 62, 29, -.25),     // (its face to the room)
    model('ceramic_vase_01', ST, 6, 45, -4, 1.9, { s: .8 }),          // a small clay vase on the side table
    model('potted_plant_02', root, 700, 0, -796, 1.3),               // a leafy plant in terracotta by the window, beside the chaise
  ];
  // the pendant over the table: the dome 93 cm over the table (its bottom at 168), the rod up to the ceiling
  decor.push(model('modern_ceiling_lamp_01', DT, 0, 0, 0, 0, { top: H }).then(g => {
    const y = 168; g.position.y += y - (H - g.userData.h);           // the model hangs 95 cm: raised, its rod runs on into the ceiling
    const bulb = mesh(new THREE.SphereGeometry(4, 24, 16), glow, DT, 0, y + 4, 0); bulb.castShadow = false;
    const light = new THREE.PointLight('#ffd4a0', 0, 5, 2); light.position.set(0, y - 2, 0); DT.add(light);
    lamps.push({ light, mats: [glow], power: 3 });
  }));
  await Promise.all(decor);

  // lamps on or off; the light is in candela per the renderer's metres, the group being in cm
  const setLamps = on => { for (const l of lamps) { l.light.intensity = on ? l.power : 0; for (const m of l.mats) m.emissiveIntensity = on ? (m === glow ? 6 : .5) : 0; } };
  setLamps(false);

  // ---------- on the floor, for walking (plan cm): polygons ----------
  const inF = (F, x, z) => [F.o[0] + F.u[0] * x - F.u[1] * z, F.o[1] + F.u[1] * x + F.u[0] * z];   // a frame's local +z is (-u.y, u.x)
  const SFd = { o: LIVING.sofa.o, u: LIVING.sofa.u }, TVd = { o: LIVING.console.o, u: LIVING.console.u };
  const circle = (c, r, n = 16) => Array.from({ length: n }, (_, i) => [c[0] + Math.cos(i / n * Math.PI * 2) * r, c[1] + Math.sin(i / n * Math.PI * 2) * r]);
  const foot = [
    [[0, 0], [225, 0], [225, 140], [143, 140], [143, 85], [0, 85]].map(([x, z]) => inF(SFd, x, z)),
    [[0, 0], [LIVING.console.len, 0], [LIVING.console.len, 40], [0, 40]].map(([x, z]) => inF(TVd, x, z)),
    circle(LIVING.side, 27), circle(LIVING.dining, 80), circle([700, -796], 30, 12),
  ];
  return { root, foot, setLamps };
}
