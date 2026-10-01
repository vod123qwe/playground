// People with something to say, and the errands that come of a word with them. Over whoever has a matter: "!"; over whoever waits for
// you (an errand's end): "?"; over an errand's target: an arrow (red: someone running off). The nearest one in reach gets "how to
// talk" under its mark (from the bike: slow down first). A word: talk.js (the game waits). What you choose is remembered: each one's
// mood to you (the lads by one drum are one), and a lie comes out later. Bad moods: names called, a bottle thrown as you go by; good:
// greetings, a coin thrown, cheaper papers. Errands, the first lot (see docs/rozmowy-i-zadania.md):
//   list (an old one in a garden): a letter to a house ahead; the one there thanks you, or is cross, or sends an answer back
//   szyba (the one with the belly): break his neighbour's window for a tenner, or tell the neighbour
//   beczka (the lads by the drum): three papers for their fire; given, they turn friendly (finds from the bins, papers cheap)
//   przystanek (at the bus stop): a paper to read; the one asleep there, woken, wants two zloty for the bus
//   rowery (the lads, once friendly): knock two cyclists off their bikes, the lads pick the bikes up; paid in waste paper (to deliver)
//   złodziej (now and then, by itself): someone snatches a handbag and runs; kick him off it (or punch), pick it up, give it back (all?)
// createQuests({ THREE, track, residents, peds, hud, talk, game }) → { update(dt, inp), marks(), tracker(), onLand(p), onWindow(w),
//   onHitPed(p) → true if it was the errand's, get canChat, reset() }
// game: { rider(), money(n, at, label), papers (get/set), item(name, at), flash(s), jolt(), grudgeAt(at, line, kind), dropBag(at, onPick), talkKey() }
export function createQuests({ THREE, track, residents, peds, hud, talk, game }) {
  const pick = a => a[Math.random() * a.length | 0], rnd = Math.random, _v = new THREE.Vector3(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const NAMES = { granma: ['PANI HALINA', 'PANI KRYSIA', 'PANI ZOSIA', 'PANI WIESIA'], grandpa: ['PAN HENIO', 'PAN STEFAN', 'PAN ZBYSZEK', 'PAN TADEK'], belly: ['PAN MIREK', 'PAN RYSIEK', 'PAN JANEK'] };
  const FINDS = ['ŁYŻKA DO OPON', 'DZWONEK ROWEROWY', 'ŁATKI DO DĘTEK', 'STARA LAMPKA', 'KLUCZ DO SZPRYCH'];
  const P = new Map(), active = [], stage = [];
  let focusAt = null, byeAt = null, byeT = 0;   // (byeAt, byeT: the camera kept on them a moment for their last word)                                                   // (who the talk is with: a function to their head; the camera looks there)
  const strOf = v => typeof v === 'function' ? v() : v;
  function run(nodes, o) { const at = focusAt; talk.run(nodes, 'start', b => { focusAt = null; if (b && at) { byeAt = at; byeT = 1.8; setTimeout(() => hud.rant(at(), strOf(b), false), 120); } }, o); }   // (stage: what a story put in the world; it stays when the story is over)
  // a mower: a deck on four wheels, the engine on it, a handle back up to the hands (pink: the neighbour's; grey, three wheels: the other one)
  function mower(col, wheels = 4) { const g = new THREE.Group(), M = c => new THREE.MeshToonMaterial({ color: c }), bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const body = M(col), dark = M('#2a2c30'), steel = M('#9a9c9e'); bx(.5, .12, .62, body, 0, .2, 0); bx(.26, .18, .26, dark, 0, .34, -.02); bx(.12, .06, .12, steel, 0, .45, -.02);
    [[-.24, .26], [.24, .26], [-.24, -.26], [.24, -.26]].slice(0, wheels).forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .05, 10).rotateZ(Math.PI / 2), dark); w.position.set(x, .08, z); g.add(w); });
    for (const x of [-.2, .2]) { const h = bx(.03, .03, .78, steel, x, .5, -.58); h.rotation.x = -.75; } bx(.44, .03, .03, steel, 0, .78, -.86); return g; }
  // the neighbour out mowing his lawn in front of his house, to and fro, the pink mower before him; stopped: stands, cross, a while
  function mowing(house, key = 'gardener') {
    const d = track.doors[house], n = V(d.n.x, 0, d.n.z).normalize(), side = V(-n.z, 0, n.x);   // (n: the way the house faces, to the road; the lawn between)
    // where on the lawn: a strip clear of the car on the drive, the bins, the fence, off the pavement (the colliders the track keeps)
    const clear = (x, z) => { const q = track.probe(x, z, -1); if (Math.abs(q.d) < track.PAVE + .5) return false;
      for (const C of track.near(q.i)) { if (C.kind === 'ramp' || C.hx == null) continue; const dx = x - C.x, dz = z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; if (Math.abs(lx) < C.hx + .6 && Math.abs(lz) < C.hz + .6) return false; } return true; };
    let c = null, A = 2.6;
    find: for (const a of [2.6, 2, 1.5]) for (const sOff of [0, 1.5, -1.5, 3, -3, 4.5, -4.5]) for (const dep of [1.7, 1.2, 2.3]) { const c0 = V(d.p.x + n.x * dep + side.x * sOff, d.p.y, d.p.z + n.z * dep + side.z * sOff);
      let ok = true; for (let k = -6; k <= 6 && ok; k++) for (const r of [-.55, 0, .55]) { const x = c0.x + side.x * a * k / 6 + n.x * r, z = c0.z + side.z * a * k / 6 + n.z * r; if (!clear(x, z)) { ok = false; break; } }
      if (ok) { c = c0; A = a; break find; } }
    if (!c) { c = V(d.p.x + n.x * 1.7, d.p.y, d.p.z + n.z * 1.7); A = 1.2; }
    const S = { kind: 'mow', house, t: rnd() * 6, angry: 0, who: null, mower: mower('#e889b5'), c, A, side, n, pos: c.clone() }; S.mower.position.copy(c); scene().add(S.mower); stage.push(S);
    residents.spawn?.(key).then(p => { if (!p) return; S.who = p; p.acts.walk?.play(); p.acts.idle?.play(); p.acts.idle?.setEffectiveWeight(0); });
    return S;
  }
  const scene = () => game.scene;
  function stepStage(dt) {
    for (const S of stage) { if (S.kind !== 'mow') continue; S.angry = Math.max(0, S.angry - dt); const going = S.angry <= 0 && !S.stopped;
      if (going) S.t += dt * .42; const u = Math.sin(S.t), dir = Math.cos(S.t) >= 0 ? 1 : -1, row = Math.floor(S.t / Math.PI) % 3 - 1;   // (rows across the lawn, a step over at each end)
      const at = S.c.clone().addScaledVector(S.side, u * S.A).addScaledVector(S.n, row * .55), q = track.probe(at.x, at.z, -1); at.y = q.y; S.pos.copy(at);
      const yaw = Math.atan2(S.side.x * dir, S.side.z * dir); S.mower.position.copy(at).addScaledVector(V(Math.sin(yaw), 0, Math.cos(yaw)), .75); S.mower.rotation.y = yaw; S.mower.position.y = at.y;
      if (S.who) { const p = S.who; p.G.position.copy(at); const R = R0(); p.G.rotation.y = going ? yaw : Math.atan2(R.x - at.x, R.z - at.z);
        const w = going ? 1 : 0; if (p.acts.walk) p.acts.walk.setEffectiveWeight(w); if (p.acts.idle) p.acts.idle.setEffectiveWeight(1 - w); if (p.acts.walk) p.acts.walk.timeScale = .75;
        const far = Math.hypot(R.x - at.x, R.z - at.z) > 120; p.G.visible = !far; if (!far) p.mixer.update(dt); } }
  }
  const mowerOf = house => stage.find(S => S.kind === 'mow' && S.house === house);
  const mowHead = S => V(S.pos.x, S.pos.y + 2.3, S.pos.z);
  let near = null, thiefT = 60 + rnd() * 50, flashT = 0, offerT = 25 + rnd() * 20;   // (offerT: till the director gives someone a matter)

  // ---------- the people: who they are to you ----------
  const head = r => { if (r.head) r.head.getWorldPosition(_v); else _v.copy(r.G.position).setY(r.G.position.y + 1.4); return _v.clone().setY(_v.y + .6); };
  function person(r) {
    let o = P.get(r); if (o) return o;
    if (r.lines === 'shacks') for (const [r2, o2] of P) if (r2.lines === 'shacks' && r2.G.position.distanceTo(r.G.position) < 16) { P.set(r, o2); return o2; }   // (one drum, one lot)
    const kind = r.lines === 'shacks' ? 'shacks' : r.lines === 'lump' ? 'lump' : r.lines === 'stop' ? 'stop' : r.key;
    o = { lead: r, kind, mood: 0, cool: 0, offer: null, passT: 0, flag: {} };
    o.name = kind === 'shacks' ? 'EKIPA SPOD BECZKI' : kind === 'lump' ? 'PAN Z ŁAWKI' : kind === 'stop' ? (r.key === 'granma' ? 'PANI Z PRZYSTANKU' : 'PAN Z PRZYSTANKU') : pick(NAMES[kind] || ['SĄSIAD']);
    o.she = kind === 'granma' || (kind === 'stop' && r.key === 'granma');
    P.set(r, o); return o;                                              // (no matter yet: the director hands them out, few and ahead of you)
  }
  function offerFor(o, first) {                                         // (what matter they have, if any; not all of them have one)
    const k = o.kind; o.offer = k === 'belly' ? (rnd() < (first ? .75 : .5) ? 'szyba' : null) : (k === 'granma' || k === 'grandpa') ? (rnd() < (first ? .6 : .45) ? 'list' : null)
      : k === 'shacks' ? (o.mood >= 2 && rnd() < .6 ? 'rowery' : 'beczka') : k === 'stop' ? (rnd() < .6 ? 'przystanek' : null) : null;
  }
  const busy = kind => active.some(e => e.kind === kind || e.from === kind);
  const mood = (o, n) => { o.mood = Math.max(-6, Math.min(6, o.mood + n)); };
  const say = (r, s) => hud.rant(head(r), s, true);
  const R0 = () => game.rider();

  // ---------- where: a house ahead (its door, its mailbox, its windows) ----------
  function houseAhead(min = 45, max = 190) {
    const R = R0(), fx = Math.sin(R.yaw), fz = Math.cos(R.yaw), c = [];
    track.doors.forEach((d, i) => { const dx = d.p.x - R.x, dz = d.p.z - R.z, l = Math.hypot(dx, dz); if (l > min && l < max && (dx * fx + dz * fz) / l > .25 && !active.some(e => e.house === i)) c.push(i); });
    if (!c.length) track.doors.forEach((d, i) => { const l = Math.hypot(d.p.x - R.x, d.p.z - R.z); if (l > 35 && l < 260) c.push(i); });
    return c.length ? pick(c) : null;
  }
  const doorSpot = i => { const d = track.doors[i]; return V(d.p.x - d.n.x * 1.3, d.p.y, d.p.z - d.n.z * 1.3); };
  const mailboxOf = i => { const d = track.doors[i]; let best = null, bd = 14; for (const mb of track.mailboxes) { const l = mb.o.position.distanceTo(d.p); if (l < bd) { bd = l; best = mb; } } return best; };
  const windowsOf = i => track.windows.filter(w => w.house === i && !w.broken);
  const over = (p, y = 3.1) => V(p.x, p.y + y, p.z);

  // ---------- the talks ----------
  function converse(r) {
    const o = person(r), back = active.find(e => e.at === r || (e.point && e.point.r === r));
    if (back && back.talk) return back.talk();
    if (o.offer && o.cool <= 0 && !busy(o.offer)) return OFFER[o.offer](o, r);
    if (o.kind === 'lump') return lumpTalk(o, r);
    if (o.kind === 'shacks' && o.flag.sells) return shacksShop(o, r);
    // nothing to talk over: a word back, as their mood is (the game goes on)
    say(r, o.mood >= 3 ? pick(['O, NASZ BOHATER!', 'DZIEŃ DOBRY, MŁODY!', 'SZACUNEK, MŁODY.']) : o.mood <= -3 ? pick(['NIE GADAM Z TOBĄ.', 'SPADAJ.', 'JESZCZE TU JESTEŚ?']) : pick(['DZIEŃ DOBRY.', 'NO HEJ.', 'CO TAM?', 'NIE MAM CZASU, MŁODY.', 'SPIESZ SIĘ, GAZETY STYGNĄ!']));
    o.cool = Math.max(o.cool, 3);
  }
  const done = o => { o.offer = null; o.cool = 70 + rnd() * 60; o.redo = true; };   // (another matter a while later)

  const OFFER = {
    // a letter to take ahead
    list(o, r) {
      const hi = houseAhead(); if (hi == null) { say(r, 'A, NIEWAŻNE.'); return; }
      const to = o.she ? pick(['PANA WIEŚKA', 'PANA EDZIA', 'PANA KAZIA']) : pick(['PANI JADZI', 'PANI DOROTKI', 'PANI HALINKI']);
      const start = (pay) => { done(o); o.cool = 1e9; const d = track.doors[hi];
        active.push({ kind: 'list', o, r, house: hi, to, pay, text: () => 'LIST DO ' + to, target: () => over(d.p, 3.4), mark: 'v' });
        game.flash('List do ' + to.toLowerCase() + ': dom ze strzałką. Gazeta pod drzwi albo do skrzynki.'); return null; };
      run({ who: o.name,
        start: { say: `MŁODY! CHODŹ NO TU. ZAWIEŹ TEN LIST DO ${to}, TEN DOM KAWAŁEK DALEJ. JA JUŻ Z TYMI KOLANAMI NIE DAM RADY.`, opts: [
          { t: 'JASNE, ZAWIOZĘ.', bye: 'TYLKO NIE ZGNIEĆ! TO WAŻNY LIST!', act: () => start(8) },
          { t: 'A CO Z TEGO BĘDĘ MIAŁ?', go: 'haggle' },
          { t: 'NIE MAM CZASU.', act: () => { mood(o, -1); o.cool = 40; say(r, 'TA DZISIEJSZA MŁODZIEŻ...'); return null; } }] },
        haggle: { say: 'NO JAK TO CO? DOBRY UCZYNEK! ...NO DOBRA. PIĄTAK TERAZ, RESZTA JAK DOJDZIE.', opts: [
          { t: 'BIORĘ.', bye: 'I NIE WYDAJ WSZYSTKIEGO NA GUMY DO ŻUCIA!', act: () => { game.money(5, head(r), '+5 ZŁ'); return start(3); } },
          { t: 'ZA MAŁO.', act: () => { mood(o, -1); o.cool = 40; say(r, 'CHCIWUS!'); return null; } }] } });
    },
    // a window at the neighbour's: the mower war. He lent his mower three years ago, saw it yesterday in the neighbour's garden,
    // painted pink. The twist: his own is in his cellar (his wife shouts it from the window), the pink one is the neighbour's.
    szyba(o, r) {
      const hi = houseAhead(30, 150); if (hi == null || !windowsOf(hi).length) { say(r, 'HEHE. NIEWAŻNE.'); return; }
      const NB = pick([['ZDZICHU', 'ZDZICHA', 'ZDZICHOWI', 'ZDZICHEM'], ['WALDEK', 'WALDKA', 'WALDKOWI', 'WALDKIEM'], ['HENIEK', 'HEŃKA', 'HEŃKOWI', 'HEŃKIEM']]), nb = NB[0];
      const job = { t: 'ROBI SIĘ.', bye: 'TYLKO MNIE NIE SPRZEDAJ! MNIE TU NIE BYŁO!', act: () => { done(o); o.cool = 1e9; const w0 = windowsOf(hi);
        active.push({ kind: 'szyba', o, r, house: hi, nb, NB, text: () => 'SZYBA U ' + NB[1], target: () => { const w = windowsOf(hi)[0] || w0[0]; return V(w.p.x, w.p.y + 1.1, w.p.z); }, mark: 'v', label: () => 'OKNO ' + NB[1] });
        game.flash(`Szyba u ${NB[1].toLowerCase()}: okno ze strzałką. Gazetą przez szybę.`); return null; } };
      const snitch = { t: 'POWIEM MU, CO PAN KOMBINUJE.', act: () => { done(o); mood(o, -2); const sp = doorSpot(hi);
        const mw = mowerOf(hi) || mowing(hi), e = { kind: 'donos', from: 'szyba', o, r, house: hi, nb, NB, t: 0, text: () => 'POWIEDZ ' + NB[2], target: () => mowHead(mw), mark: 'v', label: () => NB[0], point: { p: mw.pos, r: null } }; e.talk = () => donosTalk(e); active.push(e);
        say(r, 'TY KABLU... NO JEDŹ, JEDŹ.'); return null; } };
      const no = { t: 'NIE, DZIĘKI.', act: () => { o.cool = 45; say(r, pick(['MIĘCZAK!', 'ZA MOICH CZASÓW...'])); return null; } };
      run({ who: o.name,
        start: { say: 'EJ, MŁODY! CHODŹ NO TU. MAM SPRAWĘ. DYSKRETNĄ.', opts: [{ t: 'JAKĄ SPRAWĘ?', go: 'story' }, { t: 'NIE MAM CZASU.', act: no.act }] },
        story: { enter: () => { if (!mowerOf(hi)) mowing(hi); }, say: `WIDZISZ TEN DOM TAM DALEJ? MIESZKA TAM ${nb}. TRZY LATA TEMU POŻYCZYŁ ODE MNIE KOSIARKĘ. WCZORAJ WIDZĘ JĄ U NIEGO W OGRÓDKU. POMALOWANĄ NA RÓŻOWO. O, PATRZ, ZNOWU NIĄ KOSI! MYŚLI, ŻE SIĘ NIE POZNAM.`, opts: [
          { t: 'I CO JA MAM Z TYM ZROBIĆ?', go: 'ask' }, { t: 'MOŻE PAN GO PO PROSTU ZAPYTA?', go: 'never' }] },
        never: { say: `ZAPYTAĆ?! Z ${NB[3]}?! NIE ROZMAWIAM Z NIM OD WESELA SZWAGRA. ZJADŁ MI SCHABOWEGO. Z MOJEGO TALERZA. JAK POSZEDŁEM PO SÓL.`, opts: [{ t: 'NO DOBRA. TO CO MAM ZROBIĆ?', go: 'ask' }] },
        ask: { enter: () => know('szyba:' + o.name, `${o.name} ZAMAWIA WYBIJANIE SZYB U ${NB[1]}.`, o), say: 'WYBIJ MU SZYBĘ GAZETĄ. TAKĄ OSTRZEGAWCZĄ. DAM DYSZKĘ. A JAK ZAPYTA, TO MNIE NIE ZNASZ. MNIE TU NIE BYŁO. JA LEŻĘ.', opts: [job, snitch, no] } });
    },
    // papers for the lads' fire
    beczka(o, r) {
      const has = n => game.papers >= n ? null : 'NIE MASZ TYLE GAZET';
      run({ who: o.name,
        start: { say: pick(['MŁODY, ZIMNO JAK W PSIARNI. RZUĆ TRZY GAZETY NA ROZPAŁKĘ.', 'EJ, GAZECIARZ! OGIEŃ NAM GAŚNIE. DAWAJ TRZY GAZETY.']), opts: [
          { t: 'TRZYMAJCIE.', off: () => has(3), act: () => { game.papers -= 3; mood(o, 2); done(o); return rnd() < .5 ? 'find' : 'friends'; } },
          { t: 'ZA PIĄTAKA.', go: 'deal' },
          { t: 'SPADAJCIE.', act: () => { mood(o, -3); done(o); say(r, 'O, PATRZCIE GO. PAN Z ROWERKIEM. ZAPAMIĘTAMY.'); return null; } }] },
        find: { bye: 'WPADAJ, MŁODY! OGIEŃ ZAWSZE JEST!', say: 'DOBRY Z CIEBIE CHŁOPAK. MASZ, WYGRZEBALIŚMY W ŚMIETNIKU. NA CO NAM TO.', enter: () => game.item(pick(FINDS), head(r)) },
        friends: { bye: 'WPADAJ, MŁODY! OGIEŃ ZAWSZE JEST!', say: 'DZIĘKI, MŁODY. JAK BĘDZIESZ POTRZEBOWAŁ GAZET, WPADAJ. MAMY CAŁĄ PACZKĘ Z MAKULATURY. TANIO.', enter: () => { o.flag.sells = true; } },
        deal: { say: 'PIĄTAKA?! ZA MAKULATURĘ?! ...DWA ZŁOTE I SPADAJ.', opts: [
          { t: 'NIECH BĘDZIE.', bye: 'DWA ZŁOTE TO I TAK ZA DUŻO!', off: () => has(3), act: () => { game.papers -= 3; game.money(2, head(r), '+2 ZŁ'); done(o); return null; } },
          { t: 'TO NIE.', act: () => { mood(o, -1); o.cool = 40; return null; } }] } });
    },
    // bikes for the lads: cyclists knocked off (kicked, punched, ridden into); paid in papers, money they never have
    rowery(o, r) {
      const need = 2 + (rnd() < .4 ? 1 : 0);
      run({ who: o.name,
        start: { say: `MŁODY, MAMY KLIENTA NA ROWERY. ZRZUĆ NAM ${need === 2 ? 'DWÓCH' : 'TRZECH'} ROWERZYSTÓW Z SIODEŁEK, MY RESZTĘ ZAŁATWIMY.`, opts: [
          { t: 'A CO ZA TO?', go: 'pay' },
          { t: 'WCHODZĘ W TO.', bye: 'TYLKO ŻEBY NIKT NIE WIDZIAŁ!', act: () => take() },
          { t: 'NIE, TO JUŻ PRZESADA.', act: () => { o.cool = 60; say(r, 'ŚWIĘTOSZEK SIĘ ZNALAZŁ.'); return null; } }] },
        pay: { say: 'KASY NIE MAMY. NIGDY NIE MAMY. ALE MAKULATURY CAŁY BARAK. DOSTANIESZ GAZETY DO ROZWOŻENIA. DUŻO GAZET.', opts: [
          { t: 'NIECH BĘDZIE.', bye: 'TYLKO ŻEBY NIKT NIE WIDZIAŁ!', act: () => take() },
          { t: 'NIE, DZIĘKI.', act: () => { o.cool = 60; return null; } }] } });
      function take() { know('ekipa', 'EKIPA SPOD BECZKI SKUPUJE KRADZIONE ROWERY.', o); done(o); o.cool = 1e9; const e = { kind: 'rowery', o, r, n: 0, need, text: () => `ROWERY DLA EKIPY ${e.n}/${need}`, target: () => null };
        active.push(e); game.flash('Zrzuć rowerzystów: kopniak z roweru, cios pieszo albo wjazd w nich.'); return null; }
    },
    // a paper for someone waiting for the bus
    przystanek(o, r) {
      const has = () => game.papers >= 1 ? null : 'NIE MASZ GAZET';
      run({ who: o.name,
        start: { say: pick(['AUTOBUS ZNOWU SPÓŹNIONY. MASZ GAZETĘ DO POCZYTANIA?', 'MŁODY, CO TAM PISZĄ W GAZECIE? BO JA OKULARY W DOMU ZOSTAWIŁAM.', 'CZEKAM TU OD PÓŁ GODZINY. MASZ COŚ DO CZYTANIA?']), opts: [
          { t: 'PROSZĘ, NA KOSZT FIRMY.', off: has, act: () => { game.papers -= 1; mood(o, 2); done(o); const n = 1 + (rnd() * 3 | 0); game.money(n, head(r), `+${n} ZŁ`); return 'thanks'; } },
          { t: 'ŻE AUTOBUSY JEŻDŻĄ PUNKTUALNIE.', act: () => { done(o); return 'joke'; } },
          { t: 'NIE MAM CZASU.', act: () => { o.cool = 40; return null; } }] },
        thanks: { bye: 'O, JEST NAWET KRZYŻÓWKA!', say: pick(['O, DZIĘKUJĘ! MASZ, NA LODA.', 'ZŁOTE DZIECKO. NIE TO CO TEN ŚPIOCH NA ŁAWCE.']) },
        joke: { bye: 'MĄDRALA SIĘ ZNALAZŁ...', say: 'HA. HA. BARDZO ŚMIESZNE. MOŻE CI JESZCZE NAPISZĄ, ŻE EMERYTURY ROSNĄ.' } });
    },
  };
  function lumpTalk(o, r) {
    if (!(r.awakeT > 0) && !o.flag.met) { run({ who: o.name, start: { say: 'ZZZ... CHRRR... (ŚPI. MOŻE GAZETA GO OBUDZI?)' } }); return; }
    if (o.flag.met) { say(r, o.mood > 0 ? pick(['MŁODY! MÓJ SPONSOR!', 'JA TU WSZYSTKO WIDZĘ. WSZYSTKO.']) : pick(['ZZZ...', 'CZEGO?'])); return; }
    o.flag.met = true;
    run({ who: o.name,
      start: { say: 'O... MŁODY... MASZ DWA ZŁOTE NA BILET? ODDAM. KIEDYŚ.', opts: [
        { t: 'MAM. PROSZĘ.', off: () => game.money.has(2) ? null : 'NIE MASZ DWÓCH ZŁOTYCH', act: () => { game.money(-2, head(r), '-2 ZŁ'); mood(o, 3); return 'gift'; } },
        { t: 'NA BILET? NA PIWO.', act: () => { mood(o, -1); return 'cheek'; } },
        { t: 'NIE MAM.', go: 'none' }] },
      gift: { bye: 'ZA TWOJE ZDROWIE, MŁODY!', say: 'ZŁOTE DZIECKO. JAK COŚ, TO JA TU SIEDZĘ CODZIENNIE I WSZYSTKO WIDZĘ. WSZYSTKO.' },
      cheek: { bye: 'PIWO SIĘ NIE PYTA...', say: 'NA PIWO TO JA MAM. NA BILET NIE MAM. TAKIE ŻYCIE, MŁODY.' },
      none: { say: 'TO CHOCIAŻ GAZETĘ DAJ. NA KOŁDRĘ.', opts: [
        { t: 'MASZ.', off: () => game.papers >= 1 ? null : 'NIE MASZ GAZET', act: () => { game.papers -= 1; mood(o, 1); return null; } },
        { t: 'NIE.', go: null }] } });
  }
  function shacksShop(o, r) {
    run({ who: o.name,
      start: { say: 'MŁODY! GAZETY? OSIEM SZTUK ZA SZEŚĆ ZŁOTYCH. JAK DLA CIEBIE.', opts: [
        { t: 'BIORĘ.', bye: 'MAKULATURA PIERWSZA KLASA!', off: () => game.money.has(6) ? null : 'MASZ ZA MAŁO KASY', act: () => { game.money(-6, head(r), '-6 ZŁ'); game.papers += 8; game.flash('Paczka gazet od ekipy: +8'); return null; } },
        { t: 'NIE TERAZ.', go: null }] } });
  }

  // ---------- the errands' ends ----------
  function delivered(e) {                                              // the letter came: the one there says what they think of it
    remove(e); const d = track.doors[e.house], at = V(d.p.x, d.p.y + 2.4, d.p.z), r = rnd();
    if (r < .35) { hud.rant(at, pick(['OD WNUCZKA! DZIĘKUJĘ!', 'NARESZCIE! CZEKAŁAM OD TYGODNIA!', 'O, ZAPROSZENIE NA IMIENINY!']), false); game.money(e.pay, at, `+${e.pay} ZŁ`); mood(e.o, 1); game.flash('List doszedł. +' + e.pay + ' zł'); e.o.cool = 50; }
    else if (r < .55) { hud.rant(at, pick(['ZNOWU RACHUNEK?! A FE!', 'TO NIE DO MNIE! ALE DAWAJ.', 'REKLAMA. BRAWO.']), false); game.money(2, at, '+2 ZŁ'); game.flash('List doszedł. Nie ucieszył. +2 zł'); e.o.cool = 50; }
    else if (r < .85) { hud.rant(at, e.o.she ? 'OD NIEJ?! TO MOJA ŻONA! MIESZKAM U SIOSTRY OD CZTERECH LAT! PRZEZ PILOTA!' : 'OD NIEGO?! TO MÓJ MĄŻ! MIESZKA U SIOSTRY OD CZTERECH LAT! PRZEZ PILOTA!', false);
      const x = { kind: 'reply', from: 'list', o: e.o, r: e.r, at: e.r, t: 0, text: () => 'ODPOWIEDŹ DLA: ' + e.o.name, target: () => head(e.r), mark: '?', label: () => e.o.name }; x.talk = () => remoteTalk(x); active.push(x);
      game.flash('Jest odpowiedź. Wróć do: ' + e.o.name.toLowerCase() + ' (kiedy będziesz po drodze).'); }
    else { const she = !e.o.she; hud.rant(at, she ? 'OD NIEGO?! POWIEDZ MU, ŻE NIE!' : 'OD NIEJ?! POWIEDZ JEJ, ŻE NIE!', false);
      active.push({ kind: 'reply', from: 'list', o: e.o, r: e.r, at: e.r, text: () => 'ODPOWIEDŹ DLA: ' + e.o.name, target: () => head(e.r), mark: '?', talk: () => replyTalk(e, she) });
      game.flash('Jest odpowiedź. Wróć do: ' + e.o.name.toLowerCase()); }
  }
  function remoteTalk(x) {
    const o = x.o, he = o.she ? 'ON' : 'ONA', top = () => head(x.r), end = () => { remove(x); o.cool = 60; };
    run({ who: o.name,
      start: { say: o.she ? 'I CO? PRZECZYTAŁ? CO MÓWIŁ? TYLKO NIE KŁAM, MŁODY. JA WIEM, KIEDY KTOŚ KŁAMIE. CZTERDZIEŚCI LAT Z NIM.' : 'I CO? PRZECZYTAŁA? CO MÓWIŁA? TYLKO NIE KŁAM, MŁODY. JA WIEM, KIEDY KTOŚ KŁAMIE. CZTERDZIEŚCI LAT Z NIĄ.', opts: [
        { t: `${he} MÓWI, ŻE PILOT JEST ${o.she ? 'JEGO' : 'JEJ'}.`, act: () => { end(); mood(o, 1); game.money(6, top(), '+6 ZŁ'); return 'remote'; } },
        { t: `${he} MÓWI, ŻE TĘSKNI.`, act: () => { end(); mood(o, 2); o.flag.lied = true; o.flag.lieT = 90 + rnd() * 60; game.money(12, top(), '+12 ZŁ'); return 'miss'; } },
        { t: `${he} MA NOWY TELEWIZOR. I NOWEGO PILOTA.`, act: () => { end(); game.money(2, top(), '+2 ZŁ'); return 'tv'; } }] },
      remote: { bye: 'JUTRO BĘDZIE ŁADNA POGODA, MŁODY!', say: 'CZTERY LATA... DOBRA. NIECH MA TEN PILOT. I TAK OGLĄDAM TYLKO POGODĘ. MASZ, ZA LISTONOSZA.' },
      miss: { bye: 'DROŻDŻOWE CZY SERNIK?! SERNIK!', say: 'TĘSKNI?! NO TO... TO JA JUTRO PRZYJDĘ. Z CIASTEM. I Z PILOTEM. MASZ, MŁODY, JESTEŚ ZŁOTY!' },
      tv: { bye: 'NOWY PILOT... KONIEC ŚWIATA...', say: 'NOWEGO PILOTA?! TO KONIEC. KONIEC, MŁODY. ...MASZ DWA ZŁOTE. NA POCIESZENIE. MOJE POCIESZENIE.' } });
  }
  function replyTalk(e, she) {
    const x = active.find(q => q.kind === 'reply' && q.o === e.o), end = () => { remove(x); e.o.cool = 60; };
    run({ who: e.o.name,
      start: { say: she ? 'I CO? DOSZŁO? CO POWIEDZIAŁA?' : 'I CO? DOSZŁO? CO POWIEDZIAŁ?', opts: [
        { t: she ? 'ŻE NIE.' : 'ŻE NIE.', act: () => { end(); mood(e.o, 1); game.money(6, head(e.r), '+6 ZŁ'); return 'truth'; } },
        { t: 'ŻE SIĘ ZASTANOWI.', act: () => { end(); mood(e.o, 2); e.o.flag.lied = true; e.o.flag.lieT = 90 + rnd() * 60; game.money(12, head(e.r), '+12 ZŁ'); return 'lie'; } },
        { t: 'ŻE ' + (e.o.she ? 'PANI' : 'PAN') + ' ZA STARY NA AMORY.', act: () => { end(); mood(e.o, -3); return 'rude'; } }] },
      truth: { bye: 'PRZYNAJMNIEJ WIEM, NA CZYM STOJĘ...', say: 'ACH... NO TRUDNO. MASZ, ZA SZCZEROŚĆ.' },
      lie: { bye: 'PĄCZKI JUTRO! PAMIĘTAJ!', say: 'NAPRAWDĘ?! MŁODY, JESTEŚ ZŁOTY! MASZ! I PRZYJEDŹ JUTRO, BĘDĄ PĄCZKI!' },
      rude: { bye: 'GÓWNIARZ JEDEN!', say: e.o.she ? 'CO?! JA CI DAM AMORY! WYNOCHA, GÓWNIARZU!' : 'CO?! A JA CI DAM ZA STARY! WYNOCHA, GÓWNIARZU!' } });
  }
  function donosTalk(e) {
    if (!e) return; const NB = e.NB, first = e.o.name.split(' ').pop(), at = () => over(doorSpot(e.house), 2.2);
    run({ who: NB[0],
      start: { say: 'NO? CZEGO? JA NIC NIE KUPUJĘ. ŚWIADKÓW TEŻ NIE.', opts: [
        { t: `PAN ${first} CHCE PANU WYBIĆ SZYBĘ. ZA KOSIARKĘ.`, go: 'reveal' },
        { t: 'NIC, POMYLIŁEM DOMY.', act: () => { remove(e); return null; } }] },
      reveal: { say: `ZA KOSIARKĘ?! TĘ RÓŻOWĄ? TO MOJA, MŁODY! ŻONA LUBI RÓŻOWY. A JEGO KOSIARKA STOI U NIEGO W PIWNICY. SAM WIDZIAŁEM, JAK JĄ TAM WCIĄGAŁ W LISTOPADZIE. SAPAŁ JAK PAROWÓZ.`, opts: [
        { t: 'POWIEM MU TO.', bye: 'I POZDRÓW GO OD RÓŻOWEJ!', act: () => { game.money(7, at(), '+7 ZŁ'); toTruth(e); return 'go'; } },
        { t: 'NIECH SIĘ MĘCZY.', bye: 'HEHE. MĘCZ GO, MĘCZ.', act: () => { remove(e); game.money(7, at(), '+7 ZŁ'); e.o.flag.snitch = true; return 'keep'; } }] },
      go: { say: 'POWIEDZ. I POWIEDZ, ŻE SCHABOWEGO NIE ZJADŁEM. TO BYŁ MÓJ SCHABOWY. ON ZJADŁ MÓJ, JA ZJADŁEM JEGO. TAKIE WESELE.' },
      keep: { say: 'HA! ŁADNIE. MASZ SIEDEM ZŁOTYCH. I ZDROWO ROZUMUJESZ, MŁODY.', enter: () => { if (rnd() < .5) game.item('KLUCZ PŁASKI 15', at()); } } });
  }
  function toTruth(e) {                                                 // the truth about the mower, back to the one with the belly
    remove(e); const x = { kind: 'prawda', from: 'szyba', o: e.o, r: e.r, at: e.r, t: 0, text: () => 'PRAWDA O KOSIARCE: ' + e.o.name, target: () => head(e.r), mark: '?', label: () => e.o.name };
    x.talk = () => { remove(x); run({ who: e.o.name,
      start: { say: 'NO I CO? KABLOWAŁEŚ, TAK?', opts: [{ t: 'ON MÓWI, ŻE PANA KOSIARKA STOI W PIWNICY.', go: 'cellar' }, { t: 'NIEWAŻNE.', go: null }] },
      cellar: { say: 'W PIWNICY?... (WSTAJE Z LEŻAKA. TRZASK DRZWI. DŁUGA CISZA. COŚ SPADA ZE SCHODÓW.)', next: 'found' },
      found: { bye: 'I ANI SŁOWA O KOCIE!', say: 'NO. JEST. Z TRZEMA KÓŁKAMI. CZWARTE MA KOT. ...MASZ PIĄTAKA, MŁODY. I NIKOMU. NIKOMU, SŁYSZYSZ?', enter: () => { e.o.mood = Math.max(e.o.mood, 1); e.o.flag.snitch = false; game.money(5, head(e.r), '+5 ZŁ'); e.o.cool = 70; if (!e.o.flag.ownMower) { e.o.flag.ownMower = true; const g = mower('#8d9295', 3), p = e.r.G.position; g.position.set(p.x + 1.2, p.y, p.z + .6); g.rotation.y = rnd() * 6; scene().add(g); } } } }); };
    active.push(x);
  }
  function sorry(e) {                                                   // gone to say sorry to the neighbour for the window
    const sp = doorSpot(e.house), mw = mowerOf(e.house), x = { kind: 'przeprosiny', from: 'szyba', o: e.o, house: e.house, t: 0, text: () => 'PRZEPROŚ ' + e.NB[1], target: () => mw ? mowHead(mw) : over(sp, 2.6), mark: 'v', label: () => e.NB[0], point: { p: mw ? mw.pos : sp, r: null } };
    x.talk = () => { remove(x); run({ who: e.NB[0],
      start: { say: 'SZYBA? A, TO TY. SPOKO, MŁODY. I TAK CHCIAŁEM NOWE OKNA, A UBEZPIECZENIE PŁACI. MOŻE WYBIJESZ MI JESZCZE TO W ŁAZIENCE?', opts: [
        { t: 'A KOSIARKA?', go: 'pink' }, { t: 'TO JA JUŻ POJADĘ.', act: () => { game.money(5, over(sp, 2), '+5 ZŁ'); game.fame(-1); return null; } }] },
      pink: { bye: 'A Z TĄ ŁAZIENKĄ TO NA SERIO MÓWIŁEM!', say: 'JAKA KOSIARKA? A, TA RÓŻOWA? TO MOJA. ŻONA LUBI RÓŻOWY. JEGO STOI U NIEGO W PIWNICY, CAŁA WIEŚ WIE, TYLKO ON NIE. MASZ PIĄTAKA ZA FATYGĘ.', enter: () => { game.money(5, over(sp, 2), '+5 ZŁ'); game.fame(-1); } } }); };
    active.push(x);
  }
  function payTalk(e) {
    const first = e.o.name.split(' ').pop(), top = () => head(e.r);
    run({ who: e.o.name,
      start: { say: `HEHEHE! WIDZIAŁEM! ${e.nb} AŻ Z KAPCI WYSKOCZYŁ. NAUCZKA. DOBRA, MASZ, ZASŁUŻ...`, next: 'wife', enter: () => remove(e) },
      wife: { who: 'GŁOS Z OKNA', say: `${first}!!! KOSIARKA STOI W PIWNICY! SAM JĄ TAM WSTAWIŁEŚ NA ZIMĘ! A TA RÓŻOWA JEST ${e.NB[1]}, BO JEGO ŻONA LUBI RÓŻOWY! CAŁA WIEŚ WIE!`, next: 'oops' },
      oops: { say: 'EE... NO. TO... TEGO. MŁODY. MASZ DYSZKĘ I NIKOMU ANI SŁOWA. DOBRA?', opts: [
        { t: 'DOBRA. NIKOMU.', act: () => { game.money(10, top(), '+10 ZŁ'); mood(e.o, 2); e.o.cool = 60; return 'bye'; } },
        { t: 'ZA MILCZENIE TO DWIE DYSZKI.', act: () => { e.o.cool = 60; if (rnd() < .5) { game.money(20, top(), '+20 ZŁ'); mood(e.o, -1); return 'deal'; } mood(e.o, -3); return 'nodeal'; } },
        { t: `PÓJDĘ PRZEPROSIĆ ${e.NB[1]}.`, act: () => { game.money(10, top(), '+10 ZŁ'); e.o.cool = 60; sorry(e); return 'sorry'; } }] },
      bye: { bye: 'PSST! MNIE TU NIE BYŁO!', say: 'I CICHO SZA. JA LEŻĘ. MNIE TU NIE BYŁO.' },
      deal: { bye: 'GANGSTER SIĘ ZNALAZŁ...', say: 'DOBRA, DOBRA! MASZ! ALE TO JEST SZANTAŻ, MŁODY! ZA MOICH CZASÓW...' },
      nodeal: { bye: 'I NIE WRACAJ!', say: 'DWIE DYSZKI?! WYNOCHA, GÓWNIARZU, BO POWIEM ŻONIE, ŻE TO TWÓJ POMYSŁ BYŁ!' },
      sorry: { bye: 'TYLKO NIE O PIWNICY!', say: 'PRZEPROSIĆ? ...NO IDŹ. TYLKO NIE MÓW, ŻE OD MNIE. I NIE MÓW O PIWNICY.' } });
  }

  // ---------- the thief: a handbag snatched, he runs; kick him (or punch), the bag; back to her, or not ----------
  function startThief() {
    const R = R0(), lady = peds.list.find(p => p.P.key === 'lady' && p.ready), lad = peds.list.find(p => p.P.key === 'teen' && p.ready);
    if (!lady || !lad) return false; const dl = Math.hypot(lady.x - R.x, lady.z - R.z); if (dl < 22 || dl > 85) return false;
    lad.s = lady.s + lady.dir * 2.2; lad.side = lady.side; lad.flee = 999; lad.fleeNew = true; lad.stun = 0; lady.stun = 999; lady.faceT = 0;
    const bag = lady.pr?.handbag; if (bag) bag.visible = false;
    const glow = new THREE.Group(), redM = o => new THREE.MeshBasicMaterial({ color: '#e0473a', transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .7, 28).rotateX(-Math.PI / 2), redM(.8)); ring.position.y = .04; ring.renderOrder = 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .3, 6, 10, 1, true).translate(0, 3, 0), redM(.14)); beam.renderOrder = 2; glow.add(ring, beam); lad.G.add(glow);
    const loot = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .16, .08), new THREE.MeshToonMaterial({ color: '#5a3d27' })); loot.add(b); loot.position.set(.28, .95, .05); lad.G.add(loot);
    const e = { kind: 'thief', stage: 'chase', lad, lady, loot, glow, ring, t: 0, warned: false, text: () => e.stage === 'chase' ? (e.far > 55 ? 'ZŁODZIEJ UCIEKA! ' : 'ZŁODZIEJ: ') + (R0().foot ? 'DOGOŃ I PRZYWAL' : 'DOGOŃ I KOPNIJ') + ' ·' : ({ bag: 'PODNIEŚ TOREBKĘ', back: 'ODDAJ TOREBKĘ PANI', post: 'TOREBKA NA POSTERUNEK', bin: 'TOREBKA DO KOSZA' })[e.stage],
      target: () => e.stage === 'chase' ? V(lad.x, lad.G.position.y + 2.3, lad.z) : e.stage === 'bag' ? (e.drop ? over(e.drop.g.position, 1.6) : null) : e.stage === 'post' ? over(e.post.door, 3.2) : e.stage === 'bin' ? over(binNear(), 1.8) : V(lady.x, lady.G.position.y + 2.3, lady.z),
      mark: () => e.stage === 'back' ? '?' : 'v', col: () => e.stage === 'chase' ? '#e0473a' : '#efc970', label: () => ({ chase: 'ZŁODZIEJ!', bag: 'TOREBKA', back: 'WŁAŚCICIELKA', post: 'POSTERUNEK', bin: 'KOSZ' })[e.stage], point: null, far: 0 };
    active.push(e); hud.rant(V(lady.x, lady.G.position.y + 1.9, lady.z), 'ZŁODZIEJ!!! MOJA TOREBKA!', false);
    game.flash(R.foot ? 'Złodziej! Goń tego z czerwonym światłem i przywal mu.' : 'Złodziej! Goń tego z czerwonym światłem i kopnij go.'); return true;
  }
  function endThief(e, back = true) { remove(e); const { lad, lady } = e; e.glow.parent?.remove(e.glow); lad.flee = 3; lady.stun = 0; if (lady.pr?.handbag && back) lady.pr.handbag.visible = true; e.loot.parent?.remove(e.loot); thiefT = 110 + rnd() * 90; }
  // the bag picked up: what now? Back to her (if you like), in at the police station ahead, the money out and the bag in a bin by the
  // road, or all of it kept. None of them asks you to turn round; what is not done in a few minutes is let go (she gives up).
  function bagPicked(e) {
    e.drop = null; focusAt = null; const post = postAhead(), pd = post ? Math.round(Math.hypot(post.door.x - R0().x, post.door.z - R0().z)) : 0;
    run({ who: 'TOREBKA',
      start: { say: 'W ŚRODKU: PORTFEL Z CZTERDZIESTOMA ZŁOTYMI, SZMINKA, TRZY GUZIKI I ZDJĘCIE KOTA W SWETERKU. CO Z TYM ROBISZ?', opts: [
        { t: 'ODDAM JEJ.', act: () => { e.took = 0; toBack(e); return null; } },
        { t: post ? `ZANIOSĘ NA POSTERUNEK (${pd} M DALEJ).` : 'ZANIOSĘ NA POSTERUNEK.', if: () => !!post, act: () => { e.took = 0; e.stage = 'post'; e.post = post; e.t = 0; e.point = { p: post.door, r: null }; e.talk = () => postTalk(e); game.flash('Na posterunek: zatrzymaj się przy drzwiach i pogadaj.'); return null; } },
        { t: 'KASA DLA MNIE, TOREBKA DO KOSZA.', act: () => { e.took = 40; game.money(40, R0p(), '+40 ZŁ'); e.stage = 'bin'; e.t = 0; game.flash('Torebka do kosza: przejedź obok kosza na śmieci.'); return null; } },
        { t: 'ZATRZYMAM WSZYSTKO.', act: () => { game.money(40, R0p(), '+40 ZŁ'); game.item('DAMSKA TOREBKA', R0p()); game.fame(2); endThief(e, false);
          hud.rant(V(e.lady.x, e.lady.G.position.y + 1.9, e.lady.z), 'DRUGI ZŁODZIEJ!!! POLICJA!', false); return null; } }] } }, { light: true });
  }
  const R0p = () => { const R = R0(); return V(R.x, R.y + 2, R.z); };
  function toBack(e) { e.stage = 'back'; e.t = 0; e.point = { p: null, r: null, ped: e.lady }; e.talk = () => backTalk(e); game.flash('Oddaj torebkę pani ze znakiem zapytania (albo jedź dalej, jak chcesz).'); }
  // the police station ahead (the nearest one in front of you, else the nearest)
  function postAhead() { const R = R0(), fx = Math.sin(R.yaw), fz = Math.cos(R.yaw); let best = null, bd = 1e9;
    for (const q of track.posts || []) { if (!q.door) continue; const dx = q.door.x - R.x, dz = q.door.z - R.z, l = Math.hypot(dx, dz), ahead = (dx * fx + dz * fz) / (l || 1) > .1, k = l + (ahead ? 0 : 400); if (k < bd) { bd = k; best = q; } } return best; }
  const binNear = () => { const R = R0(); let best = null, bd = 1e9; for (const b of track.bins || []) { const l = Math.hypot(b.x - R.x, b.z - R.z); if (l < bd) { bd = l; best = b; } } return best || V(R.x, R.y, R.z); };
  function postTalk(e) {
    remove(e); const { lady } = e; lady.stun = 0; if (lady.pr?.handbag) lady.pr.handbag.visible = true; thiefT = 110 + rnd() * 90;   // (she will have it back from them)
    const top = over(e.post.door, 2.4), twist = rnd(); focusAt = () => over(e.post.door, 1.7);
    run({ who: 'DYŻURNY',
      start: { say: 'TOREBKA? ZNALEZIONA? ...TRZECIA W TYM TYGODNIU. WSZYSTKIE OD TEJ SAMEJ PANI. ONA CHYBA JE ZOSTAWIA SPECJALNIE, ŻEBY KTOŚ PRZYJECHAŁ.', opts: [
        { t: 'TO PO CO?', go: twist < .5 ? 'why1' : 'why2' },
        { t: 'TO JA LECĘ.', act: () => { game.money(12, top, '+12 ZŁ'); game.fame(-2); return 'pay'; } }] },
      why1: { say: 'BO ZA KAŻDYM RAZEM PISZE DO NAS LIST Z PODZIĘKOWANIEM. NA SIEDEM STRON. KOMENDANT JUŻ SIĘ BOI PRZYCHODZIĆ DO PRACY.', next: 'pay', enter: () => { game.money(12, top, '+12 ZŁ'); game.fame(-2); } },
      why2: { say: 'BO JEJ KOT. TEN W SWETERKU. ON TU MIESZKA. NA POSTERUNKU. ONA PRZYCHODZI GO ODWIEDZAĆ, A TOREBKA TO PRETEKST. TYLKO NIE MÓW JEJ, ŻE WIEMY.', next: 'pay', enter: () => { game.money(12, top, '+12 ZŁ'); game.fame(-2); game.item('ODZNAKA "PRZYJACIEL POSTERUNKU"', top); } },
      pay: { bye: 'I NIE JEŹDZIJ PO CHODNIKU!', say: 'MASZ, ZNALEŹNE Z KASY POSTERUNKU. I JEDŹ OSTROŻNIE, MŁODY. WIDZIMY WSZYSTKO.' } });
  }
  function binDone(e, at) { remove(e); endThief(e, false); thiefT = 110 + rnd() * 90; hud.pop(over(at, 1.4), 'DO KOSZA!', '#9fd27a'); game.flash(pick(['Torebka w koszu. Nikt nie widział. Chyba.', 'Do kosza. Kot w sweterku patrzy na ciebie z dna kosza.'])); game.fame(1); }
  function backTalk(e) {
    const top = () => V(e.lady.x, e.lady.G.position.y + 2.2, e.lady.z), fin = () => endThief(e);
    if (!e.took) run({ who: 'PANI Z TOREBKĄ',
      start: { say: 'MÓJ BOHATER! A JUŻ MYŚLAŁAM, ŻE KOTA NIGDY WIĘCEJ NIE ZOBACZĘ. ZNACZY ZDJĘCIA.', opts: [
        { t: 'DROBIAZG.', act: () => { fin(); game.money(10, top(), '+10 ZŁ'); game.item('MEDALIK NA DROGĘ', top()); game.fame(-1); return 'nice'; } },
        { t: 'ZNALEŹNE SIĘ NALEŻY.', act: () => { fin(); game.money(15, top(), '+15 ZŁ'); return 'greedy'; } }] },
      nice: { bye: 'UWAŻAJ NA SIEBIE, SYNKU!', say: 'MASZ, TO MEDALIK MOJEGO ŚWIĘTEJ PAMIĘCI. NA DROGĘ. I DZIESIĘĆ ZŁOTYCH NA LODY.' },
      greedy: { bye: 'CHCIWUS...', say: 'NO TO MASZ, CHCIWUSIE. ZA MOICH CZASÓW TO SIĘ ROBIŁO ZA DZIĘKUJĘ.' } });
    else run({ who: 'PANI Z TOREBKĄ',
      start: { say: 'MÓJ BOHA... CHWILECZKĘ. A GDZIE SĄ PIENIĄDZE?!', opts: [
        { t: 'ZŁODZIEJ JE WYDAŁ.', act: () => { fin(); if (rnd() < .5) { game.money(2, top(), '+2 ZŁ'); return 'believe'; } game.fame(1); return 'liar'; } },
        { t: 'TAKA BYŁA.', act: () => { fin(); game.fame(2); return 'liar'; } },
        { t: 'DOBRA, MAM JE. PROSZĘ.', act: () => { fin(); game.money(-35, top(), '-35 ZŁ'); return 'sorry'; } }] },
      believe: { bye: 'BIEDNE DZIECKO...', say: 'BIEDACTWO, TAK SIĘ NAJEŹDZIŁEŚ. MASZ DWA ZŁOTE. NA OSŁODĘ.' },
      liar: { bye: 'ZŁODZIEJ! ZŁODZIEJ!', say: 'KŁAMCZUCH! DRUGI ZŁODZIEJ! ZAPAMIĘTAM TWOJĄ GĘBĘ!' },
      sorry: { bye: 'NO, NO...', say: 'NO... DZIĘKUJĘ. CHYBA. MASZ PIĄTAKA, ŻE SIĘ PRZYZNAŁEŚ.' } });
  }

  function remove(e) { const i = active.indexOf(e); if (i >= 0) active.splice(i, 1); }

  // ---------- the police: fame, the patrol, the station (telling on people, its board of jobs) ----------
  // fame: bad deeds raise it, good ones lower it, it falls slowly by itself. At 3 or more, now and then (minutes apart) a patrol car comes
  // up behind on its lights: stop and talk (a fine, a warning, a paper as a bribe, an excuse, or telling on someone instead), or ride
  // on (fame up; it gives up after a while). The third time stopped: the run is over. At the station: tell what you know (who asked
  // for a window, who takes bikes) for money and their goodwill, the one told on sees to it (a police car at their house, a grudge, the
  // lads' revenge); jobs from its board: a wanted cyclist, summonses to take round.
  const PO = { fameT: 0, car: null, cool: 140 + rnd() * 80, stops: 0, dirt: [], parked: [], job: null };
  function policeCar() { const c = track.cars.makeCar('saloon', '#f1f0ea'), g = c.group, [hw, hl] = c.half, box = new THREE.Box3().setFromObject(g), top = box.max.y;
    const M = col => new THREE.MeshBasicMaterial({ color: col }), stripe = new THREE.MeshToonMaterial({ color: '#2f5aa0' });
    for (const sd of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.02, .16, hl * 1.7), stripe); st.position.set(sd * (hw + .012), (box.min.y + top) * .42, 0); g.add(st); }
    const red = new THREE.Mesh(new THREE.BoxGeometry(.32, .1, .2), M('#e0473a')), blue = new THREE.Mesh(new THREE.BoxGeometry(.32, .1, .2), M('#3d7be0')); red.position.set(-.17, top + .05, 0); blue.position.set(.17, top + .05, 0); g.add(red, blue);
    return { c, g, red, blue, flash(t, on) { const k = on ? ((t * 4) | 0) % 2 : -1; red.material.color.set(k === 0 ? '#ff5a4a' : '#5e1c17'); blue.material.color.set(k === 1 ? '#5a9aff' : '#1d2f5e'); } }; }
  const along = (s, d) => { const len = track.N * track.ds, w = ((s % len) + len) % len, f = w / track.ds, i0 = Math.floor(f) % track.N, i1 = (i0 + 1) % track.N, t = f - Math.floor(f), A = track.S[i0], Bq = track.S[i1];
    return { x: A.p.x + (Bq.p.x - A.p.x) * t + A.r.x * d, z: A.p.z + (Bq.p.z - A.p.z) * t + A.r.z * d, f: A.f, i: i0 }; };
  const wrapD = (a, b) => { const len = track.N * track.ds; let d = (a - b) % len; if (d > len / 2) d -= len; if (d < -len / 2) d += len; return d; };
  function stepPolice(dt, R) {
    game.fame(-dt / 70); PO.cool -= dt;
    if (PO.job?.kind === 'gonczy' && (!PO.job.b || !PO.job.b.on)) { const b = (game.traffic?.bikes || []).find(x => x.r && x.on && !x.fall); if (b && b !== PO.job.b) { if (PO.job.b) PO.job.b.wanted = false; PO.job.b = b; b.wanted = true; } }
    for (const pk of PO.parked) { pk.t -= dt; pk.car.flash(performance.now() / 1000, pk.t > 0); if (pk.t <= -30) { pk.car.g.parent?.remove(pk.car.g); pk.gone = true; } } PO.parked = PO.parked.filter(p => !p.gone);
    const P0 = PO.car;
    if (!P0) { if (game.fameNow() >= 3 && PO.cool <= 0 && !R.foot && R.v > 2 && !talk.isOpen) {   // a patrol, from behind
        const q = track.probe(R.x, R.z, -1), dir = Math.sign(Math.sin(R.yaw) * q.f.x + Math.cos(R.yaw) * q.f.z) || 1, car = policeCar(); scene().add(car.g);
        PO.car = { car, s: q.s - dir * 55, dir, d: THREE.MathUtils.clamp(q.d, -1.9, 1.9), v: R.v + 4, stage: 'chase', run: 0, t: 0 }; game.flash('Policja! Zatrzymaj się (zwolnij i stań).'); }
      return; }
    const now = performance.now() / 1000, q = track.probe(R.x, R.z, -1), gap = wrapD(q.s - P0.s, 0) * P0.dir; P0.t += dt; P0.car.flash(now, P0.stage !== 'leave');
    if (P0.stage === 'chase') { const want = Math.max(0, (gap - 7) * 1.4 + R.v); P0.v += (Math.min(17, want) - P0.v) * Math.min(1, dt * 2); P0.d += (THREE.MathUtils.clamp(q.d, -1.9, 1.9) - P0.d) * Math.min(1, dt * 1.5);
      if (gap < 14 && R.v < 1.2 && !talk.isOpen && !R.foot) { P0.stage = 'stop'; P0.v = 0; stopTalk(P0); }
      else if (gap < 30) { P0.run += R.v > 1.5 ? dt : 0; if (P0.run > 14) { P0.stage = 'leave'; game.fame(2); game.flash('Uciekłeś policji. Sława rośnie.'); } }
      if (P0.t > 70) { P0.stage = 'leave'; } }
    else if (P0.stage === 'stop') { P0.v = 0; const ts = q.s - P0.dir * 3.2, k = Math.min(1, dt * 1.8); P0.s += wrapD(ts, P0.s) * k; P0.d += ((q.d - (Math.sign(q.d) || 1) * 2.5) - P0.d) * k;   // (pulls up beside him, on the road side)
      if (!talk.isOpen && P0.t > 1) { P0.stage = 'leave'; } }
    else { P0.v += (15 - P0.v) * Math.min(1, dt); P0.d += ((P0.dir > 0 ? 1.75 : -1.75) - P0.d) * Math.min(1, dt); if (gap < -70 || P0.t > 120) { P0.car.g.parent?.remove(P0.car.g); PO.car = null; PO.cool = 160 + rnd() * 120; return; } }
    if (P0.stage === 'leave' && P0.t < 1e6 && !P0.left) { P0.left = true; P0.t = 0; }
    P0.s += P0.dir * P0.v * dt; const a = along(P0.s, P0.d), y = track.probe(a.x, a.z, a.i).y; P0.car.g.position.set(a.x, y, a.z); P0.car.g.rotation.y = Math.atan2(a.f.x * P0.dir, a.f.z * P0.dir);
  }
  const why = () => { const f = game.fameNow(); return f >= 6 ? 'MAMY NA PANA CAŁĄ TECZKĘ. SZYBY, ROWERZYŚCI, JAKAŚ TOREBKA...' : f >= 4 ? 'ZGŁOSZENIA MAMY. SZYBY, PRZEWRÓCENI ROWERZYŚCI.' : 'ZGŁOSZENIE BYŁO. ŻE JAKIŚ CHULIGAN NA ROWERZE.'; };
  function stopTalk(P0) {
    PO.stops++; const third = PO.stops >= 3, at = () => V(P0.car.g.position.x, P0.car.g.position.y + 1.6, P0.car.g.position.z), fine = Math.max(5, Math.round(game.fameNow() * 4));
    focusAt = at; const end = msg => { if (third) setTimeout(() => game.endRun(msg), 900); };
    const tell = PO.dirt.filter(d => !d.told).map(d => ({ t: `${d.what}`, act: () => { snitch(d); game.fame(-2); return 'deal'; } }));
    run({ who: 'POSTERUNKOWY KAPUSTA',
      start: { say: third ? 'ZNOWU PAN?! TRZECI RAZ DZISIAJ! KONIEC TRASY NA DZIŚ, ROWER NA PARKING POLICYJNY.' : `DZIEŃ DOBRY. POSTERUNKOWY KAPUSTA. DOKUMENTY ROWERU PROSZĘ. ${why()}`, opts: third ? [{ t: 'ALE PANIE WŁADZO...', act: () => { end('Trzecie zatrzymanie: koniec trasy.'); return 'over'; } }] : [
        { t: 'PRZEPRASZAM. TO SIĘ WIĘCEJ NIE POWTÓRZY.', act: () => { game.money(-fine, at(), `-${fine} ZŁ`); game.fame(-2); return 'fined'; } },
        { t: 'TO NIE JA. TO MÓJ BRAT BLIŹNIAK.', act: () => { if (rnd() < .4) { game.fame(-1); return 'twin'; } game.money(-fine * 2, at(), `-${fine * 2} ZŁ`); return 'twinNo'; } },
        { t: 'GAZETKĘ? NA KOSZT FIRMY.', off: () => game.papers >= 1 ? null : 'NIE MASZ GAZET', act: () => { game.papers -= 1; if (rnd() < .35) { game.fame(-1); return 'bribe'; } game.money(-fine * 2, at(), `-${fine * 2} ZŁ`); game.fame(1); return 'bribeNo'; } },
        ...(tell.length ? [{ t: 'A MOGĘ COŚ ZGŁOSIĆ? W ZAMIAN.', go: 'tell' }] : [])] },
      tell: { say: 'O. SŁUCHAM. JAK BĘDZIE CIEKAWE, TO MANDAT ZAPOMNIMY.', opts: [...tell, { t: 'NIEWAŻNE. PŁACĘ.', act: () => { game.money(-fine, at(), `-${fine} ZŁ`); game.fame(-2); return 'fined'; } }] },
      deal: { bye: 'I NIE MÓW NIKOMU, ŻE OD NAS!', say: 'NO PROSZĘ. TO ZMIENIA POSTAĆ RZECZY. MANDATU NIE BĘDZIE. JEDŹ, MŁODY. I OSTROŻNIE.' },
      fined: { bye: 'I KASK BY SIĘ PRZYDAŁ!', say: `MANDAT: ${fine} ZŁOTYCH. I ŻEBYM PANA WIĘCEJ NIE WIDZIAŁ. ZNACZY WIDZIAŁ, ALE GRZECZNEGO.` },
      twin: { bye: 'POZDRÓW BRATA!', say: 'BLIŹNIAK? ...FAKTYCZNIE, TAMTEN MIAŁ CZERWONĄ CZAPKĘ. A, PAN TEŻ MA. NO NIC. JEDŹ.' },
      twinNo: { bye: 'BRATU TEŻ WYPISZEMY!', say: 'BLIŹNIAK. JASNE. TO DLA BRATA TEŻ MANDAT. PODWÓJNY.' },
      bribe: { bye: 'HOROSKOP CZYTAM NAJPIERW!', say: 'NO... DOBRA. ALE TYLKO DLATEGO, ŻE JEST KRZYŻÓWKA. OSTATNI RAZ.' },
      bribeNo: { bye: 'PRZEKUPSTWO, PROSZĘ PANA!', say: 'PRÓBA PRZEKUPSTWA FUNKCJONARIUSZA GAZETĄ?! MANDAT PODWÓJNY. I GAZETĘ ZATRZYMUJĘ. DOWÓD RZECZOWY.' },
      over: { say: 'PANIE, TRZY RAZY. TRZY. MAMY TU TABELKĘ. DO DOMU NA PIECHOTĘ, ROWER ODBIERZE MAMA.' } });
  }
  // what you know: who could be told on (set as stories go)
  function know(key, what, o) { if (!PO.dirt.some(d => d.key === key)) PO.dirt.push({ key, what, o, told: false }); }
  function snitch(d) {
    d.told = true; const o = d.o; mood(o, -6); o.flag.snitched = true; o.offer = null; o.cool = 1e9;
    const pos = o.lead.G.position, q = track.probe(pos.x, pos.z, -1), S = track.S[q.i], sd = Math.sign(q.d) || 1, car = policeCar(); car.g.position.set(S.p.x + S.r.x * sd * 3.2, S.p.y, S.p.z + S.r.z * sd * 3.2); car.g.rotation.y = Math.atan2(S.f.x, S.f.z); scene().add(car.g);
    PO.parked.push({ car, t: 90 }); game.flash(d.key === 'ekipa' ? 'Ekipa spod beczki wie, kto doniósł. Uważaj przy barakach.' : 'Radiowóz pojechał do: ' + o.name.toLowerCase() + '.');
    if (d.key === 'ekipa') o.flag.revenge = true;
  }
  // the station: always someone at the desk
  function stationTalk(post) {
    focusAt = () => over(post.door, 1.7); const tell = PO.dirt.filter(d => !d.told);
    run({ who: 'DYŻURNY',
      start: { say: pick(['POSTERUNEK. W CZYM POMÓC? TYLKO SZYBKO, BO MI KAWA STYGNIE.', 'SŁUCHAM. ZGŁOSZENIE? SKARGA? ZNALEZIONY KOT?']), opts: [
        { t: 'CHCĘ COŚ ZGŁOSIĆ.', if: () => tell.length > 0, go: 'tell' },
        { t: 'MACIE COŚ DLA MNIE DO ROBOTY?', if: () => !PO.job, go: 'board' },
        { t: 'NIC, TYLKO PATRZĘ.', bye: 'TO NIE MUZEUM!', go: null }] },
      tell: { say: 'NO TO SŁUCHAM. PROTOKÓŁ PISZĘ.', opts: [...tell.map(d => ({ t: d.what, act: () => { snitch(d); game.money(d.key === 'ekipa' ? 15 : 10, over(post.door, 2.2), `+${d.key === 'ekipa' ? 15 : 10} ZŁ`); game.fame(-2); return 'thanks'; } })), { t: 'JEDNAK NIC.', go: null }] },
      thanks: { bye: 'I NIC NIE SŁYSZAŁEŚ OD NAS!', say: 'DZIĘKUJEMY ZA OBYWATELSKĄ POSTAWĘ. MASZ, Z FUNDUSZU INFORMATORA. FUNDUSZ TO JEST SŁOIK.' },
      board: { say: 'NA TABLICY MAM DWIE RZECZY. ROWERZYSTA, CO KOPIE LUSTERKA W AUTACH. I WEZWANIA DO ROZNIESIENIA, BO LISTONOSZ NA L4.', opts: [
        { t: 'ZŁAPIĘ ROWERZYSTĘ.', act: () => { jobWanted(); return null; }, bye: 'TYLKO BEZ PRZESADY!' },
        { t: 'ROZNIOSĘ WEZWANIA.', act: () => { jobSummons(); return null; }, bye: 'NIE CZYTAJ ICH PO DRODZE!' },
        { t: 'TO NIE DLA MNIE.', go: null }] } });
  }
  // a job: the wanted cyclist (knock him off his bike; paid over the radio, no need to go back)
  function jobWanted() {
    // (the first cyclist out on the road is the one; none yet: the job waits for one)
    const e = { kind: 'gonczy', b: null, text: () => e.b ? 'LIST GOŃCZY: ROWERZYSTA' : 'LIST GOŃCZY: WYPATRUJ ROWERZYSTY', target: () => { if (!e.b) return null; const p = e.b.r.root.position; return V(p.x, p.y + 2.4, p.z); }, mark: 'v', col: '#e0473a', label: () => 'POSZUKIWANY' };
    PO.job = e; active.push(e); game.flash('List gończy: rowerzysta z czerwoną strzałką. Zrzuć go z roweru.');
  }
  function jobSummons() {
    const hs = []; for (let k = 0; k < 3; k++) { const hi = houseAhead(40 + k * 40, 240 + k * 40); if (hi != null && !hs.includes(hi)) hs.push(hi); } if (!hs.length) { game.flash('Dziś nie ma komu. Przyjdź później.'); return; }
    const e = { kind: 'wezwania', left: [...hs], n: hs.length, text: () => `WEZWANIA: ${e.n - e.left.length}/${e.n}`, target: () => { const d = track.doors[e.left[0]]; return d ? over(d.p, 3.4) : null; }, mark: 'v', label: () => 'WEZWANIE' };
    PO.job = e; active.push(e); game.flash('Wezwania: rzuć pod drzwi domów ze strzałką.');
  }

  // ---------- each frame ----------
  function update(dt, inp) {
    const R = R0(); flashT -= dt; byeT = Math.max(0, byeT - dt); for (const r of residents.list) person(r); stepStage(dt); stepPolice(dt, R);
    for (const o of new Set(P.values())) { o.cool -= dt; if (o.flag.lied) o.flag.lieT -= dt; o.redo = false; }
    // passing by: moods acted on (a bottle, a coin, a lie found out)
    for (const [r, o] of P) { if (o.lead !== r) continue; o.passT -= dt; const d = Math.hypot(r.G.position.x - R.x, r.G.position.z - R.z); if (d > 11 || o.passT > 0) continue;
      if (o.flag.lied && o.flag.lieT <= 0) { o.flag.lied = false; mood(o, -4); say(r, o.she ? 'OKŁAMAŁEŚ MNIE! ON MA INNĄ!' : 'OKŁAMAŁEŚ MNIE! ONA MA INNEGO!'); o.passT = 20; continue; }   // (the lie found out)
      if (o.flag.revenge) { o.flag.revenge = false; o.passT = 40; say(r, 'TO TEN KABEL! BRAĆ GO!'); const p = r.G.position; setTimeout(() => game.grudgeAt(V(p.x, p.y, p.z), 'KABLE SIĘ BIJE!', 'kozak'), 700); continue; }
      if (o.flag.snitched && rnd() < .5) { o.passT = 30; say(r, o.kind === 'shacks' ? 'KABEL JEDEN...' : 'KABEL! PRZEZ CIEBIE MANDAT DOSTAŁEM!'); if (!R.foot && R.v > 2) setTimeout(() => game.bottle(), 450); continue; }
      if ((o.mood <= -3 || o.flag.snitch) && R.v > 2 && !R.foot) { o.passT = 28; say(r, o.flag.snitch ? 'KABLARZ!' : pick(['MASZ, PAN Z ROWERKIEM!', 'ŁAP!'])); setTimeout(() => game.bottle(), 450); o.flag.snitch = false; continue; }
      if (o.mood >= 3 && rnd() < .35) { o.passT = 60; say(r, pick(['TRZYMAJ, MŁODY! NA LODY!', 'DLA NASZEGO GAZECIARZA!'])); game.money(2, head(r), '+2 ZŁ'); continue; }
      o.passT = 8; }
    // an errand left long enough: let go (you are never made to go back for one); its giver may have another later
    for (const e of [...active]) { if (e.kind === 'thief') continue; e.age = (e.age || 0) + dt; if (e.age > 300) { remove(e); if (e.o) e.o.cool = Math.min(e.o.cool, 60); game.flash('Sprawa przepadła: ' + e.text().toLowerCase()); } }
    // the director: now and then (about a minute apart, never more than two at once) someone ahead of you gets a matter; one you rode
    // past is let go (another, later, further on)
    { const fx = Math.sin(R.yaw), fz = Math.cos(R.yaw), ahead = r => { const dx = r.G.position.x - R.x, dz = r.G.position.z - R.z, l = Math.hypot(dx, dz) || 1; return [l, (dx * fx + dz * fz) / l]; };
      let open = 0; for (const [r, o] of P) { if (o.lead !== r || !o.offer) continue; const [l, dot] = ahead(r); if (dot < -.3 && l > 45 && !busy(o.offer)) { o.offer = null; o.cool = Math.max(o.cool, 60); } else open++; }
      if ((offerT -= dt) <= 0) { offerT = 6;
        if (open < 2 && !talk.isOpen) { const c = []; for (const [r, o] of P) { if (o.lead !== r || o.offer || o.cool > 0) continue; const [l, dot] = ahead(r); if (l < 50 || l > 220 || dot < .3) continue; offerFor(o, true); if (o.offer && !busy(o.offer)) c.push(o); o.offer = null; }
          if (c.length) { const o = pick(c); offerFor(o, true); while (!o.offer) offerFor(o, true); if (o.kind === 'shacks' && o.mood <= -3) o.offer = null; offerT = 50 + rnd() * 45; } } } }
    // the thief
    const th = active.find(e => e.kind === 'thief');
    if (!th) { if (R.v > 1.5 && (thiefT -= dt) <= 0) { if (!startThief()) thiefT = 6; } }
    else { th.t += dt; if (th.stage === 'chase') { th.lad.flee = 999; th.lad.stun = 0; th.far = Math.hypot(th.lad.x - R.x, th.lad.z - R.z); const k = 1 + Math.sin(th.t * 9) * .18; th.ring.scale.set(k, 1, k);
        if (th.far > 60 && !th.warned) { th.warned = true; game.flash('Ucieka! Jeszcze kawałek i po torebce.'); } if (th.far < 45) th.warned = false;
        if (th.far > 80 || th.t > 90) { game.flash('Uciekł. Torebka przepadła.'); hud.rant(V(th.lady.x, th.lady.G.position.y + 1.9, th.lady.z), 'NO PIĘKNIE...', false); endThief(th, false); } }
      else { th.lady.stun = 999;
        if (th.stage === 'bin') { const b = binNear(); if (Math.hypot(b.x - R.x, b.z - R.z) < 2.8) binDone(th, b); }
        if (active.includes(th) && th.stage !== 'bag' && th.t > 180) { game.flash(th.stage === 'bin' ? 'Torebkę wciąż wieziesz. Pani już nie szuka.' : 'Pani poszła do domu. Torebka zostaje u ciebie.'); endThief(th, false); } } }
    // who is in reach to talk to (the bike: slow, a few metres; on foot: close)
    near = null; const reach = R.foot ? 3.2 : 8.5; let bd = reach;
    const consider = (p, run, prio = 0, focus) => { const d = Math.hypot(p.x - R.x, p.z - R.z) - prio; if (d < bd) { bd = d; near = { p, run, focus: focus || (() => V(p.x, (p.y || 0) + 1.5, p.z)) }; } };
    for (const e of active) if (e.talk) { const pt = e.point?.ped ? V(e.point.ped.x, e.point.ped.G.position.y, e.point.ped.z) : e.point?.p || (e.at && e.at.G.position); if (pt) consider(pt, e.talk, 2, e.at ? () => head(e.at) : e.point?.ped ? () => V(e.point.ped.x, e.point.ped.G.position.y + 1.6, e.point.ped.z) : null); }
    for (const post of track.posts || []) if (post.door && !active.some(e => e.post === post && e.talk)) consider(post.door, () => stationTalk(post), 0, () => over(post.door, 1.7));
    for (const [r, o] of P) if (o.lead === r && r.G.visible !== false) consider(r.G.position, () => converse(r), o.offer && o.cool <= 0 ? 1 : 0, () => head(r));
    if (near && !talk.isOpen) { near.slow = R.foot || R.v < 3.2; const ask = R.foot ? inp.talk : inp.chat; if (ask && near.slow) { focusAt = near.focus; near.run(); if (R.foot) inp.talk = false; } else if (ask && !near.slow && flashT <= 0) { game.flash('Zwolnij, żeby pogadać'); flashT = 2; } }
  }

  // ---------- what the HUD shows ----------
  function marks() {
    const out = [], R = R0();
    if (talk.isOpen) return out;                                         // (in a talk: no marks over the scene)
    for (const [r, o] of P) { if (o.lead !== r || !o.offer || o.cool > 0 || busy(o.offer)) continue; if (Math.hypot(r.G.position.x - R.x, r.G.position.z - R.z) > 110) continue; out.push({ p: head(r), s: '!', col: '#efc970' }); }
    for (const e of active) { const p = e.target?.(); if (!p) continue; const s = typeof e.mark === 'function' ? e.mark() : e.mark || 'v', col = typeof e.col === 'function' ? e.col() : e.col || '#efc970', dist = Math.round(Math.hypot(p.x - R.x, p.z - R.z));
      out.push({ p, s, col, edge: true, dist, label: e.label ? e.label() + ' ' + dist + ' M' : null }); }
    if (PO.car && PO.car.stage === 'chase') { const g = PO.car.car.g.position; out.push({ p: V(g.x, g.y + 2.4, g.z), s: 'v', col: '#3d7be0', edge: true, label: 'POLICJA', dist: 0 }); }
    if (near && !talk.isOpen) { const p = near.p.clone ? near.p.clone() : V(near.p.x, near.p.y, near.p.z); p.y += 2.6; out.push({ p, s: '', label: near.slow ? game.talkKey() : 'ZWOLNIJ', col: '#f6f3ea' }); }
    return out;
  }
  function tracker() { const R = R0(); return (PO.car && PO.car.stage === 'chase' ? ['POLICJA! ZWOLNIJ I STAŃ' + (PO.car.run > 4 ? ` (UCIEKASZ ${Math.max(0, Math.ceil(14 - PO.car.run))} S)` : '')] : []).concat(active.map(e => { const p = e.target?.(); return e.text() + (p ? ' ' + Math.round(Math.hypot(p.x - R.x, p.z - R.z)) + ' M' : ''); })); }

  // ---------- what happened in the world ----------
  function onLand(P0) {
    for (const e of [...active]) if (e.kind === 'wezwania') for (const hi of [...e.left]) { const mb = mailboxOf(hi), sp = doorSpot(hi);
      if (Math.hypot(P0.x - sp.x, P0.z - sp.z) < 2.6 || (mb && Math.hypot(P0.x - mb.o.position.x, P0.z - mb.o.position.z) < 1.8)) { e.left.splice(e.left.indexOf(hi), 1); const d = track.doors[hi], at = V(d.p.x, d.p.y + 2.4, d.p.z);
        hud.rant(at, pick(['WEZWANIE?! ZA CO?!', 'TO PEWNIE ZA TEGO PSA...', 'JA NIC NIE ZROBIŁEM! NO, PRAWIE NIC.', 'ZNOWU ZA PARKOWANIE NA TRAWNIKU?!']), false); game.money(4, at, '+4 ZŁ');
        if (!e.left.length) { remove(e); PO.job = null; game.money(5, at, '+5 ZŁ'); game.flash('Wezwania rozniesione. Premia od dyżurnego +5 zł'); } } }
    for (const e of [...active]) if (e.kind === 'list') { const mb = mailboxOf(e.house), sp = doorSpot(e.house);
      if (Math.hypot(P0.x - sp.x, P0.z - sp.z) < 2.6 || (mb && Math.hypot(P0.x - mb.o.position.x, P0.z - mb.o.position.z) < 1.8)) delivered(e); }
  }
  function onWindow(w) {
    for (const e of [...active]) if (e.kind === 'szyba' && e.house === w.house) { e.kind = 'kasa'; e.from = 'szyba'; e.text = () => 'DYSZKA OD: ' + e.o.name; e.target = () => head(e.r); e.mark = '?'; e.at = e.r; e.talk = () => payTalk(e);
      const mw = mowerOf(e.house); if (mw) { mw.angry = 25; } game.flash('Brzdęk! Po dyszkę do: ' + e.o.name.toLowerCase()); if (rnd() < .5) { const sp = doorSpot(e.house); setTimeout(() => game.grudgeAt(sp, pick(['MOJA SZYBA!!!', 'JA CI DAM SZYBY!', 'ŁAP GO!']), 'kozak'), 900); } }
  }
  function onKnockBike(b) {                                            // (a cyclist off his bike: the wanted one, or for the lads, if they asked)
    if (b && b.wanted) { b.wanted = false; const j = active.find(q => q.kind === 'gonczy'); if (j) remove(j); PO.job = null; game.money(15, V(R0().x, R0().y + 2, R0().z), '+15 ZŁ'); game.fame(-2); game.flash('Dyżurny przez radio: mamy go! +15 zł'); }
    else game.fame(1);
    const e = active.find(q => q.kind === 'rowery'); if (!e) return; e.n++; game.flash(`Rower dla ekipy: ${e.n}/${e.need}`);
    if (e.n >= e.need) { e.kind = 'rowery-back'; e.from = 'rowery'; e.text = () => 'WRÓĆ DO: EKIPA SPOD BECZKI'; e.target = () => head(e.r); e.mark = '?'; e.at = e.r;
      e.talk = () => run({ who: e.o.name, start: { say: 'WIDZIELIŚMY! ŁADNIE ICH POZBIERAŁEŚ. MASZ, MAKULATURA, JAK OBIECALIŚMY. KASY I TAK NIE MAMY.', enter: () => { remove(e); const n = 6 * e.need; game.papers += n; game.flash('Makulatura od ekipy: +' + n + ' gazet'); mood(e.o, 2); game.fame(1); e.o.cool = 70; } } }); }
  }
  function onHitPed(p) {
    const e = active.find(q => q.kind === 'thief' && q.stage === 'chase' && q.lad === p); if (!e) return false;
    e.stage = 'bag'; p.flee = 5; p.fleeNew = true; p.stun = .9; e.loot.parent?.remove(e.loot); e.glow.parent?.remove(e.glow); hud.rant(V(p.x, p.G.position.y + 1.9, p.z), pick(['AŁA! DOBRA, DOBRA!', 'MOJA NOGA!', 'TO NIE JA!']), false);
    e.drop = game.dropBag(V(p.x, p.G.position.y, p.z), () => bagPicked(e)); game.flash('Torebka na chodniku. Podnieś ją.'); return true;
  }
  function reset() { PO.car?.car.g.parent?.remove(PO.car.car.g); for (const pk of PO.parked) pk.car.g.parent?.remove(pk.car.g); Object.assign(PO, { car: null, cool: 140 + rnd() * 80, stops: 0, dirt: [], parked: [], job: null }); for (const e of [...active]) if (e.kind === 'thief') endThief(e); for (const S of stage) { S.mower.parent?.remove(S.mower); S.who?.G.parent?.remove(S.who.G); } stage.length = 0; active.length = 0; P.clear(); thiefT = 60 + rnd() * 50; }
  return { update, marks, tracker, onLand, onWindow, onHitPed, onKnockBike, reset, get canChat() { return !!near; }, get siren() { return !!PO.car && PO.car.stage === 'chase'; }, police: PO, people: P, get focus() { return talk.isOpen && focusAt ? focusAt() : byeT > 0 && byeAt ? byeAt() : null; }, get kickHint() { const e = active.find(q => q.kind === 'thief' && q.stage === 'chase'); return !!e && e.far < 4.2; }, get active() { return active; }, startThief };
}
