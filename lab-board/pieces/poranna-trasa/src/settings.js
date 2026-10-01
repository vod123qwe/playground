// The look, set by hand: a panel (U, or the "styl" button) in tabs: the ready styles (in groups, each with a strip of its colours),
// the picture, colour, lines, the drawing laid over it (each with its own settings), motion, air. A setting that does nothing with
// what is chosen is greyed, and says why. Kept in this browser.
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
const KEY = 'poranna-trasa-styl', MINE = 'poranna-trasa-styl-moj', TABK = 'poranna-trasa-styl-zakladka';   // (now; the one saved as your default; the tab last open)

// ---------- the looks laid over the picture (the drawing), each with its own settings and their defaults ----------
//   params: [label, key, min, max, step, format, default]; choice: [label, key, [[value, label]...]]
export const EFFECTS = [
  { v: 0, name: 'brak', note: 'sam obraz gry, nic na wierzchu', params: [] },
  { v: 1, name: 'malowany', note: 'plamy farby, płótno, obrys pędzlem', params: [['Wielkość pędzla', 'paintBrush', .5, 4, .1, 'x1', 1], ['Faktura płótna', 'paintGrain', 0, 1.5, .05, 'pct', .8], ['Obrys pędzlem', 'paintEdge', 0, 1, .05, 'pct', .65]] },
  { v: 2, name: 'komiks', note: 'tusz, rastrowe kropki w cieniach', params: [['Wielkość kropek', 'comicDot', 3, 10, .5, 'px1', 5], ['Kąt rastra', 'comicAngle', 0, 90, 5, 'deg', 45], ['Grubość tuszu', 'comicInk', .8, 3.5, .1, 'x1', 1.7], ['Gdzie zaczyna się cień', 'comicShade', .3, .85, .01, 'pct', .62]] },
  { v: 3, name: 'akwarela', note: 'papier, barwnik na brzegach, białe światła', params: [['Papier', 'waterPaper', 0, 1, .05, 'pct', .6], ['Barwnik na brzegach', 'waterPool', 0, 1, .05, 'pct', .7], ['Ziarno', 'waterGrain', 0, 1, .05, 'pct', .6], ['Rozmycie koloru', 'waterBleed', 0, 1, .05, 'pct', .5]] },
  { v: 4, name: 'ołówek', note: 'szkic, kreskowanie według cienia', params: [['Gęstość kresek (odstęp)', 'pencilGap', 3, 12, .5, 'px1', 6], ['Siła kresek', 'pencilStr', 0, 1, .05, 'pct', .8], ['Ile koloru zostaje', 'pencilColor', 0, 1, .05, 'pct', .18]], choice: ['Papier', 'pencilPaper', [['0', 'kremowy'], ['1', 'biały'], ['2', 'szary karton']]] },
  { v: 5, name: 'riso', note: 'druk w trzech farbach, rastry nie w pasie', params: [['Przesunięcie farb', 'risoMis', 0, 4, .1, 'px1', 1.5], ['Wielkość rastra', 'risoDot', 3, 9, .5, 'px1', 4.5]], choice: ['Farby', 'risoInks', [['0', 'róż, błękit, żółty'], ['1', 'zieleń, pomarańcz, granat'], ['2', 'czerwień, morski, żółty']]] },
  { v: 6, name: '1 bit', note: 'dwa kolory i dithering', params: [['Skala ditheringu', 'bitScale', 1, 4, 1, 'int', 2]], choice: ['Kolory', 'bitSet', [['0', 'fiolet i krem'], ['1', 'zielony ekranik'], ['2', 'czerń i biel'], ['3', 'granat i papier']]] },
];
const INKS = { paper: [[.95, .93, .87], [.98, .98, .97], [.84, .8, .72]],
  riso: [[[1, .42, .72], [.25, .55, .85], [1, .92, .35]], [[.2, .72, .45], [1, .5, .25], [.25, .35, .7]], [[.95, .3, .28], [.15, .55, .58], [1, .92, .35]]],
  bit: [[[.12, .11, .16], [.91, .88, .78]], [[.06, .22, .06], [.61, .74, .06]], [[.05, .05, .05], [.96, .96, .94]], [[.11, .16, .35], [.91, .93, .96]]] };
