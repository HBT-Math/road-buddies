import { sounds as manifest } from '../data/sounds.js';

// Tiny WebAudio player. The AudioContext is created on the first user gesture (browser rule).
let ctx = null;
let master = null;
let volume = 0.7;
let muted = false;
const buffers = new Map();

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applyVolume();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function applyVolume() { if (master) master.gain.value = muted ? 0 : volume; }

export const sound = {
  unlock: ensure,
  setVolume(v) { volume = v; applyVolume(); },
  setMuted(m) { muted = m; applyVolume(); },
  get muted() { return muted; },
  get volume() { return volume; },
  get context() { return ctx; },
  get output() { return master; },

  play(key) {
    const rec = manifest[key];
    if (!rec || muted || volume <= 0) return;
    const ac = ensure();
    if (!ac) return;
    if (rec.url) return playUrl(ac, rec);
    const t0 = ac.currentTime + 0.01;
    if (rec.synth === 'sweep') {
      tone(ac, rec.wave, rec.from, t0, rec.dur, rec.gain, rec.to);
    } else if (rec.synth === 'noise') {
      noise(ac, t0, rec.dur, rec.gain, rec.from, rec.to);
    } else if (rec.synth === 'bell') {
      // two partials with a soft, long tail: friendlier than a plain beep
      rec.notes.forEach((f, i) => {
        const t = t0 + i * rec.dur * 0.9;
        tone(ac, 'sine', f, t, rec.dur * 4, rec.gain);
        tone(ac, 'sine', f * 2.01, t, rec.dur * 2, rec.gain * 0.3);
      });
    } else {
      rec.notes.forEach((f, i) => tone(ac, rec.wave, f, t0 + i * rec.dur * 0.9, rec.dur * 1.4, rec.gain));
    }
  },
};

function tone(ac, wave, freq, t, dur, gain, toFreq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(freq, t);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise(ac, t, dur, gain, from = 800, to = 2400) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  src.buffer = noiseBuf;
  f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}

async function playUrl(ac, rec) {
  try {
    if (!buffers.has(rec.url)) {
      const res = await fetch(rec.url);
      buffers.set(rec.url, await ac.decodeAudioData(await res.arrayBuffer()));
    }
    const src = ac.createBufferSource();
    const g = ac.createGain();
    g.gain.value = rec.gain ?? 1;
    src.buffer = buffers.get(rec.url);
    src.connect(g).connect(master);
    src.start();
  } catch { /* missing file: stay silent */ }
}
