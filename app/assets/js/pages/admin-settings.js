/**
 * PAGE : ADM-09 — Paramètres généraux (administrateur)
 * ------------------------------------------------------------------
 * Formulaire :
 *  - nom institution (fr + ar)
 *  - langue par défaut (ar/fr/en)
 *  - taille max upload (MB)
 *  - notifications email (on/off)
 * Sauvegarde → PATCH /admin/parametres → toast success.
 * Section Maintenance :
 *  - Vider le cache (toast simulé)
 *  - Exporter données (blob JSON)
 *  - Sauvegarde (toast "voir documentation backend")
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState } from '../components/states.js';
import { validateForm } from '../components/forms.js';
import { toastSuccess, toastError, toastInfo } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.settings_title'), requireAuth: true, requireRole: ['admin'] });

let params = null;

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'settings',
    pageTitle: i18n.t('adm.settings_title'),
    children: [loadingState()]
  });
  mountPage(shell);
  try {
    const res = await api.get('/admin/parametres');
    params = res?.data || {};
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

  // Section générale
  main.appendChild(h('section', { class: 'card', style: 'margin-bottom: var(--sp-6)' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('adm.settings_general'))]),
    h('div', { class: 'card__body' }, [
      h('form', { id: 'settings-form', novalidate: 'true' }, [
        h('div', { class: 'grid grid--2' }, [
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'set-inst-fr' }, i18n.t('adm.settings_field_institution')),
            h('input', { class: 'form-control', type: 'text', id: 'set-inst-fr', name: 'nom_institution', value: params.nom_institution || '' })
          ]),
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'set-inst-ar' }, i18n.t('adm.settings_field_institution_ar')),
            h('input', { class: 'form-control', type: 'text', id: 'set-inst-ar', name: 'nom_institution_ar', dir: 'rtl', value: params.nom_institution_ar || '' })
          ])
        ]),
        h('div', { class: 'grid grid--2', style: 'margin-top: var(--sp-4)' }, [
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'set-lang' }, i18n.t('adm.settings_field_lang')),
            h('select', { class: 'form-control', id: 'set-lang', name: 'langue_defaut' },
              i18n.supported.map((l) => h('option', { value: l, ...(params.langue_defaut === l ? { selected: 'true' } : {}) }, l.toUpperCase())))
          ]),
          h('div', { class: 'form-group', style: 'margin: 0' }, [
            h('label', { class: 'form-label', for: 'set-upload' }, i18n.t('adm.settings_field_upload_max')),
            h('input', { class: 'form-control', type: 'number', id: 'set-upload', name: 'upload_max_mb', value: String(params.upload_max_mb ?? 10), min: '1', max: '50' })
          ])
        ]),
        h('div', { class: 'form-group', style: 'margin-top: var(--sp-4)' }, [
          h('label', { class: 'form-label', for: 'set-notif' }, i18n.t('adm.settings_field_notifications')),
          h('select', { class: 'form-control', id: 'set-notif', name: 'notifications_email' }, [
            h('option', { value: 'on', ...(params.notifications_email === 'on' ? { selected: 'true' } : {}) }, i18n.t('adm.settings_on')),
            h('option', { value: 'off', ...(params.notifications_email === 'off' || !params.notifications_email ? { selected: 'true' } : {}) }, i18n.t('adm.settings_off'))
          ])
        ]),
        h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-4)' }, [
          h('button', { class: 'btn btn--primary', type: 'submit', 'data-action': 'save' }, i18n.t('adm.settings_save'))
        ])
      ])
    ])
  ]));

  // Section maintenance
  main.appendChild(h('section', { class: 'card' }, [
    h('div', { class: 'card__header' }, [h('h2', { class: 'card__title' }, i18n.t('adm.settings_maintenance'))]),
    h('div', { class: 'card__body' }, [
      h('div', { class: 'grid grid--3' }, [
        h('button', {
          class: 'btn btn--secondary btn--block', type: 'button',
          onclick: () => {
            // Mock cache clear
            toastSuccess(i18n.t('adm.settings_cache_cleared'));
          }
        }, i18n.t('adm.settings_clear_cache')),
        h('button', {
          class: 'btn btn--secondary btn--block', type: 'button',
          onclick: () => exportData()
        }, i18n.t('adm.settings_export_data')),
        h('button', {
          class: 'btn btn--secondary btn--block', type: 'button',
          onclick: () => {
            toastInfo(i18n.t('adm.settings_backup_note'));
            toastSuccess(i18n.t('adm.settings_backup_launched'));
          }
        }, i18n.t('adm.settings_backup'))
      ])
    ])
  ]));

  // Bind form
  document.querySelector('#settings-form').addEventListener('submit', onSave);
}

async function onSave(e) {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form, {
    nom_institution: { required: true },
    nom_institution_ar: { required: true },
    upload_max_mb: { required: true, validate: (v) => Number(v) > 0 && Number(v) <= 50 }
  })) return;
  const fd = new FormData(form);
  const body = {
    nom_institution: fd.get('nom_institution').trim(),
    nom_institution_ar: fd.get('nom_institution_ar').trim(),
    langue_defaut: fd.get('langue_defaut'),
    upload_max_mb: Number(fd.get('upload_max_mb')),
    notifications_email: fd.get('notifications_email')
  };
  const btn = form.querySelector('[data-action="save"]');
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = i18n.t('common.saving');
  try {
    const res = await api.patch('/admin/parametres', body);
    if (res?.data) Object.assign(params, res.data);
    toastSuccess(i18n.t('adm.settings_saved_toast'));
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

async function exportData() {
  try {
    // Mock export — combine params + a JSON skeleton
    const payload = {
      exported_at: new Date().toISOString(),
      params,
      counts: {
        utilisateurs: '(voir backend)',
        demandes: '(voir backend)',
        actualites: '(voir backend)'
      },
      note: 'Export simulé — les données réelles proviennent du backend.'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastSuccess(i18n.t('adm.settings_data_exported'));
  } catch (e) {
    toastError(String(e));
  }
}

load();
