"use client"
// anchor_nav — Menu de navigation interne : chaque entrée saute vers un bloc « Point
// d'ancrage » posé plus bas dans la page. C'est ce qui permet enfin de faire des pages
// longues consultables : le visiteur choisit sa section au lieu de tout faire défiler.
import { extractIndexed } from "../../models/repeaterExtract"
import { plafondDesLignes } from "../../models/plafondDesLignes"
import { anchorId, safeColor, alignOf, flexAlign } from "../../models/layoutStyle"
import { LayoutSurface, SmartCta } from "../../primitives/LayoutSurface"
import type { Entry } from "../../models/listesDeMiseEnPage"
import { anchorEntries } from "../../models/listesDeMiseEnPage"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"



function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const entries = anchorEntries(c)
  const accent = safeColor(c.accent_color, u.G)
  const align = alignOf(c.align)
  const pill = String(c.style || "Pastilles") === "Pastilles"
  const scroll = String(c.scroll || "Retour à la ligne") === "Défilement"
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      {/* Lot v156 : ce bloc EST une navigation — des liens vers les sections de
          la page. Le dire permet d'y sauter directement, et de la passer. */}
      <nav aria-label="Sections de la page" style={{
        display: "flex", gap: Math.round(7 * u.scale), justifyContent: flexAlign(align),
        flexWrap: scroll ? "nowrap" : "wrap", overflowX: scroll ? "auto" : undefined,
        paddingBottom: scroll ? Math.round(4 * u.scale) : undefined,
      }}>
        {entries.map((e, i) => (
          <SmartCta key={i} u={u} href={e.target ? `#${e.target}` : ""} external={false} label={<>{e.emoji ? `${e.emoji} ` : ""}{e.label}</>} style={{
            display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", textDecoration: "none",
            padding: `${Math.round(8 * u.scale)}px ${Math.round(14 * u.scale)}px`,
            borderRadius: pill ? 999 : 9,
            background: pill ? `${accent}18` : "transparent",
            border: `1px solid ${accent}${pill ? "3A" : "55"}`,
            color: accent, fontSize: Math.round(12.5 * u.scale), fontWeight: 700, fontFamily: u.FONT_B,
          }} />
        ))}
      </nav>
    </LayoutSurface>
  )
}

export function EditorAnchorNav({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v171 : l'éditeur rendait la vue d'un bloc vide — c'est-à-dire rien.
  if (anchorEntries(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧭" label="Nommez la première entrée du menu" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicAnchorNav({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (anchorEntries(c).length === 0) return null
  return <View content={c} u={publicCtx(ctx)} />
}
