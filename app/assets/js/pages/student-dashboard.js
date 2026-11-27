/**
 * PAGE : ETU-00 — Tableau de bord étudiant
 * ------------------------------------------------------------------
 * R-02, R-08, R-49. Layout E1 (étudiant).
 * Affiche : profil + 5 services + compteurs (demandes actives, notifications,
 * documents disponibles, annonces pédagogiques) + demandes récentes.
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, statusToBadge } from '../core/dom.js';
import { statCard, loadingState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('etu.dashboard_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const user = api.currentUser;
  const userName = i18n.lang === 'ar'
    ? `${user.prenom_ar || ''} ${user.nom_ar || ''}`.trim()
    : `${user.prenom || ''} ${user.nom || ''}`.trim();

  // Pré-construire le shell avec un squelette
  const skeleton = h('div', { class: 'grid grid--4' }, [
    h('div', { class: 'skeleton', style: 'height: 110px' }),
    h('div', { class: 'skeleton', style: 'height: 110px' }),
    h('div', { class: 'skeleton', style: 'height: 110px' }),
    h('div', { class: 'skeleton', style: 'height: 110px' })
  ]);

  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'dashboard',
    pageTitle: i18n.t('etu.welcome', { name: userName }),
    children: [
      renderProfileCard(user),
      h('div', { class: 'grid grid--4', id: 'stats', style: 'margin-top: var(--sp-6)' }, [
        statCard({ label: i18n.t('etu.active_requests'), value: '—' }),
        statCard({ label: i18n.t('etu.available_documents'), value: '—' }),
        statCard({ label: i18n.t('etu.unread_notifications'), value: '—' }),
        statCard({ label: i18n.t('etu.pedagogical_announcements'), value: '—' })
      ]),
      h('div', { class: 'grid', id: 'lists', style: 'margin-top: var(--sp-6); grid-template-columns: 1fr' }, [
        loadingState()
      ])
    ]
  });

  mountPage(shell);

  // Chargement async des données
  try {
    const [demandesRes, notifRes, docsRes] = await Promise.all([
      api.get('/etudiant/demandes'),
      api.get('/etudiant/notifications'),
      api.get('/etudiant/documents')
    ]);

    const demandes = demandesRes?.data || [];
    const notifs = notifRes?.data || [];
    const docs = docsRes?.data || [];

    const activeCount = demandes.filter((d) => !['Acceptée', 'Refusée', 'Clôturée'].includes(d.statut)).length;
    const unreadCount = notifs.filter((n) => !n.lu).length;

    // MAJ compteurs
    const statsEl = document.querySelector('#stats');
    statsEl.innerHTML = '';
    statsEl.append(
      statCard({ label: i18n.t('etu.active_requests'), value: activeCount }),
      statCard({ label: i18n.t('etu.available_documents'), value: docs.length }),
      statCard({ label: i18n.t('etu.unread_notifications'), value: unreadCount }),
      statCard({ label: i18n.t('etu.pedagogical_announcements'), value: 0 })
    );

    // Section demandes récentes + actions rapides
    const listsEl = document.querySelector('#lists');
    listsEl.innerHTML = '';

    listsEl.append(
      h('div', { class: 'card' }, [
        h('div', { class: 'card__header' }, [
          h('h2', { class: 'card__title' }, i18n.t('etu.recent_requests')),
          h('a', { href: '/pages/student/dashboard.html', class: 'btn btn--ghost btn--sm' }, i18n.t('etu.view_all'))
        ]),
        h('div', { class: 'card__body' }, [
          demandes.length
            ? renderDemandesTable(demandes.slice(0, 5))
            : emptyState({
                title: i18n.t('etu.no_active_requests'),
                message: i18n.t('etu.no_active_requests_hint'),
                action: h('a', { href: '/pages/public/services.html', class: 'btn btn--secondary btn--sm' }, i18n.t('etu.browse_services'))
              })
        ])
      ])
    );

  } catch (err) {
    const listsEl = document.querySelector('#lists');
    listsEl.innerHTML = '';
    listsEl.append(emptyState({ message: err.message || i18n.t('common.error') }));
  }
}

function renderProfileCard(user) {
  const isAr = i18n.lang === 'ar';
  return h('section', { class: 'card card--pad', 'aria-label': i18n.t('etu.profile_card') }, [
    h('div', { style: 'display: flex; align-items: center; gap: var(--sp-4); flex-wrap: wrap' }, [
      h('div', {
        class: 'profile-avatar', 'aria-hidden': 'true'
      }, initials(user)),
      h('div', { style: 'flex: 1; min-width: 200px' }, [
        h('div', { style: 'font-size: var(--fs-md); font-weight: var(--fw-semibold)' },
          (isAr ? `${user.prenom_ar} ${user.nom_ar}` : `${user.prenom} ${user.nom}`)),
        h('div', { style: 'font-size: var(--fs-sm); color: var(--c-ink-muted); margin-top: var(--sp-1)' },
          i18n.t('app.role.etudiant')),
        h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); font-family: var(--font-mono); margin-top: var(--sp-1)' },
          user.identifiant)
      ]),
      h('div', { class: 'profile-academic' }, [
        user.faculte_ar ? h('div', { class: 'profile-academic__row' }, [
          h('span', { class: 'profile-academic__label' }, i18n.t('etu.faculty')),
          h('span', { class: 'profile-academic__value' }, isAr ? user.faculte_ar : user.faculte_fr)
        ]) : null,
        user.departement_ar ? h('div', { class: 'profile-academic__row' }, [
          h('span', { class: 'profile-academic__label' }, i18n.t('etu.department')),
          h('span', { class: 'profile-academic__value' }, isAr ? user.departement_ar : user.departement_fr)
        ]) : null,
        user.specialite_ar ? h('div', { class: 'profile-academic__row' }, [
          h('span', { class: 'profile-academic__label' }, i18n.t('etu.specialty')),
          h('span', { class: 'profile-academic__value' }, isAr ? user.specialite_ar : user.specialite_fr)
        ]) : null,
        user.annee_etude ? h('div', { class: 'profile-academic__row' }, [
          h('span', { class: 'profile-academic__label' }, i18n.t('etu.year')),
          h('span', { class: 'profile-academic__value' }, user.annee_etude)
        ]) : null
      ])
    ])
  ]);
}

function initials(user) {
  const isAr = i18n.lang === 'ar';
  const prenom = (isAr ? user.prenom_ar : user.prenom) || '';
  const nom = (isAr ? user.nom_ar : user.nom) || '';
  return ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
}

function renderDemandesTable(demandes) {
  if (demandes.length === 0) return emptyState({ message: i18n.t('common.empty') });
  const isAr = i18n.lang === 'ar';
  return h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.reference')),
        h('th', {}, i18n.t('common.service')),
        h('th', {}, i18n.t('common.status')),
        h('th', {}, i18n.t('common.date')),
        h('th', {}, i18n.t('common.actions'))
      ])),
      h('tbody', {}, demandes.map((d) => h('tr', {}, [
        h('td', { class: 'table__ref' }, d.reference),
        h('td', {}, isAr ? (d.service_nom_ar || d.service_nom_fr) : (d.service_nom_fr || d.service_nom_ar)),
        h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` }, i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
        h('td', {}, formatDate(d.soumise_le)),
        h('td', {}, h('a', { href: `/pages/student/dashboard.html?dem=${d.id}`, class: 'btn btn--ghost btn--sm' }, i18n.t('common.view')))
      ])))
    ])
  ]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--c-ink); color: var(--c-primary-ink); display: grid; place-items: center; font-size: var(--fs-md); font-weight: var(--fw-semibold); flex-shrink: 0; }
  .profile-academic { display: grid; gap: var(--sp-2); min-width: 240px; }
  .profile-academic__row { display: flex; flex-direction: column; gap: 2px; }
  .profile-academic__label { font-size: var(--fs-xs); color: var(--c-ink-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .profile-academic__value { font-size: var(--fs-sm); font-weight: var(--fw-medium); }
  @media (max-width: 768px) {
    .profile-academic { width: 100%; }
  }
`;
document.head.appendChild(style);
