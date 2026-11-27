import { h, iconButton, wait } from '../../ui/dom.js';
import { icons } from '../../ui/icons.js';
import { t } from '../../data/i18n/index.js';
import { getDifficulty } from '../../data/difficulty.js';
import { getPicture, pictureSvg, stepPictures, finishedSvg } from './pictures.js';
import { buildColoring, equationText } from './coloring.js';
import { renderTokens, questionSpeech } from '../../ui/signboard.js';
import { roundStars, isRoundUnlocked } from '../../save/store.js';
import { starsRow } from '../../ui/screens/map.js';
import { confetti } from '../../ui/confetti.js';
import { createRng } from '../../math/rng.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';

// Color by Code. Tap a part of the picture: a card shows its equation big with the crayons
// (each crayon shows its number). Pick the crayon whose number is the answer and the part fills in.
// Fast way: tap a crayon first, then tap every part with that answer. Wrong: a gentle wobble, try again.

/** Picture picker for one level step (2 pictures). */
export function colorPick(app, { difficulty, step }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const ids = stepPictures[step] || stepPictures[0];
  const row = h('div.cbc-pick-row');
  ids.forEach((id, i) => {
    const pic = getPicture(id);
    const stars = roundStars(profile, 'colorByCode', difficulty, step, i);
    const open = isRoundUnlocked(profile, 'colorByCode', difficulty, step, i) || i === 0;
    row.append(h('div.world-stop', {},
      h(`button.cbc-thumb${open ? '' : '.locked'}`, {
        type: 'button', disabled: !open, 'aria-label': open ? pic.name : t('world.locked'),
        onclick: () => { sound.play('select'); app.go('colorByCode', { difficulty, step, round: i }); },
        html: open ? (stars ? finishedSvg(pic) : pictureSvg(pic)) : icons.lock,
      }),
      starsRow(stars)));
  });
  const el = h('div.screen.menu.cbc-pick', {},
    iconButton(icons.back, t('btn.back'), () => app.go('levels', { gameId: 'colorByCode' }), 'corner-home'),
    h('h1.title', {}, t('cbc.pick')),
    row,
    iconButton(icons.book, t('album.title'), () => app.go('album'), 'album-btn'));
  speech.say(t('cbc.pick'));
  return { el };
}

