import en from './en.js';
import ar from './ar.js';

const tables = { en, ar };
export const languages = [
  { id: 'en', dir: 'ltr', label: 'English' },
  { id: 'ar', dir: 'rtl', label: 'العربية' },
];
let current = 'en';

export function setLanguage(id) {
  current = tables[id] ? id : 'en';
  const lang = languages.find((l) => l.id === current);
  document.documentElement.lang = current;
  document.documentElement.dir = lang.dir;
}
export const getLanguage = () => current;

/** t('speak.add', {a:3, b:4}) -> "3 plus 4 equals what?" */
export function t(key, vars = {}) {
  const raw = tables[current][key] || en[key] || key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
