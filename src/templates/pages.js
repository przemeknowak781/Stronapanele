import { SITE } from '../data/site.js';
import {
  COLLECTIONS,
  PRODUCTS,
  FINISHES,
  SAMPLE_BOX,
  getProductAreaM2,
  getPricePerM2,
  getCollectionBySlug,
  getProductsByCollection
} from '../data/catalog.js';
import { ARTICLES, GLOBAL_FAQS } from '../data/articles.js';
import { esc, formatPln, renderLayout } from './layout.js';
import {
  buildOrganizationSchema,
  buildLocalBusinessSchemas,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildProductGroupSchema,
  buildItemListSchema,
  buildArticleSchema,
  buildFaqSchema
} from '../seo/schemas.js';

const STAR_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 14.9 8.4l6.5.9-4.7 4.6 1.1 6.5L12 17.3 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z"/></svg>';
const FIVE_STARS = `<span class="fz-stars" aria-hidden="true">${STAR_SVG.repeat(5)}</span>`;
const ARROW_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';

function renderProductCard(p, eager = false) {
  const col = getCollectionBySlug(p.collection);
  const area = getProductAreaM2(p);
  const perM2 = getPricePerM2(p);
  const searchBlob = `${p.name} ${p.sku} ${col ? col.name : ''} ${p.shortDesc} ${p.millingSpec}`;
  return `
    <article class="fz-product-card" data-collection="${esc(p.collection)}" data-price="${p.price}" data-search="${esc(searchBlob)}">
      <a href="/produkt/${p.slug}/" class="fz-product-card__media">
        <img src="${esc(p.image)}" alt="${esc(p.fullName)} — frezowany panel ścienny z orzecha" width="800" height="600" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
      </a>
      <div class="fz-product-card__body">
        <div class="fz-product-card__top">
          <a href="/produkt/${p.slug}/" class="fz-product-card__title">${esc(p.name)}</a>
          <span class="fz-data">${esc(p.sku)}</span>
        </div>
        <p class="fz-product-card__desc">${esc(p.shortDesc)}</p>
        <div class="fz-product-card__specs">
          <span>${p.widthMm}×${p.heightMm}×${p.thicknessMm} mm</span>
          <span>${area} m²</span>
        </div>
        <div class="fz-product-card__price-row">
          <span class="fz-price">${formatPln(p.price)}</span>
          <span class="fz-price-m2">${formatPln(perM2)} / m²</span>
        </div>
        <div class="fz-product-card__actions">
          <button type="button" class="btn btn--primary btn--sm"
            data-add-cart
            data-sku="${esc(p.sku)}"
            data-name="${esc(p.fullName)}"
            data-price="${p.price}"
            data-image="${esc(p.image)}">Dodaj do koszyka</button>
          <a href="/produkt/${p.slug}/" class="btn btn--outline btn--sm">Szczegóły</a>
        </div>
      </div>
    </article>
  `;
}

function renderFaqBlock(faqs) {
  return `
    <div class="fz-faq-list">
      ${faqs.map((f, i) => `
        <details class="fz-faq-item"${i === 0 ? ' open' : ''}>
          <summary>${esc(f.q)}</summary>
          <div class="fz-faq-item__answer">${esc(f.a)}</div>
        </details>
      `).join('')}
    </div>
  `;
}

