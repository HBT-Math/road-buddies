// Color by Code pictures: original drawings split into regions (400 x 300 box).
// Each region: { id, slot (index into colors), shape (SVG element, no fill), label: [x, y], fs (label size) }.
// deco: extra lines/details drawn on top that are not coloured (eyes, antennae, stars).
// Pictures are pure data: add one by adding an entry; the game and the album pick it up.
const r = (id, slot, shape, label, fs = 18) => ({ id, slot, shape, label, fs });

export const pictures = [
  {
    id: 'car', name: 'Car',
    colors: ['#74C0FC', '#69DB7C', '#FF6B6B', '#FFD43B', '#5B5070'],
    regions: [
      r('sky', 0, '<rect x="0" y="0" width="400" height="212"/>', [70, 50], 22),
      r('sun', 3, '<circle cx="335" cy="58" r="34"/>', [335, 64]),
      r('road', 1, '<rect x="0" y="212" width="400" height="88"/>', [200, 282], 22),
      r('body', 2, '<path d="M40 198 Q40 162 80 156 L122 150 L152 108 Q162 98 182 98 L268 98 Q290 98 302 114 L326 150 L356 158 Q374 164 374 186 L374 200 Q374 214 360 214 L54 214 Q40 214 40 198Z"/>', [205, 188], 22),
      r('window1', 0, '<path d="M160 146 L180 112 L224 112 L224 146Z"/>', [198, 134], 14),
      r('window2', 0, '<path d="M238 146 L238 112 L284 112 L306 146Z"/>', [266, 134], 14),
      r('wheel1', 4, '<circle cx="110" cy="214" r="32"/>', [110, 220], 15),
      r('wheel2', 4, '<circle cx="300" cy="214" r="32"/>', [300, 220], 15),
    ],
    deco: '<circle cx="362" cy="176" r="7" fill="#FFF3B0" stroke="#2B2140" stroke-width="2"/>',
  },
  {
    id: 'icecream', name: 'Ice cream',
    colors: ['#A5D8FF', '#B07A50', '#F0C27B', '#FF8FAB', '#8CE99A', '#E03131'],
    regions: [
      r('bg', 0, '<rect x="0" y="0" width="400" height="300"/>', [70, 50], 22),
      r('table', 1, '<rect x="0" y="256" width="400" height="44"/>', [320, 282], 18),
      r('cone', 2, '<path d="M150 150 L250 150 L200 262 Z"/>', [200, 190], 18),
      r('scoopL', 3, '<circle cx="164" cy="132" r="40"/>', [156, 138], 16),
      r('scoopR', 4, '<circle cx="236" cy="132" r="40"/>', [244, 138], 16),
      r('scoopTop', 3, '<circle cx="200" cy="88" r="42"/>', [200, 94], 16),
      r('cherry', 5, '<circle cx="200" cy="38" r="15"/>', [200, 43], 11),
    ],
    deco: '<path d="M165 170 L235 170 M172 190 L228 190 M180 210 L220 210" stroke="#2B2140" stroke-width="2" opacity=".5"/><path d="M200 24 Q206 10 216 8" stroke="#2B2140" stroke-width="3" fill="none"/>',
  },
  {
    id: 'flower', name: 'Flower',
    colors: ['#74C0FC', '#51CF66', '#FFD43B', '#FF8FAB', '#B983FF'],
    regions: [
      r('sky', 0, '<rect x="0" y="0" width="400" height="232"/>', [70, 50], 22),
      r('grass', 1, '<rect x="0" y="232" width="400" height="68"/>', [320, 272], 20),
      r('sun', 2, '<circle cx="345" cy="58" r="32"/>', [345, 64], 16),
      r('stem', 1, '<rect x="191" y="140" width="18" height="96"/>', [200, 215], 10),
      r('leafL', 1, '<ellipse cx="160" cy="205" rx="34" ry="14" transform="rotate(-25 160 205)"/>', [160, 209], 12),
      r('leafR', 1, '<ellipse cx="240" cy="190" rx="34" ry="14" transform="rotate(25 240 190)"/>', [240, 194], 12),
      ...[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 2, cx = Math.round(200 + Math.cos(a) * 46), cy = Math.round(108 + Math.sin(a) * 46);
        return r(`petal${i}`, i % 2 ? 4 : 3, `<ellipse cx="${cx}" cy="${cy}" rx="28" ry="19" transform="rotate(${Math.round((a * 180) / Math.PI)} ${cx} ${cy})"/>`, [cx, cy + 5], 13);
      }),
      r('center', 2, '<circle cx="200" cy="108" r="25"/>', [200, 114], 13),
    ],
    deco: '',
  },
  {
    id: 'elephant', name: 'Elephant',
    colors: ['#74C0FC', '#69DB7C', '#FFFFFF', '#ADB5BD', '#FFA8C5'],
    regions: [
      r('sky', 0, '<rect x="0" y="0" width="400" height="222"/>', [350, 160], 20),
      r('grass', 1, '<rect x="0" y="222" width="400" height="78"/>', [330, 274], 20),
      r('cloud', 2, '<path d="M250 62 a22 22 0 0 1 40 -12 a26 26 0 0 1 50 6 a20 20 0 0 1 4 40 h-88 a18 18 0 0 1 -6 -34z"/>', [298, 80], 15),
      r('body', 3, '<ellipse cx="215" cy="172" rx="95" ry="62"/>', [240, 168], 20),
      r('leg1', 3, '<rect x="140" y="200" width="36" height="62" rx="10"/>', [158, 246], 12),
      r('leg2', 3, '<rect x="250" y="200" width="36" height="62" rx="10"/>', [268, 246], 12),
      r('head', 3, '<circle cx="118" cy="128" r="52"/>', [104, 110], 15),
      r('trunk', 3, '<path d="M80 150 Q58 192 72 232 Q78 246 92 238 Q84 206 104 168Z"/>', [80, 206], 10),
      r('ear', 4, '<ellipse cx="160" cy="126" rx="32" ry="42"/>', [162, 130], 15),
    ],
    deco: '<circle cx="100" cy="122" r="6" fill="#2B2140"/><path d="M308 168 Q330 160 326 188" stroke="#2B2140" stroke-width="4" fill="none" stroke-linecap="round"/>',
  },
  {
    id: 'butterfly', name: 'Butterfly',
    colors: ['#A5D8FF', '#69DB7C', '#FF922B', '#B983FF', '#FFD43B', '#5B5070'],
    regions: [
      r('sky', 0, '<rect x="0" y="0" width="400" height="252"/>', [60, 44], 20),
      r('grass', 1, '<rect x="0" y="252" width="400" height="48"/>', [330, 280], 18),
      r('wingUL', 2, '<path d="M194 140 C150 58 66 48 66 106 C66 152 140 160 194 150Z"/>', [138, 128], 16),
      r('wingUR', 2, '<path d="M206 140 C250 58 334 48 334 106 C334 152 260 160 206 150Z"/>', [262, 128], 16),
      r('wingLL', 3, '<path d="M194 156 C150 160 92 190 112 228 C128 254 180 218 194 166Z"/>', [148, 206], 14),
      r('wingLR', 3, '<path d="M206 156 C250 160 308 190 288 228 C272 254 220 218 206 166Z"/>', [252, 206], 14),
      r('spotL', 4, '<circle cx="108" cy="96" r="18"/>', [108, 100], 10),
      r('spotR', 4, '<circle cx="292" cy="96" r="18"/>', [292, 100], 10),
      r('body', 5, '<ellipse cx="200" cy="158" rx="13" ry="58"/>', [200, 162], 9),
    ],
    deco: '<path d="M196 104 Q186 74 172 66 M204 104 Q214 74 228 66" stroke="#2B2140" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="172" cy="66" r="5" fill="#2B2140"/><circle cx="228" cy="66" r="5" fill="#2B2140"/>',
  },
  {
    id: 'rocket', name: 'Rocket',
    colors: ['#364FC7', '#FF922B', '#FFD43B', '#E9ECEF', '#FA5252', '#99E9F2'],
    regions: [
      r('space', 0, '<rect x="0" y="0" width="400" height="300"/>', [70, 50], 20),
      r('planet', 1, '<circle cx="330" cy="228" r="56"/>', [330, 234], 18),
      r('moon', 2, '<circle cx="72" cy="226" r="32"/>', [72, 232], 14),
      r('body', 3, '<path d="M170 212 L170 112 Q170 62 200 30 Q230 62 230 112 L230 212Z"/>', [200, 180], 16),
      r('nose', 4, '<path d="M200 30 Q180 50 175 72 L225 72 Q220 50 200 30Z"/>', [200, 60], 10),
      r('window', 5, '<circle cx="200" cy="118" r="19"/>', [200, 123], 11),
      r('finL', 4, '<path d="M170 168 L136 222 L170 212Z"/>', [158, 208], 8),
      r('finR', 4, '<path d="M230 168 L264 222 L230 212Z"/>', [242, 208], 8),
      r('flame', 1, '<path d="M178 214 Q200 286 222 214Z"/>', [200, 236], 11),
    ],
    deco: '<g fill="#fff"><circle cx="40" cy="120" r="3"/><circle cx="120" cy="30" r="3"/><circle cx="300" cy="40" r="3"/><circle cx="360" cy="120" r="3"/><circle cx="260" cy="150" r="2"/></g>',
  },
];

