// Modeles PURS des blocs qui affichent un PRIX : `product`, `featured_product`,
// `offer_comparison` et `pricing`. Aucun React.
//
// Ce sont les blocs qui rapportent de l'argent au commercant, et c'est la que
// l'apercu mentait le plus :
//
//  · product — l'apercu ecrivait « Produit » a la place du nom manquant, et
//    n'affichait PAS la description. Un champ que le commercant remplit, que le
//    visiteur lit, et que l'auteur ne voyait jamais.
//
//  · featured_product — l'apercu inventait un prix de « 99€ » quand le champ
//    etait vide. Pire : la remise etait calculee CONTRE ce faux prix, donc
//    l'auteur voyait un « -50% » qui n'existait pas. Meme famille que le
//    « 1 240 » du compteur de scans, mais sur un chiffre commercial.
//
//  · offer_comparison — l'apercu posait le bouton DANS chaque formule (trois
//    boutons), la page en posait UN SEUL sous le tableau. Le commercant
//    composait une mise en page qu'il n'obtenait pas.

import { priceDiscount, stockStatus, productBadgeStyle, destinationUtile } from "../../types"
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "")

export type Cta = { label: string; href: string } | null
function cta(c: Record<string, any>, ...cles: string[]): Cta {
  const label = txt(c.cta_label) || txt(c.label)
  if (!label) return null
  for (const k of cles) {
    const href = destinationUtile(txt(c[k]))
    if (href) return { label, href }
  }
  return null
}

export type Stock = ReturnType<typeof stockStatus>
export type Remise = ReturnType<typeof priceDiscount>

// ── Produit ─────────────────────────────────────────────────────────────────

export type Produit = {
  image: string; nom: string; prix: string; ancienPrix: string
  remise: Remise; description: string; stock: Stock; cta: Cta; epuise: boolean
}

export function produit(c: Record<string, any> | null | undefined): Produit | null {
  const src = c || {}
  const nom = txt(src.name), prix = txt(src.price), image = txt(src.image)
  if (!nom && !prix && !image) return null
  const stock = stockStatus(txt(src.stock))
  return {
    image, nom, prix, ancienPrix: txt(src.old_price),
    remise: priceDiscount(prix, txt(src.old_price)),
    description: txt(src.description), stock,
    cta: cta(src, "cta_url", "url"), epuise: !!stock?.soldOut,
  }
}

// ── Produit mis en avant ────────────────────────────────────────────────────

export type ProduitVedette = Produit & { badge: { texte: string; fond: string; texteSur: string; icone: string } | null }

export function produitVedette(c: Record<string, any> | null | undefined): ProduitVedette | null {
  const src = c || {}
  // Ce bloc-ci se montre des qu'il a un nom OU une image : c'est une vitrine,
  // le prix y est facultatif. Et surtout, on n'en invente pas : l'apercu
  // ecrivait « 99€ », puis calculait la remise CONTRE ce faux prix.
  const nom = txt(src.name), image = txt(src.image), prix = txt(src.price)
  if (!nom && !image) return null
  const ancienPrix = txt(src.old_price)
  const stock = stockStatus(txt(src.stock))
  const badge = txt(src.badge)
  const bs = badge ? productBadgeStyle(badge, "#C9A84C") : null
  return {
    image, nom, prix, ancienPrix,
    remise: priceDiscount(prix, ancienPrix),
    description: txt(src.description), stock,
    cta: cta(src, "cta_url", "url"), epuise: !!stock?.soldOut,
    badge: bs ? { texte: badge, fond: bs.color, texteSur: bs.fg, icone: bs.icon } : null,
  }
}

// ── Formules comparées / tarifs ─────────────────────────────────────────────

export type Formule = { nom: string; prix: string; ancienPrix: string; remise: Remise; lignes: string[]; description: string; vedette: boolean }
export type Tableau = { titre: string; formules: Formule[]; cta: Cta }

/** `offer_comparison` : trois formules, la deuxième pouvant être mise en avant. */
export function comparaison(c: Record<string, any> | null | undefined): Tableau | null {
  const src = c || {}
  // Lot v150 : trois formules écrites une par une — déclarées, maintenant. Et
  // « mise en avant » se lisait `plan2_highlight` SEULEMENT pour la deuxième :
  // la deuxième ligne d'un tableau n'a rien de particulier, et le champ existe
  // dans le vocabulaire du bloc. Aucune page ne change — personne n'a de
  // `plan1_highlight`, il n'était pas déclaré.
  const formules: Formule[] = extractIndexed<Formule>(src, plafondDesLignes("offer_comparison"), (s, i) => {
    const nom = txt(s[`plan${i}_name`])
    if (!nom) return null
    return {
      nom, prix: txt(s[`plan${i}_price`]), ancienPrix: txt(s[`plan${i}_old_price`]),
      remise: priceDiscount(txt(s[`plan${i}_price`]), txt(s[`plan${i}_old_price`])),
      lignes: txt(s[`plan${i}_features`]).split("\n").map(l => l.trim()).filter(Boolean),
      description: "", vedette: txt(s[`plan${i}_highlight`]) === "yes",
    }
  })
  if (formules.length === 0) return null
  return { titre: txt(src.title), formules, cta: cta(src, "cta_url") }
}

/** `pricing` : trois colonnes titre / prix / description. La deuxième est mise
 *  en avant par POSITION — c'est ainsi que le bloc a toujours fonctionné. */
export function tarifs(c: Record<string, any> | null | undefined): Tableau | null {
  const src = c || {}
  // Lot v150 : trois formules écrites une par une — déclarées, maintenant. La
  // mise en avant, ici, reste POSITIONNELLE : c'est ce que dit le commentaire
  // au-dessus, et c'est ainsi que ce bloc a toujours fonctionné.
  const formules: Formule[] = extractIndexed<Formule>(src, plafondDesLignes("pricing"), (s, i) => {
    const nom = txt(s[`title${i}`])
    if (!nom) return null
    return {
      nom, prix: txt(s[`price${i}`]), ancienPrix: txt(s[`old_price${i}`]),
      remise: priceDiscount(txt(s[`price${i}`]), txt(s[`old_price${i}`])),
      lignes: [], description: txt(s[`desc${i}`]), vedette: i === 2,
    }
  })
  if (formules.length === 0) return null
  return { titre: txt(src.title), formules, cta: cta(src, "cta_url") }
}
