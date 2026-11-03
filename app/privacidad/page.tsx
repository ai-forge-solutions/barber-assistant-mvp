import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'
import CookieSettingsButton from '@/components/analytics/CookieSettingsButton'

const sections = [
  {
    title: 'Responsable del tratamiento',
    body: 'Cuando reservas en una barbería, la barbería es la responsable de los datos necesarios para prestar el servicio. trujas actúa como herramienta tecnológica para gestionar reservas, agenda y comunicaciones operativas. Si una barbería comunica una razón social, dirección o contacto propio, esa información completa esta política para sus clientes.',
  },
  {
    title: 'Datos que tratamos',
    body: 'Nombre, teléfono, email, servicio solicitado, fecha y hora de la cita, barbero seleccionado, historial de reservas, cancelaciones y datos técnicos mínimos para seguridad, sesión y funcionamiento de la plataforma.',
  },
  {
    title: 'Para qué usamos los datos',
    body: 'Para crear y gestionar citas, confirmar reservas, enviar recordatorios, avisar de cambios o cancelaciones, permitir a la barbería organizar su agenda y atender incidencias relacionadas con el servicio.',
  },
  {
    title: 'Base legal',
    body: 'La base principal es la ejecución de la reserva solicitada y la relación contractual o precontractual entre cliente y barbería. La analítica web solo se activa con tu consentimiento, que puedes retirar cuando quieras. Cuando haga falta consentimiento para una comunicación concreta, se pedirá de forma separada.',
  },
  {
    title: 'Con quién compartimos datos',
    body: 'No vendemos datos personales. Pueden acceder proveedores tecnológicos necesarios para operar trujas, como infraestructura, base de datos, autenticación, envío de emails o herramientas de seguridad, siempre limitados a la prestación del servicio. Si aceptas las cookies analíticas, Google Analytics recibe datos de uso de la web, sin tu nombre, email ni teléfono.',
  },
  {
    title: 'Conservación',
    body: 'Los datos se conservan mientras sean necesarios para gestionar la reserva, mantener el historial operativo de la barbería y cumplir obligaciones legales o atender reclamaciones. Después se bloquean o eliminan cuando ya no son necesarios.',
  },
  {
    title: 'Derechos',
    body: 'Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad contactando con la barbería donde reservaste o mediante el canal de contacto disponible en trujas También puedes reclamar ante la autoridad de protección de datos competente.',
  },
]

const cookieRows = [
  {
    name: 'Sesión de Supabase (sb-…)',
    owner: 'trujas',
    purpose: 'Mantener tu sesión iniciada y proteger la cuenta.',
    duration: 'Sesión o hasta que cierras sesión',
    type: 'Necesaria',
  },
  {
    name: 'trujas_consent_v1 (almacenamiento local)',
    owner: 'trujas',
    purpose: 'Recordar si aceptaste o rechazaste la analítica.',
    duration: 'Hasta que la borres',
    type: 'Necesaria',
  },
  {
    name: '_ga, _ga_<ID>',
    owner: 'Google Analytics',
    purpose: 'Contar visitas y saber qué pasos de la web se usan, de forma agregada.',
    duration: '13 meses',
    type: 'Analítica (solo si aceptas)',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <ColorStripe />
      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <Link href="/" className="inline-flex"><Logo size="md" /></Link>
        <p className="mt-8 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#999999]">Información legal</p>
        <h1 className="mt-2 font-['Oswald'] text-[38px] font-bold uppercase leading-tight text-[#111111]">Política de privacidad</h1>
        <p className="mt-4 font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
          Esta política explica cómo se tratan los datos personales necesarios para usar trujas y reservar cita en barberías que utilizan la plataforma. Está escrita para clientes y barberos, con lenguaje claro y sin letra pequeña.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-sm border border-[#E5E5E5] bg-white px-5 py-5">
              <h2 className="font-['Oswald'] text-[19px] font-semibold uppercase text-[#111111]">{section.title}</h2>
              <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{section.body}</p>
            </section>
          ))}
        </div>
        <section id="cookies" className="mt-4 scroll-mt-6 rounded-sm border border-[#E5E5E5] bg-white px-5 py-5">
          <h2 className="font-['Oswald'] text-[19px] font-semibold uppercase text-[#111111]">Cookies y analítica</h2>
          <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            Usamos cookies imprescindibles para la sesión y la seguridad, que no necesitan consentimiento. Además, si aceptas en el aviso de cookies, usamos Google Analytics 4 (Google Ireland Limited) para medir de forma agregada qué páginas se visitan y en qué paso se quedan las reservas, los registros y las altas de barberías. Sin tu aceptación no se carga ningún script de Google.
          </p>
          <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            No enviamos a Google tu nombre, email, teléfono ni el contenido de tus citas, y quitamos de las direcciones los identificadores y enlaces privados (por ejemplo, de cancelación o de pago). No usamos publicidad, remarketing ni Google Signals. Google Analytics no guarda direcciones IP. Google puede tratar datos fuera del Espacio Económico Europeo con las garantías del Marco de Privacidad de Datos UE-EE. UU. y las cláusulas contractuales tipo. Los datos de analítica se conservan 14 meses.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left font-['DM_Sans'] text-[13px] text-[#555555]">
              <thead>
                <tr className="border-b-2 border-[#111111]">
                  {['Cookie', 'De quién', 'Para qué', 'Duración', 'Tipo'].map((heading) => (
                    <th key={heading} className="py-2 pr-3 font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cookieRows.map((row) => (
                  <tr key={row.name} className="border-b border-[#E5E5E5] align-top">
                    <td className="py-2 pr-3 text-[#111111]">{row.name}</td>
                    <td className="py-2 pr-3">{row.owner}</td>
                    <td className="py-2 pr-3">{row.purpose}</td>
                    <td className="py-2 pr-3">{row.duration}</td>
                    <td className="py-2 pr-3">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            Puedes cambiar tu elección cuando quieras. Si retiras el consentimiento, dejamos de medir y borramos las cookies de Google Analytics de este navegador.
          </p>
          <CookieSettingsButton className="mt-4 inline-flex min-h-[44px] items-center rounded-sm border-2 border-[#111111] px-6 py-3 font-['Oswald'] text-[14px] font-semibold uppercase tracking-[0.08em] text-[#111111] hover:bg-[#E5E5E5]">
            Cambiar preferencias de cookies
          </CookieSettingsButton>
        </section>
        <div className="mt-8 rounded-sm border-l-4 border-[#C8102E] bg-white px-5 py-4">
          <p className="font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
            Última actualización: noviembre de 2026. Si una barbería necesita añadir sus datos legales concretos, debe incorporarlos en su página pública o documentación de contratación antes de vender el servicio a sus clientes.
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
