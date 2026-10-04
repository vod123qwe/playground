// The week's end, with a bang: over the street at dusk the special edition spins into the screen (the printing press's thud, the screen
// shakes); the week's album drops in day by day (a polaroid each: the photo from that finish, the street, its medal, its points) while the
// week's score counts up; the readers' mood fills; the week's title is stamped across the page and fireworks go up over the houses.
// Then KONIEC, and back to the title. It runs by itself; a key, a click or the pad's A skips to the next beat.
// finaleShow({ days: [{ day, name, pts, delivered, of, medal: { name, col }, img }], title: [min, head, lead, pay], sat, score, pay, sound(name, o), onDone })
const PAL = ['#efc970', '#cf3a2c', '#8fc3f0', '#7fd18a', '#f6f3ea', '#e889c8'];
let cssDone = false;
function css() { if (cssDone) return; cssDone = true; const s = document.createElement('style'); s.textContent = `
  #finale { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; overflow: hidden; font: 16px/1.25 PTPix, ui-monospace, monospace; color: #2b2723; cursor: pointer; }
  #finale * { box-sizing: border-box; image-rendering: pixelated; }
  #finale .sky { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(40,24,70,.82), rgba(120,60,90,.66) 55%, rgba(230,130,70,.5)); opacity: 0; transition: opacity .7s; }
  #finale.on .sky { opacity: 1; }
  #finale canvas.fw { position: absolute; inset: 0; z-index: 4; width: 100%; height: 100%; pointer-events: none; }
  #finale .stage { position: relative; width: min(760px, 94vw); max-height: 94vh; }
  #finale .sheet { position: relative; background: #ece3cc; border: 4px solid #17181b; box-shadow: 10px 12px 0 rgba(0,0,0,.45); padding: 16px 20px 14px; transform: scale(.02) rotate(-1440deg); opacity: 0; }
  #finale .sheet.in { animation: fz-spin 1.5s cubic-bezier(.16,.78,.25,1) forwards; }
  @keyframes fz-spin { 0% { transform: scale(.02) rotate(-1440deg); opacity: 1; } 100% { transform: scale(1) rotate(-1.5deg); opacity: 1; } }
  #finale.shake .stage { animation: fz-shake .42s steps(7); }
  @keyframes fz-shake { 0% { transform: translate(0,0); } 20% { transform: translate(-9px,5px); } 40% { transform: translate(8px,-6px); } 60% { transform: translate(-6px,-3px); } 80% { transform: translate(4px,4px); } 100% { transform: translate(0,0); } }
  #finale .mast { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; }
  #finale .mast i { width: 40px; height: 45px; background: #b8483a; border: 4px solid #2b2723; clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%); }
  #finale .mast b { font-weight: normal; font-size: 44px; line-height: 1.1; letter-spacing: 4px; text-shadow: 5px 0 0 #2b2723; white-space: nowrap; overflow: hidden; }
  #finale .band { margin: 8px 0 10px; background: #cf3a2c; color: #f3cf6a; text-align: center; padding: 6px 4px 4px; letter-spacing: 3px; text-shadow: 2px 2px 0 #17181b; border-top: 4px solid #2b2723; border-bottom: 4px solid #2b2723; }
  #finale h1 { margin: 0; font-weight: normal; font-size: 36px; line-height: 1.05; letter-spacing: 3px; text-shadow: 4px 0 0 #2b2723; text-align: center; }
  #finale .lead { text-align: center; color: #6a645c; margin: 4px 0 10px; }
  #finale .album { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 4px 2px 12px; }
  #finale .pol { min-width: 0; background: #f6f3ea; border: 3px solid #17181b; padding: 5px 5px 6px; box-shadow: 4px 4px 0 rgba(0,0,0,.3); opacity: 0; transform: translateY(-60px) rotate(var(--r)) scale(1.3); }
  #finale .pol.in { animation: fz-drop .38s steps(6) forwards; }
  @keyframes fz-drop { to { opacity: 1; transform: translateY(0) rotate(var(--r)) scale(1); } }
  #finale .pol .ph { width: 100%; aspect-ratio: 4 / 3; background: #9a968c center / cover no-repeat; border: 2px solid #2b2723; filter: sepia(.25) contrast(1.05); position: relative; }
  #finale .pol .ph.none { background: repeating-linear-gradient(45deg, #b9b09a 0 6px, #a9a08a 6px 12px); }
  #finale .pol .md { position: absolute; right: -6px; bottom: -8px; width: 22px; height: 22px; border-radius: 50%; background: var(--mc); border: 3px solid #17181b; }
  #finale .pol p { margin: 6px 0 0; font-size: 12px; line-height: 1.15; } #finale .pol p.d { color: #b8483a; } #finale .pol p.n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #finale .pol p.p { font-size: 16px; }
  #finale .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: end; border-top: 4px double #2b2723; padding-top: 8px; }
  #finale .score small, #finale .mood small { display: block; color: #6a645c; font-size: 12px; letter-spacing: 1px; }
  #finale .score b { font-weight: normal; font-size: 40px; line-height: 1; letter-spacing: 2px; text-shadow: 4px 0 0 #2b2723; }
  #finale .bar { height: 18px; border: 3px solid #17181b; background: #cfc4a6; margin-top: 4px; } #finale .bar i { display: block; height: 100%; width: 0; background: #4f9a3e; transition: width .9s steps(12); }
  #finale .slot { position: relative; height: 96px; margin: 0 0 4px; }
  #finale .stamp { position: absolute; left: 50%; top: 50%; z-index: 3; padding: 10px 18px 6px; color: #b8302a; border: 6px solid #b8302a; font-size: 32px; line-height: 1.05; letter-spacing: 3px; text-align: center; white-space: nowrap;
    background: rgba(236,227,204,.8); box-shadow: inset 0 0 0 3px rgba(236,227,204,.6), 0 0 0 3px rgba(236,227,204,.5); opacity: 0; transform: translate(-50%, -50%) rotate(-4deg) scale(3); pointer-events: none; mix-blend-mode: multiply; }
  #finale .stamp small { display: block; font-size: 14px; letter-spacing: 2px; margin-top: 4px; }
  #finale .stamp.in { animation: fz-stamp .3s cubic-bezier(.6,0,.9,.5) forwards; }
  @keyframes fz-stamp { to { opacity: 1; transform: translate(-50%, -50%) rotate(-4deg) scale(1); } }
  #finale .end { display: flex; flex-wrap: wrap; gap: 10px 16px; justify-content: space-between; align-items: center; margin-top: 12px; opacity: 0; transition: opacity .4s; }
  #finale .end.in { opacity: 1; } #finale .end p { margin: 0; } #finale .end em { font-style: normal; color: #3f8a4a; }
  #finale button { font: 16px PTPix, monospace; background: #efc970; color: #17181b; border: 3px solid #17181b; padding: 9px 16px 7px; box-shadow: 4px 4px 0 #17181b; cursor: pointer; letter-spacing: 1px; }
  #finale button:hover, #finale button.padf { background: #f6f3ea; }
  #finale .skip { position: absolute; right: 16px; bottom: 12px; color: rgba(246,243,234,.7); font-size: 12px; text-shadow: 1px 1px 0 #17181b; }
  #finale .black { position: absolute; inset: 0; z-index: 5; background: #0c0d0f; display: grid; place-items: center; opacity: 0; pointer-events: none; transition: opacity .6s; }
  #finale .black.in { opacity: 1; pointer-events: auto; }
  #finale .black div { text-align: center; color: #f6f3ea; transform: scale(.6); opacity: 0; transition: transform .5s steps(5), opacity .5s steps(5); }
  #finale .black.in div { transform: scale(1); opacity: 1; transition-delay: .5s; }
  #finale .black b { display: block; font-weight: normal; font-size: 88px; line-height: 1; letter-spacing: 8px; color: #efc970; text-shadow: 8px 8px 0 #cf3a2c, 0 0 0 #17181b; }
  #finale .black span { display: block; margin-top: 18px; letter-spacing: 3px; }
  #finale.ff *, #finale.ff *::before { animation-duration: .01s !important; transition-duration: .01s !important; transition-delay: 0s !important; }
  @media (max-width: 640px) { #finale .sheet { padding: 10px 10px 10px; } #finale .mast b { font-size: 24px; letter-spacing: 2px; text-shadow: 3px 0 0 #2b2723; } #finale .mast i { width: 26px; height: 30px; border-width: 3px; }
    #finale h1 { font-size: 22px; text-shadow: 2px 0 0 #2b2723; } #finale .band { font-size: 12px; letter-spacing: 1px; } #finale .album { gap: 5px; } #finale .pol { padding: 3px; border-width: 2px; } #finale .pol p { font-size: 9px; } #finale .pol p.p { font-size: 11px; }
    #finale .pol .md { width: 14px; height: 14px; border-width: 2px; } #finale .score b { font-size: 26px; text-shadow: 2px 0 0 #2b2723; } #finale .slot { height: 64px; } #finale .stamp { font-size: 15px; letter-spacing: 1px; max-width: 94%; white-space: normal; border-width: 4px; padding: 6px 10px 4px; } #finale .stamp small { font-size: 10px; }
    #finale .black b { font-size: 48px; letter-spacing: 4px; text-shadow: 4px 4px 0 #cf3a2c; } }
`; document.head.appendChild(s); }

