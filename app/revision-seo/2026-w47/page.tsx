import Link from 'next/link'
import { reviewCatalog } from '@/lib/seo-w47-review'

export const metadata = { title: 'Revisión editorial W47 | trujas', robots: { index: false, follow: false } }

export default function ReviewIndex() {
  const posts = reviewCatalog.list()
  return <>
    <p className="resources-eyebrow">Revisión explícita requerida · pending_review</p>
    <h1>Recursos de gestión · W47</h1>
    <p>Cinco borradores completos para propietarios de barberías. Preparar esta vista no aprueba ni publica su contenido. Noindex no es control de acceso.</p>
    {posts.length ? <ul className="resources-grid">{posts.map(post => <li key={post.slug} className="resource-card">
      <h2><Link href={`/revision-seo/2026-w47/${post.slug}`}>{post.title}</Link></h2>
      <p>{post.description}</p>
      <Link className="resources-read" href={`/revision-seo/2026-w47/${post.slug}`}>Leer borrador completo</Link>
    </li>)}</ul> : <p>Entrega editorial todavía pendiente. No se muestran piezas inexistentes.</p>}
  </>
}