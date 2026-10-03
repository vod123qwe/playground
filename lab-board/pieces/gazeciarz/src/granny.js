// The old woman with a stick, modelled here (metres): hunched in a cardigan, a long skirt to her ankles, black shoes, a flowered
// headscarf knotted under her chin, glasses, a walking stick with a crook. Ride too far off the road, round the back of the
// houses, and she comes out of the nearest door after you, hobbling fast, stick up, shouting. Get back on the road and she gives
// up (a last shake of the stick) and goes home. Let her reach you off it and she has you: over you go.
// update(dt, R) → 'caught' the moment she gets him; R: { x, z, y, far (behind the houses), road (back on the road), busy (off his bike) }

export function createGranny({ THREE, toon, probe, doors }) {
  const skin = toon('#e7b68f'), cardi = toon('#6d7340'), cardiD = toon('#555a30'), skirt = toon('#5a3d27'), shoe = toon('#17181b'), stickM = toon('#7b5836'), glass = toon('#d3d0c3');
  const scarfT = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.fillStyle = '#b3392d'; x.fillRect(0, 0, 16, 16);   // red, with small flowers
    for (const [a, b] of [[2, 3], [9, 1], [13, 7], [5, 10], [11, 13], [1, 14]]) { x.fillStyle = '#efc970'; x.fillRect(a, b, 2, 2); x.fillStyle = '#f6f3ea'; x.fillRect(a + 1, b, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t; })();
  const scarf = toon('#ffffff'); scarf.map = scarfT;
  const taper = (r0, r1) => { const pts = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r0, Math.sin(a) * r0)); } for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r1, 1 + Math.sin(a) * r1)); } return new THREE.LatheGeometry(pts, 12); };
  const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  const span = (o, a, b) => { _d.subVectors(b, a); const L = _d.length(); o.position.copy(a); _q.setFromUnitVectors(_up, _d.divideScalar(L || 1)); o.quaternion.copy(_q); o.scale.set(1, L, 1); };
  const M = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; p.add(o); return o; };

  const G = new THREE.Group(); G.visible = false;
  // the skirt: a bell to the ankles; the feet under it
  const sk = M(new THREE.LatheGeometry([[.0, .1], [.25, .1], [.24, .3], [.2, .6], [.17, .82], [.0, .84]].map(([r, y]) => new THREE.Vector2(r, y)), 16), skirt, G);
  const feet = [-1, 1].map(s => { const f = M(new THREE.SphereGeometry(.055, 10, 8), shoe, G); f.scale.set(.8, .6, 1.6); f.position.set(s * .08, .04, .05); return f; });
  // the body, hunched forward from the hips: cardigan, buttons, the head in its scarf
  const body = new THREE.Group(); body.position.y = .82; G.add(body);
  { const g = new THREE.LatheGeometry([[.0, -.02], [.17, 0], [.19, .12], [.2, .3], [.18, .42], [.12, .47], [.0, .48]].map(([r, y]) => new THREE.Vector2(r, y)), 16); g.scale(1, 1, .8); M(g, cardi, body);
    for (let i = 0; i < 3; i++) { const b = M(new THREE.SphereGeometry(.014, 6, 4), cardiD, body); b.position.set(0, .1 + i * .11, .158); } }
  const head = new THREE.Group(); head.position.set(0, .56, .06); body.add(head);
  { const h = M(new THREE.SphereGeometry(.1, 16, 12), skin, head); h.scale.set(.95, 1.02, 1);
    const sc = M(new THREE.SphereGeometry(.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * .62), scarf, head); sc.rotation.x = -.5; sc.position.set(0, .01, -.01);   // over the top and the back, the face open
    const knot = M(new THREE.ConeGeometry(.05, .09, 6), scarf, head); knot.position.set(0, -.12, .04); knot.rotation.x = Math.PI;
    const tail = M(new THREE.ConeGeometry(.06, .16, 4), scarf, head); tail.position.set(0, -.1, -.1); tail.rotation.x = Math.PI + .5;   // the scarf's corner down her back
    const nose = M(new THREE.SphereGeometry(.022, 8, 6), skin, head); nose.position.set(0, -.01, .1);
    for (const s of [-1, 1]) { const r = M(new THREE.TorusGeometry(.028, .006, 4, 12), glass, head); r.position.set(s * .038, .02, .092); } }
  // arms: the right one on the stick, the left one up (a fist, shaking) when she shouts
  const arms = [-1, 1].map(s => { const up = M(taper(.04, .035), cardi, body), lo = M(taper(.035, .03), cardi, body), hand = M(new THREE.SphereGeometry(.035, 8, 6), skin, body); return { s, up, lo, hand }; });
  const stick = new THREE.Group(); G.add(stick);
  { const c = M(new THREE.CylinderGeometry(.013, .013, .88, 6), stickM, stick); c.position.y = .44;
    const crook = M(new THREE.TorusGeometry(.05, .013, 5, 10, Math.PI), stickM, stick); crook.position.set(0, .88, .05); crook.rotation.y = Math.PI / 2; }

  const st = { state: 'none', t: 0, x: 0, z: 0, yaw: 0, gait: 0, home: null, farT: 0, shoutT: 0, mouth: new THREE.Vector3(), hint: 0, shake: 0 };
  function pose(dt, moving, angry) {
    st.gait += dt * (moving ? 9 : 0); const g = st.gait, bob = moving ? Math.abs(Math.sin(g)) * .03 : 0;
    const q = probe(st.x, st.z, st.hint); st.hint = q.i; G.position.set(st.x, q.y + bob, st.z); G.rotation.y = st.yaw;
    sk.rotation.z = moving ? Math.sin(g) * .05 : 0; body.rotation.set(.5 + (angry ? -.15 : 0), 0, moving ? Math.sin(g) * .06 : 0);
    feet.forEach((f, i) => { const ph = g + i * Math.PI; f.position.z = .05 + (moving ? Math.sin(ph) * .12 : 0); f.position.y = .04 + (moving ? Math.max(0, Math.cos(ph)) * .04 : 0); });
    head.rotation.set(-.45 + (angry ? -.2 : 0), angry ? Math.sin(st.t * 17) * .12 : 0, 0);
    body.updateMatrix(); const inv = body.matrix.clone().invert(), toB = v => v.clone().applyMatrix4(inv);   // (G's space into the body's)
    // the stick: planted ahead with each step (the right hand on its crook), or up and shaking
    st.shake = angry ? Math.sin(st.t * 22) : 0;
    if (angry) { stick.position.set(-.26, 1.0, .25); stick.rotation.set(-2.2 + st.shake * .25, 0, -.3); }
    else { stick.position.set(-.26, 0, .25 + (moving ? Math.sin(g) * .1 : 0)); stick.rotation.set(-.12, 0, -.05); }
    stick.updateMatrix();
    for (const a of arms) {
      const sh = new THREE.Vector3(a.s * .17, .42, .02), hand = a.s < 0 ? toB(new THREE.Vector3(0, .86, .05).applyMatrix4(stick.matrix))   // (the right hand: on the crook)
        : angry ? new THREE.Vector3(.2, .72 + st.shake * .04, .2) : new THREE.Vector3(.16, .1, .1);                                      // (the left: a fist up, or at her side)
      const el = sh.clone().lerp(hand, .5).add(new THREE.Vector3(a.s * .08, -.05, -.04));
      span(a.up, sh, el); span(a.lo, el, hand); a.hand.position.copy(hand);
    }
    G.updateMatrixWorld(true); head.getWorldPosition(st.mouth); st.mouth.y += .25;
  }
  function go(tx, tz, speed, dt) {
    const dx = tx - st.x, dz = tz - st.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz), dy = Math.atan2(Math.sin(want - st.yaw), Math.cos(want - st.yaw));
    st.yaw += dy * Math.min(1, dt * 6); const s = Math.min(d, speed * dt * Math.max(0, Math.cos(dy))); st.x += Math.sin(st.yaw) * s; st.z += Math.cos(st.yaw) * s; return d;
  }
  // R: { x, z, far, road, busy, hint }; returns { event: 'caught' | 'shout' | null }
  function update(dt, R) {
    st.t += dt; let ev = null;
    if (st.state === 'none') {
      st.farT = R.far && !R.busy ? st.farT + dt : Math.max(0, st.farT - dt * 2);
      if (st.farT > .9) { let best = null, bd = 45; for (const d of doors) { const k = Math.hypot(d.p.x - R.x, d.p.z - R.z); if (k < bd) { bd = k; best = d; } }   // (out of the nearest door)
        if (best) { st.state = 'out'; st.t = 0; st.home = best.p.clone(); st.hint = -1; st.x = best.p.x; st.z = best.p.z; st.yaw = Math.atan2(R.x - st.x, R.z - st.z); st.shoutT = 0; G.visible = true; } }
      return ev;
    }
    if (st.state === 'out') {                                          // after him: hobbling, but quick about it
      st.shoutT -= dt; if (st.shoutT <= 0) { st.shoutT = 2.3; ev = 'shout'; }
      const d = go(R.x, R.z, 3.1, dt); pose(dt, true, true);
      if (R.road || st.t > 16) { st.state = 'give'; st.t = 0; }
      else if (d < .95 && !R.busy) { st.state = 'got'; st.t = 0; ev = 'caught'; }
      return ev;
    }
    if (st.state === 'give' || st.state === 'got') { pose(dt, false, true); if (st.t > (st.state === 'got' ? 2.6 : 1.4)) { st.state = 'home'; st.t = 0; } return ev; }   // (a last shake of the stick)
    if (st.state === 'home') { const d = go(st.home.x, st.home.z, 1.6, dt); pose(dt, true, false); if (d < .4) { st.state = 'none'; st.farT = 0; G.visible = false; } }
    return ev;
  }
  function kicked() { st.shoutT = 2.6; st.t = Math.min(st.t, 4); }        // (a kick: she only shouts back, and keeps coming)
  function reset() { st.state = 'none'; st.farT = 0; G.visible = false; }
  return { group: G, update, reset, kicked, mouth: st.mouth, get state() { return st.state; } };
}
