"use client"
import { languagesViewModel } from "../../models/languages"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorLanguages({ content, ctx }: EditorAdapterProps) {
  const { visible, title, items } = languagesViewModel(content)
  const { text, primary, muted, surfaceStyle } = ctx
  // Lot v166 : l'invite existait, mais en texte nu — sans `role="note"`, elle
  // n'était pas annoncée comme une note, et elle ne disait pas la chose
  // importante : le bloc ne sera pas publié tant qu'il est vide.
  if (!visible) return <div style={{ padding: "10px 16px", ...surfaceStyle }}><BlockEmptyState icon="🗣️" label="Ajoutez une langue" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  return (
    <div style={{ padding: "8px 16px 12px", ...surfaceStyle }}>
      {title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{title}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
            <span style={{ fontSize: 18 }}>{l.flag || "🌐"}</span>
            <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{l.name}</span>
            <span style={{ background: primary + "15", border: `1px solid ${primary}25`, borderRadius: 20, padding: "2px 8px", color: primary, fontSize: 9, fontWeight: 600 }}>{l.level || "Courant"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
