/**
 * PAGE : ADM-04 — Hiérarchie académique (administrateur)
 * ------------------------------------------------------------------
 * Arbre : facultés → départements → spécialités → modules.
 * - Création faculté (POST /admin/facultes)
 * - Modification faculté (PATCH /admin/facultes/{id})
 * - Sous-niveaux (département / spécialité / module) : création/modification
 *   simulée localement (routes mockées absentes) → toast info.
 * - Suppression (R-51) : si dépendances liées (étudiants/demandes) → refus
 *   avec message "Entité liée — suppression impossible, désactiver plutôt".
 *   Ici on simule la vérification.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';
import { validateForm, setFieldError } from '../components/forms.js';
import { toastSuccess, toastError, toastInfo } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.structure_title'), requireAuth: true, requireRole: ['admin'] });

let tree = [];

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'structure',
    pageTitle: i18n.t('adm.structure_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/admin/facultes');
    tree = res?.data || [];
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

  // Bouton création racine
  const topActions = h('div', { class: 'page-header__actions', style: 'margin-bottom: var(--sp-4)' }, [
    h('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      onclick: () => openCreateModal('faculte', null)
    }, i18n.t('adm.structure_add'))
  ]);
  main.appendChild(topActions);

  if (!tree.length) {
    main.appendChild(emptyState({ message: i18n.t('common.empty') }));
    return;
  }

  const root = h('div', { class: 'structure-tree' });
  for (const f of tree) root.appendChild(renderFaculte(f));
  main.appendChild(root);
}

function renderFaculte(f) {
  const childCount = (f.departements || []).length;
  return h('div', { class: 'structure-node structure-node--faculte' }, [
    h('div', { class: 'structure-node__head' }, [
      h('div', { class: 'structure-node__title' }, [
        h('span', { class: 'badge badge--info' }, i18n.t('adm.structure_type_faculte')),
        h('span', { class: 'structure-node__name' }, i18n.lang === 'ar' ? f.nom_ar : (f.nom_fr || f.nom_ar)),
        h('span', { class: 'structure-node__count' }, i18n.t('adm.structure_children_count', { n: childCount }))
      ]),
      h('div', { class: 'structure-node__actions' }, [
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openCreateModal('departement', f)
        }, i18n.t('adm.structure_add')),
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openEditModal('faculte', f)
        }, i18n.t('adm.structure_edit')),
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => attemptDelete('faculte', f)
        }, i18n.t('adm.structure_delete'))
      ])
    ]),
    h('div', { class: 'structure-node__children' },
      (f.departements || []).map((d) => renderDepartement(f, d)))
  ]);
}

function renderDepartement(f, d) {
  const childCount = (d.specialites || []).length;
  return h('div', { class: 'structure-node structure-node--departement' }, [
    h('div', { class: 'structure-node__head' }, [
      h('div', { class: 'structure-node__title' }, [
        h('span', { class: 'badge badge--neutral' }, i18n.t('adm.structure_type_departement')),
        h('span', { class: 'structure-node__name' }, i18n.lang === 'ar' ? d.nom_ar : (d.nom_fr || d.nom_ar)),
        h('span', { class: 'structure-node__count' }, i18n.t('adm.structure_children_count', { n: childCount }))
      ]),
      h('div', { class: 'structure-node__actions' }, [
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openCreateModal('specialite', d)
        }, i18n.t('adm.structure_add')),
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openEditModal('departement', d, f)
        }, i18n.t('adm.structure_edit')),
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => attemptDelete('departement', d, f)
        }, i18n.t('adm.structure_delete'))
      ])
    ]),
    h('div', { class: 'structure-node__children' },
      (d.specialites || []).map((s) => renderSpecialite(d, s)))
  ]);
}

function renderSpecialite(d, s) {
  // Module = niveau simulé pour mock
  return h('div', { class: 'structure-node structure-node--specialite' }, [
    h('div', { class: 'structure-node__head' }, [
      h('div', { class: 'structure-node__title' }, [
        h('span', { class: 'badge badge--warning' }, i18n.t('adm.structure_type_specialite')),
        h('span', { class: 'structure-node__name' }, i18n.lang === 'ar' ? s.nom_ar : (s.nom_fr || s.nom_ar))
      ]),
      h('div', { class: 'structure-node__actions' }, [
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openEditModal('specialite', s, d)
        }, i18n.t('adm.structure_edit')),
        h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => attemptDelete('specialite', s, d)
        }, i18n.t('adm.structure_delete'))
      ])
    ])
  ]);
}

// --- Vérification dépendances (simulée) ---
function hasLinkedEntities(type, entity) {
  // Mock : si la faculté a des départements ou des étudiants y sont rattachés
  if (type === 'faculte') return (entity.departements || []).length > 0;
  if (type === 'departement') return (entity.specialites || []).length > 0;
  // spécialité : on suppose qu'aucun étudiant lié en mock → false
  return false;
}

async function attemptDelete(type, entity, parent) {
  if (hasLinkedEntities(type, entity)) {
    toastError(i18n.t('adm.structure_delete_linked'));
    return;
  }
  if (!confirm(i18n.t('adm.structure_delete_confirm'))) return;
  try {
    // Seules les suppressions de faculté sont mockées via PATCH actif=false (substitution logique)
    if (type === 'faculte') {
      // Le mock n'implémente pas DELETE — on utilise un PATCH simulé
      await api.patch(`/admin/facultes/${encodeURIComponent(entity.id)}`, { actif: false });
    }
    // Retrait local de l'arbre
    removeLocal(type, entity, parent);
    toastSuccess(i18n.t('adm.structure_deleted_toast'));
    renderView();
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

function removeLocal(type, entity, parent) {
  if (type === 'faculte') {
    tree = tree.filter((f) => f.id !== entity.id);
  } else if (type === 'departement' && parent) {
    parent.departements = (parent.departements || []).filter((d) => d.id !== entity.id);
  } else if (type === 'specialite' && parent) {
    parent.specialites = (parent.specialites || []).filter((s) => s.id !== entity.id);
  }
}

// --- Modale création ---
function openCreateModal(type, parent) {
  const isRoot = type === 'faculte';
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 520px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, `${i18n.t('adm.structure_add')} — ${typeLabel(type)}`),
      closeBtn
    ]),
    h('form', { id: 'struct-create-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        isRoot
          ? h('div', { class: 'form-group' }, [
              h('label', { class: 'form-label', for: 'struct-type' }, i18n.t('adm.structure_field_type')),
              h('select', { class: 'form-control', id: 'struct-type', name: 'type' }, [
                h('option', { value: 'faculte' }, i18n.t('adm.structure_type_faculte')),
                h('option', { value: 'institut' }, i18n.t('adm.structure_type_faculte'))
              ])
            ])
          : null,
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'struct-nom-ar' }, [i18n.t('adm.structure_field_nom_ar'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'struct-nom-ar', name: 'nom_ar', required: 'true' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'struct-nom-fr' }, [i18n.t('adm.structure_field_nom_fr'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'struct-nom-fr', name: 'nom_fr', required: 'true' })
        ]),
        isRoot
          ? h('div', { class: 'form-group' }, [
              h('label', { class: 'form-label', for: 'struct-nom-en' }, i18n.t('adm.structure_field_nom_en')),
              h('input', { class: 'form-control', type: 'text', id: 'struct-nom-en', name: 'nom_en' })
            ])
          : null
      ]),
      h('div', { class: 'modal__footer' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'submit' }, i18n.t('common.save'))
      ])
    ])
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  dialog.querySelector('#struct-create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form, { nom_ar: { required: true }, nom_fr: { required: true } })) return;
    const fd = new FormData(form);
    const body = {
      nom_ar: fd.get('nom_ar').trim(),
      nom_fr: fd.get('nom_fr').trim(),
      ...(isRoot ? { nom_en: fd.get('nom_en').trim() || fd.get('nom_fr').trim(), type: fd.get('type') || 'faculte' } : {})
    };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      if (type === 'faculte') {
        const res = await api.post('/admin/facultes', body);
        if (res?.data) tree.push(res.data);
        toastSuccess(i18n.t('adm.structure_created_toast'));
      } else {
        // Sous-niveau : pas de route mockée → simulation locale
        toastInfo(i18n.t('adm.structure_simulated'));
        appendLocalChild(type, parent, body);
        toastSuccess(i18n.t('adm.structure_created_toast'));
      }
      close();
      renderView();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function appendLocalChild(type, parent, body) {
  const newId = Math.floor(Math.random() * 10000) + 1000;
  const child = { id: newId, ...body, departements: [], specialites: [] };
  if (type === 'departement' && parent) {
    parent.departements = parent.departements || [];
    parent.departements.push(child);
  } else if (type === 'specialite' && parent) {
    parent.specialites = parent.specialites || [];
    parent.specialites.push(child);
  }
}

// --- Modale édition ---
function openEditModal(type, entity, parent) {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 480px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, `${i18n.t('adm.structure_edit')} — ${typeLabel(type)}`),
      closeBtn
    ]),
    h('form', { id: 'struct-edit-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'edit-nom-ar' }, [i18n.t('adm.structure_field_nom_ar'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'edit-nom-ar', name: 'nom_ar', value: entity.nom_ar || '', required: 'true' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'edit-nom-fr' }, [i18n.t('adm.structure_field_nom_fr'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'edit-nom-fr', name: 'nom_fr', value: entity.nom_fr || '', required: 'true' })
        ])
      ]),
      h('div', { class: 'modal__footer' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'submit' }, i18n.t('common.save'))
      ])
    ])
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  dialog.querySelector('#struct-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form, { nom_ar: { required: true }, nom_fr: { required: true } })) return;
    const fd = new FormData(form);
    const body = { nom_ar: fd.get('nom_ar').trim(), nom_fr: fd.get('nom_fr').trim() };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      if (type === 'faculte') {
        const res = await api.patch(`/admin/facultes/${encodeURIComponent(entity.id)}`, body);
        if (res?.data) Object.assign(entity, res.data);
        toastSuccess(i18n.t('adm.structure_updated_toast'));
      } else {
        toastInfo(i18n.t('adm.structure_simulated'));
        Object.assign(entity, body);
        toastSuccess(i18n.t('adm.structure_updated_toast'));
      }
      close();
      renderView();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function typeLabel(type) {
  if (type === 'faculte') return i18n.t('adm.structure_type_faculte');
  if (type === 'departement') return i18n.t('adm.structure_type_departement');
  if (type === 'specialite') return i18n.t('adm.structure_type_specialite');
  if (type === 'module') return i18n.t('adm.structure_type_module');
  return type;
}

const style = document.createElement('style');
style.textContent = `
  .structure-tree { display: flex; flex-direction: column; gap: var(--sp-4); }
  .structure-node { border: 1px solid var(--c-line-soft); border-radius: var(--r-md); background: var(--c-surface); }
  .structure-node--faculte { background: var(--c-surface-alt); }
  .structure-node__head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-3) var(--sp-4); align-items: center; }
  .structure-node__title { display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
  .structure-node__name { font-weight: var(--fw-semibold); }
  .structure-node__count { font-size: var(--fs-xs); color: var(--c-ink-muted); }
  .structure-node__actions { display: flex; gap: var(--sp-1); flex-wrap: wrap; }
  .structure-node__children { padding-inline-start: var(--sp-4); padding-block-end: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3); padding-inline-end: var(--sp-3); }
  .structure-node__children .structure-node { background: var(--c-surface); }
  .structure-node__children .structure-node--departement { border-inline-start: 3px solid var(--c-info); }
  .structure-node__children .structure-node--specialite { border-inline-start: 3px solid var(--c-warning); }
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--info { background: var(--c-info-bg); color: var(--c-info); border-color: var(--c-info); }
`;
document.head.appendChild(style);

load();
