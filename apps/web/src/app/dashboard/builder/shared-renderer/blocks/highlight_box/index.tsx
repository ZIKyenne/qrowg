"use client"
// highlight_box — Encadré d'emphase à barre latérale colorée. L'encadré d'info existant
// impose cinq styles fixes ; ici la couleur, la position de la barre et le fond sont
// libres, ce qui permet d'accorder l'encadré à la charte de chaque page.
import { alignOf, safeColor } from "../../models/layoutStyle"
import { LayoutSurface } from "../../primitives/LayoutSurface"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { porteQuelqueChose } from "../../models/misesEnPage"

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const accent = safeColor(c.color, u.G)
  const align = alignOf(c.align, "left")
  const side = String(c.bar_side || "Gauche")
  const bar = `${Math.round(3 * u.scale)}px solid ${accent}`
  const tinted = String(c.background || "Teinté") === "Teinté"
  return (
    <LayoutSurface content={c} u={u} defaultPad="none" defaultRadius={0}>
      <div style={{
        background: tinted ? `${accent}12` : "transparent",
        borderLeft: side === "Gauche" ? bar : undefined,
        borderRight: side === "Droite" ? bar : undefined,
        borderTop: side === "Haut" ? bar : undefined,
        borderRadius: side === "Haut" ? 10 : `0 10px 10px 0`,
        padding: `${Math.round(14 * u.scale)}px ${Math.round(15 * u.scale)}px`,
        textAlign: align,
      }}>
        <div style={{ display: "flex", gap: Math.round(10 * u.scale), alignItems: "flex-start", justifyContent: align === "center" ? "center" : undefined }}>
          {c.emoji && <span style={{ fontSize: Math.round(18 * u.scale), flexShrink: 0, lineHeight: 1.2 }}>{c.emoji}</span>}
          <div style={{ flex: align === "center" ? undefined : 1, minWidth: 0 }}>
            {c.title && <h2 style={{ color: accent, fontSize: Math.round(12.5 * u.scale), fontWeight: 800, margin: `0 0 ${Math.round(4 * u.scale)}px`, textTransform: "uppercase", letterSpacing: 1, fontFamily: u.FONT_B }}>{c.title}</h2>}
            {c.text && <p style={{ color: u.TEXT, fontSize: Math.round(13 * u.scale), lineHeight: 1.65, margin: 0, fontFamily: u.FONT_B, whiteSpace: "pre-line" }}>{c.text}</p>}
          </div>
        </div>
      </div>
    </LayoutSurface>
  )
}

export function EditorHighlightBox({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans cette branche, l'éditeur rendait la vue d'un bloc vide —
  // c'est-à-dire rien du tout, un trou muet dans le canvas.
  if (!porteQuelqueChose("highlight_box", content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="✨" label="Écrivez le texte à mettre en valeur" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicHighlightBox({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!porteQuelqueChose("highlight_box", c)) return null
  return <View content={c} u={publicCtx(ctx)} />
}
