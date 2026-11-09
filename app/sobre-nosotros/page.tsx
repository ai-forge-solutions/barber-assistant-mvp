import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { organizationSchema } from '@/lib/structured-data'
import { SITE_URL } from '@/lib/seo'
import { resourceMetadata } from '@/components/resources/metadata'
import '@/app/recursos/resources.css'

export const metadata = resourceMetadata(
  '/sobre-nosotros',
  'Sobre nosotros y proceso editorial | trujas',
  'Quién está detrás de trujas, cómo preparamos las guías con ayuda de IA y cuáles son sus límites.',
)

export default function AboutPage() {
  return (
    <div className="resources-shell">
      <a className="resources-skip" href="#about-main">Saltar al contenido</a>
      <header className="resources-header">
        <nav className="resources-nav" aria-label="Navegación principal">
          <Link className="resources-brand" href="/" aria-label="trujas: inicio">trujas</Link>
          <div className="resources-nav-links"><Link href="/recursos">Recursos</Link><Link href="/pricing">Ver planes</Link></div>
        </nav>
      </header>
      <main id="about-main" className="resources-main">
        <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
          organizationSchema,
          { '@type': 'AboutPage', '@id': `${SITE_URL}/sobre-nosotros#page`, url: `${SITE_URL}/sobre-nosotros`, name: 'Sobre nosotros y proceso editorial', about: { '@id': organizationSchema['@id'] } },
          { '@type': 'Person', '@id': `${SITE_URL}/sobre-nosotros#miguel`, name: 'Miguel Carmona Rodríguez', jobTitle: 'Desarrollador de trujas' },
          { '@type': 'Person', '@id': `${SITE_URL}/sobre-nosotros#pablo`, name: 'Pablo', jobTitle: 'Dueño de Trubarber' },
          { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Sobre nosotros', item: `${SITE_URL}/sobre-nosotros` },
          ] },
        ] }} />
        <header className="resources-intro">
          <p className="resources-eyebrow">Las personas y el contenido</p>
          <h1>Sobre nosotros</h1>
          <p>trujas es una herramienta de gestión de citas para barberías. Aquí te contamos quién está detrás y qué puedes esperar de nuestras guías.</p>
        </header>
        <div className="resource-prose">
          <section aria-labelledby="people-title">
            <h2 id="people-title">Quién está detrás</h2>
            <h3>Miguel Carmona Rodríguez</h3>
            <p>Miguel es el desarrollador de trujas. Su papel es construir el producto.</p>
            <h3>Pablo</h3>
            <p>Pablo es dueño de Trubarber, una peluquería en Galicia. Es la persona del entorno de la peluquería vinculada al proyecto. Esto no implica que Pablo haya escrito o revisado las guías ni que haya validado sus recomendaciones legales o fiscales.</p>
          </section>
          <section id="proceso-editorial" aria-labelledby="editorial-title">
            <h2 id="editorial-title">Proceso editorial</h2>
            <p>Publicamos las guías bajo la firma colectiva Equipo de trujas. Esa firma identifica el contenido del proyecto, no una autoría individual ni una acreditación profesional.</p>
            <p>Usamos inteligencia artificial como ayuda para preparar y estructurar contenido. Puede cometer errores, omitir matices o manejar información desactualizada. No presentamos los textos como testimonios de clientes ni como pruebas realizadas por Pablo.</p>
            <p>Distinguimos las recomendaciones de organización de los requisitos legales. En cada guía indicamos su alcance y las fuentes pertinentes para que puedas comprobar la información en origen. Las fechas de publicación no significan que el contenido se haya verificado de nuevo hoy.</p>
            <p>Las guías legales y fiscales no han pasado una revisión profesional jurídica, fiscal o técnica. Son orientación general: no sustituyen a tu gestoría, un técnico competente o la consulta a tu ayuntamiento y a la administración correspondiente.</p>
            <p>Los recursos se publican en la web del producto y pueden mencionar trujas. Esa relación comercial no convierte las recomendaciones en una comparación independiente ni garantiza resultados para tu negocio.</p>
          </section>
          <section aria-labelledby="checks-title">
            <h2 id="checks-title">Antes de tomar una decisión</h2>
            <p>Comprueba las condiciones vigentes en las fuentes oficiales y las circunstancias de tu local. Si detectas una contradicción, prioriza la información oficial aplicable y busca asesoramiento profesional antes de actuar.</p>
            <Link className="resources-read" href="/recursos">Explora las guías de barbería →</Link>
          </section>
        </div>
      </main>
      <footer className="resources-footer"><Link className="resources-home" href="/">Volver al inicio</Link></footer>
    </div>
  )
}
