/**
 * PAGE : PUB-01 — Accueil (espace public) — v2 redesign
 * ------------------------------------------------------------------
 * Hero avec image + stats + quick access + actualités avec images
 */
import { i18n } from '../core/i18n.js';
import { api } from '../api/client.js';
import { bootstrapPage, mountPage } from '../core/router.js';
import { renderSiteHeader } from '../components/site-header.js';
import { renderSiteFooter } from '../components/site-footer.js';
import { h, formatDate } from '../core/dom.js';
import { loadingState, emptyState } from '../components/states.js';
import { initReveal } from '../core/utils.js';

bootstrapPage({ title: i18n.t('nav.home') });

async function loadHome() {
  const [header, mobileMenu] = renderSiteHeader({ activeKey: 'home' });
  const footer = renderSiteFooter();

  const main = h('main', { id: 'main-content' }, [
    renderHero(),
    renderQuickAccess(),
    renderServicesPreview(),
    renderNewsSection()
  ]);

  mountPage([header, mobileMenu, main, footer]);

  // Charger les actualités
  await loadNews();

  // Scroll header shadow
  initScrollHeader();

  // Reveal animations
  setTimeout(() => initReveal(), 100);
}

function renderHero() {
  const isAuth = api.isAuthenticated;
  const isAr = i18n.lang === 'ar';

  return h('section', { class: 'hero' }, [
    h('div', { class: 'hero__inner' }, [
      h('div', { class: 'hero__content', 'data-reveal': 'true' }, [
        h('span', { class: 'hero__eyebrow' }, [
          h('span', { class: 'icon icon--shield-check icon--xs' }),
          document.createTextNode(isAr ? 'منصة موحدة وموثوقة' : 'Plateforme unifiée et sécurisée')
        ]),
        h('h1', { class: 'hero__title' }, i18n.t('public.hero_title')),
        h('p', { class: 'hero__subtitle' }, i18n.t('public.hero_subtitle')),
        h('div', { class: 'hero__actions' }, [
          h('a', {
            href: isAuth
              ? (api.currentUser?.role === 'etudiant' ? '/pages/student/dashboard.html' : '/pages/admin/dashboard.html')
              : '/pages/public/login.html',
            class: 'btn btn--primary btn--xl'
          }, [
            document.createTextNode(i18n.t('public.hero_cta_primary')),
            h('span', { class: 'icon icon--arrow-right icon--sm' })
          ]),
          h('a', { href: '/pages/public/verify.html', class: 'btn btn--secondary btn--lg' }, [
            h('span', { class: 'icon icon--qr icon--sm' }),
            document.createTextNode(i18n.t('public.hero_cta_secondary'))
          ])
        ]),
        h('div', { class: 'hero__stats' }, [
          h('div', { class: 'hero__stat' }, [
            h('div', { class: 'hero__stat-value' }, '5'),
            h('div', { class: 'hero__stat-label' }, isAr ? 'خدمات جامعية' : 'Services universitaires')
          ]),
          h('div', { class: 'hero__stat' }, [
            h('div', { class: 'hero__stat-value' }, '3'),
            h('div', { class: 'hero__stat-label' }, isAr ? 'لغات مدعومة' : 'Langues')
          ]),
          h('div', { class: 'hero__stat' }, [
            h('div', { class: 'hero__stat-value' }, '24/7'),
            h('div', { class: 'hero__stat-label' }, isAr ? 'متاحة دائماً' : 'Disponible')
          ])
        ])
      ]),
      h('div', { class: 'hero__visual', 'data-reveal': 'true', 'data-reveal-delay': '200' }, [
        h('img', {
          src: '/assets/images/campus-hero-v2.jpg',
          alt: isAr ? 'حرم سمارت كامبس دي زي' : 'Campus Smart Campus DZ',
          loading: 'lazy'
        }),
        h('div', { class: 'hero__visual-badge' }, [
          h('div', { class: 'logo-mark', style: 'width: 36px; height: 36px; flex-shrink: 0' }, [
            h('span', { class: 'icon icon--graduation icon--sm', style: 'color: white' })
          ]),
          h('div', {}, [
            h('div', { style: 'font-size: var(--fs-sm); font-weight: var(--fw-bold); color: var(--c-ink)' },
              isAr ? 'سمارت كامبس دي زي' : 'Smart Campus DZ'),
            h('div', { style: 'font-size: var(--fs-xs); color: var(--c-ink-muted)' },
              isAr ? 'المنصة الجزائرية الذكية للحياة الجامعية' : 'Smart Campus DZ')
          ])
        ])
      ])
    ])
  ]);
}

