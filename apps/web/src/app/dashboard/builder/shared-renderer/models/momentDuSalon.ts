// momentDuSalon.ts — les modèles PURS de l'information DU MOMENT (beauté, 19 nov.) :
// les créneaux libres d'aujourd'hui, et l'attente sans rendez-vous.
//
// Les deux mentent s'ils vieillissent ; ils se taisent donc tout seuls :
//  · un créneau passé disparaît ; la liste entière n'existe que le jour où elle
//    a été écrite (même règle que l'ardoise) ;
//  · une attente non mise à jour depuis 3 h n'est plus affichée.

import { texteUtile } from "./repeaterExtract"
import { jourDuCommerce } from "./platDuJour"
import { chezLeCommerce, fuseauDuBloc } from "@/lib/heureDuCommerce"
import { fmtMinutes } from "../../types"

// ── Créneaux libres aujourd'hui ────────────────────────────────────────────
/** « 10h30, 14h, 16:15 » → [630, 840, 975], triés, sans doublon. */
export function lireCreneaux(v: unknown): number[] {
  const out = new Set<number>()
  // Les minutes COLLÉES à l'heure (« 14h30 », « 14:30 ») : sans quoi « 14h⏎14:00 »
  // se lisait « 14h14 ».
  for (const m of texteUtile(v).matchAll(/(\d{1,2}) ?[h:.](\d{2})?/gi)) {
    const h = Number(m[1]), mn = m[2] ? Number(m[2]) : 0
    if (h <= 23 && mn <= 59) out.add(h * 60 + mn)
  }
  return [...out].sort((a, b) => a - b)
}

export const heureLisible = (m: number) => fmtMinutes(m)

/** Les créneaux encore à venir AUJOURD'HUI (liste datée du jour), sinon []. */
export function creneauxRestants(c: Record<string, any>, now: Date): number[] {
  if (texteUtile(c?.date) !== jourDuCommerce(now, c)) return []
  const { minutes } = chezLeCommerce(now, fuseauDuBloc(c))
  return lireCreneaux(c?.creneaux).filter(m => m > minutes)
}

export const ACTIONS_CRENEAU = ["Appeler", "WhatsApp", "Lien de réservation"] as const

/** Le message prérempli d'une demande de créneau. */
export function messageDeCreneau(m: number): string {
  return `Bonjour, je souhaiterais le créneau de ${heureLisible(m)} aujourd'hui. Merci !`
}

// ── Attente sans rendez-vous ───────────────────────────────────────────────
export const ATTENTES = ["Pas d'attente", "Environ 10 min", "Environ 20 min", "Environ 30 min", "Plus de 45 min", "Complet pour aujourd'hui"] as const
export const FRAICHEUR_MS = 3 * 3600_000

export type Attente = { libelle: string; depuisMin: number; complet: boolean; libre: boolean }

/** L'attente affichable, ou null si elle n'est pas saisie OU trop ancienne (> 3 h). */
export function attenteActuelle(c: Record<string, any>, now: number): Attente | null {
  const libelle = texteUtile(c?.attente)
  const maj = Number(c?.maj)
  if (!libelle || !(ATTENTES as readonly string[]).includes(libelle) || !Number.isFinite(maj) || maj <= 0) return null
  const age = now - maj
  if (age < 0 || age > FRAICHEUR_MS) return null
  return { libelle, depuisMin: Math.floor(age / 60_000), complet: libelle === "Complet pour aujourd'hui", libre: libelle === "Pas d'attente" }
}

/** « à l'instant », « il y a 12 min », « il y a 1 h 05 ». */
export function depuisLisible(min: number): string {
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  return `il y a ${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`
}
