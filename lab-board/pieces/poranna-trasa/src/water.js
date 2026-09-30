// Water from a hydrant knocked or kicked: a jet going up for a few seconds, its drops (squares of the picture's own pixels, white and
// blues) spreading and falling back, and a puddle spreading under it that dries away after.
// createWater({ THREE, scene }) → { spray(at: Vector3, seconds), update(dt), active(at) }
export function createWater({ THREE, scene }) {
  const MAX = 900, pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), life = new Float32Array(MAX);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .09, vertexColors: true, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
  const tints = ['#f6f3ea', '#bcdcdf', '#9ccad8', '#7fb6cc'].map(c => new THREE.Color(c));
  const jets = [], puddles = []; let next = 0;
  const puddleM = new THREE.MeshBasicMaterial({ color: '#5f8fa6', transparent: true, opacity: .55, depthWrite: false });
  function spray(at, seconds = 4) {
    if (jets.some(j => j.at.distanceTo(at) < .5 && j.t < j.dur)) return false;
    jets.push({ at: at.clone(), t: 0, dur: seconds, acc: 0 });
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), puddleM.clone()); p.position.copy(at).setY(at.y + .02); p.scale.setScalar(.01); p.renderOrder = 1; scene.add(p); puddles.push({ m: p, t: 0, dur: seconds }); return true;
  }
  function update(dt) {
    for (const j of jets) { if (j.t >= j.dur) continue; j.t += dt; j.acc += dt * 260 * (j.t < .3 ? j.t / .3 : j.t > j.dur - .6 ? (j.dur - j.t) / .6 : 1);   // (it builds, holds, fails)
      while (j.acc >= 1) { j.acc -= 1; const k = next; next = (next + 1) % MAX; const a = Math.random() * 6.283, sp = .25 + Math.random() * .7, up = 5.5 + Math.random() * 2.5;
        pos[k * 3] = j.at.x + Math.cos(a) * .05; pos[k * 3 + 1] = j.at.y + .75; pos[k * 3 + 2] = j.at.z + Math.sin(a) * .05; vel[k * 3] = Math.cos(a) * sp; vel[k * 3 + 1] = up; vel[k * 3 + 2] = Math.sin(a) * sp; life[k] = 1.6;
        const c = tints[Math.random() * tints.length | 0]; col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; } }
    for (let k = 0; k < MAX; k++) { if (life[k] <= 0) { pos[k * 3 + 1] = -999; continue; } life[k] -= dt; vel[k * 3 + 1] -= 9.8 * dt;
      pos[k * 3] += vel[k * 3] * dt; pos[k * 3 + 1] += vel[k * 3 + 1] * dt; pos[k * 3 + 2] += vel[k * 3 + 2] * dt; }
    g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    for (let i = puddles.length - 1; i >= 0; i--) { const p = puddles[i]; p.t += dt; const r = Math.min(1, p.t / p.dur) * 1.8, dry = Math.max(0, p.t - p.dur - 3) / 8;   // (spreading while it runs; drying after)
      p.m.scale.setScalar(Math.max(.01, r)); p.m.material.opacity = .55 * (1 - dry); if (dry >= 1) { scene.remove(p.m); puddles.splice(i, 1); } }
  }
  const active = at => jets.some(j => j.at.distanceTo(at) < 1 && j.t < j.dur);
  return { spray, update, active };
}
