import { makeQuestion } from '../../math/generator.js';
import { makeGateValues } from '../../math/distractors.js';

// Race rules: no DOM, no drawing, so whole races can be simulated in tests.
// The player's car moves by itself and steers between 3 lanes. Nitro Gates ask a question; a right
// answer gives a nitro charge (3 in a row = super nitro). Rivals adapt their speed so the race stays
// close: they ease off when ahead and push when behind, and react a little to how well the child is doing.
// Phases: intro -> countdown -> race -> (pit) -> race -> finish -> done

export const RACE = {
  base: 10,                 // world units per second
  lapLength: 220,
  laps: 3,
  firstGate: 50,
  gateEvery: 66,
  showAt: 44,               // the question appears this far before the gate
  slowWhileAsking: { easy: 0.45, medium: 0.5, hard: 0.7 }, // whole race slows (fair for everyone) while a question is up
  auto: { extra: 3, time: 0.9 },     // small instant boost for every right answer
  nitro: { normal: { extra: 6, time: 2.2 }, super: { extra: 9, time: 3.2 } },
  maxNitro: 3,
  finishLinger: 2.2,
};

export function createRace({ step, difficulty = 'easy', range = 10, rivals, rng, hooks = {}, laps = RACE.laps }) {
  const h = { onQuestion() {}, onAnswer() {}, onNitro() {}, onPass() {}, onPit: async () => true, onCount() {}, onGo() {}, onFinish() {}, onDone() {}, ...hooks };
  const length = RACE.lapLength * laps;
  const pitPos = Math.round(length / 2);
  const slow = RACE.slowWhileAsking[difficulty] ?? 0.5;

  const gates = [];
  for (let p = RACE.firstGate; p < length - 30; p += RACE.gateEvery) {
    if (Math.abs(p - pitPos) < 24) continue;
    gates.push({ pos: p, q: null, values: null, result: null, committed: false, reveal: null });
  }

  const s = {
    t: 0, phase: 'intro', countdown: 0, length, laps, pitPos, pitDone: false,
    player: { pos: 0, lane: 0, x: 0, speed: 0, boost: 0, boostExtra: 0, boostKind: null, nitro: [], streak: 0 },
    rivals: rivals.map((racer, i) => ({
      racer, id: racer.id, pos: [5, 5, 10][i] ?? 5 + i * 4, lane: [-1, 1, 0][i] ?? 0, x: [-1, 1, 0][i] ?? 0,
      speed: 0, laneTimer: 2 + rng.next() * 3, finishT: null, ahead: true,
    })),
    gates, gateIdx: 0, history: [], correct: 0, answered: 0,
    startT: 0, finishT: null, place: null, photoFinish: false, finishTimer: 0,
  };

  const current = () => s.gates[s.gateIdx] || null;
  const accuracy = () => (s.answered ? s.correct / s.answered : 0.7);
  const asking = () => { const g = current(); return !!(g && g.q && !g.result && g.pos - s.player.pos < RACE.showAt); };
  const place = () => 1 + s.rivals.filter((r) => r.pos > s.player.pos).length;

  function commit() { const g = current(); if (s.phase === 'race' && g && g.q && !g.result) g.committed = true; }

  function resolve(g) {
    const p = s.player;
    const value = g.values[p.lane + 1];
    const correct = value === g.q.answer;
    g.result = { lane: p.lane, correct };
    s.answered++;
    let nitroKind = null;
    if (correct) {
      s.correct++;
      p.streak++;
      nitroKind = p.streak % 3 === 0 ? 'super' : 'normal';
      if (p.nitro.length < RACE.maxNitro) p.nitro.push(nitroKind);
      else p.nitro[p.nitro.length - 1] = nitroKind === 'super' ? 'super' : p.nitro[p.nitro.length - 1];
      startBoost(RACE.auto.extra, RACE.auto.time, 'auto');
    } else {
      p.streak = 0;
      g.reveal = g.values.indexOf(g.q.answer);   // the right answer glows briefly
    }
    h.onAnswer(g.q, { correct, value, nitroKind, streak: p.streak, lane: p.lane });
  }

  function startBoost(extra, time, kind) {
    const p = s.player;
    if (kind !== 'auto' || p.boost <= 0) { p.boostExtra = Math.max(extra, p.boost > 0 ? p.boostExtra : 0); p.boostKind = kind; }
    p.boost = Math.max(p.boost, time);
  }

  function finish() {
    s.finishT = s.t;
    s.place = place();
    // a "photo finish" when another car is within about half a second of the line
    s.photoFinish = s.rivals.some((r) => Math.abs(r.pos - length) < RACE.base * 0.5);
    s.phase = 'finish';
    s.finishTimer = RACE.finishLinger;
    h.onFinish({ place: s.place, photoFinish: s.photoFinish });
  }

  function stars() {
    const ratio = s.answered ? s.correct / s.answered : 0;
    return 1 + (ratio >= 0.5 ? 1 : 0) + (ratio >= 0.8 ? 1 : 0);   // math earns stars, not position
  }

  return {
    state: s,
    RACE,
    get place() { return place(); },
    get asking() { return asking(); },
    current,
    begin() { if (s.phase === 'intro') { s.phase = 'countdown'; s.countdown = 3; h.onCount(3); } },
    steer(dir) {
      if (!['countdown', 'race', 'finish'].includes(s.phase)) return false;
      const n = Math.max(-1, Math.min(1, s.player.lane + dir));
      if (n === s.player.lane) return false;
      s.player.lane = n;
      return true;
    },
    go: commit,
    chooseLane(lane) { if (s.phase !== 'race') return; s.player.lane = lane; commit(); },
    useNitro() {
      const p = s.player;
      if (s.phase !== 'race' || !p.nitro.length) return null;
      const kind = p.nitro.shift();
      const n = RACE.nitro[kind];
      p.boostExtra = n.extra; p.boost = n.time; p.boostKind = kind;
      h.onNitro(kind);
      return kind;
    },

    update(dt) {
      s.t += dt;
      const p = s.player;
      p.x += (p.lane - p.x) * Math.min(1, dt * 7);
      for (const r of s.rivals) r.x += (r.lane - r.x) * Math.min(1, dt * 3);

      if (s.phase === 'countdown') {
        const before = Math.ceil(s.countdown);
        s.countdown -= dt;
        const after = Math.ceil(s.countdown);
        if (after !== before && after > 0) h.onCount(after);
        if (s.countdown <= 0) { s.phase = 'race'; s.startT = s.t; h.onGo(); }
        return;
      }
      if (s.phase !== 'race' && s.phase !== 'finish') return;

      // questions appear as gates come near
      const g = current();
      if (s.phase === 'race' && g && !g.q && g.pos - p.pos < RACE.showAt * 1.15) {
        g.q = makeQuestion(step, rng, s.history);
        s.history.push(g.q);
        g.values = makeGateValues(g.q, rng, { min: 0, max: range });
        h.onQuestion(g.q, g.values, s.gateIdx);
      }
      const scale = s.phase === 'race' && asking() && !g.committed ? slow : 1;
      const sdt = dt * scale;

      // player
      if (p.boost > 0) p.boost -= sdt; else { p.boostExtra = 0; p.boostKind = null; }
      const target = RACE.base + (p.boost > 0 ? p.boostExtra : 0);
      p.speed += (target - p.speed) * Math.min(1, dt * (target > p.speed ? 3 : 1.5));
      p.pos += p.speed * sdt;

      // rivals: personality + rubber band, softer near the end so nitro decides the finish
      const skill = 0.94 + 0.1 * accuracy();
      for (const r of s.rivals) {
        const prog = r.pos / length;
        const pace = prog < 0.25 ? r.racer.pace.start : prog > 0.7 ? r.racer.pace.end : 1;
        const band = prog > 0.8 ? 0.45 : 1;
        const gap = p.pos - r.pos;
        const adj = Math.max(-0.3, Math.min(0.3, gap / 55)) * band;
        const rt = RACE.base * pace * (1 + adj) * skill * (r.finishT !== null ? 0.8 : 1);
        r.speed += (rt - r.speed) * Math.min(1, dt * 1.5);
        r.pos += r.speed * sdt;
        if ((r.laneTimer -= dt) <= 0) {
          r.laneTimer = 2.5 + rng.next() * 3.5;
          const options = [-1, 0, 1].filter((l) => l !== r.lane && !(l === p.lane && r.pos - p.pos > 0 && r.pos - p.pos < 7));
          r.lane = rng.pick(options.length ? options : [r.lane]);
        }
        if (r.finishT === null && r.pos >= length) r.finishT = s.t;
        // overtakes (only while racing)
        const ahead = r.pos > p.pos;
        if (s.phase === 'race' && ahead !== r.ahead && Math.abs(r.pos - p.pos) > 0.5) {
          r.ahead = ahead;
          h.onPass(r.racer, ahead ? 'passYou' : 'youPass');
        }
      }

      if (s.phase === 'race') {
        if (g && g.q && !g.result && p.pos >= g.pos - 0.2) resolve(g);
        if (g && g.result && p.pos > g.pos + 4) s.gateIdx++;
        if (!s.pitDone && p.pos >= s.pitPos) {
          s.phase = 'pit';
          Promise.resolve(h.onPit(step.pitTotal)).then(() => {
            s.pitDone = true;
            s.phase = 'race';
            startBoost(RACE.auto.extra, 1.4, 'auto');
          });
        }
        if (p.pos >= length) finish();
      } else if (s.phase === 'finish' && (s.finishTimer -= dt) <= 0) {
        s.phase = 'done';
        h.onDone({ place: s.place, stars: stars(), correct: s.correct, total: s.answered,
          time: s.finishT - s.startT, photoFinish: s.photoFinish });
      }
    },
  };
}
