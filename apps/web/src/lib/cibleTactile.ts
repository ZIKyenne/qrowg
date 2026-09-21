// cibleTactile — ce qu'on touche du doigt a la taille d'un doigt.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F19, second volet). Le
// produit connaît la règle et l'écrit en prose, à trois endroits, avec trois
// nombres :
//
//   components/ui/PageHeader.tsx:36   « 44 px de haut : c'est le chemin de
//                                       retour de la page (cible tactile). »
//   components/ui/Button.tsx:7        « cible tactile md = 46px »
//   components/barreMobileCalme.test  « chaque tuile fait au moins 44 px »
//
// Trois copies d'une même intention, et une garde qui ne couvre qu'une surface
// — la barre mobile. Ailleurs, personne ne vérifie.
//
// **Dix-huit commandes déclarent une taille sous 24 px.** Mais la règle
// (WCAG 2.5.8, niveau AA) n'est pas « tout doit faire 24 » : une cible plus
// petite passe quand même si un disque de 24 px centré sur elle ne rencontre
// aucun autre disque — c'est l'exception d'ESPACEMENT. Appliquée honnêtement,
// elle innocente la plupart des cas relevés :
//
//   interrupteurs 20-23 px   un par ligne de réglages : rien autour
//   pastilles de couleur     22 px, écart 5 → centres à 27 px, soit plus de 24
//   croix isolées 22 px      seules dans leur coin
//
// **Quatre ne passent pas, et deux sont sur la page du visiteur** — celle qu'on
// ouvre en scannant un QR, au téléphone, souvent debout :
//
//   [slug]/blocsPublics:395    les pastilles du carrousel photo : 7 × 7 px,
//                              écart 6. Centres à 13 px. Un doigt en couvre
//                              trois. C'est le seul moyen d'atteindre la photo
//                              n° 4 d'une galerie.
//   [slug]/blocsPublics:765    « Fermer l'annonce » : 22 px, deux de trop.
//   print-studio:2452          les variantes d'un modèle : 16 px, écart 4.
//   print-studio:1947          la croix d'un filtre actif : 14 px.
//
// La classe : **ce qu'on touche du doigt a la taille d'un doigt** — 24 px au
// plancher, l'exception d'espacement comprise, et 44 px quand c'est une
// commande qu'on vise vraiment.
//
// Module PUR : il ne dessine rien. `zoneDeTouche` agrandit la zone SENSIBLE
// sans toucher au dessin, qui reste à l'intérieur.

import type { CSSProperties } from "react"

/** WCAG 2.5.8 (AA) : 24 × 24 pixels CSS, exception d'espacement comprise. */
export const CIBLE_MIN = 24

/**
 * Ce que le produit vise déjà quand il y pense : 44 px. Ce n'est pas le seuil
 * AA — l'annoncer comme tel serait faux — c'est le confort qu'il s'est donné
 * pour le chemin de retour, ses boutons et sa barre mobile.
 */
export const CIBLE_CONFORT = 44

export type Taille = { largeur: number; hauteur: number }

/**
 * La cible passe-t-elle la règle ?
 *
 * @param taille       la zone sensible, en pixels CSS.
 * @param ecartVoisin  distance entre les BORDS de cette cible et de la plus
 *                     proche voisine — le `gap` du conteneur, quand il y en a
 *                     un. `null` ou absent : la cible est isolée.
 *
 * L'exception d'espacement raisonne sur des disques de 24 px de diamètre
 * centrés sur chaque cible : deux disques se rencontrent quand la distance
 * entre les CENTRES est inférieure à 24. Pour deux cibles identiques posées
 * côte à côte, cette distance vaut la taille plus l'écart.
 */
export function cibleSuffisante(taille: Taille, ecartVoisin?: number | null): boolean {
  const { largeur, hauteur } = taille
  if (largeur >= CIBLE_MIN && hauteur >= CIBLE_MIN) return true
  if (ecartVoisin == null) return true            // rien autour : l'exception s'applique
  const entreCentres = Math.min(largeur, hauteur) + ecartVoisin
  return entreCentres >= CIBLE_MIN
}

/**
 * Une zone sensible d'au moins `CIBLE_MIN`, autour d'un dessin plus petit qui
 * ne change pas.
 *
 * Le dessin va à l'intérieur — une pastille, une croix, un carré de couleur —
 * et garde sa taille. C'est le bouton qui grandit, pas ce qu'on voit. On ne
 * rattrape PAS la place perdue par une marge négative : deux zones sensibles
 * qui se chevauchent sont exactement ce que la règle interdit.
 */
export function zoneDeTouche(largeurDuDessin = 0, hauteurDuDessin = largeurDuDessin): CSSProperties {
  return {
    width: Math.max(largeurDuDessin, CIBLE_MIN),
    height: Math.max(hauteurDuDessin, CIBLE_MIN),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: 0,
    background: "none",
    border: "none",
    cursor: "pointer",
  }
}
