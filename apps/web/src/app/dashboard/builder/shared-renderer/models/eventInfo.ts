// Modèle pur `event_info`. Carte événement : nom + lignes date/heure/lieu/prix (texte
// statique, aucune logique temporelle) + CTA optionnel. CTA legacy : PAS de target/rel
// (external=false).
import { extHref } from "../../types"
import type { CtaLink } from "./ctaLink"

export type EventInfoRow = { icon: string; val: string }
// Vague 25 — « visible: true » sans condition : posé vide, ce bloc publiait son
// décor et rien d'autre. Un cadre vide sur la page du client.
export type EventInfoViewModel = { visible: boolean; name?: string; rows: EventInfoRow[]; ctaLabel?: string; link: CtaLink }

export function eventInfoViewModel(content: Record<string, any> | null | undefined): EventInfoViewModel {
  const c = content || {}
  const url = typeof c.cta_url === "string" ? c.cta_url : ""
  const rows = ([["📅", c.date], ["🕐", c.time], ["📍", c.location], ["🎟️", c.price]] as [string, any][])
    .filter(([, v]) => v).map(([icon, val]) => ({ icon, val: val as string }))
  const nom = typeof c.name === "string" && c.name.trim() ? c.name : undefined
  return {
    visible: !!(nom || rows.length || (typeof c.cta_label === "string" && c.cta_label.trim())),
    name: nom, rows, ctaLabel: c.cta_label,
    // Ce lien menait le visiteur AILLEURS sans ouvrir d'onglet : il quittait la
    // page du commerçant et n'y revenait pas. Soixante autres blocs ouvrent déjà
    // un onglet pour une adresse externe ; ces trois-là ne le faisaient pas, par
    // fidélité au legacy. Un chemin interne ou une ancre, eux, restent sur place.
    // (Vague 26.)
    link: { href: extHref(url) || null, external: /^https?:/i.test(url), trackTarget: url || "event_info", visible: !!c.cta_label },
  }
}
