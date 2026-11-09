import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('home links to the real team and labels interfaces as examples', () => {
  assert.ok(home().includes('href="/sobre-nosotros"'), 'Missing About link')
  assert.ok(home().includes('<WhatsappExample />'), 'Use the fictional conversation, not the stock Pablo avatar')
  assert.ok(home().includes('<ExampleMockup'), 'Label interface examples')
  assert.ok(home().includes('<JsonLd data={organizationSchema} />'), 'Publish organization schema')
  assert.ok(home().includes('<TrustComparison />'), 'Use the sourced-own-offer comparison')
})

test('home does not suggest all subscriptions are commitment-free', () => {
  assert.ok(!home().includes('Sin compromiso. Tu primer mes es gratis.'), 'Limit cancellation promise to the trial')
})

const home = () => readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')

test('sitemap explicitly includes the approved About route without inventing dates', () => {
  const source = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
  assert.ok(source.includes("'/sobre-nosotros'"))
  assert.ok(!source.includes('new Date('))
})

test('home does not assign unverifiable prices or universal limitations to competitors', () => {
  assert.doesNotMatch(home(), /400[–-]500|Apps genéricas|Cadenas, salones/)
  assert.ok(home().includes('<TrustComparison />'), 'Render the tested, plan-backed comparison')
})
