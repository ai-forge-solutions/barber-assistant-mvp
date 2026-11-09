import { SITE_URL } from '@/lib/seo'

// Product identity, not a declaration of an unverified legal entity.
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'trujas',
  url: SITE_URL,
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'trujas',
  url: SITE_URL,
  inLanguage: 'es',
  publisher: { '@id': organizationSchema['@id'] },
}

export const editorialTeamSchema = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/sobre-nosotros#equipo-editorial`,
  name: 'Equipo de trujas',
  url: `${SITE_URL}/sobre-nosotros#proceso-editorial`,
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: new URL(path, SITE_URL).toString(),
    })),
  }
}

// Read-only projection of the approved resource record; no fabricated updates.
export function articleSchema(post: { slug: string; title: string; description: string; publishedAt: string }) {
  const url = `${SITE_URL}/recursos/${post.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    inLanguage: 'es',
    url,
    mainEntityOfPage: url,
    author: editorialTeamSchema,
    publisher: { '@id': organizationSchema['@id'], '@type': 'Organization', name: 'trujas', url: SITE_URL },
  }
}

export function resourceListSchema(posts: { slug: string; title: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/recursos#list`,
    name: 'Recursos para tu barbería',
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem', position: index + 1, name: post.title, url: `${SITE_URL}/recursos/${post.slug}`,
    })),
  }
}
