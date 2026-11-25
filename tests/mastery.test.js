import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateSkill, helpFor, emptySkill } from '../src/math/mastery.js';
import { makeQuestion } from '../src/math/generator.js';
import { createRng } from '../src/math/rng.js';

const run = (answers, s = emptySkill()) => answers.reduce((acc, a) => updateSkill(acc, a), s);

test('two wrong answers in a row switch on the big ten frame with counters first', () => {
  const s = run([true, false, false]);
  assert.equal(s.boost, true);
  const h = helpFor(s, 'tap-to-reveal', 'result');
  assert.deepEqual([h.mode, h.big, h.labels, h.firstCounters], ['shown', true, true, true]);
});

test('one wrong answer alone does not trigger boost', () => {
  assert.equal(run([false, true, false]).boost, false);
});

test('five right in a row fades hints and raises difficulty', () => {
  const s = run([true, true, true, true, true]);
  assert.equal(s.level, 1);
  assert.equal(helpFor(s, 'shown', 'result').mode, 'tap-to-reveal');
  assert.equal(run(Array(10).fill(true)).level, 2);
  assert.equal(run(Array(40).fill(true)).level, 2, 'capped at 2');
});

test('boost lowers the level and clears after 3 right', () => {
  let s = run(Array(10).fill(true));
  s = run([false, false], s);
  assert.equal(s.level, 1);
  assert.equal(s.boost, true);
  s = run([true, true, true], s);
  assert.equal(s.boost, false);
});

test('counting always keeps the ten frame visible', () => {
  const s = run(Array(10).fill(true));
  assert.equal(helpFor(s, 'shown', 'count').mode, 'shown');
});

test('higher levels give bigger numbers but stay in range', () => {
  const w = { skill: 'add10', forms: ['result'], operations: ['+', '-'], numberSet: { min: 0, max: 10 } };
  const avg = (level) => {
    const rng = createRng(11); let sum = 0;
    for (let i = 0; i < 500; i++) {
      const q = makeQuestion(w, rng, [], { level });
      for (const v of [q.a, q.b, q.c]) assert.ok(v >= 0 && v <= 10);
      if (level === 2) assert.ok(q.b >= 2 || q.a < 2, `no +1/-1 at level 2: ${q.key}`);
      sum += q.op === '+' ? q.c : q.a;
    }
    return sum / 500;
  };
  const [l0, l1, l2] = [avg(0), avg(1), avg(2)];
  assert.ok(l0 < l1 && l1 < l2, `${l0} < ${l1} < ${l2}`);
});

import { scorePlacement, placementWorld } from '../src/data/placement.js';
import { makeQuestion as mq } from '../src/math/generator.js';

test('placement questions are fixed and correct', () => {
  const hist = [];
  for (let i = 0; i < 6; i++) { const q = mq(placementWorld, createRng(1), hist); hist.push(q); }
  assert.deepEqual(hist.map((q) => q.answer), [7, 6, 4, 13, 8, 14]);
  assert.equal(hist[2].tokens.join(' '), '6 + ? = 10');
});

test('placement suggestion', () => {
  const log = (a) => a.map((c, i) => ({ tag: i < 3 ? 'within10' : 'within20', correct: !!c }));
  assert.equal(scorePlacement(log([1, 1, 1, 1, 1, 0])).pack, 'pack2');
  assert.deepEqual(scorePlacement(log([1, 1, 1, 0, 0, 0])), { within10: 3, within20: 0, pack: 'pack1', startWorld: 3 });
  assert.equal(scorePlacement(log([1, 0, 0, 0, 0, 0])).startWorld, 1);
  assert.equal(scorePlacement(log([0, 0, 0, 0, 0, 0])).startWorld, 0);
});
