// Icon-led UI: every button has an icon so it works before reading and in any language.
const S = (body, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const st = 'fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  home: S(`<path d="M8 24 L24 9 L40 24" ${st}/><path d="M13 21 V39 H35 V21" ${st}/><path d="M21 39 V29 H27 V39" ${st}/>`),
  left: S(`<path d="M29 10 L15 24 L29 38" ${st} stroke-width="7"/>`),
  right: S(`<path d="M19 10 L33 24 L19 38" ${st} stroke-width="7"/>`),
  up: S(`<path d="M10 29 L24 15 L38 29" ${st} stroke-width="7"/>`),
  back: S(`<path d="M20 12 L8 24 L20 36 M8 24 H40" ${st}/>`),
  next: S(`<path d="M28 12 L40 24 L28 36 M40 24 H8" ${st}/>`),
  replay: S(`<path d="M38 24 A14 14 0 1 1 33.9 14.1" ${st}/><path d="M35 5 V15 H25" ${st}/>`),
  map: S(`<path d="M6 12 L17 8 L31 13 L42 9 V36 L31 40 L17 35 L6 39Z" ${st} stroke-width="4"/><path d="M17 8 V35 M31 13 V40" ${st} stroke-width="4"/>`),
  check: S(`<path d="M9 25 L20 36 L40 13" ${st} stroke-width="7"/>`),
  plus: S(`<path d="M24 9 V39 M9 24 H39" ${st} stroke-width="7"/>`),
  minus: S(`<path d="M9 24 H39" ${st} stroke-width="7"/>`),
  mixed: S(`<path d="M8 14 H24 M16 6 V22" ${st} stroke-width="5"/><path d="M26 34 H42" ${st} stroke-width="5"/><path d="M38 8 L10 40" ${st} stroke-width="3"/>`),
  bond: S(`<text x="24" y="33" text-anchor="middle" font-size="26" font-weight="800" font-family="Trebuchet MS, sans-serif" fill="currentColor">10</text><circle cx="24" cy="24" r="20" ${st} stroke-width="3.5"/>`),
  lock: S(`<rect x="10" y="21" width="28" height="20" rx="5" fill="currentColor"/><path d="M16 21 V15 A8 8 0 0 1 32 15 V21" ${st}/>`),
  gear: S(`<circle cx="24" cy="24" r="7" ${st} stroke-width="4"/><path d="M24 4 V10 M24 38 V44 M4 24 H10 M38 24 H44 M9.9 9.9 L14.1 14.1 M33.9 33.9 L38.1 38.1 M9.9 38.1 L14.1 33.9 M33.9 14.1 L38.1 9.9" ${st} stroke-width="5"/>`),
  soundOn: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8Z" fill="currentColor"/><path d="M32 17 Q37 24 32 31 M36 12 Q45 24 36 36" ${st} stroke-width="4"/>`),
  soundOff: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8Z" fill="currentColor"/><path d="M32 18 L42 30 M42 18 L32 30" ${st} stroke-width="4"/>`),
  speak: S(`<path d="M8 18 H16 L26 9 V39 L16 30 H8Z" fill="currentColor"/><path d="M32 17 Q37 24 32 31" ${st} stroke-width="4"/>`),
  dots: S(`<circle cx="14" cy="17" r="6" fill="currentColor"/><circle cx="34" cy="17" r="6" fill="currentColor"/><circle cx="14" cy="33" r="6" fill="currentColor"/><circle cx="34" cy="33" r="6" fill="currentColor"/><circle cx="24" cy="25" r="6" fill="currentColor"/>`),
  star: S(`<path d="M24 4 L29.4 16.6 L43 17.8 L32.7 26.8 L35.8 40.1 L24 33 L12.2 40.1 L15.3 26.8 L5 17.8 L18.6 16.6Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`),
  starEmpty: S(`<path d="M24 4 L29.4 16.6 L43 17.8 L32.7 26.8 L35.8 40.1 L24 33 L12.2 40.1 L15.3 26.8 L5 17.8 L18.6 16.6Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>`),
};

// Shapes that pair with each accent colour so colour is never the only cue.
export const shapes = {
  heart: '<path d="M24 41 C8 29 4 21 8 14 C12 7 21 8 24 15 C27 8 36 7 40 14 C44 21 40 29 24 41Z" fill="#fff"/>',
  triangle: '<path d="M24 8 L42 40 H6Z" fill="#fff"/>',
  star: '<path d="M24 5 L29 17 L42 18 L32 27 L35 40 L24 33 L13 40 L16 27 L6 18 L19 17Z" fill="#fff"/>',
  square: '<rect x="9" y="9" width="30" height="30" rx="5" fill="#fff"/>',
  circle: '<circle cx="24" cy="24" r="16" fill="#fff"/>',
  diamond: '<path d="M24 5 L42 24 L24 43 L6 24Z" fill="#fff"/>',
};
export const shapeSvg = (name) => `<svg viewBox="0 0 48 48" aria-hidden="true">${shapes[name] || shapes.circle}</svg>`;
