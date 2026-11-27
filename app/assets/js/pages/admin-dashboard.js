/**
 * PAGE : ADM-00 — Tableau de bord administrateur (supervision)
 * ------------------------------------------------------------------
 * R-54 (supervision), R-55 (journal), Layout E4 (admin).
 * Vue d'ensemble + statistiques + activité récente.
 * Pas d'actions de traitement — seulement lecture (P5).
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { statCard, loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('adm.dashboard_title'), requireAuth: true, requireRole: ['admin'] });

async function load() {
  const user = api.currentUser;
  const userName = i18n.lang === 'ar'
    ? `${user.prenom_ar || ''} ${user.nom_ar || ''}`.trim()
    : `${user.prenom || ''} ${user.nom || ''}`.trim();

  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'dashboard',
    pageTitle: i18n.t('adm.welcome', { name: userName }),
    children: [
      h('div', { class: 'page-header__actions' }, [
        h('a', { href: '/pages/admin/accounts.html', class: 'btn btn--secondary btn--sm' }, i18n.t('adm.accounts')),
        h('a', { href: '/pages/admin/structure.html', class: 'btn btn--secondary btn--sm' }, i18n.t('adm.structure')),
        h('a', { href: '/pages/admin/services-config.html', class: 'btn btn--secondary btn--sm' }, i18n.t('adm.services_config')),
        h('a', { href: '/pages/admin/content.html', class: 'btn btn--secondary btn--sm' }, i18n.t('adm.content')),
        h('a', { href: '/pages/admin/settings.html', class: 'btn btn--secondary btn--sm' }, i18n.t('adm.settings'))
      ]),
      h('h2', { style: 'margin-top: var(--sp-8); margin-bottom: var(--sp-4); font-size: var(--fs-lg)' }, i18n.t('adm.stats_overview')),
      h('div', { class: 'grid grid--4', id: 'stats' }, [
        statCard({ label: i18n.t('adm.stats_total_requests'), value: '—' }),
        statCard({ label: i18n.t('adm.stats_active_accounts'), value: '—' }),
        statCard({ label: i18n.t('adm.stats_pending_requests'), value: '—' }),
        statCard({ label: i18n.t('adm.stats_processed_today'), value: '—' })
      ]),
      h('div', { class: 'grid grid--2', style: 'margin-top: var(--sp-6)' }, [
        h('section', { class: 'card' }, [
          h('div', { class: 'card__header' }, [
            h('h2', { class: 'card__title' }, i18n.t('adm.stats_by_service'))
          ]),
          h('div', { class: 'card__body', id: 'by-service' }, loadingState())
        ]),
        h('section', { class: 'card' }, [
          h('div', { class: 'card__header' }, [
            h('h2', { class: 'card__title' }, i18n.t('adm.stats_by_status'))
          ]),
          h('div', { class: 'card__body', id: 'by-status' }, loadingState())
        ])
      ]),
      h('section', { class: 'card', style: 'margin-top: var(--sp-6)' }, [
        h('div', { class: 'card__header' }, [
          h('h2', { class: 'card__title' }, i18n.t('adm.recent_activity')),
          h('a', { href: '/pages/admin/activity-log.html', class: 'btn btn--ghost btn--sm' }, i18n.t('adm.activity_log'))
        ]),
        h('div', { class: 'card__body', id: 'journal-body' }, loadingState())
      ])
    ]
  });

  mountPage(shell);

  try {
    const [statsRes, journalRes] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/journal')
    ]);
    const stats = statsRes?.data || {};
    const journal = journalRes?.data || [];

    const statsEl = document.querySelector('#stats');
    statsEl.innerHTML = '';
    statsEl.append(
      statCard({ label: i18n.t('adm.stats_total_requests'), value: stats.total_demandes ?? 0 }),
      statCard({ label: i18n.t('adm.stats_active_accounts'), value: stats.active_accounts ?? 0 }),
      statCard({ label: i18n.t('adm.stats_pending_requests'), value: stats.pending_requests ?? 0 }),
      statCard({ label: i18n.t('adm.stats_processed_today'), value: stats.processed_today ?? 0 })
    );

    renderByService(stats.by_service || []);
    renderByStatus(stats.by_status || []);
    renderJournal(journal);
  } catch (err) {
    ['#by-service', '#by-status', '#journal-body'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) { el.innerHTML = ''; el.append(emptyState({ message: err.message || i18n.t('common.error') })); }
    });
  }
}

function renderByService(items) {
  const el = document.querySelector('#by-service');
  el.innerHTML = '';
  if (!items.length) { el.append(emptyState({ message: i18n.t('common.empty') })); return; }
  const max = Math.max(...items.map((x) => x.count));
  el.append(h('div', { class: 'bar-list' }, items.map((it) => {
    const pct = max > 0 ? Math.round((it.count / max) * 100) : 0;
    return h('div', { class: 'bar-list__item' }, [
      h('div', { class: 'bar-list__label' }, it.service || it.code),
      h('div', { class: 'bar-list__bar' }, h('div', { class: 'bar-list__fill', style: `width: ${pct}%` })),
      h('div', { class: 'bar-list__value' }, String(it.count))
    ]);
  })));
}

function renderByStatus(items) {
  const el = document.querySelector('#by-status');
  el.innerHTML = '';
  if (!items.length) { el.append(emptyState({ message: i18n.t('common.empty') })); return; }
  const max = Math.max(...items.map((x) => x.count));
  el.append(h('div', { class: 'bar-list' }, items.map((it) => {
    const pct = max > 0 ? Math.round((it.count / max) * 100) : 0;
    const label = i18n.t(`status.${it.statut}`) !== `status.${it.statut}` ? i18n.t(`status.${it.statut}`) : it.statut;
    return h('div', { class: 'bar-list__item' }, [
      h('div', { class: 'bar-list__label' }, label),
      h('div', { class: 'bar-list__bar' }, h('div', { class: 'bar-list__fill', style: `width: ${pct}%` })),
      h('div', { class: 'bar-list__value' }, String(it.count))
    ]);
  })));
}

function renderJournal(items) {
  const el = document.querySelector('#journal-body');
  el.innerHTML = '';
  if (!items.length) { el.append(emptyState({ message: i18n.t('common.empty') })); return; }
  el.append(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.lang === 'ar' ? 'الفاعل' : 'Acteur'),
        h('th', {}, i18n.lang === 'ar' ? 'الإجراء' : 'Action'),
        h('th', {}, i18n.lang === 'ar' ? 'الكيان' : 'Entité'),
        h('th', {}, i18n.lang === 'ar' ? 'التفاصيل' : 'Détails'),
        h('th', {}, i18n.lang === 'ar' ? 'الوقت' : 'Date')
      ])),
      h('tbody', {}, items.slice(0, 10).map((j) => h('tr', {}, [
        h('td', { class: 'table__ref' }, `#${j.utilisateur_id}`),
        h('td', {}, h('span', { class: 'badge badge--neutral' }, j.action)),
        h('td', {}, j.entite + (j.entite_id ? ` #${j.entite_id}` : '')),
        h('td', {}, j.details || '—'),
        h('td', {}, formatDateTime(j.cree_le))
      ])))
    ])
  ]));
}

load();

const style = document.createElement('style');
style.textContent = `
  .bar-list { display: grid; gap: var(--sp-3); }
  .bar-list__item { display: grid; grid-template-columns: 1fr 2fr auto; gap: var(--sp-3); align-items: center; }
  .bar-list__label { font-size: var(--fs-sm); color: var(--c-ink-soft); }
  .bar-list__bar { background: var(--c-surface-alt); border-radius: var(--r-sm); height: 8px; overflow: hidden; }
  .bar-list__fill { background: var(--c-ink); height: 100%; border-radius: var(--r-sm); transition: width var(--t-slow); }
  .bar-list__value { font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--c-ink); }
`;
document.head.appendChild(style);
