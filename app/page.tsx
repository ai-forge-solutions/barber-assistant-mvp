import ColorStripe from '@/components/brand/ColorStripe'
import PublicNav from '@/components/nav/PublicNav'
import LoginButton from '@/components/auth/LoginButton'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ColorStripe />
      <PublicNav />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="text-center max-w-2xl">
          {/* Eyebrow */}
          <p className="font-['Oswald'] font-semibold text-[13px] tracking-[0.12em] uppercase text-[#C8102E] mb-4">
            SaaS para barberías independientes
          </p>

          {/* H1 */}
          <h1 className="font-['Rye'] font-bold uppercase text-[34px] leading-[1.1] text-[#111111] tracking-[0.02em] mb-6 sm:text-[46px]">
            TU AGENDA,<br />SIN CAOS.
          </h1>

          {/* Subtext */}
          <p className="font-['DM_Sans'] text-[18px] text-[#555555] mb-10 leading-relaxed max-w-md mx-auto">
            Ellos reservan. Tú trabajas. Gestiona citas, recordatorios y tu equipo desde el móvil.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <LoginButton label="Empieza gratis" next="/dashboard" />
            <span className="font-['DM_Sans'] text-[13px] text-[#999999]">
              Sin tarjeta de crédito
            </span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-20 flex flex-wrap justify-center gap-3">
          {['Reservas online', 'Recordatorios por email', 'Agenda en tiempo real', 'Link público + QR', 'Gestión de equipo'].map((f) => (
            <span
              key={f}
              className="font-['DM_Sans'] text-[13px] text-[#555555] border border-[#E5E5E5] px-4 py-2 rounded-sm"
            >
              {f}
            </span>
          ))}
        </div>
      </main>

      <ColorStripe />
    </div>
  )
}
