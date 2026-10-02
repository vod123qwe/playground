// The test street: a loop of suburban road (about 700 m) with bends and gentle hills, in metres. Across it: the asphalt (7 m),
// the kerbs, a grass verge, the pavement, the front lawns. Along it: houses (windows with frames, glazing bars, shutters and flower
// boxes; porches with rails and steps; a path or a drive to a garage door; bushes and beds in bloom at the walls), each with its
// mailbox by the pavement; street trees on the verge, their crowns over the road, their dappled shadows on it; other trees, some
// already turning, spruces behind the houses; telegraph poles with their wires, street lamps, drains in the gutters, hydrants,
// wheelie bins, picket fences and hedges, parked cars (in the street and on the drives). Between the houses: side fences, sheds,
// washing lines, log stacks, sandboxes, bird baths. On the road and the pavement: cones, bin bags, a child's wagon, road works,
// potholes, open manholes, wooden ramps, bundles of papers. All the still things are merged, by material, into a few big meshes.
// What stops a bike is kept as boxes on the ground (colliders, found by where along the road they are); a house's windows (to be
// broken) and the spot before its door (a paper there is delivered) are kept as targets.
// probe() says, for a point, where on the road it is: how far along, how far off the middle (+ right), the ground's height there,
// the road's direction, its slope.

import { createFair } from './fair.js';
import { pixSign } from './pixsign.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCars } from './cars.js';
import { createProps } from './props.js';
import { createNature } from './nature.js';
import { createPlots } from './plots.js';
import { createEstate } from './estate.js';
import { createCity } from './city.js';
import { createCityNet } from './citynet.js';

// the regions (docs/regiony.md): each its own loop and its own look. peryferia: the suburb (home off it, kerbs, pavements, lines, bus
// stops, bike lanes, police, houses close); wies: the village (a longer hilly loop, no kerbs or lines, a gravel shoulder and a dirt path,
// fewer houses in plaster, farms and fields right by the road, one bus stop)
export const REGION_T = {
  peryferia: { id: 'peryferia', home: true, ctrl: [[0, 0, 0], [0, 1, 60], [18, 3, 120], [60, 5, 160], [115, 4, 170], [160, 2, 150], [185, 0, 105], [180, -1, 50], [150, -2, 5], [150, -1, -45], [175, 1, -90], [160, 3, -140], [110, 4, -165], [55, 2, -150], [15, 0, -110], [-5, -1, -55]],
    roll: 1, kerb: true, lines: true, bike: true, stops: [.18, .5, .8], posts: [.33, .7], shops: [[.6, -1]], gap: [20, 10], houseP: 1, farms: false,
    // (the Classic's street (docs/klasyk.md): a long loop of gentle bends, the houses only on his left as he rides it, his home one of them
    // (a board says so), the start on the street itself under a START banner, as on the old machines; on the right the pavement,
    // a strip of lawn with benches and the paper bundles; the street trees on the houses' side)
    maps: {
      klasyk: { classic: true, oneSide: -1, home: false, ctrl: [[0, 0, 0], [6, 1, 80], [30, 2, 160], [85, 3, 225], [165, 3, 250], [240, 2, 225], [285, 1, 160], [295, 0, 80], [275, -1, 0], [225, 0, -60], [150, 1, -90], [75, 0, -85], [20, 0, -50]],
        gap: [11, 5], stops: [.86], posts: [], shops: [], trees: 0, roll: .12 } } },   // (flat ground round it: the camera hangs over the right side)
  wies: { id: 'wies', home: false, ctrl: [[0, 0, 0], [10, 2, 70], [-10, 5, 140], [30, 8, 200], [100, 9, 235], [175, 6, 220], [225, 3, 165], [235, 0, 95], [270, 2, 30], [255, 5, -45], [195, 7, -95], [125, 4, -110], [70, 1, -85], [25, -1, -45]],
    roll: 1.6, kerb: false, lines: false, bike: false, stops: [.45], posts: [], shops: [[.72, -1]], gap: [24, 18], houseP: .56, farms: true,
    walls: ['#e8e4dc', '#d9d4c8', '#c9c2b0', '#e6dcc4', '#bfb8a8', '#d8cfb8'], roofs: ['#5a5f66', '#6d4a3a', '#7a7f86', '#4a4038'],
    // (the village's routes, each its map: the harvest (golden fields one after another, combines on the road and dust behind them,
    // tractors with trailers, straw ramps, bales out on the stubble))
    maps: {
      zniwa: { harvest: true, ctrl: [[0, 0, 0], [20, 1, 80], [0, 3, 160], [60, 6, 225], [150, 7, 245], [225, 5, 205], [255, 2, 120], [262, 1, 40], [232, 3, -40], [165, 4, -85], [95, 2, -95], [32, 0, -55]],
        gap: [22, 16], houseP: .38, trees: .5, stops: [.5], shops: [[.3, 1]] },
      // (the church fair: the village with its church square, the stalls along both verges, a crowd, the band on the road)
      odpust: { fair: [.44, .54], fairSide: 1, ctrl: [[0, 0, 0], [-15, 1, 75], [5, 3, 150], [70, 5, 200], [150, 6, 215], [215, 4, 175], [245, 2, 95], [240, 1, 20], [205, 3, -50], [140, 4, -95], [75, 2, -90], [25, 0, -50]],
        gap: [22, 16], houseP: .62, stops: [.3, .7], shops: [[.6, -1]] } } },
  // peryferia2 ("Druga strona"): the new estate over the tracks: a flat loop with tighter corners, kerbs and lines, houses close in a row
  // (modern greys and whites, dark roofs), lots with a house going up, two stretches of warehouses, road works, cranes over it all
  peryferia2: { id: 'peryferia2', home: false, ctrl: [[0, 0, 0], [5, 1, 55], [40, 1, 95], [95, 2, 100], [140, 1, 70], [150, 0, 20], [190, 1, -10], [235, 2, -5], [255, 1, -55], [225, 0, -110], [160, -1, -125], [100, 0, -100], [55, 1, -110], [15, 0, -70]],
    roll: .45, kerb: true, lines: true, bike: false, stops: [.3, .78], posts: [.55], shops: [[.62, -1]], gap: [11, 4], houseP: 1, farms: false, estate: true, site: .22, wh: [[.12, .24], [.66, .76]], works: [[.4, 1], [.88, -1]],
    walls: ['#e9e6df', '#d6d2ca', '#c9c4ba', '#b9b4ab', '#e3dccf', '#f0eee8'], roofs: ['#3f4246', '#4a4e55', '#5a5f66', '#34373b'],
    // (the industrial quarter's routes, each its map: the building site (sites all along, cranes, gantries with loads over the road);
    // the sidings (long straights along the halls, forklifts across the road, a level crossing))
    maps: {
      budowa: { industry: 'budowa', ctrl: [[0, 0, 0], [0, 1, 70], [30, 2, 120], [90, 2, 130], [130, 1, 100], [135, 1, 40], [180, 1, 20], [230, 2, 40], [260, 1, 0], [250, 0, -60], [200, 0, -90], [140, -1, -80], [80, 0, -100], [30, 0, -60]],
        site: .62, wh: [], works: [[.2, 1], [.5, -1], [.78, 1]], cranes: 8, stops: [.4], shops: [[.7, -1]] },
      bocznica: { industry: 'bocznica', ctrl: [[0, 0, 0], [0, 0, 120], [20, 0, 170], [80, 0, 180], [200, 0, 180], [250, 0, 150], [255, 0, 60], [250, 0, -20], [220, 0, -50], [120, 0, -55], [40, 0, -50], [5, 0, -25]],
        site: .05, wh: [[.05, .45], [.55, .95]], works: [[.5, 1]], cranes: 2, roll: .2, stops: [.3, .8] } } },
  // miasto: the town: a loop of streets with corners (blocks of the old town, the market, the estate of panel blocks), kerbs, lines, a
  // bike lane, many stops; tenements in rows right at the pavement, the market's stalls on one stretch, blocks of flats on another,
  // tram rails, fewer street trees, no poles; round it no fields: a skyline
  miasto: { id: 'miasto', home: false, ctrl: [[0, 0, 0], [0, 0, 60], [6, 0, 100], [45, 1, 108], [100, 1, 108], [140, 1, 100], [148, 1, 60], [150, 2, 10], [158, 2, -30], [200, 2, -36], [240, 1, -40], [250, 1, -80], [244, 0, -120], [200, 0, -128], [120, 0, -126], [60, 0, -122], [8, 0, -112], [-2, 0, -60]],
    roll: .25, kerb: true, lines: true, bike: true, stops: [.12, .34, .56, .78], posts: [.46], shops: [[.3, 1], [.84, -1]], gap: [13, 1.5], houseP: 1, farms: false, city: true, market: [[.2, .28]], blocks: [[.6, .74]], trees: .3,
    walls: ['#d8c0a8', '#e3c77e', '#c9b8a0', '#b7c29a'], roofs: ['#4a4e55', '#5a5f66', '#8e3b2c'],
    // a route's own map in the town (docs/regiony.md: each route its own streets, the region's look): what it changes of the above
    maps: {
      // turystyczna: the tourist quarter: old tenements in pastels round a big park inside the loop (both shortcuts through it: narrow
      // paths, no cars, people everywhere), a church and a monument where the town has its office tower, food trucks, a skatepark
      turystyczna: { tourist: true, ctrl: [[0, 0, 0], [0, 1, 70], [15, 2, 130], [60, 2, 160], [120, 1, 165], [170, 1, 140], [190, 0, 90], [230, 0, 60], [250, 0, 0], [230, 0, -60], [170, 0, -80], [100, 0, -75], [45, 0, -60], [10, 0, -30]],
        stops: [.2, .5, .8], posts: [.5], shops: [[.3, 1], [.75, -1]], market: [], blocks: [], trees: .75, walls: ['#e8c8c0', '#f0dca8', '#c8dcc0', '#c0d0e0', '#e8d0e0', '#f0e0c8'] } } },
  // bronx: the estate of panel blocks after dark (docs/trasy-tematyczne.md): its own loop of streets between the blocks, blocks nearly
  // all the way, a few tenements; the night: lamps along it (some flickering), lit windows, dark passages, a shop open all night
  bronx: { id: 'bronx', home: false, city: true, night: true, ctrl: [[0, 0, 0], [0, 0, 80], [-20, 0, 140], [10, 0, 190], [70, 0, 205], [115, 0, 175], [125, 0, 115], [165, 0, 92], [222, 0, 102], [262, 0, 70], [258, 0, 0], [212, 0, -42], [150, 0, -52], [92, 0, -32], [42, 0, -44]],
    roll: .2, kerb: true, lines: true, bike: false, stops: [.15, .45, .75], posts: [.5], shops: [[.3, 1], [.8, -1]], gap: [13, 1.5], houseP: 1, farms: false, market: [], blocks: [[.04, .46], [.54, .96]], trees: .35,
    walls: ['#9a9088', '#a8a098', '#8c8a84', '#b0a48e'], roofs: ['#3a3d42', '#44484c'],
    // (the Bronx by day: Blokowisko's own map)
    maps: {
      // garaze: the garages at night: rows of boxes along a zigzag through the estate, their roofs to ride, a few blocks between
      garaze: { ctrl: [[0, 0, 0], [0, 0, 70], [30, 0, 100], [30, 0, 160], [70, 0, 190], [130, 0, 190], [150, 0, 150], [150, 0, 90], [190, 0, 70], [240, 0, 80], [260, 0, 30], [240, 0, -30], [180, 0, -50], [120, 0, -40], [60, 0, -60], [15, 0, -35]],
        garages: [[.04, .3], [.38, .62], [.7, .96]], blocks: [[.3, .38], [.62, .7]], trees: .2, stops: [.5], shops: [[.34, 1]] },
      // bloki: the estate of panel blocks: a long boulevard up one side, a turn back, a zigzag between the blocks on the way down; blocks on most of it, a strip of tenements by the start
      // and one half way round, more trees, no market
      bloki: { night: false, ctrl: [[0, 0, 0], [0, 0, 100], [0, 1, 200], [10, 1, 290], [50, 2, 330], [100, 2, 330], [130, 1, 300], [130, 1, 240], [170, 1, 215], [210, 1, 215], [240, 0, 180], [240, 0, 100], [205, 0, 70], [160, -1, 60], [130, -1, 20], [125, -1, -40], [95, 0, -75], [45, 0, -80], [10, 0, -50]],
        stops: [.1, .3, .55, .8], posts: [.5], shops: [[.25, 1], [.7, -1]], market: [], blocks: [[.1, .44], [.56, .94]], trees: .6 },
    } } };

