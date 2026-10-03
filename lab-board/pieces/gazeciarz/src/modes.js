// The game's modes, besides the plain run (KLASYCZNA TRASA):
//   PORANNY SPRINT: a minute on the clock; every paper delivered to a subscriber gives seconds back (more in a streak). How many
//     before it runs out? The best kept in this browser.
//   TOR PRZESZKÓD: a course laid out on a quiet stretch of the loop: a start gate, rows of cones to weave through, a kicker and a
//     plank to jump, gates to ride through, the finish. The clock runs from the start gate; a cone knocked down: +2 s, a gate ridden
//     round: +5 s. The best time kept.
// Each starts with a count of three (he waits, his feet down), shows its clock at the top, and ends on a page of what was done:
// AGAIN (Enter) or back to the plain run (Esc). The traffic is thinned for them (see main: MODE).
// createModes({ THREE, scene, track, audio, game }) → { start(id), stop(), update(dt), get id, get isOpen (the end page), key(e), flags }
//   game: { B, restart(), place(x, z, yaw), flash(s), pop(at, text, col) }

const BEST = 'pt.modes';
const bestOf = () => { try { return JSON.parse(localStorage.getItem(BEST) || '{}'); } catch { return {}; } };
const keepBest = o => { try { localStorage.setItem(BEST, JSON.stringify(o)); } catch { } };
export const MODES = { kosz: { name: 'RZUTY POD DOMEM', info: 'MINUTA, PUNKTY RZUTOWE, TRAFIENIE +2 S' }, sprint: { name: 'PORANNY SPRINT', info: 'MINUTA NA ZEGARZE, GAZETY DOKŁADAJĄ CZAS' }, course: { name: 'TOR PRZESZKÓD', info: 'SLALOM, SKOCZNIE I BRAMKI NA CZAS' } };

