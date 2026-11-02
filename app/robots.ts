import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Crawl guidance only, not access control or guaranteed deindexing.
      disallow: ['/api/', '/auth/', '/dashboard', '/billing', '/onboarding', '/cuenta/', '/cancel/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
