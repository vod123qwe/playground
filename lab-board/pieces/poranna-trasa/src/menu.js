// The game's own menu (Esc), drawn in its pixels like the rest of the HUD: a pause page (back to the game, graphics, start again)
// and a graphics page: the four styles, the pixel size (120-300), smoothing (1-10x), the pixel look on or off (P), and the few
// settings the chosen style offers. Keys: up/down (W/S) to choose a row, left/right (A/D) to change it, Enter/Space to press,
// Esc back. The pointer: over a row chooses it; a click presses or sets (a slider can be dragged).
// A controls page (STEROWANIE): the mouse's speed, then each action by where it works (on the bike, on foot, in a fight, anywhere),
// what it does and its key; Enter or a click on one waits for a new key (Esc: leave it). It scrolls when longer than the picture.
// createMenu({ hud, look, styles, light, presets, onRestart, onClose }) → { get open, show(page), close(), key(e), pointer(type, x, y) }

export function createMenu({ hud, look, styles, light, presets, onRestart, onClose, onFull, onKeys, sens, controls, lab, onPlay, sound, modes, onMap, assist, tests }) {
  // its own canvas, the same size whatever the game's pixels are (so the menu does not grow or shrink as they change)
  const cv = document.createElement('canvas'); Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 5 });
  document.body.appendChild(cv); const g = cv.getContext('2d'), wr = hud.writer(g), MH = 270;
  const A = { g, text: wr.text, big: wr.big, width: wr.width, W: 0, H: 0 };
  const resize = () => { A.H = cv.height = MH; A.W = cv.width = Math.max(200, Math.round(innerWidth / innerHeight * MH)); }; resize(); addEventListener('resize', resize);
  let page = null, sel = 0, t = 0, rows = [], hits = [], drag = null, capture = null, scroll = 0, scrollT = 0, parent = 'pause';   // (parent: where WRÓĆ / Esc goes back to)
  const pickable = r => r && !['head', 'info'].includes(r.type);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), snap = (v, st) => Math.round(v / st) * st;
  const fmt = (k, v) => k === 'sens' ? v.toFixed(1) + 'X' : k === 'pix' ? v + ' PX' : k === 'smooth' ? (v > 1 ? v + 'X' : 'BRAK') : k === 'levels' ? (v < 2 ? 'WYŁ.' : String(v)) : k === 'dither' ? (v * 100).toFixed(1) : Math.round(v * 100) + '%';
  const SND = [['GŁOŚNOŚĆ', 'master'], ['MUZYKA', 'music'], ['EFEKTY', 'sfx'], ['GŁOSY', 'voice']];
  function build() {
    const S = look.S;
    if (page === 'title') return [
      { type: 'button', label: 'GRAJ', act: () => { close(); onPlay?.(); } },
      ...(onMap ? [{ type: 'button', label: 'MAPA TRASY', act: () => { close(); onMap(); } }] : []),
      ...(modes ? [{ type: 'button', label: 'TRYBY GRY', act: () => show('modes') }] : []),
      { type: 'button', label: 'USTAWIENIA', act: () => show('settings') },
      ...(tests ? [{ type: 'button', label: 'TESTY: TRASY I STANY', act: () => show('tests') }] : []),
      { type: 'button', label: 'WARSZTAT (ASSETY)', act: () => { location.href = 'studio.html'; } },
      ...(lab ? [{ type: 'button', label: '← WRÓĆ DO LABU', act: () => { location.href = lab; } }] : [])];
    if (page === 'pause') return [
      ...(/[?&]arena=/.test(location.search) ? [{ type: 'button', label: '← WRÓĆ DO WARSZTATU', act: () => { location.href = 'studio.html'; } }] : []),
      { type: 'button', label: 'WRÓĆ DO GRY', act: () => close() },
      ...(onMap ? [{ type: 'button', label: 'MAPA TRASY', act: () => { close(); onMap(); } }] : []),
      ...(modes ? [{ type: 'button', label: 'TRYBY GRY', act: () => show('modes') }] : []),
      { type: 'button', label: 'USTAWIENIA', act: () => show('settings') },
      ...(tests ? [{ type: 'button', label: 'TESTY: TRASY I STANY', act: () => show('tests') }] : []),
      { type: 'button', label: 'ZACZNIJ OD NOWA', act: () => { close(); onRestart(); } },
      ...(/[?&]arena=/.test(location.search) ? [] : [{ type: 'button', label: 'WARSZTAT (ASSETY)', act: () => { location.href = 'studio.html'; } }]),
      ...(lab ? [{ type: 'button', label: '← WRÓĆ DO LABU', act: () => { location.href = lab; } }] : [])];
    if (page === 'settings') return [
      { type: 'button', label: 'GRAFIKA', act: () => show('gfx') },
      ...(sound ? [{ type: 'button', label: 'DŹWIĘK', act: () => show('snd') }] : []),
      { type: 'button', label: 'STEROWANIE', act: () => controls ? show('keys') : (close(), onKeys?.()) },
      { type: 'button', label: document.fullscreenElement ? 'EKRAN: ZWYKŁE OKNO' : 'EKRAN: PEŁNY EKRAN', act: () => { onFull?.(); setTimeout(() => { rows = build(); }, 300); } },
      ...(assist ? [{ type: 'button', label: 'ASYSTA RZUTU: ' + assist.name(), act: () => { assist.next(); rows = build(); } }] : []),
      { type: 'button', label: 'WRÓĆ', act: () => goBack() }];
    if (page === 'tests') return [...(tests ? tests().map(r => r.head ? { type: 'head', label: r.head } : { type: 'button', label: r.label, act: () => { close(); r.act(); } }) : []), { type: 'button', label: 'WRÓĆ', act: () => goBack() }];
    if (page === 'modes') return [...modes().flatMap(m => [{ type: 'button', label: m.label, act: () => { const wasTitle = parent === 'title'; close(); if (wasTitle) onPlay?.(); m.act(); } }, ...(m.info ? [{ type: 'info', label: m.info, value: '' }] : [])]),
      { type: 'button', label: 'WRÓĆ', act: () => goBack() }];
    if (page === 'snd') return [{ type: 'button', label: sound.get('mute') ? 'DŹWIĘK: WYCISZONY' : 'DŹWIĘK: WŁĄCZONY', act: () => { sound.set('mute', !sound.get('mute')); show('snd'); } }, ...SND.map(([label, k]) => ({ type: 'slider', label, key: 'snd_' + k, min: 0, max: 1, step: .05, get: () => sound.get(k), set: v => sound.set(k, v) })),
      { type: 'button', label: 'WRÓĆ', act: () => goBack() }];
    if (page === 'keys') { const r = sens ? [{ type: 'slider', label: 'CZUŁOŚĆ MYSZY', key: 'sens', min: .2, max: 2, step: .1, get: sens.get, set: sens.set }] : [];
      for (const sec of controls.sections()) { r.push({ type: 'head', label: sec.title });
        for (const it of sec.items) r.push(it.act ? { type: 'bind', label: it.label, act: it.act, keys: it.keys, clash: it.clash } : { type: 'info', label: it.label, value: it.value }); }
      r.push({ type: 'button', label: 'PRZYWRÓĆ DOMYŚLNE', act: () => { controls.reset(); rows = build(); } }, { type: 'button', label: 'WRÓĆ', act: () => goBack() });
      return r; }
    const st = styles.includes(S.preset) ? S.preset : null;
    const r = [
      { type: 'styles', label: 'STYL', options: styles.map(k => ({ k, name: presets[k].name.toUpperCase() })), value: st, set: k => look.set({ preset: k, ...presets[k] }, true) },
      { type: 'slider', label: 'PIKSELE', key: 'pix', min: 120, max: 300, step: 10 },
      { type: 'slider', label: 'WYGŁADZANIE', key: 'smooth', min: 1, max: 10, step: 1 },
      { type: 'toggle', label: 'WYGLĄD PIKSELOWY (P)', key: 'pixel' }];
    if (st) for (const [label, key, min, max, step] of light[st]) r.push({ type: 'slider', label, key, min, max, step, light: true });
    r.push({ type: 'button', label: 'PANEL STYLU: WSZYSTKO', act: () => { close(); look.open(true); } });
    r.push({ type: 'button', label: 'WRÓĆ', act: () => goBack() });
    return r;
  }
  const back = {}; function goBack() { show(back[page] || parent, true); }
  function show(p, isBack) { if (!isBack && page && p !== page) back[p] = page; if ((p === 'keys' || p === 'gfx' || p === 'snd' || p === 'modes' || p === 'settings' || p === 'tests') && (page === 'title' || page === 'pause')) parent = page; page = p; t = 0; capture = null; window.PT_capturing = false; scroll = scrollT = 0; rows = build(); sel = Math.max(0, rows.findIndex(pickable)); }
  function close() { page = null; drag = null; capture = null; window.PT_capturing = false; onClose && onClose(); }
  const valOf = row => row.get ? row.get() : look.S[row.key];                    // (a slider's value: in the look, or kept by its own get / set)
  const setVal = (row, v) => { v = clamp(snap(v, row.step), row.min, row.max); v = +v.toFixed(4); if (valOf(row) !== v) { if (row.set) row.set(v); else look.set({ [row.key]: v }, true); } rows = build(); };
  function change(row, dir) {
    if (row.type === 'slider') setVal(row, valOf(row) + dir * row.step);
    if (row.type === 'toggle') { look.set({ [row.key]: !look.S[row.key] }, true); rows = build(); }
    if (row.type === 'styles') { const i = Math.max(0, styles.indexOf(row.value)); row.set(styles[(i + dir + styles.length) % styles.length]); rows = build(); }
  }
  function press(row) { if (row.type === 'bind') { capture = row; capture.t0 = performance.now(); window.PT_capturing = true; return; } if (row.type === 'button') row.act(); else if (row.type === 'toggle') change(row, 1); else if (row.type === 'styles') change(row, 1); }
  function key(e) {
    const c = e.code, row = rows[sel];
    if (capture && !e.isTrusted) { capture = null; window.PT_capturing = false; return; }   // (the pad: no keys to give, the waiting called off)
    if (capture) { if (performance.now() - capture.t0 < 150) { e.preventDefault(); return; }   // (the key that opened it, not a new one)
      if (c !== 'Escape') { controls.set(capture.act, c); rows = build(); } capture = null; window.PT_capturing = false; e.preventDefault(); return; }   // (waiting for a key: this is it)
    const step = d => { let i = sel; for (let n = 0; n < rows.length; n++) { i = (i + d + rows.length) % rows.length; if (pickable(rows[i])) break; } sel = i; };
    if (c === 'Escape') { page === 'gfx' || page === 'keys' || page === 'snd' || page === 'modes' || page === 'settings' || page === 'tests' ? goBack() : page === 'title' ? null : close(); }
    else if (c === 'ArrowUp' || c === 'KeyW') step(-1);
    else if (c === 'ArrowDown' || c === 'KeyS' || c === 'Tab') step(1);
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
    if (type === 'down' && capture) { capture = null; window.PT_capturing = false; return true; }   // (a click elsewhere: leave the key as it was)
    if (type === 'down' && h) { sel = h.i; const row = rows[h.i];
      if (h.opt != null) row.set(h.opt), rows = build();
      else if (h.bar) { drag = { row, x0: h.bar.x, w: h.bar.w }; setVal(row, row.min + (x - h.bar.x) / h.bar.w * (row.max - row.min)); }
      else press(row); }
    return true;
  }
  // ---------- drawing ----------
  function draw(dt) {
    g.clearRect(0, 0, A.W, A.H); if (!page) return; t += dt; const W = A.W, H = A.H, k = Math.min(1, t / .14), e = 1 - Math.pow(1 - k, 3), side = page === 'gfx', keysPage = page === 'keys';
    if (page === 'title') { drawTitle(dt); return; }
    g.fillStyle = '#0c0d0f'; if (!side) for (let y = 0; y < H; y++) for (let x = (y % 2); x < W; x += 2) g.fillRect(x, y, 1, 1);   // (pause: a dither over the picture; graphics: none, so the change shows)
    const rowH = r => r.type === 'styles' ? 11 + Math.ceil(r.options.length / 2) * 12 : r.type === 'button' ? 16 : r.type === 'head' ? 15 : r.type === 'bind' || r.type === 'info' ? 10 : 13, title = page === 'pause' ? 'PAUZA' : page === 'modes' ? 'TRYBY GRY' : page === 'snd' ? 'DŹWIĘK' : page === 'settings' ? 'USTAWIENIA' : page === 'tests' ? 'TESTY' : keysPage ? 'STEROWANIE' : 'GRAFIKA';
    const full = rows.reduce((a, r) => a + rowH(r), 0), view = Math.min(full, H - 60), pw = Math.min(W - 8, page === 'pause' ? 196 : keysPage ? 340 : page === 'modes' ? 300 : 236), ph = 34 + view + 8;
    // scrolled so the chosen row is in view
    { let yy = 0; for (let i = 0; i < sel; i++) yy += rowH(rows[i]); const hh = rowH(rows[sel] || {}); if (yy - scrollT < 10) scrollT = Math.max(0, yy - 10); if (yy + hh - scrollT > view - 10) scrollT = Math.min(full - view, yy + hh - view + 10); scrollT = Math.max(0, Math.min(full - view, scrollT)); scroll += (scrollT - scroll) * Math.min(1, dt * 14); }
    const x0 = side ? Math.round(10 - (1 - e) * 20) : Math.round((W - pw) / 2), y0 = side ? Math.max(6, Math.round((H - ph) / 2)) : Math.max(4, Math.round((H - ph) / 2 - (1 - e) * 14));
    const panel = (x, y, w, h, fill, edge) => { g.fillStyle = '#17181b'; g.fillRect(x + 1, y - 1, w - 2, h + 2); g.fillRect(x - 1, y + 1, w + 2, h - 2); g.fillRect(x, y, w, h); g.fillStyle = edge; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = fill; g.fillRect(x + 2, y + 2, w - 4, h - 4); };
    g.fillStyle = '#0c0d0f'; g.fillRect(x0 + 3, y0 + 4, pw, ph); panel(x0, y0, pw, ph, '#25272b', '#efc970');
    A.big(title, Math.round(x0 + pw / 2 - A.width(title)), y0 + 8, '#f6f3ea', '#17181b');
    hits = []; const top = y0 + 28; let y = top - Math.round(scroll); const blink = ((t * 3) | 0) % 2;
    g.save(); g.beginPath(); g.rect(x0 + 2, top - 3, pw - 4, view + 4); g.clip();
    rows.forEach((r, i) => {
      const on = i === sel, lx = x0 + 10, rx = x0 + pw - 10, hgt = rowH(r);
      if (y + hgt < top - 3 || y > top + view) { y += hgt; return; }                                   // (scrolled out of the panel)
      if (r.type === 'head') { g.fillStyle = '#44484c'; g.fillRect(lx, y + 11, pw - 20, 1); A.text(r.label, lx, y + 4, '#efc970', null); y += hgt; return; }
      if (r.type === 'info') { A.text(r.label, lx + 4, y + 1, '#979a97', null); A.text(r.value, rx - A.width(r.value), y + 1, '#b8b8ae', null); y += hgt; return; }
      if (r.type === 'bind') { if (on) { g.fillStyle = '#33363a'; g.fillRect(x0 + 4, y - 1, pw - 8, hgt - 1); }
        A.text(r.label, lx + 4, y + 1, on ? '#efc970' : '#d3d0c3', null);
        const s = capture === r ? (blink ? 'NACIŚNIJ KLAWISZ · ESC: BEZ ZMIAN' : '') : r.keys, w = A.width(s) + 6, bx = rx - w;
        if (s) { panel(bx, y - 1, w, 9, capture === r ? '#efc970' : r.clash ? '#8e2e25' : '#33363a', r.clash ? '#cf5a3e' : '#44484c'); A.text(s, bx + 3, y + 1, capture === r ? '#17181b' : '#f6f3ea', null); }
        hits.push({ x: x0 + 4, y: y - 1, w: pw - 8, h: hgt, i }); y += hgt; return; }
      if (on && r.type !== 'button') { g.fillStyle = '#33363a'; g.fillRect(x0 + 4, y - 2, pw - 8, hgt - 1); if (blink) { g.fillStyle = '#efc970'; for (let q = 0; q < 3; q++) g.fillRect(x0 + 5 + q, y + 1 + q, 1, 5 - q * 2); } }
      if (r.type === 'button') { const bw = pw - 40, bx = x0 + 20; panel(bx, y, bw, 12, on ? '#efc970' : '#33363a', on ? '#f6f3ea' : '#44484c');
        A.text(r.label, Math.round(bx + bw / 2 - A.width(r.label) / 2), y + 3, on ? '#17181b' : '#d3d0c3', null); hits.push({ x: bx, y, w: bw, h: 12, i }); }
      else A.text(r.label, lx, y + 1, on ? '#efc970' : '#d3d0c3', null);
      if (r.type === 'slider') { const v = valOf(r), bw = 70, bx = rx - bw - 30, f = (v - r.min) / (r.max - r.min);
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
    g.restore();
    if (full > view) { const bh = Math.max(8, view * view / full), by = top + (view - bh) * (scroll / (full - view)); g.fillStyle = '#44484c'; g.fillRect(x0 + pw - 5, top, 2, view); g.fillStyle = '#efc970'; g.fillRect(x0 + pw - 5, Math.round(by), 2, Math.round(bh)); }   // (where in the list)
    const hint = document.body.classList.contains('touch') ? (page === 'pause' ? 'DOTKNIJ, ŻEBY WYBRAĆ' : 'DOTKNIJ ALBO PRZECIĄGNIJ SUWAK') : window.PT_PAD?.active ? (page === 'pause' ? '↑ ↓ WYBÓR · ' + PT_PAD.name(0) + ': OK · ' + PT_PAD.name(1) + ': WRÓĆ DO GRY' : keysPage ? '↑ ↓ WYBÓR · KLAWISZE ZMIENISZ Z KLAWIATURY · ' + PT_PAD.name(1) + ': WRÓĆ' : '↑ ↓ WYBÓR · ← → ZMIANA · ' + PT_PAD.name(0) + ': OK · ' + PT_PAD.name(1) + ': WRÓĆ') : page === 'pause' ? 'ESC: WRÓĆ DO GRY' : keysPage ? '↑ ↓ WYBÓR · ENTER: NOWY KLAWISZ · CZERWONY: KLAWISZ ZAJĘTY · ESC WRÓĆ' : '↑ ↓ WYBÓR · ← → ZMIANA · ESC WRÓĆ'; A.text(hint, side ? x0 + 2 : Math.round(W / 2 - A.width(hint) / 2), Math.min(H - 8, y0 + ph + 7), '#f6f3ea');
  }
  // the title screen: the name big over the street going by, a line under it, the buttons, a hint
  function drawTitle(dt) { const W = A.W, H = A.H, k = Math.min(1, t / .5), e = 1 - Math.pow(1 - k, 3);
    g.fillStyle = 'rgba(12,13,15,.35)'; for (let y = 0; y < 70; y++) if (y % 2 === 0) g.fillRect(0, y, W, 1);                  // (a shade behind the name, dithered in lines)
    const name = 'PORANNA TRASA', sc = Math.max(1, Math.min(2, (W - 8) / (A.width(name) * 2))), nw = A.width(name) * 2 * sc; g.save(); g.translate(Math.round(W / 2 - nw / 2), Math.round(22 - (1 - e) * 16)); g.scale(sc, sc);
    A.big(name, 0, 0, '#efc970', '#17181b'); g.restore();
    const sub = 'GAZETY SAME SIĘ NIE ROZNIOSĄ'; A.text(sub, Math.round(W / 2 - A.width(sub) / 2), 58, '#f6f3ea');
    const bw = 130, bx = Math.round(W / 2 - bw / 2); let y = Math.round(H - 26 - rows.length * 16 + (1 - e) * 20); hits = [];
    const panel = (x, yy, w, h, fill, edge) => { g.fillStyle = '#17181b'; g.fillRect(x + 1, yy - 1, w - 2, h + 2); g.fillRect(x - 1, yy + 1, w + 2, h - 2); g.fillRect(x, yy, w, h); g.fillStyle = edge; g.fillRect(x + 1, yy + 1, w - 2, h - 2); g.fillStyle = fill; g.fillRect(x + 2, yy + 2, w - 4, h - 4); };
    rows.forEach((r, i) => { const on = i === sel; panel(bx, y, bw, 12, on ? '#efc970' : '#25272b', on ? '#f6f3ea' : '#44484c'); A.text(r.label, Math.round(bx + bw / 2 - A.width(r.label) / 2), y + 3, on ? '#17181b' : '#d3d0c3', null); hits.push({ x: bx, y, w: bw, h: 12, i }); y += 16; });
    const hint = document.body.classList.contains('touch') ? 'DOTKNIJ, ŻEBY WYBRAĆ' : window.PT_PAD?.active ? '↑ ↓ WYBÓR · ' + PT_PAD.name(0) : '↑ ↓ WYBÓR · ENTER'; A.text(hint, Math.round(W / 2 - A.width(hint) / 2), H - 10, '#d3d0c3'); }
  hud.setOverlay(draw);
  // the wheel scrolls a long page (the chosen row follows)
  function wheel(dy) { if (!page) return; const d = dy > 0 ? 1 : -1; let i = sel; for (let n = 0; n < 3; n++) { let j = i; do { j = (j + d + rows.length) % rows.length; } while (!pickable(rows[j]) && j !== i); i = j; } sel = i; }
  return { get open() { return !!page; }, get page() { return page; }, get capturing() { return !!capture; }, show, close, key, pointer, wheel };
}
