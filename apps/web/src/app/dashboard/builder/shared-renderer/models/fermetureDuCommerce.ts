// fermetureDuCommerce.ts — « fermé ce soir », « en congés du 24 au 2 » depuis Ma carte.
//
// Vague 1 (revue du 23 nov.) : Ma carte devient l'écran du service, horaires et
// congés compris. Le bloc « Horaires » sait déjà tout faire de son champ
// « Exception / congés » : quand le texte porte des dates (lib/congesDates),
// le badge dit « Fermé · réouverture le … » pendant la période, puis le message
// s'éteint seul. Il fallait seulement l'écrire, sans l'éditeur, et sans risque
// de se tromper de forme.
//
// Ce module écrit donc la phrase EXACTE que congesDates lit — vérifié aller-
// retour dans les tests — à partir de deux dates choisies au calendrier.
// Module PUR.

import { etatDesConges, jourEnFrancais, phrasePendantConges, type EtatConges } from "@/lib/congesDates"
import { dateChezLeCommerce, fuseauDuBloc } from "@/lib/heureDuCommerce"

export const TYPE_HORAIRES = "opening_hours"
/** Au-delà, congesDates se tait (fermeture définitive ou date mal lue) : on refuse avant. */
export const FERMETURE_JOURS_MAX = 120
const JOUR_MS = 86400000

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/
/** « 2026-11-23 » → minuit UTC de ce jour ; null si la date n'existe pas. */
export function jourIso(v: unknown): Date | null {
  const m = typeof v === "string" ? ISO.exec(v.trim()) : null
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCDate() === Number(m[3]) && d.getUTCMonth() === Number(m[2]) - 1 ? d : null
}
/** Un jour déjà ramené à minuit UTC (jourIso, dateChezLeCommerce) → « AAAA-MM-JJ ». */
export const versIso = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`

/**
 * « Fermé exceptionnellement le 23 novembre », « Fermé du 24 décembre au 2 janvier ».
 * congesDates donne à une date sans année l'année la plus proche d'aujourd'hui :
 * « du 1er au 15 juillet » écrit en novembre serait lu comme le juillet PASSÉ.
 * Au-delà de 90 jours, l'année est donc écrite (« … au 15 juillet 2027 »).
 */
export function phraseDeFermeture(debut: Date, fin: Date, aujourdHui: Date): string {
  const loin = Math.abs(fin.getTime() - aujourdHui.getTime()) > 90 * JOUR_MS
  const an = loin ? ` ${fin.getUTCFullYear()}` : ""
  if (debut.getTime() === fin.getTime()) return `Fermé exceptionnellement le ${jourEnFrancais(debut)}${an}`
  return `Fermé du ${jourEnFrancais(debut)} au ${jourEnFrancais(fin)}${an}`
}

export type FermetureVue = {
  blocId: string
  /** Le texte affiché aujourd'hui en ligne (vide si aucun, ou si sa période est passée). */
  message: string
  etat: EtatConges["etat"]
  /** Ce que le client voit, dit au commerçant. */
  phrase: string
  /** Le jour du commerce, « AAAA-MM-JJ » : la valeur par défaut des calendriers. */
  aujourdhui: string
}

type BlocLu = { id: string; type: string; content: Record<string, any> | null; visible?: boolean | null; position?: number | null }

/** Les horaires de la page, vus depuis le comptoir. null : la page n'a pas d'horaires. */
export function fermetureDeLaPage(blocs: readonly BlocLu[], now: Date): FermetureVue | null {
  const b = [...blocs].filter(x => x.type === TYPE_HORAIRES && x.visible !== false)
    .sort((a, z) => (a.position ?? 0) - (z.position ?? 0))[0]
  if (!b) return null
  const c = b.content ?? {}
  const jour = dateChezLeCommerce(now, fuseauDuBloc(c))
  const texte = typeof c.exception === "string" ? c.exception.trim() : ""
  const e = etatDesConges(texte, jour)
  let phrase: string
  if (e.etat === "pendant") phrase = `Fermé en ce moment. Vos clients lisent « ${phrasePendantConges(e)} ».`
  else if (e.etat === "avant") phrase = `Fermeture annoncée : « ${texte} ».`
  else if (texte && e.etat === "aucune") phrase = `Message affiché : « ${texte} ».`
  else phrase = "Aucune fermeture annoncée."
  return { blocId: b.id, message: e.etat === "terminee" ? "" : texte, etat: e.etat, phrase, aujourdhui: versIso(jour) }
}

export type EcritureFermeture = { ok: true; content: Record<string, any>; message: string } | { ok: false; phrase: string }

/**
 * Le contenu des horaires avec cette fermeture. `debut`/`fin` : « AAAA-MM-JJ »,
 * `fin` absente = un seul jour. Refuse une période passée, inversée, ou trop
 * longue pour être lue comme des congés.
 */
export function avecFermeture(content: Record<string, any> | null | undefined, debut: string, fin: string | null, now: Date): EcritureFermeture {
  const c = { ...(content ?? {}) }
  const d = jourIso(debut), f = fin ? jourIso(fin) : d
  if (!d || !f) return { ok: false, phrase: "Choisissez une date valide." }
  const aujourdHui = dateChezLeCommerce(now, fuseauDuBloc(c))
  if (f.getTime() < aujourdHui.getTime()) return { ok: false, phrase: "Cette période est déjà passée." }
  if (f.getTime() < d.getTime()) return { ok: false, phrase: "La réouverture doit venir après le début de la fermeture." }
  if (f.getTime() - d.getTime() > FERMETURE_JOURS_MAX * JOUR_MS) return { ok: false, phrase: `Une fermeture tient en ${FERMETURE_JOURS_MAX} jours au plus. Pour une fermeture définitive, mettez la page en pause.` }
  const message = phraseDeFermeture(d, f, aujourdHui)
  c.exception = message
  return { ok: true, content: c, message }
}

/** Rouvrir : le message de fermeture s'efface. Rien d'autre ne change. */
export function sansFermeture(content: Record<string, any> | null | undefined): Record<string, any> {
  return { ...(content ?? {}), exception: "" }
}
