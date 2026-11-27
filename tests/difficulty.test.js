import { test } from 'node:test';
import assert from 'node:assert/strict';
import { difficulties } from '../src/data/difficulty.js';
import { makeQuestion, evalExpr } from '../src/math/generator.js';
import { makeGateValues } from '../src/math/distractors.js';
import { createRng } from '../src/math/rng.js';

// Rebuild the true value of a question from what the child actually sees.
function check(q, step) {
  const { min, max } = step.numberSet;
  const inRange = (v, what) => assert.ok(Number.isInteger(v) && v >= min && v <= max, `${q.key}: ${what} ${v} out of ${min}..${max}`);
  const nums = q.tokens.filter((x) => typeof x === 'number');
  nums.forEach((v) => inRange(v, 'shown number'));
  switch (q.form) {
    case 'result': case 'make-ten': case 'sub-across':
      assert.equal(q.op === '+' ? q.a + q.b : q.a - q.b, q.answer); break;
    case 'missing-a':
      assert.equal(q.op === '+' ? q.answer + q.b : q.answer - q.b, q.c); break;
    case 'missing-b': case 'bond':
      assert.equal(q.op === '+' ? q.a + q.answer : q.a - q.answer, q.c); break;
    case 'chain':
      assert.equal(q.a + q.b - q.d, q.answer); inRange(q.a + q.b, 'middle step'); break;
    case 'compare': {
      const l = evalExpr(q.left), r = evalExpr(q.right);
      inRange(l, 'left'); inRange(r, 'right');
      assert.equal(q.answer, l === r ? '=' : l > r ? q.left : q.right);
      assert.notEqual(q.left, q.right); break;
    }
    case 'pick-expr': {
      const hits = q.choices.filter((e) => evalExpr(e) === q.c);
      assert.equal(hits.length, 1, `${q.key}: exactly one expression equals ${q.c}`);
      assert.equal(evalExpr(q.answer), q.c);
      q.choices.forEach((e) => { inRange(evalExpr(e), 'choice'); e.split(' ').filter((x) => /\d/.test(x)).forEach((x) => inRange(Number(x), 'choice part')); });
      break;
    }
    default: assert.fail(`unexpected form ${q.form}`);
  }
  if (typeof q.answer === 'number') { inRange(q.answer, 'answer'); }
  if (q.form === 'make-ten') assert.ok(q.a < 10 && q.c > 10, `${q.key} crosses ten`);
  if (q.form === 'sub-across') assert.ok(q.a > 10 && q.c < 10, `${q.key} crosses ten`);
  if (step.minA && ['result'].includes(q.form)) assert.ok(q.a >= step.minA, `${q.key} starts from ${step.minA}`);
}

test('three difficulties with three steps each, ranges 10 / 15 / 20', () => {
  assert.deepEqual(difficulties.map((d) => d.id), ['easy', 'medium', 'hard']);
  assert.deepEqual(difficulties.map((d) => d.range), [10, 15, 20]);
  for (const d of difficulties) {
    assert.equal(d.steps.length, 3);
    for (const s of d.steps) assert.ok(s.numberSet.max <= d.range);
  }
});

for (const d of difficulties) for (const step of d.steps) {
  test(`${step.id}: correct, in range, no negatives, no repeats, fair gates`, () => {
    const rng = createRng(step.id.length * 97);
    const hist = [];
    const seen = new Set();
    for (let i = 0; i < 1500; i++) {
      const q = makeQuestion(step, rng, hist);
      if (hist.length) assert.notEqual(q.key, hist[hist.length - 1].key, 'no repeated question');
      hist.push(q);
      seen.add(q.form);
      check(q, step);
      const gates = makeGateValues(q, rng, { min: 0, max: d.range });
      assert.equal(gates.length, 3);
      assert.equal(new Set(gates.map(String)).size, 3, `${q.key}: gates distinct ${gates}`);
      assert.equal(gates.filter((g) => g === q.answer).length, 1, `${q.key}: answer appears once in ${gates}`);
      for (const g of gates) if (typeof g === 'number') assert.ok(g >= 0 && g <= d.range);
    }
    for (const f of step.forms) assert.ok(seen.has(f), `${step.id} produced ${f}`);
  });
}
