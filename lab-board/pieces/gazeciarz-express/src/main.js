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
import { createBronx } from './bronx.js';
import { createTourist } from './tourist.js';
import { createIndustry } from './industry.js';
import { createVillage } from './village.js';
import { createClassic } from './classic.js';
import { createDirector } from './director.js';
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
import { EDITION, TITLE, SUBTITLE } from './edition.js';
import * as JB from './jobs.js';
import * as WT from './watki.js';
import { createGeese } from './geese.js';
import { createCrossing } from './crossing.js';
import { createMap, RC as MAP_RC, PTS as MAP_PTS } from './map.js';
import { createDiorama } from './dio.js';
import { createPaper, NEWS, eventNews, CAST, ANECDOTES, printed, badgesOf } from './paper.js';
import { createHoops } from './hoops.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PARTS } from './shop.js';
{ const q = new URLSearchParams(location.search), ed = EDITION;
  if (ed === 'klasyk' && !q.has('mapa') && !q.has('region') && !q.has('poziom') && !q.has('arena') && !q.has('mp')) { q.set('mapa', 'klasyk'); location.replace('?' + q.toString().replace(/=(&|$)/g, '$1')); } }
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
// (the radius: wide enough to see him behind a crown or a car, wider from the high skewed cameras)
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
        gl_FragColor.rgb += rimCol * rimK * ${(m.userData.rimMul ?? 1).toFixed(2)} * step(.7, fr) * step(.12, lit) * (1. - lying) * (1. - gl_FragColor.rgb * .55); }`); };
  m.customProgramCacheKey = () => (m.userData.noFade ? 'rim2nf' : 'rim2') + (m.userData.rimMul ?? ''); return m; }
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
const REGION = new URLSearchParams(location.search).get('region') || 'peryferia', MAPA = new URLSearchParams(location.search).get('mapa') || '';   // (a region's world: built for it; another region: the page loads again)
const track = createTrack({ THREE, toon, tex: createTextures({ THREE }), showcase: new URLSearchParams(location.search).has('audit'), region: REGION, map: MAPA }); track.dapSun.value.copy(SUN); scene.add(track.group);
const backdrop = createBackdrop({ THREE, city: track.city, night: track.night }); backdrop.position.set(track.centre.x, 16, track.centre.z); scene.add(backdrop);   // (the lake and the town, all round)
// the village's geese (geese.js): on the verges, across the road when a bike comes
const geese = track.region === 'wies' ? createGeese({ THREE, scene, track, toon }) : null;
const traffic = createTraffic({ THREE, track, cars: track.cars, n: 6, makeRider: () => createRider({ THREE, ramp, toon }), bikes: 2 }); scene.add(traffic.group);   // (cars, and now and then a cyclist coming the other way)
const dogs = createDogs({ THREE, toon, probe: track.probe });
const water = createWater({ THREE, scene });
const residents = createResidents({ THREE, toon, track, hud, scene });
// (the locals of a route's own map: the Bronx after dark (its lads, glass, bins, the engineer); the tourist quarter (its tourists, the guide, picnics, skaters))
const director = createDirector({ THREE, toon, track, scene });   // (something always going on: a small thing on the road ahead when nothing has happened a while)
const locals = track.night ? createBronx({ THREE, toon, track, scene, residents }) : track.tourist ? createTourist({ THREE, toon, track, scene, residents }) : track.industry ? createIndustry({ THREE, toon, track, scene, residents }) : track.classic ? createClassic({ THREE, toon, track, scene, cars: track.cars, traffic: () => traffic.boxes(), residents }) : track.harvest || track.fair ? createVillage({ THREE, toon, track, scene, residents, cars: () => traffic.boxes() }) : null;
// what by the road answers a kick: mailboxes (three and it is off its post), poles, trees and bushes (their leaves), swings, cones
const stuff = createWorld({ THREE, scene, track, toon, audio: { play: (n, o) => audio.play(n, o) }, makeDog: (c, sz) => dogs.makeDog(c, sz), say: (at, t) => hud.rant(at, t, false),
  onLoot: T => { shop.grant(T.item, T.tier); audio.play('pick'); flash(T.label + '! Zamontowane. Właściciel się nie dowie... chyba'); B.fame = (B.fame || 0) + 1; setTimeout(() => hud.rant(new THREE.Vector3(T.x, T.y + 1.6, T.z), 'EJ! MOJE PRZERZUTKI!!!', false), 1600); witness?.(T.x, T.z); },
  onShrine: T => { B.fame = (B.fame || 0) + .5; hud.rant(new THREE.Vector3(T.x + 1, T.y + 1.8, T.z), pickOf(['OBRAZA BOSKA!', 'JEZUS MARIA, CO TY ROBISZ?!', 'POKUTA CIĘ NIE MINIE!']), false); },
  onBreak: T => { B.fame = (B.fame || 0) + .4; hud.pop(new THREE.Vector3(T.x, T.y + 1.6, T.z), 'SKRZYNKA!', '#cf5a3e'); witness?.(T.x, T.z); } });   // (people sitting out in their gardens)                         // (a hydrant knocked or kicked)
// (the town busier: each kind of walker three times, the estate twice)
const peds = createPedestrians({ THREE, toon, track, copies: track.night ? 1 : track.city ? 3 : track.region === 'peryferia2' ? 2 : 1 }); scene.add(peds.group);
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
const granny = createGranny({ THREE, toon, probe: track.probe, doors: track.doors, residents }); scene.add(granny.group);
{ let a = 23; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const dogRate = track.city ? .03 : track.region === 'peryferia2' ? .08 : .15;   // (a few less than before)
  for (const d of track.doors) if (r() < dogRate && !d.stall) { const dog = dogs.add(d.p.x, d.p.z, r() * 6, r); scene.add(dog.group); } }
let rider = createRider({ THREE, ramp, toon }); scene.add(rider.root);
// his other bikes, by the garage at home: one leant there, one upside down, its front wheel off (being mended)
const wbikes = createBikes({ THREE, scene, track, createRider, ramp, toon });
function spawnBikes() { wbikes.clear(); if (track.classic) return; let a = 77;   // (the Classic: no walking, so no bikes in the gardens to take: none drawn)
   wbikes.spawn(() => { a = (a * 16807) % 2147483647; return a / 2147483647; });   // (the same gardens each time)
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
const foot = createOnFoot({ THREE, toon, scene, track, hud, camera, solid, fx: { sound: (n, vol = .5) => audio.play(n, { vol }), score: (n, at, l, c) => score(n, at, l, c), flash: t => flash(t), shake: v => { shake = Math.max(shake, v); }, slow: v => { slowmo = Math.max(slowmo, v); },
  rant: (at, t) => hud.rant(at, t, true), pop: (at, t, c) => hud.pop(at, t, c), blood: (at, dir, n) => blood(at, dir, n), tip: t => hud.tip(t), impact: (at, t) => hud.impact(at, t || undefined), take: () => loseFight(), drop: at => dropLoot(at) } });
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
  if (on('view', e.code)) { if (foot.active) foot.toggleView(); else if (!track.classic) setCam((camI + 1) % CAMS.length); }   // (the Classic: one camera; V kicks there)
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
  if (track.classic && !foot.active) { const sp = hit('kick') || !!tE?.hop; hop = (hop || sp) && !B.air; kickK = hit('view') || !!tE?.kick || (sp && B.air); kickHold = !!held('view') || !!(touch.on && touch.state.kickHeld); }   // (the Classic: Space jumps, and in the air a trick; V kicks)
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
function throwVel(p, side, c = {}) { const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side, a = (c.ay || 0) * .52, sp = (2.6 + p * 9) * (1 + (c.ax || 0) * .25) * (track.classic ? 1.4 : 1);
  const dx = rx * out * Math.cos(a) + fx * Math.sin(a), dz = rz * out * Math.cos(a) + fz * Math.sin(a);
  return new THREE.Vector3(fx * B.v * .9 + dx * sp, track.classic ? 1.3 + p * 2.1 : 1.9 + p * 3.3, fz * B.v * .9 + dz * sp); }   // (the Classic: a lower, quicker arc)
// what a paper can be sent to on a side: a subscriber's mailbox (best), the spot before its door; ahead or just level, out on that side,
// within reach. The current title's subscribers first. → [{ p (on the ground), door }], the best first
function throwTargets(side) { const now = performance.now(), fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side, cur = curTitle(), list = [];
  const consider = (x, z, val, d) => { const dx = x - B.x, dz = z - B.z, fw = dx * fx + dz * fz, lat = (dx * rx + dz * rz) * out, l = Math.hypot(dx, dz); if (fw < -1.5 || fw > 15 || lat < .8 || l > 16) return;
    list.push({ p: new THREE.Vector3(x, track.probe(x, z, B.hint).y, z), door: d, score: l - val - (d.sub === cur ? 6 : 0) }); };
  for (const mb of track.mailboxes) { if (mb.done) continue; const w = mb.o.position; if (Math.abs(w.x - B.x) + Math.abs(w.z - B.z) > 34) continue; const hi = mb.house ?? (mb.house = nearestDoor(w)), d = track.doors[hi]; if (!d || !d.sub || d.done || now - (d.pending || -9e9) < 2500) continue;
    const l = Math.hypot(B.x - w.x, B.z - w.z) || 1; consider(w.x + (B.x - w.x) / l * .45, w.z + (B.z - w.z) / l * .45, 3, d); }   // (just before it, on his side: it drops in)
  for (const d of track.doors) { if (!d.sub || d.done || now - (d.pending || -9e9) < 2500 || Math.abs(d.p.x - B.x) + Math.abs(d.p.z - B.z) > 34) continue; consider(d.p.x - d.n.x * 1.3, d.p.z - d.n.z * 1.3, 0, d); }
  if (FIN.on) for (const T of FIN.targets) { if (T.hit || !T.up || T.kind === 'barn') continue; const dx = T.c.x - B.x, dz = T.c.z - B.z, fw = dx * fx + dz * fz, lat = (dx * rx + dz * rz) * out, l = Math.hypot(dx, dz); if (fw < -1.5 || fw > 15 || lat < .8 || l > 16) continue; list.push({ p: T.c.clone(), door: null, score: l - 9 }); }
  return list.sort((a, b) => a.score - b.score); }
// the moment of a tap: 1 when the target is just the right way ahead for his speed (the paper flies a while: lead it), less either side,
// 0 out of the window. The window narrower in the harder regions. A tap at q 1 drops it in the mailbox; less: under it, on the porch,
// on the lawn, a window maybe (the arc scattered short when early, long when late)
const TAP_TOL = { peryferia: 4.2, wies: 3.7, peryferia2: 3.1 };
// the throw's help (menu: ASYSTA RZUTU; kept in pt.assist): easy: the moment's window shown over the house, wide, a small scatter, the held
// aim taken to a target near it; middle (the default): only the subscriber's sign, the usual window, a weak pull; hard: the sign only
// near, a narrow window, a wider scatter, no pull
const ASSIST = { easy: { name: 'ŁATWA', tol: 1.5, scat: .6, snap: 2.6, marks: true, near: 46 }, mid: { name: 'ŚREDNIA', tol: 1, scat: 1, snap: .9, marks: false, near: 46 }, hard: { name: 'TRUDNA', tol: .7, scat: 1.3, snap: 0, marks: false, near: 26 } };
let assistK = (() => { try { return ASSIST[localStorage.getItem('pt.assist')] ? localStorage.getItem('pt.assist') : 'mid'; } catch { return 'mid'; } })();
const AS = () => ASSIST[assistK];
const assistMenu = { name: () => AS().name, next: () => { const ks = Object.keys(ASSIST); assistK = ks[(ks.indexOf(assistK) + 1) % ks.length]; try { localStorage.setItem('pt.assist', assistK); } catch { } flash('Asysta rzutu: ' + AS().name.toLowerCase()); } };
// (how often Janusz speaks up on the earpiece by himself, kept in this browser: 'rare' (at most once in 75 s, a checkpoint or a sprint only
// now and then), 'often' (as it was), 'off' (silent: no word from him at all, no calls with a job, no scenes; the default for now))
const RADIO_MODES = { rare: { name: 'RZADKO', gap: 75, odds: .35 }, often: { name: 'CZĘSTO', gap: 0, odds: 1 }, off: { name: 'WYŁĄCZONY', gap: 1e9, odds: 0 } };
let radioK = (() => { try { return RADIO_MODES[localStorage.getItem('pt.janusz')] ? localStorage.getItem('pt.janusz') : 'off'; } catch { return 'off'; } })();
const radioMenu = { name: () => RADIO_MODES[radioK].name, next: () => { const ks = Object.keys(RADIO_MODES); radioK = ks[(ks.indexOf(radioK) + 1) % ks.length]; try { localStorage.setItem('pt.janusz', radioK); } catch { } flash('Janusz w słuchawce: ' + RADIO_MODES[radioK].name.toLowerCase()); } };
const SELF = ['turbo', 'behind', 'idle', 'check', 'fall'];
// ---------- blood (comic, pixel): drops spurt off a hit the way it went, fall, and stay as spots on the ground a while; off in the settings ----------
let gore = (() => { try { return localStorage.getItem('pt.gore') !== '0'; } catch { return true; } })();
const goreMenu = { name: () => gore ? 'WŁĄCZONA' : 'WYŁĄCZONA', next: () => { gore = !gore; try { localStorage.setItem('pt.gore', gore ? '1' : '0'); } catch { } flash('Krew: ' + (gore ? 'włączona' : 'wyłączona')); } };
const bloodDrops = [], bloodSpots = [], dropG = new THREE.BoxGeometry(.04, .04, .04), dropM = new THREE.MeshBasicMaterial({ color: '#c0141c' }), spotG = new THREE.CircleGeometry(.2, 7).rotateX(-Math.PI / 2), spotM = new THREE.MeshBasicMaterial({ color: '#7a0c12', transparent: true, opacity: .85, depthWrite: false });
function blood(at, dir, n) { if (!gore || !at) return; const gy = track.probe(at.x, at.z, B.hint).y;
  if (n >= 12) { if (bloodSpots.length >= 50) scene.remove(bloodSpots.shift()); const s = new THREE.Mesh(spotG, spotM); s.position.set(at.x + (dir?.x || 0) * .6, gy + .016, at.z + (dir?.z || 0) * .6); s.scale.setScalar(2.2 + Math.random()); s.rotation.y = Math.random() * 3; s.renderOrder = 1; scene.add(s); bloodSpots.push(s); }   // (a heavy one: a pool where he went down)
  for (let k = 0; k < n && bloodDrops.length < 90; k++) { const m = new THREE.Mesh(dropG, dropM); m.position.copy(at); scene.add(m); const s = 1 + Math.random() * 2.2; bloodDrops.push({ m, gy, t: 0, vx: (dir?.x || 0) * s + (Math.random() - .5) * 1.8, vy: .6 + Math.random() * 2.2, vz: (dir?.z || 0) * s + (Math.random() - .5) * 1.8 }); } }
function stepBlood(dt) { for (let k = bloodDrops.length - 1; k >= 0; k--) { const d = bloodDrops[k]; d.t += dt; d.vy -= 12 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
    if (d.m.position.y > d.gy + .02 && d.t < 2.5) continue; scene.remove(d.m); bloodDrops.splice(k, 1);
    if (bloodSpots.length >= 50) scene.remove(bloodSpots.shift()); const s = new THREE.Mesh(spotG, spotM); s.position.set(d.m.position.x, d.gy + .015, d.m.position.z); s.scale.setScalar(.4 + Math.random() * .9); s.renderOrder = 1; scene.add(s); bloodSpots.push(s); } }
function tapQ(T) { if (!T) return 0; const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), dx = T.p.x - B.x, dz = T.p.z - B.z, fw = dx * fx + dz * fz, lead = 1.6 + Math.abs(B.v) * .38, tol = (TAP_TOL[track.region] || 3.2) * AS().tol;
  return { q: THREE.MathUtils.clamp(1 - Math.abs(fw - lead) / tol, 0, 1), late: fw < lead }; }
let hot = { L: null, R: null };   // (where a tap would send it, each side: shown over the house)
function stepHot() { hot.L = hot.R = null; if (foot.active || B.crash || !B.papers) return; hot.L = throwTargets(1)[0] || null; hot.R = throwTargets(-1)[0] || null; }
function stepAim() {                                                    // (while a throw is held: where it would go)
  aim.on = !!B.charge && !foot.active && !B.crash; aim.G.visible = aim.on; if (!aim.on) return;
  const side = B.charge.side, p = B.charge.p, fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), rx = -fz, rz = fx, out = -side;
  const pos = new THREE.Vector3(B.x - rx * out * -.3, B.y + 1.25, B.z - rz * out * -.3), v = throwVel(p, side, B.charge), h = 1 / 30;
  let k = 0, n = 0, land = null; for (; n < 90; n++) { v.y -= g * h; pos.addScaledVector(v, h); const gy = track.probe(pos.x, pos.z, B.hint).y; if (pos.y <= gy) { pos.y = gy; land = pos; break; } if (n % 3 === 1 && k < aim.dots.length) aim.dots[k++].position.copy(pos); }
  for (let j = 0; j < aim.dots.length; j++) aim.dots[j].visible = j < k;
  // (near enough a target: the ring takes to it, and the paper will go there)
  aim.snap = aim.snapDoor = null; if (land) { const near = throwTargets(side).filter(t => Math.hypot(t.p.x - land.x, t.p.z - land.z) < AS().snap).sort((a, b) => a.p.distanceToSquared(land) - b.p.distanceToSquared(land))[0]; if (near) { aim.snap = near.p; aim.snapDoor = near.door; land = near.p.clone(); } }
  if (land) { aim.ring.visible = true; aim.ring.position.copy(land).setY(land.y + .04); aim.at.copy(land); const good = !!aim.snap || track.mailboxes.some(mb => !mb.done && mb.o.position.distanceTo(land) < 1.6) || track.doors.some(d => !d.done && Math.hypot(d.p.x - d.n.x * 1.3 - land.x, d.p.z - d.n.z * 1.3 - land.z) < 1.6);
    const col = good ? '#7fae58' : '#efc970'; aim.ring.material.color.set(col); aim.ring.children[1].children[1].material.color.set(col); const k2 = (.9 + Math.sin(performance.now() / 120) * .1) * Math.max(1, camera.position.distanceTo(land) / 8); aim.ring.scale.setScalar(k2);   // (the farther, the bigger: about the same on the screen)
    const ar = aim.ring.children[1]; ar.position.y = 1.1 + Math.sin(performance.now() / 160) * .15; ar.rotation.y += .05; } else aim.ring.visible = false; }
function throwing(dt, inp) {
  if (B.crash) { B.charge = null; return; }
  // (the Classic: any throw, towards the houses: his left or his right, as the houses are for him now)
  if (track.classic) { const A = track.S[B.hint] || track.S[0], hl = (A.r.x * track.oneSide) * Math.cos(B.yaw) - (A.r.z * track.oneSide) * Math.sin(B.yaw) > 0, any = inp.holdL || inp.holdR; inp = { ...inp, holdL: hl && any, holdR: !hl && any }; }
  const held = inp.holdL ? 1 : inp.holdR ? -1 : 0;
  if (!B.charge && held && B.papers > 0 && !rider.throwing) B.charge = { side: held, p: 0, t: 0 };
  if (B.charge) { B.charge.p = Math.min(1, B.charge.p + dt / .85); const c = B.charge; c.t += dt;
    c.ay = THREE.MathUtils.clamp((c.ay || 0) - (inp.dy || 0) * .005, -1, 1); c.ax = THREE.MathUtils.clamp((c.ax || 0) - (inp.dx || 0) * .005 * c.side, -1, 1);
    const still = B.charge.side > 0 ? inp.holdL : inp.holdR; if (!still) { const tap = c.t < .22, T0 = tap ? (c.side > 0 ? hot.L : hot.R) : null;   // (a tap: straight to the best on that side; held: where it was aimed, taken to a target near it)
      B.throwAt = tap ? T0?.p || null : aim.snap || null; B.throwDoor = tap ? T0?.door : aim.snapDoor; B.throwQ = tap && T0 ? tapQ(T0) : null; B.throwP = tap && !B.throwAt ? Math.max(.45, B.charge.p) : B.charge.p; B.throwC = { ax: B.charge.ax, ay: B.charge.ay }; if ((rider.throwDur = track.classic ? .3 : .5, rider.throwPaper)(B.charge.side)) { const t = curTitle(); B.papers--; B.mix[t] = Math.max(0, B.mix[t] - 1); B.throwT = t; audio.play('throw', { vol: .8 }); } B.charge = null; } }
}
const paperG = new THREE.CylinderGeometry(.035, .035, .26, 10), paperM = toon('#ece5d0'), bandM = toon('#b3372c');
// ---------- the titles: papers (made up), each house takes one or none; the bag holds some of each, X picks which is thrown. The run starts
// with one (no picking: just throw), a second joins further on, the third later still (TITLE_AT, metres ridden) ----------
const TITLES = { trabka: { name: 'TRĄBKA PORANNA', short: 'TRĄBKA', col: '#cf5a3e' }, wiesci: { name: 'WIEŚCI ZZA PŁOTU', short: 'WIEŚCI', col: '#3f8a4a' }, sport: { name: 'SPORT I DZIAŁKA', short: 'SPORT', col: '#3d7be0' } };
const TK = Object.keys(TITLES), bandOf = Object.fromEntries(TK.map(k => [k, toon(TITLES[k].col)]));
B.nt = 1; B.mix = { trabka: 30, wiesci: 0, sport: 0 }; B.sel = 0;
const TITLE_AT = [0, 1400, 3800], ACT = () => TK.slice(0, LV?.titles || B.nt || 1);   // (a route can set its titles: the Classic's second street, two)
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
const MARK = { door: new THREE.BoxGeometry(.95, 1.95, .06), post: new THREE.BoxGeometry(.08, 1, .08).translate(0, .5, 0), box: new THREE.BoxGeometry(.32, .26, .5), flag: new THREE.BoxGeometry(.04, .22, .14), frame: new THREE.BoxGeometry(1.2, 2.2, .04), off: new THREE.MeshBasicMaterial({ color: '#1f2124' }), white: new THREE.MeshBasicMaterial({ color: '#f6f3ea' }), wood: toon('#8a6a44'), red: new THREE.MeshBasicMaterial({ color: '#e8402c' }), lit: Object.fromEntries(TK.map(k => [k, new THREE.MeshBasicMaterial({ color: TITLES[k].col })])) };   // (unlit: bright from afar in any light)
function classicMark(d) { if (d.mark) { scene.remove(d.mark); d.mark = null; } if (d.stall || d.mine) return;
  const n = d.n, fa = d.p.clone().addScaledVector(n, -2.6), side = new THREE.Vector3(-n.z, 0, n.x), g = new THREE.Group(), col = d.sub ? MARK.lit[d.sub] : MARK.off, yaw = Math.atan2(n.x, n.z);
  if (!d.gate && !track.city) { const door = new THREE.Mesh(MARK.door, col); door.position.copy(fa).addScaledVector(n, .12); door.position.y += 1.02; door.rotation.y = yaw; g.add(door); if (d.sub) { const fr = new THREE.Mesh(MARK.frame, d.miss ? MARK.red : MARK.white); fr.position.copy(door.position).addScaledVector(n, -.03); fr.position.y += .05; fr.rotation.y = yaw; g.add(fr); } }
  if (d.sub) { const mb = new THREE.Group(), bx = new THREE.Mesh(MARK.box, col), fl = new THREE.Mesh(MARK.flag, MARK.red); mb.add(new THREE.Mesh(MARK.post, MARK.wood)); bx.position.y = 1.08; fl.position.set(.19, 1.3, .1); mb.add(bx, fl);
    mb.position.copy(d.p).addScaledVector(side, 1.4); mb.position.y = track.probe(mb.position.x, mb.position.z, d.i ?? -1).y; mb.rotation.y = yaw; g.add(mb); }
  scene.add(g); d.mark = g; }
function assignSubs(keepNear, fixed) { const A = ACT();   // (fixed: the subscribers as they are, given by the other player; only their plaques made anew)
  const kept = d => keepNear && (d.done || Math.hypot(d.p.x - B.x, d.p.z - B.z) < 70);
  if (!fixed) { const rate = track.region === 'wies' ? .7 : .55; for (const d of track.doors) if (!kept(d)) d.sub = SUBR() < rate && !d.mine ? A[SUBR() * A.length | 0] : null;
    // (no long stretch without a paper to throw: where the subscribers leave more than ~55 m empty, the door nearest the middle of it takes one)
    const L0 = track.N * track.ds, at = track.doors.map(d => ({ d, s: d.s0 ?? (d.s0 = track.probe(d.p.x, d.p.z, d.i ?? -1).s) })).sort((x, y) => x.s - y.s);
    for (let pass = 0; pass < 6; pass++) { const subs = at.filter(o => o.d.sub); if (!subs.length) break; let added = 0;
      for (let k = 0; k < subs.length; k++) { const a0 = subs[k].s, b0 = k + 1 < subs.length ? subs[k + 1].s : subs[0].s + L0; if (b0 - a0 < 55) continue; const mid = (a0 + b0) / 2;
        let best = null, bd = 1e9; for (const o of at) { if (o.d.sub || o.d.mine || kept(o.d)) continue; let ds_ = o.s; if (ds_ < a0) ds_ += L0; if (ds_ <= a0 + 8 || ds_ >= b0 - 8) continue; const e = Math.abs(ds_ - mid); if (e < bd) { bd = e; best = o; } }
        if (best) { best.d.sub = A[SUBR() * A.length | 0]; added++; } }
      if (!added) break; } }
  for (const d of track.doors) { if (kept(d)) continue;
    if (d.plaque) { scene.remove(d.plaque); plaques.splice(plaques.indexOf(d.plaque), 1); d.plaque = null; }
    if (track.classic) classicMark(d);
    if (!d.sub) continue;
    const n = d.n, fa = d.p.clone().addScaledVector(n, -2.6), side = new THREE.Vector3(-n.z, 0, n.x), pl = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(.34, .24, .03), toon('#f6f3ea')); pl.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(.28, .08, .035), bandOf[d.sub]); c.position.y = .04; pl.add(c);
    pl.position.copy(fa).addScaledVector(n, .06).addScaledVector(side, .95); pl.position.y += 1.55; pl.rotation.y = Math.atan2(n.x, n.z); scene.add(pl); plaques.push(pl); d.plaque = pl; }
  if (GLOWS_READY) nightGlows(); }   // (night: the glows on the new subscribers' letterboxes)
assignSubs();
// (night: a warm glow on each subscriber's letterbox, seen from far off on the dark walls; out once it has its paper)
const glowT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const subGlows = [];
function nightGlows() { for (const G of subGlows) G.s.parent?.remove(G.s); subGlows.length = 0; if (!track.night) return;
  const mat = new THREE.SpriteMaterial({ map: glowT, color: '#ffc46a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const mb of track.mailboxes) { const hi = mb.house; const d = hi != null ? track.doors[hi] : null; if (!d || !d.sub) continue; const s = new THREE.Sprite(mat.clone()); s.scale.setScalar(1.3); s.visible = false; mb.o.getWorldPosition(s.position); s.position.y += .15; scene.add(s); subGlows.push({ s, mb, d }); } }
// (only the ones to deliver to now: not done, a paper in the bag of its title, the nearest three ahead of him within 45 m; soft, fading in)
function stepGlows(t, dt) { const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), want = [];
  for (const G of subGlows) { G.want = false; if (G.d.done || G.mb.done || !(B.mix?.[G.d.sub] > 0)) continue; const dx = G.s.position.x - B.x, dz = G.s.position.z - B.z, l = Math.hypot(dx, dz); if (l > 45 || (dx * fx + dz * fz) / (l || 1) < -.1) continue; want.push([G, l]); }
  want.sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([G]) => { G.want = true; });
  for (const G of subGlows) { G.k = Math.max(0, Math.min(1, (G.k || 0) + (G.want ? dt * 2 : -dt * 3))); G.s.visible = G.k > .02; if (G.s.visible) { G.s.material.opacity = .45 * G.k; G.s.scale.setScalar(1.3 + Math.sin(t * 2 + G.d.i) * .15); } } }
var GLOWS_READY = true; nightGlows();
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
    if (fw > 3 && l < 26) d.seen = true; else if (d.seen && fw < -9 && B.v > 2) { d.seen = false; if (!d.satMiss) { d.satMiss = true; satAdd(-3); } if (B.streak > 0) { breakStreak(); flash('Minąłeś prenumeratora bez gazety'); } } } }
// a paper come down by a house: the right title for its subscriber (paid in full), the wrong one (a little, and words), or a house that takes none
function deliver(hi, base, at, how, title, dist = 0) {
  const d = track.doors[hi], sub = d && d.sub, up = at.clone().setY(at.y + 1.3);
  if (!sub) { breakStreak(); hud.rant(up, pickOf(['NIE ZAMAWIAŁEM!', 'ZA DARMO? NO TO BIORĘ.', 'ZNOWU ULOTKI?!', 'JA NIE CZYTAM, JA OGLĄDAM!']), false); flash('Ten dom nic nie prenumeruje'); return false; }
  if (sub === title && d.rush > performance.now()) { d.rush = 0; rushOff(d); score(5, at.clone().setY(at.y + .6), 'PILNE! +5', '#ff8a5a'); logEv('rush', at.x, at.z); audio.play('trick'); }
  if (sub === title) { satAdd(2); B.delivered = (B.delivered || 0) + 1; B.streak = (B.streak || 0) + 1; const mult = streakMult(), pts = base * mult; score(pts, at, '+' + pts + (mult > 1 ? ' x' + mult : ''), mult > 1 ? '#9fd27a' : '#efc970');
    if (B.streak % 3 === 0 && mult > 1) { hud.impact(at.clone().setY(at.y + 1.2), 'SERIA x' + mult + '!'); audio.play('trick'); }
    flash(`${how}: ${TITLES[title].short.toLowerCase()} dla prenumeratora! +${pts}${mult > 1 ? ` (seria ${B.streak}, x${mult})` : ''}`); drawStreak(); farThrow(dist, at); if (how === 'Do skrzynki') RUN.boxed = (RUN.boxed || 0) + 1; return true; }
  satAdd(-2); breakStreak(); const n = Math.max(1, base >> 1); score(n, at, '+' + n, '#cf5a3e'); hud.rant(up, pickOf([`JA CZYTAM ${TITLES[sub].short}!`, 'TO NIE MOJA GAZETA!', 'POMYLIŁEŚ GAZETY, MŁODY!']), false); flash(`Zły tytuł: tu czytają ${TITLES[sub].short.toLowerCase()}. +${n}`); return false;
}
const dotG = new THREE.CircleGeometry(.16, 12).rotateX(-Math.PI / 2), dotM = new THREE.MeshBasicMaterial({ color: '#1b1510', transparent: true, opacity: .45, depthWrite: false });
const papers = [];
function release(at, side) {                                          // (from the rider, at the moment the hand lets go)
  const title = B.throwT || curTitle(), m = new THREE.Mesh(paperG, paperM); m.castShadow = true; m.add(new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .04, 10), bandOf[title] || bandM)); scene.add(m); m.position.copy(at);
  let v = throwVel(B.throwP, side, B.throwC || {});                   // (from a lob to a hard throw, turned as it was aimed)
  let A = B.throwAt; B.throwAt = null; if (A && B.throwDoor) B.throwDoor.pending = performance.now();
  if (A && B.throwQ) { const { q, late } = B.throwQ; B.throwQ = null; if (q < .82) { const r = ((1 - q) * 4.4 + Math.abs(B.v) * .05) * AS().scat, fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), lat = (Math.random() - .3) * r * .6, along = (late ? 1 : -1) * r * (.6 + Math.random() * .4);   // (early: short of it; late: past it; a little to the house's side, or the road's)
      const sd = -(side || 1), rx = -fz * sd, rz = fx * sd; A = A.clone(); A.x += fx * along + rx * lat; A.z += fz * along + rz * lat; A.y = track.probe(A.x, A.z, B.hint).y; } }
  // (the Classic: the arc flat and quick)
  if (A) {   // (a paper on its way to it: not sent another)
    const dx = A.x - at.x, dz = A.z - at.z, l = Math.hypot(dx, dz), T = track.classic ? THREE.MathUtils.clamp(.26 + l * .026, .32, .6) : THREE.MathUtils.clamp(.5 + l * .04, .6, 1.05); v = new THREE.Vector3(dx / T, (A.y + .05 - at.y) / T + .5 * g * T, dz / T); }   // (sent to a target: the arc that comes down on it)
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
  w.broken = true; aud('glass', w.p); if (!remote) { B.windows = (B.windows || 0) + 1; logEv('window', w.p.x, w.p.z); if (track.classic && !track.doors[w.house]?.sub) score(2, w.p.clone().add(new THREE.Vector3(0, .8, 0)), 'SZYBA! +2', '#efc970'); if (track.doors[w.house]?.sub) satAdd(-4); if (track.classic) locals?.angry?.(w); } { const d = track.doors[w.house]; if (d && d.sub) { d.sub = null; if (d.plaque) d.plaque.visible = false; setTimeout(() => hud.rant(w.p.clone().add(new THREE.Vector3(0, 1.4, 0)), pickOf(['REZYGNUJĘ Z PRENUMERATY!', 'KONIEC Z GAZETAMI!', 'ODPISUJĘ SIĘ!']), false), 700); } } B.fame = (B.fame || 0) + .4; quests.onWindow(w); const m = new THREE.Mesh(new THREE.PlaneGeometry(w.hw * 1.9, w.hh * 1.9), crackM); m.position.copy(w.p).addScaledVector(w.n, .015); m.lookAt(m.position.clone().add(w.n)); scene.add(m); cracks.push(m);
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
        else for (const mb of track.mailboxes) { const w = mb.o.position, dm = Math.hypot(w.x - p.m.position.x, w.z - p.m.position.z); if (!mb.done && dm < 1.6) { const inBox = dm < .65; mb.done = true; boxed = true; mb.flag.rotation.x = -Math.PI / 2; aud('mailbox', w); const hi = mb.house ?? (mb.house = nearestDoor(w)); if (track.doors[hi]) track.doors[hi].done = true; served(track.doors[hi], mb); if (!deliver(hi, inBox ? 5 : 3, w.clone().setY(w.y + 1.5), inBox ? 'Do skrzynki' : 'Pod skrzynkę', p.title, Math.hypot(p.from.x - w.x, p.from.z - w.z))) break;
            const win = track.windows.filter(o => !o.broken).sort((a, b) => a.p.distanceToSquared(w) - b.p.distanceToSquared(w))[0];   // (thanks from the nearest window of the house)
            hud.praise(win && win.p.distanceTo(w) < 16 ? win.p.clone().add(new THREE.Vector3(0, .9, 0)) : w.clone().setY(w.y + 2.6)); break; } }
        if (!door && !boxed && (w0 = under())) { track.doors[w0.house].done = true; served(track.doors[w0.house]); deliver(w0.house, 1, at, 'Pod okno', p.title, Math.hypot(p.from.x - P.x, p.from.z - P.z)); }
        else if (!door && !boxed) { const lawn = track.doors.find(d => d.sub && !d.done && Math.hypot(d.p.x - P.x, d.p.z - P.z) < 8 && ((P.x - d.p.x) * -d.n.x + (P.z - d.p.z) * -d.n.z) > .4);   // (on the lawn before a subscriber's house: it counts, barely)
          if (lawn) { lawn.done = true; served(lawn); deliver(track.doors.indexOf(lawn), 1, at, 'Na trawnik', p.title, Math.hypot(p.from.x - P.x, p.from.z - P.z)); }
          else if (track.doors.some(d => d.sub && !d.done && Math.hypot(d.p.x - P.x, d.p.z - P.z) < 9)) breakStreak(); } }   // (wide of one waiting for it)
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
// (Express: the street builds up to its course: the first third quiet (a car fewer), the middle as set, the last stretch before the
// course its rush hour (a car more); streetP: how far along the street he is, 0 at the start, 1 at the finish)
function streetP() { if (!LV?.finish?.m || !RUN.cps?.length) return 0; const N = track.N, iJ = track.startI, iF = RUN.cps[RUN.cps.length - 1], span = (((iF - iJ) % N) + N) % N || 1, q = track.probe(B.x, B.z, B.hint); return Math.min(1, ((((q.i - iJ) % N) + N) % N) / span); }
const carsNow = () => LV ? (LV.finish?.m ? Math.max(1, LV.cars + (streetP() < .3 ? -1 : streetP() > .55 ? 1 : 0)) : LV.cars) : carsAt(level()), heatNow = () => LV ? LV.heat : heat(level());
function stepLevel() { if (LV) return; const l = level(); if (l === B.lvl) return; if (B.lvl) { flash(`POZIOM ${l}: ${LVL_SAY[l]}`); audio.play('trick'); } B.lvl = l; }
function hurt(n, why) { if (endT > 0) return; audio.play('hurt', { vol: .6 }); B.hp = Math.max(0, (B.hp ?? 100) - n); if (B.hp <= 0) { endT = 2.4; endWhy = why || 'Zdrowie się skończyło.'; } }
let endT = 0, endWhy = '';
const runUI = createRun({ onAgain: () => { if (LV) startLevel(LV.id); else { resetGame(); fromAccount(); } }, onMap: () => { if (LV) startLevel(LV.id); else { resetGame(); fromAccount(); } openMap(); } });
// the notebook (Tab): who thinks what of you, the bike, what you carry, how you are
const book = createBook({ data: () => ({ reps: quests.reps(), parts: shop.equipped(), items: B.items || [], kept: kept(), hp: B.hp ?? 100, money: B.points, fame: B.fame || 0, papers: ACT().map(k => ({ name: TITLES[k].name, n: B.mix[k], col: TITLES[k].col })), dist: trip.dist }) });
function endRun(why) { if (runUI.isOpen) return; endT = 0; runUI.open({ reason: why, goal: LV?.goal?.papers || 0, dist: trip.dist, delivered: B.delivered || 0, earned: B.earned || 0, windows: B.windows || 0, stops: quests.police?.stops || 0 }, [...shop.ownedList(), ...(B.items || []).map(n => ({ label: 'FANT: ' + n, keep: { item: n } }))]); }
function fromAccount() { const all = kept(); for (const k of all) { if (k.keep.part) shop.grant(k.keep.part, k.keep.tier); else if (k.keep.item) (B.items ||= []).push(k.keep.item); } if (all.length) flash('Z konta: ' + all.map(k => k.label.toLowerCase()).join(', ')); }
setTimeout(() => fromAccount(), 0);   // (the first run too)
// (B.safe: just up or back on the bike, a knock holds him back, he does not go over again straight off)
function crash(side, push, robbed) {                                 // push: what hit him (a car's velocity), if anything; robbed: the old woman got him
  if (B.crash) return; if (B.safe > 0 && !robbed) { B.v *= .25; B.jolt = .15; return; } B.falls = (B.falls || 0) + 1; (B.fallsAt ||= []).push({ x: B.x, z: B.z }); logEv(push ? 'car' : robbed ? 'granny' : 'fall', B.x, B.z); if (RAD.fall <= 0) { RAD.fall = 10; setTimeout(() => radioSay('fall'), 900); } audio.play('crash'); if (!(FIN.on && FIN.entered && !push)) hurt(push ? 30 : 15, push ? 'Auto było twardsze.' : 'Za dużo wywrotek na jeden poranek.'); B.crash = { t: 0, side: side || (B.lean >= 0 ? 1 : -1), up: false, robbed }; B.charge = null; aim.on = false; aim.G.visible = false; flash('Wywrotka!');
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
// ---------- the night (a region's: the estate after dark): the sky dark with stars and the moon, the fog dark blue, the light low and
// cold, the clouds dim; the papers glow a little in flight; a few real lights go with him from lamp to lamp (the nearest heads), the
// flickering ones off with their lamps ----------
if (track.winter) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#8fa4b8'); gr.addColorStop(.6, '#c4d0db'); gr.addColorStop(1, '#e8edf1'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
  scene.fog.color.set('#e3e9ee'); scene.fog.near = 50; scene.fog.far = 320; }
const NIGHT = !!track.night, nightLights = [];
if (NIGHT) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#070a16'); gr.addColorStop(.6, '#141a32'); gr.addColorStop(.85, '#262842'); gr.addColorStop(1, '#3a3148'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
  scene.fog.color.set('#131a2c'); scene.fog.near = 35; scene.fog.far = 230; hemi.color.set('#5a6c98'); hemi.groundColor.set('#1c1820'); hemi.intensity = .2;
  sun.color.set('#a8bce8'); sun.intensity = .26; RIM.col.value.set('#7088c0'); SUN.set(.35, .75, .55).normalize(); paperM.emissive.set('#5e5030');
  for (const c0 of clouds) { c0.s.material.color.set('#3a4260'); c0.s.material.opacity *= .55; }
  const sp = []; for (let k = 0; k < 600; k++) { const a = Math.random() * 6.283, e = .12 + Math.random() * 1.3, R = 520; sp.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#dfe6ff', size: 1.5, sizeAttenuation: false, fog: false })); stars.position.copy(track.centre); scene.add(stars);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(13, 20), new THREE.MeshBasicMaterial({ color: '#f2efd8', fog: false })); moon.position.copy(track.centre).addScaledVector(SUN, 470); moon.lookAt(track.centre); scene.add(moon);
  for (let k = 0; k < 3; k++) { const L = new THREE.PointLight('#ffc27a', 0, 17, 1.4); scene.add(L); nightLights.push(L); } }
function stepNight(px_, pz_) { if (!NIGHT) return; const lamps = [...(track.net?.lamps || []), ...(locals?.lights || [])], on = track.net?.flickOn?.() ?? true;
  const near = lamps.map(l => [l, (l.p.x - px_) ** 2 + (l.p.z - pz_) ** 2]).sort((a, b) => a[1] - b[1]);
  nightLights.forEach((L, k) => { const e = near[k]; if (!e) { L.intensity = 0; return; } L.position.set(e[0].p.x, e[0].p.y - .3, e[0].p.z); L.intensity = e[0].flick && !on ? 0 : 34; }); }
// (at night a subscriber's mark shows only near, or under a lamp)
const litNear = p => (track.net?.lamps || []).some(l => (l.p.x - p.x) ** 2 + (l.p.z - p.z) ** 2 < 49);
const markNear = p => !NIGHT || litNear(p) ? AS().near : Math.min(AS().near, 28);
function ride(dt, inp) {
  if (B.safe > 0) { B.safe -= dt; if (track.classic && !B.crash) rider.root.visible = B.safe <= 0 || ((B.safe * 12) | 0) % 2 === 0; }   // (the Classic: blinking while nothing can throw him)
  if (B.lift) { const L = B.lift; L.t += dt; B.lean = L.from * (1 - THREE.MathUtils.smootherstep(L.t, 0, .8)); B.leanV = 0; B.v = 0; pose(dt, 0, 0, 0, 0); if (L.t >= .8) { B.lift = null; B.lean = 0; } return; }   // (picked up off the ground)
  const q = track.probe(B.x, B.z, B.hint); B.hint = q.i;
  const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw), along = fx * q.f.x + fz * q.f.z, slope = q.slope * along;
  if (B.crash) {                                                       // off: the bike over on its side, sliding to a stop; a moment; up again
    const c = B.crash; c.t += dt; B.v *= Math.pow(.04, dt); B.x += fx * B.v * dt; B.z += fz * B.v * dt;
    const down = c.side * 1.38, want = c.t < 2.3 ? down : c.t < 3.3 ? down * (1 - THREE.MathUtils.smootherstep(c.t, 2.3, 3.3)) : 0;
    B.lean += (want - B.lean) * Math.min(1, dt * (c.t < 2.3 ? 7 : 5)); B.steer *= Math.pow(.1, dt);
    if (c.robbed || track.classic) {                                   // robbed (and always in the Classic): he lies a moment, then (blinking) he is back on the road, on his bike
      const t0 = c.robbed ? 2.2 : 1.4; if (c.t > t0 && !c.moved) { c.moved = true; backToRoad(); if (c.robbed) flash(`Babka zwędziła Ci całą kasę! (−${c.robbed} zł)`); }
      rider.root.visible = !(c.t > t0 && ((c.t * 12) | 0) % 2);
      if (c.t > t0 + 1.1) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; rider.root.visible = true; B.safe = 2.5; B.rattled = 0; }
    } else {
      if (c.t > 2.3 && !c.up) { c.up = true; const p = rider.pelvisAt ? rider.pelvisAt.clone() : new THREE.Vector3(B.x, B.y, B.z);   // (up on his feet; the bike stays down)
        if (foot.ready && foot.start({ x: p.x, z: p.z, yaw: B.yaw, hint: B.hint, getUp: true })) { rider.ragdollOff(); rider.boy.visible = false; B.crash = null; B.v = 0; B.parked = true; B.bikeDown = { lean: B.lean }; flash('Wstań i podnieś rower: F przy rowerze'); return; }
        rider.getUp(1); }                                                // (the models not there yet: back onto the bike as before)
      if (c.t > 3.4) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; B.safe = 2.5; B.rattled = 0; }
    }
    if (c.moved) { B.lean = 0; B.leanV = 0; B.v = 0; }
    B.y += (q.y - B.y) * Math.min(1, dt * 12); pose(dt, 0, 0, slope, Math.min(1, Math.abs(B.lean) / 1.3)); return;
  }
  const off = Math.abs(q.d) > track.PAVE && !track.paved(B.x, B.z) && !track.classic;   // (the Classic: the lawns are to ride on)   // (the home's street: asphalt, though off the loop)
  // the push: strong from standing, falling off towards 9 m/s (a little more with Shift); the brake; the air, the tyres, the grass; the hill; a dog
  // (B.v is signed: held at a stop, the brake walks him backwards, slowly)
  const accK = 1 + MOD.acc, topK = 1 + MOD.top, push = inp.pedal * (inp.sprint ? 1.35 : 1) * (RAD.turbo > 0 ? 1.3 : 1) * Math.max(0, (inp.sprint ? 3.9 : 3.4) * accK - Math.max(0, B.v) * (inp.sprint ? .33 : .36) * accK / topK);   // (the parts: shop.js)
  const back = inp.brake > .1 && B.v < .15 && inp.pedal < .1, brk = B.v > .05 ? inp.brake * 6.5 : 0;
  B.flatT = Math.max(0, (B.flatT || 0) - dt);   // (a tyre cut on glass: it drags a while)
  let a = -(B.flatT > 0 ? .55 * B.v : 0) + push - brk - .009 * B.v * Math.abs(B.v) - .035 * B.v - (off ? .9 * Math.max(.2, 1 + MOD.grass) * B.v : 0) - g * Math.sin(Math.atan(slope)) * 1.25 * (slope > 0 ? 1 - MOD.hill : 1) - B.dogSlow * (1.2 + .09 * B.v * B.v) * Math.sign(B.v);
  if (inp.pedal < .05 && !B.air && Math.abs(B.v) < 1.3) a -= Math.sign(B.v) * (1.2 - Math.abs(B.v) * .7);   // (coasting slowly: the tyres drag him to a stop)
  B.boostT = Math.max(0, (B.boostT || 0) - dt);
  if (track.classic && !B.air && !back && inp.brake < .1 && !(B.boostT > 0) && (B.v > 1 || inp.pedal > .05)) a = ((inp.pedal > .05 ? 6.6 * (inp.sprint ? 1.2 : 1) : 4) - B.v) * (inp.pedal > .05 ? 1.9 : 1.1) - g * Math.sin(Math.atan(slope)) * .4;   // (the Classic: once going, rolling on at 4 m/s by himself, up to 6.6 with the pedal; stopped, he stays until the pedal)
  if (back) a = -1.6 * inp.brake - .6 * B.v;
  if (B.air) a = -.006 * B.v * Math.abs(B.v);
  const ice = !B.air && !!track.iceAt?.(B.x, B.z); if (ice) a *= .12;
  if (ice && !B.onIce) { B.onIce = true; B.iceF = B.falls || 0; hud.rant(rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'ŚLIZG!', true); }
  else if (!ice && B.onIce && !B.air) { B.onIce = false; if ((B.falls || 0) === B.iceF && !B.crash) score(1, rider.root.position.clone().add(new THREE.Vector3(0, 2, 0)), 'PO LODZIE! +1', '#cfe6f2'); }
  const v0 = B.v; B.v = Math.max(-1.4, B.v + a * dt); if (!back && inp.pedal < .05 && !B.air && (Math.abs(B.v) < .1 || B.v < 0 || (v0 !== 0 && Math.sign(B.v) !== Math.sign(v0)))) B.v = 0;   // (crawling: he stops, a foot on the ground, on a hill too; back only if he walks it back)
  // steering (hardly any in the air)
  const sIn = Math.sign(inp.steer) * Math.pow(Math.abs(inp.steer), 1.4);   // (a stick: small pushes finer; a key is all or nothing anyway)
  const lock = .62 * (1 + MOD.steer) * (track.classic ? 1.3 : 1) / (1 + Math.abs(B.v) * .24), want = sIn * lock * (B.air ? .25 : 1) * (ice ? .2 : 1), outOf = Math.abs(want) < Math.abs(B.steer) || Math.sign(want) !== Math.sign(B.steer);
  const rate = (outOf ? 4.6 : 2.4 + 1.6 * (1 - Math.min(1, Math.abs(B.steer) / Math.max(.05, lock)))) * dt;   // (in: quick at first, easing as it comes to full lock; out: quicker)
  B.steer += THREE.MathUtils.clamp(want - B.steer, -rate, rate);
  B.yaw += -B.v * Math.tan(B.steer) / L * dt;
  // the road's bends: not steering (or hardly), on the road and going, he is eased along it (a lane change ends straight with the road)
  if (!B.air && !ice && B.v > 2 && Math.abs(q.d) < track.KERB + .6) { const ry = Math.atan2(q.f.x, q.f.z) + (along < 0 ? Math.PI : 0), d = Math.atan2(Math.sin(ry - B.yaw), Math.cos(ry - B.yaw)), k = Math.max(0, 1 - Math.abs(inp.steer) * 4);
    if (Math.abs(d) < .5 && k > 0) B.yaw += d * Math.min(1, dt * 1.7) * k * (1 - Math.abs(d) / .5 * .5); }
  const leanT = THREE.MathUtils.clamp(Math.atan(B.v * Math.abs(B.v) * Math.tan(B.steer) / (L * g)) * .78, -.44, .44);
  B.leanV += (42 * (leanT - B.lean) - 12 * B.leanV) * dt; B.lean += B.leanV * dt;
  // (on a moving car's roof: he goes along with it)
  if (B.onCar && !B.air) { const t = B.onCar, cv = t.stop > 0 ? 0 : t.v; B.x += Math.sin(t.yaw) * cv * dt; B.z += Math.cos(t.yaw) * cv * dt; }
  const nx = B.x + Math.sin(B.yaw) * B.v * dt, nz = B.z + Math.cos(B.yaw) * B.v * dt;
  // up and down: the ground (and a ramp on it); a hop; off a ramp's lip into the air; the landing
  const rp = rampAt(nx, nz), g0 = track.probe(nx, nz, B.hint).y + rp.h, roof = carRoofAt(nx, nz), RS = roofCar && locals?.backers?.includes(roofCar) ? .32 : .62, ground = roof !== null && B.y >= roof - RS ? Math.max(g0, roof) : g0;   // (RS: how far short of a roof he is still pulled up onto it)
  if (rp.wall && B.v > (track.classic ? 4.3 : 7) && !B.air) { B.x = nx; B.z = nz; crash(); return; } else if (rp.wall && B.v > 2 && !B.air && !(B.staggerT > 0)) { B.staggerT = .8; B.v *= .35; B.jolt = .22; }   // (into a ramp's side: a fall only at speed)
  B.staggerT = (B.staggerT || 0) - dt;
  if (inp.hop && !B.air) { B.air = true; B.vy = (track.classic ? 5.2 : 4.3) + (B.onRamp ? Math.max(0, B.gVel) : 0); B.airRamp = B.onRamp ? (B.onRamp.size || 'plank') : track.classic ? 'hop' : null; }   // (the Classic: a hop high enough for a car's roof, timed well; and a trick off it)   // (hopped off a ramp: higher, and a trick allowed)
  if (B.air) { B.vy -= g * dt; B.y += B.vy * dt; if (B.y <= ground) { B.airRamp = null;
    if (B.trick) { const T = B.trick; B.trick = null;
      if (T.p < .7) { B.y = ground; B.air = false; B.vy = 0; B.airRamp = null; B.done = []; flash('Za późno! Trik od razu po wybiciu'); crash(0); return; }
      const across = Math.abs(q.d) < track.PAVE && Math.acos(Math.min(1, Math.abs(Math.cos(B.yaw - Math.atan2(q.f.x, q.f.z))))) > .87;   // (landed across the road, over 50 degrees off it: not a trick)
      if (T.p < .92 || across) { B.done = []; B.v *= .5; B.jolt = .25; B.staggerT = .8; B.leanV += (Math.random() < .5 ? -1 : 1) * 3; hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'KRZYWO!', '#cf5a3e'); flash('Krzywe lądowanie: trik się nie liczy'); }   // (landed across, not round: no points, a wobble)
      else { if (T.p < 1) T.pulled = true; const all = [...(B.done || []), T]; B.done = [];
      const clean = all.every(o => !o.pulled), n = all.reduce((a, o) => a + o.pts, 0) + (clean ? 1 : 0) + (all.length - 1) * 2;
      const lab = all.map(o => o.name).join(' + ') + (clean ? ' CZYSTO' : ' NA STYK'); logEv('trick', B.x, B.z, { name: lab, clean }); if (track.classic && clean) { B.v = Math.min(9, Math.max(B.v, 5) + 1.6 + all.length * .4); B.boostT = 1.2; hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 'ODPAŁ!', '#9ccad8'); } if (clean) quests.gangRep(.3); audio.play('trick'); score(n, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), lab + ' +' + n, '#efc970'); flash(lab + '! +' + n); } }
    if (roof !== null && ground === roof && !(B.roofT > 0)) { B.roofT = 4; const n = roofCar ? 4 : 2; logEv('roof', B.x, B.z); audio.play('trick'); score(n, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), (roofCar ? 'NA DACH AUTA! +' : 'NA DACH! +') + n, '#efc970'); if (roofCar && locals?.backers?.includes(roofCar) && Math.abs(B.vy) < 1.6) { score(2, rider.root.position.clone().add(new THREE.Vector3(0, 2.4, 0)), 'W PUNKT! +2', '#9ccad8'); } if (roofCar) { const cv = roofCar.stop > 0 ? 0 : roofCar.v; B.v = Math.max(0, B.v - cv * Math.cos(roofCar.yaw - B.yaw)); } if (roofCar) hud.rant(roofCar.car.group.position, pickOf(['ZŁAŹ Z DACHU!', 'TO NIE TAKSÓWKA!', 'LAKIER MI PORYSUJESZ!', 'CO TY ROBISZ?!']), true, 1.7); }   // (landed on a car's roof: a bonus; a moving one, more)
    if (B.vy < -5.2) { B.jolt = .14; B.v *= .9; } else if (B.vy < -2) B.jolt = .07; B.air = false; B.vy = 0; B.trick = null; B.airRamp = null; B.y = ground; B.landed = true; } }
  else { if (ground < B.y - .05 && B.gVel > 1) { const R0 = B.onRamp; if (R0?.course) courseRamp(R0.course); B.air = true; B.vy = R0 ? B.gVel * 1.2 + (R0.size === 'mega' ? 2.2 : R0.size === 'big' ? 1.9 : R0.size === 'kicker' ? .9 : 1.1) : B.gVel; B.airRamp = R0 ? (R0.size || 'plank') : null; B.y += B.vy * dt; } else if (ground < B.y - .35) { B.air = true; B.vy = 0; B.airRamp = null; } else B.y = ground; }   // (off a car's roof, a step: he drops)
  B.onRamp = !B.air && rp.h > .05 ? rp.on : null;   // (the ground fell away as he rose: he flies)
  B.onCar = !B.air && roof !== null && ground === roof ? roofCar : null; B.roofT = (B.roofT || 0) - dt;
  if (B.onCarPrev && B.onCar !== B.onCarPrev) { const t = B.onCarPrev, cv = t.stop > 0 ? 0 : t.v; B.v += cv * Math.cos(t.yaw - B.yaw); } B.onCarPrev = B.onCar;   // (off its roof: he keeps the car's speed; on it, he rode at his own over it)
  B.gVel = B.air || B.landed ? 0 : Math.min(9, (ground - B.gPrev) / dt); B.gPrev = ground; B.landed = false;   // (just landed, on a roof as on the road: no lift from the step up)
  // kerbs, potholes, bags and hedges, bundles; what throws him off
  const kerbNow = Math.abs(q.d) > track.ROAD + .05, kerbWas = Math.abs(B.lastD) > track.ROAD + .05; if (!B.air && kerbNow !== kerbWas && B.v > 1.5) { B.jolt = .08; B.v *= .92; } B.lastD = q.d;
  const clear = C => B.air && B.y - (C.y0 || 0) > C.h - .05;          // (over it, in the air)
  for (const C of track.near(q.i)) {
    if (C.kind === 'ramp' || C.used) continue;
    const fwd = Math.sign(B.v) || 1, h = boxHit(C, nx, nz, .34) || boxHit(C, nx + Math.sin(B.yaw) * .5 * fwd, nz + Math.cos(B.yaw) * .5 * fwd, .22); if (!h) continue;
    if (C.kind === 'manhole') { if (!B.air && Math.abs(B.v) > .8 && Math.hypot(nx - C.x, nz - C.z) < .34) { B.x = nx; B.z = nz; B.jolt = .15; crash(); return; } continue; }   // (the front wheel into it: over the bars; hopped, it is nothing)
    if (C.kind === 'hole') { if (!B.air && !C.cool) { B.jolt = .12; B.v *= .82; C.cool = true; setTimeout(() => { C.cool = false; }, 900); } continue; }
    if (C.kind === 'bundle') { pickBundle(C); continue; }
    if (clear(C)) { if (track.classic && C.kind === 'hard' && !C.car && !C.thing && C.h > .6 && C.h < 2 && !(C.jumpT > performance.now())) { C.jumpT = performance.now() + 4000; score(1, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'PRZESKOK! +1', '#efc970'); } continue; }   // (the Classic: over a fence, a bale, a bench: a point)
    if (C.car && C.roof && B.y >= C.roof - .62) continue;   // (up on that car's roof, or as good as)
    if (C.thing?.kind === 'cone') { if (C.thing.gnome && !C.thing.scored && Math.abs(B.v) > .4) gnomeDown(C.thing); if (Math.abs(B.v) > .4) { stuff.bump(C.thing, Math.sin(B.yaw) * B.v * .9 + (Math.random() - .5), Math.cos(B.yaw) * B.v * .9 + (Math.random() - .5)); B.v *= .9; B.jolt = .06; } continue; }   // (a cone: it goes over, not him)
    if (C.kind === 'soft') { B.v *= Math.pow(.08, dt); continue; }
    if (C.hyd && Math.abs(B.v) > .8 && water.spray(new THREE.Vector3(C.x, C.y0 || 0, C.z), 4.5)) hud.pop(new THREE.Vector3(C.x, (C.y0 || 0) + 1.6, C.z), 'PSSS!', '#9ccad8');   // a hydrant knocked: it gushes
    const into = -(h.nx * Math.sin(B.yaw) + h.nz * Math.cos(B.yaw)) * Math.sign(B.v || 1);   // (how squarely: 1 head on, 0 grazing)
    // (the Classic is slower: its own thresholds for a fall and for a stagger)
    if (B.v * into > (track.classic ? 3.4 : 7.2) && into > (track.classic ? .65 : .75) && (C.h ?? 1) > .6) { const side = (h.nx * -Math.cos(B.yaw) + h.nz * Math.sin(B.yaw)) > 0 ? 1 : -1; B.x = nx; B.z = nz; crash(side); return; }   // (head on into something hard at speed: he goes over away from what he hit)
    if (B.v * into > (track.classic ? 2.2 : 3.6) && into > .55 && !(B.staggerT > 0)) { B.staggerT = .8; B.v *= .4; B.jolt = .26; B.leanV += (Math.random() < .5 ? -1 : 1) * 3; hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 1.8, 0)), pickOf(['OJ!', 'UPS!', 'HOP!', 'UFF!']), '#f6f3ea'); audio.play('kick', { vol: .3 }); }   // (less than that: a stagger, he keeps his seat)
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
    if (h && C.t.car && B.y >= (C.y0 || 0) + (C.trailer ? 1.55 : Math.min(C.t.car.roofH ?? 1.5, 3.2)) - .62) continue;   // (up on its roof, or as good as)
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
  for (const w of track.net?.workers || []) if (!(w.paperT > 0) && Math.hypot(w.x - P.x, w.z - P.z) < .8 && P.y - w.g.position.y - w.y < 2.1) {   // one of the works' crew: he stops to read it
    w.paperT = 30; w.readT = w.kind === 'lean' || w.kind === 'boss' ? 25 : 8; w.face = { x: B.x, z: B.z, t: 1.5 }; hud.rant(w.g.position, pickOf(WORK_PAPER), true, 1.95 + w.y); score(2, w.mouth(), 'DLA EKIPY! +2', '#efc970'); logEv('worker_paper', w.x, w.z); return true; }
  for (const T of track.gnomes || []) if (!T.scored && Math.hypot(T.o.position.x - P.x, T.o.position.z - P.z) < .5 && P.y - T.o.position.y < .8) { stuff.bump(T, Math.sin(B.yaw) * 3, Math.cos(B.yaw) * 3); gnomeDown(T); return true; }
  { const r = locals?.paper(P); if (r) { hud.rant(r.p.g.position, r.text, true, 1.95); score(r.pts ?? (r.who === 'inzynier' ? 3 : 1), r.p.g.position.clone().setY(r.p.g.position.y + 1.9), r.label ?? (r.who === 'inzynier' ? 'KOŁDERKA! +3' : 'DO RĄK! +1'), '#efc970'); logEv(r.ev ?? (r.who === 'inzynier' ? 'homeless_paper' : locals.id + '_paper'), P.x, P.z); return true; } }
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
  for (const w of track.net?.workers || []) add('worker', w.x, w.z, w, 2.6);
  for (const p of locals?.people || []) if (p.g) add(locals.id, p.x, p.z, p, 2.6);
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
// (kicked off his bike: a courier of the Kurier always comes back for it, a cyclist now and then; a courier drops his papers)
function landKick(tg) {
  const at = { rider: () => [tg.ref.B.x, tg.ref.B.z], dog: () => [tg.ref.x, tg.ref.z], ped: () => [tg.ref.x, tg.ref.z], car: () => [tg.ref.x, tg.ref.z], bike: () => [tg.ref.x, tg.ref.z], granny: () => [tg.ref.group.position.x, tg.ref.group.position.z], hyd: () => [tg.ref.x, tg.ref.z], goose: () => [tg.ref.g.position.x, tg.ref.g.position.z], police: () => [tg.ref.g.position.x, tg.ref.g.position.z], gangm: () => [tg.ref.x, tg.ref.z], worker: () => [tg.ref.x, tg.ref.z], bronx: () => [tg.ref.x, tg.ref.z], tourist: () => [tg.ref.x, tg.ref.z], industry: () => [tg.ref.x, tg.ref.z], thing: () => [tg.ref.x, tg.ref.z] }[tg.kind]();
  const ax = at[0] - B.x, az = at[1] - B.z, al = Math.hypot(ax, az) || 1; if (al > (tg.kind === 'car' ? 3.4 : 3.3)) return;   // (it got away)
  const mid = new THREE.Vector3(B.x + ax * .55, B.y + .7, B.z + az * .55);
  logEv('kick_' + (tg.kind === 'thing' ? (tg.ref.kind === 'mailbox' ? 'mailbox' : 'thing') : tg.kind), B.x, B.z);
  if (tg.kind === 'dog') { dogs.kick(tg.ref, { x: ax / al * 4.5 + Math.sin(B.yaw) * B.v * .5, z: az / al * 4.5 + Math.cos(B.yaw) * B.v * .5 }); hud.impact(mid); slowmo = .09; shake = .3; }   // it flies off
  if (tg.kind === 'ped' && quests.onHitPed(tg.ref)) { hud.impact(mid, 'ŁUP!'); slowmo = .08; shake = .25; }   // (the thief: the bag drops)
  else if (tg.kind === 'ped') { hud.impact(mid); tg.ref.stun = 1.6; hud.rant(tg.ref.G.position, pickOf(SWEARS), true, 1.95); slowmo = .06; shake = .22; }   // they stop, and swear after him
  if (tg.kind === locals?.id) { hud.impact(mid); hud.rant(tg.ref.g.position, locals.kick(tg.ref), true, 1.95); slowmo = .06; shake = .22; }   // (the lads: after him)
  if (tg.kind === 'worker') { hud.impact(mid); tg.ref.stun = 1.4; tg.ref.madT = 6; tg.ref.readT = 0; tg.ref.face = { x: B.x, z: B.z, t: 6 }; hud.rant(tg.ref.g.position, pickOf(WORK_KICK), true, 1.95 + tg.ref.y); slowmo = .06; shake = .22; }   // he shakes his fist after him
  if (tg.kind === 'bike' && tg.ref.rival) { logEv('rival_hit', tg.ref.x, tg.ref.z); dropLoot(tg.ref.r.root.position.clone(), 'papers'); flash('Kurier w rowie i zgubił paczkę gazet! Zbierz ją, ale on wstanie i odda.'); }   // (the Kurier's: his papers to pick up, and he comes back for you)
  if (tg.kind === 'bike') { hud.impact(mid); quests.onKnockBike(tg.ref); traffic.knock(tg.ref, new THREE.Vector3(ax / al * 3.2, 0, az / al * 3.2), true); if (tg.ref.rival || Math.random() < .4) foot.grudge(tg.ref); tg.ref.ghostUntil = performance.now() + 5000; hud.rant(tg.ref.r.root.position, pickOf(SWEARS), true, 2.0); slowmo = .06; shake = .22; }
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
function clearCrossings() { for (const X of CROSS) scene.remove(X.group); CROSS.length = 0;
  for (const J of crossJumps) { scene.remove(J.o.group); scene.remove(J.pad); track.dropHit?.(J.C); const ix = track.parked.indexOf(J.P0); if (ix >= 0) track.parked.splice(ix, 1); } crossJumps.length = 0;
  for (const C of crossHidden) { C.used = false; if (C.o) C.o.visible = true; } crossHidden.length = 0; }
// (a way over the rails: on his way before each crossing a strip of speed, then a mega ramp: high enough, the barrier and the train go under
// him; the ramps of the road just past a crossing put away for the run: no waiting at the rails for a ramp behind them)
const crossJumps = [], crossHidden = [], padM = new THREE.MeshBasicMaterial({ color: '#efc930' });
function crossWays(iC, dir) { const N = track.N, ds = track.ds, wrap = i => ((i % N) + N) % N, S = track.S;
  for (const C of track.ramps || []) { if (C.used || C.i == null) continue; const d = Math.abs(((C.i - iC) % N + N * 1.5) % N - N / 2) * ds; if (d < 35) { C.used = true; if (C.o) C.o.visible = false; crossHidden.push(C); } }
  const ri = wrap(iC - dir * Math.round(11 / ds)), A = S[ri], d0 = dir * 1.4, o = track.props.ramp(Math.random, 'mega'), q = track.probe(A.p.x + A.r.x * d0, A.p.z + A.r.z * d0, ri);
  // (aimed along the chord of his flight, not the road's tangent: on a bend the flight stays over the road; the trees on the verge in
  // the way of that flight put away for the run, a trunk caught in the air was a fall out of nowhere)
  const T0 = S[wrap(ri + dir * Math.round(16 / ds))], ax = A.p.x + A.r.x * d0, az = A.p.z + A.r.z * d0, tx = T0.p.x + T0.r.x * d0, tz = T0.p.z + T0.r.z * d0, hl = Math.hypot(tx - ax, tz - az), hx = (tx - ax) / hl, hz = (tz - az) / hl;
  o.group.position.set(ax, q.y, az); o.group.rotation.y = Math.atan2(hx, hz); scene.add(o.group); o.group.updateMatrixWorld(true);
  for (const C of track.colliders || []) { if (C.used || !C.o || !track.things.some(t => t.kind === 'tree' && t.o === C.o)) continue; const vx = C.x - ax, vz = C.z - az, al = vx * hx + vz * hz, la = Math.abs(vx * hz - vz * hx); if (al > -2 && al < 48 && la < 3.2) { C.used = true; C.o.visible = false; crossHidden.push(C); } }
  const C = track.addHit(o.group, o.hit, ri), P0 = { s: ri * ds, d: d0 }; track.parked.push(P0);
  const pi = wrap(ri - dir * Math.round(14 / ds)), B0 = S[pi], pad = new THREE.Group(); for (let k = 0; k < 3; k++) { const ch = new THREE.Mesh(new THREE.BoxGeometry(1.4, .03, .35), padM); ch.position.z = (k - 1) * .7; pad.add(ch); }
  const px_ = B0.p.x + B0.r.x * d0, pz_ = B0.p.z + B0.r.z * d0; pad.position.set(px_, 0, pz_); pad.rotation.y = o.group.rotation.y; scene.add(pad); pad.updateMatrixWorld(true);
  for (const ch of pad.children) { const w = ch.getWorldPosition(new THREE.Vector3()); ch.position.y = track.probe(w.x, w.z, pi).y + .05; }
  crossJumps.push({ o, C, P0, pad, x: px_, z: pz_, used: false, s0: ri * ds, dir, X: CROSS[CROSS.length - 1] }); }
function buildCrossings() { clearCrossings(); if (!LV?.cross) return; const N = track.N, iJ = track.startI, dir = LV.finish.dir;
  for (const fr of LV.cross) { const at = iJ + dir * Math.round(N * LV.finish.to * fr), X = createCrossing({ THREE, toon, track, at }); scene.add(X.group); CROSS.push(X); crossWays(at, dir); } }
function stepCrossings(dt) { if (!CROSS.length) return; const M0 = foot.active ? foot.me : B, me = { x: M0.x, z: M0.z, v: foot.active ? 0 : B.v, yaw: M0.yaw, onFoot: foot.active, h: !foot.active && B.air ? B.y - track.probe(B.x, B.z, B.hint).y : 0 }, tb = traffic.boxes(); trainHitT -= dt;
  for (const J of crossJumps) { if (foot.active || B.air) continue; const d = Math.hypot(B.x - J.x, B.z - J.z); if (d < 1.3 && !J.hot) { J.hot = true; B.v = Math.max(B.v, 12.5); audio.play('trick', { vol: .4 }); if (!J.said) { J.said = true; flash('Rozpęd! Skocznia przed torami: wysoko nad szlabanem, a nawet nad pociągiem'); } } else if (d > 3) J.hot = false; }
  // (the barrier coming down: the cars in his lane wait before the strip of speed, not on his run up to the ramp)
  for (const J of crossJumps) { if (!J.X || J.X.state.mode === 'idle') continue; const L0 = track.N * track.ds;
    for (const q of tb) { if (!q.t || q.t.dir !== J.dir || q.t.stop === undefined) continue; const rel = ((((q.t.s - J.s0) * J.dir) % L0) + L0 * 1.5) % L0 - L0 / 2; if (rel > -30 && rel < -17) q.t.stop = Math.max(q.t.stop, .4); } }
  let ring = false; for (const X of CROSS) { const o = X.update(dt, me, tb); if (X.ringing && Math.hypot(X.center.x - me.x, X.center.z - me.z) < 60) ring = true;
    if (o?.hit === 'over') { logEv('train_jump', me.x, me.z); score(25, new THREE.Vector3(me.x, (B.y || 0) + 2.2, me.z), 'NAD POCIĄGIEM! +25', '#efc970'); flash('Przeskoczyłeś pociąg!'); audio.play('trick'); }
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
      mb.done = true; mb.rival = true; d.done = true; RUN.stolen = (RUN.stolen || 0) + 1; satAdd(-3); mb.flag.rotation.x = -Math.PI / 2; const rp = new THREE.Mesh(paperG, KUR_M); rp.position.copy(w).add(new THREE.Vector3(0, 1.15, 0)); rp.rotation.z = Math.PI / 2; scene.add(rp); (FIN.junk ||= []).push(rp);
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
    if (T.p < 1) { const base = 1 / T.dur, need = (1 - T.p) / Math.max(.03, airLeft() - .05), rate = Math.min(base * 3.6, Math.max(base, need));
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
  { name: 'skośna, z drogą', oblique: 'road', fov: 46 },
  { name: 'skośna, stała', oblique: 'fixed', fov: 46 },
  { name: 'klasyk', oblique: 'road', classic: true, fov: 46 },
];
let camI = track.classic ? CAMS.findIndex(c => c.classic) : 3; const CP = { ...CAMS[camI] };   // (the Classic: its own camera)
function setCam(i) { if (track.classic) { flash('Klasyk ma jedną kamerę'); return; } camI = i; flash(`Kamera ${i + 1}: ${CAMS[i].name}`); }
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
  const T = CAMS[camI], ke = 1 - Math.exp(-dt * 4); if (T.top || T.oblique) { } else if (!T.fpv) for (const k of ['back', 'up', 'ahead', 'lookUp', 'fov']) CP[k] = (CP[k] ?? T[k]) + (T[k] - (CP[k] ?? T[k])) * ke; else CP.fov += (T.fov - CP.fov) * ke;
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
  // skew (oblique), as the old street games: high, behind him and off to his right, looking ahead past him and to the left over the road and
  //   the houses, so a target is in view two or three houses before it comes; 'road': turned with the road (smoothly on the bends), 'fixed':
  //   one angle for the whole run (the road's at the start)
  if (T.oblique) { const sg = Math.sign(Math.sin(B.yaw) * gq.f.x + Math.cos(B.yaw) * gq.f.z) || 1, Y0 = Math.atan2(gq.f.x * sg, gq.f.z * sg);
    if (T.oblique === 'fixed') { if (C.fixY == null || !C.init) C.fixY = Y0; C.oy = C.fixY; } else { if (C.oy == null || !C.init) C.oy = Y0; C.oy += Math.atan2(Math.sin(Y0 - C.oy), Math.cos(Y0 - C.oy)) * Math.min(1, dt * 1.6); }
    const Y = C.oy + (T.classic ? 0 : camUser.yaw), fx = Math.sin(Y), fz = Math.cos(Y), A0 = track.S[gq.i], hs = T.classic && track.oneSide ? Math.sign(-(A0.r.x * track.oneSide) * fz + (A0.r.z * track.oneSide) * fx) || 1 : 1, rx = -fz * hs, rz = fx * hs, k = (T.classic ? 1 : camUser.dist) * (1 + Math.max(0, B.v) * .025 + tw * .15), h = (T.classic ? 7.2 : 9) * k, bk = (T.classic ? 4.2 : 5.5) * k, sd = (T.classic ? 6.8 : 8.5) * k, lk = T.classic ? 3.2 : 1.2;   // (the Classic: lower, nearer, turned more to the houses)
    const want = new THREE.Vector3(B.x - fx * bk - rx * sd, C.gy + h, B.z - fz * bk - rz * sd), look = new THREE.Vector3(B.x + fx * 6.5 + rx * lk, C.gy + .4, B.z + fz * 6.5 + rz * lk);
    { const gw = track.probe(want.x, want.z, gq.i).y; if (want.y < gw + 3) want.y = gw + 3; }   // (never in a hill)
    if (!C.init) { C.gy = B.y; C.pos.copy(want); C.init = true; }
    C.pos.lerp(want, 1 - Math.exp(-dt * 5)); camera.position.copy(C.pos); camera.up.set(0, 1, 0); camera.lookAt(look);
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
  { const sp = Math.min(1, Math.max(0, B.v) / 9), rum = (Math.abs(gq.d) > track.PAVE && !track.paved(B.x, B.z) ? .035 : Math.abs(gq.d) > track.KERB ? .014 : .006) * sp * (B.air || B.crash ? 0 : 1), t = performance.now() / 1000;
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
  for (const d of track.doors) { if (!d.sub || d.done) continue; const dx = d.p.x - P.x, dz = d.p.z - P.z, l = Math.hypot(dx, dz); if (l > markNear(d.p) || l < 2 || (dx * fx + dz * fz) / l < -.2) continue; const h = !AS().marks ? 0 : hot.L?.door === d ? 1 : hot.R?.door === d ? -1 : 0;   // (in reach of a tap: which button sends it there)
    const H = h > 0 ? hot.L : h < 0 ? hot.R : null;   // (in reach: over where it would go, the mailbox or the door step)
    out.push({ p: H ? H.p.clone().setY(H.p.y + 1.9) : new THREE.Vector3(d.p.x, d.p.y + 3, d.p.z), s: 'sub', col: TITLES[d.sub].col, hot: h, q: H ? tapQ(H).q : 0, label: h ? (h > 0 ? (pad.active ? 'LB' : 'LPM') : (pad.active ? 'RB' : 'PPM')) : null }); } return out; }
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
  traffic.update(dt, { clear: FIN.on ? FIN.clear : null, pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsNow(), bus: modes.flags.bus, peds: [...peds.crossing(), ...(locals?.crossing?.() || [])], onCar: B.onCar, high: B.air && B.y - q.y > 1.2, s: q.s, d: q.d, v: B.v, along: Math.sign(Math.sin(B.yaw) * f.x + Math.cos(B.yaw) * f.z) || 1 });
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
// the road works' crew: what they shout at him riding by, say when spoken to (by who he is), when kicked, when thrown a paper
const WORK_SHOUT = ['UWAGA, KOPIEMY!', 'OBJAZD, PANIE!', 'NIE TĘDY, MŁODY!', 'TU DZIURA NA DWA METRY!', 'ZWOLNIJ, BO CIĘ ZAKOPIEMY!', 'JEDEN PAS, NIE WIDZISZ?!'];
const WORK_LINES = { mason: ['Cegła po cegle. Jak w życiu, tylko w życiu szybciej się sypie.', 'Uważaj tam na dole! Ja nie odpowiadam za grawitację.', 'Szef mówi, że do piątku skończymy. Nie mówi, którego.'], dig: ['Kopiemy od wtorku. Rury znaleźliśmy, tylko nie te.', 'Zakopiemy, to przyjdą od gazu i znowu rozkopią.', 'Co tak patrzysz? Dziury nie widziałeś?'],
  lean: ['Ja nadzoruję. To też praca, tylko mniej widać.', 'Łopata jest do opierania. Do kopania jest Zbyszek.', 'Przerwa śniadaniowa. Od siódmej.'],
  jack: ['CO?! NIE SŁYSZĘ!', 'MÓW GŁOŚNIEJ, MŁOTEK CHODZI!', 'JAK SKOŃCZĘ, TO POGADAMY! ZA TRZY TYGODNIE!'],
  flag: ['Stoisz na czerwonym, kolego.', 'Ja tu tylko obracam lizaka. Osiem godzin.', 'Zielone! A nie, jednak czerwone.'],
  boss: ['Termin? Termin jest w umowie. Umowa jest w biurze.', 'Wszystko zgodnie z planem. Planu jeszcze nie ma.', 'Pan z gazety? Proszę napisać, że idzie sprawnie.'],
  annoyed: ['Idź już, robota czeka.', 'Kierownik patrzy, spadaj.', 'No idź, bo nas zgłoszą, że stoimy.'] };
const MASON_SHOUT = ['UWAGA, CEGŁA!', 'NA DOLE! GÓRA IDZIE!', 'NIE STÓJ POD RUSZTOWANIEM!', 'ZEJDŹ Z CHODNIKA, MŁODY!'];
// a brick off a scaffold: a word from above as it goes; it lands: on him (down he goes), or by him (a crack and the dust)
function netEvent(e) { director.poke();
  if (e.kind === 'brickWarn') { const w = (track.net?.workers || []).filter(q => q.kind === 'mason').sort((a, b) => a.g.position.distanceToSquared(e.at) - b.g.position.distanceToSquared(e.at))[0]; if (w) hud.rant(w.g.position, pickOf(['UWAGA!', 'CEGŁA!', 'OJEJ!', 'ŁAP... NIE, NIE ŁAP!']), true, 1.95 + w.y); }
  if (e.kind === 'brick') { logEv('brick', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash('Cegła z rusztowania! Pod rusztowaniem patrz na cień na chodniku.'); }
  if (e.kind === 'brickMiss') audio.play('land', { vol: .6 }); }
const WORK_KICK = ['EJ! JA W PRACY JESTEM!', 'ZARAZ CIĘ ZAKOPIĘ!', 'BHP SIĘ KŁANIA!', 'ZBYCHU, WIDZIAŁEŚ TO?!'];
const WORK_PAPER = ['O, GAZETA! PRZERWA!', 'DZIĘKI! BĘDZIE CO CZYTAĆ!', 'EJ! W KASK TRAFIŁEŚ!', 'KIEROWNIK, ZOBACZ, CO PISZĄ!'];
// the estate's lads and the engineer (the Bronx): spoken to, each in his own way; what happens to him there at night
function localTalk(me) { if (!locals) return false; let p = null, bd = 2.8; for (const q of locals.people) { if (!q.g) continue; const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < bd) { bd = d; p = q; } } if (!p) return false;
  hud.rant(me.mouth, pickOf(TALK), true); const text = locals.talk(p); setTimeout(() => hud.rant(p.g.position.clone().add(new THREE.Vector3(0, 1.9, 0)), text), 800); return true; }
// the director's small things: a word from whoever is there, a bounce, a fall
function dirEvent(e) {
  if (e.kind === 'shout' && e.at) hud.rant(e.at, e.text, true);
  if (e.kind === 'flap') audio.play('rustle', { vol: .4 });
  if (e.kind === 'wobble') { B.v *= .6; B.jolt = .2; if (e.at) hud.impact(e.at, e.text); }
  if (e.kind === 'crash') { if (e.at) hud.impact(e.at, e.text); if (e.text === 'DRZWI!') logEv('dooring', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); } }
function localEvent(e) { director.poke();
  if (e.kind === 'bump') { B.v *= .35; B.jolt = .2; hud.rant(e.p.g.position, pickOf(['UWAŻAJ!', 'OJ!', 'SORRY!', 'MOJA KAMERA!']), true, 1.95); logEv('bump_' + locals.id, B.x, B.z); }
  if (e.kind === 'shout' && e.p?.g) hud.rant(e.p.g.position, e.text, true, 1.95);
  if (e.kind === 'catch') { if (e.p?.g) hud.rant(e.p.g.position, e.text, true, 1.95); logEv('cwaniak_catch', B.x, B.z); if (!foot.active) crash(Math.random() < .5 ? -1 : 1); else flash('Dogonili cię. Na szczęście tylko gadają.'); }
  if (e.kind === 'load') { logEv('load', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash('Ładunek z suwnicy! Patrz na cień na jezdni.'); }
  if (e.kind === 'forklift') { logEv('forklift', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash('Wózek widłowy ma pierwszeństwo. Zawsze.'); }
  if (e.kind === 'driveway') { logEv('driveway', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash(e.why === 'early' ? 'Za wcześnie! Skok już opadał, zanim doleciałeś do dachu.' : e.why === 'late' ? 'Za późno! Skacz kilka metrów przed autem, żeby być w górze nad nim.' : 'Auto wyjechało tyłem z podjazdu. Białe światła z tyłu: zaraz rusza!'); }
  if (e.kind === 'truck') { logEv('truck', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash('Śmieciarka! Objedź ją szerokim łukiem.'); }
  if (e.kind === 'owner') { logEv('owner_kick', B.x, B.z); hud.impact(e.p.g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 'KOP!'); crash(Math.random() < .5 ? -1 : 1); flash('Dogonił cię za tę szybę. Następnym razem dociśnij gazu!'); }
  if (e.kind === 'leash') { B.v *= .4; B.jolt = .25; B.leanV += (Math.random() < .5 ? -1 : 1) * 3; logEv('leash', B.x, B.z); }
  if (e.kind === 'ball') { B.v *= .7; B.jolt = .18; hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 'PIŁKA!', '#f6f3ea'); }
  if (e.kind === 'pts') { score(e.n, rider.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)), e.text, '#efc970'); audio.play('trick'); }
  if (e.kind === 'gull') { const at = rider.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)); if (e.ok) { score(2, at, 'UNIK MEWY! +2', '#efc970'); audio.play('trick'); }
    else if (B.papers > 0) { B.papers--; syncMix(); hud.pop(at, 'MEWA ZABRAŁA GAZETĘ! -1', '#cf5a3e'); audio.play('kick', { vol: .3 }); } }
  if (e.kind === 'flock') { score(1, e.at.clone().add(new THREE.Vector3(0, 1.6, 0)), e.text, '#f6f3ea'); }
  if (e.kind === 'overhead') { logEv('overhead', B.x, B.z); score(3, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'NAD GŁOWAMI! +3', '#efc970'); audio.play('trick'); }
  if (e.kind === 'wet') { B.v *= .8; B.jolt = .2; B.leanV += (Math.random() < .5 ? -1 : 1) * 2.5; hud.pop(rider.root.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 'PLUSK!', '#9ccad8'); audio.play('kick', { vol: .2 }); }
  if (e.kind === 'combine') { logEv('combine', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash('Kombajn zajmuje prawie całą drogę. Zjedź na pobocze albo przeskocz heder!'); }
  if (e.kind === 'beep') audio.play('ui', { vol: .25 });
  if (e.kind === 'honk') audio.play('horn', { vol: .35 });
  if (e.kind === 'reverse') { logEv('reverse', B.x, B.z); crash(Math.random() < .5 ? -1 : 1, new THREE.Vector3(0, 0, 0)); flash('Auto cofało z garażu. Patrz na otwarte boksy.'); }
  if (e.kind === 'tyre') { logEv('tyre', B.x, B.z); crash(Math.random() < .5 ? -1 : 1); flash(track.winter ? 'Sanki z górki! Patrz na boki.' : 'Opona z naprzeciwka! Patrz na boki.'); }
  if (e.kind === 'glass') { B.flatT = 7; audio.play('glass', { vol: .45 }); flash('Szkło! Opona flaczeje, przez chwilę jedzie się ciężej'); logEv('glass', B.x, B.z); }
  if (e.kind === 'push' && e.p?.g) { hud.rant(e.p.g.position, e.text, true, 1.95); flash('Ktoś wypchnął kosz na drogę!'); } }
function workTalk(me) { let w = null, bd = 2.8; for (const q of track.net?.workers || []) { const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < bd) { bd = d; w = q; } } if (!w) return false;
  w.talks = (w.talkT > 0 ? w.talks : 0) + 1; w.talkT = 20; w.face = { x: me.x, z: me.z, t: 3 }; hud.rant(me.mouth, pickOf(TALK), true);
  setTimeout(() => hud.rant(w.mouth(), w.talks >= 3 ? pickOf(WORK_LINES.annoyed) : pickOf(WORK_LINES[w.kind])), 800); return true; }
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
    else if (!workTalk(me) && !localTalk(me) && !(geese && gooseTalk(me))) hud.rant(me.mouth, pickOf(['HALO?', 'NIKOGO...', 'HEJ!']), true); }
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
  traffic.update(dt, { clear: FIN.on ? FIN.clear : null, pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsNow(), bus: modes.flags.bus, peds: [...peds.crossing(), ...(locals?.crossing?.() || [])], s: q.s, d: q.d, v, along: Math.sign(Math.sin(me.yaw) * f.x + Math.cos(me.yaw) * f.z) || 1 });
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
  touch.setMode(foot.active ? (foot.fighting ? 'fight' : 'foot') : track.classic ? 'classic' : 'bike'); touch.show(!menu.open && !asking && !look.isOpen && !shop.isOpen && !runUI.isOpen && !book.isOpen && !(talk.isOpen && !talk.isLight)); touch.chat(!foot.active && quests.canChat);
  hudEl.style.visibility = menu.page === 'title' ? 'hidden' : '';   // (the title screen: nothing of the ride's own display behind it)
  hud.draw(dt, project, { title: menu.page === 'title', bagX: menu.page !== 'title' ? hudBag.left : null, bagY: hudBag.top, marks: quests.marks().concat(subMarks(), mpMarks(), jobMarks()), mix: menu.page !== 'title' ? { order: ACT().map(t => ({ n: B.mix[t], col: TITLES[t].col, on: t === TK[B.sel] })), name: TITLES[TK[B.sel]].short } : null, quests: quests.tracker(), projEdge: projectEdge, hp: menu.page !== 'title' ? (B.hp ?? 100) : null, sat: menu.page !== 'title' && LV && B.sat != null ? B.sat : null, fame: B.fame || 0, siren: quests.siren, power: B.charge ? B.charge.p : -1, head, tired: B.tired, spent: B.spent, rattled: Math.max(0, ((B.rattled || 0) - 2.2) / 4.3), barks: barkers.filter(n => n.dog.bark > 0).map(n => new THREE.Vector3(n.dog.x, B.y + .95, n.dog.z)), papers: B.papers, points: B.points, fight: fs && fs.fight, low: fs ? fs.low : 0, star: fs && fs.star, cross: foot.active && mouse.locked && foot.view === 'first' && !(fs && fs.star), bike: bikeMark() });
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
// (which game: Poranna Trasa, or the Classic (docs/klasyk.md): chosen on the title screen, kept in this browser)
const EDITIONS = { trasa: 'PORANNA TRASA', klasyk: 'KLASYK' };
let editionK = EDITION;   // (one game a copy: edition.js)
// (the title's backdrop by the game chosen, without a reload: each game's street once seen behind the title is kept as a picture; switched,
// the picture fades in over the world loaded (the menu at once), and the world itself is loaded only on GRAJ or a route; not seen yet: a
// fade to black and the page goes there)
const TBG = { t: 0, saved: false, el: (() => { const im = document.createElement('img'); Object.assign(im.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 3, opacity: 0, transition: 'opacity .55s ease', background: '#0c0d0f' }); document.body.appendChild(im); return im; })() };
const worldEd = () => track.classic ? 'klasyk' : 'trasa';
function titleBg() { const want = editionK; if (want === worldEd()) { TBG.el.style.opacity = 0; return; } let pic = null; try { pic = localStorage.getItem('pt.tbg.' + want); } catch { }
  if (pic) { TBG.el.src = pic; TBG.el.style.opacity = 1; return; }
  TBG.el.removeAttribute('src'); TBG.el.style.opacity = 1; setTimeout(() => { location.search = want === 'klasyk' ? '?mapa=klasyk' : ''; }, 560); }
function stepTitleBg(dt) { if (menu.page !== 'title' || TBG.saved) { if (menu.page !== 'title' && TBG.el.style.opacity !== '0') TBG.el.style.opacity = 0; return; } if ((TBG.t += dt) < 2.5) return; TBG.saved = true;
  try { localStorage.setItem('pt.tbg.' + worldEd(), canvas.toDataURL('image/jpeg', .8)); } catch { } }
const editionMenu = { classic: () => editionK === 'klasyk', extra: () => editionK === 'klasyk' ? [['k1', 'KLASYK 1: KASZTANOWA'], ['k2', 'KLASYK 2: WIEŚ'], ['k3', 'KLASYK 3: PARK'], ['k4', 'KLASYK 4: DEPTAK'], ['k5', 'KLASYK 5: ZIMA']].filter(([id]) => LVM.isOpen(id)).map(([id, t]) => ({ label: t + LVM.medalOf(id).tag, act: () => startLevel(id) })) : [], name: () => EDITIONS[editionK], next: () => { }, switchable: false, title: () => TITLE, subtitle: () => SUBTITLE };
const menu = createMenu({ assist: assistMenu, gore: goreMenu, radio: radioMenu, edition: editionMenu, tests: () => testRows(), onMap: () => openMap(), onPlay: () => { if (editionK === 'klasyk') { if (LV?.id !== 'k1') startLevel('k1'); return; } if (track.classic) { goRegion('peryferia', null, null); return; } flash(keysOf('map') + ': MAPA TRASY. Wybierz odcinek albo jeździj swobodnie'); }, modes: () => [{ label: 'KLASYCZNA TRASA', act: () => { if (modes.id) modes.stop(); if (mp.on) mp.stop(); } }, ...Object.entries(MODES).map(([id, m]) => ({ label: m.name, info: m.info, act: () => { if (mp.on) mp.stop(); modes.start(id); } })), { label: 'GRA PRZEZ SIEĆ (2 GRACZY)', info: 'WYŚCIG, RAZEM, BEREK, WSPÓLNA JAZDA', act: () => { if (modes.id) modes.stop(); mp.openLobby(); } }], sound: { get: k => audio.get(k), set: (k, v) => audio.set(k, v) }, hud, look, styles: MENU_STYLES, light: LIGHT, presets: PRESETS, onRestart: () => askReset(true), onFull: toggleFull, onKeys: () => toggleKeys(), controls, lab: LAB, onPlay: () => { C.init = false; },
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
  if (!asking && on('reset', e.code)) { if (LV && !MP.on) { startLevel(LV.id); flash('Od nowa: ' + LV.name); } else askReset(true); e.preventDefault(); return; }   // (on a route: straight back to its start; the whole game's reset is in the menu)
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
  border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 2px 8px; pointer-events: none; } #lvhud.on { display: flex; } #lvhud b { color: #efc970; font-weight: normal; } #lvhud .job { color: #8fc3f0; } #lvhud .live { color: #cf5a3e; animation: lvw 1s steps(1) infinite; } #radio em.take { display: block; font-style: normal; color: #9fd27a; margin-top: 2px; } #lvhud { flex-wrap: wrap; justify-content: center; max-width: 92vw; } #lvhud .w { color: #cf5a3e; animation: lvw .5s steps(1) infinite; } @keyframes lvw { 50% { opacity: .3; } }
  @media (max-width: 639px) { #lvhud { top: calc(env(safe-area-inset-top, 0px) + 128px); font-size: 12px; white-space: normal; gap: 2px 8px; max-width: 96vw; } #lvhud b { flex-basis: 100%; text-align: center; } }`; document.head.appendChild(st); }
