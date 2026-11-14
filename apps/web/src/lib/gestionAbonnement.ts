// gestionAbonnement.ts — ce que l'écran Facturation peut dire et proposer.
//
// Relevé de l'audit du 14 novembre 2026 (A1) : Paramètres → Facturation →
// « Gérer mon abonnement » menait à `/upgrade`, où le plan en cours est un
// bouton désactivé « Plan actuel ». Le portail Stripe (factures, carte,
// résiliation) existait — `api/stripe/portal` — mais seul l'onglet Abonnement
// du Profil l'appelait. Le client qui cherchait à résilier depuis Paramètres,
// là où les conditions l'envoient, ne trouvait que « Supprimer mon compte ».
//
// Ce module décide, à partir de ce que la base sait, QUATRE choses distinctes :
//   1. changer de formule        → /upgrade
//   2. factures et moyen de paiement ┐
//   3. résilier en fin de période    ┘→ portail Stripe (un seul lieu, deux intentions nommées)
//   4. supprimer le compte       → zone de danger (hors d'ici, volontairement)
// et la phrase d'échéance qui va avec. Module PUR, testé.

import { getPlan, type Plan } from "./plans"
import { dateLisible } from "./jourDuCommerce"
import type { LigneAbonnement } from "./cycleAbonnement"

export type StatutFacturation =
  /** Plan gratuit, rien à gérer. */
  | "gratuit"
  /** Abonnement payant qui se renouvelle. */
  | "actif"
  /** Paiement refusé : Stripe retente, le plan reste ouvert pendant la grâce. */
  | "impaye"
  /** Résiliation demandée : le plan court jusqu'à la fin de la période payée. */
  | "fin_programmee"
  /** Plan payant sans client Stripe : attribué à la main, rien à ouvrir chez Stripe. */
  | "hors_stripe"

export type EtatFacturation = {
  plan: Plan
  statut: StatutFacturation
  /** La phrase sous le nom du plan. Jamais « Renouvellement » pour un abonnement résilié. */
  echeance: string | null
  /** Le portail Stripe peut-il s'ouvrir ? (il faut un client Stripe) */
  portail: boolean
  /** Une montée de plan reste-t-elle possible ? */
  monter: boolean
}

export type EntreeFacturation = {
  plan?: string | null
  abonnement?: LigneAbonnement | null
  /** `profiles.stripe_customer_id` présent. */
  clientStripe: boolean
}

const jour = (t: number) => dateLisible(t, { day: "numeric", month: "long", year: "numeric" })

export function etatFacturation(e: EntreeFacturation, maintenant: number = Date.now()): EtatFacturation {
  const plan = getPlan(e.plan)
  const monter = plan.id !== "business"
  if (plan.id === "free") {
    // Un ancien abonné repassé au gratuit garde un client Stripe : ses factures
    // passées restent consultables dans le portail.
    return { plan, statut: "gratuit", echeance: null, portail: e.clientStripe, monter }
  }
  if (!e.clientStripe) {
    return { plan, statut: "hors_stripe", echeance: null, portail: false, monter }
  }
  const a = e.abonnement
  const fin = a?.current_period_end ? Date.parse(a.current_period_end) : NaN
  const finConnue = Number.isFinite(fin) && fin >= maintenant
  const gratuit = getPlan("free").label

  if (a?.status === "past_due" || a?.status === "unpaid") {
    return {
      plan, statut: "impaye", portail: true, monter,
      echeance: "Le dernier paiement a été refusé. Mettez à jour votre carte pour garder ce plan.",
    }
  }
  if (a?.cancel_at_period_end) {
    return {
      plan, statut: "fin_programmee", portail: true, monter,
      echeance: finConnue
        ? `Résiliation programmée : le plan reste actif jusqu'au ${jour(fin)}, puis votre compte passe au plan ${gratuit}.`
        : `Résiliation programmée : à la fin de la période payée, votre compte passe au plan ${gratuit}.`,
    }
  }
  return {
    plan, statut: "actif", portail: true, monter,
    echeance: finConnue ? `Prochain renouvellement le ${jour(fin)}.` : null,
  }
}

/** Libellés des actions — un seul endroit, pour Paramètres, Profil et /upgrade. */
export const LIBELLES_FACTURATION = {
  monter: "Changer de formule",
  portail: "Factures et moyen de paiement",
  resilier: "Résilier en fin de période",
  reprendre: "Annuler la résiliation",
  horsStripe: "Votre plan a été attribué hors paiement en ligne : pour le modifier ou l'arrêter, écrivez-nous.",
} as const

/**
 * Où le portail Stripe renvoie le client. Liste fermée : la valeur vient du
 * navigateur, et une URL de retour libre serait une redirection ouverte.
 */
export const RETOURS_DU_PORTAIL = ["/dashboard/settings", "/dashboard/profile", "/upgrade", "/dashboard"] as const
export function retourDuPortail(demande: unknown): (typeof RETOURS_DU_PORTAIL)[number] {
  return (RETOURS_DU_PORTAIL as readonly unknown[]).includes(demande)
    ? (demande as (typeof RETOURS_DU_PORTAIL)[number])
    : "/dashboard/settings"
}
