// What is written on the picture, in its own pixels: a canvas the size of the low-resolution picture laid over it (so its pixels
// are the game's pixels), a 3 x 5 pixel font, and: the throw's power (a small bar over his head while a throw is held), "HAU!" over
// a barking dog, "+1" and "+2" rising where a paper scored, the papers left and the points in a corner; and when a window goes,
// a speech bubble of swearing (@#$%&!) from the house: it pops up over the window (or, the window out of sight, in the corner on its
// side), its signs shaking with rage, and blinks away. A paper in a mailbox is the other way round: praise from the house's window,
// a bubble of thanks with a heart, and small hearts floating up out of it, swaying.

const FONT = {                                                          // 3 x 5, row by row, 1 = ink
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
  O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', W: '101101111111101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001',
  '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '+': '000010111010000', '!': '010010010000010',
  ':': '000010000010000', ',': '000000000010100', '"': '101101000000000', '.': '000000000000010', '-': '000000111000000', ' ': '000000000000000', '/': '001001010100100',
  'X': '101101010101101', 'V': '101101101101010', 'Q': '010101101110011', '(': '010100100100010', ')': '010001001001010', '%': '101001010100101', '↑': '010111010010010', '↓': '010010010111010', '←': '010110111110010', '→': '010011111011010', '·': '000000010000000', '@': '010101111100011', '#': '101111101111101', '$': '011110010011110', '%': '101001010100101', '&': '010101010101011', '*': '101010111010101', '?': '110001010000010',
};

