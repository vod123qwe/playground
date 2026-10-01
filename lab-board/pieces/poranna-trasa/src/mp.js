// Two players over the network (net.js), each on his own computer, the same loop and the same houses. Player 1 is the host (he
// made KOD 1), player 2 the guest. Each rides himself; the other is seen as he rides (sent 15 times a second), marked over his head,
// and at the picture's edge when out of sight, with how far. A house served by one is served for both. The host chooses the way:
//   WSPÓLNA JAZDA: no clock, just the two of you on the loop.
//   WYŚCIG GAZECIARZY: four minutes: who earns more. A kick at the other throws him off his bike.
//   RAZEM: five minutes to deliver 20 papers between you; a kick at the other only jostles.
//   BEREK: three minutes; one is "it" (red), a kick at the other passes it on (then 3 s safe). Who was "it" less, wins.
// Each begins from home with a count of three, both at once, and ends on a page of the scores: AGAIN (the host; Enter) or back to the
// lobby (Esc). Esc on the lobby leaves the network game.
// createMp({ api, net }) → { openLobby(), start(id) (host), onMsg(m) (from main), update(dt), key(e), kick(a, b), get on, get id,
//   get isOpen (a page of its own is open), get counting, get it }
//   api: { me() (1 or 2), B(k), begin(), end(), flash(s), pop(k, text, col), audio, subs(), applySubs(a) }

export const MP_MODES = {
  free: { name: 'WSPÓLNA JAZDA', info: 'BEZ ZEGARA, PO PROSTU RAZEM', T: 0 },
  race: { name: 'WYŚCIG GAZECIARZY', info: 'KTO WIĘCEJ ZAROBI W 4 MINUTY', T: 240 },
  coop: { name: 'RAZEM', info: '20 GAZET WE DWÓCH W 5 MINUT', T: 300, goal: 20 },
  tag: { name: 'BEREK NA ROWERACH', info: 'KOPNIJ, ŻEBY ODDAĆ BERKA', T: 180 } };

