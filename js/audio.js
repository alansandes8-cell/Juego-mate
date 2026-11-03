/* Mate Perfecto — sonido sintetizado con WebAudio (sin archivos externos) */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});

  let ctx = null, master, sfxBus, musicBus, noiseBuf;
  let sfxOn = true, musicOn = true;
  let pourGain, kettleGain, kettleOsc, fireGain;
  const plucks = {};
  let musicTimer = null, nextNoteTime = 0, step = 0;

  try {
    const s = JSON.parse(localStorage.getItem('mp_audio') || '{}');
    if (s.sfx === false) sfxOn = false;
    if (s.music === false) musicOn = false;
  } catch (e) { /* sin storage */ }

  function save() {
    try { localStorage.setItem('mp_audio', JSON.stringify({ sfx: sfxOn, music: musicOn })); } catch (e) { /* nada */ }
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.32 : 0;
    musicBus.connect(lp); lp.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    setupLoops();
    startMusic();
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function env(g, t0, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function noise(o) {
    if (!ctx) return;
    const { dur = 0.2, type = 'bandpass', f = 1000, f2, q = 1, vol = 0.3, a = 0.005, delay = 0 } = o || {};
    const t0 = now() + delay;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = ctx.createGain(); env(g, t0, a, vol, dur);
    src.connect(fl); fl.connect(g); g.connect(sfxBus);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  }

  function tone(o) {
    if (!ctx) return;
    const { f = 440, f2, dur = 0.2, type = 'sine', vol = 0.2, a = 0.005, delay = 0 } = o || {};
    const t0 = now() + delay;
    const osc = ctx.createOscillator(); osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = ctx.createGain(); env(g, t0, a, vol, dur);
    osc.connect(g); g.connect(sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  function setupLoops() {
    // chorro de agua: ruido filtrado con un LFO que lo hace "gorgotear"
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 750; bp.Q.value = 0.9;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9;
    const lfoG = ctx.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
    pourGain = ctx.createGain(); pourGain.gain.value = 0;
    src.connect(bp); bp.connect(pourGain); pourGain.connect(sfxBus); src.start();

    // silbido de la pava
    kettleOsc = ctx.createOscillator(); kettleOsc.type = 'sine'; kettleOsc.frequency.value = 1700;
    const vib = ctx.createOscillator(); vib.frequency.value = 6.5;
    const vibG = ctx.createGain(); vibG.gain.value = 35;
    vib.connect(vibG); vibG.connect(kettleOsc.frequency); vib.start();
    kettleGain = ctx.createGain(); kettleGain.gain.value = 0;
    kettleOsc.connect(kettleGain); kettleGain.connect(sfxBus); kettleOsc.start();

    // fuego de la hornalla
    const fsrc = ctx.createBufferSource(); fsrc.buffer = noiseBuf; fsrc.loop = true;
    const flp = ctx.createBiquadFilter(); flp.type = 'lowpass'; flp.frequency.value = 380;
    fireGain = ctx.createGain(); fireGain.gain.value = 0;
    fsrc.connect(flp); flp.connect(fireGain); fireGain.connect(sfxBus); fsrc.start();
  }

  function setPour(on) { if (ctx) pourGain.gain.setTargetAtTime(on ? 0.32 : 0, now(), 0.04); }
  function setFire(on) { if (ctx) fireGain.gain.setTargetAtTime(on ? 0.09 : 0, now(), 0.1); }
  function setKettle(level) {
    if (!ctx) return;
    level = Math.max(0, Math.min(1, level));
    kettleOsc.frequency.setTargetAtTime(1500 + level * 900, now(), 0.2);
    kettleGain.gain.setTargetAtTime(level * 0.06, now(), 0.15);
  }
  function silenceLoops() { setPour(false); setFire(false); setKettle(0); }

  const S = {
    click() { tone({ f: 900, f2: 620, dur: 0.06, type: 'triangle', vol: 0.14 }); },
    pop() { tone({ f: 380, f2: 950, dur: 0.1, vol: 0.18 }); },
    clink() { tone({ f: 2650, dur: 0.3, vol: 0.1 }); tone({ f: 3980, dur: 0.22, vol: 0.05, delay: 0.01 }); },
    yerbaTick() { noise({ type: 'highpass', f: 3500 + Math.random() * 2500, dur: 0.03, vol: 0.06 }); },
    slurp() {
      for (let i = 0; i < 6; i++) noise({ f: 900 + Math.random() * 700, f2: 500, q: 3, dur: 0.08, vol: 0.22, delay: i * 0.13 });
      // el ruidito final de la bombilla
      for (let i = 0; i < 6; i++) noise({ f: 480 + Math.random() * 500, q: 4, dur: 0.05, vol: 0.38, delay: 0.95 + i * 0.055 });
    },
    cash() {
      noise({ type: 'highpass', f: 5000, dur: 0.05, vol: 0.12 });
      tone({ f: 1318, dur: 0.12, type: 'square', vol: 0.06, delay: 0.03 });
      tone({ f: 1760, dur: 0.35, type: 'square', vol: 0.06, delay: 0.11 });
    },
    yay() { [523, 659, 784, 1046].forEach((f, i) => tone({ f, dur: 0.18, type: 'triangle', vol: 0.12, delay: i * 0.07 })); },
    fail() {
      tone({ f: 320, f2: 150, dur: 0.45, type: 'sawtooth', vol: 0.09 });
      tone({ f: 240, f2: 110, dur: 0.5, type: 'sawtooth', vol: 0.08, delay: 0.18 });
    },
    whoosh() { noise({ f: 300, f2: 1600, dur: 0.28, vol: 0.18, q: 0.7 }); },
    splash() { noise({ type: 'lowpass', f: 1400, f2: 300, dur: 0.45, vol: 0.32 }); },
    bell() { tone({ f: 880, dur: 0.9, vol: 0.12 }); tone({ f: 1320, dur: 0.7, vol: 0.06, delay: 0.02 }); },
    boil() { for (let i = 0; i < 8; i++) noise({ f: 300 + Math.random() * 300, q: 6, dur: 0.06, vol: 0.25, delay: i * 0.07 }); },
    tick() { tone({ f: 1200, dur: 0.04, type: 'square', vol: 0.04 }); },
  };

  // ---------- Música: milonga sencilla con guitarra Karplus-Strong ----------
  function pluckBuf(freq) {
    const key = freq.toFixed(2);
    if (plucks[key]) return plucks[key];
    const sr = ctx.sampleRate, len = Math.floor(sr * 1.8);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * 0.5 + r * 0.5; ring[i] = prev; }
    let idx = 0;
    const damp = freq > 300 ? 0.993 : 0.997;
    for (let i = 0; i < len; i++) {
      const v = ring[idx], nx = ring[(idx + 1) % N];
      d[i] = v;
      ring[idx] = damp * 0.5 * (v + nx);
      idx = (idx + 1) % N;
    }
    plucks[key] = buf;
    return buf;
  }

  function pluck(freq, t, vol) {
    const src = ctx.createBufferSource(); src.buffer = pluckBuf(freq);
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(musicBus); src.start(t); src.stop(t + 1.8);
  }

  const CH = {
    Am: { b: [110, 164.81], arp: [220, 261.63, 329.63], mel: [659.25, 523.25, 440] },
    E7: { b: [82.41, 123.47], arp: [207.65, 246.94, 293.66], mel: [493.88, 415.3, 329.63] },
    Dm: { b: [73.42, 110], arp: [220, 293.66, 349.23], mel: [587.33, 440, 349.23] },
  };
  const PROG = ['Am', 'Am', 'E7', 'E7', 'Am', 'Dm', 'E7', 'Am'];
  const EIGHTH = 0.29;

  function schedule(st, t) {
    const bar = Math.floor(st / 8) % PROG.length, e = st % 8;
    const c = CH[PROG[bar]];
    if (e === 0) pluck(c.b[0], t, 0.55);
    else if (e === 3) pluck(c.b[1], t, 0.42);
    else if (e === 6) pluck(c.b[0], t, 0.45);
    else pluck(c.arp[e % 3], t, 0.16);
    // melodía cada dos compases (rasgueo 3-3-2)
    if (bar % 2 === 1 && (e === 0 || e === 3 || e === 6)) pluck(c.mel[e / 3], t + 0.01, 0.2);
  }

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      while (nextNoteTime < ctx.currentTime + 0.2) {
        schedule(step, nextNoteTime);
        nextNoteTime += EIGHTH; step++;
      }
    }, 60);
  }

  MP.Sfx = Object.assign(S, {
    init, setPour, setFire, setKettle, silenceLoops,
    get sfxOn() { return sfxOn; },
    get musicOn() { return musicOn; },
    toggleSfx() {
      sfxOn = !sfxOn; save();
      if (ctx) sfxBus.gain.setTargetAtTime(sfxOn ? 1 : 0, now(), 0.05);
      return sfxOn;
    },
    toggleMusic() {
      musicOn = !musicOn; save();
      if (ctx) musicBus.gain.setTargetAtTime(musicOn ? 0.32 : 0, now(), 0.1);
      return musicOn;
    },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
  });
})();
