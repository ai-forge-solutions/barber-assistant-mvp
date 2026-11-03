import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

// The existing marketingMetadata helper deliberately restricts paths to home/pricing.
// Reuse its canonical origin without widening that unrelated public contract.
export function resourceMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path, SITE_URL).toString()
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', locale: 'es_ES', siteName: 'trujas', url, title, description },
    twitter: { card: 'summary', title, description },
  }
}
