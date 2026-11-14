// intentionDOffre.ts — le plan et la périodicité choisis sur l'accueil, gardés
// jusqu'à la page de paiement.
//
// Audit du 14 novembre 2026 (A2) : les boutons payants de l'accueil menaient à
// `/auth/signup?plan=pro`. Or l'inscription ne lit PAS `plan` : le choix était
// perdu à la première page, et la périodicité (mensuel / annuel) n'était même
// pas transmise. Le visiteur qui avait choisi « Établissement, annuel » arrivait
// sur le tableau de bord, puis sur une grille revenue au mensuel.
//
// L'inscription sait déjà conserver une destination interne (`redirect`, gardée
// aussi à travers la confirmation par e-mail et les erreurs). L'intention voyage
// donc DANS cette destination : `/upgrade?plan=pro&cycle=annuel`. Module PUR.

import { PLAN_ORDER, type PlanId } from "./plans"

export type Intention = { plan: PlanId | null; annuel: boolean }

const PAYANTS = PLAN_ORDER.filter(id => id !== "free")

/** La page d'offres, plan et cycle présélectionnés. */
export function urlDOffre(plan: PlanId, annuel: boolean): string {
  return `/upgrade?plan=${plan}&cycle=${annuel ? "annuel" : "mensuel"}`
}

/** Le lien d'un bouton payant de l'accueil : inscription, puis la page d'offres. */
export function lienVersOffre(plan: PlanId, annuel: boolean): string {
  return `/auth/signup?redirect=${encodeURIComponent(urlDOffre(plan, annuel))}`
}

/** Ce que la page d'offres doit présélectionner. Toute valeur inconnue est ignorée. */
export function lireIntention(params: { get(k: string): string | null } | null | undefined): Intention {
  const p = params?.get("plan") ?? null
  const plan = p && (PAYANTS as string[]).includes(p) ? (p as PlanId) : null
  return { plan, annuel: params?.get("cycle") === "annuel" }
}
