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

import { ALERTES_JOURS, DUREE_ESSAI_JOURS, finDeLEssai, planSoumisALEssai } from "./essaiGratuit"
import { joursCivilsEntre, minuitDecale } from "./jourCivil"


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
 * Combien de JOURS CIVILS séparent ce passage du jour de la pause.
 *
 * ── Pourquoi pas `joursRestants`, qui existe et qui est testée ────────────
 *
 * Parce qu'elle mesure un délai entre deux INSTANTS, et que l'heure du passage
 * n'est pas fixe : la dérive réelle du cron va de +15 à +55 minutes. Avec un
 * délai mesuré ainsi, elle déplace la frontière de l'arrondi, et le compte
 * publié entre 07:00 et 07:55 UTC recevait TROIS e-mails au lieu de deux —
 * mesuré, pas supposé. Le fait, les chiffres relevés et la règle qui en découle
 * sont dans `lib/jourCivil.ts`, qui est désormais la seule autorité sur ce
 * point pour toutes les tâches planifiées.
 *
 * `joursRestants` reste juste pour ce qu'elle fait : AFFICHER un délai au
 * commerçant, où l'heure compte et où aucune décision n'en dépend.
 *
 * ── Et le second défaut, que le même changement corrige ───────────────────
 *
 * L'ancien calcul envoyait « Demain, vos clients ne verront plus votre page »
 * le jour J-1 pour un compte publié tôt, mais le jour J LUI-MÊME pour un compte
 * publié après l'heure du cron — quinze minutes avant la coupure, en annonçant
 * le lendemain. En jours civils, la veille est la veille pour tout le monde.
 *
 * ── La limite qui reste, et elle est connue ───────────────────────────────
 *
 * Le jour civil est compté en UTC, pas à Paris. Pour un compte dont la pause
 * tombe en fin de soirée UTC, « demain » peut en réalité être après-demain
 * heure française. On annonce donc l'échéance un peu TÔT, jamais trop tard :
 * l'erreur résiduelle fait agir le commerçant en avance, ce qui ne lui coûte
 * rien. Un test la borne explicitement.
 */
export function joursCivilsAvantLaPause(
  premierePublication: string | Date | null | undefined,
  maintenant: Date,
): number | null {
  const fin = finDeLEssai(premierePublication)
  if (!fin) return null
  return joursCivilsEntre(maintenant, fin)
}

/**
 * Le jalon atteint AUJOURD'HUI, ou null.
 *
 * Exact, pas par intervalle : c'est ce qui sépare deux e-mails de treize. Et
 * compté en jours civils, pas en heures : c'est ce qui sépare deux e-mails de
 * trois.
 */
export function jalonDuJour(
  plan: string | null | undefined,
  premierePublication: string | Date | null | undefined,
  maintenant: Date = new Date(),
): Jalon | null {
  if (!planSoumisALEssai(plan)) return null
  const jours = joursCivilsAvantLaPause(premierePublication, maintenant)
  if (jours === null) return null
  return ALERTES_JOURS.find(j => j === jours) ?? null
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
 * ── Alignée sur le jour civil, comme la décision ──────────────────────────
 *
 * Depuis que `jalonDuJour` compte en jours civils, un jalon n'est plus un
 * instant mais une JOURNÉE ENTIÈRE de publications possibles : tout compte
 * publié entre minuit et 23 h 59 du jour `J − 23` atteint le jalon 7
 * aujourd'hui. Les bornes partent donc de minuit, et non de l'heure du passage
 * — sinon elles bougeraient de quarante minutes d'un jour sur l'autre pendant
 * que la décision, elle, ne bougerait pas.
 *
 * La version précédente coupait à l'heure du passage et laissait donc dehors
 * les comptes publiés plus TARD dans la journée du jalon : éligibles pour la
 * décision, absents de la requête. Exactement la faute que la garde traque.
 *
 * **`depuis` est EXCLUSIVE, `jusqua` est INCLUSIVE** — l'appelant compare avec
 * `gt` et `lte`. La fenêtre est désormais un jour plus large que la décision en
 * haut : un compte publié pile à `jusqua` est ramené sans être retenu. C'est
 * voulu. Une fenêtre trop large coûte quelques lignes lues ; une fenêtre trop
 * étroite perd des comptes en silence.
 */
export function fenetreDesJalons(maintenant: Date): { depuis: string; jusqua: string } {
  const plusLoin = Math.max(...ALERTES_JOURS)   // le jalon le plus en avance
  const plusPres = Math.min(...ALERTES_JOURS)   // le dernier avant l'échéance
  return {
    depuis: minuitDecale(maintenant, -(DUREE_ESSAI_JOURS - plusPres + 1)),
    jusqua: minuitDecale(maintenant, -(DUREE_ESSAI_JOURS - plusLoin - 1)),
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
