// joindreLeCommerce.ts — ce qu'on offre au client quand le QR imprimé ne mène
// nulle part.
//
// Relevé du 13 septembre, en scannant. Trois écrans d'échec existent dans
// `/q/<code>` : « QR Code introuvable » (404), « Ce QR Code a expiré » (410),
// « QR Code temporairement indisponible » (503), plus « Page en préparation »
// (404). Sur les trois, le seul lien de la page est :
//
//     <a href="https://qrowg.com">Créer votre propre QR Code →</a>
//
// Mesuré en vrai sur le serveur de production compilé :
//     GET /q/code-qui-nexiste-pas → 404
//     liens de la page : https://qrowg.com | Créer votre propre QR Code →
//
// Autrement dit : une personne debout devant la vitrine, le flyer à la main,
// reçoit une publicité pour l'outil de son commerçant. C'est l'inverse de ce que
// le commerçant a acheté — et c'est le seul moment où le produit tient vraiment
// le client par la main.
//
// Or dans trois cas sur quatre, le produit SAIT à quel commerce ce code
// appartient : le QR porte `page_id`, la page porte un titre et des blocs
// « Appeler », « WhatsApp », « Itinéraire », « Écrire ». Le mur peut donc rendre
// ce que le flyer promettait : un moyen de joindre le commerce. Module PUR.

import { buildDestUrl } from "@/app/api/qr-destination/qrDestination"

export type BlocConnu = { type?: string | null; content?: Record<string, unknown> | null }

/** Un bouton offert au client sur l'écran d'échec. */
export type MoyenDeJoindre = { href: string; libelle: string; emoji: string }

function texte(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

/**
 * L'ordre est celui de l'urgence réelle de quelqu'un qui est DEVANT le commerce
 * et vient de se heurter à un mur : appeler, écrire sur WhatsApp, savoir où
 * aller, écrire un mail. Jamais l'ordre des blocs dans l'éditeur.
 */
const LECTEURS: { type: string; champ: string; fabrique: (v: string) => MoyenDeJoindre }[] = [
  { type: "call_button", champ: "phone", fabrique: v => ({ href: buildDestUrl("phone", v), libelle: "Appeler", emoji: "📞" }) },
  { type: "contact_info", champ: "phone", fabrique: v => ({ href: buildDestUrl("phone", v), libelle: "Appeler", emoji: "📞" }) },
  { type: "whatsapp_button", champ: "phone", fabrique: v => ({ href: buildDestUrl("whatsapp", v), libelle: "WhatsApp", emoji: "💬" }) },
  { type: "directions_button", champ: "address", fabrique: v => ({ href: itineraire(v), libelle: "Itinéraire", emoji: "🧭" }) },
  { type: "contact_info", champ: "address", fabrique: v => ({ href: itineraire(v), libelle: "Itinéraire", emoji: "🧭" }) },
  { type: "email_button", champ: "email", fabrique: v => ({ href: buildDestUrl("email", v), libelle: "Écrire", emoji: "✉️" }) },
  { type: "contact_info", champ: "email", fabrique: v => ({ href: buildDestUrl("email", v), libelle: "Écrire", emoji: "✉️" }) },
]

/** La même URL que le bouton « Obtenir l'itinéraire » de la page publiée. */
function itineraire(adresse: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}`
}

/** Au-delà, l'écran d'échec redevient un mur — quatre choix, pas une liste. */
export const MOYENS_MAX = 4

/**
 * Les moyens de joindre le commerce, lus dans les blocs de sa page. Un même
 * libellé n'apparaît qu'une fois (une page peut porter deux blocs « Appeler »).
 */
export function moyensDeJoindre(blocs: BlocConnu[] | null | undefined): MoyenDeJoindre[] {
  const trouves: MoyenDeJoindre[] = []
  const vus = new Set<string>()
  for (const lecteur of LECTEURS) {
    for (const b of blocs ?? []) {
      if (texte(b?.type) !== lecteur.type) continue
      const v = texte(b?.content?.[lecteur.champ])
      if (!v) continue
      const m = lecteur.fabrique(v)
      if (vus.has(m.libelle)) continue
      vus.add(m.libelle)
      trouves.push(m)
      break
    }
  }
  return trouves.slice(0, MOYENS_MAX)
}

/**
 * La phrase du mur. Elle dit ce qui se passe du point de vue du client — pas du
 * point de vue de la base de données — et ne promet rien qu'on ne sache.
 *
 * `nom` est le titre de la page quand on le connaît : « Le Comptoir n'est pas
 * joignable par ce QR » se lit ; « Ce QR Code n'existe pas ou n'est plus actif »
 * énonce deux choses contradictoires et n'aide personne.
 */
export type RaisonDuMur = "introuvable" | "expire" | "en_pause" | "brouillon" | "erreur"

/** Ce qui s'est passé, en une phrase courte et neutre. */
const SITUATION: Record<RaisonDuMur, string> = {
  introuvable: "Ce QR Code ne correspond à aucune page.",
  expire: "Ce QR Code n'est plus valable.",
  en_pause: "Cette page est momentanément fermée.",
  brouillon: "Cette page n'est pas encore en ligne.",
  erreur: "Cette page ne s'ouvre pas en ce moment.",
}

/** Ce qu'on peut faire quand on n'a AUCUN moyen de joindre le commerce à offrir. */
const A_DEFAUT: Record<RaisonDuMur, string> = {
  introuvable: "Vérifiez que le code est entier, ou demandez le lien à la personne qui vous l'a remis.",
  expire: "Demandez le nouveau à la personne qui vous l'a remis.",
  en_pause: "Réessayez un peu plus tard.",
  brouillon: "Revenez bientôt.",
  erreur: "Réessayez dans un instant.",
}

/**
 * La phrase du mur : ce qui s'est passé, puis ce que le client peut faire.
 *
 * La seconde moitié dépend de ce qu'on a VRAIMENT à offrir — promettre « voici
 * comment le joindre » au-dessus d'une carte vide serait pire que le mur.
 */
export function phraseDuMur(raison: RaisonDuMur, nom?: string | null, avecMoyens = false): string {
  const commerce = texte(nom)
  const suite = !avecMoyens
    ? A_DEFAUT[raison]
    : commerce
      ? `${commerce} reste joignable autrement.`
      : "Voici comment joindre le commerce."
  return `${SITUATION[raison]} ${suite}`
}

/** Le titre du mur, court, qui ne fait pas porter la faute au client. */
export function titreDuMur(raison: RaisonDuMur, nom?: string | null): string {
  const commerce = texte(nom)
  if (commerce && raison !== "introuvable") return commerce
  switch (raison) {
    case "expire": return "Ce QR Code a expiré"
    case "en_pause": return "Page momentanément fermée"
    case "brouillon": return "Page pas encore en ligne"
    case "erreur": return "Page momentanément inaccessible"
    default: return "QR Code introuvable"
  }
}
