import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { planFromPriceId } from "@/lib/stripePlan"
import { buildSubscriptionEmail } from "@/lib/subscriptionEmail"
import { EMAIL_FROM } from "@/lib/emailFrom"

// Email de bienvenue abonnement (essai/achat) — fire-and-forget, n'echoue jamais.
async function sendSubscriptionEmail(userId: string, plan: string, billing?: string | null) {
  try {
    if (!process.env.RESEND_API_KEY) return
    const { data: prof } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()
    if (!prof?.email) return
    const { subject, html } = buildSubscriptionEmail({ name: prof.full_name, plan, billing, trialDays: 7 })
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: EMAIL_FROM, to: prof.email, subject, html })
  } catch (e) {
    console.warn("[stripe webhook] email abonnement non envoye:", (e as any)?.message)
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    console.error("Webhook signature error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  // Deux chemins de checkout coexistent avec des conventions de metadonnees
  // differentes (api/stripe/checkout -> `userId` ; actions/stripe.ts ->
  // `supabase_user_id`). On accepte les DEUX pour resoudre l'utilisateur, quel
  // que soit le chemin ayant cree la session/abonnement.
  const metaUser = (m?: Stripe.Metadata | null): string | undefined =>
    (m?.userId || m?.supabase_user_id) || undefined

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = metaUser(session.metadata)
        const plan = session.metadata?.plan
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (userId && plan) {
          await supabase.from("profiles").update({
            plan,
            stripe_customer_id: customerId,
          }).eq("id", userId)

          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: session.metadata?.priceId,
            plan,
            status: "trialing",
          }, { onConflict: "user_id" })

          // Email de bienvenue (essai/achat) — ne bloque pas la reponse au webhook
          await sendSubscriptionEmail(userId, plan, session.metadata?.billing)
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = metaUser(sub.metadata)
        const priceId = sub.items.data[0]?.price.id
        // Prix inconnu (absent de la config env) -> plan = null : on NE
        // retrograde PAS l'abonne (une vraie annulation passe par
        // subscription.deleted). On met tout de meme a jour statut/periode.
        const plan = planFromPriceId(priceId)
        if (!plan) console.warn(`[stripe webhook] price non mappe, plan inchange: ${priceId}`)

        if (userId) {
          if (plan) await supabase.from("profiles").update({ plan }).eq("id", userId)
          await supabase.from("subscriptions").update({
            ...(plan ? { plan } : {}),
            status: sub.status,
            current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq("stripe_subscription_id", sub.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = metaUser(sub.metadata)

        if (userId) {
          await supabase.from("profiles").update({ plan: "free" }).eq("id", userId)
          await supabase.from("subscriptions").update({
            plan: "free",
            status: "canceled",
            canceled_at: new Date().toISOString(),
          }).eq("stripe_subscription_id", sub.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabase.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", (invoice as any).subscription as string)
        break
      }
    }
  } catch (e: any) {
    console.error("Webhook handler error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