export function createModes({ THREE, scene, track, audio, game }) {
  const css = document.createElement('style'); css.textContent = `
    #modebar { position: fixed; left: 50%; top: 12px; transform: translateX(-50%); z-index: 3; pointer-events: none; display: none; text-align: center; font: 700 12px/1.2 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: .1em; color: #f6f3ea; }
    #modebar.on { display: block; } #modebar .clock { font-size: 30px; color: #efc970; text-shadow: 2px 2px 0 #17181b; letter-spacing: .04em; } #modebar .clock.low { color: #cf5a3e; }
    #modebar .sub { display: inline-block; margin-top: 2px; padding: 3px 7px; background: rgba(23,24,27,.82); box-shadow: 0 0 0 2px #17181b; } #modebar .name { font-size: 10px; opacity: .8; text-shadow: 1px 1px 0 #17181b; }
    #modecd { position: fixed; inset: 0; z-index: 4; display: none; place-items: center; pointer-events: none; font: 700 120px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #efc970; text-shadow: 6px 6px 0 #17181b; }
    #modecd.on { display: grid; }
    #modeend { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; background: rgba(12,13,15,.86); color: #f6f3ea; font: 700 13px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; }
    #modeend.on { display: grid; } #modeend .box { width: min(440px, calc(100vw - 28px)); box-sizing: border-box; padding: 18px; background: #17181b; border: 2px solid #efc970; box-shadow: 0 0 0 2px #0c0d0f; }
    #modeend h2 { margin: 0 0 2px; color: #efc970; font-size: 20px; letter-spacing: .12em; } #modeend .why { opacity: .75; font-size: 11px; margin-bottom: 12px; }
    #modeend .st { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin-bottom: 10px; } #modeend .st b { color: #efc970; text-align: right; }
    #modeend .best { font-size: 11px; margin-bottom: 12px; opacity: .85; } #modeend .best.new { color: #9fd27a; opacity: 1; }
    #modeend button { all: unset; cursor: pointer; display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 10px; border: 1.5px solid #efc970; color: #efc970; margin-top: 8px; }
    #modeend button:hover, #modeend button.pad-focus { background: #efc970; color: #17181b; }`;
  document.head.appendChild(css);
  const bar = document.createElement('div'); bar.id = 'modebar'; bar.innerHTML = '<div class="name"></div><div class="clock"></div><div class="sub"></div>'; document.body.appendChild(bar);
  const cd = document.createElement('div'); cd.id = 'modecd'; document.body.appendChild(cd);
  const end = document.createElement('div'); end.id = 'modeend'; end.innerHTML = '<div class="box"><h2></h2><div class="why"></div><div class="st"></div><div class="best"></div><button class="again">JESZCZE RAZ (ENTER)</button><button class="out">KLASYCZNA TRASA (ESC)</button></div>'; document.body.appendChild(end);
  const [nameE, clockE, subE] = bar.children;
  end.querySelector('.again').onclick = () => again(); end.querySelector('.out').onclick = () => stop();
  const flags = { cars: null, bus: true, calm: false };   // (read by main: how much traffic, dogs and the granny left alone)
  const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return (m ? m + ':' + String(Math.floor(s)).padStart(2, '0') : Math.floor(s)) + '.' + Math.floor((s % 1) * 10); };
  let M = null, open = false;

  // ---------- the course: a quiet stretch (the fewest things on the road), its gates, cones and jumps ----------
  const G = new THREE.Group(); scene.add(G); let course = null;
  const toon = c => new THREE.MeshLambertMaterial({ color: c });
  const coneG = new THREE.ConeGeometry(.2, .55, 8).translate(0, .275, 0), coneM = toon('#e8692c'), bandM = toon('#f6f3ea'), postM = toon('#f6f3ea'), redM = toon('#cf5a3e');
  const banner = (txt, chk) => { const c = document.createElement('canvas'); c.width = 96; c.height = 12; const g = c.getContext('2d');
    if (chk) for (let x = 0; x < 96; x += 6) for (let y = 0; y < 12; y += 6) { g.fillStyle = ((x + y) / 6) % 2 ? '#17181b' : '#f6f3ea'; g.fillRect(x, y, 6, 6); }
    else { g.fillStyle = '#cf5a3e'; g.fillRect(0, 0, 96, 12); }
    g.fillStyle = chk ? '#cf5a3e' : '#f6f3ea'; if (chk) g.fillRect(30, 1, 36, 10); g.fillStyle = '#f6f3ea'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 48, 6.5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); };
  function pickStretch(len) {   // (where along the loop: the window of stations with the least on the road in it)
    const n = Math.round(len / track.ds), road = track.colliders.filter(C => C.kind !== 'bundle' && Math.abs(track.probe(C.x, C.z, C.i).d) < track.ROAD + .3).map(C => C.i);
    const parked = (track.parked || []).map(p => Math.round(p.s / track.ds)), hits = [...road, ...parked, ...track.stops.map(q => q.i), ...(track.home ? [track.home.iJ] : [])];
    let best = 0, bn = 1e9; for (let i0 = 0; i0 < track.N; i0 += 20) { let c = 0; for (const i of hits) { const k = ((i - i0) % track.N + track.N) % track.N; if (k < n + 30) c++; } if (c < bn) { bn = c; best = i0; } } return (best + 15) % track.N; }
  function buildCourse() {
    clearCourse(); const LEN = 150, i0 = pickStretch(LEN), N = track.N, ds = track.ds, S = track.S;
    const at = (s, d) => { const i = ((i0 + Math.round(s / ds)) % N + N) % N, A = S[i], x = A.p.x + A.r.x * d, z = A.p.z + A.r.z * d; return { i, x, z, y: track.probe(x, z, i).y, yaw: Math.atan2(A.f.x, A.f.z) }; };
    const C = { i0, LEN, at, gates: [], cones: [], ramps: [], hits: [] };
    const gate = (s, label, chk) => { const g = new THREE.Group(), p = at(s, 0); for (const d of [-3.4, 3.4]) { const q = at(s, d), post = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.6, .14).translate(0, 1.3, 0), postM); post.position.set(q.x, q.y, q.z); G.add(post);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(.15, .25, .15).translate(0, 2.2, 0), redM); stripe.position.copy(post.position); G.add(stripe); }
      const b = new THREE.Mesh(new THREE.PlaneGeometry(6.8, .85), banner(label, chk)); b.position.set(p.x, p.y + 2.45, p.z); b.rotation.y = p.yaw + Math.PI; G.add(b);   // (its face to whoever rides up to it)
      C.gates.push({ s, label, passed: false }); };
    const cone = (s, d) => { const q = at(s, d), m = new THREE.Mesh(coneG, coneM), band = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, .08, 8).translate(0, .3, 0), bandM); m.add(band); m.position.set(q.x, q.y, q.z); G.add(m); C.cones.push({ m, x: q.x, z: q.z, down: false, t: 0, ax: 0, az: 0 }); };
    const row = (s, open) => { for (let d = -3.1; d <= 3.15; d += .62) if ((open > 0 ? d < -.35 : d > .35)) cone(s, d); };   // (cones across one half: the way through is the other)
    const ramp = (s, size) => { const q = at(s, 0), o = track.props.ramp(Math.random, size); o.group.position.set(q.x, q.y, q.z); o.group.rotation.y = q.yaw; G.add(o.group); C.hits.push(track.addHit(o.group, o.hit, q.i)); };
    gate(4, 'START'); for (let k = 0; k < 5; k++) row(16 + k * 9, k % 2 ? 1 : -1); gate(64, 'BRAMKA 1'); ramp(76, 'kicker'); gate(90, 'BRAMKA 2');
    for (let k = 0; k < 4; k++) row(100 + k * 7, k % 2 ? -1 : 1); ramp(131, 'plank'); gate(LEN - 6, 'META', true);
    course = C; return C; }
  function clearCourse() { if (!course) return; for (const h of course.hits) track.dropHit(h); while (G.children.length) { const o = G.children.pop(); o.traverse?.(c => { c.geometry?.dispose?.(); }); } course = null; }
  const sAlong = (x, z, hint) => { const q = track.probe(x, z, hint); return { q, s: (((q.i - course.i0) % track.N) + track.N) % track.N * track.ds }; };

  // ---------- start, stop, again ----------
  function start(id) { open = false; end.classList.remove('on'); clearCourse(); M = { id, phase: 'count', cd: 3.2, t: 0, pen: 0, msgT: 0 };
    game.restart(); Object.assign(flags, { cars: id === 'course' ? 0 : 2, bus: id !== 'course', calm: id === 'course' });
    if (id === 'sprint') { M.t = 60; M.d0 = game.B.delivered || 0; M.p0 = game.B.points || 0; M.del = 0; }
    if (id === 'course') { const C = buildCourse(), p = C.at(-7, 1.2); game.place(p.x, p.z, p.yaw, p.i); M.gate = 0; M.s = -7; }
    if (id === 'kosz') { const H = game.hoops; flags.calm = true; flags.cars = 1; game.onFootAt(H.start, H.facing); M.t = 60; M.h0 = { made: H.made, shots: H.shots }; M.best = 0; }   // (on the court, the ball given at the start)
    nameE.textContent = MODES[id].name; bar.classList.add('on'); draw(); }
  function stop() { if (M?.id === 'kosz') game.hoops.challenge.stop(); M = null; open = false; end.classList.remove('on'); bar.classList.remove('on'); cd.classList.remove('on'); clearCourse(); Object.assign(flags, { cars: null, bus: true, calm: false }); game.restart(); }
  function again() { if (M) start(M.id); }
  function finish(why, stats, bestKey, better, val, show) { if (M.id === 'kosz') game.hoops.challenge.stop(); M.phase = 'end'; open = true; const all = bestOf(), had = all[bestKey], nb = had == null || better(val, had); if (nb) { all[bestKey] = val; keepBest(all); }
    end.querySelector('h2').textContent = MODES[M.id].name; end.querySelector('.why').textContent = why;
    end.querySelector('.st').innerHTML = stats.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('');
    const b = end.querySelector('.best'); b.className = 'best' + (nb && had != null ? ' new' : ''); b.textContent = nb && had != null ? 'NOWY REKORD!' : had == null ? 'PIERWSZY WYNIK ZAPISANY' : 'REKORD: ' + show(had);
    end.classList.add('on'); bar.classList.remove('on'); audio.play(nb ? 'trick' : 'coin'); }
  function draw() { if (!M) return; const low = (M.id === 'sprint' || M.id === 'kosz') && M.t < 10;
    clockE.textContent = M.phase === 'count' ? (M.id === 'sprint' || M.id === 'kosz' ? fmt(M.t) : '0.0') : fmt(M.t); clockE.className = 'clock' + (low ? ' low' : '');
    subE.textContent = M.id === 'kosz' ? `PUNKTY ${game.hoops.challenge.pts} · RZUCAJ Z ZIELONEGO KÓŁKA${game.hoops.streak >= 3 ? ' · W GAZIE!' : game.hoops.streak > 1 ? ' · SERIA ' + game.hoops.streak : ''}` : M.id === 'sprint' ? `DORĘCZONE ${M.del || 0} · KAŻDA GAZETA +5 S` : `${M.gate < course.gates.length ? (M.gate === 0 ? 'JEDŹ NA START!' : 'NASTĘPNA: ' + course.gates[M.gate].label) : ''}${M.pen ? ' · KARA +' + M.pen + ' S' : ''}`; }

  // ---------- each frame ----------
  function update(dt) { if (!M || M.phase === 'end') return; const B = game.B;
    if (M.phase === 'count') { M.cd -= dt; B.v = 0; const n = Math.ceil(M.cd - .2); cd.textContent = n > 0 ? n : 'START!'; cd.classList.add('on'); if (n !== M.lastN) { M.lastN = n; audio.play(n > 0 ? 'coin' : 'trick', { vol: .6 }); }
      if (M.cd <= 0) { M.phase = 'run'; cd.classList.remove('on'); if (M.id === 'kosz') game.hoops.challenge.start(); } draw(); return; }
    if (M.id === 'kosz') { const H = game.hoops, C = H.challenge; C.update(dt); M.t = Math.max(0, C.t); M.best = Math.max(M.best, H.streak);
      if (C.t <= 0) { const pts = C.pts; finish('Czas minął', [['Punkty', pts], ['Trafione', (H.made - M.h0.made) + ' / ' + (H.shots - M.h0.shots)], ['Najdłuższa seria', M.best]], 'kosz', (a, b) => a > b, pts, v => v + ' pkt'); } draw(); return; }
    if (M.id === 'sprint') { const del = (B.delivered || 0) - M.d0; if (del > M.del) { const add = (del - M.del) * (4 + Math.min(4, 1 + Math.floor((B.streak || 0) / 3))); M.t += add; game.pop(new THREE.Vector3(B.x, B.y + 2.4, B.z), '+' + add + ' S', '#9fd27a'); M.del = del; }
      M.t -= dt; if (M.t <= 0) { M.t = 0; const pts = (B.points || 0) - M.p0; finish('Czas minął', [['Doręczone', M.del], ['Zarobione', pts + ' zł'], ['Najdłuższa seria', M.maxS || 0]], 'sprint', (a, b) => a > b, M.del, v => v + ' gazet'); }
      M.maxS = Math.max(M.maxS || 0, B.streak || 0); draw(); return; }
    if (M.id === 'course') { const C = course, { q, s } = sAlong(B.x, B.z, B.hint), sNow = s > C.LEN + 40 ? s - track.N * track.ds : s;   // (s: along the course; before the start it reads negative)
      if (M.gate > 0) M.t += dt;
      const g = C.gates[M.gate]; if (g && M.s < g.s && sNow >= g.s && sNow - M.s < 6) { const inside = Math.abs(q.d) < 3.35; if (!inside && M.gate > 0) { M.pen += 5; M.t += 5; game.flash('Bramka ominięta! +5 s'); }
        g.passed = true; M.gate++; audio.play(inside ? 'coin' : 'miss', { vol: .7 }); if (M.gate === 1) game.flash('Start! Przejedź przez wszystkie bramki');
        if (M.gate === C.gates.length) { const T = M.t; finish('Meta!', [['Czas', fmt(T) + ' s'], ['Kary', '+' + M.pen + ' s'], ['Przewrócone pachołki', M.cones || 0]], 'course', (a, b) => a < b, T, v => fmt(v) + ' s'); } }
      M.s = sNow;
      for (const c of C.cones) { if (c.down) { if (c.t < 1) { c.t = Math.min(1, c.t + dt * 4); c.m.rotation.x = c.ax * c.t * 1.45; c.m.rotation.z = c.az * c.t * 1.45; } continue; }
        if (Math.hypot(c.x - B.x, c.z - B.z) < .5 && Math.abs(B.v) > .5 && !B.air) { c.down = true; const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw); c.ax = fz; c.az = -fx; audio.play('kick', { vol: .5 }); if (M.gate > 0 && M.gate < C.gates.length) { M.pen += 2; M.t += 2; M.cones = (M.cones || 0) + 1; game.pop(new THREE.Vector3(c.x, B.y + 1.6, c.z), '+2 S', '#cf5a3e'); } } }
      if (B.crash && !M.crashT) { M.crashT = 1; } else if (!B.crash) M.crashT = 0;
      draw(); } }

  function key(e) { if (!open) return false; if (e.code === 'Enter' || e.code === 'Space') { again(); return true; } if (e.code === 'Escape') { stop(); return true; } return false; }
  return { start, stop, update, key, flags, get counting() { return M?.phase === 'count'; }, get id() { return M?.id || null; }, get isOpen() { return open; }, get course() { return course; } };
}
