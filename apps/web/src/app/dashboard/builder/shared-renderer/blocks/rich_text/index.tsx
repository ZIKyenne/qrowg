"use client"
// rich_text — Un paragraphe libre. Chaque cote avait sa propre echelle de
// tailles (11/13/15 dans l'apercu, 13/14/16 en ligne) : les ecarts entre
// « petit », « normal » et « grand » n'y etaient pas les memes, donc le reglage
// se choisissait sur une comparaison faussee.
import { texteLibre } from "../../models/profilEtTexte"
import { texteFige, texteEditable } from "../../primitives/TexteInline"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type RenduTexte, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, Texte }: { u: UnifiedCtx; c: Record<string, any>; Texte: RenduTexte }) {
  const t = texteLibre(c)!
  return (
    <div style={{ padding: `${sz(u, 4)}px ${sz(u, 24)}px ${sz(u, 14)}px`, textAlign: t.align, fontFamily: u.FONT_B }}>
      <Texte valeur={t.texte} cle="text" balise="p" multiligne placeholder="Votre texte…"
        style={{ color: u.MUTED, fontSize: sz(u, t.taille), lineHeight: 1.75, margin: 0, fontFamily: u.FONT_B, whiteSpace: "pre-wrap" }} />
    </div>
  )
}

export function EditorRichText({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!texteLibre(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="✍️" label="Ajoutez votre texte" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} Texte={texteEditable(ctx.canEdit, ctx.edit)} />
}
export function PublicRichText({ content, ctx }: PublicAdapterProps) {
  if (!texteLibre(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} Texte={texteFige} />
}
