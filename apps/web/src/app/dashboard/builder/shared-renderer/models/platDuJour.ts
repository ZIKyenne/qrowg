// platDuJour.ts — le modèle PUR de l'« Ardoise du jour » (19 nov.).
//
// Le contenu qui change chaque jour est la vraie raison de rescanner un QR. Une
// ardoise PÉRIMÉE ment : elle annonce un plat qui n'est plus servi. Règle : elle
// porte la date du jour où elle a été écrite (posée par l'éditeur à chaque
// modification) et ne s'affiche que CE jour-là, au jour du commerce — sauf si le
// commerçant a choisi « Jusqu'à nouvel ordre ».

import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { fuseauDuBloc } from "@/lib/heureDuCommerce"
import { jourDuCommerce as cleDuJour, nomDuJour } from "@/lib/jourDuCommerce"

export const TYPE_ARDOISE = "plat_du_jour"
export const VALIDITE_JOUR = "Aujourd'hui seulement"
export const VALIDITE_PERMANENTE = "Jusqu'à nouvel ordre"

export type Plat = { rang: number; nom: string; prix: string; description: string }

export function platsDuJour(c: Record<string, any>): Plat[] {
  return extractIndexed<Plat>(c || {}, plafondDesLignes("plat_du_jour"), (src, i) => {
    const nom = texteUtile(src[`d${i}_name`])
    if (!nom) return null
    return { rang: i, nom, prix: texteUtile(src[`d${i}_price`]), description: texteUtile(src[`d${i}_desc`]) }
  })
}

/** Le jour du commerce, « AAAA-MM-JJ ». */
export function jourDuCommerce(now: Date, c: Record<string, any>): string {
  return cleDuJour(now, fuseauDuBloc(c))
}

export type EtatArdoise = "vide" | "a_jour" | "perimee" | "permanente"

export function etatArdoise(c: Record<string, any>, now: Date): EtatArdoise {
  if (platsDuJour(c).length === 0) return "vide"
  if (String(c?.validite || "") === VALIDITE_PERMANENTE) return "permanente"
  return texteUtile(c?.date) === jourDuCommerce(now, c) ? "a_jour" : "perimee"
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

/** « mardi 18 novembre » — de QUEL jour date l'ardoise. Lecture littérale de la clé. */
export function jourLisible(cle: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texteUtile(cle))
  if (!m) return "une date inconnue"
  return `${nomDuJour(texteUtile(cle))} ${Number(m[3])} ${MOIS[Number(m[2]) - 1]}`
}
