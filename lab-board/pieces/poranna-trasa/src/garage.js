// The inventory page (I): your bike on the bench, side on, and its slots where the parts are on it (the wheels, the saddle, the
// handlebar, the gears, the paint, the bell, the lamp, the bag), each joined by a line to its part; your spare parts in a grid; a bike
// standing by you (a garden's, one you left) with its parts to take off; how the bike rides, and what a part would change. A slot
// chosen: what could go in it (the plain one, your spares, the one on the bike by you, the paints you have) and taking off what is on
// it. Changing parts: when you are stopped (on foot, or standing still); riding, only to look. The game waits while it is open.
// The look as the game's other pages: the picture dimmed under a dither, windows of pixel blocks.
// createGarage({ THREE, createRider, PARTS, SLOTS, TYPES, bikeMods, bikeLook, game }) → { open(), close(), toggle(), key(e), get isOpen }
//   game: { bike (the one ridden), inv ([{ k, tier }]), paints (Set), near() (a bike stood by you: { bike, r, owner, ... } or null),
//     stopped(), onChange(), takeNear(w), flash(s), sound(name), keyName (the key that opens it) }

import { pixUI } from './pixui.js';
import { pixFont } from './pixfont.js';
export const TIER_COL = ['#9a968c', '#9fd27a', '#8fc3f0', '#efc970'];
const SLOT_NAME = { kola: 'KOŁA', siodelko: 'SIODEŁKO', kierownica: 'KIEROWNICA', biegi: 'PRZERZUTKI', lakier: 'LAKIER', dzwonek: 'DZWONEK', lampka: 'LAMPKA', torba: 'TORBA' };
const STATS = [['top', 'PRĘDKOŚĆ', 1, .45], ['acc', 'PRZYSPIESZENIE', 1, .45], ['steer', 'SKRĘT', 1, .45], ['grass', 'TEREN', -1, .6], ['hill', 'POD GÓRKĘ', 1, .6], ['stam', 'KONDYCJA', 1, .5], ['trick', 'TRIKI', 1, .5], ['bag', 'TORBA']];

// the icons: 16 x 16 pixels each, drawn in the part's colour (its tier's: plain grey, then green, blue, gold)
export function icon(slot, col, paint) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), P = (x, y, w = 1, h = 1, k = col) => { g.fillStyle = k; g.fillRect(x, y, w, h); }, D = '#17181b';
  if (slot === 'kola') { for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; P(Math.round(8 + Math.cos(t) * 6.5), Math.round(8 + Math.sin(t) * 6.5)); P(Math.round(8 + Math.cos(t) * 5.5), Math.round(8 + Math.sin(t) * 5.5), 1, 1, D); }
    for (let r = 1; r < 5; r++) { P(8 + r, 8, 1, 1, '#d3d0c3'); P(8 - r, 8, 1, 1, '#d3d0c3'); P(8, 8 + r, 1, 1, '#d3d0c3'); P(8, 8 - r, 1, 1, '#d3d0c3'); } P(7, 7, 2, 2); }
  else if (slot === 'siodelko') { P(2, 5, 12, 1, D); P(2, 6, 12, 3); P(3, 9, 6, 1); P(1, 6, 1, 2); P(12, 5, 3, 2); P(7, 10, 2, 5, '#9a9c9e'); P(5, 14, 6, 1, '#9a9c9e'); P(3, 6, 4, 1, '#f6f3ea'); }
  else if (slot === 'kierownica') { P(1, 5, 4, 2); P(11, 5, 4, 2); P(4, 6, 8, 1, '#9a9c9e'); P(5, 7, 6, 1, '#9a9c9e'); P(7, 7, 2, 8, '#9a9c9e'); P(1, 4, 2, 1, '#f6f3ea'); P(13, 4, 2, 1, '#f6f3ea'); }
  else if (slot === 'biegi') { for (let a = 0; a < 12; a++) { const t = a / 12 * 6.283; P(Math.round(8 + Math.cos(t) * 6), Math.round(8 + Math.sin(t) * 6), 2, 2); } for (let a = 0; a < 28; a++) { const t = a / 28 * 6.283; P(Math.round(8 + Math.cos(t) * 4.5), Math.round(8 + Math.sin(t) * 4.5)); } P(7, 7, 2, 2, D); }
  else if (slot === 'lakier') { P(4, 3, 8, 1, '#9a9c9e'); P(3, 4, 10, 10, '#c9cbc8'); P(3, 6, 10, 5, paint || col); P(5, 1, 6, 2, D); P(6, 0, 4, 1, '#9a9c9e'); P(4, 14, 8, 1, '#7a7c7e'); P(4, 5, 1, 8, '#f6f3ea'); }
  else if (slot === 'dzwonek') { P(5, 4, 6, 1); P(4, 5, 8, 4); P(3, 9, 10, 2); P(7, 2, 2, 2, '#9a9c9e'); P(5, 5, 2, 2, '#f6f3ea'); P(11, 11, 3, 2, '#9a9c9e'); P(2, 12, 12, 1, D); }
  else if (slot === 'lampka') { P(3, 5, 7, 6, '#44484c'); P(10, 4, 2, 8); P(12, 5, 1, 6, '#f6f3ea'); P(13, 6, 2, 1, col); P(13, 9, 2, 1, col); P(14, 7, 2, 2, col); P(5, 11, 2, 3, '#9a9c9e'); }
  else if (slot === 'torba') { P(3, 5, 10, 9); P(3, 5, 10, 3, D); P(4, 6, 8, 1); P(7, 8, 2, 2, '#efc970'); P(5, 2, 1, 4, '#5a4030'); P(10, 2, 1, 4, '#5a4030'); P(5, 2, 6, 1, '#5a4030'); P(3, 13, 10, 1, '#5a4030'); }
  return c; }

