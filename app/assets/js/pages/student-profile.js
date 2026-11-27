/**
 * PAGE : ETU-01 — Profil personnel étudiant
 * ------------------------------------------------------------------
 * Carte identité (lecture seule) + formulaire contact (email, langue)
 * + changement mot de passe. A-13 : identité non modifiable.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, errorState } from '../components/states.js';
import { validateForm, setFieldError, isValidEmail, isValidPassword } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.profile_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'profile',
    pageTitle: i18n.t('etu.profile_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/profile');
    renderProfile(res?.data || api.currentUser);
  } catch (err) {
    mountPage(renderAppShell({
      role: 'etudiant', activeKey: 'profile',
      pageTitle: i18n.t('etu.profile_title'),
      children: [errorState({ message: err.message || i18n.t('common.error') })]
    }));
  }
}

function renderProfile(profile) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  // Conserve le page-header
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  const isAr = i18n.lang === 'ar';
  const langPref = profile.langue_pref || i18n.lang;

  const children = [
    // --- Carte identité (lecture seule) ---
    h('section', { class: 'card card--pad', 'aria-label': i18n.t('etu.profile_identity') }, [
      h('div', { class: 'card__header' }, [
        h('h2', { class: 'card__title' }, i18n.t('etu.profile_identity'))
      ]),
      h('p', { class: 'form-hint', style: 'margin: 0 0 var(--sp-4)' }, i18n.t('etu.profile_identity_hint')),
      h('div', { class: 'grid grid--2' }, [
        infoRow(i18n.t('etu.matricule'), profile.identifiant || '—'),
        infoRow(i18n.t('common.student'),
          isAr ? `${profile.prenom_ar || ''} ${profile.nom_ar || ''}`.trim()
               : `${profile.prenom || ''} ${profile.nom || ''}`.trim()),
        infoRow(i18n.t('etu.faculty'), isAr ? profile.faculte_ar : profile.faculte_fr),
        infoRow(i18n.t('etu.department'), isAr ? profile.departement_ar : profile.departement_fr),
        infoRow(i18n.t('etu.specialty'), isAr ? profile.specialite_ar : profile.specialite_fr),
        infoRow(i18n.t('etu.year'), profile.annee_etude ? String(profile.annee_etude) : '—')
      ])
    ]),

    // --- Formulaire contact ---
    h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)', 'aria-label': i18n.t('etu.profile_contact') }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.profile_contact'))]),
      h('form', { id: 'profile-contact-form', novalidate: 'true' }, [
        fieldGroup({
          label: i18n.t('etu.profile_email_label'),
          name: 'email',
          type: 'email',
          value: profile.email || '',
          placeholder: 'ex. sara.belaid@etu.smartcampus.dz',
          hint: i18n.t('etu.profile_email_hint'),
          required: true
        }),
        fieldGroup({
          label: i18n.t('etu.profile_language_label'),
          name: 'langue_pref',
          type: 'select',
          value: langPref,
          options: [
            { value: 'ar', label: 'العربية' },
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' }
          ],
          hint: i18n.t('etu.profile_language_hint'),
          required: true
        }),
        h('div', { class: 'form-actions form-actions--end' }, [
          h('button', {
            class: 'btn btn--primary', type: 'submit', id: 'profile-save-btn'
          }, i18n.t('etu.profile_save'))
        ])
      ])
    ]),

    // --- Changement mot de passe ---
    h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)', 'aria-label': i18n.t('etu.profile_password_change'), id: 'password' }, [
      h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.profile_password_change'))]),
      h('p', { class: 'form-hint', style: 'margin: 0 0 var(--sp-4)' }, i18n.t('etu.profile_password_rules')),
      h('form', { id: 'profile-password-form', novalidate: 'true' }, [
        fieldGroup({
          label: i18n.t('etu.profile_password_current'),
          name: 'mot_de_passe_actuel',
          type: 'password',
          autocomplete: 'current-password',
          required: true
        }),
        fieldGroup({
          label: i18n.t('etu.profile_password_new'),
          name: 'nouveau_mot_de_passe',
          type: 'password',
          autocomplete: 'new-password',
          required: true,
          hint: i18n.t('etu.profile_password_rules')
        }),
        fieldGroup({
          label: i18n.t('etu.profile_password_confirm'),
          name: 'confirmation_mot_de_passe',
          type: 'password',
          autocomplete: 'new-password',
          required: true
        }),
        h('div', { class: 'form-actions form-actions--end' }, [
          h('button', {
            class: 'btn btn--secondary', type: 'submit', id: 'profile-password-btn'
          }, i18n.t('etu.profile_password_submit'))
        ])
      ])
    ])
  ];
  children.forEach((c) => main.appendChild(c));

  // --- Soumission formulaire contact ---
  document.querySelector('#profile-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = validateForm(form, {
      email: { required: true, validate: (v) => isValidEmail(v) || i18n.t('validation.email') },
      langue_pref: { required: true }
    });
    if (!ok) return;
    const email = form.querySelector('[name="email"]').value.trim();
    const langue_pref = form.querySelector('[name="langue_pref"]').value;
    const btn = document.querySelector('#profile-save-btn');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('common.saving');
    try {
      await api.patch('/etudiant/profile', { email, langue_pref });
      toastSuccess(i18n.t('etu.profile_saved'));
      // Si la langue change, recharger la page avec la nouvelle langue
      if (langue_pref !== i18n.lang) {
        i18n.setLang(langue_pref);
        setTimeout(() => window.location.reload(), 600);
      }
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      if (err instanceof ApiError && err.fields?.email) {
        setFieldError(form.querySelector('[name="email"]'), i18n.t('validation.email'));
      }
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  // --- Soumission mot de passe ---
  document.querySelector('#profile-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = validateForm(form, {
      mot_de_passe_actuel: { required: true },
      nouveau_mot_de_passe: {
        required: true,
        validate: (v) => isValidPassword(v) || i18n.t('etu.profile_password_rules')
      },
      confirmation_mot_de_passe: { required: true }
    });
    if (!ok) return;
    const cur = form.querySelector('[name="mot_de_passe_actuel"]').value;
    const next = form.querySelector('[name="nouveau_mot_de_passe"]').value;
    const conf = form.querySelector('[name="confirmation_mot_de_passe"]').value;
    if (next !== conf) {
      setFieldError(form.querySelector('[name="confirmation_mot_de_passe"]'), i18n.t('validation.password_mismatch'));
      return;
    }
    const btn = document.querySelector('#profile-password-btn');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('common.sending');
    try {
      await api.post('/etudiant/password', {
        mot_de_passe_actuel: cur,
        nouveau_mot_de_passe: next
      });
      toastSuccess(i18n.t('etu.profile_password_changed'));
      form.reset();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      value || '—')
  ]);
}

function fieldGroup({ label, name, type = 'text', value = '', placeholder = null, hint = null, required = false, options = null, autocomplete = null }) {
  const input = options
    ? h('select', { class: 'form-control', name, id: name, required: required ? 'true' : null, ...(autocomplete ? { autocomplete } : {}) },
        options.map((o) => h('option', { value: o.value, ...(o.value === value ? { selected: 'true' } : {}) }, o.label)))
    : h('input', {
        class: 'form-control', type, name, id: name, value: value || '',
        ...(placeholder ? { placeholder } : {}),
        ...(required ? { required: 'true' } : {}),
        ...(autocomplete ? { autocomplete } : {})
      });
  return h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: name }, [
      label,
      required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null
    ]),
    input,
    hint ? h('div', { class: 'form-hint' }, hint) : null
  ]);
}

load();
