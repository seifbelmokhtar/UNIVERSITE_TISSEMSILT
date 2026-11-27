/**
 * PAGE : EMP-02 — Journal de mes actions (employé)
 * ------------------------------------------------------------------
 * Table lecture seule: Date, Action, Entité, Détails, IP. Pas d'action.
 * Filtre par type d'action (select).
 * (R-55 : historique append-only, lecture seule)
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('emp.my_actions_title'), requireAuth: true, requireRole: ['employe'] });

let allActions = [];

async function load() {
  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'my-actions',
    pageTitle: i18n.t('emp.my_actions_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/employe/journal');
    allActions = res?.data || [];
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

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('emp.my_actions_intro')));

  // Filtre
  const actionTypes = Array.from(new Set(allActions.map((a) => a.action))).sort();
  const filters = h('section', { class: 'card card--pad', style: 'margin-bottom: var(--sp-6)' }, [
    h('form', { id: 'filters-form', class: 'grid', style: 'grid-template-columns: 1fr auto; align-items: end; gap: var(--sp-4)' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-action' }, i18n.t('emp.my_actions_filter')),
        h('select', { class: 'form-control', id: 'filter-action', name: 'action', onchange: renderResults }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...actionTypes.map((a) => h('option', { value: a }, actionLabel(a)))
        ])
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('button', { class: 'btn btn--secondary', type: 'submit' }, i18n.t('common.filter'))
      ])
    ])
  ]);
  main.appendChild(filters);
  filters.addEventListener('submit', (e) => { e.preventDefault(); renderResults(); });

  const results = h('section', { class: 'card', id: 'results' }, [
    h('div', { class: 'card__body' }, [])
  ]);
  main.appendChild(results);
  renderResults();
}

function renderResults() {
  const body = document.querySelector('#results .card__body');
  if (!body) return;
  const actionFilter = document.querySelector('#filter-action')?.value || '';

  let list = allActions;
  if (actionFilter) list = list.filter((a) => a.action === actionFilter);
  list = [...list].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));

  body.innerHTML = '';
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('emp.my_actions_empty') }));
    return;
  }

  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('emp.my_actions_table_date')),
        h('th', {}, i18n.t('emp.my_actions_table_action')),
        h('th', {}, i18n.t('emp.my_actions_table_entity')),
        h('th', {}, i18n.t('emp.my_actions_table_details')),
        h('th', {}, i18n.t('emp.my_actions_table_ip'))
      ])),
      h('tbody', {}, list.map((a) => h('tr', {}, [
        h('td', {}, formatDateTime(a.cree_le)),
        h('td', {}, h('span', { class: 'badge badge--neutral', style: 'text-transform: uppercase; font-size: 10px' },
          actionLabel(a.action))),
        h('td', {}, `${a.entite || '—'}${a.entite_id ? ' #' + a.entite_id : ''}`),
        h('td', {}, a.details || '—'),
        h('td', {}, h('code', { style: 'font-family: monospace; font-size: var(--fs-xs)' }, a.ip || '—'))
      ])))
    ])
  ]));
}

function actionLabel(action) {
  const map = {
    creation_compte: i18n.t('emp.action_open'),
    refus: i18n.t('emp.action_refuse'),
    complement: i18n.t('emp.action_complement'),
    acceptation: i18n.t('emp.action_accept'),
    ouverture: i18n.t('emp.action_open'),
    observation: i18n.t('emp.action_observe'),
    cloture: i18n.t('emp.action_close'),
    transfert: i18n.t('emp.action_transfer'),
    import_etudiants: i18n.t('common.created')
  };
  return map[action] || action || '—';
}

load();
