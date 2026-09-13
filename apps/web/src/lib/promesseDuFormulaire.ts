// promesseDuFormulaire.ts — ce que le formulaire affirme au client.
//
// Relevé du 13 septembre, sur le serveur compilé. Le harnais de page publique
// porte volontairement un identifiant qui n'est pas un UUID, pour que rien ne
// s'écrive en base. On envoie donc un message comme le ferait un client :
//
//     POST /api/leads  →  400  {"error":"Page invalide"}
//
// Rien n'est enregistré. Et pourtant, la logique de soumission du produit dit :
//
//     decideResult(false, hasOwnerEmail=true)
//       → { status: "success", action: "mailto" }   // « repli mailto = succès »
//
// ce qui affiche au client, en vert, avec une coche :
//
//     « ✅ Demande envoyée, merci ! Nous revenons vers vous rapidement. »
//
// Deux affirmations, toutes deux fausses :
//
//  1. « envoyée » — rien n'est parti. Le navigateur a seulement tenté d'ouvrir
//     la messagerie du visiteur avec un brouillon pré-rempli. Sur un téléphone
//     sans application de courrier configurée, il ne se passe rien du tout ; et
//     même quand elle s'ouvre, il reste à appuyer sur « Envoyer ».
//  2. « Nous revenons vers vous rapidement » — le produit promet, AU NOM DU
//     COMMERÇANT, un délai de réponse que ni lui ni le commerçant ne maîtrisent.
//
// S'y ajoute un silence : le formulaire demande un nom, un e-mail, un numéro de
// téléphone, et ne dit à aucun moment qui les reçoit.
//
// Ce module tient les phrases. Module PUR.

/** Ce qui s'est réellement passé quand le client a appuyé sur le bouton. */
export type ResultatEnvoi =
  /** La ligne est écrite : le commerçant la verra dans ses messages. */
  | "enregistre"
  /** L'enregistrement a échoué ; on a ouvert la messagerie du visiteur. */
  | "courrier"
  /** Ni l'un ni l'autre. */
  | "echec"

export type Confirmation = { titre: string; detail: string; ton: "ok" | "attention" | "erreur" }

function nomOuDefaut(nom?: string | null): string {
  const n = (nom || "").trim()
  return n || "le commerce"
}

/**
 * Ce qu'on affiche après l'envoi. Chaque phrase ne dit que ce qui est vrai à ce
 * moment-là — aucune ne promet de réponse, parce que personne ici ne peut la
 * promettre à la place du commerçant.
 */
export function confirmationDuFormulaire(resultat: ResultatEnvoi, opts?: { nomCommerce?: string | null; libelle?: string }): Confirmation {
  const commerce = nomOuDefaut(opts?.nomCommerce)
  const quoi = (opts?.libelle || "Votre message").trim()
  switch (resultat) {
    case "enregistre":
      return {
        titre: `${quoi} est bien arrivé.`,
        detail: `${commerce} le retrouvera dans ses messages.`,
        ton: "ok",
      }
    case "courrier":
      return {
        titre: `${quoi} n'est pas encore parti.`,
        detail: "Nous avons ouvert votre messagerie avec le message déjà écrit : il reste à l'envoyer.",
        ton: "attention",
      }
    case "echec":
    default:
      return {
        titre: "L'envoi n'a pas abouti.",
        detail: "Réessayez dans un instant — ou appelez directement le commerce.",
        ton: "erreur",
      }
  }
}

/**
 * Ce qu'on dit AVANT que le client tape son numéro de téléphone. Court, sous le
 * formulaire, et vrai : ces informations vont au commerçant, et QRowg les
 * héberge pour lui. Rien de plus n'est affirmé.
 */
export function mentionDestinataire(nomCommerce?: string | null): string {
  const n = (nomCommerce || "").trim()
  return n
    ? `Vos informations sont transmises à ${n}, qui les reçoit dans son espace QRowg.`
    : "Vos informations sont transmises au commerçant, qui les reçoit dans son espace QRowg."
}

/** Les couleurs du produit pour chaque ton — une seule table, deux rendus. */
export const COULEUR_DU_TON: Record<Confirmation["ton"], string> = {
  ok: "#39FF8F",
  attention: "#FBBF24",
  erreur: "#FF6B6B",
}

/** L'emoji qui va avec. Une coche verte sur un message qui n'est pas parti, non. */
export const EMOJI_DU_TON: Record<Confirmation["ton"], string> = {
  ok: "✅",
  attention: "✉️",
  erreur: "⚠️",
}
