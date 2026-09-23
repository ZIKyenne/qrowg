"use client"
// progress_bars — Barres de progression avec pourcentage. Le bloc « compétences »
// existant n'affiche que des étiquettes ; ici on montre un niveau, un avancement, une
// jauge d'objectif (cagnotte, places restantes, taux de satisfaction).
import { extractIndexed } from "../../models/repeaterExtract"
import { plafondDesLignes } from "../../models/plafondDesLignes"
import { safeColor, clampInt } from "../../models/layoutStyle"
import { LayoutSurface, SurfaceHeading } from "../../primitives/LayoutSurface"
import type { Bar } from "../../models/listesDeMiseEnPage"
import { progressBars } from "../../models/listesDeMiseEnPage"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

/** `value: null` = le commerçant n'a pas écrit de chiffre. Ce n'est pas zéro. */


function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const bars = progressBars(c)
  const accent = safeColor(c.color, u.G)
  const thickness = Math.round(clampInt(c.thickness, 4, 24, 8) * u.scale)
  const showPct = String(c.show_value || "Oui") === "Oui"
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <SurfaceHeading u={u} title={c.title} subtitle={c.subtitle} align="left" color={u.TEXT} mutedColor={u.MUTED} titleSize={18} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: Math.round(12 * u.scale), marginTop: c.title || c.subtitle ? Math.round(12 * u.scale) : 0 }}>
        {bars.map((b, i) => (
          <li key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: Math.round(5 * u.scale), gap: Math.round(8 * u.scale) }}>
              <span style={{ color: u.TEXT, fontSize: Math.round(12.5 * u.scale), fontWeight: 600, fontFamily: u.FONT_B }}>{b.label}</span>
              {showPct && (b.note || b.value !== null) && <span style={{ color: b.color || accent, fontSize: Math.round(12 * u.scale), fontWeight: 800, fontFamily: u.FONT_B, flexShrink: 0 }}>{b.note || `${b.value}%`}</span>}
            </div>
            <div style={{ height: thickness, borderRadius: 999, background: u.LINE, overflow: "hidden" }}>
              <div style={{ width: `${b.value ?? 0}%`, height: "100%", borderRadius: 999, background: b.color || `linear-gradient(90deg, ${accent}, ${accent}AA)` }} />
            </div>
          </li>
        ))}
      </ul>
    </LayoutSurface>
  )
}

export function EditorProgressBars({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v171 : l'éditeur rendait la vue d'un bloc vide — c'est-à-dire rien.
  if (progressBars(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📊" label="Nommez la première jauge" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicProgressBars({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (progressBars(c).length === 0) return null
  return <View content={c} u={publicCtx(ctx)} />
}
