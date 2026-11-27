/**
 * PAGE : ETU-07 — Documents administratifs (étudiant)
 * ------------------------------------------------------------------
 * Table des documents disponibles + boutons télécharger / vérifier
 * publiquement / demander un document (modal choix type).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.documents_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'documents',
    pageTitle: i18n.t('etu.documents_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/documents');
    renderDocuments(res?.data || []);
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

function renderDocuments(docs) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('div', { class: 'page-header__actions', style: 'margin-bottom: var(--sp-6)' }, [
    h('button', {
      class: 'btn btn--primary',
      type: 'button',
      onclick: () => openRequestModal()
    }, i18n.t('etu.documents_request_new'))
  ]));
  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.documents_intro')));

  if (!docs.length) {
    main.appendChild(emptyState({
      title: i18n.t('etu.documents_empty'),
      message: '',
      action: h('button', {
        class: 'btn btn--secondary btn--sm', type: 'button',
        onclick: () => openRequestModal()
      }, i18n.t('etu.documents_request_new'))
    }));
    return;
  }

  main.appendChild(h('div', { class: 'card' }, [
    h('div', { class: 'card__body' }, [
      h('div', { class: 'table-wrap' }, [
        h('table', { class: 'table' }, [
          h('thead', {}, h('tr', {}, [
            h('th', {}, i18n.t('common.reference')),
            h('th', {}, i18n.t('common.type')),
            h('th', {}, i18n.t('etu.documents_emission_date')),
            h('th', {}, i18n.t('common.status')),
            h('th', {}, i18n.t('common.actions'))
          ])),
          h('tbody', {}, docs.map((d) => {
            const typeLabel = isAr ? (d.type_ar || d.type_fr) : (d.type_fr || d.type_ar);
            const etabLabel = isAr ? (d.etablissement_ar || d.etablissement_fr) : (d.etablissement_fr || d.etablissement_ar);
            return h('tr', {}, [
              h('td', { class: 'table__ref' }, d.reference),
              h('td', {}, [
                h('div', {}, typeLabel || '—'),
                h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted)' }, etabLabel || '')
              ]),
              h('td', {}, formatDate(d.genere_le)),
              h('td', {}, h('span', { class: 'badge badge--success' },
                i18n.t('etu.documents_status_available'))),
              h('td', {}, h('div', { style: 'display: flex; gap: var(--sp-2); flex-wrap: wrap' }, [
                h('button', {
                  class: 'btn btn--ghost btn--sm', type: 'button',
                  onclick: () => {
                    toastSuccess(i18n.t('etu.documents_download_simulated'));
                  }
                }, i18n.t('etu.documents_download')),
                h('a', {
                  class: 'btn btn--ghost btn--sm',
                  href: `/pages/public/verify.html?ref=${encodeURIComponent(d.reference)}`,
                  target: '_blank', rel: 'noopener'
                }, i18n.t('etu.documents_verify'))
              ]))
            ]);
          }))
        ])
      ])
    ])
  ]));
}

let modalOverlay = null;

async function openRequestModal() {
  if (modalOverlay) return;
  try {
    const res = await api.get('/etudiant/document-types');
    const types = res?.data || [];
    showModal(types);
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

function showModal(types) {
  const isAr = i18n.lang === 'ar';
  const card = h('div', { class: 'card card--pad', style: 'max-width: 480px; width: 90vw; margin: auto' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, i18n.t('etu.documents_request_modal_title')),
      h('button', {
        class: 'btn btn--ghost btn--icon', type: 'button', 'aria-label': i18n.t('common.close'),
        onclick: closeModal
      }, '×')
    ]),
    h('form', { id: 'doc-request-form', novalidate: 'true' }, [
      h('div', { class: 'form-group' }, [
        h('label', { class: 'form-label', for: 'document_type_id' }, [
          i18n.t('common.type'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('select', { class: 'form-control', name: 'document_type_id', id: 'document_type_id', required: 'true' }, [
          h('option', { value: '' }, `— ${i18n.t('common.filter')} —`),
          ...types.map((t) => h('option', { value: String(t.id) },
            isAr ? (t.libelle_ar || t.libelle_fr) : (t.libelle_fr || t.libelle_ar)))
        ])
      ]),
      h('div', { class: 'form-actions form-actions--end' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: closeModal }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', id: 'doc-request-submit' },
          i18n.t('etu.documents_request_modal_submit'))
      ])
    ])
  ]);
  modalOverlay = h('div', {
    class: 'modal-overlay',
    role: 'dialog', 'aria-modal': 'true',
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: grid; place-items: center; z-index: 1000; padding: var(--sp-4)'
  }, [card]);
  document.body.appendChild(modalOverlay);

  // Fermer sur clic backdrop
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  card.querySelector('#doc-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const sel = form.querySelector('[name="document_type_id"]');
    if (!sel.value) {
      toastError(i18n.t('validation.required'));
      return;
    }
    const btn = form.querySelector('#doc-request-submit');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = i18n.t('common.sending');
    try {
      // Trouver le document_type pour récupérer service_id (mock : service_id 26 = scolarité)
      const t = types.find((x) => String(x.id) === sel.value);
      const res = await api.post('/etudiant/demandes', {
        type: 'document',
        document_type_id: Number(sel.value),
        service_id: t?.service_id || 26,
        champs: {}
      });
      const newDem = res?.data;
      toastSuccess(i18n.t('etu.documents_request_success'));
      closeModal();
      setTimeout(() => {
        if (newDem?.id) {
          window.location.href = `/pages/student/request-detail.html?id=${newDem.id}`;
        } else {
          window.location.href = '/pages/student/documents.html';
        }
      }, 700);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  // Focus initial
  setTimeout(() => card.querySelector('#document_type_id')?.focus(), 50);
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.remove();
    modalOverlay = null;
  }
}

load();
