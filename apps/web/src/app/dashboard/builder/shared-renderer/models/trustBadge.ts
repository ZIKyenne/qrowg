// Modèle pur `trust_badge`. items filtrés sur `label`. visible = hasPublishableContent.
import { hasPublishableContent } from "../../blockEmptyState"
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type TrustBadge = { icon?: string; label: string }
export type TrustBadgeViewModel = { visible: boolean; title?: string; items: TrustBadge[] }

export function trustBadgeViewModel(content: Record<string, any> | null | undefined): TrustBadgeViewModel {
  const c = content || {}
  const items = extractIndexed<TrustBadge>(c, plafondDesLignes("trust_badge"), (cc, i) => cc[`b${i}_label`] ? { icon: cc[`b${i}_icon`], label: cc[`b${i}_label`] } : null)
  return { visible: hasPublishableContent("trust_badge", c), title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
