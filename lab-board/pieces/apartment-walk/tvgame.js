// The TV's games, drawn in a canvas the TV shows (its texture). A home screen to pick one, and two, in the dark isometric manner of
// the old action RPGs (our own drawing and names, none of Blizzard's):
// - a boss run: you start at the arena's near end, run and teleport up to the Lord of Hate on his dais, dodge his blood bolts, freeze
//   him down with frost orbs; he bursts, the loot flies out with its names in the colours of their rarity, you run over it to pick it
//   up. The loot has stats (cold damage, cast rate, teleport, life, mana, luck with loot, resistance, run speed): what you wear makes
//   the next run quicker and luckier. An inventory (a figure with its slots and a backpack); runes work from the backpack; a set of
//   four with bonuses; potions. It all keeps in this browser (localStorage).
// - a duel for two visitors of the page, over the ghosts' connection (see ghosts.js), with a draft first: the host picks the mode (each
//   their own hero, a mirror of one, or at random), then each picks a hero (the frost mage, the archer, the knight: each its own attack
//   and move), then one of three things for each of nine slots, then two skills of four; the hero so built is the one that fights.
//   First to three. Each side is the judge of its own figure: it moves itself, fires its own shots, and takes the other's shots as they
//   reach it here (so a hit is never argued about by lag). Everything that comes from the other side is checked and clamped.
// - a training duel against a bot, to try the duel alone: the bot is a second copy of this game, unseen, joined to this one by a line
//   in the page (no network): the same pairing, draft, hits and rematch as with a person. It drafts at random, and in the fight keeps
//   its distance (the knight closes in), circles, fires, now and then dodges a shot with its move, and uses its skills.
// Input each frame: { x, y } the move (-1..1, the pad's left stick or WASD), edges: tele (A / Space), start (Start / Enter), back
// (handled by the caller, through closeOverlay), inv (Y / I), potion (LB / Q), drop (X / X), sk1 (Y / K), sk2 (RB / L), up, down, left,
// right; held: teleHeld, cast (X / J); dev: 'pad' or 'keys', the one last used (the controls on the screen are drawn for it, so a
// pad's A is never taken for the key A, which runs left).

