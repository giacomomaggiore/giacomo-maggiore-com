import { NextResponse } from 'next/server'
import { getResend, getSiteOrigin, isValidEmail, isValidUnsubscribeSignature } from 'lib/newsletter'

// Marks the contact as unsubscribed in Resend if the signed link is valid
async function unsubscribe(req: Request): Promise<boolean> {
  const url = new URL(req.url)
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase()
  const ts = String(url.searchParams.get('ts') || '').trim()
  const sig = String(url.searchParams.get('sig') || '').trim()

  if (!isValidEmail(email) || !ts || !isValidUnsubscribeSignature(email, ts, sig)) return false

  const { error } = await getResend().contacts.update({ email, unsubscribed: true })
  return !error
}

// Link clicked from the welcome email
export async function GET(req: Request) {
  const ok = await unsubscribe(req)
  const backUrl = new URL(getSiteOrigin(req))
  backUrl.searchParams.set('unsubscribed', ok ? '1' : '0')
  return NextResponse.redirect(backUrl, 303)
}

// One-click unsubscribe (RFC 8058): the mail client POSTs to the List-Unsubscribe URL
export async function POST(req: Request) {
  return new Response(null, { status: (await unsubscribe(req)) ? 200 : 400 })
}
