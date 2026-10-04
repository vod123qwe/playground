// Gazeciarz Express, Friday's boss: the Kurier Osiedlowy in a yellow van. It drives the street ahead of him and stops at the
// subscribers' houses with a parcel: a house it gets to first is taken (no paper there today, the readers cross). Caught up with, it
// throws parcels from its back doors: at him (a hit: off the bike) and so onto the road, where they lie a while (hop them or go round).
// A paper through its window: it brakes and the driver swears; a kick at its mirror as he rides alongside: it swerves onto the verge.
// Its roof can be ridden on (main's roofs), it can be hopped over. It turns off before the course: the course is his.
// createCourier({ THREE, toon, track, scene, cars, ds, wrap, pv, rnd }) → { V, update(dt, R, endS) → events, paper(Pp), kick(), talk() }
export function createCourier({ THREE, toon, track, scene, cars, ds, wrap, pv, rnd }) {
  const { S, N } = track, L = N * ds, hs = track.oneSide || -1, LANE = 1.7, CURB = track.ROAD - 1.25;
  const c = cars.makeCar('van', '#efc930'); c.group.visible = false; scene.add(c.group);
  // (its boards: KURIER on both sides of the box, a parcel drawn by it)
  { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const g = cv.getContext('2d'); g.fillStyle = '#17181b'; g.fillRect(0, 0, 64, 16); g.fillStyle = '#efc930'; g.font = '8px PTPix'; g.textAlign = 'center'; g.fillText('KURIER', 38, 11);
    g.fillStyle = '#b8803e'; g.fillRect(4, 4, 10, 8); g.fillStyle = '#e3c27a'; g.fillRect(8, 4, 2, 8); const T = new THREE.CanvasTexture(cv); T.magFilter = THREE.NearestFilter; T.colorSpace = THREE.SRGBColorSpace;
    for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .55), new THREE.MeshBasicMaterial({ map: T })); b.position.set(sd * (c.half[0] + .02), 1.45, -.5); b.rotation.y = sd * Math.PI / 2; c.group.add(b); } }
  c.group.updateMatrixWorld(true); const roofH = new THREE.Box3().setFromObject(c.group).max.y - c.group.position.y;
  const V = { on: false, done: false, s: 0, d: LANE, v: 0, stop: 0, stun: 0, swerve: 0, hitT: 0, throwT: 3, taken: 0, target: null, g: c.group, half: c.half, roofH, yaw: 0, yawIn: 0, car: c, who: null };
  const boxM = toon('#b8803e'), tapeM = toon('#e3c27a'), parcels = [];
  const along = (from, to) => ((((to - from) % L) + L * 1.5) % L) - L / 2;   // (how far ahead of `from` is `to`, along the road)
  function start(R) { V.on = true; V.done = false; V.s = ((R.s + 36) % L + L) % L; V.d = LANE; V.v = 6; V.stop = V.stun = V.swerve = V.hitT = 0; V.throwT = 3; V.taken = 0; V.target = null; c.group.visible = true;
    V.who = { g: c.group, x: 0, z: 0, kind: 'van', m: { paperT: 0 } }; return [{ kind: 'shout', p: { g: c.group }, text: 'Z DROGI, GAZECIARZU!' }, { kind: 'courier', text: 'Wyścig z kurierem! Abonent, do którego kurier dotrze pierwszy, jest przejęty. Gazeta w szybę go hamuje.' }]; }
  function end(ev) { V.on = false; V.done = true; c.group.visible = false; ev.push({ kind: 'courier', text: `Kurier zjechał w boczną. Przejął abonentów: ${V.taken}.` }); }
  function update(dt, R, endS) { const ev = []; if (!V.on) return ev; V.stun = Math.max(0, V.stun - dt); V.swerve = Math.max(0, V.swerve - dt); V.hitT = Math.max(0, V.hitT - dt);
    const rel = along(R.s ?? 0, V.s);                                   // (+: the van ahead of him)
    if (endS != null && along(V.s, endS) < 0) { end(ev); return ev; }
    // (its next stop: the nearest subscriber ahead of it, not yet served, short of the course)
    if (!V.target || V.target.done) { V.target = null; let best = 1e9; for (const d of track.doors) { if (!d.sub || d.done) continue; const ds0 = d.s0 ?? (d.s0 = track.probe(d.p.x, d.p.z, d.i ?? -1).s), a = along(V.s, ds0); if (a > 3 && a < 70 && a < best && (endS == null || along(ds0, endS) > 0)) { best = a; V.target = d; } } }
    // (its pace: braked, swerved, waiting for him when far ahead, hurrying when he is past it; its own lane the side away from the houses)
    let want = V.stun > 0 ? 2.5 : V.swerve > 0 ? 3 : rel > 55 ? 3 : rel < -8 ? 7.6 : 6.2, dWant = V.swerve > 0 ? -hs * (track.ROAD + .4) : -hs * LANE;
    // (far ahead of him: it pulls in and waits, taking nobody; a race, not a robbery behind his back)
    if (rel > 45) { want = 0; V.stop = 0; }
    else if (V.target) { const a = along(V.s, V.target.s0); if (a < 14) { dWant = hs * CURB; want = Math.min(want, Math.max(1.2, a * .6)); }
      if (a < 1.2 || V.stop > 0) { want = 0; V.stop += dt; if (V.stop > 1.4) { const d = V.target; d.done = true; d.taken = true; V.taken++; V.stop = 0; V.target = null; ev.push({ kind: 'taken', d, p: { g: c.group } }); } } }
    V.v += (want - V.v) * Math.min(1, dt * 2.2); V.s = ((V.s + V.v * dt) % L + L) % L; V.d += (dWant - V.d) * Math.min(1, dt * 1.6);
    const i = wrap(Math.round(V.s / ds)), A = S[i], p = pv(i, V.d); c.group.position.copy(p); V.yaw = V.yawIn = Math.atan2(A.f.x, A.f.z); c.group.rotation.y = V.yaw; cars.spin?.(c, V.v * dt);
    V.who.x = p.x; V.who.z = p.z;
    // (caught up with: parcels out of the back doors, at him; each lands and lies on the road a while)
    if (rel > 3 && rel < 26 && V.stun <= 0 && (V.throwT -= dt) <= 0) { V.throwT = 2.4 + rnd() * 1.8; const back = new THREE.Vector3(p.x - A.f.x * (c.half[1] + .2), p.y + 1.2, p.z - A.f.z * (c.half[1] + .2)), lead = rnd() < .6 ? .8 : 0;
      const tgt = new THREE.Vector3(R.x + Math.sin(R.yaw) * (R.v || 0) * lead, 0, R.z + Math.cos(R.yaw) * (R.v || 0) * lead), m = new THREE.Group(); m.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .36, .42), boxM)); const t1 = new THREE.Mesh(new THREE.BoxGeometry(.1, .37, .43), tapeM); m.add(t1);
      m.position.copy(back); scene.add(m); parcels.push({ m, from: back, to: tgt, t: 0, T: .85, lie: 0, C: null }); ev.push({ kind: 'shout', p: { g: c.group }, text: ['ŁAP PACZKĘ!', 'PRZESYŁKA!', 'DORĘCZONE!'][rnd() * 3 | 0] }); }
    for (let k = parcels.length - 1; k >= 0; k--) { const P = parcels[k];
      if (P.t < P.T) { P.t += dt; const u = Math.min(1, P.t / P.T), gy = track.probe(P.to.x, P.to.z, i).y; P.m.position.set(P.from.x + (P.to.x - P.from.x) * u, P.from.y + (gy + .18 - P.from.y) * u + Math.sin(Math.PI * u) * 1.6, P.from.z + (P.to.z - P.from.z) * u); P.m.rotation.x += dt * 6;
        if (u >= 1) { P.m.rotation.set(0, rnd() * 6, 0); const q = track.probe(P.m.position.x, P.m.position.z, i);
          if (Math.hypot(R.x - P.m.position.x, R.z - P.m.position.z) < .95 && (R.h || 0) < .7 && !R.foot) ev.push({ kind: 'parcelHit', p: { g: P.m } });
          P.C = track.addHit(P.m, { hx: .27, hz: .23, h: .38, kind: 'hard' }, q.i); } }
      else if ((P.lie += dt) > 14 || Math.abs(along(R.s ?? 0, track.probe(P.m.position.x, P.m.position.z, i).s)) > 120) { if (P.C) track.dropHit(P.C); scene.remove(P.m); parcels.splice(k, 1); } }
    // (into its side, not over it: off the bike)
    { const dx = R.x - p.x, dz = R.z - p.z, lx = dx * Math.cos(V.yaw) - dz * Math.sin(V.yaw), lz = dx * Math.sin(V.yaw) + dz * Math.cos(V.yaw);
      if (!R.foot && !V.hitT && !((R.h || 0) > roofH - .32) && Math.abs(lx) < c.half[0] + .3 && Math.abs(lz) < c.half[1] + .3) { V.hitT = 2; ev.push({ kind: 'vanHit', p: { g: c.group } }); } }
    return ev; }
  function clear() { for (const P of parcels) { if (P.C) track.dropHit(P.C); scene.remove(P.m); } parcels.length = 0; V.on = false; V.done = false; c.group.visible = false; }
  // (a paper on it: through the window, the van brakes)
  function paper(Pp) { if (!V.on || Math.hypot(V.g.position.x - Pp.x, V.g.position.z - Pp.z) > 2.4) return null; V.stun = 2.6;
    return { p: { g: c.group }, text: ['EJ! MOJA SZYBA!', 'GAZECIARZU, POŻAŁUJESZ!', 'NIC NIE WIDZĘ!'][rnd() * 3 | 0], who: 'driver', pts: 3, label: 'W SZYBĘ KURIERA! +3' }; }
  function kick() { V.swerve = 3; return ['MOJE LUSTERKO!', 'TY ŁOBUZIE!', 'ZGŁOSZĘ CIĘ DO REDAKCJI!'][rnd() * 3 | 0]; }
  return { V, start, update, clear, paper, kick, talk: () => 'NIE MAM CZASU, MAM PACZKI!' };
}
