"use client"
// ribbon_banner — Ruban incliné, comme une étiquette collée sur la page. Sert à marquer
// une nouveauté, une période ou une promotion sans ouvrir un bloc promo complet.
import { safeColor, alignOf, flexAlign, textOn } from "../../models/layoutStyle"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { porteQuelqueChose } from "../../models/misesEnPage"

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const color = safeColor(c.color, u.G)
  const fg = safeColor(c.text_color, textOn(color))
  const tilt = String(c.tilt || "Gauche")
  const deg = tilt === "Aucune" ? 0 : tilt === "Droite" ? 2.5 : -2.5
  const align = alignOf(c.align)
  return (
    <div style={{ padding: `${Math.round(10 * u.scale)}px 24px`, display: "flex", justifyContent: flexAlign(align) }}>
      <div style={{
        transform: `rotate(${deg}deg)`, background: color, color: fg,
        padding: `${Math.round(9 * u.scale)}px ${Math.round(22 * u.scale)}px`,
        boxShadow: `0 ${Math.round(6 * u.scale)}px ${Math.round(18 * u.scale)}px rgba(0,0,0,0.28)`,
        display: "inline-flex", alignItems: "center", gap: Math.round(8 * u.scale), maxWidth: "100%",
      }}>
        {c.emoji && <span style={{ fontSize: Math.round(16 * u.scale) }}>{c.emoji}</span>}
        <span style={{ fontSize: Math.round(14 * u.scale), fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", fontFamily: u.FONT_D }}>{c.text}</span>
      </div>
    </div>
  )
}

export function EditorRibbonBanner({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans cette branche, l'éditeur rendait la vue d'un bloc vide —
  // c'est-à-dire rien du tout, un trou muet dans le canvas.
  if (!porteQuelqueChose("ribbon_banner", content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎀" label="Écrivez le texte du ruban" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicRibbonBanner({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!porteQuelqueChose("ribbon_banner", c)) return null
  return <View content={c} u={publicCtx(ctx)} />
}
