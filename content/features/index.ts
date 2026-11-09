import { readFileSync } from 'node:fs'
import path from 'node:path'

const title = 'Página de reservas online para tu barbería: un enlace y tus clientes eligen cita'
const markdown = readFileSync(path.join(process.cwd(), 'content/features/pagina-reservas.md'), 'utf8')
const heading = `# ${title}\n\n`
if (!markdown.startsWith(heading)) throw new Error('Feature Markdown must have its exact single title')

export const reservationFeature = {
  slug: 'pagina-reservas',
  title,
  description: 'Un enlace propio para reservar en tu barbería desde la web, con cuenta de cliente, sin comisión por cita y con avisos por email. Consulta los planes.',
  editorialStatus: 'approved' as const,
  publishedAt: null,
  author: 'Equipo editorial trujas',
  assistance: 'Contenido elaborado con asistencia de IA.',
  body: markdown.slice(heading.length),
}
