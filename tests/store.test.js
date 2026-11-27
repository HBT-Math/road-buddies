import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, isWorldUnlocked, MAX_PROFILES, STORAGE_KEY, isStepUnlocked, gameStars, gameLevel } from '../src/save/store.js';
import { pack1 } from '../src/data/packs/pack1.js';

const memStorage = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), _m: m };
};

test('profiles persist and are limited to 6', () => {
  const mem = memStorage();
  const s = createStore(mem);
  for (let i = 0; i < 8; i++) s.addProfile({ animal: 'frog', color: 'blue', theme: 'cars' });
  assert.equal(s.profiles().length, MAX_PROFILES);
  const reloaded = createStore(mem);
  assert.equal(reloaded.profiles().length, MAX_PROFILES);
});

test('profiles hold no personal data, only animal + colour', () => {
  const s = createStore(memStorage());
  const p = s.addProfile({ animal: 'cat', color: 'red', theme: 'cars' });
  assert.deepEqual(Object.keys(p).sort(), ['animal', 'color', 'gameLevel', 'games', 'id', 'pack', 'progress', 'rewards', 'skills', 'stickers', 'theme']);
});

test('best stars are kept and unlock the next world', () => {
  const s = createStore(memStorage());
  const p = s.addProfile({ animal: 'cat', color: 'red', theme: 'cars' });
  assert.equal(isWorldUnlocked(p, pack1, 1), false);
  s.recordWorld(p.id, 'pack1', 'p1w1', { stars: 3, rewards: 9 });
  s.recordWorld(p.id, 'pack1', 'p1w1', { stars: 1, rewards: 4 });
  assert.equal(p.progress.pack1.p1w1.stars, 3);
  assert.equal(p.progress.pack1.p1w1.plays, 2);
  assert.equal(p.rewards, 13);
  assert.equal(isWorldUnlocked(p, pack1, 1), true);
  assert.equal(isWorldUnlocked(p, pack1, 2), false);
});

test('skill streaks track right and wrong answers', () => {
  const s = createStore(memStorage());
  const p = s.addProfile({ animal: 'cat', color: 'red', theme: 'cars' });
  s.recordAnswer(p.id, 'add5', true); s.recordAnswer(p.id, 'add5', true); s.recordAnswer(p.id, 'add5', false);
  assert.deepEqual(p.skills.add5, { correct: 2, wrong: 1, streak: 0, wrongStreak: 1, level: 0, boost: false });
});

test('corrupt storage falls back to a fresh state', () => {
  const mem = memStorage();
  mem.setItem(STORAGE_KEY, '{not json');
  const s = createStore(mem);
  assert.equal(s.profiles().length, 0);
  assert.equal(s.settings.sound, true);
});

test('adult override: unlock all, or start at a later world', () => {
  const s = createStore(memStorage());
  const p = s.addProfile({ animal: 'cat', color: 'red', theme: 'cars' });
  s.applyStartWorld(p.id, pack1, 3);
  assert.equal(isWorldUnlocked(p, pack1, 3), true);
  assert.equal(isWorldUnlocked(p, pack1, 4), false);
  s.updateProfile(p.id, { unlockAll: true });
  assert.equal(isWorldUnlocked(p, pack1, 6), true);
  s.resetProgress(p.id);
  assert.equal(isWorldUnlocked(p, pack1, 1), false);
});

test('hub games save stars per game, difficulty and step; steps unlock with stars', () => {
  const s = createStore(memStorage());
  const p = s.addProfile({ animal: 'panda', color: 'blue', theme: 'cars' });
  assert.equal(gameLevel(p, 'race'), 'easy');
  s.setGameLevel(p.id, 'race', 'hard');
  assert.equal(gameLevel(p, 'race'), 'hard');
  assert.equal(gameLevel(p, 'maze'), 'easy', 'level is saved per game');
  assert.equal(isStepUnlocked(p, 'race', 'hard', 1), false);
  s.recordGame(p.id, 'race', 'hard', 0, { stars: 2 });
  s.recordGame(p.id, 'race', 'hard', 0, { stars: 1 });
  assert.equal(gameStars(p, 'race', 'hard', 0), 2);
  assert.equal(isStepUnlocked(p, 'race', 'hard', 1), true);
  assert.equal(isStepUnlocked(p, 'maze', 'hard', 1), false, 'progress is per game');
  assert.equal(s.addSticker(p.id, 'race-cup1'), true);
  assert.equal(s.addSticker(p.id, 'race-cup1'), false);
});

test('old saves with replaced animals keep their progress', () => {
  const mem = memStorage();
  mem.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: {}, activeId: 'a', profiles: [
    { id: 'a', animal: 'frog', color: 'red', progress: { pack1: { p1w1: { stars: 3 } } }, skills: {}, rewards: 5 },
    { id: 'b', animal: 'fox', color: 'blue', progress: {}, skills: {}, rewards: 0 },
    { id: 'c', animal: 'hippo', color: 'blue', progress: {}, skills: {}, rewards: 0 }] }));
  const s = createStore(mem);
  assert.deepEqual(s.profiles().map((p) => p.animal), ['panda', 'giraffe', 'hippo']);
  assert.equal(s.profiles()[0].progress.pack1.p1w1.stars, 3);
  assert.deepEqual(s.profiles()[0].games, {});
});
