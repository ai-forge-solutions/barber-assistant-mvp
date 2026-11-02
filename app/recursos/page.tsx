import Link from 'next/link'
import { listResources } from '@/lib/resources'
import { resourceMetadata } from '@/components/resources/metadata'

export const metadata = resourceMetadata(
  '/recursos',
  'Recursos para abrir y organizar tu barbería | trujas',
  'Guías prácticas para abrir una barbería en España y organizar servicios, horarios y citas en una agenda de referencia.',
)

export default function ResourcesPage() {
  const posts = listResources()
  return (
    <>
      <header className="resources-intro">
        <p className="resources-eyebrow">El oficio, también fuera de la silla</p>
        <h1>Recursos para tu barbería</h1>
        <p>De preparar tu primer local a ordenar las citas del día a día.</p>
      </header>
      <section aria-label="Guías de barbería">
        <ol className="resources-list">
          {posts.map((post, index) => (
            <li key={post.slug} className="resources-card">
              <span className="resources-number" aria-hidden="true">0{index + 1}</span>
              <div>
                <h2><Link href={`/recursos/${post.slug}`}>{post.title}</Link></h2>
                <p>{post.description}</p>
                <Link className="resources-read" href={`/recursos/${post.slug}`}>Leer guía<span className="resources-sr-only">: {post.title}</span> <span aria-hidden="true">→</span></Link>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
