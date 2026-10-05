// Lab lock · the lab, and a work-in-progress piece, behind a password. A soft lock: it lives in the browser only, so it keeps the
// casual visitor out and says "not ready yet", but anyone who reads the code can get in. Only a hash of the password is kept here,
// never the word. Put <script src="…/shared/lab-lock.js"></script> first in the <head> (data-back="0" when there is nowhere to go back
// to, as on the board itself). Once opened, this browser remembers it (localStorage lab.unlock), for the board and every locked piece.
// The board's still (?thumb) is let through, for the covers. The lock screen has the lab's Goo cursor: a chain of blobs that melt into
// one another and trail the pointer, inverting what they cover (the settings Jarek tuned in Cursors).
(function () {
  const HASH = '6c58bc00fea09c8d7fdb97c7b58741ad37bd7ba8e5c76d35076e3b57071b172b', KEY = 'lab.unlock';
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { }
  if (new URLSearchParams(location.search).has('thumb')) return;
  const me = document.currentScript, back = !me || me.dataset.back !== '0';
  const root = document.documentElement; root.classList.add('lab-locked');
  const style = document.createElement('style');
  style.textContent = `
html.lab-locked body > *:not(.lab-lock){visibility:hidden !important}
html.lab-locked, html.lab-locked body{overflow:hidden}
.lab-lock{position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:16px; color:#1b1c20; cursor:none;
  background:repeating-linear-gradient(135deg, rgba(20,20,20,.04) 0 14px, rgba(20,20,20,0) 14px 28px), #f3f2ee;
  font:500 14px/1.45 -apple-system, BlinkMacSystemFont, "Geist", system-ui, sans-serif; -webkit-font-smoothing:antialiased}
.lab-lock *{box-sizing:border-box}
.lab-lock .ll-card{position:relative; width:min(100%, 360px); padding:28px 24px 22px; border-radius:26px; background:#fff; border:1px solid rgba(20,20,20,.08); text-align:center; cursor:default}
.lab-lock .ll-ic{width:52px; height:52px; margin:0 auto 14px; border-radius:999px; display:grid; place-items:center; background:#1b1c20; color:#fff}
.lab-lock .ll-ic svg{width:22px; height:22px}
.lab-lock h1{margin:0; font-size:19px; font-weight:600; letter-spacing:-.01em}
.lab-lock p{margin:8px 0 18px; color:rgba(20,20,20,.55); font-size:13.5px}
.lab-lock form{display:flex; gap:8px}
.lab-lock input{flex:1; min-width:0; height:42px; padding:0 16px; border:0; border-radius:999px; background:rgba(20,20,20,.05); font:inherit; color:inherit; outline:none; cursor:text; transition:box-shadow .2s}
.lab-lock input:focus{box-shadow:inset 0 0 0 1.5px rgba(20,20,20,.35)}
.lab-lock button{height:42px; padding:0 18px; border:0; border-radius:999px; background:#1b1c20; color:#fff; font:inherit; font-weight:600; cursor:pointer; transition:scale .3s cubic-bezier(.3,1.35,.45,1)}
.lab-lock button:active{scale:.96}
.lab-lock .ll-err{min-height:18px; margin-top:8px; font-size:12.5px; color:#b8392b}
.lab-lock a{display:inline-block; margin-top:10px; color:rgba(20,20,20,.55); font-size:13px; text-decoration:none; cursor:pointer} .lab-lock a:hover{color:#1b1c20}
.lab-lock .ll-card.bad{animation:lab-shake .42s cubic-bezier(.36,.07,.19,.97)}
.lab-lock .ll-goo{position:fixed; inset:0; pointer-events:none; filter:url(#lab-lock-goo); mix-blend-mode:difference; z-index:2}
.lab-lock .ll-goo i{position:absolute; left:0; top:0; border-radius:50%; background:#fff; will-change:transform}
@keyframes lab-shake{10%,90%{translate:-1px 0} 20%,80%{translate:3px 0} 30%,50%,70%{translate:-6px 0} 40%,60%{translate:6px 0}}
@media (hover:none){ .lab-lock{cursor:auto} .lab-lock .ll-goo{display:none} }
@media (prefers-reduced-motion:reduce){ .lab-lock .ll-card.bad{animation:none} .lab-lock{cursor:auto} .lab-lock .ll-goo{display:none} }`;
  document.head.appendChild(style);
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  // ---------- the Goo cursor: blobs, each following the one before, melted by a blur and a hard alpha ----------
  const GO = { n: 16, size: 46, follow: .33, goo: 14 };
  function goo(box) { if (matchMedia('(hover:none), (prefers-reduced-motion:reduce)').matches) return () => { };
    box.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="lab-lock-goo" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="${GO.goo}" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/></filter></svg>`);
    const layer = document.createElement('div'); layer.className = 'll-goo'; layer.setAttribute('aria-hidden', 'true'); box.appendChild(layer);
    const M = { x: innerWidth / 2, y: innerHeight / 2, in: false, down: false }, B = [];
    for (let i = 0; i < GO.n; i++) { const el = document.createElement('i'), s = GO.size * (1 - i / GO.n * .7); el.style.width = el.style.height = s + 'px'; el.style.marginLeft = el.style.marginTop = -s / 2 + 'px'; layer.appendChild(el);
      B.push({ el, x: { p: M.x, v: 0 }, y: { p: M.y, v: 0 }, s: { p: 0, v: 0 } }); }
    const spring = (s, to, k, d = .58) => { s.v = (s.v + (to - s.p) * k) * d; s.p += s.v; return Math.abs(to - s.p) > .05 || Math.abs(s.v) > .05; };
    let raf = 0, alive = true; const wake = () => { if (!raf && alive) raf = requestAnimationFrame(tick); };
    function tick() { raf = 0; let moving = false, tx = M.x, ty = M.y;
      for (const b of B) { if (spring(b.x, tx, GO.follow)) moving = true; if (spring(b.y, ty, GO.follow)) moving = true; if (spring(b.s, M.in ? (M.down ? 1.3 : 1) : 0, .2, .6)) moving = true;
        b.el.style.transform = `translate(${b.x.p}px, ${b.y.p}px) scale(${Math.max(0, b.s.p)})`; tx = b.x.p; ty = b.y.p; }
      if (moving) wake(); }
    const mv = e => { M.x = e.clientX; M.y = e.clientY; M.in = true; wake(); }, out = () => { M.in = false; wake(); }, dn = () => { M.down = true; wake(); }, up = () => { M.down = false; wake(); };
    addEventListener('pointermove', mv); document.addEventListener('pointerleave', out); addEventListener('pointerdown', dn); addEventListener('pointerup', up);
    return () => { alive = false; removeEventListener('pointermove', mv); document.removeEventListener('pointerleave', out); removeEventListener('pointerdown', dn); removeEventListener('pointerup', up); }; }
  const build = () => {
    const box = document.createElement('div'); box.className = 'lab-lock'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'lab-lock-t');
    box.innerHTML = '<div class="ll-card"><div class="ll-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'
      + (back ? '<h1 id="lab-lock-t">Work in progress</h1><p>This one is still being made. Enter the password to look inside.</p>' : '<h1 id="lab-lock-t">The lab</h1><p>Experiments in progress. Enter the password to come in.</p>')
      + '<form><input type="password" autocomplete="current-password" aria-label="Password" placeholder="Password"><button type="submit">Open</button></form><div class="ll-err" role="alert"></div>'
      + (back ? '<a href="../../">Back to the lab</a>' : '') + '</div>';
    const card = box.querySelector('.ll-card'), inp = box.querySelector('input'), err = box.querySelector('.ll-err');
    document.body.appendChild(box); const stopGoo = goo(box);
    box.querySelector('form').addEventListener('submit', async e => { e.preventDefault();
      let ok = false; try { ok = (await sha(inp.value.trim().toLowerCase())) === HASH; } catch (x) { }
      if (ok) { try { localStorage.setItem(KEY, HASH); } catch (x) { } stopGoo(); box.remove(); root.classList.remove('lab-locked'); dispatchEvent(new Event('resize')); return; }
      err.textContent = 'Not this one.'; card.classList.remove('bad'); void card.offsetWidth; card.classList.add('bad'); inp.select(); });
    inp.focus(); };
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
