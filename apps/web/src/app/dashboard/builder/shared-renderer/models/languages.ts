// Modèle pur du bloc `languages` (liste langue + niveau). Aucun React/Supabase.
import { texteUtile } from "./repeaterExtract"

export type LanguageItem = { flag?: string; name: string; level?: string }
export type LanguagesViewModel = { visible: boolean; title?: string; items: LanguageItem[] }
export function languagesViewModel(content: Record<string, any> | null | undefined): LanguagesViewModel {
  // Lot v166 : une ligne d'espaces n'est pas une ligne (règle du lot v153).
  const c = content || {}
  const items = Array.from({ length: 50 }, (_, k) => k + 1)
    .map(i => ({ flag: c[`lang_${i}_flag`], name: c[`lang_${i}_name`], level: c[`lang_${i}_level`] }))
    .filter(l => texteUtile(l.name)) as LanguageItem[]
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