/* ── 1. HOMEPAGE ────────────────────────────────────────────────────── */
export function renderHomePage() {
  const featured = PRODUCTS.filter((p) => p.featured).slice(0, 6);
  const bodyHtml = `
    <section class="fz-hero">
      <img src="/assets/collections/interni/interno-stadio-penthouse.webp" alt="Frezowane panele ścienne z orzecha amerykańskiego FREZZE Stadio w jasnym salonie" class="fz-hero__img" width="1600" height="1067" fetchpriority="high" decoding="async">
      <div class="fz-hero__veil"></div>
      <div class="fz-hero__content">
        <div class="container">
          <div class="fz-hero__inner">
            <h1>Frezowane panele ścienne z orzecha</h1>
            <p class="fz-hero__lead">
              Wielkoformatowe płyty CNC z amerykańskiego orzecha Canaletto — projektowane w Mediolanie, wykonywane w Warszawie.
            </p>
            <div class="fz-hero__actions">
              <a href="/sklep/" class="btn btn--light">Przeglądaj sklep ${ARROW_SVG}</a>
              <a href="/konfigurator/" class="fz-link-quiet">Konfigurator 3D</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="fz-section">
      <div class="container">
        <div class="fz-section-head">
          <div>
            <h2>Siedem kolekcji paneli ściennych</h2>
            <p>Ciągły rysunek frezu przez łączenia płyt, w matowym oleju 5° i wysokości nawet do 3000 mm.</p>
          </div>
          <a href="/kolekcje/" class="btn btn--outline btn--sm">Wszystkie kolekcje</a>
        </div>
        <div class="fz-collections-grid">
          ${COLLECTIONS.map((c) => {
            const count = getProductsByCollection(c.slug).length;
            const minPrice = Math.min(...getProductsByCollection(c.slug).map((p) => p.price));
            return `
              <a href="/kolekcje/${c.slug}/" class="fz-collection-card">
                <div class="fz-collection-card__media">
                  <img src="${esc(c.cardImage)}" alt="Kolekcja frezowanych paneli ${esc(c.name)} — ${esc(c.tagline)}" width="800" height="600" loading="lazy" decoding="async">
                </div>
                <div class="fz-collection-card__body">
                  <h3>${esc(c.name)}</h3>
                  <p>${esc(c.tagline)} — ${esc(c.headline)}</p>
                  <div class="fz-collection-card__foot">
                    <span>${count} ${count === 1 ? 'wariant' : count < 5 ? 'warianty' : 'wariantów'}</span>
                    <span>od ${formatPln(minPrice)}</span>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <section class="fz-section fz-section--calce">
      <div class="container">
        <div class="fz-section-head">
          <div>
            <h2>Najczęściej wybierane panele CNC</h2>
            <p>Każda karta produktu zawiera kalkulator powierzchni ściany (m²) oraz wybór gatunku drewna.</p>
          </div>
          <a href="/sklep/" class="btn btn--primary btn--sm">Wszystkie 26 modeli</a>
        </div>
        <div class="fz-products-grid">
          ${featured.map((p) => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <section class="fz-section fz-section--dark">
      <div class="container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:48px;align-items:center;">
        <div>
          <h2 style="font-size:clamp(30px,3.8vw,46px);margin-bottom:18px;">Sprawdź frez w świetle własnego wnętrza</h2>
          <p class="fz-editorial" style="color:rgba(242,236,224,0.88);margin:0 0 28px;max-width:44ch;">
            Zestaw 4 rzeczywistych formatek 180×180 mm w matowym oleju 5° z darmową wysyłką w 48h. Kwotę 149 zł w całości odliczamy od zamówienia paneli.
          </p>
          <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;">
            <a href="/probki/" class="btn btn--light">Zamów próbki — 149 zł</a>
            <a href="/kontakt/" class="fz-link-quiet">Bezpłatna wycena 1:1</a>
          </div>
        </div>
        <div>
          <img src="/assets/collections/stadio/stadio-miniatura.webp" alt="Próbka frezowanego panelu z orzecha amerykańskiego Stadio Miniatura" width="900" height="675" loading="lazy" decoding="async">
        </div>
      </div>
    </section>

    <section class="fz-section">
      <div class="container">
        <div class="fz-section-head">
          <div>
            <h2>Poradnik i baza wiedzy</h2>
            <p>Montaż, akustyka, dobór drewna i dokumentacja dla architektów przygotowane przez naszą pracownię.</p>
          </div>
          <a href="/poradnik/" class="btn btn--outline btn--sm">Wszystkie poradniki</a>
        </div>
        <div class="fz-articles-grid">
          ${ARTICLES.slice(0, 3).map((a) => `
            <article class="fz-article-card">
              <a href="/poradnik/${a.slug}/" class="fz-article-card__img">
                <img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" width="800" height="500" loading="lazy" decoding="async">
              </a>
              <div class="fz-article-card__body">
                <span class="fz-meta-label">${esc(a.category)} · ${a.readMinutes} min</span>
                <h3><a href="/poradnik/${a.slug}/">${esc(a.title)}</a></h3>
                <p style="font-size:14.5px;color:var(--fz-ink-muted);margin:0;">${esc(a.excerpt)}</p>
                <a href="/poradnik/${a.slug}/" class="fz-meta-label" style="margin-top:auto;padding-top:14px;color:var(--fz-ottone);">Czytaj artykuł</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="fz-section fz-section--calce">
      <div class="container">
        <div class="fz-section-head">
          <h2>Najczęstsze pytania o panele FREZZE</h2>
          <a href="/faq/" class="btn btn--outline btn--sm">Pełne FAQ</a>
        </div>
        ${renderFaqBlock(GLOBAL_FAQS)}
      </div>
    </section>
  `;

  return renderLayout({
    title: 'FREZZE · Frezowane panele ścienne z orzecha amerykańskiego CNC | Sklep',
    description: 'Sklep z wielkoformatowymi frezowanymi panelami ściennymi z orzecha amerykańskiego Canaletto. 7 kolekcji CNC, 26 modeli, kalkulator m², próbki 48h i montaż.',
    canonicalPath: '/',
    preloadImage: '/assets/collections/interni/interno-stadio-penthouse.webp',
    activeNav: '/',
    schemas: [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildItemListSchema(featured, 'Bestsellery frezowanych paneli ściennych FREZZE', '/'),
      buildFaqSchema(GLOBAL_FAQS)
    ],
    bodyHtml
  });
}

/* ── 2. SHOP CATALOG PAGE ───────────────────────────────────────────── */
export function renderShopPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Sklep', href: '/sklep/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:14px;">Frezowane panele ścienne CNC</h1>
        <p style="max-width:66ch;color:var(--fz-ink-muted);margin:0 0 32px;">
          Wybierz gotowy format płyt z orzecha amerykańskiego Canaletto, dębu wędzonego lub jesionu termowanego. Darmowa dostawa od 6 000 zł.
        </p>

        <div class="fz-filter-bar">
          <div class="fz-filter-pills" role="group" aria-label="Filtruj według kolekcji">
            <button type="button" class="fz-pill is-active" data-filter-collection="all">Wszystkie (${PRODUCTS.length})</button>
            ${COLLECTIONS.map((c) => `<button type="button" class="fz-pill" data-filter-collection="${c.slug}">${esc(c.name)}</button>`).join('')}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <input type="search" id="fz-shop-search" placeholder="Szukaj wzoru lub SKU..." aria-label="Szukaj paneli" style="padding:8px 12px;border:var(--fz-hairline);background:#fff;min-width:210px;">
            <select id="fz-shop-sort" aria-label="Sortuj produkty" style="padding:8px 12px;border:var(--fz-hairline);background:#fff;">
              <option value="featured">Polecane</option>
              <option value="price-asc">Cena: od najniższej</option>
              <option value="price-desc">Cena: od najwyższej</option>
            </select>
          </div>
        </div>

        <p class="fz-data" id="fz-shop-count" style="margin-bottom:20px;">Wyświetlono ${PRODUCTS.length} z ${PRODUCTS.length} modeli</p>

        <div class="fz-products-grid" id="fz-shop-grid">
          ${PRODUCTS.map((p, idx) => renderProductCard(p, idx < 4)).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Sklep: Panele ścienne frezowane z orzecha (26 modeli CNC) | FREZZE',
    description: 'Kup wielkoformatowe frezowane panele ścienne z orzecha amerykańskiego Canaletto. 26 modeli w 7 kolekcjach, ceny od 1 190 zł, kalkulator m² i darmowa dostawa od 6 000 zł.',
    canonicalPath: '/sklep/',
    activeNav: '/sklep/',
    breadcrumbs,
    schemas: [
      buildBreadcrumbSchema(breadcrumbs),
      buildItemListSchema(PRODUCTS, 'Katalog frezowanych paneli ściennych FREZZE', '/sklep/')
    ],
    bodyHtml
  });
}

/* ── 3. COLLECTIONS HUB ─────────────────────────────────────────────── */
export function renderCollectionsHubPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Kolekcje', href: '/kolekcje/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:14px;">Siedem kolekcji paneli ściennych</h1>
        <p style="max-width:66ch;color:var(--fz-ink-muted);margin:0 0 36px;">
          Od sygnaturowego owalu Stadio, przez 3-metrową pionową falę Onda, aż po 5-osiową wstęgę Concavo.
        </p>
        <div class="fz-collections-grid">
          ${COLLECTIONS.map((c) => {
            const items = getProductsByCollection(c.slug);
            return `
              <a href="/kolekcje/${c.slug}/" class="fz-collection-card">
                <div class="fz-collection-card__media">
                  <img src="${esc(c.cardImage)}" alt="Kolekcja ${esc(c.name)} — frezowane panele ścienne" width="800" height="600" loading="lazy" decoding="async">
                </div>
                <div class="fz-collection-card__body">
                  <h3>${esc(c.name)}</h3>
                  <p>${esc(c.lede)}</p>
                  <div class="fz-collection-card__foot">
                    <span>${items.length} wariantów · ${esc(c.specs.dimensions)}</span>
                    <span>Otwórz</span>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Kolekcje frezowanych paneli ściennych (Stadio, Onda, Mare, Geometria) | FREZZE',
    description: 'Poznaj 7 autorskich kolekcji frezowanych paneli ściennych CNC z orzecha amerykańskiego: Stadio, Onda, Mare, Arcata, Foglia, Concavo i Geometria.',
    canonicalPath: '/kolekcje/',
    activeNav: '/kolekcje/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs)],
    bodyHtml
  });
}

/* ── 4. COLLECTION DETAIL PAGE ──────────────────────────────────────── */
export function renderCollectionPage(col) {
  const products = getProductsByCollection(col.slug);
  const breadcrumbs = [
    { name: 'Strona główna', href: '/' },
    { name: 'Kolekcje', href: '/kolekcje/' },
    { name: col.name, href: `/kolekcje/${col.slug}/` }
  ];

  const bodyHtml = `
    <section class="fz-hero fz-hero--compact">
      <img src="${esc(col.heroImage)}" alt="Kolekcja frezowanych paneli ${esc(col.name)} — realizacja we wnętrzu" class="fz-hero__img" width="1600" height="1067" fetchpriority="high" decoding="async">
      <div class="fz-hero__veil"></div>
      <div class="fz-hero__content">
        <div class="container">
          <div class="fz-hero__inner">
            <h1>Kolekcja ${esc(col.name)}</h1>
            <p class="fz-hero__lead">${esc(col.lede)}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="fz-section fz-section--calce">
      <div class="container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:40px;align-items:start;">
        <div>
          <h2 style="font-size:clamp(26px,3vw,38px);margin-bottom:16px;">${esc(col.headline)}</h2>
          <p style="font-size:16.5px;color:var(--fz-ink-muted);max-width:56ch;">${esc(col.body)}</p>
          <p style="margin-top:18px;"><strong>Rekomendowane wnętrza:</strong> ${col.rooms.join(' · ')}</p>
        </div>
        <table class="fz-spec-table" style="margin-top:0;background:#fff;border:var(--fz-hairline);">
          <tbody>
            <tr><th>Kod kolekcji</th><td>${esc(col.code)}</td></tr>
            <tr><th>Moduł / skala</th><td>${esc(col.specs.module)}</td></tr>
            <tr><th>Format płyty</th><td>${esc(col.specs.dimensions)}</td></tr>
            <tr><th>Parametry frezu CNC</th><td>${esc(col.specs.milling)}</td></tr>
            <tr><th>Wykończenie</th><td>${esc(col.specs.finish)}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="fz-section">
      <div class="container">
        <div class="fz-section-head">
          <h2>Modele w kolekcji ${esc(col.name)} (${products.length})</h2>
          <a href="/probki/" class="btn btn--outline btn--sm">Zamów próbki</a>
        </div>
        <div class="fz-products-grid">
          ${products.map((p) => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: col.seoTitle,
    description: col.seoDescription,
    canonicalPath: `/kolekcje/${col.slug}/`,
    ogImage: col.heroImage,
    preloadImage: col.heroImage,
    activeNav: '/kolekcje/',
    breadcrumbs,
    schemas: [
      buildBreadcrumbSchema(breadcrumbs),
      buildProductGroupSchema(col, products)
    ],
    bodyHtml
  });
}

/* ── 5. PRODUCT DETAIL PAGE ─────────────────────────────────────────── */
export function renderProductPage(p) {
  const col = getCollectionBySlug(p.collection);
  const area = getProductAreaM2(p);
  const perM2 = getPricePerM2(p);
  const related = PRODUCTS.filter((x) => x.sku !== p.sku && (x.collection === p.collection || x.featured)).slice(0, 4);

  const breadcrumbs = [
    { name: 'Strona główna', href: '/' },
    { name: 'Sklep', href: '/sklep/' },
    { name: col.name, href: `/kolekcje/${col.slug}/` },
    { name: p.name, href: `/produkt/${p.slug}/` }
  ];

  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <div class="fz-pdp">
          <div class="fz-pdp__gallery">
            <div class="fz-pdp__main-img">
              <img id="fz-pdp-main-img" src="${esc(p.image)}" alt="${esc(p.fullName)} — zbliżenie frezu CNC w orzechu" width="1200" height="900" fetchpriority="high" decoding="async">
            </div>
            ${p.gallery.length > 1 ? `
              <div class="fz-pdp__thumbs">
                ${p.gallery.map((img, i) => `
                  <button type="button" class="fz-pdp__thumb${i === 0 ? ' is-active' : ''}" data-src="${esc(img)}" aria-label="Zdjęcie ${i + 1}">
                    <img src="${esc(img)}" alt="${esc(p.name)} — widok ${i + 1}" width="400" height="300" loading="lazy" decoding="async">
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div style="margin-top:32px;">
              <h2 style="font-size:26px;margin-bottom:12px;">Opis i specyfikacja techniczna</h2>
              <p style="font-size:16.5px;color:#2b221c;max-width:65ch;">${esc(p.description)}</p>
              <table class="fz-spec-table">
                <tbody>
                  <tr><th>Kod katalogowy (SKU)</th><td>${esc(p.sku)}</td></tr>
                  <tr><th>Kolekcja</th><td><a href="/kolekcje/${col.slug}/" style="text-decoration:underline;color:var(--fz-ottone);">${esc(col.name)} (${esc(col.tagline)})</a></td></tr>
                  <tr><th>Wymiary płyty</th><td>${p.widthMm} × ${p.heightMm} × ${p.thicknessMm} mm (${area} m²)</td></tr>
                  <tr><th>Frezowanie CNC</th><td>${esc(p.millingSpec)}</td></tr>
                  <tr><th>Waga 1 płyty</th><td>ok. ${p.weightKg} kg</td></tr>
                  <tr><th>Właściwości akustyczne</th><td>${esc(p.acousticClass)}</td></tr>
                  <tr><th>Czas realizacji</th><td>${esc(p.leadTime)}</td></tr>
                  <tr><th>Dostawa w Polsce</th><td>180 zł (gratis od 6 000 zł) · 14 dni na zwrot płyt katalogowych</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="fz-pdp__buybox">
            <span class="fz-data">${esc(p.sku)} · Kolekcja ${esc(col.name)}</span>
            <h1>${esc(p.fullName)}</h1>
            <div class="fz-rating-line">
              ${FIVE_STARS}
              <span class="fz-num"><strong>${p.ratingValue.toFixed(1)}</strong> (${p.reviewCount} opinii)</span>
            </div>

            <div style="display:flex;align-items:baseline;gap:14px;padding:16px 0;border-top:var(--fz-hairline);border-bottom:var(--fz-hairline);">
              <strong class="fz-price" id="fz-pdp-unit-price" style="font-size:32px;">${formatPln(p.price)}</strong>
              <span class="fz-data" id="fz-pdp-m2-price">${formatPln(perM2)} / m²</span>
              <span class="fz-data" style="margin-left:auto;">brutto</span>
            </div>

            <div class="fz-finish-picker" role="group" aria-label="Wybierz gatunek drewna">
              <span class="fz-meta-label">Gatunek drewna (olej mat 5°)</span>
              ${FINISHES.map((f, idx) => `
                <button type="button" class="fz-finish-option${idx === 0 ? ' is-active' : ''}" data-finish-name="${esc(f.shortName)}" data-finish-delta="${f.priceDelta}">
                  <span class="fz-swatch" style="background:${f.swatch};"></span>
                  <span>
                    <strong style="display:block;font-size:14px;">${esc(f.name)}</strong>
                    <span class="fz-num" style="font-size:12.5px;color:var(--fz-ink-muted);">${f.priceDelta === 0 ? 'Cena bazowa' : `${f.priceDelta} zł / płytę`}</span>
                  </span>
                </button>
              `).join('')}
            </div>

            <div class="fz-calc-box" id="fz-wall-calc" data-base-price="${p.price}" data-panel-area="${area}">
              <strong style="font-family:var(--fz-display);font-size:18px;">Kalkulator powierzchni ściany (m²)</strong>
              <div class="fz-calc-box__row">
                <div class="fz-field">
                  <label for="fz-wall-w">Szerokość ściany (m)</label>
                  <input type="number" id="fz-wall-w" value="3.6" min="0.5" max="30" step="0.1">
                </div>
                <div class="fz-field">
                  <label for="fz-wall-h">Wysokość ściany (m)</label>
                  <input type="number" id="fz-wall-h" value="2.6" min="0.5" max="10" step="0.1">
                </div>
              </div>
              <div class="fz-calc-result" id="fz-calc-output">
                <span>Ściana 9.4 m² (+10% zapas)</span>
                <strong>Wyliczanie...</strong>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:96px 1fr;gap:10px;margin-top:16px;">
              <div class="fz-field">
                <label for="fz-pdp-qty">Liczba płyt</label>
                <input type="number" id="fz-pdp-qty" value="1" min="1" max="100">
              </div>
              <button type="button" class="btn btn--primary" style="align-self:end;height:44px;"
                data-add-cart
                data-use-pdp-qty="true"
                data-sku="${esc(p.sku)}"
                data-name="${esc(p.fullName)}"
                data-price="${p.price}"
                data-image="${esc(p.image)}">Dodaj do koszyka</button>
            </div>

            <div style="display:grid;gap:10px;margin-top:12px;">
              <a href="/konfigurator/?sku=${esc(p.sku)}" class="btn btn--brass" style="width:100%;">Zobacz ten panel w konfiguratorze 3D</a>
              <a href="/probki/" class="btn btn--outline" style="width:100%;">Zamów zestaw próbek (149 zł)</a>
              <a href="/kontakt/" style="text-align:center;padding:8px;font-size:13.5px;color:var(--fz-ottone);text-decoration:underline;">Potrzebujesz docięcia 1:1 lub plików CAD/BIM? Zapytaj atelier</a>
            </div>
          </div>
        </div>

        ${p.reviews && p.reviews.length ? `
          <div style="margin-top:64px;padding-top:40px;border-top:var(--fz-hairline);">
            <h2 style="font-size:28px;margin-bottom:22px;">Opinie o panelu ${esc(p.name)}</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
              ${p.reviews.map((r) => `
                <article style="background:#fff;border:var(--fz-hairline);padding:22px;">
                  ${FIVE_STARS}
                  <p style="margin:12px 0;">„${esc(r.text)}”</p>
                  <span class="fz-data">${esc(r.author)} · ${r.date}</span>
                </article>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="margin-top:64px;padding-top:40px;border-top:var(--fz-hairline);">
          <div class="fz-section-head">
            <h2>Podobne panele ścienne</h2>
            <a href="/kolekcje/${col.slug}/" class="btn btn--outline btn--sm">Kolekcja ${esc(col.name)}</a>
          </div>
          <div class="fz-products-grid">
            ${related.map((x) => renderProductCard(x)).join('')}
          </div>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: `${p.name} (${p.sku}) — Frezowany panel ścienny z orzecha | FREZZE`,
    description: `${p.fullName}: ${p.shortDesc}. Format ${p.widthMm}×${p.heightMm}×${p.thicknessMm} mm (${area} m²), cena ${formatPln(p.price)} (${formatPln(perM2)}/m²). Kalkulator m² i szybka wycena.`,
    canonicalPath: `/produkt/${p.slug}/`,
    ogImage: p.image,
    ogType: 'product',
    preloadImage: p.image,
    activeNav: '/sklep/',
    breadcrumbs,
    schemas: [
      buildBreadcrumbSchema(breadcrumbs),
      buildProductSchema(p, col, false)
    ],
    bodyHtml
  });
}

/* ── 6. SAMPLES PAGE ────────────────────────────────────────────────── */
export function renderSamplesPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Zestaw próbek', href: '/probki/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <div class="fz-pdp">
          <div class="fz-pdp__main-img">
            <img src="${esc(SAMPLE_BOX.image)}" alt="${esc(SAMPLE_BOX.fullName)}" width="1200" height="900" fetchpriority="high" decoding="async">
          </div>
          <div class="fz-pdp__buybox">
            <span class="fz-data">${SAMPLE_BOX.sku} · Wysyłka 48h gratis</span>
            <h1>${esc(SAMPLE_BOX.name)}</h1>
            <div class="fz-rating-line">${FIVE_STARS} <strong class="fz-num">5.0</strong> (${SAMPLE_BOX.reviewCount} opinii)</div>
            <p>${esc(SAMPLE_BOX.description)}</p>
            <div style="display:flex;align-items:baseline;gap:14px;padding:16px 0;border-top:var(--fz-hairline);border-bottom:var(--fz-hairline);margin:18px 0;">
              <strong class="fz-price" style="font-size:32px;">${formatPln(SAMPLE_BOX.price)}</strong>
              <span class="fz-data">Dostawa 0 zł · zwrot przy zamówieniu</span>
            </div>
            <button type="button" class="btn btn--brass" style="width:100%;"
              data-add-cart
              data-sku="${SAMPLE_BOX.sku}"
              data-name="${esc(SAMPLE_BOX.name)}"
              data-price="${SAMPLE_BOX.price}"
              data-image="${esc(SAMPLE_BOX.image)}">Zamów zestaw próbek — 149 zł</button>
            <ul style="margin:22px 0 0;padding-left:18px;font-size:14.5px;color:var(--fz-ink-muted);display:grid;gap:8px;">
              <li>4 wyfrezowane formatki 180×180×18 mm w matowym oleju 5°</li>
              <li>Próbnik wybarwień: Orzech Canaletto, Dąb Wędzony, Jesion Termowany</li>
              <li>Voucher -149 zł ważny przez 6 miesięcy na dowolne panele FREZZE</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Zestaw próbek frezowanych paneli z orzecha (149 zł, dostawa 0 zł) | FREZZE',
    description: 'Zamów zestaw 4 rzeczywistych próbek frezowanych paneli ściennych 180×180 mm w orzechu Canaletto. Wysyłka 48h gratis, pełny zwrot kwoty przy zamówieniu.',
    canonicalPath: '/probki/',
    ogImage: SAMPLE_BOX.image,
    ogType: 'product',
    preloadImage: SAMPLE_BOX.image,
    activeNav: '/probki/',
    breadcrumbs,
    schemas: [
      buildBreadcrumbSchema(breadcrumbs),
      buildProductSchema(SAMPLE_BOX, null, true)
    ],
    bodyHtml
  });
}

/* ── 7. ARTICLES HUB & ARTICLE DETAIL ───────────────────────────────── */
export function renderArticlesHubPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Poradnik', href: '/poradnik/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:14px;">Poradnik o panelach ściennych z drewna</h1>
        <p style="max-width:66ch;color:var(--fz-ink-muted);margin:0 0 36px;">
          Praktyczne przewodniki przygotowane przez architektów i inżynierów stolarni CNC FREZZE: montaż, akustyka, porównanie orzecha z MDF oraz pliki CAD/BIM.
        </p>
        <div class="fz-articles-grid">
          ${ARTICLES.map((a) => `
            <article class="fz-article-card">
              <a href="/poradnik/${a.slug}/" class="fz-article-card__img">
                <img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" width="800" height="500" loading="lazy" decoding="async">
              </a>
              <div class="fz-article-card__body">
                <span class="fz-meta-label">${esc(a.category)} · ${a.readMinutes} min · ${a.updatedAt}</span>
                <h2><a href="/poradnik/${a.slug}/">${esc(a.title)}</a></h2>
                <p style="font-size:14.5px;color:var(--fz-ink-muted);margin:0;">${esc(a.excerpt)}</p>
                <a href="/poradnik/${a.slug}/" class="fz-meta-label" style="margin-top:auto;padding-top:14px;color:var(--fz-ottone);">Czytaj poradnik</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Poradnik o frezowanych panelach ściennych — montaż, akustyka, drewno | FREZZE',
    description: 'Ekspercka baza wiedzy o frezowanych panelach ściennych z orzecha amerykańskiego: instrukcja montażu, porównanie z MDF, akustyka 3D i pliki dla architektów.',
    canonicalPath: '/poradnik/',
    activeNav: '/poradnik/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs)],
    bodyHtml
  });
}

export function renderArticlePage(article) {
  const breadcrumbs = [
    { name: 'Strona główna', href: '/' },
    { name: 'Poradnik', href: '/poradnik/' },
    { name: article.title, href: `/poradnik/${article.slug}/` }
  ];
  const relatedCols = article.relatedCollections.map(getCollectionBySlug).filter(Boolean);

  const bodyHtml = `
    <article class="fz-section fz-section--tight">
      <div class="container">
        <div class="fz-article-prose">
          <h1 style="font-size:clamp(30px,4vw,48px);margin-bottom:14px;">${esc(article.title)}</h1>
          <p class="fz-data" style="margin-bottom:26px;">${esc(article.author.name)} (${esc(article.author.role)}) · Aktualizacja: ${article.updatedAt} · ${article.readMinutes} min czytania</p>

          <img src="${esc(article.image)}" alt="${esc(article.imageAlt)}" width="1200" height="750" fetchpriority="high" decoding="async" style="margin-bottom:28px;border:var(--fz-hairline);">

          <nav class="fz-toc" aria-label="Spis treści">
            <strong class="fz-meta-label" style="color:var(--fz-noce-deep);">Spis treści</strong>
            <ul>
              ${article.sections.map((s) => `<li><a href="#${s.id}">${esc(s.heading)}</a></li>`).join('')}
            </ul>
          </nav>

          ${article.sections.map((s) => `
            <section id="${s.id}">
              <h2>${esc(s.heading)}</h2>
              ${s.paragraphs.map((para) => `<p>${esc(para)}</p>`).join('')}
            </section>
          `).join('')}

          <div style="background:var(--fz-calce);border:var(--fz-hairline);padding:24px;margin:40px 0;">
            <span class="fz-meta-label">Autor opracowania</span>
            <strong style="display:block;font-family:var(--fz-display);font-size:21px;margin:6px 0;">${esc(article.author.name)}</strong>
            <p style="margin:0;font-size:15px;color:var(--fz-ink-muted);">${esc(article.author.bio)}</p>
          </div>

          ${article.faqs && article.faqs.length ? `
            <h2>Pytania i odpowiedzi</h2>
            ${renderFaqBlock(article.faqs)}
          ` : ''}

          <div style="margin-top:44px;padding-top:28px;border-top:var(--fz-hairline);">
            <h3 style="font-size:22px;margin-bottom:16px;">Polecane kolekcje</h3>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${relatedCols.map((c) => `<a href="/kolekcje/${c.slug}/" class="btn btn--outline btn--sm">Kolekcja ${esc(c.name)}</a>`).join('')}
              <a href="/probki/" class="btn btn--brass btn--sm">Zamów próbki (149 zł)</a>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;

  const schemas = [buildBreadcrumbSchema(breadcrumbs), buildArticleSchema(article)];
  if (article.faqs && article.faqs.length) schemas.push(buildFaqSchema(article.faqs));

  return renderLayout({
    title: article.seoTitle,
    description: article.seoDescription,
    canonicalPath: `/poradnik/${article.slug}/`,
    ogImage: article.image,
    ogType: 'article',
    preloadImage: article.image,
    activeNav: '/poradnik/',
    breadcrumbs,
    schemas,
    bodyHtml
  });
}

/* ── 8. ATELIER / PROCESS / FAQ / CONTACT / CART / 404 ──────────────── */
export function renderAtelierPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Atelier', href: '/atelier/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:18px;">Atelier FREZZE — Mediolan i Warszawa</h1>
        <p class="fz-editorial" style="max-width:62ch;margin-bottom:40px;">
          Frezze powstało na styku dwóch miast: mediolańskiej kultury proporcji i warszawskiego rzemiosła stolarskiego. Projektujemy i produkujemy wielkoformatowe panele ścienne z orzecha amerykańskiego Canaletto.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
          ${SITE.locations.map((loc) => `
            <article style="background:#fff;border:var(--fz-hairline);padding:28px;">
              <h2 style="font-size:24px;margin:0 0 12px;">${esc(loc.name)}</h2>
              <p style="margin:0 0 8px;">${esc(loc.street)}, ${esc(loc.postalCode)} ${esc(loc.city)}</p>
              <p style="margin:0 0 8px;">Tel: ${esc(loc.phone)}</p>
              <p class="fz-data" style="margin:0;">${esc(loc.hours)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Atelier FREZZE — Producent frezowanych paneli ściennych | Warszawa · Milano',
    description: 'Poznaj atelier FREZZE w Warszawie i Mediolanie. Własna stolarnia 5-osiowa CNC, wyselekcjonowany orzech amerykański Canaletto i indywidualne wsparcie projektowe.',
    canonicalPath: '/atelier/',
    activeNav: '/atelier/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs), buildOrganizationSchema(), ...buildLocalBusinessSchemas()],
    bodyHtml
  });
}

export function renderProcessPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Proces produkcji CNC', href: '/proces/' }];
  const steps = [
    ['1', 'Rysunek 1:1 (Disegno)', 'Przygotowujemy mapę podziału płyt pod dokładne wymiary Twojej ściany, narożniki i gniazdka elektryczne.'],
    ['2', 'Selekcja tarcicy orzechowej', 'Dobieramy pasma orzecha amerykańskiego Canaletto pod kątem spójności barwy i kierunku usłojenia.'],
    ['3', 'Frezowanie CNC 3- i 5-osiowe', 'Każdy łuk i fala mają promień oraz tolerancję 0.05 mm zapisaną w dossier kolekcji.'],
    ['4', 'Ręczne szlifowanie i olej Mat 5°', 'Dwukrotne olejowanie naturalnym olejem twardym podkreśla słoje bez lakierowego połysku.'],
    ['5', 'Numeracja i bezpieczny transport', 'Płyty numerujemy na rewersie i dostarczamy w skrzyniach transportowych na terenie Polski i UE.'],
    ['6', 'Montaż z ciągłością rysunku', 'Wzór przechodzi płynnie przez łączenia paneli, dzięki czemu ściana czyta się jako jedna rzeźba.']
  ];

  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:14px;">Od rysunku 1:1 do gotowej ściany</h1>
        <p style="max-width:62ch;color:var(--fz-ink-muted);margin:0 0 36px;">Sześć etapów realizacji paneli frezowanych w naszej pracowni CNC.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
          ${steps.map(([num, title, desc]) => `
            <article style="background:#fff;border:var(--fz-hairline);padding:26px;">
              <h2 style="font-size:22px;margin:0 0 10px;"><span class="fz-data" style="color:var(--fz-ottone);margin-right:8px;">0${num}</span>${esc(title)}</h2>
              <p style="margin:0;color:var(--fz-ink-muted);">${esc(desc)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Proces produkcji frezowanych paneli ściennych CNC | FREZZE',
    description: 'Zobacz jak powstają panele ścienne FREZZE: od mapy ściany 1:1 i selekcji orzecha amerykańskiego po 5-osiowe frezowanie CNC i olejowanie matowe 5°.',
    canonicalPath: '/proces/',
    activeNav: '/proces/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs)],
    bodyHtml
  });
}

export function renderFaqPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'FAQ', href: '/faq/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:28px;">Najczęstsze pytania o panele frezowane</h1>
        ${renderFaqBlock(GLOBAL_FAQS)}
      </div>
    </section>
  `;

  return renderLayout({
    title: 'FAQ — Pytania o frezowane panele ścienne, montaż, ceny i próbki | FREZZE',
    description: 'Odpowiedzi na najczęstsze pytania o frezowane panele ścienne z orzecha: ceny za m², czas realizacji CNC, montaż, akustykę, pielęgnację i zwroty.',
    canonicalPath: '/faq/',
    activeNav: '/faq/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs), buildFaqSchema(GLOBAL_FAQS)],
    bodyHtml
  });
}

export function renderContactPage() {
  const breadcrumbs = [{ name: 'Strona główna', href: '/' }, { name: 'Kontakt i wycena', href: '/kontakt/' }];
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(32px,4.5vw,52px);margin-bottom:28px;">Kontakt i wycena 1:1</h1>
        <div class="fz-pdp">
          <form data-fz-form data-success-msg="Dziękujemy! Zapytanie o wycenę 1:1 zostało wysłane. Skontaktujemy się w ciągu 24 godzin roboczych." style="background:#fff;border:var(--fz-hairline);padding:28px;display:grid;gap:14px;">
            <h2 style="font-size:24px;">Poproś o indywidualną wycenę ściany lub pliki CAD</h2>
            <div class="fz-field"><label for="c-name">Imię i nazwisko / Pracownia</label><input id="c-name" required placeholder="Jan Kowalski"></div>
            <div class="fz-field"><label for="c-email">Adres e-mail</label><input id="c-email" type="email" required placeholder="jan@pracownia.pl"></div>
            <div class="fz-field"><label for="c-col">Interesująca kolekcja</label>
              <select id="c-col">
                ${COLLECTIONS.map((c) => `<option value="${c.slug}">${esc(c.name)} — ${esc(c.tagline)}</option>`).join('')}
              </select>
            </div>
            <div class="fz-field"><label for="c-msg">Wymiary ściany lub treść pytania</label><textarea id="c-msg" rows="4" required placeholder="Np. ściana w salonie 4.2 × 2.8 m, interesuje mnie Stadio Pilastri w orzechu..."></textarea></div>
            <button type="submit" class="btn btn--primary">Wyślij zapytanie o wycenę</button>
            <p data-form-status hidden style="color:var(--fz-ottone);font-weight:600;margin:0;"></p>
          </form>

          <div style="display:grid;gap:18px;">
            ${SITE.locations.map((loc) => `
              <div style="background:var(--fz-calce);border:var(--fz-hairline);padding:24px;">
                <h2 style="font-size:22px;margin:0 0 10px;">${esc(loc.name)}</h2>
                <p style="margin:0 0 6px;">${esc(loc.street)}, ${esc(loc.postalCode)} ${esc(loc.city)}</p>
                <p style="margin:0 0 6px;">Tel: ${esc(loc.phone)} · ${SITE.email}</p>
                <p class="fz-data" style="margin:0;">${esc(loc.hours)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Kontakt i wycena paneli frezowanych — Warszawa & Milano | FREZZE',
    description: 'Skontaktuj się z showroomem FREZZE w Warszawie (ul. Mokotowska 12) lub Mediolanie. Zamów wycenę 1:1, pliki CAD/BIM lub umów wizytę.',
    canonicalPath: '/kontakt/',
    activeNav: '/kontakt/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs), ...buildLocalBusinessSchemas()],
    bodyHtml
  });
}