// the settings' defaults, where a style does not say (the newer ones)
export const DEFAULTS = { mode: 0, fxAmt: 1, wob: 0, haze: 1.2, blur: 1, crease: .7, snap: false, stepAnim: 0, pencilPaper: 0, risoInks: 0, bitSet: 0, ...Object.fromEntries(EFFECTS.flatMap(e => e.params.map(p => [p[1], p[6]]))) };
const val = (S, k) => S[k] ?? DEFAULTS[k];
// what the shader is given for the look chosen: its settings as p1..p4, its inks, how much of it
export function lookUniforms(S) { const g = k => +val(S, k), m = g('mode') | 0, U = { mode: m, fx: g('fxAmt'), p: [0, 0, 0, 0], ink: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] };
  if (m === 1) U.p = [g('paintBrush'), g('paintGrain'), g('paintEdge'), 0];
  if (m === 2) U.p = [g('comicDot'), g('comicAngle'), g('comicInk'), g('comicShade')];
  if (m === 3) U.p = [g('waterPaper'), g('waterPool'), g('waterGrain'), g('waterBleed')];
  if (m === 4) { U.p = [g('pencilGap'), g('pencilStr'), g('pencilColor'), 0]; U.ink = [INKS.paper[g('pencilPaper')] || INKS.paper[0], [.24, .22, .2], [1, 1, 1]]; }
  if (m === 5) { U.p = [g('risoMis'), g('risoDot'), 0, 0]; U.ink = INKS.riso[g('risoInks')] || INKS.riso[0]; }
  if (m === 6) { U.p = [g('bitScale'), 0, 0, 0]; const b = INKS.bit[g('bitSet')] || INKS.bit[0]; U.ink = [b[0], b[1], [1, 1, 1]]; }
  return U; }

// ---------- the panel: tabs; in each the settings that belong together; a setting that does nothing with what is chosen greyed, with why ----------
const GROUPS = [['Pikselowe', ['miekki', 'klasyczny', 'retro', 'zlota', 'ostry']], ['Gładkie', ['pastel', 'gladki']], ['Rysunkowe', ['komiks', 'malowany', 'akwarela']]];
const SW = { miekki: ['#7fae58', '#efc970', '#cf5a3e', '#453a52'], klasyczny: ['#467537', '#e8c070', '#b3372c', '#2e2538'], retro: ['#5b8a3c', '#d8b87a', '#8e2e25', '#17181b'], zlota: ['#e3a03a', '#cf7a3e', '#7fae58', '#5d3a2e'],
  ostry: ['#6f9a45', '#f2c33a', '#c8323a', '#1d1e21'], pastel: ['#b7d3a8', '#f3d9c0', '#c9b9e0', '#e9eef5'], gladki: ['#8fb07a', '#e9dcc0', '#a9bccb', '#6b6a70'],
  komiks: ['#f2c33a', '#e0503f', '#2f5aa0', '#141316'], malowany: ['#7a9a4a', '#d8a860', '#6f8fb0', '#4a3a2e'], akwarela: ['#b9cfa8', '#f6f0e0', '#9fbcd0', '#d8a890'], olowek: ['#f1eadb', '#b8b0a0', '#6b665e', '#3d3a36'],
  riso: ['#ff6fb8', '#4f8fd0', '#ffe25a', '#f4efe3'], bit1: ['#1e1b29', '#e8e2c8', '#1e1b29', '#e8e2c8'] };
