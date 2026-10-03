// The windows' pixel frames: little pictures drawn here (a 7 x 7 or 9 x 9 block: the dark edge with its corners cut, the light top and
// left, the shade bottom and right, the fill) given to CSS as border images, so a button or a window of any size has the same chunky
// pixel edge. Set on the page as variables: --px-btn, --px-btn-hi, --px-btn-dn, --px-sel, --px-sel-dn, --px-go, --px-inset, --px-win,
// --px-chip, --px-tab-on. Used as: border-image: var(--px-btn) 3 fill / 6px (one pixel of the frame 2 screen pixels).
// pixUI() → once; pixel text: pixfont.js

const url = (n, f) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); f((x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); }); return `url(${c.toDataURL()})`; };
// a button: 7 x 7, slice 3 (the edge, the bevel, a pixel of fill)
const btn = (fill, hi, lo, edge = '#17181b') => url(7, P => { P(1, 0, 5, 1, edge); P(1, 6, 5, 1, edge); P(0, 1, 1, 5, edge); P(6, 1, 1, 5, edge);
  P(1, 1, 5, 5, fill); P(1, 1, 5, 1, hi); P(1, 1, 1, 5, hi); P(1, 5, 5, 1, lo); P(5, 1, 1, 5, lo); P(1, 1, 1, 1, hi); P(5, 5, 1, 1, lo); });
// a window: 9 x 9, slice 4 (the dark edge, the light rim, the dark line, the inner bevel)
const win = (fill = '#25272b') => url(9, P => { const D = '#17181b'; P(1, 0, 7, 1, D); P(1, 8, 7, 1, D); P(0, 1, 1, 7, D); P(8, 1, 1, 7, D);
  P(1, 1, 7, 7, '#d3d0c3'); P(2, 2, 5, 5, D); P(3, 3, 3, 3, fill); P(3, 3, 3, 1, '#34363b'); P(3, 3, 1, 3, '#34363b'); P(1, 1, 1, 1, D); P(7, 1, 1, 1, D); P(1, 7, 1, 1, D); P(7, 7, 1, 1, D); });
// sunk in: 7 x 7, slice 3 (shade top and left, light bottom and right)
const inset = (fill = '#1d1e21') => url(7, P => { P(0, 0, 7, 7, '#17181b'); P(1, 1, 5, 5, fill); P(6, 1, 1, 6, '#3a3c40'); P(1, 6, 6, 1, '#3a3c40'); P(0, 0, 1, 1, 'rgba(0,0,0,0)'); P(6, 6, 1, 1, 'rgba(0,0,0,0)'); P(6, 0, 1, 1, 'rgba(0,0,0,0)'); P(0, 6, 1, 1, 'rgba(0,0,0,0)'); });

