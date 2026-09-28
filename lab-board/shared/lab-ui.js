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
      inp.value = cur; inp.style.setProperty('--p', `${((cur - min) / (max - min)) * 100}%`);
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
    const paint = () => [...box.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(cur))));
    for (const [v, t] of o.options) {
      const b = el('button', null, t); b.type = 'button'; b.dataset.v = v;
      b.addEventListener('click', () => { if (cur === v) return; cur = v; paint(); o.onChange && o.onChange(v); });
      box.appendChild(b);
    }
    row.append(lab, el('span'), box); parent.appendChild(row); paint();
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

  const show = (ctl, on) => { ctl.row.hidden = !on; };
  window.LabUI = { group, slider, seg, check, color, show };
})();
