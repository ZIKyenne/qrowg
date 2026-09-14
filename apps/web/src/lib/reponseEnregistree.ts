// reponseEnregistree.ts — la garde du lot v100 avait un angle mort.
//
// Relevé du 14 septembre. Le lot v100 a posé la règle : **l'écran ne montre un
// changement que si le serveur l'a fait.** Son balayage cherche un `await
// fetch(` qui modifie, suivi d'un changement d'écran non vérifié.
//
// Il ne voit donc PAS les écrans qui écrivent à travers une fonction du produit.
// Le produit en a sept qui écrivent par le réseau ; deux rendent un résultat :
//
//     submitLead(input): Promise<boolean>          lib/submitLead.ts
//     ajouterUnSupport(…): Promise<…>              qr-codes/ajoutDeSupport.ts
//
// Un seul appel jette ce résultat, et c'est sur la PAGE PUBLIQUE :
//
//     blocsPublics.tsx:512  RsvpPublic
//       const pick = (val) => {
//         setChoice(val)                       ← l'écran bascule d'abord
//         trackLinkClick(…)
//         submitLead({ … })                    ← ni `await`, ni résultat lu
//       }
//
//     et l'écran affiche aussitôt :
//       « ✅ Merci, votre réponse est enregistrée ! »
//
// Rien ne garantit qu'elle le soit. `/api/leads` refuse pour de vraies raisons :
// 429 au-delà de 15 soumissions par IP et par 10 minutes, 404 si la page n'existe
// plus, 500 si l'insertion échoue. Un mariage, une soirée, une réunion de
// copropriété : les invités répondent depuis le Wi-Fi du lieu, donc depuis UNE
// seule IP. Le seizième lit « enregistrée » et n'est pas sur la liste. Le
// commerçant compte ses couverts sur cette liste.
//
// Les deux autres formulaires de la même page font le bon geste depuis le lot
// v81 : ils attendent, distinguent « enregistré » de « repli courrier » et
// d'« échec », et affichent la phrase juste (`lib/promesseDuFormulaire`). Le
// RSVP, plus ancien, gardait son bandeau vert écrit à la main.
//
// Ce module n'invente rien : il donne au RSVP le même vocabulaire que ses deux
// voisins, et nomme la règle que la garde étendue fera respecter. Module PUR.

import { confirmationDuFormulaire, type ResultatEnvoi, type Confirmation } from "./promesseDuFormulaire"

/** Ce qu'une réponse RSVP peut valoir, du point de vue du client qui la donne. */
export type EtatReponse = "envoi" | ResultatEnvoi

/**
 * Le résultat d'un enregistrement, à partir de ce que l'aide a rendu.
 *
 * `submitLead` rend `false` aussi bien sur un refus du serveur que sur une
 * coupure réseau : on ne distingue pas les deux ici, parce que pour le client
 * c'est la même chose — sa réponse n'est pas partie.
 */
export function resultatDuRsvp(enregistre: unknown): ResultatEnvoi {
  return enregistre === true ? "enregistre" : "echec"
}

/**
 * La confirmation d'une réponse RSVP. Le libellé dit « votre réponse » et non
 * « votre message » : c'est ce que la personne vient de faire.
 */
export function confirmationRsvp(resultat: ResultatEnvoi, nomCommerce?: string | null): Confirmation {
  return confirmationDuFormulaire(resultat, { nomCommerce, libelle: "Votre réponse", feminin: true })
}

/** Peut-on réessayer ? Un échec ne doit pas verrouiller le choix. */
export function reponseRejouable(etat: EtatReponse): boolean {
  return etat === "echec"
}

/** Le choix est-il définitivement pris — donc les boutons à masquer ? */
export function choixArrete(etat: EtatReponse): boolean {
  return etat === "enregistre" || etat === "courrier"
}