const pix = S => val(S, 'pixel') !== false, repl = S => (+val(S, 'mode') || 0) >= 4, inkOn = S => +val(S, 'ink') > 0;
const PALR = [S => pix(S) && !repl(S), S => !pix(S) ? 'tylko w wyglądzie pikselowym' : 'ta nakładka rysuje własnymi kolorami'];
const TABS = [
  { id: 'styl', name: 'Styl' },
  { id: 'obraz', name: 'Obraz', items: [
    ['seg', 'Wygląd', 'pixel', [['true', 'pikselowy'], ['false', 'gładki']], null, 'gładki: bez palety, ditheringu i posteryzacji; reszta działa tak samo (w grze: P)'],
    ['range', 'Wielkość pikseli', 'pix', 120, 600, 10, 'px', null, 'wysokość obrazu w punktach: mniej = większe piksele'],
    ['range', 'Wygładzanie', 'smooth', 1, 10, 1, 'x'],
    ['seg', 'Stabilny obraz', 'snap', [['false', 'wył.'], ['true', 'wł.']], null, 'nieruchome rzeczy nie migoczą przy jeździe'],
    ['range', 'Dithering na przedmiotach', 'dither', 0, .06, .002, 'dither', [pix, 'tylko w wyglądzie pikselowym']],
    ['range', 'Dithering na niebie', 'sky', 0, .14, .005, 'dither', [pix, 'tylko w wyglądzie pikselowym']]] },
  { id: 'kolor', name: 'Kolor', items: [
    ['seg', 'Paleta', 'palette', [['true', 'ograniczona'], ['false', 'pełna']], PALR],
    ['range', 'Siła palety', 'palMix', 0, 1, .05, 'pct', PALR],
    ['range', 'Posteryzacja (0 = wył.)', 'levels', 0, 16, 1, 'lvl', PALR],
    ['range', 'Nasycenie', 'sat', 0, 1.6, .05, 'pct', [S => !repl(S), 'ta nakładka rysuje własnymi kolorami']],
    ['range', 'Kontrast', 'contrast', .7, 1.4, .02, 'pct'],
    ['range', 'Jasność', 'exposure', .7, 1.4, .02, 'pct'],
    ['range', 'Ciepłe światła, chłodne cienie', 'hue', 0, 1.5, .05, 'pct'],
    ['range', 'Tony cieniowania', 'toon', 2, 5, 1, 'int'],
    ['range', 'Połysk krawędzi od słońca', 'rim', 0, 1.2, .05, 'pct']] },
  { id: 'linie', name: 'Linie', items: [
    ['seg', 'Kontur', 'ink', [['0', 'brak'], ['1', 'fiolet'], ['2', 'czarny'], ['3', 'gruby']]],
    ['range', 'Siła konturu', 'oStr', 0, 1, .05, 'pct', [inkOn, 'kontur wyłączony']],
    ['range', 'Czułość (mniej = więcej linii)', 'oThr', .03, .3, .01, 'int2', [inkOn, 'kontur wyłączony']],
    ['range', 'Linie w środku rzeczy, jasne krawędzie', 'crease', 0, 1, .05, 'pct']] },
  { id: 'nakl', name: 'Nakładka' },
  { id: 'ruch', name: 'Ruch', items: [
    ['seg', 'Animacja postaci', 'stepAnim', [['0', 'płynna'], ['12', '12 kl./s'], ['8', '8 kl./s']], null, 'klatkami: jak rysowana; rower i kamera zostają płynne'],
    ['range', 'Rozmycie przy sprincie', 'blur', 0, 1.5, .05, 'pct', null, 'smugi od środka na krawędziach, gdy jedziesz z Shiftem'],
    ['range', 'Drżenie kreski', 'wob', 0, 1, .05, 'pct', [S => (+val(S, 'mode') || 0) > 0, 'działa z nakładką rysunku']]] },
  { id: 'powietrze', name: 'Powietrze', items: [
    ['range', 'Mgiełka w oddali', 'haze', 0, 2.5, .05, 'pct', null, 'dal bledsza, bardziej niebieska, lekko miękka'],
    ['range', 'Winieta', 'vig', 0, 1, .05, 'pct'],
    ['range', 'Linie starego ekranu', 'crt', 0, 1, .05, 'pct']], note: 'Wkrótce tutaj: mgła poranna, deszcz i kałuże.' }];
const FX_KEYS = ['mode', 'fxAmt', 'wob', ...EFFECTS.flatMap(e => [...e.params.map(p => p[1]), ...(e.choice ? [e.choice[1]] : [])])];

