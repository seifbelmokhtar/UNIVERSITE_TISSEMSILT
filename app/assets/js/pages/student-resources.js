/**
 * PAGE : ETU-08 — Ressources pédagogiques (étudiant)
 * ------------------------------------------------------------------
 * Liste filtrable par type + recherche par titre. Cartes cliquables
 * vers ETU-09.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate, formatSize } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';

const TYPES = [
  { value: 'cours', labelKey: 'etu.resources_type_cours' },
  { value: 'td', labelKey: 'etu.resources_type_td' },
  { value: 'tp', labelKey: 'etu.resources_type_tp' },
  { value: 'document', labelKey: 'etu.resources_type_document' }
];

let allResources = [];

bootstrapPage({ title: i18n.t('etu.resources_title'), requireAuth: true, requireRole: ['etudiant'] });

async function load() {
  const shell = renderAppShell({
    role: 'etudiant',
    activeKey: 'resources',
    pageTitle: i18n.t('etu.resources_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/etudiant/ressources');
    allResources = res?.data || [];
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

  main.appendChild(h('p', { class: 'form-hint', style: 'margin-bottom: var(--sp-6)' }, i18n.t('etu.resources_intro')));

  // Barre filtre + recherche
  const filters = h('section', { class: 'card card--pad', style: 'margin-bottom: var(--sp-6)' }, [
    h('form', {
      id: 'resources-filters',
      class: 'grid',
      style: 'grid-template-columns: 2fr 1fr auto; gap: var(--sp-4); align-items: end'
    }, [
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'r-search' }, i18n.t('etu.resources_search')),
        h('input', {
          class: 'form-control', type: 'search', id: 'r-search', name: 'q',
          placeholder: i18n.t('etu.resources_search'),
          oninput: renderResults
        })
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('label', { class: 'form-label', for: 'r-type' }, i18n.t('etu.resources_filter_type')),
        h('select', { class: 'form-control', id: 'r-type', name: 'type', onchange: renderResults }, [
          h('option', { value: '' }, i18n.t('common.all')),
          ...TYPES.map((t) => h('option', { value: t.value }, i18n.t(t.labelKey)))
        ])
      ]),
      h('div', { class: 'form-group', style: 'margin: 0' }, [
        h('button', { class: 'btn btn--secondary', type: 'submit' }, i18n.t('common.search'))
      ])
    ])
  ]);
  filters.addEventListener('submit', (e) => { e.preventDefault(); renderResults(); });
  main.appendChild(filters);

  const results = h('section', { id: 'results' }, []);
  main.appendChild(results);
  renderResults();
}

function renderResults() {
  const container = document.querySelector('#results');
  if (!container) return;
  const isAr = i18n.lang === 'ar';
  const q = (document.querySelector('#r-search')?.value || '').trim().toLowerCase();
  const typeFilter = document.querySelector('#r-type')?.value || '';

  let list = allResources;
  if (typeFilter) list = list.filter((r) => r.type === typeFilter);
  if (q) {
    list = list.filter((r) => {
      const title = isAr ? (r.titre || r.titre_fr || '') : (r.titre_fr || r.titre || '');
      return title.toLowerCase().includes(q);
    });
  }
  list = [...list].sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le));

  container.innerHTML = '';
  if (!list.length) {
    container.appendChild(emptyState({ message: i18n.t('etu.resources_empty') }));
    return;
  }

  const grid = h('div', { class: 'grid grid--3' });
  for (const r of list) {
    const title = isAr ? (r.titre || r.titre_fr || '') : (r.titre_fr || r.titre || '');
    const typeLabel = i18n.t(`etu.resources_type_${r.type}`);
    grid.appendChild(h('a', {
      class: 'card card--pad card--hover',
      href: `/pages/student/resource-detail.html?id=${r.id}`,
      style: 'text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: var(--sp-3)'
    }, [
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center' }, [
        h('span', { class: 'badge badge--info', style: 'text-transform: uppercase; font-size: 10px' }, typeLabel),
        h('span', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted)' }, formatSize(r.taille_octets))
      ]),
      h('h3', { class: 'card__title', style: 'margin: 0; font-size: var(--fs-md)' }, title || '—'),
      h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); margin-top: auto' },
        formatDate(r.cree_le))
    ]));
  }
  container.appendChild(grid);
}

load();