export function colorScreen(app, { difficulty, step, round = 0 }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const diff = getDifficulty(difficulty);
  const pic = getPicture((stepPictures[step] || stepPictures[0])[round]);
  const rng = createRng();
  const puzzle = buildColoring(pic, diff.steps[step], rng);
  const fills = {};
  const misses = {};
  let mistakes = 0;
  let crayon = null;        // selected legend entry (fast way)
  let openRegion = null;    // region shown in the solve card
  const reduced = app.reducedMotion();

  const legend = h('div.cbc-legend', { role: 'toolbar', 'aria-label': t('cbc.crayons') });
  const art = h('div.cbc-art');
  const progress = h('div.cbc-progress');
  const card = h('div.cbc-card', { hidden: true, role: 'dialog' });
  const el = h('div.screen.cbc', {},
    iconButton(icons.back, t('btn.back'), () => app.go('colorPick', { difficulty, step }), 'corner-home'),
    legend, art, progress, card);

  const crayonBtn = (l, onclick, cls = '') => h(`button.crayon${cls}`, {
    type: 'button', style: `--c:${l.color}`, 'aria-label': `${t('cbc.color')} ${l.value}`, onclick,
  }, h('span.crayon-tip'), h('span.crayon-num', {}, String(l.value)));

  function renderLegend() {
    legend.innerHTML = '';
    for (const l of puzzle.legend) {
      const b = crayonBtn(l, () => {
        sound.play('select');
        crayon = crayon === l ? null : l;
        renderLegend();
        if (crayon) speech.say(String(l.value));
      });
      b.setAttribute('aria-pressed', String(crayon === l));
      legend.append(b);
    }
  }
  function labels() {
    // unsolved parts show their equation; solved parts show the answer (so colour is never the only clue)
    return Object.fromEntries(puzzle.regions.map((rg) => [rg.id, fills[rg.id] ? String(rg.value) : equationText(rg.q)]));
  }
  function renderArt() {
    art.innerHTML = pictureSvg(pic, fills, { labels: labels() });
    art.querySelectorAll('.cbc-region').forEach((g) => {
      const rg = puzzle.regions.find((x) => x.id === g.dataset.r);
      if (fills[rg.id]) g.classList.add('done');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', fills[rg.id] ? '-1' : '0');
      g.setAttribute('aria-label', fills[rg.id] ? String(rg.value) : questionSpeech(rg.q));
      g.addEventListener('click', () => tapRegion(rg, g));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapRegion(rg, g); } });
    });
    fitLabels();
    const done = Object.keys(fills).length;
    progress.textContent = `${done} / ${puzzle.regions.length}`;
  }
  // shrink each equation until it fits inside its part of the picture
  function fitLabels() {
    for (const text of art.querySelectorAll('.cbc-label')) {
      const g = text.previousElementSibling;
      if (!g?.getBBox) continue;
      const box = g.getBBox();
      let fs = Number(text.getAttribute('font-size'));
      for (let i = 0; i < 12 && fs > 8; i++) {
        const tb = text.getBBox();
        if (tb.width <= box.width * 0.86 && tb.height <= box.height * 0.9) break;
        fs = Math.max(8, Math.floor(fs * 0.88));
        text.setAttribute('font-size', String(fs));
      }
    }
  }
  function wobble(g) {
    if (!g) return;
    g.classList.remove('wobble'); void g.getBoundingClientRect(); g.classList.add('wobble');
  }
  function tryColor(rg, l, g) {
    if (l.value === rg.value) {
      fills[rg.id] = pic.colors[rg.slot];
      sound.play('correct');
      closeCard();
      renderArt();
      if (Object.keys(fills).length === puzzle.regions.length) finish();
      return true;
    }
    mistakes++;
    misses[rg.id] = (misses[rg.id] || 0) + 1;
    sound.play('oops');
    wobble(g || art.querySelector(`[data-r="${rg.id}"]`));
    speech.say(t('cbc.tryAgain'));
    return false;
  }
  function tapRegion(rg, g) {
    sound.unlock();
    if (fills[rg.id]) return;
    if (crayon) { tryColor(rg, crayon, g); return; }
    openCard(rg);
  }
  function openCard(rg) {
    openRegion = rg;
    card.innerHTML = '';
    const q = rg.q;
    const choices = h('div.cbc-card-crayons');
    const hintSlot = (misses[rg.id] || 0) >= 2 ? rg.slot : null;   // after 2 tries, the right crayon glows
    for (const l of puzzle.legend) {
      const b = crayonBtn(l, () => { if (!tryColor(rg, l)) { b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 500); openCard(rg); } }, l.slot === hintSlot ? '.hint' : '');
      choices.append(b);
    }
    card.append(
      h('button.cbc-close', { type: 'button', 'aria-label': t('btn.back'), html: icons.back, onclick: closeCard }),
      h('div.eq.cbc-eq', { dir: 'ltr', html: renderTokens(q) }),
      h('div.cbc-card-hint', {}, t('cbc.pickColor')),
      choices);
    card.hidden = false;
    speech.say(questionSpeech(q));
  }
  function closeCard() { card.hidden = true; openRegion = null; }

  async function finish() {
    const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;   // progress-friendly: finishing always earns a star
    app.store.recordGameRound(profile.id, 'colorByCode', difficulty, step, round, stars, 2);
    const isNew = app.store.addSticker(profile.id, `cbc:${pic.id}`);
    sound.play('fanfare');
    confetti(el, { reduced: reduced || app.store.settings.calm });
    art.classList.add('finished');
    speech.say(t('cbc.done'));
    await wait(reduced ? 300 : 1200);
    const result = h('div.cbc-result', {},
      h('div.cbc-result-card', {},
        h('h2', {}, t('cbc.done')),
        h('div.result-stars', {}, starsRow(stars)),
        isNew ? h('div.unlock-title', {}, t('cbc.newSticker')) : null,
        h('div.result-buttons', {},
          iconButton(icons.replay, t('btn.replay'), () => app.go('colorByCode', { difficulty, step, round }), 'big'),
          iconButton(icons.book, t('album.title'), () => app.go('album'), 'big'),
          round === 0
            ? iconButton(icons.next, t('btn.next'), () => app.go('colorByCode', { difficulty, step, round: 1 }), 'big primary')
            : iconButton(icons.map, t('btn.back'), () => app.go('colorPick', { difficulty, step }), 'big primary'))));
    el.append(result);
  }

  renderLegend();
  renderArt();
  speech.say(t('cbc.start'));
  return { el };
}