function renderQuickAccess() {
  const isAr = i18n.lang === 'ar';
  const cards = [
    { href: '/pages/public/services.html', icon: 'services', label: i18n.t('public.quick_services'), hint: isAr ? '5 خدمات متاحة' : '5 services disponibles' },
    { href: '/pages/public/news.html', icon: 'news', label: i18n.t('public.quick_news'), hint: isAr ? 'آخر المستجدات' : 'Dernières actualités' },
    { href: '/pages/public/announcements.html', icon: 'megaphone', label: i18n.t('public.quick_announcements'), hint: isAr ? 'إعلانات رسمية' : 'Annonces officielles' },
    { href: '/pages/public/verify.html', icon: 'qr', label: i18n.t('public.quick_verify'), hint: isAr ? 'تصديق الوثائق' : 'Authentification documents' }
  ];

  return h('section', { class: 'section section--tight' }, [
    h('div', { class: 'container' }, [
      h('div', { class: 'section-header', 'data-reveal': 'true' }, [
        h('div', {}, [
          h('div', { class: 'section-header__eyebrow' }, isAr ? 'وصول سريع' : 'Accès rapide'),
          h('h2', { class: 'section-header__title' }, isAr ? 'ابدأ من هنا' : 'Commencez ici')
        ])
      ]),
      h('div', { class: 'grid grid--4' }, cards.map((c, i) =>
        h('a', {
          href: c.href, class: 'quick-card',
          'data-reveal': 'true', 'data-reveal-delay': String(i * 80)
        }, [
          h('div', { class: 'quick-card__icon' }, [h('span', { class: `icon icon--${c.icon}` })]),
          h('div', { class: 'quick-card__label' }, c.label),
          h('div', { class: 'quick-card__hint' }, c.hint)
        ])
      ))
    ])
  ]);
}

function renderServicesPreview() {
  const isAr = i18n.lang === 'ar';
  return h('section', { class: 'section section--tight', style: 'background: var(--c-surface-alt)' }, [
    h('div', { class: 'container' }, [
      h('div', { class: 'section-header', 'data-reveal': 'true' }, [
        h('div', {}, [
          h('div', { class: 'section-header__eyebrow' }, isAr ? 'الخدمات الجامعية' : 'Services universitaires'),
          h('h2', { class: 'section-header__title' }, isAr ? 'خمس خدمات في منصة واحدة' : 'Cinq services, une plateforme'),
          h('p', { class: 'section-header__subtitle' }, i18n.t('public.services_intro'))
        ]),
        h('a', { href: '/pages/public/services.html', class: 'btn-link' }, [
          document.createTextNode(i18n.t('etu.view_all')),
          h('span', { class: 'icon icon--arrow-right icon--sm' })
        ])
      ]),
      h('div', { class: 'grid grid--3', id: 'services-preview', 'data-reveal': 'true' }, [
        loadingState()
      ])
    ])
  ]);
}

function renderNewsSection() {
  const isAr = i18n.lang === 'ar';
  return h('section', { class: 'section' }, [
    h('div', { class: 'container' }, [
      h('div', { class: 'section-header', 'data-reveal': 'true' }, [
        h('div', {}, [
          h('div', { class: 'section-header__eyebrow' }, isAr ? 'آخر الأخبار' : 'Dernières actualités'),
          h('h2', { class: 'section-header__title' }, isAr ? 'ما الجديد في الجامعة' : 'À la une de l\'université')
        ]),
        h('a', { href: '/pages/public/news.html', class: 'btn-link' }, [
          document.createTextNode(i18n.t('etu.view_all')),
          h('span', { class: 'icon icon--arrow-right icon--sm' })
        ])
      ]),
      h('div', { class: 'grid grid--2', id: 'news-grid' }, [loadingState()])
    ])
  ]);
}

