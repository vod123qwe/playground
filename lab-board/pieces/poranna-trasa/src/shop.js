// The bike shop by the road (a stop on the way: the game waits while you are in). The bike on a turntable on the left, the parts on
// the right: wheels, saddle, handlebar, gears, paint, bell, lamp, bag; each with its tiers (a price, what it does, how it looks: you see
// it on the bike at once), bars of what the bike can do and what a part would change; your finds sold (or, a bell or a lamp, put on);
// the bag filled with papers. What you bought stays for the run.
// createShop({ THREE, createRider, game }) → { open(), close(), key(e), isOpen, mods(), look(), reset() }
// game: { money (get/set), papers (get/set), items (array), onChange(mods, look), flash(s) }
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { JANUSZ, bag } from './stories.js';
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
    { name: 'CZERWONY', price: 0, look: { paint: '#c23a2e' }, mods: {}, note: 'FABRYCZNY. KLASYKA.' },
    { name: 'MIĘTOWY', price: 8, look: { paint: '#7fc8a9' }, mods: {}, note: 'ŚWIEŻO. JAK GUMA DO ŻUCIA.' },
    { name: 'GRANATOWY', price: 8, look: { paint: '#2f4a6e' }, mods: {}, note: 'POWAŻNY ROWER DLA POWAŻNEGO CZŁOWIEKA.' },
    { name: 'CYTRYNOWY', price: 8, look: { paint: '#e3c43a' }, mods: {}, note: 'WIDAĆ CIĘ Z KOSMOSU.' },
    { name: 'CZARNY MAT', price: 12, look: { paint: '#2a2c30' }, mods: {}, note: 'JAK Z FILMU. TYLKO ROWER.' }] },
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
  // the look: the game dimmed under a dither (as in the pause), a window of pixel blocks; on its left pan Janusz (his face, what he says)
  const css = document.createElement('style'); css.textContent = `
    #shop { position: fixed; inset: 0; z-index: 8; display: none; place-items: center; color: #f6f3ea; font: 700 12px/1.35 ui-monospace, 'Cascadia Mono', Consolas, monospace; text-transform: uppercase; letter-spacing: .03em;
      background-color: rgba(10,11,13,.5); background-image: linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%), linear-gradient(45deg, rgba(10,11,13,.6) 25%, transparent 25%, transparent 75%, rgba(10,11,13,.6) 75%); background-size: 4px 4px; background-position: 0 0, 2px 2px; }
    #shop.on { display: grid; }
    #shop .win { width: min(1040px, calc(100vw - 24px)); max-height: calc(100vh - 24px); box-sizing: border-box; display: grid; grid-template-columns: 210px minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; gap: 10px 14px; padding: 12px 14px;
      background: #25272b; border: 3px solid #17181b; box-shadow: 0 0 0 3px #d3d0c3, 0 0 0 6px #17181b, 8px 8px 0 6px rgba(0,0,0,.35); }
    #shop .head { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; background: #17181b; margin: -12px -14px 0; padding: 8px 14px; border-bottom: 3px solid #efc970; }
    #shop .head b { color: #efc970; font-size: 15px; letter-spacing: .14em; } #shop .cash { color: #efc970; font-size: 15px; white-space: nowrap; background: #33363a; padding: 3px 9px; box-shadow: inset 2px 2px 0 #44484c, inset -2px -2px 0 #1d1e21; }
    #shop .side { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
    #shop .ava { aspect-ratio: 1; background: #e3b83a; border: 3px solid #17181b; box-shadow: 0 0 0 3px #d3d0c3; display: grid; place-items: center; overflow: hidden; }
    #shop .ava canvas, #shop .ava img { width: 100%; height: 100%; image-rendering: pixelated; display: block; object-fit: cover; }
    #shop .jan { background: #f6f3ea; color: #17181b; padding: 9px 10px; border: 3px solid #17181b; position: relative; min-height: 5em; font-size: 11px; line-height: 1.45; }
    #shop .jan:before { content: ''; position: absolute; left: 22px; top: -11px; border: 8px solid transparent; border-bottom-color: #17181b; border-top: 0; } #shop .jan b { display: block; color: #8e2e25; margin-bottom: 3px; }
    #shop .left { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
    #shop canvas.bike { width: 100%; aspect-ratio: 4 / 3; background: #1d1e21; border: 3px solid #17181b; box-shadow: inset 0 0 0 2px #33363a; image-rendering: pixelated; }
    #shop .stats { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 11px; align-items: center; } #shop .bar { height: 8px; background: #17181b; position: relative; } #shop .bar i { position: absolute; inset: 0 auto 0 0; background: #efc970; } #shop .bar s { position: absolute; top: 0; bottom: 0; text-decoration: none; }
    #shop .right { overflow-y: auto; min-height: 0; padding-right: 4px; } #shop .cats { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
    #shop button { all: unset; box-sizing: border-box; cursor: pointer; padding: 7px 9px; background: #33363a; border: 2px solid #17181b; box-shadow: inset 2px 2px 0 #4a4d52, inset -2px -2px 0 #1d1e21; }
    #shop button:active { box-shadow: inset -2px -2px 0 #4a4d52, inset 2px 2px 0 #1d1e21; }
    #shop button.sel { background: #efc970; color: #17181b; box-shadow: inset 2px 2px 0 #f6e2a8, inset -2px -2px 0 #b8902e; } #shop button.off { opacity: .4; cursor: default; }
    #shop .tier { display: block; width: 100%; margin-bottom: 6px; } #shop .tier .n { display: flex; justify-content: space-between; gap: 8px; } #shop .tier .d { font-size: 10px; opacity: .75; margin-top: 3px; text-transform: none; } #shop .tier em { font-style: normal; color: #2f6b2a; } #shop .tier:not(.sel) em { color: #9fd27a; }
    #shop h4 { margin: 12px 0 6px; color: #efc970; font-size: 11px; letter-spacing: .12em; } #shop .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px; } #shop .row button { padding: 5px 8px; font-size: 11px; }
    #shop .bottom { grid-column: 1 / -1; display: flex; justify-content: space-between; gap: 10px; } #shop .go { background: #efc970; color: #17181b; box-shadow: inset 2px 2px 0 #f6e2a8, inset -2px -2px 0 #b8902e; padding: 9px 16px; }
    #shop .bottom .chat2 { display: none; }
    @media (max-width: 820px) { #shop .win { grid-template-columns: 1fr; grid-template-rows: auto auto auto minmax(0, 1fr) auto; overflow-y: auto; }
      #shop .side { flex-direction: row; align-items: flex-start; } #shop .ava { width: 64px; flex: none; } #shop .jan { flex: 1; min-height: 0; } #shop .jan:before { left: -11px; top: 14px; border: 8px solid transparent; border-right-color: #17181b; border-left: 0; }
      #shop canvas.bike { max-height: 24vh; } #shop .side .chat { display: none; } #shop .bottom .chat2 { display: inline-block; } }
  `; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'shop'; el.innerHTML = '<div class="win"><div class="head"><b>WARSZTAT U JANUSZA</b><span class="cash"></span></div><div class="side"><div class="ava"><canvas class="face" width="32" height="32"></canvas></div><div class="jan"><b>PAN JANUSZ</b><span class="say"></span></div><button class="chat">POGADAJ Z JANUSZEM</button></div><div class="left"><canvas class="bike"></canvas><div class="stats"></div></div><div class="right"></div><div class="bottom"><button class="chat chat2">POGADAJ</button><span></span><button class="go">JEDŹ DALEJ (ESC)</button></div></div>';
  document.body.appendChild(el);
  const cv = el.querySelector('canvas.bike'), right = el.querySelector('.right'), statsE = el.querySelector('.stats'); el.querySelector('.go').onclick = () => close();
  // pan Janusz: what he says (a line at the top; his talking clip while he says it), his trips with Mietek on asking
  const AN = bag(), pick = a => a[Math.random() * a.length | 0]; let talkT = 0;
  const say = s => { el.querySelector('.jan .say').textContent = s; talkT = Math.min(5, 1.2 + s.length * .035); game.say?.(s); };
  el.querySelectorAll('.chat').forEach(b => b.onclick = () => say(AN.draw('janusz')));
  // his face: a picture if there is one (assets/ui/janusz.png), else drawn here in pixels: the cap, the moustache, the chins, the tank top;
  // the mouth moving while he talks
  const faceC = el.querySelector('.face'), fg = faceC.getContext('2d'); let mouthT = 0;
  { const img = new Image(); img.onload = () => { faceC.replaceWith(img); faceImg = img; }; img.src = 'assets/ui/janusz.png'; }
  let faceImg = null;
  function face(open) { if (faceImg) return; const P = (x, y, w, h, c) => { fg.fillStyle = c; fg.fillRect(x, y, w, h); };
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
  // what you have: per part, the tiers owned and the one on
  const owned = {}, on = {}; const reset = () => { for (const k in PARTS) { owned[k] = new Set([0]); on[k] = 0; } }; reset();
  let cat = 'kola', hover = null, open_ = false;
  const mods = (alt) => { const m = { top: 0, acc: 0, steer: 0, grass: 0, hill: 0, stam: 0, bag: 0, trick: 0, bell: 0, lamp: 0 }; for (const k in PARTS) { const t = PARTS[k].tiers[alt && alt[0] === k ? alt[1] : on[k]]; for (const s in t.mods) m[s] += t.mods[s]; } return m; };
  const look = (alt) => { const o = {}; for (const k in PARTS) Object.assign(o, PARTS[k].tiers[alt && alt[0] === k ? alt[1] : on[k]].look); return o; };
  // the turntable: its own little picture, the bike without the boy
  let R = null, ren = null, sc = null, cam = null, raf = 0, last = 0;
  function preview() {
    if (!ren) { ren = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true }); ren.setPixelRatio(1); sc = new THREE.Scene(); cam = new THREE.PerspectiveCamera(32, 4 / 3, .1, 50); cam.position.set(3.1, 1.25, -.45); cam.lookAt(0, .58, -.45);   // (the bike, and him by it)
      sc.add(new THREE.HemisphereLight('#fff3dc', '#3a3d42', 1.6)); const d = new THREE.DirectionalLight('#ffffff', 1.4); d.position.set(2, 3, 1.5); sc.add(d);
      R = createRider(); R.boy.visible = false; sc.add(R.root);
      new GLTFLoader().load('assets/export/belly.glb', gl => { const m = gl.scene; m.traverse(o => { if (o.isMesh) { const om = o.material; o.material = new THREE.MeshToonMaterial({ color: om.color, map: om.map || null, alphaTest: om.alphaTest || (om.transparent ? .5 : 0), side: om.transparent ? THREE.DoubleSide : THREE.FrontSide }); } });
        const J = new THREE.Group(); J.add(m); J.position.set(-.2, 0, -1.25); J.rotation.y = Math.PI * .42; sc.add(J);
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .44, 10), new THREE.MeshToonMaterial({ color: '#7a4a2a' })); stool.position.set(0, .22, 0); J.add(stool);
        const cap = new THREE.Group(), cm = new THREE.MeshToonMaterial({ color: '#c23a2e' }); const crown = new THREE.Mesh(new THREE.SphereGeometry(.105, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cm); cap.add(crown); const visor = new THREE.Mesh(new THREE.BoxGeometry(.17, .015, .12), cm); visor.position.set(0, .005, .1); cap.add(visor); sc.add(cap);
        const mixer = new THREE.AnimationMixer(m), A = n => { const c = gl.animations.find(q => q.name === n); return c ? mixer.clipAction(c) : null; }, idle = A('idle'), talk = A('talk'); idle?.play(); if (talk) { talk.play(); talk.setEffectiveWeight(0); }
        JAN = { J, m, mixer, idle, talk, cap, head: m.getObjectByName('head') }; }); }
    const w = cv.clientWidth || 400, h = cv.clientHeight || 300; ren.setSize(Math.round(w / 2), Math.round(h / 2), false); cam.aspect = w / h; cam.updateProjectionMatrix();   // (half resolution: pixels like the game's)
    R.setParts(look(hover));
  }
  let JAN = null; const _hp = new THREE.Vector3();
  function spin(t) { if (!open_) return; const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; R.root.rotation.y += dt * .55;
    if (JAN) { talkT = Math.max(0, talkT - dt); const w = talkT > 0 ? 1 : 0; if (JAN.talk) { const cw = JAN.talk.getEffectiveWeight(), nw = cw + (w - cw) * Math.min(1, dt * 5); JAN.talk.setEffectiveWeight(nw); JAN.idle?.setEffectiveWeight(1 - nw); } JAN.mixer.update(dt);
      if (JAN.head) { JAN.J.updateMatrixWorld(true); JAN.head.getWorldPosition(_hp); JAN.cap.position.copy(_hp).add(new THREE.Vector3(0, .1, 0)); JAN.cap.rotation.y = JAN.J.rotation.y; } }   // (the cap where his head is)
    ren.render(sc, cam); raf = requestAnimationFrame(spin); }
  // the lists
  function draw() {
    el.querySelector('.cash').textContent = game.money + ' ZŁ';
    const m0 = mods(), m1 = hover ? mods(hover) : m0; statsE.innerHTML = '';
    for (const [k, n, sgn = 1, max = .5] of STATS) { const f = v => k === 'bag' ? (30 + v) / 42 : Math.max(0, Math.min(1, .5 + sgn * v / max * .5)), a = f(m0[k]), b = f(m1[k]);
      statsE.insertAdjacentHTML('beforeend', `<span>${n}</span><span class="bar"><i style="width:${Math.min(a, b) * 100}%"></i>${b !== a ? `<s style="left:${Math.min(a, b) * 100}%;width:${Math.abs(b - a) * 100}%;background:${b > a ? '#9fd27a' : '#cf5a3e'}"></s>` : ''}</span>`); }
    right.innerHTML = `<div class="cats">${Object.keys(PARTS).map(k => `<button data-cat="${k}" class="${k === cat ? 'sel' : ''}">${PARTS[k].name}</button>`).join('')}</div>`;
    PARTS[cat].tiers.forEach((t, i) => { const has = owned[cat].has(i), isOn = on[cat] === i, afford = game.money >= t.price, b = document.createElement('button');
      b.className = 'tier' + (isOn ? ' sel' : '') + (!has && !afford ? ' off' : ''); b.innerHTML = `<div class="n"><span>${t.name}</span><span>${isOn ? 'ZAŁOŻONE' : has ? 'ZAŁÓŻ' : t.price + ' ZŁ'}</span></div><div class="d">${t.note}${Object.keys(t.mods).length ? ' · <em>' + fx(t.mods) + '</em>' : ''}</div>`;
      b.onmouseenter = () => { hover = [cat, i]; R && R.setParts(look(hover)); draw(); }; b.onmouseleave = () => { hover = null; R && R.setParts(look()); draw(); };
      b.onclick = () => buy(cat, i); right.appendChild(b); });
    // the bag filled; your finds
    const max = 30 + m0.bag, need = Math.max(0, max - game.papers), cost = Math.ceil(need / 2);
    right.insertAdjacentHTML('beforeend', `<h4>GAZETY</h4><div class="row"><span>TORBA: ${game.papers}/${max}</span><button data-fill ${need && game.money >= cost ? '' : 'class="off"'}>DOPEŁNIJ (+${need}) ${cost} ZŁ</button></div>` +
      (game.titles || []).map(t => `<div class="row"><span style="color:${t.col}">${t.name}: ${t.n}</span><button data-tt="${t.key}" ${need >= 1 && game.money >= 3 ? '' : 'class="off"'}>+${Math.min(5, need)} · 3 ZŁ</button></div>`).join(''));
    right.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => { const k = Math.min(5, need); if (k < 1 || game.money < 3) return; game.money -= 3; game.addTitle(b.dataset.tt, k); changed(); });   // (one title in particular)
    right.insertAdjacentHTML('beforeend', `<h4>NA DROGĘ</h4><div class="row"><span>DROŻDŻÓWKA (ZDROWIE ${Math.round(game.hp)}/100)</span><button data-bun ${game.money >= 5 && game.hp < 100 ? '' : 'class="off"'}>+40 ZDROWIA · 5 ZŁ</button></div>`);
    right.querySelector('[data-bun]').addEventListener('click', () => { if (game.money < 5 || game.hp >= 100) return; game.money -= 5; game.hp = Math.min(100, game.hp + 40); changed(); });
    right.insertAdjacentHTML('beforeend', `<h4>NA DROGĘ</h4><div class="row"><span>DROŻDŻÓWKA (ZDROWIE ${Math.round(game.hp)}/100)</span><button data-bun ${game.money >= 5 && game.hp < 100 ? '' : 'class="off"'}>+40 ZDROWIA · 5 ZŁ</button></div>`);
    right.querySelector('[data-bun]').addEventListener('click', () => { if (game.money < 5 || game.hp >= 100) return; game.money -= 5; game.hp = Math.min(100, game.hp + 40); changed(); });
    const items = game.items; if (items.length) { right.insertAdjacentHTML('beforeend', '<h4>FANTY</h4>'); items.forEach((it, i) => { const F = FINDS[it] || { sell: 3 }, fit = F.fit && !owned[F.fit[0]].has(F.fit[1]);
      right.insertAdjacentHTML('beforeend', `<div class="row"><span>${it}</span><span>${fit ? `<button data-fit="${i}">ZAMONTUJ</button> ` : ''}<button data-sell="${i}">SPRZEDAJ +${F.sell} ZŁ</button></span></div>`); }); }
    right.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; hover = null; R && R.setParts(look()); say(pick(JANUSZ.cats[cat] || JANUSZ.buy)); draw(); });
    right.querySelector('[data-fill]')?.addEventListener('click', () => { if (!need || game.money < cost) { if (need) say(pick(JANUSZ.broke)); return; } game.money -= cost; game.papers += need; say(pick(JANUSZ.fill)); changed(); });
    right.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const i = +b.dataset.sell, it = items[i]; game.money += (FINDS[it] || { sell: 3 }).sell; items.splice(i, 1); say(pick(JANUSZ.sell)); changed(); });
    right.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { const i = +b.dataset.fit, F = FINDS[items[i]]; owned[F.fit[0]].add(F.fit[1]); on[F.fit[0]] = F.fit[1]; items.splice(i, 1); game.flash('Zamontowane: ' + PARTS[F.fit[0]].tiers[F.fit[1]].name.toLowerCase()); changed(); });
  }
  const fx = m => Object.entries(m).filter(([k]) => !['bell', 'lamp'].includes(k)).map(([k, v]) => (k === 'bag' ? `+${v} GAZET` : `${(k === 'grass' ? -v : v) > 0 ? '+' : ''}${Math.round((k === 'grass' ? -v : v) * 100)}% ${(STATS.find(s => s[0] === k) || [0, k])[1]}`)).join(', ');
  function buy(k, i) { const t = PARTS[k].tiers[i]; if (!owned[k].has(i)) { if (game.money < t.price) { say(pick(JANUSZ.broke)); return; } game.money -= t.price; owned[k].add(i); if (i > 0) say(pick(JANUSZ.buy)); } on[k] = i; hover = null; changed(); }
  function changed() { game.onChange(mods(), look()); R && R.setParts(look()); draw(); }
  function open() { if (open_) return; open_ = true; el.classList.add('on'); say(pick(JANUSZ.hello)); preview(); draw(); last = performance.now(); raf = requestAnimationFrame(spin); }
  function close() { if (!open_) return; open_ = false; el.classList.remove('on'); cancelAnimationFrame(raf); game.onChange(mods(), look()); game.bye?.(pick(JANUSZ.bye)); }
  function key(e) { if (!open_) return false; if (e.code === 'Escape' || e.code === 'Enter') close(); e.preventDefault(); return true; }
  const ownedList = () => { const out = []; for (const k in PARTS) for (const i of owned[k]) if (i > 0) out.push({ label: PARTS[k].name + ': ' + PARTS[k].tiers[i].name, keep: { part: k, tier: i } }); return out; };
  function grant(k, i) { if (!PARTS[k] || !PARTS[k].tiers[i]) return; owned[k].add(i); if (i > on[k]) on[k] = i; game.onChange(mods(), look()); }
  const equipped = () => Object.keys(PARTS).map(k => ({ cat: PARTS[k].name, name: PARTS[k].tiers[on[k]].name }));
  return { open, close, key, get isOpen() { return open_; }, mods, look, ownedList, grant, equipped, PARTS, reset: () => { reset(); game.onChange(mods(), look()); } };
}
