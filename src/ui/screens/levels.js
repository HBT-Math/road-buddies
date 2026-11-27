import { h, iconButton } from '../dom.js';
import { icons } from '../icons.js';
import { t } from '../../data/i18n/index.js';
import { difficulties, UNLOCK_STARS } from '../../data/difficulty.js';
import { getGame } from '../../games/registry.js';
import { gameLevel, gameStars, isStepUnlocked } from '../../save/store.js';
import { starsRow } from './map.js';
import { speech } from '../../audio/speech.js';
import { sound } from '../../audio/sound.js';

// Shared level picker for Race, Maze and Color by Code: Easy / Medium / Hard (saved per game) + 3 steps.
const DIFF_ART = { easy: 1, medium: 2, hard: 3 };
const chevrons = (n) => `<svg viewBox="0 0 48 48" aria-hidden="true">${Array.from({ length: n }, (_, i) =>
  `<path d="M12 ${34 - i * 11} L24 ${24 - i * 11} L36 ${34 - i * 11}" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;

export function levels(app, { gameId }) {
  const profile = app.store.active();
  const game = getGame(gameId);
  if (!profile || !game) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  let diffId = gameLevel(profile, gameId);
  const diffRow = h('div.diff-row');
  const steps = h('div.step-row');

  function renderSteps() {
    const d = difficulties.find((x) => x.id === diffId);
    steps.innerHTML = '';
    d.steps.forEach((s, i) => {
      const open = isStepUnlocked(profile, gameId, diffId, i, UNLOCK_STARS);
      steps.append(h('div.world-stop', { style: `--i:${i}` },
        h(`button.world-node.step-node${open ? '' : '.locked'}`, {
          type: 'button', disabled: !open,
          'aria-label': `${t('level.step', { n: i + 1 })}${open ? '' : ', ' + t('world.locked')}`,
          onclick: () => {
            if (!game.ready || !game.start) { speech.say(t('hub.soon')); sound.play('pop'); return; }
            game.start(app, { difficulty: diffId, step: i });
          },
        }, h('span.world-num', {}, String(i + 1)), h('span.world-icon', { html: open ? game.art : icons.lock })),
        starsRow(gameStars(profile, gameId, diffId, i))));
    });
  }
  for (const d of difficulties) {
    const b = h(`button.diff-btn.diff-${d.id}`, {
      type: 'button', 'aria-pressed': String(d.id === diffId),
      onclick: () => {
        sound.play('select');
        diffId = d.id;
        app.store.setGameLevel(profile.id, gameId, diffId);
        diffRow.querySelectorAll('.diff-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        speech.say(t(d.nameKey));
        renderSteps();
      },
    }, h('span.diff-icon', { html: chevrons(DIFF_ART[d.id]) }), h('span', {}, t(d.nameKey)));
    diffRow.append(b);
  }
  renderSteps();
  const el = h('div.screen.menu.levels', {},
    iconButton(icons.home, t('btn.home'), () => app.go('home'), 'corner-home'),
    h('h1.title', {}, h('span.title-art', { html: game.art }), t(game.nameKey)),
    diffRow, steps);
  speech.say(t(game.nameKey));
  return { el };
}
