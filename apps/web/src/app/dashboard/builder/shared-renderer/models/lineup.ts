// Modèle pur `lineup`. items filtrés sur `name` (a1..a4, limite 4). visible = au moins un item (lot v153).
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type Artist = { name: string; stage?: string; time?: string; headliner?: string }
export type LineupViewModel = { visible: boolean; title?: string; items: Artist[] }

export function lineupViewModel(content: Record<string, any> | null | undefined): LineupViewModel {
  const c = content || {}
  const items = extractIndexed<Artist>(c, plafondDesLignes("lineup"), (cc, i) => texteUtile(cc[`a${i}_name`]) ? { name: cc[`a${i}_name`], stage: cc[`a${i}_stage`], time: cc[`a${i}_time`], headliner: cc[`a${i}_headliner`] } : null)
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
