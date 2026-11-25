import { h, iconButton, logo } from '../dom.js';
import { icons } from '../icons.js';
import { t, languages } from '../../data/i18n/index.js';
import { branding } from '../../data/branding.js';
import { packs, getPack } from '../../data/packs/index.js';
import { getCharacter } from '../../data/characters.js';
import { profileBadge } from './profiles.js';
import { starsRow } from './map.js';
import { worldStars } from '../../save/store.js';

// Grown-ups screen. Reached by holding the gear 3 s, or by answering the adult question.
// Text-based on purpose (adults read); every string still comes from the translation files.
const upcomingPacks = [{ id: 'pack2', nameKey: 'pack.pack2' }];

export function adult(app) {
  const store = app.store;
  let selId = store.active()?.id || store.profiles()[0]?.id || null;
  const body = h('div.adult-body');
  const el = h('div.screen.adult', {}, body, iconButton(icons.back, t('btn.back'), () => app.back(), 'back-btn'));

  /** Two-tap button for destructive actions. */
  function confirmButton(label, action) {
    const b = h('button.text-btn.danger', { type: 'button' }, label);
    let armed = 0;
    b.addEventListener('click', () => {
      if (armed) { clearTimeout(armed); action(); return; }
      b.textContent = t('adult.confirm'); b.classList.add('armed');
      armed = setTimeout(() => { armed = 0; b.textContent = label; b.classList.remove('armed'); }, 3500);
    });
    return b;
  }
  const textBtn = (label, onclick, cls = '') => h(`button.text-btn${cls}`, { type: 'button', onclick }, label);
  const toggle = (label, checked, onChange) => {
    const input = h('input', { type: 'checkbox', checked: checked || null });
    input.addEventListener('change', () => onChange(input.checked));
    return h('label.toggle', {}, input, h('span', {}, label));
  };
  const section = (title, ...kids) => h('section.adult-card', {}, h('h2', {}, title), ...kids);

  function playerPanel() {
    const list = store.profiles();
    if (!list.length) return section(t('adult.players'), h('p', {}, t('adult.noPlayers')));
    const row = h('div.player-row');
    for (const p of list) {
      row.append(h('button.player-pick', {
        type: 'button', 'aria-pressed': String(p.id === selId),
        'aria-label': `${getCharacter(p.animal).name}, ${t('color.' + p.color)}`,
        onclick: () => { selId = p.id; render(); },
      }, profileBadge(p, 64)));
    }
    const p = list.find((x) => x.id === selId) || list[0];
    selId = p.id;
    const pack = getPack(p.pack);

    // pack switch (adult override)
    const packRow = h('div.seg');
    for (const pk of packs) {
      packRow.append(h('button.seg-btn', { type: 'button', 'aria-pressed': String(pk.id === p.pack),
        onclick: () => { store.updateProfile(p.id, { pack: pk.id }); render(); } }, t(pk.nameKey)));
    }
    for (const pk of upcomingPacks) packRow.append(h('button.seg-btn', { type: 'button', disabled: true }, `${t(pk.nameKey)} (${t('adult.comingSoon')})`));

    // progress per world + mastery per skill
    const table = h('table.skill-table', {},
      h('thead', {}, h('tr', {}, ...['adult.world', 'adult.skill', '', 'adult.right', 'adult.wrong', 'adult.level', 'adult.help'].map((k) => h('th', {}, k ? t(k) : '')))));
    const tb = h('tbody');
    pack.worlds.forEach((w, i) => {
      const s = p.skills[w.skill] || {};
      const lvl = s.level || 0;
      tb.append(h('tr', {},
        h('td', {}, String(i + 1)),
        h('td', {}, t('skill.' + w.skill)),
        h('td', {}, starsRow(worldStars(p, pack.id, w.id))),
        h('td.num', {}, String(s.correct || 0)),
        h('td.num', {}, String(s.wrong || 0)),
        h('td', { 'aria-label': `${lvl + 1} / 3` }, '●'.repeat(lvl + 1) + '○'.repeat(2 - lvl)),
        h('td', {}, s.boost ? t('adult.helpOn') : '–')));
    });
    table.append(tb);

    // placement check
    const pl = p.placement;
    const placementInfo = h('div.placement', {},
      h('p', {}, pl ? t('adult.placementResult', { date: pl.at, within10: pl.within10, within20: pl.within20 }) : t('adult.placementNone')),
      pl ? h('p', {}, h('b', {}, pl.pack === 'pack2' ? t('adult.suggestPack2') : t('adult.suggestPack1', { n: pl.startWorld + 1 }))) : null,
      h('div.btn-row', {},
        textBtn(t('adult.placementRun'), () => { store.setActive(p.id); app.go('play', { placement: true }); }, '.primary'),
        pl ? textBtn(t('adult.apply'), () => {
          if (pl.pack === 'pack2') store.updateProfile(p.id, { unlockAll: true });
          else store.applyStartWorld(p.id, pack, pl.startWorld);
          render();
        }) : null));

    return section(t('adult.players'),
      row,
      h('h3', {}, t('adult.pack')), packRow,
      h('h3', {}, t('adult.progress')), h('div.table-wrap', {}, table),
      toggle(t('adult.unlockAll'), p.unlockAll, (v) => store.updateProfile(p.id, { unlockAll: v })),
      h('h3', {}, t('adult.placement')), placementInfo,
      h('div.btn-row.danger-row', {},
        confirmButton(t('adult.reset'), () => { store.resetProgress(p.id); render(); }),
        confirmButton(t('adult.remove'), () => { store.removeProfile(p.id); selId = null; render(); })));
  }

  function settingsPanel() {
    const s = store.settings;
    const set = (patch) => { store.updateSettings(patch); app.applySettings(); };
    const vol = h('input.vol', { type: 'range', min: '0', max: '1', step: '0.05', value: String(s.volume), 'aria-label': t('adult.volume') });
    vol.addEventListener('input', () => set({ volume: Number(vol.value) }));
    const lang = h('div.seg');
    for (const l of languages) {
      lang.append(h('button.seg-btn', { type: 'button', lang: l.id, 'aria-pressed': String(s.lang === l.id),
        onclick: () => { set({ lang: l.id }); render(); } }, l.label));
    }
    return section(t('adult.general'),
      toggle(t('adult.sound'), s.sound, (v) => set({ sound: v })),
      h('label.toggle', {}, h('span', {}, t('adult.volume')), vol),
      toggle(t('adult.voice'), s.voice, (v) => set({ voice: v })),
      toggle(t('adult.music'), s.music, (v) => set({ music: v })),
      toggle(t('adult.calm'), s.calm, (v) => set({ calm: v })),
      toggle(t('adult.reducedMotion'), s.reducedMotion, (v) => set({ reducedMotion: v })),
      toggle(t('adult.highContrast'), s.highContrast, (v) => set({ highContrast: v })),
      h('h3', {}, t('adult.language')), lang);
  }

  function aboutPanel() {
    return section(t('adult.about'),
      h('div.adult-logos', {}, logo('enrich', 'logo-about'), logo('school', 'logo-about-school')),
      h('p.about-line', {}, `${branding.programName}, ${branding.schoolName}`),
      h('p.about-line', { lang: 'ar', dir: 'rtl' }, branding.schoolNameAr),
      h('p.small', {}, t('adult.privacy')));
  }

  function render() {
    const scroll = body.scrollTop;
    body.innerHTML = '';
    body.append(h('h1.title', {}, t('adult.title')),
      h('div.adult-grid', {}, playerPanel(), h('div.adult-col', {}, settingsPanel(), aboutPanel())));
    body.scrollTop = scroll;
  }
  render();
  return { el, chrome: false };
}
