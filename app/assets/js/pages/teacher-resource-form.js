/**
 * PAGE : ENS-02 — Publication / édition d'une ressource (enseignant)
 * ------------------------------------------------------------------
 * Lit ?id=X pour édition, sinon création.
 * Formulaire: titre (required), description (textarea), type (select),
 * module (select depuis GET /enseignant/modules), upload PDF.
 * Soumission POST (création) ou PATCH (édition) → toast + redirect ENS-01.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { fileUpload, validateForm } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

const TYPES = [
  { value: 'cours', labelKey: 'ens.resource_type_cours' },
  { value: 'td', labelKey: 'ens.resource_type_td' },
  { value: 'tp', labelKey: 'ens.resource_type_tp' },
  { value: 'document', labelKey: 'ens.resource_type_document' }
];

let selectedFiles = [];

bootstrapPage({ title: i18n.t('ens.resource_form_title'), requireAuth: true, requireRole: ['enseignant'] });

async function load() {
  const id = getUrlParam('id');
  const isEdit = !!id;

  const shell = renderAppShell({
    role: 'enseignant',
    activeKey: 'resources',
    pageTitle: isEdit ? i18n.t('ens.resource_form_edit') : i18n.t('ens.resource_form_new'),
    children: [loadingState()]
  });
  mountPage(shell);

  try {
    // Charger la liste des modules (toujours nécessaire)
    const modsRes = await api.get('/enseignant/modules');
    const modules = modsRes?.data || [];

    if (isEdit) {
      // Charger les ressources puis trouver celle qui correspond à id
      const resRes = await api.get('/enseignant/ressources');
      const list = resRes?.data || [];
      const resource = list.find((r) => String(r.id) === String(id));
      if (!resource) {
        renderNotFound();
        return;
      }
      renderForm(modules, resource);
    } else {
      renderForm(modules, null);
    }
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
  main.appendChild(errorState({ message: err instanceof ApiError ? err.message : i18n.t('ens.resource_form_load_error') }));
}

function renderNotFound() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('ens.resource_not_found'),
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/teacher/resources.html' },
      i18n.t('ens.my_resources'))
  }));
}

function renderForm(modules, existing) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = existing
    ? i18n.t('ens.resource_form_edit')
    : i18n.t('ens.resource_form_new');

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  if (!modules.length) {
    main.appendChild(emptyState({
      title: i18n.t('ens.resource_form_missing_module'),
      action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/teacher/resources.html' },
        i18n.t('ens.my_resources'))
    }));
    return;
  }

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('ens.resource_form_intro')));

  selectedFiles = [];

  const form = h('form', { id: 'resource-form', novalidate: 'true' }, [
    existing ? h('input', { type: 'hidden', name: 'id', value: String(existing.id) }) : null,

    h('section', { class: 'card card--pad' }, [
      h('div', { class: 'card__header' }, [
        h('h2', { class: 'card__title' },
          existing ? i18n.t('ens.resource_form_edit') : i18n.t('ens.resource_form_new'))
      ]),

      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'titre' }, [
          i18n.t('ens.resource_form_titre'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('input', {
          class: 'form-control', type: 'text', name: 'titre', id: 'titre',
          required: 'true',
          value: existing ? (isAr ? (existing.titre || existing.titre_fr || '') : (existing.titre_fr || existing.titre || '')) : '',
          placeholder: i18n.t('ens.resource_form_titre')
        })
      ]),

      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'description' },
          i18n.t('ens.resource_form_description')),
        h('textarea', {
          class: 'form-control', name: 'description', id: 'description', rows: '4'
        }, existing ? (existing.description || '') : '')
      ]),

      h('div', { class: 'grid grid--2' }, [
        h('div', { class: 'form-group', style: 'margin: 0' }, [
          h('label', { class: 'form-label', for: 'type' }, [
            i18n.t('ens.resource_form_type'),
            h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
          ]),
          h('select', { class: 'form-control', name: 'type', id: 'type', required: 'true' }, [
            h('option', { value: '' }, i18n.t('ens.resource_form_type_placeholder')),
            ...TYPES.map((t) => h('option', {
              value: t.value,
              ...(existing && existing.type === t.value ? { selected: 'selected' } : {})
            }, i18n.t(t.labelKey)))
          ])
        ]),
        h('div', { class: 'form-group', style: 'margin: 0' }, [
          h('label', { class: 'form-label', for: 'module_id' }, [
            i18n.t('ens.resource_form_module'),
            h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
          ]),
          h('select', { class: 'form-control', name: 'module_id', id: 'module_id', required: 'true' }, [
            h('option', { value: '' }, i18n.t('ens.resource_form_module_placeholder')),
            ...modules.map((m) => h('option', {
              value: String(m.id),
              ...(existing && String(existing.module_id) === String(m.id) ? { selected: 'selected' } : {})
            }, isAr ? (m.nom_ar || m.nom_fr) : (m.nom_fr || m.nom_ar)))
          ])
        ])
      ])
    ]),

    // Carte upload (uniquement en création)
    !existing ? h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('ens.resource_form_attachment'))]),
      fileUpload({
        id: 'fichier',
        accept: '.pdf',
        hint: i18n.t('ens.resource_form_attachment_hint'),
        onChange: (files) => { selectedFiles = files; }
      })
    ]) : null,

    h('div', { class: 'form-actions', style: 'margin-top: var(--sp-6); gap: var(--sp-3)' }, [
      h('a', { class: 'btn btn--ghost', href: '/pages/teacher/resources.html' },
        i18n.t('ens.resource_form_cancel')),
      h('button', { class: 'btn btn--primary', type: 'submit', id: 'resource-submit' },
        existing ? i18n.t('ens.resource_form_submit_edit') : i18n.t('ens.resource_form_submit_new'))
    ])
  ]);

  main.appendChild(form);
  form.addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const isEdit = !!form.querySelector('[name="id"]');

  const ok = validateForm(form, {
    titre: { required: true },
    type: { required: true },
    module_id: { required: true }
  });
  if (!ok) return;

  const titre = form.querySelector('[name="titre"]').value.trim();
  const description = form.querySelector('[name="description"]').value.trim();
  const type = form.querySelector('[name="type"]').value;
  const module_id = Number(form.querySelector('[name="module_id"]').value);

  // En création, on calcule la taille cumulée (mock — pas d'upload réel)
  const taille = isEdit ? undefined
    : selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  const body = { titre, description, type, module_id };
  if (!isEdit) body.taille = taille;

  const btn = form.querySelector('#resource-submit');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = i18n.t('ens.resource_form_submitting');

  try {
    if (isEdit) {
      const id = form.querySelector('[name="id"]').value;
      await api.patch(`/enseignant/ressources/${encodeURIComponent(id)}`, body);
      toastSuccess(i18n.t('ens.resource_form_success_edit'));
    } else {
      await api.post('/enseignant/ressources', body);
      toastSuccess(i18n.t('ens.resource_form_success_new'));
    }
    setTimeout(() => { window.location.href = '/pages/teacher/resources.html'; }, 700);
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    btn.disabled = false;
    btn.textContent = original;
  }
}

load();
