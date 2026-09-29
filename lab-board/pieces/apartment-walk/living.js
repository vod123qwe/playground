// The living room on the layout A.04, in plan centimetres (x, and the plan's y as z): a corner sofa with its chaise by the windows, a round
// side table at its front, a floating TV console against the wall of the small room with a 65" TV on the wall above it, a round dining
// table for four by the entrance, a jute rug, cushions, a pendant over the table, a floor plant by the window and a few things on the
// console. Sizes as A.04 draws them: sofa 225 x 85 (chaise 140), side table 50, console 188 x 40, table 100 (the TV larger than A.04's 55").
//
// The sofa comes in two: Kave Home Gala 4-seater with the right chaise (300 x 105, the chaise 193 deep, seat 42, back 87, arms 15 x 62,
// in a fine beige chenille; the chenille is drawn here, procedurally) and the one A.04 draws (225 x 85, chaise 140).
// Curtains along the facade, as A.04 draws them: sheers and linen drapes on two tracks hidden by a ceiling pelmet.
//
// Textures (Poly Haven, CC0): rough linen (the sofa, the cushions), waffle pique cotton (one cushion), hessian (the rug), curly teddy
// (the dining chairs, as the stools). Models (Poly Haven, CC0): potted plant 02 and 04, ceramic vases 01 and 04, standing picture
// frame 02, modern ceiling lamp 01.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ivy } from './ivy.js?v=1';
import { createTVGame } from './tvgame.js?v=7';

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const clamp = (v, a) => Math.max(-a, Math.min(a, v));

