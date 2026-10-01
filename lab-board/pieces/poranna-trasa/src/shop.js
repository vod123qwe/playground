// The bike shop by the road (a stop on the way: the game waits while you are in). The bike on a turntable on the left, the parts on
// the right: wheels, saddle, handlebar, gears, paint, bell, lamp, bag; each with its tiers (a price, what it does, how it looks: you see
// it on the bike at once), bars of what the bike can do and what a part would change; your finds sold (or, a bell or a lamp, put on);
// the bag filled with papers. What you bought stays for the run: put on the bike you ride (what was on it goes to your spare parts,
// bikes.js / the inventory page); a paint, once bought, yours to use again on any bike.
// createShop({ THREE, createRider, game }) → { open(), close(), key(e), isOpen, mods(), look(), reset() }
// game: { money (get/set), papers (get/set), items (array), bike (the one ridden: { type, parts }), inv (spare parts: [{ k, tier }]),
//   paints (Set of the paint tiers bought), onChange(), flash(s) }
import { JANUSZ, bag } from './stories.js';
import { bikeMods, bikeLook } from './bikes.js';
import { icon, TIER_COL } from './garage.js';
import { pixUI } from './pixui.js';
import { pixFont } from './pixfont.js';
import { pxKey } from './pixui.js';
export const PARTS = {
  kola: { name: 'KOŁA', tiers: [
    { name: 'ZWYKŁE', price: 0, look: { tyre: '#26272a', rim: '#c9cbc8', tyreW: 1 }, mods: {}, note: 'JEŻDŻĄ. TYLE DOBREGO.' },
    { name: 'SZOSOWE, CIENKIE', price: 30, look: { tyre: '#2b2b2e', rim: '#eeeeec', tyreW: .7 }, mods: { top: .08, acc: .04, grass: .35 }, note: 'SZYBSZE NA ASFALCIE. NA TRAWIE CIĘŻKO.' },
    { name: 'TERENOWE „KOZICA”', price: 35, look: { tyre: '#4a3a2a', rim: '#9a9c9e', tyreW: 1.35 }, mods: { top: -.02, grass: -.55 }, note: 'TRAWA I KRAWĘŻNIKI IM NIESTRASZNE.' },
    { name: 'WYCZYNOWE, ZŁOTE', price: 70, look: { tyre: '#1d1e21', rim: '#e3b83a', tyreW: .85 }, mods: { top: .13, acc: .08 }, note: 'ZŁOTE OBRĘCZE. LUDZIE SIĘ OGLĄDAJĄ.' }] },
  siodelko: { name: 'SIODEŁKO', tiers: [
    { name: 'ZWYKŁE', price: 0, look: { saddle: '#1d1e21', saddleS: 1 }, mods: {}, note: 'TWARDE JAK ŻYCIE.' },
    { name: 'SKÓRZANE', price: 18, look: { saddle: '#7a4a2a', saddleS: 1.05 }, mods: { stam: .25 }, note: 'SPRINT WYTRZYMASZ DŁUŻEJ.' },
    { name: 'ŻELOWE „KANAPA”', price: 32, look: { saddle: '#3d7be0', saddleS: 1.22 }, mods: { stam: .5 }, note: 'JAK FOTEL U DZIADKA. TYLKO SZYBSZY.' }] },
  kierownica: { name: 'KIEROWNICA', tiers: [
    { name: 'ZWYKŁA', price: 0, look: { grip: '#2a2b2e' }, mods: {}, note: 'PROSTA SPRAWA.' },
    { name: 'SPORTOWE CHWYTY', price: 15, look: { grip: '#cf5a3e' }, mods: { steer: .08 }, note: 'PEWNIEJ W ZAKRĘTACH.' },
    { name: 'BMX', price: 30, look: { grip: '#3f8a4a' }, mods: { steer: .15, trick: .15 }, note: 'OSTRZEJ W ZAKRĘTACH, TRICKI SZYBCIEJ.' }] },
  biegi: { name: 'PRZERZUTKI', tiers: [
    { name: 'BRAK (JEDEN BIEG)', price: 0, look: { gears: 0 }, mods: {}, note: 'POD GÓRKĘ NOGAMI.' },
    { name: '3 BIEGI', price: 25, look: { gears: 1 }, mods: { acc: .08, hill: .25 }, note: 'RUSZASZ ŻWAWIEJ, GÓRKA MNIEJ BOLI.' },
    { name: '7 BIEGÓW', price: 55, look: { gears: 2 }, mods: { acc: .15, top: .04, hill: .45 }, note: 'POD GÓRKĘ JAK Z GÓRKI. PRAWIE.' }] },
  lakier: { name: 'LAKIER', tiers: [
    { name: 'FABRYCZNY', price: 0, look: {}, mods: {}, note: 'KOLOR, W JAKIM GO ZROBILI.' },
    { name: 'MIĘTOWY', price: 8, look: { paint: '#7fc8a9' }, mods: {}, note: 'ŚWIEŻO. JAK GUMA DO ŻUCIA.' },
    { name: 'GRANATOWY', price: 8, look: { paint: '#2f4a6e' }, mods: {}, note: 'POWAŻNY ROWER DLA POWAŻNEGO CZŁOWIEKA.' },
    { name: 'CYTRYNOWY', price: 8, look: { paint: '#e3c43a' }, mods: {}, note: 'WIDAĆ CIĘ Z KOSMOSU.' },
    { name: 'CZARNY MAT', price: 12, look: { paint: '#2a2c30' }, mods: {}, note: 'JAK Z FILMU. TYLKO ROWER.' },
    { name: 'CZERWONY', price: 8, look: { paint: '#c23a2e' }, mods: {}, note: 'KLASYKA. JAK STRAŻ POŻARNA.' }] },
  dzwonek: { name: 'DZWONEK', tiers: [
    { name: 'BRAK', price: 0, look: { bell: false }, mods: {}, note: 'KRZYCZYSZ SAM.' },
    { name: 'DZWONEK', price: 6, look: { bell: true }, mods: { bell: 1 }, note: 'DRYŃ! PIESI SCHODZĄ Z DROGI WCZEŚNIEJ.' }] },
  lampka: { name: 'LAMPKA', tiers: [
    { name: 'BRAK', price: 0, look: { lamp: false }, mods: {}, note: 'PO CIEMKU NA PAMIĘĆ.' },
    { name: 'LAMPKA', price: 10, look: { lamp: true }, mods: { lamp: 1 }, note: 'PRZEPISOWO. POLICJA SZYBCIEJ ZAPOMINA.' }] },
  torba: { name: 'TORBA', tiers: [
    { name: 'ZWYKŁA (30)', price: 0, look: { bagS: 1 }, mods: {}, note: 'TRZYDZIEŚCI GAZET I KANAPKA.' },
    { name: 'WIĘKSZA (36)', price: 20, look: { bagS: 1.12 }, mods: { bag: 6 }, note: 'SZEŚĆ GAZET WIĘCEJ.' },
    { name: 'LISTONOSZOWA (42)', price: 40, look: { bagS: 1.26 }, mods: { bag: 12 }, note: 'PO LISTONOSZU NA L4. DWANAŚCIE WIĘCEJ.' }] } };
