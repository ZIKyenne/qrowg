"use client"
// about — L'histoire du commerce. L'apercu ecrivait « Votre histoire ici... » a
// la place du texte manquant, alors que la page ne publie rien : le commercant
// composait contre un paragraphe qui n'existerait jamais. Et avec un titre
// seul, la page publiait un <p> vide — un trou dans la mise en page.
import { apropos } from "../../models/informationsEtAnnonces"
import { texteFige, texteEditable } from "../../primitives/TexteInline"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type RenduTexte, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, Texte }: { u: UnifiedCtx; c: Record<string, any>; Texte: RenduTexte }) {
  const a = apropos(c)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {a.emoji && <span aria-hidden style={{ fontSize: sz(u, 22), display: "block", marginBottom: sz(u, 6) }}>{a.emoji}</span>}
      {a.titre && <p style={{ color: u.G, fontSize: sz(u, 11), fontWeight: 700, margin: `0 0 ${sz(u, 6)}px`, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: u.FONT_B }}>{a.titre}</p>}
      {a.texte && <Texte valeur={a.texte} cle="text" balise="p" multiligne placeholder="Racontez votre histoire…"
        style={{ color: u.TEXT, fontSize: sz(u, 15), lineHeight: 1.75, margin: 0, fontFamily: u.FONT_B, whiteSpace: "pre-wrap" }} />}
    </div>
  )
}

export function EditorAbout({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!apropos(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📖" label="Racontez votre histoire" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} Texte={texteEditable(ctx.canEdit, ctx.edit)} />
}
export function PublicAbout({ content, ctx }: PublicAdapterProps) {
  if (!apropos(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} Texte={texteFige} />
}
