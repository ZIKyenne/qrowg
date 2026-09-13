// congesDates.ts — le message de congés qui ne s'éteint jamais.
//
// Relevé du 13 septembre, au navigateur, sur le bloc « Horaires » garni d'un
// contenu de vrai commerçant. Lundi 14 septembre 2026, 10 h, heure de Paris :
//
//     badge     : « Ouvert · ferme à 18h »
//     bannière  : « 📅 Fermé du 1er au 15 août »
//
// Les deux, côte à côte, dans la même rangée. Le champ « Exception / congés »
// est un texte libre sans date : le commerçant l'écrit en juillet, part en
// vacances, revient — et le message reste en ligne jusqu'à ce qu'il pense à
// l'effacer. Un mois plus tard, sa page annonce encore une fermeture terminée,
// juste à côté d'un badge qui dit l'inverse.
//
// Or la date est ÉCRITE DANS LE TEXTE. Le commerçant l'a donnée : « du 1er au
// 15 août ». Le produit peut la lire. Ce module la lit — et se tait dès qu'il
// n'est pas sûr : mieux vaut ne rien savoir que se tromper sur les congés de
// quelqu'un. Module PUR.

const MOIS: Record<string, number> = {
  janvier: 0, fevrier: 1, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, aout: 7, août: 7, septembre: 8, octobre: 9,
  novembre: 10, decembre: 11, décembre: 11,
}

/** Un jour, tel que le commerçant l'a écrit : le mois peut manquer (« du 1er au 15 août »). */
type JourEcrit = { jour: number; mois: number | null; annee: number | null }

const MOIS_MOTIF = Object.keys(MOIS).join("|")
const JOUR = String.raw`(\d{1,2})\s*(?:er)?`

