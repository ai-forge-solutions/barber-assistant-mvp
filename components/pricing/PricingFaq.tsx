const faqs = [
  {
    question: '¿Qué pasa cuando terminan los 30 días gratis?',
    answer: 'Si continúas, empieza el cobro de la modalidad que hayas elegido. En Basic son 29€/mes mes a mes o 15€/mes con permanencia de 12 meses. Si no quieres continuar, cancela dentro de los primeros 30 días, antes del primer cobro.',
  },
  {
    question: '¿Hay permanencia después de la prueba?',
    answer: 'Depende de la modalidad: mes a mes no tiene permanencia anual; la tarifa con permanencia supone un compromiso de 12 meses. Durante los 30 días de prueba puedes cancelar antes de pagar. Revisa las fechas y las condiciones de la modalidad elegida antes de confirmar la contratación.',
  },
  {
    question: '¿Cómo gestiono la cancelación?',
    answer: 'Entra en Facturación desde tu cuenta y pulsa «Gestionar suscripción» para abrir el portal de Stripe. Revisa la fecha de efecto y las condiciones antes de confirmar la baja. Cancelar la prueba antes del primer cobro no es lo mismo que cancelar una modalidad con permanencia una vez terminada la prueba.',
  },
  {
    question: '¿Por dónde se envían los recordatorios?',
    answer: 'Los recordatorios de citas se envían por email. Puedes seguir usando WhatsApp para hablar con tus clientes y compartir tu enlace de reservas, pero el plan no incluye recordatorios automáticos por WhatsApp.',
  },
]

export default function PricingFaq() {
  return (
    <section aria-labelledby="pricing-faq-heading" className="mx-auto max-w-3xl px-5 pb-12 sm:px-8">
      <h2 id="pricing-faq-heading" className="font-['Oswald'] text-[28px] font-bold uppercase text-[#111111]">Preguntas frecuentes</h2>
      <div className="mt-6 divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
        {faqs.map(({ question, answer }) => (
          <details key={question} className="group py-4">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-['Oswald'] text-[16px] font-semibold text-[#111111]">
              {question}<span aria-hidden="true" className="shrink-0 text-[#555555] group-open:rotate-45">+</span>
            </summary>
            <p className="pb-2 pt-3 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
