/**
 * PAGE : PUB-14 — Connexion v2 (split-screen avec visual)
 * ------------------------------------------------------------------
 * Layout auth-layout: visual branding + form
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { h } from '../core/dom.js';
import { toast } from '../components/toast.js';
import { renderLangSwitch } from '../components/site-header.js';
import { initThemeToggle } from '../core/utils.js';

bootstrapPage({ title: i18n.t('auth.login_title') });

function buildLayout() {
  const isAr = i18n.lang === 'ar';

  // Visual side (left in LTR, right in RTL)
  const visual = h('aside', { class: 'auth-visual' }, [
    h('div', { class: 'auth-visual__content' }, [
      h('div', { class: 'auth-visual__brand' }, [
        h('span', { class: 'logo-mark logo-mark--lg', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>' }),
        h('div', {}, [
          h('div', { style: 'font-size: var(--fs-md); font-weight: var(--fw-bold)' },
            isAr ? 'سمارت كامبس دي زي' : 'Smart Campus DZ'),
          h('div', { style: 'font-size: var(--fs-xs); opacity: 0.7' },
            isAr ? 'المنصة الجزائرية الذكية للحياة الجامعية' : 'Smart Campus DZ')
        ])
      ]),
      h('div', {}, [
        h('h2', { class: 'auth-visual__title' },
          isAr ? 'فضاؤك الجامعي الموحد' : 'Votre espace universitaire unifié'),
        h('p', { class: 'auth-visual__subtitle' },
          isAr ? 'خدمات، طلبات، وثائق ومتابعة — في مكان واحد.'
          : 'Services, demandes, documents et suivi — au même endroit.')
      ]),
      h('ul', { class: 'auth-visual__features' }, [
        h('li', {}, [h('span', { class: 'icon icon--check-circle' }), document.createTextNode(isAr ? 'تتبع طلباتك لحظة بلحظة' : 'Suivez vos demandes en temps réel')]),
        h('li', {}, [h('span', { class: 'icon icon--file-check' }), document.createTextNode(isAr ? 'وثائق إدارية موثقة' : 'Documents administratifs authentifiés')]),
        h('li', {}, [h('span', { class: 'icon icon--shield-check' }), document.createTextNode(isAr ? 'تصديق عمومي بالـ QR' : 'Vérification publique par QR code')]),
        h('li', {}, [h('span', { class: 'icon icon--bell' }), document.createTextNode(isAr ? 'إشعارات فورية' : 'Notifications instantanées')])
      ])
    ])
  ]);

  // Content side
  const header = h('header', { class: 'auth-header' }, [
    h('a', { href: '/pages/public/home.html', class: 'auth-header__back' }, [
      h('span', { class: 'icon icon--arrow-right icon--sm' }),
      document.createTextNode(i18n.t('nav.back_to_site'))
    ]),
    h('div', { style: 'display: flex; gap: var(--sp-2); align-items: center' }, [
      h('button', {
        class: 'theme-toggle', type: 'button', 'aria-label': 'Toggle theme',
        'data-theme-toggle': 'true',
        html: '<span class="icon icon--sun"></span><span class="icon icon--moon"></span>'
      }),
      renderLangSwitch(i18n.lang)
    ])
  ]);

  const card = h('div', { class: 'auth-card' }, [
    h('div', { class: 'auth-card__head' }, [
      h('div', { class: 'logo-mark logo-mark--lg', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>' }),
      h('h1', { class: 'auth-card__title' }, i18n.t('auth.login_title')),
      h('p', { class: 'auth-card__subtitle' }, i18n.t('auth.login_subtitle'))
    ]),
    buildForm()
  ]);

  const footer = h('footer', { class: 'auth-footer' }, [i18n.t('footer.note')]);

  const content = h('div', { class: 'auth-content' }, [
    header,
    h('main', { id: 'main-content', class: 'auth-main' }, [card]),
    footer
  ]);

  mountPage([h('div', { class: 'auth-layout' }, [visual, content])]);

  setTimeout(() => initThemeToggle(), 0);
}

function buildForm() {
  const isAr = i18n.lang === 'ar';
  const form = h('form', {
    class: 'auth-form',
    novalidate: 'true',
    autocomplete: 'on',
    onsubmit: async (e) => {
      e.preventDefault();
      await handleSubmit(form);
    }
  });

  // Identifiant avec icône
  const idGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'identifier' }, [
      document.createTextNode(i18n.t('auth.identifier')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    h('div', { class: 'input-wrap' }, [
      h('input', {
        type: 'text',
        id: 'identifier',
        name: 'identifier',
        class: 'form-control',
        autocomplete: 'username',
        required: 'true',
        'aria-describedby': 'identifier-hint',
        placeholder: i18n.lang === 'ar' ? '222238464708' : 'matricule ou identifiant'
      }),
      h('span', { class: 'icon icon--user icon--sm' })
    ]),
    h('span', { class: 'form-hint', id: 'identifier-hint' }, i18n.t('auth.identifier_hint'))
  ]);

  // Password avec toggle visible
  const pwdGroup = h('div', { class: 'form-group' }, [
    h('label', { class: 'form-label', for: 'password' }, [
      document.createTextNode(i18n.t('auth.password')),
      h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
    ]),
    h('div', { class: 'input-wrap' }, [
      h('input', {
        type: 'password',
        id: 'password',
        name: 'password',
        class: 'form-control',
        autocomplete: 'current-password',
        required: 'true'
      }),
      h('button', {
        type: 'button',
        class: 'input-wrap__toggle',
        'aria-label': i18n.t('auth.show_password'),
        'aria-pressed': 'false',
        html: '<span class="icon icon--eye icon--sm"></span>',
        onclick: (e) => {
          const input = form.querySelector('#password');
          const isShown = input.type === 'text';
          input.type = isShown ? 'password' : 'text';
          e.currentTarget.setAttribute('aria-pressed', String(!isShown));
          e.currentTarget.innerHTML = isShown
            ? '<span class="icon icon--eye icon--sm"></span>'
            : '<span class="icon icon--eye-off icon--sm"></span>';
        }
      })
    ])
  ]);

  const errorAlert = h('div', { class: 'alert alert--danger', role: 'alert', style: 'display: none' });

  const submitBtn = h('button', {
    type: 'submit',
    class: 'btn btn--primary btn--block btn--lg',
    id: 'submit-btn'
  }, [
    document.createTextNode(i18n.t('auth.submit')),
    h('span', { class: 'icon icon--arrow-right icon--sm' })
  ]);

  const links = h('div', { class: 'auth-form__links', style: 'display: flex; flex-direction: column; gap: var(--sp-2); margin-top: var(--sp-5); text-align: center' }, [
    h('a', { href: '/pages/public/activate.html', class: 'btn-link', style: 'justify-content: center' }, i18n.t('auth.activate_link')),
    h('a', { href: '/pages/public/verify.html', class: 'btn-link', style: 'justify-content: center' }, i18n.t('nav.verify'))
  ]);

  const demoInfo = h('div', { class: 'alert alert--info', role: 'note', style: 'margin-top: var(--sp-6)' }, [
    h('span', { class: 'icon icon--info alert__icon' }),
    h('div', { class: 'alert__body' }, [
      h('div', { class: 'alert__title' }, isAr ? 'حسابات تجريبية' : 'Comptes de démonstration'),
      h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-soft); line-height: 1.6' }, [
        h('div', {}, 'Étudiant : 222238464708 / Etud20264708'),
        h('div', {}, 'Employé : emp.heb / employe2026'),
        h('div', {}, 'Admin : admin / admin2026'),
        h('div', {}, 'Enseignant : ens.kerdjoudj / enseignant2026')
      ])
    ])
  ]);

  form.appendChild(idGroup);
  form.appendChild(pwdGroup);
  form.appendChild(errorAlert);
  form.appendChild(submitBtn);
  form.appendChild(links);
  form.appendChild(demoInfo);

  return form;
}

async function handleSubmit(form) {
  const errorAlert = form.querySelector('.alert--danger');
  errorAlert.style.display = 'none';
  errorAlert.innerHTML = '';

  const idInput = form.querySelector('#identifier');
  const pwdInput = form.querySelector('#password');
  const submitBtn = form.querySelector('#submit-btn');

  const id = idInput.value.trim();
  const pwd = pwdInput.value;

  if (!id || !pwd) {
    showError(i18n.t('auth.invalid_credentials'));
    if (!id) idInput.setAttribute('aria-invalid', 'true');
    if (!pwd) pwdInput.setAttribute('aria-invalid', 'true');
    return;
  }

  idInput.setAttribute('aria-invalid', 'false');
  pwdInput.setAttribute('aria-invalid', 'false');

  submitBtn.disabled = true;
  const originalHTML = submitBtn.innerHTML;
  submitBtn.innerHTML = '';
  submitBtn.appendChild(h('span', { class: 'icon icon--spinner icon--sm spinning' }));
  submitBtn.appendChild(document.createTextNode(i18n.t('common.sending')));

  try {
    const res = await api.login(id, pwd);
    toast({ type: 'success', title: i18n.t('auth.welcome', { name: id }), message: '', duration: 2500 });

    const role = res.utilisateur?.role;
    const next = getUrlParam('next');
    const dashboards = {
      etudiant: '/pages/student/dashboard.html',
      enseignant: '/pages/teacher/dashboard.html',
      employe: '/pages/employee/dashboard.html',
      admin: '/pages/admin/dashboard.html'
    };
    const target = next && next.startsWith('/') ? next : (dashboards[role] || '/pages/public/home.html');
    setTimeout(() => { window.location.href = target; }, 600);
  } catch (err) {
    if (err && err.status) {
      if (err.isAuth && err.isAuth()) {
        showError(i18n.t('auth.invalid_credentials'));
      } else if (err.code === 'account_not_active') {
        showError(i18n.t('auth.account_not_active'));
        setTimeout(() => { window.location.href = '/pages/public/activate.html'; }, 1500);
      } else if (err.code === 'account_disabled') {
        showError(i18n.t('auth.account_disabled'));
      } else if (err.isRateLimited && err.isRateLimited()) {
        showError(err.message);
      } else {
        showError(err.message || i18n.t('common.error'));
      }
    } else {
      showError(i18n.t('common.error'));
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

function showError(message) {
  const form = document.querySelector('.auth-form');
  if (!form) return;
  const alert = form.querySelector('.alert--danger');
  alert.innerHTML = '';
  alert.appendChild(h('span', { class: 'icon icon--alert alert__icon' }));
  alert.appendChild(h('div', { class: 'alert__body' }, [message]));
  alert.style.display = 'flex';
}

buildLayout();
