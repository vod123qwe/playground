// The map as a little model of the land (drawn by the game's own pixel pipeline when the map is open): the regions as islands of
// blocks in their colours (a region still ahead grey, low, under clouds), on them what each region is (little houses, fields and red
// barns, cranes, town houses and a tower, woods round a lake, hills of stone), roads of sand between the stretches' points, a flag at
// each point (gold: done, white: open, grey: shut), the paperboy's pin where you are. The camera from above at a slant, swaying a touch.
// createDiorama({ THREE, toon, REGIONS, RC, PTS, links }) → { scene, camera, frame(rect, t, state), project(id) → { x, y }, at(x, y) }
//   rect: the land window on the screen (client px); state: { open(id), done(id), built(region), cur, sel }

export function createDiorama({ THREE, toon, REGIONS, RC, PTS }) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2a3440');
  scene.add(new THREE.HemisphereLight('#fff3dc', '#3a4048', 1.5)); const sun = new THREE.DirectionalLight('#ffffff', 1.5); sun.position.set(-20, 40, 25); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 400);
  const K = .2, X = x => (x - 160) * K, Z = y => (y - 90) * K;   // (the map's pixels to the model's metres)
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const regionAt = (x, y) => { let best = null, bd = 1e9; for (const r of REGIONS) { const c = RC[r.id], w = (hash(Math.floor(x / 6), Math.floor(y / 6)) - .5) * 26, d = (x - c[0]) ** 2 + ((y - c[1]) * 1.25) ** 2 + w * 30; if (d < bd) { bd = d; best = r; } } return best; };
  const lake = (x, y) => ((x - 232) / 22) ** 2 + ((y - 150) / 12) ** 2 < 1;
  const HGT = { peryferia: .5, wies: .6, peryferia2: .55, miasto: .7, las: .8, dalej: 1.6 };
  // ---------- the ground: a block every 4 map pixels, the region's colour, its edge a step lower; the lake's blocks water ----------
  const S = 4, cols = 320 / S, rows = 180 / S, cells = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i * S + S / 2, y = j * S + S / 2, r = regionAt(x, y), edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => regionAt(x + a * S, y + b * S) !== r);
    cells.push({ x, y, r, edge, water: lake(x, y) && r.id === 'las' || lake(x, y) }); }
  const box = new THREE.BoxGeometry(S * K * .98, 1, S * K * .98).translate(0, .5, 0), ground = new THREE.InstancedMesh(box, toon('#ffffff'), cells.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
  const topAt = c => c.water ? .25 : (HGT[c.r.id] || .5) * (c.edge ? .7 : 1) + (c.r.id === 'dalej' ? hash(c.x, c.y) * 1.2 : c.r.id === 'las' ? hash(c.x, c.y) * .2 : 0);
  cells.forEach((c, k) => { const h = topAt(c); m4.makeScale(1, h, 1).setPosition(X(c.x), 0, Z(c.y)); ground.setMatrixAt(k, m4); c.h = h; }); scene.add(ground);
  // ---------- what stands on each region (built once; tinted grey while the region is ahead) ----------
  const deco = new THREE.Group(); scene.add(deco); const byRegion = {}; for (const r of REGIONS) { byRegion[r.id] = new THREE.Group(); deco.add(byRegion[r.id]); }
  const M = {}; const mat = c => (M[c] ||= toon(c));
  const add = (rid, mesh, x, y, h0, rot = 0) => { mesh.position.set(X(x), h0, Z(y)); mesh.rotation.y = rot; mesh.castShadow = true; byRegion[rid].add(mesh); return mesh; };
  const house = (rid, x, y, h0, wall, roof, w = .7, d = .6, hh = .45) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat(wall)); b.position.y = hh / 2; g.add(b);
    const tri = new THREE.Shape(); tri.moveTo(-d / 2 - .05, 0); tri.lineTo(d / 2 + .05, 0); tri.lineTo(0, .3); tri.closePath(); const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: w + .08, bevelEnabled: false }).translate(0, 0, -(w + .08) / 2), mat(roof)); rf.rotation.y = Math.PI / 2; rf.position.y = hh; g.add(rf); return add(rid, g, x, y, h0, hash(x, y) * 6); };
  const tree = (rid, x, y, h0, c = '#3f7a3a', s = 1, cone = false) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(.08, .3 * s, .08).translate(0, .15 * s, 0), mat('#5a4030')));
    const cr = new THREE.Mesh(cone ? new THREE.ConeGeometry(.28 * s, .8 * s, 6) : new THREE.IcosahedronGeometry(.3 * s, 0), mat(c)); cr.position.y = (cone ? .65 : .5) * s; g.add(cr); return add(rid, g, x, y, h0); };
  const field = (rid, x, y, h0, c1, c2) => { const g = new THREE.Group(); for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1.4, .04, .17), mat(k % 2 ? c1 : c2)); st.position.set(0, .02, -.26 + k * .175); g.add(st); } return add(rid, g, x, y, h0, hash(x, y) * 3); };
  let n = 0; for (const c of cells) { if (c.water || c.edge) continue; const p = hash(c.x * 1.7, c.y * 2.3), rid = c.r.id, h0 = c.h;
    if (rid === 'peryferia') { if (p < .16) house(rid, c.x, c.y, h0, ['#e8dcc0', '#b7c29a', '#a9bccb', '#f0ece2'][n++ % 4], ['#8e3b2c', '#6d4a3a', '#5a5f66'][n % 3]); else if (p < .28) tree(rid, c.x, c.y, h0); }
    else if (rid === 'wies') { if (p < .2) field(rid, c.x, c.y, h0, '#d9b45a', '#c9a04a'); else if (p < .27) field(rid, c.x, c.y, h0, '#8a6038', '#6b4a2e'); else if (p < .31) house(rid, c.x, c.y, h0, '#9a3a2c', '#44484c', .9, .7, .4); else if (p < .36) house(rid, c.x, c.y, h0, '#e8e4dc', '#6d4a3a'); else if (p < .42) tree(rid, c.x, c.y, h0, '#4f7a3a', 1.2, true); }
    else if (rid === 'peryferia2') { if (p < .12) house(rid, c.x, c.y, h0, '#d8d4c8', '#5a5f66', .9, .5, .5); else if (p < .15) { const cr = new THREE.Group(); cr.add(new THREE.Mesh(new THREE.BoxGeometry(.08, 1.6, .08).translate(0, .8, 0), mat('#e3b83a'))); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, .06, .06), mat('#e3b83a')); arm.position.set(.4, 1.55, 0); cr.add(arm); add(rid, cr, c.x, c.y, h0, hash(c.y, c.x) * 6); } else if (p < .2) add(rid, new THREE.Mesh(new THREE.BoxGeometry(.9, .35, .6), mat('#8a8f98')), c.x, c.y, h0 + .17); }
    else if (rid === 'miasto') { if (p < .45) { const hh = .5 + hash(c.y, c.x) * 1.2; add(rid, new THREE.Mesh(new THREE.BoxGeometry(.65, hh, .65), mat(['#b8a090', '#d8c0a8', '#9a8a80', '#c0b0a0'][n++ % 4])), c.x, c.y, h0 + hh / 2); } else if (p < .47) { const t = new THREE.Group(); t.add(new THREE.Mesh(new THREE.BoxGeometry(.4, 2, .4).translate(0, 1, 0), mat('#c9b8a0'))); t.add(new THREE.Mesh(new THREE.ConeGeometry(.32, .7, 4).translate(0, 2.35, 0), mat('#3f6b5a'))); add(rid, t, c.x, c.y, h0); } }
    else if (rid === 'las') { if (p < .55) tree(rid, c.x, c.y, h0, ['#2f6a3a', '#3a7a42', '#355f31'][n++ % 3], .9 + hash(c.y, c.x) * .5, hash(c.x, 9) < .6); else if (p < .58) house(rid, c.x, c.y, h0, '#c98a4a', '#6d4a3a', .5, .4, .3); }
    else if (rid === 'dalej') { if (p < .25) add(rid, new THREE.Mesh(new THREE.ConeGeometry(.6 + hash(c.y, 3) * .5, 1 + hash(3, c.x) * 1.5, 5), mat(hash(c.x, 1) < .5 ? '#8a8f98' : '#7a7f88')), c.x, c.y, h0 + .5); } }
  // ---------- each region's landmarks (bigger than the rest): what the place is known for ----------
  const hAt = (x, y) => { const c = cells[Math.min(cells.length - 1, Math.floor(y / S) * cols + Math.floor(x / S))]; return c?.h || .5; };
  const L = (rid, x, y, g, rot = 0) => { g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return add(rid, g, x, y, hAt(x, y), rot); };
  const B = (w, h, d, c, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); o.position.set(x, y + h / 2, z); return o; };
  const grp = (...o) => { const g = new THREE.Group(); g.add(...o); return g; };
  const roofOn = (w, d, h, c, y) => { const tri = new THREE.Shape(); tri.moveTo(-d / 2 - .08, 0); tri.lineTo(d / 2 + .08, 0); tri.lineTo(0, h); tri.closePath(); const r = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: w + .1, bevelEnabled: false }).translate(0, 0, -(w + .1) / 2), mat(c)); r.rotation.y = Math.PI / 2; r.position.y = y; return r; };
  let mill = null;
  // peryferia: home (two floors, the hoop on its wall), Janusz's workshop (a wheel on its sign), the police station, the water tower
  L('peryferia', 36, 128, grp(B(1.3, 1.1, 1, '#e8dcc0'), roofOn(1.3, 1, .55, '#c23a2e', 1.1), B(.06, .5, .06, '#f6f3ea', .75, .9, 0), B(.3, .22, .04, '#f6f3ea', .75, 1.35, 0)), .4);
  { const w = grp(B(1.4, .7, .9, '#9a4a32'), B(1.5, .08, 1, '#5a5f66', 0, .7), B(.9, .3, .05, '#e3b83a', 0, .78, -.48)); const wh = new THREE.Mesh(new THREE.TorusGeometry(.22, .05, 6, 12), mat('#17181b')); wh.position.set(0, 1.35, -.45); w.add(wh); L('peryferia', 92, 132, w, .2); }
  L('peryferia', 74, 100, grp(B(1.1, .6, .8, '#f0ece2'), B(1.12, .12, .82, '#3d7be0', 0, .35), B(.1, .25, .1, '#3d7be0', .4, .6)), -.3);
  L('peryferia', 52, 104, grp(B(.12, 1.8, .12, '#9a9c9e', -.25, 0, -.25), B(.12, 1.8, .12, '#9a9c9e', .25, 0, .25), B(.12, 1.8, .12, '#9a9c9e', -.25, 0, .25), B(.12, 1.8, .12, '#9a9c9e', .25, 0, -.25), B(.9, .6, .9, '#c9cbc8', 0, 1.8), (() => { const c = new THREE.Mesh(new THREE.ConeGeometry(.6, .4, 8), mat('#5a5f66')); c.position.y = 2.6; return c; })()));
  // wieś: the windmill (its sails turning), the big red barn and its silo, haystacks, the shrine, a tractor on the road
  { const g = grp(B(.8, 1.6, .8, '#e8dcc0'), roofOn(.8, .8, .5, '#6d4a3a', 1.6)); mill = new THREE.Group(); mill.position.set(0, 1.5, -.45); for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.3, .03).translate(0, .65, 0), mat('#f6f3ea')); a.rotation.z = k * Math.PI / 2; mill.add(a); } g.add(mill); L('wies', 132, 40, g, .3); }
  L('wies', 168, 66, grp(B(1.8, .9, 1.2, '#9a3a2c'), roofOn(1.8, 1.2, .6, '#44484c', .9), (() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 1.8, 10), mat('#c9cbc8')); c.position.set(1.2, .9, 0); return c; })(), (() => { const c = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9a9c9e')); c.position.set(1.2, 1.8, 0); return c; })()), -.2);
  for (const [x, y] of [[140, 58], [144, 62], [158, 30], [162, 34]]) L('wies', x, y, grp((() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .4, 8), mat('#d9b45a')); c.position.y = .2; return c; })(), (() => { const c = new THREE.Mesh(new THREE.ConeGeometry(.3, .3, 8), mat('#c9a04a')); c.position.y = .55; return c; })()));
  L('wies', 120, 66, grp(B(.3, .6, .3, '#f0ece2'), (() => { const c = new THREE.Mesh(new THREE.ConeGeometry(.24, .3, 4), mat('#3f6b5a')); c.position.y = .75; return c; })(), B(.04, .25, .04, '#e3b83a', 0, .9)));
  L('wies', 152, 48, grp(B(.4, .3, .6, '#3f8a4a', 0, .12), B(.3, .3, .25, '#3f8a4a', 0, .42, -.12), B(.04, .4, .04, '#9a9c9e', .1, .45, .2)), 1);
  // druga strona: cranes, the Kurier's building with its sign, the railway with a train
  for (const [x, y, r] of [[186, 124, .4], [200, 140, -.8]]) { const c = grp(B(.12, 2.6, .12, '#e3b83a'), B(1.8, .1, .1, '#e3b83a', .6, 2.5), B(.04, .7, .04, '#5a5f66', 1.3, 1.85)); L('peryferia2', x, y, c, r); }
  L('peryferia2', 170, 120, grp(B(1.6, 1.4, 1, '#d8d4c8'), B(1.4, .3, .05, '#3d7be0', 0, 1.0, -.52), B(1.62, .08, 1.02, '#5a5f66', 0, 1.4)), .1);
  { const tr = new THREE.Group(); for (let k = 0; k < 18; k++) { const sl = B(.9, .04, .1, '#5a4a3a', 0, 0, k * .4 - 3.6); tr.add(sl); } tr.add(B(.05, .06, 7.4, '#9a9c9e', -.3, .03), B(.05, .06, 7.4, '#9a9c9e', .3, .03)); tr.add(B(.6, .5, 1.6, '#c23a2e', 0, .06, -1), B(.6, .45, 1.4, '#d8d4c8', 0, .06, .7)); L('peryferia2', 152, 130, tr, .05); }
  // miasto: the town hall with its tower, the church, blocks of flats
  L('miasto', 236, 80, grp(B(1.6, .9, 1.1, '#d8c0a8'), B(.5, 2.2, .5, '#c9b8a0', 0, .5), (() => { const c = new THREE.Mesh(new THREE.ConeGeometry(.4, .7, 4), mat('#3f6b5a')); c.position.y = 3.05; c.rotation.y = Math.PI / 4; return c; })(), B(.3, .3, .05, '#f6f3ea', 0, 2.2, -.26)), .2);
  L('miasto', 252, 64, grp(B(1, 1, 1.6, '#e8e4dc'), roofOn(1, 1.6, .7, '#8e3b2c', 1), B(.45, 2.4, .45, '#e8e4dc', 0, 0, .9), (() => { const c = new THREE.Mesh(new THREE.ConeGeometry(.3, 1, 6), mat('#44484c')); c.position.set(0, 2.9, .9); return c; })()), .5);
  for (const [x, y] of [[222, 92], [228, 98], [250, 92]]) L('miasto', x, y, grp(B(.8, 2, .6, '#b8b4aa'), ...[0, 1, 2, 3].map(k => B(.82, .04, .62, '#7a7f86', 0, .4 + k * .45))));
  // las: the lake's pier and a boat, tents, summer cabins
  L('las', 232, 140, grp(B(.3, .06, 1.6, '#9e7a4f', 0, .2)), 1.2); L('las', 238, 150, grp(B(.5, .12, .25, '#c23a2e', 0, .18)), .4);
  for (const [x, y, c] of [[262, 158, '#e3902a'], [266, 154, '#3d7be0'], [270, 160, '#9fd27a']]) L('las', x, y, grp((() => { const t = new THREE.Mesh(new THREE.ConeGeometry(.35, .45, 4), mat(c)); t.position.y = .22; t.rotation.y = Math.PI / 4; return t; })()));
  for (const [x, y] of [[284, 140], [290, 150]]) L('las', x, y, grp(B(.7, .45, .55, '#c98a4a'), roofOn(.7, .55, .35, '#6d4a3a', .45)), .7);
  // wzgórza: the quarry (a stepped pit), the lookout tower
  L('dalej', 296, 30, grp(B(1.6, .1, 1.2, '#9a968c'), B(1.2, .1, .8, '#7a7f88', 0, .1), B(.12, 2.2, .12, '#5a4030', .9, 0, .5), B(.5, .1, .5, '#5a4030', .9, 2.2, .5)));
  // ---------- the roads between the points; the flags; the pin ----------
  let REG = ''; const cellAt = (x, y) => cells[Math.max(0, Math.min(cells.length - 1, Math.floor(y / S) * cols + Math.floor(x / S)))], gAt = (x, y) => { const c = cellAt(x, y); return (c?.h || .5) * (c?.r.id === REG ? 1.25 : 1); };
  const ptAt = id => { const [x, y] = PTS[id]; return new THREE.Vector3(X(x), gAt(x, y) + .02, Z(y)); };
  const roads = new THREE.Group(); scene.add(roads); let roadKey = ''; const paths = {};
  const RM = { verge: mat('#17181b'), road: mat('#4a4e55'), dirt: mat('#b89a6a'), dash: mat('#f6f3ea'), gold: mat('#efc970'), shut: mat('#2a2c30'), shutHi: mat('#8a8f98'), sel: mat('#f6f3ea') };
  function buildRoads(links, st) { const key = st.reg + st.sel + links.map(([a, b]) => a + b + (st.open(b) ? 1 : 0) + (st.done(a) && st.done(b) ? 1 : 0)).join(); if (key === roadKey) return; roadKey = key; while (roads.children.length) roads.remove(roads.children[0]);
    for (const [a, b] of links) { if (!PTS[a] || !PTS[b]) continue; const [ax, ay] = PTS[a], [bx, by] = PTS[b], open = a === 'dom' || st.open(b), done = (a === 'dom' || st.done(a)) && st.done(b), rural = ['wies', 'las', 'dalej'].includes(cellAt(bx, by)?.r.id);
      // a gentle bend: the road leaves sideways a little, like a real one
      const L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L, bend = (hash(ax, by) - .5) * L * .25, at = t => [ax + (bx - ax) * t + nx * bend * Math.sin(Math.PI * t), ay + (by - ay) * t + ny * bend * Math.sin(Math.PI * t)];
      paths[a + b] = at; const n2 = Math.max(4, Math.ceil(L / 2.2)); let prev = null;
      for (let k = 0; k <= n2; k++) { const [x, y] = at(k / n2), q = new THREE.Vector3(X(x), gAt(x, y) + .04, Z(y)); if (prev) { const mid = prev.clone().lerp(q, .5), len = prev.distanceTo(q) + .06, yaw = Math.atan2(q.x - prev.x, q.z - prev.z);
          const seg = (w, h, m, dy) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), m); o.position.set(mid.x, Math.max(prev.y, q.y) + dy, mid.z); o.rotation.y = yaw; roads.add(o); return o; };
          const on = b === st.sel; if (!open) { if (k % 2) { seg(.34, .06, on ? RM.sel : RM.shutHi, 0); seg(.22, .08, RM.shut, .01); } }
          else { seg(on ? .8 : .66, .06, on ? RM.sel : RM.verge, 0); seg(.5, .07, rural ? RM.dirt : RM.road, .01); if (k % 2) { const d = seg(.1, .08, done ? RM.gold : RM.dash, .015); d.scale.z = .55; } } } prev = q; } } }
  const flags = {}; const flagM = { done: mat('#efc970'), open: mat('#f6f3ea'), shut: mat('#6a6f78'), home: mat('#c23a2e') };
  function flag(id) { if (flags[id]) return flags[id]; const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.2, .06).translate(0, .6, 0), mat('#2a2c30')); g.add(pole);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .03).translate(.25, 0, 0), flagM.open); cloth.position.y = 1.02; g.add(cloth);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.62, .66, .1, 12), flagM.open); rim.position.y = .05; const pad = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .12, 12), mat('#2a2c30')); pad.position.y = .07; g.add(rim, pad);
    g.position.copy(ptAt(id)); scene.add(g); return (flags[id] = { g, cloth, rim }); }
  const pin = new THREE.Group(); { const b = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .16), mat('#3d7be0')); b.position.y = .45; pin.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, .18), mat('#e3b08a')); h.position.y = .72; pin.add(h);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(.2, .07, .22), mat('#c23a2e')); cap.position.y = .84; pin.add(cap); const wheel = new THREE.Mesh(new THREE.TorusGeometry(.14, .03, 4, 10), mat('#1d1e21')); wheel.position.set(0, .16, .12); wheel.rotation.y = Math.PI / 2; pin.add(wheel); const w2 = wheel.clone(); w2.position.z = -.14; pin.add(w2); } scene.add(pin);
  // the clouds over what is ahead
  const clouds = new THREE.Group(); scene.add(clouds); for (const r of REGIONS) { const [x, y] = RC[r.id]; for (let k = 0; k < 6; k++) { const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(.9 + hash(k, x) * .8, 0), mat('#dfe4ea')); c2.position.set(X(x + (hash(k, y) - .5) * 40), 3.2 + hash(y, k) * 1.2, Z(y + (hash(x, k) - .5) * 26)); c2.userData.r = r.id; c2.userData.p = c2.position.clone(); clouds.add(c2); } }
  // ---------- what moves: clouds drifting over the whole land (and their shadows), a flock of birds, smoke from a few chimneys, little cars
  const sky = new THREE.Group(); scene.add(sky); const drift = [];
  for (let k = 0; k < 14; k++) { const g = new THREE.Group(); for (let j = 0; j < 3; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.7 + hash(k, j) * .6, 0), mat('#f6f6f2')); b.position.set(j * .9 - .9, hash(j, k) * .3, (hash(k * 3, j) - .5) * .6); g.add(b); }
    g.position.set((hash(k, 1) - .5) * 70, 4.5 + hash(k, 2) * 1.5, (hash(k, 3) - .5) * 38); g.userData.v = .4 + hash(k, 4) * .5; sky.add(g); drift.push(g); }
  const birds = []; for (let k = 0; k < 7; k++) { const g = new THREE.Group(); for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.32, .03, .1), mat('#17181b')); w.position.x = sd * .16; g.add(w); g.userData[sd] = w; } g.userData.o = new THREE.Vector3(-(k % 4) * .7, (k % 3) * .2, Math.abs(k - 3) * .6); sky.add(g); birds.push(g); }
  const smoke = []; { let k = 0; for (const c of cells) { if (k > 10 || c.edge || c.water || hash(c.x * 5, c.y * 7) > .05 || !['peryferia', 'wies', 'peryferia2'].includes(c.r.id)) continue; k++; for (let j = 0; j < 4; j++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.12, 0), mat('#d8d8d4')); p.userData = { x: X(c.x), z: Z(c.y), y0: c.h + .6, ph: j / 4 }; scene.add(p); smoke.push(p); } } }
  const carsOn = []; for (let k = 0; k < 6; k++) { const c = grp(B(.28, .14, .45, ['#c23a2e', '#3d7be0', '#efc970', '#3f8a4a'][k % 4]), B(.22, .1, .24, '#17181b', 0, .14, -.02)); scene.add(c); carsOn.push({ c, t: hash(k, 7), v: .04 + hash(k, 8) * .04, link: k }); }
  // ---------- each frame: the colours of what is shut or ahead, the flags, the pin, the camera to fit the land window ----------
  let tinted = ''; const focus = new THREE.Vector3();
  function frame(rect, t, st, links) { REG = st.reg; buildRoads(links, st);
    const key = REGIONS.map(r => st.built(r.id) ? 1 : 0).join() + st.reg; if (key !== tinted) { tinted = key; cells.forEach((c, k) => { const b = st.built(c.r.id), on = c.r.id === st.reg; col.set(c.water ? '#4f86a8' : c.r.col); if (!b) col.lerp(new THREE.Color('#7a7f88'), .7); else if (c.edge) col.multiplyScalar(on ? 1.15 : .8); if (!on) col.multiplyScalar(.62);
        ground.setColorAt(k, col); m4.makeScale(1, c.h * (on ? 1.25 : 1), 1).setPosition(X(c.x), 0, Z(c.y)); ground.setMatrixAt(k, m4); }); ground.instanceColor.needsUpdate = true; ground.instanceMatrix.needsUpdate = true;
      for (const r of REGIONS) byRegion[r.id].position.y = r.id === st.reg ? .12 : 0;
      for (const r of REGIONS) byRegion[r.id].traverse(o => { if (o.isMesh) { o.material = o.userData.m0 || (o.userData.m0 = o.material); if (!st.built(r.id)) o.material = mat('#8a8f98'); } }); }
    if (mill) mill.rotation.z = t * .0015;
    for (const g of drift) { g.position.x += g.userData.v * .016; if (g.position.x > 38) g.position.x = -38; }
    { const bt = (t * .00004) % 1, bx = -40 + bt * 80, bz = Math.sin(t * .0002) * 8 - 4; birds.forEach((g, k) => { g.position.set(bx + g.userData.o.x, 6 + g.userData.o.y + Math.sin(t * .003 + k) * .2, bz + g.userData.o.z); const f = Math.sin(t * .02 + k) * .5; g.userData[-1].rotation.z = f; g.userData[1].rotation.z = -f; }); }
    for (const p of smoke) { const u = ((t * .0004 + p.userData.ph) % 1); p.position.set(p.userData.x + u * .5, p.userData.y0 + u * 1.6, p.userData.z); p.scale.setScalar(.6 + u * 1.4); }
    { const L2 = links.filter(([a, b]) => PTS[a] && PTS[b]); carsOn.forEach(C => { const [a, b] = L2[C.link % L2.length] || []; if (!a) return; C.t = (C.t + C.v * .016) % 2; const u = C.t < 1 ? C.t : 2 - C.t, f = paths[a + b]; if (!f) return; const [x, y] = f(u), [x2, y2] = f(Math.min(1, u + .02)); C.c.position.set(X(x), gAt(x, y) + .16, Z(y)); C.c.rotation.y = Math.atan2(X(x2) - X(x), Z(y2) - Z(y)) + (C.t < 1 ? 0 : Math.PI); C.c.visible = st.open(b) || a === 'dom'; }); }
    for (const c2 of clouds.children) { c2.visible = !st.built(c2.userData.r); c2.position.x = c2.userData.p.x + Math.sin(t * .0003 + c2.userData.p.z) * .6; }
    for (const id of Object.keys(PTS)) { const F = flag(id), s = id === 'dom' ? 'home' : st.done(id) ? 'done' : st.open(id) ? 'open' : 'shut'; F.cloth.material = F.rim.material = flagM[s]; F.g.position.copy(ptAt(id)); F.cloth.rotation.y = Math.sin(t * .004 + F.g.position.x) * .3; F.g.scale.setScalar(id === st.sel ? 1.35 + Math.sin(t * .008) * .1 : 1); }
    const cp = ptAt(PTS[st.cur] ? st.cur : 'dom'); pin.position.set(cp.x + .45, cp.y + Math.abs(Math.sin(t * .006)) * .12, cp.z + .2); pin.rotation.y = t * .001;
    // the camera: from the south, up at a slant; the model's middle at the land window's middle, as big as fits it
    const Wd = innerWidth, Hd = innerHeight, cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, sway = Math.sin(t * .00025) * .08;
    // (close over the chosen point, flying on to the next one chosen: the model's houses and flags big enough to see)
    camera.aspect = Wd / Hd; const tilt = .66, tf = Math.tan(camera.fov * Math.PI / 360), rc = RC[st.reg] || RC.peryferia, sp = ptAt(PTS[st.sel] ? st.sel : 'dom'), want = new THREE.Vector3(X(rc[0]) * .55 + sp.x * .45, .6, Z(rc[1]) * .55 + sp.z * .45), view = Math.max(20, 30 / Math.max(.8, rect.width / rect.height)), dist = view / 2 / tf * (Hd / rect.height);
    focus.lerp(want, focus.lengthSq() ? .08 : 1); camera.position.set(focus.x + Math.sin(sway) * dist * Math.cos(tilt), focus.y + dist * Math.sin(tilt), focus.z + Math.cos(sway) * dist * Math.cos(tilt)); camera.lookAt(focus);
    camera.setViewOffset(Wd, Hd, Wd / 2 - cx, Hd / 2 - cy, Wd, Hd); camera.updateProjectionMatrix(); }
  const _v = new THREE.Vector3();
  function project(id) { if (!PTS[id]) return null; _v.copy(ptAt(id)); _v.y += 1.1; _v.project(camera); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight }; }
  function projectXY(x, y, h = 2) { _v.set(X(x), h, Z(y)); _v.project(camera); return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight }; }
  return { scene, camera, frame, project, projectXY };
}
