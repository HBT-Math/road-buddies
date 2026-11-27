import { gameArt } from './art.js';

// Every game in the hub. Adding a game = one entry here plus its own folder; no other game changes.
//   id:        save key for stars and level
//   levels:    true -> uses the shared Easy / Medium / Hard config (data/difficulty.js) and the level picker
//   ready:     false shows the card with a "coming soon" badge
//   open(app): what happens when the card is tapped
//   start(app, { difficulty, step }): starts a round (games with levels)
export const games = [
  { id: 'roadBuddies', nameKey: 'game.roadBuddies', art: gameArt.roadBuddies, ready: true, levels: false, open: (app) => app.go('map') },
  { id: 'race', nameKey: 'game.race', art: gameArt.race, ready: true, levels: true,
    start: (app, { difficulty, step }) => app.go('raceCup', { difficulty, step }) },
  { id: 'maze', nameKey: 'game.maze', art: gameArt.maze, ready: true, levels: true,
    start: (app, { difficulty, step }) => app.go('mazePick', { difficulty, step }) },
  { id: 'colorByCode', nameKey: 'game.colorByCode', art: gameArt.colorByCode, ready: true, levels: true,
    start: (app, { difficulty, step }) => app.go('colorPick', { difficulty, step }) },
];

export const getGame = (id) => games.find((g) => g.id === id);
export function openGame(app, game) {
  if (game.levels) app.go('levels', { gameId: game.id });
  else game.open(app);
}
