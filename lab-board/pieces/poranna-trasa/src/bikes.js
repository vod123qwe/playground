// Other people's bikes: in some front gardens (on their stands or dropped on the grass), the brother's at home, a cyclist's knocked
// over. On foot, by one, F takes it: you ride off on it and yours is left where it stood (go back for it when you like). Each kind
// rides its own way (its numbers add to the parts from the bike shop, which go with you); the mouse over one (or, the pointer
// held by the game, standing by it) shows a card of its numbers against the one you have. Taking one is noticed: the owner shouts,
// and the police think a little worse of you.
// A bike: { type (its frame: TYPES), parts: { slot: tier } (shop.js PARTS; 0 the plain one) }. What it does: its frame's numbers and its
// parts' (bikeMods); how it looks: its parts', the paint its frame's own unless painted (bikeLook).
// createBikes({ THREE, scene, track, createRider, ramp, toon }) → { list, spawn(rnd), add(bike, x, z, yaw, lying, owner), remove(w),
//   nearest(x, z, r), pose(w), card: { show(bike, cur, x, y, hint), hide() }, clear() }
import { PARTS } from './shop.js';
export const SLOTS = ['kola', 'siodelko', 'kierownica', 'biegi', 'lakier', 'dzwonek', 'lampka', 'torba'];
export const newParts = (o = {}) => Object.fromEntries(SLOTS.map(k => [k, o[k] || 0]));
const ZERO = () => ({ top: 0, acc: 0, steer: 0, grass: 0, hill: 0, stam: 0, bag: 0, trick: 0, bell: 0, lamp: 0 });
// (alt: [slot, tier] tried on instead, for a preview)
export function bikeMods(b, alt) { const m = ZERO(), T = TYPES[b.type] || TYPES.moj; for (const k of ['top', 'acc', 'steer', 'hill', 'trick', 'bag']) m[k] += T[k] || 0; m.grass -= T.grass || 0;   // (grass: in the parts a drag, in the frames a grip)
  for (const k of SLOTS) { const t = PARTS[k].tiers[alt && alt[0] === k ? alt[1] : b.parts[k]] || PARTS[k].tiers[0]; for (const s in t.mods) m[s] += t.mods[s]; } return m; }
export function bikeLook(b, alt) { const o = {}; for (const k of SLOTS) Object.assign(o, (PARTS[k].tiers[alt && alt[0] === k ? alt[1] : b.parts[k]] || PARTS[k].tiers[0]).look);
  const pt = alt && alt[0] === 'lakier' ? alt[1] : b.parts.lakier; if (!pt) o.paint = b.paint || (TYPES[b.type] || TYPES.moj).paint; return o; }
// (what a stranger's bike has on it, by its kind, now and then a little more)
const KIT = { skladak: {}, kolarzowka: { kola: 1, biegi: 1 }, bmx: { kierownica: 2 }, damka: { torba: 1, dzwonek: 1 }, ostre: { kola: 3, siodelko: 1 }, trekking: { lampka: 1, dzwonek: 1, biegi: 1 }, silnik: { biegi: 2, siodelko: 2 } };
export function strangerBike(type, rnd = Math.random) { const p = newParts(KIT[type]); if (rnd() < .35) { const k = ['kola', 'siodelko', 'kierownica', 'biegi', 'lampka', 'dzwonek'][rnd() * 6 | 0]; p[k] = Math.max(p[k], 1 + (rnd() * (PARTS[k].tiers.length - 1) | 0)); } return { type, parts: p }; }

