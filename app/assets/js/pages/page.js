/**
 * PAGE : PUB-07 — Page générique de contenu
 * ------------------------------------------------------------------
 * Routeur de page de contenu : lit le paramètre URL ?code=...
 * Si le code correspond à une page spécialisée, redirige vers celle-ci.
 * Sinon affiche une page 404 générique (page introuvable).
 */
import { i18n } from '../core/i18n.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h } from '../core/dom.js';

bootstrapPage({ title: i18n.t('app.name') });

// Mapping code → page spécialisée
const PAGE_MAP = {
  presentation: '/pages/public/presentation.html',
  facultes: '/pages/public/facultes.html',
  formation: '/pages/public/formation.html',
  recherche: '/pages/public/recherche.html',
  vie_universitaire: '/pages/public/vie-universitaire.html'
};

function load() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  // Si le code correspond à une page spécialisée → redirection immédiate
  if (code && PAGE_MAP[code]) {
    window.location.replace(PAGE_MAP[code]);
    return;
  }

  // Sinon : afficher une page 404 générique
  renderNotFound(code);
}

function renderNotFound(code) {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: null });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content', class: 'container', style: 'padding-top: var(--sp-12); padding-bottom: var(--sp-12)' }, [
    h('div', { class: 'page-not-found' }, [
      h('div', { class: 'page-not-found__code', 'aria-hidden': 'true' }, '404'),
      h('h1', { class: 'page-not-found__title' }, i18n.t('public.page_not_found_title')),
      h('p', { class: 'page-not-found__message' }, i18n.t('public.page_not_found_message')),
      code
        ? h('p', { class: 'page-not-found__code-ref u-text-muted', style: 'font-size: var(--fs-xs); margin-top: var(--sp-3)' },
            'code: ' + code)
        : null,
      h('div', { class: 'page-not-found__actions' }, [
        h('a', { href: '/pages/public/home.html', class: 'btn btn--primary' },
          i18n.t('public.page_back_home'))
      ])
    ])
  ]);

  mountPage([header, mobileMenu, main, footer]);
}

load();

const style = document.createElement('style');
style.textContent = `
  .page-not-found {
    max-width: 640px;
    margin-inline: auto;
    text-align: center;
    padding: var(--sp-8) var(--sp-4);
  }
  .page-not-found__code {
    font-size: var(--fs-5xl);
    font-weight: var(--fw-bold);
    color: var(--c-ink-faint);
    line-height: 1;
    margin-bottom: var(--sp-4);
    font-family: var(--font-mono);
  }
  .page-not-found__title {
    font-size: var(--fs-2xl);
    margin-bottom: var(--sp-3);
    color: var(--c-ink);
  }
  .page-not-found__message {
    font-size: var(--fs-md);
    color: var(--c-ink-soft);
    max-width: 50ch;
    margin-inline: auto;
    line-height: var(--lh-relaxed);
  }
  .page-not-found__actions {
    margin-top: var(--sp-6);
    display: flex;
    gap: var(--sp-3);
    justify-content: center;
    flex-wrap: wrap;
  }
`;
document.head.appendChild(style);
