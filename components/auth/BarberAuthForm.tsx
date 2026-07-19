'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import Logo from '@/components/brand/Logo'
import ColorStripe from '@/components/brand/ColorStripe'
import { authCallbackUrl, rememberAuthNext, safeAuthNext } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'signup'

type BarberAuthFormProps = {
  mode: AuthMode
}

function safeNext(value: string | null) {
  return safeAuthNext(value, '/dashboard')
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder: string
  autoComplete: string
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
          autoComplete={autoComplete}
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

export default function BarberAuthForm({ mode }: BarberAuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isSignup = mode === 'signup'
  const next = useMemo(() => safeNext(searchParams.get('next')), [searchParams])
  const encodedNext = encodeURIComponent(next)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailLinkSent, setEmailLinkSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function callbackUrl() {
    return authCallbackUrl(window.location.origin)
  }

  async function continueWithGoogle() {
    setLoading(true)
    setError('')
    rememberAuthNext(next)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(),
      },
    })

    if (oauthError) {
      setError('No hemos podido continuar con Google. Inténtalo de nuevo.')
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

    if (!cleanEmail || !cleanPassword) {
      setError('Indica tu email y contraseña.')
      return
    }

    if (cleanPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (isSignup && cleanPassword !== cleanConfirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (isSignup && !cleanFullName) {
      setError('Indica tu nombre para crear la cuenta de barbero.')
      return
    }

    setLoading(true)
    rememberAuthNext(next)
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: callbackUrl(),
            data: {
              full_name: cleanFullName,
              role: 'barber',
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError('Ya existe una cuenta con este email. Entra desde la pantalla de login.')
          return
        }

        if (data.session) {
          router.replace(next)
          return
        }

        setEmailLinkSent(true)
        setNotice('Te hemos enviado un email de verificación. Ábrelo en este mismo navegador para terminar el registro y crear tu barbería.')
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })
      if (loginError) throw loginError
      router.replace(next)
    } catch {
      setError(isSignup
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
            Cuenta de barbero
          </p>
          <h1 className="font-['Oswald'] font-bold text-[30px] text-[#111111] uppercase mt-1">
            {isSignup ? 'Crea tu cuenta' : 'Entra a trujas'}
          </h1>
          <p className="font-['DM_Sans'] text-[14px] text-[#555555] mt-2">
            {isSignup
              ? 'Regístrate para crear tu barbería y empezar a gestionar reservas.'
              : 'Asumimos que ya tienes cuenta. Entra con email o Google para gestionar tu agenda.'}
          </p>
        </div>

        <form onSubmit={submitEmailAuth} className="flex flex-col gap-4">
          {isSignup && (
            <div>
              <label htmlFor="barber-full-name" className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
                Nombre del barbero
              </label>
              <input
                id="barber-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={emailLinkSent}
                placeholder="Ej. Miguel García"
                autoComplete="name"
                className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
              />
            </div>
          )}

          <div>
            <label htmlFor="barber-email" className="block font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase text-[#111111] mb-1.5">
              Email
            </label>
            <input
              id="barber-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={emailLinkSent}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full border border-[#E5E5E5] focus:border-[#111111] rounded-sm px-4 py-3 font-['DM_Sans'] text-[14px] text-[#111111] placeholder:text-[#999999] outline-none bg-white min-h-[44px] disabled:bg-[#F5F5F5]"
            />
          </div>

          <PasswordInput
            id="barber-password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            disabled={emailLinkSent}
            placeholder="Mínimo 6 caracteres"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {isSignup && (
            <PasswordInput
              id="barber-confirm-password"
              label="Repetir contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={emailLinkSent}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          )}

          {error && <p className="font-['DM_Sans'] text-[13px] text-[#C8102E]">{error}</p>}
          {notice && <p className="font-['DM_Sans'] text-[13px] text-[#1A3A6B]">{notice}</p>}

          <button
            type="submit"
            disabled={loading || emailLinkSent}
            className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#A50D24] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40"
          >
            {loading ? 'Procesando…' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[#E5E5E5]" />
          <span className="font-['Oswald'] font-semibold text-[11px] tracking-[0.1em] uppercase text-[#999999]">
            o
          </span>
          <div className="h-px flex-1 bg-[#E5E5E5]" />
        </div>

        <button
          onClick={continueWithGoogle}
          disabled={loading || emailLinkSent}
          className="w-full bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[14px] tracking-[0.08em] uppercase px-6 py-3 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors duration-150 min-h-[44px] disabled:opacity-40"
        >
          {isSignup ? 'Crear cuenta con Google' : 'Entrar con Google'}
        </button>

        <p className="font-['DM_Sans'] text-[13px] text-[#555555] text-center mt-6 leading-relaxed">
          {isSignup ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}{' '}
          <Link
            href={`${isSignup ? '/auth/barber' : '/auth/barber/signup'}?next=${encodedNext}`}
            className="font-['DM_Sans'] text-[13px] text-[#1A3A6B] underline underline-offset-2"
          >
            {isSignup ? 'Entrar' : 'Crear cuenta'}
          </Link>
        </p>

        {isSignup && (
          <p className="font-['DM_Sans'] text-[12px] text-[#999999] text-center mt-3 leading-relaxed">
            Al crear una cuenta recibirás un email de verificación antes de acceder al dashboard.
          </p>
        )}
      </main>
      <ColorStripe />
    </div>
  )
}
