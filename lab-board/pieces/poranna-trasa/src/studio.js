// The workshop (studio.html): every asset of the game on a turntable, to look them over. Groups: cars (each kind, in each of its
// colours), people (the MakeHuman models and their clips), the paper boy on his bike, dogs (each breed), props and ramps. The same
// toon light and the same pixel pass as the game (both can be turned off), a 1 m grid under it, its size and its triangles.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPixel } from './pixel.js';
import { createCars } from './cars.js';
import { createProps } from './props.js';
import { createTextures } from './textures.js';
import { createRider } from './rider.js';
import { createDogs } from './dogs.js';
import { makeBag } from './bag.js';
import { createTrack } from './track.js';
import { createNature } from './nature.js';
import { createAudio } from './audio.js';
const audio = createAudio();   // (the sounds: listened to here, one by one)

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#8fb0bd');
const camera = new THREE.PerspectiveCamera(40, 1, .05, 400);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.target.set(0, .8, 0);
const px = createPixel({ THREE, renderer, height: 300 });
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([80, 165, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, ...o });
scene.add(new THREE.HemisphereLight('#cfe6f2', '#6b5a3a', 1.1));
const sun = new THREE.DirectionalLight('#fff0d2', 2.6); sun.position.set(-6, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 30 }); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48).rotateX(-Math.PI / 2), toon('#7c9a45')); floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(16, 16, '#44484c', '#5d6a4a'); grid.position.y = .005; scene.add(grid);
const stand = new THREE.Group(); scene.add(stand);

const tex = createTextures({ THREE }), nature = createNature({ THREE, toon, tex: createTextures({ THREE }) }), cars = createCars({ THREE, toon }), props = createProps({ THREE, toon, tex }), dogs = createDogs({ THREE, toon, probe: () => ({ y: 0, i: 0 }) });
let mixer = null, rider = null, current = null, clipBtns = null;

