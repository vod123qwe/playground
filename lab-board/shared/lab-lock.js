// Lab lock · a work-in-progress piece behind a password. A soft lock: it lives in the browser only, so it keeps the casual visitor
// out and says "not ready yet", but anyone who reads the code can get in. Only a hash of the password is kept here, never the word.
// Put <script src="../../shared/lab-lock.js"></script> first in the piece's <head>. Once opened, this browser remembers it
// (localStorage lab.unlock), for every locked piece. The board's still (?thumb) is let through, for the cover.
(function () {
  const HASH = '6c58bc00fea09c8d7fdb97c7b58741ad37bd7ba8e5c76d35076e3b57071b172b', KEY = 'lab.unlock';
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { }
  if (new URLSearchParams(location.search).has('thumb')) return;
  const root = document.documentElement; root.classList.add('lab-locked');
  const style = document.createElement('style');
  style.textContent = `
html.lab-locked body > *:not(.lab-lock){visibility:hidden !important}
.lab-lock{position:fixed; inset:0; z-index:2147483000; display:grid; place-items:center; padding:16px; color:#1b1c20;
  background:repeating-linear-gradient(135deg, rgba(20,20,20,.04) 0 14px, rgba(20,20,20,0) 14px 28px), #f3f2ee;
  font:500 14px/1.45 -apple-system, BlinkMacSystemFont, "Geist", system-ui, sans-serif; -webkit-font-smoothing:antialiased}
.lab-lock *{box-sizing:border-box}
.lab-lock .card{width:min(100%, 360px); padding:28px 24px 22px; border-radius:26px; background:#fff; border:1px solid rgba(20,20,20,.08); text-align:center}
.lab-lock .ic{width:52px; height:52px; margin:0 auto 14px; border-radius:999px; display:grid; place-items:center; background:#1b1c20; color:#fff}
.lab-lock .ic svg{width:22px; height:22px}
.lab-lock h1{margin:0; font-size:19px; font-weight:600; letter-spacing:-.01em}
.lab-lock p{margin:8px 0 18px; color:rgba(20,20,20,.55); font-size:13.5px}
.lab-lock form{display:flex; gap:8px}
.lab-lock input{flex:1; min-width:0; height:42px; padding:0 16px; border:0; border-radius:999px; background:rgba(20,20,20,.05); font:inherit; color:inherit; outline:none; transition:box-shadow .2s}
.lab-lock input:focus{box-shadow:inset 0 0 0 1.5px rgba(20,20,20,.35)}
.lab-lock button{height:42px; padding:0 18px; border:0; border-radius:999px; background:#1b1c20; color:#fff; font:inherit; font-weight:600; cursor:pointer; transition:scale .3s cubic-bezier(.3,1.35,.45,1)}
.lab-lock button:active{scale:.96}
.lab-lock .err{min-height:18px; margin-top:8px; font-size:12.5px; color:#b8392b}
.lab-lock a{display:inline-block; margin-top:10px; color:rgba(20,20,20,.55); font-size:13px; text-decoration:none} .lab-lock a:hover{color:#1b1c20}
.lab-lock .card.bad{animation:lab-shake .42s cubic-bezier(.36,.07,.19,.97)}
@keyframes lab-shake{10%,90%{translate:-1px 0} 20%,80%{translate:3px 0} 30%,50%,70%{translate:-6px 0} 40%,60%{translate:6px 0}}
@media (prefers-reduced-motion:reduce){ .lab-lock .card.bad{animation:none} }`;
  document.head.appendChild(style);
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const build = () => {
    const box = document.createElement('div'); box.className = 'lab-lock'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'lab-lock-t');
    box.innerHTML = '<div class="card"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'
      + '<h1 id="lab-lock-t">Work in progress</h1><p>This one is still being made. Enter the password to look inside.</p>'
      + '<form><input type="password" autocomplete="current-password" aria-label="Password" placeholder="Password"><button type="submit">Open</button></form><div class="err" role="alert"></div><a href="../../">Back to the lab</a></div>';
    const card = box.querySelector('.card'), inp = box.querySelector('input'), err = box.querySelector('.err');
    box.querySelector('form').addEventListener('submit', async e => { e.preventDefault();
      let ok = false; try { ok = (await sha(inp.value.trim().toLowerCase())) === HASH; } catch (x) { }
      if (ok) { try { localStorage.setItem(KEY, HASH); } catch (x) { } box.remove(); root.classList.remove('lab-locked'); dispatchEvent(new Event('resize')); return; }
      err.textContent = 'Not this one.'; card.classList.remove('bad'); void card.offsetWidth; card.classList.add('bad'); inp.select(); });
    document.body.appendChild(box); inp.focus(); };
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