const RUN = { t: 0, go: false, cp: 0, cps: [], done: false, gate: [], hits: [], chk: 0 };
const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const partLabel = (k, i) => { const t = PARTS[k].tiers[i].name; return t === PARTS[k].name ? t : `${PARTS[k].name}: ${t}`; };
function saveCampaign() { LVM.save({ money: B.points, bike: myBike, inv: INV.map(p => ({ ...p })), paints: [...PAINTS], at: LV?.id || 'dom' }); }
function applySave() { if (!LVM.hasSave()) return; const S = LVM.load(); if (S.bike?.type) { myBike = { type: S.bike.type, parts: { ...newParts(), ...(S.bike.parts || {}) }, ...(S.bike.paint ? { paint: S.bike.paint } : {}) }; }
  if (S.owned?.licznik) cyclo.skin(S.owned.licznik); INV.splice(0, INV.length, ...(S.inv || [])); PAINTS.clear(); for (const k of [0, ...(S.paints || [])]) PAINTS.add(k); B.points = S.money || 0; applyBike(); }
setTimeout(applySave, 0);
{ const pz = new URLSearchParams(location.search).get('poziom'); if (pz) setTimeout(() => { const q = new URLSearchParams(location.search); q.delete('poziom'); history.replaceState(null, '', location.pathname + '?' + q.toString().replace(/=(&|$)/g, '$1')); startLevel(pz); let tp = null; try { tp = JSON.parse(sessionStorage.getItem('pt.tp') || 'null'); sessionStorage.removeItem('pt.tp'); } catch { } if (tp?.id === pz) setTimeout(() => tpFinale(tp.where), 900); }, 60); }
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
function goRegion(region, poziom, mapa) { saveCampaign(); const q = new URLSearchParams(location.search); q.set('play', ''); if (region && region !== 'peryferia') q.set('region', region); else q.delete('region'); if (mapa) q.set('mapa', mapa); else q.delete('mapa'); if (poziom) q.set('poziom', poziom); else q.delete('poziom'); location.search = q.toString().replace(/=(&|$)/g, '$1'); }
// the morning's fog on a level that has it: the far end of the view pulled in (25 m clear, gone by 55), the colour of wet air
const FOG0 = { near: scene.fog.near, far: scene.fog.far, col: scene.fog.color.clone() };
function setFog(on) { scene.fog.near = on ? 12 : FOG0.near; scene.fog.far = on ? 55 : FOG0.far; scene.fog.color.copy(on ? new THREE.Color('#d9ddd6') : FOG0.col); }
// (the opening shot from in front of him: only the very first start, from home; later ones start on the road, from behind)
// (another region, or this route's own map: the world built anew)
function startLevel(id) { const L0 = LVM.LEVEL(id); if (!L0 || L0.soon) return; if (L0.region !== track.region || (L0.map || '') !== track.map) { goRegion(L0.region, id, L0.map); return; } const mods = LVM.mods(), L = LVM.withMods(L0, mods); RUN.mods = mods; if (modes.id) modes.stop(); if (mp.on) mp.stop(); if (fin.isOpen) fin.close();
  if (L.finish.m) L.finish = { ...L.finish, to: Math.min(L.finish.m, track.len - 200) / track.len };   // (at least 200 m of the road going on between the finish and the start behind him)
  LV = L; SUBR = seeded(L.seed); resetGame(); SUBR = Math.random; if (!(id === 'p1' && !LVM.load().done?.p1)) { C.iy = 0; C.yaw = B.yaw; C.init = false; } const S = LVM.load(); B.points = S.money || 0; B.lastPts = B.points; RUN.p0 = B.points; B.papers = L.papers; B.mix = { trabka: B.papers, wiesci: 0, sport: 0 }; if (L.titles > 1) { const A = ACT(); TK.forEach(t => B.mix[t] = 0); A.forEach((t, k) => B.mix[t] = Math.floor(B.papers / A.length) + (k < B.papers % A.length ? 1 : 0)); }
  RUN.week = null; RUN.rushHour = false; if (L.classic) weekStart(L);
  traffic.clearAround?.(track.probe(B.x, B.z, B.hint).s, 80);
  const iJ = track.startI, N = track.N, steps = Math.round(L.finish.to * 4); RUN.cps = []; for (let k = 1; k <= steps; k++) RUN.cps.push(((iJ + L.finish.dir * Math.round(N * L.finish.to * k / steps)) % N + N) % N);
  // (the finish where the run starts (a whole lap): the gate and the finale's course not there yet, at home, in sight from the start;
  // both put up half way round, when home is far behind)
  { const iF = RUN.cps[RUN.cps.length - 1], gap = Math.abs(((iF - iJ) % N + N * 1.5) % N - N / 2) * track.ds; RUN.late = gap < Math.min(300, L.finish.to * track.len * .45) + 80; }
  if (RUN.late) { clearFinale(); clearGate(); try { buildFinale(); renderer.compile(scene, camera); } catch (e) { console.warn('course warm-up', e); } clearFinale(); } else buildFinale(); buildCrossings(); setFog(!!LV.fog); traffic.rivals(LV.rivals || 0); if (LV.rivals) setTimeout(() => flash('Kurier Osiedlowy na trasie! Wyprzedź ich, kopnij albo trafiaj gazetą, zanim podbiorą skrzynki'), 2400); if (LV.fog) setTimeout(() => flash('Mgła! Widać na kilkadziesiąt metrów. Przejazd słychać, zanim go widać'), 1800); bindJobs(); { const S1 = LVM.load(); LVM.save({ runs: (S1.runs || 0) + 1 }); } Object.assign(RAD, { fin: false, cool: 6, idle: 40, gag: false }); if (LV2.cur?.box) scene.remove(LV2.cur.box); Object.assign(LV2, { offer: null, cur: null, next: 30 + Math.random() * 20 }); Object.assign(RUN, { shots: [], stolen: 0, rivalHits: 0, boxed: 0, far: 0, mudSaid: false, crossSaid: false, gooseMad: 0, t: 0, go: false, cp: 0, done: false, chk: 0, minA: Infinity, prevA: 1e9, log: [], snaps: [], dogOn: false, dogT: -99, stops: undefined, maxStreak: 0 }); if (!RUN.late) buildGate(RUN.cps[RUN.cps.length - 1]); lvHud.classList.add('on'); saveCampaign();
  flash(`${L.name}: ${track.home?.homeH ? 'wyjedź z domu' : 'ruszaj'} i dojedź do mety` + (mods.length ? ` · umowa: +${Math.round(LVM.modBonus(mods) * 100)}% premii` : '')); }
