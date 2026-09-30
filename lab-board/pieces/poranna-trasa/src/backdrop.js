// The distance, all round: a pixel panorama drawn here (1024 x 160, sampled without smoothing), on the inside of a far cylinder,
// no fog on it. Bottom up: nearer hills with a line of trees and spruces, a lake with glints, the far shore with a little town on
// its slope (white walls, red and grey roofs, a church with its tower here and there), farther hills in haze. Above them the sky
// shows through (the top is clear). Colours from the game's palette, so it sits in the picture.

export function createBackdrop({ THREE, radius = 430, height = 90 }) {
  const W = 1024, H = 160, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  let s = 91; const r = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(((x % W) + W) % W, y, 1, 1); };
  const wave = (x, a) => a.reduce((v, [amp, f, ph]) => v + amp * Math.sin(x / W * Math.PI * 2 * f + ph), 0);   // (seamless round the circle)
  const ridge = (base, a) => Array.from({ length: W }, (_, x) => Math.round(base + wave(x, a)));
  const fill = (top, col, dith) => { for (let x = 0; x < W; x++) for (let y = top[x]; y < H; y++) { if (dith && y === top[x] && (x & 1)) continue; px(x, y, col); } };
  const LAKE = 118;
  // far hills, in haze
  const far = ridge(78, [[9, 3, .4], [5, 7, 1.3], [3, 13, 2.1]]); fill(far, '#9db9b0'); for (let x = 0; x < W; x += 2) px(x, far[x] - 1, '#b8cdc2');
  const mid = ridge(92, [[8, 4, 2.2], [4, 9, .3], [2, 21, 1.7]]); fill(mid, '#7f9f8c');
  for (let x = 0; x < W; x++) if (r() < .5) { const y = mid[x] - (r() < .5 ? 1 : 0); px(x, y, '#6d8f7a'); }                     // a fringe of far trees
  // the far shore's town: houses stepping up the slope, a church now and then
  for (let k = 0; k < 150; k++) { const x = r() * W | 0, y = Math.min(LAKE - 3, mid[x] + 4 + (r() * (LAKE - mid[x] - 6) | 0)), w = 3 + (r() * 3 | 0);
    g.fillStyle = r() < .8 ? '#e9e3d1' : '#e3c77e'; g.fillRect(x, y, w, 3); g.fillStyle = r() < .6 ? '#b3392d' : r() < .5 ? '#8e2e25' : '#5b5f63'; g.fillRect(x - 1 + (r() < .5 ? 0 : 1), y - 1, w, 1); g.fillRect(x, y - 2, w - 1, 1);
    if (r() < .5) px(x + 1, y + 1, '#44484c'); }
  for (const cx of [140, 470, 820]) { const y = mid[cx] + 8; g.fillStyle = '#f6f3ea'; g.fillRect(cx, y - 8, 4, 10); g.fillRect(cx - 5, y - 2, 12, 4); g.fillStyle = '#5b5f63'; g.fillRect(cx, y - 11, 4, 3); g.fillRect(cx + 1, y - 15, 2, 4); px(cx + 1, y - 16, '#5b5f63');
    g.fillStyle = '#8e2e25'; g.fillRect(cx - 6, y - 3, 14, 1); }                                                          // a church and its tower
  // the lake: a band of water, glints in rows, the shore line
  for (let y = LAKE; y < LAKE + 12; y++) for (let x = 0; x < W; x++) px(x, y, y < LAKE + 2 ? '#bcdcdf' : y < LAKE + 7 ? '#9ccad8' : '#7fb6cc');
  for (let k = 0; k < 420; k++) { const x = r() * W | 0, y = LAKE + 1 + (r() * 10 | 0); px(x, y, '#f6f3ea'); if (r() < .5) px(x + 1, y, '#dcebd9'); }
  // the near hills: dark greens, spruces and round trees along their tops, meadows in lighter bands
  const near = ridge(LAKE + 12, [[5, 5, .9], [3, 11, 2.5], [2, 23, .2]]).map(v => Math.min(v, H - 20)); fill(near, '#467537');
  for (let x = 0; x < W; x++) for (let y = near[x] + 6; y < H; y += 5) if (((x + y * 3) >> 3) % 3 === 0) px(x, y, '#5b8a3c');
  for (let x = 0; x < W; x += 3 + (r() * 4 | 0)) { const y = near[x], sp = r() < .45, h = sp ? 6 + (r() * 6 | 0) : 4 + (r() * 3 | 0), col = sp ? '#284a2b' : r() < .8 ? '#355f31' : r() < .5 ? '#b86a2e' : '#d9a441';
    if (sp) { for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round((k + 1) * .45)); g.fillStyle = col; g.fillRect(x - w + 1, y - h + k, w * 2 - 1, 1); } g.fillStyle = '#3d2a1b'; g.fillRect(x, y, 1, 2); }
    else { g.fillStyle = col; g.beginPath(); g.fillRect(x - 2, y - h, 5, h - 1); g.fillRect(x - 1, y - h - 1, 3, 1); px(x - 1, y - h, '#5b8a3c'); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = THREE.RepeatWrapping;
  const geo = new THREE.CylinderGeometry(radius, radius, height, 128, 1, true);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, transparent: true, alphaTest: .5, fog: false, depthWrite: false }));
  m.renderOrder = -1; return m;
}
