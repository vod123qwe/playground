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
// Janusz on the phone: each of his sets of lines a deck (none again till all said, not twice running; kept across reloads)
const DK = (() => { try { return JSON.parse(localStorage.getItem('pt.decks2') || '{}'); } catch { return {}; } })();
function deal(key, arr) { let d = DK[key]; if (!Array.isArray(d) || !d.length || d.some(i => i >= arr.length)) { d = arr.map((_, i) => i).sort(() => Math.random() - .5); if (d.length > 1 && d[d.length - 1] === DK['l:' + key]) d.unshift(d.pop()); }
  const i = d.pop(); DK[key] = d; DK['l:' + key] = i; try { localStorage.setItem('pt.decks2', JSON.stringify(DK)); } catch { } return arr[i]; }
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
// what happened on the route, as the town's paper tells it: about the people and the place, the cyclist in it unnamed (the red cap);
// {n} how many times
export const EVENTS = {
  granny: [{ head: 'Emerytka obroniła torebkę', text: 'Przy drodze starsza pani starła się z rowerzystą. Świadkowie twierdzą, że wygrała torebka. Sama zainteresowana mówi, że „za jej czasów młodzież miała szacunek”.' }],
  car: [{ head: 'Potrącenie rowerzysty', text: 'Rano auto zderzyło się z rowerzystą w czerwonej czapce. Kierowca przeprasza, rowerzysta odjechał, zanim ktokolwiek zdążył zapytać o nazwisko.' }, { head: 'Kierowcy, uwaga na rowery!', text: 'Kolejne zderzenie auta z rowerem w okolicy. Mieszkańcy domagają się progów zwalniających. Rada osiedla obiecuje zająć się sprawą po wakacjach.' }],
  police: [{ head: 'Kontrole na osiedlu', text: 'Patrol {n} {razy} zatrzymywał rano rowerzystów. Dyżurny przypomina, że lampka i dzwonek to nie ozdoby, a mandat to nie prezent.' }],
  window: [{ head: 'Szyby lecą, szklarz zaciera ręce', text: 'Na osiedlu stłuczono {n} {szyb}. Poszkodowani widzieli tylko rower i czerwoną czapkę. Szklarz z Lipowej ma kolejkę do przyszłego tygodnia.' }, { head: 'Gazeta przez okno', text: 'Mieszkańcy znaleźli rano prasę w salonie, razem ze szkłem. Sprawą zainteresował się dzielnicowy. Prenumeratę na razie zawieszono.' }],
  dog: [{ head: 'Pies z Akacjowej znów w natarciu', text: 'Czworonóg zza płotu {n} {razy} ruszył rano za rowerem. Właściciel zapewnia, że pies jest łagodny, tylko nie lubi kółek.' }, { head: 'Psy nie śpią od świtu', text: 'Mieszkańcy skarżą się na ujadanie od piątej rano. Według sąsiadów psy reagują na rowery i na listonosza. Na listonosza bardziej.' }],
  gang: [{ head: 'Gang rowerowy znów na ulicach', text: 'Ekipa na rowerach przemknęła rano przez osiedle w pogoni za samotnym rowerzystą. Mieszkańcy zamykali furtki, a psy chowały się do bud.' }],
  chase: [{ head: 'Pościg z kogutem', text: 'Radiowóz na sygnale przemknął przez okolicę. Policja nie zdradza, kogo goniła. Świadkowie mówią o rowerze i czerwonej czapce.' }],
  kick_ped: [{ head: 'Przechodzień pobity przez rowerzystę', text: 'Na chodniku nieznany rowerzysta kopnął przechodnia i odjechał. Poszkodowany zapowiada skargę u dzielnicowego. Policja prosi świadków o kontakt.' }],
  kick_bike: [{ head: 'Kolarz w żywopłocie', text: 'Rowerzysta w kolarskim stroju wylądował {n} {razy} w żywopłocie. Twierdzi, że ktoś go kopnął. Żywopłot ucierpiał najbardziej.' }],
  kick_gangm: [{ head: 'Rowerowy gang rozbity', text: 'Członkowie osiedlowej ekipy wylądowali na asfalcie. Świadkowie mówią o kopniaku jak z filmu i o czerwonej czapce, która zniknęła za zakrętem.' }],
  kick_police: [{ head: 'Kopnięty radiowóz', text: 'Ktoś kopnął w drzwi policyjnego auta i odjechał na rowerze. Dyżurny traktuje sprawę osobiście. Rower podobno ma czerwoną ramę.' }],
  kick_granny: [{ head: 'Starsza pani kopnięta. Wstyd!', text: 'Mieszkańcy są oburzeni. Poszkodowana mówi, że rozpozna sprawcę wszędzie, i że zna jego matkę. Policja szuka rowerzysty w czerwonej czapce.' }],
  kick_car: [{ head: 'Wgniecione drzwi', text: 'Kierowca znalazł na drzwiach auta ślad buta. Sąsiedzi przysięgają, że to nie oni. Ślad ma rozmiar, jak mówi kierowca, „młodzieżowy”.' }],
  kick_dog: [{ head: 'Pies w krzakach', text: 'Czworonóg, który gonił rowery na Akacjowej, sam wylądował w krzakach. Obrońcy zwierząt protestują, listonosz bije brawo.' }],
  kick_mailbox: [{ head: 'Skrzynki pocztowe w opałach', text: 'Ktoś skopał {n} {skrzynek}. Poczta rozkłada ręce, a stolarz ma pełne ręce roboty. Podejrzenia padają na konkurencję gazety. Albo na młodzież.' }],
  goose: [{ head: 'Gęsi kontra rower', text: 'Na drodze przez wieś stado gęsi zatrzymało rowerzystę. Rowerzysta leży, gęsi syczą, a sołtys zapewnia, że to nie jego gęsi.' }, { head: 'Rowerzysta w rowie przez gęsi', text: 'Gęsi przechodziły przez drogę, rowerzysta nie zdążył. Świadkowie mówią, że gęś wyglądała na zadowoloną.' }],
  trick: [{ head: 'Akrobata na skoczni', text: 'Mieszkańcy widzieli rano rowerzystę, który wykręcił w powietrzu {name}. Sąsiadki oklaskiwały spod firanek, dzielnicowy kręcił głową.' }],
  fall: [{ head: 'Asfalt znów wygrał', text: 'Rowerzysta {n} {razy} zaliczył rano asfalt. Kolana w porządku, duma trochę mniej.' }],
  streak: [{ head: 'Seria jak z karabinu', text: 'Seria {n} trafień do skrzynek z rzędu. Takiej serii dawno tu nie było.' }],
  clean: [{ head: 'Spokojny poranek', text: 'Ani jednej stłuczonej szyby, ani jednego wypadku. Rada osiedla mówi, że tak powinno być codziennie.' }] };
const FORMS = { razy: ['raz', 'razy', 'razy'], szyb: ['szybę', 'szyby', 'szyb'], wywrotek: ['wywrotkę', 'wywrotki', 'wywrotek'], skrzynek: ['skrzynkę', 'skrzynki', 'skrzynek'] };
export const eventNews = (kind, n, name = '') => { const t = pickOf(EVENTS[kind]), f = s => s.replace('{n}', n).replace('{name}', String(name).toLowerCase()).replace(/\{(\w+)\}/g, (_, k) => FORMS[k] ? plural(n, ...FORMS[k]) : ''); return { head: f(t.head), text: f(t.text) }; };
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

// the morning's badges: what the run was (each with when it is earned); shown as stamps
export const BADGES = [
  { id: 'szklarz', t: 'SZKLARZ MIESIĄCA', d: 'Połowa szyb na trasie w drzazgach.', on: s => s.winPct >= .5 && s.windows >= 2 },
  { id: 'okno', t: 'GAZETA PRZEZ OKNO', d: 'Stłuczone szyby: {windows}.', on: s => s.windows >= 1 && s.winPct < .5 },
  { id: 'skrzynki', t: 'POSTRACH SKRZYNEK', d: 'Skopane skrzynki pocztowe: {mailbox}.', on: s => s.mailbox >= 2 },
  { id: 'sierpowy', t: 'SIERPOWY Z SIODEŁKA', d: 'Pobici przechodnie: {ped}.', on: s => s.ped >= 2 },
  { id: 'kolarze', t: 'POGROMCA KOLARZY', d: 'Zrzuceni z rowerów: {bikes}.', on: s => s.bikes >= 2 },
  { id: 'gang', t: 'GANG NA KARKU', d: 'Uszedł z życiem przed rowerową ekipą.', on: s => s.gang >= 1 },
  { id: 'pirat', t: 'PIRAT DROGOWY', d: 'Prędkość: {kmh} km/h.', on: s => s.kmh >= 32 },
  { id: 'snajper', t: 'SNAJPER', d: 'Seria {streak} trafień bez pudła.', on: s => s.streak >= 8 },
  { id: 'akrobata', t: 'AKROBATA', d: 'Triki w powietrzu: {tricks}.', on: s => s.tricks >= 2 },
  { id: 'hycel', t: 'HYCEL', d: 'Psy odesłane w krzaki: {dog}.', on: s => s.dog >= 1 },
  { id: 'wstyd', t: 'WSTYD NA DZIELNICĘ', d: 'Kopnięta babcia. Mama już wie.', on: s => s.granny >= 1 },
  { id: 'czysto', t: 'CZYSTA ROBOTA', d: 'Bez wywrotki, bez szyby, gazety na czas.', on: s => !s.falls && !s.windows && s.goalPapers } ];
