import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = new URL('../', import.meta.url)
const file = (path) => fileURLToPath(new URL(path, root))
async function componentUrl(path) {
  assert.ok(existsSync(file(path)), `Server component ${path} must exist`)
  const require = createRequire(new URL(path, root))
  let { outputText: source } = ts.transpileModule(readFileSync(file(path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  // CSS is tested through the reused shell contract; this harness renders markup, not layout.
  source = source.replace(/import\s+["'][^"']+\.css["'];?/g, '')
  for (const specifier of new Set([...source.matchAll(/from ["']([^"']+)["']/g)].map((match) => match[1]))) {
    let resolved
    if (specifier.startsWith('@/')) {
      const dependency = ['.ts', '.tsx'].map((ext) => `${specifier.slice(2)}${ext}`).find((p) => existsSync(file(p)))
      assert.ok(dependency, `Local module ${specifier} must exist`)
      resolved = await componentUrl(dependency)
    } else {
      resolved = specifier.startsWith('node:') ? specifier : pathToFileURL(require.resolve(specifier)).href
    }
    source = source.replaceAll(`from "${specifier}"`, `from ${JSON.stringify(resolved)}`).replaceAll(`from '${specifier}'`, `from ${JSON.stringify(resolved)}`)
  }
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
}
const component = async (path) => import(await componentUrl(path))

test('dedicated reservation server route renders complete pending-review content with its own metadata', async () => {
  const { default: Page, metadata } = await component('app/funciones/pagina-reservas/page.tsx')
  const { reservationFeature: feature } = await component('content/features/index.ts')
  const { default: Markdown } = await component('components/resources/ResourceMarkdown.tsx')
  const html = renderToStaticMarkup(createElement(Page))
  const raw = readFileSync(file('content/features/pagina-reservas.md'), 'utf8')
  assert.equal(feature.editorialStatus, 'pending_review')
  assert.equal(feature.publishedAt, null)
  assert.equal((html.match(/<h1>/g) || []).length, 1)
  assert.ok(html.includes(renderToStaticMarkup(createElement(Markdown, { body: feature.body }))))
  assert.ok(raw.startsWith(`# ${feature.title}\n\n`))
  assert.equal(feature.body, raw.slice(raw.indexOf('\n\n') + 2))
  assert.match(html, /Pendiente de revisión editorial/)
  assert.match(html, /Equipo editorial trujas/)
  assert.match(html, /asistencia de IA/)
  assert.doesNotMatch(html, /Publicado el|<time|<img|<script|application\/ld\+json/)
  assert.equal(metadata.alternates.canonical, 'https://trujas.app/funciones/pagina-reservas')
  assert.equal(metadata.title, 'Página de reservas online para tu barbería | trujas')
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical)
  assert.equal(metadata.twitter.description, metadata.description)
  const words = raw.match(/\S+/gu).length
  assert.ok(words >= 1000 && words <= 1250, `${words} words: complete concise commercial article required`)
  assert.match(raw, /requiere una cuenta/)
  assert.match(raw, /Barbero → Servicio → Fecha → Hora → Confirmar/)
  assert.match(raw, /23 y 25 horas/)
  assert.match(raw, /enlace de cancelación/)
  assert.doesNotMatch(raw, /sin crear cuenta|sin registro|cero no-shows|garantizamos|asistencia garantizada|Stripe|primer mes gratis|sin permanencia|exportación garantizada|\d+\s*€|\d+\s*%/i)
  for (const path of [...html.matchAll(/href="([^"#]+)"/g)].map((m) => m[1])) {
    assert.ok(['/', '/pricing', '/recursos', '/funciones', '/recursos/elegir-app-reservas-barberia', '/recursos/reducir-no-shows-barberia', '/recursos/calcular-precios-barberia', '/recursos/conseguir-clientes-barberia-barrio'].includes(path), `Unapproved link: ${path}`)
  }
})

test('feature hub and branded shell render without inventing planned feature routes', async () => {
  const { default: Hub, metadata } = await component('app/funciones/page.tsx')
  const html = renderToStaticMarkup(createElement(Hub))
  assert.equal((html.match(/<h1>/g) || []).length, 1)
  assert.match(html, /href="\/funciones\/pagina-reservas"/)
  assert.match(html, /Recordatorios por email/)
  assert.match(html, /Pendiente de revisión editorial/)
  assert.doesNotMatch(html, /href="\/funciones\/recordatorios"|<img|Publicado el/)
  assert.equal(metadata.alternates.canonical, 'https://trujas.app/funciones')
  assert.equal(metadata.title, 'Funciones para la agenda de tu barbería | trujas')
  const layoutSource = readFileSync(file('app/funciones/layout.tsx'), 'utf8')
  assert.match(layoutSource, /ResourcesLayout/)
  assert.match(layoutSource, /ColorStripe/)
  assert.doesNotMatch(layoutSource, /use client/)
  const { default: Layout } = await component('app/funciones/layout.tsx')
  const shell = renderToStaticMarkup(createElement(Layout, null, createElement(Hub)))
  assert.equal((shell.match(/<main/g) || []).length, 1)
  assert.equal((shell.match(/<h1>/g) || []).length, 1)
  assert.match(shell, /href="#resources-main"/)
  assert.match(shell, /bg-\[#C8102E\]/)
  assert.match(shell, /bg-\[#1A3A6B\]/)
  for (const path of ['app/funciones/page.tsx', 'app/funciones/pagina-reservas/page.tsx']) {
    assert.doesNotMatch(readFileSync(file(path), 'utf8'), /use client|dangerouslySetInnerHTML/)
  }
})

test('shared server Markdown rejects executable HTML and unsafe protocols', async () => {
  const { default: Markdown } = await component('components/resources/ResourceMarkdown.tsx')
  const html = renderToStaticMarkup(createElement(Markdown, {
    body: '## Recorrido\n\n<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[No](javascript:alert%281%29)',
  }))
  assert.match(html, /<h2>Recorrido<\/h2>/)
  assert.doesNotMatch(html, /<script|<img|onerror|javascript:/)
})
