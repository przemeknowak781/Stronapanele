import fs from 'node:fs';
import path from 'node:path';
import { SITE } from './src/data/site.js';
import { COLLECTIONS, PRODUCTS, SAMPLE_BOX } from './src/data/catalog.js';
import { ARTICLES } from './src/data/articles.js';
import {
  renderHomePage,
  renderShopPage,
  renderCollectionsHubPage,
  renderCollectionPage,
  renderProductPage,
  renderSamplesPage,
  renderArticlesHubPage,
  renderArticlePage,
  renderAtelierPage,
  renderProcessPage,
  renderFaqPage,
  renderContactPage,
  renderCartPage,
  render404Page
} from './src/templates/pages.js';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function writePage(routePath, html) {
  const filePath = routePath.endsWith('.html')
    ? path.join(DIST, routePath.replace(/^\//, ''))
    : path.join(DIST, routePath.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
}

function xmlEsc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

console.log('Building FREZZE E-Commerce + SEO Ecosystem...');
cleanDir(DIST);
copyDir(PUBLIC, DIST);

// 1. Core Pages
const coreRoutes = [
  ['/', renderHomePage()],
  ['/sklep/', renderShopPage()],
  ['/kolekcje/', renderCollectionsHubPage()],
  ['/probki/', renderSamplesPage()],
  ['/poradnik/', renderArticlesHubPage()],
  ['/atelier/', renderAtelierPage()],
  ['/proces/', renderProcessPage()],
  ['/faq/', renderFaqPage()],
  ['/kontakt/', renderContactPage()],
  ['/koszyk/', renderCartPage()],
  ['/404.html', render404Page()]
];
for (const [route, html] of coreRoutes) writePage(route, html);

// 2. Collection Pages (7)
for (const col of COLLECTIONS) {
  writePage(`/kolekcje/${col.slug}/`, renderCollectionPage(col));
}

// 3. Individual Product Pages (26)
for (const prod of PRODUCTS) {
  writePage(`/produkt/${prod.slug}/`, renderProductPage(prod));
}

// 4. SEO Pillar Articles (5)
for (const article of ARTICLES) {
  writePage(`/poradnik/${article.slug}/`, renderArticlePage(article));
}

// 5. Technical SEO Files: robots.txt
const robotsTxt = `# FREZZE — Google Search Central compliant robots.txt
User-agent: *
Allow: /
Disallow: /koszyk/
Disallow: /*?*

Sitemap: ${SITE.url}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');

// 6. Sitemaps (Segmented Sitemap Index + Image Sitemap extensions)
const pageUrls = [
  '/',
  '/sklep/',
  '/kolekcje/',
  '/poradnik/',
  '/atelier/',
  '/proces/',
  '/faq/',
  '/kontakt/',
  ...COLLECTIONS.map((c) => `/kolekcje/${c.slug}/`)
];

const sitemapPagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrls.map((u) => `  <url>
    <loc>${SITE.url}${u}</loc>
    <lastmod>${SITE.lastUpdated}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap-pages.xml'), sitemapPagesXml, 'utf8');

const allProductEntries = [
  ...PRODUCTS.map((p) => ({
    loc: `${SITE.url}/produkt/${p.slug}/`,
    images: p.gallery.map((img) => ({
      url: `${SITE.url}${img}`,
      title: p.fullName
    }))
  })),
  {
    loc: `${SITE.url}/probki/`,
    images: [{ url: `${SITE.url}${SAMPLE_BOX.image}`, title: SAMPLE_BOX.fullName }]
  }
];

const sitemapProductsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allProductEntries.map((item) => `  <url>
    <loc>${xmlEsc(item.loc)}</loc>
    <lastmod>${SITE.lastUpdated}</lastmod>
${item.images.map((im) => `    <image:image>
      <image:loc>${xmlEsc(im.url)}</image:loc>
      <image:title>${xmlEsc(im.title)}</image:title>
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap-products.xml'), sitemapProductsXml, 'utf8');

const sitemapArticlesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ARTICLES.map((a) => `  <url>
    <loc>${SITE.url}/poradnik/${a.slug}/</loc>
    <lastmod>${a.updatedAt}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap-articles.xml'), sitemapArticlesXml, 'utf8');

const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE.url}/sitemap-pages.xml</loc>
    <lastmod>${SITE.lastUpdated}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE.url}/sitemap-products.xml</loc>
    <lastmod>${SITE.lastUpdated}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE.url}/sitemap-articles.xml</loc>
    <lastmod>${SITE.lastUpdated}</lastmod>
  </sitemap>
</sitemapindex>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapIndexXml, 'utf8');

// 7. Google Merchant Center Product Feed (RSS 2.0 XML)
const merchantItems = [
  ...PRODUCTS.map((p) => ({
    id: p.sku,
    title: p.fullName,
    description: p.description,
    link: `${SITE.url}/produkt/${p.slug}/`,
    image: `${SITE.url}${p.image}`,
    price: `${p.price}.00 PLN`,
    shipping: p.price >= SITE.shipping.freeThreshold ? '0.00 PLN' : `${SITE.shipping.standardCost}.00 PLN`,
    material: 'Orzech amerykański Canaletto'
  })),
  {
    id: SAMPLE_BOX.sku,
    title: SAMPLE_BOX.fullName,
    description: SAMPLE_BOX.description,
    link: `${SITE.url}/probki/`,
    image: `${SITE.url}${SAMPLE_BOX.image}`,
    price: `${SAMPLE_BOX.price}.00 PLN`,
    shipping: '0.00 PLN',
    material: 'Orzech amerykański, Dąb, Jesion'
  }
];

const merchantFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>FREZZE — Frezowane panele ścienne z orzecha</title>
    <link>${SITE.url}</link>
    <description>Oficjalny katalog produktów FREZZE dla Google Merchant Center.</description>
${merchantItems.map((m) => `    <item>
      <g:id>${xmlEsc(m.id)}</g:id>
      <g:title>${xmlEsc(m.title)}</g:title>
      <g:description>${xmlEsc(m.description)}</g:description>
      <g:link>${xmlEsc(m.link)}</g:link>
      <g:image_link>${xmlEsc(m.image)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${m.price}</g:price>
      <g:brand>${SITE.name}</g:brand>
      <g:mpn>${xmlEsc(m.id)}</g:mpn>
      <g:condition>new</g:condition>
      <g:material>${xmlEsc(m.material)}</g:material>
      <g:google_product_category>Home &amp; Garden &gt; Decor &gt; Wall Paneling</g:google_product_category>
      <g:shipping>
        <g:country>PL</g:country>
        <g:service>Transport dedykowany FREZZE</g:service>
        <g:price>${m.shipping}</g:price>
      </g:shipping>
    </item>`).join('\n')}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(DIST, 'google-merchant-feed.xml'), merchantFeedXml, 'utf8');

// 8. site.webmanifest & llms.txt
const manifest = {
  name: 'FREZZE — Frezowane panele ścienne z orzecha',
  short_name: 'FREZZE',
  start_url: '/',
  display: 'standalone',
  background_color: '#f7f2e6',
  theme_color: '#160d09',
  icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
};
fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');

const llmsTxt = `# FREZZE — Atelier Frezowanych Paneli Ściennych CNC
> Wielkoformatowe panele ścienne frezowane z orzecha amerykańskiego Canaletto, dębu wędzonego i jesionu termowanego. Zaprojektowane w Mediolanie, produkowane w Warszawie.

## Kluczowe sekcje
- Sklep (26 modeli): ${SITE.url}/sklep/
- Zestaw próbek (149 zł, dostawa 0 zł): ${SITE.url}/probki/
- Poradnik i wiedza techniczna: ${SITE.url}/poradnik/
- FAQ: ${SITE.url}/faq/
- Kontakt i showroomy (Warszawa, Milano): ${SITE.url}/kontakt/

## Kolekcje
${COLLECTIONS.map((c) => `- ${c.name} (${c.code}): ${SITE.url}/kolekcje/${c.slug}/ — ${c.tagline}`).join('\n')}
`;
fs.writeFileSync(path.join(DIST, 'llms.txt'), llmsTxt, 'utf8');

const totalPages = coreRoutes.length + COLLECTIONS.length + PRODUCTS.length + ARTICLES.length;
console.log(`Done! Generated ${totalPages} static HTML pages + Sitemaps + Merchant Feed + robots.txt + llms.txt in dist/`);
