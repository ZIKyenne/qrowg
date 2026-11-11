import type { PlanId } from "./plans"

// Source unique du mapping price Stripe -> plan (mensuel + annuel), depuis les
// variables d'env NEXT_PUBLIC_STRIPE_*_PRICE_ID. Etait duplique dans le webhook.
export const PLAN_FROM_PRICE: Record<string, PlanId> = (() => {
  const m: Record<string, PlanId> = {}
  const add = (id: string | undefined, plan: PlanId) => { if (id) m[id] = plan }
  // Le palier « Starter » (4,90 €) est rétabli le 11 novembre 2026, sur des
  // produits Stripe NEUFS. Les identifiants de l'ancien Starter de juillet ne
  // sont toujours pas remappés et ne doivent pas l'être : les variables
  // d'environnement pointent sur les nouveaux prix, et un identifiant venu
  // d'une grille disparue ne doit ouvrir aucun plan plutôt qu'un mauvais.
  add(process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID, "starter")
  add(process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID, "starter")
  add(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID, "pro")
  add(process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID, "business")
  add(process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID, "pro")
  add(process.env.NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID, "business")
  return m
})()

// Plan correspondant a un price Stripe, ou null si le price est inconnu
// (env manquante). Renvoyer null permet aux appelants de NE PAS retrograder a
// tort un abonne actif dont le price n'est pas dans la config.
export function planFromPriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null
  return PLAN_FROM_PRICE[priceId] ?? null
}
