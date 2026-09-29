// The TV's games, drawn in a canvas the TV shows (its texture). A home screen to pick a game, and one game: a boss run in the dark
// isometric manner of the old action RPGs (our own drawing and names, none of Blizzard's): you start at the arena's far end, run and
// teleport up to the Lord of Hate on his dais, dodge his blood bolts, freeze him down with frost orbs; he bursts, the loot flies
// out with its names in the colours of their rarity, you run over it to pick it up, and Start is the next run.
// Input each frame: { x, y } the move (-1..1, the pad's left stick or WASD), and edges: tele (A / Space), cast (X / J, held), start
// (Start / Enter), back (B / Esc: the caller handles leaving the TV); teleHeld, cast: held; dev: 'pad' or 'keys', the one last used
// (the controls on the screen are drawn for it, so a pad's A is never mistaken for the key A, which runs left).

export function createTVGame({ THREE }) {
  const W = 960, H = 540, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TW = 64, TH = 32, AW = 17, AH = 13;                           // the tile, the arena in tiles
  const iso = (x, y) => [(x - y) * TW / 2, (x + y) * TH / 2];
  let dev = 'keys', state = 'menu', sel = 0, t = 0, runN = 0, runT = 0, found = [], goldSum = 0, msg = null;
  const START = [AW - 2.5, AH - 2.5];                                  // you come in at the near corner (the bottom of the screen); he waits at the far one (the top)
  const pl = { x: START[0], y: START[1], hp: 100, mp: 100, cd: 0, cast: 0, face: [1, -1], moving: 0, flash: 0 };
  const boss = { x: 3, y: 3, hp: 100, max: 100, cd: 1.5, hit: 0, dead: false, burst: 0 };
  let shots = [], bolts = [], loot = [], sparks = [], trail = [];
  // the floor, once: dark red stone, cracks, blood
  const floor = Array.from({ length: AW * AH }, () => ({ l: rnd(.75, 1.1), crack: Math.random() < .12, blood: Math.random() < .06 }));
  const pillars = [[4.5, 8.5], [9, 3], [11, 10.5], [15, 6.5], [7.5, 6]];
  const braziers = [[1.2, 6], [6.5, 1.2], [12.5, 12], [16, 9.5]];

  function reset() {
    Object.assign(pl, { x: START[0], y: START[1], hp: 100, mp: 100, cd: 0, cast: 0, face: [1, -1], flash: 0 });
    Object.assign(boss, { hp: 100, cd: 1.5, hit: 0, dead: false, burst: 0 });
    shots = []; bolts = []; loot = []; sparks = []; trail = []; runN++; runT = 0; msg = null; state = 'run';
  }
  const NAMES = {
    magic: ['Pierścień Szybkości', 'Amulet Czujności', 'Rękawice Zręczności', 'Pas Wytrwałości', 'Talizman Ognia'],
    rare: ['Upiorny Krąg', 'Szept Burzy', 'Pazur Zmierzchu', 'Oko Otchłani', 'Korona Popiołu'],
    set: ['Hełm Wędrowca (zestaw)', 'Płaszcz Wędrowca (zestaw)', 'Buty Pielgrzyma (zestaw)'],
    unique: ['Korona Nocy', 'Kostur Mrozu', 'Pierścień Wiecznego Płomienia', 'Szata Strażnika', 'Tarcza Świtu'],
    rune: ['Runa Oth', 'Runa Vel', 'Runa Zar', 'Runa Kel'],
  };
  const COL = { gold: '#e8c65a', magic: '#7b8cff', rare: '#f5e25a', set: '#39d34b', unique: '#c7a36a', rune: '#f08a2a', junk: '#d8d8d8' };
  function drop() {                                                    // the loot: gold, a few commons and magics, sometimes better
    const out = [{ kind: 'gold', name: `${Math.round(rnd(300, 2400))} złota`, n: 0 }];
    const n = 4 + (Math.random() * 4 | 0);
    for (let i = 0; i < n; i++) { const r = Math.random(); const kind = r < .02 ? 'unique' : r < .05 ? 'rune' : r < .1 ? 'set' : r < .25 ? 'rare' : r < .6 ? 'magic' : 'junk';
      out.push({ kind, name: kind === 'junk' ? ['Mikstura Leczenia', 'Zwój Portalu', 'Strzały', 'Klejnot'][Math.random() * 4 | 0] : NAMES[kind][Math.random() * NAMES[kind].length | 0] }); }
    if (Math.random() < .25) out.push({ kind: 'unique', name: NAMES.unique[Math.random() * NAMES.unique.length | 0] });   // now and then, the good one
    return out.map((o, i) => { const a = i / out.length * Math.PI * 2 + rnd(-.3, .3), d = rnd(1.1, 2.8);
      return { ...o, sx: boss.x, sy: boss.y, x: Math.min(AW - .8, Math.max(.8, boss.x + Math.cos(a) * d)), y: Math.min(AH - .8, Math.max(.8, boss.y + Math.sin(a) * d)), f: 0, dl: i * .09 }; });
  }

  // ---------- the step ----------
  function step(dt, inp) {
    t += dt; if (inp.dev) dev = inp.dev;
    if (state === 'menu') { if (inp.left) sel = 0; if (inp.right) sel = 1; if ((inp.tele || inp.start) && sel === 0) reset(); return; }
    if (state === 'dead') { if (inp.start || inp.tele) reset(); sparksStep(dt); return; }
    runT += boss.dead ? 0 : dt;
    // move
    let mx = inp.x, my = inp.y; const ml = Math.hypot(mx, my);
    const dir = ml > .2 ? [mx / ml, my / ml] : null;                   // screen direction; the arena's axes are turned 45 degrees to the screen
    if (dir) { const wx = dir[0] + dir[1], wy = dir[1] - dir[0], wl = Math.hypot(wx, wy); pl.face = [wx / wl, wy / wl]; }
    if (dir) { pl.x += pl.face[0] * 4.2 * dt * Math.min(1, ml); pl.y += pl.face[1] * 4.2 * dt * Math.min(1, ml); pl.moving = 1; } else pl.moving = 0;
    pl.cd = Math.max(0, pl.cd - dt); pl.mp = Math.min(100, pl.mp + 14 * dt); pl.hp = Math.min(100, pl.hp + 2.5 * dt); pl.flash = Math.max(0, pl.flash - dt * 3);
    // teleport: 5 tiles where you face (or towards him, not moving), if the mana and the moment allow
    if ((inp.tele || inp.teleHeld) && pl.cd === 0 && pl.mp >= 9) {                // (held: again as soon as it can)
      let f = pl.face; if (!dir && !boss.dead) { const dx = boss.x - pl.x, dy = boss.y - pl.y, l = Math.hypot(dx, dy); f = [dx / l, dy / l]; pl.face = f; }
      trail.push({ x: pl.x, y: pl.y, a: 1 });
      pl.x += f[0] * 5; pl.y += f[1] * 5; pl.cd = .3; pl.mp -= 9; pl.flash = 1;
      for (let i = 0; i < 14; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-2, 2), vy: rnd(-2, 2), z: rnd(0, 1.5), vz: rnd(1, 3), life: rnd(.3, .6), c: '#9fd8ff' });
    }
    pl.x = Math.min(AW - .6, Math.max(.6, pl.x)); pl.y = Math.min(AH - .6, Math.max(.6, pl.y));
    for (const [px, py] of pillars) { const dx = pl.x - px, dy = pl.y - py, d = Math.hypot(dx, dy); if (d < .8) { pl.x = px + dx / d * .8; pl.y = py + dy / d * .8; } }
    // cast: frost orbs, towards him when he is near
    pl.cast = Math.max(0, pl.cast - dt);
    if (inp.cast && pl.cast === 0 && pl.mp >= 4) {
      let f = pl.face; if (!boss.dead) { const dx = boss.x - pl.x, dy = boss.y - pl.y, l = Math.hypot(dx, dy); if (l < 12) f = [dx / l, dy / l]; }
      shots.push({ x: pl.x + f[0] * .4, y: pl.y + f[1] * .4, vx: f[0] * 9, vy: f[1] * 9, life: 1.4 }); pl.cast = .28; pl.mp -= 4;
    }
    for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (!boss.dead && Math.hypot(s.x - boss.x, s.y - boss.y) < .9) { s.life = 0; boss.hp -= rnd(6, 11); boss.hit = 1;
        for (let i = 0; i < 8; i++) sparks.push({ x: s.x, y: s.y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(1, 2), vz: rnd(0, 3), life: rnd(.2, .5), c: '#bfe9ff' }); } }
    shots = shots.filter(s => s.life > 0);
    // he: bobs on his dais; when you are near, blood bolts at you every 1.3 s, a fan of three when he is hurt
    boss.hit = Math.max(0, boss.hit - dt * 4);
    if (!boss.dead) {
      boss.cd -= dt; const d = Math.hypot(pl.x - boss.x, pl.y - boss.y);
      if (boss.cd <= 0 && d < 11) { const n = boss.hp < 50 ? 3 : 1, a0 = Math.atan2(pl.y - boss.y, pl.x - boss.x);
        for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * .28; bolts.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, life: 2.4 }); }
        boss.cd = rnd(1.1, 1.5); }
      if (boss.hp <= 0) { boss.dead = true; boss.burst = 1; loot = drop();
        for (let i = 0; i < 60; i++) sparks.push({ x: boss.x, y: boss.y, vx: rnd(-5, 5), vy: rnd(-5, 5), z: rnd(1, 3), vz: rnd(1, 6), life: rnd(.5, 1.4), c: Math.random() < .5 ? '#ff4a3a' : '#ffb35a' }); }
    }
    boss.burst = Math.max(0, boss.burst - dt * .8);
    for (const b of bolts) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (Math.hypot(b.x - pl.x, b.y - pl.y) < .55) { b.life = 0; pl.hp -= 14; for (let i = 0; i < 8; i++) sparks.push({ x: pl.x, y: pl.y, vx: rnd(-3, 3), vy: rnd(-3, 3), z: rnd(.5, 1.5), vz: rnd(0, 3), life: rnd(.2, .5), c: '#ff3b30' }); } }
    bolts = bolts.filter(b => b.life > 0 && b.x > -1 && b.y > -1 && b.x < AW + 1 && b.y < AH + 1);
    if (pl.hp <= 0) { state = 'dead'; msg = 'Zginąłeś · Start: jeszcze raz'; }
    // the loot flies out, lands; you pick it up by running over it
    for (const it of loot) { if (it.dl > 0) { it.dl -= dt; continue; } it.f = Math.min(1, it.f + dt * 1.8);
      if (it.f >= 1 && !it.got && Math.hypot(it.x - pl.x, it.y - pl.y) < .75) { it.got = true; if (it.kind === 'gold') goldSum += parseInt(it.name.replace(/\D/g, ''), 10); else found.unshift(it); found = found.slice(0, 6); } }
    if (boss.dead && loot.length && loot.every(i => i.got) && !msg) msg = 'Wszystko zebrane · Start: następny bieg';
    if (inp.start && boss.dead) reset();
    for (const tr of trail) tr.a -= dt * 2.5; trail = trail.filter(tr => tr.a > 0);
    sparksStep(dt);
  }
  function sparksStep(dt) { for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 9 * dt; if (s.z < 0) { s.z = 0; s.vz *= -.3; } s.life -= dt; } sparks = sparks.filter(s => s.life > 0); }

  // ---------- the drawing ----------
  function draw() {
    if (state === 'menu') return drawMenu();
    const [cx, cy] = iso(pl.x, pl.y), ox = W / 2 - cx, oy = H / 2 - cy + 30, P = (x, y, z = 0) => { const [a, b] = iso(x, y); return [a + ox, b + oy - z * 24]; };
    g.fillStyle = '#050304'; g.fillRect(0, 0, W, H);
    // the floor
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const f = floor[y * AW + x], [sx, sy] = P(x + .5, y + .5), dais = Math.hypot(x + .5 - boss.x, y + .5 - boss.y) < 2.6;
      const L = f.l * (dais ? 1.25 : 1); g.fillStyle = `rgb(${62 * L | 0},${30 * L | 0},${28 * L | 0})`;
      g.beginPath(); g.moveTo(sx, sy - TH / 2); g.lineTo(sx + TW / 2, sy); g.lineTo(sx, sy + TH / 2); g.lineTo(sx - TW / 2, sy); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.2; g.stroke();
      if (f.crack) { g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.moveTo(sx - 12, sy - 3); g.lineTo(sx + 2, sy + 2); g.lineTo(sx + 14, sy - 4); g.stroke(); }
      if (f.blood) { g.fillStyle = 'rgba(120,6,10,.55)'; g.beginPath(); g.ellipse(sx + 4, sy, 16, 7, 0, 0, 7); g.fill(); } }
    // the arena's rim: a low wall of grey-green stone along its back edges
    for (let x = 0; x < AW; x++) wallBlock(P(x + .5, 0), P); for (let y = 0; y < AH; y++) wallBlock(P(0, y + .5), P);
    // things, back to front
    const items = [];
    for (const [px, py] of pillars) items.push({ d: px + py, draw: () => { const [sx, sy] = P(px, py), [qx, qy] = P(pl.x, pl.y);   // one in front of you goes see-through
      const over = px + py > pl.x + pl.y && Math.abs(sx - qx) < 34 && qy < sy + 4 && qy > sy - 130; g.globalAlpha = over ? .32 : 1; pillar([sx, sy]); g.globalAlpha = 1; } });
    for (const [bx, by] of braziers) items.push({ d: bx + by, draw: () => brazier(P(bx, by)) });
    if (!boss.dead || boss.burst > 0) items.push({ d: boss.x + boss.y, draw: () => drawBoss(P(boss.x, boss.y)) });
    for (const it of loot) if (!it.got && it.dl <= 0) items.push({ d: it.x + it.y - .01, draw: () => drawItem(it, P) });
    items.push({ d: pl.x + pl.y, draw: () => drawPlayer(P(pl.x, pl.y)) });
    items.sort((a, b) => a.d - b.d).forEach(i => i.draw());
    for (const tr of trail) { const [sx, sy] = P(tr.x, tr.y); g.fillStyle = `rgba(140,200,255,${tr.a * .35})`; g.beginPath(); g.ellipse(sx, sy - 22, 10, 26, 0, 0, 7); g.fill(); }
    for (const s of shots) { const [sx, sy] = P(s.x, s.y, 1); const gr = g.createRadialGradient(sx, sy, 1, sx, sy, 14); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, '#9fe0ff'); gr.addColorStop(1, 'rgba(80,160,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, 14, 0, 7); g.fill(); }
    for (const b of bolts) { const [sx, sy] = P(b.x, b.y, 1); const gr = g.createRadialGradient(sx, sy, 1, sx, sy, 13); gr.addColorStop(0, '#ffe0d0'); gr.addColorStop(.35, '#ff3b30'); gr.addColorStop(1, 'rgba(150,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, 13, 0, 7); g.fill(); }
    for (const s of sparks) { const [sx, sy] = P(s.x, s.y, s.z); g.fillStyle = s.c; g.globalAlpha = Math.min(1, s.life * 3); g.fillRect(sx - 1.5, sy - 1.5, 3, 3); g.globalAlpha = 1; }
    // the light: your radius and the braziers', the rest in the dark
    const [lx, ly] = P(pl.x, pl.y, .8); g.save(); g.globalCompositeOperation = 'multiply';
    const dark = g.createRadialGradient(lx, ly, 40, lx, ly, 430); dark.addColorStop(0, '#ffffff'); dark.addColorStop(.55, '#8a7a78'); dark.addColorStop(1, '#141012'); g.fillStyle = dark; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [bx, by] of braziers) { const [sx, sy] = P(bx, by, 1.4), fl = .8 + .2 * Math.sin(t * 13 + bx); const gl = g.createRadialGradient(sx, sy, 2, sx, sy, 150); gl.addColorStop(0, `rgba(255,150,60,${.35 * fl})`); gl.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gl; g.fillRect(sx - 150, sy - 150, 300, 300); }
    if (!boss.dead) { const [sx, sy] = P(boss.x, boss.y, 1.2), gl = g.createRadialGradient(sx, sy, 5, sx, sy, 120); gl.addColorStop(0, 'rgba(255,40,30,.28)'); gl.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gl; g.fillRect(sx - 120, sy - 120, 240, 240); }
    if (boss.burst > 0) { const [sx, sy] = P(boss.x, boss.y, 1), gl = g.createRadialGradient(sx, sy, 5, sx, sy, 260 * (1 - boss.burst) + 40); gl.addColorStop(0, `rgba(255,120,60,${boss.burst * .7})`); gl.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
    for (const it of loot) if (!it.got && it.dl <= 0 && it.kind === 'unique' && it.f >= 1) { const [sx, sy] = P(it.x, it.y); const gl = g.createLinearGradient(sx, sy - 220, sx, sy); gl.addColorStop(0, 'rgba(255,210,120,0)'); gl.addColorStop(1, 'rgba(255,210,120,.45)'); g.fillStyle = gl; g.fillRect(sx - 9, sy - 220, 18, 220); }   // a pillar of light over the good one
    if (pl.flash > 0) { g.fillStyle = `rgba(160,210,255,${pl.flash * .18})`; g.fillRect(0, 0, W, H); }
    g.restore();
    { const placed = [];                                              // the labels: each nudged up until it sits clear of the ones placed before
      for (const it of loot.filter(i => !i.got && i.dl <= 0 && i.f >= 1).sort((a, b) => (b.x + b.y) - (a.x + a.y))) {
        const [sx, sy] = P(it.x, it.y); g.font = it.kind === 'unique' || it.kind === 'set' ? '700 15px Georgia, serif' : '600 14px Georgia, serif';
        const w = g.measureText(it.name).width + 12; let y = sy - 30;
        for (let guard = 0; guard < 40; guard++) { const hit = placed.find(r => Math.abs(r.x - sx) < (r.w + w) / 2 && Math.abs(r.y - y) < 21); if (!hit) break; y = hit.y - 21; }
        placed.push({ x: sx, y, w }); label(it, sx, y, w); } }
    hud();
  }
  function wallBlock([sx, sy]) { g.fillStyle = '#3a423f'; g.fillRect(sx - 30, sy - 40, 60, 40); g.fillStyle = '#4c5652'; g.fillRect(sx - 30, sy - 46, 60, 8); g.strokeStyle = 'rgba(0,0,0,.4)'; g.strokeRect(sx - 30, sy - 40, 60, 40); }
  function pillar([sx, sy]) { g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(sx, sy, 26, 12, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(sx - 18, 0, sx + 18, 0); gr.addColorStop(0, '#2e3533'); gr.addColorStop(.5, '#59625e'); gr.addColorStop(1, '#262c2a'); g.fillStyle = gr; g.fillRect(sx - 18, sy - 120, 36, 120);
    g.fillStyle = '#6b7470'; g.fillRect(sx - 24, sy - 128, 48, 10); g.fillRect(sx - 22, sy - 8, 44, 8); }
  function brazier([sx, sy]) { g.fillStyle = '#2a2622'; g.fillRect(sx - 3, sy - 44, 6, 44); g.fillStyle = '#3d3630'; g.beginPath(); g.ellipse(sx, sy - 46, 12, 5, 0, 0, 7); g.fill();
    const fl = Math.sin(t * 17 + sx) * 3; g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(sx - 9, sy - 48); g.quadraticCurveTo(sx - 6 + fl, sy - 66, sx + fl, sy - 80); g.quadraticCurveTo(sx + 8, sy - 64, sx + 9, sy - 48); g.fill();
    g.fillStyle = '#ffe7a0'; g.beginPath(); g.ellipse(sx + fl * .4, sy - 56, 3.5, 7, 0, 0, 7); g.fill(); }
  function drawPlayer([sx, sy]) {
    const bob = pl.moving ? Math.sin(t * 14) * 2 : 0, fx = pl.face[0] - pl.face[1] > 0 ? 1 : -1;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(sx, sy, 14, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#22314f'; g.beginPath(); g.moveTo(sx - 11, sy - 2); g.lineTo(sx - 7, sy - 38 + bob); g.lineTo(sx + 7, sy - 38 + bob); g.lineTo(sx + 11, sy - 2); g.closePath(); g.fill();   // the robe
    g.fillStyle = '#35507f'; g.fillRect(sx - 7, sy - 40 + bob, 14, 12);
    g.fillStyle = '#e8c3a0'; g.beginPath(); g.arc(sx, sy - 46 + bob, 6, 0, 7); g.fill(); g.fillStyle = '#6b4a30'; g.beginPath(); g.arc(sx, sy - 49 + bob, 6.5, Math.PI, 0); g.fill();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx + fx * 10, sy - 2); g.lineTo(sx + fx * 12, sy - 58 + bob); g.stroke();   // the staff,
    g.fillStyle = pl.cast > .15 ? '#ffffff' : '#8fd6ff'; g.beginPath(); g.arc(sx + fx * 12, sy - 60 + bob, 4, 0, 7); g.fill();                        // its glowing tip
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
  function drawItem(it, P) {
    const k = it.f, x = it.sx + (it.x - it.sx) * k, y = it.sy + (it.y - it.sy) * k, [sx, sy] = P(x, y, Math.sin(k * Math.PI) * 2.2);
    g.fillStyle = it.kind === 'gold' ? '#e8c65a' : COL[it.kind]; g.save(); g.translate(sx, sy); g.rotate(k * 6);
    if (it.kind === 'gold') { for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse((i - 2) * 3, (i % 2) * 2, 4, 2.2, 0, 0, 7); g.fill(); } }
    else if (it.kind === 'rune') { g.fillRect(-5, -6, 10, 12); } else { g.beginPath(); g.moveTo(0, -8); g.lineTo(7, 0); g.lineTo(0, 8); g.lineTo(-7, 0); g.closePath(); g.fill(); }
    g.restore();
  }
  function label(it, sx, y, w) {                                        // (the font already set)
    g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(sx - w / 2, y, w, 20);
    g.fillStyle = COL[it.kind]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.name, sx, y + 10);
  }
  function orb(x, y, r, v, c0, c1) { g.fillStyle = '#120c0a'; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); const gr = g.createRadialGradient(x - r * .3, y - r * .3, 2, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x - r, y + r - 2 * r * v, 2 * r, 2 * r * v); g.restore();
    g.strokeStyle = '#8a7a52'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 2, 0, 7); g.stroke(); }
  // the controls, as caps for the keys or the pad's own buttons (A green, X blue, B red, as a pad marks them; the stick a ring)
  const PADC = { A: '#3fae4a', X: '#3a7bd5', B: '#d0463b', Y: '#e0b22e' };
  function controls(list, x, y, align, font, col) {
    g.font = font; g.textBaseline = 'middle'; g.textAlign = 'left';
    const capW = c => c === 'stick' || PADC[c] ? 22 : g.measureText(c).width + 14, gap = 7, sep = 18;
    const total = list.reduce((a, [c, l]) => a + capW(c) + gap + g.measureText(l).width, 0) + sep * (list.length - 1);
    let cx = align === 'center' ? x - total / 2 : x;
    for (const [c, l] of list) {
      const w = capW(c);
      if (c === 'stick') { g.strokeStyle = '#cfc6a6'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx + 11, y, 10, 0, 7); g.stroke(); g.fillStyle = '#cfc6a6'; g.beginPath(); g.arc(cx + 11, y, 4.5, 0, 7); g.fill(); }
      else if (PADC[c]) { g.fillStyle = PADC[c]; g.beginPath(); g.arc(cx + 11, y, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(c, cx + 11, y + 1); g.textAlign = 'left'; g.font = font; }
      else { g.fillStyle = 'rgba(255,255,255,.1)'; g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(cx, y - 12, w, 24, 5); g.fill(); g.stroke();
        g.fillStyle = '#f2ecd8'; g.font = '700 13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(c, cx + w / 2, y + 1); g.textAlign = 'left'; g.font = font; }
      cx += w + gap; g.fillStyle = col; g.fillText(l, cx, y); cx += g.measureText(l).width + sep;
    }
  }
  function hud() {
    g.fillStyle = 'rgba(30,26,22,.92)'; g.fillRect(0, H - 64, W, 64); g.strokeStyle = '#8a7a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H - 64); g.lineTo(W, H - 64); g.stroke();
    orb(70, H - 56, 46, Math.max(0, pl.hp) / 100, '#ff5a4a', '#5a0808'); orb(W - 70, H - 56, 46, pl.mp / 100, '#6a7cff', '#0a0e5a');
    controls(dev === 'pad' ? [['stick', 'bieg'], ['A', 'teleport'], ['X', 'lodowy pocisk'], ['START', 'nowy bieg'], ['B', 'wyjście']]
      : [['WASD', 'bieg'], ['Spacja', 'teleport'], ['J', 'lodowy pocisk'], ['Enter', 'nowy bieg'], ['Esc', 'wyjście']], W / 2, H - 30, 'center', '600 14px Georgia, serif', '#d8cfa8');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (!boss.dead) { const bw = 360, bx = W / 2 - bw / 2; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(bx - 4, 14, bw + 8, 34); g.fillStyle = '#5a0a0a'; g.fillRect(bx, 34, bw, 9); g.fillStyle = '#d23a2a'; g.fillRect(bx, 34, bw * Math.max(0, boss.hp) / boss.max, 9);
      g.fillStyle = '#e8d8a8'; g.font = '700 15px Georgia, serif'; g.fillText('MEFISTO · WŁADCA NIENAWIŚCI', W / 2, 24); }
    g.textAlign = 'left'; g.fillStyle = '#cbbd96'; g.font = '600 14px Georgia, serif'; const s = Math.floor(runT);
    g.fillText(`Bieg ${runN} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · złoto ${goldSum.toLocaleString('pl-PL')}`, 14, 22);
    if (found.length) { g.textAlign = 'right'; g.font = '600 13px Georgia, serif'; found.forEach((it, i) => { g.fillStyle = COL[it.kind]; g.fillText(it.name, W - 14, 22 + i * 18); }); }
    if (msg) { g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 230, H / 2 - 30, 460, 44); g.fillStyle = state === 'dead' ? '#ff5a4a' : '#e8d8a8'; g.font = '700 20px Georgia, serif'; g.fillText(msg, W / 2, H / 2 - 8); }
  }
  function drawMenu() {                                                // the TV's home: pick a game
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#15161c'); gr.addColorStop(1, '#2a1f2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f2efe8'; g.font = '600 30px Inter, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('Gry', 64, 92);
    g.fillStyle = '#9a96a0'; g.font = '500 17px Inter, sans-serif'; controls(dev === 'pad' ? [['stick', 'wybór'], ['A', 'graj']] : [['←→', 'wybór'], ['Enter', 'graj']], 64, 118, 'left', '500 17px Inter, sans-serif', '#9a96a0');
    const tiles = [{ name: 'Mefisto Run', sub: 'teleport, boss, łup', ok: true }, { name: 'Wkrótce', sub: 'kolejna gra', ok: false }];
    tiles.forEach((tl, i) => { const x = 64 + i * 300, y = 170, w = 270, h = 250, on = sel === i;
      g.fillStyle = tl.ok ? '#3a0f14' : '#24242a'; g.fillRect(x, y, w, h);
      if (tl.ok) { const cx = x + w / 2, cy = y + 120, gl = g.createRadialGradient(cx, cy, 5, cx, cy, 110); gl.addColorStop(0, 'rgba(255,70,40,.55)'); gl.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h);
        g.fillStyle = '#12050a'; g.beginPath(); g.moveTo(cx - 30, cy + 50); g.quadraticCurveTo(cx - 40, cy - 10, cx - 14, cy - 40); g.lineTo(cx + 14, cy - 40); g.quadraticCurveTo(cx + 40, cy - 10, cx + 30, cy + 50); g.fill();
        g.beginPath(); g.arc(cx, cy - 52, 15, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 8, cy - 60); g.lineTo(cx + s * 24, cy - 84); g.lineTo(cx + s * 13, cy - 56); g.fill(); }
        g.fillStyle = '#ffd24a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 5, cy - 53, 2.6, 0, 7); g.fill(); } }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y + h - 62, w, 62);
      g.fillStyle = tl.ok ? '#f2efe8' : '#77757c'; g.font = '600 21px Inter, sans-serif'; g.fillText(tl.name, x + 18, y + h - 32); g.fillStyle = '#a8a4ae'; g.font = '500 14px Inter, sans-serif'; g.fillText(tl.sub, x + 18, y + h - 12);
      if (on) { g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(x - 5, y - 5, w + 10, h + 10); } });
  }
  function frame(dt, inp) { step(Math.min(dt, .05), inp); draw(); tex.needsUpdate = true; }
  // the screen's average colour, for the glow the TV throws into the room (read small, a few times a second)
  const small = document.createElement('canvas'); small.width = 8; small.height = 5; const sg = small.getContext('2d', { willReadFrequently: true }), avg = new THREE.Color();
  function glow() { sg.drawImage(cv, 0, 0, 8, 5); const d = sg.getImageData(0, 0, 8, 5).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4;
    return avg.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace); }
  function home() { state = 'menu'; sel = 0; }
  draw();
  return { canvas: cv, texture: tex, frame, glow, home, get state() { return state; } };
}
