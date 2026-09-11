// sourceParDefaut.ts — le domaine de départ proposé par le formulaire de redirection.
//
// Relevé du 11 septembre, banc d'essai « aucun domaine » : le champ « Source »
// s'initialisait à `userDomains[0] ?? ""`. Sans domaine connecté, l'état valait
// la chaîne vide — mais le menu déroulant, lui, contient toujours l'option de
// repli « qrowg.com (sous-domaine) », et un <select> dont la valeur ne
// correspond à aucune option affiche sa PREMIÈRE option.
//
// L'utilisateur lisait donc « qrowg.com » dans le champ, tandis que l'aperçu
// juste en dessous affichait « → URL source : /chemin » et que l'enregistrement
// serait parti avec un domaine vide. Ce que l'écran montre et ce qu'il retient
// doivent être la même chose. Module PUR, testable seul.

/** Le sous-domaine QRowg, toujours présent dans la liste : c'est le repli légitime. */
export const SOUS_DOMAINE_QROWG = "qrowg.com"

/**
 * Le domaine proposé par défaut. Jamais la chaîne vide : la valeur retournée
 * existe toujours parmi les options du menu.
 */
export function sourceParDefaut(domainesDuCompte: readonly string[]): string {
  const premier = domainesDuCompte.find(d => d.trim().length > 0)
  return premier ?? SOUS_DOMAINE_QROWG
}
