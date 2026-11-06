import type { Metadata } from 'next'
import Link from 'next/link'
import ConnectionPanel from './ConnectionPanel'

export const metadata: Metadata = { title: 'Conecta tu asistente — trujas', robots: { index: false, follow: false } }

export default function ConnectPage() {
  return <div className="bg-white text-[#111111] font-['DM_Sans'] min-h-screen">
    <nav className="border-b border-[#E5E5E5] px-6 py-4"><Link href="/" className="font-['Rye'] text-2xl">trujas</Link></nav>
    <div className="h-1.5 flex" aria-hidden="true"><div className="flex-1 bg-[#C8102E]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#1A3A6B]" /></div>
    <main className="max-w-xl mx-auto px-5 py-10">
      <p className="font-['Oswald'] text-sm uppercase tracking-[0.08em] text-[#555555]">Piloto · Reservas por chat</p>
      <h1 className="font-['Oswald'] text-4xl uppercase mt-3">Tu barbería, desde tu asistente</h1>
      <p className="mt-4 leading-relaxed">Conecta tu cuenta de trujas para consultar huecos y reservar desde un asistente compatible con MCP. Tú eliges la barbería y confirmas los detalles antes de crear la cita.</p>
      <ConnectionPanel />
      <section className="mt-10 border-t border-[#E5E5E5] pt-6">
        <h2 className="font-['Oswald'] text-2xl uppercase">Una cuenta, varias barberías</h2>
        <ul className="mt-4 space-y-3 list-disc pl-5 text-[#555555]">
          <li>Verás las barberías de tu historial, sin confundirlas con favoritos o visitas confirmadas.</li>
          <li>Puedes elegir otra con su identificador público, aunque nunca hayas reservado allí.</li>
          <li>Si tienes varias y no indicas cuál, el asistente deberá preguntarte.</li>
          <li>Solo se guarda una barbería habitual si lo pides. Puedes cambiarla o quitarla.</li>
        </ul>
      </section>
      <section className="mt-8 border-t border-[#E5E5E5] pt-6">
        <h2 className="font-['Oswald'] text-2xl uppercase">Conexión individual</h2>
        <ol className="mt-4 space-y-3 list-decimal pl-5 text-[#555555]">
          <li>Cuando el piloto esté activo, añade la dirección como conector personalizado en tu asistente.</li>
          <li>Inicia sesión en trujas y revisa la cuenta y permisos que autorizas.</li>
          <li>Pide un hueco. El asistente preparará una propuesta con barbería, profesional, servicio, precio y hora local.</li>
          <li>Confirma esos detalles para crear la reserva. Preparar una propuesta no bloquea el hueco.</li>
        </ol>
        <p className="mt-5 text-[#555555]">Cada persona conecta su propia cuenta, y cada asistente se autoriza por separado. No compartas contraseñas ni claves. Este piloto no permite pagos, cambios ni cancelaciones.</p>
        <Link href="/oauth/connections" className="inline-flex items-center mt-5 min-h-11 text-[#1A3A6B] underline">Gestionar y revocar mis conexiones</Link>
      </section>
    </main>
  </div>
}
