// Modèle pur `merch`. 3 produits (img{n}/name{n}/price{n}) filtrés sur name, image optionnelle
// (safeMediaSrc), prix brut. CTA optionnel (target si http(s)). visible = au moins un item (lot v153).
import { extHref } from "../../types"
import { safeMediaSrc } from "./mediaUrl"
import type { CtaLink } from "./ctaLink"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type MerchProduct = { img: string | null; name: string; price?: string }
export type MerchViewModel = { visible: boolean; title?: string; description?: string; items: MerchProduct[]; ctaLabel?: string; link: CtaLink }

export function merchViewModel(content: Record<string, any> | null | undefined): MerchViewModel {
  const c = content || {}
  // Lot v150 : trois produits écrits un par un — déclarés, maintenant.
  const items = extractIndexed<MerchProduct>(c, plafondDesLignes("merch"), (src, i) =>
    texteUtile(src[`name${i}`]) ? { img: safeMediaSrc(src[`img${i}`]), name: src[`name${i}`] as string, price: (src[`price${i}`] || undefined) as string | undefined } : null)
  const url = typeof c.cta_url === "string" ? c.cta_url : ""
  return {
    visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined,
    description: c.description || undefined, items, ctaLabel: c.cta_label || undefined,
    link: { href: extHref(url) || null, external: /^https?:/.test(url), trackTarget: url || "merch", visible: !!c.cta_label },
  }
}
