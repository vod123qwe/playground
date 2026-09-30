// Chess at a table: the set (chessset.js), the rules (chess.js), a little panel, and a game with someone else on the page.
// The set lies folded on a shelf in the study; taken in the hand and put down on a table (or any level top) it opens as a real one
// does (the lid up, the pieces out, the case turned over, the board on its outside up), white's side towards you, the pieces standing
// by the board. At the board a single action shows ("Szachy", and how the game stands); a click on it opens the panel with the rest. Set them up by hand (a click on a piece, a click on a square; a click off the board
// sends it back) or with one click; then play: a click on a piece shows where it may go, a click there moves it; the rules are all
// there (check, mate, stalemate, castling, en passant, promotion, the draws). Alone you move both sides.
// With someone: "Zagraj z kimś" shares the board: everyone else on the page sees it on the same table, and one of them can sit in as
// black. The one who shared it keeps the game (the moves) and passes it round; a move from black is checked here before it counts.
// What goes out: where the board lies, the moves, who plays which side (as random ids). What comes in is checked (the moves replayed).

import { createChessSet } from './chessset.js?v=3';
import * as C from './chess.js?v=1';

const NAME = { w: 'białe', b: 'czarne' }, WHO = { w: 'białych', b: 'czarnych' }, WIN = { w: 'białe', b: 'czarne' };
const PROMO = [['q', 'Hetman'], ['r', 'Wieża'], ['b', 'Goniec'], ['n', 'Skoczek']];

