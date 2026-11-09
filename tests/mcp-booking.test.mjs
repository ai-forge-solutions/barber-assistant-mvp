import { test } from 'node:test'
import assert from 'node:assert/strict'
const booking = await import('../lib/mcp/booking.ts').catch(() => ({}))
const user = '00000000-0000-4000-8000-000000000001'
const input = { shopId:user, barberId:user, serviceId:user }

test('adaptadores envían identidad y audiencia del servidor exclusivamente a RPCs', async () => {
  assert.equal(typeof booking.createBookingServices,'function')
  const calls = []
  const services = booking.createBookingServices({ rpc: async (name,args) => { calls.push([name,args]); return {data:{ok:true},error:null} } })
  await services.availabilityFor(user,{...input,date:'2028-07-14'})
  await services.proposeBooking(user,{...input,startsAt:'2028-07-14T10:00:00+02:00',userId:'attacker'},'https://test/mcp')
  await services.confirmBooking(user,user,'https://test/mcp')
  assert.deepEqual(calls.map(c=>c[0]),['mcp_booking_availability','mcp_prepare_booking','mcp_confirm_booking'])
  assert.equal(calls[1][1].p_user,user)
  assert.equal(calls[1][1].p_start,'2028-07-14T08:00:00.000Z')
  assert.equal(calls[1][1].p_resource,'https://test/mcp')
  assert.equal(calls[2][1].p_proposal,user)
  assert.equal(typeof booking.availabilityFor,'function')
  assert.equal(typeof booking.proposeBooking,'function')
  assert.equal(typeof booking.confirmBooking,'function')
})

test('cancellation adapter sends only validated identity, appointment and audience', async () => {
  const calls=[]
  const services=booking.createBookingServices({rpc:async(name,args)=>{calls.push([name,args]);return {data:{status:'cancelled'},error:null}}})
  assert.equal(typeof services.cancelBooking,'function')
  await services.cancelBooking(user,user,'https://test/mcp')
  assert.deepEqual(calls,[['mcp_cancel_booking',{p_user:user,p_appointment:user,p_resource:'https://test/mcp'}]])
  for(const args of [['invalid',user,'https://test/mcp'],[user,'bad','https://test/mcp'],[user,user,'']]) await assert.rejects(services.cancelBooking(...args),/invalid/i)
  assert.equal(calls.length,1)
  assert.equal(typeof booking.cancelBooking,'function')
})

test('entrada inválida y fallos SQL cierran el paso sin filtrar detalles internos', async () => {
  assert.equal(typeof booking.createBookingServices,'function')
  let calls = 0
  const services = booking.createBookingServices({ rpc: async () => { calls++; return {data:null,error:{message:'SECRET INTERNAL SQL'}} } })
  await assert.rejects(services.availabilityFor(user,{...input,date:'2028-02-30'}),/invalid/i)
  await assert.rejects(services.proposeBooking(user,{...input,startsAt:'2028-07-14T10:00:00'},'https://test/mcp'),/invalid/i)
  await assert.rejects(services.confirmBooking(user,user,''),/invalid/i)
  assert.equal(calls,0)
  await assert.rejects(services.confirmBooking(user,user,'https://test/mcp'),error => !error.message.includes('SECRET'))
})
