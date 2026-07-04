'use client'

import { useEffect, useMemo, useState } from 'react'

type ClientSummary = {
  id: string
  fullName: string
  email: string
  phone: string
  appointmentCount: number
  lastAppointmentAt: string | null
}

function normalized(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL'
}

function phoneHref(phone: string, type: 'call' | 'message') {
  const cleanPhone = phone.replace(/\s+/g, '')
  return type === 'call' ? `tel:${cleanPhone}` : `sms:${cleanPhone}`
}

function lastAppointmentLabel(value: string | null) {
  if (!value) return 'Sin citas recientes'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClients() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/dashboard/clients')
        if (!res.ok) throw new Error()
        const data: ClientSummary[] = await res.json()
        setClients(data)
      } catch {
        setError('No hemos podido cargar tus clientes. Inténtalo de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    const term = normalized(query.trim())
    if (!term) return clients

    return clients.filter((client) => {
      const haystack = normalized([
        client.fullName,
        client.email,
        client.phone,
        String(client.appointmentCount),
      ].join(' '))
      return haystack.includes(term)
    })
  }, [clients, query])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando clientes…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 py-5 gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-['Oswald'] font-semibold text-[11px] tracking-[0.1em] uppercase text-[#999999]">
          Clientes históricos
        </p>
        <h1 className="font-['Oswald'] font-bold text-[22px] text-[#111111] uppercase">
          Fichas de cliente
        </h1>
        <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
          Busca por nombre, correo, teléfono o número de citas.
        </p>
      </div>

      <div>
        <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
          Buscar cliente
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, email, teléfono…"
          className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px] bg-white"
        />
      </div>

      {error && (
        <p className="font-['DM_Sans'] text-[13px] text-[#C8102E] border border-[#C8102E] rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      {!error && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border border-[#E5E5E5] rounded-sm bg-white px-5 text-center">
          <p className="font-['Oswald'] font-semibold text-[18px] text-[#111111] uppercase">
            Aún no hay clientes
          </p>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
            Cuando entren reservas, aquí tendrás sus fichas listas para llamar o escribir.
          </p>
        </div>
      )}

      {!error && clients.length > 0 && filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 border border-[#E5E5E5] rounded-sm bg-white px-5 text-center">
          <p className="font-['Oswald'] font-semibold text-[16px] text-[#111111] uppercase">
            Sin resultados
          </p>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
            Prueba con otro nombre, correo o teléfono.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredClients.map((client) => {
          const hasPhone = Boolean(client.phone)
          return (
            <article key={client.id} className="border-2 border-[#111111] border-l-4 border-l-[#1A3A6B] rounded-sm bg-white px-4 py-4 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-[#E5E5E5] rounded-sm flex items-center justify-center shrink-0">
                  <span className="font-['Oswald'] font-bold text-[14px] text-[#555555]">
                    {initials(client.fullName)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-['Oswald'] font-semibold text-[18px] text-[#111111] uppercase truncate">
                    {client.fullName}
                  </h2>
                  <p className="font-['DM_Sans'] text-[12px] text-[#555555] truncate">
                    {client.email || 'Sin correo'}
                  </p>
                  <p className="font-['DM_Sans'] text-[12px] text-[#999999] truncate mt-0.5">
                    {client.phone || 'Sin teléfono'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#E5E5E5] rounded-sm px-3 py-2">
                  <p className="font-['Oswald'] font-semibold text-[10px] tracking-[0.1em] uppercase text-[#999999]">
                    Citas
                  </p>
                  <p className="font-['Oswald'] font-bold text-[20px] text-[#111111] leading-none mt-1">
                    {client.appointmentCount}
                  </p>
                </div>
                <div className="border border-[#E5E5E5] rounded-sm px-3 py-2">
                  <p className="font-['Oswald'] font-semibold text-[10px] tracking-[0.1em] uppercase text-[#999999]">
                    Última
                  </p>
                  <p className="font-['DM_Sans'] text-[12px] text-[#555555] mt-1 truncate">
                    {lastAppointmentLabel(client.lastAppointmentAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {hasPhone ? (
                  <>
                    <a
                      href={phoneHref(client.phone, 'call')}
                      className="flex-1 bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      Llamar
                    </a>
                    <a
                      href={phoneHref(client.phone, 'message')}
                      className="flex-1 bg-transparent text-[#1A3A6B] border-2 border-[#1A3A6B] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm hover:bg-[#EEF2FF] active:scale-[0.98] transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      Mensaje
                    </a>
                  </>
                ) : (
                  <p className="w-full font-['DM_Sans'] text-[13px] text-[#999999] border border-[#E5E5E5] rounded-sm px-4 py-3 min-h-[44px] flex items-center">
                    Añade teléfono para llamar o escribir desde la ficha.
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
