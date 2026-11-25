import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion } from '../src/math/generator.js';
import { makeDistractors, makeGateValues } from '../src/math/distractors.js';
import { createRng } from '../src/math/rng.js';
import { packs } from '../src/data/packs/index.js';

// Extra world shapes the generator must already support (used by Phase 2 worlds).
const extraWorlds = [
  { id: 'add10', skill: 'add10', forms: ['result'], operations: ['+'], numberSet: { min: 0, max: 10 } },
  { id: 'sub10', skill: 'sub10', forms: ['result'], operations: ['-'], numberSet: { min: 0, max: 10 } },
  { id: 'mixed', skill: 'mixed10', forms: ['result', 'missing-b'], operations: ['+', '-'], numberSet: { min: 0, max: 10 } },
  { id: 'bond', skill: 'bonds10', forms: ['bond'], operations: ['+'], numberSet: { min: 0, max: 10 }, bondTotal: 10 },
];
const cases = [
  ...packs.flatMap((p) => p.worlds.map((w) => ({ w, range: p.range }))),
  ...extraWorlds.map((w) => ({ w, range: 10 })),
];
const N = 2000;

for (const { w, range } of cases) {
  test(`${w.id}: numbers stay in range and are never negative`, () => {
    const rng = createRng(42);
    const hist = [];
    for (let i = 0; i < N; i++) {
      const q = makeQuestion(w, rng, hist);
      hist.push(q);
      for (const v of [q.a, q.b, q.c, q.answer].filter((v) => v !== null)) {
        assert.ok(Number.isInteger(v), `integer ${v}`);
        assert.ok(v >= w.numberSet.min && v <= w.numberSet.max, `${q.key}: ${v} outside range`);
      }
      // arithmetic is actually correct
      if (q.op === '+') assert.equal(q.a + q.b, q.c, q.key);
      if (q.op === '-') assert.equal(q.a - q.b, q.c, q.key);
      if (q.form === 'result') assert.equal(q.answer, q.c);
      if (q.form === 'missing-b' || q.form === 'bond') assert.equal(q.answer, q.b);
      if (q.form === 'bond') assert.equal(q.c, w.bondTotal);
    }
  });

  test(`${w.id}: no duplicate consecutive questions`, () => {
    const rng = createRng(7);
    const hist = [];
    for (let i = 0; i < N; i++) {
      const q = makeQuestion(w, rng, hist);
      if (hist.length) assert.notEqual(q.key, hist[hist.length - 1].key);
      hist.push(q);
    }
  });

  test(`${w.id}: distractors are plausible, distinct, in range and never the answer`, () => {
    const rng = createRng(99);
    for (let i = 0; i < N; i++) {
      const q = makeQuestion(w, rng, []);
      const d = makeDistractors(q, rng, { min: 0, max: range });
      assert.equal(d.length, 2);
      assert.equal(new Set(d).size, 2);
      for (const v of d) {
        assert.notEqual(v, q.answer);
        assert.ok(v >= 0 && v <= range);
      }
      // at least one distractor is off by one whenever an off-by-one exists in range
      const nearOk = [q.answer - 1, q.answer + 1].some((v) => v >= 0 && v <= range);
      if (nearOk) assert.ok(d.some((v) => Math.abs(v - q.answer) === 1), `${q.key} -> ${d}`);
      const gates = makeGateValues(q, rng, { min: 0, max: range });
      assert.equal(gates.length, 3);
      assert.equal(gates.filter((v) => v === q.answer).length, 1);
    }
  });
}

test('subtraction distractor includes the wrong-operation result when in range', () => {
  const q = { form: 'result', op: '-', a: 4, b: 1, c: 3, answer: 3 };
  let seen = false;
  for (let s = 0; s < 50; s++) {
    const d = makeDistractors(q, createRng(s), { min: 0, max: 10 });
    if (d.includes(5)) seen = true;
  }
  assert.ok(seen, '4 - 1 should sometimes offer 5 (4 + 1)');
});

test('the same seed gives the same questions', () => {
  const w = packs[0].worlds[1];
  const a = [], b = [];
  const r1 = createRng(5), r2 = createRng(5);
  for (let i = 0; i < 20; i++) { a.push(makeQuestion(w, r1, a).key); b.push(makeQuestion(w, r2, b).key); }
  assert.deepEqual(a, b);
});

for (const { w, range } of cases) {
  test(`${w.id}: harder levels still respect the range`, () => {
    for (const level of [1, 2]) {
      const rng = createRng(level * 13);
      const hist = [];
      for (let i = 0; i < 500; i++) {
        const q = makeQuestion(w, rng, hist, { level });
        hist.push(q);
        for (const v of [q.a, q.b, q.c].filter((v) => v !== null)) assert.ok(v >= w.numberSet.min && v <= w.numberSet.max, q.key);
        assert.ok(q.answer >= 0);
      }
    }
  });
}
