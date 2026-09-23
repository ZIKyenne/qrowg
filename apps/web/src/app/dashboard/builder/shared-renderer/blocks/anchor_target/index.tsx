"use client"
// anchor_target — Point d'ancrage nommé. Invisible sur la page publiée : il ne sert qu'à
// recevoir les sauts du menu de navigation interne. Dans l'éditeur, il s'affiche pour que
// l'on sache où il est posé. Le décalage évite que le titre visé passe sous un bandeau fixe.
import { anchorId, clampInt } from "../../models/layoutStyle"
import { porteQuelqueChose } from "../../models/misesEnPage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function View({ content: c, u }: { content: Record<string, any>; u: UnifiedCtx }) {
  const id = anchorId(c.name)
  const offset = clampInt(c.offset, 0, 200, 16)
  if (u.mode === "public") {
    if (!id) return null
    return <div id={id} aria-hidden style={{ position: "relative", top: -offset, height: 0, scrollMarginTop: offset }} />
  }
  return (
    <div style={{ padding: "6px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 11px", border: `1px dashed ${u.G}55`, borderRadius: 8, background: `${u.G}0D` }}>
        <span aria-hidden style={{ fontSize: 13 }}>⚓</span>
        <span style={{ color: u.MUTED, fontSize: 11, fontFamily: u.FONT_B }}>
          Point d&apos;ancrage {id ? <b style={{ color: u.G }}>#{id.replace(/^qf-/, "")}</b> : "— donnez-lui un nom"} · invisible en ligne
        </span>
      </div>
    </div>
  )
}

export function EditorAnchorTarget({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  // Lot v170 : sans nom, ce bloc ne pose aucune ancre — il ne reçoit donc aucun
  // saut du menu interne, et ne sert à rien. Son repère disait déjà « donnez-lui
  // un nom », à sa façon ; il le dit maintenant avec l'état vide du produit, ce
  // qui le fait aussi entrer dans la liste d'avant publication. Le repère NOMMÉ,
  // lui, ne bouge pas : c'est ce qui montre où l'ancre est posée.
  if (!porteQuelqueChose("anchor_target", content))
    return <div style={{ padding: "6px 24px" }}><BlockEmptyState icon="⚓" label="Donnez un nom à ce point d’ancrage" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <View content={content} u={u} />
}
export function PublicAnchorTarget({ content, ctx }: PublicAdapterProps) { return <View content={content || {}} u={publicCtx(ctx)} /> }
