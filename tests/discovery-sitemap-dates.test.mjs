import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
function load(path) {
  const { outputText } = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const loaded = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (name === '@/lib/seo') return load('lib/seo.ts')
    if (name === '@/lib/sitemap-content-dates') return load('lib/sitemap-content-dates.ts')
    throw new Error(`Unexpected runtime dependency: ${name}`)
  }, loaded, loaded.exports)
  return loaded.exports
}

const expected = {
  '/': '2026-11-09T16:03:56Z',
  '/pricing': '2026-11-09T16:03:56Z',
  '/sobre-nosotros': '2026-11-09T16:03:56Z',
  '/recursos': '2026-11-09T17:19:06Z',
  '/recursos/montar-barberia-espana': '2026-11-09T16:03:56Z',
  '/recursos/organizar-agenda-barberia': '2026-11-09T16:03:56Z',
  '/recursos/elegir-app-reservas-barberia': '2026-11-24T16:10:06Z',
  '/recursos/reducir-no-shows-barberia': '2026-11-24T16:10:06Z',
  '/recursos/calcular-precios-barberia': '2026-11-09T17:19:06Z',
  '/recursos/conseguir-clientes-barberia-barrio': '2026-11-09T17:19:06Z',
  '/funciones': '2026-11-09T17:19:06Z',
  '/funciones/pagina-reservas': '2026-11-09T17:19:06Z',
}

test('every allowlisted URL has its reviewed content-change timestamp, not a build date', () => {
  const sitemap = load('app/sitemap.ts').default
  const entries = sitemap()
  assert.deepEqual(entries.map(({ url }) => new URL(url).pathname), Object.keys(expected))
  for (const entry of entries) {
    assert.equal(entry.lastModified, expected[new URL(entry.url).pathname], entry.url)
  }
  assert.deepEqual(sitemap(), entries)
})

test('each date has auditable git commit, changed paths and a meaningful-content reason', () => {
  const { sitemapContentDates } = load('lib/sitemap-content-dates.ts')
  const git = (...args) => execFileSync('git', args, {
    cwd: new URL('../', import.meta.url), encoding: 'utf8',
  }).trim()
  assert.deepEqual(Object.keys(sitemapContentDates), Object.keys(expected))
  for (const [route, entry] of Object.entries(sitemapContentDates)) {
    assert.match(entry.commit ?? '', /^[a-f0-9]{40}$/, `${route}: full commit SHA`)
    assert.equal(git('show', '-s', '--format=%cI', entry.commit), entry.lastModified)
    assert.ok(entry.paths?.length, `${route}: evidence paths`)
    assert.ok(entry.reason?.length > 30, `${route}: explain the meaningful change`)
    const changed = git('diff', '--name-only', `${entry.commit}^1`, entry.commit).split('\n')
    for (const path of entry.paths) assert.ok(changed.includes(path), `${route}: ${path} changed in commit`)
  }
})
