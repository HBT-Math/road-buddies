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
        const aLo = Math.max(lo, world.minA || 0);  // e.g. Easy starts from 5 and up
        const c = rng.int(Math.min(max, Math.max(2, aLo + 1, floor)), max);
        const bMin = Math.min(minPart, c - aLo);
        const a = rng.int(aLo, c - bMin);
        const b = c - a;
        return finish(world, { form, op, a, b, c, answer: c, tokens: [a, '+', b, '=', '?'] });
      }
      const a = rng.int(Math.min(max, Math.max(lo, floor, world.minA || 0)), max);
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
    case 'make-ten': {
      // addition that crosses ten, e.g. 8 + 5 (the "make ten" strategy)
      const aLo = Math.max(6, world.minA || 0);
      const a = rng.int(Math.min(9, aLo), Math.min(9, max - 2));
      const bLo = 11 - a;
      const b = rng.int(bLo, Math.max(bLo, Math.min(9, max - a)));
      return finish(world, { form, op: '+', a, b, c: a + b, answer: a + b, tokens: [a, '+', b, '=', '?'] });
    }
    case 'sub-across': {
      // subtraction across ten, e.g. 15 - 7 (via 15 - 5 - 2)
      const a = rng.int(11, Math.min(19, max));
      const b = rng.int((a % 10) + 1, 9);
      return finish(world, { form, op: '-', a, b, c: a - b, answer: a - b, tokens: [a, '-', b, '=', '?'] });
    }
    case 'missing-a': {
      // ? + b = c   or   ? - b = c
      if (op === '+') {
        const c = rng.int(Math.min(max, Math.max(2, floor, world.minA || 0)), max);
        const b = rng.int(1, c - 1);
        return finish(world, { form, op, a: c - b, b, c, answer: c - b, tokens: ['?', '+', b, '=', c] });
      }
      const a = rng.int(Math.min(max, Math.max(2, floor, world.minA || 0)), max);
      const b = rng.int(1, a - 1);
      return finish(world, { form, op, a, b, c: a - b, answer: a, tokens: ['?', '-', b, '=', a - b] });
    }
    case 'chain': {
      // three numbers: a + b - d  (every step stays inside the range and never below 0)
      const a = rng.int(Math.max(lo, world.minA || 0), max - 1);
      const b = rng.int(1, Math.min(9, max - a));
      const d = rng.int(1, Math.min(9, a + b - 1));
      const c = a + b - d;
      return finish(world, { form, op: '+', op2: '-', a, b, d, c, answer: c, tokens: [a, '+', b, '-', d, '=', '?'] });
    }
    case 'compare': {
      // which is bigger: 8 + 5 or 7 + 7?  (results close together; sometimes the same)
      const expr = (target) => {
        const plus = rng.next() < 0.7 || target >= max;
        if (plus) { const x = rng.int(Math.max(1, target - 10), Math.min(10, target - 1)); return `${x} + ${target - x}`; }
        const y = rng.int(1, Math.min(9, max - target)); return `${target + y} - ${y}`;
      };
      const r1 = rng.int(Math.max(4, floor), max);
      // "the same" needs two different ways to write one number, so keep it below the very top
      const same = r1 <= max - 3 && rng.next() < 0.25;
      let r2 = same ? r1 : Math.max(3, Math.min(max, r1 + rng.pick([-2, -1, 1, 2])));
      if (!same && r2 === r1) r2 = r1 - 1;
      let left = expr(r1), right = expr(r2);
      for (let i = 0; i < 10 && left === right; i++) right = expr(r2);
      const answer = r1 === r2 ? '=' : r1 > r2 ? left : right;
      return finish(world, { form, op: null, a: r1, b: r2, c: null, left, right, answer, choices: [left, '=', right], tokens: [left, '?', right] });
    }
    case 'pick-expr': {
      // which one makes 12?  One expression equals the target, the others are off by one.
      const t = rng.int(Math.min(max - 1, Math.max(4, floor, world.minA || 0)), max - 1);
      const make = (target) => {
        if (rng.next() < 0.65 || target >= max) { const x = rng.int(Math.max(1, target - 10), Math.min(10, target - 1)); return `${x} + ${target - x}`; }
        const y = rng.int(1, Math.min(9, max - target)); return `${target + y} - ${y}`;
      };
      const answer = make(t);
      const choices = [answer];
      for (const off of rng.shuffle([1, -1, 2, -2])) {
        if (choices.length === 3) break;
        const v = t + off;
        if (v < 2 || v > max) continue;
        let e = make(v);
        for (let i = 0; i < 6 && choices.includes(e); i++) e = make(v);
        if (!choices.includes(e)) choices.push(e);
      }
      return finish(world, { form, op: null, a: t, b: null, c: t, answer, choices, tokens: ['?', '=', t] });
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
  q.key = q.choices
    ? `${q.form}:${q.tokens.join(' ')}|${q.answer}`
    : `${q.form}:${q.a}${q.op ?? ''}${q.b ?? ''}${q.d != null ? q.op2 + q.d : ''}=${q.c}`;
  return q;
}

/** Evaluate a display expression like "8 + 5" or "15 - 7" (only + and - with whole numbers). */
export function evalExpr(str) {
  const parts = String(str).split(' ');
  let v = Number(parts[0]);
  for (let i = 1; i < parts.length; i += 2) v = parts[i] === '+' ? v + Number(parts[i + 1]) : v - Number(parts[i + 1]);
  return v;
}
