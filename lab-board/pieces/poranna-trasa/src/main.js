// Poranna Trasa: the rider on the test street, with the game's first rules.
// The riding: pedalling (its push falling off with speed; Shift pushes a little harder), braking, the air and the tyres, hills,
// grass, a jolt over a kerb or a pothole. Steering: less lock the faster; the bike leans into a turn (from the speed and the
// tightness of the turn, held back), on a spring. Space kicks (a dog at your heel); C hops; a ramp throws you
// into the air; in the air you clear what is low enough. What stops you: houses, fences, trees, poles, cars (parked and moving),
// cones, a wagon... into one fast and you are off: the bike goes over, the boy with it, and after a moment he picks it up again.
// Bin bags and hedges only hold you up; a bundle of papers on the pavement is picked up.
// Throwing: hold Q or E (left, right): a small bar over his head fills; let go and the paper flies as hard as it was drawn. A paper
// that comes down on a porch: 2 points; in a mailbox: 5 (and thanks from the window); under the windows: 1; through a window: 2 (the glass goes); past the house: nothing.
// Dogs: now and then one runs out after you; barking at your side it slows you (he looks round at it, nervous); a kick sends it off.
// R starts again (after a yes). V: the next camera (through his eyes, close, middling, far, high over the street); 1-5: the pixel size. Pad: left stick steer, RT pedal, LT brake, A kick, B hop, X harder, LB / RB (held) throw left / right.

import * as THREE from 'three';
import { createRider } from './rider.js';
import { createTrack } from './track.js';
import { createPixel } from './pixel.js';
import { createTextures } from './textures.js';
import { createBackdrop } from './backdrop.js';
import { createTraffic } from './traffic.js';
import { createDogs } from './dogs.js';
import { createHud } from './hud.js';
import { createGranny } from './granny.js';
import { createTouch } from './touch.js';
import { createPedestrians } from './pedestrians.js';
import { createSettings, PRESETS, MENU_STYLES, LIGHT, lookUniforms, DEFAULTS as LOOK0 } from './settings.js';
import { createMenu } from './menu.js';
import { createWater } from './water.js';
import { createResidents } from './residents.js';
import { installCursors } from './cursor.js';
import { createOnFoot } from './onfoot.js';
import { createLife } from './life.js';
import { createCyclo } from './cyclo.js';
import { createHudBag } from './hudbag.js';
import { makeBag } from './bag.js';
import { createTalk } from './talk.js';
import { createQuests } from './quests.js';
import { createShop } from './shop.js';
import { createRun, kept } from './run.js';
import { createBook } from './book.js';
import { createAudio } from './audio.js';
import { createPad, BTN } from './pad.js';
import { createWorld } from './world.js';
import { createModes, MODES } from './modes.js';
import { createMp } from './mp.js';
import { createNet } from './net.js';
import { createBikes, TYPES as BIKE_TYPES, SLOTS, newParts, bikeMods, bikeLook, strangerBike } from './bikes.js';
import { createGarage } from './garage.js';
import * as LVM from './levels.js';
import * as JB from './jobs.js';
import * as WT from './watki.js';
import { createGeese } from './geese.js';
import { createCrossing } from './crossing.js';
import { createMap, RC as MAP_RC, PTS as MAP_PTS } from './map.js';
import { createDiorama } from './dio.js';
import { createPaper, NEWS, eventNews, CAST, ANECDOTES, printed, badgesOf } from './paper.js';
import { createHoops } from './hoops.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PARTS } from './shop.js';
{ const m = location.hash.match(/^#odpowiedz=([^&]+)/); if (m) { const ch = new BroadcastChannel('pt-answer'), say = (t, sub) => { document.body.innerHTML = `<div style="position:fixed;inset:0;display:grid;place-items:center;background:#0c0d0f;color:#f6f3ea;font:700 15px/1.5 ui-monospace,Consolas,monospace;text-align:center;padding:20px"><div><div style="color:#efc970;font-size:22px;letter-spacing:.1em">${t}</div><div style="opacity:.75;margin-top:8px">${sub}</div></div></div>`; };
  let ok = false; ch.onmessage = e => { if (e.data?.ok) { ok = true; say('PRZEKAZANE!', 'Wróć do karty z grą, zaraz się połączycie. Tę kartę możesz zamknąć.'); setTimeout(() => window.close(), 1200); } };
  ch.postMessage({ code: m[1] }); say('PRZEKAZUJĘ...', 'Szukam otwartej gry w tej przeglądarce.');
  setTimeout(() => { if (!ok) say('NIE ZNALAZŁEM GRY', 'Karta z zaproszeniem musi być otwarta w tej samej przeglądarce. Możesz też skopiować ten adres i wkleić go w okno gry.'); }, 1800);
  await new Promise(() => { }); } }
// people animated as if drawn, on so many frames a second (0: smoothly): each mixer keeps the time and moves on only a whole frame at
// a time (the bike, the camera and the game itself stay smooth)
const STEP = { fps: 0 }, FXK = { blur: 1 };   // (FXK: the look's knobs the game itself uses: how strong the sprint's blur)
{ const upd = THREE.AnimationMixer.prototype.update; THREE.AnimationMixer.prototype.update = function (dt) { if (!STEP.fps) return upd.call(this, dt); this._acc = (this._acc || 0) + dt; if (this._acc < 1 / STEP.fps) return this; const a = this._acc; this._acc = 0; return upd.call(this, a); }; }
installCursors();

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(58, 1, .1, 950);
const px = createPixel({ THREE, renderer, height: 240 });
const hud = createHud();

// toon: three tones, as the rider has
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([80, 165, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
// a glint of light on the edges that face the sun: a hard, warm band where a thing turns away from the eye (its strength in the look's settings)
// what stands between the camera and him (a tree's crown, a roof's edge) thins away round the line to him, in a dither: FADE the
// camera's place, his (his chest), the radius (0: off, as through his eyes)
const FADE = { cam: { value: new THREE.Vector3() }, tgt: { value: new THREE.Vector3() }, r: { value: 0 } };
const RIM = { k: { value: .5 }, col: { value: new THREE.Color('#ffe0a0') }, sun: { value: new THREE.Vector3(0, 1, 0) }, up: { value: new THREE.Vector3(0, 1, 0) } };
// (noFade on a material: the boy himself, never thinned away)
function rimmed(m) { m.onBeforeCompile = sh => { sh.uniforms.rimK = RIM.k; sh.uniforms.rimCol = RIM.col; sh.uniforms.sunV = RIM.sun; sh.uniforms.upV = RIM.up;
    sh.uniforms.fadeCam = FADE.cam; sh.uniforms.fadeTgt = FADE.tgt; sh.uniforms.fadeR = FADE.r;
    sh.vertexShader = 'varying vec3 vFadeW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      #ifdef USE_INSTANCING
        vFadeW = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
      #else
        vFadeW = (modelMatrix * vec4(transformed, 1.)).xyz;
      #endif`);
    sh.fragmentShader = 'varying vec3 vFadeW; uniform vec3 fadeCam, fadeTgt; uniform float fadeR;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if (fadeR > 0. && ${m.userData.noFade ? 'false' : 'true'}) { vec3 ab = fadeTgt - fadeCam; float t = clamp(dot(vFadeW - fadeCam, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
        float d = length(vFadeW - (fadeCam + ab * t)), rad = fadeR * max(smoothstep(0., .3, t), 1.7 * (1. - smoothstep(0., .14, t)));   // (wide by him, and wide right at the lens too: a crown the camera is in)
        if (t < .92 && d < rad && vFadeW.y > fadeTgt.y - .75) { float k = 1. - d / rad, n = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy / 2.), vec2(.06711056, .00583715)))); if (n < k * 2.2) discard; } }`);   // (not the ground under him: only what stands higher than his knees)
    sh.fragmentShader = 'uniform float rimK; uniform vec3 rimCol; uniform vec3 sunV; uniform vec3 upV;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
      { float fr = 1. - clamp(dot(normal, normalize(vViewPosition)), 0., 1.), lit = dot(normal, sunV);
        float lying = smoothstep(.5, .8, dot(normal, upV));             // (not the ground, nor anything lying flat: only things that stand)
        gl_FragColor.rgb += rimCol * rimK * step(.7, fr) * step(.12, lit) * (1. - lying) * (1. - gl_FragColor.rgb * .55); }`); };
  m.customProgramCacheKey = () => m.userData.noFade ? 'rim2nf' : 'rim2'; return m; }
const toon = (c, o = {}) => rimmed(new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, ...o }));
const RAMPS = { 2: [105, 255], 3: [80, 165, 255], 4: [72, 132, 196, 255], 5: [62, 112, 162, 212, 255] };
function setToon(n) { const d = RAMPS[n] || RAMPS[3]; ramp.image = { data: new Uint8Array(d), width: d.length, height: 1 }; ramp.needsUpdate = true; }

// ---------- the sky, the light ----------
{ const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#6fa9c2'); gr.addColorStop(.55, '#a9d0d8'); gr.addColorStop(.8, '#e6ecd6'); gr.addColorStop(1, '#f6efd3'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.fog = new THREE.Fog('#dfe5cf', 90, 620);
const hemi = new THREE.HemisphereLight('#cfe6f2', '#6b5a3a', 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe6bf', 2.7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 120 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);
const SUN = new THREE.Vector3(-.6, .5, -.38).normalize();              // low (about 34°), from ahead and to the left: long shadows across the road
// clouds: three shapes, lit on top and shaded under; two layers (nearer and higher, farther and lower) drifting with the wind at
// different speeds, so the sky has depth
const clouds = [];
{ const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];   // (a 4x4 order, for the dithered steps between tones)
  // a cumulus: puffs along a line, bumpy on top, flat under; each pixel toned by how high in the cloud it sits and how near the lit
  // (upper left) edge of its puff: bright cream on top, warm white, a grey-blue shade low down, a darker line at the base
  const cumulus = (seed, W = 72, H = 30) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); let a = seed; const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
    const base = H - 4, n = 5 + (r() * 4 | 0), puffs = Array.from({ length: n }, (_, k) => { const u = (k + .5) / n, rr = 5 + Math.sin(u * Math.PI) * (7 + r() * 5) + r() * 2; return [6 + u * (W - 12) + (r() - .5) * 4, base - rr * (.55 + r() * .25), rr]; });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (y > base) continue; let inside = false, lit = -9;
      for (const [px, py, pr] of puffs) { const dx = x - px, dy = y - py, d = Math.hypot(dx, dy); if (d < pr) { inside = true; lit = Math.max(lit, (-dx * .45 - dy) / pr - d / pr * .35); } }
      if (!inside) continue; const hgt = (base - y) / 14, th = B4[y & 3][x & 3] / 16, v = lit * .6 + hgt * .5 + (th - .5) * .25;
      g.fillStyle = y >= base - 1 ? '#aebcc2' : v > .62 ? '#fff8e3' : v > .3 ? '#f3eed2' : v > .05 ? '#dde2da' : '#c3ced0'; g.fillRect(x, y, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  // a streak high up: a few thin wisps, pale, broken by the order
  const streak = (seed, W = 96, H = 10) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); let a = seed; const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 4; k++) { const cx = 10 + r() * (W - 20), cy = 2 + r() * (H - 4), rx = 12 + r() * 26, ry = .8 + r() * 1.4;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (q < 1 && B4[y & 3][x & 3] / 16 < 1.15 - q) { g.fillStyle = q < .35 ? '#fff8e3' : '#e8eed6'; g.fillRect(x, y, 1, 1); } } }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  const CU = [7, 19, 31, 43, 57, 71].map(sd => cumulus(sd)), LOW = [11, 23, 37].map(sd => cumulus(sd, 96, 22)), HI = [5, 17, 29].map(sd => streak(sd));
  const add = (tex, R, y, w, h, speed, a, op = 1) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, transparent: true, opacity: op, depthWrite: false, alphaTest: .4 })); s.scale.set(w, h, 1); scene.add(s); clouds.push({ s, a, R, y, speed }); };
  for (let k = 0; k < 12; k++) { const w = 80 + (k * 23 % 50); add(CU[k % CU.length], 280 + (k * 17 % 50), 82 + (k * 29 % 36), w, w * 30 / 72, .006 + (k % 3) * .002, k / 12 * 6.283 + k * .7); }   // (the big ones, over the town)
  for (let k = 0; k < 9; k++) { const w = 140 + (k * 19 % 60); add(LOW[k % LOW.length], 430 + (k * 13 % 30), 46 + (k * 31 % 22), w, w * 22 / 96, .0025 + (k % 2) * .001, k / 9 * 6.283 + 2.1); }   // (low, far, long)
  for (let k = 0; k < 7; k++) { const w = 170 + (k * 29 % 80); add(HI[k % HI.length], 360 + (k * 11 % 40), 140 + (k * 17 % 30), w, w * 10 / 96, .004 + (k % 2) * .0015, k / 7 * 6.283 + .5, .75); } }   // (high streaks)
function drift(dt) { for (const c of clouds) { c.a += c.speed * dt; c.s.position.set(90 + Math.cos(c.a) * c.R, c.y, Math.sin(c.a) * c.R); } }
drift(0);

// ---------- the street, the traffic, the dogs, the rider ----------
// (?audit: nothing merged, for the ground check, see track.audit)
const REGION = new URLSearchParams(location.search).get('region') || 'peryferia';   // (a region's world: built for it; another region: the page loads again)
const track = createTrack({ THREE, toon, tex: createTextures({ THREE }), showcase: new URLSearchParams(location.search).has('audit'), region: REGION }); track.dapSun.value.copy(SUN); scene.add(track.group);
const backdrop = createBackdrop({ THREE }); backdrop.position.set(track.centre.x, 16, track.centre.z); scene.add(backdrop);   // (the lake and the town, all round)
// the village's geese (geese.js): on the verges, across the road when a bike comes
const geese = track.region === 'wies' ? createGeese({ THREE, scene, track, toon }) : null;
const traffic = createTraffic({ THREE, track, cars: track.cars, n: 6, makeRider: () => createRider({ THREE, ramp, toon }), bikes: 2 }); scene.add(traffic.group);   // (cars, and now and then a cyclist coming the other way)
const dogs = createDogs({ THREE, toon, probe: track.probe });
const water = createWater({ THREE, scene });
const residents = createResidents({ THREE, toon, track, hud, scene });
// what by the road answers a kick: mailboxes (three and it is off its post), poles, trees and bushes (their leaves), swings, cones
const stuff = createWorld({ THREE, scene, track, toon, audio: { play: (n, o) => audio.play(n, o) }, makeDog: (c, sz) => dogs.makeDog(c, sz), say: (at, t) => hud.rant(at, t, false),
  onLoot: T => { shop.grant(T.item, T.tier); audio.play('pick'); flash(T.label + '! Zamontowane. Właściciel się nie dowie... chyba'); B.fame = (B.fame || 0) + 1; setTimeout(() => hud.rant(new THREE.Vector3(T.x, T.y + 1.6, T.z), 'EJ! MOJE PRZERZUTKI!!!', false), 1600); witness?.(T.x, T.z); },
  onShrine: T => { B.fame = (B.fame || 0) + .5; hud.rant(new THREE.Vector3(T.x + 1, T.y + 1.8, T.z), pickOf(['OBRAZA BOSKA!', 'JEZUS MARIA, CO TY ROBISZ?!', 'POKUTA CIĘ NIE MINIE!']), false); },
  onBreak: T => { B.fame = (B.fame || 0) + .4; hud.pop(new THREE.Vector3(T.x, T.y + 1.6, T.z), 'SKRZYNKA!', '#cf5a3e'); witness?.(T.x, T.z); } });   // (people sitting out in their gardens)                         // (a hydrant knocked or kicked)
const peds = createPedestrians({ THREE, toon, track }); scene.add(peds.group);
// a word with people, and the errands that come of it (talk.js: the box; quests.js: who wants what, and what came of it)
const audio = createAudio();
// a sound out in the world: as loud as it is near the camera, from its side
const _ar = new THREE.Vector3();
function where(at) { if (!at) return { vol: 1, pan: 0 }; const dx = at.x - camera.position.x, dz = at.z - camera.position.z, d = Math.hypot(dx, dz, (at.y || 0) - camera.position.y); _ar.set(1, 0, 0).applyQuaternion(camera.quaternion);
  return { vol: Math.min(1, 1.6 / (1 + d / 12)), pan: Math.max(-1, Math.min(1, (dx * _ar.x + dz * _ar.z) / Math.max(4, d))) }; }
const aud = (name, at) => audio.play(name, where(at));
// whose voice a bubble is in: the nearest one there (him, someone in a garden, out walking, the police, the gang, a driver, pan Janusz)
const PED_V = { lady: 'lady', mum: 'lady', shopper: 'lady', kid: 'kid', teen: 'gang', jogger: 'voice', oldman: 'grandpa', dogman: 'grandpa', suit: 'voice', gardener: 'grandpa' };
function speakerAt(at) { if (!at) return 'voice'; const d = (x, z) => Math.hypot(x - at.x, z - at.z); const P = foot.active ? foot.me : B; if (d(P.x, P.z) < 1.4) return 'player';
  let best = 'voice', bd = 3;
  for (const r of residents.list) { const l = d(r.G.position.x, r.G.position.z); if (l < bd) { bd = l; best = r.lines === 'lump' ? 'lump' : r.lines === 'shacks' ? 'lads' : r.key === 'belly' ? 'belly' : r.key === 'granma' ? 'granma' : r.key === 'grandpa' || r.lines === 'stop' ? 'grandpa' : 'voice'; } }
  for (const p of peds.list) { const l = d(p.x, p.z); if (l < bd) { bd = l; best = PED_V[p.P.key] || 'voice'; } }
  for (const c of quests.policeCars()) { const l = d(c.g.position.x, c.g.position.z); if (l < Math.max(bd, 4)) { bd = l; best = 'police'; } }
  for (const g of quests.gangTargets) { const l = d(g.x, g.z); if (l < bd) { bd = l; best = 'gang'; } }
  for (const t of traffic.list) { if (t.off) continue; const l = d(t.car.group.position.x, t.car.group.position.z); if (l < Math.max(bd, 3)) { bd = l; best = 'voice'; } }
  for (const s of track.shops || []) if (s.door && d(s.door.x, s.door.z) < 4.5 && bd > 1) best = 'janusz';
  return best; }
hud.hooks.onSay = (text, at) => { const k = speakerAt(at); audio.say(text, k, { ...where(at), id: k }); };
hud.hooks.onHit = (word, at) => aud(word === 'BUM!' || word === 'BACH!' || word === 'ŁUBUDU!' || word === 'KOP!' ? 'kick' : 'punch', at);
const VOICE_OF = n => /ŁAWKI/.test(n) ? 'lump' : /EKIPA/.test(n) ? 'lads' : /POSTERUNKOWY|SIERŻANT|ASPIRANT|DYŻURNY/.test(n) ? 'police' : /JANUSZ/.test(n) ? 'janusz' : /GŁOS Z OKNA|^PANI/.test(n) ? 'granma' : /TOREBKA/.test(n) ? null : /MIREK|RYSIEK|JANEK/.test(n) ? 'belly' : 'grandpa';
const talk = createTalk({ label: (i, light, sel) => !pad.active ? String(i + 1) : light ? ['←', '→', '↑', '↓'][i] || String(i + 1) : sel ? pad.name(BTN.A, true) : '·', onSay: (who, text) => { const k = VOICE_OF(who || ''); if (k) audio.say(text, k, { id: 'talk' }); }, onPick: () => audio.play('ui') });
let MOD = { top: 0, acc: 0, steer: 0, grass: 0, hill: 0, stam: 0, bag: 0, trick: 0, bell: 0, lamp: 0 };   // (what the bike does: its frame and its parts, bikes.js)
// the bike he rides (its kind and its parts), his spare parts, the paints he has bought (bikes.js, shop.js, the inventory page)
let myBike = { type: 'moj', parts: newParts() }; const INV = [], PAINTS = new Set([0]);
let LV = null, SUBR = Math.random, reMap = false, reFin = false;
function applyBike() { MOD = bikeMods(myBike); B.bagMax = 30 + MOD.bag; rider.setParts(bikeLook(myBike)); }
const shop = createShop({ THREE, createRider: () => createRider({ THREE, ramp, toon }), game: { get money() { return B.points; }, set money(v) { B.points = Math.max(0, v); }, get papers() { return B.papers; }, set papers(v) { B.papers = v; }, get hp() { return B.hp ?? 100; }, set hp(v) { B.hp = v; },
  get items() { return (B.items ||= []); }, flash: s => flash(s), say: s => audio.say(s, 'janusz', { id: 'shop' }), bye: s => { saveCampaign(); if (reMap) { reMap = false; setTimeout(() => openMap(), 0); return; } if (reFin) { reFin = false; setTimeout(() => fin.reopen(), 0); return; } const sh = (track.shops || []).filter(q => q.door).sort((a, b) => Math.hypot(a.door.x - B.x, a.door.z - B.z) - Math.hypot(b.door.x - B.x, b.door.z - B.z))[0]; if (sh) hud.rant(sh.door.clone().setY(sh.door.y + 2.1), s, false); }, get titles() { return ACT().map(k => ({ key: k, name: TITLES[k].name, col: TITLES[k].col, n: B.mix[k] })); }, addTitle: (k, n) => { B.mix[k] += n; B.papers += n; }, get bike() { return myBike; }, inv: INV, paints: PAINTS, coupon: () => LVM.load().coupon || null, useCoupon: () => LVM.save({ coupon: null }), onChange: () => applyBike() } });
const money = (n, at, label) => { B.points = Math.max(0, B.points + n); hud.pop(at, label, n >= 0 ? '#efc970' : '#cf5a3e'); }; money.has = n => B.points >= n;
const quests = createQuests({ THREE, track, residents, peds, hud, talk, game: {
  rider: () => foot.active ? { x: foot.me.x, z: foot.me.z, y: foot.me.y, yaw: foot.me.yaw, v: Math.hypot(foot.me.vf, foot.me.vs), foot: true } : { x: B.x, z: B.z, y: B.y, yaw: B.yaw, v: Math.abs(B.v), foot: false },
  money, get papers() { return B.papers; }, set papers(v) { B.papers = Math.max(0, v); },
  item: (name, at) => { (B.items ||= []).push(name); hud.pop(at.clone(), 'FANT: ' + name, '#9fd27a'); flash('Fant: ' + name.toLowerCase()); },
  flash: s => flash(s), fame: n => { B.fame = Math.max(0, (B.fame || 0) + n); },
  bottle: () => { if (foot.active || B.crash) return; hud.impact(rider.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 'BRZDĘK!'); B.v *= .6; B.rattled = (B.rattled || 0) + 1.5; shake = Math.max(shake, .25); },
  grudgeAt: (at, line, kind) => foot.grudgeAt(at, line, kind),
  dropBag: (at, onPick) => dropLoot(at, 'bag', onPick), makeRider: () => createRider({ THREE, ramp, toon }), shove: dir => { if (!foot.active && !B.crash) crash(0, dir.setLength(3.2)); },
  jostle: (dir, n) => { if (foot.active || B.crash) return; B.v *= .82; B.jolt = .16; const l = Math.hypot(dir.x, dir.z) || 1; B.x += dir.x / l * .35; B.z += dir.z / l * .35; shake = Math.max(shake, .25); audio.play('kick', { vol: .6 }); hud.impact(rider.root.position.clone().setY(rider.root.position.y + 1.3), 'ŁUP!'); hurt(6, 'Gang cię dopadł.'); flash(`Kopniak od gangu: ${n}/5`); }, scene, openShop: () => shop.open(), lamp: () => MOD.lamp > 0, diff: () => difficulty(), traffic, fameNow: () => B.fame || 0, endRun: msg => endRun(msg),
  talkKey: () => touch.on ? 'GADAJ' : (foot.active ? keysOf('talk') : keysOf('chat')) + ': GADAJ' } });
const life = createLife({ THREE, scene, track, cars: track.cars, toon });   // (out there: cars and a tractor on a country road, birds)
const granny = createGranny({ THREE, toon, probe: track.probe, doors: track.doors }); scene.add(granny.group);
{ let a = 23; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (const d of track.doors) if (r() < .2) { const dog = dogs.add(d.p.x, d.p.z, r() * 6, r); scene.add(dog.group); } }
let rider = createRider({ THREE, ramp, toon }); scene.add(rider.root);
// his other bikes, by the garage at home: one leant there, one upside down, its front wheel off (being mended)
const wbikes = createBikes({ THREE, scene, track, createRider, ramp, toon });
function spawnBikes() { wbikes.clear(); let a = 77; wbikes.spawn(() => { a = (a * 16807) % 2147483647; return a / 2147483647; });   // (the same gardens each time)
  for (const b of track.home?.bikes || []) if (!b.up) wbikes.add({ type: 'bmx', parts: newParts({ kierownica: 2 }) }, b.p.x, b.p.z, b.yaw, false, { kind: 'brat' }); }
spawnBikes();
for (const b of track.home?.bikes || []) { if (!b.up) continue; const r = createRider({ THREE, ramp, toon }); r.boy.visible = false; scene.add(r.root); const y = track.probe(b.p.x, b.p.z, track.startI).y;
  r.update({ dt: 0, speed: 0, steer: 0, lean: 0, pedalling: 0, braking: 0, climbing: 0 }); r.root.position.set(b.p.x, y, b.p.z); r.root.rotation.set(0, b.yaw, 0);
  if (b.up) { r.root.rotation.z = Math.PI; r.root.position.y = y + 1.02; if (r.frontWheel) r.frontWheel.visible = false; r.setParts({ paint: '#2f4a6e' }); } else { r.lean.rotation.z = .12; r.setParts({ paint: '#3f8a4a' }); } }
// ---------- on foot (F: off the bike, and back on by it) and the fights (onfoot.js) ----------
function solid(x, z, r, hint, feet = null) {                           // (what a walker is pushed out of: the hard things near; feet: in the air, over the lower ones)
  let sx = 0, sz = 0, any = false;
  for (const C of track.near(hint < 0 ? B.hint : hint)) { if (C.used || ['ramp', 'hole', 'manhole', 'bundle'].includes(C.kind) || C.h < .3 || (feet != null && (C.y0 || 0) + C.h < feet + .05)) continue; const h = boxHit(C, x, z, r); if (h) { sx += h.nx * h.pen; sz += h.nz * h.pen; any = true; } }
  return any ? { x: sx, z: sz } : null;
}
// beaten: the winner takes something off him (and says so)
function loseFight() {
  hurt(35, 'Przegrana bójka. Siniaki na tydzień.'); const r = Math.random(), n = B.points;
  if (r < .4) { B.points = 0; flash(n ? `Zabrał ci całą kasę (${n} zł)!` : 'Chciał ci zabrać kasę. Nie miałeś.'); return n ? pickOf(['DZIĘKI ZA ' + n + ' ZŁ, KOLEŻKO!', 'TO NA PIWO. I NA DRUGIE.', 'PODATEK OD KOPANIA!', 'ALIMENTY SIĘ SAME NIE ZAPŁACĄ!']) : pickOf(['NAWET KASY NIE MASZ, BIEDAKU!', 'GOŁODUPIEC!']); }
  if (r < .62) { const k = Math.ceil(B.papers / 2); B.papers -= k; flash(`Zabrał ci ${k} gazet!`); return pickOf(['POCZYTAM SOBIE W KIBLU!', 'NA ROZPAŁKĘ DO GRILLA!', 'HOROSKOPY LUBIĘ!']); }
  if (r < .84) { const q = track.probe(B.x, B.z, B.hint), i = (q.i + Math.round((45 + Math.random() * 30) / (track.len / track.N))) % track.N, S = track.S[i];   // (your bike: ridden off and dropped further up the road)
    B.x = S.p.x + S.r.x * 3.2; B.z = S.p.z + S.r.z * 3.2; B.hint = i; B.y = track.probe(B.x, B.z, i).y; B.yaw = Math.atan2(S.f.x, S.f.z); parkBike(); flash('Ukradł ci rower! Rzucił go dalej przy drodze (strzałka na dole). Albo weź jego: leży obok.');
    return pickOf(['POŻYCZĘ NA CHWILĘ!', 'TERAZ TY IDZIESZ Z BUTA!', 'DAWAJ KOŁA, KOLEGO!']); }
  B.points = Math.max(0, B.points - 3); flash('Zrobił sobie z tobą selfie. -3 zł za prawa do wizerunku.'); return pickOf(['FOTKA NA GRUPĘ OSIEDLA!', 'UŚMIECH! DO RELACJI!', 'MAMA BĘDZIE DUMNA!']);
}
const foot = createOnFoot({ THREE, toon, scene, track, hud, camera, solid, fx: { score: (n, at, l, c) => score(n, at, l, c), flash: t => flash(t), shake: v => { shake = Math.max(shake, v); }, slow: v => { slowmo = Math.max(slowmo, v); },
  rant: (at, t) => hud.rant(at, t, true), pop: (at, t, c) => hud.pop(at, t, c), tip: t => hud.tip(t), impact: (at, t) => hud.impact(at, t || undefined), take: () => loseFight(), drop: at => dropLoot(at) } });
const bikeSpot = () => { const me = foot.me, fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), t = THREE.MathUtils.clamp((me.x - B.x) * fx + (me.z - B.z) * fz, -.9, .9); return { x: B.x + fx * t, z: B.z + fz * t }; };   // (the nearest of the bike, front wheel to back)
let garage = null;   // (the inventory page: made below, once what it needs is there)
// the bikes he could get on, near him on foot: his own (in reach to get on), one in a garden, a cyclist's knocked down
function bikeChoices(me) { const out = []; if (foot.active) { const sp = bikeSpot(); out.push({ kind: 'mine', d: Math.hypot(me.x - sp.x, me.z - sp.z) }); }
  const w = wbikes.nearest(me.x, me.z, 6); if (w) { const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw), t = THREE.MathUtils.clamp((me.x - w.x) * fx + (me.z - w.z) * fz, -.9, .9); out.push({ kind: 'world', ref: w, bike: w.bike, x: w.x, z: w.z, yaw: w.yaw, lying: w.lying, side: w.side, owner: w.owner, d: Math.hypot(me.x - w.x - fx * t, me.z - w.z - fz * t) }); }
  // (a cyclist's: knocked down, or the one whose rider is after you or lying beaten: his bike there to take)
  for (const b of traffic.bikes) if (b.on && (b.fall || b.hold)) { b.bike ||= { ...strangerBike(['kolarzowka', 'skladak', 'trekking', 'ostre', 'bmx'][Math.random() * 5 | 0]), paint: '#' + b.r.materials.frame.color.getHexString() };
    out.push({ kind: 'traffic', ref: b, bike: b.bike, x: b.x, z: b.z, yaw: b.yaw, lying: true, side: b.fall?.side || 1, owner: { kind: 'cyclist' }, d: Math.hypot(me.x - b.x, me.z - b.z) - .6 }); }
  return out.sort((a, b) => a.d - b.d); }
function takeBike() { const all = bikeChoices(foot.me), mine = all.find(c => c.kind === 'mine'), other = all.find(c => c.kind !== 'mine');   // (his own first: someone else's only when he stands clearly nearer it)
  const c = mine && mine.d <= 1.7 && !(other && other.d < mine.d - .5) ? mine : all[0]; if (!c || c.d > 1.7) return false; if (c.kind === 'mine') { mount(); return true; } swapTo(c); return true; }
// on someone else's: yours left where it stood (yours to come back for), you on that one, as it lies; and they notice
const TAKEN = { house: ['EJ! TO MÓJ ROWER!', 'ZŁODZIEJ! POLICJA!', 'ODDAWAJ ROWER, GÓWNIARZU!', 'MAMO! ON MI KRADNIE ROWER!'], cyclist: ['MÓJ ROWER!!!', 'ZŁODZIEJ! ODDAWAJ!', 'ZAPAMIĘTAM TWOJĄ GĘBĘ!'], brat: ['ODDAJ MÓJ ROWER! POWIEM MAMIE!', 'TYLKO GO NIE PORYSUJ!', 'TO MOJE BMX, NIE TWOJE!'] };
function swapTo(c) { const old = myBike; wbikes.add(old, B.x, B.z, B.yaw, !!B.bikeDown, { kind: 'left' });
  myBike = c.bike; if (c.kind === 'world') wbikes.remove(c.ref); else { const b = c.ref; b.on = false; b.r.root.visible = false; b.fall = null; b.hold = false; b.heldByMe = false; b.wait = 25 + Math.random() * 20; b.bike = null; b.r.ragdollOff?.(); }
  const q = track.probe(c.x, c.z, B.hint); Object.assign(B, { x: c.x, z: c.z, yaw: c.yaw, hint: q.i, y: q.y, gPrev: q.y, v: 0 }); B.bikeDown = c.lying ? { lean: c.side * 1.38 } : null;
  applyBike(); parkBike(); const T = BIKE_TYPES[myBike.type] || BIKE_TYPES.moj, o = c.owner || {}, L = TAKEN[o.kind];
  if (L) { const at = o.at ? o.at.clone().setY(o.at.y + 1.6) : new THREE.Vector3(c.x, B.y + 1.8, c.z); hud.rant(at, pickOf(L), false); B.fame = (B.fame || 0) + (o.kind === 'brat' ? 0 : o.kind === 'cyclist' ? .8 : .6); }
  mount(); flash(o.kind === 'left' ? `Znów na: ${T.name.toLowerCase()}` : `Zabrany rower: ${T.name.toLowerCase()}. Twój został tam, gdzie stał`); }
// a cyclist knocked down, him on foot near: he stays down (the bike there to take); and the card of a bike under the mouse (or, the
// pointer held by the game, the nearest by him)
const _rc = new THREE.Raycaster(), _nd = new THREE.Vector2(); let cardT = 0;
function stepBikeCards(dt) { const me = foot.active ? foot.me : null;
  for (const b of traffic.bikes) { const near = me && b.on && b.fall && Math.hypot(me.x - b.x, me.z - b.z) < 9; if (near && !b.hold) { b.hold = true; b.heldByMe = true; } else if (!near && b.heldByMe) { b.hold = false; b.heldByMe = false; } }
  if ((cardT -= dt) > 0) return; cardT = .08; const busy = map.isOpen || fin.isOpen || menu.open || asking || shop.isOpen || talk.isOpen || runUI.isOpen || modes.isOpen || mp.isOpen || book.isOpen || garage?.isOpen;
  if (busy) return wbikes.card.hide(); const P = me || B, cands = bikeChoices(P).filter(c => c.kind !== 'mine' && c.d < 30);
  let pick = null; if (!document.pointerLockElement && mouse.inside) { _nd.set(mouse.nx, -mouse.ny); _rc.setFromCamera(_nd, camera); let bd = 1e9;
      for (const c of cands) { const root = c.kind === 'world' ? c.ref.r.root : c.ref.r.root, h = _rc.intersectObject(root, true)[0]; if (h && h.distance < bd) { bd = h.distance; pick = c; } } }
  if (!pick && me) pick = cands.find(c => c.d < 2.6) || null;
  if (!pick) return wbikes.card.hide(); const at = new THREE.Vector3(pick.x, (track.probe(pick.x, pick.z, B.hint).y) + 1.25, pick.z), sc = project(at); if (!sc) return wbikes.card.hide();
  const [W, H] = px.size, hint = !me ? keysOf('mount') + ': ZSIĄDŹ, PODEJDŹ I ZABIERZ' : pick.d <= 1.7 ? keysOf('mount') + ': ZABIERZ I JEDŹ' : 'PODEJDŹ BLIŻEJ, ŻEBY ZABRAĆ';
  wbikes.card.show(pick.bike, myBike, sc.x * innerWidth / W, sc.y * innerHeight / H - 8, hint); }
// the inventory page (garage.js): the bike ridden, the spares, a bike stood by him (within 3 m, his on foot or standing still)
const nearWorld = () => { const P = foot.active ? foot.me : B; if (!foot.active && Math.abs(B.v) > .3) return null; return wbikes.nearest(P.x, P.z, 3); };
garage = createGarage({ THREE, createRider: () => createRider({ THREE, ramp, toon }), PARTS, SLOTS, TYPES: BIKE_TYPES, bikeMods, bikeLook, game: {
  get bike() { return myBike; }, inv: INV, paints: PAINTS, near: nearWorld, stopped: () => foot.active || Math.abs(B.v) < .3, onChange: () => applyBike(), flash: s => flash(s), sound: n => audio.play(n),
  keyCode: () => BIND.inv?.[0], takeNear: w => swapTo({ kind: 'world', ref: w, bike: w.bike, x: w.x, z: w.z, yaw: w.yaw, lying: w.lying, side: w.side, owner: w.owner }),
  stripped: w => { if (w.stripped) return; w.stripped = true; const o = w.owner || {}; if (o.kind === 'house') { hud.rant(o.at.clone().setY(o.at.y + 1.6), pickOf(['EJ! ZOSTAW MÓJ ROWER!', 'CO TY ROZKRĘCASZ?!', 'POLICJA! ROWER MI ROZBIERAJĄ!']), false); B.fame = (B.fame || 0) + .3; }
    else if (o.kind === 'brat') hud.rant(new THREE.Vector3(w.x, w.r.root.position.y + 1.8, w.z), 'MOJE CZĘŚCI! MAMOOO!', false); } } });
function parkBike() { rider.root.position.set(B.x, B.y, B.z); rider.root.rotation.set(0, B.yaw, .2, 'YXZ'); }   // (the bike on its stand, leaning a little)
function dismount(why) {
  const lf = { x: Math.cos(B.yaw), z: -Math.sin(B.yaw) };
  if (!foot.start({ x: B.x + lf.x * .8, z: B.z + lf.z * .8, yaw: B.yaw, hint: B.hint })) return false;
  B.v = 0; B.charge = null; B.kick = null; B.parked = true; rider.boy.visible = false; parkBike(); flash(why || 'Pieszo. Kliknij: mysz steruje. F przy rowerze: wsiadasz, V: widok z oczu'); return true;
}
function mount() { if (document.pointerLockElement) { mouse.hadLock = false; document.exitPointerLock(); }   // (let go on purpose: not the Esc that pauses)
  mouse.used = false; foot.stop();
  if (B.bikeDown) { B.lift = { t: 0, from: B.bikeDown.lean }; B.lean = B.bikeDown.lean; B.bikeDown = null; flash('Podnosisz rower'); } B.parked = false; B.safe = 2.5; B.rattled = 0; rider.boy.visible = true; C.init = false; flash('Na rowerze!'); }
let B = { x: track.start.x, z: track.start.z, y: 0, vy: 0, air: false, gPrev: 0, gVel: 0, yaw: track.start.yaw, v: 0, steer: 0, lean: 0, leanV: 0, hint: 0, pitch: 0, jolt: 0,
  stam: 1, spent: false, tired: 0, papers: 30, points: 0, lastD: 0, crash: null, kick: null, dogSlow: 0, look: null, charge: null, throwP: .6 };
const L = rider.wheelbase, g = 9.81;

