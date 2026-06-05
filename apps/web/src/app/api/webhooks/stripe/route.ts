import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_FROM_PRICE: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || ""]: "starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ""]: "pro",
  [process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || ""]: "business",
}

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

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
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
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        const priceId = sub.items.data[0]?.price.id
        const plan = PLAN_FROM_PRICE[priceId] || "free"

        if (userId) {
          await supabase.from("profiles").update({ plan }).eq("id", userId)
          await supabase.from("subscriptions").update({
            plan,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq("stripe_subscription_id", sub.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId

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
        await supabase.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", invoice.subscription as string)
        break
      }
    }
  } catch (e: any) {
    console.error("Webhook handler error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
