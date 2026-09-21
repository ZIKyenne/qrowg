// Modèle de vue PUR du bloc `values`. Visible dès qu'un item porte un libellé.
// Filtre les items sur `label` (comme les deux renderers legacy). Aucun React.
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
export type ValueItem = { i: number; icon?: string; label: string; desc?: string }
export type ValuesViewModel = { visible: boolean; title?: string; items: ValueItem[] }

export function valuesViewModel(content: Record<string, any> | null | undefined): ValuesViewModel {
  const c = content || {}
  // Lot v153 : ce balayage écrivait son propre plafond et gardait une valeur
  // faite d'espaces. Il passe par le geste partagé, et par la règle du produit :
  // une ligne d'espaces n'est pas une ligne.
  const items = extractIndexed<ValueItem>(c, plafondDesLignes("values"), (src, i) =>
    texteUtile(src[`v${i}_label`]) ? { i, icon: src[`v${i}_icon`], label: src[`v${i}_label`], desc: src[`v${i}_desc`] } : null)
  return {
    visible: items.length > 0,
    title: typeof c.title === "string" && c.title ? c.title : undefined,
    items,
  }
}
