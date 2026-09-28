// The entrance: an IKEA PAX wardrobe where A.04 draws one, in the tiled strip along the wall by the pantry, wall to wall. PAX frames
// 100 + 50 wide, 58 deep, 236.4 high, white; three flat white doors 49.5 x 229.4 (FORSAND-like), push to open; a filler to the end wall.
// Plan centimetres (x, and the plan's y as z); the doors face +x, into the hall.

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PAX = { x0: 18.2, z0: -799, z1: -645.2, depth: 58, frames: [100, 50], h: 236.4 };

export function buildHall({ THREE, clip }) {
  const std = o => new THREE.MeshStandardMaterial({ ...o, ...clip });
  const carcass = std({ color: '#f1f0ec', roughness: .6 }), door = std({ color: '#f4f3ef', roughness: .45 }), gap = std({ color: '#cfcac1', roughness: .9 });
  const root = new THREE.Group();
  const box = (x0, x1, y0, y1, z0, z1, m, r = .15) => {
    const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 2, Math.min(r, Math.min(x1 - x0, y1 - y0, z1 - z0) / 2 - .01));
    const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; root.add(o); return o;
  };
  const { x0, z0, z1, depth: D, frames, h: FH } = PAX, xf = x0 + D;                // the carcass front plane
  const W = frames.reduce((a, b) => a + b, 0), fill = (z1 - z0) - W;                // what is left along the wall: a filler strip
  let z = z0 + fill;                                                                // the filler at the corner end, the frames after it
  box(x0, xf + 2, 0, FH, z0, z0 + fill, carcass);                                   // the filler, flush with the doors
  for (const w of frames) {
    box(x0, xf, 0, FH, z, z + 1.8, carcass); box(x0, xf, 0, FH, z + w - 1.8, z + w, carcass);   // the sides
    box(x0, xf, FH - 1.8, FH, z, z + w, carcass); box(x0, xf, 0, 10, z, z + w, gap);           // the top; the base behind the doors, in shadow
    box(x0, x0 + .8, 0, FH, z, z + w, carcass);                                                 // the back
    const n = Math.round(w / 50);
    for (let k = 0; k < n; k++) {                                                   // doors 49.5 wide, 3 mm apart, 229.4 high over a 3.5 cm gap
      const a = z + k * w / n + .25, b = z + (k + 1) * w / n - .25;
      box(xf, xf + 1.9, 3.5, 3.5 + 229.4, a, b, door, .2);
    }
    z += w;
  }
  // on the floor, for walking
  const foot = [[[x0, z0], [xf + 2, z0], [xf + 2, z1], [x0, z1]]];
  return { root, foot };
}
