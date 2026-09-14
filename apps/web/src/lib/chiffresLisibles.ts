// chiffresLisibles.ts — l'arrondi ne doit pas effacer le fait.
//
// Relevé du 14 septembre, en rejouant les formules de pourcentage du produit sur
// des chiffres de commerçant.
//
// 1) Taux de conversion — `profile/page.tsx:736`
//    `Math.round((scansQR / vues) * 100)`
//
//      3 scans sur 1200 vues   (0,25 %)   affiché « 0 % »
//      1 scan  sur  900 vues   (0,11 %)   affiché « 0 % »
//      4 scans sur 1000 vues   (0,40 %)   affiché « 0 % »
//
//    Le commerçant lit « 0 % » et conclut que son QR ne convertit pas. Il y a
//    pourtant des scans, et l'écran les affiche deux lignes plus haut.
//
// 2) Jauge de quota — `DashboardShell.tsx:417`
//    `Math.min(100, Math.round((actifs / limite) * 100))`
//
//      199 QR actifs sur 200              jauge « 100 % », pleine
//
//    Il reste un slot. La jauge dit le contraire.
//
// 3) Croissance du rapport hebdomadaire — `api/reports/send:32`
//
//      1000 → 1002 vues                   « +0 % »
//       998 → 1000 vues                   « +0 % »
//
//    « Stable » alors que ça a bougé.
//
// 4) Évolution d'un QR — `api/qr-stats/[id]:99`
//
//      2000 → 7 scans                     « -100 % »
//
//    -99,65 % arrondi à -100 : « tout perdu », alors qu'il reste des scans.
//
// 5) Et le même chiffre s'écrit de deux façons dans le même produit :
//
//      profile/page.tsx   « 12 543 scans »   (toLocaleString("fr-FR"))
//      OverviewCards.tsx  « 12543 scans »    (brut)
//
// La règle commune : **un arrondi ne transforme jamais un chiffre non nul en
// zéro, ni un incomplet en total.** Quand l'arrondi effacerait le fait, on
// montre une décimale de plus au lieu de mentir d'un cran. Module PUR.

// L'espace avant le « % » est une FINE INSÉCABLE : ordinaire, elle laissait le
// signe partir seul à la ligne sur téléphone — « (82 » puis « %) » (lot v103).
import { FINE } from "./typographieFr"

/** Le séparateur de milliers français vient d'`Intl`, pas d'une regex maison. */
export function nombreFr(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return "0"
  return v.toLocaleString("fr-FR")
}

/** « 3 scans », « 1 scan » — l'accord se fait ici, une fois. */
export function compte(n: unknown, singulier: string, pluriel?: string): string {
  const v = typeof n === "number" ? n : Number(n)
  const k = Number.isFinite(v) ? v : 0
  const mot = Math.abs(k) >= 2 ? (pluriel ?? `${singulier}s`) : singulier
  return `${nombreFr(k)} ${mot}`
}

/** Deux décimales au maximum : en dessous, le chiffre n'apprend plus rien. */
const DECIMALES_MAX = 2

const fr = (x: number, decimales: number): string =>
  x.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })

/**
 * Le nombre de décimales qui garde le fait visible.
 *
 * Zéro tant que l'arrondi ne ment pas ; une, puis deux, dès qu'il effacerait
 * une valeur non nulle (ou remplirait un total qui ne l'est pas). Au-delà de
 * deux, aucun chiffre ne parle plus : l'appelant passe à la forme « < 0,01 % ».
 */
function decimalesUtiles(valeur: number, plafond: number | null): number {
  for (let d = 0; d <= DECIMALES_MAX; d++) {
    const arrondi = Number(valeur.toFixed(d))
    if (arrondi === 0 && valeur !== 0) continue
    if (plafond !== null && arrondi === plafond && valeur !== plafond) continue
    return d
  }
  return -1
}

export type OptionsPourcentage = {
  /** Le pourcentage ne peut pas dépasser cette valeur (une part d'un total : 100). */
  plafond?: number | null
  /** Ce qu'on affiche quand il n'y a rien à diviser. */
  siVide?: string
}

