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

function buildUnsubscribeUrl(req: Request, email: string) {
  const ts = String(Date.now());
  const sig = signUnsubscribeToken(email, ts);
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const url = new URL("/api/newsletter/unsubscribe", base);
  url.searchParams.set("email", email);
  url.searchParams.set("ts", ts);
  url.searchParams.set("sig", sig);
  return url.toString();
}

async function sendWelcomeEmail(email: string, unsubscribeUrl: string) {
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!from) {
    console.warn("Missing NEWSLETTER_FROM_EMAIL: welcome email skipped");
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "ciao!",
    replyTo: "giaco.maggiore@gmail.com",
    html: `
      <p>Ciao!</p>
      <p>Thanks for subscribing. I will only send occasional updates when I publish something new.</p>
      <p>If you ever change your mind, you can unsubscribe anytime by clicking <a href="${unsubscribeUrl}">here</a></p>
      
      <p>Best,<br/>Giacomo</p>
    `,
  });

  if (error) {
    throw new Error(error.message || "Failed to send welcome email");
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const email = String(form.get("email") || "").trim().toLowerCase();
    const consent = String(form.get("newsletter_consent") || "") === "yes";
    const honeypot = String(form.get("website") || "");

    if (honeypot) {
      return NextResponse.redirect(new URL("/", req.url), 303);
    }

    if (!consent) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      return NextResponse.json({ error: "Missing RESEND_AUDIENCE_ID" }, { status: 500 });
    }

    const { error } = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });

    let isDuplicate = false;
    if (error) {
      const msg = String(error.message || "").toLowerCase();
      isDuplicate = msg.includes("already");
      if (!isDuplicate) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (!isDuplicate) {
      try {
        const unsubscribeUrl = buildUnsubscribeUrl(req, email);
        await sendWelcomeEmail(email, unsubscribeUrl);
      } catch (welcomeErr) {
        console.error("Welcome email error:", welcomeErr);
      }
    }

    const referer = req.headers.get("referer");
    const backUrl = new URL(referer || "/", req.url);
    backUrl.searchParams.set("subscribed", "1");
    return NextResponse.redirect(backUrl, 303);
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}