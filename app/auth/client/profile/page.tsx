'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/brand/Logo'
import ColorStripe from '@/components/brand/ColorStripe'
import { createClient } from '@/lib/supabase/client'
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_DIAL_CODE } from '@/lib/auth/countries'
import { clientFullName, clientPhone, normalizePhone } from '@/lib/auth/client-profile'
import DataProtectionNotice from '@/components/legal/DataProtectionNotice'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/')) return '/cuenta/citas'
  return value
}

function findCountryByDialCode(dialCode?: string) {
  return COUNTRY_DIAL_CODES.find((country) => country.dialCode === dialCode) ?? DEFAULT_COUNTRY_DIAL_CODE
}

function CustomerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams])

  const [fullName, setFullName] = useState('')
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE.code)
  const [phone, setPhone] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedCountry = COUNTRY_DIAL_CODES.find((country) => country.code === countryCode) ?? DEFAULT_COUNTRY_DIAL_CODE

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/auth/client?next=${encodeURIComponent(next)}`)
        return
      }

      const customerRes = await fetch('/api/customer-profile')
      const customerData = customerRes.ok ? await customerRes.json() : { complete: false, customer: null }
      if (customerData.complete) {
        router.replace(next)
        return
      }

      const customer = customerData.customer
      const metadata = user.user_metadata ?? {}
      const dialCode = typeof customer?.phone_dial_code === 'string'
        ? customer.phone_dial_code
        : typeof metadata.phone_dial_code === 'string'
          ? metadata.phone_dial_code
          : undefined
      const country = findCountryByDialCode(dialCode)
      const customerFullName = typeof customer?.full_name === 'string' ? customer.full_name : ''
      const customerPhone = typeof customer?.phone === 'string' ? customer.phone : ''
      setFullName(customerFullName || clientFullName(user) || '')
      setCountryCode(country.code)
      setPhone((customerPhone || clientPhone(user)).replace(country.dialCode, ''))
      setLoading(false)
    }

    loadProfile()
  }, [next]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const cleanFullName = fullName.trim()
    const cleanPhone = normalizePhone(selectedCountry.dialCode, phone)

    if (!cleanFullName || !cleanPhone) {
      setError('Indica tu nombre completo y móvil para continuar.')
      return
    }

    if (!privacyAccepted) {
      setError('Acepta la información de protección de datos para continuar.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/customer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanFullName,
          phone: cleanPhone,
          phoneCountryCode: selectedCountry.code,
          phoneDialCode: selectedCountry.dialCode,
        }),
      })
      if (!res.ok) throw new Error()
      router.replace(next)
    } catch {
      setError('No hemos podido guardar tus datos. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ColorStripe />
      <main className="flex-1 flex flex-col justify-center px-5 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.1em] uppercase text-[#999999] mt-4">
            Último paso
          </p>
          <h1 className="font-['Oswald'] font-bold text-[30px] text-[#111111] uppercase mt-1">
            Tus datos de reserva
          </h1>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555] mt-2">
            Necesitamos tu nombre y móvil para que la barbería pueda gestionar la cita.
          </p>
        </div>

        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div>
            <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
              Nombre completo
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ej. Miguel García"
              className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px]"
            />
          </div>

          <div>
            <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
              Móvil
            </label>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px]"
              >
                {COUNTRY_DIAL_CODES.map((country) => (
                  <option key={country.code} value={country.code}>{country.dialCode} {country.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="600 000 000"
                className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px]"
              />
            </div>
          </div>

          <DataProtectionNotice
            required
            accepted={privacyAccepted}
            onAcceptedChange={setPrivacyAccepted}
          />

          {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}

          <button
            disabled={saving}
            className="w-full bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Continuar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function CustomerPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )}>
      <CustomerContent />
    </Suspense>
  )
}
