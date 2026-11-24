import Link from 'next/link'
import '../../recursos/resources.css'

export const metadata = { robots: { index: false, follow: false } }

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <div className="resources-shell">
    <a className="resources-skip" href="#resources-main">Saltar al contenido</a>
    <header className="resources-header"><nav className="resources-nav" aria-label="Revisión editorial">
      <Link className="resources-brand" href="/">trujas</Link>
      <Link href="/revision-seo/2026-w47">Revisión W47</Link>
    </nav></header>
    <main id="resources-main" className="resources-main">{children}</main>
    <footer className="resources-footer"><p>Borradores de revisión. No publicados ni aprobados.</p></footer>
  </div>
}