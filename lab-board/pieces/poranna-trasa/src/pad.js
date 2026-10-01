// The pad: an Xbox one, a PlayStation one, any in the standard layout (navigator.getGamepads). Read once a frame. The first press on it
// makes it the way you play: the body gets the class 'pad' and the hints name its buttons (A B X Y, or ✕ ○ □ △) till a key, the mouse
// or a finger is used again. Over a page of buttons (the shop, the end of a run) it moves a highlight from button to button.
// createPad({ onSwitch(active) }) → { poll(), held(b), hit(b), val(b), ax (the sticks: [lx, ly, rx, ry], past the dead zone), nav(dt) (a step
//   up/down/left/right, repeating while held), focus(root, dir), press(), name(b, glyph), on (one plugged in), active (the one in use), kind }
export const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, MENU: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const NAMES = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'MENU', 'L3', 'R3', 'KRZYŻAK ↑', 'KRZYŻAK ↓', 'KRZYŻAK ←', 'KRZYŻAK →'],
  ps: ['KRZYŻYK', 'KÓŁKO', 'KWADRAT', 'TRÓJKĄT', 'L1', 'R1', 'L2', 'R2', 'SHARE', 'OPTIONS', 'L3', 'R3', 'KRZYŻAK ↑', 'KRZYŻAK ↓', 'KRZYŻAK ←', 'KRZYŻAK →'] };
const GLYPHS = { xbox: NAMES.xbox, ps: ['✕', '○', '□', '△', ...NAMES.ps.slice(4)] };   // (on a page of letters, not in the pixel font)

export function createPad({ onSwitch } = {}) {
  const css = document.createElement('style'); css.textContent = `body.pad .padf { outline: 3px solid #efc970 !important; outline-offset: 2px; position: relative; z-index: 1; }`; document.head.appendChild(css);
  const P = { on: false, active: false, kind: 'xbox', ax: [0, 0, 0, 0] };
  let cur = [], prev = [], vals = [], lastId = '', repDir = null, repT = 0, F = null, fKey = '';
  function use(pad) { if (P.active === pad) return; P.active = pad; document.body.classList.toggle('pad', pad); onSwitch?.(pad); }
  // a real key, click, touch or a good push of the mouse: back to the keys (what the pad itself sends on, for the menus, is not real)
  addEventListener('keydown', e => { if (e.isTrusted) use(false); }, true);
  addEventListener('pointerdown', e => { if (e.isTrusted) use(false); }, true);
  addEventListener('mousemove', e => { if (e.isTrusted && Math.abs(e.movementX) + Math.abs(e.movementY) > 12) use(false); });
  function poll() {
    const all = [...(navigator.getGamepads?.() || [])].filter(p => p && p.connected), gp = all.find(p => p.mapping === 'standard') || all[0];
    prev = cur; P.on = !!gp; if (!gp) { cur = []; vals = []; P.ax = [0, 0, 0, 0]; if (P.active) use(false); return; }
    if (gp.id !== lastId) { lastId = gp.id; P.kind = /054c|sony|playstation|dualsense|dualshock/i.test(gp.id) ? 'ps' : 'xbox'; }
    cur = gp.buttons.map(b => b.pressed || b.value > .5); vals = gp.buttons.map(b => b.value || (b.pressed ? 1 : 0));
    P.ax = [0, 1, 2, 3].map(i => { const v = gp.axes[i] || 0, a = Math.abs(v); return a < .16 ? 0 : Math.sign(v) * (a - .16) / .84; });
    if (cur.some((b, i) => b && !prev[i]) || P.ax.some(a => Math.abs(a) > .55)) use(true);
  }
  const held = b => !!cur[b], hit = b => !!cur[b] && !prev[b], val = b => vals[b] || 0;
  // a step for the menus: the cross or the left stick; held, it repeats (slow at first)
  function nav(dt) {
    const a = P.ax, d = held(12) || a[1] < -.6 ? 'up' : held(13) || a[1] > .6 ? 'down' : held(14) || a[0] < -.6 ? 'left' : held(15) || a[0] > .6 ? 'right' : null;
    if (!d) { repDir = null; return null; } if (d !== repDir) { repDir = d; repT = .38; return d; } if ((repT -= dt) <= 0) { repT = .11; return d; } return null;
  }
  // the highlight over a page of buttons: kept over the same one if the page is drawn anew (found again by its words), moved to the
  // nearest one the way it was pushed; on it, as the mouse over it would (a part shown on the bike)
  const label = b => b.textContent.trim();
  function set(b, hover = true) { if (F && F !== b && F.isConnected && hover) F.dispatchEvent(new MouseEvent('mouseleave')); F?.classList.remove('padf'); F = b; fKey = label(b); b.classList.add('padf'); if (hover) b.dispatchEvent(new MouseEvent('mouseenter')); b.scrollIntoView?.({ block: 'nearest' }); }
  function focus(root, dir) {
    const el = typeof root === 'string' ? document.querySelector(root) : root; if (!el) return; const bs = [...el.querySelectorAll('button')].filter(b => b.offsetParent); if (!bs.length) return;
    if (!F || !F.isConnected || !bs.includes(F)) { const same = bs.find(b => label(b) === fKey); if (same) set(same, false); else set(bs.find(b => b.classList.contains('sel')) || bs[0]); }
    if (!dir) return; const r0 = F.getBoundingClientRect(), x0 = r0.x + r0.width / 2, y0 = r0.y + r0.height / 2, [ux, uy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    let best = null, bv = 1e9; for (const b of bs) { if (b === F) continue; const r = b.getBoundingClientRect(), dx = r.x + r.width / 2 - x0, dy = r.y + r.height / 2 - y0, along = dx * ux + dy * uy, across = Math.abs(dx * uy - dy * ux);
      if (along < 4 || across > along * 1.6) continue; const v = along + across * 2.2;   // (roughly that way, not far off to a side) if (v < bv) { bv = v; best = b; } }
    if (best) set(best);
  }
  function press() { if (F && F.isConnected) F.click(); }
  const name = (b, glyph) => (glyph ? GLYPHS : NAMES)[P.kind][b] ?? '?';
  return Object.assign(P, { poll, held, hit, val, nav, focus, press, name, forget: () => { F?.classList.remove('padf'); F = null; fKey = ''; } });
}
