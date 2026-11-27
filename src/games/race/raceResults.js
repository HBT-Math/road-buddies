import { h, iconButton } from '../../ui/dom.js';
import { icons } from '../../ui/icons.js';
import { t } from '../../data/i18n/index.js';
import { getCup, RACES_PER_CUP } from '../../data/cups.js';
import { getRacer, pickLine } from '../../data/racers.js';
import { getExtra } from '../../data/rewards.js';
import { stickerArt } from '../../data/stickers.js';
import { getCharacter } from '../../data/characters.js';
import { starsRow } from '../../ui/screens/map.js';
import { profileBadge } from '../../ui/screens/profiles.js';
import { confetti } from '../../ui/confetti.js';
import { racerSvg } from './cars.js';
import { carPreview } from './cupScreen.js';
import { ordinal } from './raceScreen.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';

export function raceResults(app, { difficulty, step, race, players, turn, results }) {
  const cup = getCup(difficulty, step);
  const all = app.store.profiles();
  const nextTurn = turn + 1 < players.length ? turn + 1 : null;
  const cards = h('div.race-result-cards');
  let reaction = null;

  for (const r of results) {
    const p = all.find((x) => x.id === r.profileId);
    if (!p) continue;
    const main = h('div.race-result-main', {},
      h(`div.medal.p${r.place}`, {}, ordinal(r.place)),
      profileBadge(p, 70),
      h('div.result-stars', {}, starsRow(r.stars)),
      h('div.small', {}, t('race.gates', { n: r.correct, of: r.total })),
      r.showClock ? h('div.small', {}, `${r.time.toFixed(1)} s${r.newBest ? ' · ' + t('race.newBest') : ''}`) : null,
      r.photoFinish ? h('div.small', {}, t('race.photoFinish')) : null);
    const card = h('div.race-result', {}, main);
    if (r.newExtra) {
      const ex = getExtra(r.newExtra);
      card.append(h('div.unlock', {}, h('div.unlock-title', {}, t('race.newExtra')), carPreview(p, 150), h('div', {}, ex.name)));
    }
    cards.append(card);
    // a rival reacts (always kind)
    if (results.length === 1) {
      const racer = r.place === 1 ? getRacer(cup.storyRacer) : getRacer(r.winner || cup.rivals[0]);
      reaction = { racer, text: pickLine(racer, r.place === 1 ? 'lose' : 'win') };
    }
  }
  const last = results[results.length - 1];
  const story = last?.newSticker ? h('div.story-page', {},
    h('div.unlock-title', {}, t('race.newPage')),
    h('div.story-art', { html: stickerArt[cup.sticker] || '' }),
    h('p', {}, cup.page)) : null;

  const p0 = all.find((x) => x.id === players[0]);
  const buttons = h('div.result-buttons', {});
  if (nextTurn !== null) {
    const p2 = all.find((x) => x.id === players[nextTurn]);
    buttons.append(h('button.btn.big.primary.turn-btn', { type: 'button', 'aria-label': t('race.yourTurn', { name: getCharacter(p2.animal).name }),
      onclick: () => app.go('race', { difficulty, step, race, players, turn: nextTurn, results }) }, profileBadge(p2, 70)));
  } else {
    buttons.append(iconButton(icons.replay, t('btn.replay'), () => { if (p0) app.store.setActive(p0.id); app.go('race', { difficulty, step, race, players }); }, 'big'));
    buttons.append(iconButton(icons.map, t('race.cup'), () => app.go('raceCup', { difficulty, step }), 'big'));
    if (race + 1 < RACES_PER_CUP) buttons.append(iconButton(icons.next, t('race.nextRaceBtn'), () => app.go('race', { difficulty, step, race: race + 1, players }), 'big primary'));
  }
  const el = h('div.screen.menu.results.race-results', {},
    h('h1.title', {}, nextTurn !== null ? t('race.turnDone') : t('race.finished')),
    reaction ? h('div.cup-story', {}, h('span.intro-face', { html: racerSvg(reaction.racer, 90) }), h('div.intro-bubble', {}, h('b', {}, reaction.racer.name), h('p', {}, reaction.text))) : null,
    cards, story, buttons);
  setTimeout(() => confetti(el, { reduced: app.reducedMotion() || app.store.settings.calm }), 50);
  results[results.length - 1].stars && sound.play('star');
  if (reaction) speech.say(reaction.text, reaction.racer.voiceStyle);
  else if (nextTurn !== null) speech.say(t('race.yourTurn', { name: getCharacter(all.find((x) => x.id === players[nextTurn]).animal).name }));
  return { el };
}
