// The game's way forward (docs/progresja.md): home, the map of the regions, the stretches of road in them, each from the start to its
// finish line; what you did on each (the stats and the best), the stars, what is open; and the save: kept in this browser after each
// stretch finished (and when you ask on the map). A stretch the same every time (its layout, its subscribers: a seed), the details not
// (the cars, the dogs, the people).
// REGIONS, LEVELS; save() / load() / wipe(); progress helpers: open(id), stars(id), best(id), record(id, res)

// the regions, in the order the way goes; for now the first one is built, the rest shown on the map as still ahead
export const REGIONS = [
  { id: 'peryferia', name: 'PERYFERIA', note: 'Tu mieszkasz. Domki, ogródki, psy za płotem.', col: '#7fae5a', built: true },
  { id: 'wies', name: 'WIEŚ', note: 'Polne drogi, gospodarstwa, górki i błoto. Gęsi nie ustępują.', col: '#c9b25a', built: true },
  { id: 'peryferia2', name: 'DRUGA STRONA', note: 'Nowe osiedle za torami. Budowy, roboty drogowe, magazyny.', col: '#9aa36a', built: true },
  { id: 'miasto', name: 'MIASTO', note: 'Kamienice, rynek, bloki, tramwaj. Krawężniki i duży ruch.', col: '#b8a090', built: true },
  { id: 'bronx', name: 'BRONX', note: 'Wielka płyta po zmroku. Latarnie, cwaniacy pod klatkami, szkło na drodze, ciemne przejścia.', col: '#5a5f78', built: true },
  { id: 'las', name: 'LEŚNA DROGA', note: 'Ścieżki między drzewami, domki letniskowe, namioty.', col: '#4f8a52', built: false },
  { id: 'dalej', name: '???', note: 'Jeszcze dalej. Inny teren.', col: '#6a6f78', built: false }];

