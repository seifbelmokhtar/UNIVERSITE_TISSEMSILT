/**
 * DOM HELPERS — utilitaires de manipulation DOM
 */

/** Sélecteur court. */
export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/** Crée un élément avec attributs et enfants. */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'aria') {
      for (const [ak, av] of Object.entries(v)) el.setAttribute(`aria-${ak}`, av);
    } else el.setAttribute(k, v === true ? '' : v);
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/** Vide un élément. */
export function empty(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Échappe le HTML pour insertion sûre (textContent-style). */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Délégation d'événements. */
export function delegate(root, type, selector, handler) {
  root.addEventListener(type, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

/** Formate une date ISO selon locale + langue. */
export function formatDate(iso, opts = {}) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const lang = document.documentElement.getAttribute('lang') || 'ar';
    const locale = lang === 'ar' ? 'ar-DZ' : (lang === 'fr' ? 'fr-FR' : 'en-GB');
    return d.toLocaleDateString(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
      ...opts
    });
  } catch (_) { return iso; }
}

/** Formate une date ISO avec heure. */
export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const lang = document.documentElement.getAttribute('lang') || 'ar';
    const locale = lang === 'ar' ? 'ar-DZ' : (lang === 'fr' ? 'fr-FR' : 'en-GB');
    return d.toLocaleDateString(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (_) { return iso; }
}

/** Formate une taille de fichier. */
export function formatSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${Math.round(bytes * 10) / 10} ${units[i]}`;
}

/** Attend un délai. */
export function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Retourne une traduction via i18n (lazy import). */
let _t = null;
export async function t(key, vars = null) {
  if (!_t) {
    const { i18n } = await import('./i18n.js');
    _t = (k, v) => i18n.t(k, v);
  }
  return _t(key, vars);
}

/** Convertit un statut en clé de badge CSS. */
export function statusToBadge(statut) {
  const map = {
    'Soumise': 'soumise',
    'En attente de traitement': 'attente',
    'En cours de vérification': 'cours',
    'En attente de complément': 'complement',
    'Acceptée': 'acceptee',
    'Refusée': 'refusee',
    'Clôturée': 'cloturee',
    'Résolue': 'acceptee',
    'Rejetée': 'refusee'
  };
  return map[statut] || 'neutral';
}