/**
 * Une part d'un total, en pourcentage, écrit pour être lu.
 *
 * Jamais « 0 % » sur une part non nulle, jamais « 100 % » sur une part
 * incomplète : c'est exactement ce que faisaient le taux de conversion et la
 * jauge de quota.
 */
export function pourcentage(part: unknown, total: unknown, options: OptionsPourcentage = {}): string {
  const p = Number(part), t = Number(total)
  const siVide = options.siVide ?? "—"
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return siVide
  const plafond = options.plafond === undefined ? 100 : options.plafond
  const brut = (p / t) * 100
  const borne = plafond !== null ? Math.min(brut, plafond) : brut
  const d = decimalesUtiles(borne, plafond)
  if (d < 0) {
    // Trop petit (ou trop proche du total) pour qu'un chiffre parle : on le dit.
    const seuil = fr(1 / 10 ** DECIMALES_MAX, DECIMALES_MAX)
    return borne < 1
      ? `< ${seuil}${FINE}%`
      : `> ${fr((plafond ?? 100) - 1 / 10 ** DECIMALES_MAX, DECIMALES_MAX)}${FINE}%`
  }
  return `${fr(borne, d)}${FINE}%`
}

/** La part exacte, pour la LARGEUR d'une barre — bornée, jamais arrondie. */
export function partDeJauge(part: unknown, total: unknown): number {
  const p = Number(part), t = Number(total)
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return 0
  return Math.max(0, Math.min(100, (p / t) * 100))
}

/**
 * Une jauge de quota : la barre est exacte, l'étiquette est honnête, et
 * `pleine` dit la seule chose qui compte — reste-t-il de la place ?
 *
 * La jauge disait « 100 % » à 199 sur 200. `pleine` ne se déduit plus de
 * l'étiquette : elle se lit sur les chiffres eux-mêmes.
 */
export function jauge(part: unknown, total: unknown): { largeur: number; texte: string; pleine: boolean } {
  const p = Number(part), t = Number(total)
  const valide = Number.isFinite(p) && Number.isFinite(t) && t > 0
  return {
    largeur: partDeJauge(part, total),
    texte: pourcentage(part, total),
    pleine: valide && p >= t,
  }
}

export type Evolution = { texte: string; sens: "hausse" | "baisse" | "stable" | "nouveau" }

/**
 * L'évolution entre deux périodes.
 *
 * Sans période précédente, il n'y a pas de pourcentage à calculer : « nouveau »
 * est un fait, « +100 % » était une invention. Et un écart réel n'est jamais
 * rendu par « +0 % » : on descend d'une décimale.
 */
export function evolution(courant: unknown, precedent: unknown): Evolution {
  const c = Number(courant), p = Number(precedent)
  if (!Number.isFinite(c) || !Number.isFinite(p)) return { texte: "—", sens: "stable" }
  if (p <= 0) return c > 0 ? { texte: "nouveau", sens: "nouveau" } : { texte: "—", sens: "stable" }
  if (c === p) return { texte: "stable", sens: "stable" }
  const brut = ((c - p) / p) * 100
  // Une baisse est plafonnée à 100 % : on ne peut pas perdre plus que tout. Sans
  // ce plafond, 2000 → 7 s'arrondissait en « −100 % » — « tout perdu », alors
  // qu'il restait des scans. Une hausse, elle, n'a pas de toit.
  const d = decimalesUtiles(Math.abs(brut), brut < 0 ? 100 : null)
  const sens = brut > 0 ? "hausse" : "baisse"
  if (d < 0) return { texte: brut > 0 ? "à peine plus" : "à peine moins", sens }
  return { texte: `${brut > 0 ? "+" : "−"}${fr(Math.abs(brut), d)}${FINE}%`, sens }
}

/** Le même fait, en une phrase — pour les e-mails, qui n'ont pas de flèche. */
export function phraseEvolution(courant: unknown, precedent: unknown, quoi: string): string {
  const e = evolution(courant, precedent)
  if (e.sens === "nouveau") return `${compte(courant, quoi)} — une première.`
  if (e.sens === "stable") return `${compte(courant, quoi)}, comme la semaine dernière.`
  return `${compte(courant, quoi)} (${e.texte} par rapport à la semaine dernière).`
}
