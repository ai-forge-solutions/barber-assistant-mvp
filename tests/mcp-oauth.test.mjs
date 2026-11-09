import test from 'node:test'
import assert from 'node:assert/strict'
const core = await import('../lib/mcp/oauth-core.ts')
test('DCR accepts public HTTPS and loopback clients only, bounds metadata', () => {
  assert.equal(typeof core.validateRegistration, 'function')
  const valid = { client_name: 'Mi asistente', redirect_uris: ['https://client.example/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }
  assert.deepEqual(core.validateRegistration(valid).redirect_uris, valid.redirect_uris)
  for (const uri of ['javascript:alert(1)', 'http://evil.example/cb', 'https://user:pass@x.example/cb', 'https://x.example/cb#fragment', '//evil.example', 'http://127.0.0.2/cb']) assert.throws(() => core.validateRegistration({...valid, redirect_uris:[uri]}))
  for (const uri of ['http://localhost:1234/cb','http://127.0.0.1:1234/cb','http://[::1]:1234/cb']) assert.doesNotThrow(() => core.validateRegistration({...valid, redirect_uris:[uri]}))
  assert.throws(() => core.validateRegistration({...valid, token_endpoint_auth_method:'client_secret_basic'}))
  assert.throws(() => core.validateRegistration({...valid, grant_types:['implicit']}))
  assert.throws(() => core.validateRegistration({...valid, response_types:['token']}))
  assert.throws(() => core.validateRegistration({...valid, client_name:'x'.repeat(121)}))
})

test('authorization binds exact client redirect, S256, scope and resource', () => {
  const p = new URLSearchParams({response_type:'code',client_id:'abc',redirect_uri:'https://client.example/cb',code_challenge:'A'.repeat(43),code_challenge_method:'S256',resource:'https://trujas.example/mcp',state:'opaque'})
  const client = {client_id:'abc',redirect_uris:['https://client.example/cb']}
  assert.equal(core.validateAuthorization(p,client,'https://trujas.example/mcp').scope, core.SCOPES.join(' '))
  for (const [key,value] of [['redirect_uri','https://evil.example'],['code_challenge_method','plain'],['resource','https://other.example/mcp'],['scope','admin'],['response_type','token'],['code_challenge','short'],['client_id','other']]) {
    const bad = new URLSearchParams(p); bad.set(key,value); assert.throws(() => core.validateAuthorization(bad,client,'https://trujas.example/mcp'))
  }
  const duplicate=new URLSearchParams(p); duplicate.append('resource',p.get('resource')); assert.throws(()=>core.validateAuthorization(duplicate,client,p.get('resource')))
})
test('PKCE uses RFC7636 S256 and rejects malformed verifier', () => {
  assert.equal(core.pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  assert.throws(()=>core.pkceChallenge('short'))
  assert.notEqual(core.hashToken(core.opaqueToken()),core.hashToken(core.opaqueToken()))
})
test('CSRF binds nonce to user and full consent parameters; origin required', () => {
  const p = new URLSearchParams({client_id:'a',scope:'bookings:read'})
  const nonce=core.opaqueToken(); const cookie=core.consentBinding(nonce,p,'user1')
  assert.equal(core.checkConsent('https://app.example','https://app.example',cookie,nonce,p,'user1'),true)
  assert.equal(core.checkConsent('https://evil.example','https://app.example',cookie,nonce,p,'user1'),false)
  assert.equal(core.checkConsent(null,'https://app.example',cookie,nonce,p,'user1'),false)
  assert.equal(core.checkConsent('https://app.example','https://app.example',cookie,nonce,p,'user2'),false)
  p.set('scope','bookings:write'); assert.equal(core.checkConsent('https://app.example','https://app.example',cookie,nonce,p,'user1'),false)
})
test('access validation rejects wrong audience, expiry, revocation and malformed tokens', () => {
  const now=Date.now(); const g={id:'g',user_id:'u',resource:'https://app.example/mcp',scope:'bookings:read',access_expires_at:new Date(now+3600000).toISOString(),revoked_at:null}
  assert.deepEqual(core.validateGrant(g,g.resource,now),{userId:'u',grantId:'g',scope:'bookings:read'})
  for (const bad of [{...g,revoked_at:new Date().toISOString()},{...g,access_expires_at:new Date(now).toISOString()},{...g,access_expires_at:'bad'}]) assert.equal(core.validateGrant(bad,g.resource,now),null)
  assert.equal(core.validateGrant(g,'https://evil.example/mcp',now),null)
  assert.equal(core.bearerToken('Bearer '+core.opaqueToken()).length,43)
  assert.equal(core.bearerToken('Bearer supabase.jwt.value'),null)
})
test('registration rate limiter is bounded and fails closed above cap', () => {
  const limiter=core.createRegistrationLimiter(2,1000,2)
  assert.equal(limiter('a',0),true); assert.equal(limiter('a',1),true); assert.equal(limiter('a',2),false)
  assert.equal(limiter('b',2),true); assert.equal(limiter('c',2),false); assert.equal(limiter('c',1001),true)
})
