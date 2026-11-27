/**
 * PAGE : ETU-02 — Catalogue des services (étudiant)
 * ------------------------------------------------------------------
 * Liste les services actifs en cartes cliquables vers ETU-03.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('etu.services_catalog_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'services',
    pageTitle: i18n.t('etu.services_catalog_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/services');
    const services = res?.data || [];
    renderServices(services);
  } catch (err) {
    setError(err);
  }
}

function setError(err) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(errorState({ message: err instanceof ApiError ? err.message : i18n.t('common.error') }));
}

function renderServices(services) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  if (!services.length) {
    main.appendChild(emptyState({ title: i18n.t('common.empty'), message: i18n.t('common.no_results') }));
    return;
  }

  const isAr = i18n.lang === 'ar';
  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.services_catalog_intro')));
  const grid = h('div', { class: 'grid grid--3' });
  for (const s of services) {
    const name = isAr ? (s.nom_ar || s.nom_fr) : (s.nom_fr || s.nom_ar);
    const desc = isAr ? (s.description_ar || s.description_fr) : (s.description_fr || s.description_ar);
    grid.appendChild(
      h('a', {
        class: 'card card--pad card--hover',
        href: `/pages/student/service-detail.html?id=${s.id}`,
        style: 'text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: var(--sp-3)'
      }, [
        h('div', { style: 'display: flex; align-items: center; gap: var(--sp-3); justify-content: space-between' }, [
          h('h3', { class: 'card__title', style: 'margin: 0' }, name),
          h('span', { class: 'badge badge--neutral', style: 'text-transform: uppercase; font-size: 10px' }, s.code || '—')
        ]),
        h('p', { style: 'color: var(--c-ink-soft); font-size: var(--fs-sm); margin: 0; flex: 1' },
          desc || i18n.t('etu.service_no_description')),
        h('span', { class: 'btn btn--ghost btn--sm', style: 'align-self: flex-start' }, i18n.t('etu.service_card_open'))
      ])
    );
  }
  main.appendChild(grid);
}

load();
