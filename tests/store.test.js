import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, isWorldUnlocked, MAX_PROFILES, STORAGE_KEY } from '../src/save/store.js';
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
  assert.deepEqual(Object.keys(p).sort(), ['animal', 'color', 'id', 'pack', 'progress', 'rewards', 'skills', 'theme']);
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
