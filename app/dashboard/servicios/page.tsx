'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Service {
  id: string
  name: string
  duration_min: number
  price: number
  is_active: boolean
}

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

export default function ServiciosPage() {
  const supabase = createClient()

  const [shopId, setShopId] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', duration_min: 30, price: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const shopRes = await fetch('/api/dashboard/shop')
      if (!shopRes.ok) { setLoading(false); return }
      const shop = await shopRes.json()
      if (!shop?.id) { setLoading(false); return }
      setShopId(shop.id)
      const servicesRes = await fetch('/api/dashboard/services')
      const data = servicesRes.ok ? await servicesRes.json() : []
      setServices(data)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', duration_min: 30, price: 0 })
    setError('')
    setShowModal(true)
  }

  function openEdit(s: Service) {
    setEditingId(s.id)
    setForm({ name: s.name, duration_min: s.duration_min, price: s.price })
    setError('')
    setShowModal(true)
  }

  async function saveService() {
    if (!form.name.trim()) { setError('El servicio necesita un nombre.'); return }
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/shops/${shopId}/services`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...form }),
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch(`/api/shops/${shopId}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
      }
      // Refresh
      const res2 = await fetch('/api/dashboard/services')
      setServices(res2.ok ? await res2.json() : [])
      setShowModal(false)
    } catch {
      setError('No hemos podido guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteService(id: string) {
    const res = await fetch(`/api/shops/${shopId}/services`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 py-5 gap-4 relative">
      <div className="flex items-center justify-between">
        <h1 className="font-['Oswald'] font-bold text-[22px] text-[#111111] uppercase">Servicios</h1>
        <button
          onClick={openAdd}
          className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-2 rounded-sm hover:bg-[#A50D24] min-h-[44px]"
        >
          + Añadir
        </button>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="font-['Oswald'] font-semibold text-[18px] text-[#111111] uppercase">Aún no tienes servicios</p>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555]">Añade al menos uno para empezar a recibir reservas.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {services.map((s) => (
            <li key={s.id} className="flex items-center justify-between border border-[#E5E5E5] rounded-sm px-4 py-4 bg-white">
              <div>
                <p className="font-['Oswald'] font-semibold text-[16px] text-[#111111]">{s.name}</p>
                <p className="font-['DM_Sans'] text-[13px] text-[#999999] mt-0.5">{s.duration_min} min · {s.price}€</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(s)}
                  className="text-[#555555] hover:text-[#111111] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Editar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                  onClick={() => deleteService(s.id)}
                  className="text-[#999999] hover:text-[#C8102E] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border-t-4 border-t-[#111111] px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
            <div className="w-10 h-1 bg-[#E5E5E5] rounded-full mx-auto mb-5" />
            <h2 className="font-['Oswald'] font-bold text-[20px] text-[#111111] uppercase mb-4">
              {editingId ? 'Editar servicio' : 'Nuevo servicio'}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Corte + barba"
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px]"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Duración</label>
                  <select
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                    className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px]"
                  >
                    {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">Precio (€)</label>
                  <input
                    type="number" min="0" step="0.5"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="15"
                    className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none min-h-[44px]"
                  />
                </div>
              </div>
              {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}
              <button
                onClick={saveService}
                disabled={saving}
                className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors min-h-[44px] disabled:opacity-40"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
