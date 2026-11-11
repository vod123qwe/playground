// Nitka: gra. Przeciągnij nitkę od 1, zaliczaj cyfry po kolei i zakryj każde pole planszy.
// Dodatkowo: zakręty/prosto, strzałki, portale, światy z bossem, wyzwania, combo, monety i sklep.
(function () {
  'use strict';
  const G = window.NitkaGen;
  // Na GitHub Pages nie ma naszego serwera: zapis tylko w telefonie, pojedynek przez osobny adres (jeśli ustawiony)
  const STATIC = /github\.io$/.test(location.hostname);
  const DUEL_BASE = window.NITKA_DUEL || (STATIC ? '' : 'api/duel/');
  if (STATIC && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const $ = (id) => document.getElementById(id);
  const cv = $('board'), ctx = cv.getContext('2d');
  const fxc = $('fx'), fx = fxc.getContext('2d');

  // ---------- blokada gestów przeglądarki ----------
  // przewijanie, odświeżanie pociągnięciem, zoom szczypaniem/dwuklikiem, menu długiego przytrzymania, zaznaczanie
  const inScroll = (t) => t && t.closest && t.closest('.scroll');
  document.addEventListener('touchmove', (e) => { if (!inScroll(e.target) || e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  const isField = (t) => t && t.tagName === 'INPUT';
  ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'selectstart', 'dragstart', 'dblclick'].forEach((ev) =>
    document.addEventListener(ev, (e) => { if (!isField(e.target)) e.preventDefault(); }, { passive: false }));

  // ---------- kolory ----------
  const WORLD_PAL = [
    ['#A5ED6E', '#58CC02', '#2BB5A0'],
    ['#FFC800', '#FF9600', '#FF4B4B'],
    ['#E3A6FF', '#CE82FF', '#1CB0F6'],
    ['#7FE3FF', '#1CB0F6', '#2B70C9'],
    ['#A5ED6E', '#2BB5A0', '#1CB0F6'],
    ['#58CC02', '#1CB0F6', '#FF4B4B'],
  ];
  const DAILY_PAL = ['#7FE3FF', '#1CB0F6', '#CE82FF'];
  const DUEL_PAL = ['#FFC800', '#FF9600', '#1CB0F6'];
  const SKINS = [
    { id: 'classic', name: 'Klasyczna', price: 0 },
    { id: 'ocean', name: 'Ocean', price: 60, cols: ['#9BF6FF', '#1CB0F6', '#2B70C9'] },
    { id: 'neon', name: 'Neon', price: 90, cols: ['#00F5D4', '#00BBF9', '#F15BB5'], glow: true },
    { id: 'lava', name: 'Lawa', price: 120, cols: ['#FFD000', '#FF5A00', '#C2002F'], flow: true },
    { id: 'rainbow', name: 'Tęcza', price: 180, rainbow: true },
    { id: 'gold', name: 'Złoto', price: 250, cols: ['#FFE89A', '#FFC800', '#E58700'], sparkle: true },
  ];
  const PORTAL_COL = [[206, 130, 255], [255, 150, 0]];
  const INK = '#4B4B4B', INK_D = '#2E2E2E';
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const mixW = (c, k) => [c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k];
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  let pal = WORLD_PAL[0].map(hexRgb), skin = SKINS[0], NOW = 0;
  function colorAt(t, i) {
    if (skin.rainbow) return hsl((t * 320 + NOW * 0.06) % 360, 88, 56);
    if (skin.flow) t += 0.07 * Math.sin(NOW / 260 - (i || 0) * 0.45);
    const p = skin.cols ? skinPal : pal;
    t = Math.max(0, Math.min(1, t)) * (p.length - 1);
    const j = Math.min(p.length - 2, Math.floor(t)), f = t - j, a = p[j], b = p[j + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  let skinPal = null;
  function applySkin() {
    skin = SKINS.find((s) => s.id === save.skin) || SKINS[0];
    skinPal = skin.cols ? skin.cols.map(hexRgb) : null;
  }

  // ---------- zapis ----------
  // localStorage + serwer (adres tunelu zmienia się przy każdym starcie, a localStorage jest przypisany do adresu)
  const SAVE_KEY = 'nitka-save-v2';
  const freshSave = () => ({
    v: 2, updated: 0, level: 1, stars: {}, best: {}, solved: 0, streak: 0, bestStreak: 0, sound: true,
    coins: 30, skins: ['classic'], skin: 'classic', seen: {}, maxCombo: 0, nick: '', duelWins: 0,
    mode: 'level', slots: { level: null, daily: null }, daily: { lastDate: '', streak: 0, results: {} }, last: null,
  });
  let save = freshSave();
  function migrate(s) {
    if (!s || !s.updated) return null;
    if (s.v === 2) return s;
    const n = freshSave();
    for (const k of ['level', 'stars', 'solved', 'streak', 'bestStreak', 'sound', 'daily']) if (s[k] !== undefined) n[k] = s[k];
    n.updated = s.updated;
    return n;
  }
  function loadLocal() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') || JSON.parse(localStorage.getItem('nitka-save-v1') || 'null');
      return migrate(s);
    } catch (e) { return null; }
  }
  let saveTimer = 0;
  function persist(now) {
    save.updated = Date.now();
    const body = JSON.stringify(save);
    try { localStorage.setItem(SAVE_KEY, body); } catch (e) {}
    clearTimeout(saveTimer);
    if (STATIC) return;
    const push = () => fetch('api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    if (now) push(); else saveTimer = setTimeout(push, 700);
  }
  function flushSave() {
    if (cur && running) { stopClock(); cur.paused = true; }
    save.updated = Date.now();
    const body = JSON.stringify(save);
    try { localStorage.setItem(SAVE_KEY, body); } catch (e) {}
    if (!STATIC) try { navigator.sendBeacon && navigator.sendBeacon('api/save', new Blob([body], { type: 'application/json' })); } catch (e) {}
  }
  window.addEventListener('pagehide', flushSave);

  // ---------- generowanie w workerze ----------
  let worker = null, reqId = 0;
  const pending = {};
  try {
    worker = new Worker('js/worker.js');
    worker.onmessage = (e) => { const r = pending[e.data.id]; delete pending[e.data.id]; r && r(e.data.puzzle); };
    worker.onerror = () => { worker = null; for (const k in pending) { const o = pending[k]; delete pending[k]; o(G.generate(o.opts)); } };
  } catch (e) { worker = null; }
  function gen(opts) {
    return new Promise((res) => {
      if (!worker) return res(G.generate(opts));
      const id = ++reqId; res.opts = opts; pending[id] = res;
      worker.postMessage({ id, opts });
    });
  }
  const randSeed = () => (Math.random() * 4294967295) >>> 0;
  const levelOpts = (lvl) => Object.assign(G.levelConfig(lvl), { seed: randSeed() });
  let prefetch = null;
  function prefetchLevel(lvl) { const o = levelOpts(lvl); prefetch = { level: lvl, opts: o, promise: gen(o) }; }
  function getLevelPuzzle(lvl) {
    if (prefetch && prefetch.level === lvl) { const p = prefetch; prefetch = null; return p.promise.then((pz) => ({ pz, cfg: p.opts })); }
    const o = levelOpts(lvl);
    return gen(o).then((pz) => ({ pz, cfg: o }));
  }
  function dstr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  const today = () => dstr(new Date());

  // ---------- stan ----------
  let cur = null, P = null;
  let running = false, startedAt = 0;
  let born = new Map(), errFlash = new Map(), hinted = new Map(), dead = new Set();
  let warnUntil = 0, winT = 0, hintQueue = [], hintTimer = 0, lastStars = 3;
  let combo = 0, lastAdd = 0, comboHide = 0;

  function derive(pz) {
    const w = pz.w, h = pz.h, N = w * h;
    const mask = Uint8Array.from(pz.mask, (ch) => (ch === '1' ? 1 : 0));
    const walls = new Set(pz.walls.map(([a, b]) => G.edgeKey(a, b)));
    const clueAt = new Int16Array(N), partner = new Int32Array(N).fill(-1), mark = new Int8Array(N), arrow = new Int32Array(N).fill(-1), portalIdx = new Int8Array(N).fill(-1);
    pz.clues.forEach((c, i) => { clueAt[c] = i + 1; });
    pz.portals.forEach(([a, b], i) => { partner[a] = b; partner[b] = a; portalIdx[a] = portalIdx[b] = i; });
    for (const [c, t] of pz.markers) mark[c] = t;
    for (const [c, to] of pz.arrows) arrow[c] = to;
    const nbrs = [];
    let count = 0;
    for (let c = 0; c < N; c++) {
      const l = [];
      if (mask[c]) {
        count++;
        const x = c % w, y = (c / w) | 0;
        const add = (m) => { if (mask[m] && !walls.has(G.edgeKey(c, m))) l.push(m); };
        if (x > 0) add(c - 1); if (x < w - 1) add(c + 1); if (y > 0) add(c - w); if (y < h - 1) add(c + w);
      }
      nbrs.push(l);
    }
    return { w, h, N, mask, walls, clueAt, partner, mark, arrow, portalIdx, nbrs, count, K: pz.clues.length, start: pz.clues[0], end: pz.clues[pz.clues.length - 1], sol: pz.sol };
  }
  const head = () => cur.path[cur.path.length - 1];
  const gridAdj = (a, b) => { const w = P.w; return (Math.abs(a - b) === 1 && ((a / w) | 0) === ((b / w) | 0)) || Math.abs(a - b) === w; };
  const walk = (a, b) => P.nbrs[a].includes(b);
  const man = (a, b) => Math.abs((a % P.w) - (b % P.w)) + Math.abs(((a / P.w) | 0) - ((b / P.w) | 0));
  function nextClue() { let k = 0; for (const c of cur.path) if (P.clueAt[c]) k++; return k + 1; }
  function parOf() {
    const T = P.count, extra = cur.puzzle.markers.length * 0.6 + cur.puzzle.arrows.length * 0.4 + cur.puzzle.portals.length * 3;
    return Math.max(15, Math.round((T * (0.55 + T * 0.0115) + extra) / 5) * 5);
  }

  function computeDead() {
    dead = new Set();
    const len = cur.path.length;
    if (len <= 1 || len === P.count) return;
    const inPath = new Uint8Array(P.N); cur.path.forEach((c) => { inPath[c] = 1; });
    const h = head(), reach = new Uint8Array(P.N), st = [];
    const push = (m) => { if (!inPath[m] && !reach[m]) { reach[m] = 1; st.push(m); } };
    for (const m of P.nbrs[h]) push(m);
    while (st.length) { const c = st.pop(); for (const m of P.nbrs[c]) push(m); if (P.partner[c] >= 0) push(P.partner[c]); }
    for (let c = 0; c < P.N; c++) {
      if (!P.mask[c] || inPath[c]) continue;
      if (!reach[c]) { dead.add(c); continue; }
      let d = 0;
      for (const m of P.nbrs[c]) if (!inPath[m] || m === h) d++;
      if (d < (c === P.end || P.partner[c] >= 0 ? 1 : 2)) dead.add(c);
    }
  }

  // ---------- dźwięk ----------
  let ac = null;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'sine', gain = 0.06, when = 0, slide = 0) {
    if (!save.sound) return;
    const a = audio(); if (!a) return;
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SCALE = [0, 2, 4, 7, 9];
  const noteF = (k) => 330 * Math.pow(2, (12 * Math.floor(k / 5) + SCALE[k % 5]) / 12);
  const sStep = () => tone(noteF(Math.min(19, combo > 3 ? 3 + Math.floor(combo / 2) : cur.path.length % 10)), 0.09, 'triangle', 0.05);
  const sBack = () => tone(240, 0.05, 'sine', 0.03, 0, 0.8);
  const sClue = (k) => { const b = noteF(8 + (k % 6)); tone(b, 0.22, 'triangle', 0.06); tone(b * 1.5, 0.26, 'sine', 0.04, 0.05); };
  const sErr = () => tone(140, 0.16, 'square', 0.035, 0, 0.6);
  const sPortal = () => { tone(300, 0.25, 'sine', 0.05, 0, 3); tone(900, 0.2, 'triangle', 0.03, 0.12, 0.5); };
  const sWin = () => [0, 2, 4, 5, 7, 9, 10, 12].forEach((k, i) => tone(noteF(5 + k), 0.3, 'triangle', 0.05, i * 0.07));
  const sStar = (i) => tone(noteF(10 + i * 2), 0.35, 'sine', 0.06);
  const sCoin = () => { tone(988, 0.08, 'square', 0.025); tone(1319, 0.2, 'square', 0.025, 0.07); };
  const buzz = (ms) => {
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) {}
  };

  // ---------- układ ----------
  let S = { w: 300, h: 300 }, pad = 10, cell = 50, DPR = 1;
  function layout() {
    DPR = Math.min(3, window.devicePixelRatio || 1);
    fxc.width = Math.round(innerWidth * DPR); fxc.height = Math.round(innerHeight * DPR);
    fxc.style.width = innerWidth + 'px'; fxc.style.height = innerHeight + 'px';
    if (!P) return;
    const st = $('stage').getBoundingClientRect();
    cell = Math.min((st.width - 4) / (P.w + 0.24), (st.height - 30) / (P.h + 0.24), 72);
    pad = cell * 0.12;
    S = { w: Math.round(P.w * cell + 2 * pad), h: Math.round(P.h * cell + 2 * pad) };
    cv.style.width = S.w + 'px'; cv.style.height = S.h + 'px';
    cv.width = Math.round(S.w * DPR); cv.height = Math.round(S.h * DPR);
  }
  window.addEventListener('resize', layout);
  const cx = (c) => pad + ((c % P.w) + 0.5) * cell;
  const cy = (c) => pad + (((c / P.w) | 0) + 0.5) * cell;

  // ---------- czas, gwiazdki, wyzwanie ----------
  const elapsed = () => cur.elapsed + (running ? (performance.now() - startedAt) / 1000 : 0);
  function startClock() { if (!running && !cur.done) { running = true; startedAt = performance.now(); } }
  function stopClock() { if (running) { cur.elapsed += (performance.now() - startedAt) / 1000; running = false; } }
  document.addEventListener('visibilitychange', () => {
    if (!cur) return;
    if (cur.mode === 'duel') return;
    if (document.hidden) { if (running) { stopClock(); cur.paused = true; } flushSave(); }
    else if (cur.paused) { cur.paused = false; if (cur.path.length > 1) startClock(); }
  });
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function starsFor(t, hints) {
    const par = parOf();
    if (t <= par && !hints) return 3;
    if (t <= par * 2 && hints <= 1) return 2;
    return 1;
  }
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z" fill="#FFC800" stroke="#E6A800" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const COIN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12.8" r="9" fill="#E58700"/><circle cx="12" cy="11.2" r="9" fill="#FFC800"/><circle cx="12" cy="11.2" r="5.6" fill="none" stroke="#E6A800" stroke-width="2"/></svg>';
  const BOLT = '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>';
  const CROWN = '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/></svg>';
  function renderLiveStars(n) {
    const el = $('liveStars');
    if (!el.children.length) el.innerHTML = STAR.repeat(3);
    [...el.children].forEach((s, i) => {
      const on = i < n;
      if (!on && !s.classList.contains('off')) { s.classList.add('lost'); setTimeout(() => s.classList.remove('lost'), 600); }
      s.classList.toggle('off', !on);
    });
  }
  const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
  const CH_TEXT = { time: (l) => `Wyzwanie: zmieść się w ${fmt(l)}`, noundo: () => 'Wyzwanie: bez cofania', nohint: () => 'Wyzwanie: bez podpowiedzi' };
  const CH_SHORT = { time: (l) => `do ${fmt(l)}`, noundo: () => 'bez cofania', nohint: () => 'bez podpowiedzi' };
  function renderChallenge() {
    const el = $('chal'), ch = cur.challenge;
    if (!ch) { el.hidden = true; return; }
    el.hidden = false;
    el.className = 'chal' + (ch.failed ? ' fail' : ch.done ? ' ok' : '');
    el.innerHTML = BOLT + CH_SHORT[ch.type](ch.limit);
  }
  function failChallenge(why) {
    const ch = cur.challenge;
    if (!ch || ch.failed || cur.done) return;
    ch.failed = true; renderChallenge();
    banner('err', 'Wyzwanie przepadło', why + '. Poziom nadal możesz ułożyć.');
  }

  // ---------- HUD ----------
  function updateHud() {
    const daily = cur.mode === 'daily', duel = cur.mode === 'duel';
    $('opp').hidden = !duel;
    $('btnHint').hidden = duel;
    if (duel) {
      $('lvlName').textContent = `Pojedynek · runda ${cur.round}`;
      $('menuWorld').textContent = 'Pojedynek';
      $('dots').innerHTML = '';
    } else if (daily) {
      $('lvlName').textContent = `Dzienna · ${cur.date.slice(8, 10)}.${cur.date.slice(5, 7)}`;
      $('menuWorld').textContent = 'Dzienna łamigłówka';
      $('dots').innerHTML = '';
    } else {
      const wo = G.worldOf(cur.level);
      $('menuWorld').textContent = `Świat ${wo.index + 1} · ${wo.name}`;
      $('lvlName').textContent = wo.k === 10 ? `Boss · ${cur.level}` : `Poziom ${cur.level}`;
      let html = '';
      for (let k = 1; k <= 10; k++) {
        const lvl = wo.index * 10 + k;
        const cls = lvl < save.level || (lvl === cur.level && cur.done) ? 'done' : lvl === cur.level ? 'cur' : '';
        const ch = k === 4 || k === 7 ? ' ch' : '';
        html += k === 10 ? `<div class="dot boss ${cls}">${CROWN}</div>` : `<div class="dot ${cls}${ch}"></div>`;
      }
      $('dots').innerHTML = html;
    }
    $('starTotal').textContent = totalStars();
    $('coins').textContent = save.coins;
    $('streak').textContent = save.streak;
    $('streakPill').classList.toggle('zero', !save.streak);
    $('hintPrice').textContent = HINT_PRICE;
    $('mDailyT').textContent = daily ? 'Wróć do poziomów' : 'Dzienna łamigłówka';
    $('mDailyS').textContent = daily ? 'Tam, gdzie skończyłeś' : 'Jedna plansza na dzień';
    renderChallenge();
    updateCover();
  }
  function updateCover() {
    const p = cur.path.length / P.count;
    $('coverFill').style.width = (p * 100).toFixed(1) + '%';
  }
  const IC = {
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="#EA2B2B" stroke-width="3.4" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="#58A700" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="#1899D6"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  };
  function banner(kind, text, small, ms = 1500) {
    const b = $('banner');
    b.className = kind === 'ok' ? '' : kind;
    $('bannerIc').innerHTML = IC[kind] || IC.info;
    $('bannerTx').innerHTML = text + (small ? `<small>${small}</small>` : '');
    void b.offsetWidth; b.classList.add('show');
    clearTimeout(banner._t); banner._t = setTimeout(() => b.classList.remove('show'), ms);
  }

  // ---------- wprowadzenia ----------
  const ILL = {
    turns: `<svg viewBox="0 0 120 120"><g fill="#fff" stroke="#E5E5E5" stroke-width="2">${[0, 1, 2].map((y) => [0, 1, 2].map((x) => `<rect x="${6 + x * 37}" y="${6 + y * 37}" width="34" height="34" rx="8"/>`).join('')).join('')}</g><path d="M23 23 H97 V97" stroke="#CE82FF" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="23" r="8" fill="#fff" stroke="#4B4B4B" stroke-width="4"/><circle cx="97" cy="23" r="8" fill="#4B4B4B"/></svg>`,
    arrows: `<svg viewBox="0 0 120 120"><g fill="#fff" stroke="#E5E5E5" stroke-width="2">${[0, 1, 2].map((y) => [0, 1, 2].map((x) => `<rect x="${6 + x * 37}" y="${6 + y * 37}" width="34" height="34" rx="8"/>`).join('')).join('')}</g><path d="M23 60 H60 V97" stroke="#1CB0F6" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M53 54 L60 62 L67 54" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M90 16 L98 23 L90 30" stroke="#4B4B4B" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    portals: `<svg viewBox="0 0 120 120"><g fill="#fff" stroke="#E5E5E5" stroke-width="2">${[0, 1, 2].map((y) => [0, 1, 2].map((x) => `<rect x="${6 + x * 37}" y="${6 + y * 37}" width="34" height="34" rx="8"/>`).join('')).join('')}</g><path d="M23 23 H60" stroke="#FF86D0" stroke-width="13" stroke-linecap="round"/><path d="M97 97 H60" stroke="#CE82FF" stroke-width="13" stroke-linecap="round"/><circle cx="60" cy="23" r="12" fill="none" stroke="#CE82FF" stroke-width="5" stroke-dasharray="6 4"/><circle cx="97" cy="97" r="12" fill="none" stroke="#CE82FF" stroke-width="5" stroke-dasharray="6 4"/><path d="M66 32 Q100 50 92 82" stroke="#CE82FF" stroke-width="3" fill="none" stroke-dasharray="3 5" stroke-linecap="round"/></svg>`,
    shapes: `<svg viewBox="0 0 120 120"><g fill="#fff" stroke="#E5E5E5" stroke-width="2"><rect x="43" y="6" width="34" height="34" rx="8"/><rect x="6" y="43" width="34" height="34" rx="8"/><rect x="43" y="43" width="34" height="34" rx="8"/><rect x="80" y="43" width="34" height="34" rx="8"/><rect x="43" y="80" width="34" height="34" rx="8"/></g><path d="M77 43 V77" stroke="#4B4B4B" stroke-width="6" stroke-linecap="round"/><path d="M23 60 H60 V23" stroke="#FF9600" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    walls: `<svg viewBox="0 0 120 120"><g fill="#fff" stroke="#E5E5E5" stroke-width="2">${[0, 1, 2].map((y) => [0, 1, 2].map((x) => `<rect x="${6 + x * 37}" y="${6 + y * 37}" width="34" height="34" rx="8"/>`).join('')).join('')}</g><path d="M78 44 V113" stroke="#4B4B4B" stroke-width="7" stroke-linecap="round"/><path d="M23 97 H60 V60 H97 V23" stroke="#58CC02" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    boss: `<svg viewBox="0 0 120 120"><path d="M14 40l24 20 22-34 22 34 24-20-10 60H24z" fill="#FFC800" stroke="#E6A800" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="74" r="8" fill="#FF4B4B"/><circle cx="36" cy="80" r="5" fill="#1CB0F6"/><circle cx="84" cy="80" r="5" fill="#58CC02"/></svg>`,
  };
  const INTRO = {
    walls: ['Nowość', 'Ściany', 'Gruba kreska między polami to ściana. Przez nią nitka nie przejdzie, trzeba obejść.'],
    shapes: ['Nowy świat', 'Plansze w kształtach', 'Plansze mają teraz dziury i ścięte rogi. Zasada ta sama: zakryj każde pole.'],
    turns: ['Nowość', 'Zakręty i proste', 'Pełna kropka: nitka musi tu skręcić. Pusta kropka: musi przejść na wprost.'],
    arrows: ['Nowość', 'Strzałki', 'Z pola ze strzałką wyjdziesz tylko w kierunku, który wskazuje.'],
    portals: ['Nowość', 'Portale', 'Wejdź w portal, a wyjdziesz z drugiego w tym samym kolorze. Oba pola się liczą.'],
    boss: ['Koniec świata', 'Boss', 'Duża plansza ze wszystkim, co już znasz. Za wygraną 30 monet więcej.'],
  };
  let introDone = null;
  function showIntro(key) {
    return new Promise((res) => {
      const [kick, title, text] = INTRO[key];
      $('introKick').textContent = kick; $('introTitle').textContent = title; $('introText').textContent = text;
      $('introIll').innerHTML = ILL[key];
      $('intro').classList.add('show');
      introDone = () => { $('intro').classList.remove('show'); res(); };
    });
  }
  $('btnIntro').addEventListener('click', () => { audio(); introDone && introDone(); introDone = null; });

  // ---------- ładowanie planszy ----------
  function setPalette(p) {
    pal = p.map(hexRgb);
    const r = document.documentElement.style;
    r.setProperty('--p0', p[0]); r.setProperty('--p1', p[1]); r.setProperty('--p2', p[2]);
  }
  function begin(state, announce) {
    cur = state;
    cur.history = cur.history || [];
    P = derive(cur.puzzle);
    born = new Map(); errFlash = new Map(); hinted = new Map(); dead = new Set(); winT = 0; hintQueue = []; clearTimeout(hintTimer);
    running = false; cur.done = false; combo = 0; cur.maxCombo = cur.maxCombo || 0;
    setPalette(cur.mode === 'duel' ? DUEL_PAL : cur.mode === 'daily' ? DAILY_PAL : WORLD_PAL[G.worldOf(cur.level).index % WORLD_PAL.length]);
    $('loading').style.display = 'none';
    layout(); updateHud();
    lastStars = starsFor(cur.elapsed, cur.hints); renderLiveStars(lastStars);
    $('time').textContent = fmt(cur.elapsed); $('time').classList.remove('over');
    cv.classList.remove('enter'); void cv.offsetWidth; cv.classList.add('enter');
    computeDead();
    if (cur.mode !== 'duel') { save.slots[cur.mode] = cur; save.mode = cur.mode; persist(); }
    if (announce) announce();
    if (cur.path.length > 1 && !document.hidden) startClock();
  }
  function challengeFor(level, pz, par) {
    const k = ((level - 1) % 10) + 1;
    if (k !== 4 && k !== 7) return null;
    const type = ['time', 'noundo', 'nohint'][G.hashStr('ch' + level) % 3];
    return { type, limit: type === 'time' ? Math.round((par * 1.25) / 5) * 5 : 0, failed: false };
  }
  async function loadLevel(level) {
    $('loading').style.display = '';
    const { pz, cfg } = await getLevelPuzzle(level);
    const st = { mode: 'level', level, puzzle: pz, path: [pz.clues[0]], elapsed: 0, hints: 0, history: [], boss: cfg.boss };
    // wprowadzenie nowej mechaniki (raz na zawsze)
    const keys = [];
    const def = G.worldOf(level).def;
    if (cfg.k === 1 && def.intro && !save.seen[def.intro]) keys.push(def.intro);
    if (pz.walls.length && !save.seen.walls && def.intro !== 'shapes') keys.push('walls');
    if (cfg.boss && !save.seen.boss) keys.push('boss');
    for (const k of keys) { save.seen[k] = true; await showIntro(k); }
    begin(st, () => {
      const par = parOf();
      st.challenge = challengeFor(level, pz, par);
      renderChallenge();
      if (st.challenge) banner('info', 'Wyzwanie!', CH_TEXT[st.challenge.type](st.challenge.limit).replace('Wyzwanie: ', '') + ' · nagroda 15 monet', 2400);
      else if (cfg.boss) banner('info', 'Boss świata', 'Duża plansza, potrójna nagroda', 2000);
      else if (level === 1 && !save.solved) banner('info', 'Przeciągnij nitkę od 1', 'Cyfry po kolei, zakryj każde pole', 3200);
    });
    prefetchLevel(level + 1);
  }
  async function loadDaily() {
    const d = today(), slot = save.slots.daily;
    if (slot && slot.date === d && !slot.done && slot.puzzle && slot.puzzle.mask) return begin(slot, () => banner('info', 'Dzienna łamigłówka', 'Ta sama plansza przez cały dzień'));
    $('loading').style.display = '';
    const pz = await gen(G.dailyConfig(d));
    const res = save.daily.results[d];
    begin({ mode: 'daily', date: d, puzzle: pz, path: [pz.clues[0]], elapsed: 0, hints: 0, history: [] },
      () => banner('info', 'Dzienna łamigłówka', res ? `Twój dzisiejszy czas: ${fmt(res.time)}. Spróbuj szybciej` : 'Za ułożenie 20 monet', 2200));
  }

  // ---------- ruchy ----------
  const FAIL_TX = {
    wall: ['Tu stoi ściana', 'Obejdź ją inną drogą'],
    order: () => ['Po kolei!', `Teraz cyfra ${nextClue()}`],
    early: ['Meta na sam koniec', 'Najpierw zakryj wszystkie pola'],
    arrow: ['Strzałka!', 'Z tego pola wyjdziesz tylko tam, gdzie wskazuje'],
    turn: ['Tu trzeba skręcić', 'Pełna kropka oznacza zakręt'],
    straight: ['Tu prosto', 'Pusta kropka oznacza przejście na wprost'],
    portal: ['Portal zamknięty', 'Drugi portal jest już zajęty'],
    done: ['To już meta', 'Cofnij się, żeby zakryć resztę pól'],
  };
  function fail(kind, c) {
    errFlash.set(c, performance.now());
    cv.classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake');
    sErr(); buzz(30); combo = 0; showCombo();
    if (kind === 'early') warnUntil = performance.now() + 1100;
    const t = typeof FAIL_TX[kind] === 'function' ? FAIL_TX[kind]() : FAIL_TX[kind];
    banner('err', t[0], t[1], 1300);
  }
  function leaveCheck(h, c) {
    const len = cur.path.length;
    if (P.arrow[h] >= 0 && c !== P.arrow[h]) return 'arrow';
    if (P.mark[h] && len >= 2) {
      const prev = cur.path[len - 2];
      if (P.partner[h] !== prev) {
        const straight = h - prev === c - h;
        if (P.mark[h] === 1 && straight) return 'turn';
        if (P.mark[h] === 2 && !straight) return 'straight';
      }
    }
    return null;
  }
  function canEnter(c) {
    const h = head();
    if (!P.mask[c] || !walk(h, c) || h === P.end || cur.path.includes(c)) return false;
    if (leaveCheck(h, c)) return false;
    if (P.clueAt[c] && P.clueAt[c] !== nextClue()) return false;
    if (c === P.end && cur.path.length + 1 < P.count) return false;
    if (P.partner[c] >= 0 && cur.path.includes(P.partner[c])) return false;
    return true;
  }
  let teleported = false;
  function tryExtend(c) {
    const h = head();
    if (!gridAdj(h, c) || !P.mask[c] || cur.path.includes(c)) return false;
    if (!walk(h, c)) { fail('wall', c); return false; }
    if (h === P.end) { fail('done', h); return false; }
    const lv = leaveCheck(h, c); if (lv) { fail(lv, h); return false; }
    const cl = P.clueAt[c];
    if (cl && cl !== nextClue()) { fail('order', c); return false; }
    if (c === P.end && cur.path.length + 1 < P.count) { fail('early', c); return false; }
    if (P.partner[c] >= 0 && cur.path.includes(P.partner[c])) { fail('portal', c); return false; }
    const now = performance.now();
    cur.path.push(c); born.set(c, now);
    startClock();
    combo = now - lastAdd < 420 ? combo + 1 : 1; lastAdd = now;
    if (combo > cur.maxCombo) cur.maxCombo = combo;
    showCombo();
    if (cl) { sClue(cl); buzz(14); burst(c, 16); } else { sStep(); buzz(5); }
    if (P.partner[c] >= 0) {
      const p = P.partner[c];
      cur.path.push(p); born.set(p, now + 90);
      sPortal(); buzz([10, 30, 10]); burst(c, 10, PORTAL_COL[P.portalIdx[c]]); setTimeout(() => burst(p, 14, PORTAL_COL[P.portalIdx[c]]), 120);
      teleported = true;
    }
    return true;
  }
  function truncateTo(c) {
    const i = cur.path.indexOf(c);
    if (i < 0 || i === cur.path.length - 1) return false;
    cur.path.length = i + 1;
    // nie zostawiamy głowy w wejściu portalu bez skoku
    const hd = head();
    if (P.partner[hd] >= 0 && cur.path[cur.path.length - 2] !== P.partner[hd]) cur.path.push(P.partner[hd]);
    sBack(); combo = 0; showCombo();
    if (cur.challenge && cur.challenge.type === 'noundo') failChallenge('Cofnięcie nitki');
    return true;
  }
  function changed() {
    computeDead(); updateCover();
    if (cur.path.length === P.count && head() === P.end) win();
    else if (cur.mode !== 'duel') persist();
  }
  function showCombo() {
    const el = $('combo');
    if (combo >= 6) {
      el.textContent = `${combo} z rzędu!`;
      el.classList.add('show', 'bump'); setTimeout(() => el.classList.remove('bump'), 90);
      clearTimeout(comboHide); comboHide = setTimeout(() => el.classList.remove('show'), 750);
    } else el.classList.remove('show');
  }

  // ---------- dotyk ----------
  let dragging = false, strokeStart = null, pid = null;
  function cellAt(e) {
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left - pad, y = e.clientY - r.top - pad;
    let gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    const m = 0.6; // palec tuż poza planszą wciąż trafia w skrajne pole
    if (x < -cell * m || y < -cell * m || x > (P.w + m) * cell || y > (P.h + m) * cell) return { c: -1 };
    gx = Math.max(0, Math.min(P.w - 1, gx)); gy = Math.max(0, Math.min(P.h - 1, gy));
    return { c: gy * P.w + gx, fx: x / cell - gx - 0.5, fy: y / cell - gy - 0.5 };
  }
  function moveToward(target) {
    if (man(head(), target) > 3) return false;
    let guard = 0, any = false;
    outer: while (head() !== target && guard++ < 8) {
      const h = head(), w = P.w;
      const dx = (target % w) - (h % w), dy = ((target / w) | 0) - ((h / w) | 0);
      const xs = dx ? h + Math.sign(dx) : -1, ys = dy ? h + Math.sign(dy) * w : -1;
      const cands = Math.abs(dx) >= Math.abs(dy) ? [xs, ys] : [ys, xs];
      for (const c of cands) {
        if (c < 0) continue;
        if (c === cur.path[cur.path.length - 2]) { if (truncateTo(c)) { any = true; continue outer; } }
        if (canEnter(c) && tryExtend(c)) { any = true; if (teleported) break outer; continue outer; }
      }
      if (Math.abs(dx) + Math.abs(dy) === 1 && !cur.path.includes(target)) tryExtend(target);
      break;
    }
    return any;
  }
  const stage = $('stage');
  stage.addEventListener('pointerdown', (e) => {
    if (!cur || cur.done || cur.locked || hintQueue.length || (pid !== null && dragging)) return;
    e.preventDefault();
    audio();
    const { c } = cellAt(e); if (c < 0 || !P.mask[c]) return;
    pid = e.pointerId; try { stage.setPointerCapture(pid); } catch (er) {}
    dragging = true; strokeStart = cur.path.slice(); teleported = false;
    let ch = false;
    if (cur.path.includes(c)) ch = truncateTo(c);
    else if (gridAdj(head(), c)) ch = moveToward(c);
    if (ch) changed();
  }, { passive: false });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid || cur.done || hintQueue.length) return;
    e.preventDefault();
    const { c, fx: ox, fy: oy } = cellAt(e);
    if (c < 0 || c === head()) { if (c === head()) teleported = false; return; }
    if (teleported) { if (gridAdj(head(), c)) teleported = false; else return; }
    // martwa strefa przy krawędziach pola: ukośne ruchy palca nie przeskakują
    if (gridAdj(head(), c) && Math.max(Math.abs(ox), Math.abs(oy)) > 0.43) return;
    if (moveToward(c)) changed();
  }, { passive: false });
  const endStroke = (e) => {
    if (!dragging || (e && e.pointerId !== pid)) return;
    dragging = false; pid = null;
    if (strokeStart && cur && strokeStart.join() !== cur.path.join()) { cur.history.push(strokeStart); if (cur.history.length > 60) cur.history.shift(); }
    strokeStart = null;
  };
  stage.addEventListener('pointerup', endStroke);
  stage.addEventListener('pointercancel', endStroke);
  stage.addEventListener('lostpointercapture', endStroke);

  // ---------- przyciski ----------
  const HINT_PRICE = 10;
  $('btnUndo').addEventListener('click', () => {
    if (!cur || cur.done || hintQueue.length) return;
    audio();
    if (cur.history.length) cur.path = cur.history.pop();
    else if (cur.path.length > 1) { cur.path.pop(); const hd = head(); if (P.partner[hd] >= 0 && cur.path[cur.path.length - 2] === P.partner[hd]) {} else if (P.partner[hd] >= 0) cur.path.pop(); }
    else return;
    sBack(); combo = 0;
    if (cur.challenge && cur.challenge.type === 'noundo') failChallenge('Użyte cofnięcie');
    changed();
  });
  function restart() {
    if (!cur || cur.done || hintQueue.length || cur.path.length <= 1) return;
    audio();
    cur.history.push(cur.path.slice());
    cur.path = [P.start]; sBack(); combo = 0;
    if (cur.challenge && cur.challenge.type === 'noundo') failChallenge('Plansza od nowa');
    changed();
  }
  $('btnHint').addEventListener('click', () => {
    if (!cur || cur.done || hintQueue.length) return;
    audio();
    if (save.coins < HINT_PRICE) {
      const b = $('btnHint'); b.classList.remove('shake'); void b.offsetWidth;
      sErr(); banner('err', 'Za mało monet', 'Monety dostajesz za gwiazdki, wyzwania i combo'); return;
    }
    const sol = P.sol;
    let p = 0;
    while (p < cur.path.length && cur.path[p] === sol[p]) p++;
    if (p < cur.path.length) { cur.history.push(cur.path.slice()); cur.path.length = Math.max(1, p); }
    const from = cur.path.length;
    let n = 4;
    if (P.partner[sol[from + n - 1]] >= 0 && sol[from + n] === P.partner[sol[from + n - 1]]) n++;
    hintQueue = sol.slice(from, from + n);
    if (!hintQueue.length) return;
    save.coins -= HINT_PRICE; cur.hints++; $('coins').textContent = save.coins;
    if (cur.challenge && cur.challenge.type === 'nohint') failChallenge('Użyta podpowiedź');
    startClock();
    const stepHint = () => {
      const c = hintQueue.shift();
      if (c === undefined) return;
      cur.path.push(c); born.set(c, performance.now()); hinted.set(c, performance.now());
      if (P.clueAt[c]) { sClue(P.clueAt[c]); burst(c, 12); } else tone(noteF(6 + (cur.path.length % 8)), 0.12, 'sine', 0.05);
      changed();
      if (hintQueue.length && !cur.done) hintTimer = setTimeout(stepHint, 120); else hintQueue = [];
    };
    changed(); stepHint();
  });
  function syncSoundBtn() { $('mSoundT').textContent = save.sound ? 'Dźwięk: wł.' : 'Dźwięk: wył.'; }

  // ---------- menu pauzy ----------
  function openMenu() {
    audio();
    if (cur && running && cur.mode !== 'duel') { stopClock(); cur.paused = true; }
    if (cur) updateHud();
    $('mRestart').hidden = !cur || cur.done;
    $('mDaily').hidden = !!(cur && cur.mode === 'duel');
    $('mDuel').querySelector('b').textContent = cur && cur.mode === 'duel' ? 'Opuść pojedynek' : 'Pojedynek';
    $('menu').classList.add('show');
  }
  function closeMenu() {
    $('menu').classList.remove('show');
    if (cur && cur.paused) { cur.paused = false; if (cur.path.length > 1) startClock(); }
  }
  $('btnMenu').addEventListener('click', openMenu);
  $('mResume').addEventListener('click', closeMenu);
  $('mRestart').addEventListener('click', () => { closeMenu(); restart(); });
  $('mSound').addEventListener('click', () => { save.sound = !save.sound; syncSoundBtn(); persist(); if (save.sound) tone(660, 0.12, 'triangle', 0.05); });
  $('mDaily').addEventListener('click', () => {
    if (!cur || hintQueue.length) return;
    $('menu').classList.remove('show'); cur.paused = false; stopClock();
    if (cur.mode === 'daily') backToLevels();
    else { save.slots.level = cur; loadDaily(); }
  });
  $('mShop').addEventListener('click', () => { renderShop(); $('shop').classList.add('show'); });
  $('mDuel').addEventListener('click', () => {
    $('menu').classList.remove('show');
    if (cur && cur.mode === 'duel') { Duel.leave(); return; }
    if (cur && running) { stopClock(); cur.paused = true; }
    Duel.open();
  });
  function backToLevels() {
    const s = save.slots.level;
    if (s && !s.done && s.puzzle && s.puzzle.mask) begin(s, () => banner('info', `Poziom ${s.level}`, 'Wracasz tam, gdzie skończyłeś'));
    else loadLevel(save.level);
  }
  // pełny ekran (Android i komputer; iPhone nie obsługuje go dla stron)
  const fsOk = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (fsOk) $('mFull').hidden = false;
  $('mFull').addEventListener('click', () => {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
  });
  document.addEventListener('fullscreenchange', () => setTimeout(layout, 120));

  // ---------- sklep ----------
  function renderShop() {
    $('shopCoins').textContent = save.coins;
    $('shopGrid').innerHTML = SKINS.map((s) => {
      const own = save.skins.includes(s.id), eq = save.skin === s.id;
      const sw = s.rainbow ? 'class="sw rainbow-anim"' : `class="sw" style="background:linear-gradient(90deg,${(s.cols || WORLD_PAL[0]).join(',')})"`;
      const btn = eq ? '<button class="btn ghost" disabled>Założona</button>'
        : own ? `<button class="btn blue" data-eq="${s.id}">Załóż</button>`
          : `<button class="btn y ${save.coins < s.price ? 'off' : ''}" data-buy="${s.id}">${COIN}${s.price}</button>`;
      return `<div class="skin ${eq ? 'eq' : ''}"><div ${sw}></div><div class="nm">${s.name}</div>${btn}</div>`;
    }).join('');
  }
  $('shopGrid').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    audio();
    if (b.dataset.eq) { save.skin = b.dataset.eq; applySkin(); tone(880, 0.1, 'triangle', 0.05); }
    else if (b.dataset.buy) {
      const s = SKINS.find((x) => x.id === b.dataset.buy);
      if (save.coins < s.price) { sErr(); banner('err', 'Za mało monet', `Brakuje ${s.price - save.coins}`); return; }
      save.coins -= s.price; save.skins.push(s.id); save.skin = s.id; applySkin(); sCoin(); buzz(20);
      const r = b.getBoundingClientRect(); confettiAt(r.left + r.width / 2, r.top, 50);
    }
    persist(true); renderShop(); $('coins').textContent = save.coins;
  });
  $('btnShopClose').addEventListener('click', () => { $('shop').classList.remove('show'); updateHud(); });

  // ---------- wygrana ----------
  const WIN_WORDS = ['Ułożone!', 'Pięknie!', 'Czysto!', 'Gładko!', 'Ekstra!', 'Tak jest!', 'Mistrzowsko!'];
  function win() {
    if (cur.mode === 'duel') { stopClock(); cur.done = true; winT = performance.now(); sWin(); buzz([20, 40, 20]); confetti(); Duel.finished(cur.elapsed); return; }
    stopClock(); cur.done = true; winT = performance.now();
    const t = cur.elapsed, stars = starsFor(t, cur.hints);
    const badges = [];
    let coins = 0;
    sWin(); buzz([20, 40, 20]); confetti();
    const ch = cur.challenge;
    if (ch && !ch.failed && ch.type === 'time' && t > ch.limit) ch.failed = true;
    if (ch && !ch.failed) { ch.done = true; coins += 15; badges.push(['Wyzwanie zaliczone', 'good']); }
    if (cur.mode === 'level') {
      const sizeKey = `${P.w}x${P.h}`, prevBest = save.best[sizeKey];
      if (!cur.hints && (!prevBest || t < prevBest)) { save.best[sizeKey] = t; if (prevBest) badges.push(['Rekord ' + P.w + '×' + P.h, 'hot']); }
      const lk = String(cur.level), prevStars = save.stars[lk] || 0;
      if (stars > prevStars) { save.stars[lk] = stars; coins += (stars - prevStars) * 5; }
      if (!cur.replay) {
        save.solved++;
        save.streak = cur.hints ? 0 : save.streak + 1;
        save.bestStreak = Math.max(save.bestStreak, save.streak);
        if (save.streak >= 2) badges.push([`Seria ${save.streak}`, 'hot']);
        coins += Math.floor(cur.maxCombo / 8);
        if (cur.boss) { coins += 30; badges.push(['Boss pokonany', 'hot']); }
        save.level = cur.level + 1;
      } else if (stars > prevStars) badges.push(['Poprawione gwiazdki', 'good']);
      if (cur.hints) badges.push([cur.hints === 1 ? '1 podpowiedź' : `${cur.hints} podpowiedzi`, '']);
      save.last = { level: cur.level, puzzle: cur.puzzle, boss: cur.boss };
      save.slots.level = null;
      prefetchLevel(save.level);
    } else {
      const d = cur.date, prev = save.daily.results[d];
      if (!prev) coins += 20;
      if (!prev || t < prev.time) save.daily.results[d] = { time: t, stars, hints: cur.hints };
      if (save.daily.lastDate !== d) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        save.daily.streak = save.daily.lastDate === dstr(y) ? save.daily.streak + 1 : 1;
        save.daily.lastDate = d;
      }
      badges.push([`Dni z rzędu: ${save.daily.streak}`, 'hot']);
      if (prev && t < prev.time) badges.push(['Lepszy czas', 'good']);
      save.slots.daily = null;
    }
    if (cur.maxCombo > save.maxCombo) { save.maxCombo = cur.maxCombo; if (cur.maxCombo >= 10) badges.push([`Rekord combo ${cur.maxCombo}`, 'hot']); }
    save.coins += coins;
    persist(true);
    updateHud();
    setTimeout(() => showWin(stars, t, coins, badges), 1150);
  }
  function showWin(stars, t, coins, badges) {
    const daily = cur.mode === 'daily';
    const wo = daily ? null : G.worldOf(cur.level);
    $('winKick').textContent = daily ? `Dzienna · ${cur.date.slice(8, 10)}.${cur.date.slice(5, 7)}` : `Świat ${wo.index + 1} · Poziom ${cur.level}`;
    $('winTitle').textContent = daily ? 'Dzienna ułożona!' : cur.boss ? 'Boss pokonany!' : WIN_WORDS[(Math.random() * WIN_WORDS.length) | 0];
    const ws = $('winStars'); ws.innerHTML = STAR.repeat(3);
    const par = parOf();
    $('winStats').innerHTML =
      `<div class="stat y" style="animation-delay:.9s"><div class="h">Monety</div><div class="v">${COIN}+${coins}</div></div>` +
      `<div class="stat ${t <= par ? 'g' : 'b'}" style="animation-delay:1s"><div class="h">${t <= par ? 'Szybko!' : 'Czas'}</div><div class="v">${fmt(t)}</div></div>` +
      `<div class="stat p" style="animation-delay:1.1s"><div class="h">Combo</div><div class="v">${cur.maxCombo}</div></div>`;
    $('winBadges').innerHTML = badges.map(([b, cls], i) => `<span class="badge ${cls}" style="animation-delay:${1.25 + i * 0.12}s">${b}</span>`).join('') +
      (stars < 3 ? `<span class="badge" style="animation-delay:${1.25 + badges.length * 0.12}s">3★: do ${fmt(par)} bez podpowiedzi</span>` : '');
    $('btnRetry').style.display = stars < 3 ? '' : 'none';
    $('btnRetry').textContent = 'Popraw';
    $('btnNext').textContent = daily ? 'Do poziomów' : 'Dalej';
    $('win').classList.add('show');
    [...ws.children].forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sStar(i); buzz(10); }, 380 + i * 260); });
    if (coins) setTimeout(sCoin, 1000);
  }
  $('btnNext').addEventListener('click', () => {
    $('win').classList.remove('show');
    if (cur.mode === 'daily') backToLevels(); else loadLevel(save.level);
  });
  $('btnRetry').addEventListener('click', () => {
    $('win').classList.remove('show');
    const pz = cur.puzzle;
    if (cur.mode === 'daily') begin({ mode: 'daily', date: cur.date, puzzle: pz, path: [pz.clues[0]], elapsed: 0, hints: 0, history: [] }, () => banner('info', 'Jeszcze raz', 'Pobij swój czas'));
    else {
      const st = { mode: 'level', level: cur.level, puzzle: pz, path: [pz.clues[0]], elapsed: 0, hints: 0, history: [], replay: true, boss: cur.boss };
      begin(st, () => banner('info', 'Jeszcze raz', `3★: do ${fmt(parOf())} bez podpowiedzi`));
    }
  });

  // ---------- efekty ----------
  const parts = [];
  function boardToPage(x, y) { const r = cv.getBoundingClientRect(); return [r.left + x, r.top + y]; }
  function burst(c, count, col) {
    const [x, y] = boardToPage(cx(c), cy(c));
    col = col || colorAt(cur.path.length / (P.count - 1));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.08, life: 1, dec: 0.025 + Math.random() * 0.02, s: 3 + Math.random() * 4, col: rgba(col), rot: 0, vr: 0, sq: false });
    }
  }
  function confettiAt(x0, y0, n, spread) {
    const cols = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'].concat(pal.map((c) => rgba(c)));
    for (let i = 0; i < n; i++) {
      const x = x0 + (Math.random() - 0.5) * (spread || 40), y = y0;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 7 + Math.random() * 10;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.32, life: 1, dec: 0.006 + Math.random() * 0.006, s: 6 + Math.random() * 6, col: cols[(Math.random() * cols.length) | 0], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, sq: true });
    }
  }
  function confetti() { const r = cv.getBoundingClientRect(); confettiAt(r.left + r.width / 2, r.top + r.height * 0.6, cur.boss ? 260 : 170, r.width); }
  function drawFx() {
    fx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; p.life -= p.dec; p.rot += p.vr;
      if (p.life <= 0 || p.y > innerHeight + 40) { parts.splice(i, 1); continue; }
      fx.globalAlpha = Math.min(1, p.life * 1.5); fx.fillStyle = p.col;
      if (p.sq) { fx.save(); fx.translate(p.x, p.y); fx.rotate(p.rot); fx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fx.restore(); }
      else { fx.beginPath(); fx.arc(p.x, p.y, p.s * p.life, 0, 7); fx.fill(); }
    }
    fx.globalAlpha = 1;
  }

  // ---------- rysowanie planszy ----------
  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  let hatch = null;
  function hatchPattern() {
    if (hatch) return hatch;
    const c = document.createElement('canvas'); c.width = c.height = 12;
    const g = c.getContext('2d'); g.strokeStyle = 'rgba(255,75,75,.6)'; g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(-2, 14); g.lineTo(14, -2); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(10, 14); g.lineTo(14, 10); g.stroke();
    return (hatch = ctx.createPattern(c, 'repeat'));
  }
  function chevron(x, y, dx, dy, s, col, lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const px = -dy, py = dx;
    ctx.beginPath();
    ctx.moveTo(x - dx * s * 0.5 + px * s * 0.75, y - dy * s * 0.5 + py * s * 0.75);
    ctx.lineTo(x + dx * s * 0.55, y + dy * s * 0.55);
    ctx.lineTo(x - dx * s * 0.5 - px * s * 0.75, y - dy * s * 0.5 - py * s * 0.75);
    ctx.stroke();
  }
  function draw(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, S.w, S.h);
    if (!P) return;
    const w = P.w, T = P.count, path = cur.path, len = path.length;
    const idxOf = new Int32Array(P.N).fill(-1); path.forEach((c, i) => { idxOf[c] = i; });
    const gap = Math.max(2, cell * 0.08), r = cell * 0.2, d = Math.max(2.5, cell * 0.075);
    const warn = now < warnUntil, tn = (i) => i / Math.max(1, T - 1);

    // kafelki (wypukłe, z twardym cieniem pod spodem)
    for (let c = 0; c < P.N; c++) {
      if (!P.mask[c]) continue;
      const x = pad + (c % w) * cell + gap / 2, y = pad + ((c / w) | 0) * cell + gap / 2, s = cell - gap;
      const i = idxOf[c];
      let top = [255, 255, 255], bot = [229, 229, 229];
      if (i >= 0) { const col = colorAt(tn(i), i); top = mixW(col, 0.72); bot = mixW(col, 0.45); }
      const lift = i >= 0 ? d * 0.5 : 0; // zakryte pola "wciśnięte"
      rr(x, y + lift, s, s - lift, r); ctx.fillStyle = rgba(bot); ctx.fill();
      rr(x, y + lift, s, s - d, r); ctx.fillStyle = rgba(top); ctx.fill();
      if (i < 0) {
        ctx.lineWidth = 2; ctx.strokeStyle = '#E5E5E5'; rr(x + 1, y + 1, s - 2, s - d - 1, r); ctx.stroke();
        if (dead.has(c)) { rr(x, y, s, s - d, r); ctx.fillStyle = 'rgba(255,75,75,.1)'; ctx.fill(); ctx.fillStyle = hatchPattern(); ctx.fill(); }
        if (warn) { rr(x, y, s, s - d, r); ctx.strokeStyle = `rgba(255,150,0,${0.5 + 0.5 * Math.sin(now / 70)})`; ctx.lineWidth = 3.5; ctx.stroke(); }
      }
      const ef = errFlash.get(c);
      if (ef && now - ef < 450) { rr(x, y, s, s - d, r); ctx.fillStyle = `rgba(255,75,75,${0.6 * (1 - (now - ef) / 450)})`; ctx.fill(); }
      const ht = hinted.get(c);
      if (ht && now - ht < 900) { rr(x, y, s, s - d, r); ctx.strokeStyle = `rgba(255,200,0,${1 - (now - ht) / 900})`; ctx.lineWidth = 4; ctx.stroke(); }
    }
    const yOff = -d * 0.5; // środek górnej powierzchni kafla

    // ściany
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(5, cell * 0.12);
    for (const [a, b] of cur.puzzle.walls) {
      const ax = cx(a), ay = cy(a), bx = cx(b), by = cy(b), mx = (ax + bx) / 2, my = (ay + by) / 2 + yOff;
      const half = cell * 0.46;
      ctx.beginPath();
      if (ay === by) { ctx.moveTo(mx, my - half); ctx.lineTo(mx, my + half); } else { ctx.moveTo(mx - half, my); ctx.lineTo(mx + half, my); }
      ctx.stroke();
    }

    // portale (pod nitką)
    cur.puzzle.portals.forEach(([a, b], pi) => {
      const col = PORTAL_COL[pi % 2];
      for (const c of [a, b]) {
        const x = cx(c), y = cy(c) + yOff, R = cell * 0.36;
        ctx.save(); ctx.translate(x, y); ctx.rotate((now / 900) * (pi ? -1 : 1));
        ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = rgba(col, idxOf[c] >= 0 ? 0.25 : 0.18); ctx.fill();
        ctx.setLineDash([R * 0.5, R * 0.32]); ctx.lineWidth = Math.max(3, cell * 0.075); ctx.strokeStyle = rgba(col); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, 7); ctx.fillStyle = rgba(col, 0.9); ctx.fill();
        ctx.restore();
      }
    });

    // nitka
    const W = cell * 0.42;
    const winP = winT ? (now - winT) / 16 : -99;
    const pts = path.map((c) => [cx(c), cy(c) + yOff]);
    const jumpAt = (i) => P.partner[path[i]] === path[i - 1] && !gridAdj(path[i], path[i - 1]);
    if (len > 1) {
      const lb = born.get(path[len - 1]), gp = lb ? Math.max(0, Math.min(1, (now - lb) / 85)) : 1;
      if (!jumpAt(len - 1)) {
        const e = 1 - Math.pow(1 - gp, 3);
        pts[len - 1] = [pts[len - 2][0] + (pts[len - 1][0] - pts[len - 2][0]) * e, pts[len - 2][1] + (pts[len - 1][1] - pts[len - 2][1]) * e];
      }
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const seg = (i, width, style, dy) => {
        if (jumpAt(i)) return;
        ctx.strokeStyle = style; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1] + dy); ctx.lineTo(pts[i][0], pts[i][1] + dy); ctx.stroke();
      };
      if (skin.glow || combo >= 8) {
        ctx.save(); ctx.shadowBlur = skin.glow ? 16 : Math.min(18, combo); ctx.shadowColor = rgba(colorAt(tn(len - 1), len - 1));
        for (let i = 1; i < len; i++) seg(i, W, rgba(colorAt(tn(i), i), 0.6), 0);
        ctx.restore();
      }
      for (let i = 1; i < len; i++) seg(i, W, rgba(shade(colorAt(tn(i), i), 0.78)), W * 0.2);
      for (let i = 1; i < len; i++) {
        const wave = winT ? 1 + 0.45 * Math.exp(-Math.pow((i - winP) / 2.5, 2)) : 1;
        seg(i, W * wave, rgba(colorAt(tn(i), i)), 0);
      }
      for (let i = 1; i < len; i++) seg(i, W * 0.22, 'rgba(255,255,255,.4)', -W * 0.16);
      if (skin.sparkle && Math.random() < 0.15) { const c = path[(Math.random() * len) | 0]; burst(c, 1, [255, 255, 255]); }
    }

    // znaczniki zakrętu/prosto i strzałki (nad nitką, żeby było widać)
    const mR = cell * 0.15;
    for (const [c, t] of cur.puzzle.markers) {
      const x = cx(c), y = cy(c) + yOff, on = idxOf[c] >= 0;
      ctx.beginPath(); ctx.arc(x, y + 2, mR, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, mR, 0, 7);
      if (t === 1) { ctx.fillStyle = on ? '#fff' : INK; ctx.fill(); if (on) { ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, mR * 0.5, 0, 7); ctx.fillStyle = INK; ctx.fill(); } }
      else { ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = Math.max(3, cell * 0.06); ctx.strokeStyle = INK; ctx.stroke(); }
    }
    for (const [c, to] of cur.puzzle.arrows) {
      const x = cx(c), y = cy(c) + yOff, dx = Math.sign((to % w) - (c % w)), dy = Math.sign(((to / w) | 0) - ((c / w) | 0));
      const on = idxOf[c] >= 0;
      if (!on) chevron(x, y + 2, dx, dy, cell * 0.2, 'rgba(0,0,0,.15)', Math.max(4, cell * 0.09));
      chevron(x, y, dx, dy, cell * 0.2, on ? '#fff' : INK, Math.max(4, cell * 0.09));
    }

    // cyfry
    const nx = nextClue(), R = cell * 0.3;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 1; k <= P.K; k++) {
      const c = cur.puzzle.clues[k - 1], x = cx(c), y = cy(c) + yOff, i = idxOf[c];
      const reached = i >= 0;
      let sc = 1;
      if (reached) { const b = born.get(c); if (b) { const t = (now - b) / 380; if (t > 0 && t < 1) sc = 1 + 0.45 * Math.sin(t * Math.PI) * (1 - t); } }
      if (winT) sc *= 1 + 0.25 * Math.exp(-Math.pow((i - winP) / 2.5, 2));
      if (!reached && k === nx && !cur.done) {
        const ph = (now % 1300) / 1300;
        ctx.beginPath(); ctx.arc(x, y, R * (1 + ph * 0.9), 0, 7);
        ctx.strokeStyle = rgba(colorAt(tn(len), len), 0.85 * (1 - ph)); ctx.lineWidth = 3.5; ctx.stroke();
      }
      const col = reached ? colorAt(tn(i), i) : null;
      ctx.beginPath(); ctx.arc(x, y + R * 0.16, R * sc, 0, 7); ctx.fillStyle = reached ? rgba(shade(col, 0.72)) : INK_D; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, R * sc, 0, 7); ctx.fillStyle = reached ? rgba(shade(col, 0.92)) : INK; ctx.fill();
      if (k === P.K) {
        ctx.beginPath(); ctx.arc(x, y, R * sc + Math.max(3.5, R * 0.24), 0, 7);
        ctx.strokeStyle = reached ? rgba(colorAt(1, T)) : INK; ctx.lineWidth = 2.5; ctx.setLineDash([3.5, 3.5]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.round(R * 1.1 * sc)}px Nunito, system-ui, sans-serif`;
      ctx.fillText(String(k), x, y + R * 0.07);
    }

    // głowa nitki
    if (len >= 1 && !cur.done) {
      const [hx, hy] = pts[len - 1];
      const col = colorAt(tn(len - 1), len - 1);
      const ph = (now % 1100) / 1100;
      if (combo >= 6) { ctx.beginPath(); ctx.arc(hx, hy, W * (0.9 + Math.min(1, combo / 25) * 0.8), 0, 7); ctx.fillStyle = `rgba(255,200,0,${0.25 + 0.15 * Math.sin(now / 60)})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(hx, hy, W * (0.62 + ph * 0.7), 0, 7); ctx.strokeStyle = rgba(col, 0.6 * (1 - ph)); ctx.lineWidth = 3; ctx.stroke();
      if (!P.clueAt[path[len - 1]]) {
        ctx.beginPath(); ctx.arc(hx, hy + W * 0.12, W * 0.62, 0, 7); ctx.fillStyle = rgba(shade(col, 0.75)); ctx.fill();
        ctx.beginPath(); ctx.arc(hx, hy, W * 0.62, 0, 7); ctx.fillStyle = rgba(col); ctx.fill();
        ctx.beginPath(); ctx.arc(hx, hy, W * 0.24, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      }
    }
  }

  // ---------- pętla ----------
  function frame(now) {
    NOW = now;
    if (cur) {
      if (running) {
        const t = elapsed();
        $('time').textContent = fmt(t);
        const st = starsFor(t, cur.hints);
        if (st !== lastStars) { if (st < lastStars) tone(200, 0.2, 'sine', 0.04, 0, 0.7); lastStars = st; renderLiveStars(st); }
        const ch = cur.challenge;
        if (ch && ch.type === 'time' && !ch.failed) {
          $('time').classList.toggle('over', t > ch.limit * 0.8);
          if (t > ch.limit) failChallenge('Czas minął');
        }
      }
      draw(now);
    }
    drawFx();
    requestAnimationFrame(frame);
  }

  // ---------- QR na komputerze ----------
  async function maybeQr() {
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || innerWidth < 760) return;
    try {
      const info = await fetch('api/info').then((r) => r.json());
      const url = (info.urls || []).find((u) => u.startsWith('https://'));
      if (!url) { setTimeout(maybeQr, 3000); return; }
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
      $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      $('qrcard').classList.add('show');
    } catch (e) {}
  }
  $('qrClose').addEventListener('click', () => $('qrcard').classList.remove('show'));

  // ---------- pojedynek ----------
  const Duel = (() => {
    let code = null, me = null, room = null, round = 0, poll = 0, offset = 0, size = 'normal', state = 'idle', busy = false;
    const rewarded = {};
    const api = (path, body) => fetch(DUEL_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Brak połączenia'); return j; });
    const pane = (id) => ['dSetup', 'dWait', 'dResult'].forEach((p) => { $(p).hidden = p !== id; });
    const opp = () => room && room.players.find((p) => p.id !== me);
    const mine = () => room && room.players.find((p) => p.id === me);
    const link = () => `${location.origin}${location.pathname}?duel=${code}`;
    function nick() { const n = $('dName').value.trim() || save.nick || 'Gracz'; save.nick = n; persist(); return n; }
    function stopPoll() { clearInterval(poll); poll = 0; }
    function startPoll(ms) { stopPoll(); poll = setInterval(tick, ms); }
    function open(prefill) {
      audio();
      if (!DUEL_BASE) {
        banner('info', 'Pojedynek jeszcze offline', 'W wersji z GitHuba pojedynek wymaga serwera, który dopiero podłączymy', 3500);
        if (cur && cur.paused) { cur.paused = false; if (cur.path.length > 1) startClock(); }
        return;
      }
      $('dName').value = save.nick || '';
      if (prefill) $('dCode').value = prefill;
      if (state === 'wait') pane('dWait');
      else if (state === 'result') pane('dResult');
      else { pane('dSetup'); $('dRematch').hidden = true; $('dLeave').textContent = 'Zamknij'; }
      $('duel').classList.add('show');
    }
    $('dSize').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      size = b.dataset.size;
      [...$('dSize').children].forEach((x) => x.classList.toggle('on', x === b));
    });
    $('dCreate').addEventListener('click', async () => {
      if (busy) return; busy = true;
      try {
        const r = await api('new', { name: nick(), size });
        me = r.me; code = r.room.code; round = 0; state = 'wait';
        save.duelSess = { code, me }; persist();
        $('dCodeBig').textContent = code; pane('dWait'); $('dLeave').textContent = 'Anuluj';
        onRoom(r.room); startPoll(1000);
      } catch (e) { banner('err', 'Nie udało się założyć pokoju', e.message); }
      busy = false;
    });
    async function join(c) {
      if (busy) return; busy = true;
      c = (c || $('dCode').value).trim().toUpperCase();
      try {
        const prev = save.duelSess && save.duelSess.code === c ? save.duelSess.me : undefined;
        const r = await api('join', { code: c, name: nick(), me: prev });
        me = r.me; code = c; round = 0; state = 'wait';
        save.duelSess = { code, me }; persist();
        $('dCodeBig').textContent = code; pane('dWait'); $('dLeave').textContent = 'Anuluj';
        onRoom(r.room); startPoll(1000);
      } catch (e) { sErr(); banner('err', 'Nie da się dołączyć', e.message); }
      busy = false;
    }
    $('dJoin').addEventListener('click', () => join());
    $('dCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
    $('dShare').addEventListener('click', async () => {
      const url = link();
      try {
        if (navigator.share) { await navigator.share({ title: 'Nitka: pojedynek', text: `Zagrajmy w Nitkę! Kod pokoju: ${code}`, url }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); banner('ok', 'Link skopiowany', 'Wklej go w wiadomości'); }
      catch (e) { banner('info', 'Kod pokoju: ' + code, url, 4000); }
    });
    async function tick() {
      if (!code) return;
      const playing = state === 'play' && cur && cur.mode === 'duel' && !cur.done;
      try {
        const r = await api('progress', { code, me, round, pct: playing ? cur.path.length / P.count : undefined });
        onRoom(r.room);
      } catch (e) { /* chwilowy brak sieci: spróbujemy przy następnym tyknięciu */ }
    }
    function onRoom(r) {
      room = r; offset = r.now - Date.now();
      if (r.round > round && r.puzzle) return startRound(r);
      if (state === 'play') {
        updateOpp();
        const o = opp();
        if (r.winner && r.winner !== me && cur && !cur.done) lost();
        else if (o && o.gone && !cur.done) banner('info', 'Rywal się rozłączył', 'Możesz dokończyć planszę', 2500);
      } else if (state === 'result') renderResult();
    }
    function updateOpp() {
      const o = opp(), m = mine();
      $('oppName').textContent = o ? o.name : 'Rywal';
      $('oppFill').style.width = o ? (o.pct * 100).toFixed(1) + '%' : '0%';
      $('oppScore').textContent = `${m ? m.wins : 0} : ${o ? o.wins : 0}`;
    }
    function startRound(r) {
      round = r.round; state = 'play';
      ['duel', 'win', 'menu', 'shop'].forEach((id) => $(id).classList.remove('show'));
      if (cur && cur.mode !== 'duel' && running) { stopClock(); }
      const st = { mode: 'duel', round, puzzle: r.puzzle, path: [r.puzzle.clues[0]], elapsed: 0, hints: 0, history: [], locked: true };
      begin(st);
      $('liveStars').style.visibility = 'hidden';
      updateOpp();
      startPoll(400);
      const localStart = r.startAt - offset;
      let lastN = -1;
      const el = $('count');
      el.classList.add('show');
      const cd = () => {
        if (!cur || cur !== st) { el.classList.remove('show'); return; }
        const left = localStart - Date.now();
        if (left <= 0) {
          el.innerHTML = '<span>Start!</span>'; tone(988, 0.25, 'triangle', 0.07); buzz(40);
          st.locked = false; startClock();
          setTimeout(() => el.classList.remove('show'), 450);
          return;
        }
        const n = Math.ceil(left / 1000);
        if (n !== lastN && n <= 3) { lastN = n; el.innerHTML = `<span>${n}</span>`; tone(523, 0.15, 'triangle', 0.06); buzz(15); }
        else if (n > 3 && lastN !== 99) { lastN = 99; el.innerHTML = '<span style="font-size:40px">Przygotuj się</span>'; }
        setTimeout(cd, 50);
      };
      cd();
    }
    async function finished(time) {
      state = 'sending';
      for (let i = 0; i < 5; i++) {
        try { const r = await api('progress', { code, me, round, pct: 1, done: true, time }); room = r.room; break; } catch (e) { await new Promise((res) => setTimeout(res, 600)); }
      }
      updateOpp();
      setTimeout(showResult, 1000);
    }
    function lost() {
      cur.done = true; stopClock(); sErr(); buzz([40, 60, 40]);
      cv.classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake');
      setTimeout(showResult, 700);
    }
    function showResult() {
      state = 'result';
      startPoll(1000);
      $('dRematch').hidden = false; $('dLeave').textContent = 'Wyjdź';
      pane('dResult'); renderResult();
      $('duel').classList.add('show');
      const won = room.winner === me;
      if (won && !rewarded[code + round]) {
        rewarded[code + round] = true;
        save.coins += 25; save.duelWins = (save.duelWins || 0) + 1; persist(true);
        $('dRBadges').innerHTML = '<span class="badge hot">+25 monet</span>';
        sCoin();
      } else if (!won) $('dRBadges').innerHTML = '';
    }
    function renderResult() {
      if (!room) return;
      const won = room.winner === me, m = mine(), o = opp();
      $('dRKick').textContent = `Runda ${round}`;
      $('dRTitle').textContent = won ? 'Wygrana!' : room.winner ? 'Rywal szybszy' : 'Koniec rundy';
      $('dRTitle').className = won ? '' : 'lose';
      $('dRScore').textContent = `${m ? m.wins : 0} : ${o ? o.wins : 0}`;
      $('dRRows').innerHTML = [m, o].filter(Boolean).map((p) =>
        `<div class="drow ${room.winner === p.id ? 'win' : ''}"><span>${p.id === me ? 'Ty' : esc(p.name)}</span><span class="t">${p.done ? fmt(p.time) : Math.floor(p.pct * 100) + '%'}</span></div>`).join('');
      const w = $('dRWait'), t = $('dRWaitT');
      if (o && o.gone) { w.hidden = false; t.textContent = 'Rywal wyszedł z pokoju'; }
      else if (m && m.ready) { w.hidden = false; t.textContent = 'Czekam, aż rywal kliknie rewanż'; }
      else if (o && o.ready) { w.hidden = false; t.textContent = `${o.name} chce rewanżu!`; }
      else w.hidden = true;
    }
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    $('dRematch').addEventListener('click', async () => {
      audio();
      try { const r = await api('rematch', { code, me }); onRoom(r.room); renderResult(); } catch (e) { banner('err', 'Brak połączenia', e.message); }
    });
    function leave() {
      if (code && me) api('leave', { code, me }).catch(() => {});
      stopPoll(); code = null; me = null; room = null; round = 0; state = 'idle';
      save.duelSess = null; persist();
      $('duel').classList.remove('show'); $('count').classList.remove('show');
      $('liveStars').style.visibility = '';
      if (cur && cur.mode === 'duel') backToLevels();
      else if (cur && cur.paused) { cur.paused = false; if (cur.path.length > 1) startClock(); }
    }
    $('dLeave').addEventListener('click', leave);
    return { open, finished, leave, get active() { return state !== 'idle'; } };
  })();

  // ---------- start ----------
  async function boot() {
    const local = loadLocal();
    if (local) save = Object.assign(freshSave(), local);
    if (!STATIC) try {
      const remote = await Promise.race([fetch('api/save').then((r) => r.json()), new Promise((res) => setTimeout(() => res(null), 1500))]);
      const m = migrate(remote);
      if (m && m.updated > (save.updated || 0)) save = Object.assign(freshSave(), m);
    } catch (e) {}
    applySkin(); syncSoundBtn(); layout();
    requestAnimationFrame(frame);
    const valid = (s) => s && !s.done && s.puzzle && s.puzzle.mask;
    const dslot = save.slots.daily;
    if (save.mode === 'daily' && valid(dslot) && dslot.date === today()) begin(dslot, () => banner('info', 'Dzienna łamigłówka', 'Wracasz tam, gdzie skończyłeś'));
    else if (valid(save.slots.level)) { const s = save.slots.level; begin(s, () => banner('info', `Poziom ${s.level}`, 'Wracasz tam, gdzie skończyłeś')); prefetchLevel(s.level + 1); }
    else await loadLevel(save.level);
    maybeQr();
    const dq = new URLSearchParams(location.search).get('duel');
    if (dq) { history.replaceState(null, '', location.pathname); if (cur && running) { stopClock(); cur.paused = true; } Duel.open(dq.toUpperCase()); }
    window.__nitka = { get cur() { return cur; }, get P() { return P; }, save: () => save, solve: () => { cur.path = P.sol.slice(); changed(); }, go: (l) => { save.level = l; save.slots.level = null; loadLevel(l); } };
  }
  boot();
})();
