/**
 * PAGE : ADM-02 — Import des étudiants (CRITIQUE — J5)
 * ------------------------------------------------------------------
 * Pipeline 5 étapes :
 *  1. Télécharger le modèle CSV (blob local)
 *  2. Upload fichier CSV
 *  3. Prévisualisation (parse local + rapport erreurs simulé)
 *  4. Confirmation (POST /admin/etudiants/import) → codes d'activation
 *  5. Export des codes (blob CSV)
 *
 * Indicateur de progression step-by-step.
 */
import { i18n } from '../core/i18n.js';
import { api, ApiError } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderAppShell } from '../components/app-shell.js';
import { h } from '../core/dom.js';
import { loadingState, errorState, emptyState } from '../components/states.js';
import { fileUpload } from '../components/forms.js';
import { toastSuccess, toastError } from '../components/toast.js';

bootstrapPage({ title: i18n.t('adm.import_title'), requireAuth: true, requireRole: ['admin'] });

const TEMPLATE_HEADERS = ['matricule', 'nom', 'prenom', 'email'];

// State
let state = {
  step: 1,                // 1..5
  file: null,             // File object
  parsed: null,           // { total, imported, failed, lines: [{line, matricule, error?}] }
  result: null            // { total, echecs, imported, codes: [{matricule, code}] }
};

async function load() {
  const shell = renderAppShell({
    role: 'admin',
    activeKey: 'accounts',
    pageTitle: i18n.t('adm.import_title'),
    children: [renderPipeline()]
  });
  mountPage(shell);
}

function renderPipeline() {
  const steps = [
    i18n.t('adm.import_step1'),
    i18n.t('adm.import_step2'),
    i18n.t('adm.import_step3'),
    i18n.t('adm.import_step4'),
    i18n.t('adm.import_step5')
  ];
  return h('div', {}, [
    h('div', { class: 'stepper', role: 'list' }, steps.map((label, i) => {
      const n = i + 1;
      const isDone = state.step > n;
      const isActive = state.step === n;
      return h('div', {
        class: `stepper__item${isActive ? ' stepper__item--active' : ''}${isDone ? ' stepper__item--done' : ''}`,
        role: 'listitem'
      }, [
        h('div', { class: 'stepper__dot', 'aria-hidden': 'true' }, isDone ? '✓' : String(n)),
        h('div', { class: 'stepper__label' }, label)
      ]);
    })),
    h('section', { class: 'card', style: 'margin-top: var(--sp-6)' }, [
      h('div', { class: 'card__body', id: 'step-body' }, renderStepBody())
    ])
  ]);
}

function rerender() {
  const body = document.querySelector('#step-body');
  if (!body) return;
  body.innerHTML = '';
  for (const node of renderStepBody()) body.appendChild(node);
  // Mettre à jour le stepper
  const stepper = document.querySelector('.stepper');
  if (stepper) {
    stepper.querySelectorAll('.stepper__item').forEach((el, i) => {
      const n = i + 1;
      el.classList.toggle('stepper__item--active', state.step === n);
      el.classList.toggle('stepper__item--done', state.step > n);
      const dot = el.querySelector('.stepper__dot');
      if (dot) dot.textContent = state.step > n ? '✓' : String(n);
    });
  }
}

function renderStepBody() {
  switch (state.step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    case 5: return renderStep5();
    default: return [emptyState({ message: '' })];
  }
}

// --- Step 1: download template ---
function renderStep1() {
  return [
    h('p', { style: 'color: var(--c-ink-soft); margin-top: 0' }, i18n.t('adm.import_template_hint')),
    h('button', {
      class: 'btn btn--primary', type: 'button',
      onclick: () => {
        try {
          downloadCsv('modele-etudiants.csv', [TEMPLATE_HEADERS, ['20260099', 'Doe', 'Jane', 'jane.doe@example.com']]);
          toastSuccess(i18n.t('adm.import_template'));
          state.step = 2;
          rerender();
        } catch (e) {
          toastError(String(e));
        }
      }
    }, i18n.t('adm.import_template'))
  ];
}

