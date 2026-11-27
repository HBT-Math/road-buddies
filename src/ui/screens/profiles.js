import { h, iconButton } from '../dom.js';
import { icons, shapeSvg } from '../icons.js';
import { getCharacter, faceSvg } from '../../data/characters.js';
import { getColor } from '../../data/colors.js';
import { t } from '../../data/i18n/index.js';
import { speech } from '../../audio/speech.js';

/** A profile badge: animal face on the chosen colour, plus the colour's shape. */
export function profileBadge(profile, size = 110) {
  const ch = getCharacter(profile.animal);
  const col = getColor(profile.color);
  return h('span.badge', { style: `--accent:${col.hex};--accent-dark:${col.dark};width:${size}px;height:${size}px` },
    h('span.badge-face', { html: faceSvg(ch, size * 0.86) }),
    h('span.badge-shape', { html: shapeSvg(col.shape) }));
}

export function profiles(app) {
  const list = app.store.profiles();
  if (!list.length) { queueMicrotask(() => app.go('newProfile')); return { el: h('div.screen') }; }
  const grid = h('div.pick-grid.profiles');
  for (const p of list) {
    const ch = getCharacter(p.animal);
    grid.append(h('button.pick-card', {
      type: 'button', 'aria-label': `${ch.name}, ${t('color.' + p.color)}`,
      onclick: () => { app.store.setActive(p.id); speech.say(ch.name, ch.voiceStyle); app.go('home'); },
    }, profileBadge(p)));
  }
  if (app.store.canAddProfile()) {
    grid.append(iconButton(icons.plus, t('btn.newProfile'), () => app.go('newProfile'), 'pick-card add-card'));
  }
  const el = h('div.screen.menu',
    {},
    h('h1.title', {}, h('span.title-icon', { html: icons.home }), t('pick.profile')),
    grid);
  speech.say(t('pick.profile'));
  return { el };
}
