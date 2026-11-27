import { makeQuestion } from '../../math/generator.js';

// Pure: turn a picture + a level step into a puzzle.
// Every colour slot gets a different answer number; every region gets an equation with that answer.
const NUMERIC = new Set(['result', 'make-ten', 'sub-across', 'missing-a', 'missing-b', 'bond', 'chain']);

export function numericStep(step) {
  const forms = step.forms.filter((f) => NUMERIC.has(f));
  return { ...step, forms: forms.length ? forms : ['result'] };
}

/** Answers this step can really produce (so every colour has equations). */
export function achievableAnswers(step, rng, samples = 400) {
  const s = numericStep(step);
  const seen = new Map();
  for (let i = 0; i < samples; i++) {
    const q = makeQuestion(s, rng, []);
    seen.set(q.answer, (seen.get(q.answer) || 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n >= 3).map(([v]) => v).sort((a, b) => a - b);
}

export function buildColoring(pic, step, rng) {
  const s = numericStep(step);
  const slots = [...new Set(pic.regions.map((rg) => rg.slot))].sort((a, b) => a - b);
  const pool = rng.shuffle(achievableAnswers(s, rng));
  if (pool.length < slots.length) throw new Error(`${step.id}: not enough different answers for ${pic.id}`);
  const legend = slots.map((slot, i) => ({ slot, value: pool[i], color: pic.colors[slot] })).sort((a, b) => a.value - b.value);
  const valueOf = Object.fromEntries(legend.map((l) => [l.slot, l.value]));
  const used = new Set();
  const regions = pic.regions.map((rg) => {
    const target = valueOf[rg.slot];
    let q = null;
    for (let i = 0; i < 600; i++) {
      const c = makeQuestion(s, rng, []);
      if (c.answer !== target) continue;
      q = c;
      if (!used.has(c.key)) break;   // prefer a new equation, accept a repeat if the step has few
    }
    if (!q) q = makeQuestion(s, rng, []);   // unreachable with achievableAnswers, kept as a guard
    used.add(q.key);
    return { id: rg.id, slot: rg.slot, q, value: target };
  });
  return { legend, regions };
}

/** Equation text for a region label, e.g. "7 + 3" or "? + 4 = 10". */
export function equationText(q) {
  const toks = q.tokens.map((x) => String(x).replace(/-/g, '−'));
  if (q.form === 'result' || q.form === 'make-ten' || q.form === 'sub-across' || q.form === 'chain') return toks.slice(0, -2).join(' ');
  return toks.join(' ').replace('?', '□');
}
