// The paper bag: a canvas satchel, the game's one bag (on the bike, on foot, in the workshop). Its own frame: its thickness along x (the
// outer face at -x), its height along y, its length along z. A body with rounded edges and a canvas weave, darker gussets at its ends,
// a flap folded over the top and down the front with stitching along its edge, two leather straps with brass buckles, a pocket on the
// front with its own little flap, a sewn-on patch with a paper on it, brass rings at the ends for the strap; and the papers standing out
// from under the flap: rolls with red bands and a few folded flat. As they are thrown, fewer stick out (setFill 0..1).
// makeBag({ THREE, toon }) → { group, setFill(k) }
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function makeBag({ THREE, toon }) {
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  // canvas: a weave of lighter and darker threads, a few flecks
  const weave = tex(16, 16, g => { g.fillStyle = '#ececec'; g.fillRect(0, 0, 16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = ((x + (y >> 1)) % 2 ? 236 : 248) - ((x * 7 + y * 13) % 17 === 0 ? 14 : 0); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); } });
  weave.repeat.set(2, 2);
  const olive = toon('#6f7a45', { map: weave }), oliveD = toon('#5a6337', { map: weave }), gusset = toon('#4f5730', { map: weave }), leather = toon('#6b4a2e'), leatherD = toon('#4a3120'), brass = toon('#c9a44a'), thread = toon('#d8d2b0');
  const paperM = toon('#ece5d0'), bandM = toon('#b3372c'), print = toon('#ffffff', { map: tex(16, 16, g => { g.fillStyle = '#ece5d0'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#9a938a'; for (let y = 2; y < 15; y += 2) g.fillRect(1 + (y % 4 ? 0 : 7), y, y % 4 ? 14 : 6, 1); g.fillStyle = '#44484c'; g.fillRect(1, 1, 14, 1); }) });
  const patchM = toon('#ffffff', { map: tex(12, 8, g => { g.fillStyle = '#b3372c'; g.fillRect(0, 0, 12, 8); g.fillStyle = '#f6f3ea'; g.fillRect(3, 2, 6, 4); g.fillStyle = '#9a938a'; g.fillRect(4, 3, 4, 1); g.fillRect(4, 5, 3, 1); g.fillStyle = '#e8c070'; g.fillRect(0, 0, 12, 1); g.fillRect(0, 7, 12, 1); }) });
  const G = new THREE.Group(), T = .13, H = .28, L = .4;
  const add = (geo, m, x, y, z, parent = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  // the body, a little fuller low down, and its gussets at the ends
  const body = add(new RoundedBoxGeometry(T, H, L, 3, .03), olive, 0, 0, 0);
  { const p = body.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 + .12 * Math.max(0, -y / (H / 2)))); } body.geometry.computeVertexNormals(); }
  for (const s of [-1, 1]) add(new RoundedBoxGeometry(T * .82, H * .9, .012, 2, .005), gusset, 0, -.01, s * (L / 2 + .002));
  // the flap: over the top and down the front, a hem of stitching along its edge
  const flapTop = add(new RoundedBoxGeometry(T + .018, .014, L + .014, 2, .006), oliveD, 0, H / 2 + .004, 0);
  const flapFront = add(new RoundedBoxGeometry(.014, H * .58, L + .014, 2, .006), oliveD, -T / 2 - .006, H / 2 - H * .29, 0);
  add(new THREE.BoxGeometry(.004, .004, L - .02), thread, -T / 2 - .014, H / 2 - H * .58 + .018, 0);
  for (const zz of [-L / 2 + .012, L / 2 - .012]) add(new THREE.BoxGeometry(.004, H * .5, .004), thread, -T / 2 - .014, H / 2 - H * .3, zz);
  // two leather straps down the flap and past it, each with a brass buckle
  for (const zz of [-.1, .1]) { add(new THREE.BoxGeometry(.008, H * .78, .036), leather, -T / 2 - .016, H / 2 - H * .39, zz);
    const bk = new THREE.Group(); bk.position.set(-T / 2 - .022, H / 2 - H * .62, zz); G.add(bk);
    add(new THREE.BoxGeometry(.006, .036, .006), brass, 0, 0, -.022, bk); add(new THREE.BoxGeometry(.006, .036, .006), brass, 0, 0, .022, bk); add(new THREE.BoxGeometry(.006, .006, .05), brass, 0, .016, 0, bk); add(new THREE.BoxGeometry(.006, .006, .05), brass, 0, -.016, 0, bk);
    add(new THREE.BoxGeometry(.008, .016, .004), brass, -.002, 0, 0, bk); add(new THREE.BoxGeometry(.01, .02, .04), leatherD, .004, -.03, 0, bk); }
  // the front pocket, under the flap's edge, with its own little flap and a press stud
  add(new RoundedBoxGeometry(.03, H * .32, L * .5, 2, .01), olive, -T / 2 - .012, -H / 2 + H * .2, 0);
  add(new RoundedBoxGeometry(.034, .03, L * .52, 2, .008), oliveD, -T / 2 - .014, -H / 2 + H * .34, 0);
  add(new THREE.CylinderGeometry(.008, .008, .006, 8).rotateZ(Math.PI / 2), brass, -T / 2 - .032, -H / 2 + H * .33, 0);
  // a patch sewn on the flap: a paper on red
  add(new THREE.BoxGeometry(.004, .04, .06), patchM, -T / 2 - .015, H / 2 - H * .15, 0);
  // brass rings at the ends, for the strap
  for (const s of [-1, 1]) { const r = add(new THREE.TorusGeometry(.018, .004, 5, 10), brass, 0, H / 2 - .01, s * (L / 2 + .012)); r.rotation.y = Math.PI / 2; }
  // the papers, standing out from under the flap at the back: rolls (some tilted), a few folded flat
  const papers = [];
  for (let k = 0; k < 7; k++) { const p = new THREE.Group(), z = -L / 2 + .045 + k * (L - .09) / 6; p.position.set(T * .1 + (k % 2) * .015, H / 2 + .05, z); G.add(p);
    if (k % 3 === 2) { const f = add(new THREE.BoxGeometry(.016, .14, .09), print, 0, .02, 0, p); f.rotation.x = (k % 2 ? .1 : -.08); }      // (folded flat, its print showing)
    else { add(new THREE.CylinderGeometry(.024, .024, .16, 10), paperM, 0, .03, 0, p); add(new THREE.CylinderGeometry(.025, .025, .022, 10), bandM, 0, .06, 0, p);
      add(new THREE.CylinderGeometry(.016, .016, .005, 8), toon('#d8d0b8'), 0, .111, 0, p); }                                           // (the roll's end)
    p.rotation.set((k % 2 ? .18 : -.12), 0, -.2 + (k % 3) * .12); papers.push(p); }
  function setFill(k) { const n = Math.round(Math.max(0, Math.min(1, k)) * papers.length); papers.forEach((p, i) => { p.visible = i < n; }); flapTop.position.y = H / 2 + .004 + (n ? .012 : 0); }
  return { group: G, setFill, papers, size: { T, H, L } };
}
