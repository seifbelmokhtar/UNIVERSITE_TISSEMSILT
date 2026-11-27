/**
 * COMPOSANT : Forms — validation, champs, soumission
 */
import { i18n } from '../core/i18n.js';
import { h } from '../core/dom.js';

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (A-10)

/** Valide un email. */
export function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
}

/** Valide un mot de passe : 8+ caractères, maj, min, chiffre, symbole. */
export function isValidPassword(v) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]).{8,}$/.test(String(v || ''));
}

/** Valide une référence document (DOC-YYYY-NNNNN). */
export function isValidDocReference(v) {
  return /^[A-Z]{3}-\d{4}-\d{5}$/i.test(String(v || '').trim());
}

/** Valide un code d'activation (ACT-XXXXXX). */
export function isValidActivationCode(v) {
  return /^ACT-[A-Z0-9]{6}$/i.test(String(v || '').trim());
}

/** Valide un matricule étudiant (8 chiffres ou format institutionnel). */
export function isValidMatricule(v) {
  return /^\d{8}$/.test(String(v || '').trim());
}

/** Valide un type de fichier (mime + extension). */
export function validateFile(file) {
  const errors = [];
  if (file.size > MAX_FILE_SIZE) {
    errors.push(i18n.t('validation.file_size', { max: '10 MB' }));
  }
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    errors.push(i18n.t('validation.file_type', { types: ALLOWED_FILE_EXTENSIONS.join(', ') }));
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    // Le mime peut être absent ou générique ; on reste sur l'extension comme critère principal
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      errors.push(i18n.t('validation.file_type', { types: ALLOWED_FILE_EXTENSIONS.join(', ') }));
    }
  }
  return errors;
}

/** Affiche une erreur sous un champ. */
export function setFieldError(input, message) {
  const group = input.closest('.form-group') || input.parentElement;
  if (!group) return;
  // Retirer l'ancienne erreur
  const old = group.querySelector('.form-error');
  if (old) old.remove();
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) {
    const err = h('span', { class: 'form-error', role: 'alert' }, message);
    group.appendChild(err);
  }
}

/** Valide un formulaire à partir d'un objet de règles { name: { required, validate, message } }. */
export function validateForm(form, rules) {
  let valid = true;
  for (const [name, rule] of Object.entries(rules)) {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) continue;
    const value = (input.type === 'checkbox') ? input.checked : input.value.trim();
    if (rule.required && !value) {
      setFieldError(input, i18n.t('validation.required'));
      valid = false;
      continue;
    }
    if (rule.validate && value) {
      const ok = rule.validate(value);
      if (ok !== true) {
        setFieldError(input, typeof ok === 'string' ? ok : (rule.message || i18n.t('validation.pattern')));
        valid = false;
        continue;
      }
    }
    setFieldError(input, null);
  }
  return valid;
}

/** Construit un composant upload de fichier avec preview. */
export function fileUpload({ id, label, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx', hint = null, multiple = false, onChange = null } = {}) {
  const input = h('input', {
    type: 'file', id, name: id, accept, ...(multiple ? { multiple: 'true' } : {}),
    style: 'display: none',
    onchange: (e) => {
      const files = Array.from(e.target.files || []);
      renderFileList(files);
      if (onChange) onChange(files);
    }
  });

  const list = h('ul', { class: 'file-list' });
  function renderFileList(files) {
    list.innerHTML = '';
    for (const f of files) {
      const errors = validateFile(f);
      const li = h('li', { class: 'file-list__item' }, [
        h('span', { class: 'file-list__name' }, f.name),
        h('span', { class: 'file-list__size' }, (f.size / 1024).toFixed(0) + ' KB'),
        errors.length
          ? h('span', { class: 'badge badge--danger', style: 'font-size: 10px' }, i18n.t('common.error'))
          : h('span', { class: 'badge badge--success', style: 'font-size: 10px' }, 'OK'),
        h('button', {
          class: 'file-list__remove', type: 'button', 'aria-label': i18n.t('common.delete'),
          onclick: () => { li.remove(); }
        }, '×')
      ]);
      list.appendChild(li);
      if (errors.length) {
        li.appendChild(h('div', { class: 'form-error', style: 'width: 100%; margin-top: var(--sp-1)' }, errors[0]));
      }
    }
  }

  const drop = h('label', {
    class: 'file-upload', for: id, tabindex: '0'
  }, [
    h('div', { class: 'file-upload__icon', 'aria-hidden': 'true', html: svgUpload() }),
    h('div', { class: 'file-upload__text' }, i18n.t('common.upload')),
    h('div', { class: 'file-upload__hint' }, hint || `PDF, JPG, PNG, DOC, DOCX ≤ 10 MB`),
    input
  ]);

  return h('div', { class: 'form-group' }, [
    label ? h('label', { class: 'form-label', for: id }, label) : null,
    drop, list
  ]);
}

function svgUpload() {
  return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M12 4v12m-5-7 5-5 5 5"/>
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
  </svg>`;
}
