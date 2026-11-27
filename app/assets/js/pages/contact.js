/**
 * PAGE : PUB-12 — Contact
 * ------------------------------------------------------------------
 * Affiche : coordonnées de l'institution (GET /public/institution),
 * carte statique (placeholder div), formulaire de contact (nom, email,
 * sujet, message) avec validation + soumission simulée (toast success).
 * Aucun envoi réel — message "Formulaire de démonstration".
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';
import { toast } from '../components/toast.js';

bootstrapPage({ title: i18n.t('nav.contact') });

async function load() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: null });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-8)' }, [
    h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, i18n.t('public.contact_title')),
      h('p', { class: 'page-header__subtitle' }, i18n.t('public.contact_demo_note'))
    ]),
    loadingState()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  try {
    const res = await api.get('/public/institution');
    const inst = res?.data || {};
    const loader = main.querySelector('.loading-state');
    if (loader) loader.remove();

    main.appendChild(h('div', { class: 'grid grid--2', style: 'margin-bottom: var(--sp-8)' }, [
      renderContactInfo(inst),
      renderMap()
    ]));

    main.appendChild(renderFormSection());
  } catch (err) {
    const loader = main.querySelector('.loading-state');
    if (loader) loader.replaceWith(emptyState({ message: err.message || i18n.t('common.error') }));
    else main.appendChild(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderContactInfo(inst) {
  const isAr = i18n.lang === 'ar';
  const adresse = isAr ? (inst.adresse_ar || inst.adresse_fr) : (inst.adresse_fr || inst.adresse_ar);
  const rows = [
    { label: i18n.t('public.contact_address'), value: adresse, icon: '📍' },
    { label: i18n.t('public.contact_phone'), value: inst.telephone, icon: '📞' },
    { label: i18n.t('public.contact_email'), value: inst.email, icon: '✉️' }
  ];
  return h('article', { class: 'card card--pad' }, [
    h('h2', { style: 'font-size: var(--fs-md); margin: 0 0 var(--sp-4)' },
      isAr ? 'معلومات الاتصال' : 'Coordonnées'),
    h('ul', { class: 'contact-info-list' }, rows.map((r) => h('li', { class: 'contact-info-item' }, [
      h('span', { class: 'contact-info-item__icon', 'aria-hidden': 'true' }, r.icon),
      h('div', { class: 'contact-info-item__body' }, [
        h('div', { class: 'contact-info-item__label' }, r.label),
        h('div', { class: 'contact-info-item__value' }, r.value || '—')
      ])
    ])))
  ]);
}

function renderMap() {
  return h('article', { class: 'card contact-map', 'aria-labelledby': 'contact-map-title' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { id: 'contact-map-title', class: 'card__title' }, i18n.t('public.contact_map_title'))
    ]),
    h('div', { class: 'contact-map__body', 'aria-label': i18n.t('public.contact_map_title') }, [
      h('div', { class: 'contact-map__placeholder' }, [
        h('div', { class: 'contact-map__pin', 'aria-hidden': 'true' }, '📍'),
        h('div', { class: 'contact-map__label' }, i18n.t('public.contact_map_demo'))
      ])
    ])
  ]);
}

function renderFormSection() {
  return h('section', { class: 'contact-form-section', 'aria-labelledby': 'contact-form-title' }, [
    h('h2', { id: 'contact-form-title', class: 'contact-form-section__title' },
      i18n.t('public.contact_form_title')),
    h('p', { class: 'contact-form-section__subtitle' },
      i18n.t('public.contact_form_subtitle')),
    h('div', { class: 'alert alert--info', role: 'note', style: 'margin-bottom: var(--sp-5)' }, [
      h('div', { class: 'alert__body' }, i18n.t('public.contact_form_demo_note'))
    ]),
    buildForm()
  ]);
}

function buildForm() {
  const form = h('form', {
    class: 'contact-form',
    novalidate: 'true',
    onsubmit: async (e) => {
      e.preventDefault();
      handleSubmit(form);
    }
  }, []);

  const nameGroup = formGroup({
    id: 'cf-name',
    label: i18n.t('public.contact_form_name'),
    required: true,
    input: h('input', {
      type: 'text',
      id: 'cf-name',
      name: 'name',
      class: 'form-control',
      autocomplete: 'name',
      required: 'true',
      'aria-required': 'true',
      'aria-describedby': 'cf-name-error'
    })
  });

  const emailGroup = formGroup({
    id: 'cf-email',
    label: i18n.t('public.contact_form_email'),
    required: true,
    input: h('input', {
      type: 'email',
      id: 'cf-email',
      name: 'email',
      class: 'form-control',
      autocomplete: 'email',
      required: 'true',
      'aria-required': 'true',
      'aria-describedby': 'cf-email-error',
      placeholder: i18n.lang === 'ar' ? 'exemple@domaine.dz' : 'example@domain.dz'
    })
  });

  const subjectGroup = formGroup({
    id: 'cf-subject',
    label: i18n.t('public.contact_form_subject'),
    required: true,
    input: h('input', {
      type: 'text',
      id: 'cf-subject',
      name: 'subject',
      class: 'form-control',
      required: 'true',
      'aria-required': 'true',
      'aria-describedby': 'cf-subject-error'
    })
  });

  const messageGroup = formGroup({
    id: 'cf-message',
    label: i18n.t('public.contact_form_message'),
    required: true,
    input: h('textarea', {
      id: 'cf-message',
      name: 'message',
      class: 'form-control',
      required: 'true',
      'aria-required': 'true',
      'aria-describedby': 'cf-message-error',
      rows: '6',
      minlength: '10'
    })
  });

  const submitBtn = h('button', {
    type: 'submit',
    class: 'btn btn--primary btn--lg',
    id: 'cf-submit'
  }, i18n.t('public.contact_form_submit'));

  form.appendChild(h('div', { class: 'form-row form-row--2' }, [nameGroup, emailGroup]));
  form.appendChild(subjectGroup);
  form.appendChild(messageGroup);
  form.appendChild(h('div', { class: 'form-actions form-actions--end' }, [submitBtn]));

  return form;
}

function formGroup({ id, label, required, input }) {
  return h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: id }, [
      document.createTextNode(label),
      required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null
    ]),
    input,
    h('span', { class: 'form-error', id: `${id}-error`, role: 'alert', style: 'display: none' })
  ]);
}

function handleSubmit(form) {
  // Réinitialiser les erreurs
  form.querySelectorAll('.form-error').forEach((el) => { el.style.display = 'none'; el.textContent = ''; });
  form.querySelectorAll('.form-control').forEach((el) => el.removeAttribute('aria-invalid'));

  const name = form.querySelector('#cf-name');
  const email = form.querySelector('#cf-email');
  const subject = form.querySelector('#cf-subject');
  const message = form.querySelector('#cf-message');
  const submitBtn = form.querySelector('#cf-submit');

  let hasError = false;

  if (!name.value.trim()) {
    showError(name, i18n.t('validation.required'));
    hasError = true;
  }
  if (!email.value.trim()) {
    showError(email, i18n.t('validation.required'));
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, i18n.t('validation.email'));
    hasError = true;
  }
  if (!subject.value.trim()) {
    showError(subject, i18n.t('validation.required'));
    hasError = true;
  }
  if (!message.value.trim()) {
    showError(message, i18n.t('validation.required'));
    hasError = true;
  } else if (message.value.trim().length < 10) {
    showError(message, i18n.t('validation.min_length', { n: 10 }));
    hasError = true;
  }

  if (hasError) return;

  // Soumission simulée — aucun envoi réel
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = i18n.t('common.sending');

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    form.reset();
    toast({
      type: 'success',
      title: i18n.t('toast.sent'),
      message: i18n.t('public.contact_form_success'),
      duration: 4000
    });
  }, 700);
}

function showError(input, message) {
  input.setAttribute('aria-invalid', 'true');
  const errId = `${input.id}-error`;
  const errEl = document.getElementById(errId);
  if (errEl) {
    errEl.textContent = message;
    errEl.style.display = 'block';
  }
}

load();

const style = document.createElement('style');
style.textContent = `
  .contact-info-list { list-style: none; padding: 0; margin: 0; }
  .contact-info-item {
    display: flex; gap: var(--sp-3); align-items: flex-start;
    padding: var(--sp-3) 0; border-bottom: 1px solid var(--c-line-soft);
  }
  .contact-info-item:last-child { border-bottom: 0; }
  .contact-info-item__icon { width: 36px; height: 36px; display: grid; place-items: center; background: var(--c-surface-alt); border-radius: var(--r-md); flex-shrink: 0; font-size: var(--fs-md); }
  .contact-info-item__label { font-size: var(--fs-xs); color: var(--c-ink-muted); margin-bottom: var(--sp-1); }
  .contact-info-item__value { font-size: var(--fs-sm); color: var(--c-ink); word-break: break-word; }

  .contact-map { overflow: hidden; }
  .contact-map__body {
    min-height: 240px;
    background: var(--c-surface-alt);
    background-image:
      linear-gradient(0deg, var(--c-line-soft) 1px, transparent 1px),
      linear-gradient(90deg, var(--c-line-soft) 1px, transparent 1px);
    background-size: 32px 32px;
    display: grid;
    place-items: center;
    padding: var(--sp-6);
  }
  .contact-map__placeholder { text-align: center; }
  .contact-map__pin { font-size: var(--fs-3xl); margin-bottom: var(--sp-2); }
  .contact-map__label { font-size: var(--fs-sm); color: var(--c-ink-muted); max-width: 30ch; margin-inline: auto; }

  .contact-form-section { margin-top: var(--sp-8); }
  .contact-form-section__title { font-size: var(--fs-lg); margin-bottom: var(--sp-2); padding-block-end: var(--sp-2); border-block-end: 2px solid var(--c-line-strong); }
  .contact-form-section__subtitle { color: var(--c-ink-soft); font-size: var(--fs-sm); margin-bottom: var(--sp-5); }
`;
document.head.appendChild(style);
