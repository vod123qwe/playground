/* <ai-pill>: an "Ask AI" button: a small living orb (an <ai-blob>, Glass Soft), a label and a chevron.

   <script src="ai-blob.js"></script>   (loaded by itself from the same folder when missing)
   <script src="ai-pill.js"></script>
   <ai-pill label="Ask AI" palette="aurora"></ai-pill>

   Attributes
     label            the text (default "Ask AI")
     state            idle | thinking: thinking turns the orb busy, swaps the label for thinking-label and the chevron for dots
     thinking-label   the text while thinking (default "Thinking")
     size             s | m | l (40, 48 or 56 px high; default m)
     theme            light | dark (default light)
     palette, colors  the orb's colours, as on <ai-blob>
     orb              any <ai-blob> variant (default soft)
   Events
     ask              on click (bubbles out of the shadow); the page sets state="thinking" while the answer comes
   Behaviour: the orb drifts slowly; on hover or focus it wakes (listening) and the chevron steps right; a press sinks the pill a
   touch; a click sends a wave of the orb's colours out through the pill. Reduced motion: no wave, the orb calms itself. */
(() => {
  if (customElements.get('ai-pill')) return;
  const here = document.currentScript && document.currentScript.src;
  if (!customElements.get('ai-blob') && here && !document.querySelector('script[src*="ai-blob.js"]')) { const s = document.createElement('script'); s.src = new URL('ai-blob.js', here).href; document.head.appendChild(s); }
  const SIZES = { s: [40, 26, 14], m: [48, 32, 15], l: [56, 38, 16] };   // (height, orb, font size)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const CSS = `
    :host { display: inline-block; vertical-align: middle; --h: 48px; --o: 32px; --fs: 15px; --bg: #fff; --ink: #1b1c20; --muted: rgba(20,20,20,.42); --line: rgba(20,20,20,.06);
      font-family: var(--ai-pill-font, var(--lab-font, ui-sans-serif, system-ui, sans-serif)); -webkit-tap-highlight-color: transparent; }
    :host([theme=dark]) { --bg: #1d1d21; --ink: #f2f2f0; --muted: rgba(255,255,255,.48); --line: rgba(255,255,255,.08); }
    button { position: relative; display: flex; align-items: center; gap: calc(var(--h) * .24); height: var(--h); margin: 0; padding: 0 calc(var(--h) * .34) 0 calc((var(--h) - var(--o)) / 2);
      border: 0; border-radius: 999px; background: var(--bg); color: var(--ink); font: 600 var(--fs) / 1 inherit; letter-spacing: -.01em; cursor: pointer;
      box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgba(0,0,0,.05), 0 8px 22px -12px rgba(0,0,0,.22); transition: scale .45s cubic-bezier(.3,1.5,.5,1), box-shadow .35s; }
    button:hover { box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgba(0,0,0,.05), 0 12px 28px -12px rgba(0,0,0,.28); }
    button:active { scale: .97; transition-duration: .12s; }
    button:focus-visible { outline: 2px solid color-mix(in srgb, var(--ink) 35%, transparent); outline-offset: 3px; }
    .clip { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
    .wave { position: absolute; left: calc((var(--h) - var(--o)) / 2); top: 50%; width: var(--o); height: var(--o); margin-top: calc(var(--o) / -2); border-radius: 50%; opacity: 0; filter: blur(1.5px); }
    .orb { position: relative; flex: none; width: var(--o); height: var(--o); }
    .orb ai-blob { position: absolute; left: 50%; top: 50%; width: calc(var(--o) * 1.8); height: calc(var(--o) * 1.8); translate: -50% -50%; pointer-events: none; }
    .txt { display: grid; text-align: left; transition: width .5s cubic-bezier(.3,1.25,.45,1); } .txt span { grid-area: 1 / 1; justify-self: start; white-space: nowrap; transition: opacity .25s, translate .5s cubic-bezier(.3,1.3,.5,1); }
    .txt .b { opacity: 0; translate: 0 7px; }
    :host([state=thinking]) .txt .a { opacity: 0; translate: 0 -7px; } :host([state=thinking]) .txt .b { opacity: 1; translate: 0 0; }
    .end { position: relative; display: grid; place-items: center; width: 18px; height: 18px; margin-left: -2px; color: var(--muted); transition: color .2s; }
    .end svg { width: 18px; height: 18px; transition: translate .45s cubic-bezier(.3,1.5,.5,1), opacity .2s, scale .3s; }
    button:hover .end, button:focus-visible .end { color: var(--ink); } button:hover .end svg, button:focus-visible .end svg { translate: 2px 0; }
    .dots { position: absolute; display: flex; gap: 3px; opacity: 0; transition: opacity .2s; } .dots i { width: 3.5px; height: 3.5px; border-radius: 50%; background: currentColor; }
    :host([state=thinking]) .end svg { opacity: 0; scale: .6; } :host([state=thinking]) .dots { opacity: 1; }
    :host([state=thinking]) .dots i { animation: dot 1.1s ease-in-out infinite; } .dots i:nth-child(2) { animation-delay: .15s !important; } .dots i:nth-child(3) { animation-delay: .3s !important; }
    @keyframes dot { 0%, 70%, 100% { opacity: .3; translate: 0 0; } 35% { opacity: 1; translate: 0 -2px; } }
    @media (prefers-reduced-motion: reduce) { :host([state=thinking]) .dots i { animation: none; opacity: .7; } }`;
  const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>';
  class AiPill extends HTMLElement {
    static get observedAttributes() { return ['label', 'thinking-label', 'state', 'size', 'theme', 'palette', 'colors', 'orb']; }
    constructor() { super(); const r = this.attachShadow({ mode: 'open' });
      // (the orb: Glass Soft, its light tuned for a small size; it never takes the pointer, the button does)
      r.innerHTML = `<style>${CSS}</style><button part="button" type="button"><span class="clip"><span class="wave"></span></span>
        <span class="orb"><ai-blob variant="soft" interactive="false" intro="false" speed="1.25" glow="1.2" halo="1" rim="1.3" core="1.4" glints="1.3" wobble=".6" color-speed="1.7"></ai-blob></span>
        <span class="txt"><span class="a"></span><span class="b" aria-hidden="true"></span></span><span class="end">${CHEVRON}<span class="dots"><i></i><i></i><i></i></span></span></button>`;
      this._btn = r.querySelector('button'); this._blob = r.querySelector('ai-blob'); this._wave = r.querySelector('.wave'); this._hot = false;
      const wake = on => { this._hot = on; this._sync(); };
      this._btn.addEventListener('pointerenter', () => wake(true)); this._btn.addEventListener('pointerleave', () => wake(false));
      this._btn.addEventListener('focus', () => wake(this._btn.matches(':focus-visible'))); this._btn.addEventListener('blur', () => wake(false));
      this._btn.addEventListener('click', () => { this._blob.tap?.(); this._sendWave(); this.dispatchEvent(new CustomEvent('ask', { bubbles: true, composed: true })); }); }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this._btn) this._render(); }
    get state() { return this.getAttribute('state') || 'idle'; } set state(v) { if (v && v !== 'idle') this.setAttribute('state', v); else this.removeAttribute('state'); }
    _render() { const [h, o, fs] = SIZES[this.getAttribute('size')] || SIZES.m; this.style.setProperty('--h', h + 'px'); this.style.setProperty('--o', o + 'px'); this.style.setProperty('--fs', fs + 'px');
      const label = this.getAttribute('label') || 'Ask AI', busy = this.state === 'thinking';
      this.shadowRoot.querySelector('.a').textContent = label; this.shadowRoot.querySelector('.b').textContent = this.getAttribute('thinking-label') || 'Thinking';
      this._btn.setAttribute('aria-label', busy ? (this.getAttribute('thinking-label') || 'Thinking') : label); this._btn.setAttribute('aria-busy', String(busy));
      const b = this._blob; b.setAttribute('variant', this.getAttribute('orb') || 'soft'); b.setAttribute('theme', this.getAttribute('theme') === 'dark' ? 'dark' : 'light');
      if (this.hasAttribute('colors')) b.setAttribute('colors', this.getAttribute('colors')); else { b.removeAttribute('colors'); b.setAttribute('palette', this.getAttribute('palette') || 'aurora'); }
      // (the pill keeps the width of what it says: it grows to Thinking and back, softly)
      const t = this.shadowRoot.querySelector(busy ? '.b' : '.a'); requestAnimationFrame(() => { this.shadowRoot.querySelector('.txt').style.width = Math.ceil(t.getBoundingClientRect().width) + 'px'; });
      this._sync(); }
    // (the orb's state: busy while thinking, awake under the pointer or the keyboard's focus, drifting otherwise)
    _sync() { this._blob.setAttribute('state', this.state === 'thinking' ? 'thinking' : this._hot ? 'listening' : 'default'); }
    _colors() { const c = (this.getAttribute('colors') || '').split(/[\s,]+/).filter(Boolean); if (c.length >= 2) return c; const B = customElements.get('ai-blob'); return (B && B.palettes[this.getAttribute('palette') || 'aurora']) || ['#7b5cff', '#2ec5ff', '#ff6fd8', '#ffd38a']; }
    // (a ring of the orb's colours runs out from the orb across the pill and fades)
    _sendWave() { if (reduced.matches || !this._wave.animate) return; const c = this._colors(), w = this._btn.offsetWidth, o = parseFloat(this.style.getPropertyValue('--o')) || 32;
      this._wave.style.background = `radial-gradient(circle, transparent 50%, ${c[0]}aa 60%, ${c[1] || c[0]}88 66%, ${c[2] || c[0]}44 71%, transparent 77%)`;
      this._wave.animate([{ transform: 'scale(.5)', opacity: .9 }, { transform: `scale(${(w * 2.2 / o).toFixed(2)})`, opacity: 0 }], { duration: 950, easing: 'cubic-bezier(.2,.7,.25,1)' }); }
  }
  customElements.define('ai-pill', AiPill);
})();
