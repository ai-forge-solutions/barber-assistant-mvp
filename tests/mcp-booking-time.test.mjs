import { test } from 'node:test'
import assert from 'node:assert/strict'
const time = await import('../lib/mcp/time.ts').catch(() => ({}))

test('fecha real y offset explícito; no normaliza entradas inválidas', () => {
  assert.equal(typeof time.parseInstant, 'function')
  assert.equal(time.parseInstant('2027-02-28T10:00:00+02:00'), '2027-02-28T08:00:00.000Z')
  for (const value of ['2027-02-30T10:00:00Z', '2027-02-28T10:00:00', '2027-02-28T10:00:00+25:00', '2027-02-28T24:00:00Z']) {
    assert.throws(() => time.parseInstant(value), /invalid/i)
  }
  assert.equal(time.validDate('2028-02-29'), '2028-02-29')
  assert.throws(() => time.validDate('2027-02-29'), /invalid/i)
})

test('horarios de Madrid: UTC real, huecos y doble hora DST se descartan', () => {
  assert.equal(typeof time.localInstant, 'function')
  assert.equal(time.localInstant('2027-07-12', '10:00:00', 'Europe/Madrid'), '2027-07-12T08:00:00.000Z')
  assert.equal(time.localInstant('2027-03-28', '02:30:00', 'Europe/Madrid'), null)
  assert.equal(time.localInstant('2027-10-31', '02:30:00', 'Europe/Madrid'), null)
  assert.throws(() => time.localInstant('2027-07-12', '10:00:00', 'invalid'), /time zone/i)
})
