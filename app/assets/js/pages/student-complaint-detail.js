/**
 * PAGE : ETU-11 — Détail d'une réclamation (étudiant)
 * ------------------------------------------------------------------
 * Lit ?id=X. Affiche carte info (réf, service, statut, date),
 * description, fil de réponses. Pas de formulaire de réponse côté
 * étudiant.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

bootstrapPage({ title: i18n.t('etu.complaint_detail_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const id = getUrlParam('id');
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'complaints',
    pageTitle: i18n.t('etu.complaint_detail_title'),
    children: [loadingState()]
  });
  mountPage(shell);

  if (!id) {
    renderNotFound();
    return;
  }
  try {
    const [recRes, servicesRes] = await Promise.all([
      api.get(`/etudiant/reclamations/${encodeURIComponent(id)}`),
      api.get('/etudiant/services')
    ]);
    const rec = recRes?.data;
    const services = servicesRes?.data || [];
    const service = services.find((s) => String(s.id) === String(rec?.service_id));
    renderComplaint(rec, service);
  } catch (err) {
    if (err instanceof ApiError && (err.isNotFound() || err.isForbidden())) {
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
    title: i18n.t('etu.complaint_not_found'),
    message: '',
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/new-complaint.html' },
      i18n.t('etu.new_complaint_title'))
  }));
}

function renderComplaint(rec, service) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  if (!rec) { renderNotFound(); return; }
  const isAr = i18n.lang === 'ar';
  const serviceName = service
    ? (isAr ? (service.nom_ar || service.nom_fr) : (service.nom_fr || service.nom_ar))
    : (isAr ? '—' : '—');

  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = `${i18n.t('etu.complaint_detail_title')} — ${rec.reference}`;

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  // Carte info
  main.appendChild(h('section', { class: 'card card--pad' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, rec.reference)]),
    h('div', { class: 'grid grid--2' }, [
      infoRow(i18n.t('common.reference'), rec.reference),
      infoRow(i18n.t('common.service'), serviceName),
      infoRow(i18n.t('common.status'),
        h('span', { class: 'badge badge--info' },
          i18n.t(`status.${rec.statut}`) !== `status.${rec.statut}` ? i18n.t(`status.${rec.statut}`) : rec.statut)),
      infoRow(i18n.t('common.date'), formatDateTime(rec.cree_le))
    ])
  ]));

  // Description
  main.appendChild(h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.new_complaint_description'))]),
    h('div', { class: 'card__body' }, [
      h('p', { style: 'color: var(--c-ink-soft); margin: 0; white-space: pre-wrap' }, rec.description || '—')
    ])
  ]));

  // Réponses
  const responses = rec.reponses || [];
  const respSection = h('section', { class: 'card card--pad', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('etu.complaint_responses'))]),
    h('div', { class: 'card__body' }, [])
  ]);
  const body = respSection.querySelector('.card__body');
  if (!responses.length) {
    body.appendChild(emptyState({ message: i18n.t('etu.complaint_no_responses') }));
  } else {
    body.appendChild(h('ol', { class: 'timeline', style: 'list-style: none; padding: 0; margin: 0' },
      responses.map((r) => h('li', { class: 'timeline__item timeline__item--success' }, [
        h('div', { class: 'timeline__label' },
          `${i18n.t('common.employee')} #${r.auteur_id || '—'}`),
        h('div', { class: 'timeline__meta' }, formatDateTime(r.cree_le)),
        h('div', { class: 'timeline__note', style: 'white-space: pre-wrap' }, r.contenu)
      ]))
    ));
  }
  main.appendChild(respSection);
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      typeof value === 'string' ? (value || '—') : value)
  ]);
}

load();
