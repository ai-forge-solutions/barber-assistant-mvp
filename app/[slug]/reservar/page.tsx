'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

interface Barber { id: string; display_name: string; photo_url?: string }
interface Service { id: string; name: string; duration_min: number; price: number }

interface BookingState {
  barberId: string
  barberName: string
  serviceId: string
  serviceName: string
  serviceDuration: number
  servicePrice: number
  date: string       // YYYY-MM-DD
  slot: string       // HH:MM
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

const EMPTY: BookingState = {
  barberId: '', barberName: '',
  serviceId: '', serviceName: '', serviceDuration: 0, servicePrice: 0,
  date: '', slot: '',
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const labels = ['Barbero', 'Servicio', 'Fecha', 'Hora', 'Confirmar']
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`flex flex-col items-center gap-0.5`}>
            <div className={`w-6 h-6 rounded-sm flex items-center justify-center font-['Oswald'] font-bold text-[11px] transition-colors ${i < step ? 'bg-[#1A3A6B] text-white' : i === step ? 'bg-[#111111] text-white' : 'bg-[#E5E5E5] text-[#999999]'}`}>
              {i < step ? '✓' : i + 1}
            </div>
          </div>
          {i < labels.length - 1 && <div className={`w-4 h-px ${i < step ? 'bg-[#1A3A6B]' : 'bg-[#E5E5E5]'}`} />}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ReservarPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()
  const storageKey = `turno_reserva_${slug}`

  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<BookingState>(EMPTY)
  const [shopId, setShopId] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')

