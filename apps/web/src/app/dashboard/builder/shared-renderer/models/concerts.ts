// Modèle pur `concerts`. items filtrés sur city (c{i}), limite 50. Dates = texte statique.
// Lien billetterie optionnel par date (href durci via extHref). visible = au moins un item (lot v153).
import { extHref } from "../../types"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import type { CtaLink } from "./ctaLink"

export type ConcertShow = { date?: string; city: string; venue?: string; link: CtaLink }
export type ConcertsViewModel = { visible: boolean; title?: string; items: ConcertShow[] }

export function concertsViewModel(content: Record<string, any> | null | undefined): ConcertsViewModel {
  const c = content || {}
  const items = extractIndexed<ConcertShow>(c, plafondDesLignes("concerts"), (cc, i) => {
    if (!texteUtile(cc[`c${i}_city`])) return null
    const url = typeof cc[`c${i}_url`] === "string" ? cc[`c${i}_url`] : ""
    return { date: cc[`c${i}_date`], city: cc[`c${i}_city`], venue: cc[`c${i}_venue`], link: { href: extHref(url) || null, external: true, trackTarget: url, visible: !!url } }
  })
  return { visible: items.length > 0, title: typeof c.title === "string" && c.title ? c.title : undefined, items }
}