// ---------- input: keys and a pad ----------
const pad = createPad({ onSwitch: a => padSwitch(a) }); window.PT_PAD = pad;
// the pad taken up (or put down): the hints named anew; the first time, a word on what is where
function padSwitch(a) { renderHelp(); const go = document.querySelector('#shop .go'), ch = document.querySelector('#shop .chat');
  if (go) go.textContent = a ? `JEDŹ DALEJ (${pad.name(BTN.B, true)})` : 'JEDŹ DALEJ (ESC)'; if (ch) ch.textContent = a ? `POGADAJ (${pad.name(BTN.Y, true)})` : 'POGADAJ';
  if (a && !padSwitch.told) { padSwitch.told = true; flash(`Pad: ${pad.name(BTN.RT)} jedź, ${pad.name(BTN.LT)} hamuj, ${pad.name(BTN.LB)} / ${pad.name(BTN.RB)} rzut, ${pad.name(BTN.A)} podskok, ${pad.name(BTN.X)} kop, ${pad.name(BTN.Y)} gadaj, ${pad.name(BTN.B)} zsiądź`); } }
// ---------- the keys: each action and the keys it is on (changed in the menu: STEROWANIE; kept in the browser) ----------
//   modes: where it works (bike: riding, walk: on foot, fight: in a fight); two actions on one key clash only if they share a mode
const ACTIONS = [
  { id: 'pedal', keys: ['KeyW'], modes: ['bike', 'walk', 'fight'] }, { id: 'brake', keys: ['KeyS'], modes: ['bike', 'walk', 'fight'] },
  { id: 'left', keys: ['KeyA'], modes: ['bike', 'walk', 'fight'] }, { id: 'right', keys: ['KeyD'], modes: ['bike', 'walk', 'fight'] },
  { id: 'sprint', keys: ['ShiftLeft', 'ShiftRight'], modes: ['bike', 'walk'] },
  { id: 'throwL', keys: ['ArrowLeft', 'KeyQ'], modes: ['bike'] }, { id: 'throwR', keys: ['ArrowRight', 'KeyE'], modes: ['bike'] },
  { id: 'kick', keys: ['Space'], modes: ['bike'] }, { id: 'hop', keys: ['KeyC'], modes: ['bike'] },
  { id: 'mount', keys: ['KeyF'], modes: ['bike', 'walk'] }, { id: 'view', keys: ['KeyV'], modes: ['bike', 'walk', 'fight'] }, { id: 'talk', keys: ['KeyE'], modes: ['walk'] }, { id: 'chat', keys: ['KeyT'], modes: ['bike'] }, { id: 'title', keys: ['KeyX'], modes: ['bike', 'walk'] }, { id: 'inv', keys: ['KeyI'], modes: ['bike', 'walk'] }, { id: 'map', keys: ['KeyM'], modes: ['bike', 'walk'] }, { id: 'snap', keys: ['KeyQ'], modes: ['bike', 'walk'] }, { id: 'bell', keys: ['KeyB'], modes: ['bike'] },
  { id: 'punchL', keys: ['ArrowLeft'], modes: ['fight'] }, { id: 'punchR', keys: ['ArrowRight'], modes: ['fight'] }, { id: 'high', keys: ['ArrowUp'], modes: ['fight'] },
  { id: 'low', keys: ['ArrowDown'], modes: ['fight'] }, { id: 'guard', keys: ['Space'], modes: ['fight'] }, { id: 'dodge', keys: ['ShiftLeft', 'ShiftRight'], modes: ['fight'] },
  { id: 'taunt', keys: ['KeyG'], modes: ['fight'] },
  { id: 'help', keys: ['KeyH'], modes: ['all'] }, { id: 'full', keys: ['KeyL'], modes: ['all'] }, { id: 'style', keys: ['KeyU'], modes: ['all'] },
  { id: 'ink', keys: ['KeyO'], modes: ['all'] }, { id: 'pixel', keys: ['KeyP'], modes: ['all'] }, { id: 'reset', keys: ['KeyR'], modes: ['all'] }];
const BIND = {}; for (const a of ACTIONS) BIND[a.id] = [...a.keys];
try { const saved = JSON.parse(localStorage.getItem('pt.binds') || 'null'); if (saved) for (const id in saved) if (BIND[id] && Array.isArray(saved[id])) BIND[id] = saved[id]; } catch { }
const saveBinds = () => { try { localStorage.setItem('pt.binds', JSON.stringify(BIND)); } catch { } };
const on = (id, code) => BIND[id].includes(code);
const keyName = c => ({ Space: 'SPACJA', ShiftLeft: 'SHIFT', ShiftRight: 'P.SHIFT', ControlLeft: 'CTRL', ControlRight: 'P.CTRL', AltLeft: 'ALT', AltRight: 'P.ALT', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Enter: 'ENTER', Tab: 'TAB', Backspace: 'BACKSPACE', CapsLock: 'CAPS', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backquote: '`' })[c]
  || c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ').toUpperCase();
// the pad: which button does what (the same for both makes: A/✕ hop and jump, X/□ kick and hit, Y/△ talk, B/○ on and off the bike,
// the triggers pedal and brake, the bumpers throw, the left stick steers and walks, the right one aims and turns the camera)
const PADB = { pedal: BTN.RT, brake: BTN.LT, left: 'LS', right: 'LS', sprint: BTN.LS, throwL: BTN.LB, throwR: BTN.RB, kick: BTN.X, hop: BTN.A, mount: BTN.B, view: BTN.RS, talk: BTN.Y, chat: BTN.Y,
  title: BTN.UP, bell: BTN.DOWN, inv: BTN.LEFT, punchL: BTN.X, punchR: BTN.Y, high: BTN.UP, low: BTN.DOWN, guard: BTN.RB, dodge: BTN.LB, taunt: BTN.LEFT };
const padKey = id => PADB[id] == null ? '—' : PADB[id] === 'LS' ? 'LEWA GAŁKA' : pad.name(PADB[id]);
const keysOf = id => pad.active ? padKey(id) : BIND[id].filter((c, i, a) => !(c === 'ShiftRight' && a.includes('ShiftLeft'))).map(keyName).join(' / ') || '—';
const clashes = (id, code) => { const A = ACTIONS.find(a => a.id === id); return ACTIONS.filter(b => b.id !== id && BIND[b.id].includes(code) && (A.modes.includes('all') || b.modes.includes('all') || b.modes.some(m => A.modes.includes(m)))).map(b => b.id); };
// what each is, where (the menu's page and the help window list them so)
const SECTIONS = [
  { title: 'NA ROWERZE', items: [['pedal', 'PEDAŁUJ'], ['brake', 'HAMUJ (NA POSTOJU: COFAJ)'], ['left', 'SKRĘĆ W LEWO'], ['right', 'SKRĘĆ W PRAWO'], ['sprint', 'SZYBCIEJ'],
    ['throwL', 'RZUT W LEWO (KLIKNIJ: SAM LECI DO CELU W RAMCE · TRZYMAJ: SIŁA I CELOWANIE)'], ['throwR', 'RZUT W PRAWO'], ['inv', 'EKWIPUNEK ROWERU: CZĘŚCI, SLOTY, ROWER OBOK'], ['map', 'MAPA TRASY: ODCINKI, WYNIKI, WARSZTAT, ZAPIS'], ['snap', 'APARAT (ZLECENIE NA ZDJĘCIE)'], ['kick', 'KOPNIAK · W LOCIE ZE SKOCZNI: TRICK (KLIKNIJ, KRĘCI SIĘ SAM; JESZCZE RAZ: KOMBO)'], ['hop', 'PODSKOK'], ['mount', 'ZSIĄDŹ Z ROWERU'], ['view', 'NASTĘPNA KAMERA'],
    [null, 'MYSZ: LPM / PPM', 'RZUT W LEWO / W PRAWO'], [null, 'MYSZ: RUCH', 'LEKKO OBRACA WIDOK']] },
  { title: 'PIESZO', items: [['pedal', 'NAPRZÓD'], ['brake', 'DO TYŁU'], ['left', 'OBRÓT W LEWO (Z MYSZĄ: KROK W BOK)'], ['right', 'OBRÓT W PRAWO'], ['sprint', 'BIEG'],
    ['talk', 'ZAGADAJ DO KOGOŚ'], ['chat', 'Z ROWERU: POGADAJ (ZWOLNIJ PRZY KIMŚ)'], ['title', 'ZMIEŃ TYTUŁ GAZETY'], ['bell', 'DZWONEK (GDY GO MASZ)'], ['mount', 'PRZY ROWERZE: WSIĄDŹ / PODNIEŚ'], ['view', 'WIDOK Z OCZU / ZZA PLECÓW'],
    [null, 'MYSZ: RUCH', 'OBRÓT I SPOJRZENIE (PRZY KRAWĘDZI DALEJ)'], [null, 'MYSZ: LPM', 'UDERZ KOGOŚ']] },
  { title: 'W BÓJCE', items: [['pedal', 'DOSKOK'], ['brake', 'ODSKOK'], ['left', 'KRĄŻ W LEWO'], ['right', 'KRĄŻ W PRAWO'], ['dodge', 'UNIK (Z KIERUNKIEM)'],
    ['punchL', 'PROSTY (BEZ MYSZY)'], ['punchR', 'SIERPOWY (BEZ MYSZY)'], ['high', 'Z CIOSEM: HAK'], ['low', 'Z CIOSEM: NA KORPUS · Z GARDĄ: NISKA'], ['guard', 'GARDA (BEZ MYSZY)'], ['taunt', 'PROWOKACJA'],
    [null, 'MYSZ: RUCH', 'STRONA CIOSU (GWIAZDA)'], [null, 'MYSZ: LPM / PPM', 'CIOS / GARDA (MYSZ W DÓŁ: NISKA)']] },
  { title: 'OGÓLNE', items: [['help', 'OKNO ZE STEROWANIEM'], ['full', 'PEŁNY EKRAN'], ['style', 'PANEL STYLU'], ['ink', 'KONTUR'], ['pixel', 'WYGLĄD PIKSELOWY'], ['reset', 'OD NOWA'],
    [null, 'ESC', 'MENU'], [null, '1–5', 'WIELKOŚĆ PIKSELA']] }];
const controls = { sections: () => SECTIONS.map(s => ({ title: s.title, items: s.items.map(([id, label, value]) => id ? { act: id, label, keys: keysOf(id), clash: BIND[id].some(c => clashes(id, c).length) } : { label, value }) })),
  set(id, code) { BIND[id] = [code]; saveBinds(); renderHelp(); }, reset() { for (const a of ACTIONS) BIND[a.id] = [...a.keys]; saveBinds(); renderHelp(); }, name: keyName };
function renderHelp() { const el = document.getElementById('keys'); if (!el) return;
  el.innerHTML = SECTIONS.map(s => `<b>${s.title}</b> ` + s.items.map(([id, label, value]) => id ? `${keysOf(id)} ${label.toLowerCase()}` : `${label.toLowerCase()} ${value.toLowerCase()}`).join(' · ')).join('<br>'); }
renderHelp(); window.PT_styleKeys = () => BIND.style;
const keys = new Set(), edge = new Set();
addEventListener('keydown', e => { if (e.target?.closest?.('textarea, input') && e.code !== 'Escape') return; if (e.repeat) return; keys.add(e.code); edge.add(e.code);
  if (on('pixel', e.code)) look.set({ pixel: !look.S.pixel });
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code); if (n >= 0) look.set({ pix: SIZES[n] });
  if (on('view', e.code)) { if (foot.active) foot.toggleView(); else setCam((camI + 1) % CAMS.length); }
  if (on('ink', e.code)) look.set({ ink: (look.S.ink + 1) % INKS.length });
  if (on('help', e.code)) toggleKeys();
  if (on('chat', e.code) && LV2.offer && liveTake()) { e.stopImmediatePropagation(); return; }
  if (on('snap', e.code) && LV && !menu.open && !asking && !shop.isOpen && !talk.isOpen && !map.isOpen && !fin.isOpen) snapJob();
  if (on('map', e.code) && !menu.open && !asking && !shop.isOpen && !talk.isOpen && !runUI.isOpen && !modes.isOpen && !mp.isOpen && !book.isOpen && !garage.isOpen && !foot.fighting) openMap();
  if (on('inv', e.code) && !menu.open && !asking && !shop.isOpen && !talk.isOpen && !runUI.isOpen && !modes.isOpen && !mp.isOpen && !book.isOpen && !foot.fighting) garage.toggle();
  if (on('full', e.code)) toggleFull();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code) || ACTIONS.some(a => BIND[a.id].includes(e.code))) e.preventDefault(); });
addEventListener('keyup', e => { keys.delete(e.code); }); addEventListener('blur', () => keys.clear());
function lockPointer() { if (document.pointerLockElement || mouse.failed || menu.open || asking || touch.on) return;   // (the cursor kept in the game's window; refused: not asked again)
  try { const pr = canvas.requestPointerLock?.(); pr?.catch?.(() => { mouse.failed = true; }); } catch { mouse.failed = true; } }
const mouse = { dx: 0, dy: 0, l: false, r: false, lh: false, rh: false, locked: false, used: false, nx: 0, ny: 0, inside: false, failed: false };   // (l, r: pressed this frame; lh, rh: held)
// the camera as he likes it: the wheel turned brings it nearer or farther; the wheel held down and the mouse moved turns it (up and
// down: higher or lower; left and right: round him, up to a side view); a double click of the wheel puts it back. Kept in the browser.
const camUser = (() => { try { const v = JSON.parse(localStorage.getItem('pt.cam') || 'null'); if (v && isFinite(v.dist) && isFinite(v.tilt)) return { yaw: 0, ...v }; } catch { } return { dist: 1, tilt: 0, yaw: 0 }; })();
const saveCam = () => { try { localStorage.setItem('pt.cam', JSON.stringify(camUser)); } catch { } };
function userCam(back, up) { const r = Math.hypot(back, up) * camUser.dist, a = THREE.MathUtils.clamp(Math.atan2(up, back) + camUser.tilt, .06, 1.45); return [r * Math.cos(a), r * Math.sin(a)]; }
addEventListener('mousemove', e => { if (mouse.mh) { camUser.tilt = THREE.MathUtils.clamp(camUser.tilt - e.movementY * .004, -.7, 1); camUser.yaw = THREE.MathUtils.clamp(camUser.yaw - e.movementX * .005, -1.7, 1.7); return; } });
addEventListener('mousemove', e => { if (mouse.mh) return; mouse.nx = e.clientX / innerWidth * 2 - 1; mouse.ny = e.clientY / innerHeight * 2 - 1; mouse.inside = true;
  if (document.pointerLockElement || (!menu.open && !asking)) { mouse.dx += e.movementX; mouse.dy += e.movementY; if (foot.active) mouse.used = true; } });
document.addEventListener('mouseleave', () => { mouse.inside = false; });
document.addEventListener('pointerlockerror', () => { if (!mouse.failed) { mouse.failed = true; flash('Mysz: ruszaj nią, a przy krawędzi ekranu obracasz się dalej'); } });
addEventListener('mousedown', e => { if (menu.open || asking || talk.isOpen || shop.isOpen || e.target.closest?.('#styl, #stylBtn, #pix, #ink, #talk, button, .mppage, #gar, #map, #fin')) return;
  lockPointer(); if (foot.active) mouse.used = true;
  if (e.button === 0) { mouse.l = true; mouse.lh = true; } if (e.button === 2) { mouse.r = true; mouse.rh = true; }
  if (e.button === 1) { e.preventDefault(); if (e.detail >= 2) { camUser.dist = 1; camUser.tilt = 0; camUser.yaw = 0; saveCam(); flash('Kamera: jak była'); } else mouse.mh = true; } });
addEventListener('mouseup', e => { if (e.button === 0) mouse.lh = false; if (e.button === 2) { mouse.r = false; mouse.rh = false; } if (e.button === 1 && mouse.mh) { mouse.mh = false; saveCam(); } });
addEventListener('contextmenu', e => { if (!menu.open) e.preventDefault(); });
addEventListener('blur', () => { mouse.lh = mouse.rh = mouse.r = false; });
document.addEventListener('pointerlockchange', () => { mouse.locked = !!document.pointerLockElement; if (!mouse.locked) mouse.r = false; });
const touch = createTouch({ onCam: () => setCam((camI + 1) % CAMS.length), onMenu: () => menu.show('pause'), onBook: () => book.toggle() });   // (the top button: the menu)
// on a phone: lighter (the picture's last pass at one pixel to a pixel, a smaller shadow map)
if (touch.on) { renderer.setPixelRatio(1); sun.shadow.mapSize.set(1024, 1024); dispatchEvent(new Event('resize')); }
// a phone held upright: a taller view, so the road is not a slit
const PK = () => Math.max(1, Math.min(1.55, .75 * innerHeight / Math.max(1, innerWidth)));
// while a talk is open the world goes on, he does not: no steering, no pedalling, the brake on till he stops (not back)
const still = i => ({ ...i, steer: 0, pedal: 0, brake: B.v > .2 ? 1 : 0, sprint: false, hop: false, kick: false, kickHold: false, holdL: false, holdR: false, atkL: false, atkR: false, mount: false, talk: false, chat: false, dodge: false, guard: false, dx: 0, dy: 0, lmb: false, rmb: false, taunt: false });
function input() {
  const held = id => BIND[id].some(c => keys.has(c)) ? 1 : 0, hit = id => BIND[id].some(c => edge.has(c));   // (through the bindings)
  let steer = held('right') - held('left'), pedal = held('pedal'), brake = held('brake');
  let sprint = held('sprint'), hop = hit('hop'), kickK = hit('kick'), kickHold = !!held('kick'), holdL = held('throwL'), holdR = held('throwR');
  const pf = {}; let pDx = 0, pDy = 0;
  if (pad.on) { const h = pad.held, x = pad.hit, A = pad.ax, light = talk.isOpen && talk.isLight;   // (a choice on the move: the cross answers it, see padUI)
    if (Math.abs(A[0]) > 0) steer = A[0]; pDx = A[2] * 7; pDy = A[3] * 7;
    if (!foot.active) { pedal = Math.max(pedal, pad.val(BTN.RT), A[1] < -.5 ? -A[1] : 0); brake = Math.max(brake, pad.val(BTN.LT), A[1] > .5 ? A[1] : 0);
      sprint = sprint || h(BTN.LS); hop = hop || x(BTN.A); kickK = kickK || x(BTN.X); kickHold = kickHold || h(BTN.X); holdL = holdL || h(BTN.LB); holdR = holdR || h(BTN.RB);
      pf.chat = x(BTN.Y); if (!light) { pf.title = x(BTN.UP); pf.bell = x(BTN.DOWN); } }
    else { if (A[1]) { pedal = Math.max(pedal, -A[1]); brake = Math.max(brake, A[1]); } sprint = sprint || h(BTN.LS);
      if (foot.fighting) { pf.atkL = x(BTN.X); pf.atkR = x(BTN.Y); pf.guard = h(BTN.RB); pf.dodge = x(BTN.LB) || x(BTN.A); pf.up = h(BTN.UP); pf.down = h(BTN.DOWN); pf.taunt = x(BTN.LEFT); }
      else { hop = hop || x(BTN.A); pf.lmb = x(BTN.X); pf.talk = x(BTN.Y); pf.title = x(BTN.UP); } }
    pf.mount = x(BTN.B); if (x(BTN.RS)) { if (foot.active) foot.toggleView(); else setCam((camI + 1) % CAMS.length); } }
  let tE = null, tDx = 0, tDy = 0;
  if (touch.on) { const t = touch.state, e = tE = touch.take(); if (t.stick) steer = t.steer; pedal = Math.max(pedal, t.pedal); brake = Math.max(brake, t.brake);
    sprint = sprint || t.sprint; holdL = holdL || t.holdL; holdR = holdR || t.holdR; kickK = kickK || e.kick; kickHold = kickHold || !!t.kickHeld; hop = hop || e.hop;
    tDx = e.lookDx * .9; tDy = e.lookDy * .9; }   // (on foot: the stick walks him, the right finger turns the camera, see onfoot)
  if (!foot.active) { holdL = holdL || mouse.lh; holdR = holdR || mouse.rh; }   // (on the bike: the left button throws left, the right one right)
  const edge0 = new Set(edge), hit0 = id => BIND[id].some(c => edge0.has(c)); edge.clear(); const m0 = { ...mouse }; mouse.dx = mouse.dy = 0; mouse.l = false; m0.dx *= sens * .5; m0.dy *= sens * .5;
  if (!m0.locked && m0.used && m0.inside && foot.active && !foot.fighting && Math.abs(m0.nx) > .72) m0.dx += Math.sign(m0.nx) * (Math.abs(m0.nx) - .72) / .28 * 11 * sens * .5;   // (at the edge: on turning)
  return { steer: THREE.MathUtils.clamp(steer, -1, 1), pedal, brake, sprint: !!sprint, hop, kick: kickK, kickHold, holdL: !!holdL, holdR: !!holdR,
    atkL: hit0('punchL') || !!tE?.punchL || !!pf.atkL, atkR: hit0('punchR') || !!tE?.punchR || !!pf.atkR, up: !!held('high') || !!pf.up, down: !!held('low') || !!pf.down, mount: hit0('mount') || !!tE?.mount || !!pf.mount, guard: !!held('guard') || !!touch.state.guard || !!pf.guard, dx: m0.dx + tDx + pDx, dy: m0.dy + tDy + pDy, lmb: m0.l || !!pf.lmb, rmb: m0.r, locked: m0.locked || m0.used, talk: hit0('talk') || !!tE?.talk || !!pf.talk, chat: hit0('chat') || !!tE?.talk || !!pf.chat, title: hit0('title') || !!tE?.title || !!pf.title, bell: hit0('bell') || !!pf.bell, skip: edge0.has('Enter'), dodge: hit0('dodge') || !!tE?.dodge || !!pf.dodge, taunt: hit0('taunt') || !!pf.taunt, touch: touch.on, stick: pad.active && foot.active };
}

// ---------- throwing: held, the power builds; let go, the paper flies ----------
const makeAim = () => { const G = new THREE.Group(), dots = [];   // (the dots: few and faint, fading out; the start of the flight, not all of it: a hint, the rest is a feel)
  for (let k = 0; k < 7; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.055, 6, 4), new THREE.MeshBasicMaterial({ color: '#efc970', transparent: true, opacity: .5 * (1 - k / 7), depthWrite: false })); d.renderOrder = 3; G.add(d); dots.push(d); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .78, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#efc970', transparent: true, opacity: .55, depthWrite: false })); ring.renderOrder = 3; G.add(ring);
  const rim = new THREE.Mesh(new THREE.RingGeometry(.78, .86, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#17181b', transparent: true, opacity: .45, depthWrite: false })); rim.renderOrder = 3; ring.add(rim);   // (a dark rim: it shows on the grass)
  const arrowM = new THREE.MeshBasicMaterial({ color: '#efc970' }), arrow = new THREE.Group(); arrow.add(new THREE.Mesh(new THREE.ConeGeometry(.24, .42, 4).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: '#17181b' })), new THREE.Mesh(new THREE.ConeGeometry(.18, .34, 4).rotateX(Math.PI), arrowM)); arrow.children[1].position.y = .03; ring.add(arrow);   // (an arrow over it: seen from low down too)
  G.traverse(o => { if (o.material) o.material.depthTest = false; });   // (an aid, not a thing: over the grass, always seen)
  G.visible = false; scene.add(G); return { G, dots, ring, at: new THREE.Vector3(), on: false }; };
let aim = makeAim();
function throwVel(p, side, c = {}) { const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side, a = (c.ay || 0) * .52, sp = (2.6 + p * 9) * (1 + (c.ax || 0) * .25);
  const dx = rx * out * Math.cos(a) + fx * Math.sin(a), dz = rz * out * Math.cos(a) + fz * Math.sin(a);
  return new THREE.Vector3(fx * B.v * .9 + dx * sp, 1.9 + p * 3.3, fz * B.v * .9 + dz * sp); }
// what a paper can be sent to on a side: a subscriber's mailbox (best), the spot before its door; ahead or just level, out on that side,
// within reach. The current title's subscribers first. → [{ p (on the ground), door }], the best first
function throwTargets(side) { const now = performance.now(), fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side, cur = curTitle(), list = [];
  const consider = (x, z, val, d) => { const dx = x - B.x, dz = z - B.z, fw = dx * fx + dz * fz, lat = (dx * rx + dz * rz) * out, l = Math.hypot(dx, dz); if (fw < -1.5 || fw > 15 || lat < .8 || l > 16) return;
    list.push({ p: new THREE.Vector3(x, track.probe(x, z, B.hint).y, z), door: d, score: l - val - (d.sub === cur ? 6 : 0) }); };
  for (const mb of track.mailboxes) { if (mb.done) continue; const w = mb.o.position; if (Math.abs(w.x - B.x) + Math.abs(w.z - B.z) > 24) continue; const hi = mb.house ?? (mb.house = nearestDoor(w)), d = track.doors[hi]; if (!d || !d.sub || d.done || now - (d.pending || -9e9) < 2500) continue;
    const l = Math.hypot(B.x - w.x, B.z - w.z) || 1; consider(w.x + (B.x - w.x) / l * .45, w.z + (B.z - w.z) / l * .45, 3, d); }   // (just before it, on his side: it drops in)
  for (const d of track.doors) { if (!d.sub || d.done || now - (d.pending || -9e9) < 2500 || Math.abs(d.p.x - B.x) + Math.abs(d.p.z - B.z) > 24) continue; consider(d.p.x - d.n.x * 1.3, d.p.z - d.n.z * 1.3, 0, d); }
  return list.sort((a, b) => a.score - b.score); }
let hot = { L: null, R: null };   // (where a tap would send it, each side: shown over the house)
function stepHot() { hot.L = hot.R = null; if (foot.active || B.crash || !B.papers) return; hot.L = throwTargets(1)[0] || null; hot.R = throwTargets(-1)[0] || null; }
function stepAim() {                                                    // (while a throw is held: where it would go)
  aim.on = !!B.charge && !foot.active && !B.crash; aim.G.visible = aim.on; if (!aim.on) return;
  const side = B.charge.side, p = B.charge.p, fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side;
  const pos = new THREE.Vector3(B.x - rx * out * -.3, B.y + 1.25, B.z - rz * out * -.3), v = throwVel(p, side, B.charge), h = 1 / 30;
  let k = 0, n = 0, land = null; for (; n < 90; n++) { v.y -= g * h; pos.addScaledVector(v, h); const gy = track.probe(pos.x, pos.z, B.hint).y; if (pos.y <= gy) { pos.y = gy; land = pos; break; } if (n % 3 === 1 && k < aim.dots.length) aim.dots[k++].position.copy(pos); }
  for (let j = 0; j < aim.dots.length; j++) aim.dots[j].visible = j < k;
  // (near enough a target: the ring takes to it, and the paper will go there)
  aim.snap = aim.snapDoor = null; if (land) { const near = throwTargets(side).filter(t => Math.hypot(t.p.x - land.x, t.p.z - land.z) < 2.6).sort((a, b) => a.p.distanceToSquared(land) - b.p.distanceToSquared(land))[0]; if (near) { aim.snap = near.p; aim.snapDoor = near.door; land = near.p.clone(); } }
  if (land) { aim.ring.visible = true; aim.ring.position.copy(land).setY(land.y + .04); aim.at.copy(land); const good = !!aim.snap || track.mailboxes.some(mb => !mb.done && mb.o.position.distanceTo(land) < 1.6) || track.doors.some(d => !d.done && Math.hypot(d.p.x - d.n.x * 1.3 - land.x, d.p.z - d.n.z * 1.3 - land.z) < 1.6);
    const col = good ? '#7fae58' : '#efc970'; aim.ring.material.color.set(col); aim.ring.children[1].children[1].material.color.set(col); const k2 = (.9 + Math.sin(performance.now() / 120) * .1) * Math.max(1, camera.position.distanceTo(land) / 8); aim.ring.scale.setScalar(k2);   // (the farther, the bigger: about the same on the screen)
    const ar = aim.ring.children[1]; ar.position.y = 1.1 + Math.sin(performance.now() / 160) * .15; ar.rotation.y += .05; } else aim.ring.visible = false; }
function throwing(dt, inp) {
  if (B.crash) { B.charge = null; return; }
  const held = inp.holdL ? 1 : inp.holdR ? -1 : 0;
  if (!B.charge && held && B.papers > 0 && !rider.throwing) B.charge = { side: held, p: 0, t: 0 };
  if (B.charge) { B.charge.p = Math.min(1, B.charge.p + dt / .85); const c = B.charge; c.t += dt;
    c.ay = THREE.MathUtils.clamp((c.ay || 0) - (inp.dy || 0) * .005, -1, 1); c.ax = THREE.MathUtils.clamp((c.ax || 0) - (inp.dx || 0) * .005 * c.side, -1, 1);
    const still = B.charge.side > 0 ? inp.holdL : inp.holdR; if (!still) { const tap = c.t < .22, T0 = tap ? (c.side > 0 ? hot.L : hot.R) : null;   // (a tap: straight to the best on that side; held: where it was aimed, taken to a target near it)
      B.throwAt = tap ? T0?.p || null : aim.snap || null; B.throwDoor = tap ? T0?.door : aim.snapDoor; B.throwP = tap && !B.throwAt ? Math.max(.45, B.charge.p) : B.charge.p; B.throwC = { ax: B.charge.ax, ay: B.charge.ay }; if (rider.throwPaper(B.charge.side)) { const t = curTitle(); B.papers--; B.mix[t] = Math.max(0, B.mix[t] - 1); B.throwT = t; audio.play('throw', { vol: .8 }); } B.charge = null; } }
}
const paperG = new THREE.CylinderGeometry(.035, .035, .26, 10), paperM = toon('#ece5d0'), bandM = toon('#b3372c');
// ---------- the titles: papers (made up), each house takes one or none; the bag holds some of each, X picks which is thrown. The run starts
// with one (no picking: just throw), a second joins further on, the third later still (TITLE_AT, metres ridden) ----------
const TITLES = { trabka: { name: 'TRĄBKA PORANNA', short: 'TRĄBKA', col: '#cf5a3e' }, wiesci: { name: 'WIEŚCI ZZA PŁOTU', short: 'WIEŚCI', col: '#3f8a4a' }, sport: { name: 'SPORT I DZIAŁKA', short: 'SPORT', col: '#3d7be0' } };
const TK = Object.keys(TITLES), bandOf = Object.fromEntries(TK.map(k => [k, toon(TITLES[k].col)]));
B.nt = 1; B.mix = { trabka: 30, wiesci: 0, sport: 0 }; B.sel = 0;
const TITLE_AT = [0, 1400, 3800], ACT = () => TK.slice(0, B.nt || 1);
const curTitle = () => { const A = ACT(); for (let k = 0; k < A.length; k++) { const t = A[(B.sel + k) % A.length]; if (B.mix[t] > 0) { B.sel = (B.sel + k) % A.length; return t; } } return A[B.sel % A.length]; };
// the bag's total moved by something else (a bundle, the shop, a loss): the change spread over the titles (the fewest first / the most first)
function syncMix() { const A = ACT(); let tot = TK.reduce((a, t) => a + B.mix[t], 0);
  while (tot < B.papers) { const t = A.reduce((a, b) => B.mix[b] < B.mix[a] ? b : a); B.mix[t]++; tot++; }
  while (tot > B.papers) { const t = TK.reduce((a, b) => B.mix[b] > B.mix[a] ? b : a); if (B.mix[t] <= 0) break; B.mix[t]--; tot--; } }
// a new title joins: the bag repacked even across what you carry now, the houses beyond sight given their papers anew (the near ones, and the ones
// done, as they were)
function unlockTitle(n) { B.nt = n; const A = ACT(), tot = TK.reduce((a, t) => a + B.mix[t], 0); TK.forEach(t => B.mix[t] = 0); A.forEach((t, i) => B.mix[t] = Math.floor(tot / A.length) + (i < tot % A.length ? 1 : 0));
  assignSubs(true); const T = TITLES[A[n - 1]]; flash(`Nowa gazeta w torbie: ${T.name.toLowerCase()}! Tabliczki w jej kolorze przy drzwiach. Zmiana gazety: ${keysOf('title')}`); audio.play('coin', { vol: .7 }); }
// the subscribers: about half the houses, each its title; a plaque by the door in its colour (and a mark over it as you come)
const plaques = [];
function assignSubs(keepNear, fixed) { const A = ACT();   // (fixed: the subscribers as they are, given by the other player; only their plaques made anew)
  for (const d of track.doors) { if (keepNear && (d.done || Math.hypot(d.p.x - B.x, d.p.z - B.z) < 70)) continue;
    if (d.plaque) { scene.remove(d.plaque); plaques.splice(plaques.indexOf(d.plaque), 1); d.plaque = null; }
    if (!fixed) d.sub = SUBR() < .55 ? A[SUBR() * A.length | 0] : null; if (!d.sub) continue;
    const n = d.n, fa = d.p.clone().addScaledVector(n, -2.6), side = new THREE.Vector3(-n.z, 0, n.x), pl = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(.34, .24, .03), toon('#f6f3ea')); pl.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(.28, .08, .035), bandOf[d.sub]); c.position.y = .04; pl.add(c);
    pl.position.copy(fa).addScaledVector(n, .06).addScaledVector(side, .95); pl.position.y += 1.55; pl.rotation.y = Math.atan2(n.x, n.z); scene.add(pl); plaques.push(pl); d.plaque = pl; } }
assignSubs();
// the streak: subscribers served one after another (no wrong ones, none passed by, no paper thrown wide of one): every 3 more, the points
// count once more (to x4); shown under the speed
const streakMult = () => Math.min(4, 1 + Math.floor((B.streak || 0) / 3));
let streakEl = document.createElement('div'); streakEl.id = 'streak'; streakEl.className = 'streak'; document.body.appendChild(streakEl);
{ const st = document.createElement('style'); st.textContent = `.streak { position: fixed; left: 16px; top: 128px; z-index: 3; pointer-events: none; font: 16px/1 PTPix, ui-monospace, Consolas, monospace; color: #17181b; padding: 3px 8px 1px;
    border-style: solid; border-width: 6px; border-image: var(--px-go) 3 fill / 6px; image-rendering: pixelated; opacity: 0; transition: opacity .2s steps(2); }
  .streak.on { opacity: 1; animation: spop .3s steps(3); } .streak.x1 { border-image-source: var(--px-sel); } .streak.lost { border-image-source: var(--px-red); color: #f6f3ea; }
  @keyframes spop { 0% { transform: scale(1.25) } 100% { transform: none } } @media (max-width: 639px) { #streak { top: 92px; } }`; document.head.appendChild(st); }
function drawStreak(lost) { const n = B.streak || 0; streakEl.className = 'streak ' + (lost ? 'on lost' : n ? 'on' + (streakMult() > 1 ? '' : ' x1') : ''); streakEl.textContent = lost ? 'SERIA PRZERWANA' : `SERIA ${n}` + (streakMult() > 1 ? ` · x${streakMult()}` : ` · x2 ZA ${3 - n % 3}`); if (lost) { const e0 = streakEl, b0 = B; setTimeout(() => { if (!(b0.streak > 0)) e0.className = 'streak'; }, 1400); } }
function breakStreak() { const had = (B.streak || 0) >= 2; B.streak = 0; if (had) { drawStreak(true); audio.play('miss', { vol: .6 }); } else if (!streakEl.classList.contains('lost')) streakEl.className = 'streak'; }
// a subscriber ridden past without a paper: the streak goes (counted once each time by)
function stepPassed() { if (foot.active) return; const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw);
  for (const d of track.doors) { if (!d.sub || d.done) continue; const dx = d.p.x - B.x, dz = d.p.z - B.z; if (Math.abs(dx) + Math.abs(dz) > 40) { d.seen = false; continue; } const fw = dx * fx + dz * fz, l = Math.hypot(dx, dz);
    if (fw > 3 && l < 26) d.seen = true; else if (d.seen && fw < -9 && B.v > 2) { d.seen = false; if (B.streak > 0) { breakStreak(); flash('Minąłeś prenumeratora bez gazety'); } } } }