export function renderCartPage() {
  const bodyHtml = `
    <section class="fz-section fz-section--tight">
      <div class="container">
        <h1 style="font-size:clamp(30px,4vw,44px);margin-bottom:28px;">Koszyk i finalizacja zamówienia</h1>
        <div class="fz-pdp">
          <div style="background:#fff;border:var(--fz-hairline);padding:24px;">
            <div id="fz-cart-page-items"></div>
            <div style="margin-top:20px;padding-top:16px;border-top:var(--fz-hairline);display:grid;gap:8px;font-variant-numeric:tabular-nums;">
              <div style="display:flex;justify-content:space-between;"><span>Wartość produktów:</span><strong id="fz-page-subtotal">0 zł</strong></div>
              <div style="display:flex;justify-content:space-between;"><span>Dostawa dedykowana:</span><strong id="fz-page-shipping">0 zł</strong></div>
              <div style="display:flex;justify-content:space-between;font-size:20px;padding-top:8px;border-top:var(--fz-hairline);"><span>Razem brutto:</span><strong id="fz-page-total">0 zł</strong></div>
            </div>
          </div>
          <form data-fz-form data-clear-cart="true" data-success-msg="Zamówienie zostało zarejestrowane! Wysłaliśmy potwierdzenie i harmonogram produkcji CNC na Twój e-mail." style="background:#fff;border:var(--fz-hairline);padding:24px;display:grid;gap:14px;">
            <h2 style="font-size:24px;">Dane do dostawy i faktury</h2>
            <div class="fz-field"><label for="o-name">Imię i nazwisko</label><input id="o-name" required></div>
            <div class="fz-field"><label for="o-email">E-mail</label><input id="o-email" type="email" required></div>
            <div class="fz-field"><label for="o-phone">Telefon kontaktowy</label><input id="o-phone" required></div>
            <div class="fz-field"><label for="o-addr">Adres dostawy</label><input id="o-addr" required></div>
            <button type="submit" class="btn btn--brass">Złóż zamówienie z obowiązkiem zapłaty</button>
            <p data-form-status hidden style="color:var(--fz-ottone);font-weight:600;margin:0;"></p>
          </form>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Koszyk i zamówienie | FREZZE',
    description: 'Podsumowanie koszyka i finalizacja zamówienia frezowanych paneli ściennych FREZZE.',
    canonicalPath: '/koszyk/',
    robots: 'noindex, follow',
    bodyHtml
  });
}

export function render404Page() {
  const bodyHtml = `
    <section class="fz-section" style="text-align:center;">
      <div class="container">
        <h1 style="font-size:clamp(36px,6vw,64px);margin-bottom:16px;">Nie znaleziono tej strony</h1>
        <p style="color:var(--fz-ink-muted);max-width:52ch;margin:0 auto 28px;">Wybrany adres nie istnieje lub został przeniesiony. Przejdź do pełnego katalogu paneli frezowanych.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="/" class="btn btn--primary">Strona główna</a>
          <a href="/sklep/" class="btn btn--outline">Sklep (26 modeli)</a>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Nie znaleziono strony (404) | FREZZE',
    description: 'Strona nie została znaleziona w sklepie FREZZE.',
    canonicalPath: '/404.html',
    robots: 'noindex, follow',
    bodyHtml
  });
}

