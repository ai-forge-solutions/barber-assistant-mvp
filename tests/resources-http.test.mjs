import assert from 'node:assert/strict'
import test from 'node:test'

const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3214'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
  throw new Error('Resource HTTP tests must target a local server')
}
const routes = [
  ['/recursos/montar-barberia-espana', 'Cómo montar una barbería en España en 2026: requisitos y primeros pasos'],
  ['/recursos/organizar-agenda-barberia', 'Cómo organizar la agenda de tu barbería sin vivir en WhatsApp'],
]
const get = (path) => fetch(new URL(path, base), { redirect: 'manual' })
const visibleHtml = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')

test('editorial index is a public, indexable directory of the two approved posts', async () => {
  const response = await get('/recursos')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('location'), null)
  const html = await response.text()
  assert.match(html, /rel="canonical" href="https:\/\/trujas\.app\/recursos"/)
  assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/)
  for (const [path] of routes) assert.ok(visibleHtml(html).includes(`href="${path}"`))
})

for (const [path, title] of routes) {
  test(`approved article is complete public initial HTML: ${path}`, async () => {
    const response = await get(path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    const html = await response.text()
    const visible = visibleHtml(html)
    assert.equal((visible.match(/<h1(?:\s|>)/g) ?? []).length, 1)
    assert.ok(visible.includes(title))
    assert.ok(visible.includes(`rel="canonical" href="https://trujas.app${path}"`))
    assert.ok(visible.includes(`property="og:url" content="https://trujas.app${path}"`))
    assert.match(visible, /href="\/pricing"/)
    assert.match(visible, /href="\/recursos"/)
    assert.doesNotMatch(visible, /Notas de revisión|Borrador pendiente|NO APROBADO|NO PUBLICADO|project: trujas/)
    assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex/i)
    assert.doesNotMatch(visible, /<meta name="robots" content="[^"]*noindex/)
    assert.match(visible, /<table(?:\s|>)/)
    if (path.includes('montar-barberia')) {
      assert.match(visible, /Fuentes y alcance de la revisión/)
      assert.match(visible, /https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-2012-15595/)
      assert.match(visible, /No hay una licencia única para toda España/)
      assert.match(visible, /cada jornada tenga una organización que puedas cumplir/)
    } else {
      assert.match(visible, /Checklist antes de compartir tu enlace/)
      assert.match(visible, /una cita de prueba controlada por ti/)
      assert.match(visible, /recordatorios operativos por email/)
    }
  })
}

test('unknown resources are real 404 responses, not login or soft-200 pages', async () => {
  for (const path of [
    '/recursos/no-existe', '/recursos/montar-barberia-espana-extra',
    '/recursos/montar-barberia-espana/otro', '/recursos/otro/mas',
  ]) {
    const response = await get(path)
    assert.equal(response.status, 404, path)
    assert.equal(response.headers.get('location'), null)
  }
})
