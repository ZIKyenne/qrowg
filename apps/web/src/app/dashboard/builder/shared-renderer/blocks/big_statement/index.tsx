"use client"
// big_statement — Une phrase, en très grand. Taille, graisse, couleur et dégradé de texte
// réglables. C'est le bloc qui donne un caractère typographique à une page : sans lui,
// toutes les pages ont la même hiérarchie visuelle.
import { alignOf, safeColor, clampInt } from "../../models/layoutStyle"
import { LayoutSurface } from "../../primitives/LayoutSurface"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { porteQuelqueChose } from "../../models/misesEnPage"

const SIZES: Record<string, number> = { "Grande": 28, "Très grande": 38, "Énorme": 50, "Titan": 64 }

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const align = alignOf(c.align)
  const size = SIZES[String(c.size || "Très grande")] ?? clampInt(c.size, 16, 80, 38)
  const gradient = String(c.fill || "Uni") === "Dégradé"
  const c1 = safeColor(c.color, u.TEXT)
  const c2 = safeColor(c.color2, u.G)
  const weight = String(c.weight || "Très gras") === "Léger" ? 400 : String(c.weight || "") === "Normal" ? 600 : 800
  const grad = gradient
    ? { backgroundImage: `linear-gradient(120deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" as any }
    : { color: c1 }
  return (
    <LayoutSurface content={c} u={u} defaultPad="compact">
      <p style={{
        margin: 0, textAlign: align, fontFamily: u.FONT_D, fontWeight: weight,
        fontSize: Math.round(size * u.scale), lineHeight: 1.1,
        letterSpacing: String(c.spacing || "Normal") === "Serré" ? -1 : String(c.spacing || "") === "Large" ? 1.5 : -0.3,
        textTransform: String(c.uppercase || "Non") === "Oui" ? "uppercase" : "none",
        whiteSpace: "pre-line", ...grad,
      }}>{c.text}</p>
      {c.subtext && <p style={{ margin: `${Math.round(10 * u.scale)}px 0 0`, textAlign: align, color: u.MUTED, fontSize: Math.round(13.5 * u.scale), lineHeight: 1.6, fontFamily: u.FONT_B }}>{c.subtext}</p>}
    </LayoutSurface>
  )
}

export function EditorBigStatement({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans cette branche, l'éditeur rendait la vue d'un bloc vide —
  // c'est-à-dire rien du tout, un trou muet dans le canvas.
  if (!porteQuelqueChose("big_statement", content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="💬" label="Écrivez la phrase à mettre en avant" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicBigStatement({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!porteQuelqueChose("big_statement", c)) return null
  return <View content={c} u={publicCtx(ctx)} />
}
