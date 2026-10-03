// The street's furniture, modelled closer than blocks (metres; pixel art likes a clear silhouette and a few honest parts):
//   bench(): a park bench: cast-iron sides (a front leg, a back leg rising into the back, an armrest with its scroll), four seat slats
//     and three back slats leaning back, the wood in two close tones. Local frame: its length along z, the back towards +x, the seat's
//     top at .46.
//   bin(colour): a wheelie bin: its body narrowing to the foot (square in plan), the lid overhanging with a lip at the front and the
//     handle bar at the back, two wheels on an axle at the back, a darker panel on the front. Local frame: the front towards -x.
// createFurniture({ THREE, toon }) → { bench(), bin(colour) }

export function createFurniture({ THREE, toon }) {
  const iron = toon('#27302c'), wood = [toon('#a8743f'), toon('#94643a')], rubber = toon('#1d1e21'), hub = toon('#8a8f96');
  const box = (w, h, d, m, x, y, z, g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const bar = (a, b, r, m, g) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length(), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), m);
    c.position.copy(A).addScaledVector(d, .5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); c.castShadow = true; g.add(c); return c; };
  function bench() { const g = new THREE.Group();
    for (const z of [-.78, .78]) {                                                  // (the two iron sides)
      bar([-.2, 0, z], [-.17, .44, z], .028, iron, g);                              // the front leg, a little raked
      bar([.2, 0, z], [.17, .44, z], .028, iron, g); bar([.17, .44, z], [.27, .92, z], .025, iron, g);   // the back leg, on up into the back
      box(.46, .04, .05, iron, -.01, .43, z, g);                                    // the seat's bearer
      bar([-.24, .66, z], [.2, .66, z], .022, iron, g); bar([-.2, .44, z], [-.22, .64, z], .02, iron, g);   // the armrest and its post
      const sc = new THREE.Mesh(new THREE.TorusGeometry(.035, .015, 5, 8), iron); sc.position.set(-.26, .64, z); g.add(sc); }   // its scroll
    for (let k = 0; k < 4; k++) box(.085, .035, 1.72, wood[k % 2], -.19 + k * .105, .46, 0, g);             // the seat's slats, small gaps
    for (let k = 0; k < 3; k++) { const s = box(.035, .1, 1.72, wood[(k + 1) % 2], .2 + k * .025, .58 + k * .13, 0, g); s.rotation.z = -.2; }   // the back's, leaning back
    return g; }
  function bin(colour) { const g = new THREE.Group(), m = toon(colour), dark = toon(new THREE.Color(colour).multiplyScalar(.7).getStyle());
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.4, .33, .92, 4, 1), m); body.rotation.y = Math.PI / 4; body.position.y = .5; body.castShadow = true; g.add(body);
    box(.015, .3, .3, toon(new THREE.Color(colour).multiplyScalar(.86).getStyle()), -.31, .58, 0, g);                                       // the front's panel
    box(.62, .05, .68, m, .02, .985, 0, g); box(.05, .07, .66, dark, -.3, .96, 0, g);   // the lid, its lip at the front
    bar([.33, .9, -.27], [.33, .9, .27], .022, dark, g);                            // the handle bar at the back
    for (const z of [-.24, .24]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .06, 10).rotateX(Math.PI / 2), rubber); w.position.set(.26, .085, z); w.castShadow = true; g.add(w);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .065, 8).rotateX(Math.PI / 2), hub); h.position.copy(w.position); g.add(h); }
    bar([.26, .085, -.27], [.26, .085, .27], .015, hub, g);                         // the axle
    return g; }
  return { bench, bin };
}
