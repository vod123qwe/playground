// The end of a run: a cutting from the morning's paper (the headline: why it ended, as the town would put it), what you did (how far
// against your best, papers against the route's goal, money; windows and stops only if there were any), the lottery when there is
// something to win (one thing of this run's, a part bought or a find, spins out and stays on your account for good: every run after
// starts with it; nothing to win: a one-line hint instead), then again from the start or off to the map.
// createRun({ onAgain, onMap }) → { open(stats, pool), isOpen, key(e) }; kept() → what the lottery has kept so far ([{ label, keep }])
const KEPT = 'pt.kept', BEST = 'pt.best';
export function kept() { try { return JSON.parse(localStorage.getItem(KEPT) || '[]'); } catch { return []; } }
// the headline for a reason (as the paper would have it); the reason itself goes under it, smaller
const HEAD = [[/auto/i, ['GAZECIARZ KONTRA AUTO 0:1', 'BLACHA WYGRAŁA Z ROWEREM', 'ZDERZENIE NA PORANNEJ TRASIE']], [/wywrot/i, ['ASFALT WYGRAŁ NA PUNKTY', 'PORANEK NA KOLANACH', 'GLEBA ZA GLEBĄ']],
  [/pociąg/i, ['POCIĄG BYŁ PUNKTUALNY. GAZECIARZ NIE']], [/gęs/i, ['GĘSI GÓRĄ', 'WIEŚ: GĘSI 1, PRASA 0']], [/gang|bójk/i, ['NOKAUT PRZED ŚNIADANIEM', 'BÓJKA NA TRASIE']], [/policj|zatrzyman/i, ['TRZECI MANDAT. KONIEC KURSU']], [/potrąc/i, ['PIESZO TEŻ NIEBEZPIECZNIE']]];
