// The bag in the corner: the same canvas satchel he carries (bag.js), drawn over the picture, sticking up from the bottom right edge,
// its front to you. As papers go, fewer stand out of it; each throw sends a roll flying up out of it and the bag gives a jolt; papers
// coming in (a bundle picked up) make it bounce. Drawn by the pixel pass after the world (its own scene and camera, the depth cleared
// between), so it gets the same palette and outline as everything else.
// createHudBag({ THREE, toon, makeBag }) → { scene, camera, update(dt, papers, max, aspect, show) }
export function createHudBag({ THREE, toon, makeBag }) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, .1, 400);
  scene.add(new THREE.HemisphereLight('#fff4e0', '#5a6a7a', 1.4)); const sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.position.set(-2, 3, 4); scene.add(sun);
  const bag = makeBag({ THREE, toon }), hold = new THREE.Group(); hold.add(bag.group); scene.add(hold);
  bag.group.rotation.set(0, Math.PI / 2 - .32, .06);                          // (its front, the -x face, to you; turned a little, leaning)
  const paperM = toon('#ece5d0'), bandM = toon('#b3372c'), flying = [];
  let last = null, jolt = 0, joltV = 0, bounce = 0;
  function fly() { const g = new THREE.Group(), r = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, .16, 10), paperM), b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .022, 10), bandM);
    b.position.y = .03; g.add(r, b); g.position.set(-.04 + Math.random() * .08, bag.size.H / 2 + .08, 0); hold.add(g);
    flying.push({ g, vx: -.9 - Math.random() * .5, vy: 1.6 + Math.random() * .4, sp: (Math.random() < .5 ? -1 : 1) * (9 + Math.random() * 5), t: 0 }); }
  function update(dt, papers, max, aspect, show) {
    hold.visible = show; if (!show) return;
    if (last !== null && papers < last) { for (let k = 0; k < Math.min(3, last - papers); k++) fly(); joltV -= 2.4; }
    if (last !== null && papers > last) bounce = 1;
    last = papers; bag.setFill(max > 0 ? papers / max : 0);
    // a spring for the jolt, a decaying hop for the bounce
    joltV += (-jolt * 60 - joltV * 9) * dt; jolt += joltV * dt; bounce = Math.max(0, bounce - dt * 2.5);
    // where: the bottom right of the picture, the lower third of it under the edge
    camera.aspect = aspect; camera.updateProjectionMatrix();
    const z = -4, hh = -z * Math.tan(camera.fov * Math.PI / 360), hw = hh * aspect, H = bag.size.H;
    hold.position.set(hw - .26, -hh + H * .5 + jolt * .02 + Math.sin(bounce * Math.PI) * .04, z); hold.rotation.z = jolt * .08;
    api.left = (hw - .26 - .22) / hw * .5 + .5;                                  // (the bag's left edge, 0..1 across the picture: the count goes by it)
    for (let k = flying.length - 1; k >= 0; k--) { const f = flying[k]; f.t += dt; f.vy -= 5 * dt; f.g.position.x += f.vx * dt; f.g.position.y += f.vy * dt; f.g.rotation.z += f.sp * dt; f.g.rotation.x += f.sp * .4 * dt;
      if (f.t > .9) { hold.remove(f.g); flying.splice(k, 1); } }
  }
  const api = { scene, camera, update, left: .85 }; return api;
}
