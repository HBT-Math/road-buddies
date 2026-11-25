import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { characters } from '../src/data/characters.js';
import { themes } from '../src/data/themes/index.js';
import { packs } from '../src/data/packs/index.js';
import { accentColors } from '../src/data/colors.js';
import { sounds } from '../src/data/sounds.js';
import en from '../src/data/i18n/en.js';
import ar from '../src/data/i18n/ar.js';
import { noteToFreq, parseMelody } from '../src/audio/music.js';
import { pickVoice } from '../src/audio/speech.js';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const srcFiles = walk('src').filter((f) => f.endsWith('.js'));
const read = (f) => readFileSync(join(root, f), 'utf8');

test('characters follow the data contract', () => {
  assert.equal(characters.length, 6);
  assert.equal(new Set(characters.map((c) => c.id)).size, 6);
  for (const c of characters) {
    assert.ok(c.name && typeof c.head === 'function');
    assert.ok(c.colors.main && c.colors.light && c.colors.dark);
    assert.ok(c.voiceStyle.pitch > 0 && c.voiceStyle.rate > 0);
    for (const k of c.cheerLines) assert.ok(en[k], `missing cheer line ${k}`);
    const svg = c.head(c.colors);
    assert.ok(!/https?:\/\//.test(svg), 'no external references in art');
  }
});

test('no gendered labels anywhere in code or UI text', () => {
  const re = /\b(boy|boys|girl|girls|male|female|he|she|his|hers|him)\b/i;
  for (const f of srcFiles) {
    // speech.js matches voice *names* chosen by the device (e.g. "UK English Female"); that is not a label we show
    const text = read(f).replace(/google uk english female/gi, '');
    const lines = text.split('\n').filter((l) => re.test(l) && !/pickVoice|PREFERRED/.test(l));
    assert.deepEqual(lines, [], `${f} has gendered wording`);
  }
  for (const v of Object.values(en)) assert.ok(!re.test(v), `UI text "${v}"`);
});

test('child-safe: no network calls or outside links in the game code', () => {
  for (const f of srcFiles) {
    const text = read(f).replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '');
    assert.ok(!/https?:\/\//.test(text), `${f} references an outside URL`);
    assert.ok(!/XMLHttpRequest|sendBeacon|WebSocket|<a\s/.test(text), `${f} has a network call or link`);
  }
  // the only fetch() is for local sound files listed in the manifest
  for (const f of srcFiles.filter((f) => /fetch\(/.test(read(f)))) assert.equal(f, 'src/audio/sound.js');
  for (const s of Object.values(sounds)) if (s.url) assert.ok(!/^https?:/.test(s.url));
});

test('every translation key used in code exists in English', () => {
  const used = new Set();
  for (const f of srcFiles) for (const m of read(f).matchAll(/\bt\('([a-zA-Z0-9.]+)'/g)) used.add(m[1]);
  for (const c of characters) used.add(`animal.${c.id}`);
  for (const c of accentColors) used.add(`color.${c.id}`);
  for (const p of packs) { used.add(p.nameKey); for (const w of p.worlds) used.add(`skill.${w.skill}`); }
  for (const th of themes) used.add(th.nameKey);
  const missing = [...used].filter((k) => !k.endsWith('.') && !(k in en)); // 'color.' + id prefixes are checked via the data above
  assert.deepEqual(missing, []);
});

test('Arabic file only uses keys that exist in English', () => {
  for (const k of Object.keys(ar)) assert.ok(k in en, `ar.js has unknown key ${k}`);
});

test('themes follow the contract and only use known sounds', () => {
  for (const th of themes) {
    for (const k of ['id', 'nameKey', 'icon', 'palette', 'background', 'scenery', 'vehicle', 'reward', 'sounds', 'music']) assert.ok(th[k], `${th.id}.${k}`);
    assert.equal(typeof th.vehicle, 'function');
    assert.equal(typeof th.reward.draw, 'function');
    for (const s of Object.values(th.sounds)) assert.ok(sounds[s], `${th.id} uses unknown sound ${s}`);
    const bars = parseMelody(th.music.melody);
    assert.ok(bars.length >= 1 && bars.every((b) => b.length === 8), 'melody bars have 8 steps');
    th.music.chords.flat().forEach((n) => assert.ok(noteToFreq(n), `bad note ${n}`));
  }
});

test('note names convert to the right pitch', () => {
  assert.equal(noteToFreq('A4'), 440);
  assert.ok(Math.abs(noteToFreq('C4') - 261.63) < 0.01);
  assert.equal(noteToFreq('nope'), null);
});

test('voice choice prefers clear voices in the current language', () => {
  const v = (name, lang, localService = true) => ({ name, lang, localService });
  const list = [v('eSpeak English', 'en-US'), v('Zarvox', 'en-US'), v('Samantha', 'en-US'), v('Maged', 'ar-SA')];
  assert.equal(pickVoice(list, 'en').name, 'Samantha');
  assert.equal(pickVoice(list, 'ar').name, 'Maged');
  assert.equal(pickVoice([v('eSpeak English', 'en-US')], 'en'), null);
  assert.equal(pickVoice([], 'en'), null);
});

test('packs: every world is complete and ids are unique', () => {
  for (const p of packs) {
    assert.ok(p.range > 0 && p.frames >= 1);
    assert.equal(new Set(p.worlds.map((w) => w.id)).size, p.worlds.length);
    for (const w of p.worlds) {
      for (const k of ['id', 'icon', 'skill', 'forms', 'numberSet', 'tenFrameMode', 'gatesPerWorld', 'hintPolicy']) assert.ok(w[k] !== undefined, `${w.id}.${k}`);
      assert.ok(['hidden', 'shown', 'tap-to-reveal', 'child-fills'].includes(w.tenFrameMode));
      assert.ok(w.numberSet.max <= p.range);
    }
  }
  assert.equal(packs[0].worlds.length, 7);
});
