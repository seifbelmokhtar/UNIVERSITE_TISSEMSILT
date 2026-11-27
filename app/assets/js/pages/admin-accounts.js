/**
 * PAGE : ADM-01 — Gestion des comptes (administrateur)
 * ------------------------------------------------------------------
 * Liste des comptes (recherche + filtre rôle). CRUD léger :
 * - Créer un compte (modal identifiant/nom/prenom/role/service/email)
 * - Modifier (email + langue_pref)
 * - Activer/Désactiver
 * - Réinitialiser mot de passe → mot de passe temporaire (A-09, affiché 1 fois)
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';
import { validateForm, isValidEmail, setFieldError } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.accounts_title'), requireAuth: true, requireRole: ['admin'] });

const ROLES = ['etudiant', 'enseignant', 'employe', 'admin'];
let allUsers = [];
let allServices = [];
let filters = { q: '', role: '' };

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'accounts',
    pageTitle: i18n.t('adm.accounts_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [usersRes, servicesRes] = await Promise.all([
      api.get('/admin/utilisateurs'),
      api.get('/admin/services')
    ]);
    allUsers = usersRes?.data || [];
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
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  // Barre filtre
  const filterBar = h('div', { class: 'card', style: 'margin-bottom: var(--sp-6)' }, [
    h('div', { class: 'card__body', style: 'display: flex; flex-wrap: wrap; gap: var(--sp-3); align-items: end' }, [
      h('div', { class: 'form-group', style: 'flex: 1; min-width: 220px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-q' }, i18n.t('adm.accounts_search')),
        h('input', {
          class: 'form-control', type: 'search', id: 'filter-q', value: filters.q,
          placeholder: i18n.t('adm.accounts_search'),
          oninput: (e) => { filters.q = e.target.value; scheduleRender(); }
        })
      ]),
      h('div', { class: 'form-group', style: 'min-width: 180px; margin: 0' }, [
        h('label', { class: 'form-label', for: 'filter-role' }, i18n.t('adm.accounts_role_filter')),
        h('select', {
          class: 'form-control', id: 'filter-role',
          onchange: (e) => { filters.role = e.target.value; renderResults(); }
        }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...ROLES.map((r) => h('option', { value: r, ...(filters.role === r ? { selected: 'true' } : {}) }, i18n.t(`adm.accounts_role_${r}`)))
        ])
      ]),
      h('button', {
        class: 'btn btn--primary', type: 'button',
        onclick: () => openCreateModal()
      }, i18n.t('adm.accounts_create'))
    ])
  ]);
  main.appendChild(filterBar);

  // Table
  const section = h('section', { class: 'card' }, [
    h('div', { class: 'card__body', id: 'users-body', style: 'padding: 0' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

let renderTimer = null;
function scheduleRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(renderResults, 200);
}

function getFiltered() {
  const q = filters.q.toLowerCase().trim();
  return allUsers.filter((u) => {
    if (filters.role && u.role !== filters.role) return false;
    if (!q) return true;
    return (
      (u.identifiant || '').toLowerCase().includes(q) ||
      (u.nom || '').toLowerCase().includes(q) ||
      (u.nom_ar || '').toLowerCase().includes(q) ||
      (u.prenom || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });
}

function renderResults() {
  const body = document.querySelector('#users-body');
  if (!body) return;
  body.innerHTML = '';
  const list = getFiltered().sort((a, b) => a.id - b.id);
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('common.no_results') }));
    return;
  }
  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('adm.accounts_table_id')),
        h('th', {}, i18n.t('adm.accounts_table_name')),
        h('th', {}, i18n.t('adm.accounts_table_role')),
        h('th', {}, i18n.t('adm.accounts_table_status')),
        h('th', {}, i18n.t('adm.accounts_table_email')),
        h('th', {}, i18n.t('adm.accounts_table_actions'))
      ])),
      h('tbody', {}, list.map((u) => h('tr', {}, [
        h('td', { class: 'table__ref' }, u.identifiant || `#${u.id}`),
        h('td', {}, displayName(u)),
        h('td', {}, h('span', { class: `badge badge--neutral` }, i18n.t(`adm.accounts_role_${u.role}`) !== `adm.accounts_role_${u.role}` ? i18n.t(`adm.accounts_role_${u.role}`) : u.role)),
        h('td', {}, statusBadge(u.statut)),
        h('td', {}, u.email || '—'),
        h('td', {}, [
          h('button', {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => openEditModal(u)
          }, i18n.t('adm.accounts_edit')),
          h('button', {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => toggleStatus(u),
            ...(u.statut === 'actif' ? {} : { disabled: u.statut === 'non_active' ? 'true' : null })
          }, u.statut === 'actif' ? i18n.t('adm.accounts_disable') : i18n.t('adm.accounts_enable')),
          h('button', {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => resetPassword(u),
            ...(u.statut === 'desactive' ? { disabled: 'true' } : {})
          }, i18n.t('adm.accounts_reset_password'))
        ])
      ])))
    ])
  ]));
}

function displayName(u) {
  if (i18n.lang === 'ar') {
    return `${u.prenom_ar || u.prenom || ''} ${u.nom_ar || u.nom || ''}`.trim() || '—';
  }
  return `${u.prenom || u.prenom_ar || ''} ${u.nom || u.nom_ar || ''}`.trim() || '—';
}

function statusBadge(statut) {
  const map = { actif: 'success', desactive: 'danger', non_active: 'warning' };
  const label = i18n.t(`status.${statut}`) !== `status.${statut}`
    ? i18n.t(`status.${statut}`)
    : (statut === 'actif' ? i18n.t('adm.accounts_status_active')
      : statut === 'desactive' ? i18n.t('adm.accounts_status_inactive')
      : i18n.t('adm.accounts_status_pending'));
  return h('span', { class: `badge badge--${map[statut] || 'neutral'}` }, label);
}

// --- Modale création ---
function openCreateModal() {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 560px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, i18n.t('adm.accounts_create')),
      closeBtn
    ]),
    h('form', { id: 'create-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'grid grid--2' }, [
          formGroup('identifiant', i18n.t('adm.accounts_field_identifiant'), 'text', { required: true }),
          formGroup('role', i18n.t('adm.accounts_field_role'), 'select', {
            required: true, options: ROLES.map((r) => ({ value: r, label: i18n.t(`adm.accounts_role_${r}`) }))
          })
        ]),
        h('div', { class: 'grid grid--2' }, [
          formGroup('nom', i18n.t('adm.accounts_field_nom'), 'text', { required: true }),
          formGroup('prenom', i18n.t('adm.accounts_field_prenom'), 'text', { required: true })
        ]),
        h('div', { class: 'grid grid--2' }, [
          formGroup('nom_ar', i18n.t('adm.accounts_field_nom') + ' (AR)', 'text', {}),
          formGroup('prenom_ar', i18n.t('adm.accounts_field_prenom') + ' (AR)', 'text', {})
        ]),
        h('div', { class: 'grid grid--2' }, [
          formGroup('email', i18n.t('adm.accounts_field_email'), 'email', { required: true }),
          formGroup('service_id', i18n.t('adm.accounts_field_service'), 'select', {
            options: [{ value: '', label: i18n.t('common.all') }].concat(
              allServices.map((s) => ({ value: String(s.id), label: i18n.lang === 'ar' ? s.nom_ar : s.nom_fr }))
            )
          })
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

  // Adapt: show service only if role = employe
  const roleSel = dialog.querySelector('[name="role"]');
  const serviceGroup = dialog.querySelector('[name="service_id"]').closest('.form-group');
  function refreshServiceVisibility() {
    serviceGroup.style.display = roleSel.value === 'employe' ? '' : 'none';
  }
  roleSel.addEventListener('change', refreshServiceVisibility);
  refreshServiceVisibility();

  dialog.querySelector('#create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form, {
      identifiant: { required: true },
      nom: { required: true },
      prenom: { required: true },
      email: { required: true, validate: (v) => isValidEmail(v) || i18n.t('validation.email') },
      role: { required: true }
    })) return;
    const fd = new FormData(form);
    const body = {
      identifiant: fd.get('identifiant').trim(),
      nom: fd.get('nom').trim(),
      prenom: fd.get('prenom').trim(),
      nom_ar: fd.get('nom_ar').trim() || fd.get('nom').trim(),
      prenom_ar: fd.get('prenom_ar').trim() || fd.get('prenom').trim(),
      email: fd.get('email').trim(),
      role: fd.get('role'),
      ...(roleSel.value === 'employe' && fd.get('service_id') ? { service_id: Number(fd.get('service_id')) } : {})
    };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      const res = await api.post('/admin/utilisateurs', body);
      if (res?.data) allUsers.push(res.data);
      toastSuccess(i18n.t('adm.accounts_created_toast'));
      close();
      renderResults();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// --- Modale édition (email + langue_pref) ---
function openEditModal(u) {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 480px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, `${i18n.t('adm.accounts_edit')} — ${u.identifiant}`),
      closeBtn
    ]),
    h('form', { id: 'edit-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'edit-email' }, i18n.t('adm.accounts_field_email')),
          h('input', { class: 'form-control', type: 'email', id: 'edit-email', name: 'email', value: u.email || '' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'edit-lang' }, i18n.t('adm.accounts_field_langue_pref')),
          h('select', { class: 'form-control', id: 'edit-lang', name: 'langue_pref' }, [
            ...i18n.supported.map((l) => h('option', { value: l, ...(u.langue_pref === l ? { selected: 'true' } : {}) }, l.toUpperCase()))
          ])
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
  dialog.querySelector('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('[name="email"]');
    const emailVal = emailInput.value.trim();
    if (emailVal && !isValidEmail(emailVal)) {
      setFieldError(emailInput, i18n.t('validation.email'));
      return;
    }
    const fd = new FormData(form);
    const body = { email: emailVal, langue_pref: fd.get('langue_pref') };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      const res = await api.patch(`/admin/utilisateurs/${encodeURIComponent(u.id)}`, body);
      if (res?.data) {
        const idx = allUsers.findIndex((x) => x.id === u.id);
        if (idx >= 0) allUsers[idx] = { ...allUsers[idx], ...res.data };
      }
      toastSuccess(i18n.t('adm.accounts_updated_toast'));
      close();
      renderResults();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// --- Activer / Désactiver ---
async function toggleStatus(u) {
  const next = u.statut === 'actif' ? 'desactive' : 'actif';
  const confirmMsg = next === 'desactive' ? i18n.t('adm.accounts_disable_confirm') : i18n.t('adm.accounts_enable_confirm');
  if (!confirm(confirmMsg)) return;
  try {
    const res = await api.patch(`/admin/utilisateurs/${encodeURIComponent(u.id)}`, { statut: next });
    if (res?.data) {
      const idx = allUsers.findIndex((x) => x.id === u.id);
      if (idx >= 0) allUsers[idx] = { ...allUsers[idx], ...res.data };
    }
    toastSuccess(i18n.t('adm.accounts_status_changed_toast'));
    renderResults();
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

// --- Réinitialiser mot de passe ---
async function resetPassword(u) {
  if (!confirm(i18n.t('adm.accounts_reset_confirm'))) return;
  try {
    const res = await api.post(`/admin/utilisateurs/reset-password/${encodeURIComponent(u.id)}`);
    const pwd = res?.data?.mot_de_passe_temporaire;
    if (pwd) showTempPasswordModal(u, pwd);
    toastSuccess(i18n.t('adm.accounts_reset_toast'));
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

function showTempPasswordModal(u, pwd) {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const pwdBox = h('div', {
    class: 'form-control',
    style: 'font-family: var(--font-mono); font-size: var(--fs-lg); letter-spacing: 0.05em; background: var(--c-surface-alt); text-align: center; padding: var(--sp-4); cursor: default'
  }, pwd);

  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 480px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, i18n.t('adm.accounts_temp_password')),
      closeBtn
    ]),
    h('div', { class: 'modal__body' }, [
      h('p', { style: 'color: var(--c-ink-soft); margin-top: 0' }, i18n.t('adm.accounts_temp_password_hint')),
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label' }, `${i18n.t('adm.accounts_temp_password')} — ${u.identifiant}`),
        pwdBox
      ])
    ]),
    h('div', { class: 'modal__footer' }, [
      h('button', {
        class: 'btn btn--secondary', type: 'button',
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(pwd);
            toastSuccess(i18n.t('adm.accounts_copied'));
          } catch (_) { /* ignore */ }
        }
      }, i18n.t('adm.accounts_copy')),
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.close'))
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
}

// --- Helper formulaire ---
function formGroup(name, label, type, opts = {}) {
  let control;
  if (type === 'select') {
    control = h('select', { class: 'form-control', name }, (opts.options || []).map((o) =>
      h('option', { value: o.value, ...(o.value === opts.value ? { selected: 'true' } : {}) }, o.label)));
  } else {
    control = h('input', {
      class: 'form-control', type, name, id: `f-${name}`,
      value: opts.value || '', ...(opts.required ? { required: 'true' } : {}),
      ...(opts.placeholder ? { placeholder: opts.placeholder } : {})
    });
  }
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label', for: `f-${name}` }, [
      label,
      opts.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null
    ]),
    control
  ]);
}

load();
