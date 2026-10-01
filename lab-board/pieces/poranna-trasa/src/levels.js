// The game's way forward (docs/progresja.md): home, the map of the regions, the stretches of road in them, each from the start to its
// finish line; what you did on each (the stats and the best), the stars, what is open; and the save: kept in this browser after each
// stretch finished (and when you ask on the map). A stretch the same every time (its layout, its subscribers: a seed), the details not
// (the cars, the dogs, the people).
// REGIONS, LEVELS; save() / load() / wipe(); progress helpers: open(id), stars(id), best(id), record(id, res)

// the regions, in the order the way goes; for now the first one is built, the rest shown on the map as still ahead
export const REGIONS = [
  { id: 'peryferia', name: 'PERYFERIA', note: 'Tu mieszkasz. Domki, ogródki, psy za płotem.', col: '#7fae5a', built: true },
  { id: 'wies', name: 'WIEŚ', note: 'Polne drogi, gospodarstwa, górki i błoto. Gęsi nie ustępują.', col: '#c9b25a', built: false },
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
  { id: 'w1', tease: { head: 'Za torami czeka wieś', text: 'Polne drogi, gęsi i błoto. Mówią, że na wsi gazetę czyta się od deski do deski.', spot: 'działki' }, region: 'wies', name: 'POLNA DROGA', note: 'Wkrótce.', soon: true, after: [] }];
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