// a paper come down by a house: the right title for its subscriber (paid in full), the wrong one (a little, and words), or a house that takes none
function deliver(hi, base, at, how, title, dist = 0) {
  const d = track.doors[hi], sub = d && d.sub, up = at.clone().setY(at.y + 1.3);
  if (!sub) { breakStreak(); hud.rant(up, pickOf(['NIE ZAMAWIAŁEM!', 'ZA DARMO? NO TO BIORĘ.', 'ZNOWU ULOTKI?!', 'JA NIE CZYTAM, JA OGLĄDAM!']), false); flash('Ten dom nic nie prenumeruje'); return false; }
  if (sub === title) { B.delivered = (B.delivered || 0) + 1; B.streak = (B.streak || 0) + 1; const mult = streakMult(), pts = base * mult; score(pts, at, '+' + pts + (mult > 1 ? ' x' + mult : ''), mult > 1 ? '#9fd27a' : '#efc970');
    if (B.streak % 3 === 0 && mult > 1) { hud.impact(at.clone().setY(at.y + 1.2), 'SERIA x' + mult + '!'); audio.play('trick'); }
    flash(`${how}: ${TITLES[title].short.toLowerCase()} dla prenumeratora! +${pts}${mult > 1 ? ` (seria ${B.streak}, x${mult})` : ''}`); drawStreak(); farThrow(dist, at); if (how === 'Do skrzynki') RUN.boxed = (RUN.boxed || 0) + 1; return true; }
  breakStreak(); const n = Math.max(1, base >> 1); score(n, at, '+' + n, '#cf5a3e'); hud.rant(up, pickOf([`JA CZYTAM ${TITLES[sub].short}!`, 'TO NIE MOJA GAZETA!', 'POMYLIŁEŚ GAZETY, MŁODY!']), false); flash(`Zły tytuł: tu czytają ${TITLES[sub].short.toLowerCase()}. +${n}`); return false;
}
const dotG = new THREE.CircleGeometry(.16, 12).rotateX(-Math.PI / 2), dotM = new THREE.MeshBasicMaterial({ color: '#1b1510', transparent: true, opacity: .45, depthWrite: false });
const papers = [];
function release(at, side) {                                          // (from the rider, at the moment the hand lets go)
  const title = B.throwT || curTitle(), m = new THREE.Mesh(paperG, paperM); m.castShadow = true; m.add(new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .04, 10), bandOf[title] || bandM)); scene.add(m); m.position.copy(at);
  let v = throwVel(B.throwP, side, B.throwC || {});                   // (from a lob to a hard throw, turned as it was aimed)
  const A = B.throwAt; B.throwAt = null; if (A && B.throwDoor) B.throwDoor.pending = performance.now(); if (A) {   // (a paper on its way to it: not sent another)
    const dx = A.x - at.x, dz = A.z - at.z, l = Math.hypot(dx, dz), T = THREE.MathUtils.clamp(.5 + l * .04, .6, 1.05); v = new THREE.Vector3(dx / T, (A.y + .05 - at.y) / T + .5 * g * T, dz / T); }   // (sent to a target: the arc that comes down on it)
  const dot = new THREE.Mesh(dotG, dotM); dot.renderOrder = 1; scene.add(dot);
  B.thrown = (B.thrown || 0) + 1;
  papers.push({ from: at.clone(), m, v, dot, prev: m.position.clone(), spin: new THREE.Vector3(8 + Math.random() * 4, 0, 3), hint: B.hint, t: 0, rest: false, landed: false, title, guided: !!A });
  net.send({ k: 'paper', x: +at.x.toFixed(2), y: +at.y.toFixed(2), z: +at.z.toFixed(2), v: [v.x, v.y, v.z].map(n => +n.toFixed(2)), title });   // (the other sees it fly)
}
// a broken window: a pane of cracks over it, a spray of glass
const crackT = (() => { const c = document.createElement('canvas'); c.width = 48; c.height = 44; const x = c.getContext('2d'); x.fillStyle = '#1b2a33'; x.fillRect(0, 0, 48, 44);
  x.clearRect(17, 14, 12, 11); x.clearRect(20, 12, 7, 15); x.strokeStyle = '#dcebd9'; x.lineWidth = 1;
  for (let k = 0; k < 11; k++) { const a = k / 11 * 6.28 + .3; x.beginPath(); x.moveTo(23 + Math.cos(a) * 6, 20 + Math.sin(a) * 6); x.lineTo(23 + Math.cos(a + .2) * 16, 20 + Math.sin(a + .2) * 14); x.lineTo(23 + Math.cos(a) * 30, 20 + Math.sin(a) * 26); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; })();
const crackM = new THREE.MeshBasicMaterial({ map: crackT, transparent: true, alphaTest: .5 }), shardM = new THREE.MeshBasicMaterial({ color: '#bcdcdf', side: THREE.DoubleSide });
const shards = [];
const cracks = [];
function breakWindow(w, remote) {
  if (!remote) net.send({ k: 'win', i: track.windows.indexOf(w) });
  w.broken = true; aud('glass', w.p); if (!remote) { B.windows = (B.windows || 0) + 1; logEv('window', w.p.x, w.p.z); } { const d = track.doors[w.house]; if (d && d.sub) { d.sub = null; if (d.plaque) d.plaque.visible = false; setTimeout(() => hud.rant(w.p.clone().add(new THREE.Vector3(0, 1.4, 0)), pickOf(['REZYGNUJĘ Z PRENUMERATY!', 'KONIEC Z GAZETAMI!', 'ODPISUJĘ SIĘ!']), false), 700); } } B.fame = (B.fame || 0) + .4; quests.onWindow(w); const m = new THREE.Mesh(new THREE.PlaneGeometry(w.hw * 1.9, w.hh * 1.9), crackM); m.position.copy(w.p).addScaledVector(w.n, .015); m.lookAt(m.position.clone().add(w.n)); scene.add(m); cracks.push(m);
  for (let k = 0; k < 12; k++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(.07, .06), shardM); s.position.copy(w.p).add(new THREE.Vector3((Math.random() - .5) * .8, (Math.random() - .5) * .6, (Math.random() - .5) * .8)); scene.add(s);
    shards.push({ m: s, v: w.n.clone().multiplyScalar(1 + Math.random() * 2).add(new THREE.Vector3((Math.random() - .5) * 2, Math.random() * 2, (Math.random() - .5) * 2)), t: 0 }); }
  score(2, w.p, '+2', '#cf5a3e'); hud.rant(w.p.clone().add(new THREE.Vector3(0, .9, 0)));   // (and someone inside is not pleased)
}
// a paper flying at a window, its last fraction of a second, about to go just by: drawn in a little (a near miss goes in)
function magnet(p, w, dist, dt) {
  const vn = p.v.x * w.n.x + p.v.y * w.n.y + p.v.z * w.n.z; if (vn > -1) return; const t = dist / -vn; if (t > .55) return;
  const sx = -w.n.z, sz = w.n.x, hx = p.m.position.x + p.v.x * t - w.p.x, hz = p.m.position.z + p.v.z * t - w.p.z, hy = p.m.position.y + p.v.y * t - .5 * g * t * t - w.p.y, lat = hx * sx + hz * sz;
  if (Math.abs(lat) > w.hw + .85 || Math.abs(hy) > w.hh + .75) return; const k = Math.min(1, dt * 5) * .7 / Math.max(.08, t);
  p.v.x -= sx * lat * k; p.v.z -= sz * lat * k; p.v.y -= hy * k;
}
const nearestDoor = w => { let bi = 0, bd = 1e9; track.doors.forEach((d, i) => { const l = d.p.distanceToSquared(w); if (l < bd) { bd = l; bi = i; } }); return bi; };
let coinT = 0;
// a long throw that lands where it should: from 10 m a bonus, from 14 m a bigger one (the farms stand back from the road: there it pays)
function farThrow(dist, at) { const n = dist >= 14 ? 4 : dist >= 10 ? 2 : 0; if (!n) return; RUN.far = (RUN.far || 0) + 1; RUN.farBest = Math.max(RUN.farBest || 0, dist);
  setTimeout(() => { score(n, at.clone().setY(at.y + .7), `DALEKI RZUT ${Math.round(dist)} M +${n}`, '#9fd27a'); if (n > 2) { hud.impact(at.clone().setY(at.y + 1.2), 'SNAJPER!'); audio.play('trick'); } }, 260); }
function score(n, at, label, col) { if (n > 0 && performance.now() - coinT > 120) { coinT = performance.now(); aud('coin', at); } B.points += n; hud.pop(at, label, col); }
function stepPapers(dt) {
  for (const p of papers) {
    p.t += dt; if (p.rest) continue;
    if (p.ghost) { p.v.y -= g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.spin.x * dt; const gq = track.probe(p.m.position.x, p.m.position.z, p.hint); p.hint = gq.i; p.dot.position.set(p.m.position.x, gq.y + .02, p.m.position.z); if (p.m.position.y < gq.y + .035) { p.m.position.y = gq.y + .035; p.v.multiplyScalar(.2); if (p.v.length() < .3) { p.rest = true; scene.remove(p.dot); } } continue; }   // (the other player's: only seen)
    p.prev.copy(p.m.position); p.v.y -= g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.spin.x * dt; p.m.rotation.z += p.spin.z * dt;
    if (!p.landed && !p.personHit && paperHits(p)) { p.personHit = true; p.v.multiplyScalar(.15); }   // (caught, or bounced off someone)
    const q = track.probe(p.m.position.x, p.m.position.z, p.hint); p.hint = q.i;
    // through a window: the pane's plane crossed from outside, within its frame
    for (const w of track.windows) { if (w.broken || Math.abs(w.p.x - p.m.position.x) + Math.abs(w.p.z - p.m.position.z) > 6) continue;
      const a = (p.prev.x - w.p.x) * w.n.x + (p.prev.y - w.p.y) * w.n.y + (p.prev.z - w.p.z) * w.n.z, b = (p.m.position.x - w.p.x) * w.n.x + (p.m.position.y - w.p.y) * w.n.y + (p.m.position.z - w.p.z) * w.n.z;
      if (!p.landed && !p.guided && b > .05 && b < 3.5) magnet(p, w, b, dt);   // (one sent to a door or a mailbox is not drawn to a window)
      if (a > 0 && b <= 0) { const t = a / (a - b), hx = p.prev.x + (p.m.position.x - p.prev.x) * t, hy = p.prev.y + (p.m.position.y - p.prev.y) * t, hz = p.prev.z + (p.m.position.z - p.prev.z) * t;
        if (Math.hypot(hx - w.p.x, hz - w.p.z) < w.hw + .22 && Math.abs(hy - w.p.y) < w.hh + .18) { breakWindow(w); p.v.multiplyScalar(.15); p.v.addScaledVector(w.n, 1.2); p.m.position.set(hx, hy, hz).addScaledVector(w.n, .05); } } }
    // a courier of the Kurier hit with a paper: off his bike he goes
    if (!p.landed && LV?.rivals) for (const b of traffic.bikes) { if (!b.rival || !b.on || b.fall) continue; const P = p.m.position, y0 = b.r.root.position.y; if (Math.hypot(P.x - b.x, P.z - b.z) < .9 && P.y > y0 + .4 && P.y < y0 + 2.2) { traffic.knock(b, p.v.clone(), true); p.v.multiplyScalar(.15); RUN.rivalHits = (RUN.rivalHits || 0) + 1;
        score(3, b.r.root.position.clone().setY(y0 + 2.2), 'KURIER TRAFIONY! +3', '#9fd27a'); hud.impact(b.r.root.position.clone().setY(y0 + 1.4), 'ŁUP!'); hud.rant(b.r.root.position.clone().setY(y0 + 2), draw('kurierHit', KURIER_HIT), true); logEv('rival_hit', b.x, b.z); break; } }
    // into a tractor's cab (a moving target): the farmer catches it, once each tractor a run
    if (!p.landed && track.region === 'wies') for (const b of traffic.boxes()) { const t = b.t; if (!t.tractor) continue;
      if (b.trailer) { if ((t.inTrailer || 0) >= 3) continue; const P = p.m.position, dx = P.x - b.x, dz = P.z - b.z, al = dx * b.s + dz * b.c, ac = dx * b.c - dz * b.s;
        if (Math.abs(al) < b.hz && Math.abs(ac) < b.hx && P.y > b.y0 + .7 && P.y < b.y0 + 2.2) { t.inTrailer = (t.inTrailer || 0) + 1; p.landed = true; p.rest = true; p.t = 99; scene.remove(p.m, p.dot);
          const at2 = new THREE.Vector3(b.x, b.y0 + 2.2, b.z); score(2, at2, 'DO PRZYCZEPY! +2', '#efc970'); audio.play('coin'); if (t.inTrailer === 1) logEv('tractor_paper', b.x, b.z); break; } continue; }
      if (t.gotPaper) continue; const g0 = t.car.group.position, P = p.m.position;
      if (Math.hypot(P.x - g0.x, P.z - g0.z) < 1.25 && P.y > g0.y + .9 && P.y < g0.y + 2.6) { t.gotPaper = true; p.landed = true; p.rest = true; p.t = 99; scene.remove(p.m, p.dot);
        score(4, g0.clone().setY(g0.y + 2.6), 'DO KABINY! +4', '#efc970'); hud.impact(g0.clone().setY(g0.y + 2), 'ŁAP!'); audio.play('trick'); logEv('tractor_paper', g0.x, g0.z);
        setTimeout(() => hud.rant(g0.clone().setY(g0.y + 2.8), draw('tractorThanks', TRACTOR_THANKS), true), 500); break; } }
    // against walls, fences, cars: back off, bounce weakly
    for (const C of track.near(p.hint)) { if (C.kind !== 'hard' || p.guided || p.m.position.y > C.y0 + C.h) continue;   // (one sent to a target: its arc clears what is on the way, and it drops into the box)
      if (boxHit(C, p.m.position.x, p.m.position.z, .05)) { p.m.position.x = p.prev.x; p.m.position.z = p.prev.z; p.v.x *= -.3; p.v.z *= -.3; } }
    const hgt = p.m.position.y - q.y; p.dot.position.set(p.m.position.x, q.y + .02, p.m.position.z); p.dot.scale.setScalar(Math.max(.5, 1.3 - hgt * .25));
    if (p.m.position.y < q.y + .035) { p.m.position.y = q.y + .035;
      if (!p.landed) { p.landed = true; p.landT = p.t; quests.onLand(p.m.position); aud('land', p.m.position);                                // where it came down: by a door, at a mailbox
        // on the porch by the door: 2; in a mailbox: 5; under the windows: 1; past the house: nothing (each house counts once)
        const P = p.m.position, at = P.clone().setY(q.y + .5), door = track.doors.find(d => !d.done && Math.hypot(d.p.x - d.n.x * 1.3 - P.x, d.p.z - d.n.z * 1.3 - P.z) < 1.6);
        const under = () => track.windows.find(w => { if (track.doors[w.house]?.done) return false; const dx = P.x - w.p.x, dz = P.z - w.p.z, out = dx * w.n.x + dz * w.n.z, side = Math.abs(dx * -w.n.z + dz * w.n.x); return out > -.3 && out < 2.2 && side < 1.3; });
        let w0 = null, boxed = false;
        if (door) { door.done = true; served(door); aud('porch', at); deliver(track.doors.indexOf(door), 2, at, 'Na ganek', p.title, Math.hypot(p.from.x - P.x, p.from.z - P.z)); }
        else for (const mb of track.mailboxes) { const w = mb.o.position; if (!mb.done && Math.hypot(w.x - p.m.position.x, w.z - p.m.position.z) < 1.4) { mb.done = true; boxed = true; mb.flag.rotation.x = -Math.PI / 2; aud('mailbox', w); const hi = mb.house ?? (mb.house = nearestDoor(w)); if (track.doors[hi]) track.doors[hi].done = true; served(track.doors[hi], mb); if (!deliver(hi, 5, w.clone().setY(w.y + 1.5), 'Do skrzynki', p.title, Math.hypot(p.from.x - w.x, p.from.z - w.z))) break;
            const win = track.windows.filter(o => !o.broken).sort((a, b) => a.p.distanceToSquared(w) - b.p.distanceToSquared(w))[0];   // (thanks from the nearest window of the house)
            hud.praise(win && win.p.distanceTo(w) < 16 ? win.p.clone().add(new THREE.Vector3(0, .9, 0)) : w.clone().setY(w.y + 2.6)); break; } }
        if (!door && !boxed && (w0 = under())) { track.doors[w0.house].done = true; served(track.doors[w0.house]); deliver(w0.house, 1, at, 'Pod okno', p.title, Math.hypot(p.from.x - P.x, p.from.z - P.z)); }
        else if (!door && !boxed && track.doors.some(d => d.sub && !d.done && Math.hypot(d.p.x - P.x, d.p.z - P.z) < 9)) breakStreak(); }   // (wide of one waiting for it)
      if (Math.abs(p.v.y) < 1.2) { p.v.multiplyScalar(Math.pow(.02, dt)); p.v.y = 0; p.spin.multiplyScalar(Math.pow(.05, dt)); if (p.v.length() < .15) { p.rest = true; scene.remove(p.dot); } }
      else { p.v.y *= -.3; p.v.x *= .6; p.v.z *= .6; } }
  }
  for (let i = papers.length - 1; i >= 0; i--) if (papers[i].t > 20) { scene.remove(papers[i].m, papers[i].dot); papers.splice(i, 1); }
  for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.t += dt; s.v.y -= g * dt; s.m.position.addScaledVector(s.v, dt); s.m.rotation.x += dt * 9; s.m.rotation.y += dt * 7; if (s.t > 1.2) { scene.remove(s.m); shards.splice(i, 1); } }
}

// ---------- what a circle on the ground meets: a box (in its own space: hx, hz), as a push out of it ----------
function boxHit(C, x, z, r) {
  const dx = x - C.x, dz = z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c, qx = Math.max(-C.hx, Math.min(C.hx, lx)), qz = Math.max(-C.hz, Math.min(C.hz, lz)), ex = lx - qx, ez = lz - qz, d2 = ex * ex + ez * ez;
  if (d2 > r * r) return null;
  let nx, nz, pen; if (d2 > 1e-8) { const d = Math.sqrt(d2); nx = ex / d; nz = ez / d; pen = r - d; } else { const px_ = C.hx - Math.abs(lx), pz = C.hz - Math.abs(lz); if (px_ < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px_ + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r; } }
  return { nx: nx * C.c + nz * C.s, nz: -nx * C.s + nz * C.c, pen, lx, lz };
}
function rampAt(x, z) {                                              // how high a ramp holds the bike here (and whether it meets its lip from behind)
  let h = 0, wall = null, on = null;
  for (const C of track.near(B.hint)) { if (C.kind !== 'ramp') continue; const dx = x - C.x, dz = z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; if (Math.abs(lx) > C.hx || Math.abs(lz) > C.hz) continue;
    const along = Math.sin(B.yaw) * C.s + Math.cos(B.yaw) * C.c; if (along < -.2) { wall = C; continue; } const hh = C.h * (lz + C.hz) / (2 * C.hz); if (hh > h) { h = hh; on = C; } }
  return { h, wall, on };
}

// ---------- the ride ----------
// the run: how hard it is by now (0..1 over 8 km), hurt (a run ends at nothing), its end (the summary, the lottery), its start (what the lottery kept)
const difficulty = () => LV ? (LV.pace - 1) / .35 : Math.min(1, trip.dist / 8000);
// the run's level: up one every kilometre (to 6): more cars out and a little quicker, dogs keener; said when it goes up
const level = () => Math.min(6, 1 + Math.floor(trip.dist / 1000)), carsAt = l => Math.min(6, l + 1), heat = l => .55 + (l - 1) * .13;
const LVL_SAY = ['', '', 'Więcej aut na drodze', 'Psy coraz bardziej czujne', 'Ruch jak w godzinach szczytu', 'Kierowcy się spieszą', 'Pełny poranek! Trzymaj się'];
const carsNow = () => LV ? LV.cars : carsAt(level()), heatNow = () => LV ? LV.heat : heat(level());
function stepLevel() { if (LV) return; const l = level(); if (l === B.lvl) return; if (B.lvl) { flash(`POZIOM ${l}: ${LVL_SAY[l]}`); audio.play('trick'); } B.lvl = l; }
function hurt(n, why) { if (endT > 0) return; audio.play('hurt', { vol: .6 }); B.hp = Math.max(0, (B.hp ?? 100) - n); if (B.hp <= 0) { endT = 2.4; endWhy = why || 'Zdrowie się skończyło.'; } }
let endT = 0, endWhy = '';
const runUI = createRun({ onAgain: () => { if (LV) startLevel(LV.id); else { resetGame(); fromAccount(); } } });
// the notebook (Tab): who thinks what of you, the bike, what you carry, how you are
const book = createBook({ data: () => ({ reps: quests.reps(), parts: shop.equipped(), items: B.items || [], kept: kept(), hp: B.hp ?? 100, money: B.points, fame: B.fame || 0, papers: ACT().map(k => ({ name: TITLES[k].name, n: B.mix[k], col: TITLES[k].col })), dist: trip.dist }) });
function endRun(why) { if (runUI.isOpen) return; endT = 0; runUI.open({ reason: why, dist: trip.dist, delivered: B.delivered || 0, earned: B.earned || 0, windows: B.windows || 0, stops: quests.police?.stops || 0 }, [...shop.ownedList(), ...(B.items || []).map(n => ({ label: 'FANT: ' + n, keep: { item: n } }))]); }
function fromAccount() { const all = kept(); for (const k of all) { if (k.keep.part) shop.grant(k.keep.part, k.keep.tier); else if (k.keep.item) (B.items ||= []).push(k.keep.item); } if (all.length) flash('Z konta: ' + all.map(k => k.label.toLowerCase()).join(', ')); }
setTimeout(() => fromAccount(), 0);   // (the first run too)
// (B.safe: just up or back on the bike, a knock holds him back, he does not go over again straight off)
function crash(side, push, robbed) {                                 // push: what hit him (a car's velocity), if anything; robbed: the old woman got him
  if (B.crash) return; if (B.safe > 0 && !robbed) { B.v *= .25; B.jolt = .15; return; } B.falls = (B.falls || 0) + 1; (B.fallsAt ||= []).push({ x: B.x, z: B.z }); logEv(push ? 'car' : robbed ? 'granny' : 'fall', B.x, B.z); if (RAD.fall <= 0) { RAD.fall = 10; setTimeout(() => radioSay('fall'), 900); } audio.play('crash'); hurt(push ? 30 : 15, push ? 'Auto było twardsze.' : 'Za dużo wywrotek na jeden poranek.'); B.crash = { t: 0, side: side || (B.lean >= 0 ? 1 : -1), up: false, robbed }; B.charge = null; aim.on = false; aim.G.visible = false; flash('Wywrotka!');
  // he comes off: a ragdoll, flung on the way he was going (over the bars), a little to the side he falls, and with whatever hit him
  const f = new THREE.Vector3(Math.sin(B.yaw), 0, Math.cos(B.yaw)), vel = f.clone().multiplyScalar(B.v * .55).addScaledVector(new THREE.Vector3(-f.z, 0, f.x), B.crash.side * .5);
  if (push) vel.addScaledVector(push, .45); vel.y += B.air ? B.vy : 0;
  const sp = Math.min(9, Math.hypot(vel.x, vel.z)), spin = new THREE.Vector3(f.z, 0, -f.x).multiplyScalar(Math.min(3.2, .42 * sp)).addScaledVector(f, B.crash.side * (.5 + sp * .07));   // (pitched over the bars, rolled to his side)
  rider.ragdoll({ vel, spin, lift: .5 + sp * .07, ground: (x, z) => track.probe(x, z, B.hint).y, near: bodyNear, hit: bodyHit });
  B.air = false; B.vy = 0; B.trick = null; B.airRamp = null;
}
// back on the road, in the lane on the side he left it by, facing on the way he was going
function backToRoad() {
  const q = track.probe(B.x, B.z, B.hint), S = track.S[q.i], side = q.d >= 0 ? 1 : -1, yf = Math.atan2(S.f.x, S.f.z);
  B.x = S.p.x + S.r.x * side * 1.6; B.z = S.p.z + S.r.z * side * 1.6; B.hint = q.i; B.y = track.probe(B.x, B.z, B.hint).y; B.gPrev = B.y; B.air = false; B.vy = 0; B.trick = null; B.airRamp = null;
  B.yaw = Math.cos(B.yaw - yf) >= 0 ? yf : yf + Math.PI; rider.ragdollOff(); C.yaw = B.yaw;
}
// what the thrown body can land on or be stopped by: the hard things near, and the cars
function bodyNear(p) {
  const out = []; for (const C of track.near(B.hint)) if (!C.used && !['ramp', 'hole', 'manhole', 'bundle'].includes(C.kind) && Math.abs(C.x - p.x) + Math.abs(C.z - p.z) < 6) out.push(C);
  for (const C of traffic.boxes()) if (Math.abs(C.x - p.x) + Math.abs(C.z - p.z) < 8) out.push(C); return out;
}
function bodyHit(list, p, r) {
  let hit = false;
  for (const C of list) { const top = (C.y0 || 0) + C.h; if (p.y - r > top) continue; const h = boxHit(C, p.x, p.z, r); if (!h) continue; hit = true;
    if (top - (p.y - r) < .22) p.y = top + r; else { p.x += h.nx * h.pen; p.z += h.nz * h.pen; } }   // (near its top: onto it; else: against its side)
  return hit;
}
function ride(dt, inp) {
  if (B.safe > 0) B.safe -= dt;
  if (B.lift) { const L = B.lift; L.t += dt; B.lean = L.from * (1 - THREE.MathUtils.smootherstep(L.t, 0, .8)); B.leanV = 0; B.v = 0; pose(dt, 0, 0, 0, 0); if (L.t >= .8) { B.lift = null; B.lean = 0; } return; }   // (picked up off the ground)
  const q = track.probe(B.x, B.z, B.hint); B.hint = q.i;
  const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), along = fx * q.f.x + fz * q.f.z, slope = q.slope * along;
  if (B.crash) {                                                       // off: the bike over on its side, sliding to a stop; a moment; up again
    const c = B.crash; c.t += dt; B.v *= Math.pow(.04, dt); B.x += fx * B.v * dt; B.z += fz * B.v * dt;
    const down = c.side * 1.38, want = c.t < 2.3 ? down : c.t < 3.3 ? down * (1 - THREE.MathUtils.smootherstep(c.t, 2.3, 3.3)) : 0;
    B.lean += (want - B.lean) * Math.min(1, dt * (c.t < 2.3 ? 7 : 5)); B.steer *= Math.pow(.1, dt);
    if (c.robbed) {                                                    // robbed: he lies a moment, then (blinking) he is back on the road, on his bike
      if (c.t > 2.2 && !c.moved) { c.moved = true; backToRoad(); flash(`Babka zwędziła Ci całą kasę! (−${c.robbed} zł)`); }
      rider.root.visible = !(c.t > 2.2 && ((c.t * 12) | 0) % 2);
      if (c.t > 3.3) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; rider.root.visible = true; B.safe = 2.5; B.rattled = 0; }
    } else {
      if (c.t > 2.3 && !c.up) { c.up = true; const p = rider.pelvisAt ? rider.pelvisAt.clone() : new THREE.Vector3(B.x, B.y, B.z);   // (up on his feet; the bike stays down)
        if (foot.ready && foot.start({ x: p.x, z: p.z, yaw: B.yaw, hint: B.hint, getUp: true })) { rider.ragdollOff(); rider.boy.visible = false; B.crash = null; B.v = 0; B.parked = true; B.bikeDown = { lean: B.lean }; flash('Wstań i podnieś rower: F przy rowerze'); return; }
        rider.getUp(1); }                                                // (the models not there yet: back onto the bike as before)
      if (c.t > 3.4) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; B.safe = 2.5; B.rattled = 0; }
    }
    if (c.moved) { B.lean = 0; B.leanV = 0; B.v = 0; }
    B.y += (q.y - B.y) * Math.min(1, dt * 12); pose(dt, 0, 0, slope, Math.min(1, Math.abs(B.lean) / 1.3)); return;
  }
  const off = Math.abs(q.d) > track.PAVE && !track.home?.paved(B.x, B.z);   // (the home's street: asphalt, though off the loop)
  // the push: strong from standing, falling off towards 9 m/s (a little more with Shift); the brake; the air, the tyres, the grass; the hill; a dog
  // (B.v is signed: held at a stop, the brake walks him backwards, slowly)
  const accK = 1 + MOD.acc, topK = 1 + MOD.top, push = inp.pedal * (inp.sprint ? 1.35 : 1) * (RAD.turbo > 0 ? 1.3 : 1) * Math.max(0, (inp.sprint ? 3.9 : 3.4) * accK - Math.max(0, B.v) * (inp.sprint ? .33 : .36) * accK / topK);   // (the parts: shop.js)
  const back = inp.brake > .1 && B.v < .15 && inp.pedal < .1, brk = B.v > .05 ? inp.brake * 6.5 : 0;
  let a = push - brk - .009 * B.v * Math.abs(B.v) - .035 * B.v - (off ? .9 * Math.max(.2, 1 + MOD.grass) * B.v : 0) - g * Math.sin(Math.atan(slope)) * 1.25 * (slope > 0 ? 1 - MOD.hill : 1) - B.dogSlow * (1.2 + .09 * B.v * B.v) * Math.sign(B.v);
  if (inp.pedal < .05 && !B.air && Math.abs(B.v) < 1.3) a -= Math.sign(B.v) * (1.2 - Math.abs(B.v) * .7);   // (coasting slowly: the tyres drag him to a stop)
  if (back) a = -1.6 * inp.brake - .6 * B.v;
  if (B.air) a = -.006 * B.v * Math.abs(B.v);
  const v0 = B.v; B.v = Math.max(-1.4, B.v + a * dt); if (!back && inp.pedal < .05 && !B.air && (Math.abs(B.v) < .1 || B.v < 0 || (v0 !== 0 && Math.sign(B.v) !== Math.sign(v0)))) B.v = 0;   // (crawling: he stops, a foot on the ground, on a hill too; back only if he walks it back)
  // steering (hardly any in the air)
  const sIn = Math.sign(inp.steer) * Math.pow(Math.abs(inp.steer), 1.4);   // (a stick: small pushes finer; a key is all or nothing anyway)
  const lock = .62 * (1 + MOD.steer) / (1 + Math.abs(B.v) * .24), want = sIn * lock * (B.air ? .25 : 1), outOf = Math.abs(want) < Math.abs(B.steer) || Math.sign(want) !== Math.sign(B.steer);
  const rate = (outOf ? 4.6 : 2.4 + 1.6 * (1 - Math.min(1, Math.abs(B.steer) / Math.max(.05, lock)))) * dt;   // (in: quick at first, easing as it comes to full lock; out: quicker)
  B.steer += THREE.MathUtils.clamp(want - B.steer, -rate, rate);
  B.yaw += -B.v * Math.tan(B.steer) / L * dt;
  // the road's bends: not steering (or hardly), on the road and going, he is eased along it (a lane change ends straight with the road)
  if (!B.air && B.v > 2 && Math.abs(q.d) < track.KERB + .6) { const ry = Math.atan2(q.f.x, q.f.z) + (along < 0 ? Math.PI : 0), d = Math.atan2(Math.sin(ry - B.yaw), Math.cos(ry - B.yaw)), k = Math.max(0, 1 - Math.abs(inp.steer) * 4);
    if (Math.abs(d) < .5 && k > 0) B.yaw += d * Math.min(1, dt * 1.7) * k * (1 - Math.abs(d) / .5 * .5); }
  const leanT = THREE.MathUtils.clamp(Math.atan(B.v * Math.abs(B.v) * Math.tan(B.steer) / (L * g)) * .78, -.44, .44);
  B.leanV += (42 * (leanT - B.lean) - 12 * B.leanV) * dt; B.lean += B.leanV * dt;
  const nx = B.x + Math.sin(B.yaw) * B.v * dt, nz = B.z + Math.cos(B.yaw) * B.v * dt;
  // up and down: the ground (and a ramp on it); a hop; off a ramp's lip into the air; the landing
  const rp = rampAt(nx, nz), g0 = track.probe(nx, nz, B.hint).y + rp.h, roof = carRoofAt(nx, nz), ground = roof !== null && B.y >= roof - .35 ? Math.max(g0, roof) : g0;
  if (rp.wall && B.v > 2 && !B.air) { B.x = nx; B.z = nz; crash(); return; }
  if (inp.hop && !B.air) { B.air = true; B.vy = 3.8 + (B.onRamp ? Math.max(0, B.gVel) : 0); B.airRamp = B.onRamp ? (B.onRamp.size || 'plank') : null; }   // (hopped off a ramp: higher, and a trick allowed)
  if (B.air) { B.vy -= g * dt; B.y += B.vy * dt; if (B.y <= ground) { B.airRamp = null;
    if (B.trick) { const T = B.trick; B.trick = null;
      if (T.p < .7) { B.y = ground; B.air = false; B.vy = 0; B.airRamp = null; B.done = []; flash('Za późno! Trik od razu po wybiciu'); crash(0); return; }
      if (T.p < 1) T.pulled = true; const all = [...(B.done || []), T]; B.done = [];
      const clean = all.every(o => !o.pulled), n = all.reduce((a, o) => a + o.pts, 0) + (clean ? 1 : 0) + (all.length - 1) * 2;
      const lab = all.map(o => o.name).join(' + ') + (clean ? ' CZYSTO' : ' NA STYK'); logEv('trick', B.x, B.z, { name: lab, clean }); if (clean) quests.gangRep(.3); audio.play('trick'); score(n, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), lab + ' +' + n, '#efc970'); flash(lab + '! +' + n); }
    if (B.vy < -5.2) { B.jolt = .14; B.v *= .9; } else if (B.vy < -2) B.jolt = .07; B.air = false; B.vy = 0; B.trick = null; B.airRamp = null; B.y = ground; } }
  else { if (ground < B.y - .05 && B.gVel > 1) { const R0 = B.onRamp; B.air = true; B.vy = R0 ? B.gVel * 1.2 + (R0.size === 'mega' ? 2.2 : R0.size === 'big' ? 1.9 : R0.size === 'kicker' ? .9 : 1.1) : B.gVel; B.airRamp = R0 ? (R0.size || 'plank') : null; B.y += B.vy * dt; } else if (ground < B.y - .35) { B.air = true; B.vy = 0; B.airRamp = null; } else B.y = ground; }   // (off a car's roof, a step: he drops)
  B.onRamp = !B.air && rp.h > .05 ? rp.on : null;   // (the ground fell away as he rose: he flies)
  B.gVel = B.air ? 0 : (ground - B.gPrev) / dt; B.gPrev = ground;
  // kerbs, potholes, bags and hedges, bundles; what throws him off
  const kerbNow = Math.abs(q.d) > track.ROAD + .05, kerbWas = Math.abs(B.lastD) > track.ROAD + .05; if (!B.air && kerbNow !== kerbWas && B.v > 1.5) { B.jolt = .08; B.v *= .92; } B.lastD = q.d;
  const clear = C => B.air && B.y - (C.y0 || 0) > C.h - .05;          // (over it, in the air)
  for (const C of track.near(q.i)) {
    if (C.kind === 'ramp' || C.used) continue;
    const fwd = Math.sign(B.v) || 1, h = boxHit(C, nx, nz, .34) || boxHit(C, nx + Math.sin(B.yaw) * .5 * fwd, nz + Math.cos(B.yaw) * .5 * fwd, .22); if (!h) continue;
    if (C.kind === 'manhole') { if (!B.air && Math.abs(B.v) > .8 && Math.hypot(nx - C.x, nz - C.z) < .34) { B.x = nx; B.z = nz; B.jolt = .15; crash(); return; } continue; }   // (the front wheel into it: over the bars; hopped, it is nothing)
    if (C.kind === 'hole') { if (!B.air && !C.cool) { B.jolt = .12; B.v *= .82; C.cool = true; setTimeout(() => { C.cool = false; }, 900); } continue; }
    if (C.kind === 'bundle') { pickBundle(C); continue; }
    if (clear(C)) continue;
    if (C.car && C.roof && B.y >= C.roof - .35) continue;   // (up on that car's roof)
    if (C.thing?.kind === 'cone') { if (Math.abs(B.v) > .4) { stuff.bump(C.thing, Math.sin(B.yaw) * B.v * .9 + (Math.random() - .5), Math.cos(B.yaw) * B.v * .9 + (Math.random() - .5)); B.v *= .9; B.jolt = .06; } continue; }   // (a cone: it goes over, not him)
    if (C.kind === 'soft') { B.v *= Math.pow(.08, dt); continue; }
    if (C.hyd && Math.abs(B.v) > .8 && water.spray(new THREE.Vector3(C.x, C.y0 || 0, C.z), 4.5)) hud.pop(new THREE.Vector3(C.x, (C.y0 || 0) + 1.6, C.z), 'PSSS!', '#9ccad8');   // a hydrant knocked: it gushes
    const into = -(h.nx * Math.sin(B.yaw) + h.nz * Math.cos(B.yaw)) * Math.sign(B.v || 1);   // (how squarely: 1 head on, 0 grazing)
    if (B.v * into > 3.6 && into > .55) { const side = (h.nx * -Math.cos(B.yaw) + h.nz * Math.sin(B.yaw)) > 0 ? 1 : -1; B.x = nx; B.z = nz; crash(side); return; }   // (he goes over away from what he hit)
    B.x = nx + h.nx * (h.pen + .01); B.z = nz + h.nz * (h.pen + .01);   // pushed clear...
    if (into > .02) { let tx = -h.nz, tz = h.nx; if (tx * Math.sin(B.yaw) + tz * Math.cos(B.yaw) < 0) { tx = -tx; tz = -tz; }   // ...turned along it (the way he was going), losing only what went into it
      const dyaw = Math.atan2(tx, tz) - B.yaw; B.yaw += Math.atan2(Math.sin(dyaw), Math.cos(dyaw)) * (B.v >= 0 ? .75 : 0); B.v *= 1 - into * .6; }
    return pose(dt, inp.pedal, inp.brake, slope, 0);
  }
  // the traffic
  for (const C of traffic.boxes()) { if (Math.abs(C.x - nx) + Math.abs(C.z - nz) > 8 || clear(C) || (C.t.ghostUntil > performance.now())) continue; const h = boxHit(C, nx, nz, .38); if (h && C.t.r) {            // a cyclist: both go over if it was hard (by how fast they met), else a bump and a wobble
      const bv = new THREE.Vector3(Math.sin(C.t.yaw), 0, Math.cos(C.t.yaw)).multiplyScalar(C.t.stop > 0 ? 0 : C.t.v), mv = new THREE.Vector3(Math.sin(B.yaw), 0, Math.cos(B.yaw)).multiplyScalar(B.v), hard = Math.abs(B.v) > 1.5 && mv.clone().sub(bv).length() > 3.4;   // (him standing or barely rolling: only a brush, it wobbles past)
      traffic.knock(C.t, mv, hard); if (hard) { quests.onKnockBike(C.t); C.t.ghostUntil = performance.now() + 7000; if (Math.random() < .3) foot.grudge(C.t); }
      if (!(C.t.rantAt > performance.now())) { C.t.rantAt = performance.now() + 2500; hud.rant(C.t.r.root.position, hard ? pickOf(OUCH) : pickOf(SWEARS), true, 2); if (hard) witness(C.t.x, C.t.z); }
      if (hard) { crash(0, bv.multiplyScalar(.5)); return; } B.x = nx + h.nx * (h.pen + .02); B.z = nz + h.nz * (h.pen + .02); B.v *= .55; B.jolt = .12; return pose(dt, 0, 0, slope, 0); }
    if (h) { C.t.stop = 2.5; if (Math.abs(B.v) > 2.2 || C.t.v > 2.5) { crash(0, new THREE.Vector3(Math.sin(C.t.yaw), 0, Math.cos(C.t.yaw)).multiplyScalar(C.t.v)); return; } B.x = nx + h.nx * (h.pen + .01); B.z = nz + h.nz * (h.pen + .01); B.v *= .4; return pose(dt, 0, 0, slope, 0); } }
  B.x = nx; B.z = nz;
  // (round the home's circle the yards go further out than the loop's 28 m: there the edge is a ring round the circle; on the loop
  // itself, within 28 m, nothing holds him)
  const q2 = track.probe(B.x, B.z, B.hint), H0 = track.home; if (Math.abs(q2.d) <= 28) { } else if (H0?.yard(B.x, B.z)) { const dx = B.x - H0.C0.x, dz = B.z - H0.C0.z, r = Math.hypot(dx, dz); if (r > H0.C0R) { B.x = H0.C0.x + dx / r * H0.C0R; B.z = H0.C0.z + dz / r * H0.C0R; B.v *= .95; } }
  else if (Math.abs(q2.d) > 28) { B.x -= q2.d > 0 ? -q2.f.z * (Math.abs(q2.d) - 28) : q2.f.z * (Math.abs(q2.d) - 28); B.v *= .95; }
  pose(dt, inp.pedal, inp.brake, slope, 0);
}
function pose(dt, pedal, brake, slope, fallen) {
  B.pitch += ((B.air ? -Math.atan(B.vy / Math.max(2, B.v)) * .4 : -Math.atan(slope)) - B.pitch) * Math.min(1, dt * 6);
  B.jolt = Math.max(0, B.jolt - dt);
  rider.root.position.set(B.x, B.y + (B.jolt > 0 ? Math.sin(B.jolt * 80) * .025 : 0), B.z); rider.root.rotation.set(B.pitch, B.yaw, 0, 'YXZ');
  if (B.trick) { const T = B.trick, e = T.p, bump = Math.sin(Math.PI * Math.min(1.35, T.p));
    const tp = T.kind === 'flip' ? -Math.PI * 2 * e : 0, ty = T.kind === 'spin' ? Math.PI * 2 * e * T.dir : T.kind === 'table' ? bump * .7 * T.dir : 0, tr = T.kind === 'table' ? bump * .85 * T.dir : 0;
    rider.root.rotation.set(B.pitch + tp, B.yaw + ty, tr, 'YXZ'); const mid = new THREE.Vector3(0, -.75, 0).applyEuler(rider.root.rotation); rider.root.position.add(mid).add(new THREE.Vector3(0, .75, 0)); }
  const kick = B.kick ? { side: B.kick.side, t: B.kick.t } : null;
  rider.update({ dt, speed: B.crash ? 0 : B.v, steer: B.steer, lean: B.lean, pedalling: B.crash ? 0 : pedal, braking: brake, climbing: slope, onRelease: release,
    look: B.look != null ? B.look : Math.abs(mlook.x) > .04 ? -mlook.x * .5 - B.steer * 1.2 : null, lookY: mlook.y, tired: B.spent ? 1 : B.tired * .5, nervous: Math.min(1, B.dogSlow + Math.max(0, (B.rattled || 0) - 2) * .3), kick, air: B.air, fallen, charge: B.charge });
}
// ---------- the kick's targets, and what a kick does to each ----------
// drivers stuck behind him: a hoot, and something a little rude (their bubble goes with the car)
const TAUNTS = ['TE, SZOFER!', 'ZDUPCAJ Z DROGI, KUBICA!', 'RUSZAJ SIĘ, TOUR DE FRANCE!', 'NA ROWERKU TO PO CHODNIKU!', 'SZYBCIEJ, DZIADKU!', 'MAM CAŁY DZIEŃ, SERIO...', 'PEDAŁY SIĘ ZACIĘŁY?',
  'NO JEDŹŻE, ŚLIMAKU!', 'TE, PAPIEROWY RYCERZU!', 'GAZETĘ MI DAJ I SPADAJ!', 'MOJA BABCIA SZYBCIEJ JEŹDZI!', 'ZJEDŹ, BO CIĘ ROZNIOSĘ JAK TĘ GAZETĘ!'];