let done = false;
const STAR = ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];
const star = (fill, lit) => url(9, P => { const on = (x, y) => STAR[y]?.[x] === '#'; for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) P(x + 1, y + 1, 1, 1, '#17181b');
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (on(x, y)) P(x + 1, y + 1, 1, 1, fill); P(4, 2, 1, 1, lit); P(3, 4, 1, 1, lit); });
export const pxStars = (n, of = 3) => `<span class="pxs">${Array.from({ length: of }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
export const pxStar = (on = true) => `<span class="pxs"><i class="${on ? 'on' : ''}"></i></span>`;
export function pixUI() { if (done) return; done = true; const r = document.documentElement.style;
  r.setProperty('--px-star-on', star('#efc970', '#fbe9b4')); r.setProperty('--px-star-off', star('#4a4e55', '#5a5f66'));
  { const st = document.createElement('style'); st.textContent = '.pxs{display:inline-flex;gap:1px;vertical-align:-.12em}.pxs i{display:inline-block;width:.9em;height:.9em;background:var(--px-star-off) center/100% 100% no-repeat;image-rendering:pixelated;font-style:normal}.pxs i.on{background-image:var(--px-star-on)}'; document.head.appendChild(st); }
  r.setProperty('--px-btn', btn('#33363a', '#4c5055', '#232528'));
  r.setProperty('--px-btn-hi', btn('#40444a', '#5c6067', '#2a2c30'));
  r.setProperty('--px-btn-dn', btn('#2a2c30', '#1d1e21', '#3a3d42'));
  r.setProperty('--px-sel', btn('#efc970', '#f8e6b0', '#b8902e'));
  r.setProperty('--px-sel-dn', btn('#d9b25a', '#a8822a', '#efc970'));
  r.setProperty('--px-go', btn('#9fd27a', '#d2f0b8', '#5f9a3e'));
  r.setProperty('--px-blue', btn('#8fc3f0', '#c9e3f8', '#4f7fa8'));
  r.setProperty('--px-red', btn('#b8483a', '#de7a6a', '#7a2a20'));
  r.setProperty('--px-tab-on', btn('#3a3220', '#6a5a36', '#24201a', '#efc970'));
  r.setProperty('--px-chip', btn('#1d1e21', '#2a2c30', '#141517'));
  r.setProperty('--px-inset', inset()); r.setProperty('--px-inset-lt', inset('#2b2d31'));
  r.setProperty('--px-win', win());
  // the pointer at the chosen line: a little pixel arrow
  r.setProperty('--px-arrow', url(5, P => { P(0, 0, 1, 5, '#17181b'); P(1, 1, 1, 3, '#17181b'); P(2, 2, 1, 1, '#17181b'); }));
}

// ---------- the game's keys: a button as a chunky pixel key with its thickness under it (it sinks when pressed), a little icon in its
// colour, the keyboard key it answers to in a small cap. pxKey(label, { icon, key, kind: 'gold' | 'red' | '', attrs }) → its HTML ----------
const url2 = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); f((x, y, ww, hh, k) => { g.fillStyle = k; g.fillRect(x, y, ww, hh); }); return `url(${c.toDataURL()})`; };
// 7 x 10: the face (light top and left, shade right and under), the lip (its thickness) below, the dark edge round with its corners cut
const keyUp = (fill, hi, lo, lip) => url2(7, 10, P => { const D = '#17181b'; P(1, 0, 5, 1, D); P(0, 1, 1, 8, D); P(6, 1, 1, 8, D); P(1, 9, 5, 1, D);
  P(1, 1, 5, 5, fill); P(1, 1, 5, 1, hi); P(1, 1, 1, 4, hi); P(5, 1, 1, 5, lo); P(1, 5, 5, 1, lo); P(1, 6, 5, 3, lip); P(1, 6, 5, 1, D); });
const keyDn = (fill, lo) => url2(7, 7, P => { const D = '#17181b'; P(1, 0, 5, 1, D); P(0, 1, 1, 5, D); P(6, 1, 1, 5, D); P(1, 6, 5, 1, D); P(1, 1, 5, 5, fill); P(1, 1, 5, 1, lo); P(1, 1, 1, 5, lo); });
// the icons, 9 x 9, each pixel drawn 2 x 2 (a mask: they take the text's colour)
const ICONS = {
  prev: '....#.... ...##.... ..####### .######## ..####### ...##.... ....#....', next: '....#.... ....##... #######.. ########. #######.. ....##... ....#....',
  home: '....#.... ...###... ..#####.. .#######. ..#...#.. ..#.#.#.. ..#.#.#.. ..#####..', map: '##..##... #.##..##. #.#.#..#. #.#.#..#. #.#.#..#. ##..##..#. ...##..##',
  again: '..####... .#....#.. #......#. #...##### #....###. #.....#.. .#....... ..####...', shop: '......##. .....#..# ......#.# .....###. ....##... ...##.... ..##..... .##...... ##.......',
  play: '.#....... .###..... .#####... .#######. .#####... .###..... .#.......', save: '#######.. #.#..#.#. #.#..#..# #.####..# #.......# #.#####.# #.#...#.# #########',
  close: '#.....#.. .#...#... ..#.#.... ...#..... ..#.#.... .#...#... #.....#..', star: '....#.... ...###... ######### .#######. ..#####.. .###.###. .#.....#.',
  paper: '######... #....##.. #.##.#.#. #......#. #.####.#. #......#. #.####.#. ########.',
  phone: '.#######. ##.....## ##.###.## ...###... ..#####.. .###.###. .#######. .#######.' };
function iconMask(rows) { const c = document.createElement('canvas'), R = rows.split(' '); c.width = c.height = 18; const g = c.getContext('2d'); g.fillStyle = '#000'; const oy = Math.floor((9 - R.length) / 2);
  R.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') g.fillRect(x * 2, (y + oy) * 2, 2, 2); }); return `url(${c.toDataURL()})`; }
let keysDone = false;
function keysCSS() { if (keysDone) return; keysDone = true; const r = document.documentElement.style;
  r.setProperty('--px-key', keyUp('#3a3d42', '#5a5e65', '#2a2c30', '#202226')); r.setProperty('--px-key-hi', keyUp('#464a50', '#6a6e75', '#32353a', '#24262a')); r.setProperty('--px-key-dn', keyDn('#33363a', '#24262a'));
  r.setProperty('--px-key-gold', keyUp('#efc970', '#fbe9b4', '#c9a040', '#9a7428')); r.setProperty('--px-key-gold-hi', keyUp('#f6d684', '#fff3c8', '#d4ab4a', '#a07a2c')); r.setProperty('--px-key-gold-dn', keyDn('#e3bc60', '#b8902e'));
  r.setProperty('--px-key-red', keyUp('#c23a2e', '#e06a5a', '#962a20', '#6a1c16')); r.setProperty('--px-key-red-dn', keyDn('#b8342a', '#7a2018'));
  for (const k in ICONS) r.setProperty('--ic-' + k, iconMask(ICONS[k]));
  const st = document.createElement('style'); st.textContent = `
    .pxk { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font: 16px/1 PTPix, ui-monospace, monospace; color: #f6f3ea; white-space: nowrap; text-shadow: 2px 2px 0 rgba(0,0,0,.35);
      border-style: solid; border-width: 4px 4px 10px 4px; border-image: var(--px-key) 2 2 5 2 fill / 4px 4px 10px 4px; padding: 6px 10px 4px; image-rendering: pixelated; position: relative; }
    .pxk:hover, .pxk.pad-focus { border-image-source: var(--px-key-hi); transform: translateY(-2px); }
    .pxk:active { border-width: 4px; border-image: var(--px-key-dn) 2 fill / 4px; transform: translateY(6px); }
    .pxk.gold { color: #17181b; text-shadow: 2px 2px 0 rgba(255,255,255,.35); border-image-source: var(--px-key-gold); } .pxk.gold:hover, .pxk.gold.pad-focus { border-image-source: var(--px-key-gold-hi); } .pxk.gold:active { border-image: var(--px-key-gold-dn) 2 fill / 4px; }
    .pxk.red { border-image-source: var(--px-key-red); } .pxk.red:active { border-image: var(--px-key-red-dn) 2 fill / 4px; }
    .pxk.off { opacity: .45; cursor: default; pointer-events: none; }
    .pxk .ic { width: 18px; height: 18px; flex: none; background: currentColor; -webkit-mask: var(--ic) 0 0 / 18px 18px no-repeat; mask: var(--ic) 0 0 / 18px 18px no-repeat; filter: drop-shadow(2px 2px 0 rgba(0,0,0,.3)); }
    .pxk.gold .ic { filter: none; } .pxk:hover .ic.nudge { animation: pxk-nudge .4s steps(2) infinite; } @keyframes pxk-nudge { 50% { transform: translateX(3px); } }
    .pxk kbd { font: inherit; line-height: 1; padding: 1px 4px 0; color: #17181b; background: #efe9da; border: 2px solid #17181b; border-bottom-width: 4px; text-shadow: none; }
    .pxk.gold kbd { background: #17181b; color: #efc970; } .pxk.big { font-size: 24px; padding: 8px 16px 6px; } .pxk.big .ic { transform: scale(1.33); }`;
  document.head.appendChild(st); }
export function pxKey(label, { icon, key, kind = '', attrs = '', nudge } = {}) { pixUI(); keysCSS();
  return `<button class="pxk ${kind}" ${attrs}>${icon ? `<i class="ic${nudge ? ' nudge' : ''}" style="--ic: var(--ic-${icon})"></i>` : ''}${label ? `<span>${label}</span>` : ''}${key ? `<kbd>${key}</kbd>` : ''}</button>`; }