async function loadNews() {
  try {
    const res = await api.get('/public/actualites');
    const items = (res?.data || []).slice(0, 4);
    const grid = document.querySelector('#news-grid');
    if (grid) {
      grid.innerHTML = '';
      if (items.length === 0) {
        grid.appendChild(emptyState({ message: i18n.t('common.no_results') }));
      } else {
        items.forEach((item, i) => {
          grid.appendChild(renderNewsCard(item, i * 80));
        });
        setTimeout(() => initReveal(), 50);
      }
    }
  } catch (err) {
    const grid = document.querySelector('#news-grid');
    if (grid) { grid.innerHTML = ''; grid.appendChild(emptyState({ message: err.message || i18n.t('common.error') })); }
  }

  // Load services preview
  try {
    const res = await api.get('/public/services');
    const items = (res?.data || []).slice(0, 6);
    const preview = document.querySelector('#services-preview');
    if (preview) {
      preview.innerHTML = '';
      items.forEach((s, i) => {
        preview.appendChild(renderServiceMiniCard(s, i * 60));
      });
      setTimeout(() => initReveal(), 50);
    }
  } catch (_) {}
}

function renderNewsCard(item, delay = 0) {
  const title = i18n.localized(item, 'titre');
  const content = i18n.localized(item, 'contenu');
  const cat = i18n.t(`public.news_categories.${item.categorie}`);
  const isAr = i18n.lang === 'ar';

  // Use generated clean images (no watermarks)
  const images = ['/assets/images/graduation-v2.jpg', '/assets/images/students-library-v2.jpg', '/assets/images/classroom-v2.jpg', '/assets/images/science-lab.jpg'];
  const img = images[item.id % images.length];

  return h('article', {
    class: 'card card--interactive',
    'data-reveal': 'true', 'data-reveal-delay': String(delay)
  }, [
    h('div', { class: 'card__media' }, [
      h('img', { src: img, alt: title, loading: 'lazy' }),
      h('div', { class: 'card__media-overlay' }, [
        h('span', { class: 'badge badge--neutral' }, cat)
      ])
    ]),
    h('div', { class: 'card__body' }, [
      h('div', { style: 'display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2); font-size: var(--fs-xs); color: var(--c-ink-muted)' }, [
        h('span', { class: 'icon icon--calendar icon--xs' }),
        document.createTextNode(formatDate(item.publie_le))
      ]),
      h('h3', { style: 'font-size: var(--fs-md); font-weight: var(--fw-semibold); margin-bottom: var(--sp-2); line-height: var(--lh-snug); letter-spacing: -0.01em' }, title || i18n.t('common.empty')),
      h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); line-height: var(--lh-normal); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden' },
        (content || '').slice(0, 140) + ((content || '').length > 140 ? '…' : '')),
      h('a', {
        href: `/pages/public/news.html?id=${item.id}`,
        class: 'btn-link', style: 'margin-top: var(--sp-3)'
      }, [
        document.createTextNode(i18n.t('public.read_more')),
        h('span', { class: 'icon icon--arrow-right icon--sm' })
      ])
    ])
  ]);
}

function renderServiceMiniCard(s, delay = 0) {
  const isAr = i18n.lang === 'ar';
  const nom = isAr ? s.nom_ar : (s.nom_fr || s.nom_ar);
  const desc = isAr ? s.description_ar : (s.description_fr || s.description_ar);
  const iconMap = { bourse: 'wallet', hebergement: 'home-roof', transport: 'bus', restauration: 'utensils', sante: 'heart-pulse' };

  return h('a', {
    href: '/pages/public/services.html',
    class: 'card card--pad card--interactive',
    'data-reveal': 'true', 'data-reveal-delay': String(delay)
  }, [
    h('div', { class: 'stat-card__icon', style: 'margin-bottom: var(--sp-3)' }, [
      h('span', { class: `icon icon--${iconMap[s.code] || 'services'} icon--lg` })
    ]),
    h('h3', { style: 'font-size: var(--fs-md); font-weight: var(--fw-semibold); margin-bottom: var(--sp-2)' }, nom),
    h('p', { class: 'u-text-soft', style: 'font-size: var(--fs-sm); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden' }, desc)
  ]);
}

function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('site-header--scrolled', window.scrollY > 8);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

loadHome().catch((err) => console.error('home load error', err));
