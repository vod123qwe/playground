// The paper between the stretches: what happens after a finish happens on a newspaper, the one you deliver (Wieści zza płotu). A stack
// of sheets on the screen, the top one turned page by page (a pixel flip):
//   1 PORANEK: the masthead with the town's crest, the date line; the lead story about your morning (its headline and its words made of
//     what you did) under a photo taken at the finish (the game's own picture); two local news with their photos (taken at the places:
//     the police station, the bike shop, the shrine...); tomorrow on the route; the box of your route with its numbers and a little map
//   2 TWOJA TRASA: the route drawn big, every house on it (delivered, missed, not subscribing), the windows broken, the falls; the stars
//     and what they want; today beside the best, the records
//   3 OGŁOSZENIA: the small ads (Janusz's parts at their prices, the town's oddities) and where to next: the stretches it opened
// createPaper({ game }) → { open(data), close(), key(e), isOpen }
//   data: { L, r, rec, opened, photos: { finish, news: [{ spot, img }] }, route, next: [{ id, name, note }], ads: [{ t, d }], money, region }
//   game: { map(), again(), home(), shop(), go(id), sound(name) }

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const DAYS = ['NIEDZIELA', 'PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA'], MONTHS = ['STYCZNIA', 'LUTEGO', 'MARCA', 'KWIETNIA', 'MAJA', 'CZERWCA', 'LIPCA', 'SIERPNIA', 'WRZEŚNIA', 'PAŹDZIERNIKA', 'LISTOPADA', 'GRUDNIA'];
const pickOf = (a, r = Math.random) => a[r() * a.length | 0];
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? few : many;

// the local news, each with the place its photo is taken at (a label of the track's shacks, or home)
export const NEWS = [
  { spot: 'posterunek policji', head: 'Dyżurny apeluje: po chodniku powoli', text: 'Na posterunku przypominają, że chodnik jest dla pieszych. Rowerzystom, którzy muszą, zalecają tempo spacerowe.' },
  { spot: 'posterunek policji', head: 'Bezpieczniej na drogach', text: 'Patrol stanie rano przy głównej. Dyżurny prosi kierowców o zdjęcie nogi z gazu przy przejściach.' },
  { spot: 'sklep rowerowy', head: 'Janusz: nowa dostawa dętek', text: 'Warsztat przy głównej ma nowy towar. Właściciel zapewnia, że tym razem pasują do wszystkiego. Prawie.' },
  { spot: 'sklep rowerowy', head: 'Warsztat otwarty od świtu', text: 'Pan Janusz otwiera wcześniej, bo jak mówi, rowery psują się najczęściej przed siódmą.' },
  { spot: 'kapliczka', head: 'Kapliczka przy drodze odnowiona', text: 'Mieszkańcy zebrali się w sobotę z pędzlami. Teraz świeci bielą aż od zakrętu.' },
  { spot: 'buda z psem', head: 'Pies znów goni rowery', text: 'Sąsiedzi skarżą się na czworonoga, który nie przepuszcza żadnego koła. Właściciel twierdzi, że to z sympatii.' },
  { spot: 'budowa', head: 'Budowa na rogu stoi drugi tydzień', text: 'Na placu cisza, koparka czeka. Inwestor zapewnia, że prace ruszą, gdy tylko przestanie padać. Nie pada od dwóch tygodni.' },
  { spot: 'trzepak', head: 'Trzepak wraca do łask', text: 'Dzieciaki z okolicy znów spędzają na nim popołudnia. Dywany na razie bez zmian.' },
  { spot: 'działki', head: 'Działkowcy: dynie jak nigdy', text: 'Na ogródkach rekordowy rok. Największa dynia waży podobno tyle co skuter.' },
  { spot: 'przystanek', head: 'Autobus znów spóźniony', text: 'Pasażerowie czekali kwadrans. Przewoźnik tłumaczy się gęsiami na drodze.' },
  { spot: 'garaże', head: 'Garaże: kto pomalował bramę?', text: 'Jedna z bram w rzędzie garaży jest od wczoraj różowa. Właściciel jest zdziwiony najbardziej.' },
  { spot: 'przyczepa', head: 'Czyja to przyczepa?', text: 'Od miesiąca stoi przy drodze i nikt się nie przyznaje. Sąsiedzi zaczęli w niej trzymać rowery.' },
  { spot: 'dom', head: 'Kosz pod domem: brat trenuje', text: 'Młodszy brat naszego gazeciarza ćwiczy rzuty od rana. Twierdzi, że w przyszłym roku zagra w lidze.' }];

// what happened on your route (main.js logs it as you ride): the news about it, the photo taken where it happened; {n} how many times
export const EVENTS = {
  granny: [{ head: 'Starsza pani kontra rower', text: 'Przy drodze doszło do spięcia z emerytką i jej torebką. Świadkowie twierdzą, że wygrała torebka.' }],
  car: [{ head: 'Zderzenie na trasie gazeciarza', text: 'Auto i rower spotkały się na jezdni. Kierowca przeprasza, rower mniej. Na szczęście obyło się bez złamań.' }, { head: 'Kierowcy, uwaga na rowery!', text: 'Rano na trasie auto potrąciło naszego gazeciarza. Apelujemy o ostrożność, zwłaszcza przy wyjazdach z posesji.' }],
  police: [{ head: 'Patrol zatrzymał rowerzystę', text: 'Policja skontrolowała gazeciarza {n} {razy}. Dyżurny przypomina: lampka i dzwonek to nie ozdoby.' }],
  window: [{ head: 'Szyby lecą, szklarz się cieszy', text: 'Na trasie stłuczono {n} {szyb}. Poszkodowani wiedzą, kto jechał. Gazety do nich na razie nie trafią.' }, { head: 'Gazeta przez okno', text: 'Mieszkańcy znaleźli dziś prasę w salonie, razem ze szkłem. Prenumeratę zawiesili.' }],
  dog: [{ head: 'Pies pognał gazeciarza', text: 'Czworonóg zza płotu ruszył w pościg {n} {razy}. Właściciel zapewnia, że pies tylko chciał poczytać.' }, { head: 'Psy nie śpią od świtu', text: 'Na trasie co chwilę ujadanie. Gazeciarz radzi: nie zwalniać przy furtkach.' }],
  fall: [{ head: 'Asfalt znów wygrał', text: 'Gazeciarz zaliczył {n} {wywrotek}. Kolana w porządku, duma trochę mniej.' }],
  streak: [{ head: 'Seria jak z karabinu', text: 'Gazeciarz trafił do {n} skrzynek z rzędu, bez jednego pudła. Takiej serii dawno tu nie było.' }],
  clean: [{ head: 'Czysto od startu do mety', text: 'Ani jednej wywrotki, ani jednej szyby. Mieszkańcy mówią, że tak powinno być codziennie.' }] };
