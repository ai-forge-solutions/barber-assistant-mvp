import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <header className="border-b border-[#E5E5E5] px-6 py-4">
        <Link href="/" className="inline-flex min-h-11 items-center font-['Rye'] text-[24px]" aria-label="trujas — inicio">
          trujas
        </Link>
      </header>
      <ColorStripe />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16">
        <p className="font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase text-[#C8102E]">404</p>
        <h1 className="mt-3 font-['Oswald'] font-bold text-[36px] leading-tight">Página no encontrada</h1>
        <p className="mt-4 max-w-lg font-['DM_Sans'] text-[16px] leading-relaxed text-[#555555]">
          Esta dirección no existe. Si buscas una barbería, comprueba el enlace que te han enviado.
        </p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-sm bg-[#C8102E] px-6 py-3 font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase text-white">
          Volver al inicio
        </Link>
      </main>
    </div>
  )
}