function goHome() { if (fin.isOpen) fin.close(); clearFinale(); clearCrossings(); setFog(false); traffic.rivals(0); if (track.region !== 'peryferia' || (track.map || '') !== (EDITION === 'klasyk' ? 'klasyk' : '')) { goRegion('peryferia', null, EDITION === 'klasyk' ? 'klasyk' : null); return; } LV = null; clearGate(); lvHud.classList.remove('on'); resetGame(); const S = LVM.load(); if (LVM.hasSave()) B.points = S.money || 0; B.lastPts = B.points; flash('W domu: jeździsz swobodnie. ' + keysOf('map') + ': mapa'); }
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
const RAD = { t: 0, cool: 6, idle: 50, turbo: 0, sprint: false, fin: false, behind: 0, fall: 0, face: null, el: null, typ: 0, since: 99 };
{ const st = document.createElement('style'); st.textContent = `#radio { position: fixed; z-index: 4; left: 12px; top: 128px; width: min(360px, 60vw); display: none; gap: 8px; align-items: flex-start; font: 16px/20px PTPix, ui-monospace, monospace; color: #f6f3ea; border: 6px solid transparent; border-image: var(--px-chip) 3 fill / 6px; padding: 4px 8px; pointer-events: none; }
  #radio.on { display: flex; } #radio img { width: 40px; height: 40px; image-rendering: pixelated; border: 2px solid #17181b; flex: none; } #radio b { display: block; font-weight: normal; color: #efc970; } #radio b i { display: inline-block; width: 8px; height: 8px; background: #cf5a3e; margin-right: 6px; animation: rad-on .6s steps(1) infinite; } @keyframes rad-on { 50% { opacity: 0; } }
  #radio.turbo { border-image-source: var(--px-sel); color: #17181b; } #radio.turbo b { color: #8e2e25; } @media (max-width: 640px) { #radio { top: 96px; } }`; document.head.appendChild(st); }
