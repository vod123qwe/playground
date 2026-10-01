// A word with someone: a box at the bottom of the picture, who speaks (in gold), what they say (written out quickly), and the answers
// to choose (1-4, or the arrows and Enter, or a tap). The game waits while it is open. A talk is a set of nodes:
//   { start: { who, say, opts: [{ t, go, act, off }] }, ... }: say (a string or a function), t (the answer), go (the next node's
//   name, or null: the end), act() (done on choosing; what it returns, if not undefined, is where to go), off() (a reason it cannot
//   be chosen now, or nothing); bye (on an answer or a node): what they say after it is over. A node without opts: one answer, DALEJ, to node.next (or the end).
// createTalk() → { run(nodes, start, onEnd), key(e) → true if it took the key, isOpen }
export function createTalk() {
  const css = document.createElement('style'); css.textContent = `
    #talk { position: fixed; left: 50%; bottom: max(18px, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(560px, calc(100vw - 24px)); box-sizing: border-box;
      z-index: 7; display: none; padding: 12px 14px 12px; background: rgba(23,24,27,.94); border: 2px solid #efc970; box-shadow: 0 0 0 2px #17181b, 0 8px 0 rgba(0,0,0,.25);
      color: #f6f3ea; font: 700 13px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace; letter-spacing: .02em; text-transform: uppercase; }
    #talk.on { display: block; }
    #talk.light { bottom: auto; top: max(64px, calc(env(safe-area-inset-top) + 64px)); width: min(440px, calc(100vw - 24px)); }   /* (on the move: at the top, out of the way of the controls) */
    #talk .who { color: #efc970; font-size: 11px; letter-spacing: .1em; margin-bottom: 5px; }
    #talk .say { min-height: 2.8em; white-space: pre-wrap; }
    #talk .opts { display: grid; gap: 6px; margin-top: 10px; }
    #talk button { all: unset; box-sizing: border-box; display: block; padding: 9px 10px; border: 1.5px solid rgba(246,243,234,.28); background: rgba(246,243,234,.04); cursor: pointer; }
    #talk button b { color: #efc970; margin-right: 9px; }
    #talk button.sel { border-color: #efc970; color: #efc970; background: rgba(239,201,112,.08); }
    #talk button.off { opacity: .4; cursor: default; }
    #talk button.off em { font-style: normal; font-size: 10px; margin-left: 8px; opacity: .9; }
    @media (hover: hover) { #talk button:not(.off):hover { border-color: #efc970; color: #efc970; } }
    @media (max-width: 639px) { #talk { font-size: 12px; } #talk button { padding: 11px 10px; } }
  `; document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'talk'; box.innerHTML = '<div class="who"></div><div class="say"></div><div class="opts"></div>'; document.body.appendChild(box);
  const whoE = box.querySelector('.who'), sayE = box.querySelector('.say'), optsE = box.querySelector('.opts');
  let nodes = null, node = null, onEnd = null, full = '', shown = 0, opts = [], sel = 0, timer = 0, bye = null, light = false;   // (light: a choice on the move)   // (bye: a last word, from the answer or the node it ended on)
  const str = v => typeof v === 'function' ? v() : v;
  function draw() {
    sayE.textContent = full.slice(0, shown);
    optsE.innerHTML = ''; if (shown < full.length) return;                             // (the answers once it is all said)
    opts.forEach((o, i) => { const b = document.createElement('button'), why = o.off?.(); b.className = (i === sel ? 'sel' : '') + (why ? ' off' : '');
      b.innerHTML = `<b>${i + 1}</b>`; b.append(str(o.t)); if (why) { const em = document.createElement('em'); em.textContent = '(' + why + ')'; b.append(em); }
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); }); b.addEventListener('click', e => { e.stopPropagation(); choose(i); }); optsE.append(b); });
  }
  function go(id) {
    if (id == null) return close(); node = typeof id === 'object' ? id : nodes[id]; if (!node) return close();
    node.enter?.(); if (node.bye) bye = node.bye; full = String(str(node.say) || ''); shown = 0; whoE.textContent = str(node.who ?? nodes.who ?? '') || '';
    opts = node.opts ? node.opts.filter(o => !o.if || o.if()) : [{ t: 'DALEJ', go: node.next ?? null }]; sel = 0; draw();
    clearInterval(timer); timer = setInterval(() => { shown = Math.min(full.length, shown + 2); draw(); if (shown >= full.length) clearInterval(timer); }, 16);
  }
  function choose(i) {
    if (!node) return; if (shown < full.length) { shown = full.length; clearInterval(timer); draw(); return; }   // (a press while it writes: all of it at once)
    const o = opts[i]; if (!o || o.off?.()) return; if (o.bye) bye = o.bye; const r = o.act ? o.act() : undefined; go(r !== undefined ? r : o.go);
  }
  function close() { clearInterval(timer); box.classList.remove('on'); node = nodes = null; const f = onEnd, b = bye; onEnd = null; bye = null; f?.(b); }   // (onEnd(bye): the last word said after it)
  let autoT = 0;
  function run(n, start = 'start', end = null, o = {}) { nodes = n; onEnd = end; bye = null; light = !!o.light; box.classList.toggle('light', light); clearTimeout(autoT); if (o.auto) { const mine = n; autoT = setTimeout(() => { if (nodes === mine) close(); }, o.auto * 1000); } box.classList.add('on'); go(start); }
  function key(e) {
    if (!node) return false; const c = e.code; if (light && !/^(Digit|Numpad)[1-9]$/.test(c)) return false;   // (light: only the numbers; the rest drives on)
    if (/^Digit[1-9]$/.test(c) || /^Numpad[1-9]$/.test(c)) choose(+c.slice(-1) - 1);
    else if (['ArrowUp', 'KeyW'].includes(c)) { sel = (sel + opts.length - 1) % opts.length; draw(); }
    else if (['ArrowDown', 'KeyS', 'Tab'].includes(c)) { sel = (sel + 1) % opts.length; draw(); }
    else if (['Enter', 'Space', 'KeyE', 'KeyT', 'NumpadEnter'].includes(c)) choose(sel);
    else if (c === 'Escape') choose(opts.length - 1);                                  // (Esc: the last answer, the way out)
    e.preventDefault(); return true;
  }
  return { run, key, get isOpen() { return !!node; }, get isLight() { return !!node && light; } };
}
