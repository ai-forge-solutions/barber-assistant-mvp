'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Barber {
  id: string
  display_name: string
  notification_email: string
  is_active: boolean
}

export default function BarberosPage() {
  const supabase = createClient()

  const [shopId, setShopId] = useState('')
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', displayName: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const shopRes = await fetch('/api/dashboard/shop')
      if (!shopRes.ok) { setLoading(false); return }
      const shop = await shopRes.json()
      if (!shop?.id) { setLoading(false); return }
      setShopId(shop.id)
      const barbersRes = await fetch('/api/dashboard/barbers')
      const data = barbersRes.ok ? await barbersRes.json() : []
      setBarbers(data)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function addBarber() {
    if (!form.email.trim() || !form.displayName.trim()) { setError('Rellena email y nombre.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/shops/${shopId}/barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, displayName: form.displayName }),
      })
      if (!res.ok) throw new Error()
      const res2 = await fetch('/api/dashboard/barbers')
      setBarbers(res2.ok ? await res2.json() : [])
      setShowModal(false)
      setForm({ email: '', displayName: '' })
    } catch {
      setError('No hemos podido añadir el barbero. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(b: Barber) {
    await fetch(`/api/dashboard/barbers/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    })
    setBarbers((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 py-5 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-['Oswald'] font-bold text-[22px] text-[#111111] uppercase">Barberos</h1>
        <button
          onClick={() => { setShowModal(true); setError('') }}
          className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-2 rounded-sm hover:bg-[#A50D24] min-h-[44px]"
        >
          + Añadir
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {barbers.map((b) => (
          <li key={b.id} className="flex items-center gap-4 border border-[#E5E5E5] rounded-sm px-4 py-4 bg-white">
            {/* Avatar */}
            <div className="w-10 h-10 bg-[#E5E5E5] rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="font-['Oswald'] font-bold text-[14px] text-[#555555]">{initials(b.display_name)}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-['Oswald'] font-semibold text-[16px] ${b.is_active ? 'text-[#111111]' : 'text-[#999999]'}`}>{b.display_name}</p>
              <p className="font-['DM_Sans'] text-[12px] text-[#999999] truncate">{b.notification_email}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/barberos/${b.id}/horario`}
                className="font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#1A3A6B] border border-[#1A3A6B] px-3 py-2 rounded-sm hover:bg-[#EEF2FF] min-h-[44px] flex items-center"
              >
                Horario
              </Link>
              {/* Toggle */}
              <button
                onClick={() => toggleActive(b)}
                className={`relative w-11 h-6 rounded-sm transition-colors duration-200 ${b.is_active ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
                aria-label={b.is_active ? 'Desactivar' : 'Activar'}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-sm shadow transition-transform duration-200 ${b.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Add barber modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border-t-4 border-t-[#111111] px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mb-5" />
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">Añadir barbero</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Nombre</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Ej. Carlos"
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="carlos@ejemplo.com"
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px]"
                />
              </div>
              {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}
              <button
                onClick={addBarber}
                disabled={saving}
                className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
              >
                {saving ? 'Guardando…' : 'Añadir barbero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
