// The game's own menu (Esc), drawn in its pixels like the rest of the HUD: a pause page (back to the game, graphics, start again)
// and a graphics page: the four styles, the pixel size (120-300), smoothing (1-10x), the pixel look on or off (P), and the few
// settings the chosen style offers. Keys: up/down (W/S) to choose a row, left/right (A/D) to change it, Enter/Space to press,
// Esc back. The pointer: over a row chooses it; a click presses or sets (a slider can be dragged).
// createMenu({ hud, look, styles, light, presets, onRestart, onClose }) → { get open, show(page), close(), key(e), pointer(type, x, y) }

export function createMenu({ hud, look, styles, light, presets, onRestart, onClose, onFull, onKeys }) {
  // its own canvas, the same size whatever the game's pixels are (so the menu does not grow or shrink as they change)
  const cv = document.createElement('canvas'); Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 5 });
  document.body.appendChild(cv); const g = cv.getContext('2d'), wr = hud.writer(g), MH = 270;
  const A = { g, text: wr.text, big: wr.big, width: wr.width, W: 0, H: 0 };
  const resize = () => { A.H = cv.height = MH; A.W = cv.width = Math.max(200, Math.round(innerWidth / innerHeight * MH)); }; resize(); addEventListener('resize', resize);
  let page = null, sel = 0, t = 0, rows = [], hits = [], drag = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), snap = (v, st) => Math.round(v / st) * st;
  const fmt = (k, v) => k === 'pix' ? v + ' PX' : k === 'smooth' ? (v > 1 ? v + 'X' : 'BRAK') : k === 'levels' ? (v < 2 ? 'WYŁ.' : String(v)) : k === 'dither' ? (v * 100).toFixed(1) : Math.round(v * 100) + '%';
  function build() {
    const S = look.S;
    if (page === 'pause') return [
      { type: 'button', label: 'WRÓĆ DO GRY', act: () => close() },
      { type: 'button', label: 'GRAFIKA', act: () => show('gfx') },
      { type: 'button', label: document.fullscreenElement ? 'ZWYKŁE OKNO' : 'PEŁNY EKRAN', act: () => { onFull?.(); } },
      { type: 'button', label: 'STEROWANIE', act: () => { close(); onKeys?.(); } },
      { type: 'button', label: 'ZACZNIJ OD NOWA', act: () => { close(); onRestart(); } }];
    const st = styles.includes(S.preset) ? S.preset : null;
    const r = [
      { type: 'styles', label: 'STYL', options: styles.map(k => ({ k, name: presets[k].name.toUpperCase() })), value: st, set: k => look.set({ preset: k, ...presets[k] }, true) },
      { type: 'slider', label: 'PIKSELE', key: 'pix', min: 120, max: 300, step: 10 },
      { type: 'slider', label: 'WYGŁADZANIE', key: 'smooth', min: 1, max: 10, step: 1 },
      { type: 'toggle', label: 'WYGLĄD PIKSELOWY (P)', key: 'pixel' }];
    if (st) for (const [label, key, min, max, step] of light[st]) r.push({ type: 'slider', label, key, min, max, step, light: true });
    r.push({ type: 'button', label: 'WRÓĆ', act: () => show('pause') });
    return r;
  }
  function show(p) { page = p; sel = 0; t = 0; rows = build(); }
  function close() { page = null; drag = null; onClose && onClose(); }
  const setVal = (row, v) => { v = clamp(snap(v, row.step), row.min, row.max); v = +v.toFixed(4); if (look.S[row.key] !== v) look.set({ [row.key]: v }, true); rows = build(); };
  function change(row, dir) {
    if (row.type === 'slider') setVal(row, look.S[row.key] + dir * row.step);
    if (row.type === 'toggle') { look.set({ [row.key]: !look.S[row.key] }, true); rows = build(); }
    if (row.type === 'styles') { const i = Math.max(0, styles.indexOf(row.value)); row.set(styles[(i + dir + styles.length) % styles.length]); rows = build(); }
  }
  function press(row) { if (row.type === 'button') row.act(); else if (row.type === 'toggle') change(row, 1); else if (row.type === 'styles') change(row, 1); }
  function key(e) {
    const c = e.code, row = rows[sel];
    if (c === 'Escape') { page === 'gfx' ? show('pause') : close(); }
    else if (c === 'ArrowUp' || c === 'KeyW') sel = (sel + rows.length - 1) % rows.length;
    else if (c === 'ArrowDown' || c === 'KeyS' || c === 'Tab') sel = (sel + 1) % rows.length;
    else if (c === 'ArrowLeft' || c === 'KeyA') change(row, -1);
    else if (c === 'ArrowRight' || c === 'KeyD') change(row, 1);
    else if (c === 'Enter' || c === 'Space') press(row);
    else if (c === 'KeyP') { look.set({ pixel: !look.S.pixel }, true); rows = build(); }
    e.preventDefault();
  }
  // the pointer, in the picture's own pixels
  function pointer(type, cx, cy) {
    if (!page) return false; const x = cx / innerWidth * A.W, y = cy / innerHeight * A.H;
    const h = hits.find(h => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
    if (type === 'move') { if (drag) { setVal(drag.row, drag.row.min + (x - drag.x0) / drag.w * (drag.row.max - drag.row.min)); return true; } if (h) sel = h.i; return !!h; }
    if (type === 'up') { drag = null; return true; }
    if (type === 'down' && h) { sel = h.i; const row = rows[h.i];
      if (h.opt != null) row.set(h.opt), rows = build();
      else if (h.bar) { drag = { row, x0: h.bar.x, w: h.bar.w }; setVal(row, row.min + (x - h.bar.x) / h.bar.w * (row.max - row.min)); }
      else press(row); }
    return true;
  }
  // ---------- drawing ----------
  function draw(dt) {
    g.clearRect(0, 0, A.W, A.H); if (!page) return; t += dt; const W = A.W, H = A.H, k = Math.min(1, t / .14), e = 1 - Math.pow(1 - k, 3), side = page === 'gfx';
    g.fillStyle = '#0c0d0f'; if (!side) for (let y = 0; y < H; y++) for (let x = (y % 2); x < W; x += 2) g.fillRect(x, y, 1, 1);   // (pause: a dither over the picture; graphics: none, so the change shows)
    const rowH = r => r.type === 'styles' ? 36 : r.type === 'button' ? 16 : 13, title = page === 'pause' ? 'PAUZA' : 'GRAFIKA';
    const pw = Math.min(W - 8, page === 'pause' ? 150 : 236), ph = 34 + rows.reduce((a, r) => a + rowH(r), 0) + 8;
    const x0 = side ? Math.round(10 - (1 - e) * 20) : Math.round((W - pw) / 2), y0 = side ? Math.max(6, Math.round((H - ph) / 2)) : Math.max(4, Math.round((H - ph) / 2 - (1 - e) * 14));
    const panel = (x, y, w, h, fill, edge) => { g.fillStyle = '#17181b'; g.fillRect(x + 1, y - 1, w - 2, h + 2); g.fillRect(x - 1, y + 1, w + 2, h - 2); g.fillRect(x, y, w, h); g.fillStyle = edge; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = fill; g.fillRect(x + 2, y + 2, w - 4, h - 4); };
    g.fillStyle = '#0c0d0f'; g.fillRect(x0 + 3, y0 + 4, pw, ph); panel(x0, y0, pw, ph, '#25272b', '#efc970');
    A.big(title, Math.round(x0 + pw / 2 - A.width(title)), y0 + 8, '#f6f3ea', '#17181b');
    hits = []; let y = y0 + 28; const blink = ((t * 3) | 0) % 2;
    rows.forEach((r, i) => {
      const on = i === sel, lx = x0 + 10, rx = x0 + pw - 10, hgt = rowH(r);
      if (on && r.type !== 'button') { g.fillStyle = '#33363a'; g.fillRect(x0 + 4, y - 2, pw - 8, hgt - 1); if (blink) { g.fillStyle = '#efc970'; for (let q = 0; q < 3; q++) g.fillRect(x0 + 5 + q, y + 1 + q, 1, 5 - q * 2); } }
      if (r.type === 'button') { const bw = pw - 40, bx = x0 + 20; panel(bx, y, bw, 12, on ? '#efc970' : '#33363a', on ? '#f6f3ea' : '#44484c');
        A.text(r.label, Math.round(bx + bw / 2 - A.width(r.label) / 2), y + 3, on ? '#17181b' : '#d3d0c3', null); hits.push({ x: bx, y, w: bw, h: 12, i }); }
      else A.text(r.label, lx, y + 1, on ? '#efc970' : '#d3d0c3', null);
      if (r.type === 'slider') { const v = look.S[r.key], bw = 70, bx = rx - bw - 30, f = (v - r.min) / (r.max - r.min);
        g.fillStyle = '#17181b'; g.fillRect(bx - 1, y + 1, bw + 2, 5); g.fillStyle = '#44484c'; g.fillRect(bx, y + 2, bw, 3); g.fillStyle = on ? '#efc970' : '#b8b8ae'; g.fillRect(bx, y + 2, Math.round(bw * f), 3);
        const kx = bx + Math.round(bw * f); g.fillStyle = '#17181b'; g.fillRect(kx - 2, y - 1, 5, 9); g.fillStyle = on ? '#f6f3ea' : '#d3d0c3'; g.fillRect(kx - 1, y, 3, 7);   // the knob
        const s = fmt(r.key, v); A.text(s, rx - A.width(s), y + 1, '#f6f3ea', null);
        hits.push({ x: x0 + 4, y: y - 2, w: pw - 8, h: hgt, i, bar: { x: bx, w: bw } }); }
      if (r.type === 'toggle') { const s = look.S[r.key] ? 'TAK' : 'NIE', bw = 28, bx = rx - bw; panel(bx, y - 1, bw, 9, look.S[r.key] ? '#467537' : '#5e1c17', '#44484c'); A.text(s, bx + 14 - A.width(s) / 2, y + 1, '#f6f3ea', null); hits.push({ x: x0 + 4, y: y - 2, w: pw - 8, h: hgt, i }); }
      if (r.type === 'styles') { const cols = 2, bw = Math.floor((pw - 24) / cols) - 2, bh = 10;
        r.options.forEach((o, j) => { const bx = x0 + 12 + (j % cols) * (bw + 4), by = y + 9 + Math.floor(j / cols) * (bh + 2), act = o.k === r.value;
          panel(bx, by, bw, bh, act ? '#efc970' : '#33363a', act ? '#f6f3ea' : '#44484c'); const s = o.name.length * 4 - 1 > bw - 4 ? o.name.split(' ')[0] : o.name;
          A.text(s, Math.round(bx + bw / 2 - A.width(s) / 2), by + 3, act ? '#17181b' : '#d3d0c3', null); hits.push({ x: bx, y: by, w: bw, h: bh, i, opt: o.k }); });
        if (!r.value) A.text('WŁASNY', rx - A.width('WŁASNY'), y + 1, '#979a97', null); }
      y += hgt; });
    const hint = page === 'pause' ? 'ESC: WRÓĆ DO GRY' : '↑ ↓ WYBÓR · ← → ZMIANA · ESC WRÓĆ'; A.text(hint, side ? x0 + 2 : Math.round(W / 2 - A.width(hint) / 2), Math.min(H - 8, y0 + ph + 7), '#f6f3ea');
  }
  hud.setOverlay(draw);
  return { get open() { return !!page; }, show, close, key, pointer };
}
