import { h, iconButton } from '../../ui/dom.js';
import { icons } from '../../ui/icons.js';
import { t } from '../../data/i18n/index.js';
import { getCup, RACES_PER_CUP } from '../../data/cups.js';
import { getRacer } from '../../data/racers.js';
import { carExtras } from '../../data/rewards.js';
import { getCharacter, faceSvg } from '../../data/characters.js';
import { getColor } from '../../data/colors.js';
import { carsTheme } from '../../data/themes/cars.js';
import { roundStars, isRoundUnlocked } from '../../save/store.js';
import { starsRow } from '../../ui/screens/map.js';
import { profileBadge } from '../../ui/screens/profiles.js';
import { racerSvg } from './cars.js';
import { svgToImage } from '../../ui/draw.js';
import { speech } from '../../audio/speech.js';
import { sound } from '../../audio/sound.js';

/** Draw the child's car with its worn extras onto a small canvas (garage + results). */
export function carPreview(profile, size = 220) {
  const c = h('canvas.car-preview', { width: String(size), height: String(Math.round(size * 0.9)), 'aria-hidden': 'true' });
  const col = getColor(profile.color);
  svgToImage(faceSvg(getCharacter(profile.animal), 240)).then((img) => {
    const ctx = c.getContext('2d');
    const w = size * 0.72, x = size / 2, y = size * 0.86;
    carsTheme.vehicle(ctx, { x, y, w, accent: col.hex, accentDark: col.dark, faceImg: img });
    ctx.save(); ctx.translate(x, y);
    for (const id of Object.values(profile.extras?.worn || {})) carExtras.find((e) => e.id === id)?.draw(ctx, w);
    ctx.restore();
  });
  return c;
}

export function cupScreen(app, { difficulty, step }) {
  const profile = app.store.active();
  if (!profile) { queueMicrotask(() => app.go('home')); return { el: h('div.screen') }; }
  const cup = getCup(difficulty, step);
  const story = getRacer(cup.storyRacer);

  function chooseRace(i) {
    sound.play('select');
    const others = app.store.profiles().filter((p) => p.id !== profile.id);
    if (!app.store.settings.twoPlayers || !others.length) { app.go('race', { difficulty, step, race: i, players: [profile.id] }); return; }
    // 2 players taking turns: pick player 2 (or race alone)
    const pick = h('div.race-overlay.who-two', {}, h('div.pit-card', {},
      h('div.pit-title', {}, t('race.player2')),
      h('div.player-row', {},
        ...others.map((o) => h('button.player-pick', { type: 'button', 'aria-label': getCharacter(o.animal).name,
          onclick: () => app.go('race', { difficulty, step, race: i, players: [profile.id, o.id] }) }, profileBadge(o, 84))),
        h('button.player-pick.solo', { type: 'button', 'aria-label': t('race.solo'),
          onclick: () => app.go('race', { difficulty, step, race: i, players: [profile.id] }) }, profileBadge(profile, 84), h('span.solo-tag', {}, '1')))));
    el.append(pick);
  }

  const races = h('div.step-row');
  for (let i = 0; i < RACES_PER_CUP; i++) {
    const open = isRoundUnlocked(profile, 'race', difficulty, step, i);
    races.append(h('div.world-stop', { style: `--i:${i}` },
      h(`button.world-node.race-node${open ? '' : '.locked'}`, {
        type: 'button', disabled: !open, 'aria-label': `${t('race.raceN', { n: i + 1 })}${open ? '' : ', ' + t('world.locked')}`,
        onclick: () => chooseRace(i),
      }, h('span.world-num', {}, String(i + 1)), h('span.world-icon', { html: open ? icons.flagIcon : icons.lock })),
      starsRow(roundStars(profile, 'race', difficulty, step, i))));
  }

  // garage: tap an unlocked extra to wear it (tap again to take it off)
  const owned = carExtras.filter((e) => profile.extras?.owned?.includes(e.id));
  const garage = h('div.garage');
  const preview = h('div.garage-car');
  function renderGarage() {
    preview.innerHTML = ''; preview.append(carPreview(profile, 200));
    garage.querySelectorAll('.extra-btn').forEach((b) => b.setAttribute('aria-pressed', String(profile.extras?.worn?.[b.dataset.slot] === b.dataset.id)));
  }
  for (const e of owned) {
    garage.append(h('button.extra-btn', { type: 'button', 'data-id': e.id, 'data-slot': e.slot, 'aria-label': e.name, title: e.name,
      onclick: () => { sound.play('pop'); app.store.wearExtra(profile.id, e.slot, e.id); renderGarage(); } }, e.name));
  }

  const el = h('div.screen.menu.cup', {},
    iconButton(icons.back, t('btn.back'), () => app.go('levels', { gameId: 'race' }), 'corner-home'),
    h('h1.title', {}, cup.title),
    h('div.cup-story', {}, h('span.intro-face', { html: racerSvg(story, 110) }), h('div.intro-bubble', {}, h('b', {}, story.name), h('p', {}, cup.goal))),
    h('div.cup-rivals', { 'aria-label': t('race.rivals') }, ...cup.rivals.map((id) => { const r = getRacer(id); return h('span.cup-rival', { html: racerSvg(r, 70), title: r.name }); })),
    races,
    owned.length ? h('div.garage-wrap', {}, preview, garage) : null,
    iconButton(icons.book, t('album.title'), () => app.go('album'), 'album-btn'));
  renderGarage();
  speech.say(cup.goal, story.voiceStyle);
  return { el };
}
