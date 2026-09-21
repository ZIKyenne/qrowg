// jugementDuChamp — un champ est jugé par la règle qui décidera vraiment.
//
// Relevé du 21 septembre, après la revue de l'éditeur. Le panneau de droite
// valide trois sortes de saisies, et il écrit ses trois règles lui-même
// (`builderPanels.tsx:846-852`) :
//
//   lien       /^(https?:\/\/|mailto:|tel:|\/|#)/i
//   e-mail     /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//   téléphone  val.replace(/\D/g, "").length >= 6
//
// Le produit, lui, a déjà une règle pour chacune — et ce sont celles-là qui
// décident de ce qui part en ligne :
//
//   `destinationUtile`   (builder/types, lot v92)   refuse « # »
//   `adresseEmailValide` (lib/lienDeContact, v114)  refuse « ?subject= »
//   `lienTelephone`      (idem)                     accepte tout numéro appelable
//
// **Les trois se contredisent, et le commerçant voit la contradiction.**
//
//   « # »                      le champ dit « ✓ Format valide » en vert, et
//                              l'aperçu dit sous le bloc « Le bouton « Voir la
//                              carte » n'a pas de lien : il ne sera pas publié. »
//                              Deux messages, la même valeur, deux réponses.
//
//   « contact@resto.fr?subject=Bonjour »
//                              le champ dit « valide » ; `lienEmail` rendra
//                              `null` et le bouton « Écrire » ne sera pas
//                              dessiné. Le commerçant apprend en ligne que son
//                              bouton a disparu.
//
//   « 3949 »                   le champ dit « Numéro trop court » ; le produit
//                              fabrique `tel:3949` sans broncher. Un numéro
//                              court français est refusé par l'éditeur et
//                              accepté par la page.
//
// Une validation de forme répond à « est-ce bien écrit ? ». Le commerçant, lui,
// pose une autre question : « est-ce que mon bouton marchera ? ». Les deux
// réponses n'ont aucune raison de coïncider — et quand elles diffèrent, c'est
// toujours la règle de publication qui a le dernier mot.
//
// La classe : **un champ est jugé par la règle qui décidera vraiment.**
//
// Ce module ne valide rien lui-même : il APPELLE les trois règles du produit et
// met une phrase sur leur verdict. Une quatrième règle ici serait une
// quatrième contradiction.

import { destinationUtile } from "./types"
import { adresseEmailValide, lienTelephone } from "@/lib/lienDeContact"

/**
 * `refus` ne veut pas dire « saisie interdite » : rien n'est bloqué, et le texte
 * saisi reste. Il veut dire « en l'état, ceci ne partira pas en ligne » — ce que
 * l'aperçu et le récapitulatif d'avant publication disent déjà du même bloc.
 */
export type Jugement = {
  ton: "ok" | "refus"
  phrase: string
  /** Adresse à ouvrir dans un onglet pour vérifier — http(s) seulement. */
  tester?: string
}

/** Ce que le champ attend, d'après son type déclaré et sa clé. */
export type NatureDuChamp = "destination" | "email" | "telephone" | null

export function natureDuChamp(type: string | undefined, cle: string): NatureDuChamp {
  if (type === "url") return "destination"
  const k = (cle || "").toLowerCase()
  if (k.includes("email") || k.includes("mail")) return "email"
  if (k.includes("phone") || k.includes("numero") || k.includes("tel") || k === "num") return "telephone"
  return null
}

/**
 * Le verdict du produit sur cette saisie, ou `null` quand ce champ n'est pas
 * de ceux dont une règle de publication décide.
 *
 * Un champ vide ne reçoit rien : il n'y a pas encore de quoi juger, et un
 * reproche sur un champ qu'on n'a pas commencé à remplir est du bruit.
 */
export function jugerLaSaisie(type: string | undefined, cle: string, valeur: string): Jugement | null {
  const v = (valeur || "").trim()
  if (!v) return null
  switch (natureDuChamp(type, cle)) {
    case "destination": {
      const cible = destinationUtile(v)
      if (!cible) return { ton: "refus", phrase: "Cette destination ne mène nulle part : le bouton ne sera pas publié." }
      const http = /^https?:\/\//i.test(cible)
      if (cible.startsWith("#")) return { ton: "ok", phrase: "Mène à une section de cette page." }
      if (cible.startsWith("mailto:")) return { ton: "ok", phrase: "Ouvre un e-mail." }
      if (cible.startsWith("tel:")) return { ton: "ok", phrase: "Lance un appel." }
      // Une adresse bien formée n'est pas la preuve que le site répond : on dit
      // ce que le produit sait, et on offre d'aller voir le reste.
      return { ton: "ok", phrase: "Destination enregistrée.", ...(http ? { tester: cible } : {}) }
    }
    case "email":
      return adresseEmailValide(v)
        ? { ton: "ok", phrase: "Adresse enregistrée." }
        : { ton: "refus", phrase: "Une seule adresse, sans paramètre après elle : sinon le bouton ne sera pas publié." }
    case "telephone":
      return lienTelephone(v)
        ? { ton: "ok", phrase: "Numéro appelable." }
        : { ton: "refus", phrase: "Ce numéro ne contient aucun chiffre : le bouton ne sera pas publié." }
    default:
      return null
  }
}

// ── Longueur : un conseil n'est pas un refus ────────────────────────────────
//
// Même revue, F02. Le titre « Grain & Cie » — onze caractères, le nom du
// commerce — recevait « Un peu court » en orange, la couleur des avertissements
// qui empêchent quelque chose. Or rien n'empêche un nom court : le produit le
// publie tel quel. Le seuil venait d'un plancher absolu posé sur une règle
// relative :
//
//     const short = Math.max(12, Math.round(max * 0.15))
//
// Pour un champ à 50 caractères, la règle disait 8 ; le plancher disait 12. Un
// nom de onze lettres tombait dans l'écart, et l'éditeur poussait le commerçant
// à rallonger son enseigne.
//
// Deux phrases, deux natures. **« Trop long » est une contrainte** : au-delà,
// le texte ne tient pas sur un téléphone, et c'est le produit qui le dit.
// **« un peu court » est un conseil** : il n'engage à rien, et il ne doit donc
// ni porter la couleur d'une alerte ni ressembler à une erreur.

export type Longueur = { ton: "conseil" | "contrainte"; phrase: string } | null

/**
 * Ce qu'il y a à dire de la longueur d'une saisie, ou `null` — le silence est
 * la réponse la plus fréquente et la plus juste.
 *
 * @param max  longueur conseillée déclarée par le champ ; absente pour un texte
 *             libre, où seul le conseil de brièveté s'applique.
 */
export function jugerLaLongueur(longueur: number, max?: number): Longueur {
  if (longueur <= 0) return null
  if (max && max > 0) {
    if (longueur > max) return { ton: "contrainte", phrase: "Trop long — le texte sera coupé sur mobile" }
    // 15 % du conseillé, sans plancher : c'est le champ qui dit ce qui est court
    // chez lui, pas un nombre absolu venu d'ailleurs.
    return longueur < Math.round(max * 0.15) ? { ton: "conseil", phrase: "Vous pouvez en dire un peu plus" } : null
  }
  if (longueur > 200) return { ton: "contrainte", phrase: "Un peu long pour mobile" }
  return longueur < 40 ? { ton: "conseil", phrase: "Vous pouvez en dire un peu plus" } : null
}
