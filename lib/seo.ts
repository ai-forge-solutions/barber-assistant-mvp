import type { Metadata } from 'next'

export const SITE_URL = 'https://trujas.app'

// Keep canonical URLs scoped to marketing pages. A root-layout canonical would
// incorrectly canonicalize auth, account and individual shop pages to the home.
export function marketingMetadata(path: '/' | '/pricing', title: string, description: string): Metadata {
  const url = new URL(path, SITE_URL).toString()
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'trujas',
      url,
      title,
      description,
    },
    twitter: { card: 'summary', title, description },
  }
}
