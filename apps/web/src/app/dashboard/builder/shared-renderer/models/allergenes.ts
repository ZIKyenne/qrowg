// allergenes.ts — les 14 allergènes, sur toutes les cartes (vague 2, revue du 23 nov.).
//
// L'information sur les 14 allergènes réglementaires est obligatoire pour un
// restaurant (règlement UE 1169/2011, annexe II ; décret 2015-447 : par écrit,
// accessible au client). Jusqu'ici, seule la carte illustrée la proposait, en
// texte libre — 2 modèles sur 9. Le menu, la grande carte, les boissons et
// l'happy hour n'avaient rien.
//
// Rangement : PAR PRODUIT, dans une seule clé du bloc (`allergenes`), une ligne
// par produit « identité<TAB>code,code » — exactement comme `epuises` : l'identité
// (nom · description, voir epuises.identiteDuPlat) suit le produit quand le
// répéteur réordonne ses lignes, et vaut pour les cinq blocs de carte sans
// toucher à leurs formats (une grande carte est un texte collé « nom;prix;desc »).
// Renommer un produit lui fait perdre ses allergènes : c'est un autre produit,
// et Ma carte le montre « non renseigné ».
//
// On ne coche QUE ce que le commerçant a coché. Rien n'est déduit du nom du plat
// (« crème brûlée » → lait, œufs ?) : une déduction fausse sur un allergène est
// un danger, pas une aide. Module PUR.

import { cleDuPlat, identiteDuPlat } from "./epuises"

export const CLE_ALLERGENES = "allergenes"

/** Les 14 allergènes de l'annexe II, dans l'ordre du règlement, avec un libellé court. */
export const ALLERGENES = [
  { code: "gluten", libelle: "Gluten" },
  { code: "crustaces", libelle: "Crustacés" },
  { code: "oeufs", libelle: "Œufs" },
  { code: "poissons", libelle: "Poisson" },
  { code: "arachides", libelle: "Arachides" },
  { code: "soja", libelle: "Soja" },
  { code: "lait", libelle: "Lait" },
  { code: "fruits_a_coque", libelle: "Fruits à coque" },
  { code: "celeri", libelle: "Céleri" },
  { code: "moutarde", libelle: "Moutarde" },
  { code: "sesame", libelle: "Sésame" },
  { code: "sulfites", libelle: "Sulfites" },
  { code: "lupin", libelle: "Lupin" },
  { code: "mollusques", libelle: "Mollusques" },
] as const
export type CodeAllergene = typeof ALLERGENES[number]["code"]
const CODES = new Set<string>(ALLERGENES.map(a => a.code))
const ORDRE = new Map<string, number>(ALLERGENES.map((a, i) => [a.code, i]))
export const libelleAllergene = (code: string) => ALLERGENES.find(a => a.code === code)?.libelle ?? code

/** Codes connus seulement, sans doublon, dans l'ordre du règlement — quel que soit l'ordre des touchers. */
export function ordonnerAllergenes(codes: readonly string[]): CodeAllergene[] {
  return [...new Set(codes.filter(c => CODES.has(c)))].sort((a, b) => ORDRE.get(a)! - ORDRE.get(b)!) as CodeAllergene[]
}

/** Le marqueur « aucun des 14 » : renseigné, et vide. Différent de « pas renseigné ». */
export const AUCUN = "aucun"

type Entree = { cle: string; codes: string[] }
function lignes(content: Record<string, unknown> | null | undefined): Entree[] {
  const v = content?.[CLE_ALLERGENES]
  if (typeof v !== "string") return []
  const out: Entree[] = []
  for (const l of v.split("\n")) {
    const t = l.indexOf("\t")
    if (t <= 0) continue
    const codes = l.slice(t + 1).split(",").map(s => s.trim()).filter(c => CODES.has(c) || c === AUCUN)
    out.push({ cle: cleDuPlat(l.slice(0, t)), codes })
  }
  return out
}

/** Les allergènes renseignés d'un produit (codes, ordre du règlement) ; null s'il n'est pas renseigné. */
export function allergenesDuProduit(content: Record<string, unknown> | null | undefined, nom: string, desc?: string | null): CodeAllergene[] | null {
  const cle = cleDuPlat(identiteDuPlat(nom, desc))
  const e = lignes(content).find(x => x.cle === cle)
  if (!e) return null
  return e.codes.filter(c => c !== AUCUN).sort((a, b) => ORDRE.get(a)! - ORDRE.get(b)!) as CodeAllergene[]
}

/**
 * Le contenu du bloc avec les allergènes de ce produit. `codes` vide = « aucun
 * des 14 » (renseigné) ; `null` = on efface (redevient « non renseigné »).
 */
export function avecAllergenes<T extends Record<string, unknown>>(content: T, identite: string, codes: readonly string[] | null): T & { allergenes: string } {
  const cle = cleDuPlat(identite)
  const brut = typeof content[CLE_ALLERGENES] === "string" ? (content[CLE_ALLERGENES] as string).split("\n").filter(Boolean) : []
  const autres = brut.filter(l => { const t = l.indexOf("\t"); return t <= 0 || cleDuPlat(l.slice(0, t)) !== cle })
  if (codes === null) return { ...content, [CLE_ALLERGENES]: autres.join("\n") }
  const propres = ordonnerAllergenes(codes)
  return { ...content, [CLE_ALLERGENES]: [...autres, `${identite.trim()}\t${propres.length ? propres.join(",") : AUCUN}`].join("\n") }
}

/** « Gluten, Lait » — pour la page publique. Vide si aucun. */
export function phraseAllergenes(codes: readonly string[] | null | undefined): string {
  return (codes ?? []).map(libelleAllergene).join(", ")
}
