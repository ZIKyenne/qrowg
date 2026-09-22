// Modèle de vue PUR du bloc `pricing`. Réutilise pricingCtaModel (B06) et priceDiscount.
// Filtre les offres sur `title` (comme les deux renderers legacy). Aucun React.

import { priceDiscount } from "../../types"
import { pricingCtaModel, type PricingCtaModel } from "../../pricingCta"
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

import { texteUtile } from "./repeaterExtract"

export type PricingPlan = { title: string; price: string; desc: string; oldPrice?: string; disc: ReturnType<typeof priceDiscount> }
export type PricingViewModel = { visible: boolean; title?: string; plans: PricingPlan[]; cta: PricingCtaModel }

export function pricingViewModel(content: Record<string, any> | null | undefined): PricingViewModel {
  const c = content || {}
  // Lot v150 : les trois offres étaient écrites une par une. Le nombre n'a pas
  // bougé — il est déclaré, au lieu d'être recopié trois fois.
  const plans: PricingPlan[] = extractIndexed<PricingPlan>(c, plafondDesLignes("pricing"), (src, i) => {
    const title = src[`title${i}`]
  // Lot v166 : une ligne d'espaces n'est pas une ligne (règle du lot v153).
    if (!texteUtile(title)) return null
    const price = src[`price${i}`], oldPrice = src[`old_price${i}`]
    return { title, price, desc: src[`desc${i}`], oldPrice: oldPrice || undefined, disc: priceDiscount(price, oldPrice) }
  })
  return { visible: plans.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, plans, cta: pricingCtaModel(c) }
}