export const TYPES = {
  moj: { name: 'TWÓJ GÓRAL', note: 'STARY, ALE SWÓJ.', paint: '#c23a2e', top: 0, acc: 0, steer: 0, grass: 0, hill: 0, trick: 0, bag: 0 },
  skladak: { name: 'SKŁADAK', note: 'MAŁE KOŁA, ZWROTNY JAK WIEWIÓRKA. PO TRAWIE CIĘŻKO.', paint: '#e8692c', top: -.12, acc: .12, steer: .22, grass: -.25, hill: -.1, trick: 0, bag: 0 },
  kolarzowka: { name: 'KOLARZÓWKA', note: 'SZYBKA NA ASFALCIE, NA TRAWIE BEZRADNA.', paint: '#e3c43a', top: .24, acc: .05, steer: -.15, grass: -.4, hill: .1, trick: -.1, bag: 0 },
  bmx: { name: 'BMX', note: 'DO SKAKANIA, NIE DO DALEKICH TRAS.', paint: '#3d7be0', top: -.16, acc: .15, steer: .25, grass: 0, hill: -.15, trick: .35, bag: -5 },
  damka: { name: 'DAMKA Z KOSZYKIEM', note: 'POWOLI, ALE DO KOSZYKA WEJDZIE STOS GAZET.', paint: '#7fc8a9', top: -.08, acc: -.06, steer: -.05, grass: -.1, hill: -.05, trick: -.2, bag: 12 },
  ostre: { name: 'OSTRE KOŁO', note: 'LEKKIE I SZYBKIE. POD GÓRKĘ BOLI.', paint: '#17181b', top: .3, acc: .1, steer: -.1, grass: -.3, hill: -.25, trick: 0, bag: -5 },
  trekking: { name: 'TREKKING Z BŁOTNIKAMI', note: 'NA KAŻDĄ DROGĘ. NICZYM NIE ZACHWYCA.', paint: '#467537', top: .08, acc: 0, steer: 0, grass: .15, hill: .05, trick: -.1, bag: 6 },
  silnik: { name: 'ROWER Z SILNICZKIEM', note: 'DZIADEK GO PRZEROBIŁ. CIĄGNIE POD GÓRKĘ, SKRĘCA JAK TAPCZAN.', paint: '#9a9c9e', top: .14, acc: .3, steer: -.18, grass: 0, hill: .4, trick: -.3, bag: 0 } };
const ROWS = [['PRĘDKOŚĆ', 'top'], ['PRZYSPIESZENIE', 'acc'], ['SKRĘT', 'steer'], ['TEREN', 'grass'], ['POD GÓRKĘ', 'hill'], ['TRIKI', 'trick']];
const pts = v => Math.max(1, Math.min(10, Math.round(5 + v * 12.5)));   // (a number as pips, 1-10, the plain bike at 5)

