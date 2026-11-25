// Characters are pure data. Adding one = adding an entry here; no game logic changes.
// { id, name, colors, head(): svg markup in a 120x120 box, voiceStyle, cheerLines (i18n keys) }
// Names are display text only and can be edited freely.

const eye = (x, y) =>
  `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="7" fill="#2B2140"/><circle cx="${x + 1.8}" cy="${y - 2.5}" r="2" fill="#fff"/>`;
const cheeks = (y, dx = 24, fill = '#FF9AA2') =>
  `<circle cx="${60 - dx}" cy="${y}" r="6" fill="${fill}" opacity=".6"/><circle cx="${60 + dx}" cy="${y}" r="6" fill="${fill}" opacity=".6"/>`;
const smile = (d, w = 3) => `<path d="${d}" fill="none" stroke="#2B2140" stroke-width="${w}" stroke-linecap="round"/>`;

export const characters = [
  {
    id: 'hippo', name: 'Hugo',
    colors: { main: '#9C8FD0', light: '#C3B9EC', dark: '#6A5BA8' },
    voiceStyle: { pitch: 0.8, rate: 0.9 },
    cheerLines: ['cheer.yay', 'cheer.great', 'cheer.hooray'],
    head: (c) => `
      <circle cx="34" cy="24" r="10" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><circle cx="34" cy="24" r="5" fill="#F7A8C0"/>
      <circle cx="86" cy="24" r="10" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><circle cx="86" cy="24" r="5" fill="#F7A8C0"/>
      <ellipse cx="60" cy="56" rx="42" ry="38" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="84" rx="38" ry="26" fill="${c.light}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="47" cy="78" rx="4" ry="5.5" fill="${c.dark}"/><ellipse cx="73" cy="78" rx="4" ry="5.5" fill="${c.dark}"/>
      ${eye(44, 46)}${eye(76, 46)}${cheeks(66, 32)}
      ${smile('M46 94 Q60 103 74 94')}`,
  },
  {
    id: 'bear', name: 'Bruno',
    colors: { main: '#B07A50', light: '#EBCCA6', dark: '#7A4F2E' },
    voiceStyle: { pitch: 0.7, rate: 0.85 },
    cheerLines: ['cheer.great', 'cheer.super', 'cheer.youGotIt'],
    head: (c) => `
      <circle cx="28" cy="28" r="16" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><circle cx="28" cy="28" r="8" fill="${c.light}"/>
      <circle cx="92" cy="28" r="16" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><circle cx="92" cy="28" r="8" fill="${c.light}"/>
      <circle cx="60" cy="64" r="44" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="82" rx="22" ry="17" fill="${c.light}"/>
      <ellipse cx="60" cy="74" rx="8.5" ry="6.5" fill="#3B2A20"/>
      ${eye(43, 56)}${eye(77, 56)}${cheeks(76, 30)}
      ${smile('M52 85 Q60 92 68 85')}`,
  },
  {
    id: 'frog', name: 'Fiona',
    colors: { main: '#6CC46E', light: '#B9E8A6', dark: '#3E8E45' },
    voiceStyle: { pitch: 1.3, rate: 1.0 },
    cheerLines: ['cheer.wow', 'cheer.yay', 'cheer.super'],
    head: (c) => `
      <circle cx="36" cy="36" r="19" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <circle cx="84" cy="36" r="19" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="72" rx="50" ry="36" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="86" rx="34" ry="18" fill="${c.light}"/>
      <circle cx="36" cy="36" r="13" fill="#fff"/><circle cx="84" cy="36" r="13" fill="#fff"/>
      <circle cx="38" cy="38" r="6.5" fill="#2B2140"/><circle cx="86" cy="38" r="6.5" fill="#2B2140"/>
      <circle cx="40" cy="35" r="2.2" fill="#fff"/><circle cx="88" cy="35" r="2.2" fill="#fff"/>
      <circle cx="54" cy="64" r="2" fill="${c.dark}"/><circle cx="66" cy="64" r="2" fill="${c.dark}"/>
      ${cheeks(78, 36)}
      ${smile('M34 78 Q60 102 86 78', 3.5)}`,
  },
  {
    id: 'cat', name: 'Kiki',
    colors: { main: '#F2A65A', light: '#FCE1C0', dark: '#B56E2A' },
    voiceStyle: { pitch: 1.4, rate: 1.05 },
    cheerLines: ['cheer.yay', 'cheer.youGotIt', 'cheer.wow'],
    head: (c) => `
      <path d="M22 52 L28 10 L58 32 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M98 52 L92 10 L62 32 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 40 L32 20 L46 32 Z" fill="#F7A8C0"/><path d="M90 40 L88 20 L74 32 Z" fill="#F7A8C0"/>
      <circle cx="60" cy="64" r="42" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="84" rx="24" ry="16" fill="${c.light}"/>
      ${eye(45, 58)}${eye(75, 58)}${cheeks(78, 30)}
      <path d="M54 72 L66 72 L60 79 Z" fill="#F27B9B" stroke="#C4506F" stroke-width="1.5" stroke-linejoin="round"/>
      ${smile('M60 79 Q55 87 48 83 M60 79 Q65 87 72 83', 2.5)}
      <g stroke="${c.dark}" stroke-width="2" stroke-linecap="round">
        <path d="M30 74 L10 70 M30 80 L10 84 M90 74 L110 70 M90 80 L110 84"/></g>`,
  },
  {
    id: 'bunny', name: 'Benny',
    colors: { main: '#F3F0F8', light: '#FFFFFF', dark: '#A89CC0' },
    voiceStyle: { pitch: 1.5, rate: 1.1 },
    cheerLines: ['cheer.hooray', 'cheer.great', 'cheer.yay'],
    head: (c) => `
      <ellipse cx="40" cy="32" rx="12" ry="28" transform="rotate(-12 40 32)" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="80" cy="32" rx="12" ry="28" transform="rotate(12 80 32)" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="40" cy="34" rx="5.5" ry="18" transform="rotate(-12 40 34)" fill="#F7A8C0"/>
      <ellipse cx="80" cy="34" rx="5.5" ry="18" transform="rotate(12 80 34)" fill="#F7A8C0"/>
      <circle cx="60" cy="72" r="40" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      ${eye(46, 66)}${eye(74, 66)}${cheeks(82, 28)}
      <ellipse cx="60" cy="79" rx="6" ry="4.5" fill="#F27B9B"/>
      ${smile('M60 83 Q55 90 49 87 M60 83 Q65 90 71 87', 2.5)}
      <rect x="55" y="87" width="10" height="9" rx="2" fill="#fff" stroke="${c.dark}" stroke-width="1.5"/>
      <path d="M60 87 V96" stroke="${c.dark}" stroke-width="1.2"/>`,
  },
  {
    id: 'fox', name: 'Rosie',
    colors: { main: '#EE7A3C', light: '#FFF4E6', dark: '#A64A1A' },
    voiceStyle: { pitch: 1.15, rate: 1.0 },
    cheerLines: ['cheer.super', 'cheer.wow', 'cheer.youGotIt'],
    head: (c) => `
      <path d="M20 50 L26 6 L56 30 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M100 50 L94 6 L64 30 Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M29 38 L31 18 L45 30 Z" fill="#5A2E1A"/><path d="M91 38 L89 18 L75 30 Z" fill="#5A2E1A"/>
      <circle cx="60" cy="62" r="42" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <path d="M19 64 Q60 120 101 64 Q82 78 60 76 Q38 78 19 64 Z" fill="${c.light}"/>
      ${eye(43, 54)}${eye(77, 54)}${cheeks(72, 32)}
      <ellipse cx="60" cy="80" rx="7" ry="5.5" fill="#2B2140"/>
      ${smile('M52 89 Q60 95 68 89')}`,
  },
];

