import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'

type Entry = { slug: string; title: string; description: string; canonicalPath: string }
const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)

export function createReviewCatalog(directory: string) {
  const root = resolve(directory)
  function list() {
    const manifest = join(root, 'index.json')
    if (!existsSync(manifest)) return []
    if (realpathSync(manifest) !== manifest) throw new Error('Invalid review manifest path')
    const data: unknown = JSON.parse(readFileSync(manifest, 'utf8'))
    if (!Array.isArray(data) || data.length !== 5) throw new Error('Invalid review count')
    const seen = new Set<string>()
    return data.map((value: unknown) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid review entry')
      const record = value as Record<string, unknown>
      if (Object.keys(record).sort().join(',') !== 'canonicalPath,description,slug,title' ||
          Object.values(record).some(v => typeof v !== 'string' || !v.trim())) throw new Error('Invalid review fields')
      const entry = value as Entry
      if (!validSlug(entry.slug) || seen.has(entry.slug) || entry.canonicalPath !== `/recursos/${entry.slug}`) throw new Error('Invalid review identity')
      seen.add(entry.slug)
      const path = join(root, `${entry.slug}.md`)
      if (!existsSync(path) || realpathSync(path) !== path) throw new Error('Invalid review file path')
      const markdown = readFileSync(path, 'utf8')
      const match = /^# ([^\n]+)\n\n([\s\S]+)$/.exec(markdown)
      if (!match || match[1] !== entry.title || !match[2].trim() || /^# /m.test(match[2])) throw new Error('Invalid review Markdown')
      return { ...entry, body: match[2], editorialStatus: 'pending_review' as const, publishedAt: null }
    })
  }
  return { list, get: (slug: string) => validSlug(slug) ? list().find(e => e.slug === slug) : undefined }
}

export const reviewCatalog = createReviewCatalog(join(process.cwd(), 'content/reviews/2026-w47'))