// a stretch: its way (from the home's mouth round the loop: to, a part of the lap; dir, which way: the checkpoints on it passed in turn),  how busy the road is, the
// stars' bars; after: what it opens (two after it: a fork on the map, you choose)
//   cars: the cars out; pace: their speed; heat: the dogs' keenness (0..1.4); papers: in the bag at the start; seed: its subscribers
//   goal: { time (s), acc (0..1: delivered of thrown), papers (delivered at least) }
export const LEVELS = [
  { id: 'p1', region: 'peryferia', name: 'PIERWSZY PORANEK', note: 'Pół dzielnicy, mało aut. Na rozgrzewkę.', finish: { to: .5, dir: 1 }, cars: 2, pace: .9, heat: .5, papers: 20, seed: 101,
    goal: { time: 75, acc: .6, papers: 6 }, after: ['p2', 'p3'] },
  { id: 'p2', tease: { head: 'Jutro od drugiej strony', text: 'Sąsiedzi z końca ulicy pytają, czemu gazeta zawsze przychodzi do nich ostatnia. Jutro mają być pierwsi.', spot: 'kapliczka' }, region: 'peryferia', name: 'OKRĄŻENIE OD TYŁU', note: 'Całe okrążenie, ale w drugą stronę. Mniej aut, spokojniejsze tempo.', finish: { to: 1, dir: -1 }, cars: 2, pace: 1, heat: .7, papers: 26, seed: 202,
    goal: { time: 140, acc: .65, papers: 10 }, after: ['p4'] },
  { id: 'p3', tease: { head: 'Na głównej coraz tłoczniej', text: 'Drogowcy naliczyli więcej aut niż zwykle. Kto jutro jedzie główną, niech uważa na zakrętach.', spot: 'przystanek' }, region: 'peryferia', name: 'GŁÓWNĄ ULICĄ', note: 'Całe okrążenie w ruchu. Więcej aut, szybsze tempo, wyższa poprzeczka.', finish: { to: 1, dir: 1 }, cars: 4, pace: 1.1, heat: .7, papers: 30, seed: 303,
    goal: { time: 130, acc: .65, papers: 13 }, after: ['p4'] },
  { id: 'p4', tease: { head: 'Nadciąga godzina szczytu', text: 'Jutro wszyscy jadą do pracy naraz, a psy podobno się wyspały. Gazeciarz musi zdążyć przed nimi.', spot: 'buda z psem' }, region: 'peryferia', name: 'GODZINA SZCZYTU', note: 'Okrążenie, gdy wszyscy jadą do pracy. Psy już nie śpią.', finish: { to: 1, dir: 1 }, cars: 6, pace: 1.3, heat: 1.15, papers: 30, seed: 404,
    goal: { time: 125, acc: .7, papers: 15 }, after: ['w1'] },
  { id: 'k1', region: 'peryferia', map: 'klasyk', classic: true, name: 'KLASYK: ULICA KASZTANOWA', note: 'Wersja Klasyk: domy tylko po lewej, po prawej przeszkody i paczki z gazetami. Rower toczy się sam, gaz przyspiesza, hamulec zwalnia, każdy rzut leci w stronę domów. Szyby nieabonentów za punkty.', finish: { to: 1, dir: 1 }, cars: 2, pace: .9, heat: .8, papers: 10, seed: 901,
    goal: { time: 170, acc: .7, papers: 12 }, after: ['k2'] },
  { id: 'k2', region: 'miasto', map: 'klasyk2', classic: true, titles: 2, rivals: 1, name: 'KLASYK: ŚRÓDMIEŚCIE', note: 'Wersja Klasyk, drugi poziom: miasto za dnia. Kamienice ze sklepami po lewej, po prawej życie ulicy. Dwie prenumeraty: każdy abonent czyta swoją, X przełącza tytuł. Kurier konkurencji podbiera skrzynki. PILNE zamówienia na czas.', finish: { to: 1, dir: 1 }, cars: 4, pace: 1, heat: 1, papers: 14, seed: 902,
    goal: { time: 190, acc: .7, papers: 14 }, after: [] },
  { id: 'w1', region: 'wies', name: 'POLNA DROGA', note: 'Pół wsi, od przystanku. Bez chodników, za to z górkami.', finish: { to: .5, dir: 1 }, cars: 1, pace: .9, heat: .75, papers: 18, seed: 501,
    goal: { time: 95, acc: .6, papers: 4 }, after: ['w2', 'w3'], tease: { head: 'Na wsi czekają na gazetę', text: 'Sołtys mówi, że ostatni gazeciarz zgubił się w zbożu. Nowego wypatrują od świtu.', spot: 'działki' } },
  { id: 'w2', region: 'wies', name: 'PRZEZ SADY', note: 'Cała wieś w drugą stronę, między sadami. Spokojnie, ale psy z łańcuchów.', finish: { to: 1, dir: -1 }, cars: 1, pace: .95, heat: .95, papers: 24, seed: 502, cross: [.3],
    goal: { time: 175, acc: .65, papers: 8 }, after: ['w4'], tease: { head: 'W sadach pachnie jabłkami', text: 'Gospodynie zapowiadają szarlotki dla gazeciarza, który dowiezie prasę przed dojeniem.', spot: 'kapliczka' } },
  { id: 'w3', region: 'wies', map: 'zniwa', name: 'ŻNIWA', note: 'Własna mapa: złote pola jedno przy drugim, kombajn na prawie całą szerokość drogi i kurz za nim, traktory z przyczepami (rzuć gazetę na przyczepę), słomiane skocznie, rolnicy przy bramach.', finish: { to: 1, dir: 1 }, cars: 3, pace: 1, heat: .85, papers: 26, seed: 503, cross: [.22],
    goal: { time: 165, acc: .65, papers: 9 }, after: ['w4'], tease: { head: 'Żniwa na całego', text: 'Na drogach maszyny, w polu kurz. Kto jedzie rowerem, niech trzyma się pobocza.', spot: 'przystanek' } },
  { id: 'w4', region: 'wies', name: 'TARGOWY PORANEK', note: 'Dzień targowy: wszyscy jadą do miasteczka. Ruch, psy i pośpiech.', finish: { to: 1, dir: 1 }, cars: 4, pace: 1.15, heat: 1.15, papers: 28, seed: 504, cross: [.18, .42],
    goal: { time: 155, acc: .7, papers: 10 }, after: ['d1', 'w5'], tease: { head: 'Targ w miasteczku', text: 'Od rana kolejka furmanek i aut. Gazeciarz musi zdążyć, zanim wszyscy odjadą na targ.', spot: 'przystanek' } },
  { id: 'w5', region: 'wies', map: 'odpust', name: 'ODPUST', note: 'Własna mapa: plac przed kościołem, kramy po obu stronach drogi (każdy kram bierze gazetę), tłum przechodzi przez drogę, orkiestra dęta maszeruje jezdnią, a ksiądz stoi z tacą przy bramie.', finish: { to: 1, dir: 1 }, cars: 2, pace: 1, heat: 1, papers: 28, seed: 505,
    goal: { time: 170, acc: .7, papers: 10 }, after: [], tease: { head: 'Odpust w parafii', text: 'W niedzielę odpust: kramy od rana, orkiestra od szóstej, proboszcz od zawsze. Kto przyjedzie rowerem, niech uważa na tubę.', spot: 'kapliczka' } },
  { id: 'd1', region: 'peryferia2', name: 'NOWE OSIEDLE', note: 'Pół osiedla: szeregowce jeden przy drugim, ciasne zakręty, dziury.', finish: { to: .5, dir: 1 }, cars: 2, pace: 1, heat: .9, papers: 20, seed: 601,
    goal: { time: 100, acc: .65, papers: 6 }, after: ['d2', 'd3'], tease: { head: 'Za torami rośnie osiedle', text: 'Nowi mieszkańcy pytają o prenumeratę. Deweloper obiecał im ciszę, a dostali budowę pod oknem.', spot: 'budowa' } },
  { id: 'd2', region: 'peryferia2', map: 'budowa', name: 'PLAC BUDOWY', note: 'Własna mapa: budowy jedna przy drugiej, dźwigi, suwnice z ładunkiem cegieł nad drogą (patrz na cień), budowlańcy, roboty drogowe i przejazd przez tory.', finish: { to: 1, dir: -1 }, cars: 3, pace: 1, heat: 1, papers: 26, seed: 602, cross: [.33],
    goal: { time: 175, acc: .65, papers: 9 }, after: ['d4'], tease: { head: 'Roboty drogowe na Nowej', text: 'Koparka stoi na pasie od tygodnia. Kierownik budowy mówi, że „jeszcze trochę”. Mieszkańcy mówią co innego.', spot: 'budowa' } },
  { id: 'd3', region: 'peryferia2', map: 'bocznica', name: 'MAGAZYNY', note: 'Własna mapa: długie proste wzdłuż hal przy bocznicy, wózki widłowe przejeżdżają przez drogę, przejazd kolejowy z pociągiem towarowym, magazynierzy.', finish: { to: 1, dir: 1 }, cars: 5, pace: 1.15, heat: 1.05, papers: 26, seed: 603, cross: [.5],
    goal: { time: 160, acc: .7, papers: 9 }, after: ['d4'], tease: { head: 'Hale przy bocznicy', text: 'Magazynierzy czytają gazetę na przerwie. Kto dowiezie przed szóstą, ten ma u nich kawę.', spot: 'przystanek' } },
  { id: 'd4', region: 'peryferia2', name: 'WOJNA GAZET', note: 'Całe osiedle, a na nim kurierzy Kuriera Osiedlowego: podbierają skrzynki. Wyprzedź, kopnij, trafiaj.', finish: { to: 1, dir: 1 }, cars: 3, pace: 1.1, heat: 1.1, papers: 30, seed: 604, rivals: 2, cross: [.4],
    goal: { time: 165, acc: .7, papers: 10 }, after: ['m1'], tease: { head: 'Kurier wypowiada wojnę', text: 'Szef Kuriera Osiedlowego zapowiada, że od jutra „każda skrzynka będzie nasza”. Redakcja Trąbki odpowiada krótko: zobaczymy.', spot: 'budowa' } },
  { id: 'm1', region: 'miasto', name: 'STARE MIASTO', note: 'Pół miasta: kamienice ze sklepami, klatki schodowe, skrzynki w bramach. Ciasno i dużo ludzi.', finish: { to: .5, dir: 1 }, cars: 4, pace: 1.1, heat: 1.1, papers: 24, seed: 701,
    goal: { time: 110, acc: .7, papers: 8 }, after: ['m2', 'm3', 'm5'], tease: { head: 'Trąbka wjeżdża do miasta', text: 'Kamienicznicy pytają, czy gazeciarz z przedmieścia trafi do skrzynek w bramach. Redakcja odpowiada: trafi, jak nie pomyli klatek.', spot: 'przystanek' } },
  { id: 'm2', region: 'miasto', name: 'DZIEŃ TARGOWY', note: 'Całe miasto w drugą stronę, przez rynek pełen straganów. Tłok, autobusy, pośpiech.', finish: { to: 1, dir: -1 }, cars: 5, pace: 1.15, heat: 1.15, papers: 30, seed: 702,
    goal: { time: 175, acc: .7, papers: 11 }, after: ['m4'], tease: { head: 'Na rynku od świtu', text: 'Stragany stoją od piątej. Kwiaciarka mówi, że gazetę czyta między klientami, a klienci między straganami.', spot: 'przystanek' } },
  { id: 'm3', region: 'bronx', map: 'bloki', name: 'BLOKOWISKO', note: 'Własna mapa: osiedle z wielkiej płyty dookoła. Długi bulwar, zawrotka i zygzak między blokami, klatka przy klatce, więcej drzew, mniej sklepów.', finish: { to: 1, dir: 1 }, cars: 5, pace: 1.2, heat: 1.1, papers: 30, seed: 703,
    goal: { time: 210, acc: .72, papers: 11 }, after: ['m4', 'b1'], tease: { head: 'Bloki czekają', text: 'Na osiedlu z wielkiej płyty każda klatka ma swoje plotki. Gazeta ma je zebrać, zanim zrobi to dozorczyni.', spot: 'budowa' } },
  { id: 'b1', region: 'bronx', name: 'NOC NA BLOKOWISKU', note: 'Osiedle po zmroku. Latarnie co kawałek, część mruga, w przejściach między blokami ciemno. Znaczniki widać z bliska albo pod latarnią.', finish: { to: 1, dir: 1 }, cars: 2, pace: 1, heat: 1.1, papers: 26, seed: 801,
    goal: { time: 190, acc: .65, papers: 9 }, after: ['b2'], tease: { head: 'Na osiedlu nie śpią', text: 'Mieszkańcy bloków skarżą się, że gazeta przychodzi, kiedy już nikt nie czyta. Redakcja odpowiada: to przyjedziemy wcześniej. Po ciemku.', spot: 'przystanek' } },
  { id: 'b2', region: 'bronx', map: 'garaze', name: 'GARAŻE', note: 'Nocą przez labirynt boksów garażowych. Każdy boks może mieć prenumeratę. Z rampy na płaskie dachy i dalej po nich. Z otwartych boksów wyjeżdżają auta.', finish: { to: 1, dir: 1 }, cars: 2, pace: 1, heat: 1.1, papers: 30, seed: 802,
    goal: { time: 195, acc: .66, papers: 11 }, after: [], tease: { head: 'Garaże nie śpią', text: 'Pod blokami w garażach ktoś zawsze coś naprawia. Co naprawia, nie wiadomo. Ale gazetę czyta.', spot: 'przystanek' } },
  { id: 'm5', region: 'miasto', map: 'turystyczna', name: 'DZIELNICA TURYSTYCZNA', note: 'Własna mapa: pastelowe kamienice, zabytki, wielki park. Skróty przez park: bez aut, ale pełne ludzi. Skatepark, food trucki, turyści z aparatami.', finish: { to: 1, dir: 1 }, cars: 3, pace: 1.05, heat: 1, papers: 28, seed: 705,
    goal: { time: 190, acc: .68, papers: 10 }, after: ['m4'], tease: { head: 'Turyści czytają Trąbkę', text: 'Przewodniczka z parasolką poleca grupom naszą gazetę jako „lokalną atrakcję”. Redakcja nie wie, czy to komplement.', spot: 'przystanek' } },
  { id: 'm4', region: 'miasto', name: 'GODZINA SZCZYTU', note: 'Wkrótce: tramwaje, korki i redakcja Trąbki na końcu trasy.', soon: true, after: [] }];
