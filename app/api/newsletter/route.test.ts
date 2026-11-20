import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { POST } from './route'
import { GET } from './confirm/route'

test('signup sends one confirmation email and confirming subscribes without another email', async (t) => {
  const env = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    NEWSLETTER_FROM_EMAIL: process.env.NEWSLETTER_FROM_EMAIL,
    NEWSLETTER_UNSUBSCRIBE_SECRET: process.env.NEWSLETTER_UNSUBSCRIBE_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }
  Object.assign(process.env, {
    RESEND_API_KEY: 'test-key',
    RESEND_AUDIENCE_ID: 'test-audience',
    NEWSLETTER_FROM_EMAIL: 'newsletter@example.com',
    NEWSLETTER_UNSUBSCRIBE_SECRET: 'test-secret',
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
  })
  t.after(() => {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  const requests: { url: string; method: string; body: string }[] = []
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), method: init?.method || 'GET', body: String(init?.body || '') })
    return Response.json({ id: 'test-id', object: 'contact' })
  })

  const form = new FormData()
  form.set('email', 'reader@example.com')
  form.set('newsletter_consent', 'yes')
  const signup = await POST(new Request('https://example.com/api/newsletter', { method: 'POST', body: form }))
  assert.equal(signup.status, 303)
  assert.equal(signup.headers.get('location'), 'https://example.com/newsletter/check-inbox')
  assert.equal(requests.length, 1)
  assert.ok(requests[0].url.endsWith('/emails'))
  const email = JSON.parse(requests[0].body)
  assert.equal(email.subject, 'Please confirm your subscription')
  const link = email.text.match(/https:\/\/example\.com\/api\/newsletter\/confirm\?[^\s]+/)?.[0]
  assert.ok(link)

  const confirmation = await GET(new Request(link))
  assert.equal(confirmation.status, 303)
  assert.equal(confirmation.headers.get('location'), 'https://example.com/newsletter/confirmed')
  assert.equal(requests.length, 2)
  assert.ok(requests[1].url.endsWith('/audiences/test-audience/contacts'))
  assert.equal(requests[1].method, 'POST')
  assert.deepEqual(JSON.parse(requests[1].body), { email: 'reader@example.com', unsubscribed: false })
})
