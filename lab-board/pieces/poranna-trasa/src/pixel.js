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
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(4, 4) }, shift: { value: new THREE.Vector2() }, haze: { value: 1.2 }, hazeCol: { value: new THREE.Vector3(.76, .83, .86) }, crease: { value: 0 }, cThr: { value: .012 }, near: { value: .1 }, far: { value: 500 },
      pal: { value: pal.map(c => new THREE.Vector3(c.r, c.g, c.b)) }, dither: { value: .02 }, skyDither: { value: .07 }, outline: { value: .85 }, oInk: { value: 0 }, oThr: { value: .12 }, oWide: { value: 0 }, aber: { value: 0 }, ss: { value: 1 }, palOn: { value: 1 }, hue: { value: 1 }, palMix: { value: 1 }, levels: { value: 0 }, sat: { value: 1 }, contrast: { value: 1 }, vig: { value: 0 }, hurt: { value: 0 }, crt: { value: 0 }, exposure: { value: 1.0 }, on: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      uniform sampler2D tColor, tDepth; uniform vec2 res, shift; uniform float crease, cThr, haze; uniform vec3 hazeCol; uniform float near, far, dither, skyDither, outline, oInk, oThr, oWide, aber, ss, palOn, hue, palMix, levels, sat, contrast, vig, hurt, crt, exposure, on; uniform vec3 pal[${PALETTE.length}];
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
      void main(){
        vec2 q = vUv - .5, qa = q * vec2(res.x / res.y, 1.);
        vec2 uvD = .5 + q * (1. + aber * .07 * dot(qa, qa)) + shift / res;   // (shift: the part of a pixel the camera was snapped by, given back smoothly)                // speed: a lens, the picture bulging a touch (still in whole pixels)
        vec2 px = floor(uvD * res), uv = (px + .5) / res;
        vec3 c = vec3(0.);                                                  // smoothing: the pixel as the average of a bigger picture's ss x ss block
        if (ss <= 3.) { for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) { if (float(i) >= ss || float(j) >= ss) continue; c += texture2D(tColor, (px * ss + vec2(float(i), float(j)) + .5) / (res * ss)).rgb; } c /= ss * ss; }
        else { for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) c += texture2D(tColor, (px * ss + (vec2(float(i), float(j)) + .5) / 4. * ss) / (res * ss)).rgb; c /= 16.; }   // (bigger blocks: 16 filtered samples spread over it)
        vec2 dv = uv - .5;
        if (aber > .01) { vec3 acc = c; for (int k = 1; k < 4; k++) acc += texture2D(tColor, uv - dv * float(k) * .02 * aber).rgb;   // and the world streaming out from the middle
          c = mix(c, acc / 4., smoothstep(.06, .42, length(dv)) * aber); }
        // the air: the far land paler, bluer, a little soft (the more the farther: from about 45 m, most by 300 m); the sky left as it is
        float rawA = texture2D(tDepth, uv).r, hz = rawA > .9999 ? 0. : haze * smoothstep(45., 300., lin(rawA));
        if (hz > .02) { vec3 bl = (texture2D(tColor, (px + vec2(1., 0.) + .5) / res).rgb + texture2D(tColor, (px + vec2(-1., 0.) + .5) / res).rgb + texture2D(tColor, (px + vec2(0., 1.) + .5) / res).rgb + texture2D(tColor, (px + vec2(0., -1.) + .5) / res).rgb) * .25;
          c = mix(c, bl, min(1., hz * 1.4)); }
        c = toSRGB(aces(c * exposure));
        c = mix(c, hazeCol, hz * .35);                                  // (a little before the palette, so it picks paler colours far off; the rest after it)
        if (on < .5) { gl_FragColor = vec4(hurtIt(c, floor(gl_FragCoord.xy / 3.), vUv), 1.); return; }
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
        if (aber > .01) { float v = smoothstep(.3, .9, length((uv - .5) * vec2(res.x / res.y, 1.))) * aber; if (bayer(px) < v * 1.15) c = c * .42 + vec3(.02, .01, .05); }   // tunnel vision: the edges closing in, in a dither
        c = (c - .5) * contrast + .5; { float L = dot(c, vec3(.3, .59, .11)); c = mix(vec3(L), c, sat); }   // contrast, saturation
        if (vig > .01) { float v = smoothstep(.5, 1.25, length((uv - .5) * vec2(res.x / res.y, 1.)) * 1.5) * vig; if (bayer(px) < v) c = c * .62 + vec3(.01, .0, .03); }   // a vignette, dithered
        c += (bayer(px) - .47) * (raw > .9999 ? skyDither : dither);
        if (levels > 1.5) c = floor(c * levels + .5) / levels;                                                // posterize: fewer steps of each colour           // (the sky: the gradient dithered; things: barely)
        float scan = crt > .01 ? 1. - crt * .3 * step(.5, fract(gl_FragCoord.y * .5)) : 1.;             // (scanlines, as an old screen)
        if (palOn < .5) { gl_FragColor = vec4(hurtIt(mix(clamp(c, 0., 1.), hazeCol, hz * .5) * scan, px, uv), 1.); return; }
        vec3 best = pal[0]; float bd = 1e9;
        for (int k = 0; k < ${PALETTE.length}; k++) { vec3 q = pal[k] - c; float w = dot(q * q, vec3(.3, .59, .11)); if (w < bd) { bd = w; best = pal[k]; } }
        gl_FragColor = vec4(hurtIt(mix(mix(clamp(c, 0., 1.), best, palMix), hazeCol, hz * .5) * scan, px, uv), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qs.add(quad);
  let W = 4, H = 4;
  let lastArgs = [4, 4, height];
  function resize(w, h, hh = height) {                                 // a whole-number scale, so every pixel is the same size (drawn ss times bigger, then averaged)
    lastArgs = [w, h, hh]; const k = Math.max(1, Math.round(h / hh)); H = Math.ceil(h / k); W = Math.ceil(w / k);
    const ss = Math.max(1, Math.min(want, Math.floor(4096 / W), Math.floor(4096 / H))); mat.uniforms.ss.value = ss;   // (the bigger picture no bigger than the GPU likes)
    rt.setSize(W * ss, H * ss); rt.depthTexture.image.width = W * ss; rt.depthTexture.image.height = H * ss; mat.uniforms.res.value.set(W, H);
    return { W, H, k };
  }
  // the snap: the camera moved, for the drawing, to the nearest whole pixel (as seen at the distance of what it follows) in its own
  // plane, so still things fall on the same pixels frame after frame and do not shimmer; the rest of the move, under a pixel, is given
  // back by shifting the finished picture (shift), so it still glides
  const snap = { on: false, tgt: new THREE.Vector3() }, _r = new THREE.Vector3(), _u = new THREE.Vector3(), _p = new THREE.Vector3();
  function render(scene, camera, over) {                              // (over: { scene, camera } drawn over the world into the same picture: the bag in the corner)
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
