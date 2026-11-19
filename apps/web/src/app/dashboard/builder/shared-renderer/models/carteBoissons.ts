// carteBoissons.ts — le modèle PUR de la « Carte des boissons » (19 nov.).
//
// Vins, bières, cocktails, sans alcool : chaque boisson a une RUBRIQUE (« Rouges »,
// « Cocktails »…), une origine, un détail (cépage, ingrédients, degré) et jusqu'à
// DEUX prix dont le commerçant nomme les colonnes (« Verre / Bouteille »,
// « 25 cl / 50 cl »). Les rubriques suivent l'ordre de la saisie.

import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export const BADGES_BOISSON = ["Sans alcool", "Bio", "Coup de cœur", "Nouveau", "Maison"] as const
export type BadgeBoisson = typeof BADGES_BOISSON[number]

export type Boisson = {
  rang: number; nom: string; rubrique: string; origine: string; detail: string
  prix1: string; prix2: string; badge: BadgeBoisson | null
}

export const SANS_RUBRIQUE = "Boissons"

export function boissons(c: Record<string, any>): Boisson[] {
  return extractIndexed<Boisson>(c || {}, plafondDesLignes("carte_boissons"), (src, i) => {
    const nom = texteUtile(src[`b${i}_name`])
    if (!nom) return null
    const badge = texteUtile(src[`b${i}_badge`])
    return {
      rang: i, nom, rubrique: texteUtile(src[`b${i}_type`]), origine: texteUtile(src[`b${i}_origin`]),
      detail: texteUtile(src[`b${i}_detail`]), prix1: texteUtile(src[`b${i}_p1`]), prix2: texteUtile(src[`b${i}_p2`]),
      badge: (BADGES_BOISSON as readonly string[]).includes(badge) ? (badge as BadgeBoisson) : null,
    }
  })
}

export type Rubrique = { nom: string; boissons: Boisson[]; deuxPrix: boolean }

/** Les rubriques dans l'ordre de première apparition ; « Boissons » (sans rubrique) en dernier. */
export function rubriques(liste: readonly Boisson[]): Rubrique[] {
  const ordre: string[] = []
  const par = new Map<string, Boisson[]>()
  for (const b of liste) {
    const n = b.rubrique || SANS_RUBRIQUE
    if (!par.has(n)) { par.set(n, []); ordre.push(n) }
    par.get(n)!.push(b)
  }
  const i = ordre.indexOf(SANS_RUBRIQUE)
  if (i >= 0 && i < ordre.length - 1) { ordre.splice(i, 1); ordre.push(SANS_RUBRIQUE) }
  return ordre.map(nom => {
    const bs = par.get(nom)!
    return { nom, boissons: bs, deuxPrix: bs.some(b => b.prix2) }
  })
}

/** Les noms des deux colonnes de prix. */
export function colonnes(c: Record<string, any>): [string, string] {
  return [texteUtile(c?.col1) || "Verre", texteUtile(c?.col2) || "Bouteille"]
}
