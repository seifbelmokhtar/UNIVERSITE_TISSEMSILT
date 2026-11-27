/**
 * PAGE : ETU-06 — Détail demande + timeline (étudiant) — CRITIQUE
 * ------------------------------------------------------------------
 * Lit ?id=X. Affiche carte info, timeline historique, pièces jointes,
 * messages, et (si En attente de complément) formulaire complément.
 * Gère 403 (demande d'autrui) et 404.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatDateTime, statusToBadge } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { fileUpload, validateFile } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.request_detail_title'), requireAuth: true, requireRole: ['etudiant'] });

let complementFiles = [];

async function load() {
  const id = getUrlParam('id');
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'requests',
    pageTitle: i18n.t('etu.request_detail_title'),
    children: [loadingState()]
  });
  mountPage(shell);

  if (!id) {
    renderNotFound();
    return;
  }
  try {
    const res = await api.get(`/etudiant/demandes/${encodeURIComponent(id)}`);
    renderDemande(res?.data);
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
    title: i18n.t('etu.request_not_found'),
    message: '',
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/my-requests.html' },
      i18n.t('etu.my_requests'))
  }));
}

function renderForbidden() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('etu.request_forbidden'),
    message: '',
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/my-requests.html' },
      i18n.t('etu.my_requests'))
  }));
}

function renderDemande(dem) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  // MAJ titre page
  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = `${i18n.t('etu.request_detail_title')} — ${dem.reference}`;

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  const serviceName = isAr
    ? (dem.service_nom_ar || dem.service_nom_fr || dem.document_type_ar || dem.document_type_fr)
    : (dem.service_nom_fr || dem.service_nom_ar || dem.document_type_fr || dem.document_type_ar);

  // Carte info demande
  main.appendChild(h('section', { class: 'card card--pad', 'aria-label': i18n.t('etu.request_info') }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, i18n.t('etu.request_info'))
    ]),
    h('div', { class: 'grid grid--2' }, [
      infoRow(i18n.t('common.reference'), dem.reference),
      infoRow(i18n.t('common.service'), serviceName || '—'),
      infoRow(i18n.t('common.status'),
        h('span', { class: `badge badge--${statusToBadge(dem.statut)}` },
          i18n.t(`status.${dem.statut}`) !== `status.${dem.statut}` ? i18n.t(`status.${dem.statut}`) : dem.statut)),
      infoRow(i18n.t('common.date'), formatDateTime(dem.soumise_le))
    ])
  ]));

  // Timeline historique
  const historique = dem.historique || [];
  const timelineSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)', 'aria-label': i18n.t('etu.timeline_title') }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.timeline_title'))]),
    h('div', { class: 'card__body' }, [])
  ]);
  const tlBody = timelineSection.querySelector('.card__body');
  if (historique.length) {
    const isCurrent = (idx) => idx === historique.length - 1;
    const modifier = (event) => {
      if (event.statut === 'Acceptée' || event.statut === 'Clôturée') return 'success';
      if (event.statut === 'Refusée') return 'danger';
      if (isCurrent) return 'current';
      return '';
    };
    tlBody.appendChild(h('ol', { class: 'timeline', style: 'list-style: none; padding: 0; margin: 0' },
      historique.map((event, idx) => h('li', {
        class: `timeline__item ${modifier(event, idx) ? `timeline__item--${modifier(event, idx)}` : ''}`
      }, [
        h('div', { class: 'timeline__label' },
          i18n.t(`status.${event.statut}`) !== `status.${event.statut}` ? i18n.t(`status.${event.statut}`) : event.statut),
        h('div', { class: 'timeline__meta' }, [
          labelAction(event.action),
          ' · ',
          formatDateTime(event.date)
        ]),
        event.note ? h('div', { class: 'timeline__note' }, event.note) : null
      ]))
    ));
  } else {
    tlBody.appendChild(emptyState({ message: i18n.t('common.empty') }));
  }
  main.appendChild(timelineSection);

  // Pièces jointes (mock : fictives)
  const attachmentsSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.attachments_title'))]),
    h('div', { class: 'card__body' }, [])
  ]);
  const attBody = attachmentsSection.querySelector('.card__body');
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
    attBody.appendChild(emptyState({ message: i18n.t('etu.attachments_empty') }));
  }
  main.appendChild(attachmentsSection);

  // Messages (mock : vide avec état vide)
  const messagesSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.messages_title'))]),
    h('div', { class: 'card__body' }, [
      emptyState({ message: i18n.t('etu.messages_empty') })
    ])
  ]);
  main.appendChild(messagesSection);

  // Section complément (uniquement si En attente de complément)
  if (dem.statut === 'En attente de complément') {
    main.appendChild(renderComplementSection(dem));
  }
}

function renderComplementSection(dem) {
  complementFiles = [];
  const section = h('section', {
    class: 'card card--pad',
    style: 'margin-top: var(--sp-6); border-inline-start: 4px solid var(--c-accent)',
    'aria-label': i18n.t('etu.complement_submit')
  }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, i18n.t('etu.complement_submit'))
    ]),
    h('p', { class: 'form-hint', style: 'margin: 0 0 var(--sp-4)' }, i18n.t('etu.complement_subtitle')),
    h('form', { id: 'complement-form', novalidate: 'true' }, [
      fileUpload({
        id: 'complement-pieces',
        label: null,
        hint: i18n.t('etu.new_request_attachments_hint'),
        multiple: true,
        onChange: (files) => { complementFiles = files; }
      }),
      h('div', { class: 'form-actions form-actions--end' }, [
        h('button', { class: 'btn btn--primary', type: 'submit', id: 'complement-submit-btn' },
          i18n.t('etu.complement_send'))
      ])
    ])
  ]);

  section.querySelector('#complement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!complementFiles.length) {
      toastError(i18n.t('etu.attachments_empty'));
      return;
    }
    // Valider fichiers
    for (const f of complementFiles) {
      const errs = validateFile(f);
      if (errs.length) {
        toastError(`${f.name}: ${errs[0]}`);
        return;
      }
    }
    const btn = section.querySelector('#complement-submit-btn');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('common.sending');
    try {
      await api.post(`/etudiant/demandes/${dem.id}/complement`, {
        pieces: complementFiles.map((f) => ({ nom: f.name, taille: f.size, type: f.type }))
      });
      toastSuccess(i18n.t('etu.complement_success'));
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
  return section;
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
    ouverture: i18n.t('status.En cours de vérification'),
    complement: i18n.t('status.En attente de complément'),
    acceptation: i18n.t('status.Acceptée'),
    refus: i18n.t('status.Refusée'),
    cloture: i18n.t('status.Clôturée')
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
