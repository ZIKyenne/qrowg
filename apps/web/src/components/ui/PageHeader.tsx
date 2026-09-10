// En-tête de page du tableau de bord (8 septembre, d'après la maquette
// « nouvelle direction »). Une seule forme pour tous les écrans :
//
//   KICKER                                   [action secondaire] [action primaire]
//   Titre 22 px
//   Sous-titre 13,5 px
//
// Avant : douze en-têtes différents (titres de 22 à 44 px, centrés ou non,
// pastilles « MODÈLES » à paillettes, icônes dans des tuiles dégradées). Le
// titre reste un <h1> (hierarchieTitres.test), aligné à gauche, sans icône
// décorative : l'icône du module est déjà dans le rail.
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export interface PageHeaderProps {
  /** Petit libellé au-dessus du titre (ex. « Mes QR codes »). */
  kicker?: ReactNode
  title: ReactNode
  /** Une phrase, jamais un paragraphe. */
  sub?: ReactNode
  /** Boutons à droite (le primaire en dernier). */
  actions?: ReactNode
  /** Chemin de retour, affiché au-dessus du kicker. */
  back?: { href: string; label?: string }
  /** Ce qui suit le titre dans le même bloc (badges, filtres…). */
  children?: ReactNode
  /** Espace sous l'en-tête (défaut 22). */
  gap?: number
}

export function PageHeader({ kicker, title, sub, actions, back, children, gap = 22 }: PageHeaderProps) {
  return (
    <header className="ui-page-header" style={{ marginBottom: gap }}>
      {back && (
        // 44 px de haut : c'est le chemin de retour de la page (cible tactile).
        <Link href={back.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", textDecoration: "none", fontSize: 13, minHeight: 44, padding: "0 6px", marginLeft: -6 }}>
          <ArrowLeft size={16} aria-hidden="true" /> {back.label ?? "Retour"}
        </Link>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          {kicker && <div style={{ fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>{kicker}</div>}
          <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.2, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.01em", textWrap: "balance" as any }}>{title}</h1>
          {sub && <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)", maxWidth: 640 }}>{sub}</p>}
        </div>
        {actions && <div className="ui-page-header__actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>{actions}</div>}
      </div>
      {children}
    </header>
  )
}

export default PageHeader
