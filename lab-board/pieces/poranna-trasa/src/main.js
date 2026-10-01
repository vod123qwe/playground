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
const track = createTrack({ THREE, toon, tex: createTextures({ THREE }), showcase: new URLSearchParams(location.search).has('audit') }); track.dapSun.value.copy(SUN); scene.add(track.group);
const backdrop = createBackdrop({ THREE }); backdrop.position.set(track.centre.x, 16, track.centre.z); scene.add(backdrop);   // (the lake and the town, all round)
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
let MOD = { top: 0, acc: 0, steer: 0, grass: 0, hill: 0, stam: 0, bag: 0, trick: 0, bell: 0, lamp: 0 };   // (what the bike's parts do: shop.js)
const shop = createShop({ THREE, createRider: () => createRider({ THREE, ramp, toon }), game: { get money() { return B.points; }, set money(v) { B.points = Math.max(0, v); }, get papers() { return B.papers; }, set papers(v) { B.papers = v; }, get hp() { return B.hp ?? 100; }, set hp(v) { B.hp = v; },
  get items() { return (B.items ||= []); }, flash: s => flash(s), say: s => audio.say(s, 'janusz', { id: 'shop' }), bye: s => { const sh = (track.shops || []).filter(q => q.door).sort((a, b) => Math.hypot(a.door.x - B.x, a.door.z - B.z) - Math.hypot(b.door.x - B.x, b.door.z - B.z))[0]; if (sh) hud.rant(sh.door.clone().setY(sh.door.y + 2.1), s, false); }, get titles() { return ACT().map(k => ({ key: k, name: TITLES[k].name, col: TITLES[k].col, n: B.mix[k] })); }, addTitle: (k, n) => { B.mix[k] += n; B.papers += n; }, onChange: (m, look) => { MOD = m; B.bagMax = 30 + m.bag; rider.setParts(look); } } });
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
for (const b of track.home?.bikes || []) { const r = createRider({ THREE, ramp, toon }); r.boy.visible = false; scene.add(r.root); const y = track.probe(b.p.x, b.p.z, track.home.iJ).y;
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
    B.x = S.p.x + S.r.x * 3.2; B.z = S.p.z + S.r.z * 3.2; B.hint = i; B.y = track.probe(B.x, B.z, i).y; B.yaw = Math.atan2(S.f.x, S.f.z); parkBike(); flash('Ukradł ci rower! Rzucił go dalej przy drodze.');
    return pickOf(['POŻYCZĘ NA CHWILĘ!', 'TERAZ TY IDZIESZ Z BUTA!', 'DAWAJ KOŁA, KOLEGO!']); }
  B.points = Math.max(0, B.points - 3); flash('Zrobił sobie z tobą selfie. -3 zł za prawa do wizerunku.'); return pickOf(['FOTKA NA GRUPĘ OSIEDLA!', 'UŚMIECH! DO RELACJI!', 'MAMA BĘDZIE DUMNA!']);
}
const foot = createOnFoot({ THREE, toon, scene, track, hud, camera, solid, fx: { score: (n, at, l, c) => score(n, at, l, c), flash: t => flash(t), shake: v => { shake = Math.max(shake, v); }, slow: v => { slowmo = Math.max(slowmo, v); },
  rant: (at, t) => hud.rant(at, t, true), pop: (at, t, c) => hud.pop(at, t, c), tip: t => hud.tip(t), impact: (at, t) => hud.impact(at, t || undefined), take: () => loseFight(), drop: at => dropLoot(at) } });
function parkBike() { rider.root.position.set(B.x, B.y, B.z); rider.root.rotation.set(0, B.yaw, .2, 'YXZ'); }   // (the bike on its stand, leaning a little)
function dismount(why) {
  const lf = { x: Math.cos(B.yaw), z: -Math.sin(B.yaw) };
  if (!foot.start({ x: B.x + lf.x * .8, z: B.z + lf.z * .8, yaw: B.yaw, hint: B.hint })) return false;
  B.v = 0; B.charge = null; B.kick = null; B.parked = true; rider.boy.visible = false; parkBike(); flash(why || 'Pieszo. Kliknij: mysz steruje. F przy rowerze: wsiadasz, V: widok z oczu'); return true;
}
function mount() { if (document.pointerLockElement) { mouse.hadLock = false; document.exitPointerLock(); }   // (let go on purpose: not the Esc that pauses)
  mouse.used = false; foot.stop();
  if (B.bikeDown) { B.lift = { t: 0, from: B.bikeDown.lean }; B.lean = B.bikeDown.lean; B.bikeDown = null; flash('Podnosisz rower'); } B.parked = false; rider.boy.visible = true; C.init = false; flash('Na rowerze!'); }
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
  { id: 'mount', keys: ['KeyF'], modes: ['bike', 'walk'] }, { id: 'view', keys: ['KeyV'], modes: ['bike', 'walk', 'fight'] }, { id: 'talk', keys: ['KeyE'], modes: ['walk'] }, { id: 'chat', keys: ['KeyT'], modes: ['bike'] }, { id: 'title', keys: ['KeyX'], modes: ['bike', 'walk'] }, { id: 'bell', keys: ['KeyB'], modes: ['bike'] },
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
  title: BTN.UP, bell: BTN.DOWN, punchL: BTN.X, punchR: BTN.Y, high: BTN.UP, low: BTN.DOWN, guard: BTN.RB, dodge: BTN.LB, taunt: BTN.LEFT };
