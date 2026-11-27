/**
 * COMPOSANT : SiteHeader — en-tête public v2
 * Logo-mark SVG + nav underline + theme toggle
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { h } from '../core/dom.js';
import { initThemeToggle } from '../core/utils.js';

export function renderSiteHeader({ activeKey = null, compact = false } = {}) {
  const lang = i18n.lang;
  const isAuth = api.isAuthenticated;
  const user = api.currentUser;

  const navItems = [
    { key: 'home', href: '/pages/public/home.html', label: i18n.t('nav.home') },
    { key: 'faculties', href: '/pages/public/facultes.html', label: i18n.t('nav.faculties') },
    { key: 'news', href: '/pages/public/news.html', label: i18n.t('nav.news') },
    { key: 'announcements', href: '/pages/public/announcements.html', label: i18n.t('nav.announcements') },
    { key: 'services', href: '/pages/public/services.html', label: i18n.t('nav.services') },
    { key: 'links', href: '/pages/public/links.html', label: i18n.t('nav.links') }
  ];

  const brand = h('a', {
    href: '/pages/public/home.html',
    class: 'site-header__brand',
    'aria-label': i18n.t('app.name')
  }, [
    h('span', { class: 'logo-mark', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/></svg>' }),
    h('span', { class: 'site-header__title' }, [
      document.createTextNode(i18n.t('app.name')),
      h('small', {}, i18n.t('app.institution'))
    ])
  ]);

  const nav = h('nav', { class: 'site-header__nav', 'aria-label': 'principal' },
    navItems.map((item) => h('a', {
      href: item.href,
      class: 'site-header__link',
      ...(activeKey === item.key ? { 'aria-current': 'page' } : {})
    }, item.label))
  );

  const langSwitch = renderLangSwitch(lang);
  const themeToggle = h('button', {
    class: 'theme-toggle', type: 'button', 'aria-label': 'Toggle theme',
    'data-theme-toggle': 'true',
    html: '<span class="icon icon--sun"></span><span class="icon icon--moon"></span>'
  });

  const actions = h('div', { class: 'site-header__actions' }, [
    themeToggle,
    langSwitch,
    isAuth
      ? h('a', {
          href: getDashboardHref(user?.role),
          class: 'btn btn--primary btn--sm'
        }, [
          h('span', { class: 'icon icon--grid icon--sm' }),
          document.createTextNode(i18n.t('nav.dashboard'))
        ])
      : h('a', {
          href: '/pages/public/login.html',
          class: 'btn btn--secondary btn--sm',
          ...(activeKey === 'login' ? { 'aria-current': 'page' } : {})
        }, [
          h('span', { class: 'icon icon--login icon--sm' }),
          document.createTextNode(i18n.t('nav.login'))
        ])
  ]);

  const burger = h('button', {
    class: 'site-header__burger',
    type: 'button',
    'aria-label': i18n.t('common.open') + ' / ' + i18n.t('common.close'),
    'aria-expanded': 'false',
    'aria-controls': 'mobile-menu'
  }, [h('span', { class: 'icon icon--menu' })]);

  const header = h('header', { class: 'site-header' }, [
    h('div', { class: 'site-header__inner' }, [brand, nav, actions, burger])
  ]);

  // Mobile menu
  const mobileMenu = h('div', {
    class: 'mobile-menu',
    id: 'mobile-menu',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': 'true',
    'aria-label': i18n.t('common.actions')
  }, [
    h('div', { class: 'mobile-menu__panel' }, [
      h('div', { class: 'mobile-menu__header' }, [
        h('span', { class: 'site-header__title' }, i18n.t('app.name')),
        h('button', {
          class: 'mobile-menu__close',
          type: 'button',
          'aria-label': i18n.t('common.close'),
          html: '<span class="icon icon--x"></span>'
        })
      ]),
      ...navItems.map((item) => h('a', {
        href: item.href,
        class: 'mobile-menu__link',
        ...(activeKey === item.key ? { 'aria-current': 'page' } : {})
      }, item.label)),
      h('hr', { class: 'divider' }),
      h('a', { href: '/pages/public/verify.html', class: 'mobile-menu__link' }, [
        h('span', { class: 'icon icon--qr' }),
        document.createTextNode(i18n.t('nav.verify'))
      ]),
      isAuth
        ? h('a', { href: getDashboardHref(user?.role), class: 'mobile-menu__link' }, [
            h('span', { class: 'icon icon--grid' }),
            document.createTextNode(i18n.t('nav.dashboard'))
          ])
        : h('a', { href: '/pages/public/login.html', class: 'mobile-menu__link' }, [
            h('span', { class: 'icon icon--login' }),
            document.createTextNode(i18n.t('nav.login'))
          ])
    ])
  ]);

  // Wire menu toggle + theme toggle
  setTimeout(() => {
    const burgerBtn = header.querySelector('.site-header__burger');
    const closeBtn = mobileMenu.querySelector('.mobile-menu__close');
    const toggle = (open) => {
      mobileMenu.setAttribute('aria-hidden', String(!open));
      burgerBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burgerBtn?.addEventListener('click', () => toggle(mobileMenu.getAttribute('aria-hidden') === 'true'));
    closeBtn?.addEventListener('click', () => toggle(false));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') toggle(false);
    });
    // Init theme toggle
    initThemeToggle();
  }, 0);

  return [header, mobileMenu];
}

export function renderLangSwitch(currentLang) {
  const langs = [
    { code: 'ar', label: 'ع' },
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' }
  ];
  const switchEl = h('div', { class: 'lang-switch', role: 'group', 'aria-label': 'langue' },
    langs.map((l) => h('button', {
      type: 'button',
      class: 'lang-switch__btn',
      ...(l.code === currentLang ? { 'aria-current': 'true' } : {}),
      onclick: () => {
        i18n.setLang(l.code);
        window.location.reload();
      }
    }, l.label))
  );
  return switchEl;
}

function getDashboardHref(role) {
  const map = {
    etudiant: '/pages/student/dashboard.html',
    enseignant: '/pages/teacher/dashboard.html',
    employe: '/pages/employee/dashboard.html',
    admin: '/pages/admin/dashboard.html'
  };
  return map[role] || '/pages/public/login.html';
}
