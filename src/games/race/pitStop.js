import { h } from '../../ui/dom.js';
import { t } from '../../data/i18n/index.js';
import { sound } from '../../audio/sound.js';
import { speech } from '../../audio/speech.js';

// Pit Stop: put on the 2 tires that make 10 (or 20 on Hard). Drawn as a number bond:
// the total on top, two empty circles below, tires to choose from. Any pair that adds up works.
/**
 * Pure: tire numbers for the pit stop. Exactly one pair adds up to `total` (never n + n),
 * 5 tires for 10 and 6 for 20. Returns { tires, a, b }.
 */
export function makeTires(total, rng) {
  const count = total >= 20 ? 6 : 5;
  let a = rng.int(1, total - 1);
  if (a * 2 === total) a = a - 1;
  const values = [a, total - a];
  for (let guard = 0; values.length < count && guard < 500; guard++) {
    const v = rng.int(1, total - 1);
    if (!values.includes(v) && !values.includes(total - v) && v * 2 !== total) values.push(v);
  }
  return { tires: rng.shuffle(values), a, b: total - a };
}

export function pitStop(parent, { total, rng, onStep = () => {} }) {
  return new Promise((resolve) => {
    const { tires, a } = makeTires(total, rng);
    const slots = [null, null];
    let misses = 0;
    const slotEls = [h('div.bond-slot'), h('div.bond-slot')];
    const row = h('div.tire-row');
    const el = h('div.pit', { role: 'dialog', 'aria-label': t('race.pitTitle') },
      h('div.pit-card', {},
        h('div.pit-title', {}, t('race.pitTitle')),
        h('div.bond', {}, h('div.bond-top', {}, String(total)), h('div.bond-lines', { html: '<svg viewBox="0 0 200 40"><path d="M100 0 L40 40 M100 0 L160 40" stroke="#2B2140" stroke-width="4"/></svg>' }), h('div.bond-row', {}, ...slotEls)),
        row));
    function render() {
      row.innerHTML = '';
      tires.forEach((v, i) => {
        const used = slots.includes(i);
        row.append(h(`button.tire${used ? '.used' : ''}${misses >= 2 && (v === a || v === total - a) && !used ? '.hint' : ''}`, {
          type: 'button', disabled: used, 'aria-label': String(v),
          onclick: () => pick(i),
        }, h('span', {}, String(v))));
      });
      slotEls.forEach((s, k) => { s.textContent = slots[k] === null ? '' : String(tires[slots[k]]); s.classList.toggle('filled', slots[k] !== null); });
    }
    function pick(i) {
      sound.unlock(); onStep('pop');
      const k = slots.indexOf(null);
      if (k < 0) return;
      slots[k] = i;
      render();
      if (slots.includes(null)) return;
      const sum = tires[slots[0]] + tires[slots[1]];
      if (sum === total) {
        sound.play('correct');
        el.classList.add('done');
        speech.say(t('race.pitDone', { a: tires[slots[0]], b: tires[slots[1]], total }));
        setTimeout(() => { el.remove(); resolve(true); }, 1500);
      } else {
        misses++;
        sound.play('oops');
        el.querySelector('.pit-card').classList.add('shake');
        setTimeout(() => { slots[0] = slots[1] = null; el.querySelector('.pit-card').classList.remove('shake'); render(); }, 700);
      }
    }
    render();
    parent.append(el);
    speech.say(t('race.pitSay', { total }));
  });
}
