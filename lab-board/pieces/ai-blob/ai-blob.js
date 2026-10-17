/* <ai-blob>: a living AI orb as one web component, no dependencies.

   <script src="ai-blob.js"></script>
   <ai-blob variant="glass" state="listening" theme="light" palette="aurora"></ai-blob>

   Attributes (each is also a property):
     variant   glass | cloud | swarm | rings | nebula                     (default glass)
     state     default | listening | speaking | thinking | connecting | error | muted
               connecting and error play once, then go back by themselves (connecting to default, error to the state before it)
     theme     light | dark: how it blends with the page          (default light)
     palette   aurora | ocean | sunset | mint | mono              (default aurora)
     colors    four colours, space separated, instead of a palette: "#7b5cff #2ec5ff #ff6fd8 #ffd38a"
     speed     motion speed, 1 = normal
     level     0–1, the voice loudness from your own audio; leave it out and listening/speaking move to a built-in voice
     label     what a screen reader hears before the state (default "AI assistant")
   Methods: useMicrophone() → Promise (listening follows the microphone), stopMicrophone(), useAnalyser(analyserNode)
   (speaking follows any Web Audio source, e.g. your text-to-speech).
   Event: statechange { state, previous, auto } (auto = it went back by itself).
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
  const VARIANTS = ['glass', 'cloud', 'swarm', 'rings', 'nebula'];
  // (what each state asks of the orb; the orb eases towards it, so every change is a morph)
  //  amp: how much it wobbles · freq: how fine the wobble · spin: turning speed · voice: how much the voice moves it · scale · sat: colour
  //  glow · think: inner swirl · tint: the error red · ripple: rings coming in, listening · spread: the inside comes loose
  const STATES = {
    default:    { amp: .10, freq: 1.4, spin: .25, voice: 0,   scale: 1,    sat: 1,   glow: .85, think: 0, tint: 0, ripple: 0, spread: 0 },
    listening:  { amp: .12, freq: 1.5, spin: .32, voice: .6,  scale: 1.05, sat: 1,   glow: 1,   think: 0, tint: 0, ripple: 1, spread: .08 },
    speaking:   { amp: .12, freq: 1.6, spin: .4,  voice: 1,   scale: 1,    sat: 1.06, glow: 1.05, think: 0, tint: 0, ripple: 0, spread: .15 },
    thinking:   { amp: .16, freq: 2.1, spin: 1.3, voice: 0,   scale: .96,  sat: 1,   glow: .95, think: 1, tint: 0, ripple: 0, spread: .45 },
    connecting: { amp: .1,  freq: 1.4, spin: .5,  voice: 0,   scale: 1,    sat: 1,   glow: .9,  think: .3, tint: 0, ripple: 0, spread: 0 },
    error:      { amp: .07, freq: 2.6, spin: .12, voice: 0,   scale: .93,  sat: .9,  glow: .75, think: 0, tint: 1, ripple: 0, spread: 0 },
    muted:      { amp: .03, freq: 1.2, spin: .06, voice: 0,   scale: .9,   sat: .12, glow: .45, think: 0, tint: 0, ripple: 0, spread: 0 },
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
uniform vec2 uShake; uniform vec3 uC0, uC1, uC2, uC3;
${NOISE}
// (the palette as a loop: 0 → c0 → c1 → c2 → c3 → back to c0)
vec3 pal(float x){ x = fract(x) * 4.; vec3 a = x < 1. ? uC0 : x < 2. ? uC1 : x < 3. ? uC2 : uC3; vec3 b = x < 1. ? uC1 : x < 2. ? uC2 : x < 3. ? uC3 : uC0; float f = fract(x); return mix(a, b, f * f * (3. - 2. * f)); }
// (the finish every orb gets: the muted grey and the error red)
vec3 finish(vec3 c){ float g = dot(c, vec3(.299, .587, .114)); c = mix(vec3(g), c, uSat); vec3 red = uDark > .5 ? vec3(1., .33, .36) : vec3(.86, .2, .24); return mix(c, red * (.75 + .35 * g), uTint * .78); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float fbm(vec3 p, int oct){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { if (i >= oct) break; s += a * snoise(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;
  const QUAD_VS = `#version 300 es
in vec2 aP; out vec2 vUv; uniform vec2 uRes; void main(){ vUv = aP * (uRes / min(uRes.x, uRes.y)); gl_Position = vec4(aP, 0., 1.); }`;

  // glass: a liquid orb, ray marched; the inside is coloured light that swirls, the skin catches highlights and a thin iridescence
  const GLASS_FS = COMMON + `
in vec2 vUv; out vec4 o;
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
  float fr = pow(1. - max(dot(n, -rd), 0.), 2.6);
  // the inside: light bent through the skin, red, green and blue each bent a little differently (dispersion), coloured by the
  // palette and stirred (harder when thinking)
  float thick = clamp(dot(n, -rd), 0., 1.);
  vec3 rrR = refract(rd, n, .72), rrG = refract(rd, n, .75), rrB = refract(rd, n, .78); float kG = kOf(rrG);
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
  if (uDark < .5) col = mix(col, col * vec3(.9, .9, .95), fr * .4);   // (a hint of a darker rim, so it holds its edge on white)
  col = finish(col);
  float a = cov * (uDark > .5 ? .93 + fr * .07 : .97);
  // the aura round it: light on dark pages, a faint tinted haze on light ones
  float halo = exp(-max(md, 0.) * 11.) * smoothstep(.98, .55, length(uv)) * (1. - cov) * uGlow * (uDark > .5 ? .55 : .2);
  vec3 hc = finish(pal(atan(uv.y, uv.x) / 6.283 + uT * .04));
  o = vec4(col * a + hc * halo, a + halo * (uDark > .5 ? .6 : 1.));
  o = clamp(o, 0., 1.);
  o *= smoothstep(1., .9, max(abs(vUv.x), abs(vUv.y))); }`;

  // cloud: soft colour blobs drifting inside one another, their edge a living outline
  const CLOUD_FS = COMMON + `
in vec2 vUv; out vec4 o;
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
  float halo = exp(-max(r - edge, 0.) * 11.) * smoothstep(.98, .6, r * uScale) * (1. - body) * uGlow * (uDark > .5 ? .5 : .16);
  if (uRipple > .01) for (int k = 0; k < 3; k++) { float f = fract(uT * .32 + float(k) / 3.), rr = edge + .02 + f * .3; halo += uRipple * (1. - f) * .35 * smoothstep(uPx * 2., 0., abs(r - rr)) * (uDark > .5 ? 1. : .8); }
  vec3 hc = finish(pal(atan(p.y, p.x) / 6.283 + uT * .03));
  o = clamp(vec4(col * a + hc * halo, a + halo), 0., 1.);
  o *= smoothstep(1., .9, max(abs(vUv.x), abs(vUv.y))); }`;

  const NEBULA_FS = COMMON + `
in vec2 vUv; out vec4 o;
void main(){
  vec2 uv = vUv - uShake; vec3 ro = vec3(0., 0., 2.6), rd = normalize(vec3(uv * .98, -2.3));
  float R = .66 * uScale * (1. + uPulse * .07), b = dot(ro, rd), c = dot(ro, ro) - R * R, h = b * b - c;
  vec4 acc = vec4(0.); int oc = 2, N = uDetail > .5 ? 34 : 18;
  if (h > 0.) { h = sqrt(h); float t0 = -b - h, t1 = -b + h, dt = (t1 - t0) / float(N);
    for (int i = 0; i < 34; i++) { if (i >= N) break; vec3 p = ro + rd * (t0 + dt * (float(i) + .5)), q = p;
      q.xz *= rot(uR * .55); q.xy *= rot(uR * .2); float r = length(p) / R;
      vec3 sw = uThink * .45 * vec3(sin(uT * 1.3 + q.y * 4.), 0., cos(uT * 1.3 + q.y * 4.));
      float d = fbm(q * 1.05 * uFreq / 1.4 + vec3(0., -uT * .35, uT * .2) + sw, oc);
      float dens = smoothstep(0., .85, d * .55 + .55 - r * r * .95 + uAmp * 1.6 + uPulse * .25 + uRipple * .12 * sin(r * 18. - uT * 5.)) * (1. - smoothstep(.6, 1., r));
      vec3 cc = pal(d * .45 + r * .3 + atan(q.z, q.x) / 6.283 + uT * .03) * (1. + uGlow * .35) * (1. + max(d, 0.) * .25);
      float a = clamp(dens * dt * 5.2, 0., 1.);
      acc.rgb += (1. - acc.a) * cc * a; acc.a += (1. - acc.a) * a; if (acc.a > .97) break; } }
  vec3 col = finish(acc.rgb / max(acc.a, 1e-3)) * (uDark > .5 ? 1. : .9); float a = acc.a * (uDark > .5 ? 1. : .94);
  float rr = length(uv), halo = exp(-rr * rr / (R * R) * 2.2) * smoothstep(.98, .6, rr) * (1. - a) * uGlow * (uDark > .5 ? .42 : .14);
  vec3 hc = finish(pal(atan(uv.y, uv.x) / 6.283 + uT * .04));
  o = clamp(vec4(col * a + hc * halo, a + halo), 0., 1.);
  o *= smoothstep(1., .9, max(abs(vUv.x), abs(vUv.y))); }`;

  // rings: thin glowing loops round the centre, wavering with the voice, turning in space when thinking
  const RINGS_FS = COMMON + `
in vec2 vUv; out vec4 o; uniform float uRings;
void main(){
  vec2 p = (vUv - uShake) / uScale; vec3 acc = vec3(0.); float al = 0.;
  for (int i = 0; i < 5; i++) { float fi = float(i); if (fi >= uRings) break;
    float tilt = .25 + uThink * (1.05 + .25 * sin(uR * .9 + fi * 1.7)), phi = fi * 1.1 + uR * (.35 + fi * .12) * (i % 2 == 0 ? 1. : -1.);
    vec2 q = rot(phi) * p; q.y /= max(.18, cos(tilt * (.6 + fi * .18)));
    float th = atan(q.y, q.x), R = .5 - fi * .028;
    float r = R * (1. + uAmp * .55 * sin(3. * th + uT * (.6 + fi * .2) + fi) + uAmp * .3 * sin(5. * th - uT * (.9 + fi * .15)) + uPulse * .1 * sin(9. * th + uT * 7. + fi * 2.) * (.5 + .5 * sin(uT * 3. + fi)));
    float d = abs(length(q) - r) * cos(tilt * (.6 + fi * .18) * .5);
    float lw = uPx * (uDetail > .5 ? 1.1 : 1.6) + .002, line = smoothstep(lw + uPx, lw * .3, d), glow = exp(-d * (uDark > .5 ? 38. : 60.)) * .35 * uGlow;
    vec3 c = pal(fi / uRings * .8 + sin(th) * .1 + cos(th * 2.) * .05 + uT * .03); float v = line + glow * (1. - line);
    acc += c * v; al += v; }
  float r0 = length(p);
  if (uRipple > .01) for (int k = 0; k < 3; k++) { float f = fract(uT * .32 + float(k) / 3.), rr = .62 + f * .28, v = uRipple * (1. - f) * .5 * smoothstep(uPx * 1.6, 0., abs(r0 - rr)); acc += pal(f) * v; al += v; }
  float core = exp(-r0 * r0 * 22.) * (.25 + uPulse * .5 + uThink * .2) * uGlow; acc += pal(uT * .05) * core; al += core * .8;
  vec3 col = finish(acc / max(al, 1e-4)) * (uDark > .5 ? 1. : .92); float a = clamp(al, 0., 1.);
  o = vec4(col * a, a);
  o *= smoothstep(1., .9, max(abs(vUv.x), abs(vUv.y))); }`;

  // swarm: thousands of points making a sphere that breathes; they come loose when thinking and pulse with the voice
  const SWARM_VS = `#version 300 es
precision highp float;
in vec3 aBase; in vec2 aSeed; out vec3 vCol; out float vA;
uniform vec2 uRes; uniform float uT, uR, uAmp, uFreq, uPulse, uScale, uSat, uGlow, uThink, uTint, uRipple, uSpread, uDark, uDetail, uPx, uDpr, uPt;
uniform vec2 uShake; uniform vec3 uC0, uC1, uC2, uC3;
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
  gl_Position = vec4((s + uShake) / asp, 0., 1.);
  float depth = clamp(z / .7 * .5 + .5, 0., 1.);
  gl_PointSize = uPt * uDpr * (.65 + depth * .7) * (1. + uPulse * .25) * (uDark > .5 ? 1. : .85);
  vCol = finish(pal(aSeed.x * .5 + b.y * .25 + uT * .03) * (.75 + .3 * uGlow) * (uDark > .5 ? 1. : .86));
  vA = uDark > .5 ? .35 + depth * .55 : .2 + depth * .5; }`;
  const SWARM_FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA; out vec4 o; uniform float uDark;
void main(){ vec2 c = gl_PointCoord * 2. - 1.; float d = dot(c, c); if (d > 1.) discard; float a = vA * (uDark > .5 ? exp(-d * 2.6) : smoothstep(1., .55, d)); o = vec4(vCol * a, a); }`;

  // ---------- small helpers ----------
  const hex = h => { h = String(h).trim().replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return Number.isFinite(n) ? [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255] : [.5, .5, .5]; };
  const easeBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  class AIBlob extends HTMLElement {
    static get observedAttributes() { return ['variant', 'state', 'theme', 'palette', 'colors', 'speed', 'level', 'label']; }
    constructor() { super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:inline-block;width:160px;aspect-ratio:1;position:relative;contain:strict;vertical-align:middle}:host([hidden]){display:none}
        canvas{position:absolute;inset:0;width:100%;height:100%;display:block}.fb{position:absolute;inset:18%;border-radius:50%;display:none}</style><canvas part="canvas"></canvas><div class="fb" part="fallback"></div>`;
      this._cv = root.querySelector('canvas'); this._fb = root.querySelector('.fb');
      this._p = { ...STATES.default }; this._t = 0; this._r = 0; this._lvl = 0; this._sim = { on: false, until: 0, ph: 0, rate: 5, gain: .8 };
      this._state = 'default'; this._back = 'default'; this._since = 0; this._shake = [0, 0]; this._visible = true; this._frame = this._frame.bind(this);
      this.setAttribute('role', 'img'); }
    connectedCallback() { this._setup(); this._io = new IntersectionObserver(es => { this._visible = es[0].isIntersecting; this._kick(); }); this._io.observe(this);
      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this); this._vis = () => this._kick(); document.addEventListener('visibilitychange', this._vis); this._aria(); this._kick(); }
    disconnectedCallback() { this._io?.disconnect(); this._ro?.disconnect(); document.removeEventListener('visibilitychange', this._vis); cancelAnimationFrame(this._raf); this._raf = 0; this.stopMicrophone(); }
    attributeChangedCallback(name, old, v) {
      if (name === 'state') { const s = STATES[v] ? v : 'default'; if (s !== this._state || old == null) this._go(s, false); }
      else if (name === 'variant') { if (this._gl) this._program(); }
      else if (name === 'palette' || name === 'colors') this._cols = null;
      this._aria(); }
    // (properties mirror the attributes)
    get variant() { const v = this.getAttribute('variant'); return VARIANTS.includes(v) ? v : 'glass'; } set variant(v) { this.setAttribute('variant', v); }
    get state() { return this._state; } set state(v) { this.setAttribute('state', v); }
    get theme() { return this.getAttribute('theme') === 'dark' ? 'dark' : 'light'; } set theme(v) { this.setAttribute('theme', v); }
    get palette() { return this.getAttribute('palette') || 'aurora'; } set palette(v) { this.setAttribute('palette', v); }
    get colors() { return this._colors(); } set colors(v) { this.setAttribute('colors', Array.isArray(v) ? v.join(' ') : v); }
    get speed() { const s = parseFloat(this.getAttribute('speed')); return Number.isFinite(s) ? Math.max(0, s) : 1; } set speed(v) { this.setAttribute('speed', v); }
    get level() { const l = parseFloat(this.getAttribute('level')); return Number.isFinite(l) ? Math.min(1, Math.max(0, l)) : null; } set level(v) { if (v == null) this.removeAttribute('level'); else this.setAttribute('level', v); }
    static get palettes() { return PALETTES; } static get states() { return Object.keys(STATES); } static get variants() { return VARIANTS; }
    _colors() { const c = (this.getAttribute('colors') || '').split(/[\s,]+/).filter(Boolean); if (c.length >= 2) { while (c.length < 4) c.push(c[c.length % 2]); return c.slice(0, 4); } return PALETTES[this.palette] || PALETTES.aurora; }
    _aria() { this.setAttribute('aria-label', `${this.getAttribute('label') || 'AI assistant'}: ${this._state}`); }

    // ---------- states: a change eases every value towards the new state; connecting and error are short scenes ----------
    _go(s, auto) { const prev = this._state; if (!TRANSIENT[prev]) this._back = prev; if (s === 'error' && TRANSIENT[prev]) this._back = 'default';
      this._state = s; this._since = 0; if (auto) this.setAttribute('state', s);
      if (s === 'connecting') { this._p.scale = 0; this._p.spread = 1.6; this._p.glow = 1.7; }
      this._aria(); if (prev !== s) this.dispatchEvent(new CustomEvent('statechange', { detail: { state: s, previous: prev, auto } })); this._kick(); }

    // ---------- microphone and outside audio ----------
    async useMicrophone() { const ctx = this._ac || (this._ac = new (window.AudioContext || window.webkitAudioContext)()); await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); this.stopMicrophone();
      const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an); this._mic = { stream, an }; this._an = an; this._buf = new Float32Array(an.fftSize); return true; }
    stopMicrophone() { if (this._mic) { this._mic.stream.getTracks().forEach(t => t.stop()); if (this._an === this._mic.an) this._an = null; this._mic = null; } }
    useAnalyser(an) { this._an = an; this._buf = an ? new Float32Array(an.fftSize) : null; }

    // ---------- WebGL ----------
    _setup() { if (this._gl || this._noGL) return; const gl = this._cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) { this._noGL = true; const c = this._colors(); this._fb.style.display = 'block'; this._fb.style.background = `radial-gradient(circle at 35% 30%, ${c[3]}, ${c[0]} 45%, ${c[1]})`; return; }
      this._gl = gl; this._cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this._gl = null; this._prog = null; });
      this._cv.addEventListener('webglcontextrestored', () => { this._setup(); this._kick(); });
      this._quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this._quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this._progs = {}; this._program(); this._resize(); }
    _compile(vs, fs) { const gl = this._gl, mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); } return { p, u }; }
    _program() { const gl = this._gl; if (!gl) return; const v = this.variant;
      if (!this._progs[v]) { try { this._progs[v] = v === 'swarm' ? this._compile(SWARM_VS, SWARM_FS) : this._compile(QUAD_VS, v === 'cloud' ? CLOUD_FS : v === 'rings' ? RINGS_FS : v === 'nebula' ? NEBULA_FS : GLASS_FS); } catch (e) { console.error('ai-blob shader', e); return; } }
      this._prog = this._progs[v]; this._points(); }
    // (the swarm's points: a Fibonacci sphere, fewer and larger on small orbs)
    _points() { const gl = this._gl; if (this.variant !== 'swarm' || !gl) return; const n = this._detail > .5 ? 2600 : this._detail > .15 ? 1200 : 420; if (this._pts?.n === n) return;
      const base = new Float32Array(n * 3), seed = new Float32Array(n * 2), ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), a = i * ga; base.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); seed.set([Math.random(), Math.random()], i * 2); }
      const b1 = this._pts?.b1 || gl.createBuffer(), b2 = this._pts?.b2 || gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, base, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW); this._pts = { n, b1, b2 }; }
    _resize() { const w = this.clientWidth || 160, h = this.clientHeight || w, css = Math.min(w, h); this._css = css;
      this._detail = Math.min(1, Math.max(0, (css - 40) / 160));
      const dpr = Math.min(window.devicePixelRatio || 1, css > 320 ? 1.5 : 2); this._dpr = dpr; this._cv.width = Math.round(w * dpr); this._cv.height = Math.round(h * dpr); this._points(); this._kick(); }
    _kick() { if (!this._raf && this.isConnected && this._visible && !document.hidden) { this._last = 0; this._raf = requestAnimationFrame(this._frame); } }

    // ---------- the built-in voice: syllables in phrases with pauses, for listening (you) and speaking (the AI) ----------
    _voice(dt) { const s = this._sim, now = this._t;
      if (now > s.until) { s.on = !s.on; s.until = now + (s.on ? 1.3 + Math.random() * 2.4 : .25 + Math.random() * .6); s.rate = 4 + Math.random() * 2.5; s.gain = .6 + Math.random() * .4; }
      if (!s.on) return 0; s.ph += dt * s.rate * Math.PI * 2; const syl = Math.pow(Math.abs(Math.sin(s.ph * .5)), 1.4), wob = .7 + .3 * Math.sin(now * 13.7) * Math.sin(now * 7.3);
      return Math.min(1, s.gain * (.25 + .75 * syl) * wob); }

    _frame(ms) { this._raf = 0; if (!this._visible || document.hidden || !this.isConnected) return; this._raf = requestAnimationFrame(this._frame);
      const dt = this._last ? Math.min(.05, (ms - this._last) / 1000) : .016; this._last = ms; const slow = reduced.matches ? .35 : 1, sp = this.speed * slow;
      this._since += dt;
      // (scenes that end by themselves)
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
      this._t += dt * sp * (.55 + this._p.amp * 2.5 + this._p.think * .4); this._r += dt * sp * this._p.spin;
      // (the error shake: a quick decaying jolt)
      const e = this._state === 'error' && !reduced.matches ? this._since : 9; this._shake[0] = e < .55 ? .035 * Math.exp(-e * 6) * Math.sin(e * 55) : 0;
      this._draw(); }

    _draw() { const gl = this._gl, P = this._prog; if (!gl || !P) return; const p = this._p, u = P.u, dark = this.theme === 'dark';
      if (!this._cols) this._cols = this._colors().map(hex);
      gl.viewport(0, 0, this._cv.width, this._cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(P.p);
      const f1 = (n, v) => u[n] && gl.uniform1f(u[n], v);
      if (u.uRes) gl.uniform2f(u.uRes, this._cv.width, this._cv.height);
      f1('uT', this._t); f1('uR', this._r); f1('uAmp', p.amp); f1('uFreq', p.freq); f1('uPulse', this._lvl * p.voice); f1('uScale', Math.max(.001, p.scale)); f1('uSat', p.sat); f1('uGlow', p.glow);
      f1('uThink', p.think); f1('uTint', p.tint); f1('uRipple', p.ripple); f1('uSpread', p.spread); f1('uDark', dark ? 1 : 0); f1('uDetail', this._detail); f1('uDpr', this._dpr);
      f1('uPx', 2 / Math.min(this._cv.width, this._cv.height)); f1('uRings', this._detail > .5 ? 4 : 3); f1('uPt', this._detail > .5 ? 2.6 : this._detail > .15 ? 3.2 : 3.6);
      if (u.uShake) gl.uniform2f(u.uShake, this._shake[0], this._shake[1]);
      this._cols.forEach((c, i) => u['uC' + i] && gl.uniform3f(u['uC' + i], c[0], c[1], c[2]));
      gl.enable(gl.BLEND);
      if (this.variant === 'swarm') { gl.blendFunc(gl.ONE, dark ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); const pt = this._pts; if (!pt) return;
        const a1 = gl.getAttribLocation(P.p, 'aBase'), a2 = gl.getAttribLocation(P.p, 'aSeed');
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.b1); gl.enableVertexAttribArray(a1); gl.vertexAttribPointer(a1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.b2); gl.enableVertexAttribArray(a2); gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, pt.n); gl.disableVertexAttribArray(a1); gl.disableVertexAttribArray(a2); }
      else { gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); const a = gl.getAttribLocation(P.p, 'aP'); gl.bindBuffer(gl.ARRAY_BUFFER, this._quad); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(a); } }
  }
  customElements.define('ai-blob', AIBlob);
})();
