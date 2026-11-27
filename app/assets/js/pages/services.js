/**
 * PAGE : PUB-11 — Informations sur les services universitaires
 * ------------------------------------------------------------------
 * R-13 (informations services), R-28..32 (les 5 services).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.services_title') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'services' });
  const footer = renderSiteFooter();
  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.services_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.services_intro'))
    ]),
    loadingState()
  ]);
  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/services');
    const list = (res?.data || []).filter((s) => s.actif);
    main.querySelector('.loading-state').remove();
    if (list.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
      return;
    }
    main.appendChild(h('div', { class: 'grid grid--3' }, list.map(renderServiceCard)));
  } catch (err) {
    main.querySelector('.loading-state').replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

const ICONS = {
  bourse: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  hebergement: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  transport: '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  restauration: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  sante: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'
};

function renderServiceCard(s) {
  const isAr = i18n.lang === 'ar';
  const nom = isAr ? s.nom_ar : (s.nom_fr || s.nom_ar);
  const desc = isAr ? s.description_ar : (s.description_fr || s.description_ar);
  const isAuth = api.isAuthenticated;
  const isStudent = api.currentUser?.role === 'etudiant';

  return h('article', { class: 'card card--pad card--hover' }, [
    h('div', { style: 'display: flex; gap: var(--sp-3); margin-bottom: var(--sp-3)' }, [
      h('div', {
        class: 'service-icon',
        'aria-hidden': 'true',
        html: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.code] || ''}</svg>`
      }),
      h('h2', { style: 'font-size: var(--fs-md); margin: 0; flex: 1' }, nom)
    ]),
    h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); margin-bottom: var(--sp-4); min-height: 3em' }, desc),
    isAuth && isStudent
      ? h('a', {
          href: `/pages/student/dashboard.html?service=${s.code}`,
          class: 'btn btn--secondary btn--block btn--sm'
        }, i18n.t('etu.new_requests'))
      : h('a', {
          href: '/pages/public/login.html',
          class: 'btn btn--secondary btn--block btn--sm'
        }, i18n.t('public.hero_cta_primary'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .service-icon { width: 40px; height: 40px; background: var(--c-surface-alt); border-radius: var(--r-md); display: grid; place-items: center; color: var(--c-ink); flex-shrink: 0; }
`;
document.head.appendChild(style);
