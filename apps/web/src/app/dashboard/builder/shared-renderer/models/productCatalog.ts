// Modèle pur `product_catalog`. Répétiteur produits (p{i}), image via SharedImageModel, prix brut,
// lien produit par item (jugé par destinationUtile). Badge cta_label partagé. Limite 50, filtre sur name.
import { destinationUtile } from "../../types"
import { sharedImageModel, type SharedImageModel } from "./sharedImage"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import type { CtaLink } from "./ctaLink"

export type ProductCatalogItem = { img: SharedImageModel; name: string; price?: string; desc?: string; link: CtaLink }
export type ProductCatalogViewModel = { visible: boolean; title?: string; ctaLabel?: string; items: ProductCatalogItem[] }

export function productCatalogViewModel(content: Record<string, any> | null | undefined): ProductCatalogViewModel {
  const c = content || {}
  const items = extractIndexed<ProductCatalogItem>(c, plafondDesLignes("product_catalog"), (cc, i) => {
    if (!texteUtile(cc[`p${i}_name`])) return null
    const url = typeof cc[`p${i}_url`] === "string" ? cc[`p${i}_url`] : ""
    return {
      img: sharedImageModel(cc[`p${i}_img`], { decorative: true }),
      name: cc[`p${i}_name`], price: cc[`p${i}_price`], desc: cc[`p${i}_desc`],
      // Lot v174 : `visible: true` affirmait « montre ce lien » pour une adresse
      // qui pouvait être nulle. La vue, elle, jetait la LIGNE ENTIÈRE quand
      // l'adresse manquait — un produit nommé, avec sa photo et son prix,
      // disparaissait de la page pendant que l'éditeur le montrait. Le modèle
      // dit maintenant la vérité, et la vue publie le produit sans le rendre
      // cliquable.
      link: { href: destinationUtile(url), external: /^https?:/.test(url), trackTarget: url || "product", visible: destinationUtile(url) !== null },
    }
  })
  return {
    visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined,
    ctaLabel: c.cta_label || undefined, items,
  }
}
