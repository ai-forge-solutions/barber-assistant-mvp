import Link from 'next/link'
import PublicNav from '@/components/nav/PublicNav'
import ColorStripe from '@/components/brand/ColorStripe'

export const metadata = {
  title: 'Cita cancelada — TURNO.',
}

export default function CancelSuccess() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />
      <ColorStripe />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full text-center">
        {/* Icono check */}
        <div className="w-16 h-16 rounded-full border-2 border-[#1A3A6B] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#1A3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-['Oswald'] font-bold text-[28px] text-[#111111] uppercase tracking-[0.04em] mb-3">
          Tu cita ha sido cancelada
        </h1>
        <p className="font-['DM_Sans'] text-[16px] text-[#555555] mb-8">
          Si quieres reservar otra, puedes hacerlo cuando quieras.
        </p>

        <Link
          href="/"
          className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px] flex items-center"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  )
}
