/**
 * PAGE : ADM-03 — Rôles & permissions (lecture seule)
 * ------------------------------------------------------------------
 * Affiche la matrice rôles × actions retournée par GET /admin/roles-permissions.
 * Lecture seule — la matrice est figée en v1 (D-12).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';

bootstrapPage({ title: i18n.t('adm.roles_title'), requireAuth: true, requireRole: ['admin'] });

const ROLES = ['etudiant', 'enseignant', 'employe', 'admin'];

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'accounts',
    pageTitle: i18n.t('adm.roles_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/admin/roles-permissions');
    renderMatrix(res?.data || []);
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

function renderMatrix(rows) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('div', { class: 'alert alert--info', style: 'margin-bottom: var(--sp-4)' },
    i18n.t('adm.roles_readonly_note')));

  if (!rows.length) {
    main.appendChild(emptyState({ message: i18n.t('common.empty') }));
    return;
  }

  // Collecte des actions uniques (préservation de l'ordre d'apparition)
  const actions = [];
  const actionSet = new Set();
  for (const r of rows) {
    if (!actionSet.has(r.action)) { actionSet.add(r.action); actions.push(r.action); }
  }

  // Build matrix { action: { role: allowed } }
  const matrix = {};
  for (const r of rows) {
    if (!matrix[r.action]) matrix[r.action] = {};
    matrix[r.action][r.role] = r.allowed;
  }

  const table = h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('adm.roles_action')),
        ...ROLES.map((r) => h('th', { style: 'text-align: center' }, i18n.t(`adm.accounts_role_${r}`)))
      ])),
      h('tbody', {}, actions.map((action) => h('tr', {}, [
        h('td', { style: 'font-family: var(--font-mono); font-size: var(--fs-sm)' }, action),
        ...ROLES.map((r) => {
          const allowed = matrix[action]?.[r];
          return h('td', { style: 'text-align: center' },
            allowed == null ? '—'
              : allowed
                ? h('span', { class: 'badge badge--success', 'aria-label': i18n.t('adm.roles_allowed') }, '✓')
                : h('span', { class: 'badge badge--danger', 'aria-label': i18n.t('adm.roles_denied') }, '✗'));
        })
      ])))
    ])
  ]);

  main.appendChild(h('section', { class: 'card' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('adm.roles_matrix'))]),
    h('div', { class: 'card__body', style: 'padding: 0' }, table)
  ]));
}

const style = document.createElement('style');
style.textContent = `
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--info { background: var(--c-info-bg); color: var(--c-info); border-color: var(--c-info); }
`;
document.head.appendChild(style);

load();
