import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Admin client pour les webhooks (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const PLAN_MAP: Record<string, 'free' | 'pro' | 'business'> = {
  [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_BUSINESS_PRICE_ID || '']: 'business',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Paiement réussi → activer l'abonnement ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        if (!userId) break

        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id || ''
        const plan = PLAN_MAP[priceId] || 'pro'

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan,
          status: subscription.status as any,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        }, { onConflict: 'user_id' })

        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId)

        console.log(`✅ Plan ${plan} activé pour user ${userId}`)
        break
      }

      // ── Abonnement mis à jour ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (!userId) {
          // Chercher par stripe_subscription_id
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()
          if (!sub) break

          const priceId = subscription.items.data[0]?.price.id || ''
          const plan = PLAN_MAP[priceId] || 'pro'

          await supabase.from('subscriptions').update({
            plan,
            status: subscription.status as any,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }).eq('stripe_subscription_id', subscription.id)

          await supabase.from('profiles').update({ plan }).eq('id', sub.user_id)
          break
        }

        const priceId = subscription.items.data[0]?.price.id || ''
        const plan = PLAN_MAP[priceId] || 'pro'

        await supabase.from('subscriptions').update({
          plan,
          status: subscription.status as any,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('user_id', userId)

        await supabase.from('profiles').update({ plan }).eq('id', userId)
        break
      }

      // ── Abonnement annulé → repasser en Free ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (sub) {
          await supabase.from('subscriptions').update({
            plan: 'free',
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscription.id)

          await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
          console.log(`❌ Abonnement annulé, retour Free pour user ${sub.user_id}`)
        }
        break
      }

      // ── Paiement échoué ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', subscriptionId)

        console.log(`⚠️ Paiement échoué pour subscription ${subscriptionId}`)
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
