"use client"
// split_panel — Deux panneaux côte à côte, chacun avec sa propre couleur, son emoji,
// son titre, son texte et son lien. Sert aux oppositions (Sur place / À emporter,
// Homme / Femme, Midi / Soir) sans avoir à créer un bloc métier par cas.
import { destinationUtile } from "../../../types"
import { safeColor, textOn } from "../../models/layoutStyle"
import { LayoutSurface, SmartCta } from "../../primitives/LayoutSurface"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { porteQuelqueChose } from "../../models/misesEnPage"

type Panel = { emoji?: string; title?: string; text?: string; label?: string; href: string | null; bg: string }

function panelOf(c: Record<string, any>, p: "l" | "r", fallback: string): Panel {
  return {
    emoji: c[`${p}_emoji`], title: c[`${p}_title`], text: c[`${p}_text`],
    label: c[`${p}_cta_label`], href: destinationUtile(String(c[`${p}_cta_url`] || "")),
    bg: safeColor(c[`${p}_color`], fallback),
  }
}

function Side({ p, u }: { p: Panel; u: UnifiedCtx }) {
  const fg = textOn(p.bg)
  const soft = fg === "#FFFFFF" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)"
  const chip = fg === "#FFFFFF" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)"
  const chipBorder = fg === "#FFFFFF" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.18)"
  return (
    <div style={{ flex: 1, minWidth: 0, background: p.bg, borderRadius: 12, padding: `${Math.round(16 * u.scale)}px ${Math.round(13 * u.scale)}px`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Math.round(5 * u.scale) }}>
      {p.emoji && <span style={{ fontSize: Math.round(26 * u.scale) }}>{p.emoji}</span>}
      {p.title && <h2 style={{ color: fg, fontSize: Math.round(15 * u.scale), fontWeight: 700, margin: 0, fontFamily: u.FONT_D }}>{p.title}</h2>}
      {p.text && <p style={{ color: soft, fontSize: Math.round(12 * u.scale), margin: 0, lineHeight: 1.5, fontFamily: u.FONT_B }}>{p.text}</p>}
      {p.label && <SmartCta u={u} href={p.href} label={p.label} style={{ marginTop: Math.round(6 * u.scale), padding: `${Math.round(7 * u.scale)}px ${Math.round(14 * u.scale)}px`, borderRadius: 8, background: chip, border: `1px solid ${chipBorder}`, color: fg, fontSize: Math.round(12 * u.scale), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B, display: "inline-block" }} />}
    </div>
  )
}

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const vertical = /superpos/i.test(String(c.layout || ""))
  const left = panelOf(c, "l", u.G)
  const right = panelOf(c, "r", "#2A2620")
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", gap: Math.round(10 * u.scale) }}>
        <Side p={left} u={u} />
        <Side p={right} u={u} />
      </div>
    </LayoutSurface>
  )
}

export function EditorSplitPanel({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans cette branche, l'éditeur rendait la vue d'un bloc vide —
  // c'est-à-dire rien du tout, un trou muet dans le canvas.
  if (!porteQuelqueChose("split_panel", content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🧩" label="Remplissez au moins un des deux côtés" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicSplitPanel({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!porteQuelqueChose("split_panel", c)) return null
  return <View content={c} u={publicCtx(ctx)} />
}
