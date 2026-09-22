import { texteUtile } from "./repeaterExtract"
// Modèle pur du bloc `advantages` (liste d'avantages, champs adv{i}). Aucun React/Supabase.
export type AdvantagesViewModel = { visible: boolean; title?: string; items: string[] }
export function advantagesViewModel(content: Record<string, any> | null | undefined): AdvantagesViewModel {
  const c = content || {}
  // Lot v166 : une ligne d'espaces n'est pas une ligne (règle du lot v153).
  const items = Array.from({ length: 50 }, (_, k) => texteUtile(c[`adv${k + 1}`])).filter(Boolean)
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
