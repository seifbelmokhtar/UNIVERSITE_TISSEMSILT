/**
 * PAGE : ETU-10 — Nouvelle réclamation (étudiant)
 * ------------------------------------------------------------------
 * Formulaire : select service (GET /etudiant/services), textarea description
 * (min 20 chars), upload pièces optionnel. Soumission → POST
 * /etudiant/reclamations → toast + redirect ETU-11 ?id=X.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { fileUpload, validateForm, validateFile } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.new_complaint_title'), requireAuth: true, requireRole: ['etudiant'] });

let selectedFiles = [];

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'complaints',
    pageTitle: i18n.t('etu.new_complaint_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/services');
    renderForm(res?.data || []);
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

function renderForm(services) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  if (!services.length) {
    main.appendChild(emptyState({
      title: i18n.t('common.empty'),
      message: ''
    }));
    return;
  }

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.new_complaint_subtitle')));

  const form = h('form', { id: 'new-complaint-form', novalidate: 'true' }, [
    h('section', { class: 'card card--pad' }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.new_complaint_title'))]),

      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'service_id' }, [
          i18n.t('etu.new_complaint_service'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('select', { class: 'form-control', name: 'service_id', id: 'service_id', required: 'true' }, [
          h('option', { value: '' }, `— ${i18n.t('common.filter')} —`),
          ...services.map((s) => h('option', { value: String(s.id) },
            isAr ? (s.nom_ar || s.nom_fr) : (s.nom_fr || s.nom_ar)))
        ])
      ]),

      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'description' }, [
          i18n.t('etu.new_complaint_description'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('textarea', {
          class: 'form-control', name: 'description', id: 'description', rows: '6',
          required: 'true',
          placeholder: i18n.t('etu.new_complaint_description_hint')
        }, ''),
        h('div', { class: 'form-hint' }, i18n.t('etu.new_complaint_description_hint'))
      ])
    ]),

    h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.new_complaint_attachments'))]),
      fileUpload({
        id: 'complaint-pieces',
        label: null,
        multiple: true,
        onChange: (files) => { selectedFiles = files; }
      })
    ]),

    h('div', { class: 'form-actions', style: 'margin-top: var(--sp-6); gap: var(--sp-3)' }, [
      h('a', { class: 'btn btn--ghost', href: '/pages/student/my-requests.html' }, i18n.t('etu.new_complaint_cancel')),
      h('button', { class: 'btn btn--primary', type: 'submit', id: 'complaint-submit' },
        i18n.t('etu.new_complaint_submit'))
    ])
  ]);

  main.appendChild(form);

  form.addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const ok = validateForm(form, {
    service_id: { required: true },
    description: {
      required: true,
      validate: (v) => v.length >= 20 || i18n.t('validation.min_length', { n: 20 })
    }
  });
  if (!ok) return;

  // Valider fichiers (optionnels)
  for (const f of selectedFiles) {
    const errs = validateFile(f);
    if (errs.length) {
      toastError(`${f.name}: ${errs[0]}`);
      return;
    }
  }

  const service_id = Number(form.querySelector('[name="service_id"]').value);
  const description = form.querySelector('[name="description"]').value.trim();
  const pieces = selectedFiles.map((f) => ({ nom: f.name, taille: f.size, type: f.type }));

  const btn = form.querySelector('#complaint-submit');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = i18n.t('etu.new_complaint_submitting');

  try {
    const res = await api.post('/etudiant/reclamations', { service_id, description, pieces });
    const newRec = res?.data;
    toastSuccess(i18n.t('etu.new_complaint_success'));
    setTimeout(() => {
      if (newRec?.id) {
        window.location.href = `/pages/student/complaint-detail.html?id=${newRec.id}`;
      } else {
        window.location.href = '/pages/student/my-requests.html';
      }
    }, 700);
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    btn.disabled = false;
    btn.textContent = original;
  }
}

load();
