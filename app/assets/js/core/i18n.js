/**
 * i18n — Internationalisation ar/fr/en avec gestion RTL/LTR
 * ------------------------------------------------------------------
 * Charge les traductions, applique dir/lang sur <html>,
 * expose une fonction t(key, vars) et un observateur de changement.
 * Politique par défaut : ar (RTL), fr/en (LTR) — aligné sur R-16.
 */

import { translations } from '../../i18n/index.js?v=20261127';

const SUPPORTED = ['ar', 'fr', 'en'];
const DEFAULT_LANG = 'ar';
const RTL_LANGS = ['ar'];

let currentLang = DEFAULT_LANG;
const listeners = new Set();

function detectInitialLang() {
  // 1. Préférence utilisateur (sessionStorage — non sensible)
  try {
    const stored = sessionStorage.getItem('ut_lang_pref');
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch (_) {}
  // 2. navigateur
  const nav = (navigator.language || 'ar').slice(0, 2).toLowerCase();
  if (SUPPORTED.includes(nav)) return nav;
  // 3. défaut document
  return DEFAULT_LANG;
}

function applyDirection(lang) {
  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
  // Police adaptée
  document.documentElement.style.setProperty('--font-default', dir === 'rtl' ? 'var(--font-ar)' : 'var(--font-latin)');
}

export const i18n = {
  init() {
    currentLang = detectInitialLang();
    applyDirection(currentLang);
    return currentLang;
  },

  get lang() { return currentLang; },
  get dir() { return RTL_LANGS.includes(currentLang) ? 'rtl' : 'ltr'; },
  get supported() { return [...SUPPORTED]; },

  setLang(lang) {
    if (!SUPPORTED.includes(lang)) return false;
    if (lang === currentLang) return true;
    currentLang = lang;
    try { sessionStorage.setItem('ut_lang_pref', lang); } catch (_) {}
    applyDirection(lang);
    listeners.forEach((fn) => { try { fn(lang); } catch (_) {} });
    return true;
  },

  /** Traduction par clé plate avec variables {var}. */
  t(key, vars = null) {
    const dict = translations[currentLang] || translations[DEFAULT_LANG];
    let value = key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), dict);
    if (value == null) {
      // fallback défaut
      const def = translations[DEFAULT_LANG];
      value = key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), def);
    }
    if (value == null) return key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  },

  /** Traduction d'une entité multilingue {ar, fr, en} selon langue courante + règle 7 (fallback). */
  localized(entity, field = 'titre') {
    if (!entity) return '';
    // accepte soit {titre_ar, titre_fr, titre_en}, soit {titre: {ar,fr,en}}
    const fromFlat = entity[`${field}_${currentLang}`];
    const fromFlatAr = entity[`${field}_ar`];
    if (fromFlat != null && fromFlat !== '') return fromFlat;
    if (entity[field] && typeof entity[field] === 'object') {
      const v = entity[field][currentLang];
      if (v) return v;
      // fallback meilleure langue disponible (règle 7)
      return entity[field].ar || entity[field].fr || entity[field].en || '';
    }
    // fallback flat : ar > fr > en
    return fromFlatAr || entity[`${field}_fr`] || entity[`${field}_en`] || '';
  },

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
