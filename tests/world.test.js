import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/engine/world.js';
import { createRng } from '../src/math/rng.js';
import { pack1 } from '../src/data/packs/pack1.js';

function run(world, choose, maxSteps = 40000) {
  let done = null;
  const answers = [];
  const w = createWorld({
    pack: pack1, world, rng: createRng(3),
    hooks: {
      onHold() { choose(w); },
      onAnswer(q, r) { answers.push(r); },
      onExplain: () => Promise.resolve(),
      onDone(r) { done = r; },
    },
  });
  return (async () => {
    for (let i = 0; i < maxSteps && !done; i++) {
      w.update(1 / 30);
      if (i % 50 === 0) await Promise.resolve();
    }
    return { done, answers };
  })();
}

test('always choosing the right gate finishes the world with 3 stars', async () => {
  const { done, answers } = await run(pack1.worlds[1], (w) => {
    const g = w.state.gate;
    w.chooseLane(g.values.indexOf(g.q.answer) - 1);
  });
  assert.ok(done, 'world finished');
  assert.equal(done.stars, 3);
  assert.equal(answers.length, 10);
});

test('wrong answers never end the game: the question returns once, then moves on', async () => {
  const { done, answers } = await run(pack1.worlds[2], (w) => {
    const g = w.state.gate;
    w.chooseLane(g.values.findIndex((v) => v !== g.q.answer) - 1);
  });
  assert.ok(done, 'world still finishes');
  assert.equal(done.stars, 1, 'finishing always earns a star');
  assert.equal(answers.length, 20, '10 questions, each retried once');
  assert.ok(answers.filter((a) => a.retry).length === 10);
});

test('the road waits at the gates with no input (no timers)', () => {
  let held = false;
  const w = createWorld({ pack: pack1, world: pack1.worlds[0], rng: createRng(1), hooks: { onHold() { held = true; } } });
  for (let i = 0; i < 30 * 120; i++) w.update(1 / 30); // two minutes
  assert.ok(held);
  assert.equal(w.state.phase, 'hold');
  assert.equal(w.state.gatesDone, 0);
});

import { placementWorld, placementPack } from '../src/data/placement.js';
test('placement runs 6 gates with no explanation or retries', async () => {
  let done = null, explained = 0;
  const w = createWorld({ pack: placementPack, world: placementWorld, rng: createRng(2), hooks: {
    onHold() { const g = w.state.gate; w.chooseLane(g.values.findIndex((v) => v !== g.q.answer) - 1); },
    onExplain() { explained++; }, onDone(r) { done = r; } } });
  for (let i = 0; i < 30000 && !done; i++) w.update(1 / 30);
  assert.ok(done);
  assert.equal(explained, 0);
  assert.equal(done.log.length, 6);
  assert.ok(done.log.every((x) => !x.correct && x.tag));
});
