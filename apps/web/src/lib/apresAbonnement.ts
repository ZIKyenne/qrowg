// apresAbonnement.ts — ce qu'on dit au client juste après qu'il a payé.
//
// Revue du 17 novembre : le retour de Stripe affichait « Bienvenue ! Votre
// abonnement est actif. 🎉 » — sans le nom de la formule, sans ce qu'elle
// débloque, sans quoi faire ensuite. Et l'écran pouvait encore dire « Gratuit » :
// le plan ne bascule qu'à l'arrivée du webhook. Ici, les PHRASES et les GESTES ;
// le composant attend que le plan soit actif avant de les montrer. Module PUR.

import { getPlan, type PlanId } from "./plans"

export type GesteApresAbonnement = { libelle: string; href: string }

/** Deux ou trois choses à faire tout de suite avec ce que la formule vient d'ouvrir. */
export function gestesApresAbonnement(plan: PlanId | string): GesteApresAbonnement[] {
  const p = getPlan(plan)
  const out: GesteApresAbonnement[] = []
  if (p.caps.dynDomaineMarque) out.push({ libelle: "Relier votre nom de domaine", href: "/dashboard/domains" })
  if ((p.limits.team ?? 0) > 0) out.push({ libelle: "Inviter votre équipe", href: "/dashboard/team" })
  if (p.caps.qrStudioAdvanced) out.push({ libelle: "Personnaliser votre QR", href: "/dashboard/qr-codes" })
  if (p.caps.printStudio) out.push({ libelle: "Imprimer un support", href: "/dashboard/print-studio" })
  return out.slice(0, 3)
}

/** La phrase d'en-tête, au nom de la formule. */
export function phraseAbonnementActif(plan: PlanId | string): string {
  return `Votre formule ${getPlan(plan).label} est active.`
}

/** Le paiement est revenu de Stripe mais le plan n'a pas encore basculé : combien de temps attendre. */
export const ATTENTE_ACTIVATION_MS = 20_000
