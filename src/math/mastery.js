// Pure per-skill mastery. A skill record lives in profile.skills[skillId]:
//   { correct, wrong, streak, wrongStreak, level, boost }
// - 2 wrong in a row (policy.wrongBeforeBigHint) -> boost: bigger ten frame, counters shown first,
//   and difficulty steps down one level.
// - 5 right in a row (policy.streakToFade) -> fewer hints (ten frame becomes tap-to-show)
//   and difficulty steps up one level (max 2). The streak then restarts for the next step.
// - boost switches off again after 3 right in a row.
import { MAX_LEVEL } from './generator.js';

export const DEFAULT_POLICY = { wrongBeforeBigHint: 2, streakToFade: 5, boostClearsAfter: 3 };

export const emptySkill = () => ({ correct: 0, wrong: 0, streak: 0, wrongStreak: 0, level: 0, boost: false });

export function updateSkill(prev, correct, policy = {}) {
  const p = { ...DEFAULT_POLICY, ...policy };
  const s = { ...emptySkill(), ...prev };
  if (correct) {
    s.correct++; s.streak++; s.wrongStreak = 0;
    if (s.boost && s.streak >= p.boostClearsAfter) { s.boost = false; s.streak = 0; }
    else if (!s.boost && s.streak >= p.streakToFade) { s.level = Math.min(MAX_LEVEL, s.level + 1); s.streak = 0; }
  } else {
    s.wrong++; s.streak = 0; s.wrongStreak++;
    if (s.wrongStreak >= p.wrongBeforeBigHint && !s.boost) {
      s.boost = true;
      s.level = Math.max(0, s.level - 1);
    }
  }
  return s;
}

/**
 * How much help to give on the next question.
 * baseMode is the world's tenFrameMode; form is the question form ('count' always needs the frame).
 */
export function helpFor(skill, baseMode = 'shown', form = 'result') {
  const s = { ...emptySkill(), ...skill };
  if (form === 'count') return { mode: 'shown', big: s.boost, labels: s.boost, firstCounters: s.boost, level: s.level };
  if (s.boost) return { mode: 'shown', big: true, labels: true, firstCounters: true, level: s.level };
  let mode = baseMode;
  if (s.level >= 1 && baseMode === 'shown') mode = 'tap-to-reveal';
  return { mode, big: false, labels: false, firstCounters: false, level: s.level };
}
