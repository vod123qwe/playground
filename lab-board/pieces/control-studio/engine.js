// Control Studio engine: a round control described as a stack of layers (outside in), turned in 3D (three.js) and lit like a product shot.
//
//   import { createDial } from './engine.js';
//   const dial = createDial(hostElement, design, { interactive: true, orbit: false });
//
// A design: { control: { min, max, step, value, sweep, unit }, reading: { show, style }, light: { key, ambient, exposure }, page,
//   layers: [ { name, kind: 'solid' | 'slot', r, h, rotates, face: { bulge, spread }, edge: { round, reach, join, polish },
//               material: { type, color, grain }, details: { knurl, ticks, tickR, tickLen, tickW, major, tickStyle, mark, markR, markLen, markW, markStyle },
//               slot: { colors: [start, mid, tip], mid, glow, haze, hazeSize, energy, speed } }, … ] }
// Layer 0 is the panel round it all. Every other layer starts at its r (its outer edge) and runs in to the next layer's r (or the
// centre); h is the height of its face. Its edge is the step at its r: round (0 a sharp chamfer, 1 a full curve), reach (how far
// the rounding runs, px), join: 'blend' (the foot rounds into the lower face too: one surface), 'crease' (a sharp foot: a separate
// piece standing on it), 'seam' (a fine groove: two parts); polish: the top of the edge cut and polished (a diamond-cut chamfer).
// What makes it read as real: ambient occlusion worked out from the cross-section (crevices, feet and grooves darken softly), a studio
// of softboxes reflected in every surface, the slot's light falling on the walls as one continuous strip (no lamp beads), indices that
// are pressed in, applied or printed, glass with an inside.
import * as THREE from 'three';

export const MATERIALS = {
  plastic: { label: 'Plastic', p: { roughness: .55, metalness: 0, clearcoat: .22, clearcoatRoughness: .45, sheen: .12, sheenRoughness: .7 } },
  ceramic: { label: 'Ceramic', p: { roughness: .3, metalness: 0, clearcoat: .9, clearcoatRoughness: .06 } },
  anodized: { label: 'Anodized', p: { roughness: .36, metalness: 1 } },
  steel: { label: 'Steel', p: { roughness: .1, metalness: 1 } },
  rubber: { label: 'Rubber', p: { roughness: .92, metalness: 0, sheen: .35, sheenRoughness: .8 } },
  glass: { label: 'Glass', p: { roughness: .04, metalness: 0, transmission: 1, thickness: 14, ior: 1.5, clearcoat: 0, iridescence: .15, iridescenceIOR: 1.7, iridescenceThicknessRange: [200, 460] } } };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = d => d * Math.PI / 180, lerp = (a, b, t) => a + (b - a) * t;
const isDark = hex => new THREE.Color(hex).getHSL({}).l < .35;

// ---------- a design, filled out with defaults (old saves too: dots became ticks, aluminium became anodized) ----------
const fixType = t => t === 'aluminium' ? 'anodized' : t;
// (a colour a touch lighter or darker: how a layer sets itself apart while it keeps the finish)
export const toned = (hex, t) => { if (!t) return hex; const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, clamp(h.l + t, 0, 1)); return '#' + c.getHexString(); };
export function lookOf(D, l) { const m = l.material; return m.own ? { type: m.type, color: m.color, grain: m.grain } : { type: D.finish.type, color: toned(D.finish.color, l.tone), grain: D.finish.grain }; }
export function normalise(d) {
  const src = d.layers || [], legacy = !d.finish, first = { type: 'plastic', color: '#dfddd8', grain: 1, ...(src[0]?.material || {}) };
  const finish = { ...first, ...(d.finish || {}) }; finish.type = fixType(finish.type); delete finish.own;
  const same = m => fixType(m.type) === finish.type && String(m.color).toLowerCase() === String(finish.color).toLowerCase() && +m.grain === +finish.grain;
  const glow = Object.assign(d.glow || {}, { colors: ['#c0ff13', '#ffeb13', '#ff8a12'], mid: .35, glow: 1, haze: .9, hazeSize: 1, energy: .6, speed: 1, ...(d.glow || src.find(l => l.kind === 'slot')?.slot || {}) });
  const L = src.map((l, i) => { const det = { ...(l.details || {}) }; if (det.dots != null && det.ticks == null) { det.ticks = det.dots; det.tickR = det.dotsR; } delete det.dots; delete det.dotsR;
    const mat = { type: 'plastic', color: '#dfddd8', grain: 1, ...(l.material || {}) }; mat.type = fixType(mat.type); mat.own = legacy ? !same(mat) : !!mat.own;
    const path = Array.isArray(l.path) && l.path.length >= 2 && i > 0 ? l.path.map(p => ({ r: +p.r, z: +p.z, hi: p.hi ? [+p.hi[0], +p.hi[1]] : null, ho: p.ho ? [+p.ho[0], +p.ho[1]] : null, t: p.t || 'smooth' })) : null;
    return { path, name: l.name || (i ? 'Layer ' + i : 'Panel'), kind: l.kind === 'slot' ? 'slot' : 'solid', r: +l.r || 200, h: +l.h || 0, rotates: !!l.rotates, tone: +l.tone || 0,
      face: { bulge: 0, spread: 2.5, ...(l.face || {}) }, edge: { round: .5, reach: 4, join: 'blend', polish: false, ...(l.edge || {}) }, material: mat,
      details: { knurl: false, ticks: 0, tickR: .85, tickLen: 9, tickW: 3, major: 0, tickStyle: 'engraved', mark: false, markR: .84, markLen: 30, markW: 7, markStyle: 'light', ...det }, slot: glow }; });
  if (!L.length) L.push(normalise({ layers: [{}] }).layers[0]);
  // (the rings always run from the outside in: sorted by radius, never closer than 2 px)
  const inner = L.slice(1).sort((a, b) => b.r - a.r); for (let i = 0; i < inner.length; i++) inner[i].r = clamp(inner[i].r, 4 + (inner.length - 1 - i) * 2, i ? inner[i - 1].r - 2 : 1200); L.splice(1, L.length, ...inner);
  const D = { control: { min: 8, max: 28, step: .5, value: 21, sweep: 270, unit: 'c', ...(d.control || {}) }, reading: { show: true, style: 'printed', ...(d.reading || {}) },
    // light: key (strength), ambient (the room), exposure, az (where it comes from, degrees clockwise from the top), el (how high), soft (shadows), hl (highlights: crisp 0 … soft 1)
    light: { key: 1.25, ambient: .5, exposure: .8, az: 31, el: 54, soft: .35, hl: .2, ...(d.light || {}) }, page: d.page || '#d9d8d4', finish, glow, layers: L };
  for (const l of L) l.look = lookOf(D, l);
  return D; }

// ---------- the profile: walked from the panel in to the centre; every point owned by its layer, flagged if polished ----------
function corner(C, dIn, dOut, rIn, rOut, round, n = 18) { const A = [C[0] - dIn[0] * rIn, C[1] - dIn[1] * rIn], B = [C[0] + dOut[0] * rOut, C[1] + dOut[1] * rOut], out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t, lx = A[0] + (B[0] - A[0]) * t, ly = A[1] + (B[1] - A[1]) * t, bx = u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], by = u * u * A[1] + 2 * u * t * C[1] + t * t * B[1];
    out.push([lx + (bx - lx) * round, ly + (by - ly) * round]); } return out; }
