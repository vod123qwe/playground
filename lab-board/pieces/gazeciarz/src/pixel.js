// The pixel look: the scene is drawn small (about 240 px high, to a whole-number scale of the window), then put on the screen
// pixel for pixel, bigger: first tone-mapped, a dark outline where the depth jumps (the edge of a thing against what is behind it),
// shadows pushed cool (towards violet and blue) and lights warm, as a pixel artist shades; a 4 x 4 ordered dither, strong in the
// sky's gradient and light on things (so a shirt does not turn to a checkerboard); an outline in a dark warm violet rather than
// black; and every pixel snapped to a warm palette of some 50 colours (an autumn morning street).

const PALETTE = [
  // sky, cloud, haze
  '#6fa9c2', '#7fb6cc', '#8cc0d2', '#9ccad8', '#aed3db', '#bcdcdf', '#cce4dd', '#dcebd9', '#e8eed6', '#f3eed2', '#fff8e3',   // (the sky in fine steps: no broad bands)
  // greens, dark to light; olive
  '#1d3322', '#284a2b', '#355f31', '#467537', '#5b8a3c', '#77a146', '#98b85a', '#c2cf7e', '#5f6a35', '#7c8446',
  // earth, wood, bark
  '#24190f', '#3d2a1b', '#5a3d27', '#7b5836', '#9e7a4f', '#c09a6a',
  // reds, rust, autumn
  '#5e1c17', '#8e2e25', '#b3392d', '#cf5a3e', '#e08556', '#b86a2e', '#d9a441', '#efc970',
  // asphalt, stone, concrete
  '#17181b', '#25272b', '#33363a', '#44484c', '#5b5f63', '#777b7c', '#979a97', '#b8b8ae', '#d3d0c3',
  // whites, cream
  '#e9e3d1', '#f6f3ea',
  // skin
  '#9c6a4c', '#c98e67', '#e7b68f', '#f5d3ae',
  // denim, blues, slate
  '#263c5a', '#3a5779', '#56789d', '#4f6674', '#7d93a1',
  // cool shadows (violet), warm lights
  '#1e1726', '#2e2538', '#453a52', '#5d5470', '#fbe7b0',
];