const TAUNTS_FOOT = ['ZEJDŹ Z JEZDNI!', 'CHODNIK JEST OBOK, PIESZY!', 'CO, ROWER CI UKRADLI?', 'PIESZO TO PO PASACH!', 'SPACERUJ W PARKU!', 'NA ŁEB CI SPADŁO?'];   // (him on foot, in the way)
function stepTaunts() { for (const t of traffic.list) if (t.shoutNow) { t.shoutNow = false; const at = t.car.group.position, L = foot.active ? TAUNTS_FOOT : TAUNTS; hud.pop(at.clone().setY(at.y + 1.6), foot.active ? 'TRĄB!' : 'BIP BIP!', '#efc970'); aud('horn', at); setTimeout(() => hud.rant(t.car.group.position, pickOf(L), true, 1.75), 450); } }
const SWEARS = ['EJ!', 'CO TY ROBISZ?!', '@#$%!', 'GNOJEK!', 'UWAŻAJ!', 'ZWARIOWAŁEŚ?!'], DRIVERS = ['@#$%&!', 'MOJE AUTO!', 'ZWARIOWAŁEŚ?!', 'GNOJU!'];
const pickOf = a => a[Math.random() * a.length | 0];
const OUCH = ['AŁA!', 'KURDE, RZECZYWIŚCIE...', 'MOJE KOLANO!', 'AŁAAA!'], WOW = ['ALEEE URWAŁ!', 'OJ, TO BOLAŁO!', 'HAHAHA!', 'WIDZIAŁEŚ TO?!', 'DO KARETKI!'];
function witness(x, z) {                                              // (someone near who saw it says so, a moment after)
  let best = null, bd = 25; for (const p of peds.list) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = () => hud.rant(p.G.position, pickOf(WOW), true, 1.95); } }
  for (const r of residents.list) { const d = Math.hypot(r.G.position.x - x, r.G.position.z - z); if (d < bd) { bd = d; best = () => { r.head?.getWorldPosition(r.mouth); r.mouth.y += .35; hud.rant(r.mouth, pickOf(WOW), true); r.talkT = 2.4; }; } }
  if (best) setTimeout(best, 700); }
// a paper thrown at someone: they say something back (one who sits takes it in their hands: +1)
const PAPER_PED = ['O, GAZETKA!', 'AŁA!', 'NIE ZAMAWIAŁEM!', 'EJ, UWAŻAJ!', 'DZIĘKUJĘ!'], PAPER_SIT = { belly: ['HEHE, CELNIE!', 'DAWAJ PIWO, NIE GAZETĘ!', 'O, DZIĘKI MŁODY!'], granma: ['DZIĘKUJĘ, KOCHANIE!', 'JAKI MIŁY CHŁOPIEC!'], grandpa: ['DOBRY RZUT!', 'ZA MOICH CZASÓW...'] };
function paperHits(p) {
  const P = p.m.position;
  for (const q of peds.list) if (!q.paperHit && Math.hypot(q.x - P.x, q.z - P.z) < .55 && P.y - q.G.position.y < 1.9) { q.paperHit = true; setTimeout(() => { q.paperHit = false; }, 4000); q.stun = 1; hud.rant(q.G.position, pickOf(PAPER_PED), true, 1.95); return true; }
  for (const r of residents.list) if (r.lines === 'lump' && !(r.awakeT > 0) && Math.hypot(r.G.position.x - P.x, r.G.position.z - P.z) < 1.3) {   // the man asleep at the stop: up he gets, the ones waiting clap
    r.awakeT = 45; r.talkT = 2.6; r.head?.getWorldPosition(r.mouth); r.mouth.y += .35; hud.rant(r.mouth, pickOf(['CO?! KTO?! A, GAZETA...', 'AAA! NIE ŚPIĘ!', 'KTO RZUCA?! A, DZIĘKI...', 'PRZYSTANEK?! JUŻ WSTAJĘ!']), true); score(5, r.mouth.clone(), 'POBUDKA! +5', '#efc970');
    residents.list.filter(o => o.stop === r.stop && o !== r).forEach((o, k) => setTimeout(() => { o.talkT = 2; o.head?.getWorldPosition(o.mouth); o.mouth.y += .35; hud.rant(o.mouth, pickOf(['BRAWO, MŁODY!', 'NARESZCIE!', 'HAHA, CELNIE!', 'BRAWO! TRZECI DZIEŃ TU ŚPI!']), true); }, 700 + k * 500)); return true; }
  for (const r of residents.list) if (!r.gotPaper && Math.hypot(r.G.position.x - P.x, r.G.position.z - P.z) < .9) { r.gotPaper = true; r.talkT = 2.4; r.head?.getWorldPosition(r.mouth); r.mouth.y += .35; hud.rant(r.mouth, pickOf(PAPER_SIT[r.key] || PAPER_PED), true); score(1, r.mouth.clone(), 'DO RĄK! +1', '#efc970'); return true; }
  return false;
}
function kickTargets() {
  const out = [], add = (kind, x, z, ref, r) => { const d = Math.hypot(x - B.x, z - B.z); if (d < r) out.push({ kind, x, z, ref, d }); };
  for (const n of barkers) add('dog', n.dog.x, n.dog.z, n.dog, 3.3);
  for (const p of peds.list) add('ped', p.x, p.z, p, 2.6);
  for (const b of traffic.boxes()) add(b.t.car ? 'car' : 'bike', b.x, b.z, b.t, b.t.car ? 3.1 : 2.6);
  for (const gm of quests.gangTargets) add('gangm', gm.x, gm.z, gm, 2.9);
  for (const pc of quests.policeCars()) add('police', pc.g.position.x, pc.g.position.z, pc, 3.2);
  if (granny.state === 'out') add('granny', granny.group.position.x, granny.group.position.z, granny, 2.6);
  if (geese) for (const q of geese.list) if (!q.fly) add('goose', q.g.position.x, q.g.position.z, q, 2.4);
  for (const C of track.near(B.hint)) if (C.hyd) add('hyd', C.x, C.z, C, 1.9);
  for (const T of stuff.near(B.x, B.z, 2.2)) if (!T.broken && !T.down) add('thing', T.x, T.z, T, 2.2 + T.r);
  if (net.on && P2.rider.root.visible && !P2.B.crash) add('rider', P2.B.x, P2.B.z, P2, 2.7);   // (over the network: the other player)
  return out.sort((a, b) => a.d - b.d);
}
function landKick(tg) {
  const at = { rider: () => [tg.ref.B.x, tg.ref.B.z], dog: () => [tg.ref.x, tg.ref.z], ped: () => [tg.ref.x, tg.ref.z], car: () => [tg.ref.x, tg.ref.z], bike: () => [tg.ref.x, tg.ref.z], granny: () => [tg.ref.group.position.x, tg.ref.group.position.z], hyd: () => [tg.ref.x, tg.ref.z], goose: () => [tg.ref.g.position.x, tg.ref.g.position.z], police: () => [tg.ref.g.position.x, tg.ref.g.position.z], gangm: () => [tg.ref.x, tg.ref.z], thing: () => [tg.ref.x, tg.ref.z] }[tg.kind]();
  const ax = at[0] - B.x, az = at[1] - B.z, al = Math.hypot(ax, az) || 1; if (al > (tg.kind === 'car' ? 3.4 : 3.3)) return;   // (it got away)
  const mid = new THREE.Vector3(B.x + ax * .55, B.y + .7, B.z + az * .55);
  logEv('kick_' + (tg.kind === 'thing' ? (tg.ref.kind === 'mailbox' ? 'mailbox' : 'thing') : tg.kind), B.x, B.z);
  if (tg.kind === 'dog') { dogs.kick(tg.ref, { x: ax / al * 4.5 + Math.sin(B.yaw) * B.v * .5, z: az / al * 4.5 + Math.cos(B.yaw) * B.v * .5 }); hud.impact(mid); slowmo = .09; shake = .3; }   // it flies off
  if (tg.kind === 'ped' && quests.onHitPed(tg.ref)) { hud.impact(mid, 'ŁUP!'); slowmo = .08; shake = .25; }   // (the thief: the bag drops)
  else if (tg.kind === 'ped') { hud.impact(mid); tg.ref.stun = 1.6; hud.rant(tg.ref.G.position, pickOf(SWEARS), true, 1.95); slowmo = .06; shake = .22; }   // they stop, and swear after him
  if (tg.kind === 'bike' && tg.ref.rival) { logEv('rival_hit', tg.ref.x, tg.ref.z); flash('Kurier w rowie! Uważaj, może wstać i oddać'); }
  if (tg.kind === 'bike') { hud.impact(mid); quests.onKnockBike(tg.ref); traffic.knock(tg.ref, new THREE.Vector3(ax / al * 3.2, 0, az / al * 3.2), true); if (Math.random() < .8) foot.grudge(tg.ref); tg.ref.ghostUntil = performance.now() + 5000; hud.rant(tg.ref.r.root.position, pickOf(SWEARS), true, 2.0); slowmo = .06; shake = .22; }
  if (tg.kind === 'car') { hud.impact(mid, 'BUM!'); tg.ref.stop = Math.max(tg.ref.stop, .7); hud.rant(tg.ref.car.group.position, pickOf(DRIVERS), true, 1.7); shake = .28; }   // the driver: the bubble goes with the car
  if (tg.kind === 'gangm') { hud.impact(mid); quests.onKickGang(tg.ref); slowmo = .06; shake = .22; }   // (one of the gang: off his bike)
  if (tg.kind === 'police') { hud.impact(mid, 'BUM!'); shake = .28; quests.onKickPolice(tg.ref); }   // (a police car: see quests)
  if (tg.kind === 'rider') { const how = mp.kick(meId(), otherId()); hud.impact(mid, how === 'tag' ? 'BEREK!' : 'ŁUP!'); shake = .25; audio.play('kick', { vol: .7 }); net.send({ k: 'kick', how, dx: ax / al, dz: az / al }); }   // (the other player: off his bike in the race, a shove otherwise)
  if (tg.kind === 'goose') { geese.kick(tg.ref, ax / al, az / al); gooseKicked(tg.ref, mid); }
  if (tg.kind === 'granny') { tg.ref.kicked(); hud.rant(tg.ref.mouth, 'JA CI DAM GNOJKU!', true); shake = .12; }   // (the old woman: a kick does nothing, bar make her crosser)
  if (tg.kind === 'thing') { stuff.hit(tg.ref, ax, az, tg.ref.kind === 'mailbox' ? 2 : 1); shake = Math.max(shake, tg.ref.kind === 'mailbox' ? .08 : .03); }   // (from the bike: as on foot)
  if (tg.kind === 'hyd' && water.spray(new THREE.Vector3(tg.ref.x, tg.ref.y0 || 0, tg.ref.z), 4.5)) { hud.impact(new THREE.Vector3(tg.ref.x, (tg.ref.y0 || 0) + .5, tg.ref.z), 'PSSS!'); shake = .15; }
}
// puddles: a wheel (or a foot) through one throws it up; at speed by the pavement, whoever stands there gets it, and says so; mud holds a bike back
let inPud = null;
function stepPuddles(me) { if (!me.foot && B.air) { inPud = null; return; } let P0 = null; for (const P of track.puddles || []) if (Math.abs(P.x - me.x) < 3 && Math.abs(P.z - me.z) < 3 && Math.hypot(P.x - me.x, P.z - me.z) < P.r) { P0 = P; break; }
  if (P0 && P0 !== inPud && me.v > (me.foot ? 1.2 : 1.6)) { stuff.splash(me.x, me.z, P0.mud, me.v); if (!me.foot) { B.v *= P0.mud ? .72 : .94; B.jolt = .05; if (P0.road && !RUN.mudSaid) { RUN.mudSaid = true; flash('Błoto! Hamuje. Przeskocz je (podskok) albo objedź'); } if (P0.road) RUN.mud = (RUN.mud || 0) + 1; }
    if (!me.foot && me.v > 3) for (const p of peds.list) if (Math.hypot(p.x - me.x, p.z - me.z) < 3.4) { hud.rant(mouthOf(p), pickOf(['OBLAŁEŚ MNIE!', 'MOJE SPODNIE!', 'GNOJEK JEDEN!', 'UWAŻAJ, JAK JEDZIESZ!']), false); p.faceT = 1.5; break; } }
  inPud = P0; }
// ---------- the dogs: which is at his heel; the kick ----------
let barkers = [];
const nearDog = () => barkers.find(n => n.dist < 2.9);
// ---------- level crossings (crossing.js): where a level has them (LEVELS[].cross: shares of the way), the lamps, the barriers, the train ----------
const CROSS = []; let dingT = 0, trainHitT = 0;
function clearCrossings() { for (const X of CROSS) scene.remove(X.group); CROSS.length = 0; }
function buildCrossings() { clearCrossings(); if (!LV?.cross) return; const N = track.N, iJ = track.startI, dir = LV.finish.dir;
  for (const fr of LV.cross) { const X = createCrossing({ THREE, toon, track, at: iJ + dir * Math.round(N * LV.finish.to * fr) }); scene.add(X.group); CROSS.push(X); } }
function stepCrossings(dt) { if (!CROSS.length) return; const M0 = foot.active ? foot.me : B, me = { x: M0.x, z: M0.z, v: foot.active ? 0 : B.v, yaw: M0.yaw, onFoot: foot.active }, tb = traffic.boxes(); trainHitT -= dt;
  let ring = false; for (const X of CROSS) { const o = X.update(dt, me, tb); if (X.ringing && Math.hypot(X.center.x - me.x, X.center.z - me.z) < 60) ring = true;
    if (o?.hit === 'warn' && !RUN.crossSaid) { RUN.crossSaid = true; flash('Przejazd kolejowy! Miga, szlabany idą w dół: zdążysz albo czekaj'); }
    if (o?.hit === 'barrier' && !B.crash && !foot.active) { logEv('barrier', me.x, me.z); crash(0, o.push); flash('Szlaban! Trzeba było poczekać'); hud.impact(new THREE.Vector3(me.x, (B.y || 0) + 1.3, me.z), 'ŁUP!'); }
    if (o?.hit === 'train' && trainHitT <= 0) { trainHitT = 3; logEv('train', me.x, me.z); hurt(30, 'Pociąg był szybszy.'); shake = .5; audio.play('crash'); flash('POCIĄG! O włos...');
      if (!foot.active && !B.crash) crash(0, o.push); else if (foot.active) { foot.me.x += o.push.x * .25; foot.me.z += o.push.z * .25; } } }
  dingT -= dt; if (ring && dingT <= 0) { dingT = .42; audio.play('ui', { vol: .22 }); } }
// the Kurier's couriers at a subscriber's mailbox before him: their paper in it, the house lost to him this run (they shout about it)
const KUR_M = toon('#e3b22e'), KURIER = ['KURIER OSIEDLOWY! NAJSZYBSZY!', 'ZA WOLNO, TRĄBKA!', 'TA SKRZYNKA JEST NASZA!', 'PRENUMERATA PRZESZŁA DO NAS!', 'SPÓŹNIŁEŚ SIĘ, KOLEGO!', 'KURIER ZAWSZE PIERWSZY!'], KURIER_HIT = ['AŁA! TO NIE FAIR!', 'MOJA GAZETA!', 'POCZEKAJ TYLKO!', 'SZEF SIĘ DOWIE!'];
function stepRivals(dt) { if (!LV?.rivals) return; const L0 = track.len; for (const b of traffic.bikes) { if (!b.rival || !b.on || b.fall) continue;
    // (each heads for the next subscriber's mailbox within 16 m ahead: swerves to its side of the road, takes it at 2.6 m)
    if (b.tgt && (b.tgt.done || ((((b.tgt.s0 - b.s) * b.dir) % L0) + L0) % L0 > L0 / 2)) b.tgt = null;
    if (!b.tgt) for (const mb of track.mailboxes) { if (mb.done) continue; if (mb.s0 === undefined) { const q0 = track.probe(mb.o.position.x, mb.o.position.z, -1); mb.s0 = q0.s; mb.d0 = q0.d; } const a2 = ((((mb.s0 - b.s) * b.dir) % L0) + L0) % L0; if (a2 > 3 && a2 < 16) { const d = track.doors[mb.house ?? (mb.house = nearestDoor(mb.o.position))]; if (d?.sub && !d.done) { b.tgt = mb; break; } } }
    const want = b.tgt ? Math.sign(b.tgt.d0) * Math.min(3.3, Math.abs(b.tgt.d0) - 1.2) : b.dir * 1.7; b.lane += (want - b.lane) * Math.min(1, dt * 2.2);
    for (const mb of track.mailboxes) { if (mb.done) continue; const w = mb.o.position; if (Math.abs(w.x - b.x) + Math.abs(w.z - b.z) > 6 || Math.hypot(w.x - b.x, w.z - b.z) > 2.8) continue; const hi = mb.house ?? (mb.house = nearestDoor(w)), d = track.doors[hi]; if (!d?.sub || d.done) continue;
      mb.done = true; mb.rival = true; d.done = true; RUN.stolen = (RUN.stolen || 0) + 1; mb.flag.rotation.x = -Math.PI / 2; const rp = new THREE.Mesh(paperG, KUR_M); rp.position.copy(w).add(new THREE.Vector3(0, 1.15, 0)); rp.rotation.z = Math.PI / 2; scene.add(rp); (FIN.junk ||= []).push(rp);
      hud.rant(b.r.root.position.clone().setY(b.r.root.position.y + 1.9), draw('kurier', KURIER), true); if (RUN.stolen === 1) flash('Kurier podebrał skrzynkę! Gazeta prenumeratora przepadła'); logEv('rival_steal', w.x, w.z); break; } } }
// the world's things that go on whether he rides or walks: the crossings, the Kurier's couriers, the geese
function stepGeese(dt, inp) {
  if (geese) { const M0 = foot.active ? foot.me : B;
    if (!foot.active && inp?.chat && Math.abs(B.v) < 3.2) gooseTalk(B);
    const g = geese.update(dt, { x: M0.x, z: M0.z, v: foot.active ? 0 : B.v, yaw: M0.yaw, onFoot: foot.active }); if (g?.hit === 'peck') { hurt(4, 'Zadziobany przez gęsi.'); shake = Math.max(shake, .12); audio.play('kick', { vol: .3 }); gooseSay(g.at.clone().setY(g.at.y + 1), draw('gPeck', GOOSE.peck)); }
    else if (g?.hit === 'calm') { if (Math.random() < .5) gooseSay(g.at.clone().setY(g.at.y + 1), draw('gCalm', GOOSE.calm)); }
    else if (g?.hit === 'fall') { logEv('goose', B.x, B.z); crash(null); flash('Gęś!'); hud.rant(g.at.clone().setY(g.at.y + 1), 'GĘĘĘ!', true); } else if (g?.hit === 'hiss') { B.v *= .45; gooseSay(g.at.clone().setY(g.at.y + 1), 'SSSSS!'); } }
}
function stepDogs(dt, inp) {
  barkers = dogs.update(dt, { x: B.x, z: B.z, v: B.v, yaw: B.yaw, heat: modes.flags.calm ? 0 : heatNow() }); stepLevel(); stepRun(dt);
  for (const n of barkers) { const d = n.dog; d.sndT = (d.sndT || 0) - dt; if (d.sndT <= 0) { d.sndT = 1 + Math.random() * 1.4; aud('bark', d); } }   // (a dog at him: a bark now and then)
  // a dog into a car or a tree (running at him, or kicked through the air): it goes over, and home
  const cars = traffic.boxes();
  for (const d of dogs.dogs) { if (!(d.state === 'chase' && d.v > 2.5) && !(d.fly && !d.fly.tumble)) continue;
    for (const C of [...cars, ...track.near(d.hint)]) { if (C.kind !== 'car' && !(C.kind === 'hard' && ((C.hx < .4 && C.hz < .4) || C.h === 1.5))) continue; if (Math.abs(C.x - d.x) + Math.abs(C.z - d.z) > 7) continue;   // (trees, posts, hydrants, parked cars; not houses or fences)
      const h = boxHit(C, d.x, d.z, .32); if (!h) continue;
      const moving = C.kind === 'car' && C.t.v > 1.5, cv = moving ? { x: Math.sin(C.t.yaw) * C.t.v, z: Math.cos(C.t.yaw) * C.t.v } : { x: 0, z: 0 };
      d.x += h.nx * h.pen; d.z += h.nz * h.pen; dogs.tumble(d, { x: h.nx * 2.6 + cv.x * .7, z: h.nz * 2.6 + cv.z * .7 }); if (moving) C.t.stop = 1.5;
      hud.pop(new THREE.Vector3(d.x, B.y + .8, d.z), 'AUU!', '#f6f3ea'); if (Math.hypot(d.x - B.x, d.z - B.z) < 12) hud.impact(new THREE.Vector3(d.x, B.y + .5, d.z), 'BUM!'); break; } }
  let slow = 0, look = null, best = 9; for (const n of barkers) { slow += Math.max(0, 1 - n.dist / 2.6); if (n.dist < best) { best = n.dist; look = n.side * 1.25; } }
  B.dogSlow += (Math.min(1, slow) - B.dogSlow) * Math.min(1, dt * 4); B.look = look;
  B.rattled = B.crash ? 0 : slow > .25 ? (B.rattled || 0) + dt : Math.max(0, (B.rattled || 0) - dt * .7);
  if (B.rattled > 6.5 && !B.crash) { B.rattled = 0; for (const n of barkers) dogs.kick(n.dog); crash(); flash('Pies Cię dopadł!'); }
  stepKick(dt, inp);
}
function stepKick(dt, inp) {
  // the kick: at whatever is nearest by him (a dog, someone walking, a cyclist, a car, the old woman, a hydrant), with the leg on its side
  // off a ramp, in the air: Space (a phone: the kick button) does a trick. A or D held: a 360 that way; W held on the big ramp: a backflip; else a tabletop.
  //   One press: it goes round by itself, at a pace fitted to the time left in the air, and is pulled in faster if it must be, to be round
  //   for the landing (no timing to hit). Round in its own time: CZYSTO +1; pulled in at the end: NA STYK. Round and still flying: press
  //   again, another one (a combo, +2 for each one more). Begun far too late (not even most of the way round as he lands): down.
  const airLeft = () => { const h = Math.max(0, B.y - track.probe(B.x, B.z, B.hint).y); return (B.vy + Math.sqrt(B.vy * B.vy + 2 * g * h)) / g; };   // (seconds till he is down)
  if (B.trick) { const T = B.trick; T.t += dt;
    if (T.p < 1) { const base = 1 / T.dur, need = (1 - T.p) / Math.max(.03, airLeft() - .05), rate = Math.min(base * 2.8, Math.max(base, need));
      if (need > base * 1.1) T.pulled = true; T.p = Math.min(1, T.p + rate * dt); } }
  if (inp.kick && B.air && B.airRamp && !B.crash && (!B.trick || B.trick.p >= 1)) { const big = B.airRamp === 'big' || B.airRamp === 'mega', st = inp.steer, left = airLeft();
    if (left > .2) { if (B.trick) { B.done = [...(B.done || []), B.trick]; } else B.done = [];
      const fit = (lo, hi) => THREE.MathUtils.clamp(left * .8, lo, hi) * (1 - MOD.trick), mk = o => ({ ...o, t: 0, p: 0, pulled: false });   // (its pace: most of what is left of the flight)
      B.trick = Math.abs(st) > .3 ? mk({ kind: 'spin', dir: -Math.sign(st), dur: fit(.34, big ? .9 : .7), pts: 3, name: '360' })
        : big && inp.pedal > .3 ? mk({ kind: 'flip', dir: 1, dur: fit(.5, 1.1), pts: 6, name: 'SALTO' })
        : mk({ kind: 'table', dir: Math.random() < .5 ? -1 : 1, dur: fit(.3, .7), pts: 2, name: 'STÓŁ' });
      hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)), B.trick.name + (B.done.length ? ' +' : '!'), '#efc970'); }
    inp = { ...inp, kick: false }; }
  { const tr = !!(B.air && B.airRamp && !B.crash && (!B.trick || B.trick.p >= 1)); touch.trick(tr || quests.kickHint, tr ? 'TRIK!' : 'KOPNIJ!'); }   // (a phone: the kick button says TRIK while one can be done)
  if (inp.kick && !B.crash && !B.kick && !B.air) { const tg = kickTargets()[0]; let side = 1;
    if (tg) { const rx = -Math.cos(B.yaw), rz = Math.sin(B.yaw); side = ((tg.x - B.x) * rx + (tg.z - B.z) * rz) > 0 ? -1 : 1; }   // (+1: his left)
    B.kick = { t: 0, side, target: tg || null }; }
  if (B.kick) { B.kick.t += dt / .38;
    if (B.kick.t > .45 && !B.kick.done) { B.kick.done = true; const tg = B.kick.target; if (tg) landKick(tg); }
    if (B.kick.t >= 1) B.kick = null; }
}

// ---------- the camera: five ways to see him (through his eyes ... high over the street; V goes round them), gone to smoothly ----------
const CAMS = [
  { name: 'oczami rowerzysty', fpv: true, fov: 84 },
  { name: 'blisko', back: 2.8, up: 1.6, ahead: 3.2, lookUp: 1.2, fov: 56 },
  { name: 'średnio', back: 3.8, up: 2.2, ahead: 4, lookUp: 1.1, fov: 58 },
  { name: 'daleko', back: 5.4, up: 3.1, ahead: 3.7, lookUp: 1.2, fov: 60 },
  { name: 'wysoko', back: 7.5, up: 7.2, ahead: 6, lookUp: 0, fov: 56 },
  { name: 'bardzo daleko', back: 7.6, up: 3.9, ahead: 5.6, lookUp: 1.25, fov: 58 },
  { name: 'z góry (jak GTA 2)', top: true, fov: 50 },
];
let camI = 3; const CP = { ...CAMS[3] };
function setCam(i) { camI = i; flash(`Kamera ${i + 1}: ${CAMS[i].name}`); }
// (the opening shot from in front of him: only leaving home, in the suburb, till the first stretch is done; anywhere else from behind)
const openShot = () => track.region === 'peryferia' && !(LVM.load().done || {}).p1 ? Math.PI : 0;
let C = { yaw: B.yaw, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false, gy: 0, iy: openShot(), iyGo: false };   // (iy: the opening shot, from in front of him, the house behind him; it swings round behind him as he sets off)
const _eye = new THREE.Vector3();
// a paper thrown: the camera eases into a wider view of it (back, up, a little aside from the throw's side), looking between him and
// the paper, so he stays in the picture; it holds where the paper came down a moment (the +1, the glass), then eases back
let throwCam = { w: 0, at: new THREE.Vector3(), side: 0 };
function watchPaper(dt) {
  const p = papers.filter(p => (!p.landed && p.t < 1.6) || (p.landed && p.t - p.landT < 1.1)).pop();
  if (p) { throwCam.at.lerp(p.m.position, throwCam.w < .05 ? 1 : 1 - Math.exp(-dt * 10)); const rx = -Math.cos(B.yaw), rz = Math.sin(B.yaw); throwCam.side = Math.sign((p.m.position.x - B.x) * rx + (p.m.position.z - B.z) * rz) || 1; }
  throwCam.w += ((p && !B.crash ? 1 : 0) - throwCam.w) * Math.min(1, dt * (p ? 2.4 : 1.6));
  return throwCam.w;
}
const _mid = new THREE.Vector3();
function follow(dt) {
  const tw = THREE.MathUtils.smootherstep(watchPaper(dt), 0, 1);
  const k = 1 - Math.exp(-dt * 3.2), dy = Math.atan2(Math.sin(B.yaw - C.yaw), Math.cos(B.yaw - C.yaw)); C.yaw += dy * k;
  const gq = track.probe(B.x, B.z, B.hint); C.gy += ((B.air ? gq.y : B.y) - C.gy) * Math.min(1, dt * (B.air ? 1.5 : 8));   // (the ground under him, not his wheels: so a hop is seen as one)
  const T = CAMS[camI], ke = 1 - Math.exp(-dt * 4); if (T.top) { } else if (!T.fpv) for (const k of ['back', 'up', 'ahead', 'lookUp', 'fov']) CP[k] = (CP[k] ?? T[k]) + (T[k] - (CP[k] ?? T[k])) * ke; else CP.fov += (T.fov - CP.fov) * ke;
  rider.head.visible = !T.fpv;
  if (T.fpv) {                                                         // through his eyes: from his head, looking where he rides, rolling with him
    rider.eye(_eye); const f = new THREE.Vector3(Math.sin(B.yaw), 0, Math.cos(B.yaw));
    camera.position.copy(_eye); const lk = _eye.clone().addScaledVector(f, 5).addScaledVector(new THREE.Vector3(-f.z, 0, f.x), mlook.x * 2.4); lk.y -= 2.9 + B.pitch * 3 + mlook.y * 1.4;   // (looking a little down: the bar and his hands at the bottom of the view)
    if (tw > 0) lk.lerp(throwCam.at, .3 * tw);
    camera.up.set(0, 1, 0); camera.lookAt(lk); camera.rotateZ(-B.lean * .9); camera.fov = CP.fov + Math.max(0, B.v) * .6; camera.updateProjectionMatrix();
    C.init = false; sun.position.copy(rider.root.position).addScaledVector(SUN, 60); sun.target.position.copy(rider.root.position); sun.target.updateMatrixWorld(); return;
  }
  // from above, straight down (as the old top-down games): turned with him so ahead is up the screen, higher the faster he goes
  //   (and when a paper is in the air), looking at a point a little ahead of him
  if (T.top) { const fx = Math.sin(C.yaw + camUser.yaw), fz = Math.cos(C.yaw + camUser.yaw), h = (15 + Math.max(0, B.v) * .7 + tw * 4 + (aim.on ? 3 : 0)) * camUser.dist;
    const want = new THREE.Vector3(B.x + fx * 3.5, C.gy + h, B.z + fz * 3.5);
    if (!C.init) { C.gy = B.y; C.pos.copy(want); C.init = true; }
    C.pos.lerp(want, 1 - Math.exp(-dt * 6)); camera.position.copy(C.pos); camera.up.set(fx, 0, fz); camera.lookAt(C.pos.x, C.gy, C.pos.z);
    if (shake > 0) { shake = Math.max(0, shake - dt * 1.8); const a = shake * shake * 1.6; camera.position.x += (Math.random() - .5) * a; camera.position.z += (Math.random() - .5) * a; }
    CP.fov += (T.fov - CP.fov) * ke; camera.fov = CP.fov * PK(); camera.updateProjectionMatrix();
    if (CUR === P1) { sun.position.copy(rider.root.position).addScaledVector(SUN, 60); sun.target.position.copy(rider.root.position); sun.target.updateMatrixWorld(); } return; }
  const ch = aim.on && B.charge ? THREE.MathUtils.smoothstep(B.charge.p, 0, 1) : 0, back = CP.back + Math.max(0, B.v) * .13 + tw * 2.3 + rush * 1.3 + ch * 2.8, aside = -throwCam.side * tw * .5;   // (a throw: a wider, higher view, hardly turned)   // (a throw: further back and up, a little away from its side)
  if (C.iy) { if (B.v > .4 || Math.abs(B.steer) > .05 || B.crash || foot.active) C.iyGo = true; if (C.iyGo) { C.iy *= Math.exp(-dt * 1.9); if (C.iy < .01) C.iy = 0; } }
  const ik = C.iy / Math.PI, [bk0, upU0] = userCam(back, CP.up), bk = bk0 * (1 - ik * .2), upU = upU0 * (1 - ik * .45), cy = C.yaw + camUser.yaw + C.iy, want = new THREE.Vector3(B.x - Math.sin(cy) * bk - Math.cos(cy) * aside, C.gy + upU + tw * 1.4 + ch * 1.8, B.z - Math.cos(cy) * bk + Math.sin(cy) * aside);   // (cy: turned round him as he set it)   // (far and high enough to see the houses, and a window go)
  const look = new THREE.Vector3(B.x + Math.sin(B.yaw) * CP.ahead - Math.cos(B.yaw) * mlook.x * 2.6, C.gy + CP.lookUp - mlook.y * 1.2, B.z + Math.cos(B.yaw) * CP.ahead + Math.sin(B.yaw) * mlook.x * 2.6);   // (the mouse turns it a little)
  if (ik > 0) look.lerp(_mid.set(B.x, C.gy + 1.3, B.z), THREE.MathUtils.smoothstep(ik, 0, .6));   // (the opening shot: at him)
  if (tw > 0) look.lerp(_mid.set(B.x, C.gy + 1, B.z).lerp(throwCam.at, .5), .2 * tw);
  if (ch > 0) look.lerp(_mid.set(B.x, C.gy + 1, B.z).lerp(aim.at, .5), .35 * ch);   // (holding a throw: wider, higher, turned a little to where it will come down)   // (between him and the paper)
  if (!C.init) { C.gy = B.y; C.pos.copy(camI === 0 ? want : camera.position.lengthSq() ? camera.position : want); C.look.copy(look); C.init = true; }
  C.pos.lerp(want, 1 - Math.exp(-dt * 6)); C.look.lerp(look, 1 - Math.exp(-dt * 8));
  const q = track.probe(C.pos.x, C.pos.z, B.hint); C.pos.y = Math.max(C.pos.y, q.y + .6);
  camera.position.copy(C.pos); camera.up.set(0, 1, 0); camera.lookAt(C.look); camera.rotateZ(-B.lean * .2 * (B.crash ? .3 : 1) - mlook.x * .04);
  if (shake > 0) { shake = Math.max(0, shake - dt * 1.8); const a = shake * shake * 1.6; camera.position.x += (Math.random() - .5) * a; camera.position.y += (Math.random() - .5) * a; }
  { const sp = Math.min(1, Math.max(0, B.v) / 9), rum = (Math.abs(gq.d) > track.PAVE && !track.home?.paved(B.x, B.z) ? .035 : Math.abs(gq.d) > track.KERB ? .014 : .006) * sp * (B.air || B.crash ? 0 : 1), t = performance.now() / 1000;
    camera.position.y += (Math.sin(t * 47) * .6 + Math.sin(t * 71) * .4) * rum; camera.position.x += Math.sin(t * 39) * rum * .5; }   // (the ground under the wheels: asphalt, the kerb, the grass)
  camera.fov = (CP.fov + Math.max(0, B.v) * .75 + rush * 7 + THREE.MathUtils.smootherstep(throwCam.w, 0, 1) * 8) * PK(); camera.updateProjectionMatrix();
  if (CUR === P1) { sun.position.copy(rider.root.position).addScaledVector(SUN, 60); sun.target.position.copy(rider.root.position); sun.target.updateMatrixWorld(); }
}

// ---------- on the screen ----------
const hudEl = document.getElementById('hud'), note = document.getElementById('note');
let noteT = 0; function flash(s) { note.textContent = s; note.classList.add('on'); noteT = 1.6; }
// the bike computer: the speed, and the trip, the top speed and the time ridden (counted only while he rides)
// the bag in the corner (hudbag.js): plain toon, none of the world's rim or fading
const hudBag = createHudBag({ THREE, toon: (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, ...o }), makeBag });
const cyclo = createCyclo(hudEl), trip = { dist: 0, max: 0, time: 0 };
function paintHud() { cyclo.update({ v: B.v, ...trip, on: !foot.active }); }
const _v = new THREE.Vector3();
// a talk: the camera eases round over his shoulder to whoever he talks to (both in the picture, on the side nearer the road), and back after
const TC = { w: 0, at: null, q: new THREE.Quaternion(), m: new THREE.Matrix4(), pos: new THREE.Vector3(), look: new THREE.Vector3() };
function talkCam(dt) {
  const f = quests.focus; TC.w += ((f ? 1 : 0) - TC.w) * Math.min(1, dt * 2.6); if (f) TC.at = f.clone(); if (TC.w < .003 || !TC.at) return;
  const me = foot.active ? foot.me : null, P = me ? new THREE.Vector3(me.x, me.y, me.z) : new THREE.Vector3(B.x, B.y, B.z), at = TC.at;
  const dx = at.x - P.x, dz = at.z - P.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
  // (the camera higher the farther they are, or the lower they sit: over a fence; someone far off: it goes in towards them)
  const lift = 1.7 + Math.min(1.6, l * .16 + Math.max(0, P.y + 1.4 - at.y) * .8), bk = 2.3 - Math.min(4, Math.max(0, l - 4) * .55), spot = sd => new THREE.Vector3(P.x - ux * bk - uz * 1.35 * sd, P.y + lift, P.z - uz * bk + ux * 1.35 * sd), d1 = Math.abs(track.probe(spot(1).x, spot(1).z, B.hint).d), d2 = Math.abs(track.probe(spot(-1).x, spot(-1).z, B.hint).d);
  TC.pos.copy(spot(d1 <= d2 ? 1 : -1)); TC.pos.y = Math.max(TC.pos.y, track.probe(TC.pos.x, TC.pos.z, B.hint).y + .8);
  const lf = l > 5 ? .85 : .68; TC.look.set(P.x + dx * lf, P.y + 1.1 + (at.y - P.y - 1.1) * .75, P.z + dz * lf); TC.m.lookAt(TC.pos, TC.look, new THREE.Vector3(0, 1, 0)); TC.q.setFromRotationMatrix(TC.m);
  const e = THREE.MathUtils.smootherstep(TC.w, 0, 1); camera.position.lerp(TC.pos, e); camera.quaternion.slerp(TC.q, e); camera.updateMatrixWorld();
}
// over the subscribers ahead (near, not served yet): a little paper in their title's colour
function subMarks() { const out = [], P = foot.active ? foot.me : B, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
  for (const d of track.doors) { if (!d.sub || d.done) continue; const dx = d.p.x - P.x, dz = d.p.z - P.z, l = Math.hypot(dx, dz); if (l > 38 || l < 2 || (dx * fx + dz * fz) / l < -.2) continue; const h = hot.L?.door === d ? 1 : hot.R?.door === d ? -1 : 0;   // (in reach of a tap: which button sends it there)
    const H = h > 0 ? hot.L : h < 0 ? hot.R : null;   // (in reach: over where it would go, the mailbox or the door step)
    out.push({ p: H ? H.p.clone().setY(H.p.y + 1.9) : new THREE.Vector3(d.p.x, d.p.y + 3, d.p.z), s: 'sub', col: TITLES[d.sub].col, hot: h, label: h ? (h > 0 ? (pad.active ? 'LB' : 'LPM') : (pad.active ? 'RB' : 'PPM')) : null }); } return out; }
