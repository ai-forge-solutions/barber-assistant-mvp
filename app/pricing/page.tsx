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
          <section className="px-5 py-12 sm:px-8">
            <PricingCards />
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
