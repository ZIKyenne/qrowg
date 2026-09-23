"use client"
// badge_row — Rangée de pastilles. Une simple liste séparée par des virgules devient une
// série d'étiquettes colorées : labels, garanties, spécialités, moyens de paiement.
import { splitList, safeColor, alignOf, flexAlign, textOn } from "../../models/layoutStyle"
import { LayoutSurface, SurfaceHeading } from "../../primitives/LayoutSurface"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { badgeItems } from "../../models/listesDeMiseEnPage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const items = splitList(c.items, 20)
  const accent = safeColor(c.color, u.G)
  const align = alignOf(c.align)
  const kind = String(c.style || "Doux")
  const size = String(c.size || "Normale") === "Grande" ? 13.5 : String(c.size || "") === "Petite" ? 10.5 : 12
  const skin = kind === "Plein"
    ? { background: accent, color: textOn(accent), border: "none" }
    : kind === "Contour"
      ? { background: "transparent", color: accent, border: `1px solid ${accent}` }
      : { background: `${accent}1A`, color: accent, border: `1px solid ${accent}33` }
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <SurfaceHeading u={u} title={c.title} subtitle={undefined} align={align} color={u.TEXT} mutedColor={u.MUTED} titleSize={13} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: Math.round(6 * u.scale), justifyContent: flexAlign(align), marginTop: c.title ? Math.round(9 * u.scale) : 0 }}>
        {items.map((t, i) => (
          <span key={i} style={{
            ...skin, borderRadius: String(c.shape || "Arrondie") === "Carrée" ? 7 : 999,
            padding: `${Math.round(5 * u.scale)}px ${Math.round(12 * u.scale)}px`,
            fontSize: Math.round(size * u.scale), fontWeight: 700, fontFamily: u.FONT_B, whiteSpace: "nowrap",
          }}>{t}</span>
        ))}
      </div>
    </LayoutSurface>
  )
}

export function EditorBadgeRow({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v171 : l'éditeur rendait la vue d'un bloc vide — c'est-à-dire rien.
  if (badgeItems(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🏷️" label="Écrivez vos étiquettes, séparées par des virgules" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicBadgeRow({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (badgeItems(c).length === 0) return null
  return <View content={c} u={publicCtx(ctx)} />
}
