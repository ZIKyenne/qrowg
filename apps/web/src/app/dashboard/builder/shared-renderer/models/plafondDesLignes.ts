// plafondDesLignes — le panneau ne propose pas une ligne que la page ne rendra pas.
//
// Relevé du 21 septembre, en préparant la suite du lot v144. Le répéteur de
// l'éditeur porte un plafond, et il porte SA RAISON, écrite :
//
//     const MAX = 50 // plafond aligne sur les renderers (Array.from({length:50}))
//                    // -> aucun item cree mais non rendu
//
// « Aucun item créé mais non rendu » : c'est la promesse. **Elle est fausse.**
// Les rendus publics n'ont pas tous le même plafond. Trente-quatre d'entre eux
// posent le leur, en clair, dans leur propre fichier :
//
//     testimonials      3       columns_text      3       steps_horizontal  4
//     lineup            4       image_mosaic      5       icon_row          6
//     avatar_row        6       anchor_nav        6       engagements       6
//     stack_cards       6       compare_two       8       progress_bars     8
//     free_grid         9       logo_marquee     10       numbered_list    10
//     faq               8       checklist        12       definition_list  12
//     menu_tabs        20       …et seize autres à 50.
//
// Deux blocs confiés au répéteur étaient déjà dans ce cas :
//
//   icon_row    le rendu s'arrête à SIX points forts ; le panneau en proposait
//               cinquante. C'est le lot v144 qui l'y a confié — le défaut vient
//               de là, et il est réparé ici.
//   menu_tabs   le rendu s'arrête à VINGT sections ; même écart.
//
// Un bouton « Ajouter un point fort » qui ajoute un septième point fort que la
// page ne montrera jamais n'est pas une gêne : c'est une promesse fausse, et
// elle est invisible — rien ne prévient, la ligne se remplit, et elle
// disparaît à la publication.
//
// La classe : **le panneau s'arrête là où la page s'arrête.**
//
// Ce module est le seul endroit où ce nombre est écrit. Les rendus le lisent,
// le répéteur le lit, et une garde vérifie qu'aucun des deux ne reprend un
// nombre en clair.

/**
 * Le plafond de droit commun. Les rendus qui n'en déclarent pas d'autre
 * s'arrêtent là — cinquante lignes d'un même bloc, personne n'en écrit plus.
 */
export const PLAFOND_PAR_DEFAUT = 50

/**
 * Ce que chaque rendu public accepte réellement. **Mesuré dans son fichier, pas
 * décidé ici** : ce tableau recopie ce que le produit fait déjà, et le rend
 * lisible des deux côtés. Baisser une valeur retirerait une capacité ; la
 * monter obligerait d'abord à changer le rendu.
 */
// Lot v150 : sept blocs de plus. Leur rendu n'avait PAS de plafond — il écrivait
// ses emplacements un par un (`amount1`, `amount2`, `amount3`), donc il n'en
// aurait jamais eu un de plus. Ils bouclent maintenant, sur le nombre qu'ils
// déclaraient déjà : aucune capacité ajoutée, aucune retirée, et l'éditeur peut
// enfin réordonner et supprimer ces lignes.
export const PLAFOND_DES_LIGNES: Readonly<Record<string, number>> = {
  anchor_nav: 6,
  avatar_row: 6,
  checklist: 12,
  columns_text: 3,
  compare_two: 8,
  definition_list: 12,
  engagements: 6,
  event_access: 3,
  faq: 8,
  gift_card: 3,
  grid_section: 6,
  free_grid: 9,
  icon_row: 6,
  image_mosaic: 5,
  journey: 4,
  lineup: 4,
  logo_marquee: 10,
  menu_tabs: 20,
  merch: 3,
  numbered_list: 10,
  offer_comparison: 3,
  pricing: 3,
  progress_bars: 8,
  stack_cards: 6,
  steps_horizontal: 4,
  testimonials: 3,
}

/** Combien de lignes ce bloc rend — et donc combien le panneau peut en offrir. */
export function plafondDesLignes(type: string): number {
  return PLAFOND_DES_LIGNES[type] ?? PLAFOND_PAR_DEFAUT
}
