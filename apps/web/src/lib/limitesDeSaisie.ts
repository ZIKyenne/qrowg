// limitesDeSaisie — la limite du serveur, dite à l'écran avant de couper.
//
// Relevé du 14 septembre, en balayant ce que les routes font du texte qu'on
// leur envoie. **Vingt-huit** endroits coupent avec `.slice(0, n)` ; **deux**
// écrans seulement portent une limite de saisie. Le nombre est écrit à la main,
// côté serveur, dans un fichier que personne ne lit en tapant.
//
// Ce que ça donne, du côté du commerçant :
//
//   api/qr-instant:85     label.trim().slice(0, 80)
//     Il nomme son QR « Affiche de la vitrine côté rue Victor Hugo, campagne
//     de printemps », l'écran accepte tout, la base garde 80 caractères. Au
//     rechargement le nom est coupé en plein mot. Rien ne l'avait prévenu.
//
//   api/pages/create:52   title.trim().slice(0, 80)      le titre de sa page
//   api/qr-label:14       label.trim().slice(0, 60)      le nom d'un support
//   api/qr-support:41     label.trim().slice(0, 60)      idem, à la création
//
// Et du côté de ses clients, sur le formulaire public — celui qui lui ramène
// des prospects :
//
//   api/leads:34-37       name 200, email 200, phone 60, message 3000
//     Le visiteur écrit, envoie, lit « Message bien reçu ». Le commerçant, lui,
//     reçoit une phrase tronquée au milieu. Et une adresse de plus de 200
//     caractères devient une adresse à laquelle on ne peut plus répondre : le
//     lead est là, injoignable, et personne ne sait pourquoi.
//
// Le seul endroit qui fait bien est `SubdomainPanel` : le serveur répond
// « Maximum 30 caractères » et le champ porte `maxLength={30}`. Les deux
// nombres sont d'accord aujourd'hui — mais ils sont écrits deux fois, à deux
// endroits, et rien ne les tient ensemble.
//
// La classe : **une limite qui coupe sans se voir n'est pas une limite, c'est
// une perte.** Le nombre est nommé ici, une fois ; la route l'applique, l'écran
// l'affiche, et ils ne peuvent plus diverger.
//
// Ce module ne double pas `lib/bornes.ts` : c'est l'inverse. `bornes.texte`
// délègue sa coupe à `coupe` ci-dessous, de sorte qu'il n'existe qu'un seul
// geste de coupe dans le produit. `bornes` garde ce qui touche au corps JSON
// (octets, objets, tableaux) et qui n'a rien à faire dans un paquet navigateur ;
// ce fichier reste pur et léger pour être importable des deux côtés.

import { compte } from "./chiffresLisibles"

/**
 * Les champs que quelqu'un TAPE, et ce que la base en garde.
 *
 * Chaque entrée nomme un champ du produit, pas une colonne : deux colonnes
 * différentes peuvent porter le même mot « label » sans être la même chose —
 * le nom d'un support imprimé (60) et le nom d'un QR direct (80) en sont deux.
 */
export const LIMITES = {
  nomDeSupport: 60,    // qr_codes.label — « Vitrine », « Table 4 », « Flyer »
  nomDeQr: 80,         // instant_qrs.label — le nom d'un QR direct
  titreDePage: 80,     // pages.title
  sousDomaine: 30,     // <nom>.qrowg.com — déjà dit par la route
  leadNom: 200,        // leads.name        ─┐
  leadEmail: 200,      // leads.email        │ le formulaire public :
  leadTelephone: 60,   // leads.phone        │ ce que le CLIENT du commerçant
  leadMessage: 3000,   // leads.message     ─┘ tape sur son téléphone
  champDeFormulaire: 500, // les autres champs du formulaire, rangés dans leads.data
  leadType: 40,        // leads.type — posé par le produit, jamais tapé
  leadSource: 40,      // leads.qr_source — idem
  leadBloc: 200,       // leads.block_id — idem
} as const

export type CleDeLimite = keyof typeof LIMITES

/** Le plafond d'un champ, par son nom. */
export function limite(cle: CleDeLimite): number {
  return LIMITES[cle]
}

/**
 * Le geste de coupe du produit, et le seul : on enlève les bords, on coupe à
 * `max`, et une chaîne devenue vide vaut `null` (une colonne vide se dit `null`,
 * pas `""`). `bornes.texte` passe par ici.
 */
export function coupe(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const t = v.trim().slice(0, max)
  return t.length ? t : null
}

/** La même coupe, mais le plafond vient de la table — c'est la forme attendue dans une route. */
export function champBorne(v: unknown, cle: CleDeLimite): string | null {
  return coupe(v, LIMITES[cle])
}

/**
 * Le plafond d'un champ du formulaire public, à partir de sa clé.
 *
 * Les quatre champs connus partent dans leurs colonnes (`name`, `email`,
 * `phone`, `message`) ; **tous les autres** sont rangés ensemble dans
 * `leads.data`, que la route borne à 8 Ko — et si l'objet dépasse, elle ne
 * garde pas le début : elle jette **tout** (`objetBorne(...) ?? {}`). Un
 * visiteur bavard sur un seul champ faisait donc perdre au commerçant les
 * réponses de tous les autres. Un plafond par champ tient l'objet sous la
 * barre : douze champs de 500 caractères restent loin des 8 Ko.
 *
 * Les formes reconnues sont celles que le formulaire utilise déjà pour choisir
 * le clavier du téléphone — un seul jeu de règles, pas deux.
 */
export function limiteDuChampPublic(cle: string, zoneDeTexte = false): number {
  const k = (cle || "").toLowerCase()
  if (/e?mail/.test(k)) return LIMITES.leadEmail
  if (/phone|tel|mobile|whatsapp|numero/.test(k)) return LIMITES.leadTelephone
  if (/name|nom|prenom/.test(k)) return LIMITES.leadNom
  if (/message|project|projet/.test(k) || zoneDeTexte) return LIMITES.leadMessage
  return LIMITES.champDeFormulaire
}

/** Ce que la saisie perdrait si on l'enregistrait maintenant. */
export function tropLong(valeur: string, cle: CleDeLimite): boolean {
  return valeur.trim().length > LIMITES[cle]
}

/** Ce qu'il reste à écrire. Négatif quand la valeur dépasse déjà. */
export function resteAEcrire(valeur: string, cle: CleDeLimite | number): number {
  return (typeof cle === "number" ? cle : LIMITES[cle]) - valeur.length
}

/**
 * Le compteur, affiché seulement quand il sert.
 *
 * Un « 3/80 » permanent sous chaque champ est du bruit : personne n'approche de
 * la limite en tapant « Vitrine ». Il apparaît dans les derniers caractères, et
 * c'est là qu'il informe. `null` tant qu'on en est loin.
 */
export function compteurDeSaisie(valeur: string, cle: CleDeLimite | number, seuil = 20): string | null {
  const reste = resteAEcrire(valeur, cle)
  if (reste > seuil) return null
  if (reste > 0) return compte(reste, "caractère restant", "caractères restants")
  if (reste === 0) return "Limite atteinte"
  return `${compte(-reste, "caractère de trop", "caractères de trop")} : la fin sera coupée`
}
