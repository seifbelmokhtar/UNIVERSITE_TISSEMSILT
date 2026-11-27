/**
 * PAGE : PUB-04 — Facultés et instituts (page définitionnelle type)
 * ------------------------------------------------------------------
 * R-10 (pages définitionnelles). Réutilise le même template que PUB-02..07.
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.faculties_title') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'faculties' });
  const footer = renderSiteFooter();
  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.faculties_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.faculties_intro'))
    ]),
    loadingState()
  ]);
  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/facultes');
    const list = res?.data || [];
    main.querySelector('.loading-state').remove();
    if (list.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
      return;
    }
    const grid = h('div', { class: 'grid grid--2' }, list.map(renderFaculteCard));
    main.appendChild(grid);
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderFaculteCard(f) {
  const isAr = i18n.lang === 'ar';
  const nom = isAr ? f.nom_ar : (f.nom_fr || f.nom_ar);
  const type = f.type === 'institut'
    ? (isAr ? 'معهد' : 'Institut')
    : (isAr ? 'كلية' : 'Faculté');

  const children = (f.departements || []).map((d) => {
    const dnom = isAr ? d.nom_ar : d.nom_fr;
    const specs = (d.specialites || []).map((s) => {
      const snom = isAr ? s.nom_ar : s.nom_fr;
      return h('li', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); padding-inline-start: var(--sp-3)' }, '• ' + snom);
    });
    return h('li', { style: 'margin-bottom: var(--sp-3)' }, [
      h('div', { style: 'font-size: var(--fs-sm); font-weight: var(--fw-medium); margin-bottom: var(--sp-1)' }, dnom),
      h('ul', { style: 'list-style: none; padding: 0; margin: 0' }, specs)
    ]);
  });

  return h('article', { class: 'card card--pad' }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-3)' }, [
      h('span', { class: 'badge badge--neutral' }, type),
      h('h2', { style: 'font-size: var(--fs-md); margin: 0; flex: 1' }, nom)
    ]),
    children.length
      ? h('ul', { style: 'list-style: none; padding: 0; margin: 0' }, children)
      : h('p', { class: 'u-text-muted', style: 'font-size: var(--fs-sm)' }, i18n.t('common.empty'))
  ]);
}

load();