function project(w) { _v.copy(w).project(camera); if (_v.z > 1) return null; const [W, H] = px.size; return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H }; }
// the same, for a mark at the picture's edge: behind the camera too (turned round: which side it is on)
function projectEdge(w) { _v.copy(w).project(camera); const [W, H] = px.size, b = _v.z > 1; if (b) { _v.x = -_v.x; _v.y = -_v.y; } return { x: (_v.x + 1) / 2 * W, y: (1 - _v.y) / 2 * H, behind: b }; }

// the pixel size: how many pixels high the picture is drawn (fewer: bigger pixels); a row of buttons, keys 1-5
const SIZES = [180, 240, 320, 400, 540]; let pxH = 240;
function setPix(h) { pxH = h; resize(); }
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); const dpr = renderer.getPixelRatio(); px.resize(w * dpr, h * dpr, pxH); hud.resize(...px.size); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
// the outline: none, the soft violet, ink black, thick ink (O cycles; the buttons by the pixel sizes)
const INKS = [{ n: 'brak', outline: 0, oInk: 0, oThr: .12, oWide: 0 }, { n: 'fiolet', outline: .85, oInk: 0, oThr: .12, oWide: 0 },
  { n: 'czarny', outline: 1, oInk: 1, oThr: .07, oWide: 0 }, { n: 'gruby', outline: 1, oInk: 1, oThr: .07, oWide: 1 }];
let inkI = 1;
function setInk(i) { inkI = i; const o = INKS[i]; for (const k of ['outline', 'oInk', 'oThr', 'oWide']) px.uniforms[k].value = o[k]; }
// the look, all of it: the panel (U) with its styles; kept in this browser
const look = createSettings({ apply(S) { const u = px.uniforms; px.setSmooth(S.smooth); setPix(S.pix); setInk(S.ink); setToon(S.toon);
  u.palOn.value = S.palette ? 1 : 0; u.hue.value = S.hue; u.dither.value = S.dither; u.skyDither.value = S.sky; u.exposure.value = S.exposure; u.on.value = S.pixel ? 1 : 0; RIM.k.value = S.rim ?? .5;
  if (S.ink > 0) { u.outline.value = S.oStr ?? u.outline.value; u.oThr.value = S.oThr ?? u.oThr.value; }
  { const L = lookUniforms(S); u.mode.value = L.mode; u.fx.value = L.fx; u.p1.value = L.p[0]; u.p2.value = L.p[1]; u.p3.value = L.p[2]; u.p4.value = L.p[3]; u.inkA.value.set(...L.ink[0]); u.inkB.value.set(...L.ink[1]); u.inkC.value.set(...L.ink[2]); }
  u.wobA.value = S.wob ?? LOOK0.wob; u.haze.value = S.haze ?? LOOK0.haze; FXK.blur = S.blur ?? LOOK0.blur; px.snap.on = !!S.snap; u.crease.value = S.crease ?? .7; STEP.fps = +S.stepAnim || 0;
  u.palMix.value = S.palMix ?? 1; u.levels.value = S.levels ?? 0; u.sat.value = S.sat ?? 1; u.contrast.value = S.contrast ?? 1; u.vig.value = S.vig ?? 0; u.crt.value = S.crt ?? 0; } });

let rush = 0, slowmo = 0, shake = 0;                                                        // (Shift at speed: the picture's colours part at its edges, the view widens a touch)
// stamina: Shift at speed spends it (about 5.5 s of it); let off, it comes back. Near the end he labours (sweat, puffs of breath over
// him); spent, he is out of breath: no sprint, a weaker push, his head down, until he has his breath back
function stamina(dt, inp) {
  const want = inp.sprint && inp.pedal > .1 && B.v > 1.5 && !B.crash;
  if (B.spent && B.stam > .45) B.spent = false;
  const use = want && !B.spent;
  if (use) { B.stam = Math.max(0, B.stam - dt / (5.5 * (1 + MOD.stam) * (RAD.turbo > 0 ? 2.5 : 1))); B.rest = 0; if (B.stam === 0) { B.spent = true; flash('Zadyszka!'); } }
  else { B.rest = (B.rest || 0) + dt; if (B.rest > .7) B.stam = Math.min(1, B.stam + dt / (B.spent ? 5 : 3.5)); }
  inp.sprint = use; if (B.spent) inp.pedal *= .8;
  const tired = B.spent ? 1 : use ? Math.max(0, Math.min(1, 1 - B.stam / .35)) : Math.max(0, B.tired - dt * .8);
  B.tired += (tired - B.tired) * Math.min(1, dt * 5);
}
const world = { rider: B, pullOff: () => dismount('Ściągnął cię z roweru!') };
let mlook = { x: 0, y: 0 };                                          // (on the bike: where the mouse turned the view)
function step(dt, inp) {
  if (!foot.active && !B.charge) { mlook.x = THREE.MathUtils.clamp(mlook.x + (inp.dx || 0) * .006, -1, 1); mlook.y = THREE.MathUtils.clamp(mlook.y + (inp.dy || 0) * .005, -1, 1); }
  mlook.x *= Math.exp(-dt * 1.6); mlook.y *= Math.exp(-dt * 1.6);
  if (slowmo > 0) { slowmo -= dt; dt *= .12; }                        // (a hit: a beat of stillness)
  modes.update(dt); if (modes.counting) inp = still(inp);   // (a mode's count of three: feet down)
  mp.update(dt); if (mp.counting) inp = still(inp); stepNet(dt, inp);
  if (foot.fighting) { dt *= foot.tempo; if (inp.skip) foot.skipTraining(); }   // (his punch's green moment slowed; Enter: no training)
  stepBikeCards(dt);
  if (foot.active && B.crash) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; rider.ragdollOff?.(); }   // (on foot: a fall from the bike is over)
  if (inp.mount && !B.crash && !B.air) { if (!foot.active) { if (Math.abs(B.v) < 2.2) dismount(); else flash('Zwolnij, żeby zsiąść'); }
    else if (foot.fighting) flash('Najpierw bójka!'); else if (!takeBike()) { const d = Math.round(Math.hypot(foot.me.x - B.x, foot.me.z - B.z)); flash(`Twój rower jest ${d} m stąd: idź za strzałką na dole`); } }
  if (inp.bell && !foot.active) { if (MOD.bell > 0) { audio.play('bell'); B.bellT = 2.5; } else flash('Dzwonek kupisz u Janusza'); }
  syncMix(); if (inp.title) { const A = ACT(); if (A.length < 2) flash('Na razie wozisz jedną gazetę: ' + TITLES[A[0]].name.toLowerCase());
    else { for (let k = 1; k <= A.length; k++) { const t = A[(B.sel + k) % A.length]; if (B.mix[t] > 0 || k === A.length) { B.sel = (B.sel + k) % A.length; break; } } flash('Rzucasz: ' + TITLES[TK[B.sel]].name.toLowerCase()); } }
  if (B.nt < TK.length && trip.dist >= TITLE_AT[B.nt] && menu.page !== 'title' && !MP.on) unlockTitle(B.nt + 1);   // (two players: one title each, the same)
  if (endT > 0 && (endT -= dt) <= 0) endRun(endWhy); B.hp = Math.min(100, (B.hp ?? 100) + dt / 12); if (B.points > (B.lastPts ?? 0)) B.earned = (B.earned || 0) + B.points - B.lastPts; B.lastPts = B.points;
  if (foot.active && inp.talk && hoops?.ask(foot.me)) inp = { ...inp, talk: false };   // (on the court, the brother asked for the ball first)
  quests.update(dt, inp);                                               // (who is near to talk to; the errands; the thief)
  if (hoops) { const was = hoops.holding; hoops.update(dt, { me: foot.active && !foot.fighting ? foot.me : null, cam: camera, hold: foot.active && (mouse.lh || (pad.on && pad.held(BTN.X)) || !!inp.hoopHold), drop: !!inp.rmb, view: foot.view,
      toFirst: () => { if (foot.view !== 'first') foot.toggleView(); }, toThird: () => { if (foot.view === 'first') foot.toggleView(); }, talkKey: keysOf('talk') });
    if (was || hoops.holding) inp = { ...inp, lmb: false, rmb: false }; }
  stepCrossings(dt); stepRivals(dt); stepGeese(dt, inp);
  if (foot.active) { stepSteps(dt); return stepFoot(dt, inp); }
  stamina(dt, inp); stepRadio(dt, inp); if (!B.crash) { trip.dist += Math.abs(B.v) * dt; trip.max = Math.max(trip.max, Math.abs(B.v)); if (Math.abs(B.v) > .5) trip.time += dt; }
  throwing(dt, inp); stepAim(); stepDogs(dt, inp); ride(dt, inp); water.update(dt); stepFires(dt); stepTaunts(); residents.update(dt, { x: B.x, z: B.z, v: B.v, line: quests.lineFor, said: (r, t) => logEv('said', r.G.position.x, r.G.position.z, { who: r.lines || r.key, text: t }) });
  { const q = track.probe(B.x, B.z, B.hint), p = peds.update(dt, { x: B.x, z: B.z, v: B.v, d: q.d, busy: !!B.crash, bell: MOD.bell > 0 && (B.bellT = (B.bellT || 0) - dt) > -4 });   // someone walking: ridden into, over he goes
    if (p) { crash(0, new THREE.Vector3(B.x - p.x, 0, B.z - p.z).setLength(1.5)); hud.rant(p.G.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'UWAŻAJ!'); } }
  { const q = track.probe(B.x, B.z, B.hint), ev = granny.update(dt, { x: B.x, z: B.z, far: Math.abs(q.d) > 16 && !track.home?.yard(B.x, B.z) && !modes.flags.calm, road: Math.abs(q.d) < track.KERB + .4, busy: !!B.crash, hint: B.hint });
    if (ev === 'shout') hud.rant(granny.mouth, 'NIE PO SIONYM!', true);
    if (ev === 'caught') { const n = B.points; B.points = 0; hud.rant(granny.mouth, 'MAM CIE!', true);
      crash(0, new THREE.Vector3(B.x - granny.group.position.x, 0, B.z - granny.group.position.z).setLength(2.5), n || '0'); } }
  rush += ((inp.sprint && inp.pedal > .1 && B.v > 3 && !B.crash ? 1 : 0) - rush) * Math.min(1, dt * (inp.sprint ? 3 : 5)); px.uniforms.aber.value = Math.max(rush, Math.max(0, B.v - 6.5) * .12) * FXK.blur;
  const q = track.probe(B.x, B.z, B.hint), f = track.S[q.i].f;
  traffic.update(dt, { clear: FIN.on ? FIN.clear : null, pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsNow(), bus: modes.flags.bus, s: q.s, d: q.d, v: B.v, along: Math.sign(Math.sin(B.yaw) * f.x + Math.cos(B.yaw) * f.z) || 1 });
  stepHot(); stepPassed(); stepPapers(dt); stepBundles(dt, B.x, B.z); foot.update(dt, {}, world); follow(dt);
}
// ---------- on foot: speaking to people (E), hitting them (a punch when not fighting), cars that knock him down ----------
// the geese: what they say back (decks: none twice running), and what you say to them
const TRACTOR_THANKS = ['DZIĘKI MŁODY! PRZECZYTAM NA MIEDZY!', 'O, GAZETKA! BĘDZIE DO ŚNIADANIA!', 'TRAFIŁEŚ JAK DO KOSZA!', 'NO PATRZ, PROSTO W KABINĘ!', 'ZAPISZ MNIE NA PRENUMERATĘ!', 'A KRZYŻÓWKA JEST?'];
const GOOSE = { kick: ['GĘĘĘĘ!!!', 'GĘ! GĘ! GĘĘĘ!', 'SSSSSS!!!', 'GĘĘ?! GĘĘĘĘ!'], peck: ['DZIOB!', 'AŁA! GĘŚ!', 'SSSS! DZIOB!', 'GĘĘ! DZIOB DZIOB!', 'W ŁYDKĘ!'],
  calm: ['gę.', 'gęę...', 'sss...', '(gęś udaje, że nic się nie stało)'], ask: ['DZIEŃ DOBRY PANI GĘSI!', 'GAZETKĘ?', 'GĘ?', 'CO TAM, GĘSI?', 'PRZEPUŚCICIE?', 'TYLKO SPOKOJNIE...', 'KTO TU RZĄDZI?'],
  stare: ['(gęś patrzy na Ciebie z politowaniem)', '(gęś mierzy Cię wzrokiem)', '(gęś odwraca się tyłem)', '(gęś skubie trawę, jakby Cię nie było)'], honk: ['GĘ.', 'GĘĘĘ!', 'GĘ GĘ.', 'GĘĘ? GĘ.'],
  angry: ['SSSSSS!!!', 'GĘĘĘĘ!!! (szarża)', 'SSS! GĘĘ!'], friend: ['gę? (gęś idzie za Tobą)', 'gę gę (masz nową przyjaciółkę)', '(gęś drepcze za Tobą)'] };
// one goose's word at a time (a flock hissing all at once: one bubble, not seven); force: a kick's honk always
let gooseSaid = 0; function gooseSay(at, text, force) { const t = performance.now(); if (!force && t - gooseSaid < 1100) return; gooseSaid = t; hud.rant(at, text, true); }
function gooseKicked(q, mid) { hud.impact(mid, 'GĘĘ!'); shake = Math.max(shake, .14); slowmo = .06; audio.play('kick', { vol: .5 }); gooseSay(q.g.position.clone().setY(q.g.position.y + 1.2), draw('gKick', GOOSE.kick), true);
  if (!RUN.gooseMad || RUN.t - RUN.gooseMad > 20) { RUN.gooseMad = RUN.t || 1; logEv('goose_chase', q.g.position.x, q.g.position.z); flash('Gęsi się wściekły! Uciekaj albo zwiewaj rowerem'); } }
function gooseTalk(me) { const r = geese.talk(me); if (!r) return false; const mouth = me.mouth || new THREE.Vector3(me.x, (me.y || 0) + 1.8, me.z), gp = r.q.g.position.clone().setY(r.q.g.position.y + 1);
  hud.rant(mouth, draw('gAsk', GOOSE.ask), true); setTimeout(() => gooseSay(gp, draw('g_' + r.how, GOOSE[r.how]), true), 700);
  if (r.how === 'friend') { logEv('goose_friend', me.x, me.z); } if (r.how === 'angry') { logEv('goose_chase', me.x, me.z); } return true; }
const TALK = ['DZIEŃ DOBRY! GAZETKA?', 'ŁADNA POGODA, CO?', 'MASZ MOŻE DYCHĘ?', 'WIDZIAŁ PAN MÓJ ROWER?', 'PAN TU CZĘSTO SPACERUJE?', 'KUPI PAN GAZETĘ? ŚWIEŻA!', 'CO TAK SMUTNO?', 'PAN WIE, KTÓRA GODZINA?'];
const REPLY = { oldman: ['ZA MOICH CZASÓW GAZETY BYŁY GRUBSZE!', 'SŁUCHAM? GŁOŚNIEJ!', 'IDŹ DO ROBOTY!'], jogger: ['NIE MAM CZASU, MAM TĘTNO!', 'BIEGAM, NIE GADAM!', 'SIEMA!'],
  mum: ['CIII, DZIECKO ŚPI!', 'NIE TERAZ!', 'DZIĘKUJĘ, NIE TRZEBA'], dogman: ['NIE GRYZIE. CHYBA.', 'BURKU, ZOSTAW PANA!', 'NO I CO?'], teen: ['CO SIĘ PATRZYSZ?', 'ELO!', 'SPADAJ, BOOMERZE'],
  suit: ['NIE MAM DROBNYCH', 'JESTEM NA CALLU!', 'PROSZĘ MAILOWO'], shopper: ['WSZYSTKO TAK DROŻEJE!', 'A SKLEP JUŻ OTWARTY?', 'OJ, SYNKU...'], kid: ['MAMO, TEN PAN DO MNIE GADA!', 'MASZ CUKIERKA?', 'HEHE'],
  gardener: ['NIE DEPTAĆ TRAWNIKA!', 'LIŚCIE SAME SIĘ NIE ZGRABIĄ!', 'DZIEŃ DOBRY'], lady: ['NIE ZACZEPIAJ MNIE!', 'JAKI KULTURALNY...', 'SPIESZĘ SIĘ'] };
const ANNOYED = ['DAJ MI SPOKÓJ!', 'CZEGO CHCESZ?!', 'IDŹ STĄD!', 'ZARAZ DZWONIĘ NA POLICJĘ!'];
const HIT_PED = { kid: ['MAMOOO!'], oldman: ['MOJA LASKA!', 'ZA MOICH CZASÓW...AŁA!'], shopper: ['RATUNKU! BANDYTA!'], lady: ['CHAM!', 'POLICJA!'], mum: ['ZWARIOWAŁEŚ?!'] };
const HIT_ANY = ['AŁA! POLICJA!', 'CO TY ROBISZ?!', 'ZWARIOWAŁ!', 'RATUNKU!'], TOUGH = ['teen', 'suit', 'gardener', 'dogman', 'jogger'];
const SZWAGIER = ['ZARAZ ZAWOŁAM SZWAGRA!', 'MIETEK! CHODŹ NO TU!', 'SZWAGIER! TEN MNIE BIJE!'], SZWAGIER_COMES = ['KTO TU BIJE MOJEGO SZWAGRA?!', 'TO TY PODSKAKUJESZ?!', 'SZWAGIER MÓWI, ŻE CIĘ ZNA!'];
const DRIVER_HIT = ['PATRZ, JAK ŁAZISZ!', 'ŚLEPY JESTEŚ?!', 'MÓJ LAKIER!', 'NA PASACH SIĘ CHODZI!', 'ŻYJESZ TAM?'];
let pendingHit = null;
function pedNear(me, reach) { const fx_ = Math.sin(me.yaw), fz_ = Math.cos(me.yaw); let best = null, bd = reach;
  for (const p of peds.list) { const dx = p.x - me.x, dz = p.z - me.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx_ + dz * fz_) / (d || 1) > .45) { best = p; bd = d; } } return best; }
const mouthOf = p => p.G.position.clone().add(new THREE.Vector3(0, 1.9, 0));
function stepPeople(dt, inp, me) {
  if (foot.fighting || foot.down) return;
  // a phone: a punch or a word turns him to whoever is nearest (no mouse to face them with)
  if (inp.touch && (inp.talk || inp.atkL || inp.atkR)) { let t = null, bd = 2.6; for (const p of peds.list) { const d = Math.hypot(p.x - me.x, p.z - me.z); if (d < bd) { bd = d; t = p; } }
    const b = !inp.talk && bikeNear(me, 2.4), bp = b && b.r.root.position; if (bp && Math.hypot(bp.x - me.x, bp.z - me.z) < bd) t = bp; if (t) me.yaw = Math.atan2(t.x - me.x, t.z - me.z); }
  if (inp.talk) { const p = pedNear(me, 2.4); if (p) { p.talks = (p.talkT > 0 ? (p.talks || 0) : 0) + 1; p.talkT = 20; p.stun = Math.max(p.stun || 0, 2.2); p.faceT = 2.4; hud.rant(me.mouth, pickOf(TALK), true);
      const key = p.P.key; setTimeout(() => { hud.rant(mouthOf(p), p.talks >= 3 ? pickOf(ANNOYED) : pickOf(REPLY[key] || ANNOYED)); if (p.talks >= 3 && !TOUGH.includes(key)) { p.flee = 3; p.fleeNew = true; } }, 800); }
    else if (!(geese && gooseTalk(me))) hud.rant(me.mouth, pickOf(['HALO?', 'NIKOGO...', 'HEJ!']), true); }
  for (const p of peds.list) p.talkT = Math.max(0, (p.talkT || 0) - dt);
  const k = inp.atkL || (inp.lmb && Math.random() < .5) ? 'jab' : inp.atkR || inp.lmb ? 'cross' : null;
  const mv = (k && foot.swing(k)) || foot.fired();                         // (a punch, or a kick in a run of them; a kept press thrown now)
  if (mv) { const K = foot.KICKS[mv]; pendingHit = { t: K ? K.hit : mv === 'jab' ? .15 : .22, p: pedNear(me, K ? 1.9 : 1.35), b: bikeNear(me, K ? 2.6 : 2.2), kick: !!K, reach: K ? 2.1 : 1.5 }; }
  if (pendingHit && !pendingHit.p && !pendingHit.b && !pendingHit.pc) pendingHit.pc = quests.policeNear(me.x, me.z, pendingHit.kick ? 3.3 : 2.9);
  if (pendingHit && !pendingHit.p && pendingHit.b) { pendingBike = { t: pendingHit.t, b: pendingHit.b }; pendingHit = null; }
  if (pendingHit && (pendingHit.t -= dt) <= 0) { const p = pendingHit.p, PH = pendingHit; pendingHit = null; const word = PH.kick ? pickOf(['BACH!', 'ŁUBUDU!', 'KOP!']) : 'ŁUP!';
    if (p && Math.hypot(p.x - me.x, p.z - me.z) < PH.reach && quests.onHitPed(p)) { hud.impact(p.G.position.clone().add(new THREE.Vector3(0, 1.55, 0)), word); shake = Math.max(shake, .15); }   // (the thief)
    else if (p && Math.hypot(p.x - me.x, p.z - me.z) < PH.reach) { const key = p.P.key, at = p.G.position.clone().add(new THREE.Vector3(0, 1.55, 0)); hud.impact(at, word); shake = Math.max(shake, .15); p.stun = .7; p.faceT = 1.2;
      B.points = Math.max(0, B.points - 2); B.fame = (B.fame || 0) + 1; hud.pop(at.clone().add(new THREE.Vector3(0, .4, 0)), 'BRZYDKO! -2', '#cf5a3e');
      if (TOUGH.includes(key) && Math.random() < .6 && !foot.chasing) { hud.rant(mouthOf(p), pickOf(SZWAGIER)); p.flee = 3; p.fleeNew = true;   // (he goes for his brother-in-law: out of a house one comes)
        const q = track.probe(me.x, me.z, me.hint), S = track.S[(q.i + (Math.random() < .5 ? 14 : -14) + track.N) % track.N], sd = q.d >= 0 ? 1 : -1, at2 = new THREE.Vector3(S.p.x + S.r.x * sd * 12, S.p.y, S.p.z + S.r.z * sd * 12);
        setTimeout(() => foot.grudgeAt(at2, pickOf(SZWAGIER_COMES)), 2200); }
      else { hud.rant(mouthOf(p), pickOf(HIT_PED[key] || HIT_ANY)); p.flee = 4.5; p.fleeNew = true; } }
    else if (!p && PH.pc) { const g0 = PH.pc.g.position; hud.impact(new THREE.Vector3(g0.x, g0.y + 1, g0.z), PH.kick ? 'BUM!' : 'BANG!'); shake = Math.max(shake, .18); quests.onKickPolice(PH.pc); }
    else if (!p && geese && PH.kick && (PH.gq = geese.strike(me, PH.reach + .3))) { const q = PH.gq; logEv('kick_goose', me.x, me.z); gooseKicked(q, q.g.position.clone().setY(q.g.position.y + .6)); }
    else if (!p) { const T = stuff.strike(me.x, me.z, me.yaw, PH.reach, PH.kick ? 1 : .55); if (T) shake = Math.max(shake, T.kind === 'mailbox' ? .08 : .03); }   // (no one there: a thing, maybe)
  }
  // a cyclist going by, punched: off his bike he goes (and, as after a kick, often gets up for a fight)
  if (pendingBike && (pendingBike.t -= dt) <= 0) { const b = pendingBike.b; pendingBike = null; const bp = b && b.r.root.position;
    if (bp && Math.hypot(bp.x - me.x, bp.z - me.z) < 2.4 && !(b.ghostUntil > performance.now())) { const ax = bp.x - me.x, az = bp.z - me.z, al = Math.hypot(ax, az) || 1;
      hud.impact(bp.clone().setY(bp.y + 1.4), 'ŁUP!'); shake = Math.max(shake, .2); quests.onKnockBike(b); traffic.knock(b, new THREE.Vector3(ax / al * 3, 0, az / al * 3), true); b.ghostUntil = performance.now() + 7000;
      if (Math.random() < .8) foot.grudge(b); else hud.rant(bp.clone().setY(bp.y + 1.8), pickOf(['MÓJ ROWER!', 'ZA CO?!', 'WARIAT!', 'JA TYLKO PO BUŁKI!'])); } }
}
// the cyclist nearest him on foot, going by (for a punch)
function bikeNear(me, r) { let best = null, bd = r; for (const b of traffic.bikes) { const p = b.r && b.r.root.position; if (!p || !b.on || b.fall) continue; const d = Math.hypot(p.x - me.x, p.z - me.z); if (d < bd) { bd = d; best = b; } } return best; }
let pendingBike = null;
function stepCarsVsWalker(me) {
  if (foot.down) return;
  for (const bx of traffic.boxes()) { const t = bx.t; if (!t.car || t.v < 2.2) continue; if (!boxHit(bx, me.x, me.z, .3)) continue;
    const vx = Math.sin(t.yaw) * t.v * .7, vz = Math.cos(t.yaw) * t.v * .7;
    if (foot.knock(vx, vz, 12 + t.v * 2.5)) { hud.impact(new THREE.Vector3(me.x, me.y + 1, me.z), 'BUM!'); t.stop = 3.5; flash('Potrącony!'); hurt(35, 'Potrącony. Koniec spaceru i trasy.'); setTimeout(() => hud.rant(t.car.group.position, pickOf(DRIVER_HIT), true, 1.75), 600); }
    break; }
}
// ---------- the bundles of papers to pick up: lit so they are seen (a glow on the ground, a column of light, an arrow bobbing over) ----------
const bundleMarks = (() => { const glowM = new THREE.MeshBasicMaterial({ color: '#efc970', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending });
  const beamM = new THREE.MeshBasicMaterial({ color: '#fff3cf', transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const arrowM = new THREE.MeshBasicMaterial({ color: '#efc970' }), rimM = new THREE.MeshBasicMaterial({ color: '#17181b' });
  const ringG = new THREE.RingGeometry(.32, .56, 28).rotateX(-Math.PI / 2), beamG = new THREE.CylinderGeometry(.08, .26, 3.2, 10, 1, true).translate(0, 1.6, 0), arrowG = new THREE.ConeGeometry(.14, .26, 4).rotateX(Math.PI), rimG = new THREE.ConeGeometry(.175, .32, 4).rotateX(Math.PI);
  return track.bundles.map(C => { const g = new THREE.Group(), p = C.o.position; g.position.set(p.x, p.y + .02, p.z);
    const ring = new THREE.Mesh(ringG, glowM.clone()); ring.renderOrder = 2; const beam = new THREE.Mesh(beamG, beamM); beam.renderOrder = 2; const arrow = new THREE.Group(); arrow.add(new THREE.Mesh(rimG, rimM), new THREE.Mesh(arrowG, arrowM));
    g.add(ring, beam, arrow); scene.add(g); return { C, g, ring, arrow, ph: Math.random() * 6 }; }); })();
function stepBundles(dt, px_, pz_) { const t = performance.now() / 1000;
  for (const m of bundleMarks) { const on = !m.C.used && Math.hypot(m.g.position.x - px_, m.g.position.z - pz_) < 90; m.g.visible = on; if (!on) continue;
    const k = .5 + .5 * Math.sin(t * 4 + m.ph); m.ring.scale.setScalar(.85 + k * .35); m.ring.material.opacity = .35 + k * .45;
    m.arrow.position.y = 1.15 + Math.sin(t * 3 + m.ph) * .12; m.arrow.rotation.y = t * 2 + m.ph; m.C.o.rotation.y += dt * .8; } }
// what a beaten cyclist leaves on the ground (three times in four): a wallet with a few złoty, a few of his papers, a bun (health);
// lit as the bundles are (a ring, a beam, an arrow over it), picked up walking up to it or riding over it; gone after a minute
const drops = [];
function dropLoot(at, kind0, onPick) { if (!kind0 && Math.random() < .25) return; const k = Math.random(), kind = kind0 || (k < .45 ? 'cash' : k < .8 ? 'papers' : 'bun');
  const g = new THREE.Group(), y = track.probe(at.x, at.z, -1).y; g.position.set(at.x + (Math.random() - .5) * .8, y + .03, at.z + (Math.random() - .5) * .8); scene.add(g);
  const item = new THREE.Group(); g.add(item);
  if (kind === 'cash') { const w = new THREE.Mesh(new THREE.BoxGeometry(.2, .04, .14), toon('#6b4a2e')); w.position.y = .03; item.add(w); for (let q = 0; q < 4; q++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .012, 10), toon('#efc970')); c.position.set(.12 + q * .05, .008 + (q % 2) * .012, (q - 1.5) * .04); item.add(c); } }
  if (kind === 'papers') for (let q = 0; q < 3; q++) { const r = new THREE.Mesh(paperG, paperM); r.rotation.z = Math.PI / 2; r.rotation.y = q * .5; r.position.set(0, .04 + q * .06, 0); r.add(new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .04, 10), bandM)); item.add(r); }
  if (kind === 'bag') { const b = new THREE.Mesh(new THREE.BoxGeometry(.24, .18, .09), toon('#5a3d27')); b.position.y = .1; item.add(b); const h = new THREE.Mesh(new THREE.TorusGeometry(.07, .012, 4, 12, Math.PI), toon('#3a2718')); h.position.y = .19; item.add(h); }
  if (kind === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 6), toon('#c98a45')); b.scale.set(1.3, .7, 1); b.position.y = .06; item.add(b); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: kind === 'bun' ? '#9fd27a' : '#efc970', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })); ring.renderOrder = 2;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.03, .12, 2.2, 10, 1, true).translate(0, 1.1, 0), new THREE.MeshBasicMaterial({ color: '#efc970', transparent: true, opacity: .08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); beam.renderOrder = 2;
  const arrow = new THREE.Group(); arrow.add(new THREE.Mesh(new THREE.ConeGeometry(.15, .28, 4).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: '#17181b' })), new THREE.Mesh(new THREE.ConeGeometry(.12, .22, 4).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: '#efc970' })));
  g.add(ring, beam, arrow); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); const D = { g, item, ring, arrow, kind, t: 0, ph: Math.random() * 6, onPick }; drops.push(D);
  setTimeout(() => hud.pop(g.position.clone().setY(g.position.y + .9), kind === 'cash' ? 'PORTFEL!' : kind === 'papers' ? 'JEGO GAZETY!' : kind === 'bag' ? 'TOREBKA!' : 'BUŁKA!', '#efc970'), 400); return D; }
function stepDrops(dt) { const me = foot.active ? foot.me : null, px_ = me ? me.x : B.x, pz_ = me ? me.z : B.z, reach = me ? 1.1 : 1.7, t = performance.now() / 1000;
  for (let k = drops.length - 1; k >= 0; k--) { const d = drops[k]; d.t += dt; const kk = .5 + .5 * Math.sin(t * 4 + d.ph); d.ring.scale.setScalar(.85 + kk * .35); d.ring.material.opacity = .35 + kk * .45;
    d.arrow.position.y = 1 + Math.sin(t * 3 + d.ph) * .12; d.arrow.rotation.y = t * 2 + d.ph; d.item.rotation.y += dt * .9;
    const at = d.g.position, near = Math.hypot(at.x - px_, at.z - pz_) < reach;
    if (near) { const lift = at.clone().setY(at.y + .7); d.onPick?.(); audio.play('pick');
      if (d.kind === 'cash') { const n = 3 + (Math.random() * 7 | 0); score(n, lift, `+${n} ZŁ`, '#efc970'); flash(pickOf(['Portfel! Dowodu nie ma, kasa jest.', 'Drobne na bułki. I na piwo.', 'Łup z bójki: ' + n + ' zł']));  }
      if (d.kind === 'papers') { B.papers += 4; hud.pop(lift, '+4', '#f6f3ea'); flash('Jego gazety. Teraz twoje. +4'); }
      if (d.kind === 'bun') { if (me) me.hp = Math.min(100, me.hp + 30); B.hp = Math.min(100, (B.hp ?? 100) + 30); hud.pop(lift, '+30 HP', '#9fd27a'); flash('Bułka z makiem. Siły wracają.'); } }
    if (near || (d.t > 60 && !d.onPick)) { scene.remove(d.g); drops.splice(k, 1); } } }
function pickBundle(C) { C.used = true; audio.play('rustle'); C.o.visible = false; B.papers += 8; hud.pop(C.o.position.clone().setY(C.o.position.y + .6), '+8', '#f6f3ea'); flash('Paczka gazet! +8'); }
function stepFoot(dt, inp) {                                           // (on foot: him walking or fighting; the world goes on round him)
  foot.update(dt, { fwd: inp.pedal - inp.brake, side: inp.steer, run: inp.sprint, atkL: foot.fighting && inp.atkL, atkR: foot.fighting && inp.atkR, up: inp.up, down: inp.down, guard: inp.guard, dodge: inp.dodge, taunt: inp.taunt, dx: inp.dx, dy: inp.dy, lmb: inp.lmb, rmb: inp.rmb, locked: inp.locked, touch: inp.touch, jump: inp.hop || (!foot.fighting && inp.kick) }, world);
  if (!foot.active) return;
  const me = foot.me, q = track.probe(me.x, me.z, me.hint), f = track.S[q.i].f, v = Math.abs(me.vf);
  water.update(dt); stepFires(dt); stepTaunts(); residents.update(dt, { x: me.x, z: me.z, v, foot: true, line: quests.lineFor, said: (r, t) => logEv('said', r.G.position.x, r.G.position.z, { who: r.lines || r.key, text: t }) });
  peds.update(dt, { x: me.x, z: me.z, v, d: q.d, busy: true });
  traffic.update(dt, { clear: FIN.on ? FIN.clear : null, pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsNow(), bus: modes.flags.bus, s: q.s, d: q.d, v, along: Math.sign(Math.sin(me.yaw) * f.x + Math.cos(me.yaw) * f.z) || 1 });
  stepPapers(dt); stepBundles(dt, me.x, me.z); px.uniforms.aber.value = rush = 0;
  stepPeople(dt, inp, me); stepCarsVsWalker(me);
  for (const C of track.bundles) if (!C.used && Math.hypot(C.x - me.x, C.z - me.z) < 1) pickBundle(C);   // (walked up to: picked up)
  if (!foot.fighting && foot.nearBike(bikeSpot()) && !B.hintShown) { B.hintShown = true; flash(touch.on ? 'ROWER: wsiądź' : keysOf('mount') + ': wsiądź na rower'); } if (!foot.nearBike(bikeSpot())) B.hintShown = false;
  foot.follow(dt); hoops?.late(dt, { me: foot.fighting ? null : me, P: me.P, cam: camera, view: foot.view });   // (his arms on the ball: after the camera is set)
  sun.position.set(me.x, me.y, me.z).addScaledVector(SUN, 60); sun.target.position.set(me.x, me.y, me.z); sun.target.updateMatrixWorld();
}
// on foot: where the bike is (an arrow at the top, turned the way it is from where you look; its distance; a mark over it when seen)
function bikeMark() { if (!foot.active || foot.fighting || hoops?.holding) return null; const me = foot.me, sp = bikeSpot(), dist = Math.hypot(me.x - B.x, me.z - B.z); if (Math.hypot(me.x - sp.x, me.z - sp.z) < 1.7) return null;   // (gone only once it is in reach to get on)
  const at = new THREE.Vector3(B.x, B.y + 1.35, B.z), v = at.clone().applyMatrix4(camera.matrixWorldInverse); return { at, dist, angle: Math.atan2(v.x, -v.z) }; }
const hurtFx = { hp: 100, flash: 0, t: 0 };
function stepHurt(dt) { const fs = foot.status(), me = foot.active ? foot.me : null, hp = me ? me.hp : 100;
  if (me && hp < hurtFx.hp - .5) { const d = hurtFx.hp - hp; hurtFx.flash = Math.min(1, hurtFx.flash + d / 25); hud.bleed(d > 14 ? 3 : d > 6 ? 2 : 1, d > 14); }   // (hit: a flash, blood)
  hurtFx.hp = hp; hurtFx.flash = Math.max(0, hurtFx.flash - dt * 1.6);
  const low = fs ? fs.low : 0; hurtFx.t += dt * (1.1 + low * 1.6);                                     // (the heart: faster as it gets worse)
  const beat = Math.pow(Math.max(0, Math.sin(hurtFx.t * Math.PI * 2)), 6) + .5 * Math.pow(Math.max(0, Math.sin(hurtFx.t * Math.PI * 2 - .9)), 8);
  const critical = me && hp < 18 ? (((performance.now() / 180) | 0) % 2) * .15 : 0;                      // (very bad: a blink as well)
  px.uniforms.hurt.value = Math.min(1, low * (.42 + .3 * beat) + critical + hurtFx.flash * .45); }
