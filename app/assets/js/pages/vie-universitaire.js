/**
 * PAGE : PUB-06 — Vie universitaire
 * ------------------------------------------------------------------
 * Section clubs (cartes génériques marquées démo) + événements à venir
 * (GET /public/actualites?categorie=evenement).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.vie_universitaire_title') });

const CLUBS = [
  { icon: '🔬', titleKey: 'public.vie_club_science', descKey: 'public.vie_club_science_desc' },
  { icon: '🎭', titleKey: 'public.vie_club_culture', descKey: 'public.vie_club_culture_desc' },
  { icon: '⚽', titleKey: 'public.vie_club_sport', descKey: 'public.vie_club_sport_desc' },
  { icon: '🤝', titleKey: 'public.vie_club_solidarite', descKey: 'public.vie_club_solidarite_desc' }
];

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'news' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.vie_universitaire_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.vie_universitaire_intro'))
    ]),
    renderClubsSection(),
    renderEventsHeader(),
    loadingState()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/actualites', { categorie: 'evenement' });
    const items = (res?.data || []).filter((a) => a.date_evenement && new Date(a.date_evenement) >= new Date(Date.now() - 86400000));
    const loader = main.querySelector('.loading-state');
    if (loader) loader.remove();
    if (items.length === 0) {
      main.appendChild(emptyState({ message: i18n.t('public.vie_events_empty') }));
    } else {
      main.appendChild(h('div', { class: 'grid grid--2' }, items.map(renderEventCard)));
    }
    main.appendChild(renderDemoNote());
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderClubsSection() {
  return h('section', { class: 'vie-section', 'aria-labelledby': 'vie-clubs-title' }, [
    h('h2', { id: 'vie-clubs-title', class: 'vie-section__title' }, i18n.t('public.vie_clubs_title')),
    h('p', { class: 'vie-section__intro' }, i18n.t('public.vie_clubs_intro')),
    h('div', { class: 'grid grid--4' }, CLUBS.map(renderClubCard))
  ]);
}

function renderClubCard(club) {
  return h('article', { class: 'card card--pad card--hover vie-club' }, [
    h('div', { class: 'vie-club__icon', 'aria-hidden': 'true' }, club.icon),
    h('h3', { class: 'vie-club__title' }, i18n.t(club.titleKey)),
    h('p', { class: 'vie-club__desc' }, i18n.t(club.descKey))
  ]);
}

function renderEventsHeader() {
  return h('h2', { class: 'vie-section__title', style: 'margin-top: var(--sp-10)' },
    i18n.t('public.vie_events_title'));
}

function renderEventCard(item) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t('public.news_categories.evenement');
  return h('article', { class: 'card card--pad card--hover', tabindex: '0' }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2)' }, [
      h('span', { class: 'badge badge--neutral' }, cat),
      h('span', { class: 'u-text-muted', style: 'font-size: var(--fs-xs); margin-inline-start: auto' },
        i18n.t('public.events_on', { date: formatDate(item.date_evenement) }))
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
    h('div', { class: 'alert__body' }, i18n.t('public.vie_demo_note'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .vie-section { margin-bottom: var(--sp-8); }
  .vie-section__title { font-size: var(--fs-lg); margin-bottom: var(--sp-2); padding-block-end: var(--sp-2); border-block-end: 2px solid var(--c-line-strong); }
  .vie-section__intro { color: var(--c-ink-soft); font-size: var(--fs-sm); margin-bottom: var(--sp-5); }
  .vie-club { display: flex; flex-direction: column; gap: var(--sp-2); text-align: start; }
  .vie-club__icon { width: 48px; height: 48px; border-radius: var(--r-md); background: var(--c-surface-alt); display: grid; place-items: center; font-size: var(--fs-xl); }
  .vie-club__title { font-size: var(--fs-md); margin: 0; }
  .vie-club__desc { font-size: var(--fs-sm); color: var(--c-ink-soft); line-height: var(--lh-relaxed); margin: 0; }
`;
document.head.appendChild(style);
