import Link from 'next/link'

// Editorial context sits outside the historical approved Markdown body.
export default function ResourceEditorialNote({ slug }: { slug: string }) {
  const openingGuide = slug === 'montar-barberia-espana'
  return (
    <aside className="resource-prose resources-editorial-note" aria-labelledby="editorial-note-title">
      <h2 id="editorial-note-title">Nota editorial: método y alcance</h2>
      <p>Esta guía se publica bajo la firma colectiva Equipo de trujas y se prepara con ayuda de inteligencia artificial. Esa firma no atribuye la redacción ni la revisión a Pablo. <Link href="/sobre-nosotros#proceso-editorial">Conoce nuestro proceso editorial y sus límites</Link>.</p>
      {openingGuide ? <>
        <p>Es orientación general y no sustituye el asesoramiento sobre tu expediente. No ha pasado una revisión profesional jurídica, fiscal o técnica. Antes de alquilar o abrir, confirma los requisitos de tu actividad y de tu municipio con la administración y un profesional competente.</p>
        <p>Para el apartado de alta censal, la referencia es el <a href="https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml">trámite oficial del modelo 036 de la AEAT</a>. Las fuentes del cuerpo conservan su fecha original de consulta; esta nota no certifica una nueva revisión de cada requisito ni modifica el texto publicado.</p>
      </> : <>
        <p>El método es una propuesta de organización: definir servicios, estimar tiempos y mantener una única agenda; no es un estudio de resultados ni una prueba realizada en Trubarber y no garantiza menos ausencias o más reservas.</p>
        <p>Si tu agenda contiene datos de clientes, limita la información que recoges y quién puede acceder. La <a href="https://www.aepd.es/guias/guia-proteccion-datos-por-defecto.pdf">guía de protección de datos por defecto de la AEPD</a> sirve para profundizar en ese principio, no para validar las duraciones propuestas ni el rendimiento de trujas. Esta guía no sustituye una evaluación de tus obligaciones de protección de datos.</p>
      </>}
      <p>Las menciones a trujas proceden de la web del propio producto. Comprueba los <Link href="/pricing">planes y condiciones vigentes</Link> antes de contratar; la fecha de publicación no equivale a una actualización de precios.</p>
    </aside>
  )
}
