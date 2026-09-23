"use client"
// columns_text — Deux ou trois colonnes de texte, chacune avec son emoji et son titre.
// Complète le bloc « Colonnes » existant, limité à deux colonnes et sans réglage de fond
// ni d'alignement. Utile pour Horaires / Accès / Contact sur une seule ligne.
import { extractIndexed } from "../../models/repeaterExtract"
import { plafondDesLignes } from "../../models/plafondDesLignes"
import { alignOf, clampInt } from "../../models/layoutStyle"
import { LayoutSurface, SurfaceHeading } from "../../primitives/LayoutSurface"
import type { Col } from "../../models/listesDeMiseEnPage"
import { columnsTextItems } from "../../models/listesDeMiseEnPage"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"



function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const cols = columnsTextItems(c)
  const align = alignOf(c.align, "left")
  const n = clampInt(c.columns, 1, 3, Math.max(1, cols.length))
  const divider = String(c.divider || "Non") === "Oui"
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <SurfaceHeading u={u} title={c.title} subtitle={undefined} align={align} color={u.TEXT} mutedColor={u.MUTED} titleSize={18} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: Math.round(12 * u.scale), marginTop: c.title ? Math.round(12 * u.scale) : 0 }}>
        {cols.map((col, i) => (
          <div key={i} style={{ textAlign: align, borderLeft: divider && i > 0 ? `1px solid ${u.LINE}` : undefined, paddingLeft: divider && i > 0 ? Math.round(11 * u.scale) : undefined }}>
            {col.emoji && <span style={{ fontSize: Math.round(19 * u.scale), display: "block", marginBottom: Math.round(5 * u.scale) }}>{col.emoji}</span>}
            {col.title && <p style={{ color: u.TEXT, fontSize: Math.round(13 * u.scale), fontWeight: 700, margin: `0 0 ${Math.round(4 * u.scale)}px`, fontFamily: u.FONT_D }}>{col.title}</p>}
            {col.text && <p style={{ color: u.MUTED, fontSize: Math.round(12 * u.scale), margin: 0, lineHeight: 1.6, fontFamily: u.FONT_B, whiteSpace: "pre-line" }}>{col.text}</p>}
          </div>
        ))}
      </div>
    </LayoutSurface>
  )
}

export function EditorColumnsText({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v171 : l'éditeur rendait la vue d'un bloc vide — c'est-à-dire rien.
  if (columnsTextItems(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧾" label="Écrivez le titre ou le texte d’une colonne" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicColumnsText({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (columnsTextItems(c).length === 0) return null
  return <View content={c} u={publicCtx(ctx)} />
}
