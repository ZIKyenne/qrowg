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

// ── L'angle mort du balayage de ce module (lot v108) ────────────────────────
//
// Relevé du 14 septembre. Le balayage du lot v101 interdit
// `toISOString().slice(0, 10)`. Il ne voit pas les DEUX autres façons de lire une
// horloge qui n'est pas celle du commerçant :
//
//   `now.getMonth()`, `getDate()`, `getHours()`  → l'horloge de la machine
//   `toLocaleDateString("fr-FR", { … })`         → l'horloge de la machine
//
// Trois conséquences mesurées :
//
//  1. Le MOIS du quota n'est pas celui du tableau de bord.
//       cron/quota-alerts:62   new Date(now.getFullYear(), now.getMonth(), 1)
//     Le serveur tourne en UTC. Le 1er juillet à 00 h 30 à Paris, il est encore
//     le 30 juin pour lui : sa borne de mois est le 1er JUIN. Il compte un mois
//     de trop, et peut annoncer un quota dépassé sur des vues de juin — l'alerte
//     qui pousse à changer de plan.
//
//  2. L'HEURE DE POINTE est celle du navigateur.
//       AnalyticsClient:195    new Date(t).getHours()
//     Un même scan donne 21 h à Paris, 19 h en UTC, 15 h à la Martinique, 9 h à
//     Tahiti. Le produit dit « votre heure de pointe » comme un fait sur le
//     commerce ; c'est un fait sur l'appareil qui regarde.
//
//  3. La DATE DES E-MAILS est celle du serveur.
//       emails/weekly:88       new Date().toLocaleDateString("fr-FR", { … })
//     Un rapport parti lundi 00 h 30 à Paris porte la date de la veille.
//
// La règle du lot v101 ne change pas, elle s'étend : **une heure, un jour, un
// mois sont ceux du commerçant, pas ceux de l'horloge qui calcule.**

/** Les champs d'un instant, lus chez le commerçant. */
export type ChampsDuJour = { annee: number; mois: number; jour: number; heure: number; minute: number }

export function champsDuCommerce(instant: Date | string | number | null | undefined, fuseau?: string | null): ChampsDuJour | null {
  const d = instantDe(instant)
  if (!d) return null
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzDe(fuseau), year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d)
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value ?? "0")
  // « 24 » à minuit sur certains moteurs : ramené à 0, le jour est déjà le bon.
  return { annee: n("year"), mois: n("month"), jour: n("day"), heure: n("hour") % 24, minute: n("minute") }
}

/** L'heure (0–23) de cet instant chez le commerçant. `null` si illisible. */
export function heureDuCommerce(instant: Date | string | number | null | undefined, fuseau?: string | null): number | null {
  return champsDuCommerce(instant, fuseau)?.heure ?? null
}

/** La clé du mois — « 2026-07 » — chez le commerçant. */
export function cleDuMois(instant: Date | string | number = Date.now(), fuseau?: string | null): string {
  const c = champsDuCommerce(instant, fuseau)
  return c ? `${c.annee}-${String(c.mois).padStart(2, "0")}` : ""
}

/**
 * L'instant précis où le jour a commencé chez le commerçant, en ISO.
 *
 * On part de son jour calendaire, puis on cherche l'instant UTC qui s'y projette
 * à minuit : `Intl` seul ne rend pas de décalage, et l'écrire à la main se
 * trompe deux dimanches par an.
 */
function minuitChez(cle: CleDeJour, fuseau?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cle)
  if (!m) return ""
  const tz = tzDe(fuseau)
  // Première approximation : minuit UTC de ce jour. On corrige du décalage lu
  // à cet instant-là (l'heure d'été change le décalage, pas la méthode).
  let t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  for (let i = 0; i < 3; i++) {
    const c = champsDuCommerce(t, tz)
    if (!c) return new Date(t).toISOString()
    const ecart = (c.heure * 60 + c.minute) + (jourDuCommerce(t, tz) > cle ? 1440 : jourDuCommerce(t, tz) < cle ? -1440 : 0)
    if (ecart === 0) break
    t -= ecart * 60_000
  }
  return new Date(t).toISOString()
}

/** Le début du jour en cours chez le commerçant, en ISO — une borne de requête. */
export function debutDuJour(now: number = Date.now(), fuseau?: string | null): string {
  return minuitChez(jourDuCommerce(now, fuseau), fuseau)
}

/** Le début du mois en cours chez le commerçant, en ISO. */
export function debutDuMois(now: number = Date.now(), fuseau?: string | null): string {
  const c = champsDuCommerce(now, fuseau)
  if (!c) return ""
  return minuitChez(`${c.annee}-${String(c.mois).padStart(2, "0")}-01`, fuseau)
}

/** Le début du jour, N jours plus tôt, chez le commerçant. */
export function debutDuJourIlYA(jours: number, now: number = Date.now(), fuseau?: string | null): string {
  const serie = serieDeJours(Math.max(1, Math.floor(jours) + 1), fuseau, now)
  return minuitChez(serie[0], fuseau)
}

/**
 * Une date écrite pour le commerçant — jamais sur l'horloge de la machine qui
 * la formate. C'est le même oubli que `getHours()`, sous une autre forme.
 */
export function dateLisible(
  instant: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
  fuseau?: string | null,
): string {
  const d = instantDe(instant)
  if (!d) return ""
  return new Intl.DateTimeFormat("fr-FR", { timeZone: tzDe(fuseau), ...options }).format(d)
}
