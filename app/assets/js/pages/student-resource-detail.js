/**
 * PAGE : ETU-09 — Détail d'une ressource pédagogique (étudiant)
 * ------------------------------------------------------------------
 * Lit ?id=X. Affiche titre, description (mock), type, module,
 * enseignant, taille, date. Bouton "Télécharger PDF" (toast simulé).
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage, getUrlParam } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatSize } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { toastSuccess } from '../components/toast.js';

bootstrapPage({ title: i18n.t('etu.resource_detail_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const id = getUrlParam('id');
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'resources',
    pageTitle: i18n.t('etu.resource_detail_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  if (!id) {
    renderNotFound();
    return;
  }
  try {
    const res = await api.get('/etudiant/ressources');
    const list = res?.data || [];
    const resource = list.find((r) => String(r.id) === String(id));
    if (!resource) {
      renderNotFound();
      return;
    }
    renderResource(resource);
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

function renderNotFound() {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);
  main.appendChild(emptyState({
    title: i18n.t('etu.resource_not_found'),
    message: '',
    action: h('a', { class: 'btn btn--secondary btn--sm', href: '/pages/student/resources.html' },
      i18n.t('etu.resources_title'))
  }));
}

function renderResource(r) {
  const main = document.querySelector('#main-content');
  if (!main) return;
  const isAr = i18n.lang === 'ar';
  const title = isAr ? (r.titre || r.titre_fr || '') : (r.titre_fr || r.titre || '');

  const pageTitleEl = main.querySelector('.page-header__title');
  if (pageTitleEl) pageTitleEl.textContent = title || i18n.t('etu.resource_detail_title');

  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('section', { class: 'card card--pad' }, [
    h('div', { class: 'card__header' }, [
      h('h2', { class: 'card__title' }, title || '—'),
      h('span', { class: 'badge badge--info', style: 'text-transform: uppercase; font-size: 10px' },
        i18n.t(`etu.resources_type_${r.type}`) !== `etu.resources_type_${r.type}` ? i18n.t(`etu.resources_type_${r.type}`) : (r.type || '—'))
    ]),
    h('div', { class: 'card__body' }, [
      h('p', { style: 'color: var(--c-ink-soft); margin: 0 0 var(--sp-6)' },
        isAr
          ? 'هذا المورد التعليمي منشور من طرف الأستاذ المسؤول عن المقياس. يرجى احترام حقوق الملكية الفكرية.'
          : 'Cette ressource pédagogique est publiée par l\'enseignant responsable du module. Veuillez respecter les droits de propriété intellectuelle.'),
      h('div', { class: 'grid grid--2' }, [
        infoRow(i18n.t('etu.resource_module'), r.module_id ? `${i18n.t('common.reference')} #${r.module_id}` : '—'),
        infoRow(i18n.t('etu.resource_teacher'), r.enseignant_id ? `${i18n.t('common.reference')} #${r.enseignant_id}` : '—'),
        infoRow(i18n.t('etu.resource_size'), formatSize(r.taille_octets)),
        infoRow(i18n.t('etu.resource_published'), formatDate(r.cree_le))
      ])
    ]),
    h('div', { class: 'card__footer', style: 'display: flex; gap: var(--sp-3); flex-wrap: wrap' }, [
      h('button', {
        class: 'btn btn--primary', type: 'button',
        onclick: () => toastSuccess(i18n.t('etu.resource_download_simulated'))
      }, i18n.t('etu.resource_download')),
      h('a', {
        class: 'btn btn--ghost',
        href: '/pages/student/resources.html'
      }, i18n.t('nav.back'))
    ])
  ]));
}

function infoRow(label, value) {
  return h('div', { class: 'form-group', style: 'margin: 0' }, [
    h('label', { class: 'form-label' }, label),
    h('div', { class: 'form-control', style: 'background: var(--c-surface-alt); cursor: default' },
      value || '—')
  ]);
}

load();
