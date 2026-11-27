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
    id: 'panda', name: 'Pandy',
    colors: { main: '#FFFFFF', light: '#F1F1F4', dark: '#2E2B3A', limbs: '#2E2B3A' },
    voiceStyle: { pitch: 1.2, rate: 0.95 },
    cheerLines: ['cheer.yay', 'cheer.super', 'cheer.youGotIt'],
    head: (c) => `
      <circle cx="28" cy="28" r="15" fill="${c.dark}"/>
      <circle cx="92" cy="28" r="15" fill="${c.dark}"/>
      <circle cx="60" cy="64" r="44" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="42" cy="58" rx="12" ry="15" transform="rotate(25 42 58)" fill="${c.dark}"/>
      <ellipse cx="78" cy="58" rx="12" ry="15" transform="rotate(-25 78 58)" fill="${c.dark}"/>
      <circle cx="43" cy="57" r="6.5" fill="#fff"/><circle cx="77" cy="57" r="6.5" fill="#fff"/>
      <circle cx="44" cy="58" r="3.6" fill="${c.dark}"/><circle cx="78" cy="58" r="3.6" fill="${c.dark}"/>
      <circle cx="45" cy="56" r="1.4" fill="#fff"/><circle cx="79" cy="56" r="1.4" fill="#fff"/>
      ${cheeks(80, 30)}
      <ellipse cx="60" cy="76" rx="8" ry="5.5" fill="${c.dark}"/>
      ${smile('M52 86 Q60 93 68 86')}`,
  },
  {
    id: 'penguin', name: 'Pingo',
    colors: { main: '#3D4F7A', light: '#FFFFFF', dark: '#222C47', feet: '#F7A531' },
    voiceStyle: { pitch: 1.35, rate: 1.05 },
    cheerLines: ['cheer.wow', 'cheer.hooray', 'cheer.great'],
    head: (c) => `
      <circle cx="60" cy="62" r="46" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <path d="M60 40 C48 26 22 34 24 62 C26 90 46 104 60 104 C74 104 94 90 96 62 C98 34 72 26 60 40 Z" fill="${c.light}"/>
      ${eye(45, 60)}${eye(75, 60)}${cheeks(80, 30)}
      <path d="M50 74 L70 74 L60 88 Z" fill="#F7A531" stroke="#C97A12" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M53 79 L67 79" stroke="#C97A12" stroke-width="2"/>`,
  },
  {
    id: 'sheep', name: 'Sunny',
    colors: { main: '#FFFFFF', light: '#F4E6D2', dark: '#9C8B78' },
    voiceStyle: { pitch: 1.45, rate: 1.0 },
    cheerLines: ['cheer.hooray', 'cheer.yay', 'cheer.super'],
    head: (c) => `
      ${[[30, 34], [46, 22], [62, 18], [78, 22], [92, 36], [22, 52], [98, 54], [26, 72], [94, 72]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>`).join('')}
      ${[[46, 22], [62, 18], [78, 22], [30, 34], [92, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${c.main}"/>`).join('')}
      <ellipse cx="24" cy="60" rx="14" ry="7" transform="rotate(-25 24 60)" fill="${c.light}" stroke="${c.dark}" stroke-width="2.5"/>
      <ellipse cx="96" cy="60" rx="14" ry="7" transform="rotate(25 96 60)" fill="${c.light}" stroke="${c.dark}" stroke-width="2.5"/>
      <ellipse cx="60" cy="68" rx="32" ry="38" fill="${c.light}" stroke="${c.dark}" stroke-width="3"/>
      <circle cx="44" cy="36" r="11" fill="${c.main}"/><circle cx="60" cy="32" r="12" fill="${c.main}"/><circle cx="76" cy="36" r="11" fill="${c.main}"/>
      ${eye(48, 62)}${eye(72, 62)}${cheeks(80, 22)}
      <path d="M54 82 Q60 86 66 82" fill="none" stroke="#6E5E50" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="60" cy="78" rx="5" ry="3.5" fill="#E58FA0"/>
      ${smile('M53 92 Q60 97 67 92', 2.5)}`,
  },
  {
    id: 'giraffe', name: 'Gigi',
    colors: { main: '#F5C451', light: '#FCE7B4', dark: '#A8721F' },
    voiceStyle: { pitch: 1.1, rate: 0.95 },
    cheerLines: ['cheer.great', 'cheer.wow', 'cheer.youGotIt'],
    head: (c) => `
      <path d="M44 30 L40 8 M76 30 L80 8" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="40" cy="8" r="7" fill="#8A5A1C"/><circle cx="80" cy="8" r="7" fill="#8A5A1C"/>
      <ellipse cx="20" cy="40" rx="14" ry="7" transform="rotate(-20 20 40)" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="100" cy="40" rx="14" ry="7" transform="rotate(20 100 40)" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <ellipse cx="60" cy="60" rx="38" ry="46" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
      <path d="M32 40 q6 -6 12 0 q-2 8 -10 6 z M82 34 q8 -4 12 4 q-6 6 -12 0 z M30 72 q6 -4 10 2 q-4 6 -10 2 z M86 70 q6 -2 8 4 q-6 4 -8 -4 z" fill="#D99A3A"/>
      <ellipse cx="60" cy="86" rx="26" ry="18" fill="${c.light}" stroke="${c.dark}" stroke-width="2.5"/>
      <ellipse cx="51" cy="82" rx="3" ry="4" fill="${c.dark}"/><ellipse cx="69" cy="82" rx="3" ry="4" fill="${c.dark}"/>
      ${eye(45, 54)}${eye(75, 54)}${cheeks(70, 30)}
      ${smile('M52 93 Q60 99 68 93', 2.5)}`,
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
    `<ellipse cx="${x}" cy="${y}" rx="9" ry="22" transform="rotate(${rot} ${x} ${y})" fill="${c.limbs || c.main}" stroke="${c.dark}" stroke-width="3"/>`;
  const arms = {
    idle: arm(30, 142, 20) + arm(90, 142, -20),
    wave: arm(30, 142, 20) + arm(96, 112, -150),
    cheer: arm(24, 112, 150) + arm(96, 112, -150),
    hold: arm(22, 116, 130) + arm(98, 116, -130),
  }[pose];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 190" width="${size}" height="${(size * 190) / 120}" aria-hidden="true">
    <ellipse cx="44" cy="180" rx="14" ry="8" fill="${c.feet || c.dark}"/><ellipse cx="76" cy="180" rx="14" ry="8" fill="${c.feet || c.dark}"/>
    <ellipse cx="60" cy="146" rx="34" ry="36" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/>
    <ellipse cx="60" cy="152" rx="20" ry="22" fill="${c.light}"/>
    ${arms}
    <g>${ch.head(c)}</g></svg>`;
}
