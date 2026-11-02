import Link from 'next/link'
import './resources.css'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="resources-shell">
      <a className="resources-skip" href="#resources-main">Saltar al contenido</a>
      <header className="resources-header">
        <nav className="resources-nav" aria-label="Navegación de recursos">
          <Link className="resources-brand" href="/" aria-label="trujas: inicio">trujas</Link>
          <div className="resources-nav-links">
            <Link href="/recursos">Recursos</Link>
            <Link href="/pricing">Ver planes</Link>
          </div>
        </nav>
      </header>
      <main id="resources-main" className="resources-main">{children}</main>
      <footer className="resources-footer">
        <p>Prepara tu agenda con trujas.</p>
        <Link className="resources-cta" href="/pricing">Consulta los planes</Link>
        <Link className="resources-home" href="/">Volver al inicio</Link>
      </footer>
    </div>
  )
}