function drawHud(dt) {
  stepHurt(dt);
  const fs = foot.status(), head = foot.active ? new THREE.Vector3(foot.me.x, foot.me.y + 1.9, foot.me.z) : rider.root.position.clone().add(new THREE.Vector3(0, 1.72, 0));   // (just over his cap)
  touch.setMode(foot.active ? (foot.fighting ? 'fight' : 'foot') : 'bike'); touch.show(!menu.open && !asking && !look.isOpen && !shop.isOpen && !runUI.isOpen && !book.isOpen && !(talk.isOpen && !talk.isLight)); touch.chat(!foot.active && quests.canChat);
  hud.draw(dt, project, { bagX: menu.page !== 'title' ? hudBag.left : null, bagY: hudBag.top, marks: quests.marks().concat(subMarks(), mpMarks(), jobMarks()), mix: menu.page !== 'title' ? { order: ACT().map(t => ({ n: B.mix[t], col: TITLES[t].col, on: t === TK[B.sel] })), name: TITLES[TK[B.sel]].short } : null, quests: quests.tracker(), projEdge: projectEdge, hp: menu.page !== 'title' ? (B.hp ?? 100) : null, fame: B.fame || 0, siren: quests.siren, power: B.charge ? B.charge.p : -1, head, tired: B.tired, spent: B.spent, rattled: Math.max(0, ((B.rattled || 0) - 2.2) / 4.3), barks: barkers.filter(n => n.dog.bark > 0).map(n => new THREE.Vector3(n.dog.x, B.y + .95, n.dog.z)), papers: B.papers, points: B.points, fight: fs && fs.fight, low: fs ? fs.low : 0, star: fs && fs.star, cross: foot.active && mouse.locked && foot.view === 'first' && !(fs && fs.star), bike: bikeMark() });
}
// ---------- R: start again (after a yes) ----------
let asking = false;
function askReset(v) { asking = v; hud.ask(v, touch.on); document.body.classList.toggle('asking', v); if (!v) document.body.classList.remove('over'); }
function answer(yes) { askReset(false); if (yes) resetGame(); }
// the menu (Esc): pause, graphics; while it is open the keys and the pointer are its own and the game waits
// the help (H: shown or not, remembered) and full screen (L, or from the menu)
const keysEl = document.getElementById('keys');
function toggleKeys(v) { const on = v ?? keysEl.classList.contains('shut'); keysEl.classList.toggle('shut', !on); try { localStorage.setItem('pt.keys', on ? '1' : '0'); } catch { } }
try { if (localStorage.getItem('pt.keys') === '1') toggleKeys(true); } catch { }
function toggleFull() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => flash('Pełny ekran niedostępny w tym oknie')); } catch { flash('Pełny ekran niedostępny w tym oknie'); } }
document.addEventListener('fullscreenchange', () => { mouse.failed = false; if (document.fullscreenElement) lockPointer(); });   // (full screen: the mouse kept in it)
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && mouse.hadLock && !menu.open && !asking) menu.show('pause'); mouse.hadLock = !!document.pointerLockElement; });   // (Esc let the pointer go: the game pauses, as games do)
// the mouse's speed: 1X is half of what it was at first (it was too quick); kept in the browser
let sens = 1; try { const v = parseFloat(localStorage.getItem('pt.sens')); if (v > 0) sens = v; } catch { }
const LAB = location.pathname.includes('/lab-board/pieces/') ? new URL('../../', location.href).href : null;   // (in the lab: the way back to its board)
const menu = createMenu({ onMap: () => openMap(), onPlay: () => flash(keysOf('map') + ': MAPA TRASY. Wybierz odcinek albo jeździj swobodnie'), modes: () => [{ label: 'KLASYCZNA TRASA', act: () => { if (modes.id) modes.stop(); if (mp.on) mp.stop(); } }, ...Object.entries(MODES).map(([id, m]) => ({ label: m.name, info: m.info, act: () => { if (mp.on) mp.stop(); modes.start(id); } })), { label: 'GRA PRZEZ SIEĆ (2 GRACZY)', info: 'WYŚCIG, RAZEM, BEREK, WSPÓLNA JAZDA', act: () => { if (modes.id) modes.stop(); mp.openLobby(); } }], sound: { get: k => audio.get(k), set: (k, v) => audio.set(k, v) }, hud, look, styles: MENU_STYLES, light: LIGHT, presets: PRESETS, onRestart: () => askReset(true), onFull: toggleFull, onKeys: () => toggleKeys(), controls, lab: LAB, onPlay: () => { C.init = false; },
  sens: { get: () => sens, set: v => { sens = v; try { localStorage.setItem('pt.sens', String(v)); } catch { } } } });
addEventListener('keydown', e => { if (e.target?.closest?.('textarea, input') && e.code !== 'Escape') return; if (e.repeat && !['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) return;
  if (book.isOpen && book.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (e.code === 'Tab' && !menu.open && !asking && !talk.isOpen && !shop.isOpen && !runUI.isOpen) { book.toggle(); keys.clear(); e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (runUI.isOpen && runUI.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (fin.isOpen && fin.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (map.isOpen && map.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (modes.isOpen && modes.key(e)) { keys.clear(); e.stopImmediatePropagation(); e.preventDefault(); return; }
  if (mp.isOpen && mp.key(e)) { keys.clear(); e.stopImmediatePropagation(); e.preventDefault(); return; }
  if (shop.isOpen && shop.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (garage.isOpen && garage.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (talk.isOpen && talk.key(e)) { if (!talk.isLight) keys.clear(); e.stopImmediatePropagation(); return; }   // (a talk open: its keys (a light one: just the numbers))
  if (menu.open && !asking) { audio.play('ui'); menu.key(e); e.stopImmediatePropagation(); keys.clear(); return; }
  if (!asking && e.code === 'Escape') { menu.show('pause'); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
const Q = new URLSearchParams(location.search), ARENA = Q.get('arena');
if (!Q.has('play') && !ARENA) menu.show('title');   // (the title screen first; ?play skips it, as does the arena)
// the arena (from the workshop): off the bike on a field, an opponent of the kind chosen; when one is done, the next a moment after
const arenaState = { on: !!ARENA, init: false, wait: 0 };
const dbg = (() => { if (!Q.has('debug')) return null; const d = document.createElement('div'); d.className = 'ui'; Object.assign(d.style, { left: '50%', top: '46px', transform: 'translateX(-50%)', padding: '4px 10px', background: 'rgba(23,24,27,.8)', borderRadius: '6px', color: '#efc970', whiteSpace: 'pre', textAlign: 'center' }); document.body.appendChild(d); return d; })();
// the fires in the drums by the shacks: the flame flickers, puffs of smoke rise, grow and fade
const smokeM = new THREE.MeshBasicMaterial({ color: '#9a9690', transparent: true, depthWrite: false }), smokeG = new THREE.IcosahedronGeometry(.22, 0);
let fireT = 0;
function stepFires(dt) { stepDrops(dt); const t = (fireT += dt); track.train.update(dt); track.dapT.value = t;
  for (const f of track.fires) { const k = 1 + Math.sin(t * 17 + f.drum.id) * .12 + Math.sin(t * 29) * .08; f.flame.scale.set(1, k, 1); f.core.scale.set(1, 2 - k, 1); f.flame.rotation.y += dt * 3;
    if (!f.puffs) { f.puffs = []; for (let n = 0; n < 6; n++) { const m = new THREE.Mesh(smokeG, smokeM.clone()); f.drum.add(m); f.puffs.push({ m, t: n / 6 }); } }
    for (const p of f.puffs) { p.t = (p.t + dt * .22) % 1; const u = p.t; p.m.position.set(Math.sin(u * 5 + p.m.id) * .25 + u * .6, 1.2 + u * 3.2, Math.cos(u * 4) * .15); p.m.scale.setScalar(.6 + u * 2.4); p.m.material.opacity = .55 * (1 - u) * Math.min(1, u * 6); } } }
function stepArena(dt) { if (!arenaState.on || !foot.ready) return;
  if (!arenaState.init) { arenaState.init = true; const i = 60, S = track.S[i], d = -track.INNER * 60; B.x = S.p.x + S.r.x * d; B.z = S.p.z + S.r.z * d; B.hint = i; B.y = track.probe(B.x, B.z, i).y; B.yaw = Math.atan2(S.f.x, S.f.z); B.v = 0; B.crash = null; dismount('Arena: ' + ARENA + '. Esc: menu'); arenaState.wait = .8; }
  if (!foot.active) return;
  if (!foot.fighting && !foot.chasing) { if ((arenaState.wait -= dt) <= 0) { foot.arena(ARENA, { god: Q.has('god'), train: Q.has('train') && !arenaState.trainedOnce }); arenaState.trainedOnce = true; arenaState.wait = 2.5; } }
  else arenaState.wait = 2.5;
  if (dbg) { const p = foot.phase(); dbg.textContent = p ? `${p.kind}${p.train ? ' · TRENING ' + p.train + '/3' : ''}\n${p.phase}\nON ${p.hp}/${p.max} · TY ${p.myHp} HP, oddech ${p.mySt}${foot.god ? ' · NIEŚMIERTELNY' : ''}` : 'następny za chwilę…'; } }   // (the title screen first; ?play skips it)
addEventListener('wheel', e => { if (menu.open) { menu.wheel(e.deltaY); e.preventDefault(); return; } if (asking || e.target.closest?.('#styl')) return; camUser.dist = THREE.MathUtils.clamp(camUser.dist * (1 + Math.sign(e.deltaY) * .08), .45, 2.6); saveCam(); e.preventDefault(); }, { passive: false });   // (a long menu page: the wheel moves down it)
for (const [ev, type] of [['pointerdown', 'down'], ['pointermove', 'move'], ['pointerup', 'up']]) addEventListener(ev, e => { if (!menu.open || asking) return; menu.pointer(type, e.clientX, e.clientY); e.preventDefault(); e.stopPropagation(); }, true);
// asked: a touch or a click on TAK or NIE (the pointer mapped to the picture's pixels); the pointer over one picks it
const toPx = e => [e.clientX / innerWidth * hud.canvas.width, e.clientY / innerHeight * hud.canvas.height];
addEventListener('pointerdown', e => { if (!asking) return; const i = hud.askAt(...toPx(e)); if (i >= 0) answer(i === 0); e.preventDefault(); e.stopPropagation(); }, true);
addEventListener('pointermove', e => { if (!asking || e.pointerType === 'touch') return; const i = hud.askAt(...toPx(e)); if (i >= 0) hud.askSel = i; document.body.classList.toggle('over', i >= 0); }, true);   // (a hand over a button)
addEventListener('keydown', e => { if (e.target?.closest?.('textarea, input') && e.code !== 'Escape') return; if (e.repeat) return;
  if (!asking && on('reset', e.code)) { askReset(true); e.preventDefault(); return; }
  if (asking) { if (e.code === 'KeyY' || e.code === 'KeyT') answer(true); else if (e.code === 'KeyN' || e.code === 'Escape') answer(false);
    else if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Tab'].includes(e.code)) hud.askSel = 1 - hud.askSel; else if (e.code === 'Enter' || e.code === 'Space') answer(hud.askSel === 0); e.preventDefault(); } });
function resetGame() {
  if (foot.active) foot.stop(); foot.reset(); B.parked = false; rider.boy.visible = true;
  myBike = { type: 'moj', parts: newParts() }; INV.length = 0; PAINTS.clear(); PAINTS.add(0); spawnBikes();
  granny.reset(); quests.reset(); shop.reset(); rider.root.visible = true; B.rattled = 0;
  rider.ragdollOff();
  const q = track.probe(track.start.x, track.start.z, 0); C.iy = openShot(); C.iyGo = false;
  Object.assign(B, { x: track.start.x, z: track.start.z, y: q.y, vy: 0, air: false, gPrev: q.y, gVel: 0, yaw: track.start.yaw, v: 0, steer: 0, lean: 0, leanV: 0, hint: 0, pitch: 0, jolt: 0,
    stam: 1, spent: false, tired: 0, papers: 30, points: 0, lastPts: 0, earned: 0, delivered: 0, windows: 0, hp: 100, fame: 0, items: [], lastD: 0, crash: null, kick: null, dogSlow: 0, look: null, charge: null, lvl: 0, streak: 0, thrown: 0, falls: 0, fallsAt: [] }); drawStreak();
  for (const p of papers) scene.remove(p.m, p.dot); papers.length = 0; for (const s of shards) scene.remove(s.m); shards.length = 0; for (const m of cracks) scene.remove(m); cracks.length = 0;
  for (const w of track.windows) w.broken = false; for (const d of track.doors) d.done = false;
  for (const mb of track.mailboxes) { mb.done = false; mb.flag.rotation.x = 0; }
  for (const b of track.bundles) { b.used = false; b.o.visible = true; }
  for (const d of dogs.dogs) { Object.assign(d, { x: d.home.x, z: d.home.z, v: 0, state: 'home', cool: 4, bark: 0, hint: -1, fly: null }); }
  trip.dist = trip.max = trip.time = 0; endT = 0; B.nt = 1; B.mix = { trabka: B.papers, wiesci: 0, sport: 0 }; B.sel = 0; assignSubs(); C.init = false; flash('Od nowa!');
}
// the court at home (hoops.js): the ball, the hoop, the challenge (a mode); the other player's throws seen
const hoops = createHoops({ THREE, scene, track, audio, hud, game: { flash: s => flash(s), send: m => net?.send(m), pop: (at, t, c) => hud.pop(at, t, c), residents: () => residents, ghost: () => GW.G?.visible ? GW.G.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : null } });
// on foot on the court (a mode's start): the bike left on the lawn by it, him at the spot, facing the hoop
function onFootAt(p, yaw) { if (foot.active) foot.stop(); const side = hoops.at(4.8, 1.5), q = track.probe(side.x, side.z, track.startI); Object.assign(B, { x: side.x, z: side.z, yaw: yaw + Math.PI / 2, hint: q.i, y: q.y, gPrev: q.y, v: 0, crash: null }); B.bikeDown = null; parkBike();
  if (!foot.start({ x: p.x, z: p.z, yaw, hint: q.i })) return; B.parked = true; rider.boy.visible = false; C.iy = 0; }
// the modes (modes.js): the sprint against the clock, the obstacle course; they thin the traffic (modes.flags) and pause on their end page
const modes = createModes({ THREE, scene, track, audio, game: { get B() { return B; }, get hoops() { return hoops; }, onFootAt, restart: () => { resetGame(); C.iy = 0; }, flash: s => flash(s), pop: (at, t, c) => hud.pop(at, t, c),
  place: (x, z, yaw, i = 0) => { const q = track.probe(x, z, i); Object.assign(B, { x, z, yaw, hint: q.i, y: q.y, gPrev: q.y, v: 0, steer: 0, lean: 0, leanV: 0 }); C.yaw = yaw; C.init = false; C.iy = 0; } } });
// ---------- the way forward (levels.js, docs/progresja.md): home, the map, the stretches. A stretch: from home out onto the loop, its
// checkpoints passed in turn (a quarter of the lap each, the way it goes), the last one its finish under a gate; the clock from the first
// push; at the finish the paper (paper.js), the stars, the best kept, the save. At home: no gate, no clock (riding free, as before).
const lvHud = document.createElement('div'); lvHud.id = 'lvhud'; document.body.appendChild(lvHud);
{ const st = document.createElement('style'); st.textContent = `#lvhud { position: fixed; z-index: 4; left: 50%; top: 10px; transform: translateX(-50%); display: none; gap: 12px; align-items: center; white-space: nowrap; font: 16px/1.2 PTPix, ui-monospace, monospace; color: #f6f3ea;
  border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 2px 8px; pointer-events: none; } #lvhud.on { display: flex; } #lvhud b { color: #efc970; font-weight: normal; } #lvhud .job { color: #8fc3f0; } #lvhud .live { color: #cf5a3e; animation: lvw 1s steps(1) infinite; } #radio em.take { display: block; font-style: normal; color: #9fd27a; margin-top: 2px; } #lvhud { flex-wrap: wrap; justify-content: center; max-width: 92vw; } #lvhud .w { color: #cf5a3e; animation: lvw .5s steps(1) infinite; } @keyframes lvw { 50% { opacity: .3; } }`; document.head.appendChild(st); }
const RUN = { t: 0, go: false, cp: 0, cps: [], done: false, gate: [], hits: [], chk: 0 };
const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const partLabel = (k, i) => { const t = PARTS[k].tiers[i].name; return t === PARTS[k].name ? t : `${PARTS[k].name}: ${t}`; };
function saveCampaign() { LVM.save({ money: B.points, bike: myBike, inv: INV.map(p => ({ ...p })), paints: [...PAINTS], at: LV?.id || 'dom' }); }
function applySave() { if (!LVM.hasSave()) return; const S = LVM.load(); if (S.bike?.type) { myBike = { type: S.bike.type, parts: { ...newParts(), ...(S.bike.parts || {}) }, ...(S.bike.paint ? { paint: S.bike.paint } : {}) }; }
  if (S.owned?.licznik) cyclo.skin(S.owned.licznik); INV.splice(0, INV.length, ...(S.inv || [])); PAINTS.clear(); for (const k of [0, ...(S.paints || [])]) PAINTS.add(k); B.points = S.money || 0; applyBike(); }
setTimeout(applySave, 0);
{ const pz = new URLSearchParams(location.search).get('poziom'); if (pz) setTimeout(() => { const q = new URLSearchParams(location.search); q.delete('poziom'); history.replaceState(null, '', location.pathname + '?' + q.toString().replace(/=(&|$)/g, '$1')); startLevel(pz); }, 60); }
// the gate over the loop road: two striped posts at the kerbs, a chequered banner with META
function clearGate() { for (const o of RUN.gate) scene.remove(o); for (const C of RUN.hits) track.dropHit(C); RUN.gate = []; RUN.hits = []; }
function buildGate(i) { clearGate(); const S0 = track.S[i], w = track.ROAD + .55, yaw = Math.atan2(S0.f.x, S0.f.z);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 12; const g = cv.getContext('2d');
  for (let y = 0; y < 12; y += 3) for (let x = 0; x < 64; x += 3) { g.fillStyle = ((x + y) / 3) % 2 ? '#17181b' : '#f6f3ea'; g.fillRect(x, y, 3, 3); }
  g.fillStyle = '#efc970'; g.fillRect(17, 1, 30, 10); g.fillStyle = '#17181b'; g.font = '8px PTPix'; g.textBaseline = 'top'; g.fillText('META', 22, 2);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = tx.minFilter = THREE.NearestFilter;
  const sc = document.createElement('canvas'); sc.width = 2; sc.height = 8; const sg = sc.getContext('2d'); for (let y = 0; y < 8; y++) { sg.fillStyle = y % 2 ? '#c23a2e' : '#f6f3ea'; sg.fillRect(0, y, 2, 1); }
  const stx = new THREE.CanvasTexture(sc); stx.colorSpace = THREE.SRGBColorSpace; stx.magFilter = stx.minFilter = THREE.NearestFilter;
  const postM = toon('#ffffff', { map: stx }), banM = toon('#ffffff', { map: tx }), H = 3.6;
  for (const sd of [-1, 1]) { const x = S0.p.x + S0.r.x * w * sd, z = S0.p.z + S0.r.z * w * sd, y = track.probe(x, z, i).y, post = new THREE.Mesh(new THREE.BoxGeometry(.2, H, .2), postM);
    post.position.set(x, y + H / 2, z); post.rotation.y = yaw; scene.add(post); RUN.gate.push(post);
    const foot = new THREE.Object3D(); foot.position.set(x, y, z); foot.rotation.y = yaw; RUN.hits.push(track.addHit(foot, { hx: .12, hz: .12, h: H, kind: 'hard' }, i)); }
  const yM = track.probe(S0.p.x, S0.p.z, i).y, ban = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + .2, .75, .06), banM); ban.position.set(S0.p.x, yM + H - .25, S0.p.z); ban.rotation.y = yaw; scene.add(ban); RUN.gate.push(ban); }
function goRegion(region, poziom) { saveCampaign(); const q = new URLSearchParams(location.search); q.set('play', ''); if (region && region !== 'peryferia') q.set('region', region); else q.delete('region'); if (poziom) q.set('poziom', poziom); else q.delete('poziom'); location.search = q.toString().replace(/=(&|$)/g, '$1'); }
// the morning's fog on a level that has it: the far end of the view pulled in (25 m clear, gone by 55), the colour of wet air
const FOG0 = { near: scene.fog.near, far: scene.fog.far, col: scene.fog.color.clone() };
function setFog(on) { scene.fog.near = on ? 12 : FOG0.near; scene.fog.far = on ? 55 : FOG0.far; scene.fog.color.copy(on ? new THREE.Color('#d9ddd6') : FOG0.col); }
// (the opening shot from in front of him: only the very first start, from home; later ones start on the road, from behind)
function startLevel(id) { const L0 = LVM.LEVEL(id); if (!L0 || L0.soon) return; if ((L0.region === 'peryferia' ? 'peryferia' : L0.region) !== track.region) { goRegion(L0.region, id); return; } const mods = LVM.mods(), L = LVM.withMods(L0, mods); RUN.mods = mods; if (modes.id) modes.stop(); if (mp.on) mp.stop(); if (fin.isOpen) fin.close();
  LV = L; SUBR = seeded(L.seed); resetGame(); SUBR = Math.random; if (!(id === 'p1' && !LVM.load().done?.p1)) { C.iy = 0; C.yaw = B.yaw; C.init = false; } const S = LVM.load(); B.points = S.money || 0; B.lastPts = B.points; B.papers = L.papers; B.mix = { trabka: B.papers, wiesci: 0, sport: 0 };
  const iJ = track.startI, N = track.N, steps = Math.round(L.finish.to * 4); RUN.cps = []; for (let k = 1; k <= steps; k++) RUN.cps.push(((iJ + L.finish.dir * Math.round(N * L.finish.to * k / steps)) % N + N) % N);
  buildFinale(); buildCrossings(); setFog(!!LV.fog); traffic.rivals(LV.rivals || 0); if (LV.rivals) setTimeout(() => flash('Kurier Osiedlowy na trasie! Wyprzedź ich, kopnij albo trafiaj gazetą, zanim podbiorą skrzynki'), 2400); if (LV.fog) setTimeout(() => flash('Mgła! Widać na kilkadziesiąt metrów. Przejazd słychać, zanim go widać'), 1800); bindJobs(); { const S1 = LVM.load(); LVM.save({ runs: (S1.runs || 0) + 1 }); } Object.assign(RAD, { fin: false, cool: 6, idle: 40, gag: false }); if (LV2.cur?.box) scene.remove(LV2.cur.box); Object.assign(LV2, { offer: null, cur: null, next: 30 + Math.random() * 20 }); Object.assign(RUN, { shots: [], stolen: 0, rivalHits: 0, boxed: 0, far: 0, mudSaid: false, crossSaid: false, gooseMad: 0, t: 0, go: false, cp: 0, done: false, chk: 0, minA: Infinity, prevA: 1e9, log: [], snaps: [], dogOn: false, dogT: -99, stops: undefined, maxStreak: 0 }); buildGate(RUN.cps[RUN.cps.length - 1]); lvHud.classList.add('on'); saveCampaign();
  flash(`${L.name}: ${track.home?.homeH ? 'wyjedź z domu' : 'ruszaj'} i dojedź do mety` + (mods.length ? ` · umowa: +${Math.round(LVM.modBonus(mods) * 100)}% premii` : '')); }
function goHome() { if (fin.isOpen) fin.close(); clearFinale(); clearCrossings(); setFog(false); traffic.rivals(0); if (track.region !== 'peryferia') { goRegion('peryferia', null); return; } LV = null; clearGate(); lvHud.classList.remove('on'); resetGame(); const S = LVM.load(); if (LVM.hasSave()) B.points = S.money || 0; B.lastPts = B.points; flash('W domu: jeździsz swobodnie. ' + keysOf('map') + ': mapa'); }
function openMap() { if (menu.open) menu.close(); saveCampaign(); map.open(); }
// how far along the way to the next checkpoint (the way it goes; more than most of a lap: going the wrong way)
const ahead = (i, cp) => ((((cp - i) * LV.finish.dir) % track.N) + track.N) % track.N * track.ds;
// ---------- the jobs in the notebook (jobs.js): bound to this stretch's way at its start, watched as you ride ----------
const JOBRUN = [];
function bindJobs() { JOBRUN.length = 0; const S = LVM.load(), iJ = track.startI, N = track.N, dir = LV.finish.dir, span = Math.round(N * LV.finish.to), along = i => ((((i - iJ) * dir) % N) + N) % N;
  for (const j of S.jobs || []) { const R = { j, falls0: B.falls || 0, done: false, boxes0: 0, airT: 0 }; if (JB.JOBS[j.kind]?.region && JB.JOBS[j.kind].region !== track.region) continue;   // (a village job waits for a village route)
    if (j.kind === 'wyscig') R.limit = Math.round((LV.goal?.time || 160) * .85);
    if (j.kind === 'szarlotka' || j.kind === 'jajka') { const ds = track.doors.map((d, i) => ({ d, i, a: along(d.i) })).filter(q => q.a > span * .2 && q.a < span * .9); const q = ds[Math.random() * ds.length | 0]; if (!q) continue; R.door = q.d; }
    if (j.kind === 'foto' && j.k !== 'dog') { const all = (track.show?.shacks || []).filter(q => q.label === ({ kapliczka: 'kapliczka', budowa: 'budowa', przystanek: 'przystanek' })[j.k]); let best = null, bd = 1e18;
      for (const q of all) { const P = q.o.getWorldPosition(new THREE.Vector3()), a = along(nearSt(P.x, P.z)); if (a > span + 10) continue; const d = a; if (d < bd) { bd = d; best = P; } } R.at = best || (all[0] && all[0].o.getWorldPosition(new THREE.Vector3())); }
    if (j.kind === 'skrzynki') R.n0 = 0;
    JOBRUN.push(R); } }
function jobEnd(R, ok) { if (R.done) return; R.done = true; const J = JB.JOBS[R.j.kind], S = LVM.load(); S.jobs = (S.jobs || []).filter(q => q.id !== R.j.id);
  (S.jobRes ||= []).push({ kind: R.j.kind, ok, what: R.j.what || '', pay: ok ? J.pay : 0 }); LVM.save(); if (ok) { B.points += J.pay; audio.play('trick'); flash(`Zlecenie: ${J.done} +${J.pay} zł`); } else { audio.play('miss'); flash('Zlecenie przepadło: ' + J.fail); } }
function stepJobs() { if (!LV || RUN.done) return; const me = foot.active ? foot.me : B, sp = Math.abs(foot.active ? foot.me.vf || 0 : B.v);
  for (const R of JOBRUN) { if (R.done) continue; const k = R.j.kind;
    if (k === 'szarlotka') { if ((B.falls || 0) > R.falls0) { jobEnd(R, false); continue; } if (R.door && Math.hypot(me.x - R.door.p.x, me.z - R.door.p.z) < 5 && sp < 2) jobEnd(R, true); }
    if (k === 'jajka') { if ((B.falls || 0) > R.falls0) { jobEnd(R, false); flash('Jajecznica w torbie...'); continue; } R.airT = B.air ? R.airT + .1 : 0; if (R.airT > .9) { jobEnd(R, false); flash('Za długi skok: jajka nie przeżyły lądowania'); continue; } if (R.door && Math.hypot(me.x - R.door.p.x, me.z - R.door.p.z) < 5 && sp < 2) jobEnd(R, true); }
    if (k === 'ogloszenia' && (RUN.boxed || 0) >= 4) jobEnd(R, true);
    if (k === 'wyscig' && RUN.t > R.limit && !R.late) { R.late = true; flash('Traktorzysta już przy młynie! Zakład przegrany'); }
    if (k === 'skrzynki' && (RUN.log || []).filter(e => e.kind === 'kick_mailbox').length >= 3) { jobEnd(R, true); if (quests.police) quests.police.rep = (quests.police.rep || 0) - 1; } } }
// the camera (Q): a photo through the game's eye; for the photo job, its subject near and before you
function snapJob() { const R = JOBRUN.find(q => !q.done && q.j.kind === 'foto'); audio.play('ui'); const img = photo(camera);
  if (LV2.cur?.kind === 'dog') { const me = foot.active ? foot.me : B, fy = new THREE.Vector3(Math.sin(me.yaw), 0, Math.cos(me.yaw)); if (dogs.dogs.some(d => { const w = new THREE.Vector3(d.x - me.x, 0, d.z - me.z), l = w.length(); return l < 16 && w.normalize().dot(fy) > .55; })) { LV2.cur.snapped = true; (RUN.shots ||= []).push({ what: 'pies na trasie, z telefonu redakcji', img }); return; } }
  if (!R) { flash('Pstryk! (żadne zlecenie nie czeka na zdjęcie)'); return; }
  const f = new THREE.Vector3(); camera.getWorldDirection(f); const cand = R.j.k === 'dog' ? dogs.dogs.map(d => new THREE.Vector3(d.x, B.y + .5, d.z)) : R.at ? [R.at] : [];
  const me = foot.active ? foot.me : B, fy = new THREE.Vector3(Math.sin(me.yaw), 0, Math.cos(me.yaw)), okAt = cand.find(P => { const v = P.clone().sub(camera.position), l = v.length(), w = new THREE.Vector3(P.x - me.x, 0, P.z - me.z), lw = w.length(); return (l < 24 && v.normalize().dot(f) > .75) || (lw < 14 && w.normalize().dot(fy) > .6); });
  if (!okAt) { flash('Pstryk! Ale to nie to. Podjedź bliżej i wyceluj w ' + (R.j.aim || R.j.what.split(',')[0])); return; }
  R.img = img; (RUN.shots ||= []).push({ what: R.j.what, img }); jobEnd(R, true); }
// the marks over the jobs' targets
function jobMarks() { const out = []; const J = LV2.cur; if (J) { if (J.box) out.push({ p: J.box.position.clone().setY(J.box.position.y + 2.2), s: 'v', col: '#cf5a3e' }); if (J.door && (J.kind === 'door' || J.got)) out.push({ p: new THREE.Vector3(J.door.p.x, J.door.p.y + 3.4, J.door.p.z), s: 'v', col: '#cf5a3e' }); } for (const R of JOBRUN) { if (R.done) continue; if (R.door) out.push({ p: new THREE.Vector3(R.door.p.x, R.door.p.y + 3.4, R.door.p.z), s: 'v', col: '#efc970' }); if (R.at) out.push({ p: R.at.clone().setY(R.at.y + 4), s: 'v', col: '#8fc3f0' }); } return out; }
// ---------- Janusz on the earpiece (bought from Żaneta): his voice in a box under the bike computer, typed out. A sprint after a while: his
// pep talk and a turbo (more push, less breath) for a few seconds; a car close behind; a fall; a checkpoint; the finish near; his talk now and then ----------
const DECK = (() => { let D = {}; try { D = JSON.parse(localStorage.getItem('pt.decks') || '{}'); } catch { } return D; })();
function draw(key, arr) { let d = DECK[key]; if (!Array.isArray(d) || !d.length || d.some(i => i >= arr.length)) { d = arr.map((_, i) => i).sort(() => Math.random() - .5); if (d.length > 1 && d[d.length - 1] === DECK['last:' + key]) d.unshift(d.pop()); }
  const i = d.pop(); DECK[key] = d; DECK['last:' + key] = i; try { localStorage.setItem('pt.decks', JSON.stringify(DECK)); } catch { } return arr[i]; }
const RAD = { t: 0, cool: 6, idle: 50, turbo: 0, sprint: false, fin: false, behind: 0, fall: 0, face: null, el: null, typ: 0 };
{ const st = document.createElement('style'); st.textContent = `#radio { position: fixed; z-index: 4; left: 12px; top: 128px; width: min(360px, 60vw); display: none; gap: 8px; align-items: flex-start; font: 16px/20px PTPix, ui-monospace, monospace; color: #f6f3ea; border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 4px 8px; pointer-events: none; }
  #radio.on { display: flex; } #radio img { width: 40px; height: 40px; image-rendering: pixelated; border: 2px solid #17181b; flex: none; } #radio b { display: block; font-weight: normal; color: #efc970; } #radio b i { display: inline-block; width: 8px; height: 8px; background: #cf5a3e; margin-right: 6px; animation: rad-on .6s steps(1) infinite; } @keyframes rad-on { 50% { opacity: 0; } }
  #radio.turbo { border-image-source: var(--px-sel); color: #17181b; } #radio.turbo b { color: #8e2e25; } @media (max-width: 640px) { #radio { top: 96px; } }`; document.head.appendChild(st); }
function radioSay(kind, line, who = 'janusz', extra = '') { const S = LVM.load(); if (!S.owned?.sluchawka) return; if (!RAD.el) { RAD.el = document.createElement('div'); RAD.el.id = 'radio'; document.body.appendChild(RAD.el); }
  RAD.faces ||= {}; if (!RAD.faces[who]) { const f = faceOf(JB.PERSONAS[who]?.face || who); if (f) RAD.faces[who] = f.toDataURL(); } const t = line || draw('r:' + kind, JB.RADIO[kind]), fc = RAD.faces[who]; RAD.el.innerHTML = `${fc ? `<img src="${fc}" alt="">` : ''}<div><b><i></i>SŁUCHAWKA · ${(JB.PERSONAS[who]?.name || 'JANUSZ').toUpperCase()}</b><span></span>${extra}</div>`;
  RAD.el.classList.add('on'); RAD.el.classList.toggle('turbo', kind === 'turbo'); const sp = RAD.el.querySelector('span'); clearInterval(RAD.typ); let n = 0; RAD.typ = setInterval(() => { n += 2; sp.textContent = t.slice(0, n); if (n >= t.length) clearInterval(RAD.typ); }, 35); RAD.t = 2.6 + t.length * .045; }
// ---------- the calls on the earpiece (jobs.js LIVE): now and then someone with something for right now; T takes it, then the clock ----------
const LV2 = { offer: null, cur: null, next: 35, el: null };
function liveOffer() { const L = JB.LIVE.filter(q => q.kind !== 'rush' || RUN.cp < RUN.cps.length - 1), o = draw('live', L); LV2.offer = { ...o, until: 8 }; radioSay('', o.say, o.who, `<em class="take">${keysOf('chat')}: BIORĘ · 8 S</em>`); RAD.t = 8.5; audio.play('ui'); }
function liveTake() { const o = LV2.offer; if (!o) return false; LV2.offer = null; const me = foot.active ? foot.me : B, J = { ...o, left: o.t, log0: (RUN.log || []).length };
  if (o.kind === 'door' || o.kind === 'parcel') { const ahead = track.doors.filter(d => { const dx = d.p.x - me.x, dz = d.p.z - me.z, l = Math.hypot(dx, dz); return l > 25 && l < 120 && (dx * Math.sin(me.yaw) + dz * Math.cos(me.yaw)) / l > .3; }); J.door = ahead[Math.random() * ahead.length | 0] || track.doors[0]; }
  if (o.kind === 'parcel') { const f = new THREE.Vector3(Math.sin(me.yaw), 0, Math.cos(me.yaw)), p = new THREE.Vector3(me.x, 0, me.z).addScaledVector(f, 18), q = track.probe(p.x, p.z, B.hint); J.box = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, .32), toon('#a07a4a')); J.box.position.set(p.x, q.y + .15, p.z); scene.add(J.box); J.got = false; }
  if (o.kind === 'rush') J.cp = RUN.cp;
  LV2.cur = J; radioSay('', 'Dobra, to leć! ' + (o.kind === 'dog' ? 'Aparat pod ' + keysOf('snap') + '.' : ''), o.who); return true; }
function liveEnd(ok) { const J = LV2.cur; if (!J) return; LV2.cur = null; if (J.box) scene.remove(J.box); logEv('live', B.x, B.z, { who: J.who, ok, what: J.kind, pay: ok ? J.pay : 0 });
  if (ok) { B.points += J.pay; audio.play('coin'); radioSay('', draw('liveOk', JB.LIVE_OK) + ` +${J.pay} zł`, J.who); } else radioSay('', draw('liveLate', JB.LIVE_LATE), J.who); }
function stepLive(dt) { if (!LV || RUN.done || !LVM.load().owned?.sluchawka) { if (LV2.cur) liveEnd(false); return; } const me = foot.active ? foot.me : B, sp = Math.abs(foot.active ? foot.me.vf || 0 : B.v);
  if (LV2.offer) { if ((LV2.offer.until -= dt) <= 0) { LV2.offer = null; RAD.el?.classList.remove('on'); } else { const em = RAD.el?.querySelector('em.take'); if (em) em.textContent = `${keysOf('chat')}: BIORĘ · ${Math.ceil(LV2.offer.until)} S`; } }
  if (!LV2.offer && !LV2.cur && RUN.go && (LV2.next -= dt) <= 0 && RAD.t <= 0) { LV2.next = 45 + Math.random() * 40; liveOffer(); }
  const J = LV2.cur; if (!J) return; if ((J.left -= dt) <= 0) { liveEnd(false); return; } const evs = (RUN.log || []).slice(J.log0);
  if (J.kind === 'door' && Math.hypot(me.x - J.door.p.x, me.z - J.door.p.z) < 5 && sp < 2.2) liveEnd(true);
  if (J.kind === 'parcel') { if (!J.got && Math.hypot(me.x - J.box.position.x, me.z - J.box.position.z) < 1.8) { J.got = true; scene.remove(J.box); J.box = null; audio.play('pick'); flash('Paczuszka w torbie. Teraz pod drzwi ze znaczkiem.'); } else if (J.got && Math.hypot(me.x - J.door.p.x, me.z - J.door.p.z) < 5 && sp < 2.2) liveEnd(true); }
  if (J.kind === 'bike' && evs.some(e => e.kind === 'kick_bike')) liveEnd(true);
  if (J.kind === 'trick' && evs.some(e => e.kind === 'trick')) liveEnd(true);
  if (J.kind === 'rush' && RUN.cp > J.cp) liveEnd(true);
  if (J.kind === 'dog' && J.snapped) liveEnd(true); }
// a scene on the earpiece: Janusz, you, Janusz (each in turn, the box his or yours)
function radioScene(lines, solo) { let k = 0; const next = () => { if (k >= lines.length) return; const mine = !solo && k % 2 === 1; radioSay('', lines[k], mine ? 'ty' : 'janusz'); if (mine) RAD.el.querySelector('b').innerHTML = '<i></i>TY'; k++; setTimeout(next, 900 + lines[k - 1].length * 45); }; next(); }
function stepRadio(dt, inp) { if (RAD.t > 0 && (RAD.t -= dt) <= 0) RAD.el?.classList.remove('on'); RAD.turbo = Math.max(0, RAD.turbo - dt); RAD.cool -= dt; RAD.behind -= dt; RAD.fall -= dt;
  if (!LVM.load().owned?.sluchawka || foot.active || menu.open) { RAD.sprint = !!inp.sprint; return; }
  if (inp.sprint && !RAD.sprint && RAD.cool <= 0 && B.v > 3) { RAD.turbo = 3.5; RAD.cool = 22; radioSay('turbo'); audio.play('trick', { vol: .4 }); } RAD.sprint = !!inp.sprint;
  if (RAD.behind <= 0) { const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw); for (const t of traffic.list || []) { const p = t.car?.group?.position; if (!p) continue; const dx = p.x - B.x, dz = p.z - B.z, l = Math.hypot(dx, dz); if (l < 9 && (dx * fx + dz * fz) / l < -.6) { RAD.behind = 30; radioSay('behind'); break; } } }
  if (LV && !RUN.done && RAD.t <= 0 && (RAD.idle -= dt) <= 0) { RAD.idle = 45 + Math.random() * 35; const S0 = LVM.load(), gagOk = !RAD.gag && S0.gagRun !== (S0.runs || 0) - 1; if (gagOk && Math.random() < .3) { RAD.gag = true; LVM.save({ gagRun: S0.runs || 0 }); audio.play('ui'); if (Math.random() < .5) radioScene(draw('mixup', JB.MIXUP)); else radioScene([...draw('pocket', JB.POCKET), draw('pocketEnd', JB.POCKET_END)], true); } else radioSay('idle'); } }
// ---------- the final straight (the last 130 m before a stretch's finish): a banner over the road, a slalom of cones, a kicker, four
// targets by the road to hit with a paper; at the finish a beat of slow motion and a flash. What it came to: a bonus, and in the paper ----------
const FIN = { G: new THREE.Group(), cones: [], targets: [], trenches: [], rings: [], pads: [], hits: [], on: false, entered: false, res: null, combo: 0, comboT: 0, t: 0 };
scene.add(FIN.G);
function clearFinale() { for (const o of FIN.junk || []) scene.remove(o); FIN.junk = []; for (const h of FIN.hits) track.dropHit(h); while (FIN.G.children.length) FIN.G.remove(FIN.G.children[0]); Object.assign(FIN, { cones: [], targets: [], trenches: [], rings: [], pads: [], hits: [], on: false }); }
// the final straight (the last 180 m): a banner; a slalom; an arrow pad (a push); a kicker and a trench across the road to clear (in the
// air: or a fall); big targets by the road, others that pop up as you come, one swinging over the road on a rope; golden rings in the
// air after the second kicker; a double trench; pads again to the line. Scoring things one after another: a combo (x2, x3)
function buildFinale() { clearFinale(); { const sF = RUN.cps[RUN.cps.length - 1] * track.ds, FL0 = Math.min(300, LV.finish.to * track.len * .45) + 25, d0 = LV.finish.dir; FIN.clear = d0 > 0 ? [sF - FL0, sF + 15] : [sF - 15, sF + FL0]; } const N = track.N, ds = track.ds, dir = LV.finish.dir, iF = RUN.cps[RUN.cps.length - 1], S = track.S, FL = Math.min(300, LV.finish.to * track.len * .45), u = k => k * FL;
  const at = (m0, d) => { const m = m0 <= 1.0001 ? u(m0) : m0; const i = ((iF - dir * Math.round(m / ds)) % N + N) % N, A = S[i], x = A.p.x + A.r.x * d * dir, z = A.p.z + A.r.z * d * dir; return { i, x, z, y: track.probe(x, z, i).y, yaw: Math.atan2(A.f.x * dir, A.f.z * dir), f: new THREE.Vector3(A.f.x * dir, 0, A.f.z * dir), r: new THREE.Vector3(A.r.x * dir, 0, A.r.z * dir) }; };
  const M = c => toon(c), coneM = M('#e8692c'), bandM = M('#f6f3ea'), postM = M('#f6f3ea'), wood = M('#9e7a4f'), dark = M('#1d1e21'), gold = M('#efc970'), red = M('#cf5a3e');
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  const W = track.ROAD, WIES = track.region === 'wies';
  // (the village's: round bales of hay, lying, their ends spiralled; one to ride into rolls away)
  const hayM = M('#d9b45a'), hayEnd = (() => { const t = cv(16, 16, g => { g.fillStyle = '#c9a04a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a8832f'; for (let a = 0; a < 26; a += .25) { const r = a * .28; g.fillRect(Math.round(7.5 + Math.cos(a) * r), Math.round(7.5 + Math.sin(a) * r), 1, 1); } }); return new THREE.MeshBasicMaterial({ map: t }); })();
  const bale = (R = .55, L = 1.1) => { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 14).rotateZ(Math.PI / 2), [hayM, hayEnd, hayEnd]); b.position.y = R; b.castShadow = true; g.add(b); g.userData.R = R; return g; };
  // the banner
  { const p = at(.995, 0), w = W + .6, tx = cv(96, 12, g => { for (let x = 0; x < 96; x += 4) for (let y = 0; y < 12; y += 4) { g.fillStyle = ((x + y) / 4) % 2 ? '#17181b' : '#f6f3ea'; g.fillRect(x, y, 4, 4); } g.fillStyle = WIES ? '#8e5a2e' : '#cf5a3e'; g.fillRect(12, 1, 72, 10); g.fillStyle = '#f6f3ea'; g.font = '8px PTPix'; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText(WIES ? 'WIEJSKI FINAŁ' : 'FINAŁOWA PROSTA', 48, 2); });
    for (const sd of [-1, 1]) { const q = at(.995, sd * w), post = new THREE.Mesh(new THREE.BoxGeometry(.16, 4.6, .16).translate(0, 2.3, 0), postM); post.position.set(q.x, q.y, q.z); FIN.G.add(post); }
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 2, .7, .06), new THREE.MeshBasicMaterial({ map: tx })); b.position.set(p.x, p.y + 4.3, p.z); b.rotation.y = p.yaw; FIN.G.add(b); }
  // the slalom
  const slalom = (u0, n, gap, off) => { for (let k = 0; k < n; k++) { const q = at(u(u0) - k * gap, (k % 2 ? 1 : -1) * off);
    if (WIES) { const m = bale(); m.position.set(q.x, q.y, q.z); m.rotation.y = q.yaw; FIN.G.add(m); FIN.cones.push({ m, x: q.x, z: q.z, down: false, t: 0, ax: 0, az: 0, bale: true, vx: 0, vz: 0, i: q.i }); continue; }
    const m = new THREE.Mesh(new THREE.ConeGeometry(.28, .75, 8).translate(0, .375, 0), coneM), band = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .1, 8).translate(0, .42, 0), bandM);
    m.add(band); m.position.set(q.x, q.y, q.z); FIN.G.add(m); FIN.cones.push({ m, x: q.x, z: q.z, down: false, t: 0, ax: 0, az: 0 }); } };
  slalom(.95, 6, 7, 1.1); slalom(.5, 6, 5, 1.5);
  // an arrow pad: chevrons on the road, a push forward
  const arrowT = cv(16, 16, g => { g.fillStyle = '#efc970'; for (let k = 0; k < 2; k++) for (let y = 0; y < 6; y++) { g.fillRect(4 + y - 0, 2 + k * 7 + y, 2, 1); g.fillRect(10 - y, 2 + k * 7 + y, 2, 1); } });
  const pad = m => { const q = at(m, 0), o = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: arrowT, transparent: true })); o.position.set(q.x, q.y + .03, q.z); o.rotation.y = q.yaw + Math.PI; FIN.G.add(o); FIN.pads.push({ q, used: false, o }); };
  pad(.8); pad(.55); pad(.03);
  // a kicker, a trench after it (planks at its edges, a striped board each side), another before the line (two of them, a gap between)
  const kicker = (m, size = 'kicker') => { const q = at(m, 0), o = track.props.ramp(Math.random, size); o.group.position.set(q.x, q.y, q.z); o.group.rotation.y = q.yaw; FIN.G.add(o.group); FIN.hits.push(track.addHit(o.group, o.hit, q.i));
    if (WIES) for (const sd of [-1, 1]) { const p2 = at(m, sd * 2.1), b = bale(.5, 1); b.position.set(p2.x, p2.y, p2.z); b.rotation.y = q.yaw + Math.PI / 2; FIN.G.add(b); } };   // (in the village: a bale each side of it)
  const stripes = cv(8, 2, g => { for (let x = 0; x < 8; x++) { g.fillStyle = x % 2 ? '#cf5a3e' : '#f6f3ea'; g.fillRect(x, 0, 1, 2); } }), stripeM = new THREE.MeshBasicMaterial({ map: stripes });
  // (a trench: across the whole road, or half of it (hw its half width, cx its middle off the road's): to ride round or to jump)
  const trench = (m, len = 3.2, hw = W, cx = 0) => { const q = at(m, 0), g = new THREE.Group(); g.position.set(q.x, q.y, q.z); g.rotation.y = q.yaw; const k = -1;   // (the group's x is the road's right reversed)
    // (seen from afar: light dug earth round a black hole, yellow and black edges, a cone at each corner)
    const pit = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, .05, len), M(WIES ? '#5d4a30' : '#8a6a44')); pit.position.set(cx * k, .03, 0); g.add(pit); const deep = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 - .5, .04, len - .6), WIES ? new THREE.MeshBasicMaterial({ color: '#3f6f86' }) : M('#050403')); deep.position.set(cx * k, .05, 0); g.add(deep);
    const hz = cv(8, 2, g2 => { for (let x = 0; x < 8; x++) { g2.fillStyle = (x >> 1) % 2 ? '#17181b' : '#efc930'; g2.fillRect(x, 0, 1, 2); } }), hzM = new THREE.MeshBasicMaterial({ map: hz });
    for (const z of [-len / 2, len / 2]) { const e = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, .14, .2), WIES ? wood : hzM); e.position.set(cx * k, .08, z); g.add(e); }
    if (WIES) { const reed = M('#5f7a3a'); for (let n = 0; n < 14; n++) { const h2 = .5 + Math.random() * .5, rd = new THREE.Mesh(new THREE.BoxGeometry(.04, h2, .04), reed); rd.position.set((cx + (Math.random() - .5) * 2 * (hw - .2)) * k, h2 / 2, (Math.random() < .5 ? -1 : 1) * (len / 2 + .15)); rd.rotation.z = (Math.random() - .5) * .3; g.add(rd); } }   // (a ditch: water at its bottom, reeds on its banks)
    for (const sx of [-1, 1]) for (const z of [-len / 2 - .35, len / 2 + .35]) { const c0 = WIES ? bale(.3, .55) : new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 8).translate(0, .3, 0), coneM); c0.position.set((cx + sx * (hw - .15)) * k, 0, z); g.add(c0); }
    for (const sd of [-1, 1]) { const x = (cx + sd * (hw + .25)) * k, b = new THREE.Mesh(new THREE.BoxGeometry(.05, .3, len + .6), stripeM); b.position.set(x, .55, 0); g.add(b); for (const z of [-len / 2 - .3, len / 2 + .3]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(.08, .7, .08), postM); p2.position.set(x, .35, z); g.add(p2); } }
    FIN.G.add(g); FIN.trenches.push({ q, len, hw, cx, done: false }); };
  kicker(.87, 'plank'); kicker(.83, 'kicker'); kicker(.77, 'plank'); trench(u(.77) - 5, 1.8, W * .55, -W * .45); kicker(.15, 'kicker'); trench(u(.15) - 6, 2);
  // the targets: big boards on posts by the road (red and white rings), pop-ups lying flat till you come, one swinging over the road
  const ring = cv(16, 16, g => { const C = [['#cf5a3e', 8], ['#f6f3ea', 6.2], ['#cf5a3e', 4.4], ['#f6f3ea', 2.6], ['#17181b', 1.2]]; for (const [c, r] of C) { g.fillStyle = c; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x - 7.5, y - 7.5) < r) g.fillRect(x, y, 1, 1); } }), ringM = new THREE.MeshBasicMaterial({ map: ring });
  const board = r => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .08, 20).rotateX(Math.PI / 2), [wood, ringM, ringM]); return b; };
  const target = (m, sd, kind = 'post') => { const q = at(m, sd * (W + 1.5)), t = new THREE.Group(), r = kind === 'post' ? .95 : .8; t.position.set(q.x, q.y, q.z); t.rotation.y = q.yaw + Math.PI / 2;
    const hinge = new THREE.Group(); t.add(hinge); if (kind === 'post') { t.add(new THREE.Mesh(new THREE.BoxGeometry(.12, 1.6, .12).translate(0, .8, 0), wood)); const b = board(r); b.position.y = 2.1; hinge.add(b); }
    else { const b = board(r); b.position.y = r + .1; hinge.add(b); hinge.add(new THREE.Mesh(new THREE.BoxGeometry(.1, r + .1, .1).translate(0, (r + .1) / 2, 0), wood)); hinge.rotation.z = -Math.PI / 2 * sd; }
    FIN.G.add(t); FIN.targets.push({ t, hinge, kind, r, c: new THREE.Vector3(q.x, q.y + (kind === 'post' ? 2.1 : r + .1), q.z), hit: false, spin: 0, up: kind === 'post', upT: 0, sd, pay: kind === 'post' ? 5 : 7 }); };
  // on the estate (Druga strona): a site container by the road near the end, a ring on its doors (+5 / +2), a skip for rubble beside it (a paper in: +6)
  if (track.region === 'peryferia2') { const sd = Math.random() < .5 ? -1 : 1, q = at(.13, sd * (W + 6.5)), face = new THREE.Vector3(at(.13, 0).x, 0, at(.13, 0).z), y0 = track.probe(q.x, q.z, q.i).y;
    const cont = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 6.2), M('#34465a')); cont.position.set(q.x, y0 + 1.35, q.z); cont.rotation.y = q.yaw; cont.castShadow = true; FIN.G.add(cont);
    const doorP = new THREE.Vector3(q.x, y0 + 1.5, q.z).addScaledVector(new THREE.Vector3(face.x - q.x, 0, face.z - q.z).normalize(), 1.32);
    const ringT = cv(32, 32, g => { const C = [['#f4f1e8', 16], ['#e3b22e', 13], ['#17181b', 10], ['#e3b22e', 7], ['#cf5a3e', 4]]; for (const [c0, r0] of C) { g.fillStyle = c0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - 15.5, y - 15.5) < r0) g.fillRect(x, y, 1, 1); } });
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: ringT, transparent: true, alphaTest: .5 })); rg.position.copy(doorP); rg.lookAt(face.x, doorP.y, face.z); FIN.G.add(rg);
    const skP = at(.21, sd * (W + 4.2)), sk = new THREE.Group(), skM = M('#e3742e'); sk.position.set(skP.x, track.probe(skP.x, skP.z, skP.i).y, skP.z); sk.rotation.y = skP.yaw; FIN.G.add(sk);
    for (const [w0, h0, d0, x, y, z] of [[2, .1, 3, 0, .05, 0], [.1, 1, 3, -1, .55, 0], [.1, 1, 3, 1, .55, 0], [2, 1, .1, 0, .55, -1.5], [2, 1, .1, 0, .55, 1.5]]) { const o = new THREE.Mesh(new THREE.BoxGeometry(w0, h0, d0), skM); o.position.set(x, y, z); o.castShadow = true; sk.add(o); }
    const rub = new THREE.Mesh(new THREE.BoxGeometry(1.8, .4, 2.8), M('#8a867e')); rub.position.y = .35; sk.add(rub);
    const dummy = new THREE.Group(); dummy.add(new THREE.Group());
    for (const [c0, r0, pay, label] of [[doorP, .4, 5, 'W ŚRODEK!'], [doorP, 1.15, 2, 'W KONTENER!'], [new THREE.Vector3(skP.x, sk.position.y + 1, skP.z), .95, 6, 'DO GRUZU!']]) FIN.targets.push({ t: cont, hinge: dummy, kind: 'barn', r: r0, c: c0.clone(), hit: false, spin: 0, up: true, sd: 0, pay, label, stick: true }); }
  // the barn (in the village), by the road near the end: a ring painted on its wall (its middle +5, the rest +2), the loft's window +8
  if (WIES) { const sd = Math.random() < .5 ? -1 : 1, q = at(.13, sd * (W + 9.6)), bar = new THREE.Group(), baseY = Math.min(...[[-3.5, W + 7], [3.5, W + 7], [-3.5, W + 12.2], [3.5, W + 12.2]].map(([al, d]) => { const p0 = at(.13, sd * d); return track.probe(p0.x + q.f.x * al, p0.z + q.f.z * al, p0.i).y; })); bar.position.set(q.x, baseY, q.z); bar.rotation.y = q.yaw; FIN.G.add(bar);
    const barnM = M('#8e2e25'), trim = M('#f4f1e8'), roofM = M('#4a4e55'), bb = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; bar.add(o); return o; };
    bb(5.2, 5, 7, barnM, 0, 2.5, 0); bb(5.4, 3, 7.2, M('#8a857a'), 0, -1.45, 0);   // (a stone footing under it, down into the ground where it falls away)
    for (const s2 of [-1, 1]) { const rf = bb(3.3, .16, 7.4, roofM, s2 * 1.35, 5.75, 0); rf.rotation.z = -s2 * .62; } bb(5.25, .14, 7.05, trim, 0, 5.02, 0);
    const wallAt = (al, y) => { const p2 = at(.13, sd * (W + 6.96)), f2 = q.f; return new THREE.Vector3(p2.x + f2.x * al, baseY + y, p2.z + f2.z * al); }, face = new THREE.Vector3(at(.13, 0).x, 0, at(.13, 0).z);
    const ringT = cv(32, 32, g => { const C = [['#f4f1e8', 16], ['#cf5a3e', 13], ['#f4f1e8', 10], ['#cf5a3e', 7], ['#efc970', 4]]; for (const [c0, r0] of C) { g.fillStyle = c0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - 15.5, y - 15.5) < r0) g.fillRect(x, y, 1, 1); } });
    const plane = (w, h, mat, P) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); o.position.copy(P); o.lookAt(face.x, P.y, face.z); FIN.G.add(o); return o; };
    const ringC = wallAt(-.6, 1.9), loftC = wallAt(-.6, 4.15); plane(2.6, 2.6, new THREE.MeshBasicMaterial({ map: ringT, transparent: true, alphaTest: .5 }), ringC);
    plane(1.1, 1.1, trim, loftC); plane(.9, .9, new THREE.MeshBasicMaterial({ color: '#17181b' }), loftC.clone().addScaledVector(new THREE.Vector3(face.x - loftC.x, 0, face.z - loftC.z).normalize(), .01));
    const dummy = new THREE.Group(); dummy.add(new THREE.Group());
    for (const [c0, r0, pay, label] of [[ringC, .42, 5, 'W ŚRODEK!'], [ringC, 1.3, 2, 'W STODOŁĘ!'], [loftC, .5, 8, 'NA STRYCH!']]) FIN.targets.push({ t: bar, hinge: dummy, kind: 'barn', r: r0, c: c0.clone(), hit: false, spin: 0, up: true, sd: 0, pay, label, stick: true }); }
  target(.7, 1); target(.66, -1, 'pop'); target(.62, 1, 'pop'); target(.4, -1); target(.21, 1); target(.17, -1, 'pop'); target(.08, 1, 'pop'); target(.06, -1, 'pop');
  // the swinging one: a frame over the road, the board on a rope, to and fro
  for (const su of [.58, .25]) { const q = at(su, 0), g = new THREE.Group(); g.position.set(q.x, q.y, q.z); g.rotation.y = q.yaw; for (const sd of [-1, 1]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(.18, 5.2, .18).translate(0, 2.6, 0), dark); p2.position.x = sd * (W + .5); g.add(p2); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 1.2, .18, .18), dark); bar.position.y = 5.1; g.add(bar); const sw = new THREE.Group(); sw.position.y = 5.0; g.add(sw);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.6, .03).translate(0, -.8, 0), M('#c9b77a')); sw.add(rope); const b = board(.75); b.rotation.y = Math.PI / 2; b.position.y = -2.3; sw.add(b);
    FIN.G.add(g); FIN.targets.push({ t: g, hinge: sw, kind: 'swing', r: .75, c: new THREE.Vector3(q.x, q.y + 2.7, q.z), hit: false, spin: 0, up: true, sd: 0, pay: 10, q, board: b }); }
  // the second kicker and the golden rings in the air after it
  kicker(.36, Math.random() < .5 ? 'mega' : 'big');   // (now and then the mega one: the rings after it hang the same, a higher flight through them)
  for (let k = 0; k < 5; k++) { const q = at(u(.36) - 7 - k * 3.2, 0), o = new THREE.Mesh(new THREE.TorusGeometry(.7, .09, 6, 16), gold); o.position.set(q.x, q.y + 2.4 + Math.sin(k / 4 * Math.PI) * .7, q.z); o.rotation.y = q.yaw; FIN.G.add(o); FIN.rings.push({ o, got: false }); }
  // the double trench, a gap of road between; pop-ups both sides; a pad to the line
  kicker(.46, 'plank'); trench(u(.3), 2, W * .6, W * .4); trench(u(.3) - 5, 2, W * .6, -W * .4);
  FIN.on = true; FIN.entered = false; FIN.combo = 0; FIN.comboT = 0; FIN.res = { targets: 0, of: FIN.targets.length, cones: 0, rings: 0, trenches: 0, combo: 0, score: 0 }; }
