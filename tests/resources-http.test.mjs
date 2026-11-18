import assert from 'node:assert/strict'
import test from 'node:test'
import { listResources } from '../lib/resources.ts'

const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3214'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Resource HTTP tests must target a local server')
const routes = listResources().map(post => [`/recursos/${post.slug}`, post.title, post.editorialStatus, post.publishedAt])
const get = path => fetch(new URL(path, base), { redirect: 'manual' })
const visibleHtml = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')

test('editorial index links all publication-ready resources without review warnings', async () => {
  const response = await get('/recursos')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('location'), null)
  const html = await response.text()
  assert.match(html, /rel="canonical" href="https:\/\/trujas\.app\/recursos"/)
  assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/)
  for (const [path] of routes) assert.ok(visibleHtml(html).includes(`href="${path}"`))
  assert.doesNotMatch(visibleHtml(html), /Pendiente de revisión editorial|vista previa/i)
})

for (const [path, title, status, publishedAt] of routes) {
  test(`article initial HTML and editorial state: ${path}`, async () => {
    const response = await get(path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
    assert.equal(response.headers.get('set-cookie'), null)
    const visible = visibleHtml(await response.text())
    assert.equal((visible.match(/<h1(?:\s|>)/g) ?? []).length, 1)
    assert.ok(visible.includes(title))
    assert.ok(visible.includes(`rel="canonical" href="https://trujas.app${path}"`))
    assert.ok(visible.includes(`property="og:url" content="https://trujas.app${path}"`))
    assert.match(visible, /href="\/pricing"/)
    assert.match(visible, /href="\/recursos"/)
    assert.doesNotMatch(visible, /Notas de revisión|project: trujas/)
    if (status === 'pending_review') {
      assert.match(visible, /Pendiente de revisión editorial/)
      assert.match(visible, /<meta name="robots" content="[^"]*noindex/)
      assert.doesNotMatch(visible, /Publicado el|<time/)
    } else {
      assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex/i)
      assert.doesNotMatch(visible, /<meta name="robots" content="[^"]*noindex|Pendiente de revisión editorial/)
      if (publishedAt) {
        assert.match(visible, /<table(?:\s|>)/)
        assert.match(visible, /Publicado el/)
      } else {
        assert.doesNotMatch(visible, /Publicado el|<time/)
      }
    }
    if (path === '/recursos/montar-barberia-espana') {
      assert.match(visible, /Fuentes y alcance de la revisión/)
      assert.match(visible, /https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-2012-15595/)
      assert.match(visible, /No hay una licencia única para toda España/)
      assert.match(visible, /cada jornada tenga una organización que puedas cumplir/)
    } else if (path === '/recursos/organizar-agenda-barberia') {
      assert.match(visible, /Checklist antes de compartir tu enlace/)
      assert.match(visible, /una cita de prueba controlada por ti/)
      assert.match(visible, /recordatorios operativos por email/)
    }
  })
}

for (const path of ['/funciones', '/funciones/pagina-reservas']) {
  test(`feature is publication-ready and linked from the sitemap: ${path}`, async () => {
    const response = await get(path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('location'), null)
    assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex/i)
    const visible = visibleHtml(await response.text())
    assert.equal((visible.match(/<h1(?:\s|>)/g) ?? []).length, 1)
    assert.ok(visible.includes(`rel="canonical" href="https://trujas.app${path}"`))
    assert.match(visible, /<meta name="robots" content="index, follow"/)
    assert.doesNotMatch(visible, /Pendiente de revisión|vista previa|Publicado el/i)
    assert.match(visible, /href="\/pricing"/)
    assert.match(await (await get('/sitemap.xml')).text(), new RegExp(`<loc>https://trujas\\.app${path}</loc>`))
  })
}

test('unknown resources and features are real 404s, not login or soft-200', async () => {
  for (const path of ['/recursos/no-existe', '/recursos/montar-barberia-espana-extra', '/recursos/montar-barberia-espana/otro', '/recursos/otro/mas', '/funciones/no-existe', '/funciones/pagina-reservas/otro']) {
    const response = await get(path)
    assert.equal(response.status, 404, path)
    assert.equal(response.headers.get('location'), null)
  }
})
