import Stripe from "stripe"

// Client Stripe unique (était dupliqué à l'identique dans 4 fichiers :
// actions/stripe, api/stripe/checkout, api/stripe/portal, api/webhooks/stripe).
// Le cast de apiVersion est centralisé ici -> une seule source à maintenir.
// Le cast est nécessaire : la version épinglée diffère de celle attendue par les
// types du SDK. Centralisé ici -> 1 seul cast au lieu de 4 copies.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
})
