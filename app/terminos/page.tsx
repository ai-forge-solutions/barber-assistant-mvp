import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'

const sections = [
  {
    title: 'Qué es trujas',
    body: 'trujas es una herramienta para que barberías gestionen su agenda y permitan a sus clientes reservar citas online. La plataforma no presta servicios de barbería: el corte, la cita y cualquier servicio presencial los presta la barbería correspondiente.',
  },
  {
    title: 'Uso por parte de barberías',
    body: 'La barbería debe introducir información real sobre horarios, servicios, precios, barberos y disponibilidad. También debe mantener sus datos actualizados para evitar reservas imposibles o comunicaciones incorrectas con clientes.',
  },
  {
    title: 'Reservas de clientes',
    body: 'El cliente debe facilitar datos correctos y acudir a la cita reservada. La barbería puede confirmar, modificar o cancelar reservas cuando exista una causa operativa, avisando al cliente por los canales disponibles.',
  },
  {
    title: 'Precio y prueba',
    body: 'Las condiciones comerciales vigentes se muestran antes de contratar. Si existe una prueba gratuita o una oferta de apertura, se aplicará durante el periodo indicado. Cualquier renovación, precio anual o cambio de plan deberá aceptarse de forma clara antes de cobrarse.',
  },
  {
    title: 'Comunicaciones',
    body: 'trujas puede enviar emails transaccionales relacionados con la cuenta, citas, recordatorios, cancelaciones o seguridad. Estas comunicaciones son necesarias para prestar el servicio y no son publicidad general.',
  },
  {
    title: 'Disponibilidad del servicio',
    body: 'Trabajamos para que trujas funcione de forma estable, pero pueden existir mantenimientos, incidencias técnicas o interrupciones de proveedores. Cuando una incidencia afecte a reservas o agenda, se intentará reducir el impacto y recuperar el servicio cuanto antes.',
  },
  {
    title: 'Uso correcto',
    body: 'No se permite usar trujas para enviar spam, publicar información falsa, acceder a cuentas ajenas, extraer datos de forma abusiva, saltarse medidas de seguridad o realizar actividades ilegales.',
  },
  {
    title: 'Responsabilidad',
    body: 'La barbería es responsable de la prestación presencial del servicio, sus precios, su atención al cliente y el cumplimiento de sus obligaciones legales. trujas responde por la herramienta tecnológica en los términos permitidos por la ley aplicable.',
  },
  {
    title: 'Cambios en estos términos',
    body: 'Podemos actualizar estos términos para reflejar cambios del producto, legales u operativos. Si el cambio es relevante para barberías activas, se comunicará con antelación razonable por los canales de la plataforma.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ColorStripe />
      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <Link href="/" className="inline-flex"><Logo size="md" /></Link>
        <p className="mt-8 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#999999]">Información legal</p>
        <h1 className="mt-2 font-['Oswald'] text-[38px] font-bold uppercase leading-tight text-[#111111]">Términos de uso</h1>
        <p className="mt-4 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
          Estos términos recogen las reglas básicas para usar trujas como barbería o como cliente que reserva cita. La idea es sencilla: agenda clara, datos correctos y uso honesto de la plataforma.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-sm border border-[#E5E5E5] bg-white px-5 py-5">
              <h2 className="font-['Oswald'] text-[19px] font-semibold uppercase text-[#111111]">{section.title}</h2>
              <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 rounded-sm border-l-4 border-[#1A3A6B] bg-white px-5 py-4">
          <p className="font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
            Última actualización: julio de 2026. Antes de vender de forma masiva, la barbería o el titular del servicio debe añadir sus datos legales concretos en la contratación y canales de contacto.
          </p>
        </div>
        <Link href="/" className="mt-8 inline-flex min-h-[44px] items-center rounded-sm border-2 border-[#111111] px-6 py-3 font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-[#111111] hover:bg-[#E5E5E5]">
          Volver
        </Link>
      </main>
      <ColorStripe />
    </div>
  )
}
