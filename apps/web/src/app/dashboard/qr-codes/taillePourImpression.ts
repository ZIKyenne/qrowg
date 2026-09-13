// taillePourImpression.ts — des pixels, alors que le commerçant imprime des
// centimètres.
//
// Relevé du 13 septembre, sur l'écran d'export du QR Studio — le chemin par
// lequel passe tout le monde pour récupérer son QR. Le panneau « Taille » offre
// quatre boutons — 512px, 1024px, 2048px, 4096px — et, sous eux, une seule
// ligne :
//
//     Export : 1024×1024px
//
// C'est tout. Rien ne relie ces pixels à la seule question que se pose celui qui
// va imprimer : « ça fait quelle taille sur mon autocollant ? ».
//
// Le produit connaît pourtant la réponse, et se l'applique ailleurs :
//
//   · `qr-codes/printPreflight.ts` note la résolution — 300 DPI « qualité
//     imprimeur », 150 DPI « correct pour un tirage rapide », en dessous
//     « trop faible pour l'impression » ;
//   · `qr-codes/exportPlan.ts` sait déjà convertir (`exportWidthPx`,
//     `recommendedDpi`) ;
//   · `print-studio/tailleQrImprimable.ts` (lot v74) connaît le plancher de
//     20 mm en dessous duquel un QR ne se scanne plus.
//
// Un commerçant qui prend « 512px » — le premier bouton — et le fait tirer en
// autocollant de 10 cm imprime à 130 DPI : sous le seuil que le produit
// lui-même appelle « trop faible pour l'impression ». Personne ne le lui dit.
//
// Ce module fait la conversion dans les deux sens, avec les seuils du produit.
// Module PUR.

import { MM_MIN_SCANNABLE } from "../print-studio/tailleQrImprimable"

/** Les deux qualités que `printPreflight` note déjà. Une seule source. */
export const DPI_IMPRIMEUR = 300
export const DPI_TIRAGE_RAPIDE = 150

const POUCE_MM = 25.4

/** Le côté imprimable, en millimètres, d'une image de `px` pixels à cette résolution. */
export function mmPour(px: number, dpi: number): number {
  if (!(px > 0) || !(dpi > 0)) return 0
  return (px / dpi) * POUCE_MM
}

/** Les pixels qu'il faut pour imprimer `mm` millimètres à cette résolution. */
export function pxPour(mm: number, dpi: number): number {
  if (!(mm > 0) || !(dpi > 0)) return 0
  return Math.ceil((mm / POUCE_MM) * dpi)
}

/** « 8,7 cm », « 43 mm » — l'unité dans laquelle on pense à cette échelle. */
export function formatTaille(mm: number): string {
  if (!(mm > 0)) return "—"
  if (mm < 100) return `${Math.round(mm)} mm`
  return `${(mm / 10).toFixed(1).replace(".", ",").replace(",0", "")} cm`
}

/**
 * Ce qu'un fichier de `px` pixels donne à l'impression : la taille en qualité
 * imprimeur, et celle qu'on peut encore se permettre en tirage rapide.
 */
export function phraseTaille(px: number): string {
  const pro = mmPour(px, DPI_IMPRIMEUR)
  const rapide = mmPour(px, DPI_TIRAGE_RAPIDE)
  return `${formatTaille(pro)} de côté chez un imprimeur, jusqu'à ${formatTaille(rapide)} en tirage rapide`
}

export type VerdictImpression =
  | { qualite: "imprimeur" | "rapide"; phrase: string }
  | { qualite: "insuffisante" | "trop_petit"; phrase: string }

/**
 * Le jugement, quand le commerçant a dit la taille qu'il veut imprimer.
 *
 * Les seuils ne sont pas inventés ici : ce sont ceux que `printPreflight`
 * applique déjà à un fichier, et le plancher de scannabilité du lot v74.
 */
export function verdictImpression(px: number, mmVoulus: number): VerdictImpression {
  if (mmVoulus > 0 && mmVoulus < MM_MIN_SCANNABLE) {
    return {
      qualite: "trop_petit",
      phrase: `${formatTaille(mmVoulus)}, c'est sous le plancher de ${MM_MIN_SCANNABLE} mm : le QR ne se scannera pas, quelle que soit la résolution.`,
    }
  }
  const dpi = mmVoulus > 0 ? Math.floor(px / (mmVoulus / POUCE_MM)) : 0
  if (dpi >= DPI_IMPRIMEUR) return { qualite: "imprimeur", phrase: `${dpi} DPI à cette taille — qualité imprimeur.` }
  if (dpi >= DPI_TIRAGE_RAPIDE) return { qualite: "rapide", phrase: `${dpi} DPI à cette taille — correct pour un tirage rapide ; viser ${DPI_IMPRIMEUR} DPI.` }
  return {
    qualite: "insuffisante",
    phrase: `${dpi} DPI à cette taille — trop faible pour l'impression. Prenez ${pxPour(mmVoulus, DPI_IMPRIMEUR)} px pour ${formatTaille(mmVoulus)}.`,
  }
}

/** Les tailles proposées par l'écran d'export, dans l'ordre. */
export const TAILLES_PROPOSEES = [512, 1024, 2048, 4096] as const

/**
 * La plus petite taille proposée qui imprime `mm` en qualité imprimeur. Null
 * quand aucune ne suffit : on ne fait pas croire qu'un bouton fera l'affaire.
 */
export function tailleConseillee(mm: number): number | null {
  if (!(mm > 0)) return null
  const besoin = pxPour(mm, DPI_IMPRIMEUR)
  return TAILLES_PROPOSEES.find(t => t >= besoin) ?? null
}
