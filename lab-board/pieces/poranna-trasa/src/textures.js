// Small pixel textures, drawn here (no files): 32 or 64 px, sampled without smoothing, so each of their pixels stays a block on
// the screen. Mostly in greys and near-whites, to be tinted by a material's colour; the lighting and the palette do the rest.
// asphalt (grain, patches, cracks), paving slabs, a kerb, grass (tufts, a few flowers), clapboard siding, roof shingles, leaves,
// bark and wood.

export function createTextures({ THREE }) {
  const cache = new Map();
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function make(key, size, draw) {
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(((x % size) + size) % size, ((y % size) + size) % size, 1, 1); };
    draw(g, px, rng(key.length * 977 + size), size);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter; t.generateMipmaps = true; t.anisotropy = 1;
    cache.set(key, t); return t;
  }
  const shade = (v) => { const k = Math.max(0, Math.min(255, v | 0)); return `rgb(${k},${k},${k})`; };
  return {
    // asphalt, as drawn: grain in two tones, small stones (a lit pixel with its shadow), a patch or two a shade apart with a darker
    // rim, a seam of tar across, an oil stain, cracks that branch
    asphalt: () => make('asphalt3', 64, (g, px, r, S) => { g.fillStyle = shade(200); g.fillRect(0, 0, S, S);
      for (let i = 0; i < S * S * .12; i++) px(r() * S | 0, r() * S | 0, shade(r() < .55 ? 168 : 228));                        // grain
      for (let i = 0; i < 70; i++) { const x = r() * S | 0, y = r() * S | 0; px(x, y, shade(250)); px(x + 1, y + 1, shade(140)); }   // stones
      for (let k = 0; k < 2; k++) { const x0 = r() * S | 0, y0 = r() * S | 0, w = 10 + r() * 16 | 0, h = 6 + r() * 9 | 0, v = r() < .5 ? 184 : 214;
        g.fillStyle = shade(v); g.fillRect(x0, y0, w, h); for (let i = 0; i < w * h * .1; i++) px(x0 + r() * w | 0, y0 + r() * h | 0, shade(v + (r() < .5 ? -22 : 22)));
        g.fillStyle = shade(150); g.fillRect(x0, y0, w, 1); g.fillRect(x0, y0 + h, w + 1, 1); g.fillRect(x0, y0, 1, h); g.fillRect(x0 + w, y0, 1, h); }   // patches, their edges
      { const y = r() * S | 0; for (let x = 0; x < S; x++) { const yy = y + Math.round(Math.sin(x * .3) * 1.2); px(x, yy, shade(118)); if (x % 3) px(x, yy + 1, shade(135)); } }   // a seam of tar
      { const cx = r() * S, cy = r() * S; for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 5; px(cx + Math.cos(a) * d | 0, cy + Math.sin(a) * d * .6 | 0, shade(150)); } }   // oil
      for (let k = 0; k < 3; k++) { let x = r() * S, y = r() * S; for (let i = 0; i < 20; i++) { px(x | 0, y | 0, shade(105)); if (r() < .15) { let bx = x, by = y; for (let q = 0; q < 5; q++) { bx += r() - .5; by += 1; px(bx | 0, by | 0, shade(125)); } } x += (r() - .3) * 2; y += (r() - .5) * 1.4; } } }),   // cracks, branching
    // paving slabs, 2 x 2 to the tile: each its own tone, speckled, a lit edge at its top and left, a shadow at its bottom and right, the
    // joints dark, moss in them here and there, a crack across one, a chip at a corner
    slabs: () => make('slabs3', 64, (g, px, r, S) => { const B = S / 2;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const v = 214 + r() * 26 | 0, x0 = a * B, y0 = b * B; g.fillStyle = shade(v); g.fillRect(x0, y0, B, B);
        for (let i = 0; i < B * B * .1; i++) px(x0 + r() * B | 0, y0 + r() * B | 0, shade(v + (r() < .5 ? -18 : 14)));
        g.fillStyle = shade(Math.min(255, v + 22)); g.fillRect(x0 + 1, y0 + 1, B - 2, 1); g.fillRect(x0 + 1, y0 + 1, 1, B - 2);        // the lit edge
        g.fillStyle = shade(v - 34); g.fillRect(x0 + 1, y0 + B - 2, B - 2, 1); g.fillRect(x0 + B - 2, y0 + 1, 1, B - 2);              // the shadowed one
        if (r() < .5) { px(x0 + 1, y0 + 1, shade(150)); px(x0 + 2, y0 + 1, shade(170)); } }                                             // a chip
      g.fillStyle = shade(128); g.fillRect(0, 0, S, 1); g.fillRect(0, B, S, 1); g.fillRect(0, 0, 1, S); g.fillRect(B, 0, 1, S);            // the joints
      for (let i = 0; i < 14; i++) { const t = r() * S | 0, onRow = r() < .5, c = r() < .6 ? '#6f8a3c' : '#8aa04a'; if (onRow) px(t, (r() < .5 ? 0 : B), c); else px((r() < .5 ? 0 : B), t, c); }   // moss in the joints
      { let x = 4 + r() * 20, y = B + 3; for (let i = 0; i < 18; i++) { px(x | 0, y | 0, shade(150)); x += 1; y += (r() - .45) * 1.3; } } }),   // a crack
    kerb: () => make('kerb', 32, (g, px, r, S) => { g.fillStyle = shade(230); g.fillRect(0, 0, S, S); for (let i = 0; i < S * S * .06; i++) px(r() * S | 0, r() * S | 0, shade(205));
      g.fillStyle = shade(170); g.fillRect(0, 0, 1, S); g.fillRect(S / 2, 0, 1, S); }),
    // grass: blades in tufts, three tones (the tip lit, the root dark), and in the lawns flowers placed as a pixel artist would: daisies
    // (four white petals round a yellow eye), dandelions (a yellow blob), clover in violet
    grass: (flowers = 0) => make('grass3_' + flowers, 32, (g, px, r, S) => { g.fillStyle = shade(196); g.fillRect(0, 0, S, S);
      for (let i = 0; i < S * S * .05; i++) px(r() * S | 0, r() * S | 0, shade(r() < .5 ? 176 : 214));
      for (let i = 0; i < S * S * .07; i++) { const x = r() * S | 0, y = r() * S | 0, h = 2 + (r() * 2 | 0), lean = r() < .5 ? 0 : (r() < .5 ? -1 : 1);
        px(x, y + h, shade(150)); for (let k = 1; k < h; k++) px(x + (k === 1 ? 0 : lean), y + h - k, shade(205)); px(x + lean, y, shade(250)); }   // a blade: dark root, mid, lit tip
      for (let i = 0; i < flowers; i++) { const x = r() * S | 0, y = r() * S | 0, k = r();
        if (k < .5) { px(x, y - 1, '#fbf7ea'); px(x - 1, y, '#fbf7ea'); px(x + 1, y, '#fbf7ea'); px(x, y + 1, '#e9e3d1'); px(x, y, '#f2c33a'); }   // a daisy
        else if (k < .8) { px(x, y, '#f7d23e'); px(x + 1, y, '#f2c33a'); px(x, y - 1, '#fbe27a'); px(x, y + 1, shade(150)); }                  // a dandelion
        else { px(x, y, '#b48ad8'); px(x + 1, y, '#9a6fc4'); px(x, y + 1, shade(150)); } } }),                                           // clover
    siding: () => make('siding', 32, (g, px, r, S) => { g.fillStyle = shade(236); g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 4) { g.fillStyle = shade(190); g.fillRect(0, y + 3, S, 1); g.fillStyle = shade(250); g.fillRect(0, y, S, 1); }   // the boards: a lit edge, a shadow under
      for (let i = 0; i < 6; i++) { const y = (r() * 8 | 0) * 4, x = r() * S | 0; g.fillStyle = shade(205); g.fillRect(x, y, 1, 3); } }),
    shingles: () => make('shingles2', 32, (g, px, r, S) => { g.fillStyle = shade(210); g.fillRect(0, 0, S, S);
      for (let row = 0; row < S / 4; row++) { const y = row * 4, off = row % 2 ? 3 : 0;
        for (let x = off - 6; x < S; x += 6) { const v = 190 + r() * 55 - (r() < .12 ? 40 : 0); g.fillStyle = shade(v); g.fillRect(x, y, 6, 3); g.fillStyle = shade(v + 18); g.fillRect(x, y, 6, 1); g.fillStyle = shade(150); g.fillRect(x, y, 1, 3); }
        g.fillStyle = shade(125); g.fillRect(0, y + 3, S, 1); } }),
    leaves: () => make('leaves', 32, (g, px, r, S) => { g.fillStyle = shade(170); g.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) { const x = r() * S | 0, y = r() * S | 0, l = r(); const c = shade(l < .35 ? 120 : l < .75 ? 215 : 255);
        px(x, y, c); px(x + 1, y, c); px(x, y + 1, c); if (l > .5) px(x + 1, y + 1, c); } }),   // clumps of leaves in three tones
    bloom: (cols = ['#f3a6c0', '#f6f3ea']) => make('bloom' + cols.join(), 32, (g, px, r, S) => { g.fillStyle = shade(170); g.fillRect(0, 0, S, S);   // a flowering bush: leaves with flowers in them
      for (let i = 0; i < 60; i++) { const x = r() * S | 0, y = r() * S | 0, c = shade(r() < .4 ? 120 : 230); px(x, y, c); px(x + 1, y, c); px(x, y + 1, c); }
      for (let i = 0; i < 46; i++) { const x = r() * S | 0, y = r() * S | 0, c = cols[r() * cols.length | 0]; px(x, y, c); if (r() < .5) px(x + 1, y, c); } }),
    grate: () => make('grate', 16, (g, px, r, S) => { g.fillStyle = '#1b1c1f'; g.fillRect(0, 0, S, S); g.fillStyle = '#55595d'; for (let y = 1; y < S; y += 3) g.fillRect(1, y, S - 2, 1); g.fillStyle = '#6a6e70'; g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S); }),
    dapple: (seed = 1) => make('dapple' + seed, 128, (g, px, r, S) => {   // a tree's shadow on the ground: leaf clumps with light through them (alpha)
      g.clearRect(0, 0, S, S); g.fillStyle = '#000';
      for (let i = 0; i < 90 + seed * 7; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * S * .42, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d * .8, w = 4 + r() * 9, h = 3 + r() * 6;
        g.beginPath(); g.ellipse(x | 0, y | 0, w, h, r() * 3, 0, 7); g.fill(); }
      g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 70; i++) { const x = S * (.12 + r() * .76), y = S * (.12 + r() * .76), w = 1 + r() * 3.5; g.beginPath(); g.ellipse(x | 0, y | 0, w, w * (.6 + r() * .6), 0, 0, 7); g.fill(); }
      g.globalCompositeOperation = 'source-over'; }),
    // kerb stones along the road: four blocks of a metre each (v runs along the road), each its own tone, a dark joint and a lit bevel after it, chips
    kerbBlock: () => make('kerbBlock', 64, (g, px, r, S) => { const B = S / 4;
      for (let k = 0; k < 4; k++) { g.fillStyle = shade(212 + r() * 34); g.fillRect(0, k * B, S, B); }
      for (let i = 0; i < S * S * .08; i++) px(r() * S | 0, r() * S | 0, shade(r() < .6 ? 190 : 250));
      for (let i = 0; i < 10; i++) { const x = r() * S | 0, y = r() * S | 0; px(x, y, shade(150)); px(x + 1, y, shade(165)); }   // chips
      for (let k = 0; k < 4; k++) { g.fillStyle = shade(118); g.fillRect(0, k * B, S, 1); g.fillStyle = shade(252); g.fillRect(0, k * B + 1, S, 1); } }),
    // a card of leaves for a crown's edge: small two-tone leaves clustered thick in the middle, ragged at the rim (alpha); grey, tinted by the tree
    leafCard: (seed = 1) => make('leafCard' + seed, 32, (g, px, r, S) => { g.clearRect(0, 0, S, S);
      for (let i = 0; i < 150; i++) { const a = r() * 6.28, d = Math.pow(r(), .7) * S * .42, x = Math.round(S / 2 + Math.cos(a) * d), y = Math.round(S / 2 + Math.sin(a) * d * .9);
        const l = r(), top = shade(l < .3 ? 150 : l < .75 ? 205 : 250), low = shade(l < .3 ? 110 : l < .75 ? 160 : 205);
        if (r() < .5) { px(x, y, top); px(x + 1, y, top); px(x, y + 1, low); px(x + 1, y + 1, low); if (r() < .5) px(x + 2, y + 1, low); }
        else { px(x, y, top); px(x, y + 1, top); px(x + 1, y + 1, low); px(x, y + 2, low); } } }),
    bark: () => make('bark', 32, (g, px, r, S) => { g.fillStyle = shade(210); g.fillRect(0, 0, S, S);
      for (let i = 0; i < 18; i++) { const x = r() * S | 0; let y = r() * S | 0; const n = 4 + r() * 10; for (let k = 0; k < n; k++) px(x + (r() < .2 ? 1 : 0), y++, shade(r() < .5 ? 150 : 240)); } }),
  };
}
