'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
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
  service: { name: string; duration_min: number; price_eur: number }
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
  const supabase = createClient()

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load appointments ─────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    if (!selectedBarberId) return
    setLoadingAppt(true)
    try {
      const res = await fetch(
        `/api/appointments?barberId=${selectedBarberId}&date=${dateKey(selectedDate)}`
      )
      if (!res.ok) throw new Error()
      const data: Appointment[] = await res.json()
      setAppointments(data.sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
    } catch {
      setAppointments([])
    } finally {
      setLoadingAppt(false)
    }
  }, [selectedBarberId, selectedDate])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

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
      await fetchAppointments()
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

  return (
    <div className="flex flex-col px-4 py-5 gap-4 relative">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
          className="w-11 h-11 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] transition-colors"
          aria-label="Día anterior"
        >
          <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="text-center">
          <p className="font-['Oswald'] font-bold text-[18px] text-[#111111] uppercase tracking-[0.04em]">
            {dayLabel}
          </p>
          <p className="font-['DM_Sans'] text-[13px] text-[#999999] capitalize">
            {dateLabel}
          </p>
        </div>

        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          className="w-11 h-11 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] transition-colors"
          aria-label="Día siguiente"
        >
          <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

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
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="font-['Oswald'] font-semibold text-[18px] text-[#111111] uppercase">Sin citas hoy</p>
          {shop && (
            <p className="font-['DM_Sans'] text-[14px] text-[#555555] text-center">
              Comparte tu{' '}
              <a href="/dashboard/ajustes" className="text-[#1A3A6B] underline">link de reservas</a>{' '}
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

      {/* FAB — block slot */}
      <button
        onClick={() => setShowBlockModal(true)}
        className="fixed bottom-[80px] right-4 w-14 h-14 bg-[#C8102E] text-white rounded-sm flex items-center justify-center shadow-lg hover:bg-[#A50D24] active:scale-95 transition-all z-30"
        aria-label="Bloquear hueco"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
      </button>

      {/* ── Appointment detail drawer ─────────────────────────────────────── */}
      {activeAppt && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveAppt(null)} />

          {/* Drawer */}
          <div className="relative bg-white rounded-t-none border-t-4 border-t-[#111111] px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
            {/* Handle */}
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mb-5" />

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
              {activeAppt.service?.name} · {activeAppt.service?.duration_min} min · {activeAppt.service?.price_eur}€
            </p>
            <p className="font-['DM_Sans'] text-[13px] text-[#999999] mb-6">
              {timeLabel(activeAppt.starts_at)} → {timeLabel(activeAppt.ends_at)}
            </p>

            {/* Action buttons by status */}
            {activeAppt.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => patchStatus(activeAppt.id, 'confirmed')}
                  disabled={statusLoading}
                  className="flex-1 bg-[#1A3A6B] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:bg-[#142d56] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'cancelled')}
                  disabled={statusLoading}
                  className="flex-1 bg-transparent text-[#C8102E] border-2 border-[#C8102E] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:bg-[#FFF0F2] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            )}
            {activeAppt.status === 'confirmed' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => patchStatus(activeAppt.id, 'completed')}
                  disabled={statusLoading}
                  className="flex-1 bg-[#1A3A6B] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:bg-[#142d56] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Completada
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'no_show')}
                  disabled={statusLoading}
                  className="flex-1 bg-transparent text-[#555555] border border-[#E5E5E5] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:border-[#111111] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  No-show
                </button>
                <button
                  onClick={() => patchStatus(activeAppt.id, 'cancelled')}
                  disabled={statusLoading}
                  className="flex-1 bg-transparent text-[#C8102E] border-2 border-[#C8102E] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-3 py-3 rounded-sm hover:bg-[#FFF0F2] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
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
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mb-5" />
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
              className="w-full bg-[#111111] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#333] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
            >
              {blockLoading ? 'Guardando…' : 'Bloquear hueco'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
