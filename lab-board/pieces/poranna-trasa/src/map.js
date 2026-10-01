// The map between the stretches (M, or from the menu): the land seen from above in pixels, cut into regions (the outskirts where you
// live first, then the village, the far side, the town, the forest road, and further), the stretches as points joined by roads, the
// forks where you choose; each point's stars, and on choosing one its stats and best and what its stars want; home on it too. A region
// still ahead under a dither, its name and WKRÓTCE. From here: ride a stretch, back home (to ride free), the bike shop, a save.
// createMap({ levels, game }) → { open(at), close(), key(e), isOpen }
//   levels: the levels.js module; game: { go(id) (ride that stretch), home(), shop(), flash(s), sound(name), current() (the stretch on) }

const W = 320, H = 180;
// where the regions lie (their middles: each pixel the region of the nearest, the edges wobbled) and where the points are
const RC = { peryferia: [62, 118], wies: [150, 52], peryferia2: [176, 132], miasto: [236, 78], las: [276, 148], dalej: [300, 24] };
const LAB = { peryferia: [56, 164], wies: [118, 22], peryferia2: [204, 166], miasto: [240, 44], las: [282, 116], dalej: [292, 12] };   // (the names: off the points)
const PTS = { dom: [34, 136], p1: [66, 120], p2: [92, 92], p3: [100, 142], p4: [132, 112], w1: [150, 66] };

import { pxKey } from './pixui.js';

