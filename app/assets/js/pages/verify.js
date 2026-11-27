/**
 * PAGE : PUB-16 — Vérification publique d'un document (écran critique)
 * ------------------------------------------------------------------
 * R-38 (vérification sans données personnelles), NF-05 (protection API).
 * Fonctionne sans connexion. Affiche UNIQUEMENT les données d'authentification.
 * EC-23/24/25/28 (sécurité — pas de différence d'affichage entre cas).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { h, formatDate } from '../core/dom.js';
import { renderLangSwitch } from '../components/site-header.js';

bootstrapPage({ title: i18n.t('auth.verification_title') });

function buildLayout() {
  const header = h('header', { class: 'auth-header' }, [
    h('div', { class: 'auth-header__inner' }, [
      h('a', { href: '/pages/public/home.html', class: 'auth-header__back' }, '← ' + i18n.t('nav.back_to_site')),
      renderLangSwitch(i18n.lang)
    ])
  ]);

  const card = h('div', { class: 'auth-card' }, [
    h('div', { class: 'auth-card__head' }, [
      h('div', { class: 'auth-card__logo', 'aria-hidden': 'true' }, '✓'),
      h('h1', { class: 'auth-card__title' }, i18n.t('auth.verification_title')),
      h('p', { class: 'auth-card__subtitle' }, i18n.t('auth.verification_subtitle'))
    ]),
    h('div', { class: 'alert alert--info', role: 'note' }, [
      h('div', { class: 'alert__body' }, i18n.t('auth.verification_note'))
    ]),
    buildForm(),
    h('div', { id: 'result', class: 'verify-result' })
  ]);

  mountPage([header, h('main', { id: 'main-content', class: 'auth-main' }, [card])]);

  // Pré-remplir si ?ref= dans l'URL (scan QR)
  const refParam = getUrlParam('ref');
  if (refParam) {
    const refInput = document.querySelector('#reference');
    refInput.value = refParam;
    setTimeout(() => handleVerify(refParam), 300);
  }
}

function buildForm() {
  const form = h('form', {
    class: 'auth-form',
    novalidate: 'true',
    onsubmit: async (e) => {
      e.preventDefault();
      const ref = form.querySelector('#reference').value.trim();
      await handleVerify(ref);
    }
  });

  const refGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'reference' }, [
      document.createTextNode(i18n.t('auth.doc_reference')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    h('input', {
      type: 'text',
      id: 'reference',
      name: 'reference',
      class: 'form-control',
      required: 'true',
      placeholder: 'DOC-2026-00001',
      autocomplete: 'off',
      inputmode: 'text',
      'aria-describedby': 'reference-hint'
    }),
    h('span', { class: 'form-hint', id: 'reference-hint' }, i18n.t('auth.doc_reference_hint'))
  ]);

  const submitBtn = h('button', { type: 'submit', class: 'btn btn--primary btn--block btn--lg', id: 'verify-btn' },
    i18n.t('auth.verify_submit'));

  form.append(refGroup, submitBtn);
  return form;
}

async function handleVerify(reference) {
  const result = document.querySelector('#result');
  if (!result) return;
  result.innerHTML = '';

  if (!reference) {
    result.appendChild(renderError(i18n.t('validation.required')));
    return;
  }

  const submitBtn = document.querySelector('#verify-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = i18n.t('common.loading');

  result.appendChild(h('div', { class: 'loading-state', role: 'status' }, [
    h('div', { class: 'spinner' }),
    h('span', {}, i18n.t('common.loading'))
  ]));

  try {
    const res = await api.verifyDocument(reference);
    const data = res?.data;
    if (data && data.valide === true) {
      result.innerHTML = '';
      result.appendChild(renderValidCard(data));
    } else {
      result.innerHTML = '';
      result.appendChild(renderInvalidCard());
    }
  } catch (err) {
    result.innerHTML = '';
    if (err && err.status && err.isRateLimited && err.isRateLimited()) {
      result.appendChild(renderError(err.message));
    } else {
      result.appendChild(renderInvalidCard());
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = i18n.t('auth.verify_submit');
  }
}

function renderValidCard(doc) {
  const typeLabel = i18n.lang === 'ar' ? doc.type_ar : (i18n.lang === 'fr' ? doc.type_fr : (doc.type_en || doc.type_fr));
  const etablissement = i18n.lang === 'ar' ? doc.etablissement_ar : doc.etablissement_fr;

  return h('div', { class: 'verify-card verify-card--valid', role: 'status' }, [
    h('div', { class: 'verify-card__icon', 'aria-hidden': 'true', html: svgCheck() }),
    h('div', { class: 'verify-card__title' }, i18n.t('auth.valid_doc')),
    h('p', { class: 'verify-card__message' }, i18n.t('auth.valid_message')),
    h('dl', { class: 'verify-card__dl' }, [
      h('div', {}, [
        h('dt', {}, i18n.t('auth.doc_type')),
        h('dd', {}, typeLabel)
      ]),
      h('div', {}, [
        h('dt', {}, i18n.t('common.reference')),
        h('dd', { class: 'table__ref' }, doc.reference)
      ]),
      h('div', {}, [
        h('dt', {}, i18n.t('auth.issued_on')),
        h('dd', {}, formatDate(doc.genere_le))
      ]),
      h('div', {}, [
        h('dt', {}, i18n.t('auth.issued_by')),
        h('dd', {}, etablissement)
      ])
    ])
  ]);
}

function renderInvalidCard() {
  return h('div', { class: 'verify-card verify-card--invalid', role: 'alert' }, [
    h('div', { class: 'verify-card__icon', 'aria-hidden': 'true', html: svgCross() }),
    h('div', { class: 'verify-card__title' }, i18n.t('auth.invalid_doc')),
    h('p', { class: 'verify-card__message' }, i18n.t('auth.invalid_message'))
  ]);
}

function renderError(message) {
  return h('div', { class: 'alert alert--danger', role: 'alert' }, [
    h('div', { class: 'alert__body' }, message)
  ]);
}

function svgCheck() {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>`;
}
function svgCross() {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 9 6 6M15 9l-6 6"/></svg>`;
}

buildLayout();

const style = document.createElement('style');
style.textContent = `
  .auth-header { background: var(--c-surface); border-bottom: 1px solid var(--c-line); }
  .auth-header__inner { max-width: var(--container-wide); margin-inline: auto; padding: var(--sp-3) var(--sp-4); display: flex; align-items: center; justify-content: space-between; }
  .auth-header__back { color: var(--c-ink-soft); text-decoration: none; font-size: var(--fs-sm); }
  .auth-main { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); padding: var(--sp-6) var(--sp-4); }
  .auth-card { background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--r-xl); box-shadow: var(--sh-lg); max-width: 560px; width: 100%; padding: var(--sp-8); }
  .auth-card__head { text-align: center; margin-bottom: var(--sp-6); }
  .auth-card__logo { width: 56px; height: 56px; margin: 0 auto var(--sp-4); background: var(--c-success); color: white; border-radius: var(--r-pill); display: grid; place-items: center; font-size: var(--fs-lg); font-weight: var(--fw-bold); }
  .auth-card__title { font-size: var(--fs-xl); margin-bottom: var(--sp-2); }
  .auth-card__subtitle { color: var(--c-ink-soft); font-size: var(--fs-sm); }
  .verify-result { margin-top: var(--sp-6); }
  .verify-card { border: 1px solid var(--c-line); border-radius: var(--r-lg); padding: var(--sp-6); text-align: center; }
  .verify-card--valid { background: var(--c-success-bg); border-color: #A7F3D0; color: #065F46; }
  .verify-card--invalid { background: var(--c-danger-bg); border-color: #FECACA; color: #991B1B; }
  .verify-card__icon { color: inherit; display: flex; justify-content: center; margin-bottom: var(--sp-3); }
  .verify-card__title { font-size: var(--fs-md); font-weight: var(--fw-semibold); margin-bottom: var(--sp-2); }
  .verify-card__message { font-size: var(--fs-sm); color: inherit; margin-bottom: var(--sp-4); }
  .verify-card__dl { display: grid; gap: var(--sp-3); text-align: start; padding-top: var(--sp-4); border-top: 1px solid currentColor; border-top-color: rgba(0,0,0,0.1); }
  .verify-card__dl > div { display: grid; grid-template-columns: 1fr 2fr; gap: var(--sp-2); }
  .verify-card__dl dt { font-size: var(--fs-xs); color: inherit; opacity: 0.85; font-weight: var(--fw-medium); }
  .verify-card__dl dd { margin: 0; font-size: var(--fs-sm); font-weight: var(--fw-medium); }
`;
document.head.appendChild(style);
