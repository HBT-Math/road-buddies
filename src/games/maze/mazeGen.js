import { makeQuestion } from '../../math/generator.js';
import { makeDistractors } from '../../math/distractors.js';
import { numericStep } from '../colorByCode/coloring.js';

// Pure maze generators. Each returns a board with exactly one way through:
//   { mode, rows, cols, start, finish, path: [[r,c],...], tiles: {"r,c": {...}}, edges: {"r,c|r,c": label} }
// Moves are always to a 4-neighbour tile.

export const key = (r, c) => `${r},${c}`;
export const edgeKey = (a, b) => [key(...a), key(...b)].sort().join('|');
const neighbours = (r, c, rows, cols) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && x >= 0 && y < rows && x < cols);

/** Random self-avoiding path from top-left to bottom-right, at least `minLen` tiles long. */
export function randomPath(rows, cols, rng, minLen = rows + cols) {
  const goal = key(rows - 1, cols - 1);
  for (let attempt = 0; attempt < 400; attempt++) {
    const path = [[0, 0]];
    const seen = new Set([key(0, 0)]);
    let ok = false;
    const walk = () => {
      const [r, c] = path[path.length - 1];
      if (key(r, c) === goal) return path.length >= minLen;
      for (const [y, x] of rng.shuffle(neighbours(r, c, rows, cols))) {
        if (seen.has(key(y, x))) continue;
        seen.add(key(y, x)); path.push([y, x]);
        if (walk()) return true;
        seen.delete(key(y, x)); path.pop();
        if (path.length > rows * cols) return false;
      }
      return false;
    };
    ok = walk();
    if (ok) return path;
  }
  // fallback: snake path (always valid)
  const p = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) p.push([r, r % 2 ? cols - 1 - i : i]);
  if (rows % 2 === 0) p.push(...[]);
  return p;
}

/** Bank of questions grouped by answer, from a level step. */
function questionBank(step, rng, n = 900) {
  const s = numericStep(step);
  const byAnswer = new Map();
  const all = [];
  for (let i = 0; i < n; i++) {
    const q = makeQuestion(s, rng, all.slice(-1));
    all.push(q);
    if (!byAnswer.has(q.answer)) byAnswer.set(q.answer, []);
    byAnswer.get(q.answer).push(q);
  }
  // prefer equations not used yet in this maze, so the board shows lots of different sums
  const used = new Set();
  const take = (list, ok = () => true) => {
    let fallback = null;
    for (let i = 0; i < 120; i++) {
      const q = rng.pick(list);
      if (!ok(q)) continue;
      fallback ||= q;
      if (!used.has(q.key)) { used.add(q.key); return q; }
    }
    return fallback;
  };
  return {
    answers: [...byAnswer.keys()],
    with: (v) => take(byAnswer.get(v) || [makeQuestion(s, rng, [])]),
    any: () => take(all),
    notIn: (bad) => take(all, (q) => !bad.has(q.answer)),
  };
}

/** Answer Path: boxes with equations; roads between boxes carry numbers. */
export function makePathMaze(cfg, step, range, rng) {
  const { rows, cols } = cfg;
  const path = randomPath(rows, cols, rng, Math.min(rows * cols, rows + cols + 1));
  const bank = questionBank(step, rng);
  const tiles = {};
  const onPath = new Map(path.map((p, i) => [key(...p), i]));
  path.forEach(([r, c], i) => {
    if (i === path.length - 1) { tiles[key(r, c)] = { finish: true }; return; }
    let q = bank.any();
    for (let k = 0; k < 20 && i > 0 && q.answer === tiles[key(...path[i - 1])].q.answer; k++) q = bank.any();
    tiles[key(r, c)] = { q, answer: q.answer };
  });
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!tiles[key(r, c)]) { const q = bank.any(); tiles[key(r, c)] = { q, answer: q.answer }; }
  const edges = {};
  // correct roads along the path
  for (let i = 0; i < path.length - 1; i++) edges[edgeKey(path[i], path[i + 1])] = tiles[key(...path[i])].answer;
  // every other road: a believable wrong number that is not the answer of either box it touches
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (const n of neighbours(r, c, rows, cols)) {
    const ek = edgeKey([r, c], n);
    if (ek in edges) continue;
    const bad = new Set([tiles[key(r, c)].answer, tiles[key(...n)].answer].filter((v) => v !== undefined));
    const near = [...bad][0] ?? rng.int(range.min, range.max);
    let label = null;
    for (const d of rng.shuffle([1, -1, 2, -2, 3, -3, 10, -10])) { const v = near + d; if (v >= range.min && v <= range.max && !bad.has(v)) { label = v; break; } }
    if (label === null) for (let v = range.min; v <= range.max; v++) if (!bad.has(v)) { label = v; break; }
    edges[ek] = label;
  }
  return { mode: 'path', rows, cols, start: path[0], finish: path[path.length - 1], path, tiles, edges };
}

