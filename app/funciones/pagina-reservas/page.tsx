import Link from 'next/link'
import ResourceMarkdown from '@/components/resources/ResourceMarkdown'
import { resourceMetadata } from '@/components/resources/metadata'
import { reservationFeature as feature } from '@/content/features/index'

export const metadata = resourceMetadata(
  '/funciones/pagina-reservas',
  'Página de reservas online para tu barbería | trujas',
  feature.description,
)

export default function ReservationFeaturePage() {
  return (
    <>
      <nav className="resources-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/funciones">Funciones</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Página de reservas</span>
      </nav>
      <article>
        <header className="resource-article-header">
          <p className="resources-eyebrow">Funciones de trujas</p>
          <h1>{feature.title}</h1>
          <p className="resources-date">{feature.author}. {feature.assistance}</p>
          <Link className="resources-cta" href="/pricing">Consulta los planes</Link>
        </header>
        <ResourceMarkdown body={feature.body} />
      </article>
    </>
  )
}