  // Step data
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [calMonth, setCalMonth] = useState(new Date())

  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  // Success state
  const [confirmed, setConfirmed] = useState<{ startsAt: string; endsAt: string } | null>(null)

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin || 'http://localhost:3000').replace(/\/$/, '')
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${appUrl}/auth/callback?next=/${slug}/reservar` },
        })
        return
      }

      // Load shop
      const shopRes = await fetch(`/api/shops?slug=${encodeURIComponent(slug)}`)
      if (!shopRes.ok) { router.replace('/'); return }
      const shop = await shopRes.json()
      if (!shop?.id) { router.replace('/'); return }
      setShopId(shop.id)
      setShopName(shop.name)
      setShopAddress(shop.address ?? '')

      // Load barbers and services in parallel
      const [barbersRes, servicesRes] = await Promise.all([
        fetch(`/api/shops/${shop.id}/barbers`),
        fetch(`/api/shops/${shop.id}/services`),
      ])
      const b = barbersRes.ok ? await barbersRes.json() : []
      const s = servicesRes.ok ? await servicesRes.json() : []
      setBarbers(b ?? [])
      setServices(s ?? [])

      // Restore from sessionStorage
      try {
        const saved = sessionStorage.getItem(storageKey)
        if (saved) {
          const parsed: BookingState = JSON.parse(saved)
          setBooking(parsed)
          // Restore step based on what's filled
          if (parsed.barberId && parsed.serviceId && parsed.date && parsed.slot) setStep(4)
          else if (parsed.barberId && parsed.serviceId && parsed.date) setStep(3)
          else if (parsed.barberId && parsed.serviceId) setStep(2)
          else if (parsed.barberId) setStep(1)
        }
      } catch { /* ignore */ }

      setLoading(false)
    }
    init()
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function persist(patch: Partial<BookingState>) {
    const next = { ...booking, ...patch }
    setBooking(next)
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore */ }
  }

  // ── Slot loading ──────────────────────────────────────────────────────────

  async function loadSlots(barberId: string, serviceId: string, date: string) {
    setSlotsLoading(true)
    setSlotError('')
    try {
      const res = await fetch(`/api/availability?barberId=${barberId}&serviceId=${serviceId}&date=${date}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setSlots([])
      setSlotError('No hemos podido cargar los horarios. Inténtalo de nuevo.')
    } finally {
      setSlotsLoading(false)
    }
  }

  // ── Confirm ───────────────────────────────────────────────────────────────

  async function confirm() {
    setConfirming(true)
    setConfirmError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: booking.barberId,
          serviceId: booking.serviceId,
          clientId: user.id,
          startsAt: `${booking.date}T${booking.slot}:00`,
        }),
      })

      if (res.status === 409) {
        setStep(3)
        setSlotError('Este horario ya no está disponible. Elige otro.')
        persist({ slot: '' })
        await loadSlots(booking.barberId, booking.serviceId, booking.date)
        return
      }
      if (!res.ok) throw new Error()
      const appt = await res.json()
      setConfirmed({ startsAt: appt.starts_at, endsAt: appt.ends_at })
      sessionStorage.removeItem(storageKey)
    } catch {
      setConfirmError('No hemos podido confirmar la cita. Inténtalo de nuevo.')
    } finally {
      setConfirming(false)
    }
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────

  const calDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) })
  const firstDow = (startOfMonth(calMonth).getDay() + 6) % 7 // Mon=0

  // ── .ics download ─────────────────────────────────────────────────────────

  function downloadIcs() {
    if (!confirmed) return
    const fmt = (iso: string) => iso.replace(/[-:]/g, '').replace('.000', '').replace('Z', 'Z')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(confirmed.startsAt)}\nDTEND:${fmt(confirmed.endsAt)}\nSUMMARY:Cita en ${shopName}\nDESCRIPTION:${booking.serviceName} con ${booking.barberName}\nLOCATION:${shopAddress}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cita-turno.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 text-center">
        <div className="w-16 h-16 rounded-sm bg-[#1A3A6B] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="font-['Oswald'] font-bold text-[26px] text-[#111111] uppercase mb-2">¡Cita confirmada!</h1>
        <p className="font-['DM_Sans'] text-[15px] text-[#555555] mb-1">{booking.serviceName} con {booking.barberName}</p>
        <p className="font-['Oswald'] font-bold text-[20px] text-[#111111] mb-6">
          {format(new Date(`${booking.date}T${booking.slot}:00`), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={downloadIcs}
            className="bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] min-h-[44px]"
          >
            Añadir al calendario
          </button>
          <a
            href="/cuenta/citas"
            className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] min-h-[44px] flex items-center justify-center"
          >
            Ver mis citas
          </a>
        </div>
      </div>
    )
  }

  // ── Booking flow ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="w-10 h-10 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] min-w-[44px] min-h-[44px]"
          >
            <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <div>
          <p className="font-['Rye'] text-[16px] text-[#111111]">{shopName}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <StepIndicator step={step} />

        {/* ── Step 0: Choose barber ──────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">Elige tu barbero</h2>
            <div className="grid grid-cols-2 gap-3">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    persist({ barberId: b.id, barberName: b.display_name })
                    setStep(1)
                  }}
                  className={`flex flex-col items-center gap-3 border-2 rounded-sm px-4 py-5 transition-colors min-h-[120px] ${booking.barberId === b.id ? 'border-[#111111] bg-[#F5F5F5]' : 'border-[#E5E5E5] hover:border-[#111111]'}`}
                >
                  {b.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.photo_url} alt={b.display_name} className="w-14 h-14 rounded-sm object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-sm bg-[#E5E5E5] flex items-center justify-center">
                      <span className="font-['Oswald'] font-bold text-[20px] text-[#555555]">{initials(b.display_name)}</span>
                    </div>
                  )}
                  <span className="font-['Oswald'] font-semibold text-[14px] text-[#111111]">{b.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Choose service ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">Elige el servicio</h2>
            <div className="flex flex-col gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    persist({ serviceId: s.id, serviceName: s.name, serviceDuration: s.duration_min, servicePrice: s.price })
                    setStep(2)
                  }}
                  className={`flex items-center justify-between border-2 rounded-sm px-4 py-4 transition-colors min-h-[60px] ${booking.serviceId === s.id ? 'border-[#111111] bg-[#F5F5F5]' : 'border-[#E5E5E5] hover:border-[#111111]'}`}
                >
                  <div className="text-left">
                    <p className="font-['Oswald'] font-semibold text-[16px] text-[#111111]">{s.name}</p>
                    <p className="font-['DM_Sans'] text-[12px] text-[#999999]">{s.duration_min} min</p>
                  </div>
                  <span className="font-['Oswald'] font-bold text-[20px] text-[#111111]">{s.price}€</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Choose date ────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">Elige la fecha</h2>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth((m) => subMonths(m, 1))}
                disabled={isBefore(endOfMonth(subMonths(calMonth, 1)), new Date())}
                className="w-10 h-10 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] disabled:opacity-30 min-h-[44px] min-w-[44px]"
              >
                <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-['Oswald'] font-semibold text-[16px] text-[#111111] uppercase tracking-[0.04em] capitalize">
                {format(calMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                onClick={() => setCalMonth((m) => addMonths(m, 1))}
                className="w-10 h-10 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] min-h-[44px] min-w-[44px]"
              >
                <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <div key={d} className="text-center font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#999999] py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
              {calDays.map((day) => {
                const past = isBefore(day, new Date()) && !isToday(day)
                const selected = booking.date === dateKey(day)
                return (
                  <button
                    key={day.toISOString()}
                    disabled={past}
                    onClick={() => {
                      persist({ date: dateKey(day), slot: '' })
                      loadSlots(booking.barberId, booking.serviceId, dateKey(day))
                      setStep(3)
                    }}
                    className={`aspect-square flex items-center justify-center rounded-sm font-['DM_Sans'] text-[14px] transition-colors min-h-[40px] ${past ? 'text-[#E5E5E5] cursor-not-allowed' : selected ? 'bg-[#111111] text-white' : isToday(day) ? 'border-2 border-[#C8102E] text-[#C8102E] font-semibold hover:bg-[#FFF0F2]' : 'hover:bg-[#F5F5F5] text-[#111111]'}`}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Choose slot ────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-1">Elige la hora</h2>
            <p className="font-['DM_Sans'] text-[13px] text-[#999999] mb-4 capitalize">
              {booking.date ? format(new Date(`${booking.date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es }) : ''}
            </p>

            {slotError && (
              <div className="border border-[#F5C0C8] bg-[#FFF0F2] rounded-sm px-4 py-3 mb-4">
                <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{slotError}</p>
              </div>
            )}

            {slotsLoading ? (
              <p className="font-['DM_Sans'] text-[14px] text-[#999999] py-8 text-center">Cargando horarios…</p>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <p className="font-['Oswald'] font-semibold text-[16px] text-[#111111] uppercase">Sin huecos disponibles</p>
                <p className="font-['DM_Sans'] text-[13px] text-[#555555]">Prueba otro día.</p>
                <button onClick={() => setStep(2)} className="font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase text-[#1A3A6B] underline min-h-[44px]">Cambiar fecha</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      persist({ slot: s })
                      setStep(4)
                    }}
                    className={`py-3 rounded-sm font-['Oswald'] font-semibold text-[16px] transition-colors min-h-[44px] border-2 ${booking.slot === s ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Confirm ───────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-5">Confirmar cita</h2>

            <div className="border-2 border-[#111111] rounded-sm p-5 flex flex-col gap-3 mb-6">
              <Row label="Barbero" value={booking.barberName} />
              <Row label="Servicio" value={`${booking.serviceName} · ${booking.serviceDuration} min`} />
              <Row label="Precio" value={`${booking.servicePrice}€`} />
              <div className="h-px bg-[#E5E5E5]" />
              <Row
                label="Cuándo"
                value={
                  booking.date
                    ? format(new Date(`${booking.date}T${booking.slot}:00`), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
                    : ''
                }
              />
            </div>

            {confirmError && (
              <div className="border border-[#F5C0C8] bg-[#FFF0F2] rounded-sm px-4 py-3 mb-4">
                <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{confirmError}</p>
              </div>
            )}

            <button
              onClick={confirm}
              disabled={confirming}
              className="w-full bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[16px] tracking-[0.08em] uppercase px-6 py-4 rounded-sm hover:bg-[#A50D24] active:scale-[0.99] transition-colors min-h-[52px] disabled:opacity-40"
            >
              {confirming ? 'Confirmando…' : 'Confirmar cita'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#555555] flex-shrink-0">{label}</span>
      <span className="font-['DM_Sans'] text-[14px] text-[#111111] text-right capitalize">{value}</span>
    </div>
  )
}
