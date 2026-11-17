// droitsDuStudio.ts — ce que la formule ouvre dans le Studio QR, en un seul endroit.
//
// L'ancien Studio verrouillait certains modules, coins et niveaux de correction
// (`canQrAdvanced`) et certains formats d'export (`canExport`), chacun écrit à la
// main au milieu de 3000 lignes. Le Studio compact n'en verrouillait AUCUN : un
// compte gratuit y obtenait SVG et PDF, réservés à Établissement. Ici, la règle
// est lue dans lib/plans (source unique des formules) ; l'écran ne fait que
// demander « est-ce ouvert ? » et « dès quelle formule ? ».

import { canQrAdvanced, canExport, minPlanFor, minPlanForFormat, getPlan, type ExportFormat, type PlanId } from "@/lib/plans"

export const MODULES_AVANCES: readonly string[] = ["pixel", "neon", "luxury"]
export const COINS_AVANCES: readonly string[] = ["diamond", "luxury"]
export const CORRECTIONS_AVANCEES: readonly string[] = ["Q", "H"]

export type Reglage =
  | { type: "module" | "coin" | "correction"; id: string }
  | { type: "format"; id: ExportFormat }

export type Verrou = { plan: PlanId; nomDuPlan: string; phrase: string }

function verrouVers(plan: PlanId, quoi: string): Verrou {
  const nomDuPlan = getPlan(plan).label
  return { plan, nomDuPlan, phrase: `${quoi} : inclus dès la formule ${nomDuPlan}.` }
}

/** `null` si la formule ouvre ce réglage ; sinon, la formule minimale et la phrase à dire. */
export function verrouDe(planDuCompte: string | null | undefined, r: Reglage): Verrou | null {
  if (r.type === "format") {
    if (canExport(planDuCompte, r.id)) return null
    return verrouVers(minPlanForFormat(r.id), `L'export ${NOMS_DE_FORMAT[r.id]}`)
  }
  const avance = r.type === "module" ? MODULES_AVANCES : r.type === "coin" ? COINS_AVANCES : CORRECTIONS_AVANCEES
  if (!avance.includes(r.id) || canQrAdvanced(planDuCompte)) return null
  const quoi = r.type === "module" ? "Ce style de modules" : r.type === "coin" ? "Ce style de coins" : `La correction d'erreur ${r.id}`
  return verrouVers(minPlanFor("qrStudioAdvanced"), quoi)
}

export const NOMS_DE_FORMAT: Record<ExportFormat, string> = {
  png: "PNG", "png-t": "PNG transparent", webp: "WEBP", svg: "SVG", pdf: "PDF",
}

/**
 * Un style déjà enregistré qui n'est plus ouvert (formule baissée, modèle
 * appliqué avant) n'est PAS retiré en silence : on le garde à l'écran, et c'est
 * seulement un NOUVEAU choix verrouillé qui est refusé. Cette fonction dit si un
 * style complet contient un réglage fermé — pour le signaler, pas pour l'effacer.
 */
export function reglagesFermes(planDuCompte: string | null | undefined, s: { dotStyle?: string | null; cornerStyle?: string | null; ecc?: string | null }): Verrou[] {
  const v: Verrou[] = []
  if (s.dotStyle) { const x = verrouDe(planDuCompte, { type: "module", id: s.dotStyle }); if (x) v.push(x) }
  if (s.cornerStyle) { const x = verrouDe(planDuCompte, { type: "coin", id: s.cornerStyle }); if (x) v.push(x) }
  if (s.ecc) { const x = verrouDe(planDuCompte, { type: "correction", id: s.ecc }); if (x) v.push(x) }
  return v
}
