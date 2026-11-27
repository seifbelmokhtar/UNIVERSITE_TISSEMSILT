/**
 * PAGE : PUB-05 — Recherche scientifique
 * ------------------------------------------------------------------
 * Contenu statique : axes de recherche (cartes), laboratoires fictifs
 * (marqués démo) + actualités scientifiques (GET /public/actualites
 * filtré par catégorie=evenement).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.research_title') });

const AXES = [
  { icon: '🔬', titleKey: 'public.research_axis_1_title', bodyKey: 'public.research_axis_1_body' },
  { icon: '📚', titleKey: 'public.research_axis_2_title', bodyKey: 'public.research_axis_2_body' },
  { icon: '📈', titleKey: 'public.research_axis_3_title', bodyKey: 'public.research_axis_3_body' }
];

// Laboratoires fictifs marqués démo
const LABS = [
  { nom_ar: 'مختبر الطاقات المتجددة والبيئة', nom_fr: 'Laboratoire Énergies Renouvelables et Environnement', code: 'LERE', axe: 1 },
  { nom_ar: 'مختبر المواد والأنظمة الذكية', nom_fr: 'Laboratoire Matériaux et Systèmes Intelligents', code: 'LMSI', axe: 1 },
  { nom_ar: 'مختبر الدراسات القانونية والمجتمعية', nom_fr: 'Laboratoire d\'Études Juridiques et Sociétales', code: 'LEJS', axe: 2 },
  { nom_ar: 'مختبر الاقتصاد التطبيقي والتسيير', nom_fr: 'Laboratoire d\'Économie Appliquée et Gestion', code: 'LEAG', axe: 3 }
];

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'faculties' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.research_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.research_intro'))
    ]),
    renderAxesSection(),
    renderLabsSection(),
    renderNewsHeader(),
    loadingState()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  // Actualités scientifiques : on prend catégorie=evenement comme proxy
  try {
    const res = await api.get('/public/actualites', { categorie: 'evenement' });
    const items = res?.data || [];
    const loader = main.querySelector('.loading-state');
    if (loader) loader.remove();
    if (items.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
    } else {
      const grid = h('div', { class: 'grid grid--2' }, items.map(renderNewsCard));
      main.appendChild(grid);
    }
    main.appendChild(renderDemoNote());
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderAxesSection() {
  return h('section', { class: 'research-section', 'aria-labelledby': 'research-axes-title' }, [
    h('h2', { id: 'research-axes-title', class: 'research-section__title' }, i18n.t('public.research_axes_title')),
    h('p', { class: 'research-section__intro' }, i18n.t('public.research_axes_intro')),
    h('div', { class: 'grid grid--3' }, AXES.map(renderAxisCard))
  ]);
}

function renderAxisCard(axis) {
  return h('article', { class: 'card card--pad card--hover research-axis' }, [
    h('div', { class: 'research-axis__icon', 'aria-hidden': 'true' }, axis.icon),
    h('h3', { class: 'research-axis__title' }, i18n.t(axis.titleKey)),
    h('p', { class: 'research-axis__body' }, i18n.t(axis.bodyKey))
  ]);
}

function renderLabsSection() {
  const isAr = i18n.lang === 'ar';
  const labs = LABS.map((lab) => {
    const nom = isAr ? lab.nom_ar : (lab.nom_fr || lab.nom_ar);
    const axeLabel = i18n.t(`public.research_axis_${lab.axe}_title`);
    return h('article', { class: 'card card--pad research-lab' }, [
      h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2)' }, [
        h('span', { class: 'badge badge--neutral', title: 'Code' }, lab.code),
        h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs)' }, axeLabel)
      ]),
      h('h3', { style: 'font-size: var(--fs-base); margin: 0' }, nom)
    ]);
  });
  return h('section', { class: 'research-section', 'aria-labelledby': 'research-labs-title' }, [
    h('h2', { id: 'research-labs-title', class: 'research-section__title' }, i18n.t('public.research_labs_title')),
    h('p', { class: 'research-section__intro' }, i18n.t('public.research_labs_intro')),
    h('div', { class: 'grid grid--2' }, labs)
  ]);
}

function renderNewsHeader() {
  return h('h2', { class: 'research-section__title', style: 'margin-top: var(--sp-10)' },
    i18n.t('public.research_news_title'));
}

function renderNewsCard(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t('public.news_categories.evenement');
  return h('article', { class: 'card card--pad card--hover', tabindex: '0' }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        item.date_evenement
          ? i18n.t('public.events_on', { date: formatDate(item.date_evenement) })
          : i18n.t('public.published_on', { date: formatDate(item.publie_le) }))
    ]),
    h('h3', { style: 'font-size: var(--fs-md); margin-bottom: var(--sp-2)' },
      title || i18n.t('common.empty')),
    h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); margin-bottom: var(--sp-3)' },
      (content || '').slice(0, 200) + ((content || '').length > 200 ? '…' : '')),
    h('a', {
      href: `/pages/public/news.html?id=${item.id}`,
      class: 'btn btn--ghost btn--sm'
    }, i18n.t('public.read_more'))
  ]);
}

function renderDemoNote() {
  return h('div', { class: 'alert alert--info', role: 'note', style: 'margin-top: var(--sp-8)' }, [
    h('div', { class: 'alert__body' }, i18n.t('public.research_demo_note'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .research-section { margin-bottom: var(--sp-8); }
  .research-section__title { font-size: var(--fs-lg); margin-bottom: var(--sp-2); padding-block-end: var(--sp-2); border-block-end: 2px solid var(--c-line-strong); }
  .research-section__intro { color: var(--c-ink-soft); font-size: var(--fs-sm); margin-bottom: var(--sp-5); }
  .research-axis { display: flex; flex-direction: column; gap: var(--sp-3); }
  .research-axis__icon { width: 48px; height: 48px; border-radius: var(--r-md); background: var(--c-surface-alt); display: grid; place-items: center; font-size: var(--fs-xl); }
  .research-axis__title { font-size: var(--fs-md); margin: 0; }
  .research-axis__body { font-size: var(--fs-sm); color: var(--c-ink-soft); line-height: var(--lh-relaxed); margin: 0; }
  .research-lab h3 { color: var(--c-ink); }
`;
document.head.appendChild(style);
