import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Explicit allowlist: never turn an arbitrary route parameter into a file path.
type ResourceEntry = {
  slug: string
  description: string
  editorialStatus: 'approved' | 'pending_review'
  publishedAt: string | null
}

const resourceEntries: ResourceEntry[] = [
  {
    slug: 'montar-barberia-espana',
    description: 'Qué comprobar antes de alquilar un local, cómo ordenar las altas y los trámites de apertura y cómo preparar los servicios y las primeras reservas de tu barbería.',
    editorialStatus: 'approved',
    publishedAt: '2026-11-02',
  },
  {
    slug: 'organizar-agenda-barberia',
    description: 'Ordena servicios, duraciones y horarios para que las citas no se pierdan entre mensajes. Checklist y respuestas para una barbería pequeña.',
    editorialStatus: 'approved',
    publishedAt: '2026-11-02',
  },
  {
    slug: 'elegir-app-reservas-barberia',
    description: 'Compara coste total, condiciones de salida, recordatorios y exportación antes de elegir una app de reservas. Ficha para barberías de 1 a 3 sillas.',
    editorialStatus: 'approved',
    publishedAt: null,
  },
  {
    slug: 'reducir-no-shows-barberia',
    description: 'Mide las ausencias con una hoja de cuatro semanas y aplica nueve medidas. Incluye mensajes y una política de cancelación adaptable, sin prometer resultados.',
    editorialStatus: 'approved',
    publishedAt: null,
  },
  {
    slug: 'calcular-precios-barberia',
    description: 'Calcula costes, minutos atendidos, margen e IVA con un ejemplo completo y una tabla rellenable para revisar los precios de tu barbería.',
    editorialStatus: 'approved',
    publishedAt: null,
  },
  {
    slug: 'conseguir-clientes-barberia-barrio',
    description: 'Prioriza Google, reseñas sin incentivos, escaparate y alianzas locales con un plan de 90 días para tu barbería. Mide visitas y huecos reales.',
    editorialStatus: 'approved',
    publishedAt: null,
  },
] as const

export function getResource(slug: string) {
  const entry = resourceEntries.find((post) => post.slug === slug)
  if (!entry) return undefined
  const markdown = readFileSync(join(process.cwd(), 'content', 'resources', `${entry.slug}.md`), 'utf8')
  const match = /^# ([^\n]+)\n\n([\s\S]+)$/.exec(markdown)
  if (!match || /^# /m.test(match[2])) throw new Error(`Invalid resource Markdown: ${slug}`)
  return { ...entry, title: match[1], body: match[2] }
}

export type Resource = NonNullable<ReturnType<typeof getResource>>

export function listResources(): Resource[] {
  return resourceEntries.map((entry) => getResource(entry.slug)!)
}
