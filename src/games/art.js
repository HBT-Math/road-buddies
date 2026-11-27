// Picture cards for the home hub. Original drawings, icon first so pre-readers can choose.
export const gameArt = {
  roadBuddies: `<svg viewBox="0 0 200 150" aria-hidden="true">
    <rect width="200" height="150" rx="22" fill="#BDE6FF"/><path d="M0 104 Q60 86 110 98 T200 92 V150 H0Z" fill="#86D16F"/>
    <path d="M70 150 L92 96 H108 L130 150Z" fill="#7C8492"/><path d="M100 104 V114 M100 124 V138" stroke="#fff" stroke-width="4"/>
    <rect x="22" y="20" width="96" height="40" rx="6" fill="#fff" stroke="#2B2140" stroke-width="4"/>
    <path d="M41 20 V60 M60 20 V60 M79 20 V60 M98 20 V60 M22 40 H118" stroke="#2B2140" stroke-width="3"/>
    <circle cx="31.5" cy="30" r="7" fill="#F25C54"/><circle cx="50.5" cy="30" r="7" fill="#F25C54"/><circle cx="69.5" cy="30" r="7" fill="#F25C54"/>
    <rect x="82" y="24" width="12" height="12" rx="3" fill="#3A86FF"/><rect x="101" y="24" width="12" height="12" rx="3" fill="#3A86FF"/>
    <rect x="128" y="96" width="56" height="26" rx="10" fill="#E63946" stroke="#A4222D" stroke-width="3"/>
    <circle cx="140" cy="124" r="8" fill="#2B2140"/><circle cx="172" cy="124" r="8" fill="#2B2140"/>
    <circle cx="156" cy="86" r="14" fill="#9C8FD0" stroke="#6A5BA8" stroke-width="3"/><circle cx="151" cy="84" r="2.5" fill="#2B2140"/><circle cx="161" cy="84" r="2.5" fill="#2B2140"/></svg>`,

  race: `<svg viewBox="0 0 200 150" aria-hidden="true">
    <rect width="200" height="150" rx="22" fill="#FFE8A3"/><rect y="88" width="200" height="62" fill="#7C8492"/>
    <path d="M0 119 H200" stroke="#fff" stroke-width="4" stroke-dasharray="16 12"/>
    ${[0, 1, 2, 3].map((i) => [0, 1].map((j) => `<rect x="${150 + j * 10}" y="${16 + i * 10}" width="10" height="10" fill="${(i + j) % 2 ? '#2B2140' : '#fff'}"/>`).join('')).join('')}
    <path d="M150 16 V100" stroke="#5B5070" stroke-width="4"/>
    <path d="M14 70 H40 M8 80 H34 M14 90 H38" stroke="#F3722C" stroke-width="4" stroke-linecap="round"/>
    <path d="M44 96 Q48 72 74 70 H104 Q122 70 128 86 L136 90 Q140 100 132 102 H48 Q42 102 44 96Z" fill="#8E5CD9" stroke="#5F3AA0" stroke-width="3"/>
    <path d="M78 74 H102 Q112 74 116 86 H74Z" fill="#DFF3FF" stroke="#5F3AA0" stroke-width="2"/>
    <circle cx="88" cy="80" r="4" fill="#fff"/><circle cx="102" cy="80" r="4" fill="#fff"/><circle cx="89" cy="81" r="2" fill="#2B2140"/><circle cx="103" cy="81" r="2" fill="#2B2140"/>
    <circle cx="66" cy="104" r="10" fill="#2B2140"/><circle cx="116" cy="104" r="10" fill="#2B2140"/>
    <path d="M60 124 Q66 108 86 108 H108 Q124 108 128 120 L132 124 Q132 132 126 132 H64 Q58 132 60 124Z" fill="#F9C74F" stroke="#C39320" stroke-width="3"/>
    <circle cx="78" cy="134" r="8" fill="#2B2140"/><circle cx="116" cy="134" r="8" fill="#2B2140"/>
    <path d="M112 122 Q118 126 124 122" stroke="#2B2140" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,

  maze: `<svg viewBox="0 0 200 150" aria-hidden="true">
    <rect width="200" height="150" rx="22" fill="#D7F5E3"/>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => {
      const path = ['0,0', '0,1', '1,1', '2,1', '2,2', '2,3', '3,3'].includes(`${r},${c}`);
      return `<rect x="${40 + c * 32}" y="${12 + r * 32}" width="28" height="28" rx="6" fill="${path ? '#FFD166' : '#fff'}" stroke="#2B2140" stroke-width="2.5"/>`;
    }).join('')).join('')}
    <text x="54" y="32" text-anchor="middle" font-size="15" font-weight="800" fill="#2B2140" font-family="Trebuchet MS,sans-serif">12</text>
    <path d="M150 112 V126" stroke="#2B2140" stroke-width="3"/><path d="M150 112 L162 116 L150 120Z" fill="#E63946"/>
    <circle cx="54" cy="58" r="9" fill="#3A86FF" stroke="#1F5BC0" stroke-width="2.5"/></svg>`,

  colorByCode: `<svg viewBox="0 0 200 150" aria-hidden="true">
    <rect width="200" height="150" rx="22" fill="#FFE3EE"/>
    <path d="M100 75 C70 30 30 36 34 66 C38 92 76 92 100 75Z" fill="#FF8FAB" stroke="#2B2140" stroke-width="3.5"/>
    <path d="M100 75 C130 30 170 36 166 66 C162 92 124 92 100 75Z" fill="#fff" stroke="#2B2140" stroke-width="3.5"/>
    <path d="M100 75 C80 100 52 122 66 128 C82 134 96 104 100 75Z" fill="#8EC5FF" stroke="#2B2140" stroke-width="3.5"/>
    <path d="M100 75 C120 100 148 122 134 128 C118 134 104 104 100 75Z" fill="#fff" stroke="#2B2140" stroke-width="3.5"/>
    <ellipse cx="100" cy="80" rx="6" ry="26" fill="#5B5070"/>
    <text x="138" y="66" text-anchor="middle" font-size="14" font-weight="800" fill="#2B2140" font-family="Trebuchet MS,sans-serif">3+3</text>
    <text x="122" y="118" text-anchor="middle" font-size="12" font-weight="800" fill="#2B2140" font-family="Trebuchet MS,sans-serif">9-4</text>
    <rect x="14" y="12" width="30" height="16" rx="8" fill="#FF8FAB"/><rect x="50" y="12" width="30" height="16" rx="8" fill="#8EC5FF"/>
    <text x="29" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="#2B2140" font-family="Trebuchet MS,sans-serif">6</text>
    <text x="65" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="#2B2140" font-family="Trebuchet MS,sans-serif">5</text></svg>`,
};
