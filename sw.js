// Offline support. Bump VERSION whenever files change so devices pick up the update.
// tests/pwa.test.js checks that every file under src/ and styles/ is listed in PRECACHE.
const VERSION = 'rb-v1';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'src/audio/music.js',
  'src/audio/sound.js',
  'src/audio/speech.js',
  'src/data/branding.js',
  'src/data/characters.js',
  'src/data/colors.js',
  'src/data/i18n/ar.js',
  'src/data/i18n/en.js',
  'src/data/i18n/index.js',
  'src/data/packs/index.js',
  'src/data/packs/pack1.js',
  'src/data/placement.js',
  'src/data/sounds.js',
  'src/data/themes/cars.js',
  'src/data/themes/index.js',
  'src/engine/input.js',
  'src/engine/loop.js',
  'src/engine/particles.js',
  'src/engine/road.js',
  'src/engine/world.js',
  'src/main.js',
  'src/math/distractors.js',
  'src/math/generator.js',
  'src/math/mastery.js',
  'src/math/rng.js',
  'src/save/store.js',
  'src/ui/chrome.js',
  'src/ui/confetti.js',
  'src/ui/dom.js',
  'src/ui/draw.js',
  'src/ui/icons.js',
  'src/ui/screens/adult.js',
  'src/ui/screens/adultGate.js',
  'src/ui/screens/map.js',
  'src/ui/screens/newProfile.js',
  'src/ui/screens/play.js',
  'src/ui/screens/profiles.js',
  'src/ui/screens/results.js',
  'src/ui/screens/splash.js',
  'src/ui/signboard.js',
  'src/ui/tenframe.js',
  'styles/main.css',
  'assets/branding/icon-192.png',
  'assets/branding/icon-512.png',
];
// Logos are optional (the game shows a text panel without them), so they are cached when present.
const OPTIONAL = [
  'assets/branding/enrich-program-logo.png',
  'assets/branding/rayhan-school-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(PRECACHE);
    await Promise.all(OPTIONAL.map((u) => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Cache first (works offline), then refresh the cached copy in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    const network = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    return (await network) || new Response('', { status: 504, statusText: 'Offline' });
  })());
});
