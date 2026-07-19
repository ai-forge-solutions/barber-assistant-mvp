import Link from 'next/link'
import Logo from '@/components/brand/Logo'
import ColorStripe from '@/components/brand/ColorStripe'

const sections = [
  {
    title: '¿Quién trata tus datos?',
    body: 'La barbería con la que reservas actúa como responsable del tratamiento de los datos necesarios para gestionar la cita. trujas presta la herramienta tecnológica para facilitar reservas, comunicaciones operativas y gestión de agenda.',
  },
  {
    title: '¿Qué datos se tratan?',
    body: 'Nombre, email, teléfono móvil, datos de la cita, servicio reservado, fecha, hora, barbería y barbero seleccionado. También podemos tratar información técnica mínima necesaria para mantener tu sesión y seguridad de la plataforma.',
  },
  {
    title: '¿Para qué se usan?',
    body: 'Para crear y gestionar tu reserva, confirmar la cita, enviar recordatorios, avisar de cambios o cancelaciones, permitir que la barbería contacte contigo por incidencias relacionadas con la cita y mantener un historial operativo de reservas.',
  },
  {
    title: 'Base legal',
    body: 'La base principal es la ejecución de tu solicitud de reserva y la relación precontractual o contractual con la barbería. En los casos en los que sea necesario, se solicitará tu consentimiento para comunicaciones vinculadas al servicio.',
  },
  {
    title: 'Conservación',
    body: 'Los datos se conservarán mientras sean necesarios para gestionar la reserva, mantener la relación con la barbería y atender obligaciones legales, reclamaciones o incidencias operativas.',
  },
  {
    title: 'Cesiones y proveedores',
    body: 'Tus datos no se venden. Pueden tratarse por proveedores tecnológicos necesarios para prestar el servicio, como infraestructura, autenticación, base de datos o envío de emails transaccionales.',
  },
  {
    title: 'Tus derechos',
    body: 'Puedes solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad contactando con la barbería donde realizaste la reserva. También puedes presentar reclamación ante la autoridad de control competente.',
  },
]

export default function DataProtectionPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ColorStripe />
      <main className="flex-1 px-5 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <Logo size="md" />
          <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.1em] uppercase text-[#999999] mt-5">
            Información legal
          </p>
          <h1 className="font-['Oswald'] font-bold text-[32px] leading-tight text-[#111111] uppercase mt-1">
            Protección de datos
          </h1>
          <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555] mt-3">
            Esta información resume cómo se usan los datos personales necesarios para gestionar
            reservas en trujas y en las barberías que utilizan la plataforma.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <section key={section.title} className="border border-[#E5E5E5] rounded-sm px-4 py-4 bg-white">
              <h2 className="font-['Oswald'] font-semibold text-[16px] text-[#111111] uppercase">
                {section.title}
              </h2>
              <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555] mt-2">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="font-['DM_Sans'] text-[12px] leading-relaxed text-[#999999] mt-6">
          Nota: esta pantalla recoge la información operativa de privacidad para el MVP. La barbería
          puede complementar estos datos con su información legal propia cuando corresponda.
        </p>

        <Link
          href="/"
          className="inline-flex mt-8 bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px] items-center"
        >
          Volver
        </Link>
      </main>
      <ColorStripe />
    </div>
  )
}
