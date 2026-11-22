# FREZZE — Sklep z frezowanymi panelami ściennymi CNC + Ekosystem SEO

Statycznie generowany sklep internetowy (SSG) sprzedający wielkoformatowe frezowane panele ścienne z orzecha amerykańskiego Canaletto, zbudowany zgodnie z wytycznymi **Google Search Central** (`developers.google.com/search/docs`) oraz standardami designu **Impeccable**.

## Zawartość projektu
- **49 statycznych stron HTML** (`dist/`): strona główna, sklep (26 modeli), 7 kolekcji (`Stadio`, `Onda`, `Mare`, `Arcata`, `Foglia`, `Concavo`, `Geometria`), 26 dedykowanych kart produktów (PDP z kalkulatorem m² i wyborem gatunku drewna), zestaw próbek, 5 poradników SEO, FAQ, proces CNC, atelier, kontakt i koszyk.
- **101 bloków JSON-LD** (`src/seo/schemas.js`): `Organization` + `MerchantReturnPolicy`, `HomeGoodsStore` (Warszawa & Milano), `WebSite` + `SearchAction`, `ProductGroup`, `Product` + `Offer` + `OfferShippingDetails`, `AggregateRating`, `Review`, `BreadcrumbList`, `Article`, `FAQPage`, `ItemList`.
- **Pliki indeksacyjne**: `sitemap.xml` (index) → `sitemap-pages.xml`, `sitemap-products.xml` (z rozszerzeniem Google Image Sitemap), `sitemap-articles.xml`, `robots.txt`, `google-merchant-feed.xml`, `llms.txt`.
- **Automatyczny audyt SEO**: `seo-audit.mjs` weryfikujący każdą wygenerowaną stronę pod kątem wytycznych Google Search Central.

## Komendy
```bash
node build.mjs      # generuje wszystkie strony i pliki SEO do dist/
node seo-audit.mjs  # uruchamia automatyczny audyt SEO
node serve.mjs      # uruchamia lokalny serwer na http://localhost:4321/
```
