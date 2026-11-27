/**
 * PAGE : ADM-06 — Gestion du contenu (administrateur)
 * ------------------------------------------------------------------
 * 3 onglets :
 *  • Actualités : liste + bouton "Nouvelle" → POST /admin/actualites
 *                + Publier/Dépublier (PATCH)
 *  • Pages      : liste statique (presentation, facultes, formation,
 *                 recherche, vie_universitaire) + édition simulée
 *  • Liens      : liste + ajout (POST) + suppression (DELETE)
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState, errorState } from '../components/states.js';
import { validateForm } from '../components/forms.js';
import { toastSuccess, toastError, toastInfo } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.content_title'), requireAuth: true, requireRole: ['admin'] });

let actualites = [];
let liens = [];
let activeTab = 'actualites';

const STATIC_PAGES = [
  { key: 'presentation', labelKey: 'adm.content_page_presentation', page: 'presentation' },
  { key: 'facultes', labelKey: 'adm.content_page_facultes', page: 'facultes' },
  { key: 'formation', labelKey: 'adm.content_page_formation', page: 'formation' },
  { key: 'recherche', labelKey: 'adm.content_page_recherche', page: 'recherche' },
  { key: 'vie_universitaire', labelKey: 'adm.content_page_vie', page: 'vie-universitaire' }
];

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'content',
    pageTitle: i18n.t('adm.content_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const [actRes, lienRes] = await Promise.all([
      api.get('/admin/actualites'),
      api.get('/admin/liens')
    ]);
    actualites = actRes?.data || [];
    liens = lienRes?.data || [];
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

  // Tabs
  const tabs = h('div', { class: 'tabs', role: 'tablist' }, [
    tabBtn('actualites', i18n.t('adm.content_actualites')),
    tabBtn('pages', i18n.t('adm.content_pages')),
    tabBtn('links', i18n.t('adm.content_links'))
  ]);
  main.appendChild(tabs);
  // Panel container
  const panel = h('section', { class: 'card', style: 'margin-top: var(--sp-4)' }, [
    h('div', { class: 'card__body', id: 'tab-panel' }, [])
  ]);
  main.appendChild(panel);

  bindTabs();
  renderTab();
}

function tabBtn(key, label) {
  return h('button', {
    class: `tabs__btn${activeTab === key ? ' tabs__btn--active' : ''}`,
    role: 'tab', 'aria-selected': activeTab === key ? 'true' : 'false',
    'data-tab': key, type: 'button'
  }, label);
}

function bindTabs() {
  document.querySelectorAll('.tabs__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll('.tabs__btn').forEach((b) => {
        const isActive = b.dataset.tab === activeTab;
        b.classList.toggle('tabs__btn--active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      renderTab();
    });
  });
}

function renderTab() {
  const panel = document.querySelector('#tab-panel');
  if (!panel) return;
  panel.innerHTML = '';
  if (activeTab === 'actualites') renderActualitesTab(panel);
  else if (activeTab === 'pages') renderPagesTab(panel);
  else renderLinksTab(panel);
}

// === Actualités ===
function renderActualitesTab(panel) {
  const header = h('div', { class: 'form-actions form-actions--end', style: 'margin-bottom: var(--sp-4)' }, [
    h('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      onclick: () => openActualiteModal()
    }, i18n.t('adm.content_new'))
  ]);
  panel.appendChild(header);

  if (!actualites.length) {
    panel.appendChild(emptyState({ message: i18n.t('adm.content_no_results') }));
    return;
  }

  panel.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.title')),
        h('th', {}, i18n.t('adm.content_field_categorie')),
        h('th', {}, i18n.t('adm.content_table_date')),
        h('th', {}, i18n.t('common.status')),
        h('th', {}, i18n.t('adm.content_table_actions'))
      ])),
      h('tbody', {}, actualites.map((a) => h('tr', {}, [
        h('td', {}, i18n.localized(a, 'titre') || '—'),
        h('td', {}, h('span', { class: 'badge badge--neutral' }, a.categorie || '—')),
        h('td', {}, formatDate(a.publie_le)),
        h('td', {}, a.actif
          ? h('span', { class: 'badge badge--success' }, i18n.t('adm.content_table_published'))
          : h('span', { class: 'badge badge--warning' }, i18n.t('adm.content_table_unpublished'))),
        h('td', {}, [
          h('button', {
            class: 'btn btn--ghost btn--sm', type: 'button',
            onclick: () => togglePublish(a)
          }, a.actif ? i18n.t('adm.content_unpublish') : i18n.t('adm.content_publish'))
        ])
      ])))
    ])
  ]));
}

async function togglePublish(a) {
  try {
    const res = await api.patch(`/admin/actualites/${encodeURIComponent(a.id)}`, { actif: !a.actif });
    if (res?.data) Object.assign(a, res.data);
    toastSuccess(a.actif ? i18n.t('adm.content_published_toast') : i18n.t('adm.content_unpublished_toast'));
    renderTab();
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

function openActualiteModal() {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 640px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, i18n.t('adm.content_new')),
      closeBtn
    ]),
    h('form', { id: 'actu-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'actu-cat' }, i18n.t('adm.content_field_categorie')),
          h('select', { class: 'form-control', id: 'actu-cat', name: 'categorie' }, [
            h('option', { value: 'annonce' }, 'annonce'),
            h('option', { value: 'actualite' }, 'actualite'),
            h('option', { value: 'evenement' }, 'evenement')
          ])
        ]),
        h('div', { class: 'grid grid--2' }, [
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'actu-titre-ar' }, [i18n.t('adm.content_field_titre_ar'), h('span', { class: 'req' }, ' *')]),
            h('input', { class: 'form-control', type: 'text', id: 'actu-titre-ar', name: 'titre_ar', dir: 'rtl', required: 'true' })
          ]),
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'actu-titre-fr' }, [i18n.t('adm.content_field_titre_fr'), h('span', { class: 'req' }, ' *')]),
            h('input', { class: 'form-control', type: 'text', id: 'actu-titre-fr', name: 'titre_fr', required: 'true' })
          ])
        ]),
        h('div', { class: 'grid grid--2' }, [
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'actu-contenu-ar' }, i18n.t('adm.content_field_contenu_ar')),
            h('textarea', { class: 'form-control', id: 'actu-contenu-ar', name: 'contenu_ar', rows: '3', dir: 'rtl' })
          ]),
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'actu-contenu-fr' }, i18n.t('adm.content_field_contenu_fr')),
            h('textarea', { class: 'form-control', id: 'actu-contenu-fr', name: 'contenu_fr', rows: '3' })
          ])
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'actu-date' }, i18n.t('adm.content_field_date_evenement')),
          h('input', { class: 'form-control', type: 'date', id: 'actu-date', name: 'date_evenement' })
        ])
      ]),
      h('div', { class: 'modal__footer' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'submit' }, i18n.t('common.save'))
      ])
    ])
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });

  dialog.querySelector('#actu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form, {
      titre_ar: { required: true },
      titre_fr: { required: true }
    })) return;
    const fd = new FormData(form);
    const body = {
      categorie: fd.get('categorie'),
      titre_ar: fd.get('titre_ar').trim(),
      titre_fr: fd.get('titre_fr').trim(),
      titre_en: fd.get('titre_fr').trim(),
      contenu_ar: fd.get('contenu_ar').trim(),
      contenu_fr: fd.get('contenu_fr').trim(),
      date_evenement: fd.get('date_evenement') || null
    };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      const res = await api.post('/admin/actualites', body);
      if (res?.data) actualites.unshift(res.data);
      toastSuccess(i18n.t('adm.content_created_toast'));
      close();
      renderTab();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// === Pages ===
function renderPagesTab(panel) {
  panel.appendChild(h('p', { class: 'form-hint', style: 'margin-top: 0; margin-bottom: var(--sp-4)' },
    i18n.t('adm.content_pages_static_note')));

  if (!STATIC_PAGES.length) {
    panel.appendChild(emptyState({ message: i18n.t('adm.content_no_results') }));
    return;
  }

  panel.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.title')),
        h('th', {}, i18n.t('adm.content_table_actions'))
      ])),
      h('tbody', {}, STATIC_PAGES.map((p) => h('tr', {}, [
        h('td', {}, i18n.t(p.labelKey)),
        h('td', {}, h('button', {
          class: 'btn btn--ghost btn--sm', type: 'button',
          onclick: () => openPageEditModal(p)
        }, i18n.t('adm.content_edit')))
      ])))
    ])
  ]));
}

function openPageEditModal(page) {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 720px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, `${i18n.t('adm.content_edit')} — ${i18n.t(page.labelKey)}`),
      closeBtn
    ]),
    h('form', { id: 'page-form' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'page-contenu-ar' }, i18n.t('adm.content_field_contenu_ar')),
          h('textarea', { class: 'form-control', id: 'page-contenu-ar', name: 'contenu_ar', rows: '6', dir: 'rtl', placeholder: i18n.t('adm.content_field_contenu') + ' (AR)' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'page-contenu-fr' }, i18n.t('adm.content_field_contenu_fr')),
          h('textarea', { class: 'form-control', id: 'page-contenu-fr', name: 'contenu_fr', rows: '6', placeholder: i18n.t('adm.content_field_contenu') + ' (FR)' })
        ])
      ]),
      h('div', { class: 'modal__footer' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'submit' }, i18n.t('common.save'))
      ])
    ])
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
  dialog.querySelector('#page-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toastInfo(i18n.t('adm.content_pages_static_note'));
    toastSuccess(i18n.t('adm.content_saved_toast'));
    close();
  });
}

// === Liens ===
function renderLinksTab(panel) {
  const header = h('div', { class: 'form-actions form-actions--end', style: 'margin-bottom: var(--sp-4)' }, [
    h('button', {
      class: 'btn btn--primary btn--sm', type: 'button',
      onclick: () => openLinkModal()
    }, i18n.t('adm.content_new'))
  ]);
  panel.appendChild(header);

  if (!liens.length) {
    panel.appendChild(emptyState({ message: i18n.t('adm.content_no_results') }));
    return;
  }

  panel.appendChild(h('div', { class: 'table-wrap' }, [
    h('table', { class: 'table' }, [
      h('thead', {}, h('tr', {}, [
        h('th', {}, i18n.t('common.title')),
        h('th', {}, i18n.t('adm.content_table_url')),
        h('th', {}, i18n.t('adm.content_table_order')),
        h('th', {}, i18n.t('adm.content_table_actions'))
      ])),
      h('tbody', {}, liens.sort((a, b) => a.ordre - b.ordre).map((l) => h('tr', {}, [
        h('td', {}, i18n.lang === 'ar' ? (l.libelle_ar || l.libelle_fr) : (l.libelle_fr || l.libelle_ar)),
        h('td', {}, h('a', { href: l.url, target: '_blank', rel: 'noopener', class: 'link' }, l.url)),
        h('td', { class: 'table__ref' }, String(l.ordre || 1)),
        h('td', {}, h('button', {
          class: 'btn btn--danger btn--sm', type: 'button',
          onclick: () => deleteLink(l)
        }, i18n.t('adm.content_delete')))
      ])))
    ])
  ]));
}

function openLinkModal() {
  const overlay = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'false' });
  const closeBtn = h('button', { class: 'modal__close', type: 'button', 'aria-label': i18n.t('common.close') }, '×');
  const dialog = h('div', { class: 'modal__dialog', style: 'max-width: 480px' }, [
    h('div', { class: 'modal__header' }, [
      h('h2', { class: 'modal__title' }, i18n.t('adm.content_new')),
      closeBtn
    ]),
    h('form', { id: 'lien-form', novalidate: 'true' }, [
      h('div', { class: 'modal__body' }, [
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'lien-libelle-ar' }, [i18n.t('adm.content_field_libelle_ar'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'lien-libelle-ar', name: 'libelle_ar', dir: 'rtl', required: 'true' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'lien-libelle-fr' }, [i18n.t('adm.content_field_libelle_fr'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'text', id: 'lien-libelle-fr', name: 'libelle_fr', required: 'true' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'lien-url' }, [i18n.t('adm.content_field_url'), h('span', { class: 'req' }, ' *')]),
          h('input', { class: 'form-control', type: 'url', id: 'lien-url', name: 'url', required: 'true', placeholder: 'https://example.dz' })
        ]),
        h('div', { class: 'form-group' }, [
          h('label', { class: 'form-label', for: 'lien-ordre' }, i18n.t('adm.content_field_order')),
          h('input', { class: 'form-control', type: 'number', id: 'lien-ordre', name: 'ordre', value: String((liens.reduce((m, l) => Math.max(m, l.ordre || 0), 0) + 1)), min: '1' })
        ])
      ]),
      h('div', { class: 'modal__footer' }, [
        h('button', { class: 'btn btn--ghost', type: 'button', onclick: () => overlay.remove() }, i18n.t('common.cancel')),
        h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'submit' }, i18n.t('common.save'))
      ])
    ])
  ]);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
  dialog.querySelector('#lien-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form, {
      libelle_ar: { required: true },
      libelle_fr: { required: true },
      url: { required: true }
    })) return;
    const fd = new FormData(form);
    const body = {
      libelle_ar: fd.get('libelle_ar').trim(),
      libelle_fr: fd.get('libelle_fr').trim(),
      url: fd.get('url').trim(),
      ordre: Number(fd.get('ordre')) || 1
    };
    const btn = dialog.querySelector('[data-action="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = i18n.t('common.saving');
    try {
      const res = await api.post('/admin/liens', body);
      if (res?.data) liens.push(res.data);
      toastSuccess(i18n.t('adm.content_created_toast'));
      close();
      renderTab();
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

async function deleteLink(l) {
  if (!confirm(i18n.t('adm.content_delete_confirm'))) return;
  try {
    await api.delete(`/admin/liens/${encodeURIComponent(l.id)}`);
    liens = liens.filter((x) => x.id !== l.id);
    toastSuccess(i18n.t('adm.content_deleted_toast'));
    renderTab();
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  }
}

const style = document.createElement('style');
style.textContent = `
  .tabs { display: flex; gap: var(--sp-1); border-bottom: 1px solid var(--c-line-soft); flex-wrap: wrap; }
  .tabs__btn { background: transparent; border: 0; padding: var(--sp-2) var(--sp-3); cursor: pointer; border-bottom: 2px solid transparent; color: var(--c-ink-soft); font-size: var(--fs-sm); }
  .tabs__btn--active { color: var(--c-ink); border-bottom-color: var(--c-ink); font-weight: var(--fw-semibold); }
  .link { color: var(--c-info); text-decoration: underline; }
`;
document.head.appendChild(style);

load();
