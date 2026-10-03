// The game's own pixel letters: drawn here row by row, made into a real font (a TrueType file built in memory) and given to the page as
// 'PTPix', so every window can set its text in it and the text stays text (selectable, read out, wrapped by the browser).
// A pixel is 100 units, the em 8 pixels: at font-size 16px one pixel of a letter is 2 screen pixels (8px: 1, 24px: 3).
// Capitals 7 pixels tall, small letters 5 (ascenders 7, descenders 2 below), the Polish marks above or below; each letter as wide as
// it is drawn, a pixel's gap after it. Letters not drawn here come from the next font in the list.
// pixFont() → a promise of the FontFace (added to document.fonts)

// each: [top row's height (0 = the row sitting on the line), rows from the top ('#' a pixel)]
const G = {};
const def = (chars, top, rows) => { for (const c of chars) G[c] = [top, rows.split(' ')]; };
const C = 6, X = 4;   // (a capital's top row; a small letter's)
// capitals
def('A', C, '.###. #...# #...# ##### #...# #...# #...#'); def('B', C, '####. #...# #...# ####. #...# #...# ####.');
def('C', C, '.###. #...# #.... #.... #.... #...# .###.'); def('D', C, '####. #...# #...# #...# #...# #...# ####.');
def('E', C, '##### #.... #.... ####. #.... #.... #####'); def('F', C, '##### #.... #.... ####. #.... #.... #....');
def('G', C, '.###. #...# #.... #.### #...# #...# .####'); def('H', C, '#...# #...# #...# ##### #...# #...# #...#');
def('I', C, '### .#. .#. .#. .#. .#. ###'); def('J', C, '..### ...#. ...#. ...#. #..#. #..#. .##..');
def('K', C, '#...# #..#. #.#.. ##... #.#.. #..#. #...#'); def('L', C, '#.... #.... #.... #.... #.... #.... #####');
def('M', C, '#...# ##.## #.#.# #.#.# #...# #...# #...#'); def('N', C, '#...# ##..# ##..# #.#.# #..## #..## #...#');
def('O', C, '.###. #...# #...# #...# #...# #...# .###.'); def('P', C, '####. #...# #...# ####. #.... #.... #....');
def('Q', C, '.###. #...# #...# #...# #.#.# #..#. .##.#'); def('R', C, '####. #...# #...# ####. #.#.. #..#. #...#');
def('S', C, '.###. #...# #.... .###. ....# #...# .###.'); def('T', C, '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..');
def('U', C, '#...# #...# #...# #...# #...# #...# .###.'); def('V', C, '#...# #...# #...# #...# #...# .#.#. ..#..');
def('W', C, '#...# #...# #...# #.#.# #.#.# ##.## #...#'); def('X', C, '#...# #...# .#.#. ..#.. .#.#. #...# #...#');
def('Y', C, '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..'); def('Z', C, '##### ....# ...#. ..#.. .#... #.... #####');
// small letters
def('a', X, '.###. ....# .#### #...# .####'); def('b', C, '#.... #.... ####. #...# #...# #...# ####.');
def('c', X, '.#### #.... #.... #.... .####'); def('d', C, '....# ....# .#### #...# #...# #...# .####');
def('e', X, '.###. #...# ##### #.... .###.'); def('f', C, '.## #.. ### #.. #.. #.. #..');
def('g', X, '.#### #...# #...# #...# .#### ....# .###.'); def('h', C, '#.... #.... ####. #...# #...# #...# #...#');
def('i', C, '# . # # # # #'); def('j', C, '..# ... ..# ..# ..# ..# ..# #.# .#.');
def('k', C, '#... #... #..# #.#. ##.. #.#. #..#'); def('l', C, '#. #. #. #. #. #. .#');
def('m', X, '####. #.#.# #.#.# #.#.# #.#.#'); def('n', X, '####. #...# #...# #...# #...#');
def('o', X, '.###. #...# #...# #...# .###.'); def('p', X, '####. #...# #...# #...# ####. #.... #....');
def('q', X, '.#### #...# #...# #...# .#### ....# ....#'); def('r', X, '#.## ##.. #... #... #...');
def('s', X, '.#### #.... .###. ....# ####.'); def('t', C, '.#.. .#.. #### .#.. .#.. .#.. ..##');
def('u', X, '#...# #...# #...# #...# .####'); def('v', X, '#...# #...# #...# .#.#. ..#..');
def('w', X, '#...# #...# #.#.# #.#.# .#.#.'); def('x', X, '#...# .#.#. ..#.. .#.#. #...#');
def('y', X, '#...# #...# #...# #...# .#### ....# .###.'); def('z', X, '##### ...#. ..#.. .#... #####');
// the Polish ones: the mark above (a gap row under it), the tail below, the stroke through
const above = (c, base, mark = '...#.') => { const [t, r] = G[base], w = r[0].length; G[c] = [t + 2, [mark.padEnd(w, '.').slice(0, w), '.'.repeat(w), ...r]]; };
const tail = (c, base) => { const [t, r] = G[base], w = r[0].length; G[c] = [t, [...r, '...#.'.padEnd(w, '.').slice(0, w), '....#'.padEnd(w, '.').slice(0, w)]]; };
for (const [c, b] of [['Ć', 'C'], ['Ń', 'N'], ['Ó', 'O'], ['Ś', 'S'], ['Ź', 'Z'], ['ć', 'c'], ['ń', 'n'], ['ó', 'o'], ['ś', 's'], ['ź', 'z']]) above(c, b);
above('Ż', 'Z', '..#..'); above('ż', 'z', '..#..'); tail('Ą', 'A'); tail('Ę', 'E'); tail('ą', 'a'); tail('ę', 'e');
def('Ł', C, '.#... .#... .#.#. .##.. ##... .#... .####'); def('ł', C, '.#.. .#.. .##. ##.. .#.. .#.. ..##');
// digits
def('0', C, '.###. #...# #..## #.#.# ##..# #...# .###.'); def('1', C, '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.');
def('2', C, '.###. #...# ....# ...#. ..#.. .#... #####'); def('3', C, '####. ....# ....# .###. ....# ....# ####.');
def('4', C, '...#. ..##. .#.#. #..#. ##### ...#. ...#.'); def('5', C, '##### #.... ####. ....# ....# #...# .###.');
def('6', C, '.###. #.... #.... ####. #...# #...# .###.'); def('7', C, '##### ....# ...#. ..#.. .#... .#... .#...');
def('8', C, '.###. #...# #...# .###. #...# #...# .###.'); def('9', C, '.###. #...# #...# .#### ....# ....# .###.');
// the rest
def('.', 0, '#'); def(',', 0, '.# #.'); def(':', X, '# . . . #'); def(';', X, '.# .. .. .# #.'); def('!', C, '# # # # # . #');
def('?', C, '.###. #...# ....# ...#. ..#.. ..... ..#..'); def('-', 3, '####'); def('+', 5, '..#.. ..#.. ##### ..#.. ..#..');
def('=', 4, '#### .... ####'); def('%', C, '##..# ##.#. ...#. ..#.. .#... .#.## #..##'); def('/', C, '...# ...# ..#. ..#. .#.. .#.. #...');
def('(', C, '..# .#. #.. #.. #.. .#. ..#'); def(')', C, '#.. .#. ..# ..# ..# .#. #..'); def('[', C, '## #. #. #. #. #. ##'); def(']', C, '## .# .# .# .# .# ##');
def("'", C, '# #'); def('"', C, '#.# #.#'); def('”', C, '#.# #.#'); def('“', C, '#.# #.#'); def('„', 0, '#.# #.#'); def('·', 3, '#'); def('•', 4, '## ##');
def('×', 5, '#...# .#.#. ..#.. .#.#. #...#'); def('*', 5, '#.#.# .###. #.#.#'); def('#', C, '.#.#. ##### .#.#. .#.#. .#.#. ##### .#.#.');
def('_', 0, '#####'); def('–', 3, '#####'); def('—', 3, '#######'); def('…', 0, '#.#.#'); def('|', C, '# # # # # # #'); def('&', C, '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#');
def('<', 5, '...# ..#. .#.. #... .#.. ..#. ...#'); def('>', 5, '#... .#.. ..#. ...# ..#. .#.. #...'); def('→', 5, '....#.. .....#. ####### .....#. ....#..'); def('←', 5, '..#.... .#..... ####### .#..... ..#....');
def('↑', C, '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..'); def('↓', C, '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..'); def('°', C, '.#. #.# .#.'); def('$', C, '.###. #.#.. .###. ..#.# .###. ..#..');
def('@', C, '.###. #...# #.### #.#.# #.### #.... .####'); def('~', 4, '.#.#. #.#..'); def('^', C, '.#. #.#'); def('ü', X + 2, '#...# ..... #...# #...# #...# #...# .####'); def('é', X + 2, '...#. ..... .###. #...# ##### #.... .###.');

