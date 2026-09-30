// The look, set by hand: a panel (U, or the "styl" button) with ready styles and each setting under them. Kept in this browser.
// createSettings({ apply }) → { S (the settings now), set(partial), open(bool) }; apply(S) is called on every change.

const DEFAULT = 'miekki';
export const PRESETS = {
  miekki: { name: 'Miękki', note: 'jak z rysunku: wygładzone piksele, 4 tony, delikatny kontur', pix: 280, smooth: 3, ink: 1, toon: 4, palette: true, hue: .85, dither: .012, sky: .028, exposure: 1.04, pixel: true, rim: .55 , oStr: .7, oThr: .12, palMix: 1, levels: 0, sat: 1, contrast: 1, vig: 0, crt: 0 , crease: .7 },
  klasyczny: { name: 'Klasyczny', note: 'ostre piksele, 3 tony, fioletowy kontur', pix: 240, smooth: 1, ink: 1, toon: 3, palette: true, hue: 1, dither: .02, sky: .07, exposure: 1, pixel: true, rim: .3 , oStr: .85, oThr: .12, palMix: 1, levels: 0, sat: 1, contrast: 1, vig: 0, crt: 0 , crease: .7 },
  komiks: { name: 'Komiks', note: 'gruby czarny kontur, płaskie tony', pix: 320, smooth: 2, ink: 3, toon: 3, palette: true, hue: .6, dither: 0, sky: .04, exposure: 1.06, pixel: true, rim: .35 , oStr: 1, oThr: .07, palMix: 1, levels: 0, sat: 1.15, contrast: 1.08, vig: 0, crt: 0 , crease: .7 },
  retro: { name: 'Stary ekran', note: 'duże piksele, mniej kolorów, linie jak na kineskopie', pix: 180, smooth: 1, ink: 2, toon: 3, palette: true, hue: .9, dither: .025, sky: .08, exposure: 1.08, pixel: true, rim: .3, oStr: .9, oThr: .1, palMix: 1, levels: 6, sat: 1.1, contrast: 1.1, vig: .45, crt: .6 , crease: .7 },
  pastel: { name: 'Pastelowy poranek', note: 'miękko jak akwarela: bez twardej palety, jasno, ledwie kontur', pix: 240, smooth: 5, ink: 1, toon: 5, palette: true, hue: .6, dither: .006, sky: .02, exposure: 1.1, pixel: true, rim: .35, oStr: .35, oThr: .14, palMix: .55, levels: 0, sat: .82, contrast: .94, vig: 0, crt: 0 , crease: .7 },
  zlota: { name: 'Złota godzina', note: 'niskie ciepłe słońce: mocny połysk krawędzi, ciepło, cienki czarny kontur', pix: 260, smooth: 3, ink: 2, toon: 4, palette: true, hue: 1.3, dither: .01, sky: .03, exposure: 1.03, pixel: true, rim: .95, oStr: .6, oThr: .09, palMix: 1, levels: 0, sat: 1.12, contrast: 1.07, vig: 0, crt: 0 , crease: .7 },
  gladki: { name: 'Gładki', note: 'bez pikseli: gładko i miękko, pełne tony, kolory lekko przygaszone, ledwie kontur', pix: 280, smooth: 4, ink: 1, toon: 5, palette: true, hue: .6, dither: .006, sky: .02, exposure: 1.1, pixel: false, rim: .35, oStr: .1, oThr: .1, palMix: .9, levels: 2, sat: .82, contrast: .94, vig: 0, crt: 0, crease: .7 },
  malowany: { name: 'Malowany', note: 'jak farbą: plamy koloru (filtr Kuwahary), faktura płótna, ciemniejszy pociągnięty kontur, lekko drżący', pix: 300, smooth: 2, ink: 1, toon: 5, palette: true, hue: .9, dither: 0, sky: .02, exposure: 1.06, pixel: true, rim: .5, oStr: .15, oThr: .12, palMix: .12, levels: 0, sat: 1.12, contrast: 1.06, vig: 0, crt: 0, crease: .3, mode: 1, wob: .45 },
  komiks: { name: 'Komiks', note: 'gruby tusz, rastrowe kropki w cieniach, płaskie jasne kolory; kreska drży jak rysowana klatka po klatce', pix: 360, smooth: 2, ink: 3, toon: 3, palette: true, hue: .6, dither: 0, sky: .02, exposure: 1.08, pixel: true, rim: .3, oStr: 1, oThr: .07, palMix: .8, levels: 0, sat: 1.18, contrast: 1.1, vig: 0, crt: 0, crease: .8, mode: 2, wob: .8 },
  akwarela: { name: 'Akwarela', note: 'papier, barwnik zebrany na brzegach plam, światła zostawione białe, miękko', pix: 320, smooth: 4, ink: 1, toon: 5, palette: true, hue: .7, dither: 0, sky: .02, exposure: 1.1, pixel: true, rim: .3, oStr: .1, oThr: .12, palMix: 0, levels: 0, sat: .9, contrast: .95, vig: 0, crt: 0, crease: .2, mode: 3, wob: .5 },
  olowek: { name: 'Ołówek', note: 'szkic na papierze: kreskowanie wg cienia, grafitowe linie, ślad koloru', pix: 360, smooth: 2, ink: 1, toon: 4, palette: true, hue: .5, dither: 0, sky: .02, exposure: 1.05, pixel: true, rim: .2, oStr: .3, oThr: .1, palMix: 0, levels: 0, sat: 1, contrast: 1.1, vig: 0, crt: 0, crease: .6, mode: 4, wob: .6 },
  riso: { name: 'Riso', note: 'druk risograficzny: różowa, niebieska i żółta farba w rastrach pod różnymi kątami, lekko nie w pasie', pix: 300, smooth: 2, ink: 1, toon: 4, palette: true, hue: .6, dither: 0, sky: .02, exposure: 1.08, pixel: true, rim: .3, oStr: .4, oThr: .1, palMix: 0, levels: 0, sat: 1.1, contrast: 1.12, vig: 0, crt: 0, crease: .4, mode: 5, wob: .25 },
  bit1: { name: '1 bit', note: 'dwa kolory i porządny dithering, tusz na krawędziach', pix: 240, smooth: 2, ink: 1, toon: 4, palette: true, hue: .5, dither: 0, sky: .02, exposure: 1.05, pixel: true, rim: .3, oStr: .5, oThr: .1, palMix: 0, levels: 0, sat: 1, contrast: 1.15, vig: 0, crt: 0, crease: .5, mode: 6, wob: 0 },
  ostry: { name: 'Wysoka rozdzielczość', note: 'drobne piksele, cienki czarny kontur, dużo tonów', pix: 540, smooth: 2, ink: 2, toon: 5, palette: true, hue: .8, dither: .008, sky: .04, exposure: 1.02, pixel: true, rim: .5 , oStr: 1, oThr: .07, palMix: .85, levels: 0, sat: 1.05, contrast: 1.02, vig: 0, crt: 0 , crease: .7 },
};
for (const k in PRESETS) PRESETS[k] = { mode: 0, wob: 0, ...PRESETS[k] };   // (a style with no look laid over it says so: switching to it takes the last one off)
// the four in the game's own menu (Esc), and the few settings each of them offers there: [label, key, min, max, step]
export const MENU_STYLES = ['retro', 'miekki', 'pastel', 'zlota', 'gladki', 'malowany', 'komiks', 'akwarela'];
export const LIGHT = {
  retro: [['LINIE EKRANU', 'crt', 0, 1, .05], ['WINIETA', 'vig', 0, 1, .05], ['POZIOMY KOLORU', 'levels', 2, 16, 1]],
  miekki: [['KONTUR', 'oStr', 0, 1, .05], ['DITHERING', 'dither', 0, .04, .002], ['CIEPŁO ŚWIATŁA', 'hue', 0, 1.5, .05]],
  pastel: [['NASYCENIE', 'sat', .4, 1.4, .05], ['SIŁA PALETY', 'palMix', 0, 1, .05], ['JASNOŚĆ', 'exposure', .8, 1.3, .02]],
  zlota: [['POŁYSK', 'rim', 0, 1.2, .05], ['CIEPŁO', 'hue', 0, 1.6, .05], ['KONTRAST', 'contrast', .8, 1.3, .02]],
  malowany: [['DRŻENIE KRESKI', 'wob', 0, 1, .05], ['KONTUR', 'oStr', 0, 1, .05], ['NASYCENIE', 'sat', .4, 1.4, .05]],
  komiks: [['DRŻENIE KRESKI', 'wob', 0, 1, .05], ['NASYCENIE', 'sat', .4, 1.4, .05], ['KONTRAST', 'contrast', .8, 1.3, .02]],
  akwarela: [['DRŻENIE KRESKI', 'wob', 0, 1, .05], ['NASYCENIE', 'sat', .4, 1.4, .05], ['JASNOŚĆ', 'exposure', .8, 1.3, .02]],
  gladki: [['NASYCENIE', 'sat', .4, 1.4, .05], ['JASNOŚĆ', 'exposure', .8, 1.3, .02], ['KONTUR', 'oStr', 0, 1, .05]],
};
const KEY = 'poranna-trasa-styl', MINE = 'poranna-trasa-styl-moj';   // (now; and the one saved as your default)

