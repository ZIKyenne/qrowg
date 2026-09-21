"use client"
import { brandsViewModel } from "../../models/brands"
import type { PublicAdapterProps } from "../../renderTypes"

export function PublicBrands({ content, ctx }: PublicAdapterProps) {
  const { title, items } = brandsViewModel(content)
  if (items.length === 0) return null
  const { TEXT, MUTED, FONT_B } = ctx
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      {title && <h2 style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</h2>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((b, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 13px" }}>
            {b.icon && <span style={{ fontSize: 16 }}>{b.icon}</span>}
            <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, fontFamily: FONT_B }}>{b.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
