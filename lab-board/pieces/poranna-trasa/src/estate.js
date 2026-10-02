// "Druga strona": the new estate over the tracks. What the region has besides its houses: lots where a house is going up (a concrete frame,
// half-built walls, scaffolding on the front, a heap of sand, a cement mixer, mesh fence panels with a gap, the site's sign), warehouses
// (corrugated halls with a roller door, a loading dock, pallets, a forklift), road works on the road (one lane closed behind barriers and
// cones, an excavator in it, the traffic going round) and tower cranes over the roofs. A house lot's front faces the road: local +x on
// the right side of it (s = +1), local -x on the left.
// createEstate({ THREE, toon, P, put, box, hit, zone, things, parked, puddles, PAVE, ds, N, rnd }) → { site(i, s), warehouse(i, s), works(i, sd), crane(i, d) }

export function createEstate({ THREE, toon, P, put, box, hit, zone, things, parked, puddles, PAVE, ds, N, rnd, doors = [], mailboxes = [] }) {
  const sites = [], halls = [];
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const concrete = toon('#a9a59c'), concreteD = toon('#8a867e'), brick = toon('#b5653f'), yellow = toon('#e3b22e'), dark = toon('#2a2c30'), steel = toon('#8a9094'), orange = toon('#e3742e'), sandM = toon('#d9c38a'), wood = toon('#9e7a4f');
  const corr = cv(16, 8, g => { for (let x = 0; x < 16; x++) { g.fillStyle = x % 2 ? '#a3a8ac' : '#8f9498'; g.fillRect(x, 0, 1, 8); } }), corrM = c => { const t = corr.clone(); t.needsUpdate = true; t.repeat.set(6, 1); return toon(c, { map: t }); };
  const rollT = cv(8, 16, g => { for (let y = 0; y < 16; y++) { g.fillStyle = y % 2 ? '#c9c4ba' : '#b3aea4'; g.fillRect(0, y, 8, 1); } });
  const sign = (text, bg = '#e3b22e', fg = '#17181b') => { const t = cv(64, 16, g => { g.fillStyle = bg; g.fillRect(0, 0, 64, 16); g.fillStyle = fg; g.fillRect(0, 0, 64, 1); g.fillRect(0, 15, 64, 1); g.font = '8px PTPix'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, 32, 8.5); }); return new THREE.MeshBasicMaterial({ map: t }); };
  const grp = () => new THREE.Group();

  // ---------- a house going up: slab, pillars, the first floor's slab, walls half done, scaffolding on its front ----------
  function site(i, s) { const g = grp(), D = 8, W = 9, fx = s * D / 2;
    g.add(box(D + .6, .3, W + .6, concreteD, 0, .15, 0));
    for (const x of [-D / 2 + .2, D / 2 - .2]) for (const z of [-W / 2 + .2, 0, W / 2 - .2]) g.add(box(.35, 2.9, .35, concrete, x, 1.75, z));
    g.add(box(D, .25, W, concrete, 0, 3.3, 0)); if (rnd() < .6) for (const x of [-D / 2 + .2, D / 2 - .2]) for (const z of [-W / 2 + .2, W / 2 - .2]) g.add(box(.3, 1.6, .3, concrete, x, 4.2, z));
    // the walls: blocks laid part of the way, the back one higher
    g.add(box(.3, 2.6, W - .4, brick, -fx, 1.6, 0)); g.add(box(D - .4, 1 + rnd() * 1.2, .3, brick, 0, .9, -W / 2 + .2)); g.add(box(.3, .6 + rnd() * .8, W * .55, brick, fx, .6, -W * .2));
    // the scaffolding on the front: poles, planks at two heights, a ladder
    const sx = fx + s * 1.1; for (const z of [-W / 2, -W / 6, W / 6, W / 2]) g.add(box(.06, 5, .06, steel, sx, 2.5, z), box(.06, 5, .06, steel, sx + s * .9, 2.5, z));
    for (const y of [1.6, 3.4]) { g.add(box(.95, .06, W, wood, sx + s * .45, y, 0)); g.add(box(.04, .04, W, steel, sx + s * .9, y + .9, 0)); }
    for (let y = .3; y < 3.4; y += .35) g.add(box(.4, .04, .05, steel, sx + s * .45, y, W / 2 + .3));
    // before it: a heap of sand, the mixer, a pallet of blocks, the fence panels (a gap where the lorries go in), the sign
    const sand = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.1, 10), sandM); sand.position.set(fx + s * 3.6, .55, -W / 2 + 1.6); g.add(sand);
    const mix = grp(); const drum = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, .9, 10), orange); drum.rotation.z = .9; drum.position.y = 1; mix.add(drum, box(.9, .1, .6, dark, 0, .4, 0)); for (const x of [-.35, .35]) mix.add(box(.06, .45, .06, dark, x, .2, 0)); mix.position.set(fx + s * 3.4, 0, W / 2 - 1.2); g.add(mix);
    g.add(box(1, .6, 1, toon('#c9c4ba'), fx + s * 2.2, .35, 0)); g.add(box(1.1, .12, 1.1, wood, fx + s * 2.2, .06, 0));
    const fz = (n, z0) => { for (let k = 0; k < n; k++) { const z = z0 + k * 2.1; g.add(box(.04, 1.8, 2, toon('#9aa0a4', { transparent: true, opacity: .55 }), fx + s * 5, .95, z)); g.add(box(.5, .12, .25, concreteD, fx + s * 5, .06, z - 1)); } };
    fz(2, -W / 2); fz(2, W / 2 - 4.2);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2, .5), sign('TEREN BUDOWY')); sg.position.set(fx + s * 5.06, 1.4, 0); sg.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sg);
    put(g, i, s * (PAVE + 3 + D / 2), 0, 0); hit(g, { hx: D / 2 + .4, hz: W / 2 + .4, h: 5, kind: 'hard' }, i); hit(g, { hx: .5, hz: .4, h: 1.4, kind: 'hard' }, i, fx + s * 3.4, W / 2 - 1.2); zone(g, D / 2 + 6, W / 2 + 1);
    { g.updateMatrixWorld(true); const p = g.localToWorld(sand.position.clone()); puddles.push({ x: p.x, z: p.z, r: 1.4, mud: true }); }   // (the sand: it holds a wheel as mud does)
    sites.push({ g, i, s }); return g; }

  // ---------- a warehouse: a corrugated hall, the roller door to the road, a dock, pallets, a forklift ----------
  function warehouse(i, s) { const g = grp(), D = 11, W = 15, H = 6.2, fx = s * D / 2, wall = corrM(['#9aa0a4', '#8e9a8a', '#a8a090'][rnd() * 3 | 0]);
    g.add(box(D, H, W, wall, 0, H / 2, 0)); g.add(box(D + .4, .3, W + .4, toon('#5a5f66'), 0, H + .15, 0)); g.add(box(D + .02, .5, W + .02, toon('#cf5a3e'), 0, H - .6, 0));
    const door = box(.06, 3.6, 4.2, toon('#c9c4ba', { map: rollT }), fx + s * .03, 1.8 + .5, -2); g.add(door); g.add(box(.08, .2, 4.6, dark, fx + s * .05, 4.25, -2));
    g.add(box(1.6, 1, 5.2, concreteD, fx + s * .8, .5, -2)); g.add(box(.04, .9, .9, dark, fx + s * .05, 2, 4)); g.add(box(.06, 1, .6, toon('#3f5566'), fx + s * .04, 2.2, 4));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(4, .9), sign('MAGAZYN ' + (1 + (rnd() * 9 | 0)), '#34465a', '#f6f3ea')); sg.position.set(fx + s * .05, 5, 3); sg.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sg);
    // pallets before it (some stacked), a forklift with its forks down
    for (let k = 0; k < 4; k++) { const n = 1 + (rnd() * 3 | 0), x = fx + s * (2.4 + (k % 2) * 1.4), z = 2.5 + (k >> 1) * 1.4; for (let q = 0; q < n; q++) g.add(box(1.1, .14, 1.1, wood, x, .07 + q * .16, z)); if (rnd() < .5) g.add(box(.9, .6, .9, toon('#c9a96a'), x, .1 + n * .16 + .3, z)); }
    const fl = grp(); fl.add(box(1, .9, 1.6, yellow, 0, .7, 0), box(.9, .1, .9, dark, 0, 2.1, -.2)); for (const x of [-.4, .4]) fl.add(box(.06, 1.9, .06, dark, x, 1.15, -.2)); for (const x of [-.25, .25]) fl.add(box(.1, .05, 1, steel, x, .12, 1.25)); fl.add(box(.18, 2.2, .1, dark, 0, 1.1, .8));
    for (const x of [-.5, .5]) for (const z of [-.5, .5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .2, 10).rotateZ(Math.PI / 2), dark); w.position.set(x, .25, z); fl.add(w); }
    fl.position.set(fx + s * 3.2, 0, -5.5); fl.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(fl);
    put(g, i, s * (PAVE + 4 + D / 2), 0, 0); hit(g, { hx: D / 2 + .2, hz: W / 2, h: H, kind: 'hard' }, i); hit(g, { hx: .8, hz: 1, h: 2, kind: 'hard' }, i, fx + s * 3.2, -5.5); zone(g, D / 2 + 5, W / 2 + 1);
    // (the hall's office (its door by the sign): it takes the paper; a red letterbox on a post out by the pavement before it)
    g.updateMatrixWorld(true); { const n = new THREE.Vector3(s, 0, 0).transformDirection(g.matrixWorld).setY(0).normalize(), fp = g.localToWorld(new THREE.Vector3(fx, 0, 4)), hi = doors.length; doors.push({ p: fp.clone().addScaledVector(n, 2.6), n, done: false, i });
      const mb = grp(); mb.add(box(.08, 1.1, .08, dark, 0, .55, 0), box(.36, .32, .5, toon('#d23a2c'), 0, 1.25, 0), box(.37, .04, .3, dark, 0, 1.33, 0)); const flag = grp(); flag.add(box(.03, .22, .03, yellow, 0, .11, 0)); flag.position.set(.2, 1.3, .2); mb.add(flag);
      const io = i + Math.round(4 / ds); mb.userData.keep = true; put(mb, io, s * (PAVE + .5), 0, 0); const C = hit(mb, { hx: .2, hz: .26, h: 1.45, kind: 'hard' }, io); const M0 = { o: mb, i: io, side: s, flag, house: hi }; mailboxes.push(M0); things.push({ kind: 'mailbox', o: mb, mb: M0, C, side: s }); }
    halls.push({ g, i, s, hall: true }); return g; }

  // ---------- road works: one lane closed for ~30 m (barriers along it, cones tapering in, an excavator, a sign), the traffic round it ----------
  function works(i, sd) { const L = Math.round(30 / ds);
    for (let k = 0; k <= L; k += Math.round(4 / ds)) { const o = P.barrier(), ii = i + k; put(o.group, ii, sd * .4, 0, Math.PI / 2); hit(o.group, o.hit, ii); }
    for (const [k0, dir] of [[-Math.round(8 / ds), 1], [L + Math.round(8 / ds), -1]]) for (let n = 0; n < 4; n++) { const c = P.cone(), ii = i + k0 + dir * n * Math.round(2 / ds), d = sd * (3 - n * .7); put(c.group, ii, d, 0, 0); const C = hit(c.group, c.hit, ii); c.group.userData.keep = true; C.thing = { kind: 'cone', o: c.group, C, r: .18 }; things.push(C.thing); }
    for (let k = -8; k <= L + 8; k += 3) parked().push({ s: (i + k) * ds, d: sd * 2.2 });
    // the excavator: tracks, the cab, the boom, the bucket down in a hole
    const ex = grp(); for (const x of [-.8, .8]) ex.add(box(.5, .55, 3, dark, x, .28, 0)); ex.add(box(1.9, .9, 2, yellow, 0, 1.05, -.2), box(1, 1.1, 1, yellow, -.4, 2, -.4), box(.85, .7, .05, toon('#3f5566'), -.4, 2.1, .11));
    const boom = box(.25, .25, 2.6, yellow, .4, 2.2, 1.2); boom.rotation.x = -.5; ex.add(boom); const arm = box(.2, .2, 1.8, yellow, .4, 2.2, 2.9); arm.rotation.x = .9; ex.add(arm); ex.add(box(.7, .5, .5, dark, .4, .6, 3.4));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.2, 12).rotateX(-Math.PI / 2), toon('#5d4a30')); hole.position.set(.4, .02, 3.4); hole.userData.noShadow = true; ex.add(hole);
    const iE = i + Math.round(L / 2); put(ex, iE, sd * 2, 0, rnd() < .5 ? 0 : Math.PI); hit(ex, { hx: 1.2, hz: 2, h: 2.6, kind: 'hard' }, iE);
    // the sign before it: a red-rimmed triangle (a man digging), on a stand
    for (const k0 of [-Math.round(14 / ds), L + Math.round(14 / ds)]) { const st = grp(), tri = new THREE.Mesh(new THREE.CircleGeometry(.5, 3), new THREE.MeshBasicMaterial({ color: '#cf5a3e' })), in2 = new THREE.Mesh(new THREE.CircleGeometry(.36, 3), new THREE.MeshBasicMaterial({ color: '#f6f3ea' }));
      tri.rotation.z = Math.PI / 2; in2.rotation.z = Math.PI / 2; in2.position.z = .01; const ic = box(.08, .22, .02, dark, 0, -.05, .02); tri.add(in2, ic); tri.position.y = 1.5; st.add(tri, box(.06, 1.3, .06, steel, 0, .65, -.03));
      put(st, i + k0, sd * (track_SIGN), 0, k0 < 0 ? 0 : Math.PI); }
    return null; }
  const track_SIGN = 3.4;

  // ---------- a tower crane over the roofs: the mast (striped), the jib out one way, the weights the other, the cab, a hook on its line ----------
  function crane(i, d) { const g = grp(), Hm = 26 + rnd() * 8, Lj = 22 + rnd() * 6, red = toon('#cf5a3e');
    const lat = cv(4, 8, x => { x.fillStyle = '#e3b22e'; x.fillRect(0, 0, 4, 8); x.fillStyle = '#17181b'; for (let k = 0; k < 8; k++) x.fillRect(k % 4, k, 1, 1); }); lat.repeat.set(1, Hm / 2);
    g.add(box(1.4, Hm, 1.4, toon('#e3b22e', { map: lat }), 0, Hm / 2, 0)); g.add(box(2.6, .6, 2.6, concreteD, 0, .3, 0));
    const top = grp(); top.position.y = Hm; g.add(top); top.add(box(1, 1.6, Lj, toon('#e3b22e', { map: lat }), 0, .8, Lj / 2 - 2), box(1, 1, 8, toon('#e3b22e'), 0, .5, -6), box(1.6, 1.6, 2, concreteD, 0, .2, -9), box(1.4, 1.2, 1.4, red, .9, -.6, 0));
    top.add(box(.05, 9, .05, dark, 0, -4.5, Lj * .7)); top.add(box(.6, .5, .3, dark, 0, -9, Lj * .7)); top.rotation.y = rnd() * 6.28;
    put(g, i, d, 0, 0); return g; }

  return { site, warehouse, works, crane, sites, halls };
}
