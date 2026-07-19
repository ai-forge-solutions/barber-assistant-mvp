'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import AppointmentCard, { AppointmentCardData } from '@/components/ui/AppointmentCard'
import StatusBadge, { AppointmentStatus } from '@/components/ui/StatusBadge'

// ── Types ────────────────────────────────────────────────────────────────────

interface Barber { id: string; display_name: string; is_active: boolean }
interface Shop { id: string; slug: string }
interface Appointment {
  id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  client_id: string
  service: { name: string; duration_min: number; price: number }
  profiles?: { full_name?: string; email?: string }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function timeLabel(iso: string) {
  return format(new Date(iso), 'HH:mm')
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAppt, setLoadingAppt] = useState(false)
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Block slot modal
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)
  const [blockError, setBlockError] = useState('')

  // ── Load shop + barbers ───────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const shopRes = await fetch('/api/dashboard/shop')
      if (!shopRes.ok) { setLoading(false); return }
      const shopData = await shopRes.json()
      if (!shopData?.id) { setLoading(false); return }
      setShop(shopData)

      const barbersRes = await fetch('/api/dashboard/barbers')
      const barberData: Barber[] = barbersRes.ok ? await barbersRes.json() : []

      if (barberData.length > 0) {
        const active = barberData.filter((b) => b.is_active)
        setBarbers(active)
        const mine = barberData.find((b: Barber & { user_id?: string }) => b.user_id === shopData.owner_id)
        setSelectedBarberId(mine?.id ?? active[0]?.id ?? barberData[0].id)
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── Load appointments ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBarberId) return

    let cancelled = false

    async function loadAppointments() {
      setLoadingAppt(true)
      try {
        const res = await fetch(
          `/api/appointments?barberId=${selectedBarberId}&date=${dateKey(selectedDate)}`
        )
        if (!res.ok) throw new Error()
        const data: Appointment[] = await res.json()
        if (!cancelled) {
          setAppointments(data.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
        }
      } catch {
        if (!cancelled) setAppointments([])
      } finally {
        if (!cancelled) setLoadingAppt(false)
      }
    }

    void loadAppointments()

    return () => {
      cancelled = true
    }
  }, [selectedBarberId, selectedDate])

  async function refreshAppointments() {
    if (!selectedBarberId) return
    const res = await fetch(
      `/api/appointments?barberId=${selectedBarberId}&date=${dateKey(selectedDate)}`
    )
    if (!res.ok) throw new Error()
    const data: Appointment[] = await res.json()
    setAppointments(data.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
  }

  // ── Patch status ──────────────────────────────────────────────────────────

  async function patchStatus(id: string, status: AppointmentStatus) {
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setActiveAppt(null)
      await refreshAppointments()
    } catch {
      // no-op — user stays in drawer
    } finally {
      setStatusLoading(false)
    }
  }

  // ── Block slot ────────────────────────────────────────────────────────────

  async function submitBlock() {
    if (!blockStart || !blockEnd || !selectedBarberId) {
      setBlockError('Indica la hora de inicio y fin.')
      return
    }
    setBlockError('')
    setBlockLoading(true)
    const dateStr = dateKey(selectedDate)
    try {
      const res = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarberId,
          startsAt: `${dateStr}T${blockStart}:00`,
          endsAt: `${dateStr}T${blockEnd}:00`,
          reason: blockReason || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setShowBlockModal(false)
      setBlockStart('')
      setBlockEnd('')
      setBlockReason('')
    } catch {
      setBlockError('No hemos podido bloquear el hueco. Inténtalo de nuevo.')
    } finally {
      setBlockLoading(false)
    }
  }

  // ── Card data adapter ─────────────────────────────────────────────────────

  function toCardData(a: Appointment): AppointmentCardData {
    return {
      id: a.id,
      status: a.status,
      time: timeLabel(a.starts_at),
      clientName: a.profiles?.full_name ?? a.profiles?.email ?? 'Cliente',
      service: a.service?.name ?? '—',
      duration: a.service?.duration_min ?? 0,
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  const dayLabel = format(selectedDate, 'EEEE', { locale: es })
  const dateLabel = format(selectedDate, 'd MMM', { locale: es })
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId)
  const pendingCount = appointments.filter((a) => a.status === 'pending').length
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length

  return (
    <div className="flex flex-col px-4 py-5 gap-4 relative">
      {/* Day command center */}
      <section className="border-2 border-[#111111] rounded-sm bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <button
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
            className="w-11 h-11 flex shrink-0 items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] transition-colors"
            aria-label="Día anterior"
          >
            <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="min-w-0 text-center">
            <p className="font-['DM_Sans'] text-[12px] text-[#999999] uppercase tracking-[0.08em]">
              Agenda de hoy
            </p>
            <h1 className="font-['Oswald'] font-bold text-[24px] leading-none text-[#111111] uppercase tracking-[0.04em]">
              {dayLabel}
            </h1>
            <p className="font-['DM_Sans'] text-[13px] text-[#555555] capitalize mt-1">
              {dateLabel}{selectedBarber ? ` · ${selectedBarber.display_name}` : ''}
            </p>
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="w-11 h-11 flex shrink-0 items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] transition-colors"
            aria-label="Día siguiente"
          >
            <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-3 border-t border-[#E5E5E5]">
          <div className="px-3 py-3 text-center">
            <p className="font-['Oswald'] font-bold text-[22px] text-[#111111] leading-none">{appointments.length}</p>
            <p className="font-['DM_Sans'] text-[11px] text-[#999999] mt-1">citas</p>
          </div>
          <div className="px-3 py-3 text-center border-x border-[#E5E5E5]">
            <p className="font-['Oswald'] font-bold text-[22px] text-[#C8102E] leading-none">{pendingCount}</p>
            <p className="font-['DM_Sans'] text-[11px] text-[#999999] mt-1">pendientes</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="font-['Oswald'] font-bold text-[22px] text-[#1A3A6B] leading-none">{confirmedCount}</p>
            <p className="font-['DM_Sans'] text-[11px] text-[#999999] mt-1">confirmadas</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E5E5E5] p-3">
          <button
            onClick={() => setShowBlockModal(true)}
            className="w-full min-h-[44px] rounded-sm bg-[#111111] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#1A3A6B] active:scale-[0.98]"
          >
            Bloquear hueco
          </button>
          {shop && (
            <Link
              href={`/${shop.slug}`}
              className="flex min-h-[44px] w-full items-center justify-center rounded-sm border border-[#E5E5E5] px-5 py-3 font-['Oswald'] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#555555] transition-colors hover:border-[#111111] hover:text-[#111111]"
            >
              Ver página pública
            </Link>
          )}
        </div>
      </section>

      {/* Barber selector (only if multiple) */}
      {barbers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {barbers.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBarberId(b.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-sm font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase min-h-[44px] transition-colors ${selectedBarberId === b.id ? 'bg-[#111111] text-white' : 'bg-white text-[#555555] border border-[#E5E5E5] hover:border-[#111111]'}`}
            >
              {b.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Appointments list */}
      {loadingAppt ? (
        <div className="flex items-center justify-center py-12">
          <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando citas…</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-[#E5E5E5] rounded-sm px-5 py-12 gap-4">
          <p className="font-['Oswald'] font-semibold text-[18px] text-[#111111] uppercase">Sin citas este día</p>
          {shop && (
            <p className="font-['DM_Sans'] text-[14px] text-[#555555] text-center">
              Comparte tu{' '}
              <Link href="/dashboard/ajustes" className="text-[#1A3A6B] underline">link de reservas</Link>{' '}
              y empieza a recibir citas.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={toCardData(a)}
              onClick={() => setActiveAppt(a)}
            />
          ))}
        </div>
      )}

      {/* ── Appointment detail drawer ─────────────────────────────────────── */}
      {activeAppt && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveAppt(null)} />

          {/* Drawer */}
          <div className="relative bg-white rounded-t-none border-t-4 border-t-[#111111] px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
            {/* Handle */}
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-none mx-auto mb-5" />

            {/* Status badge */}
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={activeAppt.status} />
              <button onClick={() => setActiveAppt(null)} className="text-[#999999] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Client info */}
            <p className="font-['Oswald'] font-bold text-[22px] text-[#111111] mb-1">
              {activeAppt.profiles?.full_name ?? activeAppt.profiles?.email ?? 'Cliente'}
            </p>
            <p className="font-['DM_Sans'] text-[14px] text-[#555555] mb-4">
              {activeAppt.service?.name} · {activeAppt.service?.duration_min} min · {activeAppt.service?.price}€
            </p>
            <p className="font-['DM_Sans'] text-[13px] text-[#999999] mb-6">
              {timeLabel(activeAppt.starts_at)} → {timeLabel(activeAppt.ends_at)}
            </p>

            {/* Action buttons by status */}
            {activeAppt.status === 'pending' && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => patchStatus(activeAppt.id, 'confirmed')}
                  disabled={statusLoading}
                  className="bg-[#1A3A6B] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:bg-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'cancelled')}
                  disabled={statusLoading}
                  className="bg-transparent text-[#C8102E] border-2 border-[#C8102E] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:border-[#111111] hover:text-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            )}
            {activeAppt.status === 'confirmed' && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => patchStatus(activeAppt.id, 'completed')}
                  disabled={statusLoading}
                  className="bg-[#1A3A6B] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:bg-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Completada
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'no_show')}
                  disabled={statusLoading}
                  className="bg-transparent text-[#555555] border border-[#E5E5E5] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:border-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  No-show
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'cancelled')}
                  disabled={statusLoading}
                  className="bg-transparent text-[#C8102E] border-2 border-[#C8102E] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:border-[#111111] hover:text-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Block slot modal ──────────────────────────────────────────────── */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBlockModal(false)} />
          <div className="relative bg-white border-t-4 border-t-[#111111] px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-none mx-auto mb-5" />
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">Bloquear hueco</h2>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Inicio</label>
                <input
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]"
                />
              </div>
              <div className="flex-1">
                <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Fin</label>
                <input
                  type="time"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Ej. Descanso"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px]"
              />
            </div>
            {blockError && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E] mb-3">{blockError}</p>}
            <button
              onClick={submitBlock}
              disabled={blockLoading}
              className="w-full bg-[#111111] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#1A3A6B] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
            >
              {blockLoading ? 'Guardando…' : 'Bloquear hueco'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
