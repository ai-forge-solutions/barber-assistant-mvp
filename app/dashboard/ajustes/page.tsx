'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'

export default function AjustesPage() {
  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const [shop, setShop] = useState<{ id: string; name: string; slug: string; logo_url?: string } | null>(null)
  const [publicUrl, setPublicUrl] = useState('')
  const [qrSrc, setQrSrc] = useState('')
  const [copied, setCopied] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const shopRes = await fetch('/api/dashboard/shop')
      if (!shopRes.ok) { setLoading(false); return }
      const data = await shopRes.json()
      if (!data?.id) { setLoading(false); return }
      setUserId(data.owner_id ?? '')
      setShop(data)
      const url = `${appUrl}/${data.slug}`
      setPublicUrl(url)
      const qr = await QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#111111', light: '#FFFFFF' } })
      setQrSrc(qr)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQr() {
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = `turno-qr-${shop?.slug ?? 'barberia'}.png`
    a.click()
  }

  async function uploadLogo() {
    if (!logoFile || !userId || !shop) return
    setUploading(true)
    try {
      const { error: upErr } = await supabase.storage.from('logos').upload(`${userId}/logo.png`, logoFile, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl: logoUrl } } = supabase.storage.from('logos').getPublicUrl(`${userId}/logo.png`)
      await fetch(`/api/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: logoUrl }),
      })
      setShop({ ...shop, logo_url: logoUrl })
    } catch {
      // silent — non-blocking
    } finally {
      setUploading(false)
      setLogoFile(null)
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
    <div className="flex flex-col px-4 py-5 gap-6">
      <h1 className="font-['Oswald'] font-bold text-[22px] text-[#111111] uppercase">Ajustes</h1>

      {/* Public URL */}
      <section>
        <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#555555] mb-3">Link de reservas</p>
        <div className="border border-[#E5E5E5] rounded-sm px-4 py-3 flex items-center justify-between gap-3 bg-white">
          <p className="font-['DM_Sans'] text-[13px] text-[#111111] truncate flex-1">{publicUrl}</p>
          <button
            onClick={copyLink}
            className={`font-['Oswald'] font-semibold text-[11px] tracking-[0.08em] uppercase px-3 py-2 rounded-sm min-h-[44px] transition-colors flex-shrink-0 ${copied ? 'bg-[#1A3A6B] text-white' : 'bg-[#111111] text-white hover:bg-[#333]'}`}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </section>

      {/* QR Code */}
      <section>
        <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#555555] mb-3">Código QR</p>
        {qrSrc && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR de reservas" className="w-48 h-48 border border-[#E5E5E5] rounded-sm p-3" />
            <button
              onClick={downloadQr}
              className="bg-transparent text-[#111111] border-2 border-[#111111] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-5 py-2.5 rounded-sm hover:bg-[#F5F5F5] active:scale-[0.98] transition-colors min-h-[44px]"
            >
              Descargar PNG
            </button>
          </div>
        )}
      </section>

      {/* Logo */}
      <section>
        <p className="font-['Oswald'] font-semibold text-[12px] tracking-[0.08em] uppercase text-[#555555] mb-3">Logo de la barbería</p>
        {shop?.logo_url && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shop.logo_url} alt="Logo actual" className="h-16 w-16 object-contain border border-[#E5E5E5] rounded-sm p-1" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <label
            htmlFor="logo-ajustes"
            className="bg-transparent text-[#555555] border border-[#E5E5E5] font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-2.5 rounded-sm hover:border-[#111111] hover:text-[#111111] transition-colors min-h-[44px] flex items-center cursor-pointer"
          >
            {logoFile ? logoFile.name : 'Cambiar logo'}
          </label>
          <input id="logo-ajustes" type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          {logoFile && (
            <button
              onClick={uploadLogo}
              disabled={uploading}
              className="bg-[#C8102E] text-white font-['Oswald'] font-semibold text-[13px] tracking-[0.08em] uppercase px-4 py-2.5 rounded-sm hover:bg-[#A50D24] min-h-[44px] disabled:opacity-40"
            >
              {uploading ? 'Subiendo…' : 'Subir'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