export function createMp({ api, net }) {
  const css = document.createElement('style'); css.textContent = `
    #mpbar { position: fixed; left: 50%; top: 8px; transform: translateX(-50%); z-index: 4; display: none; pointer-events: none; font: 700 12px/1.15 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: .08em; color: #f6f3ea; text-align: center; }
    #mpbar.on { display: block; } #mpbar .row { display: flex; gap: 10px; align-items: center; justify-content: center; background: rgba(23,24,27,.86); box-shadow: 0 0 0 2px #17181b; padding: 4px 10px; }
    #mpbar .p1 { color: #efc970; } #mpbar .p2 { color: #8fc3f0; } #mpbar .clock { font-size: 20px; color: #f6f3ea; min-width: 64px; } #mpbar .clock.low { color: #cf5a3e; } #mpbar .name { font-size: 9px; opacity: .8; margin-top: 3px; text-shadow: 1px 1px 0 #17181b; }
    #mpcd { position: fixed; inset: 0; z-index: 4; display: none; place-items: center; pointer-events: none; font: 700 120px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #efc970; text-shadow: 6px 6px 0 #17181b; } #mpcd.on { display: grid; }
    .mppage { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; background: rgba(12,13,15,.86); color: #f6f3ea; font: 700 13px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; }
    .mppage.on { display: grid; } .mppage .box { width: min(480px, calc(100vw - 28px)); box-sizing: border-box; padding: 18px; background: #17181b; border: 2px solid #efc970; max-height: calc(100vh - 28px); overflow: auto; }
    .mppage h2 { margin: 0 0 4px; color: #efc970; font-size: 20px; letter-spacing: .12em; } .mppage .why { font-size: 13px; margin: 6px 0 12px; text-transform: none; line-height: 1.45; } .mppage .why b { color: #efc970; }
    .mppage .st { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 14px; margin-bottom: 10px; } .mppage .st .h { opacity: .6; font-size: 10px; } .mppage .p1 { color: #efc970; } .mppage .p2 { color: #8fc3f0; }
    .mppage button { all: unset; cursor: pointer; display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 10px; border: 1.5px solid #efc970; color: #efc970; margin-top: 8px; } .mppage button:hover, .mppage button.pad-focus { background: #efc970; color: #17181b; }
    .mppage button.dim { border-color: #44484c; color: #9a968c; } .mppage small { display: block; font-size: 10px; opacity: .65; margin: 2px 0 0; text-transform: none; }
    .mppage textarea { width: 100%; box-sizing: border-box; height: 74px; margin-top: 6px; background: #0c0d0f; color: #d3d0c3; border: 1.5px solid #44484c; font: 11px/1.3 ui-monospace, Consolas, monospace; resize: none; word-break: break-all; }`;
  document.head.appendChild(css);
  const el = (id, cls, html = '') => { const e = document.createElement('div'); if (id) e.id = id; if (cls) e.className = cls; e.innerHTML = html; document.body.appendChild(e); return e; };
  const bar = el('mpbar', '', '<div class="row"><span class="p1"></span><span class="clock"></span><span class="p2"></span></div><div class="name"></div>'), cd = el('mpcd');
  const lob = el('mplobby', 'mppage', '<div class="box"></div>'), box = lob.firstChild;
  const end = el('mpend', 'mppage', '<div class="box"><h2></h2><div class="why"></div><div class="st"></div><button class="again">JESZCZE RAZ (ENTER)</button><button class="out">DO LOBBY (ESC)</button></div>');
  end.querySelector('.again').onclick = () => again(); end.querySelector('.out').onclick = () => toLobby();
  const [s1, clockE, s2] = bar.firstChild.children, nameE = bar.lastChild;
  const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  let M = null, page = null;   // (page: 'lobby' | 'end' | null)
  const st = k => api.B(k), me = () => api.me(), other = () => 3 - api.me();

  // ---------- the lobby: make a game / join one, the codes, the way to play ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function view(html, wire) { box.innerHTML = html; wire?.(); page = 'lobby'; lob.classList.add('on'); }
  // (the links: the invitation opens the game where the friend can reach it, the public page; the answer opens the host's own, where
  // his game waits: a tab opened by it hands the code over to that one and is done)
  const PUBLIC = 'https://vod123qwe.github.io/playground/lab-board/pieces/poranna-trasa/', here = () => location.origin + location.pathname;
  const local = /^(localhost|127\.|\[::1\])/.test(location.hostname), inviteBase = () => local && !new URLSearchParams(location.search).has('lokalnie') ? PUBLIC : here();
  const codeOf = (s, key) => { s = s.trim(); const i = s.indexOf('#' + key + '='); if (i >= 0) s = s.slice(i + key.length + 2); return s.split('&')[0]; };
  let answerCh = null; const stopAnswer = () => { answerCh?.close(); answerCh = null; };
  function openLobby() { if (net.on) return chooseMode(); const bcq = new URLSearchParams(location.search).get('bc');
    view(`<h2>GRA PRZEZ SIEĆ</h2><div class="why">Każdy gra u siebie, widzicie się nawzajem. Połączenie idzie prosto między waszymi przeglądarkami, bez serwera: wysyłacie sobie dwa linki (np. na czacie).</div>
      <button class="mk">ZAŁÓŻ GRĘ<small>dostaniesz link dla znajomego</small></button><button class="jn">MAM LINK OD ZNAJOMEGO<small>albo wklej go tutaj</small></button>${bcq ? `<button class="bc">TEST: DWIE KARTY (${esc(bcq)})</button>` : ''}<button class="dim out">WRÓĆ (ESC)</button>`, () => {
      box.querySelector('.mk').onclick = () => hostFlow(); box.querySelector('.jn').onclick = () => joinFlow(); box.querySelector('.out').onclick = () => closeLobby();
      if (bcq) box.querySelector('.bc').onclick = () => { net.bc(bcq, !sessionStorage.getItem('pt.bcguest')); waitLink(); }; }); }
  const copyBtn = () => { const ta = box.querySelector('textarea.code'), b = box.querySelector('.cp'), lbl = b.textContent; b.onclick = async () => { ta.select(); try { await navigator.clipboard.writeText(ta.value); b.textContent = 'SKOPIOWANO!'; } catch { document.execCommand?.('copy'); b.textContent = 'ZAZNACZONO: CTRL+C'; } setTimeout(() => { b.textContent = lbl; }, 2000); }; };
  async function hostFlow() { view('<h2>ZAKŁADAM GRĘ...</h2><div class="why">Chwila, szukam drogi do Ciebie.</div>');
    let code; try { code = await net.host(); } catch (e) { return fail('Nie udało się przygotować połączenia.'); }
    const link = inviteBase() + '#dolacz=' + code + '&do=' + encodeURIComponent(here());
    view(`<h2>ZAPROSZENIE</h2><div class="why"><b>1.</b> Skopiuj link i wyślij znajomemu.<br><b>2.</b> Gdy go kliknie, gra da mu link zwrotny dla Ciebie.<br><b>3.</b> Kliknij link od niego (otworzy nową kartę, ta przekaże go tutaj). Ta karta musi zostać otwarta.</div>
      <textarea class="code" readonly>${esc(link)}</textarea><button class="cp">KOPIUJ LINK</button><textarea class="in" placeholder="Albo wklej tu link zwrotny od znajomego"></textarea><button class="go">POŁĄCZ</button><button class="dim out">ANULUJ</button>`, () => {
      copyBtn(); box.querySelector('.out').onclick = () => { stopAnswer(); net.close(); openLobby(); };
      const take = async c => { stopAnswer(); try { await net.accept(codeOf(c, 'odpowiedz')); waitLink(); } catch { fail('To nie wygląda na link zwrotny. Skopiuj go jeszcze raz w całości.'); } };
      box.querySelector('.go').onclick = () => { const c = box.querySelector('.in').value.trim(); if (c) take(c); };
      stopAnswer(); answerCh = new BroadcastChannel('pt-answer'); answerCh.onmessage = e => { if (!e.data?.code) return; answerCh.postMessage({ ok: true }); take(e.data.code); }; }); }
  // (the friend: from the invitation's link straight here, or with it pasted)
  function joinFlow(pre, hostAt) { if (pre) return joinWith(pre, hostAt);
    view(`<h2>DOŁĄCZ</h2><div class="why">Wklej <b>link</b> (albo kod) od znajomego, który założył grę.</div><textarea class="in" placeholder="Tu wklej link od znajomego"></textarea><button class="go">DALEJ</button><button class="dim out">ANULUJ</button>`, () => {
      box.querySelector('.out').onclick = () => openLobby();
      box.querySelector('.go').onclick = () => { const c = box.querySelector('.in').value.trim(); if (!c) return; const m = c.match(/[#&]do=([^&]+)/); joinWith(codeOf(c, 'dolacz'), m ? decodeURIComponent(m[1]) : null); }; }); }
  async function joinWith(c, hostAt) { let code; view('<h2>DOŁĄCZAM...</h2><div class="why">Chwila.</div>');
    try { code = await net.join(c); } catch { return fail('Ten link nie zadziałał. Poproś o nowy (każde zaproszenie działa raz).'); }
    const link = (hostAt || inviteBase()) + '#odpowiedz=' + code;
    view(`<h2>PRAWIE!</h2><div class="why">Skopiuj ten <b>link zwrotny</b> i odeślij go znajomemu. Gdy go kliknie, połączycie się.</div><textarea class="code" readonly>${esc(link)}</textarea><button class="cp">KOPIUJ LINK ZWROTNY</button><button class="dim out">ANULUJ</button>`, () => {
      copyBtn(); box.querySelector('.out').onclick = () => { net.close(); openLobby(); }; waitLink(true); }); }
  function waitLink(quiet) { if (!quiet) view('<h2>ŁĄCZĘ...</h2><div class="why">Czekam na drugą stronę.</div><button class="dim out">ANULUJ</button>', () => { box.querySelector('.out').onclick = () => { net.close(); openLobby(); }; });
    const t0 = performance.now(), poll = () => { if (net.on) { stopAnswer(); return chooseMode(); } if (net.status === 'failed') return fail('Nie udało się połączyć. Niektóre sieci (firmowe, komórkowe) nie przepuszczają połączeń bezpośrednich. Spróbujcie z innej sieci.'); if (page !== 'lobby') return; if (performance.now() - t0 < 600000) setTimeout(poll, 300); }; poll(); }   // (ten minutes: the friend may take a while to answer)
  function fail(msg) { view(`<h2>NIE WYSZŁO</h2><div class="why">${esc(msg)}</div><button class="again">SPRÓBUJ JESZCZE RAZ</button><button class="dim out">WRÓĆ</button>`, () => { box.querySelector('.again').onclick = () => openLobby(); box.querySelector('.out').onclick = () => { net.close(); closeLobby(); }; }); }
  function chooseMode() { if (net.role !== 'host') return view(`<h2>POŁĄCZONO!</h2><div class="why">Jesteś <b class="p2">GRACZEM 2</b>. Gospodarz wybiera, w co gracie.</div><button class="dim out">ROZŁĄCZ</button>`, () => { box.querySelector('.out').onclick = () => leave(); });
    view(`<h2>POŁĄCZONO!</h2><div class="why">Jesteś <b>GRACZEM 1</b>. W co gracie?</div>${Object.entries(MP_MODES).map(([id, m]) => `<button data-id="${id}">${m.name}<small>${m.info}</small></button>`).join('')}<button class="dim out">ROZŁĄCZ</button>`, () => {
      box.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => start(b.dataset.id)); box.querySelector('.out').onclick = () => leave(); }); }
  function closeLobby() { lob.classList.remove('on'); if (page === 'lobby') page = null; }
  function leave() { net.send({ k: 'bye' }); net.close(); stopLocal(); closeLobby(); api.flash('Rozłączono'); }

  // ---------- a round: started by the host (the houses' subscribers sent with it), at once on both ----------
  function start(id) { begin(id); if (net.role === 'host') net.send({ k: 'start', id, subs: api.subs() }); }   // (after the reset here: the houses as they are now)
  function begin(id, subs) { closeLobby(); end.classList.remove('on'); page = null; const D = MP_MODES[id];
    M = { id, phase: 'count', cd: 3.2, t: D.T, it: id === 'tag' ? 1 : 0, itT: [0, 0, 0], safe: 0, d0: [0, 0, 0], p0: [0, 0, 0], kicks: [0, 0, 0], falls: [0, 0, 0] };
    api.begin(subs); for (const k of [1, 2]) { M.d0[k] = st(k).delivered || 0; M.p0[k] = st(k).points || 0; }
    nameE.textContent = D.name + ' · ' + D.info; bar.classList.add('on'); draw(); }
  function stopLocal() { if (!M) return; M = null; end.classList.remove('on'); bar.classList.remove('on'); cd.classList.remove('on'); if (page === 'end') page = null; api.end(); }
  function again() { if (!M) return; if (net.role === 'host') start(M.id); else api.flash('Nową rundę zaczyna gospodarz'); }
  function toLobby() { end.classList.remove('on'); if (page === 'end') page = null; openLobby(); }
  const got = k => (st(k).points || 0) - M.p0[k], del = k => (st(k).delivered || 0) - M.d0[k];
  function draw() { if (!M) return; const D = MP_MODES[M.id];
    clockE.textContent = D.T ? fmt(Math.max(0, M.t)) : 'RAZEM'; clockE.className = 'clock' + (D.T && M.t < 20 && M.phase === 'run' ? ' low' : '');
    if (M.id === 'race' || M.id === 'free') { s1.textContent = 'G1 ' + got(1) + ' ZŁ'; s2.textContent = 'G2 ' + got(2) + ' ZŁ'; }
    if (M.id === 'coop') { s1.textContent = 'RAZEM ' + (del(1) + del(2)) + '/' + D.goal; s2.textContent = 'G1 ' + del(1) + ' · G2 ' + del(2); }
    if (M.id === 'tag') { s1.textContent = (M.it === 1 ? 'BEREK ' : '') + 'G1 ' + fmt(M.itT[1]); s2.textContent = (M.it === 2 ? 'BEREK ' : '') + 'G2 ' + fmt(M.itT[2]); } }
  function finish(why) { M.phase = 'end'; page = 'end'; const D = MP_MODES[M.id];
    end.querySelector('h2').textContent = D.name; end.querySelector('.why').innerHTML = why; end.querySelector('.again').style.display = net.role === 'host' ? '' : 'none';
    const rows = [['', 'GRACZ 1', 'GRACZ 2'], ['ZAROBIONE', got(1) + ' ZŁ', got(2) + ' ZŁ'], ['DORĘCZONE', del(1), del(2)], ['KOPNIAKI', M.kicks[1], M.kicks[2]], ['UPADKI', M.falls[1], M.falls[2]], ...(M.id === 'tag' ? [['CZAS BERKA', fmt(M.itT[1]), fmt(M.itT[2])]] : [])];
    end.querySelector('.st').innerHTML = rows.map((r, i) => r.map((c, j) => `<span class="${i === 0 ? 'h' : ''} ${j === 1 ? 'p1' : j === 2 ? 'p2' : ''}">${c}</span>`).join('')).join('');
    end.classList.add('on'); bar.classList.remove('on'); api.audio?.play('trick'); }
  const win = (a, b, more) => a === b ? 'Remis!' : `Wygrywa <b class="${(more ? a > b : a < b) ? 'p1' : 'p2'}">GRACZ ${(more ? a > b : a < b) ? 1 : 2}</b>!` + ((more ? a > b : a < b) === (me() === 1) ? ' To Ty!' : '');
  function update(dt) { if (!M || M.phase === 'end') return; const D = MP_MODES[M.id];
    if (M.phase === 'count') { M.cd -= dt; st(me()).v = 0; const n = Math.ceil(M.cd - .2); cd.textContent = n > 0 ? n : 'START!'; cd.classList.add('on'); if (n !== M.lastN) { M.lastN = n; api.audio?.play(n > 0 ? 'coin' : 'trick', { vol: .6 }); }
      if (M.cd <= 0) { M.phase = 'run'; cd.classList.remove('on'); api.flash(M.id === 'tag' ? `Berek: gracz ${M.it}${M.it === me() ? ' (Ty)' : ''}! Kopnij drugiego, żeby oddać` : M.id === 'coop' ? 'Razem: 20 gazet, dzielcie się domami!' : M.id === 'race' ? 'Wyścig: kto więcej zarobi!' : 'Jedziecie razem. Znacznik pokazuje, gdzie jest drugi'); } draw(); return; }
    if (D.T) M.t -= dt; M.safe = Math.max(0, M.safe - dt); if (M.it) M.itT[M.it] += dt;
    for (const k of [1, 2]) { const c = !!st(k).crash; if (c && !M['c' + k]) M.falls[k]++; M['c' + k] = c; }
    if (M.id === 'coop' && del(1) + del(2) >= D.goal) return finish(`Udało się! 20 gazet w <b>${fmt(D.T - M.t)}</b>.`);
    if (D.T && M.t <= 0) { M.t = 0;
      if (M.id === 'race') return finish(win(got(1), got(2), true));
      if (M.id === 'coop') return finish(`Zabrakło ${D.goal - del(1) - del(2)} gazet. Jeszcze raz?`);
      if (M.id === 'tag') return finish(win(M.itT[1], M.itT[2], false) + ' (krócej berkiem)'); }
    draw(); }
  // a kick that reached the other: what it does here (and the other told)
  function kick(a, b) { if (!M || M.phase !== 'run') return 'jostle'; M.kicks[a]++; net.send({ k: 'kicks', a, n: M.kicks[a] });
    if (M.id === 'tag') { if (M.it === a && M.safe <= 0) { setIt(b); net.send({ k: 'it', it: b }); return 'tag'; } return 'jostle'; }
    return M.id === 'race' || M.id === 'free' ? 'crash' : 'jostle'; }
  function setIt(k) { if (!M) return; M.it = k; M.safe = 3; api.flash(`Berek: gracz ${k}${k === me() ? ' (Ty)!' : '!'}`); api.pop(k, 'BEREK!', '#cf5a3e'); }
  function onMsg(m) {
    if (m.k === 'start') return begin(m.id, m.subs);
    if (m.k === 'it') return setIt(m.it);
    if (m.k === 'kicks' && M) { M.kicks[m.a] = m.n; return; }
    if (m.k === 'bye') { stopLocal(); net.close(); api.flash('Drugi gracz się rozłączył'); return; } }
  function key(e) { if (page === 'end') { if (e.code === 'Enter') { again(); return true; } if (e.code === 'Escape') { toLobby(); return true; } return false; }
    if (page === 'lobby') { if (e.code === 'Escape') { if (net.on && M) closeLobby(); else if (net.on) leave(); else { net.close(); closeLobby(); } return true; } return e.target?.tagName === 'TEXTAREA'; } return false; }
  return { leaveRound: stopLocal, openLobby, joinFlow, start, onMsg, update, key, kick, get on() { return !!M; }, get id() { return M?.id || null; }, get isOpen() { return !!page; }, get counting() { return M?.phase === 'count'; }, get it() { return M?.it || 0; }, get linked() { return net.on; } };
}
