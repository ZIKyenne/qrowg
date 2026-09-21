// Modèle pur `stats_block`. items filtrés sur `value`. visible = au moins un item (lot v153).
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type StatItem = { icon?: string; value: string; label?: string }
export type StatsBlockViewModel = { visible: boolean; items: StatItem[] }

export function statsBlockViewModel(content: Record<string, any> | null | undefined): StatsBlockViewModel {
  const c = content || {}
  const items = extractIndexed<StatItem>(c, plafondDesLignes("stats_block"), (cc, i) => texteUtile(cc[`s${i}_value`]) ? { icon: cc[`s${i}_icon`], value: cc[`s${i}_value`], label: cc[`s${i}_label`] } : null)
  return { visible: items.length > 0, items }
}
