import { h, iconButton } from '../dom.js';
import { icons } from '../icons.js';
import { t } from '../../data/i18n/index.js';
import { createRng } from '../../math/rng.js';
import { sound } from '../../audio/sound.js';

// A sum that crosses ten (e.g. 14 + 9) with 6 choices, so a guessing child rarely gets through.
export function makeAdultQuestion(rng = createRng()) {
  const a = rng.int(11, 19);
  const b = rng.int(Math.max(5, 21 - a), 9);
  const answer = a + b;
  const choices = rng.shuffle([answer, answer + 1, answer - 1, answer + 10, answer - 10, answer + 2]);
  return { a, b, answer, choices };
}

export function adultGate(app) {
  const q = makeAdultQuestion();
  const grid = h('div.gate-choices');
  for (const n of q.choices) {
    grid.append(h('button.btn.gate-choice', {
      type: 'button',
      onclick: () => {
        if (n === q.answer) { sound.play('select'); app.go('adult', { from: 'gate' }); }
        else { sound.play('oops'); el.classList.add('shake'); setTimeout(() => app.back(), 500); }
      },
    }, String(n)));
  }
  const el = h('div.screen.menu.adult-gate', {},
    h('div.adult-card', {},
      h('h1.title', {}, t('adult.gateTitle')),
      h('p.gate-q', { dir: 'ltr' }, `${q.a} + ${q.b} = ?`),
      h('p.small', {}, t('adult.gateHint')),
      grid),
    iconButton(icons.back, t('btn.back'), () => app.back(), 'back-btn'));
  return { el, chrome: false };
}
