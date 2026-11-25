import { carsTheme } from './cars.js';
// Add a theme: create themes/<id>.js following the cars contract and list it here.
export const themes = [carsTheme];
// Shown greyed out on the picker so children see more is coming (no data needed yet).
export const upcomingThemes = [
  { id: 'icecream', icon: `<svg viewBox="0 0 120 90" aria-hidden="true"><rect width="120" height="90" rx="18" fill="#FFE3EE"/><path d="M60 82 L44 44 H76Z" fill="#E9B872" stroke="#B9874A" stroke-width="3" stroke-linejoin="round"/><circle cx="52" cy="36" r="13" fill="#FF9EC4"/><circle cx="68" cy="36" r="13" fill="#9EE6C9"/><circle cx="60" cy="24" r="13" fill="#FFF3B0"/></svg>` },
];
export const getTheme = (id) => themes.find((t) => t.id === id) || themes[0];
