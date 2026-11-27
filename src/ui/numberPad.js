import { h } from './dom.js';
import { t } from '../data/i18n/index.js';
import { sound } from '../audio/sound.js';

// Big on-screen number pad (3 x 4: 1-9, delete, 0, go). Children can only enter digits.
// Physical keyboards work too: number keys, Backspace, Enter.
//   const pad = createNumberPad({ maxDigits: 2, onChange(text), onSubmit(number) });
const DEL = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 10 H40 V38 H18 L6 24Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M22 18 L32 30 M32 18 L22 30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
const OK = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 25 L20 36 L40 13" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createNumberPad({ maxDigits = 2, onChange = () => {}, onSubmit = () => {} } = {}) {
  let text = '';
  let enabled = false;
  const set = (v) => { text = v; onChange(text); okBtn.disabled = !text; };
  const press = (d) => { if (!enabled) return; sound.unlock(); sound.play('tap'); if (text.length < maxDigits) set(text === '0' ? String(d) : text + d); };
  const back = () => { if (!enabled) return; sound.play('tap'); set(text.slice(0, -1)); };
  const submit = () => { if (!enabled || !text) return; const v = Number(text); set(''); onSubmit(v); };

  const key = (d) => h('button.pad-key', { type: 'button', onclick: () => press(d) }, String(d));
  const delBtn = h('button.pad-key.pad-del', { type: 'button', 'aria-label': t('pad.delete'), html: DEL, onclick: back });
  const okBtn = h('button.pad-key.pad-ok', { type: 'button', 'aria-label': t('pad.go'), html: OK, onclick: submit, disabled: true });
  const el = h('div.number-pad', { role: 'group', 'aria-label': t('pad.label'), hidden: true },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(key), delBtn, key(0), okBtn);

  const onKey = (e) => {
    if (!enabled || e.repeat) return;
    if (/^[0-9]$/.test(e.key)) { press(Number(e.key)); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Backspace') { back(); e.preventDefault(); }
    else if (e.key === 'Enter') { submit(); e.preventDefault(); e.stopPropagation(); }
  };
  window.addEventListener('keydown', onKey, true);

  return {
    el,
    get value() { return text; },
    show() { enabled = true; el.hidden = false; set(''); },
    hide() { enabled = false; el.hidden = true; set(''); },
    get open() { return enabled; },
    destroy() { window.removeEventListener('keydown', onKey, true); el.remove(); },
  };
}
