import Link from 'next/link'
import PublicNav from '@/components/nav/PublicNav'
import ColorStripe from '@/components/brand/ColorStripe'

export const metadata = {
  title: 'Cita ya cancelada — TURNO.',
}

export default function AlreadyCancelled() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <ColorStripe />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full text-center">
        {/* Icono info */}
        <div className="w-16 h-16 rounded-full border-2 border-[#E5E5E5] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
        </div>

        <h1 className="font-['Oswald'] font-bold text-[28px] text-[#111111] uppercase tracking-[0.04em] mb-3">
          Esta cita ya estaba cancelada
        </h1>
        <p className="font-['DM_Sans'] text-[16px] text-[#555555] mb-8">
          Si crees que es un error o quieres reservar de nuevo, puedes hacerlo desde tu barbería.
        </p>

        <Link
          href="/"
          className="bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px] flex items-center"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  )
}
