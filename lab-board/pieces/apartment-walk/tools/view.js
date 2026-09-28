// The view out of the flat's windows as a 360 degree panorama (equirectangular, 2:1), for the walk's background.
// A small 3D world around the flat, seen from the 4th floor (13.7 m up): terrain, land use painted on the ground, houses with gable roofs
// and windows, blocks, trees, roads, the railway, a sky with clouds and haze; rendered into a cube, unwrapped into a JPEG.
//   mode=generic: made up, in the manner of the area (fields in front, the railway, then houses in gardens, wooded hills to the south)
//   mode=real:    from assets/private/view-data (tools/fetch_view.py: Terrarium heights, OpenStreetMap), local metres only; the
//                 result is saved into assets/private and stays off the public site
// Frame: x east, z south, y up, metres; the flat at the origin, its ground at y = 0.

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
const MODE = Q.get('mode') === 'real' ? 'real' : 'generic', EYE = +(Q.get('eye') || 13.7), SIZE = +(Q.get('size') || 8192), POST = Q.get('post');
const logEl = document.getElementById('log'), log = t => { logEl.textContent += t + '\n'; console.log(t); };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = rng(20260929);
const noise2 = (() => {                                             // value noise, smooth, and its fbm
  const P = new Float32Array(512 * 512); for (let i = 0; i < P.length; i++) P[i] = R();
  const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const g = (i, j) => P[((j & 511) << 9) | (i & 511)];
    return (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) + (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy; };
  return (x, y, o = 4) => { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * n(x * f + i * 17.3, y * f - i * 9.1); a *= .5; f *= 2.03; } return s; };
})();
const inPoly = (x, z, ps) => { let c = false; for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) { const [xi, zi] = ps[i], [xj, zj] = ps[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const area = ps => { let a = 0; for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) a += (ps[j][0] + ps[i][0]) * (ps[j][1] - ps[i][1]); return a / 2; };
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); };
const polyD = (x, z, ps) => { let d = 1e9; for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) d = Math.min(d, segD(x, z, ps[j], ps[i])); return d; };

