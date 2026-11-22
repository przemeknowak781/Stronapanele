export const SITE = {
  name: 'FREZZE',
  legalName: 'Atelier FREZZE Sp. z o.o.',
  tagline: 'Frezowane panele ścienne z orzecha amerykańskiego CNC',
  url: 'https://przemeknowak781.github.io/Stronapanele',
  basePath: '/Stronapanele',
  locale: 'pl_PL',
  lang: 'pl',
  currency: 'PLN',
  email: 'atelier@frezze.com',
  phone: '+48 22 628 44 10',
  phoneMilan: '+39 02 657 88 21',
  foundedYear: '2024',
  lastUpdated: '2026-11-22',
  ogDefaultImage: '/assets/collections/interni/interno-stadio-penthouse.webp',
  logo: '/assets/favicon.svg',
  social: [
    'https://www.instagram.com/frezze.atelier',
    'https://www.pinterest.com/frezzeatelier',
    'https://www.linkedin.com/company/frezze-atelier'
  ],
  locations: [
    {
      id: 'warszawa',
      name: 'Atelier FREZZE Warszawa — Showroom & Pracownia CNC',
      street: 'ul. Mokotowska 12',
      postalCode: '00-561',
      city: 'Warszawa',
      region: 'Mazowieckie',
      country: 'PL',
      lat: 52.2229,
      lng: 21.0218,
      phone: '+48 22 628 44 10',
      hours: 'Pn–Pt 10:00–18:00, Sob 11:00–15:00 (wizyty po umówieniu)'
    },
    {
      id: 'milano',
      name: 'Atelier FREZZE Milano — Studio Projektowe',
      street: 'Via Solferino 11',
      postalCode: '20121',
      city: 'Milano',
      region: 'Lombardia',
      country: 'IT',
      lat: 45.4754,
      lng: 9.1869,
      phone: '+39 02 657 88 21',
      hours: 'Lun–Ven 10:00–18:30 (su appuntamento)'
    }
  ],
  shipping: {
    standardCost: 180,
    freeThreshold: 6000,
    sampleCost: 0,
    handlingMinDays: 10,
    handlingMaxDays: 18,
    transitMinDays: 2,
    transitMaxDays: 4,
    countries: ['PL', 'DE', 'AT', 'CZ', 'SK', 'IT', 'FR', 'NL', 'BE']
  },
  returns: {
    days: 14,
    note: 'Standardowe płyty katalogowe i zestawy próbek podlegają 14-dniowemu prawu zwrotu. Panele docinane na indywidualny wymiar ściany realizowane są na zamówienie.'
  },
  nav: [
    { label: 'Sklep', href: '/sklep/' },
    { label: 'Kolekcje', href: '/kolekcje/' },
    { label: 'Próbki', href: '/probki/' },
    { label: 'Poradnik', href: '/poradnik/' },
    { label: 'Proces', href: '/proces/' },
    { label: 'Atelier', href: '/atelier/' },
    { label: 'Kontakt', href: '/kontakt/' }
  ]
};
