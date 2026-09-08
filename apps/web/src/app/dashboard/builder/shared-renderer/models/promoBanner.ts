// Modèle pur `promo_banner`. Carte promo + CTA optionnel. CTA legacy : PAS de
// target/rel (external=false), href via extHref.
// Vague 25 — la bannière n'est plus « toujours visible » : posée vide, elle
// publiait un dégradé orange bordé de 336 octets, sans un mot dedans.
import { extHref } from "../../types"
import type { CtaLink } from "./ctaLink"

export type PromoBannerViewModel = { visible: boolean; emoji?: string; text?: string; subtext?: string; ctaLabel?: string; link: CtaLink }

export function promoBannerViewModel(content: Record<string, any> | null | undefined): PromoBannerViewModel {
  const c = content || {}
  const url = typeof c.cta_url === "string" ? c.cta_url : ""
  const dit = (v: any) => typeof v === "string" && v.trim() ? v : undefined
  return {
    visible: !!(dit(c.emoji) || dit(c.text) || dit(c.subtext) || dit(c.cta_label)),
    emoji: c.emoji, text: c.text, subtext: c.subtext, ctaLabel: c.cta_label,
    // Ce lien menait le visiteur AILLEURS sans ouvrir d'onglet : il quittait la
    // page du commerçant et n'y revenait pas. Soixante autres blocs ouvrent déjà
    // un onglet pour une adresse externe ; ces trois-là ne le faisaient pas, par
    // fidélité au legacy. Un chemin interne ou une ancre, eux, restent sur place.
    // (Vague 26.)
    link: { href: extHref(url) || null, external: /^https?:/i.test(url), trackTarget: url || "promo_banner", visible: !!c.cta_label },
  }
}
