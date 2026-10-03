// A look at the nature of the two Quaternius packs (CC0) in the game's own scene, for comparing (not shipped: the models are in
// assets/nature-test, which the publish leaves out). ?natura=ult (Ultimate Nature Pack, flat colours) or ?natura=mega (Stylized Nature
// MegaKit, textured): each tree and bush by the road gets the pack's model in its place, its size kept, the toon look on it.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SETS = {
  ult: { trees: ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5', 'BirchTree_1', 'BirchTree_2', 'BirchTree_3', 'Willow_1'],
    autumn: ['CommonTree_Autumn_1', 'CommonTree_Autumn_2', 'CommonTree_Autumn_3', 'BirchTree_Autumn_1', 'BirchTree_Autumn_2'],
    bushes: ['Bush_1', 'Bush_2', 'BushBerries_1', 'BushBerries_2'] },
  mega: { trees: ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5', 'TwistedTree_1', 'TwistedTree_2'],
    autumn: ['CommonTree_1', 'CommonTree_3', 'CommonTree_5'],
    bushes: ['Bush_Common', 'Bush_Common_Flowers'] },
};

export async function natureSwap({ THREE, toon, track, mode }) {
  const S = SETS[mode]; if (!S) return; const L = new GLTFLoader(), cache = {};
  const load = n => cache[n] ||= new Promise(ok => L.load(`assets/nature-test/${mode}/${n}.glb`, g => ok(g.scene), undefined, () => ok(null)));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const AUT = ['#d9822b', '#c4512f', '#e0b23a'];
  // (the pack's materials as the game's: a toon of its colour (and its texture, the leaves cut out by their alpha); autumn: leaves tinted)
  // (an autumn leaf texture: the green one's light and shade kept, its colour taken out, for the autumn colour to tint)
  const greyed = new Map(), grey = map => { if (!map?.image) return map; if (greyed.has(map)) return greyed.get(map); const im = map.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data; for (let i = 0; i < p.length; i += 4) { const l = Math.min(255, (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11) * 1.7); p[i] = p[i + 1] = p[i + 2] = l; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = map.colorSpace; t.flipY = map.flipY; t.wrapS = map.wrapS; t.wrapT = map.wrapT; greyed.set(map, t); return t; };
  const dress = (m, autumn) => m.traverse(o => { if (!o.isMesh) return; const om = o.material, leaf = /leaf|leaves|bush|flower|grass/i.test(om.name || ''), bark = /bark|trunk|wood/i.test(om.name || '');
    let c = om.color ? om.color.clone() : new THREE.Color('#ffffff'), map = om.map || null;
    if (autumn && leaf) { c = new THREE.Color(AUT[rnd() * 3 | 0]); if (map) map = grey(map); else c.lerp(om.color, .15); }
    if (bark && map) c = new THREE.Color('#9a8c7e');                                   // (the bark's texture under the toon light: a little darker, not orange)
    o.material = toon(c, { map, alphaTest: map ? .45 : 0, transparent: false, side: leaf ? THREE.DoubleSide : THREE.FrontSide }); o.castShadow = true; o.receiveShadow = true; });
  const place = async (thing, names, H, autumn) => { const src = await load(names[rnd() * names.length | 0]); if (!src) return; const m = src.clone(true); dress(m, autumn);
    const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y || 1; m.scale.setScalar(H / h); m.rotation.y = rnd() * 6.28;
    if (thing.kind === 'bush') { for (const p of [thing.o, ...(thing.parts || [])]) p.visible = false; if (!thing.o.parent) return; m.position.copy(thing.o.position); m.position.y = 0; thing.o.parent.add(m); }
    else { for (const c of thing.o.children) c.visible = false; thing.o.add(m); } };
  const jobs = [];
  for (const t of track.things) {
    if (t.kind === 'tree') jobs.push(place(t, t.autumn ? S.autumn : S.trees, (t.H || 4) * 1.35 + 1.2, t.autumn));
    else if (t.kind === 'bush' && t.o.parent) { const bb = new THREE.Box3().setFromObject(t.o), h = Math.max(.6, Math.min(1.8, bb.max.y - bb.min.y + .3)); jobs.push(place(t, S.bushes, h, false)); }
  }
  await Promise.all(jobs); return jobs.length;
}
