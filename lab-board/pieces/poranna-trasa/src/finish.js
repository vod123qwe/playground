// The finish of a stretch: the morning's paper about your ride. Its name over the top, the date line, a headline made of what you did
// (no fall, all on time, a record, a crash too many), the stars one by one (on time, the aim, no fall), the numbers and the best beside
// them (a new best marked), what the stretch opened on the map. Then: to the map, again, home.
// createFinish({ game }) → { open(L, run, rec, opened), close(), key(e), isOpen }
//   run: { time, delivered, thrown, acc, falls, earned, windows }; rec: what levels.record() gave ({ g, beat, best, first }); opened: names
//   game: { map(), again(), home(), sound(name) }

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pickOf = a => a[Math.random() * a.length | 0];

export function createFinish({ game }) {
  const css = document.createElement('style'); css.textContent = `
    #fin { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; font: 16px/1.25 PTPix, ui-monospace, Consolas, monospace; color: #17181b;
      background-color: rgba(10,11,13,.55); background-image: linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%), linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #fin.on { display: grid; } #fin * { image-rendering: pixelated; }
    #fin .paper { width: min(640px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow-y: auto; box-sizing: border-box; padding: 16px 20px 14px; background: #efe9da; transform: rotate(-1deg);
      box-shadow: 0 0 0 4px #17181b, 10px 10px 0 4px rgba(0,0,0,.4); animation: fin-in .35s steps(5) both; } @keyframes fin-in { from { transform: rotate(-8deg) scale(.4); opacity: 0; } }
    #fin .mast { text-align: center; font-size: 40px; line-height: 1; border-bottom: 4px solid #17181b; padding-bottom: 6px; } #fin .date { display: flex; justify-content: space-between; border-bottom: 2px solid #17181b; padding: 3px 0; color: #4a4a44; }
    #fin h2 { margin: 12px 0 6px; font-size: 32px; line-height: 1.05; font-weight: normal; } #fin .lead { color: #4a4a44; margin-bottom: 10px; }
    #fin .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; } #fin .box { border: 2px solid #17181b; padding: 6px 8px; }
    #fin .box h4 { margin: 0 0 6px; font-size: 16px; font-weight: normal; background: #17181b; color: #efe9da; padding: 2px 6px; display: inline-block; }
    #fin .row { display: flex; justify-content: space-between; gap: 8px; } #fin .row .v { text-align: right; } #fin .row em { font-style: normal; color: #8e2e25; }
    #fin .stars { display: flex; justify-content: center; gap: 14px; margin: 6px 0 4px; } #fin .st { display: grid; justify-items: center; gap: 4px; width: 120px; text-align: center; color: #4a4a44; }
    #fin .st i { width: 44px; height: 44px; background: #c9c3b0; clip-path: polygon(40% 0, 60% 0, 60% 30%, 100% 30%, 100% 50%, 80% 60%, 90% 100%, 70% 100%, 50% 80%, 30% 100%, 10% 100%, 20% 60%, 0 50%, 0 30%, 40% 30%); }
    #fin .st.on i { background: #e3b83a; animation: fin-star .4s steps(4) both; } #fin .st.on { color: #17181b; } @keyframes fin-star { from { transform: scale(2.2) rotate(40deg); opacity: 0; } }
    #fin .open { margin-top: 10px; padding: 6px 8px; background: #17181b; color: #efc970; }
    #fin .acts { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; flex-wrap: wrap; }
    #fin button { all: unset; box-sizing: border-box; cursor: pointer; border: 6px solid transparent; border-image: var(--px-btn) 3 fill / 6px; padding: 2px 10px; color: #f6f3ea; }
    #fin button:hover, #fin button.pad-focus { border-image-source: var(--px-btn-hi); } #fin button:active { border-image-source: var(--px-btn-dn); transform: translateY(2px); }
    #fin button.go { border-image-source: var(--px-sel); color: #17181b; }
    @media (max-width: 560px) { #fin .cols { grid-template-columns: 1fr; } #fin .mast { font-size: 32px; } #fin h2 { font-size: 24px; } #fin .st { width: 90px; } }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'fin'; document.body.appendChild(el);
  let open_ = false;
  // the headline: the best thing (or the worst) of the ride
  function headline(L, r, rec) { const n = rec.g.n;
    if (n === 3) return pickOf(['Perfekcyjny poranek! Każda gazeta na czas', 'Trzy gwiazdki i ani jednej wywrotki', 'Gazeciarz roku? Na to wygląda']);
    if (rec.beat.time && !rec.first) return pickOf(['Nowy rekord trasy!', 'Szybciej niż wczoraj. Dużo szybciej']);
    if (r.falls >= 3) return pickOf([`${r.falls} wywrotki na jednej trasie`, 'Asfalt pamięta każdy upadek']);
    if (r.windows > 0) return pickOf([`Stłuczone szyby: ${r.windows}. Sąsiedzi liczą straty`, 'Szkło na chodniku. Wiadomo, kto jechał']);
    if (r.delivered >= L.goal.papers) return pickOf(['Gazety doszły, ludzie zadowoleni', 'Skrzynki pełne, klienci spokojni']);
    return pickOf(['Dojechał. Gazety? Różnie', 'Meta zaliczona, ale skrzynki puste']); }
  function open(L, r, rec, opened) { open_ = true; const b = rec.best, d = new Date(), days = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA'];
    const nb = k => rec.beat[k] ? ' <em>REKORD!</em>' : '';
    const row = (k, v, best) => `<div class="row"><span>${k}</span><span class="v">${v}${best ?? ''}</span></div>`;
    el.innerHTML = `<div class="paper"><div class="mast">WIEŚCI Z TRASY</div><div class="date"><span>${days[d.getDay()]}, ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}</span><span>${L.name}</span><span>CENA: 1 ZŁ</span></div>
      <h2>${headline(L, r, rec)}</h2><div class="lead">${rec.first ? 'Pierwszy przejazd tej trasy.' : `Przejazd numer ${b.runs}.`} ${rec.g.n ? `Gwiazdki za dziś: ${rec.g.n} z 3.` : 'Dziś bez gwiazdek. Jutro będzie lepiej.'}</div>
      <div class="stars">${[['CZAS DO ' + mmss(L.goal.time)], [L.goal.papers + ' GAZET, ' + Math.round(L.goal.acc * 100) + '% CELNIE'], ['BEZ WYWROTKI']].map(([t], k) => `<div class="st ${rec.g.st[k] ? 'on' : ''}" style="animation-delay:${.3 + k * .35}s"><i style="animation-delay:${.3 + k * .35}s"></i><span>${t}</span></div>`).join('')}</div>
      <div class="cols"><div class="box"><h4>DZIŚ</h4>${row('CZAS', mmss(r.time), nb('time'))}${row('GAZETY', r.delivered, nb('delivered'))}${row('RZUTY', r.thrown)}${row('CELNOŚĆ', Math.round(r.acc * 100) + '%', nb('acc'))}${row('WYWROTKI', r.falls)}${row('SZYBY', r.windows)}${row('ZAROBEK', r.earned + ' ZŁ', nb('earned'))}</div>
        <div class="box"><h4>NAJLEPSZE</h4>${row('CZAS', mmss(b.time))}${row('GAZETY', b.delivered)}${row('CELNOŚĆ', Math.round((b.acc || 0) * 100) + '%')}${row('WYWROTKI (NAJMNIEJ)', b.falls)}${row('ZAROBEK', b.earned + ' ZŁ')}${row('GWIAZDKI', '★'.repeat(b.stars) + '☆'.repeat(3 - b.stars))}</div></div>
      ${opened.length ? `<div class="open">NA MAPIE OTWARTE: ${opened.join(', ')}</div>` : ''}
      <div class="acts"><button class="again">JESZCZE RAZ (R)</button><button class="home">DO DOMU</button><button class="go">NA MAPĘ (ENTER)</button></div></div>`;
    el.querySelector('.again').onclick = () => { close(); game.again(); }; el.querySelector('.home').onclick = () => { close(); game.home(); }; el.querySelector('.go').onclick = () => { close(); game.map(); };
    el.classList.add('on'); game.sound?.(rec.g.n ? 'trick' : 'coin'); rec.g.st.forEach((on, k) => on && setTimeout(() => open_ && game.sound?.('coin'), 300 + k * 350)); }
  function close() { open_ = false; el.classList.remove('on'); }
  function key(e) { if (!open_) return false; if (e.code === 'Enter' || e.code === 'Escape') { close(); game.map(); } else if (e.code === 'KeyR') { close(); game.again(); } e.preventDefault(); return true; }
  return { open, close, key, get isOpen() { return open_; } };
}
