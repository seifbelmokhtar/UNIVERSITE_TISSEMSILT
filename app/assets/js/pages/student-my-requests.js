/**
 * PAGE : ETU-05 — Mes demandes (étudiant)
 * ------------------------------------------------------------------
 * Liste filtrable par statut et par service. Table avec colonnes
 * Référence, Service, Statut, Date, Action (Voir).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

const STATUSES = [
  'Soumise',
  'En attente de traitement',
  'En cours de vérification',
  'En attente de complément',
  'Acceptée',
  'Refusée',
  'Clôturée'
];

let allDemandes = [];
let allServices = [];

bootstrapPage({ title: i18n.t('etu.my_requests'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'requests',
    pageTitle: i18n.t('etu.my_requests'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [demandesRes, servicesRes] = await Promise.all([
      api.get('/etudiant/demandes'),
      api.get('/etudiant/services')
    ]);
    allDemandes = demandesRes?.data || [];
    allServices = servicesRes?.data || [];
    renderView();
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

function renderView() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  // Barre de filtres
  const filters = h('section', { class: 'card card--pad', style: 'margin-bottom: var(--sp-6)' }, [
    h('form', { id: 'filters-form', class: 'grid', style: 'grid-template-columns: 1fr 1fr auto; align-items: end; gap: var(--sp-4)' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-status' }, i18n.t('etu.filter_status')),
        h('select', { class: 'form-control', id: 'filter-status', name: 'statut' }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...STATUSES.map((s) => h('option', { value: s },
            i18n.t(`status.${s}`) !== `status.${s}` ? i18n.t(`status.${s}`) : s))
        ])
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-service' }, i18n.t('etu.filter_service')),
        h('select', { class: 'form-control', id: 'filter-service', name: 'service_id' }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...allServices.map((s) => h('option', { value: String(s.id) },
            isAr ? (s.nom_ar || s.nom_fr) : (s.nom_fr || s.nom_ar)))
        ])
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('button', { class: 'btn btn--secondary', type: 'submit' }, i18n.t('common.filter'))
      ])
    ])
  ]);
  main.appendChild(filters);

  // Conteneur résultats
  const results = h('section', { class: 'card', id: 'results' }, [
    h('div', { class: 'card__body' }, [])
  ]);
  main.appendChild(results);

  filters.addEventListener('submit', (e) => {
    e.preventDefault();
    renderResults();
  });
  // Re-render aussi sur change immédiat
  filters.addEventListener('change', renderResults);

  renderResults();
}

function renderResults() {
  const resultsEl = document.querySelector('#results .card__body');
  if (!resultsEl) return;
  const isAr = i18n.lang === 'ar';
  const statusFilter = document.querySelector('#filter-status').value;
  const serviceFilter = document.querySelector('#filter-service').value;

  let list = allDemandes;
  if (statusFilter) list = list.filter((d) => d.statut === statusFilter);
  if (serviceFilter) list = list.filter((d) => String(d.service_id) === serviceFilter);

  // Trier par date desc
  list = [...list].sort((a, b) => new Date(b.soumise_le) - new Date(a.soumise_le));

  resultsEl.innerHTML = '';
  if (!list.length) {
    resultsEl.appendChild(emptyState({
      title: i18n.t('etu.no_requests'),
      message: i18n.t('etu.no_requests_hint'),
      action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/services.html' },
        i18n.t('etu.submit_first_request'))
    }));
    return;
  }

  resultsEl.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.reference')),
        h('th', {}, i18n.t('common.service')),
        h('th', {}, i18n.t('common.status')),
        h('th', {}, i18n.t('common.date')),
        h('th', {}, i18n.t('common.actions'))
      ])),
      h('tbody', {}, list.map((d) => {
        const serviceName = isAr
          ? (d.service_nom_ar || d.service_nom_fr || (d.document_type_ar || d.document_type_fr))
          : (d.service_nom_fr || d.service_nom_ar || (d.document_type_fr || d.document_type_ar));
        return h('tr', {}, [
          h('td', { class: 'table__ref' }, d.reference),
          h('td', {}, serviceName || '—'),
          h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` },
            i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
          h('td', {}, formatDate(d.soumise_le)),
          h('td', {}, h('a', {
            class: 'btn btn--ghost btn--sm',
            href: `/pages/student/request-detail.html?id=${d.id}`
          }, i18n.t('common.view')))
        ]);
      }))
    ])
  ]));
}

load();
