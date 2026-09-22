// Modèle pur `event_ticketing`. Carte billetterie : nom/date/lieu/prix (texte statique) +
// CTA (lien billetterie) TOUJOURS présent. Public null si (event_name || url) absents.
// CTA legacy : target si http(s), href jugé par destinationUtile. Libellé composé avec la plateforme.
import { destinationUtile } from "../../types"
import type { CtaLink } from "./ctaLink"
import { texteUtile } from "./repeaterExtract"

export type EventTicketingViewModel = { visible: boolean; eventName?: string; date?: string; location?: string; price?: string; ctaText: string; link: CtaLink }

export function eventTicketingViewModel(content: Record<string, any> | null | undefined): EventTicketingViewModel {
  const c = content || {}
  const url = typeof c.url === "string" ? c.url : ""
  const platform = c.platform && c.platform !== "URL personnalisée" ? ` — ${c.platform}` : ""
  return {
    visible: !!(texteUtile(c.event_name) || texteUtile(c.url)),
    eventName: c.event_name, date: c.date, location: c.location, price: c.price,
    ctaText: `${c.label || "Réserver ma place"}${platform}`,
    link: { href: destinationUtile(url), external: /^https?:/.test(url), trackTarget: url || "ticket", visible: true },
  }
}
