// Pure question generator. No DOM, no globals: everything comes from the world config + rng.
//
// A world config supplies:
//   skill:      mastery key, e.g. 'add5'
//   forms:      ['count'] | ['result'] | ['missing-b'] | ['bond']  (one is picked per question)
//   operations: ['+'] | ['-'] | ['+','-']
//   numberSet:  { min, max }   every number shown (operands and result) stays inside this
//   bondTotal:  total for 'bond' form (e.g. 10)
//
// Returned question:
//   { skill, form, op, a, b, c, answer, tokens, key }
//   tokens is the display sequence, e.g. [3,'+',4,'=','?'] or [3,'+','?','=',7]
//
// opts.level (0..2) raises difficulty *inside* the world's range: 0 = anything, 1 = totals in the
// upper half, 2 = upper third and no "+1 / -1" freebies. Ranges are never exceeded.

export const MAX_LEVEL = 2;

export function minTotalFor(world, level = 0) {
  const { min = 0, max } = world.numberSet;
  if (level <= 0) return min;
  return Math.max(min, Math.ceil(max * (level === 1 ? 0.5 : 0.7)));
}

export function makeQuestion(world, rng, history = [], opts = {}) {
  if (world.fixed) return fixedAt(world, history.length);
  const last = history[history.length - 1];
  const level = Math.max(0, Math.min(MAX_LEVEL, opts.level || 0));
  let q = null;
  for (let tries = 0; tries < 60; tries++) {
    q = buildOne(world, rng, level);
    if (!last) break;
    if (q.key === last.key) continue;
    // Soft rule: avoid the same answer twice in a row when we have room to vary.
    if (q.answer === last.answer && tries < 30) continue;
    break;
  }
  return q;
}

function buildOne(world, rng, level = 0) {
  const form = rng.pick(world.forms);
  const op = rng.pick(world.operations?.length ? world.operations : ['+']);
  const { min = 0, max } = world.numberSet;
  const lo = Math.max(1, min);
  const floor = minTotalFor(world, level);   // smallest total / starting number at this level
  const minPart = level >= 2 ? 2 : 1;        // level 2: no +1 / -1

  switch (form) {
    case 'count': {
      const n = rng.int(Math.min(max, floor), max);
      return finish(world, { form, op: null, a: n, b: null, c: n, answer: n, tokens: ['?'] });
    }
    case 'result': {
      if (op === '+') {
        const c = rng.int(Math.min(max, Math.max(2, lo + 1, floor)), max);
        const bMin = Math.min(minPart, c - lo);
        const a = rng.int(lo, c - bMin);
        const b = c - a;
        return finish(world, { form, op, a, b, c, answer: c, tokens: [a, '+', b, '=', '?'] });
      }
      const a = rng.int(Math.min(max, Math.max(lo, floor)), max);
      let b = rng.int(Math.min(minPart, a), a);
      // "n - n = 0" is useful now and then, but small numbers would make it very common
      if (b === a && a - 1 >= minPart && rng.next() < 0.6) b = rng.int(minPart, a - 1);
      return finish(world, { form, op, a, b, c: a - b, answer: a - b, tokens: [a, '-', b, '=', '?'] });
    }
    case 'missing-b': {
      if (op === '+') {
        const c = rng.int(Math.min(max, Math.max(2, lo, floor)), max);
        const a = rng.int(1, c - 1);
        const b = c - a;
        return finish(world, { form, op, a, b, c, answer: b, tokens: [a, '+', '?', '=', c] });
      }
      const a = rng.int(Math.min(max, Math.max(2, lo, floor)), max);
      const b = rng.int(1, a - 1);
      const c = a - b;
      return finish(world, { form, op, a, b, c, answer: b, tokens: [a, '-', '?', '=', c] });
    }
    case 'bond': {
      const total = world.bondTotal ?? max;
      const a = rng.int(1, total - 1);
      const b = total - a;
      return finish(world, { form, op: '+', a, b, c: total, answer: b, tokens: [a, '+', '?', '=', total] });
    }
    default:
      throw new Error(`Unknown question form: ${form}`);
  }
}

/** Placement checks and scripted worlds use a fixed list: world.fixed = [[a, op, b, form], ...] */
export function fixedAt(world, i) {
  const [a, op, b, form = 'result'] = world.fixed[i % world.fixed.length];
  const c = op === '+' ? a + b : a - b;
  const tokens = form === 'result' ? [a, op, b, '=', '?'] : [a, op, '?', '=', c];
  const q = finish(world, { form, op, a, b, c, answer: form === 'result' ? c : b, tokens });
  q.tag = world.fixed[i % world.fixed.length][4] || null;
  return q;
}

function finish(world, q) {
  q.skill = world.skill;
  q.key = `${q.form}:${q.a}${q.op ?? ''}${q.b ?? ''}=${q.c}`;
  return q;
}
