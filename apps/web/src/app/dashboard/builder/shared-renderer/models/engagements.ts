// Modèle pur `engagements`. items = e1..e6 (truthy). visible = hasPublishableContent.
import { hasPublishableContent } from "../../blockEmptyState"
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type EngagementsViewModel = { visible: boolean; title?: string; items: string[] }

export function engagementsViewModel(content: Record<string, any> | null | undefined): EngagementsViewModel {
  const c = content || {}
  const items = extractIndexed<string>(c, plafondDesLignes("engagements"), (cc, i) => cc[`e${i}`] ? cc[`e${i}`] : null)
  return { visible: hasPublishableContent("engagements", c), title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
