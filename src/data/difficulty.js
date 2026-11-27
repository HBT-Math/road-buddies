// Difficulty levels shared by Race, Maze and Color by Code. Pure data: games never hard-code numbers.
// Each step is a "question world" for math/generator.js:
//   forms:      question types (repeat one to make it more common)
//               result | make-ten | sub-across | missing-a | missing-b | bond | chain | compare | pick-expr
//   operations: '+' and/or '-' (forms like make-ten pick their own)
//   numberSet:  every number shown stays inside { min, max }
//   minA:       smallest first number (Easy starts from 5 and up)
//   bondTotal:  total for 'bond' questions (10 or 20)
// A step unlocks when the step before it has at least `unlockStars` stars.
// answer: 'choose' = pick one of the answers (gates, tiles); 'type' = type it on the number pad.
//         Questions with no single number ("which is bigger?") are always chosen.

export const difficulties = [
  {
    id: 'easy', nameKey: 'level.easy', range: 10, pitStopTotal: 10, timer: false, answer: 'choose',
    steps: [
      { id: 'easy1', skill: 'g-add10', forms: ['result', 'result', 'bond'], operations: ['+'], numberSet: { min: 0, max: 10 }, minA: 5, bondTotal: 10 },
      { id: 'easy2', skill: 'g-sub10', forms: ['result', 'result', 'bond'], operations: ['-'], numberSet: { min: 0, max: 10 }, minA: 5, bondTotal: 10 },
      { id: 'easy3', skill: 'g-mix10', forms: ['result', 'result', 'missing-b', 'bond'], operations: ['+', '-'], numberSet: { min: 0, max: 10 }, minA: 5, bondTotal: 10 },
    ],
  },
  {
    id: 'medium', nameKey: 'level.medium', range: 15, pitStopTotal: 10, timer: false, answer: 'type',
    steps: [
      { id: 'medium1', skill: 'g-maketen', forms: ['make-ten', 'make-ten', 'result'], operations: ['+'], numberSet: { min: 0, max: 15 }, minA: 5 },
      { id: 'medium2', skill: 'g-missing15', forms: ['missing-b', 'missing-a', 'make-ten'], operations: ['+'], numberSet: { min: 0, max: 15 }, minA: 5 },
      { id: 'medium3', skill: 'g-mix15', forms: ['make-ten', 'result', 'missing-b', 'pick-expr'], operations: ['+', '-'], numberSet: { min: 0, max: 15 }, minA: 5 },
    ],
  },
  {
    id: 'hard', nameKey: 'level.hard', range: 20, pitStopTotal: 20, timer: 'optional', answer: 'type',
    steps: [
      { id: 'hard1', skill: 'g-across20', forms: ['sub-across', 'sub-across', 'make-ten'], operations: ['-'], numberSet: { min: 0, max: 20 } },
      { id: 'hard2', skill: 'g-chain20', forms: ['chain', 'sub-across', 'missing-a', 'bond'], operations: ['+', '-'], numberSet: { min: 0, max: 20 }, bondTotal: 20 },
      { id: 'hard3', skill: 'g-mix20', forms: ['compare', 'pick-expr', 'chain', 'sub-across'], operations: ['+', '-'], numberSet: { min: 0, max: 20 } },
    ],
  },
];

export const UNLOCK_STARS = 1;
export const getDifficulty = (id) => difficulties.find((d) => d.id === id) || difficulties[0];

/** Should this question be typed on the number pad (true) or chosen (false)? */
export const typesAnswer = (difficulty, q) => difficulty?.answer === 'type' && typeof q?.answer === 'number' && !q.choices;
