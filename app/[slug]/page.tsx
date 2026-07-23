import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCustomer, hasRequiredCustomer } from '@/lib/auth/customers'
import PublicNav from '@/components/nav/PublicNav'
import ColorStripe from '@/components/brand/ColorStripe'
import BookingButton from './BookingButton'

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, address')
    .eq('slug', slug)
    .maybeSingle()

  if (!shop) return { title: 'Barbería — trujas' }

  const { data: services } = await supabase
    .from('services')
    .select('name')
    .eq('shop_id', shop.id)
    .eq('is_active', true)

  return {
    title: `Reserva en ${shop.name}`,
    description: `${shop.address} · ${(services ?? []).map((s: { name: string }) => s.name).join(', ')}`,
  }
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const next = `/${slug}`
  if (!user) redirect(`/auth/client?next=${encodeURIComponent(next)}`)
  const customer = await getCustomer(user)
  if (!hasRequiredCustomer(customer)) {
    redirect(`/auth/client/profile?next=${encodeURIComponent(next)}`)
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, address, logo_url, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!shop) notFound()

  const { data: subscriptionActive } = await supabaseAdmin.rpc('shop_has_active_subscription', { target_shop_id: shop.id })
  const bookingEnabled = subscriptionActive === true

  const [{ data: services }, { data: barbers }, { data: schedules }] = await Promise.all([
    supabase.from('services').select('id, name, duration_min, price').eq('shop_id', shop.id).eq('is_active', true).order('name'),
    supabase.from('barbers').select('id, display_name, photo_url').eq('shop_id', shop.id).eq('is_active', true).order('display_name'),
    supabase.from('schedules').select('day_of_week, start_time, end_time').eq('shop_id', shop.id),
  ])

  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav slug={slug} />
      <ColorStripe />

      {/* Shop header */}
      <header className="px-5 py-8 max-w-lg mx-auto w-full">
        <div className="flex items-start gap-4">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logo_url}
              alt={shop.name}
              width={64}
              height={64}
              fetchPriority="high"
              className="w-16 h-16 rounded-sm object-contain border border-[#E5E5E5] flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-sm bg-[#111111] flex items-center justify-center flex-shrink-0">
              <span className="font-['Rye'] text-[22px] text-white">
                {shop.name[0]}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-['DM_Sans'] text-[12px] text-[#999999] uppercase tracking-[0.08em]">Reserva online</p>
            <h1 className="font-['Rye'] text-[30px] leading-tight text-[#111111] tracking-[0.03em] break-words">{shop.name}</h1>
            <p className="font-['DM_Sans'] text-[14px] text-[#555555] mt-1 break-words">{shop.address}</p>
          </div>
        </div>
        <div className="mt-6 border-2 border-[#111111] rounded-sm p-4">
          <p className="font-['Oswald'] text-[20px] font-bold uppercase leading-tight text-[#111111]">
            Elige servicio, barbero y hora en pocos pasos.
          </p>
          <p className="mt-2 font-['DM_Sans'] text-[14px] leading-relaxed text-[#555555]">
            La barbería recibe tu cita al momento. Tú solo tienes que elegir cuándo vienes.
          </p>
          <div className="mt-4">
            <BookingButton slug={slug} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 max-w-lg mx-auto w-full pb-28 flex flex-col gap-8">
        {/* Horario */}
        {schedules && schedules.length > 0 && (
          <section>
            <h2 className="font-['Oswald'] font-bold text-[18px] text-[#111111] uppercase tracking-[0.04em] mb-3">Horario</h2>
            <ul className="flex flex-col gap-1.5">
              {schedules
                .sort((a: { day_of_week: number }, b: { day_of_week: number }) => {
                  const order = [1, 2, 3, 4, 5, 6, 0]
                  return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week)
                })
                .map((s: { day_of_week: number; start_time: string; end_time: string }) => (
                  <li key={s.day_of_week} className="flex items-center justify-between">
                    <span className="font-['Oswald'] font-semibold text-[13px] tracking-[0.04em] uppercase text-[#555555]">
                      {DAY_NAMES[s.day_of_week]}
                    </span>
                    <span className="font-['DM_Sans'] text-[13px] text-[#111111]">
                      {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Servicios */}
        {services && services.length > 0 && (
          <section>
            <h2 className="font-['Oswald'] font-bold text-[18px] text-[#111111] uppercase tracking-[0.04em] mb-3">Servicios</h2>
            <ul className="flex flex-col gap-2">
              {services.map((s: { id: string; name: string; duration_min: number; price: number }) => (
                <li key={s.id} className="flex items-start justify-between gap-4 border border-[#E5E5E5] rounded-sm px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-['Oswald'] font-semibold text-[15px] leading-tight text-[#111111] break-words">{s.name}</p>
                    <p className="font-['DM_Sans'] text-[12px] text-[#999999]">{s.duration_min} min</p>
                  </div>
                  <span className="font-['Oswald'] font-bold text-[18px] text-[#111111] shrink-0">{s.price}€</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Barberos */}
        {barbers && barbers.length > 0 && (
          <section>
            <h2 className="font-['Oswald'] font-bold text-[18px] text-[#111111] uppercase tracking-[0.04em] mb-3">El equipo</h2>
            <div className="flex gap-3 flex-wrap">
              {barbers.map((b: { id: string; display_name: string; photo_url?: string }) => (
                <div key={b.id} className="flex flex-col items-center gap-2">
                  {b.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.photo_url}
                      alt={b.display_name}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-sm object-cover border border-[#E5E5E5]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-[#E5E5E5] flex items-center justify-center">
                      <span className="font-['Oswald'] font-bold text-[20px] text-[#555555]">{initials(b.display_name)}</span>
                    </div>
                  )}
                  <span className="max-w-20 text-center font-['DM_Sans'] text-[12px] leading-tight text-[#555555] break-words">{b.display_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] px-5 py-4 z-30">
        <div className="max-w-lg mx-auto">
          {bookingEnabled ? (
            <BookingButton slug={slug} />
          ) : (
            <div className="border-2 border-[#C8102E] bg-white px-4 py-3 text-center">
              <p className="font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C8102E]">
                Reservas pausadas
              </p>
              <p className="mt-1 font-['DM_Sans'] text-[12px] text-[#555555]">
                Esta barbería tiene que activar su suscripción para recibir citas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
