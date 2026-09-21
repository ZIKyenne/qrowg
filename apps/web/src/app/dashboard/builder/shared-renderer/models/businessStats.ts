// Modèle pur `business_stats`. items filtrés sur `value` (clés stat{i}). Limite 50.
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type BusinessStat = { icon?: string; value: string; label?: string }
export type BusinessStatsViewModel = { visible: boolean; items: BusinessStat[] }

export function businessStatsViewModel(content: Record<string, any> | null | undefined): BusinessStatsViewModel {
  const c = content || {}
  const items = extractIndexed<BusinessStat>(c, plafondDesLignes("business_stats"), (cc, i) => cc[`stat${i}_value`] ? { icon: cc[`stat${i}_icon`], value: cc[`stat${i}_value`], label: cc[`stat${i}_label`] } : null)
  return { visible: items.length > 0, items }
}