export function createPixel({ THREE, renderer, height = 240 }) {
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(4, 4) });
  const pal = PALETTE.map(h => new THREE.Color(h));                    // (as written: sRGB)
  const mat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(4, 4) }, shift: { value: new THREE.Vector2() }, mode: { value: 0 }, fx: { value: 1 }, p1: { value: 0 }, p2: { value: 0 }, p3: { value: 0 }, p4: { value: 0 }, inkA: { value: new THREE.Vector3(1, 1, 1) }, inkB: { value: new THREE.Vector3(1, 1, 1) }, inkC: { value: new THREE.Vector3(1, 1, 1) }, wobA: { value: 0 }, wobT: { value: 0 }, scr: { value: new THREE.Vector2(4, 4) }, haze: { value: 1.2 }, hazeCol: { value: new THREE.Vector3(.76, .83, .86) }, crease: { value: 0 }, cThr: { value: .012 }, near: { value: .1 }, far: { value: 500 },
      pal: { value: pal.map(c => new THREE.Vector3(c.r, c.g, c.b)) }, dither: { value: .02 }, skyDither: { value: .07 }, outline: { value: .85 }, oInk: { value: 0 }, oThr: { value: .12 }, oWide: { value: 0 }, aber: { value: 0 }, ss: { value: 1 }, palOn: { value: 1 }, hue: { value: 1 }, palMix: { value: 1 }, levels: { value: 0 }, sat: { value: 1 }, contrast: { value: 1 }, vig: { value: 0 }, hurt: { value: 0 }, crt: { value: 0 }, exposure: { value: 1.0 }, on: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      uniform sampler2D tColor, tDepth; uniform vec2 res, shift, scr; uniform vec3 inkA, inkB, inkC; uniform float mode, fx, p1, p2, p3, p4, wobA, wobT, crease, cThr, haze; uniform vec3 hazeCol; uniform float near, far, dither, skyDither, outline, oInk, oThr, oWide, aber, ss, palOn, hue, palMix, levels, sat, contrast, vig, hurt, crt, exposure, on; uniform vec3 pal[${PALETTE.length}];
      varying vec2 vUv;
      float lin(float d){ float z = d * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      float bayer(vec2 p){ int x = int(mod(p.x, 4.)), y = int(mod(p.y, 4.)); int i = x + y * 4;
        float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
        for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.; return 0.; }
      // hurt (0..1): the edges going red, deeper the more it is; dithered in two of the palette's reds, a dark rim outermost; a little
      // of the whole picture drained towards red when it is bad
      vec3 hurtIt(vec3 o, vec2 p, vec2 uv){ if (hurt < .01) return o; float r = length((uv - .5) * vec2(res.x / res.y, 1.)), v = smoothstep(.34, 1.02, r * (1. + hurt * .22)) * min(1., hurt * 1.15), b = bayer(p);
        float L = dot(o, vec3(.3, .59, .11)); o = mix(o, vec3(L * .9 + .06, L * .45, L * .4), hurt * .16);
        if (b < v) o = mix(o, vec3(.557, .18, .145), .85); if (b < v * v * .9) o = vec3(.369, .11, .09); return o; }
      // the looks laid over it all (mode): 1 painted (Kuwahara: patches of paint, canvas grain, a darker stroke at edges), 2 comic (thick
      // ink, halftone dots in the shade), 3 watercolour (paper, pigment pooled at colour's edges, lights left white), 4 pencil (paper,
      // hatching by the shade, graphite lines), 5 riso (pink, blue and yellow inks halftoned at their own angles, off register), 6 one-bit
      // (two colours, an ordered dither); wobA: the line boiling, the drawing redrawn eight times a second
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      vec3 kuwa(vec2 u0, vec2 st){ vec3 m0 = vec3(0.), m1 = vec3(0.), m2 = vec3(0.), m3 = vec3(0.), s0 = vec3(0.), s1 = vec3(0.), s2 = vec3(0.), s3 = vec3(0.);
        for (int j = 0; j <= 2; j++) for (int i = 0; i <= 2; i++) { vec2 o = vec2(float(i), float(j)) * st;
          vec3 a = texture2D(tColor, u0 + vec2(-o.x, -o.y)).rgb, b = texture2D(tColor, u0 + vec2(o.x, -o.y)).rgb, c2 = texture2D(tColor, u0 + vec2(-o.x, o.y)).rgb, d = texture2D(tColor, u0 + o).rgb;
          m0 += a; s0 += a * a; m1 += b; s1 += b * b; m2 += c2; s2 += c2 * c2; m3 += d; s3 += d * d; }
        m0 /= 9.; m1 /= 9.; m2 /= 9.; m3 /= 9.; vec3 v0 = abs(s0 / 9. - m0 * m0), v1 = abs(s1 / 9. - m1 * m1), v2 = abs(s2 / 9. - m2 * m2), v3 = abs(s3 / 9. - m3 * m3);
        float q0 = v0.r + v0.g + v0.b, q1 = v1.r + v1.g + v1.b, q2 = v2.r + v2.g + v2.b, q3 = v3.r + v3.g + v3.b, qb = min(min(q0, q1), min(q2, q3));
        return qb == q0 ? m0 : qb == q1 ? m1 : qb == q2 ? m2 : m3; }
      vec3 stylize(vec3 F, vec2 uv){
        if (mode < .5) return F;
        vec3 F0 = F; vec2 sp = gl_FragCoord.xy; float L = dot(F, vec3(.3, .59, .11)), d0 = lin(texture2D(tDepth, vUv).r), e = 0.; vec2 o = (mode > 1.5 && mode < 2.5 ? p3 : 1.7) / scr, jit = (vec2(vnz(vUv * 40. + wobT), vnz(vUv * 40. - wobT + 7.)) - .5) * wobA * 4. / scr;
        for (int k = 0; k < 4; k++) { vec2 dd = k == 0 ? vec2(o.x, 0.) : k == 1 ? vec2(-o.x, 0.) : k == 2 ? vec2(0., o.y) : vec2(0., -o.y); float dn = lin(texture2D(tDepth, vUv + dd + jit).r); e = max(e, (d0 - dn) / d0); }
        float edge = smoothstep(.05, .14, e) * step(d0, 150.);
        vec3 R = F;
        if (mode < 1.5) { float gr = vnz(sp * .35) * .6 + vnz(sp * 1.3) * .4; R = F * (1. - p2 * .1 + gr * p2 * .2); R = mix(R, R * .5, edge * p3); }   // painted: p2 the canvas, p3 the stroke round things
        else if (mode < 2.5) { float an = radians(p2), ca = cos(an), sa = sin(an); vec2 r2 = mat2(ca, -sa, sa, ca) * sp / p1; float dr = sqrt(max(0., p4 - L)) * .72; R = F; if (L < p4 && length(fract(r2) - .5) < dr) R *= .5; R = mix(R, vec3(.08, .07, .09), edge); }   // comic: p1 the dots' size, p2 their angle, p4 where the shade starts
        else if (mode < 3.5) { float gr = vnz(sp * .5) * .5 + vnz(sp * 2.1) * .5; vec3 paper = vec3(.96, .94, .88), c0 = texture2D(tColor, uv).rgb;
          vec3 nb = (texture2D(tColor, uv + vec2(1.5, 0.) / res).rgb + texture2D(tColor, uv - vec2(1.5, 0.) / res).rgb + texture2D(tColor, uv + vec2(0., 1.5) / res).rgb + texture2D(tColor, uv - vec2(0., 1.5) / res).rgb) * .25;
          float g = clamp(abs(dot(nb - c0, vec3(.3, .59, .11))) * 5., 0., 1.), gran = vnz(sp * .22); R = mix(F, paper, (.24 + gr * .16) * p1 * 1.6); R = mix(R, R * .7, (g * .7 + edge * .5) * p2 * 1.4); R *= 1. - p3 * .1 + gran * p3 * .3; R = mix(R, paper, smoothstep(.68, .9, L) * .8 * p1 * 1.6); R *= .94 + gr * .1; }   // watercolour: p1 the paper, p2 the pooling, p3 the grain
        else if (mode < 4.5) { vec3 paper = inkA, ink = inkB; float h = 0.;   // pencil: p1 the lines' spacing, p2 their strength, p3 how much colour is left
          if (L < .78) h = max(h, step(fract((sp.x + sp.y) / p1), .16)); if (L < .52) h = max(h, step(fract((sp.x - sp.y) / p1), .16)); if (L < .3) h = max(h, step(fract(sp.y / (p1 * .67)), .22));
          R = mix(paper, F, p3); R = mix(R, ink, h * p2); R = mix(R, ink, edge); R *= .96 + vnz(sp * .7) * .06; }
        else if (mode < 5.5) { vec3 o2 = vec3(.96, .94, .89); float d1 = clamp((1. - F.g) * 1.1 - .1, 0., 1.), d2 = clamp((1. - F.r) * 1.1 - .15, 0., 1.), d3 = clamp((1. - F.b) * .9 - .2, 0., 1.);   // riso: three inks (inkA..C), p1 how far off register, p2 the dots' size
          vec2 a1 = mat2(.966, -.259, .259, .966) * (sp + vec2(p1, p1 * .33)) / p2, a2 = mat2(.707, -.707, .707, .707) * (sp - vec2(p1 * .66, p1)) / p2, a3 = sp / p2;
          if (length(fract(a1) - .5) < sqrt(d1) * .6) o2 *= inkA; if (length(fract(a2) - .5) < sqrt(d2) * .6) o2 *= inkB; if (length(fract(a3) - .5) < sqrt(d3) * .5) o2 *= inkC;
          R = mix(o2, o2 * .5, edge * .7) * (.95 + vnz(sp * .9) * .08); }
        else { float b = bayer(floor(sp / p1)); R = mix(L + .08 > b ? inkB : inkA, inkA, edge); }   // one-bit: inkA the dark, inkB the light, p1 the dither's size
        return mix(F0, R, fx); }
      void main(){
        vec2 q = vUv - .5, qa = q * vec2(res.x / res.y, 1.);
        vec2 uvD = .5 + q * (1. + aber * .07 * dot(qa, qa)) + shift / res;   // (shift: the part of a pixel the camera was snapped by, given back smoothly)                // speed: a lens, the picture bulging a touch (still in whole pixels)
        if (wobA > .001) uvD += (vec2(vnz(vUv * 6. + wobT), vnz(vUv * 6. - wobT + 5.)) - .5) * wobA * 1.6 / res;   // (the drawing boiling: moved a hair, eight times a second)
        vec2 px = floor(uvD * res), uv = (px + .5) / res;
        vec3 c = vec3(0.);                                                  // smoothing: the pixel as the average of a bigger picture's ss x ss block
        if (ss <= 3.) { for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) { if (float(i) >= ss || float(j) >= ss) continue; c += texture2D(tColor, (px * ss + vec2(float(i), float(j)) + .5) / (res * ss)).rgb; } c /= ss * ss; }
        else { for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) c += texture2D(tColor, (px * ss + (vec2(float(i), float(j)) + .5) / 4. * ss) / (res * ss)).rgb; c /= 16.; }   // (bigger blocks: 16 filtered samples spread over it)
        if (mode > .5 && mode < 1.5) c = kuwa(vUv, (.8 + p1 * 1.4) / scr);                        // painted: the colour of the calmest patch round it (in the screen's own pixels: strokes, not blocks)
        if (mode > 2.5 && mode < 3.5) { vec3 a = vec3(0.); for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) a += texture2D(tColor, vUv + vec2(float(i), float(j)) * (.5 + p4 * 4.) / scr).rgb; c = a / 9.; }   // watercolour: soft
        vec2 dv = uv - .5;
        // speed: a radial blur (the world streaming out from the middle, the middle itself sharp): sampled along the line to the middle,
        // from the screen's own point (not the pixel's block), so the streaks run smooth
        if (aber > .01) { vec2 dvS = vUv - .5; float rr = length(dvS * vec2(res.x / res.y, 1.)), k0 = smoothstep(.1, .6, rr) * aber * step(1.5, lin(texture2D(tDepth, vUv).r));   // (not the bag by the lens)
          if (k0 > .01) { vec3 acc = vec3(0.); float ws = 0.; for (int k = 0; k < 10; k++) { float t = float(k) / 9., w = 1. - t * .55; acc += texture2D(tColor, vUv - dvS * t * .1 * aber).rgb * w; ws += w; }
            c = mix(c, acc / ws, min(1., k0 * 1.4)); } }
        // the air: the far land paler, bluer, a little soft (the more the farther: from about 45 m, most by 300 m); the sky left as it is
        float rawA = texture2D(tDepth, uv).r, hz = rawA > .9999 ? 0. : haze * smoothstep(45., 300., lin(rawA));
        if (hz > .02) { vec3 bl = (texture2D(tColor, (px + vec2(1., 0.) + .5) / res).rgb + texture2D(tColor, (px + vec2(-1., 0.) + .5) / res).rgb + texture2D(tColor, (px + vec2(0., 1.) + .5) / res).rgb + texture2D(tColor, (px + vec2(0., -1.) + .5) / res).rgb) * .25;
          c = mix(c, bl, min(1., hz * 1.4)); }
        c = toSRGB(aces(c * exposure));
        c = mix(c, hazeCol, hz * .35);                                  // (a little before the palette, so it picks paler colours far off; the rest after it)
        // the outline: this pixel is behind the one next to it by a good deal
        // shading as drawn: shadows cooler, lights warmer
        float Y = dot(c, vec3(.3, .59, .11));
        c = mix(c, c * vec3(.78, .82, 1.12) + vec3(.02, .0, .05), smoothstep(.42, .08, Y) * .7 * hue);
        c = mix(c, c * vec3(1.07, 1.02, .88), smoothstep(.62, .95, Y) * .55 * hue);
        float raw = texture2D(tDepth, uv).r, d = lin(raw), e = 0.;
        for (int k = 0; k < 8; k++) { vec2 o = k == 0 ? vec2(1, 0) : k == 1 ? vec2(-1, 0) : k == 2 ? vec2(0, 1) : k == 3 ? vec2(0, -1) : k == 4 ? vec2(2, 0) : k == 5 ? vec2(-2, 0) : k == 6 ? vec2(0, 2) : vec2(0, -2);
          if (k > 3 && oWide < .5) break;                                   // (thick: two pixels out, not one)
          float n = lin(texture2D(tDepth, (px + o + .5) / res).r); e = max(e, (d - n) / d); }
        vec3 ink = mix(c * .3 + vec3(.1, .06, .12), vec3(.075, .07, .08), oInk);   // (a dark warm violet, or ink black)
        if (e > oThr && d < 120.) c = mix(c, ink, outline * smoothstep(oThr, oThr + .18, e));
        // the lines inside a thing: where two faces meet, found from the depth alone (1/depth is flat across a flat face, so where its
        // second difference is not nothing, the surface bends): a bend towards you (a ridge, a kerb's edge, a roof's) gets a lit pixel,
        // a bend away (a wall meeting a roof, a corner inside) a dark one
        else if (crease > .01 && d < 70.) { float wc = 1. / d, wl = 1. / lin(texture2D(tDepth, (px + vec2(-1., 0.) + .5) / res).r), wr = 1. / lin(texture2D(tDepth, (px + vec2(1., 0.) + .5) / res).r),
            wu = 1. / lin(texture2D(tDepth, (px + vec2(0., 1.) + .5) / res).r), wd = 1. / lin(texture2D(tDepth, (px + vec2(0., -1.) + .5) / res).r);
          float lap = max(abs(wl + wr - 2. * wc), abs(wu + wd - 2. * wc)) / wc * sign(wl + wr + wu + wd - 4. * wc), jump = max(max(abs(wl - wc), abs(wr - wc)), max(abs(wu - wc), abs(wd - wc))) / wc;
          if (jump < .2) { if (lap < -cThr) c = mix(c, c * 1.3 + vec3(.07, .06, .03), crease * smoothstep(cThr, cThr * 2.5, -lap));
            else if (lap > cThr) c = mix(c, ink, crease * .55 * smoothstep(cThr, cThr * 2.5, lap)); } }
        if (aber > .01) { float v = smoothstep(.35, 1.05, length((vUv - .5) * vec2(res.x / res.y, 1.))) * aber; c *= 1. - v * .32; }   // the edges a little darker, smoothly (no dither)
        c = (c - .5) * contrast + .5; { float L = dot(c, vec3(.3, .59, .11)); c = mix(vec3(L), c, sat); }   // contrast, saturation
        if (vig > .01) { float v = smoothstep(.5, 1.25, length((uv - .5) * vec2(res.x / res.y, 1.)) * 1.5) * vig; if (bayer(px) < v) c = c * .62 + vec3(.01, .0, .03); }   // a vignette, dithered
        c += (bayer(px) - .47) * (raw > .9999 ? skyDither : dither) * on;   // (the pixel look off: no dither)
        if (levels > 1.5 && on > .5) c = floor(c * levels + .5) / levels;                                                // posterize: fewer steps of each colour           // (the sky: the gradient dithered; things: barely)
        float scan = crt > .01 ? 1. - crt * .3 * step(.5, fract(gl_FragCoord.y * .5)) : 1.;             // (scanlines, as an old screen)
        if (palOn < .5 || on < .5) { gl_FragColor = vec4(hurtIt(stylize(mix(clamp(c, 0., 1.), hazeCol, hz * .5), uv) * scan, px, uv), 1.); return; }
        vec3 best = pal[0]; float bd = 1e9;
        for (int k = 0; k < ${PALETTE.length}; k++) { vec3 q = pal[k] - c; float w = dot(q * q, vec3(.3, .59, .11)); if (w < bd) { bd = w; best = pal[k]; } }
        gl_FragColor = vec4(hurtIt(stylize(mix(mix(clamp(c, 0., 1.), best, palMix), hazeCol, hz * .5), uv) * scan, px, uv), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qs.add(quad);
  let W = 4, H = 4;
  let lastArgs = [4, 4, height];
  function resize(w, h, hh = height) {                                 // a whole-number scale, so every pixel is the same size (drawn ss times bigger, then averaged)
    lastArgs = [w, h, hh]; const k = Math.max(1, Math.round(h / hh)); H = Math.ceil(h / k); W = Math.ceil(w / k);
    const ss = Math.max(1, Math.min(want, Math.floor(4096 / W), Math.floor(4096 / H))); mat.uniforms.ss.value = ss;   // (the bigger picture no bigger than the GPU likes)
    rt.setSize(W * ss, H * ss); rt.depthTexture.image.width = W * ss; rt.depthTexture.image.height = H * ss; mat.uniforms.res.value.set(W, H); mat.uniforms.scr.value.set(W * k, H * k);
    return { W, H, k };
  }
  // the snap: the camera moved, for the drawing, to the nearest whole pixel (as seen at the distance of what it follows) in its own
  // plane, so still things fall on the same pixels frame after frame and do not shimmer; the rest of the move, under a pixel, is given
  // back by shifting the finished picture (shift), so it still glides
  const snap = { on: false, tgt: new THREE.Vector3() }, _r = new THREE.Vector3(), _u = new THREE.Vector3(), _p = new THREE.Vector3();
  function render(scene, camera, over, cam2, split) {                 // (over: { scene, camera } drawn over the world into the same picture: the bag in the corner; cam2: two players, the picture split ('v': side by side, 'h': one over the other))
    if (cam2) { mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far; mat.uniforms.shift.value.set(0, 0); const w = rt.width, h = rt.height;
      const R = split === 'v' ? [[0, 0, w >> 1, h], [w >> 1, 0, w - (w >> 1), h]] : [[0, h >> 1, w, h - (h >> 1)], [0, 0, w, h >> 1]];
      [camera, cam2].forEach((c, k) => { const [x, y, ww, hh] = R[k]; rt.viewport.set(x, y, ww, hh); rt.scissor.set(x, y, ww, hh); rt.scissorTest = true; renderer.setRenderTarget(rt); if (k === 0) renderer.clear(); renderer.render(scene, c); });
      rt.viewport.set(0, 0, w, h); rt.scissor.set(0, 0, w, h); rt.scissorTest = false; renderer.setRenderTarget(null); renderer.render(qs, qc); return; }
    mat.uniforms.near.value = camera.near; mat.uniforms.far.value = camera.far;
    let moved = false; mat.uniforms.shift.value.set(0, 0);
    if (snap.on && camera.isPerspectiveCamera) { camera.updateMatrixWorld(); _p.copy(camera.position); _r.setFromMatrixColumn(camera.matrixWorld, 0); _u.setFromMatrixColumn(camera.matrixWorld, 1);
      const D = Math.max(1, camera.position.distanceTo(snap.tgt)), ps = 2 * D * Math.tan(camera.fov * Math.PI / 360) / H, cx = _p.dot(_r) / ps, cy = _p.dot(_u) / ps, fx = cx - Math.round(cx), fy = cy - Math.round(cy);
      camera.position.addScaledVector(_r, -fx * ps).addScaledVector(_u, -fy * ps); camera.updateMatrixWorld(); mat.uniforms.shift.value.set(fx, fy); moved = true; }
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    if (moved) { camera.position.copy(_p); camera.updateMatrixWorld(); }
    if (over) { const ac = renderer.autoClear; renderer.autoClear = false; over.camera.near = camera.near; over.camera.far = camera.far; renderer.render(over.scene, over.camera); renderer.autoClear = ac; }   // (the depth kept: the world's outline needs it; the bag is drawn small, right by the lens, so it is in front anyway)
    renderer.setRenderTarget(null); renderer.render(qs, qc);
  }
  let want = 1;
  function setSmooth(n) { want = Math.max(1, Math.min(10, n | 0)); resize(...lastArgs); }
  return { snap, resize, render, setSmooth, uniforms: mat.uniforms, get size() { return [W, H]; } };
}
