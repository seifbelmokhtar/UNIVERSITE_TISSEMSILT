/**
 * PAGE : EMP-00 — Tableau de bord employé (espace de traitement)
 * ------------------------------------------------------------------
 * R-22 (filtrage par service), A-04 (un seul service), R-55 (journal).
 * Layout E3 (employé). Liste filtrée par service_id.
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, statusToBadge } from '../core/dom.js';
import { statCard, loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('emp.dashboard_title'), requireAuth: true, requireRole: ['employe'] });

async function load() {
  const user = api.currentUser;
  const userName = i18n.lang === 'ar'
    ? `${user.prenom_ar || ''} ${user.nom_ar || ''}`.trim()
    : `${user.prenom || ''} ${user.nom || ''}`.trim();
  const serviceName = i18n.lang === 'ar' ? user.service_nom_ar : user.service_nom_fr;

  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'dashboard',
    pageTitle: i18n.t('emp.welcome', { name: userName }),
    sidebarExtra: h('div', { class: 'app-sidebar__section' }, [
      h('div', { class: 'app-sidebar__label' }, i18n.t('emp.service_assigned')),
      h('div', { style: 'padding: var(--sp-3); background: var(--c-surface-alt); border-radius: var(--r-md); font-size: var(--fs-sm); font-weight: var(--fw-medium)' }, serviceName || '—')
    ]),
    children: [
      h('div', { class: 'alert alert--info', role: 'note' }, [
        h('div', { class: 'alert__body' }, i18n.lang === 'ar'
          ? `أنت مفوّض لمعالجة طلبات خدمة: ${serviceName}. لا يمكنك الوصول إلى طلبات خدمات أخرى.`
          : `Vous êtes autorisé à traiter les demandes du service: ${serviceName}. Vous ne pouvez pas accéder aux demandes d'autres services.`)
      ]),
      h('div', { class: 'grid grid--4', id: 'stats', style: 'margin-top: var(--sp-6)' }, [
        statCard({ label: i18n.t('emp.pending_requests'), value: '—' }),
        statCard({ label: i18n.t('emp.in_progress'), value: '—' }),
        statCard({ label: i18n.t('emp.awaiting_complement'), value: '—' }),
        statCard({ label: i18n.t('emp.processed_today'), value: '—' })
      ]),
      h('section', { class: 'card', id: 'queue-card', style: 'margin-top: var(--sp-6)' }, [
        h('div', { class: 'card__header' }, [
          h('h2', { class: 'card__title' }, i18n.t('emp.queue')),
          h('div', { style: 'display: flex; gap: var(--sp-2)' }, [
            h('select', {
              class: 'form-control', id: 'filter-status', style: 'width: auto; font-size: var(--fs-xs)',
              onchange: () => applyFilter()
            }, [
              h('option', { value: 'all' }, i18n.t('common.all')),
              h('option', { value: 'Soumise' }, i18n.t('status.Soumise')),
              h('option', { value: 'En attente de traitement' }, i18n.t('status.En attente de traitement')),
              h('option', { value: 'En cours de vérification' }, i18n.t('status.En cours de vérification')),
              h('option', { value: 'En attente de complément' }, i18n.t('status.En attente de complément'))
            ])
          ])
        ]),
        h('div', { class: 'card__body', id: 'queue-body' }, loadingState())
      ])
    ]
  });

  mountPage(shell);

  try {
    const [statsRes, demandesRes] = await Promise.all([
      api.get('/employe/stats'),
      api.get('/employe/demandes')
    ]);

    const stats = statsRes?.data || {};
    const statsEl = document.querySelector('#stats');
    statsEl.innerHTML = '';
    statsEl.append(
      statCard({ label: i18n.t('emp.pending_requests'), value: stats.pending ?? 0 }),
      statCard({ label: i18n.t('emp.in_progress'), value: stats.in_progress ?? 0 }),
      statCard({ label: i18n.t('emp.awaiting_complement'), value: stats.complement ?? 0 }),
      statCard({ label: i18n.t('emp.processed_today'), value: stats.processed_today ?? 0 })
    );

    const demandes = demandesRes?.data || [];
    window.__ut_queue = demandes;
    applyFilter();
  } catch (err) {
    document.querySelector('#queue-body').innerHTML = '';
    document.querySelector('#queue-body').append(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function applyFilter() {
  const filter = document.querySelector('#filter-status').value;
  const all = window.__ut_queue || [];
  const list = filter === 'all' ? all : all.filter((d) => d.statut === filter);
  renderQueue(list);
}

function renderQueue(demandes) {
  const body = document.querySelector('#queue-body');
  body.innerHTML = '';
  if (demandes.length === 0) {
    body.append(emptyState({ message: i18n.t('common.no_results') }));
    return;
  }
  const isAr = i18n.lang === 'ar';
  body.append(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.reference')),
        h('th', {}, i18n.t('common.student')),
        h('th', {}, i18n.t('common.status')),
        h('th', {}, i18n.t('common.date')),
        h('th', {}, i18n.t('common.actions'))
      ])),
      h('tbody', {}, demandes.map((d) => h('tr', {}, [
        h('td', { class: 'table__ref' }, d.reference),
        h('td', {}, isAr ? `${d.etudiant_prenom_ar} ${d.etudiant_nom_ar}` : `${d.etudiant_prenom} ${d.etudiant_nom}`),
        h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` }, i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
        h('td', {}, formatDate(d.soumise_le)),
        h('td', {}, h('a', { href: `/pages/employee/request-processing.html?id=${d.id}`, class: 'btn btn--ghost btn--sm' }, i18n.t('common.process')))
      ])))
    ])
  ]));
}

load();
