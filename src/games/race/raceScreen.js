import { h, iconButton, wait } from '../../ui/dom.js';
import { icons } from '../../ui/icons.js';
import { t } from '../../data/i18n/index.js';
import { characters, getCharacter, faceSvg, bodySvg } from '../../data/characters.js';
import { getColor } from '../../data/colors.js';
import { getDifficulty, typesAnswer } from '../../data/difficulty.js';
import { createNumberPad } from '../../ui/numberPad.js';
import { getCup, RACES_PER_CUP } from '../../data/cups.js';
import { getRacer, pickLine } from '../../data/racers.js';
import { raceThemes } from '../../data/themes/raceThemes.js';
import { getExtra, nextExtra } from '../../data/rewards.js';
import { createRace, RACE } from './raceWorld.js';
import { drawRivalRear, racerSvg } from './cars.js';
import { pitStop } from './pitStop.js';
import { createRenderer } from '../../engine/road.js';
import { createInput } from '../../engine/input.js';
import { createLoop } from '../../engine/loop.js';
import { createParticles } from '../../engine/particles.js';
import { createRng } from '../../math/rng.js';
import { createSignboard, questionSpeech, answerSpeech } from '../../ui/signboard.js';
import { svgToImage } from '../../ui/draw.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';
import { music } from '../../audio/music.js';

const POSES = ['idle', 'wave', 'cheer'];
const FLAME = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 C30 14 38 18 38 30 A14 14 0 0 1 10 30 C10 22 16 18 18 10 C20 16 22 18 24 20 Z" fill="#FF8C1A" stroke="#2B2140" stroke-width="3" stroke-linejoin="round"/><path d="M24 22 C28 28 32 30 32 34 A8 8 0 0 1 16 34 C16 30 20 28 24 22Z" fill="#FFD43B"/></svg>`;
export const ordinal = (n) => t(`race.place${n}`);

/**
 * params: { difficulty, step (cup), race (0..2), players: [profileId, ...], turn, results }
 * With 2 players the tablet is passed between turns; each child's stars are saved to their own profile.
 */
