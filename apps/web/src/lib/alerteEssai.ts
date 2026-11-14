// alerteEssai.ts — prévenir AVANT que la page s'éteigne.
//
// ── Ce qui manquait ───────────────────────────────────────────────────────
//
// Le lot précédent a posé les trente jours : passé l'échéance, la page d'un
// compte gratuit affiche un écran d'attente, et la base refuse de publier. La
// règle tient. Mais elle tombait sur le commerçant SANS PRÉAVIS : un matin ses
// clients ne voient plus sa carte, et lui ne sait même pas pourquoi.
//
// Une échéance sans préavis ne vend rien. Elle fait perdre un client.
//
// `etapeAlerte` existait déjà dans `lib/essaiGratuit.ts` — écrite, testée, et
// appelée par PERSONNE. C'est le pire état pour du code : il a l'air fait.
//
// ── Pourquoi un module de plus, et pas `etapeAlerte` ──────────────────────
//
// Les deux répondent à des questions différentes, et les confondre enverrait
// treize e-mails au lieu de deux.
//
//   `etapeAlerte(restants)`  → CE QU'ON AFFICHE. Un INTERVALLE : « j7 » vaut de
//                              7 à 2 jours restants, parce qu'un bandeau doit
//                              rester affiché tant que l'échéance approche.
//   `jalonDuJour(…)`         → CE QU'ON ENVOIE. Un JOUR EXACT : 7, puis 1.
//
// Un bandeau qui reste est une bonne chose ; un e-mail qui reste est du
// harcèlement. La garde de ce module simule soixante passages quotidiens sur un
// même compte et exige EXACTEMENT deux envois — et une contre-épreuve montre ce
// que `etapeAlerte` aurait envoyé à sa place.
//
// ── Aucune colonne, aucune migration ──────────────────────────────────────
//
// Même choix que `lib/relance.ts` : la fenêtre d'éligibilité est calculée de
// sorte qu'un passage QUOTIDIEN ne retienne un compte qu'une seule fois par
// jalon. Si un passage est manqué, personne ne reçoit ce jalon-là — préférable
// à un doublon, et infiniment préférable à une colonne de suivi ajoutée à la
// main en production.
//
// Ce que cela ne couvre pas, et qu'il faut savoir : deux passages le MÊME jour
// enverraient deux fois. C'est la même limite que `cron/relance`, et elle est
// tenue par l'horaire (une seule ligne dans vercel.json), pas par le code.
//
// Module PUR : il ne prend que des valeurs et se teste seul.

import { ALERTES_JOURS, DUREE_ESSAI_JOURS, joursRestants, planSoumisALEssai } from "./essaiGratuit"

const MS_PAR_JOUR = 86_400_000

/** Un jalon de relance, tel que `lib/essaiGratuit` les déclare. */
export type Jalon = (typeof ALERTES_JOURS)[number]

export type CompteEnEssai = {
  id: string
  email: string | null
  nom?: string | null
  plan: string | null
  /** `profiles.free_published_since`, ISO. */
  premierePublication: string | null
  /** Au moins une page publiée — sinon il n'y a rien à éteindre. */
  aUnePagePubliee: boolean
}

export type Refus = "sans_email" | "plan_payant" | "jamais_publie" | "rien_a_eteindre" | "hors_jalon"

export type Verdict =
  | { prevenir: true; jalon: Jalon }
  | { prevenir: false; motif: Refus }

/**
 * Le jalon atteint AUJOURD'HUI, ou null.
 *
 * Exact, pas par intervalle : c'est ce qui sépare deux e-mails de treize. Le
 * compte des jours restants vient de `lib/essaiGratuit`, qui est le seul endroit
 * où les trente jours et leur arrondi sont écrits.
 */
export function jalonDuJour(
  plan: string | null | undefined,
  premierePublication: string | Date | null | undefined,
  maintenant: Date = new Date(),
): Jalon | null {
  const restants = joursRestants(plan, premierePublication, maintenant)
  if (restants === null) return null
  return ALERTES_JOURS.find(j => j === restants) ?? null
}

