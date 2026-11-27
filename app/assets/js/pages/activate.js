/**
 * PAGE : PUB-15 — Activation du compte (écran critique)
 * ------------------------------------------------------------------
 * R-05 (activation), A-01 (procédure), EC-04/05/06 (codes).
 * Le matricule + code + mot de passe sont vérifiés côté serveur.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { h } from '../core/dom.js';
import { toast } from '../components/toast.js';
import { renderLangSwitch } from '../components/site-header.js';
import { isValidActivationCode, isValidPassword, setFieldError } from '../components/forms.js';

bootstrapPage({ title: i18n.t('auth.activation_title') });

function buildLayout() {
  const header = h('header', { class: 'auth-header' }, [
    h('div', { class: 'auth-header__inner' }, [
      h('a', { href: '/pages/public/home.html', class: 'auth-header__back' }, '← ' + i18n.t('nav.back_to_site')),
      renderLangSwitch(i18n.lang)
    ])
  ]);

  const card = h('div', { class: 'auth-card' }, [
    h('div', { class: 'auth-card__head' }, [
      h('div', { class: 'auth-card__logo', 'aria-hidden': 'true' }, 'UT'),
      h('h1', { class: 'auth-card__title' }, i18n.t('auth.activation_title')),
      h('p', { class: 'auth-card__subtitle' }, i18n.t('auth.activation_subtitle'))
    ]),
    buildForm()
  ]);

  mountPage([header, h('main', { id: 'main-content', class: 'auth-main' }, [card])]);
}

function buildForm() {
  const form = h('form', {
    class: 'auth-form',
    novalidate: 'true',
    autocomplete: 'off',
    onsubmit: async (e) => {
      e.preventDefault();
      await handleSubmit(form);
    }
  });

  // Matricule
  const matriculeInput = h('input', {
    type: 'text', id: 'matricule', name: 'matricule', class: 'form-control',
    required: 'true', autocomplete: 'off', placeholder: '20260006'
  });
  const matriculeGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'matricule' }, [
      document.createTextNode(i18n.t('auth.matricule')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    matriculeInput
  ]);

  // Code
  const codeInput = h('input', {
    type: 'text', id: 'code', name: 'code', class: 'form-control',
    required: 'true', autocomplete: 'one-time-code', placeholder: 'ACT-XXXXXX',
    inputmode: 'text', maxlength: '20'
  });
  const codeGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'code' }, [
      document.createTextNode(i18n.t('auth.activation_code')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    codeInput,
    h('span', { class: 'form-hint' }, i18n.t('auth.activation_code_hint'))
  ]);

  // Mot de passe
  const pwdInput = h('input', {
    type: 'password', id: 'new_password', name: 'new_password', class: 'form-control',
    required: 'true', autocomplete: 'new-password'
  });
  const pwdGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'new_password' }, [
      document.createTextNode(i18n.t('auth.new_password')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    pwdInput,
    h('span', { class: 'form-hint' }, i18n.t('auth.password_rules'))
  ]);

  // Confirm
  const confirmInput = h('input', {
    type: 'password', id: 'confirm_password', name: 'confirm_password', class: 'form-control',
    required: 'true', autocomplete: 'new-password'
  });
  const confirmGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'confirm_password' }, [
      document.createTextNode(i18n.t('auth.password_confirm')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    confirmInput
  ]);

  const errorAlert = h('div', { class: 'alert alert--danger', role: 'alert', style: 'display: none' });
  const submitBtn = h('button', { type: 'submit', class: 'btn btn--primary btn--block btn--lg' }, i18n.t('auth.activation_submit'));

  form.append(matriculeGroup, codeGroup, pwdGroup, confirmGroup, errorAlert, submitBtn);
  return form;
}

async function handleSubmit(form) {
  const errorAlert = form.querySelector('.alert--danger');
  errorAlert.style.display = 'none';
  errorAlert.innerHTML = '';

  const matricule = form.querySelector('#matricule');
  const code = form.querySelector('#code');
  const pwd = form.querySelector('#new_password');
  const confirm = form.querySelector('#confirm_password');

  let valid = true;
  if (!matricule.value.trim()) { setFieldError(matricule, i18n.t('validation.required')); valid = false; }
  else setFieldError(matricule, null);

  if (!isValidActivationCode(code.value)) {
    setFieldError(code, i18n.t('auth.activation_invalid_code'));
    valid = false;
  } else setFieldError(code, null);

  if (!isValidPassword(pwd.value)) {
    setFieldError(pwd, i18n.t('auth.password_rules'));
    valid = false;
  } else setFieldError(pwd, null);

  if (pwd.value !== confirm.value) {
    setFieldError(confirm, i18n.t('validation.password_mismatch'));
    valid = false;
  } else setFieldError(confirm, null);

  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = i18n.t('common.sending');

  try {
    const res = await api.activate(matricule.value.trim(), code.value.trim().toUpperCase(), pwd.value);
    toast({ type: 'success', title: i18n.t('auth.activation_success'), duration: 2500 });

    const role = res.utilisateur?.role;
    const dashboards = {
      etudiant: '/pages/student/dashboard.html',
      enseignant: '/pages/teacher/dashboard.html',
      employe: '/pages/employee/dashboard.html',
      admin: '/pages/admin/dashboard.html'
    };
    setTimeout(() => { window.location.href = dashboards[role] || '/pages/public/home.html'; }, 1200);
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = i18n.t('auth.activation_submit');

    if (err && err.status) {
      if (err.fields?.matricule) {
        setFieldError(matricule, i18n.t('auth.activation_invalid_code'));
      } else if (err.fields?.code) {
        if (err.code === 'code_used') setFieldError(code, i18n.t('auth.activation_already_used'));
        else if (err.code === 'code_expired') setFieldError(code, i18n.t('auth.activation_invalid_code'));
        else setFieldError(code, i18n.t('auth.activation_invalid_code'));
      } else if (err.fields?.nouveau_mot_de_passe) {
        setFieldError(pwd, i18n.t('auth.password_rules'));
      } else if (err.code === 'already_active') {
        showError(i18n.t('auth.activation_account_already_active'));
      } else if (err.code === 'account_disabled') {
        showError(i18n.t('auth.account_disabled'));
      } else {
        showError(err.message || i18n.t('common.error'));
      }
    } else {
      showError(i18n.t('common.error'));
    }
  }
}

function showError(message) {
  const form = document.querySelector('.auth-form');
  if (!form) return;
  const alert = form.querySelector('.alert--danger');
  alert.innerHTML = '';
  alert.appendChild(h('div', { class: 'alert__body' }, [message]));
  alert.style.display = 'flex';
}

buildLayout();

const style = document.createElement('style');
style.textContent = `
  .auth-header { background: var(--c-surface); border-bottom: 1px solid var(--c-line); }
  .auth-header__inner { max-width: var(--container-wide); margin-inline: auto; padding: var(--sp-3) var(--sp-4); display: flex; align-items: center; justify-content: space-between; }
  .auth-header__back { color: var(--c-ink-soft); text-decoration: none; font-size: var(--fs-sm); }
  .auth-main { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); padding: var(--sp-6) var(--sp-4); }
  .auth-card { background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--r-xl); box-shadow: var(--sh-lg); max-width: 480px; width: 100%; padding: var(--sp-8); }
  .auth-card__head { text-align: center; margin-bottom: var(--sp-6); }
  .auth-card__logo { width: 56px; height: 56px; margin: 0 auto var(--sp-4); background: var(--c-ink); color: var(--c-primary-ink); border-radius: var(--r-lg); display: grid; place-items: center; font-size: var(--fs-lg); font-weight: var(--fw-bold); }
  .auth-card__title { font-size: var(--fs-xl); margin-bottom: var(--sp-2); }
  .auth-card__subtitle { color: var(--c-ink-soft); font-size: var(--fs-sm); }
`;
document.head.appendChild(style);
