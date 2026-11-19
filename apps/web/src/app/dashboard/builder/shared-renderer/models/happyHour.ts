// happyHour.ts — le modèle PUR du bloc « Happy hour » (19 nov.).
//
// Un créneau (« 17h - 20h », « 22h - 01h » passe minuit), des jours, des offres
// (prix normal barré → prix happy hour). Le badge dit ce qui est VRAI maintenant,
// à l'heure du commerce : « En cours · jusqu'à 20h », « Dans 40 min »,
// « Aujourd'hui à 17h », « Demain à 17h », « Jeudi à 17h ».

import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { parseHourRanges, fmtMinutes, DAY_LABELS_FR } from "../../types"
import { chezLeCommerce, fuseauDuBloc } from "@/lib/heureDuCommerce"

export const JOURS_HAPPY = ["Tous les jours", "Du lundi au vendredi", "Du lundi au samedi", "Du jeudi au samedi", "Le week-end"] as const
/** Jours concernés (0 = dimanche). */
const JOURS: Record<string, number[]> = {
  "Tous les jours": [0, 1, 2, 3, 4, 5, 6],
  "Du lundi au vendredi": [1, 2, 3, 4, 5],
  "Du lundi au samedi": [1, 2, 3, 4, 5, 6],
  "Du jeudi au samedi": [4, 5, 6],
  "Le week-end": [0, 6],
}

export type OffreHappy = { rang: number; nom: string; prixNormal: string; prixHappy: string }

export function offresHappy(c: Record<string, any>): OffreHappy[] {
  return extractIndexed<OffreHappy>(c || {}, plafondDesLignes("happy_hour"), (src, i) => {
    const nom = texteUtile(src[`h${i}_name`])
    if (!nom) return null
    return { rang: i, nom, prixNormal: texteUtile(src[`h${i}_normal`]), prixHappy: texteUtile(src[`h${i}_happy`]) }
  })
}

/** Le bloc a-t-il quelque chose à dire ? Une offre résumée OU au moins une ligne. */
export function happyHourRempli(c: Record<string, any>): boolean {
  return !!texteUtile(c?.offre) || offresHappy(c).length > 0
}

export function joursDuHappy(c: Record<string, any>): number[] {
  return JOURS[String(c?.jours || "")] ?? JOURS["Tous les jours"]
}

const heure = (m: number) => (m % 1440 === 0 ? "minuit" : fmtMinutes(m % 1440))

export type StatutHappy = { enCours: boolean; libelle: string }

/** Le statut à cet instant, ou null si le créneau n'est pas lisible. */
export function statutHappy(c: Record<string, any>, now: Date): StatutHappy | null {
  const plages = parseHourRanges(texteUtile(c?.creneau))
  if (plages.length === 0) return null
  const jours = joursDuHappy(c)
  const { jour, minutes } = chezLeCommerce(now, fuseauDuBloc(c))

  // En cours : une plage d'aujourd'hui, ou la nuit d'hier qui se prolonge.
  if (jours.includes(jour)) {
    const p = plages.find(r => minutes >= r.start && minutes < r.end)
    if (p) return { enCours: true, libelle: `En cours · jusqu'à ${heure(p.end)}` }
  }
  const hier = (jour + 6) % 7
  if (jours.includes(hier)) {
    const p = plages.find(r => r.end > 1440 && minutes < r.end - 1440)
    if (p) return { enCours: true, libelle: `En cours · jusqu'à ${heure(p.end - 1440)}` }
  }

  // À venir aujourd'hui ?
  if (jours.includes(jour)) {
    const p = plages.filter(r => r.start > minutes).sort((a, b) => a.start - b.start)[0]
    if (p) {
      const dans = p.start - minutes
      return { enCours: false, libelle: dans <= 90 ? `Dans ${dans} min` : `Aujourd'hui à ${heure(p.start)}` }
    }
  }
  // Le prochain jour concerné.
  const premiere = [...plages].sort((a, b) => a.start - b.start)[0]
  for (const i of [1, 2, 3, 4, 5, 6, 7]) {   // les sept jours suivants
    const j = (jour + i) % 7
    if (jours.includes(j)) {
      const quand = i === 1 ? "Demain" : DAY_LABELS_FR[j].charAt(0).toUpperCase() + DAY_LABELS_FR[j].slice(1)
      return { enCours: false, libelle: `${quand} à ${heure(premiere.start)}` }
    }
  }
  return null
}
