"use client"
import { servicesListViewModel } from "../../models/servicesList"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import type { EditorAdapterProps } from "../../renderTypes"

// Legacy sans état vide éditeur : liste (éventuellement vide) rendue telle quelle.
export function EditorServicesList({ content, ctx }: EditorAdapterProps) {
  const { visible, title, items } = servicesListViewModel(content)
  const { text, muted, surfaceStyle } = ctx
  // Lot v166 : ce bloc disparaît de la page quand il est vide, et l'éditeur
  // ne le disait pas — le commerçant le croyait publié.
  if (!visible) return <div style={{ padding: "10px 16px", ...surfaceStyle }}><BlockEmptyState icon="🧾" label="Ajoutez une prestation" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} /></div>
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      {title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{title}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 9 }}>
            <span style={{ fontSize: 20 }}>{it.icon}</span>
            <div><p style={{ color: text, fontSize: 12.5, fontWeight: 700, margin: 0 }}>{it.name}</p>{it.desc && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{it.desc}</p>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
