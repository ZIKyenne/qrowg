"use client"
// toggle_content — Texte long replié derrière un bouton « Voir plus ». Sans lui, une
// page complète oblige à faire défiler des paragraphes que peu de gens lisent ; ici
// l'information reste disponible sans encombrer. Déplié d'office dans l'éditeur.
import { useState } from "react"
import { alignOf, safeColor, clampInt } from "../../models/layoutStyle"
import { LayoutSurface, SurfaceHeading } from "../../primitives/LayoutSurface"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { porteQuelqueChose } from "../../models/misesEnPage"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const [open, setOpen] = useState(u.mode === "editor" || String(c.default_open || "Non") === "Oui")
  const align = alignOf(c.align, "left")
  const accent = safeColor(c.accent_color, u.G)
  const teaseLines = clampInt(c.preview_lines, 0, 8, 2)
  const openLabel = String(c.open_label || "Voir plus")
  const closeLabel = String(c.close_label || "Voir moins")
  const clamp = !open && teaseLines > 0
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <SurfaceHeading u={u} title={c.title} subtitle={undefined} align={align} color={u.TEXT} mutedColor={u.MUTED} titleSize={17} />
      <p style={{
        color: u.MUTED, fontSize: Math.round(13 * u.scale), lineHeight: 1.7, fontFamily: u.FONT_B,
        margin: `${c.title ? Math.round(8 * u.scale) : 0}px 0 0`, textAlign: align, whiteSpace: "pre-line",
        ...(clamp ? { display: "-webkit-box", WebkitLineClamp: teaseLines, WebkitBoxOrient: "vertical" as any, overflow: "hidden" } : {}),
      }}>{c.text}</p>
      {u.mode === "public" && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} style={avecCibleTactile({
          marginTop: Math.round(9 * u.scale), background: "transparent", border: "none", cursor: "pointer", padding: 0,
          color: accent, fontSize: Math.round(12.5 * u.scale), fontWeight: 700, fontFamily: u.FONT_B,
          // « display: block » ferait un bouton pleine largeur : ici on veut juste
          // qu'il soit assez haut pour le pouce, aligné comme le texte du bloc.
          marginLeft: align === "center" ? "auto" : undefined, marginRight: align === "center" ? "auto" : undefined,
        })}>{open ? `${closeLabel} ↑` : `${openLabel} ↓`}</button>
      )}
    </LayoutSurface>
  )
}

export function EditorToggleContent({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans cette branche, l'éditeur rendait la vue d'un bloc vide —
  // c'est-à-dire rien du tout, un trou muet dans le canvas.
  if (!porteQuelqueChose("toggle_content", content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📂" label="Écrivez le texte à replier" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicToggleContent({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!porteQuelqueChose("toggle_content", c)) return null
  return <View content={c} u={publicCtx(ctx)} />
}
