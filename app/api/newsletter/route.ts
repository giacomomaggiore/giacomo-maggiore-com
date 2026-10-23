import { NextResponse } from 'next/server'
import {
  buildConfirmUrl,
  getSiteOrigin,
  isValidEmail,
  sendConfirmationEmail,
} from 'lib/newsletter'
import { getClientIp, rateLimit, tooManyRequests } from 'lib/rate-limit'
import { PRODUCTION_URL } from 'lib/site'

const MAX_SIGNUPS_PER_WINDOW = 5
const SIGNUP_WINDOW_MS = 10 * 60_000
const MAX_CONFIRMATIONS_PER_EMAIL = 3
const CONFIRMATION_WINDOW_MS = 60 * 60_000

// Origin of the page the visitor subscribed from (our own origins only)
function getBackOrigin(req: Request): string {
  const trustedOrigins = new Set([new URL(req.url).origin, PRODUCTION_URL, getSiteOrigin(req)])
  try {
    const referer = new URL(req.headers.get('referer') || '/', req.url)
    // A forged Referer pointing elsewhere must not turn this into an open redirect
    if (trustedOrigins.has(referer.origin)) return referer.origin
  } catch {
    // malformed Referer: fall through to the request origin
  }
  return new URL(req.url).origin
}

// Double opt-in: the contact is only created when the link in the confirmation email is
// opened (see ./confirm), so nobody can subscribe an address they don't control
export async function POST(req: Request) {
  const limit = rateLimit(`newsletter:${getClientIp(req)}`, MAX_SIGNUPS_PER_WINDOW, SIGNUP_WINDOW_MS)
  if (!limit.ok) return tooManyRequests(limit.retryAfterSec)

  try {
    const form = await req.formData()

    const email = String(form.get('email') || '').trim().toLowerCase()
    const consent = String(form.get('newsletter_consent') || '') === 'yes'
    const honeypot = String(form.get('website') || '')

    // Bots fill the hidden field: pretend success without subscribing them
    if (honeypot) {
      return NextResponse.redirect(new URL('/', req.url), 303)
    }

    if (!consent) {
      return NextResponse.json({ error: 'Consent required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Fail now rather than after the visitor clicked a link that can't complete
    if (!process.env.RESEND_AUDIENCE_ID) {
      return NextResponse.json({ error: 'Missing RESEND_AUDIENCE_ID' }, { status: 500 })
    }

    // Stops the form from flooding one inbox; it answers as if it worked so it reveals nothing
    const perEmail = rateLimit(`newsletter-email:${email}`, MAX_CONFIRMATIONS_PER_EMAIL, CONFIRMATION_WINDOW_MS)
    if (perEmail.ok) {
      try {
        await sendConfirmationEmail(email, buildConfirmUrl(getSiteOrigin(req), email))
      } catch (sendErr) {
        console.error('Confirmation email error:', sendErr)
        return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
      }
    }

    return NextResponse.redirect(new URL('/newsletter/check-inbox', getBackOrigin(req)), 303)
  } catch (err) {
    console.error('Newsletter error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
