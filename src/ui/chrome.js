import { h, iconButton } from './dom.js';
import { icons } from './icons.js';
import { t } from '../data/i18n/index.js';
import { sound } from '../audio/sound.js';

// Always-visible corner: mute, volume, and the grown-ups gear (press and hold 3 seconds).
export function createChrome(app) {
  const muteBtn = iconButton('', t('btn.mute'), () => {
    app.store.updateSettings({ sound: !app.store.settings.sound });
    app.applySettings();
  }, 'chrome-btn');
  const vol = h('input.vol', { type: 'range', min: '0', max: '1', step: '0.05', 'aria-label': t('btn.volume') });
  vol.addEventListener('input', () => {
    app.store.updateSettings({ volume: Number(vol.value), sound: Number(vol.value) > 0 });
    app.applySettings();
  });
  vol.addEventListener('change', () => sound.play('tap'));

  const ring = h('span.hold-ring');
  const gear = h('button.btn.chrome-btn.gear', { type: 'button', 'aria-label': t('btn.settings'), title: t('btn.settings'), html: icons.gear }, ring);
  // Two ways in: hold 3 seconds, or a short tap which asks an adult question first.
  let holdTimer = 0, downAt = 0;
  const start = (e) => {
    e.preventDefault();
    downAt = performance.now();
    gear.classList.add('holding');
    holdTimer = setTimeout(() => { downAt = 0; gear.classList.remove('holding'); sound.play('select'); app.go('adult'); }, 3000);
  };
  const cancel = () => { clearTimeout(holdTimer); gear.classList.remove('holding'); downAt = 0; };
  const release = () => {
    const short = downAt && performance.now() - downAt < 700;
    cancel();
    if (short) { sound.play('tap'); app.go('adultGate'); }
  };
  gear.addEventListener('pointerdown', start);
  gear.addEventListener('pointerup', release);
  ['pointerleave', 'pointercancel'].forEach((ev) => gear.addEventListener(ev, cancel));
  gear.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) start(e); });
  gear.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') release(); });
  gear.addEventListener('contextmenu', (e) => e.preventDefault());

  const el = h('div.chrome', {}, muteBtn, vol, gear);
  function sync() {
    const s = app.store.settings;
    muteBtn.innerHTML = s.sound && s.volume > 0 ? icons.soundOn : icons.soundOff;
    muteBtn.setAttribute('aria-pressed', String(!s.sound));
    vol.value = String(s.volume);
  }
  sync();
  return { el, sync, setVisible(v) { el.hidden = !v; } };
}
