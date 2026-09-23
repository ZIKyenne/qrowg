"use client"
// compare_two — Comparatif en deux colonnes, ligne à ligne, avec une coche à gauche et
// une croix à droite (ou l'inverse). Répond à « pourquoi vous plutôt qu'un autre »,
// « avant / après », « formule simple / complète » sans tableau de tarifs complet.
import { extractIndexed } from "../../models/repeaterExtract"
import { plafondDesLignes } from "../../models/plafondDesLignes"
import { safeColor } from "../../models/layoutStyle"
import { LayoutSurface, SurfaceHeading } from "../../primitives/LayoutSurface"
import type { RangeeCompare as Row } from "../../models/listesDeMiseEnPage"
import { compareRows } from "../../models/listesDeMiseEnPage"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"



function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const rows = compareRows(c)
  // Marqueurs ✓ / ✕ : des couleurs de SENS, écrites pour le fond noir du produit.
  // Sur un thème clair elles tombaient à 1,1 : 1 (relevé du 11 septembre).
  const good = u.lisible(safeColor(c.left_color, "#39FF8F"))
  const bad = u.lisible(safeColor(c.right_color, "#FF6B6B"))
  const marks = String(c.marks || "Oui") === "Oui"
  const cell = (txt: string, color: string, mark: string) => (
    <div style={{ flex: 1, minWidth: 0, display: "flex", gap: Math.round(6 * u.scale), alignItems: "flex-start", padding: `${Math.round(9 * u.scale)}px ${Math.round(10 * u.scale)}px` }}>
      {marks && <span aria-hidden style={{ color, fontSize: Math.round(12 * u.scale), fontWeight: 800, flexShrink: 0, lineHeight: 1.4 }}>{mark}</span>}
      <span style={{ color: u.TEXT, fontSize: Math.round(12 * u.scale), lineHeight: 1.45, fontFamily: u.FONT_B }}>{txt}</span>
    </div>
  )
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <SurfaceHeading u={u} title={c.title} subtitle={undefined} align="center" color={u.TEXT} mutedColor={u.MUTED} titleSize={18} />
      <div style={{ marginTop: c.title ? Math.round(12 * u.scale) : 0, border: `1px solid ${u.LINE}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", background: u.FILL }}>
          <div style={{ flex: 1, minWidth: 0, padding: `${Math.round(9 * u.scale)}px ${Math.round(10 * u.scale)}px`, textAlign: "center" }}>
            <span style={{ color: good, fontSize: Math.round(12 * u.scale), fontWeight: 800, fontFamily: u.FONT_D }}>{c.left_title || "Nous"}</span>
          </div>
          <div style={{ width: 1, background: u.LINE }} />
          <div style={{ flex: 1, minWidth: 0, padding: `${Math.round(9 * u.scale)}px ${Math.round(10 * u.scale)}px`, textAlign: "center" }}>
            <span style={{ color: u.MUTED, fontSize: Math.round(12 * u.scale), fontWeight: 800, fontFamily: u.FONT_D }}>{c.right_title || "Ailleurs"}</span>
          </div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", borderTop: `1px solid ${u.LINE}` }}>
            {cell(r.left, good, "✓")}
            <div style={{ width: 1, background: u.LINE }} />
            {cell(r.right, bad, "✕")}
          </div>
        ))}
      </div>
    </LayoutSurface>
  )
}

export function EditorCompareTwo({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v171 : l'éditeur rendait la vue d'un bloc vide — c'est-à-dire rien.
  if (compareRows(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⚖️" label="Écrivez une ligne à comparer" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicCompareTwo({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (compareRows(c).length === 0) return null
  return <View content={c} u={publicCtx(ctx)} />
}
