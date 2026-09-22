"use client"
import { advantagesViewModel } from "../../models/advantages"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

export function EditorAdvantages({ content, ctx }: EditorAdapterProps) {
  const { visible, title, items } = advantagesViewModel(content)
  const { text, muted, surfaceStyle } = ctx
  // Lot v166 : ce bloc disparaît de la page quand il est vide, et l'éditeur
  // ne le disait pas — le commerçant le croyait publié.
  if (!visible) return <div style={{ padding: "10px 16px", ...surfaceStyle }}><BlockEmptyState icon="✅" label="Ajoutez un avantage" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      {title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{title}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.length === 0
          ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos avantages</p>
          : items.map((adv, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 9 }}>
              <p style={{ color: text, fontSize: 13, margin: 0 }}>{adv}</p>
            </div>
          ))}
      </div>
    </div>
  )
}