// ---------- the groups and what is in them ----------
const NAMES = { saloon: 'sedan trzybryłowy', liftback: 'liftback', estate: 'kombi', pickup: 'pikap', wedge: 'klin (sportowy)', hatch: 'hatchback', micro: 'maluch', twostroke: 'dwusuw', fastback: 'kanciasty liftback', barge: 'długa limuzyna', van: 'dostawczak', bus: 'autobus' };
const PEOPLE_NAMES = { oldman: 'staruszek z laską', jogger: 'biegaczka', mum: 'mama z wózkiem', dogman: 'pan z psem', teen: 'nastolatek', suit: 'facet w garniturze', shopper: 'pani z zakupami', kid: 'dzieciak z balonem', gardener: 'ogrodnik', lady: 'pani w sukience', belly: 'brzuchacz (leżak)', granma: 'babcia (krzesło)', grandpa: 'dziadek (krzesło)', boy: 'gazeciarz pieszo', brawler: 'bójkarz' };
const PROP_NAMES = { boardFence: 'płot z desek', wireFence: 'płot z siatki', shed: 'szopa', washing: 'pranie', logs: 'drewno', sandbox: 'piaskownica', birdbath: 'poidełko', cone: 'pachołek', bags: 'worki', wagon: 'wózek', barrier: 'zapora', pothole: 'dziura', manhole: 'studzienka', bundle: 'paczka gazet', leafPile: 'kupka liści', swing: 'huśtawka', kidBike: 'rowerek', trampoline: 'trampolina', grill: 'grill', gnome: 'krasnal', stones: 'kamienie' };
const SFX_NAMES = { throw: 'rzut gazety', land: 'gazeta ląduje', porch: 'na ganek', mailbox: 'do skrzynki', glass: 'szyba', coin: 'kasa', bell: 'dzwonek', crash: 'wywrotka', kick: 'kopniak', punch: 'cios', bark: 'pies', horn: 'klakson', ui: 'klik w menu', pick: 'podniesienie', chime: 'dzwoneczek', trick: 'trick', hurt: 'au', rustle: 'szelest gazet', whistle: 'gwizd' };
const VOICE_NAMES = { player: 'gazeciarz', granma: 'babcia', grandpa: 'dziadek', belly: 'pan z brzuchem', lump: 'lump z ławki (mamrocze)', lads: 'ekipa spod beczki', police: 'policjant', janusz: 'pan Janusz', lady: 'pani z torebką', kid: 'dzieciak', gang: 'gang rowerowy', shout: 'krzyk', voice: 'ktoś' };
const SONG_NAMES = { poranek: 'muzyka: poranek (w grze)', poscig: 'muzyka: pościg (gang, policja)', tytul: 'muzyka: ekran tytułowy', '': 'muzyka: cisza' };
const VOICE_LINES = ['MŁODY! CHODŹ NO TU, MAM SPRAWĘ.', 'ZZZ... PIWKO... MAMO, JESZCZE PIĘĆ MINUT...', 'A GAZETKA GDZIE?!', 'TO TEN, CO KOPIE NASZYCH!', 'JAPOŃSKI OSPRZĘT, MŁODY! JAPOŃSKI!', 'DOKUMENTY ROWERU PROSZĘ.', 'CO?! ZA CO?!'];
const CATS = [
  { k: 'sound', name: 'Dźwięki', items: () => [...Object.keys(SFX_NAMES).map(n => ({ k: 'fx:' + n, label: SFX_NAMES[n], note: 'efekt' })), ...Object.keys(VOICE_NAMES).map(n => ({ k: 'v:' + n, label: VOICE_NAMES[n], note: 'głos' })), ...Object.keys(SONG_NAMES).map(n => ({ k: 'm:' + n, label: SONG_NAMES[n], note: 'muzyka' }))] },
  { k: 'cars', name: 'Auta', items: () => Object.keys(cars.KINDS).map(k => ({ k, label: NAMES[k] || k, note: `${cars.KINDS[k].L.toFixed(2)} m` })) },
  { k: 'people', name: 'Ludzie', items: () => Object.keys(PEOPLE_NAMES).map(k => ({ k, label: PEOPLE_NAMES[k], note: k })) },
  { k: 'rider', name: 'Rowerzysta', items: () => [{ k: 'rider', label: 'gazeciarz na rowerze', note: 'proceduralny' }] },
  { k: 'dogs', name: 'Psy', items: () => dogs.BREEDS.map((b, i) => ({ k: i, label: b.name, note: `${b.len} m` })) },
  { k: 'props', name: 'Rekwizyty', items: () => Object.keys(PROP_NAMES).map(k => ({ k, label: PROP_NAMES[k], note: k })) },
  { k: 'arena', name: 'Walka (test)', items: () => [['cherlak', 'cherlak', '70 HP'], ['kozak', 'kozak z osiedla', '100 HP'], ['szwagier', 'szwagier', '140 HP']].map(([k, label, note]) => ({ k, label, note })) },
  { k: 'bag', name: 'Torba', items: () => [{ k: 1, label: 'torba pełna', note: '20 gazet' }, { k: .5, label: 'torba w połowie', note: '10' }, { k: 0, label: 'torba pusta', note: '0' }] },
  { k: 'nature', name: 'Przyroda', items: () => Object.keys(nature.KINDS).map(k => ({ k, label: k, note: '' })) },
  { k: 'houses', name: 'Domy', items: () => pieces('houses').map((x, k) => ({ k, label: x.label, note: x.note })) },
  { k: 'trees', name: 'Drzewa', items: () => pieces('trees').map((x, k) => ({ k, label: x.label, note: x.note })) },
  { k: 'lots', name: 'Baraki i gospodarstwa', items: () => pieces('lots').map((x, k) => ({ k, label: x.label, note: x.note })) },
  { k: 'ramps', name: 'Skocznie', items: () => [['plank', 'deskowa'], ['kicker', 'kicker (stroma)'], ['big', 'duża na ramie']].map(([k, label]) => ({ k, label, note: k })) }];
let cat = CATS[0], item = null, colour = null;
const $ = id => document.getElementById(id);

// ---------- the world's buildings and trees: the track built once, nothing merged (showcase), and a few of each kind taken from it ----------
let world = null; const got = {};
function pieces(k) { if (got[k]) return got[k]; world = world || createTrack({ THREE, toon, tex, showcase: true }); const S = world.show;
  const few = (arr, key, n) => { const seen = {}, out = []; for (const x of arr) { const c = seen[key(x)] = (seen[key(x)] || 0) + 1; if (c <= n) out.push(x); } return out; };
  if (k === 'houses') got[k] = few(S.house, x => x.kind, 3).sort((a, b) => a.kind.localeCompare(b.kind));
  if (k === 'trees') got[k] = few(S.tree, x => x.label, 4);
  if (k === 'lots') got[k] = [...S.shacks.slice(0, 3), ...few(S.farm, x => x.label, 2)];
  return got[k]; }
