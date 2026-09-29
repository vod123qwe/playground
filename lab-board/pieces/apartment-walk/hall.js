// The entrance: an IKEA PAX wardrobe where A.04 draws one, in the tiled strip along the wall by the pantry, wall to wall. PAX frames
// 100 + 50 wide, 58 deep, 236.4 high, white; three flat white doors 49.5 x 229.4 (FORSAND-like), push to open; a filler to the end wall.
// Plan centimetres (x, and the plan's y as z); the doors face +x, into the hall. pax() builds any such run (the bedroom has one too).

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PAX = { x0: 18.2, z0: -799, z1: -645.2, depth: 58, frames: [100, 50], h: 236.4 };

// a PAX run against a wall at x = x0, from z0 to z1, the doors facing +x; the frames from one end, a filler flush with the doors at the
// other (fill: 'z0' or 'z1', the end the filler goes to). Returns the doors, each { mesh, hinge: [x, z], s: +1 when it opens towards +z }
export function pax({ THREE, root, mats, x0, z0, z1, depth: D = 58, frames, h: FH = 236.4, fill = 'z0' }) {
  const { carcass, door, gap } = mats, doors = [];
  const box = (x0, x1, y0, y1, z0, z1, m, r = .15, parent = root) => {
    const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, Math.min(r, Math.min(x1 - x0, y1 - y0, z1 - z0) / 2 - .01));
    const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
  };
  const xf = x0 + D, W = frames.reduce((a, b) => a + b, 0), rest = (z1 - z0) - W;   // the carcass front plane; what is left for the filler
  let z = fill === 'z0' ? z0 + rest : z0;
  if (rest > .5) fill === 'z0' ? box(x0, xf + 2, 0, FH, z0, z0 + rest, carcass) : box(x0, xf + 2, 0, FH, z1 - rest, z1, carcass);
  for (const w of frames) {
    box(x0, xf, 0, FH, z, z + 1.8, carcass); box(x0, xf, 0, FH, z + w - 1.8, z + w, carcass);   // the sides
    box(x0, xf, FH - 1.8, FH, z, z + w, carcass); box(x0, xf, 0, 10, z, z + w, gap);           // the top; the base behind the doors, in shadow
    box(x0, x0 + .8, 0, FH, z, z + w, carcass);                                                 // the back
    const n = Math.round(w / 50);
    for (let k = 0; k < n; k++) {                                                   // doors 49.5 wide, 3 mm apart, 229.4 high over a 3.5 cm gap
      const a = z + k * w / n + .25, b = z + (k + 1) * w / n - .25, left = k % 2 === 0;   // pairs: the hinges on the outer sides
      const piv = new THREE.Group(); piv.position.set(xf, 0, left ? a : b); root.add(piv);
      const m = box(0, 1.9, 3.5, 3.5 + 229.4, left ? 0 : a - b, left ? b - a : 0, door, .2, piv);
      doors.push({ mesh: m, pivot: piv, s: left ? 1 : -1 });
    }
    z += w;
  }
  return { doors, foot: [[x0, z0], [xf + 2, z0], [xf + 2, z1], [x0, z1]] };
}

export function buildHall({ THREE, clip }) {
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });
  const mats = { carcass: std({ name: 'carcass', color: '#f1f0ec', roughness: .6 }), door: std({ name: 'door', color: '#f4f3ef', roughness: .45 }), gap: std({ name: 'gap', color: '#cfcac1', roughness: .9 }) };
  const root = new THREE.Group();
  const run = pax({ THREE, root, mats, ...PAX });
  return { root, foot: [run.foot], doors: run.doors, mats };
}
