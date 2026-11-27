import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pictures, stepPictures, pictureSvg, finishedSvg } from '../src/games/colorByCode/pictures.js';
import { buildColoring, equationText } from '../src/games/colorByCode/coloring.js';
import { difficulties } from '../src/data/difficulty.js';
import { createRng } from '../src/math/rng.js';

test('6 pictures with valid regions, every colour used', () => {
  assert.equal(pictures.length, 6);
  assert.equal(new Set(pictures.map((p) => p.id)).size, 6);
  for (const p of pictures) {
    assert.equal(new Set(p.regions.map((r) => r.id)).size, p.regions.length, p.id);
    for (const r of p.regions) assert.ok(r.slot >= 0 && r.slot < p.colors.length, `${p.id}.${r.id}`);
    for (let s = 0; s < p.colors.length; s++) assert.ok(p.regions.some((r) => r.slot === s), `${p.id}: colour ${s} unused`);
    assert.ok(pictureSvg(p).startsWith('<svg') && finishedSvg(p).includes(p.colors[0]));
  }
  assert.deepEqual(stepPictures.flat().sort(), pictures.map((p) => p.id).sort());
});

for (const d of difficulties) for (const step of d.steps) {
  test(`${step.id}: every region's equation equals its colour's number`, () => {
    for (let seed = 0; seed < 15; seed++) for (const pic of pictures) {
      const { legend, regions } = buildColoring(pic, step, createRng(seed * 31 + 7));
      assert.equal(new Set(legend.map((l) => l.value)).size, legend.length, 'each colour has its own number');
      for (const l of legend) assert.ok(l.value >= 0 && l.value <= d.range);
      for (const rg of regions) {
        const want = legend.find((l) => l.slot === rg.slot).value;
        assert.equal(rg.q.answer, want, `${pic.id}.${rg.id}`);
        assert.equal(typeof rg.q.answer, 'number');
        for (const v of rg.q.tokens.filter((x) => typeof x === 'number')) assert.ok(v >= 0 && v <= d.range);
        assert.ok(equationText(rg.q).length > 0);
      }
    }
  });
}
