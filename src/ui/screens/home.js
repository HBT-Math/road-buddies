import { h, logo, iconButton } from '../dom.js';
import { icons } from '../icons.js';
import { t } from '../../data/i18n/index.js';
import { games, openGame } from '../../games/registry.js';
import { profileBadge } from './profiles.js';
import { speech } from '../../audio/speech.js';
import { sound } from '../../audio/sound.js';

// The game hub: big picture cards (icon first, text second) and a small logo footer.
export function home(app) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('profiles')); return { el: h('div.screen') }; }
  const grid = h('div.hub-grid');
  for (const g of games) {
    const card = h(`button.hub-card${g.ready ? '' : '.soon'}`, {
      type: 'button', 'aria-label': t(g.nameKey) + (g.ready ? '' : `, ${t('hub.soon')}`),
      onclick: () => {
        sound.unlock();
        if (!g.ready && !g.levels) {
          sound.play('pop');
          card.classList.remove('wiggle'); void card.offsetWidth; card.classList.add('wiggle');
          speech.say(t('hub.soon'));
          return;
        }
        sound.play('select');
        speech.say(t(g.nameKey));
        openGame(app, g);
      },
    },
    h('span.hub-art', { html: g.art }),
    h('span.hub-name', {}, t(g.nameKey)),
    g.ready ? null : h('span.hub-soon', {}, t('hub.soon')));
    grid.append(card);
  }
  const who = h('button.btn.who', { type: 'button', 'aria-label': t('pick.profile'), onclick: () => app.go('profiles') }, profileBadge(profile, 76));
  const el = h('div.screen.menu.home', {},
    who,
    iconButton(icons.book, t('album.title'), () => app.go('album'), 'album-btn home-album'),
    grid,
    h('footer.home-footer', { 'aria-label': t('about.line') }, logo('school', 'logo-footer-school'), logo('enrich', 'logo-footer-enrich')));
  speech.say(t('hub.pick'));
  return { el };
}
