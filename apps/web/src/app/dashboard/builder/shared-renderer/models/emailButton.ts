// Modèle pur du bloc `email_button`. href mailto (avec subject). Aucun React.
import type { CtaLink } from "./ctaLink"
import { lienEmail } from "@/lib/lienDeContact"

export type EmailButtonViewModel = { label: string; link: CtaLink }
export function emailButtonViewModel(content: Record<string, any> | null | undefined): EmailButtonViewModel {
  const c = content || {}
  // `null` quand l'adresse n'en est pas une : mieux vaut pas de bouton qu'un
  // bouton mort — ou qu'un brouillon en copie cachée (lot v114).
  const href = lienEmail(c.email, { sujet: c.subject })
  return { label: c.label || "Envoyer un email", link: { href, external: false, trackTarget: "email", visible: href != null } }
}