export const PANEL_R = 1400;
export function profile(D) { const L = D.layers, n = L.length - 1, steps = [];
  for (let i = 1; i <= n; i++) { const A = L[i - 1], B = L[i], rk = B.r, hA = A.h, hB = B.h, dh = Math.abs(hA - hB), e = B.edge, up = hB > hA;
    const wA = (i === 1 ? PANEL_R : A.r) - rk, wB = rk - (i < n ? L[i + 1].r : 0), blend = e.join === 'blend';
    const reachH = Math.min(e.reach, (up ? wB : wA) * .45), footH = blend ? Math.min(e.reach, (up ? wA : wB) * .45) : 0;
    const vTop = dh < .01 ? 0 : Math.min(e.reach, dh * (blend ? .5 : .96)), vFoot = blend && dh >= .01 ? Math.min(e.reach, dh - vTop) : 0, seam = e.join === 'seam', sp = seam ? 1.4 : 0;
    const flat = dh < .01, padOut = flat ? (seam ? .7 : 0) : up ? footH + sp : reachH, padIn = flat ? (seam ? .7 : 0) : up ? reachH : footH + sp;
    steps.push({ i, rk, hA, hB, up, dh, e, reachH, footH, vTop, vFoot, seam, padOut, padIn }); }
  const pts = [], pathPts = []; const add = (r, z, o, c = 0) => pts.push({ r, z, o, c });
  // (where layer k's face ends on the inside: at the next layer's path start, or where the next step's rounding takes over)
  const endOf = k => k >= n ? 0 : L[k + 1].path ? L[k + 1].path[0].r : L[k + 1].r + steps[k].padOut;
  const wall = (r, z0, z1, o) => { const m = Math.min(24, Math.floor(Math.abs(z1 - z0) / 1.5)); for (let j = 1; j < m; j++) add(r, lerp(z0, z1, j / m), o); };
  const faceZ = (l, k, r) => { if (pathPts[k]) return pathZ(pathPts[k], r, l.h); const rOut = k === 0 ? PANEL_R : l.r, rIn = k < n ? L[k + 1].r : 0, b = l.face.bulge; if (!b || k === 0) return l.h;
    if (rIn === 0) return l.h + b * (1 - Math.pow(clamp(r / rOut, 0, 1), l.face.spread));
    const u = clamp((r - rIn) / (rOut - rIn), 0, 1); return l.h + b * Math.pow(Math.sin(Math.PI * u), 1 / Math.max(.2, l.face.spread / 2.5)); };
  for (let k = 0; k <= n; k++) { const l = L[k], sOut = k > 0 ? steps[k - 1] : null, sIn = k < n ? steps[k] : null;
    const rOut = k === 0 ? PANEL_R : l.r, rIn = k < n ? L[k + 1].r : 0;
    // (the face, in pieces finer near the centre of the view)
    const a = rOut - (sOut ? sOut.padIn : 0), b = endOf(k);
    if (k > 0 && l.path) { const pp = samplePath(l.path, L[k - 1].h, b, l.h); pathPts[k] = pp; for (const p of pp) add(p[0], p[1], k); }
    else if (k === 0) { const far = Math.max(b + 60, (L[1]?.r || 300) * 2.2); add(far, l.h, 0); for (let j = 1; j <= 40; j++) add(lerp(far, b, j / 40), l.h, 0); }
    else { const N = Math.max(2, Math.ceil((a - b) / 3)); for (let j = 0; j <= N; j++) { const r = lerp(a, b, j / N); add(r, faceZ(l, k, r), k); } }
    if (!sIn) break;
    if (L[k + 1].path) continue;
    const s = sIn, owner = s.up ? k + 1 : k, e = s.e, pc = e.polish ? 1 : 0;
    if (s.dh < .01) { if (s.seam) { add(s.rk + .7, s.hA, k); add(s.rk, s.hA - 1.1, owner); add(s.rk - .7, s.hA, k + 1); } continue; }
    if (s.up) { // the foot (concave) in the outer, lower face; the wall up; the top (convex) into the raised face
      if (s.seam) { add(s.rk + 1.4, s.hA, k); add(s.rk + .7, s.hA - 1.2, owner); add(s.rk, s.hA, owner); }
      for (const p of corner([s.rk, s.hA], [-1, 0], [0, 1], s.footH, s.vFoot, e.round)) add(p[0], p[1], owner);
      wall(s.rk, s.hA + s.vFoot, s.hB - s.vTop, owner);
      for (const p of corner([s.rk, s.hB], [0, 1], [-1, 0], s.vTop, s.reachH, e.round)) add(p[0], p[1], owner, pc);
    } else { // the top (convex) at the rim of the outer, higher face; the wall down; the foot (concave) into the lower face
      for (const p of corner([s.rk, s.hA], [-1, 0], [0, -1], s.reachH, s.vTop, e.round)) add(p[0], p[1], owner, pc);
      wall(s.rk, s.hA - s.vTop, s.hB + s.vFoot, owner);
      for (const p of corner([s.rk, s.hB], [0, -1], [-1, 0], s.vFoot, s.footH, e.round)) add(p[0], p[1], owner);
      if (s.seam) { add(s.rk - .7, s.hB - 1.2, owner); add(s.rk - 1.4, s.hB, k + 1); } } }
  occlusion(pts);
  // (split by owner: each layer's run of points, joined to the run before it by its first point)
  const runs = L.map(() => []); let prev = null;
  for (const p of pts) { if (prev && prev.o !== p.o) runs[p.o].push([prev.r, prev.z, prev.ao, p.c]); runs[p.o].push([p.r, p.z, p.ao, p.c]); prev = p; }
  return { runs, steps, faceZ: (k, r) => faceZ(L[k], k, r), pts }; }

// ---------- free paths: nodes with bezier handles, like a vector in Figma ----------
// (the first node sits on the outer layer's face (its height is that face's), the last ends where the next layer begins, at h)
export function pathNodes(nodes, z0, rEnd, zEnd) { const N = nodes.map(p => ({ ...p })); N[0].z = z0; const L = N[N.length - 1]; L.r = rEnd; L.z = zEnd; return N; }
export function samplePath(nodes, z0, rEnd, zEnd) { const N = pathNodes(nodes, z0, rEnd, zEnd), out = [[N[0].r, N[0].z]];
  for (let i = 0; i < N.length - 1; i++) { const A = N[i], B = N[i + 1], p1 = [A.r + (A.ho?.[0] || 0), A.z + (A.ho?.[1] || 0)], p2 = [B.r + (B.hi?.[0] || 0), B.z + (B.hi?.[1] || 0)];
    const len = Math.hypot(B.r - A.r, B.z - A.z) + Math.hypot(A.ho?.[0] || 0, A.ho?.[1] || 0) + Math.hypot(B.hi?.[0] || 0, B.hi?.[1] || 0), m = clamp(Math.ceil(len / 2), 4, 60), straight = !A.ho && !B.hi;
    for (let j = 1; j <= (straight ? 1 : m); j++) { const t = j / (straight ? 1 : m), u = 1 - t; out.push([u * u * u * A.r + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * B.r, u * u * u * A.z + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * B.z]); } }
  return out; }
function pathZ(pp, r, def) { let best = -1e9; for (let i = 0; i < pp.length - 1; i++) { const [r0, z0] = pp[i], [r1, z1] = pp[i + 1]; if ((r - r0) * (r - r1) > 0) continue; const t = Math.abs(r1 - r0) < 1e-6 ? 0 : (r - r0) / (r1 - r0); best = Math.max(best, lerp(z0, z1, t)); } return best > -1e8 ? best : def; }
// (a layer's current shape (its outer step and its face) turned into a path to edit by hand)
export function toPath(D, k) { const pr = profile(D), L = D.layers, s = pr.steps[k - 1], l = L[k], nodes = [], e = s.e;
  const N = (r, z, hi = null, ho = null, t = 'sharp') => { const q = nodes[nodes.length - 1]; if (q && Math.hypot(q.r - r, q.z - z) < .05) { if (ho) q.ho = ho; if (hi && !q.hi) q.hi = hi; if (q.hi && q.ho) q.t = 'free'; return; } nodes.push({ r, z, hi, ho, t }); };
  // (a quadratic corner A–C–B of strength round, as two nodes with handles)
  const crn = (A, C, B) => { const k2 = 2 / 3 * e.round; N(A[0], A[1], null, [(C[0] - A[0]) * k2, (C[1] - A[1]) * k2]); N(B[0], B[1], [(C[0] - B[0]) * k2, (C[1] - B[1]) * k2], null); };
  if (s.dh < .01) N(s.rk, s.hA);
  else if (s.up) { crn([s.rk + s.footH, s.hA], [s.rk, s.hA], [s.rk, s.hA + s.vFoot]); crn([s.rk, s.hB - s.vTop], [s.rk, s.hB], [s.rk - s.reachH, s.hB]); }
  else { crn([s.rk + s.reachH, s.hA], [s.rk, s.hA], [s.rk, s.hA - s.vTop]); crn([s.rk, s.hB + s.vFoot], [s.rk, s.hB], [s.rk - s.footH, s.hB]); }
  const last = nodes[nodes.length - 1], end = k < L.length - 1 ? (L[k + 1].path ? L[k + 1].path[0].r : L[k + 1].r + pr.steps[k].padOut) : 0;
  if (l.face.bulge) { const m = 4, f = []; for (let j = 1; j <= m; j++) { const r = lerp(last.r, end, j / m); f.push({ r, z: pr.faceZ(k, r), hi: null, ho: null, t: 'smooth' }); } nodes.push(...f); smooth(nodes, nodes.length - m); }
  else nodes.push({ r: end, z: l.h, hi: null, ho: null, t: 'sharp' });
  return nodes; }
// (smooth handles from the neighbours, Catmull-Rom style, for nodes from i on)
export function smooth(nodes, from = 0, to = nodes.length - 1) { for (let i = Math.max(0, from); i <= to; i++) { const p = nodes[i], a = nodes[Math.max(0, i - 1)], b = nodes[Math.min(nodes.length - 1, i + 1)];
  const tx = (b.r - a.r) / 6, tz = (b.z - a.z) / 6; if (i > 0) p.hi = [-tx, -tz]; if (i < nodes.length - 1) p.ho = [tx, tz]; p.t = 'smooth'; } }

// ---------- ambient occlusion from the section: how much of the sky each point sees past the profile round it ----------
function occlusion(pts) { const n = pts.length, R = 46;
  for (let i = 0; i < n; i++) { const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let tx = b.r - a.r, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const nx = tz, nz = -tx; let hf = 0, hb = 0;
    for (let j = 0; j < n; j++) { const q = pts[j], dr = q.r - p.r, dz = q.z - p.z; if (dr > R || dr < -R || dz > R || dz < -R) continue; const d = Math.hypot(dr, dz); if (d < .6 || d > R) continue;
      const up = dr * nx + dz * nz; if (up <= 0) continue; const s = up / d * (1 - (d / R) * (d / R)); if (dr * tx + dz * tz > 0) { if (s > hf) hf = s; } else if (s > hb) hb = s; }
    p.ao = clamp(1 - .8 * (hf + hb) / 2, .25, 1); } }

