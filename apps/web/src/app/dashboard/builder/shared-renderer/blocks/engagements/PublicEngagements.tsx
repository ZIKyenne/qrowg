"use client"
import { engagementsViewModel } from "../../models/engagements"
import type { PublicAdapterProps } from "../../renderTypes"

export function PublicEngagements({ content, ctx }: PublicAdapterProps) {
  const { title, items } = engagementsViewModel(content)
  if (items.length === 0) return null
  const { TEXT, MUTED, FONT_B } = ctx
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      {title && <h2 style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</h2>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((eng, i) => <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 11 }}><p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.4, fontFamily: FONT_B }}>{eng}</p></li>)}
      </ul>
    </div>
  )
}
