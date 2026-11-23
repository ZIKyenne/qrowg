// carteIllustree.ts — le modèle PUR de la « Carte illustrée » (lot fast-food, 18 nov.).
//
// La carte d'un snack, d'un kebab, d'un burger : on commande avec les yeux. Nos
// deux blocs « Carte » n'avaient que nom, prix, description. Celui-ci ajoute la
// photo, des badges choisis dans une liste, une catégorie par produit (les
// pastilles du haut en découlent, avec leur compte), les suppléments et les
// allergènes — et une recherche dans toute la carte.
//
// Règles tenues :
//  · rien d'inventé : aucun badge, aucun compte, aucune note qui ne vienne d'une
//    saisie du commerçant. Pas de « 4,9/5 » par plat : nous n'avons pas d'avis
//    par plat, et un chiffre affiché sans source est un faux ;
//  · une ligne sans nom n'est pas un produit (un prix seul ne se commande pas) ;
//  · l'ordre des catégories est celui de la première apparition — l'ordre dans
//    lequel le commerçant a rangé sa carte.

import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { safeImageUrl } from "./layoutStyle"
import { correspondAuxChamps } from "@/lib/rechercheSouple"
import { epuiseDansLeBloc } from "./epuises"

export const TYPE_CARTE_ILLUSTREE = "carte_illustree"

/** Les badges proposés. Une LISTE, pas un champ libre : ce sont des repères
 *  visuels qui doivent se ressembler d'un produit à l'autre. */
export const BADGES_DE_CARTE = [
  "N°1 des ventes", "Nouveau", "Épicé", "Végétarien", "Halal", "Fait maison", "Choix du chef",
] as const
export type BadgeDeCarte = typeof BADGES_DE_CARTE[number]

/** Un repère court et une teinte de SENS (le rendu la rend lisible sur le thème). */
export const STYLE_DES_BADGES: Record<BadgeDeCarte, { icone: string; teinte: string }> = {
  "N°1 des ventes": { icone: "🏆", teinte: "#E8B931" },
  "Nouveau": { icone: "✨", teinte: "#5AA9FF" },
  "Épicé": { icone: "🌶️", teinte: "#FF5A4E" },
  "Végétarien": { icone: "🌿", teinte: "#3CCB7F" },
  "Halal": { icone: "☪️", teinte: "#3CCB7F" },
  "Fait maison": { icone: "🏠", teinte: "#C9A84C" },
  "Choix du chef": { icone: "👨‍🍳", teinte: "#C9A84C" },
}

export type Supplement = { nom: string; prix: string }

export type ProduitDeCarte = {
  /** Rang dans la saisie (1…N) : clé stable pour React et pour la fiche. */
  rang: number
  nom: string
  prix: string
  description: string
  image: string
  categorie: string
  badge: BadgeDeCarte | null
  supplements: Supplement[]
  allergenes: string[]
  /** Épuisé depuis Ma carte (vague 1) : reste affiché, barré, avec la mention. */
  epuise: boolean
}

/** Un badge saisi qui n'est pas dans la liste n'est pas affiché : la liste est la règle. */
export function badgeConnu(v: unknown): BadgeDeCarte | null {
  const t = texteUtile(v)
  return (BADGES_DE_CARTE as readonly string[]).includes(t) ? (t as BadgeDeCarte) : null
}

/**
 * « Fromage 1€, Bacon 1,50 €, Sauce » → [{Fromage, 1€}, {Bacon, 1,50 €}, {Sauce, ""}].
 * Le prix est le DERNIER groupe qui ressemble à un montant ; sans montant, le
 * supplément est gratuit (ou à préciser au comptoir) — on n'invente pas de prix.
 */
export function lireSupplements(v: unknown): Supplement[] {
  const brut = texteUtile(v)
  if (!brut) return []
  // Une virgule suivie d'un chiffre est DÉCIMALE (« 1,50 € ») : elle ne sépare pas.
  return brut.split(/,(?!\d)|[;\n]/).map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)[\s:–-]*(\+?\s*\d+(?:[.,]\d{1,2})?\s*(?:€|eur|euros?)?)$/i)
    if (m && m[1].trim()) return { nom: m[1].trim(), prix: m[2].replace(/\s+/g, " ").trim() }
    return { nom: s, prix: "" }
  })
}