// fireworks over the houses: a rocket climbs, bursts into a ring of pixels that fall and fade (drawn at a quarter of the screen, blown up)
function fireworks(cv, sound) { const g = cv.getContext('2d'), P = []; let W = 0, H = 0, next = 0, live = true, last = performance.now();
  const size = () => { W = cv.width = Math.max(80, innerWidth / 3 | 0); H = cv.height = Math.max(60, innerHeight / 3 | 0); }; size(); addEventListener('resize', size);
  // (by the page's sides, where the sky shows; now and then one over it)
  const launch = () => { const r = Math.random(), x = W * (r < .42 ? .03 + Math.random() * .2 : r < .84 ? .77 + Math.random() * .2 : .25 + Math.random() * .5); P.push({ x, y: H, vx: (Math.random() - .5) * 8, vy: -(H * .9 + Math.random() * H * .5), rocket: true, ty: H * (.08 + Math.random() * .32), c: PAL[Math.random() * PAL.length | 0], life: 9 }); };
  const burst = q => { const n = 34 + (Math.random() * 20 | 0), sp = 22 + Math.random() * 26, c2 = Math.random() < .4 ? PAL[Math.random() * PAL.length | 0] : q.c;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, s = sp * (.7 + Math.random() * .5); P.push({ x: q.x, y: q.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: k % 3 ? q.c : c2, life: 1.1 + Math.random() * .7 }); }
    sound?.('chime', { vol: .35 }); };
  (function step(now) { if (!live) return; const dt = Math.min(.05, (now - last) / 1000); last = now; g.clearRect(0, 0, W, H);
    if ((next -= dt) <= 0) { launch(); if (Math.random() < .35) launch(); next = .35 + Math.random() * .6; }
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.rocket) { q.vy += H * .6 * dt; g.fillStyle = '#f6f3ea'; g.fillRect(q.x | 0, q.y | 0, 1, 2); if (q.y <= q.ty || q.vy >= 0) { burst(q); P.splice(i, 1); } continue; }
      q.vy += 26 * dt; q.vx *= .985; q.life -= dt; if (q.life <= 0) { P.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, q.life * 1.4); g.fillStyle = q.life < .35 && (now / 60 | 0) % 2 ? '#f6f3ea' : q.c; g.fillRect(q.x | 0, q.y | 0, 1, 1); g.globalAlpha = 1; }
    requestAnimationFrame(step); })(last);
  return () => { live = false; removeEventListener('resize', size); }; }

