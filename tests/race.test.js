import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRace, RACE } from '../src/games/race/raceWorld.js';
import { createRng } from '../src/math/rng.js';
import { racers } from '../src/data/racers.js';
import { cups } from '../src/data/cups.js';
import { difficulties } from '../src/data/difficulty.js';

// Simulate a race. skill = chance of choosing the right gate; useNitro = press nitro when available.
async function simulate({ seed = 1, skill = 1, useNitro = true, diff = 'easy', stepIdx = 0, pit = true } = {}) {
  const d = difficulties.find((x) => x.id === diff);
  const rng = createRng(seed), pick = createRng(seed + 1000);
  let done = null, maxGap = 0, pitCalls = 0, questions = 0;
  const race = createRace({
    step: { ...d.steps[stepIdx], pitTotal: d.pitStopTotal }, difficulty: diff, range: d.range,
    rivals: racers.slice(0, 3), rng,
    hooks: {
      onQuestion() { questions++; },
      onPit: async () => { pitCalls++; return true; },
      onDone(r) { done = r; },
    },
  });
  race.begin();
  for (let i = 0; i < 60 * 600 && !done; i++) {
    const s = race.state;
    const g = race.current();
    if (s.phase === 'race' && g && g.q && !g.result && race.asking) {
      const right = g.values.indexOf(g.q.answer) - 1;
      const wrong = [-1, 0, 1].find((l) => l !== right);
      race.chooseLane(pick.next() < skill ? right : wrong);
    }
    if (useNitro && s.player.nitro.length) race.useNitro();
    race.update(1 / 60);
    if (s.phase === 'race') for (const r of s.rivals) maxGap = Math.max(maxGap, Math.abs(r.pos - s.player.pos));
    if (i % 600 === 0) await Promise.resolve();
  }
  return { done, maxGap, pitCalls, questions, race };
}

test('a race always finishes, with a pit stop and several Nitro Gates', async () => {
  const { done, pitCalls, questions } = await simulate({ skill: 0.6 });
  assert.ok(done, 'race finished');
  assert.equal(pitCalls, 1);
  assert.ok(questions >= 7, `${questions} gates`);
  assert.ok(done.time > 40 && done.time < 200, `race time ${done.time.toFixed(1)}s`);
});

test('never a lose screen: wrong answers still finish with at least 1 star', async () => {
  const { done } = await simulate({ skill: 0, useNitro: false });
  assert.ok(done);
  assert.equal(done.stars, 1);
  assert.equal(done.correct, 0);
});

test('stars come from right answers, not from position', async () => {
  const { done } = await simulate({ skill: 1 });
  assert.equal(done.stars, 3);
  assert.equal(done.correct, done.total);
});

test('a child who answers well and uses nitro usually wins', async () => {
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) { const { done } = await simulate({ seed, skill: 1 }); if (done.place === 1) wins++; }
  assert.ok(wins >= 17, `won ${wins}/20`);
});

test('a struggling child is never left far behind (race stays close)', async () => {
  for (let seed = 1; seed <= 10; seed++) {
    const { done, maxGap } = await simulate({ seed, skill: 0.2, useNitro: false });
    assert.ok(maxGap < 45, `gap ${maxGap.toFixed(1)} units`);
    assert.ok(done.place <= 4);
  }
});

test('races are not boring: rivals win sometimes when the child gets few answers', async () => {
  let losses = 0;
  for (let seed = 1; seed <= 20; seed++) { const { done } = await simulate({ seed, skill: 0, useNitro: false }); if (done.place > 1) losses++; }
  assert.ok(losses >= 10, `rivals won ${losses}/20`);
});

test('3 right in a row gives super nitro', async () => {
  const { race } = await simulate({ skill: 1, useNitro: false });
  assert.ok(race.state.player.nitro.includes('super'));
  assert.ok(race.state.player.nitro.length <= RACE.maxNitro);
});

