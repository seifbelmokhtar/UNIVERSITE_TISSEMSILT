/**
 * PAGE : ENS-03 — Annonces pédagogiques (enseignant)
 * ------------------------------------------------------------------
 * Liste des annonces de l'enseignant + formulaire de publication en haut
 * (titre ar/fr, contenu ar/fr, module select).
 * Bouton "Publier" → POST /enseignant/annonces → toast + reload.
 * Chaque annonce: badges type/date, bouton "Supprimer" (mock: pas de route
 * DELETE, afficher toast "Suppression simulée").
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDateTime } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { toastSuccess, toastError, toastInfo } from '../components/toast.js';

bootstrapPage({ title: i18n.t('ens.announcements_title'), requireAuth: true, requireRole: ['enseignant'] });

let allAnnouncements = [];
let allModules = [];

async function load() {
  const shell = renderAppShell({
    role: 'enseignant',
    activeKey: 'announcements',
    pageTitle: i18n.t('ens.announcements_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [annRes, modsRes] = await Promise.all([
      api.get('/enseignant/annonces'),
      api.get('/enseignant/modules')
    ]);
    allAnnouncements = annRes?.data || [];
    allModules = modsRes?.data || [];
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
  const isAr = i18n.lang === 'ar';
  const header = main.querySelector('.page-header');
  main.innerHTML = '';
  if (header) main.appendChild(header);

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' },
    i18n.t('ens.announcements_intro')));

  // Formulaire de publication
  main.appendChild(renderPublishForm());

  // Liste
  const list = [...allAnnouncements].sort((a, b) => new Date(b.publie_le) - new Date(a.publie_le));
  const section = h('section', { class: 'card', style: 'margin-top: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('ens.announcements_list_title'))]),
    h('div', { class: 'card__body', id: 'announcements-body' }, [])
  ]);
  main.appendChild(section);

  const body = section.querySelector('.card__body');
  if (!list.length) {
    body.appendChild(emptyState({ message: i18n.t('ens.announcements_empty') }));
    return;
  }
  body.appendChild(h('div', { class: 'stack', style: 'display: flex; flex-direction: column; gap: var(--sp-4)' },
    list.map((a) => renderAnnouncementCard(a))));
}

function renderPublishForm() {
  const isAr = i18n.lang === 'ar';
  const form = h('form', { id: 'announcement-form', novalidate: 'true', class: 'card card--pad' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('ens.announcements_publish'))]),

    h('div', { class: 'grid grid--2' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'titre_ar' }, [
          i18n.t('ens.announcement_titre_ar'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('input', {
          class: 'form-control', type: 'text', name: 'titre_ar', id: 'titre_ar',
          required: 'true', dir: 'rtl',
          placeholder: i18n.t('ens.announcement_titre_ar')
        })
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'titre_fr' }, [
          i18n.t('ens.announcement_titre_fr'),
          h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
        ]),
        h('input', {
          class: 'form-control', type: 'text', name: 'titre_fr', id: 'titre_fr',
          required: 'true', dir: 'ltr',
          placeholder: i18n.t('ens.announcement_titre_fr')
        })
      ])
    ]),

    h('div', { class: 'grid grid--2', style: 'margin-top: var(--sp-4)' }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'contenu_ar' }, i18n.t('ens.announcement_contenu_ar')),
        h('textarea', {
          class: 'form-control', name: 'contenu_ar', id: 'contenu_ar', rows: '4', dir: 'rtl'
        }, '')
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'contenu_fr' }, i18n.t('ens.announcement_contenu_fr')),
        h('textarea', {
          class: 'form-control', name: 'contenu_fr', id: 'contenu_fr', rows: '4', dir: 'ltr'
        }, '')
      ])
    ]),

    h('div', { class: 'form-group', style: 'margin-top: var(--sp-4)' }, [
      h('label', { class: 'form-label', for: 'module_id' }, [
        i18n.t('ens.announcement_module'),
        h('span', { class: 'req', 'aria-hidden': 'true' }, ' *')
      ]),
      h('select', { class: 'form-control', name: 'module_id', id: 'module_id', required: 'true' }, [
        h('option', { value: '' }, i18n.t('ens.announcement_module_placeholder')),
        ...allModules.map((m) => h('option', { value: String(m.id) },
          isAr ? (m.nom_ar || m.nom_fr) : (m.nom_fr || m.nom_ar)))
      ])
    ]),

    h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-4)' }, [
      h('button', { class: 'btn btn--primary', type: 'submit', id: 'announcement-submit' },
        i18n.t('ens.announcement_publish_submit'))
    ])
  ]);
  form.addEventListener('submit', onSubmit);
  return form;
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;

  // Validation : au moins un titre requis + module requis
  const titre_ar = form.querySelector('[name="titre_ar"]').value.trim();
  const titre_fr = form.querySelector('[name="titre_fr"]').value.trim();
  const module_id = form.querySelector('[name="module_id"]').value;

  if (!titre_ar && !titre_fr) {
    toastError(i18n.t('validation.required'));
    return;
  }
  if (!module_id) {
    toastError(i18n.t('validation.required'));
    return;
  }

  const contenu_ar = form.querySelector('[name="contenu_ar"]').value.trim();
  const contenu_fr = form.querySelector('[name="contenu_fr"]').value.trim();

  const btn = form.querySelector('#announcement-submit');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = i18n.t('ens.announcement_publishing');

  try {
    await api.post('/enseignant/annonces', {
      titre_ar, titre_fr, contenu_ar, contenu_fr,
      module_id: Number(module_id)
    });
    toastSuccess(i18n.t('ens.announcement_publish_success'));
    setTimeout(() => window.location.reload(), 700);
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
    btn.disabled = false;
    btn.textContent = original;
  }
}

function renderAnnouncementCard(a) {
  const isAr = i18n.lang === 'ar';
  const titre = isAr
    ? (a.titre_ar || a.titre_fr || '')
    : (a.titre_fr || a.titre_ar || '');
  const contenu = isAr
    ? (a.contenu_ar || a.contenu_fr || '')
    : (a.contenu_fr || a.contenu_ar || '');
  const moduleLabel = moduleLabelFor(a.module_id);

  return h('article', { class: 'card card--pad', style: 'background: var(--c-surface-alt)' }, [
    h('div', { style: 'display: flex; justify-content: space-between; align-items: start; gap: var(--sp-3); flex-wrap: wrap' }, [
      h('h3', { style: 'margin: 0; font-size: var(--fs-md); font-weight: var(--fw-semibold)' }, titre || '—'),
      h('div', { style: 'display: flex; gap: var(--sp-2); flex-wrap: wrap' }, [
        h('span', { class: 'badge badge--info', style: 'font-size: 10px' }, moduleLabel),
        h('span', { class: 'badge badge--neutral', style: 'font-size: 10px' }, formatDateTime(a.publie_le))
      ])
    ]),
    contenu
      ? h('p', { style: 'margin: var(--sp-3) 0 0; color: var(--c-ink-soft); white-space: pre-wrap' }, contenu)
      : null,
    h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-3)' }, [
      h('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        style: 'color: var(--c-danger)',
        onclick: () => {
          // Mock : pas de route DELETE → suppression simulée
          toastInfo(i18n.t('ens.announcement_delete_simulated'));
        }
      }, i18n.t('ens.announcement_delete'))
    ])
  ]);
}

function moduleLabelFor(moduleId) {
  if (!moduleId) return i18n.t('ens.announcement_no_module');
  const m = allModules.find((x) => String(x.id) === String(moduleId));
  if (!m) return i18n.t('ens.announcement_no_module');
  return i18n.lang === 'ar' ? (m.nom_ar || m.nom_fr) : (m.nom_fr || m.nom_ar);
}

load();
