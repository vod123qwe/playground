/* <ai-blob>: a living AI orb as one web component, no dependencies (WebGL2).

   <script src="ai-blob.js"></script>
   <ai-blob variant="glass" state="listening" theme="light" palette="aurora"></ai-blob>

   Attributes (each is also a property):
     variant   glass | soft | halo | core | aurora | mercury | cloud | nebula | dots | swarm | rings
     state     default | listening | speaking | thinking | connecting | error | muted
               connecting and error play once, then go back by themselves (connecting to default, error to the state before it)
     blend     auto | ink | glow: ink draws clean colour for light pages, glow shines on dark ones, auto looks at the
               background behind the orb (default auto; theme="light" / "dark" also works)
     ground    present = the orb floats over a ground with a soft shadow in perspective; it sits down when muted and
               stands up when it wakes (lift scales the height)
     interactive  tap to squeeze and flare it (default on; "false" turns it off) · intro  pops in with a spring (default on)
     lines     rings: how many loops (2–16, default 5)
     tuning    sweep (glass: light through it every few seconds, 0–2), glow, halo, rim, core, glints (0–2), detail (noise scale), wobble (0–1), color-speed, lift, resolution
     palette   aurora | ocean | sunset | mint | mono              (default aurora)
     colors    four colours, space separated, instead of a palette: "#7b5cff #2ec5ff #ff6fd8 #ffd38a"
     speed     motion speed, 1 = normal
     level     0–1, the voice loudness from your own audio; leave it out and listening/speaking move to a built-in voice
     label     what a screen reader hears before the state (default "AI assistant")
   Methods: useMicrophone() → Promise (listening follows the microphone), stopMicrophone(), useAnalyser(analyserNode),
   tap(angleDeg?, strength?), replayIntro()
   (speaking follows any Web Audio source, e.g. your text-to-speech).
   Events: statechange { state, previous, auto } (auto = it went back by itself), tap { angle, strength }.
   The canvas is transparent; the size is the element's size (any square, 24 px to 600 px; small sizes draw a simpler orb).
   It pauses when off screen or in a hidden tab, and moves slower when the system asks for reduced motion. */