// where A.04 puts things (plan cm): the sofa's back-left corner and its long axis, the console's wall edge, the two round tables
export const LIVING = {
  sofa: { o: [401.9, -808.6], u: [.804, -.594] },                  // seats face +v = (.594, .804): towards the TV
  side: [558.0, -769.5],
  console: { o: [754.2, -723.1], u: [-.787, .617], len: 188 },       // from the window end along the wall; +v = into the room
  dining: [278.9, -693.4],                                          // (15 cm towards the entrance wardrobe and the pantry's hidden door, off A.04)
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
  const linen = col => std({ name: 'linen', normalMap: lnN, normalScale: new THREE.Vector2(.8, .8), roughnessMap: lnR, roughness: 1, color: col });
  const sofaF = linen('#cdbfab');                                    // warm greige linen, a shade deeper than the Oat walls
  const ivory = linen('#ece4d6'), clay = linen('#b98466');
  const waffle = std({ name: 'waffle', map: wfC, normalMap: wfN, normalScale: new THREE.Vector2(1, 1), roughnessMap: wfR, roughness: 1, color: '#e6d3b6' });   // a soft ochre
  const jute = std({ name: 'jute', map: hsC, normalMap: hsN, normalScale: new THREE.Vector2(1.4, 1.4), roughnessMap: hsR, roughness: 1, color: '#e8dcc6' });
  const boucle = std({ name: 'boucle', map: tdC, normalMap: tdN, normalScale: new THREE.Vector2(1.2, 1.2), roughnessMap: tdR, roughness: 1, color: '#e9dccb' });
  const oak = std({ name: 'oak', map: oakC, normalMap: oakN, normalScale: new THREE.Vector2(.35, .35), roughnessMap: oakR, roughness: .9, color: '#e6d3bd' });
  const recess = std({ name: 'recess', color: '#2d2621', roughness: .9 });
  const black = std({ name: 'black', color: '#121212', roughness: .45, metalness: .6 });
  const game = createTVGame({ THREE });                               // what the TV shows when it is on: its home screen and a game
  const screen = std({ name: 'screen', color: '#050607', roughness: .07, metalness: .1, emissive: '#ffffff', emissiveMap: game.texture, emissiveIntensity: 0 });
  const bezel = std({ name: 'bezel', color: '#1b1c1f', roughness: .5, metalness: .3 });
  // travertine: warm beige, soft bands and small open pores, honed
  const travertine = (() => {
    const N = 1024, c = canvas(N, N), g = c.getContext('2d'), r = rng(31);
    g.fillStyle = '#dccbb1'; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 60; i++) { const y = r() * N, h = 4 + r() * 40; g.fillStyle = `rgba(${r() > .5 ? '236,224,204' : '196,176,146'},${.12 + r() * .18})`; g.fillRect(0, y, N, h); }
    for (let i = 0; i < 1400; i++) { const x = r() * N, y = r() * N, w = 2 + r() * 14, h = .8 + r() * 2.2; g.fillStyle = `rgba(150,124,92,${.25 + r() * .35})`; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill(); }
    return std({ name: 'travertine', map: tex(c, true), roughness: .5 });
  })();
  const TRAV = 80;
  // chenille, fine structure (Gala, "Sunel" beige): rows of soft round chenille yarn 1.6 mm apart, slubby, a plain weave under them, fibre
  // fuzz and a heathered tone; a velvety sheen. 1024 px cover 12 cm, the noise wraps so it tiles
  const CHEN = 12;
  const chenille = (() => {
    const N = 1024, rows = 75, cols = 100, r = rng(88);
    const grid = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return (x, y) => {   // wrapping value noise
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), m = k => ((k % n) + n) % n;
      const g = (i, j) => a[m(j) * n + m(i)]; return (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) + (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy; }; };
    const slub = grid(32), fuzz = grid(256), heather = grid(128), tone = grid(16);
    const h = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      const ry = y / N * rows, row = Math.floor(ry), t = (ry - row) * 2 - 1;
      for (let x = 0; x < N; x++) {
        const u = x / N, th = .78 + .22 * slub(u * 32, row * 1.7);                       // each row a little thicker or thinner along its length
        const tube = Math.sqrt(Math.max(0, 1 - (t / th) ** 2));
        const cx = u * cols, warp = ((Math.floor(cx) + row) & 1) ? Math.exp(-((((cx % 1) - .5) / .18) ** 2)) * .28 : 0;   // the warp over every other yarn
        h[y * N + x] = tube * (1 - warp) + .22 * (fuzz(u * 256, y / N * 256) - .5);
      }
    }
    const col = canvas(N, N), nor = canvas(N, N), rou = canvas(N, N);
    const dc = col.getContext('2d').createImageData(N, N), dn = nor.getContext('2d').createImageData(N, N), dr = rou.getContext('2d').createImageData(N, N);
    const H = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4, v = H(x, y), gx = (H(x + 1, y) - H(x - 1, y)) * 2.2, gy = (H(x, y + 1) - H(x, y - 1)) * 2.2, l = Math.hypot(gx, gy, 1);
      dn.data[i] = 128 - gx / l * 127; dn.data[i + 1] = 128 + gy / l * 127; dn.data[i + 2] = 128 + 127 / l; dn.data[i + 3] = 255;
      const k = Math.min(255, 255 * (.8 + .16 * v + .07 * (heather(x / 8, y / 8) - .5) + .05 * (tone(x / 64, y / 64) - .5)));
      dc.data[i] = k; dc.data[i + 1] = k * .995; dc.data[i + 2] = k * .985; dc.data[i + 3] = 255;
      const ro = 255 * (.78 + .22 * (1 - Math.max(0, v))); dr.data[i] = dr.data[i + 1] = dr.data[i + 2] = ro; dr.data[i + 3] = 255;
    }
    col.getContext('2d').putImageData(dc, 0, 0); nor.getContext('2d').putImageData(dn, 0, 0); rou.getContext('2d').putImageData(dr, 0, 0);
    return new THREE.MeshPhysicalMaterial({ name: 'chenille', map: tex(col, true), normalMap: tex(nor), normalScale: new THREE.Vector2(.9, .9), roughnessMap: tex(rou), roughness: 1, color: '#c9bba7',
      sheen: .8, sheenRoughness: .45, sheenColor: new THREE.Color('#dcd0bf'), ...clip });   // Sunel beige: a warm light beige
  })();
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
  function pillow(w, h, t, scale = LINEN) {
    const half = s => new ParametricGeometry((u, v, out) => {
      const a = 2 * u - 1, b = 2 * v - 1, waist = 1 - .07 * (1 - b * b), waist2 = 1 - .07 * (1 - a * a);
      const z = t / 2 * Math.pow(Math.max(0, 1 - Math.abs(a) ** 2.6), .55) * Math.pow(Math.max(0, 1 - Math.abs(b) ** 2.6), .55);
      out.set(a * w / 2 * waist, b * h / 2 * waist2, s * z);
    }, 36, 36);
    const f = half(1), bk = half(-1); bk.index.array.reverse();     // the back half faces the other way
    for (const g of [f, bk]) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / scale, uv.getY(i) * h / scale); }
    const g = mergeGeometries([f, bk]); g.computeVertexNormals(); return g;
  }
  const root = new THREE.Group();
  const frame = (o, u) => { const g = new THREE.Group(); g.position.set(o[0], 0, o[1]); g.rotation.y = Math.atan2(-u[1], u[0]); root.add(g); return g; };

  // ---------- the sofa: 225 x 85, the chaise 83 x 140 at the window end; seat 44, back 82, arms 60, on a recessed plinth ----------
  const SF = frame(LIVING.sofa.o, LIVING.sofa.u), seats = [];        // (seats: anchors at the places to sit, their +z the way the sitter faces)
  const SA = new THREE.Group(); SF.add(SA);                         // the A.04 one
  const pl = (P, w, h, t, m, x, y, z, rx, ry, rz, sc) => { const o = mesh(pillow(w, h, t, sc), m, P, x, y, z); o.rotation.set(rx, ry, rz); };
  {
    const L = 225, D = 85, CD = 140, CX = 143, AW = 18, B = 16, P0 = 6, BASE = 24, SEAT = 44;
    mesh(new RoundedBoxGeometry(L - 8, P0, D - 8, 2, .5), recess, SA, L / 2, P0 / 2, (D - 8) / 2 + 4);
    mesh(new RoundedBoxGeometry(L - CX - 8, P0, CD - D, 2, .5), recess, SA, (CX + L) / 2, P0 / 2, D + (CD - D) / 2 - 4);
    // the upholstered base (main part and chaise), the back frame, the arms
    mesh(soft(L, BASE - P0, D, 2, { bulge: .4, seed: 2 }), sofaF, SA, L / 2, (BASE + P0) / 2, D / 2);
    mesh(soft(L - CX, BASE - P0, CD - D + 2, 2, { bulge: .4, seed: 3 }), sofaF, SA, (CX + L) / 2, (BASE + P0) / 2, D - 1 + (CD - D + 2) / 2);
    mesh(soft(L, 62 - BASE, B, 4, { bulge: .6, seed: 4 }), sofaF, SA, L / 2, (BASE + 62) / 2, B / 2);
    mesh(soft(AW, 60 - P0, D, 6, { crown: .6, bulge: .8, seed: 5 }), sofaF, SA, AW / 2, (60 + P0) / 2, D / 2);
    mesh(soft(AW, 58 - P0, CD, 6, { crown: .6, bulge: .8, seed: 6 }), sofaF, SA, L - AW / 2, (58 + P0) / 2, CD / 2);
    // seat cushions: two on the main part, the long one on the chaise; crowned, a little uneven, each its own
    const seat = (x0, x1, z0, z1, s) => mesh(soft(x1 - x0 - .6, SEAT - BASE, z1 - z0, 6, { crown: 1.6, bulge: 1.2, noise: .35, seed: s }), sofaF, SA, (x0 + x1) / 2, (BASE + SEAT) / 2 + .3, (z0 + z1) / 2);
    seat(AW, 80.5, B, D + .5, 7); seat(80.5, CX, B, D + .5, 8); seat(CX, L - AW, B, CD + .5, 9);
    // back cushions, loose, leaning back a little
    const back = (x0, x1, s) => { const m = mesh(soft(x1 - x0 - 1, 40, 20, 8, { crown: 1, bulge: 2.4, noise: .3, seed: s }), sofaF, SA, (x0 + x1) / 2, SEAT + 19, B + 9); m.rotation.x = -.13; };
    back(AW, 80.5, 10); back(80.5, CX, 11); back(CX, L - AW, 12);
    // scatter cushions: ivory and clay linen, one mustard waffle
    pl(SA, 48, 48, 15, ivory, 36, SEAT + 25, B + 28, -.32, .12, .06);
    pl(SA, 45, 45, 14, clay, 64, SEAT + 23, B + 31, -.3, -.05, -.08);
    pl(SA, 50, 34, 13, waffle, 118, SEAT + 20, B + 32, -.28, .03, .03);
    pl(SA, 45, 45, 14, ivory, L - AW - 26, SEAT + 23, B + 30, -.3, -.14, .07);
  }

  // ---------- Kave Home Gala, in the chenille: seat 42 (70 deep, 90 wide per seat), back 87, arms 15 x 62, 105 deep; a slim dark plinth on
  // 6 cm feet, rounded soft forms, loose back cushions and the extra cushion. Two here: the 3-seater, 210 x 105 (two 90 cm seats), where
  // A.04 has the sofa, its right arm 60 cm off the window wall; and the 4-seater with the right chaise (105 x 193), 300 wide, the chaise at
  // the window end as A.04 has it (right as seen from the front), growing 75 cm towards the table ----------
  function gala(X0, X1, chaise) {
    const G = new THREE.Group(); SF.add(G);
    const D = 105, CX = X1 - 105, CD = 193, AW = 15, B = 14, P0 = 6, BASE = 24, SEAT = 42, F = chenille;
    const add = (g, x, y, z) => mesh(g, F, G, x, y, z), o = { scale: CHEN };
    mesh(new RoundedBoxGeometry(X1 - X0 - 8, P0, D - 8, 2, .5), recess, G, (X0 + X1) / 2, P0 / 2, D / 2);
    add(soft(X1 - X0, BASE - P0, D, 3, { ...o, bulge: .5, seed: 52 }), (X0 + X1) / 2, (BASE + P0) / 2, D / 2);
    add(soft(X1 - X0, 56 - BASE, B, 5, { ...o, bulge: .6, seed: 54 }), (X0 + X1) / 2, (BASE + 56) / 2, B / 2);                // the low back frame
    add(soft(AW, 62 - P0, D, 7, { ...o, crown: .5, bulge: .8, seed: 55 }), X0 + AW / 2, (62 + P0) / 2, D / 2);                 // straight arms, rounded over
    add(soft(AW, 62 - P0, chaise ? CD : D, 7, { ...o, crown: .5, bulge: .8, seed: 56 }), X1 - AW / 2, (62 + P0) / 2, (chaise ? CD : D) / 2);
    const seat = (x0, x1, z1, sd) => add(soft(x1 - x0 - .6, SEAT - BASE, z1 - B, 8, { ...o, crown: 2, bulge: 1.6, noise: .4, seed: sd }), (x0 + x1) / 2, (BASE + SEAT) / 2, (B + z1) / 2);
    const back = (x0, x1, sd) => { const m = add(soft(x1 - x0 - 1, 46, 24, 10, { ...o, crown: 1.2, bulge: 3, noise: .35, seed: sd }), (x0 + x1) / 2, SEAT + 22, B + 12); m.rotation.x = -.12; };
    if (chaise) {
      mesh(new RoundedBoxGeometry(X1 - CX - 8, P0, CD - D, 2, .5), recess, G, (CX + X1) / 2, P0 / 2, D + (CD - D) / 2 - 4);
      add(soft(X1 - CX, BASE - P0, CD - D + 3, 3, { ...o, bulge: .5, seed: 53 }), (CX + X1) / 2, (BASE + P0) / 2, D - 1.5 + (CD - D + 3) / 2);
      seat(X0 + AW, X0 + AW + 90, D + 1, 57); seat(X0 + AW + 90, CX, D + 1, 58); seat(CX, X1 - AW, CD + 1, 59);
      back(X0 + AW, X0 + AW + 90, 60); back(X0 + AW + 90, CX, 61); back(CX, X1 - AW, 62);
    } else {
      seat(X0 + AW, X0 + AW + 90, D + 1, 57); seat(X0 + AW + 90, X1 - AW, D + 1, 58);
      back(X0 + AW, X0 + AW + 90, 60); back(X0 + AW + 90, X1 - AW, 61);
    }
    pl(G, 50, 50, 15, F, X0 + AW + 18, SEAT + 25, 44, -.3, .28, .05, CHEN);   // Gala's extra cushion
    pl(G, 45, 45, 14, clay, X0 + AW + 52, SEAT + 23, 46, -.3, -.05, -.07);
    pl(G, 50, 34, 13, waffle, chaise ? 78 : (X0 + X1) / 2 + 20, SEAT + 19, 47, -.28, .03, .03);
    pl(G, 45, 45, 14, ivory, X1 - AW - 24, SEAT + 23, 45, -.3, -.2, .06);
    return G;
  }
  const SG = gala(-75, 225, true), SG3 = gala(0, 210, false);

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
  const TV = frame(LIVING.console.o, LIVING.console.u); let tv = null;
  {
    const L = LIVING.console.len, D = 40, Y0 = 22, Y1 = 62;
    const box = (x0, x1, y0, y1, z0, z1, m, sc = OAK) => { const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, Math.min(.2, (Math.min(x1 - x0, y1 - y0, z1 - z0)) / 2 - .01)); planarUV(g, sc, .3, .1); return mesh(g, m, TV, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); };
    box(0, L, Y0, Y1 - 2, 0, D - 2, std({ name: 'consoleCarcass', color: '#e9e3da', roughness: .8 }));
    box(0, L, Y1 - 2, Y1, 0, D, oak);                                // the oak top, 2 cm over the doors
    const n = 4, dw = L / n;
    for (let i = 0; i < n; i++) {                                    // four fluted doors, a 3 mm gap between them
      const g = new RoundedBoxGeometry(dw - .3, Y1 - 2 - Y0 - .3, 1.9, 2, .15); planarUV(g, OAK);   // one grain across the four, the reeds straight up
      mesh(g, flute, TV, dw * (i + .5), (Y0 + Y1 - 2) / 2, D - 2 + .95);
    }
    // the TV: 65", 143.9 x 82.4, 2.5 thick, on a flat wall mount 3 cm off the wall, centred over the console, its bottom 25 cm over the top
    const tx = L / 2, ty = Y1 + 25 + 41.2, tz = 3 + 1.25;
    mesh(new RoundedBoxGeometry(143.9, 82.4, 2.5, 2, .4), bezel, TV, tx, ty, tz);
    mesh(new RoundedBoxGeometry(40, 30, 3, 1, .3), black, TV, tx, ty, 1.5).castShadow = false;   // the mount, behind
    const scr = mesh(new THREE.PlaneGeometry(142.9, 81.2), screen, TV, tx, ty + .3, tz + 1.26); scr.castShadow = false;
    // on: a click on it; it throws its light into the room (a light ahead of the screen, coloured as the picture is, a few times a second)
    const tvLight = new THREE.PointLight('#9ab4ff', 0, 4.5, 2); tvLight.position.set(tx, ty, tz + 60); TV.add(tvLight);
    const aim = new THREE.Object3D(); aim.position.set(tx, ty + .3, tz + 1.3); TV.add(aim);   // the screen's centre, for looking at it
    tv = { name: 'TV', on: false, light: tvLight, meshes: [scr], game, aim, size: [142.9, 81.2],
      set(v) { this.on = v; screen.emissiveIntensity = v ? 1.35 : 0; screen.color.set(v ? '#000000' : '#050607'); screen.envMapIntensity = v ? .3 : 1; screen.roughness = v ? .5 : .07; tvLight.intensity = 0; if (v) game.home(); } };   // (on: the room's reflection fainter over the picture)
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
      { const an = new THREE.Object3D(); an.position.set(0, 49, 0); C.add(an); seats.push({ name: 'chair', anchors: [an], get meshes() { const m = []; C.traverse(o => { if (o.isMesh) m.push(o); }); return m; } }); }
      mesh(seatG, boucle, C, 0, 44.5, 0);                            // the seat at 48-49, 27 under the table top
      const bk = mesh(backG, boucle, C, 0, 46, 3); bk.rotation.y = Math.PI;   // the band round the back, its ends at the sides
      mesh(new RoundedBoxGeometry(40, 2.5, 38, 2, .6), oak, C, 0, 39.25, 0);   // the oak seat frame under the cushion
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(legG, oak, C, lx * 17, 19, lz * 16); l.rotation.set(lz * .05, 0, -lx * .05); }
    }
  }

  // the sofa's three places, facing the TV (+z of its frame); any part of it takes the click, and you sit at the place nearest to it
  { const an = [45, 105, 165].map(x => { const o = new THREE.Object3D(); o.position.set(x, 43, 56); SF.add(o); return o; });
    seats.push({ name: 'sofa', anchors: an, get meshes() { const m = []; SF.traverse(o => { if (o.isMesh && o !== rugMesh() && o.visible !== false) m.push(o); }); return m; } }); }
  // ---------- the rug: jute, 240 x 170, from under the sofa's front towards the TV ----------
  const rug = (() => { const g = soft(240, 1.2, 170, .6, { seed: 40, scale: JUTE, seg: 6 }); const m = mesh(g, jute, SF, 120, .6, 152); m.castShadow = false; return m; })();
  function rugMesh() { return rug; }

  // ---------- curtains along the facade (A.04 draws them): sheers on the back track, linen drapes on the front one, both hidden under a
  // pelmet 21 cm deep and 12 cm down from the ceiling. Wave folds; open = everything stacked at the kitchen end, on the pier between the
  // balcony doors and at the far end; sheers = the sheers drawn across; closed = the drapes drawn too ----------
  const FAC = { o: [405.9, -1243.8], e: [.6127, .7903], len: 622.9, from: 64 };   // the facade's inside face from the kitchen corner (+z into the room)
  const FC = frame(FAC.o, FAC.e), CUR = new THREE.Group(); FC.add(CUR);
  // (the track, the pelmet and the curtains themselves now come from rooms.js, as in the other rooms: animated, gathered on the pier)
  const sheerM = std({ name: 'sheerM', color: '#fbf9f4', roughness: 1, normalMap: lnN, normalScale: new THREE.Vector2(.5, .5), transparent: true, opacity: .52, side: THREE.DoubleSide, depthWrite: false });
  const drapeM = std({ name: 'drapeM', normalMap: lnN, normalScale: new THREE.Vector2(1, 1), roughnessMap: lnR, roughness: 1, color: '#cbbba4', side: THREE.DoubleSide });
  // a panel of fabric fw wide hung between s0 and s1: n wave folds, as deep as the fabric allows, flaring a little towards the hem
  const curtain = (s0, s1, fw, z, top, n, m, { scale = LINEN, seed = 1, shadow = true } = {}) => {
    const W = s1 - s0, f = Math.max(1.02, fw / W), A = (W / n) * Math.sqrt(f * f - 1) / 4, q = rng(seed);
    const g = new THREE.PlaneGeometry(1, 1, n * 8, 28), p = g.attributes.position, uv = g.attributes.uv;
    const amp = Array.from({ length: n + 2 }, () => .65 + q() * .7), ph = q() * 6, ph2 = q() * 6;   // each fold its own depth
    for (let i = 0; i < p.count; i++) {
      const t = uv.getX(i), v = uv.getY(i), y = 1.5 + v * (top - 1.5), k0 = t * n;
      const k = k0 + (k0 > 0 && k0 < n ? .18 * Math.sin(k0 * 1.37 + ph2) * (.4 + .6 * (1 - v)) : 0), j = Math.max(0, Math.min(n, Math.floor(k))), fr = k - j;   // uneven folds, more so towards the hem
      const w = A * (amp[j] * (1 - fr) + amp[j + 1] * fr) * (1 + .18 * (1 - v) ** 2) * Math.sin(k * Math.PI * 2) + (1 - v) * 1.6 * Math.sin(t * 7 + ph) + (1 - v) ** 3 * .8 * Math.sin(k0 * 2.1 + ph2);
      p.setXYZ(i, s0 + t * W, y, z + w); uv.setXY(i, t * fw / scale, y / scale);
    }
    g.computeVertexNormals(); const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o;
  };
  const TOP = H - 13, S0 = FAC.from, S1 = FAC.len - 1;
  // drawn across, the fabric hangs in panels split where the balcony door leaves are; a leaf that opens pushes its panel to the hinge and
  // tucks it behind itself (between the open leaf and the pier or the fixed pane), a little ahead of the leaf so the two never meet.
  // leaves: [{ h: the hinge along the facade, s: +1 when the leaf runs to larger values from it, W: its width, f: how open, 0..1 }]
  function drawn(z, fullness, per, m, opts, leaves) {
    const ls = leaves.map(l => ({ ...l, a: l.s > 0 ? l.h : l.h - l.W, b: l.s > 0 ? l.h + l.W : l.h }));
    const xs = [...new Set([S0, S1, ...ls.flatMap(l => [l.a, l.b])].map(v => Math.round(v * 10) / 10))].filter(v => v >= S0 && v <= S1).sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      let a = xs[i], b = xs[i + 1]; if (b - a < 2) continue;
      const fw = (b - a) * fullness, l = ls.find(k => Math.abs(k.a - a) < .2 && Math.abs(k.b - b) < .2);
      let zz = z;
      if (l && l.f > .001) {
        const g = THREE.MathUtils.smoothstep(l.f, 0, .4);             // the fabric clears the leaf's path early
        const [oa, ob] = l.s > 0 ? [l.h - 16, l.h - 2] : [l.h + 2, l.h + 16];
        a = THREE.MathUtils.lerp(a, oa, g); b = THREE.MathUtils.lerp(b, ob, g); zz = z - 3 * g;
      }
      CUR.add(curtain(a, b, fw, zz, TOP, Math.max(2, Math.round(fw / per)), m, { ...opts, seed: (xs[i] * 7) | 0 }));
    }
  }
  function setCurtains(state, leaves = []) {
    for (const c of [...CUR.children]) { CUR.remove(c); c.geometry.dispose(); }
    if (state === 'open') for (const [a, b] of [[S0, S0 + 34], [347, 431], [S1 - 32, S1]]) CUR.add(curtain(a, b, (b - a) * 7, 6, TOP, Math.round((b - a) * 7 / 20), sheerM, { scale: 10, seed: a | 0, shadow: false }));
    else drawn(6, 2, 20, sheerM, { scale: 10, shadow: false }, leaves);
    if (state === 'closed') drawn(13, 2, 24, drapeM, {}, leaves);
    else for (const [a, b] of [[S0, S0 + 44], [345, 389], [389, 433], [S1 - 42, S1]]) CUR.add(curtain(a, b, 150, 13, TOP, Math.round(150 / 24), drapeM, { seed: (a * 7) | 0 }));
  }
  const setCurtainsOld = setCurtains; void setCurtainsOld;

  // ---------- lamps (off by day; the panel lights them) ----------
  const lamps = [];
  const glow = std({ name: 'glow', color: '#fff3df', emissive: '#ffd9a0', emissiveIntensity: 0, roughness: .6 });

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
  ];
  // the pendant over the table: the dome 93 cm over the table (its bottom at 168), the rod up to the ceiling
  decor.push(model('modern_ceiling_lamp_01', DT, 0, 0, 0, 0, { top: H }).then(g => {
    const y = 168; g.position.y += y - (H - g.userData.h);           // the model hangs 95 cm: raised, its rod runs on into the ceiling
    const bulb = mesh(new THREE.SphereGeometry(4, 24, 16), glow, DT, 0, y + 4, 0); bulb.castShadow = false;
    const light = new THREE.PointLight('#ffd4a0', 0, 5, 2); light.position.set(0, y - 2, 0); DT.add(light);
    light.shadow.mapSize.set(512, 512); light.shadow.camera.near = .03; light.shadow.bias = -.004; light.shadow.normalBias = .02;   // its shadow: the walk lends one of its shadow slots to the nearest lamps that are on
    const meshes = [bulb]; g.traverse(o => { if (o.isMesh) meshes.push(o); });
    lamps.push({ name: 'dining', on: false, light, meshes, set(v) { this.on = v; light.intensity = v ? 3 : 0; glow.emissiveIntensity = v ? 6 : 0; } });   // click it, or Lamps on
  }));
  await Promise.all(decor);
  // on the console, beside the aloe: an IKEA VARMBLIXT (the "donut"), orange glass, about 30 across and 11 high, lit from inside
  { const G = new THREE.Group(); G.position.set(52, 62, 20); TV.add(G);
    const glow = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);   // along the profile (from the base up): the base, the rim, the top, the dimple
      gr.addColorStop(0, '#f25200'); gr.addColorStop(.45, '#ff7408'); gr.addColorStop(.7, '#ff9420'); gr.addColorStop(.88, '#ffb040'); gr.addColorStop(1, '#ffc25a'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();   // brightest low down, where the light shines through
    const glass = new THREE.MeshPhysicalMaterial({ name: 'donutGlass', color: '#e8780f', roughness: .16, clearcoat: 1, clearcoatRoughness: .08, emissive: '#ffffff', emissiveMap: glow, emissiveIntensity: 0, ...clip });
    const prof = [[.01, 7.5], [1.5, 7.5], [3, 7.7], [4.6, 8.3], [6, 9.4], [7.4, 10.4], [8.6, 10.9], [9.8, 11], [11.2, 10.7], [12.5, 10.1], [13.6, 9.1], [14.4, 7.9], [15, 6.3], [15.1, 4.8], [14.8, 3.2], [14.1, 2], [13, 1.2], [11.5, .8], [11.2, 0], [.01, 0]];
    const g = new THREE.LatheGeometry(prof.reverse().map(([r, y]) => new THREE.Vector2(r, y)), 128);   // its own normals, from the profile (walked from the base up, so they face out)
    const d = new THREE.Mesh(g, glass); d.castShadow = true; d.receiveShadow = false; G.add(d);   // (glass: no shadow on itself, it streaked the dimple)
    const light = new THREE.PointLight('#ffa640', 0, 2.2, 2); light.position.set(0, 1, 17); G.add(light);   // under its rim, towards the room: a warm pool on the top
    light.shadow.mapSize.set(512, 512); light.shadow.camera.near = .03; light.shadow.bias = -.004; light.shadow.normalBias = .02;   // its shadow: the walk lends one of its shadow slots to the nearest lamps that are on
    lamps.push({ name: 'donut', on: false, light, meshes: [d], set(v) { this.on = !!v; glass.emissiveIntensity = v ? .6 : 0; light.intensity = v ? .3 : 0; } });
  }

  // ---------- ivy on the wall behind the table (z = -610, the room at -z): a small oak shelf at 1.86 m, a white pot, a dozen trailing
  // strands, 40 to 110 cm, hanging close to the wall and drifting a little sideways; lobed leaves every few cm, smaller towards the tips ----------
  {
    const WZ = -610, CX = 205;   // between the hidden pantry door (to 180) and the radiator (from 231), its strands kept to that gap
    const shelfY = 186;
    mesh(new RoundedBoxGeometry(44, 2.4, 18, 2, .3), oak, root, CX, shelfY + 1.2, WZ - 9);
    ivy({ THREE, root, std, WZ, CX, y: shelfY + 2.4, seed: 907 });
  }

  // lamps on or off; the light is in candela per the renderer's metres, the group being in cm
  const setLamps = on => { for (const l of lamps) l.set(on); };
  setLamps(false);

  // ---------- on the floor, for walking (plan cm): polygons ----------
  const inF = (F, x, z) => [F.o[0] + F.u[0] * x - F.u[1] * z, F.o[1] + F.u[1] * x + F.u[0] * z];   // a frame's local +z is (-u.y, u.x)
  const SFd = { o: LIVING.sofa.o, u: LIVING.sofa.u }, TVd = { o: LIVING.console.o, u: LIVING.console.u };
  const circle = (c, r, n = 16) => Array.from({ length: n }, (_, i) => [c[0] + Math.cos(i / n * Math.PI * 2) * r, c[1] + Math.sin(i / n * Math.PI * 2) * r]);
  const SOFA = {                                                     // the outline, where the side table and the rug go
    a04: { out: [[0, 0], [225, 0], [225, 140], [143, 140], [143, 85], [0, 85]], side: LIVING.side, rug: [120, 152] },
    gala: { out: [[-75, 0], [225, 0], [225, 193], [120, 193], [120, 105], [-75, 105]], side: inF(SFd, 70, 150), rug: [75, 160] },
    gala3: { out: [[0, 0], [210, 0], [210, 105], [0, 105]], side: inF(SFd, 105, 152), rug: [105, 165] },
  };
  const fixed = [
    [[0, 0], [LIVING.console.len, 0], [LIVING.console.len, 40], [0, 40]].map(([x, z]) => inF(TVd, x, z)),
    circle(LIVING.dining, 80),
  ];
  let foot = [];
  function setSofa(kind) {
    const k = SOFA[kind] || SOFA.gala3; SA.visible = k === SOFA.a04; SG.visible = k === SOFA.gala; SG3.visible = k === SOFA.gala3;
    ST.position.set(k.side[0], 0, k.side[1]); rug.position.set(k.rug[0], .6, k.rug[1]);
    foot = [k.out.map(([x, z]) => inF(SFd, x, z)), circle(k.side, 27), ...fixed]; return foot;
  }
  setSofa('gala3');
  const drapeMeshes = () => [];                                     // (the drapes: rooms.js)
  return { root, get foot() { return foot; }, setLamps, lamps, setSofa, setCurtains, FAC, drapeMeshes, seats, tv };
}
