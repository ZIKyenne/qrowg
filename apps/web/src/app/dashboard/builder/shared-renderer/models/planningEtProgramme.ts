// planningEtProgramme.ts — les modèles PURS du sport et de l'événement (20 nov.) :
//  · le PLANNING des cours de la semaine : le prochain cours, aujourd'hui mis en
//    avant, un cours « complet » sans bouton de réservation ;
//  · le PROGRAMME d'un événement : ce qui se passe EN CE MOMENT le jour J, et
//    plus rien une fois l'événement passé.
// Tout se lit à l'heure du commerce.

import { texteUtile } from "./repeaterExtract"
import { chezLeCommerce, fuseauDuBloc } from "@/lib/heureDuCommerce"
import { jourDuCommerce } from "./platDuJour"
import { fmtMinutes } from "../../types"

const lignes = (v: unknown) => texteUtile(v).split(/\r?\n/).map(l => l.trim()).filter(Boolean)

// ── Planning des cours ──────────────────────────────────────────────────────
/** Ordre d'affichage : la semaine commence le lundi. Indices JS (0 = dimanche). */
export const SEMAINE = [1, 2, 3, 4, 5, 6, 0] as const
export const NOMS_JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const
const ABREV: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 }

export type Cours = { rang: number; jour: number; minutes: number; heure: string; nom: string; details: string; complet: boolean }

/** « Mar 18h30 Yoga · 60 min · Léa » ; « (complet) » ou « complet » en fin de ligne. */
export function lirePlanning(v: unknown): Cours[] {
  const out: Cours[] = []
  lignes(v).forEach((l, rang) => {
    const m = /^(lun|mar|mer|jeu|ven|sam|dim)[a-zé]*\.?\s+(\d{1,2})\s?[h:.]\s?(\d{2})?\s*[-–—·:]?\s*(.*)$/i.exec(l)
    if (!m) return
    const h = Number(m[2]), mn = m[3] ? Number(m[3]) : 0
    if (h > 23 || mn > 59) return
    let reste = m[4].trim()
    const complet = /\(?\bcomplet\)?\s*$/i.test(reste)
    if (complet) reste = reste.replace(/[\s·—-]*\(?\bcomplet\)?\s*$/i, "").trim()
    const [nom, ...details] = reste.split(/\s+·\s+/)
    out.push({ rang, jour: ABREV[m[1].toLowerCase()], minutes: h * 60 + mn, heure: fmtMinutes(h * 60 + mn), nom: nom || "Cours", details: details.join(" · "), complet })
  })
  return out
}

/** Les cours rangés par jour, lundi d'abord, chaque jour trié par heure ; jours vides omis. */
export function parJour(cours: Cours[]): { jour: number; cours: Cours[] }[] {
  return SEMAINE.map(j => ({ jour: j, cours: cours.filter(c => c.jour === j).sort((a, b) => a.minutes - b.minutes) })).filter(g => g.cours.length)
}

/** `dansMin` : minutes d'ici au début du cours, toutes journées comprises. */
export type Prochain = { cours: Cours; dansJours: number; dansMin: number }

/** Le prochain cours NON complet, à partir de maintenant (dans les 7 jours). */
export function prochainCours(cours: Cours[], aujourdhui: number, minutes: number): Prochain | null {
  let best: Prochain | null = null
  for (const c of cours) {
    if (c.complet) continue
    let d = (c.jour - aujourdhui + 7) % 7
    if (d === 0 && c.minutes <= minutes) d = 7
    const dansMin = d * 1440 + c.minutes - minutes
    if (!best || dansMin < best.dansMin) best = { cours: c, dansJours: d, dansMin }
  }
  return best
}

export type EtatPlanning = { groupes: { jour: number; cours: Cours[] }[]; aujourdhui: number; prochain: Prochain | null }

export function etatPlanning(c: Record<string, any>, now: Date): EtatPlanning {
  const { jour, minutes } = chezLeCommerce(now, fuseauDuBloc(c))
  const cours = lirePlanning(c?.planning)
  return { groupes: parJour(cours), aujourdhui: jour, prochain: prochainCours(cours, jour, minutes) }
}

