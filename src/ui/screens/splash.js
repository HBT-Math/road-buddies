import { h, logo } from '../dom.js';

// White splash with the large Enrich Program logo for ~2 s. Tap anywhere to skip.
export function splash(app) {
  let done = false;
  const finish = () => { if (done) return; done = true; el.classList.add('fade-out'); setTimeout(() => app.go(app.store.profiles().length ? 'profiles' : 'newProfile'), 350); };
  const el = h('div.screen.splash', { onpointerdown: finish, role: 'button', tabindex: '0', 'aria-label': 'Start', onkeydown: finish }, logo('enrich', 'logo-splash'));
  const timer = setTimeout(finish, 2000);
  return { el, chrome: false, destroy: () => clearTimeout(timer) };
}