export function createGarage({ THREE, createRider, PARTS, SLOTS, TYPES, bikeMods, bikeLook, game }) {
  pixUI(); pixFont();
  const css = document.createElement('style'); css.textContent = `
    #gar { position: fixed; inset: 0; z-index: 8; display: none; place-items: center; color: #f6f3ea; font: 700 12px/1.35 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: .03em;
      background-color: rgba(10,11,13,.5); background-image: linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%), linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #gar.on { display: grid; }
    #gar .stage { width: min(1180px, calc(100vw - 24px)); height: min(720px, calc(100vh - 24px)); display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(330px, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 14px; }
    #gar .win { position: relative; min-height: 0; box-sizing: border-box; display: flex; flex-direction: column; background: #25272b; border: 3px solid #17181b; box-shadow: 0 0 0 3px #d3d0c3, 0 0 0 6px #17181b, 8px 8px 0 6px rgba(0,0,0,.35); }
    #gar .head { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #17181b; padding: 8px 14px; border-bottom: 3px solid #efc970; }
    #gar .head b { color: #efc970; font-size: 14px; letter-spacing: .14em; } #gar .head small { font-size: 10px; opacity: .7; letter-spacing: .06em; text-transform: none; }
    #gar .tag { background: #33363a; padding: 3px 9px; color: #efc970; box-shadow: inset 2px 2px 0 #44484c, inset -2px -2px 0 #1d1e21; white-space: nowrap; }
    #gar .bench { position: relative; flex: 1; min-height: 0; overflow: hidden; background-color: #2b2d31;
      background-image: radial-gradient(#1e2023 1.4px, transparent 1.6px); background-size: 14px 14px; background-position: 7px 7px; }   /* a pegboard */
    #gar .bench:after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 18%; background: repeating-linear-gradient(90deg, #3a3c40 0 46px, #34363a 46px 48px); border-top: 4px solid #17181b; pointer-events: none; }
    #gar canvas.bike { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; z-index: 1; }
    #gar canvas.lines { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; pointer-events: none; image-rendering: pixelated; }
    #gar .slot { all: unset; position: absolute; z-index: 3; width: 52px; height: 52px; margin: -26px 0 0 -26px; box-sizing: border-box; cursor: pointer; display: grid; place-items: center; background: #1d1e21;
      box-shadow: 0 0 0 3px #17181b, inset 2px 2px 0 #44484c, inset -2px -2px 0 #111214; transition: transform .08s steps(2); }
    #gar .slot canvas { width: 32px; height: 32px; image-rendering: pixelated; } #gar .slot .pip { position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); display: flex; gap: 2px; } #gar .slot .pip i { width: 4px; height: 4px; background: #44484c; } #gar .slot .pip i.on { background: currentColor; }
    #gar .slot .nm { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: 10px; padding: 2px 6px; background: #17181b; color: #d3d0c3; pointer-events: none; }
    #gar .slot:hover, #gar .slot.pad-focus { transform: translateY(-2px); box-shadow: 0 0 0 3px #17181b, 0 0 0 5px #d3d0c3, inset 2px 2px 0 #44484c, inset -2px -2px 0 #111214; } #gar .slot:hover .nm { color: #f6f3ea; }
    #gar .slot.sel { background: #3a3220; box-shadow: 0 0 0 3px #17181b, 0 0 0 6px #efc970, inset 2px 2px 0 #5a4c2e, inset -2px -2px 0 #1d1e21; animation: gsel .7s steps(2) infinite; } #gar .slot.sel .nm { background: #efc970; color: #17181b; }
    @keyframes gsel { 50% { box-shadow: 0 0 0 3px #17181b, 0 0 0 6px #f6e2a8, inset 2px 2px 0 #5a4c2e, inset -2px -2px 0 #1d1e21; } }
    #gar .slot.plain canvas { opacity: .45; } #gar .slot.new:after { content: ''; position: absolute; top: -5px; right: -5px; width: 8px; height: 8px; background: #9fd27a; box-shadow: 0 0 0 2px #17181b; }
    #gar .lock { position: absolute; z-index: 4; left: 50%; top: 12px; transform: translateX(-50%); background: #8e2e25; color: #f6f3ea; padding: 5px 10px; box-shadow: 0 0 0 3px #17181b; display: none; } #gar .lock.on { display: block; }
    #gar .side { overflow: hidden; } #gar .scroll { flex: 1; overflow-y: auto; padding: 10px 14px 12px; min-height: 0; }
    #gar h4 { margin: 12px 0 6px; color: #efc970; font-size: 11px; letter-spacing: .12em; display: flex; justify-content: space-between; } #gar h4:first-child { margin-top: 0; } #gar h4 span { color: #9a968c; }
    #gar .stats { display: grid; grid-template-columns: auto 1fr auto; gap: 4px 10px; font-size: 11px; align-items: center; background: #1d1e21; padding: 8px 10px; box-shadow: inset 2px 2px 0 #17181b, inset -2px -2px 0 #33363a; }
    #gar .blk { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; } #gar .blk i { height: 9px; background: #33363a; } #gar .blk i.f { background: #efc970; } #gar .blk i.up { background: #9fd27a; } #gar .blk i.dn { background: #cf5a3e; }
    #gar .stats .v { min-width: 3.6em; text-align: right; color: #c9c6bb; } #gar .stats .v.up { color: #9fd27a; } #gar .stats .v.dn { color: #cf5a3e; }
    #gar button.opt { all: unset; box-sizing: border-box; cursor: pointer; display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; align-items: center; width: 100%; margin-bottom: 6px; padding: 6px 8px; background: #33363a; border: 2px solid #17181b; box-shadow: inset 2px 2px 0 #4a4d52, inset -2px -2px 0 #1d1e21; }
    #gar button.opt canvas { width: 32px; height: 32px; image-rendering: pixelated; } #gar button.opt .d { display: block; font-size: 10px; opacity: .75; margin-top: 2px; text-transform: none; } #gar button.opt .d em { font-style: normal; color: #9fd27a; }
    #gar button.opt .act { font-size: 10px; color: #efc970; white-space: nowrap; } #gar button.opt:hover, #gar button.opt.pad-focus { background: #3e4146; } #gar button.opt.on { background: #2f3b26; } #gar button.opt.on .act { color: #9fd27a; }
    #gar button.opt.off { opacity: .45; cursor: default; } #gar .from { color: #8fc3f0; }
    #gar .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 8px; } #gar .tile { all: unset; cursor: pointer; position: relative; aspect-ratio: 1; display: grid; place-items: center; background: #1d1e21; box-shadow: 0 0 0 2px #17181b, inset 2px 2px 0 #44484c, inset -2px -2px 0 #111214; }
    #gar .tile canvas { width: 32px; height: 32px; image-rendering: pixelated; } #gar .tile:hover, #gar .tile.pad-focus { box-shadow: 0 0 0 2px #17181b, 0 0 0 4px #d3d0c3; } #gar .tile .n { position: absolute; top: 2px; right: 3px; font-size: 9px; color: #d3d0c3; }
    #gar .empty { font-size: 10px; opacity: .6; text-transform: none; padding: 6px 0; } #gar .help { font-size: 10px; text-transform: none; color: #c9c6bb; background: #1d1e21; padding: 8px 10px; line-height: 1.5; }
    #gar .near { grid-column: 1 / -1; display: none; } #gar .near.on { display: flex; } #gar .near .row { display: flex; gap: 10px; align-items: center; padding: 8px 14px; flex: 1; flex-wrap: wrap; }
    #gar .near .row .tile { width: 52px; } #gar .near .who { min-width: 190px; } #gar .near .who b { color: #8fc3f0; display: block; font-size: 13px; } #gar .near .who small { font-size: 10px; opacity: .7; text-transform: none; }
    #gar button.big { all: unset; cursor: pointer; padding: 9px 14px; background: #efc970; color: #17181b; box-shadow: inset 2px 2px 0 #f6e2a8, inset -2px -2px 0 #b8902e; white-space: nowrap; } #gar button.big.blue { background: #8fc3f0; box-shadow: inset 2px 2px 0 #c9e3f8, inset -2px -2px 0 #4f7fa8; }
    #gar button.big:hover, #gar button.big.pad-focus { filter: brightness(1.08); outline: 3px solid #f6f3ea; } #gar .foot { display: flex; justify-content: flex-end; gap: 10px; padding: 10px 14px; border-top: 3px solid #17181b; background: #1d1e21; }
    #gar .tip { position: fixed; z-index: 9; pointer-events: none; display: none; max-width: 240px; padding: 6px 8px; background: #f6f3ea; color: #17181b; box-shadow: 0 0 0 3px #17181b, 5px 5px 0 3px rgba(0,0,0,.35); font-size: 10px; } #gar .tip.on { display: block; } #gar .tip b { display: block; font-size: 11px; } #gar .tip span { text-transform: none; }
    @media (max-width: 860px) { #gar .stage { grid-template-columns: 1fr; grid-template-rows: minmax(250px, 1fr) minmax(0, 1fr) auto; height: calc(100vh - 16px); width: calc(100vw - 16px); gap: 10px; } }
    /* the pixel look (pixui.js, pixfont.js): the letters, the windows' and buttons' frames */
    #gar { font: 16px/1.25 PTPix, ui-monospace, 'Cascadia Mono', Consolas, monospace; letter-spacing: 0; } #gar * { image-rendering: pixelated; }
    #gar .win { border: 12px solid transparent; border-image: var(--px-win) 4 fill / 12px; background: none; box-shadow: none; filter: drop-shadow(8px 8px 0 rgba(0,0,0,.35)); }
    #gar .head { background: linear-gradient(#efc970, #efc970) left bottom / 100% 4px no-repeat; border: 0; padding: 4px 6px 10px; } #gar .head b { font-size: 24px; font-weight: normal; letter-spacing: 0; } #gar .head small { font-size: 16px; color: #a9a69b; opacity: 1; }
    #gar .tag { border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; box-shadow: none; background: none; padding: 1px 6px; }
    #gar .stats { border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; box-shadow: none; background: none; padding: 6px; gap: 6px 10px; font-size: 16px; } #gar .blk i { height: 10px; }
    #gar h4 { font-size: 16px; font-weight: normal; letter-spacing: 0; } #gar .empty, #gar .help, #gar button.opt .d, #gar .tip, #gar .tip b, #gar .near .who small, #gar button.opt .act { font-size: 16px; }
    #gar .help { border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; background: none; padding: 4px 6px; line-height: 1.3; }
    #gar button.opt { border: 6px solid transparent; border-image: var(--px-btn) 3 fill / 6px; background: none; box-shadow: none; padding: 2px 6px 2px 2px; margin-bottom: 4px; }
    #gar button.opt:hover, #gar button.opt.pad-focus { background: none; border-image-source: var(--px-btn-hi); } #gar button.opt:active { border-image-source: var(--px-btn-dn); transform: translateY(2px); }
    #gar button.opt.on { background: none; border-image-source: var(--px-tab-on); } #gar button.opt .d { color: #a9a69b; opacity: 1; }
    #gar .tile { border: 6px solid transparent; border-image: var(--px-inset) 3 fill / 6px; box-shadow: none; background: none; box-sizing: border-box; } #gar .tile:hover, #gar .tile.pad-focus { box-shadow: none; border-image-source: var(--px-btn-hi); } #gar .tile .n { font-size: 16px; top: -4px; right: -2px; }
    #gar .slot .nm { font-size: 12px; padding: 1px 4px; } #gar .slot:hover .nm, #gar .slot.sel .nm { z-index: 5; } #gar .near .who b { font-size: 16px; font-weight: normal; }
    #gar button.big { border: 6px solid transparent; border-image: var(--px-sel) 3 fill / 6px; background: none; box-shadow: none; padding: 3px 12px; } #gar button.big.blue { background: none; box-shadow: none; border-image-source: var(--px-blue); }
    #gar button.big:hover, #gar button.big.pad-focus { outline: 0; filter: brightness(1.1); } #gar button.big:active { transform: translateY(2px); }
    #gar .foot { background: none; border-top: 4px solid #17181b; padding: 10px 6px 4px; } #gar .lock { font-size: 16px; } #gar .tip { box-shadow: 0 0 0 4px #17181b, 6px 6px 0 4px rgba(0,0,0,.35); max-width: 300px; }`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'gar';
  el.innerHTML = `<div class="stage"><div class="win main"><div class="head"><div><b class="ttl">EKWIPUNEK</b><br><small class="note"></small></div><span class="tag typ"></span></div><div class="bench"><canvas class="bike"></canvas><canvas class="lines"></canvas><div class="lock">JEDZIESZ: ZATRZYMAJ SIĘ, ŻEBY PRZEKŁADAĆ CZĘŚCI</div></div></div>
    <div class="win side"><div class="head"><b>CO DAJE ROWER</b><span class="tag inv"></span></div><div class="scroll"><div class="stats"></div><div class="det"></div><h4>CZĘŚCI ZAPASOWE <span class="cnt"></span></h4><div class="grid spare"></div></div><div class="foot"><button class="big close">ZAMKNIJ</button></div></div>
    <div class="win near"><div class="row"><div class="who"></div><div class="grid nparts" style="display:flex;gap:8px;flex:1"></div><button class="big blue take">PRZESIĄDŹ SIĘ</button></div></div></div><div class="tip"></div>`;
  document.body.appendChild(el);
  const $ = q => el.querySelector(q), bench = $('.bench'), cv = $('canvas.bike'), lc = $('canvas.lines'), lg = lc.getContext('2d'), tip = $('.tip');
  $('.close').onclick = () => close(); $('.take').onclick = () => { const w = game.near(); if (w && game.stopped()) { close(); game.takeNear(w); } };
  let open_ = false, sel = null, hover = null, raf = 0, ren = null, sc = null, cam = null, R = null, slotEls = {}, seen = new Set();
  const B = () => game.bike, can = () => game.stopped(), tierOf = (k, i) => PARTS[k].tiers[i] || PARTS[k].tiers[0];
  const partCol = (k, i) => k === 'lakier' ? '#c9cbc8' : TIER_COL[Math.min(3, i)];
  const fx = m => Object.entries(m).filter(([k]) => !['bell', 'lamp'].includes(k)).map(([k, v]) => k === 'bag' ? `${v > 0 ? '+' : ''}${v} GAZET` : `${(k === 'grass' ? -v : v) > 0 ? '+' : ''}${Math.round((k === 'grass' ? -v : v) * 100)}% ${(STATS.find(s => s[0] === k) || [0, k])[1]}`).join(', ');
  const tipShow = (e, h) => { tip.innerHTML = h; tip.classList.add('on'); const x = Math.min(innerWidth - 250, e.clientX + 16), y = Math.min(innerHeight - 90, e.clientY + 14); tip.style.left = x + 'px'; tip.style.top = y + 'px'; }, tipHide = () => tip.classList.remove('on');

  // ---------- the bench: the bike, side on, half the screen's pixels (as the game's), lit as in the shop ----------
  function setup() { if (ren) return; ren = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true }); ren.setPixelRatio(1); sc = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 1.6, .1, 50);
    sc.add(new THREE.HemisphereLight('#fff3dc', '#3a3d42', 1.7)); const d = new THREE.DirectionalLight('#ffffff', 1.5); d.position.set(3, 3.5, 1.2); sc.add(d);
    R = createRider(); R.boy.visible = false; sc.add(R.root); R.update({ dt: 0, speed: 0, steer: .08, lean: 0, pedalling: 0, braking: 0, climbing: 0, look: null, nervous: 0, kick: null, air: false, fallen: 0, charge: null });
    R.root.rotation.y = Math.PI / 2; }   // (the front to the right)
  function sizeBench() { const w = bench.clientWidth, h = bench.clientHeight; ren.setSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)), false); lc.width = Math.round(w / 2); lc.height = Math.round(h / 2);
    cam.aspect = w / Math.max(1, h); const fit = Math.max(1, 1.55 / cam.aspect); cam.position.set(0, .78, 4.1 * fit); cam.lookAt(0, .5, 0); cam.updateProjectionMatrix(); }
  // where on the bench each part is, in the bench's own pixels (half the screen's)
  const _v = new THREE.Vector3();
  function anchorPx(k) { const A = R.anchors, w = lc.width, h = lc.height; R.root.updateMatrixWorld(true); const at = o => o.getWorldPosition(new THREE.Vector3()), mid = o => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());   // (the saddle's mesh sits at the frame's origin: its middle is where it is)
    let p; if (k === 'kola') p = at(A.front); else if (k === 'biegi') p = at(A.rear); else if (k === 'siodelko') p = mid(A.saddle).add(_v.set(0, .02, 0)); else if (k === 'kierownica') p = at(A.steer).add(_v.set(0, .14, 0));
    else if (k === 'dzwonek') p = at(A.bell); else if (k === 'lampka') p = at(A.lamp); else if (k === 'lakier') p = at(A.front).lerp(at(A.rear), .5).add(_v.set(0, .32, 0)); else p = at(A.rear).add(_v.set(0, .42, 0));
    p.project(cam); return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h }; }
  // each slot set off from its part, out from the bike's middle, kept on the bench and off each other
  const OUT = { kola: [1, .9], biegi: [-1, .9], siodelko: [-.45, -1], kierownica: [.35, -1], dzwonek: [1, -.55], lampka: [1, .15], lakier: [.1, 1.25], torba: [-1, -.45] };
  function place() { const w = lc.width, h = lc.height, s = bench.clientWidth / Math.max(1, w), out = {};
    for (const k of SLOTS) { const a = anchorPx(k), [ox, oy] = OUT[k], r = Math.min(w, h) * .2; let x = a.x + ox * r * 1.15, y = a.y + oy * r; x = Math.max(34 / s, Math.min(w - 34 / s, x)); y = Math.max(40 / s, Math.min(h * .8 - 30 / s, y)); out[k] = { a, x, y }; }
    for (let it = 0; it < 6; it++) for (const k1 of SLOTS) for (const k2 of SLOTS) { if (k1 >= k2) continue; const p = out[k1], q = out[k2], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, m = 86 / s; if (d < m) { const push = (m - d) / 2; p.x -= dx / d * push; p.y -= dy / d * push; q.x += dx / d * push; q.y += dy / d * push; } }
    for (const k of SLOTS) { const o = out[k], e = slotEls[k]; e.style.left = o.x * s + 'px'; e.style.top = o.y * s + 'px'; } return out; }
  // the lines: from each slot to its part, a step-line of pixels; the part's end a square, blinking for the chosen one
  function lines(pl, t) { const w = lc.width, h = lc.height; lg.clearRect(0, 0, w, h);
    for (const k of SLOTS) { const { a, x, y } = pl[k], on = k === sel || k === hover, col = on ? '#efc970' : 'rgba(211,208,195,.55)';
      lg.fillStyle = col; const mx = Math.round(x), my = Math.round(a.y); const seg = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i += on ? 1 : 2) lg.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
      seg(x, y, mx, my); seg(mx, my, a.x, a.y);
      const blink = k === sel && ((t * 3) | 0) % 2; lg.fillStyle = '#17181b'; lg.fillRect(Math.round(a.x) - 2, Math.round(a.y) - 2, 5, 5); lg.fillStyle = blink ? '#f6f3ea' : on ? '#efc970' : '#d3d0c3'; lg.fillRect(Math.round(a.x) - 1, Math.round(a.y) - 1, 3, 3); } }
  function loop(t) { if (!open_) return; R.setParts(bikeLook(B(), preview())); ren.render(sc, cam); lines(place(), t / 1000); raf = requestAnimationFrame(loop); }
  // what is being tried on (the option under the mouse): [slot, tier], or the near bike's part
  let tryOn = null; const preview = () => tryOn;

  // ---------- the slots on the bench ----------
  function buildSlots() { bench.querySelectorAll('.slot').forEach(e => e.remove()); slotEls = {};
    for (const k of SLOTS) { const b = document.createElement('button'); b.className = 'slot'; b.dataset.k = k; b.innerHTML = `<span class="nm">${SLOT_NAME[k]}</span><span class="pip"></span>`; bench.appendChild(b); slotEls[k] = b;
      b.onclick = () => { sel = sel === k ? null : k; game.sound?.('pick'); draw(); }; b.onmouseenter = e => { hover = k; const i = B().parts[k], t = tierOf(k, i); tipShow(e, `<b>${SLOT_NAME[k]}: ${t.name}</b><span>${t.note}${Object.keys(t.mods).length ? ' · ' + fx(t.mods) : ''}</span>`); }; b.onmouseleave = () => { hover = null; tipHide(); }; } }
  function drawSlots() { for (const k of SLOTS) { const b = slotEls[k], i = B().parts[k], c = icon(k, partCol(k, i), k === 'lakier' ? bikeLook(B()).paint : null), n = PARTS[k].tiers.length - 1;
      b.querySelector('canvas')?.remove(); b.prepend(c); b.classList.toggle('sel', sel === k); b.classList.toggle('plain', i === 0 && k !== 'lakier'); b.classList.toggle('new', canGo(k));
      b.querySelector('.pip').style.color = partCol(k, i); b.querySelector('.pip').innerHTML = k === 'lakier' ? '' : Array.from({ length: n }, (_, j) => `<i class="${j < i ? 'on' : ''}"></i>`).join(''); } }
  // (something better waiting for a slot: in your spares, or on the bike by you)
  const canGo = k => { const i = B().parts[k], w = game.near(); return k !== 'lakier' && (game.inv.some(p => p.k === k && p.tier > i) || (w && w.bike.parts[k] > i)); };

  // ---------- the side: the numbers, the chosen slot's choices, the spares ----------
  function statsHtml() { const m0 = bikeMods(B()), m1 = tryOn ? (tryOn.near ? bikeMods({ ...B(), parts: { ...B().parts, [tryOn[0]]: tryOn[1] } }) : bikeMods(B(), tryOn)) : m0;
    return STATS.map(([k, n, sgn = 1, max = .5]) => { const f = v => k === 'bag' ? (30 + v) / 45 : Math.max(0, Math.min(1, .5 + sgn * v / max * .5)), a = Math.round(f(m0[k]) * 10), b = Math.round(f(m1[k]) * 10);
      const val = v => k === 'bag' ? String(30 + v) : (sgn * v > 0 ? '+' : '') + Math.round(sgn * v * 100) + '%', d = m1[k] === m0[k] ? '' : sgn * (m1[k] - m0[k]) > 0 ? 'up' : 'dn';
      return `<span>${n}</span><span class="blk">${Array.from({ length: 10 }, (_, j) => `<i class="${j < Math.min(a, b) ? 'f' : j < Math.max(a, b) ? (b > a ? 'up' : 'dn') : ''}"></i>`).join('')}</span><span class="v ${d}">${val(m1[k])}</span>`; }).join(''); }
  function opt(k, i, label, act, how, from) { const t = tierOf(k, i), b = document.createElement('button'), mine = B().parts[k] === i && !from;
    b.className = 'opt' + (mine ? ' on' : '') + (!can() && !mine ? ' off' : ''); const ic = icon(k, partCol(k, i), k === 'lakier' ? (i ? PARTS.lakier.tiers[i].look.paint : (TYPES[B().type] || TYPES.moj).paint) : null);
    b.innerHTML = `<span></span><span>${label || t.name}${from ? ` <span class="from">${from}</span>` : ''}<span class="d">${t.note}${Object.keys(t.mods).length ? ' · <em>' + fx(t.mods) + '</em>' : ''}</span></span><span class="act">${mine ? 'ZAŁOŻONE' : how}</span>`; b.firstChild.appendChild(ic);
    b.onmouseenter = () => { if (!mine) { tryOn = from ? Object.assign([k, i], { near: true }) : [k, i]; draw(true); } }; b.onmouseleave = () => { tryOn = null; draw(true); };
    b.onclick = () => { if (mine) return; if (!can()) { game.flash('Zatrzymaj się, żeby przekładać części'); return; } act(); tryOn = null; game.sound?.('pick'); game.onChange(); draw(); }; return b; }
  function mountSpare(k, tier) { const P = B().parts, j = game.inv.findIndex(p => p.k === k && p.tier === tier); if (j >= 0) game.inv.splice(j, 1); if (P[k] > 0) game.inv.push({ k, tier: P[k] }); P[k] = tier; }
  function detail() { const d = $('.det'); d.innerHTML = ''; if (!sel) { d.innerHTML = `<h4>JAK TO DZIAŁA</h4><div class="help">Kliknij slot na rowerze, żeby zobaczyć, co może w nim być. Najedź na część: rower od razu ją pokaże, a paski obok, co zmieni. Zielona kropka przy slocie: masz coś lepszego. Części zdjęte z roweru trafiają do zapasowych.${game.near() ? ' Rower obok możesz rozebrać na części (pasek na dole).' : ''}</div>`; return; }
    const k = sel, P = B().parts, w = game.near(); d.insertAdjacentHTML('beforeend', `<h4>${SLOT_NAME[k]} <span>${k === 'lakier' ? 'PUSZKI KUPIONE U JANUSZA' : 'CO MOŻE TU BYĆ'}</span></h4>`);
    if (k === 'lakier') { d.appendChild(opt(k, 0, 'FABRYCZNY (' + (TYPES[B().type] || TYPES.moj).name + ')', () => { P.lakier = 0; }, 'MALUJ'));
      for (const i of [...game.paints].filter(i => i > 0).sort()) d.appendChild(opt(k, i, null, () => { P.lakier = i; }, 'MALUJ')); if (game.paints.size < 2) d.insertAdjacentHTML('beforeend', '<div class="empty">Inne kolory kupisz u Janusza.</div>'); return; }
    d.appendChild(opt(k, P[k], null, () => { }, '')); const tiers = [...new Set(game.inv.filter(p => p.k === k).map(p => p.tier))].sort((a, b) => b - a);
    for (const i of tiers) d.appendChild(opt(k, i, null, () => mountSpare(k, i), 'ZAŁÓŻ', 'Z ZAPASOWYCH'));
    if (w && w.bike.parts[k] > 0) d.appendChild(opt(k, w.bike.parts[k], null, () => { const t = w.bike.parts[k]; w.bike.parts[k] = 0; game.stripped?.(w); if (P[k] > 0) game.inv.push({ k, tier: P[k] }); P[k] = t; w.r.setParts(bikeLook(w.bike)); }, 'PRZEŁÓŻ', 'Z ROWERU OBOK'));
    if (P[k] > 0) d.appendChild(opt(k, 0, 'ZDEJMIJ (ZOSTANIE ZWYKŁE)', () => { game.inv.push({ k, tier: P[k] }); P[k] = 0; }, 'DO ZAPASOWYCH'));
    if (!tiers.length && !(w && w.bike.parts[k] > 0)) d.insertAdjacentHTML('beforeend', `<div class="empty">Nie masz zapasowych: ${SLOT_NAME[k].toLowerCase()} kupisz u Janusza albo zdejmiesz z cudzego roweru.</div>`); }
  function spares() { const g = $('.spare'); g.innerHTML = ''; const groups = new Map(); for (const p of game.inv) { const key = p.k + ':' + p.tier; groups.set(key, (groups.get(key) || 0) + 1); }
    $('.cnt').textContent = game.inv.length ? game.inv.length + (game.inv.length === 1 ? ' SZT.' : ' SZT.') : ''; $('.inv').textContent = 'ZAPASOWE: ' + game.inv.length;
    if (!groups.size) { g.innerHTML = '<div class="empty" style="grid-column:1/-1">Pusto. Kupione u Janusza części zakładasz od razu; to, co zdejmiesz, trafi tutaj.</div>'; return; }
    for (const [key, n] of groups) { const [k, ts] = key.split(':'), i = +ts, t = tierOf(k, i), b = document.createElement('button'); b.className = 'tile'; b.appendChild(icon(k, partCol(k, i))); if (n > 1) b.insertAdjacentHTML('beforeend', `<span class="n">x${n}</span>`);
      b.onmouseenter = e => { tryOn = [k, i]; draw(true); tipShow(e, `<b>${SLOT_NAME[k]}: ${t.name}</b><span>${t.note}${Object.keys(t.mods).length ? ' · ' + fx(t.mods) : ''}<br>KLIKNIJ: ZAŁÓŻ</span>`); }; b.onmouseleave = () => { tryOn = null; tipHide(); draw(true); };
      b.onclick = () => { if (!can()) { game.flash('Zatrzymaj się, żeby przekładać części'); return; } mountSpare(k, i); sel = k; tryOn = null; tipHide(); game.sound?.('pick'); game.onChange(); draw(); }; g.appendChild(b); } }
  function nearBar() { const w = game.near(), bar = $('.near'); bar.classList.toggle('on', !!w); if (!w) return; const T = TYPES[w.bike.type] || TYPES.moj, who = $('.who');
    who.innerHTML = `<small>ROWER OBOK${w.owner?.kind === 'left' ? ' (TWÓJ, ZOSTAWIONY)' : w.owner?.kind === 'brat' ? ' (BRATA)' : ''}</small><b>${T.name}</b><small>${T.note}</small>`;
    const np = $('.nparts'); np.innerHTML = ''; const list = SLOTS.filter(k => k !== 'lakier' && w.bike.parts[k] > 0);
    if (!list.length) np.innerHTML = '<div class="empty">Nic do zdjęcia: same zwykłe części.</div>';
    for (const k of list) { const i = w.bike.parts[k], t = tierOf(k, i), b = document.createElement('button'); b.className = 'tile'; b.appendChild(icon(k, partCol(k, i)));
      b.onmouseenter = e => tipShow(e, `<b>${SLOT_NAME[k]}: ${t.name}</b><span>${t.note}${Object.keys(t.mods).length ? ' · ' + fx(t.mods) : ''}<br>KLIKNIJ: ZDEJMIJ DO ZAPASOWYCH</span>`); b.onmouseleave = tipHide;
      b.onclick = () => { if (!can()) { game.flash('Zatrzymaj się, żeby przekładać części'); return; } game.inv.push({ k, tier: i }); w.bike.parts[k] = 0; w.r.setParts(bikeLook(w.bike)); game.stripped?.(w); tipHide(); game.sound?.('pick'); draw(); }; np.appendChild(b); }
    $('.take').classList.toggle('off', !can()); }
  function draw(light) { const T = TYPES[B().type] || TYPES.moj; $('.ttl').textContent = 'TWÓJ ROWER: ' + T.name; $('.note').textContent = T.note; $('.typ').textContent = 'TORBA ' + (30 + bikeMods(B()).bag);
    $('.stats').innerHTML = statsHtml(); $('.lock').classList.toggle('on', !can()); if (light) return; drawSlots(); detail(); spares(); nearBar(); }

  function open() { if (open_) return; open_ = true; el.classList.add('on'); setup(); buildSlots(); sizeBench(); sel = null; tryOn = null; draw(); raf = requestAnimationFrame(loop); }
  function close() { if (!open_) return; open_ = false; el.classList.remove('on'); tipHide(); cancelAnimationFrame(raf); game.onChange(); }
  addEventListener('resize', () => { if (open_) { sizeBench(); draw(); } });
  function key(e) { if (!open_) return false; if (e.code === 'Escape' || e.code === game.keyCode?.()) { close(); e.preventDefault(); return true; }
    const i = SLOTS.indexOf(sel); if (e.code === 'ArrowRight' || e.code === 'KeyD') { sel = SLOTS[(i + 1 + SLOTS.length) % SLOTS.length]; draw(); return true; } if (e.code === 'ArrowLeft' || e.code === 'KeyA') { sel = SLOTS[(i - 1 + SLOTS.length * 2) % SLOTS.length]; draw(); return true; }
    e.preventDefault(); return true; }
  return { open, close, toggle: () => open_ ? close() : open(), key, get isOpen() { return open_; } };
}
