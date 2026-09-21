// descriptionQuiTient — une description coupée ne distingue plus rien.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F10, premier volet) :
// « plusieurs descriptions finissent par des points de suspension : Rangée
// d'icônes, Encadré d'emphase, Séparateur de forme, Logos défilants. Les noms
// demandent déjà une interprétation. »
//
// Mesuré dans le catalogue : **cent quatre-vingt-deux descriptions de blocs**,
// médiane 32 caractères, la plus longue 64. Et le catalogue les coupe à **une
// seule ligne**, à six endroits :
//
//     whiteSpace: "nowrap", textOverflow: "ellipsis"
//
// **Le produit sait déjà faire autrement.** `BlockLibraryCard` — la carte de la
// bibliothèque refondue, même produit, même écran — leur donne DEUX lignes :
//
//     display: "-webkit-box", WebkitLineClamp: 2
//
// Deux lignes tiennent la plus longue des cent quatre-vingt-deux. Une ligne n'en
// tient pas la moitié. Le nom d'un bloc fait quatorze caractères en médiane —
// « Rangée d'icônes », « Encadré » — et ne suffit donc pas à choisir ; la
// description est ce qui reste, et c'est elle qu'on coupait.
//
// La classe : **une description coupée ne distingue plus rien.**
//
// Ce module ne fait qu'une chose : dire combien de lignes une description
// reçoit, et à partir de quelle longueur elle déborde. Le cliquet vit ici,
// nommé, plutôt que dans six feuilles de style qui ne se parlent pas.

import type { CSSProperties } from "react"

/** Deux lignes : ce que `BlockLibraryCard` donnait déjà, et ce qui suffit. */
export const LIGNES_DE_DESCRIPTION = 2

/**
 * Au-delà, deux lignes ne suffiraient plus à la colonne de 260 px du
 * catalogue. La plus longue description du produit en fait 64 : ce plafond est
 * un CLIQUET — il empêche d'en écrire une que l'écran recouperait, il
 * n'autorise pas à rallonger les autres.
 */
export const DESCRIPTION_MAX = 70

/**
 * Les deux planchers de lecture du produit, écrits le 4 septembre avec leur
 * raison et jusqu'ici vérifiés sur une LISTE DE CAS NOMMÉS (`lisibilite.test.ts`) :
 *
 *   13 px  une description sur la page publiée — « le texte qu'on lit à table,
 *          au téléphone, souvent en lumière basse, souvent après 40 ans ».
 *   12 px  une description dans l'éditeur ou sur le site — le relevé nommait
 *          déjà « éditeur 10,5 px (descriptions de blocs) ».
 *
 * Une liste de huit cas n'est pas un plancher : dix-huit autres endroits étaient
 * sous la règle sans être vus. Ils sont ici pour que la garde les balaie tous.
 */
export const PLANCHER_PAGE_PUBLIEE = 13
export const PLANCHER_DE_LECTURE = 12

/** Le style d'une description de bloc dans le catalogue. */
export function styleDeDescription(taille: number = PLANCHER_DE_LECTURE): CSSProperties {
  return {
    margin: 0,
    fontSize: taille,
    lineHeight: 1.35,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: LIGNES_DE_DESCRIPTION,
    WebkitBoxOrient: "vertical" as const,
  }
}

/** Une description que deux lignes ne tiendraient plus. */
export function descriptionTropLongue(texte: string | null | undefined): boolean {
  return (texte ?? "").trim().length > DESCRIPTION_MAX
}
