// Pixel cursors for the menus, in the game's own look: an arrow (cream, a dark rim, a yellow lit edge) and a pointing hand over the
// buttons; drawn here at twice their pixels, put on the page as CSS variables (--cur, --cur-hand).
const ARROW = [
  'X...........', 'XX..........', 'XYX.........', 'XYOX........', 'XYOOX.......', 'XYOOOX......', 'XYOOOOX.....', 'XYOOOOOX....', 'XYOOOOOOX...', 'XYOOOOOOOX..',
  'XYOOOOOOOOX.', 'XYOOOOOXXXXX', 'XYOOXOOX....', 'XYOXXOOX....', 'XYX..XOOX...', 'XX...XOOX...', 'X.....XOOX..', '......XOOX..', '.......XX...'];
const HAND = [
  '....XX..........', '...XYOX.........', '...XYOX.........', '...XYOX.........', '...XYOXXXXX.....', '...XYOXOOXOXX...', 'XX.XYOXOOXOOXX..', 'XYXXYOOOOOOOOX..',
  'XYOXYOOOOOOOOOX.', '.XYOOOOOOOOOOOX.', '..XYOOOOOOOOOOX.', '..XYOOOOOOOOOX..', '...XYOOOOOOOOX..', '....XYOOOOOOX...', '....XYOOOOOOX...', '....XXXXXXXXX...'];
const COL = { X: '#17181b', O: '#f6f3ea', Y: '#efc970' };

function draw(rows, k = 2) {
  const c = document.createElement('canvas'); c.width = rows[0].length * k; c.height = rows.length * k; const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (COL[ch]) { g.fillStyle = COL[ch]; g.fillRect(x * k, y * k, k, k); } }));
  return c.toDataURL('image/png');
}
export function installCursors() {
  const root = document.documentElement.style;
  root.setProperty('--cur', `url(${draw(ARROW)}) 0 0, default`);
  root.setProperty('--cur-hand', `url(${draw(HAND)}) 8 0, pointer`);
  const css = document.createElement('style'); css.textContent = `
    body.asking, body.asking * , #styl, #styl *, #stylBtn { cursor: var(--cur) !important; }
    #styl button, #styl input, #stylBtn, body.asking.over, body.asking.over * { cursor: var(--cur-hand) !important; }`;
  document.head.appendChild(css);
}