/* ── 9. 3D ARCHITECTURAL CONFIGURATOR & VISUALIZATION STUDIO ────────── */
export function renderConfiguratorPage() {
  const breadcrumbs = [
    { name: 'Strona główna', href: '/' },
    { name: 'Konfigurator 3D i wizualizacja', href: '/konfigurator/' }
  ];

  const catalogPayload = PRODUCTS.map((p) => ({
    sku: p.sku,
    name: p.name,
    fullName: p.fullName,
    collection: p.collection,
    price: p.price,
    widthMm: p.widthMm,
    heightMm: p.heightMm,
    thicknessMm: p.thicknessMm,
    image: p.image
  }));

  const groupedOptions = COLLECTIONS.map((c) => {
    const items = getProductsByCollection(c.slug);
    return `<optgroup label="${esc(c.name)} — ${esc(c.tagline)}">
      ${items.map((p) => `<option value="${esc(p.sku)}">${esc(p.name)} (${esc(p.sku)}) · ${p.widthMm}×${p.heightMm} mm</option>`).join('')}
    </optgroup>`;
  }).join('');

  const bodyHtml = `
    <section class="fz-section fz-section--tight" id="fz-3d-root" data-base-path="${esc(SITE.basePath || '')}">
      <div class="container">
        <div class="fz-section-head" style="margin-bottom:24px;">
          <div>
            <h1 style="font-size:clamp(30px,4vw,46px);">Konfigurator 3D paneli ściennych</h1>
            <p>Dobierz wzór CNC, gatunek drewna, wymiary ściany oraz oświetlenie ślizgowe LED, a następnie pobierz realistyczną wizualizację PNG.</p>
          </div>
          <button type="button" class="btn btn--brass btn--sm" id="fz-3d-export">Pobierz wizualizację PNG (HD)</button>
        </div>

        <div class="fz-studio">
          <div class="fz-studio__stage" id="fz-3d-stage">
            <canvas class="fz-studio__canvas" id="fz-3d-canvas"></canvas>
            <div class="fz-studio__hud-top">
              <span class="fz-studio__badge" id="fz-3d-hud-label">Ładowanie sceny 3D...</span>
              <span class="fz-studio__badge">Obrót: LPM · Zoom: kółko</span>
            </div>
            <div class="fz-studio__cams" role="group" aria-label="Ujęcia kamery">
              <button type="button" class="fz-cam-btn is-active" data-3d-cam="room">Widok wnętrza</button>
              <button type="button" class="fz-cam-btn" data-3d-cam="macro">Zbliżenie na frez</button>
              <button type="button" class="fz-cam-btn" data-3d-cam="raking">Kąt boczny (światło)</button>
            </div>
            <div class="fz-studio__loading" id="fz-3d-loading">Generowanie mapy normalnych 3D...</div>
          </div>

          <aside class="fz-studio__panel" aria-label="Ustawienia konfiguratora 3D">
            <div class="fz-studio__group">
              <div class="fz-field">
                <label for="fz-3d-model">Model panelu CNC (26 wzorów)</label>
                <select id="fz-3d-model">${groupedOptions}</select>
              </div>
              <div>
                <span class="fz-meta-label" style="display:block;margin-bottom:8px;">Gatunek drewna (olej mat 5°)</span>
                <div class="fz-studio__chips">
                  <button type="button" class="fz-pill is-active" data-3d-finish="noce-canaletto">Orzech Canaletto</button>
                  <button type="button" class="fz-pill" data-3d-finish="rovere-fume">Dąb Wędzony</button>
                  <button type="button" class="fz-pill" data-3d-finish="frassino-termo">Jesion Termowany</button>
                  <button type="button" class="fz-pill" data-3d-finish="rovere-nat">Dąb Naturalny</button>
                </div>
              </div>
            </div>

            <div class="fz-studio__group">
              <span class="fz-meta-label">Aranżacja wnętrza</span>
              <div class="fz-studio__chips">
                <button type="button" class="fz-pill is-active" data-3d-room="salon">Salon</button>
                <button type="button" class="fz-pill" data-3d-room="sypialnia">Sypialnia</button>
                <button type="button" class="fz-pill" data-3d-room="studio">Studio CNC</button>
              </div>
              <div class="fz-studio__row">
                <label for="fz-3d-w">Szerokość ściany</label>
                <strong class="fz-data" id="fz-3d-w-val">4.2 m</strong>
              </div>
              <input type="range" id="fz-3d-w" min="1.2" max="8.0" step="0.2" value="4.2">
              <div class="fz-studio__row">
                <label for="fz-3d-h">Wysokość ściany</label>
                <strong class="fz-data" id="fz-3d-h-val">2.8 m</strong>
              </div>
              <input type="range" id="fz-3d-h" min="1.8" max="4.0" step="0.1" value="2.8">
              <div class="fz-studio__chips">
                <button type="button" class="fz-pill is-active" data-3d-orient="vertical">Układ pionowy</button>
                <button type="button" class="fz-pill" data-3d-orient="horizontal">Układ poziomy</button>
              </div>
            </div>

            <div class="fz-studio__group">
              <span class="fz-meta-label">Światło i głębia reliefu 3D</span>
              <div class="fz-studio__row">
                <label for="fz-3d-sun">Pora dnia (światło dzienne → noc)</label>
              </div>
              <input type="range" id="fz-3d-sun" min="0" max="1" step="0.02" value="0.55">
              <div class="fz-studio__row">
                <label><input type="checkbox" id="fz-3d-led" checked> Listwa LED Wall-Washer</label>
                <select id="fz-3d-led-temp" aria-label="Barwa LED" style="padding:5px 8px;border:var(--fz-hairline);background:#fff;">
                  <option value="2700">2700K Ciepły</option>
                  <option value="3000">3000K Neutralny</option>
                  <option value="4000">4000K Dzienny</option>
                </select>
              </div>
              <div class="fz-studio__row">
                <label for="fz-3d-relief">Wyrazistość frezu 3D</label>
              </div>
              <input type="range" id="fz-3d-relief" min="0.5" max="3.0" step="0.1" value="1.5">
            </div>

            <div class="fz-studio__summary" id="fz-3d-summary"></div>

            <button type="button" class="btn btn--primary" id="fz-3d-add-cart" style="width:100%;">Dodaj konfigurację do koszyka</button>
          </aside>
        </div>
      </div>

      <script type="application/json" id="fz-3d-catalog">${JSON.stringify(catalogPayload)}</script>
      <script type="module" src="/js/configurator3d.js"></script>
    </section>
  `;

  return renderLayout({
    title: 'Konfigurator 3D frezowanych paneli ściennych i wizualizacja wnętrza | FREZZE',
    description: 'Interaktywny konfigurator 3D paneli ściennych z orzecha amerykańskiego. Zmień wzór CNC, wymiary ściany, oświetlenie LED i pobierz realistyczną wizualizację PNG.',
    canonicalPath: '/konfigurator/',
    activeNav: '/konfigurator/',
    breadcrumbs,
    schemas: [buildBreadcrumbSchema(breadcrumbs)],
    bodyHtml
  });
}
