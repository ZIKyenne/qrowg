// Section de réglages (9 septembre, d'après la maquette « nouvelle direction »).
// Une seule forme pour Profil, Paramètres, Équipe, Domaines, Redirections :
//
//   ┌ icône  Titre                          [action] ┐
//   │        sous-titre                               │
//   ├─────────────────────────────────────────────────┤
//   │ contenu                                         │
//   └─────────────────────────────────────────────────┘
//
// Surface + filet, icône en gris dans le texte (plus de tuile dorée), titre
// 14 px. Avant : trois variantes (Section, SectionCard, card inline) avec
// contours dorés et tuiles colorées.
import type { ReactNode } from "react"

export interface SettingsSectionProps {
  title: ReactNode
  sub?: ReactNode
  /** Icône lucide déjà instanciée (<Shield size={15} />). */
  icon?: ReactNode
  /** Bouton ou lien à droite du titre. */
  action?: ReactNode
  /** Étiquette courte à côté du titre (ex. « Pro »). */
  tag?: ReactNode
  children: ReactNode
  id?: string
  /** Espace sous la section (défaut 16). */
  gap?: number
  /** Retire le rembourrage du corps (listes bord à bord). */
  flush?: boolean
}

export function SettingsSection({ title, sub, icon, action, tag, children, id, gap = 16, flush = false }: SettingsSectionProps) {
  return (
    <section id={id} className="ui-settings-section" style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 14, overflow: "hidden", marginBottom: gap }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {icon && <span aria-hidden="true" style={{ display: "flex", color: "var(--muted)", flexShrink: 0 }}>{icon}</span>}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              {tag && <span style={{ flexShrink: 0, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 999, padding: "2px 9px", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>{tag}</span>}
            </h2>
            {sub && <p style={{ color: "var(--muted)", fontSize: 12, margin: "2px 0 0", lineHeight: 1.45 }}>{sub}</p>}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>{action}</div>}
      </div>
      <div style={{ padding: flush ? 0 : "16px 18px" }}>{children}</div>
    </section>
  )
}

/** Styles de champ partagés (quand la primitive <Input> ne convient pas : champs en ligne, mesures). */
export const champStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "var(--field)", border: "1px solid var(--line-strong)",
  borderRadius: 10, padding: "11px 14px", color: "var(--ink)", fontSize: 14, outline: "none", fontFamily: "inherit",
}
export const etiquetteStyle: React.CSSProperties = { color: "var(--muted)", fontSize: 12, display: "block", marginBottom: 5, fontWeight: 500 }

export default SettingsSection
