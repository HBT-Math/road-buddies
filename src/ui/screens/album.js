import { h, iconButton } from '../dom.js';
import { icons } from '../icons.js';
import { t } from '../../data/i18n/index.js';
import { cups } from '../../data/cups.js';
import { stickerArt } from '../../data/stickers.js';
import { difficulties } from '../../data/difficulty.js';

// Sticker album: story pages from Race cups (Color by Code pictures will join later).
// Pages are collected per child; locked ones show as a grey silhouette.
export const albumSources = [];   // other games add functions (profile) => [{ id, title, art, text }]

export function album(app) {
  const profile = app.store.active();
  const owned = new Set(profile?.stickers || []);
  const pages = [];
  for (const d of difficulties) for (const c of cups[d.id]) pages.push({ id: `race:${c.id}`, title: c.title, art: stickerArt[c.sticker], text: c.page });
  for (const extra of albumSources) pages.push(...extra(profile));
  const grid = h('div.album-grid');
  for (const pg of pages) {
    const have = owned.has(pg.id);
    grid.append(h(`div.album-page${have ? '' : '.locked'}`, { 'aria-label': have ? pg.title : t('world.locked') },
      h('div.album-art', { html: have ? pg.art : icons.lock }),
      h('div.album-name', {}, have ? pg.title : '?'),
      have && pg.text ? h('p.album-text', {}, pg.text) : null));
  }
  const el = h('div.screen.menu.album', {},
    iconButton(icons.back, t('btn.back'), () => app.back(), 'corner-home'),
    h('h1.title', {}, h('span.title-icon', { html: icons.book }), t('album.title'), h('span.album-count', {}, ` ${owned.size}`)),
    grid);
  return { el };
}