export const getPicture = (id) => pictures.find((p) => p.id === id) || pictures[0];
/** Which pictures belong to each level step (2 per step). */
export const stepPictures = [['car', 'icecream'], ['flower', 'elephant'], ['butterfly', 'rocket']];

/** Full SVG of a picture. fills: { regionId: colour } (unfilled regions are white). */
export function pictureSvg(pic, fills = {}, { labels = null, size = null } = {}) {
  const body = pic.regions.map((rg) => {
    const fill = fills[rg.id] || '#FFFFFF';
    const lab = labels?.[rg.id];
    const text = lab ? `<text x="${rg.label[0]}" y="${rg.label[1]}" font-size="${rg.fs}" text-anchor="middle" class="cbc-label" pointer-events="none">${lab}</text>` : '';
    return `<g class="cbc-region" data-r="${rg.id}" fill="${fill}" stroke="#2B2140" stroke-width="3" stroke-linejoin="round">${rg.shape}</g>${text}`;
  }).join('');
  const sz = size ? `width="${size}" height="${Math.round((size * 3) / 4)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" ${sz} aria-hidden="true">${body}<g pointer-events="none">${pic.deco}</g></svg>`;
}

/** The finished picture (every region in its colour), for the sticker album. */
export const finishedSvg = (pic) => pictureSvg(pic, Object.fromEntries(pic.regions.map((rg) => [rg.id, pic.colors[rg.slot]])));
