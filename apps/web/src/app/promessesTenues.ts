// promessesTenues.ts — ce que la grille tarifaire a le droit d'annoncer.
//
// Relevé du 11 septembre, en lisant la grille ligne à ligne contre le code.
//
// 1. « Génération IA + rapports » (Établissement) et « Génération IA illimitée »
//    (Entreprise) étaient annoncées sans condition. Or la fonction n'existe que
//    si `ANTHROPIC_API_KEY` est définie au build : `next.config.mjs` en dérive
//    `NEXT_PUBLIC_GENERATION_IA`, et l'éditeur la respecte — il masque le
//    panneau quand elle vaut 0. La grille, elle, ne la consultait jamais. Sans
//    clé, le produit CACHE dans l'éditeur ce qu'il VEND à 19 €/mois.
//
// 2. « Support prioritaire », sur les deux plans payants : aucune occurrence
//    ailleurs dans le dépôt. Rien, nulle part, ne distingue un ticket prioritaire
//    d'un autre. Ligne retirée.
//
// 3. Les promesses vivaient dans DEUX listes écrites à la main — `lib/plans.ts`
//    pour /upgrade, `homeSections/Pricing.tsx` pour l'accueil — et elles avaient
//    déjà divergé : l'accueil ne mentionnait pas l'IA que /upgrade vendait.
//
// La règle posée : toute promesse cochée porte une PREUVE — un champ de son
// propre plan, ou un fichier du produit. Ce module la résout ; la garde
// `promessesTenues.test.ts` vérifie qu'aucune n'en est dépourvue et qu'aucune
// preuve ne pointe dans le vide. Module PUR.

import { PLANS, type Perk, type Plan, type PlanId, type Preuve } from "@/lib/plans"

/** Une promesse sans preuve n'est pas une promesse, c'est une affirmation. */
export function preuveResolue(plan: Plan, preuve: Preuve | undefined): boolean {
  if (!preuve) return false
  if (preuve.startsWith("produit:")) return preuve.length > "produit:".length
  const [famille, cle] = preuve.split(".") as ["limits" | "caps", string]
  if (famille === "limits") {
    if (!(cle in plan.limits)) return false
    const v = (plan.limits as Record<string, number | null>)[cle]
    return v === null || v > 0            // null = illimité, 0 = la fonction n'est pas là
  }
  if (famille === "caps") {
    if (!(cle in plan.caps)) return false
    const v = (plan.caps as Record<string, unknown>)[cle]
    if (typeof v === "boolean") return v
    if (typeof v === "number") return v > 0
    if (Array.isArray(v)) return v.length > 0
    return false
  }
  return false
}

/** Les promesses cochées de ce plan qui ne tiennent pas : la liste doit être vide. */
export function promessesSansPreuve(id: PlanId): Perk[] {
  const plan = PLANS[id]
  return plan.perks.filter(p => p.included && !p.soon && !preuveResolue(plan, p.preuve))
}

/**
 * Ce que la grille affiche vraiment. `iaActive` vient de `GENERATION_IA_ACTIVE` :
 * sans clé serveur, la fonction n'existe pas — on ne la vend pas, on ne la coche
 * pas, on ne la montre pas barrée non plus. Elle disparaît, comme dans l'éditeur.
 */
export function perksAffichables(id: PlanId, opts: { iaActive: boolean }): Perk[] {
  return PLANS[id].perks.filter(p => !(p.preuve === "caps.ai" && !opts.iaActive))
}
