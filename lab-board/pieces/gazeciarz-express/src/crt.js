// The old television (desktop, a big enough window): the whole game a little smaller, in a TV's body, behind a rounded screen with its
// scanlines, a phosphor shadow mask, the dark corners and the glass's shine; under the screen the set's name and its power light.
// While the game loads: a video tape playing (snow, KASETA // ODTWARZANIE, the counter running), as on the old sets; loaded: the set
// switched on (a white line opening to the picture). On when the window is at least 1280 x 720 and the pointer fine (not a phone);
// ?crt=0 off, ?crt=1 on whatever the size; the menu's KINESKOP switch kept in the browser (gzx.crt). For now off unless asked for (AUTO:
// the size rule, once it is decided). createCRT() → { on, map(x, y), toggle() }
export function createCRT({ minW = 1280, minH = 720, scale = .9 } = {}) {
  const q = new URLSearchParams(location.search), force = q.get('crt'), fine = !matchMedia('(pointer: coarse)').matches;
  const AUTO = false, stored = () => { try { return localStorage.getItem('gzx.crt'); } catch { return null; } };
  const wants = () => force === '1' || (force !== '0' && (stored() === '1' || (AUTO && stored() !== '0' && fine && innerWidth >= minW && innerHeight >= minH)));
  const css = document.createElement('style'); css.textContent = `
    html.crt { background: radial-gradient(120% 120% at 50% 30%, #2a2b30 0%, #16171a 70%, #0c0d0f 100%); }
    html.crt body { transform: scale(${scale}); transform-origin: 50% 46%; background: #000; }
    #crt { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; display: none; }
    html.crt #crt { display: block; }
    #crt .scr { position: absolute; left: ${(1 - scale) / 2 * 100}%; right: ${(1 - scale) / 2 * 100}%; top: ${(1 - scale) * .46 * 100}%; bottom: ${(1 - scale) * .54 * 100}%;
      border-radius: 3.2% / 4.6%; overflow: hidden;
      box-shadow: 0 0 0 3px #0a0b0d, 0 0 0 9px #2c2e33, 0 0 0 10px #3b3d43, 0 0 0 200vmax #1b1c20, inset 0 0 0 2px rgba(255,255,255,.05), inset 0 0 120px 30px rgba(0,0,0,.55), inset 0 0 22px 6px rgba(0,0,0,.6); }
    #crt .lines { position: absolute; inset: 0; background: repeating-linear-gradient(180deg, rgba(0,0,0,.22) 0 1px, rgba(0,0,0,0) 1px 3px); mix-blend-mode: multiply; animation: crtRoll 7s linear infinite; }
    #crt .mask { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(255,40,40,.045) 0 1px, rgba(40,255,90,.035) 1px 2px, rgba(60,90,255,.045) 2px 3px); mix-blend-mode: screen; }
    #crt .glass { position: absolute; inset: 0; background: radial-gradient(70% 55% at 30% 18%, rgba(255,255,255,.09), rgba(255,255,255,0) 60%), radial-gradient(130% 120% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,.45) 100%); }
    #crt .flick { position: absolute; inset: 0; background: rgba(255,255,255,.012); animation: crtFlick .12s steps(2) infinite; }
    #crt .snow { position: absolute; inset: 0; opacity: 0; transition: opacity .5s; image-rendering: pixelated; width: 100%; height: 100%; }
    #crt .osd { position: absolute; left: 4%; top: 7%; display: flex; flex-direction: column; gap: 8px; opacity: 0; transition: opacity .6s; font: 22px/1 PTPix, monospace; color: #ebe6d5;
      text-shadow: -2px 0 0 #2c2b27, 2px 0 0 #2c2b27, 0 -2px 0 #2c2b27, 0 2px 0 #2c2b27; }
    #crt .power { position: absolute; left: 0; right: 0; top: 50%; height: 100%; margin-top: -50%; background: #f4f6f8; transform: scaleY(0); opacity: 0; }
    #crt .power.go { animation: crtOn .75s cubic-bezier(.2,.7,.2,1) forwards; }
    #crt .badge { position: absolute; left: 50%; bottom: ${(1 - scale) * .54 * 100 * .32}%; transform: translateX(-50%); font: 14px/1 PTPix, monospace; letter-spacing: 4px; color: #8a8c92; text-shadow: 0 1px 0 #000; }
    #crt .led { position: absolute; right: 7%; bottom: ${(1 - scale) * .54 * 100 * .36}%; width: 8px; height: 8px; border-radius: 50%; background: #4bd16b; box-shadow: 0 0 8px #4bd16b; }
    html.crt body:not(.booted) ~ #crt .snow { opacity: .3; } html.crt body:not(.booted) ~ #crt .osd { opacity: 1; } html.crt body:not(.booted) ~ #crt .led { background: #e3a13a; box-shadow: 0 0 8px #e3a13a; }
    @keyframes crtRoll { from { background-position: 0 0; } to { background-position: 0 300px; } }
    @keyframes crtFlick { 50% { background: rgba(255,255,255,0); } }
    @keyframes crtOn { 0% { transform: scale(0, .004); opacity: 1; } 35% { transform: scale(1, .004); opacity: 1; } 65% { transform: scale(1, 1); opacity: .9; } 100% { transform: scale(1, 1); opacity: 0; } }
  `; document.head.appendChild(css);
  // (over the body, not in it: the body is what the TV makes smaller)
  const root = document.createElement('div'); root.id = 'crt'; root.innerHTML = `<div class="scr"><canvas class="snow" width="160" height="100"></canvas><div class="lines"></div><div class="mask"></div><div class="flick"></div><div class="glass"></div>
    <div class="osd"><span>KASETA //</span><span>ODTWARZANIE</span><span class="t">▶ 00:00:00</span></div><div class="power"></div></div><div class="badge">GAZECIARZ · 8-BIT</div><div class="led"></div>`;
  document.documentElement.appendChild(root);
  const snow = root.querySelector('.snow'), sg = snow.getContext('2d'), img = sg.createImageData(160, 100), tEl = root.querySelector('.t'), power = root.querySelector('.power'), t0 = performance.now();
  let booted = false;
  (function tick() { if (!document.body.classList.contains('booted')) {
      for (let k = 0; k < img.data.length; k += 4) { const v = Math.random() * 255 | 0; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255; } sg.putImageData(img, 0, 0);
      const s = Math.floor((performance.now() - t0) / 1000); tEl.textContent = `▶ 00:00:${String(s % 60).padStart(2, '0')}`; requestAnimationFrame(tick); }
    else if (!booted) { booted = true; if (document.documentElement.classList.contains('crt')) { power.classList.add('go'); } } })();
  // (the window changed: on or off by its size)
  const apply = () => document.documentElement.classList.toggle('crt', wants()); apply(); addEventListener('resize', apply);
  const api = { get on() { return document.documentElement.classList.contains('crt'); }, toggle() { const v = !api.on; try { localStorage.setItem('gzx.crt', v ? '1' : '0'); } catch { } apply(); if (v) { power.classList.remove('go'); void power.offsetWidth; power.classList.add('go'); } return v; },
    map(x, y) { if (!api.on) return [x, y]; const ox = innerWidth * (1 - scale) / 2, oy = innerHeight * (1 - scale) * .46; return [(x - ox) / scale, (y - oy) / scale]; } };
  window.CRT = api; return api;
}