// (what he says by himself: not too often, by the setting)
function radioSay(kind, line, who = 'janusz', extra = '') { const S = LVM.load(); if (!S.owned?.sluchawka) return;
  if (radioK === 'off') return;
  if (SELF.includes(kind)) { const Mo = RADIO_MODES[radioK]; if (RAD.since < Mo.gap || Math.random() > Mo.odds) return; } RAD.since = 0; if (!RAD.el) { RAD.el = document.createElement('div'); RAD.el.id = 'radio'; document.body.appendChild(RAD.el); }
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
  if (radioK !== 'off' && !LV2.offer && !LV2.cur && RUN.go && (LV2.next -= dt) <= 0 && RAD.t <= 0) { LV2.next = (radioK === 'often' ? 45 : 110) + Math.random() * 40; liveOffer(); }
  const J = LV2.cur; if (!J) return; if ((J.left -= dt) <= 0) { liveEnd(false); return; } const evs = (RUN.log || []).slice(J.log0);
  if (J.kind === 'door' && Math.hypot(me.x - J.door.p.x, me.z - J.door.p.z) < 5 && sp < 2.2) liveEnd(true);
  if (J.kind === 'parcel') { if (!J.got && Math.hypot(me.x - J.box.position.x, me.z - J.box.position.z) < 1.8) { J.got = true; scene.remove(J.box); J.box = null; audio.play('pick'); flash('Paczuszka w torbie. Teraz pod drzwi ze znaczkiem.'); } else if (J.got && Math.hypot(me.x - J.door.p.x, me.z - J.door.p.z) < 5 && sp < 2.2) liveEnd(true); }
  if (J.kind === 'bike' && evs.some(e => e.kind === 'kick_bike')) liveEnd(true);
  if (J.kind === 'trick' && evs.some(e => e.kind === 'trick')) liveEnd(true);
  if (J.kind === 'rush' && RUN.cp > J.cp) liveEnd(true);
  if (J.kind === 'dog' && J.snapped) liveEnd(true); }
