import { NextResponse } from 'next/server'
import {
  getSiteOrigin,
  isValidConfirmToken,
  isValidEmail,
  subscribeContact,
} from 'lib/newsletter'

// Signed link from the confirmation email: creates or reactivates the contact
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
    await subscribeContact(email)
  } catch (err) {
    console.error('Newsletter confirm error:', err)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/newsletter/confirmed', origin), 303)
}
