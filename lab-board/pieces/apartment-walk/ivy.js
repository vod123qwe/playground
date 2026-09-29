// Ivy in a white pot, standing on a shelf by a wall (the wall at z = WZ, the room at -z; plan centimetres): a crown of short shoots over
// the rim and fifteen trailing strands, 30 to 120 cm (times reach), hanging close to the wall and drifting a little sideways; lobed
// leaves every few cm, smaller towards the tips. The living room's (behind the table) and the study's (over the desk) are the same plant.

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// y: the shelf's top; CX: the pot's centre along the wall
export function ivy({ THREE, root, std, WZ, CX, y: potY, seed = 907, reach = 1 }) {
  const r = rng(seed);
  const mesh = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; root.add(o); return o; };
  const potM = std({ name: 'lampBase', color: '#ece6dc', roughness: .5 });
  const pot = new THREE.LatheGeometry([[0, 0], [7.5, 0], [8.5, 1], [9.5, 13], [10.2, 14.5], [9.6, 14.8], [8.9, 13.2], [0, 13]].map(([a, b]) => new THREE.Vector2(a, b)), 48);
  mesh(pot, potM, CX, potY, WZ - 10);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(8.9, 32), std({ name: 'soil', color: '#3b2e24', roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.set(CX, potY + 12.6, WZ - 10); root.add(soil);
  // an ivy leaf: five lobes, the middle one longest, 1 unit across; bent a little along its midrib
  const leafShape = (() => { const s2 = new THREE.Shape(), pts = [];
    for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40), lobe = .55 + .45 * Math.pow(Math.abs(Math.cos(a * 2.5)), .6) + .35 * Math.exp(-Math.pow((a - Math.PI / 2) / .35, 2));
      pts.push([Math.cos(a) * lobe * .55, Math.sin(a) * lobe * .6]); }
    s2.moveTo(0, -.12); for (const [x, y] of pts) s2.lineTo(x, y); s2.lineTo(0, -.12); return s2; })();
  const leafBase = new THREE.ShapeGeometry(leafShape, 6); { const q = leafBase.attributes.position; for (let i = 0; i < q.count; i++) { const x = q.getX(i), y = q.getY(i); q.setZ(i, -.18 * x * x + .06 * y); } leafBase.computeVertexNormals(); }
  const leaves = [], stems = [], m4 = new THREE.Matrix4(), qu = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const PZ = WZ - 10, SOIL = potY + 12.6, RIM = potY + 14.8;
  const leafAt = (p0, size, out = 0) => {                           // a leaf on its stalk, facing mostly out of the wall, turned every which way
    e.set(-.4 + r() * .8 - out * .5, (r() - .5) * 1.4, (r() - .5) * 2.2 + Math.PI); qu.setFromEuler(e); sc.set(size, size, size);
    ps.set(p0.x + (r() - .5) * 1.6, p0.y + (r() - .5) * 1, p0.z - .6 - r() * 1.4); leaves.push(leafBase.clone().applyMatrix4(m4.compose(ps, qu, sc)));
  };
  const vine = (pts, leafEvery, s0, s1, out = 0) => {
    const c = new THREE.CatmullRomCurve3(pts); stems.push(new THREE.TubeGeometry(c, Math.max(8, pts.length * 6), .15, 5));
    const n = Math.max(2, Math.floor(c.getLength() / leafEvery)); for (let i = 1; i <= n; i++) { const t = i / (n + .5); leafAt(c.getPoint(t), THREE.MathUtils.lerp(s0, s1, t) * (.8 + r() * .4), out); }
    return c;
  };
  // the crown: short shoots from the soil, arching up and out over the rim
  for (let k = 0; k < 10; k++) {
    const a = r() * Math.PI * 2, r0 = 1 + r() * 5, h = 5 + r() * 9, rr = 7 + r() * 7;
    vine([new THREE.Vector3(CX + Math.cos(a) * r0, SOIL, PZ + Math.sin(a) * r0 * .7), new THREE.Vector3(CX + Math.cos(a) * (r0 + rr * .4), SOIL + h, PZ + Math.sin(a) * (r0 + rr * .4) * .7),
      new THREE.Vector3(CX + Math.cos(a) * (r0 + rr), SOIL + h * .7, PZ + Math.sin(a) * (r0 + rr) * .7)], 2.6, 5.4, 4.2, .6);
  }
  // the trailing strands: from the soil, up a little, over the rim at their side, then down: the front ones hang free before the shelf,
  // the back ones find the wall; each sways at its own pace, so they cross and weave; a few branch
  for (let k = 0; k < 15; k++) {
    const a = (k / 15) * Math.PI * 2 + (r() - .5) * .5, ca = Math.cos(a), sa = Math.sin(a), front = sa < -.2;
    const len = (30 + r() * 80 * (k % 4 === 0 ? 1.1 : .75)) * reach, amp = 2 + r() * 3, fr = .05 + r() * .05, ph = r() * 6.3, lean = ca * (3 + r() * 7);
    const pts = [new THREE.Vector3(CX + ca * 3, SOIL, PZ + sa * 2.5), new THREE.Vector3(CX + ca * 7, RIM + 3 + r() * 4, PZ + sa * 5.5), new THREE.Vector3(CX + ca * 11, RIM - 1.5, PZ + sa * 8)];
    const zEnd = front ? PZ - 9 - r() * 4 : WZ - 1.6 - r() * 1.2;
    for (let d = 8; d <= len; d += 8) { const t = d / len;
      pts.push(new THREE.Vector3(CX + ca * 11 + lean * Math.sqrt(t) + amp * Math.sin(fr * d * 6.3 + ph), RIM - 1.5 - d, THREE.MathUtils.lerp(PZ + sa * 8, zEnd, Math.min(1, t * 2.2)) + Math.sin(d * .21 + ph) * 1.2)); }
    const c = vine(pts, 3.3, 5.6, 2.5);
    if (r() < .45 && len > 50) {                                    // a side shoot from partway down
      const t0 = .3 + r() * .3, b0 = c.getPoint(t0), dir = r() < .5 ? -1 : 1, bl = 18 + r() * 25, bp = [b0.clone()];
      for (let d = 6; d <= bl; d += 6) bp.push(new THREE.Vector3(b0.x + dir * d * .22 + Math.sin(d * .4 + ph) * 1.5, b0.y - d * .8, b0.z + (front ? -1 : .3) * Math.min(3, d * .1)));
      vine(bp, 3.2, 4, 2.4);
    }
  }
  const leafM = std({ name: 'ivyLeaf', color: '#2f4a2c', roughness: .42, side: THREE.DoubleSide }), stemM = std({ name: 'ivyStem', color: '#4d4630', roughness: .8 });
  const L = new THREE.Mesh(mergeGeometries(leaves), leafM); L.castShadow = L.receiveShadow = true; root.add(L);
  const St = new THREE.Mesh(mergeGeometries(stems), stemM); St.castShadow = true; root.add(St);
}
