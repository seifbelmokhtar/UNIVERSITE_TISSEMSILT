/**
 * PAGE : PUB-08/09 — Liste & détail des actualités
 * ------------------------------------------------------------------
 * R-11 (actualités), R-15 (trilingue), règle 7 (fallback langue).
 * Si ?id= présent, on affiche le détail (PUB-09), sinon la liste (PUB-08).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('nav.news') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'news' });
  const footer = renderSiteFooter();
  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.news_list')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.last_news'))
    ]),
    loadingState()
  ]);
  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/actualites');
    const items = res?.data || [];

    const idParam = getUrlParam('id');
    if (idParam) {
      // Détail (PUB-09)
      const item = items.find((x) => String(x.id) === String(idParam));
      main.querySelector('.loading-state').remove();
      if (!item) {
        main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
        return;
      }
      main.appendChild(renderDetail(item));
    } else {
      // Liste (PUB-08)
      main.querySelector('.loading-state').remove();
      if (items.length === 0) {
        main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
        return;
      }
      // Filtre catégorie
      const filterBar = h('div', {
        style: 'display: flex; gap: var(--sp-2); margin-bottom: var(--sp-6); flex-wrap: wrap'
      }, [
        h('button', {
          class: 'btn btn--sm btn--primary', 'data-cat': 'all',
          onclick: () => filter('all')
        }, i18n.t('common.all')),
        h('button', { class: 'btn btn--sm btn--ghost', 'data-cat': 'actualite', onclick: () => filter('actualite') }, i18n.t('public.news_categories.actualite')),
        h('button', { class: 'btn btn--sm btn--ghost', 'data-cat': 'annonce', onclick: () => filter('annonce') }, i18n.t('public.news_categories.annonce')),
        h('button', { class: 'btn btn--sm btn--ghost', 'data-cat': 'evenement', onclick: () => filter('evenement') }, i18n.t('public.news_categories.evenement'))
      ]);
      const list = h('div', { class: 'stack', id: 'news-list' }, items.map(renderListItem));
      main.appendChild(filterBar);
      main.appendChild(list);
    }
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function filter(cat) {
  document.querySelectorAll('[data-cat]').forEach((b) => {
    b.classList.toggle('btn--primary', b.dataset.cat === cat);
    b.classList.toggle('btn--ghost', b.dataset.cat !== cat);
  });
  document.querySelectorAll('#news-list > article').forEach((el) => {
    el.style.display = (cat === 'all' || el.dataset.cat === cat) ? '' : 'none';
  });
}

function renderListItem(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t(`public.news_categories.${item.categorie}`);
  return h('article', {
    class: 'card card--pad card--hover',
    'data-cat': item.categorie,
    tabindex: '0'
  }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        item.date_evenement ? i18n.t('public.events_on', { date: formatDate(item.date_evenement) }) : i18n.t('public.published_on', { date: formatDate(item.publie_le) }))
    ]),
    h('h2', { style: 'font-size: var(--fs-md); margin-bottom: var(--sp-2)' }, title || i18n.t('common.empty')),
    h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); margin-bottom: var(--sp-3)' },
      (content || '').slice(0, 200) + ((content || '').length > 200 ? '…' : '')),
    h('a', {
      href: `/pages/public/news.html?id=${item.id}`,
      class: 'btn btn--ghost btn--sm'
    }, i18n.t('public.read_more'))
  ]);
}

function renderDetail(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t(`public.news_categories.${item.categorie}`);
  return h('article', { class: 'card card--pad' }, [
    h('nav', { class: 'breadcrumb', 'aria-label': 'breadcrumb' }, [
      h('a', { href: '/pages/public/news.html' }, i18n.t('public.last_news')),
      h('span', { class: 'breadcrumb__sep' }, '/'),
      h('span', {}, cat)
    ]),
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-4)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        i18n.t('public.published_on', { date: formatDate(item.publie_le) }))
    ]),
    h('h1', { style: 'font-size: var(--fs-xl); margin-bottom: var(--sp-4)' }, title || i18n.t('common.empty')),
    content
      ? h('div', { class: 'prose' }, content.split('\n').map((p) => h('p', {}, p)))
      : h('p', { class: 'alert alert--warning' }, i18n.lang === 'ar'
          ? 'محتوى هذا الخبر غير متاح باللغة المختارة حالياً'
          : 'Le contenu de cette actualité n\'est pas disponible dans la langue sélectionnée'),
    item.date_evenement ? h('div', { class: 'alert alert--info', role: 'note' }, [
      h('div', { class: 'alert__body' }, i18n.t('public.events_on', { date: formatDate(item.date_evenement) }))
    ]) : null,
    h('hr'),
    h('a', { href: '/pages/public/news.html', class: 'btn btn--ghost' }, '← ' + i18n.t('nav.back'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .prose p { margin-bottom: var(--sp-4); line-height: var(--lh-relaxed); }
`;
document.head.appendChild(style);
