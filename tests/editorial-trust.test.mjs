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
// Same real-TSX loader used by resources-content.test.mjs; no Next build required.
async function componentUrl(path) {
  assert.ok(existsSync(file(path)), `The server component ${path} must exist`)
  const require = createRequire(new URL(path, root))
  const { outputText } = ts.transpileModule(readFileSync(file(path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  })
  let source = outputText.replace(/import ["'][^"']+\.css["'];?/g, '')
  for (const specifier of new Set([...source.matchAll(/from ["']([^"']+)["']/g)].map((match) => match[1]))) {
    let resolved
    if (specifier.startsWith('@/')) {
      const dependency = ['.ts', '.tsx'].map((ext) => `${specifier.slice(2)}${ext}`).find((path) => existsSync(file(path)))
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
const schemas = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
  const data = JSON.parse(m[1]); return data['@graph'] || [data]
})

test('about page identifies confirmed roles, discloses AI and no professional review', async () => {
  const { default: About, metadata } = await component('app/sobre-nosotros/page.tsx')
  const html = renderToStaticMarkup(createElement(About))
  assert.equal((html.match(/<h1>/g) || []).length, 1)
  assert.match(html, /Miguel Carmona Rodríguez/)
  assert.match(html, /desarrollador/i)
  assert.match(html, /Pablo/)
  assert.match(html, /dueño de Trubarber, una peluquería en Galicia/)
  assert.match(html, /inteligencia artificial/i)
  assert.match(html, /no han pasado una revisión profesional/i)
  assert.match(html, /no implica que Pablo haya escrito o revisado/i)
  assert.match(html, /href="\/recursos"/)
  assert.equal(metadata.alternates.canonical, 'https://trujas.app/sobre-nosotros')
  const people = schemas(html).filter((node) => node['@type'] === 'Person')
  assert.deepEqual(people.map(({ name, jobTitle }) => ({ name, jobTitle })), [
    { name: 'Miguel Carmona Rodríguez', jobTitle: 'Desarrollador de trujas' },
    { name: 'Pablo', jobTitle: 'Dueño de Trubarber' },
  ])
  assert.doesNotMatch(JSON.stringify(people), /founder|reviewer|award|sameAs|email|image/i)
  assert.doesNotMatch(html, /<img|cofundador|probado por Pablo/i)
})

test('resource routes render collective authorship, scoped editorial notes and truthful linked schemas without altering the body', async () => {
  const { listResources } = await component('lib/resources.ts')
  const { default: Index } = await component('app/recursos/page.tsx')
  const indexHtml = renderToStaticMarkup(createElement(Index))
  const list = schemas(indexHtml).find((node) => node['@type'] === 'ItemList')
  assert.ok(list, 'Resource index needs an ItemList')
  assert.deepEqual(list.itemListElement.map((item) => item.url), listResources().map((post) => `https://trujas.app/recursos/${post.slug}`))
  assert.ok(schemas(indexHtml).some((node) => node['@type'] === 'BreadcrumbList'))
  const { default: Article } = await component('app/recursos/[slug]/page.tsx')
  const { default: Markdown } = await component('components/resources/ResourceMarkdown.tsx')
  for (const post of listResources()) {
    const html = renderToStaticMarkup(await Article({ params: Promise.resolve({ slug: post.slug }) }))
    assert.match(html, /Equipo de trujas/)
    assert.match(html, /href="\/sobre-nosotros#proceso-editorial"/)
    assert.match(html, /Nota editorial/)
    assert.match(html, /inteligencia artificial/i)
    assert.match(html, /no sustituye/i)
    assert.ok(html.includes(renderToStaticMarkup(createElement(Markdown, { body: post.body }))))
    const article = schemas(html).find((node) => node['@type'] === 'Article')
    assert.ok(article)
    assert.equal(article.author['@type'], 'Organization')
    assert.equal(article.author.name, 'Equipo de trujas')
    assert.equal(article.datePublished, post.publishedAt)
    assert.equal(article.publisher['@id'], 'https://trujas.app/#organization')
    assert.equal(article.mainEntityOfPage, `https://trujas.app/recursos/${post.slug}`)
    assert.ok(schemas(html).some((node) => node['@type'] === 'BreadcrumbList'))
    assert.doesNotMatch(JSON.stringify(schemas(html)), /dateModified|reviewedBy|aggregateRating|Pablo/)
    if (post.slug === 'montar-barberia-espana') {
      assert.match(html, /https:\/\/sede.agenciatributaria.gob.es\/Sede\/procedimientoini\/G322.shtml/)
      assert.match(html, /revisión profesional jurídica, fiscal o técnica/)
    } else {
      assert.match(html, /https:\/\/www.aepd.es\/guias\/guia-proteccion-datos-por-defecto.pdf/)
      assert.match(html, /no es un estudio de resultados/)
    }
  }
})

test('public organization and website identify only the product; JSON-LD cannot break out of its script', async () => {
  const { organizationSchema, websiteSchema } = await component('lib/structured-data.ts')
  assert.equal(organizationSchema['@type'], 'Organization')
  assert.equal(organizationSchema.name, 'trujas')
  assert.equal(organizationSchema.url, 'https://trujas.app')
  assert.equal(websiteSchema['@type'], 'WebSite')
  assert.equal(websiteSchema.publisher['@id'], organizationSchema['@id'])
  assert.doesNotMatch(JSON.stringify([organizationSchema, websiteSchema]), /legalName|taxID|vatID|address|email|sameAs|aggregateRating|Offer|SoftwareApplication/)
  const { default: JsonLd } = await component('components/seo/JsonLd.tsx')
  const data = { '@type': 'Thing', name: '</script><script>alert(1)</script>' }
  const html = renderToStaticMarkup(createElement(JsonLd, { data }))
  assert.equal((html.match(/<script/g) || []).length, 1)
  assert.match(html, /\\u003c/)
  assert.deepEqual(schemas(html), [data])
})
