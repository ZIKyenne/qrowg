import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode, CSSProperties } from "react"

/**
 * Carte « prochaine étape » de l'assistant : icône + une phrase + un seul CTA.
 * Source unique pour les nudges contextuels homogènes (Dashboard, Profil…).
 * Fournir soit `href` (rendu <Link>), soit `onClick` (rendu <button>).
 */
export default function NextStepCard({
  icon, children, ctaLabel, href, onClick, animationDelay, ton = "primaire",
}: {
  icon: ReactNode           // emoji (string) ou icône lucide — les deux rendent dans la pastille
  children: ReactNode
  ctaLabel: string
  href?: string
  onClick?: () => void
  animationDelay?: string
  /**
   * « secondaire » : contour doré au lieu de l'or plein.
   *
   * Un écran n'a qu'UN bouton d'or plein — c'est ce qui en fait l'action
   * principale. Sur le tableau de bord, ce bouton est « Nouvelle page » ; le
   * conseil de l'assistant, lui, propose une étape, pas l'action de l'écran.
   */
  ton?: "primaire" | "secondaire"
}) {
  const cta: CSSProperties = { flexShrink: 0, textDecoration: "none" }
  const classeCta = ton === "secondaire" ? "da-btn-ghost da-btn-ghost--sm qd-btn" : "da-btn-primary da-btn-primary--sm" 
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap",
      padding: "14px 18px", borderRadius: 14, animationDelay,
      background: "var(--surface)",
      border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--surface-2))",
    }}>
      <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 26%, transparent)" }}>{icon}</span>
      <p style={{ flex: 1, minWidth: 160, margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>{children}</p>
      {href
        ? <Link href={href} className={classeCta} style={cta}><span>{ctaLabel}</span> <ArrowRight className="da-ic da-ic-arrow" size={14} strokeWidth={2.5} /></Link>
        : <button type="button" onClick={onClick} className={classeCta}><span>{ctaLabel}</span> <ArrowRight className="da-ic da-ic-arrow" size={14} strokeWidth={2.5} /></button>}
    </div>
  )
}
