// Rewrites the PRECACHE list in sw.js from the files on disk and bumps VERSION.
//   node tools/update-precache.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const files = ['./', 'index.html', 'manifest.webmanifest', ...walk('styles').sort(), ...walk('src').sort(),
  'assets/branding/icon-192.png', 'assets/branding/icon-512.png'];

let sw = readFileSync(join(root, 'sw.js'), 'utf8');
const start = sw.indexOf('const PRECACHE = [');
const end = sw.indexOf('];', start) + 2;
sw = sw.slice(0, start) + `const PRECACHE = [\n${files.map((f) => `  '${f}',`).join('\n')}\n];` + sw.slice(end);
sw = sw.replace(/const VERSION = 'rb-v(\d+)';/, (_, n) => `const VERSION = 'rb-v${Number(n) + 1}';`);
writeFileSync(join(root, 'sw.js'), sw);
console.log(`sw.js: ${files.length} files, ${sw.match(/const VERSION = '([^']+)'/)[1]}`);
