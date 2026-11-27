/**
 * PAGE : PUB-13 — Liens externes officiels
 * ------------------------------------------------------------------
 * R-14 (liens officiels), A-08 (gérés par administration).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.external_links_title') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'links' });
  const footer = renderSiteFooter();
  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.external_links_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.external_links_intro'))
    ]),
    loadingState()
  ]);
  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/liens');
    const list = res?.data || [];
    main.querySelector('.loading-state').remove();
    if (list.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
      return;
    }
    main.appendChild(h('div', { class: 'grid grid--2' }, list.map(renderLink)));
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderLink(l) {
  const label = i18n.lang === 'ar' ? l.libelle_ar : l.libelle_fr;
  // Vérifier URL valide (EC: lien cassé géré)
  let url;
  try { url = new URL(l.url); } catch (_) {
    return h('article', { class: 'card card--pad' }, [
      h('h2', { style: 'font-size: var(--fs-md); margin-bottom: var(--sp-2)' }, label),
      h('p', { class: 'alert alert--warning', style: 'margin: 0' },
        i18n.lang === 'ar' ? 'الرابط غير متاح حالياً' : 'Lien indisponible')
    ]);
  }
  return h('a', {
    href: l.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    class: 'card card--pad card--hover card--link'
  }, [
    h('div', { style: 'display: flex; gap: var(--sp-3); align-items: flex-start' }, [
      h('div', {
        class: 'ext-link-icon', 'aria-hidden': 'true',
        html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
      }),
      h('div', { style: 'flex: 1' }, [
        h('h2', { style: 'font-size: var(--fs-md); margin-bottom: var(--sp-2)' }, label),
        h('div', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); font-family: var(--font-mono); word-break: break-all' }, url.host)
      ])
    ])
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .ext-link-icon { width: 36px; height: 36px; background: var(--c-surface-alt); border-radius: var(--r-md); display: grid; place-items: center; color: var(--c-ink-soft); flex-shrink: 0; }
`;
document.head.appendChild(style);
