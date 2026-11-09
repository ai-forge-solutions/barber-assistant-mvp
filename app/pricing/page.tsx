import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'
import { PricingCards } from '@/components/pricing/PricingBlocks'
import PricingBackButton from '@/components/pricing/PricingBackButton'
import PricingFaq from '@/components/pricing/PricingFaq'
import { marketingMetadata } from '@/lib/seo'

export const metadata = marketingMetadata(
  '/pricing',
  'Precios y planes para barberías — trujas',
  'Elige cómo quieres llevar tu agenda con trujas. Todos los planes empiezan con 30 días gratis y sin comisión por reserva.',
)

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="mx-auto max-w-[1040px] bg-white">
        <ColorStripe />
        <header className="grid grid-cols-[44px_1fr_44px] items-center border-b border-[#E5E5E5] px-5 py-5">
          <PricingBackButton />
          <Link href="/" aria-label="Volver a inicio" className="justify-self-center">
            <Logo size="md" />
          </Link>
        </header>

        <main>
          <section className="border-b border-[#E5E5E5] px-5 py-10 text-center sm:px-8 lg:px-12">
            <p className="mx-auto inline-block border border-[#C8102E] px-3 py-2 font-['Oswald'] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">
              Primer mes gratis en todos los planes
            </p>
            <h1 className="mx-auto mt-5 max-w-2xl font-['Oswald'] text-[34px] font-bold uppercase leading-tight text-[#111111] sm:text-[44px]">
              Elige cómo quieres llevar tu agenda
            </h1>
            <div className="mx-auto mt-6 max-w-2xl border-l-4 border-[#C8102E] bg-white px-5 py-4 text-left">
              <p className="font-['DM_Sans'] text-[16px] leading-relaxed text-[#555555]">
                Todos los planes empiezan con 30 días gratis. Configura tu barbería, pruébalo con tus citas reales y cancela dentro de esos primeros 30 días si no encaja contigo.
              </p>
            </div>
          </section>

          <section className="px-5 py-12 sm:px-8">
            <PricingCards />
          </section>
          <PricingFaq />
        </main>

        <ColorStripe />
        <footer className="px-6 py-8 text-center">
          <Logo size="md" />
        </footer>
      </div>
    </div>
  )
}
