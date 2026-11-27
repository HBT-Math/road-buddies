// Maze settings per difficulty and level step (2 mazes per step). Pure data.
// mode: 'path'   = Answer Path: solve your box, take the road labelled with the answer
//       'chain'  = Number Chain: jump by the sign (+3 / -2) to the tile you land on
//       'target' = Target Tiles: only drive through tiles that equal the target
// changeTarget: Target Tiles get a new target half way (flag tile).
// jump: biggest jump in a Number Chain.
export const mazeSteps = {
  easy: [
    { mode: 'path', rows: 3, cols: 3 },
    { mode: 'chain', rows: 4, cols: 4, jump: 3 },
    { mode: 'target', rows: 4, cols: 4 },
  ],
  medium: [
    { mode: 'path', rows: 4, cols: 4 },
    { mode: 'target', rows: 5, cols: 5 },
    { mode: 'chain', rows: 5, cols: 5, jump: 6 },
  ],
  hard: [
    { mode: 'path', rows: 4, cols: 5 },
    { mode: 'target', rows: 5, cols: 6, changeTarget: true },
    { mode: 'chain', rows: 5, cols: 6, jump: 9 },
  ],
};
export const MAZES_PER_STEP = 2;
export const getMazeStep = (difficulty, step) => (mazeSteps[difficulty] || mazeSteps.easy)[step] || mazeSteps.easy[0];
