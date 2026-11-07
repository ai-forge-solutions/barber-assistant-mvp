import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { handlers as api } from './mcp-oauth-loader.mjs'
const { authorize, connections, authorizationMetadata, resourceMetadata, json, preflight } = api
import { opaqueToken } from '../lib/mcp/oauth-core.ts'
const origin='https://app.example'
const client={client_id:'abc',client_name:'Asistente <seguro>',redirect_uris:['https://client.example/cb']}
const params=()=>new URLSearchParams({client_id:'abc',redirect_uri:client.redirect_uris[0],response_type:'code',code_challenge:opaqueToken(),code_challenge_method:'S256',resource:origin+'/mcp',scope:'bookings:write',state:'return-state'})
const user=async()=>({id:'user',email:'test@example.test'})
const clientDb=()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:client,error:null})})})})})
test('consent promises creation only and escapes untrusted client names',async()=>{
 const r=await authorize(new Request(origin+'/oauth/authorize?'+params()),{db:clientDb,user})
 assert.equal(r.status,200);const html=await r.text()
 assert.match(html,/Solo crear citas/);assert.doesNotMatch(html,/Crear, cambiar y cancelar/);assert.match(html,/Asistente &lt;seguro&gt;/)
 assert.match(r.headers.get('content-security-policy'),/form-action 'self' https:\/\/client\.example;/,'Native browser must be allowed to follow the validated OAuth callback redirect')
 assert.equal(r.headers.get('referrer-policy'),'same-origin','Native form POST must retain its same-origin Origin; external callbacks must not receive the referrer')
 assert.match(r.headers.get('set-cookie'),/__Host-trujas-oauth-consent=.*HttpOnly; SameSite=Lax/)
})
test('cancellation consent is explicit and separate from creation permission',async()=>{
 const p=params();p.set('scope','bookings:read bookings:cancel')
 const r=await authorize(new Request(origin+'/oauth/authorize?'+p),{db:clientDb,user})
 assert.equal(r.status,200)
 const html=await r.text()
 assert.match(html,/Cancelar tus propias citas futuras/)
 assert.doesNotMatch(html,/No permite cancelar citas/)
 assert.doesNotMatch(html,/Solo crear citas/)
 const resource=resourceMetadata(new Request(origin+'/discovery'))
 assert.ok(resource.scopes_supported.includes('bookings:cancel'))
})

test('connections renders an inferred array relation without quotes',async()=>{
 const rows=[{id:'00000000-0000-4000-8000-000000000001',client_id:'abc',scope:'bookings:read',mcp_oauth_clients:[{client_name:'Mi asistente'}]}]
 const query={select:()=>query,eq:()=>query,is:()=>query,gt:()=>query,limit:async()=>({data:rows,error:null})}
 const r=await connections(new Request(origin+'/oauth/connections'),{db:()=>({from:()=>query}),user})
 assert.equal(r.status,200);assert.match(await r.text(),/<h2>Mi asistente<\/h2>/)
})
test('consent POST binds origin and parameters, preserves state and stores only code hash',async()=>{
 const p=params(),url=origin+'/oauth/authorize?'+p
 const get=await authorize(new Request(url),{db:clientDb,user});const html=await get.text()
 const nonce=/name="nonce" value="([^"]+)"/.exec(html)[1]
 const cookie=get.headers.get('set-cookie').split(';')[0];const inserts=[]
 const db=()=>({from:table=>table==='mcp_oauth_clients'?clientDb().from():{insert:async value=>{inserts.push(value);return {error:null}}}})
 const post=(decision,requestOrigin=origin,query=url)=>authorize(new Request(query,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',origin:requestOrigin,cookie},body:new URLSearchParams({nonce,decision})}),{db,user})
 assert.equal((await post('approve','https://evil.example')).status,403)
 const altered=new URL(url);altered.searchParams.set('scope','bookings:read');assert.equal((await post('approve',origin,altered.href)).status,403)
 assert.equal(inserts.length,0)
 const denied=await post('deny');assert.equal(denied.status,303);assert.equal(new URL(denied.headers.get('location')).searchParams.get('error'),'access_denied');assert.equal(inserts.length,0)
 const approved=await post('approve');assert.equal(approved.status,303)
 const target=new URL(approved.headers.get('location'));assert.equal(target.searchParams.get('state'),'return-state')
 const code=target.searchParams.get('code');assert.equal(code.length,43);assert.equal(inserts[0].code_hash.length,64);assert.ok(!JSON.stringify(inserts).includes(code));assert.equal(inserts[0].scope,'bookings:write');assert.equal(inserts[0].resource,origin+'/mcp')
})
test('each Next route exposes executable methods delegating to the shared handlers',async()=>{
 const methods={authorize:['GET','POST'],connections:['GET','POST'],register:['POST','OPTIONS'],token:['POST','OPTIONS'],revoke:['POST','OPTIONS']}
 const handlers={authorize,connections,authorizationMetadata,resourceMetadata,json,preflight}
 for(const name of ['register','token','revoke'])handlers[name]=async()=>new Response(name)
 for(const [name,exports] of Object.entries(methods)){
  const source=await readFile(new URL(`../app/oauth/${name}/route.ts`,import.meta.url),'utf8')
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const mod={exports:{}};new Function('require','exports','module',js)(id=>id.endsWith('/oauth')?{oauthDependencies:{db:clientDb,user:async()=>null}}:handlers,mod.exports,mod)
  for(const method of exports){assert.equal(typeof mod.exports[method],'function');const response=await mod.exports[method](new Request(origin+'/oauth/'+name,{method}));assert.ok(response instanceof Response)}
 }
 for(const name of ['oauth-authorization-server','oauth-protected-resource','oauth-protected-resource/mcp']){
  const source=await readFile(new URL(`../app/.well-known/${name}/route.ts`,import.meta.url),'utf8')
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
  const mod={exports:{}};new Function('require','exports','module',js)(()=>handlers,mod.exports,mod)
  const r=await mod.exports.GET(new Request(origin+'/.well-known/'+name));assert.equal(r.status,200)
  const body=await r.json();assert.equal(body.resource||body.issuer,name==='oauth-authorization-server'?origin:origin+'/mcp')
 }
})
