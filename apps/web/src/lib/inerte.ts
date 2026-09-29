// inerte.ts — l'attribut HTML `inert`, écrit une fois.
//
// Pourquoi un module pour un attribut. Deux endroits du produit affichent une
// page COMPLÈTE à l'intérieur d'un autre écran : l'aperçu d'un modèle (la
// simulation de téléphone) et la miniature d'une carte de la galerie. Ce sont
// des IMAGES d'une page, pas la page : leurs boutons ne mènent nulle part et
// leurs liens sont des exemples (« https://instagram.com »).
//
// Sans `inert`, le navigateur les considère pourtant comme de vrais contrôles.
// Mesure du 29 septembre, sur l'aperçu de « Bistrot français » : à l'ouverture,
// la fenêtre posait le focus sur le premier élément atteignable qu'elle trouvait
// — un lien Instagram, au fond de la page simulée — et le navigateur faisait
// défiler le téléphone jusqu'à lui. L'aperçu s'ouvrait donc en bas, sur un lien
// mort, avant même qu'on ait vu l'en-tête du modèle.
//
// `inert` retire tout un sous-arbre du parcours au clavier ET de l'arbre
// d'accessibilité — exactement ce qu'on veut dire d'une maquette. React 18 ne
// connaît pas la propriété (elle est typée depuis React 19), d'où l'objet prêt à
// étaler plutôt qu'un `as any` recopié à chaque appel.
//
// Module PUR.

/**
 * À étaler sur l'élément racine d'un sous-arbre décoratif :
 *
 *     <div aria-hidden="true" {...inerte}> … </div>
 *
 * Se lit avec `estInerte()` — et, pour le clavier, `useDialogue` saute tout ce
 * qui vit sous un `[inert]`.
 */
// `inert: true`, pas `inert: ""`. React 18 connaît `inert` comme un attribut
// BOOLÉEN : une chaîne vide y vaut `false`, l'attribut n'est alors pas écrit du
// tout, et le navigateur ne rend rien inerte. Mesure au navigateur le
// 29 septembre : « Received an empty string for a boolean attribute `inert` ».
// La propriété n'est typée que depuis React 19, d'où la conversion.
export const inerte = { inert: true } as unknown as { inert?: boolean }

/** Sélecteur des sous-arbres inertes (piège de focus, tests). */
export const SELECTEUR_INERTE = "[inert]"

/** Cet élément est-il dans un sous-arbre inerte ? */
export function estInerte(el: Element | null | undefined): boolean {
  return !!el && !!el.closest(SELECTEUR_INERTE)
}
