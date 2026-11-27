/**
 * ROUTER — routeur minimaliste pour pages multiples
 * ------------------------------------------------------------------
 * Architecture multi-pages : chaque écran = 1 fichier HTML distinct.
 * Le "router" est essentiellement un point d'entrée commun pour :
 * - Initialiser i18n + auth + balises HEAD
 * - Exposer un helper mountPage(componentFn) pour rendre un écran
 * - Gérer la redirection selon rôle
 */
import { i18n } from './i18n.js';
import { api } from '../api/client.js';
import { h, $ } from './dom.js';

let bootstrapped = false;

export function bootstrapPage({ title = null, lang = null, requireAuth = false, requireRole = null, redirectTo = null } = {}) {
  if (bootstrapped) return;
  bootstrapped = true;

  // 1. i18n
  const currentLang = i18n.init();
  if (lang) i18n.setLang(lang);

  // 2. Titre
  if (title) document.title = `${title} — ${i18n.t('app.name')}`;

  // 3. Skip link
  if (!$('.skip-link')) {
    const skip = h('a', { href: '#main-content', class: 'skip-link' }, i18n.t('nav.skip_to_content'));
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // 4. Auth guard
  if (requireAuth && !api.isAuthenticated) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/pages/public/login.html?next=${next}`);
    return;
  }
  if (requireRole && api.currentUser && !requireRole.includes(api.currentUser.role)) {
    const dashboards = {
      etudiant: '/pages/student/dashboard.html',
      enseignant: '/pages/teacher/dashboard.html',
      employe: '/pages/employee/dashboard.html',
      admin: '/pages/admin/dashboard.html'
    };
    window.location.replace(dashboards[api.currentUser.role] || redirectTo || '/pages/public/home.html');
    return;
  }

  // 5. Appliquer langue préférence utilisateur si authentifié
  if (api.currentUser?.langue_pref && api.currentUser.langue_pref !== currentLang) {
    i18n.setLang(api.currentUser.langue_pref);
  }

  // 6. Setup re-render sur changement de langue (only manual reload — handled in switch)
}

/** Monte un composant dans #app ou body. */
export function mountPage(node) {
  let mount = $('#app') || $('#main-content');
  if (!mount) {
    mount = h('div', { id: 'app' });
    document.body.appendChild(mount);
  }
  mount.innerHTML = '';
  if (Array.isArray(node)) {
    node.forEach((n) => n && mount.appendChild(n));
  } else if (node) {
    mount.appendChild(node);
  }
}

/** Lit un paramètre d'URL. */
export function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Construit un href absolu vers un écran. */
export function pageHref(path) {
  return path.startsWith('/') ? path : '/' + path;
}