export function createTrack({ THREE, toon, tex, showcase = false, region = 'peryferia', map = '' }) {   // (showcase: for the workshop; nothing merged, each house, tree, shack kept by itself in show)
  let FAIR = null;
  const RG0 = REGION_T[region] || REGION_T.peryferia, RG = RG0.maps?.[map] ? { ...RG0, ...RG0.maps[map], map } : { ...RG0, map: '' };   // (a route's own map: the region's, with its changes)   // (showcase: for the workshop; nothing merged, each house, tree, shack kept by itself in show)
  const G = new THREE.Group();
  // ---------- the line of the road ----------
  const ctrl = RG.ctrl.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  // (the map's own middle, and how far its road goes from it: the town's skyline and its planes round that, clear of the road)
  const CEN = ctrl.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ctrl.length), REACH = Math.max(...ctrl.map(p => Math.hypot(p.x - CEN.x, p.z - CEN.z))) + 45;
  const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
  const N = 1600, pts = curve.getSpacedPoints(N); pts.pop();          // (closed: the last is the first)
  { const L0 = curve.getLength(); pts.forEach((p, i) => { const u = i / N * L0; p.y += (Math.sin(u / (L0 / Math.round(L0 / 62)) * 6.283) * .55 + Math.sin(u / (L0 / Math.round(L0 / 27)) * 6.283 + 1.3) * .22) * RG.roll; }); }   // (a gentle roll: rises of half a metre; a whole number of them round the loop, so no step where it closes)
  const S = pts.map((p, i) => { const q = pts[(i + 1) % N], o = pts[(i + N - 1) % N], f = new THREE.Vector3(q.x - o.x, 0, q.z - o.z).normalize(); return { p, f, r: new THREE.Vector3(-f.z, 0, f.x) }; });
  const len = curve.getLength(), ds = len / N;
  // the cross-section: [offset from the middle (+ right), height]
  const ROAD = 3.5, KERB = 3.65, VERGE = 5.0, PAVE = 6.6;
  const KR = RG.kerb ? .14 : .03;
  function hAt(d, i = 0) { const a = Math.abs(d); return (a <= ROAD ? 0 : a <= KERB ? (a - ROAD) / (KERB - ROAD) * KR : KR + Math.min(.02, (a - KERB) * .01)) + terr(d, i); }
  function terr(d, i) {                                                // (nothing near the road and the lots, to 30 m; then rolling land, rising the farther out)
    const a = Math.abs(d); if (a < 30) return 0; const w = Math.min(1, (a - 30) / 28), sd = d < 0 ? 1.7 : 4.1, u = (((i % N) + N) % N) * ds, Lp = N * ds, t = u / Lp;
    const f = u => w * w * (3.2 * vnoise(u * .016, sd) + 1.4 * vnoise(u * .045 + a * .02, sd + 5) - 1.2) + Math.max(0, a - 42) * (.04 + .05 * vnoise(u * .01, sd + 9));
    return f(u) * (1 - t) + f(u - Lp) * t; }                            // (blended with itself a loop back: the same where the loop closes)
  const noise = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = noise(xi, zi), b = noise(xi + 1, zi), c = noise(xi, zi + 1), d = noise(xi + 1, zi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  // a strip along the whole loop between two offsets, coloured per vertex
  function strip(d0, d1, col, vary = .08, scale = .35, map = null, tile = 1) {   // (map: a pixel texture, tile: metres it covers, or [across, along])
    const tu = Array.isArray(tile) ? tile[0] : tile, tv = Array.isArray(tile) ? tile[1] : tile;
    if (d0 > d1) [d0, d1] = [d1, d0];                                   // (left to right, so its faces look up)
    const pos = [], colr = [], idx = [], uvs = [], c = new THREE.Color(col), t = new THREE.Color();
    for (let i = 0; i <= N; i++) { const s = S[i % N];
      for (const d of [d0, d1]) { const x = s.p.x + s.r.x * d, z = s.p.z + s.r.z * d, y = s.p.y + hAt((d0 + d1) / 2 < 0 ? -Math.abs(d) : Math.abs(d)) + (Math.abs(d) === KERB && Math.abs(d0) === ROAD ? 0 : 0);
        pos.push(x, s.p.y + hAt(d, i), z); uvs.push(d / tu, i * ds / tv); const k = 1 + (vnoise(x * scale, z * scale) - .5) * 2 * vary + (noise(x * 3.1, z * 3.3) - .5) * vary * .6; t.copy(c).multiplyScalar(k); colr.push(t.r, t.g, t.b); } }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, map })); m.receiveShadow = true; m.userData.ground = true; G.add(m); return m;
  }
  const INNER = Math.sign((90 - S[0].p.x) * S[0].r.x + (0 - S[0].p.z) * S[0].r.z) || 1;   // (which side the loop's inside is on)
  // where the home's street leaves the loop (see homeStreet): no tufts, leaves or flowers across it, the edge line broken there
  const MOUTH = { i: 14, sd: -INNER, half: RG.home ? 8.5 : -1 }, inMouth = (i, d, far = 13) => Math.sign(d) === MOUTH.sd && Math.abs(d) > ROAD - .5 && Math.abs(d) < far && Math.abs((((i - MOUTH.i) % N) + N + N / 2) % N - N / 2) * ds < MOUTH.half;
  const EDGE_OUT = [0, ROAD - .32, ROAD, KERB, KERB + .18, VERGE, PAVE, 14, 20, 28, 38, 52, 72, 84, 88, 100, 135, 170, 200], EDGE_IN = [0, ROAD - .32, ROAD, KERB, KERB + .18, VERGE, PAVE, 14, 20, 28, 40];
  strip(-ROAD + .32, ROAD - .32, '#3f4246', .1, .25, tex.asphalt(), 2.4);   // the asphalt: patchy, grainy
  for (const s of [-1, 1]) {
    strip(s * (ROAD - .32), s * ROAD, '#323437', .16, .5, tex.asphalt(), 2.4);   // the gutter: darker, dirtier
    if (RG.kerb) { strip(s * ROAD, s * KERB, '#9c9a91', .05, .35, tex.kerbBlock(), [1, 4]); strip(s * KERB, s * (KERB + .18), '#cbc8bd', .05, .35, tex.kerbBlock(), [1, 4]); }   // the kerb in metre blocks: its face in shade, its top lit
    else { strip(s * ROAD, s * KERB, '#8f877a', .14, .9, null, 1); strip(s * KERB, s * (KERB + .18), '#a39a88', .16, .9, null, 1); }   // (the village: a gravel shoulder)
    if (RG.city) strip(s * (KERB + .18), s * VERGE, '#a9a393', .05, .5, tex.slabs(), 3.2);   // (the town: slabs right from the kerb)
    else strip(s * (KERB + .18), s * VERGE, RG.kerb ? '#6f8f3e' : '#a39a88', .14, .6, RG.kerb ? tex.grass(0) : null, 1.3);   // the verge (the village: the gravel on)
    if (RG.kerb) strip(s * VERGE, s * PAVE, '#bcb6a6', .05, .5, tex.slabs(), 3.2);        // the pavement, in slabs
    else strip(s * VERGE, s * PAVE, '#8a7a5a', .2, .7, tex.grass(0), 1.6);                 // (the village: a trodden dirt path)
    if (RG.city) strip(s * PAVE, s * 14, '#b3ad9d', .05, .5, tex.slabs(), 3.2);   // (the town: the pavement up to the walls)
    else strip(s * PAVE, s * 14, RG.kerb ? '#7c9a45' : '#86a04a', .16, .12, tex.grass(6), 1.6);         // the lawns (a few flowers)
    for (const [a, b] of (s === INNER ? (RG.city ? [[14, 20], [20, 28], [28, 40], [40, 52]] : [[14, 20], [20, 28], [28, 40]]) : [[14, 20], [20, 28], [28, 38], [38, 52], [52, 72], [72, 84], [88, 100], [100, 135], [135, 170], [170, 200]])) strip(s * a, s * b, '#78963f', .2, .08, tex.grass(2), 2.2);
    if (s !== INNER) { strip(s * 84, s * 88, '#55595e', .06, .5, tex.asphalt(), 3); strip(s * 83.4, s * 84, '#a8a08a', .1, .5, null, 1); strip(s * 88, s * 88.6, '#a8a08a', .1, .5, null, 1); }   // (a country road out there, gravel edges)   // the land beyond, rolling (inside the loop: not so far, the other side of it is there)
  }
  // the road's stretches: three bus stops (painted bays, a shelter on the pavement's far side), bike lanes by the kerb on a few long
  // stretches (red, a white line, a bike painted every so often), and quiet streets with no line down the middle
  const stops = RG.stops.map((f, k) => { const i = Math.round(N * f); return { i, s: i * ds, sd: k % 2 ? -1 : 1, id: k }; });
  const bikeZones = (RG.bike ? [[.25, .34, -1], [.55, .66, 1], [.85, .95, -1]] : []).map(([a, b, sd]) => ({ i0: Math.round(N * a), i1: Math.round(N * b), sd }));
  const quiet = [[.38, .45], [.68, .74]].map(([a, b]) => [Math.round(N * a), Math.round(N * b)]);
  const nearStop = (i, sd, m) => stops.some(q => q.sd === sd && Math.abs(((i - q.i) % N + N + N / 2) % N - N / 2) * ds < m);
  // two police stations by the road (a lost handbag can be handed in there; later: the patrol's base)
  const posts = RG.posts.map((f, k) => { const i = Math.round(N * f); return { i, sd: k % 2 ? 1 : -1, id: k, door: null }; });
  // a bike shop by the road (a stop on the way: parts for the bike, papers for the bag)
  const shops = RG.shops.map(([f, sd], k) => { const i = Math.round(N * f); return { i, sd, id: k, door: null }; });   // (one: you are by it once a lap, not every few hundred metres)
  const nearShop = (i, sd, m) => shops.some(q => q.sd === sd && Math.abs(((i - q.i) % N + N + N / 2) % N - N / 2) * ds < m);
  const nearPost = (i, sd, m) => posts.some(q => q.sd === sd && Math.abs(((i - q.i) % N + N + N / 2) % N - N / 2) * ds < m);
  const cvT = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; };
  const bikeIcon = cvT(16, 16, g => { g.fillStyle = '#fff'; for (const cx of [4, 12]) for (let a = 0; a < 24; a++) g.fillRect(Math.round(cx + Math.cos(a / 24 * 6.283) * 3.2), Math.round(10 + Math.sin(a / 24 * 6.283) * 3.2), 1, 1);
    for (const [x, y] of [[4, 10], [5, 9], [6, 8], [7, 7], [8, 7], [9, 7], [10, 8], [11, 9], [12, 10], [7, 8], [8, 9], [8, 10], [7, 6], [6, 5], [7, 5], [10, 6], [10, 5], [11, 5]]) g.fillRect(x, y, 1, 1); });
  const busWord = cvT(32, 12, g => { g.fillStyle = '#f2c33a'; const L = { B: ['110', '101', '110', '101', '110'], U: ['101', '101', '101', '101', '111'], S: ['011', '100', '010', '001', '110'] }; let x = 4;
    for (const ch of 'BUS') { L[ch].forEach((row, y) => [...row].forEach((v, k) => { if (v === '1') g.fillRect(x + k * 2, 1 + y * 2, 2, 2); })); x += 9; } });
  const decalG = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), decal = (map, i, d, w, l, turn = 0) => { const o = new THREE.Mesh(decalG, toon('#ffffff', { map, alphaTest: .5 })); o.scale.set(w, 1, l); put(o, i, d, .014, turn); o.userData.noShadow = true; return o; };
  // the lines: a dashed one down the middle, a solid one near each edge
  { const pos = [], idx = []; let n = 0; const quad = (i0, i1, d0, d1) => { for (const [i, d] of [[i0, d0], [i0, d1], [i1, d0], [i1, d1]]) { const s = S[i % N]; pos.push(s.p.x + s.r.x * d, s.p.y + .012, s.p.z + s.r.z * d); } idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; };
    const dash = Math.round(3 / ds), gap = Math.round(5 / ds);
    if (RG.lines) for (let i = 0; i < N; i += dash + gap) { if (quiet.some(([a, b]) => i >= a && i <= b)) continue; quad(i, i + dash, -.07, .07); }   // (none on a quiet street)
    for (const z of bikeZones) for (let i = z.i0; i < z.i1; i += 2) { if (nearStop(i, z.sd, 14)) continue; quad(i, i + 2, Math.min(z.sd * 2.2, z.sd * 2.3), Math.max(z.sd * 2.2, z.sd * 2.3)); }   // the bike lane's line
    for (const q of stops) for (let k = -Math.round(11 / ds); k < Math.round(11 / ds); k += 3) quad(q.i + k, q.i + k + 2, Math.min(q.sd * 2.9, q.sd * 3.0), Math.max(q.sd * 2.9, q.sd * 3.0));   // the bay's dashes
    if (RG.lines) for (let i = 0; i < N; i += 2) for (const s of [-1, 1]) if (!inMouth(i, s * 3.2) || ((i * ds) | 0) % 2 === 0) quad(i, i + 2, s * 3.15, s * 3.27);   // (across the home street's mouth: broken)
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon('#e8e4d6')); m.receiveShadow = true; G.add(m); }
  // the bike lanes' red, under the lines; a bike painted on them; BUS in the bays
  { const pos = [], idx = []; let n = 0; const quad = (i0, i1, d0, d1) => { for (const [i, d] of [[i0, d0], [i0, d1], [i1, d0], [i1, d1]]) { const s = S[i % N]; pos.push(s.p.x + s.r.x * d, s.p.y + .011, s.p.z + s.r.z * d); } idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4; };
    for (const z of bikeZones) for (let i = z.i0; i < z.i1; i += 2) { if (nearStop(i, z.sd, 14)) continue; quad(i, i + 2, Math.min(z.sd * 2.3, z.sd * 3.12), Math.max(z.sd * 2.3, z.sd * 3.12)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon('#a3503f', { map: tex.asphalt() })); m.receiveShadow = true; G.add(m); }
  // the small things on the ground, all one mesh (coloured per vertex, lit as the ground is: normals up):
  // leaves (two-tone, pointed) strewn on the road and drifted thick in the gutters and against the kerb; grass tufts hanging over the
  // kerb and along the pavement's edges; flowers in clumps on the verges and at the lawns' edges
  { const pos = [], colr = [], r = mulberry(7), C = c => new THREE.Color(c);
    const g0 = (i, d) => { const fi = Math.floor(i), fr = (i - fi) * ds, s = S[((fi % N) + N) % N]; return [s.p.x + s.r.x * d + s.f.x * fr, s.p.y + hAt(d, fi), s.p.z + s.r.z * d + s.f.z * fr, s]; };
    const tri = (a, b, c, ca, cb = ca, cc = ca) => { pos.push(...a, ...b, ...c); colr.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); };
    const LEAF = [['#d9a441', '#b86a2e'], ['#e08556', '#b3392d'], ['#efc970', '#d9a441'], ['#c98a2e', '#7b5836'], ['#cf5a3e', '#8e2e25'], ['#b86a2e', '#5e1c17'], ['#98b85a', '#7c8446']].map(([a, b]) => [C(a), C(b)]);
    function leaf(i, d, lift = .014) { const [x, y, z, s] = g0(i + r() * .9, d), a = r() * 6.28, L = .12 + r() * .1, w = L * (.5 + r() * .2), fx = Math.cos(a), fz = Math.sin(a), [c1, c2] = LEAF[r() * (r() < .9 ? 6 : 7) | 0];
      const Y = y + lift + r() * .006, tip = [x + fx * L / 2, Y, z + fz * L / 2], back = [x - fx * L / 2, Y, z - fz * L / 2], lft = [x - fz * w / 2, Y, z + fx * w / 2], rgt = [x + fz * w / 2, Y, z - fx * w / 2];
      tri(back, tip, lft, c1); tri(back, rgt, tip, c2); }                // (lit half, shaded half: a leaf's fold)
    for (let k = 0; k < 2200; k++) leaf(r() * N, (r() - .5) * 2 * (ROAD - .4));                                 // strewn on the road
    for (let k = 0; k < 17000; k++) { const i = r() * N, clump = vnoise(i * .045, 3.1); if (clump < .32 && r() < .85) continue;   // drifted in the gutters (in heaps, not evenly)
      const sd = r() < .5 ? -1 : 1; leaf(i, sd * (ROAD - .015 - Math.pow(r(), 2.4) * .5), .014 + r() * .02); }
    for (let k = 0; k < 4200; k++) { const sd = r() < .5 ? -1 : 1, i = r() * N, d = sd * (KERB + .02 + Math.pow(r(), 1.6) * .7); if (!inMouth(i, d)) leaf(i, d, .02); }   // on the kerb's top and the verge's edge
    // grass: a tuft is three blades, dark at the root, light (now and then dry) at the tip
    const ROOT = [C('#284a2b'), C('#355f31')], TIP = [C('#5b8a3c'), C('#77a146'), C('#98b85a'), C('#c2cf7e'), C('#d9a441')];
    function tuft(i, d, h, lean) { if (inMouth(i, d)) return; const [x, y, z, s] = g0(i, d), rx = s.r.x, rz = s.r.z, fx = s.f.x, fz = s.f.z;
      for (let b = 0; b < 3; b++) { const o = (b - 1) * .025 + (r() - .5) * .02, bx = x + fx * o, bz = z + fz * o, hh = h * (.7 + r() * .5), ln = lean + (r() - .5) * .05, tw = (r() - .5) * .05;
        const w = .022, root = ROOT[r() * 2 | 0], tip = TIP[r() < .08 ? 4 : (r() * 4 | 0)];
        tri([bx - fx * w, y, bz - fz * w], [bx + fx * w, y, bz + fz * w], [bx + rx * ln + fx * tw, y + hh, bz + rz * ln + fz * tw], root, root, tip); } }
    for (const sd of RG.city ? [] : [-1, 1]) {
      for (let i = 0; i < N; i += .09 / ds * (.6 + r() * .8)) tuft(i, sd * (KERB + .2 + r() * .1), .11 + r() * .12, -sd * (.06 + r() * .08));   // over the kerb's top, leaning out to the road
      for (let i = 0; i < N; i += .3 / ds * (.5 + r())) tuft(i, sd * (VERGE - .03 - r() * .05), .06 + r() * .07, sd * .02);                  // the verge against the pavement
      for (let i = 0; i < N; i += .3 / ds * (.5 + r())) tuft(i, sd * (PAVE + .03 + r() * .06), .07 + r() * .08, sd * .03);                   // the lawn against the pavement
      for (let k = 0; k < 1800; k++) tuft(r() * N, sd * (KERB + .35 + r() * (VERGE - KERB - .5)), .06 + r() * .06, (r() - .5) * .06);      // tufts about the verge
    }
    // flowers: a stem and a small head, in clumps (mostly white, some yellow, pink, lilac, red)
    const STEM = C('#467537'), HEAD = ['#f6f3ea', '#f6f3ea', '#f6f3ea', '#efc970', '#f3a6c0', '#b7a4e0', '#cf5a3e'].map(C), EYE = C('#efc970');
    function flower(x, y, z, h, col) { const t = [x, y + h, z], e = .028;
      tri([x - .008, y, z], [x + .008, y, z], t, STEM, STEM, STEM);
      const T = [x, y + h + e, z], Bm = [x, y + h - e * .5, z], P = [[x + e, y + h, z], [x, y + h, z + e], [x - e, y + h, z], [x, y + h, z - e]];
      for (let k = 0; k < 4; k++) { const a = P[k], b = P[(k + 1) % 4]; tri(a, b, T, col, col, col === HEAD[0] ? EYE : col); tri(b, a, Bm, col); } }
    for (let k = 0; k < 900; k++) { const sd = r() < .5 ? -1 : 1, lawn = r() < .6, i = r() * N, d = sd * (lawn ? PAVE + .25 + Math.pow(r(), 1.6) * 3.5 : KERB + .45 + r() * (VERGE - KERB - .7)), col = HEAD[r() * HEAD.length | 0];   // (more of them, and into the lawns, thinning away from the pavement)
      if (inMouth(i, d)) continue; const [cx, , cz, s] = g0(i, d); for (let f = 0; f < 5 + (r() * 9 | 0); f++) { const a = r() * 6.28, rr = Math.sqrt(r()) * .32, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        flower(x, s.p.y + hAt(d, i), z, .07 + r() * .13, r() < .8 ? col : HEAD[r() * HEAD.length | 0]); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    const nr = new Float32Array(pos.length); for (let k = 1; k < nr.length; k += 3) nr[k] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nr, 3));   // (lit as the ground under them)
    const m = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })); m.receiveShadow = true; G.add(m); }

  // ---------- the things along it ----------
  let rnd = mulberry(11);   // (let: the home's street is built on a stream of its own, see homeStreet, so the rest of the map stays as it was)
  // ---------- what stops a bike, and what a paper can hit ----------
  const things = [], bundles = [], ramps = [], puddles = [];   // (puddles: { x, z, r, mud } what a wheel splashes through)
  const floors = [], floorGrid = new Map(), FC = 8, fkey = (x, z) => Math.floor(x / FC) + ',' + Math.floor(z / FC);
  function floor(h, cx, cz, hx, hz, top) { h.updateMatrixWorld(true); const p = h.localToWorld(new THREE.Vector3(cx, top, cz)), yaw = h.rotation.y, F = { x: p.x, z: p.z, y: p.y, c: Math.cos(yaw), s: Math.sin(yaw), hx, hz };
    floors.push(F); const r = Math.max(hx, hz); for (const ox of [-r, 0, r]) for (const oz of [-r, 0, r]) { const k = fkey(p.x + ox, p.z + oz); if (!floorGrid.has(k)) floorGrid.set(k, new Set()); floorGrid.get(k).add(F); } }
  function floorAt(x, z) { let y = -Infinity; for (const F of floorGrid.get(fkey(x, z)) || []) { const dx = x - F.x, dz = z - F.z, lx = dx * F.c - dz * F.s, lz = dx * F.s + dz * F.c; if (Math.abs(lx) <= F.hx && Math.abs(lz) <= F.hz && F.y > y) y = F.y; } return y; }   // (what a kick or a bike reaches: { kind: tree | bush | pole | mailbox | swing | cone, o, ... })
  const colliders = [], BK = 16, NB = Math.ceil(N / BK), buckets = Array.from({ length: NB }, () => []), windows = [], doors = [];
  // places a tree must not grow in: a drive, a path, a porch (kept here, not in the colliders: nothing stops a bike there)
  const keepOut = [];
  const show = { house: [], tree: [], shacks: [], farm: [] }, rr = mulberry(53);   // (rr: for what came later, so the older layout stays)   // (what was built, one by one: for the workshop)
  function zone(o, hx, hz, ox = 0, oz = 0) { const yaw = o.rotation.y, c = Math.cos(yaw), sn = Math.sin(yaw); keepOut.push({ x: o.position.x + ox * c + oz * sn, z: o.position.z - ox * sn + oz * c, c, s: sn, hx, hz }); }
  function free(i, d, r, zones = true) {                              // (zones: false for a path, which minds only what stands: its own way is a zone)                                             // (nothing there: a house, a car, a fence, a drive, a porch)
    const p = at(i, d), over = C => { const dx = p.x - C.x, dz = p.z - C.z, lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; return Math.abs(lx) < C.hx + r && Math.abs(lz) < C.hz + r; };
    for (const C of near(i)) if (C.kind === 'hard' || C.kind === 'soft') { if (over(C)) return false; }
    if (zones) for (const Z of keepOut) if (Math.abs(Z.x - p.x) + Math.abs(Z.z - p.z) < 40 && over(Z)) return false;
    return true;
  }
  function hit(o, spec, i, ox = 0, oz = 0) {                         // spec in o's space ({ hx, hz, h, kind }), o already placed (i: where along the road)
    const yaw = o.rotation.y, c = Math.cos(yaw), sn = Math.sin(yaw), x = o.position.x + ox * c + oz * sn, z = o.position.z - ox * sn + oz * c;
    const C = { x, z, c, s: sn, hx: spec.hx, hz: spec.hz, h: spec.h, y0: o.position.y, kind: spec.kind, size: spec.size, i, o, used: false }; colliders.push(C);
    if (spec.car) { C.car = true; spec.car.updateMatrixWorld(true); C.roof = new THREE.Box3().setFromObject(spec.car).max.y; }   // (a car: its roof can be ridden on)
    const reach = Math.ceil(Math.max(spec.hx, spec.hz) / ds / BK) + 1, b0 = Math.floor(i / BK);
    for (let k = -reach; k <= reach; k++) buckets[((b0 + k) % NB + NB) % NB].push(C); return C;
  }
  function near(i) { const b0 = Math.floor(((i % N) + N) % N / BK), out = new Set(); for (let k = -1; k <= 1; k++) for (const C of buckets[((b0 + k) % NB + NB) % NB]) out.add(C); return out; }
  const at = (i, d, y = 0) => { const s = S[((i % N) + N) % N], x = s.p.x + s.r.x * d, z = s.p.z + s.r.z * d; return new THREE.Vector3(x, (Math.abs(d) > ROAD + .6 ? meshY(x, z, ((i % N) + N) % N) : s.p.y + hAt(d, i)) + y, z); };   // (off the road: the ground as drawn)
  const yawOf = i => { const f = S[((i % N) + N) % N].f; return Math.atan2(f.x, f.z); };   // (a thing's +z along the road)
  const put = (o, i, d, y = 0, turn = 0) => { o.position.copy(at(i, d, y)); o.rotation.y = yawOf(i) + turn; o.traverse(c => { if (c.isMesh && !c.userData.noShadow) { c.castShadow = true; c.receiveShadow = true; } }); G.add(o); return o; };
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
  const WALLS = RG.walls || ['#b7c29a', '#e8dcc0', '#f0ece2', '#e3c77e', '#a9bccb', '#d8b8a0'], ROOFS = (RG.roofs || ['#8e3b2c', '#6d4a3a', '#5a5f66', '#9a4a32']).map(c => toon(c, { map: tex.shingles() }));   // (the roofs' UVs are in metres: a texture a metre)
  const wallM = (c, w, h) => { const t = tex.siding().clone(); t.repeat.set(w / 1.3, h / 1.3); t.needsUpdate = true; return toon(c, { map: t }); };   // (boards about 16 cm)
  const white = toon('#f3efe4'), dark = toon('#2a2c30'), glass = toon('#3f5566'), grey = toon('#8d9194'), red = toon('#b3372c');
  const wood = toon('#6b4a2e', { map: (() => { const t = tex.bark().clone(); t.repeat.set(1, 6); t.needsUpdate = true; return t; })() });
  const SHUT = ['#2f4a3a', '#34465a', '#5a2f2a', '#3a3530'].map(c => toon(c)), woodBox = toon('#6b4a2e');
  // small painted textures for the houses (in colour: their materials are white)
  const paint = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  // a window's glass: dark, the sky's streak across it, curtains drawn to the sides and a pelmet over them
  const WINS = ['#e9e3d1', '#f6f3ea', '#efc970', '#d8b8a0'].map(cur => toon('#ffffff', { map: paint(16, 16, g => {
    g.fillStyle = '#2b3d49'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#3a5261'; g.fillRect(0, 0, 16, 6);
    g.fillStyle = '#8fb0bd'; for (let k = 0; k < 7; k++) g.fillRect(4 + k, 9 - k, 2, 1); g.fillStyle = '#6c8796'; for (let k = 0; k < 4; k++) g.fillRect(9 + k, 12 - k, 1, 1);
    g.fillStyle = cur; g.fillRect(0, 0, 3, 16); g.fillRect(13, 0, 3, 16); g.fillRect(0, 0, 16, 2);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (const x of [1, 14]) g.fillRect(x, 2, 1, 14); }) }));
  // bricks for the chimneys
  const brickM = toon('#ffffff', { map: paint(16, 16, g => { g.fillStyle = '#c9b8a0'; g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -3 : 0; x < 16; x += 6) { g.fillStyle = ['#8e3b2c', '#9a4a32', '#7b3326', '#a3522a'][(x + y * 3 + 16) % 4]; g.fillRect(x, y, 5, 3); } }, 1, 2) });
  const STRIPE = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d'); for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#f6f3ea' : '#cf5a3e'; g.fillRect(k * 2, 0, 2, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; return t; })();   // (a lounger's canvas)
  const stoneM = toon('#9d9a92', { map: (() => { const t = tex.slabs().clone(); t.repeat.set(3, .5); t.needsUpdate = true; return t; })() }), trimM = white, gutterM = toon('#e3ded2');
  const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
  const BLOOM = [['#f3a6c0', '#f6f3ea'], ['#f6f3ea', '#ffe27a'], ['#e0503f', '#f3a6c0'], ['#b7a4e0', '#f6f3ea']].map(cs => toon('#5a8a3c', { map: rep(tex.bloom(cs), 2, 1) }));
  const bushM = toon('#4f7a3a', { map: rep(tex.leaves(), 2, 2) }), garM = toon('#f0ece2', { map: rep(tex.siding(), 2, 1.6) });
  const garA = toon('#8e969c', { map: rep(tex.siding(), 2, 2.4) });   // (the annex's door, of grey tin)
  const driveM = toon('#9d9a92', { map: rep(tex.slabs(), 1, 3) }), pathM = toon('#c9c3b3', { map: rep(tex.slabs(), .6, 3) });
  // a bush of a few leafy balls, perhaps in flower (in its parent's space)
  function bush(parent, x, z, r, flowers) { const parts = []; for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (.7 + rnd() * .5), 1), flowers ? BLOOM[rnd() * BLOOM.length | 0] : bushM);
    b.position.set(x + (rnd() - .5) * r * 1.6, r * .7, z + (rnd() - .5) * r); b.scale.y = .8; parent.add(b); parts.push(b); } things.push({ kind: 'bush', o: parts[0], parts, r: r * 1.1, top: r * 1.3, flowers: !!flowers }); }
  const binMs = ['#3f6b35', '#44484c', '#2f4a3a', '#e3b83a'].map(c => toon(c)), soilM = toon('#4a3524'), flagW = toon('#f6f3ea'), flagR = toon('#c8323a');
  function bin() { const b = new THREE.Group(), m = toon(['#3f6b35', '#2f4a3a', '#44484c'][rnd() * 3 | 0]); b.add(box(.58, .95, .7, m, 0, .52, 0)); b.add(box(.64, .07, .76, m, 0, 1.02, .02));
    for (const x of [-.26, .26]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .06, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(x, .1, .33); b.add(w); } return b; }
  const hedgeM = toon('#3f6b35', { map: (() => { const t = tex.leaves().clone(); t.repeat.set(5, 1.2); t.needsUpdate = true; return t; })() });
  const seats = [], binsO = [];                                        // (binsO: the bins by the road, at the stops, in the parks: something can go in them)                                                   // (chairs and loungers in the front gardens, for the people who sit out)
  const standCars = [];   // (the cars stood by the houses: looked over once all is built, see below)
  const courses = [], gnomes = [];
  const mailboxes = [], lots = [], CARS = createCars({ THREE, toon }), P = createProps({ THREE, toon, tex }), NAT = createNature({ THREE, toon, tex }), nr = mulberry(83);   // (nr: the nature's own random)
  const NATK = { natBush: r => NAT.bush(r, ['round', 'round', 'box', 'flower', 'fern', 'tall'][r() * 6 | 0]), natFlowers: r => NAT.flowers(r, ['tulip', 'daisy', 'lupin', 'sunflower'][r() * 4 | 0]), natRocks: r => NAT.rocks(r), natLeaves: r => NAT.leaves(r) };
  // the ground's height at a point off the road (the station nearest along the road, the distance across it), as the ground is made
  const slab = o => { o.userData.slab = true; return o; };           // (a thing laid flat on the ground: a drive, a path)
  function groundAt(x, z, i0) { let best = i0, bd = 1e9; for (let k = -70; k <= 70; k++) { const j = ((i0 + k) % N + N) % N, s = S[j], a = Math.abs((x - s.p.x) * s.f.x + (z - s.p.z) * s.f.z); if (a < bd) { bd = a; best = j; } }
    return meshY(x, z, best); }
  // the ground's height as it is drawn: the land is laid in strips across the road, one per station; on a bend the strips fan out, so a
  // point far off is not on its nearest station's line but between two of them: found, and the height taken between theirs (as the
  // triangles between them have it)
  // across the road the land is straight between the strips' edges (see strip()): its height so, not the curve hAt draws through them
  function hLin(d, i) { const a = Math.abs(d), sg = d < 0 ? -1 : 1, E = sg === INNER ? EDGE_IN : EDGE_OUT; if (a >= E[E.length - 1]) return hAt(d, i);
    for (let k = 1; k < E.length; k++) if (a <= E[k]) { const t = (a - E[k - 1]) / (E[k] - E[k - 1]); return hAt(sg * E[k - 1], i) * (1 - t) + hAt(sg * E[k], i) * t; } return hAt(d, i); }
  function meshY(x, z, i0) {
    for (let k = 0; k <= 8; k++) for (const sg of k ? [-1, 1] : [1]) { const j = ((i0 + sg * k) % N + N) % N, j1 = (j + 1) % N, A = S[j], B = S[j1];
      const a = (x - A.p.x) * A.f.x + (z - A.p.z) * A.f.z, b = (x - B.p.x) * B.f.x + (z - B.p.z) * B.f.z; if (a < 0 || b >= 0) continue;
      const t = a / (a - b), da = (x - A.p.x) * A.r.x + (z - A.p.z) * A.r.z, db = (x - B.p.x) * B.r.x + (z - B.p.z) * B.r.z;
      return (A.p.y + hLin(da, j)) * (1 - t) + (B.p.y + hLin(db, j1)) * t; }
    const s = S[i0], d = (x - s.p.x) * s.r.x + (z - s.p.z) * s.r.z; return s.p.y + hLin(d, i0); }
  // a lot on a slope: the house up to the highest ground under it (a deeper plinth hides the gap on the low side), and each thing on
  // the lot (a car, a bush, a swing, a bin, a chair, the fence at the back) set down on the ground where it stands, not buried, not hanging
  // a slab laid on the ground (a drive, a path, a yard's concrete, mud): not a flat board tilted, which leaves a gap on one side and goes
  // under the grass on the other, but bent to the ground under it point by point (a vertex every ~70 cm), its edge sunk a little into it
  function drape(c, h, i, top, thick = c.userData.thick ?? .03, deep = .18) {
    c.rotation.x = c.rotation.z = 0; c.position.y = 0; h.updateMatrixWorld(true); let g = c.geometry; const p = g.parameters || {};
    if (g.type === 'BoxGeometry') g = new THREE.BoxGeometry(p.width, 1, p.depth, Math.max(1, Math.ceil(p.width / .7)), 1, Math.max(1, Math.ceil(p.depth / .7)));
    else if (g.type === 'CylinderGeometry') g = new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, 1, p.radialSegments, 1);
    const pos = g.attributes.position, v = new THREE.Vector3(), M = c.matrixWorld;
    for (let k = 0; k < pos.count; k++) { v.set(pos.getX(k), 0, pos.getZ(k)).applyMatrix4(M); const gy = groundAt(v.x, v.z, i) - top; pos.setY(k, pos.getY(k) > 0 ? gy + thick : gy - deep); }
    pos.needsUpdate = true; g.computeVertexNormals(); c.geometry = g; c.userData.draped = true; }
  // a plot set on the ground: as a house is (settle), and its loose meshes too (a tyre, a pallet, a plank) down to the ground under each, and
  // whoever stands there (a seat) on it as well
  function onSlope(h, i, W, D) { settle(h, i, W, D); const v = new THREE.Vector3();
    for (const c of h.children) { if (!c.isMesh || c.userData.slab || c.geometry.type === 'IcosahedronGeometry') continue; c.getWorldPosition(v); c.position.y += groundAt(v.x, v.z, i) - h.position.y; }
    h.updateMatrixWorld(true); for (const q of seats) if (q.h === h) { h.localToWorld(v.copy(q.local)); q.local.y = groundAt(v.x, v.z, i) - h.position.y; } }
  function settle(h, i, W, D) { h.updateMatrixWorld(true); const v = new THREE.Vector3();
    let top = -1e9; for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [0, 0]]) { h.localToWorld(v.set(x, 0, z)); top = Math.max(top, groundAt(v.x, v.z, i)); }
    h.position.y = top; h.updateMatrixWorld(true);
    for (const c of h.children) if (c.userData.slab) drape(c, h, i, top);
    for (const c of h.children) { if (!(c.isGroup || (c.isMesh && c.geometry.type === 'IcosahedronGeometry')) || c.userData.onHouse) continue;   // (onHouse: fixed to the house, as a flag on its wall)
      c.getWorldPosition(v); c.userData.dy = groundAt(v.x, v.z, i) - top; c.position.y += c.userData.dy; }
    for (const q of seats) if (q.h === h && q.chair) q.local.y += q.chair.userData.dy || 0; }
  // a tarpaulin thrown over a car's back: a sheet laid on the car (each point of it dropped from above onto the body), past its sides
  // hanging down, creased (darker in the folds), two ropes over it. In the car's own space; the car still at its origin
  function tarpOver(car, r) { const g0 = car.group; g0.updateMatrixWorld(true); const rc = new THREE.Raycaster(), hx = car.half[0], hz = car.half[1], NX = 12, NZ = 14, z0 = -hz * 1.02, z1 = hz * .25, pos = [], col = [], idx = [], cc = new THREE.Color(), base = new THREE.Color(['#3f6fb0', '#8a7650', '#6b737a'][r() * 3 | 0]), dark = base.clone().multiplyScalar(.62);   // (a blue plastic one, canvas, or grey)
    const top = (x, z) => { rc.set(new THREE.Vector3(x, 4, z), new THREE.Vector3(0, -1, 0)); const hit = rc.intersectObject(g0, true).find(q => q.object.visible); return hit ? hit.point.y : null; };
    const ph = r() * 6.28; for (let a = 0; a <= NZ; a++) for (let b = 0; b <= NX; b++) { const z = z0 + (z1 - z0) * a / NZ, u = b / NX * 2 - 1, x = u * (hx + .22);
      let y = top(Math.max(-hx * .97, Math.min(hx * .97, x)), z); if (y == null) y = .5; const over = Math.max(0, Math.abs(x) - hx * .9) / .32;   // (past the body's side: hanging)
      y = y * (1 - Math.min(1, over)) + (.42 + (1 - Math.min(1, over)) * .1) * Math.min(1, over); const crease = Math.sin(x * 7 + z * 3.1 + ph) * Math.sin(z * 5.3 - x * 2 + ph * 2);
      y += .03 + crease * .018 - (a === NZ ? .05 : 0); pos.push(x * (1 + over * .04), y, z); cc.copy(base).lerp(dark, Math.max(0, -crease) * .7 + over * .25); col.push(cc.r, cc.g, cc.b); }
    for (let a = 0; a < NZ; a++) for (let b = 0; b < NX; b++) { const p0 = a * (NX + 1) + b, p1 = p0 + NX + 1; idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const tarp = new THREE.Group(), sheet = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })); sheet.castShadow = true; tarp.add(sheet);
    // the ropes: over it and down each side, where it is tied
    const rope = toon('#c9b98a'); for (const zr of [z0 + (z1 - z0) * .3, z0 + (z1 - z0) * .75]) { let prev = null; for (let b = 0; b <= NX; b++) { const k = Math.round((zr - z0) / (z1 - z0) * NZ) * (NX + 1) + b, p = new THREE.Vector3(pos[k * 3], pos[k * 3 + 1] + .012, pos[k * 3 + 2]);
        if (prev) { const l = prev.distanceTo(p), m = new THREE.Mesh(new THREE.BoxGeometry(.018, .018, l), rope); m.position.copy(prev).lerp(p, .5); m.lookAt(p); tarp.add(m); } prev = p; } }
    return tarp; }
  function house(i, side, spot = null) {   // spot: { x, z, n (the way it faces), two, garage, open, porch, car } (a house off the loop: the home's street)                                          // side +1 right, -1 left; its front towards the road
    const yard = [];   // (what stands on the lot and stops a bike: made into colliders once the house stands where it does)
    const h = new THREE.Group(), W = 8 + rnd() * 3, D = 7 + rnd() * 2, H = 2.9 + rnd() * .6, wallC = WALLS[rnd() * WALLS.length | 0], roof = ROOFS[rnd() * ROOFS.length | 0];
    const two = spot?.two ?? rnd() < .35, HH = two ? H * 1.9 : H, wall = wallM(wallC, W, HH);
    h.add(box(W, HH, D, wall, 0, HH / 2, 0));
    h.add(box(W + .14, .36, D + .14, stoneM, 0, .18, 0)); h.add(box(W + .1, 1.4, D + .1, stoneM, 0, -.7, 0));   // the foundation (and under it, for a lot on a slope)
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) h.add(box(.18, HH, .18, trimM, x, HH / 2, z));   // corner boards
    if (two) h.add(box(W + .06, .12, D + .06, trimM, 0, H, 0));                                                // a band between the floors
    const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .4, 0); tri.lineTo(D / 2 + .4, 0); tri.lineTo(0, 2.2); tri.closePath();
    const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .6, bevelEnabled: false }); rg.translate(0, 0, -(W + .6) / 2); const r = new THREE.Mesh(rg, roof); r.rotation.y = Math.PI / 2; r.position.y = HH; h.add(r);
    { const L = W + .6, e = D / 2 + .4, ang = Math.atan2(2.2, e), len = Math.hypot(e, 2.2);
      for (const z of [-e, e]) { h.add(box(L, .17, .06, trimM, 0, HH - .02, z)); h.add(box(L, .09, .12, gutterM, 0, HH - .12, z + Math.sign(z) * .06)); }   // fascia, gutter
      for (const x of [-L / 2 - .02, L / 2 + .02]) for (const sg of [-1, 1]) { const b = box(.07, .17, len, trimM, x, HH + 1.1, sg * e / 2); b.rotation.x = sg * ang; h.add(b); }   // the gables' boards
      h.add(box(L + .08, .1, .24, dark, 0, HH + 2.2, 0)); }                                                       // the ridge
    // the front (towards -z in its own space, which faces the road): windows, a door, a porch
    const wins = [], fz = -D / 2 - .03, garage = spot?.garage ?? rnd() < .35, annex = !garage && !spot && rnd() < .32, as = rnd() < .5 ? -1 : 1, ax = as * (W / 2 + 1.75), gx = W / 2 - 1.9, shut = rnd() < .65 ? SHUT[rnd() * SHUT.length | 0] : null, boxes = rnd() < .45;
    const winM = WINS[rnd() * WINS.length | 0];
    const win = (x, y) => { wins.push([x, y]); h.add(box(1.3, 1.2, .08, white, x, y, fz)); h.add(box(1.06, .96, .1, winM, x, y, fz - .02)); h.add(box(1.46, .12, .16, white, x, y + .64, fz - .05)); h.add(box(.06, .96, .12, white, x, y, fz - .03)); h.add(box(1.06, .06, .12, white, x, y + .05, fz - .03));   // frame, pane, bars
      h.add(box(1.4, .08, .22, white, x, y - .62, fz - .08));                                                        // the sill
      if (shut) for (const sx of [-.86, .86]) { h.add(box(.4, 1.18, .06, shut, x + sx, y, fz - .02)); for (let k = -2; k <= 2; k++) h.add(box(.34, .03, .08, shut, x + sx, y + k * .2, fz - .05)); }
      if (boxes && y < 2.5) { h.add(box(1.2, .22, .26, woodBox, x, y - .78, fz - .15)); h.add(box(1.1, .22, .22, BLOOM[rnd() * BLOOM.length | 0], x, y - .6, fz - .15)); } };
    for (const x of garage ? [-W * .3] : [-W * .32, W * .32]) for (const y of two ? [1.5, 1.5 + H] : [1.5]) win(x, y);
    if (garage && two) win(gx, 1.5 + H);
    const dx = garage ? -W * .02 : 0;
    h.add(box(1.0, 2.1, .1, toon(['#5a3a2a', '#2f4a5a', '#7a2f28', '#3f6b35'][rnd() * 4 | 0]), dx, 1.05, fz - .02)); h.add(box(1.2, .1, .14, white, dx, 2.15, fz - .03));   // the door, its head
    h.add(box(.06, .06, .06, toon('#c9a063'), dx + .35, 1.0, fz - .1));                                                              // its knob
    { const dm = toon(['#6a4a36', '#3a5a6a', '#8e3b2c', '#4f7a3a'][rnd() * 4 | 0]); for (const [x, y] of [[-.22, .45], [.22, .45], [-.22, 1.05], [.22, 1.05]]) h.add(box(.3, .42, .03, dm, dx + x, y, fz - .08));   // its panels
      h.add(box(.62, .32, .03, winM, dx, 1.72, fz - .08));                                                                      // its window
      h.add(box(.14, .22, .12, dark, dx + .78, 1.9, fz - .06)); h.add(box(.08, .12, .1, new THREE.MeshBasicMaterial({ color: '#ffe9b0' }), dx + .78, 1.88, fz - .1)); }   // a lamp by it
    if (garage && spot?.open) {   // (open: the garage stands out of the front 1.4 m, its door rolled up; inside, lit, what a family keeps in one)
      const GZ = 1.4, z0 = fz - GZ, sideM = toon(wallC), inM = toon('#6d6a64'), shelfM = toon('#8a6a44'), metal = toon('#9a9c9e');
      for (const sx of [-1.45, 1.45]) { h.add(box(.16, 2.35, GZ, sideM, gx + sx, 1.17, fz - GZ / 2)); yard.push([{ hx: .1, hz: GZ / 2, h: 2.3, kind: 'hard' }, gx + sx, fz - GZ / 2]); }
      h.add(box(3.06, .16, GZ + .04, sideM, gx, 2.4, fz - GZ / 2)); h.add(box(3.1, .3, .14, garM, gx, 2.18, z0 + .02)); h.add(box(3.2, .1, .16, white, gx, 2.36, z0 + .01));   // (its roof, the rolled door, the trim)
      h.add(box(2.74, 2.3, .03, inM, gx, 1.15, fz - .02)); h.add(slab(box(2.74, .03, GZ, toon('#8f8c85'), gx, .015, fz - GZ / 2)));   // (the back wall inside, the concrete floor)
      h.add(box(2.74, .03, GZ, toon('#4f4d49'), gx, 2.3, fz - GZ / 2)); h.add(box(.5, .05, .12, new THREE.MeshBasicMaterial({ color: '#fff3cf' }), gx, 2.26, fz - GZ / 2));   // (the ceiling, its tube light)
      for (const y of [.75, 1.4]) h.add(box(1.5, .04, .34, shelfM, gx - .55, y, fz - .2)); for (const x of [-1.27, .17]) h.add(box(.04, 1.5, .34, shelfM, gx + x, .75, fz - .2));   // the shelves on the left
      for (let k = 0; k < 7; k++) h.add(box(.2 + (k % 3) * .08, .18 + (k % 2) * .08, .26, toon(['#c23a2e', '#3d7be0', '#e3b83a', '#5f8f3a', '#9a9c9e', '#d9c7a0', '#7a5636'][k]), gx - 1.1 + (k % 4) * .34, (k < 4 ? .87 : 1.52), fz - .2));   // (paint tins, boxes, a toolbox)
      h.add(box(.9, .05, .55, toon('#7a5a3a'), gx + .75, .85, fz - .32)); for (const x of [.36, 1.14]) h.add(box(.05, .85, .05, toon('#5a4030'), gx + x, .42, fz - .32));   // the workbench on the right
      h.add(box(.7, .5, .02, toon('#5a4a3a'), gx + .75, 1.45, fz - .05)); for (let k = 0; k < 5; k++) h.add(box(.03, .26 - (k % 2) * .08, .03, metal, gx + .5 + k * .12, 1.45, fz - .08));   // (the board of tools over it)
      { const wh = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 16), toon('#26272a')); wh.position.set(gx + 1.15, 1.7, fz - .1); h.add(wh); }   // (a spare wheel hung on the wall)
      h.add(box(.45, .55, .4, toon('#3a5a3a'), gx + .2, .28, fz - .5)); h.add(box(.5, .12, .5, toon('#2f4a6e'), gx - .9, .06, fz - .9));   // (a bag of compost, a crate on the floor)
      h.userData.lay = { gx, dx, D, fz, GZ }; }
    else if (garage) { const gd = box(2.8, 2.2, .1, garM, gx, 1.1, fz - .02); h.add(gd); h.add(box(3.0, .12, .14, white, gx, 2.27, fz - .03)); }
    // the annex: a single-storey garage built on at one side, its front flush with the house's; a flat roof with a fascia, its own door
    const aw = 3.3, ad = Math.min(D - .4, 6), ah = 2.7, azc = fz + .03 + ad / 2;
    if (annex) { h.add(box(aw, ah, ad, wall, ax, ah / 2, azc)); h.add(box(aw + .1, 1.4, ad + .1, stoneM, ax, -.7, azc)); h.add(box(aw + .12, .3, ad + .12, stoneM, ax, .15, azc));
      const rf = box(aw + .3, .14, ad + .3, dark, ax, ah + .07, azc); rf.rotation.x = -.04; h.add(rf); h.add(box(aw + .34, .1, .1, trimM, ax, ah + .02, fz - .16));
      h.add(box(2.6, 2.1, .1, garA, ax, 1.05, fz - .02)); h.add(box(2.8, .12, .14, white, ax, 2.2, fz - .03)); for (const x of [-aw / 2, aw / 2]) h.add(box(.16, ah, .16, trimM, ax + x, ah / 2, fz + .02)); }
    const drv = garage || annex, dvx = garage ? gx : ax, path = !garage || rr() < .7;   // (a path to the door: always without a garage, mostly with one too)                                            // (a drive: to the garage, in the house or in the annex)
    let porch = null; if (spot?.porch ?? rnd() < .7) { const pz = fz - 1.1, pw = garage ? 2.6 : 3.4, px0 = dx; porch = { pw, px0 };                                                          // a porch: its floor, steps, roof, posts, rails
      h.add(box(pw, .3, 2.2, white, px0, .15, fz - 1.1)); h.add(box(pw - .04, 1.2, 2.9, stoneM, px0, -.6, fz - 1.4)); for (const [k, y] of [[0, .1], [1, .2]]) h.add(box(1.2, .1 + y * 0, .32, white, px0, .05 + k * .1, fz - 2.3 + k * .3));
      h.add(box(pw + .4, .14, 2.4, roof, px0, 2.55, pz)); for (const x of [-pw / 2 + .1, pw / 2 - .1]) h.add(box(.16, 2.3, .16, white, px0 + x, 1.4, pz - 1));
      for (const sgn of [-1, 1]) { const x0 = px0 + sgn * pw / 2 - sgn * .1, a = sgn < 0 ? x0 : px0 + .7, b = sgn < 0 ? px0 - .7 : x0;
        h.add(box(Math.abs(b - a), .06, .06, white, (a + b) / 2, 1.1, pz - 1)); for (let x = Math.min(a, b); x <= Math.max(a, b); x += .16) h.add(box(.04, .8, .04, white, x, .7, pz - 1)); } }
    if (rnd() < .6) { h.add(box(.62, 1.6, .62, brickM, W * .3, HH + 1.5, D * .1)); h.add(box(.76, .12, .76, stoneM, W * .3, HH + 2.34, D * .1)); }   // a chimney, brick, capped
    // to the pavement: a drive to the garage, or a path of slabs to the door; bushes and beds along the front
    const gap = 6.5 + rnd() * 2; if (h.userData.lay) h.userData.lay.gap = gap;
    if (drv) h.add(slab(box(3.0, .04, gap + .2, driveM, dvx, .02, -D / 2 - gap / 2))); if (path) h.add(slab(box(1.1, .04, gap, pathM, dx, .025, -D / 2 - gap / 2)));
    for (let k = 0; k < 3 + (rnd() * 3 | 0); k++) { const x = (rnd() - .5) * (W - 1.5); if (Math.abs(x - dx) < 1.2 || (drv && Math.abs(x - dvx) < 1.8)) continue; bush(h, x, fz - .6 - rnd() * .4, .45 + rnd() * .3, rnd() < .45); }
    const taken = [];                                                   // (what stands in the front garden already: [x, z, room])
    if (rnd() < .5) { const bn = bin(); bn.position.set(garage ? gx + 2 : W / 2 - .6, 0, fz - 1.2 - rnd()); bn.rotation.y = (rnd() - .5) * .5; h.add(bn); taken.push([bn.position.x, bn.position.z, .5]); }
    // the street's furniture on the lot: the bins put out for the morning at its edge by the pavement (a mixed one and a yellow one),
    // a bed of flowers under a window, and now and then a flag on the front, white and red, on a pole out from the wall
    const extraHits = [];
    if (rr() < .45) { const zE = -D / 2 - gap + .55, bx = drv ? dvx + (dvx > 0 ? -2.3 : 2.3) : dx + (rr() < .5 ? -1.5 : 1.5), m0 = binMs[rr() * 3 | 0];
      for (const [k, m] of [[0, m0], [1, binMs[3]]]) { const b = new THREE.Group(); b.add(box(.58, .95, .7, m, 0, .52, 0)); b.add(box(.64, .07, .76, m, 0, 1.02, .02));
        for (const x of [-.26, .26]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .06, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(x, .1, .33); b.add(w); }
        b.position.set(bx + k * .72, 0, zE); b.rotation.y = Math.PI + (rr() - .5) * .3; h.add(b); binsO.push(b); }
      extraHits.push([{ hx: .7, hz: .4, h: 1.1, kind: 'hard' }, bx + .36, zE]); taken.push([bx + .36, zE, 1]); }
    if (rr() < .45) for (const x of garage ? [-W * .3] : [-W * .32, W * .32]) { if (rr() < .3) continue; const bed = new THREE.Group(); bed.add(box(1.9, .14, .7, soilM, 0, .07, 0)); bed.add(box(1.75, .24, .55, BLOOM[rr() * BLOOM.length | 0], 0, .24, 0));
      for (const bx2 of [-.95, .95]) bed.add(box(.08, .18, .74, stoneM, bx2, .09, 0)); bed.position.set(x, 0, fz - .75); h.add(bed); taken.push([x, fz - .75, 1.1]); }
    if (rr() < .22) { const fx = dx > 0 ? -W / 2 + .45 : W / 2 - .45, pole = new THREE.Group(); pole.position.set(fx, 2.45, fz - .05); pole.rotation.x = -.8; h.add(pole);
      pole.add(box(.05, 1.8, .05, white, 0, .9, 0)); const sg = fx > 0 ? -1 : 1;
      const wS = box(.95, .36, .02, flagW, sg * .5, 1.5, 0), rS = box(.95, .36, .02, flagR, sg * .5, 1.14, 0); wS.rotation.y = sg * .12; rS.rotation.y = sg * .16; pole.add(wS, rS); pole.userData.onHouse = true; }
    // now and then a garden chair (or a lounger, striped) out on the lawn, facing the road
    const freeAt = (x, z, r) => !((path && Math.abs(x - dx) < .9 + r) || (drv && Math.abs(x - dvx) < 1.7 + r) || (z > fz - 2.6 && Math.abs(x - dx) < 2 + r) || taken.some(([a, b, c]) => Math.hypot(a - x, b - z) < c + r));
    const sitAt = (() => { const side = dx > 0 ? -1 : 1; for (const [x, z] of [[side * W * .28, fz - 3.2], [-side * W * .28, fz - 3.2], [side * W * .34, fz - 4.2], [-side * W * .34, fz - 4.2]]) if (freeAt(x, z, 1)) return [x, z]; return null; })();
    if (sitAt && rnd() < .3) { const [sx, sz] = sitAt, lounger = rnd() < .4, c = new THREE.Group(), wd = toon('#9e7a4f'), cloth = toon('#ffffff', { map: STRIPE });
      if (lounger) { c.add(box(.62, .06, 1.7, cloth, 0, .3, .05)); const bk = box(.62, .06, .8, cloth, 0, .62, -.72); bk.rotation.x = -1.0; c.add(bk); for (const x of [-.3, .3]) for (const z of [-.7, .75]) c.add(box(.04, .3, .04, wd, x, .15, z)); }
      else { c.add(box(.5, .05, .48, wd, 0, .45, 0)); c.add(box(.5, .5, .05, wd, 0, .72, -.24)); for (const x of [-.22, .22]) for (const z of [-.2, .2]) c.add(box(.04, .45, .04, wd, x, .22, z)); for (const x of [-.26, .26]) c.add(box(.04, .04, .45, wd, x, .62, 0)); }
      c.position.set(sx, 0, sz); c.rotation.y = Math.PI; h.add(c);                                   // (the seat faces the road: -z here)
      seats.push({ h, chair: c, local: new THREE.Vector3(sx, lounger ? .06 : 0, sz + (lounger ? .15 : .02)), lounger, i }); yard.push([{ hx: .4, hz: lounger ? .9 : .35, h: .8, kind: 'hard' }, sx, sz]); taken.push([sx, sz, lounger ? 1.1 : .6]); }
    // the front garden, lived in: a few things about the lawn (not on the path, the drive, the porch, nor on what stands there); now and then an old car by the house
    
    { const spots = [...taken], lawnZ0 = fz - 1, lawnZ1 = -D / 2 - gap + 1.4, pick = [['natLeaves', 2], ['natBush', 3], ['natFlowers', 3], ['natRocks', 1], ['leafPile', 1], ['gnome', 2], ['sandbox', 1], ['swing', 1], ['kidBike', 1], ['trampoline', 1], ['grill', 1], ['birdbath', 1]], tot = pick.reduce((a, b) => a + b[1], 0);
      for (let n = 0; n < 2 + (rnd() * 3 | 0); n++) { let r = rnd() * tot, kind = pick[0][0]; for (const [k, wgt] of pick) { if ((r -= wgt) < 0) { kind = k; break; } }
        const big = kind === 'swing' || kind === 'trampoline' || kind === 'sandbox';
        for (let tries = 0; tries < 8; tries++) { const rr = big ? 2 : .8, x = (rnd() - .5) * Math.max(0, W - 2 * (rr + .35)), z = lawnZ1 + (lawnZ0 - lawnZ1) * rnd();
          if (Math.abs(x - dx) < 1.2 + rr * .5 || (drv && Math.abs(x - dvx) < 1.8 + rr * .5) || (z > fz - 2.6 && Math.abs(x - dx) < 2.2 + rr) || spots.some(([a, b, c]) => Math.hypot(a - x, b - z) < c + rr)) continue;
          const o = kind === 'sandbox' ? P.sandbox(rnd) : P[kind] ? P[kind](rnd) : NATK[kind](nr); if (kind === 'sandbox') o.group.scale.setScalar(.8); o.group.position.set(x, 0, z); o.group.rotation.y = o.group.rotation.y || (rnd() - .5) * .6; h.add(o.group);
          if (kind === 'swing') o.group.userData.keep = true; if (kind === 'swing') things.push({ kind: 'swing', o: o.group, pivot: o.group.userData.pivot, r: 1.1 }); else if (kind === 'natBush') things.push({ kind: 'bush', o: o.group, parts: [o.group], r: .6, top: 1 });
          if (o.hit) yard.push([o.hit, x, z]); spots.push([x, z, rr]); break; } } }
    if (!annex && rnd() < .18) { const old = CARS.makeCar(rnd() < .5 ? 'saloon' : 'estate', ['#8a9a8c', '#b39b7a', '#7a6a5a', '#9aa0a4'][rnd() * 4 | 0]), sx = (rnd() < .5 ? -1 : 1) * (W / 2 + 1.9);
      old.wheels[0].visible = false; const wp = old.wheels[0].position; for (let k = 0; k < 2; k++) old.group.add(box(.3, .12, .25, toon('#9d9a92'), wp.x * .8, .06 + k * .13, wp.z));   // on blocks, a wheel off
      old.group.add(tarpOver(old, rnd));   // (a tarp over the back of it: laid on its shape, hanging down its sides)
      old.group.position.set(sx, .06, -.5); old.group.rotation.set(0, rnd() < .5 ? 0 : Math.PI, .03); h.add(old.group);
      yard.push([{ hx: old.half[0], hz: old.half[1], h: 1.5, kind: 'hard', car: old.group }, sx, -.5]); standCars.push({ o: old.group, h, i }); }
    // a car on the drive, now and then
    if (drv && (spot?.car ?? rnd() < .6)) { const c = CARS.random(rnd); c.group.position.set(dvx, 0, -D / 2 - 2.8 - rnd() * 1.5); c.group.rotation.y = Math.PI + (rnd() - .5) * .1; h.add(c.group); h.userData.car = c; standCars.push({ o: c.group, h, i }); }
    if (spot) { const n = spot.n; h.rotation.y = Math.atan2(-n.x, -n.z); h.position.set(spot.x - n.x * (D / 2 + gap), 0, spot.z - n.z * (D / 2 + gap)); G.add(h); h.traverse(c => { if (c.isMesh && !c.userData.noShadow) { c.castShadow = true; c.receiveShadow = true; } }); spot.onHouse?.(h); }
    else put(h, i, side * (PAVE + gap + D / 2), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    h.updateMatrixWorld(true); hit(h, { hx: W / 2, hz: D / 2, h: HH + 2, kind: 'hard' }, i);
    if (h.userData.car) { const c = h.userData.car; hit(h, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard' }, i, dvx, c.group.position.z); }
    if (annex) hit(h, { hx: aw / 2, hz: ad / 2, h: 3, kind: 'hard' }, i, ax, azc);
    if (annex) annexes.push(h.localToWorld(new THREE.Vector3(ax, 0, azc)));
    // a fence at the back of the lot, behind the house: boards or wire (now and then none), across the whole lot and the annex
    { const kb = rr(), zb = D / 2 + 3.2 + rr() * 1.5, x0 = -W / 2 - 1 - (annex && as < 0 ? 3.5 : 0), x1 = W / 2 + 1 + (annex && as > 0 ? 3.5 : 0), len = x1 - x0;
      if (kb < .85) { const f = kb < .5 ? P.boardFence(len) : P.wireFence(len); f.group.position.set((x0 + x1) / 2, 0, zb); f.group.rotation.y = Math.PI / 2; h.add(f.group); f.group.updateMatrixWorld(true);
        f.group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); hit(h, { hx: len / 2, hz: .1, h: 1.5, kind: 'hard' }, i, (x0 + x1) / 2, zb); } }
    for (const [spec, x, z] of [...yard, ...extraHits]) { const C = hit(h, spec, i, x, z); if (spec.car) spec.car.userData.hitC = C; }
    if (drv) { zone(h, 1.9, (gap + .2) / 2 + .6, dvx, -D / 2 - gap / 2); zone(h, 1.9, 2.6, dvx, -D / 2 - gap - 2.6); } if (path) zone(h, .9, gap / 2, dx, -D / 2 - gap / 2); if (annex) zone(h, aw / 2 + .3, ad / 2, ax, azc);   // the drive (and across the pavement and the verge: no tree in the way out), or the path
    zone(h, 2.4, 1.7, dx, fz - 1.1);                                                                                             // the porch
    const nrm = new THREE.Vector3(0, 0, -1).transformDirection(h.matrixWorld);
    settle(h, i, W + (annex ? 3.5 : 0), D);
    if (porch) { floor(h, porch.px0, fz - 1.1, porch.pw / 2, 1.1, .3); floor(h, porch.px0, fz - 2.3, .6, .16, .1); floor(h, porch.px0, fz - 2.0, .6, .16, .2); }   // (the porch's floor and its two steps)
    show.house.push({ o: h, label: [two ? 'piętrowy' : 'parterowy', garage ? 'z garażem' : annex ? 'z dobudówką' : ''].filter(Boolean).join(', '), note: `${W.toFixed(1)} × ${D.toFixed(1)} m`, kind: (two ? 2 : 1) + (garage ? 'g' : annex ? 'a' : '') });
    for (const [x, y] of wins) windows.push({ p: h.localToWorld(new THREE.Vector3(x, y, fz - .07)), n: nrm.clone(), hw: .56, hh: .5, broken: false, i, house: doors.length });   // (house: its door's number)
    doors.push({ p: h.localToWorld(new THREE.Vector3(dx, 0, fz - 2.6)), n: nrm.clone(), done: false, i });   // (n: the way the house faces)
    if (!spot) lots.push({ i, side, D, W, gap });
    // the mailbox by the pavement, in front of it
    const mb = new THREE.Group(), bm = rnd() < .5 ? grey : white; mb.add(box(.11, 1.02, .11, wood, 0, .51, 0));
    mb.add(box(.13, .05, .5, wood, 0, 1.0, 0)); { const br = box(.05, .36, .05, wood, 0, .82, .1); br.rotation.x = -.7; mb.add(br); }   // the arm under the box, a brace
    { const sh = new THREE.Shape(); sh.moveTo(-.13, 0); sh.lineTo(.13, 0); sh.lineTo(.13, .13); sh.absarc(0, .13, .13, 0, Math.PI, false); sh.lineTo(-.13, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: .46, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 1, curveSegments: 10 }); g.translate(0, 0, -.23);
      const b = new THREE.Mesh(g, bm); b.position.y = 1.025; mb.add(b);
      const dg = new THREE.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false, curveSegments: 10 }); const door = new THREE.Mesh(dg, toon('#9a938a')); door.scale.setScalar(.97); door.position.set(0, 1.03, .245); mb.add(door);   // the door, a shade darker
      mb.add(box(.05, .025, .03, toon('#44484c'), 0, 1.2, .27));                                    // its latch
      for (const z of [-.12, .06]) mb.add(box(.27, .012, .015, toon('#b8b8ae'), 0, 1.03, z)); }       // bands round its foot
    const flag = new THREE.Group(); flag.position.set(.15, 1.1, -.05); flag.add(box(.015, .24, .025, red, 0, .12, 0)); flag.add(box(.018, .09, .13, red, 0, .21, .065)); mb.add(flag);   // (pivots at its foot)
    mb.userData.keep = true; if (spot) { const q0 = h.localToWorld(new THREE.Vector3(dx + 1.4, 0, -D / 2 - gap + .3)); mb.position.copy(q0); mb.position.y = groundAt(q0.x, q0.z, i); mb.rotation.y = h.rotation.y + Math.PI / 2; G.add(mb); } else put(mb, i + 4, side * (VERGE - .25), 0, 0); hit(mb, { hx: .1, hz: .1, h: 1.3, kind: 'hard' }, i + 4); { const M = { o: mb, i: i + 4, side, flag }; mailboxes.push(M); things.push({ kind: 'mailbox', o: mb, mb: M, C: colliders[colliders.length - 1], side }); }   // (keep: its flag moves)
    // a fence or a hedge along its front, now and then
    //   always open where the drive or the path meets the pavement (a car must get out, one must get in): a gate on the path (now and
    //   then left ajar), posts at the drive (now and then a double gate, swung wide open); a few lots fenced all round, back to the house
    const k = rnd(), gapO = drv ? [dvx, 3.4, 'drive'] : [dx, 1.3, 'path'], lo = gapO[0] - gapO[1] / 2, hi = gapO[0] + gapO[1] / 2, fL = -W / 2 - (annex && as < 0 ? 3.5 : 0), fR = W / 2 + (annex && as > 0 ? 3.5 : 0);
    const holes = (annex || (garage && path) ? [[lo, hi], [dx - .65, dx + .65]] : [[lo, hi]]).sort((a, b) => a[0] - b[0]), runs = [];   // (with an annex: open at its drive and at the path to the door)
    { let a = fL; for (const [h0, h1] of holes) { runs.push([a, h0]); a = h1; } runs.push([a, fR]); for (let q = runs.length - 1; q >= 0; q--) if (runs[q][1] - runs[q][0] < .3) runs.splice(q, 1); }
    const atFront = (o, z, y = 0) => { if (spot) { const q0 = h.localToWorld(new THREE.Vector3(0, 0, -D / 2 - gap + z)); o.position.set(q0.x, groundAt(q0.x, q0.z, i) + y, q0.z); o.rotation.y = h.rotation.y; G.add(o); return o; } return put(o, i, side * (PAVE + z), y, side > 0 ? -Math.PI / 2 : Math.PI / 2); };   // (the fence's frame: the house's, at the lot's front)
    if (k < .45) { const f = new THREE.Group(); atFront(f, .5);   // (the fence's frame is the house's: across the lot along x, the lot at +z)
      const run = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, n = Math.max(1, Math.round(L / .28)), yaw = Math.atan2(-uz, ux);
        for (let q = 0; q <= n; q++) { const t = q / n, pk = box(.08, .85, .03, white, x0 + ux * L * t, .43, z0 + uz * L * t); pk.rotation.y = yaw; f.add(pk); }
        for (const y of [.62, .3]) { const r = box(L, .06, .05, white, (x0 + x1) / 2, y, (z0 + z1) / 2 + .02); r.rotation.y = Math.atan2(-uz, ux); f.add(r); }
        hit(f, Math.abs(ux) > .5 ? { hx: L / 2, hz: .06, h: .9, kind: 'hard' } : { hx: .06, hz: L / 2, h: .9, kind: 'hard' }, i, (x0 + x1) / 2, (z0 + z1) / 2); };
      for (const [a, b] of runs) run(a, 0, b, 0);
      for (const x of holes.flat()) f.add(box(.12, 1.05, .12, white, x, .52, 0));                                                     // (posts at the opening)
      if (gapO[2] === 'path' && rnd() < .8) { const gt = new THREE.Group(); gt.position.set(lo + .06, 0, 0); f.add(gt); for (let x = .12; x < gapO[1] - .1; x += .2) gt.add(box(.07, .8, .03, white, x, .45, 0)); for (const y of [.62, .3]) gt.add(box(gapO[1] - .14, .05, .04, white, (gapO[1] - .12) / 2 + .02, y, .02)); gt.rotation.y = -(.15 + rnd() * 1.1); }   // a gate, ajar
      if (gapO[2] === 'drive' && rnd() < .35) for (const [x, sg] of [[lo + .06, 1], [hi - .06, -1]]) { const gt = new THREE.Group(); gt.position.set(x, 0, 0); f.add(gt); const w = gapO[1] / 2 - .1; for (let q = .1; q < w; q += .2) gt.add(box(.07, .9, .03, white, sg * q, .5, 0)); for (const y of [.7, .32]) gt.add(box(w, .05, .04, white, sg * w / 2, y, .02)); gt.rotation.y = -sg * (1.35 + rnd() * .2); }   // a double gate, wide open
      if (rnd() < .35) { const back = gap - .7; run(fL, 0, fL, back); run(fR, 0, fR, back); } }                      // fenced all round, to the house's front
    else if (k < .7) { for (const [a, b] of runs) { const hg = atFront(box(b - a, 1.1, .9, hedgeM), .8, .55); hg.translateX((a + b) / 2); hit(hg, { hx: (b - a) / 2, hz: .45, h: 1.1, kind: 'soft' }, i); things.push({ kind: 'bush', o: hg, parts: [], r: (b - a) / 2, top: 1.1, hedge: true }); } }   // a hedge, open at the drive or the path
  }
  const leafT = (() => { const t = tex.leaves().clone(); t.repeat.set(2, 2); t.needsUpdate = true; return t; })();
  // a crown: clumps (lumpy balls, flat-faced, each face one of the palette's tones: lighter up top and facing up, darker beneath) and,
  // over them, cards of small leaves (alpha) facing out, which make the rim ragged; the cards are shaded as the crown's round is
  const PAL = { green: ['#1d3322', '#284a2b', '#355f31', '#467537', '#5b8a3c', '#77a146'], olive: ['#284a2b', '#355f31', '#5f6a35', '#7c8446', '#98b85a', '#c2cf7e'],
    fresh: ['#284a2b', '#355f31', '#467537', '#5b8a3c', '#77a146', '#98b85a'], orange: ['#5e1c17', '#8e2e25', '#b86a2e', '#e08556', '#d9a441', '#efc970'],
    red: ['#5e1c17', '#8e2e25', '#b3392d', '#cf5a3e', '#e08556', '#efc970'], yellow: ['#5f6a35', '#7c8446', '#b86a2e', '#d9a441', '#efc970', '#f3eed2'] };
  for (const k in PAL) PAL[k] = PAL[k].map(c => new THREE.Color(c));
  const clumpM = toon('#ffffff', { vertexColors: true, flatShading: true, map: leafT });
  const cardT = tex.leafCard(1), cardM = toon('#ffffff', { vertexColors: true, map: cardT, alphaTest: .5, side: THREE.DoubleSide });
  const cardDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: cardT, alphaTest: .5, side: THREE.DoubleSide });
  // the crowns' shadows, dappled: what they cast has holes in it (a noise in the world, two sizes of it), so under a tree the sun
  // comes through in flecks, and the flecks shift a little as the wind moves (dapT: the time)
  const dapT = { value: 0 }, dapSun = { value: new THREE.Vector3(-.6, .5, -.38).normalize() };   // (the sun's direction: main sets it)
  const dappled = m => { m.onBeforeCompile = sh => { sh.uniforms.dapT = dapT; sh.uniforms.dapSun = dapSun;
      sh.vertexShader = 'varying vec3 vDapW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vDapW = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = `varying vec3 vDapW; uniform float dapT; uniform vec3 dapSun;
        float dH(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float dN(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
          return mix(mix(mix(dH(i), dH(i + vec3(1, 0, 0)), f.x), mix(dH(i + vec3(0, 1, 0)), dH(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(dH(i + vec3(0, 0, 1)), dH(i + vec3(1, 0, 1)), f.x), mix(dH(i + vec3(0, 1, 1)), dH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
        ` + sh.fragmentShader.replace('void main() {', `void main() {
        { vec2 g = vDapW.xz - dapSun.xz / dapSun.y * vDapW.y;             // (where on the ground this bit's shadow falls: the same holes through every layer of the crown)
          float n = dN(vec3(g * 1.1 + vec2(sin(dapT * .7) * .25, dapT * .12), 0.)) * .6 + dN(vec3(g * 2.9, dapT * .3)) * .4; if (n > .56) discard; }`); };
    m.customProgramCacheKey = () => 'dapple'; return m; };
  const clumpDepth = dappled(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })); dappled(cardDepth);
  const hash3 = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  function crown(t, C, R, pal, nClump = 18, nCard = 44) {
    const P = PAL[pal], tone = (up, h, j) => P[Math.max(0, Math.min(P.length - 1, Math.round((up * .45 + h * .75 + j) * (P.length - 1))))];
    for (let k = 0; k < nClump; k++) { const a = rnd() * 6.28, u = rnd() * 2 - 1, q = Math.sqrt(1 - u * u), rr = Math.sqrt(rnd()) * .5;   // (clumps: the crown's dark core only, kept inside the leaves)
      const cx = C.x + Math.cos(a) * q * R.x * rr, cy = C.y + u * R.y * rr * .85, cz = C.z + Math.sin(a) * q * R.z * rr, cr = (.32 + rnd() * .22) * Math.min(R.x, R.y, R.z) * .85;
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), n = 1 + (hash3(x + k, y, z) - .5) * .5; p.setXYZ(v, cx + x * cr * n, cy + y * cr * n * .85, cz + z * cr * n); }
      g.computeVertexNormals(); const cols = new Float32Array(p.count * 3), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3(), j0 = (rnd() - .5) * .2;
      for (let f = 0; f < p.count; f += 3) { const A = new THREE.Vector3().fromBufferAttribute(p, f), B2 = new THREE.Vector3().fromBufferAttribute(p, f + 1), C2 = new THREE.Vector3().fromBufferAttribute(p, f + 2);
        fn.crossVectors(e1.subVectors(B2, A), e2.subVectors(C2, A)).normalize(); const h = ((A.y + B2.y + C2.y) / 3 - (C.y - R.y)) / (2 * R.y), c = tone(fn.y * .5, h * .7, j0 - .18 + (rnd() - .5) * .2);
        for (let v = 0; v < 3; v++) { cols[(f + v) * 3] = c.r; cols[(f + v) * 3 + 1] = c.g; cols[(f + v) * 3 + 2] = c.b; } }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); const m = new THREE.Mesh(g, clumpM); m.userData.foliage = 'clump'; t.add(m); }
    const pos = [], nor = [], uv = [], col = [], d = new THREE.Vector3(), u1 = new THREE.Vector3(), u2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < nCard * 2; k++) { const a = rnd() * 6.28, y = rnd() < .75 ? rnd() * .95 + .05 : -rnd() * .7, q = Math.sqrt(1 - y * y), sh = .74 + rnd() * .26; d.set(Math.cos(a) * q, y, Math.sin(a) * q);   // (twice the cards, in two layers: the leaves make the outline)
      const c0 = new THREE.Vector3(C.x + d.x * R.x * sh, C.y + d.y * R.y * sh * .95, C.z + d.z * R.z * sh), sz = (.6 + rnd() * .45) * Math.min(R.x, R.z) * .55, roll = rnd() * 6.28;
      u1.crossVectors(Math.abs(d.y) > .95 ? new THREE.Vector3(1, 0, 0) : up, d).normalize(); u2.crossVectors(d, u1); const cu = u1.clone().multiplyScalar(Math.cos(roll)).addScaledVector(u2, Math.sin(roll)), cv = new THREE.Vector3().crossVectors(d, cu);
      const cs = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].map(([x, z, s0, t0]) => ({ p: c0.clone().addScaledVector(cu, x * sz).addScaledVector(cv, z * sz), s0, t0 }));
      const c = tone(d.y, (d.y + 1) / 2, (rnd() - .4) * .3); for (const i of [0, 1, 2, 0, 2, 3]) { const v = cs[i]; pos.push(v.p.x, v.p.y, v.p.z); nor.push(d.x, d.y, d.z); uv.push(v.s0, v.t0); col.push(c.r, c.g, c.b); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, cardM); m.userData.foliage = 'card'; t.add(m);
  }
  const greenPal = () => { const k = rnd(); return k < .45 ? 'green' : k < .75 ? 'olive' : 'fresh'; }, autumnPal = () => { const k = rnd(); return k < .45 ? 'orange' : k < .75 ? 'red' : 'yellow'; };
  function branches(t, H, n, toward) { for (let k = 0; k < n; k++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.05, .1, 1.8 + rnd(), 6), wood), a = rnd() * 6.28, tilt = .5 + rnd() * .5;
    br.position.set(toward * .3 + Math.cos(a) * .35, H - .2 + rnd() * .4, Math.sin(a) * .35); br.rotation.set(Math.sin(a) * tilt, 0, -(Math.cos(a) + toward * .6) * tilt); t.add(br); } }
  // a tree grown, not stood up: a trunk that bends as it rises and narrows, forking into a few limbs, each bent, each ending in a mass of
  // leaves; a mass on the top as well. dir: where it leans ({x, z}, unit), spread: how far its limbs reach (m)
  const barkM = toon('#6b4a30', { map: rep(tex.bark(), 1, 3) });
  function limb(t, pts, r0, r1) { const c = new THREE.CatmullRomCurve3(pts), TS = 10, RS = 7, g = new THREE.TubeGeometry(c, TS, r0, RS, false), p = g.attributes.position, q = new THREE.Vector3();
    for (let a = 0; a <= TS; a++) { const cp = c.getPointAt(a / TS), k = 1 + (r1 / r0 - 1) * (a / TS); for (let b = 0; b <= RS; b++) { const n = a * (RS + 1) + b; q.fromBufferAttribute(p, n).sub(cp).multiplyScalar(k).add(cp); p.setXYZ(n, q.x, q.y, q.z); } }
    g.computeVertexNormals(); t.add(new THREE.Mesh(g, barkM)); return c; }
  function grow(t, H, dir, spread, pal, big) {
    const w = () => (rnd() - .5) * .35, V = (x, y, z) => new THREE.Vector3(x, y, z), r0 = big ? .3 : .21;
    const trunk = limb(t, [V(0, -.1, 0), V(dir.x * spread * .06 + w(), H * .35, dir.z * spread * .06 + w()), V(dir.x * spread * .16 + w(), H * .7, dir.z * spread * .16 + w()), V(dir.x * spread * .24, H, dir.z * spread * .24)], r0, r0 * .5);
    const top = trunk.getPointAt(1), n = 2 + (rnd() * 3 | 0), yaw = Math.atan2(dir.z, dir.x);
    // its foot: roots spreading into the ground, so it stands, not sticks in
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + rnd() * .8, L = r0 * (2.2 + rnd() * 1.4); limb(t, [V(0, r0 * 1.6, 0), V(Math.cos(a) * L * .5, r0 * .5, Math.sin(a) * L * .5), V(Math.cos(a) * L, -.05, Math.sin(a) * L)], r0 * .55, r0 * .15); }
    // the limbs: forking low off the trunk, each forking again into two, every end a mass of leaves of its own (a crown of many
    // clumps, each with its lit and its shaded side, not one ball)
    for (let k = 0; k < n; k++) { const s0 = trunk.getPointAt(.38 + rnd() * .4), a = yaw + (k - (n - 1) / 2) * (2.4 / n) + (rnd() - .5) * .5, reach = spread * (.55 + rnd() * .45), up = H * (.22 + rnd() * .25);
      const end = V(s0.x + Math.cos(a) * reach, s0.y + up, s0.z + Math.sin(a) * reach), mid = V(s0.x + Math.cos(a) * reach * .55, s0.y + up * .35, s0.z + Math.sin(a) * reach * .55);
      const lc = limb(t, [s0, mid, end], r0 * .5, r0 * .16);
      const R = spread * (.34 + rnd() * .12); crown(t, end.clone().add(V(0, R * .35, 0)), V(R, R * .72, R), pal, big ? 7 : 5, big ? 18 : 12);
      for (const sg of [-1, 1]) { const f0 = lc.getPointAt(.55 + rnd() * .15), b2 = a + sg * (.6 + rnd() * .5), rr = reach * (.35 + rnd() * .2), e2 = V(f0.x + Math.cos(b2) * rr, f0.y + up * (.25 + rnd() * .3), f0.z + Math.sin(b2) * rr);
        limb(t, [f0, f0.clone().lerp(e2, .5).add(V(0, .12, 0)), e2], r0 * .2, r0 * .07);
        const r2 = R * (.55 + rnd() * .2); crown(t, e2.clone().add(V(0, r2 * .3, 0)), V(r2, r2 * .75, r2), pal, 4, big ? 10 : 7); } }
    const R = spread * (.46 + rnd() * .12); crown(t, top.clone().add(V(0, R * .45, 0)), V(R, R * .75, R), pal, big ? 9 : 6, big ? 24 : 15);
  }
  function tree(i, d) {
    if (!free(i, d, 2)) return;                                          // (not out of a car, a house, a drive)
    const t = new THREE.Group(), H = 2.6 + rnd() * 2.4, autumn = rnd() < .3, a = rnd() * 6.28;
    grow(t, H, { x: Math.cos(a), z: Math.sin(a) }, 2.3 + rnd() * 1.1 + H * .22, autumn ? autumnPal() : greenPal(), false);
    put(t, i, d, 0, rnd() * 6); hit(t, { hx: .28, hz: .28, h: H, kind: 'hard' }, i); things.push({ kind: 'tree', o: t, H, autumn, crown: 1.4 + H * .25 });
    show.tree.push({ o: t, label: autumn ? 'drzewo jesienne' : 'drzewo liściaste', note: H.toFixed(1) + ' m' });
  }
  function pole(i) { const p = new THREE.Group(); p.add(box(.22, 8.5, .22, wood, 0, 4.25, 0)); p.add(box(1.8, .12, .12, wood, 0, 7.9, 0)); p.add(box(1.2, .1, .1, wood, 0, 7.3, 0)); put(p, i, -(VERGE - .6), 0, 0); hit(p, { hx: .14, hz: .14, h: 8, kind: 'hard' }, i); things.push({ kind: 'pole', o: p, r: .14 }); return p; }
  // ---------- the shacks: a plot of them now and then in place of a house: sheds of tin and boards, a fire in a drum, an old sofa,
  //   tyres, pallets, washing, a car on blocks, a broken fence, and the lads standing round the fire (they have something to say) ----------
  const fires = [], annexes = [], train = { update() { } };   // (the fires by the shacks, to flicker; where the annexes are, for a look in the tests)
  function shacks(i, side) {
    const late = [];   // (its colliders: made once it stands where it does)
    const h = new THREE.Group(), tin = c => { const t = rep(tex.siding(), 1, 2.4); t.rotation = Math.PI / 2; t.center.set(.5, .5); return toon(c, { map: t }); }, roofs = ['#8a4a2e', '#6e7478', '#9a5a36'].map(c => tin(c)), mats = [tin('#8a5a3a'), tin('#8a8f94'), tin('#5d6639'), toon('#6b4a2e', { map: rep(tex.siding(), 1, 1.2) })], dirt = toon('#7a6a50');
    for (const [x, z, w, d, a] of [[0, -.6, 8, 5.5, .15], [-3.6, 2.2, 6, 4.5, -.2], [3.8, 2, 5.5, 5, .3], [-5.6, -2.4, 3.2, 2.6, .5], [5.2, -2.4, 3.6, 3, -.4]]) { const pt = slab(box(w, .03, d, dirt, x, .015 + Math.abs(a) * .01, z)); pt.userData.thick = .02 + Math.abs(a) * .01; pt.rotation.y = a; h.add(pt); }
    for (const [x, z, w, d, hh] of [[-4.2, 2.2, 3.4, 2.8, 2.2], [.3, 3.4, 3, 2.6, 2.4], [4.4, 1.6, 2.8, 3, 2.1]]) { const m = mats[rnd() * mats.length | 0], s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = (rnd() - .5) * .25; h.add(s);
      s.add(box(w, hh, d, m, 0, hh / 2, 0)); const rf = box(w + .5, .06, d + .6, roofs[rnd() * roofs.length | 0], 0, hh + .2, 0); rf.rotation.x = .2; rf.rotation.z = (rnd() - .5) * .12; s.add(rf);
      for (let q = 0; q < 3; q++) { const pw = .5 + rnd() * .8, ph = .4 + rnd() * .7, pa = box(pw, ph, .03, mats[rnd() * mats.length | 0], (rnd() - .5) * (w - pw), .3 + rnd() * (hh - ph - .4), -d / 2 - .02); pa.rotation.z = (rnd() - .5) * .2; s.add(pa); }   // patches of other tin
      if (rnd() < .5) { const lw = 1.4, sx = (rnd() < .5 ? -1 : 1) * (w / 2 + lw / 2); s.add(box(lw, hh * .7, d * .7, mats[3], sx, hh * .35, d * .1)); const lr = box(lw + .3, .05, d * .7 + .3, roofs[0], sx, hh * .72, d * .1); lr.rotation.z = Math.sign(sx) * -.25; s.add(lr); }   // a lean-to at its side
      s.add(box(.9, 1.85, .05, toon('#3a2a1e'), -w * .2, .93, -d / 2 - .03)); s.add(box(.7, .5, .05, toon('#c9b77a'), w * .25, 1.35, -d / 2 - .03));   // a door, a boarded window
      if (rnd() < .6) { s.add(box(.12, 1, .12, toon('#44484c'), w * .3, hh + .6, d * .2)); }                                                             // a stovepipe
      late.push([{ hx: w / 2, hz: d / 2, h: hh + .2, kind: 'hard' }, x, z]); }
    const drum = new THREE.Group(); drum.position.set(.5, 0, -1.2); h.add(drum); drum.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .85, 12), toon('#7b3326'))); drum.children[0].position.y = .43;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.24, .6, 7), new THREE.MeshBasicMaterial({ color: '#ffb040' })); flame.position.y = 1.05; drum.add(flame); const core = new THREE.Mesh(new THREE.ConeGeometry(.14, .4, 6), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); core.position.y = .98; drum.add(core);
    drum.userData.keep = true; late.push([{ hx: .32, hz: .32, h: .9, kind: 'hard' }, .5, -1.2]);
    const sofa = new THREE.Group(), sm = toon('#6b4a3a'); sofa.position.set(2.6, 0, -1.6); sofa.rotation.y = -1.1; sofa.add(box(1.8, .4, .8, sm, 0, .3, 0)); sofa.add(box(1.8, .6, .2, sm, 0, .7, .32)); for (const x of [-.85, .85]) sofa.add(box(.18, .55, .8, sm, x, .45, 0)); h.add(sofa);
    for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .12, 6, 12), toon('#1d1e21')); t.rotation.x = Math.PI / 2; t.position.set(-6, .12 + k * .24, -2.4 + (k % 2) * .05); h.add(t); }
    for (let k = 0; k < 2; k++) { const pl = new THREE.Group(); pl.position.set(-2.2 + k * .2, .06 + k * .13, -2.8); for (let q = 0; q < 5; q++) pl.add(box(.1, .03, 1.2, toon('#9e7a4f'), -.5 + q * .25, 0, 0)); h.add(pl); }
    { const w = P.washing(rnd); w.group.position.set(-3.5, 0, -.6); h.add(w.group); }
    if (rnd() < .7) { const old = CARS.makeCar(rnd() < .5 ? 'micro' : 'twostroke', ['#8a9a8c', '#b39b7a', '#7a6a5a'][rnd() * 3 | 0]); old.group.position.set(5.6, .1, -2.2); old.group.rotation.y = 1.3; old.wheels.forEach(w => { w.visible = false; }); h.add(old.group); late.push([{ hx: old.half[0], hz: old.half[1], h: 1.4, kind: 'hard' }, 5.6, -2.2]); }
    // the fence along the road, broken: two runs, a gap, a board fallen
    for (const [x, len] of [[-5, 4], [4.8, 4.4]]) { const f = P.boardFence(len); f.group.position.set(x, 0, -5.4); f.group.rotation.y = Math.PI / 2 + (rnd() - .5) * .06; h.add(f.group); }
    { const fb = box(1.2, .9, .04, toon('#6b4a2e'), 1.2, .08, -5.2); fb.rotation.x = -1.45; h.add(fb); }
    put(h, i, side * (PAVE + 7), 0, side > 0 ? -Math.PI / 2 : Math.PI / 2); onSlope(h, i, 15, 12); zone(h, 7.5, 6, 0, 1); for (const [sp, x, z] of late) hit(h, sp, i, x, z);
    for (const [x, len] of [[-5, 4], [4.8, 4.4]]) hit(h, { hx: len / 2, hz: .08, h: 1.4, kind: 'hard' }, i, x, -5.4);
    fires.push({ drum, flame, core }); show.shacks.push({ o: h, label: 'baraki', note: '15 × 12 m' });
    // the lads, standing round the fire on its far side (their faces to the road), facing it
    for (let k = 0; k < 3; k++) { const a = -1.2 + k * 1.2, x = .5 + Math.sin(a) * 1.25, z = -1.2 + Math.cos(a) * 1.3; seats.push({ h, local: new THREE.Vector3(x, 0, z), stand: true, key: ['teen', 'brawler', 'dogman', 'gardener'][(rnd() * 4) | 0], face: Math.atan2(.5 - x, -1.2 - z), lines: 'shacks', i }); }
    { const v = new THREE.Vector3(); for (const q of seats) if (q.h === h) { h.localToWorld(v.copy(q.local).setY(0)); q.local.y = groundAt(v.x, v.z, i) - h.position.y; } }   // (the lads on the ground too)
  }
  // the bus stops: a shelter on the pavement's far side (posts, a roof, glass at the back and the ends, a bench, a bin, an advert), the
  // stop's sign by the kerb; on the bench a man asleep with his bottle (a paper wakes him, see main), one or two waiting by it
  for (const z of bikeZones) for (let i = z.i0 + 4; i < z.i1; i += Math.round(18 / ds)) if (!nearStop(i, z.sd, 14)) decal(bikeIcon, i, z.sd * 2.72, .72, .72, z.sd > 0 ? 0 : Math.PI);   // a bike painted on the lane
  for (const q of stops) decal(busWord, q.i, q.sd * 2.6, 2.6, .95, (q.sd > 0 ? 0 : Math.PI) + Math.PI / 2);                 // BUS in the bay
  { const glassS = toon('#b9d3dc'), post = toon('#44484c'), wood = toon('#9e7a4f'), roofS = toon('#2a2c30');
    const signT = cvT(16, 16, g => { g.fillStyle = '#2f5aa0'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#f6f3ea'; g.fillRect(1, 1, 14, 1); g.fillRect(3, 5, 10, 6); g.fillStyle = '#2f5aa0'; g.fillRect(4, 6, 2, 2); g.fillRect(7, 6, 2, 2); g.fillRect(10, 6, 2, 2); g.fillStyle = '#f6f3ea'; g.fillRect(4, 11, 2, 2); g.fillRect(10, 11, 2, 2); });
    const adT = cvT(12, 18, g => { g.fillStyle = '#e3b83a'; g.fillRect(0, 0, 12, 18); g.fillStyle = '#c8323a'; g.fillRect(1, 1, 10, 4); g.fillStyle = '#f6f3ea'; g.fillRect(2, 7, 8, 6); g.fillStyle = '#44484c'; for (let y = 8; y < 13; y += 2) g.fillRect(3, y, 6, 1); g.fillStyle = '#17181b'; g.fillRect(2, 15, 8, 2); });
    for (const q of stops) { const h = new THREE.Group();
      for (const x of [-2, 2]) for (const z of [-.55, .6]) h.add(box(.08, 2.4, .08, post, x, 1.2, z));
      h.add(box(4.3, .1, 1.5, roofS, 0, 2.45, .02)); h.add(box(4.0, 1.8, .04, glassS, 0, 1.2, .6)); for (const x of [-2, 2]) h.add(box(.04, 1.8, 1.1, glassS, x, 1.2, .05));
      h.add(box(2.4, .07, .42, wood, .3, .45, .3)); for (const x of [-.8, 1.4]) h.add(box(.06, .45, .36, post, x, .22, .3));
      h.add(box(.9, 1.5, .06, toon('#ffffff', { map: adT }), 2.5, 1.1, .1)); h.add(box(.06, 1.7, .06, post, 2.95, .85, .1));
      { const b = box(.4, .6, .4, toon('#3f6b35'), -1.6, .3, .2); h.add(b); binsO.push(b); }
      const sp = new THREE.Group(); sp.position.set(-2.6, 0, -1.25); h.add(sp); sp.add(box(.07, 2.6, .07, post, 0, 1.3, 0)); sp.add(box(.5, .5, .05, toon('#ffffff', { map: signT }), 0, 2.4, -.03)); sp.add(box(.34, .44, .06, toon('#e3b83a'), 0, 1.5, -.03));
      put(h, q.i, q.sd * (PAVE + 1.0), 0, q.sd > 0 ? -Math.PI / 2 : Math.PI / 2); h.updateMatrixWorld(true);
      hit(h, { hx: 2.1, hz: .12, h: 2.4, kind: 'hard' }, q.i, 0, .6); hit(h, { hx: .1, hz: .1, h: 2.6, kind: 'hard' }, q.i, -2.6, -1.25); zone(h, 2.8, 1.4, 0, 0);
      seats.push({ h, local: new THREE.Vector3(.4, 0, .32), key: 'belly', lines: 'lump', stop: q.id, i: q.i });
      for (let k = 0; k < 1 + (rnd() < .5 ? 1 : 0); k++) seats.push({ h, local: new THREE.Vector3(-1 + k * 1.1, 0, -.45), stand: true, key: ['lady', 'teen', 'oldman', 'shopper'][rnd() * 4 | 0], face: Math.PI, lines: 'stop', stop: q.id, i: q.i });
      show.shacks.push({ o: h, label: 'przystanek', note: '4,3 × 1,5 m' }); }
    // the police stations: a small white block behind the pavement, a blue band, POLICJA over the door, a blue lamp, steps, a bench
    const wallP = toon('#e9e6dc'), blueP = toon('#2f5aa0'), roofP = toon('#3a3d42'), glassP = toon('#9fc0cc'), doorP = toon('#2a2c30'), lampP = toon('#5b8fe0');
    const wordP = cvT(64, 12, g => { g.fillStyle = '#2f5aa0'; g.fillRect(0, 0, 64, 12); g.fillStyle = '#f6f3ea'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POLICJA', 32, 6.5); });
    for (const q of posts) { const h = new THREE.Group();
      h.add(box(7, 3.3, 5, wallP, 0, 1.65, 0)); h.add(box(7.06, .45, 5.06, blueP, 0, 2.55, 0)); h.add(box(7.5, .22, 5.5, roofP, 0, 3.41, 0));
      h.add(box(1.2, 2.1, .08, doorP, 0, 1.05, -2.52)); h.add(box(2.2, .42, .06, toon('#ffffff', { map: wordP }), 0, 2.55, -2.56));
      for (const x of [-2.3, 2.3]) { h.add(box(1.4, 1.1, .06, glassP, x, 1.55, -2.52)); h.add(box(1.5, .08, .1, wallP, x, .96, -2.56)); }
      h.add(box(2.2, .14, 1, toon('#9a968c'), 0, .07, -3)); h.add(box(.5, .3, .3, lampP, 0, 3.67, -2.2));
      { const bn = box(1.6, .08, .4, toon('#9e7a4f'), 2.6, .45, -3.1); h.add(bn); for (const x of [1.95, 3.25]) h.add(box(.06, .45, .36, doorP, x, .22, -3.1)); }
      put(h, q.i, q.sd * (PAVE + 4.6), 0, q.sd > 0 ? -Math.PI / 2 : Math.PI / 2); h.updateMatrixWorld(true);
      hit(h, { hx: 3.5, hz: 2.5, h: 3.5, kind: 'hard' }, q.i); zone(h, 4.6, 3.8, 0, -.5); floor(h, 0, -3, 1.1, .5, .14);
      q.door = h.localToWorld(new THREE.Vector3(0, 0, -3.4)); q.lamp = h.localToWorld(new THREE.Vector3(0, 3.9, -2.2));
      show.shacks.push({ o: h, label: 'posterunek policji', note: '7 × 5 m' }); }
    // the bike shops: a workshop with a brick footing, a corrugated roof, a striped awning, a big sign, a shop window with a wheel in it,
    // the door rolled half up (the dark inside, wheels hung up in it); a bike on a stand outside; to one side the junk of years: stacks of
    // old tyres, bent frames, a fridge, a drum, crates
    const spanB = (o, a, b) => { const d = b.clone().sub(a); o.position.copy(a).add(b).multiplyScalar(.5); o.scale.set(1, 1, d.length()); o.lookAt(o.position.clone().add(d)); };   // (a bar from a to b)
    const wallS = toon('#d9c7a0'), brickS = toon('#9a4a32'), darkS = toon('#1d1e21'), redS = toon('#c23a2e'), steelS = toon('#9a9c9e'), rustS = toon('#8a4a2a'), tyreS = toon('#26272a'), woodS = toon('#7a5a3a');
    const tinT = cvT(16, 16, g => { for (let x = 0; x < 16; x++) { g.fillStyle = x % 4 < 2 ? '#7e8287' : '#5f6368'; g.fillRect(x, 0, 1, 16); } g.fillStyle = 'rgba(138,74,42,.55)'; g.fillRect(3, 9, 5, 4); g.fillRect(11, 2, 3, 6); });
    const awnT = cvT(16, 4, g => { for (let x = 0; x < 16; x++) { g.fillStyle = (x >> 2) % 2 ? '#f6f3ea' : '#c23a2e'; g.fillRect(x, 0, 1, 4); } });
    const wordS = cvT(96, 20, g => { g.fillStyle = '#e3b83a'; g.fillRect(0, 0, 96, 20); g.fillStyle = '#17181b'; g.fillRect(0, 0, 96, 2); g.fillRect(0, 18, 96, 2);
      g.strokeStyle = '#17181b'; g.lineWidth = 1.5; g.beginPath(); g.arc(9, 12, 4, 0, 7); g.moveTo(25, 12); g.arc(21, 12, 4, 0, 7); g.moveTo(9, 12); g.lineTo(14, 6); g.lineTo(21, 12); g.moveTo(14, 6); g.lineTo(18, 6); g.stroke();
      g.fillStyle = '#17181b'; g.font = 'bold 10px monospace'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('ROWERY · CZĘŚCI', 30, 10.5); });
    for (const q of shops) { const h = new THREE.Group();
      h.add(box(6, 3, 4.5, wallS, 0, 1.5, 0)); h.add(box(6.06, .6, 4.56, brickS, 0, .3, 0));                                            // walls on a brick footing
      { const rf = box(6.8, .12, 5.3, toon('#ffffff', { map: rep(tinT, 6, 1) }), 0, 3.12, 0); rf.rotation.x = .05; h.add(rf); }          // the corrugated roof
      h.add(box(2.6, 1.15, .08, darkS, -.8, .58, -2.27)); h.add(box(2.7, 1.1, .1, toon('#8d9295', { map: rep(tinT, 3, 1) }), -.8, 1.7, -2.3));   // the door rolled half up: dark below, the shutter above
      for (const [x, y] of [[-1.5, .9], [-.3, .7]]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.28, .03, 6, 16), darkS); w.position.set(x, y, -2.1); h.add(w); }   // wheels hung up inside
      { const sg = box(3.4, .62, .08, toon('#ffffff', { map: wordS }), -.4, 2.62, -2.32); h.add(sg); }                                  // the sign
      { const aw = box(3, .06, 1, toon('#ffffff', { map: rep(awnT, 3, 1) }), -.8, 2.3, -2.75); aw.rotation.x = -.35; h.add(aw); }      // the awning over the door
      h.add(box(1.3, 1, .06, toon('#9fc0cc'), 2, 1.5, -2.27)); { const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 16), redS); w.position.set(2, 1.5, -2.22); h.add(w); }   // the shop window, a red wheel in it
      { const st = new THREE.Group(); st.position.set(1.7, 0, -3.2); h.add(st); for (const z of [-.5, .5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .035, 8, 20), darkS); w.rotation.y = Math.PI / 2; w.position.set(0, .36, z); st.add(w); }
        st.add(box(.05, .05, .9, redS, 0, .55, 0)); st.add(box(.05, .45, .05, redS, 0, .55, -.15)); st.add(box(.04, .06, .3, darkS, 0, .82, .45)); st.add(box(.2, .35, .05, steelS, 0, .18, 0)); }
      // the junk, to the side: stacks of tyres, frames leant on the wall, a fridge on its back, a drum, crates
      const J = new THREE.Group(); J.position.set(4.1, 0, -.6); h.add(J);
      for (const [x, z, n] of [[0, -1.2, 5], [.75, -.7, 3], [-.1, .2, 4]]) for (let k = 0; k < n; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .12, 6, 14), tyreS); t.rotation.x = Math.PI / 2; t.position.set(x + (rnd() - .5) * .06, .12 + k * .22, z); t.rotation.z = rnd(); J.add(t); }
      { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .12, 6, 14), tyreS); t.position.set(.9, .4, .5); t.rotation.set(0, .6, .25); J.add(t); }
      for (const [z, r] of [[1.1, .2], [1.6, -.15]]) { const f = new THREE.Group(); f.position.set(-.85, 0, z); f.rotation.set(0, Math.PI / 2, r); J.add(f);
        for (const [a, b] of [[[0, .3, -.35], [0, .75, .1]], [[0, .75, .1], [0, .72, .5]], [[0, .3, -.35], [0, .7, .5]], [[0, .3, -.35], [0, .3, -.85]]]) { const o = box(.04, .04, 1, rustS, 0, 0, 0); spanB(o, new THREE.Vector3(...a), new THREE.Vector3(...b)); f.add(o); }
        const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .025, 6, 16), steelS); w.rotation.y = Math.PI / 2; w.position.set(0, .3, -.85); f.add(w); }
      { const fr = box(.7, .55, 1.4, toon('#e9e6dc'), .2, .28, 1.5); fr.rotation.y = .3; J.add(fr); J.add(box(.05, .3, .5, steelS, .55, .5, 1.4)); }   // an old fridge on its back
      { const dr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .85, 12), rustS); dr.position.set(1, .43, -1.5); J.add(dr); }
      for (const [x, z, y, r] of [[.9, 1.2, 0, .2], [1.05, 1.15, .4, .5]]) { const c = box(.5, .4, .4, woodS, x, .2 + y, z); c.rotation.y = r; J.add(c); }
      put(h, q.i, q.sd * (PAVE + 4.4), 0, q.sd > 0 ? -Math.PI / 2 : Math.PI / 2); h.updateMatrixWorld(true);
      hit(h, { hx: 3, hz: 2.25, h: 3.2, kind: 'hard' }, q.i); hit(h, { hx: 1.3, hz: 1.6, h: 1.4, kind: 'hard' }, q.i, 4.2, -.4); zone(h, 5.6, 3.6, .8, -.5);
      q.door = h.localToWorld(new THREE.Vector3(-.8, 0, -3.3)); q.seat = h.localToWorld(new THREE.Vector3(-2.6, 0, -2.9));   // (seat: where pan Janusz sits, by the door, away from the bike stand)
      show.shacks.push({ o: h, label: 'sklep rowerowy', note: '6 × 4,5 m, ze złomem' }); } }
  // the paths, planned before the houses: where one leaves the pavement there is a meadow (no house there, no fence across it), and
  // its first stretch is kept clear (no tree, no tuft of grass on it)
  const home = RG.home ? homeStreet() : (() => { const i0 = 6, s0 = S[i0], d0 = INNER * 2.2, p0 = at(i0, d0, 0); return { start: { x: p0.x, z: p0.z, yaw: Math.atan2(s0.f.x, s0.f.z) }, iJ: i0, near: () => false, paved: () => false, yard: () => false, bikes: [], C0: p0, C0R: 0 }; })();
  const trailPlans = []; for (let i0 = Math.round(40 / ds); i0 < N - 40; i0 += Math.round((42 + nr() * 40) / ds)) { const sd = nr() < .5 ? -1 : 1; if (home.near(i0, sd, 30)) continue; if (nearStop(i0, sd, 25) || nearPost(i0, sd, 24) || nearShop(i0, sd, 22)) continue;
    trailPlans.push({ i0, sd }); zone({ position: at(i0, sd * (PAVE + 13)), rotation: { y: yawOf(i0) } }, 13, 3.2); }
  const nearTrail = (i, s, m) => trailPlans.some(t => t.sd === s && Math.abs((((i - t.i0) % N) + N + N / 2) % N - N / 2) * ds < m);

  // ---------- home: a side street off the loop, a short one, ending in a turning circle (a green island in it, a tree on that), with
  //   pavements and kerbs; round the circle the home (two floors, its garage open, a car on the drive, a porch) and two neighbours,
  //   the three of them facing the circle. He starts there, on his bike, his back to the house; his bikes by the garage. Built on its
  //   own stream of numbers, so the rest of the map is as it was. home: { start, near(i, side, m), paved(x, z), spots } ----------
  function homeStreet() {
    const keep = rnd; rnd = mulberry(4242);
    const iJ = MOUTH.i, sd = MOUTH.sd, J = at(iJ, sd * ROAD, 0), A = S[iJ], n = new THREE.Vector3(A.r.x * sd, 0, A.r.z * sd), f = new THREE.Vector3(A.f.x, 0, A.f.z);
    const Lr = 6, Rc = 7, Ri = 2.3, C0 = J.clone().addScaledVector(n, Lr + Rc - 1), W2 = 3, PW = 1.9;   // (the street's length, the circle's radius, the island's: short, so the houses keep clear of the railway at 41.5 m)
    const gy = (x, z) => groundAt(x, z, iJ);
    const asph = toon('#3f4246', { map: rep(tex.asphalt(), 1, 1) }), slabM = toon('#bcb6a6', { map: rep(tex.slabs(), 1, 1) }), kerbM = toon('#cbc8bd'), grassM = toon('#7c9a45', { map: rep(tex.grass(6), 1, 1) });
    // a surface laid on the ground, a grid bent to it: fn(u, v) → [x, z] (u along, v across, 0..1), lifted a little over the grass
    function surf(nu, nv, fn, m, lift, tu = 3) { const pos = [], uv = [], idx = [];
      for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) { const [x, z] = fn(a / nu, b / nv); pos.push(x, gy(x, z) + lift, z); uv.push(x / tu, z / tu); }
      for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) { const p0 = a * (nv + 1) + b, p1 = p0 + nv + 1; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      { const nn = g.attributes.normal; let up = 0; for (let k = 0; k < nn.count; k++) up += nn.getY(k); if (up < 0) { g.index.array.reverse(); g.computeVertexNormals(); } }
      const o = new THREE.Mesh(g, m); o.receiveShadow = true; o.userData.noShadow = true; G.add(o); return o; }
    const P = (along, across) => { const p = J.clone().addScaledVector(n, along).addScaledVector(f, across); return [p.x, p.z]; };
    const ring = (r0, r1, a0 = 0, a1 = Math.PI * 2) => (u, v) => { const a = a0 + (a1 - a0) * u, r = r0 + (r1 - r0) * v; return [C0.x + Math.cos(a) * r, C0.z + Math.sin(a) * r]; };
    // the street (from over the loop's kerb to the circle), its pavements and kerbs; the circle: asphalt round an island, its kerb, its pavement
    surf(Math.ceil(Lr / .5), 6, (u, v) => P(-.2 + u * (Lr + .5), (v - .5) * 2 * W2), asph, .04);
    // the corners rounded off, out to where the loop's pavement ends (the street's pavements begin there, the two meet): asphalt in the
    // curve, a kerb round it; a give-way line across the mouth (its teeth), the sign at the corner
    { const R = PAVE - ROAD, arc = (t, rad, s2) => P(R - rad * Math.cos(t * Math.PI / 2), s2 * (W2 + R - rad * Math.sin(t * Math.PI / 2)));
      for (const s2 of [-1, 1]) { const [cx, cz] = P(0, s2 * W2);
        surf(10, 6, (u, v) => { const [x, z] = arc(u, R, s2); return [x + (cx - x) * v, z + (cz - z) * v]; }, asph, .045);
        surf(14, 1, (u, v) => arc(u, R - .2 + v * .2, s2), kerbM, .12); }
      const lineM = toon('#e8e4d6');
      for (let k = -2; k <= 2; k++) { const [x, z] = P(.55, k * 1.1), tooth = new THREE.Mesh(new THREE.ConeGeometry(.28, .5, 3).rotateX(Math.PI / 2).scale(1, .05, 1), lineM); tooth.position.set(x, gy(x, z) + .06, z); tooth.rotation.y = Math.atan2(n.x, n.z);   // (pointing up the street, at whoever comes down it)
      tooth.userData.noShadow = true; G.add(tooth); }
      const sign = new THREE.Group(), [sx, sz] = P(R + .6, W2 + 1.1), tri = new THREE.Shape(); tri.moveTo(-.38, .33); tri.lineTo(.38, .33); tri.lineTo(0, -.33); tri.closePath();
      const inner = new THREE.Shape(); inner.moveTo(-.27, .26); inner.lineTo(.27, .26); inner.lineTo(0, -.21); inner.closePath();
      sign.add(box(.06, 2.2, .06, toon('#8d9196'), 0, 1.1, 0)); const red = new THREE.Mesh(new THREE.ShapeGeometry(tri), toon('#c23a2e', { side: THREE.DoubleSide })); red.position.set(0, 2.1, .04); sign.add(red);
      const wh = new THREE.Mesh(new THREE.ShapeGeometry(inner), toon('#f4f1e8', { side: THREE.DoubleSide })); wh.position.set(0, 2.1, .05); sign.add(wh);
      sign.position.set(sx, gy(sx, sz), sz); sign.rotation.y = Math.atan2(-n.x, -n.z) + Math.PI; G.add(sign); hit(sign, { hx: .06, hz: .06, h: 2.4, kind: 'hard' }, iJ); things.push({ kind: 'pole', o: sign, r: .07 }); }
    for (const s2 of [-1, 1]) { surf(Math.ceil(Lr / 1.5), 1, (u, v) => P(PAVE - ROAD + u * (Lr - (PAVE - ROAD)), s2 * (W2 + .2 + v * PW)), slabM, .07);
      surf(Math.ceil(Lr / 1.5), 1, (u, v) => P(PAVE - ROAD + u * (Lr - (PAVE - ROAD)), s2 * (W2 + v * .2)), kerbM, .12); }
    surf(48, 4, ring(Ri, Rc), asph, .04); surf(48, 1, ring(Rc, Rc + .2), kerbM, .12); surf(48, 1, ring(Rc + .2, Rc + .2 + PW), slabM, .07);
    surf(32, 1, ring(Ri - .2, Ri), kerbM, .14); surf(24, 3, ring(0, Ri - .2), grassM, .1);
    // on the island: a tree, flowers round it, a lamp
    { const i0 = probe(C0.x, C0.z, iJ); const t = new THREE.Group(), H = 3.8; grow(t, H, { x: 1, z: 0 }, 2.6 + H * .2, greenPal(), false); t.position.set(C0.x, gy(C0.x, C0.z) + .1, C0.z); G.add(t); hit(t, { hx: .3, hz: .3, h: H, kind: 'hard' }, i0.i); things.push({ kind: 'tree', o: t, H, crown: 1.4 + H * .25 });
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, o = NAT.flowers(nr, ['tulip', 'daisy', 'lupin'][k % 3]); o.group.position.set(C0.x + Math.cos(a) * 1.5, gy(C0.x, C0.z) + .1, C0.z + Math.sin(a) * 1.5); G.add(o.group); }
      hit({ position: C0, rotation: { y: 0 } }, { hx: Ri - .4, hz: Ri - .4, h: .2, kind: 'soft' }, i0.i); }
    // the three houses round the circle, facing it: the home at its far side, the neighbours either side
    const spots = []; const around = th => { const d = n.clone().multiplyScalar(Math.cos(th)).addScaledVector(f, Math.sin(th)), q = C0.clone().addScaledVector(d, Rc + .2 + PW); return { x: q.x, z: q.z, n: d.clone().negate() }; };
    const iC = probe(C0.x, C0.z, iJ).i;
    let homeH = null; house(iC, sd, { ...around(0), two: true, garage: true, open: true, porch: true, car: false, onHouse: h => { homeH = h; } });
    // the neighbours, each out in front of their house: on one side a man at his hedge with shears, on the other a lady at her gate
    const NB = [{ th: -1.4, key: 'gardener', lines: 'sasiad', side: 2.2 }, { th: 1.4, key: 'lady', lines: 'sasiadka', side: -2.4 }];
    for (const B0 of NB) { const sp = around(B0.th); house(iC, sd, { ...sp, porch: true, onHouse: h => { h.updateMatrixWorld(true); const into = new THREE.Vector3(-sp.n.x, 0, -sp.n.z), across = new THREE.Vector3(-into.z, 0, into.x);
      const w = new THREE.Vector3(sp.x, 0, sp.z).addScaledVector(into, 1.6).addScaledVector(across, B0.side); seats.push({ h, local: h.worldToLocal(w.setY(h.position.y)), stand: true, key: B0.key, face: Math.PI, lines: B0.lines, i: iC }); } }); }
    // lamps by the street
    // (one by the street, its arm over it; one on the circle's pavement, its arm over the circle)
    const lampAt = [[...P(5, W2 + 1.2), Math.atan2(f.x, f.z), 1]]; { const a = 2.3, u = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a)); lampAt.push([C0.x + u.x * (Rc + 1.2), C0.z + u.z * (Rc + 1.2), Math.atan2(-u.z, u.x), 1]); }
    for (const [x, z, yaw, ac] of lampAt) { const lp = new THREE.Group(); lp.add(box(.12, 4.2, .12, toon('#44484c'), 0, 2.1, 0)); lp.add(box(.9, .1, .1, toon('#44484c'), -.45 * Math.sign(ac), 4.15, 0)); const bulb = box(.3, .12, .2, new THREE.MeshBasicMaterial({ color: '#fff3cf' }), -.85 * Math.sign(ac), 4.05, 0); lp.add(bulb);
      lp.position.set(x, gy(x, z), z); lp.rotation.y = yaw; G.add(lp); hit(lp, { hx: .1, hz: .1, h: 4.2, kind: 'hard' }, iJ); things.push({ kind: 'pole', o: lp, r: .12 }); }
    // keep the rest away from it: no trees, no tufts, no lots on it
    zone({ position: J.clone().addScaledVector(n, Lr / 2), rotation: { y: Math.atan2(n.x, n.z) } }, W2 + PW + .8, Lr / 2 + 1); zone({ position: C0, rotation: { y: 0 } }, Rc + PW + 1, Rc + PW + 1);
    // where he starts: in front of the home's garage, on the drive, his back to the house, looking out over the circle
    homeH.updateMatrixWorld(true); const front = around(0), L = homeH.userData.lay, W0 = (x, z) => homeH.localToWorld(new THREE.Vector3(x, 0, z)).setY(0), hy = homeH.rotation.y;
    const st = W0(L.gx, L.fz - L.GZ - 2.4);   // (on the drive, a little out of the garage)
    const start = { x: st.x, z: st.z, yaw: Math.atan2(front.n.x, front.n.z) };
    // the bikes by the garage: his brother's leant on its stand on the lawn, one upside down on the other side, its front wheel off
    const bikes = [{ p: W0(L.gx - 2.45, L.fz - .75), yaw: hy + Math.PI / 2 + .08, up: false }, { p: W0(L.gx + 8.4, L.fz - 3.2), yaw: hy + Math.PI / 2 - .06, up: true }];   // (by the wall each side of the garage, off the court)
    // the family: mum on the lawn by the path, dad at his bench in the garage, the brother by the bike he took the wheel off
    const family = [{ key: 'mum', lines: 'mama', x: L.dx - 1.6, z: L.fz - 2.8, face: Math.PI + .5 }, { key: 'suit', lines: 'tata', x: L.gx + .55, z: L.fz - .85, face: Math.PI - .3 }, { key: 'kid', lines: 'brat', x: L.gx + 1.9 + 8.6, z: -1.6, face: -Math.PI / 2 }];
    for (const F of family) seats.push({ h: homeH, local: new THREE.Vector3(F.x, 0, F.z), stand: true, key: F.key, face: F.face, lines: F.lines, i: iC });
    // the court beside the house (hoops.js): nothing else to grow or stand on it
    zone(homeH, 5.2, 5.4, L.gx + 1.9 + 4.4, -1);
    // the family car: parked on the circle by the kerb, out of the way of the drive
    { const a = -.8, u = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a)), t = n.clone().multiplyScalar(-Math.sin(a)).addScaledVector(f, Math.cos(a)), c = CARS.random(rnd), p = C0.clone().addScaledVector(u, Rc - 1.3);
      c.group.position.set(p.x, gy(p.x, p.z) + .04, p.z); c.group.rotation.y = Math.atan2(t.x, t.z); G.add(c.group); hit(c.group, { hx: .9, hz: 2.1, h: 1.5, kind: 'hard' }, iC); }
    // round the home: hopscotch chalked on the drive (the court's: hoops.js), hedges between the gardens, a bench and a bin
    // on the circle, the street's name on a post at its mouth
    { const L2 = L, white = toon('#f4f1e8'), hoopM = toon('#d9542e'), hedgeM = toon('#3f6b35', { map: rep(tex.grass(3), 1, 1) });
      // (the hoop over the garage, the court on the drive: hoops.js)
      const chalk = ['#f3a6c0', '#9fc6e8', '#efc970', '#b7e09a'].map(c => toon(c)), hz0 = -L2.D / 2 - 5.2;
      [[0, 0], [0, .6], [-.3, 1.2], [.3, 1.2], [0, 1.8], [-.3, 2.4], [.3, 2.4], [0, 3.0]].forEach(([x, z], k) => homeH.add(slab(box(.5, .012, .5, chalk[k % 4], L2.gx + .55 + x, .05, hz0 - z))));
      for (const sg of [-1]) { const a = sg * .72,   // (only on the gardener's side: on the other the court by the house, the way to the neighbour open, hoops.js)
        u = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a));
        for (let r0 = Rc + 2.6; r0 < Rc + 12.5; r0 += 1.15) { const x = C0.x + u.x * r0, z = C0.z + u.z * r0, hh = 1 + rnd() * .12, hg = box(.75, hh, 1.2, hedgeM, 0, hh / 2, 0), g0 = new THREE.Group(); g0.add(hg);
          g0.position.set(x, gy(x, z), z); g0.rotation.y = Math.atan2(u.x, u.z); G.add(g0); hit(g0, { hx: .38, hz: .6, h: hh, kind: 'hard' }, iC); things.push({ kind: 'bush', o: g0 }); } }
      { const a = 2.75, u = n.clone().multiplyScalar(Math.cos(a)).addScaledVector(f, Math.sin(a)), r0 = Rc + 1.5, x = C0.x + u.x * r0, z = C0.z + u.z * r0, b = new THREE.Group(), wood = toon('#8a6a44'), iron = toon('#2f3236');
        for (const k of [0, 1, 2]) b.add(box(1.6, .05, .1, wood, 0, .45, -.12 + k * .12)); for (const k of [0, 1]) b.add(box(1.6, .1, .04, wood, 0, .7 + k * .14, .2));
        for (const sx of [-.7, .7]) { b.add(box(.06, .45, .45, iron, sx, .22, 0)); b.add(box(.06, .5, .05, iron, sx, .7, .22)); }
        b.position.set(x, gy(x, z), z); b.rotation.y = Math.atan2(-u.x, -u.z); G.add(b); hit(b, { hx: .8, hz: .3, h: .9, kind: 'hard' }, iC);
        const bin = new THREE.Group(); bin.add(box(.4, .7, .4, toon('#3f6b35'), 0, .35, 0)); bin.add(box(.44, .05, .44, toon('#2f4a3a'), 0, .72, 0)); const bx = x + f.x * 1.3 * Math.sign(Math.sin(a) || 1), bz = z + f.z * 1.3;
        const t2 = new THREE.Vector3(x, 0, z).addScaledVector(new THREE.Vector3(-u.z, 0, u.x), 1.25); bin.position.set(t2.x, gy(t2.x, t2.z), t2.z); bin.userData.keep = true; G.add(bin); hit(bin, { hx: .2, hz: .2, h: .75, kind: 'soft' }, iC); things.push({ kind: 'cone', o: bin }); }
      { const plate = cvT(64, 16, g => { g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, 64, 16); g.fillStyle = '#2f5aa0'; g.fillRect(1, 1, 62, 14); g.fillStyle = '#f6f3ea'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('UL. PORANNA', 32, 8.5); });
        const [px, pz] = P(PAVE - ROAD + .5, -(W2 + 1.3)), post = new THREE.Group(); post.add(box(.07, 2.5, .07, toon('#8d9196'), 0, 1.25, 0));
        for (const sg of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .28), toon('#ffffff', { map: plate, side: THREE.DoubleSide })); m.position.set(0, 2.35, sg * .01); m.rotation.y = sg > 0 ? 0 : Math.PI; post.add(m); }
        post.position.set(px, gy(px, pz), pz); post.rotation.y = Math.atan2(n.x, n.z) + Math.PI / 2; G.add(post); hit(post, { hx: .05, hz: .05, h: 2.5, kind: 'hard' }, iJ); things.push({ kind: 'pole', o: post, r: .07 }); } }
    rnd = keep;
    const inStreet = (x, z) => { const dx = x - J.x, dz = z - J.z, al = dx * n.x + dz * n.z, ac = dx * f.x + dz * f.z; return al > -.3 && al < Lr && Math.abs(ac) < W2; };
    const inCircle = (x, z) => { const r = Math.hypot(x - C0.x, z - C0.z); return r < Rc && r > Ri; };
    return { start, bikes, family, iJ, sd, C0, J, n, Rc, homeH, paved: (x, z) => inStreet(x, z) || inCircle(x, z), yard: (x, z) => Math.hypot(x - C0.x, z - C0.z) < Rc + 17, C0R: Rc + 15, near: (i, s2, m) => s2 === sd && Math.abs((((i - iJ) % N) + N + N / 2) % N - N / 2) * ds < m + Rc + 14 };
  }
  // the plots in place of a house now and then (see plots.js): each kind in turn, so all of them are along the way
  const pr = mulberry(97), puddle = (h, x, z, r, mud) => { h.updateMatrixWorld(true); const p = h.localToWorld(new THREE.Vector3(x, 0, z)); puddles.push({ x: p.x, z: p.z, r, mud }); };
  const plots = createPlots({ THREE, toon, tex, P, box, rep, hit, put, zone, things, seats, show, ramps, PAVE, rnd: pr, puddle, settle, groundAt }), plotOrder = [...plots.kinds].sort(() => pr() - .5); let plotK = 0;
  const farmLots = [], fieldLots = []; const whLast = {};
  // (the estate: warehouses on their stretches, a site now and then; its road works and cranes further down)
  const EST = RG.estate ? createEstate({ THREE, toon, P, put, box, hit, zone, things, parked: () => parked, puddles, PAVE, ds, N, rnd: mulberry(211), doors, mailboxes }) : null;
  const NET = RG.city ? createCityNet({ THREE, toon, S, N, ds, INNER, ROAD, PAVE, at, groundAt, put, box, hit, zone, things, doors, windows, mailboxes, colliders, G, P, rnd: mulberry(331), startI: home.iJ, CARS, parked: () => parked, townBox: s => CITY.townBox(s), scaffoldsOf: () => CITY.scaffolds, probe, stops, night: !!RG.night, tourist: !!RG.tourist, cen: { x: CEN.x, z: CEN.z, r: REACH } }) : null;   // (the town's other streets: shortcuts, side streets)
  const CITY = RG.city ? createCity({ THREE, toon, put, box, hit, zone, things, doors, windows, mailboxes, colliders, PAVE, S, N, ds, rnd: mulberry(307), G , night: !!RG.night , tourist: !!RG.tourist , walls: RG.tourist ? RG.walls : null , P }) : null, cityLast = {};
  const inFair = i => RG.fair && i >= N * RG.fair[0] - 6 / ds && i <= N * RG.fair[1] + 6 / ds;
  const lot = (i, s) => { if (inFair(i) || (RG.oneSide && s !== RG.oneSide) || home.near(i, s, 34) || nearStop(i, s, 16) || nearPost(i, s, 15) || nearShop(i, s, 14) || nearTrail(i, s, 11)) return null;
    if (NET?.blocked(i, s)) return null;
    if (CITY) { const f = i / N, gapM = (i - (cityLast[s] ?? -1e9)) * ds; if (RG.market.some(([a, b]) => f >= a && f <= b)) { if (s < 0 || gapM < 11) return null; cityLast[s] = i; return CITY.stalls(i, s); }
      if (RG.garages?.some(([a, b]) => f >= a && f <= b)) { if (gapM < 21) return null; cityLast[s] = i; return CITY.garages(i, s); }
      if (RG.blocks.some(([a, b]) => f >= a && f <= b)) { if (gapM < 38) return null; cityLast[s] = i; return CITY.block(i, s); } if (gapM < 12.2) return null; cityLast[s] = i; return CITY.tenement(i, s); }
    if (EST) { const f = i / N; if (RG.wh.some(([a, b]) => f >= a && f <= b)) { if ((i - (whLast[s] ?? -1e9)) * ds < 17.5) return null; whLast[s] = i; return EST.warehouse(i, s); } if (rnd() < RG.site) return EST.site(i, s); } if (RG.farms) { const k = rnd(); if (k > RG.houseP + .28) { fieldLots.push({ i, s }); return null; } if (k > RG.houseP) { farmLots.push({ i, s }); return null; } }
    return rnd() < (RG.classic ? 0 : .07) ? shacks(i, s) : pr() < (RG.farms ? .12 : RG.classic ? .04 : .2) ? plots.build(plotOrder[plotK++ % plotOrder.length], i, s) : house(i, s); };
  for (let i = 30; i < N - 40; i += Math.round((RG.gap[0] + rnd() * RG.gap[1]) / ds)) { if (RG.oneSide) { lot(i, RG.oneSide); continue; } lot(i, 1); if (rnd() < .9) lot(i + Math.round(8 / ds), -1); }   // (the Classic: a house at every step, on its one side)
  for (let i = 0; i < N; i += Math.round((9 + rnd() * 12) / ds)) { const side = rnd() < .5 ? -1 : 1; tree(i, side * (PAVE + 1.6 + rnd() * 3)); if (rnd() < .25) tree(i + 7, (rnd() < .5 ? -1 : 1) * (VERGE - .6)); }
  const poles = []; if (!RG.city) for (let i = 10; i < N; i += Math.round(38 / ds)) poles.push(pole(i));   // (the town: no wooden poles and wires)
  for (const p of poles) p.updateMatrixWorld(true);                   // (the wires hang from where the poles are)
  { const pos = []; for (let k = 0; k < poles.length; k++) { const a = poles[k], b = poles[(k + 1) % poles.length]; for (const [x, y] of [[-.8, 7.95], [.8, 7.95], [0, 7.35]]) {
      const pa = a.localToWorld(new THREE.Vector3(x, y, 0)), pb = b.localToWorld(new THREE.Vector3(x, y, 0)); for (let j = 0; j < 8; j++) { const t0 = j / 8, t1 = (j + 1) / 8, sag = t => Math.sin(t * Math.PI) * .5;
        pos.push(...pa.clone().lerp(pb, t0).add(new THREE.Vector3(0, -sag(t0), 0)).toArray(), ...pa.clone().lerp(pb, t1).add(new THREE.Vector3(0, -sag(t1), 0)).toArray()); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#2a2a2a' }))); }
  const parked = [];                                                   // (the ones at the kerb, for the traffic to go round)
  // (where the industrial maps have the road taken: the works (from 25 m before to 55 m on), the gantries and the forklifts' crossings;
  // no ramp in these, and the big ones moved on until clear)
  const gantryF = RG.industry === 'budowa' ? [.12, .4, .9] : [], liftF = RG.industry === 'bocznica' ? [.15, .35, .62, .82] : [];
  const busy = [...(EST ? (RG.works || []).map(([f]) => [N * f - 25 / ds, N * f + 55 / ds]) : []), ...gantryF.map(f => [N * f - 20 / ds, N * f + 20 / ds]), ...liftF.map(f => [N * f - 14 / ds, N * f + 14 / ds])];
  const isBusy = i => busy.some(([a, b]) => { const j = ((i - a) % N + N) % N; return j <= b - a; });
  const clearAt = i => { for (let k = 0; k < 40 && isBusy(i); k++) i = (i + Math.round(10 / ds)) % N; return i; };
  const bigAt = [clearAt(Math.round(N * .3)), clearAt(Math.round(N * .72))], megaAt = clearAt(Math.round(N * .51));   // (two big ramps on the road, a good run up to each; one mega ramp half way round)
  const kerbCars = []; for (const i of [140, 380, 520, 760, 900, 1120, 1250, 1480]) { if (NET?.nearWorks(i, 20) || NET?.nearTaxi(i, 30) || [...bigAt, megaAt].some(q => Math.abs(((i - q) % N + N * 1.5) % N - N / 2) * ds < 30)) continue; const sd = (i % 3 ? -1 : 1), c = CARS.random(rnd), P0 = { s: i * ds, d: sd * 2.45 }; parked.push(P0); put(c.group, i, sd * 2.45, 0, sd < 0 ? Math.PI : 0); c.group.userData.keep = true; const C = hit(c.group, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard', car: c.group }, i); kerbCars.push({ o: c.group, C, i, P0 }); }   // (kept whole: a level's finale clears its stretch of them)   // parked at the kerb
  // street trees on the verge: tall, their crowns reaching over the road; under each, its dappled shadow on the road and the pavement
  const DAP = [1, 2, 3].map(k => new THREE.MeshBasicMaterial({ map: tex.dapple(k), color: '#0c0912', transparent: true, opacity: .66, depthWrite: false, alphaTest: .5, fog: true }));
  function dapple(i, dMid, w = 10.5, l = 11) {                            // a patch laid on the ground's own shape (road, kerb, verge, pavement)
    const di = Math.round(l / 2 / ds), nx = 12, nz = 2 * di, pos = [], uv = [], idx = [];
    for (let a = 0; a <= nz; a++) for (let b = 0; b <= nx; b++) { const d = dMid - w / 2 + w * b / nx, q = at(i - di + a, d, .02); pos.push(q.x, q.y, q.z); uv.push(b / nx, a / nz); }
    for (let a = 0; a < nz; a++) for (let b = 0; b < nx; b++) { const k = a * (nx + 1) + b; idx.push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, DAP[rnd() * 3 | 0]); m.renderOrder = 1; m.receiveShadow = false; m.userData.noShadow = true; G.add(m);
  }
  function streetTree(i, side) {
    if (!free(i, side * (VERGE - .55), .6)) return;
    const t = new THREE.Group(), H = 7.2 + rnd() * 2.8, autumn = rnd() < .22;   // (twice the old height, so the crowns clear the road and the camera) (its limbs reaching over the road: its +x, as it stands)
    grow(t, H, { x: side, z: (rnd() - .5) * .4 }, 3 + rnd() * .8, autumn ? autumnPal() : greenPal(), true);
    put(t, i, side * (VERGE - .55), 0, 0); hit(t, { hx: .32, hz: .32, h: H, kind: 'hard' }, i); things.push({ kind: 'tree', o: t, H, autumn, crown: 1.8 + H * .2, reach: side }); show.tree.push({ o: t, label: 'drzewo nad jezdnią', note: H.toFixed(1) + ' m' });   // (turned with the road: its +x is the road's left, -x its right)
    dapple(i + Math.round((rnd() - .5) * 4 / ds), side * (VERGE - 3.2));
  }
  for (let i = 60; i < N - 20; i += Math.round((10 + rnd() * 7) / ds)) { if (inFair(i)) continue; if (rnd() < (RG.trees ?? .82)) { const sd = rnd() < .5 ? 1 : -1; streetTree(i, RG.oneSide || sd); } }   // (the Classic: on the houses' side only)   // (thick along the road: the crowns close over it here and there)
  // the village's poplars: rows along stretches of the road, tall and slim, at the dirt path's far edge
  if (RG.farms) { const popM = toon('#4f7a3a', { map: rep(tex.leaves(), 1, 3) }), pr2 = mulberry(77); let i = Math.round(pr2() * 60 / ds);
    while (i < N - 30) { const run = Math.round((50 + pr2() * 80) / ds), sd = pr2() < .5 ? -1 : 1;
      for (let j = i; j < i + run && j < N - 10; j += Math.round((7 + pr2() * 2) / ds)) { if (nearStop(j, sd, 12) || nearShop(j, sd, 12)) continue; const d = sd * (PAVE + 1.3); if (!free(j, d, 1)) continue;
        const t = new THREE.Group(), H = 3 + pr2() * 1.5; t.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, H, 6).translate(0, H / 2, 0), wood)); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), popM); c.scale.set(.85, 3.4 + pr2(), .85); c.position.y = H + 2.6; t.add(c);
        put(t, j, d, 0, pr2() * 6); hit(t, { hx: .22, hz: .22, h: 3, kind: 'hard' }, j); show.tree.push({ o: t, label: 'topola', note: (H + 6).toFixed(1) + ' m' }); }
      i += run + Math.round((60 + pr2() * 120) / ds); } }
  // street lamps on the right: a grey post, an arm out over the road, a lamp
  for (let i = 30; i < N; i += Math.round((46 + rnd() * 10) / ds)) { const l = new THREE.Group(), m = toon('#6a6e70'); l.add(box(.14, 6.2, .14, m, 0, 3.1, 0));
    const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 6.0, 0), new THREE.Vector3(-.4, 6.5, 0), new THREE.Vector3(-1.4, 6.6, 0), new THREE.Vector3(-2.0, 6.45, 0)]), 12, .05, 6), m); l.add(arm);
    l.add(box(.7, .16, .32, m, -2.05, 6.38, 0)); l.add(box(.55, .05, .24, toon('#fff4d6'), -2.05, 6.29, 0));
    put(l, i, VERGE - .7, 0, Math.PI); hit(l, { hx: .1, hz: .1, h: 6, kind: 'hard' }, i); }                               // (turned so its arm, along -x, reaches over the road)
  // drains in both gutters, hydrants now and then on the verge
  const grateM = toon('#ffffff', { map: tex.grate() }), hydM = toon('#b3372c'), capM = toon('#d8d2c0');
  for (let i = 12; i < N; i += Math.round((34 + rnd() * 20) / ds)) for (const sd of [-1, 1]) if (rnd() < .6) put(box(.55, .03, .9, grateM), i + (sd > 0 ? 0 : 20), sd * (ROAD - .32), .005, 0);
  // a hydrant: a flanged foot, the barrel, a collar, the bonnet (a dome) with its nut; two hose outlets at the sides and the big one to
  // the front, each capped, the caps' nuts; a chain from the front cap; bolts round the flanges
  const hydD = toon('#8e2e25'), boltM = toon('#5e1c17'), chainM = toon('#44484c');
  function hydrant() { const hy = new THREE.Group(), L = (pts, m, seg = 14) => { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), m); hy.add(o); return o; };
    L([[0, 0], [.19, 0], [.19, .06], [.14, .075], [0, .075]], hydD);                                  // the foot
    L([[0, .07], [.125, .07], [.12, .3], [.118, .5], [0, .5]], hydM);                                 // the barrel
    L([[0, .49], [.155, .49], [.155, .545], [.13, .56], [0, .56]], hydD);                             // the collar
    L([[0, .55], [.135, .55], [.13, .6], [.11, .67], [.07, .72], [.03, .74], [0, .745]], hydM);       // the bonnet
    const nut = new THREE.Mesh(new THREE.CylinderGeometry(.034, .04, .06, 5), hydD); nut.position.y = .77; hy.add(nut);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; for (const [y, r] of [[.065, .165], [.55, .145]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(.013, 5, 4), boltM); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); hy.add(b); } }
    for (const [a, r, len, y] of [[0, .045, .09, .42], [Math.PI, .045, .09, .42], [Math.PI / 2, .065, .1, .38]]) {   // outlets: side, side, front
      const o = new THREE.Group(); o.position.y = y; o.rotation.y = a; hy.add(o);
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, len, 12), hydM); pipe.rotation.z = Math.PI / 2; pipe.position.x = .1 + len / 2; o.add(pipe);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, .035, 12), hydD); cap.rotation.z = Math.PI / 2; cap.position.x = .1 + len + .015; o.add(cap);
      const cn = new THREE.Mesh(new THREE.CylinderGeometry(r * .45, r * .45, .03, 5), hydM); cn.rotation.z = Math.PI / 2; cn.position.x = .1 + len + .045; o.add(cn); }
    const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.07, .36, .2), new THREE.Vector3(.1, .28, .17), new THREE.Vector3(.12, .3, .1)]), 6, .006, 4), chainM); hy.add(chain);
    return hy; }
  for (let i = 80; i < N; i += Math.round((70 + rnd() * 50) / ds)) { const sd = rnd() < .5 ? -1 : 1, hy = hydrant();
    put(hy, i, sd * (VERGE - .9), 0, sd > 0 ? Math.PI : 0); hit(hy, { hx: .2, hz: .2, h: .8, kind: 'hard' }, i); colliders[colliders.length - 1].hyd = true; }   // (the big outlet to the road; hyd: water, if it is hit)
  // spruces behind the houses (they show over the roofs), and a few round trees in the back gardens
  const spruceM = toon('#284a2b', { flatShading: true, map: rep(tex.leaves(), 2, 2) });
  for (let i = 0; i < N; i += Math.round((11 + rnd() * 10) / ds)) { const sd = rnd() < .5 ? -1 : 1, t = new THREE.Group(), H = 7 + rnd() * 6;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.14, .22, H * .3, 6), wood); tr.position.y = H * .15; t.add(tr);
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.9 - k * .38) * (H / 10), H * .34, 8), spruceM); c.position.y = H * (.3 + k * .19); t.add(c); }
    const dS = sd * (PAVE + 22 + rnd() * 10); if (free(i, dS, 1.6)) { show.tree.push({ o: t, label: 'świerk', note: H.toFixed(1) + ' m' }); put(t, i, dS, 0, rnd() * 6); hit(t, { hx: .25, hz: .25, h: H, kind: 'hard' }, i); things.push({ kind: 'tree', o: t, H, spruce: true, crown: H * .16 }); } if (rnd() < .4) tree(i + 9, sd * (PAVE + 19 + rnd() * 6)); }
  // ---------- between the houses: a side fence on the boundary, and what a garden has ----------
  for (let k = 0; k < lots.length; k++) { const a = lots[k], b = lots.slice(k + 1).find(o => o.side === a.side); if (!b || b.i - a.i > 70 || trailPlans.some(t => t.sd === a.side && t.i0 > a.i && t.i0 < b.i)) continue;
    const mid = Math.round((a.i + b.i) / 2), sd = a.side, len = 14 + rnd() * 5, f = rnd() < .55 ? P.boardFence(len) : P.wireFence(len);
    put(f.group, mid, sd * (PAVE + 1.5 + len / 2), 0, Math.PI / 2); hit(f.group, f.hit, mid);
    const extras = [P.shed, P.washing, P.logs, P.sandbox, P.birdbath]; for (let n = 0; n < 1 + (rnd() * 2 | 0); n++) { const e = extras[rnd() * extras.length | 0](rnd), off = (rnd() < .5 ? -1 : 1) * (2.5 + rnd() * 2);
      const ii = mid + Math.round(off / ds), dd = sd * (PAVE + 8 + rnd() * 9); put(e.group, ii, dd, 0, rnd() < .5 ? 0 : Math.PI / 2); hit(e.group, e.hit, ii); }
    if (rnd() < .35) tree(mid + Math.round((rnd() - .5) * 6 / ds), sd * (PAVE + 12 + rnd() * 6)); }
  // ---------- a car stood by a house that something else stands in after all (the next house's annex, a shed, a fence between the
  //   gardens): taken away (each house places its own things, not knowing its neighbours'). A box's overlap: a corner, an edge's middle or
  //   the middle of one inside the other ----------
  { const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
    const pts = (x, z, c, s, hx, hz) => { const o = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [1, 0], [0, 1], [-1, 0], [0, 0]]) { const lx = a * hx, lz = b * hz; o.push([x + lx * c + lz * s, z - lx * s + lz * c]); } return o; };
    const inBox = (x, z, cx, cz, c, s, hx, hz) => { const dx = x - cx, dz = z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < hx && Math.abs(lz) < hz; };
    for (const sc of standCars) { const o = sc.o; if (!o.parent) continue; o.updateMatrixWorld(true); o.getWorldPosition(_p); o.getWorldQuaternion(_q); const yw = _e.setFromQuaternion(_q, 'YXZ').y, c = Math.cos(yw), sn = Math.sin(yw), hx = .85, hz = 2.1, own = o.userData.hitC;
      let bad = false; for (const C of near(sc.i)) { if (C === own || C.o === sc.h || ['ramp', 'bundle', 'hole', 'manhole'].includes(C.kind) || C.used) continue; if (Math.abs(C.x - _p.x) + Math.abs(C.z - _p.z) > 14) continue;
        if (pts(C.x, C.z, C.c, C.s, C.hx, C.hz).some(([x, z]) => inBox(x, z, _p.x, _p.z, c, sn, hx, hz)) || pts(_p.x, _p.z, c, sn, hx, hz).some(([x, z]) => inBox(x, z, C.x, C.z, C.c, C.s, C.hx, C.hz))) { bad = true; break; } }
      if (bad) { o.parent.remove(o); if (own) { own.kind = 'gone'; own.used = true; } standCars.removed = (standCars.removed || 0) + 1; } } }
  // ---------- grass and flowers along it: tufts at the verge's edge by the kerb and the pavement, and along the lawns' edge; a clump of
  //   flowers now and then (never on a drive, a path, a porch) ----------
  for (let i = 0; i < N; i += Math.max(1, Math.round((1.6 + nr() * 2.2) / ds))) for (const sd of [-1, 1]) { if (nr() < .35) continue;
    const d = sd * (nr() < .5 ? KERB + .3 + nr() * .25 : nr() < .5 ? VERGE - .18 : PAVE + .15 + nr() * .4); if (!free(i, d, .25)) continue;
    const o = nr() < .12 && Math.abs(d) > PAVE ? NAT.flowers(nr, ['tulip', 'daisy', 'lupin', 'daisy'][nr() * 4 | 0]) : NAT.grassTuft(nr, nr() < .08 ? 'tall' : 'lawn'); put(o.group, i, d, 0, nr() * 6); }
  // ---------- worn paths across the meadows between the houses: a strip of trodden earth wandering back from the pavement (inside the
  //   loop, to the woods), grass and flowers thick along its edges, a few pebbles on it, at its end now and then a stump or a bench;
  //   only where it runs into nothing (a house, a fence, a drive) ----------
  { const dirtT = cvT(16, 16, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 16, 16); for (let k = 0; k < 60; k++) { g.fillStyle = ['#d8cbb4', '#efe6d4', '#b9a98c', '#c9bb9e'][k % 4]; g.fillRect((k * 7 + (k >> 2)) % 16, (k * 11) % 16, 1 + (k % 3 === 0), 1); } });
    dirtT.wrapS = dirtT.wrapT = THREE.RepeatWrapping; const dirtM = toon('#8f7654', { map: dirtT }), stumpM = toon('#7a5a3a'), ringM = toon('#c9a978'), benchM = toon('#9e7a4f');
    // a bench, of a few kinds: the park's (slats on cast iron, green), a plank on two stumps, a concrete one; a park bin by the first
    const ironM = toon('#2f4a3a'), concM = toon('#a8a49a'), binPM = toon('#3f6b35');
    const bench = kind => { const b = new THREE.Group();
      if (kind === 'park') { for (let q = 0; q < 3; q++) b.add(box(1.6, .04, .1, benchM, 0, .45, -.14 + q * .13)); for (let q = 0; q < 2; q++) { const sl = box(1.6, .1, .03, benchM, 0, .66 + q * .14, .24); sl.rotation.x = -.18; b.add(sl); }
        for (const x of [-.7, .7]) { b.add(box(.06, .45, .06, ironM, x, .22, -.15)); b.add(box(.06, .9, .06, ironM, x, .45, .2)); b.add(box(.06, .06, .42, ironM, x, .43, .02)); b.add(box(.06, .05, .3, ironM, x, .62, .05)); } }
      else if (kind === 'stumps') { for (const x of [-.55, .55]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.18, .21, .4, 8), stumpM); st.position.set(x, .2, 0); b.add(st); } b.add(box(1.7, .07, .32, toon('#8a6a45'), 0, .43, 0)); }
      else { b.add(box(1.5, .1, .45, concM, 0, .42, 0)); for (const x of [-.55, .55]) b.add(box(.18, .38, .4, concM, x, .19, 0)); }
      return b; };
    const parkBin = () => { const g = new THREE.Group(); g.add(box(.06, .7, .06, ironM, 0, .35, 0)); const c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .45, 10, 1, true), binPM); c.position.y = .75; g.add(c); const rim = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 4, 12), ironM); rim.rotation.x = Math.PI / 2; rim.position.y = .97; g.add(rim); return g; };
    // a treehouse: a big tree, and in it a platform, walls of boards, a pitched roof, a ladder up; at a path's end in the woods
    const planksM = toon('#9e7a4f', { map: rep(tex.siding(), 1, 1) }), roofTM = toon('#6b4a2e');
    const treehouse = (p, yaw) => { const t = new THREE.Group(); grow(t, 6.2, { x: .2, z: 0 }, 4.4, greenPal(), true);   // (a tall one: the crown over the house, not round it)
      const h = new THREE.Group(); h.position.set(.25, 2.7, .1); t.add(h); h.add(box(2.4, .12, 2.2, planksM, 0, 0, 0)); for (const [x, z, w, d] of [[0, -1, 2.2, .08], [0, 1, 2.2, .08], [-1.1, 0, .08, 2.0]]) h.add(box(w, 1.3, d, planksM, x, .7, z));
      for (const sg of [-1, 1]) { const rf = box(2.6, .08, 1.3, roofTM, 0, 1.62, sg * .55); rf.rotation.x = sg * .55; h.add(rf); } h.add(box(.5, .4, .06, toon('#2a2c30'), .4, .9, -1.03));   // (a window)
      for (const z of [-.22, .22]) { const rl = box(.06, 3.0, .06, planksM, 1.75, 1.4, z); rl.rotation.z = .14; t.add(rl); } for (let q = 0; q < 7; q++) t.add(box(.06, .05, .46, planksM, 1.93 - q * .055, .3 + q * .38, 0));   // the ladder
      t.position.copy(p); t.rotation.y = yaw; t.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); G.add(t); show.tree.push({ o: t, label: 'domek na drzewie', note: 'z drabinką' }); };
    // a strip of trodden earth through points, grass thick a step off its edges (taller where nobody treads), flowers, a bush further
    // off, pebbles on it; nothing grows on it after (the woods keep off)
    const lay = (pts, narrow) => { const pos = [], uv = [], idx = []; let L = 0;
      for (let k = 0; k < pts.length; k++) { const p0 = pts[Math.max(0, k - 1)], p1 = pts[Math.min(pts.length - 1, k + 1)], dx = p1.x - p0.x, dz = p1.z - p0.z, dl = Math.hypot(dx, dz) || 1, w = (narrow ? .38 : .5) + Math.sin(k * 1.7) * .08 - (k > pts.length - 4 ? (k - pts.length + 4) * .1 : 0);
        if (k) L += pts[k].distanceTo(pts[k - 1]); const nx = -dz / dl, nz = dx / dl, p = pts[k];
        { const hi = probe(p.x, p.z, p.i ?? -1).i, lift = p.y - meshY(p.x, p.z, hi); pos.push(p.x + nx * w, meshY(p.x + nx * w, p.z + nz * w, hi) + lift, p.z + nz * w, p.x - nx * w, meshY(p.x - nx * w, p.z - nz * w, hi) + lift, p.z - nz * w); } uv.push(0, L / 1.2, 1, L / 1.2); if (k) { const q = k * 2; idx.push(q - 2, q - 1, q, q - 1, q + 1, q); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; let up = 0; for (let k = 0; k < n.count; k++) up += n.getY(k); if (up < 0) { g.index.array.reverse(); g.computeVertexNormals(); } }
      const m = new THREE.Mesh(g, dirtM); m.receiveShadow = true; G.add(m);
      for (let k = 0; k < pts.length; k += 2) zone({ position: pts[k], rotation: { y: 0 } }, .9, .9);
      for (let k = 1; k < pts.length - 1; k++) { const p = pts[k], q = pts[k + 1], dl = Math.hypot(q.x - p.x, q.z - p.z) || 1, nx = -(q.z - p.z) / dl, nz = (q.x - p.x) / dl;
        for (const s2 of [-1, 1]) { const r0 = nr(), e = s2 * (r0 < .14 ? 1.5 + nr() * .8 : .75 + nr() * .6);
          const o = r0 < .1 ? NAT.flowers(nr, ['daisy', 'daisy', 'lupin', 'tulip'][nr() * 4 | 0]) : r0 < .14 && k > 3 ? NAT.bush(nr, ['round', 'fern', 'tall'][nr() * 3 | 0]) : r0 < .7 ? NAT.grassTuft(nr, nr() < .15 ? 'tall' : 'lawn') : null;
          if (o) { o.group.position.set(p.x + nx * e, p.y - .04, p.z + nz * e); o.group.rotation.y = nr() * 6; G.add(o.group); } }
        if (nr() < .1) { const st = NAT.rocks(nr, 1).group; st.scale.setScalar(.2 + nr() * .14); st.position.set(p.x + nx * (nr() - .5) * .5, p.y - .04, p.z + nz * (nr() - .5) * .5); G.add(st); } } };
    // by a path, a bench facing it (a park bin by the park's one), set a step off its side
    const sitBy = (pts, k, kind) => { const p = pts[k], q = pts[Math.min(pts.length - 1, k + 1)], dl = Math.hypot(q.x - p.x, q.z - p.z) || 1, nx = -(q.z - p.z) / dl, nz = (q.x - p.x) / dl, sg = nr() < .5 ? -1 : 1;
      const b = bench(kind); b.position.set(p.x + nx * sg * 1.25, p.y - .04, p.z + nz * sg * 1.25); b.rotation.y = Math.atan2(-nx * sg, -nz * sg) + Math.PI; G.add(b);
      if (kind === 'park' && nr() < .75) { const bn = parkBin(); bn.position.set(p.x + nx * sg * 1.2 + (q.x - p.x) / dl * 1.2, p.y - .04, p.z + nz * sg * 1.2 + (q.z - p.z) / dl * 1.2); G.add(bn); binsO.push(bn); } };
    const benchKind = () => ['park', 'park', 'stumps', 'concrete'][nr() * 4 | 0];
    // a path out from the pavement: straight on by the houses, then wandering (drift: how it turns along the road as it goes), as far
    // as it gets; a branch off it now and then; at its end a stump, a bench, or (deep in the woods) a treehouse
    const trail = (fi0, sd, d0, dEnd, drift0, depth) => { const pts = [], at2 = []; let off = 0, drift = drift0;
      for (let d = d0; d < dEnd; d += .9) { drift = THREE.MathUtils.clamp(drift + (nr() - .5) * .16, -.9, .9); off += drift; if (!depth && d < 29) off = THREE.MathUtils.clamp(off, -2.2, 2.2);   // (by the houses: straight on)
        const fi = fi0 + off / ds, ii = Math.round(fi), i1 = Math.floor(fi), t = fi - i1;
        if (d > PAVE + 1.2 && !free(((ii % N) + N) % N, sd * d, 1.05, false)) break; pts.push(at(i1, sd * d, .045).lerp(at(i1 + 1, sd * d, .045), t)); at2.push([fi, d, drift]); }
      if (pts.length < 6) return null;
      lay(pts, depth);
      if (pts.length > 12 && nr() < .45) sitBy(pts, Math.floor(pts.length * (.3 + nr() * .4)), benchKind());
      if (!depth && pts.length > 14 && nr() < .5) { const k = Math.floor(pts.length * (.35 + nr() * .35)), [fi, d, dr] = at2[k]; trail(fi, sd, d, Math.min(dEnd, d + 10 + nr() * 14), dr + (nr() < .5 ? -1 : 1) * (.5 + nr() * .3), 1); }
      const e = pts[pts.length - 1], kk = nr(), deep = at2[at2.length - 1][1] > 34;
      if (deep && sd === INNER && !depth && kk < .4) { const e2 = pts[pts.length - 1], q = pts[pts.length - 2]; treehouse(e2.clone().setY(e2.y - .04).add(new THREE.Vector3((e2.x - q.x) * 2.5, 0, (e2.z - q.z) * 2.5)), Math.atan2(e2.x - q.x, e2.z - q.z) + Math.PI / 2); }
      else if (kk < .3) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, .4, 9), stumpM); st.position.set(e.x, e.y + .16, e.z); G.add(st); const top = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .02, 9), ringM); top.position.set(e.x, e.y + .37, e.z); G.add(top); }
      return pts; };
    // a path along the backs of the gardens, from one path's meadow to the next: it finds its way round what is there (a little
    // nearer or farther), or stops
    const along = (iA, iB, sd, d0) => { const pts = []; let d = d0;
      for (let i = iA; i < iB; i += Math.max(1, Math.round(.9 / ds))) { d = THREE.MathUtils.clamp(d + (nr() - .5) * .3, d0 - 2.5, d0 + 2.5); let ok = false;
        for (const dd of [d, d - 1.2, d + 1.2, d - 2.2, d + 2.2]) if (free(i % N, sd * dd, 1, false)) { d = dd; ok = true; break; }
        if (!ok) break; pts.push(at(i, sd * d, .045)); }
      if (pts.length < 10) return; lay(pts, true); if (nr() < .6) sitBy(pts, Math.floor(pts.length / 2), benchKind()); };
    for (const t of trailPlans) trail(t.i0, t.sd, PAVE + .3, t.sd === INNER ? 36 + nr() * 11 : 31 + nr() * 8, (nr() - .5) * .9, 0);   // (inside: into the woods, short of the lake)
    for (let k = 0; k < trailPlans.length; k++) { const a = trailPlans[k], b = trailPlans.slice(k + 1).find(o => o.sd === a.sd); if (!b || (b.i0 - a.i0) * ds > 95 || nr() < .35) continue; along(a.i0 + 2, b.i0 - 2, a.sd, 30.5 + nr() * 2.5); } }
  // ---------- puddles by the kerb, after the night's rain (a wheel through one: a splash; one by the pavement: whoever is there gets it) ----------
  // (a flat patch on the road (a puddle, mud) laid on it point by point: flat on a slope or a camber, part of it went under and flickered)
  function lay(m, i, lift) { m.updateMatrixWorld(true); const inv = m.matrixWorld.clone().invert(), pa = m.geometry.attributes.position, w = new THREE.Vector3();
    for (let k = 0; k < pa.count; k++) { w.fromBufferAttribute(pa, k).applyMatrix4(m.matrixWorld); w.y = probe(w.x, w.z, i).y + lift; w.applyMatrix4(inv); pa.setXYZ(k, w.x, w.y, w.z); } pa.needsUpdate = true; m.geometry.computeBoundingSphere(); }
  { const waterM = toon('#8aa2b0', { transparent: true, opacity: .8 });
    for (let i = 20; i < N; i += Math.round((24 + pr() * 30) / ds)) { if (pr() > .5) continue; const sd = pr() < .5 ? -1 : 1, r = .45 + pr() * .5, d = sd * (ROAD - .25 - r - pr() * .6);
      const g = new THREE.CircleGeometry(r, 14); g.scale(1, 1.9, 1); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, waterM); m.userData.noShadow = true; m.renderOrder = 1; put(m, i, d, .014, 0); lay(m, i, .025); m.receiveShadow = true;
      puddles.push({ x: m.position.x, z: m.position.z, r: r * 1.5, mud: false }); } }
  // the village's mud on the road itself (a field's gate, a tractor's tracks): brown patches across a lane or most of the road, a darker
  // rim; a wheel through one is held back (and splashed), hopped over it is nothing
  if (RG.farms) { const mudM = toon('#6b4f33'), rimM = toon('#54402a'), mr = mulberry(131);
    for (let i = 40; i < N - 20; i += Math.round((45 + mr() * 40) / ds)) { if (mr() > .62) continue; const r = 1.1 + mr() * .8, d = (mr() - .5) * (ROAD * 1.2);
      for (const [rr, m, y] of [[r * 1.12, rimM, .012], [r, mudM, .018]]) { const g = new THREE.CircleGeometry(rr, 16); g.scale(1, 1.5 + mr() * .4, 1); g.rotateX(-Math.PI / 2); const o = new THREE.Mesh(g, m); o.userData.noShadow = true; o.renderOrder = 1; put(o, i, d, y, mr() * .6 - .3); lay(o, i, y + .012); o.receiveShadow = true; }
      const q = at(i, d, 0); puddles.push({ x: q.x, z: q.z, r: r * 1.15, mud: true, road: true }); } }
  // ---------- on the road and the pavement: things to ride round, over or into ----------

  const RD = RG.rideDir || 1, RT = RD < 0 ? Math.PI : 0;   // (the way the ramps face: up the way the route is ridden)
  for (const i of bigAt) { const o = P.ramp(rnd, 'big'); put(o.group, i, 1.4 * RD, 0, RT); ramps.push(hit(o.group, o.hit, i)); parked.push({ s: i * ds, d: 1.4 * RD }); }   // (the traffic goes round it)
  { const i = megaAt, o = P.ramp(rnd, 'mega'); put(o.group, i, -1.3 * RD, 0, RT); ramps.push(hit(o.group, o.hit, i)); parked.push({ s: i * ds, d: -1.3 * RD }); }   // (and one mega ramp on the other half of the road, half way round)
  if (EST) { for (const [f, sd] of RG.works) EST.works(Math.round(N * f), sd); const cr = mulberry(223), nc = RG.cranes || 5; for (let k = 0; k < nc; k++) EST.crane(Math.round(N * (k + cr() * .6) / nc), (cr() < .5 ? -1 : 1) * (PAVE + 34 + cr() * 40)); }   // (the road works, the cranes over the roofs)
  for (let i = 90; i < N - 30; i += Math.round((26 + rnd() * 30) / ds)) {
    const r = rnd(), sd = rnd() < .5 ? -1 : 1;
    if (EST && RG.works.some(([f]) => Math.abs(i - N * f) * ds < 45)) continue;   // (not in the road works)
    if (inFair(i)) continue;   // (not in the fair)
    if (r < .26 && isBusy(i)) continue;
    if (bigAt.some(b => Math.abs(b - i) * ds < 14)) continue;             // (the big ones' run up and landing kept clear)
    // (a ramp: in town not on the pavement (its benches, bins and posts in the way of the landing), and never with a car parked before or after it)
    if (r < .26 && (parked.some(q => q.d * sd > 0 && Math.abs(q.s - i * ds) < 18) || NET?.nearWorks(i, 30))) continue;
    if (r < .26) { const o = P.ramp(rnd, rnd() < .45 ? 'kicker' : 'plank'), onPave = rnd() < .4 && !NET, d = onPave ? sd * 5.8 : sd * (1 + rnd() * 1.4); put(o.group, i, d, 0, RT); if (RG.harvest) o.group.traverse(q => { if (q.isMesh && q.material?.color) { q.material = q.material.clone(); q.material.color.lerp(new THREE.Color('#e2c25e'), .7); } }); ramps.push(hit(o.group, o.hit, i)); }       // a ramp, up the way you ride (the harvest: straw)
    else if (r < .4) { for (let n = 0; n < 2 + (rnd() * 2 | 0); n++) { const o = P.cone(), ii = i + n * 5, d = sd * (1.2 + n * .7 + rnd() * .3); put(o.group, ii, d, 0, rnd() * 6); const C = hit(o.group, o.hit, ii); o.group.userData.keep = true; C.thing = { kind: 'cone', o: o.group, C, r: .18 }; things.push(C.thing); } }
    else if (r < .48) { const o = P.bags(rnd), d = sd * (VERGE - .3 + rnd() * 1.4); put(o.group, i, d, 0, 0); hit(o.group, o.hit, i); }
    else if (r < .56) { const o = P.wagon(), d = sd * (VERGE + .8); put(o.group, i, d, 0, rnd() * 6); hit(o.group, o.hit, i); }
    else if (r < .64) { const o = P.barrier(), d = sd * (1.7 + rnd()); put(o.group, i, d, 0, 0); hit(o.group, o.hit, i); for (const dz of [-3, 3]) { const c = P.cone(), ii = i + Math.round(dz / ds); put(c.group, ii, d, 0, 0); const C = hit(c.group, c.hit, ii); c.group.userData.keep = true; C.thing = { kind: 'cone', o: c.group, C, r: .18 }; things.push(C.thing); } }
    else if (r < .74) { const o = P.pothole(rnd), d = (rnd() - .5) * 5; put(o.group, i, d, 0, rnd() * 3); hit(o.group, o.hit, i); }
    else if (r < .84) { const o = P.manhole(rnd), d = sd * (.8 + rnd() * 1.6); put(o.group, i, d, 0, rnd() * 6); hit(o.group, o.hit, i); }   // an open manhole
    else { const o = P.bundle(), d = sd * (VERGE + .6); o.group.userData.keep = true; put(o.group, i, d, 0, 0); bundles.push(hit(o.group, o.hit, i)); }   // (kept whole: it goes when picked up)
  }

  // ---------- the country beyond the gardens (45-130 m out): fields in stripes, hedges along them, groves, farms with red barns ----------
  { const fr = mulberry(31), stripes = (c1, c2, rows = 8) => { const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');   // (a field's rows)
      for (let k = 0; k < rows; k++) { x.fillStyle = k % 2 ? c1 : c2; x.fillRect(0, k * 16 / rows, 16, 16 / rows); } for (let k = 0; k < 20; k++) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(fr() * 16 | 0, fr() * 16 | 0, 1, 1); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const FIELDS = (RG.harvest ? [['#e2c25e', '#d1ab48'], ['#d8c588', '#c2ac6c'], ['#e6cf7a', '#cfb35a'], ['#d9b45a', '#c9a04a']] : [['#d9b45a', '#c9a04a'], ['#8a6038', '#6b4a2e'], ['#77a146', '#5b8a3c'], ['#c9b77a', '#b8a060'], ['#98b85a', '#7c9a45']]).map(([a, b]) => toon('#ffffff', { map: stripes(a, b) }));   // (the harvest: all golden, standing or cut)
    // a patch laid on the rolling ground: from d0 to d1 across, from i0 to i1 along, its rows running along or across
    function field(i0, i1, d0, d1, m, across) {
      const na = 8, nd = 6, pos = [], uv = [], idx = [];
      for (let a = 0; a <= na; a++) for (let b = 0; b <= nd; b++) { const i = Math.round(i0 + (i1 - i0) * a / na), d = d0 + (d1 - d0) * b / nd, q = at(i, d, .3); pos.push(q.x, q.y, q.z);
        const L = (i1 - i0) * ds * a / na, D = (d1 - d0) * b / nd; uv.push(across ? L / 6 : D / 6, across ? D / 20 : L / 20); }
      for (let a = 0; a < na; a++) for (let b = 0; b < nd; b++) { const k = a * (nd + 1) + b; idx.push(k, k + nd + 1, k + 1, k + 1, k + nd + 1, k + nd + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      if (d0 > 0) { g.index.array.reverse(); g.computeVertexNormals(); }                                     // (the right side: turned so it faces up)
      const o = new THREE.Mesh(g, m); o.receiveShadow = true; G.add(o); }
    const farLeaf = ['#355f31', '#467537', '#5b8a3c', '#5f6a35', '#b86a2e'].map(c => toon(c, { map: rep(tex.leaves(), 1.5, 1.5) }));
    function farTree(i, d, k = 1) { const t = new THREE.Group(), H = (2.5 + fr() * 2.5) * k, m = farLeaf[fr() < .12 ? 4 : fr() * 4 | 0];
      t.add(box(.25 * k, H, .25 * k, wood, 0, H / 2, 0)); for (let n = 0; n < 2 + (fr() * 2 | 0); n++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.2 + fr()) * k, 0), m); b.position.set((fr() - .5) * 1.4 * k, H + (fr() - .3) * 1.2 * k, (fr() - .5) * 1.4 * k); b.scale.y = .85; t.add(b); }
      put(t, i, d, 0, fr() * 6); }
    const barnM = toon('#9a3a2c', { map: rep(tex.siding(), 2, 1.5) }), barnRoof = toon('#44484c', { map: tex.shingles() }), farmWall = toon('#e8dcc0', { map: rep(tex.siding(), 2, 1.5) }), farmRoof = toon('#6d4a3a', { map: tex.shingles() });
    function barn(i, d) { const b = new THREE.Group(), W = 9 + fr() * 4, D = 7 + fr() * 2, H = 4;
      b.add(box(W, H, D, barnM, 0, H / 2, 0)); b.add(box(W * .2, H * .7, .1, white, 0, H * .35, -D / 2 - .03));
      const sh = new THREE.Shape(); sh.moveTo(-D / 2 - .3, 0); sh.lineTo(-D / 2 + .6, 1.6); sh.lineTo(0, 2.6); sh.lineTo(D / 2 - .6, 1.6); sh.lineTo(D / 2 + .3, 0); sh.closePath();   // (a gambrel roof)
      const rg = new THREE.ExtrudeGeometry(sh, { depth: W + .4, bevelEnabled: false }); rg.translate(0, 0, -(W + .4) / 2); const r = new THREE.Mesh(rg, barnRoof); r.rotation.y = Math.PI / 2; r.position.y = H; b.add(r);
      show.farm.push({ o: b, label: 'stodoła', note: `${W.toFixed(1)} × ${D.toFixed(1)} m` });
      put(b, i, d, 0, (fr() - .5) * .6 + (d > 0 ? -Math.PI / 2 : Math.PI / 2)); }
    function farmhouse(i, d) { const h = new THREE.Group(), W = 8, D = 7, H = 5.4; h.add(box(W, H, D, farmWall, 0, H / 2, 0));
      const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .4, 0); tri.lineTo(D / 2 + .4, 0); tri.lineTo(0, 2.6); tri.closePath(); const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .6, bevelEnabled: false }); rg.translate(0, 0, -(W + .6) / 2);
      const r = new THREE.Mesh(rg, farmRoof); r.rotation.y = Math.PI / 2; r.position.y = H; h.add(r); for (const x of [-2.2, 0, 2.2]) for (const y of [1.5, 3.9]) h.add(box(1, 1, .08, WINS[0], x, y, -D / 2 - .04));
      put(h, i, d, 0, (fr() - .5) * .4 + (d > 0 ? -Math.PI / 2 : Math.PI / 2)); show.farm.push({ o: h, label: 'dom w gospodarstwie', note: '8 × 7 m' }); return h; }
    // another estate out there: a street of its own running alongside, small houses both sides of it, a tree or two
    const asphaltM = toon('#4a4d52', { map: rep(tex.asphalt(), 1, 1) }), EST = ['#e8dcc0', '#b7c29a', '#a9bccb', '#d8b8a0', '#f0ece2', '#e3c77e'].map(c => toon(c, { map: rep(tex.siding(), 2, 1.5) }));
    const estRoof = ['#8e3b2c', '#5a5f66', '#6d4a3a'].map(c => toon(c, { map: tex.shingles() }));
    function smallHouse(i, d, face) { const h = new THREE.Group(), W = 6.5 + fr() * 2, D = 6 + fr(), H = 2.8 + (fr() < .3 ? 2.6 : 0); h.add(box(W, H, D, EST[fr() * EST.length | 0], 0, H / 2, 0));
      const tri = new THREE.Shape(); tri.moveTo(-D / 2 - .3, 0); tri.lineTo(D / 2 + .3, 0); tri.lineTo(0, 2); tri.closePath(); const rg = new THREE.ExtrudeGeometry(tri, { depth: W + .4, bevelEnabled: false }); rg.translate(0, 0, -(W + .4) / 2);
      const r = new THREE.Mesh(rg, estRoof[fr() * 3 | 0]); r.rotation.y = Math.PI / 2; r.position.y = H; h.add(r); for (const x of [-W * .28, W * .28]) h.add(box(1, 1, .08, WINS[fr() * WINS.length | 0], x, 1.5, -D / 2 - .04)); h.add(box(.9, 1.9, .08, dark, 0, .95, -D / 2 - .04));
      put(h, i, d, 0, face); }
    function estate(i0, i1, d0) { const dr = d0 + 12, sgn = Math.sign(d0);
      field(i0, i1, dr - 3, dr + 3, asphaltM, true);                                                  // (its street)
      for (let i = i0 + Math.round(5 / ds); i < i1 - Math.round(4 / ds); i += Math.round((11 + fr() * 4) / ds)) for (const side of [-1, 1]) {
        smallHouse(i, dr + side * 9.5 * sgn, side * sgn > 0 ? -Math.PI / 2 : Math.PI / 2); if (fr() < .35) farTree(i + Math.round(5 / ds), dr + side * 5.5 * sgn, .8); } }
    // (a farm by the road: its house takes papers, a door like a house's in the street; the barn behind)
    for (const F of farmLots) { if (!free(F.i, F.s * (PAVE + 10), 5)) continue; const h = farmhouse(F.i, F.s * (PAVE + 10)); h.updateMatrixWorld(true); const n = new THREE.Vector3(0, 0, -1).applyQuaternion(h.quaternion); n.y = 0; n.normalize();
      const p = h.localToWorld(new THREE.Vector3(0, 0, -3.5 - 2.6)); if (n.x * (S[F.i].p.x - p.x) + n.z * (S[F.i].p.z - p.z) > 0) doors.push({ p, n, done: false, i: F.i }); barn(F.i + Math.round(15 / ds), F.s * (PAVE + 17)); }
    for (const F of fieldLots) field(F.i - Math.round(8 / ds), F.i + Math.round(16 / ds), F.s * (PAVE + 2), F.s * (PAVE + 34), FIELDS[fr() * FIELDS.length | 0], fr() < .5);
    // (by most fields, a farm out at the back of it: its gate at the road, a letterbox on a post by the gate, its house beyond the field;
    // the field's stretch of road then has a paper to throw too)
    { const gateW = toon('#8a6a44'), boxM = toon('#7f878e'), flagM = toon('#cf3a2c');
      for (const F of fieldLots) { if (fr() > (RG.harvest ? .9 : .75)) continue; const i = F.i + Math.round(4 / ds), A = S[((i % N) + N) % N], dG = F.s * (PAVE + 1.4);
        if (!free(i, dG, 2.2)) continue; const g = new THREE.Group();
        for (const z of [-1.5, 1.5]) g.add(box(.16, 1.5, .16, gateW, 0, .75, z)); for (const y of [.45, .85, 1.25]) g.add(box(.06, .1, 2.9, gateW, 0, y, 0)); { const dg = box(.06, .1, 3.1, gateW, 0, .85, 0); dg.rotation.x = .38; g.add(dg); }
        put(g, i, dG, 0, 0); hit(g, { hx: .12, hz: 1.6, h: 1.5, kind: 'hard' }, i);
        const mb = new THREE.Group(); mb.add(box(.08, 1.1, .08, gateW, 0, .55, 0), box(.3, .28, .46, boxM, 0, 1.22, 0), box(.32, .04, .48, toon('#5d646b'), 0, 1.38, 0), box(.02, .1, .2, toon('#f6f3ea'), -F.s * .16, 1.2, 0));
        const flag = new THREE.Group(); flag.position.set(F.s * .16, 1.2, -.1); flag.add(box(.015, .24, .025, flagM, 0, .12, 0), box(.018, .09, .13, flagM, 0, .21, .065)); mb.add(flag);
        mb.userData.keep = true; const im = i + Math.round(2.4 / ds); put(mb, im, F.s * (PAVE + .7), 0, 0); const C = hit(mb, { hx: .18, hz: .25, h: 1.4, kind: 'hard' }, im);
        const n = new THREE.Vector3(A.r.x * -F.s, 0, A.r.z * -F.s).normalize(), gp = at(i, dG, 0), hi = doors.length; doors.push({ p: gp.clone().addScaledVector(n, 2.6), n, done: false, i, gate: true });
        const M0 = { o: mb, i: im, side: F.s, flag, house: hi }; mailboxes.push(M0); things.push({ kind: 'mailbox', o: mb, mb: M0, C, side: F.s });
        const dH = F.s * (PAVE + 42); if (free(i, dH, 6)) farmhouse(i, dH); }
      if (RG.harvest) { const hayM = toon('#e2c25e'), hayE = toon('#c49a3e'); for (const F of fieldLots) for (let k = 0; k < 3 + (fr() * 4 | 0); k++) { const i = F.i + Math.round((fr() * 22 - 6) / ds), d = F.s * (PAVE + 8 + fr() * 24);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.2, 14).rotateZ(Math.PI / 2), [hayM, hayE, hayE]); b.position.y = .75; const g = new THREE.Group(); g.add(b); put(g, i, d, 0, fr() * 6); } } }
    // (the Classic: on the side away from the houses, the bundles of papers by the kerb (the only papers there are), benches on the lawn)
    if (RG.oneSide) { const os = -RG.oneSide, benchM = toon('#8a6a44'), legM = toon('#3a3d42');
      for (let i = Math.round(60 / ds); i < N - Math.round(30 / ds); i += Math.round(110 / ds)) { const o = P.bundle(), d = os * (VERGE + .6); if (!free(i, d, 1.5)) continue; o.group.userData.keep = true; put(o.group, i, d, 0, 0); bundles.push(hit(o.group, o.hit, i)); }
      for (let i = Math.round(40 / ds); i < N - Math.round(20 / ds); i += Math.round((34 + fr() * 20) / ds)) { const d = os * (PAVE + 2.2); if (!free(i, d, 2)) continue; const g = new THREE.Group(); g.add(box(.5, .08, 1.8, benchM, 0, .48, 0), box(.08, .5, 1.8, benchM, os * .24, .78, 0)); for (const z of [-.75, .75]) g.add(box(.45, .45, .08, legM, 0, .22, z)); put(g, i, d, 0, 0); hit(g, { hx: .3, hz: .95, h: 1, kind: 'hard' }, i); }
      // (between the houses: a ramp on the front lawn now and then, the lawns all rideable (as in the old street games))
      const ds0 = doors.slice().sort((x, y) => x.i - y.i);
      for (let k = 0; k + 1 < ds0.length; k++) { const a0 = ds0[k].i, b0 = ds0[k + 1].i; if ((b0 - a0) * ds < 10 || fr() > .65) continue; const i = Math.round((a0 + b0) / 2), d = RG.oneSide * (PAVE + 2.8); if (!free(i, d, 2.2)) continue;
        const o = P.ramp(fr, fr() < .5 ? 'plank' : 'kicker'); put(o.group, i, d, 0, (RG.rideDir || 1) < 0 ? Math.PI : 0); ramps.push(hit(o.group, o.hit, i)); }
      // (garden gnomes on the lawns: knocked over at a house that does not take the paper, points; at a subscriber's, he is not pleased)
      const gHat = toon('#cf3a2c'), gCoat = toon('#3b6fa0'), gBeard = toon('#f6f3ea'), gFace = toon('#e3b08a');
      ds0.forEach(d => { if (fr() > .7) return; const sd = new THREE.Vector3(-d.n.z, 0, d.n.x), p = d.p.clone().addScaledVector(d.n, -.9).addScaledVector(sd, (fr() < .5 ? 1 : -1) * 2.4), g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(.15, .32, 8), gCoat); body.position.y = .16; const face = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), gFace); face.position.y = .36; const beard = new THREE.Mesh(new THREE.ConeGeometry(.07, .14, 6), gBeard); beard.rotation.x = Math.PI; beard.position.set(0, .3, .05); const hat = new THREE.Mesh(new THREE.ConeGeometry(.08, .2, 8), gHat); hat.position.y = .5; g.add(body, face, beard, hat);
        g.position.set(p.x, groundAt(p.x, p.z, d.i), p.z); g.rotation.y = Math.atan2(d.n.x, d.n.z); g.userData.keep = true; G.add(g); g.updateMatrixWorld(true); const C = hit(g, { hx: .15, hz: .15, h: .55, kind: 'hard' }, d.i);
        const T0 = { kind: 'cone', o: g, C, r: .15, gnome: true, door: doors.indexOf(d) }; C.thing = T0; things.push(T0); gnomes.push(T0); });
      // (the start: a banner across the street just ahead of him; his own house, the first by it, a board on the lawn: DOM)
      { const i = 6 + Math.round(4 / ds), W = ROAD + 2.7, g = new THREE.Group(), red = toon('#cf3a2c'); for (const x of [-W, W]) g.add(box(.14, 4.6, .14, toon('#f6f3ea'), x, 2.3, 0));
        const ban = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, .9), new THREE.MeshBasicMaterial({ map: pixSign(THREE, 'START', '#cf3a2c', '#f6f3ea'), side: THREE.DoubleSide })); ban.position.y = 4.1; ban.rotation.y = Math.PI; g.add(ban); g.add(box(W * 2, .08, .08, red, 0, 4.6, 0));
        put(g, i, 0, 0, 0); for (const x of [-W, W]) hit(g, { hx: .08, hz: .08, h: 4.6, kind: 'hard' }, i, x, 0);
        const mine = ds0.find(d => d.i >= 4) || ds0[0]; if (mine) { mine.mine = true; const sd = new THREE.Vector3(-mine.n.z, 0, mine.n.x), p = mine.p.clone().addScaledVector(mine.n, -1.2).addScaledVector(sd, -1.8), b = new THREE.Group();
          b.add(box(.08, 1.2, .08, toon('#8a6a44'), 0, .6, 0)); const t = new THREE.Mesh(new THREE.PlaneGeometry(.9, .4), new THREE.MeshBasicMaterial({ map: pixSign(THREE, 'DOM', '#f6f3ea', '#cf3a2c'), side: THREE.DoubleSide })); t.position.y = 1.25; b.add(t);
          b.position.set(p.x, groundAt(p.x, p.z, mine.i), p.z); b.rotation.y = Math.atan2(mine.n.x, mine.n.z); G.add(b); } }
      // (bin day: wheelie bins out at the kerb before most houses; ridden into, over they go and roll)
      const binM = [toon('#3f7a4a'), toon('#3b5670'), toon('#5a5f66')], lidM = toon('#2a2c30');
      ds0.forEach(d => { if (fr() > .6) return; const i = d.i + Math.round((fr() < .5 ? 3 : -3) / ds), dd = RG.oneSide * (KERB + .55); if (!free(i, dd, .9)) return; const g = new THREE.Group(), m = binM[fr() * 3 | 0];
        g.add(box(.56, .95, .6, m, 0, .48, 0), box(.6, .07, .66, lidM, 0, .99, 0)); put(g, i, dd, 0, fr() * .4); g.userData.keep = true; const C = hit(g, { hx: .3, hz: .32, h: 1, kind: 'hard' }, i); C.thing = { kind: 'cone', o: g, C, r: .3 }; things.push(C.thing); });
      // (the obstacle courses on the lawn of the far side: a plank, a bale to clear, a big ramp to a parked car (over it or onto its roof),
      // cones to weave, a kicker, the line; all three ramps in one go: a bonus)
      const signM = new THREE.MeshBasicMaterial({ map: pixSign(THREE, 'TOR PRZESZKÓD', '#efc930', '#17181b'), side: THREE.DoubleSide }), baleM = toon('#e2c25e'), postM = toon('#8a6a44');
      [.14, .37, .61, .84].forEach((f, id) => { const i0 = Math.round(N * f), d = os * (PAVE + 6), sg = RG.rideDir || 1, m = x => sg * Math.round(x / ds), turn = sg < 0 ? Math.PI : 0; if (!free(i0, d, 3) || !free(i0 + m(30), d, 3)) return; const K = { id, n: 0, i0 };
        const ramp = (k, kind) => { const o = P.ramp(fr, kind), i = i0 + m(k); put(o.group, i, d, 0, turn); const C = hit(o.group, o.hit, i); C.course = { id, k: K.n++ }; ramps.push(C); };
        { const g = new THREE.Group(); for (const x of [-1.3, 1.3]) g.add(box(.1, 2.4, .1, postM, x, 1.2, 0)); const b = new THREE.Mesh(new THREE.PlaneGeometry(2.8, .6), signM); b.position.y = 2.2; g.add(b); put(g, i0 - m(5), d, 0, Math.PI / 2); for (const x of [-1.3, 1.3]) hit(g, { hx: .07, hz: .07, h: 2.4, kind: 'hard' }, i0 - m(5), x, 0); }
        ramp(0, 'plank');
        { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 12).rotateZ(Math.PI / 2), baleM); b.position.y = .42; g.add(b); put(g, i0 + m(8), d, 0, Math.PI / 2); hit(g, { hx: .8, hz: .42, h: .84, kind: 'hard' }, i0 + m(8)); }
        ramp(17, 'big');
        { const c = CARS.random(fr), i = i0 + m(24.5); put(c.group, i, d, 0, 0); c.group.userData.keep = true; hit(c.group, { hx: c.half[0], hz: c.half[1], h: 1.5, kind: 'hard', car: c.group }, i); }
        for (let k = 0; k < 4; k++) { const o = P.cone(), i = i0 + m(36 + k * 3.2); put(o.group, i, d + (k % 2 ? 1.1 : -1.1), 0, 0); const C = hit(o.group, o.hit, i); o.group.userData.keep = true; C.thing = { kind: 'cone', o: o.group, C, r: .18 }; things.push(C.thing); }
        ramp(52, 'kicker');
        { const g = new THREE.Group(); for (const x of [-1.6, 1.6]) g.add(box(.12, 2.6, .12, toon('#f6f3ea'), x, 1.3, 0)); g.add(box(3.3, .3, .06, toon('#cf3a2c'), 0, 2.5, 0)); put(g, i0 + m(60), d, 0, Math.PI / 2); for (const x of [-1.6, 1.6]) hit(g, { hx: .08, hz: .08, h: 2.6, kind: 'hard' }, i0 + m(60), x, 0); }
        courses.push(K); }); }
    if (RG.fair) FAIR = createFair({ THREE, toon, put, box, hit, at, S, N, ds, doors, rnd: fr, ROAD, PAVE, i0: Math.round(N * RG.fair[0]), i1: Math.round(N * RG.fair[1]), side: RG.fairSide || 1 });   // (the church fair: its square, its stalls)
    if (CITY) { CITY.skyline(CEN.x, CEN.z, REACH); CITY.rails(); NET.build(); }   // (the town: a skyline round it, not fields; the tram's rails in the road)
    for (const sd of CITY ? [] : [-INNER]) {                                        // (the outside of the loop only)
      for (const [r0, r1] of [[46, 54], [100, 110]]) { let i = Math.round(fr() * 60 / ds);        // (two rows of them: near, and far)
      while (i < N - 20) { const lenM = 30 + fr() * 40, i1 = Math.min(N - 1, i + Math.round(lenM / ds)), d0 = r0 + fr() * (r1 - r0), d1r = d0 + 28 + fr() * (r0 > 60 ? 50 : 38), d1 = r0 < 60 ? Math.min(d1r, 82) : d1r, kind = fr();   // (the near row stops short of the country road)
        if (kind < .5) { field(i, i1, sd * d0, sd * d1, FIELDS[fr() * FIELDS.length | 0], fr() < .5);                            // a field, a hedge along its near edge now and then
          if (fr() < .55) for (let j = i; j < i1; j += Math.round(3.2 / ds)) { const hg = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + fr() * .5, 0), bushM); hg.scale.set(1.2, .8, 1.2); hg.position.copy(at(j, sd * (d0 - 1.2), .6)); G.add(hg); } }
        else if (kind < .76 && r0 < 60 && !RG.farms) estate(i, i1, sd * (d0 + 6));                                                  // another estate
        else if (kind < .88) { for (let n = 0; n < 7 + (fr() * 10 | 0); n++) farTree(i + Math.round(fr() * (i1 - i)), sd * (d0 + fr() * (d1 - d0)), 1 + fr() * .5); }   // a grove
        else { const im = Math.round((i + i1) / 2); farmhouse(im, sd * (d0 + 8)); barn(im + Math.round(16 / ds), sd * (d0 + 14)); field(i, i1, sd * (d0 + 22), sd * d1, FIELDS[fr() * 3 | 0], true); }   // a farm
        i = i1 + Math.round((3 + fr() * 8) / ds); } }
      for (let k = 0; k < 150; k++) { const i = fr() * N | 0, dd = 45 + fr() * 130, sc = .9 + fr() * .6; if (dd > 81 && dd < 91) continue; farTree(i, sd * dd, sc); }                                   // trees about the land
      for (let k = 0; k < 220; k++) farTree(fr() * N | 0, sd * (178 + fr() * 18), 1.6 + fr() * .8);                                  // and a wall of them at the far edge
    }
    // small ponds on the meadows inside the loop, by the woods (the woods keep off them)
    for (let k = 0; k < 5; k++) { const i = Math.round((k + .3 + nr() * .4) / 5 * N), dd = INNER * (36 + nr() * 10); if (!free(i, dd, 3)) continue;
      const o = NAT.pond(nr); put(o.group, i, dd, 0, nr() * 6); o.group.updateMatrixWorld(true); zone(o.group, o.radius, o.radius * .8); show.farm.push({ o: o.group, label: 'staw', note: 'z trzcinami' }); }
    // inside the loop, behind the houses: woods, thick ones, here and there (leafy trees and spruces, bushes under them)
    { const wr = mulberry(47); let i = Math.round(wr() * 40 / ds);
      while (i < N - 10) { const lenM = 25 + wr() * 25, i1 = Math.min(N - 1, i + Math.round(lenM / ds));
        // (the woods within the land: past 40 m on the inside there is none)
        for (let n = 0; n < 16 + (wr() * 16 | 0); n++) { const ii = i + Math.round(wr() * (i1 - i)), dd = INNER * (30 + wr() * 8.5); if (!free(ii, dd, 1.6)) continue;
          if (wr() < .35) { const t = new THREE.Group(), H = 6 + wr() * 5; t.add(box(.22, H * .3, .22, wood, 0, H * .15, 0)); for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.7 - k * .34) * (H / 10), H * .34, 7), spruceM); c.position.y = H * (.3 + k * .19); t.add(c); } put(t, ii, dd, 0, wr() * 6); }
          else farTree(ii, dd, .9 + wr() * .5);
          if (wr() < .45) { const u = wr() < .5 ? NAT.bush(nr, 'fern') : NAT.grassTuft(nr, wr() < .3 ? 'tall' : 'lawn'); put(u.group, ii + Math.round((wr() - .5) * 4 / ds), dd + (wr() - .5) * 3, 0, wr() * 6); }   // (under them: ferns, grass)
          if (wr() < .5) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8 + wr() * .6, 0), bushM); b.scale.y = .7; put(b, ii + Math.round((wr() - .5) * 3 / ds), dd + (wr() - .5) * 3, .4); } }
        i = i1 + Math.round((30 + wr() * 50) / ds); } }
    // the railway, round the outside of the loop between the spruces and the fields: an embankment of ballast, sleepers, two rails
    if (!RG.city) { const dR = -INNER * 41.5, pts = [], step = 2; let L = 0;   // (not in the town: no railway round it)
     
      for (let i = 0; i <= N; i += step) { const q = at(i % N, dR, 0); if (pts.length) L += q.distanceTo(pts[pts.length - 1].p); pts.push({ p: q, s: L }); }
      const pos = [], idx = [], ballastM = toon('#8a857c', { map: rep(tex.slabs(), 1, 1) });
      for (let k = 0; k < pts.length; k++) { const i = (k * step) % N; for (const [dd, y] of [[-2.4, -.05], [-1.3, .22], [1.3, .22], [2.4, -.05]]) { const q = at(i, dR + dd, y); pos.push(q.x, q.y, q.z); } }
      for (let k = 0; k < pts.length - 1; k++) for (let c = 0; c < 3; c++) { const a = k * 4 + c, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const n = g.attributes.normal; let up = 0; for (let k = 0; k < n.count; k++) up += n.getY(k); if (up < 0) { g.index.array.reverse(); g.computeVertexNormals(); } }
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2).map((_, k) => k % 2 ? (k >> 1) * .5 : ((k >> 1) % 4) * .3), 2));
      const emb = new THREE.Mesh(g, ballastM); emb.receiveShadow = true; G.add(emb);
      const sleeperM = toon('#5a4030'), railM = toon('#6e7478'), yawAt = k => { const a = pts[Math.max(0, k - 1)].p, b = pts[Math.min(pts.length - 1, k + 1)].p; return Math.atan2(b.x - a.x, b.z - a.z); };
      let next = 0; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], seg = b.s - a.s, yaw = yawAt(k), mid = a.p.clone().lerp(b.p, .5);
        for (const sd of [-.72, .72]) { const r = box(.08, .1, seg + .02, railM); r.position.set(mid.x + Math.cos(yaw) * sd, mid.y + .38, mid.z - Math.sin(yaw) * sd); r.rotation.y = yaw; G.add(r); }
        while (next < b.s) { const t = (next - a.s) / seg, q = a.p.clone().lerp(b.p, t), sl = box(2.3, .1, .24, sleeperM, q.x, q.y + .28, q.z); sl.rotation.y = yaw; G.add(sl); next += 1.1; } }
      // the train: an engine and wagons (carriages or goods), going round and round; each car set on the rails by its two bogies
      const tr = mulberry(59), T = new THREE.Group(); T.userData.keep = true; G.add(T);
      const dark = toon('#2a2c30'), roofM = toon('#8d9194'), win = toon('#3f5566'), yel = toon('#e3c77e');
      const car = (L, kind) => { const c = new THREE.Group(), H = kind === 'hopper' ? 2.4 : 3.1, body = kind === 'engine' ? toon('#3f6b35') : kind === 'coach' ? toon(['#8e3b2c', '#2f4a5a', '#3f6b35'][tr() * 3 | 0]) : kind === 'box' ? toon('#6b4a2e') : toon('#44484c');
        c.add(box(2.8, H, L, body, 0, 1.1 + H / 2, 0)); c.add(box(2.9, .2, L + .1, kind === 'hopper' ? body : roofM, 0, 1.1 + H + .1, 0));
        for (const z of [-L / 2 + 2.2, L / 2 - 2.2]) { c.add(box(2.2, .7, 2.6, dark, 0, .75, z)); for (const x of [-.72, .72]) for (const dz of [-.8, .8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .14, 10), dark); w.rotation.z = Math.PI / 2; w.position.set(x, .6, z + dz); c.add(w); } }
        if (kind === 'engine') { for (const z of [-L / 2, L / 2]) { c.add(box(2.82, .5, .06, yel, 0, 1.6, z + Math.sign(z) * .02)); c.add(box(2.2, .8, .06, win, 0, 3.2, z + Math.sign(z) * .03)); }
          c.add(box(.1, .9, 1.6, dark, 0, 4.65, 0)); c.add(box(1.6, .08, .1, dark, 0, 5.1, 0)); for (const sd of [-1, 1]) c.add(box(.06, .5, 5, yel, sd * 1.42, 1.9, 0)); }
        if (kind === 'coach') for (let z = -L / 2 + 1.4; z < L / 2 - 1; z += 1.5) for (const sd of [-1, 1]) c.add(box(.06, .8, 1.0, win, sd * 1.42, 3.1, z));
        if (kind === 'box') for (const sd of [-1, 1]) c.add(box(.06, 2.2, 2.4, toon('#5a3a24'), sd * 1.42, 2.4, 0));
        if (kind === 'hopper') c.add(box(2.5, .3, L - .6, toon('#1d1e21'), 0, 1.1 + H - .05, 0));
        c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); T.add(c); return { g: c, L }; };
      const cars = [car(15, 'engine')]; const goods = tr() < .5; for (let n = 0; n < 5; n++) cars.push(car(goods ? 12 : 16, goods ? (n % 2 ? 'box' : 'hopper') : 'coach'));
      const RL = pts[pts.length - 1].s, where = s0 => { let s1 = ((s0 % RL) + RL) % RL, lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s <= s1) lo = m; else hi = m; } const a = pts[lo], b = pts[hi]; return a.p.clone().lerp(b.p, (s1 - a.s) / Math.max(1e-6, b.s - a.s)); };
      let head = tr() * RL; const v = 15;
      train.update = dt => { head += v * dt; let s0 = head; for (const c of cars) { const f = where(s0 - 2.2), r = where(s0 - c.L + 2.2), m = f.clone().lerp(r, .5); c.g.position.set(m.x, m.y + .3, m.z); c.g.rotation.y = Math.atan2(f.x - r.x, f.z - r.z); s0 -= c.L + 1; } };
      train.update(0); train.rail = { pts, len: RL, d: dR }; }
    // hills round it all, and mountains behind them, bluer the farther (low enough not to hide the lake and the town beyond)
    { const hillM = ['#467537', '#5b8a3c', '#5f6a35', '#355f31'].map(c => toon(c, { map: rep(tex.grass(1), 8, 8) })), mtM = ['#5e7c86', '#6f8e97', '#4f6b75'].map(c => toon(c)), snowM = toon('#e9e3d1');
      const cx = RG.classic ? CEN.x : 90, cz = RG.classic ? CEN.z : 0, R0 = RG.classic ? REACH + 140 : 285, R1 = RG.classic ? REACH + 230 : 380;   // (the Classic's street is wider: the ring round its own middle)
      for (let k = 0; k < 34; k++) { const a = k / 34 * 6.283 + fr() * .12, R = R0 + fr() * 50, h = 16 + fr() * 22, w = 40 + fr() * 40;
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), hillM[fr() * 4 | 0]); m.scale.set(w, h, w * (.7 + fr() * .5)); m.position.set(cx + Math.cos(a) * R, -h * .35, cz + Math.sin(a) * R); m.rotation.y = fr() * 6; G.add(m); }
      for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + fr() * .25, R = R1 + fr() * 35, h = 30 + fr() * 34, w = 55 + fr() * 45, i = fr() * 3 | 0;   // (inside the painted panorama, low: its lake and town still show)
        const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 6 + (fr() * 3 | 0)), mtM[i]); m.scale.set(w, h, w); m.position.set(cx + Math.cos(a) * R, h * .5 - 12, cz + Math.sin(a) * R); m.rotation.y = fr() * 6; G.add(m);
        if (h > 56) { const c = new THREE.Mesh(new THREE.ConeGeometry(1, 1, m.geometry.parameters.radialSegments), snowM); c.scale.set(w * .28, h * .28, w * .28); c.position.set(m.position.x, m.position.y + h * .36, m.position.z); c.rotation.y = m.rotation.y; G.add(c); } }
    } }
  // (the merged meshes: per material and per 60 m square of the ground, so what is out of the view (and out of the shadow's box) is not drawn)
  const CELL = 90, cellOf = g => { g.computeBoundingBox(); const b = g.boundingBox; return Math.floor((b.min.x + b.max.x) / 2 / CELL) + ',' + Math.floor((b.min.z + b.max.z) / 2 / CELL); };
  // the crowns: every clump and every card of leaves, into one mesh each (the cards' shadows cut by their alpha)
  if (!showcase) { G.updateMatrixWorld(true); const by = new Map(), gone = [];
    G.traverse(o => { if (!o.isMesh || !o.userData.foliage) return; const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); const key = o.material.uuid + '|' + cellOf(g); if (!by.has(key)) by.set(key, { m: o.material, gs: [] }); by.get(key).gs.push(g); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const { m, gs } of by.values()) { const mm = new THREE.Mesh(mergeGeometries(gs), m); mm.castShadow = true; mm.receiveShadow = true; mm.customDepthMaterial = m === cardM ? cardDepth : clumpDepth; G.add(mm); } }
  // the grass, the bushes' clumps, the stones (their colours in their points): merged by material, keeping the colours
  if (!showcase) { G.updateMatrixWorld(true); const by = new Map(), gone = [];
    G.traverse(o => { if (!o.isMesh || !NAT.mats.includes(o.material)) return; for (let q = o; q && q !== G; q = q.parent) if (q.userData.keep) return;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
      const key = o.material.uuid + '|' + cellOf(g); if (!by.has(key)) by.set(key, { m: o.material, gs: [] }); by.get(key).gs.push(g); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const { m, gs } of by.values()) { const mm = new THREE.Mesh(mergeGeometries(gs), m); mm.castShadow = mm.receiveShadow = true; G.add(mm); } }
  // ---------- all the still things merged, material by material, into a few meshes (a mailbox stays itself: its flag moves) ----------
  if (!showcase) { G.updateMatrixWorld(true); const buckets = new Map(), gone = [];
    const kept = o => { for (let q = o; q && q !== G; q = q.parent) if (q.userData.keep) return true; return false; }, worksOf = o => { for (let q = o.parent; q && q !== G; q = q.parent) if (q.userData.works) return q; return null; };
    G.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || o.material.vertexColors || o.material.transparent || kept(o)) return;   // (two materials on one mesh, a car's glasshouse: left as it is)
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      const W = worksOf(o), k = o.material.uuid + '|' + cellOf(g) + (W ? '|W' : ''); if (!buckets.has(k)) buckets.set(k, { m: o.material, gs: [], to: W || G }); buckets.get(k).gs.push(g); gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const { m, gs, to } of buckets.values()) { const mm = new THREE.Mesh(mergeGeometries(gs), m); mm.castShadow = mm.receiveShadow = true; to.add(mm); } }

  // ---------- where on the road is a point? (searched from the last place) ----------
  function probe(x, z, hint = 0) {
    const all = hint < 0; let best = all ? 0 : hint, bd = 1e9;                 // (hint < 0: no idea where: look along all of it)
    for (let k = all ? 0 : -40; k <= (all ? N - 1 : 40); k++) { const i = all ? k : ((hint + k) % N + N) % N, p = S[i].p, d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = i; } }
    const s = S[best], nx = S[(best + 1) % N], t = THREE.MathUtils.clamp(((x - s.p.x) * s.f.x + (z - s.p.z) * s.f.z) / ds, -1, 1);
    const i0 = t >= 0 ? best : (best + N - 1) % N, i1 = (i0 + 1) % N, k = t >= 0 ? t : 1 + t, a = S[i0], b = S[i1];
    const cy = a.p.y + (b.p.y - a.p.y) * k, off = (x - s.p.x) * s.r.x + (z - s.p.z) * s.r.z;
    return { i: best, d: off, y: Math.abs(off) > ROAD + .6 ? meshY(x, z, best) : cy + hAt(off, best), f: s.f, slope: (b.p.y - a.p.y) / ds, s: best * ds + t * ds };
  }
  const bins = binsO.map(b => b.getWorldPosition(new THREE.Vector3()));
  // ---------- the ground check (?audit: nothing merged, so each thing can be looked at): what hangs in the air, what is under the grass ----------
  //   each thing by the road, and each thing on a lot or a plot (the ones at its foot: not a window on a wall), against the ground under it
  //   at nine points. hangs: its lowest point above the highest ground under it; under: a flat thing (a slab, mud, a puddle) whose top is
  //   below the ground somewhere; sunk: a small thing the ground climbs up more than a hand's width
  function audit() {
    const labels = new Map(); for (const k in show) for (const e of show[k]) labels.set(e.o, e.label); const out = [], B3 = new THREE.Box3(), v = new THREE.Vector3(); G.updateMatrixWorld(true);
    // (only the land by the road: the hills beyond have their own ground)
    const check = (o, name, baseY, only) => { B3.setFromObject(o); if (B3.isEmpty()) return; const sz = B3.getSize(v.clone()); if (Math.max(sz.x, sz.z) > 26 || sz.y > 14) return;
      if (baseY != null && B3.min.y - baseY > .35) return;   // (on a wall, a roof: not at the foot)
      const q = probe((B3.min.x + B3.max.x) / 2, (B3.min.z + B3.max.z) / 2, -1); if (!q || Math.abs(q.d) > 60) return; let gmin = 1e9, gmax = -1e9;
      for (const a of [.15, .5, .85]) for (const b of [.15, .5, .85]) { const x = B3.min.x + sz.x * a, z = B3.min.z + sz.z * b, gy = probe(x, z, q.i).y; gmin = Math.min(gmin, gy); gmax = Math.max(gmax, gy); }
      const at = [+((B3.min.x + B3.max.x) / 2).toFixed(1), +((B3.min.z + B3.max.z) / 2).toFixed(1)];
      const gp = o.isMesh && o.geometry.parameters, flat = sz.y < .25 && (gp && gp.width != null && gp.depth != null ? Math.min(gp.width * o.scale.x, gp.depth * o.scale.z) > .35 : gp && gp.radius != null ? gp.radius > .2 : Math.min(sz.x, sz.z) > .35);
      // (flat: a slab, mud, a puddle, wide both ways; a rail or a board is not)
      if (only === 'flat' && !flat) return;
      if (B3.min.y > gmax + .12 && !(o.isMesh && o.geometry.type === 'TorusGeometry')) out.push({ issue: 'wisi', name, by: +(B3.min.y - gmax).toFixed(2), at });
      else if (flat && B3.max.y < gmax - .015) out.push({ issue: 'pod trawą', name, by: +(gmax - B3.max.y).toFixed(2), at });
      else if (sz.y < 2.5 && gmax - B3.min.y > .3 + sz.y * .25 && o.material !== stoneM && !o.userData.draped) out.push({ issue: 'zapada się', name, by: +(gmax - B3.min.y).toFixed(2), at }); };
    for (const o of G.children) { if (!(o.isGroup || o.isMesh)) continue; const lab = labels.get(o); B3.setFromObject(o); const big = B3.isEmpty() ? false : Math.max(B3.max.x - B3.min.x, B3.max.z - B3.min.z) > 5 && o.children.length > 6;
      if (lab && /dom|baraki|działki|garaże|budowa|trzepak|buda|kapliczka|przyczepa|posterunek|sklep/.test(lab) || big && o.isGroup) { for (const c of o.children) check(c, (lab || 'działka') + ' / ' + (c.isMesh ? c.geometry.type.replace('Geometry', '') : 'grupa ' + c.children.length), o.position.y, c.isMesh && !c.userData.slab ? 'flat' : null); }
      else check(o, lab || (o.isMesh ? o.geometry.type.replace('Geometry', '') : 'grupa ' + o.children.length), null, o.isMesh ? 'flat' : null); }   // (loose boxes along the road, a rail, a kerb: only if flat on the ground)
    return out; }
  // (for the game's modes: a collider added or taken away while it runs, the props to build with)
  const dropHit = C => { const k = colliders.indexOf(C); if (k >= 0) colliders.splice(k, 1); for (const b of buckets) { const j = b.indexOf(C); if (j >= 0) b.splice(j, 1); } };
  return { courses, gnomes, classic: !!RG.classic, oneSide: RG.oneSide || 0, harvest: !!RG.harvest, fair: FAIR, gantryF, liftF, paved: (x, z) => !!(home.paved?.(x, z) || NET?.paved(x, z) || CITY?.paved(x, z)), openGarages: CITY?.openGarages || [], net: NET, kerbCars, standCars, addHit: hit, dropHit, props: P, home, audit, things, floorAt, puddles, group: G, probe, S, N, ds, len, INNER, dapT, dapSun, stops, posts, shops, bins, bikeZones, fires, annexes, show, train, farRoad: -INNER * 86, parked, seats, mailboxes, colliders, near, windows, doors, bundles, ramps, lots, cars: CARS, centre: new THREE.Vector3(90, 0, 0), start: home.start, startI: home.iJ, region: RG.id, map: RG.map, night: !!RG.night, city: !!RG.city, tourist: !!RG.tourist, estate: EST, industry: RG.estate ? RG.industry || 'osiedle' : '', ROAD, KERB, PAVE };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