// --- Step 2: upload file ---
function renderStep2() {
  // Render a fileUpload component wrapping
  const upload = fileUpload({
    id: 'csv-upload',
    label: i18n.t('adm.import_upload'),
    accept: '.csv,text/csv',
    hint: i18n.t('adm.import_upload_hint'),
    onChange: (files) => {
      state.file = files[0] || null;
      rerender();
    }
  });
  return [
    upload,
    h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-4)' }, [
      h('button', {
        class: 'btn btn--ghost', type: 'button',
        onclick: () => { state.step = 1; rerender(); }
      }, i18n.t('common.previous')),
      h('button', {
        class: 'btn btn--primary', type: 'button',
        disabled: state.file ? null : 'true',
        onclick: () => { state.step = 3; rerender(); }
      }, i18n.t('common.next'))
    ])
  ];
}

// --- Step 3: preview ---
function renderStep3() {
  if (!state.parsed) {
    return [
      h('p', { style: 'color: var(--c-ink-soft); margin-top: 0' }, i18n.t('adm.import_preview_first')),
      h('button', {
        class: 'btn btn--secondary', type: 'button',
        onclick: () => { state.parsed = parseMockCsv(state.file); rerender(); }
      }, i18n.t('adm.import_preview')),
      h('button', {
        class: 'btn btn--ghost', type: 'button', style: 'margin-inline-start: var(--sp-2)',
        onclick: () => { state.step = 2; rerender(); }
      }, i18n.t('common.previous'))
    ];
  }

  const p = state.parsed;
  return [
    h('div', { class: 'grid grid--3', style: 'margin-bottom: var(--sp-4)' }, [
      stat(i18n.t('adm.import_total'), p.total),
      stat(i18n.t('adm.import_imported'), p.imported),
      stat(i18n.t('adm.import_failed'), p.failed, p.failed > 0 ? 'danger' : 'success')
    ]),
    h('div', { class: 'table-wrap' }, [
      h('table', { class: 'table table--compact' }, [
        h('thead', {}, h('tr', {}, [
          h('th', {}, i18n.t('adm.import_column_line')),
          h('th', {}, i18n.t('adm.import_column_matricule')),
          h('th', {}, i18n.t('adm.import_column_error'))
        ])),
        h('tbody', {}, p.lines.slice(0, 50).map((l) => h('tr', {}, [
          h('td', { class: 'table__ref' }, String(l.line)),
          h('td', {}, l.matricule || '—'),
          h('td', {}, l.error
            ? h('span', { class: 'badge badge--danger' }, l.error)
            : h('span', { class: 'badge badge--success' }, 'OK'))
        ])))
      ])
    ]),
    p.failed > 0
      ? h('div', { class: 'alert alert--warning', style: 'margin-top: var(--sp-4)' }, `${i18n.t('adm.import_errors_report')}: ${p.failed}`)
      : h('div', { class: 'alert alert--success', style: 'margin-top: var(--sp-4)' }, i18n.t('adm.import_no_errors')),
    h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-4)' }, [
      h('button', {
        class: 'btn btn--ghost', type: 'button',
        onclick: () => { state.step = 2; rerender(); }
      }, i18n.t('common.previous')),
      h('button', {
        class: 'btn btn--primary', type: 'button',
        disabled: p.failed > 0 ? 'true' : null,
        title: p.failed > 0 ? i18n.t('adm.import_confirm_blocked') : '',
        onclick: () => { state.step = 4; rerender(); }
      }, i18n.t('common.next'))
    ])
  ];
}

// --- Step 4: confirm import ---
function renderStep4() {
  if (!state.result) {
    return [
      h('p', { style: 'color: var(--c-ink-soft); margin-top: 0' }, `${i18n.t('adm.import_confirm')} — ${state.file?.name || ''}`),
      h('button', {
        class: 'btn btn--primary', type: 'button', 'data-action': 'confirm',
        onclick: async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          const original = btn.textContent;
          btn.textContent = i18n.t('common.saving');
          try {
            const total = state.parsed?.total || 8;
            const echecs = state.parsed?.failed || 0;
            const res = await api.post('/admin/etudiants/import', { total, echecs });
            state.result = res?.data || null;
            toastSuccess(i18n.t('adm.import_result_title'));
            state.step = 5;
            rerender();
          } catch (err) {
            toastError(err instanceof ApiError ? err.message : i18n.t('toast.error'));
            btn.disabled = false;
            btn.textContent = original;
          }
        }
      }, i18n.t('adm.import_confirm')),
      h('button', {
        class: 'btn btn--ghost', type: 'button', style: 'margin-inline-start: var(--sp-2)',
        onclick: () => { state.step = 3; rerender(); }
      }, i18n.t('common.previous'))
    ];
  }
  // Already have result — go to step 5
  state.step = 5;
  return renderStep5();
}

