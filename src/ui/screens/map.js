import { h, iconButton, logo } from '../dom.js';
import { icons } from '../icons.js';
import { getPack } from '../../data/packs/index.js';
import { isWorldUnlocked, worldStars } from '../../save/store.js';
import { t } from '../../data/i18n/index.js';
import { profileBadge } from './profiles.js';
import { speech } from '../../audio/speech.js';

const worldIcon = { count: icons.dots, add: icons.plus, sub: icons.minus, mixed: icons.mixed, bond: icons.bond };

export function starsRow(n, total = 3) {
  return h('span.stars', { 'aria-label': t('result.stars', { n }) },
    ...Array.from({ length: total }, (_, i) => h(`span.star${i < n ? '.on' : ''}`, { html: i < n ? icons.star : icons.starEmpty })));
}

export function map(app) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('profiles')); return { el: h('div.screen') }; }
  const pack = getPack(profile.pack);
  const path = h('div.world-path');
  let suggested = -1;
  pack.worlds.forEach((w, i) => {
    const unlocked = isWorldUnlocked(profile, pack, i);
    const stars = worldStars(profile, pack.id, w.id);
    if (unlocked && stars === 0 && suggested < 0) suggested = i;
    const node = h(`button.world-node${unlocked ? '' : '.locked'}`, {
      type: 'button',
      'aria-label': `${t('world.label', { n: i + 1 })}${unlocked ? '' : ', ' + t('world.locked')}`,
      disabled: !unlocked,
      onclick: () => app.go('play', { worldIndex: i }),
    },
    h('span.world-num', {}, String(i + 1)),
    h('span.world-icon', { html: unlocked ? worldIcon[w.icon] || icons.star : icons.lock }));
    path.append(h('div.world-stop', { style: `--i:${i}` }, node, starsRow(stars)));
  });
  if (suggested >= 0) path.children[suggested].classList.add('suggested');

  const who = h('button.btn.who', { type: 'button', 'aria-label': t('pick.profile'), onclick: () => app.go('profiles') }, profileBadge(profile, 76));
  const el = h('div.screen.menu.map', {},
    logo('enrich', 'logo-corner'),
    who,
    h('div.reward-total', {}, h('span', { html: app.theme().reward.icon }), h('b', {}, String(profile.rewards))),
    path);
  speech.say(t('speak.letsGo'));
  return { el };
}
