// Sound manifest. Each key is either a synth recipe (generated with WebAudio, no files needed)
// or { url: 'assets/sounds/x.mp3' } to swap in a recorded file later. Themes refer to these keys.
export const sounds = {
  tap:     { synth: 'blip', wave: 'sine', notes: [660], dur: 0.06, gain: 0.25 },
  lane:    { synth: 'sweep', wave: 'sine', from: 300, to: 520, dur: 0.12, gain: 0.12 },
  select:  { synth: 'arp', wave: 'triangle', notes: [523, 784], dur: 0.09, gain: 0.3 },
  correct: { synth: 'bell', notes: [659, 784, 1047], dur: 0.09, gain: 0.22 },
  collect: { synth: 'arp', wave: 'square', notes: [988, 1319], dur: 0.07, gain: 0.12 },
  oops:    { synth: 'arp', wave: 'sine', notes: [440, 349], dur: 0.2, gain: 0.3 },   // soft, low, never harsh
  pop:     { synth: 'blip', wave: 'sine', notes: [880], dur: 0.05, gain: 0.2 },
  slide:   { synth: 'sweep', wave: 'sine', from: 600, to: 380, dur: 0.12, gain: 0.15 },
  fanfare: { synth: 'arp', wave: 'triangle', notes: [523, 659, 784, 659, 784, 1047], dur: 0.14, gain: 0.35 },
  horn:    { synth: 'arp', wave: 'square', notes: [392, 494], dur: 0.12, gain: 0.07 },
  whoosh:  { synth: 'noise', from: 500, to: 2600, dur: 0.35, gain: 0.18 },
  star:    { synth: 'bell', notes: [1047], dur: 0.12, gain: 0.22 },
  streak:  { synth: 'bell', notes: [784, 988, 1175, 1568], dur: 0.08, gain: 0.2 },
};