/** Number Chain: tiles hold numbers; the sign says +n / -n; go to the tile you land on. */
export function makeChainMaze(cfg, step, range, rng) {
  const { rows, cols, jump = 3 } = cfg;
  for (let attempt = 0; attempt < 300; attempt++) {
    const path = randomPath(rows, cols, rng, Math.min(rows * cols, rows + cols + 1));
    const values = [rng.int(range.min + 1, range.max - 1)];
    const ops = [];
    let ok = true;
    for (let i = 1; i < path.length; i++) {
      const prev = values[i - 1];
      const options = [];
      for (let d = 1; d <= jump; d++) { if (prev + d <= range.max) options.push(d); if (prev - d >= range.min) options.push(-d); }
      if (!options.length) { ok = false; break; }
      const d = rng.pick(options);
      ops.push(d); values.push(prev + d);
    }
    if (!ok) continue;
    const tiles = {};
    path.forEach((p, i) => { tiles[key(...p)] = { value: values[i], index: i }; });
    // fill the rest; a neighbour of the current tile must never also be the next number
    const forbiddenAt = new Map();
    path.forEach((p, i) => {
      if (i === path.length - 1) return;
      for (const n of neighbours(...p, rows, cols)) {
        if (key(...n) === key(...path[i + 1])) continue;
        if (!forbiddenAt.has(key(...n))) forbiddenAt.set(key(...n), new Set());
        forbiddenAt.get(key(...n)).add(values[i + 1]);
      }
    });
    let clash = false;
    for (const [k, bad] of forbiddenAt) if (tiles[k] && bad.has(tiles[k].value)) clash = true;   // a path tile next to the current one
    if (clash) continue;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = key(r, c);
      if (tiles[k]) continue;
      const bad = forbiddenAt.get(k) || new Set();
      let v = null;
      for (let t = 0; t < 50; t++) { const x = rng.int(range.min, range.max); if (!bad.has(x)) { v = x; break; } }
      tiles[k] = { value: v ?? range.min };
    }
    return { mode: 'chain', rows, cols, start: path[0], finish: path[path.length - 1], path, tiles, ops, values };
  }
  throw new Error('could not build a number chain');
}

/** Target Tiles: only tiles equal to the target are road. Optional second target from the half-way flag. */
export function makeTargetMaze(cfg, step, range, rng) {
  const { rows, cols, changeTarget = false } = cfg;
  const bank = questionBank(step, rng);
  const answers = bank.answers.filter((v) => (bank.answers.length > 4 ? v >= 2 : true));
  const t1 = rng.pick(answers);
  const t2 = changeTarget ? rng.pick(answers.filter((v) => v !== t1)) : t1;
  const path = randomPath(rows, cols, rng, Math.min(rows * cols, rows + cols + 1));
  const flagAt = changeTarget ? Math.floor(path.length / 2) : -1;
  const tiles = {};
  path.forEach((p, i) => {
    const target = changeTarget && i > flagAt ? t2 : t1;   // the flag tile still matches the first target
    const q = bank.with(target);
    tiles[key(...p)] = { q, answer: q.answer, index: i, flag: i === flagAt };
  });
  const bad = new Set([t1, t2]);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (tiles[key(r, c)]) continue;
    const q = bank.notIn(bad) || makeQuestion(numericStep(step), rng, []);
    tiles[key(r, c)] = { q, answer: q.answer };
  }
  return { mode: 'target', rows, cols, start: path[0], finish: path[path.length - 1], path, tiles, targets: [t1, t2], flagAt };
}

export function makeMaze(cfg, step, range, rng) {
  const make = { path: makePathMaze, chain: makeChainMaze, target: makeTargetMaze }[cfg.mode];
  return make(cfg, step, range, rng);
}

/**
 * Pure move check. pos = current index on the path. Returns { ok, to }.
 *   path:   move = edge label chosen (or typed)  -> must be the label on the road to the next box
 *   chain:  move = number of the tile chosen (or typed) -> must be the next number in the chain
 *   target: move = [r, c] of the tile tapped      -> must be the next tile, which equals the current target
 */
export function checkMove(board, pos, move) {
  const here = board.path[pos], next = board.path[pos + 1];
  if (!next) return { ok: false };
  if (board.mode === 'path') {
    return board.edges[edgeKey(here, next)] === move ? { ok: true, to: pos + 1 } : { ok: false };
  }
  if (board.mode === 'chain') {
    return board.values[pos + 1] === move ? { ok: true, to: pos + 1 } : { ok: false };
  }
  // target: allow any path tile further along that is a neighbour and still matches (never a different target)
  const [r, c] = move;
  const k = key(r, c);
  const t = board.tiles[k];
  const adjacent = Math.abs(r - here[0]) + Math.abs(c - here[1]) === 1;
  const current = board.flagAt >= 0 && pos >= board.flagAt ? board.targets[1] : board.targets[0];
  if (!adjacent || !t || t.index === undefined || t.index <= pos || t.answer !== current) return { ok: false };
  return { ok: true, to: t.index };
}