test('every difficulty and cup plays through', async () => {
  for (const d of difficulties) for (let i = 0; i < 3; i++) {
    const { done } = await simulate({ diff: d.id, stepIdx: i, skill: 0.7, seed: i + 3 });
    assert.ok(done, `${d.id} step ${i}`);
  }
});

test('cups use known racers, 3 rivals each, 3 cups per difficulty', () => {
  for (const d of difficulties) {
    assert.equal(cups[d.id].length, 3);
    for (const c of cups[d.id]) {
      assert.equal(c.rivals.length, 3);
      for (const id of [...c.rivals, c.storyRacer]) assert.ok(racers.find((r) => r.id === id), id);
    }
  }
});

test('racer lines are present and kind', () => {
  const unkind = /\b(stupid|dumb|loser|lose[rs]?\b|bad|slow ?poke|idiot|hate)\b/i;
  for (const r of racers) {
    for (const k of ['intro', 'cheer', 'passYou', 'youPass', 'win', 'lose']) {
      assert.ok(r.lines[k]?.length, `${r.id}.${k}`);
      for (const l of r.lines[k]) assert.ok(!unkind.test(l), `${r.id}: "${l}"`);
    }
  }
});

import { makeTires } from '../src/games/race/pitStop.js';
test('pit stop tires: exactly one pair makes the total, never n + n, always finishes', () => {
  for (const total of [10, 20]) for (let seed = 0; seed < 500; seed++) {
    const { tires, a, b } = makeTires(total, createRng(seed));
    assert.equal(tires.length, total === 10 ? 5 : 6);
    assert.equal(new Set(tires).size, tires.length);
    assert.notEqual(a, b);
    let pairs = 0;
    for (let i = 0; i < tires.length; i++) for (let j = i + 1; j < tires.length; j++) if (tires[i] + tires[j] === total) pairs++;
    assert.equal(pairs, 1, `${total}: ${tires}`);
    for (const v of tires) assert.ok(v >= 1 && v < total);
  }
});

import { typesAnswer } from '../src/data/difficulty.js';
test('number pad: Medium and Hard type, Easy chooses; the road waits for a typed answer', async () => {
  const easy = difficulties[0], medium = difficulties[1], hard = difficulties[2];
  assert.equal(typesAnswer(easy, { answer: 7 }), false);
  assert.equal(typesAnswer(medium, { answer: 7 }), true);
  assert.equal(typesAnswer(hard, { answer: 'left', choices: ['a', '=', 'b'] }), false, 'compare is always chosen');

  const rng = createRng(4);
  const race = createRace({ step: { ...medium.steps[0], pitTotal: 10 }, difficulty: 'medium', range: 15, rivals: racers.slice(0, 3), rng,
    typed: (q) => typesAnswer(medium, q) });
  race.begin();
  for (let i = 0; i < 60 * 30; i++) race.update(1 / 60);   // 30 s with no answer at all
  const s = race.state, g = race.current();
  assert.ok(g.typed && !g.result, 'still waiting at the first gate');
  assert.ok(s.waiting);
  assert.ok(g.pos - s.player.pos <= 7 + 0.5, 'car stopped before the gate');
  const lead = Math.max(...s.rivals.map((r) => r.pos)) - s.player.pos;
  assert.ok(lead < 30, 'rivals wait too');
  assert.equal(race.answer(g.q.answer + 1), true);
  assert.equal(g.result.correct, false);
  for (let i = 0; i < 60 * 20 && race.current() === g; i++) race.update(1 / 60);
  const g2 = race.current();
  for (let i = 0; i < 60 * 20 && !(g2.q && race.state.waiting); i++) race.update(1 / 60);
  assert.equal(race.answer(g2.q.answer), true);
  assert.equal(g2.result.correct, true);
  assert.equal(race.state.player.nitro.length, 1, 'typed right answer gives nitro');
});