export const LEVEL = id => LEVELS.find(l => l.id === id);

// ---------- the save ----------
const KEY = 'pt.save';
const blank = () => ({ v: 1, done: {}, best: {}, money: 0, bike: null, inv: [], paints: [], at: null, t: 0 });
let S = null;
export function load() { if (S) return S; try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch { S = blank(); } return S; }
export function save(patch) { load(); if (patch) Object.assign(S, patch); S.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } return S; }
export function wipe() { S = blank(); try { localStorage.removeItem(KEY); } catch { } return S; }
export const hasSave = () => { try { return !!localStorage.getItem(KEY); } catch { return false; } };

// open: the first, and any a finished one leads to
// (each game's first route is open: Poranna Trasa's and the Classic's)
export function isOpen(id) { const s = load(), cl = !!LEVELS.find(l => l.id === id)?.classic; if (id === LEVELS.find(l => !!l.classic === cl)?.id) return true; return LEVELS.some(l => s.done[l.id] && l.after.includes(id)); }
export const starsOf = id => load().best[id]?.stars || 0;
export const bestOf = id => load().best[id] || null;
export const totalStars = () => LEVELS.reduce((n, l) => n + starsOf(l.id), 0);

// the stars of a run: on time, a good aim, no fall; and what it beat
export function grade(L, r) { const st = [r.time <= L.goal.time, r.acc >= L.goal.acc && r.delivered >= L.goal.papers, r.falls === 0]; return { st, n: st.filter(Boolean).length }; }
export function record(L, r) { const s = load(), g = grade(L, r), b = s.best[L.id], nb = { ...(b || {}) }, beat = {};
  if (!b || r.time < b.time) { nb.time = r.time; beat.time = !!b; } if (!b || r.delivered > (b.delivered || 0)) { nb.delivered = r.delivered; beat.delivered = !!b; }
  if (!b || r.acc > (b.acc || 0)) { nb.acc = r.acc; beat.acc = !!b; } if (!b || r.earned > (b.earned || 0)) { nb.earned = r.earned; beat.earned = !!b; }
  nb.stars = Math.max(b?.stars || 0, g.n); nb.runs = (b?.runs || 0) + 1; nb.falls = Math.min(b?.falls ?? 99, r.falls); s.best[L.id] = nb; s.done[L.id] = true; save(); return { g, beat, best: nb, first: !b }; }

