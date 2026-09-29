// The TV's games, drawn in a canvas the TV shows (its texture). A home screen to pick one, and two, in the dark isometric manner of
// the old action RPGs (our own drawing and names, none of Blizzard's):
// - a boss run: you start at the arena's near end, run and teleport up to the Lord of Hate on his dais, dodge his blood bolts, freeze
//   him down with frost orbs; he bursts, the loot flies out with its names in the colours of their rarity, you run over it to pick it
//   up. The loot has stats (cold damage, cast rate, teleport, life, mana, luck with loot, resistance, run speed): what you wear makes
//   the next run quicker and luckier. An inventory (a figure with its slots and a backpack); runes work from the backpack; a set of
//   four with bonuses; potions. It all keeps in this browser (localStorage).
// - a duel for two visitors of the page, over the ghosts' connection (see ghosts.js): both at the TV, both pick it, first to three.
//   Each side is the judge of its own figure: it moves itself, fires its own orbs, and takes the hits of the other's orbs as they reach
//   it here (so a hit is never argued about by lag). Everything that comes from the other side is checked and clamped.
// Input each frame: { x, y } the move (-1..1, the pad's left stick or WASD), edges: tele (A / Space), start (Start / Enter), back
// (handled by the caller, through closeOverlay), inv (Y / I), potion (LB / Q), drop (X / X), up, down, left, right; held: teleHeld,
// cast (X / J); dev: 'pad' or 'keys', the one last used (the controls on the screen are drawn for it, so a pad's A is never taken for
// the key A, which runs left).