// ---------- the data ----------
async function realData() {
  const base = '../assets/private/view-data/';
  const [meta, osm, nb, fb] = await Promise.all([fetch(base + 'meta.json').then(r => r.json()), fetch(base + 'osm.json').then(r => r.json()),
    fetch(base + 'near.f32').then(r => r.arrayBuffer()), fetch(base + 'far.f32').then(r => r.arrayBuffer())]);
  const grid = (buf, g) => { const a = new Float32Array(buf), n = g.n, half = g.half;
    return (x, z) => { const fx = (x + half) / (2 * half) * n, fz = (z + half) / (2 * half) * n; if (fx < 0 || fz < 0 || fx > n || fz > n) return null;
      const i = Math.min(n - 1, Math.floor(fx)), j = Math.min(n - 1, Math.floor(fz)), tx = fx - i, tz = fz - j, v = (a2, b2) => a[b2 * (n + 1) + a2];
      return (v(i, j) * (1 - tx) + v(i + 1, j) * tx) * (1 - tz) + (v(i, j + 1) * (1 - tx) + v(i + 1, j + 1) * tx) * tz; }; };
  const hn = grid(nb, meta.near), hf = grid(fb, meta.far), h0 = meta.h0;
  const height = (x, z) => { const a = Math.max(Math.abs(x), Math.abs(z)), n = a < 1590 ? hn(x, z) : null, f = hf(x, z) ?? h0;
    if (n === null) return f - h0; const k = Math.max(0, Math.min(1, (a - 1400) / 190)); return n * (1 - k) + f * k - h0; };
  return { height, ...osm };
}
function genericData() {
  // gently rolling fields, the railway 85 m to the south, a suburb of houses in gardens beyond it, wooded hills rising 2-5 km out
  const height = (x, z) => {
    const r = Math.hypot(x, z), south = Math.max(0, z) / (Math.hypot(x, z) + 1);
    const hills = 330 * THREE.MathUtils.smoothstep(r, 1500, 4800) * (.3 + .7 * south) * (.45 + .9 * noise2(x / 2600, z / 2600, 3));
    const roll = 7 * (noise2(x / 700 + 40, z / 700, 4) - .5) * THREE.MathUtils.smoothstep(r, 120, 600);
    const valley = -6 * Math.exp(-(((z - 85) / 60) ** 2));             // the railway runs along a shallow valley
    return hills + roll + valley * THREE.MathUtils.smoothstep(r, 60, 200) + 20 * THREE.MathUtils.smoothstep(r, 6000, 11000) * noise2(x / 5000, z / 5000, 2);
  };
  const d = { height, buildings: [], areas: [], roads: [], rails: [], water: [], trees: [], farAreas: [] };
  const rect = (cx, cz, w, h, a) => { const c = Math.cos(a), s = Math.sin(a); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c]); };
  // the railway: a long gentle curve east-west; a road and a path along it
  const rail = []; for (let x = -3000; x <= 3000; x += 40) rail.push([x, 85 + 25 * Math.sin(x / 1400)]);
  d.rails.push({ p: rail, kind: 'rail' }); d.roads.push({ p: rail.map(([x, z]) => [x, z + 18]), kind: 'tertiary' });
  // the estate's other wing (a 5-storey block to the west) and a meadow in front
  d.buildings.push({ p: rect(-62, 8, 70, 16, .03), kind: 'apartments', levels: 5 });
  d.areas.push({ p: rect(0, 45, 400, 60, 0), kind: 'meadow' });
  // the suburb: winding streets 90 m apart, houses along them
  for (let k = 0; k < 14; k++) {
    const z0 = 150 + k * 90 + (R() - .5) * 20, street = []; for (let x = -1800; x <= 1800; x += 30) street.push([x, z0 + 14 * Math.sin(x / 300 + k)]);
    d.roads.push({ p: street, kind: 'residential' });
    for (let x = -1760; x < 1760; x += 22 + R() * 14) {
      if (R() < .12) continue;
      for (const side of [-1, 1]) {
        const zz = z0 + 14 * Math.sin(x / 300 + k) + side * (18 + R() * 8), a = Math.atan2(14 / 300 * Math.cos(x / 300 + k), 1) + (R() - .5) * .15;
        const w = 9 + R() * 5, h = 8 + R() * 4;
        d.buildings.push({ p: rect(x, zz, w, h, a), kind: 'house', levels: R() < .55 ? 2 : 1 });
        for (let t = 0; t < 2 + R() * 3; t++) d.trees.push([x + (R() - .5) * 26, zz + side * (6 + R() * 12)]);
      }
    }
  }
  d.areas.push({ p: rect(0, 800, 3600, 1300, 0), kind: 'residential' });
  // more of the town to the north, east and west: blocks of houses along lanes, fields with hedgerows between
  for (let k = 0; k < 90; k++) {
    const a = R() * Math.PI * 2, r = 250 + R() * 1250, cx = Math.cos(a) * r, cz = Math.sin(a) * r; if (cz > 60 && cz < 1450) continue;
    const ang = R() * Math.PI, n = 4 + Math.floor(R() * 8);
    for (let i = 0; i < n; i++) for (const side of [-1, 1]) { const u = (i - n / 2) * (24 + R() * 6), v = side * 18, x = cx + u * Math.cos(ang) - v * Math.sin(ang), z = cz + u * Math.sin(ang) + v * Math.cos(ang);
      if (Math.hypot(x, z) < 90 || Math.abs(z - 85 - 25 * Math.sin(x / 1400)) < 30) continue;
      d.buildings.push({ p: rect(x, z, 9 + R() * 5, 8 + R() * 4, ang + (R() - .5) * .1), kind: 'house', levels: R() < .55 ? 2 : 1 });
      for (let t = 0; t < 1 + R() * 3; t++) d.trees.push([x + (R() - .5) * 24, z + (R() - .5) * 24]); }
    const L = [[cx - Math.cos(ang) * n * 16, cz - Math.sin(ang) * n * 16], [cx + Math.cos(ang) * n * 16, cz + Math.sin(ang) * n * 16]]; d.roads.push({ p: L, kind: 'residential' });
  }
  for (let k = 0; k < 420; k++) { const cx = (R() - .5) * 3100, cz = (R() - .5) * 3100; if (Math.hypot(cx, cz) < 130 || (cz > 60 && cz < 1450 && Math.abs(cx) < 1700)) continue;
    const f = rect(cx, cz, 120 + R() * 260, 80 + R() * 180, R() * 3); d.areas.push({ p: f, kind: R() < .55 ? 'farmland' : 'meadow' });
    d.roads.push({ p: [...f, f[0]], kind: 'tree_row' }); }
  // woods: on the hills to the south, patches elsewhere; fields between
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2, r = 1600 + R() * 8000, cx = Math.cos(a) * r, cz = Math.sin(a) * r * (a > 0 && a < Math.PI ? .8 : 1), s = 300 + R() * 1400;
    const ring = []; for (let k = 0; k < 18; k++) { const b = k / 18 * Math.PI * 2, rr = s * (.6 + .5 * noise2(i * 3 + Math.cos(b), Math.sin(b))); ring.push([cx + Math.cos(b) * rr, cz + Math.sin(b) * rr]); }
    (r < 1600 ? d.areas : d.farAreas).push({ p: ring, kind: cz > 1500 || R() < .45 ? 'forest' : 'farmland' });
  }
  for (let i = 0; i < 26; i++) { const cx = (R() - .5) * 3000, cz = (R() - .5) * 3000; if (Math.abs(cz - 80) < 120 || (cz > 120 && cz < 1450)) continue; d.areas.push({ p: rect(cx, cz, 200 + R() * 300, 120 + R() * 200, R()), kind: R() < .4 ? 'forest' : R() < .5 ? 'farmland' : 'meadow' }); }
  d.areas.push({ p: rect(0, 1800, 3000, 700, 0), kind: 'forest' });
  return d;
}

