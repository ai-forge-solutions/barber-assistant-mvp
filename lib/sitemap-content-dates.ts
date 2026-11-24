// Reviewed git content-change evidence. These are NOT publication dates.
// Keep this manifest and the independent expectations in discovery-sitemap-dates
// in sync ONLY after reviewing meaningful rendered-content changes (see docs).
const trustUpdate = {
  lastModified: '2026-11-09T16:03:56Z',
  commit: '0dbb6ec84e6552490ddca0e37c3c5f7d1eee80b6',
} as const
const publicationCopyUpdate = {
  lastModified: '2026-11-09T17:19:06Z',
  commit: '78df903825d5edb743e605630cb8983ba6b920f7',
} as const
const resourceTrustUpdate = {
  ...trustUpdate,
  paths: ['app/recursos/[slug]/page.tsx', 'components/resources/ResourceEditorialNote.tsx'],
  reason: 'Added visible authorship and substantive editorial method, scope and source caveats outside the unchanged Markdown body.',
} as const
const resourcePublicationUpdate = {
  ...publicationCopyUpdate,
  paths: ['app/recursos/[slug]/page.tsx', 'lib/resources.ts'],
  reason: 'Approved resources now render without the pending-review notice. Earlier editorial notes remain; no claim of a new factual review.',
} as const

export const sitemapContentDates = {
  '/': {
    ...trustUpdate,
    paths: ['app/page.tsx', 'components/landing/ExampleMockup.tsx', 'components/landing/TrustComparison.tsx', 'components/pricing/PricingTeaser.tsx'],
    reason: 'Clarified the offer and added visible illustrative-example labels, trust comparison and editorial discovery links.',
  },
  '/pricing': {
    ...trustUpdate,
    paths: ['app/pricing/page.tsx', 'components/pricing/PricingBlocks.tsx', 'components/pricing/PricingFaq.tsx'],
    reason: 'Clarified billing, trial and plan conditions and added visible pricing questions and answers.',
  },
  '/sobre-nosotros': {
    ...trustUpdate,
    paths: ['app/sobre-nosotros/page.tsx'],
    reason: 'Created the public team, product origin and editorial-process page with explicit limits on review claims.',
  },
  '/recursos': {
    ...publicationCopyUpdate,
    paths: ['app/recursos/page.tsx', 'lib/resources.ts'],
    reason: 'Removed preview wording from the reservation-feature introduction and approved the four new guide entries.',
  },
  '/recursos/montar-barberia-espana': resourceTrustUpdate,
  '/recursos/organizar-agenda-barberia': resourceTrustUpdate,
  '/recursos/elegir-app-reservas-barberia': resourcePublicationUpdate,
  '/recursos/reducir-no-shows-barberia': resourcePublicationUpdate,
  '/recursos/calcular-precios-barberia': resourcePublicationUpdate,
  '/recursos/conseguir-clientes-barberia-barrio': resourcePublicationUpdate,
  '/funciones': {
    ...publicationCopyUpdate,
    paths: ['app/funciones/page.tsx', 'content/features/index.ts'],
    reason: 'Removed the visible pending-review notice from the feature index and updated the linked feature editorial assistance copy.',
  },
  '/funciones/pagina-reservas': {
    ...publicationCopyUpdate,
    paths: ['app/funciones/pagina-reservas/page.tsx', 'content/features/index.ts'],
    reason: 'Removed the visible pending-review notice and changed the rendered AI-assistance attribution to publication-ready copy.',
  },
} as const
