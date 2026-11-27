import { h, iconButton } from '../dom.js';
import { icons } from '../icons.js';
import { getPack } from '../../data/packs/index.js';
import { getCharacter, bodySvg } from '../../data/characters.js';
import { t } from '../../data/i18n/index.js';
import { starsRow } from './map.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';
import { confetti } from '../confetti.js';

export function results(app, { worldIndex = 0, result, placement = false }) {
  const profile = app.store.active();
  const pack = getPack(profile.pack);
  const ch = getCharacter(profile.animal);
  const hasNext = !placement && worldIndex + 1 < pack.worlds.length;
  const buttons = placement ? h('div.result-buttons', {}, iconButton(icons.map, t('btn.map'), () => app.go('map'), 'big primary')) : h('div.result-buttons', {},
    iconButton(icons.replay, t('btn.replay'), () => app.go('play', { worldIndex }), 'big'),
    iconButton(icons.map, t('btn.map'), () => app.go('map'), 'big'),
    hasNext ? iconButton(icons.next, t('btn.next'), () => app.go('play', { worldIndex: worldIndex + 1 }), 'big primary') : null);
  // the placement check is not graded for the child: everyone gets the full celebration
  const stars = starsRow(placement ? 3 : result.stars);
  stars.classList.add('big-stars');
  const el = h('div.screen.menu.results', {},
    h('div.result-card', {},
      h('div.result-buddy', { html: bodySvg(ch, 'cheer', 150) }),
      h('div', {},
        h('h1.title', {}, t('result.title')),
        stars,
        h('div.reward-total.inline', {}, h('span', { html: app.theme().reward.icon }), h('b', {}, `+${result.rewards}`)))),
    buttons);
  const shown = placement ? 3 : result.stars;
  const timers = [];
  for (let i = 0; i < shown; i++) timers.push(setTimeout(() => sound.play('star'), 150 + i * 250));
  timers.push(setTimeout(() => confetti(el, { reduced: app.reducedMotion() || app.store.settings.calm }), 50));
  speech.say(t('speak.worldDone'), ch.voiceStyle);
  return { el, destroy: () => timers.forEach(clearTimeout) };
}
