import { branding } from '../data/branding.js';
import { t } from '../data/i18n/index.js';
import { sound } from '../audio/sound.js';

/** h('div.class', {attrs}, ...children) — tiny element helper */
export function h(tag, attrs = {}, ...kids) {
  const [name, ...cls] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}

/** Big icon button (>= 64px). label is the accessible name; text is optional visible text. */
export function iconButton(icon, label, onClick, cls = '') {
  return h(`button.btn${cls ? '.' + cls.split(' ').join('.') : ''}`, {
    type: 'button', 'aria-label': label, title: label, html: icon,
    onclick: (e) => { sound.unlock(); sound.play('tap'); onClick?.(e); },
  });
}

/**
 * Logo shown untouched (object-fit: contain) on a light rounded panel with clear space.
 * If the file is missing, a plain text placeholder is shown instead (never a redrawn logo).
 */
export function logo(kind = 'enrich', cls = '') {
  const src = kind === 'school' ? branding.schoolLogo : branding.enrichLogo;
  const alt = kind === 'school' ? `${branding.schoolName} ${branding.schoolNameAr}` : `${branding.programName}, ${branding.schoolName}`;
  const panel = h(`div.logo-panel.logo-${kind}${cls ? '.' + cls : ''}`, { 'aria-hidden': kind === 'corner' ? 'true' : null });
  const img = h('img', { src, alt, draggable: 'false' });
  img.addEventListener('error', () => {
    img.remove();
    panel.classList.add('logo-missing');
    panel.append(h('span.logo-text', {}, kind === 'school' ? branding.schoolName : t('about.line')));
  });
  panel.append(img);
  return panel;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
