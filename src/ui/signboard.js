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
      if (box) { box.textContent = revealText(q); box.classList.add('solved'); }
    },
    setVisible(v) { el.classList.toggle('hidden', !v); },
  };
}

export function renderTokens(q) {
  const sym = (x) => String(x).replace(/-/g, '−');
  if (q.form === 'count') return `<span class="tok op">=</span><span class="tok q-box">?</span>`;
  return q.tokens.map((x) => (x === '?' ? '<span class="tok q-box">?</span>'
    : typeof x === 'number' ? `<span class="tok num">${x}</span>`
    : String(x).length > 1 ? `<span class="tok expr">${sym(x)}</span>`   // a whole expression, e.g. "8 + 5"
    : `<span class="tok op">${sym(x)}</span>`)).join('');
}

/** What fills the "?" box once solved (compare shows >, < or =). */
export function revealText(q) {
  if (q.form === 'compare') return q.answer === '=' ? '=' : q.answer === q.left ? '>' : '<';
  return String(q.answer).replace(/-/g, '−');
}

/** What the speech engine says for a question. */
const sayExpr = (e) => String(e).replace(/ \+ /g, ` ${t('speak.plus')} `).replace(/ - /g, ` ${t('speak.minus')} `);

export function questionSpeech(q) {
  switch (q.form) {
    case 'count': return t('speak.count');
    case 'result': case 'make-ten': case 'sub-across': return t(q.op === '+' ? 'speak.add' : 'speak.sub', q);
    case 'missing-a': return t(q.op === '+' ? 'speak.missingFirstAdd' : 'speak.missingFirstSub', q);
    case 'chain': return t('speak.chain', q);
    case 'compare': return t('speak.compare', { left: sayExpr(q.left), right: sayExpr(q.right) });
    case 'pick-expr': return t('speak.pickExpr', { c: q.c });
    default: return t(q.op === '+' ? 'speak.missingAdd' : 'speak.missingSub', q);
  }
}
export function answerSpeech(q) {
  switch (q.form) {
    case 'count': return t('speak.answerCount', { n: q.answer });
    case 'missing-a': return t(q.op === '+' ? 'speak.answerAdd' : 'speak.answerSub', { a: q.answer, b: q.b, c: q.c });
    case 'chain': return t('speak.answerChain', q);
    case 'compare': return q.answer === '=' ? t('speak.answerSame') : t('speak.answerBigger', { e: sayExpr(q.answer) });
    case 'pick-expr': return t('speak.answerPick', { e: sayExpr(q.answer), c: q.c });
    default: return t(q.op === '+' ? 'speak.answerAdd' : 'speak.answerSub', q);
  }
}
