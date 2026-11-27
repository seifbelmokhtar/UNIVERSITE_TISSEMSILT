/**
 * UTILS — Scroll reveal + Theme toggle + Micro-interactions
 * ------------------------------------------------------------------
 * - IntersectionObserver لـ [data-reveal]
 * - Theme toggle (light/dark/auto) مع persistance
 * - Respect prefers-reduced-motion
 *
 * استعمال:
 *   import { initReveal, initThemeToggle } from '../core/utils.js';
 *   initReveal();
 *   initThemeToggle();
 *
 * أوتماتيكياً إذا المستخدم دير [data-reveal] في HTML
 */

/* ============ 1. SCROLL REVEAL ============ */
export function initReveal() {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const els = document.querySelectorAll('[data-reveal]:not(.is-revealed)');
  if (!els.length) return;

  // Check si IO supporté
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.revealDelay
          ? parseInt(entry.target.dataset.revealDelay, 10)
          : 0;
        setTimeout(() => entry.target.classList.add('is-revealed'), delay);
        io.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  els.forEach((el) => io.observe(el));
}

/* ============ 2. THEME TOGGLE ============ */
const THEME_KEY = 'ut_theme';

export function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
}

export function setStoredTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}

export function applyTheme(theme) {
  // theme: 'light' | 'dark' | 'auto'
  const effective = theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  if (effective === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  // Update toggle buttons
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(effective === 'dark'));
    btn.dataset.currentTheme = effective;
  });
}

export function initThemeToggle() {
  // Load stored or default to 'auto'
  const stored = getStoredTheme() || 'auto';
  applyTheme(stored);

  // Listen to system preference change if auto
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = getStoredTheme() || 'auto';
    if (current === 'auto') applyTheme('auto');
  });

  // Wire toggles
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = getStoredTheme() || 'auto';
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      setStoredTheme(next);
      applyTheme(next);
    });
  });
}

/* ============ 3. RIPPLE EFFECT (subtle) — لل boutons primary ============ */
export function initRipple() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn--primary, .btn--accent');
    if (!target || target.disabled) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn__ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/* ============ 4. STAGGER REVEAL helper — pour les listes ============ */
export function staggerReveal(container, delayStep = 60) {
  if (!container) return;
  const children = container.querySelectorAll('[data-reveal]');
  children.forEach((child, i) => {
    child.dataset.revealDelay = String(i * delayStep);
  });
  initReveal();
}

/* ============ 5. AUTO-INIT au chargement ============ */
if (typeof document !== 'undefined') {
  // Auto-init reveal quand DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initReveal();
      initThemeToggle();
    });
  } else {
    initReveal();
    initThemeToggle();
  }
}