const headOf = why => { for (const [re, hs] of HEAD) if (re.test(why || '')) return hs[Math.random() * hs.length | 0]; return 'KONIEC PORANNEJ TRASY'; };
export function createRun({ onAgain, onMap }) {
  const css = document.createElement('style'); css.textContent = `
    #run { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; background: rgba(12,13,15,.9); color: #f6f3ea; font: 16px/1.25 PTPix, ui-monospace, monospace; text-transform: uppercase; }
    #run.on { display: grid; } #run .box { width: min(480px, calc(100vw - 28px)); box-sizing: border-box; padding: 16px 18px 16px; background: #17181b; border: 2px solid #efc970; box-shadow: 0 0 0 2px #0c0d0f; }
    #run .clip { background: #ece5d0; color: #17181b; padding: 10px 12px 9px; margin-bottom: 14px; box-shadow: 3px 3px 0 #0c0d0f; transform: rotate(-.6deg); }
    #run .clip small { display: block; font-size: 12px; letter-spacing: .08em; opacity: .7; border-bottom: 2px solid #17181b; padding-bottom: 3px; margin-bottom: 6px; }
    #run .clip h2 { margin: 0; font-size: 26px; line-height: 1.05; letter-spacing: .02em; } #run .clip .why { margin-top: 6px; font-size: 13px; opacity: .8; text-transform: none; }
    #run .st { display: grid; grid-template-columns: 1fr auto; gap: 5px 12px; margin-bottom: 12px; } #run .st b { color: #efc970; text-align: right; } #run .st i { font-style: normal; color: #9fd27a; }
    #run .st em { font-style: normal; opacity: .55; font-size: 13px; }
    #run .lot { border: 2px solid #44484c; padding: 8px 10px; text-align: center; margin-bottom: 12px; } #run .lot small { display: block; font-size: 12px; opacity: .65; margin-bottom: 4px; }
    #run .spin { font-size: 17px; color: #f6f3ea; min-height: 1.3em; } #run .spin.won { color: #efc970; }
    #run .hint { font-size: 12px; opacity: .7; margin-bottom: 12px; text-transform: none; }
    #run .btns { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
    #run button { all: unset; cursor: pointer; display: block; box-sizing: border-box; text-align: center; padding: 10px 6px 8px; border: 2px solid #efc970; color: #efc970; } #run button.alt { border-color: #6f747c; color: #c9c4ba; } #run button.off { opacity: .35; cursor: default; }
  `; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'run'; el.innerHTML = '<div class="box"><div class="clip"><small>TRĄBKA · WYDANIE PORANNE</small><h2></h2><div class="why"></div></div><div class="st"></div><div class="lot"><small>LOTERIA: JEDNA RZECZ ZOSTAJE NA KONCIE NA ZAWSZE</small><div class="spin"></div></div><div class="hint"></div><div class="btns"><button class="again">JESZCZE RAZ (ENTER)</button><button class="alt map">MAPA TRAS (M)</button></div></div>';
  document.body.appendChild(el); const btn = el.querySelector('.again'), mapB = el.querySelector('.map'), spinE = el.querySelector('.spin'), lotE = el.querySelector('.lot'), hintE = el.querySelector('.hint');
  let open_ = false, done = false, timer = 0;
  btn.onclick = () => again(); mapB.onclick = () => toMap();
  function close() { open_ = false; el.classList.remove('on'); clearTimeout(timer); }
  function again() { if (!done) return; close(); onAgain(); }
  function toMap() { if (!done) return; close(); (onMap || onAgain)(); }
  const km = d => d >= 1000 ? (d / 1000).toFixed(2).replace('.', ',') + ' KM' : Math.round(d) + ' M';
  function open(st, pool) {
    open_ = true; done = false; el.classList.add('on'); btn.classList.add('off'); mapB.classList.add('off'); spinE.classList.remove('won');
    el.querySelector('.clip h2').textContent = headOf(st.reason); el.querySelector('.why').textContent = st.reason || '';
    let best = null; try { best = JSON.parse(localStorage.getItem(BEST) || 'null'); } catch { }
    const isNew = !best || st.dist > best.dist; if (isNew) try { localStorage.setItem(BEST, JSON.stringify({ dist: st.dist, earned: st.earned })); } catch { }
    // (the lines: the distance against the best, the papers against the goal; windows and stops only when there were some)
    const rows = [['DOJECHAŁEŚ', km(st.dist) + (isNew ? ' <i>REKORD!</i>' : ` <em>/ REKORD ${km(best.dist)}</em>`)], ['GAZETY', st.goal ? `${st.delivered} <em>/ CEL ${st.goal}</em>` : st.delivered], ['ZAROBIONE', st.earned + ' ZŁ']];
    if (st.windows) rows.push(['ZBITE SZYBY', st.windows]); if (st.stops) rows.push(['ZATRZYMANIA', st.stops]);
    el.querySelector('.st').innerHTML = rows.map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('');
    // the lottery: names flick by, slower and slower, and stop on one; nothing to win: a hint, no box
    if (!pool.length) { lotE.style.display = 'none'; hintE.style.display = ''; hintE.textContent = 'Podpowiedź: kup coś u Janusza albo znajdź fant na trasie, a loteria może to zatrzymać na zawsze.'; done = true; btn.classList.remove('off'); mapB.classList.remove('off'); return; }
    lotE.style.display = ''; hintE.style.display = 'none';
    const win = pool[Math.random() * pool.length | 0]; let k = 0, wait = 55;
    const tick = () => { if (!open_) return; wait *= 1.13; if (wait > 420) { spinE.textContent = win.label; spinE.classList.add('won');
        const all = kept(); if (!all.some(x => JSON.stringify(x.keep) === JSON.stringify(win.keep))) all.push(win); try { localStorage.setItem(KEPT, JSON.stringify(all.slice(-16))); } catch { }
        done = true; btn.classList.remove('off'); mapB.classList.remove('off'); return; }
      spinE.textContent = pool[k++ % pool.length].label; timer = setTimeout(tick, wait); };
    timer = setTimeout(tick, 400);
  }
  function key(e) { if (!open_) return false; if (['Enter', 'Space', 'NumpadEnter'].includes(e.code)) again(); else if (e.code === 'KeyM') toMap(); e.preventDefault(); return true; }
  return { open, key, get isOpen() { return open_; } };
}