const FINDS = { 'DZWONEK ROWEROWY': { fit: ['dzwonek', 1], sell: 4 }, 'STARA LAMPKA': { fit: ['lampka', 1], sell: 5 }, 'ŁYŻKA DO OPON': { sell: 4 }, 'ŁATKI DO DĘTEK': { sell: 3 }, 'KLUCZ DO SZPRYCH': { sell: 5 },
  'KLUCZ PŁASKI 15': { sell: 4 }, 'DAMSKA TOREBKA': { sell: 8 }, 'MEDALIK NA DROGĘ': { sell: 6 }, 'SOK (CHYBA)': { sell: 2 }, 'SZARLOTKA': { sell: 3 }, 'BILET AUTOBUSOWY': { sell: 2 }, 'ODZNAKA "PRZYJACIEL POSTERUNKU"': { sell: 10 } };
const STATS = [['top', 'PRĘDKOŚĆ'], ['acc', 'PRZYSPIESZENIE'], ['steer', 'SKRĘT'], ['grass', 'NA TRAWIE', -1], ['hill', 'POD GÓRKĘ'], ['stam', 'KONDYCJA'], ['bag', 'TORBA', 0, 12]];
const HELLO_OLD = ['ROMAN, WARSZTAT: CO DLA CIEBIE? TYLKO NIE PYTAJ O RATY.', 'ROMAN, WARSZTAT: ROWER JAK KOŃ. TRZEBA GO KARMIĆ. CZĘŚCIAMI.', 'ROMAN, WARSZTAT: ZNOWU TY? DOBRZE, KASA SIĘ ZGADZA.', 'ROMAN, WARSZTAT: W TYM TYGODNIU PROMOCJA: NIC NIE JEST TAŃSZE, ALE JEST PROMOCJA.'];

