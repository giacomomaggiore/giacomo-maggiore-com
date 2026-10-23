import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAMED_EMAIL_REGEX = /^.+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/
const MAX_EMAIL_LENGTH = 254
const REPLY_TO = 'giaco.maggiore@gmail.com'

// Created on first use so builds and unrelated routes don't need RESEND_API_KEY
let resend: Resend | null = null
export function getResend(): Resend {
  resend ??= new Resend(process.env.RESEND_API_KEY)
  return resend
}

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(email)
}

// Origin used in links we send out and in redirects after subscribe/unsubscribe
export function getSiteOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
}

// --- Signed links: HMAC-signed so only links we sent can confirm or unsubscribe an address ---

const CONFIRM_TTL_MS = 48 * 60 * 60_000
const CLOCK_SKEW_MS = 5 * 60_000

type TokenPurpose = 'confirm' | 'unsubscribe'

function signToken(purpose: TokenPurpose, email: string, ts: string): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY
  // An empty secret would make signatures forgeable, so refuse to sign
  if (!secret) throw new Error('Missing NEWSLETTER_UNSUBSCRIBE_SECRET')
  // Unsubscribe keeps its original payload so links already sent still work. The confirm
  // payload uses newlines, which an email can't contain, so the two can never collide.
  const payload = purpose === 'confirm' ? `confirm\n${email}\n${ts}` : `${email}:${ts}`
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function isValidSignature(purpose: TokenPurpose, email: string, ts: string, sig: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(sig)) return false
  try {
    const expected = Buffer.from(signToken(purpose, email, ts), 'hex')
    return timingSafeEqual(expected, Buffer.from(sig, 'hex'))
  } catch {
    return false
  }
}

function buildSignedUrl(origin: string, pathname: string, purpose: TokenPurpose, email: string): string {
  const ts = String(Date.now())
  const url = new URL(pathname, origin)
  url.searchParams.set('email', email)
  url.searchParams.set('ts', ts)
  url.searchParams.set('sig', signToken(purpose, email, ts))
  return url.toString()
}

export function isValidUnsubscribeSignature(email: string, ts: string, sig: string): boolean {
  return isValidSignature('unsubscribe', email, ts, sig)
}

export function buildUnsubscribeUrl(origin: string, email: string): string {
  return buildSignedUrl(origin, '/api/newsletter/unsubscribe', 'unsubscribe', email)
}

// Confirmation links also expire, unlike unsubscribe links which must work forever
export function isValidConfirmToken(email: string, ts: string, sig: string): boolean {
  if (!/^\d{1,15}$/.test(ts)) return false
  const age = Date.now() - Number(ts)
  if (age > CONFIRM_TTL_MS || age < -CLOCK_SKEW_MS) return false
  return isValidSignature('confirm', email, ts, sig)
}

export function buildConfirmUrl(origin: string, email: string): string {
  return buildSignedUrl(origin, '/api/newsletter/confirm', 'confirm', email)
}

// --- Contacts ---

// Adds the address to the audience, or switches it back on if it had unsubscribed
export async function subscribeContact(email: string): Promise<'created' | 'existing'> {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) throw new Error('Missing RESEND_AUDIENCE_ID')

  const { error } = await getResend().contacts.create({ audienceId, email, unsubscribed: false })
  if (!error) return 'created'

  // Resend reports an existing contact as an error
  if (!String(error.message || '').toLowerCase().includes('already')) {
    throw new Error(error.message || 'Failed to create contact')
  }

  // An earlier unsubscribe must not survive a fresh, confirmed signup
  const { error: updateError } = await getResend().contacts.update({ email, unsubscribed: false })
  if (updateError) throw new Error(updateError.message || 'Failed to update contact')
  return 'existing'
}

// --- Emails ---

// Accept values with accidental wrapping quotes/spaces from env providers
function normalizeFromAddress(rawFrom: string): string | null {
  const from = rawFrom.trim().replace(/^['"]|['"]$/g, '')
  return EMAIL_REGEX.test(from) || NAMED_EMAIL_REGEX.test(from) ? from : null
}

function getFromAddress(): string {
  const rawFrom = process.env.NEWSLETTER_FROM_EMAIL
  if (!rawFrom) throw new Error('Missing NEWSLETTER_FROM_EMAIL')
  const from = normalizeFromAddress(rawFrom)
  if (!from) throw new Error('Invalid NEWSLETTER_FROM_EMAIL format')
  return from
}

// URLs go into an href, where a bare & is invalid HTML
const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// Both emails carry a plain-text part: spam filters expect a text alternative to the HTML
export async function sendConfirmationEmail(email: string, confirmUrl: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from: getFromAddress(),
    to: email,
    subject: 'Please confirm your subscription',
    replyTo: REPLY_TO,
    html: `
      <p>Hi, thanks for signing up to my newsletter.</p>
      <p>To start receiving it, please confirm your email address by clicking <a href="${escapeAttr(confirmUrl)}">this link</a>. It works for 48 hours.</p>
      <p>If you didn't sign up, just ignore this email and nothing will happen. Questions? Reply to this email.</p>

      <p>Best,<br/>Giacomo</p>
    `,
    text: [
      'Hi, thanks for signing up to my newsletter.',
      '',
      'To start receiving it, please confirm your email address by opening this link (it works for 48 hours):',
      confirmUrl,
      '',
      "If you didn't sign up, just ignore this email and nothing will happen. Questions? Reply to this email.",
      '',
      'Best,',
      'Giacomo',
    ].join('\n'),
  })

  if (error) {
    throw new Error(error.message || 'Failed to send confirmation email')
  }
}

export async function sendWelcomeEmail(email: string, unsubscribeUrl: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from: getFromAddress(),
    to: email,
    subject: 'See you in the next one, ciao!',
    replyTo: REPLY_TO,
    // Lets mail clients show a native unsubscribe button (RFC 8058 one-click)
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: `
      <p>Thanks for confirming, you're on the list. I'll only write when there's something new worth sharing, about one email a month.</p>
      <p>If you ever change your mind, you can unsubscribe anytime by clicking <a href="${escapeAttr(unsubscribeUrl)}">here</a>.</p>

      <p>Best,<br/>Giacomo</p>
    `,
    text: [
      "Thanks for confirming, you're on the list. I'll only write when there's something new worth sharing, about one email a month.",
      '',
      'If you ever change your mind, you can unsubscribe anytime here:',
      unsubscribeUrl,
      '',
      'Best,',
      'Giacomo',
    ].join('\n'),
  })

  if (error) {
    throw new Error(error.message || 'Failed to send welcome email')
  }
}
