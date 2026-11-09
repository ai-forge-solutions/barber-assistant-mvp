import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import ResourceEditorialNote from '@/components/resources/ResourceEditorialNote'
import { articleSchema, breadcrumbSchema } from '@/lib/structured-data'
import { notFound } from 'next/navigation'
import { getResource, listResources } from '@/lib/resources'
import ResourceMarkdown from '@/components/resources/ResourceMarkdown'
import { resourceMetadata } from '@/components/resources/metadata'

export const dynamicParams = false

export function generateStaticParams() {
  return listResources().map(({ slug }) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = getResource(slug)
  if (!post) notFound()
  return {
    ...resourceMetadata(`/recursos/${post.slug}`, `${post.title} | trujas`, post.description),
    ...(post.editorialStatus === 'pending_review' ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const post = getResource(slug)
  if (!post) notFound()
  const related = listResources().filter((entry) => entry.slug !== post.slug)
  return (
    <>
      <JsonLd data={articleSchema(post)} />
      <JsonLd data={breadcrumbSchema([{ name: 'Inicio', path: '/' }, { name: 'Recursos', path: '/recursos' }, { name: post.title, path: `/recursos/${post.slug}` }])} />
      <nav className="resources-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span><Link href="/recursos">Recursos</Link>
      </nav>
      <article>
        <header className="resource-article-header">
          <p className="resources-eyebrow">Guías de barbería</p>
          <h1>{post.title}</h1>
          <p className="resources-date">Por <Link href="/sobre-nosotros#proceso-editorial">Equipo de trujas</Link> · Elaborado con ayuda de IA</p>
          {post.publishedAt ? (
            <p className="resources-date">Publicado el <time dateTime={post.publishedAt}>{new Date(`${post.publishedAt}T00:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time></p>
          ) : post.editorialStatus === 'pending_review' ? (
            <p className="resources-date">Vista previa · Pendiente de revisión editorial</p>
          ) : null}
        </header>
        <ResourceMarkdown body={post.body} />
        <ResourceEditorialNote slug={post.slug} />
      </article>
      <aside className="resources-related" aria-labelledby="resources-related-title">
        <h2 id="resources-related-title">Sigue leyendo</h2>
        <ul>{related.map((entry) => <li key={entry.slug}><Link href={`/recursos/${entry.slug}`}>{entry.title}</Link></li>)}</ul>
        <Link className="resources-read" href="/recursos">Ver todos los recursos</Link>
      </aside>
    </>
  )
}