export const badgesOf = st => BADGES.filter(b => b.on(st)).map(b => ({ ...b, d: b.d.replace(/\{(\w+)\}/g, (_, k) => st[k] ?? '') }));
// the corners at the paper's end: two of them each issue, some about your morning
const SIGNS = ['BARAN', 'BYK', 'BLIŹNIĘTA', 'RAK', 'LEW', 'PANNA', 'WAGA', 'SKORPION', 'STRZELEC', 'KOZIOROŻEC', 'WODNIK', 'RYBY'];
const HORO = ['Gwiazdy radzą: hamuj tylnym. Przednim tylko w ostateczności.', 'Dzień sprzyja nowym znajomościom. Zwłaszcza z psami.', 'Uważaj na zakręty i na sąsiadkę z zeszytem.', 'Pieniądze przyjdą, ale wydasz je u Janusza.', 'Skrzynka, która dziś milczy, jutro przemówi.', 'Szczęśliwy kolor: lakier miętowy. Szczęśliwa liczba: trzydzieści gazet.', 'Ktoś bliski powie ci coś ważnego. Słuchaj, ale nie zwalniaj.'];
export function corners(D) { const r = D.r, out = [], ev = D.counts || {};
  out.push(() => ({ k: 'HOROSKOP GAZECIARZA', h: `<p><b>${pickOf(SIGNS)}.</b> ${pickOf(HORO)}</p><p><b>${pickOf(SIGNS)}.</b> ${pickOf(HORO)}</p>` }));
  out.push(() => ({ k: 'LISTY DO REDAKCJI', h: r.windows ? `<p>„Szanowna redakcjo, gazeta przyszła razem z moim oknem. Proszę o dostarczanie bez szyby.”</p><p class="sig">Oburzona z drugiego piętra</p>` : r.falls >= 2 ? `<p>„Widziałam, jak chłopak od gazet znów leżał na asfalcie. Czy ktoś mu wreszcie kupi kask?”</p><p class="sig">Zaniepokojona sąsiadka</p>` : `<p>„Gazeta była sucha, prosto w skrzynce. Dziękuję i pozdrawiam chłopaka na rowerze.”</p><p class="sig">Stała czytelniczka</p>` }));
  out.push(() => ({ k: 'KRONIKA POLICYJNA', h: (ev.police || ev.kick_police || ev.chase || ev.kick_ped || ev.gang) ? `<p>${[ev.police && `Patrol kontrolował rowerzystę ${ev.police} ${plural(ev.police, 'raz', 'razy', 'razy')}.`, ev.chase && 'Rano radiowóz jechał na sygnale przez osiedle.', ev.kick_ped && 'Zgłoszono pobicie przechodnia przez rowerzystę.', ev.kick_police && 'Uszkodzono drzwi radiowozu. Sprawca odjechał na rowerze.', ev.gang && 'Interweniowano wobec grupy rowerzystów zakłócającej spokój.'].filter(Boolean).join(' ')} Dyżurny prosi o kontakt świadków.</p>` : '<p>Spokojna noc. Dyżurny rozwiązał krzyżówkę i wypił trzy herbaty. Jedno zgłoszenie: kot na drzewie. Kot zszedł sam.</p>' }));
  out.push(() => ({ k: 'PLOTKI ZZA PŁOTU', h: `<p>${pickOf(['Podobno pan z przyczepy wygrał w totka i dalej mieszka w przyczepie.', 'Mówi się, że Janusz ma w warsztacie rower z czasów wojny. I że jeździ.', 'Na działkach ktoś hoduje dynię na wystawę. Ochrania ją pies i dwie gęsi.', 'Kierownik budowy przyszedł wczoraj do pracy. Pierwszy raz w tym miesiącu.', 'Sąsiadka z zeszytem zaczęła prowadzić drugi zeszyt. O sąsiadach.'])}</p>` }));
  out.push(() => ({ k: 'PRZEPIS BABCI', h: `<p><b>${pickOf(['Szarlotka na drogę', 'Kanapka gazeciarza', 'Kompot z działki'])}.</b> ${pickOf(['Jabłka, mąka, masło i cierpliwość. Piec, aż sąsiedzi zaczną pytać.', 'Chleb, masło, ser, pomidor. Zjeść przed pierwszą skrzynką, nie po.', 'Owoce z działki, woda, cukier na oko. Pić zimny po trasie.'])}</p>` }));
  return out.sort(() => Math.random() - .5).slice(0, 2).map(f => f()); }
