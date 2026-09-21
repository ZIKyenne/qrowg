// schemaDeLien.ts — quels schémas d'adresse le produit accepte, à UN endroit.
//
// La règle vivait dans `app/dashboard/builder/types.ts`, écrite pour les liens
// d'une page publiée : quatre schémas admis, tout le reste refusé. Le lot v159 a
// montré ce que coûte une règle d'adresse qu'on recopie — le bloc Spotify avait
// sa propre version, plus permissive, et elle laissait passer `javascript:`.
//
// Elle est donc posée ici, et les deux endroits qui en ont besoin la prennent :
// les liens d'une page publiée (`destinationUtile`) et les boutons des e-mails
// que le produit envoie (`lib/emailLayout`). Un e-mail n'est pas une page, mais
// un lecteur y clique de la même façon, et un client de messagerie n'a pas de
// politique de sécurité de contenu pour rattraper quoi que ce soit.

/** Une adresse qui écrit un schéma : `nom:` en tête. */
export const SCHEMA_ECRIT = /^[a-z][a-z0-9+.-]*:/i

/** Les quatre schémas admis. Tout le reste est refusé. */
export const SCHEMAS_ADMIS = /^(https?:|mailto:|tel:|sms:)/i

/**
 * Le schéma de cette adresse est-il admis ?
 *
 * Une adresse SANS schéma (« exemple.fr/x », « /interne », « #ancre ») passe :
 * elle ne peut rien exécuter, et c'est à l'appelant de la compléter s'il veut un
 * lien absolu — `destinationUtile` le fait pour les pages publiées.
 */
export function schemaAdmis(url: unknown): boolean {
  const u = typeof url === "string" ? url.trim() : ""
  if (!u) return false
  return !SCHEMA_ECRIT.test(u) || SCHEMAS_ADMIS.test(u)
}