/** « 15 août », « 15 août 2026 », « 1er août ». */
const EN_LETTRES = new RegExp(String.raw`${JOUR}\s+(${MOIS_MOTIF})\b(?:\s+(\d{4}))?`, "i")
/** « 15/08 », « 15/08/2026 », « 15-08-2026 ». */
const EN_CHIFFRES = /(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/

function jourSeul(s: string): JourEcrit | null {
  const l = EN_LETTRES.exec(s)
  if (l) {
    const mois = MOIS[(l[2] || "").toLowerCase()]
    if (mois === undefined) return null
    return { jour: Number(l[1]), mois, annee: l[3] ? Number(l[3]) : null }
  }
  const c = EN_CHIFFRES.exec(s)
  if (c) {
    const mois = Number(c[2]) - 1
    if (mois < 0 || mois > 11) return null
    let annee: number | null = null
    if (c[3]) annee = c[3].length === 2 ? 2000 + Number(c[3]) : Number(c[3])
    return { jour: Number(c[1]), mois, annee }
  }
  // « du 1er au 15 août » : le premier jour n'a pas de mois à lui.
  const nu = new RegExp(String.raw`^\s*${JOUR}\s*$`, "i").exec(s)
  if (nu) return { jour: Number(nu[1]), mois: null, annee: null }
  return null
}

const JOUR_MS = 86400000

/**
 * Au-delà, ce n'est plus une exception d'ouverture : c'est une fermeture
 * définitive, ou une date mal lue. Dans les deux cas le module se tait.
 */
const DUREE_MAX_JOURS = 120

function valide(j: number, m: number, a: number): boolean {
  const d = new Date(Date.UTC(a, m, j))
  return d.getUTCDate() === j && d.getUTCMonth() === m
}

/**
 * L'année qu'il faut donner à un jour-et-mois sans année : celle qui place la
 * date au plus près d'aujourd'hui. « du 1er au 15 août », lu en septembre,
 * désigne l'août qui vient de passer ; lu en juin, celui qui arrive.
 */
function avecAnnee(j: JourEcrit, mois: number, aujourdHui: Date): Date | null {
  const base = aujourdHui.getUTCFullYear()
  let meilleure: Date | null = null
  for (const a of [base - 1, base, base + 1]) {
    const annee = j.annee ?? a
    if (!valide(j.jour, mois, annee)) continue
    const d = new Date(Date.UTC(annee, mois, j.jour))
    if (!meilleure || Math.abs(d.getTime() - aujourdHui.getTime()) < Math.abs(meilleure.getTime() - aujourdHui.getTime())) meilleure = d
    if (j.annee) break
  }
  return meilleure
}

export type Periode = { debut: Date; fin: Date }

/**
 * La période annoncée par un message de congés, ou null quand le texte n'en
 * annonce aucune de façon certaine.
 *
 * Formes reconnues, celles qu'écrivent les commerçants :
 *   « Fermé du 1er au 15 août »          → deux dates, mois commun
 *   « du 24 décembre au 2 janvier »      → deux dates, passage d'année
 *   « du 01/08 au 15/08/2026 »           → deux dates en chiffres
 *   « Fermé jusqu'au 15 août »           → fin seule (début = aujourd'hui)
 *   « Fermé le 25 décembre »             → un seul jour
 *
 * Tout le reste — « Fermé cet été », « congés annuels », « Fermé quelques
 * jours » — ne renvoie rien. Le produit ne devine pas les congés de quelqu'un.
 */
export function periodeDeConges(texte: string | null | undefined, aujourdHui: Date): Periode | null {
  const t = (texte || "").trim()
  if (!t) return null

  // « du X au Y » — la forme la plus fréquente, et la seule qui borne des deux côtés.
  const plage = /\bdu\s+([^]*?)\s+au\s+([^]*?)(?:[.,;!]|$)/i.exec(t)
  if (plage) {
    const d = jourSeul(plage[1] || ""), f = jourSeul(plage[2] || "")
    if (!d || !f || f.mois === null) return null
    // Un début sans mois hérite de celui de la fin : « du 1er au 15 août ».
    const moisDebut = d.mois ?? f.mois
    const fin = avecAnnee(f, f.mois, aujourdHui)
    if (!fin) return null
    // Le début se calcule PAR RAPPORT à la fin, pas par rapport à aujourd'hui :
    // « du 24 décembre au 2 janvier » a son début l'année d'avant la fin.
    let debut = avecAnnee({ ...d, mois: moisDebut, annee: d.annee ?? fin.getUTCFullYear() }, moisDebut, fin)
    // Report à l'année d'avant SEULEMENT sur un vrai passage d'année — le mois du
    // début est plus tard dans l'année que celui de la fin (décembre → janvier).
    // Sans cette condition, « du 15 au 1er août » (une inversion de saisie)
    // devenait des congés de douze mois.
    if (debut && debut.getTime() > fin.getTime() && !d.annee && moisDebut > f.mois) {
      debut = avecAnnee({ ...d, mois: moisDebut, annee: fin.getUTCFullYear() - 1 }, moisDebut, fin)
    }
    if (!debut || debut.getTime() > fin.getTime()) return null
    if (fin.getTime() - debut.getTime() > DUREE_MAX_JOURS * JOUR_MS) return null
    return { debut, fin }
  }

  // « jusqu'au Y » — on ne connaît que la fin ; le début, c'est maintenant.
  const jusqu = /\bjusqu['’]au\s+([^]*?)(?:[.,;!]|$)/i.exec(t)
  if (jusqu) {
    const f = jourSeul(jusqu[1] || "")
    if (!f || f.mois === null) return null
    const fin = avecAnnee(f, f.mois, aujourdHui)
    if (!fin) return null
    return { debut: new Date(Math.min(fin.getTime(), aujourdHui.getTime())), fin }
  }

  // « le 25 décembre » — un seul jour, fermé ce jour-là.
  const seul = /\ble\s+([^]*?)(?:[.,;!]|$)/i.exec(t)
  if (seul) {
    const j = jourSeul(seul[1] || "")
    if (!j || j.mois === null) return null
    const d = avecAnnee(j, j.mois, aujourdHui)
    if (!d) return null
    return { debut: d, fin: d }
  }

  return null
}

export type EtatConges =
  | { etat: "aucune" }
  | ({ etat: "avant" | "pendant" | "terminee" } & Periode & { joursDepuis: number })

/**
 * Où en est le message de congés : pas de date lisible, période à venir, en
 * cours, ou terminée. La journée de fin compte ENTIÈREMENT — « du 1er au
 * 15 août » couvre le 15 août jusqu'à minuit.
 */
export function etatDesConges(texte: string | null | undefined, aujourdHui: Date): EtatConges {
  const p = periodeDeConges(texte, aujourdHui)
  if (!p) return { etat: "aucune" }
  const jour = Date.UTC(aujourdHui.getUTCFullYear(), aujourdHui.getUTCMonth(), aujourdHui.getUTCDate())
  const debut = p.debut.getTime(), fin = p.fin.getTime()
  const joursDepuis = Math.max(0, Math.round((jour - fin) / JOUR_MS))
  if (jour < debut) return { etat: "avant", ...p, joursDepuis: 0 }
  if (jour <= fin) return { etat: "pendant", ...p, joursDepuis: 0 }
  return { etat: "terminee", ...p, joursDepuis }
}

const MOIS_LABEL = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

/** « 15 août », « 1er septembre » — pour une phrase, jamais un code. */
export function jourEnFrancais(d: Date): string {
  const j = d.getUTCDate()
  return `${j === 1 ? "1er" : j} ${MOIS_LABEL[d.getUTCMonth()]}`
}

/** Le lendemain de la fin : le jour où le commerce rouvre. */
export function jourDeReouverture(p: Periode): Date {
  return new Date(p.fin.getTime() + JOUR_MS)
}

/** Le badge pendant la période : la réouverture, pas l'horaire habituel. */
export function phrasePendantConges(p: Periode): string {
  return `Fermé · réouverture le ${jourEnFrancais(jourDeReouverture(p))}`
}

/**
 * Ce qu'on dit au commerçant, dans son éditeur, d'un message dont la période est
 * passée. On ne touche pas à son texte : on lui dit ce que le produit en fait,
 * et pourquoi. Le champ s'appelle « Exception / congés » : une ouverture
 * exceptionnelle passée est aussi périmée qu'une fermeture.
 */
export function phraseCongesTermines(e: EtatConges): string | null {
  if (e.etat !== "terminee") return null
  const depuis = e.joursDepuis <= 1 ? "hier" : e.joursDepuis < 31
    ? `depuis ${e.joursDepuis} jours`
    : `depuis le ${jourEnFrancais(e.fin)}`
  return `Message d'exception terminé ${depuis} — il n'est plus affiché en ligne`
}