const FORMS = { razy: ['raz', 'razy', 'razy'], szyb: ['szybę', 'szyby', 'szyb'], wywrotek: ['wywrotkę', 'wywrotki', 'wywrotek'] };
export const eventNews = (kind, n) => { const t = pickOf(EVENTS[kind]), f = s => s.replace('{n}', n).replace(/\{(\w+)\}/g, (_, k) => FORMS[k] ? plural(n, ...FORMS[k]) : ''); return { head: f(t.head), text: f(t.text) }; };
// the headline of the lead: the best thing (or the worst) of the ride
export function headline(L, r, rec) { const n = rec.g.n;
  if (n === 3) return pickOf(['Perfekcyjny poranek gazeciarza', 'Trzy gwiazdki, zero wywrotek', 'Gazeciarz roku? Na to wygląda']);
  if (rec.beat.time && !rec.first) return pickOf(['Nowy rekord trasy!', 'Szybciej niż wczoraj. Dużo szybciej']);
  if (r.falls >= 3) return pickOf([`${r.falls} wywrotki na jednej trasie`, 'Asfalt pamięta każdy upadek']);
  if (r.windows > 0) return pickOf(['Szkło na chodniku. Wiadomo, kto jechał', 'Gazeta trafiła. Niestety w okno']);
  if (r.delivered >= L.goal.papers) return pickOf(['Gazety doszły, ludzie zadowoleni', 'Skrzynki pełne, sąsiedzi spokojni']);
  return pickOf(['Dojechał. Gazety? Różnie', 'Meta zaliczona, skrzynki puste']); }

// the people of the town, interviewed (two questions, their answers made of your morning where it fits) and telling their stories;
// their portraits taken in the game (Janusz from his picture), printed in two inks with a dither
const W_ = (n, a, b, c) => `${n} ${plural(n, a, b, c)}`;
export const CAST = {
  janusz: { who: 'Pan Janusz', role: 'warsztat przy głównej', qa: r => [['Panie Januszu, jak tam rower naszego gazeciarza?', r.falls ? `Po ${W_(r.falls, 'wywrotce', 'wywrotkach', 'wywrotkach')}? Trzyma się. Rower, nie chłopak.` : 'Jak nowy. No, prawie nowy. Prawie robi różnicę.'], ['Co by pan doradził na jutro?', 'Dzwonek, lampka i nie hamować przodem. Resztę załatwi charakter i moje dętki.']] },
  brat: { who: 'Młodszy brat', role: 'koszykarz spod domu', qa: r => [['Jak oceniasz dzisiejszy kurs brata?', r.delivered >= 8 ? 'Dobry. Prawie tak dobry jak mój rzut za trzy.' : 'Słabo. Ja bym trafił więcej, i to z zamkniętymi oczami.'], ['A ty kiedy na trasę?', 'Jak mi kupią rower. I kask. I żeby mama nie widziała.']] },
  mama: { who: 'Mama gazeciarza', role: 'z kuchni', qa: r => [['Martwi się pani, gdy syn wyjeżdża o świcie?', r.falls ? `Widziałam kolana. ${W_(r.falls, 'wywrotka', 'wywrotki', 'wywrotek')}, a on mówi, że to nic.` : 'Wrócił cały i nawet nie brudny. Zapisuję ten dzień w kalendarzu.'], ['Co na śniadanie dla zawodowca?', 'Kanapka z serem i herbata. Gazeciarz na głodno to gazeciarz w rowie.']] },
  tata: { who: 'Tata gazeciarza', role: 'przed wyjazdem do pracy', qa: r => [['Jest pan dumny z syna?', `Czas ${mmss(r.time)}. Ja w jego wieku jeździłem wolniej. Ale za to pod górkę.`], ['Pomaga pan przy rowerze?', 'Pompuję koła. Czasem za mocno. Raz pękła dętka i pół ulicy się obudziło.']] },
  sasiadka: { who: 'Sąsiadka zza płotu', role: 'czytelniczka od lat', qa: r => [['Gazeta dziś doszła?', r.windows ? 'Doszła. Przez szybę. Proszę to napisać drukowanymi literami.' : 'Doszła, sucha i prosto do skrzynki. Tak ma być.'], ['Co pani czyta najpierw?', 'Ogłoszenia. Tam jest prawdziwe życie. I kot pana Mietka, który ciągle ginie.']] },
  sasiad: { who: 'Sąsiad z ogrodem', role: 'od róż i kosiarki', qa: r => [['Widział pan dziś gazeciarza?', 'Śmignął jak wiatr. Moje róże aż się pochyliły.'], ['Jakaś rada dla niego?', 'Żeby nie skracał przez mój trawnik. Wszyscy widzą ślady opon.']] },
  dzialki: { who: 'Działkowiec', role: 'z ogródków przy torach', qa: r => [['Jak tam plony?', 'Dynie jak nigdy. Jedną wiozę taczką, drugą sąsiad koparką.'], ['A gazeta?', 'Czytam przy kompoście. Najlepiej się tam myśli.']] },
  kapliczka: { who: 'Pani spod kapliczki', role: 'pilnuje kwiatów', qa: r => [['Często pani widzi gazeciarza?', 'Codziennie. Zawsze się żegna przy kapliczce. Jedną ręką, bo drugą rzuca.'], ['Czego mu pani życzy?', r.falls ? 'Mniej upadków. Modlę się za jego kolana.' : 'Żeby tak dalej. I żeby zwalniał przy psach.']] },
  budowa: { who: 'Kierownik budowy', role: 'na rogu, od dwóch tygodni', qa: r => [['Kiedy ruszą prace?', 'Jak tylko przyjdzie dźwig. Dźwig czeka na kierowcę. Kierowca na pogodę.'], ['Co pan sądzi o rowerzystach?', 'Mogą jeździć, byle nie przez mój wykop. Wczoraj jeden prawie skoczył.']] },
  dogman: { who: 'Właściciel psa', role: 'zza furtki', qa: r => [['Pana pies znów gonił gazeciarza?', 'On nie goni, on odprowadza. To różnica. Dla psa.'], ['Może smycz?', 'Smycz też gonił. Raz ją dogonił.']] } };
