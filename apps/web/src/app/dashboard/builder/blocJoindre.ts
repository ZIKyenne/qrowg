// blocJoindre.ts — pouvoir joindre le commerce, depuis la page qu'on vient de scanner.
//
// Relevé du 12 septembre, en comptant les blocs des 48 modèles (34 de la galerie
// + ceux du studio) :
//
//     43 modèles sur 48 ne contiennent AUCUN bloc pour joindre le commerce.
//
// Ni bouton d'appel, ni e-mail, ni WhatsApp, ni formulaire. `studio_gastro`
// aligne dix-huit blocs et aucun ne permet d'appeler le restaurant. Le lot v72 a
// montré que 19 pages de démonstration sur 34 n'offraient aucune action au
// premier écran ; en voici la racine : pour l'action la plus élémentaire — passer
// un appel —, le bloc n'est pas dans le modèle du tout.
//
// Et l'effet se propage : l'assistant de modèle dérive ses questions des blocs
// PRÉSENTS. Pas de bouton d'appel dans le modèle ⟹ aucune question sur le
// téléphone ⟹ le commerçant répond à tout, publie, et son client ne peut pas
// l'appeler. Personne ne lui a jamais demandé son numéro.
//
// La règle, conforme à la doctrine du lot v63 : on donne la PLACE et le TITRE,
// jamais l'affirmation. Le bouton arrive avec son libellé et sans numéro — donc
// annoncé vide dans l'éditeur (lot v72), repris dans la liste d'avant
// publication, et surtout : l'assistant demande enfin le numéro.
//
// Module PUR, testable seul.

/** Les blocs par lesquels un visiteur peut joindre le commerce. */
export const BLOCS_POUR_JOINDRE = [
  "call_button", "whatsapp_button", "email_button",
  "quick_contact", "multi_contact", "vcard",
  "contact_form", "lead_form",
] as const

/** Les blocs d'identité : le bouton d'appel se place juste après. */
const IDENTITE = ["profile", "overlay_card", "hero_banner", "company", "bio", "about"]

export type BlocSimple = { type: string; content?: Record<string, any> }

export function peutJoindre(blocs: readonly BlocSimple[]): boolean {
  return blocs.some(b => (BLOCS_POUR_JOINDRE as readonly string[]).includes(b.type))
}

/**
 * Où insérer le bouton d'appel : juste après le dernier bloc d'identité du début
 * de page — le visiteur sait alors CHEZ QUI il est avant qu'on lui propose
 * d'appeler. À défaut d'identité, en tête.
 */
export function positionDuBouton(blocs: readonly BlocSimple[]): number {
  let i = 0
  while (i < blocs.length && IDENTITE.includes(blocs[i].type)) i++
  return i
}

/** Le bloc ajouté : une place et un libellé, jamais un numéro inventé. */
export const BLOC_APPEL: BlocSimple = { type: "call_button", content: { label: "Appeler", phone: "" } }

/**
 * Le modèle, complété si besoin. Un modèle qui offre déjà un moyen de joindre le
 * commerce n'est pas touché.
 */
export function avecMoyenDeJoindre<T extends BlocSimple>(blocs: readonly T[]): (T | BlocSimple)[] {
  if (peutJoindre(blocs)) return [...blocs]
  const i = positionDuBouton(blocs)
  return [...blocs.slice(0, i), { ...BLOC_APPEL, content: { ...BLOC_APPEL.content } }, ...blocs.slice(i)]
}
