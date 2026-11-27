// Sticker album art: one small original picture per story page (and later, finished pictures).
const svg = (body, bg = '#FFF7E0') => `<svg viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="20" fill="${bg}"/>${body}</svg>`;
const starPath = (cx, cy, r, fill) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`; }
  return `<path d="${d}Z" fill="${fill}" stroke="#2B2140" stroke-width="2.5" stroke-linejoin="round"/>`;
};

export const stickerArt = {
  goldenWheel: svg(`<circle cx="60" cy="60" r="38" fill="#2B2140"/><circle cx="60" cy="60" r="24" fill="#FFD43B" stroke="#E59F00" stroke-width="4"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M60 60 L${60 + 22 * Math.cos(i * 1.2566)} ${60 + 22 * Math.sin(i * 1.2566)}" stroke="#E59F00" stroke-width="4"/>`).join('')}
    <circle cx="60" cy="60" r="7" fill="#fff"/><path d="M20 102 Q60 86 100 102" stroke="#69DB7C" stroke-width="8" fill="none"/>`),
  mirror: svg(`<ellipse cx="60" cy="54" rx="28" ry="34" fill="#BDE6FF" stroke="#8E5CD9" stroke-width="7"/><path d="M48 40 L58 32 M46 54 L66 36" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <rect x="54" y="88" width="12" height="20" rx="4" fill="#8E5CD9"/>`, '#FFF1D6'),
  scarf: svg(`<path d="M22 46 Q60 30 98 46 L94 62 Q60 48 26 62Z" fill="#E63946" stroke="#2B2140" stroke-width="3"/><path d="M70 56 L78 104 L62 104 L58 58Z" fill="#E63946" stroke="#2B2140" stroke-width="3"/>
    <path d="M30 48 L34 58 M44 42 L46 54 M60 40 L60 52 M64 80 H74 M62 92 H76" stroke="#fff" stroke-width="4"/>`, '#EAF6FF'),
  rainbow: svg(`${['#FF6B6B', '#FFD43B', '#69DB7C', '#4DABF7', '#B983FF'].map((c, i) => `<path d="M${16 + i * 8} 92 A${44 - i * 8} ${44 - i * 8} 0 0 1 ${104 - i * 8} 92" stroke="${c}" stroke-width="8" fill="none"/>`).join('')}
    <ellipse cx="24" cy="94" rx="16" ry="9" fill="#fff"/><ellipse cx="96" cy="94" rx="16" ry="9" fill="#fff"/>`, '#E3F4FF'),
  treasure: svg(`<rect x="24" y="52" width="72" height="44" rx="6" fill="#B07A50" stroke="#2B2140" stroke-width="3"/><path d="M24 58 Q60 24 96 58Z" fill="#C98D5E" stroke="#2B2140" stroke-width="3"/>
    <rect x="54" y="60" width="12" height="14" rx="3" fill="#FFD43B" stroke="#2B2140" stroke-width="2.5"/>${starPath(36, 30, 8, '#FFD43B')}${starPath(88, 26, 6, '#FFD43B')}`, '#FFF1D6'),
  snowflake: svg(`${[0, 1, 2].map((i) => `<path d="M60 18 V102 M50 26 L60 36 L70 26 M50 94 L60 84 L70 94" stroke="#4DABF7" stroke-width="6" stroke-linecap="round" fill="none" transform="rotate(${i * 60} 60 60)"/>`).join('')}`, '#EAF6FF'),
  cactus: svg(`<rect x="50" y="30" width="20" height="70" rx="10" fill="#FFD43B" stroke="#E59F00" stroke-width="3"/><path d="M50 66 H36 Q30 66 30 58 V46" stroke="#FFD43B" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M70 56 H84 Q90 56 90 48 V40" stroke="#FFD43B" stroke-width="12" stroke-linecap="round" fill="none"/><circle cx="60" cy="26" r="8" fill="#FF8FAB"/><rect x="34" y="98" width="52" height="10" rx="4" fill="#E9B872"/>`, '#FFF1D6'),
  mountain: svg(`<path d="M8 102 L48 34 L66 62 L78 46 L112 102Z" fill="#8EA3B8" stroke="#2B2140" stroke-width="3" stroke-linejoin="round"/><path d="M38 52 L48 34 L58 52 L52 48 L46 54Z M72 54 L78 46 L84 56Z" fill="#fff"/>
    <path d="M48 34 V14" stroke="#2B2140" stroke-width="3"/><path d="M48 14 L64 19 L48 24Z" fill="#E63946"/>`, '#EAF6FF'),
  trophy: svg(`<path d="M40 26 H80 V48 Q80 72 60 74 Q40 72 40 48Z" fill="#FFD43B" stroke="#2B2140" stroke-width="3"/><path d="M40 32 H28 Q26 52 42 54 M80 32 H92 Q94 52 78 54" stroke="#2B2140" stroke-width="3" fill="none"/>
    <rect x="54" y="74" width="12" height="14" fill="#E59F00"/><rect x="40" y="88" width="40" height="12" rx="4" fill="#5B5070"/>${starPath(60, 46, 10, '#fff')}`),
};
