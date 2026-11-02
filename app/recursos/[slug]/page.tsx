import Link from 'next/link'
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
  return resourceMetadata(`/recursos/${post.slug}`, `${post.title} | trujas`, post.description)
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params
  const post = getResource(slug)
  if (!post) notFound()
  const related = listResources().filter((entry) => entry.slug !== post.slug)
  return (
    <>
      <nav className="resources-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span><Link href="/recursos">Recursos</Link>
      </nav>
      <article>
        <header className="resource-article-header">
          <p className="resources-eyebrow">Guías de barbería</p>
          <h1>{post.title}</h1>
          <p className="resources-date">Publicado el <time dateTime={post.publishedAt}>2 de noviembre de 2026</time></p>
        </header>
        <ResourceMarkdown body={post.body} />
      </article>
      <aside className="resources-related" aria-labelledby="resources-related-title">
        <h2 id="resources-related-title">Sigue leyendo</h2>
        <ul>{related.map((entry) => <li key={entry.slug}><Link href={`/recursos/${entry.slug}`}>{entry.title}</Link></li>)}</ul>
        <Link className="resources-read" href="/recursos">Ver todos los recursos</Link>
      </aside>
    </>
  )
}
