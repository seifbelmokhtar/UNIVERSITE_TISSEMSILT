/**
 * PAGE : ETU-03 — Détail d'un service (étudiant)
 * ------------------------------------------------------------------
 * Lit ?id=X. Affiche description + demandes de l'étudiant pour ce service.
 * Bouton "Nouvelle demande" → ETU-04 avec ?service_id=X.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('etu.service_detail_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const serviceId = getUrlParam('id');
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'services',
    pageTitle: i18n.t('etu.service_detail_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  if (!serviceId) {
    setError(new Error(i18n.t('etu.new_request_invalid_service')));
    return;
  }
  try {
    const [servicesRes, demandesRes] = await Promise.all([
      api.get('/etudiant/services'),
      api.get('/etudiant/demandes', { service_id: serviceId })
    ]);
    const services = servicesRes?.data || [];
    const service = services.find((s) => String(s.id) === String(serviceId));
    const demandes = demandesRes?.data || [];
    renderServiceDetail(service, demandes);
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
  main.appendChild(errorState({ message: err instanceof ApiError ? err.message : (err.message || i18n.t('common.error')) }));
}

function renderServiceDetail(service, demandes) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  // MAJ titre page
  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl && service) {
    pageTitleEl.textContent = isAr ? (service.nom_ar || service.nom_fr) : (service.nom_fr || service.nom_ar);
  }

  // Breadcrumb
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  if (!service) {
    main.appendChild(emptyState({ title: i18n.t('etu.new_request_invalid_service'), message: '' }));
    return;
  }

  const name = isAr ? (service.nom_ar || service.nom_fr) : (service.nom_fr || service.nom_ar);
  const desc = isAr ? (service.description_ar || service.description_fr) : (service.description_fr || service.description_ar);

  // Carte description + bouton nouvelle demande
  main.appendChild(h('section', { class: 'card card--pad' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, name),
      h('a', {
        class: 'btn btn--primary btn--sm',
        href: `/pages/student/new-request.html?service_id=${service.id}`
      }, i18n.t('etu.service_new_request'))
    ]),
    h('div', { class: 'card__body' }, [
      h('p', { style: 'color: var(--c-ink-soft); margin: 0' }, desc || i18n.t('etu.service_no_description'))
    ])
  ]));

  // Section demandes
  const section = h('section', { class: 'card', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, i18n.t('etu.service_my_requests'))
    ]),
    h('div', { class: 'card__body' }, [])
  ]);
  const body = section.querySelector('.card__body');

  if (!demandes.length) {
    body.appendChild(emptyState({
      title: i18n.t('etu.service_no_requests'),
      message: i18n.t('etu.service_no_requests_hint'),
      action: h('a', {
        class: 'btn btn--secondary btn--sm',
        href: `/pages/student/new-request.html?service_id=${service.id}`
      }, i18n.t('etu.service_new_request'))
    }));
  } else {
    body.appendChild(renderDemandesTable(demandes, isAr));
  }
  main.appendChild(section);
}

function renderDemandesTable(demandes, isAr) {
  return h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.reference')),
        h('th', {}, i18n.t('common.status')),
        h('th', {}, i18n.t('common.date')),
        h('th', {}, i18n.t('common.actions'))
      ])),
      h('tbody', {}, demandes.map((d) => h('tr', {}, [
        h('td', { class: 'table__ref' }, d.reference),
        h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` },
          i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
        h('td', {}, formatDate(d.soumise_le)),
        h('td', {}, h('a', {
          class: 'btn btn--ghost btn--sm',
          href: `/pages/student/request-detail.html?id=${d.id}`
        }, i18n.t('common.view')))
      ])))
    ])
  ]);
}

load();