// --- Step 5: export codes ---
function renderStep5() {
  if (!state.result) {
    state.step = 4;
    return renderStep4();
  }
  const r = state.result;
  return [
    h('div', { class: 'grid grid--3', style: 'margin-bottom: var(--sp-4)' }, [
      stat(i18n.t('adm.import_total'), r.total),
      stat(i18n.t('adm.import_imported'), r.imported),
      stat(i18n.t('adm.import_failed'), r.echecs)
    ]),
    h('h3', { style: 'margin: var(--sp-4) 0 var(--sp-2)' }, i18n.t('adm.import_codes_count', { n: r.codes.length })),
    h('div', { class: 'table-wrap' }, [
      h('table', { class: 'table' }, [
        h('thead', {}, h('tr', {}, [
          h('th', {}, i18n.t('adm.import_column_matricule')),
          h('th', {}, i18n.t('adm.accounts_temp_password'))
        ])),
        h('tbody', {}, r.codes.map((c) => h('tr', {}, [
          h('td', { class: 'table__ref' }, c.matricule),
          h('td', { style: 'font-family: var(--font-mono)' }, c.code)
        ])))
      ])
    ]),
    h('div', { class: 'form-actions form-actions--end', style: 'margin-top: var(--sp-4)' }, [
      h('button', {
        class: 'btn btn--secondary', type: 'button',
        onclick: () => {
          try {
            const rows = [['matricule', 'code_activation'], ...r.codes.map((c) => [c.matricule, c.code])];
            downloadCsv('codes-activation.csv', rows);
            toastSuccess(i18n.t('adm.import_export_codes'));
          } catch (e) { toastError(String(e)); }
        }
      }, i18n.t('adm.import_export_codes')),
      h('button', {
        class: 'btn btn--primary', type: 'button',
        onclick: () => {
          // Reset pipeline
          state = { step: 1, file: null, parsed: null, result: null };
          rerender();
        }
      }, i18n.t('adm.import_step_done'))
    ])
  ];
}

// --- Helpers ---
function stat(label, value, variant = 'neutral') {
  return h('div', { class: 'stat-card' }, [
    h('div', { class: 'stat-card__label' }, label),
    h('div', { class: `stat-card__value${variant === 'danger' ? ' stat-card__value--danger' : ''}` }, String(value))
  ]);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c == null ? '' : c);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Mock parser — génère un rapport avec N lignes dont ~M erreurs aléatoires. */
function parseMockCsv(file) {
  // On simule 12 lignes dont 2 erreurs aléatoires
  const total = 12;
  const errorLines = new Set();
  while (errorLines.size < 2) errorLines.add(2 + Math.floor(Math.random() * 10));
  const lines = [];
  for (let i = 1; i <= total; i++) {
    const isError = errorLines.has(i);
    lines.push({
      line: i,
      matricule: `202600${String(90 + i).padStart(2, '0')}`,
      error: isError ? 'matricule invalide (8 chiffres requis)' : null
    });
  }
  const failed = lines.filter((l) => l.error).length;
  return { total, imported: total - failed, failed, lines };
}

// Style additions (stepper, alert, stat-card value danger)
const style = document.createElement('style');
style.textContent = `
  .stepper { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
  .stepper__item { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); background: var(--c-surface-alt); min-width: 0; }
  .stepper__item--active { background: var(--c-ink); color: var(--c-primary-ink); }
  .stepper__item--done { color: var(--c-success); }
  .stepper__dot { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--c-surface); border: 1px solid var(--c-line); font-size: var(--fs-xs); font-weight: var(--fw-semibold); flex-shrink: 0; }
  .stepper__item--active .stepper__dot { background: var(--c-primary-ink); color: var(--c-ink); border-color: var(--c-ink); }
  .stepper__item--done .stepper__dot { background: var(--c-success-bg); color: var(--c-success); border-color: var(--c-success); }
  .stepper__label { font-size: var(--fs-sm); }
  .alert { padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); font-size: var(--fs-sm); border: 1px solid var(--c-line-soft); }
  .alert--warning { background: var(--c-warning-bg); color: var(--c-warning); border-color: var(--c-warning); }
  .alert--success { background: var(--c-success-bg); color: var(--c-success); border-color: var(--c-success); }
  .alert--danger { background: var(--c-danger-bg); color: var(--c-danger); border-color: var(--c-danger); }
  .stat-card__value--danger { color: var(--c-danger); }
`;
document.head.appendChild(style);

load();
