/**
 * PAGE : ENS-00 — Tableau de bord enseignant
 * ------------------------------------------------------------------
 * R-40, R-43. Layout E2 (enseignant).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatSize } from '../core/dom.js';
import { statCard, loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('ens.dashboard_title'), requireAuth: true, requireRole: ['enseignant'] });

async function load() {
  const user = api.currentUser;
  const userName = i18n.lang === 'ar'
    ? `${user.prenom_ar || ''} ${user.nom_ar || ''}`.trim()
    : `${user.prenom || ''} ${user.nom || ''}`.trim();

  const shell = renderAppShell({
    role: 'enseignant',
    activeKey: 'dashboard',
    pageTitle: i18n.t('ens.welcome', { name: userName }),
    children: [
      h('div', { class: 'page-header__actions' }, [
        h('a', { href: '/pages/teacher/resource-form.html', class: 'btn btn--primary btn--sm' }, i18n.t('ens.publish_resource')),
        h('a', { href: '/pages/teacher/announcements.html', class: 'btn btn--secondary btn--sm' }, i18n.t('ens.publish_announcement'))
      ]),
      h('div', { class: 'grid grid--2', id: 'stats', style: 'margin-top: var(--sp-6)' }, [
        statCard({ label: i18n.t('ens.resources_count'), value: '—' }),
        statCard({ label: i18n.t('ens.announcements_count'), value: '—' })
      ]),
      h('section', { class: 'card', style: 'margin-top: var(--sp-6)' }, [
        h('div', { class: 'card__header' }, [
          h('h2', { class: 'card__title' }, i18n.t('ens.last_resources')),
          h('a', { href: '/pages/teacher/resources.html', class: 'btn btn--ghost btn--sm' }, i18n.t('ens.my_resources'))
        ]),
        h('div', { class: 'card__body', id: 'resources-body' }, loadingState())
      ])
    ]
  });

  mountPage(shell);

  try {
    const [statsRes, ressourcesRes] = await Promise.all([
      api.get('/enseignant/stats'),
      api.get('/enseignant/ressources')
    ]);
    const stats = statsRes?.data || {};
    const ressources = ressourcesRes?.data || [];

    const statsEl = document.querySelector('#stats');
    statsEl.innerHTML = '';
    statsEl.append(
      statCard({ label: i18n.t('ens.resources_count'), value: stats.ressources ?? 0 }),
      statCard({ label: i18n.t('ens.announcements_count'), value: stats.annonces ?? 0 })
    );

    const body = document.querySelector('#resources-body');
    body.innerHTML = '';
    if (ressources.length === 0) {
      body.append(emptyState({
        title: i18n.t('ens.no_resources'),
        action: h('a', { href: '/pages/teacher/resource-form.html', class: 'btn btn--secondary btn--sm' }, i18n.t('ens.publish_resource'))
      }));
      return;
    }
    body.append(h('div', { class: 'table-wrap' }, [
      h('table', { class: 'table' }, [
        h('thead', {}, h('tr', {}, [
          h('th', {}, i18n.t('common.title')),
          h('th', {}, i18n.t('common.type')),
          h('th', {}, i18n.t('common.date')),
          h('th', {}, i18n.t('common.size')),
          h('th', {}, i18n.t('common.actions'))
        ])),
        h('tbody', {}, ressources.map((r) => h('tr', {}, [
          h('td', {}, h('a', { href: `/pages/teacher/resource-form.html?id=${r.id}`, class: 'u-text-end' }, r.titre || r.titre_fr)),
          h('td', {}, h('span', { class: 'badge badge--neutral' }, r.type)),
          h('td', {}, formatDate(r.cree_le)),
          h('td', {}, formatSize(r.taille_octets)),
          h('td', {}, [
            h('a', { href: `/pages/teacher/resource-form.html?id=${r.id}`, class: 'btn btn--ghost btn--sm' }, i18n.t('common.edit')),
            h('a', { href: '/pages/teacher/resources.html', class: 'btn btn--ghost btn--sm', style: 'margin-inline-start: var(--sp-1)' }, i18n.t('common.view'))
          ])
        ])))
      ])
    ]));
  } catch (err) {
    document.querySelector('#resources-body').innerHTML = '';
    document.querySelector('#resources-body').append(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

load();
