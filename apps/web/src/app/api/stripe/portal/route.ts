import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { serverError } from "@/lib/apiError"
import { retourDuPortail } from "@/lib/gestionAbonnement"

// Ouvre le portail Stripe du client. Trois intentions, une seule porte :
//  · (aucune)      → l'accueil du portail : factures, reçus, cycle ;
//  · "paiement"    → directement la mise à jour de la carte ;
//  · "resilier"    → directement le parcours de résiliation de l'abonnement.
//
// Avant l'audit du 14 novembre (A1), le client qui voulait résilier devait
// deviner que « Gérer la facturation » cachait la résiliation, et seul le Profil
// y menait. Le parcours de résiliation est désormais nommé là où on le cherche.
//
// La résiliation elle-même (fin de période ou immédiate) est réglée dans la
// CONFIGURATION du portail chez Stripe, pas ici — à vérifier dans le tableau de
// bord Stripe : « Annuler les abonnements → à la fin de la période de facturation ».
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

    const corps = await req.json().catch(() => ({})) as { intention?: unknown; retour?: unknown }
    const intention = corps?.intention === "resilier" || corps?.intention === "paiement" ? corps.intention : null

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement en ligne n'est rattaché à ce compte. Écrivez-nous pour le modifier." }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
    const return_url = `${appUrl}${retourDuPortail(corps?.retour)}`

    let flow_data: any = undefined
    if (intention === "paiement") {
      flow_data = { type: "payment_method_update", after_completion: { type: "redirect", redirect: { return_url } } }
    } else if (intention === "resilier") {
      const { data: sub } = await supabase
        .from("subscriptions").select("stripe_subscription_id, status").eq("user_id", user.id).maybeSingle()
      // Sans abonnement vivant, rien à résilier : on ouvre l'accueil du portail
      // plutôt qu'une erreur Stripe incompréhensible.
      if (sub?.stripe_subscription_id && sub.status !== "canceled") {
        flow_data = {
          type: "subscription_cancel",
          subscription_cancel: { subscription: sub.stripe_subscription_id },
          after_completion: { type: "redirect", redirect: { return_url } },
        }
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url,
      ...(flow_data ? { flow_data } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return serverError("stripe/portal", e)
  }
}
