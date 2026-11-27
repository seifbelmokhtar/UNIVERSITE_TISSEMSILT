/**
 * PAGE : ADM-07 — Supervision des demandes (lecture seule — P5)
 * ------------------------------------------------------------------
 * Liste toutes les demandes (filtres service_id + statut).
 * Lecture seule — pas de traitement (P5).
 * Clic ligne → modal détails + timeline historique.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatDateTime, statusToBadge } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';
import { toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.requests_supervision_title'), requireAuth: true, requireRole: ['admin'] });

let allDemandes = [];
let allServices = [];
let filters = { service_id: '', statut: '' };

const STATUTS = ['Soumise', 'En attente de traitement', 'En cours de vérification', 'En attente de complément', 'Acceptée', 'Refusée', 'Clôturée'];

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'requests-supervision',
    pageTitle: i18n.t('adm.requests_supervision_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [demRes, servRes] = await Promise.all([
      api.get('/admin/demandes'),
      api.get('/admin/services')
    ]);
    allDemandes = demRes?.data || [];
    allServices = servRes?.data || [];
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
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('div', { class: 'alert alert--info', style: 'margin-bottom: var(--sp-4)' },
    i18n.t('adm.requests_supervision_readonly_note')));

  const filterBar = h('div', { class: 'card', style: 'margin-bottom: var(--sp-4)' }, [
    h('div', { class: 'card__body', style: 'display: flex; flex-wrap: wrap; gap: var(--sp-3); align-items: end' }, [
      h('div', { class: 'form-group', style: 'flex: 1; min-width: 200px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-service' }, i18n.t('adm.requests_supervision_filter_service')),
        h('select', {
          class: 'form-control', id: 'filter-service',
          onchange: (e) => { filters.service_id = e.target.value; renderResults(); }
        }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...allServices.map((s) => h('option', { value: String(s.id) }, i18n.lang === 'ar' ? s.nom_ar : s.nom_fr))
        ])
      ]),
      h('div', { class: 'form-group', style: 'min-width: 200px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-statut' }, i18n.t('adm.requests_supervision_filter_status')),
        h('select', {
          class: 'form-control', id: 'filter-statut',
          onchange: (e) => { filters.statut = e.target.value; renderResults(); }
        }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...STATUTS.map((s) => h('option', { value: s }, i18n.t(`status.${s}`) !== `status.${s}` ? i18n.t(`status.${s}`) : s))
        ])
      ])
    ])
  ]);
  main.appendChild(filterBar);

  const section = h('section', { class: 'card' }, [
    h('div', { class: 'card__body', id: 'dem-body', style: 'padding: 0' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

function getFiltered() {
  return allDemandes.filter((d) => {
    if (filters.service_id && d.service_id !== Number(filters.service_id)) return false;
    if (filters.statut && d.statut !== filters.statut) return false;
    return true;
  }).sort((a, b) => new Date(b.soumise_le) - new Date(a.soumise_le));
}

function renderResults() {
  const body = document.querySelector('#dem-body');
  if (!body) return;
  body.innerHTML = '';
  const list = getFiltered();
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('common.no_results') }));
    return;
  }
  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('adm.requests_supervision_table_ref')),
        h('th', {}, i18n.t('adm.requests_supervision_table_student')),
        h('th', {}, i18n.t('adm.requests_supervision_table_service')),
        h('th', {}, i18n.t('adm.requests_supervision_table_status')),
        h('th', {}, i18n.t('adm.requests_supervision_table_submitted')),
        h('th', {}, i18n.t('adm.requests_supervision_table_updated')),
        h('th', {}, i18n.t('adm.requests_supervision_table_actions'))
      ])),
      h('tbody', {}, list.map((d) => h('tr', {}, [
        h('td', { class: 'table__ref' }, d.reference),
        h('td', {}, studentName(d)),
        h('td', {}, i18n.lang === 'ar' ? (d.service_nom_ar || d.service_nom_fr) : (d.service_nom_fr || d.service_nom_ar)),
        h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` },
          i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
        h('td', {}, formatDate(d.soumise_le)),
        h('td', {}, formatDate(d.maj_le)),
        h('td', {}, h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openDetailModal(d)
        }, i18n.t('adm.requests_supervision_view_detail')))
      ])))
    ])
  ]));
}

function studentName(d) {
  if (i18n.lang === 'ar') return `${d.etudiant_prenom_ar || ''} ${d.etudiant_nom_ar || ''}`.trim() || `#${d.etudiant_id}`;
  return `${d.etudiant_prenom || d.etudiant_prenom_ar || ''} ${d.etudiant_nom || d.etudiant_nom_ar || ''}`.trim() || `#${d.etudiant_id}`;
}

async function openDetailModal(d) {
  // Charger le détail complet (avec historique)
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 640px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, d.reference),
      closeBtn
    ]),
    h('div', { class: 'modal__body' }, [loadingState()]),
    h('div', { class: 'modal__footer' }, renderFooter(d))
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  try {
    const res = await api.get(`/admin/demandes/${encodeURIComponent(d.id)}`);
    const det = res?.data || d;
    const body = dialog.querySelector('.modal__body');
    body.innerHTML = '';
    body.append(...renderDetail(det));
  } catch (err) {
    const body = dialog.querySelector('.modal__body');
    body.innerHTML = '';
    body.appendChild(errorState({ message: err instanceof ApiError ? err.message : i18n.t('common.error') }));
  }
}

function renderFooter(d) {
  return [
    h('button', {
      class: 'btn btn--secondary', type: 'button',
      onclick: () => { window.location.href = `/pages/employee/request-processing.html?id=${encodeURIComponent(d.id)}`; }
    }, i18n.t('adm.requests_supervision_view_full')),
    h('button', { class: 'btn btn--ghost', type: 'button',
      onclick: () => { const o = document.querySelector('.modal'); if (o) o.remove(); }
    }, i18n.t('common.close'))
  ];
}

function renderDetail(d) {
  const isAr = i18n.lang === 'ar';
  const serviceName = isAr ? (d.service_nom_ar || d.service_nom_fr) : (d.service_nom_fr || d.service_nom_ar);
  return [
    h('div', { class: 'grid grid--2', style: 'margin-bottom: var(--sp-4)' }, [
      infoRow(i18n.t('adm.requests_supervision_table_ref'), d.reference),
      infoRow(i18n.t('adm.requests_supervision_table_student'), studentName(d)),
      infoRow(i18n.t('adm.requests_supervision_table_service'), serviceName || '—'),
      infoRow(i18n.t('adm.requests_supervision_table_status'),
        h('span', { class: `badge badge--${statusToBadge(d.statut)}` },
          i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
      infoRow(i18n.t('adm.requests_supervision_table_submitted'), formatDateTime(d.soumise_le)),
      infoRow(i18n.t('adm.requests_supervision_table_updated'), formatDateTime(d.maj_le))
    ]),
    h('div', { class: 'form-group' }, [
      h('label', { class: 'form-label' }, i18n.t('adm.requests_supervision_timeline')),
      h('ol', { class: 'timeline', style: 'list-style: none; padding: 0; margin: 0' },
        (d.historique || []).map((ev) => h('li', { class: 'timeline__item' }, [
          h('div', { class: 'timeline__label' }, [
            h('span', { class: `badge badge--${statusToBadge(ev.statut)}` },
              i18n.t(`status.${ev.statut}`) !== `status.${ev.statut}` ? i18n.t(`status.${ev.statut}`) : ev.statut),
            h('span', { style: 'margin-inline-start: var(--sp-2); font-size: var(--fs-xs); color: var(--c-ink-muted)' },
              formatDateTime(ev.date))
          ]),
          h('div', { class: 'timeline__meta' }, [
            h('span', {}, ev.acteur ? `#${ev.acteur}` : '—'),
            ev.action ? h('span', { style: 'margin-inline-start: var(--sp-2)' }, ev.action) : null
          ]),
          ev.note ? h('div', { class: 'timeline__note' }, ev.note) : null
        ])))
    ]),
    h('div', { class: 'alert alert--info' }, i18n.t('adm.requests_supervision_no_actions'))
  ];
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      typeof value === 'string' ? (value || '—') : value)
  ]);
}

const style = document.createElement('style');
style.textContent = `
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--info { background: var(--c-info-bg); color: var(--c-info); border-color: var(--c-info); }
`;
document.head.appendChild(style);

load();
