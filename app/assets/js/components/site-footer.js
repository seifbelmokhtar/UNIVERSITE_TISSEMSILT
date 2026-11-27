/**
 * COMPOSANT : SiteFooter — pied de page public
 */
import { i18n } from '../core/i18n.js';
import { h } from '../core/dom.js';

export function renderSiteFooter() {
  const year = new Date().getFullYear();

  const about = h('div', { class: 'site-footer__col' }, [
    h('h4', {}, i18n.t('footer.about')),
    h('p', { style: 'font-size: var(--fs-sm); color: var(--c-ink-soft)' }, i18n.t('app.institution')),
    h('p', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted); margin-top: var(--sp-2)' },
      i18n.t('footer.note'))
  ]);

  const quickLinks = h('div', { class: 'site-footer__col' }, [
    h('h4', {}, i18n.t('footer.quick_links')),
    h('ul', {}, [
      li('/pages/public/home.html', i18n.t('nav.home')),
      li('/pages/public/services.html', i18n.t('nav.services')),
      li('/pages/public/news.html', i18n.t('nav.news')),
      li('/pages/public/verify.html', i18n.t('nav.verify')),
      li('/pages/public/login.html', i18n.t('nav.login'))
    ])
  ]);

  const accessLinks = h('div', { class: 'site-footer__col' }, [
    h('h4', {}, i18n.t('footer.legal')),
    h('ul', {}, [
      li('/pages/public/facultes.html', i18n.t('nav.faculties')),
      li('/pages/public/links.html', i18n.t('nav.links')),
      li('/pages/public/contact.html', i18n.t('nav.contact'))
    ])
  ]);

  const langLinks = h('div', { class: 'site-footer__col' }, [
    h('h4', {}, i18n.lang === 'ar' ? 'اللغة' : (i18n.lang === 'fr' ? 'Langue' : 'Language')),
    h('ul', {}, [
      li('#', 'العربية'),
      li('#', 'Français'),
      li('#', 'English')
    ])
  ]);

  const footer = h('footer', { class: 'site-footer' }, [
    h('div', { class: 'site-footer__grid' }, [about, quickLinks, accessLinks, langLinks]),
    h('div', { class: 'site-footer__bottom' }, [
      i18n.t('footer.copyright', { year }),
      ' — ',
      i18n.t('footer.powered_by')
    ])
  ]);

  return footer;
}

function li(href, label) {
  return h('li', {}, [h('a', { href }, label)]);
}
