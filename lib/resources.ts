import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Explicit allowlist: never turn an arbitrary route parameter into a file path.
const approvedResources = [
  {
    slug: 'montar-barberia-espana',
    description: 'Qué comprobar antes de alquilar un local, cómo ordenar las altas y los trámites de apertura y cómo preparar los servicios y las primeras reservas de tu barbería.',
    publishedAt: '2026-11-02',
  },
  {
    slug: 'organizar-agenda-barberia',
    description: 'Ordena servicios, duraciones y horarios para que las citas no se pierdan entre mensajes. Checklist y respuestas para una barbería pequeña.',
    publishedAt: '2026-11-02',
  },
] as const

export function getResource(slug: string) {
  const entry = approvedResources.find((post) => post.slug === slug)
  if (!entry) return undefined
  const markdown = readFileSync(join(process.cwd(), 'content', 'resources', `${entry.slug}.md`), 'utf8')
  const match = /^# ([^\n]+)\n\n([\s\S]+)$/.exec(markdown)
  if (!match || /^# /m.test(match[2])) throw new Error(`Invalid resource Markdown: ${slug}`)
  return { ...entry, title: match[1], body: match[2] }
}

export type Resource = NonNullable<ReturnType<typeof getResource>>

export function listResources(): Resource[] {
  return approvedResources.map((entry) => getResource(entry.slug)!)
}
