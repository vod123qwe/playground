// The rules of chess, on their own (no drawing): the board as 64 squares (0 = a1, 7 = h1, 56 = a8), a piece as a letter (PNBRQK
// white, pnbrqk black, '' empty). A position: { b, turn: 'w' | 'b', cr: castling rights ('KQkq', what is left), ep: the square a pawn
// just skipped (or -1), half: moves since a capture or a pawn move, full: the move number, keys: the positions so far (for three
// times the same) }. legal() lists the moves, play() makes one (a new position), status() says how it stands: play, check, mate,
// stalemate, or a draw (fifty moves, three times the same, too little to mate). san() writes a move in Polish notation (K król,
// H hetman, W wieża, G goniec, S skoczek). Checked against the standard perft counts (see the test at the bottom).

const W = c => c >= 'A' && c <= 'Z', colorOf = c => !c ? null : W(c) ? 'w' : 'b';
const F = s => s & 7, R = s => s >> 3, at = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1;
export const sqName = s => 'abcdefgh'[F(s)] + (R(s) + 1), sqOf = n => at('abcdefgh'.indexOf(n[0]), +n[1] - 1);
const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]], KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DB = [[1, 1], [1, -1], [-1, 1], [-1, -1]], DR = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export function fromFEN(fen) {
  const [pl, turn = 'w', cr = '-', ep = '-', half = '0', full = '1'] = fen.trim().split(/\s+/), b = Array(64).fill('');
  pl.split('/').forEach((row, i) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) f += +ch; else { b[(7 - i) * 8 + f] = ch; f++; } } });
  const s = { b, turn, cr: cr === '-' ? '' : cr, ep: ep === '-' ? -1 : sqOf(ep), half: +half, full: +full, keys: [] };
  s.keys = [key(s)]; return s;
}
export function toFEN(s) {
  const rows = []; for (let r = 7; r >= 0; r--) { let row = '', n = 0; for (let f = 0; f < 8; f++) { const p = s.b[r * 8 + f]; if (!p) n++; else { if (n) row += n; n = 0; row += p; } } if (n) row += n; rows.push(row); }
  return `${rows.join('/')} ${s.turn} ${s.cr || '-'} ${s.ep < 0 ? '-' : sqName(s.ep)} ${s.half} ${s.full}`;
}
const key = s => s.b.map(p => p || '.').join('') + s.turn + s.cr + s.ep;

// is square sq attacked by colour by?
export function attacked(b, sq, by) {
  const f = F(sq), r = R(sq), mine = c => c && colorOf(c) === by, is = (c, t) => mine(c) && c.toLowerCase() === t;
  const pr = by === 'w' ? r - 1 : r + 1; for (const df of [-1, 1]) { const q = at(f + df, pr); if (q >= 0 && is(b[q], 'p')) return true; }
  for (const [df, dr] of KN) { const q = at(f + df, r + dr); if (q >= 0 && is(b[q], 'n')) return true; }
  for (const [df, dr] of KG) { const q = at(f + df, r + dr); if (q >= 0 && is(b[q], 'k')) return true; }
  for (const [dirs, ts] of [[DB, 'bq'], [DR, 'rq']]) for (const [df, dr] of dirs) {
    for (let k = 1; ; k++) { const q = at(f + df * k, r + dr * k); if (q < 0) break; const c = b[q]; if (c) { if (mine(c) && ts.includes(c.toLowerCase())) return true; break; } }
  }
  return false;
}
export const kingOf = (b, col) => b.findIndex(c => c === (col === 'w' ? 'K' : 'k'));
export const inCheck = (s, col = s.turn) => { const k = kingOf(s.b, col); return k >= 0 && attacked(s.b, k, col === 'w' ? 'b' : 'w'); };

