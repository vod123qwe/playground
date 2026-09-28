// Floor finishes, drawn once into canvases at real scale.
//  - EGGER Herringbone EL2152 Dąb Casella naturalny: planks 840 x 168 mm, 4-sided V-groove, Deepskin (natural pore) surface.
//    The wood is the CC0 "Oak Veneer 01" scan from Poly Haven (2048 px = 140 cm), cut plank by plank, warmed to the Casella tone.
//  - Tiles "60 x 60" (rectified 59.7 / 59.8 cm) with a 2 mm joint: Ceramika Gres Granby Beige (taupe stone, cream and ochre veins, matt "natura")
//    and Domino Bihara Beige (light cream stone, soft clouds, matt). Drawn procedurally in the products' colours.
// Every map tiles seamlessly: the herringbone repeats every 10 plank widths (168 cm), the tiles every 2 x 2 tiles.

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hash = (a, b, c) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) | 0;

// a veneer scan with its grain along y, plus the same turned a quarter (grain along x); a normal map turns its vectors too
function turned(img, isNormal) {
  const w = img.width, h = img.height, c = canvas(h, w), g = c.getContext('2d');
  g.translate(h, 0); g.rotate(Math.PI / 2); g.drawImage(img, 0, 0);
  if (isNormal) {                                                    // a quarter turn clockwise: (nx, ny) -> (ny, -nx)
    const d = g.getImageData(0, 0, h, w), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const r = p[i], gg = p[i + 1]; p[i] = gg; p[i + 1] = 255 - r; }
    g.putImageData(d, 0, 0);
  }
  return c;
}
function tinted(img, mul, calm) {                                    // towards Casella: a touch warmer, and a calmer figure than the veneer scan
  const c = canvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  let m = [0, 0, 0]; for (let i = 0; i < p.length; i += 4) { m[0] += p[i]; m[1] += p[i + 1]; m[2] += p[i + 2]; } m = m.map(v => v / (p.length / 4));
  for (let i = 0; i < p.length; i += 4) for (let ch = 0; ch < 3; ch++) p[i + ch] = Math.min(255, (p[i + ch] + (m[ch] - p[i + ch]) * calm) * mul[ch]);
  g.putImageData(d, 0, 0); return c;
}

