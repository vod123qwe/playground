// The sound, all made here (Web Audio: oscillators, noise, filters; nothing loaded). Effects (a throw, a landing, a mailbox, glass,
// coins, a bell, a crash, a kick, a punch, a dog, a horn, a siren, clicks), the wind of the ride, voices (no words: a burble of
// syllables in each one's own voice, the man on the bench a slurred mumble, as in cartoons) and the music (a warm morning loop, a
// chase, a quiet one for the title), played by a little sequencer a beat ahead. Starts on the first touch or key (browsers want that).
// createAudio() → { play(name, o), say(text, kind, o), ride(speed, rough), siren(on, o), music(name), set(key, v), get(key), names, voices }
// o: { vol (0..1), pan (-1..1) } (for a sound out in the world: from where it is)
export function createAudio() {
  const KEY = 'pt.audio';
  let S = { master: .8, music: .5, sfx: .8, voice: .7, mute: false }; try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
  let ctx = null, out, bus = {}, noise = null, wind = null, sir = null, song = null, songName = null, wantSong = null;
  const now = () => ctx.currentTime;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    out = ctx.createGain(); out.gain.value = S.mute ? 0 : S.master; out.connect(comp);
    for (const k of ['music', 'sfx', 'voice']) { bus[k] = ctx.createGain(); bus[k].gain.value = S[k]; bus[k].connect(out); }
    const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noise = n;
    if (wantSong) { const w = wantSong; wantSong = null; music(w); }
  }
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, init, { capture: true, passive: true });
  function set(k, v) { S[k] = v; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } if (!ctx) return; if (k === 'master' || k === 'mute') { out.gain.value = S.mute ? 0 : S.master; } else if (bus[k]) bus[k].gain.value = v; }
  // ---------- building blocks ----------
  const panner = (p, dest) => { if (!ctx.createStereoPanner) return dest; const s = ctx.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p || 0)); s.connect(dest); return s; };
  function env(g, t, a, peak, d, end = .0001) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); }
  function tone(dest, f, t, dur, { type = 'sine', vol = .3, to = null, a = .005, detune = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur); o.detune.value = detune;
    env(g, t, a, vol, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + .05); return o; }
  function hiss(dest, t, dur, { type = 'bandpass', f = 1000, to = null, q = 1, vol = .3, a = .004 } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; s.playbackRate.value = .8 + Math.random() * .4;
    fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q; env(g, t, a, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + a + dur + .05); }
  // ---------- the effects ----------
  const R = (a, b) => a + Math.random() * (b - a);
  const FX = {
    throw: (d, t) => { hiss(d, t, .2, { f: 700, to: 2600, q: 1.2, vol: .22 }); tone(d, R(280, 340), t, .08, { type: 'triangle', vol: .05, to: 420 }); },
    land: (d, t) => { hiss(d, t, .07, { type: 'lowpass', f: 900, vol: .3 }); tone(d, 140, t, .09, { vol: .25, to: 70 }); },
    porch: (d, t) => { tone(d, 190, t, .12, { type: 'triangle', vol: .35, to: 90 }); hiss(d, t, .05, { type: 'lowpass', f: 1500, vol: .25 }); tone(d, 310, t + .07, .06, { type: 'triangle', vol: .12, to: 180 }); },
    mailbox: (d, t) => { tone(d, 880, t, .3, { type: 'square', vol: .06 }); tone(d, 1318, t, .22, { type: 'square', vol: .04, detune: 12 }); tone(d, 2210, t, .12, { vol: .05 }); hiss(d, t, .03, { type: 'highpass', f: 3000, vol: .2 }); },
    glass: (d, t) => { hiss(d, t, .45, { type: 'highpass', f: 2500, vol: .45 }); hiss(d, t, .12, { type: 'bandpass', f: 1200, vol: .3 }); for (let k = 0; k < 7; k++) tone(d, R(2400, 5200), t + R(.02, .4), R(.05, .14), { vol: R(.03, .07) }); },
    coin: (d, t) => { tone(d, 988, t, .06, { type: 'square', vol: .05 }); tone(d, 1319, t + .065, .16, { type: 'square', vol: .05 }); },
    bell: (d, t) => { for (const dt of [0, .17]) { const o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(); o.frequency.value = 1180; m.frequency.value = 3290; mg.gain.setValueAtTime(900, t + dt); mg.gain.exponentialRampToValueAtTime(20, t + dt + .6);
        m.connect(mg); mg.connect(o.frequency); env(g, t + dt, .002, .22, .7); o.connect(g); g.connect(d); o.start(t + dt); m.start(t + dt); o.stop(t + dt + .8); m.stop(t + dt + .8); } },
    crash: (d, t) => { hiss(d, t, .45, { type: 'lowpass', f: 1100, to: 300, vol: .5 }); tone(d, 85, t, .35, { vol: .45, to: 38 }); tone(d, 640, t + .05, .25, { type: 'square', vol: .04, to: 520 }); hiss(d, t + .12, .25, { type: 'bandpass', f: 2600, vol: .12 }); },
    kick: (d, t) => { tone(d, 120, t, .16, { vol: .55, to: 45 }); hiss(d, t, .06, { type: 'lowpass', f: 1800, vol: .3 }); },
    punch: (d, t) => { tone(d, 170, t, .1, { vol: .4, to: 70 }); hiss(d, t, .07, { f: 1400, q: .8, vol: .35 }); },
    bark: (d, t) => { for (const dt of [0, .2]) { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(R(420, 480), t + dt); o.frequency.exponentialRampToValueAtTime(R(230, 270), t + dt + .11);
        f.type = 'bandpass'; f.frequency.value = 950; f.Q.value = 2; env(g, t + dt, .01, .35, .11); o.connect(f); f.connect(g); g.connect(d); o.start(t + dt); o.stop(t + dt + .16); hiss(d, t + dt, .06, { f: 1500, vol: .1 }); } },
    horn: (d, t) => { for (const f of [330, 415]) tone(d, f, t, .4, { type: 'square', vol: .045, a: .02 }); },
    ui: (d, t) => { tone(d, 1400, t, .03, { type: 'square', vol: .03 }); },
    pick: (d, t) => { tone(d, 660, t, .06, { type: 'triangle', vol: .12 }); tone(d, 990, t + .06, .1, { type: 'triangle', vol: .12 }); },
    chime: (d, t) => { [660, 880, 1100, 1320].forEach((f, k) => tone(d, f, t + k * .07, .25, { type: 'triangle', vol: .1 })); },
    trick: (d, t) => { hiss(d, t, .25, { f: 500, to: 3000, vol: .18 }); [784, 988, 1175].forEach((f, k) => tone(d, f, t + .1 + k * .06, .2, { type: 'square', vol: .035 })); },
    hurt: (d, t) => { tone(d, 320, t, .2, { type: 'sawtooth', vol: .07, to: 140 }); },
    rustle: (d, t) => { hiss(d, t, .18, { type: 'highpass', f: 2000, vol: .12 }); hiss(d, t + .08, .12, { type: 'highpass', f: 3000, vol: .08 }); },
    whistle: (d, t) => { tone(d, 1800, t, .12, { vol: .08, to: 2400 }); tone(d, 2400, t + .14, .25, { vol: .08, to: 1500 }); },
  };
  function play(name, o = {}) { if (!ctx || !FX[name] || (o.vol ?? 1) < .02) return; const g = ctx.createGain(); g.gain.value = o.vol ?? 1; g.connect(panner(o.pan, bus.sfx)); FX[name](g, now() + .005); }
  // ---------- voices: no words, a burble ----------
  // base pitch (Hz), how far it wanders, syllables a second, the wave, the formant's colour, a slur (the man on the bench), a wobble
  const VOICES = {
    player: { f: 210, w: .25, rate: 11, wave: 'square', cut: 2200 }, granma: { f: 300, w: .35, rate: 8, wave: 'triangle', cut: 2600, wob: 6 }, grandpa: { f: 150, w: .25, rate: 7, wave: 'square', cut: 1500, wob: 5 },
    belly: { f: 118, w: .3, rate: 9, wave: 'sawtooth', cut: 1200 }, lump: { f: 92, w: .45, rate: 5, wave: 'sawtooth', cut: 700, slur: 1 }, lads: { f: 140, w: .35, rate: 12, wave: 'sawtooth', cut: 1700 },
    police: { f: 128, w: .15, rate: 10, wave: 'square', cut: 1400 }, janusz: { f: 108, w: .4, rate: 9.5, wave: 'sawtooth', cut: 1350, bounce: 1 }, lady: { f: 255, w: .3, rate: 10, wave: 'triangle', cut: 2800 },
    kid: { f: 390, w: .3, rate: 13, wave: 'square', cut: 3200 }, gang: { f: 155, w: .3, rate: 13, wave: 'sawtooth', cut: 1900 }, shout: { f: 240, w: .4, rate: 12, wave: 'square', cut: 2400 }, voice: { f: 175, w: .3, rate: 10, wave: 'square', cut: 2000 } };
  const busyUntil = {};
  function say(text, kind = 'voice', o = {}) {
    if (!ctx || !text) return; const V = VOICES[kind] || VOICES.voice, t0 = now() + .01; if ((busyUntil[o.id || kind] || 0) > t0) return;
    const letters = (text.match(/\p{L}/gu) || []).length, angry = /[@#$%&*]/.test(text) || /!{2,}/.test(text), n = Math.max(2, Math.min(angry ? 10 : 18, Math.round((letters || 6) / 2.4)));
    const g = ctx.createGain(); g.gain.value = (o.vol ?? 1) * (angry ? 1.2 : 1); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = V.cut; lp.connect(g); g.connect(panner(o.pan, bus.voice));
    let t = t0, pitch = V.f * (angry ? 1.25 : 1) * R(.95, 1.05);
    const q = text.trim().endsWith('?'), ex = text.trim().endsWith('!');
    for (let k = 0; k < n; k++) {
      const last = k === n - 1, dur = (V.slur ? R(.09, .2) : R(.05, .085)) * (last ? 1.6 : 1), gap = V.slur ? R(.04, .16) : R(.015, .05);
      if (V.slur) pitch *= R(.9, 1.08); else if (V.bounce) pitch = V.f * (k % 2 ? 1.18 : .92) * R(.97, 1.03); else pitch = V.f * (1 + R(-V.w, V.w)) * (angry ? 1.25 : 1);
      let f = pitch * (last && q ? 1.35 : last && ex ? 1.18 : 1);
      const osc = ctx.createOscillator(), fm = ctx.createBiquadFilter(), sg = ctx.createGain(); osc.type = V.wave; osc.frequency.setValueAtTime(f, t); osc.frequency.linearRampToValueAtTime(f * (last && q ? 1.25 : V.slur ? R(.8, 1) : R(.92, 1.06)), t + dur);
      if (V.wob) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = V.wob; lg.gain.value = f * .03; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
      fm.type = 'bandpass'; fm.frequency.value = [650, 950, 1250, 1800, 2400][Math.random() * 5 | 0] * (V.f > 250 ? 1.25 : 1); fm.Q.value = V.slur ? .7 : 1.4;
      sg.gain.setValueAtTime(.0001, t); sg.gain.exponentialRampToValueAtTime(V.slur ? .22 : .28, t + .012); sg.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(fm); fm.connect(sg); sg.connect(lp); osc.start(t); osc.stop(t + dur + .03);
      if (V.slur && Math.random() < .12) { tone(lp, R(500, 700), t + dur, .05, { type: 'square', vol: .08, to: 300 }); t += .1; }   // (hic)
      t += dur + gap; if (/[,.]/.test(text) && Math.random() < .15) t += .12;
    }
    busyUntil[o.id || kind] = t;
  }
  // ---------- the ride: wind and tyres by speed; rougher on grass ----------
  function ride(speed, rough = 0) {
    if (!ctx) return; if (!wind) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; s.loop = true; f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(bus.sfx); s.start(); wind = { f, g }; }
    const k = Math.min(1, Math.max(0, speed) / 11), t = now(); wind.g.gain.setTargetAtTime(k * k * .16 + rough * k * .08, t, .2); wind.f.frequency.setTargetAtTime(250 + k * 1300 + rough * 900, t, .2);
  }
  // ---------- the siren: a wail (on while a patrol is after you), louder the nearer ----------
  function siren(on, o = {}) {
    if (!ctx) return; if (on && !sir) { const a = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), f = ctx.createBiquadFilter(); a.type = 'square'; a.frequency.value = 780; l.frequency.value = .7; lg.gain.value = 170;
        l.connect(lg); lg.connect(a.frequency); f.type = 'lowpass'; f.frequency.value = 2200; g.gain.value = 0; a.connect(f); f.connect(g); g.connect(bus.sfx); a.start(); l.start(); sir = { a, l, g }; }
    if (!sir) return; sir.g.gain.setTargetAtTime(on ? .045 * (o.vol ?? 1) : 0, now(), .3); if (!on) { const s = sir; sir = null; setTimeout(() => { try { s.a.stop(); s.l.stop(); } catch { } }, 1500); }
  }
  // ---------- the music: a little sequencer, a beat ahead ----------
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = {
    // a warm morning: G, D, Em, C; a bass, a soft pulse of chords, a light tune; drums brushed
    poranek: { bpm: 98, bars: [[55, 59, 62], [50, 54, 57], [52, 55, 59], [48, 52, 55]], tune: [67, 0, 71, 74, 72, 71, 69, 0, 66, 0, 69, 71, 69, 67, 66, 0, 64, 0, 67, 71, 69, 67, 64, 0, 60, 64, 67, 0, 69, 67, 64, 62], drums: 1, lead: 'triangle' },
    // a chase: Am, F, G, E; quicker, the bass running, a tune in short notes, the drums busy
    poscig: { bpm: 142, bars: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]], tune: [69, 72, 76, 72, 69, 0, 76, 74, 72, 69, 72, 0, 71, 74, 71, 67, 71, 0, 74, 72, 71, 68, 71, 0, 76, 0, 75, 0, 76, 71, 68, 64], drums: 2, lead: 'square' },
    // the title: the morning, slower, no drums
    tytul: { bpm: 80, bars: [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], tune: [74, 0, 0, 71, 0, 0, 72, 71, 69, 0, 0, 0, 67, 0, 0, 0, 71, 0, 0, 67, 0, 0, 69, 67, 66, 0, 0, 0, 62, 0, 0, 0], drums: 0, lead: 'sine' } };
  function music(name) {
    if (!ctx) { wantSong = name; return; } if (name === songName) return; songName = name;
    if (song) { const s = song; s.g.gain.setTargetAtTime(.0001, now(), .5); setTimeout(() => clearInterval(s.timer), 2000); song = null; }
    if (!name || !SONGS[name]) return;
    const M = SONGS[name], g = ctx.createGain(); g.gain.value = .0001; g.gain.setTargetAtTime(1, now(), .8); g.connect(bus.music);
    const step = 60 / M.bpm / 2; let next = now() + .1, k = 0;   // (eighth notes)
    const sched = () => { while (next < now() + .25) { const bar = Math.floor(k / 8) % M.bars.length, i = k % 8, ch = M.bars[bar], t = next;
        if (i === 0 || i === 4) tone(g, NOTE(ch[0] - 12), t, step * 3.2, { type: 'triangle', vol: .16, a: .01 });                         // the bass
        if (M.drums === 2 && i % 2) tone(g, NOTE(ch[0] - 12 + (i % 4 === 1 ? 7 : 12)), t, step * .8, { type: 'triangle', vol: .1 });
        if (i % 2 === 0) for (const n of ch) tone(g, NOTE(n), t, step * 1.6, { type: 'square', vol: .018, a: .01 });                    // the chords' pulse
        const tn = M.tune[k % M.tune.length]; if (tn) tone(g, NOTE(tn), t, step * (M.drums === 2 ? .8 : 1.7), { type: M.lead, vol: M.lead === 'square' ? .03 : .07, a: .01 });   // the tune
        if (M.drums) { if (i === 0 || (M.drums === 2 && i === 4)) tone(g, 110, t, .12, { vol: .3, to: 45 }); if (i === 4 || (M.drums === 1 && i === 0 && false)) hiss(g, t, .12, { f: 1800, q: .7, vol: .12 }); if (i % 2 === 1 || M.drums === 2) hiss(g, t, .03, { type: 'highpass', f: 7000, vol: M.drums === 2 ? .06 : .04 }); }
        next += step; k++; } };
    song = { g, timer: setInterval(sched, 40) }; sched();
  }
  return { play, say, ride, siren, music, set, get: k => S[k], names: Object.keys(FX), voices: Object.keys(VOICES), songs: Object.keys(SONGS), get on() { return !!ctx; } };
}
