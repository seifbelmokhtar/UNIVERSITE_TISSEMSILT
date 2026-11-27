/**
 * PAGE : EMP-03 — Traitement des réclamations (employé)
 * ------------------------------------------------------------------
 * Liste des réclamations du service (table: Réf, Étudiant, Description
 * courte, Statut, Date, Action "Traiter").
 * Détail en modal: description complète + fil de réponses + formulaire
 * de réponse (textarea) → POST /employe/reclamations/reponses/{id}.
 * Boutons "Marquer résolue" / "Rejeter" (après au moins 1 réponse) →
 * PATCH /employe/reclamations/{id}.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime, formatDate, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { setFieldError } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('emp.complaints_title'), requireAuth: true, requireRole: ['employe'] });

let allComplaints = [];

async function load() {
  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'complaints',
    pageTitle: i18n.t('emp.complaints_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/employe/reclamations');
    allComplaints = res?.data || [];
    renderView();
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

function renderView() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('emp.complaints_intro')));

  const section = h('section', { class: 'card' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.complaints_title'))]),
    h('div', { class: 'card__body', id: 'complaints-body' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

function renderResults() {
  const body = document.querySelector('#complaints-body');
  if (!body) return;
  const isAr = i18n.lang === 'ar';

  const list = [...allComplaints].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));

  body.innerHTML = '';
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('emp.complaints_empty') }));
    return;
  }

  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('emp.complaints_table_ref')),
        h('th', {}, i18n.t('emp.complaints_table_student')),
        h('th', {}, i18n.t('emp.complaints_table_description')),
        h('th', {}, i18n.t('emp.complaints_table_status')),
        h('th', {}, i18n.t('emp.complaints_table_date')),
        h('th', {}, i18n.t('emp.complaints_table_actions'))
      ])),
      h('tbody', {}, list.map((r) => h('tr', {}, [
        h('td', { class: 'table__ref' }, r.reference),
        h('td', {}, `${i18n.t('common.student')} #${r.etudiant_id || '—'}`),
        h('td', {}, truncate(r.description || '', 60)),
        h('td', {}, h('span', { class: `badge badge--${statusToBadge(r.statut)}` },
          i18n.t(`status.${r.statut}`) !== `status.${r.statut}` ? i18n.t(`status.${r.statut}`) : r.statut)),
        h('td', {}, formatDate(r.cree_le)),
        h('td', {}, h('button', {
          class: 'btn btn--ghost btn--sm',
          type: 'button',
          onclick: () => openComplaintModal(r)
        }, i18n.t('common.process')))
      ])))
    ])
  ]));
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// --- Modal de détail ---
function openComplaintModal(complaint) {
  // Recharger la réclamation complète (avec réponses) depuis l'API
  api.get(`/employe/reclamations/${encodeURIComponent(complaint.id)}`)
    .then((res) => {
      const rec = res?.data || complaint;
      renderComplaintModal(rec);
    })
    .catch((err) => {
      if (err instanceof ApiError && (err.isNotFound() || err.isForbidden())) {
        toastError(i18n.t('emp.complaint_not_found'));
      } else {
        toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      }
    });
}

function renderComplaintModal(rec) {
  const overlay = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': 'false',
    'aria-labelledby': 'complaint-modal-title'
  });

  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');

  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 640px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title', id: 'complaint-modal-title' }, rec.reference || i18n.t('emp.complaint_detail_title')),
      closeBtn
    ]),
    h('div', { class: 'modal__body' }, [
      // Carte info
      h('div', { class: 'grid grid--2', style: 'margin-bottom: var(--sp-4)' }, [
        infoRow(i18n.t('common.reference'), rec.reference),
        infoRow(i18n.t('common.student'), `${i18n.t('common.student')} #${rec.etudiant_id || '—'}`),
        infoRow(i18n.t('common.status'),
          h('span', { class: `badge badge--${statusToBadge(rec.statut)}` },
            i18n.t(`status.${rec.statut}`) !== `status.${rec.statut}` ? i18n.t(`status.${rec.statut}`) : rec.statut)),
        infoRow(i18n.t('common.date'), formatDateTime(rec.cree_le))
      ]),

      // Description
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label' }, i18n.t('emp.complaint_description')),
        h('div', {
          class: 'form-control',
          style: 'background: var(--c-surface-alt); cursor: default; white-space: pre-wrap; min-height: 80px'
        }, rec.description || '—')
      ]),

      // Réponses
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label' }, i18n.t('emp.complaint_responses')),
        h('div', { id: 'responses-list', style: 'display: flex; flex-direction: column; gap: var(--sp-2)' },
          renderResponses(rec))
      ]),

      // Formulaire de réponse (uniquement si la réclamation n'est pas encore résolue/rejetée)
      rec.statut !== 'Résolue' && rec.statut !== 'Rejetée' ? h('form', { id: 'reply-form', novalidate: 'true' }, [
        h('div', { class: 'form-group', style: 'margin: 0' }, [
          h('label', { class: 'form-label', for: 'reply-contenu' }, [
            i18n.t('emp.complaint_reply'),
            h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
          ]),
          h('textarea', {
            class: 'form-control', name: 'contenu', id: 'reply-contenu', rows: '3',
            required: 'true',
            placeholder: i18n.t('emp.complaint_reply_placeholder')
          }, '')
        ])
      ]) : null
    ]),
    h('div', { class: 'modal__footer' }, renderModalFooter(rec))
  ]);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  // Reply form
  const replyForm = dialog.querySelector('#reply-form');
  if (replyForm) {
    replyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const contenu = replyForm.querySelector('[name="contenu"]').value.trim();
      const input = replyForm.querySelector('[name="contenu"]');
      if (!contenu) {
        setFieldError(input, i18n.t('emp.complaint_reply_required'));
        return;
      }
      // Submit button is in footer — find it
      const submitBtn = dialog.querySelector('[data-action="reply"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        const original = submitBtn.textContent;
        submitBtn.textContent = i18n.t('common.sending');
        try {
          await api.post(`/employe/reclamations/reponses/${encodeURIComponent(rec.id)}`, { contenu });
          toastSuccess(i18n.t('emp.complaint_reply_success'));
          close();
          // Recharger la liste
          try {
            const res = await api.get('/employe/reclamations');
            allComplaints = res?.data || [];
            renderResults();
            // Reopen modal avec données fraîches
            const fresh = allComplaints.find((r) => r.id === rec.id);
            if (fresh) openComplaintModal(fresh);
          } catch (_) { /* ignore */ }
        } catch (err) {
          if (err instanceof ApiError && err.isValidation()) {
            toastError(err.message || i18n.t('emp.complaint_reply_required'));
          } else {
            toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
          }
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
      }
    });
  }

  // Resolve / reject buttons
  dialog.querySelectorAll('[data-action="resolve"], [data-action="reject"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const newStatut = action === 'reject' ? 'Rejetée' : 'Résolue';
      if (!confirm(i18n.t('emp.complaint_close_confirm'))) return;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = i18n.t('common.saving');
      try {
        await api.patch(`/employe/reclamations/${encodeURIComponent(rec.id)}`, { statut: newStatut });
        toastSuccess(action === 'reject'
          ? i18n.t('emp.complaint_reject_success')
          : i18n.t('emp.complaint_resolve_success'));
        close();
        try {
          const res = await api.get('/employe/reclamations');
          allComplaints = res?.data || [];
          renderResults();
        } catch (_) { /* ignore */ }
      } catch (err) {
        if (err instanceof ApiError && err.isConflict()) {
          toastError(err.message || i18n.t('emp.complaint_close_required_response'));
        } else {
          toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
        }
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  });
}

