// People sitting out in front of their houses (on the chairs and loungers the track put in the gardens): a big-bellied man on a
// lounger with a bottle of beer, older folk on garden chairs. Made in Blender from MakeHuman (assets/export/belly|granma|grandpa.glb:
// sitting clips 'idle' and 'talk'). As the rider goes by, one calls out to him (a bubble over their head, the talking clip a while):
// the man on the lounger teases, the old ones greet or warn.
// createResidents({ THREE, toon, track, hud, scene, max }) → { update(dt, R) }; R: { x, z, v }
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function createResidents({ THREE, toon, track, hud, scene, max = 7 }) {
  const LINES = {
    belly: ['HEJ MŁODY!', 'SZYBCIEJ, SZYBCIEJ!', 'HEHE, SPÓŹNIONY!', 'GAZETA DO SKRZYNKI!', 'PEDAŁUJ, CHŁOPIE!', 'ZA MOICH CZASÓW...', 'UWAŻAJ NA PSA!'],
    granma: ['DZIEŃ DOBRY!', 'OSTROŻNIE, DZIECKO!', 'A GAZETKA?', 'NIE TAK SZYBKO!'],
    grandpa: ['HEJ, KOLEGO!', 'ZA MOICH CZASÓW...', 'DOBRZE JEDZIESZ!', 'A KASK GDZIE?'],
  };
  const LUMP = ['ZZZ...', 'CHRRR... PSSS...', 'MAMO, JESZCZE PIĘĆ MINUT...', 'ZZZ... PIWKO...', 'NIE ŚPIĘ, TYLKO MRUGAM...'], LUMP_AWAKE = ['DZIĘKI, MŁODY!', 'KTÓRA GODZINA?!', 'AUTOBUS ODJECHAŁ?!', 'CO TAM W GAZECIE?'];
  const STOP = ['AUTOBUS ZNOWU SPÓŹNIONY!', 'MŁODY, KTÓRA GODZINA?', 'TEN ZNOWU ŚPI...', 'GAZETKĘ BY SIĘ POCZYTAŁO...', 'CZEKAM OD PÓŁ GODZINY!'];
  const SHACKS = ['EJ, MŁODY! POŻYCZ DYSZKĘ!', 'DAWAJ GAZETĘ, NA ROZPAŁKĘ!', 'CO SIĘ GAPISZ?', 'MASZ FAJKĘ?', 'ROWER FAJNY. SPRZEDASZ?', 'TU SIĘ NIE JEŹDZI, TU SIĘ ŻYJE!', 'GAZETA? U NAS TELEWIZJA PRZEZ ŚCIANĘ!'];
  const PLOT = {                                                         // (the people of the plots, see plots.js)
    dzialki: ['TYLKO NIE PO GRZĄDKACH!', 'POMIDORY W TYM ROKU JAK PIĘŚCI!', 'ZNOWU MI KTOŚ ZJADŁ TRUSKAWKI...', 'GAZETĘ ZOSTAW, NA ROZSADĘ DOBRA!', 'SŁOMA W BUTACH TO OBCIACH, A W KAPELUSZU TO TRADYCJA!'],
    budowa: ['UWAGA, BUDOWA!', 'TO MIAŁO BYĆ GOTOWE W MAJU. KTÓREGO ROKU, NIE MÓWILI.', 'KASKU NIE MASZ? JA TEŻ NIE.', 'PRZERWA NA KAWĘ. TRZECIA.', 'NIE SKACZ MI PO PIASKU!'],
    trzepak: ['PODAJ PIŁKĘ!', 'GRAMY? TY NA BRAMCE!', 'MAMA KAZAŁA TRZEPAĆ DYWAN...', 'FAJNY ROWER! DASZ SIĘ PRZEJECHAĆ?', 'KTO OSTATNI DO TRZEPAKA, TEN JEST JAJO!'],
    kapliczka: ['ZDROWAŚ MARYJO...', 'DZIECKO, ZWOLNIJ, ŚWIĘTE MIEJSCE!', 'ZA KIEROWCÓW SIĘ MODLĘ. I ZA ROWERZYSTÓW, BO GŁUPI.', 'ŚWIECZKĘ BYŚ ZAPALIŁ, A NIE PEDAŁUJESZ.'],
    przyczepa: ['WILLA Z WIDOKIEM. NA DROGĘ.', 'NIE GAP SIĘ, TU MIESZKAM!', 'GAZETA? A JEST W NIEJ HOROSKOP?', 'DO MORZA TĄ PRZYCZEPĄ JEŹDZIŁEM. W SIEDEMDZIESIĄTYM.', 'KOŁA? PO CO KOŁA. JA SIĘ NIE WYBIERAM.'] };
  const WALKING = {                                                      // (him on foot: nothing about riding)
    belly: ['HEJ MŁODY!', 'CO, ROWER CI UKRADLI?', 'HEHE, SPÓŹNIONY!', 'NA PIECHOTĘ? ZDROWO!', 'ZA MOICH CZASÓW...', 'PODAJ PIWO, JAK IDZIESZ!'],
    granma: ['DZIEŃ DOBRY!', 'A GDZIE ROWEREK?', 'A GAZETKA?', 'SPACERKIEM, DZIECKO?'],
    grandpa: ['HEJ, KOLEGO!', 'ZA MOICH CZASÓW...', 'SPACER DOBRY NA KOLANA!', 'A ROWER GDZIE ZOSTAWIŁEŚ?'],
  };
  const pick = a => a[Math.random() * a.length | 0], loader = new GLTFLoader(), cache = {}, list = [];
  const load = key => cache[key] || (cache[key] = new Promise(ok => loader.load(`assets/export/${key}.glb`, ok, undefined, () => ok(null))));
  const seats = [...track.seats.filter(s => s.stand), ...track.seats.filter(s => !s.stand).slice(0, max)];   // (the lads by the shacks, all of them; the sitters, a few)
  seats.forEach((seat, k) => {
    const key = seat.key || (seat.lounger ? 'belly' : (k % 2 ? 'granma' : 'grandpa'));
    load(key).then(g => { if (!g) return;
      const m = SkeletonUtils.clone(g.scene); seat.h.updateMatrixWorld(true);
      const at = seat.h.localToWorld(seat.local.clone()), yaw = seat.h.rotation.y + (seat.face ?? Math.PI);            // (facing the road: the house's front)
      const G = new THREE.Group(); G.position.copy(at); G.rotation.y = yaw; G.add(m); scene.add(G);
      if (seat.lounger) { m.rotation.x = -.42; m.position.set(0, -.14, .2); }                          // (lying back on the lounger)
      m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) }); o.castShadow = true; o.frustumCulled = false; } });
      const mixer = new THREE.AnimationMixer(m), clip = n => g.animations.find(c => c.name === n), acts = { idle: mixer.clipAction(clip('idle')), talk: clip('talk') ? mixer.clipAction(clip('talk')) : null };
      acts.idle.play(); acts.idle.time = Math.random() * 2; if (acts.talk) { acts.talk.play(); acts.talk.setEffectiveWeight(0); }
      let bottle = null; if (key === 'belly') { bottle = new THREE.Group(); G.add(bottle); const glass = toon('#6b4a2e'); const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .16, 8), glass); bottle.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(.012, .03, .08, 8), glass); n.position.y = .12; bottle.add(n); const lb = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .06, 8), toon('#efc970')); bottle.add(lb); }
      list.push({ key, lines: seat.lines, stop: seat.stop, awakeT: 0, G, m, mixer, acts, bottle, hand: m.getObjectByName('hand_r'), head: m.getObjectByName('head'), cool: 3 + Math.random() * 6, talkT: 0, mouth: new THREE.Vector3() });
    });
  });
  const _v = new THREE.Vector3();
  function update(dt, R) {
    for (const r of list) {
      r.cool -= dt; r.talkT = Math.max(0, r.talkT - dt); r.awakeT = Math.max(0, r.awakeT - dt);
      const d = Math.hypot(R.x - r.G.position.x, R.z - r.G.position.z);
      r.G.visible = d < 90; if (d > 90) continue;                                                        // (far off: not drawn, not moved)
      if (d < 13 && r.cool <= 0 && Math.abs(R.v) > .5) { r.cool = 14 + Math.random() * 10; r.talkT = 2.6; r.head?.getWorldPosition(r.mouth); r.mouth.y += .35;
        hud.rant(r.mouth, R.line?.(r) || pick(r.lines === 'shacks' ? SHACKS : r.lines === 'lump' ? (r.awakeT > 0 ? LUMP_AWAKE : LUMP) : r.lines === 'stop' ? STOP : PLOT[r.lines] || (R.foot ? WALKING : LINES)[r.key] || STOP), true); }                                                  // (a call to him as he goes by)
      if (r.acts.talk) { const w = r.talkT > 0 ? 1 : 0, cur = r.acts.talk.getEffectiveWeight(), nw = cur + (w - cur) * Math.min(1, dt * 5); r.acts.talk.setEffectiveWeight(nw); r.acts.idle.setEffectiveWeight(1 - nw); }
      r.mixer.update(dt);
      if (r.bottle && r.hand) { r.G.updateMatrixWorld(true); r.hand.getWorldPosition(_v); r.bottle.position.copy(r.G.worldToLocal(_v)); r.bottle.position.y += .05; }   // (the beer in his hand)
      if (r.talkT > 0 && r.head) { r.head.getWorldPosition(r.mouth); r.mouth.y += .35; }
    }
  }
  // someone more, for a story (spawn(key) → { G, m, mixer, acts: { walk, idle, talk }, head } or null): the same model, the same toon
  function spawn(key) {
    return load(key).then(g => { if (!g) return null; const m = SkeletonUtils.clone(g.scene), G = new THREE.Group(); G.add(m); scene.add(G);
      m.traverse(o => { if (o.isMesh) { const om = o.material, cut = om.transparent || om.alphaTest > 0; o.material = toon(om.color.clone(), { map: om.map || null, ...(cut ? { alphaTest: .5, side: THREE.DoubleSide } : {}) }); o.castShadow = true; o.frustumCulled = false; } });
      const mixer = new THREE.AnimationMixer(m), acts = {}; for (const n of ['walk', 'idle', 'talk']) { const c = g.animations.find(q => q.name === n); if (c) acts[n] = mixer.clipAction(c); }
      return { G, m, mixer, acts, head: m.getObjectByName('head') }; });
  }
  return { update, list, spawn };
}