// a scene on the earpiece: Janusz, you, Janusz (each in turn, the box his or yours)
function radioScene(lines, solo) { let k = 0; const next = () => { if (k >= lines.length) return; const mine = !solo && k % 2 === 1; radioSay('', lines[k], mine ? 'ty' : 'janusz'); if (mine) RAD.el.querySelector('b').innerHTML = '<i></i>TY'; k++; setTimeout(next, 900 + lines[k - 1].length * 45); }; next(); }
function stepRadio(dt, inp) { RAD.since += dt; if (RAD.t > 0 && (RAD.t -= dt) <= 0) RAD.el?.classList.remove('on'); RAD.turbo = Math.max(0, RAD.turbo - dt); RAD.cool -= dt; RAD.behind -= dt; RAD.fall -= dt;
  if (!LVM.load().owned?.sluchawka || foot.active || menu.open) { RAD.sprint = !!inp.sprint; return; }
  if (inp.sprint && !RAD.sprint && RAD.cool <= 0 && B.v > 3) { RAD.turbo = 3.5; RAD.cool = 22; radioSay('turbo'); audio.play('trick', { vol: .4 }); } RAD.sprint = !!inp.sprint;
  if (RAD.behind <= 0) { const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw); for (const t of traffic.list || []) { const p = t.car?.group?.position; if (!p) continue; const dx = p.x - B.x, dz = p.z - B.z, l = Math.hypot(dx, dz); if (l < 9 && (dx * fx + dz * fz) / l < -.6) { RAD.behind = 30; radioSay('behind'); break; } } }
  if (radioK !== 'off' && LV && !RUN.done && RAD.t <= 0 && (RAD.idle -= dt) <= 0) { RAD.idle = 45 + Math.random() * 35; const S0 = LVM.load(), gagOk = !RAD.gag && S0.gagRun !== (S0.runs || 0) - 1; if (gagOk && Math.random() < .3) { RAD.gag = true; LVM.save({ gagRun: S0.runs || 0 }); audio.play('ui'); if (Math.random() < .5) radioScene(draw('mixup', JB.MIXUP)); else radioScene([...draw('pocket', JB.POCKET), draw('pocketEnd', JB.POCKET_END)], true); } else radioSay('idle'); } }