export async function herringbone({ base = '', hq = true } = {}) {
  const [oc, on, or] = await Promise.all(['oak_diff.jpg', 'oak_nor.jpg', 'oak_rough.jpg'].map(f => loadImg(base + f)));
  const W = 16.8, L = 84, P = hq ? 336 : 168, N = hq ? 4096 : 2048, R = N / P;   // about 1.2 px per mm
  const OAK = oc.width / 140;                                        // px per cm in the scan
  const cV = tinted(oc, [1.04, 1.0, .94], .28), cH = turned(cV), nV = on, nH = turned(on, true), rV = or, rH = turned(or);
  const col = canvas(N, N), nor = canvas(N, N), rou = canvas(N, N);
  const gc = col.getContext('2d'), gn = nor.getContext('2d'), gr = rou.getContext('2d');
  gn.fillStyle = 'rgb(128,128,255)'; gn.fillRect(0, 0, N, N);
  gr.fillStyle = 'rgb(182,182,182)'; gr.fillRect(0, 0, N, N);   // Deepskin is matt: roughness about .7, the pores a little rougher
  // the lattice: a horizontal and a vertical plank per step t1 = (W, W), rows every t2 = (L, -L); (P, 0) and (0, P) are lattice steps too
  const planks = [];
  const K = Math.ceil(P / W) + 12, Mx = Math.ceil(P / L) + 4;
  for (let k = -K; k <= K; k++) for (let m = -Mx; m <= Mx; m++) {
    const ox = k * W + m * L, oy = k * W - m * L;
    planks.push([ox, oy, L, W, 1], [ox - W, oy, W, L, 0]);
  }
  const mod = (a, b) => ((a % b) + b) % b;
  const drawn = [];
  for (const [x, y, w, h, horiz] of planks) for (const sx of [-P, 0, P]) for (const sy of [-P, 0, P]) {
    const X = x + sx, Y = y + sy;
    if (X > P || Y > P || X + w < 0 || Y + h < 0) continue;
    const r = rng(hash(Math.round(mod(x, P) * 10), Math.round(mod(y, P) * 10), horiz));   // the same plank wherever it wraps
    const src = horiz ? cH : cV, ns = horiz ? nH : nV, rs = horiz ? rH : rV;
    const sw = w * OAK, sh = h * OAK, cx = r() * (src.width - sw), cy = r() * (src.height - sh);
    const dx = X * R, dy = Y * R, dw = w * R, dh = h * R;
    gc.drawImage(src, cx, cy, sw, sh, dx, dy, dw, dh);
    const v = r() - .5;                                              // each plank a shade lighter or deeper, like a real batch
    gc.globalAlpha = Math.abs(v) * (v > 0 ? .16 : .22); gc.fillStyle = v > 0 ? '#fff4e2' : '#6b4a2c'; gc.fillRect(dx, dy, dw, dh); gc.globalAlpha = 1;
    gn.drawImage(ns, cx, cy, sw, sh, dx, dy, dw, dh);
    const k2 = rs.width / src.width;
    gr.globalAlpha = .35; gr.drawImage(rs, cx * k2, cy * k2, sw * k2, sh * k2, dx, dy, dw, dh); gr.globalAlpha = 1;
    drawn.push([dx, dy, dw, dh]);
  }
  // the 4V micro-bevel: a soft dark line in the colour, sloped edges in the normal map, and a rougher joint
  const b = Math.max(1.5, 1.4 * R / 10);                             // about 1.4 mm each side
  for (const [dx, dy, dw, dh] of drawn) {
    gc.fillStyle = 'rgba(92,62,36,.2)';
    gc.fillRect(dx, dy, dw, b * .6); gc.fillRect(dx, dy + dh - b * .6, dw, b * .6); gc.fillRect(dx, dy, b * .6, dh); gc.fillRect(dx + dw - b * .6, dy, b * .6, dh);
    gn.fillStyle = 'rgb(128,200,225)'; gn.fillRect(dx, dy, dw, b);            // top edge slopes towards +v
    gn.fillStyle = 'rgb(128,56,225)'; gn.fillRect(dx, dy + dh - b, dw, b);
    gn.fillStyle = 'rgb(56,128,225)'; gn.fillRect(dx, dy, b, dh);
    gn.fillStyle = 'rgb(200,128,225)'; gn.fillRect(dx + dw - b, dy, b, dh);
    gr.fillStyle = 'rgb(225,225,225)'; gr.fillRect(dx, dy, dw, b * .6); gr.fillRect(dx, dy + dh - b * .6, dw, b * .6); gr.fillRect(dx, dy, b * .6, dh); gr.fillRect(dx + dw - b * .6, dy, b * .6, dh);
  }
  return { col, nor, rou, period: P };
}

