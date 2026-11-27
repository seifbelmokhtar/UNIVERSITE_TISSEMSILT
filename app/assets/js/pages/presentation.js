/**
 * PAGE : PUB-02 — Présentation de l'université (page définitionnelle)
 * ------------------------------------------------------------------
 * Affiche les informations institutionnelles (GET /public/institution)
 * + contenu statique (histoire, mission, valeurs) marqué "démo".
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('public.presentation_title') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'home' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.presentation_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.presentation_intro')),
      h('div', { class: 'page-header__actions' }, [
        h('a', { href: '/pages/public/home.html', class: 'btn btn--ghost btn--sm' },
          '← ' + i18n.t('nav.back'))
      ])
    ]),
    loadingState()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/institution');
    const inst = res?.data || {};
    main.querySelector('.loading-state').remove();

    main.appendChild(renderInstitutionCard(inst));
    main.appendChild(renderHistory());
    main.appendChild(renderMission());
    main.appendChild(renderValues());
    main.appendChild(renderDemoNote());
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderInstitutionCard(inst) {
  const isAr = i18n.lang === 'ar';
  const nom = isAr ? (inst.nom_ar || inst.nom) : (inst.nom || inst.nom_ar);
  const adresse = isAr ? (inst.adresse_ar || inst.adresse_fr) : (inst.adresse_fr || inst.adresse_ar);
  const rows = [
    { label: i18n.t('public.contact_address'), value: adresse },
    { label: i18n.t('public.contact_phone'), value: inst.telephone },
    { label: i18n.t('public.contact_email'), value: inst.email },
    { label: i18n.lang === 'ar' ? 'الموقع الإلكتروني' : 'Website', value: inst.site }
  ];
  return h('article', { class: 'card card--pad', style: 'margin-bottom: var(--sp-6)' }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-4)' }, [
      h('div', {
        class: 'pres-logo',
        'aria-hidden': 'true',
        html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
      }),
      h('h2', { style: 'font-size: var(--fs-lg); margin: 0; flex: 1' }, nom || i18n.t('app.institution'))
    ]),
    h('dl', { class: 'pres-deflist' }, rows.map((r) => h('div', { class: 'pres-deflist__row' }, [
      h('dt', { class: 'pres-deflist__term' }, r.label),
      h('dd', { class: 'pres-deflist__def' }, r.value || '—')
    ])))
  ]);
}

function renderHistory() {
  return h('section', { class: 'pres-section', 'aria-labelledby': 'pres-history-title' }, [
    h('h2', { id: 'pres-history-title', class: 'pres-section__title' }, i18n.t('public.presentation_history_title')),
    h('p', { class: 'pres-section__body' }, i18n.t('public.presentation_history_body'))
  ]);
}

function renderMission() {
  return h('section', { class: 'pres-section', 'aria-labelledby': 'pres-mission-title' }, [
    h('h2', { id: 'pres-mission-title', class: 'pres-section__title' }, i18n.t('public.presentation_mission_title')),
    h('p', { class: 'pres-section__body' }, i18n.t('public.presentation_mission_body'))
  ]);
}

function renderValues() {
  return h('section', { class: 'pres-section', 'aria-labelledby': 'pres-values-title' }, [
    h('h2', { id: 'pres-values-title', class: 'pres-section__title' }, i18n.t('public.presentation_values_title')),
    h('p', { class: 'pres-section__body' }, i18n.t('public.presentation_values_body'))
  ]);
}

function renderDemoNote() {
  return h('div', { class: 'alert alert--info', role: 'note', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'alert__body' }, i18n.t('public.presentation_demo_note'))
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .pres-logo {
    width: 56px; height: 56px;
    border-radius: var(--r-md);
    background: var(--c-surface-alt);
    color: var(--c-ink);
    display: grid; place-items: center;
    flex-shrink: 0;
  }
  .pres-deflist { margin: 0; display: grid; grid-template-columns: 1fr; gap: var(--sp-2); }
  .pres-deflist__row { display: grid; grid-template-columns: 160px 1fr; gap: var(--sp-3); padding: var(--sp-2) 0; border-bottom: 1px solid var(--c-line-soft); }
  .pres-deflist__row:last-child { border-bottom: 0; }
  .pres-deflist__term { font-size: var(--fs-sm); font-weight: var(--fw-medium); color: var(--c-ink-muted); margin: 0; }
  .pres-deflist__def { margin: 0; font-size: var(--fs-sm); color: var(--c-ink); word-break: break-word; }
  @media (max-width: 480px) {
    .pres-deflist__row { grid-template-columns: 1fr; gap: var(--sp-1); }
  }
  .pres-section { margin-bottom: var(--sp-8); }
  .pres-section__title { font-size: var(--fs-lg); margin-bottom: var(--sp-3); padding-block-end: var(--sp-2); border-block-end: 2px solid var(--c-line-strong); }
  .pres-section__body { font-size: var(--fs-base); line-height: var(--lh-relaxed); color: var(--c-ink-soft); max-width: 70ch; }
`;
document.head.appendChild(style);
