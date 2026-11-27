// Local-only persistence. One localStorage key, versioned. No names or personal data:
// a profile is just an animal + a colour (+ chosen theme and progress).
import { updateSkill } from '../math/mastery.js';

export const STORAGE_KEY = 'roadbuddies.v1';
export const MAX_PROFILES = 6;
const VERSION = 1;

export const defaultSettings = () => ({
  sound: true, volume: 0.7, voice: true, music: true,
  calm: false, reducedMotion: false, highContrast: false, lang: 'en',
  presentsVoice: true,   // "Rayhan School presents" spoken softly on the opening
  twoPlayers: false,     // Race: two children take turns on one tablet
  hardTimer: false,      // Race on Hard only: optional timer
});

export const emptyState = () => ({ version: VERSION, settings: defaultSettings(), profiles: [], activeId: null });

export function createStore(storage = globalThis.localStorage) {
  let state = load();

  function load() {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      return migrate(parsed);
    } catch {
      return emptyState();
    }
  }
  function persist() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked: keep playing */ }
  }

  return {
    get state() { return state; },
    get settings() { return state.settings; },
    updateSettings(patch) { state.settings = { ...state.settings, ...patch }; persist(); },

    profiles: () => state.profiles,
    active: () => state.profiles.find((p) => p.id === state.activeId) || null,
    setActive(id) { state.activeId = id; persist(); },
    canAddProfile: () => state.profiles.length < MAX_PROFILES,

    addProfile({ animal, color, theme, pack = 'pack1' }) {
      if (state.profiles.length >= MAX_PROFILES) return null;
      const p = { id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, animal, color, theme, pack, progress: {}, skills: {}, rewards: 0, games: {}, gameLevel: {}, stickers: [] };
      state.profiles.push(p);
      state.activeId = p.id;
      persist();
      return p;
    },
    updateProfile(id, patch) {
      const p = state.profiles.find((x) => x.id === id);
      if (p) { Object.assign(p, patch); persist(); }
      return p;
    },
    removeProfile(id) {
      state.profiles = state.profiles.filter((p) => p.id !== id);
      if (state.activeId === id) state.activeId = null;
      persist();
    },

    /** Updates per-skill mastery (see math/mastery.js) and returns the new record. */
    recordAnswer(id, skill, correct, policy) {
      const p = state.profiles.find((x) => x.id === id);
      if (!p) return null;
      p.skills[skill] = updateSkill(p.skills[skill], correct, policy);
      persist();
      return p.skills[skill];
    },
    skill: (id, skill) => state.profiles.find((x) => x.id === id)?.skills?.[skill] || null,

    savePlacement(id, placement) {
      const p = state.profiles.find((x) => x.id === id);
      if (p) { p.placement = placement; persist(); }
    },
    /** Adult override: mark the worlds before startWorld as done so the child can start there. */
    applyStartWorld(id, pack, startWorld) {
      const p = state.profiles.find((x) => x.id === id);
      if (!p) return;
      const prog = (p.progress[pack.id] ||= {});
      pack.worlds.slice(0, startWorld).forEach((w) => { prog[w.id] ||= { stars: 0, plays: 0 }; prog[w.id].skipped = true; });
      persist();
    },

    /** Keeps the best star count per world. */
    recordWorld(id, packId, worldId, { stars, rewards }) {
      const p = state.profiles.find((x) => x.id === id);
      if (!p) return;
      const pack = (p.progress[packId] ||= {});
      const w = (pack[worldId] ||= { stars: 0, plays: 0 });
      w.stars = Math.max(w.stars, stars);
      w.plays++;
      p.rewards += rewards;
      persist();
    },

    /** Hub games: best stars per game / difficulty / step. */
    recordGame(id, gameId, diffId, step, { stars }) {
      const p = state.profiles.find((x) => x.id === id);
      if (!p) return;
      const g = ((p.games ||= {})[gameId] ||= {});
      const d = (g[diffId] ||= {});
      const s = (d[step] ||= { stars: 0, plays: 0 });
      s.stars = Math.max(s.stars, stars);
      s.plays++;
      persist();
    },
    setGameLevel(id, gameId, diffId) {
      const p = state.profiles.find((x) => x.id === id);
      if (p) { (p.gameLevel ||= {})[gameId] = diffId; persist(); }
    },
    addSticker(id, sticker) {
      const p = state.profiles.find((x) => x.id === id);
      if (p && !(p.stickers ||= []).includes(sticker)) { p.stickers.push(sticker); persist(); return true; }
      return false;
    },

    resetProgress(id) {
      const p = state.profiles.find((x) => x.id === id);
      if (p) { p.progress = {}; p.skills = {}; p.rewards = 0; delete p.placement; p.unlockAll = false; p.games = {}; p.stickers = []; persist(); }
    },
  };
}

// Animals that were replaced keep the player's progress under a new buddy.
export const ANIMAL_RENAMES = { frog: 'panda', cat: 'penguin', bunny: 'sheep', fox: 'giraffe' };

export function migrate(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.profiles)) return emptyState();
  const profiles = s.profiles.map((p) => ({ games: {}, gameLevel: {}, stickers: [], ...p, animal: ANIMAL_RENAMES[p.animal] || p.animal }));
  return { ...emptyState(), ...s, profiles, settings: { ...defaultSettings(), ...(s.settings || {}) }, version: VERSION };
}

/** A world is playable when it is the first one or the previous one has been finished. */
export function isWorldUnlocked(profile, pack, index) {
  if (index === 0 || profile?.unlockAll) return true;
  const prev = profile?.progress?.[pack.id]?.[pack.worlds[index - 1].id];
  return (prev?.stars ?? 0) > 0 || !!prev?.skipped;
}

export const worldStars = (profile, packId, worldId) => profile?.progress?.[packId]?.[worldId]?.stars ?? 0;

export const gameLevel = (profile, gameId) => profile?.gameLevel?.[gameId] || 'easy';
export const gameStars = (profile, gameId, diffId, step) => profile?.games?.[gameId]?.[diffId]?.[step]?.stars ?? 0;
/** Step 0 is always open; each later step needs `need` stars on the step before (or unlock-all). */
export function isStepUnlocked(profile, gameId, diffId, step, need = 1) {
  if (step === 0 || profile?.unlockAll) return true;
  return gameStars(profile, gameId, diffId, step - 1) >= need;
}