const padKey = id => PADB[id] == null ? '—' : PADB[id] === 'LS' ? 'LEWA GAŁKA' : pad.name(PADB[id]);
const keysOf = id => pad.active ? padKey(id) : BIND[id].filter((c, i, a) => !(c === 'ShiftRight' && a.includes('ShiftLeft'))).map(keyName).join(' / ') || '—';
const clashes = (id, code) => { const A = ACTIONS.find(a => a.id === id); return ACTIONS.filter(b => b.id !== id && BIND[b.id].includes(code) && (A.modes.includes('all') || b.modes.includes('all') || b.modes.some(m => A.modes.includes(m)))).map(b => b.id); };
// what each is, where (the menu's page and the help window list them so)
const SECTIONS = [
  { title: 'NA ROWERZE', items: [['pedal', 'PEDAŁUJ'], ['brake', 'HAMUJ (NA POSTOJU: COFAJ)'], ['left', 'SKRĘĆ W LEWO'], ['right', 'SKRĘĆ W PRAWO'], ['sprint', 'SZYBCIEJ'],
    ['throwL', 'RZUT W LEWO (KLIKNIJ: SAM LECI DO CELU W RAMCE · TRZYMAJ: SIŁA I CELOWANIE)'], ['throwR', 'RZUT W PRAWO'], ['kick', 'KOPNIAK · W LOCIE ZE SKOCZNI: TRICK (KLIKNIJ, KRĘCI SIĘ SAM; JESZCZE RAZ: KOMBO)'], ['hop', 'PODSKOK'], ['mount', 'ZSIĄDŹ Z ROWERU'], ['view', 'NASTĘPNA KAMERA'],
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
addEventListener('mousedown', e => { if (menu.open || asking || talk.isOpen || shop.isOpen || e.target.closest?.('#styl, #stylBtn, #pix, #ink, #talk, button, .mppage')) return;
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
    if (!fixed) d.sub = Math.random() < .55 ? A[Math.random() * A.length | 0] : null; if (!d.sub) continue;
    const n = d.n, fa = d.p.clone().addScaledVector(n, -2.6), side = new THREE.Vector3(-n.z, 0, n.x), pl = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(.34, .24, .03), toon('#f6f3ea')); pl.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(.28, .08, .035), bandOf[d.sub]); c.position.y = .04; pl.add(c);
    pl.position.copy(fa).addScaledVector(n, .06).addScaledVector(side, .95); pl.position.y += 1.55; pl.rotation.y = Math.atan2(n.x, n.z); scene.add(pl); plaques.push(pl); d.plaque = pl; } }
assignSubs();
// the streak: subscribers served one after another (no wrong ones, none passed by, no paper thrown wide of one): every 3 more, the points
// count once more (to x4); shown under the speed
const streakMult = () => Math.min(4, 1 + Math.floor((B.streak || 0) / 3));
let streakEl = document.createElement('div'); streakEl.id = 'streak'; streakEl.className = 'streak'; document.body.appendChild(streakEl);
{ const st = document.createElement('style'); st.textContent = `.streak { position: fixed; left: 16px; top: 128px; z-index: 3; pointer-events: none; font: 700 11px/1 ui-monospace, 'Cascadia Mono', Consolas, monospace; letter-spacing: .08em; color: #17181b; background: #9fd27a; padding: 4px 6px; box-shadow: 0 0 0 2px #17181b; opacity: 0; transition: opacity .25s; }
  .streak.on { opacity: 1; } .streak.x1 { background: #efc970; } .streak.lost { background: #cf5a3e; color: #f6f3ea; } @media (max-width: 639px) { #streak { top: 92px; } }`; document.head.appendChild(st); }
function drawStreak(lost) { const n = B.streak || 0; streakEl.className = 'streak ' + (lost ? 'on lost' : n ? 'on' + (streakMult() > 1 ? '' : ' x1') : ''); streakEl.textContent = lost ? 'SERIA PRZERWANA' : `SERIA ${n}` + (streakMult() > 1 ? ` · x${streakMult()}` : ` · x2 ZA ${3 - n % 3}`); if (lost) { const e0 = streakEl, b0 = B; setTimeout(() => { if (!(b0.streak > 0)) e0.className = 'streak'; }, 1400); } }
function breakStreak() { const had = (B.streak || 0) >= 2; B.streak = 0; if (had) { drawStreak(true); audio.play('miss', { vol: .6 }); } else if (!streakEl.classList.contains('lost')) streakEl.className = 'streak'; }
// a subscriber ridden past without a paper: the streak goes (counted once each time by)
function stepPassed() { if (foot.active) return; const fx = Math.sin(B.yaw), fz = Math.cos(B.yaw);
  for (const d of track.doors) { if (!d.sub || d.done) continue; const dx = d.p.x - B.x, dz = d.p.z - B.z; if (Math.abs(dx) + Math.abs(dz) > 40) { d.seen = false; continue; } const fw = dx * fx + dz * fz, l = Math.hypot(dx, dz);
    if (fw > 3 && l < 26) d.seen = true; else if (d.seen && fw < -9 && B.v > 2) { d.seen = false; if (B.streak > 0) { breakStreak(); flash('Minąłeś prenumeratora bez gazety'); } } } }
// a paper come down by a house: the right title for its subscriber (paid in full), the wrong one (a little, and words), or a house that takes none
function deliver(hi, base, at, how, title) {
  const d = track.doors[hi], sub = d && d.sub, up = at.clone().setY(at.y + 1.3);
  if (!sub) { breakStreak(); hud.rant(up, pickOf(['NIE ZAMAWIAŁEM!', 'ZA DARMO? NO TO BIORĘ.', 'ZNOWU ULOTKI?!', 'JA NIE CZYTAM, JA OGLĄDAM!']), false); flash('Ten dom nic nie prenumeruje'); return false; }
  if (sub === title) { B.delivered = (B.delivered || 0) + 1; B.streak = (B.streak || 0) + 1; const mult = streakMult(), pts = base * mult; score(pts, at, '+' + pts + (mult > 1 ? ' x' + mult : ''), mult > 1 ? '#9fd27a' : '#efc970');
    if (B.streak % 3 === 0 && mult > 1) { hud.impact(at.clone().setY(at.y + 1.2), 'SERIA x' + mult + '!'); audio.play('trick'); }
    flash(`${how}: ${TITLES[title].short.toLowerCase()} dla prenumeratora! +${pts}${mult > 1 ? ` (seria ${B.streak}, x${mult})` : ''}`); drawStreak(); return true; }
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
  papers.push({ m, v, dot, prev: m.position.clone(), spin: new THREE.Vector3(8 + Math.random() * 4, 0, 3), hint: B.hint, t: 0, rest: false, landed: false, title, guided: !!A });
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
  w.broken = true; aud('glass', w.p); if (!remote) B.windows = (B.windows || 0) + 1; { const d = track.doors[w.house]; if (d && d.sub) { d.sub = null; if (d.plaque) d.plaque.visible = false; setTimeout(() => hud.rant(w.p.clone().add(new THREE.Vector3(0, 1.4, 0)), pickOf(['REZYGNUJĘ Z PRENUMERATY!', 'KONIEC Z GAZETAMI!', 'ODPISUJĘ SIĘ!']), false), 700); } } B.fame = (B.fame || 0) + .4; quests.onWindow(w); const m = new THREE.Mesh(new THREE.PlaneGeometry(w.hw * 1.9, w.hh * 1.9), crackM); m.position.copy(w.p).addScaledVector(w.n, .015); m.lookAt(m.position.clone().add(w.n)); scene.add(m); cracks.push(m);
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
        if (door) { door.done = true; served(door); aud('porch', at); deliver(track.doors.indexOf(door), 2, at, 'Na ganek', p.title); }
        else for (const mb of track.mailboxes) { const w = mb.o.position; if (!mb.done && Math.hypot(w.x - p.m.position.x, w.z - p.m.position.z) < 1.4) { mb.done = true; boxed = true; mb.flag.rotation.x = -Math.PI / 2; aud('mailbox', w); const hi = mb.house ?? (mb.house = nearestDoor(w)); if (track.doors[hi]) track.doors[hi].done = true; served(track.doors[hi], mb); if (!deliver(hi, 5, w.clone().setY(w.y + 1.5), 'Do skrzynki', p.title)) break;
            const win = track.windows.filter(o => !o.broken).sort((a, b) => a.p.distanceToSquared(w) - b.p.distanceToSquared(w))[0];   // (thanks from the nearest window of the house)
            hud.praise(win && win.p.distanceTo(w) < 16 ? win.p.clone().add(new THREE.Vector3(0, .9, 0)) : w.clone().setY(w.y + 2.6)); break; } }
        if (!door && !boxed && (w0 = under())) { track.doors[w0.house].done = true; served(track.doors[w0.house]); deliver(w0.house, 1, at, 'Pod okno', p.title); }
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
const difficulty = () => Math.min(1, trip.dist / 8000);
// the run's level: up one every kilometre (to 6): more cars out and a little quicker, dogs keener; said when it goes up
const level = () => Math.min(6, 1 + Math.floor(trip.dist / 1000)), carsAt = l => Math.min(6, l + 1), heat = l => .55 + (l - 1) * .13;
const LVL_SAY = ['', '', 'Więcej aut na drodze', 'Psy coraz bardziej czujne', 'Ruch jak w godzinach szczytu', 'Kierowcy się spieszą', 'Pełny poranek! Trzymaj się'];
function stepLevel() { const l = level(); if (l === B.lvl) return; if (B.lvl) { flash(`POZIOM ${l}: ${LVL_SAY[l]}`); audio.play('trick'); } B.lvl = l; }
function hurt(n, why) { if (endT > 0) return; audio.play('hurt', { vol: .6 }); B.hp = Math.max(0, (B.hp ?? 100) - n); if (B.hp <= 0) { endT = 2.4; endWhy = why || 'Zdrowie się skończyło.'; } }
let endT = 0, endWhy = '';
const runUI = createRun({ onAgain: () => { resetGame(); fromAccount(); } });
// the notebook (Tab): who thinks what of you, the bike, what you carry, how you are
const book = createBook({ data: () => ({ reps: quests.reps(), parts: shop.equipped(), items: B.items || [], kept: kept(), hp: B.hp ?? 100, money: B.points, fame: B.fame || 0, papers: ACT().map(k => ({ name: TITLES[k].name, n: B.mix[k], col: TITLES[k].col })), dist: trip.dist }) });
function endRun(why) { if (runUI.isOpen) return; endT = 0; runUI.open({ reason: why, dist: trip.dist, delivered: B.delivered || 0, earned: B.earned || 0, windows: B.windows || 0, stops: quests.police?.stops || 0 }, [...shop.ownedList(), ...(B.items || []).map(n => ({ label: 'FANT: ' + n, keep: { item: n } }))]); }
function fromAccount() { const all = kept(); for (const k of all) { if (k.keep.part) shop.grant(k.keep.part, k.keep.tier); else if (k.keep.item) (B.items ||= []).push(k.keep.item); } if (all.length) flash('Z konta: ' + all.map(k => k.label.toLowerCase()).join(', ')); }
setTimeout(() => fromAccount(), 0);   // (the first run too)
function crash(side, push, robbed) {                                 // push: what hit him (a car's velocity), if anything; robbed: the old woman got him
  if (B.crash) return; audio.play('crash'); hurt(push ? 30 : 15, push ? 'Auto było twardsze.' : 'Za dużo wywrotek na jeden poranek.'); B.crash = { t: 0, side: side || (B.lean >= 0 ? 1 : -1), up: false, robbed }; B.charge = null; aim.on = false; aim.G.visible = false; flash('Wywrotka!');
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
      if (c.t > 3.3) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; rider.root.visible = true; }
    } else {
      if (c.t > 2.3 && !c.up) { c.up = true; const p = rider.pelvisAt ? rider.pelvisAt.clone() : new THREE.Vector3(B.x, B.y, B.z);   // (up on his feet; the bike stays down)
        if (foot.ready && foot.start({ x: p.x, z: p.z, yaw: B.yaw, hint: B.hint, getUp: true })) { rider.ragdollOff(); rider.boy.visible = false; B.crash = null; B.v = 0; B.parked = true; B.bikeDown = { lean: B.lean }; flash('Wstań i podnieś rower: F przy rowerze'); return; }
        rider.getUp(1); }                                                // (the models not there yet: back onto the bike as before)
      if (c.t > 3.4) { B.crash = null; B.v = 0; B.lean = 0; B.leanV = 0; }
    }
    if (c.moved) { B.lean = 0; B.leanV = 0; B.v = 0; }
    B.y += (q.y - B.y) * Math.min(1, dt * 12); pose(dt, 0, 0, slope, Math.min(1, Math.abs(B.lean) / 1.3)); return;
  }
  const off = Math.abs(q.d) > track.PAVE && !track.home?.paved(B.x, B.z);   // (the home's street: asphalt, though off the loop)
  // the push: strong from standing, falling off towards 9 m/s (a little more with Shift); the brake; the air, the tyres, the grass; the hill; a dog
  // (B.v is signed: held at a stop, the brake walks him backwards, slowly)
  const accK = 1 + MOD.acc, topK = 1 + MOD.top, push = inp.pedal * (inp.sprint ? 1.35 : 1) * Math.max(0, (inp.sprint ? 3.9 : 3.4) * accK - Math.max(0, B.v) * (inp.sprint ? .33 : .36) * accK / topK);   // (the parts: shop.js)
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
  const rp = rampAt(nx, nz), ground = track.probe(nx, nz, B.hint).y + rp.h;
  if (rp.wall && B.v > 2 && !B.air) { B.x = nx; B.z = nz; crash(); return; }
  if (inp.hop && !B.air) { B.air = true; B.vy = 3.8 + (B.onRamp ? Math.max(0, B.gVel) : 0); B.airRamp = B.onRamp ? (B.onRamp.size || 'plank') : null; }   // (hopped off a ramp: higher, and a trick allowed)
  if (B.air) { B.vy -= g * dt; B.y += B.vy * dt; if (B.y <= ground) { B.airRamp = null;
    if (B.trick) { const T = B.trick; B.trick = null;
      if (T.p < .7) { B.y = ground; B.air = false; B.vy = 0; B.airRamp = null; B.done = []; flash('Za późno! Trik od razu po wybiciu'); crash(0); return; }
      if (T.p < 1) T.pulled = true; const all = [...(B.done || []), T]; B.done = [];
      const clean = all.every(o => !o.pulled), n = all.reduce((a, o) => a + o.pts, 0) + (clean ? 1 : 0) + (all.length - 1) * 2;
      const lab = all.map(o => o.name).join(' + ') + (clean ? ' CZYSTO' : ' NA STYK'); if (clean) quests.gangRep(.3); audio.play('trick'); score(n, rider.root.position.clone().add(new THREE.Vector3(0, 1.9, 0)), lab + ' +' + n, '#efc970'); flash(lab + '! +' + n); }
    if (B.vy < -5.2) { B.jolt = .14; B.v *= .9; } else if (B.vy < -2) B.jolt = .07; B.air = false; B.vy = 0; B.trick = null; B.airRamp = null; B.y = ground; } }
  else { if (ground < B.y - .05 && B.gVel > 1) { const R0 = B.onRamp; B.air = true; B.vy = R0 ? B.gVel * 1.2 + (R0.size === 'big' ? 1.9 : R0.size === 'kicker' ? .9 : 1.1) : B.gVel; B.airRamp = R0 ? (R0.size || 'plank') : null; B.y += B.vy * dt; } else B.y = ground; }
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
      const bv = new THREE.Vector3(Math.sin(C.t.yaw), 0, Math.cos(C.t.yaw)).multiplyScalar(C.t.stop > 0 ? 0 : C.t.v), mv = new THREE.Vector3(Math.sin(B.yaw), 0, Math.cos(B.yaw)).multiplyScalar(B.v), hard = mv.clone().sub(bv).length() > 3.4;
      traffic.knock(C.t, mv, hard); if (hard) { quests.onKnockBike(C.t); C.t.ghostUntil = performance.now() + 7000; if (Math.random() < .3) foot.grudge(C.t); }
      if (!(C.t.rantAt > performance.now())) { C.t.rantAt = performance.now() + 2500; hud.rant(C.t.r.root.position, hard ? pickOf(OUCH) : pickOf(SWEARS), true, 2); if (hard) witness(C.t.x, C.t.z); }
      if (hard) { crash(0, bv.multiplyScalar(.5)); return; } B.x = nx + h.nx * (h.pen + .02); B.z = nz + h.nz * (h.pen + .02); B.v *= .55; B.jolt = .12; return pose(dt, 0, 0, slope, 0); }
    if (h) { C.t.stop = 2.5; if (Math.abs(B.v) > 2.2 || C.t.v > 2.5) { crash(0, new THREE.Vector3(Math.sin(C.t.yaw), 0, Math.cos(C.t.yaw)).multiplyScalar(C.t.v)); return; } B.x = nx + h.nx * (h.pen + .01); B.z = nz + h.nz * (h.pen + .01); B.v *= .4; return pose(dt, 0, 0, slope, 0); } }
  B.x = nx; B.z = nz;
  // (round the home's circle the yards go further out than the loop's 28 m: there the edge is a ring round the circle)
  const q2 = track.probe(B.x, B.z, B.hint), H0 = track.home; if (H0?.yard(B.x, B.z)) { const dx = B.x - H0.C0.x, dz = B.z - H0.C0.z, r = Math.hypot(dx, dz); if (r > H0.C0R) { B.x = H0.C0.x + dx / r * H0.C0R; B.z = H0.C0.z + dz / r * H0.C0R; B.v *= .95; } }
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
  for (const C of track.near(B.hint)) if (C.hyd) add('hyd', C.x, C.z, C, 1.9);
  for (const T of stuff.near(B.x, B.z, 2.2)) if (!T.broken && !T.down) add('thing', T.x, T.z, T, 2.2 + T.r);
  if (net.on && P2.rider.root.visible && !P2.B.crash) add('rider', P2.B.x, P2.B.z, P2, 2.7);   // (over the network: the other player)
  return out.sort((a, b) => a.d - b.d);
}
function landKick(tg) {
  const at = { rider: () => [tg.ref.B.x, tg.ref.B.z], dog: () => [tg.ref.x, tg.ref.z], ped: () => [tg.ref.x, tg.ref.z], car: () => [tg.ref.x, tg.ref.z], bike: () => [tg.ref.x, tg.ref.z], granny: () => [tg.ref.group.position.x, tg.ref.group.position.z], hyd: () => [tg.ref.x, tg.ref.z], police: () => [tg.ref.g.position.x, tg.ref.g.position.z], gangm: () => [tg.ref.x, tg.ref.z], thing: () => [tg.ref.x, tg.ref.z] }[tg.kind]();
  const ax = at[0] - B.x, az = at[1] - B.z, al = Math.hypot(ax, az) || 1; if (al > (tg.kind === 'car' ? 3.4 : 3.3)) return;   // (it got away)
  const mid = new THREE.Vector3(B.x + ax * .55, B.y + .7, B.z + az * .55);
  if (tg.kind === 'dog') { dogs.kick(tg.ref, { x: ax / al * 4.5 + Math.sin(B.yaw) * B.v * .5, z: az / al * 4.5 + Math.cos(B.yaw) * B.v * .5 }); hud.impact(mid); slowmo = .09; shake = .3; }   // it flies off
  if (tg.kind === 'ped' && quests.onHitPed(tg.ref)) { hud.impact(mid, 'ŁUP!'); slowmo = .08; shake = .25; }   // (the thief: the bag drops)
  else if (tg.kind === 'ped') { hud.impact(mid); tg.ref.stun = 1.6; hud.rant(tg.ref.G.position, pickOf(SWEARS), true, 1.95); slowmo = .06; shake = .22; }   // they stop, and swear after him
  if (tg.kind === 'bike') { hud.impact(mid); quests.onKnockBike(tg.ref); traffic.knock(tg.ref, new THREE.Vector3(ax / al * 3.2, 0, az / al * 3.2), true); if (Math.random() < .8) foot.grudge(tg.ref); tg.ref.ghostUntil = performance.now() + 5000; hud.rant(tg.ref.r.root.position, pickOf(SWEARS), true, 2.0); slowmo = .06; shake = .22; }
  if (tg.kind === 'car') { hud.impact(mid, 'BUM!'); tg.ref.stop = Math.max(tg.ref.stop, .7); hud.rant(tg.ref.car.group.position, pickOf(DRIVERS), true, 1.7); shake = .28; }   // the driver: the bubble goes with the car
  if (tg.kind === 'gangm') { hud.impact(mid); quests.onKickGang(tg.ref); slowmo = .06; shake = .22; }   // (one of the gang: off his bike)
  if (tg.kind === 'police') { hud.impact(mid, 'BUM!'); shake = .28; quests.onKickPolice(tg.ref); }   // (a police car: see quests)
  if (tg.kind === 'rider') { const how = mp.kick(meId(), otherId()); hud.impact(mid, how === 'tag' ? 'BEREK!' : 'ŁUP!'); shake = .25; audio.play('kick', { vol: .7 }); net.send({ k: 'kick', how, dx: ax / al, dz: az / al }); }   // (the other player: off his bike in the race, a shove otherwise)
  if (tg.kind === 'granny') { tg.ref.kicked(); hud.rant(tg.ref.mouth, 'JA CI DAM GNOJKU!', true); shake = .12; }   // (the old woman: a kick does nothing, bar make her crosser)
  if (tg.kind === 'thing') { stuff.hit(tg.ref, ax, az, 1); shake = Math.max(shake, tg.ref.kind === 'mailbox' ? .08 : .03); }   // (from the bike: as on foot)
  if (tg.kind === 'hyd' && water.spray(new THREE.Vector3(tg.ref.x, tg.ref.y0 || 0, tg.ref.z), 4.5)) { hud.impact(new THREE.Vector3(tg.ref.x, (tg.ref.y0 || 0) + .5, tg.ref.z), 'PSSS!'); shake = .15; }
}
// puddles: a wheel (or a foot) through one throws it up; at speed by the pavement, whoever stands there gets it, and says so; mud holds a bike back
let inPud = null;
function stepPuddles(me) { let P0 = null; for (const P of track.puddles || []) if (Math.abs(P.x - me.x) < 3 && Math.abs(P.z - me.z) < 3 && Math.hypot(P.x - me.x, P.z - me.z) < P.r) { P0 = P; break; }
  if (P0 && P0 !== inPud && me.v > (me.foot ? 1.2 : 1.6)) { stuff.splash(me.x, me.z, P0.mud, me.v); if (!me.foot) { B.v *= P0.mud ? .72 : .94; B.jolt = .05; }
    if (!me.foot && me.v > 3) for (const p of peds.list) if (Math.hypot(p.x - me.x, p.z - me.z) < 3.4) { hud.rant(mouthOf(p), pickOf(['OBLAŁEŚ MNIE!', 'MOJE SPODNIE!', 'GNOJEK JEDEN!', 'UWAŻAJ, JAK JEDZIESZ!']), false); p.faceT = 1.5; break; } }
  inPud = P0; }
