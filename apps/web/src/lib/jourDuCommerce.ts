// jourDuCommerce.ts — un jour, c'est un jour chez le commerçant.
//
// Relevé du 14 septembre, en rejouant les agrégations du produit sur un service
// du samedi soir dans un bar parisien (juillet, UTC+2) :
//
//   horodatage en base      heure à Paris   jour affiché   jour réel
//   2026-07-11T19:10:00Z    21h10           11 samedi      11 samedi
//   2026-07-11T21:40:00Z    23h40           11 samedi      11 samedi
//   2026-07-11T22:15:00Z    00h15           11 samedi      12 DIMANCHE
//   2026-07-11T22:50:00Z    00h50           11 samedi      12 DIMANCHE
//   2026-07-11T23:30:00Z    01h30           11 samedi      12 DIMANCHE
//
//   le produit affiche : { "2026-07-11": 6 }
//   la réalité         : { "2026-07-11": 3, "2026-07-12": 3 }
//
// La moitié du service part sur la veille. Pour un bar, un restaurant, une
// salle : toutes les heures de 0 h à 2 h du matin — les leurs — sont comptées la
// veille. « Votre meilleur jour : samedi » quand c'était dimanche.
//
// Trois endroits découpent les jours en UTC :
//
//   lib/scanStats.ts          `toUtcDay` — le commentaire l'assume : « (UTC) »
//   analytics/analyticsAgg.ts `buildDailyData`, clés `.slice(0, 10)`
//   analytics/GoalsDashboard  `dailyMap`, `clicked_at.slice(0, 10)`
//
// Et « aujourd'hui » suit : à 00 h 30 le dimanche, le tableau de bord dit
// « aujourd'hui = samedi ». Le commerçant ferme, fait sa caisse, ouvre l'appli —
// et lit les chiffres de la veille sous l'étiquette du jour.
//
// Un quatrième défaut, pour l'outre-mer que le produit propose lui-même dans
// `FUSEAUX_PROPOSES` : `formatDay` faisait `new Date("2026-07-11").getDate()`,
// c'est-à-dire minuit UTC relu dans l'horloge du navigateur. À l'ouest de
// Greenwich, l'étiquette recule d'un jour :
//
//   Europe/Paris        « 11/7 »
//   Indian/Reunion      « 11/7 »
//   America/Martinique  « 10/7 »   ← faux
//   Pacific/Tahiti      « 10/7 »   ← faux
//
// Le produit a DÉJÀ tranché cette question, pour les horaires d'ouverture :
// « un horaire appartient au lieu, on le lit donc dans le fuseau du lieu »
// (`lib/heureDuCommerce.ts`). Un scan aussi. Ce module applique la même décision
// aux chiffres, avec le même fuseau par défaut et le même outil — `Intl`, qui
// connaît l'heure d'été ; l'écrire à la main, c'est se tromper deux dimanches
// par an. Module PUR.

import { FUSEAU_DEFAUT, fuseauValide } from "./heureDuCommerce"

export { FUSEAU_DEFAUT }

/** Une clé de jour : « YYYY-MM-DD », telle que l'attendent les agrégations. */
export type CleDeJour = string

const JOUR_MS = 86_400_000

const instantDe = (v: Date | string | number | null | undefined): Date | null => {
  if (v === null || v === undefined || v === "") return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

const tzDe = (fuseau?: string | null): string => (fuseauValide(fuseau) ? (fuseau as string) : FUSEAU_DEFAUT)

/**
 * Le jour calendaire de cet instant CHEZ LE COMMERÇANT.
 *
 * `en-CA` rend directement « YYYY-MM-DD » : pas de recomposition à la main, donc
 * pas de mois décalé d'une unité ni de zéro oublié.
 */
export function jourDuCommerce(instant: Date | string | number | null | undefined, fuseau?: string | null): CleDeJour {
  const d = instantDe(instant)
  if (!d) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tzDe(fuseau), year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d)
}

/** Le jour d'aujourd'hui chez le commerçant — pas celui de l'horloge UTC. */
export function aujourdHuiDuCommerce(fuseau?: string | null, now: number = Date.now()): CleDeJour {
  return jourDuCommerce(now, fuseau)
}

/**
 * Le squelette d'une fenêtre : `nb` jours consécutifs finissant aujourd'hui,
 * du plus ancien au plus récent.
 *
 * On avance de 24 h puis on relit le jour dans le fuseau, au lieu de décaler une
 * date : les deux dimanches de changement d'heure durent 23 h et 25 h, et un
 * décalage brut y saute ou répète un jour. Relire supprime la question.
 */
export function serieDeJours(nb: number, fuseau?: string | null, now: number = Date.now()): CleDeJour[] {
  const n = Math.max(0, Math.floor(nb))
  const tz = tzDe(fuseau)
  const vus: CleDeJour[] = []
  const deja = new Set<CleDeJour>()
  for (let i = n - 1; i >= 0; i--) {
    const cle = jourDuCommerce(now - i * JOUR_MS, tz)
    if (deja.has(cle)) continue
    deja.add(cle); vus.push(cle)
  }
  return vus
}

/** Cet instant tombe-t-il dans la fenêtre affichée ? */
export function dansLaFenetre(instant: Date | string | number | null | undefined, jours: CleDeJour[]): boolean {
  const cle = jourDuCommerce(instant)
  return !!cle && jours.includes(cle)
}

const NOMBRE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * L'étiquette courte d'une clé de jour : « 2026-07-11 » → « 11/7 ».
 *
 * On lit les trois nombres de la chaîne. Passer par `new Date("2026-07-11")`
 * donnait minuit UTC, relu ensuite dans l'horloge du navigateur : à la Martinique
 * ou à Tahiti, l'étiquette reculait d'un jour.
 */
export function etiquetteDeJour(cle: CleDeJour | null | undefined): string {
  const m = NOMBRE.exec((cle ?? "").trim())
  if (!m) return ""
  return `${Number(m[3])}/${Number(m[2])}`
}

/** Le nom du jour d'une clé — « samedi », « dimanche ». Même lecture littérale. */
export function nomDuJour(cle: CleDeJour | null | undefined, langue = "fr-FR"): string {
  const m = NOMBRE.exec((cle ?? "").trim())
  if (!m) return ""
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return new Intl.DateTimeFormat(langue, { timeZone: "UTC", weekday: "long" }).format(d)
}

/** Deux instants tombent-ils le même jour chez le commerçant ? */
export function memeJour(a: Date | string | number | null | undefined, b: Date | string | number | null | undefined, fuseau?: string | null): boolean {
  const x = jourDuCommerce(a, fuseau)
  return !!x && x === jourDuCommerce(b, fuseau)
}

/**
 * La mention à poser près des chiffres quand celui qui regarde n'est pas à
 * l'heure du commerce — `null` quand il l'est, pour ne pas encombrer l'écran
 * d'une précision inutile. Même logique que le badge d'horaires.
 */
export function mentionFuseauDesStats(fuseauLecteur?: string | null, fuseauCommerce?: string | null, now: number = Date.now()): string | null {
  const commerce = tzDe(fuseauCommerce)
  if (!fuseauValide(fuseauLecteur)) return null
  const jourIci = jourDuCommerce(now, fuseauLecteur)
  const heure = (tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now)
  if (jourIci === jourDuCommerce(now, commerce) && heure(fuseauLecteur as string) === heure(commerce)) return null
  const ville = commerce.split("/").pop()?.replace(/_/g, " ") ?? commerce
  return `Jours comptés à l'heure de ${ville}.`
}
