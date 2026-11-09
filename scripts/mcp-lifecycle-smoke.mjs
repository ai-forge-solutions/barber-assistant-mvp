// Opt-in real preview lifecycle smoke. Creates ONLY disposable appointments for a controlled test client.
// Temporarily enables the pre-existing controlled test shop, never carmona2 or Stripe; cleans exact generated IDs.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {parseEnv} from 'node:util'
import {randomBytes,randomUUID,createHash} from 'node:crypto'
import {createServerClient} from '@supabase/ssr'
import {createClient} from '@supabase/supabase-js'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {validateSupabaseUrl,cleanupLifecycle} from './lib/mcp-lifecycle-smoke-helpers.mjs'
assert.equal(process.env.MCP_LIFECYCLE_WRITE,'1','Explicitly opt in to disposable lifecycle fixtures')
assert.ok(process.env.MCP_SMOKE_ENV && process.env.MCP_SMOKE_ACCOUNTS)
Object.assign(process.env,parseEnv(await readFile(process.env.MCP_SMOKE_ENV,'utf8')))
const origin=process.env.MCP_SMOKE_ORIGIN
assert.equal(origin,'https://deploy-preview-33--barber-assitant.netlify.app','Only the reviewed PR preview is allowed')
validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const accounts=JSON.parse(await readFile(process.env.MCP_SMOKE_ACCOUNTS,'utf8'))
const account=accounts['1']
assert.equal(account.shopId,'8821e097-2825-44b3-abd2-ad7a27bcda9e','Only the existing controlled test shop')
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const sessions=[],oauthIds=[],sdkClients=[],proposalIds=[],appointmentIds=[]
const marker='Hermes lifecycle smoke '+randomUUID(),subscriptionId=randomUUID(),scheduleId=randomUUID()

