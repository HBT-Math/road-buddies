import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeMaze, checkMove, key, edgeKey } from '../src/games/maze/mazeGen.js';
import { mazeSteps } from '../src/data/mazes.js';
import { difficulties } from '../src/data/difficulty.js';
import { createRng } from '../src/math/rng.js';

const adj = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const nbrs = ([r, c], b) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && x >= 0 && y < b.rows && x < b.cols);

for (const d of difficulties) {
  mazeSteps[d.id].forEach((cfg, i) => {
    test(`${d.id} step ${i + 1} (${cfg.mode}): valid, solvable, exactly one way`, () => {
      const range = { min: 0, max: d.range };
      for (let seed = 0; seed < 40; seed++) {
        const b = makeMaze(cfg, d.steps[i], range, createRng(seed * 13 + i));
        // the path is a real walk from start to finish with no repeats
        assert.deepEqual(b.path[0], [0, 0]);
        assert.deepEqual(b.path[b.path.length - 1], [cfg.rows - 1, cfg.cols - 1]);
        assert.equal(new Set(b.path.map((p) => key(...p))).size, b.path.length);
        for (let k = 1; k < b.path.length; k++) assert.ok(adj(b.path[k - 1], b.path[k]));
        assert.equal(Object.keys(b.tiles).length, cfg.rows * cfg.cols);
        let pos = 0, steps = 0;
        while (pos < b.path.length - 1 && steps++ < 100) {
          const here = b.path[pos];
          if (b.mode === 'path') {
            const answer = b.tiles[key(...here)].answer;
            const roads = nbrs(here, b).filter((n) => b.edges[edgeKey(here, n)] === answer);
            assert.equal(roads.length, 1, `seed ${seed}: one road with ${answer}`);
            for (const n of nbrs(here, b)) { const v = b.edges[edgeKey(here, n)]; assert.ok(v >= 0 && v <= d.range, `label ${v}`); }
            const r = checkMove(b, pos, answer); assert.ok(r.ok); pos = r.to;
          } else if (b.mode === 'chain') {
            const next = b.values[pos + 1];
            assert.equal(next - b.values[pos], b.ops[pos]);
            assert.ok(Math.abs(b.ops[pos]) <= cfg.jump && b.ops[pos] !== 0);
            const hits = nbrs(here, b).filter((n) => b.tiles[key(...n)].value === next);
            assert.equal(hits.length, 1, `seed ${seed}: one tile with ${next}`);
            for (const t of Object.values(b.tiles)) assert.ok(t.value >= 0 && t.value <= d.range);
            assert.equal(checkMove(b, pos, next + 1).ok, false);
            const r = checkMove(b, pos, next); assert.ok(r.ok); pos = r.to;
          } else {
            const target = b.flagAt >= 0 && pos >= b.flagAt ? b.targets[1] : b.targets[0];
            const ok = nbrs(here, b).filter((n) => checkMove(b, pos, n).ok);
            assert.ok(ok.length >= 1, 'a way forward');
            for (const n of nbrs(here, b)) {
              const t = b.tiles[key(...n)];
              if (t.index === undefined) assert.notEqual(t.answer, target, 'off-path tiles never equal the target');
            }
            pos = checkMove(b, pos, ok[0]).to;
          }
        }
        assert.equal(pos, b.path.length - 1, 'reached the finish');
        if (cfg.changeTarget) assert.notEqual(b.targets[0], b.targets[1]);
      }
    });
  });
}

test('mazes show many different equations', () => {
  const d = difficulties[2];
  const b = makeMaze(mazeSteps.hard[1], d.steps[1], { min: 0, max: 20 }, createRng(3));
  const keys = Object.values(b.tiles).map((t) => t.q?.key).filter(Boolean);
  assert.ok(new Set(keys).size >= keys.length * 0.7, `${new Set(keys).size} different of ${keys.length}`);
});