export function finaleShow({ days, title, sat, score, pay, sound, onDone }) { css();
  const el = document.createElement('div'); el.id = 'finale';
  el.innerHTML = `<div class="sky"></div><canvas class="fw"></canvas><div class="stage"><div class="sheet">
      <div class="mast"><i></i><b>WIEŚCI ZZA PŁOTU</b></div><div class="band">WYDANIE SPECJALNE · TYDZIEŃ GAZECIARZA</div>
      <h1>TYDZIEŃ ZA NAMI!</h1><p class="lead">Pięć ulic, pięć poranków. Oto jak było.</p>
      <div class="album">${days.map((d, k) => `<div class="pol" style="--r:${[-3, 2, -2, 3, -1][k % 5]}deg"><div class="ph${d.img ? '' : ' none'}" style="${d.img ? `background-image:url(${d.img})` : ''}">${d.medal ? `<span class="md" style="--mc:${d.medal.col}"></span>` : ''}</div>
        <p class="d">${d.day}</p><p class="n">${d.name}</p><p class="p">${d.pts == null ? '—' : d.pts + ' PKT'}</p></div>`).join('')}</div>
      <div class="slot"><div class="stamp">${title[1]}<small>${score} PKT · ${sat}%</small></div></div>
      <div class="row"><div class="score"><small>WYNIK TYGODNIA</small><b>0</b></div><div class="mood"><small>ZADOWOLENIE CZYTELNIKÓW: <span>${sat}%</span></small><div class="bar"><i></i></div></div></div>
      <div class="end"><p>${title[2]}${pay ? ` <em>Nagroda od redakcji: +${pay} zł.</em>` : ''}</p><button data-a="end">KONIEC</button></div></div></div>
    <p class="skip">KLIK ALBO KLAWISZ: DALEJ</p><div class="black"><div><b>KONIEC</b><span>DZIĘKUJEMY ZA TYDZIEŃ NA TRASIE</span></div></div>`;
  document.body.appendChild(el);
  const $ = q => el.querySelector(q), sheet = $('.sheet'), pols = [...el.querySelectorAll('.pol')], scoreB = $('.score b'), barI = $('.bar i'), stamp = $('.stamp'), end = $('.end'), black = $('.black');
  let skip = null, ff = false, stopFw = null, closing = false, shown = 0, endT = 1e12;
  // (a beat waits its time, or a key / a click cuts it short: the rest of the beat jumps to how it ends)
  const wait = ms => new Promise(res => { const t = setTimeout(() => { skip = null; res(); }, ms); skip = () => { clearTimeout(t); skip = null; ff = true; el.classList.add('ff'); res(); }; });
  const beat = () => { ff = false; el.classList.remove('ff'); };
  const shake = () => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  const count = (to, ms) => new Promise(res => { const from = +scoreB.textContent || 0, t0 = performance.now(); (function f(now) { const k = ff ? 1 : Math.min(1, (now - t0) / ms); scoreB.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
  function finish() { if (closing) return; closing = true; sound?.('bell'); black.classList.add('in'); setTimeout(() => { stopFw?.(); el.remove(); removeEventListener('keydown', key, true); onDone?.(); }, 2600); }
  function key(e) { if (!el.isConnected) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.repeat || closing) return; if (skip) skip(); else if (performance.now() - endT > 1500 && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape')) finish(); }
  addEventListener('keydown', key, true);
  el.addEventListener('click', e => { if (e.target.closest('[data-a="end"]')) { finish(); return; } if (skip) skip(); });
  (async () => {
    requestAnimationFrame(() => el.classList.add('on')); await wait(500); beat();
    sound?.('whistle'); sheet.classList.add('in'); await wait(1500); beat(); sound?.('crash'); shake(); await wait(450); beat();
    // (skipped while the album drops: the days left all land at once)
    let run = 0; for (const p of pols) { const d = days[shown++]; p.classList.add('in'); run += d.pts || 0; if (ff) continue; sound?.('land', { vol: .8 }); await Promise.all([wait(560), count(run, 480)]); }
    beat(); scoreB.textContent = score; barI.style.width = Math.max(0, Math.min(100, sat)) + '%'; sound?.('coin'); await wait(950); beat();
    stamp.classList.add('in'); await wait(300); beat(); sound?.('crash'); sound?.('trick'); shake(); stopFw = fireworks($('canvas.fw'), sound); await wait(700); beat();
    // (the last view: kept a moment before a key closes it, so mashing through the beats does not skip it)
    end.classList.add('in'); endT = performance.now(); $('.skip').style.display = 'none'; el.style.cursor = 'default'; $('[data-a="end"]').focus?.();
  })();
  return { el, get on() { return el.isConnected; }, next: () => { if (skip) skip(); else if (performance.now() - endT > 1500) finish(); } };
}
