// Touch controls, for a phone or a tablet (on when the pointer is coarse, or with ?touch in the address):
// the left thumb: a stick that appears where it touches (side to side steers, up pedals, the harder the further; down brakes, and
// held at a stop walks him back); the right thumb: throw left, throw right (hold: the power builds; let go: it flies), kick, hop,
// and faster (held). At the top: the camera, start again, full screen.
// createTouch({ onCam, onReset }) → { on, state: { stick, steer, pedal, brake, sprint, holdL, holdR }, take() → { kick, hop } (once each) }

export function createTouch({ onCam, onReset }) {
  const on = matchMedia('(pointer: coarse)').matches || /[?&]touch\b/.test(location.search);
  const state = { stick: false, steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, kickHeld: false }, edges = { kick: false, hop: false };
  const take = () => { const e = { ...edges }; edges.kick = edges.hop = false; return e; };
  if (!on) return { on, state, take };
  document.body.classList.add('touch');

  const css = document.createElement('style'); css.textContent = `
    body.touch { touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    body.touch #keys, body.touch #pix, body.touch #ink { display: none; }
    #tc { position: fixed; inset: 0; z-index: 4; pointer-events: none; font: 700 13px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #f6f3ea; letter-spacing: .04em; }
    #tc .zone { position: absolute; left: 0; top: 56px; bottom: 0; width: 46%; pointer-events: auto; }
    #tc .base, #tc .knob { position: absolute; border-radius: 50%; transform: translate(-50%, -50%); display: none; }
    #tc .base { width: 124px; height: 124px; background: rgba(23,24,27,.35); border: 2px solid rgba(246,243,234,.35); }
    #tc .knob { width: 56px; height: 56px; background: rgba(239,201,112,.85); border: 2px solid #17181b; box-shadow: 0 2px 0 #17181b; }
    #tc .hint { position: absolute; left: max(18px, env(safe-area-inset-left)); bottom: calc(max(18px, env(safe-area-inset-bottom)) + 56px); opacity: .55; font-weight: 600; }
    #tc .btn { position: absolute; display: grid; place-items: center; text-align: center; pointer-events: auto; border-radius: 14px; background: rgba(23,24,27,.55);
      border: 2px solid rgba(246,243,234,.4); box-shadow: 0 3px 0 rgba(12,13,15,.8); }
    #tc .btn.down { background: rgba(239,201,112,.9); color: #17181b; border-color: #17181b; transform: translateY(2px); box-shadow: 0 1px 0 rgba(12,13,15,.8); }
    #tc .small { width: 44px; height: 38px; border-radius: 10px; font-size: 16px; }
    #tc .right { right: max(14px, env(safe-area-inset-right)); }
  `; document.head.appendChild(css);

  const root = document.createElement('div'); root.id = 'tc'; document.body.appendChild(root);
  const el = (cls, html, style) => { const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; Object.assign(d.style, style || {}); root.appendChild(d); return d; };

  // the stick
  const zone = el('zone'), base = el('base'), knob = el('knob'), hint = el('hint', 'tu: jazda i skręt');
  let sid = null, ox = 0, oy = 0; const R = 56;
  const setStick = (x, y) => { let dx = x - ox, dy = y - oy; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
    knob.style.left = ox + dx + 'px'; knob.style.top = oy + dy + 'px';
    const sx = dx / R, sy = dy / R, dz = v => Math.abs(v) < .12 ? 0 : (Math.abs(v) - .12) / .88 * Math.sign(v);
    state.steer = dz(sx); state.pedal = Math.max(0, dz(-sy)); state.brake = Math.max(0, dz(sy)); };
  zone.addEventListener('pointerdown', e => { if (sid !== null) return; sid = e.pointerId; try { zone.setPointerCapture(sid); } catch { } ox = e.clientX; oy = e.clientY;
    for (const o of [base, knob]) { o.style.display = 'block'; o.style.left = ox + 'px'; o.style.top = oy + 'px'; } state.stick = true; hint.style.display = 'none'; setStick(ox, oy); e.preventDefault(); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) { setStick(e.clientX, e.clientY); e.preventDefault(); } });
  const stickUp = e => { if (e.pointerId !== sid) return; sid = null; base.style.display = knob.style.display = 'none'; Object.assign(state, { stick: false, steer: 0, pedal: 0, brake: 0 }); };
  zone.addEventListener('pointerup', stickUp); zone.addEventListener('pointercancel', stickUp);

  // the buttons: each held by its own finger
  function button(html, style, down, up, cls = 'btn') {
    const b = el(cls, html, style); let pid = null;
    b.addEventListener('pointerdown', e => { if (pid !== null) return; pid = e.pointerId; try { b.setPointerCapture(pid); } catch { } b.classList.add('down'); down?.(); e.preventDefault(); e.stopPropagation(); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; b.classList.remove('down'); up?.(); };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('contextmenu', e => e.preventDefault());
    return b;
  }
  const B = (w, h, right, bottom) => ({ width: w + 'px', height: h + 'px', right: `calc(max(14px, env(safe-area-inset-right)) + ${right}px)`, bottom: `calc(max(14px, env(safe-area-inset-bottom)) + ${bottom}px)` });
  button('KOP', { ...B(92, 92, 64, 20), borderRadius: '50%', fontSize: '17px' }, () => { edges.kick = true; state.kickHeld = true; }, () => { state.kickHeld = false; });   // (held: a trick in the air goes on)
  button('← RZUT', B(84, 58, 176, 116), () => { state.holdL = true; }, () => { state.holdL = false; });
  button('RZUT →', B(84, 58, 0, 116), () => { state.holdR = true; }, () => { state.holdR = false; });
  button('SKOK', B(68, 50, 176, 26), () => { edges.hop = true; });
  button('SZYB-<br>CIEJ', { ...B(56, 56, 0, 190), fontSize: '11px', lineHeight: '1.15' }, () => { state.sprint = true; }, () => { state.sprint = false; });
  // the top: camera, start again, full screen
  const top = (html, right, fn) => button(html, { right: `calc(max(14px, env(safe-area-inset-right)) + ${right}px)`, top: 'max(12px, env(safe-area-inset-top))' }, fn, null, 'btn small');
  const svg = d => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">${d}</svg>`;
  top(svg('<rect x="2" y="6" width="11" height="9"/><path d="M13 9l5-3v9l-5-3"/>'), 0, onCam).setAttribute('aria-label', 'kamera');
  top(svg('<path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M3 3v4h4"/>'), 52, onReset).setAttribute('aria-label', 'od nowa');
  if (document.fullscreenEnabled) top(svg('<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/>'), 104, () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); }).setAttribute('aria-label', 'pełny ekran');
  addEventListener('blur', () => Object.assign(state, { stick: false, steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false }));
  return { on, state, take };
}
