// Optional 6-gate placement check. Suggests Pack 1 (and a starting world) or Pack 2; an adult can override.
// fixed entries: [a, op, b, form, tag]
export const placementPack = { id: 'placement', range: 20, frames: 2, worlds: [] };
export const placementWorld = {
  id: 'placement', skill: 'placement', icon: 'star',
  forms: ['result'], operations: ['+', '-'], numberSet: { min: 0, max: 20 },
  fixed: [
    [3, '+', 4, 'result', 'within10'],
    [9, '-', 3, 'result', 'within10'],
    [6, '+', 4, 'missing-b', 'within10'],
    [8, '+', 5, 'result', 'within20'],
    [14, '-', 6, 'result', 'within20'],
    [7, '+', 7, 'result', 'within20'],
  ],
  tenFrameMode: 'hidden', gatesPerWorld: 6,
  hintPolicy: { retryWithHint: false, explain: false },
};

/** Pure: turn the 6 answers into a suggestion. */
export function scorePlacement(log) {
  const n = (tag) => log.filter((x) => x.tag === tag && x.correct).length;
  const within10 = n('within10'), within20 = n('within20');
  let suggestion;
  if (within10 === 3 && within20 >= 2) suggestion = { pack: 'pack2', startWorld: 0 };
  else if (within10 === 3) suggestion = { pack: 'pack1', startWorld: 3 };   // add within 10
  else if (within10 >= 1) suggestion = { pack: 'pack1', startWorld: 1 };    // add within 5
  else suggestion = { pack: 'pack1', startWorld: 0 };
  return { within10, within20, ...suggestion };
}
