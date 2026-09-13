// tailleQrImprimable.ts — la taille d'un QR imprimé, et la distance à laquelle
// on peut le lire.
//
// Relevé du 13 septembre. L'atelier d'impression portait ce commentaire :
// « Taille EFFECTIVE du QR = palier × curseur fin. Sert au rendu ET au contrôle
// (guard ≥ 20 mm honnête). » La borne basse du curseur était pourtant écrite
// ainsi :
//
//     const qMin = Math.min(qMax * 0.55, Math.max(0.55, Math.min(0.95, 20 / item.qrMm)))
//
// Un `Math.min` entre le plancher et 55 % du maximum de la mise en page : dès que
// la mise en page serre un peu, c'est le second qui gagne et le plancher tombe.
// Mesuré sur les 16 supports du catalogue, toutes pastilles et mises en page
// confondues : **63 combinaisons atteignables sous 20 mm**, la pire à **5,4 mm**.
//
// Cinq millimètres et demi. Sur un sticker que le commerçant fait imprimer, colle
// sur sa vitrine, et qui ne se scannera pas. Il n'a aucun moyen de le savoir
// avant d'avoir payé l'impression.
//
// Un plancher est un plancher. Module PUR, testable seul.

/** En dessous, un QR imprimé ne se lit pas de façon fiable, même de près. */
export const MM_MIN_SCANNABLE = 20

/**
 * Distance de lecture d'un QR, en millimètres : la règle du métier est
 * « côté × 10 ». Un QR de 20 mm se lit à 20 cm — la distance d'une carte tenue
 * en main. Un QR de vitrine, lu à deux mètres, en demande 200.
 */
export function distanceLisibleMm(coteMm: number): number {
  return Math.max(0, coteMm) * 10
}

/** « environ 30 cm », « environ 1,5 m » — pour le dire à côté du curseur. */
export function distanceLisible(coteMm: number): string {
  const mm = distanceLisibleMm(coteMm)
  if (mm < 1000) return `environ ${Math.round(mm / 10)} cm`
  return `environ ${(mm / 1000).toFixed(1).replace(".", ",").replace(",0", "")} m`
}

export type BornesCurseur = {
  /** Facteur minimal du curseur. */
  min: number
  /** Facteur maximal, imposé par la mise en page. */
  max: number
  /** La taille en mm obtenue au minimum. */
  minMm: number
  /**
   * Vrai quand la mise en page ne permet PAS d'atteindre 20 mm : le curseur est
   * alors bloqué à son maximum, et l'écran doit le dire au lieu de laisser
   * descendre en silence.
   */
  troopetit: boolean
}

/**
 * Les bornes du curseur de taille. Le plancher de 20 mm n'est jamais franchi :
 * si la mise en page ne peut pas l'accueillir, on épingle le curseur au maximum
 * et on le signale, plutôt que d'autoriser un code illisible.
 */
export function bornesCurseur(qrMm: number, qMax: number): BornesCurseur {
  const max = Math.max(0.01, qMax)
  const plancher = MM_MIN_SCANNABLE / Math.max(1, qrMm)
  if (plancher >= max) {
    return { min: max, max, minMm: +(qrMm * max).toFixed(1), troopetit: true }
  }
  return { min: plancher, max, minMm: MM_MIN_SCANNABLE, troopetit: false }
}
