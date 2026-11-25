import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});

test('service worker precaches every game file', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const block = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];'));
  const list = [...block.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]);
  for (const f of [...walk('src'), ...walk('styles'), 'index.html', 'manifest.webmanifest']) {
    assert.ok(list.includes(f), `${f} missing from sw.js PRECACHE`);
  }
  for (const f of list) if (f !== './') assert.ok(existsSync(join(root, f)), `${f} in PRECACHE does not exist`);
});

test('manifest is valid with 192 and 512 icons', () => {
  const m = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.name, 'Enrich Program - Rayhan School');
  const sizes = m.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  for (const i of m.icons) {
    const png = readFileSync(join(root, i.src));
    assert.equal(png.readUInt32BE(16), Number(i.sizes.split('x')[0]), `${i.src} width`);
  }
});

test('index.html has the title, manifest and tab icon', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /<title>Enrich Program - Rayhan School<\/title>/);
  assert.match(html, /rel="manifest"/);
  assert.match(html, /rel="icon"/);
});
