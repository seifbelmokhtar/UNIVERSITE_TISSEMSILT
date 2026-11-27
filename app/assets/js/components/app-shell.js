/**
 * COMPOSANT : AppShell — layout authentifié (header + sidebar + main)
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { h } from '../core/dom.js';
import { renderLangSwitch } from './site-header.js';

const NAV_BY_ROLE = {
  etudiant: [
    { section: 'main', items: [
      { key: 'dashboard', href: '/pages/student/dashboard.html', label: 'nav.dashboard', icon: '⊞' },
      { key: 'services', href: '/pages/student/services.html', label: 'etu.services_catalog', icon: '▤' },
      { key: 'requests', href: '/pages/student/my-requests.html', label: 'etu.my_requests', icon: '✓' },
      { key: 'documents', href: '/pages/student/documents.html', label: 'etu.my_documents', icon: '▥' },
      { key: 'complaints', href: '/pages/student/new-complaint.html', label: 'etu.my_complaints', icon: '!' },
      { key: 'resources', href: '/pages/student/resources.html', label: 'etu.resources', icon: '○' }
    ]},
    { section: 'account', items: [
      { key: 'profile', href: '/pages/student/profile.html', label: 'nav.profile', icon: '◉' },
      { key: 'notifications', href: '/pages/student/notifications.html', label: 'nav.notifications', icon: '✉' },
      { key: 'settings', href: '/pages/student/settings.html', label: 'nav.settings', icon: '⚙' }
    ]}
  ],
  enseignant: [
    { section: 'main', items: [
      { key: 'dashboard', href: '/pages/teacher/dashboard.html', label: 'nav.dashboard', icon: '⊞' },
      { key: 'resources', href: '/pages/teacher/resources.html', label: 'ens.my_resources', icon: '○' },
      { key: 'announcements', href: '/pages/teacher/announcements.html', label: 'ens.my_announcements', icon: '✉' }
    ]},
    { section: 'account', items: [
      { key: 'profile', href: '/pages/teacher/dashboard.html', label: 'nav.profile', icon: '◉' },
      { key: 'settings', href: '/pages/teacher/dashboard.html', label: 'nav.settings', icon: '⚙' }
    ]}
  ],
  employe: [
    { section: 'main', items: [
      { key: 'dashboard', href: '/pages/employee/dashboard.html', label: 'nav.dashboard', icon: '⊞' },
      { key: 'queue', href: '/pages/employee/dashboard.html', label: 'emp.queue', icon: '▤' },
      { key: 'complaints', href: '/pages/employee/complaints.html', label: 'emp.complaints_queue', icon: '!' },
      { key: 'my-actions', href: '/pages/employee/my-actions.html', label: 'emp.my_actions', icon: '✓' },
      { key: 'health', href: '/pages/employee/health.html', label: 'emp.health_title', icon: '♥' }
    ]},
    { section: 'account', items: [
      { key: 'profile', href: '/pages/employee/dashboard.html', label: 'nav.profile', icon: '◉' },
      { key: 'settings', href: '/pages/employee/dashboard.html', label: 'nav.settings', icon: '⚙' }
    ]}
  ],
  admin: [
    { section: 'supervision', items: [
      { key: 'dashboard', href: '/pages/admin/dashboard.html', label: 'nav.dashboard', icon: '⊞' },
      { key: 'requests-supervision', href: '/pages/admin/requests-supervision.html', label: 'adm.requests_supervision', icon: '▤' },
      { key: 'activity-log', href: '/pages/admin/activity-log.html', label: 'adm.activity_log', icon: '📜' }
    ]},
    { section: 'configuration', items: [
      { key: 'accounts', href: '/pages/admin/accounts.html', label: 'adm.accounts', icon: '👤' },
      { key: 'structure', href: '/pages/admin/structure.html', label: 'adm.structure', icon: 'organize' },
      { key: 'services-config', href: '/pages/admin/services-config.html', label: 'adm.services_config', icon: '⚙' },
      { key: 'content', href: '/pages/admin/content.html', label: 'adm.content', icon: '✎' },
      { key: 'settings', href: '/pages/admin/settings.html', label: 'adm.settings', icon: '⚙' }
    ]}
  ]
};

export function renderAppShell({ role, activeKey = null, pageTitle = '', sidebarExtra = null, children = [] } = {}) {
  const user = api.currentUser;
  if (!user) return null;

  const roleLabel = i18n.t(`app.role.${role}`);
  const userName = i18n.lang === 'ar' ? `${user.prenom_ar || ''} ${user.nom_ar || ''}`.trim() : `${user.prenom || ''} ${user.nom || ''}`.trim();

  // Header
  const header = h('header', { class: 'app-header' }, [
    h('button', {
      class: 'app-header__burger',
      type: 'button',
      'aria-label': i18n.t('common.open'),
      'aria-controls': 'app-sidebar',
      onclick: () => {
        const sb = document.querySelector('.app-sidebar');
        sb?.classList.toggle('app-sidebar--mobile-open');
      }
    }, '☰'),
    h('span', { class: 'app-header__title' }, i18n.t('app.name')),
    h('span', { class: 'app-header__spacer' }),
    h('span', { class: `role-banner role-banner--${role}` }, roleLabel),
    renderLangSwitch(i18n.lang),
    h('button', {
      class: 'btn btn--ghost btn--sm',
      type: 'button',
      onclick: async () => {
        await api.logout();
        window.location.href = '/pages/public/home.html';
      }
    }, i18n.t('nav.logout'))
  ]);

  // Sidebar
  const navGroups = NAV_BY_ROLE[role] || [];
  const sidebarNav = h('nav', { 'aria-label': roleLabel, class: 'app-sidebar__nav' },
    navGroups.map((group) => h('div', { class: 'app-sidebar__section' }, [
      h('div', { class: 'app-sidebar__label' }, group.section === 'main' || group.section === 'supervision'
        ? i18n.t('common.actions')
        : group.section === 'configuration'
        ? i18n.t('adm.supervision')
        : i18n.t('nav.profile')),
      ...group.items.map((item) => h('a', {
        href: item.href,
        class: 'app-sidebar__link',
        ...(activeKey === item.key ? { 'aria-current': 'page' } : {})
      }, [
        h('span', { class: 'app-sidebar__icon', 'aria-hidden': 'true' }, item.icon),
        h('span', {}, i18n.t(item.label))
      ]))
    ]))
  );

  const sidebarContent = sidebarExtra ? [sidebarNav, sidebarExtra] : [sidebarNav];

  const sidebar = h('aside', { class: 'app-sidebar', id: 'app-sidebar' }, [
    h('div', { style: 'padding: var(--sp-3); border-bottom: 1px solid var(--c-line-soft); margin-bottom: var(--sp-2)' }, [
      h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); margin-bottom: var(--sp-1)' }, roleLabel),
      h('div', { style: 'font-size: var(--fs-sm); font-weight: var(--fw-semibold)' }, userName),
      user.service_nom_fr && role === 'employe'
        ? h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-soft); margin-top: var(--sp-1)' },
            i18n.lang === 'ar' ? user.service_nom_ar : user.service_nom_fr)
        : null
    ]),
    ...sidebarContent
  ]);

  // Main
  const main = h('main', { class: 'app-main', id: 'main-content' }, [
    pageTitle ? h('div', { class: 'page-header' }, [
      h('h1', { class: 'page-header__title' }, pageTitle)
    ]) : null,
    ...children
  ]);

  const shell = h('div', { class: 'app-shell' }, [
    header,
    sidebar,
    main
  ]);

  return shell;
}
