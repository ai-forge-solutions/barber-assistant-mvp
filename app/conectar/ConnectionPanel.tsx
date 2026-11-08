'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const subscribeOrigin = () => () => {}
const browserEndpoint = () => `${window.location.origin}/mcp`
const serverEndpoint = () => '/mcp'

export default function ConnectionPanel() {
  const endpoint = useSyncExternalStore(subscribeOrigin, browserEndpoint, serverEndpoint)
  const [ready, setReady] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/mcp/status', { signal: abort.signal, cache: 'no-store' })
      .then(r => r.json()).then(status => setReady(status.ready === true))
      .catch(() => { if (!abort.signal.aborted) setReady(false) })
    return () => abort.abort()
  }, [])
  return <>
    <section className={`border border-[#E5E5E5] border-l-4 p-5 my-6 ${ready ? 'border-l-[#1A3A6B]' : 'border-l-[#C8102E]'}`} aria-live="polite">
      <h2 className="font-['Oswald'] text-xl uppercase">{ready === null ? 'Comprobando el piloto' : ready ? 'Esquema disponible' : 'Piloto pendiente de activación'}</h2>
      <p className="mt-2 text-[#555555]">{ready === null ? 'Consultando la configuración del servidor.' : ready ? 'Puedes iniciar la conexión. Es una prueba: la compatibilidad se valida por separado en cada asistente.' : 'Todavía no conectes tu asistente. Falta aplicar o verificar las migraciones en la base de datos de trujas. La web de reservas sigue disponible como antes.'}</p>
    </section>
    <label htmlFor="mcp-endpoint" className="font-['Oswald'] uppercase tracking-[0.08em] text-sm">Dirección del conector MCP</label>
    <input id="mcp-endpoint" readOnly value={endpoint} className="mt-2 w-full min-h-11 border border-[#E5E5E5] rounded-sm px-3 py-3 bg-white text-sm text-[#111111]" />
    <button disabled={!ready} onClick={async () => { try { await navigator.clipboard.writeText(endpoint); setCopied(true) } catch { setCopied(false) } }} className="mt-3 min-h-11 bg-[#C8102E] disabled:bg-[#555555] text-white rounded-sm px-6 py-3 font-['Oswald'] font-semibold uppercase tracking-[0.08em]">
      {copied ? 'Dirección copiada' : 'Copiar dirección'}
    </button>
    <p className="mt-3 text-sm text-[#555555]">El piloto utiliza un conector personalizado. No está publicado en los directorios de ChatGPT ni Claude; su disponibilidad depende de tu cuenta y permisos.</p>
  </>
}