// a parked car's roof under (x, z): its height, or null
function carRoofAt(x, z) { let y = null; for (const C of track.near(B.hint)) if (C.car && C.roof && !C.used && boxHit(C, x, z, 0)) y = Math.max(y ?? -1e9, C.roof); return y; }
// ---------- the far people not drawn: every person is ~9 skinned meshes (~40 thousand triangles, skinned again for the shadow); beyond
// 60 m one is a few pixels in this picture. Each such mesh goes to layer 1 (the camera and the shadow draw layer 0 only), back near.
// The list (all skinned meshes but his own) refreshed now and then; nothing else about them changes ----------
// the footsteps on foot: one each stride (longer and a little louder running), softer and scuffier on grass
let stepAcc = 0; function stepSteps(dt) { const me = foot.me; if (!me || me.air || foot.fighting && !me.vf) { stepAcc = 0; return; } const sp = Math.abs(me.vf || 0); if (sp < .4) { stepAcc = Math.min(stepAcc, .3); return; }
  const run = sp > 3, stride = run ? 1.15 : .72; stepAcc += sp * dt; if (stepAcc < stride) return; stepAcc -= stride; const q = track.probe(me.x, me.z, me.hint ?? B.hint), grass = Math.abs(q.d) > track.ROAD + .4 && !(Math.abs(q.d) > 4.9 && Math.abs(q.d) < track.PAVE + .1);
  audio.play('step', { vol: (run ? .07 : .045) * (grass ? .8 : 1), grass }); }
const BOOT = { drawn: false };   // (the loader in index.html: away once the first frames are in and the shaders made)
const CULL = { t: 0, list: [], listT: 0, own: new Set() };
function cullPeople(dt) { if ((CULL.t -= dt) > 0) return; CULL.t = .25; if ((CULL.listT -= .25) <= 0) { CULL.listT = 3; CULL.own.clear(); rider.root.traverse(o => CULL.own.add(o)); if (net.on) P2.rider.root.traverse(o => CULL.own.add(o)); CULL.list = []; scene.traverse(o => { if (o.isSkinnedMesh && !CULL.own.has(o)) CULL.list.push(o); }); }
  const cp = camera.position, far = (foot.active && foot.view === 'first') ? 45 : 60, v = _cullV;
  for (const o of CULL.list) { o.getWorldPosition(v); const near = (v.x - cp.x) ** 2 + (v.z - cp.z) ** 2 < far * far; if (near !== (o.layers.mask === 1)) o.layers.set(near ? 0 : 1); } }
const _cullV = new THREE.Vector3();
function finScore(n, at, label) { FIN.combo = FIN.comboT > 0 ? FIN.combo + 1 : 1; FIN.comboT = 3; const k = Math.min(3, FIN.combo), v = n * k; FIN.res.score += v; FIN.res.combo = Math.max(FIN.res.combo, k);
  audio.play(k > 1 ? 'trick' : 'coin'); hud.pop(at, `${label} +${v}${k > 1 ? ' x' + k : ''}`, k > 1 ? '#efc970' : '#9fd27a'); }
function stepFinale(dt) { if (!FIN.on || !LV) return; const me = foot.active ? foot.me : B; FIN.t += dt; FIN.comboT -= dt;
  const near = (p, m) => Math.hypot(me.x - p.x, me.z - p.z) < m;
  if (!FIN.entered && FIN.cones[0] && near(FIN.cones[0], 30)) { FIN.entered = true; flash(track.region === 'wies' ? 'Wiejski finał! Slalom między belami, rowy do przeskoczenia, tarcze i stodoła: kombo mnoży!' : 'Finałowa prosta! Slalom, wykopy do przeskoczenia, tarcze i obręcze: kombo mnoży!'); }
  for (const c of FIN.cones) if (c.bale) { const R = c.m.userData.R;
    if (c.down) { const sp = Math.hypot(c.vx, c.vz); if (sp > .05) { c.x += c.vx * dt; c.z += c.vz * dt; const k2 = Math.exp(-dt * .9); c.vx *= k2; c.vz *= k2; const q2 = track.probe(c.x, c.z, c.i); c.i = q2.i; c.m.position.set(c.x, q2.y, c.z); c.m.rotation.y = Math.atan2(c.vx, c.vz); c.m.children[0].rotation.x += sp * dt / R; } continue; }
    if (near(c, .85) && !foot.active) { c.down = true; const s0 = Math.max(3, Math.abs(B.v) * 1.1); c.vx = Math.sin(B.yaw) * s0; c.vz = Math.cos(B.yaw) * s0; FIN.res.cones++; FIN.combo = 0; audio.play('kick', { vol: .5 }); B.v *= .7; B.jolt = .1; } }
  for (const c of FIN.cones) { if (c.bale) continue; if (c.down) { c.t = Math.min(1, c.t + dt * 4); c.m.rotation.x = c.ax * c.t * 1.5; c.m.rotation.z = c.az * c.t * 1.5; continue; } if (near(c, .6)) { c.down = true; c.ax = Math.cos(B.yaw); c.az = -Math.sin(B.yaw); FIN.res.cones++; FIN.combo = 0; audio.play('pick', { vol: .5 }); B.v *= .85; } }
  for (const P of FIN.pads) if (!P.used && near(P.q, 1.6) && !foot.active) { P.used = true; B.v = Math.min(B.v + 3.5, 13); audio.play('trick', { vol: .5 }); flash('Strzała! Szybciej!'); setTimeout(() => { P.used = false; }, 4000); }
  // the trenches: over one on the ground, a fall; in the air: cleared
  for (const T of FIN.trenches) { const dx = me.x - T.q.x, dz = me.z - T.q.z, al = dx * T.q.f.x + dz * T.q.f.z, ac = dx * T.q.r.x + dz * T.q.r.z;
    T.cool = Math.max(0, (T.cool || 0) - dt);
    if (Math.abs(ac - T.cx) < T.hw && Math.abs(al) < T.len / 2 - .2 && !foot.active) { if (!B.air && !B.crash && Math.abs(B.v) > 2.5 && !T.cool) { crash(null); T.cool = 6; flash('Wykop! Trzeba było skoczyć (skocznia albo podskok)'); FIN.combo = 0; } else if (B.air && !T.done) { T.done = true; FIN.res.trenches++; finScore(2, new THREE.Vector3(me.x, (B.y || 0) + 2, me.z), 'PRZESKOK!'); } } }
  // the targets: a pop-up stands as you come, lies again after a while; the swinging one swings
  for (const T of FIN.targets) {
    if (T.kind === 'pop') { const d = Math.hypot(me.x - T.c.x, me.z - T.c.z); if (!T.up && !T.hit && d < 26) { T.up = true; T.upT = 0; audio.play('ui', { vol: .4 }); } if (T.up) T.upT += dt; const want = T.up && (T.upT < 5 || T.hit) ? 0 : -Math.PI / 2 * T.sd; T.hinge.rotation.z += (want - T.hinge.rotation.z) * Math.min(1, dt * 10); if (T.upT >= 5 && !T.hit) T.up = false; }
    if (T.kind === 'swing') { const a = Math.sin(FIN.t * 1.6) * .75; T.hinge.rotation.x = a; T.board.getWorldPosition(T.c); }
    if (T.hit) { if (T.kind === 'barn') continue; T.spin += dt * 9; (T.kind === 'swing' ? T.board : T.hinge.children[T.kind === 'post' ? 0 : 0]).rotation.z = T.spin; continue; }
    if (!T.up && T.kind === 'pop') continue;
    for (const p of papers) if (!p.landed && p.m.position.distanceTo(T.c) < T.r + .25) { T.hit = true; FIN.res.targets++; if (T.stick) { p.landed = true; p.v.set(0, -1, 0); } finScore(T.pay, T.c.clone().setY(T.c.y + .8), T.label || (T.kind === 'swing' ? 'W WAHADŁO!' : 'TARCZA!')); break; }
    // a bale rolling (in the village): into a target by the road, it counts too
    if (!T.hit && (T.kind === 'post' || T.kind === 'pop') && T.up) for (const c of FIN.cones) if (c.bale && c.down && Math.hypot(c.vx, c.vz) > 1 && Math.hypot(c.x - T.c.x, c.z - T.c.z) < T.r + .8) { T.hit = true; FIN.res.targets++; finScore(T.pay + 3, T.c.clone().setY(T.c.y + .8), 'BELĄ W TARCZĘ!'); break; } }
  // the rings: through one in the air
  for (const R of FIN.rings) { R.o.rotation.z += dt * 2; if (R.got) { R.o.scale.multiplyScalar(Math.max(0, 1 - dt * 4)); continue; } const p = new THREE.Vector3(me.x, (B.y || 0) + 1, me.z); if (p.distanceTo(R.o.position) < 1.1) { R.got = true; FIN.res.rings++; finScore(3, R.o.position.clone().setY(R.o.position.y + .6), 'OBRĘCZ!'); } } }
function logEv(kind, x, z, more) { if (!LV || RUN.done) return; const e = { kind, x, z, t: RUN.t, ...more }; if (!(RUN.log ||= []).some(q => q.kind === kind)) (RUN.snaps ||= []).push({ e, at: RUN.t + (kind === 'dog' ? .2 : .5) }); RUN.log.push(e); }
function stepRun(dt) { if (LV && (modes.id || mp.on)) { LV = null; clearGate(); lvHud.classList.remove('on'); } if (!LV || RUN.done) return; const me = foot.active ? foot.me : B;
  if (!RUN.go && Math.abs(foot.active ? foot.me.vf || 0 : B.v) > .5) RUN.go = true; if (RUN.go) RUN.t += dt;
  { const chased = barkers.some(n => n.dist < 6 && Math.abs(B.v) > 1); if (chased && !RUN.dogOn && RUN.t - (RUN.dogT ?? -99) > 6) { logEv('dog', B.x, B.z); RUN.dogT = RUN.t; } RUN.dogOn = chased; }
  { const g = !!quests.gang?.chase, sr = !!quests.siren; if (g && !RUN.gangOn) logEv('gang', B.x, B.z); if (sr && !RUN.sirenOn) logEv('chase', B.x, B.z); RUN.gangOn = g; RUN.sirenOn = sr; }
  { const st = quests.police?.stops || 0; if (st > (RUN.stops ?? st)) logEv('police', B.x, B.z); RUN.stops = st; RUN.maxStreak = Math.max(RUN.maxStreak || 0, B.streak || 0); }
  if (RUN.snaps?.length && RUN.t >= RUN.snaps[0].at) { const q = RUN.snaps.shift(); try { q.e.img = photo(camera); } catch { } }
  stepLive(dt); stepFinale(dt);
  if ((RUN.chk -= dt) > 0) return; RUN.chk = .1; stepJobs();
  const q = track.probe(me.x, me.z, B.hint), cp = RUN.cps[RUN.cp], a = ahead(q.i, cp), last = RUN.cp === RUN.cps.length - 1;
  const onRoad = Math.abs(q.d) < track.PAVE + 2 && !foot.active, passed = onRoad && (a < 3 || (RUN.prevA < 25 && a > track.len - 25)) && Math.hypot(me.x - track.S[cp].p.x, me.z - track.S[cp].p.z) < track.PAVE + 14; RUN.prevA = onRoad ? a : 1e9;
  if (passed) { RUN.cp++; RUN.minA = Infinity; RUN.prevA = 1e9; if (RUN.cp >= RUN.cps.length) { finishLevel(); return; } audio.play('pick'); flash(last ? 'Meta!' : `Punkt ${RUN.cp} z ${RUN.cps.length - 1} zaliczony`); if (!last) radioSay('check'); }
  let rest = ahead(q.i, RUN.cps[RUN.cp]); for (let k = RUN.cp + 1; k < RUN.cps.length; k++) rest += ahead(RUN.cps[k - 1], RUN.cps[k]);
  if (rest < 130 && !RAD.fin && RUN.go) { RAD.fin = true; radioSay('finish'); }
  const aNow = ahead(q.i, RUN.cps[RUN.cp]); if (onRoad) RUN.minA = Math.min(RUN.minA, aNow); const wrong = onRoad && aNow > RUN.minA + 25;
  lvHud.innerHTML = `<b>${LV.name}</b><span>${mmss(RUN.t)}</span><span>${wrong ? '<span class="w">ZAWRÓĆ: META W DRUGĄ STRONĘ</span>' : `META ${Math.round(rest)} M`}</span><span>GAZETY ${B.delivered || 0}/${LV.goal.papers}</span>${LV2.cur ? `<span class="live">☎ ${LV2.cur.kind === 'parcel' && !LV2.cur.got ? 'PACZUSZKA NA DRODZE' : JB.PERSONAS[LV2.cur.who]?.name.toUpperCase()} · ${Math.ceil(LV2.cur.left)} S</span>` : ''}${JOBRUN.filter(q => !q.done).map(q => `<span class="job">▸ ${JB.lineOf(q.j)}${q.door ? ' ' + Math.round(Math.hypot(me.x - q.door.p.x, me.z - q.door.p.z)) + ' M' : ''}</span>`).join('')}`; }
function finishLevel() { for (const R of JOBRUN) if (!R.done && R.j.kind === 'wyscig') jobEnd(R, RUN.t <= R.limit); RUN.done = true; const L = LV, wasOpen = new Set(LVM.LEVELS.filter(l => LVM.isOpen(l.id)).map(l => l.id));
  const r = { time: RUN.t, delivered: B.delivered || 0, thrown: B.thrown || 0, acc: B.thrown ? (B.delivered || 0) / B.thrown : 0, falls: B.falls || 0, earned: B.earned || 0, windows: B.windows || 0 };
  const before = LVM.starsOf(L.id), rec = LVM.record(L, r), opened = LVM.LEVELS.filter(l => LVM.isOpen(l.id) && !wasOpen.has(l.id)).map(l => l.soon ? l.name + ' (WKRÓTCE)' : l.name); saveCampaign();
  const got = LVM.rewardsFor(L.id, before, rec.best.stars), bonus = Math.round((B.earned || 0) * LVM.modBonus(RUN.mods || [])), inc = LVM.income();
  for (const g of got) { if (g.cash) B.points += g.cash; if (g.part) shop.grant(g.part[0], g.part[1]); g.name = g.cash ? `${g.cash} ZŁ` : partLabel(g.part[0], g.part[1]); }
  const FR = FIN.res || { targets: 0, of: 0, cones: 0, score: 0 }, finB = (FR.score || 0) + (FR.of && !FR.cones ? 5 : 0); B.points += bonus + inc + finB; const pay = { finale: { ...FR, bonus: finB }, earned: B.earned || 0, bonus, mods: (RUN.mods || []).map(id => LVM.MODS.find(m => m.id === id)?.t).filter(Boolean), income: inc, regulars: LVM.regulars(), got };
  for (const R of JOBRUN) if (!R.done && R.j.kind === 'szarlotka' && (R.j.runs = (R.j.runs || 0) + 1) >= 2) jobEnd(R, false);
  { const S = LVM.load(); for (const j of S.jobs || []) { const R = JOBRUN.find(q => q.j.id === j.id); if (R) j.runs = R.j.runs; } LVM.save(); }
  LVM.save({ mods: [] }); saveCampaign();
  audio.play('trick'); slowmo = .9; shutter(); const data = paperData(L, r, rec, opened); data.pay = pay; data.money = B.points; { const S = LVM.load(); data.jobRes = S.jobRes || []; data.shots = RUN.shots || []; S.jobRes = []; LVM.save(); } data.faces = Object.fromEntries(Object.entries(JB.PERSONAS).map(([k, p]) => [k, faceOf(p.face)])); setTimeout(() => { B.v *= .3; clearFinale(); fin.open(data); }, 1100); }
// the finish's flash: the screen white a blink, the shutter's click
function shutter() { const f = document.createElement('div'); f.style.cssText = 'position:fixed;inset:0;z-index:8;background:#fff;pointer-events:none;opacity:.9;transition:opacity .5s steps(4)'; document.body.appendChild(f); audio.play('ui'); requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = '0'; })); setTimeout(() => f.remove(), 700); }
// the paper's look for its photos: one of the game's own overlays (the look panel's: comic dots, pencil, riso, 1 bit), put on for the
// shot only, then the look as it was
const PHOTO_LOOK = { komiks: { mode: 2, fxAmt: 1, comicDot: 4, comicAngle: 45, comicInk: 1.3, comicShade: .55 }, olowek: { mode: 4, fxAmt: 1, pencilGap: 4, pencilStr: .9, pencilColor: 0, pencilPaper: 0 },
  bit: { mode: 6, fxAmt: 1, bitScale: 1, bitSet: 3 }, riso: { mode: 5, fxAmt: 1, risoMis: 1, risoDot: 3.5, risoInks: 2 } };
let photoStyle = 'olowek';
function lookFor(over) { const u = px.uniforms, L = lookUniforms({ ...look.S, ...over }); u.mode.value = L.mode; u.fx.value = L.fx; u.p1.value = L.p[0]; u.p2.value = L.p[1]; u.p3.value = L.p[2]; u.p4.value = L.p[3]; u.inkA.value.set(...L.ink[0]); u.inkB.value.set(...L.ink[1]); u.inkC.value.set(...L.ink[2]); }
// a photo for the paper: the world through a camera put there, as the game draws it (its own pixels, under the paper's overlay), cut to 4:3
function photo(cam, st = photoStyle, sc = scene) { if (st && PHOTO_LOOK[st]) lookFor(PHOTO_LOOK[st]); px.render(sc, cam); if (st && PHOTO_LOOK[st]) lookFor({}); const [W, H] = px.size, c = document.createElement('canvas'), w = Math.min(W, Math.round(H * 4 / 3)), h = Math.round(w * 3 / 4); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const sw = renderer.domElement.width, sh = renderer.domElement.height, kx = sw / W, ky = sh / H;
  g.drawImage(renderer.domElement, (W - w) / 2 * kx, (H - h) / 2 * ky, w * kx, h * ky, 0, 0, w, h); return c; }
