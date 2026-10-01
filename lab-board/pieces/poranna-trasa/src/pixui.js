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
export function pixUI() { if (done) return; done = true; const r = document.documentElement.style;
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
