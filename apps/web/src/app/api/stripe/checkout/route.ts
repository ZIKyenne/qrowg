import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any })

const PRICE_IDS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "",
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "",
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || "",
}
// Prix annuels (optionnels) — à créer dans Stripe pour que le toggle "Annuel" facture vraiment l'annuel
const ANNUAL_PRICE_IDS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || "",
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || "",
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID || "",
}

export async function POST(req: NextRequest) {
  try {
    const { plan, annual, userId } = await req.json()

    // Annuel si demandé ET si un prix annuel est configuré, sinon mensuel
    const priceId = (annual && ANNUAL_PRICE_IDS[plan]) ? ANNUAL_PRICE_IDS[plan] : PRICE_IDS[plan]
    if (!priceId) return NextResponse.json({ error: "Plan invalide" }, { status: 400 })
    const billing = (annual && ANNUAL_PRICE_IDS[plan]) ? "annual" : "monthly"

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/upgrade?canceled=true`,
      metadata: { userId, plan, priceId, billing },
      subscription_data: {
        metadata: { userId, plan, priceId, billing },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error("Stripe checkout error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
