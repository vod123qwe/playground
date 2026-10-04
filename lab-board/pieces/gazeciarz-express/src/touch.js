// Touch controls, for a phone or a tablet (on when the pointer is coarse, or with ?touch in the address). Icons, not words; round,
// see-through, a thin light ring, lit while held. What is on the right changes with what he is doing:
//   on the bike: throw left, throw right (held: the power builds; let go: it flies), kick, hop, faster (held), get off;
//   on foot: punch left, punch right, guard (held), dodge, hop, get on the bike, talk; in a fight: the same but talk.
// The left thumb: a stick where it touches (on the bike: side to side steers, up pedals, down brakes; on foot: up and down walk, side
// to side turns him). A finger dragged on the free right side looks about (on foot: turns him). At the top, small, in the middle: the
// camera, the menu, full screen. Nothing a swipe could do to the page (scroll, pull to refresh, pinch, double tap, a long press) is let
// through: the game keeps the fingers.
// createTouch({ onCam, onMenu }) → { on, state, take() → edges once each, setMode(mode), show(bool) }
export function createTouch({ onCam, onMenu, onBook }) {
  const on = matchMedia('(pointer: coarse)').matches || /[?&]touch\b/.test(location.search);
  const state = { stick: false, steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, kickHeld: false, guard: false, lookDx: 0, lookDy: 0 };
  const edges = { kick: false, hop: false, punchL: false, punchR: false, dodge: false, mount: false, talk: false, title: false };
  const take = () => { const e = { ...edges }; for (const k in edges) edges[k] = false; e.lookDx = state.lookDx; e.lookDy = state.lookDy; state.lookDx = state.lookDy = 0; return e; };
  if (!on) return { on, state, take, setMode() { }, show() { }, trick() { }, chat() { }, charge() { }, titles() { }, course() { } };
  document.body.classList.add('touch');

  // the page keeps still under the fingers: no scroll, no pull to refresh, no pinch, no double-tap zoom, no long-press menu
  const keep = e => { if (e.target.closest?.('#styl .body')) return; e.preventDefault(); };
  document.addEventListener('touchmove', keep, { passive: false });
  document.addEventListener('touchstart', e => { if (e.touches.length > 1 && !e.target.closest?.('#styl')) e.preventDefault(); }, { passive: false });
  for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });

  const css = document.createElement('style'); css.textContent = `
    html, body { overscroll-behavior: none; }
    body.touch, body.touch canvas { touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    body.touch #keys, body.touch #pix, body.touch #ink { display: none; }
    #tc { position: fixed; inset: 0; z-index: 4; pointer-events: none; color: #f6f3ea; font: 10px/1 PTPix, ui-monospace, monospace; letter-spacing: .04em; }
    #tc.hide { display: none; }
    #tc .zone { position: absolute; left: 0; top: 64px; bottom: 0; width: 44%; pointer-events: auto; }
    #tc .look { position: absolute; right: 0; top: 64px; bottom: 0; width: 56%; pointer-events: auto; }
    #tc .base, #tc .knob { position: absolute; border-radius: 50%; transform: translate(-50%, -50%); display: none; pointer-events: none; }
    /* (the game's look: chunky pixel boxes with cut corners, a dark edge and a light rim, a hard shadow; the game's pixel font) */
    #tc .base { width: 116px; height: 116px; border-radius: 22px; background: rgba(23,24,27,.35); border: 3px solid rgba(23,24,27,.8); box-shadow: inset 0 0 0 2px rgba(246,243,234,.35); }
    #tc .knob { width: 52px; height: 52px; border-radius: 12px; background: #efc970; border: 3px solid #17181b; box-shadow: inset 0 -4px 0 #b8902e; }
    #tc .ghost { position: absolute; left: calc(max(18px, env(safe-area-inset-left)) + 58px); bottom: calc(max(20px, env(safe-area-inset-bottom)) + 70px); width: 116px; height: 116px; transform: translate(-50%, 50%);
      border-radius: 22px; border: 3px dashed rgba(246,243,234,.35); pointer-events: none; display: grid; place-items: center; text-align: center; line-height: 1.5; color: rgba(246,243,234,.75); text-shadow: 1px 1px 0 #17181b; }
    #tc .ghost.gone { display: none; }
    #tc .hint { display: none; }
    #tc .btn { position: absolute; display: grid; place-items: center; pointer-events: auto; background: rgba(23,24,27,.78); border: 3px solid #17181b; color: #f6f3ea;
      clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
      box-shadow: inset 0 0 0 2px rgba(246,243,234,.55), inset 0 -5px 0 rgba(0,0,0,.35); transition: transform .05s; overflow: hidden; }
    #tc .btn::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--fill, 0) * 100%); background: rgba(239,201,112,.75); pointer-events: none; }
    #tc .btn svg { position: relative; width: 46%; height: 46%; margin-top: -10%; shape-rendering: crispEdges; }
    #tc .btn i { position: absolute; bottom: 7px; left: 0; right: 0; text-align: center; font-style: normal; white-space: nowrap; text-shadow: 1px 1px 0 #17181b; }
    #tc .btn.big { background: rgba(207,90,62,.88); } #tc .btn.big.hopb { background: rgba(59,111,160,.88); }
    #tc .btn.down { background: #efc970; color: #17181b; transform: translate(2px, 2px); } #tc .btn.down i { text-shadow: none; }
    #tc .btn.off { display: none; }
    #tc .top { position: absolute; top: max(10px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); display: flex; gap: 8px; pointer-events: none; }
    #tc .btn.hid { display: none; }
    #tc .btn.trick { background: #efc970; color: #17181b; animation: tcBlink .3s steps(2) infinite; } #tc .btn.trick i { text-shadow: none; }
    @keyframes tcBlink { 50% { background: #f6f3ea; } }
    #tc .top .btn { position: relative; width: 38px; height: 38px; } #tc .top .btn svg { margin-top: 0; width: 55%; height: 55%; }
    @media (max-width: 639px) { #tc .top { left: max(14px, env(safe-area-inset-left)); top: calc(max(10px, env(safe-area-inset-top)) + 76px); transform: none; gap: 6px; } #tc .top .btn { width: 34px; height: 34px; border-radius: 10px; } }   /* (narrow: a row under the bike computer) */
  `; document.head.appendChild(css);

  const root = document.createElement('div'); root.id = 'tc'; document.body.appendChild(root);
  const el = (cls, html, parent = root) => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; parent.appendChild(d); return d; };
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${d}</svg>`;
  const IC = {
    throwL: svg('<rect x="9" y="8" width="10" height="7" rx="3.5"/><path d="M13 8v7"/><path d="M6 11.5H2m0 0 2.5-2.5M2 11.5 4.5 14"/>'),
    throwR: svg('<rect x="5" y="8" width="10" height="7" rx="3.5"/><path d="M11 8v7"/><path d="M18 11.5h4m0 0-2.5-2.5m2.5 2.5L19.5 14"/>'),
    kick: svg('<path d="M7 3v8l-3 5v2h9l5-3 3-1v-3l-6 1-3-2V3z"/>'),
    hop: svg('<path d="M6 15l6-6 6 6"/><path d="M6 20h12"/>'),
    fast: svg('<path d="M4 7l6 5-6 5M12 7l6 5-6 5"/>'),
    off: svg('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h5l3 7M10 10 8 6h3"/><path d="M15 3v4" /><path d="M13 5h4"/>'),
    punchL: svg('<rect x="7" y="7" width="11" height="9" rx="2.5"/><path d="M11 7v3M14 7v3M7 12h3"/><path d="M4 11.5H1"/>'),
    punchR: svg('<rect x="6" y="7" width="11" height="9" rx="2.5"/><path d="M10 7v3M13 7v3M17 12h-3"/><path d="M20 11.5h3"/>'),
    guard: svg('<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>'),
    dodge: svg('<path d="M14 5l-5 7 5 7"/><path d="M20 5l-5 7 5 7" opacity=".5"/>'),
    bike: svg('<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9 8.5 6H11M14 9l1.5-3h2"/>'),
    talk: svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>'),
    cam: svg('<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'), book: svg('<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M9 8h6M9 12h6"/>'),
    full: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>') };

  // the stick: where the left thumb first touches
  const zone = el('zone'), look = el('look'), ghost = el('ghost', 'KCIUK<br>TUTAJ'), base = el('base'), knob = el('knob'), hint = el('hint', 'kciuk tutaj: jazda');
  let sid = null, ox = 0, oy = 0; const R = 52;
  const setStick = (x, y) => { let dx = x - ox, dy = y - oy; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
    knob.style.left = ox + dx + 'px'; knob.style.top = oy + dy + 'px';
    const sx = dx / R, sy = dy / R, dz = v => Math.abs(v) < .12 ? 0 : (Math.abs(v) - .12) / .88 * Math.sign(v);
    state.steer = dz(sx); state.pedal = Math.max(0, dz(-sy)); state.brake = Math.max(0, dz(sy)); };
  zone.addEventListener('pointerdown', e => { if (sid !== null) return; sid = e.pointerId; try { zone.setPointerCapture(sid); } catch { } ox = e.clientX; oy = e.clientY;
    for (const o of [base, knob]) { o.style.display = 'block'; o.style.left = ox + 'px'; o.style.top = oy + 'px'; } state.stick = true; hint.style.display = 'none'; ghost.classList.add('gone'); setStick(ox, oy); e.preventDefault(); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) { setStick(e.clientX, e.clientY); e.preventDefault(); } });
  const stickUp = e => { if (e.pointerId !== sid) return; freeStick(); };
  const freeStick = () => { sid = null; base.style.display = knob.style.display = 'none'; ghost.classList.remove('gone'); Object.assign(state, { stick: false, steer: 0, pedal: 0, brake: 0 }); };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(ev, stickUp);
  // looking about: a finger dragged over the free right side
  let lid = null, lx = 0, ly = 0;
  look.addEventListener('pointerdown', e => { if (lid !== null) return; lid = e.pointerId; try { look.setPointerCapture(lid); } catch { } lx = e.clientX; ly = e.clientY; e.preventDefault(); });
  look.addEventListener('pointermove', e => { if (e.pointerId !== lid) return; state.lookDx += e.clientX - lx; state.lookDy += e.clientY - ly; lx = e.clientX; ly = e.clientY; e.preventDefault(); });
  const lookUp = e => { if (e.pointerId === lid) lid = null; }; for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) look.addEventListener(ev, lookUp);

  // the buttons: each held by its own finger; placed from the bottom right corner (size, right, bottom), shown for the modes they belong to
  const all = [];
  function button(icon, label, pos, modes, down, up, parent = root) {
    const b = el('btn', icon + (label ? `<i>${label}</i>` : ''), parent); let pid = null; b.setAttribute('role', 'button'); b.setAttribute('aria-label', label || '');
    if (pos) Object.assign(b.style, { width: pos[0] + 'px', height: pos[0] + 'px', right: `calc(max(12px, env(safe-area-inset-right)) + ${pos[1]}px)`, bottom: `calc(max(16px, env(safe-area-inset-bottom)) + ${pos[2]}px)` });
    b.addEventListener('pointerdown', e => { if (pid !== null) return; pid = e.pointerId; try { b.setPointerCapture(pid); } catch { } b.classList.add('down'); down?.(); e.preventDefault(); e.stopPropagation(); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; b.classList.remove('down'); up?.(e.type === 'pointerup'); };   // (up(true): let go on it)
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, end);
    all.push({ b, modes, free: () => { if (pid === null) return; pid = null; b.classList.remove('down'); up?.(false); } }); return b; }
  const BIKE = ['bike'], FOOT = ['foot', 'fight'];
  // on the bike: throws either side of the big kick, hop and faster above, off at the top of the column
  const kickB = button(IC.kick, 'kop', [78, 58, 14], BIKE, () => { edges.kick = true; state.kickHeld = true; }, () => { state.kickHeld = false; });
  button(IC.throwL, 'rzut', [62, 150, 30], BIKE, () => { state.holdL = true; }, () => { state.holdL = false; });
  button(IC.throwR, 'rzut', [62, 0, 104], BIKE, () => { state.holdR = true; }, () => { state.holdR = false; });
  button(IC.hop, 'skok', [52, 118, 108], BIKE, () => { edges.hop = true; });
  button(IC.fast, 'szybciej', [52, 4, 190], BIKE, () => { state.sprint = true; }, () => { state.sprint = false; });
  button(IC.off, 'zsiądź', [44, 76, 190], BIKE, () => { edges.mount = true; });
  const chatB = button(IC.talk, 'gadaj', [50, 190, 118], BIKE, () => { edges.talk = true; }); chatB.classList.add('hid');   // (only by someone to talk to)
  button(svg('<rect x="5" y="6" width="14" height="12" rx="1"/><path d="M5 10h14M8 14h8"/>'), 'tytuł', [42, 10, 256], BIKE, () => { edges.title = true; });   // (which paper is thrown: the next title)
  // the Classic: one throw (always to the houses), the hop big by it (in the air: the trick), the kick, faster, the title; no getting off
  // (Express: under the right thumb the two big ones (RZUT to the houses, SKOK), above them KOP and a small RZUT for the course's
  // targets on the right, SPRINT by the hop, TYTUŁ only where two papers go round)
  const CL = ['classic'];
  const throwC = button(IC.throwL, 'RZUT', [92, 4, 16], CL, () => { state.holdL = true; }, () => { state.holdL = false; }); throwC.classList.add('big');
  const hopC = button(IC.hop, 'SKOK', [84, 106, 10], CL, () => { edges.hop = true; }); hopC.classList.add('big', 'hopb');
  const kickC = button(IC.kick, 'KOP', [62, 14, 122], CL, () => { edges.kick = true; state.kickHeld = true; }, () => { state.kickHeld = false; });
  const throwRC = button(IC.throwR, 'RZUT', [54, 92, 112], CL, () => { state.holdR = true; }, () => { state.holdR = false; });
  button(IC.fast, 'SPRINT', [50, 200, 24], CL, () => { state.sprint = true; }, () => { state.sprint = false; });
  const titleC = button(svg('<rect x="5" y="6" width="14" height="12"/><path d="M5 10h14M8 14h8"/>'), 'TYTUŁ', [50, 18, 202], CL, () => { edges.title = true; }); titleC.classList.add('hid');
  // on foot: one punch (left and right by turns), hop, talk, back on the bike (a run: the stick pushed all the way)
  let fist = 0;
  button(IC.punchR, 'cios', [78, 58, 14], ['foot'], () => { edges[(fist ^= 1) ? 'punchL' : 'punchR'] = true; });
  button(IC.hop, 'skok', [58, 150, 30], ['foot'], () => { edges.hop = true; });
  button(IC.talk, 'gadaj', [56, 0, 104], ['foot'], () => { edges.talk = true; });
  button(IC.bike, 'rower', [48, 112, 116], ['foot'], () => { edges.mount = true; });
  // in a fight: the two fists, guard between them, dodge (the stick: which way)
  button(IC.punchR, 'prawy', [70, 0, 70], ['fight'], () => { edges.punchR = true; });
  button(IC.punchL, 'lewy', [70, 136, 14], ['fight'], () => { edges.punchL = true; });
  button(IC.guard, 'blok', [58, 74, 96], ['fight'], () => { state.guard = true; }, () => { state.guard = false; });
  button(IC.dodge, 'unik', [52, 0, 0], ['fight'], () => { edges.dodge = true; });
  // at the top, small, in the middle
  const top = el('top');
  for (const [ic, fn, name, md] of [[IC.cam, onCam, 'kamera', ['bike', 'foot', 'fight']], [IC.menu, onMenu, 'menu'], ...(onBook ? [[IC.book, onBook, 'notes', ['bike', 'foot', 'fight']]] : []), ...(document.fullscreenEnabled ? [[IC.full, () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => { })).catch(() => { }); }, 'pełny ekran']] : [])])
    button(ic, '', null, md || ['bike', 'foot', 'fight', 'classic'], null, ok => { if (ok) fn(); }, top).setAttribute('aria-label', name);   // (the Classic: one camera, no camera button)   // (on letting go: the finger is off before the menu is there)
  let mode = null;
  function setMode(m) { if (m === mode) return; mode = m; for (const o of all) o.b.classList.toggle('off', !o.modes.includes(m)); ghost.innerHTML = m === 'classic' ? '← KIERUJ →<br>↑ GAZ ↓ HAMUJ' : 'KCIUK<br>TUTAJ'; hint.innerHTML = m === 'classic' ? 'kciuk: skręt<br>góra gaz, dół hamulec' : m === 'bike' ? 'kciuk tutaj: jazda' : m === 'foot' ? 'kciuk tutaj: chodzenie<br>prawa strona: kamera' : 'kciuk tutaj: krok i unik'; }
  // hidden (a menu, a talk): every finger let go, so nothing stays held (a button pressed as it hid got no let-go and would not take another)
  let shown = true;
  function show(v) { root.classList.toggle('hide', !v); if (!v && shown) { for (const o of all) o.free(); freeStick(); lid = null; } shown = v; if (!v) Object.assign(state, { stick: false, steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, guard: false, kickHeld: false }); }
  setMode('bike');
  addEventListener('blur', () => Object.assign(state, { stick: false, steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, guard: false }));
  // in the air off a ramp: the kick button is the trick button (lit, and says so)
  let trickOn = false; const kickI = kickB.querySelector('i'), hopI = hopC.querySelector('i');
  let trickLab = ''; function trick(v, lab = 'TRIK!') { if (v === trickOn && lab === trickLab) return; trickOn = v; trickLab = lab; kickB.classList.toggle('trick', v); kickI.textContent = v ? lab : 'kop'; hopC.classList.toggle('trick', v); hopI.textContent = v ? lab : 'SKOK'; }
  // (the throw's power as it builds: the button fills from the bottom; the title button only where two papers go round)
  let fillNow = -1; function charge(p) { const v = Math.round((p || 0) * 20) / 20; if (v === fillNow) return; fillNow = v; for (const b of [throwC, throwRC]) b.style.setProperty('--fill', v); }
  let titlesOn = false; function titles(v) { if (v !== titlesOn) { titlesOn = v; titleC.classList.toggle('hid', !v); } }
  // (the small RZUT to the right: only on the obstacle course, where targets stand on the right too)
  let courseOn = false; throwRC.classList.add('hid'); function course(v) { if (v !== courseOn) { courseOn = v; throwRC.classList.toggle('hid', !v); } }
  let chatOn = false; function chat(v) { if (v !== chatOn) { chatOn = v; chatB.classList.toggle('hid', !v); } }
  return { on, state, take, setMode, show, trick, chat, charge, titles, course };
}
