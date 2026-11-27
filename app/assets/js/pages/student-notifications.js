/**
 * PAGE : ETU-12 — Centre de notifications (étudiant)
 * ------------------------------------------------------------------
 * Liste les notifications, badge non-lu. Bouton "Tout marquer lu".
 * Clic sur une notif → marquer lu + naviguer vers page cible.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.notifications_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'notifications',
    pageTitle: i18n.t('etu.notifications_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/notifications');
    renderNotifications(res?.data || []);
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

function renderNotifications(notifs) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.notifications_intro')));

  const unreadCount = notifs.filter((n) => !n.lu).length;
  const actions = h('div', {
    class: 'page-header__actions',
    style: 'margin-bottom: var(--sp-6); display: flex; gap: var(--sp-3); flex-wrap: wrap'
  }, [
    unreadCount > 0
      ? h('button', {
          class: 'btn btn--secondary', type: 'button', id: 'mark-all-btn',
          onclick: async () => {
            const btn = document.querySelector('#mark-all-btn');
            if (btn) { btn.disabled = true; btn.textContent = i18n.t('common.sending'); }
            try {
              await api.post('/etudiant/notifications/read-all', {});
              toastSuccess(i18n.t('etu.notifications_mark_all'));
              setTimeout(() => window.location.reload(), 600);
            } catch (err) {
              toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
              if (btn) { btn.disabled = false; btn.textContent = i18n.t('etu.notifications_mark_all'); }
            }
          }
        }, i18n.t('etu.notifications_mark_all'))
      : null
  ]);
  main.appendChild(actions);

  if (!notifs.length) {
    main.appendChild(emptyState({ message: i18n.t('etu.notifications_empty') }));
    return;
  }

  // Trier par date desc
  const list = [...notifs].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));

  const list_ = h('ul', { class: 'notif-list', style: 'list-style: none; padding: 0; margin: 0; display: grid; gap: var(--sp-3)' });
  for (const n of list) {
    const titre = isAr ? (n.titre_ar || n.titre_fr) : (n.titre_fr || n.titre_ar);
    const contenu = isAr ? (n.contenu_ar || n.contenu_fr) : (n.contenu_fr || n.contenu_ar);
    const item = h('li', {}, [
      h('a', {
        class: `card card--pad${n.lu ? '' : ' card--hover'}`,
        href: '#',
        style: `text-decoration: none; color: inherit; display: flex; gap: var(--sp-4); align-items: flex-start; ${n.lu ? 'opacity: 0.75' : 'border-inline-start: 4px solid var(--c-accent)'}`,
        onclick: async (ev) => {
          ev.preventDefault();
          if (!n.lu) {
            try { await api.patch(`/etudiant/notifications/${n.id}`, { lu: true }); }
            catch (_) {}
          }
          window.location.href = targetFor(n);
        }
      }, [
        h('div', {
          class: 'notif__icon',
          'aria-hidden': 'true',
          style: 'width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; background: var(--c-surface-alt); display: grid; place-items: center; font-size: 18px'
        }, iconFor(n.type)),
        h('div', { style: 'flex: 1; min-width: 0' }, [
          h('div', { style: 'display: flex; gap: var(--sp-2); align-items: center; justify-content: space-between' }, [
            h('div', { style: 'font-weight: var(--fw-semibold); font-size: var(--fs-sm)' }, titre || '—'),
            n.lu ? null : h('span', { class: 'badge badge--accent', style: 'font-size: 10px' },
              i18n.t('etu.notifications_unread_badge'))
          ]),
          h('div', { style: 'color: var(--c-ink-soft); font-size: var(--fs-sm); margin-top: var(--sp-1)' },
            contenu || ''),
          h('div', { style: 'color: var(--c-ink-muted); font-size: var(--fs-xs); margin-top: var(--sp-2)' },
            formatDateTime(n.cree_le))
        ])
      ])
    ]);
    list_.appendChild(item);
  }
  main.appendChild(list_);
}

function iconFor(type) {
  if (type === 'changement_statut') return '⊕';
  if (type === 'complement') return '!';
  if (type === 'decision') return '✓';
  if (type === 'reclamation') return '!';
  return '✉';
}

function targetFor(n) {
  if (n.entite_type === 'demande') return `/pages/student/request-detail.html?id=${n.entite_id}`;
  if (n.entite_type === 'document') return `/pages/student/documents.html`;
  if (n.entite_type === 'reclamation') return `/pages/student/complaint-detail.html?id=${n.entite_id}`;
  return '/pages/student/notifications.html';
}

load();
