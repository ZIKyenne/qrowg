// Modèle pur `on_site_services`. visible = au moins un item ; items filtrés sur `label`.
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type OnSiteService = { icon?: string; label: string }
export type OnSiteServicesViewModel = { visible: boolean; title?: string; items: OnSiteService[] }

export function onSiteServicesViewModel(content: Record<string, any> | null | undefined): OnSiteServicesViewModel {
  const c = content || {}
  const items = extractIndexed<OnSiteService>(c, plafondDesLignes("on_site_services"), (cc, i) => texteUtile(cc[`s${i}_label`]) ? { icon: cc[`s${i}_icon`], label: cc[`s${i}_label`] } : null)
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