export function createChess({ THREE, scene, camera, M, clip, onChange = () => {} }) {
  let net = null;                                                     // { send(d, to), id }
  // ---------- a board: your own (from the box) or one someone shared ----------
  function makeBoard(remote) {
    const set = createChessSet({ THREE, clip });
    return { set, remote, phase: remote ? 'play' : 'shelf', s: C.fromFEN(C.START), hist: [], moves: [], sans: [], sel: null, targets: [], promo: null, last: null, shared: false, w: null, b: null, owner: null, seen: 0, msg: '' };
  }
  const L = makeBoard(false); let RB = null;                           // yours; the one shared with you
  const boards = () => [L, RB].filter(Boolean);
  const turnOf = B => B.s.turn;
  const iMay = B => B.phase === 'play' && !B.promo && (!B.remote && !B.shared ? true : B.remote ? B.b === net?.id && turnOf(B) === 'b' : turnOf(B) === 'w');   // (shared: its owner plays white)

  // the pieces to where a position has them: those already right stay; the rest go where they are needed (a captured queen back for a
  // promotion, as over a real board; if there is none, the pawn becomes one); what is left over goes to the side, in the order taken
  function sync(B, b, instant, wave) {
    const set = B.set, used = new Set(), need = [];
    for (let sq = 0; sq < 64; sq++) { const c = b[sq]; if (!c) continue; const col = c === c.toUpperCase() ? 'w' : 'b', t = c.toLowerCase();
      const pc = set.pieces.find(p => !used.has(p) && p.sq === sq && p.type === t && p.col === col); if (pc) used.add(pc); else need.push({ sq, t, col }); }
    let i = 0;
    for (const n of need) {
      const free = set.pieces.filter(p => !used.has(p) && p.col === n.col), onB = p => p.sq >= 0 ? 0 : p.sq === -2 ? 1 : 2;
      let pc = free.filter(p => p.type === n.t).sort((a, c) => onB(a) - onB(c))[0];
      if (!pc) { pc = free.filter(p => p.type === 'p').sort((a, c) => onB(a) - onB(c))[0] || free[0]; if (!pc) continue; set.retype(pc, n.t); }
      used.add(pc); set.toSq(pc, n.sq, instant, wave ? i++ * .05 : 0);
    }
    // the rest: those that were in play to the side (in the order they were taken), the ones never set out stay by the board
    const rest = set.pieces.filter(p => !used.has(p) && (p.sq >= 0 || p.sq === -2)).sort((a, c) => (a.takenAt || 0) - (c.takenAt || 0));
    set.resetTaken(); let k = 0;
    for (const p of rest) { if (p.sq >= 0) p.takenAt = ++TAKEN; p.sel = false; set.capture(p, 0, instant); k++; }
    for (const p of set.pieces) if (!used.has(p) && p.sq === -1 && p.type !== ORIG.get(p)) set.retype(p, ORIG.get(p));
  }
  let TAKEN = 0; const ORIG = new Map(); for (const B of [L]) for (const p of B.set.pieces) ORIG.set(p, p.type);
  function marks(B) {
    const k = C.inCheck(B.s) ? C.kingOf(B.s.b, B.s.turn) : -1;
    B.set.markers(B.sel ? B.targets.map(m => ({ sq: m.to, cap: !!m.cap })) : [], B.last, B.phase === 'play' || B.phase === 'over' ? k : -1, B.sel && B.sel.sq >= 0 ? B.sel.sq : -1);
  }
  const select = (B, pc) => { for (const p of B.set.pieces) p.sel = false; B.sel = pc; if (pc) pc.sel = true; B.targets = pc && B.phase === 'play' ? C.legal(B.s).filter(m => m.from === pc.sq) : []; marks(B); };

  // ---------- moving ----------
  function apply(B, m, fromNet) {
    const san = C.san(B.s, m); B.hist.push(B.s); B.s = C.play(B.s, m); B.moves.push(C.uci(m)); B.sans.push(san); B.last = [m.from, m.to];
    select(B, null); sync(B, B.s.b); const st = C.status(B.s); if (!['play', 'check'].includes(st)) B.phase = 'over'; marks(B); paint();
    if (B === L && L.shared && !fromNet) share();
    onChange();
  }
  function tryMove(B, m) {
    if (m.promo && !B.promo) { B.promo = { from: m.from, to: m.to }; paint(); return; }   // which piece? the panel asks
    if (B.remote) { net?.send({ t: 'mv', u: C.uci(m), n: B.moves.length }, B.owner); apply(B, m, true); return; }   // (applied at once; the owner's word follows)
    apply(B, m);
  }
  function promoteTo(t) {
    const B = active(); if (!B || !B.promo) return; const m = C.legal(B.s).find(x => x.from === B.promo.from && x.to === B.promo.to && x.promo && x.promo.toLowerCase() === t);
    B.promo = null; if (m) tryMove(B, m); else paint();
  }
  function newGame(B, wave = true) { B.s = C.fromFEN(C.START); B.hist = []; B.moves = []; B.sans = []; B.last = null; B.phase = 'play'; B.promo = null; select(B, null); sync(B, B.s.b, false, wave); marks(B); paint(); if (B === L && L.shared) share(); }
  function undo() { if (!L.hist.length || L.shared) return; L.s = L.hist.pop(); L.moves.pop(); L.sans.pop(); const m = L.moves.length ? C.fromUci(L.hist.length ? L.hist[L.hist.length - 1] : C.fromFEN(C.START), L.moves[L.moves.length - 1]) : null;
    L.last = m ? [m.from, m.to] : null; L.phase = 'play'; L.promo = null; select(L, null); sync(L, L.s.b); marks(L); paint(); onChange(); }
  function startFromSetup() {                                          // the position as set out by hand; white to move
    const b = Array(64).fill(''); for (const p of L.set.pieces) if (p.sq >= 0) b[p.sq] = p.col === 'w' ? p.type.toUpperCase() : p.type;
    const s = C.fromSetup(b, 'w'); if (!s) { L.msg = 'To ustawienie nie nadaje się do gry: każda strona potrzebuje króla, pionki nie na skrajnych rzędach, czarny król bez szacha.'; paint(); return; }
    L.s = s; L.hist = []; L.moves = []; L.sans = []; L.last = null; L.phase = C.status(s) === 'play' || C.status(s) === 'check' ? 'play' : 'over'; L.msg = ''; select(L, null); marks(L); paint();
  }
  function autoSetup() { L.msg = ''; const s = C.fromFEN(C.START); L.s = s; sync(L, s.b, false, true); L.phase = 'setup'; select(L, null); marks(L); paint(); }

  // ---------- the box: put down, opened, packed ----------
  function put(point, yaw) {                                           // (from the hand: the caller has it in the scene, at the point, turned)
    L.phase = 'setup'; for (const p of L.set.pieces) { p.sel = false; if (p.type !== ORIG.get(p)) L.set.retype(p, ORIG.get(p)); } L.set.resetTaken(); L.set.setOpen(true); UI.open = false;
    L.s = C.fromFEN(C.START); L.hist = []; L.moves = []; L.sans = []; L.last = null; L.msg = ''; select(L, null); marks(L); paint(); onChange();
  }
  function pack() { if (L.shared) unshare(); L.phase = 'closed'; select(L, null); for (const p of L.set.pieces) if (p.type !== ORIG.get(p)) L.set.retype(p, ORIG.get(p)); L.set.setOpen(false); UI.open = false; paint(); onChange(); }
  const takeable = () => L.phase === 'closed' || L.phase === 'shelf';

  // ---------- clicks: on a piece, a square, off the board ----------
  const ray = new THREE.Raycaster(), _p = new THREE.Vector3();
  function boardOf(o) { for (const B of boards()) { let q = o; while (q) { if (q === B.set.group) return B; q = q.parent; } } return null; }
  function click(hit) {
    if (!hit) return false;
    const B = boardOf(hit.object);
    if (!B) { if (L.sel && L.phase === 'setup' && hit.distance < 3.2 && L.set.group.parent) { L.set.group.worldToLocal(_p.copy(hit.point)); if (Math.hypot(_p.x, _p.z) < 80) { L.set.toHome(L.sel); select(L, null); onChange(); return true; } } return false; }
    if (B.set.stage === 'busy') return true;                           // opening, packing: hands off
    if (!B.set.isOpen) return false;                                   // folded: the caller takes it in the hand
    if (hit.distance > 3.2) return false;
    const pc = hit.object.userData.chessPiece; B.set.group.worldToLocal(_p.copy(hit.point));
    const sq = pc ? pc.sq : B.set.sqAt(_p.x, _p.z);
    if (B.phase === 'setup') {
      if (pc && (!L.sel || pc.sq < 0 || pc === L.sel)) { select(L, pc === L.sel ? null : pc); onChange(); return true; }
      if (L.sel) { if (sq >= 0) { const there = L.set.pieces.find(p => p.sq === sq && p !== L.sel); if (there) L.set.toHome(there); L.set.toSq(L.sel, sq); } else L.set.toHome(L.sel); select(L, null); onChange(); }
      return true;
    }
    if (B.phase !== 'play') return true;
    if (B.sel && sq >= 0) { const ms = B.targets.filter(m => m.to === sq); if (ms.length) { tryMove(B, ms.find(m => !m.promo) || ms[0]); return true; } }
    const own = pc && pc.sq >= 0 && pc.col === turnOf(B) && iMay(B);
    select(B, own && pc !== B.sel ? pc : null); onChange(); return true;
  }

  // ---------- with someone ----------
  let shareT = 0;
  function share() { if (!net) return; L.shared = true; L.owner = net.id; L.w = net.id; const g = L.set.group, wp = g.getWorldPosition(new THREE.Vector3());
    net.send({ t: 'st', at: [+wp.x.toFixed(3), +wp.y.toFixed(3), +wp.z.toFixed(3)], yaw: +g.rotation.y.toFixed(4), moves: L.moves, b: L.b }); shareT = 2; }
  function startShared() { if (!net) { L.msg = 'Brak połączenia z innymi: włącz w panelu „Other visitors, live”.'; paint(); return; } L.shared = true; L.b = null; newGame(L); L.msg = ''; share(); paint(); }
  function unshare() { if (net && L.shared) net.send({ t: 'end' }); L.shared = false; L.b = null; paint(); }
  function receive(d, from) {
    if (!d || typeof d !== 'object' || typeof from !== 'string') return;
    const N = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null;
    if (L.shared) {                                                    // to the owner: someone sits in, moves, gets up
      if (d.t === 'join' && !L.b) { L.b = from; share(); paint(); }
      else if (d.t === 'leave' && L.b === from) { L.b = null; share(); paint(); }
      else if (d.t === 'mv' && L.b === from && L.phase === 'play' && L.s.turn === 'b' && d.n === L.moves.length) { const m = C.fromUci(L.s, d.u); if (m) apply(L, m, false); else share(); }
      else if (d.t === 'mv') share();                                  // (out of step: here is how it stands)
    }
    if (d.t === 'st') {                                                // a shared board: shown on its table, replayed from the start
      if (RB && RB.owner !== from) return;                             // (one at a time)
      const at = Array.isArray(d.at) && d.at.map(v => N(v, -60, 60)), yaw = N(d.yaw, -10, 10);
      if (!at || at.some(v => v === null) || yaw === null || !Array.isArray(d.moves) || d.moves.length > 800) return;
      let s = C.fromFEN(C.START); const hist = [], sans = []; let last = null;
      for (const u of d.moves) { const m = C.fromUci(s, u); if (!m) return; sans.push(C.san(s, m)); hist.push(s); s = C.play(s, m); last = [m.from, m.to]; }
      if (!RB) { RB = makeBoard(true); scene.add(RB.set.group); RB.set.group.scale.setScalar(M); RB.set.setOpen(true, true); for (const p of RB.set.pieces) ORIG.set(p, p.type); RB.set.group.traverse(o => { o.userData.noTrace = true; }); }
      RB.owner = from; RB.w = from; RB.b = typeof d.b === 'string' ? d.b : null; RB.seen = performance.now();
      RB.set.group.position.set(at[0], at[1], at[2]); RB.set.group.rotation.y = yaw;
      const fresh = d.moves.length !== RB.moves.length || d.moves.some((u, i) => u !== RB.moves[i]);
      if (fresh) { const one = d.moves.length === RB.moves.length + 1 && RB.moves.every((u, i) => u === d.moves[i]);
        RB.s = s; RB.hist = hist; RB.moves = d.moves.slice(); RB.sans = sans; RB.last = last; RB.promo = null; select(RB, null); sync(RB, s.b, !RB.synced); RB.synced = true; void one;
        const st = C.status(s); RB.phase = ['play', 'check'].includes(st) ? 'play' : 'over'; marks(RB); onChange(); }
      paint();
    } else if (d.t === 'end' && RB && RB.owner === from) dropRemote();
  }
  function dropRemote() { if (!RB) return; scene.remove(RB.set.group); RB = null; paint(); onChange(); }
  function joined(id) { if (L.shared) share(); }
  function left(id) { if (L.shared && L.b === id) { L.b = null; share(); } if (RB && RB.owner === id) dropRemote(); }

  // ---------- the panel: what stands, what you can do ----------
  const css = document.createElement('style'); css.textContent = `
  .chessui{position:fixed; left:50%; bottom:calc(118px + env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:7; display:none; flex-direction:column; align-items:center; gap:8px;
    max-width:min(560px, calc(100vw - 32px)); padding:10px 12px; border-radius:16px; background:#fff; box-shadow:0 0 0 1px var(--line, rgba(0,0,0,.1)), 0 6px 24px rgba(0,0,0,.12); font:500 13px/1.35 Inter, sans-serif; color:var(--ink, #141414)}
  .chessui.on{display:flex; animation:chessin .28s cubic-bezier(.2,.8,.2,1)} @keyframes chessin{from{opacity:0; transform:translate(-50%, 8px)}} .chessui b{font-weight:650} .chessui .mv{color:var(--muted, #6b6b6b); font-size:12px; text-align:center; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
  .chessui .row{display:flex; flex-wrap:wrap; justify-content:center; gap:6px}
  .chessui button{height:32px; padding:0 12px; border:0; border-radius:999px; background:rgba(20,20,20,.06); color:inherit; font:600 12.5px/1 Inter, sans-serif; cursor:pointer}
  .chessui button.pri{background:var(--ink, #141414); color:#fff} .chessui button:focus-visible{outline:2px solid rgba(20,20,20,.4); outline-offset:2px}
  .chessui .note{color:#8a4b12; font-size:12px; text-align:center}
  .chessui.chip{padding:0; background:transparent; box-shadow:none}
  .chessui .act{display:flex; align-items:center; gap:8px; height:40px; padding:0 16px 0 12px; border:0; border-radius:999px; background:var(--ink, #141414); color:#fff; font:600 13px/1 Inter, sans-serif; cursor:pointer;
    box-shadow:0 0 0 4px rgba(20,20,20,.08), 0 6px 20px rgba(0,0,0,.2); animation:chessglow 2.4s ease-in-out 2}
  .chessui .act span{font-weight:500; opacity:.7} .chessui .act svg{width:18px; height:18px}
  .chessui .x{position:absolute; top:6px; right:6px; width:26px; height:26px; padding:0; display:grid; place-items:center; background:transparent; font-size:16px; color:var(--muted, #6b6b6b)}
  .chessui:not(.chip){padding-right:36px; position:fixed}
  @keyframes chessglow{50%{box-shadow:0 0 0 7px rgba(20,20,20,.12), 0 6px 20px rgba(0,0,0,.2)}}
  @media (prefers-reduced-motion: reduce){ .chessui .act{animation:none} }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.className = 'chessui'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Szachy'); document.body.appendChild(el);
  let near = null;                                                    // the board you are at (within 3 m), or none
  const UI = { open: false };                                         // the panel opened from its action (it folds back when you walk off)
  const knight = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 20h11v-2.2c0-3.6-1.3-6.1-3.2-8.4l.9-3.1-2.6 1.3C11.4 6.6 9.3 7 8 8.9L5.4 12l1.5 1.7 2.3-1.3 1.9.9C9 15.3 7.6 17.2 7 20z"/></svg>';
  function active() { return near; }
  const btn = (label, fn, pri) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (pri) b.className = 'pri'; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
  function statusLine(B) {
    const st = C.status(B.s);
    if (st === 'mate') return `<b>Mat.</b> Wygrywają ${WIN[B.s.turn === 'w' ? 'b' : 'w']}.`;
    if (st === 'stalemate') return '<b>Pat.</b> Remis.';
    if (st === 'fifty') return '<b>Remis</b>: 50 ruchów bez bicia i ruchu pionem.';
    if (st === 'threefold') return '<b>Remis</b>: trzy razy ta sama pozycja.';
    if (st === 'material') return '<b>Remis</b>: za mało materiału do mata.';
    return `Ruch ${WHO[B.s.turn]}${st === 'check' ? ' · <b>szach!</b>' : ''}`;
  }
  function paint() {
    const B = near; el.classList.toggle('on', !!B && B.phase !== 'shelf' && B.phase !== 'closed'); if (!B || !el.classList.contains('on')) return;
    el.innerHTML = ''; el.classList.toggle('chip', !UI.open && !B.promo);
    if (!UI.open && !B.promo) {                                        // the action: the game's name and how it stands
      const a = btn('', () => { UI.open = true; paint(); }); a.className = 'act'; a.setAttribute('aria-expanded', 'false');
      a.innerHTML = `${knight}Szachy<span>${B.phase === 'setup' ? 'zagraj' : statusLine(B).replace(/<[^>]+>/g, '').replace(/\.$/, '').toLowerCase()}</span>`; a.title = 'Zagraj w szachy'; el.appendChild(a); return;
    }
    const x = btn('×', () => { UI.open = false; paint(); }); x.className = 'x'; x.setAttribute('aria-label', 'Zwiń'); el.appendChild(x);
    const head = document.createElement('div'), mv = document.createElement('div'), row = document.createElement('div'); mv.className = 'mv'; row.className = 'row';
    if (B.promo) { head.innerHTML = '<b>Promocja.</b> Na co zamieniasz pionka?'; for (const [t, n] of PROMO) row.appendChild(btn(n, () => promoteTo(t), t === 'q')); row.appendChild(btn('Anuluj', () => { B.promo = null; paint(); })); el.append(head, row); return; }
    if (B.phase === 'setup') { head.innerHTML = '<b>Szachy.</b> Ułóż figury na szachownicy (klik w figurę, potem w pole) albo zrób to jednym kliknięciem.';
      row.append(btn('Ułóż figury', autoSetup, true), btn('Graj sam', startFromSetup), btn('Zagraj z kimś', startShared), btn('Złóż do pudełka', pack)); }
    else {
      const you = B.remote ? (B.b === net?.id ? ' · grasz czarnymi' : B.b ? ' · oglądasz' : '') : B.shared ? ` · grasz białymi${B.b ? '' : ' · czekam, aż ktoś usiądzie do czarnych'}` : ' · grasz sam, obiema stronami';
      head.innerHTML = statusLine(B) + you;
      const n = B.sans.length, first = Math.max(0, n - 10 - (n % 2)); let t = ''; for (let i = first; i < n; i++) t += (i % 2 === 0 ? `${i / 2 + 1}. ` : '') + B.sans[i] + ' ';
      mv.textContent = n ? (first ? '… ' : '') + t.trim() : 'Białe zaczynają.';
      if (B.remote) { if (!B.b) row.appendChild(btn('Dołącz jako czarne', () => net?.send({ t: 'join' }, B.owner), true)); else if (B.b === net?.id) row.appendChild(btn('Wstań od gry', () => net?.send({ t: 'leave' }, B.owner))); }
      else { if (!B.shared) row.appendChild(btn('Cofnij ruch', undo)); row.appendChild(btn('Nowa partia', () => newGame(L), B.phase === 'over'));
        row.appendChild(B.shared ? btn('Zakończ wspólną grę', unshare) : btn('Zagraj z kimś', startShared)); row.appendChild(btn('Złóż do pudełka', pack)); }
    }
    el.append(head); if (B.phase !== 'setup') el.append(mv); if (L.msg && B === L) { const nt = document.createElement('div'); nt.className = 'note'; nt.textContent = L.msg; el.append(nt); } el.append(row);
  }
  // each frame: the sets' motion; which board you are at (the panel follows it); the owner's round of the state; a shared board gone quiet
  const _c = new THREE.Vector3();
  // the action shows when you come up to a board (within 1.6 m; it goes again past 2 m, the panel past 2.4 m) or when the pointer is
  // over the set (within reach, 3 m)
  function step(dt, show, pray) {
    let moved = false; for (const B of boards()) if (B.set.step(dt)) moved = true;
    let best = null, bd = 1e9; const hov = show && pray ? pray.intersectObjects(boards().filter(B => B.set.isOpen && B.set.group.parent).map(B => B.set.group), true)[0] : null, hovB = hov && hov.distance < 3.2 ? boardOf(hov.object) : null;
    if (show) for (const B of boards()) { if (!B.set.group.parent || !B.set.isOpen) continue; B.set.group.getWorldPosition(_c); const d = _c.distanceTo(camera.position), keep = B === near ? (UI.open ? 2.4 : 2) : 1.6;
      if ((d < keep || B === hovB || (B === near && B.promo)) && d < bd) { bd = d; best = B; } }
    if (best !== near) { near = best; UI.open = false; paint(); }
    if (L.shared && (shareT -= dt) <= 0) share();
    if (RB && performance.now() - RB.seen > 9000) dropRemote();
    return moved;
  }
  return { set: L.set, group: L.set.group, click, put, step, receive, joined, left, takeable, setNet(n) { net = n; if (!n && L.shared) { L.shared = false; L.b = null; paint(); } }, get phase() { return L.phase; }, set phase(v) { L.phase = v; }, _L: L, get _RB() { return RB; } };
}