function pseudo(s) {
  const out = [], b = s.b, me = s.turn, them = me === 'w' ? 'b' : 'w', add = (from, to, flag = '', promo = '') => out.push({ from, to, piece: b[from], cap: flag === 'ep' ? b[to + (me === 'w' ? -8 : 8)] : b[to], flag, promo });
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq]; if (!p || colorOf(p) !== me) continue;
    const t = p.toLowerCase(), f = F(sq), r = R(sq);
    if (t === 'p') {
      const dir = me === 'w' ? 1 : -1, last = me === 'w' ? 7 : 0, first = me === 'w' ? 1 : 6;
      const push = (to, flag = '') => { if (R(to) === last) for (const q of 'qrbn') add(sq, to, flag, me === 'w' ? q.toUpperCase() : q); else add(sq, to, flag); };
      const one = at(f, r + dir); if (one >= 0 && !b[one]) { push(one); const two = at(f, r + 2 * dir); if (r === first && !b[two]) add(sq, two, 'double'); }
      for (const df of [-1, 1]) { const q = at(f + df, r + dir); if (q < 0) continue; if (b[q] && colorOf(b[q]) === them) push(q); else if (q === s.ep) add(sq, q, 'ep'); }
    } else if (t === 'n' || t === 'k') {
      for (const [df, dr] of t === 'n' ? KN : KG) { const q = at(f + df, r + dr); if (q >= 0 && colorOf(b[q]) !== me) add(sq, q); }
      if (t === 'k') {                                                  // castling: the rights left, the squares between empty, none the king crosses attacked
        const home = me === 'w' ? 4 : 60, [K, Q] = me === 'w' ? ['K', 'Q'] : ['k', 'q'];
        if (sq === home && !attacked(b, home, them)) {
          if (s.cr.includes(K) && !b[home + 1] && !b[home + 2] && b[home + 3] === (me === 'w' ? 'R' : 'r') && !attacked(b, home + 1, them) && !attacked(b, home + 2, them)) add(sq, home + 2, 'O-O');
          if (s.cr.includes(Q) && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === (me === 'w' ? 'R' : 'r') && !attacked(b, home - 1, them) && !attacked(b, home - 2, them)) add(sq, home - 2, 'O-O-O');
        }
      }
    } else {
      for (const [df, dr] of t === 'b' ? DB : t === 'r' ? DR : [...DB, ...DR]) for (let k = 1; ; k++) { const q = at(f + df * k, r + dr * k); if (q < 0) break; if (!b[q]) add(sq, q); else { if (colorOf(b[q]) !== me) add(sq, q); break; } }
    }
  }
  return out;
}
// the position after move m (a new one; the old stays as it was)
export function play(s, m) {
  const b = s.b.slice(), me = s.turn;
  b[m.to] = m.promo || b[m.from]; b[m.from] = '';
  if (m.flag === 'ep') b[m.to + (me === 'w' ? -8 : 8)] = '';
  if (m.flag === 'O-O') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = ''; }
  if (m.flag === 'O-O-O') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = ''; }
  let cr = s.cr; const drop = c => { cr = cr.replace(c, ''); };
  if (m.piece === 'K') { drop('K'); drop('Q'); } if (m.piece === 'k') { drop('k'); drop('q'); }
  for (const [sq, c] of [[0, 'Q'], [7, 'K'], [56, 'q'], [63, 'k']]) if (m.from === sq || m.to === sq) drop(c);
  const n = { b, turn: me === 'w' ? 'b' : 'w', cr, ep: m.flag === 'double' ? (m.from + m.to) / 2 : -1, half: m.piece.toLowerCase() === 'p' || m.cap ? 0 : s.half + 1, full: s.full + (me === 'b' ? 1 : 0), keys: null };
  n.keys = [...s.keys, key(n)]; return n;
}
export function legal(s) { return pseudo(s).filter(m => !inCheck(play(s, m), s.turn)); }
export function status(s, moves = legal(s)) {
  if (!moves.length) return inCheck(s) ? 'mate' : 'stalemate';
  if (s.half >= 100) return 'fifty';
  const k = s.keys[s.keys.length - 1]; if (s.keys.filter(x => x === k).length >= 3) return 'threefold';
  const rest = s.b.filter(c => c && c.toLowerCase() !== 'k'), minor = rest.every(c => 'bnBN'.includes(c));
  if (!rest.length || (rest.length === 1 && minor)) return 'material';
  if (rest.every(c => c.toLowerCase() === 'b')) { const col = new Set(s.b.map((c, i) => c.toLowerCase() === 'b' ? (F(i) + R(i)) & 1 : -1).filter(v => v >= 0)); if (col.size === 1) return 'material'; }
  return inCheck(s) ? 'check' : 'play';
}
// a move in Polish notation: Sf3, exd5, Wad1, e8=H+, O-O, Hxf7#
const PL = { n: 'S', b: 'G', r: 'W', q: 'H', k: 'K' };
export function san(s, m, moves = legal(s)) {
  let t;
  if (m.flag === 'O-O' || m.flag === 'O-O-O') t = m.flag;
  else {
    const p = m.piece.toLowerCase(), cap = !!m.cap;
    if (p === 'p') t = (cap ? 'abcdefgh'[F(m.from)] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + PL[m.promo.toLowerCase()] : '');
    else { const same = moves.filter(o => o !== m && o.piece === m.piece && o.to === m.to && o.from !== m.from); let d = '';
      if (same.length) { const fu = same.every(o => F(o.from) !== F(m.from)), ru = same.every(o => R(o.from) !== R(m.from)); d = fu ? 'abcdefgh'[F(m.from)] : ru ? String(R(m.from) + 1) : sqName(m.from); }
      t = PL[p] + d + (cap ? 'x' : '') + sqName(m.to); }
  }
  const n = play(s, m), st = status(n); return t + (st === 'mate' ? '#' : inCheck(n) ? '+' : '');
}
// a move as the network sends it ('e2e4', 'e7e8q') and back (null if it is not legal here)
export const uci = m => sqName(m.from) + sqName(m.to) + (m.promo ? m.promo.toLowerCase() : '');
export function fromUci(s, u) { if (typeof u !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) return null; const from = sqOf(u.slice(0, 2)), to = sqOf(u.slice(2, 4)), pr = u[4] || '';
  return legal(s).find(m => m.from === from && m.to === to && (m.promo ? m.promo.toLowerCase() === pr : !pr)) || null; }
// a position set up by hand: legal to play from? (one king each, the side not to move not in check); castling where king and rook stand at home
export function fromSetup(b, turn = 'w') {
  if (b.filter(c => c === 'K').length !== 1 || b.filter(c => c === 'k').length !== 1) return null;
  if ([...b.slice(0, 8), ...b.slice(56)].some(c => c && c.toLowerCase() === 'p')) return null;   // no pawn on the first or the last rank
  let cr = ''; if (b[4] === 'K') { if (b[7] === 'R') cr += 'K'; if (b[0] === 'R') cr += 'Q'; } if (b[60] === 'k') { if (b[63] === 'r') cr += 'k'; if (b[56] === 'r') cr += 'q'; }
  const s = { b: b.slice(), turn, cr, ep: -1, half: 0, full: 1, keys: [] }; s.keys = [key(s)];
  if (inCheck(s, turn === 'w' ? 'b' : 'w')) return null;
  return s;
}
export function perft(s, d) { if (!d) return 1; let n = 0; for (const m of legal(s)) n += d === 1 ? 1 : perft(play(s, m), d - 1); return n; }
