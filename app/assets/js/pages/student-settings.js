/**
 * PAGE : ETU-13 — Paramètres (étudiant)
 * ------------------------------------------------------------------
 * Sélecteur langue par défaut → PATCH /etudiant/profile (langue_pref)
 * + i18n.setLang() + reload. Lien "changer mot de passe" → ETU-01#password.
 * Lien "Se déconnecter" → api.logout() → home.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState } from '../components/states.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.settings_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'settings',
    pageTitle: i18n.t('etu.settings_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/profile');
    renderSettings(res?.data || api.currentUser);
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

function renderSettings(profile) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.settings_subtitle')));

  // --- Carte langue ---
  main.appendChild(h('section', { class: 'card card--pad' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.settings_language'))]),
    h('form', { id: 'settings-lang-form', novalidate: 'true' }, [
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'langue_pref' }, [
          i18n.t('etu.settings_language'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('select', { class: 'form-control', name: 'langue_pref', id: 'langue_pref', required: 'true' }, [
          h('option', { value: 'ar', ...(profile.langue_pref === 'ar' ? { selected: 'true' } : {}) }, 'العربية'),
          h('option', { value: 'fr', ...(profile.langue_pref === 'fr' ? { selected: 'true' } : {}) }, 'Français'),
          h('option', { value: 'en', ...(profile.langue_pref === 'en' ? { selected: 'true' } : {}) }, 'English')
        ]),
        h('div', { class: 'form-hint' }, i18n.t('etu.settings_language_hint'))
      ]),
      h('div', { class: 'form-actions form-actions--end' }, [
        h('button', { class: 'btn btn--primary', type: 'submit', id: 'settings-lang-submit' },
          i18n.t('etu.settings_save'))
      ])
    ])
  ]));

  // --- Carte mot de passe ---
  main.appendChild(h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.settings_password'))]),
    h('p', { style: 'color: var(--c-ink-soft); margin: 0 0 var(--sp-4)' }, i18n.t('etu.settings_password_cta')),
    h('a', {
      class: 'btn btn--secondary',
      href: '/pages/student/profile.html#password'
    }, i18n.t('etu.settings_password_cta'))
  ]));

  // --- Carte déconnexion ---
  main.appendChild(h('section', {
    class: 'card card--pad',
    style: 'margin-top: var(--sp-6); border-inline-start: 4px solid var(--c-danger)'
  }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.settings_logout'))]),
    h('p', { style: 'color: var(--c-ink-soft); margin: 0 0 var(--sp-4)' }, i18n.t('etu.settings_logout_cta')),
    h('button', {
      class: 'btn btn--danger',
      type: 'button',
      onclick: async () => {
        try { await api.logout(); } catch (_) {}
        window.location.href = '/pages/public/home.html';
      }
    }, i18n.t('nav.logout'))
  ]));

  // --- Soumission langue ---
  document.querySelector('#settings-lang-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const langue_pref = form.querySelector('[name="langue_pref"]').value;
    if (!langue_pref) {
      toastError(i18n.t('validation.required'));
      return;
    }
    const btn = form.querySelector('#settings-lang-submit');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('etu.settings_reloading');
    try {
      await api.patch('/etudiant/profile', { langue_pref });
      toastSuccess(i18n.t('etu.settings_saved'));
      // Appliquer la langue puis recharger
      i18n.setLang(langue_pref);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

load();
