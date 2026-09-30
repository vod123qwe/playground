// The bag in the corner: the same canvas satchel he carries (bag.js), drawn over the picture, sticking up from the bottom right edge,
// its front to you. As papers go, fewer stand out of it: each one thrown slides down into the bag and is gone (nothing flies out, so it
// is not taken for the throw itself), the bag giving a small jolt; papers coming in rise up out of it and it bounces. Drawn by the pixel pass after the world (its own scene and camera, drawn small by the lens so it is in
// front), so it gets the same palette and outline as everything else.
// createHudBag({ THREE, toon, makeBag }) → { scene, camera, update(dt, papers, max, aspect, show) }
export function createHudBag({ THREE, toon, makeBag }) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, .1, 400);
  scene.add(new THREE.HemisphereLight('#fff4e0', '#5a6a7a', 1.4)); const sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.position.set(-2, 3, 4); scene.add(sun);
  const bag = makeBag({ THREE, toon }), hold = new THREE.Group(); hold.add(bag.group); scene.add(hold);
  bag.group.rotation.set(0, Math.PI / 2 - .32, .06);                          // (its front, the -x face, to you; turned a little, leaning)
  const P = bag.papers.map(p => ({ p, y0: p.position.y, k: 1 }));           // (k: 1 standing out, 0 sunk into the bag)
  let last = null, jolt = 0, joltV = 0, bounce = 0; const K = .05;
  function update(dt, papers, max, aspect, show) {
    hold.visible = show; if (!show) return;
    if (last !== null && papers < last) joltV -= 1.2;
    if (last !== null && papers > last) bounce = 1;
    last = papers;
    // each paper sinks into the bag (or rises out of it) towards what the count says
    const n = Math.round(Math.max(0, Math.min(1, max > 0 ? papers / max : 0)) * P.length);
    P.forEach((q, i) => { const want = i < n ? 1 : 0; q.k += Math.sign(want - q.k) * Math.min(Math.abs(want - q.k), dt * 4); q.p.visible = q.k > .02; q.p.position.y = q.y0 - (1 - q.k) * .17; });
    // a spring for the jolt, a decaying hop for the bounce
    joltV += (-jolt * 60 - joltV * 9) * dt; jolt += joltV * dt; bounce = Math.max(0, bounce - dt * 2.5);
    // where: the bottom right of the picture, the lower third of it under the edge
    camera.aspect = aspect; camera.updateProjectionMatrix();
    const z = -4, hh = -z * Math.tan(camera.fov * Math.PI / 360), hw = hh * aspect, H = bag.size.H;
    hold.position.set(hw - .26, -hh + H * .5 + jolt * .02 + Math.sin(bounce * Math.PI) * .04, z).multiplyScalar(K); hold.scale.setScalar(K); hold.rotation.z = jolt * .08;   // (K: all of it scaled down towards the lens, the same on the screen, nearer than anything in the world)
    api.left = (hw - .26 - .22) / hw * .5 + .5;                                  // (the bag's left edge, 0..1 across the picture: the count goes by it)
  }
  const api = { scene, camera, update, left: .85 }; return api;
}
