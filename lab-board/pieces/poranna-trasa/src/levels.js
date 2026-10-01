// The game's way forward (docs/progresja.md): home, the map of the regions, the stretches of road in them, each from the start to its
// finish line; what you did on each (the stats and the best), the stars, what is open; and the save: kept in this browser after each
// stretch finished (and when you ask on the map). A stretch the same every time (its layout, its subscribers: a seed), the details not
// (the cars, the dogs, the people).
// REGIONS, LEVELS; save() / load() / wipe(); progress helpers: open(id), stars(id), best(id), record(id, res)

// the regions, in the order the way goes; for now the first one is built, the rest shown on the map as still ahead
export const REGIONS = [
  { id: 'peryferia', name: 'PERYFERIA', note: 'Tu mieszkasz. Domki, ogródki, psy za płotem.', col: '#7fae5a', built: true },
  { id: 'wies', name: 'WIEŚ', note: 'Polne drogi, gospodarstwa, górki i błoto. Gęsi nie ustępują.', col: '#c9b25a', built: true },
  { id: 'peryferia2', name: 'DRUGA STRONA', note: 'Nowe osiedle za torami. Budowy, roboty drogowe, ciężarówki.', col: '#9aa36a', built: false },
  { id: 'miasto', name: 'MIASTO', note: 'Kamienice, rynek, autobus. Krawężniki, schody i duży ruch.', col: '#b8a090', built: false },
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
  { id: 'w1', region: 'wies', name: 'POLNA DROGA', note: 'Pół wsi, od przystanku. Bez chodników, za to z górkami.', finish: { to: .5, dir: 1 }, cars: 1, pace: .9, heat: .75, papers: 18, seed: 501,
    goal: { time: 95, acc: .6, papers: 4 }, after: ['w2', 'w3'], tease: { head: 'Na wsi czekają na gazetę', text: 'Sołtys mówi, że ostatni gazeciarz zgubił się w zbożu. Nowego wypatrują od świtu.', spot: 'działki' } },
  { id: 'w2', region: 'wies', name: 'PRZEZ SADY', note: 'Cała wieś w drugą stronę, między sadami. Spokojnie, ale psy z łańcuchów.', finish: { to: 1, dir: -1 }, cars: 1, pace: .95, heat: .95, papers: 24, seed: 502, cross: [.3],
    goal: { time: 175, acc: .65, papers: 8 }, after: ['w4'], tease: { head: 'W sadach pachnie jabłkami', text: 'Gospodynie zapowiadają szarlotki dla gazeciarza, który dowiezie prasę przed dojeniem.', spot: 'kapliczka' } },
  { id: 'w3', region: 'wies', name: 'ZA TRAKTOREM', note: 'Cała wieś, gdy rusza robota w polu. Więcej maszyn na drodze.', finish: { to: 1, dir: 1 }, cars: 3, pace: 1, heat: .85, papers: 26, seed: 503, cross: [.22],
    goal: { time: 165, acc: .65, papers: 9 }, after: ['w4'], tease: { head: 'Żniwa na całego', text: 'Na drogach maszyny, w polu kurz. Kto jedzie rowerem, niech trzyma się pobocza.', spot: 'przystanek' } },
  { id: 'w4', region: 'wies', name: 'TARGOWY PORANEK', note: 'Dzień targowy: wszyscy jadą do miasteczka. Ruch, psy i pośpiech.', finish: { to: 1, dir: 1 }, cars: 4, pace: 1.15, heat: 1.15, papers: 28, seed: 504, cross: [.18, .42],
    goal: { time: 155, acc: .7, papers: 10 }, after: ['d1'], tease: { head: 'Targ w miasteczku', text: 'Od rana kolejka furmanek i aut. Gazeciarz musi zdążyć, zanim wszyscy odjadą na targ.', spot: 'przystanek' } },
  { id: 'd1', region: 'peryferia2', name: 'NOWE OSIEDLE', note: 'Wkrótce.', soon: true, after: [] }];
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
export function isOpen(id) { const s = load(); if (id === LEVELS[0].id) return true; return LEVELS.some(l => s.done[l.id] && l.after.includes(id)); }
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
