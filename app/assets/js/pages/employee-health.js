/**
 * PAGE : EMP-04 — Unité de santé (employé) — CRITIQUE — accès restreint
 * ------------------------------------------------------------------
 * requireRole: ['employe']. Vérifier api.currentUser.service_id === 25
 * sinon afficher écran "Accès refusé — Unité santé uniquement" (D-11).
 *
 * Affiche: liste demandes de santé, pour chaque demande bouton "Fixer RDV"
 * qui ouvre modal (date, heure, note) → POST /employe/sante/rendez-vous.
 *
 * Bandeau d'avertissement: "Données médicales sensibles — accès restreint
 * et journalisé (R-33)".
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState, statCard } from '../components/states.js';
import { setFieldError } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

const SANTE_SERVICE_ID = 25;

bootstrapPage({ title: i18n.t('emp.health_title'), requireAuth: true, requireRole: ['employe'] });

let allDemandes = [];

async function load() {
  const user = api.currentUser;

  // Vérification P3 : service_id === 25 uniquement
  if (!user || Number(user.service_id) !== SANTE_SERVICE_ID) {
    renderRestricted();
    return;
  }

  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'health',
    pageTitle: i18n.t('emp.health_title'),
    sidebarExtra: h('div', { class: 'app-sidebar__section' }, [
      h('div', { class: 'app-sidebar__label' }, i18n.t('emp.service_assigned')),
      h('div', { style: 'padding: var(--sp-3); background: var(--c-surface-alt); border-radius: var(--r-md); font-size: var(--fs-sm); font-weight: var(--fw-medium)' },
        i18n.lang === 'ar' ? 'الصحة الجامعية' : 'Santé')
    ]),
    children: [loadingState()]
  });
  mountPage(shell);

  try {
    // Filtrer les demandes du service santé (P2)
    const res = await api.get('/employe/demandes');
    allDemandes = (res?.data || []).filter((d) => Number(d.service_id) === SANTE_SERVICE_ID);
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

function renderRestricted() {
  // Afficher un shell minimal avec écran d'accès refusé
  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'health',
    pageTitle: i18n.t('emp.health_title'),
    children: []
  });
  mountPage(shell);

  const main = document.querySelector('#main-content');
  if (!main) return;
  main.appendChild(h('div', { class: 'alert alert--danger', role: 'alert', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'alert__body' }, [
      h('div', { class: 'alert__title' }, i18n.t('emp.health_restricted')),
      h('div', {}, i18n.t('emp.health_restricted_message'))
    ])
  ]));
  main.appendChild(emptyState({
    title: i18n.t('emp.health_restricted'),
    message: i18n.t('emp.health_restricted_message'),
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/employee/dashboard.html' },
      i18n.t('nav.dashboard'))
  }));
}

function renderView() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  // Bandeau d'avertissement R-33
  main.appendChild(h('div', { class: 'alert alert--warning', role: 'note', style: 'margin-bottom: var(--sp-6)' }, [
    h('div', { class: 'alert__body' }, i18n.t('emp.health_warning'))
  ]));

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('emp.health_intro')));

  // Stats rapides
  const pending = allDemandes.filter((d) => d.statut === 'Soumise' || d.statut === 'En attente de traitement').length;
  const inProgress = allDemandes.filter((d) => d.statut === 'En cours de vérification').length;
  main.appendChild(h('div', { class: 'grid grid--2', style: 'margin-bottom: var(--sp-6)' }, [
    statCard({ label: i18n.t('emp.pending_requests'), value: pending }),
    statCard({ label: i18n.t('emp.in_progress'), value: inProgress })
  ]));

  const section = h('section', { class: 'card' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.health_title'))]),
    h('div', { class: 'card__body', id: 'health-body' }, [])
  ]);
  main.appendChild(section);
  renderResults();
}

function renderResults() {
  const body = document.querySelector('#health-body');
  if (!body) return;
  const isAr = i18n.lang === 'ar';

  const list = [...allDemandes].sort((a, b) => new Date(b.soumise_le) - new Date(a.soumise_le));

  body.innerHTML = '';
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('emp.health_empty') }));
    return;
  }

  body.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('emp.health_table_ref')),
        h('th', {}, i18n.t('emp.health_table_student')),
        h('th', {}, i18n.t('emp.health_table_status')),
        h('th', {}, i18n.t('emp.health_table_date')),
        h('th', {}, i18n.t('emp.health_table_actions'))
      ])),
      h('tbody', {}, list.map((d) => {
        const studentName = isAr
          ? `${d.etudiant_prenom_ar || ''} ${d.etudiant_nom_ar || ''}`.trim()
          : `${d.etudiant_prenom || ''} ${d.etudiant_nom || ''}`.trim();
        return h('tr', {}, [
          h('td', { class: 'table__ref' }, d.reference),
          h('td', {}, studentName || `#${d.etudiant_id}`),
          h('td', {}, h('span', { class: `badge badge--${statusToBadge(d.statut)}` },
            i18n.t(`status.${d.statut}`) !== `status.${d.statut}` ? i18n.t(`status.${d.statut}`) : d.statut)),
          h('td', {}, formatDate(d.soumise_le)),
          h('td', {}, h('button', {
            class: 'btn btn--primary btn--sm',
            type: 'button',
            onclick: () => openAppointmentModal(d)
          }, i18n.t('emp.health_set_appointment')))
        ]);
      }))
    ])
  ]));
}

// --- Modal de prise de rendez-vous ---
function openAppointmentModal(demande) {
  const overlay = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': 'false',
    'aria-labelledby': 'rdv-modal-title'
  });

  const cancelBtn = h('button', { class: 'btn btn--secondary', type: 'button' }, i18n.t('common.cancel'));
  const submitBtn = h('button', { class: 'btn btn--primary', type: 'submit', form: 'rdv-form' },
    i18n.t('emp.health_rdv_submit'));

  // Date par défaut : demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const form = h('form', { id: 'rdv-form', novalidate: 'true' }, [
    h('div', { class: 'grid grid--2' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'rdv-date' }, [
          i18n.t('emp.health_rdv_date'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('input', {
          class: 'form-control', type: 'date', name: 'date_rdv', id: 'rdv-date',
          required: 'true', value: tomorrowStr, min: new Date().toISOString().slice(0, 10)
        })
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'rdv-time' }, [
          i18n.t('emp.health_rdv_time'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('input', {
          class: 'form-control', type: 'time', name: 'heure_rdv', id: 'rdv-time',
          required: 'true', value: '09:00'
        })
      ])
    ]),
    h('div', { class: 'form-group', style: 'margin-top: var(--sp-4)' }, [
      h('label', { class: 'form-label', for: 'rdv-note' }, i18n.t('emp.health_rdv_note')),
      h('textarea', {
        class: 'form-control', name: 'note', id: 'rdv-note', rows: '3'
      }, '')
    ])
  ]);

  const dialog = h('div', { class: 'modal__dialog' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title', id: 'rdv-modal-title' }, i18n.t('emp.health_set_appointment'))
    ]),
    h('div', { class: 'modal__body' }, [
      h('p', { style: 'margin: 0 0 var(--sp-4); color: var(--c-ink-muted); font-size: var(--fs-sm)' }, [
        h('strong', {}, demande.reference),
        ' — ',
        i18n.t('common.student'),
        ' #',
        demande.etudiant_id
      ]),
      form
    ]),
    h('div', { class: 'modal__footer' }, [cancelBtn, submitBtn])
  ]);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  // Focus auto sur le champ date
  setTimeout(() => form.querySelector('#rdv-date')?.focus(), 50);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateInput = form.querySelector('[name="date_rdv"]');
    const timeInput = form.querySelector('[name="heure_rdv"]');
    const date_rdv = dateInput.value;
    const heure_rdv = timeInput.value;

    let valid = true;
    if (!date_rdv) { setFieldError(dateInput, i18n.t('emp.health_rdv_date_required')); valid = false; }
    else { setFieldError(dateInput, null); }
    if (!heure_rdv) { setFieldError(timeInput, i18n.t('emp.health_rdv_time_required')); valid = false; }
    else { setFieldError(timeInput, null); }
    if (!valid) return;

    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = i18n.t('emp.health_rdv_submitting');

    try {
      await api.post('/employe/sante/rendez-vous', {
        demande_id: demande.id,
        date_rdv,
        heure_rdv
      });
      toastSuccess(i18n.t('emp.health_rdv_success'));
      close();
    } catch (err) {
      if (err instanceof ApiError && err.isForbidden()) {
        toastError(err.message || i18n.t('emp.health_restricted'));
      } else {
        toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      }
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });
}

load();