export function createShop({ THREE, createRider, game }) {
  // the look: the game dimmed under a dither (as in the pause); on the left pan Janusz himself, standing loose over it (no frame), his
  // speech cloud up to his right, the words popping in one by one; on the right the window of pixel blocks: the bike, how it rides, the shelves
  pixUI(); pixFont();
  const css = document.createElement('style'); css.textContent = `
    #shop { position: fixed; inset: 0; z-index: 8; display: none; place-items: center; color: #f6f3ea; font: 16px/1.25 PTPix, ui-monospace, 'Cascadia Mono', Consolas, monospace; letter-spacing: 0;
      background-color: rgba(10,11,13,.5); background-image: linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%), linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #shop * { image-rendering: pixelated; }
    #shop.on { display: grid; }
    #shop .stage { width: min(1320px, calc(100vw - 24px)); height: min(720px, calc(100vh - 24px)); display: grid; grid-template-columns: minmax(0, 1fr) minmax(600px, 880px); gap: 18px; }
    #shop .janusz { position: relative; min-height: 0; }
    #shop .fig { position: fixed; left: -3vw; bottom: -11vh; height: min(84vh, 64vw); aspect-ratio: 1; pointer-events: none; filter: drop-shadow(8px 6px 0 rgba(0,0,0,.35)); }
    #shop .fig img, #shop .fig canvas { width: 100%; height: 100%; display: block; object-fit: contain; object-position: left bottom; transform-origin: 40% 100%; }
    #shop .fig canvas { display: none; width: 60%; height: 60%; margin-top: 40%; } #shop .fig.noimg canvas { display: block; } #shop .fig.noimg img { display: none; }
    #shop .fig.talk img, #shop .fig.talk canvas { animation: jbob .34s steps(1) infinite; } @keyframes jbob { 50% { transform: translateY(-4px) rotate(-.6deg); } }
    #shop .bubble { position: fixed; z-index: 2; top: 40px; left: 40%; width: 420px; filter: drop-shadow(6px 6px 0 rgba(0,0,0,.4)); }   /* (placed by his head: placeBubble) */
    #shop .bb { background: #f6f3ea; color: #17181b; border: 4px solid #17181b; padding: 14px 18px 14px; min-height: 6.2em; font-size: 16px; line-height: 1.4;
      clip-path: polygon(4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 4px 4px); }
    #shop .bb > b { display: inline-block; color: #f6f3ea; background: #8e2e25; padding: 3px 8px 2px; margin-bottom: 8px; }
    #shop .say { display: block; min-height: 4.2em; } #shop .say span { display: inline-block; animation: wpop .18s steps(3) both; }
    @keyframes wpop { from { opacity: 0; transform: translateY(5px) scale(.5); } to { opacity: 1; transform: none; } }
    #shop .say:after { content: ''; display: inline-block; width: .55em; height: .9em; margin-left: 4px; background: #17181b; vertical-align: -1px; animation: blink .8s steps(1) infinite; } @keyframes blink { 50% { opacity: 0; } }
    #shop .bb .chat { margin-top: 10px; }
    #shop .tail, #shop .tail i { position: absolute; display: block; width: 28px; height: 20px; }
    #shop .tail { left: 4px; top: calc(100% - 6px); transform: scale(1.6) scaleX(-1); transform-origin: 0 0; background: #17181b; clip-path: polygon(8px 0, 28px 0, 28px 4px, 20px 4px, 20px 8px, 16px 8px, 16px 12px, 12px 12px, 12px 16px, 4px 16px, 4px 20px, 0 20px, 0 12px, 4px 12px, 4px 4px, 8px 4px); }
    #shop .tail i { left: 0; top: 0; background: #f6f3ea; clip-path: polygon(12px 0, 24px 0, 24px 4px, 16px 4px, 16px 8px, 12px 8px, 12px 12px, 8px 12px, 8px 4px, 12px 4px); }
    /* the window: its pixel frame; inside, the bike and what it can do on the left, the parts on the right */
    #shop .win { position: relative; z-index: 1; min-height: 0; box-sizing: border-box; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; border: 12px solid transparent; border-image: var(--px-win) 4 fill / 12px; filter: drop-shadow(8px 8px 0 rgba(0,0,0,.35)); }
    #shop .head { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 6px 10px; margin-bottom: 10px; background: linear-gradient(#efc970, #efc970) left bottom / 100% 4px no-repeat; }
    #shop .head b { color: #efc970; font-size: 24px; font-weight: normal; letter-spacing: 0; } #shop .cash { color: #efc970; white-space: nowrap; border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 2px 6px; display: flex; gap: 8px; align-items: center; }
    #shop .coin { width: 14px; height: 14px; background: #efc970; box-shadow: inset -2px -2px 0 #b8902e, inset 2px 2px 0 #f8e6b0; clip-path: polygon(4px 0, 10px 0, 10px 2px, 12px 2px, 12px 4px, 14px 4px, 14px 10px, 12px 10px, 12px 12px, 10px 12px, 10px 14px, 4px 14px, 4px 12px, 2px 12px, 2px 10px, 0 10px, 0 4px, 2px 4px, 2px 2px, 4px 2px); flex: none; }
    #shop .body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); gap: 14px; min-height: 0; }
    #shop .lft { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    #shop canvas.bike { width: 100%; flex: 1 1 auto; min-height: 120px; box-sizing: border-box; border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; background: #1d1e21 padding-box; }
    #shop .stats { display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: center; border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; padding: 6px 6px; }
    #shop .blk { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; } #shop .blk i { height: 10px; background: #33363a; } #shop .blk i.f { background: #efc970; } #shop .blk i.up { background: #9fd27a; animation: bl .5s steps(1) infinite; } #shop .blk i.dn { background: #cf5a3e; animation: bl .5s steps(1) infinite; }
    @keyframes bl { 50% { opacity: .55; } }
    #shop .stats .v { min-width: 3.4em; text-align: right; color: #c9c6bb; } #shop .stats .v.up { color: #9fd27a; } #shop .stats .v.dn { color: #cf5a3e; }
    #shop .rgt { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    #shop .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 4px; flex: none; }
    #shop .cats button { display: flex; align-items: center; gap: 6px; padding: 1px 2px; font-size: 16px; white-space: nowrap; overflow: hidden; } #shop .cats canvas { width: 32px; height: 32px; flex: none; }
    #shop .list { flex: 1; min-height: 0; overflow-y: auto; padding: 2px 6px 2px 2px; scrollbar-width: thin; scrollbar-color: #efc970 #1d1e21; }
    #shop button:not(.pxk) { all: unset; box-sizing: border-box; cursor: pointer; border: 6px solid transparent; border-image: var(--px-btn) 3 fill / 6px; padding: 2px 6px; color: #f6f3ea; }
    #shop button:not(.pxk):hover, #shop button:not(.pxk).pad-focus { border-image-source: var(--px-btn-hi); }
    #shop button:not(.pxk):active { border-image-source: var(--px-btn-dn); transform: translateY(2px); }
    #shop button:not(.pxk).sel { border-image-source: var(--px-sel); color: #17181b; } #shop button:not(.pxk).sel:active { border-image-source: var(--px-sel-dn); }
    #shop button:not(.pxk).off { opacity: .45; cursor: default; } #shop button:not(.pxk).off:active { transform: none; border-image-source: var(--px-btn); }
    #shop .tier { display: grid; grid-template-columns: 34px 1fr auto; gap: 4px 10px; align-items: center; width: 100%; margin-bottom: 4px; padding: 4px 8px 4px 4px; position: relative; }
    #shop .tier canvas { width: 32px; height: 32px; grid-row: span 2; }
    #shop .tier .nm { display: flex; align-items: center; gap: 8px; min-width: 0; } #shop .tier .pips { display: inline-flex; gap: 2px; } #shop .tier .pips i { width: 6px; height: 6px; background: #17181b; } #shop .tier .pips i.on { background: currentColor; }
    #shop .tier .pr { text-align: right; white-space: nowrap; }
    #shop .tier .pr .p { display: inline-flex; align-items: center; gap: 6px; color: #efc970; } #shop .tier .pr .st { color: #9fd27a; } #shop .tier .pr .no { color: #cf5a3e; }
    #shop .tier .d { font-size: 16px; color: #a9a69b; grid-column: 2 / -1; } #shop .tier em { font-style: normal; color: #9fd27a; }
    #shop .tier.sel .d { color: #4a3c1e; } #shop .tier.sel em { color: #2f6b2a; } #shop .tier.sel .pr .st { color: #17181b; } #shop .tier.sel .pips i { background: #b8902e; } #shop .tier.sel .pips i.on { background: #17181b; }
    #shop .tier:hover:before, #shop .tier.pad-focus:before { content: ''; position: absolute; left: -16px; top: 50%; width: 10px; height: 10px; margin-top: -5px; background: var(--px-arrow) 0 0 / 100% 100%; filter: invert(1) sepia(1) saturate(4) hue-rotate(5deg); animation: arr .5s steps(1) infinite; }
    @keyframes arr { 50% { transform: translateX(3px); } }
    #shop .list { padding-left: 16px; margin-left: -12px; }
    #shop h4 { margin: 4px 0 6px; color: #efc970; font-size: 16px; font-weight: normal; } #shop .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; } #shop .row > span:first-child { min-width: 0; }
    #shop .bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 10px; } #shop .bottom small { color: #8d8a80; font-size: 16px; }
    #shop .go { border-image-source: var(--px-sel); color: #17181b; padding: 4px 14px; } #shop .go:hover { border-image-source: var(--px-sel); filter: brightness(1.08); }
    @media (max-height: 640px) { #shop .cats canvas { width: 16px; height: 16px; } #shop .tier canvas { width: 16px; height: 16px; } #shop .tier { grid-template-columns: 18px 1fr auto; } #shop .stats { gap: 3px 8px; } }
    @media (max-width: 1180px) { #shop .stage { grid-template-columns: minmax(0, .7fr) minmax(560px, 1fr); } }
    @media (max-width: 860px) { #shop .stage { grid-template-columns: 1fr; grid-template-rows: 150px minmax(0, 1fr); gap: 10px; height: calc(100vh - 16px); width: calc(100vw - 16px); }
      #shop .fig { position: absolute; height: 100%; left: -10px; bottom: 0; } #shop .bb { min-height: 0; padding: 9px 12px; } #shop .say { min-height: 2.6em; } #shop .tail { left: -16px; bottom: auto; top: 26px; transform: rotate(90deg) scaleX(-1); }
      #shop .body { grid-template-columns: 1fr; overflow-y: auto; align-content: start; } #shop .lft, #shop .rgt { min-height: auto; } #shop .lft { order: 2; } #shop .cats { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); } #shop canvas.bike { height: 22vh; flex: none; } #shop .list { overflow: visible; } }
  `; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'shop'; el.innerHTML = `<div class="stage"><div class="janusz"><div class="fig"><img alt="" src="assets/ui/janusz.png"><canvas class="face" width="32" height="32"></canvas></div><div class="bubble"><div class="bb"><b>PAN JANUSZ</b><span class="say"></span>${pxKey('POGADAJ', { attrs: 'data-chat' })}</div><span class="tail"><i></i></span></div></div><div class="win"><div class="head"><b>WARSZTAT U JANUSZA</b><span class="cash"><i class="coin"></i><span></span></span></div><div class="body"><div class="lft"><canvas class="bike"></canvas><div class="stats"></div></div><div class="rgt"><div class="cats"></div><div class="list"></div></div></div><div class="bottom"><small>NAJEDŹ: PODGLĄD · KLIK: KUP / ZAŁÓŻ</small>${pxKey('JEDŹ DALEJ', { icon: 'play', key: 'ESC', kind: 'gold', attrs: 'data-go', nudge: true })}</div></div></div>`;
  document.body.appendChild(el);
  const cv = el.querySelector('canvas.bike'), right = el.querySelector('.list'), catsE = el.querySelector('.cats'), statsE = el.querySelector('.stats'); el.querySelector('[data-go]').onclick = () => close();
  // pan Janusz: what he says (a line at the top; his talking clip while he says it), his trips with Mietek on asking
  // (each pool shuffled and drawn without repeats; a fresh shuffle never starts with the line just said)
  const AN = bag(), decks = new Map(); let talkT = 0, lastLine = '';
  const pick = a => { let d = decks.get(a); if (!d || !d.length) { d = a.slice().sort(() => Math.random() - .5); if (d.length > 1 && d[d.length - 1] === lastLine) d.unshift(d.pop()); decks.set(a, d); } return (lastLine = d.pop()); };
  const sayE = el.querySelector('.say'), fig = el.querySelector('.fig');
  const say = s => { const w = s.split(/\s+/); sayE.innerHTML = w.map((x, i) => `<span style="animation-delay:${i * 85}ms">${x}</span>`).join(' '); talkT = Math.min(6, .6 + w.length * .09); game.say?.(s); if (open_) requestAnimationFrame(placeBubble); };   // (a longer line: the bubble taller, kept by his mouth)   // (word by word)
  el.querySelector('[data-chat]').onclick = () => say(AN.draw('janusz'));
  // him: the picture (assets/ui/janusz.png); without it his face drawn here in pixels: the cap, the moustache, the chins, the mouth moving
  const faceC = el.querySelector('.face'), fg = faceC.getContext('2d'); let mouthT = 0;
  el.querySelector('.fig img').onerror = () => fig.classList.add('noimg');
  function face(open) { if (!fig.classList.contains('noimg')) return; const P = (x, y, w, h, c) => { fg.fillStyle = c; fg.fillRect(x, y, w, h); };
    P(0, 0, 32, 32, '#e3b83a'); P(0, 26, 32, 6, '#c9a53a');
    P(7, 24, 18, 8, '#9a9c9e'); P(5, 26, 4, 6, '#e3b08a'); P(23, 26, 4, 6, '#e3b08a'); P(10, 24, 3, 3, '#e3b08a'); P(19, 24, 3, 3, '#e3b08a');   // the tank top, his arms and shoulders
    P(9, 10, 14, 13, '#e3b08a'); P(8, 12, 1, 6, '#e3b08a'); P(23, 12, 1, 6, '#e3b08a'); P(10, 22, 12, 2, '#d49a74'); P(11, 23, 10, 2, '#e3b08a');   // the face, the chins
    P(7, 13, 2, 3, '#d49a74'); P(23, 13, 2, 3, '#d49a74');                                                                                       // the ears
    P(8, 5, 16, 6, '#c23a2e'); P(9, 4, 14, 1, '#c23a2e'); P(8, 10, 19, 2, '#8e2e25'); P(15, 6, 2, 2, '#f6f3ea');                                 // the cap, its visor, its badge
    P(11, 14, 3, 1, '#5b3a22'); P(18, 14, 3, 1, '#5b3a22'); P(12, 15, 2, 2, '#17181b'); P(18, 15, 2, 2, '#17181b'); P(12, 15, 1, 1, '#f6f3ea'); P(18, 15, 1, 1, '#f6f3ea');   // brows, eyes
    P(15, 16, 2, 3, '#d49a74');                                                                                                                  // the nose
    P(11, 19, 10, 2, '#5b3a22'); P(10, 20, 2, 1, '#5b3a22'); P(20, 20, 2, 1, '#5b3a22');                                                       // the moustache
    if (open) { P(14, 21, 4, 2, '#5e1c17'); P(15, 22, 2, 1, '#cf5a3e'); } else P(14, 21, 4, 1, '#5e1c17');                                       // the mouth
    for (const [x, y] of [[12, 22], [19, 22], [16, 23], [13, 18], [20, 18]]) P(x, y, 1, 1, '#c98a6a'); }                                          // stubble
  face(false); setInterval(() => { if (!open_) return; const talking = talkT > 0; mouthT += .12; face(talking && Math.sin(mouthT * 9) > 0); }, 110);
  // what you have: per part, the tiers you could put on (the plain one, the one on, your spares; for the paint the ones bought) and the one on
  const on = new Proxy({}, { get: (_, k) => game.bike.parts[k], set: (_, k, v) => { game.bike.parts[k] = v; return true; } });
  const owned = new Proxy({}, { get: (_, k) => new Set([0, game.bike.parts[k], ...(k === 'lakier' ? [...game.paints] : game.inv.filter(p => p.k === k).map(p => p.tier))]) });
  const reset = () => { };
  let cat = 'kola', hover = null, open_ = false;
  const mods = alt => bikeMods(game.bike, alt), look = alt => bikeLook(game.bike, alt);
  // (a part put on: the one it takes the place of to the spares, the paint only painted over; one of the spares: out of them)
  function mount(k, i) { const P = game.bike.parts; if (P[k] === i) return; if (k !== 'lakier') { const j = game.inv.findIndex(p => p.k === k && p.tier === i); if (j >= 0) game.inv.splice(j, 1); if (P[k] > 0) game.inv.push({ k, tier: P[k] }); } P[k] = i; }
  // the turntable: its own little picture, the bike without the boy
  let R = null, ren = null, sc = null, cam = null, raf = 0, last = 0;
  function preview() {
    if (!ren) { ren = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true }); ren.setPixelRatio(1); sc = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 16 / 9, .1, 50); cam.position.set(2.55, 1.05, 0); cam.lookAt(0, .52, 0);
      sc.add(new THREE.HemisphereLight('#fff3dc', '#3a3d42', 1.6)); const d = new THREE.DirectionalLight('#ffffff', 1.4); d.position.set(2, 3, 1.5); sc.add(d);
      R = createRider(); R.boy.visible = false; sc.add(R.root); }
    const w = cv.clientWidth || 400, h = cv.clientHeight || 300; ren.setSize(Math.round(w / 2), Math.round(h / 2), false); cam.aspect = w / h; cam.updateProjectionMatrix();   // (half resolution: pixels like the game's)
    R.setParts(look(hover));
  }
  function spin(t) { if (!open_) return; const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; R.root.rotation.y += dt * .55;
    talkT = Math.max(0, talkT - dt); fig.classList.toggle('talk', talkT > 0);
    ren.render(sc, cam); raf = requestAnimationFrame(spin); }
  // the lists
  // the newspapers' icon (for the tab of papers, food and finds)
  function paperIcon() { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), P = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
    P(2, 3, 12, 10, '#17181b'); P(3, 4, 10, 8, '#f6f3ea'); P(4, 5, 8, 2, '#8e2e25'); P(4, 8, 3, 3, '#9a968c'); P(8, 8, 4, 1, '#9a968c'); P(8, 10, 4, 1, '#9a968c'); P(13, 5, 2, 8, '#d3d0c3'); return c; }
  const tierCol = (k, i) => k === 'lakier' ? '#c9cbc8' : TIER_COL[Math.min(3, i)];
  function drawStats() {
    el.querySelector('.cash span').textContent = game.money + ' ZŁ';
    const m0 = mods(), m1 = hover ? mods(hover) : m0; statsE.innerHTML = '';
    for (const [k, n, sgn = 1, max = .5] of STATS) { const f = v => k === 'bag' ? (30 + v) / 42 : Math.max(0, Math.min(1, .5 + sgn * v / max * .5)), a = Math.round(f(m0[k]) * 10), b = Math.round(f(m1[k]) * 10);
      const val = v => k === 'bag' ? String(30 + v) : (sgn * v > 0 ? '+' : '') + Math.round(sgn * v * 100) + '%', d = m1[k] === m0[k] ? '' : sgn * (m1[k] - m0[k]) > 0 ? 'up' : 'dn';
      const bl = Array.from({ length: 10 }, (_, j) => `<i class="${j < Math.min(a, b) ? 'f' : j < Math.max(a, b) ? (b > a ? 'up' : 'dn') : ''}"></i>`).join('');
      statsE.insertAdjacentHTML('beforeend', `<span>${n}</span><span class="blk">${bl}</span><span class="v ${d}">${val(m1[k])}</span>`); } }
  const peek = h => { hover = h; R && R.setParts(look(hover)); drawStats(); };
  function draw() { const keep = right.scrollTop; drawStats();
    catsE.innerHTML = ''; for (const k of [...Object.keys(PARTS), 'gazety']) { const b = document.createElement('button'); b.className = k === cat ? 'sel' : ''; b.dataset.cat = k;
      b.appendChild(k === 'gazety' ? paperIcon() : icon(k, k === cat ? '#17181b' : tierCol(k, Math.max(1, on[k] || 0)), k === 'lakier' ? look().paint : null)); b.insertAdjacentHTML('beforeend', `<span>${k === 'gazety' ? 'GAZETY' : PARTS[k].name}</span>`);
      b.onclick = () => { if (cat === k) return; cat = k; hover = null; R && R.setParts(look()); if (k !== 'gazety') say(pick(JANUSZ.cats[k] || JANUSZ.buy)); draw(); right.scrollTop = 0; }; catsE.appendChild(b); }
    right.innerHTML = '';
    if (cat !== 'gazety') PARTS[cat].tiers.forEach((t, i) => { const has = owned[cat].has(i), isOn = on[cat] === i, afford = game.money >= t.price, b = document.createElement('button'), n = PARTS[cat].tiers.length - 1;
      b.className = 'tier' + (isOn ? ' sel' : '') + (!has && !afford ? ' off' : '');
      const state = isOn ? '<span class="st">ZAŁOŻONE</span>' : has ? '<span class="st">MASZ · ZAŁÓŻ</span>' : `<span class="p ${afford ? '' : 'no'}"><i class="coin"></i>${t.price} ZŁ</span>`;
      b.innerHTML = `<span class="nm"><span>${t.name}</span>${cat === 'lakier' ? '' : `<span class="pips" style="color:${tierCol(cat, i)}">${Array.from({ length: n }, (_, j) => `<i class="${j < i ? 'on' : ''}"></i>`).join('')}</span>`}</span><span class="pr">${state}</span><span class="d">${t.note}${Object.keys(t.mods).length ? ' · <em>' + fx(t.mods) + '</em>' : ''}</span>`;
      b.prepend(icon(cat, tierCol(cat, i), cat === 'lakier' ? (t.look.paint || bikeLook({ ...game.bike, parts: { ...game.bike.parts, lakier: 0 } }).paint) : null));
      b.onpointerenter = () => peek([cat, i]); b.onpointerleave = () => peek(null);
      b.onclick = () => buy(cat, i); right.appendChild(b); });
    else {
      // the bag filled; one title in particular; a bun; your finds
      const m0 = mods(), max = 30 + m0.bag, need = Math.max(0, max - game.papers), cost = Math.ceil(need / 2);
      right.insertAdjacentHTML('beforeend', `<h4>GAZETY</h4><div class="row"><span>TORBA: ${game.papers}/${max}</span><button data-fill ${need && game.money >= cost ? '' : 'class="off"'}>DOPEŁNIJ +${need} · ${cost} ZŁ</button></div>` +
        (game.titles || []).map(t => `<div class="row"><span style="color:${t.col}">${t.name}: ${t.n}</span><button data-tt="${t.key}" ${need >= 1 && game.money >= 3 ? '' : 'class="off"'}>+${Math.min(5, need)} · 3 ZŁ</button></div>`).join(''));
      right.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => { const k = Math.min(5, need); if (k < 1 || game.money < 3) return; game.money -= 3; game.addTitle(b.dataset.tt, k); changed(); });
      right.insertAdjacentHTML('beforeend', `<h4>NA DROGĘ</h4><div class="row"><span>DROŻDŻÓWKA (ZDROWIE ${Math.round(game.hp)}/100)</span><button data-bun ${game.money >= 5 && game.hp < 100 ? '' : 'class="off"'}>+40 · 5 ZŁ</button></div>`);
      right.querySelector('[data-bun]').addEventListener('click', () => { if (game.money < 5 || game.hp >= 100) return; game.money -= 5; game.hp = Math.min(100, game.hp + 40); changed(); });
      const items = game.items; right.insertAdjacentHTML('beforeend', '<h4>FANTY</h4>' + (items.length ? '' : '<div class="row"><span style="color:#8d8a80">NIC NIE ZNALAZŁEŚ. JESZCZE.</span></div>'));
      items.forEach((it, i) => { const F = FINDS[it] || { sell: 3 }, fit = F.fit && !owned[F.fit[0]].has(F.fit[1]);
        right.insertAdjacentHTML('beforeend', `<div class="row"><span>${it}</span><span>${fit ? `<button data-fit="${i}">ZAMONTUJ</button> ` : ''}<button data-sell="${i}">SPRZEDAJ +${F.sell} ZŁ</button></span></div>`); });
      right.querySelector('[data-fill]')?.addEventListener('click', () => { if (!need || game.money < cost) { if (need) say(pick(JANUSZ.broke)); return; } game.money -= cost; game.papers += need; say(pick(JANUSZ.fill)); changed(); });
      right.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const i = +b.dataset.sell, it = items[i]; game.money += (FINDS[it] || { sell: 3 }).sell; items.splice(i, 1); say(pick(JANUSZ.sell)); changed(); });
      right.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { const i = +b.dataset.fit, F = FINDS[items[i]]; mount(F.fit[0], F.fit[1]); items.splice(i, 1); game.flash('Zamontowane: ' + PARTS[F.fit[0]].tiers[F.fit[1]].name.toLowerCase()); changed(); }); }
    right.scrollTop = keep;
  }
  const fx = m => Object.entries(m).filter(([k]) => !['bell', 'lamp'].includes(k)).map(([k, v]) => (k === 'bag' ? `+${v} GAZET` : `${(k === 'grass' ? -v : v) > 0 ? '+' : ''}${Math.round((k === 'grass' ? -v : v) * 100)}% ${(STATS.find(s => s[0] === k) || [0, k])[1]}`)).join(', ');
  function buy(k, i) { const t = PARTS[k].tiers[i]; if (!owned[k].has(i)) { if (game.money < t.price) { say(pick(JANUSZ.broke)); return; } game.money -= t.price; if (k === 'lakier') game.paints.add(i); else if (i > 0) game.inv.push({ k, tier: i }); if (i > 0) say(pick(JANUSZ.buy)); } mount(k, i); hover = null; changed(); }
  function changed() { game.onChange(); R && R.setParts(look()); draw(); }
  // the bubble by his head: its left edge over his face's right side, its bottom at his mouth (the tail there); as wide as there is room
  // for before the window of parts (on a narrow screen, the window under him: to the screen's edge)
  const bub = el.querySelector('.bubble'), win = el.querySelector('.win');
  function placeBubble() { const f = (fig.querySelector('img:not([style*="none"])') && !fig.classList.contains('noimg') ? fig : fig.querySelector('canvas') || fig).getBoundingClientRect(), w = win.getBoundingClientRect(), narrow = innerWidth <= 820;
    const left = Math.max(8, f.left + f.width * (narrow ? .5 : .36)), room = (narrow ? innerWidth - 12 : w.left - 18) - left, width = Math.max(240, Math.min(460, room)), h = bub.offsetHeight || 140;
    const mouthY = f.top + f.height * (narrow ? .42 : .25), top = Math.max(8, mouthY - h - 18);
    Object.assign(bub.style, { left: left + 'px', top: top + 'px', width: width + 'px' }); }
  addEventListener('resize', () => { if (open_) placeBubble(); });
  function open() { if (open_) return; open_ = true; el.classList.add('on'); requestAnimationFrame(placeBubble); setTimeout(placeBubble, 120); say(pick(JANUSZ.hello)); preview(); draw(); last = performance.now(); raf = requestAnimationFrame(spin); }
  function close() { if (!open_) return; open_ = false; el.classList.remove('on'); cancelAnimationFrame(raf); game.onChange(); game.bye?.(pick(JANUSZ.bye)); }
  function key(e) { if (!open_) return false; if (e.code === 'Escape' || e.code === 'Enter') close(); e.preventDefault(); return true; }
  // (for the run's end: what you have, on the bike and spare; and back from the account at a run's start: spare, on if better)
  const ownedList = () => { const out = [], add = (k, i) => out.push({ label: PARTS[k].name + ': ' + PARTS[k].tiers[i].name, keep: { part: k, tier: i } });
    for (const k in PARTS) if (game.bike.parts[k] > 0) add(k, game.bike.parts[k]); for (const p of game.inv) add(p.k, p.tier); for (const i of game.paints) if (i > 0 && i !== game.bike.parts.lakier) add('lakier', i); return out; };
  function grant(k, i) { if (!PARTS[k] || !PARTS[k].tiers[i]) return; if (k === 'lakier') game.paints.add(i); else game.inv.push({ k, tier: i }); if (i > game.bike.parts[k]) mount(k, i); game.onChange(); }
  const equipped = () => Object.keys(PARTS).map(k => ({ cat: PARTS[k].name, name: PARTS[k].tiers[on[k]].name }));
  return { open, close, key, get isOpen() { return open_; }, mods, look, ownedList, grant, equipped, PARTS, reset: () => { reset(); game.onChange(); } };
}
