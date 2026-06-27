'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DAYS = [
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miércoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sábado' },
  { key: 0, label: 'Domingo' },
]

interface DaySchedule {
  dayOfWeek: number
  enabled: boolean
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(({ key }) => ({
  dayOfWeek: key,
  enabled: key >= 1 && key <= 6,
  startTime: '09:00',
  endTime: '19:00',
  breakStart: '',
  breakEnd: '',
}))

export default function HorarioPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const barberId = params.id as string

  const [barberName, setBarberName] = useState('')
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const { data: barber } = await supabase
        .from('barbers')
        .select('display_name')
        .eq('id', barberId)
        .maybeSingle()
      if (barber) setBarberName(barber.display_name)

      const { data: existing } = await supabase
        .from('schedules')
        .select('*')
        .eq('barber_id', barberId)

      if (existing && existing.length > 0) {
        setSchedule(DAYS.map(({ key }) => {
          const found = existing.find((s: { day_of_week: number }) => s.day_of_week === key)
          return {
            dayOfWeek: key,
            enabled: !!found,
            startTime: found?.start_time?.slice(0, 5) ?? '09:00',
            endTime: found?.end_time?.slice(0, 5) ?? '19:00',
            breakStart: found?.break_start?.slice(0, 5) ?? '',
            breakEnd: found?.break_end?.slice(0, 5) ?? '',
          }
        }))
      }
      setLoading(false)
    }
    init()
  }, [barberId]) // eslint-disable-line react-hooks/exhaustive-deps

  function update(dayOfWeek: number, patch: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
  }

  async function save() {
    setError('')
    setSaving(true)
    try {
      const payload = schedule
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakStart: d.breakStart || undefined,
          breakEnd: d.breakEnd || undefined,
        }))

      const res = await fetch(`/api/barbers/${barberId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('No hemos podido guardar el horario. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 py-5 gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#111111] min-h-[44px] min-w-[44px]"
          aria-label="Volver"
        >
          <svg className="w-4 h-4 text-[#111111]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase">
          Horario — {barberName}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {schedule.map((day) => {
          const dayLabel = DAYS.find((d) => d.key === day.dayOfWeek)?.label ?? ''
          return (
            <div key={day.dayOfWeek} className={`border rounded-sm overflow-hidden ${day.enabled ? 'border-[#111111]' : 'border-[#E5E5E5]'}`}>
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className={`font-['Oswald'] font-semibold text-[14px] tracking-[0.04em] uppercase ${day.enabled ? 'text-[#111111]' : 'text-[#999999]'}`}>
                  {dayLabel}
                </span>
                <button
                  onClick={() => update(day.dayOfWeek, { enabled: !day.enabled })}
                  className={`relative w-11 h-6 rounded-sm transition-colors duration-200 ${day.enabled ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-sm shadow transition-transform duration-200 ${day.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Time inputs (only when enabled) */}
              {day.enabled && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#E5E5E5]">
                  <div className="flex gap-3 pt-3">
                    <div className="flex-1">
                      <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Inicio</label>
                      <input type="time" value={day.startTime} onChange={(e) => update(day.dayOfWeek, { startTime: e.target.value })}
                        className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
                    </div>
                    <div className="flex-1">
                      <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Fin</label>
                      <input type="time" value={day.endTime} onChange={(e) => update(day.dayOfWeek, { endTime: e.target.value })}
                        className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Descanso inicio</label>
                      <input type="time" value={day.breakStart} onChange={(e) => update(day.dayOfWeek, { breakStart: e.target.value })}
                        className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
                    </div>
                    <div className="flex-1">
                      <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Descanso fin</label>
                      <input type="time" value={day.breakEnd} onChange={(e) => update(day.dayOfWeek, { breakEnd: e.target.value })}
                        className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className={`w-full font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm min-h-[44px] transition-colors disabled:opacity-40 ${saved ? 'bg-[#1A3A6B] text-white' : 'bg-[#C8102E] text-white hover:bg-[#A50D24] active:scale-[0.98]'}`}
      >
        {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar horario'}
      </button>
    </div>
  )
}
