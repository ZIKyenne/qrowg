// prochaineEtape.ts — le conseil de l'accueil, quand le client revient.
//
// Relevé du 11 septembre, banc d'essai « retour » (une page publiée il y a trois
// jours, 3 scans, 4 vues) : l'accueil conseillait « Créez une 2ᵉ page pour un
// autre usage (menu, événement, promo). »
//
// Le conseil était piloté par `pages.length === 1`, c'est-à-dire par un compte
// d'objets, pas par la situation du client. Or sa première page ne tourne pas
// encore : lui en faire fabriquer une deuxième, c'est doubler le travail non
// rentabilisé et retarder le seul geste qui compte — sortir le QR du logiciel et
// le mettre devant des gens. On ne propose d'élargir qu'une fois le premier
// support installé. Module PUR, testable seul.

/**
 * En dessous de ce nombre de scans, la première page n'a pas encore trouvé son
 * public : le geste utile est de la diffuser, pas d'en créer une autre.
 */
export const SEUIL_PAGE_LANCEE = 10

export type Etape = "diffuser" | "elargir" | "imprimer"

/**
 * Quelle est la seule chose à faire ensuite ?
 * - `diffuser` : la page est en ligne mais personne ne la scanne encore.
 * - `elargir`  : elle tourne, et c'est la seule — une deuxième a du sens.
 * - `imprimer` : plusieurs pages qui tournent — le levier suivant est le support.
 */
export function prochaineEtape(compte: { pagesPubliees: number; pages: number; scans: number }): Etape {
  if (compte.pagesPubliees > 0 && compte.scans < SEUIL_PAGE_LANCEE) return "diffuser"
  if (compte.pages === 1) return "elargir"
  return "imprimer"
}
