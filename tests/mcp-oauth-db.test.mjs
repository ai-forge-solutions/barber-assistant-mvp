// Disposable local PostgreSQL only; never reads application environment or remote URLs.
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {hashToken, opaqueToken} from '../lib/mcp/oauth-core.ts'
const modules=process.env.MCP_TEST_MODULES
const hash=()=>hashToken(opaqueToken())
test('real PostgreSQL: service-only privileges, atomic code replay and refresh rotation', {skip:!modules}, async t=>{
 const require=createRequire(join(modules,'_test.cjs'))
 const {default:EmbeddedPostgres}=await import(require.resolve('embedded-postgres'))
 const pg=new EmbeddedPostgres({databaseDir:join(tmpdir(),`mcp-oauth-${process.pid}`),port:55441,user:'postgres',password:'local-test-only',persistent:false,onLog(){},onError(){}})
 let db,other
 try {
  await pg.initialise();await pg.start();db=pg.getPgClient();await db.connect()
  await db.query(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema public to service_role;insert into auth.users values('00000000-0000-4000-8000-000000000001')`)
  await db.query(await readFile(new URL('../supabase/migrations/20261106184405_mcp_oauth.sql',import.meta.url),'utf8'))
  await t.test('browser roles cannot read tables or execute token RPCs',async()=>{
   for(const role of ['anon','authenticated']) {
    for(const table of ['mcp_oauth_clients','mcp_oauth_codes','mcp_oauth_grants']){
     assert.equal((await db.query('select has_table_privilege($1,$2,$3) ok',[role,table,'SELECT'])).rows[0].ok,false)
     await db.query('set role '+role);await assert.rejects(db.query('select * from '+table),/permission denied/);await db.query('reset role')
    }
    for(const fn of ['mcp_oauth_exchange_code(text,text,text,text,text,text,text)','mcp_oauth_rotate_refresh(text,text,text,text,text)','mcp_oauth_register_client(text,text,jsonb)']) assert.equal((await db.query('select has_function_privilege($1,$2,$3) ok',[role,fn,'EXECUTE'])).rows[0].ok,false)
   }
  })
  await db.query('set role service_role')
  assert.equal((await db.query(`select mcp_oauth_register_client('abc','Asistente','["https://client.example/cb"]') ok`)).rows[0].ok,true)
  const code=hash(),resource='https://app.example/mcp',challenge=opaqueToken()
  await db.query(`insert into mcp_oauth_codes(code_hash,user_id,client_id,redirect_uri,challenge,resource,scope,expires_at) values($1,'00000000-0000-4000-8000-000000000001','abc','https://client.example/cb',$2,$3,'bookings:read',now()+interval '5 minutes')`,[code,challenge,resource])
  const access=hash(),refresh=hash()
  const exchange=(c=db,overrides={})=>c.query('select * from mcp_oauth_exchange_code($1,$2,$3,$4,$5,$6,$7)',['abc',resource,access,refresh,code,'https://client.example/cb',challenge].map((v,i)=>overrides[i]??v))
  await t.test('wrong client, audience, redirect or PKCE does not consume code',async()=>{
   for(const [i,value] of [[0,'other'],[1,'https://evil.example/mcp'],[5,'https://evil.example/cb'],[6,opaqueToken()]])assert.equal((await exchange(db,{[i]:value})).rowCount,0)
  })
  other=pg.getPgClient();await other.connect();await other.query('set role service_role')
  await t.test('two concurrent code exchanges issue exactly one grant',async()=>{
   const result=await Promise.all([exchange(),exchange(other)])
   assert.equal(result.reduce((n,r)=>n+r.rowCount,0),1);assert.equal((await exchange()).rowCount,0)
   assert.equal((await db.query('select * from mcp_oauth_grants')).rowCount,1)
  })
  const nextAccess=hash(),nextRefresh=hash()
  const rotate=(c=db,r=refresh,audience=resource)=>c.query('select * from mcp_oauth_rotate_refresh($1,$2,$3,$4,$5)',['abc',audience,nextAccess,nextRefresh,r])
  await t.test('rotation binds audience and only one concurrent refresh succeeds',async()=>{
   assert.equal((await rotate(db,refresh,'https://evil.example/mcp')).rowCount,0)
   const before=(await db.query('select refresh_expires_at from mcp_oauth_grants')).rows[0].refresh_expires_at
   const result=await Promise.all([rotate(),rotate(other)]);assert.equal(result.reduce((n,r)=>n+r.rowCount,0),1)
   assert.equal((await rotate()).rowCount,0)
   const row=(await db.query('select * from mcp_oauth_grants')).rows[0]
   assert.equal(row.access_hash,nextAccess);assert.equal(row.refresh_hash,nextRefresh);assert.deepEqual(row.refresh_expires_at,before)
   assert.equal(row.scope,'bookings:read')
  })
  await t.test('revoked and expired refresh credentials cannot rotate',async()=>{
   await db.query('update mcp_oauth_grants set revoked_at=now()');assert.equal((await rotate(db,nextRefresh)).rowCount,0)
   await db.query("update mcp_oauth_grants set revoked_at=null,refresh_expires_at=now()-interval '1 second'");assert.equal((await rotate(db,nextRefresh)).rowCount,0)
  })
 } finally {if(other)await other.end();if(db)await db.end();await pg.stop()}
})
