// Modèle pur `gift_card`. Montants filtrés (amount1..3), CTA optionnel. Public null si
// (title && amount1) absents. Titre par défaut appliqué à l'affichage (comme le legacy).
import { extHref } from "../../types"
import type { CtaLink } from "./ctaLink"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type GiftCardViewModel = { visible: boolean; title?: string; description?: string; amounts: string[]; ctaLabel?: string; link: CtaLink }

export function giftCardViewModel(content: Record<string, any> | null | undefined): GiftCardViewModel {
  const c = content || {}
  const url = typeof c.cta_url === "string" ? c.cta_url : ""
  // Lot v150 : trois montants écrits un par un — déclarés, maintenant.
  const amounts = extractIndexed<string>(c, plafondDesLignes("gift_card"), (src, i) => texteUtile(src[`amount${i}`]) ? src[`amount${i}`] : null)
  return {
    visible: !!(texteUtile(c.title) || texteUtile(c.amount1)),
    title: c.title, description: c.description, amounts, ctaLabel: c.cta_label,
    link: { href: extHref(url) || null, external: /^https?:/.test(url), trackTarget: url || "giftcard", visible: !!c.cta_label },
  }
}
