import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function componentUrl(path) {
  const root=new URL('../',import.meta.url)
  const file=p=>fileURLToPath(new URL(p,root))
  assert.ok(existsSync(file(path)), `Missing review component ${path}`)
  const require=createRequire(new URL(path,root))
  let source=ts.transpileModule(readFileSync(file(path),'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText
  source=source.replace(/^import ['"].*\.css['"];?$/gm,'')
  for (const specifier of new Set([...source.matchAll(/from ["']([^"']+)["']/g)].map(m=>m[1]))) {
    let resolved
    if (specifier.startsWith('@/')) {
      const dep=['.ts','.tsx'].map(ext=>specifier.slice(2)+ext).find(p=>existsSync(file(p)))
      assert.ok(dep); resolved=await componentUrl(dep)
    } else resolved=specifier.startsWith('node:')?specifier:pathToFileURL(require.resolve(specifier)).href
    source=source.replaceAll(`from "${specifier}"`,`from ${JSON.stringify(resolved)}`).replaceAll(`from '${specifier}'`,`from ${JSON.stringify(resolved)}`)
  }
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
}

test('review routes are finite, noindex and render the literal complete Markdown with review notices', async()=> {
 const {reviewCatalog}=await import('../lib/seo-w47-review.ts')
 const Index=await import(await componentUrl('app/revision-seo/2026-w47/page.tsx'))
 const Article=await import(await componentUrl('app/revision-seo/2026-w47/[slug]/page.tsx'))
 const Markdown=await import(await componentUrl('components/resources/ResourceMarkdown.tsx'))
 const Layout=await import(await componentUrl('app/revision-seo/2026-w47/layout.tsx'))
 for (const m of [Index,Layout]) assert.deepEqual(m.metadata.robots,{index:false,follow:false})
 assert.equal(Article.dynamicParams,false)
 assert.deepEqual(Article.generateStaticParams(),reviewCatalog.list().map(({slug})=>({slug})))
 const indexHTML=renderToStaticMarkup(createElement(Index.default))
 assert.match(indexHTML,/Revisión explícita requerida/)
 for (const post of reviewCatalog.list()) {
   const props={params:Promise.resolve({slug:post.slug})}
   const meta=await Article.generateMetadata(props)
   assert.deepEqual(meta.robots,{index:false,follow:false})
   assert.equal(meta.alternates.canonical,`https://trujas.app${post.canonicalPath}`)
   const html=renderToStaticMarkup(await Article.default(props))
   assert.equal((html.match(/<h1>/g)||[]).length,1)
   assert.match(html,/Revisión explícita requerida/)
   assert.doesNotMatch(html,/Publicado el|application\/ld\+json/)
   assert.ok(html.includes(renderToStaticMarkup(createElement(Markdown.default,{body:post.body}))))
   assert.ok(indexHTML.includes(`/revision-seo/2026-w47/${post.slug}`))
 }
 await assert.rejects(()=>Article.default({params:Promise.resolve({slug:'no-existe'})}),/NEXT_HTTP_ERROR_FALLBACK;404/)
 for (const path of ['app/sitemap.ts','public/llms.txt','lib/resources.ts','app/page.tsx']) assert.doesNotMatch(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/2026-w47|seo-w47/)
})

test('W47 delivery contains exactly five substantial complete drafts, separate from public allowlist', async () => {
  const { reviewCatalog } = await import('../lib/seo-w47-review.ts')
  assert.equal(reviewCatalog.list().length, 5)
  for (const p of reviewCatalog.list()) {
    assert.ok(p.body.split(/\s+/).length > 650)
    assert.match(p.body, /Fuentes y alcance/)
    assert.match(p.body, /\/pricing/)
  }
})

const entries = Array.from({length:5}, (_, i) => ({slug:`operacion-${i}`,title:`Operación ${i}`,description:'Descripción editorial de la operación',canonicalPath:`/recursos/operacion-${i}`}))

 test('review catalog rejects traversal and incomplete manifests; renders complete single-H1 bodies without publication', async () => {
  const { createReviewCatalog } = await import('../lib/seo-w47-review.ts')
  const dir=mkdtempSync(join(tmpdir(),'trujas-w47-'))
  try {
    const c=createReviewCatalog(dir)
    assert.deepEqual(c.list(),[])
    for (const e of entries) writeFileSync(join(dir,e.slug+'.md'),`# ${e.title}\n\n## Procedimiento\n\nTexto completo.\n\nÚltima fuente íntegra.\n`)
    writeFileSync(join(dir,'index.json'),JSON.stringify(entries))
    assert.equal(c.list().length,5)
    assert.equal(c.get(entries[0].slug).editorialStatus,'pending_review')
    assert.equal(c.get(entries[0].slug).publishedAt,null)
    assert.match(c.get(entries[0].slug).body,/Última fuente íntegra/)
    for (const slug of ['../package','constructor','toString','__proto__','operacion-0/extra','']) assert.equal(c.get(slug),undefined)
    for (const bad of [entries.slice(1), [...entries.slice(1),entries[1]], [{...entries[0],slug:'../escape'},...entries.slice(1)], [{...entries[0],canonicalPath:'/otra'},...entries.slice(1)], [{...entries[0],approved:true},...entries.slice(1)]]) {
      writeFileSync(join(dir,'index.json'),JSON.stringify(bad)); assert.throws(()=>c.list(),/Invalid/)
    }
    writeFileSync(join(dir,'index.json'),JSON.stringify(entries))
    writeFileSync(join(dir,'operacion-0.md'),'# Otro título\n\nTexto\n');assert.throws(()=>c.list(),/Invalid/)
    writeFileSync(join(dir,'operacion-0.md'),'# Operación 0\n\nTexto\n# Segundo H1\n');assert.throws(()=>c.list(),/Invalid/)
  } finally {rmSync(dir,{recursive:true,force:true})}
})
