// La relance de celui qui s'est inscrit et n'a rien créé.
//
// Le seul vrai inscrit qu'a eu QRowg est arrivé par Google le 24 août. Tout a
// fonctionné : l'email de bienvenue est parti, il a atterri sur l'écran de
// création par objectif. Il n'a jamais créé de page, et plus rien ne lui a
// jamais été envoyé. L'email de bienvenue arrive à la minute zéro, quand la
// personne est déjà devant l'écran — il ne rattrape personne.
//
// Un rappel deux jours plus tard est la seule chose qui avait une chance.
//
// AUCUNE colonne, AUCUNE migration : l'éligibilité est calculée de sorte qu'un
// passage quotidien du cron ne puisse ni envoyer deux fois, ni rien envoyer. Si
// un passage est entièrement manqué, la personne ne reçoit rien — c'est
// préférable à un doublon, et infiniment préférable à une colonne de suivi
// ajoutée à la main en production.
//
// ── Ce qui a changé, et ce que ça réparait (2026-11-15) ───────────────────
//
// La première version mesurait un ÂGE EN HEURES : éligible entre 48 h et 72 h.
// Une fenêtre de 24 h pour un cron quotidien, ce qui paraît exact — et qui
// supposait le cron à heure fixe. Il ne l'est pas : la dérive réelle va de +15
// à +55 minutes (relevés dans `lib/jourCivil.ts`).
//
// Mesuré, pas supposé : avec les dérives observées, **le compte inscrit vers
// 09:50 UTC n'était JAMAIS relancé**. Pas en retard — jamais. Son âge passait
// de 47,9 h (trop récent) à 72,6 h (trop ancien) entre deux passages espacés de
// 24 h 40. Et rien ne le signalait : la tâche note « aucun compte dans la
// fenêtre », exactement ce qu'elle a écrit le 2026-11-15. Le défaut symétrique
// — deux envois — a été mesuré sur `alerteEssai`, par le même mécanisme.
//
// La décision porte donc désormais sur le JOUR CIVIL, pas sur les heures : tout
// passage du 2e jour après l'inscription relance, quelle que soit l'heure.
//
// Conséquence de rythme, à connaître : une personne inscrite à 23 h 50 est
// relancée au matin du 2e jour, soit ~28 h après son inscription au lieu de
// ~58 h. Toujours une vraie nuit passée, et deux jours au calendrier — ce que
// la phrase « un rappel deux jours plus tard » voulait dire.

import { joursCivilsEntre, minuitDecale } from "./jourCivil"

const HEURE = 3_600_000

/**
 * Le jour civil, après celui de l'inscription, où l'on relance.
 *
 * 2 = le surlendemain au calendrier. L'e-mail de bienvenue part à la minute
 * zéro ; celui-ci doit arriver quand la personne a eu le temps d'oublier, pas
 * quand elle est encore devant l'écran.
 */
export const JOUR_DE_RELANCE = 2

export type Compte = {
  id: string
  email: string | null
  /** Date d'inscription, ISO. */
  inscritLe: string | null
  /** Nom affichable, éventuellement vide. */
  nom?: string | null
  /** Nombre de pages du compte, brouillons compris. */
  nbPages: number
}

export type Refus =
  | "sans_email"
  | "date_illisible"
  | "trop_recent"
  | "trop_ancien"
  | "a_deja_cree"

export type Verdict = { relancer: true; ageH: number } | { relancer: false; motif: Refus; ageH: number | null }

/** Âge d'un compte en heures, ou null si la date est inexploitable. */
export function ageEnHeures(inscritLe: string | null | undefined, maintenant: Date): number | null {
  if (!inscritLe) return null
  const t = Date.parse(inscritLe)
  if (Number.isNaN(t)) return null
  return (maintenant.getTime() - t) / HEURE
}

/**
 * Le nombre de jours civils écoulés depuis l'inscription, ou null.
 *
 * C'est CE nombre qui décide, et non l'âge en heures : voir le préambule et
 * `lib/jourCivil.ts`. L'âge en heures reste calculé, mais pour être RAPPORTÉ
 * dans le verdict — un journal qui dit « 57 h » se lit mieux qu'un « jour 2 ».
 */
export function joursDepuisInscription(
  inscritLe: string | null | undefined,
  maintenant: Date,
): number | null {
  if (!inscritLe) return null
  const t = Date.parse(inscritLe)
  if (Number.isNaN(t)) return null
  return joursCivilsEntre(new Date(t), maintenant)
}

/** Faut-il relancer ce compte lors de ce passage ? */
export function jugerCompte(c: Compte, maintenant: Date): Verdict {
  const ageH = ageEnHeures(c.inscritLe, maintenant)
  const jours = joursDepuisInscription(c.inscritLe, maintenant)
  if (!c.email || !c.email.includes("@")) return { relancer: false, motif: "sans_email", ageH }
  if (jours === null) return { relancer: false, motif: "date_illisible", ageH: null }
  if (c.nbPages > 0) return { relancer: false, motif: "a_deja_cree", ageH }
  if (jours < JOUR_DE_RELANCE) return { relancer: false, motif: "trop_recent", ageH }
  if (jours > JOUR_DE_RELANCE) return { relancer: false, motif: "trop_ancien", ageH }
  return { relancer: true, ageH: ageH as number }
}

/** Les comptes à relancer lors de ce passage. */
export function comptesARelancer(comptes: Compte[], maintenant: Date): Compte[] {
  return comptes.filter(c => jugerCompte(c, maintenant).relancer)
}

/**
 * Bornes de la requête envoyée à la base, pour ne pas ramener tous les comptes.
 * `depuis` et `jusqua` encadrent la date d'inscription des comptes éligibles.
 *
 * C'est EXACTEMENT la journée civile du jour de relance, de son minuit à celui
 * du lendemain : l'appelant compare avec `gte` et `lt`, donc l'intervalle est
 * fermé en bas, ouvert en haut, et couvre les 24 h sans en déborder.
 *
 * Alignée sur minuit, pas sur l'heure du passage. Une borne posée à l'heure du
 * passage glisserait de quarante minutes d'un jour sur l'autre pendant que la
 * décision, elle, ne bougerait pas — et c'est ainsi que le compte inscrit vers
 * 09:50 tombait entre deux fenêtres sans jamais être lu.
 */
export function fenetreInscription(maintenant: Date): { depuis: string; jusqua: string } {
  return {
    depuis: minuitDecale(maintenant, -JOUR_DE_RELANCE),
    jusqua: minuitDecale(maintenant, -(JOUR_DE_RELANCE - 1)),
  }
}

/** Prénom exploitable, ou chaîne vide. */
export function prenom(nom: string | null | undefined): string {
  const n = (nom || "").trim()
  if (!n) return ""
  return n.split(/\s+/)[0].slice(0, 40)
}
