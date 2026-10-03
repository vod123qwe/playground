// The church fair (Odpust, docs/trasy-tematyczne.md): built once with the village's map. A stretch of road taken by it: the church set
// back on one side behind its wall, the gate in the wall with a banner over it and church banners on poles, stalls along the verges of both
// sides (each with its awning, its goods, its board: each one takes the paper as a house does), strings of pennants across the road.
// createFair({ THREE, toon, put, box, hit, at, S, N, ds, doors, rnd, ROAD, PAVE, i0, i1, side }) → { iC, side, i0, i1, gate, stalls }
import { pixSign } from './pixsign.js';

export function createFair({ THREE, toon, put, box, hit, at, S, N, ds, doors, rnd, ROAD, PAVE, i0, i1, side }) {
  const M = c => toon(c), wrap = i => ((i % N) + N) % N, iC = Math.round((i0 + i1) / 2), m = x => Math.round(x / ds);
  const white = M('#efe9dc'), stone = M('#cfc8b8'), roofM = M('#9a3a2c'), copper = M('#5f8a6a'), gold = M('#e3b22e'), wood = M('#8a6a44'), dark = M('#3a2c22'), glassM = M('#3f5566');
  // ---------- the church: a white nave along the road, a red roof, the tower at one end with its green spire and a cross; the door to the road ----------
  { const g = new THREE.Group(), fx = side * 4.5;
    g.add(box(9, 7, 18, white, 0, 3.5, 0)); const tri = new THREE.Shape(); tri.moveTo(-5.1, 0); tri.lineTo(5.1, 0); tri.lineTo(0, 4); tri.closePath();
    const rg = new THREE.ExtrudeGeometry(tri, { depth: 18.6, bevelEnabled: false }); rg.translate(0, 0, -9.3); const roof = new THREE.Mesh(rg, roofM); roof.position.y = 7; g.add(roof);
    g.add(box(4.4, 15, 4.4, white, 0, 7.5, -11.2), box(4.6, .4, 4.6, stone, 0, 15.2, -11.2)); const sp = new THREE.Mesh(new THREE.ConeGeometry(2.6, 6.5, 4), copper); sp.rotation.y = Math.PI / 4; sp.position.set(0, 18.6, -11.2); g.add(sp);
    g.add(box(.12, 1.6, .12, gold, 0, 22.6, -11.2), box(.12, .12, .8, gold, 0, 22.9, -11.2));
    for (const z of [-6, -2, 2, 6]) g.add(box(.08, 2.8, 1, glassM, fx + side * .02, 3.9, z)); g.add(box(.08, 1.2, 1.2, glassM, fx + side * .02, 11, -11.2 + 0));
    g.add(box(.12, 3.2, 2.2, dark, fx + side * .04, 1.6, 0), box(1.2, .16, 3, stone, fx + side * .6, 3.4, 0)); for (const z of [-1.3, 1.3]) g.add(box(.3, 3.3, .3, stone, fx + side * .5, 1.65, z));
    put(g, iC, side * (PAVE + 18), 0, 0); hit(g, { hx: 4.6, hz: 9.2, h: 7, kind: 'hard' }, iC); hit(g, { hx: 2.3, hz: 2.3, h: 15, kind: 'hard' }, iC, 0, -11.2); }
  // ---------- the churchyard's wall along the road, the gate in it (pillars, a banner over it), the church banners by the gate ----------
  for (let k = -m(20); k <= m(20); k += m(4)) { if (Math.abs(k) < m(3.5)) continue; const w = new THREE.Group(); w.add(box(.4, 1.1, 4.1, stone, 0, .55, 0), box(.5, .1, 4.2, white, 0, 1.15, 0)); put(w, iC + k, side * (PAVE + 5), 0, 0); hit(w, { hx: .25, hz: 2.05, h: 1.2, kind: 'hard' }, iC + k); }
  { const g = new THREE.Group(); for (const z of [-3, 3]) g.add(box(.7, 3.4, .7, white, 0, 1.7, z), box(.9, .2, .9, roofM, 0, 3.5, z));
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1), new THREE.MeshBasicMaterial({ map: pixSign(THREE, 'ODPUST PARAFIALNY', '#f6f3ea', '#9a3a2c'), side: THREE.DoubleSide })); ban.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; ban.position.set(side * .2, 3.1, 0); g.add(ban);
    for (const [z, c1, c2] of [[-4.6, '#f6f3ea', '#e3b22e'], [-5.6, '#f6f3ea', '#3b6fa0'], [4.6, '#f6f3ea', '#cf3a2c'], [5.6, '#f6f3ea', '#e3b22e']]) { g.add(box(.08, 6.5, .08, gold, 0, 3.25, z)); const fl = new THREE.Group(); fl.add(box(.03, 1.6, .7, M(c1), 0, 0, 0), box(.035, .5, .7, M(c2), 0, -.55, 0)); fl.position.set(0, 5.3, z + (z > 0 ? .4 : -.4)); g.add(fl); }
    put(g, iC, side * (PAVE + 5), 0, 0); for (const z of [-3, 3]) hit(g, { hx: .35, hz: .35, h: 3.4, kind: 'hard' }, iC, 0, z); }
  // ---------- the stalls along both verges: a table, an awning in stripes on four poles, the goods, a board with what they sell ----------
  const KINDS = [['BALONY', '#cf3a2c'], ['OBWARZANKI', '#3f8a4a'], ['ZABAWKI', '#3b6fa0'], ['LODY', '#e070b0'], ['WATA CUKROWA', '#e070b0'], ['PIERNIKI', '#9a3a2c']], stalls = [];
  const stripe = c => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 2; const g = cv.getContext('2d'); for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#f6f3ea' : c; g.fillRect(k, 0, 1, 2); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  let kk = 0; for (const s of [-1, 1]) for (let i = i0 + m(6); i < i1 - m(5); i += m(6.4)) { if (s === side && Math.abs(i - iC) < m(7)) continue;
    const [name, col] = KINDS[kk++ % KINDS.length], g = new THREE.Group(), fx = s * .55, aw = new THREE.MeshLambertMaterial({ map: stripe(col) });
    g.add(box(1.1, .9, 2.4, wood, 0, .45, 0), box(1.14, .06, 2.44, M('#f6f3ea'), 0, .92, 0)); for (const x of [-.55, .55]) for (const z of [-1.2, 1.2]) g.add(box(.06, 2.3, .06, wood, x, 1.15, z));
    const a = box(1.7, .06, 2.8, aw, s * .15, 2.3, 0); a.rotation.z = -s * .22; g.add(a);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .42), new THREE.MeshBasicMaterial({ map: pixSign(THREE, name, '#f6f3ea', col) })); bd.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; bd.position.set(fx + s * .05, 1.75, 0); g.add(bd);
    if (name === 'BALONY') for (let q = 0; q < 6; q++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), M(['#cf3a2c', '#e3b22e', '#3b6fa0', '#3f8a4a', '#e070b0', '#f6f3ea'][q])); b.scale.y = 1.2; b.position.set(-s * .3 + (rnd() - .5) * .5, 2.9 + rnd() * .5, (q - 2.5) * .35); g.add(b, box(.01, 1.9, .01, M('#c9c4ba'), b.position.x, 1.95, b.position.z)); }
    else if (name === 'OBWARZANKI') for (let q = 0; q < 8; q++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.11, .04, 5, 10), M('#c98a4a')); r.position.set(0, 1.35 + (q % 2) * .2, (q - 3.5) * .26); r.rotation.y = Math.PI / 2; g.add(r); }
    else if (name === 'LODY') { g.add(box(.8, .5, 1.4, M('#f6f3ea'), 0, 1.2, 0)); for (let q = 0; q < 3; q++) g.add(box(.18, .3, .18, M(['#f0e0c0', '#6b4a2e', '#e070b0'][q]), 0, 1.6, (q - 1) * .4)); }
    else if (name === 'WATA CUKROWA') for (let q = 0; q < 5; q++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), M('#f0a0c8')); b.position.set(0, 1.5, (q - 2) * .4); g.add(b, box(.02, .5, .02, M('#f6f3ea'), 0, 1.15, (q - 2) * .4)); }
    else for (let q = 0; q < 7; q++) g.add(box(.2, .14 + rnd() * .2, .26, M(name === 'PIERNIKI' ? ['#7a4a2a', '#9a3a2c', '#c98a4a'][q % 3] : ['#cf3a2c', '#e3b22e', '#3b6fa0', '#3f8a4a'][q % 4]), (rnd() - .5) * .6, 1.02, (q - 3) * .32));
    const d = s * (ROAD + 1.8); put(g, i, d, 0, 0); hit(g, { hx: .6, hz: 1.25, h: 1, kind: 'hard' }, i);
    // (each stall a subscriber's door: the paper on its counter)
    const A = S[wrap(i)], n = new THREE.Vector3(A.r.x * -s, 0, A.r.z * -s).normalize(), front = at(i, s * (ROAD + 1.8 - .55), 0), hi = doors.length;
    doors.push({ p: front.clone().addScaledVector(n, 1.3), n, done: false, i, stall: name });
    stalls.push({ i, s, d, name, house: hi }); }
  // ---------- pennants on strings across the road, a pole each side ----------
  const PEN = ['#cf3a2c', '#e3b22e', '#f6f3ea', '#3b6fa0', '#3f8a4a'].map(M), W = ROAD + 2.7;
  for (let i = i0 + m(3); i < i1; i += m(14)) { const g = new THREE.Group(); for (const x of [-W, W]) g.add(box(.1, 5.6, .1, wood, x, 2.8, 0)); g.add(box(W * 2, .03, .03, M('#c9c4ba'), 0, 5.35, 0));
    for (let q = 0; q < 14; q++) { const t = new THREE.Mesh(new THREE.ConeGeometry(.16, .34, 3), PEN[q % PEN.length]); t.rotation.x = Math.PI; t.position.set(-W + (q + .5) * (W * 2 / 14), 5.15 - Math.sin((q + .5) / 14 * Math.PI) * .35, 0); g.add(t); }
    put(g, i, 0, 0, 0); for (const x of [-W, W]) hit(g, { hx: .08, hz: .08, h: 5.6, kind: 'hard' }, i, x, 0); }
  return { iC, side, i0, i1, stalls, gate: at(iC, side * (PAVE + 4), 0) };
}
