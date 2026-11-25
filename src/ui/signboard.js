import { h, iconButton } from './dom.js';
import { icons } from './icons.js';
import { bodySvg } from '../data/characters.js';
import { createTenFrame } from './tenframe.js';
import { t } from '../data/i18n/index.js';

// The equation signboard, held up by a roadside friend. Equations are always shown left-to-right.
export function createSignboard({ frames = 1, onSpeak, onStep }) {
  const holder = h('div.sign-holder');
  const eq = h('div.eq', { dir: 'ltr' });
  const tf = createTenFrame({ frames, onStep });
  const tfWrap = h('div.sign-tf', {}, tf.el);
  const speakBtn = iconButton(icons.speak, t('btn.hear'), () => onSpeak?.(), 'sign-speak');
  const sign = h('div.sign', {}, eq, tfWrap, speakBtn);
  const el = h('div.sign-wrap', { 'aria-hidden': 'false' }, holder, sign);

  return {
    el,
    tenFrame: tf,
    /** help: { mode, big, labels, stagger } from math/mastery.helpFor (+ retry hints) */
    setQuestion(q, { holderChar, mode = 'shown', big = false, labels = false, stagger = false } = {}) {
      holder.innerHTML = holderChar ? bodySvg(holderChar, 'hold', 90) : '';
      eq.innerHTML = renderTokens(q);
      sign.classList.toggle('is-count', q.form === 'count');
      sign.classList.toggle('no-frame', mode === 'hidden');
      tf.setMode(mode);
      tf.setBig(big);
      tf.showQuestion(q, { labels, stagger });
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    },
    reveal(q) {
      const box = eq.querySelector('.q-box');
      if (box) { box.textContent = String(q.answer); box.classList.add('solved'); }
    },
    setVisible(v) { el.classList.toggle('hidden', !v); },
  };
}

export function renderTokens(q) {
  const sym = (x) => (x === '-' ? '−' : x);
  if (q.form === 'count') return `<span class="tok op">=</span><span class="tok q-box">?</span>`;
  return q.tokens.map((x) => (x === '?' ? '<span class="tok q-box">?</span>'
    : typeof x === 'number' ? `<span class="tok num">${x}</span>` : `<span class="tok op">${sym(x)}</span>`)).join('');
}

/** What the speech engine says for a question. */
export function questionSpeech(q) {
  if (q.form === 'count') return t('speak.count');
  if (q.form === 'result') return t(q.op === '+' ? 'speak.add' : 'speak.sub', q);
  return t(q.op === '+' ? 'speak.missingAdd' : 'speak.missingSub', q);
}
export function answerSpeech(q) {
  if (q.form === 'count') return t('speak.answerCount', { n: q.answer });
  return t(q.op === '+' ? 'speak.answerAdd' : 'speak.answerSub', q);
}