export function raceScreen(app, params) {
  const { difficulty, step, race: raceIdx = 0, turn = 0, results = [] } = params;
  const players = params.players || [app.store.active()?.id];
  const profile = app.store.profiles().find((p) => p.id === players[turn]) || app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const diff = getDifficulty(difficulty);
  const stepCfg = { ...diff.steps[step], pitTotal: diff.pitStopTotal };
  const cup = getCup(difficulty, step);
  const theme = raceThemes[cup.theme] || raceThemes.sunny;
  const buddy = getCharacter(profile.animal);
  const color = getColor(profile.color);
  const rivals = cup.rivals.map(getRacer);
  const fans = characters.filter((c) => c.id !== buddy.id);
  const settings = app.store.settings;
  const reduced = app.reducedMotion();
  const calm = settings.calm;
  const showClock = diff.timer === 'optional' && settings.hardTimer;
  const rng = createRng();

  // ---------- DOM ----------
  const canvas = h('canvas.road', { 'aria-hidden': 'true' });
  const placeEl = h('div.race-place', { 'aria-live': 'polite' }, '');
  const clockEl = showClock ? h('div.race-clock', {}, '0:00') : null;
  const lapTrack = h('div.lap-track');
  const lapLabel = h('div.lap-label');
  const lapBar = h('div.lap-bar', { 'aria-hidden': 'true' }, lapLabel, lapTrack);
  const hud = h('div.hud-left', {},
    iconButton(icons.home, t('btn.back'), () => app.go('raceCup', { difficulty, step }), 'chrome-btn'), placeEl, clockEl);
  const sign = createSignboard({ frames: 1, onSpeak: () => speakQuestion() });
  sign.setVisible(false);
  const chat = h('div.race-chat', { 'aria-live': 'polite' });
  const btnL = iconButton(icons.left, t('btn.left'), () => steer(-1), 'steer steer-left');
  const btnR = iconButton(icons.right, t('btn.right'), () => steer(1), 'steer steer-right');
  const btnGo = iconButton(icons.up, t('btn.go'), () => race.go(), 'steer race-go');
  btnGo.hidden = true;
  const nitroPips = h('span.nitro-pips');
  const btnNitro = h('button.nitro-btn', { type: 'button', 'aria-label': t('race.nitro'), onclick: () => fireNitro() },
    h('span.nitro-icon', { html: FLAME }), h('span.nitro-text', {}, t('race.nitro')), nitroPips);
  const big = h('div.race-big', { 'aria-live': 'assertive' });
  const overlay = h('div.race-overlay');
  const live = h('div.sr-only', { 'aria-live': 'polite' });
  // Medium and Hard: type the answer on the number pad (the digits appear in the "?" box)
  const pad = createNumberPad({
    maxDigits: 2,
    onChange: (text) => { const box = sign.el.querySelector('.q-box'); if (box && !box.classList.contains('solved')) box.textContent = text || '?'; },
    onSubmit: (v) => { race.answer(v); },
  });
  const el = h('div.screen.play.race', {}, canvas, hud, lapBar, sign.el, chat, big, btnL, btnR, btnGo, btnNitro, overlay, pad.el, live);

  // ---------- engine ----------
  const renderer = createRenderer(canvas, theme);
  const fx = createParticles();
  fx.setReduced(reduced || calm);
  let faceImg = null;
  const fanImgs = {};
  let destroyed = false;
  let lastChat = -10;
  let questionIdx = 0;

  // roadside decorations positioned along the track (absolute positions)
  const types = theme.scenery;
  const totalW = types.reduce((a, k) => a + (k.weight || 1), 0);
  const pickType = () => { let r = rng.next() * totalW; for (const k of types) { r -= k.weight || 1; if (r <= 0) return k; } return types[0]; };
  const scenery = [];
  for (const side of [-1, 1]) for (let d = -2; d < 60; d += 2.6 + rng.next() * 3) {
    const k = pickType();
    scenery.push({ side, pos: d, kind: k.type, x: side * (k.far ? 5 + rng.next() * 1.5 : 2.9 + rng.next() * 2.4) });
  }

  const race = createRace({
    step: stepCfg, difficulty, range: diff.range, rivals, rng,
    typed: (q) => typesAnswer(diff, q),
    hooks: {
      onQuestion(q, values, idx, typed) {
        questionIdx = idx;
        sign.setQuestion(q, { mode: 'hidden' });
        sign.setVisible(true);
        btnGo.hidden = typed;
        if (typed) { pad.show(); el.classList.add('typing'); } else { pad.hide(); el.classList.remove('typing'); }
        speakQuestion();
        live.textContent = `${questionSpeech(q)} ${values.join(', ')}`;
      },
      onAnswer(q, { correct, nitroKind, streak, lane }) {
        btnGo.hidden = true;
        pad.hide(); el.classList.remove('typing');
        const disc = renderer.gateDisc(lane) || { cx: renderer.car.x, cy: renderer.car.y - 80, r: 30 };
        if (correct) {
          sign.reveal(q);
          sound.play(nitroKind === 'super' ? 'streak' : 'correct');
          fx.sparkles(disc.cx, disc.cy, disc.r, calm ? 8 : nitroKind === 'super' ? 32 : 18);
          showBig(nitroKind === 'super' ? t('race.superNitro') : t('race.gotNitro'), 'nitro');
          const fan = rivals.find((r) => r.id === 'pip') || rivals[0];
          if (streak >= 2 || rng.next() < 0.5) say(fan, pickLine(fan, 'cheer', rng.next));
        } else {
          sound.play('oops');
          sign.reveal(q);
          fx.puffs(disc.cx, disc.cy, disc.r);
          speech.say(answerSpeech(q), { pitch: 1.1 });
          live.textContent = answerSpeech(q);
        }
        renderNitro();
        setTimeout(() => sign.setVisible(false), correct ? 1100 : 2200);
      },
      onNitro(kind) {
        sound.play('whoosh');
        if (kind === 'super') sound.play('streak');
        renderNitro();
      },
      onPass(racer, kind) { if (race.state.t - lastChat > 4) say(racer, pickLine(racer, kind, rng.next)); },
      onCount(n) { showBig(String(n), 'count'); sound.play('pop'); speech.say(String(n)); },
      onGo() { showBig(t('race.go'), 'go'); sound.play('horn'); music.start({ ...theme.music, tempo: theme.music.tempo * 1.2 }, { calm }); },
      async onPit(total) {
        sign.setVisible(false);
        btnGo.hidden = true;
        showBig(t('race.pitStop'), 'pit');
        await wait(900);
        if (destroyed) return true;
        pad.hide(); el.classList.remove('typing');
        return pitStop(overlay, { total, rng, onStep: () => sound.play('pop') });
      },
      onFinish({ place, photoFinish }) {
        sign.setVisible(false); btnGo.hidden = true;
        sound.play('fanfare');
        showBig(ordinal(place), 'finish');
        if (photoFinish) setTimeout(() => takePhoto(place), 250);
      },
      onDone(result) { finishRace(result); },
    },
  });

  function steer(d) { sound.unlock(); if (race.steer(d)) sound.play('lane'); }
  function fireNitro() { sound.unlock(); if (!race.useNitro()) { sound.play('pop'); btnNitro.classList.remove('wiggle'); void btnNitro.offsetWidth; btnNitro.classList.add('wiggle'); } }
  function speakQuestion() { const g = race.current(); if (g?.q) speech.say(questionSpeech(g.q), { pitch: 1.1 }); }
  function renderNitro() {
    const n = race.state.player.nitro;
    nitroPips.innerHTML = Array.from({ length: RACE.maxNitro }, (_, i) => `<span class="pip ${n[i] || ''}"></span>`).join('');
    btnNitro.classList.toggle('ready', n.length > 0);
    btnNitro.classList.toggle('super', n.includes('super'));
  }
  function showBig(text, kind) {
    big.textContent = text;
    big.className = `race-big show ${kind}`;
    clearTimeout(showBig.timer);
    showBig.timer = setTimeout(() => { big.className = 'race-big'; }, kind === 'finish' ? 2400 : 900);
  }
  function say(racer, text, { speak = true } = {}) {
    if (!text) return;
    lastChat = race.state.t;
    chat.innerHTML = '';
    chat.append(h('span.chat-face', { html: racerSvg(racer, 64) }), h('span.chat-text', {}, h('b', {}, racer.name), ' ', text));
    chat.classList.remove('show'); void chat.offsetWidth; chat.classList.add('show');
    clearTimeout(say.timer);
    say.timer = setTimeout(() => chat.classList.remove('show'), 3400);
    // never talk over a question
    if (speak && !race.asking) speech.say(text, racer.voiceStyle, { queue: true });
  }
  function takePhoto(place) {
    const img = h('img', { src: canvas.toDataURL('image/jpeg', 0.7), alt: '' });
    const photo = h('div.photo-finish', {}, h('div.photo-frame', {}, img, h('div.photo-caption', {}, `${t('race.photoFinish')} ${ordinal(place)}`)));
    el.append(photo);
    sound.play('star');
  }

  // ---------- intro: two story bubbles, then 3-2-1 ----------
  async function intro() {
    const host = getRacer('wheelie');
    const story = getRacer(cup.storyRacer);
    const lines = [[host, raceIdx === 0 ? pickLine(host, 'intro') : t('race.nextRace', { n: raceIdx + 1 })], [story, cup.goal]];
    let skip = false;
    const card = h('div.intro-card');
    const skipBtn = iconButton(icons.next, t('btn.skip'), () => { skip = true; }, 'intro-skip');
    const box = h('div.race-intro', {}, h('div.intro-title', {}, cup.title, h('span.intro-race', {}, ` · ${t('race.raceN', { n: raceIdx + 1 })}`)), card, skipBtn);
    overlay.append(box);
    for (const [racer, text] of lines) {
      if (skip || destroyed) break;
      card.innerHTML = '';
      card.append(h('span.intro-face', { html: racerSvg(racer, 120) }), h('div.intro-bubble', {}, h('b', {}, racer.name), h('p', {}, text)));
      speech.say(text, racer.voiceStyle);
      for (let w = 0; w < 40 && !skip && !destroyed; w++) await wait(100);  // about 4 s per bubble, or tap to skip
    }
    speech.stop();
    box.remove();
    if (!destroyed) race.begin();
  }

  // ---------- finish ----------
  function finishRace(result) {
    music.stop();
    const store = app.store;
    const { stepDone, firstTimeDone } = store.recordGameRound(profile.id, 'race', difficulty, step, raceIdx, result.stars, RACES_PER_CUP);
    const extra = nextExtra(profile.extras?.owned);
    let newExtra = null;
    if (extra && store.unlockExtra(profile.id, extra.id)) { newExtra = extra.id; store.wearExtra(profile.id, extra.slot, extra.id); }
    let newSticker = null;
    if (firstTimeDone && store.addSticker(profile.id, `race:${cup.id}`)) newSticker = cup.id;
    const newBest = showClock ? store.saveBestTime(profile.id, `race:${cup.id}:${raceIdx}`, result.time) : false;
    const winner = result.place === 1 ? null : rivals.slice().sort((a, b) => race.state.rivals.find((r) => r.id === b.id).pos - race.state.rivals.find((r) => r.id === a.id).pos)[0];
    const all = [...results, { ...result, profileId: profile.id, newExtra, newSticker, stepDone, newBest, winner: winner?.id || null, showClock }];
    setTimeout(() => app.go('raceResults', { difficulty, step, race: raceIdx, players, turn, results: all }), 900);
  }

  // ---------- input, loop ----------
  const input = createInput(canvas, {
    steer: (d) => steer(d),
    go: () => race.go(),
    tap: (x, y) => {
      sound.unlock();
      const lane = renderer.hitTest(x, y);
      if (lane !== null && race.asking && !race.current()?.typed) race.chooseLane(lane);
      else steer(x < renderer.size.W / 2 ? -1 : 1);
    },
  });
  const onKey = (e) => { if (e.key === 'Shift' && !e.repeat) { e.preventDefault(); fireNitro(); } };
  window.addEventListener('keydown', onKey);

  function drawExtras(ctx, { x, y, w, t: tm }) {
    const p = race.state.player;
    ctx.save(); ctx.translate(x, y);
    for (const id of Object.values(profile.extras?.worn || {})) getExtra(id)?.draw(ctx, w);
    if (p.boost > 0 && p.boostKind !== null) {
      const big = p.boostKind === 'super' ? 1.6 : p.boostKind === 'auto' ? 0.7 : 1.1;
      const flick = reduced ? 1 : 0.85 + 0.15 * Math.sin(tm * 30);
      for (const sx of [-1, 1]) {
        const fx0 = sx * w * 0.26, fy0 = -w * 0.12;
        ctx.fillStyle = '#FF8C1A';
        ctx.beginPath(); ctx.ellipse(fx0, fy0 + w * 0.12 * big * flick, w * 0.07 * big, w * 0.16 * big * flick, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE066';
        ctx.beginPath(); ctx.ellipse(fx0, fy0 + w * 0.08 * big * flick, w * 0.035 * big, w * 0.09 * big * flick, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    if (p.boost > 0 && p.boostKind !== 'auto' && !reduced) {   // speed lines at the sides
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
      const { W, H } = renderer.size;
      for (let i = 0; i < 6; i++) {
        const yy = H * (0.5 + ((i * 0.13 + tm * 1.7) % 0.5)), side = i % 2 ? W * 0.06 : W * 0.94;
        ctx.beginPath(); ctx.moveTo(side, yy); ctx.lineTo(side, yy + H * 0.08); ctx.stroke();
      }
    }
  }

  function view() {
    const s = race.state, p = s.player;
    const g = race.current();
    // typing mode: the gates show "?" until answered, then the right answer on the car's lane
    const typedValues = g?.typed ? (g.result ? [0, 1, 2].map((i) => (i === g.result.lane + 1 ? g.q.answer : '')) : ['?', '?', '?']) : null;
    const gateView = g && g.q && g.pos - p.pos < RACE.showAt + 6 ? { d: g.pos - p.pos, values: typedValues || g.values, result: g.result, reveal: g.reveal, q: g.q } : null;
    for (const sc of scenery) {
      if (sc.pos - p.pos < -2.5) {
        const k = pickType();
        Object.assign(sc, { pos: sc.pos + 62.5, kind: k.type, x: sc.side * (k.far ? 5 + rng.next() * 1.5 : 2.9 + rng.next() * 2.4) });
      }
    }
    const finishD = s.length - p.pos;
    return {
      t: s.t, offset: p.pos, carX: p.x, lane: p.lane, speed: s.phase === 'race' || s.phase === 'finish' ? p.speed : 0,
      phase: race.asking && !g?.committed ? 'hold' : 'race',
      gate: gateView,
      scenery: scenery.map((sc) => ({ d: sc.pos - p.pos, x: sc.x, kind: sc.kind })),
      friendsMood: g?.result?.correct ? 'cheer' : 'wave',
      finishD: finishD < 60 ? finishD : null,
    };
  }

  function updateHud() {
    const s = race.state;
    const place = s.place ?? race.place;
    const txt = ordinal(place);
    if (placeEl.textContent !== txt) { placeEl.textContent = txt; placeEl.className = `race-place p${place}`; }
    const lap = Math.min(s.laps, Math.floor(s.player.pos / RACE.lapLength) + 1);
    lapLabel.textContent = t('race.lap', { n: lap, of: s.laps });
    const pct = (x) => `${Math.max(0, Math.min(100, (x / s.length) * 100))}%`;
    if (!lapTrack.children.length) {
      for (let i = 1; i < s.laps; i++) lapTrack.append(h('span.lap-tick', { style: `left:${(i / s.laps) * 100}%` }));
      for (const r of s.rivals) lapTrack.append(h('span.lap-dot', { 'data-id': r.id, style: `background:${r.racer.color};border-color:${r.racer.dark}` }));
      lapTrack.append(h('span.lap-dot.me', { 'data-id': 'me', style: `background:${color.hex}`, html: faceSvg(buddy, 30) }));
    }
    for (const dot of lapTrack.querySelectorAll('.lap-dot')) {
      const id = dot.dataset.id;
      dot.style.left = pct(id === 'me' ? s.player.pos : s.rivals.find((r) => r.id === id).pos);
    }
    if (clockEl && s.startT) {
      const secs = Math.floor((s.finishT ?? s.t) - s.startT);
      clockEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    }
  }

  const loop = createLoop((dt) => { race.update(dt); fx.update(dt); }, () => {
    const s = race.state;
    const sprites = s.rivals.map((r) => ({
      d: r.pos - s.player.pos,
      draw: (ctx, proj, tm) => {
        const d = r.pos - s.player.pos;
        if (d < -1.6 || d > 62) return;
        const p = proj(r.x, d);
        drawRivalRear(ctx, r.racer, p.x, p.y, p.u * 0.9, tm, Math.abs(d) < 4 ? 'wow' : 'happy');
      },
    }));
    const fanPair = [fans[questionIdx % fans.length], fans[(questionIdx + 2) % fans.length]].map((c) => fanImgs[c.id]).filter(Boolean);
    renderer.draw(view(), { faceImg, accent: color.hex, accentDark: color.dark, friendImgs: fanPair, reduced, effects: fx, sprites, carExtra: drawExtras });
    updateHud();
  });

  const ro = new ResizeObserver(() => renderer.resize());
  ro.observe(canvas);
  Promise.all([
    svgToImage(faceSvg(buddy, 240)).then((img) => { faceImg = img; }),
    ...fans.flatMap((c) => POSES.map((p) => svgToImage(bodySvg(c, p, 180)).then((img) => { (fanImgs[c.id] ||= {})[p] = img; }))),
  ]).then(() => {
    if (destroyed) return;
    renderer.resize();
    renderNitro();
    loop.start();
    if (players.length > 1) showBig(getCharacter(profile.animal).name, 'count');
    intro();
  });

  return {
    el,
    destroy() {
      destroyed = true;
      loop.destroy(); input.destroy(); ro.disconnect(); speech.stop(); music.stop(); pad.destroy();
      window.removeEventListener('keydown', onKey);
    },
    debug: { race, renderer },
  };
}
