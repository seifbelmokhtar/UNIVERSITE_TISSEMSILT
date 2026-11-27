/**
 * PAGE : ENS-01 — Liste des ressources (enseignant)
 * ------------------------------------------------------------------
 * Table: Titre, Type (badge), Module, Taille, Date, Actions
 * (Modifier → ENS-02, Supprimer avec modal confirmation).
 * Bouton "Publier une ressource" → ENS-02.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatSize } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('ens.resources_title'), requireAuth: true, requireRole: ['enseignant'] });

let allResources = [];
let allModules = [];

async function load() {
  const shell = renderAppShell({
    role: 'enseignant',
    activeKey: 'resources',
    pageTitle: i18n.t('ens.resources_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [resRes, modsRes] = await Promise.all([
      api.get('/enseignant/ressources'),
      api.get('/enseignant/modules')
    ]);
    allResources = resRes?.data || [];
    allModules = modsRes?.data || [];
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

  main.appendChild(h('div', { class: 'page-header__actions', style: 'margin-bottom: var(--sp-6)' }, [
    h('a', { href: '/pages/teacher/resource-form.html', class: 'btn btn--primary btn--sm' },
      i18n.t('ens.publish_resource'))
  ]));

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('ens.resources_intro')));

  const section = h('section', { class: 'card', id: 'resources-card' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, i18n.t('ens.resources_title'))
    ]),
    h('div', { class: 'card__body', id: 'resources-body' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

function renderResults() {
  const body = document.querySelector('#resources-body');
  if (!body) return;
  const isAr = i18n.lang === 'ar';

  // Tri par date décroissante
  const list = [...allResources].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));

  body.innerHTML = '';
  if (!list.length) {
    body.appendChild(emptyState({
      title: i18n.t('ens.resources_empty'),
      action: h('a', { href: '/pages/teacher/resource-form.html', class: 'btn btn--secondary btn--sm' },
        i18n.t('ens.publish_resource'))
    }));
    return;
  }

  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('ens.resource_table_title')),
        h('th', {}, i18n.t('ens.resource_table_type')),
        h('th', {}, i18n.t('ens.resource_table_module')),
        h('th', {}, i18n.t('ens.resource_table_size')),
        h('th', {}, i18n.t('ens.resource_table_date')),
        h('th', {}, i18n.t('ens.resource_table_actions'))
      ])),
      h('tbody', {}, list.map((r) => {
        const title = isAr ? (r.titre || r.titre_fr || '') : (r.titre_fr || r.titre || '');
        const moduleLabel = moduleLabelFor(r.module_id);
        const typeLabel = typeLabelFor(r.type);
        return h('tr', {}, [
          h('td', {}, h('a', {
            href: `/pages/teacher/resource-form.html?id=${r.id}`,
            class: 'u-text-end'
          }, title || '—')),
          h('td', {}, h('span', { class: 'badge badge--neutral', style: 'text-transform: uppercase; font-size: 10px' }, typeLabel)),
          h('td', {}, moduleLabel || '—'),
          h('td', {}, formatSize(r.taille_octets)),
          h('td', {}, formatDate(r.cree_le)),
          h('td', {}, [
            h('a', {
              href: `/pages/teacher/resource-form.html?id=${r.id}`,
              class: 'btn btn--ghost btn--sm'
            }, i18n.t('common.edit')),
            h('button', {
              class: 'btn btn--ghost btn--sm',
              type: 'button',
              style: 'margin-inline-start: var(--sp-1); color: var(--c-danger)',
              'aria-label': i18n.t('common.delete'),
              onclick: () => confirmDelete(r)
            }, i18n.t('common.delete'))
          ])
        ]);
      }))
    ])
  ]));
}

function moduleLabelFor(moduleId) {
  if (!moduleId) return i18n.t('ens.resource_module_unknown');
  const m = allModules.find((x) => String(x.id) === String(moduleId));
  if (!m) return i18n.t('ens.resource_module_unknown');
  return i18n.lang === 'ar' ? (m.nom_ar || m.nom_fr) : (m.nom_fr || m.nom_ar);
}

function typeLabelFor(type) {
  const map = {
    cours: 'ens.resource_type_cours',
    td: 'ens.resource_type_td',
    tp: 'ens.resource_type_tp',
    document: 'ens.resource_type_document'
  };
  return i18n.t(map[type] || 'ens.resource_type_document');
}

// --- Modal de confirmation de suppression ---
function confirmDelete(resource) {
  const isAr = i18n.lang === 'ar';
  const title = isAr ? (resource.titre || resource.titre_fr || '') : (resource.titre_fr || resource.titre || '');

  const overlay = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': 'false',
    'aria-labelledby': 'delete-modal-title'
  });

  const cancelBtn = h('button', { class: 'btn btn--secondary', type: 'button' }, i18n.t('common.cancel'));
  const confirmBtn = h('button', { class: 'btn btn--danger', type: 'button' }, i18n.t('common.delete'));

  const dialog = h('div', { class: 'modal__dialog' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title', id: 'delete-modal-title' }, i18n.t('common.confirm_action'))
    ]),
    h('div', { class: 'modal__body' }, [
      h('p', { style: 'margin: 0 0 var(--sp-3)' }, i18n.t('ens.resource_delete_confirm')),
      h('p', { style: 'margin: 0; color: var(--c-ink-soft); font-weight: var(--fw-medium)' }, title || '—')
    ]),
    h('div', { class: 'modal__footer' }, [cancelBtn, confirmBtn])
  ]);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    const original = confirmBtn.textContent;
    confirmBtn.textContent = i18n.t('common.saving');
    try {
      await api.delete(`/enseignant/ressources/${resource.id}`);
      toastSuccess(i18n.t('ens.resource_delete_success'));
      // MAJ locale (sans recharger la page) :
      allResources = allResources.filter((r) => r.id !== resource.id);
      close();
      renderResults();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.textContent = original;
    }
  });
}

load();
