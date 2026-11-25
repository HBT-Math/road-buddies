import { getLanguage } from '../data/i18n/index.js';
import { sound } from './sound.js';
import { music } from './music.js';

// Reads prompts aloud with the browser's built-in speech synthesis (works offline on most devices).
// Optional: toggled in the grown-ups screen; silent when sound is muted.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let enabled = true;
let voices = [];

// Friendly, clear voices first; robotic engines last.
const PREFERRED = [/natural/i, /samantha/i, /google us english/i, /google uk english female/i, /karen/i, /moira/i, /tessa/i, /zira/i, /aria/i, /jenny/i];
const AVOID = /espeak|robot|whisper|bad news|bells|boing|bubbles|cellos|deranged|hysterical|organ|trinoids|zarvox|albert|jester|superstar|wobble/i;

function loadVoices() { voices = synth?.getVoices() || []; }
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

export function pickVoice(list, lang) {
  const mine = list.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(lang) && !AVOID.test(v.name));
  for (const re of PREFERRED) { const v = mine.find((x) => re.test(x.name)); if (v) return v; }
  return mine.find((v) => v.localService) || mine[0] || null;
}

export const speech = {
  setEnabled(v) { enabled = v; if (!v) synth?.cancel(); },
  get enabled() { return enabled; },
  get available() { return !!synth; },
  /**
   * voiceStyle: { pitch, rate } from character data.
   * opts.queue = true waits for current speech instead of interrupting it.
   */
  say(text, voiceStyle = {}, { queue = false } = {}) {
    if (!synth || !enabled || sound.muted || sound.volume <= 0 || !text || document.hidden) return;
    if (!queue) synth.cancel();
    const lang = getLanguage();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(voices, lang);
    if (v) u.voice = v;
    u.lang = v?.lang || (lang === 'ar' ? 'ar-SA' : 'en-US');
    u.pitch = Math.min(2, Math.max(0.5, voiceStyle.pitch ?? 1.1));
    u.rate = Math.min(1.2, Math.max(0.7, (voiceStyle.rate ?? 1) * 0.88)); // a little slower for young listeners
    u.volume = Math.max(0, Math.min(1, sound.volume));
    u.onstart = () => music.duck(true);
    u.onend = u.onerror = () => { if (!synth.speaking) music.duck(false); };
    synth.speak(u);
  },
  stop() { synth?.cancel(); music.duck(false); },
};
