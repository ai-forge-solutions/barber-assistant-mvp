import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { opaqueToken, hashToken } from '../lib/mcp/oauth-core.ts'
import { handlers as api } from './mcp-oauth-loader.mjs'
const origin='https://app.example'
const request=(path,body)=>new Request(origin+path,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)})
const deps={db:()=>{throw Error('should not touch DB')},user:async()=>null}
test('metadata advertises exact MCP audience and S256 public-client endpoints',()=>{
 assert.equal(typeof api.authorizationMetadata,'function')
 const m=api.authorizationMetadata(new Request(origin+'/.well-known/oauth-authorization-server'))
 assert.equal(m.issuer,origin); assert.equal(m.token_endpoint,origin+'/oauth/token'); assert.deepEqual(m.code_challenge_methods_supported,['S256']); assert.deepEqual(m.token_endpoint_auth_methods_supported,['none'])
 assert.equal(api.resourceMetadata(new Request(origin+'/.well-known/oauth-protected-resource')).resource,origin+'/mcp')
})
test('public token endpoint rejects other grants, missing resource and client authentication before DB',async()=>{
 assert.equal(typeof api.token,'function')
 for(const body of [{grant_type:'password'},{grant_type:'authorization_code',resource:origin+'/mcp',client_secret:'secret'},{grant_type:'refresh_token',client_id:'abc',refresh_token:opaqueToken(),resource:'https://wrong.example/mcp'}]) {
  const r=await api.token(request('/oauth/token',body),deps); assert.equal(r.status,400)
 }
})
test('authorization and refresh exchange only hashes using atomic RPC',async()=>{
 const rawCode=opaqueToken(), refresh=opaqueToken(); const calls=[]
 const db={rpc:async(name,args)=>{calls.push([name,args]);return {data:[{scope:'bookings:read'}],error:null}}}
 for(const body of [{grant_type:'authorization_code',client_id:'abc',redirect_uri:'https://client.example/cb',code:rawCode,code_verifier:'x'.repeat(43),resource:origin+'/mcp'},{grant_type:'refresh_token',client_id:'abc',refresh_token:refresh,resource:origin+'/mcp'}]) {
  const r=await api.token(request('/oauth/token',body),{...deps,db:()=>db}); assert.equal(r.status,200); const t=await r.json();assert.equal(t.expires_in,3600);assert.equal(t.token_type,'Bearer');assert.equal(t.access_token.length,43);assert.equal(t.refresh_token.length,43)
 }
 assert.equal(calls[0][0],'mcp_oauth_exchange_code');assert.equal(calls[0][1].p_code_hash,hashToken(rawCode));assert.equal(calls[1][0],'mcp_oauth_rotate_refresh');assert.equal(calls[1][1].p_refresh_hash,hashToken(refresh));
 assert.ok(!JSON.stringify(calls).includes(rawCode));assert.ok(!JSON.stringify(calls).includes(refresh))
})
test('replayed or expired code and refresh return sanitized invalid_grant',async()=>{
 const db={rpc:async()=>({data:[],error:null})}
 const r=await api.token(request('/oauth/token',{grant_type:'refresh_token',client_id:'abc',resource:origin+'/mcp',refresh_token:opaqueToken()}),{...deps,db:()=>db});assert.equal(r.status,400);assert.deepEqual(await r.json(),{error:'invalid_grant'})
 const broken={rpc:async()=>{throw Error('database password secret')}}
 const failed=await api.token(request('/oauth/token',{grant_type:'refresh_token',client_id:'abc',resource:origin+'/mcp',refresh_token:opaqueToken()}),{...deps,db:()=>broken});assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:'server_error'})
})
test('migration declares service-only RLS, atomic delete/rotate, and durable registration cap',async()=>{
 const sql=await readFile(new URL('../supabase/migrations/20261106090000_mcp_oauth.sql',import.meta.url),'utf8')
 for(const name of ['clients','codes','grants']) assert.match(sql,new RegExp('alter table public.mcp_oauth_'+name+' enable row level security','i'))
 assert.match(sql,/delete from public\.mcp_oauth_codes[\s\S]*returning/i)
 assert.match(sql,/update public\.mcp_oauth_grants[\s\S]*refresh_hash = p_refresh_hash[\s\S]*returning/i)
 assert.match(sql,/revoke all[\s\S]*from public, anon, authenticated/i)
 assert.match(sql,/pg_advisory_xact_lock/)
})
