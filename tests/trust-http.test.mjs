import assert from 'node:assert/strict'
import test from 'node:test'

const base = process.env.SEO_TEST_BASE_URL ?? 'http://127.0.0.1:3214'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Use a local server')
const get = (path) => fetch(new URL(path, base), { redirect: 'manual' })

test('llms.txt is served as plain text with honest prices and no auth redirect', async () => {
  const response = await get('/llms.txt')
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^text\/plain/)
  assert.equal(response.headers.get('set-cookie'), null)
  const body = await response.text()
  assert.match(body, /https:\/\/trujas\.app\/pricing/)
  assert.match(body, /modalidades, precios y condiciones vigentes/)
  assert.doesNotMatch(body, /gratis para siempre|sin permanencia.*15€/i)
  assert.match(body, /sobre-nosotros/)
})

test('About and the public home serve linked organization metadata in initial HTML', async () => {
  for (const path of ['/', '/sobre-nosotros']) {
    const response = await get(path)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /https:\/\/trujas.app\/#organization/)
    assert.match(html, /href="\/sobre-nosotros"|Miguel Carmona/)
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    assert.ok(scripts.length > 0)
    for (const [, json] of scripts) JSON.parse(json)
  }
})

test('pricing initial HTML includes the back arrow and the email reminder FAQ', async () => {
  const response = await get('/pricing')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /aria-label="Volver atrás"/)
  assert.match(html, /<h2[^>]*>Preguntas frecuentes<\/h2>/)
  assert.match(html, /Los recordatorios de citas se envían por email/)
  assert.match(html, /no incluye recordatorios automáticos por WhatsApp/)
})
