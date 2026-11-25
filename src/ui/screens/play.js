import { h, iconButton, wait } from '../dom.js';
import { icons } from '../icons.js';
import { getPack } from '../../data/packs/index.js';
import { characters, getCharacter, faceSvg, bodySvg } from '../../data/characters.js';
import { getColor } from '../../data/colors.js';
import { t } from '../../data/i18n/index.js';
import { createWorld } from '../../engine/world.js';
import { createRenderer } from '../../engine/road.js';
import { createInput } from '../../engine/input.js';
import { createLoop } from '../../engine/loop.js';
import { createParticles } from '../../engine/particles.js';
import { createRng } from '../../math/rng.js';
import { createSignboard, questionSpeech, answerSpeech, renderTokens } from '../signboard.js';
import { createTenFrame } from '../tenframe.js';
import { svgToImage } from '../draw.js';
import { sound } from '../../audio/sound.js';
import { helpFor } from '../../math/mastery.js';
import { placementPack, placementWorld, scorePlacement } from '../../data/placement.js';
import { speech } from '../../audio/speech.js';
import { music } from '../../audio/music.js';

const POSES = ['idle', 'wave', 'cheer', 'hold'];

export function play(app, { worldIndex = 0, placement = false }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('profiles')); return { el: h('div.screen') }; }
  const pack = placement ? placementPack : getPack(profile.pack);
  const world = placement ? placementWorld : pack.worlds[worldIndex];
  const theme = app.theme();
  const buddy = getCharacter(profile.animal);
  const color = getColor(profile.color);
  const others = characters.filter((c) => c.id !== buddy.id);
  const settings = app.store.settings;
  const reduced = app.reducedMotion();
  const calm = settings.calm;

  // ---------- DOM ----------
  const canvas = h('canvas.road', { 'aria-hidden': 'true' });
  const rewardCount = h('b', {}, '0');
  const rewardBox = h('div.reward-total.hud-reward', {}, h('span.reward-icon', { html: theme.reward.icon }), rewardCount);
  const hud = h('div.hud-left', {}, iconButton(icons.home, t('btn.home'), () => app.go('map'), 'chrome-btn'), rewardBox);
  const progress = h('div.progress', { 'aria-hidden': 'true' });
  const live = h('div.sr-only', { 'aria-live': 'polite' });
  const bubble = h('div.bubble', { 'aria-hidden': 'true' });
  const onStep = (k) => sound.play(k === 'slide' ? 'slide' : 'pop');
  const sign = createSignboard({ frames: pack.frames, onStep, onSpeak: () => speakQuestion() });
  const btnL = iconButton(icons.left, t('btn.left'), () => w.steer(-1), 'steer steer-left');
  const btnR = iconButton(icons.right, t('btn.right'), () => w.steer(1), 'steer steer-right');
  const btnGo = iconButton(icons.up, t('btn.go'), () => w.go(), 'steer steer-go');
  btnGo.hidden = true;

  const exTf = createTenFrame({ frames: pack.frames, onStep, stepMs: calm ? 650 : 480 });
  exTf.setBig(true);
  const exEq = h('div.eq', { dir: 'ltr' });
  const exHolder = h('div.explain-holder');
  const explain = h('div.explain', { hidden: true }, h('div.explain-card', {}, exHolder, h('div', {}, exEq, exTf.el)));

  const el = h('div.screen.play', {}, canvas, hud, sign.el, progress, bubble, explain, btnL, btnR, btnGo, live);

  // ---------- engine ----------
  const renderer = createRenderer(canvas, theme);
  const fx = createParticles();
  fx.setReduced(reduced || calm);
  let faceImg = null;
  const bodyImgs = {};
  let friends = [];
  let holder = others[0];
  let shownRewards = 0;
  let destroyed = false;

  const speakQuestion = (prefix = '') => {
    const q = w.state.question;
    if (q) speech.say(`${prefix} ${questionSpeech(q)}`.trim(), holder.voiceStyle);
  };
  function showBubble(text) {
    bubble.innerHTML = `${icons.star}<span>${text}</span>`;
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 1700);
  }
  let bubbleTimer = 0;
  function renderProgress() {
    progress.innerHTML = Array.from({ length: world.gatesPerWorld }, (_, i) =>
      `<span class="${i < w.state.gatesDone ? 'done' : i === w.state.gatesDone ? 'now' : ''}">${i < w.state.gatesDone ? icons.star : ''}</span>`).join('');
  }

  const w = createWorld({
    pack, world, calm, rng: createRng(),
    levelFor: (skill) => (placement ? 0 : app.store.skill(profile.id, skill)?.level || 0),
    hooks: {
      onQuestion(q, { retry, index }) {
        holder = others[index % others.length];
        friends = [others[(index + 1) % others.length], others[(index + 3) % others.length]].map((c) => bodyImgs[c.id]);
        // adaptive help from this child's mastery of the skill; a retry always gets full hints
        const help = placement ? { mode: 'hidden' } : helpFor(app.store.skill(profile.id, world.skill), world.tenFrameMode, q.form);
        sign.setQuestion(q, {
          holderChar: holder,
          mode: retry ? 'shown' : help.mode,
          big: retry || help.big,
          labels: retry || help.labels,
          stagger: !retry && help.firstCounters,
        });
        renderProgress();
        speakQuestion(retry ? t('speak.tryAgain') : '');
        live.textContent = `${questionSpeech(q)} ${w.state.gate.values.join(', ')}`;
      },
      onHold() { btnGo.hidden = false; },
      onCommit() { btnGo.hidden = true; el.classList.remove('nudge'); sound.play(theme.sounds.go); },
      onSteer() { sound.play(theme.sounds.lane); },
      onStreak(n) {
        // a little extra party for 3, 6, 9 first-try answers in a row
        setTimeout(() => {
          sound.play(theme.sounds.streak);
          const c = renderer.car;
          fx.sparkles(c.x, c.y - c.w * 0.6, c.w * 0.35, calm ? 6 : 30);
          const line = t('cheer.streak', { n });
          showBubble(line);
          speech.say(line, buddy.voiceStyle, { queue: true });
        }, 900);
      },
      onFinish() {
        sign.setVisible(false);
        btnGo.hidden = true;
        setTimeout(() => sound.play(theme.sounds.done), 1200);
      },
      onPrompt() { el.classList.add('nudge'); speakQuestion(t('speak.pickGate')); },
      onAnswer(q, { correct, lane }) {
        if (!placement) app.store.recordAnswer(profile.id, world.skill, correct, world.hintPolicy);
        const disc = renderer.gateDisc(lane) || { cx: renderer.car.x, cy: renderer.car.y - 100, r: 40 };
        if (correct) {
          sound.play(theme.sounds.correct);
          sign.reveal(q);
          fx.sparkles(disc.cx, disc.cy, disc.r, calm ? 8 : 22);
          const target = rewardBox.querySelector('.reward-icon').getBoundingClientRect();
          const base = canvas.getBoundingClientRect();
          fx.fly(disc.cx, disc.cy, target.left - base.left + target.width / 2, target.top - base.top + target.height / 2, disc.r * 0.6,
            theme.reward.draw, () => {
              rewardCount.textContent = String(++shownRewards);
              rewardBox.classList.remove('bump'); void rewardBox.offsetWidth; rewardBox.classList.add('bump');
              sound.play(theme.sounds.collect);
            });
          const line = t(buddy.cheerLines[Math.floor(Math.random() * buddy.cheerLines.length)]);
          showBubble(line);
          setTimeout(() => speech.say(line, buddy.voiceStyle), 250);
          live.textContent = line;
        } else {
          sound.play(theme.sounds.oops);
          fx.puffs(disc.cx, disc.cy, disc.r);
        }
      },
      async onExplain(q) {
        btnGo.hidden = true;
        exHolder.innerHTML = bodySvg(holder, 'wave', 110);
        exEq.innerHTML = renderTokens(q);
        explain.hidden = false;
        speech.say(t('oops.gentle'), holder.voiceStyle);
        await wait(700);
        await exTf.animateSolution(q, { speed: calm ? 0.8 : 1 });
        const box = exEq.querySelector('.q-box');
        if (box) { box.textContent = String(q.answer); box.classList.add('solved'); }
        speech.say(answerSpeech(q), holder.voiceStyle);
        live.textContent = answerSpeech(q);
        await wait(2200);
        explain.hidden = true;
        exTf.clear();
      },
      onDone(result) {
        if (placement) {
          app.store.savePlacement(profile.id, { ...scorePlacement(result.log), at: new Date().toISOString().slice(0, 10) });
          app.go('results', { placement: true, result });
          return;
        }
        app.store.recordWorld(profile.id, pack.id, world.id, result);
        app.go('results', { worldIndex, result });
      },
    },
  });

  const input = createInput(canvas, {
    steer: (d) => { sound.unlock(); w.steer(d); },
    go: () => w.go(),
    tap: (x, y) => {
      sound.unlock();
      const lane = renderer.hitTest(x, y);
      const ph = w.state.phase;
      if (lane !== null && (ph === 'hold' || ph === 'approach')) w.chooseLane(lane);
      else w.steer(x < renderer.size.W / 2 ? -1 : 1);
    },
  });

  const loop = createLoop((dt) => { w.update(dt); fx.update(dt); }, () => {
    renderer.draw(w.state, { faceImg, accent: color.hex, accentDark: color.dark, friendImgs: friends, reduced, effects: fx });
    const c = renderer.car;
    bubble.style.transform = `translate(${c.x}px, ${c.y - c.w * 1.25}px)`;
  });

  const ro = new ResizeObserver(() => renderer.resize());
  ro.observe(canvas);

  // preload art, then start driving
  Promise.all([
    svgToImage(faceSvg(buddy, 240)).then((img) => { faceImg = img; }),
    ...others.flatMap((c) => POSES.map((p) => svgToImage(bodySvg(c, p, 180)).then((img) => { (bodyImgs[c.id] ||= {})[p] = img; }))),
  ]).then(() => {
    if (destroyed) return;
    renderer.resize();
    renderProgress();
    loop.start();
    music.start(theme.music, { calm });
    speech.say(t('speak.letsGo'), buddy.voiceStyle);
  });

  return {
    el,
    destroy() { destroyed = true; loop.destroy(); input.destroy(); ro.disconnect(); speech.stop(); music.stop(); exTf.destroy(); },
    debug: { world: w, renderer },
  };
}
