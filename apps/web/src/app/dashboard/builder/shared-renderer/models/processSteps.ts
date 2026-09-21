// Modèle pur `process_steps`. visible = au moins un item ; items filtrés sur `title`.
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type ProcessStep = { i: number; icon?: string; title: string; desc?: string }
export type ProcessStepsViewModel = { visible: boolean; title?: string; items: ProcessStep[] }

export function processStepsViewModel(content: Record<string, any> | null | undefined): ProcessStepsViewModel {
  const c = content || {}
  const items = extractIndexed<ProcessStep>(c, plafondDesLignes("process_steps"), (cc, i) => texteUtile(cc[`s${i}_title`]) ? { i, icon: cc[`s${i}_icon`], title: cc[`s${i}_title`], desc: cc[`s${i}_desc`] } : null)
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
