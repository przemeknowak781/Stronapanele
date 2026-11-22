import { SITE } from '../data/site.js';
import { FINISHES, getProductAreaM2 } from '../data/catalog.js';

const absUrl = (path) => `${SITE.url}${path.startsWith('/') ? path : '/' + path}`;

export function buildMerchantReturnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': `${SITE.url}/#return-policy`,
    applicableCountry: 'PL',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SITE.returns.days,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnShippingFees'
  };
}

export function buildShippingDetails(pricePln, isSample = false) {
  const cost = isSample || pricePln >= SITE.shipping.freeThreshold ? 0 : SITE.shipping.standardCost;
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: cost,
      currency: SITE.currency
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'PL'
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: isSample ? 1 : SITE.shipping.handlingMinDays,
        maxValue: isSample ? 2 : SITE.shipping.handlingMaxDays,
        unitCode: 'DAY'
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: isSample ? 1 : SITE.shipping.transitMinDays,
        maxValue: isSample ? 2 : SITE.shipping.transitMaxDays,
        unitCode: 'DAY'
      }
    }
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: absUrl(SITE.logo),
      width: 64,
      height: 64
    },
    email: SITE.email,
    telephone: SITE.phone,
    foundingDate: SITE.foundedYear,
    sameAs: SITE.social,
    hasMerchantReturnPolicy: buildMerchantReturnPolicy(),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE.phone,
        email: SITE.email,
        contactType: 'sales',
        areaServed: ['PL', 'EU'],
        availableLanguage: ['Polish', 'English', 'Italian']
      }
    ]
  };
}

export function buildLocalBusinessSchemas() {
  return SITE.locations.map((loc) => ({
    '@context': 'https://schema.org',
    '@type': 'HomeGoodsStore',
    '@id': `${SITE.url}/#location-${loc.id}`,
    name: loc.name,
    url: `${SITE.url}/kontakt/`,
    image: absUrl(SITE.ogDefaultImage),
    telephone: loc.phone,
    email: SITE.email,
    priceRange: '$$$',
    parentOrganization: { '@id': `${SITE.url}/#organization` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.street,
      addressLocality: loc.city,
      addressRegion: loc.region,
      postalCode: loc.postalCode,
      addressCountry: loc.country
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: loc.lat,
      longitude: loc.lng
    }
  }));
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: `${SITE.name} — ${SITE.tagline}`,
    url: SITE.url,
    inLanguage: SITE.lang,
    publisher: { '@id': `${SITE.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/sklep/?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absUrl(item.href)
    }))
  };
}

export function buildProductSchema(product, collection, isSample = false) {
  const url = isSample ? absUrl('/probki/') : absUrl(`/produkt/${product.slug}/`);
  const images = (product.gallery && product.gallery.length ? product.gallery : [product.image]).map(absUrl);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.fullName || product.name,
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
    image: images,
    brand: {
      '@type': 'Brand',
      name: SITE.name
    },
    manufacturer: { '@id': `${SITE.url}/#organization` },
    material: 'Orzech amerykański Canaletto (olej matowy 5°)',
    category: 'Panele ścienne frezowane CNC',
    width: {
      '@type': 'QuantitativeValue',
      value: product.widthMm,
      unitCode: 'MMT'
    },
    height: {
      '@type': 'QuantitativeValue',
      value: product.heightMm,
      unitCode: 'MMT'
    },
    depth: {
      '@type': 'QuantitativeValue',
      value: product.thicknessMm,
      unitCode: 'MMT'
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: SITE.currency,
      price: product.price,
      priceValidUntil: '2027-12-31',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE.url}/#organization` },
      shippingDetails: buildShippingDetails(product.price, isSample),
      hasMerchantReturnPolicy: buildMerchantReturnPolicy()
    }
  };

  if (product.weightKg) {
    schema.weight = {
      '@type': 'QuantitativeValue',
      value: product.weightKg,
      unitCode: 'KGM'
    };
  }

  if (collection) {
    schema.isVariantOf = {
      '@type': 'ProductGroup',
      '@id': `${absUrl(`/kolekcje/${collection.slug}/`)}#productgroup`,
      name: `Kolekcja frezowanych paneli ściennych ${collection.name}`
    };
  }

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1
      }
    }));
  }

  return schema;
}

export function buildProductGroupSchema(collection, products) {
  const url = absUrl(`/kolekcje/${collection.slug}/`);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': `${url}#productgroup`,
    name: `Kolekcja ${collection.name} — frezowane panele ścienne FREZZE`,
    description: collection.seoDescription,
    url,
    productGroupID: collection.code,
    brand: { '@type': 'Brand', name: SITE.name },
    variesBy: ['https://schema.org/pattern', 'https://schema.org/size', 'https://schema.org/material'],
    hasVariant: products.map((p) => ({
      '@type': 'Product',
      name: p.fullName,
      sku: p.sku,
      url: absUrl(`/produkt/${p.slug}/`),
      image: absUrl(p.image),
      description: `${p.shortDesc}. Powierzchnia płyty: ${getProductAreaM2(p)} m².`,
      material: FINISHES.map((f) => f.shortName).join(', '),
      offers: {
        '@type': 'Offer',
        url: absUrl(`/produkt/${p.slug}/`),
        priceCurrency: SITE.currency,
        price: p.price,
        availability: `https://schema.org/${p.availability}`,
        priceValidUntil: '2027-12-31'
      }
    }))
  };
}

export function buildItemListSchema(products, listName, pagePath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: absUrl(pagePath),
    numberOfItems: products.length,
    itemListElement: products.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: absUrl(`/produkt/${p.slug}/`),
      name: p.fullName,
      image: absUrl(p.image)
    }))
  };
}

export function buildArticleSchema(article) {
  const url = absUrl(`/poradnik/${article.slug}/`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.seoDescription,
    image: absUrl(article.image),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: SITE.lang,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.role
    },
    publisher: { '@id': `${SITE.url}/#organization` }
  };
}

export function buildFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  };
}
