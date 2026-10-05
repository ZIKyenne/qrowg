// Le moteur de la feuille montante. Pur, donc testable sans navigateur.
//
// ── Ce qui existait déjà, et qu'on ne réinvente pas ────────────────────────
//
// `app/dashboard/builder/builderMobile.ts` porte depuis juillet 2026 un moteur
// de feuille complet : trois paliers, la réaction au clavier, la répartition
// des safe areas, et même une hiérarchie de retour arrière (`resolveBackAction`).
// Il est pur, testé, et il a été réglé avec de vraies captures sur un vrai
// iPhone.
//
// Il n'avait qu'un défaut : il vivait sous `dashboard/builder/`, donc un seul
// écran sur dix-huit en profitait.
//
// Ce fichier NE recopie PAS ses valeurs au jugé. Les fractions 0,42 / 0,66 /
// 0,94 viennent de là et sont reprises telles quelles : les changer pour les
// « jolis » 0,38 / 0,58 / 0,84 que j'avais écrits dans la feuille de route
// aurait modifié le comportement d'un écran validé par l'utilisateur, sans
// qu'aucune mesure ne le justifie.
//
// ── Ce que ce fichier ajoute ───────────────────────────────────────────────
//
// Le GESTE. La poignée de la feuille du builder est marquée « décoratif » :
// elle a l'air de se tirer et ne se tire pas. Une poignée qui ment coûte plus
// cher qu'une poignée absente — on essaie, il ne se passe rien, on conclut que
// l'interface est cassée. Les règles de glissement sont ici, et les boutons de
// palier restent : le geste n'est jamais le SEUL chemin.

/** Les trois paliers. Noms conservés : les renommer n'aurait rien réglé. */
export type TailleFeuille = "compact" | "medium" | "expanded"

/** Fractions de la hauteur disponible. Valeurs héritées de `builderMobile.ts`. */
export const FRACTION_TAILLE: Record<TailleFeuille, number> = {
  compact: 0.42,
  medium: 0.66,
  expanded: 0.94,
}

/** Les paliers, du plus bas au plus haut. L'ordre sert au glissement. */
export const PALIERS: readonly TailleFeuille[] = ["compact", "medium", "expanded"]

/**
 * Hauteur en pixels, bornée. Le plancher de 160 px vient de `snapHeight` :
 * en dessous, la feuille n'a plus la place d'afficher son en-tête ET une ligne
 * de contenu, et elle ne sert plus à rien.
 */
export function hauteurDeFeuille(taille: TailleFeuille, disponible: number): number {
  const h = Math.round(disponible * FRACTION_TAILLE[taille])
  return Math.max(160, Math.min(Math.max(0, disponible), h))
}

/**
 * Hauteur utile sous le clavier virtuel. Bornée à zéro : sur iOS, pendant
 * l'animation d'ouverture du clavier, `visualViewport` rend brièvement des
 * valeurs qui donneraient une hauteur négative.
 */
export function hauteurUtile(hauteurViewport: number, hauteurClavier: number): number {
  return Math.max(0, hauteurViewport - Math.max(0, hauteurClavier))
}

// ── Le glissement ──────────────────────────────────────────────────────────

/**
 * Seuil de fermeture : un tiers de la hauteur de la feuille, borné.
 *
 * Pourquoi relatif et non fixe : une feuille `compact` de 300 px et une
 * `expanded` de 800 px ne se ferment pas du même geste. Un seuil fixe de 120 px
 * ferme la petite par accident et rend la grande impossible à fermer d'une
 * main.
 *
 * Les bornes empêchent les deux extrêmes : moins de 60 px, le geste part au
 * moindre tremblement ; plus de 200 px, il faut traverser l'écran.
 */
export function seuilDeFermeture(hauteurFeuille: number): number {
  return Math.max(60, Math.min(200, Math.round(hauteurFeuille / 3)))
}

/** Le glissement vers le bas ferme-t-il ? `deltaY` positif = vers le bas. */
export function glissementFerme(deltaY: number, hauteurFeuille: number): boolean {
  return deltaY >= seuilDeFermeture(hauteurFeuille)
}

/**
 * Où retombe la feuille après un glissement qui ne l'a pas fermée.
 *
 * Vers le bas, on descend d'un palier ; vers le haut, on monte d'un palier.
 * Au-delà d'un demi-seuil seulement : sous cette amplitude, c'est un tremblement
 * de doigt pendant un défilement, pas une intention.
 */
export function tailleApresGlissement(
  taille: TailleFeuille,
  deltaY: number,
  hauteurFeuille: number,
): TailleFeuille {
  const minimum = seuilDeFermeture(hauteurFeuille) / 2
  if (Math.abs(deltaY) < minimum) return taille
  const i = PALIERS.indexOf(taille)
  const suivant = deltaY > 0 ? i - 1 : i + 1
  return PALIERS[Math.max(0, Math.min(PALIERS.length - 1, suivant))]
}

/**
 * Le glissement doit-il être pris en charge par la feuille, ou laissé au
 * contenu ?
 *
 * C'est la règle qui évite le défaut le plus pénible des feuilles montantes :
 * on fait défiler une liste, on arrive en haut, on continue — et la feuille se
 * ferme alors qu'on voulait lire. Elle ne se déplace que si le contenu est
 * DÉJÀ en haut de son défilement et que le geste va vers le bas.
 */
export function laFeuilleSuitLeDoigt(defilementDuContenu: number, deltaY: number): boolean {
  if (deltaY <= 0) return false            // vers le haut : c'est au contenu
  return defilementDuContenu <= 0          // vers le bas, seulement en haut de liste
}

// ── La pile ────────────────────────────────────────────────────────────────

/**
 * Une seule feuille ouverte à la fois.
 *
 * Deux feuilles superposées sur un téléphone de 390 px, c'est deux scrims, deux
 * pièges de focus, et un bouton retour qui ne sait plus quoi fermer. La demande
 * d'ouverture d'une seconde REMPLACE la première au lieu de l'empiler.
 */
export function ouvrir<T extends string>(_courante: T | null, demandee: T): T {
  return demandee
}

/**
 * Ce que doit faire le retour arrière. Reprend la hiérarchie établie dans
 * `builderMobile.ts` (`resolveBackAction`), généralisée hors du builder.
 */
export type ActionRetour = "fermerFeuille" | "quitterPleinEcran" | "partir"
export function actionDeRetour(ctx: { feuilleOuverte?: boolean; pleinEcran?: boolean }): ActionRetour {
  if (ctx.feuilleOuverte) return "fermerFeuille"
  if (ctx.pleinEcran) return "quitterPleinEcran"
  return "partir"
}
