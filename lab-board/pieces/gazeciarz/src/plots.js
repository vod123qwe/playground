// Plots in place of a house, now and then (as the shacks are): each a little place of its own, with something to do in it.
//   dzialki  the allotments: beds in rows, a foil greenhouse, a scarecrow, a compost box; the allotment man minds his beds
//   garaze   a row of tin garages; one, now and then, open, and in it, on a shelf, a set of gears nobody is watching
//   budowa   a building site: a heap of sand, a mixer, a pallet of blocks, a skip, mud; a plank up the heap to jump from
//   trzepak  a yard with a carpet beater (a rug hung on it), a sandbox, a bench, a kid, and a ball to kick about
//   buda     a kennel and a dog on its chain (it lunges as far as the chain lets it), a hen house, hens that scatter
//   kapliczka a wayside shrine: candles, flowers, a cross; a granny at her prayers by it
//   przyczepa an old caravan on blocks, tyres flat, smoke from its pipe, its man on a crate at the door
// Each is built in its own space (the road towards -z, its front edge at z -5.4), stood beside the road as the shacks are, and gives
// world.js its things (what reacts to a kick, a step, a pass) and the residents their seats (who stands there, with what to say).
export function createPlots(K) {
  const { THREE, toon, tex, P, box, rep, hit, put, zone, things, seats, show, ramps, PAVE, rnd } = K;
  const M = {
    dirt: toon('#6e5a3e'), soil: toon('#5a4430'), green: toon('#5f8f3a'), green2: toon('#7aa645'), cabbage: toon('#9fc07a'), wood: toon('#8a6a44'), dark: toon('#1d1e21'), grey: toon('#8d9194'),
    foil: toon('#e9eef0', { transparent: true, opacity: .55, depthWrite: false }), white: toon('#f3efe4'), red: toon('#b3372c'), sand: toon('#d9c08a'), orange: toon('#d9822b'), block: toon('#a9a49a'),
    yellow: toon('#e3b83a'), metal: toon('#6f7a86'), rug: toon('#8e2e25', { map: rep(tex.siding(), 1, 1) }), cream: toon('#e9dfc6'), stripe: toon('#3d7be0'), rust: toon('#8a4a2a'), straw: toon('#d9b86a'),
    hen: toon('#f1ece0'), comb: toon('#cf3a2e'), beak: toon('#e3a83a'), flame: new THREE.MeshBasicMaterial({ color: '#ffd27a' }), mud: toon('#5b4630'), water: toon('#7f95a3', { transparent: true, opacity: .85 }) };
  const tinT = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); for (let x = 0; x < 16; x++) { g.fillStyle = x % 4 < 2 ? '#8a9096' : '#6a7076'; g.fillRect(x, 0, 1, 16); } g.fillStyle = 'rgba(138,74,42,.5)'; g.fillRect(4, 10, 4, 4); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const tin = (c, rx = 2, ry = 1) => { const t = tinT.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return toon(c, { map: t }); };
  const ball = (r, m, x, y, z, sy = 1) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); o.position.set(x, y, z); o.scale.y = sy; return o; };
  const cyl = (r0, r1, hh, m, x, y, z, seg = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, hh, seg), m); o.position.set(x, y, z); return o; };
  const fenceFront = (h, gapAt = 0) => { for (const [x, len] of [[-4.6 + gapAt, 5], [4.6 + gapAt, 5]]) { const f = P.wireFence(len); f.group.position.set(x, 0, -5.4); f.group.rotation.y = Math.PI / 2; h.add(f.group); } };
  // the common part: built, stood by the road, its colliders made where it stands, its ground kept clear of trees and tufts
  function plot(i, side, label, build) {
    const h = new THREE.Group(), late = [], after = []; build(h, late, after);
    put(h, i, side * (PAVE + 7), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    // set on the ground as a house is (the slopes): each thing down to the ground under it, the slabs tilted with it
    K.settle(h, i, 15, 12); const v = new THREE.Vector3(); for (const c of h.children) { if (!c.isMesh || c.userData.slab || c.geometry.type === 'IcosahedronGeometry') continue; c.getWorldPosition(v); c.position.y += K.groundAt(v.x, v.z, i) - h.position.y; }
    for (const q of seats) if (q.h === h) { h.updateMatrixWorld(true); h.localToWorld(v.copy(q.local)); q.local.y = K.groundAt(v.x, v.z, i) - h.position.y; }   // (who stands there: on the ground too)
    h.updateMatrixWorld(true); zone(h, 7.5, 6, 0, 1);
    for (const [sp, x, z] of late) hit(h, sp, i, x, z); for (const f of after) f(h);
    show.shacks.push({ o: h, label, note: '15 × 12 m' }); return h; }
  const stand = (h, i, x, z, key, lines, face = Math.PI) => seats.push({ h, local: new THREE.Vector3(x, 0, z), stand: true, key, face, lines, i });
  const B = {
    dzialki(i, side) { return plot(i, side, 'działki', (h, late) => {
      fenceFront(h);
      const beds = new THREE.Group(); beds.position.set(-1.2, 0, -.6); h.add(beds);   // (the beds' middle: where the man minds them from)
      for (let r = 0; r < 4; r++) { const z = -2.4 + r * 1.6; beds.add(box(6, .14, 1, M.soil, 0, .07, z));
        for (let k = 0; k < 9; k++) { const x = -2.7 + k * .66; if (r % 2) beds.add(ball(.16 + rnd() * .06, M.cabbage, x, .22, z, .8)); else { beds.add(box(.03, .6, .03, M.wood, x, .44, z)); beds.add(ball(.12, M.green2, x, .55 + rnd() * .2, z, 1.4)); } } }
      late.push([{ hx: 3, hz: 3.2, h: .3, kind: 'soft' }, -1.2, -.6]);
      things.push({ kind: 'beds', o: beds, r: 3.4 });
      { const gh = new THREE.Group(); gh.position.set(4.6, 0, 1.2); h.add(gh); gh.add(box(2.4, 1.6, 3.6, M.foil, 0, .8, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.6, 10, 1, false, 0, Math.PI), M.foil); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.y = 1.6; gh.add(roof);
        for (const z of [-1.8, 0, 1.8]) gh.add(box(2.45, .05, .05, M.wood, 0, 1.6, z)); for (let k = 0; k < 4; k++) gh.add(ball(.25, M.green, -.6 + k * .4, .3, (rnd() - .5) * 2, 1.3));
        late.push([{ hx: 1.2, hz: 1.8, h: 2.4, kind: 'hard' }, 4.6, 1.2]); things.push({ kind: 'bush', o: gh, parts: [], r: 1.3, top: 1.6 }); }
      { const s = new THREE.Group(); s.position.set(-5.2, 0, -1); s.userData.keep = true; h.add(s); s.add(box(.08, 1.9, .08, M.wood, 0, .95, 0)); s.add(box(1.3, .07, .07, M.wood, 0, 1.45, 0)); s.add(box(.6, .55, .3, M.red, 0, 1.3, 0)); s.add(ball(.17, M.straw, 0, 1.82, 0));
        s.add(cyl(.28, .28, .03, M.straw, 0, 1.95, 0)); s.add(cyl(.13, .15, .16, M.straw, 0, 2.04, 0)); for (const x of [-.6, .6]) s.add(ball(.07, M.straw, x, 1.45, 0, 1.6));
        late.push([{ hx: .12, hz: .12, h: 2, kind: 'hard' }, -5.2, -1]); things.push({ kind: 'pole', o: s, r: .3, soft: true }); }
      { const c = new THREE.Group(); c.position.set(5.2, 0, -3.4); h.add(c); for (const [x, z, w, d] of [[0, -.5, 1.1, .05], [0, .5, 1.1, .05], [-.55, 0, .05, 1], [.55, 0, .05, 1]]) c.add(box(w, .6, d, M.wood, x, .3, z)); c.add(box(1, .3, .9, M.soil, 0, .18, 0)); late.push([{ hx: .6, hz: .55, h: .7, kind: 'hard' }, 5.2, -3.4]); }
      stand(h, i, 1.6, -4.1, 'gardener', 'dzialki'); }); },
    garaze(i, side) { const open = rnd() < .5; return plot(i, side, 'garaże', (h, late, after) => {
      const cols = ['#5d6639', '#8a5a3a', '#6e7478', '#3f5f7a', '#8a8f94'], k0 = rnd() * 4 | 0;
      for (let k = 0; k < 4; k++) { const x = -4.8 + k * 3.2, z = 1.6, g = new THREE.Group(); g.position.set(x, 0, z); h.add(g); g.add(box(3, 2.4, 5.5, tin(cols[(k + k0) % cols.length], 3, 1), 0, 1.2, 0));
        const rf = box(3.2, .06, 5.9, tin('#6a7076', 2, 3), 0, 2.48, 0); rf.rotation.x = -.06; g.add(rf);
        if (open && k === 2) { g.add(box(2.6, 2, .05, M.dark, 0, 1, -2.76)); g.add(box(2.6, .25, .08, tin(cols[k % 5]), 0, 2.15, -2.8));   // the door up: dark inside, a shelf with a box of gears on it
          g.add(box(1.2, .05, .4, M.wood, .7, 1, -1.9)); const part = new THREE.Group(); part.position.set(.7, 1.12, -1.9); part.userData.keep = true; g.add(part); part.add(box(.34, .18, .24, toon('#c23a2e'), 0, 0, 0)); part.add(new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 6, 14), M.grey)); part.children[1].position.set(.06, .14, 0);
          things.push({ kind: 'loot', o: part, r: .9, item: 'biegi', tier: 2, label: 'PRZERZUTKI Z GARAŻU' }); }
        else { g.add(box(2.6, 2, .06, tin(cols[(k + 2) % cols.length], 2, 1), 0, 1, -2.76)); g.add(box(.08, .2, .08, M.grey, .9, 1, -2.8)); }
        late.push([{ hx: 1.5, hz: 2.75, h: 2.5, kind: 'hard' }, x, z]); }
      { const ap = box(14, .06, 4, toon('#7d776c'), 0, .03, -2.8); ap.userData.slab = true; h.add(ap); }   // the concrete in front of them (laid on the ground: tilted with it)
      for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .12, 6, 12), M.dark); t.rotation.x = Math.PI / 2; t.position.set(6.6, .12 + k * .24, -1); h.add(t); } }); },
    budowa(i, side) { return plot(i, side, 'budowa', (h, late, after) => {
      fenceFront(h, .5);
      { const heap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.8, 9), M.sand); heap.position.set(-3, .9, 1); heap.scale.z = .8; h.add(heap); late.push([{ hx: 2, hz: 1.6, h: 1.6, kind: 'hard' }, -3, 1]); }
      { const mx = new THREE.Group(); mx.position.set(2, 0, -1.2); mx.userData.keep = true; h.add(mx); mx.add(box(1, .5, .7, M.metal, 0, .25, 0)); const dr = cyl(.42, .3, .9, M.orange, 0, 1, 0); dr.rotation.z = .6; mx.add(dr); for (const x of [-.45, .45]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 6, 12), M.dark); w.rotation.y = Math.PI / 2; w.position.set(x, .2, .4); mx.add(w); }
        late.push([{ hx: .55, hz: .45, h: 1.4, kind: 'hard' }, 2, -1.2]); things.push({ kind: 'pole', o: mx, r: .55, soft: true }); }
      { const pl = new THREE.Group(); pl.position.set(4.6, 0, 2); h.add(pl); pl.add(box(1.2, .12, 1.2, M.wood, 0, .06, 0)); for (let y = 0; y < 3; y++) for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) pl.add(box(.56, .24, .36, M.block, -.3 + a * .6, .25 + y * .25, -.4 + b * .4)); late.push([{ hx: .65, hz: .65, h: 1, kind: 'hard' }, 4.6, 2]); things.push({ kind: 'pole', o: pl, r: .7 }); }
      { const sk = new THREE.Group(); sk.position.set(-5.6, 0, -2.6); sk.rotation.y = .2; h.add(sk); sk.add(box(1.6, 1, 3, M.yellow, 0, .5, 0)); sk.add(box(1.5, .1, 2.9, M.dark, 0, .96, 0)); for (let k = 0; k < 4; k++) sk.add(box(.3 + rnd() * .6, .1, .1, M.wood, (rnd() - .5), 1.05, (rnd() - .5) * 2)); late.push([{ hx: .85, hz: 1.55, h: 1.1, kind: 'hard' }, -5.6, -2.6]); }
      for (let k = 0; k < 3; k++) { const r0 = .8 + rnd() * .6, md = cyl(r0, r0, .06, M.mud, -1 + rnd() * 3, 0, -3.6 + rnd() * 1.5, 12); md.userData.slab = true; md.userData.thick = .025; h.add(md); after.push(hh => K.puddle(hh, md.position.x, md.position.z, .9, true)); }
      stand(h, i, .6, -2.4, 'brawler', 'budowa');
      after.push(() => { const o = P.ramp(rnd, 'kicker'); put(o.group, i + 3, side * 5.8, 0, 0); ramps.push(hit(o.group, o.hit, i + 3)); });   // (a plank on the pavement in front: up and over)
    }); },
    trzepak(i, side) { return plot(i, side, 'trzepak', (h, late) => {
      { const t = new THREE.Group(); t.position.set(-1, 0, .5); t.userData.keep = true; h.add(t); for (const x of [-1.1, 1.1]) t.add(box(.07, 1.5, .07, M.metal, x, .75, 0)); t.add(box(2.3, .06, .06, M.metal, 0, 1.48, 0)); t.add(box(2.3, .05, .05, M.metal, 0, .9, 0));
        const rug = box(1.6, .9, .03, M.rug, 0, 1.05, .04); t.add(rug); late.push([{ hx: 1.15, hz: .12, h: 1.5, kind: 'hard' }, -1, .5]); things.push({ kind: 'pole', o: t, r: .4, carpet: true }); }
      { const sb = P.sandbox(rnd); sb.group.position.set(3.4, 0, 1.8); sb.group.scale.setScalar(.8); h.add(sb.group); }
      { const bn = new THREE.Group(); bn.position.set(-4.6, 0, 2.4); h.add(bn); bn.add(box(1.8, .06, .4, M.wood, 0, .45, 0)); bn.add(box(1.8, .3, .05, M.wood, 0, .7, .2)); for (const x of [-.8, .8]) bn.add(box(.08, .45, .4, M.dark, x, .22, 0)); late.push([{ hx: .9, hz: .25, h: .8, kind: 'hard' }, -4.6, 2.4]); }
      { const b = new THREE.Group(); const s = ball(.12, M.white, 0, 0, 0); b.add(s); for (let k = 0; k < 3; k++) { const p = ball(.05, M.red, 0, 0, 0); p.position.setFromSphericalCoords(.11, k * 1.2 + .4, k * 2.1); b.add(p); } b.position.set(1.8, .12, -2.4); b.userData.keep = true; h.add(b); things.push({ kind: 'ball', o: b, r: .12 }); }
      stand(h, i, .8, -1.6, 'kid', 'trzepak', Math.PI * .8); }); },
    buda(i, side) { return plot(i, side, 'buda z psem', (h, late) => {
      fenceFront(h, -.5);
      { const k = new THREE.Group(); k.position.set(-3, 0, .4); h.add(k); k.add(box(1.1, .8, 1.3, M.wood, 0, .4, 0)); for (const sd of [-1, 1]) { const r = box(.75, .06, 1.45, M.red, sd * .32, 1, 0); r.rotation.z = -sd * .6; k.add(r); } k.add(box(.45, .5, .05, M.dark, 0, .3, -.66));
        late.push([{ hx: .6, hz: .7, h: 1.1, kind: 'hard' }, -3, .4]); things.push({ kind: 'chaindog', o: k, r: .7, ax: 0, az: -1.1, len: 2.6 }); }
      { const c = new THREE.Group(); c.position.set(3.2, 0, 2); h.add(c); c.add(box(1.8, 1.2, 1.4, toon('#9e7a4f'), 0, .9, 0)); for (const x of [-.8, .8]) for (const z of [-.6, .6]) c.add(box(.08, .3, .08, M.wood, x, .15, z)); const rf = box(2, .06, 1.6, M.red, 0, 1.6, 0); rf.rotation.x = .25; c.add(rf);
        const rmp = box(.35, .04, 1, M.wood, -.4, .2, -1.05); rmp.rotation.x = .5; c.add(rmp); late.push([{ hx: .95, hz: .75, h: 1.6, kind: 'hard' }, 3.2, 2]); }
      for (let n = 0; n < 4; n++) { const g = new THREE.Group(); g.add(ball(.14, M.hen, 0, .2, 0, .9)); g.add(ball(.08, M.hen, 0, .36, .12)); g.add(box(.03, .06, .07, M.comb, 0, .45, .12)); g.add(box(.03, .03, .06, M.beak, 0, .35, .21)); g.add(box(.12, .1, .04, M.hen, 0, .28, -.14));
        for (const x of [-.05, .05]) g.add(box(.015, .12, .015, M.beak, x, .06, 0)); g.position.set(1.5 + (rnd() - .5) * 3, 0, -1 + (rnd() - .5) * 2.5); g.rotation.y = rnd() * 6; g.userData.keep = true; h.add(g); things.push({ kind: 'hen', o: g, r: .2, home: [1.6, -.6], roam: 2.6 }); } }); },
    kapliczka(i, side) { return plot(i, side, 'kapliczka', (h, late) => {
      const s = new THREE.Group(); s.position.set(0, 0, -3); s.userData.keep = true; h.add(s); s.add(box(.9, .3, .9, M.block, 0, .15, 0)); s.add(box(.7, 1.5, .7, M.white, 0, 1.05, 0)); s.add(box(.42, .5, .05, M.dark, 0, 1.3, -.34)); s.add(box(.2, .3, .03, toon('#3d7be0'), 0, 1.3, -.37));
      const rf = new THREE.Mesh(new THREE.ConeGeometry(.65, .5, 4), toon('#3a3d42')); rf.rotation.y = Math.PI / 4; rf.position.y = 2.05; s.add(rf); s.add(box(.05, .45, .05, M.metal, 0, 2.5, 0)); s.add(box(.25, .05, .05, M.metal, 0, 2.58, 0));
      const flames = []; for (const x of [-.25, 0, .25]) { s.add(cyl(.045, .045, .14, M.red, x, .37, -.52)); const f = new THREE.Mesh(new THREE.ConeGeometry(.03, .08, 5), M.flame); f.position.set(x, .49, -.52); s.add(f); flames.push(f); }
      for (const x of [-.38, .38]) { s.add(cyl(.08, .06, .14, toon('#9a4a32'), x, .37, -.5)); for (let k = 0; k < 3; k++) s.add(ball(.05, [M.comb, M.yellow, M.white][k], x + (k - 1) * .04, .5 + k * .03, -.5)); }
      late.push([{ hx: .45, hz: .45, h: 2.4, kind: 'hard' }, 0, -3]); things.push({ kind: 'shrine', o: s, r: .5, flames });
      { const bn = new THREE.Group(); bn.position.set(2.4, 0, -2); bn.rotation.y = -.5; h.add(bn); bn.add(box(1.4, .06, .4, M.wood, 0, .45, 0)); for (const x of [-.6, .6]) bn.add(box(.08, .45, .38, M.dark, x, .22, 0)); }
      stand(h, i, 1.1, -3.3, 'granma', 'kapliczka', -Math.PI / 2); }); },
    przyczepa(i, side) { return plot(i, side, 'przyczepa', (h, late) => {
      const c = new THREE.Group(); c.position.set(-.5, 0, .6); c.rotation.y = .12; c.userData.keep = true; h.add(c); c.add(box(4.6, 1.9, 2.1, M.cream, 0, 1.4, 0)); c.add(box(4.62, .25, 2.12, M.stripe, 0, 1.1, 0)); const top = box(4.4, .2, 2, M.cream, 0, 2.42, 0); c.add(top);
      for (const x of [-1.5, .9]) c.add(box(.9, .5, .05, toon('#3f5566'), x, 1.7, -1.06)); const door = box(.7, 1.5, .05, toon('#d8cfb4'), -.4, 1.2, -1.07); c.add(door);
      for (const x of [-1.6, 1.6]) for (const z of [-.9, .9]) c.add(box(.3, .45, .3, M.block, x, .22, z)); const tyre = new THREE.Mesh(new THREE.TorusGeometry(.3, .12, 6, 12), M.dark); tyre.position.set(.2, .32, -1.1); tyre.scale.y = .75; c.add(tyre);
      c.add(box(1, .06, .06, M.metal, 2.8, .5, 0)); const pipe = cyl(.06, .06, .5, M.metal, 1.6, 2.7, .5); c.add(pipe);
      late.push([{ hx: 2.35, hz: 1.1, h: 2.5, kind: 'hard' }, -.5, .6]); things.push({ kind: 'caravan', o: c, r: 1.3, door, pipe });
      { const cr = box(.5, .45, .4, M.wood, -1.6, .22, -1.6); h.add(cr); } { const ch = new THREE.Group(); ch.position.set(1.2, 0, -1.9); h.add(ch); ch.add(box(.45, .05, .45, M.white, 0, .42, 0)); ch.add(box(.45, .45, .05, M.white, 0, .65, .2)); for (const x of [-.2, .2]) for (const z of [-.2, .2]) ch.add(box(.03, .42, .03, M.white, x, .21, z)); }
      stand(h, i, -1.6, -2.1, 'belly', 'przyczepa'); }); } };
  return { build: (kind, i, side) => B[kind](i, side), kinds: Object.keys(B) };
}
