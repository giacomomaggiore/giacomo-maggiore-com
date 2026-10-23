import { NextResponse } from 'next/server'
import {
  buildUnsubscribeUrl,
  getSiteOrigin,
  isValidConfirmToken,
  isValidEmail,
  sendWelcomeEmail,
  subscribeContact,
} from 'lib/newsletter'

// Signed link from the confirmation email: creates the contact, then sends the welcome email
export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase()
  const ts = String(url.searchParams.get('ts') || '').trim()
  const sig = String(url.searchParams.get('sig') || '').trim()

  const origin = getSiteOrigin(req)

  if (!isValidEmail(email) || !isValidConfirmToken(email, ts, sig)) {
    return NextResponse.redirect(new URL('/newsletter/expired', origin), 303)
  }

  try {
    const result = await subscribeContact(email)

    // The welcome email is best-effort: a failure must not undo the subscription
    if (result === 'created') {
      try {
        await sendWelcomeEmail(email, buildUnsubscribeUrl(origin, email))
      } catch (welcomeErr) {
        console.error('Welcome email error:', welcomeErr)
      }
    }
  } catch (err) {
    console.error('Newsletter confirm error:', err)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/newsletter/confirmed', origin), 303)
}
