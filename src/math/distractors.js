// Pure: plausible wrong answers for a question. Never random noise.
// Priority: off-by-one, the "other operation" result, operand confusion, off-by-two.

export function distractorCandidates(q) {
  const n = q.answer;
  const near = [n + 1, n - 1];
  const plausible = [];
  if (q.form === 'count') {
    plausible.push(n + 2, n - 2);
  } else if (q.form === 'result' || q.form === 'make-ten' || q.form === 'sub-across') {
    plausible.push(q.op === '+' ? q.a - q.b : q.a + q.b); // used the wrong operation
    plausible.push(q.a, q.b);                              // picked an operand
    plausible.push(n + 2, n - 2);
  } else if (q.form === 'chain') {
    plausible.push(q.a + q.b, q.a + q.b + q.d, q.a - q.b + q.d, n + 2, n - 2); // stopped early / wrong sign
  } else if (q.form === 'missing-a') {
    plausible.push(q.c, q.b, q.op === '+' ? q.b + q.c : q.c - q.b, n + 2, n - 2);
  } else {
    // missing-number / bonds: the common slip is answering with the total or the other part
    plausible.push(q.c, q.a, q.op === '+' ? q.a + q.c : q.a - q.c, n + 2, n - 2);
  }
  return { near, plausible };
}

/** Returns exactly `count` distinct wrong answers within [min, max]. */
export function makeDistractors(q, rng, { min = 0, max = 10, count = 2 } = {}) {
  const ok = (v) => Number.isInteger(v) && v >= min && v <= max && v !== q.answer;
  const { near, plausible } = distractorCandidates(q);
  const out = [];
  const add = (v) => { if (ok(v) && !out.includes(v)) out.push(v); };

  // 1) one off-by-one (random side when both valid)
  rng.shuffle(near).forEach((v) => { if (out.length < 1) add(v); });
  // 2) best plausible slips, keeping the first couple in random order for variety
  const top = rng.shuffle(plausible.slice(0, 2)).concat(plausible.slice(2));
  for (const v of top) { if (out.length >= count) break; add(v); }
  // 3) the other off-by-one
  for (const v of near) { if (out.length >= count) break; add(v); }
  // 4) fallback: walk outward from the answer
  for (let d = 2; out.length < count && d <= max - min + 1; d++) { add(q.answer + d); add(q.answer - d); }
  return out.slice(0, count);
}

/** Builds the 3 gate values in shuffled lane order. Choice questions (compare, pick-expr) bring their own. */
export function makeGateValues(q, rng, range) {
  if (q.choices) return q.form === 'compare' ? q.choices.slice() : rng.shuffle(q.choices);
  const wrong = makeDistractors(q, rng, range);
  return rng.shuffle([q.answer, ...wrong]);
}