// ---------- stone-look tiles ----------
function noiseField(n, seed, cells) {                                // periodic value noise on an n x n grid
  const r = rng(seed), g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(n * n), s = cells / n;
  for (let y = 0; y < n; y++) {
    const fy = y * s, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), ya = y0 % cells, yb = (y0 + 1) % cells;
    for (let x = 0; x < n; x++) {
      const fx = x * s, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), xa = x0 % cells, xb = (x0 + 1) % cells;
      const a = g[ya * cells + xa], b = g[ya * cells + xb], c = g[yb * cells + xa], d = g[yb * cells + xb];
      out[y * n + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }
  }
  return out;
}
function fbm(n, seed, base, oct) {
  const out = new Float32Array(n * n); let amp = .5, tot = 0;
  for (let o = 0; o < oct; o++) { const f = noiseField(n, seed + o * 101, base << o); for (let i = 0; i < out.length; i++) out[i] += f[i] * amp; tot += amp; amp *= .5; }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
const LOOK = {
  granby: { tile: 59.7, cool: [150, 143, 133], warm: [181, 164, 140], vein: [214, 201, 180], ochre: [186, 150, 100], joint: [146, 137, 124], veins: 1, cloud: 1 },
  bihara: { tile: 59.8, cool: [210, 197, 175], warm: [229, 219, 201], vein: [233, 224, 207], ochre: [214, 199, 172], joint: [204, 196, 182], veins: 0, cloud: .7 },
};
export function stoneTiles(kind, { hq = true } = {}) {
  const lk = LOOK[kind], T = lk.tile + .2, P = 2 * T, N = hq ? 2048 : 1024, R = N / P, n = 512;   // rectified size + a 2 mm joint; the map holds 2 x 2 tiles
  const sd0 = kind === 'granby' ? 11 : 23;
  const clouds = fbm(n, sd0, 3, 5), mottle = fbm(n, sd0 + 26, 10, 4), warp = fbm(n, sd0 + 50, 4, 4), warp2 = fbm(n, sd0 + 77, 6, 3);
  const small = canvas(n, n), sg = small.getContext('2d'), sd = sg.createImageData(n, n), p = sd.data, TAU = Math.PI * 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, c = clouds[i], m = mottle[i], u = x / n, v = y / n;
    // veins: sines with whole cycles across the map (so it tiles), bent by noise; |sin| sharpened gives long thin lines at about 35-60 degrees
    const s1 = Math.abs(Math.sin(TAU * (3 * u + 2 * v) + warp[i] * 9)), s2 = Math.abs(Math.sin(TAU * (1 * u + 4 * v) + warp2[i] * 11));
    const vein = (Math.pow(1 - s1, 40) * .9 + Math.pow(1 - s2, 60) * .55) * lk.veins * Math.min(1, Math.max(0, (warp2[i] - .3) * 2.5));
    const ochre = Math.pow(1 - s1, 14) * lk.veins * Math.max(0, (m - .55) * 2.2) * .5;
    const t = Math.min(1, Math.max(0, (c - .3) * 2.4)), mm = (m - .5) * .18 * lk.cloud;
    for (let ch = 0; ch < 3; ch++) {
      let val = lk.cool[ch] + (lk.warm[ch] - lk.cool[ch]) * (.5 + (t - .5) * lk.cloud);
      val *= 1 + mm;
      val = val + (lk.ochre[ch] - val) * Math.min(1, ochre);
      val = val + (lk.vein[ch] - val) * Math.min(1, vein);
      p[i * 4 + ch] = val;
    }
    p[i * 4 + 3] = 255;
  }
  sg.putImageData(sd, 0, 0);
  const col = canvas(N, N), gc = col.getContext('2d');
  gc.imageSmoothingQuality = 'high'; gc.drawImage(small, 0, 0, N, N);
  // a fine grain on top
  const d = gc.getImageData(0, 0, N, N), q = d.data, rr = rng(kind === 'granby' ? 5 : 9);
  for (let i = 0; i < q.length; i += 4) { const e = (rr() - .5) * 7; q[i] += e; q[i + 1] += e; q[i + 2] += e * .9; }
  gc.putImageData(d, 0, 0);
  const nor = canvas(N, N), gn = nor.getContext('2d'); gn.fillStyle = 'rgb(128,128,255)'; gn.fillRect(0, 0, N, N);
  const rou = canvas(N, N), gr = rou.getContext('2d'); gr.fillStyle = 'rgb(205,205,205)'; gr.fillRect(0, 0, N, N);
  const J = .2 * R, e = Math.max(1, .15 * R);                        // a 2 mm joint, the tile edges eased 1.5 mm
  gc.fillStyle = `rgb(${lk.joint.join(',')})`; gr.fillStyle = 'rgb(245,245,245)';
  for (const k of [0, 1, 2]) {
    const a = k * T * R;
    for (const g of [gc, gr]) { g.fillRect(a - J / 2, 0, J, N); g.fillRect(0, a - J / 2, N, J); }
    gn.fillStyle = 'rgb(200,128,225)'; gn.fillRect(a - J / 2 - e, 0, e, N);   // the edge left of a joint slopes towards it
    gn.fillStyle = 'rgb(56,128,225)'; gn.fillRect(a + J / 2, 0, e, N);
    gn.fillStyle = 'rgb(128,56,225)'; gn.fillRect(0, a - J / 2 - e, N, e);
    gn.fillStyle = 'rgb(128,200,225)'; gn.fillRect(0, a + J / 2, N, e);
  }
  return { col, nor, rou, period: P };
}
