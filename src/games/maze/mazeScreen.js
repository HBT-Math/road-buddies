import { h, iconButton, wait } from '../../ui/dom.js';
import { icons } from '../../ui/icons.js';
import { t } from '../../data/i18n/index.js';
import { getDifficulty, typesAnswer } from '../../data/difficulty.js';
import { getMazeStep, MAZES_PER_STEP } from '../../data/mazes.js';
import { makeMaze, checkMove, key, edgeKey } from './mazeGen.js';
import { equationText } from '../colorByCode/coloring.js';
import { questionSpeech } from '../../ui/signboard.js';
import { createNumberPad } from '../../ui/numberPad.js';
import { getCharacter, faceSvg } from '../../data/characters.js';
import { getColor } from '../../data/colors.js';
import { roundStars, isRoundUnlocked } from '../../save/store.js';
import { starsRow } from '../../ui/screens/map.js';
import { confetti } from '../../ui/confetti.js';
import { createRng } from '../../math/rng.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';

const MODE_ICON = {
  path: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="4" width="14" height="14" rx="3" fill="currentColor"/><rect x="30" y="30" width="14" height="14" rx="3" fill="currentColor"/><path d="M18 11 H37 V30" stroke="currentColor" stroke-width="4" fill="none"/></svg>`,
  chain: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 30 Q16 12 24 30 Q32 12 42 30" stroke="currentColor" stroke-width="4" fill="none"/><path d="M38 24 L42 30 L35 31" stroke="currentColor" stroke-width="4" fill="none"/></svg>`,
  target: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg>`,
};
const FLAG = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 44 V6" stroke="#2B2140" stroke-width="4"/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${13 + c * 7}" y="${7 + r * 7}" width="7" height="7" fill="${(r + c) % 2 ? '#2B2140' : '#fff'}"/>`).join('')).join('')}</svg>`;
const signed = (d) => (d > 0 ? `+${d}` : `−${-d}`);

/** Maze picker for one level step (2 mazes). */
export function mazePick(app, { difficulty, step }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const cfg = getMazeStep(difficulty, step);
  const row = h('div.step-row');
  for (let i = 0; i < MAZES_PER_STEP; i++) {
    const open = isRoundUnlocked(profile, 'maze', difficulty, step, i);
    row.append(h('div.world-stop', {},
      h(`button.world-node.maze-node${open ? '' : '.locked'}`, {
        type: 'button', disabled: !open, 'aria-label': `${t('maze.n', { n: i + 1 })}${open ? '' : ', ' + t('world.locked')}`,
        onclick: () => { sound.play('select'); app.go('maze', { difficulty, step, round: i }); },
      }, h('span.world-num', {}, String(i + 1)), h('span.world-icon', { html: open ? MODE_ICON[cfg.mode] : icons.lock })),
      starsRow(roundStars(profile, 'maze', difficulty, step, i))));
  }
  const el = h('div.screen.menu.maze-pick', {},
    iconButton(icons.back, t('btn.back'), () => app.go('levels', { gameId: 'maze' }), 'corner-home'),
    h('h1.title', {}, h('span.title-icon', { html: MODE_ICON[cfg.mode] }), t(`maze.mode.${cfg.mode}`)),
    h('p.maze-how', {}, t(`maze.how.${cfg.mode}`)),
    row,
    iconButton(icons.book, t('album.title'), () => app.go('album'), 'album-btn'));
  speech.say(t(`maze.how.${cfg.mode}`));
  return { el };
}

export function mazeScreen(app, { difficulty, step, round = 0 }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const diff = getDifficulty(difficulty);
  const cfg = getMazeStep(difficulty, step);
  const rng = createRng();
  const board = makeMaze(cfg, diff.steps[step], { min: 0, max: diff.range }, rng);
  const typed = cfg.mode !== 'target' && diff.answer === 'type';
  const buddy = getCharacter(profile.animal);
  const color = getColor(profile.color);
  let pos = 0;
  let mistakes = 0;
  let finished = false;

  const banner = h('div.maze-banner', { 'aria-live': 'polite' });
  const boardEl = h('div.maze-board');
  const roads = h('div.maze-roads');
  const car = h('div.maze-car', { 'aria-hidden': 'true', style: `--accent:${color.hex};--accent-dark:${color.dark}`, html: faceSvg(buddy, 60) });
  boardEl.append(roads, car);
  const wrap = h('div.maze-wrap', {}, boardEl);
  const pad = createNumberPad({ maxDigits: 2, onChange: (txt) => { const b = banner.querySelector('.q-box'); if (b) b.textContent = txt || '?'; }, onSubmit: (v) => attempt(v, null) });
  const el = h(`div.screen.maze.mode-${cfg.mode}${typed ? '.typing' : ''}`, {},
    iconButton(icons.back, t('btn.back'), () => app.go('mazePick', { difficulty, step }), 'corner-home'),
    banner, wrap, pad.el);

  const tileEls = {};
  const edgeEls = {};
  let S = 80, G = 40;

  function currentTarget() { return board.flagAt >= 0 && pos >= board.flagAt ? board.targets[1] : board.targets[0]; }

  function build() {
    for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
      const k = key(r, c), tile = board.tiles[k];
      const isStart = r === board.start[0] && c === board.start[1];
      const isFinish = r === board.finish[0] && c === board.finish[1];
      let text = '';
      if (board.mode === 'chain') text = String(tile.value);
      else if (tile.finish) text = '';
      else text = equationText(tile.q);
      const b = h(`button.maze-tile${isStart ? '.start' : ''}${isFinish ? '.finish' : ''}${tile.flag ? '.flag' : ''}`, {
        type: 'button', 'data-k': k,
        'aria-label': isFinish && board.mode === 'path' ? t('maze.finish') : board.mode === 'chain' ? text : tile.q ? questionSpeech(tile.q) : text,
        onclick: () => tapTile(r, c),
      }, h('span.maze-text', {}, text));
      if (isFinish) b.append(h('span.maze-flag', { html: FLAG }));
      if (tile.flag) b.append(h('span.maze-switch', { html: FLAG }));
      boardEl.append(b);
      tileEls[k] = b;
    }
    if (board.mode === 'path') {
      for (const ek of Object.keys(board.edges)) {
        const lab = h('button.maze-road', { type: 'button', 'aria-label': String(board.edges[ek]), onclick: () => tapRoad(ek) }, String(board.edges[ek]));
        boardEl.append(lab);
        edgeEls[ek] = lab;
      }
    }
  }

  function layout() {
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const gapF = board.mode === 'path' ? (H < 330 ? 0.48 : 0.62) : (H < 330 ? 0.07 : 0.1);   // tighter on small phones
    S = Math.floor(Math.min(W / (board.cols + gapF * (board.cols - 1)), H / (board.rows + gapF * (board.rows - 1)), 170));
    G = Math.floor(S * gapF);
    const bw = board.cols * S + (board.cols - 1) * G, bh = board.rows * S + (board.rows - 1) * G;
    boardEl.style.width = `${bw}px`; boardEl.style.height = `${bh}px`;
    boardEl.style.setProperty('--S', `${S}px`); boardEl.style.setProperty('--G', `${G}px`);
    const at = (r, c) => [c * (S + G), r * (S + G)];
    for (const [k, b] of Object.entries(tileEls)) {
      const [r, c] = k.split(',').map(Number); const [x, y] = at(r, c);
      b.style.cssText = `left:${x}px;top:${y}px;width:${S}px;height:${S}px`;
    }
    // roads (lines) and their number labels between boxes
    roads.innerHTML = '';
    if (board.mode === 'path') {
      const svgLines = [];
      for (const [ek, lab] of Object.entries(edgeEls)) {
        const [a, b2] = ek.split('|').map((s) => s.split(',').map(Number));
        const [x1, y1] = at(...a), [x2, y2] = at(...b2);
        const cx = (x1 + x2) / 2 + S / 2, cy = (y1 + y2) / 2 + S / 2;
        const size = Math.max(40, Math.min(G * 0.95, S * 0.52));
        lab.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;font-size:${size * 0.42}px`;
        const used = board.path.some((p, i) => i < pos && edgeKey(p, board.path[i + 1]) === ek);
        svgLines.push(`<line x1="${x1 + S / 2}" y1="${y1 + S / 2}" x2="${x2 + S / 2}" y2="${y2 + S / 2}" class="${used ? 'used' : ''}"/>`);
      }
      roads.innerHTML = `<svg width="${bw}" height="${bh}">${svgLines.join('')}</svg>`;
    }
    placeCar(false);
    fitTexts();
  }

  // shrink long equations (e.g. "17 + □ = 20") until they fit inside their tile
  function fitTexts() {
    for (const b of Object.values(tileEls)) {
      const span = b.querySelector('.maze-text');
      span.style.fontSize = '';
      let fs = parseFloat(getComputedStyle(span).fontSize);
      for (let i = 0; i < 16 && fs > 9 && span.scrollWidth > b.clientWidth - 8; i++) { fs *= 0.9; span.style.fontSize = `${fs}px`; }
    }
  }

  function placeCar(animate = true) {
    const [r, c] = board.path[pos];
    car.classList.toggle('no-anim', !animate);
    const cs = Math.max(36, S * 0.42);
    car.style.width = car.style.height = `${cs}px`;
    // the car sits in the corner of its tile so the equation stays readable
    car.style.transform = `translate(${c * (S + G) + S - cs * 0.85}px, ${r * (S + G) - cs * 0.25}px)`;
    for (const [k, b] of Object.entries(tileEls)) {
      const i = board.path.findIndex((p) => key(...p) === k);
      b.classList.toggle('visited', i >= 0 && i < pos);
      b.classList.toggle('here', i === pos);
    }
  }

  function renderBanner(say = true) {
    banner.innerHTML = '';
    const here = board.tiles[key(...board.path[pos])];
    let speak = '';
    if (board.mode === 'path') {
      banner.append(h('span.maze-ico', { html: MODE_ICON.path }), h('span.eq', { dir: 'ltr', html: `<span class="tok expr">${equationText(here.q)}</span><span class="tok op">=</span><span class="tok q-box">?</span>` }));
      speak = questionSpeech(here.q);
    } else if (board.mode === 'chain') {
      const op = board.ops[pos];
      banner.append(h('span.maze-ico', { html: MODE_ICON.chain }), h('span.eq', { dir: 'ltr', html: `<span class="tok num">${board.values[pos]}</span><span class="tok jump">${signed(op)}</span><span class="tok op">=</span><span class="tok q-box">?</span>` }));
      speak = t('maze.sayChain', { n: board.values[pos], op: `${op > 0 ? t('speak.plus') : t('speak.minus')} ${Math.abs(op)}` });
    } else {
      const tg = currentTarget();
      banner.append(h('span.maze-ico', { html: MODE_ICON.target }), h('span.maze-target-label', {}, t('maze.target')), h('span.maze-target', {}, String(tg)));
      speak = t('maze.sayTarget', { n: tg });
    }
    if (say) speech.say(speak);
  }

  function wobble(elm) { if (!elm) return; elm.classList.remove('wobble'); void elm.offsetWidth; elm.classList.add('wobble'); }
  function backUp() { car.classList.remove('backup'); void car.offsetWidth; car.classList.add('backup'); }

  function attempt(move, elm) {
    if (finished) return;
    sound.unlock();
    const r = checkMove(board, pos, move);
    if (!r.ok) {
      mistakes++;
      sound.play('oops');
      wobble(elm); backUp();
      speech.say(t('maze.oops'));
      return;
    }
    sound.play('correct');
    pos = r.to;
    if (board.mode === 'target' && board.flagAt >= 0 && pos === board.flagAt) {
      sound.play('streak');
      banner.classList.add('flash');
      setTimeout(() => banner.classList.remove('flash'), 900);
    }
    layout(); placeCar(true);
    if (pos === board.path.length - 1) { finish(); return; }
    renderBanner();
    if (typed) pad.show();
  }

  function tapRoad(ek) {
    const [a, b] = ek.split('|');
    const here = key(...board.path[pos]);
    if (a !== here && b !== here) { wobble(edgeEls[ek]); sound.play('pop'); return; }   // not a road from this box
    attempt(board.edges[ek], edgeEls[ek]);
  }
  function tapTile(r, c) {
    const here = board.path[pos];
    if (board.mode === 'target') { attempt([r, c], tileEls[key(r, c)]); return; }
    if (board.mode === 'chain') {
      const adjacent = Math.abs(r - here[0]) + Math.abs(c - here[1]) === 1;
      if (!adjacent) { wobble(tileEls[key(r, c)]); sound.play('pop'); return; }
      attempt(board.tiles[key(r, c)].value, tileEls[key(r, c)]);
      return;
    }
    // path mode: tapping a neighbouring box takes the road to it
    const adjacent = Math.abs(r - here[0]) + Math.abs(c - here[1]) === 1;
    if (adjacent) tapRoad(edgeKey(here, [r, c]));
  }

  // arrow keys move towards a neighbouring tile (keyboard fully playable)
  const onKey = (e) => {
    const dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!dir || finished) return;
    e.preventDefault();
    const [r, c] = board.path[pos];
    const n = [r + dir[0], c + dir[1]];
    if (n[0] < 0 || n[1] < 0 || n[0] >= board.rows || n[1] >= board.cols) return;
    if (typed) return;   // typing levels answer with the number pad
    tapTile(...n);
  };
  window.addEventListener('keydown', onKey);

  async function finish() {
    finished = true;
    pad.hide();
    const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
    const { firstTimeDone } = app.store.recordGameRound(profile.id, 'maze', difficulty, step, round, stars, MAZES_PER_STEP);
    const isNew = firstTimeDone && app.store.addSticker(profile.id, `maze:${difficulty}-${step}`);
    sound.play('fanfare');
    banner.innerHTML = ''; banner.append(h('span', {}, t('maze.done')));
    confetti(el, { reduced: app.reducedMotion() || app.store.settings.calm });
    speech.say(t('maze.done'), buddy.voiceStyle);
    await wait(900);
    el.append(h('div.cbc-result', {}, h('div.cbc-result-card', {},
      h('h2', {}, t('maze.done')),
      h('div.result-stars', {}, starsRow(stars)),
      isNew ? h('div.unlock-title', {}, t('maze.newTrophy')) : null,
      h('div.result-buttons', {},
        iconButton(icons.replay, t('btn.replay'), () => app.go('maze', { difficulty, step, round }), 'big'),
        iconButton(icons.book, t('album.title'), () => app.go('album'), 'big'),
        round + 1 < MAZES_PER_STEP
          ? iconButton(icons.next, t('btn.next'), () => app.go('maze', { difficulty, step, round: round + 1 }), 'big primary')
          : iconButton(icons.map, t('btn.back'), () => app.go('mazePick', { difficulty, step }), 'big primary')))));
  }

  build();
  const ro = new ResizeObserver(() => layout());
  ro.observe(wrap);
  requestAnimationFrame(() => { layout(); renderBanner(); if (typed) pad.show(); });
  return { el, destroy() { ro.disconnect(); pad.destroy(); window.removeEventListener('keydown', onKey); }, debug: { board, get pos() { return pos; } } };
}
