// The end of a run: why it ended, what you did (how far, papers delivered, money made, windows), the best so far (kept in this
// browser), and the lottery: one thing of this run's (a part bought or a find) spins out of the lot and stays on your account for good:
// every run after starts with it. Then again from the start.
// createRun({ onAgain }) → { open(stats, pool), isOpen, key(e) }; kept() → what the lottery has kept so far ([{ label, keep }])
const KEPT = 'pt.kept', BEST = 'pt.best';
export function kept() { try { return JSON.parse(localStorage.getItem(KEPT) || '[]'); } catch { return []; } }
export function createRun({ onAgain }) {
  const css = document.createElement('style'); css.textContent = `
    #run { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; background: rgba(12,13,15,.9); color: #f6f3ea; font: 700 13px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; }
    #run.on { display: grid; } #run .box { width: min(460px, calc(100vw - 28px)); box-sizing: border-box; padding: 18px 18px 16px; background: #17181b; border: 2px solid #efc970; box-shadow: 0 0 0 2px #0c0d0f; }
    #run h2 { margin: 0 0 4px; color: #efc970; font-size: 20px; letter-spacing: .12em; } #run .why { opacity: .75; font-size: 11px; margin-bottom: 12px; }
    #run .st { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin-bottom: 10px; } #run .st b { color: #efc970; text-align: right; }
    #run .best { font-size: 11px; margin-bottom: 12px; opacity: .85; } #run .best.new { color: #9fd27a; opacity: 1; }
    #run .lot { border: 1.5px solid #44484c; padding: 10px; text-align: center; margin-bottom: 12px; } #run .lot small { display: block; font-size: 10px; opacity: .65; margin-bottom: 6px; }
    #run .spin { font-size: 15px; color: #f6f3ea; min-height: 1.4em; } #run .spin.won { color: #efc970; }
    #run button { all: unset; cursor: pointer; display: block; width: 100%; box-sizing: border-box; text-align: center; padding: 11px; border: 1.5px solid #efc970; color: #efc970; } #run button.off { opacity: .35; cursor: default; }
  `; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'run'; el.innerHTML = '<div class="box"><h2>KONIEC TRASY</h2><div class="why"></div><div class="st"></div><div class="best"></div><div class="lot"><small>LOTERIA: JEDNA RZECZ ZOSTAJE NA KONCIE NA ZAWSZE</small><div class="spin"></div></div><button class="off">JESZCZE RAZ (ENTER)</button></div>';
  document.body.appendChild(el); const btn = el.querySelector('button'), spinE = el.querySelector('.spin');
  let open_ = false, done = false, timer = 0;
  btn.onclick = () => again();
  function again() { if (!done) return; open_ = false; el.classList.remove('on'); clearTimeout(timer); onAgain(); }
  function open(st, pool) {
    open_ = true; done = false; el.classList.add('on'); btn.classList.add('off'); spinE.classList.remove('won');
    el.querySelector('.why').textContent = st.reason || '';
    const km = st.dist >= 1000 ? (st.dist / 1000).toFixed(2).replace('.', ',') + ' KM' : Math.round(st.dist) + ' M';
    el.querySelector('.st').innerHTML = [['DOJECHAŁEŚ', km], ['GAZETY DOSTARCZONE', st.delivered], ['ZAROBIONE', st.earned + ' ZŁ'], ['ZBITE SZYBY', st.windows], ['ZATRZYMANIA PRZEZ POLICJĘ', st.stops]].map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('');
    let best = null; try { best = JSON.parse(localStorage.getItem(BEST) || 'null'); } catch { }
    const isNew = !best || st.dist > best.dist; if (isNew) try { localStorage.setItem(BEST, JSON.stringify({ dist: st.dist, earned: st.earned })); } catch { }
    const bE = el.querySelector('.best'); bE.classList.toggle('new', isNew); bE.textContent = isNew ? 'NOWY REKORD!' : 'REKORD: ' + (best.dist >= 1000 ? (best.dist / 1000).toFixed(2).replace('.', ',') + ' KM' : Math.round(best.dist) + ' M');
    // the lottery: names flick by, slower and slower, and stop on one
    if (!pool.length) { spinE.textContent = 'NIC NIE KUPIŁEŚ ANI NIE ZNALAZŁEŚ. LOTERIA PUSTA.'; done = true; btn.classList.remove('off'); return; }
    const win = pool[Math.random() * pool.length | 0]; let k = 0, wait = 55;
    const tick = () => { if (!open_) return; wait *= 1.13; if (wait > 420) { spinE.textContent = win.label; spinE.classList.add('won');
        const all = kept(); if (!all.some(x => JSON.stringify(x.keep) === JSON.stringify(win.keep))) all.push(win); try { localStorage.setItem(KEPT, JSON.stringify(all.slice(-16))); } catch { }
        done = true; btn.classList.remove('off'); return; }
      spinE.textContent = pool[k++ % pool.length].label; timer = setTimeout(tick, wait); };
    timer = setTimeout(tick, 400);
  }
  function key(e) { if (!open_) return false; if (['Enter', 'Space', 'NumpadEnter'].includes(e.code)) again(); e.preventDefault(); return true; }
  return { open, key, get isOpen() { return open_; } };
}