// ---------- the renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight); document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const SUN = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 42), THREE.MathUtils.degToRad(200));   // (placeholder, set below)
{ const el = 42 * Math.PI / 180, az = 205 * Math.PI / 180; SUN.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); }   // early afternoon, south-south-west (x east, -z north)
const HAZE = new THREE.Color('#cfd8df');
scene.fog = new THREE.FogExp2(HAZE, .00017);
const sun = new THREE.DirectionalLight('#fff3e2', 3.1); sun.position.copy(SUN).multiplyScalar(800); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 1, far: 2400 }); sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .6;
scene.add(sun, sun.target, new THREE.HemisphereLight('#cfdff2', '#6f7a55', 1.05));

function sky() {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: SUN } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 sunDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 6; i++) { s += a * n(p); p = p * 2.03 + 11.7; a *= .5; } return s; }
      void main(){
        vec3 d = normalize(vD); float y = max(d.y, 0.);
        vec3 zen = vec3(.30, .47, .74), hor = vec3(.80, .86, .90);
        vec3 c = mix(hor, zen, pow(y, .55));
        float s = max(dot(d, sunDir), 0.); c += vec3(1., .92, .78) * (pow(s, 600.) * 12. + pow(s, 12.) * .25);
        if (d.y > 0.) {                                            // clouds: fair-weather cumulus, thinner towards the horizon
          vec2 p = d.xz / (d.y + .08) * 1.6;
          float cl = smoothstep(.52, .78, fbm(p + vec2(3.1, 7.7))) * smoothstep(.0, .18, d.y);
          vec3 cc = mix(vec3(.82, .84, .88), vec3(1.), smoothstep(.45, .9, fbm(p * 1.7 + 2.)) * .7 + .3 * s);
          c = mix(c, cc, cl * .92);
        }
        c = mix(c, vec3(.68, .71, .66), smoothstep(0., -.08, d.y));   // below the horizon (the ground covers it anyway)
        gl_FragColor = vec4(c, 1.);
      }` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(30000, 64, 32), m); s.renderOrder = -1; scene.add(s);
}

const COL = { forest: '#46613a', wood: '#46613a', scrub: '#6c7f47', meadow: '#8aab5c', grass: '#86a95a', grassland: '#8aab5c', farmland: '#a8a868', orchard: '#789a50',
  residential: '#809f57', garden: '#7ea455', park: '#79a257', allotments: '#8c9d5a', industrial: '#9a988e', commercial: '#9b988f', retail: '#9b988f', railway: '#8a8174',
  cemetery: '#6f8c55', recreation_ground: '#86a95a', pitch: '#6f9e4d', playground: '#a39a80', construction: '#a89a82', brownfield: '#9f9780', village_green: '#86a95a', farmyard: '#9c9474' };
const ROADW = { motorway: 22, trunk: 16, primary: 11, secondary: 9, tertiary: 7.5, unclassified: 6, residential: 6, living_street: 5, service: 4, track: 3, footway: 2, path: 1.6, cycleway: 2.2, pedestrian: 5, steps: 2 };

async function build() {
  log(`mode: ${MODE}, eye ${EYE} m, ${SIZE} x ${SIZE / 2}`);
  const D = MODE === 'real' ? await realData() : genericData();
  const H = D.height, NEAR = 1600, FAR = 12000;
  log('heights south: ' + [500, 1500, 3000, 5000, 8000].map(r => Math.round(H(0, r))).join(', ') + ' · north: ' + [1500, 5000].map(r => Math.round(H(0, -r))).join(', '));
  // own building out: anything within 18 m of the flat (the point may sit on the facade)
  D.buildings = D.buildings.filter(b => b.p.length > 2 && !(inPoly(0, 0, b.p) || polyD(0, 0, b.p) < 18));
  log(`buildings ${D.buildings.length}, areas ${D.areas.length}, roads ${D.roads.length}`);

  // ---------- the near ground: land use painted onto a 4096 px canvas over 3.2 km ----------
  const N = 4096, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), P = v => (v + NEAR) / (2 * NEAR) * N;
  g.fillStyle = '#86a458'; g.fillRect(0, 0, N, N);
  const poly = (ps, fill) => { g.beginPath(); ps.forEach(([x, z], i) => g[i ? 'lineTo' : 'moveTo'](P(x), P(z))); g.closePath(); g.fillStyle = fill; g.fill(); };
  const order = ['residential', 'industrial', 'commercial', 'retail', 'farmland', 'farmyard', 'meadow', 'grass', 'grassland', 'orchard', 'allotments', 'park', 'garden', 'recreation_ground', 'cemetery', 'railway', 'construction', 'brownfield', 'scrub', 'wood', 'forest', 'pitch', 'playground'];
  const sorted = [...D.areas].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  for (const a of sorted) {
    if (!COL[a.kind]) continue;
    const c = new THREE.Color(COL[a.kind]).offsetHSL((R() - .5) * .02, (R() - .5) * .08, (R() - .5) * .05);
    poly(a.p, '#' + c.getHexString());
    if (a.kind === 'farmland') {                                   // plough lines
      g.save(); g.beginPath(); a.p.forEach(([x, z], i) => g[i ? 'lineTo' : 'moveTo'](P(x), P(z))); g.closePath(); g.clip();
      const ang = R() * Math.PI, [cx, cz] = a.p[0]; g.translate(P(cx), P(cz)); g.rotate(ang); g.strokeStyle = 'rgba(80,70,40,.12)'; g.lineWidth = 1.2;
      for (let k = -2000; k < 2000; k += 3.5) { g.beginPath(); g.moveTo(-3000, k); g.lineTo(3000, k); g.stroke(); } g.restore();
    }
  }
  for (const w of D.water) if (w.p) poly(w.p, '#6f8f9d');
  const line = (ps, width, style, dash) => { g.beginPath(); ps.forEach(([x, z], i) => g[i ? 'lineTo' : 'moveTo'](P(x), P(z))); g.lineWidth = Math.max(1, width / (2 * NEAR) * N); g.strokeStyle = style; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); };
  for (const w of D.water) if (w.line) line(w.line, w.kind === 'river' ? 14 : 3, '#6f8f9d');
  for (const r of D.rails) if (r.kind === 'rail' || r.kind === 'light_rail') { line(r.p, 7, '#8b8173'); line(r.p, 2.6, 'rgba(60,52,46,.7)'); }
  for (const r of D.roads) { const w = ROADW[r.kind]; if (!w) continue; const dirt = ['track', 'path', 'footway'].includes(r.kind); line(r.p, w, dirt ? '#b3a78d' : '#8c8c89'); }
  // grain, and a darker ring under the houses (their shade and hedges)
  const img = g.getImageData(0, 0, N, N), px = img.data;
  for (let i = 0; i < px.length; i += 4) { const k = (R() - .5) * 14; px[i] += k; px[i + 1] += k; px[i + 2] += k * .7; }
  g.putImageData(img, 0, 0);
  const groundTex = new THREE.CanvasTexture(cv); groundTex.colorSpace = THREE.SRGBColorSpace; groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const terrain = (half, n, mat, lower, inner = 0) => {
    const geo = new THREE.PlaneGeometry(2 * half, 2 * half, n, n); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, H(x, z) - (lower && Math.max(Math.abs(x), Math.abs(z)) < NEAR - 5 ? 6 : 0) - (inner && Math.max(Math.abs(x), Math.abs(z)) < inner - 6 ? .6 : 0)); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; scene.add(m); return geo;
  };
  terrain(NEAR, 640, new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }), false, 250);
  { const FN = 250, M2 = 4096, c2 = document.createElement('canvas'); c2.width = c2.height = M2; const h2 = c2.getContext('2d'), Q2 = v => (v + FN) / (2 * FN) * M2;
    h2.drawImage(cv, P(-FN), P(-FN), P(FN) - P(-FN), P(FN) - P(-FN), 0, 0, M2, M2);   // the coarse paint, then crisp lines over it
    h2.filter = 'blur(1px)'; h2.drawImage(c2, 0, 0); h2.filter = 'none';
    const ln = (ps, w, st) => { h2.beginPath(); ps.forEach(([x, z], i) => h2[i ? 'lineTo' : 'moveTo'](Q2(x), Q2(z))); h2.lineWidth = w / (2 * FN) * M2; h2.strokeStyle = st; h2.lineCap = 'round'; h2.lineJoin = 'round'; h2.stroke(); };
    for (const r of D.roads) { const w = ROADW[r.kind]; if (!w) continue; const dirt = ['track', 'path', 'footway'].includes(r.kind); ln(r.p, w + .6, 'rgba(70,70,60,.35)'); ln(r.p, w, dirt ? '#b8ad93' : '#8d8d8a'); if (!dirt && w > 5) ln(r.p, .12, 'rgba(240,240,235,.5)'); }
    for (const r of D.rails) { ln(r.p, 7.5, '#8b8173'); for (const k of [-.72, .72]) { const off = r.p.map(([x, z], i, a) => { const b = a[Math.min(i + 1, a.length - 1)], c = a[Math.max(i - 1, 0)], dx = b[0] - c[0], dz = b[1] - c[1], L = Math.hypot(dx, dz) || 1; return [x - dz / L * k, z + dx / L * k]; }); ln(off, .3, '#4b433c'); } }
    const id = h2.getImageData(0, 0, M2, M2), px2 = id.data;                  // lawn: fine blades and patches
    for (let y = 0; y < M2; y++) for (let x = 0; x < M2; x++) { const i = (y * M2 + x) * 4; if (px2[i + 1] < px2[i] + 8) continue;
      const k = (noise2(x / 9, y / 9, 3) - .5) * 30 + (R() - .5) * 22; px2[i] += k * .7; px2[i + 1] += k; px2[i + 2] += k * .5; }
    h2.putImageData(id, 0, 0);
    const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(2 * FN, 2 * FN, 250, 250); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)) + .05);
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t2, roughness: 1 })); m.receiveShadow = true; scene.add(m); }
  // the far ground: forests and fields out to 12 km, as vertex colours
  {
    const M = 2048, fc = document.createElement('canvas'); fc.width = fc.height = M; const f = fc.getContext('2d'), F = v => (v + FAR) / (2 * FAR) * M;
    f.fillStyle = '#93a562'; f.fillRect(0, 0, M, M);
    for (let i = 0; i < 2600; i++) { const x = (R() - .5) * 2 * FAR, z = (R() - .5) * 2 * FAR, w = 120 + R() * 420, h = 60 + R() * 260; f.save(); f.translate(F(x), F(z)); f.rotate(R() * 3);
      f.fillStyle = ['#a9a86a', '#98ad60', '#b5ae78', '#8ca85a', '#a3a15f'][Math.floor(R() * 5)]; f.fillRect(0, 0, w / (2 * FAR) * M, h / (2 * FAR) * M); f.restore(); }
    for (const a of [...D.farAreas, ...D.areas]) { const c = { forest: '#3f5a35', wood: '#3f5a35', farmland: null, meadow: '#8fae5f', residential: '#8a9a6a', industrial: '#98968c', water: '#6f8f9d' }[a.kind]; if (!c) continue;
      f.beginPath(); a.p.forEach(([x, z], i) => f[i ? 'lineTo' : 'moveTo'](F(x), F(z))); f.closePath(); f.fillStyle = c; f.fill(); }
    const fd = f.getImageData(0, 0, M, M).data, geo = new THREE.PlaneGeometry(2 * FAR, 2 * FAR, 300, 300); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), inside = Math.max(Math.abs(x), Math.abs(z)) < NEAR - 5; p.setY(i, H(x, z) - (inside ? 6 : 0));
      const u = Math.min(M - 1, Math.max(0, Math.floor(F(x)))), v = Math.min(M - 1, Math.max(0, Math.floor(F(z)))), k = (v * M + u) * 4;
      c.setRGB(fd[k] / 255, fd[k + 1] / 255, fd[k + 2] / 255, THREE.SRGBColorSpace); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = true; scene.add(m);
    // forest canopy far out: a bumpy dark layer as tiny trees would read from here
    D._farForest = fd; D._F = F; D._M = M;
  }

  // ---------- buildings: walls with windows, gable roofs on houses, flat on the rest ----------
  const winTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#3b4552'; x.fillRect(78, 70, 100, 118); x.fillStyle = '#6d7c8c'; x.fillRect(82, 74, 92, 52); x.fillStyle = '#e8e6e0'; x.fillRect(126, 70, 4, 118); x.fillRect(78, 186, 100, 8);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();   // one window per 3 x 3 m
  const walls = [], roofs = [], WALL = ['#f3f1ea', '#ebe4d6', '#e9e0cc', '#dcdad4', '#f1ece0', '#d8cdb8', '#ece9e3'], ROOF = ['#7a3a2c', '#8c4432', '#5c3b33', '#4a4d52', '#3a3c40', '#9a5a3e', '#6d4a3a'];
  const push = (arr, pos, col, uv) => arr.push({ pos, col, uv });
  const quad = (arr, a, b, c, d, col, uvs) => { push(arr, [...a, ...b, ...c, ...a, ...c, ...d], col, uvs ? [...uvs[0], ...uvs[1], ...uvs[2], ...uvs[0], ...uvs[2], ...uvs[3]] : null); };
  const tri = (arr, a, b, c, col) => push(arr, [...a, ...b, ...c], col, [0, 0, 0, 0, 0, 0]);
  for (const b of D.buildings) {
    let ps = b.p.slice(); if (ps.length > 3 && ps[0][0] === ps.at(-1)[0] && ps[0][1] === ps.at(-1)[1]) ps.pop(); if (ps.length < 3) continue;
    if (area(ps) < 0) ps.reverse();
    const A = Math.abs(area(ps)); if (A < 6) continue;
    const small = A < 260 && !['apartments', 'industrial', 'commercial', 'retail', 'warehouse'].includes(b.kind);
    const lv = b.levels ?? (['apartments'].includes(b.kind) ? 4 : ['garage', 'garages', 'shed', 'roof', 'carport', 'hut'].includes(b.kind) ? .9 : A < 260 ? 2 : A < 900 ? 3 : 4);
    const wallH = b.h ? (small ? b.h * .72 : b.h) : Math.max(2.6, lv * 2.9 + (small ? .3 : .8));
    let y0 = 1e9; for (const [x, z] of ps) y0 = Math.min(y0, H(x, z)); y0 -= .6;
    const wc = new THREE.Color(WALL[Math.floor(R() * WALL.length)]), rc = new THREE.Color(ROOF[Math.floor(R() * ROOF.length)]).offsetHSL(0, 0, (R() - .5) * .06);
    const y1 = y0 + wallH + .6; let per = 0;
    for (let i = 0; i < ps.length; i++) { const a = ps[i], c2 = ps[(i + 1) % ps.length], L = Math.hypot(c2[0] - a[0], c2[1] - a[1]);
      quad(walls, [a[0], y0, a[1]], [c2[0], y0, c2[1]], [c2[0], y1, c2[1]], [a[0], y1, a[1]], wc, [[per / 3, 0], [(per + L) / 3, 0], [(per + L) / 3, (y1 - y0) / 3], [per / 3, (y1 - y0) / 3]]); per += L; }
    if (small && b.roof !== 'flat' && ps.length <= 12) {            // a gable over the footprint's oriented box, ridge along its length
      let best = null;
      for (let i = 0; i < ps.length; i++) { const a = ps[i], c2 = ps[(i + 1) % ps.length], ang = Math.atan2(c2[1] - a[1], c2[0] - a[0]), cs = Math.cos(ang), sn = Math.sin(ang);
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, z] of ps) { const u = x * cs + z * sn, v = -x * sn + z * cs; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        const ar = (u1 - u0) * (v1 - v0); if (!best || ar < best.ar) best = { ar, cs, sn, u0, u1, v0, v1 }; }
      let { cs, sn, u0, u1, v0, v1 } = best; if (v1 - v0 > u1 - u0) { [cs, sn] = [-sn, cs]; [u0, u1, v0, v1] = [v0, v1, -u1, -u0]; }   // ridge along u
      const W = (u1 - u0) + .8, D2 = (v1 - v0) + .8, uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, rise = Math.tan((35 + R() * 10) * Math.PI / 180) * D2 / 2;
      const w2 = (u, v, y) => [u * cs - v * sn, y, u * sn + v * cs];
      const e0 = w2(uc - W / 2, vc - D2 / 2, y1), e1 = w2(uc + W / 2, vc - D2 / 2, y1), e2 = w2(uc + W / 2, vc + D2 / 2, y1), e3 = w2(uc - W / 2, vc + D2 / 2, y1);
      const r0 = w2(uc - W / 2, vc, y1 + rise), r1 = w2(uc + W / 2, vc, y1 + rise);
      quad(roofs, e0, r0, r1, e1, rc); quad(roofs, e2, r1, r0, e3, rc);
      tri(walls, w2(uc - W / 2 + .4, vc - D2 / 2 + .4, y1), w2(uc - W / 2 + .4, vc + D2 / 2 - .4, y1), w2(uc - W / 2 + .4, vc, y1 + rise - .3), wc);
      tri(walls, w2(uc + W / 2 - .4, vc + D2 / 2 - .4, y1), w2(uc + W / 2 - .4, vc - D2 / 2 + .4, y1), w2(uc + W / 2 - .4, vc, y1 + rise - .3), wc);
    } else {                                                        // a flat roof, a little darker, with a parapet line
      const shape = new THREE.Shape(ps.map(([x, z]) => new THREE.Vector2(x, -z))), sg = new THREE.ShapeGeometry(shape); sg.rotateX(-Math.PI / 2); sg.translate(0, y1, 0);
      const p = sg.attributes.position, idx = sg.index.array, flat = [];
      for (const k of idx) flat.push(p.getX(k), p.getY(k), p.getZ(k));
      push(roofs, flat, new THREE.Color('#8e9092').offsetHSL(0, 0, (R() - .5) * .08), null);
    }
  }
  const toGeo = (arr, withUv) => {
    let n = 0; for (const a of arr) n += a.pos.length / 3;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = withUv ? new Float32Array(n * 2) : null; let o = 0;
    for (const a of arr) { pos.set(a.pos, o * 3); for (let k = 0; k < a.pos.length / 3; k++) { col.set([a.col.r, a.col.g, a.col.b], (o + k) * 3); if (uv) { uv[(o + k) * 2] = a.uv ? a.uv[k * 2] : 0; uv[(o + k) * 2 + 1] = a.uv ? a.uv[k * 2 + 1] : 0; } } o += a.pos.length / 3; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals(); return geo;
  };
  const wm = new THREE.Mesh(toGeo(walls, true), new THREE.MeshStandardMaterial({ vertexColors: true, map: winTex, roughness: .85, side: THREE.DoubleSide }));
  const rm = new THREE.Mesh(toGeo(roofs, false), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, side: THREE.DoubleSide }));
  for (const m of [wm, rm]) { m.castShadow = m.receiveShadow = true; scene.add(m); }

  // ---------- trees: woods, gardens, rows, single ones ----------
  // a crown: a few overlapping lobes, smooth, a little lumpy (three variants, chosen per tree)
  const lobe = (() => { const g = mergeVertices(new THREE.IcosahedronGeometry(1, 3)); g.deleteAttribute('normal'); g.deleteAttribute('uv'); return mergeVertices(g); })();
  const crowns = [0, 1, 2].map(v => { const q = rng(71 + v), parts = [];
    for (let k = 0; k < 5; k++) { const g = lobe.clone(), p = g.attributes.position, s = .55 + q() * .35, a = q() * 6.3, r = k ? .45 + q() * .25 : 0, y = k ? (q() - .3) * .5 : .1;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), z = p.getZ(i), n = 1 + .28 * (noise2(x * 2.2 + v * 7 + k, z * 2.2 + yy * 1.7) - .5); p.setXYZ(i, x * s * n + Math.cos(a) * r, yy * s * n * .92 + y, z * s * n + Math.sin(a) * r); }
      parts.push(g); }
    const g = mergeGeometries(parts); g.computeVertexNormals(); return g; });
  const cone = (() => { const g = new THREE.ConeGeometry(1, 1, 14, 6); g.translate(0, .5, 0); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + .18 * Math.sin(y * 34) * (1 - y); p.setXYZ(i, x * k, y, z * k); } g.computeVertexNormals(); return g; })();
  const trunk = new THREE.CylinderGeometry(.12, .16, 1, 6); trunk.translate(0, .5, 0);
  const trees = [];                                                 // [x, z, height, crown radius, conifer]
  const addTree = (x, z, hMin = 8, hMax = 18, con = .15) => { const h = hMin + R() * (hMax - hMin); trees.push([x, z, h, h * (.26 + R() * .12), R() < con]); };
  const bpolys = D.buildings.map(b => b.p);
  const inBuilding = (x, z) => bpolys.some(ps => Math.abs(ps[0][0] - x) < 60 && Math.abs(ps[0][1] - z) < 60 && inPoly(x, z, ps));
  for (const a of D.areas) {
    if (!['forest', 'wood', 'scrub', 'orchard', 'park', 'cemetery'].includes(a.kind)) continue;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of a.p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const d0 = Math.max(0, Math.hypot(Math.max(x0, Math.min(0, x1)), Math.max(z0, Math.min(0, z1))));
    const step = (a.kind === 'orchard' ? 7 : a.kind === 'park' || a.kind === 'cemetery' ? 14 : 5.5) * (1 + d0 / 500);
    for (let x = x0; x < x1; x += step) for (let z = z0; z < z1; z += step) { const jx = x + (R() - .5) * step, jz = z + (R() - .5) * step; if (inPoly(jx, jz, a.p)) addTree(jx, jz, a.kind === 'orchard' ? 3 : 10, a.kind === 'orchard' ? 5 : a.kind === 'scrub' ? 6 : 22, a.kind === 'forest' ? .3 : .08); }
  }
  for (const b of D.buildings) { if (Math.abs(area(b.p)) > 400 || R() < .3) continue; const [cx, cz] = b.p[0]; for (let t = 0; t < 2; t++) { const x = cx + (R() - .5) * 30, z = cz + (R() - .5) * 30; if (!inBuilding(x, z)) addTree(x, z, 5, 13, .25); } }
  for (const r of D.roads) if (r.kind === 'tree_row') for (let i = 0; i < r.p.length - 1; i++) { const [a, b] = [r.p[i], r.p[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s < L; s += 9) addTree(a[0] + (b[0] - a[0]) * s / L, a[1] + (b[1] - a[1]) * s / L, 9, 16, 0); }
  for (const [x, z] of D.trees) addTree(x, z, 7, 16, .1);
  for (const r of D.rails) for (let i = 0; i < r.p.length - 1; i++) { const [a, b] = [r.p[i], r.p[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s < L; s += 12) if (R() < .45) { const t = s / L, n = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L], side = R() < .5 ? -1 : 1, off = 9 + R() * 6; addTree(a[0] + (b[0] - a[0]) * t + n[0] * side * off, a[1] + (b[1] - a[1]) * t + n[1] * side * off, 5, 12, .1); } }
  // far woods, as far as the eye makes out trees (about 5 km)
  { const fd = D._farForest, F = D._F, M = D._M;
    for (let i = 0; i < 90000; i++) { const r = NEAR + Math.sqrt(R()) * 3600, a = R() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r, u = Math.floor(F(x)), v = Math.floor(F(z)), k = (v * M + u) * 4;
      if (fd[k + 1] < 100 && fd[k] < 80) addTree(x, z, 14, 24, .3); } }
  const near = trees.filter(t => Math.hypot(t[0], t[1]) < 5200 && !(Math.hypot(t[0], t[1]) < 16));
  log(`trees ${near.length}`);
  const dMat = new THREE.MeshStandardMaterial({ roughness: .95 }), cMat = new THREE.MeshStandardMaterial({ roughness: .95 }), tMat = new THREE.MeshStandardMaterial({ color: '#4a3b2e', roughness: 1 });
  const dec = near.filter(t => !t[4]), con = near.filter(t => t[4]);
  const im = (geo, mat, list, fn) => { const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(), c = new THREE.Color();
    list.forEach((t, i) => { fn(o, t); o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.setHSL(.24 + (R() - .5) * .07, .38 + R() * .2, .2 + R() * .1); m.setColorAt(i, c); });
    m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
  for (let v = 0; v < 3; v++) im(crowns[v], dMat, dec.filter((t, i) => i % 3 === v), (o, t) => { const y = H(t[0], t[1]); o.position.set(t[0], y + t[2] - t[3] * .95, t[1]); o.scale.set(t[3], t[3] * 1.05, t[3]); o.rotation.set(0, R() * 6, 0); });
  im(cone, cMat, con, (o, t) => { const y = H(t[0], t[1]); o.position.set(t[0], y + t[2] * .18, t[1]); o.scale.set(t[3] * .7, t[2] * .85, t[3] * .7); o.rotation.set(0, R() * 6, 0); });
  const nearT = near.filter(t => Math.hypot(t[0], t[1]) < 600);
  im(trunk, tMat, nearT, (o, t) => { const y = H(t[0], t[1]); o.position.set(t[0], y - .3, t[1]); o.scale.set(t[3] * .5, t[2] * (t[4] ? .3 : .55), t[3] * .5); });

  // ---------- the railway in 3D near the flat: rails and sleepers on the ballast ----------
  { const parts = [];
    for (const r of D.rails) for (let i = 0; i < r.p.length - 1; i++) { const [a, b] = [r.p[i], r.p[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Math.min(Math.hypot(...a), Math.hypot(...b)) > 700) continue;
      const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, nx = -dz, nz = dx;
      for (const off of [-.72, .72]) { const g2 = new THREE.BoxGeometry(L, .15, .08); g2.rotateY(-Math.atan2(dz, dx)); g2.translate((a[0] + b[0]) / 2 + nx * off, (H(...a) + H(...b)) / 2 + .25, (a[1] + b[1]) / 2 + nz * off); parts.push(g2); } }
    if (parts.length) { const m = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ color: '#6a625c', roughness: .5, metalness: .6 })); scene.add(m); } }

  sky();
  return D;
}

// ---------- render the cube, unwrap it ----------
async function render() {
  await build();
  const cam = new THREE.CubeCamera(.5, 40000, new THREE.WebGLCubeRenderTarget(3072, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }));
  cam.position.set(0, EYE, 0); scene.add(cam);
  sun.target.position.set(0, 0, 0); sun.position.copy(SUN).multiplyScalar(1200);
  log('rendering the cube…'); await new Promise(r => setTimeout(r, 30));
  cam.update(renderer, scene);
  const W = SIZE, Hh = SIZE / 2, rt = new THREE.WebGLRenderTarget(W, Hh), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { env: { value: cam.renderTarget.texture }, exposure: { value: 1.0 } }, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `varying vec2 vUv; uniform samplerCube env; uniform float exposure;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main(){ float phi = (vUv.x - .5) * 6.28318530718, th = (vUv.y - .5) * 3.14159265359;
        vec3 d = vec3(cos(th) * cos(phi), sin(th), cos(th) * sin(phi));   // the inverse of three's equirectangular lookup
        gl_FragColor = vec4(srgb(aces(textureCube(env, d).rgb * exposure)), 1.); }` }));
  q.frustumCulled = false; const qs = new THREE.Scene(); qs.add(q); const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  renderer.setRenderTarget(rt); renderer.render(qs, qc); renderer.setRenderTarget(null);
  log('reading back…'); await new Promise(r => setTimeout(r, 30));
  const px = new Uint8Array(W * Hh * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, Hh, px);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const cx = cv.getContext('2d', { willReadFrequently: true }), img = cx.createImageData(W, Hh);
  for (let y = 0; y < Hh; y++) img.data.set(px.subarray((Hh - 1 - y) * W * 4, (Hh - y) * W * 4), y * W * 4);
  cx.putImageData(img, 0, 0);
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .9));
  log(`panorama ${W} x ${Hh}, ${(blob.size / 1e6).toFixed(1)} MB`);
  if (POST) { await fetch(POST, { method: 'POST', body: blob }); log('sent'); }
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = MODE === 'real' ? 'view-real.jpg' : 'view.jpg'; a.click(); }
  // a preview on the page: the panorama itself
  document.body.style.background = `#000 url(${URL.createObjectURL(blob)}) center / contain no-repeat`; renderer.domElement.style.display = 'none';
  window.DONE = true;
}
render().catch(e => { log('failed: ' + e.message); console.error(e); window.DONE = 'error'; });
