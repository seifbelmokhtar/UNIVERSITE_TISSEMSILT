/**
 * PAGE : ADM-05 — Configuration des services (CRITIQUE — D-08 Service Catalog)
 * ------------------------------------------------------------------
 * Liste tous les services (actifs + inactifs).
 * Pour chaque service :
 *  - Carte avec nom, code, statut (toggle actif/inactif)
 *  - Description éditable (ar/fr) → PATCH /admin/services/{id}
 *  - Bouton "Configurer" → modal avec onglets:
 *      • Champs dynamiques (mock)
 *      • Documents requis (mock)
 *      • Employés assignés (mock)
 *  - Toggle actif → PATCH /admin/services/{id} {actif:true/false}
 *    Si activation sans champs configurés → warning.
 *  - Bouton "Ajouter champ" (mock local).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';
import { toastSuccess, toastError, toastInfo, toast } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.services_config_title'), requireAuth: true, requireRole: ['admin'] });

let allServices = [];
// Champs dynamiques locaux par service_id (mock)
const localFields = {};

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'services-config',
    pageTitle: i18n.t('adm.services_config_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/admin/services');
    allServices = res?.data || [];
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

  if (!allServices.length) {
    main.appendChild(emptyState({ message: i18n.t('common.empty') }));
    return;
  }

  const grid = h('div', { class: 'grid grid--2' });
  for (const s of allServices) grid.appendChild(renderServiceCard(s));
  main.appendChild(grid);
}

function renderServiceCard(s) {
  const isIncomplete = !s.description_ar || !s.description_fr;
  return h('section', { class: 'card card--hover', 'data-service-id': String(s.id) }, [
    h('div', { class: 'card__header' }, [
      h('div', {}, [
        h('h2', { class: 'card__title' }, i18n.lang === 'ar' ? s.nom_ar : (s.nom_fr || s.nom_ar)),
        h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); font-family: var(--font-mono)' }, s.code)
      ]),
      h('label', { class: 'toggle', title: s.actif ? i18n.t('adm.services_config_deactivate') : i18n.t('adm.services_config_activate') }, [
        h('input', {
          type: 'checkbox', checked: s.actif ? 'true' : null,
          onchange: (e) => toggleActive(s, e.target.checked)
        }),
        h('span', { class: 'toggle__slider' }),
        h('span', { class: 'toggle__label' }, s.actif ? i18n.t('adm.services_config_active') : i18n.t('adm.services_config_inactive'))
      ])
    ]),
    h('div', { class: 'card__body' }, [
      isIncomplete
        ? h('div', { class: 'alert alert--warning', style: 'margin-bottom: var(--sp-3)' }, i18n.t('adm.services_config_warning_incomplete'))
        : null,
      h('div', { class: 'form-group', style: 'margin-bottom: var(--sp-3)' }, [
        h('label', { class: 'form-label' }, i18n.t('adm.structure_field_nom_fr') + ' (' + i18n.t('common.description') + ')'),
        h('textarea', {
          class: 'form-control', rows: '2',
          onblur: (e) => saveDescription(s, 'description_fr', e.target.value)
        }, s.description_fr || '')
      ]),
      h('div', { class: 'form-group', style: 'margin-bottom: var(--sp-3)' }, [
        h('label', { class: 'form-label' }, i18n.t('adm.structure_field_nom_ar') + ' (' + i18n.t('common.description') + ')'),
        h('textarea', {
          class: 'form-control', rows: '2', dir: 'rtl',
          onblur: (e) => saveDescription(s, 'description_ar', e.target.value)
        }, s.description_ar || '')
      ])
    ]),
    h('div', { class: 'card__footer' }, [
      h('button', {
        class: 'btn btn--secondary btn--sm', type: 'button',
        onclick: () => openConfigModal(s)
      }, i18n.t('adm.services_config_configure'))
    ])
  ]);
}

async function toggleActive(s, nextActive) {
  // Vérifier complétude si activation
  if (nextActive) {
    const fields = localFields[s.id] || [];
    if (!s.description_ar || !s.description_fr || fields.length === 0) {
      toast({
        type: 'warning',
        title: i18n.t('adm.services_config_incomplete'),
        message: i18n.t('adm.services_config_warning_incomplete')
      });
    }
  }
  try {
    const res = await api.patch(`/admin/services/${encodeURIComponent(s.id)}`, { actif: nextActive });
    if (res?.data) Object.assign(s, res.data);
    toastSuccess(i18n.t('adm.services_config_status_changed'));
    renderView();
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    renderView();
  }
}

async function saveDescription(s, field, value) {
  if (s[field] === value) return;
  try {
    const res = await api.patch(`/admin/services/${encodeURIComponent(s.id)}`, { [field]: value });
    if (res?.data) Object.assign(s, res.data);
    toastSuccess(i18n.t('content_saved_toast'));
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

// --- Modal configuration avec onglets ---
function openConfigModal(s) {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 720px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, `${i18n.t('adm.services_config_configure')} — ${s.code}`),
      closeBtn
    ]),
    h('div', { class: 'modal__body' }, [
      h('div', { class: 'tabs', role: 'tablist' }, [
        tabButton('fields', i18n.t('adm.services_config_fields'), true),
        tabButton('documents', i18n.t('adm.services_config_documents'), false),
        tabButton('employees', i18n.t('adm.services_config_employees'), false)
      ]),
      h('div', { id: 'tab-fields', class: 'tab-panel tab-panel--active', role: 'tabpanel' }, renderFieldsTab(s)),
      h('div', { id: 'tab-documents', class: 'tab-panel', role: 'tabpanel', hidden: 'true' }, renderDocumentsTab(s)),
      h('div', { id: 'tab-employees', class: 'tab-panel', role: 'tabpanel', hidden: 'true' }, renderEmployeesTab(s))
    ]),
    h('div', { class: 'modal__footer' }, [
      h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.close'))
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

  // Onglets
  dialog.querySelectorAll('.tabs__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      dialog.querySelectorAll('.tabs__btn').forEach((b) => {
        b.classList.remove('tabs__btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('tabs__btn--active');
      btn.setAttribute('aria-selected', 'true');
      const target = btn.dataset.tab;
      dialog.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('tab-panel--active', p.id === `tab-${target}`);
        if (p.id === `tab-${target}`) p.removeAttribute('hidden');
        else p.setAttribute('hidden', 'true');
      });
    });
  });

  // Add field button — initial binding (subsequent re-binds handled by bindAddField)
  bindAddField(dialog, s);
}

function bindAddField(dialog, s) {
  const addBtn = dialog.querySelector('[data-action="add-field"]');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => {
    const labelInput = dialog.querySelector('[name="new-field-label"]');
    const typeInput = dialog.querySelector('[name="new-field-type"]');
    const requiredInput = dialog.querySelector('[name="new-field-required"]');
    const label = labelInput.value.trim();
    if (!label) {
      toastError(i18n.t('validation.required'));
      return;
    }
    localFields[s.id] = localFields[s.id] || [];
    localFields[s.id].push({
      id: Math.floor(Math.random() * 10000) + 100,
      label,
      type: typeInput.value,
      required: requiredInput.checked
    });
    toastInfo(i18n.t('adm.services_config_simulated'));
    labelInput.value = '';
    const panel = dialog.querySelector('#tab-fields');
    panel.innerHTML = '';
    for (const n of renderFieldsTab(s)) panel.appendChild(n);
    bindAddField(dialog, s);
  });
}

function tabButton(key, label, active) {
  return h('button', {
    class: `tabs__btn${active ? ' tabs__btn--active' : ''}`,
    role: 'tab', 'aria-selected': active ? 'true' : 'false',
    'data-tab': key, type: 'button'
  }, label);
}

function renderFieldsTab(s) {
  const fields = localFields[s.id] || [];
  const nodes = [];
  if (!fields.length) {
    nodes.push(h('p', { class: 'form-hint', style: 'margin-top: 0' }, i18n.t('adm.services_config_no_fields')));
  } else {
    nodes.push(h('div', { class: 'table-wrap', style: 'margin-bottom: var(--sp-4)' }, [
      h('table', { class: 'table table--compact' }, [
        h('thead', {}, h('tr', {}, [
          h('th', {}, i18n.t('adm.services_config_field_label')),
          h('th', {}, i18n.t('adm.services_config_field_type')),
          h('th', {}, i18n.t('adm.services_config_field_required'))
        ])),
        h('tbody', {}, fields.map((f) => h('tr', {}, [
          h('td', {}, f.label),
          h('td', {}, i18n.t(`adm.services_config_field_type_${f.type}`)),
          h('td', {}, f.required ? h('span', { class: 'badge badge--success' }, '✓') : h('span', { class: 'badge badge--neutral' }, '—'))
        ])))
      ])
    ]));
  }
  // Form new field
  nodes.push(h('div', { class: 'form-row', style: 'align-items: end; gap: var(--sp-2)' }, [
    h('div', { class: 'form-group', style: 'flex: 1; margin: 0' }, [
      h('label', { class: 'form-label', for: 'new-field-label' }, i18n.t('adm.services_config_field_label')),
      h('input', { class: 'form-control', type: 'text', id: 'new-field-label', name: 'new-field-label' })
    ]),
    h('div', { class: 'form-group', style: 'min-width: 140px; margin: 0' }, [
      h('label', { class: 'form-label', for: 'new-field-type' }, i18n.t('adm.services_config_field_type')),
      h('select', { class: 'form-control', id: 'new-field-type', name: 'new-field-type' }, [
        h('option', { value: 'text' }, i18n.t('adm.services_config_field_type_text')),
        h('option', { value: 'number' }, i18n.t('adm.services_config_field_type_number')),
        h('option', { value: 'date' }, i18n.t('adm.services_config_field_type_date')),
        h('option', { value: 'file' }, i18n.t('adm.services_config_field_type_file'))
      ])
    ]),
    h('div', { class: 'form-check', style: 'margin: 0' }, [
      h('input', { class: 'form-check', type: 'checkbox', id: 'new-field-required', name: 'new-field-required' }),
      h('label', { for: 'new-field-required' }, i18n.t('adm.services_config_field_required'))
    ]),
    h('button', { class: 'btn btn--secondary btn--sm', type: 'button', 'data-action': 'add-field' }, i18n.t('adm.services_config_add_field'))
  ]));
  return nodes;
}

function renderDocumentsTab(s) {
  // Mock : liste statique de documents types
  const docs = [
    { code: 'photo', label: i18n.lang === 'ar' ? 'صورة شمسية' : 'Photo d\'identité', required: true },
    { code: 'extrait_naissance', label: i18n.lang === 'ar' ? 'مقتطف الميلاد' : 'Extrait de naissance', required: false }
  ];
  return [
    h('p', { class: 'form-hint', style: 'margin-top: 0' }, i18n.t('adm.services_config_simulated')),
    h('div', { class: 'table-wrap' }, [
      h('table', { class: 'table table--compact' }, [
        h('thead', {}, h('tr', {}, [
          h('th', {}, i18n.lang === 'ar' ? 'الوثيقة' : 'Document'),
          h('th', {}, i18n.t('adm.services_config_field_required'))
        ])),
        h('tbody', {}, docs.map((d) => h('tr', {}, [
          h('td', {}, d.label),
          h('td', {}, d.required ? h('span', { class: 'badge badge--success' }, '✓') : h('span', { class: 'badge badge--neutral' }, '—'))
        ])))
      ])
    ])
  ];
}

function renderEmployeesTab(s) {
  return [
    h('p', { class: 'form-hint', style: 'margin-top: 0' }, i18n.t('adm.services_config_simulated')),
    h('p', { style: 'color: var(--c-ink-muted)' }, i18n.t('adm.services_config_no_employees'))
  ];
}

const style = document.createElement('style');
style.textContent = `
  .toggle { display: inline-flex; align-items: center; gap: var(--sp-2); cursor: pointer; user-select: none; font-size: var(--fs-sm); }
  .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .toggle__slider { width: 36px; height: 20px; background: var(--c-line); border-radius: 999px; position: relative; transition: background var(--t-fast); flex-shrink: 0; }
  .toggle__slider::after { content: ''; position: absolute; top: 2px; inset-inline-start: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--c-surface); transition: transform var(--t-fast); }
  .toggle input:checked + .toggle__slider { background: var(--c-success); }
  .toggle input:checked + .toggle__slider::after { transform: translateX(16px); }
  [dir="rtl"] .toggle input:checked + .toggle__slider::after { transform: translateX(-16px); }
  .tabs { display: flex; gap: var(--sp-1); border-bottom: 1px solid var(--c-line-soft); margin-bottom: var(--sp-4); flex-wrap: wrap; }
  .tabs__btn { background: transparent; border: 0; padding: var(--sp-2) var(--sp-3); cursor: pointer; border-bottom: 2px solid transparent; color: var(--c-ink-soft); font-size: var(--fs-sm); }
  .tabs__btn--active { color: var(--c-ink); border-bottom-color: var(--c-ink); font-weight: var(--fw-semibold); }
  .tab-panel { display: none; }
  .tab-panel--active { display: block; }
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--warning { background: var(--c-warning-bg); color: var(--c-warning); border-color: var(--c-warning); }
`;
document.head.appendChild(style);

load();