// ---------- why ride a stretch again ----------
// the rewards of a stretch's stars: the first star and the third, each once (cash, or a part from Janusz's: it goes to your spare parts)
export const REWARDS = { p1: { 1: { cash: 10 }, 3: { part: ['dzwonek', 1] } }, p2: { 1: { cash: 15 }, 3: { part: ['siodelko', 1] } }, p3: { 1: { cash: 15 }, 3: { part: ['kola', 1] } }, p4: { 1: { cash: 25 }, 3: { part: ['biegi', 1] } },
  w1: { 1: { cash: 15 }, 3: { part: ['kola', 2] } }, w2: { 1: { cash: 20 }, 3: { part: ['lampka', 1] } }, w3: { 1: { cash: 20 }, 3: { part: ['torba', 1] } }, w4: { 1: { cash: 30 }, 3: { part: ['siodelko', 2] } } };
// what a new star brought (the ones not had before): marks them given in the save
export function rewardsFor(id, before, now) { const s = load(), R = REWARDS[id] || {}, got = []; s.got ||= {};
  for (const k of [1, 3]) if (R[k] && now >= k && before < k && !s.got[id + ':' + k]) { s.got[id + ':' + k] = true; got.push({ stars: k, ...R[k] }); } save(); return got; }
// the subscribers who stay (the farm): each stretch's best stars keep that many regulars, who pay every morning a run is finished
export const regulars = () => LEVELS.reduce((n, l) => n + [0, 2, 4, 7][starsOf(l.id)], 0);
export const income = () => regulars() * 2;
// the deal for tomorrow: hardships taken on for a bonus on the pay (agreed on the paper's last page, kept in the save till used)
export const MODS = [
  { id: 'ruch', t: 'GODZINA SZCZYTU', d: 'Dwa auta więcej na drodze.', bonus: .15, apply: L => ({ ...L, cars: Math.min(8, L.cars + 2) }) },
  { id: 'psy', t: 'PSY BEZ SMYCZY', d: 'Psy czujniejsze i szybsze.', bonus: .15, apply: L => ({ ...L, heat: L.heat + .35 }) },
  { id: 'torba', t: 'CHUDA TORBA', d: 'Sześć gazet mniej na start.', bonus: .2, apply: L => ({ ...L, papers: Math.max(8, L.papers - 6) }) },
  { id: 'czas', t: 'NA WCZORAJ', d: 'Gwiazdka za czas o piątą część trudniejsza.', bonus: .2, apply: L => ({ ...L, goal: { ...L.goal, time: Math.round(L.goal.time * .8) } }) }];
export const mods = () => (load().mods || []).filter(id => MODS.some(m => m.id === id));
export function setMod(id, on) { const s = load(), m = new Set(s.mods || []); on ? m.add(id) : m.delete(id); s.mods = [...m]; save(); return s.mods; }
export const modBonus = (ids = mods()) => ids.reduce((b, id) => b + (MODS.find(m => m.id === id)?.bonus || 0), 0);
export const withMods = (L, ids = mods()) => ids.reduce((x, id) => MODS.find(m => m.id === id)?.apply(x) || x, L);
