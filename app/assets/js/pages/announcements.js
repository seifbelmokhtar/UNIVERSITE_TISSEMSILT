/**
 * PAGE : PUB-10 — Annonces officielles
 * ------------------------------------------------------------------
 * R-12 (annonces officielles). Réutilise la structure de PUB-08 (news.js)
 * mais filtre sur categorie=annonce uniquement.
 * Si ?id= présent, on affiche le détail, sinon la liste.
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.announcements_title') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'announcements' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.announcements_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.announcements_intro'))
    ]),
    loadingState()
  ]);
  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/actualites', { categorie: 'annonce' });
    const items = res?.data || [];
    const loader = main.querySelector('.loading-state');
    if (loader) loader.remove();

    const idParam = getUrlParam('id');
    if (idParam) {
      const item = items.find((x) => String(x.id) === String(idParam));
      if (!item) {
        main.appendChild(emptyState({ message: i18n.t('common.no_results') }));
        return;
      }
      main.appendChild(renderDetail(item));
    } else {
      if (items.length === 0) {
        main.appendChild(emptyState({ message: i18n.t('public.announcements_empty') }));
        return;
      }
      main.appendChild(h('div', { class: 'stack' }, items.map(renderListItem)));
    }
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderListItem(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t('public.news_categories.annonce');
  return h('article', {
    class: 'card card--pad card--hover',
    tabindex: '0'
  }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        i18n.t('public.published_on', { date: formatDate(item.publie_le) }))
    ]),
    h('h2', { style: 'font-size: var(--fs-md); margin-bottom: var(--sp-2)' },
      title || i18n.t('common.empty')),
    h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); margin-bottom: var(--sp-3)' },
      (content || '').slice(0, 240) + ((content || '').length > 240 ? '…' : '')),
    h('a', {
      href: `/pages/public/announcements.html?id=${item.id}`,
      class: 'btn btn--ghost btn--sm'
    }, i18n.t('public.read_more'))
  ]);
}

function renderDetail(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t('public.news_categories.annonce');
  return h('article', { class: 'card card--pad' }, [
    h('nav', { class: 'breadcrumb', 'aria-label': 'breadcrumb' }, [
      h('a', { href: '/pages/public/announcements.html' }, i18n.t('public.announcements_title')),
      h('span', { class: 'breadcrumb__sep' }, '/'),
      h('span', {}, cat)
    ]),
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-4)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        i18n.t('public.published_on', { date: formatDate(item.publie_le) }))
    ]),
    h('h1', { style: 'font-size: var(--fs-xl); margin-bottom: var(--sp-4)' },
      title || i18n.t('common.empty')),
    content
      ? h('div', { class: 'prose' }, String(content).split('\n').map((p) => h('p', {}, p)))
      : h('div', { class: 'alert alert--warning', role: 'note' }, [
          h('div', { class: 'alert__body' },
            i18n.lang === 'ar'
              ? 'محتوى هذا الإعلان غير متاح باللغة المختارة حالياً'
              : 'Le contenu de cette annonce n\'est pas disponible dans la langue sélectionnée')
        ]),
    h('hr'),
    h('a', { href: '/pages/public/announcements.html', class: 'btn btn--ghost' },
      '← ' + i18n.t('nav.back'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .prose p { margin-bottom: var(--sp-4); line-height: var(--lh-relaxed); }
`;
document.head.appendChild(style);