export const ANECDOTES = [
  { who: 'janusz', head: 'Z warsztatu', text: 'Pan Janusz twierdzi, że zna rower po dźwięku. Wczoraj rozpoznał składak po samym zgrzycie łańcucha, dwa bloki dalej.' },
  { who: 'kapliczka', head: 'Spod kapliczki', text: 'Kwiaty przy kapliczce znikają co czwartek. Sprawcą okazała się koza z działek, która ma podobno religijne usposobienie.' },
  { who: 'dzialki', head: 'Z ogródków', text: 'Działkowiec przy torach hoduje dynię tak wielką, że pociąg zwalnia, żeby ją obejrzeć. Maszynista potwierdza.' },
  { who: 'sasiadka', head: 'Zza płotu', text: 'Sąsiadka zapisuje w zeszycie, o której przychodzi gazeta. Zeszyt ma już trzy tomy i spis treści.' },
  { who: 'brat', head: 'Spod kosza', text: 'Brat gazeciarza trafił wczoraj czterdzieści rzutów z rzędu. Świadków brak, ale on pamięta każdy.' },
  { who: 'budowa', head: 'Z budowy', text: 'Na placu budowy od tygodnia stoi betoniarka. Ktoś przywiązał do niej balon. Wygląda na zadowoloną.' },
  { who: 'tata', head: 'Z garażu', text: 'Tata gazeciarza od lat naprawia w garażu ten sam motorower. Twierdzi, że brakuje jednej śrubki. Szuka jej od zeszłej wiosny.' }];
// a picture printed: three inks (the black, a grey of the black, the paper) dithered in a 4 x 4 pattern, as a cheap press does
export function printed(src, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], T = [[43, 39, 35], [138, 128, 112], [236, 227, 204]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; let l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; l = Math.min(1, Math.max(0, (l - .5) * 1.35 + .55));
    const v = l * 2, b = Math.min(1, Math.floor(v)), f = v - b, k = f > (B4[(y % 4) * 4 + x % 4] + .5) / 16 ? b + 1 : b; d[i] = T[k][0]; d[i + 1] = T[k][1]; d[i + 2] = T[k][2]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c; }

const ADS = [
  { t: 'ZGINĄŁ KOT', d: 'Rudy, odpowiada na Mruczek, nie odpowiada na nic innego. Nagroda: szarlotka.' },
  { t: 'KUPIĘ SKŁADAKA', d: 'Może być bez pedałów. Pedały mam.' },
  { t: 'KOREPETYCJE', d: 'Matematyka, fizyka, jazda bez trzymanki. Tanio.' },
  { t: 'SPRZEDAM KOZĘ', d: 'Mało je, dużo myśli. Odbiór osobisty.' },
  { t: 'ODDAM SZCZENIAKI', d: 'Po psie, który goni rowery. Charakter w cenie.' },
  { t: 'ZAMIENIĘ', d: 'Kasety magnetofonowe na cokolwiek, co gra.' },
  { t: 'DAM PRACĘ', d: 'Roznoszenie ulotek. Wymagany własny rower i cierpliwość do psów.' },
  { t: 'ZNALEZIONO', d: 'Dzwonek rowerowy, dzwoni. Do odebrania na posterunku.' }];

import { pxKey } from './pixui.js';

