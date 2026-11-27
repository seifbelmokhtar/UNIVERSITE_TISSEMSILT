/**
 * PAGE : PUB-03 — Formation (page définitionnelle type)
 * ------------------------------------------------------------------
 * Liste les spécialités par faculté/département, organisées par niveau.
 * Filtre par niveau (4 boutons : tous / licence / master / doctorat).
 * Réutilise GET /public/facultes.
 * Lien symbolique vers PUB-04 (facultes.html?specialite=ID).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.formation_title') });

const LEVELS = [
  { key: 'all', label: 'public.formation_filter_all' },
  { key: 'licence', label: 'public.formation_level_licence' },
  { key: 'master', label: 'public.formation_level_master' },
  { key: 'doctorat', label: 'public.formation_level_doctorat' }
];

let currentFilter = 'all';
let cachedFacultes = [];

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'faculties' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.formation_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.formation_intro'))
    ]),
    loadingState()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/facultes');
    cachedFacultes = res?.data || [];
    main.querySelector('.loading-state').remove();
    if (cachedFacultes.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
      return;
    }
    // Barre de filtre niveau
    const filterBar = h('div', {
      class: 'formation-filters',
      role: 'group',
      'aria-label': i18n.t('common.filter')
    }, LEVELS.map((lv) => h('button', {
      type: 'button',
      class: 'btn btn--sm ' + (lv.key === 'all' ? 'btn--primary' : 'btn--ghost'),
      'data-level': lv.key,
      'aria-pressed': String(lv.key === 'all'),
      onclick: () => setFilter(lv.key)
    }, i18n.t(lv.label))));
    main.appendChild(filterBar);

    const list = h('div', { id: 'formation-list', class: 'stack' });
    main.appendChild(list);
    renderList();
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function setFilter(level) {
  currentFilter = level;
  document.querySelectorAll('.formation-filters [data-level]').forEach((btn) => {
    const active = btn.dataset.level === level;
    btn.classList.toggle('btn--primary', active);
    btn.classList.toggle('btn--ghost', !active);
    btn.setAttribute('aria-pressed', String(active));
  });
  renderList();
}

function renderList() {
  const container = document.getElementById('formation-list');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);

  const isAr = i18n.lang === 'ar';
  let totalSpecialites = 0;

  cachedFacultes.forEach((f) => {
    const faculteSpecs = [];
    (f.departements || []).forEach((d) => {
      (d.specialites || []).forEach((s) => {
        if (currentFilter === 'all' || s.niveau === currentFilter) {
          faculteSpecs.push({ faculte: f, departement: d, specialite: s });
        }
      });
    });
    if (faculteSpecs.length === 0) return;
    totalSpecialites += faculteSpecs.length;

    const fnom = isAr ? f.nom_ar : (f.nom_fr || f.nom_ar);
    const typeLabel = f.type === 'institut'
      ? (isAr ? 'معهد' : 'Institut')
      : (isAr ? 'كلية' : 'Faculté');

    const specCards = faculteSpecs.map((ctx) => {
      const snom = isAr ? ctx.specialite.nom_ar : (ctx.specialite.nom_fr || ctx.specialite.nom_ar);
      const dnom = isAr ? ctx.departement.nom_ar : (ctx.departement.nom_fr || ctx.departement.nom_ar);
      const niveauLabel = levelLabel(ctx.specialite.niveau);
      return h('article', { class: 'card card--pad card--hover formation-specialite', 'data-niveau': ctx.specialite.niveau }, [
        h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2); flex-wrap: wrap' }, [
          h('span', { class: 'badge badge--neutral' }, niveauLabel),
          h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs)' }, dnom)
        ]),
        h('h3', { style: 'font-size: var(--fs-md); margin: 0 0 var(--sp-3)' }, snom || i18n.t('common.empty')),
        h('a', {
          href: `/pages/public/facultes.html?specialite=${ctx.specialite.id}`,
          class: 'btn btn--ghost btn--sm'
        }, i18n.t('public.formation_view_specialty') + ' →')
      ]);
    });

    const card = h('article', { class: 'card formation-faculty' }, [
      h('div', { class: 'card__header' }, [
        h('span', { class: 'badge badge--neutral' }, typeLabel),
        h('h2', { class: 'card__title' }, fnom)
      ]),
      h('div', { class: 'card__body' }, [
        h('div', { class: 'grid grid--3' }, specCards)
      ])
    ]);
    container.appendChild(card);
  });

  if (totalSpecialites === 0) {
    container.appendChild(emptyState({ message: i18n.t('public.formation_empty_specialites') }));
  }
}

function levelLabel(niveau) {
  switch (niveau) {
    case 'licence': return i18n.t('public.formation_level_licence');
    case 'master': return i18n.t('public.formation_level_master');
    case 'doctorat': return i18n.t('public.formation_level_doctorat');
    default: return i18n.t('public.formation_level_autre');
  }
}

load();

const style = document.createElement('style');
style.textContent = `
  .formation-filters { display: flex; gap: var(--sp-2); margin-bottom: var(--sp-6); flex-wrap: wrap; }
  .formation-faculty .card__title { font-size: var(--fs-md); margin: 0; flex: 1; }
  .formation-specialite { display: flex; flex-direction: column; }
  .formation-specialite a { margin-top: auto; align-self: flex-start; }
`;
document.head.appendChild(style);