// ---------- the final straight (the last 130 m before a stretch's finish): a banner over the road, a slalom of cones, a kicker, four
// targets by the road to hit with a paper; at the finish a beat of slow motion and a flash. What it came to: a bonus, and in the paper ----------
const FIN = { G: new THREE.Group(), cones: [], targets: [], trenches: [], rings: [], pads: [], hits: [], on: false, entered: false, res: null, combo: 0, comboT: 0, t: 0 };
scene.add(FIN.G);
function clearFinale() { track.net?.setWorks?.(true); for (const K of FIN.carsOff || []) { K.o.visible = true; K.C.used = false; if (!track.parked.includes(K.P0)) track.parked.push(K.P0); } FIN.carsOff = []; for (const o of FIN.junk || []) scene.remove(o); FIN.junk = []; for (const h of FIN.hits) track.dropHit(h); while (FIN.G.children.length) FIN.G.remove(FIN.G.children[0]); Object.assign(FIN, { cones: [], targets: [], trenches: [], rings: [], pads: [], hits: [], on: false }); }
// the final straight (the last 180 m): a banner; a slalom; an arrow pad (a push); a kicker and a trench across the road to clear (in the
// air: or a fall); big targets by the road, others that pop up as you come, one swinging over the road on a rope; golden rings in the
// air after the second kicker; a double trench; pads again to the line. Scoring things one after another: a combo (x2, x3)
const finL = () => Math.min(track.classic ? 270 : 300, LV.finish.to * track.len * .45);
function buildFinale() { clearFinale(); { const sF = RUN.cps[RUN.cps.length - 1] * track.ds, FL0 = finL() + 25, d0 = LV.finish.dir; FIN.clear = d0 > 0 ? [sF - FL0, sF + 15] : [sF - 15, sF + FL0]; } const N = track.N, ds = track.ds, dir = LV.finish.dir, iF = RUN.cps[RUN.cps.length - 1], S = track.S, FL = finL(), u = k => k * FL;
  const at = (m0, d) => { const m = m0 <= 1.0001 ? u(m0) : m0; const i = ((iF - dir * Math.round(m / ds)) % N + N) % N, A = S[i], x = A.p.x + A.r.x * d * dir, z = A.p.z + A.r.z * d * dir; return { i, x, z, y: track.probe(x, z, i).y, yaw: Math.atan2(A.f.x * dir, A.f.z * dir), f: new THREE.Vector3(A.f.x * dir, 0, A.f.z * dir), r: new THREE.Vector3(A.r.x * dir, 0, A.r.z * dir) }; };
  const M = c => toon(c), coneM = M('#e8692c'), bandM = M('#f6f3ea'), postM = M('#f6f3ea'), wood = M('#9e7a4f'), dark = M('#1d1e21'), gold = M('#efc970'), red = M('#cf5a3e');
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  const W = track.ROAD, WIES = track.region === 'wies';
  // (the village's: round bales of hay, lying, their ends spiralled; one to ride into rolls away)
  const hayM = M('#d9b45a'), hayEnd = (() => { const t = cv(16, 16, g => { g.fillStyle = '#c9a04a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#a8832f'; for (let a = 0; a < 26; a += .25) { const r = a * .28; g.fillRect(Math.round(7.5 + Math.cos(a) * r), Math.round(7.5 + Math.sin(a) * r), 1, 1); } }); return new THREE.MeshBasicMaterial({ map: t }); })();
  // (the course in the map's own things: in the park planters of flowers and a pond for the trench, by the sea deck chairs and a sand
  // pit, in winter snowmen and a hole in the ice; in the street the cones of a training course)
  const THEME = WIES ? 'wies' : track.park ? 'park' : track.sea ? 'deptak' : track.winter ? 'zima' : 'ulica', WATER = WIES || THEME === 'park';
  const snowM = M('#f2f5f8'), coalM = M('#1d1e21'), carrotM = M('#e8692c'), potM = M('#a0522d'), soilM2 = M('#4a3524'), petalM = ['#e070b0', '#efc930', '#f6f3ea', '#cf5a3e'].map(M), stemM = M('#467537'), chairW = M('#9e7a4f'), chairC = [M('#3b6fa0'), M('#cf5a3e'), M('#efc930')];
  const canvasM = [];
  const prop = (s = 1) => { const g = new THREE.Group();
    if (THEME === 'zima') { for (const [r, y] of [[.36, .34], [.27, .86], [.19, 1.25]]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), snowM); b.position.y = y * s; g.add(b); }
      const n = new THREE.Mesh(new THREE.ConeGeometry(.04 * s, .2 * s, 5).rotateX(Math.PI / 2), carrotM); n.position.set(0, 1.25 * s, .2 * s); g.add(n);
      for (const x of [-.07, .07]) { const e = new THREE.Mesh(new THREE.BoxGeometry(.04 * s, .04 * s, .02), coalM); e.position.set(x * s, 1.31 * s, .17 * s); g.add(e); }
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(.13 * s, .13 * s, .18 * s, 8), coalM); hat.position.y = 1.47 * s; g.add(hat); }
    else if (THEME === 'park') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.32 * s, .24 * s, .42 * s, 8).translate(0, .21 * s, 0), potM)); const so = new THREE.Mesh(new THREE.CylinderGeometry(.29 * s, .29 * s, .04, 8), soilM2); so.position.y = .41 * s; g.add(so);
      for (let k = 0; k < 7; k++) { const a = k * .9, r = (k ? .17 : 0) * s, st = new THREE.Mesh(new THREE.BoxGeometry(.03, .28 * s, .03), stemM); st.position.set(Math.cos(a) * r, .55 * s, Math.sin(a) * r); g.add(st);
        const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(.07 * s, 0), petalM[k % 4]); fl.position.set(Math.cos(a) * r, .72 * s, Math.sin(a) * r); g.add(fl); } }
    else if (THEME === 'deptak') { const k = Math.random() * 3 | 0;                     // (a deck chair: a striped canvas sloping back on its wooden frame)
      const cloth = canvasM[k] ||= new THREE.MeshLambertMaterial({ map: cv(4, 8, g2 => { for (let y = 0; y < 8; y++) { g2.fillStyle = (y >> 1) % 2 ? '#f6f3ea' : ['#3b6fa0', '#cf5a3e', '#3f8a4a'][k]; g2.fillRect(0, y, 4, 1); } }) });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(.56 * s, .025, 1.05 * s), cloth); seat.position.set(0, .42 * s, 0); seat.rotation.x = .62; g.add(seat);
      for (const x of [-.3, .3]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.1 * s), chairW); rail.position.set(x * s, .42 * s, 0); rail.rotation.x = .62; g.add(rail);
        const back = new THREE.Mesh(new THREE.BoxGeometry(.05, .62 * s, .05), chairW); back.position.set(x * s, .31 * s, -.38 * s); back.rotation.x = -.35; g.add(back); } }
    else { const m = new THREE.Mesh(new THREE.ConeGeometry(.28 * s, .75 * s, 8).translate(0, .375 * s, 0), coneM), band = new THREE.Mesh(new THREE.CylinderGeometry(.16 * s, .2 * s, .1 * s, 8).translate(0, .42 * s, 0), bandM); m.add(band); g.add(m); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; };
  const bale = (R = .55, L = 1.1) => { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 14).rotateZ(Math.PI / 2), [hayM, hayEnd, hayEnd]); b.position.y = R; b.castShadow = true; g.add(b); g.userData.R = R; return g; };
  // the banner
  { const p = at(.995, 0), w = W + .6, tx = cv(96, 12, g => { for (let x = 0; x < 96; x += 4) for (let y = 0; y < 12; y += 4) { g.fillStyle = ((x + y) / 4) % 2 ? '#17181b' : '#f6f3ea'; g.fillRect(x, y, 4, 4); } g.fillStyle = WIES ? '#8e5a2e' : '#cf5a3e'; g.fillRect(12, 1, 72, 10); g.fillStyle = '#f6f3ea'; g.font = '8px PTPix'; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText(WIES ? 'WIEJSKI FINAŁ' : 'FINAŁOWA PROSTA', 48, 2); });
    for (const sd of [-1, 1]) { const q = at(.995, sd * w), post = new THREE.Mesh(new THREE.BoxGeometry(.16, 4.6, .16).translate(0, 2.3, 0), postM); post.position.set(q.x, q.y, q.z); FIN.G.add(post); }
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 2, .7, .06), new THREE.MeshBasicMaterial({ map: tx })); b.position.set(p.x, p.y + 4.3, p.z); b.rotation.y = p.yaw; FIN.G.add(b); }
  // the slalom
  const slalom = (u0, n, gap, off, c = 0) => { for (let k = 0; k < n; k++) { const q = at(u(u0) - k * gap, c + (k % 2 ? 1 : -1) * off);
    if (WIES) { const m = bale(); m.position.set(q.x, q.y, q.z); m.rotation.y = q.yaw; FIN.G.add(m); FIN.cones.push({ m, x: q.x, z: q.z, down: false, t: 0, ax: 0, az: 0, bale: true, vx: 0, vz: 0, i: q.i }); continue; }
    const m = prop(); m.position.set(q.x, q.y, q.z); m.rotation.y = q.yaw; FIN.G.add(m); FIN.cones.push({ m, x: q.x, z: q.z, down: false, t: 0, ax: 0, az: 0 }); } };
  // an arrow pad: chevrons on the road, a push forward
  const arrowT = cv(16, 16, g => { g.fillStyle = '#efc970'; for (let k = 0; k < 2; k++) for (let y = 0; y < 6; y++) { g.fillRect(4 + y - 0, 2 + k * 7 + y, 2, 1); g.fillRect(10 - y, 2 + k * 7 + y, 2, 1); } });
  const pad = (m, d = 0, set = 0) => { const q = at(m, d), o = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: arrowT, transparent: true })); o.position.set(q.x, q.y + .03, q.z); o.rotation.y = q.yaw + Math.PI; FIN.G.add(o); FIN.pads.push({ q, used: false, o, set }); };
  // a kicker, a trench after it (planks at its edges, a striped board each side), another before the line (two of them, a gap between)
  const kicker = (m, size = 'kicker', d = 0) => { const q = at(m, d), o = track.props.ramp(Math.random, size); o.group.position.set(q.x, q.y, q.z); o.group.rotation.y = q.yaw; FIN.G.add(o.group); FIN.hits.push(track.addHit(o.group, o.hit, q.i));
    if (WIES) for (const sd of [-1, 1]) { const p2 = at(m, d + sd * (o.hit.hx + .5)), b = bale(.5, 1); b.position.set(p2.x, p2.y, p2.z); b.rotation.y = q.yaw + Math.PI / 2; FIN.G.add(b); } return o; };   // (in the village: a bale each side of it)
  const stripes = cv(8, 2, g => { for (let x = 0; x < 8; x++) { g.fillStyle = x % 2 ? '#cf5a3e' : '#f6f3ea'; g.fillRect(x, 0, 1, 2); } }), stripeM = new THREE.MeshBasicMaterial({ map: stripes });
  // (a trench: across the whole road, or half of it (hw its half width, cx its middle off the road's): to ride round or to jump)
  const trench = (m, len = 3.2, hw = W, cx = 0) => { const q = at(m, 0), g = new THREE.Group(); g.position.set(q.x, q.y, q.z); g.rotation.y = q.yaw; const k = -1;   // (the group's x is the road's right reversed)
    // (seen from afar: light dug earth round a black hole, yellow and black edges, a cone at each corner)
    const pit = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, .05, len), M(WATER ? '#5d4a30' : THEME === 'zima' ? '#e6edf2' : THEME === 'deptak' ? '#e0c990' : '#8a6a44')); pit.position.set(cx * k, .03, 0); g.add(pit); const deep = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 - .5, .04, len - .6), WATER ? new THREE.MeshBasicMaterial({ color: '#3f6f86' }) : THEME === 'zima' ? new THREE.MeshBasicMaterial({ color: '#6f9cba' }) : THEME === 'deptak' ? M('#b89558') : M('#050403')); deep.position.set(cx * k, .05, 0); g.add(deep);
    const hz = cv(8, 2, g2 => { for (let x = 0; x < 8; x++) { g2.fillStyle = (x >> 1) % 2 ? '#17181b' : '#efc930'; g2.fillRect(x, 0, 1, 2); } }), hzM = new THREE.MeshBasicMaterial({ map: hz });
    for (const z of [-len / 2, len / 2]) { const e = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, .14, .2), WATER || THEME === 'deptak' ? wood : THEME === 'zima' ? snowM : hzM); e.position.set(cx * k, .08, z); g.add(e); }
    if (WATER) { const reed = M('#5f7a3a'); for (let n = 0; n < 14; n++) { const h2 = .5 + Math.random() * .5, rd = new THREE.Mesh(new THREE.BoxGeometry(.04, h2, .04), reed); rd.position.set((cx + (Math.random() - .5) * 2 * (hw - .2)) * k, h2 / 2, (Math.random() < .5 ? -1 : 1) * (len / 2 + .15)); rd.rotation.z = (Math.random() - .5) * .3; g.add(rd); } }   // (a ditch: water at its bottom, reeds on its banks)
    for (const sx of [-1, 1]) for (const z of [-len / 2 - .35, len / 2 + .35]) { const c0 = WIES ? bale(.3, .55) : prop(.7); c0.position.set((cx + sx * (hw - .15)) * k, 0, z); g.add(c0); }
    for (const sd of [-1, 1]) { const x = (cx + sd * (hw + .25)) * k, b = new THREE.Mesh(new THREE.BoxGeometry(.05, .3, len + .6), stripeM); b.position.set(x, .55, 0); g.add(b); for (const z of [-len / 2 - .3, len / 2 + .3]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(.08, .7, .08), postM); p2.position.set(x, .35, z); g.add(p2); } }
    FIN.G.add(g); FIN.trenches.push({ q, len, hw, cx, done: false }); };
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
  // the swinging one: a frame over the road, the board on a rope, to and fro
  const swing = su => { const q = at(su, 0), g = new THREE.Group(); g.position.set(q.x, q.y, q.z); g.rotation.y = q.yaw; for (const sd of [-1, 1]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(.18, 5.2, .18).translate(0, 2.6, 0), dark); p2.position.x = sd * (W + .5); g.add(p2); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 1.2, .18, .18), dark); bar.position.y = 5.1; g.add(bar); const sw = new THREE.Group(); sw.position.y = 5.0; g.add(sw);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.6, .03).translate(0, -.8, 0), M('#c9b77a')); sw.add(rope); const b = board(.75); b.rotation.y = Math.PI / 2; b.position.y = -2.3; sw.add(b);
    FIN.G.add(g); FIN.targets.push({ t: g, hinge: sw, kind: 'swing', r: .75, c: new THREE.Vector3(q.x, q.y + 2.7, q.z), hit: false, spin: 0, up: true, sd: 0, pay: 10, q, board: b }); };
  // the second kicker and the golden rings in the air after it
  // ---------- the layout, by the stretch's difficulty D (0: the first stretch, 1: the last): a warm-up; the fork into two lanes (the
  // easy one on the left, the hard one on the right: its points count twice); the lanes joining; the run to the line. A jump's rings
  // and its air targets lie on the flight the game's own physics gives off that ramp at the speed its pad sets (so it can be flown) ----------
  const ALL = LVM.LEVELS.filter(l => !l.soon && (!track.classic || l.classic)), D = THREE.MathUtils.clamp(ALL.findIndex(l => l.id === LV.id) / Math.max(1, ALL.length - 1), 0, 1), L2 = W / 2;   // (Express: the difficulty over its own five streets, 0 the first, 1 the last)
  // (a jump's flight: flown once by the game's own ride() from its pad at the pad's speed, the speed held to the lip as the pad holds
  // it in play; the rider's state, the sounds, any fall kept out and put back after. → the points the rider's middle passed in the air)
  const flown = (q, v, lip) => { const keep = { ...B }, rp = rider.root.position.clone(), rq = rider.root.quaternion.clone(), rv = rider.root.visible, ap = audio.play, fx = q.f.x, fz = q.f.z, out = []; audio.play = () => { }; const q0 = track.probe(q.x, q.z, q.i);
    Object.assign(B, { x: q.x, z: q.z, hint: q0.i, y: q0.y, gPrev: q0.y, gVel: 0, yaw: Math.atan2(fx, fz), v, air: false, vy: 0, crash: null, safe: 99, trick: null, lift: null, parked: false, kick: null, charge: null, onRamp: null });
    try { for (let k = 0; k < 480; k++) { if (!B.air && !out.length) B.v = v; ride(1 / 60, { steer: 0, pedal: 0, brake: 0 }); if (B.air) out.push(new THREE.Vector3(B.x, B.y + 1, B.z)); else if (out.length) break; } } catch (e) { console.warn('flight', e); }
    audio.play = ap; for (const k of Object.keys(B)) if (!(k in keep)) delete B[k]; Object.assign(B, keep); rider.root.position.copy(rp); rider.root.quaternion.copy(rq); rider.root.visible = rv; rider.root.updateMatrixWorld(true); return out; };   // (the bike's model back where it stood too)
  const jump = (m, size, d, v, nRings, nAir) => { pad(m + 7, d, v); const o = kicker(m, size, d), lip = m - o.hit.hz, path = flown(at(m + 7, d), v, lip);
    FIN.locks.push({ from: m + 7, to: lip, v, d });
    if (path.length < 6) return { o, lip, land: lip - 6 };
    for (let k = 0; k < nRings; k++) { const p = path[Math.round((k + 1) / (nRings + 1) * (path.length - 1))], q = at(lip, d), r = new THREE.Mesh(new THREE.TorusGeometry(.7, .09, 6, 16), gold); r.position.copy(p); r.rotation.y = q.yaw; FIN.G.add(r); FIN.rings.push({ o: r, got: false }); }
    const top = path.reduce((a2, b2) => b2.y > a2.y ? b2 : a2, path[0]), qt = track.probe(top.x, top.z, at(lip, d).i), A = track.S[qt.i], dir = LV.finish.dir;
    for (let k = 0; k < nAir; k++) { const sd = k % 2 ? -1 : 1, ox = A.r.x * dir * sd * 3.2, oz = A.r.z * dir * sd * 3.2, x = top.x + ox, z = top.z + oz, gy = track.probe(x, z, qt.i).y, h = top.y + .2 - gy, t = new THREE.Group(), hinge = new THREE.Group();
      t.position.set(x, gy, z); t.rotation.y = Math.atan2(A.f.x * dir, A.f.z * dir) + Math.PI / 2; t.add(hinge); t.add(new THREE.Mesh(new THREE.BoxGeometry(.1, h, .1).translate(0, h / 2, 0), wood)); const bd = board(.85); bd.position.y = h; hinge.add(bd); FIN.G.add(t);
      FIN.targets.push({ t, hinge, kind: 'post', r: 1.1, c: new THREE.Vector3(x, gy + h, z), hit: false, spin: 0, up: true, upT: 0, sd, pay: 8, label: 'W LOCIE!' }); }
    const land = path[path.length - 1], ql = track.probe(land.x, land.z, at(lip, d).i); return { o, lip, land: ahead(ql.i, iF) }; };
  FIN.locks = []; FIN.carsOff = [];
  { const W = track.net?.works; if (W) track.net.setWorks(!([W.i0, W.i1].some(i => ahead(i, iF) < FL + 25 || ahead(iF, i) < 30))); }   // (the road works: not on the finale's track)
  for (const K of track.kerbCars || []) { const m0 = ahead(K.i, iF); if (m0 < FL + 20) { K.o.visible = false; K.C.used = true; const ix = track.parked.indexOf(K.P0); if (ix >= 0) track.parked.splice(ix, 1); FIN.carsOff.push(K); } }   // (no car parked on the track)
  // the warm-up: a slalom, a pad, a plank, a target by it
  slalom(.95, 4 + Math.round(D * 3), 7 - D * 2, 1.1); pad(u(.87)); kicker(u(.83), 'plank'); target(.8, 1);
  // the fork: its sign over the road, cones down the middle to where the lanes join
  const forkM = u(.74), mergeM = u(.36); FIN.forkM = forkM; FIN.mergeM = mergeM; FIN.iF = iF;
  { const q = at(forkM + 3, 0), w = W + .6, tx = cv(96, 12, g2 => { g2.fillStyle = '#17181b'; g2.fillRect(0, 0, 96, 12); g2.fillStyle = '#9fd27a'; g2.fillRect(1, 1, 46, 10); g2.fillStyle = '#cf5a3e'; g2.fillRect(49, 1, 46, 10); g2.font = '8px PTPix'; g2.textBaseline = 'top'; g2.textAlign = 'center'; g2.fillStyle = '#17181b'; g2.fillText('< ŁATWA', 24, 2); g2.fillStyle = '#f6f3ea'; g2.fillText('TRUDNA x2 >', 72, 2); });
    for (const sd of [-1, 1]) { const p2 = at(forkM + 3, sd * w), post = new THREE.Mesh(new THREE.BoxGeometry(.16, 4.6, .16).translate(0, 2.3, 0), postM); post.position.set(p2.x, p2.y, p2.z); FIN.G.add(post); }
    const bn = new THREE.Mesh(new THREE.BoxGeometry(w * 2, .7, .06), new THREE.MeshBasicMaterial({ map: tx })); bn.position.set(q.x, q.y + 4.3, q.z); bn.rotation.y = q.yaw; FIN.G.add(bn); }
  for (let m = forkM; m > mergeM; m -= 4.5) { const q = at(m, 0), c0 = WIES ? bale(.3, .55) : prop(.75); c0.position.set(q.x, q.y, q.z); FIN.G.add(c0); }
  // the easy lane (left): low ramps, a slalom in the lane, targets by the road
  kicker(u(.68), 'plank', -L2); target(.64, -1); slalom(.6, 3 + Math.round(D * 2), 5, .55, -L2); kicker(u(.5), 'kicker', -L2); target(.47, -1, 'pop'); pad(u(.42), -L2);
  // the hard lane (right): a jump (mega from the middle of the game on) with its rings and targets in the air; a trench, a kicker before
  // it; a second, smaller jump with rings of its own
  { const big = D > .45 ? 'mega' : 'big', j1 = jump(u(.69), big, L2, big === 'mega' ? 11 : 10, 3 + Math.round(D * 3), 1 + Math.round(D));
    const kM = j1.land - 7, ko = kicker(kM, 'kicker', L2); trench(kM - ko.hit.hz - 2.4, 2.2, L2 - .15, L2);
    if (kM - 30 > mergeM + 8) jump(kM - 30, 'kicker', L2, 9, 2 + Math.round(D * 2), D > .3 ? 1 : 0); }
  // the lanes joined: a swinging target, a double trench (a half each, apart: round it or hop), pop-ups, a pad to the line
  swing(.3); trench(u(.24), 2, W * .55, W * .45); trench(u(.24) - 7, 2, W * .55, -W * .45); target(.2, 1, 'pop'); target(.17, -1, 'pop'); if (D > .5) slalom(.12, 4, 5, 1.3); target(.08, 1, 'pop'); target(.06, -1, 'pop'); pad(u(.03));
  // (the Classic: railings along both edges of the road all the way (a channel to ride), low bars across half the road to hop)
  if (track.classic) { const railM = new THREE.MeshLambertMaterial({ map: stripes }), postK = M('#9aa0a4');
    for (let m = u(.98); m > 6; m -= 4) for (const sd of [-1, 1]) { const q = at(m, sd * (W + .35)), q2 = at(m - 4, sd * (W + .35)), g = new THREE.Group(), len = Math.hypot(q2.x - q.x, q2.z - q.z);
      const r = new THREE.Mesh(new THREE.BoxGeometry(.06, .12, len), railM); r.position.set(0, .85, -len / 2); g.add(r); const r2 = r.clone(); r2.position.y = .45; g.add(r2); const p = new THREE.Mesh(new THREE.BoxGeometry(.08, .9, .08), postK); p.position.y = .45; g.add(p);
      g.position.set(q.x, q.y, q.z); g.rotation.y = Math.atan2(q2.x - q.x, q2.z - q.z) + Math.PI; FIN.G.add(g); g.updateMatrixWorld(true); const C = track.addHit(g, { hx: .06, hz: len / 2, h: .9, kind: 'hard' }, q.i, 0, -len / 2); FIN.hits.push(C); }
    for (const [m0, sd] of [[.9, 1], [.78, -1], [.55, 1], [.4, -1], [.14, 1], [.06, -1]]) { const q = at(u(m0), sd * W / 2), g = new THREE.Group(); for (const x of [-W / 2 + .2, W / 2 - .2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.1, .55, .1), M('#9aa0a4')); p.position.set(x, .27, 0); g.add(p); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(W - .3, .12, .1), railM); bar.position.y = .5; g.add(bar); g.position.set(q.x, q.y, q.z); g.rotation.y = q.yaw; FIN.G.add(g); g.updateMatrixWorld(true); FIN.hits.push(track.addHit(g, { hx: W / 2 - .1, hz: .08, h: .56, kind: 'hard' }, q.i)); } }
  FIN.on = true; FIN.entered = false; FIN.combo = 0; FIN.comboT = 0; FIN.res = { targets: 0, of: FIN.targets.length, cones: 0, rings: 0, trenches: 0, combo: 0, score: 0 }; }
// (the Classic: PILNE: every 14-22 s a subscriber 35-90 m ahead wants it now: a red sign over the door, 12 s to get it there: +5)
const RUSH = { t: 10, marks: [] }, rushT = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 12; const g = c.getContext('2d'); g.fillStyle = '#cf3a2c'; g.fillRect(0, 0, 32, 12); g.fillStyle = '#f6f3ea'; g.font = '8px PTPix'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PILNE!', 16, 6.5); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; })();
function rushOff(d) { const k = RUSH.marks.findIndex(m => m.d === d); if (k >= 0) { scene.remove(RUSH.marks[k].s); RUSH.marks.splice(k, 1); } }
function stepRush(dt) { if (!track.classic || !LV || !RUN.go) return; const now = performance.now();
  for (const m of RUSH.marks.slice()) { m.s.visible = ((now / 160) | 0) % 2 === 0 || m.d.rush - now > 4000; if (m.d.done || m.d.rush <= now) { if (!m.d.done && m.d.rush) flash('Za późno z pilną gazetą.'); m.d.rush = 0; rushOff(m.d); } }
  if ((RUSH.t -= dt) > 0 || RUSH.marks.length) return; { const p = streetP(); if (LV.finish?.m && p < .3) { RUSH.t = 3; return; } RUSH.t = LV.finish?.m && p > .55 ? 8 + Math.random() * 5 : 14 + Math.random() * 8; } const q = track.probe(B.x, B.z, B.hint), L0 = track.N * track.ds, al = Math.sign(Math.sin(B.yaw) * q.f.x + Math.cos(B.yaw) * q.f.z) || 1;
  const c = track.doors.filter(d => d.sub && !d.done && !d.mine).map(d => ({ d, a: ((((track.probe(d.p.x, d.p.z, d.i).s - q.s) * al) % L0) + L0) % L0 })).filter(o => o.a > 35 && o.a < 90).sort((x, y) => x.a - y.a)[0]; if (!c) return;
  c.d.rush = now + 12000; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: rushT, depthTest: false })); s.scale.set(1.6, .6, 1); s.position.copy(c.d.p).addScaledVector(c.d.n, -2.6); s.position.y += 3.2; s.renderOrder = 5; scene.add(s); RUSH.marks.push({ d: c.d, s });
  flash('PILNE! ' + TITLES[c.d.sub].short + ' za ~' + Math.round(c.a) + ' m, 12 s'); audio.play('ui'); }