export function createPaper({ game }) {
  const css = document.createElement('style'); css.textContent = `
    #paper { position: fixed; inset: 0; z-index: 9; display: none; place-items: center; font: 16px/1.25 PTPix, ui-monospace, Consolas, monospace; color: #2b2723; overflow: hidden;
      background-color: rgba(10,11,13,.6); background-image: linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%), linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #paper.on { display: grid; } #paper * { image-rendering: pixelated; box-sizing: border-box; }
    #paper .pile { position: relative; width: min(1060px, calc(100vw - 40px)); height: min(700px, calc(100vh - 90px)); transform: rotate(-1.2deg); animation: pp-in .4s steps(6) both; }
    @keyframes pp-in { from { transform: translateY(110%) rotate(-9deg); } }
    #paper .under, #paper .sheet { position: absolute; inset: 0; clip-path: polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 4px) calc(100% - 8px), calc(100% - 4px) calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 8px), 0 8px, 4px 8px, 4px 4px, 8px 4px); }
    #paper .under { background: #17181b; } #paper .under i { position: absolute; inset: 4px; background: #cfc4a6; clip-path: inherit; }
    #paper .u1 { transform: translate(10px, 12px) rotate(1.6deg); } #paper .u2 { transform: translate(18px, 20px) rotate(2.6deg); } #paper .u2 i { background: #bfb393; }
    #paper .sheet { background: #17181b; } #paper .face { position: absolute; inset: 4px; clip-path: inherit; background-color: #ece3cc; background-image: var(--pp-grain); background-size: 64px 64px; padding: 18px 24px 16px; display: flex; flex-direction: column; }
    #paper .face:after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 6px; margin-top: -3px; pointer-events: none; background: linear-gradient(rgba(0,0,0,.07), rgba(0,0,0,.02) 40%, rgba(255,255,255,.25) 50%, rgba(0,0,0,.03) 60%, transparent); }   /* the fold */
    #paper .sheet.out { animation: pp-out .16s steps(3) both; } #paper .sheet.in { animation: pp-flip .16s steps(3) both; }
    @keyframes pp-out { to { transform: scaleX(0) skewY(2deg); } } @keyframes pp-flip { from { transform: scaleX(0) skewY(-2deg); } }
    /* the masthead */
    #paper .mast { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; }
    #paper .crest { width: 64px; height: 72px; } #paper .title { font-size: 56px; line-height: 1.2; text-shadow: 7px 0 0 #2b2723; letter-spacing: 6px; white-space: nowrap; min-width: 0; }
    #paper .index { border: 4px solid #2b2723; background: #d8cfb6; padding: 4px 8px; display: grid; gap: 2px; min-width: 190px; }
    #paper .index a { cursor: pointer; color: #4a4540; } #paper .index a:hover, #paper .index a.on { color: #b8483a; } #paper .index a.on:before { content: '▸ '; }
    #paper .rule { display: flex; justify-content: space-between; gap: 10px; border-top: 4px solid #b8483a; border-bottom: 2px solid #2b2723; padding: 3px 0 2px; margin: 8px 0 10px; color: #4a4540; flex-wrap: wrap; }
    #paper .body { flex: 1; min-height: 0; display: grid; gap: 14px; }
    #paper h2, #paper h3 { margin: 0; font-weight: normal; line-height: 1.02; } #paper h2 { font-size: 32px; text-shadow: 4px 0 0 #2b2723; letter-spacing: 4px; } #paper h3 { font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; margin-bottom: 6px; }
    #paper p { margin: 0 0 6px; } #paper .ph { display: block; width: 100%; border: 4px solid #2b2723; background: #9a968c; object-fit: cover; filter: sepia(.18) contrast(1.04); }
    #paper .cap { color: #6a645c; margin-top: 2px; }
    #paper .bars { display: grid; gap: 5px; margin-top: 6px; } #paper .bars i { height: 6px; background: #b9b09a; } #paper .bars i:nth-child(4n) { width: 72%; } #paper .bars i:nth-child(5n+2) { width: 88%; }
    #paper .col { min-height: 0; overflow: hidden; } #paper .vr { border-left: 2px solid #2b2723; padding-left: 14px; } #paper .hr { border-top: 2px solid #2b2723; padding-top: 10px; }
    /* page 1 */
    #paper .p1 { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: minmax(0, 1.2fr) minmax(0, 1fr); }
    #paper .lead { grid-column: span 2; display: grid; grid-template-columns: 1fr 1.05fr; gap: 14px; min-height: 0; } #paper .lead .ph { height: 100%; min-height: 0; }
    #paper .clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; } #paper .c3 { -webkit-line-clamp: 3; } #paper .c4 { -webkit-line-clamp: 4; } #paper .c8 { -webkit-line-clamp: 8; }
    #paper .news .ph { height: 116px; } #paper .news { display: flex; flex-direction: column; } #paper .news .cap { margin-top: 4px; }
    #paper .opts { color: #8e2e25; margin-top: 4px; }
    #paper .pt { width: 64px; height: 64px; border: 4px solid #2b2723; flex: none; display: block; } #paper .iv .pt { float: left; margin: 2px 10px 4px 0; } #paper .iv .who { color: #6a645c; margin: 0 0 4px; } #paper .iv .who b { font-weight: normal; color: #2b2723; } #paper .pt.sm { width: 88px; height: 88px; }
    #paper .iv .ivh { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; } #paper .iv .ivh b { font-weight: normal; display: block; } #paper .iv .ivh small { color: #6a645c; font-size: 16px; }
    #paper .iv .q { color: #8e2e25; margin: 0 0 2px; } #paper .iv .q:before { content: '- '; } #paper .iv .a { margin: 0 0 6px; } #paper .iv .a:before { content: '- '; }
    #paper .brief { margin-top: 8px; border-top: 4px solid #2b2723; padding-top: 6px; } #paper .brief h4 { margin: 0 0 4px; font-weight: normal; color: #8e2e25; } #paper .brief p { margin: 0 0 4px; padding-left: 12px; text-indent: -12px; } #paper .brief p:before { content: '▪ '; color: #8e2e25; }
    #paper .anec { display: flex; gap: 12px; align-items: flex-start; } #paper .anec h3 { margin-bottom: 4px; }
    #paper .more { float: right; font-size: 16px; text-shadow: none; letter-spacing: 0; color: #8e2e25; margin-top: 4px; } #paper .keys2 { display: flex; gap: 8px; flex-wrap: wrap; }
    #paper .next .pxk { justify-content: flex-start; } #paper .bar { gap: 10px; align-items: flex-end; }
    #paper .box { background: #e9d9a8; border: 4px solid #2b2723; padding: 6px 8px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto minmax(0, 1fr); gap: 6px 10px; cursor: pointer; min-height: 0; } #paper .box:hover { background: #f0e2b4; }
    #paper .box h3 { grid-column: 1 / -1; color: #8e2e25; text-shadow: 3px 0 0 #8e2e25; border-bottom: 4px solid #b8483a; padding-bottom: 4px; margin: 0; }
    #paper .kv { display: grid; grid-template-columns: 22px 1fr; gap: 0 8px; align-items: center; } #paper .kv canvas { width: 20px; height: 20px; grid-row: span 2; } #paper .kv b { font-weight: normal; font-size: 16px; line-height: 1; } #paper .kv small { color: #6a645c; font-size: 16px; }
    #paper .box canvas.mini { width: 100%; height: 100%; min-height: 0; border: 2px solid #2b2723; background: #cfd8a8; }
    #paper .stars { display: inline-flex; gap: 4px; vertical-align: middle; } #paper .stars i { width: 18px; height: 18px; background: #b9b09a; clip-path: polygon(40% 0, 60% 0, 60% 30%, 100% 30%, 100% 50%, 80% 60%, 90% 100%, 70% 100%, 50% 80%, 30% 100%, 10% 100%, 20% 60%, 0 50%, 0 30%, 40% 30%); } #paper .stars i.on { background: #d8a02a; }
    /* page 2 */
    #paper .p2 { grid-template-columns: 1.35fr 1fr; } #paper .p2 canvas.big { width: 100%; height: 100%; min-height: 0; border: 4px solid #2b2723; background: #cfd8a8; }
    #paper .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 6px; color: #4a4540; } #paper .legend span:before { content: ''; display: inline-block; width: 10px; height: 10px; margin-right: 6px; background: var(--c); border: 2px solid #2b2723; vertical-align: -1px; }
    #paper table { width: 100%; border-collapse: collapse; } #paper td, #paper th { padding: 2px 4px; text-align: right; font-weight: normal; } #paper td:first-child, #paper th:first-child { text-align: left; } #paper th { color: #6a645c; border-bottom: 2px solid #2b2723; } #paper tr + tr td { border-top: 1px solid #c9bfa4; } #paper .rec { color: #b8483a; }
    #paper .goal { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; align-items: center; margin-bottom: 4px; } #paper .goal .stars i { width: 16px; height: 16px; }
    /* page 3 */
    #paper .p3 { grid-template-columns: 1.4fr 1fr; } #paper .ads { columns: 2; column-gap: 14px; column-rule: 2px solid #2b2723; } #paper .ad { break-inside: avoid; border: 2px solid #2b2723; padding: 6px 8px; margin-bottom: 10px; background: #e6dcc2; } #paper .ad b { font-weight: normal; display: block; font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; margin-bottom: 2px; }
    #paper .ad.j { background: #f2e6c0; border-width: 4px; } #paper .ad .pr { color: #8e2e25; }
    #paper .next { display: grid; gap: 6px; align-content: start; overflow-y: auto; scrollbar-width: thin; }
    /* the buttons under the paper */
    #paper .bar { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); display: flex; gap: 8px; z-index: 2; }
    #paper button:not(.pxk) { all: unset; cursor: pointer; border: 6px solid transparent; border-image: var(--px-btn) 3 fill / 6px; padding: 2px 10px; color: #f6f3ea; white-space: nowrap; }
    #paper button:not(.pxk):hover, #paper button:not(.pxk).pad-focus { border-image-source: var(--px-btn-hi); } #paper button:not(.pxk):active { border-image-source: var(--px-btn-dn); transform: translateY(2px); } #paper button.go:not(.pxk) { border-image-source: var(--px-sel); color: #17181b; }
    
    @media (max-width: 1040px) { #paper .pile { width: calc(100vw - 24px); height: calc(100vh - 86px); } #paper .face { padding: 12px 14px; } #paper .title { font-size: 40px; text-shadow: 5px 0 0 #2b2723; letter-spacing: 4px; } #paper .crest { width: 48px; height: 54px; }
      #paper .index { min-width: 0; } #paper .body { overflow-y: auto; scrollbar-width: thin; } #paper .p1 { grid-template-columns: 1fr 1fr; grid-template-rows: none; } #paper .lead { grid-column: 1 / -1; height: 230px; }
      #paper .p1 > div { min-height: 230px; } #paper .p2, #paper .p3 { grid-template-columns: 1fr; } #paper .p2 canvas.big { height: 300px; flex: none; } #paper .vr { border-left: 0; padding-left: 0; } #paper .news .ph { height: 110px; } }
    @media (max-width: 640px) { #paper .title { font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; } #paper .index { display: none; } #paper h2 { font-size: 24px; text-shadow: 3px 0 0 #2b2723; } #paper .p1, #paper .lead { grid-template-columns: 1fr; } #paper .lead { height: auto; } #paper .lead .ph { height: 180px; } #paper .ads { columns: 1; } #paper .bar { flex-wrap: wrap; justify-content: center; width: calc(100vw - 20px); } }
}`;
  document.head.appendChild(css);
  // the paper's grain: a few specks on the cream
  { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); for (let k = 0; k < 70; k++) { g.fillStyle = Math.random() < .5 ? 'rgba(90,70,40,.08)' : 'rgba(255,255,255,.18)'; g.fillRect(Math.random() * 32 | 0, Math.random() * 32 | 0, 1, 1); } document.documentElement.style.setProperty('--pp-grain', `url(${c.toDataURL()})`); }
  const el = document.createElement('div'); el.id = 'paper'; el.innerHTML = '<div class="pile"><div class="under u2"><i></i></div><div class="under u1"><i></i></div><div class="sheet"><div class="face"></div></div></div><div class="bar"></div>';
  document.body.appendChild(el);
  const sheet = el.querySelector('.sheet'), face = el.querySelector('.face'), bar = el.querySelector('.bar');
  let open_ = false, page = 0, D = null, busy = false;

  // ---------- little pictures ----------
  const cnv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), (g, x, y, ww, hh, k) => { g.fillStyle = k; g.fillRect(x, y, ww, hh); }); return c; };
  // the town's crest: a red shield, a white gate with three towers
  const crest = () => cnv(16, 18, (g, P) => { const R = '#b8483a', K = '#2b2723', Wt = '#f2ece0'; P(g, 0, 0, 16, 13, K); P(g, 1, 13, 14, 2, K); P(g, 3, 15, 10, 2, K); P(g, 6, 17, 4, 1, K); P(g, 1, 1, 14, 12, R); P(g, 2, 13, 12, 2, R); P(g, 4, 15, 8, 1, R);
    for (const x of [3, 7, 11]) { P(g, x, 3, 2, 7, Wt); P(g, x, 2, 1, 1, Wt); P(g, x + 1, 2, 1, 1, Wt); } P(g, 3, 7, 10, 5, Wt); P(g, 7, 9, 2, 3, R); P(g, 4, 5, 1, 1, R); P(g, 12, 5, 1, 1, R); });
  const ico = kind => cnv(10, 10, (g, P) => { const K = '#2b2723';
    if (kind === 'dist') { P(g, 1, 6, 3, 3, K); P(g, 6, 6, 3, 3, K); P(g, 2, 7, 1, 1, '#e9d9a8'); P(g, 7, 7, 1, 1, '#e9d9a8'); P(g, 3, 4, 4, 1, K); P(g, 4, 5, 1, 2, K); P(g, 6, 3, 2, 1, K); }
    else if (kind === 'time') { P(g, 3, 1, 4, 1, K); P(g, 2, 2, 6, 7, K); P(g, 3, 3, 4, 5, '#e9d9a8'); P(g, 4, 4, 1, 2, K); P(g, 5, 5, 1, 1, K); P(g, 4, 0, 2, 1, K); }
    else if (kind === 'star') { P(g, 4, 0, 2, 3, '#d8a02a'); P(g, 0, 3, 10, 2, '#d8a02a'); P(g, 1, 5, 8, 2, '#d8a02a'); P(g, 1, 7, 3, 2, '#d8a02a'); P(g, 6, 7, 3, 2, '#d8a02a'); }
    else if (kind === 'paper') { P(g, 1, 2, 8, 7, K); P(g, 2, 3, 6, 5, '#f2ece0'); P(g, 3, 4, 4, 1, '#b8483a'); P(g, 3, 6, 4, 1, K); }
    else if (kind === 'fall') { P(g, 4, 1, 2, 8, '#b8483a'); P(g, 1, 4, 8, 2, '#b8483a'); }
    else if (kind === 'aim') { P(g, 1, 1, 8, 8, K); P(g, 2, 2, 6, 6, '#e9d9a8'); P(g, 3, 3, 4, 4, '#b8483a'); P(g, 4, 4, 2, 2, '#e9d9a8'); } });
  const starsH = (n, of = 3) => `<span class="stars">${Array.from({ length: of }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const bars = n => `<div class="bars">${Array.from({ length: n }, () => '<i></i>').join('')}</div>`;
  const img = (c, cls = 'ph') => c ? `<img class="${cls}" src="${c.toDataURL ? c.toDataURL() : c}" alt="">` : `<div class="${cls}"></div>`;

  // the route drawn from above: the roads, the route's way in red, its checkpoints, home, the houses (delivered, missed, not subscribing),
  // the windows broken, the falls
  function routeMap(w, h, big) { const R = D.route, c = cnv(w, h, () => { }), g = c.getContext('2d'), all = [...R.loop, ...R.home];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const [x, z] of all) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const pad = big ? 10 : 6, k = Math.min((w - pad * 2) / (x1 - x0), (h - pad * 2) / (z1 - z0)), ox = (w - (x1 - x0) * k) / 2, oz = (h - (z1 - z0) * k) / 2, X = x => Math.round(ox + (x - x0) * k), Z = z => Math.round(oz + (z - z0) * k);
    const P = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
    // the land: a soft check of fields
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) P(x, y, 4, 4, ((x >> 2) + (y >> 2)) % 2 ? '#c8d29c' : '#cfd8a8');
    const line = (pts, col, wd, every = 1, on = 1) => { pts.forEach(([x, z], j) => { if (j % every >= on) return; P(X(x) - (wd >> 1), Z(z) - (wd >> 1), wd, wd, col); }); };
    line(R.loop, '#2b2723', big ? 5 : 4); line(R.loop, '#9a968c', big ? 3 : 2); line(R.home, '#2b2723', big ? 4 : 3); line(R.home, '#9a968c', big ? 2 : 1);
    line(R.way, '#b8483a', big ? 3 : 2, big ? 4 : 3, big ? 3 : 2);
    for (const d of R.doors) { const x = X(d.x), y = Z(d.z), s = big ? 4 : 3; P(x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2, '#2b2723'); P(x - s / 2, y - s / 2, s, s, d.sub ? (d.done ? '#4f9a3e' : '#cf5a3e') : '#e8e2d2'); }
    for (const p of R.wins) { const x = X(p.x), y = Z(p.z); P(x - 2, y - 2, 1, 1, '#2b2723'); P(x - 1, y - 1, 1, 1, '#2b2723'); P(x, y, 1, 1, '#2b2723'); P(x + 1, y + 1, 1, 1, '#2b2723'); P(x + 1, y - 1, 1, 1, '#2b2723'); P(x - 1, y + 1, 1, 1, '#2b2723'); }
    for (const p of R.falls) { const x = X(p.x), y = Z(p.z); P(x - 1, y - 3, 2, 6, '#8e2e25'); P(x - 3, y - 1, 6, 2, '#8e2e25'); }
    for (const [j, cp] of R.cps.entries()) { const x = X(cp[0]), y = Z(cp[1]), last = j === R.cps.length - 1, s = big ? 7 : 5; P(x - s / 2 - 1 | 0, y - s / 2 - 1 | 0, s + 2, s + 2, '#2b2723'); P(x - s / 2 | 0, y - s / 2 | 0, s, s, last ? '#f2ece0' : '#b8483a'); if (last) { P(x - s / 2 | 0, y - s / 2 | 0, s >> 1, s >> 1, '#2b2723'); P(x, y, s >> 1, s >> 1, '#2b2723'); } }
    { const [hx, hz] = R.homeAt, x = X(hx), y = Z(hz); P(x - 4, y - 5, 9, 8, '#2b2723'); P(x - 3, y - 1, 7, 3, '#f2ece0'); P(x - 3, y - 4, 7, 3, '#b8483a'); }
    return c; }

  // ---------- the pages ----------
  function mast(tab) { const d = new Date(); return `<div class="mast"><canvas class="crest" width="16" height="18"></canvas><div class="title">WIEŚCI ZZA PŁOTU</div>
      <div class="index">${['1 PORANEK', '2 TWOJA TRASA', '3 OGŁOSZENIA'].map((t, k) => `<a data-pg="${k}" class="${k === tab ? 'on' : ''}">${t}</a>`).join('')}</div></div>
      <div class="rule"><span>NR ${D.issue}</span><span>${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</span><span>${D.region} · ${D.L.name}</span><span>CENA: 1 ZŁ</span></div>`; }
  function story() { const { L, r, rec } = D, n = r.delivered, sub = D.route.subs, miss = Math.max(0, sub - n);
    const a = [`Dziś rano trasą ${L.name.toLowerCase()} przejechał nasz gazeciarz.`];
    a.push(n ? `Do skrzynek trafiło ${n} ${plural(n, 'gazeta', 'gazety', 'gazet')}${sub ? ` na ${sub} ${plural(sub, 'prenumeratora', 'prenumeratorów', 'prenumeratorów')} po drodze` : ''}.` : 'Skrzynki zostały dziś puste. Sąsiedzi pytają, co się stało.');
    if (r.thrown) a.push(`Celność: ${Math.round(r.acc * 100)} procent${r.acc >= .8 ? ', jak u snajpera' : r.acc < .4 ? ', trawniki mają co czytać' : ''}.`);
    a.push(r.falls ? `Nie obyło się bez upadków: ${r.falls} ${plural(r.falls, 'wywrotka', 'wywrotki', 'wywrotek')}.` : 'Ani razu nie zaliczył asfaltu.');
    if (r.windows) a.push(`Szyb stłuczonych: ${r.windows}. Szklarz zaciera ręce.`);
    if (miss && n) a.push(`${miss} ${plural(miss, 'dom czeka', 'domy czekają', 'domów czeka')} na gazetę do jutra.`);
    a.push(rec.first ? `Czas na mecie: ${mmss(r.time)}.` : rec.beat.time ? `Czas ${mmss(r.time)} to nowy rekord tej trasy.` : `Czas ${mmss(r.time)}, rekord to wciąż ${mmss(rec.best.time)}.`);
    return a.join(' '); }
  const portrait = (c, cls = 'pt') => c ? `<img class="${cls}" src="${c.toDataURL()}" alt="">` : '';
  function interview() { const I = D.iv; if (!I) return ''; const C = CAST[I.who]; if (!C) return ''; const qa = C.qa(D.r);
    return `<div class="col iv"><h3>Rozmowa dnia</h3>${portrait(I.img)}<p class="who"><b>${C.who}</b>, ${C.role}</p>${qa.map(([q, a]) => `<p class="q">${q}</p><p class="a">${a}</p>`).join('')}</div>`; }
  function page1() { const { r, rec } = D, nw = D.photos.news, tz = D.tease, A = nw[0];
    return mast(0) + `<div class="body p1">
      <div class="lead"><div class="col" style="display:flex;flex-direction:column"><h2>${D.headline}</h2><p class="clamp c8" style="margin-top:8px">${story()}</p>${bars(3)}</div>${img(D.photos.finish)}</div>
      <div class="vr" style="min-height:0;display:flex;flex-direction:column">${A ? `<div class="col news"><h3>${A.head}</h3>${img(A.img)}<p class="cap clamp c3">${A.text}</p></div>` : ''}
        ${D.briefs.length ? `<div class="brief"><h4>W SKRÓCIE</h4>${D.briefs.slice(0, 3).map(t => `<p>${t}</p>`).join('')}</div>` : ''}</div>
      <div class="hr" style="min-height:0;display:flex">${interview() || (nw[1] ? `<div class="col news"><h3>${nw[1].head}</h3>${img(nw[1].img)}<p class="cap clamp c3">${nw[1].text}</p></div>` : '')}</div>
      <div class="hr vr" style="min-height:0;display:flex">${tz ? `<div class="col news"><h3>${tz.head}</h3>${img(tz.img)}<p class="cap clamp c3">${tz.text}</p>${D.next.length ? `<div class="opts">JUTRO: ${D.next.map(x => x.name).join(' ALBO ')}</div>` : ''}</div>` : ''}</div>
      <div class="hr vr" style="min-height:0;display:flex"><div class="box" data-pg="1" style="flex:1"><h3>Twoja trasa <span class="more">STR. 2 ▸</span></h3><div style="display:grid;gap:6px;align-content:start">
          <div class="kv"><canvas data-ico="dist"></canvas><b>${(D.route.len / 1000).toFixed(2)} KM</b><small>DYSTANS</small></div>
          <div class="kv"><canvas data-ico="time"></canvas><b>${mmss(r.time)}</b><small>CZAS</small></div>
          <div class="kv"><canvas data-ico="paper"></canvas><b>${r.delivered} / ${D.route.subs}</b><small>DORĘCZONE</small></div>
          <div class="kv"><canvas data-ico="star"></canvas><b>${rec.g.n} / 3</b><small>GWIAZDKI</small></div></div><canvas class="mini" data-map="mini" width="150" height="150"></canvas></div></div></div>`; }
  function page2() { const { L, r, rec } = D, b = rec.best, gl = L.goal, st = rec.g.st;
    const row = (k, v, bv, rk) => `<tr><td>${k}</td><td>${v}${rec.beat[rk] ? ' <span class="rec">REKORD</span>' : ''}</td><td>${bv}</td></tr>`;
    return mast(1) + `<div class="body p2"><div class="col" style="display:flex;flex-direction:column"><h2 style="margin-bottom:6px">Twoja trasa: ${L.name.toLowerCase()}</h2><canvas class="big" data-map="big" width="320" height="230"></canvas>
        <div class="legend"><span style="--c:#4f9a3e">DORĘCZONE</span><span style="--c:#cf5a3e">PRENUMERATOR BEZ GAZETY</span><span style="--c:#e8e2d2">BEZ PRENUMERATY</span><span style="--c:#b8483a">TRASA I PUNKTY</span><span style="--c:#8e2e25">WYWROTKA</span><span style="--c:#2b2723">STŁUCZONA SZYBA</span></div></div>
      <div class="col vr" style="overflow-y:auto"><h3>Gwiazdki ${starsH(rec.g.n)}</h3>
        <div class="goal">${starsH(st[0] ? 1 : 0, 1)}<span>CZAS DO ${mmss(gl.time)}</span><span>${mmss(r.time)}</span></div>
        <div class="goal">${starsH(st[1] ? 1 : 0, 1)}<span>${gl.papers} GAZET, ${Math.round(gl.acc * 100)}% CELNIE</span><span>${r.delivered}, ${Math.round(r.acc * 100)}%</span></div>
        <div class="goal">${starsH(st[2] ? 1 : 0, 1)}<span>BEZ WYWROTKI</span><span>${r.falls}</span></div>
        <h3 style="margin-top:12px">Dziś i najlepiej</h3><table><tr><th></th><th>DZIŚ</th><th>NAJLEPIEJ</th></tr>
          ${row('CZAS', mmss(r.time), mmss(b.time), 'time')}${row('GAZETY', r.delivered, b.delivered, 'delivered')}${row('CELNOŚĆ', Math.round(r.acc * 100) + '%', Math.round((b.acc || 0) * 100) + '%', 'acc')}
          ${row('RZUTY', r.thrown, '-')}${row('WYWROTKI', r.falls, b.falls)}${row('SZYBY', r.windows, '-')}${row('ZAROBEK', r.earned + ' ZŁ', b.earned + ' ZŁ', 'earned')}${row('PRZEJAZDY', b.runs, '')}</table>
        <h3 style="margin-top:12px">Domy na trasie</h3><p>PRENUMERATORZY: ${D.route.subs} · DORĘCZONE: ${r.delivered} · BEZ GAZETY: ${Math.max(0, D.route.subs - r.delivered)} · WSZYSTKICH DOMÓW: ${D.route.doors.length}</p></div></div>`; }
  function page3() { const N = D.an, C = N && CAST[N.who];
    return mast(2) + `<div class="body p3"><div class="col" style="display:flex;flex-direction:column;gap:10px"><h2>Ogłoszenia drobne</h2><div class="ads">
        ${D.ads.map(a => `<div class="ad ${a.j ? 'j' : ''}"><b>${a.t}</b>${a.d}${a.price ? ` <span class="pr">${a.price} ZŁ</span>` : ''}</div>`).join('')}</div>
        ${C ? `<div class="anec hr">${portrait(N.img, 'pt sm')}<div><h3>Anegdota: ${N.head.toLowerCase()}</h3><p>${N.text}</p><p class="cap">Opowiedział(a): ${C.who.toLowerCase()}, ${C.role}.</p></div></div>` : ''}</div>
      <div class="col vr next"><h3>Dokąd dalej?</h3>${D.next.length ? D.next.map(x => `${pxKey(x.name, { icon: 'play', kind: x.first ? 'gold' : '', attrs: `data-go="${x.id}"`, nudge: true })}<p class="cap">${x.note}</p>`).join('') : '<p>Wszystkie odcinki w okolicy są już otwarte albo czekają na gwiazdki.</p>'}
        <h3 style="margin-top:8px">W portfelu: ${D.money} ZŁ</h3><div class="keys2">${pxKey('WARSZTAT', { icon: 'shop', attrs: 'data-act="shop"' })}${pxKey('MAPA', { icon: 'map', attrs: 'data-act="map"' })}</div>
        <h3 style="margin-top:10px">Tabela wyników</h3><table><tr><th>ODCINEK</th><th>GWIAZDKI</th><th>CZAS</th><th>GAZETY</th></tr>${(D.table || []).map(t => `<tr${t.on ? ' class="rec"' : ''}><td>${t.open ? t.name : '???'}</td><td>${starsH(t.stars)}</td><td>${t.best ? mmss(t.best.time) : '-'}</td><td>${t.best ? t.best.delivered : '-'}</td></tr>`).join('')}</table></div></div>`; }
  const PAGES = [page1, page2, page3];
  function render() { face.innerHTML = PAGES[page](); face.querySelectorAll('canvas.crest').forEach(c => c.getContext('2d').drawImage(crest(), 0, 0));
    face.querySelectorAll('canvas[data-ico]').forEach(c => { c.width = 10; c.height = 10; c.getContext('2d').drawImage(ico(c.dataset.ico), 0, 0); });
    face.querySelectorAll('canvas[data-map]').forEach(c => { const big = c.dataset.map === 'big'; c.width = Math.max(60, c.clientWidth / 2 | 0); c.height = Math.max(50, c.clientHeight / 2 | 0); c.getContext('2d').drawImage(routeMap(c.width, c.height, big), 0, 0); });
    face.querySelectorAll('[data-pg]').forEach(a => a.onclick = () => turn(+a.dataset.pg));
    face.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.go(b.dataset.go); });
    face.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const a = b.dataset.act; if (a === 'shop') game.shop(); else { close(); game.map(); } });
    bar.innerHTML = (page ? pxKey('STRONA', { icon: 'prev', key: '←', attrs: 'data-b="prev"' }) : '') + pxKey('JESZCZE RAZ', { icon: 'again', key: 'R', attrs: 'data-b="again"' }) + pxKey('DO DOMU', { icon: 'home', attrs: 'data-b="home"' }) + pxKey('MAPA', { icon: 'map', key: 'M', attrs: 'data-b="map"' }) +
      (page < 2 ? pxKey('DALEJ', { icon: 'next', key: '→', kind: 'gold', attrs: 'data-b="next"', nudge: true }) : pxKey('NA MAPĘ', { icon: 'play', key: 'ENTER', kind: 'gold', attrs: 'data-b="map"', nudge: true }));
    bar.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const k = b.dataset.b; if (k === 'prev') turn(page - 1); else if (k === 'next') turn(page + 1); else { close(); k === 'again' ? game.again() : k === 'home' ? game.home() : game.map(); } }); }
  function turn(p) { if (busy || p === page || p < 0 || p > 2) return; busy = true; game.sound?.('ui'); sheet.classList.add('out');
    setTimeout(() => { page = p; render(); sheet.classList.remove('out'); sheet.classList.add('in'); setTimeout(() => { sheet.classList.remove('in'); busy = false; }, 170); }, 165); }
  function open(data) { D = data; D.headline ||= headline(D.L, D.r, D.rec); D.ads = [...(D.parts || []).map(p => ({ ...p, j: true })), ...ADS.slice().sort(() => Math.random() - .5).slice(0, 5)]; page = 0; open_ = true; el.classList.add('on'); render(); game.sound?.(data.rec.g.n ? 'trick' : 'coin'); }
  function close() { open_ = false; el.classList.remove('on'); }
  function key(e) { if (!open_) return false; const c = e.code;
    if (c === 'ArrowRight' || c === 'KeyD' || c === 'PageDown') turn(page + 1); else if (c === 'ArrowLeft' || c === 'KeyA' || c === 'PageUp') turn(page - 1);
    else if (c === 'Enter' || c === 'Space') { if (page < 2) turn(page + 1); else { close(); game.map(); } } else if (c === 'KeyR') { close(); game.again(); } else if (c === 'Escape' || c === 'KeyM') { close(); game.map(); }
    e.preventDefault(); return true; }
  const reopen = () => { if (!D) return; D.money = game.money?.() ?? D.money; open_ = true; el.classList.add('on'); render(); };
  return { open, close, reopen, key, get isOpen() { return open_; } };
}