export function createTVGame({ THREE }) {
  const W = 960, H = 540, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.round(rnd(a, b)), pick = a => a[Math.random() * a.length | 0];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const TW = 64, TH = 32, AW = 17, AH = 13;                           // the tile, the arena in tiles
  const iso = (x, y) => [(x - y) * TW / 2, (x + y) * TH / 2];
  const START = [AW - 2.5, AH - 2.5], FAR = [3, 3];                    // you come in at the near corner (the bottom of the screen); he waits at the far one (the top)
  let dev = 'keys', state = 'menu', sel = 0, t = 0, runT = 0, found = [], msg = null, net = null;
  const pl = { x: START[0], y: START[1], hp: 100, mp: 100, cd: 0, cast: 0, face: [-.7, -.7], moving: 0, flash: 0, hurt: 0, heal: 0, alive: true };
  const boss = { x: FAR[0], y: FAR[1], hp: 150, max: 150, cd: 1.5, hit: 0, dead: false, burst: 0 };
  let shots = [], fshots = [], bolts = [], loot = [], sparks = [], trail = [];
  const floor = Array.from({ length: AW * AH }, () => ({ l: rnd(.75, 1.1), crack: Math.random() < .12, blood: Math.random() < .06 }));
  const pillars = [[4.5, 8.5], [9, 3], [11, 10.5], [15, 6.5], [7.5, 6]];
  const braziers = [[1.2, 6], [6.5, 1.2], [12.5, 12], [16, 9.5]];

  // ---------- what you have: kept in this browser ----------
  const KEY = 'aw.tvgame.v1';
  const SAVE = (() => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.bag) && s.eq && typeof s.eq === 'object') return s; } catch {} return null; })()
    || { gold: 0, runs: 0, kills: 0, pot: 3, wins: 0, bag: [], eq: {} };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch {} };

  // ---------- the loot ----------
  const COL = { gold: '#e8c65a', potion: '#e8e0d8', magic: '#7b8cff', rare: '#f5e25a', set: '#39d34b', unique: '#c7a36a', rune: '#f08a2a' };
  const BASES = { helm: ['Hełm', 'Kaptur', 'Diadem'], amulet: ['Amulet', 'Talizman'], weapon: ['Kostur', 'Różdżka', 'Laska'], armor: ['Szata', 'Kolczuga', 'Płaszcz'],
    gloves: ['Rękawice'], ring: ['Pierścień', 'Sygnet'], belt: ['Pas'], boots: ['Buty', 'Trzewiki'] };
  const AFF = [{ k: 'dmg', n: 'Mrozu', lo: 8, hi: 25 }, { k: 'fcr', n: 'Szybkości', lo: 8, hi: 20 }, { k: 'ftp', n: 'Wiatru', lo: 10, hi: 30 }, { k: 'life', n: 'Życia', lo: 10, hi: 35 },
    { k: 'mana', n: 'Umysłu', lo: 10, hi: 35 }, { k: 'mf', n: 'Szczęścia', lo: 10, hi: 35 }, { k: 'res', n: 'Ochrony', lo: 4, hi: 12 }, { k: 'reg', n: 'Skupienia', lo: 15, hi: 50 }, { k: 'run', n: 'Pośpiechu', lo: 5, hi: 15 }];
  const STAT = { dmg: v => `+${v}% obrażeń od zimna`, fcr: v => `+${v}% szybkości rzucania`, ftp: v => `+${v}% szybkości teleportu`, life: v => `+${v} do życia`, mana: v => `+${v} do many`,
    mf: v => `+${v}% szczęścia do przedmiotów`, res: v => `${v}% odporności`, reg: v => `+${v}% regeneracji many`, run: v => `+${v}% szybkości biegu` };
  const ORDER = Object.keys(STAT);
  const RA = ['Szept', 'Pazur', 'Oko', 'Krąg', 'Cień', 'Znak', 'Kieł', 'Echo'], RB = ['Burzy', 'Zmierzchu', 'Otchłani', 'Popiołu', 'Szronu', 'Nocy', 'Wilka', 'Gwiazd'];
  const UNIQ = [{ slot: 'helm', name: 'Korona Nocy', base: 'Diadem', st: { mf: 40, mana: 25, res: 10 } }, { slot: 'weapon', name: 'Kostur Mrozu', base: 'Kostur', st: { dmg: 60, fcr: 20, mana: 30 } },
    { slot: 'ring', name: 'Pierścień Wiecznego Płomienia', base: 'Pierścień', st: { fcr: 10, dmg: 15, life: 20 } }, { slot: 'armor', name: 'Szata Strażnika', base: 'Szata', st: { res: 20, life: 40 } },
    { slot: 'boots', name: 'Buty Wiatru', base: 'Buty', st: { run: 20, ftp: 25, mf: 15 } }, { slot: 'amulet', name: 'Oko Czarnoksiężnika', base: 'Amulet', st: { fcr: 20, dmg: 20, mf: 20 } }];
  const SETP = [{ slot: 'helm', name: 'Kaptur Wędrowca', base: 'Kaptur', st: { ftp: 15, life: 15 } }, { slot: 'armor', name: 'Płaszcz Wędrowca', base: 'Płaszcz', st: { res: 8, mana: 20 } },
    { slot: 'boots', name: 'Buty Wędrowca', base: 'Buty', st: { run: 10, ftp: 10 } }, { slot: 'gloves', name: 'Rękawice Wędrowca', base: 'Rękawice', st: { fcr: 10, mf: 15 } }];
  const RUNES = [{ name: 'Runa Oth', st: { life: 10 } }, { name: 'Runa Vel', st: { mf: 7 } }, { name: 'Runa Zar', st: { dmg: 6 } }, { name: 'Runa Kel', st: { fcr: 5 } }];
  function makeItem(kind) {
    if (kind === 'unique') { const u = pick(UNIQ); return { kind, slot: u.slot, name: u.name, base: u.base, st: { ...u.st } }; }
    if (kind === 'set') { const s = pick(SETP); return { kind, slot: s.slot, name: s.name, base: s.base, set: 1, st: { ...s.st } }; }
    if (kind === 'rune') { const r = pick(RUNES); return { kind, slot: 'rune', name: r.name, base: 'Runa, działa z plecaka', st: { ...r.st } }; }
    const slot = pick(Object.keys(BASES)), base = pick(BASES[slot]), affs = shuffle(AFF.slice()).slice(0, kind === 'rare' ? irnd(3, 4) : irnd(1, 2)), st = {};
    for (const a of affs) st[a.k] = Math.max(1, Math.round(rnd(a.lo, a.hi) * (kind === 'rare' ? 1 : .8)));
    return { kind, slot, base, st, name: kind === 'rare' ? `${pick(RA)} ${pick(RB)}` : `${base} ${affs[0].n}` };
  }
  // what it all adds up to
  let ST = null;
  function recalc() {
    const tt = {}, add = st => { for (const k in st) tt[k] = (tt[k] || 0) + st[k]; };
    for (const k in SAVE.eq) if (SAVE.eq[k]) add(SAVE.eq[k].st);
    for (const it of SAVE.bag) if (it.slot === 'rune') add(it.st);
    const sets = Object.values(SAVE.eq).filter(i => i && i.set).length; if (sets >= 2) add({ life: 20 }); if (sets >= 4) add({ dmg: 25, mf: 25 });
    ST = { t: tt, sets, maxHp: 100 + (tt.life || 0), maxMp: 100 + (tt.mana || 0), dmg: 1 + (tt.dmg || 0) / 100, cast: .28 / (1 + (tt.fcr || 0) / 100), tp: .3 / (1 + (tt.ftp || 0) / 100),
      run: 4.2 * (1 + (tt.run || 0) / 100), mf: tt.mf || 0, res: Math.min(60, tt.res || 0), reg: 14 * (1 + (tt.reg || 0) / 100) };
    pl.hp = Math.min(pl.hp, ST.maxHp); pl.mp = Math.min(pl.mp, ST.maxMp);
  }
  recalc();

  function reset() {
    Object.assign(pl, { x: START[0], y: START[1], hp: ST.maxHp, mp: ST.maxMp, cd: 0, cast: 0, face: [-.7, -.7], flash: 0, hurt: 0, heal: 0, alive: true });
    Object.assign(boss, { hp: boss.max, cd: 1.5, hit: 0, dead: false, burst: 0 });
    shots = []; fshots = []; bolts = []; loot = []; sparks = []; trail = []; runT = 0; msg = null; state = 'run'; SAVE.runs++; save();
  }
  function drop() {                                                    // gold, a potion or two, three to five things; luck makes them better
    const f = 1 + ST.mf / 120, out = [{ kind: 'gold', amount: irnd(300, 2400) }, { kind: 'potion' }];
    if (Math.random() < .5) out.push({ kind: 'potion' });
    for (let i = irnd(3, 5); i > 0; i--) { const r = Math.random() / f; out.push({ kind: 'item', item: makeItem(r < .03 ? 'unique' : r < .07 ? 'set' : r < .12 ? 'rune' : r < .3 ? 'rare' : 'magic') }); }
    if (Math.random() < .12 * f) out.push({ kind: 'item', item: makeItem('unique') });   // now and then, the good one
    return out.map((o, i) => { const a = i / out.length * Math.PI * 2 + rnd(-.3, .3), d = rnd(1.1, 2.8), kind = o.item ? o.item.kind : o.kind;
      const name = o.item ? o.item.name : o.kind === 'gold' ? `${o.amount} złota` : 'Mikstura Leczenia';
      return { ...o, rar: kind, name, sx: boss.x, sy: boss.y, x: Math.min(AW - .8, Math.max(.8, boss.x + Math.cos(a) * d)), y: Math.min(AH - .8, Math.max(.8, boss.y + Math.sin(a) * d)), f: 0, dl: i * .09 }; });
  }
  function pickUp(it) {
    if (it.kind === 'gold') SAVE.gold += it.amount;
    else if (it.kind === 'potion') { if (SAVE.pot >= 9) return false; SAVE.pot++; }
    else { if (SAVE.bag.length >= 32) { note('Plecak pełny'); return false; } SAVE.bag.push(it.item); if (it.item.slot === 'rune') recalc(); }
    found.unshift({ name: it.name, rar: it.rar }); found = found.slice(0, 6); save(); return true;
  }
  let noteT = 0, noteS = ''; const note = s => { noteS = s; noteT = 2.2; };

  // ---------- you: moving, teleporting, casting, drinking (the same in the run and the duel; tgt: whom you aim at) ----------
  function control(dt, inp, tgt) {
    const mx = inp.x || 0, my = inp.y || 0, ml = Math.hypot(mx, my), dir = ml > .2;
    if (dir) { const wx = mx + my, wy = my - mx, wl = Math.hypot(wx, wy); pl.face = [wx / wl, wy / wl];   // the arena's axes are turned 45 degrees to the screen
      pl.x += pl.face[0] * ST.run * dt * Math.min(1, ml); pl.y += pl.face[1] * ST.run * dt * Math.min(1, ml); pl.moving = 1; } else pl.moving = 0;
    pl.cd = Math.max(0, pl.cd - dt); pl.mp = Math.min(ST.maxMp, pl.mp + ST.reg * dt); pl.hp = Math.min(ST.maxHp, pl.hp + 2.5 * dt);
    const aim = () => { if (!tgt) return null; const dx = tgt.x - pl.x, dy = tgt.y - pl.y, l = Math.hypot(dx, dy); return l > .01 && l < 12 ? [dx / l, dy / l] : null; };
    let tp = false;
    if ((inp.tele || inp.teleHeld) && pl.cd === 0 && pl.mp >= 9) {   // 5 tiles where you face, or at them when you stand still
      const f = (!dir && aim()) || pl.face; pl.face = f; trail.push({ x: pl.x, y: pl.y, a: 1 });
      pl.x += f[0] * 5; pl.y += f[1] * 5; pl.cd = ST.tp; pl.mp -= 9; pl.flash = 1; tp = true;
      for (let i = 0; i < 14; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-2, 2), vy: rnd(-2, 2), z: rnd(0, 1.5), vz: rnd(1, 3), life: rnd(.3, .6), c: '#9fd8ff' });
    }
    pl.x = Math.min(AW - .6, Math.max(.6, pl.x)); pl.y = Math.min(AH - .6, Math.max(.6, pl.y));
    for (const [px, py] of pillars) { const dx = pl.x - px, dy = pl.y - py, d = Math.hypot(dx, dy); if (d < .8) { pl.x = px + dx / (d || 1) * .8; pl.y = py + dy / (d || 1) * .8; } }
    pl.cast = Math.max(0, pl.cast - dt); let shot = null;
    if (inp.cast && pl.cast === 0 && pl.mp >= 4) { const f = aim() || pl.face;
      shot = { x: pl.x + f[0] * .4, y: pl.y + f[1] * .4, vx: f[0] * 9, vy: f[1] * 9, life: 1.4, dm: rnd(6, 11) * ST.dmg }; shots.push(shot); pl.cast = ST.cast; pl.mp -= 4; }
    if (inp.potion) { if (SAVE.pot > 0 && pl.hp < ST.maxHp) { SAVE.pot--; pl.heal = 1.2; save(); } else if (!SAVE.pot) note('Brak mikstur'); }
    if (pl.heal > 0) { const k = Math.min(dt, pl.heal); pl.hp = Math.min(ST.maxHp, pl.hp + ST.maxHp * .5 * k / 1.2); pl.heal -= dt; }
    pl.flash = Math.max(0, pl.flash - dt * 3); pl.hurt = Math.max(0, pl.hurt - dt * 3);
    return { shot, tp };
  }
  function hurt(n) { pl.hp -= n * (1 - ST.res / 100); pl.hurt = 1; for (let i = 0; i < 8; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(.5, 1.5), vz: rnd(0, 3), life: rnd(.2, .5), c: '#ff3b30' }); }
  const pop = (x, y, c, n = 8) => { for (let i = 0; i < n; i++) sparks.push({ x, y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(1, 2), vz: rnd(0, 3), life: rnd(.2, .5), c }); };
  const fly = (list, dt) => { for (const s of list) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; } return list.filter(s => s.life > 0 && s.x > -1 && s.y > -1 && s.x < AW + 1 && s.y < AH + 1); };

  // ---------- the step ----------
  function step(dt, inp) {
    t += dt; if (inp.dev) dev = inp.dev; noteT = Math.max(0, noteT - dt);
    if (inp.inv && state !== 'lobby') { INV.open = !INV.open; INV.confirm = -1; }
    if (INV.open) { invInput(inp); if (state === 'duel') duelStep(dt, {}); else sparksStep(dt); return; }   // (the run waits while you look; the duel does not)
    if (state === 'menu') { if (inp.left) sel = 0; if (inp.right) sel = 1; if (inp.tele || inp.start) { if (sel === 0) reset(); else { state = 'lobby'; D.seekT = 0; D.msg = ''; } } return; }
    if (state === 'lobby') { lobbyStep(dt); return; }
    if (state === 'duel') { duelStep(dt, inp); return; }
    if (state === 'dead') { if (inp.start || inp.tele) reset(); sparksStep(dt); return; }
    runT += boss.dead ? 0 : dt;
    control(dt, inp, boss.dead ? null : boss);
    for (const s of shots) if (!boss.dead && s.life > 0 && Math.hypot(s.x - boss.x, s.y - boss.y) < .9) { s.life = 0; boss.hp -= s.dm; boss.hit = 1; pop(s.x, s.y, '#bfe9ff'); }
    shots = fly(shots, dt);
    // he: bobs on his dais; when you are near, blood bolts at you every 1.3 s, a fan of three when he is hurt
    boss.hit = Math.max(0, boss.hit - dt * 4);
    if (!boss.dead) {
      boss.cd -= dt; const d = Math.hypot(pl.x - boss.x, pl.y - boss.y);
      if (boss.cd <= 0 && d < 11) { const n = boss.hp < boss.max / 2 ? 3 : 1, a0 = Math.atan2(pl.y - boss.y, pl.x - boss.x);
        for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * .28; bolts.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, life: 2.4 }); }
        boss.cd = rnd(1.1, 1.5); }
      if (boss.hp <= 0) { boss.dead = true; boss.burst = 1; loot = drop(); SAVE.kills++; save();
        for (let i = 0; i < 60; i++) sparks.push({ x: boss.x, y: boss.y, vx: rnd(-5, 5), vy: rnd(-5, 5), z: rnd(1, 3), vz: rnd(1, 6), life: rnd(.5, 1.4), c: Math.random() < .5 ? '#ff4a3a' : '#ffb35a' }); }
    }
    boss.burst = Math.max(0, boss.burst - dt * .8);
    for (const b of bolts) if (b.life > 0 && Math.hypot(b.x - pl.x, b.y - pl.y) < .55) { b.life = 0; hurt(12); }
    bolts = fly(bolts, dt);
    if (pl.hp <= 0) { state = 'dead'; msg = 'Zginąłeś · Start: jeszcze raz'; }
    for (const it of loot) { if (it.dl > 0) { it.dl -= dt; continue; } it.f = Math.min(1, it.f + dt * 1.8);   // the loot flies out, lands; run over it to pick it up
      if (it.f >= 1 && !it.got && !it.full && Math.hypot(it.x - pl.x, it.y - pl.y) < .75) { if (pickUp(it)) it.got = true; else it.full = true; }
      if (it.full && Math.hypot(it.x - pl.x, it.y - pl.y) > 1.2) it.full = false; }                     // (full: tried; again once you step off and back)
    if (boss.dead && loot.length && loot.every(i => i.got) && !msg) msg = 'Wszystko zebrane · Start: następny bieg';
    if (inp.start && boss.dead) reset();
    trailStep(dt); sparksStep(dt);
  }
  function trailStep(dt) { for (const tr of trail) tr.a -= dt * 2.5; trail = trail.filter(tr => tr.a > 0); }
  function sparksStep(dt) { for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 9 * dt; if (s.z < 0) { s.z = 0; s.vz *= -.3; } s.life -= dt; } sparks = sparks.filter(s => s.life > 0); }

  // ---------- the duel: two visitors, over the ghosts' connection ----------
  const D = { opp: null, host: false, seekT: 0, o: null, my: 0, over: false, sendT: 0, respawn: 0, tpN: 0, msg: '' };
  const N = (v, lo, hi, def = 0) => typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  const spawnOf = host => host ? START : FAR;
  function lobbyStep(dt) {
    D.seekT -= dt; if (net && net.id && D.seekT <= 0) { net.send({ t: 'seek' }); D.seekT = 1; }   // once a second: anyone else at a TV, waiting?
    sparksStep(dt);
  }
  function startDuel(id, host) {
    const [ox, oy] = spawnOf(!host);
    D.opp = id; D.host = host; D.my = 0; D.over = false; D.respawn = 0; D.tpN = 0; D.msg = '';
    D.o = { x: ox, y: oy, tx: ox, ty: oy, hp: 100, mh: 100, fx: 0, fy: 0, a: 1, d: 0, tp: 0, seen: t, moving: 0, burst: 0 };
    const [sx, sy] = spawnOf(host);
    Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, cd: 0, cast: 0, face: host ? [-.7, -.7] : [.7, .7], flash: 0, hurt: 0, heal: 0, alive: true });
    shots = []; fshots = []; bolts = []; loot = []; trail = []; msg = null; state = 'duel'; boss.dead = true; boss.burst = 0;
  }
  function endDuel(m) { D.opp = null; D.o = null; state = 'lobby'; D.msg = m; D.seekT = 1.5; }
  function round() { D.my = 0; if (D.o) D.o.d = 0; D.over = false; msg = null; const [sx, sy] = spawnOf(D.host); Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, alive: true }); D.respawn = 0; }
  function duelStep(dt, inp) {
    const O = D.o; if (!O) return;
    if (t - O.seen > 6) { endDuel('Przeciwnik zniknął'); return; }
    const k = 1 - Math.exp(-dt * 12); O.moving = Math.hypot(O.tx - O.x, O.ty - O.y) > .05 ? 1 : 0; O.x += (O.tx - O.x) * k; O.y += (O.ty - O.y) * k; O.burst = Math.max(0, O.burst - dt);
    let out = { shot: null, tp: false };
    if (pl.alive) out = control(dt, D.over ? { x: inp.x, y: inp.y, dev: inp.dev } : inp, O.a ? O : null);
    else if ((D.respawn -= dt) <= 0) { const [sx, sy] = spawnOf(D.host); Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, alive: true, flash: 1 }); }
    if (out.tp) D.tpN++;
    if (out.shot && net) net.send({ t: 'o', x: +out.shot.x.toFixed(2), y: +out.shot.y.toFixed(2), vx: +out.shot.vx.toFixed(2), vy: +out.shot.vy.toFixed(2), dm: +out.shot.dm.toFixed(1) }, D.opp);
    for (const s of shots) if (O.a && s.life > 0 && Math.hypot(s.x - O.x, s.y - O.y) < .6) { s.life = 0; pop(s.x, s.y, '#bfe9ff'); }   // (only a flash: the hit is theirs to count)
    shots = fly(shots, dt);
    for (const s of fshots) if (pl.alive && !D.over && s.life > 0 && Math.hypot(s.x - pl.x, s.y - pl.y) < .55) { s.life = 0; hurt(s.dm); }
    fshots = fly(fshots, dt);
    if (pl.alive && pl.hp <= 0) { pl.alive = false; D.my++; D.respawn = 2; pop(pl.x, pl.y, '#ff4a3a', 40); D.sendT = 0; }
    if (!D.over && (D.my >= 3 || O.d >= 3)) { D.over = true; const won = O.d >= 3; if (won) { SAVE.wins++; save(); } msg = won ? 'Wygrana! · Start: rewanż' : 'Przegrana · Start: rewanż'; }
    if (D.over && inp.start) { net?.send({ t: 're' }, D.opp); round(); }
    if ((D.sendT -= dt) <= 0 && net) { D.sendT = 1 / 15;
      net.send({ t: 's', x: +pl.x.toFixed(2), y: +pl.y.toFixed(2), h: Math.round(Math.max(0, pl.hp)), m: ST.maxHp, fx: +pl.face[0].toFixed(2), fy: +pl.face[1].toFixed(2), a: pl.alive ? 1 : 0, d: D.my, p: D.tpN, c: pl.cast > .15 ? 1 : 0 }, D.opp); }
    trailStep(dt); sparksStep(dt);
  }
  function receive(d, from) {                                          // what the other side says: checked, clamped
    if (!d || typeof d !== 'object' || typeof from !== 'string' || !net) return;
    if (d.t === 'seek') { if (state === 'lobby' && !D.opp && net.id) { if (net.id < from) { net.send({ t: 'go' }, from); startDuel(from, true); } else net.send({ t: 'seek' }, from); } return; }
    if (d.t === 'go') { if (state === 'lobby' && !D.opp) startDuel(from, false); return; }
    if (from !== D.opp || state !== 'duel' || !D.o) return;
    const O = D.o; O.seen = t;
    if (d.t === 's') {
      O.tx = N(d.x, 0, AW, O.tx); O.ty = N(d.y, 0, AH, O.ty); O.hp = N(d.h, 0, 1000, O.hp); O.mh = N(d.m, 1, 1000, 100); O.fx = N(d.fx, -1, 1); O.fy = N(d.fy, -1, 1); O.c = d.c ? 1 : 0;
      const a = d.a ? 1 : 0; if (O.a && !a) { O.burst = 1; pop(O.x, O.y, '#ff4a3a', 40); } O.a = a;
      O.d = N(d.d, 0, 99, O.d) | 0;
      const tp = N(d.p, 0, 1e9, 0) | 0; if (tp !== O.tp) { trail.push({ x: O.x, y: O.y, a: 1 }); O.tp = tp; O.x = O.tx; O.y = O.ty; pop(O.x, O.y, '#ffb0b0', 10); }
      if (Math.hypot(O.tx - O.x, O.ty - O.y) > 3) { O.x = O.tx; O.y = O.ty; }
    } else if (d.t === 'o') { if (fshots.length < 40) fshots.push({ x: N(d.x, 0, AW), y: N(d.y, 0, AH), vx: N(d.vx, -12, 12), vy: N(d.vy, -12, 12), dm: N(d.dm, 0, 40, 8), life: 1.4 }); }
    else if (d.t === 're') round();
    else if (d.t === 'bye') endDuel('Przeciwnik wyszedł');
  }

  // ---------- the inventory: the figure with its slots, the backpack (8 x 4) ----------
  const DOLL = [{ k: 'helm', l: 'Hełm', x: 192, y: 44, w: 64, h: 64 }, { k: 'amulet', l: 'Amulet', x: 276, y: 58, w: 40, h: 40 }, { k: 'weapon', l: 'Broń', x: 70, y: 120, w: 72, h: 150 },
    { k: 'armor', l: 'Zbroja', x: 184, y: 120, w: 80, h: 116 }, { k: 'gloves', l: 'Rękawice', x: 70, y: 284, w: 64, h: 64 }, { k: 'ring1', l: 'Pierścień', x: 136, y: 250, w: 40, h: 40 },
    { k: 'belt', l: 'Pas', x: 184, y: 250, w: 80, h: 40 }, { k: 'ring2', l: 'Pierścień', x: 272, y: 250, w: 40, h: 40 }, { k: 'boots', l: 'Buty', x: 306, y: 284, w: 64, h: 64 }];
  const GRID = { x: 440, y: 58, c: 8, r: 4, s: 56 };
  const NODES = [...DOLL.map(s => ({ doll: s, cx: s.x + s.w / 2, cy: s.y + s.h / 2 })),
    ...Array.from({ length: GRID.c * GRID.r }, (_, i) => ({ bag: i, cx: GRID.x + (i % GRID.c + .5) * GRID.s, cy: GRID.y + ((i / GRID.c | 0) + .5) * GRID.s }))];
  const INV = { open: false, cur: DOLL.length, confirm: -1 };
  const nodeItem = n => n.doll ? SAVE.eq[n.doll.k] : SAVE.bag[n.bag];
  function nav(dx, dy) {
    const a = NODES[INV.cur]; let best = -1, bs = 1e9;
    NODES.forEach((b, i) => { if (i === INV.cur) return; const vx = b.cx - a.cx, vy = b.cy - a.cy, along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx); if (along <= 4) return;
      const s = along + perp * 2.2; if (s < bs) { bs = s; best = i; } });
    if (best >= 0) { INV.cur = best; INV.confirm = -1; }
  }
  function invInput(inp) {
    if (inp.left) nav(-1, 0); if (inp.right) nav(1, 0); if (inp.up) nav(0, -1); if (inp.down) nav(0, 1);
    const n = NODES[INV.cur], it = nodeItem(n);
    if ((inp.tele || inp.start) && it) {
      if (n.doll) { if (SAVE.bag.length >= 32) note('Plecak pełny'); else { SAVE.bag.push(it); SAVE.eq[n.doll.k] = null; } }             // take it off
      else if (it.slot === 'rune') note('Runa działa, gdy leży w plecaku');
      else { let k = it.slot; if (k === 'ring') k = !SAVE.eq.ring1 ? 'ring1' : !SAVE.eq.ring2 ? 'ring2' : 'ring1';                   // put it on (what was there goes to its place in the pack)
        const old = SAVE.eq[k]; SAVE.eq[k] = it; if (old) SAVE.bag[n.bag] = old; else SAVE.bag.splice(n.bag, 1); }
      recalc(); save(); INV.confirm = -1;
    }
    if (inp.drop && it) { if (INV.confirm === INV.cur) { if (n.doll) SAVE.eq[n.doll.k] = null; else SAVE.bag.splice(n.bag, 1); recalc(); save(); INV.confirm = -1; note('Wyrzucone'); }
      else { INV.confirm = INV.cur; note('Jeszcze raz: wyrzuć'); } }
  }
  function icon(it, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.fillStyle = g.strokeStyle = COL[it.kind]; g.lineWidth = 3;
    const P = (...pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s)); g.closePath(); g.fill(); };
    switch (it.slot) {
      case 'helm': g.beginPath(); g.arc(0, s * .08, s * .32, Math.PI, 0); g.lineTo(s * .38, s * .2); g.lineTo(-s * .38, s * .2); g.closePath(); g.fill(); break;
      case 'amulet': g.lineWidth = 2; g.beginPath(); g.moveTo(-s * .25, -s * .32); g.quadraticCurveTo(0, s * .05, s * .25, -s * .32); g.stroke(); g.beginPath(); g.arc(0, s * .14, s * .14, 0, 7); g.fill(); break;
      case 'ring': g.lineWidth = s * .09; g.beginPath(); g.arc(0, s * .05, s * .2, 0, 7); g.stroke(); g.beginPath(); g.arc(0, -s * .17, s * .08, 0, 7); g.fill(); break;
      case 'weapon': g.lineWidth = s * .07; g.beginPath(); g.moveTo(-s * .25, s * .42); g.lineTo(s * .2, -s * .3); g.stroke(); g.beginPath(); g.arc(s * .24, -s * .36, s * .11, 0, 7); g.fill(); break;
      case 'armor': P([-.36, -.3], [-.12, -.38], [0, -.28], [.12, -.38], [.36, -.3], [.28, .38], [-.28, .38]); break;
      case 'belt': g.fillRect(-s * .42, -s * .1, s * .84, s * .2); g.fillStyle = '#1a1410'; g.fillRect(-s * .08, -s * .07, s * .16, s * .14); break;
      case 'gloves': g.beginPath(); g.roundRect(-s * .2, -s * .32, s * .38, s * .5, s * .12); g.fill(); g.fillRect(-s * .2, s * .16, s * .38, s * .16); break;
      case 'boots': P([-.2, -.36], [.04, -.36], [.04, .12], [.36, .18], [.36, .34], [-.2, .34]); break;
      default: g.beginPath(); g.roundRect(-s * .26, -s * .3, s * .52, s * .6, s * .1); g.fill(); g.fillStyle = '#2a1a0a'; g.font = `700 ${s * .34 | 0}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.name.split(' ')[1]?.[0] || '?', 0, 1);
    }
    g.restore();
  }
  function tip(it, x, y, w) {                                          // the item's name, kind, stats; returns where it ended
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = COL[it.kind]; g.font = '700 17px Georgia, serif'; g.fillText(it.name, x, y);
    g.fillStyle = '#9d9480'; g.font = '600 13px Georgia, serif'; g.fillText({ magic: 'Magiczny', rare: 'Rzadki', set: 'Zestaw', unique: 'Unikat', rune: 'Runa' }[it.kind] + ' · ' + it.base, x, y + 18); y += 38;
    g.font = '600 14px Georgia, serif'; g.fillStyle = '#8fa8ff';
    for (const k of ORDER) if (it.st[k]) { g.fillText(STAT[k](it.st[k]), x, y); y += 18; }
    if (it.set) { g.fillStyle = '#39d34b'; g.fillText(`Zestaw Wędrowca (${ST.sets}/4 na sobie): 2 · +20 do życia, 4 · +25% obrażeń i szczęścia`, x, y); y += 18; }
    return y;
  }
  function drawInv() {
    g.fillStyle = 'rgba(8,6,5,.94)'; g.fillRect(16, 14, W - 32, H - 80); g.strokeStyle = '#8a7a52'; g.lineWidth = 2; g.strokeRect(16, 14, W - 32, H - 80);
    g.fillStyle = '#d8cfa8'; g.font = '700 16px Georgia, serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('Postać', 40, 36); g.fillText('Plecak', GRID.x, 36);
    const cur = NODES[INV.cur];
    for (const s of DOLL) { const it = SAVE.eq[s.k], on = cur.doll === s;
      g.fillStyle = it ? '#1d1712' : '#120e0b'; g.fillRect(s.x, s.y, s.w, s.h); g.strokeStyle = on ? '#ffffff' : it ? COL[it.kind] + '99' : '#3a3226'; g.lineWidth = on ? 3 : 1.5; g.strokeRect(s.x, s.y, s.w, s.h);
      if (it) icon(it, s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w, s.h) * .95); else { g.fillStyle = '#4a4234'; g.font = '600 11px Georgia, serif'; g.textAlign = 'center'; g.fillText(s.l, s.x + s.w / 2, s.y + s.h / 2 + 4); g.textAlign = 'left'; } }
    for (let i = 0; i < GRID.c * GRID.r; i++) { const x = GRID.x + (i % GRID.c) * GRID.s, y = GRID.y + (i / GRID.c | 0) * GRID.s, it = SAVE.bag[i], on = cur.bag === i;
      g.fillStyle = it ? '#1d1712' : '#120e0b'; g.fillRect(x + 1, y + 1, GRID.s - 2, GRID.s - 2); g.strokeStyle = on ? '#ffffff' : '#3a3226'; g.lineWidth = on ? 3 : 1; g.strokeRect(x + 1, y + 1, GRID.s - 2, GRID.s - 2);
      if (it) icon(it, x + GRID.s / 2, y + GRID.s / 2, GRID.s * .8); }
    // your stats
    const T = ST.t, L = [[`Życie ${Math.round(ST.maxHp)}`, `Mana ${Math.round(ST.maxMp)}`], [`Zimno +${T.dmg || 0}%`, `Rzucanie +${T.fcr || 0}%`], [`Teleport +${T.ftp || 0}%`, `Bieg +${T.run || 0}%`],
      [`Szczęście +${ST.mf}%`, `Odporność ${ST.res}%`], [`Złoto ${SAVE.gold.toLocaleString('pl-PL')}`, `Mikstury ${SAVE.pot}`], [`Biegi ${SAVE.runs} · bossy ${SAVE.kills}`, `Pojedynki: ${SAVE.wins} wygr.`]];
    g.font = '600 14px Georgia, serif'; L.forEach(([a, b], i) => { g.fillStyle = i === 4 ? '#e8c65a' : '#cbbd96'; g.fillText(a, 140, 372 + i * 16); g.fillText(b, 292, 372 + i * 16); });
    // the one under the cursor, and what you wear there now
    const it = nodeItem(cur);
    if (it) { let y = tip(it, GRID.x, 302, 480);
      if (cur.bag !== undefined && it.slot !== 'rune') { const k = it.slot === 'ring' ? (SAVE.eq.ring1 ? 'ring1' : null) : it.slot, on = k && SAVE.eq[k];
        if (on) { g.fillStyle = '#6f6857'; g.font = '600 12px Georgia, serif'; g.fillText('Na sobie teraz:', GRID.x + 250, 302); g.save(); g.globalAlpha = .75; tip(on, GRID.x + 250, 320, 220); g.restore(); } } }
    else { g.fillStyle = '#6f6857'; g.font = '600 14px Georgia, serif'; g.fillText(cur.doll ? `${cur.doll.l}: pusto` : 'Pusto', GRID.x, 302); }
  }

  // ---------- the drawing ----------
  function draw() {
    if (state === 'menu') { drawMenu(); if (INV.open) { drawInv(); bar(); } return; }
    if (state === 'lobby') return drawLobby();
    const [cx, cy] = iso(pl.x, pl.y), ox = W / 2 - cx, oy = H / 2 - cy + 30, P = (x, y, z = 0) => { const [a, b] = iso(x, y); return [a + ox, b + oy - z * 24]; };
    g.fillStyle = '#050304'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const f = floor[y * AW + x], [sx, sy] = P(x + .5, y + .5), dais = state !== 'duel' && Math.hypot(x + .5 - boss.x, y + .5 - boss.y) < 2.6;
      const L = f.l * (dais ? 1.25 : 1); g.fillStyle = `rgb(${62 * L | 0},${30 * L | 0},${28 * L | 0})`;
      g.beginPath(); g.moveTo(sx, sy - TH / 2); g.lineTo(sx + TW / 2, sy); g.lineTo(sx, sy + TH / 2); g.lineTo(sx - TW / 2, sy); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.2; g.stroke();
      if (f.crack) { g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.moveTo(sx - 12, sy - 3); g.lineTo(sx + 2, sy + 2); g.lineTo(sx + 14, sy - 4); g.stroke(); }
      if (f.blood) { g.fillStyle = 'rgba(120,6,10,.55)'; g.beginPath(); g.ellipse(sx + 4, sy, 16, 7, 0, 0, 7); g.fill(); } }
    for (let x = 0; x < AW; x++) wallBlock(P(x + .5, 0)); for (let y = 0; y < AH; y++) wallBlock(P(0, y + .5));
    const items = [], O = state === 'duel' ? D.o : null;
    for (const [px, py] of pillars) items.push({ d: px + py, draw: () => { const [sx, sy] = P(px, py), [qx, qy] = P(pl.x, pl.y);   // one in front of you goes see-through
      const over = px + py > pl.x + pl.y && Math.abs(sx - qx) < 34 && qy < sy + 4 && qy > sy - 130; g.globalAlpha = over ? .32 : 1; pillar([sx, sy]); g.globalAlpha = 1; } });
    for (const [bx, by] of braziers) items.push({ d: bx + by, draw: () => brazier(P(bx, by)) });
    if (state !== 'duel' && (!boss.dead || boss.burst > 0)) items.push({ d: boss.x + boss.y, draw: () => drawBoss(P(boss.x, boss.y)) });
    for (const it of loot) if (!it.got && it.dl <= 0) items.push({ d: it.x + it.y - .01, draw: () => drawLoot(it, P) });
    if (pl.alive) items.push({ d: pl.x + pl.y, draw: () => mage(P(pl.x, pl.y), pl.face, pl.moving, pl.cast > .15, ['#22314f', '#35507f', '#8fd6ff']) });
    if (O && O.a) items.push({ d: O.x + O.y, draw: () => { const [sx, sy] = P(O.x, O.y); mage([sx, sy], [O.fx, O.fy], O.moving, O.c, ['#4f1d22', '#7f3035', '#ff9a8a']);
      g.font = '700 13px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff8a7a'; g.fillText('Przeciwnik', sx, sy - 74);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(sx - 22, sy - 66, 44, 5); g.fillStyle = '#d23a2a'; g.fillRect(sx - 22, sy - 66, 44 * Math.max(0, O.hp) / O.mh, 5); } });
    items.sort((a, b) => a.d - b.d).forEach(i => i.draw());
    for (const tr of trail) { const [sx, sy] = P(tr.x, tr.y); g.fillStyle = `rgba(140,200,255,${tr.a * .35})`; g.beginPath(); g.ellipse(sx, sy - 22, 10, 26, 0, 0, 7); g.fill(); }
    const orb = (s, c0, c1, r) => { const [sx, sy] = P(s.x, s.y, 1); const gr = g.createRadialGradient(sx, sy, 1, sx, sy, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill(); };
    for (const s of shots) orb(s, '#9fe0ff', 'rgba(80,160,255,0)', 14);
    for (const s of fshots) orb(s, '#ff9a6a', 'rgba(255,80,40,0)', 14);
    for (const b of bolts) orb(b, '#ff3b30', 'rgba(150,0,0,0)', 13);
    for (const s of sparks) { const [sx, sy] = P(s.x, s.y, s.z); g.fillStyle = s.c; g.globalAlpha = Math.min(1, s.life * 3); g.fillRect(sx - 1.5, sy - 1.5, 3, 3); g.globalAlpha = 1; }
    // the light: your radius and the braziers', the rest in the dark
    const [lx, ly] = P(pl.x, pl.y, .8); g.save(); g.globalCompositeOperation = 'multiply';
    const dark = g.createRadialGradient(lx, ly, 40, lx, ly, 430); dark.addColorStop(0, '#ffffff'); dark.addColorStop(.55, '#8a7a78'); dark.addColorStop(1, '#141012'); g.fillStyle = dark; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    const glowAt = (sx, sy, r, c) => { const gl = g.createRadialGradient(sx, sy, 2, sx, sy, r); gl.addColorStop(0, c); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(sx - r, sy - r, 2 * r, 2 * r); };
    for (const [bx, by] of braziers) { const [sx, sy] = P(bx, by, 1.4); glowAt(sx, sy, 150, `rgba(255,150,60,${.35 * (.8 + .2 * Math.sin(t * 13 + bx))})`); }
    if (state !== 'duel' && !boss.dead) { const [sx, sy] = P(boss.x, boss.y, 1.2); glowAt(sx, sy, 120, 'rgba(255,40,30,.28)'); }
    if (O && O.a) { const [sx, sy] = P(O.x, O.y, 1); glowAt(sx, sy, 110, 'rgba(255,90,70,.3)'); }                 // so you see them in the dark
    if (state !== 'duel' && boss.burst > 0) { const [sx, sy] = P(boss.x, boss.y, 1); glowAt(sx, sy, 260 * (1 - boss.burst) + 40, `rgba(255,120,60,${boss.burst * .7})`); }
    for (const it of loot) if (!it.got && it.dl <= 0 && it.rar === 'unique' && it.f >= 1) { const [sx, sy] = P(it.x, it.y); const gl = g.createLinearGradient(sx, sy - 220, sx, sy); gl.addColorStop(0, 'rgba(255,210,120,0)'); gl.addColorStop(1, 'rgba(255,210,120,.45)'); g.fillStyle = gl; g.fillRect(sx - 9, sy - 220, 18, 220); }
    if (pl.flash > 0) { g.fillStyle = `rgba(160,210,255,${pl.flash * .18})`; g.fillRect(0, 0, W, H); }
    g.restore();
    if (pl.hurt > 0) { g.fillStyle = `rgba(160,0,0,${pl.hurt * .16})`; g.fillRect(0, 0, W, H); }
    { const placed = [];                                              // the labels: each nudged up until it sits clear of the ones placed before
      for (const it of loot.filter(i => !i.got && i.dl <= 0 && i.f >= 1).sort((a, b) => (b.x + b.y) - (a.x + a.y))) {
        const [sx, sy] = P(it.x, it.y); g.font = it.rar === 'unique' || it.rar === 'set' ? '700 15px Georgia, serif' : '600 14px Georgia, serif';
        const w = g.measureText(it.name).width + 12; let y = sy - 30;
        for (let guard = 0; guard < 40; guard++) { const hit = placed.find(r => Math.abs(r.x - sx) < (r.w + w) / 2 && Math.abs(r.y - y) < 21); if (!hit) break; y = hit.y - 21; }
        placed.push({ x: sx, y, w }); g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(sx - w / 2, y, w, 20); g.fillStyle = COL[it.rar]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.name, sx, y + 10); } }
    hud();
  }
  function wallBlock([sx, sy]) { g.fillStyle = '#3a423f'; g.fillRect(sx - 30, sy - 40, 60, 40); g.fillStyle = '#4c5652'; g.fillRect(sx - 30, sy - 46, 60, 8); g.strokeStyle = 'rgba(0,0,0,.4)'; g.strokeRect(sx - 30, sy - 40, 60, 40); }
  function pillar([sx, sy]) { g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(sx, sy, 26, 12, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(sx - 18, 0, sx + 18, 0); gr.addColorStop(0, '#2e3533'); gr.addColorStop(.5, '#59625e'); gr.addColorStop(1, '#262c2a'); g.fillStyle = gr; g.fillRect(sx - 18, sy - 120, 36, 120);
    g.fillStyle = '#6b7470'; g.fillRect(sx - 24, sy - 128, 48, 10); g.fillRect(sx - 22, sy - 8, 44, 8); }
  function brazier([sx, sy]) { g.fillStyle = '#2a2622'; g.fillRect(sx - 3, sy - 44, 6, 44); g.fillStyle = '#3d3630'; g.beginPath(); g.ellipse(sx, sy - 46, 12, 5, 0, 0, 7); g.fill();
    const fl = Math.sin(t * 17 + sx) * 3; g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(sx - 9, sy - 48); g.quadraticCurveTo(sx - 6 + fl, sy - 66, sx + fl, sy - 80); g.quadraticCurveTo(sx + 8, sy - 64, sx + 9, sy - 48); g.fill();
    g.fillStyle = '#ffe7a0'; g.beginPath(); g.ellipse(sx + fl * .4, sy - 56, 3.5, 7, 0, 0, 7); g.fill(); }
  function mage([sx, sy], face, moving, casting, [robe, robe2, tip]) {
    const bob = moving ? Math.sin(t * 14) * 2 : 0, fx = face[0] - face[1] > 0 ? 1 : -1;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(sx, sy, 14, 6, 0, 0, 7); g.fill();
    g.fillStyle = robe; g.beginPath(); g.moveTo(sx - 11, sy - 2); g.lineTo(sx - 7, sy - 38 + bob); g.lineTo(sx + 7, sy - 38 + bob); g.lineTo(sx + 11, sy - 2); g.closePath(); g.fill();   // the robe
    g.fillStyle = robe2; g.fillRect(sx - 7, sy - 40 + bob, 14, 12);
    g.fillStyle = '#e8c3a0'; g.beginPath(); g.arc(sx, sy - 46 + bob, 6, 0, 7); g.fill(); g.fillStyle = '#6b4a30'; g.beginPath(); g.arc(sx, sy - 49 + bob, 6.5, Math.PI, 0); g.fill();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx + fx * 10, sy - 2); g.lineTo(sx + fx * 12, sy - 58 + bob); g.stroke();   // the staff,
    g.fillStyle = casting ? '#ffffff' : tip; g.beginPath(); g.arc(sx + fx * 12, sy - 60 + bob, 4, 0, 7); g.fill();                                   // its glowing tip
  }
  function drawBoss([sx, sy]) {
    const a = boss.dead ? boss.burst : 1, bob = Math.sin(t * 2.2) * 5; g.globalAlpha = a;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(sx, sy, 34, 13, 0, 0, 7); g.fill();
    for (let k = 0; k < 6; k++) { const w = Math.sin(t * 3 + k) * 6; g.strokeStyle = '#4a0d12'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx - 20 + k * 8, sy - 30 + bob); g.quadraticCurveTo(sx - 22 + k * 8 + w, sy - 12, sx - 26 + k * 10 + w, sy - 2); g.stroke(); }   // what trails under him
    const body = g.createLinearGradient(sx - 28, 0, sx + 28, 0); body.addColorStop(0, '#3a0a0e'); body.addColorStop(.5, boss.hit ? '#ffb0a0' : '#8c1c22'); body.addColorStop(1, '#2a0609');
    g.fillStyle = body; g.beginPath(); g.moveTo(sx - 26, sy - 28 + bob); g.quadraticCurveTo(sx - 34, sy - 80 + bob, sx - 14, sy - 104 + bob); g.lineTo(sx + 14, sy - 104 + bob); g.quadraticCurveTo(sx + 34, sy - 80 + bob, sx + 26, sy - 28 + bob); g.closePath(); g.fill();
    g.fillStyle = '#5a1015'; g.beginPath(); g.arc(sx, sy - 112 + bob, 15, 0, 7); g.fill();                                                       // the head,
    g.fillStyle = '#d8c8b0'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(sx + s * 8, sy - 122 + bob); g.lineTo(sx + s * 22, sy - 142 + bob); g.lineTo(sx + s * 12, sy - 118 + bob); g.fill(); }   // horns,
    g.fillStyle = '#ffe24a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(sx + s * 5, sy - 113 + bob, 2.4, 0, 7); g.fill(); }                  // eyes
    if (boss.cd < .35 && !boss.dead) { g.fillStyle = 'rgba(255,60,40,.8)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(sx + s * 34, sy - 74 + bob, 7, 0, 7); g.fill(); } }   // hands aglow before a bolt
    g.globalAlpha = 1;
  }
  function drawLoot(it, P) {
    const k = it.f, x = it.sx + (it.x - it.sx) * k, y = it.sy + (it.y - it.sy) * k, [sx, sy] = P(x, y, Math.sin(k * Math.PI) * 2.2);
    g.save(); g.translate(sx, sy); g.rotate(k * 6); g.fillStyle = COL[it.rar];
    if (it.kind === 'gold') { for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse((i - 2) * 3, (i % 2) * 2, 4, 2.2, 0, 0, 7); g.fill(); } }
    else if (it.kind === 'potion') { g.fillStyle = '#c8282a'; g.beginPath(); g.arc(0, 2, 5, 0, 7); g.fill(); g.fillStyle = '#ddd'; g.fillRect(-1.5, -6, 3, 4); }
    else if (it.rar === 'rune') g.fillRect(-5, -6, 10, 12);
    else { g.beginPath(); g.moveTo(0, -8); g.lineTo(7, 0); g.lineTo(0, 8); g.lineTo(-7, 0); g.closePath(); g.fill(); }
    g.restore();
  }
  function orbGauge(x, y, r, v, c0, c1) { g.fillStyle = '#120c0a'; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); const gr = g.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x - r, y + r - 2 * r * v, 2 * r, 2 * r * v); g.restore();
    g.strokeStyle = '#8a7a52'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 2, 0, 7); g.stroke(); }
  // the controls, as caps for the keys or the pad's own buttons (A green, X blue, B red, Y yellow, as a pad marks them; the stick a ring)
  const PADC = { A: '#3fae4a', X: '#3a7bd5', B: '#d0463b', Y: '#e0b22e' };
  function controls(list, x, y, align, font, col) {                   // (pad buttons and the stick only when the pad is what you use)
    const isPad = c => dev === 'pad' && (c === 'stick' || PADC[c]);
    g.font = font; g.textBaseline = 'middle'; g.textAlign = 'left';
    const capW = c => isPad(c) ? 22 : g.measureText(c).width + 14, gap = 7, sep = 18;
    const total = list.reduce((a, [c, l]) => a + capW(c) + gap + g.measureText(l).width, 0) + sep * (list.length - 1);
    let cx = align === 'center' ? x - total / 2 : x;
    for (const [c, l] of list) {
      const w = capW(c);
      if (isPad(c) && c === 'stick') { g.strokeStyle = '#cfc6a6'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx + 11, y, 10, 0, 7); g.stroke(); g.fillStyle = '#cfc6a6'; g.beginPath(); g.arc(cx + 11, y, 4.5, 0, 7); g.fill(); }
      else if (isPad(c)) { g.fillStyle = PADC[c]; g.beginPath(); g.arc(cx + 11, y, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(c, cx + 11, y + 1); g.textAlign = 'left'; g.font = font; }
      else { g.fillStyle = 'rgba(255,255,255,.1)'; g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(cx, y - 12, w, 24, 5); g.fill(); g.stroke();
        g.fillStyle = '#f2ecd8'; g.font = '700 13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(c, cx + w / 2, y + 1); g.textAlign = 'left'; g.font = font; }
      cx += w + gap; g.fillStyle = col; g.fillText(l, cx, y); cx += g.measureText(l).width + sep;
    }
  }
  function bar() {                                                     // the bottom: the orbs, the controls for what is on
    g.fillStyle = 'rgba(30,26,22,.96)'; g.fillRect(0, H - 64, W, 64); g.strokeStyle = '#8a7a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H - 64); g.lineTo(W, H - 64); g.stroke();
    orbGauge(70, H - 56, 46, Math.max(0, pl.hp) / ST.maxHp, '#ff5a4a', '#5a0808'); orbGauge(W - 70, H - 56, 46, pl.mp / ST.maxMp, '#6a7cff', '#0a0e5a');
    const pad = dev === 'pad', F = '600 14px Georgia, serif', C = '#d8cfa8';
    if (INV.open) controls(pad ? [['stick', 'wybór'], ['A', 'załóż / zdejmij'], ['X', 'wyrzuć'], ['Y', 'zamknij']] : [['←↑↓→', 'wybór'], ['Spacja', 'załóż / zdejmij'], ['X', 'wyrzuć'], ['I', 'zamknij']], W / 2, H - 30, 'center', F, C);
    else controls(pad ? [['stick', 'bieg'], ['A', 'teleport'], ['X', 'pocisk'], ['LB', 'mikstura'], ['Y', 'ekwipunek'], ['B', 'wyjście']]
      : [['WASD', 'bieg'], ['Spacja', 'teleport'], ['J', 'pocisk'], ['Q', 'mikstura'], ['I', 'ekwipunek'], ['Esc', 'wyjście']], W / 2, H - 30, 'center', F, C);
  }
  function hud() {
    if (INV.open) drawInv();
    bar();
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#cbbd96'; g.font = '600 14px Georgia, serif';
    if (state === 'duel') {
      const O = D.o; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 150, 12, 300, 36);
      g.font = '700 20px Georgia, serif'; g.textAlign = 'right'; g.fillStyle = '#9fd0ff'; g.fillText(`Ty ${O ? O.d : 0}`, W / 2 - 12, 30); g.textAlign = 'center'; g.fillStyle = '#e8d8a8'; g.fillText(':', W / 2, 29);
      g.textAlign = 'left'; g.fillStyle = '#ff9a8a'; g.fillText(`${D.my} Przeciwnik`, W / 2 + 12, 30); g.textAlign = 'center';
      g.font = '600 13px Georgia, serif'; g.fillStyle = '#cbbd96'; g.fillText('do trzech', W / 2, 58);
      if (!pl.alive) { g.font = '700 18px Georgia, serif'; g.fillStyle = '#ff5a4a'; g.fillText(`Wracasz za ${Math.max(0, D.respawn).toFixed(1)} s`, W / 2, H / 2 - 60); }
    } else {
      if (!boss.dead && !INV.open) { const bw = 360, bx = W / 2 - bw / 2; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(bx - 4, 14, bw + 8, 34); g.fillStyle = '#5a0a0a'; g.fillRect(bx, 34, bw, 9); g.fillStyle = '#d23a2a'; g.fillRect(bx, 34, bw * Math.max(0, boss.hp) / boss.max, 9);
        g.fillStyle = '#e8d8a8'; g.font = '700 15px Georgia, serif'; g.textAlign = 'center'; g.fillText('MEFISTO · WŁADCA NIENAWIŚCI', W / 2, 24); }
      if (!INV.open) { const s = Math.floor(runT); g.textAlign = 'left'; g.font = '600 14px Georgia, serif'; g.fillStyle = '#cbbd96';
        g.fillText(`Bieg ${SAVE.runs} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · złoto ${SAVE.gold.toLocaleString('pl-PL')}`, 14, 22);
        if (found.length) { g.textAlign = 'right'; g.font = '600 13px Georgia, serif'; found.forEach((it, i) => { g.fillStyle = COL[it.rar]; g.fillText(it.name, W - 14, 22 + i * 18); }); } }
    }
    if (!INV.open) { g.textAlign = 'left'; g.font = '600 13px Georgia, serif'; g.fillStyle = '#e07060'; g.fillText(`Mikstury ${SAVE.pot}`, 124, H - 78); }
    if (msg && !INV.open) { g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 230, H / 2 - 30, 460, 44); g.fillStyle = state === 'dead' || msg.startsWith('Przegrana') ? '#ff5a4a' : '#e8d8a8'; g.font = '700 20px Georgia, serif'; g.fillText(msg, W / 2, H / 2 - 8); }
    if (noteT > 0) { g.textAlign = 'center'; g.globalAlpha = Math.min(1, noteT * 2); g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(W / 2 - 150, H - 112, 300, 30); g.fillStyle = '#f2ecd8'; g.font = '600 15px Georgia, serif'; g.fillText(noteS, W / 2, H - 97); g.globalAlpha = 1; }
  }
  function drawMenu() {                                                // the TV's home: pick a game
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#15161c'); gr.addColorStop(1, '#2a1f2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f2efe8'; g.font = '600 30px Inter, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('Gry', 64, 92);
    controls(dev === 'pad' ? [['stick', 'wybór'], ['A', 'graj'], ['Y', 'ekwipunek']] : [['←→', 'wybór'], ['Enter', 'graj'], ['I', 'ekwipunek']], 64, 118, 'left', '500 17px Inter, sans-serif', '#9a96a0');
    const tiles = [{ name: 'Mefisto Run', sub: 'teleport, boss, łup' }, { name: 'Pojedynek', sub: 'przez sieć, 2 osoby, do trzech' }];
    tiles.forEach((tl, i) => { const x = 64 + i * 300, y = 160, w = 270, h = 250, on = sel === i, cx = x + w / 2, cy = y + 120;
      g.fillStyle = i ? '#101a2e' : '#3a0f14'; g.fillRect(x, y, w, h);
      const glow = (gx, c) => { const gl = g.createRadialGradient(gx, cy, 5, gx, cy, 110); gl.addColorStop(0, c); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h); };
      if (!i) { glow(cx, 'rgba(255,70,40,.55)');
        g.fillStyle = '#12050a'; g.beginPath(); g.moveTo(cx - 30, cy + 50); g.quadraticCurveTo(cx - 40, cy - 10, cx - 14, cy - 40); g.lineTo(cx + 14, cy - 40); g.quadraticCurveTo(cx + 40, cy - 10, cx + 30, cy + 50); g.fill();
        g.beginPath(); g.arc(cx, cy - 52, 15, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 8, cy - 60); g.lineTo(cx + s * 24, cy - 84); g.lineTo(cx + s * 13, cy - 56); g.fill(); }
        g.fillStyle = '#ffd24a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 5, cy - 53, 2.6, 0, 7); g.fill(); } }
      else { glow(cx - 50, 'rgba(80,160,255,.5)'); glow(cx + 50, 'rgba(255,80,60,.5)');                 // two figures, facing
        for (const [s, c] of [[-1, '#0a1020'], [1, '#1c0a0a']]) { const fx = cx + s * 48; g.fillStyle = c; g.beginPath(); g.moveTo(fx - 16, cy + 50); g.lineTo(fx - 10, cy - 20); g.lineTo(fx + 10, cy - 20); g.lineTo(fx + 16, cy + 50); g.fill();
          g.beginPath(); g.arc(fx, cy - 32, 11, 0, 7); g.fill(); g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(fx - s * 18, cy + 50); g.lineTo(fx - s * 22, cy - 50); g.stroke();
          g.fillStyle = s < 0 ? '#9fe0ff' : '#ff9a6a'; g.beginPath(); g.arc(fx - s * 22, cy - 54, 5, 0, 7); g.fill(); } }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y + h - 62, w, 62);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f2efe8'; g.font = '600 21px Inter, sans-serif'; g.fillText(tl.name, x + 18, y + h - 32); g.fillStyle = '#a8a4ae'; g.font = '500 14px Inter, sans-serif'; g.fillText(tl.sub, x + 18, y + h - 12);
      if (on) { g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(x - 5, y - 5, w + 10, h + 10); } });
    g.fillStyle = '#8f8a96'; g.font = '500 15px Inter, sans-serif'; g.textAlign = 'left';
    g.fillText(`Złoto ${SAVE.gold.toLocaleString('pl-PL')} · biegi ${SAVE.runs} · bossy ${SAVE.kills} · pojedynki wygrane ${SAVE.wins} · przedmioty ${SAVE.bag.length + Object.values(SAVE.eq).filter(Boolean).length}`, 64, 452);
  }
  function drawLobby() {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0f1420'); gr.addColorStop(1, '#241418'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2efe8'; g.font = '600 30px Inter, sans-serif'; g.fillText('Pojedynek', W / 2, 150);
    g.font = '500 18px Inter, sans-serif';
    if (!net || !net.id) { g.fillStyle = '#ffb0a0'; g.fillText('Brak połączenia z innymi odwiedzającymi.', W / 2, 220); g.fillStyle = '#a8a4ae'; g.fillText('Włącz w panelu „Other visitors, live”.', W / 2, 250); }
    else { g.fillStyle = '#d8d4de'; g.fillText('Szukam drugiej osoby przy telewizorze' + '.'.repeat(1 + (t * 2 | 0) % 3), W / 2, 220);
      g.fillStyle = '#a8a4ae'; g.font = '500 16px Inter, sans-serif'; g.fillText('Druga osoba: usiądź na kanapie w salonie, włącz telewizor i wybierz Pojedynek.', W / 2, 256);
      g.fillText('Każdy gra swoim sprzętem z ekwipunku. Pierwszy do trzech wygrywa.', W / 2, 282); }
    if (D.msg) { g.fillStyle = '#ffcf8a'; g.font = '600 16px Inter, sans-serif'; g.fillText(D.msg, W / 2, 330); }
    const s = t * 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 390, 18, s, s + 4.2); g.stroke();
    controls(dev === 'pad' ? [['B', 'wróć']] : [['Esc', 'wróć']], W / 2, H - 40, 'center', '500 16px Inter, sans-serif', '#a8a4ae');
  }
  function frame(dt, inp) { step(Math.min(dt, .05), inp); draw(); tex.needsUpdate = true; }
  // the screen's average colour, for the glow the TV throws into the room (read small, a few times a second)
  const small = document.createElement('canvas'); small.width = 8; small.height = 5; const sg = small.getContext('2d', { willReadFrequently: true }), avg = new THREE.Color();
  function glow() { sg.drawImage(cv, 0, 0, 8, 5); const d = sg.getImageData(0, 0, 8, 5).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
    return avg.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace); }
  // Esc / B: the inventory shut first, then out of the lobby or the duel (true: it was one of those; false: the caller leaves the TV)
  function closeOverlay() {
    if (INV.open) { INV.open = false; return true; }
    if (state === 'lobby') { state = 'menu'; return true; }
    if (state === 'duel') { if (net && D.opp) net.send({ t: 'bye' }, D.opp); D.opp = null; D.o = null; state = 'menu'; msg = null; return true; }
    return false;
  }
  function home() { closeOverlay(); closeOverlay(); state = 'menu'; sel = 0; }
  draw();
  return { canvas: cv, texture: tex, frame, glow, home, closeOverlay, receive, setNet(n) { net = n; }, leave(id) { if (id === D.opp && state === 'duel') endDuel('Przeciwnik wyszedł'); },
    get state() { return state; }, get inv() { return INV.open; }, SAVE, _dbg: () => ({ pl, loot, D }) };   // (_dbg: for tests)
}