// (the Classic: a garden gnome knocked over (by the bike or a paper): a point at a house that does not take the paper)
function gnomeDown(T) { T.scored = true; const at = T.o.position.clone().add(new THREE.Vector3(0, .9, 0)), d = track.doors[T.door];
  if (d?.sub) hud.rant(at, pickOf(['MÓJ KRASNAL!', 'ZOSTAW KRASNALA!', 'TO PAMIĄTKA Z ZAKOPANEGO!']), true); else { score(1, at, 'KRASNAL! +1', '#efc970'); logEv('gnome', at.x, at.z); } }
// (the Classic's obstacle courses: all its ramps jumped within 15 s, a bonus)
function courseRamp(c) { const K = track.courses?.find(o => o.id === c.id); if (!K || K.done) return; const now = performance.now(); if (now - (K.t || 0) > 15000) K.hits = new Set(); K.t = now; (K.hits ||= new Set()).add(c.k);
  if (K.hits.size >= K.n) { K.done = true; logEv('course', B.x, B.z); score(6, rider.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 'TOR PRZESZKÓD! +6', '#efc970'); flash('Cały tor przeszkód! +6'); audio.play('trick'); } }
// a car's roof under (x, z): its height, or null; a parked car's, or one going by (its roof measured once), or a tractor's hay trailer
// (roofCar: the moving one it was, if any)
let roofCar = null;
function carRoofAt(x, z) { let y = null; roofCar = null; for (const C of track.near(B.hint)) if (C.car && C.roof && !C.used && boxHit(C, x, z, 0)) y = Math.max(y ?? -1e9, C.roof);
  for (const C of traffic.boxes()) { if (C.t.r || Math.abs(C.x - x) + Math.abs(C.z - z) > 8 || !boxHit(C, x, z, 0)) continue; const c = C.t.car;
    if (c.roofH == null) { c.group.updateMatrixWorld(true); c.roofH = new THREE.Box3().setFromObject(c.group).max.y - c.group.position.y; }
    const top = (C.y0 || 0) + (C.trailer ? 1.55 : Math.min(c.roofH, 3.2)); if (y == null || top > y) { y = top; roofCar = C.t; } }
  // (the Classic's cars backing out of the drives: their roofs too)
  for (const K of locals?.backers || []) { const p = K.g.position, Y = K.yawIn, C = { x: p.x, z: p.z, c: Math.cos(Y), s: Math.sin(Y), hx: K.c.half[0], hz: K.c.half[1] }; if (Math.abs(p.x - x) + Math.abs(p.z - z) > 8 || !boxHit(C, x, z, 0)) continue; const top = p.y + K.roofH; if (y == null || top > y) { y = top; roofCar = K; } }
  return y; }
// ---------- the far people not drawn: every person is ~9 skinned meshes (~40 thousand triangles, skinned again for the shadow); beyond
// 60 m one is a few pixels in this picture. Each such mesh goes to layer 1 (the camera and the shadow draw layer 0 only), back near.
// The list (all skinned meshes but his own) refreshed now and then; nothing else about them changes ----------
// the footsteps on foot: one each stride (longer and a little louder running), softer and scuffier on grass
let stepAcc = 0; function stepSteps(dt) { const me = foot.me; if (!me || me.air || foot.fighting && !me.vf) { stepAcc = 0; return; } const sp = Math.abs(me.vf || 0); if (sp < .4) { stepAcc = Math.min(stepAcc, .3); return; }
  const run = sp > 3, stride = run ? 1.15 : .72; stepAcc += sp * dt; if (stepAcc < stride) return; stepAcc -= stride; const q = track.probe(me.x, me.z, me.hint ?? B.hint), grass = Math.abs(q.d) > track.ROAD + .4 && !(Math.abs(q.d) > 4.9 && Math.abs(q.d) < track.PAVE + .1);
  audio.play('step', { vol: (run ? .07 : .045) * (grass ? .8 : 1), grass }); }
// ---------- the menu's TESTY page (for trying things quickly; to go later): every stretch by region, and the states to jump to ----------
function tpTo(x, z, along = 1) { const q = track.probe(x, z, -1), A = track.S[q.i], dir = LV?.finish.dir || 1; if (foot.active) mount(); Object.assign(B, { x: A.p.x + A.r.x * 1.4 * dir, z: A.p.z + A.r.z * 1.4 * dir, hint: q.i, y: q.y, gPrev: q.y, v: 0, crash: null, air: false, yaw: Math.atan2(A.f.x * dir * along, A.f.z * dir * along) }); C.yaw = B.yaw; C.init = false; C.iy = 0; }
function aheadOf(x, z, m) { const q = track.probe(x, z, -1), dir = LV?.finish.dir || 1, i = ((q.i - dir * Math.round(m / track.ds)) % track.N + track.N) % track.N; return track.S[i].p; }
// the obstacle course of a stretch, straight to it: a place on it (m: metres before the line, d: off the road's middle, + right),
// the bike under him facing the line; where: start, the easy lane, the hard lane (before its speed pad), the second jump, the double trench
// (the finish and its finale put up now: half way round, or sent there from the tests)
function lateFinish() { if (!RUN.late) return; RUN.late = false; buildFinale(); buildGate(RUN.cps[RUN.cps.length - 1]); }
function tpFin(m, d = 0) { lateFinish(); if (!LV || !FIN.on) return; const dir = LV.finish.dir, i = ((FIN.iF - dir * Math.round(m / track.ds)) % track.N + track.N) % track.N, A = track.S[i], x = A.p.x + A.r.x * d * dir, z = A.p.z + A.r.z * d * dir, q = track.probe(x, z, i);
  if (foot.active) mount(); Object.assign(B, { x, z, hint: q.i, y: q.y, gPrev: q.y, v: 0, crash: null, air: false, lift: null, parked: false, yaw: Math.atan2(A.f.x * dir, A.f.z * dir) }); C.yaw = B.yaw; C.init = false; C.iy = 0; }
function tpFinale(where = 'start') { lateFinish(); if (!LV || !FIN.on) return; const L2 = track.ROAD / 2, FL = finL(), Lk = FIN.locks || [];
  const at = { start: [FL + 14, 0], easy: [(FIN.forkM || FL * .74) - 2, -L2], hard: [(Lk[0]?.from ?? FL * .74) + 8, L2], jump2: [(Lk[1]?.from ?? FL * .5) + 8, L2], double: [FL * .24 + 14, 0] }[where] || [FL + 14, 0];
  tpFin(at[0], at[1]); flash('Tor przeszkód: ' + ({ start: 'początek', easy: 'łatwy pas', hard: 'trudny pas', jump2: 'druga skocznia', double: 'podwójny rów' }[where] || 'początek')); }
function goTrack(id, where = 'start') { const L0 = LVM.LEVEL(id); if (!L0) return; if (L0.region !== track.region || (L0.map || '') !== track.map) { try { sessionStorage.setItem('pt.tp', JSON.stringify({ id, where })); } catch { } startLevel(id); return; } startLevel(id); setTimeout(() => tpFinale(where), 700); }
function testRows() { const out = [];
  for (const R of LVM.REGIONS) { const ls = LVM.LEVELS.filter(l => l.region === R.id && !l.soon); if (!ls.length) continue; out.push({ head: 'TRASY · ' + R.name });
    for (const l of ls) out.push({ label: l.name + (LV?.id === l.id ? ' (TERAZ)' : ''), act: () => startLevel(l.id) }); }
  const here = LVM.LEVELS.find(l => (l.region === 'peryferia' ? 'peryferia' : l.region) === track.region && !l.soon);
  const needLV = f => () => { if (!LV && here) { startLevel(here.id); setTimeout(f, 700); } else f(); };
  out.push({ head: 'TORY PRZESZKÓD (FINAŁY)' }); for (const l of LVM.LEVELS.filter(l => !l.soon)) out.push({ label: 'TOR: ' + l.name, act: () => goTrack(l.id) });
  if (LV && FIN.on) out.push({ head: 'TEN TOR: ' + LV.name }, ...[['start', 'POCZĄTEK'], ['easy', 'ŁATWY PAS'], ['hard', 'TRUDNY PAS (ROZPĘD)'], ['jump2', 'DRUGA SKOCZNIA'], ['double', 'PODWÓJNY RÓW']].map(([w, n]) => ({ label: n, act: () => tpFinale(w) })));
  if (track.net) { const N0 = track.N, wr = i => ((i % N0) + N0) % N0, go = i => { const A = track.S[wr(i)]; tpTo(A.p.x, A.p.z, 1); };
    out.push({ head: 'MIASTO: ULICE' }, ...track.net.shortcuts.map(c => ({ label: c.kind === 'alley' ? 'SKRÓT: ZAUŁEK' : 'SKRÓT: PARK Z PLACEM ZABAW', act: () => go(c.a - Math.round(14 / track.ds)) })), ...track.net.stubs.slice(0, 2).map((t, k) => ({ label: 'BOCZNA ULICA ' + (k + 1), act: () => go(t.i - Math.round(16 / track.ds)) })), ...(track.net.plaza ? [{ label: 'PLAC POD BIUROWCEM', act: () => go(track.net.plaza.i0 - Math.round(14 / track.ds)) }] : []), { label: 'POSTÓJ TAXI', act: () => go(track.net.taxi.i - Math.round(14 / track.ds)) }, ...(track.net.works ? [{ label: 'ROBOTY DROGOWE', act: () => go(track.net.works.i0 - Math.round(24 / track.ds)) }] : []), ...(track.net.zebras.some(z => !z.lights) ? [{ label: 'PRZEJŚCIE DLA PIESZYCH', act: () => go(track.net.zebras.find(z => !z.lights).i - Math.round(20 / track.ds)) }] : [])); }
  out.push({ head: 'STANY' },
    { label: 'GAZETA PO TRASIE', act: needLV(() => finishLevel()) },
    { label: 'MAPA TRASY', act: () => openMap() },
    { label: 'SKLEP JANUSZA', act: () => shop.open() },
    ...(CROSS.length ? [{ label: 'PRZEJAZD KOLEJOWY', act: () => { const p = aheadOf(CROSS[0].center.x, CROSS[0].center.z, 16); tpTo(p.x, p.z); } }] : []),
    { label: 'WSIĄDŹ NA ROWER', act: () => { if (foot.active) mount(); } },
    { label: '+100 ZŁ', act: () => { B.points += 100; flash('+100 zł (test)'); } });
  return out; }
const BOOT = { drawn: false };   // (the loader in index.html: away once the first frames are in and the shaders made)
const CULL = { t: 0, list: [], listT: 0, own: new Set() };
function cullPeople(dt) { if ((CULL.t -= dt) > 0) return; CULL.t = .25; if ((CULL.listT -= .25) <= 0) { CULL.listT = 3; CULL.own.clear(); rider.root.traverse(o => CULL.own.add(o)); if (net.on) P2.rider.root.traverse(o => CULL.own.add(o)); CULL.list = []; scene.traverse(o => { if (o.isSkinnedMesh && !CULL.own.has(o)) CULL.list.push(o); }); }
  const cp = camera.position, far = (foot.active && foot.view === 'first') ? 45 : 60, v = _cullV;
  for (const o of CULL.list) { o.getWorldPosition(v); const near = (v.x - cp.x) ** 2 + (v.z - cp.z) ** 2 < far * far; if (near !== (o.layers.mask === 1)) o.layers.set(near ? 0 : 1); } }
const _cullV = new THREE.Vector3();
function finScore(n, at, label) { if (FIN.hardNow) { n *= 2; label += ' x2'; } FIN.combo = FIN.comboT > 0 ? FIN.combo + 1 : 1; FIN.comboT = 3; const k = Math.min(3, FIN.combo), v = n * k; FIN.res.score += v; FIN.res.combo = Math.max(FIN.res.combo, k);
  audio.play(k > 1 ? 'trick' : 'coin'); hud.pop(at, `${label} +${v}${k > 1 ? ' x' + k : ''}`, k > 1 ? '#efc970' : '#9fd27a'); }
function stepFinale(dt) { if (!FIN.on || !LV) return; const me = foot.active ? foot.me : B; FIN.t += dt; FIN.comboT -= dt;
  if (FIN.forkM) { const q = track.probe(me.x, me.z, B.hint), mHere = ahead(q.i, FIN.iF), was = FIN.hardNow;
    if (!foot.active && !B.air) for (const L of FIN.locks || []) if (mHere < L.from && mHere > L.to && Math.abs(q.d * LV.finish.dir - L.d) < 1.2 && FIN.pads.some(P => P.used && P.set === L.v)) B.v = L.v;   // (on a jump's run-up after its pad: the pad's speed)
    FIN.hardNow = mHere < FIN.forkM && mHere > FIN.mergeM && q.d * LV.finish.dir > .3; if (FIN.hardNow && !was) flash('Trudny pas: punkty x2'); }
  const near = (p, m) => Math.hypot(me.x - p.x, me.z - p.z) < m;
  if (locals) locals.wave = !!(track.classic && FIN.entered);
  if (!FIN.entered && FIN.cones[0] && near(FIN.cones[0], 30)) { FIN.entered = true; flash(track.region === 'wies' ? 'Wiejski finał! Slalom między belami, rowy do przeskoczenia, tarcze i stodoła: kombo mnoży!' : 'Finałowa prosta! Slalom, wykopy do przeskoczenia, tarcze i obręcze: kombo mnoży!'); }
  for (const c of FIN.cones) if (c.bale) { const R = c.m.userData.R;
    if (c.down) { const sp = Math.hypot(c.vx, c.vz); if (sp > .05) { c.x += c.vx * dt; c.z += c.vz * dt; const k2 = Math.exp(-dt * .9); c.vx *= k2; c.vz *= k2; const q2 = track.probe(c.x, c.z, c.i); c.i = q2.i; c.m.position.set(c.x, q2.y, c.z); c.m.rotation.y = Math.atan2(c.vx, c.vz); c.m.children[0].rotation.x += sp * dt / R; } continue; }
    if (near(c, .85) && !foot.active) { c.down = true; const s0 = Math.max(3, Math.abs(B.v) * 1.1); c.vx = Math.sin(B.yaw) * s0; c.vz = Math.cos(B.yaw) * s0; FIN.res.cones++; FIN.combo = 0; audio.play('kick', { vol: .5 }); B.v *= .7; B.jolt = .1; } }
  for (const c of FIN.cones) { if (c.bale) continue; if (c.down) { c.t = Math.min(1, c.t + dt * 4); c.m.rotation.x = c.ax * c.t * 1.5; c.m.rotation.z = c.az * c.t * 1.5; continue; } if (near(c, .6)) { c.down = true; c.ax = Math.cos(B.yaw); c.az = -Math.sin(B.yaw); FIN.res.cones++; FIN.combo = 0; audio.play('pick', { vol: .5 }); B.v *= .85; } }
  for (const P of FIN.pads) if (!P.used && near(P.q, 1.6) && !foot.active) { P.used = true; B.v = P.set || Math.min(B.v + 3.5, 13); audio.play('trick', { vol: .5 }); flash(P.set ? 'Rozpęd do skoku! Prosto przez obręcze' : 'Strzała! Szybciej!'); setTimeout(() => { P.used = false; }, 4000); }
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
  for (const R of FIN.rings) { R.o.rotation.z += dt * 2; if (R.got) { R.o.scale.multiplyScalar(Math.max(0, 1 - dt * 4)); continue; } const p = new THREE.Vector3(me.x, (B.y || 0) + 1, me.z); if (p.distanceTo(R.o.position) < 1.35) { R.got = true; FIN.res.rings++; finScore(3, R.o.position.clone().setY(R.o.position.y + .6), 'OBRĘCZ!'); } } }
function logEv(kind, x, z, more) { if (!LV || RUN.done) return; const e = { kind, x, z, t: RUN.t, ...more }; if (!(RUN.log ||= []).some(q => q.kind === kind)) (RUN.snaps ||= []).push({ e, at: RUN.t + (kind === 'dog' ? .2 : .5) }); RUN.log.push(e); }
function stepRun(dt) { if (LV && (modes.id || mp.on)) { LV = null; clearGate(); lvHud.classList.remove('on'); } if (!LV || RUN.done) return; const me = foot.active ? foot.me : B;
  if (!RUN.go && Math.abs(foot.active ? foot.me.vf || 0 : B.v) > .5) RUN.go = true; if (RUN.go) RUN.t += dt;
  { const chased = barkers.some(n => n.dist < 6 && Math.abs(B.v) > 1); if (chased && !RUN.dogOn && RUN.t - (RUN.dogT ?? -99) > 6) { logEv('dog', B.x, B.z); RUN.dogT = RUN.t; } RUN.dogOn = chased; }
  { const g = !!quests.gang?.chase, sr = !!quests.siren; if (g && !RUN.gangOn) logEv('gang', B.x, B.z); if (sr && !RUN.sirenOn) logEv('chase', B.x, B.z); RUN.gangOn = g; RUN.sirenOn = sr; }
  { const st = quests.police?.stops || 0; if (st > (RUN.stops ?? st)) logEv('police', B.x, B.z); RUN.stops = st; RUN.maxStreak = Math.max(RUN.maxStreak || 0, B.streak || 0); }
  if (RUN.snaps?.length && RUN.t >= RUN.snaps[0].at) { const q = RUN.snaps.shift(); try { q.e.img = photo(camera); } catch { } }
  stepLive(dt); stepFinale(dt);
  // (Express: how far along the street, for the locals' pace; past half way the rush hour, said once)
  { const p = streetP(); if (locals) locals.prog = p; if (LV.finish?.m && !RUN.rushHour && p > .55) { RUN.rushHour = true; flash('Godzina szczytu! Więcej aut, pilne gazety, tor już blisko.'); audio.play('bell', { vol: .5 }); } }
  if ((RUN.chk -= dt) > 0) return; RUN.chk = .1; stepJobs();
  const q = track.probe(me.x, me.z, B.hint), cp = RUN.cps[RUN.cp], a = ahead(q.i, cp), last = RUN.cp === RUN.cps.length - 1;
  const onRoad = Math.abs(q.d) < track.PAVE + 2 && !foot.active, passed = onRoad && (a < 3 || (RUN.prevA < 25 && a > track.len - 25)) && Math.hypot(me.x - track.S[cp].p.x, me.z - track.S[cp].p.z) < track.PAVE + 14; RUN.prevA = onRoad ? a : 1e9;
  if (passed) { RUN.cp++; RUN.minA = Infinity; RUN.prevA = 1e9; if (RUN.late && RUN.cp >= RUN.cps.length - 2) lateFinish(); if (RUN.cp >= RUN.cps.length) { finishLevel(); return; } audio.play('pick'); flash(last ? 'Meta!' : `Punkt ${RUN.cp} z ${RUN.cps.length - 1} zaliczony`); if (!last) radioSay('check'); }
  let rest = ahead(q.i, RUN.cps[RUN.cp]); for (let k = RUN.cp + 1; k < RUN.cps.length; k++) rest += ahead(RUN.cps[k - 1], RUN.cps[k]);
  if (rest < 130 && !RAD.fin && RUN.go) { RAD.fin = true; radioSay('finish'); }
  const aNow = ahead(q.i, RUN.cps[RUN.cp]); if (onRoad) RUN.minA = Math.min(RUN.minA, aNow); const wrong = onRoad && aNow > RUN.minA + 25;
  lvHud.innerHTML = `<b>${LV.name}${RUN.week ? ' · ' + DAYS[RUN.week.day] : ''}</b><span>${mmss(RUN.t)}</span><span>${wrong ? '<span class="w">ZAWRÓĆ: META W DRUGĄ STRONĘ</span>' : `META ${Math.round(rest)} M`}</span><span>GAZETY ${B.delivered || 0}/${LV.goal.papers}</span>${LV2.cur ? `<span class="live">☎ ${LV2.cur.kind === 'parcel' && !LV2.cur.got ? 'PACZUSZKA NA DRODZE' : JB.PERSONAS[LV2.cur.who]?.name.toUpperCase()} · ${Math.ceil(LV2.cur.left)} S</span>` : ''}${JOBRUN.filter(q => !q.done).map(q => `<span class="job">▸ ${JB.lineOf(q.j)}${q.door ? ' ' + Math.round(Math.hypot(me.x - q.door.p.x, me.z - q.door.p.z)) + ' M' : ''}</span>`).join('')}`; }
// ---------- the Classic's week: each run of a level a day, Monday to Sunday, the same subscribers day after day. Two days without a paper
// and one gives up (the door goes dark); a day without a miss wins one back; Sunday done, the week is passed (a bonus); fewer than three
// left, it starts again ----------
const DAYS = ['PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA', 'NIEDZIELA'];
// ---------- Express: the week is its five streets (K1 Monday … K5 Friday). Day to day carry on: the week's score, the readers' mood
// (B.sat, 0-100, a bar under the health) and the money; a street can be ridden again, its day then counts its best ----------
const XLV = () => LVM.LEVELS.filter(l => l.classic && !l.soon), xDay = L => Math.max(0, XLV().findIndex(l => l.id === L.id));
function xWeek() { const S = LVM.load(); return (S.xw ||= { sat: 60, days: [] }); }
function satAdd(n) { if (B.sat == null || !LV || RUN.done) return; B.sat = Math.max(0, Math.min(100, B.sat + n)); }
function weekStart(L) { const S = LVM.load(), ds = track.doors; S.week ||= {}; let W = S.week[L.id];
  // (Express: a door off the street (past the finish, behind the start) never reached: no subscriber there, in the week either)
  { const N = track.N, iJ = track.startI, span = Math.round(N * L.finish.to), off = d => { const i = d.i ?? track.probe(d.p.x, d.p.z, -1).i; return ((((i - iJ) % N) + N) % N) > span; };
    ds.forEach((d, k) => { if (!off(d)) return; d.sub = null; if (W) { W.subs[k] = null; W.miss[k] = 0; } }); }
  if (!W || W.n !== ds.length) { W = S.week[L.id] = { day: 0, n: ds.length, subs: ds.map(d => d.sub || null), miss: ds.map(() => 0) }; LVM.save(); }
  ds.forEach((d, i) => { d.sub = W.subs[i] ?? null; d.miss = W.miss[i] || 0; d.satMiss = false; }); assignSubs(false, true); RUN.week = W;
  // (Express: the day is the street's place in the week; Monday starts a new week; the readers' mood carried from the day before)
  const day = xDay(L); W.day = day; if (day === 0) { const S2 = LVM.load(); S2.xw = { sat: 60, days: [] }; LVM.save(); } B.sat = RUN.sat0 = xWeek().sat;
  const n = W.subs.filter(Boolean).length; setTimeout(() => flash(`${DAYS[day]}: ${n} abonentów. Zadowolenie czytelników: ${B.sat}%.`), 1800); }
