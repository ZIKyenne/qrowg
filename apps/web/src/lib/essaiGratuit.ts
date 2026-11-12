// essaiGratuit.ts — les trente jours du plan gratuit, et pourquoi ils se CALCULENT.
//
// ── Ce que le plan gratuit était ───────────────────────────────────────────
//
// Une page publiée gratuitement restait en ligne indéfiniment. Un commerçant
// pouvait imprimer son QR, le coller sur sa vitrine, et ne jamais payer : le
// produit rendait le service complet, pour toujours, à zéro euro. Les trois
// paliers payants ne servaient alors qu'à ceux qui voulaient PLUS — jamais à
// ceux qui voulaient simplement continuer.
//
// Le plan gratuit devient un ESSAI : trente jours à partir de la première
// publication du compte, puis la page passe en pause. Le QR déjà imprimé
// continue de fonctionner — il mène à un écran qui dit que la page est en
// pause et comment la rallumer. C'est là, et seulement là, que l'abonnement
// prend son sens.
//
// ── Pourquoi c'est CALCULÉ et non stocké ──────────────────────────────────
//
// La tentation est d'écrire un drapeau `en_pause` qu'un cron pose chaque nuit.
// C'est exactement la faute que cette série de lots corrige depuis deux cents
// commits : **une valeur écrite quelque part finit par ne plus dire la vérité**.
// Un cron qui ne tourne pas un jour, et la page reste en ligne au trente-et-
// unième jour. Un cron qui tourne deux fois, et elle se met en pause après un
// paiement.
//
// L'état de l'essai n'est donc écrit nulle part. Il se déduit, à chaque
// affichage, de trois choses qui, elles, sont des faits :
//
//   • le plan du compte (`profiles.plan`) ;
//   • la date de sa première publication (`profiles.free_published_since`) ;
//   • l'heure qu'il est.
//
// Un compte qui paie n'a pas d'essai : son plan suffit à le dire. Un compte
// qui n'a jamais publié n'a pas commencé le sien.
//
// ── Pourquoi le compteur est sur le COMPTE ────────────────────────────────
//
// Posé sur la page, le délai se contourne en trois clics : supprimer la page,
// en recréer une, repartir pour trente jours. `free_published_since` appartient
// au compte et ne se remet jamais à zéro tant que le compte existe — supprimer
// toutes ses pages ne rend pas un nouvel essai.
//
// Ce que ce module ne prétend PAS empêcher : qu'une même personne ouvre un
// second compte avec une autre adresse. Aucun produit en libre inscription ne
// l'empêche, et le prétendre serait mentir. Ce qui est fermé, c'est la boucle
// qui demandait trois clics ; pas celle qui demande une nouvelle identité.
//
// Module PUR : il ne prend que des valeurs, n'importe rien, et se teste seul.

/** La durée de l'essai, en jours. Un seul endroit l'écrit. */
export const DUREE_ESSAI_JOURS = 30

/** Les jalons où l'on prévient le commerçant avant la pause. */
export const ALERTES_JOURS = [7, 1] as const
export type EtapeAlerte = "j7" | "j1"

const MS_PAR_JOUR = 86_400_000

/** Une date lisible, ou null si l'entrée n'en est pas une. */
function dateOuNull(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isFinite(d.getTime()) ? d : null
}

/**
 * Un plan gratuit est-il soumis à l'essai ?
 *
 * Tout ce qui n'est pas `free` paie, et ne connaît donc pas d'échéance. Un plan
 * inconnu (donnée abîmée, palier retiré) est traité comme GRATUIT : se tromper
 * vers le plus strict est réparable d'un clic par le commerçant ; se tromper
 * vers le plus permissif offre le produit sans que personne ne s'en aperçoive.
 */
export function planSoumisALEssai(plan: string | null | undefined): boolean {
  const p = (plan || "free").trim().toLowerCase()
  return p !== "starter" && p !== "pro" && p !== "business"
}

/** Le moment où l'essai se termine, ou null si rien ne l'a démarré. */
export function finDeLEssai(premierePublication: string | Date | null | undefined): Date | null {
  const d = dateOuNull(premierePublication)
  return d ? new Date(d.getTime() + DUREE_ESSAI_JOURS * MS_PAR_JOUR) : null
}

/**
 * Jours entiers restants avant la pause — arrondis vers le HAUT.
 *
 * Vers le haut parce que ce nombre est montré au commerçant : à trente heures
 * de l'échéance il lui reste « 2 jours », pas « 1 ». Annoncer moins de temps
 * qu'il n'en a le ferait courir pour rien ; en annoncer plus le ferait rater
 * la date. Vers le haut est le seul arrondi qui ne lui coûte rien.
 *
 * `null` quand il n'y a pas d'essai en cours : plan payant, ou jamais publié.
 * Jamais négatif : passé l'échéance, c'est 0.
 */
export function joursRestants(
  plan: string | null | undefined,
  premierePublication: string | Date | null | undefined,
  maintenant: Date = new Date(),
): number | null {
  if (!planSoumisALEssai(plan)) return null
  const fin = finDeLEssai(premierePublication)
  if (!fin) return null
  return Math.max(0, Math.ceil((fin.getTime() - maintenant.getTime()) / MS_PAR_JOUR))
}

/**
 * L'essai de ce compte est-il terminé ?
 *
 * C'est LA question que pose le rendu d'une page publique, à chaque affichage.
 * Elle ne consulte aucun drapeau : elle recalcule.
 */
export function essaiExpire(
  plan: string | null | undefined,
  premierePublication: string | Date | null | undefined,
  maintenant: Date = new Date(),
): boolean {
  if (!planSoumisALEssai(plan)) return false
  const fin = finDeLEssai(premierePublication)
  if (!fin) return false           // jamais publié : l'essai n'a pas commencé
  return maintenant.getTime() >= fin.getTime()
}

/**
 * Faut-il prévenir aujourd'hui, et à quel titre ?
 *
 * Renvoie le jalon atteint, ou null. L'appelant garde la trace de ce qu'il a
 * déjà envoyé : ce module ne sait pas ce qui est parti, il dit seulement où on
 * en est.
 */
export function etapeAlerte(restants: number | null): EtapeAlerte | null {
  if (restants === null) return null
  if (restants <= 1) return "j1"
  if (restants <= 7) return "j7"
  return null
}

/**
 * Ce qu'on dit au commerçant, et ce qu'on dit à son client.
 *
 * Deux publics, deux phrases, et surtout deux vérités différentes : le client
 * qui scanne n'a pas à savoir qu'une facture n'a pas été payée — il doit juste
 * comprendre que la page reviendra. Le commerçant, lui, doit savoir exactement
 * ce qui s'est passé et quoi faire.
 */
export const MESSAGE_VISITEUR = {
  titre: "Cette page est en pause",
  corps: "Son propriétaire la remettra en ligne prochainement. Le QR code que vous avez scanné reste valable : il mènera de nouveau à la page dès qu'elle sera rouverte.",
} as const

export const MESSAGE_PROPRIETAIRE = {
  titre: "Vos trente jours d'essai sont terminés",
  corps: "Votre page n'est plus visible par vos clients, et le QR que vous avez imprimé mène à un écran d'attente. Vos pages, vos blocs et vos QR sont intacts : choisir un plan les remet en ligne immédiatement, sans rien réimprimer.",
} as const