export function createSettings({ apply }) {
  const load = k => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } };
  let mine = load(MINE);
  const base = () => mine ? { ...PRESETS[DEFAULT], ...mine, preset: 'moj' } : { preset: DEFAULT, ...PRESETS[DEFAULT] };
  let S = base();
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && typeof saved === 'object') { if (!(saved.v >= 2)) saved.vig = 0; S = { ...PRESETS[DEFAULT], ...S, ...saved }; } } catch { }   // (v2: no vignette unless asked for)
  S.v = 2;
  // ?style=<preset>: that style for this visit only, nothing saved (for comparing, and for the tests)
  const only = new URLSearchParams(location.search).get('style'); if (only && PRESETS[only]) S = { ...PRESETS[DEFAULT], ...PRESETS[only], preset: only, v: 2 };
  const save = () => { if (only) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

  const css = document.createElement('style'); css.textContent = `
    #styl { position: fixed; top: 0; right: 0; bottom: 0; width: min(330px, 92vw); z-index: 6; overflow-y: auto; box-sizing: border-box; padding: 16px 16px 20px;
      background: #1d1e21; color: #f6f3ea; border-left: 3px solid #17181b; box-shadow: -4px 0 0 #0c0d0f; font: 600 13px/1.35 ui-monospace, 'Cascadia Mono', Consolas, monospace;
      transform: translateX(105%); transition: transform .18s steps(6); }
    #styl.on { transform: none; }
    #styl h2 { font-size: 15px; margin: 0 0 4px; color: #efc970; letter-spacing: .06em; text-transform: uppercase; }
    #styl .sub { color: #979a97; font-weight: 500; margin: 0 0 12px; }
    #styl .x { position: absolute; top: 10px; right: 10px; }
    #styl h3.sec { color: #efc970; border-top: 2px solid #33363a; padding-top: 12px; margin-top: 18px; }
    #styl h3 { font-size: 12px; margin: 16px 0 6px; color: #d3d0c3; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; }
    #styl .row { display: flex; flex-wrap: wrap; gap: 4px; }
    #styl button { font: inherit; color: #f6f3ea; background: #33363a; border: 2px solid #17181b; border-radius: 3px; padding: 5px 9px; cursor: pointer; box-shadow: 0 2px 0 #0c0d0f; }
    #styl button[aria-pressed="true"] { background: #efc970; color: #17181b; }
    #styl button:focus-visible, #styl input:focus-visible { outline: 2px solid #f6f3ea; outline-offset: 2px; }
    #styl .preset { display: grid; gap: 6px; }
    #styl .preset button { text-align: left; padding: 8px 10px; }
    #styl .preset small { display: block; font-weight: 500; opacity: .8; margin-top: 2px; }
    #styl label { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: center; margin-top: 10px; }
    #styl label span:last-child { color: #efc970; font-variant-numeric: tabular-nums; }
    #styl input[type=range] { grid-column: 1 / -1; width: 100%; accent-color: #efc970; }
    #styl .foot { margin-top: 18px; color: #979a97; font-weight: 500; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    #stylBtn { position: fixed; left: 16px; bottom: 14px; z-index: 3; font: 600 13px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; color: #f6f3ea;
      background: rgba(23,24,27,.72); border: 0; border-radius: 6px; padding: 8px 12px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
    #stylBtn:focus-visible { outline: 2px solid #efc970; outline-offset: 2px; }
    body.touch #stylBtn { display: none; }
    @media (prefers-reduced-motion: reduce) { #styl { transition: none; } }
  `; document.head.appendChild(css);

  const btn = document.createElement('button'); btn.id = 'stylBtn'; btn.type = 'button';
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M6 0h2v2h2v2h2v2h2v2h-2v2h-2v2H8v2H6v-2H4v-2H2V8H0V6h2V4h2V2h2zM6 5v4h2V5z"/></svg>styl (U)';
  document.body.appendChild(btn);
  const P = document.createElement('aside'); P.id = 'styl'; P.setAttribute('aria-label', 'Styl obrazu'); document.body.appendChild(P);
  const seg = (title, key, opts) => `<h3>${title}</h3><div class="row" data-key="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>`;
  const range = (title, key, min, max, step, fmt) => `<label>${title}<span data-out="${key}"></span><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" data-fmt="${fmt}"></label>`;
  P.innerHTML = `<button type="button" class="x" aria-label="zamknij">✕</button><h2>Styl obrazu</h2><p class="sub">Gotowy styl albo każde ustawienie osobno.</p>
    <h3>Gotowe style</h3><div class="preset"><button type="button" data-preset="moj" hidden>Mój<small>zapisany jako domyślny</small></button>${Object.entries(PRESETS).map(([k, p]) => `<button type="button" data-preset="${k}">${p.name}<small>${p.note}</small></button>`).join('')}</div>
    <h3 class="sec">Piksele</h3>
    ${range('Wielkość pikseli (wysokość obrazu, mniej = większe)', 'pix', 120, 600, 10, 'px')}
    ${range('Wygładzanie krawędzi', 'smooth', 1, 10, 1, 'x')}
    ${seg('Wygląd pikselowy (P)', 'pixel', [['true', 'tak'], ['false', 'nie, zwykłe 3D']])}
    <h3 class="sec">Kontur</h3>
    ${seg('Rodzaj', 'ink', [[0, 'brak'], [1, 'fiolet'], [2, 'czarny'], [3, 'gruby']])}
    ${range('Siła', 'oStr', 0, 1, .05, 'pct')}
    ${range('Czułość (mniej = więcej linii)', 'oThr', .03, .3, .01, 'int2')}
    <h3 class="sec">Kolor</h3>
    ${seg('Paleta', 'palette', [['true', 'ograniczona'], ['false', 'pełna']])}
    ${range('Siła palety', 'palMix', 0, 1, .05, 'pct')}
    ${range('Posteryzacja (poziomy koloru, 0 = wył.)', 'levels', 0, 16, 1, 'lvl')}
    ${range('Nasycenie', 'sat', 0, 1.6, .05, 'pct')}
    ${range('Kontrast', 'contrast', .7, 1.4, .02, 'pct')}
    <h3 class="sec">Światło</h3>
    ${range('Tony cieniowania', 'toon', 2, 5, 1, 'int')}
    ${range('Ciepłe światła, chłodne cienie', 'hue', 0, 1.5, .05, 'pct')}
    ${range('Połysk krawędzi od słońca', 'rim', 0, 1.2, .05, 'pct')}
    ${range('Jasność', 'exposure', .7, 1.4, .02, 'pct')}
    <h3 class="sec">Nakładka: styl rysunku</h3>
    ${seg('Nakładka', 'mode', [['0', 'brak'], ['1', 'malowany'], ['2', 'komiks'], ['3', 'akwarela'], ['4', 'ołówek'], ['5', 'riso'], ['6', '1 bit']])}
    ${range('Drżenie kreski', 'wob', 0, 1, .05, 'pct')}
    <h3 class="sec">Pixel art: nowe</h3>
    ${seg('Stabilny obraz (piksele nie pływają przy jeździe)', 'snap', [['false', 'wył.'], ['true', 'wł.']])}
    ${range('Linie w środku rzeczy i jasne krawędzie', 'crease', 0, 1, .05, 'pct')}
    ${seg('Animacja postaci', 'stepAnim', [['0', 'płynna'], ['12', '12 klatek/s'], ['8', '8 klatek/s']])}
    <h3 class="sec">Dithering i efekty</h3>
    ${range('Dithering na przedmiotach', 'dither', 0, .06, .002, 'dither')}
    ${range('Dithering na niebie', 'sky', 0, .14, .005, 'dither')}
    ${range('Winieta', 'vig', 0, 1, .05, 'pct')}
    ${range('Linie starego ekranu', 'crt', 0, 1, .05, 'pct')}
    <div class="foot"><button type="button" data-mine>Zapisz jako domyślny</button><button type="button" data-reset>Domyślny</button></div>
    <p class="sub saved" aria-live="polite" style="margin-top:8px">Zmiany zapisują się w tej przeglądarce.</p>`;

  const fmt = (f, v) => f === 'pct' ? Math.round(v * 100) + '%' : f === 'dither' ? (v * 100).toFixed(1) : f === 'px' ? v + ' px' : f === 'x' ? (v > 1 ? v + '×' : 'brak') : f === 'lvl' ? (v < 2 ? 'wył.' : String(v)) : f === 'int2' ? (+v).toFixed(2) : String(v);
  function refresh() {
    P.querySelector('[data-preset="moj"]').hidden = !mine;
    for (const b of P.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === S.preset));
    for (const r of P.querySelectorAll('.row[data-key]')) for (const b of r.children) b.setAttribute('aria-pressed', String(String(S[r.dataset.key]) === b.dataset.v));
    for (const i of P.querySelectorAll('input[data-key]')) { i.value = S[i.dataset.key]; P.querySelector(`[data-out="${i.dataset.key}"]`).textContent = fmt(i.dataset.fmt, S[i.dataset.key]); }
  }
  function set(part, fromPreset = false) { S = { ...S, ...part }; if (!fromPreset && !('preset' in part)) S.preset = 'wlasny'; apply(S); save(); refresh(); }
  P.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('x')) return open(false);
    if (b.dataset.preset === 'moj') return set(base(), true);
    if (b.dataset.preset) return set({ preset: b.dataset.preset, ...PRESETS[b.dataset.preset] }, true);
    if ('reset' in b.dataset) return set(base(), true);
    if ('mine' in b.dataset) { mine = { ...S }; delete mine.preset; try { localStorage.setItem(MINE, JSON.stringify(mine)); } catch { } S.preset = 'moj'; save(); refresh();
      const n = P.querySelector('.saved'); n.textContent = 'Zapisano jako domyślny. Przycisk „Domyślny” wraca do niego.'; return; }
    const row = b.closest('.row[data-key]'); if (row) { const v = b.dataset.v; set({ [row.dataset.key]: v === 'true' ? true : v === 'false' ? false : +v }); } });
  P.addEventListener('input', e => { const i = e.target.closest('input[data-key]'); if (i) set({ [i.dataset.key]: +i.value }); });
  let isOpen = false;
  function open(v = !isOpen) { isOpen = v; P.classList.toggle('on', v); if (v) P.querySelector('[data-preset]')?.focus({ preventScroll: true }); else btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', () => open());
  addEventListener('keydown', e => { if (e.repeat || window.PT_capturing) return; if ((window.PT_styleKeys ? window.PT_styleKeys() : ['KeyU']).includes(e.code) && !e.target.closest?.('input')) { open(); e.preventDefault(); } else if (e.code === 'Escape' && isOpen) { open(false); e.stopImmediatePropagation(); } }, true);
  apply(S); refresh();
  return { get S() { return S; }, set, open, get isOpen() { return isOpen; } };
}
