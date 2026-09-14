// qrEnBrouillon.ts — la route le dit, trois écrans sur quatre ne l'écoutent pas.
//
// Relevé du 14 septembre. Quand le quota de QR actifs du plan est atteint, une
// page nouvellement créée reçoit un QR en BROUILLON — `lib/quota` le documente :
// « créé quand même, mais non visitable tant qu'un slot n'est pas libéré ». Les
// deux routes de création renvoient l'information :
//
//     return NextResponse.json({ pageId, success: true, qrStatus,
//                                atActiveLimit: qrStatus === "draft" })
//
// Qui l'écoute :
//
//   templates/page.tsx:708  (modal de nommage)  OUI — « Page créée en brouillon :
//                             limite de QR actifs atteinte. Mettez un QR en pause
//                             puis activez celle-ci. »
//   templates/page.tsx:628  (assistant)         non — « Page créée — à vous de jouer »
//   onboarding/OnboardingClient.tsx:37          non — l'écran promet pourtant
//                             « Page + blocs + QR + objectif »
//   BuilderV4.tsx:566 (/api/pages/create)       non
//
// Trois chemins sur quatre livrent donc une page dont le QR affiche le mur
// « brouillon » au scan (lot v78) — sans le dire. Le commerçant peut l'imprimer.
//
// La phrase existe déjà et elle est bonne : on la sort de l'écran qui l'avait, on
// lui ajoute le chiffre du plan, et les quatre chemins la disent. Module PUR.

import { pageLimit } from "./plans"

/** Ce que disent les deux routes de création quand le quota est atteint. */
export const CHAMP_LIMITE = "atActiveLimit"

/**
 * Le message quand le QR arrive en brouillon. Repris mot pour mot de l'écran des
 * modèles — c'est la formulation que le produit avait déjà trouvée — enrichi du
 * nombre de QR actifs que donne le plan quand on le connaît.
 */
function complementDuPlan(plan?: string | null): string {
  const limite = pageLimit(plan)
  return typeof limite === "number" && limite > 0
    ? ` Votre plan permet ${limite} QR actif${limite > 1 ? "s" : ""}.`
    : ""
}

export function phraseQrEnBrouillon(plan?: string | null): string {
  return `Page créée en brouillon : limite de QR actifs atteinte.${complementDuPlan(plan)} Mettez un QR en pause puis activez celle-ci.`
}

/**
 * La même chose pour une COPIE de QR (QR Studio) et pour un SUPPORT ajouté à une
 * page (lot v83). Le produit avait déjà ces deux phrases, chacune dans son
 * écran : elles vivent ici, avec le chiffre du plan.
 */
export function phraseCopieEnBrouillon(plan?: string | null): string {
  return `Copie créée en brouillon : limite de QR actifs atteinte.${complementDuPlan(plan)} Activez-la après avoir mis un autre QR en pause.`
}

export function phraseSupportEnBrouillon(plan?: string | null): string {
  return `Support créé en brouillon : limite de QR actifs atteinte.${complementDuPlan(plan)} Activez-le après avoir mis un autre QR en pause.`
}

/** Et le message quand tout va bien. */
export const PHRASE_PAGE_CREEE = "Page créée avec succès"

/**
 * Le message d'après-création, pour les quatre chemins. Un booléen absent n'est
 * pas « tout va bien » : les routes renvoient toujours le champ, et si un jour
 * l'une d'elles ne le renvoyait plus, on ne veut pas inventer une bonne
 * nouvelle — mais on ne veut pas non plus alarmer. Absent = message neutre.
 */
export function messageApresCreation(reponse: unknown, plan?: string | null): string {
  const r = (reponse ?? {}) as Record<string, unknown>
  return r[CHAMP_LIMITE] === true ? phraseQrEnBrouillon(plan) : PHRASE_PAGE_CREEE
}

/** Le QR de cette page est-il visitable tout de suite ? */
export function qrVisitable(reponse: unknown): boolean {
  const r = (reponse ?? {}) as Record<string, unknown>
  if (r[CHAMP_LIMITE] === true) return false
  const s = r.qrStatus
  return typeof s === "string" ? s === "active" : true
}
