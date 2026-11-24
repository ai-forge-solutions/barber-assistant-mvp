import Link from 'next/link'
import { notFound } from 'next/navigation'
import { reviewCatalog } from '@/lib/seo-w47-review'
import ResourceMarkdown from '@/components/resources/ResourceMarkdown'
import { resourceMetadata } from '@/components/resources/metadata'

export const dynamicParams = false
export function generateStaticParams() { return reviewCatalog.list().map(({ slug }) => ({ slug })) }
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const post = reviewCatalog.get((await params).slug)
  if (!post) notFound()
  return { ...resourceMetadata(post.canonicalPath, `${post.title} | trujas`, post.description), robots: { index: false, follow: false } }
}

export default async function ReviewArticle({ params }: Props) {
  const post = reviewCatalog.get((await params).slug)
  if (!post) notFound()
  return <>
    <nav className="resources-breadcrumb" aria-label="Ruta de revisión"><Link href="/revision-seo/2026-w47">Todas las piezas W47</Link></nav>
    <article>
      <header className="resource-article-header">
        <p className="resources-eyebrow">Revisión explícita requerida · pending_review</p>
        <h1>{post.title}</h1>
        <p className="resources-date">Equipo de trujas · Elaborado con ayuda de IA · Borrador no publicado</p>
        <p>El destino propuesto es {post.canonicalPath}. No acredita aprobación, publicación ni validación profesional.</p>
      </header>
      <ResourceMarkdown body={post.body} />
    </article>
    <Link className="resources-read" href="/revision-seo/2026-w47">Volver a los cinco borradores</Link>
  </>
}