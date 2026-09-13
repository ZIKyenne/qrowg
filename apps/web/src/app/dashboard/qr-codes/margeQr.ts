// margeQr.ts — la marge blanche d'un QR code, comptée en modules.
//
// Relevé du 13 septembre. QRowg publie un testeur de QR code
// (`/outils/testeur-qr-code`) qui écrit, noir sur blanc :
//
//     « La norme demande quatre modules ; c'est la première chose que les gens
//       suppriment en recadrant, et c'est une des premières causes de code
//       illisible. »
//
// Son propre générateur exprime pourtant cette marge en PIXELS — `margin: 10`
// par défaut, réglable de 0 à 30 px — c'est-à-dire dans une unité qui n'a aucun
// rapport avec le module. Mesuré sur les charges réelles du produit (lien court,
// lien de page, domaine du client), aux tailles d'export proposées :
//
//     400 px, marge 10 px (défaut)   → 0,66 à 0,97 module
//     400 px, marge 30 px (maximum)  → 2,2 à 3,3 modules
//     400 px, marge 0 px (minimum)   → 0 module
//     1000 px, marge 10 px           → 0,26 à 0,38 module
//
// Autrement dit : le produit ne pouvait produire AUCUN code conforme, pas même
// en poussant le curseur à fond. Et plus on exporte grand, pire c'est — la marge
// est en pixels quand les modules, eux, rétrécissent.
//
// Passé dans le testeur de QRowg lui-même, l'export par défaut est classé
// « risque · La marge blanche est trop courte », et l'export en 1000 px
// « bloquant · Le code n'a plus de marge ». Le produit échouait à son propre
// contrôle.
//
// Ce module compte en modules. PUR, testable seul.

/** Ce que la norme ISO/IEC 18004 demande, et ce que le testeur de QRowg vérifie. */
export const MODULES_SILENCE = 4

export type Ecc = "L" | "M" | "Q" | "H"

/**
 * Capacité maximale en octets (mode binaire) par version, de 1 à 20 — au-delà,
 * aucune URL réaliste. Table vérifiée dans `margeQr.test.ts` contre l'encodeur
 * réellement embarqué : elle n'est pas recopiée de mémoire.
 */
const CAPACITE: Record<Ecc, number[]> = {
  L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858],
  M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666],
  Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482],
  H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382],
}

/** Le côté d'une version, en modules : 21, 25, 29… */
export function modulesDeVersion(version: number): number {
  return 17 + 4 * Math.max(1, Math.min(40, Math.round(version)))
}

/**
 * Le nombre de modules du code qui portera cette charge. On prend la première
 * version qui l'accueille ; au-delà de la table, la plus grande qu'elle connaît
 * — la marge calculée est alors un peu large, jamais trop courte.
 */
export function modulesPourCharge(charge: string, ecc: Ecc = "M"): number {
  const octets = new TextEncoder().encode(charge || "").length
  const table = CAPACITE[ecc] ?? CAPACITE.M
  const i = table.findIndex(c => octets <= c)
  return modulesDeVersion(i === -1 ? table.length : i + 1)
}

/**
 * La marge, en pixels, pour que le silence fasse `silence` modules sur une image
 * de `taillePx` de côté.
 *
 * Le code et ses deux marges partagent l'image : `taille = (modules + 2·silence)
 * × module`. D'où `marge = silence × taille / (modules + 2·silence)`. C'est
 * l'inversion que le réglage en pixels ne faisait pas — et c'est pour cela
 * qu'agrandir l'export dégradait la marge au lieu de la conserver.
 */
export function margePx(taillePx: number, modules: number, silence: number = MODULES_SILENCE): number {
  const t = Math.max(1, taillePx)
  const n = Math.max(1, modules)
  const s = Math.max(0, silence)
  return Math.round((s * t) / (n + 2 * s))
}

/** Le silence réellement obtenu, en modules — pour vérifier, et pour l'afficher. */
export function silenceObtenu(taillePx: number, margePixels: number, modules: number): number {
  const t = Math.max(1, taillePx), n = Math.max(1, modules)
  const codePx = t - 2 * margePixels
  if (codePx <= 0) return 0
  return +(margePixels / (codePx / n)).toFixed(2)
}

/** La marge à appliquer pour une charge donnée : la réponse directe. */
export function margePourCharge(taillePx: number, charge: string, ecc: Ecc = "M", silence: number = MODULES_SILENCE): number {
  return margePx(taillePx, modulesPourCharge(charge, ecc), silence)
}