export const getCharacter = (id) => characters.find((c) => c.id === id) || characters[0];

/** Face only, for pickers and the vehicle. */
export function faceSvg(ch, size = 120) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">${ch.head(ch.colors)}</svg>`;
}

/** Full body for roadside friends and signboard holders. pose: 'idle' | 'wave' | 'cheer' | 'hold' */
export function bodySvg(ch, pose = 'idle', size = 120) {
  const c = ch.colors;
  const arm = (x, y, rot) =>
    `<ellipse cx="${x}" cy="${y}" rx="9" ry="22" transform="rotate(${rot} ${x} ${y})" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>`;
  const arms = {
    idle: arm(30, 142, 20) + arm(90, 142, -20),
    wave: arm(30, 142, 20) + arm(96, 112, -150),
    cheer: arm(24, 112, 150) + arm(96, 112, -150),
    hold: arm(22, 116, 130) + arm(98, 116, -130),
  }[pose];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 190" width="${size}" height="${(size * 190) / 120}" aria-hidden="true">
    <ellipse cx="44" cy="180" rx="14" ry="8" fill="${c.dark}"/><ellipse cx="76" cy="180" rx="14" ry="8" fill="${c.dark}"/>
    <ellipse cx="60" cy="146" rx="34" ry="36" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
    <ellipse cx="60" cy="152" rx="20" ry="22" fill="${c.light}"/>
    ${arms}
    <g>${ch.head(c)}</g></svg>`;
}