/** Faut-il écrire à ce compte lors de ce passage ? */
export function jugerCompte(c: CompteEnEssai, maintenant: Date): Verdict {
  if (!c.email || !c.email.includes("@")) return { prevenir: false, motif: "sans_email" }
  if (!planSoumisALEssai(c.plan)) return { prevenir: false, motif: "plan_payant" }
  if (!c.premierePublication) return { prevenir: false, motif: "jamais_publie" }
  // Prévenir quelqu'un dont rien n'est en ligne, c'est lui annoncer la coupure
  // d'un service qu'il n'utilise pas.
  if (!c.aUnePagePubliee) return { prevenir: false, motif: "rien_a_eteindre" }
  const jalon = jalonDuJour(c.plan, c.premierePublication, maintenant)
  if (jalon === null) return { prevenir: false, motif: "hors_jalon" }
  return { prevenir: true, jalon }
}

/** Les comptes à prévenir lors de ce passage, avec leur jalon. */
export function comptesAPrevenir(
  comptes: CompteEnEssai[],
  maintenant: Date,
): { compte: CompteEnEssai; jalon: Jalon }[] {
  const out: { compte: CompteEnEssai; jalon: Jalon }[] = []
  for (const c of comptes) {
    const v = jugerCompte(c, maintenant)
    if (v.prevenir) out.push({ compte: c, jalon: v.jalon })
  }
  return out
}

/**
 * Bornes de la requête envoyée à la base, sur `free_published_since` : jamais
 * toute la table des comptes.
 *
 * Elles encadrent TOUS les jalons d'un coup — du plus lointain au plus proche —
 * et une garde vérifie qu'aucun compte que `jugerCompte` accepterait ne tombe
 * hors de cette fenêtre. C'est la faute classique : une fenêtre SQL plus étroite
 * que la décision, et des comptes qui ne reçoivent jamais rien sans que personne
 * ne puisse le voir.
 *
 * **`depuis` est EXCLUSIVE, `jusqua` est INCLUSIVE**, et ce n'est pas un détail :
 * c'est le sens de l'arrondi vers le haut. Il reste 7 jours tant que l'échéance
 * est à plus de 6 jours et à 7 au plus — donc la première publication vaut de
 * `now − 24 j` (exclu) à `now − 23 j` (INCLUS). La garde a attrapé ce décalage
 * d'une borne : écrite dans l'autre sens, la requête laissait dehors le compte
 * pile à l'heure. L'appelant doit donc comparer avec `gt` et `lte`.
 */
export function fenetreDesJalons(maintenant: Date): { depuis: string; jusqua: string } {
  const plusLoin = Math.max(...ALERTES_JOURS)   // le jalon le plus en avance
  const plusPres = Math.min(...ALERTES_JOURS)   // le dernier avant l'échéance
  return {
    depuis: new Date(maintenant.getTime() - (DUREE_ESSAI_JOURS - plusPres + 1) * MS_PAR_JOUR).toISOString(),
    jusqua: new Date(maintenant.getTime() - (DUREE_ESSAI_JOURS - plusLoin) * MS_PAR_JOUR).toISOString(),
  }
}

/**
 * Ce qu'on écrit, par jalon.
 *
 * Deux règles tenues par les gardes :
 *
 *  · on dit ce que le CLIENT verra, pas ce que le compte deviendra. « Vos
 *    clients ne verront plus votre page » est un fait qui parle ; « votre essai
 *    expire » est du vocabulaire de facturier.
 *  · on ne menace JAMAIS de suppression. Rien n'est effacé — ni les pages, ni
 *    les blocs, ni les QR. Le dire serait un mensonge, et un mensonge qui
 *    pousse à l'achat est une escroquerie.
 */
export const RASSURANCE =
  "Rien n'est perdu : vos pages, vos blocs et vos QR codes restent intacts. Choisir un plan les remet en ligne immédiatement, sans rien réimprimer."

export type Message = { objet: string; titre: string; corps: string; bouton: string }

export const MESSAGES: Record<Jalon, Message> = {
  7: {
    objet: "Il vous reste une semaine d'essai QRowg",
    titre: "Dans sept jours, votre page passe en pause",
    corps: "Vos trente jours d'essai se terminent dans une semaine. Passé cette date, les clients qui scannent votre QR code arrivent sur un écran d'attente au lieu de votre page.",
    bouton: "Choisir mon plan →",
  },
  1: {
    objet: "Demain, vos clients ne verront plus votre page",
    titre: "Demain, vos clients ne verront plus votre page",
    corps: "C'est le dernier jour de votre essai. Dès demain, le QR code que vous avez imprimé et collé mène à un écran d'attente — pas à votre page.",
    bouton: "Garder ma page en ligne →",
  },
}
