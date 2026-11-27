import { createStore } from './save/store.js';
import { setLanguage, getLanguage } from './data/i18n/index.js';
import { getTheme } from './data/themes/index.js';
import { branding } from './data/branding.js';
import { sound } from './audio/sound.js';
import { speech } from './audio/speech.js';
import { music } from './audio/music.js';
import { createChrome } from './ui/chrome.js';
import { presents } from './ui/screens/presents.js';
import { home } from './ui/screens/home.js';
import { levels } from './ui/screens/levels.js';
import { album } from './ui/screens/album.js';
import { cupScreen } from './games/race/cupScreen.js';
import { raceScreen } from './games/race/raceScreen.js';
import { raceResults } from './games/race/raceResults.js';
import { colorPick, colorScreen } from './games/colorByCode/colorScreen.js';
import { albumSources } from './ui/screens/album.js';
import { pictures, finishedSvg } from './games/colorByCode/pictures.js';
import { profiles } from './ui/screens/profiles.js';
import { newProfile } from './ui/screens/newProfile.js';
import { map } from './ui/screens/map.js';
import { play } from './ui/screens/play.js';
import { results } from './ui/screens/results.js';
import { adult } from './ui/screens/adult.js';
import { adultGate } from './ui/screens/adultGate.js';

const screens = { presents, home, levels, album, raceCup: cupScreen, race: raceScreen, raceResults, colorPick, colorByCode: colorScreen, profiles, newProfile, map, play, results, adult, adultGate };
const root = document.getElementById('app');
const store = createStore();
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let current = null;
const history = [];

const app = {
  store,
  theme: () => getTheme(store.active()?.theme),
  reducedMotion: () => store.settings.reducedMotion || motionQuery.matches,
  go(name, params = {}) {
    if (current) { current.view.destroy?.(); current.view.el.remove(); history.push(current); if (history.length > 20) history.shift(); }
    const view = screens[name](app, params);
    current = { name, params, view };
    root.append(view.el);
    chrome.setVisible(view.chrome !== false);
    if (!['play', 'race', 'colorByCode'].includes(name)) view.el.querySelector('button:not([hidden]), [tabindex]')?.focus({ preventScroll: true });
    else document.activeElement?.blur?.();
    if (debug) window.roadBuddies.view = view;
  },
  back() {
    let prev = history.pop();
    while (prev && ['adult', 'adultGate', 'presents'].includes(prev.name)) prev = history.pop();
    if (prev && !['play', 'results', 'race', 'raceResults'].includes(prev.name)) app.go(prev.name, prev.params);
    else app.go(store.active() ? 'home' : 'profiles');
    history.pop(); // don't stack the screen we just left
  },
  applySettings() {
    const s = store.settings;
    if (s.lang !== getLanguage()) setLanguage(s.lang);
    sound.setVolume(s.volume);
    sound.setMuted(!s.sound);
    speech.setEnabled(s.voice);
    music.setEnabled(s.music && s.sound);
    if (s.music && s.sound && current?.name === 'play' && !music.playing) music.start(app.theme().music, { calm: s.calm });
    const cl = document.documentElement.classList;
    cl.toggle('high-contrast', s.highContrast);
    cl.toggle('reduce-motion', app.reducedMotion());
    cl.toggle('calm', s.calm);
    chrome.sync();
  },
};

// Finished Color by Code pictures appear in the sticker album.
albumSources.push(() => pictures.map((p) => ({ id: `cbc:${p.id}`, title: p.name, art: finishedSvg(p), text: '' })));

document.title = branding.pageTitle;
setLanguage(store.settings.lang);
const chrome = createChrome(app);
document.body.append(chrome.el);
app.applySettings();

const debug = new URLSearchParams(location.search).has('debug');
if (debug) window.roadBuddies = { app, store };

// Unlock audio on the very first touch anywhere (browser autoplay rule).
window.addEventListener('pointerdown', () => sound.unlock(), { once: true });

// The opening plays once per launch, then goes to the hub (or to the player picker the first time).
app.go('presents', { next: store.active() ? 'home' : store.profiles().length ? 'profiles' : 'newProfile' });

// Offline support (PWA). Only over http(s); opening the file directly skips it.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
