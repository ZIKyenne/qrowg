import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { buildSubscriptionEmail } from "@/lib/subscriptionEmail"
import { hasInternalToken } from "@/lib/rateLimit"

// Email de bienvenue abonnement. Le webhook Stripe envoie directement (via
// buildSubscriptionEmail) ; cette route sert d'envoi manuel/test -> secret requis.
export async function POST(req: NextRequest) {
  try {
    if (!hasInternalToken(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Service email non configuré" }, { status: 503 })
    const resend = new Resend(apiKey)

    const { email, name, plan, billing, trialDays } = await req.json()
    if (!email || !plan) return NextResponse.json({ error: "email et plan requis" }, { status: 400 })

    const { subject, html } = buildSubscriptionEmail({ name, plan, billing, trialDays })

    const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to: email, subject, html })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