// the phone to Janusz: what he says (his tip for tomorrow from the ads, a coupon, a story)
export const CALL = {
  // he picks up (sometimes not knowing he did: still at whoever is in the shop)
  hello: ['Warsztat, słucham! A, to ty, młody. Czytałem o tobie w gazecie. Zdjęcie słabe, ale rower poznałem.', 'Janusz przy telefonie. Mów szybko, mam dętkę w kleju i klej na palcach.', 'Halo? Warsztat u Janusza, mistrza regionu z osiemdziesiątego którego tam roku. Słucham.',
    'No słucham, słucham. Tylko głośno, bo mi kompresor chodzi. MIETEK, WYŁĄCZ TO! Dobra, mów.', 'Warsztat! Jak ktoś znowu w sprawie tego składaka z wczoraj, to on się sam rozkręcił, ja tylko patrzyłem.', 'O, młody! Akurat o tobie myślałem. To znaczy o twoich oponach. Ale o tobie też.'],
  unaware: ['...MIETEK, PODAJ MI SZESNASTKĘ. NIE TĘ, TĘ DRUGĄ. NO TĘ ZE ŚLADAMI ZĘBÓW... A? Halo? To ktoś dzwoni? Mów, młody, mów.', '...i wtedy mówię mu: panie, ja na tym rowerze zjechałem z Kasprowego, bez hamulców, z ciastem na kierownicy... Halo? Długo tam wisisz?',
    '...nie, proszę pani, dzwonek nie dzwoni, bo jest do ozdoby. Co? A, to telefon dzwoni. Halo! Warsztat!', '...osiem, dziewięć, dziesięć... szprych mi brakuje, Mietek. Kto liczył szprychy? Halo? Młody? Ty mi nie liczyłeś szprych?'],
  // what he says when asked how he is: a rant, a boast
  how: ['Dobrze. Wczoraj ktoś mi powiedział na ulicy kochaniutki. Takim głosem, że mi się szprychy powyginały. Nieważne.', 'Jak ja się mam? Jakbyś spotkał po latach kogoś, komu kiedyś sprowadzałeś części. Znaczy, ona tobie. Nieważne, dobrze się mam.', 'Jak ja się mam? Jak łańcuch po zimie: zgrzytam, ale jadę. Wczoraj zrobiłem sto kilometrów przed śniadaniem. No, może dziesięć. Ale pod wiatr.', 'Dobrze, tylko kolano mi skrzypi. Lekarz mówi: panie Januszu, mniej roweru. Ja mu na to: panie doktorze, mniej doktora.',
    'Kiedyś to były rowery. Stal, chłopie. Spadłeś, rower cały, ty w gipsie. A teraz? Wszystko plastik. I ludzie z plastiku.', 'Nie ma złej pogody, młody, są tylko słabe opony. I słabi kolarze. Ale ty nie jesteś słaby. Jeszcze.',
    'Świetnie! Ubrałem dziś nowe obcisłe spodenki. Sąsiad mówi, że wyglądam jak parówka. Aerodynamiczna parówka, mówię mu.'],
  tip: p => p ? deal('tip', [`Na jutro? Weź ${p.toLowerCase()}. Mówię ci, różnica jak między składakiem a kolarzówką.`, `${p}. Bez tego nawet nie wyjeżdżaj. Ja bez tego nie wyjeżdżałem nawet do kiosku.`, `Słuchaj starego: ${p.toLowerCase()}. Zawodowcy tak robią. Ja tak robiłem. Ja byłem zawodowcem. Prawie.`])
    : deal('tipNone', ['Masz już wszystko, co trzeba. Teraz tylko nogi i głowa. Z głową może być gorzej.', 'Rower masz jak z katalogu. Teraz tylko trenuj. Pięćset przysiadów i surowe jajko. Tak robiłem przed każdym wyścigiem.']),
  coupon: c => deal('coupon', [`Dobra, dla stałego klienta: ${c.name.toLowerCase()} taniej o ${Math.round(c.pct * 100)} procent. Kupon czeka w warsztacie, tylko nie mów nikomu.`, `Masz szczęście, dziś mam gest. ${c.name} o ${Math.round(c.pct * 100)} procent taniej. Mietek, zapisz! Mietek nie zapisał. Ja zapamiętam.`,
    `Wiesz co, za tę gazetę o tobie dam ci rabat. ${Math.round(c.pct * 100)} procent na ${c.name.toLowerCase()}. Ale jak mnie opiszesz w wywiadzie, to piszesz, że jestem wysoki.`]),
  couponHad: ['Kupon już masz, młody. Jeden na raz, bo zbankrutuję.', 'Drugi kupon? Ja nie jestem bank, ja jestem warsztat. Najpierw wykorzystaj pierwszy.', 'Mietek mówi, że już masz kupon. Mietek nic nie zapisuje, ale to akurat pamięta.'],
  // his stories: every one true, he says
  story: ['Miałem kiedyś dziewczynę, która załatwiała części zza granicy. Takie, że nikt w mieście nie miał. Mówiła, że niekradzione. Wierzyłem jej. Wierzyłem jej we wszystko. No, ale to było dawno.', 'Raz goniłem pociąg na rowerze. Dogoniłem. Maszynista zatrzymał się i pyta, czy chcę podwózkę. Odmówiłem. Wygrałem z nim do następnej stacji.', 'W osiemdziesiątym którymś jechałem w wielkim wyścigu. Prowadziłem przez trzy etapy. Potem mi mama kazała wracać na obiad.',
    'Kiedyś przejechałem całe miasto na jednym kole. Drugie koło miał Mietek. Do dziś nie wiem, po co mu było.', 'Znam faceta, który zjechał rowerem po schodach w wieżowcu. Z dziesiątego piętra. To byłem ja. Ale mówię, że znam faceta, bo skromny jestem.',
    'Mój pierwszy rower zrobiłem sam. Z łóżka. Babcia spała wtedy na podłodze, ale mówiła, że warto było.', 'Raz mnie wyprzedził kolarz w obcisłym stroju. Na podjeździe. Dogoniłem go na zjeździe i powiedziałem, że ma rozwiązane sznurowadło. Nie miał sznurówek. Do dziś jest w szoku.',
    'Mam w garażu rower, na którym jeździł prezes jakiegoś klubu. Albo jego listonosz. W każdym razie ktoś ważny.', 'Raz trenowałem tak ostro, że opony się stopiły. Jechałem dalej na obręczach. Iskry było widać z kosmosu, tak mówili w telewizji. W lokalnej.'],
  // the call ends; sometimes he does not hang up, and you hear on
  bye: ['No, to jedź. I nie hamuj przodem!', 'Trzymaj się. I oddaj mi kiedyś tę pompkę.', 'Do usłyszenia. Wpadaj, jak coś zgrzytnie.', 'Lecę, bo mi się klej zsycha. I Mietek coś przypala. MIETEK!'],
  hangOn: ['(słuchawka leży obok, słychać dalej) ...i mówię ci, Mietek, ten młody to ma talent. Po mnie ma. Nie, nie jesteśmy rodziną. Ale po mnie.', '(nie odłożył słuchawki) ...gdzie jest moja koszulka ze Szczyrku? Ta z dziurą na łokciu. To jest koszulka zwycięzcy, Mietek, nie szmata!',
    '(słychać szuranie) ...dobra, kto zjadł mój pączek? Mietek? Ja widzę cukier puder na twoim wąsie. Ja widzę wszystko. Jak kolarz.', '(dalej gada do kogoś) ...nie, proszę pani, ten rower nie jest na sprzedaż. Wszystko jest na sprzedaż, ale ten nie. No dobra, ile pani da?'] };

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
    #paper .pile { position: relative; width: min(80vw, 1120px); height: min(calc(100vh - 104px), 820px); margin-bottom: 56px; transform: rotate(-1deg); animation: pp-in .42s steps(5) both; }
    @keyframes pp-in { from { transform: translateY(115%) rotate(-10deg); } }
    #paper .under, #paper .sheet { position: absolute; inset: 0; clip-path: polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 4px, calc(100% - 4px) 4px, calc(100% - 4px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 4px) calc(100% - 8px), calc(100% - 4px) calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 0 calc(100% - 8px), 0 8px, 4px 8px, 4px 4px, 8px 4px); }
    #paper .under { background: #17181b; } #paper .under i { position: absolute; inset: 4px; background: #cfc4a6; clip-path: inherit; }
    #paper .u1 { transform: translate(8px, 10px) rotate(1.4deg); } #paper .u2 { transform: translate(15px, 17px) rotate(2.4deg); } #paper .u2 i { background: #bfb393; }
    #paper .sheet { background: #17181b; transform-origin: 100% 100%; } #paper .sheet.nxt { display: none; } #paper .sheet.nxt.on { display: block; }
    #paper .face { position: absolute; inset: 4px; clip-path: inherit; background-color: #ece3cc; background-image: var(--pp-grain); background-size: 64px 64px; padding: 14px 20px 10px; display: flex; flex-direction: column; overflow: hidden; }
    #paper .face:after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 6px; margin-top: -3px; pointer-events: none; background: linear-gradient(rgba(0,0,0,.07), rgba(0,0,0,.02) 40%, rgba(255,255,255,.25) 50%, rgba(0,0,0,.03) 60%, transparent); }   /* the fold */
    /* the turn: few frames (as the game moves), the page off by its corner; back: it lands */
    #paper .sheet.fly { animation: pp-fly .5s steps(5) forwards; } #paper .sheet.land { animation: pp-land .5s steps(5) both; }
    @keyframes pp-fly { 0% { transform: none; } 25% { transform: translate(-3%, -5%) rotate(-3deg) skewX(4deg); } 100% { transform: translate(-125%, -22%) rotate(-26deg) skewX(10deg); } }
    @keyframes pp-land { 0% { transform: translate(-125%, -22%) rotate(-26deg) skewX(10deg); } 75% { transform: translate(-3%, -5%) rotate(-3deg) skewX(4deg); } 100% { transform: none; } }
    /* the corners: a dog-ear to lift the page by */
    #paper .ear { position: absolute; bottom: 0; width: 48px; height: 48px; cursor: pointer; z-index: 3; }
    #paper .ear.r { right: 0; } #paper .ear.l { left: 0; transform: scaleX(-1); }
    #paper .ear i { position: absolute; inset: 0; background: #17181b; clip-path: polygon(100% 0, 100% 100%, 0 100%, 0 calc(100% - 4px), 4px calc(100% - 4px), 4px calc(100% - 8px), 8px calc(100% - 8px), 8px calc(100% - 12px), 12px calc(100% - 12px), 12px calc(100% - 16px), 16px calc(100% - 16px), 16px calc(100% - 20px), 20px calc(100% - 20px), 20px calc(100% - 24px), 24px calc(100% - 24px), 24px calc(100% - 28px), 28px calc(100% - 28px), 28px calc(100% - 32px), 32px calc(100% - 32px), 32px calc(100% - 36px), 36px calc(100% - 36px), 36px calc(100% - 40px), 40px calc(100% - 40px), 40px calc(100% - 44px), 44px calc(100% - 44px), 44px 0); }
    #paper .ear i:after { content: ''; position: absolute; inset: 4px 0 0 4px; background: linear-gradient(135deg, #f6efdc 0 46%, #c9bc9a 47% 100%); clip-path: inherit; }
    #paper .ear { transition: none; } #paper .ear:hover { width: 60px; height: 60px; } #paper .ear:hover i:after { background: linear-gradient(135deg, #fff8e6 0 46%, #d8a02a 47% 100%); }
    #paper .ear.r:before { content: '▸'; position: absolute; right: 54px; bottom: 6px; color: #8e2e25; animation: pp-hint 1s steps(2) infinite; } #paper .ear.l:before { content: '▸'; position: absolute; right: 54px; bottom: 6px; color: #8e2e25; transform: scaleX(-1); }
    @keyframes pp-hint { 50% { transform: translateX(-4px); } }
    /* the masthead (page 1), the slim head (the rest), the foot */
    #paper .mast { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; }
    #paper .crest { width: 56px; height: 63px; } #paper .title { font-size: 48px; line-height: 1.2; text-shadow: 6px 0 0 #2b2723; letter-spacing: 5px; white-space: nowrap; min-width: 0; overflow: hidden; }
    #paper .index { border: 4px solid #2b2723; background: #d8cfb6; padding: 3px 8px; display: grid; gap: 1px; } #paper .index a, #paper .idx a { cursor: pointer; color: #4a4540; } #paper .index a:hover, #paper .index a.on, #paper .idx a.on, #paper .idx a:hover { color: #b8483a; } #paper .index a.on:before { content: '▸ '; }
    #paper .rule { display: flex; justify-content: space-between; gap: 4px 12px; border-top: 4px solid #b8483a; border-bottom: 2px solid #2b2723; padding: 3px 0 2px; margin: 6px 0 10px; color: #4a4540; flex-wrap: wrap; }
    #paper .slim { display: flex; align-items: center; gap: 12px; border-bottom: 4px solid #b8483a; padding-bottom: 6px; margin-bottom: 10px; } #paper .slim .crest { width: 28px; height: 32px; } #paper .slim b { font-weight: normal; font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; white-space: nowrap; }
    #paper .slim span { color: #8e2e25; } #paper .slim .idx { margin-left: auto; display: flex; gap: 6px; } #paper .slim .idx a { border: 2px solid #2b2723; padding: 0 5px; } #paper .slim .idx a.on { background: #2b2723; color: #ece3cc; }
    #paper .foot { display: flex; justify-content: center; gap: 18px; border-top: 2px solid #2b2723; padding-top: 4px; margin-top: 6px; color: #6a645c; }
    /* the columns */
    #paper .body { flex: 1 1 0; min-height: 0; columns: var(--cols); column-gap: 18px; column-rule: 2px solid #2b2723; column-fill: auto; overflow: hidden; }
    #paper .face { line-height: 20px; }
    #paper .blk { break-inside: avoid; margin: 0 0 10px; padding-top: 10px; border-top: 2px solid #2b2723; } #paper .blk.txt { break-inside: auto; border-top: 0; padding-top: 0; } #paper .blk.quote { border-top: 0; padding-top: 0; }
    #paper .blk.span { column-span: all; margin-bottom: 12px; border-top: 0; padding: 0 0 8px; border-bottom: 2px solid #2b2723; } #paper .blk.span + .blk { border-top: 0; padding-top: 0; }
    #paper .kick { color: #b8483a; letter-spacing: 2px; margin: 0 0 4px; } #paper .kick:before { content: ''; display: inline-block; width: 8px; height: 8px; background: #b8483a; margin-right: 6px; vertical-align: 1px; }
    #paper .deck { color: #4a4540; margin: 6px 0 2px; } #paper .by { color: #8a8278; letter-spacing: 1px; margin: 0; }
    #paper .blk p + p { text-indent: 16px; margin-top: 0; } #paper .blk p { margin: 0 0 4px; } #paper .blk p.cap, #paper .blk p.sig, #paper .blk p.q, #paper .blk p.a, #paper .blk p.li, #paper .blk p.who, #paper .blk p.kick, #paper .blk p.deck, #paper .blk p.by, #paper .blk p.opts, #paper .blk p.more { text-indent: 0; }
    #paper .sig { color: #6a645c; text-align: right; } #paper .sig:before { content: '- '; }
    #paper blockquote { margin: 6px 0 8px; padding: 6px 0 6px 28px; position: relative; font-size: 24px; line-height: 26px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 1px; border-top: 2px solid #b8483a; border-bottom: 2px solid #b8483a; clear: both; }
    #paper blockquote:before { content: '„'; position: absolute; left: 0; top: 2px; font-size: 48px; line-height: 40px; color: #b8483a; text-shadow: 6px 0 0 #b8483a; }
    #paper .li { padding-left: 14px; text-indent: -14px !important; } #paper .li:before { content: '▪ '; color: #b8483a; }
    #paper .heard { overflow: hidden; margin-bottom: 6px; } #paper .heard p { margin: 0; } #paper .pt.xs { width: 40px; height: 40px; border-width: 2px; margin-right: 8px; }
    #paper .pt.big { width: 112px; height: 112px; float: none; margin: 0; }
    #paper .stamps { display: flex; flex-wrap: wrap; gap: 10px; padding: 4px 2px; } #paper .stamp { border: 4px double #b8483a; color: #b8483a; padding: 4px 8px; transform: rotate(var(--r)); background: rgba(184,72,58,.06); max-width: 100%; }
    #paper .stamp b { display: block; font-weight: normal; letter-spacing: 2px; } #paper .stamp span { color: #6a3a30; }
    #paper .jad { overflow: hidden; } #paper .jad .jt { display: block; font-weight: normal; font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; } #paper .jad .js { color: #6a645c; } #paper .jad .jc { color: #8e2e25; margin: 6px 0; clear: both; }
    #paper .ad.job { background: #efe2c4; } #paper .ad.job .pt.xs { float: right; margin: 0 0 4px 8px; } #paper .ad .js { color: #6a645c; margin: 4px 0; } #paper .notes { margin-top: 12px; }
    #paper .corner p { margin-bottom: 4px; } #paper .nx { margin-bottom: 10px; } #paper .nx .cap { margin-top: 4px; }
    /* the last page: side by side, the new day on the right */
    #paper .blk.full { height: 100%; border-bottom: 0; padding: 0; margin: 0; } #paper .jt { display: grid; gap: 16px; height: 100%; } #paper .jt.three { grid-template-columns: 1fr 1.05fr 1.15fr; } #paper .jt.two { grid-template-columns: 1fr 1.1fr; }
    #paper .jt > div { min-height: 0; overflow: hidden; } #paper .jt-deal, #paper .jt-tab { border-right: 2px solid #2b2723; padding-right: 14px; } #paper .jt .big { font-weight: normal; font-size: 32px; text-shadow: 4px 0 0 #2b2723; }
    #paper .mod, #paper .pick { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 18px 1fr auto; gap: 2px 8px; width: 100%; padding: 6px 8px; margin: 6px 0 0; border: 2px solid #2b2723; background: #e6dcc2; }
    #paper .mod i { width: 14px; height: 14px; border: 2px solid #2b2723; background: #f2ece0; margin-top: 2px; } #paper .mod.on i { background: #b8483a; box-shadow: inset 0 0 0 2px #f2ece0; } #paper .mod b, #paper .pick b { font-weight: normal; } #paper .mod em { font-style: normal; color: #8e2e25; }
    #paper .mod span { grid-column: 2 / -1; color: #6a645c; } #paper .mod.on { background: #f0d9c8; border-color: #8e2e25; } #paper .mod:hover, #paper .pick:hover { background: #f2e6c0; }
    #paper .sum { margin-top: 8px; color: #8e2e25; } #paper .sum b { font-weight: normal; font-size: 24px; text-shadow: 3px 0 0 #8e2e25; }
    #paper .jt-cta { background: #e9d9a8; border: 4px solid #2b2723; padding: 10px 12px; display: flex; flex-direction: column; box-shadow: 6px 6px 0 rgba(43,39,35,.25); }
    #paper .jt-cta h2 { margin-bottom: 4px; } #paper .pick { grid-template-columns: 1fr; background: #f2ece0; } #paper .pick span { color: #6a645c; } #paper .pick.on { background: #2b2723; color: #efc970; } #paper .pick.on span { color: #d8cfb6; }
    #paper .rws { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 2px; } #paper .rw { color: #8e2e25; } #paper .pick.on .rw { color: #efc970; } #paper .rw.had { text-decoration: line-through; opacity: .6; }
    #paper .jt-cta .go { margin: auto 0 8px; padding-top: 10px; } #paper .jt-cta .go .pxk { width: 100%; white-space: normal; } #paper .jt-cta .keys2 .pxk { flex: 1; } #paper .wallet { margin: 6px 0 0; color: #4a4540; }
    /* the phone call over the paper */
    #paper .call { position: absolute; inset: 0; z-index: 4; display: none; place-items: center; background-color: rgba(10,11,13,.55); background-image: linear-gradient(45deg, rgba(10,11,13,.5) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.5) 75%), linear-gradient(45deg, rgba(10,11,13,.5) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.5) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #paper .call.on { display: grid; } #paper .phone { width: min(520px, 86vw); border: 12px solid transparent; border-image: var(--px-win) 4 fill / 12px; color: #f6f3ea; animation: pp-ring .5s steps(4) both; } @keyframes pp-ring { 0% { transform: translateY(40px) rotate(-3deg); } 50% { transform: rotate(2deg); } }
    #paper .ph-h { display: flex; gap: 10px; align-items: center; padding: 2px 4px 8px; background: linear-gradient(#efc970, #efc970) left bottom / 100% 4px no-repeat; margin-bottom: 10px; } #paper .ph-h .ic { width: 18px; height: 18px; background: #efc970; -webkit-mask: var(--ic) 0 0 / 18px 18px no-repeat; mask: var(--ic) 0 0 / 18px 18px no-repeat; }
    #paper .ph-h b { font-weight: normal; color: #efc970; font-size: 24px; } #paper .ph-h span { margin-left: auto; color: #a9a69b; } #paper .ph-b { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
    #paper .ring { color: #efc970; margin: 0 0 6px; animation: pp-hint .3s steps(2) infinite; } #paper .phone .say { min-height: 80px; margin: 0; } #paper .phone .opts { display: grid; gap: 4px; margin-top: 12px; } #paper .phone .opts .pxk { justify-content: flex-start; }
    #paper h2, #paper h3, #paper h4 { margin: 0; font-weight: normal; line-height: 1.05; } #paper h2 { font-size: 32px; text-shadow: 4px 0 0 #2b2723; letter-spacing: 3px; } #paper h3 { font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; margin-bottom: 6px; } #paper h4 { color: #8e2e25; margin-bottom: 4px; }
    #paper p { margin: 0 0 6px; } #paper .lede:first-letter { font-size: 48px; float: left; line-height: .9; margin: 2px 6px 0 0; text-shadow: 5px 0 0 #2b2723; }
    #paper .ph { display: block; width: 100%; aspect-ratio: 4 / 3; height: auto; border: 4px solid #2b2723; background: #9a968c; object-fit: cover; filter: sepia(.18) contrast(1.04); margin-bottom: 4px; }
    #paper .cap { color: #6a645c; } #paper .opts { color: #8e2e25; }
    #paper .pt { width: 64px; height: 64px; border: 4px solid #2b2723; display: block; float: left; margin: 2px 10px 4px 0; } #paper .who { color: #6a645c; } #paper .who b { font-weight: normal; color: #2b2723; }
    #paper .iv .q { color: #8e2e25; margin: 0 0 2px; } #paper .iv .q:before, #paper .iv .a:before { content: '- '; } #paper .iv:after { content: ''; display: block; clear: both; }
    #paper .brief { border-top: 4px solid #2b2723; padding-top: 6px; } #paper .brief p { padding-left: 12px; text-indent: -12px; margin-bottom: 4px; } #paper .brief p:before { content: '▪ '; color: #8e2e25; }
    #paper .box { background: #e9d9a8; border: 4px solid #2b2723; padding: 6px 8px; cursor: pointer; } #paper .box:hover { background: #f0e2b4; }
    #paper .box h3 { color: #8e2e25; text-shadow: 3px 0 0 #8e2e25; border-bottom: 4px solid #b8483a; padding-bottom: 4px; } #paper .kvs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin-bottom: 6px; }
    #paper .kv { display: grid; grid-template-columns: 22px 1fr; gap: 0 6px; align-items: center; } #paper .kv canvas { width: 20px; height: 20px; grid-row: span 2; } #paper .kv b { font-weight: normal; line-height: 1; } #paper .kv small { color: #6a645c; font-size: 16px; }
    #paper canvas.mini { aspect-ratio: 16 / 9; } #paper canvas.mini, #paper canvas.big { display: block; width: 100%; border: 2px solid #2b2723; background: #cfd8a8; } #paper canvas.big { border-width: 4px; aspect-ratio: 4 / 3; } #paper .more { color: #8e2e25; text-align: right; margin: 4px 0 0; }
    #paper .stars { display: inline-flex; gap: 4px; vertical-align: middle; } #paper .stars i { width: 18px; height: 18px; background: #b9b09a; clip-path: polygon(40% 0, 60% 0, 60% 30%, 100% 30%, 100% 50%, 80% 60%, 90% 100%, 70% 100%, 50% 80%, 30% 100%, 10% 100%, 20% 60%, 0 50%, 0 30%, 40% 30%); } #paper .stars i.on { background: #d8a02a; }
    #paper .legend { display: flex; flex-wrap: wrap; gap: 2px 12px; margin-top: 6px; color: #4a4540; } #paper .legend span:before { content: ''; display: inline-block; width: 10px; height: 10px; margin-right: 6px; background: var(--c); border: 2px solid #2b2723; vertical-align: -1px; }
    #paper table { width: 100%; border-collapse: collapse; } #paper td, #paper th { padding: 2px 4px; text-align: right; font-weight: normal; } #paper td:first-child, #paper th:first-child { text-align: left; } #paper th { color: #6a645c; border-bottom: 2px solid #2b2723; } #paper tr + tr td { border-top: 1px solid #c9bfa4; } #paper .rec { color: #b8483a; }
    #paper .goal { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; align-items: center; margin-bottom: 4px; } #paper .goal .stars i { width: 16px; height: 16px; }
    #paper .ad { border: 2px solid #2b2723; padding: 6px 8px; background: #e6dcc2; } #paper .ad b { font-weight: normal; display: block; font-size: 24px; line-height: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; margin-bottom: 4px; } #paper .jad .jt { line-height: 24px; } #paper .ad.j { background: #f2e6c0; border-width: 4px; } #paper .ad .pr { color: #8e2e25; }
    #paper .next .pxk { margin: 2px 0 4px; } #paper .keys2 { display: flex; gap: 8px; flex-wrap: wrap; }
    /* the keys under the paper */
    #paper .bar { position: fixed; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; gap: 10px; align-items: flex-end; z-index: 2; }
    @media (max-width: 980px) { #paper .bar { gap: 6px; } #paper .bar .pxk span { display: none; } #paper .bar .pxk.gold span { display: inline; } }
    @media (max-width: 760px) { #paper .pile { width: 86vw; } #paper .title { font-size: 32px; text-shadow: 4px 0 0 #2b2723; letter-spacing: 3px; } #paper .crest { width: 40px; height: 45px; } #paper .face { padding: 10px 12px 8px; } #paper .bar { gap: 6px; } #paper .bar .pxk span { display: none; } #paper .bar .pxk.gold span { display: inline; } }
    @media (max-width: 560px) { #paper .index { display: none; } #paper .title { font-size: 24px; text-shadow: 3px 0 0 #2b2723; letter-spacing: 2px; } #paper .slim b { font-size: 16px; } }
`;
  document.head.appendChild(css);
  // the paper's grain: a few specks on the cream
  { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); for (let k = 0; k < 70; k++) { g.fillStyle = Math.random() < .5 ? 'rgba(90,70,40,.08)' : 'rgba(255,255,255,.18)'; g.fillRect(Math.random() * 32 | 0, Math.random() * 32 | 0, 1, 1); } document.documentElement.style.setProperty('--pp-grain', `url(${c.toDataURL()})`); }
  const el = document.createElement('div'); el.id = 'paper'; el.innerHTML = '<div class="pile"><div class="under u2"><i></i></div><div class="under u1"><i></i></div><div class="sheet nxt"><div class="face"></div></div><div class="sheet top"><div class="face"></div></div></div><div class="bar"></div>';
  document.body.appendChild(el);
  const sh = q => { const e = el.querySelector(q); return { el: e, face: e.querySelector('.face') }; }, A = sh('.sheet.top'), Bs = sh('.sheet.nxt'), bar = el.querySelector('.bar');   // (A: the page on top; Bs: the one under it while turning)
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

  // ---------- the pages: blocks poured into columns, a page full (the columns would run off its side) → the next page; never a scroll ----------
  const DATA = new Map(), url = c => { if (!c) return ''; if (!DATA.has(c)) DATA.set(c, c.toDataURL()); return DATA.get(c); };
  const pic = (c, cap) => `<img class="ph" src="${url(c)}" alt="">${cap ? `<p class="cap">${cap}</p>` : ''}`;
  const SEC = ['PORANEK', 'TWOJA TRASA', 'OGŁOSZENIA', 'JUTRO'];
  function head(p) { const d = new Date(), P = pages[p];
    if (P.first) return `<div class="mast"><canvas class="crest" width="16" height="18"></canvas><div class="title">WIEŚCI ZZA PŁOTU</div>
      <div class="index">${SEC.map((t, k) => `<a data-sec="${k}" class="${k === P.sec ? 'on' : ''}">${k + 1} ${t}</a>`).join('')}</div></div>
      <div class="rule"><span>NR ${D.issue}</span><span>${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</span><span>${D.region} · ${D.L.name}</span><span>CENA: 1 ZŁ</span></div>`;
    return `<div class="slim"><canvas class="crest" width="16" height="18"></canvas><b>WIEŚCI ZZA PŁOTU</b><span>${SEC[P.sec]}</span><span class="idx">${SEC.map((t, k) => `<a data-sec="${k}" class="${k === P.sec ? 'on' : ''}">${k + 1}</a>`).join('')}</span></div>`; }
  function story() { const { L, r, rec } = D, n = r.delivered, sub = D.route.subs, miss = Math.max(0, sub - n);
    const a = [`Dziś rano trasą ${L.name.toLowerCase()} przejechał nasz gazeciarz.`];
    a.push(n ? `Do skrzynek trafiło ${n} ${plural(n, 'gazeta', 'gazety', 'gazet')}${sub ? ` na ${sub} ${plural(sub, 'prenumeratora', 'prenumeratorów', 'prenumeratorów')} po drodze` : ''}.` : 'Skrzynki zostały dziś puste. Sąsiedzi pytają, co się stało.');
    if (r.thrown) a.push(`Celność: ${Math.round(r.acc * 100)} procent${r.acc >= .8 ? ', jak u snajpera' : r.acc < .4 ? ', trawniki mają co czytać' : ''}.`);
    a.push(r.falls ? `Nie obyło się bez upadków: ${r.falls} ${plural(r.falls, 'wywrotka', 'wywrotki', 'wywrotek')}.` : 'Ani razu nie zaliczył asfaltu.');
    if (r.windows) a.push(`Szyb stłuczonych: ${r.windows}. Szklarz zaciera ręce.`);
    if (miss && n) a.push(`${miss} ${plural(miss, 'dom czeka', 'domy czekają', 'domów czeka')} na gazetę do jutra.`);
    a.push(rec.first ? `Czas na mecie: ${mmss(r.time)}.` : rec.beat.time ? `Czas ${mmss(r.time)} to nowy rekord tej trasy.` : `Czas ${mmss(r.time)}, rekord to wciąż ${mmss(rec.best.time)}.`);
    return a.join(' '); }
  const portrait = (c, cls = 'pt') => c ? `<img class="${cls}" src="${url(c)}" alt="">` : '';
  // the sections' blocks, in their order. The type: a kicker (the red label over a story), the headline, a deck under it (grey), the
  // byline; paragraphs indented, not spaced; captions FOT.; rules between stories
  const KICK = { granny: 'KRONIKA', car: 'Z DROGI', police: 'KRONIKA POLICYJNA', window: 'Z OSIEDLA', dog: 'Z OSIEDLA', fall: 'Z TRASY', gang: 'KRONIKA', chase: 'KRONIKA POLICYJNA', kick_ped: 'KRONIKA', kick_bike: 'Z DROGI', kick_gangm: 'KRONIKA', kick_police: 'KRONIKA POLICYJNA', kick_granny: 'SKANDAL', kick_car: 'Z DROGI', kick_dog: 'Z OSIEDLA', kick_mailbox: 'Z OSIEDLA', goose: 'Z GMINY', trick: 'SPORT', streak: 'SPORT', clean: 'Z TRASY' };
  const BYS = ['R. KOWAL', 'M. WRÓBEL', 'J. SIKORA', 'A. DZIĘCIOŁ'];
  function blocks(sec) { const { L, r, rec } = D, nw = D.photos.news, tz = D.tease, out = [], B = (h, cls = '') => out.push(`<div class="blk ${cls}">${h}</div>`), by = pickOf(BYS);
    // the front: the town's stories (the lead the freshest of them, the police's first when there is one); what happened on the
    // streets (the cyclist unnamed); the interview; what was heard; tomorrow. The paperboy's own numbers are inside (Twoja trasa)
    if (sec === 0) { const st = (D.stories || []).filter(q => q.fresh), lead = st.find(q => q.lead) || st[0], rest = st.filter(q => q !== lead), ev = nw.filter(n => n.kind);
      const story = (q, big) => `<p class="kick">${q.kicker}</p>${big ? `<h2>${q.head}</h2>` : `<h3>${q.head}</h3>`}`;
      if (lead) { B(`${story(lead, true)}<p class="by">TEKST: ${by} · FOT.: REDAKCJA</p>`, 'span'); if (lead.img || lead.faceImg) B(pic(lead.img || lead.faceImg, `FOT. ${lead.kicker.charAt(0) + lead.kicker.slice(1).toLowerCase()}.`));
        B(`<p class="lede">${lead.text}</p>`, 'txt'); if (lead.quote) B(`<blockquote>${lead.quote[1]}</blockquote><p class="sig">${lead.quote[0]}</p>`, 'quote'); }
      else if (ev[0]) { B(`<p class="kick">${KICK[ev[0].kind] || 'Z OSIEDLA'}</p><h2>${ev[0].head}</h2><p class="by">TEKST: ${by}</p>`, 'span'); if (ev[0].img) B(pic(ev[0].img, 'FOT. Redakcja, na miejscu zdarzenia.')); B(`<p class="lede">${ev[0].text}</p>`, 'txt'); ev.shift(); }
      for (const q of rest) B(`${story(q)}${q.img ? pic(q.img) : q.faceImg ? portrait(q.faceImg) : ''}<p>${q.text}</p>${q.quote ? `<p class="q">„${q.quote[1]}”</p><p class="sig">${q.quote[0]}</p>` : ''}`, q.faceImg && !q.img ? 'iv' : '');
      for (const n of ev.slice(0, 2)) B(`<p class="kick">${KICK[n.kind] || 'Z OSIEDLA'}</p><h3>${n.head}</h3>${n.img ? pic(n.img, 'FOT. Redakcja, na miejscu zdarzenia.') : ''}<p>${n.text}</p>`);
      { const I = D.iv, C = I && CAST[I.who]; if (C) { const qa = C.qa(r); B(`<p class="kick">ROZMOWA DNIA</p><h3>${C.who}</h3>${portrait(I.img)}<p class="who">${C.role}</p><blockquote>${qa[0][1]}</blockquote>${qa.map(([q, a]) => `<p class="q">${q}</p><p class="a">${a}</p>`).join('')}`, 'iv'); } }
      for (const sh of D.shots || []) B(`<p class="kick">ZDJĘCIE CZYTELNIKA</p><h3>${sh.what.charAt(0).toUpperCase() + sh.what.slice(1)}</h3>${pic(sh.img, 'FOT. Czytelnik, na trasie.')}`);
      if (D.heard?.length) B(`<p class="kick">PODSŁUCHANE NA ULICY</p>${D.heard.map(h => `<div class="heard">${h.img ? portrait(h.img, 'pt xs') : ''}<p>„${h.text.charAt(0) + h.text.slice(1).toLowerCase()}”</p><p class="sig">${h.name}</p></div>`).join('')}`, 'iv');
      if (D.briefs.length) B(`<p class="kick">W SKRÓCIE</p>${D.briefs.slice(0, 3).map(t => `<p class="li">${t}</p>`).join('')}`, 'brief');
      if (tz) B(`<p class="kick">JUTRO</p><h3>${tz.head}</h3>${tz.img ? pic(tz.img) : ''}<p>${tz.text}</p>`);
      else if (nw[1] && !nw[1].kind) B(`<p class="kick">Z MIASTECZKA</p><h3>${nw[1].head}</h3>${nw[1].img ? pic(nw[1].img) : ''}<p>${nw[1].text}</p>`); }
    if (sec === 1) { const b = rec.best, gl = L.goal, st = rec.g.st, row = (k, v, bv, rk) => `<tr><td>${k}</td><td>${v}${rec.beat[rk] ? ' <span class="rec">REKORD</span>' : ''}</td><td>${bv}</td></tr>`, bd = D.badges || [];
      B(`<p class="kick">WKŁADKA DLA DORĘCZYCIELA</p><h2>Twoja trasa: ${L.name.toLowerCase()}</h2><p class="deck">${D.headline}</p>`, 'span');
      B(`<div class="box" data-sec="1"><h3>W liczbach</h3><div class="kvs"><div class="kv"><canvas data-ico="dist"></canvas><b>${(D.route.len / 1000).toFixed(2)} KM</b><small>DYSTANS</small></div>
          <div class="kv"><canvas data-ico="time"></canvas><b>${mmss(r.time)}</b><small>CZAS</small></div><div class="kv"><canvas data-ico="paper"></canvas><b>${r.delivered} / ${D.route.subs}</b><small>DORĘCZONE</small></div>
          <div class="kv"><canvas data-ico="star"></canvas><b>${rec.g.n} / 3</b><small>GWIAZDKI</small></div></div></div>`);
      B(`<p class="kick">RAPORT Z TRASY</p><p>${story()}</p>`, 'txt');
      if (D.jobRes?.length) { const JB = game.JB; B(`<p class="kick">Z NOTESU</p>${D.jobRes.map(q => `<p class="li">${JB.JOBS[q.kind].title}: ${q.ok ? JB.JOBS[q.kind].done + ` <span class="pr">+${q.pay} ZŁ</span>` : JB.JOBS[q.kind].fail}</p>`).join('')}`, 'brief'); }
      if (D.heat >= 3) B(`<p class="kick">UWAGA</p><p>Policja szuka rowerzysty w czerwonej czapce. Im więcej szkód, tym więcej patroli na trasie.</p>`, 'brief');
      B(`<canvas class="big" data-map="big"></canvas><div class="legend"><span style="--c:#4f9a3e">DORĘCZONE</span><span style="--c:#cf5a3e">BEZ GAZETY</span><span style="--c:#e8e2d2">BEZ PRENUMERATY</span><span style="--c:#b8483a">TRASA</span><span style="--c:#8e2e25">WYWROTKA</span><span style="--c:#2b2723">SZYBA</span></div>`);
      B(`<h3>Gwiazdki ${starsH(rec.g.n)}</h3><div class="goal">${starsH(st[0] ? 1 : 0, 1)}<span>CZAS DO ${mmss(gl.time)}</span><span>${mmss(r.time)}</span></div>
        <div class="goal">${starsH(st[1] ? 1 : 0, 1)}<span>${gl.papers} GAZET, ${Math.round(gl.acc * 100)}% CELNIE</span><span>${r.delivered}, ${Math.round(r.acc * 100)}%</span></div><div class="goal">${starsH(st[2] ? 1 : 0, 1)}<span>BEZ WYWROTKI</span><span>${r.falls}</span></div>`);
      { const P = D.pay; if (P) B(`<h3>Wypłata</h3><table><tr><td>ZAROBEK NA TRASIE</td><td>${P.earned} ZŁ</td></tr>${P.bonus ? `<tr><td>PREMIA ZA UMOWĘ</td><td>+${P.bonus} ZŁ</td></tr>` : ''}${P.finale?.of ? `<tr><td>FINAŁ: TARCZE ${P.finale.targets}/${P.finale.of}${P.finale.cones ? '' : ', CZYSTY SLALOM'}</td><td>+${P.finale.bonus} ZŁ</td></tr>` : ''}<tr><td>ABONAMENT (${P.regulars} STAŁYCH)</td><td>+${P.income} ZŁ</td></tr>${P.got.map(g => `<tr class="rec"><td>NAGRODA ZA ${'★'.repeat(g.stars)}</td><td>${g.name}</td></tr>`).join('')}</table>${P.mods.length ? `<p class="cap">Umowa: ${P.mods.join(', ').toLowerCase()}.</p>` : ''}`); }
      if (bd.length) B(`<h3>Odznaki poranka</h3><div class="stamps">${bd.map((x, k) => `<div class="stamp" style="--r:${(k % 2 ? 3 : -4)}deg"><b>${x.t}</b><span>${x.d}</span></div>`).join('')}</div>`);
      B(`<h3>Dziś i najlepiej</h3><table><tr><th></th><th>DZIŚ</th><th>NAJLEPIEJ</th></tr>${row('CZAS', mmss(r.time), mmss(b.time), 'time')}${row('GAZETY', r.delivered, b.delivered, 'delivered')}${row('CELNOŚĆ', Math.round(r.acc * 100) + '%', Math.round((b.acc || 0) * 100) + '%', 'acc')}
        ${row('RZUTY', r.thrown, '-')}${row('WYWROTKI', r.falls, b.falls)}${row('SZYBY', r.windows, '-')}${row('ZAROBEK', r.earned + ' ZŁ', b.earned + ' ZŁ', 'earned')}${row('PRZEJAZDY', b.runs, '')}</table>`);
      B(`<h3>Domy na trasie</h3><table><tr><td>PRENUMERATORZY</td><td>${D.route.subs}</td></tr><tr><td>DORĘCZONE</td><td>${r.delivered}</td></tr><tr><td>BEZ GAZETY</td><td>${Math.max(0, D.route.subs - r.delivered)}</td></tr><tr><td>WSZYSTKICH DOMÓW</td><td>${D.route.doors.length}</td></tr></table>`); }
    if (sec === 2) { const N = D.an, C = N && CAST[N.who], jp = D.parts || [];
      B(`<p class="kick">DROBNE I ROZMAITOŚCI</p><h2>Ogłoszenia</h2>`, 'span');
      B(`<div class="jad">${portrait(D.janusz, 'pt')}<b class="jt">WARSZTAT U JANUSZA</b><p class="js">przy głównej · otwarte od świtu · tel. 23-45</p>${jp.map(p => `<p class="li">${p.name}: <span class="pr">${p.price} ZŁ</span></p>`).join('')}
        <p class="jc">${D.coupon ? `TWÓJ KUPON: ${D.coupon.name} -${Math.round(D.coupon.pct * 100)}%` : 'ZADZWOŃ, A MOŻE COŚ UTARGUJESZ!'}</p><div class="keys2">${pxKey('ZADZWOŃ', { icon: 'phone', kind: 'gold', attrs: 'data-act="call"', nudge: true })}${pxKey('WARSZTAT', { icon: 'shop', attrs: 'data-act="shop"' })}</div></div>`, 'ad j');
      { const JB = game.JB, S = { jobs: game.jobs(), slots: game.slots() }; for (const k of JB.offers(S)) { const J = JB.JOBS[k], P = JB.PERSONAS[J.giver];
          B(`${portrait(D.faces?.[J.giver], 'pt xs')}<b>${J.title}</b>${J.ad}<p class="js">${P.name.toUpperCase()} · TEL. ${P.tel}${J.cost ? ` · ${J.cost} ZŁ` : J.pay ? ` · PŁACI ${J.pay} ZŁ` : ''}</p><div class="keys2">${pxKey('ZADZWOŃ', { icon: 'phone', attrs: `data-job="${k}"` })}</div>`, 'ad job'); } }
      for (const a of D.ads.filter(a => !a.j).slice(0, 3)) B(`<b>${a.t}</b>${a.d}`, 'ad');
      for (const c of corners(D)) B(`<p class="kick">${c.k}</p>${c.h}`, 'corner');
      if (C) B(`<p class="kick">ANEGDOTA</p><h3>${N.head}</h3>${portrait(N.img)}<p>${N.text}</p><p class="sig">${C.who}, ${C.role}</p>`, 'iv'); }
    if (sec === 3) { const nexts = D.next.filter(x => x.id), sel = D.pick && nexts.some(x => x.id === D.pick) ? D.pick : nexts[0]?.id, ms = game.mods?.() || [], MODS = game.MODS || [], bon = game.modBonus?.(ms) || 0;
      const rw = id => { const { R, got } = game.rewards?.(id) || { R: {} }; return [1, 3].filter(k => R[k]).map(k => `<span class="rw ${got?.[id + ':' + k] ? 'had' : ''}">${'★'.repeat(k)} ${R[k].cash ? R[k].cash + ' ZŁ' : game.partName(...R[k].part)}</span>`).join(''); };
      const tab = `<div class="jt-tab"><p class="kick">TABELA WYNIKÓW</p><table><tr><th>ODCINEK</th><th>★</th><th>CZAS</th></tr>${(D.table || []).map(t => `<tr${t.on ? ' class="rec"' : ''}><td>${t.open ? t.name : '???'}</td><td>${starsH(t.stars)}</td><td>${t.best ? mmss(t.best.time) : '-'}</td></tr>`).join('')}</table>
        <p class="kick" style="margin-top:12px">STALI PRENUMERATORZY</p><p><b class="big">${D.pay?.regulars ?? 0}</b> stałych klientów płaci <b>${D.pay?.income ?? 0} zł</b> abonamentu za każdą metę. Więcej gwiazdek na odcinkach, więcej stałych klientów.</p></div>`;
      const deal = `<div class="jt-deal"><p class="kick">UMOWA NA JUTRO</p><h3>Utrudnienia za premię</h3><p class="cap">Redaktor dopłaci, jeśli weźmiesz trudniejszy poranek.</p>
        ${MODS.map(m => `<button class="mod ${ms.includes(m.id) ? 'on' : ''}" data-mod="${m.id}"><i></i><b>${m.t}</b><em>+${Math.round(m.bonus * 100)}%</em><span>${m.d}</span></button>`).join('')}<p class="sum">PREMIA: <b>+${Math.round(bon * 100)}%</b> ZAROBKU</p></div>`;
      const cta = `<div class="jt-cta"><p class="kick">NOWY DZIEŃ</p><h2>Dokąd jutro?</h2>${nexts.length ? nexts.map(x => `<button class="pick ${x.id === sel ? 'on' : ''}" data-pick="${x.id}"><b>${x.name}</b><span>${x.note}</span><span class="rws">${rw(x.id)}</span></button>`).join('') : '<p>Dalej jeszcze nie pojedziesz. Zdobądź gwiazdki albo powtórz odcinek.</p>'}
        <div class="go">${sel ? pxKey('RUSZAM W TRASĘ', { icon: 'play', key: 'ENTER', kind: 'gold', attrs: `data-go="${sel}"`, nudge: true }) : ''}</div><div class="keys2">${pxKey('WARSZTAT', { icon: 'shop', attrs: 'data-act="shop"' })}${pxKey('MAPA', { icon: 'map', attrs: 'data-act="map"' })}</div><p class="wallet">W PORTFELU: ${D.money} ZŁ</p></div>`;
      const js = game.jobs?.() || [], sl = game.slots?.() || 2, JB = game.JB;
      const note = `<div class="notes"><p class="kick">TWÓJ NOTES ${js.length}/${sl}</p>${js.length ? js.map(j => `<p class="li">${JB.lineOf(j)}<br><span class="cap">${JB.JOBS[j.kind].hint}</span></p>`).join('') : '<p class="cap">Pusto. Zlecenia znajdziesz w ogłoszeniach: zadzwoń.</p>'}</div>`;
      const lay = cols >= 3 ? 'three' : 'two'; B(`<div class="jt ${lay}">${lay === 'three' ? tab.replace('</div>', '') + note + '</div>' + deal + cta : deal.replace(/<\/div>$/, '') + note + '</div>' + cta}</div>`, 'span full'); }
    return out; }
  // ---------- the phone: a call to Janusz over the paper (his printed face, what he says typed out, what you can ask) ----------
  const call = document.createElement('div'); call.className = 'call'; el.appendChild(call); let callT = 0;
  function say(t, opts) { const sayE = call.querySelector('.say'); clearInterval(callT); let n = 0; sayE.textContent = ''; callT = setInterval(() => { n += 2; sayE.textContent = t.slice(0, n); if (n >= t.length) clearInterval(callT); }, 30);
    call.querySelector('.opts').innerHTML = (opts || []).map(([lab, act, gold]) => pxKey(lab, { kind: gold ? 'gold' : '', attrs: `data-c="${act}"` })).join('');
    if (!call.onclick) call.querySelectorAll('[data-c]').forEach(b => b.onclick = () => callAct(b.dataset.c)); }
  const MENU = () => [['Co polecasz na jutro?', 'tip'], ['Masz coś taniej?', 'deal'], ['Jak się pan ma?', 'how'], ['Opowiedz coś', 'story'], ['Wpadnę do warsztatu', 'shop'], ['Na razie, panie Januszu', 'bye', true]];
  function callJanusz() { game.sound?.('ui'); call.onclick = null; call.innerHTML = `<div class="phone"><div class="ph-h"><i class="ic" style="--ic: var(--ic-phone)"></i><b>WARSZTAT U JANUSZA</b><span>TEL. 23-45</span></div><div class="ph-b">${portrait(D.janusz, 'pt big')}<div><p class="ring">DRYŃ... DRYŃ...</p><p class="say"></p></div></div><div class="opts"></div></div>`;
    call.classList.add('on'); setTimeout(() => { call.querySelector('.ring').textContent = 'PAN JANUSZ:'; say((Math.random() < .35 ? deal('unaware', CALL.unaware) : deal('hello', CALL.hello)), MENU()); }, 900); }
  function callAct(a) { game.sound?.('ui');
    if (a === 'tip') say(CALL.tip(D.parts?.[0]?.name), MENU());
    else if (a === 'deal') { const c = game.coupon?.(D.parts?.[0]?.k); if (c) { D.coupon = c; say(CALL.coupon(c), MENU()); } else say(deal('couponHad', CALL.couponHad), MENU()); }
    else if (a === 'how') say(deal('how', CALL.how), MENU());
    else if (a === 'story') say(deal('story', CALL.story), MENU());
    else if (a === 'shop') { endCall(); game.shop(); }
    else if (a === 'bye') { say(deal('bye', CALL.bye), []); if (Math.random() < .45) setTimeout(() => { call.querySelector('.ring').textContent = 'SŁUCHAWKA:'; say(deal('hangOn', CALL.hangOn), [['Odłóż słuchawkę', 'end', true]]); }, 1900); else setTimeout(endCall, 1700); }
    else if (a === 'end') endCall(); }
  function personaCall(kind) { const JB = game.JB, J = JB.JOBS[kind], P = JB.PERSONAS[J.giver]; game.sound?.('ui');
    call.innerHTML = `<div class="phone"><div class="ph-h"><i class="ic" style="--ic: var(--ic-phone)"></i><b>${P.name.toUpperCase()}</b><span>TEL. ${P.tel}</span></div><div class="ph-b">${portrait(D.faces?.[J.giver], 'pt big')}<div><p class="ring">DRYŃ... DRYŃ...</p><p class="say"></p></div></div><div class="opts"></div></div>`;
    call.classList.add('on'); const j0 = JB.take(kind), pitch = (P.hello ? pickOf(P.hello) + ' ' : '') + JB.pitchOf(j0);
    const yes = J.shop ? [[`Kupuję (${J.cost} zł)`, 'buy', true], ['Może innym razem', 'end']] : [['Biorę to zlecenie', 'take', true], ['Nie tym razem', 'end']];   // (a shop's call: buy it)
    setTimeout(() => { call.querySelector('.ring').textContent = P.name.toUpperCase() + ':'; say(pitch, yes); }, 800);
    call.onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; const a = b.dataset.c; if (a === 'take') { const r = game.takeJob(kind); say(r.ok ? 'Umowa stoi. Zapisz w notesie i nie zawiedź.' : r.msg, [['Rozłącz się', 'end', true]]); }
      else if (a === 'buy') { const r = game.buy(kind); if (r.ok) D.money = game.money?.() ?? D.money; say(r.msg, [['Rozłącz się', 'end', true]]); } else if (a === 'end') { call.onclick = null; endCall(); } }; }
  function endCall() { clearInterval(callT); call.classList.remove('on'); if (open_) build(); }
  // a page drawn into a face: its head, its columns, its corners (to turn on, to turn back), its number
  function draw(f, p) { const P = pages[p];
    f.innerHTML = head(p) + `<div class="body" style="--cols:${cols}">${P.html.join('')}</div><div class="foot"><span>STR. ${p + 1} / ${pages.length}</span><span>${SEC[P.sec]}</span></div>` +
      (p < pages.length - 1 ? '<a class="ear r" data-turn="1" title="Następna strona"><i></i></a>' : '') + (p > 0 ? '<a class="ear l" data-turn="-1" title="Poprzednia strona"><i></i></a>' : ''); }
  // the masthead's name as big as fits (whole pixels of its letters: 48, 40, 32, 24)
  function fitTitle(f) { const t = f.querySelector('.title'); if (!t) return; for (const z of [48, 40, 32, 24, 16]) { t.style.fontSize = z + 'px'; t.style.textShadow = `${z / 8}px 0 0 #2b2723`; t.style.letterSpacing = `${z / 8 * .8}px`; if (t.scrollWidth <= t.clientWidth + 1) break; } }
  function finish(f) { fitTitle(f); f.querySelectorAll('canvas.crest').forEach(c => c.getContext('2d').drawImage(crest(), 0, 0));
    f.querySelectorAll('canvas[data-ico]').forEach(c => { c.width = 10; c.height = 10; c.getContext('2d').drawImage(ico(c.dataset.ico), 0, 0); });
    f.querySelectorAll('canvas[data-map]').forEach(c => { const big = c.dataset.map === 'big'; c.width = Math.max(60, c.clientWidth / 2 | 0); c.height = Math.max(50, c.clientHeight / 2 | 0); c.getContext('2d').drawImage(routeMap(c.width, c.height, big), 0, 0); });
    f.querySelectorAll('[data-sec]').forEach(a => a.onclick = () => turn(pages.findIndex(q => q.sec === +a.dataset.sec)));
    f.querySelectorAll('[data-turn]').forEach(a => a.onclick = () => turn(page + +a.dataset.turn));
    f.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.go(b.dataset.go); });
    f.querySelectorAll('[data-job]').forEach(b => b.onclick = () => personaCall(b.dataset.job));
    f.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => { game.setMod?.(b.dataset.mod, !b.classList.contains('on')); game.sound?.('ui'); build(); });
    f.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { D.pick = b.dataset.pick; game.sound?.('ui'); build(); });
    f.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const a = b.dataset.act; if (a === 'shop') game.shop(); else if (a === 'call') callJanusz(); else { close(); game.map(); } }); }
  // pour: each section from a new page; a block that makes the columns run over goes to the next page (alone on a page, it stays)
  let pages = [], cols = 2;
  function paginate() { const w = A.face.clientWidth; cols = w < 520 ? 1 : w < 900 ? 2 : 3; pages = [];
    for (let sec = 0; sec < SEC.length; sec++) { let cur = null; const fresh = () => { cur = { sec, html: [], first: pages.length === 0 }; pages.push(cur); }; fresh();
      for (const b of blocks(sec)) { cur.html.push(b); draw(A.face, pages.length - 1); fitTitle(A.face); const body = A.face.querySelector('.body');
        if (body.scrollWidth > body.clientWidth + 2 && cur.html.length > 1 && !(cur.html.length === 2 && cur.html[0].includes(' span'))) { cur.html.pop(); fresh(); cur.html.push(b); } } } }
  // ---------- turning: the page lifts by its corner and flies off (a few frames, as the game moves), the next one under it; back: it lands ----------
  function show(p) { draw(A.face, p); finish(A.face); keysBar(); }
  function turn(p) { if (busy || p === page || p < 0 || p >= pages.length) return; busy = true; game.sound?.('ui');
    const fwd = p > page; if (fwd) { draw(Bs.face, p); finish(Bs.face); Bs.el.classList.add('on'); A.el.classList.add('fly'); }
    else { draw(Bs.face, page); finish(Bs.face); Bs.el.classList.add('on'); page = p; show(p); A.el.classList.add('land'); }
    setTimeout(() => { if (fwd) { page = p; show(p); } A.el.classList.remove('fly', 'land'); Bs.el.classList.remove('on'); busy = false; }, 520); }
  function keysBar() { bar.innerHTML = (page ? pxKey('STRONA', { icon: 'prev', key: '←', attrs: 'data-b="prev"' }) : '') + pxKey('JESZCZE RAZ', { icon: 'again', key: 'R', attrs: 'data-b="again"' }) + pxKey('DO DOMU', { icon: 'home', attrs: 'data-b="home"' }) + pxKey('MAPA', { icon: 'map', key: 'M', attrs: 'data-b="map"' }) +
      (page < pages.length - 1 ? pxKey('DALEJ', { icon: 'next', key: '→', kind: 'gold', attrs: 'data-b="next"', nudge: true }) : pxKey('NA MAPĘ', { icon: 'play', key: 'ENTER', kind: 'gold', attrs: 'data-b="map"', nudge: true }));
    bar.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const k = b.dataset.b; if (k === 'prev') turn(page - 1); else if (k === 'next') turn(page + 1); else { close(); k === 'again' ? game.again() : k === 'home' ? game.home() : game.map(); } }); }
  function build() { paginate(); page = Math.min(page, pages.length - 1); show(page); }
  function open(data) { D = data; DATA.clear(); D.headline ||= headline(D.L, D.r, D.rec); D.ads = [...(D.parts || []).map(p => ({ ...p, j: true })), ...ADS.slice().sort(() => Math.random() - .5).slice(0, 5)]; page = 0; open_ = true; el.classList.add('on'); build(); game.sound?.(data.rec.g.n ? 'trick' : 'coin'); }
  function close() { open_ = false; el.classList.remove('on'); }
  addEventListener('resize', () => { if (open_ && !busy) build(); });
  function key(e) { if (!open_) return false; const c = e.code; if (call.classList.contains('on')) { if (c === 'Escape') endCall(); e.preventDefault(); return true; }
    if (c === 'ArrowRight' || c === 'KeyD' || c === 'PageDown') turn(page + 1); else if (c === 'ArrowLeft' || c === 'KeyA' || c === 'PageUp') turn(page - 1);
    else if (c === 'Enter' || c === 'Space') { if (page < pages.length - 1) turn(page + 1); else { const g = A.face.querySelector('.jt [data-go]'); if (g) g.click(); else { close(); game.map(); } } } else if (c === 'KeyR') { close(); game.again(); } else if (c === 'Escape' || c === 'KeyM') { close(); game.map(); }
    e.preventDefault(); return true; }
  const reopen = () => { if (!D) return; D.money = game.money?.() ?? D.money; open_ = true; el.classList.add('on'); build(); };
  return { open, close, reopen, key, get isOpen() { return open_; }, buyNotes: () => game.buyNotes() };
}