export function createHud() {
  const cv = document.createElement('canvas'); cv.id = 'hudpx'; Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 2 });
  document.body.appendChild(cv); let g = cv.getContext('2d');
  const pops = [], rants = [], praises = [], hearts = [], impacts = [];
  const SWEAR = '@#$%&*!?';
  const MARK = { 'Ą': ['A', [[2, 5]]], 'Ć': ['C', [[2, -1]]], 'Ę': ['E', [[2, 5]]], 'Ł': ['L', [[1, 2]]], 'Ń': ['N', [[2, -1]]], 'Ó': ['O', [[2, -1]]], 'Ś': ['S', [[2, -1]]], 'Ź': ['Z', [[2, -1]]], 'Ż': ['Z', [[1, -1]]] };
  const glyphs = new Map();
  function glyph(ch) {                                                 // → [[column, row], ...]
    if (glyphs.has(ch)) return glyphs.get(ch);
    const [base, extra] = MARK[ch] || [ch, []], f = FONT[base] || FONT[' '], out = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (f[r * 3 + c] === '1') out.push([c, r]);
    out.push(...extra); glyphs.set(ch, out); return out;
  }
  function text(s, x, y, col, shadow = '#17181b') {                  // (x, y: the top left; returns the width)
    s = s.toUpperCase(); let cx = x | 0;
    for (const ch of s) { for (const [c, r] of glyph(ch)) { if (shadow) { g.fillStyle = shadow; g.fillRect(cx + c, y + r + 1, 1, 1); } g.fillStyle = col; g.fillRect(cx + c, y + r, 1, 1); } cx += 4; }
    return cx - x;
  }
  const width = s => s.length * 4 - 1;
  function big(s, x, y, col, rim) {                                   // the font at twice the size, with a rim round it
    s = s.toUpperCase(); for (const pass of [0, 1]) { let cx = x; for (const ch of s) { for (const [c, r] of glyph(ch)) {
      if (pass === 0) { if (rim) { g.fillStyle = rim; g.fillRect(cx + c * 2 - 1, y + r * 2 - 1, 4, 4); } } else { g.fillStyle = col; g.fillRect(cx + c * 2, y + r * 2, 2, 2); } } cx += 8; } } }
  const HEART = ['01010', '11111', '11111', '01110', '00100'];            // 5 x 5
  function heart(x, y, col, shade) { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (HEART[r][c] === '1') { g.fillStyle = shade; g.fillRect(x + c, y + r + 1, 1, 1); } for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (HEART[r][c] === '1') { g.fillStyle = r === 1 && c === 1 ? '#f5d3ae' : col; g.fillRect(x + c, y + r, 1, 1); } }
  function resize(W, H) { cv.width = W; cv.height = H; g.imageSmoothingEnabled = false; }
  function pop(world, s, col) { pops.push({ p: world.clone(), s, col, t: 0 }); }
  function rant(world, say, follow, lift = 0) { let s = ''; for (let k = 0; k < 6 + (Math.random() * 3 | 0); k++) s += SWEAR[Math.random() * (SWEAR.length - 1) | 0]; s += '!';   // (say: words instead of the signs; follow: keep to the point as it moves)
    rants.push({ p: follow ? world : world.clone(), lift, s: say || s, t: 0, seed: Math.random() * 99 }); }
  const THANKS = ['DZIEKI!', 'SUPER!', 'BRAWO!', 'HURA!', 'KOCHAM!'];
  function praise(world) { praises.push({ p: world.clone(), s: THANKS[Math.random() * THANKS.length | 0], t: 0, seed: Math.random() * 9, sent: 0 }); }
  // a hit, drawn as a comic does it: a jagged star (black rim, red, yellow, a white heart), the word in it, lines flying off, sparks
  function impact(world, word = 'KOP!') { impacts.push({ p: world.clone(), t: 0, s: word, seed: Math.random() * 6.28, sparks: Array.from({ length: 5 }, () => ({ a: Math.random() * 6.28, v: 30 + Math.random() * 30 })) }); }
  function drawImpact(b, cx, cy) {
    const t = b.t, k = t < .07 ? t / .07 * 1.3 : t < .15 ? 1.3 - (t - .07) / .08 * .3 : t > .4 ? Math.max(0, 1 - (t - .4) / .14) : 1, R = 23 * k, r = 13 * k, n = 9;
    if (R < 1) return;
    const edge = a => { const u = ((a + b.seed) / 6.283 * n) % 1, tri = 1 - Math.abs(u * 2 - 1), j = .9 + .22 * Math.abs(Math.sin(Math.floor((a + b.seed) / 6.283 * n) * 7.3)); return (r + (R - r) * tri) * j; };
    const M = Math.ceil(R * 1.3 + 3);
    for (let y = -M; y <= M; y++) for (let x = -M; x <= M; x++) { const d = Math.hypot(x, y * 1.08), e = edge(Math.atan2(y, x));
      const col = d <= e * .45 ? '#f6f3ea' : d <= e ? '#efc970' : d <= e + 1.2 ? '#cf5a3e' : d <= e + 2.4 ? '#17181b' : null; if (col) { g.fillStyle = col; g.fillRect(cx + x, cy + y, 1, 1); } }
    if (t < .3) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + b.seed * .5, r0 = R + 4 + t * 30, r1 = r0 + 4; for (let q = r0; q < r1; q++) { g.fillStyle = i % 2 ? '#17181b' : '#f6f3ea'; g.fillRect(Math.round(cx + Math.cos(a) * q), Math.round(cy + Math.sin(a) * q * .87), 1, 1); } }
    for (const sp of b.sparks) { const q = 6 + sp.v * t, x = Math.round(cx + Math.cos(sp.a) * q), y = Math.round(cy + Math.sin(sp.a) * q - 20 * t * t); if (t < .45) { g.fillStyle = '#efc970'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
    if (k > .75) { const w = width(b.s) * 2; big(b.s, Math.round(cx - w / 2), Math.round(cy - 5), '#8e2e25', '#f6f3ea'); }
  }
  let overlay = null;                                                  // (something drawn over everything: the menu)
  const Q = { open: false, t: 0, sel: 1, hits: [], touch: false };      // (sel: 0 TAK, 1 NIE)
  function ask(open, touch) { if (open && !Q.open) { Q.t = 0; Q.sel = 1; } Q.open = open; Q.touch = !!touch; }
  function drawAsk(dt) {
    Q.t += dt; const W = cv.width, H = cv.height, k = Math.min(1, Q.t / .16), e = 1 - Math.pow(1 - k, 3);
    g.fillStyle = '#0c0d0f'; for (let y = 0; y < H; y++) for (let x = (y % 2); x < W; x += 2) if (k > .5 || (x + y * 3) % 4 === 0) g.fillRect(x, y, 1, 1);   // (a dither over the picture)
    const title = 'ZACZĄĆ OD NOWA?', narrow = W < width(title) * 2 + 40, subs = narrow ? ['PUNKTY I GAZETY', 'WRÓCĄ DO STARTU'] : ['PUNKTY I GAZETY WRÓCĄ DO STARTU'];   // (a narrow picture: a phone upright)
    const pw = Math.min(W - 6, Math.max(narrow ? width(title) : width(title) * 2, ...subs.map(width), 104) + (narrow ? 12 : 24)), ph = narrow ? 70 : 66;
    const x0 = Math.round((W - pw) / 2), y0 = Math.round((H - ph) / 2 - (1 - e) * 18);
    const panel = (x, y, w, h, fill, edge) => { g.fillStyle = '#17181b'; g.fillRect(x + 1, y - 1, w - 2, h + 2); g.fillRect(x - 1, y + 1, w + 2, h - 2); g.fillRect(x, y, w, h);   // (a rim, its corners cut)
      g.fillStyle = edge; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = fill; g.fillRect(x + 2, y + 2, w - 4, h - 4); };
    g.fillStyle = '#0c0d0f'; g.fillRect(x0 + 3, y0 + 4, pw, ph);                                        // its shadow
    panel(x0, y0, pw, ph, '#25272b', '#efc970'); g.fillStyle = '#33363a'; g.fillRect(x0 + 2, y0 + 2, pw - 4, 1);   // (a lit edge inside)
    if (narrow) text(title, Math.round(W / 2 - width(title) / 2), y0 + 9, '#f6f3ea'); else big(title, Math.round(W / 2 - width(title)), y0 + 9, '#f6f3ea', '#17181b');
    subs.forEach((l, k) => text(l, Math.round(W / 2 - width(l) / 2), y0 + (narrow ? 20 : 24) + k * 8, '#979a97', null));
    Q.hits = []; const bw = 40, bh = 16, gap = 12, by = y0 + (narrow ? 44 : 37), t = performance.now() / 1000;
    ['TAK', 'NIE'].forEach((w, i) => { const bx = Math.round(W / 2 + (i ? gap / 2 : -gap / 2 - bw)), on = Q.sel === i, press = on && ((t * 2) | 0) % 2 === 0 ? 0 : 0;
      g.fillStyle = '#0c0d0f'; g.fillRect(bx + 1, by + 2, bw, bh);                                      // (the button's shadow)
      panel(bx, by + press, bw, bh, on ? '#efc970' : '#33363a', on ? '#f6f3ea' : '#44484c');
      big(w, Math.round(bx + bw / 2 - width(w)), by + 3 + press, on ? '#17181b' : '#d3d0c3', null);
      if (on && ((t * 3) | 0) % 2) { const cx = bx - 6, cy = by + bh / 2; g.fillStyle = '#efc970'; for (let r = 0; r < 3; r++) g.fillRect(cx + r, cy - 2 + r, 1, 5 - r * 2); }   // a blinking pointer
      Q.hits.push({ x: bx - 2, y: by - 2, w: bw + 4, h: bh + 4, i }); });
    const hint = Q.touch ? 'DOTKNIJ WYBÓR' : narrow ? 'Y / N' : '← → WYBÓR · ENTER · Y / N'; text(hint, Math.round(W / 2 - width(hint) / 2), y0 + ph + 8, '#d3d0c3');
  }
  function askAt(px, py) { for (const h of Q.hits) if (px >= h.x && px < h.x + h.w && py >= h.y && py < h.y + h.h) return h.i; return -1; }   // (the picture's pixels → which button)
  // each frame: project: a world point to the picture's pixels (or null); state: { power (0..1, or -1), head (a world point), barks: [world points], papers, points }
  function draw(dt, project, st) {
    g.clearRect(0, 0, cv.width, cv.height);
    const ph = project(st.head);
    // where a bubble goes: straight over whoever says it (moved in only as much as it takes to be on the picture); one out of the
    // picture (or behind): at the edge on their side. Returns [bubble x, bubble y, seen, their x, their y]
    const anchor = (p, b) => { const W = cv.width, H = cv.height; let sx, sy;
      if (p) { sx = p.x; sy = p.y; } else { sx = (b.side || 1) > 0 ? W + 30 : -30; sy = H * .45; }
      const vis = sx > 2 && sx < W - 2 && sy > 8 && sy < H - 2; b.side = sx < W / 2 ? -1 : 1;
      return vis ? [sx, sy - 7, true, sx, sy] : [Math.max(18, Math.min(W - 18, sx)), Math.max(26, Math.min(H * .7, sy - 7)), false, sx, sy]; };
    // its tail: pointing at the speaker (a short stepped stroke); the speaker out of sight: a blinking arrow at the bubble's edge, their way
    const tail = (x, y, w, h, sx, sy, vis, fill, t) => {
      if (vis) { const bx = Math.max(x + 3, Math.min(x + w - 4, Math.round(sx))), by = y + h, dx = sx - bx, dy = sy - 3 - by, L = Math.min(Math.hypot(dx, dy) - 2, 28);
        if (L < 1) return; const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
        for (const [col, wd] of [['#17181b', 4], [fill, 2]]) for (let q = 0; q <= L; q++) { const r = Math.max(1, Math.round(wd * (1 - q / (L + 2)))); g.fillStyle = col; g.fillRect(Math.round(bx + ux * q - r / 2), Math.round(by - 1 + uy * q - r / 2), r, r); }
        return; }
      if (((t * 4) | 0) % 2) return; const cx = x + w / 2, cy = y + h / 2, dx = sx - cx, dy = sy - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const ex = cx + ux * (w / 2 + 3) * Math.min(1, Math.abs(ux) * 2 + .3), ey = cy + uy * (h / 2 + 3);
      for (let q = 0; q < 5; q++) for (let r = -q; r <= q; r++) { g.fillStyle = q === 4 || Math.abs(r) === q ? '#17181b' : '#efc970'; g.fillRect(Math.round(ex + ux * (5 - q) - uy * r * .6), Math.round(ey + uy * (5 - q) + ux * r * .6), 1, 1); } };
    if (st.power >= 0) { const p = project(st.head); if (p) { const w = 26, x = Math.round(p.x - w / 2), y = Math.round(p.y - 7);
      g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1, w + 2, 5); g.fillStyle = '#44484c'; g.fillRect(x, y, w, 3);
      const n = Math.round(w * st.power); for (let i = 0; i < n; i++) { g.fillStyle = i < w * .45 ? '#efc970' : i < w * .8 ? '#e08556' : '#cf5a3e'; g.fillRect(x + i, y, 1, 3); }
      g.fillStyle = 'rgba(246,243,234,.9)'; g.fillRect(x, y, Math.max(0, n - 1), 1);                                      // a glint on its top
      for (let i = 1; i < 4; i++) { g.fillStyle = '#17181b'; g.fillRect(x + Math.round(w * i / 4), y + 2, 1, 1); } } }        // ticks
    if (st.rattled > .8) { const p = project(st.head); if (p) { const t = performance.now() / 1000, k = (st.rattled - .8) / .2, on = ((t * (10 + k * 10)) | 0) % 2;   // about to go: a red burst behind the marks, pulsing
      const cx = Math.round(p.x), cy = Math.round(p.y - 3), R = 7 + Math.round(k * 3) + on;
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + t * 2, r = i % 2 ? R * .55 : R; for (let j = 0; j < r; j++) { g.fillStyle = on ? '#cf5a3e' : '#8e2e25'; g.fillRect(cx + Math.round(Math.cos(a) * j), cy + Math.round(Math.sin(a) * j * .8), 2, 1); } }
      g.fillStyle = on ? '#efc970' : '#cf5a3e'; g.fillRect(cx - 2, cy - 2, 5, 4); } }
    if (st.rattled > 0) { const p = project(st.head); if (p) { const n = st.rattled > .66 ? 3 : st.rattled > .33 ? 2 : 1, t = performance.now() / 1000, fast = 4 + st.rattled * 10;
      for (let i = 0; i < n; i++) { const a = n === 1 ? 0 : -.7 + i * 1.4 / (n - 1), jx = Math.round(Math.sin(t * fast * 3 + i) * st.rattled), x = Math.round(p.x + Math.sin(a) * 9) + jx, y = Math.round(p.y + 3 - Math.cos(a) * 4 - Math.abs(Math.sin(t * fast + i)) * 2);
        const hot = st.rattled > .8, col = hot ? (((t * 16) | 0) % 2 ? '#f6f3ea' : '#cf5a3e') : st.rattled > .66 && ((t * 8) | 0) % 2 ? '#cf5a3e' : '#efc970';
        if (!hot) text('!', x - 1, y, col);
        else { const bx = x - 1 + Math.round(Math.sin(t * 50 + i * 2)), by = y - 9 + Math.round(Math.cos(t * 43 + i));   // (big, shaking, flashing white and red)
          g.fillStyle = '#17181b'; g.fillRect(bx - 1, by - 1, 4, 8); g.fillRect(bx - 1, by + 8, 4, 4); g.fillStyle = col; g.fillRect(bx, by, 2, 6); g.fillRect(bx, by + 9, 2, 2); } }
      g.fillStyle = '#9ccad8'; g.fillRect(Math.round(p.x + 7), Math.round(p.y + 10 + (t * 6 % 3)), 1, 2); g.fillRect(Math.round(p.x + 6), Math.round(p.y + 11 + (t * 6 % 3)), 3, 1); } }   // (and a drop of sweat)
    // tired: drops of sweat flying off him, puffs of breath behind; spent: wavy lines over his head too
    if (st.tired > .05) { const p = project(st.head); if (p) { const t = performance.now() / 1000, n = Math.ceil(st.tired * 3);
      for (let i = 0; i < n; i++) { const ph = (t * 1.5 + i / n) % 1, sd = i % 2 ? 1 : -1, x = Math.round(p.x + sd * (5 + ph * 9)), y = Math.round(p.y + 9 - ph * 5 + ph * ph * 12);
        g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1, 3, 4); g.fillStyle = '#9ccad8'; g.fillRect(x, y - 1, 1, 1); g.fillRect(x - 1, y, 3, 2); g.fillStyle = '#f6f3ea'; g.fillRect(x - 1, y, 1, 1); }
      if (st.tired > .45) { const ph = (t * 1.1) % 1; if (ph < .8) { const x = Math.round(p.x + 8 + ph * 10), y = Math.round(p.y + 14 - ph * 6), c = ph < .5 ? '#f6f3ea' : '#d3d0c3';
        g.fillStyle = c; g.fillRect(x, y, 3, 2); g.fillRect(x + 2, y - 1, 3, 3); g.fillRect(x + 4, y, 2, 2); } }            // a puff of breath
      if (st.spent) for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const x = Math.round(p.x - 4 + i), y = Math.round(p.y - 4 - k * 3 - ((t * 3) % 1) * 2 + Math.round(Math.sin(i * 1.4 + t * 8 + k))); g.fillStyle = k ? '#d3d0c3' : '#f6f3ea'; g.fillRect(x, y, 1, 1); } } }
    for (const b of st.barks) { const p = project(b); if (p) text('HAU!', Math.round(p.x - 7), Math.round(p.y - 8), '#f6f3ea'); }
    for (let k = pops.length - 1; k >= 0; k--) { const q = pops[k]; q.t += dt; const p = project(q.p); if (p && q.t < 1.2) { if (q.t > .9 && ((q.t * 20) | 0) % 2) continue; text(q.s, Math.round(p.x - width(q.s) / 2), Math.round(p.y - 10 - q.t * 14), q.col); } if (q.t >= 1.2) pops.splice(k, 1); }
    // the swearing: a bubble with its tail towards the house, springing up, shaking, blinking out
    const taken = [], clear = (x, y, w, h) => { for (let n = 0; n < 6; n++) { const o = taken.find(r => x < r[0] + r[2] + 2 && x + w + 2 > r[0] && y < r[1] + r[3] + 2 && y + h + 2 > r[1]); if (!o) break; y = o[1] - h - 3; } taken.push([x, y, w, h]); return Math.max(2, y); };   // (two at once: one steps up over the other, its tail longer)
    for (let k = rants.length - 1; k >= 0; k--) { const b = rants[k]; b.t += dt; if (b.t > 2.2) { rants.splice(k, 1); continue; }
      if (b.t > 1.85 && ((b.t * 18) | 0) % 2) continue;
      const W = cv.width, H = cv.height, tw = width(b.s), bw = tw + 8, bh = 11, p = project(b.lift ? b.p.clone().setY(b.p.y + b.lift) : b.p);
      const [ax, ay, seen, sx, sy] = anchor(p, b);
      const k0 = Math.min(1, b.t / .22), sc = k0 < 1 ? (1 - Math.pow(1 - k0, 3)) * 1.15 - Math.max(0, k0 - .7) * .5 : 1;   // (a little overshoot on the way up)
      const w = Math.max(3, Math.round(bw * sc)), h = Math.max(3, Math.round(bh * sc));
      let x = Math.round(ax - w / 2), y = Math.round(ay - h - 5 - (1 - sc) * 4); x = Math.max(2, Math.min(W - w - 2, x)); y = clear(x, Math.max(2, y), w, h);
      g.fillStyle = '#17181b'; g.fillRect(x - 1, y, w + 2, h); g.fillRect(x, y - 1, w, h + 2);                               // the outline (rounded corners)
      g.fillStyle = '#f6f3ea'; g.fillRect(x, y, w, h); g.fillStyle = '#d3d0c3'; g.fillRect(x, y + h - 1, w, 1);               // the bubble, its shaded bottom
      tail(x, y, w, h, sx, sy, seen, '#f6f3ea', b.t);
      if (sc > .9) { let cx = x + 4; for (let i = 0; i < b.s.length; i++) { const j = ((b.t * 16 + i * 3 + b.seed) | 0) % 3 - 1;   // each sign shaking on its own
        text(b.s[i], cx, y + 3 + (j > 0 ? 1 : 0) - (j < 0 ? 1 : 0), i === b.s.length - 1 ? '#cf5a3e' : '#8e2e25', null); cx += 4; } } }
    for (let k = impacts.length - 1; k >= 0; k--) { const b = impacts[k]; b.t += dt; if (b.t > .56) { impacts.splice(k, 1); continue; } const p = project(b.p); if (p) drawImpact(b, Math.round(p.x), Math.round(p.y)); }
    // the praise: a bubble springing up, bobbing gently, sending small hearts up; the hearts sway and blink out
    for (let k = praises.length - 1; k >= 0; k--) { const b = praises[k]; b.t += dt; if (b.t > 2.4) { praises.splice(k, 1); continue; }
      if (b.t > 2.05 && ((b.t * 18) | 0) % 2) continue;
      const W = cv.width, H = cv.height, p = project(b.p), [ax, ay, seen, sx, sy] = anchor(p, b);
      const k0 = Math.min(1, b.t / .25), sc = k0 < 1 ? (1 - Math.pow(1 - k0, 3)) * 1.12 - Math.max(0, k0 - .7) * .4 : 1;
      const bw = width(b.s) + 16, bh = 11, w = Math.max(3, Math.round(bw * sc)), h = Math.max(3, Math.round(bh * sc)), bob = Math.round(Math.sin(b.t * 5 + b.seed));
      let x = Math.round(ax - w / 2), y = Math.round(ay - h - 5 - (1 - sc) * 4) + bob; x = Math.max(2, Math.min(W - w - 2, x)); y = clear(x, Math.max(2, y), w, h);
      g.fillStyle = '#17181b'; g.fillRect(x - 1, y, w + 2, h); g.fillRect(x, y - 1, w, h + 2);
      g.fillStyle = '#f6f3ea'; g.fillRect(x, y, w, h); g.fillStyle = '#d3d0c3'; g.fillRect(x, y + h - 1, w, 1);
      tail(x, y, w, h, sx, sy, seen, '#f6f3ea', b.t);
      if (sc > .9) { const beat = ((b.t * 3) | 0) % 2; heart(x + 3, y + 3 - beat, '#cf5a3e', '#8e2e25'); text(b.s, x + 11, y + 3, '#467537', null); }
      if (b.t > .25 && b.t < 1.6 && b.t - b.sent > .22) { b.sent = b.t; hearts.push({ x: x + 5 + Math.random() * (w - 10), y: y - 8, t: 0, ph: Math.random() * 6, v: 9 + Math.random() * 6 }); } }
    for (let k = hearts.length - 1; k >= 0; k--) { const q = hearts[k]; q.t += dt; if (q.t > 1.3) { hearts.splice(k, 1); continue; } if (q.t > 1 && ((q.t * 20) | 0) % 2) continue;
      heart(Math.round(q.x + Math.sin(q.t * 6 + q.ph) * 2.5), Math.round(q.y - q.t * q.v), q.t < .5 ? '#e08556' : '#cf5a3e', '#5e1c17'); }
    // top right: the papers left, and the money in a purse (see purse())
    { const k = cv.width / Math.max(1, innerWidth); purse(dt, st.points, cv.width - Math.round(12 * k) - 2, Math.round(10 * k) + 2, st.papers); }
    if (st.bagX != null) { const s = String(st.papers); outlined(s, Math.round(st.bagX * cv.width) - width(s) - 4, cv.height - 11, st.papers ? '#f6f3ea' : '#cf5a3e'); }   // (how many papers, by the bag)
    if (splats.length) drawBlood(dt, st.low || 0);
    if (st.fight) fightBars(st.fight);
    if (st.bike) bikeArrow(st.bike, project, dt);
    if (tipText) drawTip();
    if (st.star) aimStar(st.star, dt); else if (st.cross) { const cx = cv.width >> 1, cy = cv.height >> 1; g.fillStyle = '#17181b'; g.fillRect(cx - 1, cy - 1, 3, 3); g.fillStyle = '#f6f3ea'; g.fillRect(cx, cy, 1, 1); }
    if (Q.open) drawAsk(dt);
    if (overlay) overlay(dt);
  }
  // the money: a grandma's purse, the kind with a brass frame and two little balls that snap shut, in a flowered tapestry. When money
  // comes in, it opens (its back jaw rising, the dark inside showing), coins drop into it one by one, it gives a little bounce at
  // each, the sum counts up with them; then it snaps shut. Money taken (robbed, fined): it opens and coins fly out of it.
  // Beside it the papers left (a roll, their number), and the sum in złoty.
  const coins = []; let shown = null, openK = 0, openT = 0, bump = 0, glow = 0, pend = 0;
  const BODY = [7, 7.5, 8, 8, 8, 8, 8, 7.5, 7, 6, 5, 3.5];                  // (half the body's width, row by row: a pouch, full low down)
  function purse(dt, money, R, Y, papers) {                              // (R: the right edge; Y: the top)
    if (shown === null) shown = money;
    const label = shown + ' ZŁ', tw = width(label), px = R - tw - 20, cx = px + 8, fy = Y + 4, pn = String(papers), X = px - 9 - width(pn) - 14;   // (the purse's left, its middle, the frame's top; the paper's left)
    if (money > shown + pend) { const n = money - shown - pend, m = Math.min(8, n); for (let q = 0; q < m; q++) coins.push({ x: cx + (Math.random() * 6 - 3), y: fy - 9, vx: 0, vy: 0, wait: q * .11, val: n / m, into: true }); pend += n; openT = .45; }
    if (money < shown) { const n = shown - money, m = Math.min(10, n); for (let q = 0; q < m; q++) coins.push({ x: cx, y: fy, vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 40, wait: q * .05, into: false }); shown = money; pend = 0; openT = .6; }
    const open = coins.length > 0 || openT > 0; openT = Math.max(0, openT - dt); openK += ((open ? 1 : 0) - openK) * Math.min(1, dt * (open ? 14 : 20));
    bump = Math.max(0, bump - dt * 6); glow = Math.max(0, glow - dt * 2);
    const o = Math.round(openK * 3), sq = bump > .5 ? 1 : 0;
    // no panel behind: each thing with a dark rim of its own (the papers: the bag in the bottom right corner, hudbag.js)
    // the back jaw, when open: it rises, the inside dark between it and the front
    const by = fy + 2 + sq;
    for (let r = -1; r <= BODY.length; r++) { const hw = BODY[Math.max(0, Math.min(BODY.length - 1, r))] + 1, y = by + 2 + r; g.fillStyle = '#17181b'; g.fillRect(Math.round(cx - hw), y, Math.round(cx + hw) - Math.round(cx - hw), 1); }   // (the dark rim round the body)
    g.fillStyle = '#17181b'; g.fillRect(px, by - 1, 16, 4);
    if (o > 0) { g.fillStyle = '#17181b'; g.fillRect(px + 2, by - o, 12, o + 1); g.fillStyle = '#efc970'; if (o > 1) { g.fillRect(px + 5, by - 1, 1, 1); g.fillRect(px + 10, by, 1, 1); }
      g.fillStyle = '#a8812f'; g.fillRect(px + 2, by - o - 1, 12, 1); g.fillStyle = '#efc970'; g.fillRect(px + 3, by - o - 2, 10, 1);
      ball(cx - 2, by - o - 4); }
    // the body: tapestry, plum with little flowers, a dark rim, shaded low down, lit along its left
    for (let r = 0; r < BODY.length; r++) { const hw = BODY[r] + (sq && r > 6 ? .5 : 0), y = by + 2 + r, x0 = Math.round(cx - hw), x1 = Math.round(cx + hw) - 1;
      for (let x = x0; x <= x1; x++) { const edge = x === x0 || x === x1 || r === BODY.length - 1;
        let c = r > BODY.length - 4 ? '#5a1f38' : '#7a2a4a'; if (x === x0 + 1 && r < BODY.length - 2) c = '#9a3a62';
        if (!edge && r > 0 && r < BODY.length - 2) { const u = (x - px + (r % 6 < 3 ? 0 : 2)) % 5, v = r % 3; if (u === 2 && v === 1) c = '#e0a060'; else if ((u === 1 || u === 3) && v === 1) c = '#4f7a3a'; }
        g.fillStyle = edge ? '#2a0f1c' : c; g.fillRect(x, y, 1, 1); } }
    // the front of the frame: brass, lit on top; its hinges at the ends; a ball of the clasp (both, when shut)
    g.fillStyle = '#a8812f'; g.fillRect(px + 1, by + 1, 14, 1); g.fillStyle = '#efc970'; g.fillRect(px + 1, by, 14, 1); g.fillStyle = '#6b4a1e'; g.fillRect(px + 1, by + 2, 1, 1); g.fillRect(px + 14, by + 2, 1, 1);
    ball(cx, by - 2); if (o === 0) ball(cx - 2, by - 2);
    // the coins: dropping in (a bounce and the sum ticking up as each goes in), or flying out
    for (let k = coins.length - 1; k >= 0; k--) { const c = coins[k]; if ((c.wait -= dt) > 0) continue;
      c.vy += 260 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.into && c.y >= by - 1) { coins.splice(k, 1); bump = 1; glow = 1; pend = Math.max(0, pend - c.val); shown = Math.round(Math.min(money, shown + c.val)); if (!coins.some(q => q.into)) { shown = money; pend = 0; openT = .25; } continue; }
      if (!c.into && c.y > cv.height + 4) { coins.splice(k, 1); continue; }
      const x = Math.round(c.x) - 1, y = Math.round(c.y) - 1, flip = ((c.y * .4) | 0) % 2;
      g.fillStyle = '#6b4a1e'; g.fillRect(x, y + 1, 3, 2); g.fillStyle = '#efc970'; g.fillRect(x + (flip ? 1 : 0), y, flip ? 1 : 3, 2); g.fillStyle = '#fff4c8'; g.fillRect(x + 1, y, 1, 1); }
    outlined(label, px + 20, Y + 8, glow > .5 ? '#fff4c8' : '#efc970');
  }
  // text with a dark rim all round (no panel under it)
  function outlined(s, x, y, col) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) text(s, x + dx, y + dy, '#17181b', null); text(s, x, y, col, null); }
  // a newspaper, folded: the masthead, a photo, columns of print, the fold's shade, a dark rim
  const PAPER = ['..........', '.pppppppp..', '.pMMMMMMpp.', '.pppppppppd', '.pFFp--p-pd', '.pFFp--p-pd', '.pppp-----d', '.p-----p--d', '.pppppppppd', '..ddddddddd'];
  function paper(x, y) { const C = { p: '#ece5d0', M: '#17181b', F: '#6e7478', '-': '#9a938a', d: '#b9b09a' };
    for (let r = -1; r <= PAPER.length; r++) for (let c = -1; c <= 11; c++) { const on = (rr, cc) => PAPER[rr]?.[cc] && PAPER[rr][cc] !== '.'; if (!on(r, c) && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => on(r + a, c + b))) { g.fillStyle = '#17181b'; g.fillRect(x + c, y + r, 1, 1); } }
    for (let r = 0; r < PAPER.length; r++) for (let c = 0; c < PAPER[r].length; c++) { const ch = PAPER[r][c]; if (ch === '.') continue; g.fillStyle = C[ch]; g.fillRect(x + c, y + r, 1, 1); }
    g.fillStyle = '#b3372c'; g.fillRect(x + 1, y + 1, 8, 1); }
  function ball(x, y) { g.fillStyle = '#6b4a1e'; g.fillRect(x, y + 1, 2, 1); g.fillStyle = '#efc970'; g.fillRect(x, y, 2, 1); g.fillStyle = '#fff4c8'; g.fillRect(x, y, 1, 1); }
  // blood: splashed onto the picture's edges when he takes a hit (a blob with a dark rim, a lit heart, drops round it, a drip or two
  // running down), each drawn once into its own little canvas; they stay while he is hurt and fade as he mends
  const splats = [];
  function bleed(n = 2, hard = false) { const W = cv.width, H = cv.height;
    for (let k = 0; k < n; k++) { const side = Math.random() * 4 | 0, R = (hard ? 14 : 9) + Math.random() * (hard ? 16 : 10);
      const x = side === 0 ? Math.random() * R : side === 1 ? W - Math.random() * R : Math.random() * W, y = side === 2 ? Math.random() * R * .8 : side === 3 ? H - Math.random() * R : Math.random() * H;
      const c = document.createElement('canvas'), S = Math.ceil(R * 2 + 30); c.width = S; c.height = S + 24; const b = c.getContext('2d'), cx = S / 2, cy = S / 2;
      const waves = [2, 3, 5, 8, 11].map(k => [k, .03 + Math.random() * (k < 4 ? .16 : .07), Math.random() * 6.28]), stretch = .75 + Math.random() * .5, tilt = Math.random() * 3.14;   // (an uneven blob, not a star)
      const edge = a => R * (.74 + waves.reduce((s, [k, am, ph]) => s + am * Math.sin(a * k + ph), 0)) * (1 + (stretch - 1) * Math.cos(2 * (a - tilt)));
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { const dx = xx - cx, dy = yy - cy, d = Math.hypot(dx, dy), e = edge(Math.atan2(dy, dx)); if (d > e) continue;
        b.fillStyle = d > e - 1.5 ? '#3a0f0c' : d > e * .6 ? '#5e1c17' : ((xx + yy) & 1) && d < e * .35 ? '#a3322a' : '#8e2e25'; b.fillRect(xx, yy, 1, 1); }
      for (let q = 0; q < 3 + (Math.random() * 3 | 0); q++) { const a = Math.random() * 6.28, dd = R * (1.05 + Math.random() * .45), rr = .8 + Math.random() * 1.8; b.fillStyle = '#5e1c17'; b.beginPath(); b.arc(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd, rr, 0, 7); b.fill(); }   // (drops)
      for (let q = 0; q < (side === 2 || Math.random() < .5 ? 2 : 1); q++) { const dx = (Math.random() - .5) * R, L = 6 + Math.random() * 18; b.fillStyle = '#5e1c17'; b.fillRect(Math.round(cx + dx), cy, 2, Math.round(R * .5 + L)); b.fillRect(Math.round(cx + dx) - 1, Math.round(cy + R * .5 + L), 4, 3); }   // (drips)
      splats.push({ c, x: Math.round(x - cx), y: Math.round(y - cy), t: 0, life: hard ? 1 : .8 }); }
    while (splats.length > 14) splats.shift(); }
  function drawBlood(dt, low) { for (let k = splats.length - 1; k >= 0; k--) { const s = splats[k]; s.t += dt;
      const keep = Math.max(low * 1.4, Math.max(0, 1 - Math.max(0, s.t - 2.5) / 2.5));   // (fresh ones a few seconds; while hurt, as long as it lasts)
      if (s.t > 1.5 && keep < .02) { splats.splice(k, 1); continue; }
      g.globalAlpha = Math.min(1, Math.max(0, keep)) * Math.min(1, s.t * 8); g.drawImage(s.c, s.x, s.y); } g.globalAlpha = 1; }
  // his health low: the edges of the picture go red (a dither, thicker and beating faster as it runs out)
  let beat = 0;
  function lowEdge(dt, k) { const W = cv.width, H = cv.height; beat += dt * (2 + k * 3); const pulse = .65 + .35 * Math.sin(beat * Math.PI * 2), depth = Math.round((14 + k * 40) * pulse);
    for (let d = 0; d < depth; d++) { const a = 1 - d / depth, on = (x, y) => ((x + y) & 1) === 0 || a > .7 ? (a > .45 || ((x * 3 + y * 5) % 4 === 0)) : false;
      g.fillStyle = a > .7 ? '#8e2e25' : '#cf5a3e'; g.globalAlpha = Math.min(1, a * (.45 + k * .6));
      for (let x = d; x < W - d; x += 1) { if (on(x, d)) g.fillRect(x, d, 1, 1); if (on(x, H - 1 - d)) g.fillRect(x, H - 1 - d, 1, 1); }
      for (let y = d + 1; y < H - d - 1; y += 1) { if (on(d, y)) g.fillRect(d, y, 1, 1); if (on(W - 1 - d, y)) g.fillRect(W - 1 - d, y, 1, 1); } }
    g.globalAlpha = 1; }
  // the way to the bike: an arrow at the top of the picture turned towards it (up: straight ahead), ROWER and how far; over the bike
  // itself, when it is in the picture, a small mark bobbing
  let bikeT = 0;
  function bikeArrow(Bk, project, dt) { bikeT += dt; const W = cv.width, cx = W >> 1, cy = cv.height - 30, a = Bk.angle, ux = Math.sin(a), uy = -Math.cos(a);
    g.fillStyle = 'rgba(23,24,27,.55)'; g.fillRect(cx - 9, cy - 9, 19, 19);
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1); };
    for (let q = -5; q <= 5; q++) px(ux * q, uy * q, '#efc970');                                              // (the shaft)
    for (let k = 1; k <= 3; k++) for (const s of [-1, 1]) px(ux * (5 - k) - uy * k * s * .9, uy * (5 - k) + ux * k * s * .9, '#efc970');   // (its head)
    px(ux * 6, uy * 6, '#f6f3ea');
    const lab = 'ROWER ' + Math.round(Bk.dist) + ' M'; text(lab, cx - (width(lab) >> 1), cy + 11, '#efc970');
    const p = project(Bk.at); if (p && p.x > 0 && p.x < W && p.y > 0 && p.y < cv.height) { const bob = Math.round(Math.sin(bikeT * 5) * 1.5), x = Math.round(p.x), y = Math.round(p.y) - 6 + bob;
      for (let r = 0; r < 4; r++) { g.fillStyle = '#17181b'; g.fillRect(x - 4 + r, y + r - 1, 9 - r * 2, 1); g.fillStyle = '#efc970'; g.fillRect(x - 3 + r, y + r, 7 - r * 2, 1); } } }
  // a tip: words in a box over the bottom of the picture, broken into lines that fit
  let tipText = null; const tip = s => { tipText = s; };
  function drawTip() { const W = cv.width, H = cv.height, maxW = Math.min(W - 20, 260), words = tipText.split(' '), lines = []; let ln = '';
    for (const w of words) { const t = ln ? ln + ' ' + w : w; if (width(t) > maxW && ln) { lines.push(ln); ln = w; } else ln = t; } if (ln) lines.push(ln);
    const bw = Math.max(...lines.map(width)) + 12, bh = lines.length * 8 + 8, x = Math.round(W / 2 - bw / 2), y = H - 40 - bh;
    g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1, bw + 2, bh + 2); g.fillStyle = '#25272b'; g.fillRect(x, y, bw, bh); g.fillStyle = '#efc970'; g.fillRect(x, y, bw, 1);
    lines.forEach((l, i) => text(l, Math.round(W / 2 - width(l) / 2), y + 5 + i * 8, i === 0 && l.startsWith('TRENING') ? '#efc970' : '#f6f3ea')); }
  // the fight's star (as in the knightly games): four arrows round the middle of the picture; the side your mouse picks, lit; his
  // punch coming, red and blinking on its side, green in the moment a guard raised is a parry; your guard, a bar under the star
  let starT = 0;
  function aimStar(A, dt) { starT += dt; const cx = cv.width >> 1, cy = A.high ? Math.round(cv.height * .3) : (cv.height >> 1) + 4, R = 9, len = 9;   // (from behind him: up over the two, not on his back)
    const arrow = (dir, fill, edge) => { for (let q = 0; q < len; q++) { const half = len - 1 - q; for (let r = -half; r <= half; r++) { const on = Math.abs(r) === half || q === 0 ? edge : fill; if (!on) continue; g.fillStyle = on;
      const a = R + q, x = dir === 'left' ? cx - a : dir === 'right' ? cx + a : cx + r, y = dir === 'up' ? cy - a : dir === 'down' ? cy + a : cy + r; g.fillRect(x, y, 1, 1); } } };
    for (const d of ['left', 'right', 'up', 'down']) {
      if (d === A.foe) { if (A.green) arrow(d, '#9be36a', '#f6f3ea'); else if (((starT * 10) | 0) % 2) arrow(d, '#ff5b3a', '#f6f3ea'); else arrow(d, '#efc970', '#17181b'); }
      else arrow(d, d === A.dir ? '#f6f3ea' : 'rgba(23,24,27,.35)', d === A.dir ? '#17181b' : 'rgba(246,243,234,.6)'); }
    if (A.open && ((starT * 8) | 0) % 2) { g.fillStyle = '#17181b'; g.fillRect(cx - 4, cy - 4, 9, 9); g.fillStyle = '#fff8e3'; g.fillRect(cx - 3, cy - 3, 7, 7); }   // (he is open: hit now)
    g.fillStyle = '#17181b'; g.fillRect(cx - 1, cy - 1, 3, 3); g.fillStyle = A.green ? '#7fae58' : '#f6f3ea'; g.fillRect(cx, cy, 1, 1);
    if (A.guard) { const y = A.low ? cy + R + len + 2 : cy - R - len - 3; g.fillStyle = '#17181b'; g.fillRect(cx - 7, y - 1, 15, 3); g.fillStyle = '#9ccad8'; g.fillRect(cx - 6, y, 13, 1); } }
  // the fight: his bars on the left, the other's on the right (health, and under it breath); a shield when his guard is up
  function fightBars(F) { const W = cv.width, bw = Math.min(90, Math.round(W * .3)), y = Math.round(126 * W / Math.max(1, innerWidth)) + 10;   // (under the bike computer and the purse)
    const bar = (x, v, h, col, back, right) => { g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1 + (h === 2 ? 7 : 0), bw + 2, h + 2); g.fillStyle = back; g.fillRect(x, y + (h === 2 ? 7 : 0), bw, h);
      const w = Math.round(bw * Math.max(0, Math.min(100, v)) / 100); g.fillStyle = col; g.fillRect(right ? x + bw - w : x, y + (h === 2 ? 7 : 0), w, h); };
    const lx = 6, rx = W - 6 - bw;
    bar(lx, F.a.hp, 5, F.a.hp < 30 ? '#cf5a3e' : '#7fae58', '#3a2a26'); bar(lx, F.a.st, 2, '#efc970', '#3a3526');
    bar(rx, F.b.hp, 5, '#cf5a3e', '#3a2a26', true); bar(rx, F.b.st, 2, '#efc970', '#3a3526', true);
    text(F.a.name, lx, y - 8, '#f6f3ea'); text(F.b.name, rx + bw - width(F.b.name), y - 8, '#f6f3ea');
    if (F.a.guard) { g.fillStyle = '#9ccad8'; g.fillRect(lx + bw + 4, y, 5, 5); g.fillStyle = '#17181b'; g.fillRect(lx + bw + 6, y + 1, 1, 3); } }
  return { resize, draw, pop, rant, praise, impact, ask, askAt, bleed, tip, setOverlay: f => { overlay = f; }, writer: ctx => { const on = f => (...a) => { const o = g; g = ctx; try { return f(...a); } finally { g = o; } }; return { text: on(text), big: on(big), width }; },   // (the font, drawing on another canvas)
    api: { get g() { return g; }, text, big, width, glyph, get W() { return cv.width; }, get H() { return cv.height; } }, get askSel() { return Q.sel; }, set askSel(v) { Q.sel = v; }, canvas: cv };
}