/** « aujourd'hui à 18h30 (dans 40 min) », « demain à 9h », « jeudi à 18h30 ». */
export function quandLisible(p: Prochain): string {
  const h = p.cours.heure
  if (p.dansJours === 0) {
    const m = p.dansMin
    const dans = m < 60 ? `dans ${m} min` : m % 60 ? `dans ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `dans ${m / 60} h`
    return `aujourd'hui à ${h} (${dans})`
  }
  if (p.dansJours === 1) return `demain à ${h}`
  return `${NOMS_JOURS[p.cours.jour].toLowerCase()} à ${h}`
}

export const ACTIONS_COURS = ["Aucune", "Appeler", "WhatsApp", "Lien de réservation"] as const

export function messageDeCours(c: Cours): string {
  return `Bonjour, je souhaite réserver le cours « ${c.nom} » du ${NOMS_JOURS[c.jour].toLowerCase()} à ${c.heure}. Merci !`
}

// ── Programme d'un événement ────────────────────────────────────────────────
export type Moment = { rang: number; minutes: number; heure: string; quoi: string }

/** « 19h Ouverture des portes » ; après minuit, l'heure continue (00h30 → 24h30). */
export function lireProgramme(v: unknown): Moment[] {
  const out: Moment[] = []
  let avant = -1
  lignes(v).forEach((l, rang) => {
    const m = /^(\d{1,2})\s?[h:.]\s?(\d{2})?\s*[-–—·:]?\s*(.*)$/i.exec(l)
    if (!m) return
    const h = Number(m[1]), mn = m[2] ? Number(m[2]) : 0
    if (h > 23 || mn > 59) return
    let t = h * 60 + mn
    while (t < avant) t += 1440
    avant = t
    out.push({ rang, minutes: t, heure: fmtMinutes(h * 60 + mn), quoi: m[3].trim() })
  })
  return out
}

/** « 2026-12-31 » ou « 31/12/2026 » → clé « AAAA-MM-JJ », sinon "". */
export function lireDate(v: unknown): string {
  const s = texteUtile(v)
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return s
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  return ""
}

function ecartJours(a: string, b: string): number {
  const t = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10))
  return Math.round((t(b) - t(a)) / 86_400_000)
}

/** Durée du DERNIER moment quand rien ne le suit. */
export const DUREE_DERNIER_MIN = 90

export type EtatProgramme = {
  moments: (Moment & { etat: "passe" | "en_cours" | "a_venir" })[]
  /** "avant" : jour J pas encore là ; "pendant" ; "apres" : terminé (masqué en ligne) ; "sans_date". */
  phase: "avant" | "pendant" | "apres" | "sans_date"
  date: string
}

export function etatProgramme(c: Record<string, any>, now: Date): EtatProgramme {
  const moments = lireProgramme(c?.programme)
  const date = lireDate(c?.date)
  const neutre = (phase: EtatProgramme["phase"]) => ({ moments: moments.map(m => ({ ...m, etat: "a_venir" as const })), phase, date })
  if (!date || !moments.length) return neutre("sans_date")
  const d = ecartJours(date, jourDuCommerce(now, c))
  const { minutes } = chezLeCommerce(now, fuseauDuBloc(c))
  const t = d * 1440 + minutes                       // minutes depuis minuit du jour J
  const fin = moments[moments.length - 1].minutes + DUREE_DERNIER_MIN
  if (t < moments[0].minutes) return neutre("avant")
  if (t >= fin) return { ...neutre("apres"), moments: moments.map(m => ({ ...m, etat: "passe" as const })) }
  return {
    phase: "pendant", date,
    moments: moments.map((m, i) => {
      const suivant = moments[i + 1]?.minutes ?? fin
      return { ...m, etat: t >= suivant ? "passe" : t >= m.minutes ? "en_cours" : "a_venir" }
    }),
  }
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
/** « 2026-12-31 » → « jeudi 31 décembre ». */
export function dateLisible(cle: string): string {
  const d = new Date(Date.UTC(+cle.slice(0, 4), +cle.slice(5, 7) - 1, +cle.slice(8, 10)))
  return `${NOMS_JOURS[d.getUTCDay()].toLowerCase()} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
}
