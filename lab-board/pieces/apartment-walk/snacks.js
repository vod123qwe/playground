// Snacks: a bag of crisps (in the upper cupboard over the sink), a bowl they go into, one crisp. In plan centimetres, like the rest.
// A bag: a pillow of foil, crimped at the top and the bottom, its label drawn here. A bowl: white stoneware, 18 across, 7 high, with a
// mound of crisps that goes down as they are eaten. Every mesh knows its snack (userData.snack: the bag's mesh, or the bowl's group),
// and the snack how many are left (userData.n).

let bagM = null, crispG = null, crispM = null, bowlG = null, bowlM = null;
function mats(THREE, clip = {}) {                                         // (clip: the cutaway's planes, as the rest of the flat has them)
  if (bagM) return;
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c62a2a'); gr.addColorStop(1, '#8e1717'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#f7c948'; g.beginPath(); g.ellipse(128, 150, 70, 46, -.2, 0, 7); g.fill();                  // a crisp on the front
  g.fillStyle = '#e0a42e'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(90 + i * 13, 140 + (i % 2) * 14, 4, 0, 7); g.fill(); }
  g.fillStyle = '#ffffff'; g.font = '900 44px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('CHIPSY', 128, 70); g.font = '600 20px Inter, sans-serif'; g.fillText('solone · 140 g', 128, 228);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  bagM = new THREE.MeshStandardMaterial({ name: 'crispBag', map: t, roughness: .32, metalness: .45, ...clip });
  crispG = new THREE.SphereGeometry(2.6, 10, 4, 0, Math.PI * 2, 0, .75).scale(1, .45, .78);
  crispM = new THREE.MeshStandardMaterial({ name: 'crisp', color: '#e8b64a', roughness: .55, side: THREE.DoubleSide, ...clip });
  bowlG = new THREE.LatheGeometry([[0, 0], [5, 0], [5.4, .4], [7.4, 2.2], [8.8, 5], [9, 7], [8.5, 7], [8.2, 5.2], [6.9, 2.6], [4.6, .9], [0, .9]].map(([r, y]) => new THREE.Vector2(r, y)), 48);
  bowlM = new THREE.MeshStandardMaterial({ name: 'bowl', color: '#f3efe8', roughness: .35, ...clip });
}
export function makeBag(THREE, n = 30, clip) {                           // 18 wide, 26 high, 7 at its fullest; stands on its bottom seam
  mats(THREE, clip);
  const geo = new THREE.BoxGeometry(18, 26, 7, 12, 16, 4), P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ey = Math.abs(y) / 13, ex = Math.abs(x) / 9;
    P.setZ(i, z * (1 - Math.pow(ey, 4) * .9) * (1 - Math.pow(ex, 6) * .45));                            // flat at the seams, full between
    if (ey > .92) P.setX(i, x * (1 + Math.sin(x * 2.2) * .02));                                         // the crimp
  }
  geo.computeVertexNormals(); geo.translate(0, 13, 0);
  const m = new THREE.Mesh(geo, bagM); m.castShadow = m.receiveShadow = true;
  m.userData.kind = 'chips'; m.userData.n = n; m.userData.snack = m;
  return m;
}
export function makeCrisp(THREE) { mats(THREE); const m = new THREE.Mesh(crispG, crispM); m.castShadow = true; return m; }
export function makeBowl(THREE, n) {                                     // the bowl, and its crisps in a mound (the last put in, the first eaten)
  mats(THREE);
  const G = new THREE.Group(), b = new THREE.Mesh(bowlG, bowlM); b.castShadow = b.receiveShadow = true; G.add(b);
  G.userData.kind = 'bowl'; G.userData.n = 0; G.userData.snack = G; b.userData.snack = G;
  const ring = [];
  for (let i = 0; i < 40; i++) {                                       // places in the mound: round the bottom first, then up to a peak
    const layer = i < 10 ? 0 : i < 20 ? 1 : i < 28 ? 2 : i < 34 ? 3 : 4, r = [5.2, 4.4, 3.4, 2.2, .8][layer], k = i * 2.39996;
    ring.push({ x: Math.cos(k) * r * Math.sqrt(((i * 7) % 10 + 3) / 13), z: Math.sin(k) * r * Math.sqrt(((i * 7) % 10 + 3) / 13), y: 1.4 + layer * 1.35, rx: (i * 1.7) % 1.2 - .6, ry: i * 2.1, rz: (i * 1.3) % 1 - .5 });
  }
  G.userData.slots = ring;
  G.userData.add = k => { for (let i = 0; i < k && G.userData.n < ring.length; i++) { const s = ring[G.userData.n++], c = makeCrisp(THREE); c.position.set(s.x, s.y, s.z); c.rotation.set(s.rx, s.ry, s.rz); c.userData.snack = G; G.add(c); } };
  G.userData.take = () => { if (G.userData.n <= 0) return null; G.userData.n--; const c = G.children[G.children.length - 1]; G.remove(c); return c; };
  G.userData.add(Math.min(n, ring.length));
  return G;
}
