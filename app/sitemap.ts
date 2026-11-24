import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { sitemapContentDates } from '@/lib/sitemap-content-dates'

export default function sitemap(): MetadataRoute.Sitemap {
  // Explicit allowlist: never enumerate shops, customers, booking tokens or
  // unpublished editorial content. Only explicitly approved resources go here.
  return ([
    '/', '/pricing', '/sobre-nosotros', '/recursos',
    '/recursos/montar-barberia-espana',
    '/recursos/organizar-agenda-barberia',
    '/recursos/elegir-app-reservas-barberia',
    '/recursos/reducir-no-shows-barberia',
    '/recursos/calcular-precios-barberia',
    '/recursos/conseguir-clientes-barberia-barrio',
    '/funciones', '/funciones/pagina-reservas',
  ] as const).map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified: sitemapContentDates[path].lastModified,
  }))
}
