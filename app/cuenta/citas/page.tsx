'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, isFuture, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import StatusBadge, { AppointmentStatus } from '@/components/ui/StatusBadge'
import PublicNav from '@/components/nav/PublicNav'

interface Appointment {
  id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  service: { name: string; duration_min: number; price_eur: number }
  barber: { display_name: string }
  shop: { name: string; slug: string }
}

export default function MisCitasPage() {
  const router = useRouter()
  const supabase = createClient()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const res = await fetch(`/api/appointments?clientId=${user.id}`)
      if (res.ok) {
        const data: Appointment[] = await res.json()
        setAppointments(data.sort((a, b) => b.starts_at.localeCompare(a.starts_at)))
      }
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function cancelAppt(id: string) {
    setCancelling(id)
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: 'cancelled' } : a)
      )
    }
    setCancelling(null)
  }

  const now = new Date()
  const upcoming = appointments.filter(
    (a) => isFuture(new Date(a.starts_at)) && a.status !== 'cancelled' && a.status !== 'completed'
  )
  const past = appointments.filter(
    (a) => !isFuture(new Date(a.starts_at)) || a.status === 'cancelled' || a.status === 'completed'
  )

  function canCancel(a: Appointment) {
    return isFuture(addHours(now, 2) < new Date(a.starts_at) ? new Date(a.starts_at) : now) &&
      addHours(now, 2) < new Date(a.starts_at) &&
      (a.status === 'pending' || a.status === 'confirmed')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-8">
        <h1 className="font-['Oswald'] font-bold text-[24px] text-[#111111] uppercase">Mis citas</h1>

        {/* Próximas */}
        <section>
          <h2 className="font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase text-[#555555] mb-3">Próximas</h2>
          {upcoming.length === 0 ? (
            <p className="font-['DM_Sans'] text-[14px] text-[#999999]">No tienes citas próximas.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((a) => (
                <li key={a.id} className="border-2 border-[#111111] rounded-sm px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-['Oswald'] font-bold text-[18px] text-[#111111]">
                        {format(new Date(a.starts_at), "EEE d MMM · HH:mm", { locale: es })}
                      </p>
                      <p className="font-['DM_Sans'] text-[13px] text-[#555555] mt-0.5">
                        {a.service?.name} con {a.barber?.display_name} · {a.shop?.name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {canCancel(a) && (
                      <button
                        onClick={() => cancelAppt(a.id)}
                        disabled={cancelling === a.id}
                        className="bg-transparent text-[#C8102E] border-2 border-[#C8102E] font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase px-4 py-2 rounded-sm hover:bg-[#FFF0F2] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                      >
                        {cancelling === a.id ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    )}
                    {a.shop?.slug && (
                      <a
                        href={`/${a.shop.slug}/reservar`}
                        className="bg-transparent text-[#555555] border border-[#E5E5E5] font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase px-4 py-2 rounded-sm hover:border-[#111111] hover:text-[#111111] transition-colors min-h-[44px] flex items-center"
                      >
                        Repetir reserva
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pasadas */}
        {past.length > 0 && (
          <section>
            <h2 className="font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase text-[#555555] mb-3">Historial</h2>
            <ul className="flex flex-col gap-2">
              {past.map((a) => (
                <li key={a.id} className="flex items-center justify-between border border-[#E5E5E5] rounded-sm px-4 py-3">
                  <div>
                    <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
                      {format(new Date(a.starts_at), "d MMM yyyy · HH:mm", { locale: es })}
                    </p>
                    <p className="font-['DM_Sans'] text-[12px] text-[#999999]">
                      {a.service?.name} · {a.shop?.name}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
