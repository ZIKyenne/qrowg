// offreUtile.ts — quand le produit a le droit de demander de l'argent, et ce
// qu'il a le droit de promettre en échange.
//
// Relevé du 11 septembre, banc d'essai « retour » (une page publiée il y a trois
// jours, 3 scans, plan gratuit). Mesure du poids visuel de l'accueil connecté —
// surface × écart de clarté avec le fond — sur les blocs d'action :
//
//     poids 7  « Voir les offres »      ← l'encart payant
//     poids 3  « Nouvelle page »
//     poids 3  « Voir mon QR code »     ← l'étape utile du moment
//
// L'élément le plus fort de l'écran, pour quelqu'un qui a trois scans, était la
// demande d'argent. Elle valait plus que les deux gestes utiles réunis.
//
// Pire : l'encart annonçait « 10 pages, vues illimitées, QR personnalisés, sans
// branding ». Or `plans.ts` donne `views: null` aux TROIS plans — les vues sont
// illimitées partout, y compris en gratuit, et l'écran l'écrit lui-même deux
// cartes plus haut (« Vues ce mois · 4 · illimitées »). Le produit vendait comme
// un avantage quelque chose que l'utilisateur avait déjà.
//
// Deux règles, tenues ici. Module PUR, testable seul.

import { PLANS, type PlanId } from "@/lib/plans"

/**
 * Au-dessous de ce nombre de scans, la page n'a pas encore fait ses preuves :
 * proposer de payer revient à demander un chèque avant le premier client. Ce
 * n'est pas de la pudeur, c'est de l'ordre — le geste utile passe d'abord.
 */
export const SEUIL_OFFRE = 30

export type EtatCompte = { plan: PlanId | string; pages: number; scans: number }

export type RaisonOffre = "limite_pages" | "trafic" | null

/**
 * Pourquoi l'offre est pertinente MAINTENANT — ou `null` si elle ne l'est pas.
 *
 *  • `trafic` : la page tourne assez pour que « plus » veuille dire quelque chose ;
 *  • `limite_pages` : le compte détient DÉJÀ plus de pages que son plan n'en
 *    autorise (compte rétrogradé, ancien plan) — là, il est vraiment bloqué.
 *
 * Occuper sa limite n'est pas y buter : quelqu'un qui a la seule page à laquelle
 * il a droit et n'a jamais demandé la deuxième n'est bloqué par rien. Le moment
 * où il bute, c'est quand il clique « Nouvelle page » — c'est là que l'offre a
 * sa place, pas sur son accueil tous les matins.
 *
 * Un compte payant n'est jamais relancé.
 */
export function raisonDeProposer(c: EtatCompte): RaisonOffre {
  if (c.plan !== "free") return null
  const max = PLANS.free.limits.pages
  if (max != null && c.pages > max) return "limite_pages"
  if (c.scans >= SEUIL_OFFRE) return "trafic"
  return null
}

/** La phrase d'accroche : elle dit POURQUOI on en parle, pas « passez à Pro ». */
export function accrocheOffre(raison: RaisonOffre): string | null {
  if (raison === "limite_pages") return "Vous avez plus de pages que votre plan gratuit n'en garde en ligne"
  if (raison === "trafic") return "Votre QR tourne — voici ce que le plan supérieur ajoute"
  return null
}

/**
 * Ce que le plan cible apporte VRAIMENT par rapport au plan actuel, calculé sur
 * `plans.ts` et jamais écrit à la main. Une capacité que les deux plans
 * possèdent (les vues illimitées, par exemple) n'apparaît pas.
 */
export function avantagesEnPlus(de: PlanId, vers: PlanId): string[] {
  const a = PLANS[de], b = PLANS[vers]
  if (!a || !b) return []
  const out: string[] = []

  const plus = (actuel: number | null, cible: number | null, sing: string, plur: string) => {
    if (actuel === cible) return                    // même chose : ce n'est pas un avantage
    if (cible === null) out.push(`${plur} en illimité`)
    else if (actuel === null) return                // on aurait moins : jamais vendu comme un plus
    else if (cible > actuel) out.push(`${cible} ${cible > 1 ? plur : sing}`)
  }
  plus(a.limits.pages, b.limits.pages, "page", "pages")
  plus(a.limits.qr, b.limits.qr, "QR code", "QR codes")
  plus(a.limits.dyn, b.limits.dyn, "QR modifiable après impression", "QR modifiables après impression")
  // `team` ne se lit pas comme les autres : `null` n'y veut pas dire « illimité »
  // mais « pas d'équipe du tout ». Le traiter comme une limite faisait annoncer
  // « places d'équipe en illimité » sur un plan qui n'a pas la fonction.
  if (b.limits.team != null && a.limits.team == null) {
    out.push(`${b.limits.team} places d'équipe`)
  } else if (b.limits.team != null && a.limits.team != null && b.limits.team > a.limits.team) {
    out.push(`${b.limits.team} places d'équipe`)
  }

  const CAPS: [keyof typeof a.caps, string][] = [
    ["removeBranding", "sans la mention QRowg"],
    ["printStudio", "atelier d'impression"],
    ["qrStudioAdvanced", "QR personnalisés"],
    ["dynStatsDetaillees", "statistiques détaillées"],
    ["dynDomaineMarque", "lien court à votre marque"],
    ["ai", "rédaction assistée"],
    ["pageIntro", "animation d'entrée"],
  ]
  for (const [cle, libelle] of CAPS) {
    if (b.caps[cle] === true && a.caps[cle] !== true) out.push(libelle)
  }

  const exA = new Set(a.caps.exportFormats), exB = b.caps.exportFormats.filter(f => !exA.has(f))
  if (exB.length) out.push(`export ${exB.map(f => f.toUpperCase()).join(", ")}`)

  return out
}
