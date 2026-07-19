import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'
import { PricingCards } from '@/components/pricing/PricingBlocks'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="mx-auto max-w-[1040px] bg-white">
        <ColorStripe />
        <header className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-5">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <Link
            href="/auth/barber?next=%2Fdashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm border-2 border-[#111111] px-5 py-2 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#111111] transition-colors duration-150 hover:bg-[#111111] hover:text-white"
          >
            Entrar
          </Link>
        </header>

        <main>
          <section className="border-b border-[#E5E5E5] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="inline-block border border-[#C8102E] px-3 py-2 font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">
                  Precio claro para barberías pequeñas
                </p>
                <h1 className="mt-5 max-w-2xl font-['Oswald'] text-[42px] font-bold uppercase leading-none text-[#111111] sm:text-[58px]">
                  Paga por tener agenda, no por cada reserva.
                </h1>
              </div>
              <div className="border-l-4 border-[#1A3A6B] bg-white px-5 py-4">
                <p className="font-['DM_Sans'] text-[16px] leading-relaxed text-[#555555]">
                  Empieza con el primer mes gratis. El anual baja el recomendado a 15€/mes; el mensual te deja probar con menos compromiso.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 font-['DM_Sans'] text-[12px] text-[#555555]">
                  <span className="border border-[#E5E5E5] px-2 py-3 text-center">Sin comisión</span>
                  <span className="border border-[#E5E5E5] px-2 py-3 text-center">Sin marketplace</span>
                  <span className="border border-[#E5E5E5] px-2 py-3 text-center">Primer mes 0€</span>
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 py-12 sm:px-8">
            <PricingCards />
          </section>

          <section className="border-t border-[#E5E5E5] px-5 py-12 text-center sm:px-8">
            <h2 className="mx-auto max-w-2xl font-['Oswald'] text-[32px] font-bold uppercase leading-tight text-[#111111]">
              Si solo quieres una agenda clara, empieza por Basic.
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
              Pro existe para locales con más sillas y más ayuda de configuración. Si trabajas solo o con un equipo pequeño, el recomendado sigue siendo Basic anual.
            </p>
          </section>
        </main>

        <ColorStripe />
        <footer className="px-6 py-8 text-center">
          <Logo size="md" />
        </footer>
      </div>
    </div>
  )
}
