import { SITE } from '../data/site.js';
import { COLLECTIONS } from '../data/catalog.js';

export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPln(num) {
  return new Intl.NumberFormat('pl-PL').format(Math.round(num)) + ' zł';
}

export function renderBreadcrumbs(items) {
  if (!items || items.length < 2) return '';
  return `
    <nav class="fz-breadcrumbs" aria-label="Ścieżka nawigacji">
      <div class="container">
        <ol>
          ${items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return isLast
              ? `<li aria-current="page">${esc(item.name)}</li>`
              : `<li><a href="${esc(item.href)}">${esc(item.name)}</a></li>`;
          }).join('')}
        </ol>
      </div>
    </nav>
  `;
}

export function renderLayout({
  title,
  description,
  canonicalPath,
  ogImage = SITE.ogDefaultImage,
  ogType = 'website',
  robots = 'index, follow, max-image-preview:large, max-snippet:-1',
  preloadImage = null,
  activeNav = '',
  breadcrumbs = null,
  schemas = [],
  bodyHtml = ''
}) {
  const canonicalUrl = `${SITE.url}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SITE.url}${ogImage}`;

  const schemaTags = schemas
    .filter(Boolean)
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');

  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${esc(robots)}">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#160d09">

  <!-- Open Graph / Social -->
  <meta property="og:locale" content="${SITE.locale}">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:image" content="${esc(fullOgImage)}">
  <meta property="og:image:alt" content="${esc(title)}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(fullOgImage)}">

  <!-- Performance & Core Web Vitals -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,300;1,400&family=Tenor+Sans&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  ${preloadImage ? `<link rel="preload" as="image" href="${esc(preloadImage)}" fetchpriority="high">` : ''}
  <link rel="stylesheet" href="/css/frezze-store.css">

  <!-- Google Search Central Structured Data (JSON-LD) -->
  ${schemaTags}
</head>
<body>
  <a href="#main-content" class="skip-link">Przejdź do głównej treści</a>

  <header class="fz-header">
    <div class="fz-header__inner">
      <a href="/" class="fz-brand" aria-label="FREZZE — strona główna">
        <span class="fz-mark" aria-hidden="true">F</span>
        <span class="fz-wordmark">FREZZE</span>
      </a>

      <nav class="fz-nav" id="fz-main-nav" aria-label="Nawigacja główna">
        ${SITE.nav.map((item) => `<a href="${item.href}"${activeNav === item.href ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`).join('')}
      </nav>

      <div class="fz-header__actions">
        <button type="button" class="fz-icon-btn" data-open-cart aria-label="Otwórz koszyk">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
          Koszyk <span class="fz-cart-badge" data-cart-count>0</span>
        </button>
        <button type="button" class="fz-icon-btn fz-menu-toggle" data-menu-toggle aria-label="Menu">Menu</button>
      </div>
    </div>
  </header>

  ${renderBreadcrumbs(breadcrumbs)}

  <main id="main-content">
    ${bodyHtml}
  </main>

  <footer class="fz-footer">
    <div class="container">
      <div class="fz-footer__grid">
        <div>
          <div class="fz-wordmark" style="color:var(--fz-calce);font-size:24px;padding-left:0;">FREZZE</div>
          <p class="fz-mono" style="margin:12px 0 18px;color:var(--fz-ottone-bright);">Atelier Frezowanych Paneli · MMXXVI</p>
          <p style="font-family:var(--fz-editorial);font-style:italic;font-size:18px;color:rgba(242,236,224,0.82);max-width:34ch;">
            Wielkoformatowe panele ścienne frezowane CNC z amerykańskiego orzecha Canaletto. Zaprojektowane w Mediolanie, wykonane w Warszawie.
          </p>
        </div>

        <div>
          <h4>Kolekcje paneli</h4>
          <ul>
            ${COLLECTIONS.map((c) => `<li><a href="/kolekcje/${c.slug}/">${esc(c.name)} — ${esc(c.tagline)}</a></li>`).join('')}
          </ul>
        </div>

        <div>
          <h4>Sklep i wiedza</h4>
          <ul>
            <li><a href="/sklep/">Wszystkie panele (26 modeli)</a></li>
            <li><a href="/probki/">Zestaw próbek Noce Canaletto</a></li>
            <li><a href="/poradnik/">Poradnik i baza wiedzy SEO</a></li>
            <li><a href="/proces/">Proces produkcji CNC (12 kroków)</a></li>
            <li><a href="/faq/">Najczęstsze pytania (FAQ)</a></li>
            <li><a href="/atelier/">O atelier FREZZE</a></li>
          </ul>
        </div>

        <div>
          <h4>Showroomy & Kontakt</h4>
          <ul>
            <li><strong>Warszawa:</strong> ul. Mokotowska 12, 00-561</li>
            <li><strong>Milano:</strong> Via Solferino 11, 20121</li>
            <li><a href="tel:+48226284410">+48 22 628 44 10</a></li>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li><a href="/kontakt/">Umów wizytę lub wycenę 1:1 →</a></li>
          </ul>
        </div>
      </div>

      <div class="fz-footer__bottom">
        <span>© 2026 ${SITE.legalName} · Wszelkie prawa zastrzeżone</span>
        <span>
          <a href="/sitemap.xml">Mapa strony XML</a> ·
          <a href="/google-merchant-feed.xml">Merchant Feed</a> ·
          <a href="/robots.txt">robots.txt</a>
        </span>
      </div>
    </div>
  </footer>

  <!-- Slide-over Cart Drawer -->
  <div class="fz-drawer-backdrop" id="fz-cart-backdrop"></div>
  <aside class="fz-drawer" id="fz-cart-drawer" aria-label="Koszyk zakupowy">
    <div class="fz-drawer__head">
      <strong class="fz-display" style="font-size:20px;">Twój koszyk</strong>
      <button type="button" class="fz-icon-btn" data-close-cart aria-label="Zamknij koszyk">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        Zamknij
      </button>
    </div>
    <div class="fz-drawer__body" id="fz-drawer-items"></div>
    <div class="fz-drawer__foot">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;">
        <span class="fz-meta-label">Razem z dostawą</span>
        <strong class="fz-price" id="fz-drawer-subtotal">0 zł</strong>
      </div>
      <a href="/koszyk/" class="btn btn--primary" style="width:100%;">Przejdź do zamówienia</a>
    </div>
  </aside>

  <script src="/js/store.js" defer></script>
</body>
</html>`;
}