export function createBikes({ THREE, scene, track, createRider, ramp, toon }) {
  const list = [];
  function pose(w) { const r = w.r; r.update({ dt: 0, speed: 0, steer: 0, lean: w.lying ? w.side * 1.38 : .12, pedalling: 0, braking: 0, climbing: 0, look: null, nervous: 0, kick: null, air: false, fallen: 0, charge: null });
    const y = track.probe(w.x, w.z, w.hint ?? 0).y; r.root.position.set(w.x, y, w.z); r.root.rotation.set(0, w.yaw, 0); }
  function add(bike, x, z, yaw, lying, owner) { const r = createRider({ THREE, ramp, toon }); r.boy.visible = false; scene.add(r.root); r.setParts(bikeLook(bike));
    const w = { bike, x, z, yaw, lying: !!lying, side: Math.random() < .5 ? -1 : 1, owner, r, hint: 0 }; w.hint = track.probe(x, z, 0).i; w.hint = track.probe(x, z, w.hint).i; pose(w); list.push(w); return w; }
  function remove(w) { const k = list.indexOf(w); if (k >= 0) list.splice(k, 1); scene.remove(w.r.root); }
  function clear() { while (list.length) remove(list[0]); }
  // (in some front gardens, on the lawn by the pavement, where nothing stands)
  function spawn(rnd) { const kinds = ['skladak', 'kolarzowka', 'bmx', 'damka', 'ostre', 'trekking', 'silnik'], lots = [...track.lots].sort(() => rnd() - .5); let n = 0;
    for (const L of lots) { if (n >= 9) break; const S = track.S[L.i], d = L.side * (track.PAVE + 1.1 + rnd() * 1.2), x = S.p.x + S.r.x * d + S.f.x * (rnd() - .5) * 3, z = S.p.z + S.r.z * d + S.f.z * (rnd() - .5) * 3;
      const clash = [...track.near(L.i)].some(C => (C.kind === 'hard' || C.kind === 'soft') && Math.abs(C.x - x) < C.hx + Math.max(C.hx, C.hz) + 1.2 && Math.abs(C.z - z) < C.hz + Math.max(C.hx, C.hz) + 1.2 && Math.hypot(C.x - x, C.z - z) < Math.max(C.hx, C.hz) + 1.2);
      if (clash) continue; const door = track.doors.reduce((a, b) => (Math.hypot(b.p.x - x, b.p.z - z) < Math.hypot(a.p.x - x, a.p.z - z) ? b : a), track.doors[0]);
      add(strangerBike(kinds[n % kinds.length], rnd), x, z, Math.atan2(S.f.x, S.f.z) + (rnd() - .5) * .8, rnd() < .45, { kind: 'house', at: door.p.clone() }); n++; } }
  const nearest = (x, z, r) => { let best = null, bd = r; for (const w of list) { const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw), t = Math.max(-.9, Math.min(.9, (x - w.x) * fx + (z - w.z) * fz)), d = Math.hypot(x - w.x - fx * t, z - w.z - fz * t); if (d < bd) { bd = d; best = w; } } return best; };

  // the card: its name, a word on it, its numbers as pips against yours (green: better, red: worse)
  const css = document.createElement('style'); css.textContent = `
    #bikecard { position: fixed; z-index: 3; display: none; pointer-events: none; width: 210px; padding: 9px 10px; background: rgba(23,24,27,.92); box-shadow: 0 0 0 2px #17181b, 0 0 0 3px #efc970; color: #f6f3ea; font: 700 10px/1.25 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: .05em; transform: translate(-50%, -100%); }
    #bikecard.on { display: block; } #bikecard h3 { margin: 0 0 2px; font-size: 12px; color: #efc970; letter-spacing: .1em; } #bikecard .note { opacity: .7; font-size: 9px; margin-bottom: 6px; text-transform: none; }
    #bikecard .r { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 4px; margin: 2px 0; } #bikecard .pips { display: flex; gap: 2px; } #bikecard .pips i { width: 8px; height: 7px; background: #44484c; }
    #bikecard .pips i.on { background: #d3d0c3; } #bikecard .pips i.up { background: #9fd27a; } #bikecard .pips i.dn { background: #cf5a3e; } #bikecard .bag { margin-top: 4px; color: #9fd27a; } #bikecard .bag.dn { color: #cf5a3e; } #bikecard .k { margin-top: 6px; color: #efc970; }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'bikecard'; document.body.appendChild(el); let shown = null;
  const card = { show(bike, cur, x, y, hint) { const T = TYPES[bike.type] || TYPES.moj, A = bikeMods(bike), Cm = bikeMods(cur), key = JSON.stringify(bike) + JSON.stringify(cur) + hint, val = (m, k) => k === 'grass' ? -m.grass : m[k];
      if (shown !== key) { shown = key; const extras = SLOTS.filter(k => k !== 'lakier' && bike.parts[k] > 0).map(k => PARTS[k].tiers[bike.parts[k]].name);
        el.innerHTML = `<h3>${T.name}</h3><div class="note">${T.note}</div>` + ROWS.map(([lab, k]) => { const a = pts(val(A, k)), b = pts(val(Cm, k));
          return `<div class="r"><span>${lab}</span><span class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.min(a, b) ? 'on' : i < a ? 'up' : i < b ? 'dn' : ''}"></i>`).join('')}</span></div>`; }).join('')
          + (A.bag !== Cm.bag ? `<div class="bag ${A.bag < Cm.bag ? 'dn' : ''}">TORBA ${30 + A.bag} GAZET (TWOJA ${30 + Cm.bag})</div>` : '') + (extras.length ? `<div class="note" style="margin:5px 0 0">NA NIM: ${extras.join(', ')}</div>` : '') + (hint ? `<div class="k">${hint}</div>` : ''); }
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.classList.add('on'); },
    hide() { if (shown === null) return; shown = null; el.classList.remove('on'); } };
  return { list, spawn, add, remove, nearest, pose, card, clear };
}
