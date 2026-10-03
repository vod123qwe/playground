// The bike computer, the old kind clipped to the bars: a dark plastic case with two buttons on top, a grey-green LCD with the speed
// in big seven-segment digits (the unlit segments faintly there, as on a real one), km/h by it, and a row under them that turns over
// every few seconds: the trip (DST), the top speed (MAX), the time ridden (TM). All drawn in a small canvas, blown up without
// smoothing, so it is pixels like the rest of the game.
// Skins (bought from Żaneta): the plain grey-green one, the one from the East (red case, amber LCD), the one from the West (blue lit LCD, light digits).
// createCyclo(el) → { update({ v, dist, max, time, on }), skin(name) }   (v, max: m/s; dist: m; time: s; on: riding)
export function createCyclo(el) {
  const W = 62, H = 36, c = document.createElement('canvas'); c.width = W; c.height = H; el.innerHTML = ''; el.appendChild(c);
  const fit = () => { const k = innerWidth < 640 ? 2 : 3; Object.assign(c.style, { width: W * k + 'px', height: H * k + 'px', imageRendering: 'pixelated', display: 'block' }); }; fit(); addEventListener('resize', fit);   // (a phone: two to a pixel)
  const g = c.getContext('2d');
  const SKINS = { zwykly: { case: '#1b1c1f', top: '#3a3d42', lcd: '#9fae8a', off: '#8a967a', ink: '#1c2418', ghost: 'rgba(28,36,24,.1)', btn: '#b3372c' },
    ruski: { case: '#5e1c17', top: '#8e2e25', lcd: '#d8a24a', off: '#b8863a', ink: '#2a1408', ghost: 'rgba(42,20,8,.12)', btn: '#efc970' },
    zachodni: { case: '#17181b', top: '#44484c', lcd: '#2f5f9a', off: '#244a78', ink: '#e8f3ff', ghost: 'rgba(232,243,255,.1)', btn: '#8fc3f0' } };
  let K = SKINS.zwykly;
  // seven segments: a b c d e f g (top, top right, bottom right, bottom, bottom left, top left, middle)
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  function digit(x, y, ch, w = 8, h = 15, t = 2, lit = K.ink, ghost = K.ghost) {
    const on = SEG[ch] ?? '', m = (h - 3 * t) / 2 | 0;
    const segs = { a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + t + m, w - 2 * t, t],
      f: [x, y + t, t, m], b: [x + w - t, y + t, t, m], e: [x, y + 2 * t + m, t, h - 3 * t - m], c: [x + w - t, y + 2 * t + m, t, h - 3 * t - m] };
    for (const k in segs) { g.fillStyle = on.includes(k) ? lit : ghost; g.fillRect(...segs[k]); } }
  // a 3×5 pixel font for the small row
  const F = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
    D: '110101101101110', S: '111100111001111', T: '111010010010010', M: '101111101101101', A: '010101111101101', X: '101101010101101', K: '101110100110101', '/': '001001010100100', H: '101101111101101', '.': '000000000000010', ':': '000010000010000', ' ': '000000000000000' };
  function text(x, y, s, col = K.ink) { g.fillStyle = col; for (const ch of s) { const p = F[ch] || F[' ']; for (let i = 0; i < 15; i++) if (p[i] === '1') g.fillRect(x + i % 3, y + (i / 3 | 0), 1, 1); x += ch === '.' || ch === ':' ? 2 : 4; } return x; }
  let mode = 0, modeT = 0, last = 0;
  function update({ v = 0, dist = 0, max = 0, time = 0, on = true }) {
    const now = performance.now() / 1000, dt = Math.min(.5, now - (last || now)); last = now; if ((modeT += dt) > 4) { modeT = 0; mode = (mode + 1) % 3; }
    g.clearRect(0, 0, W, H);
    // the case: dark plastic, a lighter top edge, two buttons, a clip under it
    g.fillStyle = K.case; g.fillRect(2, 3, W - 4, H - 5); g.fillRect(3, 2, W - 6, H - 3); g.fillRect(1, 4, W - 2, H - 7);
    g.fillStyle = K.top; g.fillRect(3, 3, W - 6, 1); g.fillStyle = '#2a2c30'; g.fillRect(2, 4, 1, H - 9);
    g.fillStyle = '#44484c'; g.fillRect(14, 0, 8, 2); g.fillRect(W - 22, 0, 8, 2); g.fillStyle = K.btn; g.fillRect(W - 21, 0, 6, 1);
    g.fillStyle = '#101113'; g.fillRect(W / 2 - 6, H - 2, 12, 2);
    // the LCD: sunk in, grey-green, a shade along its top and left
    const lx = 5, ly = 5, lw = W - 10, lh = H - 11;
    g.fillStyle = '#0e0f11'; g.fillRect(lx - 1, ly - 1, lw + 2, lh + 2);
    g.fillStyle = on ? K.lcd : K.off; g.fillRect(lx, ly, lw, lh);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(lx, ly, lw, 1); g.fillRect(lx, ly, 1, lh);
    // the speed, two big digits (and a third for 100 and up), km/h to the right
    const kmh = Math.min(199, Math.round(Math.abs(v) * 3.6)), s = String(kmh).padStart(2, ' ');
    if (kmh >= 100) { g.fillStyle = K.ink; g.fillRect(lx + 2, ly + 3, 2, 15); }
    digit(lx + 6, ly + 3, s[s.length - 2]); digit(lx + 17, ly + 3, s[s.length - 1]);
    text(lx + 28, ly + 3, 'KM'); g.fillStyle = K.ink; g.fillRect(lx + 28, ly + 9, 7, 1); text(lx + 30, ly + 11, 'H');
    // a trend mark: up while speeding up, down while slowing
    const tr = v - (update.pv ?? v); update.pv = v; if (Math.abs(tr) > .02) { g.fillStyle = K.ink; const ax = lx + lw - 6, ay = ly + 5; if (tr > 0) { g.fillRect(ax + 1, ay, 1, 1); g.fillRect(ax, ay + 1, 3, 1); } else { g.fillRect(ax, ay, 3, 1); g.fillRect(ax + 1, ay + 1, 1, 1); } }
    // the small row, turning over: DST / MAX / TM
    g.fillStyle = K.ghost.replace(/[\d.]+\)$/, '.35)'); g.fillRect(lx + 1, ly + 19, lw - 2, 1);
    const row = mode === 0 ? ['DST', (dist / 1000).toFixed(2)] : mode === 1 ? ['MAX', String(Math.round(max * 3.6))] : ['TM', `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`];
    text(lx + 2, ly + 20, row[0]); const wv = [...row[1]].reduce((a, ch) => a + (ch === '.' || ch === ':' ? 2 : 4), 0); text(lx + lw - 2 - wv, ly + 20, row[1]);
  }
  return { update, skin: n => { K = SKINS[n] || SKINS.zwykly; } };
}
