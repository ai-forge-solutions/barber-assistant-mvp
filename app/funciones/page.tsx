import Link from 'next/link'
import { resourceMetadata } from '@/components/resources/metadata'
import { reservationFeature } from '@/content/features/index'

export const metadata = resourceMetadata(
  '/funciones',
  'Funciones para la agenda de tu barbería | trujas',
  'Conoce la página de reservas de trujas, el acceso de tus clientes y los avisos por email. Revisa el recorrido y consulta los planes para tu barbería.',
)

export default function FeaturesPage() {
  return (
    <>
      <nav className="resources-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span><span aria-current="page">Funciones</span>
      </nav>
      <header className="resources-intro">
        <p className="resources-eyebrow">Funciones de trujas</p>
        <h1>Tu agenda, desde el enlace hasta la cita</h1>
        <p>Consulta cómo funciona la reserva web antes de elegir un plan para tu barbería.</p>
        <p className="resources-date">Pendiente de revisión editorial</p>
      </header>
      <ul className="resources-list">
        <li className="resources-card">
          <span className="resources-number" aria-hidden="true">01</span>
          <div>
            <h2><Link href="/funciones/pagina-reservas">Página de reservas online</Link></h2>
            <p>{reservationFeature.description}</p>
            <Link className="resources-read" href="/funciones/pagina-reservas">Consulta el recorrido de reserva</Link>
          </div>
        </li>
      </ul>
      <section className="resources-related" aria-labelledby="feature-reminders">
        <h2 id="feature-reminders">Recordatorios por email</h2>
        <p>La confirmación se inicia al crear la cita y el recordatorio está previsto para aproximadamente el día anterior. No son mensajes automáticos de WhatsApp ni una garantía de asistencia.</p>
        <Link className="resources-read" href="/funciones/pagina-reservas">Lee cómo funcionan los avisos en la guía de reservas</Link>
      </section>
    </>
  )
}
