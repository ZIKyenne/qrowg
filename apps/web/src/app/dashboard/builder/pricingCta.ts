// pricingCta.ts — modèle PARTAGÉ du CTA du bloc `pricing`.
// L'aperçu éditeur et le rendu public consomment CE modèle → même règle de présence,
// même libellé, même URL sécurisée (fin de la divergence « CTA visible en public mais
// absent de l'éditeur »). Testable sans React.

import { destinationUtile } from "./types"

export type PricingCtaModel =
  | { visible: false }
  | { visible: true; label: string; href: string | null; external: boolean }

// Règle de présence IDENTIQUE des deux côtés : le CTA existe dès qu'un libellé est
// fourni. `href` vaut null quand aucune destination utilisable n'est saisie — et
// depuis le 7 septembre, un CTA sans destination n'est PLUS publié : le rendu ne
// retombe plus sur « # », qui se clique et ne fait rien. `destinationUtile` refuse
// aussi les schémas que le produit n'utilise pas, dont `javascript:`.
export function pricingCtaModel(content: Record<string, any> | null | undefined): PricingCtaModel {
  const c = content || {}
  if (!c.cta_label) return { visible: false }
  const href = destinationUtile(c.cta_url)
  return { visible: true, label: c.cta_label, href, external: !!href && /^https?:\/\//i.test(href) }
}
