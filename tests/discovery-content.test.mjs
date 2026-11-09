import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const file = new URL('../public/llms.txt', import.meta.url)
test('llms.txt is public Markdown with only the approved factual discovery links', () => {
  assert.ok(existsSync(file), 'public/llms.txt must exist')
  const text = readFileSync(file, 'utf8')
  assert.match(text, /^# trujas\n\n> .+/)
  assert.match(text, /\n## /)
  assert.match(text, /barberías/)
  const links = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1])
  assert.deepEqual(links, [
    'https://trujas.app/', 'https://trujas.app/pricing', 'https://trujas.app/sobre-nosotros',
    'https://trujas.app/recursos', 'https://trujas.app/recursos/montar-barberia-espana',
    'https://trujas.app/recursos/organizar-agenda-barberia',
  ])
  assert.doesNotMatch(text, /supabase|stripe|analytics|GA4|api\/|dashboard|borrador|PR.?34|owner_id|service.role/i)
})
