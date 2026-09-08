"use client"
import { InlineEditable } from "../../../InlineEditable"
import { bioViewModel } from "../../models/bio"
import { NoteInvisibleEnLigne } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorBio({ content, ctx }: EditorAdapterProps) {
  const { visible, text, align } = bioViewModel(content)
  const { text: textColor, muted, surfaceStyle, canEdit, edit } = ctx
  return (
    <div style={{ padding: "12px 16px", textAlign: align as any, ...surfaceStyle }}>
      <InlineEditable as="p" editable={canEdit} value={text} placeholder="Votre texte de présentation…" multiline onCommit={edit("text")} style={{ color: textColor, fontSize: 13, lineHeight: 1.7, margin: 0 }} />
      {/* La page ne publie plus le cadre d'une bio vide. On le dit ici sans
          retirer la saisie en place. (Vague 25.) */}
      {!visible && <NoteInvisibleEnLigne muted={muted} />}
    </div>
  )
}
