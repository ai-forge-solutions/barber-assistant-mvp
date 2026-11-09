import { RECOMMENDED_PLAN } from '@/lib/billing/pricing'

export default function TrustComparison() {
  const rows = [
    ['Precio de Basic', `${RECOMMENDED_PLAN.annualPrice}€/mes con permanencia de 12 meses o ${RECOMMENDED_PLAN.monthlyPrice}€/mes mes a mes. Primer mes gratis.`, 'Consulta la tarifa y la permanencia.'],
    ['Comisión por reserva', 'Sin comisión por reserva.', 'Comprueba si hay un coste por cada cita.'],
    ['Dónde reservan tus clientes', 'En una página para tu barbería, sin marketplace.', 'Revisa si tu negocio aparece junto a otros locales.'],
    ['Para quién está pensado', 'Barberías independientes.', 'Comprueba si encaja con tu equipo y tu forma de trabajar.'],
  ]

  return (
    <section className="bg-white px-5 py-12 sm:px-8">
      <h2 className="text-center font-['Oswald'] text-[32px] font-bold uppercase text-[#111111]">Hecho para barberos de barrio</h2>
      <p className="mx-auto mt-4 max-w-lg text-center font-['DM_Sans'] text-[15px] leading-relaxed text-[#555555]">
        Compara las condiciones antes de elegir. Cada herramienta tiene sus propias tarifas y funciones.
      </p>
      <div className="mt-8 overflow-x-auto border border-[#E5E5E5]">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-[#E5E5E5] font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]">
            <tr>
              <th scope="col" className="px-3 py-4">Qué comparar</th>
              <th scope="col" className="px-3 py-4">trujas</th>
              <th scope="col" className="px-3 py-4">Qué revisar en otras herramientas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, trujas, other]) => (
              <tr key={label} className="border-b border-[#E5E5E5] last:border-b-0">
                <th scope="row" className="px-3 py-4 align-top font-['DM_Sans'] text-[13px] font-medium text-[#111111]">{label}</th>
                <td className="px-3 py-4 align-top font-['DM_Sans'] text-[13px] text-[#111111]">{trujas}</td>
                <td className="px-3 py-4 align-top font-['DM_Sans'] text-[13px] text-[#555555]">{other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