const random=()=>randomBytes(32).toString('base64url')
const post=(path,data)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
async function authorize(a,scope){
 const cookies=new Map()
 const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:items=>items.forEach(c=>cookies.set(c.name,c.value))}})
 const login=await auth.auth.signInWithPassword({email:a.clientEmail,password:a.password});assert.ifError(login.error);assert.equal(login.data.user.id,a.clientId);sessions.push(auth)
 const registered=await post('/oauth/register',{client_name:marker,redirect_uris:['http://127.0.0.1:54325/callback']});assert.equal(registered.status,201)
 const {client_id}=await registered.json();oauthIds.push(client_id)
 const verifier=random(),state=random(),p=new URLSearchParams({client_id,redirect_uri:'http://127.0.0.1:54325/callback',response_type:'code',resource:origin+'/mcp',scope,state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'})
 const path='/oauth/authorize?'+p,cookie=()=>[...cookies].map(([k,v])=>k+'='+v).join('; ')
 const consent=await fetch(origin+path,{headers:{Cookie:cookie()},redirect:'manual'});assert.equal(consent.status,200,'Consent supports explicit cancellation scope')
 const nonce=(await consent.text()).match(/name="nonce" value="([^"]+)"/)?.[1];assert.ok(nonce)
 for(const h of consent.headers.getSetCookie()){const s=h.split(';')[0],i=s.indexOf('=');cookies.set(s.slice(0,i),s.slice(i+1))}
 const approved=await fetch(origin+path,{method:'POST',headers:{Origin:origin,Cookie:cookie()},body:new URLSearchParams({nonce,decision:'approve'}),redirect:'manual'});assert.equal(approved.status,303)
 const callback=new URL(approved.headers.get('location'));assert.equal(callback.searchParams.get('state'),state)
 const exchange=await fetch(origin+'/oauth/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',client_id,code_verifier:verifier,code:callback.searchParams.get('code'),redirect_uri:'http://127.0.0.1:54325/callback',resource:origin+'/mcp'})});assert.equal(exchange.status,200)
 const tokens=await exchange.json(),sdk=new Client({name:'hermes-lifecycle-smoke',version:'1'})
 await sdk.connect(new StreamableHTTPClientTransport(new URL(origin+'/mcp'),{requestInit:{headers:{Authorization:`Bearer ${tokens.access_token}`}}}));sdkClients.push(sdk)
 return {sdk,cookie}
}
async function call(sdk,name,args){const r=await sdk.callTool({name,arguments:args});assert.ok(!r.isError,'Tool failed: '+name);return JSON.parse(r.content.find(b=>b.type==='text').text)}
const columns='id,shop_id,barber_id,client_id,service_id,starts_at,ends_at,status,reminder_sent'
const baseline=await admin.from('appointments').select(columns).order('id');assert.ifError(baseline.error)
const originalIds=baseline.data.map(a=>a.id),fingerprint=rows=>createHash('sha256').update(JSON.stringify(rows)).digest('hex')
let lifecycleError
try{
 const first=await authorize(account,'bookings:read bookings:write bookings:cancel')
 const second=await authorize(accounts['2'],'bookings:read bookings:cancel')
 assert.ok((await first.sdk.listTools()).tools.some(t=>t.name==='cancel_booking'))
 const existing=await admin.from('shop_subscriptions').select('id').eq('shop_id',account.shopId);assert.ifError(existing.error);assert.equal(existing.data.length,0,'Never overwrite an existing entitlement')
 const sub=await admin.from('shop_subscriptions').insert({id:subscriptionId,shop_id:account.shopId,plan_key:'premium',status:'active',current_period_end:new Date(Date.now()+3600000).toISOString()});assert.ifError(sub.error)
 const schedules=await admin.from('schedules').select('id').eq('barber_id',account.barberId);assert.ifError(schedules.error);assert.equal(schedules.data.length,0,'Never overwrite existing schedules')
 const sc=await admin.from('schedules').insert({id:scheduleId,barber_id:account.barberId,day_of_week:new Date('2028-07-12T12:00:00Z').getUTCDay(),start_time:'09:00',end_time:'17:00'});assert.ifError(sc.error)
 const service=await admin.from('services').select('id').eq('shop_id',account.shopId).eq('is_active',true).limit(1).single();assert.ifError(service.error)
 const selection={shopId:account.shopId,barberId:account.barberId,serviceId:service.data.id}
 let available,date
 for(let i=0;i<14;i++){
  date=new Date(Date.UTC(2028,6,12+i)).toISOString().slice(0,10)
  const a=await call(first.sdk,'get_availability',{...selection,date})
  if(a.slots?.length){available=a;break}
 }
 assert.ok(available?.slots.length,'Controlled shop must have a future available slot')
 const startsAt=available.slots[0].startsAt
 const proposal=await call(first.sdk,'prepare_booking',{...selection,startsAt});proposalIds.push(proposal.proposalId)
 assert.equal((await first.sdk.callTool({name:'confirm_booking',arguments:{proposalId:proposal.proposalId}})).isError,true)
 const booking=await call(first.sdk,'confirm_booking',{proposalId:proposal.proposalId,confirmed:true});appointmentIds.push(booking.id)
 assert.equal(booking.status,'confirmed','New booking must not await barber acceptance')
 assert.equal((await call(first.sdk,'confirm_booking',{proposalId:proposal.proposalId,confirmed:true})).id,booking.id)
 const persisted=await admin.from('appointments').select('status,client_id').eq('id',booking.id).single();assert.ifError(persisted.error);assert.equal(persisted.data.status,'confirmed');assert.equal(persisted.data.client_id,account.clientId)
 const web=await fetch(origin+'/api/appointments?clientId='+account.clientId,{headers:{Cookie:first.cookie()}});assert.equal(web.status,200)
 const webData=await web.json(),webRows=Array.isArray(webData)?webData:webData.appointments
 assert.equal(webRows.find(a=>a.id===booking.id)?.status,'confirmed','Web Mis citas sees the same confirmed record')
 assert.equal((await second.sdk.callTool({name:'cancel_booking',arguments:{appointmentId:booking.id,confirmed:true}})).isError,true,'Other principal cannot cancel even with cancellation scope')
 assert.equal((await admin.from('appointments').select('status').eq('id',booking.id).single()).data.status,'confirmed')
 console.log('PASS: real MCP booking is immediately confirmed, retry is idempotent, and web sees persisted confirmation')
 assert.equal((await first.sdk.callTool({name:'cancel_booking',arguments:{appointmentId:booking.id,confirmed:true,userId:accounts['2'].clientId}})).isError,true)
 assert.equal((await first.sdk.callTool({name:'cancel_booking',arguments:{appointmentId:booking.id}})).isError,true)
 const cancelled=await call(first.sdk,'cancel_booking',{appointmentId:booking.id,confirmed:true});assert.equal(cancelled.id,booking.id);assert.equal(cancelled.status,'cancelled')
 assert.deepEqual(await call(first.sdk,'cancel_booking',{appointmentId:booking.id,confirmed:true}),cancelled)
 assert.equal((await admin.from('appointments').select('status').eq('id',booking.id).single()).data.status,'cancelled')
 const my=await call(first.sdk,'list_my_appointments',{});assert.equal(my.appointments.find(a=>a.id===booking.id)?.status,'cancelled')
 const released=await call(first.sdk,'get_availability',{...selection,date});assert.ok(released.slots.some(s=>Date.parse(s.startsAt)===Date.parse(startsAt)))
 console.log('PASS: cancellation requires explicit confirmation, denies cross-user/identity injection, persists cancelled, and releases slot')
}catch(error){
 lifecycleError=error
}finally{
 try{
  await cleanupLifecycle({admin,account,proposalIds,appointmentIds,originalIds,subscriptionId,scheduleId,sdkClients,oauthIds,marker,sessions,columns,baseline,fingerprint})
 }catch(error){
  if(lifecycleError)throw new AggregateError([lifecycleError,error],'Lifecycle and cleanup failed')
  throw error
 }
 console.log(`CLEANUP: only generated fixture IDs removed; ${originalIds.length} original appointments unchanged; no temporary entitlement remains`)
}
if(lifecycleError)throw lifecycleError