export function createMap({ levels: LV, game }) {
  const { REGIONS, LEVELS, LEVEL } = LV;
  const css = document.createElement('style'); css.textContent = `
    #map { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; color: #f6f3ea; font: 16px/1.25 PTPix, ui-monospace, Consolas, monospace; background: #0c0d0f; }
    #map.on { display: grid; } #map * { image-rendering: pixelated; }
    #map .stage { width: min(1280px, calc(100vw - 24px)); height: min(760px, calc(100vh - 24px)); display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; }
    #map .win { position: relative; min-height: 0; box-sizing: border-box; display: flex; flex-direction: column; border: 12px solid transparent; border-image: var(--px-win) 4 fill / 12px; }
    #map .head { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 2px 4px 8px; margin-bottom: 8px; background: linear-gradient(#efc970, #efc970) left bottom / 100% 4px no-repeat; }
    #map .head b { color: #efc970; font-size: 24px; font-weight: normal; } #map .chip { border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 1px 6px; color: #efc970; white-space: nowrap; }
    #map .land { position: relative; flex: 1; min-height: 0; border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; overflow: hidden; }
    #map canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; cursor: pointer; display: block; background: #1d1e21; }
    #map .side { gap: 10px; } #map .info { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    #map .reg { color: #8d8a80; } #map .ttl { color: #efc970; font-size: 24px; line-height: 1.1; } #map .note { color: #c9c6bb; }
    #map .stars { display: flex; gap: 6px; } #map .stars i { width: 20px; height: 20px; background: #33363a; clip-path: polygon(40% 0, 60% 0, 60% 30%, 100% 30%, 100% 50%, 80% 60%, 90% 100%, 70% 100%, 50% 80%, 30% 100%, 10% 100%, 20% 60%, 0 50%, 0 30%, 40% 30%); } #map .stars i.on { background: #efc970; }
    #map .goals, #map .best { border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; padding: 4px 6px; display: grid; grid-template-columns: auto 1fr auto; gap: 4px 8px; align-items: center; }
    #map .goals .s { width: 12px; height: 12px; background: #44484c; clip-path: inherit; } #map .goals .s.on { background: #efc970; } #map .goals .v, #map .best .v { color: #efc970; text-align: right; } #map .best .k { grid-column: 1 / 3; color: #a9a69b; }
    #map h4 { margin: 4px 0 0; color: #efc970; font-size: 16px; font-weight: normal; }
    #map button:not(.pxk) { all: unset; box-sizing: border-box; cursor: pointer; border: 6px solid transparent; border-image: var(--px-btn) 3 fill / 6px; padding: 2px 8px; color: #f6f3ea; text-align: center; }
    #map button:not(.pxk):hover, #map button:not(.pxk).pad-focus { border-image-source: var(--px-btn-hi); } #map button:not(.pxk):active { border-image-source: var(--px-btn-dn); transform: translateY(2px); }
    #map button.go:not(.pxk) { border-image-source: var(--px-sel); color: #17181b; padding: 6px 10px; font-size: 24px; } #map button.go:not(.pxk):hover { filter: brightness(1.08); } #map button.off:not(.pxk) { opacity: .4; cursor: default; }
    #map .acts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } #map .acts > :first-child { grid-column: 1 / -1; } #map .acts { align-items: end; }
    #map .hint { color: #8d8a80; }
    @media (max-width: 860px) { #map .stage { grid-template-columns: 1fr; grid-template-rows: minmax(200px, 1fr) auto; height: calc(100vh - 16px); width: calc(100vw - 16px); } #map .info { max-height: 34vh; } }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'map';
  el.innerHTML = `<div class="stage"><div class="win"><div class="head"><b>MAPA TRASY</b><span class="chip tot"></span></div><div class="land"><canvas width="${W}" height="${H}"></canvas></div></div>
    <div class="win side"><div class="info"></div><div class="acts">${pxKey('JEDŹ', { icon: 'play', key: 'ENTER', kind: 'gold big', attrs: 'data-a="go"', nudge: true })}${pxKey('DO DOMU', { icon: 'home', attrs: 'data-a="home"' })}${pxKey('WARSZTAT', { icon: 'shop', attrs: 'data-a="shop"' })}${pxKey('ZAPISZ', { icon: 'save', attrs: 'data-a="save"' })}${pxKey('ZAMKNIJ', { icon: 'close', key: 'ESC', attrs: 'data-a="close"' })}</div><div class="hint">STRZAŁKI: WYBÓR · ENTER: JEDŹ · ESC: ZAMKNIJ</div></div></div>`;
  document.body.appendChild(el);
  const cv = el.querySelector('canvas'), g = cv.getContext('2d'), info = el.querySelector('.info'), goB = el.querySelector('[data-a="go"]'), goL = goB.querySelector('span');
  let open_ = false, sel = 'p1', t0 = 0, raf = 0;

  // ---------- the land (drawn once, then the points over it each frame) ----------
  let landImg = null;
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const regionAt = (x, y) => { let best = null, bd = 1e9; for (const r of REGIONS) { const c = RC[r.id], w = (hash(Math.floor(x / 6), Math.floor(y / 6)) - .5) * 26, d = (x - c[0]) ** 2 + ((y - c[1]) * 1.25) ** 2 + w * 30; if (d < bd) { bd = d; best = r; } } return best; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  function paintLand() { const c = document.createElement('canvas'); c.width = W; c.height = H; const L = c.getContext('2d'), P = (x, y, w, h, k) => { L.fillStyle = k; L.fillRect(x, y, w, h); };
    const grid = []; for (let y = 0; y < H; y++) { grid[y] = []; for (let x = 0; x < W; x++) grid[y][x] = regionAt(x, y); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = grid[y][x], edge = (x && grid[y][x - 1] !== r) || (y && grid[y - 1][x] !== r); P(x, y, 1, 1, edge ? '#2a2c30' : shade(r.col, .82 + hash(x, y) * .16 + ((x + y) % 2 ? .03 : 0))); }
    // what each region looks like from above: little houses, fields, cranes, blocks, trees, hills
    const rr = (() => { let a = 9; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
    for (let k = 0; k < 1400; k++) { const x = rr() * (W - 8) | 0, y = rr() * (H - 8) | 0, r = grid[y][x]; if (grid[y + 6]?.[x + 6] !== r) continue; const pick = rr();
      if (r.id === 'peryferia' || r.id === 'peryferia2') { if (pick < .05) { P(x, y + 2, 5, 3, '#e8dcc0'); P(x, y, 5, 2, r.id === 'peryferia' ? '#8e3b2c' : '#5a5f66'); P(x + 2, y + 3, 1, 2, '#3a2a20'); } else if (pick < .09) { P(x + 1, y, 3, 3, '#3f7a3a'); P(x + 2, y + 3, 1, 1, '#5a4030'); } else if (r.id === 'peryferia2' && pick < .095) { P(x, y, 1, 6, '#e3b83a'); P(x, y, 5, 1, '#e3b83a'); } }
      else if (r.id === 'wies') { if (pick < .035) { for (let j = 0; j < 7; j++) P(x, y + j, 8, 1, j % 2 ? '#a89040' : '#d8c070'); } else if (pick < .05) { P(x, y + 1, 6, 4, '#8e3b2c'); P(x, y, 6, 1, '#5a2a20'); } else if (pick < .07) { P(x + 1, y, 3, 3, '#4f8a3a'); } }
      else if (r.id === 'miasto') { if (pick < .08) { const h = 3 + (rr() * 4 | 0); P(x, y, 5, h, ['#b8a090', '#d8c0a8', '#9a8a80', '#c0b0a0'][rr() * 4 | 0]); P(x, y, 5, 1, '#6a5a50'); P(x + 1, y + 2, 1, 1, '#efc970'); P(x + 3, y + 2, 1, 1, '#2a2c30'); } }
      else if (r.id === 'las') { if (pick < .16) { P(x + 1, y, 3, 1, '#2f6a3a'); P(x, y + 1, 5, 2, '#3a7a42'); P(x + 1, y + 3, 3, 1, '#2f6a3a'); P(x + 2, y + 4, 1, 1, '#5a4030'); } else if (pick < .17) { P(x, y + 1, 5, 3, '#c98a4a'); P(x + 2, y, 1, 1, '#c98a4a'); } }
      else if (r.id === 'dalej') { if (pick < .05) { P(x + 2, y, 1, 1, '#d3d0c3'); P(x + 1, y + 1, 3, 1, '#8a8f98'); P(x, y + 2, 5, 2, '#7a7f88'); } } }
    // the lake by the forest, the railway between the outskirts and the far side
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = ((x - 232) / 22) ** 2 + ((y - 150) / 12) ** 2; if (d < 1) P(x, y, 1, 1, d > .8 ? '#9ec7d6' : (x + y) % 3 ? '#4f86a8' : '#5a94b6'); }
    for (let y = 0; y < H; y++) { const x = Math.round(150 + Math.sin(y / 22) * 8); P(x, y, 1, 1, '#5a4a3a'); P(x + 3, y, 1, 1, '#5a4a3a'); if (y % 3 === 0) P(x, y, 4, 1, '#7a6a5a'); }
    // the names of the regions, in pixel letters
    L.font = '8px PTPix'; L.textBaseline = 'top'; for (const r of REGIONS) { const [x, y] = LAB[r.id], w = L.measureText(r.name).width; P(Math.round(x - w / 2) - 2, y - 1, Math.ceil(w) + 4, 10, 'rgba(23,24,27,.8)'); L.fillStyle = r.built ? '#f6f3ea' : '#a9a69b'; L.fillText(r.name, Math.round(x - w / 2), y); }
    // a region still ahead: dimmed under a dither, WKRÓTCE
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!grid[y][x].built && (x + y) % 2 === 0) P(x, y, 1, 1, 'rgba(12,13,15,.55)');
    for (const r of REGIONS) if (!r.built) { const [x, y] = LAB[r.id], w = L.measureText('WKRÓTCE').width; P(Math.round(x - w / 2) - 2, y + 9, Math.ceil(w) + 4, 10, 'rgba(23,24,27,.8)'); L.fillStyle = '#8d8a80'; L.fillText('WKRÓTCE', Math.round(x - w / 2), y + 10); }
    return c; }

  // ---------- the points, the roads between them ----------
  const nodes = () => ['dom', ...LEVELS.map(l => l.id)];
  const links = () => { const out = [['dom', LEVELS[0].id]]; for (const l of LEVELS) for (const a of l.after) out.push([l.id, a]); return out; };
  function road(a, b, done, open) { const [x0, y0] = PTS[a], [x1, y1] = PTS[b], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) { const t = k / n, x = Math.round(x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * (y1 - y0) * .12), y = Math.round(y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * (x1 - x0) * .08);
      if (!open && k % 3 === 2) continue; g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = done ? '#efc970' : open ? '#d8c8a0' : '#6a6f78'; g.fillRect(x, y, 1, 1); } }
  function star(x, y, on) { g.fillStyle = '#17181b'; g.fillRect(x - 1, y - 1, 5, 4); g.fillStyle = on ? '#efc970' : '#44484c'; g.fillRect(x, y, 3, 2); g.fillRect(x + 1, y - 1, 1, 1); }
  function draw(t) { if (!landImg) landImg = paintLand(); g.drawImage(landImg, 0, 0);
    for (const [a, b] of links()) road(a, b, a === 'dom' ? true : !!LV.load().done[a] && !!LV.load().done[b], a === 'dom' || LV.isOpen(b));
    for (const id of nodes()) { const [x, y] = PTS[id], L = LEVEL(id), open = id === 'dom' || (L && !L.soon && LV.isOpen(id)), done = !!LV.load().done[id], on = id === sel, blink = on && Math.floor(t / 300) % 2;
      if (id === 'dom') { g.fillStyle = '#17181b'; g.fillRect(x - 5, y - 6, 11, 10); g.fillStyle = '#f6f3ea'; g.fillRect(x - 4, y - 2, 9, 5); g.fillStyle = '#c23a2e'; g.fillRect(x - 4, y - 5, 9, 3); g.fillRect(x - 3, y - 6, 7, 1); g.fillStyle = '#5a4030'; g.fillRect(x, y, 2, 3); }
      else { g.fillStyle = '#17181b'; g.fillRect(x - 5, y - 5, 11, 11); g.fillStyle = !open ? '#44484c' : done ? '#efc970' : '#f6f3ea'; g.fillRect(x - 4, y - 4, 9, 9); g.fillStyle = !open ? '#2a2c30' : done ? '#b8902e' : '#9a968c'; g.fillRect(x - 4, y + 3, 9, 2);
        if (!open) { g.fillStyle = '#9a968c'; g.fillRect(x - 1, y - 2, 3, 1); g.fillRect(x - 2, y - 1, 1, 2); g.fillRect(x + 2, y - 1, 1, 2); g.fillRect(x - 2, y + 1, 5, 2); }
        else { const n = LV.starsOf(id); for (let k = 0; k < 3; k++) star(x - 5 + k * 4, y + 8, k < n); } }
      if (on) { g.fillStyle = blink ? '#efc970' : '#f6f3ea'; for (const [dx, dy] of [[-7, -7], [5, -7], [-7, 5], [5, 5]]) { g.fillRect(x + dx, y + dy, 3, 1); g.fillRect(x + dx + (dx < 0 ? 0 : 2), y + dy + (dy < 0 ? 0 : -2), 1, 3); } } }
    // you: the little rider at the point you are by, bobbing
    const cur = game.current?.() || 'dom', [mx, my] = PTS[cur] || PTS.dom, bob = Math.floor(t / 250) % 2; g.fillStyle = '#17181b'; g.fillRect(mx + 6, my - 12 + bob, 6, 8); g.fillStyle = '#c23a2e'; g.fillRect(mx + 7, my - 11 + bob, 4, 2); g.fillStyle = '#e3b08a'; g.fillRect(mx + 7, my - 9 + bob, 4, 2); g.fillStyle = '#3d7be0'; g.fillRect(mx + 7, my - 7 + bob, 4, 2); }
  function loop(t) { if (!open_) return; draw(t); raf = requestAnimationFrame(loop); }

  // ---------- the side: what the chosen point is ----------
  const mmss = s => s == null ? '-' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function side() { const tot = LV.totalStars(); el.querySelector('.tot').textContent = `★ ${tot} / ${LEVELS.filter(l => !l.soon).length * 3}`;
    if (sel === 'dom') { info.innerHTML = `<div class="reg">PERYFERIA</div><div class="ttl">DOM</div><div class="note">Twoja baza. Kosz z bratem, garaż, rodzina. Jeździsz swobodnie, bez mety i bez zegara.</div>`; goL.textContent = 'DO DOMU'; goB.classList.remove('off'); return; }
    const L = LEVEL(sel), R = REGIONS.find(r => r.id === L.region), open = !L.soon && LV.isOpen(sel), b = LV.bestOf(sel), n = LV.starsOf(sel);
    if (L.soon) { info.innerHTML = `<div class="reg">${R.name}</div><div class="ttl">${L.name}</div><div class="note">${R.note}</div><div class="note" style="color:#8d8a80">Ten region jest jeszcze w budowie.</div>`; goL.textContent = 'WKRÓTCE'; goB.classList.add('off'); return; }
    const gl = L.goal, st = b ? [b.time <= gl.time, (b.acc || 0) >= gl.acc && (b.delivered || 0) >= gl.papers, (b.falls ?? 99) === 0] : [false, false, false];
    info.innerHTML = `<div class="reg">${R.name}</div><div class="ttl">${L.name}</div><div class="stars">${[0, 1, 2].map(k => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</div><div class="note">${L.note}</div>
      <h4>GWIAZDKI</h4><div class="goals"><i class="s ${st[0] ? 'on' : ''}"></i><span>CZAS DO</span><span class="v">${mmss(gl.time)}</span><i class="s ${st[1] ? 'on' : ''}"></i><span>${gl.papers} GAZET, CELNOŚĆ</span><span class="v">${Math.round(gl.acc * 100)}%</span><i class="s ${st[2] ? 'on' : ''}"></i><span>BEZ WYWROTKI</span><span class="v"></span></div>
      <h4>NAJLEPSZE WYNIKI</h4>${b ? `<div class="best"><span class="k">CZAS</span><span class="v">${mmss(b.time)}</span><span class="k">GAZETY</span><span class="v">${b.delivered}</span><span class="k">CELNOŚĆ</span><span class="v">${Math.round((b.acc || 0) * 100)}%</span><span class="k">NAJMNIEJ WYWROTEK</span><span class="v">${b.falls}</span><span class="k">ZAROBEK</span><span class="v">${b.earned} ZŁ</span><span class="k">PRZEJAZDY</span><span class="v">${b.runs}</span></div>` : '<div class="note" style="color:#8d8a80">Jeszcze nie jechane.</div>'}
      <h4>NA DRODZE</h4><div class="note">AUTA: ${'▪'.repeat(L.cars)} · PSY: ${'▪'.repeat(Math.round(L.heat * 3))} · W TORBIE: ${L.papers}</div>`;
    goL.textContent = open ? (b ? 'JEDŹ JESZCZE RAZ' : 'JEDŹ') : 'ZAMKNIĘTE'; goB.classList.toggle('off', !open);
    if (!open) info.insertAdjacentHTML('beforeend', `<div class="note" style="color:#cf5a3e">Najpierw ukończ poprzedni odcinek.</div>`); }

  // ---------- choosing ----------
  const pick = id => { if (!PTS[id]) return; sel = id; game.sound?.('ui'); side(); };
  function go() { if (sel === 'dom') { close(); game.home(); return; } const L = LEVEL(sel); if (!L || L.soon || !LV.isOpen(sel)) { game.sound?.('miss'); return; } close(); game.go(sel); }
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), k = Math.min(r.width / W, r.height / H), ox = r.left + (r.width - W * k) / 2, oy = r.top + (r.height - H * k) / 2, x = (e.clientX - ox) / k, y = (e.clientY - oy) / k;
    let best = null, bd = 12; for (const id of nodes()) { const [px, py] = PTS[id], d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = id; } } if (best) { if (best === sel) go(); else pick(best); } });
  goB.onclick = go; el.querySelector('[data-a="home"]').onclick = () => { close(); game.home(); }; el.querySelector('[data-a="shop"]').onclick = () => game.shop();
  el.querySelector('[data-a="save"]').onclick = () => { game.save?.(); game.flash('Zapisane'); }; el.querySelector('[data-a="close"]').onclick = () => close();
  // the arrows: to the nearest point that way
  function step(dx, dy) { const [x0, y0] = PTS[sel]; let best = null, bd = 1e9; for (const id of nodes()) { if (id === sel) continue; const [x, y] = PTS[id], vx = x - x0, vy = y - y0, along = vx * dx + vy * dy; if (along <= 0) continue; const d = Math.hypot(vx, vy) + Math.abs(vx * dy - vy * dx) * 1.5; if (d < bd) { bd = d; best = id; } } if (best) pick(best); }
  function key(e) { if (!open_) return false; const c = e.code;
    if (c === 'Escape' || c === 'KeyM') close(); else if (c === 'Enter' || c === 'Space') go(); else if (c === 'ArrowLeft' || c === 'KeyA') step(-1, 0); else if (c === 'ArrowRight' || c === 'KeyD') step(1, 0); else if (c === 'ArrowUp' || c === 'KeyW') step(0, -1); else if (c === 'ArrowDown' || c === 'KeyS') step(0, 1);
    e.preventDefault(); return true; }
  function open(at) { if (open_) return; open_ = true; const cur = at || game.current?.(); const next = LEVELS.find(l => !l.soon && LV.isOpen(l.id) && !LV.load().done[l.id]); sel = cur && cur !== 'dom' ? (LEVEL(cur)?.after.find(a => LV.isOpen(a) && !LEVEL(a)?.soon) || cur) : next?.id || LEVELS[0].id;
    landImg = null; el.classList.add('on'); side(); t0 = performance.now(); raf = requestAnimationFrame(loop); }
  function close() { if (!open_) return; open_ = false; el.classList.remove('on'); cancelAnimationFrame(raf); }
  return { open, close, key, get isOpen() { return open_; }, refresh: side };
}