// ---------- shaders shared by every surface: grain, occlusion, the slot's light ----------
const HEAD = `varying vec3 vGP, vWP; varying float vAO; uniform float uGrain, uGrainS, uGrainC;
uniform float uMinRough, uArcOn, uArcR, uArcZ, uArcStart, uArcTip, uArcGain, uArcTime, uArcEnergy, uArcMid, uArcFall; uniform vec3 uArcA, uArcB, uArcC;
float gh(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float gn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(gh(i), gh(i + vec3(1, 0, 0)), f.x), mix(gh(i + vec3(0, 1, 0)), gh(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(gh(i + vec3(0, 0, 1)), gh(i + vec3(1, 0, 1)), f.x), mix(gh(i + vec3(0, 1, 1)), gh(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
// (the slot's light as one continuous strip: each point is lit from the nearest point of the lit arc, diffuse and a glossy glint)
vec3 arcLight(vec3 P, vec3 N, vec3 V, float rough, vec3 dc, vec3 sc) {
  float a = atan(P.x, P.y), span = max(uArcTip - uArcStart, .001), ac = clamp(a, uArcStart, uArcTip), t = (ac - uArcStart) / span;
  vec3 Q = vec3(uArcR * sin(ac), uArcR * cos(ac), uArcZ), d = Q - P; float dist = length(d); vec3 L = d / max(dist, .001);
  float lit = mix(.28, 1., smoothstep(0., 1., t)) * smoothstep(-.03, .5, ac - uArcStart) * exp(-abs(a - ac) * 4.);
  float pk = pow(.5 + .5 * sin((ac - uArcStart) * 2.6 - uArcTime), 12.); lit *= 1. + uArcEnergy * (pk * 1.2 - .2);
  float att = 1. / (1. + dist * dist / (uArcFall * uArcFall)), ndl = max(dot(N, L), 0.);
  vec3 H = normalize(L + V); float a2 = max(rough * rough, .004), spec = min(30., pow(max(dot(N, H), 0.), 2. / a2 - 2.) * (2. / a2 + 2.) / 8.);
  vec3 c = t < uArcMid ? mix(uArcA, uArcB, smoothstep(0., uArcMid, t)) : mix(uArcB, uArcC, (t - uArcMid) / max(1. - uArcMid, .001));
  return c * uArcGain * lit * att * ndl * (dc + sc * spec); }
`;
const AO_ARC = `
  reflectedLight.indirectDiffuse *= vAO; reflectedLight.indirectSpecular *= mix(1., vAO, .8); reflectedLight.directDiffuse *= mix(1., vAO, .45); reflectedLight.directSpecular *= mix(1., vAO, .35);
  if (uArcOn > .5) { vec3 wN = inverseTransformDirection(normal, viewMatrix), V = normalize(cameraPosition - vWP);
    vec3 dc = diffuseColor.rgb * (1. - metalnessFactor), sc = mix(vec3(.04), diffuseColor.rgb, metalnessFactor);
    reflectedLight.directDiffuse += arcLight(vWP, wN, V, roughnessFactor, dc, sc) * mix(1., vAO, .5); }`;
// (an index pressed into, printed on or standing proud of a face: a stadium, its shape worked out per pixel)
const DECAL_HEAD = `varying vec2 vSh; varying vec3 vTx, vTy; uniform float uDL, uDW, uDDepth, uDBevel; uniform vec3 uDColor;
float dSd(vec2 p){ vec2 q = abs(p) - vec2(max(uDL * .5 - uDW * .5, 0.), 0.); return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - uDW * .5; }
`;
const DECALS = {
  engraved: { color: `\n  if (dSd(vSh) > 0.) discard;`,
    normal: `\n  { float dd = dSd(vSh), e = .04, x = clamp(-dd / uDBevel, 0., 1.); vec2 g = vec2(dSd(vSh + vec2(e, 0.)) - dSd(vSh - vec2(e, 0.)), dSd(vSh + vec2(0., e)) - dSd(vSh - vec2(0., e))) / (2. * e);
    float slope = uDDepth / uDBevel * 6. * x * (1. - x); normal = normalize(normal - (g.x * vTx + g.y * vTy) * slope); }`,
    ao: `\n  { float fl = smoothstep(.35, 1., clamp(-dSd(vSh) / uDBevel, 0., 1.)); reflectedLight.indirectDiffuse *= mix(1., .5, fl); reflectedLight.indirectSpecular *= mix(1., .45, fl); reflectedLight.directDiffuse *= mix(1., .78, fl); }` },
  printed: { color: `\n  { float dd = dSd(vSh); diffuseColor.rgb = uDColor; diffuseColor.a *= 1. - smoothstep(-.18, .18, dd); }`, normal: '', ao: '' } };

// ---------- the studio round the dial: softboxes, reflected in every surface ----------
function studio(renderer, sigma = .015) { const s = new THREE.Scene();
  // (a dome: a bright soft ceiling fading to a dim floor, so flat metal seen from above reads silver, not grey)
  const dome = new THREE.SphereGeometry(20, 64, 32), dp = dome.attributes.position, col = []; for (let i = 0; i < dp.count; i++) { const t = (dp.getY(i) / 20 + 1) / 2, I = .1 + 1.35 * t * t; col.push(I, I, I * 1.02); }
  dome.rotateX(Math.PI / 2); dome.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); s.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, x, y, z, I) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(I, I, I), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  box(12, 7, -6, 8, 11, 6);       // the big softbox, high up to the upper left (off the zenith: flat faces seen from above stay calm)
  box(2.4, 20, 13, 3, 7, 4);      // a tall strip on the right: the long bright line on every chamfer
  box(2, 18, -13, -3, 6, 1.6);    // a weaker strip on the left
  box(20, 2.2, 0, -14, 5, 1.8);   // a low strip in front: the near rims light up
  const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(s, sigma).texture; pm.dispose(); return t; }

const hazeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(.4, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const ARC_VS = `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const ARC_FS = `varying vec2 vP; uniform float uTip, uSpan, uStart, uR, uW, uGain, uFeather, uHot, uFloor, uSoft, uTime, uEnergy, uMid; uniform vec3 uA, uB, uC;
  void main(){ float a = atan(vP.x, vP.y), ahead = a - uTip, fe = 1.;
    if (ahead > 0.) { fe = 1. - smoothstep(0., uFeather, ahead); if (fe <= 0.) discard; }
    float rel = max(0., uTip - a); if (rel > uSpan + .001) discard; fe *= 1. - smoothstep(0., uFeather, uStart - a);
    float t = 1. - rel / max(uSpan, .001); vec3 c = t < uMid ? mix(uA, uB, smoothstep(0., uMid, t)) : mix(uB, uC, (t - uMid) / (1. - uMid));
    float al = mix(uFloor, 1., smoothstep(0., 1., t)) * smoothstep(0., uSoft, a - uStart);
    float r = length(vP), d = (r - uR) / uW, f = exp(-d * d);
    float pk = pow(.5 + .5 * sin((a - uStart) * 2.6 - uTime), 12.), en = 1. + uEnergy * (pk * 1.5 - .22 + .07 * sin(uTime * .45));
    al *= mix(1., en, .55); c = mix(c, vec3(1.), uHot * pow(f, 5.) * al * (1. + uEnergy * pk * .8)); c *= en;
    gl_FragColor = vec4(c * uGain, al * f * fe); }`;

// ---------- geometry helpers ----------
function stadium(Lh, W) { const s = new THREE.Shape(), r = W / 2, hl = Math.max(0, Lh / 2 - r); s.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false); s.absarc(-hl, 0, r, Math.PI / 2, Math.PI * 1.5, false); s.closePath(); return s; }
// (copies of a small shape laid out round a face: each turned to point at the centre, baked into one mesh in the layer's own frame)
function bake(items) { const P = [], N = [], U = [], A = [], O = [], I = []; let off = 0;
  for (const it of items) { const g = it.g, p = g.attributes.position, nn = g.attributes.normal, [rx, ry] = it.rad, [tx, ty] = it.tan;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); P.push(it.c[0] + x * rx + y * tx, it.c[1] + x * ry + y * ty, it.z + z);
      const a = nn.getX(i), b = nn.getY(i); N.push(a * rx + b * tx, a * ry + b * ty, nn.getZ(i)); U.push(x, y); A.push(rx, ry, tx, ty); O.push(1); }
    if (g.index) for (let i = 0; i < g.index.count; i++) I.push(off + g.index.getX(i)); else for (let i = 0; i < p.count; i++) I.push(off + i); off += p.count; }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  o.setAttribute('aAx', new THREE.Float32BufferAttribute(A, 4)); o.setAttribute('aAO', new THREE.Float32BufferAttribute(O, 1)); o.setIndex(I); return o; }
const withAO = g => { if (!g.attributes.aAO) g.setAttribute('aAO', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(1), 1)); return g; };

// ---------- the dial ----------
export function createDial(host, design, opt = {}) {
  const O = { interactive: true, orbit: true, thumb: false, sound: true, ...opt };
  let D = normalise(design);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!O.thumb || !!O.capture });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const cv = renderer.domElement; cv.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none'; host.appendChild(cv);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(18, 1, 50, 20000);
  let envHl = -1;
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -.0003; key.shadow.normalBias = 1.2;
  const fill = new THREE.HemisphereLight(0xffffff, 0x9a9aa0, .3); scene.add(key, fill);
  const world = new THREE.Group(), turning = new THREE.Group(); scene.add(world); world.add(turning);
  const overlay = document.createElement('div'); overlay.className = 'cs-reading'; overlay.innerHTML = '<div class="cs-num" aria-hidden="true"></div><div class="cs-unit"></div>'; host.appendChild(overlay);
  let parts = [], R = 300;
  const state = { value: D.control.value, cur: D.control.value, vel: 0, time: 0, K: 1, orbit: { t: 0, p: 0, z: 1, tt: 0, tp: 0, tz: 1 }, tilt: { x: 0, y: 0, tx: 0, ty: 0 }, hover: -1, pick: -1 };
  const angleOf = v => -D.control.sweep / 2 + (v - D.control.min) / Math.max(1e-6, D.control.max - D.control.min) * D.control.sweep;

  // ---------- materials: physical, with grain, the section's occlusion and the slot's light patched in ----------
  const ARC = { uMinRough: { value: .02 }, uArcOn: { value: 0 }, uArcR: { value: 280 }, uArcZ: { value: -30 }, uArcStart: { value: 0 }, uArcTip: { value: 0 }, uArcGain: { value: 1 }, uArcTime: { value: 0 }, uArcEnergy: { value: 0 }, uArcMid: { value: .35 }, uArcFall: { value: 14 },
    uArcA: { value: new THREE.Color() }, uArcB: { value: new THREE.Color() }, uArcC: { value: new THREE.Color() } };
  function makeMat(params, color, grain, decal = null, side = THREE.DoubleSide) {
    const mat = new THREE.MeshPhysicalMaterial({ ...params, color: new THREE.Color(color), side }), metal = mat.metalness > .5 ? .16 : 1;
    const G = { uGrain: { value: .2 * grain * metal }, uGrainS: { value: metal < 1 ? .5 : .85 }, uGrainC: { value: .05 * grain } };
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, G, ARC, decal ? decal.u : {});
      sh.vertexShader = 'attribute float aAO; varying float vAO; varying vec3 vGP, vWP;\n' + (decal ? 'attribute vec4 aAx; varying vec2 vSh; varying vec3 vTx, vTy;\n' : '') + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGP = position; vAO = aAO;' + (decal ? ' vSh = uv; vTx = normalize(normalMatrix * vec3(aAx.xy, 0.)); vTy = normalize(normalMatrix * vec3(aAx.zw, 0.));' : ''))
        .replace('#include <project_vertex>', '#include <project_vertex>\n  vWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
      const dk = decal ? DECALS[decal.kind] : null;
      sh.fragmentShader = HEAD + (dk ? DECAL_HEAD : '') + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= 1. + (gn(vGP * uGrainS * .8 + 7.3) - .5) * uGrainC;' + (dk ? dk.color : ''))
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  { vec3 gp = vGP * uGrainS; normal = normalize(normal + vec3(gn(gp) - .5, gn(gp + 31.7) - .5, 0.) * uGrain); }' + (dk ? dk.normal : ''))
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = max(roughnessFactor, uMinRough);')
        .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + AO_ARC + (dk ? dk.ao : '')); };
    mat.customProgramCacheKey = () => 'cs-' + (decal ? decal.kind : 'body');
    return mat; }
  const matOf = (m, polish) => { const base = (MATERIALS[m.type] || MATERIALS.plastic).p; if (!polish) return makeMat(base, m.color, m.grain);
    // (a diamond-cut chamfer: the same stuff cut bright and polished)
    const metal = (base.metalness || 0) > .5, c = new THREE.Color(m.color); if (metal) c.lerp(new THREE.Color('#eceef1'), .45);
    return makeMat({ ...base, roughness: metal ? .06 : .12, clearcoat: metal ? 0 : 1, clearcoatRoughness: .02, transmission: 0, iridescence: 0 }, '#' + c.getHexString(), 0); };

  const HQ = { on: false, n: 0, N: 128, sig: '', ver: 0, a: null, b: null, f: null };
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), QV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const blendMat = new THREE.ShaderMaterial({ vertexShader: QV, fragmentShader: 'uniform sampler2D tPrev, tCur; uniform float uW; varying vec2 vUv; void main(){ gl_FragColor = mix(texture2D(tPrev, vUv), texture2D(tCur, vUv), uW); }',
    uniforms: { tPrev: { value: null }, tCur: { value: null }, uW: { value: 1 } }, depthTest: false, depthWrite: false, toneMapped: false });
  const showMat = new THREE.ShaderMaterial({ vertexShader: QV, fragmentShader: 'uniform sampler2D tAcc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tAcc, vUv);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    uniforms: { tAcc: { value: null } }, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blendMat), qScene = new THREE.Scene(); quad.frustumCulled = false; qScene.add(quad);
  const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
  function hqTargets() { const w = cv.width, h = cv.height; if (HQ.a && HQ.a.width === w && HQ.a.height === h) return; for (const t of [HQ.a, HQ.b, HQ.f]) t?.dispose();
    const o = { type: THREE.HalfFloatType, depthBuffer: false }; HQ.a = new THREE.WebGLRenderTarget(w, h, o); HQ.b = new THREE.WebGLRenderTarget(w, h, o); HQ.f = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }); HQ.n = 0; }
  const sigOf = () => camera.matrixWorld.elements.map(v => v.toFixed(2)).join() + '|' + turning.rotation.z.toFixed(5) + '|' + cv.width + 'x' + cv.height + '|' + HQ.ver + '|' + state.cur.toFixed(4);
  function hqFrame() { const sig = sigOf(); if (sig !== HQ.sig) { HQ.sig = sig; HQ.n = 0; } if (HQ.n >= HQ.N) return false; hqTargets(); paintSlots(0);
    const w = cv.width, h = cv.height, n = HQ.n, kp = key.position.clone(), pr = key.shadow.radius;
    if (n) { camera.setViewOffset(w, h, halton(n, 2) - .5, halton(n, 3) - .5, w, h);
      // (the light from a small disc instead of a point: its angle grows with Shadow softness)
      const a = halton(n, 5) * Math.PI * 2, r = Math.sqrt(halton(n, 7)) * kp.length() * Math.tan(rad(.6 + D.light.soft * 7)), u = new THREE.Vector3(0, 0, 1).cross(kp).normalize(), v = kp.clone().cross(u).normalize();
      key.position.addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r); key.shadow.radius = 1.2; }
    const pv = pickLine.visible, hv = hoverLine.visible; pickLine.visible = hoverLine.visible = false; renderer.setRenderTarget(HQ.f); renderer.render(scene, camera); pickLine.visible = pv; hoverLine.visible = hv; key.position.copy(kp); key.shadow.radius = pr; camera.clearViewOffset();
    quad.material = blendMat; blendMat.uniforms.tPrev.value = HQ.a.texture; blendMat.uniforms.tCur.value = HQ.f.texture; blendMat.uniforms.uW.value = 1 / (n + 1);
    renderer.setRenderTarget(HQ.b); renderer.render(qScene, quadCam); const t = HQ.a; HQ.a = HQ.b; HQ.b = t;
    quad.material = showMat; showMat.uniforms.tAcc.value = HQ.a.texture; renderer.setRenderTarget(null); renderer.render(qScene, quadCam); HQ.n++; return true; }

  // ---------- building ----------
  const slots = [];
  function clear() { for (const s of slots) for (const h of s.haze) { world.remove(h.s); h.s.material.dispose(); } slots.length = 0;
    for (const p of parts) { p.parent?.remove(p); p.traverse?.(o => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); }); } parts = []; }
  // (a turned mesh from a run of the profile: repeated points dropped, a sharp bend kept sharp by doubling its point, occlusion along)
  function lathe(run, seg) { const v = []; for (const p of run) { const q = v[v.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > .02) v.push(p); }
    const out = [v[0]]; for (let i = 1; i < v.length - 1; i++) { const ax = v[i][0] - v[i - 1][0], az = v[i][1] - v[i - 1][1], bx = v[i + 1][0] - v[i][0], bz = v[i + 1][1] - v[i][1];
      out.push(v[i]); if ((ax * bx + az * bz) / (Math.hypot(ax, az) * Math.hypot(bx, bz) || 1) < .86) out.push(v[i]); }
    if (v.length < 2) return null; out.push(v[v.length - 1]);
    const g = new THREE.LatheGeometry(out.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])), seg); g.rotateX(Math.PI / 2);
    const ao = new Float32Array(g.attributes.position.count); for (let i = 0; i < ao.length; i++) ao[i] = out[i % out.length][2] ?? 1; g.setAttribute('aAO', new THREE.BufferAttribute(ao, 1)); return g; }
  const put = (o, l) => { (l.rotates ? turning : world).add(o); parts.push(o); return o; };
  function build() { HQ.ver++; clear(); const pr = profile(D), L = D.layers; R = L.length > 1 ? L[1].r : 300;
    L.forEach((l, k) => { const run = pr.runs[k]; if (run.length < 2) return; const seg = l.rotates ? 720 : 540;
      // (split where the polish starts and stops: the chamfer is its own surface, its edges crisp)
      const pieces = []; let cur = [run[0]]; for (let i = 1; i < run.length; i++) { cur.push(run[i]); if (run[i][3] !== run[i - 1][3] && i < run.length - 1) { pieces.push({ c: run[i - 1][3], pts: cur }); cur = [run[i]]; } } pieces.push({ c: cur[cur.length - 1][3], pts: cur });
      for (const pc of pieces) { if (pc.pts.length < 2) continue; const g = lathe(pc.pts, seg); if (!g) continue;
        if (l.details.knurl && k > 0 && !pc.c && !l.path) { const s = pr.steps[k - 1]; if (s && s.up) { const zl = s.hA + s.vFoot + 1, zh = s.hB - s.vTop - .5, p = g.attributes.position;
            for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rr = Math.hypot(x, y); if (Math.abs(rr - l.r) > 1.2 || z < zl || z > zh) continue;
              const a = Math.atan2(y, x), band = Math.sin(Math.PI * (z - zl) / Math.max(.1, zh - zl)), d = (Math.abs(Math.sin(a * 120)) - .64) * .7 * band; p.setX(i, x * (rr + d) / rr); p.setY(i, y * (rr + d) / rr); } } }
        g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, matOf(l.look, !!pc.c)); mesh.castShadow = l.look.type !== 'glass'; mesh.receiveShadow = true; mesh.userData.layer = k; put(mesh, l); }
      if (k === 0) { const far = Math.max((L[1]?.r || 300) * 2.2, 200), sh = new THREE.Shape(); sh.moveTo(-9000, -9000); sh.lineTo(9000, -9000); sh.lineTo(9000, 9000); sh.lineTo(-9000, 9000); sh.lineTo(-9000, -9000);
        const hp = new THREE.Path(); hp.absarc(0, 0, far - .5, 0, Math.PI * 2, true); sh.holes.push(hp);
        const pm = new THREE.Mesh(withAO(new THREE.ShapeGeometry(sh, 128)), matOf(l.look)); pm.position.z = l.h; pm.receiveShadow = true; pm.userData.layer = 0; put(pm, l); }
      const rIn = k < L.length - 1 ? L[k + 1].r : 0, rOut = k ? l.r : PANEL_R, dt = l.details;
      // the indices round its face, and the mark
      if (k > 0 && dt.ticks > 0) indices(l, k, pr, rIn, rOut, false);
      if (k > 0 && dt.mark) indices(l, k, pr, rIn, rOut, true);
      // glass gets an inside: a dark barrel and a coated lens element far down in it
      if (l.look.type === 'glass' && rIn === 0) { const rr = l.r - .6, z0 = l.h - 1.5;
        const barrel = lathe([[rr, z0, 1], [rr * .97, z0 - 5, .8], [rr * .7, z0 - 22, .5], [rr * .46, z0 - 26, .4], [0, z0 - 27, .5]], 360);
        put(new THREE.Mesh(barrel, makeMat({ roughness: .55, metalness: .2 }, '#060608', .4)), l);
        const lens = []; for (let i = 0; i <= 16; i++) { const t = i / 16, rr2 = rr * .44 * (1 - t); lens.push([rr2, z0 - 26 + 6 * Math.sqrt(1 - Math.pow(1 - t, 2)), 1]); }
        put(new THREE.Mesh(lathe(lens, 360), makeMat({ roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, iridescence: .7, iridescenceIOR: 1.8, iridescenceThicknessRange: [260, 620] }, '#030305', 0)), l); }
      // a slot: the light on its floor
      if (l.kind === 'slot' && k > 0) { const rm = (l.r + rIn) / 2, w = Math.max(3, (l.r - rIn) * .53), z = pr.faceZ(k, rm) + .6;
        const mk = (r0, r1, zz, RR, W, blend) => { const m = new THREE.ShaderMaterial({ vertexShader: ARC_VS, fragmentShader: ARC_FS, transparent: true, depthWrite: false, blending: blend, toneMapped: false,
            uniforms: { uTip: { value: 0 }, uSpan: { value: 1 }, uStart: { value: 0 }, uR: { value: RR }, uW: { value: W }, uGain: { value: 1 }, uFeather: { value: .012 }, uHot: { value: 0 }, uFloor: { value: .28 }, uSoft: { value: .5 }, uTime: { value: 0 }, uEnergy: { value: 0 }, uMid: { value: .35 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() } } });
          const me = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 512, 1), m); me.position.z = zz; me.renderOrder = 2; world.add(me); parts.push(me); return m; };
        const core = mk(Math.max(1, rIn), l.r, z, rm, w * .55, THREE.NormalBlending), wall = mk(Math.max(1, rIn - 4), l.r + 2, z + .2, rm + 2, w * 1.1, THREE.AdditiveBlending),
          glow = mk(Math.max(1, rIn - 50), l.r + 10, Math.max(z, L[k + 1] ? L[k + 1].h : z) + .5, rIn + (l.r - rIn) * .2, 22, THREE.AdditiveBlending), spill = mk(l.r, l.r + 90, L[k - 1].h + .4, l.r + 5, 26, THREE.AdditiveBlending);
        core.uniforms.uHot.value = .55; wall.uniforms.uFeather.value = .12; glow.uniforms.uFeather.value = .3; spill.uniforms.uFeather.value = .35;
        slots.push({ k, l, rm, z, w: l.r - rIn, core, wall, glow, spill, haze: [], acc: 0 }); } });
    const s = Math.max(R, 200) * 1.45; Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 50, far: s * 8 }); key.shadow.camera.updateProjectionMatrix();
    applyLight(); placeLines(); }
  // (indices: engraved into the face, printed on it, or applied (polished pills standing proud); every major one longer)
  function indices(l, k, pr, rIn, rOut, isMark) { const dt = l.details, style = isMark ? dt.markStyle : dt.tickStyle, n = isMark ? 1 : Math.round(dt.ticks);
    const rr = lerp(rIn, rOut, clamp(isMark ? dt.markR : dt.tickR, 0, 1)), zf = pr.faceZ(k, rr), dark = isDark(l.look.color);
    const groups = {}; for (let i = isMark ? 0 : (dt.mark ? 1 : 0); i < n; i++) { const major = isMark || (dt.major > 0 && i % dt.major === 0), Lh = isMark ? dt.markLen : dt.tickLen * (major && dt.major ? 1.7 : 1), W = isMark ? dt.markW : dt.tickW * (major && dt.major ? 1.25 : 1);
      const key = Lh.toFixed(2) + '|' + W.toFixed(2); (groups[key] = groups[key] || { Lh, W, at: [] }).at.push(i / n * Math.PI * 2); }
    for (const gk in groups) { const { Lh, W, at } = groups[gk], items = [];
      const lit = isMark && style === 'light', applied = style === 'applied' || lit;
      let g; if (applied) { const bv = Math.min(.55, W * .22); g = new THREE.ExtrudeGeometry(stadium(Math.max(W - 2 * bv + .01, Lh - 2 * bv), Math.max(.3, W - 2 * bv)), { depth: lit ? .5 : .7, bevelEnabled: true, bevelThickness: .45, bevelSize: bv, bevelSegments: 5, curveSegments: 16 }); }
      else g = new THREE.ShapeGeometry(stadium(Lh + .3, W + .3), 14);
      for (const a of at) items.push({ g, c: [rr * Math.sin(a), rr * Math.cos(a)], rad: [Math.sin(a), Math.cos(a)], tan: [-Math.cos(a), Math.sin(a)], z: zf + (applied ? -.05 : .04) });
      const geo = bake(items); g.dispose(); let mat;
      if (lit) { mat = makeMat({ roughness: .22, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 }, '#ff8a12', 0, null, THREE.FrontSide); mat.emissive = new THREE.Color('#ff7a12'); mat.emissiveIntensity = .9; }
      else if (applied) mat = makeMat({ roughness: .1, metalness: 1 }, dark ? '#a9abb1' : '#e4e5e8', 0, null, THREE.FrontSide);
      else { const base = (MATERIALS[l.look.type] || MATERIALS.plastic).p, ink = isMark ? '#ff8a12' : dark ? '#e6e6e8' : '#2b2c30';
        mat = makeMat(style === 'printed' ? { roughness: .3, metalness: 0, clearcoat: .5, clearcoatRoughness: .1 } : { ...base, transmission: 0 }, l.look.color, style === 'printed' ? 0 : l.look.grain,
          { kind: style === 'printed' ? 'printed' : 'engraved', u: { uDL: { value: Lh }, uDW: { value: W }, uDDepth: { value: Math.min(1.3, W * .38) }, uDBevel: { value: W * .42 }, uDColor: { value: new THREE.Color(ink) } } }, THREE.FrontSide);
        if (style === 'printed') { mat.transparent = true; mat.depthWrite = false; } mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2; }
      const m = new THREE.Mesh(geo, mat); m.castShadow = applied; m.receiveShadow = true; m.renderOrder = 1; m.userData.mark = isMark && lit; put(m, l); } }
  function applyLight() { const Lt = D.light, d = R * 3.67, az = rad(Lt.az), el = rad(clamp(Lt.el, 8, 90));
    key.position.set(d * Math.cos(el) * Math.sin(az), d * Math.cos(el) * Math.cos(az), d * Math.sin(el)); key.shadow.radius = 1 + Lt.soft * 14;
    if (Math.abs(envHl - Lt.hl) > .001) { scene.environment?.dispose(); scene.environment = studio(renderer, .012 + Lt.hl * .055); envHl = Lt.hl; }
    scene.environmentRotation.set(0, 0, -rad(Lt.az - 31)); ARC.uMinRough.value = .02 + Lt.hl * .32; HQ.ver++;
    key.intensity = D.light.key; fill.intensity = D.light.ambient * .5; scene.environmentIntensity = D.light.ambient * 1.1; renderer.toneMappingExposure = D.light.exposure; host.style.background = D.page; }

  // ---------- the light, each frame ----------
  const C = h => new THREE.Color(h);
  function paintSlots(dt) { const tip = rad(angleOf(state.cur)), start = rad(-D.control.sweep / 2), span = Math.max(.04, tip - start), dark = isDark(D.page);
    ARC.uArcOn.value = slots.length ? 1 : 0;
    for (const s of slots) { const S = s.l.slot, cols = S.colors.map(C), t = (state.cur - D.control.min) / Math.max(1e-6, D.control.max - D.control.min);
      for (const [m, gain] of [[s.core, dark ? 1.3 : 1.05], [s.wall, dark ? .3 : .12], [s.glow, dark ? .14 : 0], [s.spill, dark ? .08 : .02]]) { const u = m.uniforms;
        u.uTip.value = tip; u.uStart.value = start; u.uSpan.value = span; u.uTime.value = state.time; u.uEnergy.value = S.energy; u.uMid.value = S.mid; u.uA.value.copy(cols[0]); u.uB.value.copy(cols[1]); u.uC.value.copy(cols[2]);
        u.uGain.value = m === s.core ? gain : gain * S.glow * (.65 + .45 * t); }
      if (s === slots[0]) { Object.assign(ARC.uArcR, { value: s.rm }); ARC.uArcZ.value = s.z + 1.5; ARC.uArcStart.value = start; ARC.uArcTip.value = tip; ARC.uArcTime.value = state.time; ARC.uArcEnergy.value = S.energy; ARC.uArcMid.value = S.mid;
        ARC.uArcA.value.copy(cols[0]); ARC.uArcB.value.copy(cols[1]); ARC.uArcC.value.copy(cols[2]); ARC.uArcFall.value = Math.max(8, s.w * .65); ARC.uArcGain.value = (dark ? 3.2 : 2.3) * S.glow; }
      const stop = tt => tt < S.mid ? cols[0].clone().lerp(cols[1], tt / S.mid) : cols[1].clone().lerp(cols[2], (tt - S.mid) / (1 - S.mid));
      if (dt > 0 && !O.thumb) { s.acc += dt * S.haze * 14; while (s.acc >= 1) { s.acc--; puff(s, tip, span, start, stop, dark); }
        for (let i = s.haze.length - 1; i >= 0; i--) { const h = s.haze[i]; h.age += dt; const q = h.age / h.life; if (q >= 1) { world.remove(h.s); h.s.material.dispose(); s.haze.splice(i, 1); continue; }
          h.a += h.va * dt; h.r += h.vr * dt; h.z = Math.min(s.z + 26, h.z + h.vz * dt); h.s.position.set(h.r * Math.sin(h.a), h.r * Math.cos(h.a), h.z); h.s.scale.setScalar(h.sz * (1 + q * 1.3));
          h.s.material.opacity = Math.sin(Math.PI * Math.min(1, q * 1.15)) * h.op * Math.min(1.4, S.haze * 1.4); } } }
    // (a lit mark takes the colour of the light's tip)
    const tipCol = slots[0] ? slots[0].l.slot.colors[2] : '#ff8a12';
    for (const p of parts) if (p.userData.mark) { p.material.color.set(tipCol); p.material.emissive.set(tipCol).multiplyScalar(.75); } }
  function puff(s, tip, span, start, stop, dark) { if (s.haze.length > 120 || matchMedia('(prefers-reduced-motion: reduce)').matches) return; const S = s.l.slot;
    const k = Math.pow(Math.random(), 1.5) * .9, a = tip - k * span; if (a < start) return; const t = 1 - (tip - a) / span;
    const m = new THREE.SpriteMaterial({ map: hazeTex, color: stop(t).lerp(new THREE.Color(1, 1, 1), dark ? .15 : .45), transparent: true, depthWrite: false, opacity: 0, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending });
    const sp = new THREE.Sprite(m), r = s.rm + (Math.random() - .5) * 12; sp.position.set(r * Math.sin(a), r * Math.cos(a), s.z + 3 + Math.random() * 4); world.add(sp);
    s.haze.push({ s: sp, a, r, z: sp.position.z, va: (Math.random() < .5 ? -1 : 1) * (.015 + Math.random() * .04), vr: (Math.random() - .35) * 7, vz: 3 + Math.random() * 5, age: 0, life: 2.4 + Math.random() * 2.2, sz: (22 + Math.random() * 18) * S.hazeSize, op: (dark ? .13 : .2) * (.6 + .4 * Math.min(1, t * 1.4)) }); }

  // ---------- the outlines of the layers (for the studio): picked solid, hovered dashed ----------
  const loop = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 257 }, (_, i) => new THREE.Vector3(Math.sin(i / 256 * Math.PI * 2), Math.cos(i / 256 * Math.PI * 2), 0)));
  const pickLine = new THREE.Line(loop, new THREE.LineBasicMaterial({ color: 0xff8a12, transparent: true, opacity: 0, depthTest: false })), hoverLine = new THREE.Line(loop.clone(), new THREE.LineDashedMaterial({ color: 0xff8a12, dashSize: .02, gapSize: .016, transparent: true, opacity: .45, depthTest: false }));
  hoverLine.computeLineDistances(); pickLine.renderOrder = hoverLine.renderOrder = 9; scene.add(pickLine, hoverLine); let shapedAt = -1e9;
  function placeLines() { for (const [line, k] of [[pickLine, state.pick], [hoverLine, state.hover === state.pick ? -1 : state.hover]]) { const l = D.layers[k]; line.visible = !!l && k > 0; if (!line.visible) continue; line.scale.setScalar(l.r); line.position.z = Math.max(l.h, D.layers[k - 1].h) + .5; } }

  // ---------- the view ----------
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    state.K = Math.max(.15, Math.min((w - (O.thumb ? 0 : 24)) / (2 * (R + 60)), (h - (O.thumb ? 0 : 60)) / (2 * (R + 60)))); overlay.style.setProperty('--k', state.K.toFixed(4)); }
  function place() { const h = host.clientHeight, vf = 2 * Math.tan(rad(camera.fov / 2)), ref = D.layers[D.layers.length - 1].h, dist = h / state.K / vf, o = state.orbit, T = state.tilt;
    const ax = T.x * .09, ay = T.y * .09, d = dist * o.z, sp = Math.sin(o.p), cp = Math.cos(o.p);
    camera.position.set(Math.sin(ax) * d + sp * Math.sin(o.t) * d, -Math.sin(ay) * d - sp * Math.cos(o.t) * d, ref + cp * Math.cos(ax) * Math.cos(ay) * d); camera.lookAt(0, 0, ref);
    overlay.classList.toggle('away', o.p > .03 || Math.abs(o.z - 1) > .03); }

  // ---------- the reading: one rolling column per digit, pressed in or printed ----------
  const numEl = overlay.firstChild, unitEl = overlay.lastChild; let cols = [];
  const fmt = v => D.control.unit === 'f' ? String(Math.round(v * 9 / 5 + 32)) : (Math.abs(v % 1) > 1e-6 ? v.toFixed(1) : String(v));
  function readout() { overlay.style.display = D.reading.show ? '' : 'none'; overlay.classList.toggle('engraved', D.reading.style === 'engraved'); overlay.classList.toggle('dark', isDark(D.layers[D.layers.length - 1].look.color));
    const chars = [...(fmt(state.value) + '°')];
    if (cols.length !== chars.length || cols.some((c, i) => c.digit !== /\d/.test(chars[i]))) { numEl.innerHTML = '';
      cols = chars.map(ch => { const el = document.createElement('span'); el.className = 'cs-col'; const digit = /\d/.test(ch);
        if (digit) { const st = document.createElement('span'); st.className = 'cs-strip'; st.innerHTML = '0123456789'.split('').map(x => `<span>${x}</span>`).join(''); el.appendChild(st); } else el.textContent = ch;
        numEl.appendChild(el); return { el, digit, strip: el.firstChild, d: -1 }; }); }
    chars.forEach((ch, i) => { const c = cols[i]; if (!c.digit) { c.el.textContent = ch; return; } const d = +ch; if (d !== c.d) { c.d = d; c.strip.style.transform = `translateY(${-d * 1.3}em)`; } });
    unitEl.textContent = D.control.unit === 'f' ? 'Fahrenheit' : 'Celsius'; cv.setAttribute('aria-valuenow', String(state.value)); }

  // ---------- the hand ----------
  let ac = null; function click(up) { if (!O.sound || O.thumb) return; try { ac = ac || new AudioContext(); if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime, b = ac.createBuffer(1, Math.round(ac.sampleRate * .018), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 8);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = up ? 1500 : 1300; f.Q.value = .5; g.gain.value = .035; s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t);
    const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(up ? 210 : 190, t); o.frequency.exponentialRampToValueAtTime(120, t + .03); og.gain.setValueAtTime(.025, t); og.gain.exponentialRampToValueAtTime(.0001, t + .035); o.connect(og); og.connect(ac.destination); o.start(t); o.stop(t + .04); } catch { } }
  const listeners = { change: [], pick: [], hover: [] }, emit = (n, v) => listeners[n].forEach(f => f(v));
  function setValue(v, quiet) { const c = D.control; v = clamp(Math.round(v / c.step) * c.step, c.min, c.max); v = +v.toFixed(4); if (v === state.value) return; const dir = Math.sign(v - state.value); state.value = v; c.value = v;
    if (O.thumb) state.cur = v; readout(); if (!quiet) click(dir > 0); emit('change', v); }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(x, y) { const r = cv.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)); ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(parts.filter(p => p.isMesh && p.userData.layer != null), false)[0]; if (!h) return null; const p = h.point.clone(); return { layer: h.object.userData.layer, r: Math.hypot(p.x, p.y), z: p.z }; }
  const angleAt = (x, y) => { const r = cv.getBoundingClientRect(); return Math.atan2(x - (r.left + r.width / 2), -(y - (r.top + r.height / 2))) * 180 / Math.PI; };
  let drag = null;
  cv.addEventListener('pointerdown', e => { if (e.button > 0) return; const h = hit(e.clientX, e.clientY), turn = O.interactive && !O.editing && h && D.layers[h.layer]?.rotates;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, a: angleAt(e.clientX, e.clientY), v: state.value, mode: turn ? 'turn' : O.orbit ? 'orbit' : 'none', t: state.orbit.tt, p: state.orbit.tp, moved: false, h };
    try { cv.setPointerCapture(e.pointerId); } catch { } cv.style.cursor = drag.mode === 'none' ? '' : 'grabbing'; });
  cv.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
      if (drag.mode === 'turn') { const a = angleAt(e.clientX, e.clientY); let d = a - drag.a; if (d > 180) d -= 360; if (d < -180) d += 360; drag.a = a; const c = D.control; drag.v = clamp(drag.v + d / c.sweep * (c.max - c.min), c.min - .4, c.max + .4); setValue(drag.v); }
      else if (drag.mode === 'orbit' && drag.moved) { state.orbit.tt = drag.t - dx * .006; state.orbit.tp = clamp(drag.p + dy * .005, 0, 1.3); }
      return; }
    if (e.pointerType === 'mouse') { const r = cv.getBoundingClientRect(); state.tilt.tx = O.editing || HQ.on ? 0 : clamp((e.clientX - r.left - r.width / 2) / r.width, -.8, .8); state.tilt.ty = O.editing || HQ.on ? 0 : clamp((e.clientY - r.top - r.height / 2) / r.height, -.8, .8);
      const h = hit(e.clientX, e.clientY), k = h ? h.layer : -1; if (k !== state.hover) { state.hover = k; placeLines(); emit('hover', k); }
      cv.style.cursor = O.interactive && !O.editing && h && D.layers[k]?.rotates ? 'grab' : O.orbit ? 'move' : ''; } });
  const up = e => { if (!drag || e.pointerId !== drag.id) return; if (!drag.moved && drag.h) emit('pick', drag.h.layer); drag = null; cv.style.cursor = ''; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', () => { state.tilt.tx = state.tilt.ty = 0; if (state.hover !== -1) { state.hover = -1; placeLines(); emit('hover', -1); } });
  let wheelAcc = 0; cv.addEventListener('wheel', e => { e.preventDefault(); if (O.orbit && (O.editing || e.ctrlKey || e.altKey)) { state.orbit.tz = clamp(state.orbit.tz * Math.exp(e.deltaY * .0012), .4, 2.4); return; }
    if (!O.interactive) return; wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? -e.deltaY : e.deltaX; while (Math.abs(wheelAcc) >= 40) { setValue(state.value + Math.sign(wheelAcc) * D.control.step); wheelAcc -= Math.sign(wheelAcc) * 40; } }, { passive: false });
  cv.addEventListener('dblclick', () => { Object.assign(state.orbit, { tt: 0, tp: 0, tz: 1 }); });
  cv.tabIndex = 0; cv.setAttribute('role', 'slider'); cv.setAttribute('aria-label', 'Dial');
  cv.addEventListener('keydown', e => { const c = D.control, m = { ArrowUp: c.step, ArrowRight: c.step, ArrowDown: -c.step, ArrowLeft: -c.step, PageUp: c.step * 4, PageDown: -c.step * 4 }[e.key];
    if (m != null) { e.preventDefault(); setValue(state.value + m); } else if (e.key === 'Home') setValue(c.min); else if (e.key === 'End') setValue(c.max); });

  // ---------- the loop ----------
  let raf = 0, last = 0, alive = true;
  function frame(now) { if (!alive) return; raf = requestAnimationFrame(frame); const dt = Math.min(.033, last ? (now - last) / 1000 : .016); last = now;
    const k = 420, c = 2 * .8 * Math.sqrt(k); state.vel += (k * (state.value - state.cur) - c * state.vel) * dt; state.cur += state.vel * dt;
    const T = state.tilt, o = state.orbit; T.x += (T.tx - T.x) * .08; T.y += (T.ty - T.y) * .08; for (const q of ['t', 'p', 'z']) o[q] += (o['t' + q] - o[q]) * .14;
    if (!HQ.on) state.time += dt * 2.4 * (slots[0]?.l.slot.speed ?? 1);
    const busy = performance.now() - shapedAt < 900; pickLine.material.opacity += ((state.pick > 0 ? (busy ? 0 : .5) : 0) - pickLine.material.opacity) * (busy ? .3 : .08);
    render(dt); }
  function render(dt = 0) { place(); turning.rotation.z = -rad(angleOf(state.cur)); camera.updateMatrixWorld(); if (HQ.on) { hqFrame(); return; } paintSlots(dt); renderer.render(scene, camera); }
  const ro = new ResizeObserver(() => { resize(); if (O.thumb) render(); }); ro.observe(host);
  build(); resize(); readout(); if (O.thumb) render(); else raf = requestAnimationFrame(frame);

  return { scene, camera, renderer, canvas: cv, overlay, state,
    get design() { return D; }, setDesign(d) { D = normalise(d); state.value = state.cur = clamp(D.control.value, D.control.min, D.control.max); build(); resize(); readout(); if (O.thumb) render(); },
    update(d) { D = normalise(d); build(); readout(); shapedAt = performance.now(); },
    setValue, get value() { return state.value; }, setOptions(o) { Object.assign(O, o); if (!O.editing) state.hover = -1; placeLines(); },
    setPick(k) { state.pick = k; placeLines(); },
    relight(d) { Object.assign(D.light, d.light); D.page = d.page; applyLight(); },
    // (studio quality on or off; how far it has refined; a finished still at once, for a picture)
    setQuality(on) { HQ.on = !!on; HQ.sig = ''; if (!on) { renderer.setRenderTarget(null); } },
    get quality() { return { on: HQ.on, n: HQ.n, N: HQ.N }; },
    renderStill(N = HQ.N) { const was = HQ.on; HQ.on = true; HQ.sig = ''; place(); turning.rotation.z = -rad(angleOf(state.cur)); camera.updateMatrixWorld(); for (let i = 0; i < N; i++) hqFrame(); HQ.on = was; if (!was) HQ.sig = ''; }, hit, render, resize, profile: () => profile(D), angleOf,
    on(n, f) { listeners[n].push(f); },
    async still(scale = 2) { const w = host.clientWidth, h = host.clientHeight, pr = renderer.getPixelRatio(); renderer.setPixelRatio(scale); renderer.setSize(w, h, false); render(); const b = await new Promise(r => cv.toBlob(r, 'image/png')); renderer.setPixelRatio(pr); renderer.setSize(w, h, false); return b; },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); clear(); renderer.dispose(); cv.remove(); overlay.remove(); } }; }

// ---------- the reading's look, injected once ----------
if (!document.getElementById('cs-style')) { const st = document.createElement('style'); st.id = 'cs-style'; st.textContent = `
  .cs-reading { position: absolute; left: 50%; top: 50%; translate: -50% -50%; scale: var(--k, 1); display: flex; flex-direction: column; align-items: center; gap: 18px; pointer-events: none; color: #292929; transition: opacity .3s; }
  .cs-reading.away { opacity: 0; } .cs-reading.dark { color: #e7e7e7; }
  .cs-num { display: flex; align-items: center; height: 1.3em; margin: -.14em 0; font: 600 77px/1.3em 'Unbounded', system-ui, sans-serif; letter-spacing: -.02em; font-variant-numeric: tabular-nums;
    -webkit-mask: linear-gradient(transparent, #000 24%, #000 76%, transparent); mask: linear-gradient(transparent, #000 24%, #000 76%, transparent); }
  .cs-col { position: relative; height: 1.3em; display: inline-block; text-align: center; } .cs-strip { display: flex; flex-direction: column; transition: transform .62s cubic-bezier(.25,1.25,.4,1); } .cs-strip span { display: block; height: 1.3em; }
  .cs-unit { font: 700 30px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .02em; text-transform: uppercase; opacity: .9; }
  .cs-reading.dark .cs-unit { opacity: .25; }
  .cs-reading.engraved { color: #c4c2bc; } .cs-reading.engraved .cs-num, .cs-reading.engraved .cs-unit { text-shadow: 0 1.4px 1px rgba(255,255,255,.85), 0 -1px 1.2px rgba(0,0,0,.22); opacity: 1; }
  .cs-reading.engraved.dark { color: #1b1c21; } .cs-reading.engraved.dark .cs-num, .cs-reading.engraved.dark .cs-unit { text-shadow: 0 1px .5px rgba(255,255,255,.09), 0 -1.2px 1.2px rgba(0,0,0,.65); }
  @media (prefers-reduced-motion: reduce) { .cs-strip { transition: none; } }`; document.head.appendChild(st); }

// ---------- presets: a finish for the whole control; a layer's own material only where it is really another thing (glass, a metal cap) ----------
const thermoKnob = { knurl: true, ticks: 16, tickR: .41, tickLen: 9, tickW: 5, tickStyle: 'engraved', mark: true, markR: .36, markLen: 34, markW: 8.4, markStyle: 'light' };
const crown = style => ({ knurl: true, ticks: 60, tickR: .78, tickLen: 9, tickW: 2.2, major: 5, tickStyle: style, mark: true, markR: .78, markLen: 22, markW: 5, markStyle: 'light' });
const glass = { own: true, type: 'glass', color: '#e3e7ec', grain: 0 };
export const PRESETS = {
  Thermostat: { page: '#d9d8d4', finish: { type: 'plastic', color: '#d9d8d3', grain: 1 }, light: { key: 1.25, ambient: .5, exposure: .8, az: 31, el: 54, soft: .35, hl: .2 },
    glow: { colors: ['#c0ff13', '#ffeb13', '#ff8a12'], mid: .35, glow: 1, haze: .9, hazeSize: 1, energy: .6, speed: 1 }, control: { min: 8, max: 28, step: .5, value: 21, sweep: 270, unit: 'c' }, reading: { show: true, style: 'printed' },
    layers: [
      { name: 'Panel', h: 0 },
      { name: 'Light slot', kind: 'slot', r: 295, h: -31, edge: { round: .55, reach: 6, join: 'blend' } },
      { name: 'Knob', r: 272.8, h: -7, rotates: true, tone: .018, edge: { round: .6, reach: 3.5, join: 'blend', polish: true }, details: thermoKnob },
      { name: 'Dish', r: 205, h: -9.4, rotates: true, tone: .018, face: { bulge: -8.3, spread: 2.6 }, edge: { round: .5, reach: 1.8, join: 'blend' } }] },
  Night: { page: '#1c1e24', finish: { type: 'plastic', color: '#1f2127', grain: .6 }, light: { key: 1.2, ambient: .45, exposure: 1, az: 31, el: 54, soft: .35, hl: .2 },
    glow: { colors: ['#1f5c8c', '#1a86c4', '#ff8a12'], mid: .5, glow: 1, haze: .9, hazeSize: 1, energy: .6, speed: 1 }, control: { min: 8, max: 28, step: .5, value: 21, sweep: 270, unit: 'c' }, reading: { show: true, style: 'printed' },
    layers: [
      { name: 'Panel', h: 0 },
      { name: 'Light slot', kind: 'slot', r: 295, h: -31, edge: { round: .55, reach: 6, join: 'blend' } },
      { name: 'Knob', r: 272.8, h: -7, rotates: true, tone: .025, edge: { round: .6, reach: 3.5, join: 'blend', polish: true }, details: thermoKnob },
      { name: 'Dish', r: 205, h: -9.4, rotates: true, tone: .025, face: { bulge: -8.3, spread: 2.6 }, edge: { round: .5, reach: 1.8, join: 'blend' } }] },
  Aluminium: { page: '#d3d4d7', finish: { type: 'anodized', color: '#c9cbcf', grain: .6 }, light: { key: 1.15, ambient: .62, exposure: .86, az: 31, el: 58, soft: .45, hl: .25 },
    glow: { colors: ['#7cc8ff', '#d9f0ff', '#ffffff'], mid: .5, glow: 1, haze: .4, hazeSize: 1, energy: .35, speed: 1 }, control: { min: 0, max: 100, step: 1, value: 64, sweep: 280, unit: 'c' }, reading: { show: false },
    layers: [
      { name: 'Housing', h: 0 },
      { name: 'Light slot', kind: 'slot', r: 300, h: -22, tone: -.05, edge: { round: .35, reach: 3, join: 'blend', polish: true } },
      { name: 'Crown', r: 284, h: 10, rotates: true, tone: -.01, edge: { round: .3, reach: 4, join: 'seam', polish: true }, details: crown('engraved') },
      { name: 'Cap', r: 206, h: 7, rotates: true, tone: -.01, face: { bulge: -3, spread: 3 }, edge: { round: .85, reach: 3, join: 'crease', polish: true } }] },
  Graphite: { page: '#17181b', finish: { type: 'anodized', color: '#2c2d31', grain: .6 }, light: { key: 1.3, ambient: .55, exposure: 1, az: 31, el: 54, soft: .35, hl: .2 },
    glow: { colors: ['#ff5a1f', '#ff9a2e', '#ffd9a0'], mid: .55, glow: 1, haze: .5, hazeSize: 1, energy: .4, speed: 1 }, control: { min: 0, max: 100, step: 1, value: 72, sweep: 280, unit: 'c' }, reading: { show: false },
    layers: [
      { name: 'Housing', h: 0 },
      { name: 'Light slot', kind: 'slot', r: 300, h: -22, tone: -.06, edge: { round: .35, reach: 3, join: 'blend', polish: true } },
      { name: 'Crown', r: 284, h: 10, rotates: true, tone: .03, edge: { round: .3, reach: 4, join: 'seam', polish: true }, details: crown('applied') },
      { name: 'Glass', r: 206, h: 6, face: { bulge: 3, spread: 3 }, edge: { round: .9, reach: 3, join: 'seam', polish: true }, material: glass }] },
  Braun: { page: '#e6e3dc', finish: { type: 'plastic', color: '#e6e3dc', grain: .8 }, light: { key: 1.3, ambient: .5, exposure: .82, az: 31, el: 54, soft: .5, hl: .3 },
    control: { min: 0, max: 10, step: 1, value: 6, sweep: 300, unit: 'c' }, reading: { show: false },
    layers: [
      { name: 'Panel', h: 0 },
      { name: 'Seam', r: 250, h: -3, tone: -.04, edge: { round: .3, reach: 2, join: 'crease' }, details: { ticks: 11, tickR: .55, tickLen: 7, tickW: 2.4, tickStyle: 'printed' } },
      { name: 'Knob', r: 232, h: 46, rotates: true, tone: .03, edge: { round: .25, reach: 5, join: 'seam' }, details: { knurl: true, mark: true, markR: .8, markLen: 26, markW: 6, markStyle: 'printed' } },
      { name: 'Cap', r: 150, h: 44, rotates: true, face: { bulge: -5, spread: 2 }, edge: { round: .6, reach: 3, join: 'crease', polish: true }, material: { own: true, type: 'anodized', color: '#c9cbcf', grain: .5 } }] },
  'Camera ring': { page: '#1b1b1d', finish: { type: 'anodized', color: '#3a2a2d', grain: .4 }, light: { key: 1.6, ambient: .5, exposure: 1, az: 31, el: 54, soft: .35, hl: .15 },
    control: { min: 0, max: 100, step: 1, value: 40, sweep: 270, unit: 'c' }, reading: { show: false },
    layers: [
      { name: 'Body', h: 0 },
      { name: 'Bezel', r: 300, h: 14, tone: .05, edge: { round: .15, reach: 6, join: 'blend', polish: true } },
      { name: 'Step', r: 262, h: 6, tone: .02, edge: { round: .2, reach: 4, join: 'crease', polish: true } },
      { name: 'Glass', r: 220, h: 2, face: { bulge: 4, spread: 3 }, edge: { round: .8, reach: 3, join: 'seam' }, material: glass }] } };