/** « gluten, lait ; œuf » → ["gluten", "lait", "œuf"] — tels que saisis, sans doublon. */
export function lireAllergenes(v: unknown): string[] {
  const vus = new Set<string>()
  const out: string[] = []
  for (const a of texteUtile(v).split(/[,;\n]/).map(s => s.trim()).filter(Boolean)) {
    const cle = a.toLowerCase()
    if (vus.has(cle)) continue
    vus.add(cle)
    out.push(a)
  }
  return out
}

export function produitsDeLaCarte(c: Record<string, any>): ProduitDeCarte[] {
  return extractIndexed<ProduitDeCarte>(c || {}, plafondDesLignes(TYPE_CARTE_ILLUSTREE), (src, i) => {
    const nom = texteUtile(src[`p${i}_name`])
    if (!nom) return null
    return {
      rang: i,
      nom,
      prix: texteUtile(src[`p${i}_price`]),
      description: texteUtile(src[`p${i}_desc`]),
      image: safeImageUrl(src[`p${i}_image`]),
      categorie: texteUtile(src[`p${i}_cat`]),
      badge: badgeConnu(src[`p${i}_badge`]),
      supplements: lireSupplements(src[`p${i}_extras`]),
      allergenes: lireAllergenes(src[`p${i}_allergens`]),
      epuise: epuiseDansLeBloc(src, nom, texteUtile(src[`p${i}_desc`])),
    }
  })
}

export type CategorieDeCarte = { nom: string; compte: number }

/**
 * Les catégories, dans l'ordre de première apparition, avec leur nombre de
 * produits. Un produit sans catégorie est rangé sous « Autres » — à la fin.
 */
export const SANS_CATEGORIE = "Autres"
export function categoriesDeLaCarte(produits: readonly ProduitDeCarte[]): CategorieDeCarte[] {
  const ordre: string[] = []
  const compte = new Map<string, number>()
  for (const p of produits) {
    const n = p.categorie || SANS_CATEGORIE
    if (!compte.has(n)) ordre.push(n)
    compte.set(n, (compte.get(n) ?? 0) + 1)
  }
  // « Autres » toujours en dernier : c'est un reste, pas une rubrique.
  const i = ordre.indexOf(SANS_CATEGORIE)
  if (i >= 0 && i < ordre.length - 1) { ordre.splice(i, 1); ordre.push(SANS_CATEGORIE) }
  return ordre.map(nom => ({ nom, compte: compte.get(nom)! }))
}

/** Les produits regroupés par catégorie, dans l'ordre des pastilles. */
export function produitsParCategorie(produits: readonly ProduitDeCarte[]): { categorie: string; produits: ProduitDeCarte[] }[] {
  return categoriesDeLaCarte(produits).map(({ nom }) => ({
    categorie: nom,
    produits: produits.filter(p => (p.categorie || SANS_CATEGORIE) === nom),
  }))
}

/** La recherche : nom, description, catégorie, badge, suppléments — sans accent ni casse. */
export function chercherDansLaCarte(produits: readonly ProduitDeCarte[], requete: string): ProduitDeCarte[] {
  if (!texteUtile(requete)) return [...produits]
  return produits.filter(p => correspondAuxChamps(
    [p.nom, p.description, p.categorie, p.badge ?? "", ...p.supplements.map(s => s.nom)], requete))
}

/** Un ancre stable pour une catégorie (pastille → section). */
export function ancreDeCategorie(blockId: string, nom: string): string {
  const slug = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return `carte-${blockId}-${slug || "autres"}`
}

/** La fiche s'ouvre quand il y a QUELQUE CHOSE de plus à montrer que la ligne. */
export function aUneFiche(p: ProduitDeCarte): boolean {
  return !!(p.image || p.description.length > 70 || p.supplements.length || p.allergenes.length)
}
