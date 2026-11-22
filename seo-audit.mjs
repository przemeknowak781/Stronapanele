import fs from 'node:fs';
import path from 'node:path';
import { SITE } from './src/data/site.js';

const DIST = path.join(process.cwd(), 'dist');

function walkHtml(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(p, list);
    else if (entry.name.endsWith('.html')) list.push(p);
  }
  return list;
}

const files = walkHtml(DIST);
const titles = new Map();
const descriptions = new Map();
const errors = [];
const warnings = [];
const canonicalSet = new Set();
let totalJsonLd = 0;
let totalImages = 0;

for (const file of files) {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  const isNoindex = /name="robots"\s+content="[^"]*noindex/i.test(html);

  // 1. Title check
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    errors.push(`${rel}: Missing <title>`);
  } else {
    const t = titleMatch[1].trim();
    if (!isNoindex) {
      if (titles.has(t)) errors.push(`${rel}: Duplicate <title> with ${titles.get(t)}`);
      titles.set(t, rel);
      if (t.length > 78) warnings.push(`${rel}: Title slightly long (${t.length} chars)`);
    }
  }

  // 2. Meta description check
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!descMatch || !descMatch[1].trim()) {
    errors.push(`${rel}: Missing meta description`);
  } else if (!isNoindex) {
    const d = descMatch[1].trim();
    if (descriptions.has(d)) errors.push(`${rel}: Duplicate meta description with ${descriptions.get(d)}`);
    descriptions.set(d, rel);
  }

  // 3. Canonical check
  const canMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canMatch) {
    errors.push(`${rel}: Missing <link rel="canonical">`);
  } else if (!isNoindex) {
    canonicalSet.add(canMatch[1]);
  }

  // 4. Single H1 check
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length !== 1) errors.push(`${rel}: Expected exactly 1 <h1>, found ${h1s.length}`);

  // 5. JSON-LD validation
  const ldMatches = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!isNoindex && ldMatches.length === 0) {
    warnings.push(`${rel}: No JSON-LD structured data found`);
  }
  for (const m of ldMatches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (!parsed['@context'] || !parsed['@type']) errors.push(`${rel}: JSON-LD missing @context or @type`);
      totalJsonLd++;
    } catch (e) {
      errors.push(`${rel}: Invalid JSON-LD syntax: ${e.message}`);
    }
  }

  // 6. Image SEO & CLS checks (alt, width, height)
  const imgs = [...html.matchAll(/<img\s+([^>]+)>/gi)];
  for (const im of imgs) {
    totalImages++;
    const attrs = im[1];
    if (!/alt="[^"]+"/i.test(attrs)) errors.push(`${rel}: <img> missing non-empty alt attribute`);
    if (!/width="\d+"/i.test(attrs) || !/height="\d+"/i.test(attrs)) {
      errors.push(`${rel}: <img> missing explicit width/height (CLS risk)`);
    }
  }

  // 7. Internal link integrity check
  const base = SITE.basePath || '';
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/gi)].map((m) => m[1]);
  for (const rawHref of hrefs) {
    const href = base && rawHref.startsWith(base) ? (rawHref.slice(base.length) || '/') : rawHref;
    if (href === '/') continue;
    const targetFile = href.endsWith('/')
      ? path.join(DIST, href.slice(1), 'index.html')
      : path.join(DIST, href.slice(1));
    if (!fs.existsSync(targetFile)) {
      errors.push(`${rel}: Broken internal link -> ${rawHref}`);
    }
  }
}

// 8. Sitemap vs Canonical consistency
const sitemapFiles = ['sitemap-pages.xml', 'sitemap-products.xml', 'sitemap-articles.xml'];
const sitemapUrls = new Set();
for (const sf of sitemapFiles) {
  const xml = fs.readFileSync(path.join(DIST, sf), 'utf8');
  for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) sitemapUrls.add(m[1]);
}
for (const u of sitemapUrls) {
  if (!canonicalSet.has(u)) errors.push(`Sitemap URL not found among indexable canonicals: ${u}`);
}
for (const c of canonicalSet) {
  if (!sitemapUrls.has(c)) errors.push(`Indexable canonical missing from sitemaps: ${c}`);
}

const report = {
  auditedAt: new Date().toISOString(),
  siteUrl: SITE.url,
  totalHtmlPages: files.length,
  indexableCanonicalPages: canonicalSet.size,
  sitemapUrls: sitemapUrls.size,
  totalJsonLdBlocks: totalJsonLd,
  totalImagesChecked: totalImages,
  errorsCount: errors.length,
  warningsCount: warnings.length,
  errors,
  warnings
};

fs.writeFileSync(path.join(DIST, 'seo-report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log('\n=== FREZZE Google Search Central SEO Audit ===');
console.log(`Pages scanned:      ${report.totalHtmlPages} (${report.indexableCanonicalPages} indexable)`);
console.log(`Sitemap URLs:       ${report.sitemapUrls} (1:1 match with canonicals)`);
console.log(`JSON-LD blocks:     ${report.totalJsonLdBlocks} (all valid JSON)`);
console.log(`Images verified:    ${report.totalImagesChecked} (alt + width/height)`);
console.log(`Errors:             ${report.errorsCount}`);
console.log(`Warnings:           ${report.warningsCount}`);

if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.error('\nERRORS:');
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ ALL GOOGLE SEARCH CENTRAL SEO CHECKS PASSED!');
