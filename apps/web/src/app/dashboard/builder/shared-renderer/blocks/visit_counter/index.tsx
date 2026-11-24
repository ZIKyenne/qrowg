"use client"
// visit_counter — Le nombre de visites de la page, tel que la page le connaît.
// Le bloc ne se remplit pas : c'est le produit qui lui donne son nombre. Ni
// l'éditeur ni la galerie ne le connaissent — la galerie affichait « 1 234 ».
import { compteurDeVisites } from "../../models/affichagesSimples"
import { BlockEmptyState } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, nombre, libelle }: { u: UnifiedCtx; nombre: string; libelle: string }) {
  return (
    <div style={{ padding: `${sz(u, 12)}px ${sz(u, 24)}px ${sz(u, 16)}px`, textAlign: "center" }}>
      <p style={{ fontFamily: u.FONT_D, fontSize: sz(u, 44), color: u.G, fontWeight: 700, margin: `0 0 ${sz(u, 3)}px` }}>{nombre}</p>
      <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: 0, fontFamily: u.FONT_B }}>{libelle}</p>
    </div>
  )
}

export function EditorVisitCounter({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const libelle = String(content?.label || "").trim() || "visiteurs"
  return (
    <div style={{ padding: "10px 16px" }}>
      <BlockEmptyState icon="👁️" label={`Compteur de visites — « ${libelle} »`} sub="Le nombre réel s'affiche en ligne ; invisible tant qu'il est à zéro" muted={u.MUTED} />
    </div>
  )
}
export function PublicVisitCounter({ content, ctx }: PublicAdapterProps) {
  const m = compteurDeVisites(ctx.totalVues, content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} nombre={m.nombre} libelle={m.libelle} />
}
