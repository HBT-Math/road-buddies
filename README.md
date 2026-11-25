# Road Buddies

A touch-first driving game for practising addition and subtraction (ages 5-8).
**Enrich Program, Rayhan School** (مدرسة الريحان).

The child steers a car between 3 lanes and drives through the gate showing the right answer.
There are no timers, no crashes and no lose screen. The road stops at every gate and waits.

- Plain HTML + CSS + JavaScript modules. No build step and no dependencies.
- No network calls, no accounts, no tracking. Progress lives in `localStorage` on the device.
- All art is drawn in code (SVG and canvas). Sounds are generated with WebAudio.

## Run it

ES modules need to be served over http (opening `index.html` from disk won't work):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Any static host works too (GitHub Pages, Netlify, a school server).

Run the tests (Node 18+, nothing to install):

```bash
npm test
```

Browser smoke test (plays World 1 and checks the game works offline; needs Playwright installed):

```bash
npm run e2e
```

Add `?debug` to the URL to expose `window.roadBuddies` for testing.

## Offline / install as an app

The game is a PWA. After the first visit over http(s), `sw.js` caches every file and the game runs with no
internet. On tablets, use "Add to Home Screen" to install it full-screen.
**When you change any file, bump `VERSION` in `sw.js`** so devices fetch the update. If you add a file, add it to
`PRECACHE` (the test suite fails if you forget).

## Branding

Put the two logo files in `assets/branding/`:

- `enrich-program-logo.png`
- `rayhan-school-logo.png`

The paths live in `src/data/branding.js`. Logos are shown as-is (`object-fit: contain`) on a white panel.
If a file is missing, a plain text placeholder shows instead.

App icons (`icon-192.png`, `icon-512.png`) are made from the Enrich logo: the logo is placed untouched on a white
square with safe padding. After changing the logo, rebuild them with `npm run icons` (needs Playwright and a
local server on :8080), or open `tools/make-icons.html` in a browser and save the two images.

## Project layout

```
src/
  engine/   world.js (rules/state machine), road.js (renderer), input.js, loop.js, particles.js
  math/     generator.js, distractors.js, rng.js         <- pure, unit tested
  ui/       tenframe.js, signboard.js, chrome.js, screens/
  audio/    sound.js (WebAudio synth), speech.js (speech synthesis)
  data/     characters.js, colors.js, themes/, packs/, i18n/, sounds.js, branding.js
  save/     store.js
tests/      node:test suites
```

## Add a character

Add one entry to `src/data/characters.js`:

```js
{
  id: 'owl', name: 'Olly',                       // name is display text only
  colors: { main: '#A0785A', light: '#F1DEC9', dark: '#6B4A31' },
  voiceStyle: { pitch: 1.0, rate: 1.0 },
  cheerLines: ['cheer.yay', 'cheer.super'],      // i18n keys
  head: (c) => `<circle cx="60" cy="62" r="42" fill="${c.main}"/> ...`, // SVG in a 120x120 box
}
```

Then add `'animal.owl'` to the i18n files. The pickers, the roadside friends and the car all pick it up automatically.

## Add a theme

Create `src/data/themes/<id>.js` with the same shape as `cars.js` and list it in `themes/index.js`:

```js
{ id, nameKey, icon /* SVG string */, palette: { skyTop, skyBottom, grassA, grassB, road, roadB, rumbleA, rumbleB, lane },
  background: { sky(ctx, w, horizon, t, reduced, palette), hills(ctx, w, horizon, shift) },
  scenery: [{ type, weight, draw(ctx, x, y, unit) }],
  vehicle(ctx, { x, y, w, accent, accentDark, faceImg, tilt, bob }),
  reward: { draw(ctx, x, y, size, spin), icon },
  sounds: { correct, oops, collect, lane, go, done },   // keys into data/sounds.js
  music: { tempo, notes } }
```

Themes never touch levels, questions or the ten frame. An ice cream truck theme would be a truck `vehicle()`,
a scoop `reward.draw()`, pastel `palette`/`scenery`, and a chime for `collect`.

## Add a pack or world

Packs are data in `src/data/packs/`. A world looks like this:

```js
{ id: 'p1w4', icon: 'add', skill: 'add10',
  forms: ['result'],            // 'count' | 'result' | 'missing-b' | 'bond'
  operations: ['+'],            // '+', '-' or both
  numberSet: { min: 0, max: 10 },
  bondTotal: 10,                // only for 'bond'
  tenFrameMode: 'shown',        // 'shown' | 'tap-to-reveal' | 'hidden' | 'child-fills'
  gatesPerWorld: 10,
  hintPolicy: { retryWithHint: true, wrongBeforeBigHint: 2, streakToFade: 5 } }
```

A pack sets `range` (the largest number any gate may show) and `frames` (1 or 2 ten frames).
Pack 2 (within 20) will use `range: 20, frames: 2`. Its new strategies (make-ten, doubles, subtracting through ten)
are new skill entries for the generator and new animation steps for the ten frame. The engine and screens stay the same.

## Adaptive help

Each skill keeps `{ correct, wrong, streak, wrongStreak, level, boost }` per player (`src/math/mastery.js`):

- 2 wrong in a row: **boost**. The ten frame is shown big, with numbered counters popping in one by one, and the level drops by one.
  It switches off after 3 right in a row.
- 5 right in a row: **level up** (max 2). The ten frame becomes tap-to-show and the numbers get larger, staying inside the world's range.
  Level 2 also drops the "+1 / −1" questions.
- After a wrong answer, the same question always comes back once with full hints.

## Grown-ups

Tap the gear and answer the sum (six choices), or press and hold the gear for 3 seconds.

## Translations

All UI text goes through `t(key)` from `src/data/i18n/`. `en.js` is complete. `ar.js` (right-to-left) holds the same keys,
and any missing key falls back to English. Equations always read left-to-right.

## Status

- **Phase 1 (done):** splash, profiles (up to 6, animal + colour only), buddy/colour/theme picker, 3-lane driving,
  gates, signboard with ten frame, wrong-answer explanation and hinted retry, Pack 1 worlds 1-3, stars, saving.
- **Phase 2 (done):** worlds 4-7 (add/sub within 10, mixed with missing number, bonds of 10; ten frame becomes
  tap-to-show from world 6), adaptive help per skill (`src/math/mastery.js`), grown-ups screen (pack, unlock all,
  reset, remove player, skill table, sound/voice/calm/motion/contrast, language), adult question gate,
  6-gate placement check (`src/data/placement.js`).
- **Phase 3 (done):** generated music loop per theme (`src/audio/music.js`, ducks under speech, slower and quieter in
  calm mode), clearer voice choice, softer bell sounds, finish-line arch, "3 in a row" bursts, confetti on the star
  screen, PWA manifest + offline service worker, icons from the logo, tests for offline files, translations,
  data contracts, child safety (no network calls or outside links) and gender-neutral wording, plus a browser smoke test.
- **Later:** Pack 2 (within 20) and Theme 2 (ice cream truck), as data only.
