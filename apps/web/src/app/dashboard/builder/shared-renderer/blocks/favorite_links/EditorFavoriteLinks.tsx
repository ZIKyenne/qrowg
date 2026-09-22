"use client"
import { ExternalLink } from "lucide-react"
import { favoriteLinksViewModel } from "../../models/favoriteLinks"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

// Éditeur : liens neutralisés (divs), placeholder textuel si vide (aucun faux item).
export function EditorFavoriteLinks({ content, ctx }: EditorAdapterProps) {
  const { visible, title, items } = favoriteLinksViewModel(content)
  const { text, muted, primary, surfaceStyle } = ctx
  // Lot v166 : ce bloc disparaît de la page quand il est vide, et l'éditeur
  // ne le disait pas — le commerçant le croyait publié.
  if (!visible) return <div style={{ padding: "10px 16px", ...surfaceStyle }}><BlockEmptyState icon="🔗" label="Ajoutez un lien" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      {title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{title}</p>}
      {items.length === 0
        ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos liens favoris</p>
        : <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: primary + "08", border: `1px solid ${primary}15`, borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{it.icon || "🔗"}</span>
                <span style={{ color: text, fontSize: 13, fontWeight: 600, flex: 1 }}>{it.label}</span>
                <ExternalLink size={11} color={primary} />
              </div>
            ))}
          </div>}
    </div>
  )
}
