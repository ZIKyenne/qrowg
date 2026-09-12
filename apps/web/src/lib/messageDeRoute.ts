// messageDeRoute.ts — ce qu'une réponse de nos routes a le droit de dire au
// commerçant.
//
// Relevé du 11 septembre, en marchant la création guidée sur son banc d'essai.
// Au moment de générer la page, l'écran a affiché, en haut, seul, sans phrase
// autour :
//
//     Non authentifie
//
// Pas d'accent, pas de ponctuation, pas de geste à faire, et le même écran
// derrière avec les mêmes boutons. C'est la chaîne que renvoie la route, montrée
// telle quelle par `setErr(d.message || d.error || …)`.
//
// Ce n'est pas un cas isolé : 23 endroits dans 12 fichiers affichent le champ
// `error` d'une réponse sans le traduire. Et ce que les routes y mettent n'a
// jamais été écrit pour être lu — sur l'ensemble de l'API : « Non authentifié »
// 48 fois, « id requis » 10 fois, « QR introuvable » 10 fois, « limit », « domain
// requis », « Erreur serveur ». Ce sont des codes déguisés en français.
//
// Le produit a pourtant déjà les bonnes phrases, dans `USER_MESSAGES` : « Votre
// session a expiré. Reconnectez-vous puis réessayez. » Elles n'arrivaient
// simplement pas jusqu'à l'écran. Ce module les y amène. Module PUR.

import { USER_MESSAGES } from "@/app/dashboard/builder/builderErrors"

/**
 * Une chaîne venue d'une route est montrable SEULEMENT si elle a été écrite pour
 * être lue : une vraie phrase, avec un espace et une ponctuation finale.
 *
 * « Réservé au propriétaire / admin. » passe. « Non authentifié », « id requis »,
 * « limit » ne passent pas — et c'est tout l'intérêt : ces trois-là couvrent
 * l'écrasante majorité des réponses d'erreur du produit.
 */
export function estUnePhrase(s: unknown): boolean {
  if (typeof s !== "string") return false
  const t = s.trim()
  if (t.length < 12 || !t.includes(" ")) return false
  return /[.!?…]$/.test(t)
}

/** La phrase correspondant au code HTTP, prise dans le vocabulaire du produit. */
export function phrasePourStatut(statut: number): string {
  if (statut === 401) return USER_MESSAGES.UNAUTHORIZED
  if (statut === 403) return USER_MESSAGES.FORBIDDEN
  if (statut === 404) return USER_MESSAGES.NOT_FOUND
  if (statut === 422 || statut === 400) return USER_MESSAGES.VALIDATION
  if (statut === 429) return "Trop de demandes d'un coup. Patientez une minute puis réessayez."
  if (statut >= 500) return USER_MESSAGES.SERVER
  return USER_MESSAGES.UNKNOWN
}

/**
 * Le message à afficher pour une réponse de nos routes.
 *
 * @param statut  le code HTTP de la réponse (0 si le réseau n'a pas répondu)
 * @param corps   le corps JSON déjà parsé, ou null
 * @param repli   la phrase propre à cet écran (« La redirection n'a pas pu être
 *                enregistrée. ») — préférée à la phrase générique du statut.
 */
export function messageDeRoute(statut: number, corps: unknown, repli?: string): string {
  const c = (corps ?? {}) as Record<string, unknown>
  // Une route qui a pris la peine d'écrire une phrase est écoutée.
  if (estUnePhrase(c.message)) return String(c.message).trim()
  if (estUnePhrase(c.error)) return String(c.error).trim()
  if (statut === 0) return USER_MESSAGES.NETWORK
  // Sinon : la phrase de l'écran s'il en a une, la phrase du statut sinon.
  if (repli && statut < 500 && statut !== 401 && statut !== 403) return repli
  return phrasePourStatut(statut)
}
