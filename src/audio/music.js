import { sound } from './sound.js';

// Generated background loop. A theme supplies { tempo, chords: [[note,...] per bar], melody: 'E5 - G5 ... | ...' }.
// Quiet by design, ducks while a voice is speaking, and stops when the tab is hidden.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteToFreq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  if (!m) return null;
  const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12; // MIDI
  return 440 * 2 ** ((semi - 69) / 12);
}
export function parseMelody(str) {
  return str.split('|').map((bar) => bar.trim().split(/\s+/).map((x) => (x === '-' ? null : noteToFreq(x))));
}

let enabled = true;
let timer = 0;
let song = null;
let bus = null;
let step = 0;
let nextTime = 0;
let level = 0.5;

function ensureBus() {
  const ac = sound.context;
  if (!ac || !sound.output) return null;
  if (!bus) { bus = ac.createGain(); bus.gain.value = 0; bus.connect(sound.output); }
  return ac;
}
function note(ac, freq, t, dur, wave, gain) {
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = wave; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function tick() {
  const ac = ensureBus();
  if (!ac || !song) return;
  const eighth = 30 / song.tempo;
  while (nextTime < ac.currentTime + 0.2) {
    const bars = song.bars.length;
    const bar = Math.floor(step / 8) % bars;
    const pos = step % 8;
    const f = song.bars[bar][pos];
    if (f) note(ac, f, nextTime, eighth * 1.6, 'triangle', 0.16);
    const chord = song.chords[bar % song.chords.length].map(noteToFreq);
    if (pos === 0 || pos === 4) note(ac, chord[0], nextTime, eighth * 3.5, 'sine', 0.28);
    if (pos === 2 || pos === 6) chord.slice(1).forEach((c) => note(ac, c, nextTime, eighth * 1.2, 'sine', 0.07));
    step++;
    nextTime += eighth;
  }
}

export const music = {
  setEnabled(v) { enabled = v; if (!v) this.stop(); },
  get playing() { return !!timer; },
  /** themeMusic from the theme; calm = slower and quieter */
  start(themeMusic, { calm = false } = {}) {
    this.stop();
    if (!enabled || !themeMusic) return;
    const ac = ensureBus();
    if (!ac) return;
    song = { tempo: themeMusic.tempo * (calm ? 0.8 : 1), chords: themeMusic.chords, bars: parseMelody(themeMusic.melody) };
    level = calm ? 0.3 : 0.5;
    step = 0;
    nextTime = ac.currentTime + 0.1;
    bus.gain.cancelScheduledValues(ac.currentTime);
    bus.gain.setTargetAtTime(level, ac.currentTime, 0.4);
    timer = setInterval(tick, 50);
    tick();
  },
  stop() {
    clearInterval(timer); timer = 0;
    const ac = sound.context;
    if (bus && ac) bus.gain.setTargetAtTime(0, ac.currentTime, 0.15);
  },
  /** Lower the music while speech plays so words stay clear. */
  duck(on) {
    const ac = sound.context;
    if (bus && ac && timer) bus.gain.setTargetAtTime(on ? level * 0.35 : level, ac.currentTime, 0.12);
  },
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!sound.context) return;
    if (document.hidden) sound.context.suspend?.(); else sound.context.resume?.();
  });
}
