import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createHmac } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getUnsubscribeSecret() {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "";
}

function signUnsubscribeToken(email: string, ts: string) {
  const secret = getUnsubscribeSecret();
  return createHmac("sha256", secret).update(`${email}:${ts}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function isValidSignature(email: string, ts: string, sig: string) {
  const expected = signUnsubscribeToken(email, ts);
  return safeEqual(expected, sig);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const ts = String(url.searchParams.get("ts") || "").trim();
  const sig = String(url.searchParams.get("sig") || "").trim();

  const backUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || url.origin);

  if (!isValidEmail(email) || !ts || !sig || !isValidSignature(email, ts, sig)) {
    backUrl.searchParams.set("unsubscribed", "0");
    return NextResponse.redirect(backUrl, 303);
  }

  const { error } = await resend.contacts.update({
    email,
    unsubscribed: true,
  });

  if (error) {
    backUrl.searchParams.set("unsubscribed", "0");
    return NextResponse.redirect(backUrl, 303);
  }

  backUrl.searchParams.set("unsubscribed", "1");
  return NextResponse.redirect(backUrl, 303);
}
