// Pack 1: within 10. Levels are pure data; the engine never hard-codes a world.
// tenFrameMode: 'shown' | 'tap-to-reveal' | 'hidden' | 'child-fills'
// hintPolicy:   retryWithHint = the same question returns once (with hints) after a wrong answer
export const pack1 = {
  id: 'pack1',
  nameKey: 'pack.pack1',
  range: 10,          // all gate numbers stay within 0..range
  frames: 1,          // number of ten frames drawn
  worlds: [
    {
      id: 'p1w1', icon: 'count', skill: 'count5',
      forms: ['count'], operations: [], numberSet: { min: 0, max: 5 },
      tenFrameMode: 'shown', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      id: 'p1w2', icon: 'add', skill: 'add5',
      forms: ['result'], operations: ['+'], numberSet: { min: 0, max: 5 },
      tenFrameMode: 'shown', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      id: 'p1w3', icon: 'sub', skill: 'sub5',
      forms: ['result'], operations: ['-'], numberSet: { min: 0, max: 5 },
      tenFrameMode: 'shown', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      id: 'p1w4', icon: 'add', skill: 'add10',
      forms: ['result'], operations: ['+'], numberSet: { min: 0, max: 10 },
      tenFrameMode: 'shown', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      id: 'p1w5', icon: 'sub', skill: 'sub10',
      forms: ['result'], operations: ['-'], numberSet: { min: 0, max: 10 },
      tenFrameMode: 'shown', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      // mixed + and -, plus "missing number" (3 + ? = 7). The ten frame is now tap-to-show.
      id: 'p1w6', icon: 'mixed', skill: 'mixed10',
      forms: ['result', 'result', 'missing-b'], operations: ['+', '-'], numberSet: { min: 0, max: 10 },
      tenFrameMode: 'tap-to-reveal', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
    {
      // number bonds / combinations of 10 (7 + ? = 10)
      id: 'p1w7', icon: 'bond', skill: 'bonds10',
      forms: ['bond'], operations: ['+'], numberSet: { min: 0, max: 10 }, bondTotal: 10,
      tenFrameMode: 'tap-to-reveal', gatesPerWorld: 10,
      hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 },
    },
  ],
};
