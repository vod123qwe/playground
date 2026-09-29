// Other visitors, live. Everyone who has the walk open is a ghost to the others: a figure of light (its outline glows, its middle is
// nearly clear), a ring on the floor pointing where they look, a little name; faintly through the walls too, so you can find each
// other; and a dot on the minimap. Up to ten at once.
// How: the browsers find each other over public Nostr relays (Trystero; no account, no key, no server of ours; what the relays carry
// is encrypted) and then talk directly, peer to peer (WebRTC; so they learn each other's network address, as any call does).
// What goes out, a few times a second while you move: a random id, where you stand on the plan (cm), which way you look, your eye
// height, and whether you walk or look from above. Nothing else. At the TV, when you pick the duel: that you wait for one, and then, to
// the one you play, only the duel (where your figure is, its life, where your orbs fly).

const APP = 'aw-lab-apartment-walk-v1', ROOM = 'flat', LIB = 'https://esm.sh/trystero@0.25.4/nostr';

export async function startGhosts({ THREE, scene, wx, wz, pose, onChange = () => {}, max = 10 }) {
  let T; try { T = await import(LIB); } catch (e) { console.warn('ghosts: no connection', e); return null; }
  const room = T.joinRoom({ appId: APP, password: APP }, ROOM);
  const act = room.makeAction('pose');                               // (Trystero 0.25: an object with send and an onMessage setter)
  const send = (d, to) => act.send(d, to ? { target: to } : {}).catch(() => {});
  const tvAct = room.makeAction('tv');                                // the TV's duel: its own channel (tvgame.js checks what comes)
  const tv = { onMessage: null, onLeave: null, send: (d, to) => tvAct.send(d, to ? { target: to } : {}).catch(() => {}) };
  tvAct.onMessage = (d, from) => { const id = typeof from === 'string' ? from : from?.peerId; if (id && tv.onMessage) tv.onMessage(d, id); };
  const on = (k, fn) => { if (typeof room[k] === 'function') room[k](fn); else room[k] = fn; };
  const G = new THREE.Group(); G.name = 'ghosts'; scene.add(G);
  const peers = new Map(), numbers = new Set();
  const hueOf = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 360) / 360; };

  // the figure: a body (a capsule) and a head, lit at the rim; its x-ray twin through the walls; the ring; the name
  const body = new THREE.CapsuleGeometry(.2, .92, 8, 20).translate(0, .1 + .2 + .46, 0), head = new THREE.SphereGeometry(.12, 24, 16);
  const ringG = (() => { const s = new THREE.Shape(); s.absarc(0, 0, .36, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, .31, 0, Math.PI * 2, true); s.holes.push(h);
    const g = new THREE.ShapeGeometry(s, 48), w = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.36, 0, -.09), new THREE.Vector3(.56, 0, 0), new THREE.Vector3(.36, 0, .09)]);
    g.rotateX(-Math.PI / 2); w.setIndex([0, 1, 2]); return [g, w]; })();
  const rim = (col, xray) => new THREE.ShaderMaterial({
    uniforms: { col: { value: col }, a: { value: xray ? .28 : 1 } },
    vertexShader: 'varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 col; uniform float a; varying vec3 vN, vV; void main() { float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.4); gl_FragColor = vec4(col * (.55 + .8 * f), a * (.05 + .9 * f)); }',
    transparent: true, depthWrite: false, depthTest: !xray });
  function label(n, col) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 72; const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(8, 8, 240, 56, 28); g.fill();
    g.fillStyle = `#${col.getHexString()}`; g.beginPath(); g.arc(40, 36, 11, 0, 7); g.fill();
    g.fillStyle = '#1b1c20'; g.font = '600 28px Inter, sans-serif'; g.textBaseline = 'middle'; g.fillText(`Guest ${n}`, 62, 37);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true })); s.scale.set(.52, .146, 1); return s;
  }
  function make(id) {
    let n = 1; while (numbers.has(n)) n++; numbers.add(n);
    const hue = hueOf(id), col = new THREE.Color().setHSL(hue, .8, .55), g = new THREE.Group();
    for (const xray of [false, true]) { const m = rim(col, xray); g.add(new THREE.Mesh(body, m)); const h = new THREE.Mesh(head, m); h.position.y = 1.55; g.add(h); if (xray) g.children.slice(-2).forEach(o => { o.renderOrder = 10; }); }
    const flat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .75, depthWrite: false, side: THREE.DoubleSide });
    for (const geo of ringG) { const r = new THREE.Mesh(geo, flat); r.position.y = .012; r.name = 'ring'; g.add(r); }
    const tag = label(n, col); tag.position.y = 1.9; g.add(tag);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(.033, .033, .168, 16), new THREE.MeshBasicMaterial({ color: '#f2c14e' })); can.position.set(.24, 1.02, .1); can.name = 'can'; can.visible = false; g.add(can);   // a can in its hand
    g.traverse(o => { o.userData.noTrace = true; o.raycast = () => {}; }); G.add(g);
    const P = { id, n, hue, g, tag, x: 0, z: 0, yaw: 0, eye: 165, mode: 'walk', to: null, seen: performance.now(), fresh: true };
    peers.set(id, P); onChange(); return P;
  }
  function drop(id) { const P = peers.get(id); if (!P) return; G.remove(P.g); P.tag.material.map.dispose(); numbers.delete(P.n); peers.delete(id); onChange(); }

  act.onMessage = (d, from) => { const id = typeof from === 'string' ? from : from?.peerId; if (!id) return;
    if (!d || typeof d.x !== 'number' || typeof d.z !== 'number') return;
    let P = peers.get(id); if (!P) { if (peers.size >= max) return; P = make(id); }
    P.to = { x: d.x, z: d.z, yaw: +d.y || 0, eye: THREE.MathUtils.clamp(+d.e || 165, 60, 200), mode: d.m === 'over' ? 'over' : 'walk', can: !!d.b }; P.seen = performance.now();
    if (P.fresh) { Object.assign(P, P.to); P.fresh = false; }
  };
  on('onPeerLeave', id => { drop(id); tv.onLeave?.(id); });
  let lastKey = '', lastSent = 0;
  const pack = () => { const p = pose(); return { x: Math.round(p.x), z: Math.round(p.z), y: +p.yaw.toFixed(2), e: Math.round(p.eye), m: p.mode, b: p.can ? 1 : 0 }; };
  on('onPeerJoin', id => send(pack(), id));                           // a newcomer hears where you are at once
  const tick = setInterval(() => {
    const d = pack(), k = JSON.stringify(d), now = performance.now();
    if (k !== lastKey || now - lastSent > 3000) { send(d); lastKey = k; lastSent = now; }
    for (const [id, P] of peers) if (now - P.seen > 15000) drop(id);  // gone quiet: gone
  }, 120);

  // each frame: glide to where they are, turn to where they look, hover a little; true when one moved (to redraw)
  const clock = { t: 0 };
  function step(dt) {
    clock.t += dt; let moved = false;
    for (const P of peers.values()) {
      if (!P.to) { P.g.visible = false; continue; }
      const k = 1 - Math.exp(-dt * 7), dy = Math.atan2(Math.sin(P.to.yaw - P.yaw), Math.cos(P.to.yaw - P.yaw));
      const before = P.x + P.z + P.yaw;
      P.x += (P.to.x - P.x) * k; P.z += (P.to.z - P.z) * k; P.yaw += dy * k; P.eye += (P.to.eye - P.eye) * k;
      if (Math.abs(P.x + P.z + P.yaw - before) > .05) moved = true;
      const drop = Math.max(0, (165 - P.eye) / 100), s = Math.min(1.1, P.eye / 165 + drop / 1.65), hover = Math.sin(clock.t * 1.7 + P.hue * 9) * .025;   // seated: the figure sinks (its legs under the floor)
      P.g.visible = true; P.g.position.set(wx(P.x), hover - drop, wz(P.z)); P.g.scale.setScalar(s);
      for (const o of P.g.children) { if (o.name === 'ring') { o.rotation.y = -P.yaw; o.position.y = (.012 - hover + drop) / s; } if (o.name === 'can') o.visible = !!P.to.can; }
    }
    return moved;
  }
  const list = () => [...peers.values()].filter(P => P.to).map(P => ({ n: P.n, x: P.x, z: P.z, yaw: P.yaw, hue: P.hue, mode: P.to.mode }));
  function stop() { clearInterval(tick); for (const id of [...peers.keys()]) drop(id); scene.remove(G); room.leave(); onChange(); }
  return { step, list, stop, get count() { return [...peers.values()].filter(P => P.to).length; }, selfId: T.selfId, tv };
}
