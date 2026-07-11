'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

const DAYS = [
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miércoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sábado' },
  { key: 0, label: 'Domingo' },
]

type Tab = 'turnos' | 'vacaciones' | 'festivos'

interface DaySchedule {
  dayOfWeek: number
  enabled: boolean
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
}

interface BlockedSlot {
  id: string
  barber_id: string
  starts_at: string
  ends_at: string
  reason: string | null
}

interface Holiday {
  date: string
  name: string
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(({ key }) => ({
  dayOfWeek: key,
  enabled: key >= 1 && key <= 6,
  startTime: '09:00',
  endTime: '19:00',
  breakStart: '',
  breakEnd: '',
}))

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysKey(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function easterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function goodFridayKey(year: number) {
  const easter = easterSunday(year)
  easter.setUTCDate(easter.getUTCDate() - 2)
  return easter.toISOString().slice(0, 10)
}

function nationalHolidays(fromDate: string): Holiday[] {
  const fromYear = Number(fromDate.slice(0, 4))
  const fixed = (year: number): Holiday[] => [
    { date: `${year}-01-01`, name: 'Año Nuevo' },
    { date: `${year}-01-06`, name: 'Epifanía del Señor' },
    { date: goodFridayKey(year), name: 'Viernes Santo' },
    { date: `${year}-05-01`, name: 'Fiesta del Trabajo' },
    { date: `${year}-08-15`, name: 'Asunción de la Virgen' },
    { date: `${year}-10-12`, name: 'Fiesta Nacional de España' },
    { date: `${year}-11-01`, name: 'Todos los Santos' },
    { date: `${year}-12-06`, name: 'Día de la Constitución' },
    { date: `${year}-12-08`, name: 'Inmaculada Concepción' },
    { date: `${year}-12-25`, name: 'Navidad' },
  ]

  return [fixed(fromYear), fixed(fromYear + 1)]
    .flat()
    .filter((holiday) => holiday.date >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function isSameDate(iso: string, date: string) {
  return iso.slice(0, 10) === date
}

export default function HorarioPage() {
  const params = useParams()
  const router = useRouter()
  const barberId = params.id as string

  const [activeTab, setActiveTab] = useState<Tab>('turnos')
  const [barberName, setBarberName] = useState('')
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [vacationStart, setVacationStart] = useState(todayKey())
  const [vacationEnd, setVacationEnd] = useState(todayKey())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const holidays = nationalHolidays(todayKey())

  async function loadBlocks() {
    const until = `${Number(todayKey().slice(0, 4)) + 1}-12-31`
    const res = await fetch(`/api/blocked-slots?barberId=${barberId}&from=${todayKey()}&to=${until}`)
    if (res.ok) setBlockedSlots(await res.json())
  }

  useEffect(() => {
    async function init() {
      const barbersRes = await fetch('/api/dashboard/barbers')
      if (barbersRes.ok) {
        const barbers = await barbersRes.json()
        const barber = barbers.find((b: { id: string; display_name: string }) => b.id === barberId)
        if (barber) setBarberName(barber.display_name)
      }

      const schedRes = await fetch(`/api/barbers/${barberId}/schedule`)
      const existing = schedRes.ok ? await schedRes.json() : []

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

      await loadBlocks()
      setLoading(false)
    }
    init()
  }, [barberId]) // eslint-disable-line react-hooks/exhaustive-deps

  function update(dayOfWeek: number, patch: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
  }

  async function saveSchedule() {
    setError('')
    setSaving(true)
    try {
      const payload = schedule
        .filter((d) => d.enabled)
        .map((d) => ({
          day_of_week: d.dayOfWeek,
          start_time: d.startTime,
          end_time: d.endTime,
          break_start: d.breakStart || null,
          break_end: d.breakEnd || null,
        }))

      const res = await fetch(`/api/barbers/${barberId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: payload }),
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

  async function createBlock(startsAt: string, endsAt: string, reason: string) {
    const res = await fetch('/api/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId, startsAt, endsAt, reason }),
    })
    if (!res.ok) throw new Error()
  }

  async function deleteBlock(id: string) {
    const res = await fetch(`/api/blocked-slots/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
  }

  async function saveVacation() {
    if (vacationEnd < vacationStart) {
      setError('La fecha fin no puede ser anterior al inicio.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await createBlock(
        `${vacationStart}T00:00:00`,
        `${addDaysKey(vacationEnd, 1)}T00:00:00`,
        `Vacaciones: ${formatDate(vacationStart)} - ${formatDate(vacationEnd)}`
      )
      await loadBlocks()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('No hemos podido guardar las vacaciones. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleHoliday(holiday: Holiday, existing?: BlockedSlot) {
    setError('')
    setSaving(true)
    try {
      if (existing) {
        await deleteBlock(existing.id)
      } else {
        await createBlock(
          `${holiday.date}T00:00:00`,
          `${addDaysKey(holiday.date, 1)}T00:00:00`,
          `Festivo: ${holiday.name}`
        )
      }
      await loadBlocks()
    } catch {
      setError('No hemos podido actualizar el festivo. Inténtalo de nuevo.')
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

  const vacationBlocks = blockedSlots.filter((slot) => slot.reason?.startsWith('Vacaciones'))

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
        <div>
          <h1 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase">
            Horario — {barberName}
          </h1>
          <p className="font-['DM_Sans'] text-[13px] text-[#777777]">Configura turnos, vacaciones y festivos por barbero.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 border border-[#E5E5E5] rounded-sm overflow-hidden">
        {([
          ['turnos', 'Turnos'],
          ['vacaciones', 'Vacaciones'],
          ['festivos', 'Festivos'],
        ] as Array<[Tab, string]>).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase px-2 py-3 min-h-[44px] ${activeTab === key ? 'bg-[#111111] text-white' : 'bg-white text-[#555555]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'turnos' && (
        <>
          <div className="flex flex-col gap-3">
            {schedule.map((day) => {
              const dayLabel = DAYS.find((d) => d.key === day.dayOfWeek)?.label ?? ''
              return (
                <div key={day.dayOfWeek} className={`border rounded-sm overflow-hidden ${day.enabled ? 'border-[#111111]' : 'border-[#E5E5E5]'}`}>
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
          <button
            onClick={saveSchedule}
            disabled={saving}
            className={`w-full font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm min-h-[44px] transition-colors disabled:opacity-40 ${saved ? 'bg-[#1A3A6B] text-white' : 'bg-[#C8102E] text-white hover:bg-[#A50D24] active:scale-[0.98]'}`}
          >
            {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar horario'}
          </button>
        </>
      )}

      {activeTab === 'vacaciones' && (
        <div className="flex flex-col gap-4">
          <div className="border border-[#E5E5E5] rounded-sm p-4 flex flex-col gap-3">
            <h2 className="font-['Oswald'] font-bold text-[16px] uppercase text-[#111111]">Bloquear rango</h2>
            <p className="font-['DM_Sans'] text-[13px] text-[#777777]">El rango se bloquea completo para este barbero y no aparecerá en la reserva pública.</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Inicio</label>
                <input type="date" value={vacationStart} min={todayKey()} onChange={(e) => setVacationStart(e.target.value)} className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
              </div>
              <div className="flex-1">
                <label className="block font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#555555] mb-1">Fin</label>
                <input type="date" value={vacationEnd} min={vacationStart} onChange={(e) => setVacationEnd(e.target.value)} className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-2.5 font-['DM_Sans'] text-[14px] text-[#111111] outline-none min-h-[44px]" />
              </div>
            </div>
            <button onClick={saveVacation} disabled={saving} className="w-full bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40">
              {saving ? 'Guardando…' : 'Bloquear vacaciones'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-['Oswald'] font-bold text-[16px] uppercase text-[#111111]">Vacaciones bloqueadas</h2>
            {vacationBlocks.length === 0 ? (
              <p className="font-['DM_Sans'] text-[14px] text-[#777777] border border-dashed border-[#E5E5E5] rounded-sm p-4">Sin vacaciones futuras bloqueadas.</p>
            ) : vacationBlocks.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 border border-[#E5E5E5] rounded-sm p-4">
                <div>
                  <p className="font-['Oswald'] font-semibold text-[14px] uppercase text-[#111111]">{slot.reason}</p>
                  <p className="font-['DM_Sans'] text-[13px] text-[#777777]">{formatDate(slot.starts_at.slice(0, 10))} → {formatDate(addDaysKey(slot.ends_at.slice(0, 10), -1))}</p>
                </div>
                <button onClick={() => deleteBlock(slot.id).then(loadBlocks).catch(() => setError('No hemos podido eliminar el bloqueo.'))} className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#C8102E] min-h-[44px] px-2">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'festivos' && (
        <div className="flex flex-col gap-3">
          <p className="font-['DM_Sans'] text-[13px] text-[#777777]">Festivos nacionales ordenados desde hoy. Marca los que quieras bloquear para este barbero.</p>
          {holidays.map((holiday) => {
            const existing = blockedSlots.find((slot) => slot.reason === `Festivo: ${holiday.name}` && isSameDate(slot.starts_at, holiday.date))
            return (
              <div key={`${holiday.date}-${holiday.name}`} className={`flex items-center justify-between gap-3 border rounded-sm p-4 ${existing ? 'border-[#111111]' : 'border-[#E5E5E5]'}`}>
                <div>
                  <p className="font-['Oswald'] font-semibold text-[14px] uppercase text-[#111111]">{holiday.name}</p>
                  <p className="font-['DM_Sans'] text-[13px] text-[#777777]">{formatDate(holiday.date)}</p>
                </div>
                <button
                  onClick={() => toggleHoliday(holiday, existing)}
                  disabled={saving}
                  className={`relative w-11 h-6 rounded-sm transition-colors duration-200 disabled:opacity-40 ${existing ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
                  aria-label={existing ? `Desbloquear ${holiday.name}` : `Bloquear ${holiday.name}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-sm shadow transition-transform duration-200 ${existing ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}
    </div>
  )
}
