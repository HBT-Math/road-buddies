import { h, logo } from '../dom.js';
import { t } from '../../data/i18n/index.js';
import { speech } from '../../audio/speech.js';
import { sound } from '../../audio/sound.js';

// Opening "presents" screen. Plays once per app launch (main.js only routes here at start-up).
//   0.0 s  Rayhan School logo fades in  + "Rayhan School presents"
//   1.6 s  Enrich Program logo          + "Enrich Program"
//   2.9 s  both logos together
//   3.8 s  a car zooms across, then the home screen (about 4.6 s in all). Tap anywhere to skip.
const CAR = `<svg viewBox="0 0 220 110" aria-hidden="true">
  <path d="M-60 62 H6 M-40 80 H14 M-70 44 H0" stroke="#F3722C" stroke-width="7" stroke-linecap="round" opacity=".8"/>
  <path d="M14 82 Q18 44 58 40 L92 22 Q104 16 128 16 H150 Q170 16 184 40 L204 48 Q214 54 212 70 L210 82 Q208 90 198 90 H24 Q12 90 14 82Z" fill="#E63946" stroke="#A4222D" stroke-width="4"/>
  <path d="M96 28 Q106 22 126 22 H150 Q164 22 174 42 H86Z" fill="#DFF3FF" stroke="#A4222D" stroke-width="3"/>
  <circle cx="118" cy="33" r="7" fill="#fff"/><circle cx="146" cy="33" r="7" fill="#fff"/>
  <circle cx="120" cy="34" r="3.5" fill="#2B2140"/><circle cx="148" cy="34" r="3.5" fill="#2B2140"/>
  <path d="M186 70 Q196 76 204 70" stroke="#2B2140" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="90" r="17" fill="#2B2140"/><circle cx="60" cy="90" r="7" fill="#C9C3D9"/>
  <circle cx="170" cy="90" r="17" fill="#2B2140"/><circle cx="170" cy="90" r="7" fill="#C9C3D9"/></svg>`;

export function presents(app, { next = 'home' } = {}) {
  const reduced = app.reducedMotion();
  const school = h('div.pres-item.pres-school', {}, logo('opening', 'logo-opening'), h('p.pres-text', {}, t('presents.school')));
  const enrich = h('div.pres-item.pres-enrich', {}, logo('enrich', 'logo-opening-enrich'), h('p.pres-text', {}, t('presents.enrich')));
  const car = h('div.pres-car', { html: CAR });
  const stage = h('div.pres-stage.phase-1', {}, school, enrich);
  let done = false;
  const timers = [];
  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    speech.stop();
    el.classList.add('fade-out');
    setTimeout(() => app.go(next), 300);
  };
  const el = h('div.screen.presents', {
    role: 'button', tabindex: '0', 'aria-label': `${t('presents.school')} ${t('presents.enrich')}`,
    onpointerdown: () => { sound.unlock(); finish(); }, onkeydown: finish,
  }, stage, car);

  const voice = app.store.settings.presentsVoice;
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  if (voice) at(250, () => speech.say(t('presents.school'), { pitch: 1, rate: 0.95 }, { volume: 0.6 }));
  at(1600, () => { stage.className = 'pres-stage phase-2'; if (voice) speech.say(t('presents.enrich'), { pitch: 1, rate: 0.95 }, { volume: 0.6 }); });
  at(2900, () => { stage.className = 'pres-stage phase-3'; });
  at(3800, () => { if (!reduced) { car.classList.add('go'); sound.play('whoosh'); } });
  at(reduced ? 4200 : 4600, finish);
  return { el, chrome: false, destroy: () => timers.forEach(clearTimeout) };
}
