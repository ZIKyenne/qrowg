"use client"
import { InlineEditable } from "../../../InlineEditable"
import { testimonialsViewModel } from "../../models/testimonials"
import type { EditorAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"

export function EditorTestimonials({ content, ctx }: EditorAdapterProps) {
  const { items } = testimonialsViewModel(content)
  const { text, muted, primary, surfaceStyle, canEdit, edit } = ctx
  // Les modèles écrivaient l'avis à la place du client (« Marie L. — La meilleure
  // entrecôte de Paris »). Depuis le 10 septembre le bloc arrive vide : il attend
  // de vrais retours, et ne publie rien tant qu'il n'en a pas.
  if (items.length === 0) {
    return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="💬" label="Collez ici un avis reçu" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  }
  return (
    <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 7, ...surfaceStyle }}>
      {items.map((r) => (
        <div key={r.i} style={{ background: primary + "06", border: `1px solid ${primary}12`, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <InlineEditable as="p" editable={canEdit} value={r.name} onCommit={edit(`name${r.i}`)} style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }} />
            <p style={{ color: "#FFD700", fontSize: 11, margin: 0 }}>{"★".repeat(parseInt(r.stars || "5"))}</p>
          </div>
          <p style={{ color: muted, fontSize: 11, margin: 0, fontStyle: "italic" }}>"<InlineEditable as="span" editable={canEdit} value={r.text} multiline onCommit={edit(`text${r.i}`)} />"</p>
        </div>
      ))}
    </div>
  )
}
