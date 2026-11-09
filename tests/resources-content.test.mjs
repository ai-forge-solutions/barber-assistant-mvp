import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const weeklySlugs = ['elegir-app-reservas-barberia', 'reducir-no-shows-barberia', 'calcular-precios-barberia', 'conseguir-clientes-barberia-barrio']
const historicSlugs = ['montar-barberia-espana', 'organizar-agenda-barberia']
const root = new URL('../', import.meta.url)
const file = (path) => fileURLToPath(new URL(path, root))

// Exercise real TSX without a Next build, HTTP server, git, or external workspace.
async function componentUrl(path) {
  assert.ok(existsSync(file(path)), `The server component ${path} must exist`)
  const require = createRequire(new URL(path, root))
  const { outputText } = ts.transpileModule(readFileSync(file(path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  let source = outputText
  for (const specifier of new Set([...source.matchAll(/from ["']([^"']+)["']/g)].map((match) => match[1]))) {
    let resolved
    if (specifier.startsWith('@/')) {
      const base = specifier.slice(2)
      const dependency = ['.ts', '.tsx'].map((ext) => `${base}${ext}`).find((path) => existsSync(file(path)))
      assert.ok(dependency, `Local module ${specifier} must exist`)
      resolved = await componentUrl(dependency)
    } else {
      resolved = specifier.startsWith('node:') ? specifier : pathToFileURL(require.resolve(specifier)).href
    }
    source = source.replaceAll(`from "${specifier}"`, `from ${JSON.stringify(resolved)}`).replaceAll(`from '${specifier}'`, `from ${JSON.stringify(resolved)}`)
  }
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
}

async function component(path) {
  return import(await componentUrl(path))
}

async function resources() {
  assert.ok(existsSync(file('lib/resources.ts')), 'The approved resources data layer must exist')
  return import(new URL('../lib/resources.ts', import.meta.url))
}

test('approved opening guide separates its single H1 and preserves official sources', async () => {
  const { getResource } = await resources()
  const post = getResource('montar-barberia-espana')
  assert.equal(post.title, 'Cómo montar una barbería en España en 2026: requisitos y primeros pasos')
  assert.ok(post.body.startsWith('**Para montar una barbería necesitas'))
  assert.doesNotMatch(post.body, /^# /m)
  assert.doesNotMatch(post.body, /BORRADOR|Borrador pendiente|NO APROBADO/)
  assert.match(post.body, /\*Revisado el 2 de noviembre de 2026\.\*/)
  assert.match(post.body, /## Fuentes y alcance de la revisión/)
  assert.match(post.body, /7\. \*\*Fuente comercial del apartado de agenda:/)
})

test('catalogue records editorial approval independently of implementation', async () => {
  const { listResources } = await resources()
  for (const post of listResources()) {
    assert.equal(post.editorialStatus, 'approved', post.slug)
    assert.equal(post.publishedAt, historicSlugs.includes(post.slug) ? '2026-11-02' : null)
  }
})

test('finite catalogue exposes historic guides and four W45 previews without arbitrary file access', async () => {
  const { listResources, getResource } = await resources()
  assert.equal(typeof listResources, 'function', 'A finite approved index must exist')
  const posts = listResources()
  assert.deepEqual(posts.map(({ slug }) => slug), [...historicSlugs, ...weeklySlugs])
  const agenda = getResource('organizar-agenda-barberia')
  assert.equal(agenda.title, 'Cómo organizar la agenda de tu barbería sin vivir en WhatsApp')
  assert.ok(agenda.body.startsWith('**Para ordenar las citas de una barbería'))
  assert.doesNotMatch(agenda.body, /^# |Notas de revisión|pending_review|draft_complete|proposed_url/m)
  assert.match(agenda.body, /También existe modalidad mensual\./)
  for (const slug of ['no-existe', '../package', 'constructor', 'toString', '__proto__', 'montar-barberia-espana/extra', '']) {
    assert.equal(getResource(slug), undefined)
  }
  for (const post of posts) {
    assert.equal(post.publishedAt, historicSlugs.includes(post.slug) ? '2026-11-02' : null)
    assert.ok(post.description.length > 40)
    assert.equal(getResource(post.slug).title, post.title)
  }
})

test('versioned provenance pins every byte of both full approved derivatives', async () => {
  const { listResources } = await resources()
  assert.ok(existsSync(file('content/resources/provenance.json')), 'Portable provenance must exist')
  const provenance = JSON.parse(readFileSync(file('content/resources/provenance.json'), 'utf8'))
  const sourceHashes = [
    '61fb40de174c9ae4e550a9381cc8cf589673159b14776b4c484b8a6ff2bdee45',
    'ae8473b6ae6446060fce5c3c1355bb74519f5bb37d904be9bb2ae1b89704a5a7',
  ]
  assert.deepEqual(provenance.articles.map((entry) => entry.sourceSha256), sourceHashes)
  assert.deepEqual(provenance.articles.map((entry) => entry.slug), historicSlugs)
  const weekly = JSON.parse(readFileSync(file('content/resources/provenance-2026-W45.json'), 'utf8'))
  assert.deepEqual(weekly.articles.map(({ slug }) => slug), weeklySlugs)
  assert.deepEqual([...provenance.articles, ...weekly.articles].map(({ slug }) => slug), listResources().map(({ slug }) => slug))
  for (const entry of weekly.articles) {
    assert.equal(entry.editorialStatus, 'pending_review')
    assert.equal(entry.publishedAt, null)
    const raw = readFileSync(file(`content/resources/${entry.slug}.md`))
    assert.equal(createHash('sha256').update(raw).digest('hex'), entry.derivedSha256)
    assert.equal(entry.sourceSha256, entry.derivedSha256)
    assert.equal((raw.toString().match(/^# /gm) || []).length, 1)
    assert.doesNotMatch(JSON.stringify(entry), /\/home\/|\/workspace\//)
  }
  for (const entry of provenance.articles) {
    const raw = readFileSync(file(`content/resources/${entry.slug}.md`))
    assert.equal(createHash('sha256').update(raw).digest('hex'), entry.derivedSha256)
    assert.match(entry.transform, /H1/)
    assert.doesNotMatch(JSON.stringify(entry), /\/home\/|\/workspace\//)
    const markdown = raw.toString('utf8')
    assert.equal((markdown.match(/^# /gm) || []).length, 1)
    assert.ok(markdown.endsWith('\n'))
  }
})

test('server Markdown renders GFM with confined accessible tables and rejects executable markup', async () => {
  const { default: ResourceMarkdown } = await component('components/resources/ResourceMarkdown.tsx')
  const html = renderToStaticMarkup(createElement(ResourceMarkdown, { body: [
    '## Horarios', '', '| Día | Hora |', '|---|---|', '| Lunes | 10:00 |', '', '- [ ] Revisar', '',
    '<script>alert(1)</script>', '', '<img src=x onerror="alert(1)">', '', '[Peligro](javascript:alert%281%29)',
  ].join('\n') }))
  assert.match(html, /<h2>Horarios<\/h2>/)
  assert.match(html, /class="resource-table-scroll"/)
  assert.match(html, /role="region"/)
  assert.match(html, /tabindex="0"/)
  assert.match(html, /<table>/)
  assert.match(html, /type="checkbox" disabled=""/)
  assert.doesNotMatch(html, /<script|<img|onerror|javascript:/)
})

test('route contracts provide a finite static allowlist, absolute metadata and local navigation', async () => {
  for (const path of ['app/recursos/page.tsx', 'app/recursos/[slug]/page.tsx', 'app/recursos/layout.tsx']) {
    assert.ok(existsSync(file(path)), `Editorial route ${path} must exist`)
    assert.doesNotMatch(readFileSync(file(path), 'utf8'), /["']use client["']|dangerouslySetInnerHTML/)
  }
  const page = readFileSync(file('app/recursos/[slug]/page.tsx'), 'utf8')
  assert.match(page, /dynamicParams = false/)
  assert.match(page, /generateStaticParams/)
  assert.match(page, /notFound\(\)/)
  const { resourceMetadata } = await component('components/resources/metadata.ts')
  const meta = resourceMetadata('/recursos/montar-barberia-espana', 'Guía', 'Descripción')
  assert.equal(meta.alternates.canonical, 'https://trujas.app/recursos/montar-barberia-espana')
  assert.equal(meta.openGraph.url, meta.alternates.canonical)
  assert.equal(meta.openGraph.title, 'Guía')
  assert.equal(meta.twitter.description, 'Descripción')
  const layout = readFileSync(file('app/recursos/layout.tsx'), 'utf8')
  assert.match(layout, /href="\/"/)
  assert.match(layout, /href="\/recursos"/)
  assert.match(layout, /href="\/pricing"/)
})

test('real index and article components preserve complete Markdown, review states and metadata', async () => {
  const { listResources } = await resources()
  const { default: Index } = await component('app/recursos/page.tsx')
  const indexHtml = renderToStaticMarkup(createElement(Index))
  assert.equal((indexHtml.match(/<h1>/g) || []).length, 1)
  const { default: Article, generateStaticParams, generateMetadata, dynamicParams } = await component('app/recursos/[slug]/page.tsx')
  assert.equal(dynamicParams, false)
  assert.deepEqual(generateStaticParams(), listResources().map(({ slug }) => ({ slug })))
  const { default: ResourceMarkdown } = await component('components/resources/ResourceMarkdown.tsx')
  for (const post of listResources()) {
    assert.ok(indexHtml.includes(`href="/recursos/${post.slug}"`))
    const props = { params: Promise.resolve({ slug: post.slug }) }
    const html = renderToStaticMarkup(await Article(props))
    assert.equal((html.match(/<h1>/g) || []).length, 1)
    const bodyHtml = renderToStaticMarkup(createElement(ResourceMarkdown, { body: post.body }))
    assert.ok(html.includes(bodyHtml), 'The complete approved body must render without filtering or rewriting')
    assert.match(html, /Sigue leyendo/)
    for (const related of listResources().filter(({ slug }) => slug !== post.slug)) {
      assert.ok(html.includes(`href="/recursos/${related.slug}"`))
    }
    const metadata = await generateMetadata(props)
    assert.equal(metadata.alternates.canonical, `https://trujas.app/recursos/${post.slug}`)
    if (post.editorialStatus === 'pending_review') {
      assert.deepEqual(metadata.robots, { index: false, follow: false })
      assert.match(html, /Pendiente de revisión editorial/)
      assert.doesNotMatch(html, /Publicado el/)
    } else {
      if (post.publishedAt) assert.match(html, /Publicado el/)
      else assert.doesNotMatch(html, /Publicado el|Pendiente de revisión editorial/)
      assert.notEqual(metadata.robots?.index, false)
    }
  }
  for (const slug of ['no-existe', 'montar-barberia-espana/extra']) {
    const props = { params: Promise.resolve({ slug }) }
    await assert.rejects(() => Article(props), /NEXT_HTTP_ERROR_FALLBACK;404/)
    await assert.rejects(() => generateMetadata(props), /NEXT_HTTP_ERROR_FALLBACK;404/)
  }
})
