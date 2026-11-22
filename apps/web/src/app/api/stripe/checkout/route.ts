import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { serverError } from "@/lib/apiError"

// Un plan absent de cette table n'est pas « non configuré » : il est INVALIDE,
// et le client reçoit « Plan invalide » alors qu'il a cliqué sur un bouton que
// nous lui avons montré. C'est ce qui est arrivé à « Starter » entre v220 et le
// 13 novembre : remis sur la grille, jamais ajouté ici.
//
// La garde `tousLesPaliersSeVendent` vérifie désormais que chaque palier payant
// de `lib/plans` a sa ligne dans les deux tables ci-dessous.
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
    // Auth OBLIGATOIRE : le userId est dérivé de la session, JAMAIS du body
    // (sinon n'importe qui pouvait créer une session Checkout rattachée à un
    // compte arbitraire et faire attribuer un plan via metadata).
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const userId = user.id

    const { plan, annual } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

    const planSur = typeof plan === "string" && Object.hasOwn(PRICE_IDS, plan) ? plan : ""
    // Annuel demandé mais pas de prix annuel : on le DIT. On basculait en silence
    // sur le mensuel — la carte affichait l'annuel, Stripe facturait le mois
    // (revue du 17 nov.).
    if (planSur && annual && !ANNUAL_PRICE_IDS[planSur]) {
      console.error("[stripe] prix annuel non configuré pour", planSur, "— vérifier NEXT_PUBLIC_STRIPE_*_ANNUAL_PRICE_ID")
      return NextResponse.json(
        { error: "La formule annuelle n'est pas encore disponible pour ce plan. Choisissez le mensuel, ou écrivez-nous." },
        { status: 503 },
      )
    }
    const priceId = planSur ? (annual ? ANNUAL_PRICE_IDS[planSur] : PRICE_IDS[planSur]) : ""
    if (!priceId) {
      // Deux échecs très différents se cachaient derrière « Plan invalide ».
      //  · un plan qui n'existe pas : la requête est fautive ;
      //  · un plan qui existe mais dont l'identifiant de prix n'est pas configuré :
      //    c'est une variable d'environnement manquante côté Vercel, et le client,
      //    lui, n'y peut rien. Il ne doit pas croire qu'il a mal cliqué.
      const planConnu = !!planSur
      if (planConnu) {
        console.error("[stripe] tarif non configuré pour le plan", plan, "— vérifier NEXT_PUBLIC_STRIPE_*_PRICE_ID")
        return NextResponse.json(
          { error: "Ce plan n'est pas encore disponible à la souscription. Écrivez-nous, on s'en occupe tout de suite." },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 })
    }
    const billing = annual ? "annual" : "monthly"

    // Un abonné qui relançait un checkout obtenait un DEUXIÈME abonnement Stripe :
    // l'upsert du webhook (une ligne par compte) écrasait le premier, qui restait
    // facturé et invisible. Un changement de plan passe par le portail Stripe,
    // pas par une nouvelle caisse.
    const { data: profil } = await supabase
      .from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle()
    const customerId = profil?.stripe_customer_id ?? null
    if (customerId) {
      const encours = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 })
      const active = encours.data.find(s => ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(s.status))
      if (active) {
        // Changer de formule : le portail Stripe s'ouvre DIRECTEMENT sur l'écran
        // « confirmer le changement », avec ce prix (et le prorata calculé par
        // Stripe). Avant : « Redirection vers le paiement… » puis l'accueil
        // générique du portail, sans parcours de changement (revue du 17 nov.).
        const ligne = active.items.data[0]
        if (ligne && ligne.price.id !== priceId) {
          try {
            const portail = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: `${appUrl}/upgrade`,
              flow_data: {
                type: "subscription_update_confirm",
                subscription_update_confirm: { subscription: active.id, items: [{ id: ligne.id, price: priceId, quantity: 1 }] },
                after_completion: { type: "redirect", redirect: { return_url: `${appUrl}/dashboard?upgraded=true` } },
              },
            })
            return NextResponse.json({ url: portail.url, changement: true })
          } catch (e) {
            // Portail non configuré pour les changements de formule (réglage
            // Stripe) : on retombe sur l'ancien chemin, le portail générique.
            console.error("[stripe] changement de formule direct impossible — portail Stripe à configurer :", (e as Error)?.message)
          }
        }
        return NextResponse.json(
          { error: "Vous avez déjà un abonnement en cours. Pour en changer, passez par « Changer de formule ».", portal: true },
          { status: 409 },
        )
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // La référence du paiement revient avec le client : le tableau de bord
      // attend que le plan soit activé (webhook) avant de le dire.
      success_url: `${appUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade?canceled=true`,
      metadata: { userId, plan, priceId, billing },
      subscription_data: {
        metadata: { userId, plan, priceId, billing },
      },
      allow_promotion_codes: true,
      // Facture pro (D4, 23 nov.) : un restaurateur qui passe l'abonnement en
      // frais professionnels a besoin d'une facture à son nom, avec l'adresse de
      // facturation et, s'il en a un, son numéro de TVA. Stripe propose la case
      // « J'achète en tant qu'entreprise » (raison sociale + n° de TVA, facultatif)
      // et reporte le tout sur les factures de l'abonnement.
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      // Client déjà connu : Stripe exige qu'on l'autorise à enregistrer le nom
      // et l'adresse saisis, sinon la session refuse la collecte du n° de TVA.
      ...(customerId ? { customer_update: { name: "auto" as const, address: "auto" as const } } : {}),
      // Même client Stripe d'une souscription à l'autre : historique, moyens de
      // paiement et portail au même endroit. Sans identifiant connu, on fixe au
      // moins l'e-mail pour que le client créé porte le bon.
      ...(customerId ? { customer: customerId } : { customer_email: user.email ?? undefined }),
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return serverError("stripe/checkout", e)
  }
}