export function createSettings({ apply }) {
  const load = k => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } };
  let mine = load(MINE);
  const base = () => mine ? { ...PRESETS[DEFAULT], ...mine, preset: 'moj' } : { preset: DEFAULT, from: DEFAULT, ...PRESETS[DEFAULT] };
  let S = base();
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && typeof saved === 'object') { if (!(saved.v >= 2)) saved.vig = 0; S = { ...PRESETS[DEFAULT], ...S, ...saved }; } } catch { }   // (v2: no vignette unless asked for)
  S.v = 2;
  // ?style=<preset>: that style for this visit only, nothing saved (for comparing, and for the tests)
  const only = new URLSearchParams(location.search).get('style'); if (only && PRESETS[only]) S = { ...PRESETS[DEFAULT], ...PRESETS[only], preset: only, from: only, v: 2 };
  const save = () => { if (only) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };
  let tab = 'styl'; try { tab = localStorage.getItem(TABK) || 'styl'; } catch { } if (!TABS.some(t => t.id === tab)) tab = 'styl';

  const css = document.createElement('style'); css.textContent = `
    #styl { position: fixed; top: 0; right: 0; bottom: 0; width: min(390px, 94vw); z-index: 6; display: flex; flex-direction: column; box-sizing: border-box;
      background: #1b1c20; color: #ecebe4; border-left: 1px solid #2f3136; box-shadow: -14px 0 36px rgba(0,0,0,.4); font: 500 13px/1.4 ui-monospace, 'Cascadia Mono', Consolas, monospace;
      transform: translateX(105%); transition: transform .2s ease; }
    #styl.on { transform: none; }
    #styl header { padding: 14px 16px 8px; position: relative; }
    #styl h2 { font-size: 13px; margin: 0; color: #efc970; letter-spacing: .08em; text-transform: uppercase; }
    #styl .now { color: #a7a9a6; margin: 4px 0 0; font-size: 12px; }
    #styl .x { position: absolute; top: 10px; right: 10px; background: none; border: 0; color: #a7a9a6; font: inherit; font-size: 15px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
    #styl .x:hover { color: #ecebe4; background: #26282d; }
    #styl nav { display: flex; gap: 0; padding: 0 8px; border-bottom: 1px solid #2f3136; overflow-x: auto; scrollbar-width: none; }
    #styl nav button { background: none; border: 0; border-bottom: 2px solid transparent; color: #a7a9a6; font: inherit; font-size: 12px; padding: 9px 5px 8px; cursor: pointer; white-space: nowrap; }
    #styl nav button[aria-selected="true"] { color: #efc970; border-bottom-color: #efc970; }
    #styl nav button:hover { color: #ecebe4; }
    @media (max-width: 639px) { #styl nav { flex-wrap: wrap; overflow: visible; } #styl nav button { padding: 8px 7px 7px; } }   /* (a phone: the tabs in two rows, none cut off) */
    #styl .body { flex: 1; overflow-y: auto; padding: 6px 16px 18px; }
    #styl h3 { font-size: 11px; color: #8d908c; letter-spacing: .1em; text-transform: uppercase; margin: 16px 0 8px; font-weight: 700; }
    #styl .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    #styl .card { text-align: left; background: #24262b; border: 1px solid #33363c; border-radius: 9px; padding: 8px 9px 9px; color: inherit; font: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
    #styl .card:hover { border-color: #4a4d54; }
    #styl .card[aria-pressed="true"] { border-color: #efc970; background: #2a2922; box-shadow: inset 0 0 0 1px #efc970; }
    #styl .card b { font-weight: 700; } #styl .card small { color: #a7a9a6; font-size: 11px; line-height: 1.3; }
    #styl .sw { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 3px; } #styl .sw i { flex: 1; }
    #styl .ctl { padding: 11px 0; border-bottom: 1px solid #26282d; }
    #styl .lab { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; } #styl .lab output { color: #efc970; font-variant-numeric: tabular-nums; }
    #styl input[type=range] { width: 100%; accent-color: #efc970; margin: 0; }
    #styl .row { display: flex; flex-wrap: wrap; gap: 4px; }
    #styl .row button, #styl .foot button, #styl .reset { font: inherit; color: #ecebe4; background: #24262b; border: 1px solid #33363c; border-radius: 7px; padding: 6px 10px; cursor: pointer; }
    #styl .row button[aria-pressed="true"] { background: #efc970; border-color: #efc970; color: #17181b; font-weight: 700; }
    #styl .row button:hover, #styl .foot button:hover, #styl .reset:hover { border-color: #4a4d54; }
    #styl .hint { color: #8d908c; font-size: 11px; margin: 6px 0 0; }
    #styl .why { display: none; color: #e0a070; font-size: 11px; margin: 6px 0 0; }
    #styl .ctl.off .lab, #styl .ctl.off input, #styl .ctl.off .row { opacity: .4; } #styl .ctl.off .why { display: block; } #styl .ctl.off .hint { display: none; }
    #styl .reset { margin-top: 14px; width: 100%; color: #a7a9a6; }
    #styl .foot { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
    #styl .note { color: #8d908c; font-size: 11px; margin-top: 14px; border: 1px dashed #33363c; border-radius: 8px; padding: 8px 10px; }
    #styl .fxdesc { color: #a7a9a6; font-size: 12px; margin: 10px 0 0; }
    #styl button:focus-visible, #styl input:focus-visible { outline: 2px solid #efc970; outline-offset: 2px; }
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
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const segH = (title, key, opts, hint) => `<div class="ctl" data-ctl="${key}"><div class="lab"><span>${title}</span></div><div class="row" data-key="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div><p class="why"></p>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const rangeH = (title, key, min, max, step, f, hint) => `<div class="ctl" data-ctl="${key}"><div class="lab"><span>${title}</span><output data-out="${key}"></output></div><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" data-fmt="${f}" aria-label="${esc(title)}"><p class="why"></p>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const itemH = it => it[0] === 'seg' ? segH(it[1], it[2], it[3], it[5]) : rangeH(it[1], it[2], it[3], it[4], it[5], it[6], it[8]);
  const RULES = {}; for (const t of TABS) for (const it of t.items || []) { const r = it[0] === 'seg' ? it[4] : it[7]; if (r) RULES[it[2]] = r; }
  const card = k => { const p = PRESETS[k]; if (!p) return ''; return `<button type="button" class="card" data-preset="${k}"><span class="sw">${(SW[k] || ['#555', '#777', '#999', '#bbb']).map(c => `<i style="background:${c}"></i>`).join('')}</span><b>${esc(p.name)}</b><small>${esc(p.note)}</small></button>`; };
  const others = Object.keys(PRESETS).filter(k => !GROUPS.some(([, ks]) => ks.includes(k)));
  const sec = {
    styl: `<button type="button" class="card" data-preset="moj" hidden style="margin-top:12px"><b>Mój</b><small>zapisany jako domyślny</small></button>${GROUPS.map(([g, ks]) => `<h3>${g}</h3><div class="cards">${ks.map(card).join('')}</div>`).join('')}${others.length ? `<h3>Inne</h3><div class="cards">${others.map(card).join('')}</div>` : ''}
      <div class="foot"><button type="button" data-mine>Zapisz obecny jako mój</button><button type="button" data-reset>Wróć do domyślnego</button></div><p class="hint saved" aria-live="polite">Zmiany zapisują się w tej przeglądarce.</p>`,
    nakl: `<h3>Rysunek na wierzchu</h3><div class="cards">${EFFECTS.map(e => `<button type="button" class="card" data-fxv="${e.v}"><b>${e.name}</b><small>${e.note}</small></button>`).join('')}</div>
      ${EFFECTS.filter(e => e.v).map(e => `<div class="fxp" data-fx="${e.v}"><h3>Ustawienia: ${e.name}</h3>${e.params.map(p => rangeH(p[0], p[1], p[2], p[3], p[4], p[5])).join('')}${e.choice ? segH(e.choice[0], e.choice[1], e.choice[2]) : ''}</div>`).join('')}
      <div class="fxcommon"><h3>Dla każdej nakładki</h3>${rangeH('Siła nakładki', 'fxAmt', 0, 1, .05, 'pct', 'mniej: widać spod niej zwykły obraz gry')}${rangeH('Drżenie kreski', 'wob', 0, 1, .05, 'pct', 'rysunek przerysowany 8 razy na sekundę')}</div>
      <button type="button" class="reset" data-reset-tab="nakl">Przywróć z gotowego stylu</button>` };
  for (const t of TABS) if (t.items) sec[t.id] = t.items.map(itemH).join('') + (t.note ? `<p class="note">${t.note}</p>` : '') + `<button type="button" class="reset" data-reset-tab="${t.id}">Przywróć z gotowego stylu</button>`;
  P.innerHTML = `<header><h2>Styl obrazu</h2><p class="now"></p><button type="button" class="x" aria-label="zamknij">✕</button></header>
    <nav role="tablist">${TABS.map(t => `<button type="button" role="tab" data-tab="${t.id}">${t.name}</button>`).join('')}</nav>
    <div class="body">${TABS.map(t => `<section data-sec="${t.id}">${sec[t.id]}</section>`).join('')}</div>`;

  const fmt = (f, v) => { v = +v; return f === 'pct' ? Math.round(v * 100) + '%' : f === 'dither' ? (v * 100).toFixed(1) : f === 'px' ? v + ' px' : f === 'px1' ? v.toFixed(1) + ' px' : f === 'x' ? (v > 1 ? v + '×' : 'brak') : f === 'x1' ? v.toFixed(1) + '×' : f === 'deg' ? v + '°' : f === 'lvl' ? (v < 2 ? 'wył.' : String(v)) : f === 'int2' ? v.toFixed(2) : String(v); };
  function refresh() {
    P.querySelector('[data-preset="moj"]').hidden = !mine;
    const fromName = PRESETS[S.from]?.name || PRESETS[S.preset]?.name;
    P.querySelector('.now').textContent = S.preset === 'moj' ? 'Teraz: Mój' : S.preset === 'wlasny' ? `Teraz: ${fromName ? fromName + ', zmieniony' : 'własny'}` : `Teraz: ${PRESETS[S.preset]?.name || 'własny'}`;
    for (const b of P.querySelectorAll('nav [data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    for (const s of P.querySelectorAll('[data-sec]')) s.hidden = s.dataset.sec !== tab;
    for (const b of P.querySelectorAll('[data-preset]')) b.setAttribute('aria-pressed', String(b.dataset.preset === S.preset));
    const m = +val(S, 'mode') || 0;
    for (const b of P.querySelectorAll('[data-fxv]')) b.setAttribute('aria-pressed', String(+b.dataset.fxv === m));
    for (const f of P.querySelectorAll('.fxp')) f.hidden = +f.dataset.fx !== m;
    P.querySelector('.fxcommon').hidden = !m;
    for (const r of P.querySelectorAll('.row[data-key]')) for (const b of r.children) b.setAttribute('aria-pressed', String(String(val(S, r.dataset.key)) === b.dataset.v));
    for (const i of P.querySelectorAll('input[data-key]')) { const v = val(S, i.dataset.key); if (v === undefined) continue; i.value = v; P.querySelector(`[data-out="${i.dataset.key}"]`).textContent = fmt(i.dataset.fmt, v); }
    for (const c of P.querySelectorAll('.ctl[data-ctl]')) { const r = RULES[c.dataset.ctl]; const ok = !r || r[0](S); c.classList.toggle('off', !ok); c.querySelector('.why').textContent = ok ? '' : (typeof r[1] === 'function' ? r[1](S) : r[1]);
      for (const i of c.querySelectorAll('input, .row button')) i.disabled = !ok; }
  }
  function set(part, fromPreset = false) { S = { ...S, ...part }; if (!fromPreset && !('preset' in part)) S.preset = 'wlasny'; apply(S); save(); refresh(); }
  // a tab back to how the style last chosen has it
  function resetTab(id) { const src = { ...DEFAULTS, ...(PRESETS[S.from] || PRESETS[DEFAULT]) }, t = TABS.find(q => q.id === id), keys = id === 'nakl' ? FX_KEYS : (t.items || []).map(it => it[2]);
    set(Object.fromEntries(keys.map(k => [k, src[k] ?? DEFAULTS[k]]))); }
  P.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.classList.contains('x')) return open(false);
    if (b.dataset.tab) { tab = b.dataset.tab; try { localStorage.setItem(TABK, tab); } catch { } return refresh(); }
    if (b.dataset.preset === 'moj') return set(base(), true);
    if (b.dataset.preset) return set({ ...DEFAULTS, preset: b.dataset.preset, from: b.dataset.preset, ...PRESETS[b.dataset.preset] }, true);
    if (b.dataset.fxv !== undefined) return set({ mode: +b.dataset.fxv });
    if (b.dataset.resetTab) return resetTab(b.dataset.resetTab);
    if ('reset' in b.dataset) return set(base(), true);
    if ('mine' in b.dataset) { mine = { ...S }; delete mine.preset; try { localStorage.setItem(MINE, JSON.stringify(mine)); } catch { } S.preset = 'moj'; save(); refresh();
      const n = P.querySelector('.saved'); n.textContent = 'Zapisano jako Mój. „Wróć do domyślnego” wraca do niego.'; return; }
    const row = b.closest('.row[data-key]'); if (row) { const v = b.dataset.v; set({ [row.dataset.key]: v === 'true' ? true : v === 'false' ? false : +v }); } });
  P.addEventListener('input', e => { const i = e.target.closest('input[data-key]'); if (i) set({ [i.dataset.key]: +i.value }); });
  let isOpen = false;
  function open(v = !isOpen) { isOpen = v; P.classList.toggle('on', v); if (v) P.querySelector('nav [aria-selected="true"]')?.focus({ preventScroll: true }); else btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', () => open());
  addEventListener('keydown', e => { if (e.repeat || window.PT_capturing) return; if ((window.PT_styleKeys ? window.PT_styleKeys() : ['KeyU']).includes(e.code) && !e.target.closest?.('input')) { open(); e.preventDefault(); } else if (e.code === 'Escape' && isOpen) { open(false); e.stopImmediatePropagation(); } }, true);
  apply(S); refresh();
  return { get S() { return S; }, set, open, get isOpen() { return isOpen; } };
}
