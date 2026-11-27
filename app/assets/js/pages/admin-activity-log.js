/**
 * PAGE : ADM-08 — Journal d'activité (lecture seule — NF-08 append-only)
 * ------------------------------------------------------------------
 * Liste le journal complet avec filtres (utilisateur_id + entite).
 * Table lecture seule : Date/heure, Acteur, Action, Entité, ID, Détails, IP.
 * Pagination "Charger plus" — 20 lignes par page.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';

bootstrapPage({ title: i18n.t('adm.activity_log_title'), requireAuth: true, requireRole: ['admin'] });

let allLogs = [];
let filters = { utilisateur_id: '', entite: '' };
let visibleCount = 20;
const PAGE_SIZE = 20;

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'activity-log',
    pageTitle: i18n.t('adm.activity_log_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/admin/journal');
    allLogs = (res?.data || []).slice().sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));
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
    i18n.t('adm.activity_log_append_note')));

  // Filtres
  const entites = [...new Set(allLogs.map((l) => l.entite).filter(Boolean))];
  const filterBar = h('div', { class: 'card', style: 'margin-bottom: var(--sp-4)' }, [
    h('div', { class: 'card__body', style: 'display: flex; flex-wrap: wrap; gap: var(--sp-3); align-items: end' }, [
      h('div', { class: 'form-group', style: 'flex: 1; min-width: 200px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-user' }, i18n.t('adm.activity_log_filter_user')),
        h('input', {
          class: 'form-control', type: 'search', id: 'filter-user',
          value: filters.utilisateur_id,
          placeholder: i18n.t('adm.activity_log_filter_user'),
          oninput: (e) => { filters.utilisateur_id = e.target.value; renderResults(); }
        })
      ]),
      h('div', { class: 'form-group', style: 'min-width: 200px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-entity' }, i18n.t('adm.activity_log_filter_entity')),
        h('select', {
          class: 'form-control', id: 'filter-entity',
          onchange: (e) => { filters.entite = e.target.value; renderResults(); }
        }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...entites.map((e) => h('option', { value: e }, e))
        ])
      ])
    ])
  ]);
  main.appendChild(filterBar);

  const section = h('section', { class: 'card' }, [
    h('div', { class: 'card__body', id: 'log-body', style: 'padding: 0' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

function getFiltered() {
  const uid = filters.utilisateur_id.trim();
  return allLogs.filter((l) => {
    if (uid && String(l.utilisateur_id) !== uid) return false;
    if (filters.entite && l.entite !== filters.entite) return false;
    return true;
  });
}

function renderResults() {
  const body = document.querySelector('#log-body');
  if (!body) return;
  body.innerHTML = '';
  const list = getFiltered();
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('common.no_results') }));
    return;
  }
  const slice = list.slice(0, visibleCount);
  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table table--compact' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('adm.activity_log_table_date')),
        h('th', {}, i18n.t('adm.activity_log_table_actor')),
        h('th', {}, i18n.t('adm.activity_log_table_action')),
        h('th', {}, i18n.t('adm.activity_log_table_entity')),
        h('th', {}, i18n.t('adm.activity_log_table_entity_id')),
        h('th', {}, i18n.t('adm.activity_log_table_details')),
        h('th', {}, i18n.t('adm.activity_log_table_ip'))
      ])),
      h('tbody', {}, slice.map((l) => h('tr', {}, [
        h('td', { class: 'table__ref' }, formatDateTime(l.cree_le)),
        h('td', {}, `#${l.utilisateur_id || '—'}`),
        h('td', {}, h('span', { class: 'badge badge--neutral' }, l.action || '—')),
        h('td', {}, l.entite || '—'),
        h('td', { class: 'table__ref' }, l.entite_id ? `#${l.entite_id}` : '—'),
        h('td', {}, l.details || '—'),
        h('td', { class: 'table__ref' }, l.ip || '—')
      ])))
    ])
  ]));

  if (list.length > visibleCount) {
    body.appendChild(h('div', { style: 'padding: var(--sp-4); display: flex; justify-content: center' }, [
      h('button', {
        class: 'btn btn--secondary', type: 'button',
        onclick: () => { visibleCount += PAGE_SIZE; renderResults(); }
      }, `${i18n.t('adm.activity_log_load_more')} (${list.length - visibleCount + PAGE_SIZE > list.length ? list.length - visibleCount : PAGE_SIZE})`)
    ]));
  } else if (list.length > PAGE_SIZE) {
    body.appendChild(h('p', { style: 'text-align: center; color: var(--c-ink-muted); font-size: var(--fs-sm); padding: var(--sp-3)' },
      i18n.t('adm.activity_log_no_more')));
  }
}

const style = document.createElement('style');
style.textContent = `
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--info { background: var(--c-info-bg); color: var(--c-info); border-color: var(--c-info); }
`;
document.head.appendChild(style);

load();
