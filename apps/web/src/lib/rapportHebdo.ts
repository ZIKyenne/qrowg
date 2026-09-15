import { peutRecevoir } from "./consentementEmail"
// rapportHebdo.ts — deux rapports hebdomadaires, deux interrupteurs, deux chiffres.
//
// Relevé du 14 septembre. `vercel.json` planifie DEUX tâches qui envoient chacune
// un rapport hebdomadaire :
//
//     /api/emails/weekly   « 0 8 * * 1 »   (lundi 8 h)
//     /api/reports/send    « 0 8 * * * »   (tous les jours, filtre last_sent_at)
//
// Sur un compte réel — trois pages publiées, une remise en brouillon lundi
// dernier, plus une page de l'équipe dont il est membre :
//
//     /api/emails/weekly    « Votre semaine »    730 visites  sur 4 pages
//     /api/reports/send     « Semaine du … »     420 visites  sur 3 pages
//     écart : 310 visites — la page remise en brouillon.
//     ni l'un ni l'autre ne compte la page de l'équipe (180 visites).
//
// Et deux interrupteurs, dans deux écrans différents :
//
//     Réglages : Rapport hebdo OFF        → aucun e-mail
//     Réglages OFF + abonnement ON        → reports/send            (1 e-mail)
//     Réglages ON  + abonnement ON        → les deux                (2 e-mails)
//
// Le commerçant qui coupe « Rapport hebdomadaire » dans ses Réglages continue
// donc d'en recevoir un, avec d'autres chiffres. Et celui qui s'abonne depuis
// l'écran Statistiques en reçoit deux le lundi.
//
// Pire : `reports/send` faisait `if (!pageIds.length) continue` — aucun e-mail,
// `last_sent_at` NON mis à jour (l'abonnement est re-sélectionné tous les jours,
// indéfiniment), et le journal notait « 0 envoyé(s) », un état d'apparence
// saine. Un abonnement proposé dans le produit n'envoyait jamais rien, sans que
// rien nulle part ne le dise.
//
// Une règle, deux tâches. Module PUR.

/** La clé de la préférence, telle que l'écran Réglages l'écrit. */
export const PREFERENCE_HEBDO = "weekly_report"

export type RaisonNonEnvoi = "desactive" | "deja_couvert" | "sans_adresse" | null

export const LIBELLE_RAISON: Record<Exclude<RaisonNonEnvoi, null>, string> = {
  desactive: "rapport coupé dans les Réglages",
  deja_couvert: "déjà couvert par son abonnement",
  sans_adresse: "sans adresse e-mail",
}

type Preferences = Record<string, unknown> | null | undefined

/**
 * L'interrupteur des Réglages. Opt-OUT : absent vaut activé — c'est ce que
 * l'écran affiche par défaut.
 */
export function hebdoDesactive(preferences: Preferences): boolean {
  return !peutRecevoir("rapportHebdo", preferences)
}

const adresse = (v: unknown): string => (typeof v === "string" ? v.trim() : "")

/**
 * Le rapport simple du lundi (`api/emails/weekly`). On ne l'envoie pas à qui a
 * coupé l'interrupteur, ni à qui reçoit déjà le rapport détaillé de son
 * abonnement : sinon il reçoit deux fois la même semaine, avec deux chiffres.
 */
export function raisonDuRapportSimple(p: {
  email?: string | null
  preferences?: Preferences
  abonneHebdo?: boolean
}): RaisonNonEnvoi {
  if (!adresse(p.email)) return "sans_adresse"
  if (hebdoDesactive(p.preferences)) return "desactive"
  if (p.abonneHebdo) return "deja_couvert"
  return null
}

/**
 * Le rapport détaillé de l'abonnement (`api/reports/send`). L'abonnement est un
 * choix explicite, mais l'interrupteur des Réglages reste au-dessus : sans quoi
 * l'écran Réglages ment à celui qui coupe.
 *
 * Seul l'hebdomadaire est concerné — le mensuel n'a pas d'interrupteur, et on
 * n'en invente pas un en lui appliquant celui d'une autre fréquence.
 */
export function raisonDuRapportAbonne(p: {
  email?: string | null
  preferences?: Preferences
  frequence?: string | null
}): RaisonNonEnvoi {
  if (!adresse(p.email)) return "sans_adresse"
  if (p.frequence === "weekly" && hebdoDesactive(p.preferences)) return "desactive"
  return null
}

/**
 * Les pages qui entrent dans un rapport : TOUTES celles du périmètre, quel que
 * soit leur statut. Une visite enregistrée pendant la semaine est un fait ;
 * remettre la page en brouillon le lundi suivant ne l'efface pas.
 */
export function pagesDuRapport<T extends { id?: string | null }>(pages: T[] | null | undefined): string[] {
  return (pages ?? []).map(p => p?.id).filter((id): id is string => typeof id === "string" && id.length > 0)
}

/**
 * Ce qu'on écrit dans le journal des tâches. Un destinataire écarté doit
 * apparaître quelque part : « 0 envoyé(s) » ne distingue pas « personne à
 * servir » de « tout le monde sauté en silence ».
 */
export function journalDesIgnores(ignores: Partial<Record<Exclude<RaisonNonEnvoi, null>, number>>): string {
  const bouts = (Object.keys(LIBELLE_RAISON) as Exclude<RaisonNonEnvoi, null>[])
    .map(r => ({ r, n: ignores?.[r] ?? 0 }))
    .filter(x => x.n > 0)
    .map(x => `${x.n} ${LIBELLE_RAISON[x.r]}`)
  return bouts.length ? `ignorés : ${bouts.join(", ")}` : ""
}

/** Le détail complet d'un passage : ce qui est parti, et ce qui ne l'est pas. */
export function detailDuPassage(envoyes: number, ignores: Partial<Record<Exclude<RaisonNonEnvoi, null>, number>>, echecs: string[] = []): string {
  const bouts = [`${envoyes} envoyé(s)`]
  const ign = journalDesIgnores(ignores)
  if (ign) bouts.push(ign)
  if (echecs.length) bouts.push(`${echecs.length} échec(s) : ${echecs.join(" · ")}`)
  return bouts.join(", ")
}