// ---------- the dogs: which is at his heel; the kick ----------
let barkers = [];
const nearDog = () => barkers.find(n => n.dist < 2.9);
function stepDogs(dt, inp) {
  barkers = dogs.update(dt, { x: B.x, z: B.z, v: B.v, yaw: B.yaw, heat: modes.flags.calm ? 0 : heat(level()) }); stepLevel();
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
  if (inp.kick && B.air && B.airRamp && !B.crash && (!B.trick || B.trick.p >= 1)) { const big = B.airRamp === 'big', st = inp.steer, left = airLeft();
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
let C = { yaw: B.yaw, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false, gy: 0, iy: Math.PI, iyGo: false };   // (iy: the opening shot, from in front of him, the house behind him; it swings round behind him as he sets off)
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
  if (use) { B.stam = Math.max(0, B.stam - dt / (5.5 * (1 + MOD.stam))); B.rest = 0; if (B.stam === 0) { B.spent = true; flash('Zadyszka!'); } }
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
  if (inp.mount && !B.crash && !B.air) { if (!foot.active) { if (Math.abs(B.v) < 2.2) dismount(); else flash('Zwolnij, żeby zsiąść'); }
    else if (foot.fighting) flash('Najpierw bójka!'); else if (foot.nearBike(B)) mount(); else flash('Rower jest dalej'); }
  if (inp.bell && !foot.active) { if (MOD.bell > 0) { audio.play('bell'); B.bellT = 2.5; } else flash('Dzwonek kupisz u Janusza'); }
  syncMix(); if (inp.title) { const A = ACT(); if (A.length < 2) flash('Na razie wozisz jedną gazetę: ' + TITLES[A[0]].name.toLowerCase());
    else { for (let k = 1; k <= A.length; k++) { const t = A[(B.sel + k) % A.length]; if (B.mix[t] > 0 || k === A.length) { B.sel = (B.sel + k) % A.length; break; } } flash('Rzucasz: ' + TITLES[TK[B.sel]].name.toLowerCase()); } }
  if (B.nt < TK.length && trip.dist >= TITLE_AT[B.nt] && menu.page !== 'title' && !MP.on) unlockTitle(B.nt + 1);   // (two players: one title each, the same)
  if (endT > 0 && (endT -= dt) <= 0) endRun(endWhy); B.hp = Math.min(100, (B.hp ?? 100) + dt / 12); if (B.points > (B.lastPts ?? 0)) B.earned = (B.earned || 0) + B.points - B.lastPts; B.lastPts = B.points;
  quests.update(dt, inp);                                               // (who is near to talk to; the errands; the thief)
  if (foot.active) return stepFoot(dt, inp);
  stamina(dt, inp); if (!B.crash) { trip.dist += Math.abs(B.v) * dt; trip.max = Math.max(trip.max, Math.abs(B.v)); if (Math.abs(B.v) > .5) trip.time += dt; }
  throwing(dt, inp); stepAim(); stepDogs(dt, inp); ride(dt, inp); water.update(dt); stepFires(dt); stepTaunts(); residents.update(dt, { x: B.x, z: B.z, v: B.v, line: quests.lineFor });
  { const q = track.probe(B.x, B.z, B.hint), p = peds.update(dt, { x: B.x, z: B.z, v: B.v, d: q.d, busy: !!B.crash, bell: MOD.bell > 0 && (B.bellT = (B.bellT || 0) - dt) > -4 });   // someone walking: ridden into, over he goes
    if (p) { crash(0, new THREE.Vector3(B.x - p.x, 0, B.z - p.z).setLength(1.5)); hud.rant(p.G.position.clone().add(new THREE.Vector3(0, 1.9, 0)), 'UWAŻAJ!'); } }
  { const q = track.probe(B.x, B.z, B.hint), ev = granny.update(dt, { x: B.x, z: B.z, far: Math.abs(q.d) > 16 && !track.home?.yard(B.x, B.z) && !modes.flags.calm, road: Math.abs(q.d) < track.KERB + .4, busy: !!B.crash, hint: B.hint });
    if (ev === 'shout') hud.rant(granny.mouth, 'NIE PO SIONYM!', true);
    if (ev === 'caught') { const n = B.points; B.points = 0; hud.rant(granny.mouth, 'MAM CIE!', true);
      crash(0, new THREE.Vector3(B.x - granny.group.position.x, 0, B.z - granny.group.position.z).setLength(2.5), n || '0'); } }
  rush += ((inp.sprint && inp.pedal > .1 && B.v > 3 && !B.crash ? 1 : 0) - rush) * Math.min(1, dt * (inp.sprint ? 3 : 5)); px.uniforms.aber.value = Math.max(rush, Math.max(0, B.v - 6.5) * .12) * FXK.blur;
  const q = track.probe(B.x, B.z, B.hint), f = track.S[q.i].f;
  traffic.update(dt, { pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsAt(level()), bus: modes.flags.bus, s: q.s, d: q.d, v: B.v, along: Math.sign(Math.sin(B.yaw) * f.x + Math.cos(B.yaw) * f.z) || 1 });
  stepHot(); stepPassed(); stepPapers(dt); stepBundles(dt, B.x, B.z); foot.update(dt, {}, world); follow(dt);
}
// ---------- on foot: speaking to people (E), hitting them (a punch when not fighting), cars that knock him down ----------
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
    else hud.rant(me.mouth, pickOf(['HALO?', 'NIKOGO...', 'HEJ!']), true); }
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
  water.update(dt); stepFires(dt); stepTaunts(); residents.update(dt, { x: me.x, z: me.z, v, foot: true, line: quests.lineFor });
  peds.update(dt, { x: me.x, z: me.z, v, d: q.d, busy: true });
  traffic.update(dt, { pace: 1 + .35 * difficulty(), cars: modes.flags.cars ?? carsAt(level()), bus: modes.flags.bus, s: q.s, d: q.d, v, along: Math.sign(Math.sin(me.yaw) * f.x + Math.cos(me.yaw) * f.z) || 1 });
  stepPapers(dt); stepBundles(dt, me.x, me.z); px.uniforms.aber.value = rush = 0;
  stepPeople(dt, inp, me); stepCarsVsWalker(me);
  for (const C of track.bundles) if (!C.used && Math.hypot(C.x - me.x, C.z - me.z) < 1) pickBundle(C);   // (walked up to: picked up)
  if (!foot.fighting && foot.nearBike(B) && !B.hintShown) { B.hintShown = true; flash(touch.on ? 'ROWER: wsiądź' : keysOf('mount') + ': wsiądź na rower'); } if (!foot.nearBike(B)) B.hintShown = false;
  foot.follow(dt); sun.position.set(me.x, me.y, me.z).addScaledVector(SUN, 60); sun.target.position.set(me.x, me.y, me.z); sun.target.updateMatrixWorld();
}
// on foot: where the bike is (an arrow at the top, turned the way it is from where you look; its distance; a mark over it when seen)
function bikeMark() { if (!foot.active || foot.fighting) return null; const me = foot.me, dist = Math.hypot(me.x - B.x, me.z - B.z); if (dist < 2.2) return null;
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
  hud.draw(dt, project, { bagX: menu.page !== 'title' ? hudBag.left : null, bagY: hudBag.top, marks: quests.marks().concat(subMarks(), mpMarks()), mix: menu.page !== 'title' ? { order: ACT().map(t => ({ n: B.mix[t], col: TITLES[t].col, on: t === TK[B.sel] })), name: TITLES[TK[B.sel]].short } : null, quests: quests.tracker(), projEdge: projectEdge, hp: menu.page !== 'title' ? (B.hp ?? 100) : null, fame: B.fame || 0, siren: quests.siren, power: B.charge ? B.charge.p : -1, head, tired: B.tired, spent: B.spent, rattled: Math.max(0, ((B.rattled || 0) - 2.2) / 4.3), barks: barkers.filter(n => n.dog.bark > 0).map(n => new THREE.Vector3(n.dog.x, B.y + .95, n.dog.z)), papers: B.papers, points: B.points, fight: fs && fs.fight, low: fs ? fs.low : 0, star: fs && fs.star, cross: foot.active && mouse.locked && foot.view === 'first' && !(fs && fs.star), bike: bikeMark() });
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
const menu = createMenu({ modes: () => [{ label: 'KLASYCZNA TRASA', act: () => { if (modes.id) modes.stop(); if (mp.on) mp.stop(); } }, ...Object.entries(MODES).map(([id, m]) => ({ label: m.name, info: m.info, act: () => { if (mp.on) mp.stop(); modes.start(id); } })), { label: 'GRA PRZEZ SIEĆ (2 GRACZY)', info: 'WYŚCIG, RAZEM, BEREK, WSPÓLNA JAZDA', act: () => { if (modes.id) modes.stop(); mp.openLobby(); } }], sound: { get: k => audio.get(k), set: (k, v) => audio.set(k, v) }, hud, look, styles: MENU_STYLES, light: LIGHT, presets: PRESETS, onRestart: () => askReset(true), onFull: toggleFull, onKeys: () => toggleKeys(), controls, lab: LAB, onPlay: () => { C.init = false; },
  sens: { get: () => sens, set: v => { sens = v; try { localStorage.setItem('pt.sens', String(v)); } catch { } } } });
addEventListener('keydown', e => { if (e.target?.closest?.('textarea, input') && e.code !== 'Escape') return; if (e.repeat && !['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) return;
  if (book.isOpen && book.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (e.code === 'Tab' && !menu.open && !asking && !talk.isOpen && !shop.isOpen && !runUI.isOpen) { book.toggle(); keys.clear(); e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (runUI.isOpen && runUI.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
  if (modes.isOpen && modes.key(e)) { keys.clear(); e.stopImmediatePropagation(); e.preventDefault(); return; }
  if (mp.isOpen && mp.key(e)) { keys.clear(); e.stopImmediatePropagation(); e.preventDefault(); return; }
  if (shop.isOpen && shop.key(e)) { keys.clear(); e.stopImmediatePropagation(); return; }
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
  granny.reset(); quests.reset(); shop.reset(); rider.root.visible = true; B.rattled = 0;
  rider.ragdollOff();
  const q = track.probe(track.start.x, track.start.z, 0); C.iy = Math.PI; C.iyGo = false;
  Object.assign(B, { x: track.start.x, z: track.start.z, y: q.y, vy: 0, air: false, gPrev: q.y, gVel: 0, yaw: track.start.yaw, v: 0, steer: 0, lean: 0, leanV: 0, hint: 0, pitch: 0, jolt: 0,
    stam: 1, spent: false, tired: 0, papers: 30, points: 0, lastPts: 0, earned: 0, delivered: 0, windows: 0, hp: 100, fame: 0, items: [], lastD: 0, crash: null, kick: null, dogSlow: 0, look: null, charge: null, lvl: 0, streak: 0 }); drawStreak();
  for (const p of papers) scene.remove(p.m, p.dot); papers.length = 0; for (const s of shards) scene.remove(s.m); shards.length = 0; for (const m of cracks) scene.remove(m); cracks.length = 0;
  for (const w of track.windows) w.broken = false; for (const d of track.doors) d.done = false;
  for (const mb of track.mailboxes) { mb.done = false; mb.flag.rotation.x = 0; }
  for (const b of track.bundles) { b.used = false; b.o.visible = true; }
  for (const d of dogs.dogs) { Object.assign(d, { x: d.home.x, z: d.home.z, v: 0, state: 'home', cool: 4, bark: 0, hint: -1, fly: null }); }
  trip.dist = trip.max = trip.time = 0; endT = 0; B.nt = 1; B.mix = { trabka: B.papers, wiesci: 0, sport: 0 }; B.sel = 0; assignSubs(); C.init = false; flash('Od nowa!');
}
// the modes (modes.js): the sprint against the clock, the obstacle course; they thin the traffic (modes.flags) and pause on their end page
const modes = createModes({ THREE, scene, track, audio, game: { get B() { return B; }, restart: () => { resetGame(); C.iy = 0; }, flash: s => flash(s), pop: (at, t, c) => hud.pop(at, t, c),
  place: (x, z, yaw, i = 0) => { const q = track.probe(x, z, i); Object.assign(B, { x, z, yaw, hint: q.i, y: q.y, gPrev: q.y, v: 0, steer: 0, lean: 0, leanV: 0 }); C.yaw = yaw; C.init = false; C.iy = 0; } } });
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
const meId = () => net.role === 'guest' ? 2 : 1, otherId = () => 3 - meId(), Bof = k => k === meId() ? P1.B : P2.B;
const net = createNet({ onMsg: m => netMsg(m), onState: s => { if (s === 'on') flash('Połączono z drugim graczem!'); if (['lost', 'closed', 'failed', 'off'].includes(s) && mp.on) { mp.leaveRound(); flash('Połączenie zerwane: koniec rundy'); } } });
// the houses' subscribers as the host has them (the guest takes them at a round's start), so the same houses wait for both
const subsNow = () => track.doors.map(d => d.sub || null);
function applySubs(a) { if (!a) return; track.doors.forEach((d, i) => { d.sub = a[i] ?? null; }); assignSubs(false, true); }
function mpBegin(subs) { use(P1); resetGame(); C.iy = 0; if (subs) applySubs(subs);
  const i0 = (track.home.iJ + 12) % track.N, S0 = track.S[i0], yaw0 = Math.atan2(S0.f.x, S0.f.z), d = meId() === 1 ? .95 : 2.55;   // (just out of the home street, side by side in the lane)
  const x = S0.p.x + S0.r.x * d, z = S0.p.z + S0.r.z * d, q = track.probe(x, z, i0); Object.assign(B, { x, z, yaw: yaw0, hint: q.i, y: q.y, gPrev: q.y, v: 0, crash: null }); C.yaw = yaw0; C.init = false; MP.on = true; }
function mpEnd() { MP.on = false; use(P1); resetGame(); }
const mp = createMp({ net, api: { me: meId, B: Bof, begin: mpBegin, end: mpEnd, flash: s => flash(s), audio, subs: subsNow, applySubs,
  pop: (k, t, c) => { const b = Bof(k); hud.pop(new THREE.Vector3(b.x, (b.y || 0) + 2.4, b.z), t, c); } } });
// what comes from the other: where he is, a house served, a paper thrown, a window, a kick
function netMsg(m) {
  if (m.k === 'me') { MP.R = m; MP.rT = performance.now(); Object.assign(P2.B, { papers: m.papers, points: m.points, delivered: m.delivered, streak: m.streak, crash: m.crash ? (P2.B.crash || { t: 0 }) : null }); return; }
  if (m.k === 'done') { const d = track.doors[m.d]; if (d) d.done = true; const mb = track.mailboxes[m.mb]; if (mb) { mb.done = true; mb.flag.rotation.x = -Math.PI / 2; } return; }
  if (m.k === 'paper') { const T = TITLES[m.title] ? m.title : 'trabka', o = new THREE.Mesh(paperG, paperM); o.castShadow = true; o.add(new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .04, 10), bandOf[T])); o.position.set(m.x, m.y, m.z); scene.add(o);
    papers.push({ m: o, v: new THREE.Vector3(...m.v), dot: new THREE.Mesh(dotG, dotM), prev: o.position.clone(), spin: new THREE.Vector3(9, 0, 3), hint: P2.B.hint || 0, t: 0, rest: false, landed: false, title: T, ghost: true }); scene.add(papers[papers.length - 1].dot); return; }
  if (m.k === 'win') { const w = track.windows[m.i]; if (w && !w.broken) breakWindow(w, true); return; }
  if (m.k === 'kick') { if (B.crash || foot.active) return; const dir = new THREE.Vector3(m.dx, 0, m.dz); hud.impact(rider.root.position.clone().setY(rider.root.position.y + 1), m.how === 'tag' ? 'BEREK!' : 'ŁUP!'); shake = .3; audio.play('kick', { vol: .8 });
    if (m.how === 'crash' && !B.air) crash(0, dir.setLength(3)); else { B.v *= .8; B.jolt = .16; B.x += m.dx * .35; B.z += m.dz * .35; } flash('Kopniak od gracza ' + otherId() + '!'); return; }
  mp.onMsg(m); }
// a house served here: told to the other
function served(door, mb) { if (!net.on) return; net.send({ k: 'done', d: door ? track.doors.indexOf(door) : -1, mb: mb ? track.mailboxes.indexOf(mb) : -1 }); }
// each frame: what I am sent (15 a second); the ghost moved, posed; a bump against him
function stepNet(dt, inp) { if (!net.on) { P2.rider.root.visible = false; return; }
  if ((MP.sendT -= dt) <= 0) { MP.sendT = 1 / 15; net.send({ k: 'me', x: +B.x.toFixed(2), y: +B.y.toFixed(2), z: +B.z.toFixed(2), yaw: +B.yaw.toFixed(3), v: +B.v.toFixed(2), lean: +B.lean.toFixed(3), steer: +B.steer.toFixed(3), pitch: +(B.pitch || 0).toFixed(3),
    air: !!B.air, crash: !!B.crash, ped: +(inp.pedal || 0).toFixed(2), kick: B.kick ? { side: B.kick.side, t: +B.kick.t.toFixed(2) } : null, papers: B.papers, points: B.points, delivered: B.delivered || 0, streak: B.streak || 0, foot: foot.active }); }
  const R = MP.R, age = (performance.now() - MP.rT) / 1000; P2.rider.root.visible = !!R && age < 4 && !R.foot; if (!R) return;
  const G = P2.B, k = Math.min(1, dt * 12), ex = Math.min(age, .25), tx = R.x + Math.sin(R.yaw) * R.v * ex, tz = R.z + Math.cos(R.yaw) * R.v * ex;   // (carried on by his speed, a quarter second at most)
  if (Math.hypot(tx - G.x, tz - G.z) > 6) { G.x = tx; G.z = tz; } else { G.x += (tx - G.x) * k; G.z += (tz - G.z) * k; }
  G.y += (R.y - G.y) * k; G.yaw += Math.atan2(Math.sin(R.yaw - G.yaw), Math.cos(R.yaw - G.yaw)) * k; G.v = R.v; G.lean += (R.lean - G.lean) * k; G.steer += (R.steer - G.steer) * k; G.pitch = R.pitch; G.air = R.air; G.kick = R.kick; G.hint = track.probe(G.x, G.z, G.hint || 0).i;
  const prev = use(P2); pose(dt, R.ped, 0, 0, R.crash ? 1 : 0); use(prev);
  // (bumped into him: pushed off, a little slower; he gets the same at his end)
  const dx = B.x - G.x, dz = B.z - G.z, d = Math.hypot(dx, dz); if (P2.rider.root.visible && d < .8 && d > 1e-3 && !B.crash && !foot.active) { B.x += dx / d * (.8 - d); B.z += dz / d * (.8 - d); const now = performance.now(); if (!(B.bumpT > now)) { B.bumpT = now + 450; B.v *= .9; B.jolt = .08; audio.play('kick', { vol: .3 }); } } }
// the marks: the other player (and who is "it"), at the picture's edge with how far when he is out of sight
function mpMarks() { if (!net.on || !P2.rider.root.visible) return []; const G = P2.B, o = otherId(), it = mp.it === o, dist = Math.round(Math.hypot(G.x - B.x, G.z - B.z));
  const col = it ? '#cf5a3e' : o === 1 ? '#efc970' : '#8fc3f0', lab = (it ? 'BEREK ' : '') + 'G' + o;
  return [{ p: new THREE.Vector3(G.x, (G.y || 0) + 2.5, G.z), s: 'v', col, label: dist > 12 ? lab + ' ' + dist + ' M' : lab, edge: true, edgeLabel: lab + ' ' + dist + ' M' }]; }
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
  if (x(BTN.MENU)) key('Escape'); if (x(BTN.VIEW)) key('Tab');
}
function frame(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;   // (the first frame can be stamped before the start)
  pad.poll(); padUI(dt);
  if (!rider.person && foot.riderPerson) rider.setPerson(foot.riderPerson);   // (the boy who walks, put on the bike once he is loaded)
  if ((menu.open || asking || shop.isOpen || book.isOpen || (talk.isOpen && !talk.isLight)) && document.pointerLockElement) { mouse.hadLock = false; document.exitPointerLock(); }   // (the menu wants the pointer)
  document.body.classList.toggle('walk', !menu.open && !asking && !shop.isOpen && !book.isOpen && !(talk.isOpen && !talk.isLight));                          // (in the game: no cursor; the menu and the question have one)
  if (!asking && !menu.open && !shop.isOpen && !runUI.isOpen && !modes.isOpen && !mp.isOpen && !book.isOpen && !window.PT?.hold) { step(dt, talk.isOpen && !talk.isLight ? still(input()) : input()); stepArena(dt); const me = foot.active ? { x: foot.me.x, z: foot.me.z, v: Math.abs(foot.me.vf || 0), foot: true } : { x: B.x, z: B.z, v: Math.abs(B.v), foot: false }; stuff.update(dt, me); stepPuddles(me); } else { input(); if (menu.page === 'title') attract(dt); }   // (asked, or in the menu: the game waits; PT.hold: held from the console)
  if ((hudT -= dt) <= 0) { hudT = .1; paintHud(); } if (noteT > 0 && (noteT -= dt) <= 0) note.classList.remove('on');
  { const k = Math.min(1, B.papers / 20); rider.bagFill?.(k); foot.bagFill?.(k); }
  { const me = foot.active ? foot.me : null, eyes = me ? foot.view === 'first' : CAMS[camI].fpv; FADE.cam.value.copy(camera.position); if (me) FADE.tgt.value.set(me.x, me.y + 1.2, me.z); else FADE.tgt.value.copy(rider.root.position).setY(rider.root.position.y + 1.1); FADE.r.value = eyes || menu.page === 'title' ? 0 : 1.9; px.snap.tgt.copy(FADE.tgt.value); }   // (the thinning of what hides him)   // (the bag shows how many papers are left)
  drift(dt); life.update(Math.min(dt, .05), camera.position); camera.updateMatrixWorld(); RIM.sun.value.copy(SUN).transformDirection(camera.matrixWorldInverse); RIM.up.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);   // (the sun, as the eye sees it)
  px.uniforms.wobT.value = (Math.floor(performance.now() / 125) * 1.37) % 97;   // (the line boiling: a new drawing eight times a second)
  { const q0 = track.probe(B.x, B.z, B.hint); audio.ride(foot.active || menu.open ? 0 : Math.abs(B.v), Math.abs(q0.d) > track.PAVE ? 1 : 0); }
  { const pc = quests.policeCars()[0]; audio.siren(quests.siren && !menu.open, where(pc && pc.g.position)); }
  audio.music(menu.page === 'title' || runUI.isOpen ? 'tytul' : quests.siren || quests.gangTargets.length ? 'poscig' : 'poranek');
  talkCam(dt); if (B.papers > (B.bagMax || 30)) { B.papers = B.bagMax || 30; if (!(B.fullT > 0)) { flash('Torba pełna'); B.fullT = 4; } } B.fullT = (B.fullT || 0) - dt;   // (no more than the bag holds)
  hudBag.update(dt, B.papers, B.bagMax || 30, px.size[0] / Math.max(1, px.size[1]), menu.page !== 'title', touch.on); px.render(scene, camera, hudBag); drawHud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.PT = { THREE, unlockTitle, stuff, scene, camera, hudBag, quests, talk, shop, book, audio, hurt, endRun, runUI, deliver, TITLES, rider, track, B, px, renderer, traffic, dogs, hud, granny, foot, dismount, mount, peds, residents, aim, breakWindow, setCam, crash, setInk, dropLoot, drops, paperHits,   // (for looking in from the console; tick: the game run on by hand, n frames of 1/60 s)
  tick(n, inp = {}) { for (let i = 0; i < n; i++) step(1 / 60, { steer: 0, pedal: 0, brake: 0, sprint: false, holdL: false, holdR: false, ...inp, hop: i === 0 && !!inp.hop, kick: i === 0 && !!inp.kick }); px.render(scene, camera); drawHud(1 / 60); }, resetGame, hot, papers, modes, mp, use, get P1() { return P1; }, get P2() { return P2; }, get MPon() { return MP.on; }, net };
