// suppressionDeCompte.ts — le produit prévient mieux pour une page que pour tout.
//
// Relevé du 14 septembre, côte à côte.
//
//   SUPPRIMER UNE PAGE (lot v84) :
//     · 4 QR imprimables : Table 1, Table 2, Table 3, Table 4
//     · 1 420 scans enregistrés
//     · 3 800 vues de la page
//     · 12 messages reçus
//     · Ces codes sont peut-être déjà collés ou distribués : ils cesseront de
//       fonctionner définitivement. De nouveaux QR porteraient d'autres codes —
//       il faudrait réimprimer les supports.
//     + il faut RECOPIER le titre de la page pour débloquer le bouton.
//
//   SUPPRIMER TOUT LE COMPTE :
//     · « La suppression de votre compte effacera définitivement toutes vos
//        pages, QR codes et données analytics. Cette action est irréversible. »
//     + il faut recopier son e-mail.
//
// Une phrase, aucun chiffre. Et six choses que l'écran ne dit pas alors que la
// route `api/account/delete` les FAIT :
//
//   NON — le nombre de QR imprimés qui cesseront de fonctionner
//   NON — que ces codes sont dehors et qu'il faudra réimprimer
//   NON — que l'équipe est supprimée et ses membres perdent l'accès
//   NON — que l'abonnement en cours est résilié
//   NON — que les domaines personnalisés cessent de résoudre
//   NON — que l'adresse publique redevient libre
//
// La destruction la plus grande du produit est celle qui en dit le moins.
// Module PUR, et il réutilise les phrases du lot v84 plutôt que d'en écrire
// d'autres : sur les codes déjà collés, il n'y a qu'une chose vraie à dire.

import { phraseCodesImprimes } from "./suppressionDePage"
import { getPlan } from "./plans"

export type CeQuiDisparaitDuCompte = {
  pages?: number
  qrs?: number
  scans?: number
  vues?: number
  messages?: number
  membres?: number
  domaines?: number
  sousDomaine?: string | null
  plan?: string | null
  finDePeriode?: string | null
}

const n0 = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}
const nombre = (n: number): string => n.toLocaleString("fr-FR")
const pluriel = (n: number, singulier: string, plurielMot = singulier + "s"): string =>
  `${nombre(n)} ${n > 1 ? plurielMot : singulier}`

/**
 * Ce qui disparaît, ligne par ligne, avec des nombres — même règle qu'au lot
 * v84 : on ne liste que ce qui existe. Annoncer « 0 message » n'apprend rien et
 * noie ce qui compte.
 */
export function consequencesDuCompte(c: CeQuiDisparaitDuCompte | null | undefined): string[] {
  const out: string[] = []
  const pages = n0(c?.pages), qrs = n0(c?.qrs)
  if (pages > 0) out.push(`${pluriel(pages, "page publiée", "pages publiées")}`)
  if (qrs > 0) out.push(`${pluriel(qrs, "QR imprimable", "QR imprimables")}`)
  const scans = n0(c?.scans), vues = n0(c?.vues), messages = n0(c?.messages)
  if (scans > 0) out.push(pluriel(scans, "scan enregistré", "scans enregistrés"))
  if (vues > 0) out.push(pluriel(vues, "vue de page", "vues de page"))
  if (messages > 0) out.push(pluriel(messages, "message reçu", "messages reçus"))
  return out
}

/**
 * Les codes déjà dehors. On délègue au lot v84 : une seule formulation dans le
 * produit pour « ces codes sont peut-être collés, et rien ne les rattrapera ».
 */
export function phraseCodesDuCompte(nbQr: number): string | null {
  return phraseCodesImprimes(n0(nbQr))
}

/**
 * L'équipe. `api/account/delete` fait `teams.delete().eq("owner_id", uid)` : les
 * membres perdent l'accès au contenu partagé, sans e-mail ni préavis.
 */
export function phraseEquipe(nbMembres: number): string | null {
  const n = n0(nbMembres)
  if (n < 1) return null
  return n === 1
    ? "1 membre de votre équipe perdra l'accès au contenu partagé."
    : `${nombre(n)} membres de votre équipe perdront l'accès au contenu partagé.`
}

/** Affichage français d'une date : « 4 mars 2027 ». */
function enFrancais(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
}

/**
 * L'abonnement. La route le résilie chez Stripe AVANT de supprimer quoi que ce
 * soit — et refuse la suppression si Stripe échoue. C'est une bonne décision,
 * que l'écran ne disait pas : celui qui a payé une année en cours doit savoir
 * qu'il y renonce.
 */
export function phraseAbonnement(plan: string | null | undefined, finDePeriode?: string | null): string | null {
  const p = getPlan(plan)
  if (p.id === "free") return null
  const jusque = finDePeriode ? enFrancais(finDePeriode) : ""
  return jusque
    ? `Votre abonnement ${p.label} sera résilié : la période déjà payée, jusqu'au ${jusque}, ne sera ni utilisée ni remboursée.`
    : `Votre abonnement ${p.label} sera résilié immédiatement.`
}

/** Les domaines personnalisés cessent de résoudre — ils pointent dans le vide. */
export function phraseDomaines(nbDomaines: number): string | null {
  const n = n0(nbDomaines)
  if (n < 1) return null
  return n === 1
    ? "Votre domaine personnalisé cessera d'afficher quoi que ce soit : ses enregistrements DNS pointeront dans le vide."
    : `Vos ${nombre(n)} domaines personnalisés cesseront d'afficher quoi que ce soit : leurs enregistrements DNS pointeront dans le vide.`
}

/**
 * L'adresse publique. Contrairement au code court d'un QR — unique et jamais
 * réattribué (lot v84) — un nom d'utilisateur redevient disponible.
 */
export function phraseAdressePublique(sousDomaine: string | null | undefined): string | null {
  const s = typeof sousDomaine === "string" ? sousDomaine.trim() : ""
  if (!s) return null
  return `Votre adresse ${s}.qrowg.com redeviendra libre : quelqu'un d'autre pourra la prendre.`
}

/** Toutes les phrases d'avertissement, dans l'ordre où on les lit. */
export function avertissementsDuCompte(c: CeQuiDisparaitDuCompte | null | undefined): string[] {
  return [
    phraseCodesDuCompte(n0(c?.qrs)),
    phraseEquipe(n0(c?.membres)),
    phraseAbonnement(c?.plan, c?.finDePeriode),
    phraseDomaines(n0(c?.domaines)),
    phraseAdressePublique(c?.sousDomaine),
  ].filter((p): p is string => !!p)
}
