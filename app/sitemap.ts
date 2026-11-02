import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  // Explicit allowlist: never enumerate shops, customers, booking tokens or
  // unpublished editorial content. Add reviewed public resources here later.
  return ['/', '/pricing'].map((path) => ({ url: new URL(path, SITE_URL).toString() }))
}