function renderResponses(rec) {
  const responses = rec.reponses || [];
  if (!responses.length) {
    return [h('p', { style: 'color: var(--c-ink-muted); margin: 0; font-size: var(--fs-sm)' },
      i18n.t('emp.complaint_no_responses'))];
  }
  return responses.map((r) => h('div', {
    class: 'card card--pad',
    style: 'background: var(--c-surface-alt); padding: var(--sp-3)'
  }, [
    h('div', { style: 'display: flex; justify-content: space-between; gap: var(--sp-2); align-items: center; margin-bottom: var(--sp-1)' }, [
      h('span', { style: 'font-size: var(--fs-xs); font-weight: var(--fw-medium)' },
        `${i18n.t('common.employee')} #${r.auteur_id || '—'}`),
      h('span', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted)' },
        formatDateTime(r.cree_le))
    ]),
    h('p', { style: 'margin: 0; color: var(--c-ink-soft); white-space: pre-wrap; font-size: var(--fs-sm)' },
      r.contenu)
  ]));
}

function renderModalFooter(rec) {
  const buttons = [];
  // Si la réclamation est encore ouverte → boutons reply / resolve / reject
  if (rec.statut !== 'Résolue' && rec.statut !== 'Rejetée') {
    buttons.push(h('button', {
      class: 'btn btn--primary',
      type: 'submit',
      form: 'reply-form',
      'data-action': 'reply'
    }, i18n.t('common.reply')));
    // Resolve / reject nécessitent au moins 1 réponse (CHECK serveur — R-48)
    const hasResponse = (rec.reponses && rec.reponses.length > 0);
    buttons.push(h('button', {
      class: 'btn btn--secondary',
      type: 'button',
      'data-action': 'resolve',
      disabled: hasResponse ? null : 'true',
      title: hasResponse ? '' : i18n.t('emp.complaint_close_required_response')
    }, i18n.t('emp.complaint_resolve')));
    buttons.push(h('button', {
      class: 'btn btn--danger',
      type: 'button',
      'data-action': 'reject',
      disabled: hasResponse ? null : 'true',
      title: hasResponse ? '' : i18n.t('emp.complaint_close_required_response')
    }, i18n.t('emp.complaint_reject')));
  }
  buttons.push(h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => {
    const overlay = document.querySelector('.modal');
    if (overlay) overlay.remove();
  } }, i18n.t('common.close')));
  return buttons;
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      typeof value === 'string' ? (value || '—') : value)
  ]);
}

load();
