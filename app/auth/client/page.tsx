'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/brand/Logo'
import ColorStripe from '@/components/brand/ColorStripe'
import { createClient } from '@/lib/supabase/client'
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_DIAL_CODE } from '@/lib/auth/countries'
import { normalizePhone } from '@/lib/auth/client-profile'

type Mode = 'signup' | 'login'

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/')) return '/cuenta/citas'
  return value
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm pl-4 pr-20 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 font-['Oswald'] font-semibold text-[10px] tracking-[0.08em] uppercase text-[#1A3A6B] px-2 py-2 min-h-[36px] disabled:text-[#999999]"
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </div>
  )
}

function ClientAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams])

  const [mode, setMode] = useState<Mode>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE.code)
  const [phone, setPhone] = useState('')
  const [emailLinkSent, setEmailLinkSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedCountry = COUNTRY_DIAL_CODES.find((country) => country.code === countryCode) ?? DEFAULT_COUNTRY_DIAL_CODE

  function resetMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
    setNotice('')
    setEmailLinkSent(false)
    setPassword('')
    setConfirmPassword('')
  }

  function callbackUrl() {
    const appUrl = window.location.origin.replace(/\/$/, '')
    return `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`
  }

  async function continueWithGoogle() {
    setLoading(true)
    setError('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(),
      },
    })

    if (oauthError) {
      setError('No hemos podido iniciar sesión con Google. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  async function submitEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const cleanConfirmPassword = confirmPassword.trim()
    const cleanFullName = fullName.trim()
    const cleanPhone = normalizePhone(selectedCountry.dialCode, phone)

    if (!cleanEmail || !cleanPassword) {
      setError('Indica tu email y contraseña.')
      return
    }

    if (cleanPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (mode === 'signup' && cleanPassword !== cleanConfirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (mode === 'signup' && (!cleanFullName || !cleanPhone)) {
      setError('Indica tu nombre completo y móvil para crear la cuenta.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: callbackUrl(),
            data: {
              full_name: cleanFullName,
              phone: cleanPhone,
              phone_country_code: selectedCountry.code,
              phone_dial_code: selectedCountry.dialCode,
            },
          },
        })

        if (signUpError) throw signUpError
        if (data.session) {
          router.replace(next)
          return
        }

        setEmailLinkSent(true)
        setNotice('Te hemos enviado un email de confirmación. Ábrelo en este mismo navegador para terminar el registro y volver a la barbería.')
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })
      if (loginError) throw loginError
      router.replace(next)
    } catch {
      setError(mode === 'signup'
        ? 'No hemos podido crear la cuenta. Revisa los datos e inténtalo de nuevo.'
        : 'No hemos podido entrar. Revisa email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ColorStripe />
      <main className="flex-1 flex flex-col justify-center px-5 py-8 max-w-lg mx-auto w-full">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.1em] uppercase text-[#999999] mt-4">
            Cuenta de cliente
          </p>
          <h1 className="font-['Oswald'] font-bold text-[30px] text-[#111111] uppercase mt-1">
            Entra para reservar
          </h1>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555] mt-2">
            Primero crea cuenta o entra. Después verás la barbería y podrás reservar.
          </p>
        </div>

        <button
          onClick={continueWithGoogle}
          disabled={loading || emailLinkSent}
          className="w-full bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40"
        >
          {mode === 'signup' ? 'Crear cuenta con Google' : 'Entrar con Google'}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[#E5E5E5]" />
          <span className="font-['Oswald'] font-semibold text-[11px] tracking-[0.1em] uppercase text-[#999999]">
            o con email
          </span>
          <div className="h-px flex-1 bg-[#E5E5E5]" />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => resetMode('signup')}
            disabled={emailLinkSent}
            className={`font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm border min-h-[44px] disabled:opacity-40 ${mode === 'signup' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#555555] border-[#E5E5E5]'}`}
          >
            Sign up
          </button>
          <button
            onClick={() => resetMode('login')}
            disabled={emailLinkSent}
            className={`font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase px-4 py-3 rounded-sm border min-h-[44px] disabled:opacity-40 ${mode === 'login' ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#555555] border-[#E5E5E5]'}`}
          >
            Login
          </button>
        </div>

        <form onSubmit={submitEmailAuth} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="full-name" className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
                Nombre completo
              </label>
              <input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={emailLinkSent}
                placeholder="Ej. Miguel García"
                className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={emailLinkSent}
              placeholder="tu@email.com"
              className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
                Móvil
              </label>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <select
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  disabled={emailLinkSent}
                  className="border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-3 py-3 font-['DM_Sans'] text-[14px] text-[#111111] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
                >
                  {COUNTRY_DIAL_CODES.map((country) => (
                    <option key={country.code} value={country.code}>{country.dialCode} {country.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={emailLinkSent}
                  placeholder="600 000 000"
                  className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
                />
              </div>
            </div>
          )}

          <PasswordInput
            id="password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            disabled={emailLinkSent}
            placeholder="Mínimo 6 caracteres"
          />

          {mode === 'signup' && (
            <PasswordInput
              id="confirm-password"
              label="Repetir contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={emailLinkSent}
              placeholder="Repite la contraseña"
            />
          )}

          {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}
          {notice && <p className="font-['DM_Sans'] text-[13px] text-[#1A3A6B] border border-[#1A3A6B] rounded-sm px-4 py-3">{notice}</p>}

          <button
            disabled={loading || emailLinkSent}
            className="w-full bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40"
          >
            {loading ? 'Procesando…' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function ClientAuthPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="font-['DM_Sans'] text-[14px] text-[#999999]">Cargando…</span>
      </div>
    )}>
      <ClientAuthContent />
    </Suspense>
  )
}
