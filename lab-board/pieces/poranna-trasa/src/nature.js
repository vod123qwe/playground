// What grows and lies about, made with care: tufts of grass (blades that bend, dark at the root, lit at the tip), bushes of a few kinds
// (a round one of clumps with leaves at its edge, a clipped box, one in flower, a fern of fronds, tall ornamental grass), clumps of
// flowers (tulips, daisies, lupins, sunflowers), stones (lumpy, faceted, moss on their tops), a heap of leaves (each leaf its own,
// autumn colours, a few blown about it, now and then the rake), and a small pond (an uneven shore of mud, water with pixel glints,
// stones round it, reeds with their brown heads, lily pads and a flower on one).
// createNature({ THREE, toon, tex }) → { grassTuft, bush, flowers, rocks, leaves, pond, KINDS }   (each (r, kind?) → { group, hit })
export function createNature({ THREE, toon, tex }) {
  // one material per colour (and options), shared: so the merge makes a few meshes of it all, not one per flower
  const TC = new Map(), tc = (c, o = {}) => { const k = c + '|' + Object.keys(o).map(q => q + ':' + (o[q]?.uuid || o[q])).join(','); if (!TC.has(k)) TC.set(k, toon(c, o)); return TC.get(k); };
  const R = (a, b, r) => a + (b - a) * r(), C = h => new THREE.Color(h);
  const cvT = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const vcM = tc('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), vcFlat = tc('#ffffff', { vertexColors: true, flatShading: true });
  // blades: a strip from the root to the tip, bent over; coloured root to tip; lit as the ground (normals up), so no dark backs
  function blades(g, n, opt, r) { const pos = [], col = [], nor = [], idx = []; let v = 0;
    for (let k = 0; k < n; k++) { const a = r() * 6.283, rr = Math.sqrt(r()) * opt.spread, bx = Math.cos(a) * rr, bz = Math.sin(a) * rr, h = R(opt.h[0], opt.h[1], r), lean = R(.15, opt.lean, r), la = a + R(-.8, .8, r), w = opt.w * R(.7, 1.2, r);
      const lo = C(opt.lo), hi = C(opt.hi).lerp(C(opt.tip || opt.hi), r() * .6), sx = -Math.sin(la), sz = Math.cos(la), SEG = 4;
      for (let s = 0; s <= SEG; s++) { const t = s / SEG, cx = bx + Math.cos(la) * lean * h * t * t, cz = bz + Math.sin(la) * lean * h * t * t, cy = h * t * (1 - lean * .25 * t), ww = w * (1 - t * .92);
        for (const sd of [-1, 1]) { pos.push(cx + sx * ww * sd, cy, cz + sz * ww * sd); const c = lo.clone().lerp(hi, Math.min(1, t * 1.25)); col.push(c.r, c.g, c.b); nor.push(0, 1, 0); }
        if (s) idx.push(v - 2, v - 1, v, v - 1, v + 1, v); v += 2; }
      if (opt.head && r() < opt.head.p) { const hd = new THREE.Mesh(new THREE.CylinderGeometry(opt.head.r, opt.head.r, opt.head.l, 6), tc(opt.head.c)); hd.position.set(bx + Math.cos(la) * lean * h, h * (1 - lean * .25) + opt.head.l * .3, bz + Math.sin(la) * lean * h); g.add(hd); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, vcM); g.add(m); return m; }
  const GRASS = { lo: '#3d5a24', hi: '#8fb04a', tip: '#c8cf72' };
  function grassTuft(r, kind = 'lawn') { const g = new THREE.Group();
    if (kind === 'tall') blades(g, 34, { spread: .28, h: [.7, 1.2], lean: .5, w: .03, lo: '#4f5a2a', hi: '#b7a860', tip: '#e2d08a' }, r);          // ornamental: tall, straw-coloured at the tips
    else if (kind === 'reeds') blades(g, 16, { spread: .35, h: [.9, 1.5], lean: .18, w: .025, lo: '#3a5a2a', hi: '#6f8a3c', head: { p: .5, r: .03, l: .16, c: '#6b4a2e' } }, r);   // with their brown heads
    else blades(g, 14 + (r() * 10 | 0), { spread: .16, h: [.18, .42], lean: .6, w: .022, ...GRASS }, r);
    return { group: g, hit: null }; }
  // lumps of foliage: an icosahedron shaken out of round, its faces toned by where they face (lit above, shaded below), a little
  // dither of darker faces in it
  const lump = (rad, cs, r, jit = .22) => { const geo = new THREE.IcosahedronGeometry(rad, 1).toNonIndexed(), p = geo.attributes.position, key = v => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`, off = new Map(), v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = key(v); if (!off.has(k)) off.set(k, 1 + (r() - .5) * jit * 2); v.multiplyScalar(off.get(k)); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); const col = new Float32Array(p.count * 3), n = new THREE.Vector3(), lo = C(cs[0]), mid = C(cs[1]), hi = C(cs[2]);
    for (let f = 0; f < p.count; f += 3) { n.fromBufferAttribute(geo.attributes.normal, f); const c = (n.y > .35 ? mid.clone().lerp(hi, n.y) : lo.clone().lerp(mid, (n.y + 1) / 1.35)); if (r() < .12) c.multiplyScalar(.8);
      for (let q = 0; q < 3; q++) { col[(f + q) * 3] = c.r; col[(f + q) * 3 + 1] = c.g; col[(f + q) * 3 + 2] = c.b; } }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return new THREE.Mesh(geo, vcFlat); };
  const cardM = tc('#6f9a45', { map: tex.leafCard(3), alphaTest: .5, side: THREE.DoubleSide });
  const cards = (g, n, cx, cy, cz, rx, ry, m, r) => { for (let k = 0; k < n; k++) { const a = r() * 6.283, y = R(-.3, .9, r), q = Math.sqrt(1 - y * y), c = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), m); c.position.set(cx + Math.cos(a) * q * rx, cy + y * ry, cz + Math.sin(a) * q * rx); c.lookAt(cx + Math.cos(a) * q * rx * 3, cy + y * ry * 3, cz + Math.sin(a) * q * rx * 3); c.rotateZ(r() * 6); g.add(c); } };
  const BUSH = { round: ['#2f4f23', '#467537', '#7fae58'], box: ['#23401f', '#355f31', '#5b8a3c'], flower: ['#2f4f23', '#4f7a3a', '#86b35a'] };
  function bush(r, kind = 'round') { const g = new THREE.Group();
    if (kind === 'box') { const b = lump(.5, BUSH.box, r, .06); b.scale.set(1.5, .9, 1); b.position.y = .45; g.add(b); const t = lump(.42, BUSH.box, r, .08); t.scale.set(1.3, .5, .85); t.position.y = .82; g.add(t); return { group: g, hit: { hx: .7, hz: .5, h: 1, kind: 'soft' } }; }   // clipped: a low block, a flat top
    if (kind === 'fern') { const pos = [], col = [], nor = [], idx = []; let v = 0; const lo = C('#2f4f23'), hi = C('#8fb04a');
      for (let k = 0; k < 11; k++) { const a = k / 11 * 6.283 + r() * .3, L = R(.5, .85, r), sx = -Math.sin(a), sz = Math.cos(a);
        for (let s = 0; s <= 8; s++) { const t = s / 8, x = Math.cos(a) * L * t, z = Math.sin(a) * L * t, y = .95 * L * Math.sin(t * 2.2) * (1 - t * .45), w = .12 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (s % 2 ? 1.25 : .7);   // (leaflets: a zigzag edge)
          for (const sd of [-1, 1]) { pos.push(x + sx * w * sd, y, z + sz * w * sd); const c = lo.clone().lerp(hi, t); col.push(c.r, c.g, c.b); nor.push(0, 1, 0); }
          if (s) idx.push(v - 2, v - 1, v, v - 1, v + 1, v); v += 2; } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx); g.add(new THREE.Mesh(geo, vcM)); return { group: g, hit: null }; }
    if (kind === 'tall') return grassTuft(r, 'tall');
    const cs = BUSH[kind] || BUSH.round, n = 11 + (r() * 5 | 0);                                        // round (and in flower): many small clumps in a dome, leaves all over its edge
    for (let k = 0; k < n; k++) { const a = r() * 6.283, u = r(), d = Math.sqrt(u) * .55, m = lump(R(.19, .3, r), cs, r, .3); m.position.set(Math.cos(a) * d, .22 + (1 - u) * .5 + r() * .12, Math.sin(a) * d); g.add(m); }
    cards(g, 28, 0, .45, 0, .7, .45, cardM, r);
    if (kind === 'flower') { const bl = [tc('#f3a6c0'), tc('#f6f3ea'), tc('#e0503f')][r() * 3 | 0]; for (let k = 0; k < 40; k++) { const a = r() * 6.283, y = R(-.1, .9, r), q = Math.sqrt(1 - y * y), f = new THREE.Mesh(new THREE.SphereGeometry(.035, 5, 4), bl); f.position.set(Math.cos(a) * q * .66, .45 + y * .42, Math.sin(a) * q * .66); g.add(f); } }
    return { group: g, hit: { hx: .6, hz: .6, h: 1, kind: 'soft' } }; }
  // flowers in a clump: stems, a few leaves, heads as they are
  const stemM = tc('#4f7a3a');
  function flowers(r, kind = 'daisy') { const g = new THREE.Group(), n = kind === 'sunflower' ? 3 + (r() * 3 | 0) : 8 + (r() * 8 | 0);
    blades(g, kind === 'sunflower' ? 8 : 10, { spread: .18, h: [.12, .3], lean: .7, w: .035, lo: '#2f4f23', hi: '#6f9a45' }, r);   // (leaves at the foot)
    const headC = { tulip: ['#e0503f', '#f2c33a', '#f3a6c0', '#b3372c'], daisy: ['#fbf7ea'], lupin: ['#9a6fc4', '#f3a6c0', '#6f7fd0'], sunflower: ['#f2c33a'] }[kind];
    for (let k = 0; k < n; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * (kind === 'sunflower' ? .3 : .22), h = kind === 'sunflower' ? R(1.2, 1.7, r) : kind === 'lupin' ? R(.45, .7, r) : kind === 'tulip' ? R(.3, .45, r) : R(.15, .3, r), x = Math.cos(a) * d, z = Math.sin(a) * d, col = tc(headC[r() * headC.length | 0]);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(kind === 'sunflower' ? .02 : .006, kind === 'sunflower' ? .025 : .008, h, 4), stemM); st.position.set(x, h / 2, z); st.rotation.set(R(-.12, .12, r), 0, R(-.12, .12, r)); g.add(st);
      if (kind === 'tulip') { const c = new THREE.Mesh(new THREE.CylinderGeometry(.045, .025, .08, 6), col); c.position.set(x, h + .03, z); g.add(c); }
      if (kind === 'daisy') { const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .01, 8), col); p.position.set(x, h, z); p.rotation.set(R(-.4, .4, r), 0, R(-.4, .4, r)); g.add(p); const e = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .016, 6), tc('#f2c33a')); e.position.set(x, h + .006, z); g.add(e); }
      if (kind === 'lupin') for (let q = 0; q < 7; q++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.028 * (1 - q * .09), 5, 4), col); b.position.set(x, h - .18 + q * .035, z); g.add(b); }
      if (kind === 'sunflower') { const hd = new THREE.Group(); hd.position.set(x, h, z); hd.rotation.set(-.9 + R(-.2, .2, r), a, 0); g.add(hd); hd.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .03, 12), col)); const eye = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .04, 10), tc('#5a3a24')); eye.position.y = .01; hd.add(eye);
        const lf = new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), tc('#4f7a3a', { side: THREE.DoubleSide })); lf.position.set(x + .1, h * .55, z); lf.rotation.set(-1, a, 0); g.add(lf); } }
    return { group: g, hit: null }; }
  // stones: lumps, faceted, grey with moss on their tops; one to a few
  const STONE = ['#5d5a55', '#8d8a82', '#b6b2a6'];
  function rocks(r, n = 1 + (r() * 4 | 0)) { const g = new THREE.Group(), moss = C('#5b7a34');
    for (let k = 0; k < n; k++) { const s = R(.12, k ? .3 : .5, r), m = lump(s, STONE, r, .32); m.scale.y = R(.45, .7, r); const a = r() * 6.283, d = k ? R(.3, .8, r) : 0; m.position.set(Math.cos(a) * d, s * m.scale.y * .5, Math.sin(a) * d); m.rotation.y = r() * 6;
      const cl = m.geometry.attributes.color, nm = m.geometry.attributes.normal; for (let i = 0; i < cl.count; i += 3) if (nm.getY(i) > .7 && r() < .35) for (let q = 0; q < 3; q++) cl.setXYZ(i + q, moss.r, moss.g, moss.b); g.add(m); }
    return { group: g, hit: n && r() < 2 ? { hx: .45, hz: .45, h: .4, kind: 'hard' } : null }; }
  // a heap of leaves: each leaf a small card of its own, autumn colours, heaped and a few blown about it; the rake leant on it, now and then
  const leafT = cvT(8, 8, g => { g.fillStyle = '#fff'; for (const [x, y, w] of [[3, 0, 2], [2, 1, 4], [1, 2, 6], [1, 3, 6], [1, 4, 6], [2, 5, 4], [3, 6, 2], [3, 7, 1]]) g.fillRect(x, y, w, 1); g.fillStyle = '#bbb'; g.fillRect(4, 1, 1, 6); });
  const LEAF = ['#b86a2e', '#cf5a3e', '#e3a03a', '#8e3b2c', '#c9a063'].map(c => tc(c, { map: leafT, alphaTest: .5, side: THREE.DoubleSide }));
  function leaves(r) { const g = new THREE.Group(), base = lump(.55, ['#5a3a24', '#7a4a2a', '#9a5a30'], r, .2); base.scale.set(1, .32, .85); base.position.y = .06; g.add(base); const lg = new THREE.PlaneGeometry(.15, .15);
    for (let k = 0; k < 150; k++) { const a = r() * 6.283, d = Math.pow(r(), .7) * (k < 125 ? .58 : 1.3), h = k < 125 ? Math.max(.03, .2 * (1 - d / .62)) + r() * .05 : .012, l = new THREE.Mesh(lg, LEAF[r() * LEAF.length | 0]);
      l.position.set(Math.cos(a) * d, h, Math.sin(a) * d * .85); l.rotation.set(-Math.PI / 2 + R(-.6, .6, r), R(-.6, .6, r), r() * 6); g.add(l); }
    if (r() < .4) { const rk = new THREE.Group(), wood = tc('#9e7a4f'), metal = tc('#8d9194'); const hnd = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.5, 5), wood); hnd.position.y = .75; rk.add(hnd); const hd = new THREE.Mesh(new THREE.BoxGeometry(.45, .03, .03), metal); hd.position.y = .02; rk.add(hd); rk.position.set(.45, .05, 0); rk.rotation.z = .5; g.add(rk); }
    return { group: g, hit: null }; }
  // a small pond: an uneven shore (mud round the water), water with glints, stones about it, reeds, lily pads and a flower
  const waterT = cvT(16, 16, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#dce8ec'; for (let k = 0; k < 6; k++) g.fillRect((k * 5) % 16, (k * 7) % 16, 3, 1); g.fillStyle = '#c3d5dc'; for (let k = 0; k < 10; k++) g.fillRect((k * 11) % 16, (k * 3) % 16, 1, 1); });
  waterT.repeat.set(1.2, 1.2);
  const waterM = tc('#4f7f94', { map: waterT }), mudM = tc('#5a4430'), padM = tc('#4f7a3a', { side: THREE.DoubleSide });
  function pond(r) { const g = new THREE.Group(), Rw = R(1.6, 2.6, r), n = 18, wav = [...Array(4)].map(() => [R(.05, .16, r), r() * 6, 2 + (r() * 4 | 0)]);
    const shape = k => { const s = new THREE.Shape(); for (let q = 0; q <= n; q++) { const a = q / n * 6.283, rr = Rw * k * (1 + wav.reduce((acc, [am, ph, f]) => acc + am * Math.sin(a * f + ph), 0)); if (q) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * .72); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * .72); } return s; };
    const mud = new THREE.Mesh(new THREE.ShapeGeometry(shape(1.12)).rotateX(-Math.PI / 2), mudM); mud.position.y = .015; g.add(mud);
    const wg = new THREE.ShapeGeometry(shape(1)).rotateX(-Math.PI / 2), uv = wg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .5, uv.getY(i) * .5);
    const w = new THREE.Mesh(wg, waterM); w.position.y = .03; w.userData.water = true; g.add(w);
    for (let k = 0; k < 12; k++) { const a = r() * 6.283, s = rocks(r, 1).group; s.scale.setScalar(R(.35, .6, r)); s.position.set(Math.cos(a) * Rw * 1.12, 0, Math.sin(a) * Rw * .8); g.add(s); }
    for (let k = 0; k < 3; k++) { const a = r() * 6.283, t = grassTuft(r, 'reeds').group; t.position.set(Math.cos(a) * Rw * .95, 0, Math.sin(a) * Rw * .68); g.add(t); }
    for (let k = 0; k < 5; k++) { const a = r() * 6.283, d = R(.2, .75, r) * Rw, p = new THREE.Mesh(new THREE.CircleGeometry(R(.12, .2, r), 10, .5, 5.7).rotateX(-Math.PI / 2), padM); p.position.set(Math.cos(a) * d, .04, Math.sin(a) * d * .7); p.rotation.y = r() * 6; g.add(p);
      if (k === 0) { const fl = new THREE.Mesh(new THREE.ConeGeometry(.05, .06, 6), tc('#f3a6c0')); fl.position.set(p.position.x, .07, p.position.z); g.add(fl); } }
    return { group: g, hit: null, radius: Rw * 1.2 }; }
  const KINDS = { 'kępa trawy': r => grassTuft(r), 'trawa ozdobna': r => grassTuft(r, 'tall'), 'trzcina': r => grassTuft(r, 'reeds'), 'krzak kulisty': r => bush(r, 'round'), 'bukszpan': r => bush(r, 'box'), 'krzak kwitnący': r => bush(r, 'flower'), 'paproć': r => bush(r, 'fern'),
    'tulipany': r => flowers(r, 'tulip'), 'stokrotki': r => flowers(r, 'daisy'), 'łubiny': r => flowers(r, 'lupin'), 'słoneczniki': r => flowers(r, 'sunflower'), 'kamienie': r => rocks(r, 4), 'głaz': r => rocks(r, 1), 'sterta liści': r => leaves(r), 'staw': r => pond(r) };
  return { grassTuft, bush, flowers, rocks, leaves, pond, KINDS, waterT, mats: [vcM, vcFlat] };
}
