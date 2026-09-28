// comptesDuTableauDeBord.ts — trois nombres qui ne sont pas le même nombre.
//
// ── Le relevé (28 septembre, refonte de la coquille) ────────────────────────
//
// Sur un compte à 13 pages, le même écran affichait :
//
//   puce de l'en-tête     « Pages publiées 13 / 25 »
//   cockpit               « Pages créées 13 · 8 publiées »
//
// Trois défauts, un par ligne :
//
//  1) La puce ne compte pas des pages. Elle lit `qr_codes` filtré sur
//     `status = active` — le quota du plan, qui se compte en QR DE PAGE ACTIFS
//     (voir lib/quota.ts) — et l'étiquette « Pages publiées » par-dessus. Un QR
//     actif n'est pas une page publiée : une page publiée peut n'avoir aucun QR,
//     un QR actif peut pointer sur une page dépubliée.
//
//  2) « Pages créées 13 » venait de `pages.length`, c'est-à-dire de la LISTE
//     plafonnée à 20 (PAGES_LISTE). Sur un compte à 26 pages, l'écran annonçait
//     donc 20 pages créées. C'est la faute que `perimetreDeMesure` a déjà
//     nommée pour les objectifs : la longueur d'une liste n'est pas un total.
//
//  3) « 8 publiées » sortait de la même liste plafonnée, avec la même
//     conséquence — et rien ne distinguait « 0 parce que c'est zéro » de
//     « 0 parce que la lecture a échoué ».
//
// ── La règle ───────────────────────────────────────────────────────────────
//
// Un compteur affiché vient d'un `count: "exact"`, ou il se tait. `null` veut
// dire « je ne sais pas » et s'écrit « — » : jamais un zéro, qui est un fait.
//
// Module PUR (aucun accès réseau, aucun React) : testable, et testé.

import { compte, nombreFr } from "./chiffresLisibles"

/** Un compteur : un entier connu, ou `null` — pas encore lu, ou lecture refusée. */
export type Compte = number | null

const entier = (n: unknown): Compte => {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

/**
 * Le total de pages d'un compte.
 *
 * `total` vient d'un `count: "exact"` ; quand il manque, on ne suppose rien —
 * SAUF si la liste lue est plus courte que son propre plafond. Dans ce cas
 * personne n'a rien coupé : la liste EST le compte. Au plafond exact, on ne
 * peut pas savoir, et on le dit.
 */
export function totalDePages(total: unknown, listeLue: unknown, plafondListe: number): Compte {
  const exact = entier(total)
  if (exact !== null) return exact
  const lues = entier(listeLue)
  if (lues === null) return null
  return lues < plafondListe ? lues : null
}

/**
 * Le nombre de pages PUBLIÉES.
 *
 * Même raisonnement, et une borne de bon sens : on n'affiche jamais plus de
 * publiées que de pages. Un compte partiel au-dessus du total signalerait que
 * les deux nombres ne parlent pas du même périmètre — on se taît plutôt que de
 * publier une contradiction.
 */
export function totalDePubliees(publiees: unknown, total: Compte): Compte {
  const p = entier(publiees)
  if (p === null) return null
  if (total !== null && p > total) return null
  return p
}

/** Un compteur à l'écran. Inconnu = « — », jamais « 0 ». */
export function texteDeCompte(n: Compte, inconnu = "—"): string {
  return n === null ? inconnu : nombreFr(n)
}

/**
 * La précision sous « Pages créées » : ce que sont devenues ces pages.
 *
 * Trois cas, trois phrases vraies — et l'accord au pluriel fait une seule fois
 * (lib/chiffresLisibles).
 */
export function phrasePubliees(publiees: Compte, total: Compte): string {
  if (publiees === null) return "Publication inconnue"
  if (publiees === 0) return total === 0 ? "Aucune page pour l'instant" : "Aucune publiée"
  const debut = `${nombreFr(publiees)} publiée${publiees > 1 ? "s" : ""}`
  return total === null ? debut : `${debut} sur ${nombreFr(total)}`
}

/** « 1 vue », « 2 vues », « — » : l'accord ne se réécrit pas à chaque ligne. */
export function phraseVues(n: Compte): string {
  if (n === null) return "—"
  return compte(n, "vue")
}

/**
 * La précision sous « Vues ce mois ».
 *
 * `limits.views` vaut `null` sur tous les plans depuis que le produit a cessé
 * de promettre l'arrêt d'un sticker imprimé (lib/plans). La phrase ne doit donc
 * pas annoncer un quota qui n'existe pas — ni inventer « illimité » quand un
 * plan en aurait un.
 */
export function precisionDesVues(limiteMensuelle: number | null | undefined, vues: Compte): string {
  if (limiteMensuelle === null || limiteMensuelle === undefined) return "Sans limite sur votre plan"
  const v = vues ?? 0
  return `${nombreFr(v)} sur ${nombreFr(limiteMensuelle)} ce mois-ci`
}

/**
 * Le quota du plan, nommé par ce qu'il compte VRAIMENT.
 *
 * `actifs` vient de `qr_codes` filtré sur les actifs (lib/quota) : ce sont des
 * QR de page visitables, un par page en ligne. La phrase le dit, au lieu de se
 * faire passer pour un compte de pages publiées.
 */
export function phraseDuQuota(actifs: Compte, limite: number | null | undefined): string | null {
  if (actifs === null) return null
  const n = nombreFr(actifs)
  if (limite === null || limite === undefined) return `${n} QR de page actif${actifs > 1 ? "s" : ""} · illimité`
  return `${n} / ${nombreFr(limite)} QR de page actifs`
}
