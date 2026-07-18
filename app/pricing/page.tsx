import Link from 'next/link'
import ColorStripe from '@/components/brand/ColorStripe'
import Logo from '@/components/brand/Logo'
import { PricingCards } from '@/components/pricing/PricingBlocks'

const persuasionNotes = [
  {
    title: 'Ancla clara',
    text: 'El plan de 29€/mes queda como referencia. El anual de 15€/mes se percibe como la decisión lógica, no como el plan barato.',
  },
  {
    title: 'Coste fácil de entender',
    text: '“Menos que un corte al mes” traduce el precio a una unidad que el barbero conoce todos los días.',
  },
  {
    title: 'Sin sustos',
    text: 'Se pide tarjeta al empezar para activar la cuenta, pero se explica antes de pagar qué se cobra y cuándo.',
  },
]

const faqs = [
  {
    question: '¿Tengo que poner tarjeta?',
    answer: 'Sí. Para activar TURNO. pedimos tarjeta desde el primer paso, aunque la oferta o el periodo inicial hagan que hoy no se cobre nada.',
  },
  {
    question: '¿Google Pay se puede usar?',
    answer: 'Sí, si la cuenta de Stripe tiene Apple Pay/Google Pay y el dominio está verificado. En código no es difícil: Stripe Checkout lo muestra solo cuando el navegador y la tarjeta lo permiten. Lo que falta es terminar la configuración real de Stripe.',
  },
  {
    question: '¿Qué plan recomendáis?',
    answer: 'Barbería anual: 15€/mes con compromiso anual. Es el precio pensado para una barbería de barrio que quiere ordenar reservas sin pagar comisiones por cada cita.',
  },
  {
    question: '¿Puedo cancelar?',
    answer: 'Sí. Si cancelas, la suscripción queda activa hasta el final del periodo pagado y después la app debe dejar de dar acceso al panel de la barbería.',
  },
]

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
          <section className="px-6 py-12 text-center sm:px-10 sm:py-16">
            <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Precio para barberías de barrio</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-['Oswald'] text-[42px] font-bold uppercase leading-[0.95] text-[#111111] sm:text-[58px]">
              Elige agenda. No elijas otra conversación por WhatsApp.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-['DM_Sans'] text-[17px] leading-relaxed text-[#555555]">
              TURNO. se vende como una decisión sencilla: el plan recomendado cuesta 15€/mes con compromiso anual, menos que un corte, y evita horas perdidas cuadrando citas.
            </p>
            <p className="mx-auto mt-4 max-w-xl border border-[#E5E5E5] px-4 py-3 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
              Activación con tarjeta desde el inicio. Si Stripe aún no está configurado en producción, el checkout queda mockeado y te lleva al alta de barbero sin cobrar.
            </p>
          </section>

          <section className="px-5 pb-12 sm:px-8">
            <PricingCards />
          </section>

          <ColorStripe />

          <section className="grid gap-8 bg-[#E5E5E5] px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Estrategia de anclaje</p>
              <h2 className="mt-3 font-['Oswald'] text-[34px] font-bold uppercase leading-tight text-[#111111]">Por qué el plan de 15€ se siente obvio</h2>
            </div>
            <div className="grid gap-4">
              {persuasionNotes.map((note) => (
                <article key={note.title} className="border border-[#E5E5E5] bg-white px-5 py-5">
                  <h3 className="font-['Oswald'] text-[18px] font-semibold uppercase text-[#111111]">{note.title}</h3>
                  <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{note.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="px-6 py-12 sm:px-8">
            <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Dudas antes de poner la tarjeta</h2>
            <div className="mx-auto mt-8 max-w-3xl divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-['Oswald'] text-[16px] font-semibold text-[#111111]">
                    {faq.question}
                    <span className="text-[#999999] group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-2 pr-8 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{faq.answer}</p>
                </details>
              ))}
            </div>
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