const nearSt = (x, z) => { let b = 0, bd = 1e18; for (let i = 0; i < track.N; i += 2) { const p = track.S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
function photoAt(x, z, y = .9) { const S0 = track.S[nearSt(x, z)], cam = new THREE.PerspectiveCamera(46, camera.aspect, .1, camera.far), gy = track.probe(x, z, nearSt(x, z)).y;
  cam.position.set(x - S0.f.x * 8 + S0.r.x * 2.5, gy + 3.2, z - S0.f.z * 8 + S0.r.z * 2.5); cam.lookAt(x, gy + y, z); return photo(cam); }
function photoOf(label) { if (label === 'dom') { const hp = hoops?.hoop?.position || track.start; return photoAt(hp.x ?? track.start.x, hp.z ?? track.start.z, 1.6); }
  const all = (track.show?.shacks || []).filter(q => q.label === label); if (!all.length) return null; const o = all[Math.random() * all.length | 0].o, P = o.getWorldPosition(new THREE.Vector3()), S0 = track.S[nearSt(P.x, P.z)].p;
  const d = new THREE.Vector3(S0.x - P.x, 0, S0.z - P.z), far = d.length(); d.normalize(); const cam = new THREE.PerspectiveCamera(44, camera.aspect, .1, camera.far), back = Math.min(16, Math.max(10, far + 3));
  cam.position.set(P.x + d.x * back + d.z * 2, P.y + 3.4, P.z + d.z * back - d.x * 2); cam.lookAt(P.x, P.y + 1.6, P.z); return photo(cam); }
// a portrait for the paper: the person's face as the game draws them (a camera before the head), or Janusz from his picture; printed
const JIMG = new Image(); JIMG.src = 'assets/ui/janusz.png'; const ZIMG = new Image(); ZIMG.src = 'assets/ui/npc/zaneta.webp';
// the portrait studio: a copy of the person (as they stand now) alone before a plain wall, lit from the front, the camera at their face;
// Janusz from his picture. Each through the paper's overlay, as the photos
const STUDIO = (() => { const sc = new THREE.Scene(); sc.background = new THREE.Color('#d9d0b8'); sc.add(new THREE.HemisphereLight('#fff6e4', '#8a8070', 1.5)); const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(1.2, 2.2, 3); sc.add(d); return sc; })();
const FACES = { mama: 'mama', tata: 'tata', brat: 'brat', sasiadka: 'sasiadka', sasiad: 'sasiad', dzialki: 'dzialki', kapliczka: 'kapliczka', budowa: 'budowa', przyczepa: 'przyczepa', dogman: 'dogman' };
function faceOf(who) { if (who === 'janusz') { if (!JIMG.complete || !JIMG.naturalWidth) return null; const w = JIMG.naturalWidth, h = JIMG.naturalHeight, c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'); g.fillStyle = '#d8d0bc'; g.fillRect(0, 0, 96, 96); g.drawImage(JIMG, w * .29, h * .0, w * .42, w * .42, 0, 0, 96, 96); return printed(c, 64, 64); }
  if (who === 'img:zaneta') { if (!ZIMG.complete || !ZIMG.naturalWidth) return null; const w = ZIMG.naturalWidth, h = ZIMG.naturalHeight, c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'); g.fillStyle = '#d8d0bc'; g.fillRect(0, 0, 96, 96); g.drawImage(ZIMG, w * .3, h * .0, w * .42, w * .42, 0, 0, 96, 96); return printed(c, 64, 64); }
  const byKey = who.startsWith('key:') ? who.slice(4) : null; if (!FACES[who] && !byKey) return null; const R = (residents?.list || []).find(q => byKey ? q.key === byKey : who === 'dogman' ? q.key === 'dogman' : q.lines === who); if (!R?.head) return null;
  const G = SkeletonUtils.clone(R.G); G.position.set(0, 0, 0); G.rotation.set(0, 0, 0); G.visible = true; G.traverse(o => { o.visible = true; o.frustumCulled = false; o.layers.set(0); }); STUDIO.add(G); G.updateMatrixWorld(true);
  const hd = G.getObjectByName(R.head.name) || G, hp = hd.getWorldPosition(new THREE.Vector3()), cam = new THREE.PerspectiveCamera(24, camera.aspect, .1, 30);
  cam.position.set(hp.x + .3, hp.y + .1, hp.z + 1.45); cam.lookAt(hp.x, hp.y - .1, hp.z); const ph = photo(cam, photoStyle, STUDIO); STUDIO.remove(G);
  const sq = Math.min(ph.width, ph.height), c = document.createElement('canvas'); c.width = c.height = sq; const cg = c.getContext('2d'); cg.drawImage(ph, (ph.width - sq) / 2, (ph.height - sq) / 2, sq, sq, 0, 0, sq, sq);
  { const d = cg.getImageData(0, 0, sq, sq).data; let m = 0, m2 = 0, n = 0; for (let i = 0; i < d.length; i += 16) { const l = d[i] + d[i + 1] + d[i + 2]; m += l; m2 += l * l; n++; } m /= n; if (m2 / n - m * m < 900) return null; }
  return c; }
function paperData(L, r, rec, opened) { const iJ = track.startI, N = track.N, dir = L.finish.dir, span = Math.round(N * L.finish.to);
  const along = i => ((((i - iJ) * dir) % N) + N) % N, onWay = i => along(i) <= span + 4, S = track.S, st = track.start;
  const route = { loop: [], home: [], way: [], cps: RUN.cps.map(i => [S[i].p.x, S[i].p.z]), doors: [], wins: [], falls: (B.fallsAt || []).slice(), homeAt: [st.x, st.z], len: span * track.ds, subs: 0 };
  for (let i = 0; i < N; i += 3) route.loop.push([S[i].p.x, S[i].p.z]); for (let k = 0; k <= span; k += 3) { const i = ((iJ + dir * k) % N + N) % N; route.way.push([S[i].p.x, S[i].p.z]); }
  for (let k = 0; k <= 20; k++) route.home.push([st.x + (S[iJ].p.x - st.x) * k / 20, st.z + (S[iJ].p.z - st.z) * k / 20]);
  for (const d of track.doors) if (onWay(d.i)) { route.doors.push({ x: d.p.x, z: d.p.z, sub: !!d.sub || d.done, done: !!d.done }); if (d.sub || d.done) route.subs++; }
  for (const w of track.windows) if (w.broken) route.wins.push({ x: w.p.x, z: w.p.z });
  // the news: what happened (the two most telling, each at its place), else the town's own; then tomorrow's
  const log = RUN.log || [], count = k => log.filter(e => e.kind === k).length, ORDER = ['kick_granny', 'granny', 'gang', 'chase', 'kick_police', 'car', 'police', 'kick_gangm', 'kick_ped', 'window', 'kick_mailbox', 'kick_bike', 'dog', 'kick_dog', 'kick_car', 'rival_steal', 'rival_hit', 'train', 'barrier', 'tractor_paper', 'goose', 'kick_goose', 'goose_chase', 'goose_friend', 'trick'], news = [];
  for (const k of ORDER) { if (news.length >= 2) break; const n = count(k); if (!n) continue; const e = log.find(q => q.kind === k); news.push({ kind: k, ...eventNews(k, n, e.name), img: e.img || photoAt(e.x, e.z) }); }
  const pool = NEWS.slice().sort(() => Math.random() - .5); while (news.length < 2 && pool.length) { const n = pool.pop(), im = photoOf(n.spot); if (im) news.push({ ...n, img: im }); }
  for (const n of news) if (!n.img) { const f = pool.pop(); n.img = f ? photoOf(f.spot) : null; }
  const nexts = L.after.map(id => LVM.LEVEL(id)).filter(Boolean), T = nexts.find(l => l.tease)?.tease;
  const tease = T ? { head: T.head, text: T.text, img: photoOf(T.spot) } : null; if (!T) { const n = pool.pop(); if (n) news.push({ ...n, img: photoOf(n.spot) }); }
  // the briefs: what else happened; a couple of the town's own
  const used = new Set(news.map(n => n.head)), briefs = [];
  for (const k of ORDER) { const n = count(k); if (!n) continue; const e = eventNews(k, n, log.find(q => q.kind === k)?.name); if (news[0]?.kind !== k) briefs.push(e.head.replace(/[^.!?]$/, '$&.')); }
  briefs.splice(3);
  for (const n of NEWS.slice().sort(() => Math.random() - .5)) { if (briefs.length >= 3) break; if (!used.has(n.head)) briefs.push(n.head.replace(/[^.!?]$/, '$&.')); }
  // who is interviewed: whoever the morning was about (the dog's owner after a chase, the neighbour after a window, mum after falls,
  // the brother after a clean run), else anyone; the anecdote from someone else
  const pickWho = count('dog') ? 'dogman' : count('window') ? 'sasiadka' : r.falls >= 2 ? 'mama' : (!r.falls && r.delivered >= L.goal.papers) ? 'brat' : ['janusz', 'brat', 'mama', 'tata', 'sasiadka', 'sasiad', 'dzialki', 'kapliczka', 'budowa'][Math.random() * 9 | 0];
  const iv = { who: pickWho, img: faceOf(pickWho) }; const anPool = ANECDOTES.filter(a => a.who !== pickWho), an0 = anPool[Math.random() * anPool.length | 0], an = an0 ? { ...an0, img: faceOf(an0.who) } : null;
  const WHO = { stop: 'Pan z przystanku', shacks: 'Ktoś zza płotu', lump: 'Pan spod sklepu', trzepak: 'Dzieciak spod trzepaka', przyczepa: 'Pan z przyczepy', budowa: 'Robotnik z budowy', dzialki: 'Działkowiec', kapliczka: 'Pani spod kapliczki', sasiad: 'Sąsiad z ogrodem', sasiadka: 'Sąsiadka zza płotu', mama: 'Mama', tata: 'Tata', brat: 'Brat' };
  const heard = []; for (const e of log) if (e.kind === 'said' && e.text && !heard.some(h => h.who === e.who) && heard.length < 3) heard.push({ who: e.who, text: e.text, name: CAST[e.who]?.who || WHO[e.who] || 'Ktoś przy drodze', img: faceOf(e.who) });
  const counts = {}; for (const e of log) counts[e.kind] = (counts[e.kind] || 0) + 1;
  for (const e of log) if (e.kind === 'live') briefs.unshift(`Telefon na trasie od: ${JB.PERSONAS[e.who]?.name || 'ktoś'}. ${e.ok ? 'Załatwione, +' + e.pay + ' zł.' : 'Nie zdążył.'}`);
  const winsOn = track.windows.filter(w => onWay(w.i)).length || 1, broken = track.windows.filter(w => w.broken && onWay(w.i)).length;
  const badges = badgesOf({ windows: r.windows, winPct: broken / winsOn, mailbox: counts.kick_mailbox || 0, ped: counts.kick_ped || 0, bikes: (counts.kick_bike || 0) + (counts.kick_gangm || 0), gang: counts.gang || 0, kmh: Math.round(trip.max * 3.6), streak: RUN.maxStreak || 0, tricks: counts.trick || 0, dog: counts.kick_dog || 0, granny: counts.kick_granny || 0, falls: r.falls, goalPapers: r.delivered >= L.goal.papers });
  // the town's stories of this issue (watki.js): a step on, a new one; the police's thread out of what you did
  const misdeeds = log.reduce((n, e) => n + (WT.MISDEED[e.kind] || 0), 0), Ssv = LVM.load(), adv = WT.advance(Ssv.threads, { region: track.region, misdeeds, clean: !misdeeds && !r.falls });
  LVM.save({ threads: adv.state }); const stories = adv.stories.map(q => ({ ...q, img: q.spot ? photoOf(q.spot) : null, faceImg: q.face ? faceOf(q.face) : null }));
  for (const q of stories) if (q.id === 'sprawca' && !q.img) { const e = log.find(x => WT.MISDEED[x.kind]); q.img = e?.img || (e ? photoAt(e.x, e.z) : null); }
  const fin0 = photo(camera);
  const next = nexts.map((l, k) => ({ id: l.soon ? null : l.id, name: l.name + (l.soon ? ' (WKRÓTCE)' : ''), note: l.soon ? (LVM.REGIONS.find(q => q.id === l.region)?.note || l.note) : l.note, first: k === 0 })).filter(x => x.id || x.name);
  // Janusz's ads: parts not had yet, the cheapest first
  const parts = []; for (const k in PARTS) PARTS[k].tiers.forEach((t, i) => { if (i && t.price && myBike.parts[k] < i && !INV.some(p => p.k === k && p.tier === i) && !(k === 'lakier' && PAINTS.has(i))) parts.push({ k, i, name: t.name === PARTS[k].name ? t.name : `${PARTS[k].name}: ${t.name}`, t: 'WARSZTAT U JANUSZA', d: `${PARTS[k].name}: ${t.name.toLowerCase()}. ${t.note.charAt(0) + t.note.slice(1).toLowerCase()}`, price: t.price }); });
  parts.sort((a, b) => a.price - b.price);
  const issue = Object.values(LVM.load().best).reduce((n, b) => n + (b.runs || 0), 0) + 100;
  return { L, r, rec, opened, photos: { finish: fin0, news }, stories, heat: adv.state.heat, tease, briefs: briefs.slice(0, 3), iv, an, heard, counts, badges, janusz: faceOf('janusz'), coupon: LVM.load().coupon || null, route, next: next.filter(x => x.id).length ? next : next, parts: parts.slice(0, 2), table: LVM.LEVELS.filter(l => !l.soon).map(l => ({ name: l.name, stars: LVM.starsOf(l.id), best: LVM.bestOf(l.id), open: LVM.isOpen(l.id), on: l.id === L.id })), money: B.points, region: LVM.REGIONS.find(q => q.id === L.region)?.name || '', issue }; }
const fin = createPaper({ game: { JB,  jobs: () => LVM.load().jobs || [], slots: () => LVM.load().slots || 2, done: () => LVM.load().done || {}, owned: () => LVM.load().owned || {},
  takeJob: kind => { const S = LVM.load(), slots = S.slots || 2; S.jobs ||= []; if (S.jobs.some(j => j.kind === kind)) return { ok: false, msg: 'Już to masz w notesie.' }; if (S.jobs.length >= slots) return { ok: false, msg: 'Notes pełny. Najpierw załatw, co masz, albo kup większy u pani Heli.' }; const j = JB.take(kind); S.jobs.push(j); LVM.save(); return { ok: true, j }; },
  buy: kind => { const J = JB.JOBS[kind]; if (kind === 'notes') return fin.buyNotes(); const S = LVM.load(); S.owned ||= {}; if (J.item === 'sluchawka' && S.owned.sluchawka) return { ok: false, msg: 'Już masz. Drugiej nie sprzedam, bo by się kłóciły w uszach.' };
    if (B.points < J.cost) return { ok: false, msg: 'Bez pieniędzy to ja ci mogę najwyżej powiedzieć dzień dobry, kochaniutki.' }; B.points -= J.cost; if (J.item === 'sluchawka') S.owned.sluchawka = true; if (J.item === 'licznik') { S.owned.licznik = J.skin; cyclo.skin(J.skin); }
    S.money = B.points; LVM.save(); return { ok: true, msg: J.done + ' ' + pickOf(['I nie mów nikomu, skąd masz.', 'Interes zrobiony. Nie znamy się.', 'Proszę bardzo. Paragonu nie będzie, bo paragon to papier, a papier się pali.']) }; },
  buyNotes: () => { const S = LVM.load(), c = JB.JOBS.notes.cost; if ((S.slots || 2) >= 4) return { ok: false, msg: 'Większego notesu nie mam. Większy to już segregator.' }; if (B.points < c) return { ok: false, msg: 'Sześćdziesiąt złotych, kochanieńki. Wróć z pieniążkami.' }; B.points -= c; S.slots = (S.slots || 2) + 1; S.money = B.points; LVM.save(); return { ok: true, msg: 'Proszę bardzo, notes z twardą okładką. Teraz zmieścisz więcej spraw.' }; },
 mods: () => LVM.mods(), setMod: (id, on) => LVM.setMod(id, on), MODS: LVM.MODS, modBonus: ids => LVM.modBonus(ids), rewards: id => ({ R: LVM.REWARDS[id] || {}, got: LVM.load().got || {} }), partName: (k, i) => partLabel(k, i), coupon: want => { const S = LVM.load(); if (S.coupon) return null; const k = (PARTS[want] && want) || Object.keys(PARTS).find(q => PARTS[q].tiers.some((t, i) => i > myBike.parts[q] && t.price)) || 'kola', c = { k, pct: .2, name: PARTS[k].name }; LVM.save({ coupon: c }); return c; }, map: () => openMap(), again: () => startLevel(LV.id), home: () => goHome(), go: id => id && startLevel(id), money: () => B.points, shop: () => { fin.close(); reFin = true; shop.open(); }, sound: n => audio.play(n) } });
// the map's model (dio.js): drawn instead of the world while the map is open
const dio = createDiorama({ THREE, toon, REGIONS: LVM.REGIONS, RC: MAP_RC, PTS: MAP_PTS });
{ const st = document.createElement('style'); st.textContent = 'body.mapopen #hudpx, body.mapopen #hud, body.mapopen #lvhud, body.mapopen #radio, body.mapopen #note { visibility: hidden; }'; document.head.appendChild(st); }
const map = createMap({ levels: LVM, game: { dio, onOpen: on => document.body.classList.toggle('mapopen', on), partName: (k, i) => partLabel(k, i), go: id => startLevel(id), home: () => goHome(), shop: () => { map.close(); reMap = true; shop.open(); }, flash: s => flash(s), sound: n => audio.play(n), current: () => LV?.id || 'dom', save: () => saveCampaign() } });
// ---------- two players over the network (net.js: the link; mp.js: the lobby, the ways to play, the scores). The other player is a
// ghost here: his bike and him as he rides at home, moved to where he says he is (15 times a second), between the messages carried on
// by his speed. Each player's own (his state, his bike, his camera, his aim, ...) is in a context; use(ctx) puts one in the game's
// variables, so the same pose and kick code serves the ghost ----------
const P1 = { B, rider, C, camera, aim, hot, streakEl, mlook, throwCam, rush: 0, shake: 0, id: 1 };
let CUR = P1, P2 = null; const MP = { on: false, R: null, rT: -1e9, sendT: 0 };
function use(ctx) { const prev = CUR; if (ctx === CUR) return prev; CUR.rush = rush; CUR.shake = shake;
  ({ B, rider, C, camera, aim, hot, streakEl, mlook, throwCam } = ctx); rush = ctx.rush; shake = ctx.shake; CUR = ctx; return prev; }
function makeGhost() { const r = createRider({ THREE, ramp, toon }); scene.add(r.root); r.setParts({ paint: '#2f6fb0' }); r.root.visible = false;
  return { B: { x: 0, z: 0, y: 0, yaw: 0, v: 0, steer: 0, lean: 0, pitch: 0, jolt: 0, air: false, vy: 0, crash: null, kick: null, look: null, charge: null, dogSlow: 0, tired: 0, papers: 30, points: 0, delivered: 0, streak: 0 },
    rider: r, C: { yaw: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false, gy: 0, iy: 0, iyGo: true }, camera, aim, hot: { L: null, R: null }, streakEl, mlook: { x: 0, y: 0 }, throwCam, rush: 0, shake: 0, id: 2 }; }
P2 = makeGhost();
const GW = { G: null, mixer: null, A: {}, ball: null, sp: 0 };
function ghostWalker() { if (GW.G || !foot.ready || !foot.me?.P?.G) return GW.G; const P = foot.me.P, G = SkeletonUtils.clone(P.G);
  G.traverse(o => { if (o.isMesh) { o.material = [].concat(o.material).map(m => m.clone()); if (o.material.length === 1) o.material = o.material[0]; for (const m of [].concat(o.material)) { const hsl = m.color?.getHSL({}); if (hsl && hsl.s > .4 && (hsl.h < .05 || hsl.h > .95) && hsl.l > .12 && hsl.l < .62) m.color.setHSL(.6, hsl.s, hsl.l); } o.frustumCulled = false; } });
  // (copied as he is now: if through his eyes, his head is shrunk and his cap hidden; the copy whole)
  G.traverse(o => { o.visible = true; if (/^(head|neck_01)$/.test(o.name)) o.scale.setScalar(o.name === 'head' ? (P.headS || 1) : 1); });
  G.visible = false; scene.add(G); GW.G = G; GW.mixer = new THREE.AnimationMixer(G); for (const n of ['idle', 'walk', 'jog']) { const c = P.clips[n]; if (!c) continue; GW.A[n] = GW.mixer.clipAction(c); GW.A[n].play(); GW.A[n].setEffectiveWeight(n === 'idle' ? 1 : 0); }
  GW.ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshLambertMaterial({ color: '#d9682a' })); GW.ball.visible = false; scene.add(GW.ball); return G; }
const meId = () => net.role === 'guest' ? 2 : 1, otherId = () => 3 - meId(), Bof = k => k === meId() ? P1.B : P2.B;
const net = createNet({ onMsg: m => netMsg(m), onState: s => { if (s === 'on') flash('Połączono z drugim graczem!'); if (['lost', 'closed', 'failed', 'off'].includes(s)) { hoops?.comeBack(); if (GW.G) GW.G.visible = false; if (GW.ball) GW.ball.visible = false; } if (['lost', 'closed', 'failed', 'off'].includes(s) && mp.on) { mp.leaveRound(); flash('Połączenie zerwane: koniec rundy'); } } });
// the houses' subscribers as the host has them (the guest takes them at a round's start), so the same houses wait for both
const subsNow = () => track.doors.map(d => d.sub || null);
function applySubs(a) { if (!a) return; track.doors.forEach((d, i) => { d.sub = a[i] ?? null; }); assignSubs(false, true); }
function mpBegin(subs, id) { use(P1); if (menu.open) menu.close(); resetGame(); C.iy = 0; if (subs) applySubs(subs);
  if (id === 'kosz') { MP.on = true; B.hoop = 0; onFootAt(hoops.at(meId() === 1 ? -1.6 : 1.6, 4.6), hoops.facing); return; }
  const i0 = (track.startI + 12) % track.N, S0 = track.S[i0], yaw0 = Math.atan2(S0.f.x, S0.f.z), d = meId() === 1 ? .95 : 2.55;   // (just out of the home street, side by side in the lane)
  const x = S0.p.x + S0.r.x * d, z = S0.p.z + S0.r.z * d, q = track.probe(x, z, i0); Object.assign(B, { x, z, yaw: yaw0, hint: q.i, y: q.y, gPrev: q.y, v: 0, crash: null }); C.yaw = yaw0; C.init = false; MP.on = true; }
function mpEnd() { MP.on = false; hoops?.challenge.stop(); use(P1); resetGame(); }
const mp = createMp({ net, api: { me: meId, B: k => { const b = Bof(k); if (k === meId()) b.hoop = hoops?.challenge.pts || 0; return b; }, onRun: id => { if (id === 'kosz') hoops.challenge.start(); }, onEnd: () => hoops?.challenge.stop(), begin: mpBegin, end: mpEnd, flash: s => flash(s), audio, subs: subsNow, applySubs,
  pop: (k, t, c) => { const b = Bof(k); hud.pop(new THREE.Vector3(b.x, (b.y || 0) + 2.4, b.z), t, c); } } });
// what comes from the other: where he is, a house served, a paper thrown, a window, a kick
function netMsg(m) {
  if (m.k === 'me') { if (m.paint && m.paint !== MP.R?.paint) P2.rider.setParts({ paint: m.paint }); MP.R = m; MP.rT = performance.now(); Object.assign(P2.B, { hoop: m.hoop || 0, papers: m.papers, points: m.points, delivered: m.delivered, streak: m.streak, crash: m.crash ? (P2.B.crash || { t: 0 }) : null }); return; }
  if (m.k === 'done') { const d = track.doors[m.d]; if (d) d.done = true; const mb = track.mailboxes[m.mb]; if (mb) { mb.done = true; mb.flag.rotation.x = -Math.PI / 2; } return; }
  if (m.k === 'paper') { const T = TITLES[m.title] ? m.title : 'trabka', o = new THREE.Mesh(paperG, paperM); o.castShadow = true; o.add(new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .04, 10), bandOf[T])); o.position.set(m.x, m.y, m.z); scene.add(o);
    papers.push({ m: o, v: new THREE.Vector3(...m.v), dot: new THREE.Mesh(dotG, dotM), prev: o.position.clone(), spin: new THREE.Vector3(9, 0, 3), hint: P2.B.hint || 0, t: 0, rest: false, landed: false, title: T, ghost: true }); scene.add(papers[papers.length - 1].dot); return; }
  if (m.k === 'ball') { hoops?.ghostThrow(m); return; }
  if (m.k === 'catch') { hoops?.passCaught(); flash('Masz podanie!'); return; }
  if (m.k === 'caught') { hoops?.passTaken(); return; }
  if (m.k === 'win') { const w = track.windows[m.i]; if (w && !w.broken) breakWindow(w, true); return; }
  if (m.k === 'kick') { if (B.crash || foot.active) return; const dir = new THREE.Vector3(m.dx, 0, m.dz); hud.impact(rider.root.position.clone().setY(rider.root.position.y + 1), m.how === 'tag' ? 'BEREK!' : 'ŁUP!'); shake = .3; audio.play('kick', { vol: .8 });
    if (m.how === 'crash' && !B.air) crash(0, dir.setLength(3)); else { B.v *= .8; B.jolt = .16; B.x += m.dx * .35; B.z += m.dz * .35; } flash('Kopniak od gracza ' + otherId() + '!'); return; }
  mp.onMsg(m); }
// a house served here: told to the other
function served(door, mb) { if (!net.on) return; net.send({ k: 'done', d: door ? track.doors.indexOf(door) : -1, mb: mb ? track.mailboxes.indexOf(mb) : -1 }); }
// each frame: what I am sent (15 a second); the ghost moved, posed; a bump against him
function stepNet(dt, inp) { if (!net.on) { P2.rider.root.visible = false; return; }
  if ((MP.sendT -= dt) <= 0) { MP.sendT = 1 / 15; const W0 = foot.active ? foot.me : null; net.send({ k: 'me', x: +(W0 ? W0.x : B.x).toFixed(2), y: +(W0 ? W0.y : B.y).toFixed(2), z: +(W0 ? W0.z : B.z).toFixed(2), yaw: +(W0 ? W0.yaw : B.yaw).toFixed(3), v: +(W0 ? W0.vf || 0 : B.v).toFixed(2), hold: !!hoops?.holding, lean: +B.lean.toFixed(3), steer: +B.steer.toFixed(3), pitch: +(B.pitch || 0).toFixed(3),
    air: !!B.air, crash: !!B.crash, ped: +(inp.pedal || 0).toFixed(2), kick: B.kick ? { side: B.kick.side, t: +B.kick.t.toFixed(2) } : null, papers: B.papers, points: B.points, delivered: B.delivered || 0, streak: B.streak || 0, foot: foot.active, paint: bikeLook(myBike).paint, hoop: hoops?.challenge.pts || 0 }); }
  const R = MP.R, age = (performance.now() - MP.rT) / 1000; P2.rider.root.visible = !!R && age < 4 && !R.foot; if (!R) return;
  { const G = ghostWalker(); if (G) { const on = age < 4 && !!R.foot; G.visible = on; GW.ball.visible = on && !!R.hold;
      if (on) { const k = Math.min(1, dt * 12), ex = Math.min(age, .25), tx = R.x + Math.sin(R.yaw) * R.v * ex, tz = R.z + Math.cos(R.yaw) * R.v * ex; if (Math.hypot(tx - G.position.x, tz - G.position.z) > 6) G.position.set(tx, R.y, tz); else { G.position.x += (tx - G.position.x) * k; G.position.z += (tz - G.position.z) * k; G.position.y += (R.y - G.position.y) * k; }
        G.rotation.y += Math.atan2(Math.sin(R.yaw - G.rotation.y), Math.cos(R.yaw - G.rotation.y)) * k; GW.sp += (Math.abs(R.v) - GW.sp) * Math.min(1, dt * 6); const wk = Math.min(1, GW.sp / 1.4), jg = Math.min(1, Math.max(0, (GW.sp - 1.6) / 1.6));
        GW.A.idle?.setEffectiveWeight(1 - wk); GW.A.walk?.setEffectiveWeight(wk * (1 - jg)); GW.A.jog?.setEffectiveWeight(wk * jg); GW.mixer.update(dt);
        if (GW.ball.visible) GW.ball.position.set(G.position.x + Math.sin(G.rotation.y) * .38, G.position.y + 1.15, G.position.z + Math.cos(G.rotation.y) * .38); } } }
  const G = P2.B, k = Math.min(1, dt * 12), ex = Math.min(age, .25), tx = R.x + Math.sin(R.yaw) * R.v * ex, tz = R.z + Math.cos(R.yaw) * R.v * ex;   // (carried on by his speed, a quarter second at most)
  if (Math.hypot(tx - G.x, tz - G.z) > 6) { G.x = tx; G.z = tz; } else { G.x += (tx - G.x) * k; G.z += (tz - G.z) * k; }
  G.y += (R.y - G.y) * k; G.yaw += Math.atan2(Math.sin(R.yaw - G.yaw), Math.cos(R.yaw - G.yaw)) * k; G.v = R.v; G.lean += (R.lean - G.lean) * k; G.steer += (R.steer - G.steer) * k; G.pitch = R.pitch; G.air = R.air; G.kick = R.kick; G.hint = track.probe(G.x, G.z, G.hint || 0).i;
  const prev = use(P2); pose(dt, R.ped, 0, 0, R.crash ? 1 : 0); use(prev);
  // (bumped into him: pushed off, a little slower; he gets the same at his end)
  const dx = B.x - G.x, dz = B.z - G.z, d = Math.hypot(dx, dz); if (P2.rider.root.visible && d < .8 && d > 1e-3 && !B.crash && !foot.active) { B.x += dx / d * (.8 - d); B.z += dz / d * (.8 - d); const now = performance.now(); if (!(B.bumpT > now)) { B.bumpT = now + 450; B.v *= .9; B.jolt = .08; audio.play('kick', { vol: .3 }); } } }
// the marks: the other player (and who is "it"), at the picture's edge with how far when he is out of sight
function mpMarks() { const onFoot = !!GW.G?.visible; if (!net.on || !(P2.rider.root.visible || onFoot)) return []; const G = onFoot ? { x: GW.G.position.x, y: GW.G.position.y, z: GW.G.position.z } : P2.B, o = otherId(), it = mp.it === o, dist = Math.round(Math.hypot(G.x - B.x, G.z - B.z));
  const col = it ? '#cf5a3e' : o === 1 ? '#efc970' : '#8fc3f0', lab = (it ? 'BEREK ' : '') + 'G' + o;
  return [{ p: new THREE.Vector3(G.x, (G.y || 0) + 2.5, G.z), s: 'v', col, label: dist > 12 ? lab + ' ' + dist + ' M' : lab, edge: true, edgeLabel: lab + ' ' + dist + ' M' }]; }
{ const m = location.hash.match(/^#dolacz=([^&]+)(?:&do=([^&]+))?/); if (m) { history.replaceState(null, '', location.pathname + location.search); if (menu.open) menu.close(); mp.joinFlow(m[1], m[2] ? decodeURIComponent(m[2]) : null); } }
let last = performance.now(), hudT = 0;
const fly = { s: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false };
function attract(dt) {                                                  // (the title: the street going by under a slow camera)
  traffic.update(dt, { s: -9999, d: 99, v: 0, along: 1 }); peds.update(dt, { x: 1e5, z: 1e5, v: 0, d: 99, busy: true }); residents.update(dt, { x: 1e5, z: 1e5, v: 0 }); water.update(dt); stepBundles(dt, B.x, B.z);
  fly.s += Math.max(0, dt) * 5.5; const ds = track.len / track.N, i = ((Math.floor(fly.s / ds) % track.N) + track.N) % track.N, S = track.S[i], A2 = track.S[(i + 26) % track.N], sw = Math.sin(fly.s * .02);
  const want = new THREE.Vector3(S.p.x + S.r.x * (3.5 + sw * 3), S.p.y + 5.5 + Math.sin(fly.s * .013) * 1.2, S.p.z + S.r.z * (3.5 + sw * 3)), look = new THREE.Vector3(A2.p.x - A2.r.x * sw * 2, A2.p.y + 1.2, A2.p.z - A2.r.z * sw * 2);
  if (!fly.init) { fly.pos.copy(want); fly.look.copy(look); fly.init = true; } fly.pos.lerp(want, 1 - Math.exp(-dt * 2)); fly.look.lerp(look, 1 - Math.exp(-dt * 2));
  camera.position.copy(fly.pos); camera.up.set(0, 1, 0); camera.lookAt(fly.look); camera.fov = 58; camera.near = .1; camera.updateProjectionMatrix();
  sun.position.copy(fly.pos).addScaledVector(SUN, 60); sun.target.position.copy(fly.pos); sun.target.updateMatrixWorld(); }
// the pad over what is open: the menus, a question, a talk get the keys it stands for (the cross and the stick: arrows, A: Enter,
// B: Esc); the shop and the end of a run: the highlight moves over their buttons, A presses; in the game MENU pauses, VIEW opens the notes
function padUI(dt) {
  if (!pad.on) return; const x = pad.hit, d = pad.nav(dt), arrow = d && { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[d];
  const key = code => { const o = { code, key: code, bubbles: true, cancelable: true }; dispatchEvent(new KeyboardEvent('keydown', o)); dispatchEvent(new KeyboardEvent('keyup', o)); };
  const page = sel => { pad.focus(sel, d); if (x(BTN.A)) pad.press(); };
  if (garage.isOpen) { page('#gar .stage'); if (x(BTN.B) || x(BTN.MENU) || x(BTN.LEFT) && !d) key('Escape'); return; }
  if (shop.isOpen) { page('#shop .win'); if (x(BTN.Y)) document.querySelector('#shop .chat')?.click(); if (x(BTN.B) || x(BTN.MENU)) key('Escape'); return; }
  pad.forget();
  if (runUI.isOpen) { if (x(BTN.A) || x(BTN.MENU)) key('Enter'); return; }
  if (modes.isOpen) { if (x(BTN.A) || x(BTN.MENU)) key('Enter'); if (x(BTN.B)) key('Escape'); return; }
  if (mp.isOpen) { if (x(BTN.A) || x(BTN.MENU)) key('Enter'); if (x(BTN.B)) key('Escape'); return; }
  if (book.isOpen) { const el = document.getElementById('book'); if (el) el.scrollTop += pad.ax[1] * 14 + pad.ax[3] * 14; if (x(BTN.B) || x(BTN.VIEW) || x(BTN.A) || x(BTN.MENU)) key('Escape'); return; }
  if (asking) { if (arrow === 'ArrowLeft' || arrow === 'ArrowRight') key(arrow); if (x(BTN.A)) key('Enter'); if (x(BTN.B)) key('Escape'); return; }
  if (menu.open) { if (arrow) key(arrow); if (x(BTN.A)) key('Enter'); if (x(BTN.B) || (x(BTN.MENU) && menu.page === 'pause')) key('Escape'); return; }
  if (talk.isOpen && !talk.isLight) { if (arrow === 'ArrowUp' || arrow === 'ArrowDown') key(arrow); if (x(BTN.A)) key('Enter'); if (x(BTN.B)) key('Escape'); return; }
  if (talk.isOpen && talk.isLight) [BTN.LEFT, BTN.RIGHT, BTN.UP, BTN.DOWN].forEach((b, i) => { if (x(b)) key('Digit' + (i + 1)); });   // (on the move: the cross picks)
  if (x(BTN.MENU)) key('Escape'); if (x(BTN.VIEW)) key('Tab'); if (x(BTN.LEFT) && !talk.isOpen && !foot.fighting) garage.toggle();
}
function frame(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;   // (the first frame can be stamped before the start)
  pad.poll(); padUI(dt);
  if (!rider.person && foot.riderPerson) rider.setPerson(foot.riderPerson);   // (the boy who walks, put on the bike once he is loaded)
  if ((menu.open || map.isOpen || fin.isOpen || asking || shop.isOpen || garage.isOpen || book.isOpen || (talk.isOpen && !talk.isLight)) && document.pointerLockElement) { mouse.hadLock = false; document.exitPointerLock(); }   // (the menu wants the pointer)
  document.body.classList.toggle('walk', !menu.open && !map.isOpen && !fin.isOpen && !asking && !shop.isOpen && !garage.isOpen && !book.isOpen && !(talk.isOpen && !talk.isLight));                          // (in the game: no cursor; the menu and the question have one)
  if (!asking && !menu.open && !map.isOpen && !fin.isOpen && !shop.isOpen && !garage.isOpen && !runUI.isOpen && !modes.isOpen && !mp.isOpen && !book.isOpen && !window.PT?.hold) { step(dt, talk.isOpen && !talk.isLight ? still(input()) : input()); stepArena(dt); const me = foot.active ? { x: foot.me.x, z: foot.me.z, v: Math.abs(foot.me.vf || 0), foot: true } : { x: B.x, z: B.z, v: Math.abs(B.v), foot: false }; stuff.update(dt, me); stepPuddles(me); } else { input(); if (menu.page === 'title') attract(dt); }   // (asked, or in the menu: the game waits; PT.hold: held from the console)
  if ((hudT -= dt) <= 0) { hudT = .1; paintHud(); } if (noteT > 0 && (noteT -= dt) <= 0) note.classList.remove('on');
  { const k = Math.min(1, B.papers / 20); rider.bagFill?.(k); foot.bagFill?.(k); }
  { const me = foot.active ? foot.me : null, eyes = me ? foot.view === 'first' : CAMS[camI].fpv; FADE.cam.value.copy(camera.position); if (me) FADE.tgt.value.set(me.x, me.y + 1.2, me.z); else FADE.tgt.value.copy(rider.root.position).setY(rider.root.position.y + 1.1); FADE.r.value = eyes || menu.page === 'title' ? 0 : 1.9; px.snap.tgt.copy(FADE.tgt.value); }   // (the thinning of what hides him)   // (the bag shows how many papers are left)
  drift(dt); life.update(Math.min(dt, .05), camera.position); camera.updateMatrixWorld(); RIM.sun.value.copy(SUN).transformDirection(camera.matrixWorldInverse); RIM.up.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);   // (the sun, as the eye sees it)
  px.uniforms.wobT.value = (Math.floor(performance.now() / 125) * 1.37) % 97;   // (the line boiling: a new drawing eight times a second)
  { const q0 = track.probe(B.x, B.z, B.hint); audio.ride(foot.active || menu.open ? 0 : Math.abs(B.v), Math.abs(q0.d) > track.PAVE ? 1 : 0); }
  { const pc = quests.policeCars()[0]; audio.siren(quests.siren && !menu.open, where(pc && pc.g.position)); }
  audio.music(menu.page === 'title' || runUI.isOpen ? 'tytul' : quests.siren || quests.gangTargets.length ? 'poscig' : 'poranek');
  talkCam(dt); if (B.papers > (B.bagMax || 30)) { B.papers = B.bagMax || 30; if (!(B.fullT > 0)) { flash('Torba pełna'); B.fullT = 4; } } B.fullT = (B.fullT || 0) - dt;   // (no more than the bag holds)
  cullPeople(dt);
  if (!BOOT.drawn) { BOOT.drawn = true; requestAnimationFrame(() => document.body.classList.add('drawn')); renderer.compileAsync(scene, camera).catch(() => { }).finally(() => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('booted'))), 300)); }
  hudBag.update(dt, B.papers, B.bagMax || 30, px.size[0] / Math.max(1, px.size[1]), menu.page !== 'title', touch.on); if (map.isOpen) { const so = px.snap.on; px.snap.on = false; px.render(dio.scene, dio.camera); px.snap.on = so; } else { px.render(scene, camera, hudBag); drawHud(dt); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.PT = { THREE, FIN, CROSS, stepRivals, get LV() { return LV; }, geese, radioScene, JB, LV2, liveOffer, liveTake, JOBRUN, snapJob, PHOTO_LOOK, setPhotoStyle: s => { photoStyle = s; }, photo, faceOf, photoOf, startLevel, goHome, map, fin, LVM, RUN, unlockTitle, stuff, scene, camera, hudBag, quests, talk, shop, book, audio, hurt, endRun, runUI, deliver, TITLES, rider, track, B, px, renderer, traffic, dogs, hud, granny, foot, dismount, mount, peds, residents, aim, breakWindow, setCam, crash, setInk, dropLoot, drops, paperHits,   // (for looking in from the console; tick: the game run on by hand, n frames of 1/60 s)
  tick(n, inp = {}) { for (let i = 0; i < n; i++) step(1 / 60, { steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, ...inp, hop: i === 0 && !!inp.hop, kick: i === 0 && !!inp.kick }); px.render(scene, camera); drawHud(1 / 60); }, resetGame, hot, papers, modes, mp, use, get P1() { return P1; }, get P2() { return P2; }, get MPon() { return MP.on; }, net, wbikes, get myBike() { return myBike; }, INV, swapTo, bikeChoices, get garage() { return garage; }, hoops, onFootAt };