(() => {
  if (customElements.get('ai-blob')) return;

  const PALETTES = {
    aurora: ['#7b5cff', '#2ec5ff', '#ff6fd8', '#ffc56e'],
    ocean: ['#1f6bff', '#19c3d6', '#7a8cff', '#9fe7ff'],
    sunset: ['#ff5f6d', '#ff9a3c', '#c94bff', '#ffd27a'],
    mint: ['#12b886', '#4dd4ac', '#3ba7ff', '#c3f584'],
    mono: ['#3d3f4a', '#8a8e9e', '#5d6170', '#c9ccd6'],
  };
  const VARIANTS = ['glass', 'soft', 'halo', 'core', 'aurora', 'mercury', 'cloud', 'nebula', 'dots', 'swarm', 'rings'];
  // (what each state asks of the orb; the orb eases towards it, so every change is a morph)
  //  amp: how much it wobbles · freq: how fine the wobble · spin: turning speed · voice: how much the voice moves it · scale · sat: colour
  //  glow · think: inner swirl · tint: the error red · ripple: rings coming in, listening · spread: the inside comes loose
  //  sweep: a band of light that runs through the glass every few seconds (a small AirDrop inside the orb)
  const STATES = {
    default:    { amp: .10, freq: 1.4, spin: .25, voice: 0,   scale: 1,    sat: 1,   glow: .85, think: 0, tint: 0, ripple: 0, spread: 0, sweep: 1 },
    listening:  { amp: .12, freq: 1.5, spin: .32, voice: .6,  scale: 1.05, sat: 1,   glow: 1,   think: 0, tint: 0, ripple: 1, spread: .08, sweep: 0.55 },
    speaking:   { amp: .12, freq: 1.6, spin: .4,  voice: 1,   scale: 1,    sat: 1.06, glow: 1.05, think: 0, tint: 0, ripple: 0, spread: .15, sweep: 0.35 },
    thinking:   { amp: .16, freq: 2.1, spin: 1.3, voice: 0,   scale: .96,  sat: 1,   glow: .95, think: 1, tint: 0, ripple: 0, spread: .45, sweep: 0.75 },
    connecting: { amp: .1,  freq: 1.4, spin: .5,  voice: 0,   scale: 1,    sat: 1,   glow: .9,  think: .3, tint: 0, ripple: 0, spread: 0, sweep: 0 },
    error:      { amp: .07, freq: 2.6, spin: .12, voice: 0,   scale: .93,  sat: .9,  glow: .75, think: 0, tint: 1, ripple: 0, spread: 0, sweep: 0 },
    muted:      { amp: .03, freq: 1.2, spin: .06, voice: 0,   scale: .9,   sat: .12, glow: .45, think: 0, tint: 0, ripple: 0, spread: 0, sweep: 0 },
  };
  const KEYS = Object.keys(STATES.default);
  const TRANSIENT = { connecting: 1.5, error: 1.7 };   // (seconds, then it goes back)

  // ---------- shaders ----------
  const NOISE = `
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);} vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=m289(i);
vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
  const COMMON = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uT, uR, uAmp, uFreq, uPulse, uScale, uSat, uGlow, uThink, uTint, uRipple, uSpread, uDark, uDetail, uPx;
uniform vec2 uShake, uOff; uniform vec3 uC0, uC1, uC2, uC3; uniform float uCT, uHaloK, uRimK, uCoreK, uGlintK, uTap, uSweep, uSweepK;
${NOISE}
// (the palette as a loop: 0 → c0 → c1 → c2 → c3 → back to c0)
vec3 pal(float x){ x = fract(x) * 4.; vec3 a = x < 1. ? uC0 : x < 2. ? uC1 : x < 3. ? uC2 : uC3; vec3 b = x < 1. ? uC1 : x < 2. ? uC2 : x < 3. ? uC3 : uC0; float f = fract(x); return mix(a, b, f * f * (3. - 2. * f)); }
// (the finish every orb gets: the muted grey and the error red)
vec3 finish(vec3 c){ float g = dot(c, vec3(.299, .587, .114)); c = mix(vec3(g), c, uSat); vec3 red = uDark > .5 ? vec3(1., .33, .36) : vec3(.86, .2, .24); return mix(c, red * (.75 + .35 * g), uTint * .78); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float fbm(vec3 p, int oct){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { if (i >= oct) break; s += a * snoise(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;
  const QUAD_VS = `#version 300 es
in vec2 aP; out vec2 vUv; out vec2 vRaw; uniform vec2 uRes, uOff; uniform mat2 uWarp; void main(){ vRaw = aP * (uRes / min(uRes.x, uRes.y)); vUv = uWarp * (vRaw - uOff); gl_Position = vec4(aP, 0., 1.); }`;

  // glass: a liquid orb, ray marched; the inside is coloured light that swirls, the skin catches highlights and a thin iridescence
  const GLASS_SRC = `
in vec2 vUv; in vec2 vRaw; out vec4 o;
float field(vec3 p){ vec3 q = p; q.xz *= rot(uR * .6); q.xy *= rot(uR * .25);
  float f = uFreq * .72, n = snoise(q * f + vec3(0., uT * .55, uT * .3)), n2 = snoise(q * f * 1.9 - vec3(uT * .4, 0., uT * .2));
  float d = (n + n2 * .22 * uDetail) * uAmp * .55;
  d += uRipple * .018 * sin(p.y * 11. - uT * 5.) * (.4 + uPulse * 1.4);
  d += uPulse * .07 * (.7 + .3 * snoise(q * 1.8 + uT * 1.3));
  return d; }
float sdf(vec3 p){ return length(p) - .6 * uScale * (1. + field(p)); }
float kOf(vec3 rr){ float ang = atan(rr.x, rr.z), sw = uThink * sin(ang * 2. + uR * 1.6 + rr.y * 3.); return rr.y * .5 + rr.x * .22 + snoise(rr * 1.05 + vec3(uT * .14, uT * .08, 0.)) * .48 + sw * .25 + uR * .05; }
vec3 nrm(vec3 p){ vec2 e = vec2(.004, 0.); return normalize(vec3(sdf(p + e.xyy) - sdf(p - e.xyy), sdf(p + e.yxy) - sdf(p - e.yxy), sdf(p + e.yyx) - sdf(p - e.yyx))); }
void main(){
  vec2 uv = vUv - uShake; vec3 ro = vec3(0., 0., 2.6), rd = normalize(vec3(uv * .98, -2.3));
  float t = 1.4, md = 1e9, mt = t; int steps = uDetail > .5 ? 70 : 42;
  for (int i = 0; i < 70; i++) { if (i >= steps) break; float d = sdf(ro + rd * t); if (d < md) { md = d; mt = t; } if (d < .0008) break; t += d * .72; if (t > 3.8) break; }
  vec3 p = ro + rd * mt, n = nrm(p); float cov = 1. - smoothstep(0., uPx * 1.6, md);
#ifdef SOFT
  cov = 1. - smoothstep(-.03, .17 + .08 * uHaloK, md); cov *= cov;   // (the soft one: the colour fades out over a wide edge)
#endif
  float fr = pow(1. - max(dot(n, -rd), 0.), 2.6);
  // the inside: light bent through the skin, red, green and blue each bent a little differently (dispersion), coloured by the
  // palette and stirred (harder when thinking)
  float thick = clamp(dot(n, -rd), 0., 1.);
  // (the sweep: a band across the orb from the top left to the bottom right; ahead of it the light inside is pushed, behind it pulled)
  vec2 sdir = normalize(vec2(1., -.62)); float sx = (dot(n.xy, sdir) - mix(-1.3, 1.3, uSweep)) / .24, sg = exp(-sx * sx) * uSweepK * step(0., uSweep);
  vec3 soff = vec3(sdir * (-2. * sx * sg) * .075, 0.);
  vec3 rrR = refract(rd, n, .72) + soff * 1.2, rrG = refract(rd, n, .75) + soff, rrB = refract(rd, n, .78) + soff * .8; float kG = kOf(rrG);
  vec3 inner = (uDetail > .3 ? vec3(pal(kOf(rrR)).r, pal(kG).g, pal(kOf(rrB)).b) : pal(kG)) * (.62 + .5 * thick);
  // (veins of light in the liquid: the thin bright ridges of a slow noise, brighter while it speaks)
  float cz = snoise(rrG * 2. + vec3(0., uT * .32, uT * .18) + uThink * vec3(sin(uR), 0., cos(uR)));
  inner += (pal(kG + .5) * .55 + .45) * pow(1. - abs(cz), 10.) * (.5 + .5 * thick) * (.3 + uPulse * .45) * uDetail;
  inner += vec3(1.) * pow(max(1. - thick, 0.), 6.) * .08;
  // the skin: a key light, a soft light from below, a thin film of colour at the edge
  vec3 L = normalize(vec3(-.45, .75, .6)), rf = reflect(rd, n);
  float spec = pow(max(dot(rf, L), 0.), 70.) * 1.4 + pow(max(dot(rf, normalize(vec3(.6, -.3, .7))), 0.), 22.) * .25;
  vec3 film = pal(fr * 1.6 + n.y * .2 + uT * .03) * fr;
  vec3 col = inner * (1. - fr * .55) + film * (uDark > .5 ? .9 : .65) + vec3(spec);
  col *= .78 + .3 * uGlow;
  col += mix(vec3(1.), pal(dot(n.xy, sdir) * .6 + uCT * .05), .35) * sg * (uDark > .5 ? .55 : .5) * (.6 + .4 * fr);
#ifndef SOFT
  if (uDark < .5) col = mix(col, col * vec3(.9, .9, .95), fr * .4);   // (a hint of a darker rim, so it holds its edge on white)
#endif
  col = finish(col);
  float a = cov * (uDark > .5 ? .93 + fr * .07 : .97);
#ifdef SOFT
  a = cov * (1. - smoothstep(.1, .9, fr) * .9);   // (the soft one turns clear towards its edge and melts into its own light)
#endif
  // the aura round it: light on dark pages, a faint tinted haze on light ones
  float halo = uHaloK * exp(-max(md, 0.) * 11. / max(uHaloK, .05)) * smoothstep(.98, .55, length(uv)) * (1. - cov) * uGlow * (uDark > .5 ? .55 : .2);
  vec3 hc = finish(pal(atan(uv.y, uv.x) / 6.283 + uT * .04));
#ifdef SOFT
  hc = mix(hc, col, .7); halo *= 2.4;
#endif
  o = vec4(col * a + hc * halo, a + halo * (uDark > .5 ? .6 : 1.));
  o = clamp(o, 0., 1.);
  o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  const GLASS_FS = COMMON + GLASS_SRC, SOFT_FS = COMMON + '\n#define SOFT 1\n' + GLASS_SRC;

  // cloud: soft colour blobs drifting inside one another, their edge a living outline
  const CLOUD_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o;
void main(){
  vec2 p = (vUv - uShake) / (uScale * (1. + uPulse * .1));
  vec2 w = vec2(snoise(vec3(p * 1.7, uT * .35)), snoise(vec3(p * 1.7 + 9., uT * .35))) * (.07 + uAmp * .5);
  w += uThink * .08 * vec2(snoise(vec3(p * 3.2, uT)), snoise(vec3(p * 3.2 + 4., uT)));
  vec2 q = p + w; float dens = 0.; vec3 acc = vec3(0.);
  for (int i = 0; i < 5; i++) { float fi = float(i), a = uR * (.7 + fi * .23) * (i % 2 == 0 ? 1. : -1.) + fi * 1.257;
    float orb = .22 + .12 * sin(uT * .4 + fi * 2.) + uSpread * .14;
    vec2 c = orb * vec2(cos(a), sin(a * (1. + uThink * .3)));
    float s = .32 + .06 * sin(uT * .7 + fi) + uPulse * .05, g = exp(-dot(q - c, q - c) / (s * s));
    acc += pal(fi * .2 + uT * .02) * g; dens += g; }
  int oc = uDetail > .5 ? 4 : 2;
  vec2 w1 = vec2(fbm(vec3(q * .75, uT * .14), oc), fbm(vec3(q * .75 + 5.2, uT * .14), oc));
  float silk = fbm(vec3(q * .75 + w1 * (1.1 + uThink * 1.4), uT * .1 + 3.), oc);
  vec3 col = mix(acc / max(dens, 1e-4), pal(silk * .55 + length(w1) * .3 + uT * .02), .38);
  col += vec3(1.) * smoothstep(.15, .5, silk) * .12 * uDetail;
  float r = length(p), edge = .58 + .05 * snoise(vec3(normalize(p + 1e-4) * 1.3, uT * .5)) * (1. + uAmp * 3.) + uRipple * .02 * sin(r * 30. - uT * 6.);
  float body = smoothstep(edge + uPx * 2.5 + .03, edge - .04, r) * smoothstep(.05, .6, dens);
  col = mix(col, vec3(1.), (uDark > .5 ? .18 : .32) * exp(-dot(q - vec2(-.12, .14), q - vec2(-.12, .14)) * 9.));   // (a soft light at the top left)
  col *= .8 + .28 * uGlow; col = finish(col);
  float a = body * (uDark > .5 ? .95 : .92);
  float halo = uHaloK * exp(-max(r - edge, 0.) * 11. / max(uHaloK, .05)) * smoothstep(.98, .6, r * uScale) * (1. - body) * uGlow * (uDark > .5 ? .5 : .16);
  if (uRipple > .01) for (int k = 0; k < 3; k++) { float f = fract(uT * .32 + float(k) / 3.), rr = edge + .02 + f * .3; halo += uRipple * (1. - f) * .35 * smoothstep(uPx * 2., 0., abs(r - rr)) * (uDark > .5 ? 1. : .8); }
  vec3 hc = finish(pal(atan(p.y, p.x) / 6.283 + uT * .03));
  o = clamp(vec4(col * a + hc * halo, a + halo), 0., 1.);
  o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  // nebula: a mass of coloured gas in space. The ray marches through it; at every step a second look towards the light says how much
  // gas stands in the way, so the cloud has a lit side and a shadowed one (it reads as a form, not a haze); the core is denser and
  // glows; stars sit behind and inside it in three layers that turn at different speeds (depth)
  const NEBULA_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o;
float hash3(vec3 p){ return fract(sin(dot(p, vec3(17.1, 113.3, 71.7))) * 43758.5453); }
float gas(vec3 q, float r, int oc){
  vec3 sw = uThink * .45 * vec3(sin(uT * 1.3 + q.y * 4.), 0., cos(uT * 1.3 + q.y * 4.));
  float b = fbm(q * 1.2 * uFreq / 1.4 + vec3(0., -uT * .3, uT * .18) + sw, oc), fine = uDetail > .5 ? fbm(q * 3.4 + vec3(uT * .2, 0., 0.), 2) * .35 : 0.;
  return clamp((1. - r) * 1.55 + b * .95 + fine - .42 + uAmp * 1.4 + uPulse * .3 + uRipple * .1 * sin(r * 18. - uT * 5.), 0., 1.); }
void main(){
  vec2 uv = vUv - uShake; vec3 ro = vec3(0., 0., 2.6), rd = normalize(vec3(uv * .98, -2.3));
  float R = .66 * uScale * (1. + uPulse * .07), b = dot(ro, rd), c = dot(ro, ro) - R * R, h = b * b - c;
  vec4 acc = vec4(0.); int oc = uDetail > .5 ? 3 : 2, N = uDetail > .5 ? 36 : 18; vec3 L = normalize(vec3(-.55, .65, .5));
  if (h > 0.) { h = sqrt(h); float t0 = -b - h, t1 = -b + h, dt = (t1 - t0) / float(N), jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    for (int i = 0; i < 36; i++) { if (i >= N) break; vec3 p = ro + rd * (t0 + dt * (float(i) + jit)), q = p / R;
      q.xz *= rot(uR * .5); q.xy *= rot(uR * .18); float r = length(p) / R, d = gas(q, r, oc);
      if (d < .01) continue;
      float sh = gas(q + L * .22, length(p / R + L * .22), 2), lit = exp(-sh * 2.6);   // (how much gas lies towards the light)
      float core = exp(-r * r * 7.) * (.9 + uPulse * .8 + uTap * .6);
      vec3 cc = pal(d * .4 + r * .35 + atan(q.z, q.x) / 6.283 + uCT * .03);
      cc = cc * (.22 + lit * 1.05) * (1. + uGlow * .35) + pal(.55 + uCT * .03) * core * 1.1 + vec3(1.) * core * core * .25;
      float a = clamp(d * dt * 7.5 / R, 0., 1.);
      acc.rgb += (1. - acc.a) * cc * a; acc.a += (1. - acc.a) * a; if (acc.a > .98) break; }
    // stars: three layers turning at different speeds, seen through the thinner gas
    vec3 sc = vec3(0.); for (int k = 0; k < 3; k++) { float fk = float(k), sp = .2 + fk * .25;
      vec2 su = rot(uR * sp + fk) * (uv / R) * (6. + fk * 5.), cell = floor(su), f = fract(su) - .5; float hh = hash3(vec3(cell, fk));
      float star = step(.86, hh) * smoothstep(.12 + fk * .03, 0., length(f - (vec2(hash3(vec3(cell, fk + 4.)), hash3(vec3(cell, fk + 9.))) - .5) * .6));
      sc += star * (.6 + .4 * sin(uT * 3. + hh * 40.)) * (1. - fk * .25); }
    float inside = smoothstep(1., .75, length(uv) / R); acc.rgb += sc * inside * (1. - acc.a * .85) * (uDark > .5 ? .9 : .5) * uGlintK; acc.a = max(acc.a, length(sc) * inside * .5 * (uDark > .5 ? 1. : .0)); }
  vec3 col = finish(acc.rgb / max(acc.a, 1e-3)) * (uDark > .5 ? 1. : .92); float a = acc.a * (uDark > .5 ? 1. : .95);
  float rr = length(uv), halo = uHaloK * exp(-rr * rr / (R * R) * 2.2 / max(uHaloK, .05)) * smoothstep(.98, .6, rr) * (1. - a) * uGlow * (uDark > .5 ? .42 : .14);
  vec3 hc = finish(pal(atan(uv.y, uv.x) / 6.283 + uT * .04));
  o = clamp(vec4(col * a + hc * halo, a + halo), 0., 1.);
  o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  // rings: loops in space. Each lies in its own tilted plane (spread round the sphere), turns slowly, wavers with the voice; they
  // are drawn as thin ribbons that always face the eye, the near side stronger than the far one. On a dark page a soft glow pass
  // goes under them. lines = how many (2–16)
  const RINGS_VS = `#version 300 es
precision highp float;
in float aT, aSide, aRing; out vec3 vCol; out float vA, vSide;
uniform vec2 uRes, uShake, uOff; uniform mat2 uWarpF; uniform float uT, uR, uCT, uAmp, uFreq, uPulse, uScale, uSat, uGlow, uThink, uTint, uRipple, uSpread, uDark, uLines, uLW, uPassA, uPassW, uTap;
uniform vec3 uC0, uC1, uC2, uC3;
vec3 pal(float x){ x = fract(x) * 4.; vec3 a = x < 1. ? uC0 : x < 2. ? uC1 : x < 3. ? uC2 : uC3; vec3 b = x < 1. ? uC1 : x < 2. ? uC2 : x < 3. ? uC3 : uC0; float f = fract(x); return mix(a, b, f * f * (3. - 2. * f)); }
vec3 finish(vec3 c){ float g = dot(c, vec3(.299, .587, .114)); c = mix(vec3(g), c, uSat); vec3 red = uDark > .5 ? vec3(1., .33, .36) : vec3(.86, .2, .24); return mix(c, red * (.75 + .35 * g), uTint * .78); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 ring(float th, float fi){
  float k = uFreq / 1.4, r = .5 * (1. - fi * .01) * (1. + uSpread * (fract(fi * .37) - .5) * .35 + uRipple * .04 * sin(uT * 3. + fi));
  r *= 1. + uAmp * .55 * sin(3. * th + uT * (.6 + fi * .2) + fi) + uAmp * .3 * sin(5. * th - uT * (.9 + fi * .15)) + uAmp * .18 * (k - .7) * sin(8. * th + uT * 1.3 + fi * 3.)
     + uPulse * .09 * sin(9. * th + uT * 7. + fi * 2.) * (.5 + .5 * sin(uT * 3. + fi)) + uTap * .05 * sin(6. * th - uT * 9.);
  vec3 p = vec3(cos(th), sin(th), 0.) * r;
  float a1 = fi * 2.399 + uR * (.3 + fi * .07) * (mod(fi, 2.) < .5 ? 1. : -1.), a2 = (.35 + .55 * fract(fi * .618)) * (1. + uThink * .5) + .15 * sin(uT * .3 + fi);
  p.yz *= rot(a2); p.xy *= rot(a1); p.xz *= rot(uR * .25); return p * uScale; }
vec2 proj(vec3 p){ return p.xy * (2.3 / (2.6 - p.z)) / .98; }
void main(){
  float fi = aRing, th = aT * 6.2831853; vec3 P = ring(th, fi);
  vec2 s = proj(P), tg = normalize(proj(ring(th + .012, fi)) - proj(ring(th - .012, fi)) + 1e-6), nr = vec2(-tg.y, tg.x);
  float depth = clamp(P.z / .55 * .5 + .5, 0., 1.), lw = uLW * uPassW * (.75 + depth * .5);
  vec2 sp = uWarpF * (s + nr * aSide * lw) + uOff + uShake, asp = uRes / min(uRes.x, uRes.y);
  gl_Position = vec4(sp / asp, 0., 1.);
  vCol = finish(pal(fi / max(uLines, 1.) * .85 + sin(th) * .08 + uCT * .03)) * (uDark > .5 ? 1.05 + uGlow * .2 : .88);
  vA = ((uDark > .5 ? .5 : .72) + depth * (uDark > .5 ? .55 : .28)) * uPassA; vSide = aSide; }`;
  const RINGS_FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA, vSide; out vec4 o;
void main(){ float a = vA * smoothstep(1., .35, abs(vSide)); o = vec4(vCol * a, a); }`;

  // swarm: thousands of points making a sphere that breathes; they come loose when thinking and pulse with the voice
  const SWARM_VS = `#version 300 es
precision highp float;
in vec3 aBase; in vec2 aSeed; out vec3 vCol; out float vA;
uniform vec2 uRes; uniform float uT, uR, uAmp, uFreq, uPulse, uScale, uSat, uGlow, uThink, uTint, uRipple, uSpread, uDark, uDetail, uPx, uDpr, uPt;
uniform vec2 uShake, uOff; uniform mat2 uWarpF; uniform vec3 uC0, uC1, uC2, uC3; uniform float uCT;
${NOISE}
vec3 pal(float x){ x = fract(x) * 4.; vec3 a = x < 1. ? uC0 : x < 2. ? uC1 : x < 3. ? uC2 : uC3; vec3 b = x < 1. ? uC1 : x < 2. ? uC2 : x < 3. ? uC3 : uC0; float f = fract(x); return mix(a, b, f * f * (3. - 2. * f)); }
vec3 finish(vec3 c){ float g = dot(c, vec3(.299, .587, .114)); c = mix(vec3(g), c, uSat); vec3 red = uDark > .5 ? vec3(1., .33, .36) : vec3(.86, .2, .24); return mix(c, red * (.75 + .35 * g), uTint * .78); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
void main(){
  vec3 b = normalize(aBase + (vec3(aSeed, fract(aSeed.x * 7.13)) - .5) * .06); float n = snoise(b * uFreq + vec3(0., uT * .5, uT * .25));
  float r = .56 * uScale * (1. + n * uAmp * 1.3 + uPulse * .16 * (.55 + .45 * snoise(b * 3. + uT * 1.4)));
  r *= 1. + uRipple * .035 * sin(b.y * 10. - uT * 5.);
  r *= 1. + uSpread * (aSeed.y - .5) * .7 * (.6 + .4 * sin(uT * 1.7 + aSeed.x * 40.));
  vec3 p = b; p.xz *= rot(uR + uThink * (b.y * 2.2 + aSeed.x * 6.283) * .32); p *= r; p.yz *= rot(.38);
  float z = p.z; vec2 s = p.xy * (2.3 / (2.6 - z)) / 1.08;
  vec2 asp = uRes / min(uRes.x, uRes.y);
  gl_Position = vec4((uWarpF * s + uOff + uShake) / asp, 0., 1.);
  float depth = clamp(z / .7 * .5 + .5, 0., 1.);
  gl_PointSize = uPt * uDpr * (.65 + depth * .7) * (1. + uPulse * .25) * (uDark > .5 ? 1. : .85);
  vCol = finish(pal(aSeed.x * .5 + b.y * .25 + uT * .03) * (.75 + .3 * uGlow) * (uDark > .5 ? 1. : .86));
  vA = uDark > .5 ? .35 + depth * .55 : .2 + depth * .5; }`;
  const SWARM_FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA; out vec4 o; uniform float uDark;
void main(){ vec2 c = gl_PointCoord * 2. - 1.; float d = dot(c, c); if (d > 1.) discard; float a = vA * (uDark > .5 ? exp(-d * 2.6) : smoothstep(1., .55, d)); o = vec4(vCol * a, a); }`;


  // halo: a clear glass orb; almost nothing inside, a bright rim of colour flowing round the edge, a glowing core that breathes
  // with the voice, glints on the glass, an aura. On a light page (ink) it turns to frosted white glass with the colour on it
  const HALO_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o;
void main(){
  vec2 p = vUv - uShake; float ang = atan(p.y, p.x), r = length(p), R = .6 * uScale * (1. + uPulse * .06);
  vec2 dir = p / max(r, 1e-4);
  float wob = snoise(vec3(dir * (1. + uFreq * .3), uT * .45)) * (.005 + uAmp * .11) + uRipple * .004 * sin(ang * 5. - uT * 4.);
  float Rw = R * (1. + wob), e = r / Rw, aa = uPx * 1.5 / Rw;
  float inside = smoothstep(1. + aa, 1. - aa, e);
  vec3 n = vec3(p / Rw, sqrt(max(0., 1. - min(e * e, 1.))));
  // the rim: colours travelling round, a shimmer along it (finer with more detail), brighter when listening or tapped
  float sh = snoise(vec3(dir * uFreq * 1.2, uT * .6));
  float flow = ang / 6.283 + uCT * .07 * (1. + uThink * 2.5);
  vec3 rimC = finish(pal(flow + sh * .07));
  float rw = .075 * uRimK * (1. + uRipple * .3 + uTap * .4);
  float band = smoothstep(1. - rw * (1.8 + sh * .3), 1., e) * inside;
  float line = exp(-pow((1. - e) / (rw * .28 + aa), 2.)) * smoothstep(1. + aa * 3., 1., e);
  float rimI = (.75 + uGlow * .45 + uRipple * .35 + uTap * .8);
  // the core: a soft light that wanders a little, swells with the voice, pulses when thinking
  vec2 co = vec2(snoise(vec3(uT * .25, 0., 1.)), snoise(vec3(0., uT * .25, 5.))) * .08 * R;
  float cs = R * (uDark > .5 ? .34 : .42) * uCoreK * (1. + uPulse * .6 + uTap * .3) * (1. + uThink * .12 * sin(uT * 5.));
  vec2 dc = (p - co) * vec2(1., 1.25);
  float core = exp(-dot(dc, dc) / (cs * cs + 1e-5)) * (.75 + uPulse * .7 + uThink * .3 * (.5 + .5 * sin(uT * 3.3)) + uTap * .5);
  vec3 coreC = finish(pal(.5 + uCT * .05 + snoise(vec3(p * 2.5, uT * .35)) * .12));
  // glints: two highlights on the glass, top left and a small one bottom right
  vec2 g1 = rot(.75) * (p - vec2(-.36, .4) * R), g2 = rot(.75) * (p - vec2(.42, -.36) * R);
  float glint = (smoothstep(1., .35, length(g1 / vec2(.2 * R, .075 * R))) * .85 + smoothstep(1., .3, length(g2 / vec2(.07 * R, .03 * R))) * .5) * uGlintK * inside;
  float inner = .5 + .5 * snoise(vec3(n.xy * 1.4, uT * .25) + uThink * vec3(sin(uR), cos(uR), 0.));
  float d = max(r - Rw, 0.), halo = exp(-d * 8. / max(uHaloK, .05)) * (1. - inside) * smoothstep(.98, .5, length(vRaw - uOff));
  vec3 col; float a;
  if (uDark > .5) {
    col = rimC * (band * .9 + line * 1.3) * rimI + coreC * core * (.9 + uGlow * .5) + finish(pal(flow + .25)) * inner * .06 * inside + vec3(glint);
    col += finish(pal(flow)) * halo * (.35 + uRipple * .2 + uTap * .4) * uGlow;
    a = clamp(band * .8 + line + core * .85 + glint + inside * .1 + halo * .3, 0., 1.);
  } else {
    // frosted white body, lit from the top left, the colour laid on it
    vec3 body = mix(vec3(.93, .935, .95), vec3(1.), .55 + .45 * dot(n, normalize(vec3(-.4, .55, .73))));
    body = mix(body, finish(pal(flow + .4)) * .25 + .75, inner * .12);
    col = body; col = mix(col, rimC * .92, clamp(band * .85 * rimI, 0., 1.)); col = mix(col, rimC * .8, clamp(line * .8, 0., 1.));
    col = mix(col, coreC * .95, clamp(core * 1.05, 0., 1.)); col = mix(col, vec3(1.), clamp(glint, 0., 1.));
    a = inside * .94 + line * .06;
    float hl = halo * (.22 + uRipple * .12 + uTap * .25) * uGlow; col = col * a + finish(pal(flow)) * hl; a += hl;
    o = vec4(col, a); o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); return;
  }
  o = vec4(col, a); o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  // dots: the orb printed as a halftone; each dot's size is the light on a turning sphere with bands of noise over it.
  // The voice sends rings of bigger dots out from the middle, listening draws them in, thinking sweeps round
  const DOTS_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o; uniform float uCell;
void main(){
  vec2 p = vUv - uShake, g = (floor(p / uCell) + .5) * uCell, f = p - g; float R = .62 * uScale * (1. + uPulse * .05), r = length(g) / R, v = 0.;
  if (r < 1.1) { vec3 n = vec3(g / R, sqrt(max(0., 1. - min(r * r, 1.)))), q = n; q.xz *= rot(uR * .6); q.xy *= rot(uR * .2);
    float lit = .3 + .7 * max(dot(n, normalize(vec3(-.4, .5, .75))), 0.), band = .5 + .5 * snoise(q * uFreq * 1.25 + vec3(0., uT * .4, uT * .15));
    v = lit * (.45 + .55 * band) * smoothstep(1.04, .9, r);
    v += uPulse * .45 * (.5 + .5 * sin(r * 13. - uT * 9.)) * (1. - r * .7);
    v += uRipple * .22 * (.5 + .5 * sin(r * 14. + uT * 6.)) * smoothstep(1.05, .7, r);
    v += uThink * .32 * (.5 + .5 * sin(atan(g.y, g.x) * 2. - uR * 3. + r * 5.)) * smoothstep(1.02, .6, r);
    v += uTap * .4 * smoothstep(1., .2, r); }
  v = clamp(v, 0., 1.);
  float rad = uCell * .5 * sqrt(v) * .96, d = length(f) - rad, a = smoothstep(uPx * .9, -uPx * .9, d) * step(.035, v);
  float hueN = snoise(vec3(g / R * .9, uCT * .08)); vec3 c = finish(pal(hueN * .45 + (g.y / R) * .22 + uCT * .03)) * (uDark > .5 ? .85 + uGlow * .35 : .92);
  float gl = uDark > .5 ? exp(-max(d, 0.) / (uCell * .22)) * .3 * v * uGlow * uHaloK : 0.;
  o = vec4(c * (a + gl), a + gl * .6); o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  const TAPWAVE_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o; uniform vec4 uTW[3];
void main(){
  vec2 c = vRaw - uOff; float r = length(c), ang = atan(c.y, c.x); vec3 col = vec3(0.); float al = 0.;
  for (int i = 0; i < 3; i++) { vec4 w = uTW[i]; if (w.y <= 0.) continue; float k = w.x, rad = mix(.52 * w.z, .93, 1. - pow(1. - k, 2.2)), wd = .028 + k * .04, fade = w.y * (1. - k) * smoothstep(0., .06, k) * smoothstep(.99, .8, rad);
    for (int ch = 0; ch < 3; ch++) { float off = (float(ch) - 1.) * wd * .45 * (.5 + uRimK * .5), x = (r - rad - off) / wd, g = exp(-x * x) * fade;
      vec3 rc = mix(vec3(1.), finish(pal(ang / 6.283 + uCT * .05 + k * .3)), .5); col[ch] += rc[ch] * g; al += g / 3.; }
    float wash = smoothstep(rad, rad - .25, r) * smoothstep(.5 * w.z, rad, r) * fade * .06 * smoothstep(.97, .7, r); col += vec3(wash); al += wash; }
  al = clamp(al * (uDark > .5 ? .7 : 1.), 0., 1.); col *= uDark > .5 ? 1. : .85;
  o = vec4(col, al) * smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;

  // the ground: a soft shadow under the orb in perspective (a light pool on dark pages); it tightens and darkens as the orb
  // comes down and spreads and fades as it rises
  const GROUND_FS = COMMON + `
in vec2 vUv; in vec2 vRaw; out vec4 o; uniform float uGY, uH, uRx;
void main(){
  vec2 d = vRaw - vec2(uOff.x, uGY); float h = clamp(uH, 0., 1.5);
  float rx = uRx * (.95 - min(h, 1.) * .3), ry = rx * .17 + .008, q = length(d / vec2(rx, ry));
  float soft = exp(-q * q / (.55 + h * 2.2)), op = 1. - smoothstep(0., 1.1, h) * .7;
  float contact = exp(-pow(length(d / vec2(rx * .5, ry * .45)), 2.)) * (1. - smoothstep(0., .1, h));
  if (uDark > .5) { vec3 c = finish(pal(uCT * .03 + d.x * .6)); float a = (soft * .42 + contact * .2) * op * uGlow; o = vec4(c * a, a * .55); }
  else { vec3 c = finish(pal(uCT * .03)) * .2; float a = (soft * .2 + contact * .22) * op; o = vec4(c * a, a); }
  o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;


  // ---------- the vessels: a glass sphere with a world inside. The shell is an exact sphere: the ray bends where it enters and then
  // travels through what lives inside (so the glass truly lenses it), and the shell adds a studio reflection, a highlight, a thin
  // film of colour and a rainbow fringe at the edge. Three insides: 1 liquid light (glowing drops that merge and part), 2 aurora
  // (folded curtains of light), 4 mercury (an iridescent liquid metal) ----------
  const VESSEL_BODY = `
in vec2 vUv; in vec2 vRaw; out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
vec3 inFrame(vec3 p){ p.xz *= rot(uR * .5); p.xy *= rot(uR * .15 + uThink * .35 * sin(uT * .5)); return p; }
// (the studio the glass and the metal reflect: bright above, dark below, two soft boxes, tinted a touch by the palette)
vec3 env(vec3 d){ vec3 c = mix(vec3(.07, .075, .09), vec3(.96), smoothstep(-.35, .65, d.y));
  c += vec3(1.) * smoothstep(.88, .97, dot(d, normalize(vec3(-.55, .62, .55)))) * 1.6 + vec3(1.) * smoothstep(.82, .94, dot(d, normalize(vec3(.75, .15, .6)))) * .55;
  return mix(c, c * (pal(d.y * .5 + uCT * .02) * 1.5), .22); }
#if INTERIOR == 1
float sdIn(vec3 p){ p = inFrame(p); float d = 1e9;
  for (int i = 0; i < 6; i++) { float fi = float(i), s = 1. + fi * .17;
    vec3 c = vec3(sin(uT * .55 * s + fi * 1.7), cos(uT * .47 * s + fi * 2.3), sin(uT * .38 * s + fi * 4.1)) * (.24 + uSpread * .12 - uThink * .06);
    float r = .085 + .03 * sin(uT * 1.3 + fi * 2.) + uPulse * .05 + uTap * .03; d = smin(d, length(p - c) - r, .16 + uThink * .06); }
  return d; }
vec3 nIn(vec3 p){ vec2 e = vec2(.003, 0.); return normalize(vec3(sdIn(p + e.xyy) - sdIn(p - e.xyy), sdIn(p + e.yxy) - sdIn(p - e.yxy), sdIn(p + e.yyx) - sdIn(p - e.yyx))); }
#endif
#if INTERIOR == 4
float sdIn(vec3 p){ vec3 q = inFrame(p); float r = .29 * (1. + uPulse * .13 + uTap * .06);
  float n = snoise(q * 1.55 + vec3(0., uT * .45, 0.)) * (.035 + uAmp * .22) + snoise(q * 3.4 - uT * .35) * .008 * uDetail + uRipple * .014 * sin(q.y * 16. - uT * 6.);
  q.y *= 1. - uThink * .12 * sin(uT * 2.); return length(q) - r - n; }
vec3 nIn(vec3 p){ vec2 e = vec2(.003, 0.); return normalize(vec3(sdIn(p + e.xyy) - sdIn(p - e.xyy), sdIn(p + e.yxy) - sdIn(p - e.yxy), sdIn(p + e.yyx) - sdIn(p - e.yyx))); }
#endif
void main(){
  o = vec4(0.); vec2 uv = vUv - uShake; vec3 ro = vec3(0., 0., 2.6), rd = normalize(vec3(uv * .98, -2.3));
  float R = .62 * uScale * (1. + uPulse * .035), b = dot(ro, rd), c0 = dot(ro, ro) - R * R, h = b * b - c0;
  float dRay = length(cross(rd, -ro)), px = uPx * 1.13, cov = smoothstep(R + px * 1.5, R - px * 1.5, dRay);
  bool dark = uDark > .5; vec4 acc = vec4(0.); vec3 shell = vec3(0.); float shellA = 0.;
  if (h > 0.) {
    float t0 = -b - sqrt(h); vec3 P = ro + rd * t0, N = normalize(P);
    N = normalize(N + (vec3(snoise(N * 2. + uT * .2), snoise(N * 2. + 7. + uT * .2), 0.)) * (.025 + uAmp * .12));   // (a soft wobble of the glass)
    float cosi = max(dot(N, -rd), 0.), fr = .04 + .96 * pow(1. - cosi, 4.);
    vec3 rd2 = refract(rd, N, .7), q0 = P - N * .002;
    float b2 = dot(q0, rd2), c2 = dot(q0, q0) - (R * .97) * (R * .97), tEx = -b2 + sqrt(max(b2 * b2 - c2, 0.));
    int steps = uDetail > .5 ? 44 : uDetail > .15 ? 26 : 14; float dt = tEx / float(steps), j = hash(gl_FragCoord.xy + fract(uT) * 31.);
    // ---- the inside ----
#if INTERIOR == 1 || INTERIOR == 4
    float t = j * dt * .5, glow = 0.;
    for (int i = 0; i < 96; i++) { if (i >= steps * 2 || t > tEx) break; vec3 p = (q0 + rd2 * t) / max(uScale, .2); float d = sdIn(p);
#if INTERIOR == 1
      glow += exp(-max(d, 0.) * 18.) * .06;
#endif
      if (d < .0015) {
        vec3 n = nIn(p), v = -rd2;
#if INTERIOR == 1
        float f = pow(1. - max(dot(n, v), 0.), 2.);
        vec3 cc = pal(dot(n, vec3(.3, .6, .2)) * .35 + uCT * .05 + .1) * (.75 + .55 * pow(max(dot(n, v), 0.), 2.) + uPulse * .5 + uTap * .4) + vec3(1.) * (f * .45 + pow(max(dot(n, v), 0.), 8.) * .35);
#else
        vec3 rf = reflect(-v, n); float f = pow(1. - max(dot(n, v), 0.), 1.6);
        vec3 cc = env(rf) * .9 + pal(f * 1.4 + n.y * .35 + uCT * .04) * (.25 + f * .5) + vec3(1.) * pow(max(dot(rf, normalize(vec3(-.5, .6, .6))), 0.), 50.) * 1.2;
#endif
        acc = vec4(cc, 1.); break; }
      t += max(d * .8, dt * .25); }
#if INTERIOR == 1
    vec3 gc = pal(.55 + uCT * .03) * glow * (1. + uPulse * .8 + uThink * .3) * uCoreK;
    acc.rgb = acc.a > .5 ? acc.rgb + gc * .3 : gc; acc.a = max(acc.a, clamp(glow * (dark ? .55 : .9) * uCoreK, 0., 1.));
#endif
#else
    for (int i = 0; i < 48; i++) { if (i >= steps) break; float t = (float(i) + j) * dt; vec3 p = inFrame((q0 + rd2 * t) / max(uScale, .2)); float dens = 0.; vec3 cc = vec3(0.);
#if INTERIOR == 2
      // two folded curtains, rays streaming down them, brightest at their lower edge
      for (int k = 0; k < 2; k++) { float fk = float(k), ph = fk * 2.1;
        float s = p.z + (fk - .5) * .22 + .2 * sin(p.x * 3.1 + uT * (.45 + uThink * .8) + ph) + .12 * fbm(vec3(p.x * 1.8, p.y * .6, uT * .12 + ph), 2);
        // (a curtain: a sharp bright lower edge, rays rising from it and fading up)
        float base = -.3 + .07 * sin(p.x * 2.3 + uT * .35 + ph) + fk * .05, up = p.y - base;
        float sheet = exp(-s * s * 240.), vert = smoothstep(-.035, 0., up) * exp(-max(up, 0.) * 2.4) * (1. + uPulse * .8);
        float rays = .25 + .75 * pow(.5 + .5 * sin(p.x * 44. + fbm(vec3(p.x * 2., p.z, uT * .25 + ph), 2) * 8.), 3.);
        float dk = sheet * vert * rays * (1. + 1.6 * exp(-max(up, 0.) * 16.)); dens += dk; cc += pal(.35 + up * 1.1 + fk * .2 + uCT * .03) * dk; }
      cc /= max(dens, 1e-4); dens *= (.55 + uGlow * .25) * (1. + uPulse * .6) * (uDark > .5 ? 1.15 : 2.2); cc *= uDark > .5 ? 1.15 : .9;
#endif
      float a = clamp(dens * dt * 9., 0., 1.); acc.rgb += (1. - acc.a) * cc * a; acc.a += (1. - acc.a) * a; if (acc.a > .97) break; }
    acc.rgb = acc.a > 0. ? acc.rgb : vec3(0.);
#endif
    // ---- the shell ----
    vec3 rf = reflect(rd, N), refl = env(rf);
    float spec = pow(max(dot(rf, normalize(vec3(-.5, .62, .6))), 0.), 90.) * 1.6 * uGlintK + pow(max(dot(rf, normalize(vec3(.7, -.35, .6))), 0.), 28.) * .25 * uGlintK;
    vec3 film = pal(fr * 2. + N.y * .3 + uCT * .03) * fr * (.35 + uRimK * .35);
    float edge = smoothstep(.55, 1., 1. - cosi); vec3 fringe = (.5 + .5 * cos(6.283 * (edge * 1.6 + vec3(0., .33, .67)))) * edge * .22 * uRimK;
    if (dark) { shell = refl * fr * .85 + film + fringe + vec3(spec); shellA = clamp(fr * .5 + spec + .05, 0., 1.); }
    else { refl = mix(refl, refl * vec3(.62, .66, .74), .55); shell = refl * fr * .7 + film * .75 + fringe * .7 + vec3(spec) * .9; shellA = clamp(fr * .55 + spec * .6 + .07, 0., 1.); }
    // (on a light page the inside is laid down as colour, not light, so it does not wash out on white)
    vec3 ins = acc.rgb * (dark ? (1. + uGlow * .35) : .92) * (1. - fr * .5);
    float ia = acc.a * (dark ? .8 : .95);
    vec3 col = finish(ins * ia + shell * (1. - ia * .35)); float a = clamp(ia + shellA * (1. - ia), 0., 1.);
    o = vec4(col, a) * cov;
  }
  // the aura round the glass
  float out_ = max(dRay - R, 0.), halo = uHaloK * exp(-out_ * 10. / max(uHaloK, .05)) * (1. - cov) * uGlow * (dark ? .42 : .14) * smoothstep(.98, .5, length(vRaw - uOff));
  vec3 hc = finish(pal(atan(uv.y, uv.x) / 6.283 + uCT * .03));
  o += vec4(hc * halo, halo);
  o *= smoothstep(1., .9, max(abs(vRaw.x), abs(vRaw.y))); }`;
  const VESSEL = n => COMMON + `\n#define INTERIOR ${n}\n` + VESSEL_BODY;

  // ---------- small helpers ----------
  const hex = h => { h = String(h).trim().replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return Number.isFinite(n) ? [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255] : [.5, .5, .5]; };
  const easeBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // (the tunable numbers: attribute → [default, min, max])
  const NUM = { lines: [5, 2, 16], sweep: [1, 0, 2], speed: [1, 0, 4], glow: [1, 0, 2], halo: [1, 0, 2.5], rim: [1, 0, 2.5], core: [1, 0, 2.5], glints: [1, 0, 2], detail: [1, .3, 3], wobble: [0, 0, 1], 'color-speed': [1, 0, 4], lift: [1, 0, 2], resolution: [1, .4, 1.5] };
  // (how high the orb floats over the ground in each state: muted sits on it, listening stands up tallest)
  const LIFT = { default: .15, listening: .25, speaking: .19, thinking: .21, connecting: .15, error: .1, muted: 0 };
  const GROUND_Y = -.74;
  const lum = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); if (v.length > 3 && v[3] < .5) return null; return (.2126 * v[0] + .7152 * v[1] + .0722 * v[2]) / 255; };

  class AIBlob extends HTMLElement {
    static get observedAttributes() { return ['variant', 'state', 'theme', 'blend', 'palette', 'colors', 'level', 'label', 'ground', 'interactive', 'intro', ...Object.keys(NUM)]; }
    constructor() { super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:inline-block;width:160px;aspect-ratio:1;position:relative;contain:strict;vertical-align:middle;-webkit-tap-highlight-color:transparent}:host([hidden]){display:none}
        canvas{position:absolute;inset:0;width:100%;height:100%;display:block}.fb{position:absolute;inset:18%;border-radius:50%;display:none}</style><canvas part="canvas"></canvas><div class="fb" part="fallback"></div>`;
      this._cv = root.querySelector('canvas'); this._fb = root.querySelector('.fb');
      this._p = { ...STATES.default }; this._t = 0; this._r = 0; this._ct = 0; this._sw = 2.6; this._tw = []; this._lvl = 0; this._sim = { on: false, until: 0, ph: 0, rate: 5, gain: .8 };
      this._state = 'default'; this._back = 'default'; this._since = 0; this._shake = [0, 0]; this._visible = true; this._ink = true;
      // (the body's springs: height, the squash on landing, the squash of a tap, the pop-in)
      this._lift = .15; this._liftV = 0; this._sq = 0; this._sqV = 0; this._tap = 0; this._tapV = 0; this._tapA = 0; this._flare = 0; this._intro = 1; this._introV = 0; this._introDone = false;
      this._frame = this._frame.bind(this); this._down = this._down.bind(this); this.setAttribute('role', 'img'); }
    connectedCallback() { this._setup(); this._io = new IntersectionObserver(es => { this._visible = es[0].isIntersecting; if (this._visible && !this._introDone) this._startIntro(); this._kick(); }); this._io.observe(this);
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this); this._vis = () => this._kick(); document.addEventListener('visibilitychange', this._vis);
      this.addEventListener('pointerdown', this._down); this._detect(); this._bg = setInterval(() => this._detect(), 1200); this._aria(); this._kick(); }
    disconnectedCallback() { this._io?.disconnect(); this._ro?.disconnect(); document.removeEventListener('visibilitychange', this._vis); this.removeEventListener('pointerdown', this._down); clearInterval(this._bg);
      cancelAnimationFrame(this._raf); this._raf = 0; this.stopMicrophone(); }
    attributeChangedCallback(name, old, v) {
      if (name === 'state') { const s = STATES[v] ? v : 'default'; if (s !== this._state || old == null) this._go(s, false); }
      else if (name === 'variant') { if (this._gl) this._program(); }
      else if (name === 'palette' || name === 'colors') this._cols = null;
      else if (name === 'blend' || name === 'theme') this._detect();
      else if (name === 'resolution') this._resize();
      this._aria(); this._kick(); }
    // (properties mirror the attributes)
    get variant() { const v = this.getAttribute('variant'); return VARIANTS.includes(v) ? v : 'glass'; } set variant(v) { this.setAttribute('variant', v); }
    get state() { return this._state; } set state(v) { this.setAttribute('state', v); }
    get theme() { return this.getAttribute('theme') === 'dark' ? 'dark' : 'light'; } set theme(v) { this.setAttribute('theme', v); }
    get blend() { const b = this.getAttribute('blend'); return b === 'glow' || b === 'ink' ? b : 'auto'; } set blend(v) { this.setAttribute('blend', v); }
    get palette() { return this.getAttribute('palette') || 'aurora'; } set palette(v) { this.setAttribute('palette', v); }
    get colors() { return this._colors(); } set colors(v) { this.setAttribute('colors', Array.isArray(v) ? v.join(' ') : v); }
    get level() { const l = parseFloat(this.getAttribute('level')); return Number.isFinite(l) ? Math.min(1, Math.max(0, l)) : null; } set level(v) { if (v == null) this.removeAttribute('level'); else this.setAttribute('level', v); }
    get _grounded() { return this.ground && (this._css || 160) >= 72; }   // (an icon is too small to stand on a ground: it floats)
    get ground() { const g = this.getAttribute('ground'); return g != null && g !== 'false'; } set ground(v) { if (v) this.setAttribute('ground', ''); else this.removeAttribute('ground'); }
    get interactive() { return this.getAttribute('interactive') !== 'false'; } set interactive(v) { this.setAttribute('interactive', String(!!v)); }
    get intro() { return this.getAttribute('intro') !== 'false'; } set intro(v) { this.setAttribute('intro', String(!!v)); }
    num(name) { const [d, lo, hi] = NUM[name], v = parseFloat(this.getAttribute(name)); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
    get speed() { return this.num('speed'); } set speed(v) { this.setAttribute('speed', v); }
    static get palettes() { return PALETTES; } static get states() { return Object.keys(STATES); } static get variants() { return VARIANTS; } static get tunables() { return NUM; }
    _colors() { const c = (this.getAttribute('colors') || '').split(/[\s,]+/).filter(Boolean); if (c.length >= 2) { while (c.length < 4) c.push(c[c.length % 2]); return c.slice(0, 4); } return PALETTES[this.palette] || PALETTES.aurora; }
    _aria() { this.setAttribute('aria-label', `${this.getAttribute('label') || 'AI assistant'}: ${this._state}`); }

    // ---------- light or dark under it: blend="ink" draws clean colour for light pages, "glow" shines for dark ones, "auto" looks
    // at the background behind the orb (theme="dark" / "light" still works and wins over auto) ----------
    _detect() { const b = this.blend; let ink;
      if (b !== 'auto') ink = b === 'ink'; else if (this.hasAttribute('theme')) ink = this.theme !== 'dark';
      else { ink = true; let el = this.parentElement || this.getRootNode()?.host;
        while (el) { const l = lum(getComputedStyle(el).backgroundColor); if (l != null) { ink = l > .45; break; } el = el.parentElement || el.getRootNode?.()?.host; }
        if (!el) { const l = lum(getComputedStyle(document.body).backgroundColor) ?? lum(getComputedStyle(document.documentElement).backgroundColor); if (l != null) ink = l > .45; } }
      if (ink !== this._ink) { this._ink = ink; this._kick(); } }

    // ---------- states: a change eases every value towards the new state; connecting and error are short scenes ----------
    _go(s, auto) { const prev = this._state; if (!TRANSIENT[prev]) this._back = prev; if (s === 'error' && TRANSIENT[prev]) this._back = 'default';
      this._state = s; this._since = 0; if (auto) this.setAttribute('state', s);
      if (s === 'connecting') { this._p.scale = 0; this._p.spread = 1.6; this._p.glow = 1.7; this._lift = 0; this._liftV = 0; this._sq = .35; this._sqV = 0; }   // (it gathers on the ground and stands up)
      this._aria(); if (prev !== s) this.dispatchEvent(new CustomEvent('statechange', { detail: { state: s, previous: prev, auto } })); this._kick(); }

    // ---------- touch: a tap squeezes the orb from the side it came from and flares it ----------
    tap(angle = Math.random() * 360, strength = 1) { this._sw = 0; this._tw.push({ k: 0, s: Math.min(1.4, strength) }); if (this._tw.length > 3) this._tw.shift();   // (a tap also sends light through the glass)
      this._tapA = angle * Math.PI / 180; this._tapV += 6.5 * strength; this._flare = Math.min(1.6, this._flare + strength); this.dispatchEvent(new CustomEvent('tap', { detail: { angle, strength } })); this._kick(); }
    _down(e) { if (!this.interactive) return; const r = this.getBoundingClientRect(); this.tap(Math.atan2(-(e.clientY - r.top - r.height / 2), e.clientX - r.left - r.width / 2) * 180 / Math.PI, 1); }
    refresh() { this._detect(); this._kick(); }   // (look at the background again, e.g. right after the page switched light and dark)
    replayIntro() { this._introDone = false; this._startIntro(); }
    _startIntro() { this._introDone = true; if (!this.intro || reduced.matches) { this._intro = 1; return; } this._intro = 0; this._introV = 0; this._kick(); }

    // ---------- microphone and outside audio ----------
    async useMicrophone() { const ctx = this._ac || (this._ac = new (window.AudioContext || window.webkitAudioContext)()); await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); this.stopMicrophone();
      const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an); this._mic = { stream, an }; this._an = an; this._buf = new Float32Array(an.fftSize); return true; }
    stopMicrophone() { if (this._mic) { this._mic.stream.getTracks().forEach(t => t.stop()); if (this._an === this._mic.an) this._an = null; this._mic = null; } }
    useAnalyser(an) { this._an = an; this._buf = an ? new Float32Array(an.fftSize) : null; }

    // ---------- WebGL ----------
    _setup() { if (this._gl || this._noGL) return; const gl = this._cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) { this._noGL = true; const c = this._colors(); this._fb.style.display = 'block'; this._fb.style.background = `radial-gradient(circle at 35% 30%, ${c[3]}, ${c[0]} 45%, ${c[1]})`; return; }
      this._gl = gl; this._cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this._gl = null; this._prog = null; this._progs = {}; this._rg = null; this._pts = null; });
      this._cv.addEventListener('webglcontextrestored', () => { this._setup(); this._kick(); });
      this._quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this._quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this._progs = {}; this._program(); this._resize(); }
    _compile(vs, fs) { const gl = this._gl, mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); } return { p, u }; }
    _get(key, vs, fs) { if (!this._progs[key]) { try { this._progs[key] = this._compile(vs, fs); } catch (e) { console.error('ai-blob shader (' + key + ')', e); this._progs[key] = null; } } return this._progs[key]; }
    _program() { const gl = this._gl; if (!gl) return; const v = this.variant;
      const FS = { glass: GLASS_FS, soft: SOFT_FS, halo: HALO_FS, core: VESSEL(1), aurora: VESSEL(2), mercury: VESSEL(4), cloud: CLOUD_FS, nebula: NEBULA_FS, dots: DOTS_FS, rings: RINGS_FS };
      this._prog = v === 'swarm' ? this._get(v, SWARM_VS, SWARM_FS) : v === 'rings' ? this._get(v, RINGS_VS, RINGS_FS) : this._get(v, QUAD_VS, FS[v]); this._points(); this._loops(); }
    _loops() { const gl = this._gl; if (this.variant !== 'rings' || !gl || this._rg) return; const SEG = 220, n = (SEG + 1) * 2, d = new Float32Array(16 * n * 3);
      for (let r = 0; r < 16; r++) for (let i = 0; i <= SEG; i++) for (let sd = 0; sd < 2; sd++) d.set([i / SEG, sd ? 1 : -1, r], ((r * n) + i * 2 + sd) * 3);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); this._rg = { b, n }; }
    // (the swarm's points: a Fibonacci sphere, fewer and larger on small orbs)
    _points() { const gl = this._gl; if (this.variant !== 'swarm' || !gl) return; const n = this._detail > .5 ? 2600 : this._detail > .15 ? 1200 : 420; if (this._pts?.n === n) return;
      const base = new Float32Array(n * 3), seed = new Float32Array(n * 2), ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), a = i * ga; base.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); seed.set([Math.random(), Math.random()], i * 2); }
      const b1 = this._pts?.b1 || gl.createBuffer(), b2 = this._pts?.b2 || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, base, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW); this._pts = { n, b1, b2 }; }
    _resize() { const w = this.clientWidth || 160, h = this.clientHeight || w, css = Math.min(w, h); this._css = css;
      this._detail = Math.min(1, Math.max(0, (css - 40) / 160));
      const dpr = Math.min(window.devicePixelRatio || 1, css > 320 ? 1.5 : 2) * this.num('resolution'); this._dpr = dpr; this._cv.width = Math.max(1, Math.round(w * dpr)); this._cv.height = Math.max(1, Math.round(h * dpr)); this._points(); this._kick(); }
    _kick() { if (!this._raf && this.isConnected && this._visible && !document.hidden) { this._last = 0; this._raf = requestAnimationFrame(this._frame); } }

    // ---------- the built-in voice: syllables in phrases with pauses, for listening (you) and speaking (the AI) ----------
    _voice(dt) { const s = this._sim, now = this._t;
      if (now > s.until) { s.on = !s.on; s.until = now + (s.on ? 1.3 + Math.random() * 2.4 : .25 + Math.random() * .6); s.rate = 4 + Math.random() * 2.5; s.gain = .6 + Math.random() * .4; }
      if (!s.on) return 0; s.ph += dt * s.rate * Math.PI * 2; const syl = Math.pow(Math.abs(Math.sin(s.ph * .5)), 1.4), wob = .7 + .3 * Math.sin(now * 13.7) * Math.sin(now * 7.3);
      return Math.min(1, s.gain * (.25 + .75 * syl) * wob); }

    _frame(ms) { this._raf = 0; if (!this._visible || document.hidden || !this.isConnected) return; this._raf = requestAnimationFrame(this._frame);
      const dt = this._last ? Math.min(.05, (ms - this._last) / 1000) : .016; this._last = ms; const slow = reduced.matches ? .35 : 1, sp = this.speed * slow;
      this._since += dt;
      if (TRANSIENT[this._state] && this._since > TRANSIENT[this._state]) this._go(this._state === 'error' ? this._back || 'default' : 'default', true);
      const tgt = { ...STATES[this._state] }, k = 1 - Math.exp(-dt * 3.2);
      if (this._state === 'connecting') { const e = Math.min(1, this._since / 1.1); tgt.scale = easeBack(e); tgt.glow = 1.6 - .7 * e; tgt.spread = 1.4 * (1 - e); }
      if (this._state === 'error' && this._since > 1.05) tgt.tint = 0;
      for (const key of KEYS) this._p[key] += (tgt[key] - this._p[key]) * (key === 'scale' && this._state === 'connecting' ? 1 - Math.exp(-dt * 14) : k);
      // (the voice: given level, else the microphone / audio source while listening or speaking, else the built-in one)
      let lv = this.level;
      if (lv == null && this._an && (this._state === 'listening' || this._state === 'speaking')) { this._an.getFloatTimeDomainData(this._buf); let s = 0; for (const v of this._buf) s += v * v; lv = Math.min(1, Math.sqrt(s / this._buf.length) * 6); }
      if (lv == null) lv = this._p.voice > .02 ? this._voice(dt) : 0;
      this._lvl += (lv - this._lvl) * (1 - Math.exp(-dt * (lv > this._lvl ? 28 : 9)));
      this._t += dt * sp * (.55 + this._p.amp * 2.5 + this._p.think * .4); this._r += dt * sp * this._p.spin; this._ct += dt * sp * this.num('color-speed'); this._sw += dt * sp;
      for (const w of this._tw) w.k += dt / 1.05; this._tw = this._tw.filter(w => w.k < 1);   // (a tap wave crosses the box in about a second)
      const e = this._state === 'error' && !reduced.matches ? this._since : 9; this._shake[0] = e < .55 ? .035 * Math.exp(-e * 6) * Math.sin(e * 55) : 0;
      // (the body: it floats at the state's height on a spring, with a slow bob and a little lift from the voice; landing squashes it,
      //  rising stretches it; muted, it sits on the ground, slightly flattened)
      const g = this._grounded, still = reduced.matches, bob = this._state === 'muted' ? 0 : Math.sin(this._t * 1.1) * .012 + this._lvl * this._p.voice * .03;
      const lt = (g ? LIFT[this._state] * this.num('lift') : 0) + bob * (g ? 1 : .6);
      this._liftV += (40 * (lt - this._lift) - 7.5 * this._liftV) * dt; this._lift += this._liftV * dt;
      if (g && this._lift < 0) { if (this._liftV < -.12 && !still) this._sqV += -this._liftV * 7; this._lift = 0; this._liftV = 0; }
      const st = g ? (this._state === 'muted' ? .07 : 0) : 0; this._sqV += (170 * (st - this._sq) - 11 * this._sqV) * dt; this._sq += this._sqV * dt;
      this._tapV += (-150 * this._tap - 8.5 * this._tapV) * dt; this._tap += this._tapV * dt; this._flare *= Math.exp(-dt * 3.2);
      if (this._intro < 1 || Math.abs(this._introV) > .01) { this._introV += (110 * (1 - this._intro) - 10 * this._introV) * dt; this._intro += this._introV * dt; }
      this._draw(); }

    // (the body's shape on screen: size, squash and stretch, the tap's squeeze; its centre over the ground)
    _warp() { const g = this._grounded, gs = (g ? .8 : 1) * Math.max(.001, this._intro), str = Math.max(-.12, Math.min(.12, this._liftV * .22)) * (g ? 1 : 0);
      const sy = 1 - this._sq + str, sx = 1 + this._sq * .6 - str * .5, ts = Math.max(-.4, Math.min(.4, this._tap)) * .45, c = Math.cos(this._tapA), s = Math.sin(this._tapA);
      // F = gs · R(a) · diag(1 - ts, 1 + ts·0.6) · R(-a) · diag(sx, sy)
      const a1 = 1 - ts, a2 = 1 + ts * .6, m00 = c * c * a1 + s * s * a2, m01 = c * s * (a1 - a2), m11 = s * s * a1 + c * c * a2;
      const F = [gs * m00 * sx, gs * m01 * sx, gs * m01 * sy, gs * m11 * sy];   // (column-major: [col0.x, col0.y, col1.x, col1.y])
      const det = F[0] * F[3] - F[2] * F[1], W = [F[3] / det, -F[1] / det, -F[2] / det, F[0] / det];
      const oy = g ? GROUND_Y + .6 * gs * sy + this._lift * 1.4 : this._lift;
      return { F, W, off: [0, oy], gs, sx }; }

    _uniforms(P, w) { const gl = this._gl, p = this._p, u = P.u, ink = this._ink, f1 = (n, v) => u[n] && gl.uniform1f(u[n], v);
      if (u.uRes) gl.uniform2f(u.uRes, this._cv.width, this._cv.height);
      const flare = this._flare;
      f1('uT', this._t); f1('uR', this._r); f1('uCT', this._ct); f1('uAmp', p.amp + this.num('wobble') * .14); f1('uFreq', p.freq * this.num('detail')); f1('uPulse', this._lvl * p.voice);
      f1('uScale', Math.max(.001, p.scale)); f1('uSat', p.sat); f1('uGlow', (p.glow + flare * .5) * this.num('glow'));
      f1('uThink', p.think); f1('uTint', p.tint); f1('uRipple', p.ripple); f1('uSpread', p.spread); f1('uDark', ink ? 0 : 1); f1('uDetail', this._detail); f1('uDpr', this._dpr);
      f1('uPx', 2 / Math.min(this._cv.width, this._cv.height) / Math.max(.3, w.gs)); f1('uLines', Math.round(this.num('lines'))); f1('uLW', (1.05 + this.num('rim') * .9) * this._dpr * 2 / Math.min(this._cv.width, this._cv.height) / Math.max(.3, w.gs) * (this._detail > .15 ? 1 : 1.4)); f1('uPt', (this._detail > .5 ? 2.6 : this._detail > .15 ? 3.2 : 3.6) * w.gs);
      f1('uHaloK', this.num('halo')); f1('uRimK', this.num('rim')); f1('uCoreK', this.num('core')); f1('uGlintK', this.num('glints')); f1('uTap', Math.min(1, flare));
      { const per = 5.2 - 2.4 * this._p.think, ph = (this._sw % per) / 1.25; f1('uSweep', ph < 1 ? ph * ph * (3 - 2 * ph) : -1); f1('uSweepK', (this._p.sweep || 0) * this.num('sweep') * (reduced.matches ? .5 : 1)); }
      f1('uCell', 2 / (this._css / Math.min(12, Math.max(4, this._css / 30))) / Math.max(.3, w.gs));
      if (u.uShake) gl.uniform2f(u.uShake, this._shake[0], this._shake[1]);
      if (u.uWarp) gl.uniformMatrix2fv(u.uWarp, false, w.W); if (u.uWarpF) gl.uniformMatrix2fv(u.uWarpF, false, w.F); if (u.uOff) gl.uniform2f(u.uOff, w.off[0], w.off[1]);
      f1('uGY', GROUND_Y); f1('uH', this._lift * 1.4 / .6); f1('uRx', .6 * w.gs * w.sx);
      this._cols.forEach((c, i) => u['uC' + i] && gl.uniform3f(u['uC' + i], c[0], c[1], c[2])); }

    _quadDraw(P) { const gl = this._gl, a = gl.getAttribLocation(P.p, 'aP'); gl.bindBuffer(gl.ARRAY_BUFFER, this._quad); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(a); }
    _draw() { const gl = this._gl, P = this._prog; if (!gl || !P) return; const w = this._warp(), dark = !this._ink;
      if (!this._cols) this._cols = this._colors().map(hex);
      gl.viewport(0, 0, this._cv.width, this._cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND);
      if (this._grounded) { const G = this._get('ground', QUAD_VS, GROUND_FS); if (G) { gl.useProgram(G.p); this._uniforms(G, w); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); this._quadDraw(G); } }
      gl.useProgram(P.p); this._uniforms(P, w);
      if (this.variant === 'swarm') { gl.blendFunc(gl.ONE, dark ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); const pt = this._pts; if (!pt) return;
        const a1 = gl.getAttribLocation(P.p, 'aBase'), a2 = gl.getAttribLocation(P.p, 'aSeed');
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.b1); gl.enableVertexAttribArray(a1); gl.vertexAttribPointer(a1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.b2); gl.enableVertexAttribArray(a2); gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, pt.n); gl.disableVertexAttribArray(a1); gl.disableVertexAttribArray(a2); }
      else if (this.variant === 'rings') { const rg = this._rg; if (!rg) return; const loc = n => gl.getAttribLocation(P.p, n), aT = loc('aT'), aS = loc('aSide'), aR = loc('aRing');
        gl.bindBuffer(gl.ARRAY_BUFFER, rg.b); for (const [a, o] of [[aT, 0], [aS, 4], [aR, 8]]) { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 1, gl.FLOAT, false, 12, o); }
        const lines = Math.round(this.num('lines')), glow = (this._p.glow + this._flare * .5) * this.num('glow'), u = P.u;
        // (on a dark page a wide soft pass first, the glow; then the thin lines)
        if (dark && glow > .08) { gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1f(u.uPassW, 5); gl.uniform1f(u.uPassA, .1 * Math.min(glow, 2)); for (let i = 0; i < lines; i++) gl.drawArrays(gl.TRIANGLE_STRIP, i * rg.n, rg.n); }
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(u.uPassW, 1); gl.uniform1f(u.uPassA, 1); for (let i = 0; i < lines; i++) gl.drawArrays(gl.TRIANGLE_STRIP, i * rg.n, rg.n);
        for (const a of [aT, aS, aR]) gl.disableVertexAttribArray(a); }
      else { gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); this._quadDraw(P); }
      // (the tap waves over everything)
      if (this._tw.length) { const T = this._get('tapwave', QUAD_VS, TAPWAVE_FS); if (T) { gl.useProgram(T.p); this._uniforms(T, w); const arr = new Float32Array(12);
          this._tw.forEach((x, i) => arr.set([x.k, x.s, w.gs, 0], i * 4)); gl.uniform4fv(T.u['uTW[0]'] || T.u.uTW, arr); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); this._quadDraw(T); } } }
  }
  customElements.define('ai-blob', AIBlob);
})();
