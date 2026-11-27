/**
 * COMPOSANT : EmptyState, LoadingState, ErrorState, StatCard
 * — patterns réutilisables pour les états.
 */
import { i18n } from '../core/i18n.js';
import { h } from '../core/dom.js';

export function emptyState({ title = null, message = null, action = null } = {}) {
  return h('div', { class: 'empty-state' }, [
    h('div', { class: 'empty-state__icon', 'aria-hidden': 'true', html: svgEmpty() }),
    h('div', { class: 'empty-state__title' }, title || i18n.t('common.empty')),
    h('div', { class: 'empty-state__text' }, message || ''),
    action ? h('div', {}, action) : null
  ]);
}

export function loadingState(message = null) {
  return h('div', { class: 'loading-state', role: 'status', 'aria-live': 'polite' }, [
    h('div', { class: 'spinner', 'aria-hidden': 'true' }),
    h('span', {}, message || i18n.t('common.loading'))
  ]);
}

export function errorState({ message = null, onRetry = null } = {}) {
  return h('div', { class: 'empty-state', role: 'alert' }, [
    h('div', { class: 'empty-state__icon', 'aria-hidden': 'true', html: svgError() }),
    h('div', { class: 'empty-state__title' }, i18n.t('common.error')),
    h('div', { class: 'empty-state__text' }, message || ''),
    onRetry ? h('button', { class: 'btn btn--secondary', type: 'button', onclick: onRetry }, i18n.t('common.retry')) : null
  ]);
}

export function statCard({ label, value, meta = null }) {
  return h('div', { class: 'stat-card' }, [
    h('div', { class: 'stat-card__label' }, label),
    h('div', { class: 'stat-card__value' }, String(value)),
    meta ? h('div', { class: 'stat-card__meta' }, meta) : null
  ]);
}

function svgEmpty() {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <path d="M8 12h8" stroke-dasharray="2 2"/>
  </svg>`;
}

function svgError() {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4M12 16v.5"/>
  </svg>`;
}