export function createTVGame({ THREE, bot = false }) {                // (bot: the training's opponent: nothing drawn, nothing saved)
  const W = 960, H = 540, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.round(rnd(a, b)), pick = a => a[Math.random() * a.length | 0];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const TW = 64, TH = 32, AW = 17, AH = 13;                           // the tile, the arena in tiles
  const iso = (x, y) => [(x - y) * TW / 2, (x + y) * TH / 2];
  const START = [AW - 2.5, AH - 2.5], FAR = [3, 3];                    // you come in at the near corner (the bottom of the screen); he waits at the far one (the top)
  let dev = 'keys', state = 'menu', sel = 0, t = 0, runT = 0, found = [], msg = null, net = null;
  const pl = { x: START[0], y: START[1], hp: 100, mp: 100, cd: 0, cast: 0, face: [-.7, -.7], moving: 0, flash: 0, hurt: 0, heal: 0, alive: true, sk: [0, 0], shield: 0, haste: 0 };
  const boss = { x: FAR[0], y: FAR[1], hp: 150, max: 150, cd: 1.5, hit: 0, dead: false, burst: 0 };
  let shots = [], fshots = [], bolts = [], loot = [], sparks = [], trail = [], aoes = [];
  const floor = Array.from({ length: AW * AH }, () => ({ l: rnd(.75, 1.1), crack: Math.random() < .12, blood: Math.random() < .06 }));
  const pillars = [[4.5, 8.5], [9, 3], [11, 10.5], [15, 6.5], [7.5, 6]];
  const braziers = [[1.2, 6], [6.5, 1.2], [12.5, 12], [16, 9.5]];

  // ---------- the heroes: each its attack (held), its move (A / Space), and four skills to pick two from ----------
  const CLASSES = {
    mag: { n: 'Mag mrozu', hp: 100, mp: 100, run: 4.2, res: 0, prim: { n: 'lodowy pocisk', lo: 6, hi: 11, sp: 9, cd: .28, mp: 4, r: .55, life: 1.4, c: '#9fe0ff' }, mob: { n: 'teleport', d: 5, cd: .3, mp: 9, tp: 1 },
      sk: [{ id: 'nova', n: 'Nowa mrozu', d: 'krąg 12 lodowych odłamków wokół ciebie', cd: 6, mp: 20 }, { id: 'aoe', n: 'Meteor', d: 'spada tam, gdzie stał przeciwnik, po sekundzie', cd: 8, mp: 25, dm: 30, r: 1.6, dl: 1 },
        { id: 'shield', n: 'Pancerz lodu', d: 'o połowę mniej obrażeń przez 4 s', cd: 12, mp: 20 }, { id: 'heal', n: 'Odnowa', d: '+40% życia od razu', cd: 14, mp: 25 }] },
    lucz: { n: 'Łuczniczka', hp: 90, mp: 80, run: 4.9, res: 0, prim: { n: 'strzała', lo: 4, hi: 8, sp: 14, cd: .2, mp: 2, r: .45, life: 1.1, c: '#fff2c0', arrow: 1 }, mob: { n: 'przewrót', d: 3, cd: .7, mp: 0 },
      sk: [{ id: 'volley', n: 'Salwa', d: '5 strzał wachlarzem', cd: 4, mp: 10 }, { id: 'aoe', n: 'Deszcz strzał', d: 'spada tam, gdzie stał przeciwnik', cd: 8, mp: 20, dm: 24, r: 1.9, dl: .8 },
        { id: 'haste', n: 'Wiatr', d: '+50% szybkości biegu przez 4 s', cd: 10, mp: 10 }, { id: 'heal', n: 'Opatrunek', d: '+40% życia od razu', cd: 14, mp: 20 }] },
    ryc: { n: 'Rycerz', hp: 150, mp: 60, run: 4.0, res: 10, prim: { n: 'rzut młotem', lo: 10, hi: 16, sp: 6.5, cd: .5, mp: 3, r: .75, life: 1.3, c: '#ffd27a' }, mob: { n: 'szarża', d: 4, cd: 1.2, mp: 6 },
      sk: [{ id: 'nova', n: 'Wir', d: 'krąg 10 uderzeń tuż wokół ciebie', cd: 6, mp: 15, short: 1 }, { id: 'shield', n: 'Tarcza', d: 'o połowę mniej obrażeń przez 4 s', cd: 10, mp: 15 },
        { id: 'aoe', n: 'Młot niebios', d: 'uderza tam, gdzie stał przeciwnik', cd: 8, mp: 20, dm: 34, r: 1.4, dl: 1.1 }, { id: 'heal', n: 'Modlitwa', d: '+40% życia od razu', cd: 14, mp: 20 }] },
  };
  const CLS = Object.keys(CLASSES);

  // ---------- what you have: kept in this browser ----------
  const KEY = 'aw.tvgame.v1';
  const SAVE = bot ? { gold: 0, runs: 0, kills: 0, pot: 3, wins: 0, bag: [], eq: {} } : (() => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.bag) && s.eq && typeof s.eq === 'object') return s; } catch {} return null; })()
    || { gold: 0, runs: 0, kills: 0, pot: 3, wins: 0, bag: [], eq: {} };
  const save = () => { if (bot) return; try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch {} };

  // ---------- the loot ----------
  const COL = { gold: '#e8c65a', potion: '#e8e0d8', magic: '#7b8cff', rare: '#f5e25a', set: '#39d34b', unique: '#c7a36a', rune: '#f08a2a' };
  const BASES = { helm: ['Hełm', 'Kaptur', 'Diadem'], amulet: ['Amulet', 'Talizman'], weapon: ['Kostur', 'Różdżka', 'Laska'], armor: ['Szata', 'Kolczuga', 'Płaszcz'],
    gloves: ['Rękawice'], ring: ['Pierścień', 'Sygnet'], belt: ['Pas'], boots: ['Buty', 'Trzewiki'] };
  const AFF = [{ k: 'dmg', n: 'Mrozu', lo: 8, hi: 25 }, { k: 'fcr', n: 'Szybkości', lo: 8, hi: 20 }, { k: 'ftp', n: 'Wiatru', lo: 10, hi: 30 }, { k: 'life', n: 'Życia', lo: 10, hi: 35 },
    { k: 'mana', n: 'Umysłu', lo: 10, hi: 35 }, { k: 'mf', n: 'Szczęścia', lo: 10, hi: 35 }, { k: 'res', n: 'Ochrony', lo: 4, hi: 12 }, { k: 'reg', n: 'Skupienia', lo: 15, hi: 50 }, { k: 'run', n: 'Pośpiechu', lo: 5, hi: 15 }];
  const STAT = { dmg: v => `+${v}% obrażeń`, fcr: v => `+${v}% szybkości ataku`, ftp: v => `+${v}% szybkości ruchu specjalnego`, life: v => `+${v} do życia`, mana: v => `+${v} do many`,
    mf: v => `+${v}% szczęścia do przedmiotów`, res: v => `${v}% odporności`, reg: v => `+${v}% regeneracji many`, run: v => `+${v}% szybkości biegu` };
  const ORDER = Object.keys(STAT);
  const RA = ['Szept', 'Pazur', 'Oko', 'Krąg', 'Cień', 'Znak', 'Kieł', 'Echo'], RB = ['Burzy', 'Zmierzchu', 'Otchłani', 'Popiołu', 'Szronu', 'Nocy', 'Wilka', 'Gwiazd'];
  const UNIQ = [{ slot: 'helm', name: 'Korona Nocy', base: 'Diadem', st: { mf: 40, mana: 25, res: 10 } }, { slot: 'weapon', name: 'Kostur Mrozu', base: 'Kostur', st: { dmg: 60, fcr: 20, mana: 30 } },
    { slot: 'ring', name: 'Pierścień Wiecznego Płomienia', base: 'Pierścień', st: { fcr: 10, dmg: 15, life: 20 } }, { slot: 'armor', name: 'Szata Strażnika', base: 'Szata', st: { res: 20, life: 40 } },
    { slot: 'boots', name: 'Buty Wiatru', base: 'Buty', st: { run: 20, ftp: 25, mf: 15 } }, { slot: 'amulet', name: 'Oko Czarnoksiężnika', base: 'Amulet', st: { fcr: 20, dmg: 20, mf: 20 } }];
  const SETP = [{ slot: 'helm', name: 'Kaptur Wędrowca', base: 'Kaptur', st: { ftp: 15, life: 15 } }, { slot: 'armor', name: 'Płaszcz Wędrowca', base: 'Płaszcz', st: { res: 8, mana: 20 } },
    { slot: 'boots', name: 'Buty Wędrowca', base: 'Buty', st: { run: 10, ftp: 10 } }, { slot: 'gloves', name: 'Rękawice Wędrowca', base: 'Rękawice', st: { fcr: 10, mf: 15 } }];
  const RUNES = [{ name: 'Runa Oth', st: { life: 10 } }, { name: 'Runa Vel', st: { mf: 7 } }, { name: 'Runa Zar', st: { dmg: 6 } }, { name: 'Runa Kel', st: { fcr: 5 } }];
  // one thing: of a kind, for a slot when asked (a unique or a set piece the slot has none of: a rare instead); duel: no luck with loot
  const WEAPONS = { mag: ['Kostur', 'Różdżka', 'Laska'], lucz: ['Łuk', 'Długi łuk', 'Łuk refleksyjny'], ryc: ['Młot', 'Buława', 'Młot bojowy'] };
  function makeItem(kind, want, duel, cls) {                         // (cls: whose weapon it would be)
    if (kind === 'unique') { const u = pick(UNIQ.filter(x => (!want || x.slot === want) && !(x.slot === 'weapon' && cls && cls !== 'mag'))); if (u) { const st = { ...u.st }; if (duel && st.mf) { st.life = (st.life || 0) + st.mf; delete st.mf; } return { kind, slot: u.slot, name: u.name, base: u.base, st }; } kind = 'rare'; }
    if (kind === 'set') { const s = pick(SETP.filter(x => !want || x.slot === want)); if (s) { const st = { ...s.st }; if (duel && st.mf) { st.dmg = (st.dmg || 0) + st.mf; delete st.mf; } return { kind, slot: s.slot, name: s.name, base: s.base, set: 1, st }; } kind = 'rare'; }
    if (kind === 'rune') { const r = pick(RUNES); return { kind, slot: 'rune', name: r.name, base: 'Runa, działa z plecaka', st: { ...r.st } }; }
    const slot = want || pick(Object.keys(BASES)), base = pick(slot === 'weapon' && cls ? WEAPONS[cls] : BASES[slot]), pool = AFF.filter(a => !duel || a.k !== 'mf');
    const affs = shuffle(pool.slice()).slice(0, kind === 'rare' ? irnd(3, 4) : duel ? 2 : irnd(1, 2)), st = {};
    for (const a of affs) st[a.k] = Math.max(1, Math.round(rnd(a.lo, a.hi) * (kind === 'rare' ? 1 : duel ? 1.25 : .8)));   // (a magic one in the draft: fewer, stronger)
    return { kind, slot, base, st, name: kind === 'rare' ? `${pick(RA)} ${pick(RB)}` : `${base} ${affs[0].n}` };
  }
  // what it all adds up to, for a hero in what they wear (and the runes they carry)
  let ST = null;
  function calc(eq, bag, cls) {
    const tt = {}, add = st => { for (const k in st) tt[k] = (tt[k] || 0) + st[k]; }, C = CLASSES[cls];
    for (const k in eq) if (eq[k]) add(eq[k].st);
    for (const it of bag) if (it.slot === 'rune') add(it.st);
    const sets = Object.values(eq).filter(i => i && i.set).length; if (sets >= 2) add({ life: 20 }); if (sets >= 4) add({ dmg: 25, mf: 25 });
    ST = { t: tt, sets, cls, C, maxHp: C.hp + (tt.life || 0), maxMp: C.mp + (tt.mana || 0), dmg: 1 + (tt.dmg || 0) / 100, cast: C.prim.cd / (1 + (tt.fcr || 0) / 100), mob: C.mob.cd / (1 + (tt.ftp || 0) / 100),
      run: C.run * (1 + (tt.run || 0) / 100), mf: tt.mf || 0, res: Math.min(60, C.res + (tt.res || 0)), reg: 14 * (C.mp / 100) * (1 + (tt.reg || 0) / 100) };
    pl.hp = Math.min(pl.hp, ST.maxHp); pl.mp = Math.min(pl.mp, ST.maxMp);
  }
  const recalc = () => calc(SAVE.eq, SAVE.bag, 'mag');                  // the run: the mage, in what the inventory holds
  recalc();

  function reset() {
    recalc();
    Object.assign(pl, { x: START[0], y: START[1], hp: ST.maxHp, mp: ST.maxMp, cd: 0, cast: 0, face: [-.7, -.7], flash: 0, hurt: 0, heal: 0, alive: true, sk: [0, 0], shield: 0, haste: 0 });
    Object.assign(boss, { hp: boss.max, cd: 1.5, hit: 0, dead: false, burst: 0 });
    shots = []; fshots = []; bolts = []; loot = []; sparks = []; trail = []; aoes = []; runT = 0; msg = null; state = 'run'; SAVE.runs++; save();
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

  // ---------- you: moving, your move, your attack, a potion (the same in the run and the duel; tgt: whom you aim at) ----------
  function control(dt, inp, tgt) {
    const C = ST.C, mx = inp.x || 0, my = inp.y || 0, ml = Math.hypot(mx, my), dir = ml > .2, run = ST.run * (pl.haste > 0 ? 1.5 : 1);
    if (dir) { const wx = mx + my, wy = my - mx, wl = Math.hypot(wx, wy); pl.face = [wx / wl, wy / wl];   // the arena's axes are turned 45 degrees to the screen
      pl.x += pl.face[0] * run * dt * Math.min(1, ml); pl.y += pl.face[1] * run * dt * Math.min(1, ml); pl.moving = 1; } else pl.moving = 0;
    pl.cd = Math.max(0, pl.cd - dt); pl.mp = Math.min(ST.maxMp, pl.mp + ST.reg * dt); pl.hp = Math.min(ST.maxHp, pl.hp + 2.5 * dt);
    pl.shield = Math.max(0, pl.shield - dt); pl.haste = Math.max(0, pl.haste - dt); pl.sk = pl.sk.map(v => Math.max(0, v - dt));
    const aim = () => { if (!tgt) return null; const dx = tgt.x - pl.x, dy = tgt.y - pl.y, l = Math.hypot(dx, dy); return l > .01 && l < 12 ? [dx / l, dy / l] : null; };
    let tp = false; const out = [];
    if ((inp.tele || inp.teleHeld) && pl.cd === 0 && pl.mp >= C.mob.mp) {   // the move: where you face, or at them when you stand still
      const f = (!dir && aim()) || pl.face; pl.face = f;
      if (C.mob.tp) trail.push({ x: pl.x, y: pl.y, a: 1 }); else for (let k = 0; k < 4; k++) trail.push({ x: pl.x + f[0] * C.mob.d * k / 4, y: pl.y + f[1] * C.mob.d * k / 4, a: .5 + k * .12 });
      pl.x += f[0] * C.mob.d; pl.y += f[1] * C.mob.d; pl.cd = ST.mob; pl.mp -= C.mob.mp; pl.flash = C.mob.tp ? 1 : .4; tp = true;
      for (let i = 0; i < 14; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-2, 2), vy: rnd(-2, 2), z: rnd(0, 1.5), vz: rnd(1, 3), life: rnd(.3, .6), c: C.mob.tp ? '#9fd8ff' : '#d8cfb8' });
    }
    pl.x = Math.min(AW - .6, Math.max(.6, pl.x)); pl.y = Math.min(AH - .6, Math.max(.6, pl.y));
    for (const [px, py] of pillars) { const dx = pl.x - px, dy = pl.y - py, d = Math.hypot(dx, dy); if (d < .8) { pl.x = px + dx / (d || 1) * .8; pl.y = py + dy / (d || 1) * .8; } }
    pl.cast = Math.max(0, pl.cast - dt);
    if (inp.cast && pl.cast === 0 && pl.mp >= C.prim.mp) { const f = aim() || pl.face; out.push(fire(f, C.prim, 1)); pl.cast = ST.cast; pl.mp -= C.prim.mp; }
    if (inp.potion && state !== 'duel') { if (SAVE.pot > 0 && pl.hp < ST.maxHp) { SAVE.pot--; pl.heal = 1.2; save(); } else if (!SAVE.pot) note('Brak mikstur'); }
    if (pl.heal > 0) { const k = Math.min(dt, pl.heal); pl.hp = Math.min(ST.maxHp, pl.hp + ST.maxHp * .5 * k / 1.2); pl.heal -= dt; }
    pl.flash = Math.max(0, pl.flash - dt * 3); pl.hurt = Math.max(0, pl.hurt - dt * 3);
    return { out, tp, aim };
  }
  function fire(f, P, mul, sp = P.sp, life = P.life) {                 // a shot of yours: where it flies, how hard it hits, how big it is
    const s = { x: pl.x + f[0] * .4, y: pl.y + f[1] * .4, vx: f[0] * sp, vy: f[1] * sp, life, dm: rnd(P.lo, P.hi) * ST.dmg * mul, r: P.r, c: P.c, arrow: P.arrow };
    shots.push(s); return s;
  }
  function skill(i, aimF, tgt) {                                        // the duel's two skills (K / L, Y / RB)
    const s = D.build?.skills[i]; if (!s || pl.sk[i] > 0 || pl.mp < s.mp) { if (s && pl.sk[i] > 0) note(`${s.n}: jeszcze ${pl.sk[i].toFixed(1)} s`); return []; }
    pl.sk[i] = s.cd; pl.mp -= s.mp; const P = ST.C.prim, out = [];
    if (s.id === 'nova') { const n = s.short ? 10 : 12; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; out.push(fire([Math.cos(a), Math.sin(a)], P, s.short ? .9 : .6, s.short ? 5 : 7, s.short ? .45 : 1)); } }
    else if (s.id === 'volley') { const f = aimF() || pl.face, a0 = Math.atan2(f[1], f[0]); for (let k = -2; k <= 2; k++) out.push(fire([Math.cos(a0 + k * .22), Math.sin(a0 + k * .22)], P, .8)); }
    else if (s.id === 'aoe') { const x = tgt ? tgt.x : pl.x + pl.face[0] * 5, y = tgt ? tgt.y : pl.y + pl.face[1] * 5, dm = s.dm * ST.dmg;
      aoes.push({ x, y, r: s.r, t: s.dl, t0: s.dl, dm, mine: true, c: P.c }); net?.send({ t: 'aoe', x: +x.toFixed(2), y: +y.toFixed(2), r: s.r, dm: +dm.toFixed(1), dl: s.dl }, D.opp); }
    else if (s.id === 'shield') pl.shield = 4;
    else if (s.id === 'haste') pl.haste = 4;
    else if (s.id === 'heal') { pl.hp = Math.min(ST.maxHp, pl.hp + ST.maxHp * .4); pop(pl.x, pl.y, '#8aff9a', 16); }
    return out;
  }
  function hurt(n) { pl.hp -= n * (1 - ST.res / 100) * (pl.shield > 0 ? .5 : 1); pl.hurt = 1; for (let i = 0; i < 8; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(.5, 1.5), vz: rnd(0, 3), life: rnd(.2, .5), c: '#ff3b30' }); }
  const pop = (x, y, c, n = 8) => { for (let i = 0; i < n; i++) sparks.push({ x, y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(1, 2), vz: rnd(0, 3), life: rnd(.2, .5), c }); };
  const fly = (list, dt) => { for (const s of list) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; } return list.filter(s => s.life > 0 && s.x > -1 && s.y > -1 && s.x < AW + 1 && s.y < AH + 1); };

  // ---------- the step ----------
  function step(dt, inp) {
    t += dt; if (inp.dev) dev = inp.dev; noteT = Math.max(0, noteT - dt);
    if (inp.inv && state !== 'lobby' && state !== 'duel') { INV.open = !INV.open; INV.confirm = -1; }
    if (INV.open) { invInput(inp); sparksStep(dt); return; }            // (the run waits while you look)
    if (state === 'menu') { if (inp.left) sel = Math.max(0, sel - 1); if (inp.right) sel = Math.min(2, sel + 1); if (inp.tele || inp.start) { if (sel === 0) reset(); else if (sel === 1) { state = 'lobby'; D.seekT = 0; D.msg = ''; } else startTraining(); } return; }
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

  // ---------- the duel: two visitors, over the ghosts' connection; a draft, then the fight ----------
  // phases: mode (the host picks; the guest waits), hero (or mclass: the guest waits for the host's pick in a mirror), items (nine slots,
  // one of three each), skills (two of four), wait (for the other), count (3, 2, 1), fight
  const SLOTS = [['weapon', 'Broń'], ['helm', 'Hełm'], ['armor', 'Zbroja'], ['gloves', 'Rękawice'], ['belt', 'Pas'], ['boots', 'Buty'], ['amulet', 'Amulet'], ['ring1', 'Pierścień'], ['ring2', 'Drugi pierścień']];
  const MODES = [{ id: 'own', n: 'Wybór postaci', d: 'każdy wybiera swoją' }, { id: 'mirror', n: 'Lustro', d: 'obaj tą samą postacią' }, { id: 'rand', n: 'Losowo', d: 'postacie losowane' }];
  const D = { opp: null, host: false, seekT: 0, o: null, my: 0, over: false, sendT: 0, hbT: 0, respawn: 0, tpN: 0, msg: '', ph: 'mode', sel: 0, mode: null, build: null, offer: [], slotI: 0, count: 0 };
  const N = (v, lo, hi, def = 0) => typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  const spawnOf = host => host ? START : FAR;
  const prog = () => !D.build ? 0 : (D.build.cls ? 1 : 0) + Object.keys(D.build.eq).length + D.build.skills.length;   // of 12
  function lobbyStep(dt) {
    D.seekT -= dt; if (net && net.id && D.seekT <= 0) { net.send({ t: 'seek' }); D.seekT = 1; }   // once a second: anyone else at a TV, waiting?
    sparksStep(dt);
  }
  function startDuel(id, host) {
    D.opp = id; D.host = host; D.my = 0; D.over = false; D.respawn = 0; D.tpN = 0; D.msg = ''; D.sel = 0; D.mode = null; D.build = { cls: null, eq: {}, skills: [] }; D.ph = 'mode';
    D.o = { x: 0, y: 0, tx: 0, ty: 0, hp: 100, mh: 100, fx: 0, fy: 0, a: 1, d: 0, tp: 0, seen: t, moving: 0, burst: 0, cls: 'mag', ready: false, prog: 0, sh: 0 };
    shots = []; fshots = []; bolts = []; loot = []; trail = []; aoes = []; msg = null; state = 'duel'; boss.dead = true; boss.burst = 0;
  }
  function endDuel(m) { D.opp = null; D.o = null; recalc(); if (BOT) { BOT = null; net = null; state = 'menu'; note(m); return; } state = 'lobby'; D.msg = m; D.seekT = 1.5; }
  function setMode(m) { D.mode = m; D.sel = 0; if (m === 'rand') { const c = pick(CLS); note(`Wylosowano: ${CLASSES[c].n}`); setHero(c); } else D.ph = D.host || m === 'own' ? 'hero' : 'mclass'; }
  function setHero(c) { D.build.cls = c; calc({}, [], c); toItems(); }
  function toItems() { D.ph = 'items'; D.slotI = 0; offerItems(); }
  function offerItems() {                                               // three for the slot: a magic one, a rare, and one that might be better
    const slot = SLOTS[D.slotI][0].replace(/\d/, ''), r = Math.random();
    const c = D.build.cls; D.offer = [makeItem('magic', slot, true, c), makeItem('rare', slot, true, c), makeItem(r < .4 ? 'unique' : r < .7 ? 'set' : 'rare', slot, true, c)]; D.sel = 0;
  }
  function takeOffer() {
    const b = D.build;
    if (D.ph === 'mode') { if (D.host) { const m = MODES[D.sel].id; net?.send({ t: 'mode', m }, D.opp); setMode(m); } return; }
    if (D.ph === 'hero') { const c = CLS[D.sel]; if (D.mode === 'mirror' && D.host) net?.send({ t: 'cls', c }, D.opp); setHero(c); return; }
    if (D.ph === 'items') { b.eq[SLOTS[D.slotI][0]] = D.offer[D.sel]; calc(b.eq, [], b.cls); if (++D.slotI < SLOTS.length) offerItems(); else { D.ph = 'skills'; D.offer = CLASSES[b.cls].sk.slice(); D.sel = 0; } return; }
    if (D.ph === 'skills') { b.skills.push(D.offer.splice(D.sel, 1)[0]); D.sel = 0; if (b.skills.length >= 2) { D.ph = 'wait'; calc(b.eq, [], b.cls); net?.send({ t: 'ready', c: b.cls }, D.opp); if (D.o.ready) countIn(); } }
  }
  function countIn() { D.ph = 'count'; D.count = 3; }
  function fightStart() {
    D.ph = 'fight'; calc(D.build.eq, [], D.build.cls); const [sx, sy] = spawnOf(D.host), [ox, oy] = spawnOf(!D.host);
    Object.assign(D.o, { x: ox, y: oy, tx: ox, ty: oy, a: 1, d: 0 });
    Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, cd: 0, cast: 0, face: D.host ? [-.7, -.7] : [.7, .7], flash: 0, hurt: 0, heal: 0, alive: true, sk: [0, 0], shield: 0, haste: 0 });
    D.my = 0; D.over = false; msg = null; shots = []; fshots = []; aoes = [];
  }
  function round() { D.my = 0; if (D.o) D.o.d = 0; D.over = false; msg = null; const [sx, sy] = spawnOf(D.host); Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, alive: true, sk: [0, 0] }); D.respawn = 0; }
  function duelStep(dt, inp) {
    const O = D.o; if (!O) return;
    if (t - O.seen > 8) { endDuel('Przeciwnik zniknął'); return; }
    if ((D.hbT -= dt) <= 0 && net) { D.hbT = 1; net.send({ t: 'hb', p: prog() }, D.opp); }           // (so each knows the other is still there, and how far)
    if (D.ph !== 'fight' && D.ph !== 'count') {                         // the draft
      const n = D.ph === 'mode' ? MODES.length : D.ph === 'hero' ? CLS.length : D.offer.length;
      if (inp.left) D.sel = (D.sel + n - 1) % n; if (inp.right) D.sel = (D.sel + 1) % n;
      if (inp.tele || inp.start) takeOffer();
      sparksStep(dt); return;
    }
    if (D.ph === 'count') { D.count -= dt; if (D.count <= 0) fightStart(); return; }
    const k = 1 - Math.exp(-dt * 12); O.moving = Math.hypot(O.tx - O.x, O.ty - O.y) > .05 ? 1 : 0; O.x += (O.tx - O.x) * k; O.y += (O.ty - O.y) * k; O.burst = Math.max(0, O.burst - dt);
    let c = { out: [], tp: false, aim: () => null };
    const live = D.over ? { x: inp.x, y: inp.y, dev: inp.dev } : inp;
    if (pl.alive) { c = control(dt, live, O.a ? O : null); if (!D.over) { if (inp.sk1) c.out.push(...skill(0, c.aim, O.a ? O : null)); if (inp.sk2) c.out.push(...skill(1, c.aim, O.a ? O : null)); } }
    else if ((D.respawn -= dt) <= 0) { const [sx, sy] = spawnOf(D.host); Object.assign(pl, { x: sx, y: sy, hp: ST.maxHp, mp: ST.maxMp, alive: true, flash: 1 }); }
    if (c.tp) D.tpN++;
    if (c.out.length && net) net.send({ t: 'O', l: c.out.slice(0, 16).map(s => [+s.x.toFixed(2), +s.y.toFixed(2), +s.vx.toFixed(2), +s.vy.toFixed(2), +s.dm.toFixed(1), s.r, +s.life.toFixed(2)]) }, D.opp);
    for (const s of shots) if (O.a && s.life > 0 && Math.hypot(s.x - O.x, s.y - O.y) < s.r + .1) { s.life = 0; pop(s.x, s.y, s.c); }   // (only a flash: the hit is theirs to count)
    shots = fly(shots, dt);
    for (const s of fshots) if (pl.alive && !D.over && s.life > 0 && Math.hypot(s.x - pl.x, s.y - pl.y) < s.r) { s.life = 0; hurt(s.dm); }
    fshots = fly(fshots, dt);
    for (const a of aoes) { a.t -= dt; if (a.t <= 0 && !a.done) { a.done = true; pop(a.x, a.y, a.c, 30); if (!a.mine && pl.alive && !D.over && Math.hypot(a.x - pl.x, a.y - pl.y) < a.r) hurt(a.dm); } }
    aoes = aoes.filter(a => a.t > -.5);
    if (pl.alive && pl.hp <= 0) { pl.alive = false; D.my++; D.respawn = 2; pop(pl.x, pl.y, '#ff4a3a', 40); D.sendT = 0; }
    if (!D.over && (D.my >= 3 || O.d >= 3)) { D.over = true; const won = O.d >= 3; if (won && !BOT) { SAVE.wins++; save(); } msg = won ? 'Wygrana! · Start: rewanż' : 'Przegrana · Start: rewanż'; }
    if (D.over && inp.start) { net?.send({ t: 're' }, D.opp); round(); }
    if ((D.sendT -= dt) <= 0 && net) { D.sendT = 1 / 15;
      net.send({ t: 's', x: +pl.x.toFixed(2), y: +pl.y.toFixed(2), h: Math.round(Math.max(0, pl.hp)), m: ST.maxHp, fx: +pl.face[0].toFixed(2), fy: +pl.face[1].toFixed(2), a: pl.alive ? 1 : 0, d: D.my, p: D.tpN, c: pl.cast > ST.cast * .5 ? 1 : 0, sh: pl.shield > 0 ? 1 : 0 }, D.opp); }
    trailStep(dt); sparksStep(dt);
  }
  function receive(d, from) {                                          // what the other side says: checked, clamped
    if (!d || typeof d !== 'object' || typeof from !== 'string' || !net) return;
    if (d.t === 'seek') { if (state === 'lobby' && !D.opp && net.id) { if (net.id < from) { net.send({ t: 'go' }, from); startDuel(from, true); } else net.send({ t: 'seek' }, from); } return; }
    if (d.t === 'go') { if (state === 'lobby' && !D.opp) startDuel(from, false); return; }
    if (from !== D.opp || state !== 'duel' || !D.o) return;
    const O = D.o; O.seen = t;
    if (d.t === 'hb') O.prog = N(d.p, 0, 12, O.prog) | 0;
    else if (d.t === 'mode') { if (!D.host && D.ph === 'mode' && MODES.some(m => m.id === d.m)) setMode(d.m); }
    else if (d.t === 'cls') { if (!D.host && D.ph === 'mclass' && CLASSES[d.c]) setHero(d.c); }
    else if (d.t === 'ready') { if (CLASSES[d.c]) O.cls = d.c; O.ready = true; if (D.ph === 'wait') countIn(); }
    else if (D.ph !== 'fight') return;
    else if (d.t === 's') {
      O.tx = N(d.x, 0, AW, O.tx); O.ty = N(d.y, 0, AH, O.ty); O.hp = N(d.h, 0, 1000, O.hp); O.mh = N(d.m, 1, 1000, 100); O.fx = N(d.fx, -1, 1); O.fy = N(d.fy, -1, 1); O.c = d.c ? 1 : 0; O.sh = d.sh ? 1 : 0;
      const a = d.a ? 1 : 0; if (O.a && !a) { O.burst = 1; pop(O.x, O.y, '#ff4a3a', 40); } O.a = a;
      O.d = N(d.d, 0, 99, O.d) | 0;
      const tp = N(d.p, 0, 1e9, 0) | 0; if (tp !== O.tp) { trail.push({ x: O.x, y: O.y, a: 1 }); O.tp = tp; O.x = O.tx; O.y = O.ty; pop(O.x, O.y, '#ffb0b0', 10); }
      if (Math.hypot(O.tx - O.x, O.ty - O.y) > 3) { O.x = O.tx; O.y = O.ty; }
    } else if (d.t === 'O' && Array.isArray(d.l)) { const P = CLASSES[O.cls].prim;
      for (const q of d.l.slice(0, 16)) if (Array.isArray(q) && fshots.length < 60) fshots.push({ x: N(q[0], 0, AW), y: N(q[1], 0, AH), vx: N(q[2], -15, 15), vy: N(q[3], -15, 15), dm: N(q[4], 0, 40, 8), r: N(q[5], .3, 1, .5), life: N(q[6], .1, 2, 1.2), c: P.c, arrow: P.arrow, foe: 1 }); }
    else if (d.t === 'aoe') { if (aoes.length < 8) { const dl = N(d.dl, .5, 1.5, 1); aoes.push({ x: N(d.x, 0, AW), y: N(d.y, 0, AH), r: N(d.r, .5, 2, 1.5), dm: N(d.dm, 0, 45, 25), t: dl, t0: dl, c: '#ff9a6a' }); } }
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
  function tip(it, x, y, setsOn = ST.sets) {                           // the item's name, kind, stats; returns where it ended
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = COL[it.kind]; g.font = '700 17px Georgia, serif'; g.fillText(it.name, x, y);
    g.fillStyle = '#9d9480'; g.font = '600 13px Georgia, serif'; g.fillText({ magic: 'Magiczny', rare: 'Rzadki', set: 'Zestaw', unique: 'Unikat', rune: 'Runa' }[it.kind] + ' · ' + it.base, x, y + 18); y += 38;
    g.font = '600 14px Georgia, serif'; g.fillStyle = '#8fa8ff';
    for (const k of ORDER) if (it.st[k]) { g.fillText(STAT[k](it.st[k]), x, y); y += 18; }
    if (it.set) { g.fillStyle = '#39d34b'; g.fillText(`Zestaw (${setsOn}/4): 2 · +20 życia, 4 · +25% obr.`, x, y); y += 18; }
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
    const T = ST.t, L = [[`Życie ${Math.round(ST.maxHp)}`, `Mana ${Math.round(ST.maxMp)}`], [`Obrażenia +${T.dmg || 0}%`, `Atak +${T.fcr || 0}%`], [`Teleport +${T.ftp || 0}%`, `Bieg +${T.run || 0}%`],
      [`Szczęście +${ST.mf}%`, `Odporność ${ST.res}%`], [`Złoto ${SAVE.gold.toLocaleString('pl-PL')}`, `Mikstury ${SAVE.pot}`], [`Biegi ${SAVE.runs} · bossy ${SAVE.kills}`, `Pojedynki: ${SAVE.wins} wygr.`]];
    g.font = '600 14px Georgia, serif'; L.forEach(([a, b], i) => { g.fillStyle = i === 4 ? '#e8c65a' : '#cbbd96'; g.fillText(a, 140, 372 + i * 16); g.fillText(b, 292, 372 + i * 16); });
    const it = nodeItem(cur);
    if (it) { tip(it, GRID.x, 302);
      if (cur.bag !== undefined && it.slot !== 'rune') { const k = it.slot === 'ring' ? (SAVE.eq.ring1 ? 'ring1' : null) : it.slot, on = k && SAVE.eq[k];
        if (on) { g.fillStyle = '#6f6857'; g.font = '600 12px Georgia, serif'; g.fillText('Na sobie teraz:', GRID.x + 250, 302); g.save(); g.globalAlpha = .75; tip(on, GRID.x + 250, 320); g.restore(); } } }
    else { g.fillStyle = '#6f6857'; g.font = '600 14px Georgia, serif'; g.fillText(cur.doll ? `${cur.doll.l}: pusto` : 'Pusto', GRID.x, 302); }
  }

  // ---------- the drawing ----------
  function draw() {
    if (state === 'menu') { drawMenu(); if (INV.open) { drawInv(); bar(); } return; }
    if (state === 'lobby') return drawLobby();
    if (state === 'duel' && D.ph !== 'fight') return drawDraft();
    const [cx, cy] = iso(pl.x, pl.y), ox = W / 2 - cx, oy = H / 2 - cy + 30, P = (x, y, z = 0) => { const [a, b] = iso(x, y); return [a + ox, b + oy - z * 24]; };
    g.fillStyle = '#050304'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const f = floor[y * AW + x], [sx, sy] = P(x + .5, y + .5), dais = state !== 'duel' && Math.hypot(x + .5 - boss.x, y + .5 - boss.y) < 2.6;
      const L = f.l * (dais ? 1.25 : 1); g.fillStyle = `rgb(${62 * L | 0},${30 * L | 0},${28 * L | 0})`;
      g.beginPath(); g.moveTo(sx, sy - TH / 2); g.lineTo(sx + TW / 2, sy); g.lineTo(sx, sy + TH / 2); g.lineTo(sx - TW / 2, sy); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.2; g.stroke();
      if (f.crack) { g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.moveTo(sx - 12, sy - 3); g.lineTo(sx + 2, sy + 2); g.lineTo(sx + 14, sy - 4); g.stroke(); }
      if (f.blood) { g.fillStyle = 'rgba(120,6,10,.55)'; g.beginPath(); g.ellipse(sx + 4, sy, 16, 7, 0, 0, 7); g.fill(); } }
    for (let x = 0; x < AW; x++) wallBlock(P(x + .5, 0)); for (let y = 0; y < AH; y++) wallBlock(P(0, y + .5));
    for (const a of aoes) { const [sx, sy] = P(a.x, a.y), k = a.t > 0 ? 1 - a.t / a.t0 : 1;   // where it will fall: a ring closing in
      g.strokeStyle = a.mine ? 'rgba(160,210,255,.7)' : 'rgba(255,90,60,.85)'; g.lineWidth = 2; g.beginPath(); g.ellipse(sx, sy, a.r * TW / 1.41, a.r * TH / 1.41, 0, 0, 7); g.stroke();
      g.fillStyle = a.t > 0 ? (a.mine ? 'rgba(120,180,255,.18)' : 'rgba(255,60,40,.22)') : `rgba(255,200,120,${.6 * (1 + a.t * 2)})`; g.beginPath(); g.ellipse(sx, sy, a.r * TW / 1.41 * (a.t > 0 ? k : 1), a.r * TH / 1.41 * (a.t > 0 ? k : 1), 0, 0, 7); g.fill(); }
    const items = [], O = state === 'duel' ? D.o : null;
    for (const [px, py] of pillars) items.push({ d: px + py, draw: () => { const [sx, sy] = P(px, py), [qx, qy] = P(pl.x, pl.y);   // one in front of you goes see-through
      const over = px + py > pl.x + pl.y && Math.abs(sx - qx) < 34 && qy < sy + 4 && qy > sy - 130; g.globalAlpha = over ? .32 : 1; pillar([sx, sy]); g.globalAlpha = 1; } });
    for (const [bx, by] of braziers) items.push({ d: bx + by, draw: () => brazier(P(bx, by)) });
    if (state !== 'duel' && (!boss.dead || boss.burst > 0)) items.push({ d: boss.x + boss.y, draw: () => drawBoss(P(boss.x, boss.y)) });
    for (const it of loot) if (!it.got && it.dl <= 0) items.push({ d: it.x + it.y - .01, draw: () => drawLoot(it, P) });
    if (pl.alive) items.push({ d: pl.x + pl.y, draw: () => { hero(P(pl.x, pl.y), pl.face, pl.moving, pl.cast > ST.cast * .5, ST.cls, 0); if (pl.shield > 0) bubble(P(pl.x, pl.y), '#9fd0ff'); } });
    if (O && O.a) items.push({ d: O.x + O.y, draw: () => { const [sx, sy] = P(O.x, O.y); hero([sx, sy], [O.fx, O.fy], O.moving, O.c, O.cls, 1); if (O.sh) bubble([sx, sy], '#ffb0a0');
      g.font = '700 13px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff8a7a'; g.fillText(CLASSES[O.cls].n, sx, sy - 80);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(sx - 22, sy - 72, 44, 5); g.fillStyle = '#d23a2a'; g.fillRect(sx - 22, sy - 72, 44 * Math.max(0, O.hp) / O.mh, 5); } });
    items.sort((a, b) => a.d - b.d).forEach(i => i.draw());
    for (const tr of trail) { const [sx, sy] = P(tr.x, tr.y); g.fillStyle = `rgba(140,200,255,${tr.a * .35})`; g.beginPath(); g.ellipse(sx, sy - 22, 10, 26, 0, 0, 7); g.fill(); }
    const shot = s => { const [sx, sy] = P(s.x, s.y, 1);
      if (s.arrow) { const l = Math.hypot(s.vx, s.vy), [ex, ey] = P(s.x - s.vx / l * .7, s.y - s.vy / l * .7, 1); g.strokeStyle = s.c; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(sx, sy); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 2.5, 0, 7); g.fill(); return; }
      const r = 10 + s.r * 8, gr = g.createRadialGradient(sx, sy, 1, sx, sy, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, s.foe ? '#ff9a6a' : s.c || '#9fe0ff'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill(); };
    shots.forEach(shot); fshots.forEach(shot);
    for (const b of bolts) { const [sx, sy] = P(b.x, b.y, 1); const gr = g.createRadialGradient(sx, sy, 1, sx, sy, 13); gr.addColorStop(0, '#ffe0d0'); gr.addColorStop(.35, '#ff3b30'); gr.addColorStop(1, 'rgba(150,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, 13, 0, 7); g.fill(); }
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
  function bubble([sx, sy], c) { g.strokeStyle = c; g.globalAlpha = .5 + .2 * Math.sin(t * 8); g.lineWidth = 2; g.beginPath(); g.ellipse(sx, sy - 30, 22, 36, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
  // a hero: the mage with a staff, the archer with a bow and a hood, the knight in plate with a shield and a hammer; yours blue, theirs red
  function hero([sx, sy], face, moving, casting, cls, team) {
    const bob = moving ? Math.sin(t * 14) * 2 : 0, fx = face[0] - face[1] > 0 ? 1 : -1, [robe, robe2] = team ? ['#4f1d22', '#7f3035'] : ['#22314f', '#35507f'];
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(sx, sy, 14, 6, 0, 0, 7); g.fill();
    if (cls === 'ryc') {
      g.fillStyle = robe; g.beginPath(); g.moveTo(sx - 13, sy - 2); g.lineTo(sx - 11, sy - 40 + bob); g.lineTo(sx + 11, sy - 40 + bob); g.lineTo(sx + 13, sy - 2); g.closePath(); g.fill();
      g.fillStyle = '#8a9098'; g.fillRect(sx - 11, sy - 42 + bob, 22, 16); g.fillStyle = '#9aa1aa'; g.beginPath(); g.arc(sx, sy - 50 + bob, 8, Math.PI, 0); g.fill(); g.fillRect(sx - 8, sy - 50 + bob, 16, 7);   // plate, the helm,
      g.fillStyle = '#1a1c20'; g.fillRect(sx - 6, sy - 48 + bob, 12, 2);                                                                                                  // its visor
      g.fillStyle = robe2; g.strokeStyle = '#c9b27a'; g.lineWidth = 2; g.beginPath(); g.roundRect(sx - fx * 22 - 8, sy - 36 + bob, 16, 22, 4); g.fill(); g.stroke();                    // the shield,
      g.strokeStyle = '#6a5034'; g.lineWidth = 3; const ly = casting ? -66 : -54; g.beginPath(); g.moveTo(sx + fx * 14, sy - 14); g.lineTo(sx + fx * 16, sy + ly + bob); g.stroke();   // the hammer
      g.fillStyle = '#b8bec6'; g.fillRect(sx + fx * 16 - 7, sy + ly - 6 + bob, 14, 9); return;
    }
    g.fillStyle = robe; g.beginPath(); g.moveTo(sx - 11, sy - 2); g.lineTo(sx - 7, sy - 38 + bob); g.lineTo(sx + 7, sy - 38 + bob); g.lineTo(sx + 11, sy - 2); g.closePath(); g.fill();   // the robe
    g.fillStyle = robe2; g.fillRect(sx - 7, sy - 40 + bob, 14, 12);
    g.fillStyle = '#e8c3a0'; g.beginPath(); g.arc(sx, sy - 46 + bob, 6, 0, 7); g.fill();
    if (cls === 'lucz') {
      g.fillStyle = robe2; g.beginPath(); g.moveTo(sx - 8, sy - 42 + bob); g.quadraticCurveTo(sx, sy - 62 + bob, sx + 8, sy - 42 + bob); g.lineTo(sx + 5, sy - 46 + bob); g.quadraticCurveTo(sx, sy - 54 + bob, sx - 5, sy - 46 + bob); g.closePath(); g.fill();   // the hood,
      g.fillStyle = '#5a3a22'; g.fillRect(sx - fx * 9 - 3, sy - 44 + bob, 6, 16);                                                                                                  // the quiver,
      g.strokeStyle = '#8a6a44'; g.lineWidth = 2.5; g.beginPath(); g.arc(sx + fx * 8, sy - 30 + bob, 16, fx > 0 ? -1.2 : Math.PI - 1.2 + 0, fx > 0 ? 1.2 : Math.PI + 1.2); g.stroke();   // the bow,
      g.strokeStyle = 'rgba(240,230,210,.8)'; g.lineWidth = 1; const pull = casting ? fx * -6 : 0, bx = sx + fx * 8 + fx * 16 * Math.cos(1.2);
      g.beginPath(); g.moveTo(bx, sy - 30 + bob - 16 * Math.sin(1.2)); g.lineTo(bx + pull, sy - 30 + bob); g.lineTo(bx, sy - 30 + bob + 16 * Math.sin(1.2)); g.stroke(); return;   // its string
    }
    g.fillStyle = '#6b4a30'; g.beginPath(); g.arc(sx, sy - 49 + bob, 6.5, Math.PI, 0); g.fill();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx + fx * 10, sy - 2); g.lineTo(sx + fx * 12, sy - 58 + bob); g.stroke();   // the staff,
    g.fillStyle = casting ? '#ffffff' : team ? '#ff9a8a' : '#8fd6ff'; g.beginPath(); g.arc(sx + fx * 12, sy - 60 + bob, 4, 0, 7); g.fill();          // its glowing tip
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
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); const gr = g.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x - r, y + r - 2 * r * Math.max(0, Math.min(1, v)), 2 * r, 2 * r * Math.max(0, Math.min(1, v))); g.restore();
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
    orbGauge(70, H - 56, 46, pl.hp / ST.maxHp, '#ff5a4a', '#5a0808'); orbGauge(W - 70, H - 56, 46, pl.mp / ST.maxMp, '#6a7cff', '#0a0e5a');
    const pad = dev === 'pad', F = '600 14px Georgia, serif', C = '#d8cfa8', K = ST.C;
    if (INV.open) controls(pad ? [['stick', 'wybór'], ['A', 'załóż / zdejmij'], ['X', 'wyrzuć'], ['Y', 'zamknij']] : [['←↑↓→', 'wybór'], ['Spacja', 'załóż / zdejmij'], ['X', 'wyrzuć'], ['I', 'zamknij']], W / 2, H - 30, 'center', F, C);
    else if (state === 'duel') controls(pad ? [['stick', 'bieg'], ['A', K.mob.n], ['X', K.prim.n], ['Y', D.build.skills[0]?.n || ''], ['RB', D.build.skills[1]?.n || ''], ['B', 'wyjście']]
      : [['WASD', 'bieg'], ['Spacja', K.mob.n], ['J', K.prim.n], ['K', D.build.skills[0]?.n || ''], ['L', D.build.skills[1]?.n || ''], ['Esc', 'wyjście']], W / 2, H - 30, 'center', '600 13px Georgia, serif', C);
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
      g.font = '600 13px Georgia, serif'; g.fillStyle = '#cbbd96'; g.fillText(`${CLASSES[ST.cls].n} przeciw: ${CLASSES[O?.cls || 'mag'].n}${BOT ? ' (bot)' : ''} · do trzech`, W / 2, 58);
      if (!pl.alive) { g.font = '700 18px Georgia, serif'; g.fillStyle = '#ff5a4a'; g.fillText(`Wracasz za ${Math.max(0, D.respawn).toFixed(1)} s`, W / 2, H / 2 - 60); }
      D.build.skills.forEach((s, i) => { const x = 130 + i * 58, y = H - 118, k = pl.sk[i] / s.cd;          // the skills: their cooldowns
        g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(x, y, 50, 40); g.strokeStyle = k > 0 ? '#5a5040' : '#c9b27a'; g.lineWidth = 2; g.strokeRect(x, y, 50, 40);
        if (k > 0) { g.fillStyle = 'rgba(120,110,90,.5)'; g.fillRect(x, y + 40 * (1 - k), 50, 40 * k); }
        g.fillStyle = k > 0 ? '#8a8270' : '#f2ecd8'; g.font = '700 11px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(dev === 'pad' ? (i ? 'RB' : 'Y') : (i ? 'L' : 'K'), x + 25, y + 13);
        g.font = '600 10px Georgia, serif'; g.fillText(s.n.length > 11 ? s.n.slice(0, 10) + '.' : s.n, x + 25, y + 29); });
    } else {
      if (!boss.dead && !INV.open) { const bw = 360, bx = W / 2 - bw / 2; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(bx - 4, 14, bw + 8, 34); g.fillStyle = '#5a0a0a'; g.fillRect(bx, 34, bw, 9); g.fillStyle = '#d23a2a'; g.fillRect(bx, 34, bw * Math.max(0, boss.hp) / boss.max, 9);
        g.fillStyle = '#e8d8a8'; g.font = '700 15px Georgia, serif'; g.textAlign = 'center'; g.fillText('MEFISTO · WŁADCA NIENAWIŚCI', W / 2, 24); }
      if (!INV.open) { const s = Math.floor(runT); g.textAlign = 'left'; g.font = '600 14px Georgia, serif'; g.fillStyle = '#cbbd96';
        g.fillText(`Bieg ${SAVE.runs} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · złoto ${SAVE.gold.toLocaleString('pl-PL')}`, 14, 22);
        if (found.length) { g.textAlign = 'right'; g.font = '600 13px Georgia, serif'; found.forEach((it, i) => { g.fillStyle = COL[it.rar]; g.fillText(it.name, W - 14, 22 + i * 18); }); }
        g.textAlign = 'left'; g.font = '600 13px Georgia, serif'; g.fillStyle = '#e07060'; g.fillText(`Mikstury ${SAVE.pot}`, 124, H - 78); }
    }
    if (msg && !INV.open) { g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 230, H / 2 - 30, 460, 44); g.fillStyle = state === 'dead' || msg.startsWith('Przegrana') ? '#ff5a4a' : '#e8d8a8'; g.font = '700 20px Georgia, serif'; g.fillText(msg, W / 2, H / 2 - 8); }
    noteDraw();
  }
  function noteDraw() { if (noteT > 0) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = Math.min(1, noteT * 2); g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(W / 2 - 170, H - 112, 340, 30); g.fillStyle = '#f2ecd8'; g.font = '600 15px Georgia, serif'; g.fillText(noteS, W / 2, H - 97); g.globalAlpha = 1; } }
  function drawMenu() {                                                // the TV's home: pick a game
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#15161c'); gr.addColorStop(1, '#2a1f2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f2efe8'; g.font = '600 30px Inter, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('Gry', 64, 92);
    controls(dev === 'pad' ? [['stick', 'wybór'], ['A', 'graj'], ['Y', 'ekwipunek']] : [['←→', 'wybór'], ['Enter', 'graj'], ['I', 'ekwipunek']], 64, 118, 'left', '500 17px Inter, sans-serif', '#9a96a0');
    const tiles = [{ name: 'Mefisto Run', sub: 'teleport, boss, łup' }, { name: 'Pojedynek', sub: 'draft postaci, 2 osoby przez sieć' }, { name: 'Trening', sub: 'pojedynek z botem, do testów' }];
    tiles.forEach((tl, i) => { const x = 64 + i * 300, y = 160, w = 270, h = 250, on = sel === i, cx = x + w / 2, cy = y + 120;
      g.fillStyle = i === 2 ? '#1a1f18' : i ? '#101a2e' : '#3a0f14'; g.fillRect(x, y, w, h);
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
      g.fillText('Potem draft: tryb, postać, po jednym przedmiocie z trzech na każdy slot, dwie umiejętności.', W / 2, 282); }
    if (D.msg) { g.fillStyle = '#ffcf8a'; g.font = '600 16px Inter, sans-serif'; g.fillText(D.msg, W / 2, 330); }
    const s = t * 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 390, 18, s, s + 4.2); g.stroke();
    controls(dev === 'pad' ? [['B', 'wróć']] : [['Esc', 'wróć']], W / 2, H - 40, 'center', '500 16px Inter, sans-serif', '#a8a4ae');
  }
  // ---------- the draft's screens: three (or four) cards, the one picked outlined; your build so far along the bottom ----------
  function card(x, y, w, h, on, fill = '#16110d') { g.fillStyle = fill; g.fillRect(x, y, w, h); g.strokeStyle = on ? '#ffffff' : '#4a3f2c'; g.lineWidth = on ? 4 : 1.5; g.strokeRect(x, y, w, h); }
  function drawDraft() {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#120e0c'); gr.addColorStop(1, '#221416'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const b = D.build, O = D.o, head = (a, s) => { g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#e8d8a8'; g.font = '700 24px Georgia, serif'; g.fillText(a, 48, 58);
      g.fillStyle = '#9d9480'; g.font = '600 15px Georgia, serif'; g.fillText(s, 48, 84); };
    g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillStyle = O?.ready ? '#8fd08a' : '#9d9480'; g.font = '600 14px Georgia, serif';
    g.fillText((BOT ? 'Bot' : 'Przeciwnik') + (O?.ready ? ' gotowy' : `: krok ${O?.prog || 0} z 12`), W - 48, 58);
    const pickLine = dev === 'pad' ? [['stick', 'wybór'], ['A', 'wybierz'], ['B', 'wyjdź']] : [['←→', 'wybór'], ['Spacja', 'wybierz'], ['Esc', 'wyjdź']];
    if (D.ph === 'mode' || D.ph === 'mclass') {
      if (D.ph === 'mclass' || !D.host) { head('Draft', D.ph === 'mclass' ? 'Lustro: gospodarz wybiera postać dla was obu…' : 'Gospodarz wybiera tryb…');
        const s = t * 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 280, 20, s, s + 4.2); g.stroke(); }
      else { head('Draft · tryb', 'Ty wybierasz, jak gracie'); MODES.forEach((m, i) => { const x = 60 + i * 290, y = 130; card(x, y, 260, 230, D.sel === i, '#18120e');
        g.textAlign = 'center'; g.fillStyle = '#f2ecd8'; g.font = '700 22px Georgia, serif'; g.fillText(m.n, x + 130, y + 110); g.fillStyle = '#9d9480'; g.font = '600 15px Georgia, serif'; g.fillText(m.d, x + 130, y + 140); }); }
    } else if (D.ph === 'hero') {
      head('Draft · postać', D.mode === 'mirror' ? 'Lustro: ta postać będzie dla was obu' : 'Każdy wybiera swoją');
      CLS.forEach((c, i) => { const C = CLASSES[c], x = 60 + i * 290, y = 110; card(x, y, 260, 300, D.sel === i, '#18120e');
        hero([x + 130, y + 150], [.7, -.7], 0, D.sel === i && Math.sin(t * 6) > 0, c, 0);
        g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f2ecd8'; g.font = '700 20px Georgia, serif'; g.fillText(C.n, x + 130, y + 196);
        g.fillStyle = '#b8ad90'; g.font = '600 13px Georgia, serif'; [`Życie ${C.hp} · mana ${C.mp} · bieg ${C.run}`, `Atak: ${C.prim.n}`, `Ruch: ${C.mob.n}`, C.res ? `Odporność ${C.res}%` : ''].forEach((l, k) => g.fillText(l, x + 130, y + 222 + k * 18)); });
    } else if (D.ph === 'items' || D.ph === 'skills') {
      const skills = D.ph === 'skills';
      head(skills ? `Draft · umiejętność ${b.skills.length + 1} z 2` : `Draft · ${SLOTS[D.slotI][1]} (${D.slotI + 1} z ${SLOTS.length})`, `${CLASSES[b.cls].n}: ${skills ? 'wybierz jedną' : 'jeden z trzech'}`);
      const n = D.offer.length, w = n > 3 ? 200 : 260, gap = n > 3 ? 18 : 30, x0 = (W - (n * w + (n - 1) * gap)) / 2;
      D.offer.forEach((it, i) => { const x = x0 + i * (w + gap), y = 110; card(x, y, w, 270, D.sel === i);
        if (skills) { g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#f2ecd8'; g.font = '700 19px Georgia, serif'; g.fillText(it.n, x + w / 2, y + 60);
          g.fillStyle = '#b8ad90'; g.font = '600 13px Georgia, serif'; wrap(it.d, x + w / 2, y + 96, w - 24, 18); g.fillStyle = '#8fa8ff'; g.fillText(`co ${it.cd} s · ${it.mp} many`, x + w / 2, y + 230); }
        else { icon(it, x + w / 2, y + 62, 64); tip(it, x + 16, y + 128, Object.values(b.eq).filter(e => e && e.set).length); } });
      // the build so far
      g.textAlign = 'left'; g.fillStyle = '#6f6857'; g.font = '600 12px Georgia, serif'; g.fillText('Twoja postać:', 48, 418);
      SLOTS.forEach(([k], i) => { const x = 48 + i * 44, y = 426, it = b.eq[k]; g.fillStyle = '#120e0b'; g.fillRect(x, y, 38, 38); g.strokeStyle = it ? COL[it.kind] + 'aa' : '#3a3226'; g.lineWidth = 1.5; g.strokeRect(x, y, 38, 38); if (it) icon(it, x + 19, y + 19, 32); });
      g.fillStyle = '#cbbd96'; g.font = '600 13px Georgia, serif'; const T = ST.t;
      g.fillText(`Życie ${Math.round(ST.maxHp)} · mana ${Math.round(ST.maxMp)} · obrażenia +${T.dmg || 0}% · atak +${T.fcr || 0}%`, 460, 434);
      g.fillText(`Ruch +${T.ftp || 0}% · bieg +${T.run || 0}% · odporność ${ST.res}%`, 460, 452);
      if (b.skills.length) g.fillText(`Umiejętności: ${b.skills.map(s => s.n).join(', ')}`, 460, 470);
    } else if (D.ph === 'wait') { head('Gotowe', `${CLASSES[b.cls].n}: ${b.skills.map(s => s.n).join(', ')}. Czekam na przeciwnika…`);
      const s = t * 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, 280, 20, s, s + 4.2); g.stroke(); }
    else if (D.ph === 'count') { g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2ecd8'; g.font = '700 120px Georgia, serif'; g.fillText(String(Math.ceil(D.count)), W / 2, H / 2 - 20);
      g.font = '600 18px Georgia, serif'; g.fillStyle = '#cbbd96'; g.fillText(`${CLASSES[b.cls].n} przeciw: ${CLASSES[O.cls].n}`, W / 2, H / 2 + 70); }
    if (['mode', 'hero', 'items', 'skills'].includes(D.ph) && (D.ph !== 'mode' || D.host)) controls(pickLine, W / 2, H - 28, 'center', '600 14px Georgia, serif', '#d8cfa8');
    else controls(dev === 'pad' ? [['B', 'wyjdź']] : [['Esc', 'wyjdź']], W / 2, H - 28, 'center', '600 14px Georgia, serif', '#d8cfa8');
    noteDraw();
  }
  function wrap(s, x, y, w, lh) { const words = s.split(' '); let line = ''; for (const wd of words) { const tl = line ? line + ' ' + wd : wd; if (g.measureText(tl).width > w && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = tl; } if (line) g.fillText(line, x, y); }
  function frame(dt, inp) {
    dt = Math.min(dt, .05); step(dt, inp);
    if (BOT) { const B = BOT; B.toBot.splice(0).forEach(d => B.g.receive(d, 'me-local')); B.g.frame(dt, botInput(dt)); B.toMe.splice(0).forEach(d => receive(d, 'zz-bot')); }   // (the line to the bot: a frame's delay each way)
    if (!bot) { draw(); tex.needsUpdate = true; }
  }
  // ---------- the training: a bot to duel ----------
  let BOT = null;
  function startTraining() {
    const b = createTVGame({ THREE, bot: true }), B = { g: b, toBot: [], toMe: [], t: 0, side: 1, sideT: 0 };
    const clone = d => JSON.parse(JSON.stringify(d));                 // (as the network would: no shared objects)
    BOT = B; net = { id: 'me-local', send: d => B.toBot.push(clone(d)) }; b.setNet({ id: 'zz-bot', send: d => B.toMe.push(clone(d)) }); b.lobby();
    state = 'lobby'; D.seekT = 0; D.msg = '';
  }
  function botInput(dt) {                                              // what the bot presses this frame
    const B = BOT, b = B.g._dbg(), Db = b.D, p = b.pl, inp = { x: 0, y: 0, dev: 'pad' };
    if (B.g.state !== 'duel' || !Db.o) return inp;
    if (Db.ph !== 'fight') { if ((B.t -= dt) <= 0) { B.t = rnd(.4, .9); if (Math.random() < .55) inp.right = true; inp.tele = true; } return inp; }   // the draft: a moment's thought, a pick
    if (!p.alive || Db.over) return inp;
    const O = Db.o, dx = O.x - p.x, dy = O.y - p.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, knight = b.ST.cls === 'ryc', want = knight ? 2.2 : 6;
    if ((B.sideT -= dt) <= 0) { B.sideT = rnd(1, 2.2); B.side = -B.side; }
    let wx = -uy * B.side * .8, wy = ux * B.side * .8;                 // circling
    if (d > want + 1.2) { wx += ux; wy += uy; } else if (d < want - 1.2) { wx -= ux; wy -= uy; }
    const threat = b.fshots.some(s => { const rx = p.x - s.x, ry = p.y - s.y, dist = Math.hypot(rx, ry); return dist < 2.4 && rx * s.vx + ry * s.vy > 0; });
    if (threat && Math.random() < .07) { wx = -uy * B.side; wy = ux * B.side; inp.tele = true; }   // a shot coming: out of its way
    if (knight && d > 5 && Math.random() < .03) { wx = ux; wy = uy; inp.tele = true; }             // the knight charges in
    const l = Math.hypot(wx, wy); if (l > .01) { inp.x = THREE.MathUtils.clamp((wx - wy) / l * .72, -1, 1); inp.y = THREE.MathUtils.clamp((wx + wy) / l * .72, -1, 1); }   // (the arena's axes to the screen's)
    inp.cast = d < 11 && Math.random() < .8;
    if (Math.random() < .012) inp.sk1 = true; if (Math.random() < .009) inp.sk2 = true;
    return inp;
  }
  // the screen's average colour, for the glow the TV throws into the room (read small, a few times a second)
  const small = document.createElement('canvas'); small.width = 8; small.height = 5; const sg = small.getContext('2d', { willReadFrequently: true }), avg = new THREE.Color();
  function glow() { sg.drawImage(cv, 0, 0, 8, 5); const d = sg.getImageData(0, 0, 8, 5).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
    return avg.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace); }
  // Esc / B: the inventory shut first, then out of the lobby or the duel (true: it was one of those; false: the caller leaves the TV)
  function closeOverlay() {
    if (INV.open) { INV.open = false; return true; }
    if (state === 'lobby') { state = 'menu'; if (BOT) { BOT = null; net = null; } return true; }
    if (state === 'duel') { if (net && D.opp) net.send({ t: 'bye' }, D.opp); D.opp = null; D.o = null; state = 'menu'; msg = null; recalc(); if (BOT) { BOT = null; net = null; } return true; }
    return false;
  }
  function home() { closeOverlay(); closeOverlay(); state = 'menu'; sel = 0; }
  if (!bot) draw();
  return { canvas: cv, texture: tex, frame, glow, home, closeOverlay, receive, setNet(n) { if (!BOT) net = n; }, lobby() { state = 'lobby'; D.seekT = 0; D.msg = ''; },   // (training: the page's connection waits)
    get training() { return !!BOT; }, leave(id) { if (id === D.opp && state === 'duel') endDuel('Przeciwnik wyszedł'); },
    get state() { return state; }, get inv() { return INV.open; }, SAVE, _dbg: () => ({ pl, loot, D, ST, fshots }) };   // (_dbg: for tests)
}
