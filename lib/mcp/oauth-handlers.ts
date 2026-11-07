import type { SupabaseClient } from '@supabase/supabase-js'
import { OAuthError, SCOPES, checkConsent, consentBinding, createRegistrationLimiter, hashToken, opaqueToken, pkceChallenge, resourceFor, validateAuthorization, validateRegistration } from './oauth-core'

export type OAuthDependencies = {
  db: () => SupabaseClient
  user: () => Promise<{id:string;email?:string} | null>
}
export const secureHeaders = {'Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer'}
export const json = (body: unknown, status = 200) => Response.json(body,{status,headers:{...secureHeaders,'Access-Control-Allow-Origin':'*'}})
export const preflight = () => new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}})
export function failure(e: unknown) { return json({error:e instanceof OAuthError ? e.error : 'server_error'},e instanceof OAuthError ? e.status : 503) }
export function authorizationMetadata(r: Request) {
  const issuer=new URL(r.url).origin
  return {issuer,authorization_endpoint:issuer+'/oauth/authorize',token_endpoint:issuer+'/oauth/token',registration_endpoint:issuer+'/oauth/register',revocation_endpoint:issuer+'/oauth/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],token_endpoint_auth_methods_supported:['none'],revocation_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:SCOPES,resource_indicators_supported:true}
}
export function resourceMetadata(r: Request) { return {resource:resourceFor(r),authorization_servers:[new URL(r.url).origin],scopes_supported:SCOPES,bearer_methods_supported:['header'],resource_name:'trujas — reservas'} }
async function boundedBody(r: Request, max = 16384) {
  if (Number(r.headers.get('content-length')) > max) throw new OAuthError('invalid_request',413)
  const reader=r.body?.getReader(); if (!reader) throw new OAuthError('invalid_request')
  const chunks: Uint8Array[]=[]; let size=0
  try { while(true) {const {value,done}=await reader.read(); if(done) break; size+=value.byteLength; if(size>max) {await reader.cancel();throw new OAuthError('invalid_request',413)} chunks.push(value)} }
  finally {reader.releaseLock()}
  return Buffer.concat(chunks).toString('utf8')
}
async function form(r: Request) {
  if (r.headers.get('content-type')?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') throw new OAuthError('invalid_request',415)
  const p=new URLSearchParams(await boundedBody(r))
  for(const key of new Set(p.keys())) if(p.getAll(key).length!==1) throw new OAuthError('invalid_request')
  return p
}
const registrationLimit=createRegistrationLimiter()
const globalRegistrationLimit=createRegistrationLimiter(200,3600000,1)
export async function register(r: Request,d: OAuthDependencies) {
  try {
    // Netlify overwrites this platform header; never use caller-controlled X-Forwarded-For for trust.
    const ip=r.headers.get('x-nf-client-connection-ip') || 'unknown'
    if(!registrationLimit(hashToken(ip)) || !globalRegistrationLimit('global')) throw new OAuthError('slow_down',429)
    if(r.headers.get('content-type')?.split(';')[0].trim()!=='application/json') throw new OAuthError('invalid_request',415)
    let input:unknown; try {input=JSON.parse(await boundedBody(r))}catch(e){if(e instanceof OAuthError)throw e;throw new OAuthError('invalid_client_metadata')}
    const client=validateRegistration(input),clientId=opaqueToken()
    const {data,error}=await d.db().rpc('mcp_oauth_register_client',{p_client_id:clientId,p_client_name:client.client_name,p_redirect_uris:client.redirect_uris})
    if(error) throw Error('storage')
    if(!data) throw new OAuthError('slow_down',429)
    return json({...client,client_id:clientId,client_id_issued_at:Math.floor(Date.now()/1000),token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']},201)
  }catch(e){return failure(e)}
}
export async function token(r: Request,d: OAuthDependencies) {
  try {
    const p=await form(r)
    if(r.headers.has('authorization') || p.has('client_secret') || !p.get('client_id') || p.get('client_id')!.length>128) throw new OAuthError('invalid_client')
    if(p.get('resource')!==resourceFor(r)) throw new OAuthError('invalid_target')
    const access=opaqueToken(),refresh=opaqueToken()
    const args={p_client_id:p.get('client_id')!,p_resource:resourceFor(r),p_access_hash:hashToken(access),p_new_refresh_hash:hashToken(refresh)}
    let result
    if(p.get('grant_type')==='authorization_code') {
      if(!/^[A-Za-z0-9_-]{43}$/.test(p.get('code') || '') || !p.get('redirect_uri')) throw new OAuthError('invalid_grant')
      result=await d.db().rpc('mcp_oauth_exchange_code',{...args,p_code_hash:hashToken(p.get('code')!),p_redirect_uri:p.get('redirect_uri')!,p_challenge:pkceChallenge(p.get('code_verifier') || '')})
    } else if(p.get('grant_type')==='refresh_token') {
      if(!/^[A-Za-z0-9_-]{43}$/.test(p.get('refresh_token') || '') || p.has('scope')) throw new OAuthError('invalid_grant')
      result=await d.db().rpc('mcp_oauth_rotate_refresh',{...args,p_refresh_hash:hashToken(p.get('refresh_token')!)})
    } else throw new OAuthError('unsupported_grant_type')
    if(result.error) throw Error('storage')
    const grant=Array.isArray(result.data)?result.data[0]:null
    if(!grant) throw new OAuthError('invalid_grant')
    return json({access_token:access,token_type:'Bearer',expires_in:3600,refresh_token:refresh,scope:grant.scope})
  }catch(e){return failure(e)}
}
export async function revoke(r: Request,d: OAuthDependencies) {
  try {
    const p=await form(r)
    if(r.headers.has('authorization') || p.has('client_secret') || !p.get('client_id') || p.get('client_id')!.length>128) throw new OAuthError('invalid_client')
    const value=p.get('token') || ''
    if(/^[A-Za-z0-9_-]{43}$/.test(value)) {
      const hash=hashToken(value)
      const {error}=await d.db().from('mcp_oauth_grants').update({revoked_at:new Date().toISOString()}).eq('client_id',p.get('client_id')!).eq('resource',resourceFor(r)).or(`access_hash.eq.${hash},refresh_hash.eq.${hash}`)
      if(error) throw Error('storage')
    }
    return json({})
  }catch(e){return failure(e)}
}
function clientName(relation: {client_name:string} | {client_name:string}[] | null, fallback:string) {
  return (Array.isArray(relation) ? relation[0] : relation)?.client_name || fallback
}
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const cookieName=(r:Request)=>new URL(r.url).protocol==='https:'?'__Host-trujas-oauth-consent':'trujas-oauth-consent'
function nonceCookie(r:Request,binding:string,age=600) {return `${cookieName(r)}=${binding}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(r.url).protocol==='https:'?'; Secure':''}`}
function cookieValue(r:Request) {return r.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(r)+'='))?.slice(cookieName(r).length+1)}
function html(body:string,extra:Record<string,string>={},formRedirect?:string) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar con trujas</title><style>@import url('https://fonts.googleapis.com/css2?family=Rye&family=Oswald:wght@600;700&family=DM+Sans:wght@400;500&display=swap');*{box-sizing:border-box}body{margin:0;background:#FFFFFF;color:#111111;font:400 16px 'DM Sans'}header{background:#111111;color:#FFFFFF;padding:20px;font:24px 'Rye'}.stripe{height:6px;background:repeating-linear-gradient(90deg,#C8102E 0%,#C8102E 33.3%,#FFFFFF 33.3%,#FFFFFF 66.6%,#1A3A6B 66.6%,#1A3A6B 100%)}main{max-width:512px;margin:40px auto;padding:20px}h1,h2,button{font-family:'Oswald';font-weight:600}h1{font-size:32px}p,li{line-height:1.6}small{color:#555555;overflow-wrap:anywhere}section{border:1px solid #E5E5E5;border-left:4px solid #1A3A6B;padding:20px;margin:24px 0}button{min-height:44px;padding:12px 24px;letter-spacing:.08em;text-transform:uppercase;border:2px solid #111111;border-radius:2px;background:#FFFFFF;color:#111111;margin:8px 8px 0 0;font-size:14px;cursor:pointer}button.primary{background:#C8102E;color:#FFFFFF;border-color:#C8102E}button:focus-visible{outline:3px solid #1A3A6B;outline-offset:3px}</style></head><body><header>trujas</header><div class="stripe"></div><main>${body}</main></body></html>`,{headers:{...secureHeaders,'Referrer-Policy':'same-origin','Content-Type':'text/html; charset=utf-8','X-Frame-Options':'DENY','Content-Security-Policy':`default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; form-action 'self'${formRedirect ? ' '+new URL(formRedirect).origin : ''}; frame-ancestors 'none'; base-uri 'none'`,...extra}})
}
export async function authorize(r:Request,d:OAuthDependencies) {
  try {
    const url=new URL(r.url)
    if(url.search.length>8192) throw new OAuthError('invalid_request')
    const p=url.searchParams
    const {data:client,error}=await d.db().from('mcp_oauth_clients').select('client_id,client_name,redirect_uris').eq('client_id',p.get('client_id') || '').maybeSingle()
    if(error) throw Error('storage')
    if(!client) throw new OAuthError('invalid_client')
    const auth=validateAuthorization(p,client,resourceFor(r))
    const user=await d.user()
    if(!user) {
      if(r.method==='POST') throw new OAuthError('login_required',401)
      const login=new URL('/auth/client',url.origin);login.searchParams.set('next',url.pathname+url.search)
      return new Response(null,{status:303,headers:{...secureHeaders,Location:login.toString()}})
    }
    if(r.method==='GET') {
      const nonce=opaqueToken()
      const labels:Record<string,string>={'bookings:read':'Consultar tus citas y disponibilidad','bookings:write':'Solo crear citas (no permite cambiarlas ni cancelarlas)','preferences:write':'Cambiar tus preferencias de reserva'}
      return html(`<h1>Conecta tu asistente</h1><p><strong>${escapeHtml(client.client_name)}</strong> quiere acceder a tu cuenta de trujas.</p><small>Cuenta: ${escapeHtml(user.email || user.id)}<br>Destino: ${escapeHtml(auth.redirect_uri)}</small><section><h2>Permisos que autorizas</h2><ul>${auth.scope.split(' ').map(s=>`<li>${labels[s]}</li>`).join('')}</ul></section><p>Solo accederá a tus datos. No compartiremos tu contraseña ni tu sesión de trujas. La conexión seguirá activa hasta que la revoques o caduque.</p><form method="post" action="${escapeHtml(url.pathname+url.search)}"><input type="hidden" name="nonce" value="${nonce}"><button class="primary" name="decision" value="approve">Autorizar conexión</button><button name="decision" value="deny">Cancelar</button></form><p><a href="/oauth/connections">Gestionar conexiones</a></p>`,{'Set-Cookie':nonceCookie(r,consentBinding(nonce,p,user.id))},auth.redirect_uri)
    }
    const f=await form(r)
    if(!checkConsent(r.headers.get('origin'),url.origin,cookieValue(r),f.get('nonce') || '',p,user.id)) throw new OAuthError('invalid_request',403)
    const redirect=new URL(auth.redirect_uri)
    const state=p.get('state');if(state!==null)redirect.searchParams.set('state',state)
    if(f.get('decision')==='deny') redirect.searchParams.set('error','access_denied')
    else if(f.get('decision')==='approve') {
      const code=opaqueToken()
      const {error:insertError}=await d.db().from('mcp_oauth_codes').insert({...auth,user_id:user.id,code_hash:hashToken(code),expires_at:new Date(Date.now()+300000).toISOString()})
      if(insertError) throw Error('storage')
      redirect.searchParams.set('code',code)
    } else throw new OAuthError('invalid_request')
    return new Response(null,{status:303,headers:{...secureHeaders,Location:redirect.toString(),'Set-Cookie':nonceCookie(r,'',0)}})
  }catch(e){return failure(e)}
}
export async function connections(r:Request,d:OAuthDependencies) {
  try {
    const url=new URL(r.url),user=await d.user()
    if(!user) {const login=new URL('/auth/client',url.origin);login.searchParams.set('next','/oauth/connections');return new Response(null,{status:303,headers:{...secureHeaders,Location:login.toString()}})}
    const binding=new URLSearchParams({action:'revoke-connections'})
    if(r.method==='POST') {
      const f=await form(r)
      if(!checkConsent(r.headers.get('origin'),url.origin,cookieValue(r),f.get('nonce') || '',binding,user.id)) throw new OAuthError('invalid_request',403)
      const id=f.get('grant_id') || ''
      if(id!=='all' && !/^[a-f0-9-]{36}$/i.test(id)) throw new OAuthError('invalid_request')
      let query=d.db().from('mcp_oauth_grants').update({revoked_at:new Date().toISOString()}).eq('user_id',user.id)
      if(id!=='all')query=query.eq('id',id)
      const {error}=await query
      if(error)throw Error('storage')
      // Clear unused authorization codes as well when revoking every connection.
      if(id==='all') {const {error:codeError}=await d.db().from('mcp_oauth_codes').delete().eq('user_id',user.id);if(codeError)throw Error('storage')}
      return new Response(null,{status:303,headers:{...secureHeaders,Location:'/oauth/connections','Set-Cookie':nonceCookie(r,'',0)}})
    }
    const {data,error}=await d.db().from('mcp_oauth_grants').select('id,client_id,scope,refresh_expires_at,mcp_oauth_clients(client_name)').eq('user_id',user.id).is('revoked_at',null).gt('refresh_expires_at',new Date().toISOString()).limit(100)
    if(error)throw Error('storage')
    const nonce=opaqueToken()
    return html(`<h1>Tus conexiones</h1><p>Revoca el acceso de tus asistentes. Cerrar sesión en trujas no desconecta tus asistentes: revócalos aquí cuando lo necesites.</p>${(data || []).map(g=>`<section><h2>${escapeHtml(clientName(g.mcp_oauth_clients,g.client_id))}</h2><p>${escapeHtml(g.scope)}</p><form method="post"><input type="hidden" name="nonce" value="${nonce}"><button name="grant_id" value="${escapeHtml(g.id)}">Revocar conexión</button></form></section>`).join('') || '<p>No tienes conexiones activas.</p>'}<form method="post"><input type="hidden" name="nonce" value="${nonce}"><button class="primary" name="grant_id" value="all">Revocar todas las conexiones</button></form>`,{'Set-Cookie':nonceCookie(r,consentBinding(nonce,binding,user.id))})
  }catch(e){return failure(e)}
}
