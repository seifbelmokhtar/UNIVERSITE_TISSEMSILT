/**
 * PAGE : ETU-04 — Nouvelle demande (étudiant) — CRITIQUE
 * ------------------------------------------------------------------
 * Lit ?service_id=X. Formulaire avec champs dynamiques (motif, urgence,
 * notes) + upload pièces jointes via fileUpload. Soumission → POST
 * /etudiant/demandes → toast + redirect ETU-06.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import {
  fileUpload, validateForm, setFieldError, validateFile, MAX_FILE_SIZE
} from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.new_request_title'), requireAuth: true, requireRole: ['etudiant'] });

let selectedFiles = [];

async function load() {
  const serviceId = getUrlParam('service_id');
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'services',
    pageTitle: i18n.t('etu.new_request_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  if (!serviceId) {
    renderMissingService();
    return;
  }
  try {
    const res = await api.get('/etudiant/services');
    const services = res?.data || [];
    const service = services.find((s) => String(s.id) === String(serviceId));
    if (!service) {
      renderMissingService();
      return;
    }
    renderForm(service);
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
  main.appendChild(errorState({ message: err instanceof ApiError ? err.message : (err.message || i18n.t('common.error')) }));
}

function renderMissingService() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('etu.new_request_invalid_service'),
    message: i18n.t('etu.no_requests_hint'),
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/services.html' },
      i18n.t('etu.browse_services'))
  }));
}

function renderForm(service) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';
  const serviceName = isAr ? (service.nom_ar || service.nom_fr) : (service.nom_fr || service.nom_ar);

  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = i18n.t('etu.new_request_title');
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, [
    i18n.t('etu.new_request_subtitle'),
    ' — ',
    h('strong', {}, serviceName)
  ]));

  // Carte champs dynamiques
  const form = h('form', { id: 'new-request-form', novalidate: 'true' }, [
    // Champ caché : service_id
    h('input', { type: 'hidden', name: 'service_id', value: String(service.id) }),

    h('section', { class: 'card card--pad', 'aria-label': i18n.t('etu.new_request_fields') }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.new_request_fields'))]),

      // Motif (textarea, requis)
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'motif' }, [
          i18n.t('etu.new_request_field_motif'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('textarea', {
          class: 'form-control', name: 'motif', id: 'motif', rows: '4',
          required: 'true',
          placeholder: i18n.t('etu.new_request_field_motif_hint')
        }, ''),
        h('div', { class: 'form-hint' }, i18n.t('etu.new_request_field_motif_hint'))
      ]),

      // Urgence (select, requis)
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'urgence' }, [
          i18n.t('etu.new_request_field_urgence'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('select', { class: 'form-control', name: 'urgence', id: 'urgence', required: 'true' }, [
          h('option', { value: '' }, `— ${i18n.t('common.filter')} —`),
          h('option', { value: 'normal' }, i18n.t('etu.new_request_urgence_normal')),
          h('option', { value: 'urgent' }, i18n.t('etu.new_request_urgence_urgent')),
          h('option', { value: 'critique' }, i18n.t('etu.new_request_urgence_critical'))
        ])
      ]),

      // Notes (textarea, optionnel)
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'notes' }, i18n.t('etu.new_request_field_notes')),
        h('textarea', { class: 'form-control', name: 'notes', id: 'notes', rows: '3' }, '')
      ])
    ]),

    // Carte pièces jointes
    h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)', 'aria-label': i18n.t('etu.new_request_attachments') }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.new_request_attachments'))]),
      fileUpload({
        id: 'pieces',
        label: null,
        hint: i18n.t('etu.new_request_attachments_hint'),
        multiple: true,
        onChange: (files) => { selectedFiles = files; }
      })
    ]),

    // Actions
    h('div', { class: 'form-actions', style: 'margin-top: var(--sp-6); gap: var(--sp-3)' }, [
      h('a', { class: 'btn btn--ghost', href: '/pages/student/services.html' }, i18n.t('etu.new_request_cancel')),
      h('button', { class: 'btn btn--primary', type: 'submit', id: 'new-request-submit' }, i18n.t('etu.new_request_submit'))
    ])
  ]);

  main.appendChild(form);

  // Soumission
  form.addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const ok = validateForm(form, {
    motif: { required: true, validate: (v) => v.length >= 5 || i18n.t('validation.min_length', { n: 5 }) },
    urgence: { required: true }
  });
  if (!ok) return;

  // Valider les fichiers (taille + type)
  const fileErrors = [];
  for (const f of selectedFiles) {
    const errs = validateFile(f);
    if (errs.length) fileErrors.push(`${f.name}: ${errs[0]}`);
  }
  if (fileErrors.length) {
    toastError(fileErrors[0]);
    return;
  }

  const serviceId = form.querySelector('[name="service_id"]').value;
  const motif = form.querySelector('[name="motif"]').value.trim();
  const urgence = form.querySelector('[name="urgence"]').value;
  const notes = form.querySelector('[name="notes"]').value.trim();

  // Préparer payload pièces (mock : métadonnées seulement, pas d'upload réel)
  const pieces = selectedFiles.map((f) => ({
    nom: f.name,
    taille: f.size,
    type: f.type
  }));

  const body = {
    type: 'service',
    service_id: Number(serviceId),
    champs: { motif, urgence, notes },
    pieces
  };

  const btn = document.querySelector('#new-request-submit');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = i18n.t('etu.new_request_submitting');

  try {
    const res = await api.post('/etudiant/demandes', body);
    const newDem = res?.data;
    if (newDem && newDem.id) {
      toastSuccess(i18n.t('etu.new_request_success'));
      setTimeout(() => {
        window.location.href = `/pages/student/request-detail.html?id=${newDem.id}`;
      }, 700);
    } else {
      toastSuccess(i18n.t('etu.new_request_success'));
      setTimeout(() => {
        window.location.href = '/pages/student/my-requests.html';
      }, 700);
    }
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    btn.disabled = false;
    btn.textContent = original;
  }
}

load();