const WORLD_DESC = { houses: 'Dom z ulicy: ściany z desek, dach dwuspadowy, okna (czasem okiennice, skrzynki z kwiatami), drzwi z lampą, czasem ganek, komin, garaż albo dobudówka z garażem; przed nim ogródek i auto na podjeździe (płot od ulicy stoi w grze osobno).', trees: 'Drzewa przy ulicy i za domami: korony z kęp i kart liści, jesienią rude; świerki za domami.', lots: 'Działka z barakami (blacha, deski, beczka z ogniem, graty) albo zabudowa gospodarstwa za miasteczkiem.' };

// ---------- showing one ----------
function clear() { for (const c of [...stand.children]) stand.remove(c); mixer = null; rider = null; $('extra').innerHTML = ''; }
function frame(o, view = 'iso') { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), R = Math.max(s.x, s.y, s.z, .6);
  controls.target.copy(c); const d = R * 1.9 + .6, v = { front: [0, .25, 1], back: [0, .25, -1], side: [1, .25, 0], top: [0, 1, .02], iso: [.8, .45, .9] }[view];
  camera.position.copy(c).add(new THREE.Vector3(...v).normalize().multiplyScalar(d)); controls.update(); return { b, s }; }
function describe(title, desc, o, extra = []) {
  let tris = 0, meshes = 0; const mats = new Set(); o.traverse(m => { if (m.isMesh) { meshes++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => mats.add(x)); } });
  const ry = stand.rotation.y; stand.rotation.y = 0; stand.updateMatrixWorld(true);   // (measured unturned)
  const bx = new THREE.Box3(); o.updateMatrixWorld(true); o.traverse(m => { if (m.isMesh && !m.userData.noShadow) bx.expandByObject(m, true); }); const s = bx.getSize(new THREE.Vector3()); stand.rotation.y = ry;   // (without the shade under a car)
  $('title').textContent = title; $('desc').textContent = desc;
  $('info').innerHTML = [['szer. × wys. × dł.', [s.x, s.y, s.z].every(Number.isFinite) ? `${s.x.toFixed(2)} × ${s.y.toFixed(2)} × ${s.z.toFixed(2)} m` : '—'], ['trójkąty', Math.round(tris).toLocaleString('pl')], ['siatki', meshes], ['materiały', mats.size], ...extra].map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join(''); }
const place = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); stand.add(o); };

