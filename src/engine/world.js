import { makeQuestion } from '../math/generator.js';
import { makeGateValues } from '../math/distractors.js';

// The world simulation: a forgiving state machine, no DOM and no theme knowledge.
// The car keeps rolling; at each gate scene the road eases to a stop and WAITS for the child.
// There is no timer, no crash and no game over.
//
// Phases: intro -> approach -> hold -> pass -> (afterCorrect | afterWrong -> explain) -> approach ... -> finish -> ended

export const LANES = [-1, 0, 1];
export const TUNING = {
  cruise: 9,          // world units / second
  far: 46,            // where a gate appears
  hold: 6.2,          // where the road stops in front of the gates
  settle: 2.0,        // after the last steer while stopped, drive through after this long
  promptAfter: 8,     // gentle spoken nudge after this long with no input
  afterCorrect: 1.6,
  afterWrong: 1.1,
  sceneryFar: 60,
};

export function createWorld({ pack, world, rng, calm = false, hooks = {}, levelFor = () => 0 }) {
  const cruise = TUNING.cruise * (calm ? 0.6 : 1);
  const h = { onQuestion() {}, onHold() {}, onCommit() {}, onAnswer() {}, onExplain: async () => {}, onPrompt() {}, onSteer() {}, onDone() {}, onFinish() {}, onStreak() {}, ...hooks };
  const range = { min: 0, max: pack.range };

  const s = {
    t: 0, phase: 'intro', timer: 1.4,
    speed: 0, offset: 0,
    lane: 0, carX: 0,
    gate: null,             // { d, values, q, result }
    question: null, isRetry: false,
    history: [],
    gatesDone: 0, firstTry: 0, rewards: 0, log: [], streak: 0, finishD: null,
    settle: 0, idle: 0, nextPrompt: TUNING.promptAfter,
    scenery: [],
    friendsMood: 'wave',    // wave | cheer | idle
  };

  // roadside decorations, spaced along both sides
  for (const side of [-1, 1]) {
    for (let d = -2; d < TUNING.sceneryFar; d += 2.6 + rng.next() * 3) s.scenery.push(newScenery(side, d));
  }
  function newScenery(side, d) {
    const r = rng.next();
    const kind = r < 0.15 ? 'house' : r < 0.55 ? 'tree' : r < 0.78 ? 'bush' : 'flowers';
    const lx = kind === 'house' ? 5 + rng.next() * 1.5 : kind === 'flowers' ? 1.95 + rng.next() * 0.3 : 3 + rng.next() * 2.4;
    return { side, d, kind, x: side * lx };
  }

  function nextQuestion(retry = false) {
    if (!retry) {
      s.question = makeQuestion(world, rng, s.history, { level: levelFor(world.skill) });
      s.history.push(s.question);
    }
    s.isRetry = retry;
    s.gate = { d: TUNING.far, values: makeGateValues(s.question, rng, range), q: s.question, result: null };
    s.phase = 'approach';
    s.friendsMood = 'wave';
    s.settle = 0; s.idle = 0; s.nextPrompt = TUNING.promptAfter;
    h.onQuestion(s.question, { retry, hint: retry, index: s.gatesDone });
  }

  function commit() {
    if (!s.gate || (s.phase !== 'hold' && s.phase !== 'approach')) return;
    s.phase = 'pass';
    s.settle = 0;
    h.onCommit(s.lane);
  }

  function resolve() {
    const g = s.gate;
    const value = g.values[s.lane + 1];
    const correct = value === g.q.answer;
    g.result = { lane: s.lane, correct };
    if (!s.isRetry) s.log.push({ key: g.q.key, tag: g.q.tag ?? null, correct });
    h.onAnswer(g.q, { correct, value, lane: s.lane, retry: s.isRetry });
    if (correct) {
      s.rewards++;
      if (!s.isRetry) {
        s.firstTry++;
        s.streak++;
        if (s.streak % 3 === 0) h.onStreak(s.streak);
      }
      s.friendsMood = 'cheer';
      s.phase = 'afterCorrect';
      s.timer = TUNING.afterCorrect;
    } else {
      s.streak = 0;
      s.friendsMood = 'idle';
      s.phase = 'afterWrong';
      s.timer = TUNING.afterWrong;
    }
  }

  function questionFinished() {
    s.gatesDone++;
    if (s.gatesDone >= world.gatesPerWorld) {
      s.phase = 'finish';
      s.timer = 3.2;
      s.finishD = 22;         // a finish-line arch rolls towards the car
      s.friendsMood = 'cheer';
      h.onFinish();
    } else nextQuestion(false);
  }

  function stars() {
    // Progress, not speed: finishing always earns 1, first-try answers earn more.
    const n = world.gatesPerWorld;
    return 1 + (s.firstTry >= Math.ceil(n * 0.5) ? 1 : 0) + (s.firstTry >= Math.ceil(n * 0.8) ? 1 : 0);
  }

  const api = {
    state: s,
    steer(dir) {
      if (['pass', 'explain', 'finish', 'ended'].includes(s.phase)) return;
      const next = Math.max(-1, Math.min(1, s.lane + dir));
      if (next === s.lane) return;
      s.lane = next;
      s.idle = 0;
      if (s.phase === 'hold') s.settle = TUNING.settle;
      h.onSteer(s.lane);
    },
    go() { commit(); },
    chooseLane(lane) {
      if (s.phase !== 'hold' && s.phase !== 'approach') return;
      if (lane !== s.lane) { s.lane = lane; h.onSteer(lane); }
      commit();
    },

    update(dt) {
      s.t += dt;
      s.carX += (s.lane - s.carX) * Math.min(1, dt * 7);
      let target = cruise;

      switch (s.phase) {
        case 'intro':
          if ((s.timer -= dt) <= 0) nextQuestion(false);
          break;
        case 'approach': {
          const left = s.gate.d - TUNING.hold;
          target = Math.max(0.9, cruise * Math.min(1, left / 14));
          if (left <= 0.02) {
            s.gate.d = TUNING.hold;
            s.phase = 'hold';
            s.speed = 0;
            h.onHold();
          }
          break;
        }
        case 'hold':
          target = 0;
          s.idle += dt;
          if (s.settle > 0 && (s.settle -= dt) <= 0) commit();
          if (s.idle >= s.nextPrompt) { s.nextPrompt += 10; h.onPrompt(); }
          break;
        case 'pass':
          target = cruise * 0.75;
          if (!s.gate.result && s.gate.d <= 0.15) resolve();
          break;
        case 'afterCorrect':
          if ((s.timer -= dt) <= 0) questionFinished();
          break;
        case 'afterWrong':
          target = cruise * 0.4;
          if ((s.timer -= dt) <= 0 && world.hintPolicy?.explain === false) {
            questionFinished();   // e.g. placement check: no lesson, just move on gently
          } else if (s.timer <= 0) {
            s.phase = 'explain';
            Promise.resolve(h.onExplain(s.question)).then(() => {
              if (s.phase !== 'explain') return;
              if (!s.isRetry && world.hintPolicy?.retryWithHint !== false) nextQuestion(true);
              else questionFinished();
            });
          }
          break;
        case 'explain':
          target = 0;
          break;
        case 'finish':
          if ((s.timer -= dt) <= 0) {
            s.phase = 'ended';
            h.onDone({ stars: stars(), firstTry: s.firstTry, total: world.gatesPerWorld, rewards: s.rewards, log: s.log });
          }
          break;
        default:
          break;
      }

      if (s.phase === 'hold' || s.phase === 'explain') s.speed = Math.max(0, s.speed - dt * 30);
      else s.speed += (target - s.speed) * Math.min(1, dt * (target < s.speed ? 4 : 2.2));

      const move = s.speed * dt;
      s.offset += move;
      if (s.finishD !== null) s.finishD -= move;
      if (s.gate) {
        if (s.phase === 'approach') s.gate.d = Math.max(TUNING.hold, s.gate.d - move);
        else if (s.phase !== 'hold') s.gate.d -= move;
        if (s.gate.result && s.gate.d < -3.5) s.gate = null;
      }
      for (const sc of s.scenery) {
        sc.d -= move;
        if (sc.d < -2.5) Object.assign(sc, newScenery(sc.side, sc.d + TUNING.sceneryFar + 2.5));
      }
    },
  };
  return api;
}
