// Modèle pur du bloc `order_online`. Le bouton n'est publié que s'il mène
// quelque part (7 septembre) : le rendu public repliait auparavant sur « # ».
// external seulement si l'URL est http(s), comme le legacy. Aucun React.
import { extHref } from "../../types"
import type { CtaLink } from "./ctaLink"

// Vague 25 — sans adresse, PublicCtaLink n'affiche plus rien : il ne restait que
// le conteneur. Un bloc « Commander en ligne » qui ne commande rien ne se publie
// pas du tout.
export type OrderOnlineViewModel = { visible: boolean; label: string; platform: string; link: CtaLink }
export function orderOnlineViewModel(content: Record<string, any> | null | undefined): OrderOnlineViewModel {
  const c = content || {}
  const url = typeof c.url === "string" ? c.url : ""
  const href = extHref(url) || null
  // « Plateforme » etait proposee (Uber Eats, Deliveroo, Just Eat…) et lue par
  // personne : le commercant la choisissait, rien ne changeait. Elle rassure le
  // visiteur sur l'endroit ou le lien l'emmene, comme sur le bloc « Boutique ».
  const platform = typeof c.platform === "string" ? c.platform.trim() : ""
  return { visible: !!href, label: c.label || "Commander maintenant", platform, link: { href, external: /^https?:/.test(url), trackTarget: url || "order", visible: !!href } }
}
