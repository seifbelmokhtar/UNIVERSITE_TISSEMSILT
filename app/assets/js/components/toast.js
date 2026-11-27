/**
 * COMPOSANT : Toast — notifications éphémères
 */
import { i18n } from '../core/i18n.js';
import { h } from '../core/dom.js';

let container = null;

function ensureContainer() {
  if (!container) {
    container = h('div', { class: 'toast-container', 'aria-live': 'polite', 'aria-atomic': 'false' });
    document.body.appendChild(container);
  }
  return container;
}

export function toast({ title = '', message = '', type = 'info', duration = 4000 } = {}) {
  const el = h('div', { class: `toast toast--${type}`, role: 'status' }, [
    title ? h('div', { class: 'toast__title' }, title) : null,
    message ? h('div', { class: 'toast__body' }, message) : null
  ]);
  ensureContainer().appendChild(el);

  const dismiss = () => {
    el.style.transition = 'opacity 200ms, transform 200ms';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 220);
  };

  if (duration > 0) setTimeout(dismiss, duration);

  // Auto-dismiss on click
  el.addEventListener('click', dismiss);

  // Keyboard: Escape dismisses focused toast
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') dismiss(); });

  return { dismiss };
}

export function toastSuccess(message, title = null) {
  return toast({ title: title || i18n.t('toast.saved'), message, type: 'success' });
}
export function toastError(message, title = null) {
  return toast({ title: title || i18n.t('toast.error'), message, type: 'danger' });
}
export function toastInfo(message, title = '') {
  return toast({ title, message, type: 'info' });
}
