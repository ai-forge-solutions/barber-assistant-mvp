'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import ColorStripe from '@/components/brand/ColorStripe'

// ── Types ────────────────────────────────────────────────────────────────────

interface ShopData { name: string; slug: string; address: string; timezone: string }

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
interface ServiceRow { name: string; duration_min: number; price_eur: number }

const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Lisbon',
  'Atlantic/Canary',
]

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

// ── Helper components ────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-sm transition-all duration-200 ${i === current ? 'w-6 bg-[#C8102E]' : i < current ? 'w-2 bg-[#111111]' : 'w-2 bg-[#E5E5E5]'}`}
        />
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none transition-colors duration-150 bg-white min-h-[44px] ${props.className ?? ''}`}
    />
  )
}

function PrimaryBtn({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px]"
    >
      {children}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // State across steps
  const [shopId, setShopId] = useState('')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Step 1
  const [shopData, setShopData] = useState<ShopData>({ name: '', slug: '', address: '', timezone: 'Europe/Madrid' })

  // Step 2
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Step 3
  const [services, setServices] = useState<ServiceRow[]>([])
  const [serviceForm, setServiceForm] = useState<ServiceRow>({ name: '', duration_min: 30, price_eur: 0 })

  // Step 4
  const [barberName, setBarberName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step handlers ──────────────────────────────────────────────────────────

  async function handleStep1() {
    if (!shopData.name.trim() || !shopData.address.trim() || !shopData.slug.trim()) {
      setError('Rellena el nombre, el slug y la dirección.')
      return
    }
    if (!/^[a-z0-9-]+$/.test(shopData.slug)) {
      setError('El slug solo puede tener letras minúsculas, números y guiones.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: '' }))
        if (msg.error === 'slug is already taken') {
          setError('Ese enlace ya está en uso. Prueba otro.')
        } else {
          setError(`No hemos podido crear el local: ${msg.error ?? 'error desconocido'}`)
        }
        return
      }
      const data = await res.json()
      setShopId(data.id)
      setStep(1)
    } catch (e) {
      setError('No hemos podido crear el local. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2() {
    if (!logoFile) { setStep(2); return } // logo is optional
    setLoading(true)
    setError('')
    try {
      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(`${userId}/logo.png`, logoFile, { upsert: true })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(`${userId}/logo.png`)

      await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl }),
      })
    } catch {
      // logo upload failed silently — non-blocking
    } finally {
      setLoading(false)
      setStep(2)
    }
  }

  function addService() {
    if (!serviceForm.name.trim()) { setError('El servicio necesita un nombre.'); return }
    setError('')
    setServices((prev) => [...prev, serviceForm])
    setServiceForm({ name: '', duration_min: 30, price_eur: 0 })
  }

  async function handleStep3() {
    if (services.length === 0) { setError('Añade al menos un servicio.'); return }
    setError('')
    setLoading(true)
    try {
      for (const s of services) {
        const res = await fetch(`/api/shops/${shopId}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        })
        if (!res.ok) throw new Error()
      }
      setStep(3)
    } catch {
      setError('No hemos podido guardar los servicios. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep4() {
    if (!barberName.trim()) { setError('Escribe tu nombre.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/shops/${shopId}/barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, displayName: barberName }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ error: '' }))
        setError(msg.error === 'No account found with that email. The barber must sign up first.'
          ? 'No se ha encontrado una cuenta con ese email. Inicia sesión primero.'
          : 'No hemos podido guardar tus datos. Inténtalo de nuevo.')
        return
      }
      router.replace('/dashboard/agenda')
    } catch {
      setError('No hemos podido guardar tus datos. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ColorStripe />
      <header className="px-5 py-4 border-b border-[#E5E5E5]">
        <Logo size="md" />
      </header>

      <main className="flex-1 flex flex-col px-5 py-8 max-w-lg mx-auto w-full">
        <StepDots current={step} total={4} />

        {/* ── Step 0: Shop info ───────────────────────────────────────────── */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-['Oswald'] font-bold text-[24px] text-[#111111] uppercase">
              Cuéntanos tu local
            </h1>
            <div>
              <Label>Nombre de la barbería</Label>
              <Input
                placeholder="Ej. Barbería El Maestro"
                value={shopData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setShopData((prev) => ({
                    ...prev,
                    name,
                    // Auto-generate slug only if user hasn't manually edited it
                    slug: prev.slug === toSlug(prev.name) ? toSlug(name) : prev.slug,
                  }))
                }}
              />
            </div>
            <div>
              <Label>Enlace público</Label>
              <div className="flex items-center border border-[#E5E5E5] focus-within:border-[#111111] rounded-sm overflow-hidden transition-colors">
                <span className="px-3 py-3 font-['DM_Sans'] text-[13px] text-[#999999] bg-[#F5F5F5] border-r border-[#E5E5E5] whitespace-nowrap select-none">
                  turno.app/
                </span>
                <input
                  className="flex-1 px-3 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px]"
                  placeholder="mi-barberia"
                  value={shopData.slug}
                  onChange={(e) => setShopData({ ...shopData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />
              </div>
              <p className="font-['DM_Sans'] text-[11px] text-[#999999] mt-1">Solo letras minúsculas, números y guiones.</p>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                placeholder="Calle Mayor 12, Madrid"
                value={shopData.address}
                onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Zona horaria</Label>
              <select
                value={shopData.timezone}
                onChange={(e) => setShopData({ ...shopData, timezone: e.target.value })}
                className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px]"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            {error && <p className="font-['DM_Sans'] text-[14px] text-[#C8102E]">{error}</p>}
            <PrimaryBtn onClick={handleStep1} disabled={loading}>
              {loading ? 'Guardando…' : 'Siguiente'}
            </PrimaryBtn>
          </div>
        )}

        {/* ── Step 1: Logo ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-['Oswald'] font-bold text-[24px] text-[#111111] uppercase">
              Tu logo
            </h1>
            <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
              Opcional. Se mostrará en tu página pública de reservas.
            </p>
            <div
              className="border-2 border-dashed border-[#E5E5E5] rounded-sm flex flex-col items-center justify-center py-12 gap-3 cursor-pointer hover:border-[#111111] transition-colors"
              onClick={() => document.getElementById('logo-input')?.click()}
            >
              {logoFile ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Logo preview"
                    className="h-24 w-24 object-contain"
                  />
                  <p className="font-['DM_Sans'] text-[12px] text-[#999999]">{logoFile.name}</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#F5F5F5] rounded-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-4m0 0V8m0 4h4m-4 0H8m13 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="font-['DM_Sans'] text-[14px] text-[#555555]">Toca para subir una imagen</p>
                </>
              )}
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {error && <p className="font-['DM_Sans'] text-[14px] text-[#C8102E]">{error}</p>}
            <div className="flex gap-3">
              <PrimaryBtn onClick={handleStep2} disabled={loading}>
                {loading ? 'Subiendo…' : logoFile ? 'Subir y continuar' : 'Saltar'}
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── Step 2: Services ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-['Oswald'] font-bold text-[24px] text-[#111111] uppercase">
              Tus servicios
            </h1>

            {/* Added services */}
            {services.length > 0 && (
              <ul className="flex flex-col gap-2">
                {services.map((s, i) => (
                  <li key={i} className="flex items-center justify-between border border-[#E5E5E5] rounded-sm px-4 py-3">
                    <div>
                      <p className="font-['Oswald'] font-semibold text-[14px] text-[#111111]">{s.name}</p>
                      <p className="font-['DM_Sans'] text-[12px] text-[#999999]">{s.duration_min} min · {s.price_eur}€</p>
                    </div>
                    <button
                      onClick={() => setServices(services.filter((_, j) => j !== i))}
                      className="text-[#999999] hover:text-[#C8102E] p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* New service form */}
            <div className="border border-[#E5E5E5] rounded-sm p-4 flex flex-col gap-3">
              <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#555555]">Añadir servicio</p>
              <div>
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej. Corte + barba"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Duración</Label>
                  <select
                    value={serviceForm.duration_min}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_min: Number(e.target.value) })}
                    className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px]"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Label>Precio (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="15"
                    value={serviceForm.price_eur || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_eur: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                onClick={addService}
                className="bg-transparent text-[#111111] border border-[#E5E5E5] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-5 py-2.5 rounded-sm hover:border-[#111111] transition-colors duration-150 min-h-[44px]"
              >
                + Añadir
              </button>
            </div>

            {error && <p className="font-['DM_Sans'] text-[14px] text-[#C8102E]">{error}</p>}
            <PrimaryBtn onClick={handleStep3} disabled={loading || services.length === 0}>
              {loading ? 'Guardando…' : 'Siguiente'}
            </PrimaryBtn>
          </div>
        )}

        {/* ── Step 3: Barber name ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h1 className="font-['Oswald'] font-bold text-[24px] text-[#111111] uppercase">
              Tu nombre
            </h1>
            <p className="font-['DM_Sans'] text-[14px] text-[#555555]">
              ¿Cómo quieres que te vean tus clientes en la agenda?
            </p>
            <div>
              <Label>Nombre del barbero</Label>
              <Input
                placeholder="Ej. Miguel"
                value={barberName}
                onChange={(e) => setBarberName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={userEmail} disabled className="opacity-50" />
            </div>
            {error && <p className="font-['DM_Sans'] text-[14px] text-[#C8102E]">{error}</p>}
            <PrimaryBtn onClick={handleStep4} disabled={loading}>
              {loading ? 'Guardando…' : 'Ir a mi agenda'}
            </PrimaryBtn>
          </div>
        )}
      </main>
    </div>
  )
}
