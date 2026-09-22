// Modèle pur du bloc `google_review`. Étoiles = parseInt(stars||5). href jugé par destinationUtile. Aucun React.
import { destinationUtile } from "../../types"
import type { CtaLink } from "./ctaLink"
import { combien } from "@/lib/nombreDuContenu"

export type GoogleReviewViewModel = { stars: number; label: string; link: CtaLink }
export function googleReviewViewModel(content: Record<string, any> | null | undefined): GoogleReviewViewModel {
  const c = content || {}
  // Ce nombre part dans un `Array.from({ length })` : il se borne ici (v113).
  const stars = combien(c.stars, 5, 5) || 5
  const url = typeof c.url === "string" ? c.url.trim() : ""
  const href = destinationUtile(url)
  return { stars, label: c.label || "Donner un avis", link: { href, external: true, trackTarget: url, visible: href != null } }
}
