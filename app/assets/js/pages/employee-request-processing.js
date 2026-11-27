/**
 * PAGE : EMP-01 — Traitement d'une demande (employé) — CRITIQUE
 * ------------------------------------------------------------------
 * Lit ?id=X. Affiche:
 *  - Carte info demande (réf, étudiant, service, statut badge, date)
 *  - Timeline historique
 *  - Section pièces jointes (mock)
 *  - Section messages/observations
 *  - Zone d'actions (varie selon statut — R-19 transitions T1-T9)
 *
 * Actions:
 *  - Soumise / En attente de traitement → ouverture, complement (motif),
 *    transfert (select service cible)
 *  - En cours de vérification → acceptation, refus (motif required),
 *    complement, observation
 *  - En attente de complément → observation uniquement
 *  - Acceptée → cloture
 *  - Refusée → cloture
 *
 * Chaque action → PATCH /employe/demandes/action/{id} → toast + reload.
 * Gère 409 (transition invalide) proprement + 403 (hors service).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { setFieldError } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('emp.processing_title'), requireAuth: true, requireRole: ['employe'] });

let currentDemande = null;
let allServices = [];

async function load() {
  const id = getUrlParam('id');
  const shell = renderAppShell({
    role: 'employe',
    activeKey: 'queue',
    pageTitle: i18n.t('emp.processing_title'),
    children: [loadingState()]
  });
  mountPage(shell);

  if (!id) {
    renderNotFound();
    return;
  }

  try {
    // Charger services (pour le transfert) en parallèle
    const [demRes, svcRes] = await Promise.all([
      api.get(`/employe/demandes/${encodeURIComponent(id)}`),
      api.get('/public/services')
    ]);
    currentDemande = demRes?.data;
    allServices = (svcRes?.data || []).filter((s) => s.actif);
    if (!currentDemande) {
      renderNotFound();
      return;
    }
    renderDemande(currentDemande);
  } catch (err) {
    if (err instanceof ApiError && err.isForbidden()) {
      renderForbidden();
    } else if (err instanceof ApiError && err.isNotFound()) {
      renderNotFound();
    } else {
      setError(err);
    }
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

function renderNotFound() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('emp.request_not_found'),
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/employee/dashboard.html' },
      i18n.t('emp.queue'))
  }));
}

function renderForbidden() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('emp.request_forbidden'),
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/employee/dashboard.html' },
      i18n.t('emp.queue'))
  }));
}

function renderDemande(dem) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  // MAJ titre
  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = `${i18n.t('emp.processing_title')} — ${dem.reference}`;

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  const serviceName = isAr
    ? (dem.service_nom_ar || dem.service_nom_fr || dem.document_type_ar || dem.document_type_fr)
    : (dem.service_nom_fr || dem.service_nom_ar || dem.document_type_fr || dem.document_type_ar);
  const studentName = isAr
    ? `${dem.etudiant_prenom_ar || ''} ${dem.etudiant_nom_ar || ''}`.trim()
    : `${dem.etudiant_prenom || ''} ${dem.etudiant_nom || ''}`.trim();

  // Carte info demande
  main.appendChild(h('section', { class: 'card card--pad', 'aria-label': i18n.t('emp.request_info') }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.request_info'))]),
    h('div', { class: 'grid grid--2' }, [
      infoRow(i18n.t('common.reference'), dem.reference),
      infoRow(i18n.t('common.student'), studentName || '—'),
      infoRow(i18n.t('common.service'), serviceName || '—'),
      infoRow(i18n.t('common.status'),
        h('span', { class: `badge badge--${statusToBadge(dem.statut)}` },
          i18n.t(`status.${dem.statut}`) !== `status.${dem.statut}` ? i18n.t(`status.${dem.statut}`) : dem.statut)),
      infoRow(i18n.t('common.date'), formatDateTime(dem.soumise_le))
    ])
  ]));

  // Timeline historique
  const historique = dem.historique || [];
  const tlSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.timeline_title'))]),
    h('div', { class: 'card__body' }, [])
  ]);
  const tlBody = tlSection.querySelector('.card__body');
  if (historique.length) {
    const isCurrent = (idx) => idx === historique.length - 1;
    const modifier = (event, idx) => {
      if (event.statut === 'Acceptée' || event.statut === 'Clôturée') return 'success';
      if (event.statut === 'Refusée') return 'danger';
      if (isCurrent(idx)) return 'current';
      return '';
    };
    tlBody.appendChild(h('ol', { class: 'timeline', style: 'list-style: none; padding: 0; margin: 0' },
      historique.map((event, idx) => {
        const mod = modifier(event, idx);
        return h('li', {
          class: `timeline__item ${mod ? `timeline__item--${mod}` : ''}`
        }, [
          h('div', { class: 'timeline__label' },
            i18n.t(`status.${event.statut}`) !== `status.${event.statut}` ? i18n.t(`status.${event.statut}`) : event.statut),
          h('div', { class: 'timeline__meta' }, [
            labelAction(event.action),
            ' · ',
            formatDateTime(event.date)
          ]),
          event.note ? h('div', { class: 'timeline__note' }, event.note) : null
        ]);
      })
    ));
  } else {
    tlBody.appendChild(emptyState({ message: i18n.t('common.empty') }));
  }
  main.appendChild(tlSection);

  // Pièces jointes (mock)
  const attSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.attachments_title'))]),
    h('div', { class: 'card__body' }, [])
  ]);
  const attBody = attSection.querySelector('.card__body');
  const mockAttachments = dem.pieces || [
    { nom: `piece-jointe-1.pdf`, taille: 245000 },
    { nom: `justificatif.jpg`, taille: 880000 }
  ];
  if (mockAttachments.length) {
    attBody.appendChild(h('ul', { class: 'file-list' },
      mockAttachments.map((p) => h('li', { class: 'file-list__item' }, [
        h('span', { class: 'file-list__name' }, p.nom),
        h('span', { class: 'file-list__size' }, formatSizeLocal(p.taille)),
        h('span', { class: 'badge badge--neutral', style: 'font-size: 10px' }, 'PDF')
      ]))
    ));
  } else {
    attBody.appendChild(emptyState({ message: i18n.t('emp.attachments_empty') }));
  }
  main.appendChild(attSection);

  // Messages / observations
  const obsSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.messages_title'))]),
    h('div', { class: 'card__body' }, [
      emptyState({ message: i18n.t('emp.messages_empty') })
    ])
  ]);
  main.appendChild(obsSection);

  // Zone d'actions
  main.appendChild(renderActionsPanel(dem));
}

function renderActionsPanel(dem) {
  const statut = dem.statut;
  const actions = availableActionsFor(statut);

  const section = h('section', {
    class: 'card card--pad',
    style: 'margin-top: var(--sp-6); border-inline-start: 4px solid var(--c-accent)',
    'aria-label': i18n.t('emp.actions_title')
  }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('emp.actions_title'))]),
    h('div', { class: 'card__body', id: 'actions-body' }, [])
  ]);
  const body = section.querySelector('#actions-body');

  if (statut === 'En attente de complément') {
    body.appendChild(h('div', { class: 'alert alert--info', role: 'note' }, [
      h('div', { class: 'alert__body' }, i18n.t('emp.complement_awaiting_student'))
    ]));
  }
  if (statut === 'Clôturée') {
    body.appendChild(h('div', { class: 'alert alert--info', role: 'note' }, [
      h('div', { class: 'alert__body' }, i18n.t('emp.action_already_closed'))
    ]));
  }

  if (!actions.length) {
    body.appendChild(h('p', { style: 'color: var(--c-ink-muted); margin: var(--sp-3) 0 0' },
      i18n.t('emp.no_actions_available')));
    return section;
  }

  const btnRow = h('div', { class: 'form-actions', style: 'gap: var(--sp-3); flex-wrap: wrap' },
    actions.map((a) => h('button', {
      class: `btn ${a.variant === 'danger' ? 'btn--danger' : (a.variant === 'primary' ? 'btn--primary' : 'btn--secondary')} btn--sm`,
      type: 'button',
      'data-action': a.action,
      onclick: () => openActionModal(dem, a)
    }, a.label))
  );
  body.appendChild(btnRow);

  return section;
}

function availableActionsFor(statut) {
  const all = [];
  if (statut === 'Soumise' || statut === 'En attente de traitement') {
    all.push(
      { action: 'ouverture', label: i18n.t('emp.action_open'), variant: 'primary' },
      { action: 'complement', label: i18n.t('emp.action_complement'), variant: 'secondary' },
      { action: 'transfert', label: i18n.t('emp.action_transfer'), variant: 'secondary' }
    );
  }
  if (statut === 'En cours de vérification') {
    all.push(
      { action: 'acceptation', label: i18n.t('emp.action_accept'), variant: 'primary' },
      { action: 'refus', label: i18n.t('emp.action_refuse'), variant: 'danger' },
      { action: 'complement', label: i18n.t('emp.action_complement'), variant: 'secondary' },
      { action: 'observation', label: i18n.t('emp.action_observe'), variant: 'secondary' }
    );
  }
  if (statut === 'En attente de complément') {
    all.push(
      { action: 'observation', label: i18n.t('emp.action_observe'), variant: 'secondary' }
    );
  }
  if (statut === 'Acceptée' || statut === 'Refusée') {
    all.push(
      { action: 'cloture', label: i18n.t('emp.action_close'), variant: 'primary' }
    );
  }
  return all;
}

// --- Modal d'action ---
function openActionModal(dem, action) {
  const overlay = h('div', {
    class: 'modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-hidden': 'false',
    'aria-labelledby': 'action-modal-title'
  });

  const cancelBtn = h('button', { class: 'btn btn--secondary', type: 'button' }, i18n.t('emp.action_cancel'));
  const submitBtn = h('button', {
    class: `btn ${action.variant === 'danger' ? 'btn--danger' : 'btn--primary'}`,
    type: 'button'
  }, i18n.t('emp.action_submit'));

  // Construire le corps selon l'action
  let bodyContent = [];
  let formEl = null; // Uniquement si l'action nécessite des champs

  if (action.action === 'refus') {
    formEl = h('form', { id: 'action-form', novalidate: 'true' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'motif' }, [
          i18n.t('emp.action_motif'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('textarea', {
          class: 'form-control', name: 'motif', id: 'motif', rows: '4',
          required: 'true',
          placeholder: i18n.t('emp.action_motif_placeholder')
        }, '')
      ])
    ]);
    bodyContent = [formEl];
  } else if (action.action === 'observation') {
    formEl = h('form', { id: 'action-form', novalidate: 'true' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'observation' }, i18n.t('emp.action_observation')),
        h('textarea', {
          class: 'form-control', name: 'observation', id: 'observation', rows: '4',
          placeholder: i18n.t('emp.action_observation_placeholder')
        }, '')
      ])
    ]);
    bodyContent = [formEl];
  } else if (action.action === 'complement') {
    formEl = h('form', { id: 'action-form', novalidate: 'true' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'complement_motif' }, [
          i18n.t('emp.action_complement_motif'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('textarea', {
          class: 'form-control', name: 'complement_motif', id: 'complement_motif', rows: '4',
          required: 'true',
          placeholder: i18n.t('emp.action_complement_placeholder')
        }, '')
      ])
    ]);
    bodyContent = [formEl];
  } else if (action.action === 'transfert') {
    const otherServices = allServices.filter((s) => s.id !== dem.service_id);
    formEl = h('form', { id: 'action-form', novalidate: 'true' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'service_cible_id' }, [
          i18n.t('emp.transfer_target'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('select', { class: 'form-control', name: 'service_cible_id', id: 'service_cible_id', required: 'true' }, [
          h('option', { value: '' }, i18n.t('emp.transfer_target_placeholder')),
          ...otherServices.map((s) => h('option', { value: String(s.id) },
            i18n.lang === 'ar' ? (s.nom_ar || s.nom_fr) : (s.nom_fr || s.nom_ar)))
        ])
      ])
    ]);
    bodyContent = [formEl];
  } else {
    // Actions simples (ouverture, acceptation, cloture) — simple confirmation
    bodyContent = [
      h('p', { style: 'margin: 0; color: var(--c-ink-soft)' },
        i18n.t('common.confirm_action'))
    ];
  }

  const dialog = h('div', { class: 'modal__dialog' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title', id: 'action-modal-title' }, action.label)
    ]),
    h('div', { class: 'modal__body' }, bodyContent),
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

  // Focus auto sur le premier champ si présent
  if (formEl) {
    const firstField = formEl.querySelector('textarea, select, input');
    if (firstField) setTimeout(() => firstField.focus(), 50);
  }

  submitBtn.addEventListener('click', async () => {
    // Validation
    const body = { action: action.action };

    if (formEl) {
      if (action.action === 'refus') {
        const motif = formEl.querySelector('[name="motif"]').value.trim();
        if (!motif) {
          setFieldError(formEl.querySelector('[name="motif"]'), i18n.t('emp.refuse_motif_required'));
          return;
        }
        body.motif = motif;
      } else if (action.action === 'observation') {
        const observation = formEl.querySelector('[name="observation"]').value.trim();
        if (!observation) {
          setFieldError(formEl.querySelector('[name="observation"]'), i18n.t('validation.required'));
          return;
        }
        body.observation = observation;
      } else if (action.action === 'complement') {
        const motif = formEl.querySelector('[name="complement_motif"]').value.trim();
        if (!motif) {
          setFieldError(formEl.querySelector('[name="complement_motif"]'), i18n.t('validation.required'));
          return;
        }
        body.motif = motif;
      } else if (action.action === 'transfert') {
        const svcId = formEl.querySelector('[name="service_cible_id"]').value;
        if (!svcId) {
          setFieldError(formEl.querySelector('[name="service_cible_id"]'), i18n.t('emp.transfer_target_required'));
          return;
        }
        body.service_cible_id = Number(svcId);
      }
    }

    submitBtn.disabled = true;
    cancelBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = i18n.t('common.saving');

    try {
      await api.patch(`/employe/demandes/action/${encodeURIComponent(dem.id)}`, body);
      toastSuccess(i18n.t('emp.action_success'));
      close();
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      if (err instanceof ApiError && err.isConflict()) {
        // 409 : transition invalide
        toastError(err.message || i18n.t('emp.action_invalid_transition'));
      } else if (err instanceof ApiError && err.isValidation()) {
        toastError(err.message || i18n.t('validation.required'));
      } else {
        toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      }
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      typeof value === 'string' ? (value || '—') : value)
  ]);
}

function labelAction(action) {
  const map = {
    soumission: i18n.t('status.Soumise'),
    attribution: i18n.t('status.Soumise'),
    ouverture: i18n.t('emp.action_open'),
    complement: i18n.t('emp.action_complement'),
    acceptation: i18n.t('emp.action_accept'),
    refus: i18n.t('emp.action_refuse'),
    transfert: i18n.t('emp.action_transfer'),
    observation: i18n.t('emp.action_observe'),
    cloture: i18n.t('emp.action_close')
  };
  return map[action] || action || '';
}

function formatSizeLocal(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${Math.round(bytes * 10) / 10} ${units[i]}`;
}

load();
