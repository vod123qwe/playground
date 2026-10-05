// Lab UI · builders for the customise panels of every lab piece (pairs with lab-ui.css)
//
//   const g = LabUI.group(panel, 'Size');
//   LabUI.slider(g, { label: 'Width', min: 100, max: 300, step: 5, unit: 'cm', value: 200, def: 200, onInput: v => … });
//   LabUI.seg(g, { label: 'Base', options: [['frame', 'Steel frame'], ['plinth', 'Plinth']], value: 'frame', onChange: v => … });
//   LabUI.check(g, { label: 'Rail on the top', value: true, onChange: v => … });
//   LabUI.color(g, { label: 'Tint', value: '#e63d97', onInput: v => … });
//
// Every builder returns { row, set(value), get() }. Sliders: click the number to type (Enter applies, Esc cancels,
// arrows step, Shift × 10), drag the label to scrub (Alt for fine steps), double-click to go back to the default.
(function () {
  const ICON = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  let uid = 0;
  const decimals = step => { const s = String(step); return s.includes('.') ? s.split('.')[1].length : 0; };

  function group(parent, title, { open = true, key } = {}) {
    const sec = el('section', 'ui-grp'), hd = el('button', 'ui-gh'), gb = el('div', 'ui-gb'), gi = el('div', 'ui-gi');
    hd.type = 'button'; hd.innerHTML = `<span></span><svg ${ICON}><path d="M6 9l6 6 6-6"/></svg>`; hd.firstChild.textContent = title;
    const id = `ui-g${++uid}`; gb.id = id; hd.setAttribute('aria-controls', id);
    let isOpen = open;
    if (key) try { const v = localStorage.getItem(key); if (v != null) isOpen = v === '1'; } catch (e) {}
    const setOpen = v => { sec.classList.toggle('closed', !v); hd.setAttribute('aria-expanded', String(v)); gi.inert = !v; if (key) try { localStorage.setItem(key, v ? '1' : '0'); } catch (e) {} };
    hd.addEventListener('click', () => setOpen(sec.classList.contains('closed')));
    setOpen(isOpen);
    gb.appendChild(gi); sec.append(hd, gb); parent.appendChild(sec);
    gi.section = sec;
    return gi;
  }

  function slider(parent, o) {
    const { label, min, max, step = 1, unit = '' } = o; let def = o.def;
    const dp = o.decimals ?? decimals(step), fmt = o.format || (v => (+v).toFixed(dp));
    const row = el('div', 'ui-row scrub'), id = `ui-s${++uid}`;
    const lab = el('label', 'ui-label', label); lab.htmlFor = id;
    const val = el('span', 'ui-value'), num = el('input', 'ui-num'), un = el('span', 'ui-unit', unit);
    num.type = 'text'; num.inputMode = 'decimal'; num.spellcheck = false; num.setAttribute('aria-label', `${label}, type a value`);
    val.append(num); if (unit) val.append(un);
    const wrap = el('div', 'ui-slider'), inp = el('input'); inp.type = 'range'; inp.id = id; inp.min = min; inp.max = max; inp.step = step;
    wrap.appendChild(inp);
    const notch = el('i', 'ui-def'); wrap.appendChild(notch);
    const placeDef = () => { notch.hidden = def == null; if (def != null) notch.style.setProperty('--d', (def - min) / (max - min)); };
    placeDef();
    row.append(lab, val, wrap); parent.appendChild(row);
    const clamp = v => Math.min(max, Math.max(min, v));
    const snap = v => clamp(Math.round((v - min) / step) * step + min);
    let cur = o.value ?? min;
    function paint() {
      inp.value = cur; const pc = `${((cur - min) / (max - min)) * 100}%`; inp.style.setProperty('--p', pc); row.style.setProperty('--p', pc);   // (the row too: the soft look fills the whole bar)
      if (document.activeElement !== num) num.value = fmt(cur);
      inp.setAttribute('aria-valuetext', `${fmt(cur)}${unit ? ' ' + unit : ''}`);
      row.classList.toggle('at-def', def != null && Math.abs(cur - def) < step / 2);
    }
    function set(v, fire) { const n = snap(+v); if (!Number.isFinite(n)) return; const changed = n !== cur; cur = n; paint(); if (fire && changed && o.onInput) o.onInput(cur); }
    inp.addEventListener('input', () => set(inp.value, true));
    inp.addEventListener('change', () => o.onChange && o.onChange(cur));
    // the number: type it
    let before = cur;
    num.addEventListener('focus', () => { before = cur; num.value = fmt(cur); num.select(); });
    num.addEventListener('keydown', e => {
      if (e.key === 'Enter') { num.blur(); }
      else if (e.key === 'Escape') { set(before, true); num.value = fmt(cur); num.blur(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); set(cur + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1), true); num.value = fmt(cur); num.select(); }
    });
    num.addEventListener('blur', () => { const t = num.value.replace(',', '.').replace(/[^\d.+-]/g, ''); if (t !== '') set(parseFloat(t), true); paint(); if (o.onChange && cur !== before) o.onChange(cur); });
    // the label: drag to scrub (the whole range in about 240 px; Alt: ten times finer)
    lab.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.pointerType === 'touch') return;          // on touch a drag scrolls the panel
      e.preventDefault();
      const x0 = e.clientX, v0 = cur; let moved = false;
      try { lab.setPointerCapture(e.pointerId); } catch (err) {}
      const move = ev => { const dx = ev.clientX - x0; if (!moved && Math.abs(dx) < 3) return; moved = true; row.classList.add('scrubbing');
        set(v0 + dx / 240 * (max - min) * (ev.altKey ? .1 : 1), true); };
      const up = () => { lab.removeEventListener('pointermove', move); lab.removeEventListener('pointerup', up); lab.removeEventListener('pointercancel', up); row.classList.remove('scrubbing');
        if (!moved) inp.focus(); else if (o.onChange) o.onChange(cur); };
      lab.addEventListener('pointermove', move); lab.addEventListener('pointerup', up); lab.addEventListener('pointercancel', up);
    });
    // double-click: back to the default
    const reset = () => { if (def != null) { set(def, true); o.onChange && o.onChange(cur); } };
    inp.addEventListener('dblclick', reset); lab.addEventListener('dblclick', reset);
    if (o.hint) row.appendChild(el('p', 'ui-hint', o.hint));
    paint();
    return { row, input: inp, set: v => set(v, false), get: () => cur, setDef: v => { def = v; placeDef(); paint(); } };   // the default can follow a chosen look
  }

  function seg(parent, o) {
    const row = el('div', 'ui-row'), lab = el('span', 'ui-label', o.label), box = el('div', 'ui-seg');
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', o.label);
    let cur = o.value;
    // (the soft look: one thumb slides under the chosen option, placed from the option's box)
    const place = () => { const b = [...box.children].find(x => x.dataset.v === String(cur)); if (!b || !b.offsetWidth) return;
      box.style.setProperty('--sx', b.offsetLeft + 'px'); box.style.setProperty('--sy', b.offsetTop + 'px'); box.style.setProperty('--sw', b.offsetWidth + 'px'); box.style.setProperty('--sh', b.offsetHeight + 'px'); };
    const paint = () => { [...box.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(cur)))); place(); };
    for (const [v, t] of o.options) {
      const b = el('button', null, t); b.type = 'button'; b.dataset.v = v;
      b.addEventListener('click', () => { if (cur === v) return; cur = v; paint(); o.onChange && o.onChange(v); });
      box.appendChild(b);
    }
    row.append(lab, el('span'), box); parent.appendChild(row); paint();
    if (o.options.length > 3 || o.options.reduce((n, [, t]) => n + String(t).length, 0) > 20) row.classList.add('stack');   // (many or long options: under the label)
    if (window.ResizeObserver) new ResizeObserver(place).observe(box);
    return { row, set: v => { cur = v; paint(); }, get: () => cur };
  }

  function check(parent, o) {
    const row = el('div', 'ui-row'), id = `ui-c${++uid}`, lab = el('label', 'ui-label', o.label), inp = el('input', 'ui-check');
    lab.htmlFor = id; inp.type = 'checkbox'; inp.id = id; inp.checked = !!o.value;
    inp.addEventListener('change', () => o.onChange && o.onChange(inp.checked));
    row.append(lab, inp); if (o.hint) row.appendChild(el('p', 'ui-hint', o.hint)); parent.appendChild(row);
    return { row, set: v => { inp.checked = !!v; }, get: () => inp.checked };
  }

  function color(parent, o) {
    const row = el('div', 'ui-row'), id = `ui-k${++uid}`, lab = el('label', 'ui-label', o.label), w = el('span', 'ui-color'), inp = el('input'), hex = el('span', null, o.value);
    lab.htmlFor = id; inp.type = 'color'; inp.id = id; inp.value = o.value;
    inp.addEventListener('input', () => { hex.textContent = inp.value; o.onInput && o.onInput(inp.value); });
    w.append(hex, inp); row.append(lab, w); parent.appendChild(row);
    return { row, set: v => { inp.value = v; hex.textContent = v; }, get: () => inp.value };
  }

  // swatches: round material samples; each option paints its own canvas (or gives a CSS background)
  function swatches(parent, o) {
    const row = el('div', 'ui-row'), lab = el('span', 'ui-label', o.label), name = el('span', 'ui-value'), box = el('div', 'ui-swatches');
    box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-label', o.label);
    let cur = o.value;
    const paint = () => { [...box.children].forEach(b => { const on = b.dataset.v === String(cur); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      const opt = o.options.find(x => String(x.v) === String(cur)); name.textContent = opt ? opt.name : ''; };
    for (const opt of o.options) {
      const b = el('button', 'ui-sw'); b.type = 'button'; b.dataset.v = opt.v; b.title = opt.name; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', opt.name);
      if (opt.css) b.style.background = opt.css;
      const c = el('canvas'); c.width = c.height = 96; b.appendChild(c); b._c = c; b._opt = opt;
      b.addEventListener('click', () => { if (cur === opt.v) return; cur = opt.v; paint(); o.onChange && o.onChange(opt.v); });
      b.addEventListener('keydown', e => {
        const i = o.options.indexOf(opt), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault(); const n = o.options[(i + d + o.options.length) % o.options.length]; box.querySelector(`[data-v="${n.v}"]`).focus(); box.querySelector(`[data-v="${n.v}"]`).click();
      });
      box.appendChild(b);
    }
    const repaint = () => { for (const b of box.children) if (b._opt.paint) b._opt.paint(b._c); };
    row.append(lab, name, box); parent.appendChild(row); paint(); repaint();
    return { row, set: v => { cur = v; paint(); }, get: () => cur, repaint };
  }

  const show = (ctl, on) => { ctl.row.hidden = !on; };

  // the variants pill (bottom centre of every piece that has looks): tap an arrow, or grab the pill and swipe; it follows the finger
  // with resistance (a rubber band), springs back when let go, and a swipe past 44 px steps (left: next, right: previous); the name
  // slides in from the side it came from. One behaviour for every lab piece.
  //   LabUI.variants(pill, { prev, next, name, onStep: d => …, items, current, onPick })   pill: the .vars element; prev/next: its
  //   arrow buttons; name: the label to slide in (leave it out when onStep animates it itself). With items (() => names), current
  //   (() => the name on now) and onPick (name => …): a tap on the name opens the menu of all of them: the pill grows up into a panel
  //   (a morph), the options rise in one by one; a pick, Esc or a tap outside folds it back into the pill. Returns { flash(d), get moved, open(), close(), pose(x, ms, ease) }
  // ---------- a page's segmented pill (class="lab-seg", e.g. Light / Dark on top of a piece): one thumb that slides to the chosen
  // option, following aria-checked / aria-pressed (so the page only flips those). Every .lab-seg on the page is set up on load ----------
  function segThumb(box) { if (!box || box._seg) return; box._seg = true;
    const place = () => { const b = box.querySelector('[aria-checked=true], [aria-pressed=true]'); if (!b || !b.offsetWidth) return;
      box.style.setProperty('--sx', b.offsetLeft + 'px'); box.style.setProperty('--sy', b.offsetTop + 'px'); box.style.setProperty('--sw', b.offsetWidth + 'px'); box.style.setProperty('--sh', b.offsetHeight + 'px');
      if (!box.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('ready'))); };   // (no slide in from nowhere on load)
    new MutationObserver(place).observe(box, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-pressed'] });
    if (window.ResizeObserver) new ResizeObserver(place).observe(box);
    place(); }

  function variants(pill, o) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, drag = { id: null, x0: 0, y0: 0, dx: 0, dy: 0, moved: false };
    // (the feel, tunable: resistance of the band, the swipe that steps, the spring back, the menu's morph, its corners, the options' stagger)
    const C = () => Object.assign({ band: .45, threshold: 44, back: 550, bounce: 1.6, morph: 520, overshoot: 1.06, radius: 22, stagger: 32, stretch: 0, lift: 1 }, o.cfg ? o.cfg() : {});
    const band = dx => dx * C().band / (1 + Math.abs(dx) / 160);
    const flash = d => { if (o.name && !reduce && o.name.animate) o.name.animate([{ transform: `translateX(${d * 14}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); };
    const step = d => { o.onStep(d); flash(d); };
    // (the stretch, cfg.stretch 0–1, off unless a piece asks; with it cfg.lift, the press: pressed, the pill grows a touch; pulled, it
    // goes after the finger sideways and its shape (the pill's ::before, so the name stays crisp) gets a little wider, as far as it is
    // pulled. Let go: both spring back. pose(x, ms, ease) sets it for an offset x and returns where the middle goes)
    const shape = (x, ms, ease) => { const st = C().stretch || 0; pill.classList.toggle('lv-stretch', st > 0); if (!st) return x;
      pill.style.setProperty('--lv-t', (ms || 0) + 'ms'); if (ease) pill.style.setProperty('--lv-e', ease);
      const grow = Math.abs(x) * .5 * st;                 // (px it gets wider; the arrows go out by half of it each, keeping to the edges)
      pill.style.setProperty('--lv-sa', Math.round((1 + grow / (pill.offsetWidth || 1)) * 1000) / 1000); pill.style.setProperty('--lv-w', Math.round(grow / 2 * 10) / 10 + 'px'); return x; };
    pill.classList.add('lab-vars');
    pill.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag.id = e.pointerId; drag.x0 = e.clientX; drag.y0 = e.clientY; drag.dx = drag.dy = 0; drag.moved = false;
      const c = C();
      pill.style.transition = reduce || !c.stretch ? 'none' : 'scale .35s cubic-bezier(.3,1.5,.5,1)'; if (c.stretch && c.lift !== 1) pill.style.scale = c.lift; shape(0, 0); });
    pill.addEventListener('pointermove', e => {
      if (e.pointerId !== drag.id) return; drag.dx = e.clientX - drag.x0; drag.dy = e.clientY - drag.y0; const st = C().stretch;
      // (captured only once it moves, so a plain tap still reaches the arrow)
      if (!drag.moved && Math.abs(drag.dx) > 6) { drag.moved = true; pill.classList.add('dragging'); try { pill.setPointerCapture(e.pointerId); } catch (err) {} }
      if (drag.moved) { if (st) pill.style.transform = `translateX(${shape(band(drag.dx), 0)}px)`;
        else pill.style.transform = `translateX(${band(drag.dx)}px) scale(${1 + Math.min(Math.abs(drag.dx), 200) / 4000})`; }
    });
    const end = e => {
      if (e.pointerId !== drag.id) return; drag.id = null; pill.classList.remove('dragging');
      const c = C(); pill.style.transition = reduce ? 'none' : `transform ${c.back}ms cubic-bezier(.2,${c.bounce},.4,1), scale ${c.back}ms cubic-bezier(.2,${c.bounce},.4,1)`; pill.style.transform = ''; pill.style.scale = ''; shape(0, reduce ? 0 : c.back, `cubic-bezier(.2,${c.bounce},.4,1)`);
      if (drag.moved && Math.abs(drag.dx) > c.threshold) step(drag.dx < 0 ? 1 : -1);
      setTimeout(() => { drag.moved = false; }, 0);
    };
    pill.addEventListener('pointerup', end); pill.addEventListener('pointercancel', end);
    o.prev?.addEventListener('click', () => { if (!drag.moved) step(-1); });
    o.next?.addEventListener('click', () => { if (!drag.moved) step(1); });
    // ---------- the menu: the pill grows into it ----------
    let menu = null, isOpen = false, anim = null;
    const nameEl = o.name || pill.querySelector('.vn');
    function close(instant) { if (!isOpen) return; isOpen = false; pill.classList.remove('menu-open'); nameEl?.setAttribute('aria-expanded', 'false');
      const m = menu; if (!m) return; if (anim) anim.cancel();
      if (instant || reduce) { m.remove(); if (menu === m) menu = null; return; }
      anim = m.animate([{ clipPath: m.dataset.to }, { clipPath: m.dataset.from }], { duration: Math.round(C().morph * .58), easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      m.querySelectorAll('.lv-opt').forEach(b => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }));
      anim.onfinish = () => { m.remove(); if (menu === m) menu = null; }; }
    function open() { if (isOpen || !o.items) return; const items = o.items(); if (!items || !items.length) return; isOpen = true; menu?.remove();
      const host = pill.parentNode, cur = o.current ? o.current() : null, pw = pill.offsetWidth, ph = pill.offsetHeight, row = 42, gap = 8, padT = 6;
      const W = Math.max(pw, 230), H = padT + items.length * row + gap + ph, L = pill.offsetLeft + pw / 2 - W / 2, T = pill.offsetTop + ph - H;
      const m = menu = el('div', 'lv-menu' + (pill.classList.contains('dark') ? ' dark' : '')); m.setAttribute('role', 'listbox'); m.setAttribute('aria-label', 'All variants');
      Object.assign(m.style, { left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px' }); m.style.setProperty('--lv-list', (H - ph - gap) + 'px');
      const list = el('div', 'lv-list'); m.appendChild(list);
      items.forEach((n, i) => { const b = el('button', 'lv-opt'); b.type = 'button'; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(n === cur));
        b.innerHTML = `<span></span><svg ${ICON}><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`; b.firstChild.textContent = n;
        b.addEventListener('click', () => { close(); if (n !== cur) { o.onPick(n); flash(items.indexOf(n) > items.indexOf(cur) ? 1 : -1); } });
        list.appendChild(b); if (!reduce) b.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 90 + i * C().stagger, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }); });
      host.insertBefore(m, pill);
      // (from the pill's own outline to the whole panel, round to rounded)
      m.dataset.from = `inset(${H - ph}px ${(W - pw) / 2}px 0px ${(W - pw) / 2}px round ${ph / 2}px)`; m.dataset.to = `inset(0px 0px 0px 0px round ${C().radius}px)`; m.style.borderRadius = C().radius + 'px';
      pill.classList.add('menu-open'); nameEl?.setAttribute('aria-expanded', 'true');
      if (!reduce) { if (anim) anim.cancel(); const c = C(); anim = m.animate([{ clipPath: m.dataset.from }, { clipPath: m.dataset.to }], { duration: c.morph, easing: `cubic-bezier(.2,.9,.25,${c.overshoot})`, fill: 'forwards' }); }
      (list.querySelector('[aria-selected=true]') || list.firstChild).focus({ preventScroll: true }); }
    if (o.items && nameEl) {
      nameEl.setAttribute('role', 'button'); nameEl.tabIndex = 0; nameEl.setAttribute('aria-haspopup', 'listbox'); nameEl.setAttribute('aria-expanded', 'false'); nameEl.classList.add('lv-name');
      nameEl.addEventListener('click', () => { if (drag.moved) return; isOpen ? close() : open(); });
      nameEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? close() : open(); } });
      document.addEventListener('pointerdown', e => { if (isOpen && !menu?.contains(e.target) && !nameEl.contains(e.target)) close(); }, true);
      addEventListener('keydown', e => { if (!isOpen) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); nameEl.focus(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); const bs = [...menu.querySelectorAll('.lv-opt')], i = bs.indexOf(document.activeElement); bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); } }, true);
      pill.addEventListener('pointermove', () => { if (drag.moved && isOpen) close(true); }); }
    shape(0, 0);
    return { flash, get moved() { return drag.moved; }, open, close, pose: shape };
  }

  window.LabUI = { group, slider, seg, check, color, swatches, show, variants, segThumb };
})();