const PX = 100, EM = 800, ASC = 900, DESC = 200;

// ---------- the file: the tables of a TrueType font, each a list of big-endian numbers ----------
function build() {
  const chars = Object.keys(G).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  // the glyphs: 0 the missing one (an empty box), 1 the space, then the drawn ones; each pixel row's runs one rectangle
  const glyphs = [{ rects: [[0, 0, 5, 1], [0, 6, 5, 7], [0, 1, 1, 6], [4, 1, 5, 6]], w: 5 }, { rects: [], w: 3 }], codes = [[32, 1]];
  for (const c of chars) { const [top, rows] = G[c], rects = []; let w = 0;
    rows.forEach((r, i) => { const y = top - i; w = Math.max(w, r.length); for (let x = 0; x < r.length; x++) if (r[x] === '#') { let e = x; while (r[e + 1] === '#') e++; rects.push([x, y, e + 1, y + 1]); x = e; } });
    codes.push([c.codePointAt(0), glyphs.length]); glyphs.push({ rects, w }); }
  const B = () => { const a = []; const o = { u8: v => (a.push(v & 255), o), u16: v => (a.push((v >> 8) & 255, v & 255), o), i16: v => o.u16(v < 0 ? v + 65536 : v), u32: v => (o.u16((v >>> 16) & 65535), o.u16(v & 65535)), bytes: b => (a.push(...b), o), a }; return o; };
  // glyf + loca
  const glyf = B(), loca = B(); let maxPts = 0, maxCont = 0, bx0 = 0, by0 = 0, bx1 = 0, by1 = 0;
  for (const g of glyphs) { loca.u32(glyf.a.length); if (!g.rects.length) continue;
    const xs = g.rects.flatMap(r => [r[0], r[2]]), ys = g.rects.flatMap(r => [r[1], r[3]]), x0 = Math.min(...xs) * PX, x1 = Math.max(...xs) * PX, y0 = Math.min(...ys) * PX, y1 = Math.max(...ys) * PX;
    bx0 = Math.min(bx0, x0); by0 = Math.min(by0, y0); bx1 = Math.max(bx1, x1); by1 = Math.max(by1, y1);
    glyf.i16(g.rects.length).i16(x0).i16(y0).i16(x1).i16(y1); g.rects.forEach((_, i) => glyf.u16(i * 4 + 3)); glyf.u16(0);
    const pts = g.rects.flatMap(([a, b, c, d]) => [[a, b], [a, d], [c, d], [c, b]]);   // (clockwise, as TrueType wants the outside)
    for (const _ of pts) glyf.u8(1); let px = 0; for (const [x] of pts) { glyf.i16(x * PX - px); px = x * PX; } let py = 0; for (const [, y] of pts) { glyf.i16(y * PX - py); py = y * PX; }
    while (glyf.a.length % 4) glyf.u8(0); maxPts = Math.max(maxPts, pts.length); maxCont = Math.max(maxCont, g.rects.length); }
  loca.u32(glyf.a.length);
  const n = glyphs.length, adv = g => (g.w + 1) * PX, advMax = Math.max(...glyphs.map(adv));
  const head = B().u32(0x10000).u32(0x10000).u32(0).u32(0x5F0F3CF5).u16(3).u16(EM).u32(0).u32(0).u32(0).u32(0).i16(bx0).i16(by0).i16(bx1).i16(by1).u16(0).u16(6).i16(2).i16(1).i16(0);
  const hhea = B().u32(0x10000).i16(ASC).i16(-DESC).i16(0).u16(advMax).i16(0).i16(0).i16(bx1).i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(n);
  const hmtx = B(); for (const g of glyphs) hmtx.u16(adv(g)).i16(g.rects.length ? Math.min(...g.rects.map(r => r[0])) * PX : 0);
  const maxp = B().u32(0x10000).u16(n).u16(maxPts).u16(maxCont).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);
  // cmap: format 4, a segment a code (and the closing one)
  const segs = [...codes.map(([c, g]) => [c, c, (g - c + 65536) % 65536]), [0xFFFF, 0xFFFF, 1]], sc = segs.length, sr = 2 ** Math.floor(Math.log2(sc)) * 2, es = Math.log2(sr / 2);
  const sub = B().u16(4).u16(16 + sc * 8).u16(0).u16(sc * 2).u16(sr).u16(es).u16(sc * 2 - sr); segs.forEach(s => sub.u16(s[1])); sub.u16(0); segs.forEach(s => sub.u16(s[0])); segs.forEach(s => sub.u16(s[2])); segs.forEach(() => sub.u16(0));
  const cmap = B().u16(0).u16(1).u16(3).u16(1).u32(12).bytes(sub.a);
  const OS2 = B().u16(3).i16(Math.round(glyphs.reduce((s, g) => s + adv(g), 0) / n)).u16(400).u16(5).u16(0).i16(400).i16(400).i16(0).i16(100).i16(400).i16(400).i16(0).i16(400).i16(PX).i16(300).i16(0)
    .bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).u32(7).u32(0).u32(0).u32(0).bytes([80, 84, 80, 88]).u16(0x40).u16(32).u16(Math.min(0xFFFF, Math.max(...codes.map(c => c[0])))).i16(ASC).i16(-DESC).i16(0).u16(ASC).u16(DESC).u32(3).u32(0).i16(5 * PX).i16(7 * PX).u16(0).u16(32).u16(0);
  const strs = [[1, 'PTPix'], [2, 'Regular'], [3, 'PTPix-Regular-1'], [4, 'PTPix Regular'], [6, 'PTPix-Regular']], name = B().u16(0).u16(strs.length).u16(6 + strs.length * 12), sb = [];
  let off = 0; for (const [id, s] of strs) { const b = []; for (const ch of s) b.push(0, ch.charCodeAt(0)); name.u16(3).u16(1).u16(0x409).u16(id).u16(b.length).u16(off); off += b.length; sb.push(...b); } name.bytes(sb);
  const post = B().u32(0x30000).u32(0).i16(-PX).i16(PX).u32(0).u32(0).u32(0).u32(0).u32(0);
  const tables = [['OS/2', OS2], ['cmap', cmap], ['glyf', glyf], ['head', head], ['hhea', hhea], ['hmtx', hmtx], ['loca', loca], ['maxp', maxp], ['name', name], ['post', post]];
  // the directory and the tables, each on a 4-byte boundary, each with its checksum; then the whole file's in the head
  const nt = tables.length, srT = 2 ** Math.floor(Math.log2(nt)) * 16, out = B().u32(0x10000).u16(nt).u16(srT).u16(Math.log2(srT / 16)).u16(nt * 16 - srT);
  const sum = a => { let s = 0; for (let i = 0; i < a.length; i += 4) s = (s + ((a[i] << 24) | ((a[i + 1] || 0) << 16) | ((a[i + 2] || 0) << 8) | (a[i + 3] || 0))) >>> 0; return s; };
  let at = 12 + nt * 16; const body = [];
  for (const [tag, t] of tables) { const a = t.a; out.bytes([...tag].map(c => c.charCodeAt(0))).u32(sum(a)).u32(at).u32(a.length); const p = a.slice(); while (p.length % 4) p.push(0); body.push(...p); at += p.length; }
  const file = new Uint8Array([...out.a, ...body]), adj = (0xB1B0AFBA - sum(file)) >>> 0, ho = 12 + nt * 16 + tables.slice(0, 3).reduce((s, [, t]) => s + Math.ceil(t.a.length / 4) * 4, 0) + 8;
  file[ho] = adj >>> 24; file[ho + 1] = (adj >>> 16) & 255; file[ho + 2] = (adj >>> 8) & 255; file[ho + 3] = adj & 255;
  return file.buffer;
}

let ready = null;
export function pixFont() { if (ready) return ready; try { const f = new FontFace('PTPix', build()); ready = f.load().then(f => (document.fonts.add(f), f)).catch(e => (console.warn('pixel font', e), null)); } catch (e) { console.warn('pixel font', e); ready = Promise.resolve(null); } return ready; }