async function show(it) {
  item = it; clear(); document.querySelectorAll('#items button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === String(it.k))));
  if (cat.k === 'cars') { const K = cars.KINDS[it.k], pal = cars.COLOURS[it.k] || cars.COLOURS.common; if (!pal.includes(colour)) colour = pal[0];
    const c = cars.makeCar(it.k, colour); place(c.group); frame(c.group);
    describe(NAMES[it.k] || it.k, 'Nadwozie z profilu (loft), przeszklenie, zderzaki, lampy, koła.', c.group, [['rozstaw osi', K.WB + ' m'], ['koło', (K.R * 2).toFixed(2) + ' m']]);
    const ex = $('extra'); ex.innerHTML = '<h2>Kolor</h2>'; const row = document.createElement('div'); row.className = 'row'; ex.appendChild(row);
    for (const p of pal) { const b = document.createElement('button'); b.className = 'sw'; b.style.background = p; b.title = p; b.setAttribute('aria-label', 'kolor ' + p); b.setAttribute('aria-pressed', String(p === colour)); b.onclick = () => { colour = p; show(it); }; row.appendChild(b); } }
  if (cat.k === 'people') { $('title').textContent = PEOPLE_NAMES[it.k]; $('desc').textContent = 'ładuję…';
    const g = await new Promise(ok => new GLTFLoader().load(`assets/export/${it.k}.glb`, ok, undefined, () => ok(null))); if (item !== it) return; if (!g) { $('desc').textContent = 'brak pliku'; return; }
    const m = g.scene; m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) }); o.frustumCulled = false; } });
    place(m); mixer = new THREE.AnimationMixer(m); frame(m);
    describe(PEOPLE_NAMES[it.k], 'MakeHuman (MPFB) z animacjami Quaternius, w toonie gry.', m, [['klipy', g.animations.length]]);
    const ex = $('extra'); ex.innerHTML = '<h2>Animacja</h2>'; const row = document.createElement('div'); row.className = 'row'; ex.appendChild(row); let act = null;
    const play = c => { if (act) act.fadeOut(.15); act = mixer.clipAction(c); act.reset().fadeIn(.15).play(); row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === c.name))); };
    for (const c of g.animations) { const b = document.createElement('button'); b.textContent = c.name; b.onclick = () => play(c); row.appendChild(b); }
    const first = g.animations.find(c => c.name === 'walk') || g.animations.find(c => c.name === 'idle') || g.animations[0]; if (first) play(first); }
  if (cat.k === 'sound') { const [t, n] = it.k.split(':'), go = () => { if (t === 'fx') audio.play(n); else if (t === 'v') audio.say(VOICE_LINES[Math.random() * VOICE_LINES.length | 0], n, { id: 'studio' + Math.random() }); else audio.music(n || null); };
    go(); describe(it.label, t === 'm' ? 'Muzyka grana w przeglądarce (sekwencer, bez plików). Gra w kółko, aż wybierzesz inną albo ciszę.' : t === 'v' ? 'Bez słów: bełkot sylab w głosie postaci (jak w bajkach). Losowa kwestia przy każdym kliknięciu.' : 'Efekt robiony w przeglądarce (oscylatory, szum, filtry). Bez plików.', new THREE.Group(), [['rodzaj', t === 'fx' ? 'efekt' : t === 'v' ? 'głos' : 'muzyka']]);
    const ex = $('extra'); ex.innerHTML = '<h2>Odsłuch</h2>'; const row = document.createElement('div'); row.className = 'row'; ex.appendChild(row); const b = document.createElement('button'); b.textContent = 'zagraj jeszcze raz'; b.onclick = go; row.appendChild(b);
    for (const [k, lab] of [['master', 'głośność'], ['music', 'muzyka'], ['sfx', 'efekty'], ['voice', 'głosy']]) { const r = document.createElement('label'); r.className = 'row'; r.innerHTML = `${lab} <input type="range" min="0" max="1" step="0.05" value="${audio.get(k)}">`; r.querySelector('input').oninput = e => audio.set(k, +e.target.value); ex.appendChild(r); } }
  if (cat.k === 'rider') { rider = createRider({ THREE, ramp, toon }); place(rider.root); frame(rider.root, 'side'); describe('gazeciarz na rowerze', 'Rower i chłopak budowane w kodzie (bez pliku), pedałuje w podglądzie.', rider.root); }
  if (cat.k === 'dogs') { const d = dogs.makeDog(null, 1, Math.random, it.k); place(d.group); frame(d.group, 'side'); describe(dogs.BREEDS[it.k].name, 'Pies z brył (tułów z przekrojów, głowa, uszy i ogon wg rasy).', d.group); }
  if (cat.k === 'props') { const o = /Fence$/.test(it.k) ? props[it.k](6) : props[it.k](Math.random); place(o.group); frame(o.group); describe(PROP_NAMES[it.k], 'Rekwizyt z ogródków i ulicy.', o.group, [['kolizja', o.hit ? `${o.hit.kind} · ${(o.hit.hx * 2).toFixed(2)} × ${(o.hit.hz * 2).toFixed(2)} m` : '—']]); }
  if (cat.k === 'arena') { const KD = { cherlak: 'Słaby, długi zamach (0,8 s), długo odsłonięty po ciosie. Dobry na naukę.', kozak: 'Szybszy zamach (0,58 s), zwody, czasem dwa ciosy z rzędu, częściej się zasłania.', szwagier: 'Mocne ciosy, wolny zamach (0,85 s), którego nie przerwiesz ciosem.' };
    const g = await new Promise(ok => new GLTFLoader().load('assets/export/brawler.glb', ok, undefined, () => ok(null))); if (item !== it) return;
    if (g) { const m = g.scene; m.traverse(o => { if (o.isMesh) { const om = o.material; o.material = toon(om.color.clone(), { map: om.map || null }); o.frustumCulled = false; } }); place(m); mixer = new THREE.AnimationMixer(m); const c = g.animations.find(a => a.name === 'jab'); if (c) mixer.clipAction(c).play(); frame(m, 'iso'); describe('arena: ' + it.label, KD[it.k], m); }
    const ex = $('extra'); ex.innerHTML = `<h2>Test walki</h2><label style="display:flex;gap:6px;align-items:center;margin:4px 0"><input type="checkbox" id="aGod" checked> nieśmiertelny</label><label style="display:flex;gap:6px;align-items:center;margin:4px 0"><input type="checkbox" id="aTrain"> najpierw trening</label><label style="display:flex;gap:6px;align-items:center;margin:4px 0"><input type="checkbox" id="aDbg" checked> podgląd faz</label><div class="row" style="margin-top:8px"><button id="aGo" type="button">otwórz arenę →</button></div><p class="hint">Gra od razu w bójce na łące; po każdej walce przychodzi następny. Esc: menu.</p>`;
    $('aGo').onclick = () => { const q = new URLSearchParams({ arena: it.k }); if ($('aGod').checked) q.set('god', ''); if ($('aTrain').checked) q.set('train', ''); if ($('aDbg').checked) q.set('debug', ''); location.href = 'index.html?' + q.toString().replace(/=(&|$)/g, '$1'); }; }
  if (cat.k === 'bag') { const b = makeBag({ THREE, toon }); b.setFill(it.k); b.group.position.y = .3; b.group.rotation.y = Math.PI / 2; place(b.group); frame(b.group, 'iso'); describe('torba z gazetami', 'Płócienna listonoszka: klapa z przeszyciem, dwa paski z klamrami, kieszeń, naszywka, kółka na pasek; gazety ubywają, gdy rzucasz.', b.group); }
  if (cat.k === 'nature') { const o = nature.KINDS[it.k](Math.random); place(o.group); frame(o.group); describe(it.k, 'Przyroda przy drodze, w ogródkach i w laskach: modelowana w detalu (źdźbła, kępy liści, fasetki kamieni, pojedyncze liście).', o.group); }
  if (cat.k === 'houses' || cat.k === 'trees' || cat.k === 'lots') { const x = pieces(cat.k)[it.k], o = x.o; o.position.set(0, 0, 0); o.rotation.set(0, cat.k === 'trees' ? 0 : Math.PI, 0);   // (its front, towards the street, to the camera)
    place(o); frame(o); describe(x.label, WORLD_DESC[cat.k], o); }
  if (cat.k === 'ramps') { const o = props.ramp(Math.random, it.k); place(o.group); frame(o.group); describe('skocznia: ' + it.label, 'Wysokość krawędzi decyduje o locie.', o.group, [['krawędź', o.hit.h.toFixed(2) + ' m']]); }
  applyWire();
}
function list() { $('catName').textContent = cat.name; const box = $('items'); box.innerHTML = '';
  for (const it of cat.items()) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = String(it.k); b.innerHTML = `<span>${it.label}</span><small>${it.note}</small>`; b.onclick = () => show(it); box.appendChild(b); }
  document.querySelectorAll('#cats button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === cat.k))); show(cat.items()[0]); }
for (const c of CATS) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = c.k; b.textContent = c.name; b.onclick = () => { cat = c; list(); }; $('cats').appendChild(b); }