function weekEnd(r) { const W = RUN.week; if (!W) return null;
  // (Express: no subscriber gives up (each street comes once a week); the day's points and the readers' mood kept for the week)
  if (LV?.classic) { const X = xWeek(), d = xDay(LV), of = W.subs.filter(Boolean).length, pts = r?.pts || 0; X.sat = B.sat ?? X.sat; if (!X.days[d] || pts >= X.days[d].pts) X.days[d] = { id: LV.id, pts, delivered: r?.delivered || 0, of };
    const score = X.days.reduce((a, q) => a + (q?.pts || 0), 0); LVM.save(); RUN.week = null;
    return { express: true, day: DAYS[d], next: d < 4 ? DAYS[d + 1] : null, of, left: of, lost: 0, warned: 0, back: false, over: false, full: d === 4, sat: X.sat, sat0: RUN.sat0 ?? X.sat, score }; }
  const ds = track.doors, of = W.subs.filter(Boolean).length; let lost = 0, all = true, warned = 0;
  ds.forEach((d, i) => { if (!W.subs[i]) return; if (d.done) { W.miss[i] = 0; return; } all = false; if (++W.miss[i] >= 2) { W.subs[i] = null; W.miss[i] = 0; lost++; } else warned++; });
  let back = false; if (all) { const A = ACT(), free = ds.map((d, i) => i).filter(i => !W.subs[i] && !ds[i].mine && !ds[i].stall); if (free.length) { W.subs[free[Math.random() * free.length | 0]] = A[Math.random() * A.length | 0]; back = true; } }
  const left = W.subs.filter(Boolean).length, day = W.day, over = left < 3, full = !over && day >= 6, S = LVM.load();
  if (over || full) delete S.week[LV.id]; else W.day++; LVM.save(); RUN.week = null;
  return { day: DAYS[day], next: over || full ? DAYS[0] : DAYS[day + 1], of, left, lost, warned, back, over, full }; }
// ---------- performance (the Classic's camera sees some 40 m): the people (skinned models, heavy) and the bikes (many small parts) far
// from him not drawn at all, and the people casting a shadow only near him; the street's small props (tufts, flowers, pickets, cones)
// cast none (the shadow pass draws every caster in its 48 m box a second time) ----------
track.group.traverse(o => { if (!o.isMesh || !o.castShadow || !o.geometry) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const sc = o.getWorldScale(new THREE.Vector3()), r = (o.geometry.boundingSphere?.radius || 0) * Math.max(sc.x, sc.y, sc.z); if (r < .45) o.castShadow = false; });
// (the street's still parts merged: once built, every mesh that nothing moves, swaps or hides (a house's walls, its roof, its fence, a
// planter) joins the others of its material in its 48 m square of ground, one draw for them all instead of hundreds; whatever the game
// keeps a hand on (the windows, the mailboxes, the things to knock over, the cars, the ramps, anything marked keep) stays as it was)
function mergeStatic() { const G = track.group, keep = new Set(), seen = new Set();
  const guard = o => { if (o !== G && !keep.has(o)) o.traverse(q => keep.add(q)); };
  const scan = (v, depth) => { if (!v || typeof v !== 'object' || seen.has(v) || depth > 3) return; seen.add(v); if (v.isObject3D) { guard(v); return; } if (v.isVector3 || v.isMaterial || v.isBufferGeometry) return;
    const proto = Object.getPrototypeOf(v); if (proto !== Object.prototype && proto !== Array.prototype) return; for (const w of Array.isArray(v) ? v : Object.values(v)) scan(w, depth + 1); };
  for (const k of ['windows', 'mailboxes', 'things', 'ramps', 'bundles', 'parked', 'kerbCars', 'standCars', 'gnomes', 'bins', 'fires', 'train', 'courses', 'openGarages', 'puddles', 'bikeZones']) scan(track[k], 0);   // (what the game changes: broken, flagged, knocked over, picked up, moved, lit)
  G.traverse(o => { if (o.userData?.keep || o.userData?.car) o.traverse(q => keep.add(q)); });
  G.updateMatrixWorld(true); const inv = G.matrixWorld.clone().invert(), cells = new Map(), v = new THREE.Vector3();
  G.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || keep.has(o) || Array.isArray(o.material) || o.material.transparent || o.userData.ground || !o.geometry?.attributes?.position) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.attributes.position.count > 3000 || o.geometry.boundingSphere.radius * o.getWorldScale(v).x > 10) return;   // (a big one, along the whole street: as it is)
    for (let p = o; p; p = p.parent) if (!p.visible) return;
    const g = o.geometry, mt = o.material, key = [mt.type, mt.color?.getHexString(), mt.map?.uuid, mt.vertexColors, mt.side, mt.alphaTest, mt.emissive?.getHexString(), mt.userData?.noFade, mt.flatShading, mt.depthWrite].join(':') + '|' + Object.keys(g.attributes).sort().join(',') + '|' + (g.index ? 'i' : 'n') + '|' + o.castShadow + o.receiveShadow + '|' + o.renderOrder + '|' + !!o.userData.noShadow;
    o.getWorldPosition(v); const ck = Math.floor(v.x / 48) + ',' + Math.floor(v.z / 48) + '|' + key; let l = cells.get(ck); if (!l) cells.set(ck, l = []); l.push(o); });
  let groups = 0, parts = 0, m4 = new THREE.Matrix4();
  for (const list of cells.values()) { if (list.length < 3) continue;
    const geos = list.map(o => { const g = o.geometry.clone(); g.morphAttributes = {}; g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld)); return g; });
    let mg = null; try { mg = mergeGeometries(geos, false); } catch { } geos.forEach(g => g.dispose()); if (!mg) continue;
    const a = list[0], m = new THREE.Mesh(mg, a.material); m.castShadow = a.castShadow; m.receiveShadow = a.receiveShadow; m.renderOrder = a.renderOrder; m.userData.merged = true; if (a.userData.noShadow) m.userData.noShadow = true; m.matrixAutoUpdate = false; G.add(m);
    for (const o of list) o.parent.remove(o); groups++; parts += list.length; }
  return { groups, parts }; }
const MERGED = /[?&]natura=(ult|mega)/.test(location.search) ? null : mergeStatic();
// (a comparison of the nature packs, by the address: ?natura=ult or ?natura=mega; see naturetest.js)
{ const NAT = new URLSearchParams(location.search).get('natura'); if (NAT === 'ult' || NAT === 'mega') import('./naturetest.js').then(m => m.natureSwap({ THREE, toon, track, mode: NAT })).then(n => { window.NATDONE = n; }); }
const PCULL = { t: 0, n: -1, list: [], v: new THREE.Vector3() };
function stepPerf(dt) { if ((PCULL.t -= dt) > 0) return; PCULL.t = .25;
  if (PCULL.n !== scene.children.length) { PCULL.n = scene.children.length; PCULL.list = [];
    for (const c of scene.children) { if (c === track.group || c === rider.root) continue; const ms = []; let sk = false; c.traverse(o => { if (o.isMesh) { ms.push(o); if (o.isSkinnedMesh) sk = true; } }); if (sk) { const only = ms.filter(o => o.isSkinnedMesh); PCULL.list.push({ ms: only, sk, probe: only[0] }); } } }   // (a person: only the model's own meshes, never a stand-in block hidden on purpose)
  const R2 = 55 * 55, S2 = 25 * 25;
  for (const e of PCULL.list) { if (!e.probe) continue; e.probe.getWorldPosition(PCULL.v); const d2 = (PCULL.v.x - B.x) ** 2 + (PCULL.v.z - B.z) ** 2, show = d2 < R2;
    for (const m of e.ms) { m.visible = show; if (e.sk) m.castShadow = show && d2 < S2; } } }
function finishLevel() { for (const R of JOBRUN) if (!R.done && R.j.kind === 'wyscig') jobEnd(R, RUN.t <= R.limit); RUN.done = true; const L = LV, wasOpen = new Set(LVM.LEVELS.filter(l => LVM.isOpen(l.id)).map(l => l.id));
  const r = { time: RUN.t, delivered: B.delivered || 0, thrown: B.thrown || 0, acc: B.thrown ? (B.delivered || 0) / B.thrown : 0, falls: B.falls || 0, earned: B.earned || 0, windows: B.windows || 0, pts: Math.max(0, B.points - (RUN.p0 ?? B.points)) }, wk = L.classic ? weekEnd(r) : null; if (wk?.full) B.points += 25;
  const before = LVM.starsOf(L.id), rec = LVM.record(L, r), opened = LVM.LEVELS.filter(l => LVM.isOpen(l.id) && !wasOpen.has(l.id)).map(l => l.soon ? l.name + ' (WKRÓTCE)' : l.name); saveCampaign();
  const got = LVM.rewardsFor(L.id, before, rec.best.stars), bonus = Math.round((B.earned || 0) * LVM.modBonus(RUN.mods || [])), inc = LVM.income();
  for (const g of got) { if (g.cash) B.points += g.cash; if (g.part) shop.grant(g.part[0], g.part[1]); g.name = g.cash ? `${g.cash} ZŁ` : partLabel(g.part[0], g.part[1]); }
  const FR = FIN.res || { targets: 0, of: 0, cones: 0, score: 0 }, finB = (FR.score || 0) + (FR.of && !FR.cones ? 5 : 0); B.points += bonus + inc + finB; const pay = { finale: { ...FR, bonus: finB }, earned: B.earned || 0, bonus, mods: (RUN.mods || []).map(id => LVM.MODS.find(m => m.id === id)?.t).filter(Boolean), income: inc, regulars: LVM.regulars(), got };
  for (const R of JOBRUN) if (!R.done && R.j.kind === 'szarlotka' && (R.j.runs = (R.j.runs || 0) + 1) >= 2) jobEnd(R, false);
  { const S = LVM.load(); for (const j of S.jobs || []) { const R = JOBRUN.find(q => q.j.id === j.id); if (R) j.runs = R.j.runs; } LVM.save(); }
  LVM.save({ mods: [] }); saveCampaign();
  audio.play('trick'); slowmo = .9; shutter(); let data; try { data = paperData(L, r, rec, opened); } catch (e) { console.error('paper', e); paperFail(L); return; } data.week = wk; data.pay = pay; data.money = B.points; { const S = LVM.load(); data.jobRes = S.jobRes || []; data.shots = RUN.shots || []; S.jobRes = []; LVM.save(); } data.faces = Object.fromEntries(Object.entries(JB.PERSONAS).map(([k, p]) => [k, faceOf(p.face)])); setTimeout(() => { B.v *= .3; clearFinale(); try { fin.open(data); } catch (e) { console.error('paper', e); paperFail(L); } }, 1100); }
// (the paper failed to come together: said so, and on to the next street (or home after the last) a moment after)
function paperFail(L) { flash('Meta! Gazeta dziś nie wyszła, jedziemy dalej.'); setTimeout(() => { const nx = (L.after || []).find(id => LVM.LEVEL(id) && !LVM.LEVEL(id).soon); if (fin.isOpen) fin.close(); nx ? startLevel(nx) : goHome(); }, 2600); }
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
  const log = RUN.log || [], count = k => log.filter(e => e.kind === k).length, ORDER = ['kick_granny', 'granny', 'gang', 'chase', 'kick_police', 'car', 'police', 'kick_gangm', 'kick_ped', 'window', 'kick_mailbox', 'kick_bike', 'dog', 'kick_dog', 'kick_car', 'rival_steal', 'rival_hit', 'train', 'barrier', 'tractor_paper', 'goose', 'kick_goose', 'goose_chase', 'goose_friend', 'kick_worker', 'worker_paper', 'kick_bronx', 'kick_tourist', 'tourist_paper', 'cwaniak_catch', 'glass', 'tyre', 'brick', 'load', 'forklift', 'combine', 'tray', 'roof', 'driveway', 'truck', 'course', 'rush', 'reverse', 'train_jump', 'dooring', 'kick_industry', 'industry_paper', 'homeless_paper', 'trick'], news = [];
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
  const next = nexts.map((l, k) => ({ id: l.soon ? null : l.id, name: l.name + (l.soon ? ' (WKRÓTCE)' : ''), note: l.soon ? (LVM.REGIONS.find(q => q.id === l.region)?.note || l.note) : l.note, first: k === 0, open: !l.soon && LVM.isOpen(l.id) })).filter(x => x.id || x.name);
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
const map = createMap({ levels: LVM, game: { edition: () => editionK, dio, onOpen: on => document.body.classList.toggle('mapopen', on), partName: (k, i) => partLabel(k, i), go: id => startLevel(id), home: () => goHome(), shop: () => { map.close(); reMap = true; shop.open(); }, flash: s => flash(s), sound: n => audio.play(n), current: () => LV?.id || 'dom', save: () => saveCampaign() } });
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
  { const me = foot.active ? foot.me : null, eyes = me ? foot.view === 'first' : CAMS[camI].fpv; FADE.cam.value.copy(camera.position); if (me) FADE.tgt.value.set(me.x, me.y + 1.2, me.z); else FADE.tgt.value.copy(rider.root.position).setY(rider.root.position.y + 1.1); FADE.r.value = eyes || menu.page === 'title' ? 0 : CAMS[camI].oblique ? 3.8 : 3; px.snap.tgt.copy(FADE.tgt.value); }   // (the thinning of what hides him)   // (the bag shows how many papers are left)
  drift(dt); stepPerf(dt); stepNight(B.x, B.z); stepRush(Math.min(dt, .05)); stepBlood(Math.min(dt, .05)); if (subGlows.length) stepGlows(performance.now() / 1000, Math.min(dt, .05));
  for (const e of director.update(Math.min(dt, .05), { x: B.x, z: B.z, v: B.v, yaw: B.yaw, foot: foot.active, air: B.air, hint: B.hint, busy: !!B.crash || !LV || (FIN.on && FIN.entered) || CROSS.some(X => Math.hypot(X.center.x - B.x, X.center.z - B.z) < 50) })) dirEvent(e); if (locals) for (const e of locals.update(Math.min(dt, .05), { x: foot.active ? foot.me?.x ?? B.x : B.x, z: foot.active ? foot.me?.z ?? B.z : B.z, v: B.v, yaw: B.yaw, foot: foot.active, air: B.air, h: (() => { const hh = B.y - track.probe(B.x, B.z, B.hint).y; return B.air || hh > .5 ? hh : 0; })(), vy: B.air ? B.vy : 0, hint: B.hint, ...(() => { const q = track.probe(B.x, B.z, B.hint); return { s: q.s, along: Math.sign(Math.sin(B.yaw) * q.f.x + Math.cos(B.yaw) * q.f.z) || 1 }; })() })) localEvent(e);
  // (a combine at the level crossing: it waits while the barrier is down, as the cars do)
  for (const C of locals?.combines || []) { const p = C.g.position, f = new THREE.Vector3(Math.sin(C.g.rotation.y), 0, Math.cos(C.g.rotation.y)); C.v = CROSS.some(X => X.state.mode !== 'idle' && (X.center.x - p.x) * f.x + (X.center.z - p.z) * f.z > 0 && Math.hypot(X.center.x - p.x, X.center.z - p.z) < 16) ? 0 : 2.8; } { const sh = track.net?.update?.(Math.min(dt, .05), foot.active ? { x: foot.me?.x ?? B.x, z: foot.me?.z ?? B.z, v: 0, vs: 0, yaw: 0, foot: true } : { x: B.x, z: B.z, v: Math.abs(B.v), vs: B.v, yaw: B.yaw, foot: false }); if (sh) hud.rant(sh.g.position, pickOf(sh.kind === 'mason' ? MASON_SHOUT : WORK_SHOUT), true, 1.95 + sh.y);
    for (const e of track.net?.events?.splice(0) || []) netEvent(e); } life.update(Math.min(dt, .05), camera.position); camera.updateMatrixWorld(); RIM.sun.value.copy(SUN).transformDirection(camera.matrixWorldInverse); RIM.up.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);   // (the sun, as the eye sees it)
  px.uniforms.wobT.value = (Math.floor(performance.now() / 125) * 1.37) % 97;   // (the line boiling: a new drawing eight times a second)
  { const q0 = track.probe(B.x, B.z, B.hint); audio.ride(foot.active || menu.open ? 0 : Math.abs(B.v), Math.abs(q0.d) > track.PAVE ? 1 : 0); }
  { const pc = quests.policeCars()[0]; audio.siren(quests.siren && !menu.open, where(pc && pc.g.position)); }
  audio.music(menu.page === 'title' || runUI.isOpen ? 'tytul' : quests.siren || quests.gangTargets.length ? 'poscig' : 'poranek');
  talkCam(dt); if (B.papers > (B.bagMax || 30)) { B.papers = B.bagMax || 30; if (!(B.fullT > 0)) { flash('Torba pełna'); B.fullT = 4; } } B.fullT = (B.fullT || 0) - dt;   // (no more than the bag holds)
  cullPeople(dt);
  if (!BOOT.drawn) { BOOT.drawn = true; requestAnimationFrame(() => document.body.classList.add('drawn')); renderer.compileAsync(scene, camera).catch(() => { }).finally(() => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('booted'))), 300)); }
  hudBag.update(dt, B.papers, B.bagMax || 30, px.size[0] / Math.max(1, px.size[1]), menu.page !== 'title', touch.on); if (map.isOpen) { hud.clear(); const so = px.snap.on; px.snap.on = false; px.render(dio.scene, dio.camera); px.snap.on = so; } else { if (window.PT?.camOverride) { const o = PT.camOverride; camera.position.set(...o.pos); camera.lookAt(...o.look); FADE.cam.value.copy(camera.position); FADE.tgt.value.copy(camera.position); }   // (a test camera, for looking at a scene from anywhere)
  px.render(scene, camera, hudBag); stepTitleBg(dt); drawHud(dt); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// (for the tests: how much there is along the route, per 25 m: the subscribers' doors, the things to ride or dodge or kick, the people
// standing about; the longest stretches without a subscriber, and without anything at all)
function dynAudit() { const N = track.N, ds = track.ds, bin = Math.max(1, Math.round(25 / ds)), nb = Math.ceil(N / bin), z = () => new Array(nb).fill(0), subs = z(), feats = z(), folk = z(), at = i => Math.floor((((i % N) + N) % N) / bin) % nb;
  const near = (x, zz) => { const q = track.probe(x, zz, -1); return Math.abs(q.d) < 16 ? at(q.i) : -1; };
  for (const d of track.doors) if (d.sub) { const k = near(d.p.x, d.p.z); if (k >= 0) subs[k]++; }
  for (const C of track.ramps || []) if (!C.used) feats[at(C.i)]++;
  for (const T of track.things || []) { const o = T.o, p = o?.getWorldPosition ? o.getWorldPosition(new THREE.Vector3()) : null; if (!p || T.kind === 'mailbox') continue; const k = near(p.x, p.z); if (k >= 0) feats[k]++; }
  for (const X of CROSS) feats[at(track.probe(X.center.x, X.center.z, -1).i)] += 3;
  for (const P of [...(locals?.people || []), ...(track.net?.workers || []), ...residents.list.map(r => ({ x: r.G.position.x, z: r.G.position.z }))]) { const k = near(P.x, P.z); if (k >= 0) folk[k]++; }
  const run = f => { let best = 0, cur = 0; for (let k = 0; k < nb * 2; k++) { if (f(k % nb)) { cur++; best = Math.max(best, cur); } else cur = 0; } return Math.min(best, nb) * bin * ds | 0; };
  const nSub = subs.reduce((a, b) => a + b, 0);
  return { len: track.len | 0, subsPer100m: +(nSub / track.len * 100).toFixed(1), feats: feats.reduce((a, b) => a + b, 0), folk: folk.reduce((a, b) => a + b, 0), noSubM: run(k => !subs[k]), quietM: run(k => !feats[k] && !folk[k]), emptyM: run(k => !subs[k] && !feats[k] && !folk[k]) }; }
window.PT = { THREE, tick: n => { const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; try { for (let k = 0; k < n; k++) frame(last + 1000 / 60); } finally { window.requestAnimationFrame = raf; } }, stepPerf, MERGED, FIN, CROSS, crossJumps, crossHidden, stepRush, TBG, titleBg, stepTitleBg, editionMenu, carRoofAt, get roofCar() { return roofCar; }, stepRivals, lateFinish, stepNight, locals, dynAudit, director, simRide: (n, inp = {}) => { const I = { steer: 0, pedal: 0, brake: 0, ...inp }; for (let k = 0; k < n; k++) { ride(1 / 60, I); stepFinale(1 / 60); } }, subMarks, tapQ, get hot() { return hot; }, get LV() { return LV; }, geese, radioScene, JB, LV2, liveOffer, liveTake, JOBRUN, snapJob, PHOTO_LOOK, setPhotoStyle: s => { photoStyle = s; }, photo, faceOf, photoOf, startLevel, goHome, map, fin, LVM, RUN, unlockTitle, stuff, scene, camera, hudBag, quests, talk, shop, book, audio, hurt, endRun, runUI, deliver, TITLES, rider, track, B, px, renderer, traffic, dogs, hud, granny, foot, dismount, mount, peds, residents, aim, breakWindow, setCam, crash, setInk, dropLoot, drops, paperHits,   // (for looking in from the console; tick: the game run on by hand, n frames of 1/60 s)
  tick(n, inp = {}) { for (let i = 0; i < n; i++) step(1 / 60, { steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, ...inp, hop: i === 0 && !!inp.hop, kick: i === 0 && !!inp.kick }); px.render(scene, camera); drawHud(1 / 60); }, resetGame, hot, papers, modes, mp, use, get P1() { return P1; }, get P2() { return P2; }, get MPon() { return MP.on; }, net, wbikes, get myBike() { return myBike; }, INV, swapTo, bikeChoices, get garage() { return garage; }, hoops, onFootAt };
