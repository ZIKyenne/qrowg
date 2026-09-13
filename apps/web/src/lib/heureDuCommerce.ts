// heureDuCommerce.ts — les horaires sont ceux du commerce, pas ceux du téléphone.
//
// Relevé du 13 septembre, au navigateur, sur le modèle « Bistrot français »
// (Lun-Ven 12h-14h30 et 19h-23h). Même instant réel — lundi 22 h 30 à Paris —
// rendu dans trois fuseaux :
//
//     Europe/Paris      → « Ferme bientôt · à 23h »   (vrai)
//     America/New_York  → « Fermé · ouvre à 19h »     (faux : le service tourne)
//     Asia/Tokyo        → « Fermé · ouvre à 12h »     (faux, et mauvais jour)
//
// La cause : `openStatus` lisait `now.getDay()` et `now.getHours()`, c'est-à-dire
// l'horloge DU VISITEUR. Un client à l'étranger qui prépare sa venue, un
// touriste dont le téléphone n'a pas changé de fuseau, un lien partagé dans un
// groupe international : tous lisaient « Fermé » d'un commerce ouvert. Le
// surlignage « Aujourd'hui » se trompait de ligne pour la même raison.
//
// Un horaire appartient au lieu. On le lit donc dans le fuseau du lieu.
// Module PUR (Intl seulement, aucune I/O).

/**
 * À défaut de fuseau saisi. QRowg est un produit français : interface,
 * modèles et assistance en français, commerçants en France. L'hypothèse est
 * assumée et RÉVERSIBLE — le champ « Fuseau horaire » du bloc la remplace en un
 * clic pour un commerce ailleurs.
 */
export const FUSEAU_DEFAUT = "Europe/Paris"

/** Les fuseaux proposés dans l'éditeur. Métropole d'abord, puis l'outre-mer. */
export const FUSEAUX_PROPOSES = [
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/Zurich",
  "Europe/Luxembourg",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Madrid",
  "America/Montreal",
  "Indian/Reunion",
  "America/Martinique",
  "America/Guadeloupe",
  "America/Cayenne",
  "Pacific/Tahiti",
  "Pacific/Noumea",
  "Indian/Mayotte",
  "Africa/Casablanca",
  "Africa/Abidjan",
  "Africa/Dakar",
] as const

/** Vrai si le moteur Intl connaît ce fuseau. */
export function fuseauValide(fuseau: string | null | undefined): boolean {
  const tz = (fuseau || "").trim()
  if (!tz) return false
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Le fuseau d'un bloc d'horaires : le sien s'il est valide, sinon celui par défaut. */
export function fuseauDuBloc(c: { fuseau?: unknown } | null | undefined): string {
  const tz = typeof c?.fuseau === "string" ? c.fuseau.trim() : ""
  return fuseauValide(tz) ? tz : FUSEAU_DEFAUT
}

const JOURS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * L'instant `now`, lu dans le fuseau du commerce : quel jour il y est, et
 * combien de minutes se sont écoulées depuis minuit là-bas.
 *
 * `Intl` fait tout le travail, heure d'été comprise — écrire le décalage à la
 * main, c'est se tromper deux dimanches par an.
 */
export function chezLeCommerce(now: Date, fuseau: string): { jour: number; minutes: number } {
  const tz = fuseauValide(fuseau) ? fuseau : FUSEAU_DEFAUT
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now)
  const lire = (t: string) => parts.find(p => p.type === t)?.value ?? ""
  const jour = JOURS_EN.indexOf(lire("weekday"))
  // « 24 » à minuit sur certains moteurs : ramené à 0, le jour est déjà le bon.
  const h = Number(lire("hour")) % 24
  const m = Number(lire("minute"))
  return { jour: jour < 0 ? now.getDay() : jour, minutes: h * 60 + m }
}

/**
 * Le jour CALENDAIRE du commerce à cet instant, ramené à minuit UTC. Sert à
 * comparer des dates entre elles (congés, exceptions) sans jamais mélanger
 * l'heure du visiteur avec celle du lieu.
 */
export function dateChezLeCommerce(now: Date, fuseau: string): Date {
  const tz = fuseauValide(fuseau) ? fuseau : FUSEAU_DEFAUT
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const lire = (t: string) => Number(parts.find(p => p.type === t)?.value ?? "0")
  return new Date(Date.UTC(lire("year"), lire("month") - 1, lire("day")))
}

/** Décalage d'un fuseau à cet instant, en minutes (positif à l'est de Greenwich). */
function decalage(now: Date, fuseau: string): number {
  const { jour, minutes } = chezLeCommerce(now, fuseau)
  const utcJour = now.getUTCDay()
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  let d = minutes - utcMin
  // Franchissement de minuit : le jour local est en avance ou en retard d'un cran.
  const ecartJour = (jour - utcJour + 7) % 7
  if (ecartJour === 1) d += 1440
  else if (ecartJour === 6) d -= 1440
  return d
}

/**
 * Le visiteur lit-il la même heure que le commerce ? On compare les DÉCALAGES à
 * cet instant, pas les noms : Europe/Paris et Europe/Madrid marquent la même
 * heure, prévenir n'apporterait rien.
 */
export function memeHeureQue(now: Date, fuseauCommerce: string, fuseauVisiteur: string | null | undefined): boolean {
  if (!fuseauValide(fuseauVisiteur)) return true   // dans le doute, on ne crie pas au loup
  return decalage(now, fuseauCommerce) === decalage(now, fuseauVisiteur as string)
}

/** Le fuseau du navigateur, ou null quand il ne le dit pas. */
export function fuseauDuVisiteur(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

/**
 * « heure de Paris », « heure de Fort-de-France » — la mention posée à côté du
 * badge quand le visiteur n'est pas à la même heure que le commerce. Le nom
 * vient du fuseau lui-même : aucune table à tenir à jour.
 */
export function mentionFuseau(fuseau: string): string {
  const tz = fuseauValide(fuseau) ? fuseau : FUSEAU_DEFAUT
  const ville = (tz.split("/").pop() || tz).replace(/_/g, " ")
  return `heure de ${ville}`
}