// ---------- the view's switches ----------
const tog = (id, f) => { const b = $(id); b.onclick = () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); f(v); }; };
let spin = true, wire = false; tog('spin', v => { spin = v; }); tog('pix', v => { px.uniforms.on.value = v ? 1 : 0; }); tog('grid', v => { grid.visible = v; }); tog('wire', v => { wire = v; applyWire(); });
function applyWire() { stand.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.wireframe = wire; }); }); }
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { if (stand.children[0]) { stand.rotation.y = 0; frame(stand.children[0], b.dataset.view); } });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); const dpr = renderer.getPixelRatio(); px.resize(w * dpr, h * dpr, 300); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let last = performance.now();
function loop(now) { const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
  if (spin) stand.rotation.y += dt * .35; if (mixer) mixer.update(dt);
  if (rider) rider.update({ dt, speed: 4, steer: 0, lean: 0, pedalling: 1, braking: 0, climbing: 0, onRelease: () => {}, look: null, tired: 0, nervous: 0, kick: null, air: false, fallen: 0, charge: null });
  controls.update(); px.render(scene, camera); requestAnimationFrame(loop); }
list(); requestAnimationFrame(loop);
window.STUDIO = { scene, camera, stand, cars, show, CATS, get cat() { return cat; }, set cat(c) { cat = c; } };
