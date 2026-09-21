// annonceAuLecteur — un message qui apparaît tout seul se fait annoncer.
//
// Relevé du 20 septembre. Le produit montre **trente** messages qui surgissent
// d'un état : « ✓ Style copié », « Ce sous-domaine est déjà pris », « Échec :
// … », le résultat d'un import CSV. Rien d'autre ne bouge à l'écran — un texte
// apparaît, et c'est toute la réponse du produit au geste qu'on vient de faire.
//
// **Quatre portaient le geste**, et ils disaient déjà lequel : les trois écrans
// d'authentification, et le refus d'enregistrer les notifications dans
// `dashboard/settings`. **Vingt-six ne le portaient pas** — dont, dans le même
// composant `settings/page.tsx`, trente lignes plus haut, le refus de changer
// le mot de passe, et plus bas celui de supprimer le compte.
//
// Pour quelqu'un qui n'a pas les yeux sur l'écran, un texte qui apparaît sans
// être annoncé n'apparaît pas. Le commerçant aveugle clique « Coller »,
// n'entend rien, et reclique. Il clique « Enregistrer », n'entend rien, et se
// demande si c'est parti. Le produit a répondu ; il ne l'a simplement dit à
// personne.
//
// La classe : **un message qui apparaît tout seul se fait annoncer.**
//
// Ce module ne rend rien et ne dessine rien — chaque écran garde son style. Il
// ne réunit que ce qui doit être dit, comme `propsInterrupteur` (lot v124). Les
// quatre qui portaient déjà le geste passent par lui plutôt que d'en garder une
// copie : c'est d'une copie devenue muette que venait l'écart de `settings`.

export type TonDAnnonce = "info" | "succes" | "erreur"

export type PropsAnnonce =
  | { role: "status"; "aria-live": "polite" }
  | { role: "alert" }

/**
 * Ce qu'un message annonce de lui-même.
 *
 * `role="status"` avec `aria-live="polite"` attend une pause avant de parler :
 * c'est ce qu'il faut pour une confirmation, qui ne doit pas couper la lecture
 * en cours. `role="alert"` est assertif par nature — il interrompt — et c'est ce
 * qu'il faut pour un refus, que la personne doit entendre avant de continuer à
 * remplir un formulaire qui ne partira pas.
 */
export function propsAnnonce(ton: TonDAnnonce = "info"): PropsAnnonce {
  return ton === "erreur" ? { role: "alert" } : { role: "status", "aria-live": "polite" }
}
